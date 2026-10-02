# Spec：pstack 适配包（Pi）

**Status:** ready-for-agent

相关决定见 `docs/adr/0001-thin-skill-adaptation-on-tintinweb.md`。术语见 `CONTEXT.md`。

## Problem Statement

用户想在 Pi 中使用上游 pstack 的工作流：按任务选 playbook，按原则做决定，用多模型子代理做探索、设计和审查。

现在不能直接使用。原因如下：

- 上游技能为 Cursor 编写。正文引用 Cursor 的 `Task` 工具、Ask 模式、`AskQuestion`、规则文件、云端子代理和 Cursor 会话记录。
- 入口技能名 `Poteto Mode` 不合 Pi 命名规则，`/skill:poteto-mode` 不展开。
- 44 个技能对模型隐藏。正文按名字引用其他技能，模型找不到路径。
- 上游角色默认模型是 Cursor 模型名，在 Pi 中无效。
- 现有 Tintinweb 角色文件写死模型，会覆盖技能指定的模型。
- 社区 Pi 移植都不能原样使用。
- 用户的模型额度不均衡：gpt 最多，grok 次之，devin claude 最少，devin swe-2 不限量。照搬上游默认会很快耗尽 claude。

## Solution

本仓库从固定的上游快照生成适配包，替换用户共享技能目录中的上游 pstack 技能。

- 技能正文保持上游原文，只加少量声明式改动。
- 一份映射说明告诉模型 Cursor 能力在 Pi 中的对应。
- 三个新 agent 文件让技能能指定子代理的模型和工具范围。
- 模型表按用户订阅分配角色模型。指定模型失败时，用主模型重跑。
- 重写的 setup-pstack 让用户在模型更新或订阅变化时快速重新分配。
- 用户显式调用技能，不使用持续模式。

## User Stories

