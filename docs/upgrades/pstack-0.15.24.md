# pstack 0.15.24 同步记录

## 固定快照

上游固定为 cursor/plugins 提交 `1e5c90a4b6f249917bd21fe361b3a2a7deb741b8`，manifest 版本为 0.15.24。上一版为 0.15.17。规格为 [#31](https://github.com/larryboiNEUQ/pi-pstack/issues/31)，实现任务为 [#32](https://github.com/larryboiNEUQ/pi-pstack/issues/32)。

## 用户可见变化

| 变化 | 影响 |
| --- | --- |
| 新增 `in-your-own-words` 与 `sharpen` | 显式调用 `/skill:in-your-own-words` 与 `/skill:sharpen`。`poteto-help` 与 `recipes.md` 中的新条目统一替换为 `/skill:` 显式命令。 |
| `ketchup` 精简为 150 词以内并配小图 | 保持只读契约。`pi-host.md` 明确视觉材料仅使用 Mermaid 或已有截图与录像，不调用未打包的 `/visualize` 或未经授权的图像生成。 |
| 按任务匹配思考档位与速度 | `pi-host.md` 明确保持 `models.md` 中配置的精确 `provider/model`，不增删 `-fast` 后缀，`max` 映射为 `xhigh`，失败回退规则仍为用主模型重试一次。 |
| 上游统一 `comment-sicko` 小写标识 | 移除 `path-changes.json` 中已由上游吸收的 `comment-sicko-invocation`，并将 `host-changes.json` 中 `rename-comment-sicko-agent` 的锚点更新为 `name: comment-sicko`，保留 `allowed_subagents` 嵌套委派白名单。 |
| playbook 与辅助脚本同步 | `autopilot-full`、`autopilot-stack`、`shipping`、`orchestrate`、`check-plan.mjs` 与 `worktree-audit.sh` 同步至 0.15.24。 |

保留现有生成器接口、严格唯一锚点检查、22 行角色模型分配、命名空间技能和宿主能力边界。

## 验证

- 生成 56 个技能，应用 296 条声明。
- 完整本地测试 112/112 通过。包含 `in-your-own-words`、`sharpen`、`ketchup` 的字面契约和真实 Pi SDK 技能展开。
- 固定提交独立再生成比较通过。145 个适配文件和 19 个教程文件的内容、权限及链接目标一致。
- 22 行角色配置与批准值一致。
- `git diff --check` 通过。
- CI 未在 `main` 启用，证据记为不可用。
- 未测试新技能在真实聊天中的模型行为。技能加载和文本检查不等于行为评测。
- 本次未改 `~/.agents/skills`、`~/.pi/agent`、全局设置或权限规则。

## 复跑

```sh
export PSTACK_UPSTREAM_REPO=/absolute/path/to/cursor-plugins
npm run generate
npm test
```
