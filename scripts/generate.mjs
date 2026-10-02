import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { validateRoleCatalog } from "./role-guard.mjs";

export const PINNED_COMMIT = "adf3218ca2f5b9971eedc07a76bef22df7701539";
export const DEFAULT_REPO = join(
  process.env.HOME ?? "~",
  ".agents/repos/cursor-plugins",
);

export const TEAM_KIT_SKILLS = ["deslop", "control-cli", "control-ui"];

const SNAPSHOT_PATHS = [
  "pstack/skills",
  "pstack/docs/guide",
  "pstack/LICENSE",
  "pstack/agents/comment-sicko.md",
  "cursor-team-kit/skills/deslop",
  "cursor-team-kit/skills/control-cli",
  "cursor-team-kit/skills/control-ui",
  "cursor-team-kit/LICENSE",
];

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const DEFAULT_MANIFEST_PATHS = [
  join(REPO_ROOT, "adaptation/changes.json"),
  join(REPO_ROOT, "adaptation/host-changes.json"),
  join(REPO_ROOT, "adaptation/path-changes.json"),
  join(REPO_ROOT, "adaptation/setup-changes.json"),
];

const OPS = new Set([
  "exclude",
  "replace",
  "replace-file",
  "insert-before",
  "insert-after",
  "add-file",
  "copy-upstream",
]);

class GenerateError extends Error {}

/** Extract the needed paths of the pinned upstream commit into a fresh temp dir. */
export function extractSnapshot(
  repoDir = DEFAULT_REPO,
  commit = PINNED_COMMIT,
  destDir = mkdtempSync(join(tmpdir(), "pstack-snapshot-")),
) {
  try {
    execFileSync("git", ["-C", repoDir, "cat-file", "-e", `${commit}^{commit}`], {
      stdio: "pipe",
    });
  } catch {
    throw new GenerateError(
      `Pinned commit ${commit} not found in ${repoDir}. Fetch it there before generating.`,
    );
  }
  const tar = join(destDir, "snapshot.tar");
  const buf = execFileSync(
    "git",
    ["-C", repoDir, "archive", "--format=tar", commit, ...SNAPSHOT_PATHS],
    { maxBuffer: 512 * 1024 * 1024 },
  );
  writeFileSync(tar, buf);
  execFileSync("tar", ["-xf", tar, "-C", destDir]);
  rmSync(tar);
  return destDir;
}

/** Load one or more change manifests. Explicit changesPath overrides the stack. */
export function loadManifests({ changesPath, manifestPaths } = {}) {
  const paths = changesPath
    ? [changesPath]
    : (manifestPaths ?? DEFAULT_MANIFEST_PATHS);
  const changes = [];
  for (const manifestPath of paths.map((p) => resolve(p))) {
    const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (!Array.isArray(parsed.changes)) {
      throw new GenerateError(`${manifestPath} has no "changes" array.`);
    }
    for (const change of parsed.changes) {
      changes.push({ ...change, manifestDir: dirname(manifestPath) });
    }
  }
  const seen = new Set();
  for (const change of changes) {
    if (!change.id) {
      throw new GenerateError("Change without an id in manifest stack.");
    }
    if (seen.has(change.id)) {
      throw new GenerateError(`Duplicate change id "${change.id}".`);
    }
    seen.add(change.id);
    if (!OPS.has(change.op)) {
      throw new GenerateError(`Change ${change.id}: unknown op ${change.op}.`);
    }
    if (
      ["replace", "replace-file", "insert-before", "insert-after"].includes(change.op) &&
      (typeof change.anchor !== "string" || change.anchor.length === 0)
    ) {
      throw new GenerateError(`Change ${change.id}: anchor must be a non-empty string.`);
    }
    if (
      change.op === "replace-file" &&
      (typeof change.expectedSha256 !== "string" || !/^[a-f0-9]{64}$/i.test(change.expectedSha256))
    ) {
      throw new GenerateError(
        `Change ${change.id}: expectedSha256 must be a 64-character SHA-256 hex digest.`,
      );
    }
  }
  return changes;
}

