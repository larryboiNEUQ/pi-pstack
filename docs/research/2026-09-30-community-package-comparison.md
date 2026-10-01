# 社区 Pi pstack 移植调查快照

核验日期为 2026-09-30 UTC。此快照保存已有研究，后续安装或发布前需要重新查询。它不是本仓库的实现设计，也不是任何第三方包的运行认证。

## 核验方法与边界

查询 npm registry latest，下载发布 tarball，核验目标包 SHA-512 integrity，读取 GitHub 与本机 Pi 0.99.1 源码。用 Pi 加载函数、命令上下文工厂和文件哈希做确定性检查。

未安装候选包、未加载第三方扩展、未运行其子进程或真实 pstack 工作流。没有在本次仓库初始化中修改 Pi、共享技能或代理配置。

## 详细证据索引

- [实现审计](pi-pstack-0.1.0-implementation-audit.md)：命令 API、持续模式、角色模型、子进程、结果和权限边界。
- [上游对齐审计](pi-pstack-upstream-alignment.md)：固定 refs、计数、平台替换和实质语义变化。
- [替代包兼容性补充](community-port-compatibility-details.md)：协议、设置写入、宿主要求和同步维护方法。
- [精简验证结果](evidence/verification-evidence.json)：tarball integrity、宿主上下文、技能加载与碰撞、文件比较的已观察结果。

## 用户提供的包

