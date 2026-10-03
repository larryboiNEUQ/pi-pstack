import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { test } from "node:test";

import { validateRoleCatalog } from "../scripts/role-guard.mjs";
import {
  DEFAULT_MANIFEST_PATHS,
  DEFAULT_REPO,
  PINNED_COMMIT,
  TEAM_KIT_SKILLS,
  extractSnapshot,
  generate,
  loadManifests,
  publishAll,
} from "../scripts/generate.mjs";

const EXCLUDED = ["make-bot-ui", "tdd", "teach"];

// Extract the pinned snapshot once for all tests in this file.
const snapshot = extractSnapshot(DEFAULT_REPO, PINNED_COMMIT);
const defaultChanges = loadManifests({});
const adaptationDir = dirname(DEFAULT_MANIFEST_PATHS[0]);
const setupChange = JSON.parse(
  readFileSync(join(adaptationDir, "setup-changes.json"), "utf8"),
).changes[0];
const setupSource = join(adaptationDir, setupChange.source);
const upstreamSetup = join(snapshot, "pstack", setupChange.target);
const CHANGED_TARGETS = new Set(
  defaultChanges.filter((c) => c.op !== "exclude").map((c) => c.target),
);

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

function assertChangeOccursOnce(content, change) {
  const occurrences = content.split(change.text).length - 1;
  assert.equal(occurrences, 1, `${change.id}: text occurs ${occurrences} times in ${change.target}`);
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

function treeFingerprint(root) {
  return walkFiles(root)
    .map((p) => {
      const rel = relative(root, p);
      const s = statSync(p);
      return `${rel}:${s.mode & 0o777}:${readFileSync(p).length}:${execFileSync("shasum", ["-a", "256", p], { encoding: "utf8" }).slice(0, 16)}`;
    })
    .join("\n");
}

function generateTo(tmp, sourceDir = snapshot, extra = {}) {
  const adaptedDir = join(tmp, "adapted");
  const guideDir = join(tmp, "upstream-guide");
  generate({ sourceDir, adaptedDir, guideDir, ...extra });
  return { adaptedDir, guideDir };
}

const PI_GUIDE_BLOCK =
  "> **Pi 适配说明（本仓库添加）**：本教程是上游 pstack 原文，针对 Cursor 编写。Pi 安装不同：先在本仓库运行 `npm run generate`，将 `adapted/skills/` 下的技能链接到 `~/.agents/skills/`（先检查同名冲突并备份），再用 `node scripts/install.mjs` 预检，经授权后加 `--apply` 安装三个 agent 与配置种子；不要在 Pi 中使用 Cursor 的 `/add-plugin pstack`。`/poteto-mode` 写作 `/skill:poteto-mode`，其他技能同理写作 `/skill:<名称>`，或在句中输入 `$<名称>`；模型配置使用 `/skill:setup-pstack`；`/loop` 改用 pi-goal 的 `/goal`；云端子代理、Cursor 自动化和持续模式不提供。完整差异见本仓库 `.scratch/pi-pstack-adaptation/spec.md`。\n\n";

function upstreamPathFor(rel) {
  if (rel === "LICENSE-pstack") return join(snapshot, "pstack/LICENSE");
  if (rel === "LICENSE-cursor-team-kit") {
    return join(snapshot, "cursor-team-kit/LICENSE");
  }
  const parts = rel.split("/");
  if (parts[0] === "skills") {
    const name = parts[1];
    return TEAM_KIT_SKILLS.includes(name)
      ? join(snapshot, "cursor-team-kit/skills", ...parts.slice(1))
      : join(snapshot, "pstack/skills", ...parts.slice(1));
  }
  if (parts[0] === "agents") {
    return join(snapshot, "pstack", rel); // agents/comment-sicko.md
  }
  return null; // config/ and other repo-authored files
}

function frontmatter(path) {
  const text = readFileSync(path, "utf8");
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  assert.ok(m, `no frontmatter in ${path}`);
  return m[1];
}

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
  const head = frontmatter(join(adaptedDir, "skills/poteto-mode/SKILL.md"));
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

test("generated host reference resolves external tdd/teach via catalog with fallback paths", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  const host = readFileSync(
    join(adaptedDir, "skills/poteto-mode/references/pi-host.md"),
    "utf8",
  );
  assert.ok(
    host.includes("`tdd` and `teach` are intentionally external"),
    "host text must name tdd and teach as external",
  );
  assert.ok(
    host.includes("advertised skill catalog"),
    "host text must require the host's skill catalog",
  );
  assert.ok(
    host.includes("~/.agents/skills/<name>/SKILL.md"),
    "host text must include the shared skills fallback path",
  );
  assert.ok(
    host.includes("~/.pi/agent/skills/<name>/SKILL.md"),
    "host text must include the pi-agent skills fallback path",
  );
  for (const name of ["tdd", "teach"]) {
    assert.ok(
      !existsSync(join(adaptedDir, "skills", name)),
      `${name} must remain absent from the adapted package`,
    );
  }
});

test("generated host cross-judge compares root-main including nested delegates", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  const host = readFileSync(
    join(adaptedDir, "skills/poteto-mode/references/pi-host.md"),
    "utf8",
  );
  assert.ok(
    host.includes(
      "different family from the root-main conversation",
    ),
    "cross-judge text must compare against root-main",
  );
  assert.ok(
    host.includes("including inside nested delegates"),
    "cross-judge text must cover nested delegates",
  );
  assert.ok(
    host.includes("Do not compare only with the immediate delegate's role model"),
    "cross-judge text must reject the immediate delegate as the reference",
  );
  assert.ok(
    host.includes("return the selection to the root"),
    "cross-judge text must return to the root when root-main is missing",
  );
});

