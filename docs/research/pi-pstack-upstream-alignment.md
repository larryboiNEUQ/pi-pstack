# pi-pstack 上游对齐审计

日期为 2026-09-30。保留精确版本、可重新获取的一手来源和关键语义差异，不保留冗长的逐文件哈希打印。

## 固定来源

- 官方 monorepo HEAD：[5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed](https://github.com/cursor/plugins/commit/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed)，时间为 2026-09-30T16:11:28Z。
- [官方 pstack manifest](https://github.com/cursor/plugins/blob/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed/pstack/.cursor-plugin/plugin.json)版本为 0.15.5，最近一次涉及 pstack 的提交为 [12d587dfb207](https://github.com/cursor/plugins/commit/12d587dfb207)，2026-09-23。
- 目标移植 main：[14da130e7aac196d355fa70706b06d5b4d71e095](https://github.com/kkgogogo17/pi-pstack/commit/14da130e7aac196d355fa70706b06d5b4d71e095)，2026-08-08。npm 0.1.0 于同日发布。
- [日期匹配的旧上游 195d9359](https://github.com/cursor/plugins/commit/195d9359bdc2890f83745df69927528ad4538406)为 0.14.0、44 skills，但不是已经证实的精确移植基点。目标没有记录源 SHA。

发布 tarball 地址和 integrity、独立计数结果见 [verification-evidence.json](evidence/verification-evidence.json)。

## 对比方法与结果

读取归档中的普通文件，对相同相对路径计算 SHA-256；技能只计根目录中的 `*/SKILL.md`，playbook 计对应目录的 Markdown 文件。计数与哈希差异只是字节事实，不是语义归因。

| 范围 | 旧上游同期 | 官方当前 | npm 目标 |
| --- | ---: | ---: | ---: |
| 根技能 | 44 | 47 | 44 |
| 原则 | 21 | 23 | 21 |
| playbook | 23 | 23 | 23 |
| Poteto scripts 文件 | 19 | 20 | 19 |
| skills 下全部文件 | 121 | 122 | 121 |
| agents | 2 | 2 | 2 |
| Benny 文件 | 12 | 12 | 0 |
| 指南文件 | 17 | 17 | 0 |

目标仓库和 npm 共有 129 个文件，全部逐字节相同；仓库只多 `.gitignore`。因此改为从 main 安装不能消除陈旧内容。

最新上游与 npm 共有 122 个文件，25 个相同、97 个不同，另有 36 个上游独有和 7 个 npm 独有文件。合理的平台改写也计入差异，不能把 97 称为漏同步数量。

## 明确的平台替换

[移植 README](https://github.com/kkgogogo17/pi-pstack/blob/14da130e7aac196d355fa70706b06d5b4d71e095/README.md)明确用 Pi 的 runner、角色配置、mode、todo、session 和 watcher 替换 Cursor Task、rules、元数据、transcript 和 cloud/loop。setup 等文件的不同不自动代表错误。

Cursor manifest、Benny、指南与 make-bot-ui 的排除意图没有逐项声明。可能是发行范围或平台限制，但只能标记未确定。

## 确认未同步的通用能力

- [principle-attack-the-premise](https://github.com/cursor/plugins/blob/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed/pstack/skills/principle-attack-the-premise/SKILL.md)和 [principle-test-behavior-not-implementation](https://github.com/cursor/plugins/blob/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed/pstack/skills/principle-test-behavior-not-implementation/SKILL.md)缺失，mode 的原则索引也未加入它们。
- [check-plan.mjs](https://github.com/cursor/plugins/blob/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed/pstack/skills/poteto-mode/scripts/check-plan.mjs)缺失。是否原样移植仍需适用性判断，但缺失不能冒充同步。
- [最新 how](https://github.com/cursor/plugins/blob/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed/pstack/skills/how/SKILL.md)只保留解释，目标仍保留 Critique 模式、四个 critics 和 `critic-prompt.md`、`critique-rubric.md`。
- 目标仍保留旧 `poteto-mode/references/plan.md`，当前上游已退役该文件。

`make-bot-ui` 是第三个缺失的新技能。它依赖 Cursor webhook，遗漏可能合理，但没有证实作者意图。即使豁免它，两个通用原则的缺失已否定最新对齐。

## 同名 playbook 的语义变化

### Shipping

[目标 shipping](https://github.com/kkgogogo17/pi-pstack/blob/14da130e7aac196d355fa70706b06d5b4d71e095/skills/poteto-mode/playbooks/shipping.md)强制 Graphite 排队，并禁止 GitHub auto-merge。

[最新 shipping](https://github.com/cursor/plugins/blob/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed/pstack/skills/poteto-mode/playbooks/shipping.md)默认 gh、可选 Origin，逐个准备和合并底部 PR，重新计算连续已验证范围，并加强 patch-id 与构建噪声检查。这是执行算法差异，不是 Task 到 subagent 的文字替换。

### Autopilot-full 与其他路由

[最新 autopilot-full](https://github.com/cursor/plugins/blob/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed/pstack/skills/poteto-mode/playbooks/autopilot-full.md)增加逐轮验证、trunk 独立回归、早期持久化工作记录、根级检查和停滞子代理处置。目标仍是旧版流程。

目标虽然有 autopilot-full 文件，但 mode 入口没有同步其明确路由。feature 的 throughput checkpoint 和 setup 的预算选择也有未解释的功能差异。模型默认改变可以是 Pi 适配，不能据此把所有差异归为落后。

当前上游只为不可逆操作保留特定确认，移植对外部操作更保守。保守授权可以是刻意安全选择，不要求恢复上游更宽松的自治。

多个原则文件的改动只是编辑精简。本文没有把每个措辞差异当成功能缺失。

## 结论和保留边界

排除明示平台替换后，目标仍未对齐 0.15.5。GitHub main 也没有新的补齐内容。

不保存 97 个不同文件的哈希清单或下载副本。需要深入具体文件时，使用上面的固定 refs 重新获取，并把平台差异、刻意排除和行为变化分别分类。正式实施时先重新确认宿主及上游版本，不能把本次快照永远称为最新。
