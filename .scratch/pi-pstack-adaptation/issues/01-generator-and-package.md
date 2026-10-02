# 01: 生成器与适配包：poteto-mode 能在 Pi 中展开

**What to build:** 用户在 Pi 中输入 `/skill:poteto-mode <任务>` 后，适配包中的 poteto-mode 正文展开，启动时没有 pstack 技能重名警告。适配包由生成器从固定上游快照 `adf3218` 生成，并提交进本仓库。仓库中同时保留上游使用教程原文和一段 Pi 差异说明。

范围：
- 生成器读取上游快照和声明式改动清单，输出适配包。
- 本 Issue 的声明式改动：poteto-mode 改名；排除 make-bot-ui；从 cursor-team-kit 原样带入 deslop、control-cli、control-ui。
- 锚点缺失或匹配多处时生成失败。
- 上游 docs/guide 原样复制到本仓库文档目录，开头加 Pi 差异说明（安装方式、`/skill:poteto-mode`、`/skill:setup-pstack`、`/goal` 替代 `/loop`）。
- 用户共享技能目录中的上游 pstack 软链接改为指向适配包，新增三个 cursor-team-kit 技能的链接。

参考：spec 的"内容源""生成器""声明式改动清单""安装""上游教程"和"测试"第一、二层。

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent
**Completion:** complete（2026-10-02；全部验收通过）

- [x] 生成器从 `adf3218` 生成适配包，结果提交进仓库，且不在被 git 忽略的目录中
- [x] 第一层测试通过：poteto-mode 技能名正确；make-bot-ui 不存在；deslop、control-cli、control-ui 与上游逐字节相同；未声明改动的文件与上游逐字节相同；生成两次结果相同
- [x] 第一层测试通过：删掉一个锚点后生成失败，错误信息指出文件和锚点
- [x] 第二层测试通过：用 Pi 技能加载函数把适配包与用户现有技能目录一起加载，没有 pstack 技能重名诊断，poteto-mode 可调用
- [x] 上游教程原文和 Pi 差异说明在仓库中
- [x] 适配包和上游教程副本附带 pstack 与 cursor-team-kit 的 MIT LICENSE 原文
- [x] 修改用户共享技能目录前取得用户明确授权；修改后在真实 Pi 会话中 `/skill:poteto-mode` 展开，展开内容包含 baseDir 说明
- [x] 证据记录在本 Issue 的 Comments 中

## Comments

### 2026-10-02 生成器、适配包与安装