test("guide preface covers Pi installation differences only", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { guideDir } = generateTo(tmp);
  const readme = readFileSync(join(guideDir, "README.md"), "utf8");
  for (const needle of [
    "npm run generate",
    "~/.agents/skills/",
    "node scripts/install.mjs",
    "--apply",
  ]) {
    assert.ok(readme.includes(needle), `guide preface missing ${needle}`);
  }
  assert.ok(
    readme.includes("/add-plugin"),
    "guide preface must prohibit Cursor's /add-plugin",
  );
  const upstream = readFileSync(
    join(snapshot, "pstack/docs/guide/README.md"),
    "utf8",
  );
  assert.equal(readme, PI_GUIDE_BLOCK + upstream);
});

test("every declared text change lands exactly once", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir, guideDir } = generateTo(tmp);
  for (const change of defaultChanges) {
    if (["exclude", "add-file", "copy-upstream"].includes(change.op)) continue;
    const base = change.target.startsWith("upstream-guide/")
      ? join(guideDir, change.target.slice("upstream-guide/".length))
      : join(adaptedDir, change.target);
    if (change.op === "replace-file") {
      assert.deepEqual(
        readFileSync(base),
        readFileSync(join(change.manifestDir, change.source)),
        change.id,
      );
      continue;
    }
    const content = readFileSync(base, "utf8");
    assertChangeOccursOnce(content, change);
  }
});

test("every file not targeted by a change is byte-identical to upstream", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir, guideDir } = generateTo(tmp);
  for (const rel of walkFiles(adaptedDir)) {
    const r = relative(adaptedDir, rel);
    const upstreamPath = upstreamPathFor(r);
    if (CHANGED_TARGETS.has(r)) {
      if (upstreamPath && existsSync(upstreamPath)) {
        assert.notDeepEqual(readFileSync(rel), readFileSync(upstreamPath));
      }
      continue;
    }
    assert.ok(upstreamPath, `${r} is neither a change target nor upstream`);
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
      const expected = PI_GUIDE_BLOCK + readFileSync(upstreamPath, "utf8");
      assert.equal(readFileSync(rel, "utf8"), expected);
      continue;
    }
    assert.deepEqual(readFileSync(rel), readFileSync(upstreamPath), r);
  }
});

test("add-file outputs are byte-identical to their declared sources", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  for (const change of defaultChanges) {
    if (change.op !== "add-file") continue;
    const src = join(change.manifestDir, change.source);
    const dst = join(adaptedDir, change.target);
    assert.deepEqual(readFileSync(dst), readFileSync(src), change.id);
  }
});

test("comment-sicko agent is upstream verbatim plus the name delta", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  const upstream = readFileSync(
    join(snapshot, "pstack/agents/comment-sicko.md"),
    "utf8",
  );
  const expected = upstream.replace(
    "name: Comment Sicko",
    "name: comment-sicko\nallowed_subagents: pstack-readonly, poteto-agent",
  );
  const generated = readFileSync(
    join(adaptedDir, "agents/comment-sicko.md"),
    "utf8",
  );
  assert.equal(generated, expected);
  // body below the frontmatter is byte-identical to upstream
  const stripFm = (s) => s.replace(/^---\n[\s\S]*?\n---\n/, "");
  assert.equal(stripFm(generated), stripFm(upstream));
});

test("nested delegation: poteto-agent allowlist exact, readonly none", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  const fm = frontmatter(join(adaptedDir, "agents/poteto-agent.md"));
  const m = /^allowed_subagents: (.*)$/m.exec(fm);
  assert.ok(m, "poteto-agent missing allowed_subagents");
  assert.deepEqual(
    m[1].split(",").map((s) => s.trim()).sort(),
    ["comment-sicko", "poteto-agent", "pstack-readonly"],
  );
  const ro = frontmatter(join(adaptedDir, "agents/pstack-readonly.md"));
  assert.doesNotMatch(ro, /^allowed_subagents:/m);
});

test("agent definitions carry no model or thinking pins", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  for (const name of ["poteto-agent", "pstack-readonly", "comment-sicko"]) {
    const fm = frontmatter(join(adaptedDir, "agents", `${name}.md`));
    assert.doesNotMatch(fm, /^(model|thinking):/m, name);
  }
});

test("root-main fallback payloads are exact copies of the frozen lead sources", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  for (const rel of [
    "agents/poteto-agent.md",
    "skills/poteto-mode/references/pi-host.md",
  ]) {
    assert.deepEqual(
      readFileSync(join(adaptedDir, rel)),
      readFileSync(join(adaptationDir, "files", rel)),
      rel,
    );
  }
  assert.doesNotMatch(
    frontmatter(join(adaptedDir, "agents/poteto-agent.md")),
    /^(model|thinking):/m,
  );
});

test("pstack-readonly has the exact read-only tool allowlist and no extensions", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  const fm = frontmatter(join(adaptedDir, "agents/pstack-readonly.md"));
  assert.match(fm, /^tools: read, bash, grep, find, ls$/m);
  assert.match(fm, /^extensions: false$/m);
});

test("running the generator twice yields identical trees", () => {
  const t1 = mkdtempSync(join(tmpdir(), "gen-"));
  const t2 = mkdtempSync(join(tmpdir(), "gen-"));
  const a = generateTo(t1);
  const b = generateTo(t2);
  assertTreesIdentical(a.adaptedDir, b.adaptedDir);
  assertTreesIdentical(a.guideDir, b.guideDir);
});

test("a failed generation leaves the previous output untouched", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir, guideDir } = generateTo(tmp);
  const before = treeFingerprint(adaptedDir) + treeFingerprint(guideDir);
  const badManifest = join(tmp, "bad.json");
  writeFileSync(
    badManifest,
    JSON.stringify({
      changes: [
        {
          id: "bad-anchor",
          op: "replace",
          target: "skills/poteto-mode/SKILL.md",
          anchor: "anchor that does not exist",
          text: "x",
        },
      ],
    }),
  );
  assert.throws(() =>
    generateTo(tmp, snapshot, { manifestPaths: [badManifest] }),
  );
  const after = treeFingerprint(adaptedDir) + treeFingerprint(guideDir);
  assert.equal(after, before);
});

