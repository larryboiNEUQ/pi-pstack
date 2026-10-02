// Post-install verification, run via `npm run test:installed`.
// Loads the real ~/.agents/skills directory entries through Pi's loadSkills
// (plus ~/.pi/agent/skills via includeDefaults on the real agentDir) and
// asserts every adapted skill resolves into the generated package.
// Note: this exercises directory loading; skills shipped inside configured
// extension packages are not part of this check.
import assert from "node:assert/strict";
import { realpathSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import {
  ADAPTED_SKILLS,
  AGENTS_SKILLS,
  PI_AGENT_DIR,
  REPO_ROOT,
  adaptedNames,
  assertNoAdaptedProblems,
  resolvePi,
} from "./helpers.mjs";

test("installed ~/.agents/skills entries resolve into the adapted package", async () => {
  const { loadSkills } = await resolvePi();
  const { skills, diagnostics } = loadSkills({
    cwd: REPO_ROOT,
    agentDir: PI_AGENT_DIR,
    skillPaths: [AGENTS_SKILLS],
    includeDefaults: true,
  });
  assertNoAdaptedProblems(skills, diagnostics, adaptedNames());

  // The user's own tdd/teach dirs must still be the ones loaded.
  for (const name of ["tdd", "teach"]) {
    const skill = skills.find((s) => s.name === name);
    assert.ok(skill, `user skill ${name} not loaded`);
    assert.equal(
      realpathSync(skill.baseDir),
      realpathSync(join(AGENTS_SKILLS, name)),
      `${name} no longer resolves to the user's own directory`,
    );
  }
  assert.ok(
    !skills.some((s) => s.name === "make-bot-ui"),
    "make-bot-ui is still loadable",
  );
});
