# pi-pstack 0.1.0 实现审计

核验日期为 2026-09-30，宿主为 Pi 0.99.1。本文保留此前详细调查中对后续适配有用的代码事实和验证边界，省略临时绝对路径、代理转录与重复宣传文字。

目标是 [kkgogogo17/pi-pstack 的固定提交 14da130](https://github.com/kkgogogo17/pi-pstack/tree/14da130e7aac196d355fa70706b06d5b4d71e095)，与 npm 0.1.0 的全部发布文件一致。下列行号基于该提交。机器结果见 [verification-evidence.json](evidence/verification-evidence.json)。

## 命令与持续模式

[index.ts:289-303](https://github.com/kkgogogo17/pi-pstack/blob/14da130e7aac196d355fa70706b06d5b4d71e095/extensions/pstack/index.ts#L289-L303) 的 `/poteto-mode task` 先写入启用状态和 UI status，再调用 `ctx.sendUserMessage`。

Pi 0.99.1 普通 `ExtensionCommandContext` 没有此方法。实际宿主工厂检查确认它为 `undefined`。因此任务派发路径预期报错，且状态可能已写成启用；完整插件运行未复现。`off` 路径没有调用该方法，但也未单独运行验证。

发送消息的能力属于 `ExtensionAPI` 或特殊的 `ReplacedSessionContext`，两者的参数并不相同。修复时应核对当前 API 并单独验证技能展开，不直接照搬特殊上下文的 `expandPromptTemplates` 选项。

[index.ts:250-277](https://github.com/kkgogogo17/pi-pstack/blob/14da130e7aac196d355fa70706b06d5b4d71e095/extensions/pstack/index.ts#L250-L277) 在 `session_start` 从 `getBranch()` 恢复 mode/todo，随后通过 `before_agent_start` 加入提醒，但未监听 `session_tree`。同一会话切换分支的内存状态需要重新恢复。提醒不是完整技能正文。直接 `/skill:poteto-mode` 输入的激活路径也尚未做集成验证。

## 模型配置

[config.ts](https://github.com/kkgogogo17/pi-pstack/blob/14da130e7aac196d355fa70706b06d5b4d71e095/extensions/pstack/config.ts) 列出 18 个角色，包含最新上游已退役的 `how critics`。默认全部 `inherit-parent`，写入 `~/.pi/agent/pstack/models.json`，不迁移 Cursor `.mdc`。

- `/setup-pstack` 只选择 provider/model，没有独立 thinking 或 panel 数组界面。
- 无 UI 的 setup 会写回全部默认值；中途取消也会保存已经选过的部分。
- `pstack_config` 支持字符串和 model pool，但没有完整校验角色名称、模型可用性或空数组。
- pool 解析会过滤 `auto`、`inherit-parent`。数组长度不决定实际 fan-out，任务数量才决定。不能照搬上游 alias 项也计入 panel 数量的语义。

[index.ts:403-409](https://github.com/kkgogogo17/pi-pstack/blob/14da130e7aac196d355fa70706b06d5b4d71e095/extensions/pstack/index.ts#L403-L409) 的模型优先级是显式 task.model、角色配置、父会话 provider/model、子进程启动默认。子进程未显式接收父会话 thinking。

[agents.ts](https://github.com/kkgogogo17/pi-pstack/blob/14da130e7aac196d355fa70706b06d5b4d71e095/extensions/pstack/agents.ts) 读取 agent model，但 runner 没使用它，也未采用用户 frontmatter 的 thinking、extensions、skills、prompt_mode。它与本机 Tintinweb 的 frontmatter 优先规则不同。本机全局 medium 作为子启动默认，不等于继承父会话实时档位。

## 子进程、角色与权限

[index.ts:101-216](https://github.com/kkgogogo17/pi-pstack/blob/14da130e7aac196d355fa70706b06d5b4d71e095/extensions/pstack/index.ts#L101-L216) 创建权限为 0600 的临时提示文件，用 Pi JSON print mode 执行，结束后清理提示文件。

参数没有 `--no-extensions`、`--no-skills` 或工作目录沙箱。因此子进程可再次加载 pstack 和本机全局插件。其 sticky entries、活动 Goal、hashline 读取状态并非父会话的状态副本。模型可提供 cwd，进程仍使用本机文件、网络和认证环境。

并行限制是每次调用八项任务、四项并发，不是全局嵌套深度、时间或成本预算。独立子进程也可重新获得委派工具。本机 Tintinweb 的递归保护不能直接视为覆盖此 runner。

agent scope 支持 bundled/user/project/both，读取的字段及同名优先级与 Tintinweb 不是同一协议。项目 agent 的额外批准仅在有 UI 时发生，不能视为 headless 执行也有相同确认。Pi 自身的项目 trust 是另一个边界。

已安装的权限系统是否会向该 runner 正确转发授权未运行验证。不能用“子进程加载了权限插件”代替协议集成证据。

## 结果、失败和计费

[index.ts:70-88,411-441](https://github.com/kkgogogo17/pi-pstack/blob/14da130e7aac196d355fa70706b06d5b4d71e095/extensions/pstack/index.ts#L70-L88) 显示：

- 最终文本提取只取最后一条 assistant message 的第一个 text block。
- 单任务和 chain 失败会抛错；并行失败项可以作为报告内容返回，整体不一定是 failed tool result。
- chain 没有明确长度上限，`{previous}` 插入完整前一步结果。
- 50 KiB 截断只覆盖并行报告的每项显示，不是所有 stdout、stderr、chain 和内存记录的统一限制。
- `--no-session` 不生成可恢复的持久 child session。tool details 中的记录不等于独立子会话存档。
- usage 被放在 details，不能据此认为宿主已把子调用计入 top-level tool usage。
- 子进程退出为零但没有 assistant 文本时，可以返回 `(no output)` 而非失败。

这些是静态实现边界，未运行验证其在实际长任务中的表现。

## 现有插件与安全

`subagent` 与 Tintinweb `Agent` 不直接重名，但工具、角色发现、续接和配置语义不同。`pi-skillful` 忽略来源为 extension 的输入，不能假定它会替错误命令展开技能。hashline、goal、MCP 和权限能力也需要明确继承策略。

[index.ts:233-243,279-287](https://github.com/kkgogogo17/pi-pstack/blob/14da130e7aac196d355fa70706b06d5b4d71e095/extensions/pstack/index.ts#L233-L243) 只识别部分 bash 字面形式的外部操作。UI 确认或 headless 阻断都不是 shell 沙箱，间接调用和其他工具不一定被覆盖。

包根没有安装生命周期脚本。保留的 helper scripts 需要 Bun，部分 GitHub 流程需要 gh 认证；bootstrap 可能按工作流执行 `bun install`。脚本测试主要针对 orch/watch-pr，不是 extension 命令、模式恢复或子进程集成测试。

## 证据与下一步

已经核实：发布包 metadata、静态实现、当前宿主命令上下文、技能加载与碰撞结果。

尚未核实：extension 启动、完整命令派发、child 启动和实际授权、分支切换、嵌套预算、截断与 usage 汇总。

若参考此实现，应先解决 API 不匹配，随后逐项验证技能展开、mode 生命周期、model/thinking、角色协议、权限与资源边界。本文不建议原样安装，也不是已批准的修复方案。