test("default manifests are base, host, path, then setup", () => {
  assert.deepEqual(
    DEFAULT_MANIFEST_PATHS,
    [
      "changes.json",
      "host-changes.json",
      "path-changes.json",
      "setup-changes.json",
    ].map((file) => join(adaptationDir, file)),
  );
});

const pathChanges = JSON.parse(
  readFileSync(join(adaptationDir, "path-changes.json"), "utf8"),
).changes;

test("every declared path change lands once and replace anchors are gone", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  for (const change of pathChanges) {
    const file = join(adaptedDir, change.target);
    const content = readFileSync(file, "utf8");
    assertChangeOccursOnce(content, change);
    if (change.op === "replace") {
      assert.ok(
        !content.includes(change.anchor),
        `${change.id}: anchor still present in ${change.target}`,
      );
    }
  }
});

test("path semantics: lowercase dispatch, Pi sessions, .agents verify path", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  const read = (rel) => readFileSync(join(adaptedDir, rel), "utf8");

  const noComments = read("skills/no-comments/SKILL.md");
  assert.match(noComments, /subagent_type: "comment-sicko"/);
  assert.doesNotMatch(noComments, /subagent_type: "Comment Sicko"/);

  for (const rel of [
    "skills/recall/SKILL.md",
    "skills/reflect/SKILL.md",
    "skills/show-me-your-work/SKILL.md",
  ]) {
    const content = read(rel);
    assert.match(content, /~\/\.pi\/agent\/sessions/, rel);
    assert.match(content, /cwd/, rel);
  }
  assert.match(read("skills/recall/SKILL.md"), /type: "message"/);
  assert.match(read("skills/reflect/SKILL.md"), /type: "message"/);

  const createVerify = read("skills/create-verification-skill/SKILL.md");
  assert.match(createVerify, /\.agents\/skills\/verify-<app>\/SKILL\.md/);
  assert.match(createVerify, /\.agents\/skills\/verify-<app>\/features\/README\.md/);
  assert.doesNotMatch(createVerify, /\.cursor\/skills\/verify-<app>\//);
  assert.match(
    read("skills/maintain-verification-skill/SKILL.md"),
    /\.agents\/skills\/verify-\*\//,
  );
});

test("setup-pstack is exactly the frozen template, without the Cursor rule write path", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  const path = join(adaptedDir, setupChange.target);
  assert.deepEqual(readFileSync(path), readFileSync(setupSource));
  assert.doesNotMatch(readFileSync(path, "utf8"), /pstack-models\.mdc|\.cursor\/rules/);
  assert.match(frontmatter(path), /^disable-model-invocation: true$/m);
});

test("published role catalog covers every default-model row", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  const references = join(adaptedDir, "skills/poteto-mode/references");
  const catalog = JSON.parse(readFileSync(join(references, "roles.json"), "utf8"));
  const names = catalog.roles.map((role) => role.name).sort();
  const defaults = readFileSync(join(references, "default-models.md"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => line.slice(0, line.indexOf(": ")))
    .sort();
  assert.deepEqual(defaults, names);
});

test("metadata-key names outside the rule header are unregistered roles", () => {
  const src = mkdtempSync(join(tmpdir(), "reserved-role-"));
  cpSync(snapshot, src, { recursive: true });
  const path = join(src, "pstack/skills/setup-pstack/SKILL.md");
  const text = readFileSync(path, "utf8");
  const row = "feature, refactoring: grok-4.7-xhigh-fast";
  assert.equal(text.split(row).length - 1, 1);
  writeFileSync(path, text.replace(row, `model: qwen-unknown\n${row}`));
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  assert.throws(
    () => generateTo(tmp, src),
    /Unregistered role "model" in .*setup-pstack\/SKILL\.md/,
  );
});

for (const [anchor, replacement] of [
  ["read `hardest tasks`", "read `unregistered probe`"],
  [
    "from its line (`feature, refactoring`,",
    "from its line (`unregistered probe`,",
  ],
]) {
  test(`unregistered poteto role in ${anchor} fails before publication`, () => {
    const src = mkdtempSync(join(tmpdir(), "poteto-role-"));
    cpSync(snapshot, src, { recursive: true });
    const path = join(src, "pstack/skills/poteto-mode/SKILL.md");
    const text = readFileSync(path, "utf8");
    assert.equal(text.split(anchor).length - 1, 1);
    writeFileSync(path, text.replace(anchor, replacement));
    const tmp = mkdtempSync(join(tmpdir(), "gen-"));
    for (const output of ["adapted", "upstream-guide"]) {
      mkdirSync(join(tmp, output));
      writeFileSync(join(tmp, output, "sentinel"), "existing output\n");
    }
    const before = treeFingerprint(tmp);
    assert.throws(
      () => generateTo(tmp, src),
      (error) => {
        assert.match(error.message, /Unregistered role "unregistered probe"/);
        assert.ok(error.message.includes(path));
        return true;
      },
    );
    assert.equal(treeFingerprint(tmp), before);
  });
}

