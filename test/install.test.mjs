import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { install } from "../scripts/install.mjs";

const AGENTS = ["poteto-agent.md", "pstack-readonly.md", "comment-sicko.md"];
const CONFIGS = ["models.md", "subscriptions.md"];

function buildFixture() {
  const root = mkdtempSync(join(tmpdir(), "install-fix-"));
  const generatedRoot = join(root, "adapted");
  const home = join(root, "home");
  for (const name of [...AGENTS]) {
    const p = join(generatedRoot, "agents", name);
    mkdirSync(join(generatedRoot, "agents"), { recursive: true });
    writeFileSync(p, `generated ${name}\n`);
  }
  for (const name of CONFIGS) {
    const p = join(generatedRoot, "config", name);
    mkdirSync(join(generatedRoot, "config"), { recursive: true });
    writeFileSync(p, `generated ${name}\n`);
  }
  return { root, generatedRoot, home };
}

function destPaths(home) {
  return [
    ...AGENTS.map((n) => join(home, ".pi/agent/agents", n)),
    ...CONFIGS.map((n) => join(home, ".pi/agent/pstack", n)),
  ];
}

test("dry-run reports the plan and writes nothing", () => {
  const { generatedRoot, home } = buildFixture();
  const { actions, applied } = install({ generatedRoot, home, apply: false });
  assert.equal(applied, false);
  assert.equal(actions.filter((a) => a.kind === "create").length, 5);
  for (const dest of destPaths(home)) {
    assert.ok(!existsSync(dest), `${dest} should not exist after dry-run`);
  }
});

test("--apply creates all five files with identical bytes", () => {
  const { generatedRoot, home } = buildFixture();
  install({ generatedRoot, home, apply: true });
  for (const name of AGENTS) {
    assert.equal(
      readFileSync(join(home, ".pi/agent/agents", name), "utf8"),
      readFileSync(join(generatedRoot, "agents", name), "utf8"),
    );
  }
  for (const name of CONFIGS) {
    assert.equal(
      readFileSync(join(home, ".pi/agent/pstack", name), "utf8"),
      readFileSync(join(generatedRoot, "config", name), "utf8"),
    );
  }
});

test("user-modified config is preserved on rerun", () => {
  const { generatedRoot, home } = buildFixture();
  install({ generatedRoot, home, apply: true });
  const userTable = join(home, ".pi/agent/pstack/models.md");
  writeFileSync(userTable, "user edited table\n");
  const { actions } = install({ generatedRoot, home, apply: true });
  assert.equal(readFileSync(userTable, "utf8"), "user edited table\n");
  assert.ok(
    actions.find((a) => a.dest === userTable).kind === "preserve",
  );
});

test("a conflicting existing agent aborts before any write", () => {
  const { generatedRoot, home } = buildFixture();
  const agentDir = join(home, ".pi/agent/agents");
  mkdirSync(agentDir, { recursive: true });
  writeFileSync(join(agentDir, "poteto-agent.md"), "user's own agent\n");
  assert.throws(
    () => install({ generatedRoot, home, apply: true }),
    /poteto-agent\.md/,
  );
  for (const dest of destPaths(home)) {
    if (dest.endsWith("poteto-agent.md")) continue;
    assert.ok(!existsSync(dest), `${dest} must not have been written`);
  }
});

test("identical existing files and unrelated files are left alone", () => {
  const { generatedRoot, home } = buildFixture();
  install({ generatedRoot, home, apply: true });
  const other = join(home, ".pi/agent/agents/existing-agent.md");
  writeFileSync(other, "pre-existing\n");
  const { actions } = install({ generatedRoot, home, apply: true });
  assert.equal(readFileSync(other, "utf8"), "pre-existing\n");
  assert.equal(actions.filter((a) => a.kind === "identical").length, 3);
  assert.equal(actions.filter((a) => a.kind === "preserve").length, 2);
  assert.equal(
    readdirSync(join(home, ".pi/agent/agents")).sort().length,
    AGENTS.length + 1,
  );
});

test("missing generated sources fail before any write", () => {
  const { root, home } = buildFixture();
  const emptyRoot = join(root, "empty");
  mkdirSync(emptyRoot);
  assert.throws(
    () => install({ generatedRoot: emptyRoot, home, apply: true }),
    /Missing generated source files/,
  );
});

test("a directory passed as an agent source fails before any write", () => {
  const { generatedRoot, home } = buildFixture();
  execFileSync("rm", [join(generatedRoot, "agents/poteto-agent.md")]);
  mkdirSync(join(generatedRoot, "agents/poteto-agent.md"));
  assert.throws(
    () => install({ generatedRoot, home, apply: true }),
    /Missing generated source files/,
  );
  for (const dest of destPaths(home)) {
    assert.ok(!existsSync(dest), `${dest} must not have been written`);
  }
});

test("a dangling symlink at an agent destination is a conflict, zero writes", () => {
  const { generatedRoot, home } = buildFixture();
  const agentDir = join(home, ".pi/agent/agents");
  mkdirSync(agentDir, { recursive: true });
  const link = join(agentDir, "poteto-agent.md");
  symlinkSync(join(home, "nonexistent-target"), link);
  assert.throws(
    () => install({ generatedRoot, home, apply: true }),
    /poteto-agent\.md/,
  );
  // dangling link untouched; nothing else written
  assert.equal(readlinkSync(link), join(home, "nonexistent-target"));
  for (const dest of destPaths(home)) {
    if (dest === link) continue;
    assert.ok(!existsSync(dest), `${dest} must not have been written`);
  }
});

test("a dangling symlink at a config destination is preserved", () => {
  const { generatedRoot, home } = buildFixture();
  const confDir = join(home, ".pi/agent/pstack");
  mkdirSync(confDir, { recursive: true });
  const link = join(confDir, "models.md");
  symlinkSync(join(home, "absent-user-file"), link);
  const { actions } = install({ generatedRoot, home, apply: true });
  assert.equal(actions.find((a) => a.dest === link).kind, "preserve");
  assert.ok(lstatSync(link).isSymbolicLink());
  assert.equal(readlinkSync(link), join(home, "absent-user-file"));
});
