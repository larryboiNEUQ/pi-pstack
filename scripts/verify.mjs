#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, readlinkSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractSnapshot, generate, PINNED_COMMIT } from "./generate.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sdkName = "@earendil-works/pi-coding-agent";
const sdkVersion = "1.1.0";
const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--doctor")) {
  console.error("Usage: node scripts/verify.mjs [--doctor]");
  process.exit(2);
}
const doctor = args[0] === "--doctor";
const run = {
  root,
  upstream: process.env.PSTACK_UPSTREAM_REPO ? resolve(process.env.PSTACK_UPSTREAM_REPO) : null,
  scratch: null,
  evidence: null,
  checks: [],
  versions: { node: process.version, sdk: null, npm: null, git: null },
  pins: { upstream: PINNED_COMMIT, sdk: sdkVersion },
  fileCounts: {},
  passed: false,
  failed: false,
  scratchRemoved: true,
};

function check(name, command, action) {
  const log = run.evidence ? join(run.evidence, `${String(run.checks.length + 1).padStart(2, "0")}-${name}.log`) : null;
  const result = { name, command, exitCode: 0, log };
  run.checks.push(result);
  let output = "";
  try {
    const value = action((text) => { output += text; });
    if (output) output += "OK\n";
    else output = `${value === undefined ? "OK" : JSON.stringify(value, null, 2)}\n`;
    console.log(`PASS ${name}`);
    return value;
  } catch (error) {
    result.exitCode = Number.isInteger(error.exitCode) && error.exitCode !== 0 ? error.exitCode : 1;
    output += `${error.stack ?? error}\n`;
    console.error(`FAIL ${name}: ${error.message}`);
    throw error;
  } finally {
    if (log) writeFileSync(log, `Command: ${JSON.stringify(command)}\n${output}Exit code: ${result.exitCode}\n`);
  }
}

function command(name, executable, argv, env = process.env) {
  return check(name, [executable, ...argv], (log) => {
    const result = spawnSync(executable, argv, {
      cwd: root, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
    });
    log(`stdout:\n${result.stdout ?? ""}\nstderr:\n${result.stderr ?? ""}\n`);
    if (result.error) throw result.error;
    if (result.status !== 0) {
      const error = new Error(`${name} exited ${result.status ?? result.signal}`);
      error.exitCode = result.status ?? 1;
      throw error;
    }
    return result.stdout.trim();
  });
}

function preflight() {
  check("node-version", ["node", "--version"], () => {
    assert.ok(Number(process.versions.node.split(".")[0]) >= 22, "Node >=22 is required");
    return process.version;
  });
  check("local-sdk", ["resolve", sdkName], () => {
    const pkg = JSON.parse(readFileSync(join(root, "node_modules", sdkName, "package.json"), "utf8"));
    assert.equal(pkg.version, sdkVersion, `Run npm ci --ignore-scripts to install local ${sdkName}@${sdkVersion}`);
    assert.ok(existsSync(fileURLToPath(import.meta.resolve(sdkName))), "Local SDK entry is missing");
    run.versions.sdk = pkg.version;
    return { package: pkg.name, version: pkg.version };
  });
  check("upstream-location", ["PSTACK_UPSTREAM_REPO"], () => {
    assert.ok(run.upstream, "Set PSTACK_UPSTREAM_REPO to a local cursor/plugins clone containing the pinned commit");
    assert.ok(lstatSync(run.upstream).isDirectory(), "PSTACK_UPSTREAM_REPO must be a directory");
    return run.upstream;
  });
  run.versions.git = command("git-version", "git", ["--version"]);
  command("upstream-pin", "git", ["-C", run.upstream, "cat-file", "-e", `${PINNED_COMMIT}^{commit}`]);
  command("archive-tools", "tar", ["--version"]);
  check("generated-directories", ["adapted", "docs/upstream-guide"], () => {
    for (const path of ["adapted/skills", "adapted/agents", "adapted/config", "docs/upstream-guide"]) {
      assert.ok(lstatSync(join(root, path)).isDirectory(), `${path} missing; run npm run generate first`);
    }
  });
}

function tree(rootDir, directoryModes = true) {
  if (!existsSync(rootDir)) return [];
  const rows = [];
  function visit(path, rel) {
    const stat = lstatSync(path);
    const row = { path: rel, mode: stat.mode & 0o777 };
    if (stat.isSymbolicLink()) {
      rows.push({ ...row, type: "symlink", target: readlinkSync(path) });
    } else if (stat.isDirectory()) {
      rows.push({ ...(directoryModes ? row : { path: rel }), type: "directory" });
      for (const name of readdirSync(path).sort()) visit(join(path, name), rel ? `${rel}/${name}` : name);
    } else {
      assert.ok(stat.isFile(), `Unsupported entry ${path}`);
      rows.push({ ...row, type: "file", sha256: createHash("sha256").update(readFileSync(path)).digest("hex") });
    }
  }
  visit(rootDir, "");
  return rows;
}

function modelRows(path) {
  const rows = readFileSync(path, "utf8").split(/\r?\n/).filter((line) => line.trim() && !line.startsWith("#"));
  return Object.fromEntries(rows.map((line) => {
    const split = line.indexOf(": ");
    assert.ok(split > 0, `Invalid model row ${line}`);
    return [line.slice(0, split), line.slice(split + 2)];
  }));
}

