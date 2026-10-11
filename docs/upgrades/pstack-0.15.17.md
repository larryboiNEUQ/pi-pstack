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
- 此处保留合并前检查结果。后续合并和安装结果见下节。

## 复跑

```sh
export PSTACK_UPSTREAM_REPO=/absolute/path/to/cursor-plugins
npm run generate
npm test
```

## 合并后交付记录

- 用户随后明确授权审查、合并和本机安装。
- [PR #25](https://github.com/larryboiNEUQ/pi-pstack/pull/25) 已合并，提交为 `48c945403f5d536c3935820fa984bd9bc9a8ff45`。合并文件树与审查提交一致。
- 安装前备份旧适配包和当时的模型表、订阅档案。保留现有技能链接，新增 ketchup 链接指向稳定主工作区。
- 安装后完整测试 111/111 通过，真实本机技能加载检查 1/1 通过。重复安装器 dry-run 没有冲突。
- 模型表与订阅档案同本次安装备份逐字节一致。自有 tdd/teach 的保留检查通过。
- 更早安装所记录的全局设置哈希已不匹配。它不是本次安装前快照，不能用于证明本次设置变更。此次没有写入或回滚全局设置。
- 独立 Opus 只读规范审查和 Sol 静态规格审查没有阻塞发现。运行检查由主会话执行。独立子代理运行验证因审批故障未完成，不能称为通过。
- 权限问题仍见 [pi-auto-review #64](https://github.com/larryboiNEUQ/pi-auto-review/issues/64)。没有关闭权限保护或替换 runner。
- 当时 CI 不可用。加载与展开测试不是 ketchup 的真实聊天行为评测。