1. 作为 Pi 用户，我想输入 `/skill:poteto-mode <任务>` 后技能正文展开，以便按 pstack 方式开始任务。
2. 作为 Pi 用户，我想在句中用 `$poteto-mode` 或 `$how` 引用技能，以便不必把技能命令放在开头。
3. 作为 Pi 用户，我想在 poteto-mode 展开后，模型自动匹配 playbook 并把步骤原样抄进清单，以便保留上游的流程引导。
4. 作为 Pi 用户，我想让模型能读到每个被引用的原则技能和兄弟技能，以便"读 principle-x"这类指令真正执行。
5. 作为 Pi 用户，我想让 playbook 中的相对路径（例如 `playbooks/feature.md`）正常解析，以便路由不失败。
6. 作为 Pi 用户，我想让 Pi 启动时没有 pstack 技能重名警告，以便确认只加载了一个来源。
7. 作为 Pi 用户，我想让技能中的 `Task` 调用映射到 Tintinweb 的 `Agent`，以便子代理正常启动。
8. 作为 Pi 用户，我想让上游的只读子代理对应到只读工具的 agent，以便探索类子代理不写文件。
9. 作为 Pi 用户，我想让 playbook 中的通用委派使用 poteto-agent，以便子代理先读 poteto-mode 再工作。
10. 作为 Pi 用户，我想让 no-comments 能启动 Comment Sicko，以便提交前清理注释。
11. 作为 Pi 用户，我想让子代理默认在后台运行，完成后通知主对话，以便主对话不被阻塞。
12. 作为 Pi 用户，我想让主对话能回收子代理的完整结果，以便主对话自己审查而不是转述摘要。
13. 作为 Pi 用户，我想让上游的 `AskQuestion` 对应到 `ask_user_question`，以便选项式提问正常工作。
14. 作为 Pi 用户，我想让上游的清单要求改成 Markdown 清单，以便没有 todo 工具也能保留步骤跟踪。
15. 作为 Pi 用户，我想让需要并行写文件的子代理使用 worktree 隔离，以便替代云端并行。
16. 作为 Pi 用户，我想让"长时间自主运行"和 `/loop` 对应到 pi-goal 的 `/goal`，以便自主运行有停止条件。
17. 作为 Pi 用户，我想让 Web UI 验证使用 ego-browser，以便沿用我的默认浏览器技能。
18. 作为 Pi 用户，我想让 Electron 和 IDE 验证使用原版 control-ui，以便桌面应用也有驱动方式。
19. 作为 Pi 用户，我想让 CLI 和 TUI 验证使用原版 control-cli，以便命令行界面有驱动方式。
20. 作为 Pi 用户，我想在提交前使用原版 deslop，以便清理 diff 中的 AI 冗余代码。
21. 作为 Pi 用户，我想让"编写技能"类指令指向 writing-for-agents，以便替代 Cursor 内置的 create-skill。
22. 作为 Pi 用户，我想让 recall、reflect、show-me-your-work 读取 Pi 的会话记录，以便复盘和审计可用。
23. 作为 Pi 用户，我想让 create-verification-skill 把技能写进 Pi 能发现的目录，以便生成的验证技能可被调用。
24. 作为 Pi 用户，我想让每个角色按模型表指定模型和 thinking 档位，以便子代理用我选的模型。
25. 作为 Pi 用户，我想让模型表中没写的角色使用主模型，以便不必配置每个角色。
26. 作为 Pi 用户，我想让写代码和批量读取类角色使用 swe-2，以便脏活不消耗付费额度。
27. 作为 Pi 用户，我想让判断和写作类角色使用 gpt，以便使用主力额度。
28. 作为 Pi 用户，我想让 claude 只在 interrogate 中占一个席位，以便稀缺额度用在对抗价值最高的地方。
29. 作为 Pi 用户，我想让 interrogate、arena、architect 的各席位来自不同模型家族，以便保留对抗检验。
30. 作为 Pi 用户，我想让 arena 的评委和主模型不同家，以便减少自评。
31. 作为 Pi 用户，我想在指定模型因额度、限流或不可用失败时用主模型重跑一次，以便任务不中断。
32. 作为 Pi 用户，我想在每次回退后在回复中看到原定模型、实际模型和原因，以便知道结果的来源。
33. 作为 Pi 用户，我想在回退时保留已产出的部分结果，以便不浪费已完成的工作。
34. 作为 Pi 用户，我想运行 `/skill:setup-pstack` 时看到每个角色的用途、当前模型、建议模型和理由，以便快速做决定。
35. 作为 Pi 用户，我想让 setup-pstack 根据订阅档案分配模型，以便订阅变化后一次调整到位。
36. 作为 Pi 用户，我想让 setup-pstack 标出同家族的新模型和已失效的模型，以便跟上模型更新。
37. 作为 Pi 用户，我想用一句话说明变化（例如"grok 订阅到期"）后调用 setup-pstack，以便少回答问题。
38. 作为 Pi 用户，我想让 setup-pstack 只写入可用列表中的模型，以便不写入无效配置。
39. 作为 Pi 用户，我想让 setup-pstack 写入前备份旧模型表，以便能回滚。
40. 作为维护者，我想从固定上游快照重新生成适配包，以便上游更新时只需重跑。
41. 作为维护者，我想让每处改动带锚点，锚点缺失时生成失败，以便上游原文变化不会静默漂移。
42. 作为维护者，我想让上游出现角色目录中没有的角色时生成失败，以便新角色不会漏配。
43. 作为维护者，我想把生成的适配包提交进仓库，以便上游变化能直接看 diff。
44. 作为维护者，我想让 make-bot-ui 不进入适配包，以便不带入依赖 Cursor webhook 的技能。
45. 作为维护者，我想让三个新 agent 文件不写 model 和 thinking，以便技能指定的模型生效。
46. 作为维护者，我想不修改现有的 Explore、worker、reviewer、general-purpose、Plan 角色，以便其他工作流不受影响。
47. 作为维护者，我想不修改 Pi settings 和已装插件，以便改动范围最小。
48. 作为维护者，我想在仓库中保留上游使用教程原文并加一段 Pi 差异说明，以便用户学习用法。
49. 作为维护者，我想在实机冒烟中记录每家模型的实际模型和 thinking 档位，以便证明模型表生效。
50. 作为维护者，我想让后置 playbook（babysit、shipping、opening-a-pr、autonomous-run、orchestrate、autopilot）在确认 gh 和 Bun 可用后再验证，以便不阻塞主要工作流。

## Implementation Decisions

### 内容源

- 上游快照固定为本机 cursor-plugins 仓库提交 `adf3218`，pstack 版本 0.15.5。
- 从同一仓库的 cursor-team-kit 原样带入 deslop、control-cli、control-ui。三者为 MIT 许可，不依赖 Cursor。
- 跟进上游最新版本另开 Issue。

### 生成器

- 生成器读取上游快照和一份声明式改动清单，输出适配包。
- 每条改动包含：目标文件、锚点、操作（插入、替换、排除、整篇替换）和理由。
- 锚点缺失或匹配多处时，生成失败。
- 生成器检查上游中出现的所有角色名都在角色目录中。
- 适配包提交进仓库，不放进被 git 忽略的构建目录。

### 声明式改动清单