function npmTest() {
  const candidates = [
    process.env.npm_execpath,
    join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
    join(dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js"),
  ];
  const cli = candidates.find((path) => path && existsSync(path));
  const env = { ...process.env, PSTACK_UPSTREAM_REPO: run.upstream };
  if (cli) {
    run.versions.npm = command("npm-version", process.execPath, [cli, "--version"], env);
    command("npm-test", process.execPath, [cli, "test"], env);
  } else {
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    run.versions.npm = command("npm-version", npm, ["--version"], env);
    command("npm-test", npm, ["test"], env);
  }
}

function verify() {
  preflight();
  run.scratch = mkdtempSync(join(tmpdir(), "pi-pstack-verification-"));
  run.scratchRemoved = false;
  npmTest();
  const snapshot = join(run.scratch, "snapshot");
  const adapted = join(run.scratch, "adapted");
  const guide = join(run.scratch, "upstream-guide");
  check("fresh-generation", ["extractSnapshot", "generate"], () => {
    mkdirSync(snapshot);
    extractSnapshot(run.upstream, PINNED_COMMIT, snapshot);
    return generate({ sourceDir: snapshot, adaptedDir: adapted, guideDir: guide });
  });
  for (const [name, tracked, fresh] of [
    ["adapted-parity", join(root, "adapted"), adapted],
    ["guide-parity", join(root, "docs/upstream-guide"), guide],
  ]) {
    check(name, ["SHA256/mode/symlink tree comparison", tracked, fresh], () => {
      const actual = tree(fresh, false);
      assert.deepEqual(actual, tree(tracked, false), `${name} differs from committed outputs`);
      run.fileCounts[name] = actual.filter((row) => row.type === "file").length;
      return { files: run.fileCounts[name], entries: actual.length };
    });
  }
  check("model-source-seed-parity", ["compare all published role rows"], () => {
    const source = modelRows(join(root, "adaptation/files/skills/poteto-mode/references/default-models.md"));
    const defaults = modelRows(join(adapted, "skills/poteto-mode/references/default-models.md"));
    const seed = modelRows(join(adapted, "config/models.md"));
    const catalog = JSON.parse(readFileSync(join(adapted, "skills/poteto-mode/references/roles.json"), "utf8"));
    assert.deepEqual(Object.keys(source).sort(), catalog.roles.map((role) => role.name).sort());
    assert.equal(Object.keys(source).length, 22, "All 22 published role defaults must be covered");
    assert.deepEqual(defaults, source);
    assert.deepEqual(seed, source);
    return { roles: Object.keys(source).length };
  });
  const home = join(run.scratch, "home");
  mkdirSync(home);
  const installerArgs = [join(root, "scripts/install.mjs"), "--home", home, "--generated-root", adapted];
  const beforeDryRun = tree(run.scratch);
  command("installer-dry-run", process.execPath, installerArgs);
  check("dry-run-no-writes", ["compare scratch before/after dry run"], () => assert.deepEqual(tree(run.scratch), beforeDryRun));
  command("installer-apply", process.execPath, [...installerArgs, "--apply"]);
  const installedFiles = [
    ...["poteto-agent.md", "pstack-readonly.md", "comment-sicko.md"].map((name) => [join(adapted, "agents", name), join(home, ".pi/agent/agents", name)]),
    ...["models.md", "subscriptions.md"].map((name) => [join(adapted, "config", name), join(home, ".pi/agent/pstack", name)]),
  ];
  check("installer-five-files", ["compare three agents and two seeds"], () => {
    assert.equal(tree(home).filter((row) => row.type === "file").length, 5);
    for (const [source, dest] of installedFiles) assert.deepEqual(readFileSync(dest), readFileSync(source), dest);
    return { agents: 3, seeds: 2 };
  });
  const beforeRepeat = tree(home);
  command("installer-repeat", process.execPath, [...installerArgs, "--apply"]);
  check("installer-repeat-identity", ["compare installed bytes/modes/links"], () => assert.deepEqual(tree(home), beforeRepeat));
  for (const name of ["models.md", "subscriptions.md"]) {
    const path = join(home, ".pi/agent/pstack", name);
    writeFileSync(path, `Custom user-owned ${name}\n`);
    chmodSync(path, 0o640);
  }
  const beforeCustom = tree(home);
  command("installer-custom-seeds", process.execPath, [...installerArgs, "--apply"]);
  check("installer-custom-preservation", ["compare custom seeds and unchanged agents"], () => assert.deepEqual(tree(home), beforeCustom));
}

try {
  if (doctor) {
    preflight();
    console.log("Ready. Run npm run verify for full verification.");
  } else {
    const evidenceRoot = join(root, ".artifacts/verification");
    mkdirSync(evidenceRoot, { recursive: true });
    run.evidence = mkdtempSync(join(evidenceRoot, "run-"));
    console.log(`Evidence: ${run.evidence}`);
    verify();
  }
  run.passed = true;
} catch (error) {
  run.failed = true;
  run.error = error.message;
  process.exitCode = 1;
} finally {
  if (!doctor) {
    if (run.scratch) {
      try {
        check("scratch-cleanup", ["remove owned scratch", run.scratch], () => {
          rmSync(run.scratch, { recursive: true, force: true });
          assert.ok(!existsSync(run.scratch), "Scratch still exists after cleanup");
          run.scratchRemoved = true;
        });
      } catch (error) {
        run.passed = false;
        run.failed = true;
        run.cleanupError = error.message;
        process.exitCode = 1;
      }
    }
    if (run.evidence) {
      writeFileSync(join(run.evidence, "summary.json"), `${JSON.stringify(run, null, 2)}\n`);
      console.log(`Summary: ${join(run.evidence, "summary.json")}`);
    }
  }
}
