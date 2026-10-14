import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, readlinkSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const evidence = join(root, ".artifacts/verification");

function snapshot(path) {
  if (!existsSync(path)) return [];
  const stat = lstatSync(path);
  const entry = { mode: stat.mode & 0o777 };
  if (stat.isSymbolicLink()) return { ...entry, link: readlinkSync(path) };
  if (stat.isFile()) return { ...entry, hash: createHash("sha256").update(readFileSync(path)).digest("hex") };
  return { ...entry, entries: readdirSync(path).sort().map((name) => [name, snapshot(join(path, name))]) };
}

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "pstack-cli-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function cli(script, args, cwd, env = process.env) {
  const result = spawnSync(process.execPath, [join(root, "scripts", script), ...args], {
    cwd, env, encoding: "utf8",
  });
  assert.ifError(result.error);
  return result;
}

test("doctor requires an explicit upstream and writes no evidence or home files", (t) => {
  const dir = fixture(t);
  const env = { ...process.env, HOME: dir, USERPROFILE: dir };
  delete env.PSTACK_UPSTREAM_REPO;
  const beforeEvidence = snapshot(evidence);
  const beforeHome = snapshot(dir);
  const result = cli("verify.mjs", ["--doctor"], dir, env);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /PSTACK_UPSTREAM_REPO/);
  assert.deepEqual(snapshot(evidence), beforeEvidence);
  assert.deepEqual(snapshot(dir), beforeHome);
});

test("verification rejects apply and unknown options before writing anything", (t) => {
  const dir = fixture(t);
  const beforeEvidence = snapshot(evidence);
  const beforeHome = snapshot(dir);
  for (const args of [["--apply"], ["--unknown"], ["--doctor", "--apply"]]) {
    const result = cli("verify.mjs", args, dir, { ...process.env, HOME: dir, USERPROFILE: dir });
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /Usage:/);
    assert.deepEqual(snapshot(evidence), beforeEvidence);
    assert.deepEqual(snapshot(dir), beforeHome);
  }
});

test("installer CLI dry run, apply, repeat, custom seeds, and conflict stay isolated", (t) => {
  const dir = fixture(t);
  const generated = join(dir, "generated");
  const home = join(dir, "home");
  const agents = ["poteto-agent.md", "pstack-readonly.md", "comment-sicko.md"];
  const configs = ["models.md", "subscriptions.md"];
  for (const [folder, names] of [["agents", agents], ["config", configs]]) {
    mkdirSync(join(generated, folder), { recursive: true });
    for (const name of names) writeFileSync(join(generated, folder, name), `CLI fixture ${name}\n`);
  }
  const args = ["--home", home, "--generated-root", generated];
  const beforeDryRun = snapshot(dir);
  const dry = cli("install.mjs", args, dir);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /Dry run/);
  assert.deepEqual(snapshot(dir), beforeDryRun);
  const apply = cli("install.mjs", [...args, "--apply"], dir);
  assert.equal(apply.status, 0, apply.stderr);
  assert.match(apply.stdout, /Applied\./);
  assert.deepEqual(readdirSync(join(home, ".pi/agent/agents")).sort(), agents.toSorted());
  assert.deepEqual(readdirSync(join(home, ".pi/agent/pstack")).sort(), configs.toSorted());
  for (const [folder, names, dest] of [["agents", agents, "agents"], ["config", configs, "pstack"]]) {
    for (const name of names) assert.deepEqual(readFileSync(join(home, ".pi/agent", dest, name)), readFileSync(join(generated, folder, name)));
  }
  const beforeRepeat = snapshot(home);
  const repeat = cli("install.mjs", [...args, "--apply"], dir);
  assert.equal(repeat.status, 0, repeat.stderr);
  assert.match(repeat.stdout, /ok\s/);
  assert.match(repeat.stdout, /preserve\s/);
  assert.deepEqual(snapshot(home), beforeRepeat);
  for (const name of configs) {
    const path = join(home, ".pi/agent/pstack", name);
    writeFileSync(path, `User-customized ${name}\n`);
    chmodSync(path, 0o640);
  }
  const beforeCustom = snapshot(home);
  const custom = cli("install.mjs", [...args, "--apply"], dir);
  assert.equal(custom.status, 0, custom.stderr);
  assert.deepEqual(snapshot(home), beforeCustom);
  writeFileSync(join(home, ".pi/agent/agents", agents[0]), "Conflicting agent\n");
  rmSync(join(home, ".pi/agent/agents", agents[1]));
  const beforeConflict = snapshot(dir);
  const conflict = cli("install.mjs", [...args, "--apply"], dir);
  assert.equal(conflict.status, 1, conflict.stderr);
  assert.match(conflict.stderr, /refusing to overwrite/);
  assert.deepEqual(snapshot(dir), beforeConflict);
});
