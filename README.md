当前同步为 pstack 0.15.24。在可移植验证流水线中的完整测试 115/115 通过，包含新增 in-your-own-words 与 sharpen 的加载、展开、help 显式命令路由，以及 ketchup 视觉摘要契约检查。详见 [0.15.24 升级记录](docs/upgrades/pstack-0.15.24.md)。后文 0.15.17 与 0.15.15 的测试和安装描述是历史记录。

# pi-pstack

面向 Pi 的 pstack 适配包仓库。

本仓库从固定的上游 pstack 快照生成 Pi 版技能（适配包），复用本机 Tintinweb 子代理系统，只支持显式调用。当前生成包有 56 个技能，在 `adapted/skills/`。裸名 `tdd` 和 `teach` 仍不进包，留给用户已有的 Matt Pocock 技能。上游正文以 `pstack-tdd` 和 `pstack-teach` 进包。三个子代理定义（poteto-agent、pstack-readonly、comment-sicko，含嵌套委派 allowlist）与模型表、订阅档案种子仍在生成包里。0.15.24 的本机安装与测试在 PR #30 合并后补记，详见 [0.15.24 升级记录](docs/upgrades/pstack-0.15.24.md)。

当前清单栈依次启用 `adaptation/changes.json`、`host-changes.json`、`path-changes.json`、`setup-changes.json`。改动条数以这四份清单为准，不在这里另记一个会过期的数字。路径适配和整篇重写的 setup-pstack 仍生效。上游 setup 的变化已复查，其源 SHA-256 守卫已更新。Issue 02 的子代理四模型/thinking/回退实机冒烟已通过；Issue 06 的模型建议、确认写入和备份验收在隔离 fixture 中通过，真实用户配置未改动。Issue 05（含续跑与 UI 截图能力告诫）、07（含 Claude 门禁兜底与评委续跑告诫）、08（用户批准的 PR 复用范围，含 Goal PTY 续跑与 print 模式失败记录）的实机验收均已完成。这些是当时记录，本轮没有重跑。

公开仓库 <https://github.com/larryboiNEUQ/pi-pstack>。[PR #1](https://github.com/larryboiNEUQ/pi-pstack/pull/1) 已合并进 `main`。仓库名不表示它是 npm 上同名 `pi-pstack` 社区包的镜像或 fork。

## 生成与测试

- `npm run generate`：从固定上游提交 `1e5c90a4b6f249917bd21fe361b3a2a7deb741b8`（pstack 0.15.24）重新生成 `adapted/` 和 `docs/upstream-guide/`。
- `PSTACK_UPSTREAM_REPO=/absolute/path/to/plugins-clone`：可选指定含有固定提交的本地上游克隆，不改变 pin。生成器和测试均读取此变量。
- `node --test test/generate.test.mjs test/pi-load.test.mjs`：窄范围生成器和离线 Pi 技能加载/展开验证；Issue 09 在独立 worktree 中运行一次，63 项通过，生成 47 个技能且输出相对集成基线无 diff。
- `npm test`：完整本地测试集，覆盖生成器、安装器 fixture、Pi 技能加载及展开。0.15.24 同步后并在可移植验证流水线中的全量测试为 115/115 通过，包含新增 `in-your-own-words` 与 `sharpen` 的加载、展开、`poteto-help` 显式路由与 `ketchup` 视觉摘要契约检查，详见 [0.15.24 升级记录](docs/upgrades/pstack-0.15.24.md)。0.15.17 安装后运行结果为 111/111 通过，真实技能加载检查为 1/1 通过；0.15.15 的 109/109 与早期 `f7706db` 的 86/86 保留在各自升级记录中。测试需要包含固定提交的上游克隆、已安装的 Pi 和现有技能目录。
- `npm run test:installed`：用真实 Pi `loadSkills` 检查本机技能链接、重名诊断、用户自有 tdd/teach 与 make-bot-ui 排除项。0.15.17 安装后运行结果为 1/1 通过；0.15.24 的本机安装在 PR #30 合并后进行，对应结果记录在该升级记录中。此检查不证明技能在真实聊天中的模型行为。

仓库已添加 GitHub Actions 验证工作流。历史升级时 CI 尚未配置；新工作流是否通过，以实际远程运行结果为准。本地通过不等于 CI 通过。

下列审查记录属于 PR #1 合并前，不是本轮升级的审查。那次两轴审查没有发现硬性 Standards 违规；Spec 的外部 tdd/teach 查找、嵌套评委家族选择和教程安装说明已修复。`4029000` 的 13 项定向回归通过，且重新生成的技能与教程在字节、模式和链接目标上与提交内容一致；没有把那次定向验证说成新的全量测试。

## Model Defaults 与后续维护