[pi.dev 页面](https://pi.dev/packages/pi-pstack?name=cursor)对应 [kkgogogo17/pi-pstack](https://github.com/kkgogogo17/pi-pstack)。[npm registry](https://registry.npmjs.org/pi-pstack) 的 latest 为 0.1.0，发布时间为 2026-08-08。

发布包提供 44 个技能、21 个原则、23 个 playbook、2 个 agent。它注册 `/poteto-mode`、`/setup-pstack`、`pstack_config`、`pstack_todo` 和独立的 `subagent` 工具。配置路径为 `~/.pi/agent/pstack/models.json`。

子代理使用本地 `pi --mode json --print --no-session` 进程，支持单任务、并行 tasks 和 chain。每次最多八项并行任务、四项同时运行。这不是整棵代理树的限制，也不是文件系统或权限沙箱。

### 本机兼容阻碍

- [命令源码](https://github.com/kkgogogo17/pi-pstack/blob/14da130e7aac196d355fa70706b06d5b4d71e095/extensions/pstack/index.ts#L289-L303)调用 `ctx.sendUserMessage`，普通 Pi 0.99.1 命令上下文没有此方法。实际宿主工厂检查得到 `undefined`。完整插件运行表现尚未复现。
- 与本机既有技能合并时出现 43 个不同名称的冲突。加载顺序改变获选来源。
- 它另建小写 `subagent` runner，不复用本机 Tintinweb 的 `Agent`。
- 子进程未禁用全局扩展，不继承父会话 sticky、Goal 或 hashline 快照。
- 没有显式传递父会话实时 thinking。用户 agent 的模型和扩展 frontmatter 在此 runner 中也没有采用相同语义。
- 模式恢复监听 session_start，但未处理 session_tree。跨分支状态需验证。
- 非交互 setup 会写回默认配置。shell 确认仅有限字面匹配。

因此不建议原样叠装。

## 官方上游对齐

调查时官方 HEAD 为 [`5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed`](https://github.com/cursor/plugins/commit/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed)，[pstack manifest](https://github.com/cursor/plugins/blob/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed/pstack/.cursor-plugin/plugin.json)版本为 **0.15.5**。最近涉及 pstack 的提交在 2026-09-23。

目标仓库 main 为 `14da130e7aac196d355fa70706b06d5b4d71e095`。它与 npm 共用的 129 个发布文件逐字节一致，仅多 `.gitignore`。切换到 GitHub main 安装不会获得更新。

同期官方上游为 0.14.0、44 skills，但移植未记录确切源 SHA，不应把日期匹配 SHA 当作已证明的基点。

| 内容 | pi-pstack 0.1.0 | 官方当前 0.15.5 |
| --- | ---: | ---: |
| 技能 | 44 | 47 |
| 原则 | 21 | 23 |
| playbook | 23 | 23 |
| agent | 2 | 2 |

### 实质未同步

- 缺 `principle-attack-the-premise`、`principle-test-behavior-not-implementation` 及其原则路由。
- 缺新 `check-plan.mjs`。
- 旧 `how` 保留 Critique 分支和参考文件，[最新 how](https://github.com/cursor/plugins/blob/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed/pstack/skills/how/SKILL.md)已取消。
- 旧 shipping 强制 Graphite，[最新 shipping](https://github.com/cursor/plugins/blob/5f9a00e39a4c6e67703e83fbc99c0e3fd51c5aed/pstack/skills/poteto-mode/playbooks/shipping.md)改为 gh/Origin 逐个合并并加强 patch-id 检查。
- autopilot-full 的逐轮验证、trunk 独立回归和停滞子代理处置落后。

Task、模型 rules、云端循环和 TodoWrite 的替换属于明示平台适配，不计为漏同步。make-bot-ui、Benny 与指南未逐项说明排除意图。即使豁免这些，通用原则和同名流程的差异仍足以否定最新对齐。

## 替代包

数量取实际归档。上游基线是包记录的来源，不表示本研究已经对所有替代包做完整上游差异审计。多数 peers 为 `*`，不是宿主兼容认证。

| 候选 | registry latest；UTC 日期 | 实数与基线 | 与本机 runner 的关系 |
| --- | --- | --- | --- |
| [@mccune1224/pi-pstack](https://github.com/McCune1224/pi-pstack) | 0.2.0；09-13 | 50 skills；声明基线 0.15.2 | 要求 Nico pi-subagents。声明式 deltas、同步守卫和 doctor 值得借鉴，setup 改 subagents 设置。 |
| [@zenspc/pi-pstack](https://github.com/zenspc/pi-extensions/tree/master/packages/pi-pstack) | 0.6.0；09-09 | 47 skills；基线 0.15.0 | 同样要求 Nico 系统。运行层较轻，可作内容参考。 |
| [poteto-pi](https://github.com/marcelormendes/poteto-pi) | 0.1.0；09-05 | 45 skills、37 agents；9 月 4 日基线 | setup 尝试安装 Nico runner，默认 routing，作者声明验证旧 Pi 0.84.4。 |
| [@casualjim/pi-pstack](https://github.com/casualjim/pi-mimir/tree/main/packages/pi-pstack) | 0.1.9；09-25 | 实数 45 skills；基点未验证 | 通过 pi-herdr-agents 协议注册角色，不接 Tintinweb。 |
| [potetos-for-everyone](https://github.com/TheOnlyFusionCube/potetos-for-everyone) | 0.1.0；09-10 | 47 skills；portable edition | Pi manifest 只有技能与提示词。postinstall 默认写项目文件，不能未审直接安装。 |
| [bnema/pi-pstack](https://github.com/bnema/pi-pstack) | 此 repo npm 发布未验证；07-28 最后推送 | 40 skills、17 playbooks；README 0.11.12 | 自带 pstack_task runner。较旧，不与 npm 同名目标包混淆。 |

[`pi-subagents`](https://registry.npmjs.org/pi-subagents) 和 [`@tintinweb/pi-subagents`](https://registry.npmjs.org/%40tintinweb%2Fpi-subagents)不是同一 npm 包或协议：前者使用 `subagent({agent, task})`，后者使用 `Agent({subagent_type, prompt, description})`。不能仅增加工具别名就认定兼容。

McCune 的 [pi-deltas.json](https://github.com/McCune1224/pi-pstack/blob/master/scripts/pi-deltas.json)记录替换理由，并在规则失效时暴露上游 drift。它是维护方法参考，但其发布版仍钉 0.15.2，不是当前 0.15.5。

另确认 `session-orchestrator@5.3.0`、`@miracle3010/ai-orchestrator@0.2.1`、`pi-subagent-workflows@0.2.0`。它们是邻近编排器，不是 pstack 等价移植，本研究未做完整源码或运行审计。

## 建议，尚未成为架构决策

若保留本机现有能力，建议以官方最新固定 ref 为内容源，借鉴 McCune 的可审计替换规则，建立面向 Tintinweb 的薄适配；不要直接叠加旧目标包或竞争 runner。

实施时先确定技能单一来源、模型与 thinking 优先级、角色发现和权限范围，再验证后台调查闭环与持续模式。保留本项目逐 Issue 完成的约束。

所有版本数据均为本次快照。安装、发布或开始实现前，重新核对 npm dist-tags、上游 ref 和宿主 API。

## 归档取舍

保留有助于后续决策、实现和复查的事实、固定来源、代码位置、差异分类和验证结果。详细调查已按主题整理为上述文件，不是代理原始转录的逐字保存。

不保留下载 tarball、解包源码、完整 registry/history 回应、97 个文件的冗长哈希清单、临时脚本或重复草稿。这些可以用固定来源重新获取。上级目录的重复总报告和本次临时下载目录在归档验证后清理，研究入口统一到本仓库。

本次保留的是经过筛选的调查内容，不表示第三方插件已通过运行验证，也不把建议升级为已批准决策。
