# pi-pstack

面向 Pi 的 pstack 适配包仓库。

本仓库从固定的上游 pstack 快照生成 Pi 版技能（适配包），复用本机 Tintinweb 子代理系统，只支持显式调用。当前已有方案、ADR 和 Issue，尚无生成器代码和适配包。仓库名不表示它是 npm 上同名 `pi-pstack` 社区包的镜像或 fork。

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

- 独立本地 Git 仓库，默认分支为 `main`。尚未配置 remote。
- Issues 和 specs 使用本地 Markdown，放在 `.scratch/<feature>/`。
- 使用默认 triage labels。
- 使用单一 root `CONTEXT.md` 和 `docs/adr/`。
- Issue 按 `Blocked by` 前置关系推进。

## 已决定

- 上游内容固定为本机 cursor-plugins 提交 `adf3218`，pstack 0.15.5。跟进最新版本见 Issue 09。
- 适配方案见 ADR 0001 和 spec。
- 生成的适配包提交进本仓库。
- 测试分三层：生成器、Pi 技能加载、实机冒烟。

## 尚未决定

插件发布名称、许可证和远程仓库。当前只供本机使用，不发布。

## 配置边界

修改 `~/.agents/skills`、`~/.pi/agent` 等用户级目录的步骤写在对应 Issue 中，执行前需要用户在当次明确授权。本仓库不修改 Pi settings、已装插件、默认模型或现有角色文件。