- 授权：用户在"重定向 44 个 pstack 链接、移除 make-bot-ui 链接、新增 deslop/control-cli/control-ui 并验证"的方案后回复"继续做"。此授权只覆盖本次 `~/.agents/skills` 改动；未触碰 `~/.pi/agent` 的 settings、agents、auth、模型与已装包，未做任何网络或模型调用。
- 生成器与包：`scripts/generate.mjs`（零依赖，Node 24 ESM）从固定提交 `adf3218` 经 `git archive` 提取快照，应用 `adaptation/changes.json` 的 5 条声明式改动（poteto-mode 改名、排除 make-bot-ui/tdd/teach、guide README 开头插 Pi 差异说明），输出 `adapted/`（47 个技能）与 `docs/upstream-guide/`。排除 tdd/teach 是因为用户在 `~/.agents/skills` 已有同名自建技能（来自 Matt 系列），避免重名。
- 安装：45 个旧上游软链接移入备份目录 `~/.agents/skill-backups/pstack-adaptation-20261002-173901/`（含 `manifest.tsv` 和 `rollback.sh`），新建 47 个指向 `adapted/skills/<name>` 的链接。`tdd`、`teach` 等真实目录未动，`make-bot-ui` 不再可加载。
- rollback.sh 安全性：先校验 manifest 全部行（名字唯一且不越出 `$SK`；安装位必须是字面指向适配包的符号链接；make-bot-ui 位必须不存在包括 dangling 链接；备份原件仍是字面旧上游链接），任一不满足则在改动任何条目前停止；通过后才把已装链接移入 `rollback-installed-<时间戳>/`（不删除），再把原件 mv 回原位。重复运行会安全失败。仅在隔离 fixture 目录中测试过（成功恢复、篡改目标文件/改向符号链接、缺失备份原件、重复运行四种情况均按预期），未对真实安装执行。执行时不要同时修改技能目录；移动阶段不是事务，不能保证中途失败时自动恢复。
- 测试：`npm test` 11 项全部通过（生成器 9 项 + 第二层 2 项：模拟安装后状态的加载 + 离线 SDK 展开探针，探针显式把 `adapted/skills` 放入 `additionalSkillPaths`，不要求已安装）。安装后验证单独在 `npm run test:installed`（`test/installed-skills.mjs`，不在默认套件）：用 Pi 自带 `loadSkills`（`includeDefaults` + 真实 `agentDir`、`skillPaths` 指向 `~/.agents/skills`）验证 47 个适配技能 canonical filePath 均落在 `adapted/` 且无重名诊断，用户 tdd/teach 仍解析到自有目录，make-bot-ui 不可加载。离线展开用 `createAgentSession` + `SessionManager.inMemory` + `SettingsManager.inMemory` + 隔离临时 agentDir + `ModelRuntime.create({modelsPath: null, allowModelNetwork: false, refreshOnCreate: false})`，经 `session.steer("/skill:poteto-mode …")` → `getSteeringMessages()` 验证 `<skill name="poteto-mode" …>` 块（含 `References are relative to <baseDir>.` 与上游 `## Playbooks` 正文，参数透传）。这是离线 SDK 队列展开证据，不是交互式/模型冒烟。
- 证据：备份目录 `~/.agents/skill-backups/pstack-adaptation-20261002-173901/` 内含 `EVIDENCE.md`（说明）、`manifest.tsv`、`rollback.sh`、`adapted_links.txt`、`real-load.json`、`expanded-poteto-mode.txt`、`npm-test.log`、`rollback-fixture-results.txt`；另 `/tmp/pstack-install-evidence/` 保存 install.sh、rollback-v2.sh 与 fixture 测试脚本。real-load.json 中唯一 warning 是预先存在的 `bailian-cli` description 超长，与本改动无关。
- 剩余（历史记录，已被下一条取代）：最后一项 checklist 需要在真实 Pi 会话中跑 `/skill:poteto-mode` 冒烟（第三层），未完成。本仓库无 CI，CI 证据不可用。

### 2026-10-02 实机冒烟（第三层，通过）

- 授权：在用户看到 lead 关于"一次 live Pi/主模型网络调用"的请求后明确回复"完成剩余测试"。本次才发生真实模型调用；此前阶段全部为离线测试。
- 方式：真实 Pi CLI 单次 print 调用（JSON 模式，模型-backed；不是交互式 TUI 测试）。argv 见证据目录 `command.json`：`pi --print --mode json --provider openai --model gpt-6.1-sol --thinking medium --no-tools --no-extensions --no-context-files --no-prompt-templates --no-themes --session-dir <证据目录>/sessions '/skill:poteto-mode …'`。不带 `--skill` 覆盖，也不直接给适配包路径——走真实的已安装共享技能发现。
- 结果（lead 已核对原始 stdout 与持久化 session）：Pi 0.99.1，单轮，exit 0，约 8 秒，stderr 为空；assistant provider=openai、model=gpt-6.1-sol、stopReason=stop、thinking=medium；用户消息以完整 `<skill name="poteto-mode" location="/Users/larry/.agents/skills/poteto-mode/SKILL.md">` 块开头（剥离 frontmatter 后与适配文件正文逐字节一致），含 `References are relative to /Users/larry/.agents/skills/poteto-mode.`，探针参数原样保留；最终回复恰为 `{"skill_name":"poteto-mode","skill_base_dir":"/Users/larry/.agents/skills/poteto-mode","playbooks_heading_present":true}`；零工具调用/零 tool_execution 事件。`settings.json` 与 `models-store.json` 前后 SHA-256 不变。
- 证据（持久，勿把完整私有 session/系统提示复制进仓库）：`/Users/larry/.agents/skill-backups/live-smoke-20261002-175114/`（command.json、stdout.jsonl、stderr.txt、timing.txt、before/after-hashes.txt、assistant-response.json、version.txt、agents-list.txt、sessions/2026-10-02T09-51-32-371Z_01a0fc06-b212-7336-83a0-c40d203ee793.jsonl）。
- 既有门槛：`npm test` 11/11 与 `npm run test:installed` 1/1 为此前已通过的关卡，本阶段未重跑。CI 不可用。