- poteto-mode 的技能名改为 `poteto-mode`。
- 排除 make-bot-ui。
- 在约 15 个调用子代理、提问或读取模型配置的文件开头插入一行：在 Pi 上先读映射说明。涉及 poteto-mode、how、why、swarm、arena、interrogate、reflect、architect、figure-it-out、no-comments、automate-me、technical-writing、principle-prove-it-works，以及 multi-phase-plan、orchestrate 两个 playbook。
- recall、reflect、show-me-your-work 的会话记录位置改为 Pi 会话目录。
- create-verification-skill 的写入位置改为 Pi 能发现的项目技能目录。
- no-comments 调用的 agent 名改为 `comment-sicko`。
- setup-pstack 整篇替换。
- 其他上游文本不改。上游 frontmatter 中的 `mode` 和 `reminder` 保留，Pi 忽略它们。

### 映射说明

映射说明放在 poteto-mode 的 references 中。其他技能按兄弟目录相对路径引用它。内容如下：

| 上游 | Pi |
|---|---|
| `Task` + `subagent_type` | Tintinweb `Agent` |
| `generalPurpose` + `readonly: true` | `pstack-readonly` |
| `generalPurpose` + 读写 | `poteto-agent` |
| `Comment Sicko` | `comment-sicko` |
| `model` | 模型表中该角色的 `provider/model`，`:` 后缀拆为 `thinking` |
| 角色缺失、`auto`、`inherit-parent` | 不传 `model`，使用主模型 |
| `run_in_background`、resume | 同名参数；`get_subagent_result`；`steer_subagent` |
| `environment: "cloud"` | 本地运行；并行写文件时 `isolation: "worktree"` |
| `AskQuestion` | `ask_user_question` |
| todolist | Markdown 清单 |
| `pstack-models.mdc` | 模型表 |
| `/loop`、自主运行 | `/goal` |
| control-ui（Web） | ego-browser |
| control-ui（Electron、IDE） | control-ui |
| create-skill | writing-for-agents |
| cursor-team-kit 的 deslop、control-cli | 适配包内同名技能 |
| 兄弟技能和原则技能 | 按 `<本技能目录>/../<技能名>/SKILL.md` 读取 |
| 回退 | 回退规则：主模型重跑一次，回复中写明 |

映射说明列出不提供的能力：持续模式、后台路由到 poteto-agent、云端子代理、make-bot-ui、Cursor 自动化。

### Agent 文件

| agent | 工具 | 提示词要点 |
|---|---|---|
| `poteto-agent` | 全部 | 工作前完整读 poteto-mode，包括原则索引 |
| `pstack-readonly` | read、bash、grep、find、ls | 只读；bash 只做只读检查 |
| `comment-sicko` | 全部 | 上游 Comment Sicko 原文 |

三个文件都不写 model 和 thinking。安装位置为用户级 agent 目录。

### 模型表

格式沿用上游：每行一个角色，值为一个模型或逗号分隔的列表。模型写作 `provider/model:thinking`。初始内容：

```
feature, refactoring: devin/swe-2:high
bug-fix: devin/swe-2:high
perf-issue: devin/swe-2:high
hillclimb: devin/swe-2:high
swarm workers: devin/swe-2:high
how explorer: devin/swe-2:high
why investigators: devin/swe-2:high
recall slices: devin/swe-2:medium
automate-me slices: devin/swe-2:medium
verification source wave: devin/swe-2:medium
comment sicko: devin/swe-2:medium
hardest tasks: openai/gpt-6.1-sol:xhigh
judgment and prose: openai/gpt-6.1-sol:high
how explainer: openai/gpt-6.1-sol:xhigh
why synthesizer: openai/gpt-6.1-sol:xhigh
reflect tooling: openai/gpt-6.1-sol:high
reflect judgment, synthesizer: openai/gpt-6.1-sol:high
reflect divergent: xai/grok-4.7:high
interrogate reviewers: devin/claude-opus-5.5:xhigh, openai/gpt-6.1-sol:xhigh, xai/grok-4.7:xhigh
arena runners: openai/gpt-6.1-sol:xhigh, xai/grok-4.7:xhigh, devin/swe-2:high
architect runners: openai/gpt-6.1-sol:xhigh, xai/grok-4.7:xhigh, devin/swe-2:high
arena cross-judge pool: xai/grok-4.7:xhigh, openai/gpt-6.1-sol:xhigh
show-me-your-work auditor: xai/grok-4.7:high, openai/gpt-6.1-sol:high
```

- show-me-your-work 审计员从列表中选和干活模型不同家的一个。
- autopilot 和 orchestrate 的负责人不配置，使用主模型。
- 上游原有的 `reflect judgment, divergent, synthesizer` 一行拆为两行。recall、automate-me、verification source wave、comment sicko 是本适配新增的角色，在映射说明中声明。

### 订阅档案

- 记录每个模型提供方或模型的额度等级：主力、次要、稀缺、不限量。
- 初始内容：主力 openai gpt；次要 xai grok；稀缺 devin claude；不限量 devin swe-2。

### setup-pstack

