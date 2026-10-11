# pstack 0.15.17 同步记录

## 固定快照

上游固定为 cursor/plugins 提交 `9d76bcab133aefcccb16121d7be874e6aa823729`，manifest 版本为 0.15.17。上一版为 0.15.15。规格为 [#23](https://github.com/larryboiNEUQ/pi-pstack/issues/23)，实现任务为 [#24](https://github.com/larryboiNEUQ/pi-pstack/issues/24)。PR #20 已合并，本次通过后续 PR 更新。

## 用户可见变化

| 变化 | 影响 |
| --- | --- |
| 上游提示词精简 | how、why、arena、interrogate、reflect 和原则说明缩短。没有据此声称 token 成本或执行速度降低。 |
| 新增 ketchup | 显式调用 `/skill:ketchup`，只读汇总当前聊天中自上次用户消息以来的进度和仍需用户处理的事项。通知和子代理结果不算用户消息。 |
| Pi 声明更新 | 重新定位 help 和 reflect 的三个上游锚点。reflect 的 Pi 会话格式与隐私替换文本保持原样。 |

保留现有生成器接口、严格唯一锚点检查、22 行角色模型分配、命名空间技能和宿主能力边界。ketchup 使用现有 Pi host 引用。

## 验证

- 生成 54 个技能，应用 293 条声明。
- 完整本地测试 111/111 通过。包含 ketchup 的字面契约和真实 Pi SDK 技能展开。
- 固定提交独立再生成比较通过。142 个适配文件和 19 个教程文件的内容、权限及链接目标一致。
- 22 行角色配置与批准值一致。
- `git diff --check` 通过。
- CI 未配置，证据不可用。
- 未测试 ketchup 在真实聊天中的模型行为。技能加载和文本检查不等于行为评测。
- 未合并或本机安装，未改全局设置、权限规则或本机模型配置。

## 复跑

```sh
export PSTACK_UPSTREAM_REPO=/absolute/path/to/cursor-plugins
npm run generate
npm test
```
