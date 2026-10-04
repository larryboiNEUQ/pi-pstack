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
import { dirname, join, resolve } from "node:path";
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

async function expandQueuedSkill(name, arg) {
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
    await session.steer(`/skill:${name} ${arg}`);
    const queued = session.getSteeringMessages();
    assert.equal(queued.length, 1);
    const skill = resourceLoader.getSkills().skills.find((item) => item.name === name);
    assert.ok(skill, `${name} not visible to the session`);
    assert.equal(
      realpathSync(skill.filePath),
      realpathSync(join(ADAPTED_SKILLS, name, "SKILL.md")),
    );
    return { expanded: queued[0], skill, arg };
  } finally {
    session.clearQueue();
    session.dispose();
  }
}

test("/skill:correct expands via the public SDK queue path", async () => {
  const arg = "pi-pstack-correct-probe";
  const { expanded, skill } = await expandQueuedSkill("correct", arg);
  assert.match(expanded, /^<skill name="correct" location="[^"]+">/);
  assert.ok(expanded.includes(`References are relative to ${skill.baseDir}.`));
  assert.ok(expanded.includes("Keep the rule table"));
  assert.ok(expanded.includes("agent instruction file"));
  assert.ok(
    expanded.includes("../poteto-mode/references/pi-host.md"),
    "correct expansion lost the host pointer",
  );
  assert.ok(expanded.endsWith(arg));
  assert.ok(!expanded.includes("/skill:correct"));
});

test("/skill:benchmark-checklist expands via the public SDK queue path", async () => {
  const arg = "pi-pstack-benchmark-probe";
  const { expanded, skill } = await expandQueuedSkill("benchmark-checklist", arg);
  assert.match(expanded, /^<skill name="benchmark-checklist" location="[^"]+">/);
  assert.ok(expanded.includes(`References are relative to ${skill.baseDir}.`));
  assert.ok(expanded.includes("`nproc`"));
  assert.ok(expanded.includes("`pidstat`"));
  assert.ok(expanded.includes("`strace -c`"));
  assert.ok(
    expanded.includes("../poteto-mode/references/pi-host.md"),
    "benchmark-checklist expansion lost the host pointer",
  );
  assert.ok(expanded.endsWith(arg));
  assert.ok(!expanded.includes("/skill:benchmark-checklist"));
});

function userSkillFile(name) {
  return join(AGENTS_SKILLS, name, "SKILL.md");
}

function snapshotUserBytes() {
  return new Map(
    ["tdd", "teach"].map((name) => {
      const file = userSkillFile(name);
      assert.ok(existsSync(file), file);
      return [file, readFileSync(file)];
    }),
  );
}

function assertUserBytes(before) {
  for (const [file, bytes] of before) {
    assert.deepEqual(readFileSync(file), bytes, file);
  }
}

function linkUserSkills(tmp) {
  const root = join(tmp, "user-skills");
  mkdirSync(root);
  for (const name of ["tdd", "teach"]) {
    symlinkSync(join(AGENTS_SKILLS, name), join(root, name));
  }
  return root;
}

test("prefixed package skills coexist with the original user tdd and teach files", async () => {
  const before = snapshotUserBytes();
  const tmp = mkdtempSync(join(tmpdir(), "pi-coexist-"));
  const userRoot = linkUserSkills(tmp);
  const { loadSkills } = await resolvePi();
  const { skills, diagnostics } = loadSkills({
    cwd: tmp,
    agentDir: join(tmp, "agent"),
    skillPaths: [ADAPTED_SKILLS, userRoot],
    includeDefaults: false,
  });
  assertUserBytes(before);
  assert.deepEqual(diagnostics.filter((d) => d.type === "collision"), []);
  const expected = {
    tdd: userSkillFile("tdd"),
    teach: userSkillFile("teach"),
    "pstack-tdd": join(ADAPTED_SKILLS, "pstack-tdd/SKILL.md"),
    "pstack-teach": join(ADAPTED_SKILLS, "pstack-teach/SKILL.md"),
  };
  for (const [name, file] of Object.entries(expected)) {
    const found = skills.filter((skill) => skill.name === name);
    assert.equal(found.length, 1, name);
    assert.equal(realpathSync(found[0].filePath), realpathSync(file), name);
    assert.deepEqual(readFileSync(found[0].filePath), readFileSync(file));
  }
});

