import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { test } from "node:test";

import {
  DEFAULT_REPO,
  PINNED_COMMIT,
  TEAM_KIT_SKILLS,
  extractSnapshot,
  generate,
} from "../scripts/generate.mjs";

const EXCLUDED = ["make-bot-ui", "tdd", "teach"];
const CHANGED_TARGETS = new Set([
  "skills/poteto-mode/SKILL.md",
  "upstream-guide/README.md",
]);

// Extract the pinned snapshot once for all tests in this file.
const snapshot = extractSnapshot(DEFAULT_REPO, PINNED_COMMIT);

function walkFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(root);
  return out.sort();
}

function assertTreesIdentical(a, b) {
  const filesA = walkFiles(a).map((p) => relative(a, p));
  const filesB = walkFiles(b).map((p) => relative(b, p));
  assert.deepEqual(filesA, filesB);
  for (const rel of filesA) {
    const pa = join(a, rel);
    const pb = join(b, rel);
    assert.deepEqual(
      readFileSync(pa),
      readFileSync(pb),
      `${rel} differs in content`,
    );
    assert.equal(
      statSync(pa).mode & 0o777,
      statSync(pb).mode & 0o777,
      `${rel} differs in mode`,
    );
  }
}

function generateTo(tmp, sourceDir = snapshot) {
  const adaptedDir = join(tmp, "adapted");
  const guideDir = join(tmp, "upstream-guide");
  generate({ sourceDir, adaptedDir, guideDir });
  return { adaptedDir, guideDir };
}

const PI_GUIDE_BLOCK =
  "> **Pi 适配说明（本仓库添加）**：本教程是上游 pstack 原文，针对 Cursor 编写。在 Pi 中：`/poteto-mode` 写作 `/skill:poteto-mode`，其他技能同理写作 `/skill:<名称>`，或在句中输入 `$<名称>`；模型配置使用 `/skill:setup-pstack`；`/loop` 改用 pi-goal 的 `/goal`；云端子代理、Cursor 自动化和持续模式不提供。完整差异见本仓库 `.scratch/pi-pstack-adaptation/spec.md`。\n\n";

test("skill set is upstream pstack skills minus excluded plus team-kit skills", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  const upstream = readdirSync(join(snapshot, "pstack/skills"), {
    withFileTypes: true,
  })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  const expected = [
    ...upstream.filter((n) => !EXCLUDED.includes(n)),
    ...TEAM_KIT_SKILLS,
  ].sort();
  const actual = readdirSync(join(adaptedDir, "skills")).sort();
  assert.deepEqual(actual, expected);
  assert.equal(actual.length, 47);
});

test("poteto-mode frontmatter name is the lowercase slug", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  const head = readFileSync(
    join(adaptedDir, "skills/poteto-mode/SKILL.md"),
    "utf8",
  ).split("---")[1];
  assert.match(head, /name: poteto-mode\n/);
  assert.doesNotMatch(head, /name: Poteto Mode/);
});

test("excluded skills are absent", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  for (const name of EXCLUDED) {
    assert.ok(!existsSync(join(adaptedDir, "skills", name)), name);
  }
});

test("every file not targeted by a change is byte-identical to upstream", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir, guideDir } = generateTo(tmp);
  for (const rel of walkFiles(adaptedDir)) {
    const r = relative(adaptedDir, rel);
    let upstreamPath;
    if (r === "LICENSE-pstack") {
      upstreamPath = join(snapshot, "pstack/LICENSE");
    } else if (r === "LICENSE-cursor-team-kit") {
      upstreamPath = join(snapshot, "cursor-team-kit/LICENSE");
    } else {
      const name = r.split("/")[1];
      upstreamPath = TEAM_KIT_SKILLS.includes(name)
        ? join(snapshot, "cursor-team-kit/skills", name, ...r.split("/").slice(2))
        : join(snapshot, "pstack/skills", name, ...r.split("/").slice(2));
    }
    if (CHANGED_TARGETS.has(r)) {
      assert.notDeepEqual(readFileSync(rel), readFileSync(upstreamPath));
      continue;
    }
    assert.deepEqual(readFileSync(rel), readFileSync(upstreamPath), r);
    assert.equal(
      statSync(rel).mode & 0o777,
      statSync(upstreamPath).mode & 0o777,
      `${r} mode`,
    );
  }
  for (const rel of walkFiles(guideDir)) {
    const r = relative(guideDir, rel);
    if (r === "LICENSE-pstack") {
      assert.deepEqual(readFileSync(rel), readFileSync(join(snapshot, "pstack/LICENSE")));
      continue;
    }
    if (r === "LICENSE-cursor-team-kit") {
      assert.deepEqual(
        readFileSync(rel),
        readFileSync(join(snapshot, "cursor-team-kit/LICENSE")),
      );
      continue;
    }
    const upstreamPath = join(snapshot, "pstack/docs/guide", r);
    if (r === "README.md") {
      const expected =
        PI_GUIDE_BLOCK + readFileSync(upstreamPath, "utf8");
      assert.equal(readFileSync(rel, "utf8"), expected);
      continue;
    }
    assert.deepEqual(readFileSync(rel), readFileSync(upstreamPath), r);
  }
});