for (const [label, rel, mutate, errorPattern] of [
  [
    "unregistered setup role",
    "pstack/skills/setup-pstack/SKILL.md",
    (text) => {
      const row = "feature, refactoring: grok-4.7-xhigh-fast";
      assert.equal(text.split(row).length - 1, 1);
      return text.replace(row, `unregistered probe: qwen-unknown\n${row}`);
    },
    /Unregistered role/,
  ],
  [
    "unregistered how reference",
    "pstack/skills/how/SKILL.md",
    (text) => text + "\nUse the `unregistered probe` line in the pstack-models rule.\n",
    /Unregistered role/,
  ],
  [
    "non-role upstream setup drift",
    "pstack/skills/setup-pstack/SKILL.md",
    (text) => text + "\nupstream drift probe\n",
    /rewrite-setup-pstack.*SHA-256 mismatch/s,
  ],
]) {
  test(`${label} fails with its source path and preserves published outputs`, () => {
    const src = mkdtempSync(join(tmpdir(), "setup-snapshot-"));
    cpSync(snapshot, src, { recursive: true });
    const path = join(src, rel);
    writeFileSync(path, mutate(readFileSync(path, "utf8")));
    const tmp = mkdtempSync(join(tmpdir(), "gen-"));
    const { adaptedDir, guideDir } = generateTo(tmp);
    const before = treeFingerprint(adaptedDir) + treeFingerprint(guideDir);
    assert.throws(
      () => generateTo(tmp, src),
      (error) => {
        assert.match(error.message, errorPattern);
        if (label.startsWith("unregistered")) {
          assert.ok(error.message.includes("unregistered probe"));
          assert.ok(error.message.includes(path));
        } else {
          assert.ok(error.message.includes(setupChange.target));
          assert.ok(error.message.includes(setupChange.expectedSha256));
          assert.ok(error.message.includes(createHash("sha256").update(readFileSync(path)).digest("hex")));
        }
        return true;
      },
    );
    assert.equal(treeFingerprint(adaptedDir) + treeFingerprint(guideDir), before);
    if (label.startsWith("unregistered")) {
      const parent = join(tmp, "must-not-be-created");
      assert.throws(
        () => generate({
          sourceDir: src,
          adaptedDir: join(parent, "adapted"),
          guideDir: join(parent, "guide"),
        }),
        errorPattern,
      );
      assert.ok(!existsSync(parent), "role validation must precede staging and copying");
    }
  });
}

// --- fixture source tests ---

