// Install the Pi host files produced by the generator into the user-level
// Pi directories. Scope is strictly the three new agent definitions and the
// two pstack config seeds; nothing else is touched.
//
//   node scripts/install.mjs            # dry-run, no writes
//   node scripts/install.mjs --apply    # write the five files
//   node scripts/install.mjs --home <dir> --generated-root <dir>
//
// Rules:
// - agent files: destination must be absent or byte-identical; different
//   existing content is an error reported before ANY write
// - config seeds (models.md, subscriptions.md): user-owned; any existing
//   file is preserved, never overwritten or reset
// - all writes use exclusive creation; preflight runs before the first write
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const AGENT_FILES = ["poteto-agent.md", "pstack-readonly.md", "comment-sicko.md"];
const CONFIG_FILES = ["models.md", "subscriptions.md"];

class InstallError extends Error {}

// lstat-based: dangling symlinks count as existing entries.
function pathExists(p) {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function regularSource(p) {
  try {
    const st = lstatSync(p);
    return st.isFile() && !st.isSymbolicLink();
  } catch {
    return false;
  }
}

export function planInstall({ generatedRoot, home }) {
  const actions = [];
  const conflicts = [];
  const missing = [];

  for (const name of AGENT_FILES) {
    const source = join(generatedRoot, "agents", name);
    const dest = join(home, ".pi/agent/agents", name);
    if (!regularSource(source)) {
      missing.push(source);
      continue;
    }
    if (!pathExists(dest)) {
      actions.push({ kind: "create", source, dest });
    } else if (
      regularSource(dest) &&
      readFileSync(dest).equals(readFileSync(source))
    ) {
      actions.push({ kind: "identical", source, dest });
    } else {
      // different content, a symlink (incl. dangling), or a directory
      conflicts.push(dest);
    }
  }
  for (const name of CONFIG_FILES) {
    const source = join(generatedRoot, "config", name);
    const dest = join(home, ".pi/agent/pstack", name);
    if (!regularSource(source)) {
      missing.push(source);
      continue;
    }
    if (!pathExists(dest)) {
      actions.push({ kind: "create", source, dest });
    } else {
      // user-owned config: preserve whatever is there, links included
      actions.push({ kind: "preserve", source, dest });
    }
  }
  return { actions, conflicts, missing };
}

export function install({ generatedRoot, home, apply = false } = {}) {
  if (!generatedRoot) generatedRoot = join(REPO_ROOT, "adapted");
  if (!home) home = homedir();
  const { actions, conflicts, missing } = planInstall({ generatedRoot, home });

  if (missing.length > 0) {
    throw new InstallError(
      `Missing generated source files (run npm run generate first):\n  ${missing.join("\n  ")}`,
    );
  }
  if (conflicts.length > 0) {
    throw new InstallError(
      `Existing files differ from generated sources; refusing to overwrite:\n  ${conflicts.join("\n  ")}`,
    );
  }

  if (apply) {
    for (const action of actions) {
      if (action.kind !== "create") continue;
      mkdirSync(dirname(action.dest), { recursive: true });
      writeFileSync(action.dest, readFileSync(action.source), { flag: "wx" });
    }
  }
  return { actions, applied: apply };
}

function main() {
  const args = process.argv.slice(2);
  let home;
  let generatedRoot;
  let apply = false;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--apply") apply = true;
    else if (args[i] === "--home") home = resolve(args[++i]);
    else if (args[i] === "--generated-root") generatedRoot = resolve(args[++i]);
    else {
      console.error(`Unknown argument: ${args[i]}`);
      process.exit(2);
    }
  }
  try {
    const { actions, applied } = install({ generatedRoot, home, apply });
    for (const a of actions) {
      const verb = { create: "create", identical: "ok", preserve: "preserve" }[a.kind];
      console.log(`${verb.padEnd(8)} ${a.dest}`);
    }
    console.log(applied ? "Applied." : "Dry run; pass --apply to write.");
  } catch (error) {
    console.error(`install failed: ${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
