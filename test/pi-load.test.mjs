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
import { join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const ADAPTED_SKILLS = join(REPO_ROOT, "adapted/skills");
const UPSTREAM_PSTACK = realpathSync(
  join(homedir(), ".agents/repos/cursor-plugins/pstack"),
);
const AGENTS_SKILLS = join(homedir(), ".agents/skills");
const PI_AGENT_SKILLS = join(homedir(), ".pi/agent/skills");

function resolvePi() {
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

function isUnder(child, root) {
  const r = realpathSync(child);
  return r === root || r.startsWith(root + sep);
}

// Stage a copy of a skills dir as symlinks, dropping entries whose real
// target is the old upstream pstack install (the install step replaces them
// with links into the adapted package).
function stageWithoutUpstreamPstack(dir) {
  const stage = mkdtempSync(join(tmpdir(), "skills-stage-"));
  for (const name of readdirSync(dir)) {
    const entry = join(dir, name);
    try {
      if (isUnder(entry, UPSTREAM_PSTACK)) continue;
    } catch {
      continue; // broken symlink
    }
    symlinkSync(entry, join(stage, name));
  }
  return stage;
}

test("Pi loads the adapted package with no pstack name collisions", async () => {
  assert.ok(
    existsSync(ADAPTED_SKILLS),
    "adapted/skills missing; run `npm run generate` first",
  );
  const { loadSkills } = await resolvePi();
  const staged = stageWithoutUpstreamPstack(AGENTS_SKILLS);
  const { skills, diagnostics } = loadSkills({
    cwd: REPO_ROOT,
    agentDir: join(homedir(), ".pi/agent"),
    skillPaths: [ADAPTED_SKILLS, staged, PI_AGENT_SKILLS],
    includeDefaults: false,
  });

  const adaptedNames = new Set(readdirSync(ADAPTED_SKILLS));
  const collisions = diagnostics.filter(
    (d) => d.type === "collision" && adaptedNames.has(d.collision?.name),
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

  const poteto = skills.find((s) => s.name === "poteto-mode");
  assert.ok(poteto, "poteto-mode was not loaded");
  assert.equal(
    realpathSync(poteto.filePath),
    realpathSync(join(ADAPTED_SKILLS, "poteto-mode/SKILL.md")),
  );
  assert.equal(
    realpathSync(poteto.baseDir),
    realpathSync(join(ADAPTED_SKILLS, "poteto-mode")),
  );

  for (const name of adaptedNames) {
    const skill = skills.find((s) => s.name === name);
    assert.ok(skill, `adapted skill ${name} not loaded`);
    assert.ok(
      isUnder(skill.filePath, adaptedRealRoot),
      `${name} loaded from ${skill.filePath}, not the adapted package`,
    );
  }
});