发布的默认表位于 `adapted/skills/poteto-mode/references/default-models.md`，角色目录位于同目录的 `roles.json`；`adapted/config/` 提供安装种子。已有用户表 `~/.pi/agent/pstack/models.md` 和订阅档案 `subscriptions.md` 不由重新生成重置。

上游官方默认是 Claude/Grok 两家族全 `xhigh`；本仓库发布的默认表是用户批准的 Sol/SWE/Opus/Grok 项目分配，thinking 按角色混合（medium/high/xhigh），见 spec #18 附录与 ticket #21。两者不要混为一谈。

模型或订阅变化时显式调用 `/skill:setup-pstack`：先发现当前可用模型并提出整表建议，用户确认后才刷新可用列表、验证、备份和写入。Issue 06 的“Grok 到期”结果只用于隔离 fixture 验收，不是对真实默认表的重新分配；fixture 已守卫恢复。后续 workflow 的验收仍按各 Issue 单独推进。

## 从这里开始

- [Spec #3](https://github.com/larryboiNEUQ/pi-pstack/issues/3)是最初的实现方案，包括映射说明、模型表、测试分层和与上游的差异。
- [0.15.24 升级记录](docs/upgrades/pstack-0.15.24.md)记录本次 pin、上游变化、验证命令和未做的安装。对应 [spec #31](https://github.com/larryboiNEUQ/pi-pstack/issues/31) 和 [ticket #32](https://github.com/larryboiNEUQ/pi-pstack/issues/32)。
- [0.15.17 升级记录](docs/upgrades/pstack-0.15.17.md)与 [0.15.15 升级记录](docs/upgrades/pstack-0.15.15.md)保留历史升级记录。
- [Issues](https://github.com/larryboiNEUQ/pi-pstack/issues)在 GitHub tracker 上按 `Blocked by` 前置关系推进。
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

- GitHub 公开仓库为 `larryboiNEUQ/pi-pstack`，默认分支为 `main`。[PR #1](https://github.com/larryboiNEUQ/pi-pstack/pull/1) 已合并，不再是 draft。
- Issues 和 specs 使用 GitHub tracker。
- 使用默认 triage labels。
- 使用单一 root `CONTEXT.md` 和 `docs/adr/`。
- Issue 按 `Blocked by` 前置关系推进。

## 已决定

- 上游内容固定为官方 cursor/plugins 提交 `1e5c90a4b6f249917bd21fe361b3a2a7deb741b8`，pstack manifest 0.15.24。这不是对未来 HEAD 的动态跟踪。Issue 09 对旧 pin `c47b12849e43f18d5c374c7069c744cc55b0ea00`（0.15.5）的记录仍是当时证据。
- 适配方案见 ADR 0001 和 spec。
- 生成的适配包提交进本仓库。
- 测试分三层：生成器、Pi 技能加载、实机冒烟。

## 发布范围

源码仓库已公开；当前不发布 npm 包。本仓库新增代码尚未指定许可证；上游技能及教程保留其原有 LICENSE，不将上游许可范围扩展为本仓库全部代码。

## 配置边界

修改 `~/.agents/skills`、`~/.pi/agent` 等用户级目录的步骤写在对应 Issue 中，执行前需要用户在当次明确授权。本仓库不修改 Pi settings、已装插件、默认模型或现有角色文件。

## 验证限制

PR #20、#25 和 #33 的运行检查由主会话执行，独立子代理完成只读审查与验证。历史子代理 Bash 审批回传受阻的问题记录在 [pi-auto-review #64](https://github.com/larryboiNEUQ/pi-auto-review/issues/64)。这些证据不是独立的子代理运行验证，没有为此关闭权限保护或更换 runner。

## 可重复验证与 CI

先运行 `npm ci --ignore-scripts` 安装仓库内固定版本的 Pi SDK。设置 `PSTACK_UPSTREAM_REPO`，指向包含固定上游提交的 Git 克隆。

```sh
npm run doctor
npm run verify
```

`doctor` 只读检查 Node、SDK、固定提交和打包目录。`verify` 运行普通测试、独立再生成比对及隔离安装器 CLI 流程。它不安装到真实 home。每次运行在 `.artifacts/verification/run-*/` 保留命令日志和 `summary.json`，并删除本次临时状态。

普通测试使用临时 tdd/teach 技能文件和仓库内 SDK，不依赖个人技能目录。`npm run test:installed` 仍是单独的真实本机检查，不进入 CI。

[项目验证 skill](.agents/skills/verify-pi-pstack/SKILL.md)包含完整准备、doctor、操作、证据和清理步骤。[功能地图](.agents/skills/verify-pi-pstack/features/README.md)覆盖生成、安装器和技能加载。可通过 `/skill:verify-pi-pstack` 调用。

GitHub Actions 在 PR、main 推送和手动运行时执行同一验证入口，并保存证据。远程结果以实际 workflow run 为准，不能用本地测试或 YAML 检查代替。SDK 加载和命令展开不证明真实模型行为。