test("running the generator twice yields identical trees", () => {
  const t1 = mkdtempSync(join(tmpdir(), "gen-"));
  const t2 = mkdtempSync(join(tmpdir(), "gen-"));
  const a = generateTo(t1);
  const b = generateTo(t2);
  assertTreesIdentical(a.adaptedDir, b.adaptedDir);
  assertTreesIdentical(a.guideDir, b.guideDir);
});

function buildFixture() {
  const src = mkdtempSync(join(tmpdir(), "fixture-src-"));
  const put = (rel, content, mode) => {
    const p = join(src, rel);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, content, mode ? { mode } : undefined);
    if (mode) execFileSync("chmod", [String(mode), p]);
    return p;
  };
  put("pstack/skills/poteto-mode/SKILL.md", "---\nname: Poteto Mode\n---\n");
  put("pstack/skills/make-bot-ui/SKILL.md", "---\nname: make-bot-ui\n---\n");
  put("pstack/skills/tdd/SKILL.md", "---\nname: tdd\n---\n");
  put("pstack/skills/teach/SKILL.md", "---\nname: teach\n---\n");
  put("pstack/docs/guide/README.md", "# The pstack guide\n\nbody\n");
  put("pstack/LICENSE", "pstack license\n");
  for (const name of TEAM_KIT_SKILLS) {
    put(`cursor-team-kit/skills/${name}/SKILL.md`, `---\nname: ${name}\n---\n`);
  }
  put("cursor-team-kit/LICENSE", "team kit license\n");
  return { src, put };
}

test("fixture: happy path generates adapted package", () => {
  const { src } = buildFixture();
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir, guideDir } = generateTo(tmp, src);
  const head = readFileSync(
    join(adaptedDir, "skills/poteto-mode/SKILL.md"),
    "utf8",
  );
  assert.match(head, /name: poteto-mode/);
  assert.ok(!existsSync(join(adaptedDir, "skills/tdd")));
  assert.ok(readFileSync(join(guideDir, "README.md"), "utf8").startsWith(PI_GUIDE_BLOCK));
});

test("fixture: a missing anchor fails and names file and anchor", () => {
  const { src, put } = buildFixture();
  put("pstack/skills/poteto-mode/SKILL.md", "---\nname: Something Else\n---\n");
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  assert.throws(
    () => generateTo(tmp, src),
    (err) => {
      assert.match(err.message, /rename-poteto-mode/);
      assert.match(err.message, /skills\/poteto-mode\/SKILL\.md/);
      assert.match(err.message, /name: Poteto Mode/);
      return true;
    },
  );
});

test("fixture: a duplicated anchor fails and names file and anchor", () => {
  const { src, put } = buildFixture();
  put(
    "pstack/skills/poteto-mode/SKILL.md",
    "---\nname: Poteto Mode\n---\nname: Poteto Mode\n",
  );
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  assert.throws(
    () => generateTo(tmp, src),
    (err) => {
      assert.match(err.message, /rename-poteto-mode/);
      assert.match(err.message, /occurs 2 times/);
      return true;
    },
  );
});

test("fixture: a missing target file fails", () => {
  const { src } = buildFixture();
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  // Drop the guide README so the insert-before target is missing.
  execFileSync("rm", [join(src, "pstack/docs/guide/README.md")]);
  assert.throws(
    () => generateTo(tmp, src),
    /guide-pi-difference-note.*does not exist/s,
  );
});