1. 读取角色目录、订阅档案和模型表。
2. 运行 `pi --list-models`，标出同家族新模型和已失效模型。
3. 按规则分配：脏活用不限量模型；判断写作用主力额度；对抗类技能各席位家族互不相同；稀缺模型最多放一个对抗席位；评委与主模型不同家。
4. 输出表格：角色、用途、当前模型、建议模型、理由。
5. 用 `ask_user_question` 让用户整体接受或修改某几行。
6. 检查所选模型都在可用列表中。
7. 备份旧模型表，写入新模型表。
8. 可选：提议生成项目验证技能，沿用上游第 7 步。

角色目录随适配包发布。每个角色包含：名称、所在技能、用途、工作类别（脏活、判断写作、对抗、跨家族审计）。

### 安装

- 用户共享技能目录中的上游 pstack 软链接改为指向适配包。新增 deslop、control-cli、control-ui 的链接。
- 三个 agent 文件放入用户级 agent 目录。
- 模型表和订阅档案放入 Pi 用户目录下的 pstack 目录。
- 修改任何用户级目录前，必须得到用户在当次 Issue 中的明确授权。

### 回退规则

1. 子代理因额度、限流或模型不可用而失败时，用主模型重跑一次。
2. 回复中写明原定模型、实际模型和原因。
3. 保留已产出的部分结果。
4. 不做同家族降级，也不依赖 Tintinweb 的模糊匹配。

### 上游教程

上游 docs/guide 原样复制到本仓库文档目录。开头加一段 Pi 差异说明：安装方式、`/skill:poteto-mode` 写法、`/skill:setup-pstack`、`/goal` 替代 `/loop`。

## Testing Decisions

好的测试只检查外部行为：给定上游输入，适配包是什么样子；给定适配包，Pi 加载出什么。不检查生成器的内部函数。

### 第一层：生成器

- 输入为固定上游快照，或为测试构造的最小上游目录。
- 断言：poteto-mode 技能名正确；make-bot-ui 不存在；每处插入都存在且只出现一次；deslop、control-cli、control-ui 与上游逐字节相同；未声明改动的文件与上游逐字节相同。
- 断言：删掉某个锚点后生成失败，错误信息指出文件和锚点。
- 断言：上游出现未登记的角色名时生成失败。
- 断言：生成两次结果相同。

### 第二层：Pi 技能加载

- 用 Pi 自带的技能加载函数读取适配包，与用户现有技能目录一起加载。
- 断言：没有 pstack 技能的重名诊断；poteto-mode 可见于命令列表；展开结果包含技能正文和 baseDir 说明。
- 先例：已有调查用 Pi 的 `loadSkillsFromDir` 和 `loadSkills` 做过同类检查，结果记录在研究证据 JSON 中。

### 第三层：实机冒烟

- 在真实 Pi 会话中运行，不能自动化。证据记录在对应 Issue 的 Comments 中。
- 每家模型（swe-2、gpt、grok、claude）各起一个子代理。记录实际模型和 thinking 档位。
- 故意指定一个不可用的模型，确认回退规则执行并在回复中写明。
- 确认不传 thinking 时子代理的实际档位。
- 后续 Issue 用小任务走通对应技能和 playbook。

## Out of Scope

- 持续模式、每轮提醒、自动路由。
- `/poteto-mode` 转交后台 poteto-agent。
- 云端子代理和 Cursor 自动化，包括 automations/benny。
- make-bot-ui。
- Pi extension、社区 Pi 移植、第二套子代理 runner。
- 修改 Pi settings、已装插件、默认模型或现有角色文件。
- npm 发布、包名、远程仓库。
- 跟进上游最新版本（另开 Issue）。

## Further Notes

### 与上游的差异汇总

- 保留原文：全部原则技能、playbook 步骤与路由、how、why、architect、arena、interrogate、swarm、reflect 的流程。
- 平台替换：见映射说明表。
- 删除：见 Out of Scope 前五项。
- 减弱：claude 只在 interrogate 中出现；arena 和 architect 的 claude 席位改为 swe-2；thinking 最高为 xhigh，没有 max 和 fast；reflect、recall 读取的会话格式不同；swarm 并行规模受本机和额度限制；清单没有界面。
- 新增：按订阅分配模型；回退规则；setup-pstack 读取订阅档案并检测新模型；锚点检查。

### 未验证项

1. swe-2 能否在 Tintinweb 子代理中正常启动，thinking 档位是否生效。
2. 不传 thinking 时，子代理使用主对话实时档位还是全局默认档位。
3. 子代理遇到 429 时，Pi 是否先自动重试。
4. Tintinweb 按 agent 文件名还是 frontmatter 名称识别 agent 类型。
5. 现有 Explore、worker、reviewer 引用的 openai-codex 模型不在当前模型列表中。本 spec 不处理。