function buildFixture() {
  const src = mkdtempSync(join(tmpdir(), "fixture-src-"));
  const put = (rel, content) => {
    const p = join(src, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
    return p;
  };
  put("pstack/skills/poteto-mode/SKILL.md", "---\nname: Poteto Mode\n---\n");
  put("pstack/skills/make-bot-ui/SKILL.md", "---\nname: make-bot-ui\n---\n");
  put("pstack/skills/tdd/SKILL.md", "---\nname: tdd\n---\n");
  put("pstack/skills/teach/SKILL.md", "---\nname: teach\n---\n");
  put("pstack/docs/guide/README.md", "# The pstack guide\n\nbody\n");
  put("pstack/LICENSE", "pstack license\n");
  put("pstack/agents/comment-sicko.md", "---\nname: Comment Sicko\n---\n\nbody\n");
  for (const name of TEAM_KIT_SKILLS) {
    put(`cursor-team-kit/skills/${name}/SKILL.md`, `---\nname: ${name}\n---\n`);
  }
  put("cursor-team-kit/LICENSE", "team kit license\n");
  return { src, put };
}

function fixtureManifest(dir) {
  const manifest = {
    changes: [
      {
        id: "rename-poteto-mode",
        op: "replace",
        target: "skills/poteto-mode/SKILL.md",
        anchor: "name: Poteto Mode",
        text: "name: poteto-mode",
      },
      { id: "x-make-bot-ui", op: "exclude", target: "skills/make-bot-ui" },
      { id: "x-tdd", op: "exclude", target: "skills/tdd" },
      { id: "x-teach", op: "exclude", target: "skills/teach" },
      {
        id: "guide-note",
        op: "insert-before",
        target: "upstream-guide/README.md",
        anchor: "# The pstack guide",
        text: "note\n\n",
      },
    ],
  };
  const p = join(dir, "manifest.json");
  writeFileSync(p, JSON.stringify(manifest));
  return p;
}

// Only frozen upstream/template bytes are used for whole-file fixtures.
function setupFixture(overrides = {}) {
  const { src, put } = buildFixture();
  put("pstack/" + setupChange.target, readFileSync(upstreamSetup));
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const template = join(tmp, setupChange.source);
  mkdirSync(dirname(template), { recursive: true });
  cpSync(setupSource, template);
  const change = { ...setupChange, id: "fixture-replace-setup", ...overrides };
  const manifest = join(tmp, "manifest.json");
  writeFileSync(manifest, JSON.stringify({ changes: [change] }));
  return { src, tmp, template, change, manifest };
}

test("fixture: replace-file copies declared bytes and preserves the target mode", () => {
  const { src, tmp, template, manifest } = setupFixture();
  const upstream = join(src, "pstack", setupChange.target);
  chmodSync(upstream, 0o751);
  chmodSync(template, 0o640);
  const { adaptedDir } = generateTo(tmp, src, { manifestPaths: [manifest] });
  const output = join(adaptedDir, setupChange.target);
  assert.deepEqual(readFileSync(output), readFileSync(setupSource));
  assert.equal(statSync(output).mode & 0o777, 0o751);
  assert.equal(statSync(template).mode & 0o777, 0o640);
  assert.deepEqual(readFileSync(upstream), readFileSync(upstreamSetup));
});

test("fixture: replace-file hashes the current staged bytes, including earlier patches", () => {
  const { src, tmp, manifest } = setupFixture();
  const change = { ...setupChange, id: "fixture-replace-setup" };
  const patch = {
    id: "fixture-upstream-drift",
    op: "insert-after",
    target: setupChange.target,
    anchor: setupChange.anchor,
    text: "\nupstream drift probe\n",
  };
  writeFileSync(manifest, JSON.stringify({ changes: [patch, change] }));
  assert.throws(
    () => generateTo(tmp, src, { manifestPaths: [manifest] }),
    /fixture-replace-setup.*SHA-256 mismatch/s,
  );
  const current = readFileSync(upstreamSetup, "utf8").replace(
    patch.anchor, patch.anchor + patch.text,
  );
  change.expectedSha256 = createHash("sha256").update(current).digest("hex");
  writeFileSync(manifest, JSON.stringify({ changes: [patch, change] }));
  const { adaptedDir } = generateTo(tmp, src, { manifestPaths: [manifest] });
  assert.deepEqual(
    readFileSync(join(adaptedDir, change.target)),
    readFileSync(setupSource),
  );
});

for (const [label, overrides, pattern] of [
  ["missing anchor", { anchor: "unregistered probe" }, /anchor.*occurs 0 times/s],
  ["duplicated anchor", { anchor: "pstack" }, /anchor.*occurs (?:[2-9]|[1-9]\d+) times/s],
  ["empty anchor", { anchor: "" }, /anchor must be a non-empty string/],
  ["absent anchor", { anchor: undefined }, /anchor must be a non-empty string/],
  ["hash mismatch", { expectedSha256: "0".repeat(64) }, /SHA-256 mismatch/],
  ["missing hash", { expectedSha256: undefined }, /expectedSha256/],
  ["malformed hash", { expectedSha256: "not-a-sha256" }, /expectedSha256/],
  ["missing template", { source: "files/missing.md" }, /source file.*does not exist/s],
  ["directory template", { source: "files/skills/setup-pstack" }, /source.*not a regular file/s],
  ["empty template path", { source: "" }, /source is empty/],
  ["source traversal", { source: "../outside.md" }, /source escapes its root/],
  ["absolute source", { source: setupSource }, /source must be relative/],
  ["target traversal", { target: "skills/../../escape.md" }, /target escapes its root/],
  ["absolute target", { target: upstreamSetup }, /target.*must start with/s],
  ["missing target", { target: "skills/setup-pstack/missing.md" }, /target file.*does not exist/s],
  ["directory target", { target: "skills/setup-pstack" }, /target.*not a regular file/s],
  ["unknown operation", { op: "replace-file-unknown" }, /unknown op/],
]) {
  test(`fixture: replace-file rejects ${label}`, () => {
    const { src, tmp, change, manifest } = setupFixture(overrides);
    assert.throws(
      () => generateTo(tmp, src, { manifestPaths: [manifest] }),
      (error) => {
        assert.ok(error.message.includes(change.id));
        assert.match(error.message, pattern);
        return true;
      },
    );
    assert.ok(!existsSync(join(tmp, "adapted")));
    assert.ok(!existsSync(join(tmp, "upstream-guide")));
  });
}

for (const location of ["source", "source-parent", "target", "target-parent"]) {
  test(`fixture: replace-file rejects a symlinked ${location}`, () => {
    const { src, tmp, manifest } = setupFixture();
    const external = mkdtempSync(join(tmpdir(), "setup-external-"));
    const sentinel = join(external, "SKILL.md");
    cpSync(upstreamSetup, sentinel);
    if (location === "source") {
      symlinkSync(sentinel, join(tmp, "linked.md"));
      writeFileSync(manifest, JSON.stringify({
        changes: [{ ...setupChange, id: "fixture-replace-setup", source: "linked.md" }],
      }));
    } else if (location === "source-parent") {
      symlinkSync(external, join(tmp, "linked"));
      writeFileSync(manifest, JSON.stringify({
        changes: [{ ...setupChange, id: "fixture-replace-setup", source: "linked/SKILL.md" }],
      }));
    } else if (location === "target") {
      symlinkSync(sentinel, join(src, "pstack/skills/setup-pstack/linked.md"));
      writeFileSync(manifest, JSON.stringify({
        changes: [{ ...setupChange, id: "fixture-replace-setup", target: "skills/setup-pstack/linked.md" }],
      }));
    } else {
      symlinkSync(external, join(src, "pstack/skills/setup-pstack/linked"));
      writeFileSync(manifest, JSON.stringify({
        changes: [{ ...setupChange, id: "fixture-replace-setup", target: "skills/setup-pstack/linked/SKILL.md" }],
      }));
    }
    assert.throws(
      () => generateTo(tmp, src, { manifestPaths: [manifest] }),
      /fixture-replace-setup.*symlink/s,
    );
    assert.deepEqual(readFileSync(sentinel), readFileSync(upstreamSetup));
    assert.deepEqual(readdirSync(external), ["SKILL.md"]);
  });
}

test("fixture: happy path generates adapted package", () => {
  const { src } = buildFixture();
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const manifest = fixtureManifest(tmp);
  const { adaptedDir, guideDir } = generateTo(tmp, src, {
    manifestPaths: [manifest],
  });
  const head = readFileSync(
    join(adaptedDir, "skills/poteto-mode/SKILL.md"),
    "utf8",
  );
  assert.match(head, /name: poteto-mode/);
  assert.ok(!existsSync(join(adaptedDir, "skills/tdd")));
  assert.match(
    readFileSync(join(guideDir, "README.md"), "utf8"),
    /^note\n\n# The pstack guide/,
  );
});

test("fixture: explicit base-only stack does not require upstream role tables", () => {
  const { src } = buildFixture();
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp, src, {
    manifestPaths: [DEFAULT_MANIFEST_PATHS[0]],
  });
  assert.match(frontmatter(join(adaptedDir, "skills/poteto-mode/SKILL.md")), /name: poteto-mode/);
  assert.ok(!existsSync(join(adaptedDir, "skills/setup-pstack")));
});

