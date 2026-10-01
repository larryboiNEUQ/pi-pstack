# 初始讨论记录

日期为 2026-09-30。本文整理已有对话，不是逐字转录，也不是已批准的实现 spec。

## 用户需求与当前范围

用户先要求把 Pi 默认模型设为 `openai/gpt-6.1-sol:medium`，检查本机 pstack 安装和配置。随后要求分析 pstack 的 Pi 适配范围，调查社区 `pi-pstack` 包、上游对齐和替代方案。最后要求创建当前独立仓库，并记录已有讨论。

本次仓库初始化只包括文档与工程约定。不安装插件、不改变全局配置、不创建远程仓库、不开始适配实现。

## 已确认的工程配置

用户通过 setup-matt-pocock-skills 确认：

- Issue tracker 使用本地 Markdown，目录为 `.scratch/<feature>/`。
- 保留默认五个 triage labels。
- 创建 `AGENTS.md`，不同时创建 `CLAUDE.md`。
- 使用 single-context 布局。ADR 在有正式决策时再创建。

父目录已有的逐 Issue 规则保留。实现一次只推进一个 Issue，完成验证、评审、提交、适用 CI 证据和 tracker 更新后才推进下一个。

## 本机快照

这些是调查时的事实，后续操作前需要重新检查。

- Pi 版本为 0.99.1。
- 全局默认 provider 为 `openai`，model 为 `gpt-6.1-sol`，thinking 为 `medium`；模型列表与认证可用性已核对。
- 更改新会话默认不代表已恢复会话会自动改档位。
- 已安装 `@tintinweb/pi-subagents`、`pi-skillful@0.3.14`、`pi-hashline-edit`、auto-review 与权限能力、MCP、ask-user-question、pi-goal 等扩展。
- 本机上游 pstack 快照位于共享技能来源目录，记录的 monorepo ref 为 `adf3218ca2f5b9971eedc07a76bef22df7701539`。它不是本次查询到的远程最新 ref。

## 本机 pstack 安装检查

上游快照有 47 个技能目录，其中 45 个通过共享技能目录安装。未安装为 pstack 来源的 `tdd` 和 `teach`，在本机已有其他来源的同名技能。

Pi 加载函数发现 45 个 pstack 技能。其中 44 个设置了 `disable-model-invocation: true`，自动发现列表中仅有 `setup-pstack`。隐藏不代表未加载。

两个技能名称不符合 Pi 的 slug 约定：`Poteto Mode`、`Make Bot UI`。本机内置命令解析按第一个空格截断名称，再精确匹配。验证显示 `/skill:Poteto Mode ...` 和 `/skill:poteto-mode ...` 都未展开，合法的 `/skill:how ...` 正常展开。此前 Poteto 调查依靠主代理显式读取技能，并非入口命令已修好。

本机没有发现已生效的 pstack 角色模型配置或 `poteto-agent` 定义。原版 setup 写 Cursor 的 `.mdc` rule，不能假定 Pi 会自动使用它。

## 模型配置的关键区别

调查时 `Explore`、`worker`、`reviewer` 的角色文件分别固定了旧 `openai-codex` 模型及思考档位。

Tintinweb 的参数解析优先使用角色 frontmatter。纯函数验证中，即使调用 Explore 显式传入 `openai/gpt-6.1-sol` 和 `medium`，仍被其角色文件覆盖为旧模型和 `low`。因此改全局默认并不能保证所有子代理使用新值。

建议为 pstack 使用专属角色，避免改变其他工作流的全局角色。角色表、model 与 thinking 的优先级和继承语义需要明确验证。这个建议尚未转为已批准的实现方案。

## 适配范围建议

已有分析建议保留平台无关的技能和 playbook 正文，把差异集中在宿主边界：

1. 修复技能 slug、相对路径与技能来源选择。
2. 重新定义 Pi 的角色模型配置与 thinking 语义。
3. 映射 Task、代理类型、后台通知、续接和提问工具。
4. 区分一次性技能调用与持续 Poteto Mode。
5. 对云端代理、循环、控制技能和发布流程做显式能力检查。
6. 保留现有权限和逐 Issue 约束，不把提示词或 worktree 宣称为安全沙箱。

建议先完成 `how` 调查闭环，再推进 `why`、Feature/Refactoring、设计 panel。长期自治和 shipping 后置。该顺序是待确认的分阶段建议，不是现有票据队列。

## 社区调查结论

完整版本与来源见 [社区包对比](../research/2026-09-30-community-package-comparison.md)。

用户给出的 `pi-pstack@0.1.0` 实现了自己的持续模式、配置、todo 和子进程 runner。它不是基于本机 Tintinweb runner 的轻量技能包。

其普通命令调用 `ctx.sendUserMessage`，与本机 Pi 0.99.1 命令上下文不匹配。此结论来自源码和宿主上下文工厂检查，没有启动第三方插件验证完整错误。

将其技能与本机现有技能合并，产生 43 个不同名称的冲突。它与本机 runner 不直接重名，但会引入另一套模型、状态和恢复语义。

调查时最新官方 pstack 是 0.15.5。该社区包没有对齐最新通用原则及同名流程。目标 GitHub main 与 npm 发布内容相同，改安装来源不能消除落后。

其他社区包中，McCune 的声明式移植记录和同步守卫值得参考，Zenspc 可作为较轻的内容素材。没有一款经调查证实可以原样复用本机 Tintinweb 协议。

## 未决问题

- 本仓库要作为独立 Pi package、可追踪 fork，还是生成式 overlay？
- 是否固定官方 0.15.5，或在实施时重新选择最新 ref？
- 是否正式选择保留 Tintinweb runner？已有建议支持保留，但用户尚未批准实现方案。
- 第一版只支持显式技能调用，还是同时提供持续模式？
- 角色配置存储位置、模型与 thinking 优先级、panel 列表语义如何定义？
- 哪些上游能力明确不支持，哪些需要额外工具？
- 包发布名称、许可证、remote 与首个实现 Issue 如何安排？

## 下一步的验收方向

实施前重新核实宿主 API、模型和上游 ref。后续最小闭环至少覆盖：技能真正展开、单一来源、模型与 thinking 实际生效、后台代理完成与全文回收、权限边界，以及持续模式如实现时的 reload/resume/tree 状态恢复。

本次没有创建 ADR，没有把推荐方案写成最终决策，也没有声称 pstack 工作流已经运行通过。

## 后续资料整理

用户要求只保留有用材料，并集中放入本仓库。研究总览现在指向实现审计、上游对齐、替代包兼容性和精简验证 JSON。下载源码、完整请求回应、冗长逐文件哈希、代理转录和重复草稿不作为长期归档。

资料筛选不改变前述未决问题或运行验证边界。