test("directory rename without frontmatter rename collides with the user skills", async () => {
  const before = snapshotUserBytes();
  const tmp = mkdtempSync(join(tmpdir(), "pi-collide-"));
  const userRoot = linkUserSkills(tmp);
  const wrong = join(tmp, "wrong-skills");
  for (const name of ["tdd", "teach"]) {
    const dir = join(wrong, `pstack-${name}`);
    mkdirSync(dir, { recursive: true });
    const text = readFileSync(join(ADAPTED_SKILLS, `pstack-${name}/SKILL.md`), "utf8");
    const renamed = text.replace(`name: pstack-${name}\n`, `name: ${name}\n`);
    assert.notEqual(renamed, text);
    assert.match(renamed, new RegExp(`^name: ${name}$`, "m"));
    writeFileSync(join(dir, "SKILL.md"), renamed);
  }
  const { loadSkills } = await resolvePi();
  const { diagnostics } = loadSkills({
    cwd: tmp,
    agentDir: join(tmp, "agent"),
    skillPaths: [wrong, userRoot],
    includeDefaults: false,
  });
  assertUserBytes(before);
  assert.deepEqual(
    diagnostics.filter((d) => d.type === "collision").map((d) => d.collision?.name).sort(),
    ["tdd", "teach"],
  );
});

test("queued expansion of the four explicit skills comes from the expected files", async () => {
  const before = snapshotUserBytes();
  const tmp = mkdtempSync(join(tmpdir(), "pi-four-"));
  const userRoot = linkUserSkills(tmp);
  const expected = {
    tdd: userSkillFile("tdd"),
    teach: userSkillFile("teach"),
    "pstack-tdd": join(ADAPTED_SKILLS, "pstack-tdd/SKILL.md"),
    "pstack-teach": join(ADAPTED_SKILLS, "pstack-teach/SKILL.md"),
  };
  const pi = await resolvePi();
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
    noSkills: true,
    additionalSkillPaths: [ADAPTED_SKILLS, userRoot],
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
    for (const [name, file] of Object.entries(expected)) {
      const arg = `probe-${name}`;
      session.clearQueue();
      await session.steer(`/skill:${name} ${arg}`);
      const queued = session.getSteeringMessages();
      assert.equal(queued.length, 1, name);
      const expanded = queued[0];
      const loc = /location="([^"]+)"/.exec(expanded);
      assert.ok(loc, name);
      assert.equal(realpathSync(loc[1]), realpathSync(file), name);
      const body = readFileSync(file, "utf8").replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
      assert.ok(expanded.includes(body.slice(0, 60)), name);
      assert.ok(expanded.endsWith(arg), name);
      assert.equal(expanded.includes(`/skill:${name}`), false, name);
    }
  } finally {
    session.clearQueue();
    session.dispose();
  }
  assertUserBytes(before);
});

test("tutorial links and the bug-fix reference resolve to loaded namespaced skills", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "pi-links-"));
  const { loadSkills } = await resolvePi();
  const { skills } = loadSkills({
    cwd: tmp,
    agentDir: join(tmp, "agent"),
    skillPaths: [ADAPTED_SKILLS],
    includeDefaults: false,
  });
  const byName = Object.fromEntries(skills.map((skill) => [skill.name, skill]));
  const links = [
    ["03-understand.md", "../../adapted/skills/pstack-teach/SKILL.md", "pstack-teach"],
    ["05-build-and-clean.md", "../../adapted/skills/pstack-tdd/SKILL.md", "pstack-tdd"],
  ];
  for (const [file, href, name] of links) {
    const page = join(REPO_ROOT, "docs/upstream-guide", file);
    const text = readFileSync(page, "utf8");
    const token = `/${name}/SKILL.md)`;
    const end = text.indexOf(token);
    assert.ok(end >= 0, file);
    const open = text.lastIndexOf("(", end);
    const actual = text.slice(open + 1, end + token.length - 1);
    const dest = resolve(dirname(page), actual);
    assert.equal(realpathSync(dest), realpathSync(byName[name].filePath));
    assert.equal(actual, href, file);
    assert.equal(text.includes(`../../skills/${name.slice("pstack-".length)}/SKILL.md`), false);
  }
  const bugfix = readFileSync(join(ADAPTED_SKILLS, "poteto-mode/playbooks/bug-fix.md"), "utf8");
  assert.match(bugfix, /\*\*pstack-tdd\*\*/);
  assert.doesNotMatch(bugfix, /\*\*tdd\*\*/);
  assert.equal(
    realpathSync(byName["pstack-tdd"].filePath),
    realpathSync(join(ADAPTED_SKILLS, "pstack-tdd/SKILL.md")),
  );
});