/** Join rel under root, rejecting absolute paths and .. traversal. */
function safeJoin(root, rel, what, id) {
  if (typeof rel !== "string" || rel.length === 0) {
    throw new GenerateError(`Change ${id}: ${what} is empty.`);
  }
  if (rel.startsWith("/") || /^[A-Za-z]:[\\/]/.test(rel)) {
    throw new GenerateError(
      `Change ${id}: ${what} must be relative, got ${rel}.`,
    );
  }
  const p = resolve(root, rel);
  if (p !== root && !p.startsWith(root + sep)) {
    throw new GenerateError(
      `Change ${id}: ${what} escapes its root: ${rel}.`,
    );
  }
  return p;
}

/**
 * Reject any symlink component between root and path (inclusive), so a link
 * copied from the source tree cannot redirect a declared write outside the
 * staging root. Untouched upstream symlinks still survive in copyTree; only
 * declared change targets/sources are checked.
 */
function assertNoSymlinkComponent(root, path, id) {
  const rootReal = resolve(root);
  let cur = path;
  while (cur !== rootReal && cur.startsWith(rootReal + sep)) {
    let st;
    try {
      st = lstatSync(cur);
    } catch (error) {
      if (error && error.code === "ENOENT") {
        cur = dirname(cur); // missing leaf: keep walking the parents
        continue;
      }
      throw error; // fail closed on any other lstat error
    }
    if (st.isSymbolicLink()) {
      throw new GenerateError(
        `Change ${id}: ${cur} is a symlink; refusing to follow it.`,
      );
    }
    cur = dirname(cur);
  }
}

function sortedEntries(dir) {
  return readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
}

function copyTree(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const entry of sortedEntries(src)) {
    const s = join(src, entry.name);
    const d = join(dst, entry.name);
    if (entry.isSymbolicLink()) {
      symlinkSync(readlinkSync(s), d);
    } else if (entry.isDirectory()) {
      copyTree(s, d);
    } else if (entry.isFile()) {
      copyFileSync(s, d);
      chmodSync(d, statSync(s).mode & 0o777);
    }
  }
}

function copyFile(src, dst) {
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  chmodSync(dst, statSync(src).mode & 0o777);
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    count += 1;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return count;
}

function resolveTarget(change, roots) {
  const { target } = change;
  if (typeof target !== "string" || target.length === 0) {
    throw new GenerateError(`Change ${change.id}: target is empty.`);
  }
  for (const prefix of ["skills/", "agents/", "config/"]) {
    if (target.startsWith(prefix)) {
      return safeJoin(roots.adaptedDir, target, "target", change.id);
    }
  }
  if (target.startsWith("upstream-guide/")) {
    return safeJoin(
      roots.guideDir,
      target.slice("upstream-guide/".length),
      "target",
      change.id,
    );
  }
  throw new GenerateError(
    `Change ${change.id}: target ${target} must start with "skills/", "agents/", "config/" or "upstream-guide/".`,
  );
}

function resolveSource(change, base) {
  const src = safeJoin(base, change.source, "source", change.id);
  assertNoSymlinkComponent(base, src, change.id);
  let st;
  try {
    st = lstatSync(src);
  } catch {
    throw new GenerateError(
      `Change ${change.id}: source file ${src} does not exist.`,
    );
  }
  if (st.isSymbolicLink() || !st.isFile()) {
    throw new GenerateError(
      `Change ${change.id}: source ${src} is not a regular file.`,
    );
  }
  return src;
}

function applyChange(change, roots, sourceDir) {
  const path = resolveTarget(change, roots);
  const root = change.target.startsWith("upstream-guide/")
    ? roots.guideDir
    : roots.adaptedDir;
  assertNoSymlinkComponent(root, path, change.id);
  if (change.op === "add-file" || change.op === "copy-upstream") {
    const base = change.op === "add-file" ? change.manifestDir : sourceDir;
    const src = resolveSource(change, base);
    if (existsSync(path) || isLink(path)) {
      throw new GenerateError(
        `Change ${change.id}: target ${path} already exists.`,
      );
    }
    copyFile(src, path);
    return;
  }
  if (!existsSync(path) || isLink(path)) {
    throw new GenerateError(
      `Change ${change.id}: target file ${path} does not exist.`,
    );
  }
  const st = lstatSync(path);
  if (!st.isFile()) {
    throw new GenerateError(
      `Change ${change.id}: target ${path} is not a regular file.`,
    );
  }
  const bytes = readFileSync(path);
  const content = bytes.toString("utf8");
  const n = countOccurrences(content, change.anchor);
  if (n !== 1) {
    throw new GenerateError(
      `Change ${change.id}: anchor ${JSON.stringify(change.anchor)} occurs ${n} times in ${path}; expected exactly 1.`,
    );
  }
  if (change.op === "replace-file") {
    const actualSha256 = createHash("sha256").update(bytes).digest("hex");
    if (actualSha256 !== change.expectedSha256.toLowerCase()) {
      throw new GenerateError(
        `Change ${change.id}: SHA-256 mismatch in ${path}; expected ${change.expectedSha256}, actual ${actualSha256}.`,
      );
    }
    const src = resolveSource(change, change.manifestDir);
    copyFileSync(src, path);
    chmodSync(path, st.mode & 0o7777);
    return;
  }
  let next;
  if (change.op === "replace") {
    next = content.replace(change.anchor, change.text);
  } else if (change.op === "insert-before") {
    next = content.replace(change.anchor, change.text + change.anchor);
  } else {
    next = content.replace(change.anchor, change.anchor + change.text);
  }
  writeFileSync(path, next);
}

