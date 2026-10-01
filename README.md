# pi-pstack

面向 Pi 的 pstack 适配研究与后续开发仓库。

当前只有讨论记录和工程约定，没有可安装插件、运行层代码或发布包。仓库名不表示它是 npm 上同名 `pi-pstack` 社区包的镜像或 fork。

## 从这里开始

- [已有讨论](docs/discussions/2026-09-30-initial-discussion.md)记录需求、已验证事实、建议和未决问题。
- [社区包对比](docs/research/2026-09-30-community-package-comparison.md)是研究总览。
- [实现审计](docs/research/pi-pstack-0.1.0-implementation-audit.md)保留宿主 API、模型、子代理与权限边界的代码证据。
- [上游对齐](docs/research/pi-pstack-upstream-alignment.md)保留固定 refs、计数和关键语义差异。
- [替代包兼容性](docs/research/community-port-compatibility-details.md)保留各候选的配置写入、协议和维护差异。
- [验证结果](docs/research/evidence/verification-evidence.json)保存精简机器证据，不包含下载源码或私人绝对路径。
- [CONTEXT.md](CONTEXT.md)定义项目术语。
- [AGENTS.md](AGENTS.md)规定代理工作方式，并指向工程技能配置。

## 已确认的工程约定

- 独立本地 Git 仓库，默认分支为 `main`。尚未配置 remote。
- Issues 和 specs 使用本地 Markdown，放在 `.scratch/<feature>/`。实际有票据时再创建目录。
- 使用默认 triage labels。
- 使用单一 root `CONTEXT.md`。需要正式架构决策时再创建 `docs/adr/`。
- 实现一次只推进一个 Issue。当前没有创建实现票据。

## 尚未决定

上游内容的固定版本、适配实现方案、插件发布名称、许可证、远程仓库和首个实现 Issue 均待确认。已有建议不等于已批准的架构决策。

## 调查边界

已有调查读取了源码和 npm 发布包，并验证了 Pi 的部分纯函数行为。尚未运行社区插件或完成 pstack 集成验证。

本仓库不会因记录讨论而自动修改 `~/.pi/agent`、`~/.agents` 或其他项目配置。
