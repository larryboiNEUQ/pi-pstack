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

**适配包**:
本仓库从固定的上游 pstack 快照生成的 Pi 版技能集合。正文尽量保持上游原文，只含声明过的改动。
_Avoid_: 社区 Pi 移植、fork、插件

**声明式改动**:
适配包相对上游原文的一处改动，带有锚点和理由。锚点在上游原文中缺失时，生成失败。
_Avoid_: 手工补丁、静默替换

**映射说明**:
适配包内的一份参考文档，说明上游引用的 Cursor 能力在 Pi 中对应什么，以及哪些能力不提供。
_Avoid_: 持续注入的提醒、全局规则

**显式调用**:
用户每次通过技能命令或句中引用启动 pstack 技能。宿主不在每轮自动注入提醒。
_Avoid_: Poteto Mode 持续模式、自动路由

**角色**:
上游技能中需要单独指定模型的一类子代理，例如 how explorer 或 interrogate reviewers。
_Avoid_: agent 文件、子代理类型

**模型表**:
每个角色使用哪个模型和 thinking 档位的用户级配置。没有写入的角色使用主模型。
_Avoid_: Cursor 规则文件、agent frontmatter

**订阅档案**:
用户各模型提供方的额度等级记录，例如主力、次要、稀缺、不限量。它是重新分配模型表的输入。
_Avoid_: 模型表、认证配置

**主模型**:
用户在主对话中当前选择的模型。
_Avoid_: 全局默认模型

**回退规则**:
角色指定的模型因额度、限流或不可用而失败时，用主模型重跑一次，并在回复中写明替换。
_Avoid_: 模糊匹配、同家族自动降级