test("fixture: relative source and output roots support copy-upstream and add-file", () => {
  const { src } = buildFixture();
  const tmp = mkdtempSync(join(tmpdir(), "relative-gen-"));
  const authored = join(tmp, "files/poteto-agent.md");
  mkdirSync(dirname(authored), { recursive: true });
  cpSync(join(adaptationDir, "files/agents/poteto-agent.md"), authored);
  const manifest = join(tmp, "manifest.json");
  writeFileSync(manifest, JSON.stringify({
    changes: [
      {
        id: "relative-copy", op: "copy-upstream",
        target: "agents/comment-sicko.md", source: "pstack/agents/comment-sicko.md",
      },
      {
        id: "relative-add", op: "add-file",
        target: "agents/poteto-agent.md", source: "files/poteto-agent.md",
      },
    ],
  }));
  const adaptedDir = join(tmp, "adapted");
  const guideDir = join(tmp, "guide");
  const result = generate({
    sourceDir: relative(process.cwd(), src),
    adaptedDir: relative(process.cwd(), adaptedDir),
    guideDir: relative(process.cwd(), guideDir),
    manifestPaths: [relative(process.cwd(), manifest)],
  });
  assert.equal(result.adaptedDir, resolve(adaptedDir));
  assert.equal(result.guideDir, resolve(guideDir));
  assert.deepEqual(
    readFileSync(join(adaptedDir, "agents/comment-sicko.md")),
    readFileSync(join(src, "pstack/agents/comment-sicko.md")),
  );
  assert.deepEqual(readFileSync(join(adaptedDir, "agents/poteto-agent.md")), readFileSync(authored));
});

test("fixture: add-file and copy-upstream ops land their bytes", () => {
  const { src } = buildFixture();
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  mkdirSync(join(tmp, "files"), { recursive: true });
  writeFileSync(join(tmp, "files/authored.md"), "authored body\n");
  const manifest = join(tmp, "manifest.json");
  writeFileSync(
    manifest,
    JSON.stringify({
      changes: [
        {
          id: "add-authored",
          op: "add-file",
          target: "agents/authored.md",
          source: "files/authored.md",
        },
        {
          id: "copy-sicko",
          op: "copy-upstream",
          target: "agents/comment-sicko.md",
          source: "pstack/agents/comment-sicko.md",
        },
      ],
    }),
  );
  const { adaptedDir } = generateTo(tmp, src, { manifestPaths: [manifest] });
  assert.equal(
    readFileSync(join(adaptedDir, "agents/authored.md"), "utf8"),
    "authored body\n",
  );
  assert.equal(
    readFileSync(join(adaptedDir, "agents/comment-sicko.md"), "utf8"),
    readFileSync(join(src, "pstack/agents/comment-sicko.md"), "utf8"),
  );
});

test("fixture: a missing anchor fails and names file and anchor", () => {
  const { src, put } = buildFixture();
  put("pstack/skills/poteto-mode/SKILL.md", "---\nname: Something Else\n---\n");
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const manifest = fixtureManifest(tmp);
  assert.throws(
    () => generateTo(tmp, src, { manifestPaths: [manifest] }),
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
  const manifest = fixtureManifest(tmp);
  assert.throws(
    () => generateTo(tmp, src, { manifestPaths: [manifest] }),
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
  const manifest = fixtureManifest(tmp);
  execFileSync("rm", [join(src, "pstack/docs/guide/README.md")]);
  assert.throws(
    () => generateTo(tmp, src, { manifestPaths: [manifest] }),
    /guide-note.*does not exist/s,
  );
});

test("fixture: duplicate change ids are rejected", () => {
  const { src } = buildFixture();
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const manifest = join(tmp, "manifest.json");
  writeFileSync(
    manifest,
    JSON.stringify({
      changes: [
        { id: "dup", op: "exclude", target: "skills/tdd" },
        { id: "dup", op: "exclude", target: "skills/teach" },
      ],
    }),
  );
  assert.throws(
    () => generateTo(tmp, src, { manifestPaths: [manifest] }),
    /Duplicate change id "dup"/,
  );
});

test("fixture: traversal and absolute sources/targets are rejected", () => {
  const { src } = buildFixture();
  const mk = (tmp, change) => {
    const manifest = join(tmp, "manifest.json");
    writeFileSync(manifest, JSON.stringify({ changes: [change] }));
    return manifest;
  };
  for (const change of [
    {
      id: "bad-source",
      op: "add-file",
      target: "agents/x.md",
      source: "../outside.md",
    },
    {
      id: "bad-target",
      op: "add-file",
      target: "skills/../../escape.md",
      source: "files/x.md",
    },
    {
      id: "abs-source",
      op: "copy-upstream",
      target: "agents/x.md",
      source: "/etc/passwd",
    },
    {
      id: "empty-anchor",
      op: "replace",
      target: "skills/poteto-mode/SKILL.md",
      anchor: "",
      text: "x",
    },
    {
      id: "missing-source",
      op: "add-file",
      target: "agents/y.md",
      source: "files/nonexistent.md",
    },
  ]) {
    const tmp = mkdtempSync(join(tmpdir(), "gen-"));
    const manifest = mk(tmp, change);
    assert.throws(
      () => generateTo(tmp, src, { manifestPaths: [manifest] }),
      (err) => {
        assert.match(err.message, new RegExp(change.id));
        return true;
      },
      change.id,
    );
  }
});

test("role guard rejects a defaults row missing the name/model separator", () => {
  const tmp = mkdtempSync(join(tmpdir(), "roleguard-"));
  const catalogPath = join(
    adaptationDir, "files/skills/poteto-mode/references/roles.json",
  );
  const defaultsPath = join(tmp, "default-models.md");
  cpSync(
    join(adaptationDir, "files/skills/poteto-mode/references/default-models.md"),
    defaultsPath,
  );
  const row = "feature, refactoring: xai/grok-4.7:xhigh";
  const bad = "feature, refactoring:xai/grok-4.7:xhigh";
  const text = readFileSync(defaultsPath, "utf8");
  assert.ok(text.includes(row), "expected defaults row in the frozen source");
  writeFileSync(defaultsPath, text.replace(row, bad));
  assert.throws(
    () =>
      validateRoleCatalog({ sourceDir: snapshot, catalogPath, defaultsPath }),
    new Error(`Invalid model row in ${defaultsPath}: ${bad}`),
  );
});

test("role guard rejects an upstream setup row missing the name/model separator", () => {
  const tmp = mkdtempSync(join(tmpdir(), "roleguard-"));
  const sourceDir = join(tmp, "source");
  cpSync(join(snapshot, "pstack"), join(sourceDir, "pstack"), {
    recursive: true,
  });
  const catalogPath = join(
    adaptationDir, "files/skills/poteto-mode/references/roles.json",
  );
  const defaultsPath = join(
    adaptationDir, "files/skills/poteto-mode/references/default-models.md",
  );
  const setupPath = join(sourceDir, "pstack/skills/setup-pstack/SKILL.md");
  const row = "feature, refactoring: grok-4.7-xhigh-fast";
  const bad = "feature, refactoring:grok-4.7-xhigh-fast";
  const text = readFileSync(setupPath, "utf8");
  assert.ok(text.includes(row), "expected upstream setup row in the snapshot");
  writeFileSync(setupPath, text.replace(row, bad));
  assert.throws(
    () =>
      validateRoleCatalog({ sourceDir, catalogPath, defaultsPath }),
    new Error(`Unrecognized upstream role row in ${setupPath}: ${bad}`),
  );
});

test("playbook Pi hints precede the real heading and sit outside code fences", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir } = generateTo(tmp);
  for (const [file, heading] of [
    ["playbooks/multi-phase-plan.md", "### Multi-phase or multi-PR plan\n"],
    ["playbooks/orchestrate.md", "### Orchestrate\n"],
  ]) {
    const content = readFileSync(
      join(adaptedDir, "skills/poteto-mode", file),
      "utf8",
    );
    const hint = content.indexOf("> Pi: Before executing this playbook");
    const head = content.indexOf(heading);
    assert.ok(hint !== -1, `${file}: hint missing`);
    assert.ok(head !== -1, `${file}: heading ${JSON.stringify(heading)} missing`);
    assert.ok(hint < head, `${file}: hint must precede the heading`);
    const before = content.slice(0, hint);
    assert.equal(
      (before.split("```").length - 1) % 2,
      0,
      `${file}: hint inside a fenced block`,
    );
  }
});

