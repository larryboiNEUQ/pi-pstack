# pstack for Pi

本上下文定义讨论 pstack 的 Pi 适配时使用的术语。本文是术语表，不是实现规格或架构决策记录。

## Language

**上游 pstack**:
Lauren Tan 在官方 `cursor/plugins` 仓库维护的方法论、技能和工作流程。
_Avoid_: 本仓库、任意同名 npm 包

**社区 Pi 移植**:
第三方把上游 pstack 的内容或运行能力迁移到 Pi 的项目。不同移植不代表使用相同协议或拥有相同上游基线。
_Avoid_: 官方 pstack、统一 Pi 版本

**本仓库**:
当前独立的 `pi-pstack` 研究与开发仓库，区别于既有同名社区包。
_Avoid_: kkgogogo17/pi-pstack、npm pi-pstack

**Poteto Mode**:
pstack 中用于选择工作流程并执行工程约定的工作模式。技能文本与宿主提供的持续模式能力是不同部分。
_Avoid_: Pi Goal mode、单一提示词即可保证的持久状态

**Tintinweb 子代理系统**:
本机已有的 `@tintinweb/pi-subagents` 插件及其代理调度协议。
_Avoid_: Nico pi-subagents、小写 subagent 工具的统称

**Nico 子代理系统**:
独立 npm 包 `pi-subagents` 提供的 Pi 子代理系统，与 Tintinweb 子代理系统不是同一产品或协议。
_Avoid_: @tintinweb/pi-subagents、可直接互换的 runner

**上游对齐**:
保留指定上游版本适用的方法论行为，并明确记录平台替换或刻意排除项。技能数量相同不足以证明上游对齐。
_Avoid_: 字节完全相同、README 宣称覆盖全部
