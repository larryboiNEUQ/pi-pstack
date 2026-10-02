import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  realpathSync,
  readdirSync,
  symlinkSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../..");
export const ADAPTED_SKILLS = join(REPO_ROOT, "adapted/skills");
export const UPSTREAM_PSTACK = realpathSync(
  join(homedir(), ".agents/repos/cursor-plugins/pstack"),
);
export const AGENTS_SKILLS = join(homedir(), ".agents/skills");
export const PI_AGENT_DIR = join(homedir(), ".pi/agent");
export const PI_AGENT_SKILLS = join(PI_AGENT_DIR, "skills");

export async function resolvePi() {
  let root;
  try {
    root = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
  } catch {
    throw new Error("Cannot locate global npm root; is npm installed?");
  }
  const pkg = join(root, "@earendil-works/pi-coding-agent");
  const entry = join(pkg, "dist/index.js");
  if (!existsSync(entry)) {
    throw new Error(
      `Pi package not found at ${pkg}; cannot run the skill-loading test.`,
    );
  }
  return import(pathToFileURL(entry).href);
}

export function isUnder(child, root) {
  const r = realpathSync(child);
  return r === root || r.startsWith(root + sep);
}

function knownGeneratedSkillRoots() {
  const root = resolve(REPO_ROOT);
  const common = execFileSync("git", ["-C", root, "rev-parse", "--git-common-dir"], {
    encoding: "utf8",
  }).trim();
  return [
    ADAPTED_SKILLS,
    join(dirname(resolve(root, common)), "adapted/skills"),
  ];
}

// Pre-install simulation: drop upstream pstack and matching skill names only
// under this checkout's or its common main checkout's generated roots.
// Unrelated user packages pass through, even when their path is adapted/skills.
export function stageWithoutUpstreamPstack(dir, excludeNames = new Set()) {
  const generatedRoots = knownGeneratedSkillRoots()
    .filter((root) => existsSync(root))
    .map((root) => realpathSync(root));
  const stage = mkdtempSync(join(tmpdir(), "skills-stage-"));
  for (const name of readdirSync(dir)) {
    const entry = join(dir, name);
    try {
      const real = realpathSync(entry);
      if (real === UPSTREAM_PSTACK || real.startsWith(UPSTREAM_PSTACK + sep)) {
        continue;
      }
      if (
        excludeNames.has(name) &&
        generatedRoots.some((root) => real === root || real.startsWith(root + sep))
      ) {
        continue;
      }
    } catch {
      continue; // broken symlink
    }
    symlinkSync(entry, join(stage, name));
  }
  return stage;
}

export const adaptedNames = () => new Set(readdirSync(ADAPTED_SKILLS));

export function assertNoAdaptedProblems(skills, diagnostics, names) {
  const collisions = diagnostics.filter(
    (d) => d.type === "collision" && names.has(d.collision?.name),
  );
  assert.deepEqual(
    collisions,
    [],
    `collisions for adapted skills: ${JSON.stringify(collisions, null, 2)}`,
  );

  const adaptedRealRoot = realpathSync(ADAPTED_SKILLS);
  const adaptedDiagnostics = diagnostics.filter((d) => {
    if (d.type === "collision") {
      return [d.collision?.winnerPath, d.collision?.loserPath].some(
        (p) => p && isUnder(p, adaptedRealRoot),
      );
    }
    return d.path && isUnder(d.path, adaptedRealRoot);
  });
  assert.deepEqual(
    adaptedDiagnostics,
    [],
    `diagnostics for adapted skills: ${JSON.stringify(adaptedDiagnostics, null, 2)}`,
  );

  for (const name of names) {
    const skill = skills.find((s) => s.name === name);
    assert.ok(skill, `adapted skill ${name} not loaded`);
    assert.ok(
      isUnder(skill.filePath, adaptedRealRoot),
      `${name} loaded from ${skill.filePath}, not the adapted package`,
    );
  }
}
