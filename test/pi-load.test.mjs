import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  ADAPTED_SKILLS,
  AGENTS_SKILLS,
  PI_AGENT_DIR,
  PI_AGENT_SKILLS,
  REPO_ROOT,
  adaptedNames,
  assertNoAdaptedProblems,
  resolvePi,
  stageWithoutUpstreamPstack,
} from "./helpers.mjs";

test("Pi loads the adapted package with no pstack name collisions (staged post-install state)", async () => {
  assert.ok(
    existsSync(ADAPTED_SKILLS),
    "adapted/skills missing; run `npm run generate` first",
  );
  const { loadSkills } = await resolvePi();
  const staged = stageWithoutUpstreamPstack(AGENTS_SKILLS, adaptedNames());
  const { skills, diagnostics } = loadSkills({
    cwd: REPO_ROOT,
    agentDir: PI_AGENT_DIR,
    skillPaths: [ADAPTED_SKILLS, staged, PI_AGENT_SKILLS],
    includeDefaults: false,
  });
  assertNoAdaptedProblems(skills, diagnostics, adaptedNames());
});

test("external tdd and teach resolve to real user paths outside the package", async () => {
  for (const name of ["tdd", "teach"]) {
    const shared = join(AGENTS_SKILLS, name);
    const agentScoped = join(PI_AGENT_SKILLS, name);
    assert.ok(
      existsSync(shared) || existsSync(agentScoped),
      `host must advertise an external ${name} skill at ${shared} or ${agentScoped}`,
    );
  }
  const staged = stageWithoutUpstreamPstack(AGENTS_SKILLS, adaptedNames());
  const { loadSkills } = await resolvePi();
  const { skills, diagnostics } = loadSkills({
    cwd: REPO_ROOT,
    agentDir: PI_AGENT_DIR,
    skillPaths: [ADAPTED_SKILLS, staged, PI_AGENT_SKILLS],
    includeDefaults: false,
  });
  for (const name of ["tdd", "teach"]) {
    const found = skills.filter((s) => s.name === name);
    assert.equal(found.length, 1, `${name} must resolve exactly once`);
    const skill = found[0];
    assert.ok(
      !realpathSync(skill.baseDir).startsWith(realpathSync(ADAPTED_SKILLS) + "/"),
      `${name} must not resolve inside the adapted package`,
    );
    assert.ok(readFileSync(skill.filePath, "utf8").length > 0,
      `${name} SKILL.md must be readable`);
    assert.ok(
      !diagnostics.some(
        (d) => d.type === "collision" && d.collision?.name === name,
      ),
      `${name} must not produce a collision diagnostic`,
    );
  }
});

test("Pi reports a how collision from an unrelated other/adapted/skills package", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "pi-collision-"));
  const other = join(tmp, "other/adapted/skills/how");
  mkdirSync(join(tmp, "other/adapted/skills"), { recursive: true });
  cpSync(join(ADAPTED_SKILLS, "how"), other, { recursive: true });
  const user = join(tmp, "user");
  mkdirSync(user);
  symlinkSync(other, join(user, "how"));
  const staged = stageWithoutUpstreamPstack(user, adaptedNames());
  const { loadSkills } = await resolvePi();
  const { diagnostics } = loadSkills({
    cwd: tmp,
    agentDir: join(tmp, "agent"),
    skillPaths: [ADAPTED_SKILLS, staged],
    includeDefaults: false,
  });
  assert.ok(diagnostics.some((diagnostic) =>
    diagnostic.type === "collision" && diagnostic.collision?.name === "how"
  ), `expected a how collision, got ${JSON.stringify(diagnostics)}`);
});

// Offline SDK expansion probe: session.steer() expands /skill: commands into
// queued steering messages without any provider call (the session is never
// prompted). This is NOT a live interactive smoke test.
test("/skill:poteto-mode expands via the public SDK queue path", async () => {
  const pi = await resolvePi();
  const staged = stageWithoutUpstreamPstack(AGENTS_SKILLS, adaptedNames());

  const tmp = mkdtempSync(join(tmpdir(), "pi-sdk-"));
  const agentDir = join(tmp, "agent");
  writeFileSync(join(tmp, "auth.json"), "{}");
  const modelRuntime = await pi.ModelRuntime.create({
    authPath: join(tmp, "auth.json"),
    modelsPath: null,
    allowModelNetwork: false,
    refreshOnCreate: false,
  });
  const settingsManager = pi.SettingsManager.inMemory();
  const resourceLoader = new pi.DefaultResourceLoader({
    cwd: tmp,
    agentDir,
    settingsManager,
    noExtensions: true,
    // noSkills keeps additionalSkillPaths but drops extension/package
    // enabled paths (where the globally installed links would otherwise
    // enter and shadow this package's generated skills).
    noSkills: true,
    additionalSkillPaths: [ADAPTED_SKILLS, staged, PI_AGENT_SKILLS],
  });
  await resourceLoader.reload();
  const { session } = await pi.createAgentSession({
    cwd: tmp,
    agentDir,
    modelRuntime,
    settingsManager,
    sessionManager: pi.SessionManager.inMemory(tmp),
    resourceLoader,
    noTools: "all",
  });

  try {
    const arg = "pi-pstack-expansion-probe";
    await session.steer(`/skill:poteto-mode ${arg}`);
    const queued = session.getSteeringMessages();
    assert.equal(queued.length, 1);
    const expanded = queued[0];

    const poteto = resourceLoader
      .getSkills()
      .skills.find((s) => s.name === "poteto-mode");
    assert.ok(poteto, "poteto-mode not visible to the session");
    assert.equal(
      realpathSync(poteto.filePath),
      realpathSync(join(ADAPTED_SKILLS, "poteto-mode/SKILL.md")),
      "poteto-mode resolved outside the generated package",
    );
    assert.equal(
      realpathSync(poteto.baseDir),
      realpathSync(join(ADAPTED_SKILLS, "poteto-mode")),
    );

    assert.match(
      expanded,
      /^<skill name="poteto-mode" location="[^"]+">/,
    );
    assert.ok(
      expanded.includes(`References are relative to ${poteto.baseDir}.`),
      "missing baseDir note",
    );
    assert.ok(
      expanded.includes("## Playbooks"),
      "expanded body lost the upstream playbook section",
    );
    assert.ok(expanded.endsWith(arg), "user argument not appended");
    assert.ok(
      !expanded.includes("/skill:poteto-mode"),
      "literal /skill: command left unexpanded",
    );
  } finally {
    session.clearQueue();
    session.dispose();
  }
});