function isLink(p) {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

/** Staging dir next to the destination so the final rename stays on one fs. */
function stageBeside(target) {
  const parent = dirname(target);
  mkdirSync(parent, { recursive: true });
  return mkdtempSync(join(parent, `.gen-${basename(target)}-`));
}

/**
 * Swap fully built staging trees into place as a unit: old trees are parked
 * until BOTH swaps succeed; a mid-publish failure rolls back completed moves
 * and the error names the surviving staging/backup paths for inspection.
 */
export function publishAll(pairs) {
  const backups = [];
  const moved = [];
  try {
    for (const { staging, target } of pairs) {
      const backup = `${staging}-old`;
      if (existsSync(target) || isLink(target)) {
        renameSync(target, backup);
        backups.push({ target, backup });
      }
      renameSync(staging, target);
      moved.push({ staging, target });
    }
  } catch (error) {
    // Undo completed moves, then restore parked originals (lstat-aware so
    // a backup that is a symlink still gets restored).
    for (const { staging, target } of moved.slice().reverse()) {
      try {
        renameSync(target, staging);
      } catch { /* staging path may be gone */ }
    }
    for (const { target, backup } of backups.slice().reverse()) {
      try {
        if (existsSync(backup) || isLink(backup)) renameSync(backup, target);
      } catch { /* keep the backup rather than delete it */ }
    }
    const kept = [
      ...moved.map((m) => m.staging),
      ...backups.map((b) => b.backup),
    ]
      .filter((p) => existsSync(p) || isLink(p))
      .join(", ");
    throw new GenerateError(
      `Publish failed: ${error.message}. Surviving trees kept at: ${kept || "none"}.`,
    );
  }
  // All swaps committed. Best-effort cleanup of parked old trees only; a
  // cleanup failure must not roll back or fail a successful publish.
  const keptBackups = [];
  for (const { backup } of backups) {
    try {
      rmSync(backup, { recursive: true, force: true });
    } catch {
      keptBackups.push(backup);
    }
  }
  return { keptBackups };
}

/**
 * Generate the adaptation package and the upstream guide copy.
 * sourceDir must be laid out like the upstream cursor-plugins repo.
 * All changes and sources are validated in staging before publishing, so a
 * validation failure never touches existing outputs. A mid-publish failure
 * attempts to restore the previous trees and, if that itself fails, retains
 * the parked backups and names them in the error.
 */
export function generate({
  sourceDir,
  adaptedDir = join(REPO_ROOT, "adapted"),
  guideDir = join(REPO_ROOT, "docs/upstream-guide"),
  changesPath,
  manifestPaths,
} = {}) {
  if (!sourceDir) {
    throw new GenerateError("generate() requires a sourceDir.");
  }
  const changes = loadManifests({ changesPath, manifestPaths });
  // Output roots must not overlap.
  const a = resolve(adaptedDir);
  const g = resolve(guideDir);
  if (a === g || a.startsWith(g + sep) || g.startsWith(a + sep)) {
    throw new GenerateError(
      `adaptedDir ${a} and guideDir ${g} must not overlap.`,
    );
  }
  const pstackSkillsDir = join(sourceDir, "pstack/skills");
  const guideSrc = join(sourceDir, "pstack/docs/guide");
  for (const p of [pstackSkillsDir, guideSrc, join(sourceDir, "pstack/LICENSE")]) {
    if (!existsSync(p)) {
      throw new GenerateError(`Source tree is missing ${p}.`);
    }
  }
  if (changes.some((change) => change.id === "rewrite-setup-pstack")) {
    validateRoleCatalog({
      sourceDir,
      catalogPath: join(REPO_ROOT, "adaptation/files/skills/poteto-mode/references/roles.json"),
      defaultsPath: join(REPO_ROOT, "adaptation/files/skills/poteto-mode/references/default-models.md"),
    });
  }

  const excluded = new Set();
  for (const change of changes) {
    if (change.op !== "exclude") continue;
    const m = /^skills\/([^/]+)$/.exec(change.target ?? "");
    if (!m || m[1] === "." || m[1] === "..") {
      throw new GenerateError(
        `Change ${change.id}: exclude target must be "skills/<name>", got ${change.target}.`,
      );
    }
    if (!existsSync(join(pstackSkillsDir, m[1]))) {
      throw new GenerateError(
        `Change ${change.id}: skill ${m[1]} does not exist in ${pstackSkillsDir}.`,
      );
    }
    excluded.add(m[1]);
  }

  // Build everything in staging dirs beside the real outputs first, so the
  // final publish is a same-filesystem rename.
  const stageAdapted = stageBeside(adaptedDir);
  let stageGuide;
  try {
    stageGuide = stageBeside(guideDir);
  } catch (error) {
    rmSync(stageAdapted, { recursive: true, force: true });
    throw error;
  }
  try {
    const skillsOut = join(stageAdapted, "skills");
    mkdirSync(skillsOut, { recursive: true });

    for (const entry of sortedEntries(pstackSkillsDir)) {
      if (!entry.isDirectory() || excluded.has(entry.name)) continue;
      copyTree(join(pstackSkillsDir, entry.name), join(skillsOut, entry.name));
    }
    for (const name of TEAM_KIT_SKILLS) {
      const src = join(sourceDir, "cursor-team-kit/skills", name);
      if (!existsSync(src)) {
        throw new GenerateError(`Source tree is missing ${src}.`);
      }
      copyTree(src, join(skillsOut, name));
    }
    copyFile(join(sourceDir, "pstack/LICENSE"), join(stageAdapted, "LICENSE-pstack"));
    copyFile(
      join(sourceDir, "cursor-team-kit/LICENSE"),
      join(stageAdapted, "LICENSE-cursor-team-kit"),
    );

    copyTree(guideSrc, stageGuide);
    copyFile(join(sourceDir, "pstack/LICENSE"), join(stageGuide, "LICENSE-pstack"));
    copyFile(
      join(sourceDir, "cursor-team-kit/LICENSE"),
      join(stageGuide, "LICENSE-cursor-team-kit"),
    );

    const roots = { adaptedDir: stageAdapted, guideDir: stageGuide };
    for (const change of changes) {
      if (change.op === "exclude") continue;
      applyChange(change, roots, sourceDir);
    }
  } catch (error) {
    rmSync(stageAdapted, { recursive: true, force: true });
    rmSync(stageGuide, { recursive: true, force: true });
    throw error;
  }

  // Everything validated; swap staged trees into place as a unit.
  const { keptBackups } = publishAll([
    { staging: stageAdapted, target: adaptedDir },
    { staging: stageGuide, target: guideDir },
  ]);
  if (keptBackups.length > 0) {
    console.warn(
      `publish succeeded but old trees could not be removed: ${keptBackups.join(", ")}`,
    );
  }

  const skillCount = readdirSync(join(adaptedDir, "skills")).length;
  return { adaptedDir, guideDir, skillCount, applied: changes.length };
}

function main() {
  const args = process.argv.slice(2);
  let sourceDir;
  let repoDir = DEFAULT_REPO;
  let commit = PINNED_COMMIT;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--source") sourceDir = resolve(args[++i]);
    else if (args[i] === "--repo") repoDir = resolve(args[++i]);
    else if (args[i] === "--commit") commit = args[++i];
    else {
      console.error(`Unknown argument: ${args[i]}`);
      process.exit(2);
    }
  }
  try {
    const cleanup = !sourceDir;
    if (!sourceDir) sourceDir = extractSnapshot(repoDir, commit);
    try {
      const result = generate({ sourceDir });
      console.log(
        `Generated ${result.skillCount} skills into ${result.adaptedDir} ` +
          `and ${result.guideDir} (${result.applied} changes applied).`,
      );
    } finally {
      if (cleanup) rmSync(sourceDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`generate failed: ${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
