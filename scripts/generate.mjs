import { execFileSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
  "cursor-team-kit/skills/deslop",
  "cursor-team-kit/skills/control-cli",
  "cursor-team-kit/skills/control-ui",
  "cursor-team-kit/LICENSE",
];

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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
  if (target.startsWith("skills/")) return join(roots.adaptedDir, target);
  if (target.startsWith("upstream-guide/")) {
    return join(roots.guideDir, target.slice("upstream-guide/".length));
  }
  throw new GenerateError(
    `Change ${change.id}: target ${target} must start with "skills/" or "upstream-guide/".`,
  );
}

function applyChange(change, roots) {
  const path = resolveTarget(change, roots);
  if (!existsSync(path)) {
    throw new GenerateError(
      `Change ${change.id}: target file ${path} does not exist.`,
    );
  }
  const content = readFileSync(path, "utf8");
  const n = countOccurrences(content, change.anchor);
  if (n !== 1) {
    throw new GenerateError(
      `Change ${change.id}: anchor ${JSON.stringify(change.anchor)} occurs ${n} times in ${path}; expected exactly 1.`,
    );
  }
  let next;
  if (change.op === "replace") {
    next = content.replace(change.anchor, change.text);
  } else if (change.op === "insert-before") {
    next = content.replace(change.anchor, change.text + change.anchor);
  } else if (change.op === "insert-after") {
    next = content.replace(change.anchor, change.anchor + change.text);
  } else {
    throw new GenerateError(`Change ${change.id}: unknown op ${change.op}.`);
  }
  writeFileSync(path, next);
}

/**
 * Generate the adaptation package and the upstream guide copy.
 * sourceDir must be laid out like the upstream cursor-plugins repo.
 */
export function generate({
  sourceDir,
  adaptedDir = join(REPO_ROOT, "adapted"),
  guideDir = join(REPO_ROOT, "docs/upstream-guide"),
  changesPath = join(REPO_ROOT, "adaptation/changes.json"),
} = {}) {
  if (!sourceDir) {
    throw new GenerateError("generate() requires a sourceDir.");
  }
  const { changes } = JSON.parse(readFileSync(changesPath, "utf8"));
  const pstackSkillsDir = join(sourceDir, "pstack/skills");
  const guideSrc = join(sourceDir, "pstack/docs/guide");
  for (const p of [pstackSkillsDir, guideSrc, join(sourceDir, "pstack/LICENSE")]) {
    if (!existsSync(p)) {
      throw new GenerateError(`Source tree is missing ${p}.`);
    }
  }

  const excluded = new Set();
  for (const change of changes) {
    if (change.op !== "exclude") continue;
    const m = /^skills\/([^/]+)$/.exec(change.target);
    if (!m) {
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

  rmSync(adaptedDir, { recursive: true, force: true });
  rmSync(guideDir, { recursive: true, force: true });
  const skillsOut = join(adaptedDir, "skills");
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
  copyFileSync(join(sourceDir, "pstack/LICENSE"), join(adaptedDir, "LICENSE-pstack"));
  copyFileSync(
    join(sourceDir, "cursor-team-kit/LICENSE"),
    join(adaptedDir, "LICENSE-cursor-team-kit"),
  );

  copyTree(guideSrc, guideDir);
  copyFileSync(
    join(sourceDir, "pstack/LICENSE"),
    join(guideDir, "LICENSE-pstack"),
  );
  copyFileSync(
    join(sourceDir, "cursor-team-kit/LICENSE"),
    join(guideDir, "LICENSE-cursor-team-kit"),
  );

  const roots = { adaptedDir, guideDir };
  for (const change of changes) {
    if (change.op === "exclude") continue;
    applyChange(change, roots);
  }

  const skillCount = readdirSync(skillsOut).length;
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