test("overlapping output roots are rejected", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  assert.throws(
    () =>
      generate({
        sourceDir: snapshot,
        adaptedDir: join(tmp, "a"),
        guideDir: join(tmp, "a/guide"),
      }),
    /must not overlap/,
  );
});

for (const shape of ["equal", "nested", "prospective-nested"]) {
  test(`physical ${shape} output aliases fail before existing outputs or sentinels change`, () => {
    const tmp = mkdtempSync(join(tmpdir(), "output-alias-"));
    const real = join(tmp, "real");
    mkdirSync(join(real, "adapted"), { recursive: true });
    mkdirSync(join(real, "guide"));
    writeFileSync(join(real, "adapted/sentinel"), "original adapted\n");
    writeFileSync(join(real, "guide/sentinel"), "original guide\n");
    writeFileSync(join(real, "sentinel"), "external sentinel\n");
    const alias = join(tmp, "alias");
    symlinkSync(real, alias);
    const before = treeFingerprint(real);
    const adaptedDir = shape === "prospective-nested"
      ? join(real, "missing/output")
      : join(real, "adapted");
    const guideDir = shape === "equal"
      ? join(alias, "adapted")
      : shape === "nested"
        ? join(alias, "adapted/guide")
        : join(alias, "missing/output/guide");
    assert.throws(
      () => generate({ sourceDir: snapshot, adaptedDir, guideDir }),
      /must not overlap/,
    );
    assert.equal(treeFingerprint(real), before);
    assert.deepEqual(readdirSync(tmp).sort(), ["alias", "real"]);
    assert.ok(!existsSync(join(real, "missing")), "canonicalization must not create missing parents");
  });
}

test("native /tmp and /private/tmp output aliases are rejected", {
  skip: !existsSync("/private/tmp") || realpathSync("/tmp") !== realpathSync("/private/tmp"),
}, () => {
  const tmp = mkdtempSync("/tmp/output-native-alias-");
  const real = realpathSync(tmp);
  assert.throws(
    () => generate({
      sourceDir: snapshot,
      adaptedDir: join(tmp, "missing/output"),
      guideDir: join(real, "missing/output/guide"),
    }),
    /must not overlap/,
  );
  assert.deepEqual(readdirSync(tmp), []);
});

for (const link of ["dangling", "loop"]) {
  test(`${link} output ancestor fails closed without staging or publication`, () => {
    const tmp = mkdtempSync(join(tmpdir(), "output-link-"));
    const alias = join(tmp, "alias");
    symlinkSync(link === "dangling" ? join(tmp, "missing") : alias, alias);
    const guideDir = join(tmp, "guide");
    mkdirSync(guideDir);
    writeFileSync(join(guideDir, "sentinel"), "original guide\n");
    const before = treeFingerprint(guideDir);
    assert.throws(
      () => generate({ sourceDir: snapshot, adaptedDir: join(alias, "output"), guideDir }),
      /Cannot resolve output path/,
    );
    assert.equal(treeFingerprint(guideDir), before);
    assert.deepEqual(readdirSync(tmp).sort(), ["alias", "guide"]);
  });
}

