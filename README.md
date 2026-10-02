# pi-pstack

面向 Pi 的 pstack 适配包仓库。

本仓库从固定的上游 pstack 快照生成 Pi 版技能（适配包），复用本机 Tintinweb 子代理系统，只支持显式调用。适配包已生成并安装：47 个技能链接到 `adapted/skills/`，三个子代理（poteto-agent、pstack-readonly、comment-sicko，含嵌套委派 allowlist）与模型表/订阅档案种子已安装到 `~/.pi/agent/`。

当前清单栈依次启用 `adaptation/changes.json`、`host-changes.json`、`path-changes.json`、`setup-changes.json`，共 45 条改动；路径适配和整篇重写的 setup-pstack 均已生效。Issue 02 的子代理四模型/thinking/回退实机冒烟已通过；Issue 06 的模型建议、确认写入和备份验收在隔离 fixture 中通过，真实用户配置未改动。Issue 05、07、08 的 workflow 实机验收尚未完成，不由上述结果推定通过。

公开仓库 <https://github.com/larryboiNEUQ/pi-pstack>，完整适配在 `pstack-pi-full-spec` 分支和 [draft PR #1](https://github.com/larryboiNEUQ/pi-pstack/pull/1) 中推进。仓库名不表示它是 npm 上同名 `pi-pstack` 社区包的镜像或 fork。

## 生成与测试

- `npm run generate`：从固定上游提交 `c47b12849e43f18d5c374c7069c744cc55b0ea00`（pstack 0.15.5）重新生成 `adapted/` 和 `docs/upstream-guide/`。
- `node --test test/generate.test.mjs test/pi-load.test.mjs`：窄范围生成器和离线 Pi 技能加载/展开验证；Issue 09 在独立 worktree 中运行一次，63 项通过，生成 47 个技能且输出相对集成基线无 diff。
- `npm test`：完整本地测试集，包括生成器、安装器 fixture 和 Pi 技能加载/展开；测试需要本机上游快照、已安装的 Pi 和现有技能目录。Issue 09 未重跑完整测试集或安装器。
- `npm run test:installed`：安装后验证——用 Pi `loadSkills` 加载真实 `~/.agents/skills`（含 `~/.pi/agent/skills` 默认目录），断言 47 个适配技能的 canonical 路径都落在 `adapted/`、无重名诊断、用户自有 tdd/teach 不受影响、make-bot-ui 不可加载。只检查目录加载，不覆盖扩展包内技能。

当前未配置 CI，CI 证据记为不可用；本地通过不等于 CI 通过。

## Model Defaults 与后续维护

发布的默认表位于 `adapted/skills/poteto-mode/references/default-models.md`，角色目录位于同目录的 `roles.json`；`adapted/config/` 提供安装种子。已有用户表 `~/.pi/agent/pstack/models.md` 和订阅档案 `subscriptions.md` 不由重新生成重置。

模型或订阅变化时显式调用 `/skill:setup-pstack`：先发现当前可用模型并提出整表建议，用户确认后才刷新可用列表、验证、备份和写入。Issue 06 的“Grok 到期”结果只用于隔离 fixture 验收，不是对真实默认表的重新分配；fixture 已守卫恢复。后续 workflow 的验收仍按各 Issue 单独推进。

## 从这里开始

- [Spec](.scratch/pi-pstack-adaptation/spec.md)是当前的实现方案，包括映射说明、模型表、测试分层和与上游的差异。
- [Issues](.scratch/pi-pstack-adaptation/issues/)按 `Blocked by` 前置关系推进，01 是起点。
- [ADR 0001](docs/adr/0001-thin-skill-adaptation-on-tintinweb.md)记录核心决定：薄适配包、复用 Tintinweb、不写 extension、只做显式调用。
- [CONTEXT.md](CONTEXT.md)定义项目术语。
- [AGENTS.md](AGENTS.md)规定代理工作方式，并指向工程技能配置。

背景资料：

- [已有讨论](docs/discussions/2026-09-30-initial-discussion.md)记录最初的需求、已验证事实和建议。
- [社区包对比](docs/research/2026-09-30-community-package-comparison.md)是研究总览。
- [实现审计](docs/research/pi-pstack-0.1.0-implementation-audit.md)保留宿主 API、模型、子代理与权限边界的代码证据。
- [上游对齐](docs/research/pi-pstack-upstream-alignment.md)保留固定 refs、计数和关键语义差异。
- [替代包兼容性](docs/research/community-port-compatibility-details.md)保留各候选的配置写入、协议和维护差异。
- [验证结果](docs/research/evidence/verification-evidence.json)保存精简机器证据，不包含下载源码或私人绝对路径。

## 已确认的工程约定

- GitHub 公开仓库为 `larryboiNEUQ/pi-pstack`，默认分支为 `main`；完整适配在 `pstack-pi-full-spec` 分支和 draft PR #1 中推进。
- Issues 和 specs 使用本地 Markdown，放在 `.scratch/<feature>/`。
- 使用默认 triage labels。
- 使用单一 root `CONTEXT.md` 和 `docs/adr/`。
- Issue 按 `Blocked by` 前置关系推进。

## 已决定

- 上游内容固定为官方 cursor/plugins 在 2026-10-02 查询并获取的 HEAD `c47b12849e43f18d5c374c7069c744cc55b0ea00`，pstack 仍为 0.15.5。Issue 09 依据 lead 审计确认选定输入相对旧 pin 无内容或模式变化；这不是对未来 HEAD 的动态跟踪。
- 适配方案见 ADR 0001 和 spec。
- 生成的适配包提交进本仓库。
- 测试分三层：生成器、Pi 技能加载、实机冒烟。

## 尚未决定

插件发布名称和本仓库新增代码的许可证。源码仓库已公开；当前不发布 npm 包。

## 配置边界

修改 `~/.agents/skills`、`~/.pi/agent` 等用户级目录的步骤写在对应 Issue 中，执行前需要用户在当次明确授权。本仓库不修改 Pi settings、已装插件、默认模型或现有角色文件。
