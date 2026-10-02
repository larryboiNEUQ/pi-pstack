import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import {
  ADAPTED_SKILLS,
  REPO_ROOT,
  UPSTREAM_PSTACK,
  stageWithoutUpstreamPstack,
} from "./helpers.mjs";

test("staging preserves an unrelated other/adapted/skills/how link", () => {
  const tmp = mkdtempSync(join(tmpdir(), "helper-skills-"));
  const other = join(tmp, "other/adapted/skills/how");
  mkdirSync(dirname(other), { recursive: true });
  cpSync(join(ADAPTED_SKILLS, "how"), other, { recursive: true });
  const user = join(tmp, "user");
  mkdirSync(user);
  symlinkSync(other, join(user, "how"));
  const staged = stageWithoutUpstreamPstack(user, new Set(["how"]));
  assert.equal(realpathSync(join(staged, "how")), realpathSync(other));
});

test("staging drops only the current and common-main generated how links", () => {
  const common = execFileSync("git", ["-C", REPO_ROOT, "rev-parse", "--git-common-dir"], {
    encoding: "utf8",
  }).trim();
  const mainSkills = join(dirname(resolve(REPO_ROOT, common)), "adapted/skills");
  for (const root of new Set([ADAPTED_SKILLS, mainSkills])) {
    assert.ok(existsSync(join(root, "how")));
    const user = mkdtempSync(join(tmpdir(), "helper-known-"));
    symlinkSync(join(root, "how"), join(user, "how"));
    const staged = stageWithoutUpstreamPstack(user, new Set(["how"]));
    assert.deepEqual(readdirSync(staged), [], root);
  }
});

test("staging still drops upstream links and skips broken links", () => {
  const user = mkdtempSync(join(tmpdir(), "helper-upstream-"));
  symlinkSync(join(UPSTREAM_PSTACK, "skills/how"), join(user, "how"));
  symlinkSync(join(user, "missing"), join(user, "broken"));
  const staged = stageWithoutUpstreamPstack(user);
  assert.deepEqual(readdirSync(staged), []);
});