test("publishAll rolls back a completed swap when a later one fails", () => {
  const tmp = mkdtempSync(join(tmpdir(), "pub-"));
  const targetA = join(tmp, "outA");
  const targetB = join(tmp, "outB");
  mkdirSync(targetA); writeFileSync(join(targetA, "f"), "original-A\n");
  mkdirSync(targetB); writeFileSync(join(targetB, "f"), "original-B\n");
  const stageA = join(tmp, ".stageA");
  const stageB = join(tmp, ".stageB");
  mkdirSync(stageA); writeFileSync(join(stageA, "f"), "new-A\n");
  mkdirSync(stageB); writeFileSync(join(stageB, "f"), "new-B\n");
  rmSync(stageB, { recursive: true }); // second staging missing → swap fails
  assert.throws(
    () => publishAll([
      { staging: stageA, target: targetA },
      { staging: stageB, target: targetB },
    ]),
    /Publish failed/,
  );
  assert.equal(readFileSync(join(targetA, "f"), "utf8"), "original-A\n");
  assert.equal(readFileSync(join(targetB, "f"), "utf8"), "original-B\n");
});

test("an unreadable output parent fails without touching existing outputs", () => {
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const { adaptedDir, guideDir } = generateTo(tmp);
  const before = treeFingerprint(adaptedDir) + treeFingerprint(guideDir);
  const parent = dirname(guideDir);
  chmodSync(parent, 0o555);
  try {
    assert.throws(() => generateTo(tmp));
  } finally {
    chmodSync(parent, 0o755);
  }
  assert.equal(
    treeFingerprint(adaptedDir) + treeFingerprint(guideDir),
    before,
  );
});

test("fixture: a symlinked change target is refused, external file untouched", () => {
  const { src, put } = buildFixture();
  const sentinel = join(src, "external-sentinel.md");
  writeFileSync(sentinel, "do not touch\n");
  execFileSync("rm", [join(src, "pstack/skills/poteto-mode/SKILL.md")]);
  symlinkSync(sentinel, join(src, "pstack/skills/poteto-mode/SKILL.md"));
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  const manifest = fixtureManifest(tmp);
  assert.throws(
    () => generateTo(tmp, src, { manifestPaths: [manifest] }),
    (err) => {
      assert.match(err.message, /rename-poteto-mode/);
      assert.match(err.message, /symlink/);
      return true;
    },
  );
  assert.equal(readFileSync(sentinel, "utf8"), "do not touch\n");
});

test("fixture: add-file refuses an existing target", () => {
  const { src } = buildFixture();
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  mkdirSync(join(tmp, "files"), { recursive: true });
  writeFileSync(join(tmp, "files/x.md"), "x\n");
  const manifest = join(tmp, "manifest.json");
  writeFileSync(
    manifest,
    JSON.stringify({
      changes: [
        {
          id: "clobber",
          op: "add-file",
          target: "skills/poteto-mode/SKILL.md",
          source: "files/x.md",
        },
      ],
    }),
  );
  assert.throws(
    () => generateTo(tmp, src, { manifestPaths: [manifest] }),
    /clobber.*already exists/,
  );
});

test("fixture: exclude targets reject dot segments", () => {
  const { src } = buildFixture();
  for (const target of ["skills/..", "skills/."]) {
    const tmp = mkdtempSync(join(tmpdir(), "gen-"));
    const manifest = join(tmp, "manifest.json");
    writeFileSync(
      manifest,
      JSON.stringify({ changes: [{ id: "bad", op: "exclude", target }] }),
    );
    assert.throws(
      () => generateTo(tmp, src, { manifestPaths: [manifest] }),
      /bad.*exclude target/,
    );
  }
});

test("fixture: add-file beneath a symlinked dir with missing leaf is refused", () => {
  const { src } = buildFixture();
  // upstream-style snapshot where a skill contains a symlinked directory
  // pointing outside the staging tree.
  const external = mkdtempSync(join(tmpdir(), "ext-"));
  writeFileSync(join(external, "sentinel.md"), "external\n");
  mkdirSync(join(src, "pstack/skills/poteto-mode/ref"), { recursive: true });
  execFileSync("rm", ["-rf", join(src, "pstack/skills/poteto-mode/ref")]);
  symlinkSync(external, join(src, "pstack/skills/poteto-mode/ref"));
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  mkdirSync(join(tmp, "files"), { recursive: true });
  writeFileSync(join(tmp, "files/x.md"), "x\n");
  const manifest = join(tmp, "manifest.json");
  writeFileSync(
    manifest,
    JSON.stringify({
      changes: [
        {
          id: "through-link",
          op: "add-file",
          // leaf "new.md" does not exist; ref is a symlink out
          target: "skills/poteto-mode/ref/new.md",
          source: "files/x.md",
        },
      ],
    }),
  );
  assert.throws(
    () => generateTo(tmp, src, { manifestPaths: [manifest] }),
    /through-link.*symlink/s,
  );
  assert.deepEqual(readdirSync(external), ["sentinel.md"]);
});

test("fixture: declared source beneath a symlinked dir with missing leaf is refused", () => {
  const { src } = buildFixture();
  const external = mkdtempSync(join(tmpdir(), "ext-"));
  writeFileSync(join(external, "sentinel.md"), "external\n");
  // symlink dir inside the manifest's own directory
  const tmp = mkdtempSync(join(tmpdir(), "gen-"));
  symlinkSync(external, join(tmp, "files"));
  const manifest = join(tmp, "manifest.json");
  writeFileSync(
    manifest,
    JSON.stringify({
      changes: [
        {
          id: "src-through-link",
          op: "add-file",
          target: "agents/x.md",
          source: "files/missing.md", // leaf absent under symlinked files/
        },
      ],
    }),
  );
  assert.throws(
    () => generateTo(tmp, src, { manifestPaths: [manifest] }),
    /src-through-link/,
  );
});
