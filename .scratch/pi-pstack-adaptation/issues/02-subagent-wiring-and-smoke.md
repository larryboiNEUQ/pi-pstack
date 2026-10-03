# 02: 子代理接入与实机冒烟

**What to build:** pstack 技能在 Pi 中能按模型表启动子代理。每家模型的子代理实际使用模型表指定的模型和 thinking 档位。指定模型失败时，回退规则执行并在回复中写明。

范围：
- 映射说明，放在 poteto-mode 的 references 中，内容按 spec 的"映射说明"表。
- 在约 15 个调用子代理、提问或读取模型配置的文件开头插入"在 Pi 上先读映射说明"，作为声明式改动。
- 三个 agent 文件：poteto-agent、pstack-readonly、comment-sicko。都不写 model 和 thinking。
- 按 spec 初始内容写入模型表和订阅档案。

参考：spec 的"映射说明""Agent 文件""模型表""订阅档案""回退规则"和"测试"第三层。

**Blocked by:** 01

**Status:** ready-for-agent
**Completion:** complete（2026-10-02；实机验收通过，429 项按记录未触发）

- [x] 第一层测试覆盖新增的插入行：每处存在且只出现一次
- [x] 修改用户级 agent 目录和 pstack 配置目录前取得用户明确授权
- [x] 实机：swe-2、gpt、grok、claude 各起一个子代理，记录每个的实际模型和 thinking 档位，与模型表一致
- [x] 实机：pstack-readonly 子代理没有写文件工具
- [x] 实机：指定一个不可用的模型，回退规则执行，回复中写明原定模型、实际模型和原因
- [x] 实机：记录不传 thinking 时子代理的实际档位
- [x] 实机：确认 Tintinweb 按文件名还是 frontmatter 名称识别 agent 类型，必要时修正 agent 文件
- [x] 记录子代理遇到 429 时 Pi 是否先自动重试；无法触发时写明未验证
- [x] 现有 Explore、worker、reviewer、general-purpose、Plan 文件未被修改
- [x] 证据记录在本 Issue 的 Comments 中

## Comments
### 2026-10-02 离线层完成（非实机）

用户对整个 spec 的实现授权（含写入 `~/.pi/agent/agents` 三个新文件与 `~/.pi/agent/pstack` 两个配置文件）已执行：

- 生成：`adapted/agents/`（poteto-agent、pstack-readonly、comment-sicko）、`adapted/config/`（models.md、subscriptions.md）、`poteto-mode/references/`（pi-host.md、roles.json、default-models.md、default-subscriptions.md），13 处技能和 2 处 playbook 的"先读映射说明"插入，第一层测试 28/28 通过（插入行存在且唯一、agent 无 model/thinking、readonly allowlist、失败不改旧输出、符号链接拒绝等）。日志 `/tmp/pi-pstack-full-spec-evidence/issue02-tests.log`、`issue02-rework.log`、`issue02-nested.log`。
- 安装（`scripts/install.mjs --apply`，stable 检出 4f1fcf8）：5 个文件全部新建；`~/.agents/skills` 未动，settings.json 哈希不变，既有 5 个 agent（Explore/Plan/general-purpose/reviewer/worker）哈希前后一致。日志 `/tmp/pi-pstack-full-spec-evidence/issue02-install.log`。
- 守卫更新（127fecc）：poteto-agent、comment-sicko 两个既有安装文件先逐字节比对 `git show 4f1fcf8:adapted/agents/<file>`（均 GUARD-OK）后备份到 `~/.agents/skill-backups/pstack-agent-update-20261002-182455/`（含 manifest 与恢复说明），再复制新版本；pstack-readonly 与配置种子未动。generic installer 的覆盖行为未改。
- 实际加载器验证（Tintinweb `loadCustomAgents`，离线，非运行时 spawn）：三个 agent 均按 frontmatter name 注册（确认 name 字段优先，文件内 `name: comment-sicko` 生效）；均 model/thinking = null（未 pin）；pstack-readonly builtinToolNames 恰为 read,bash,grep,find,ls 且 extensions=false；allowedSubagents：poteto-agent = [poteto-agent, pstack-readonly, comment-sicko]，comment-sicko = [pstack-readonly, poteto-agent]，pstack-readonly 无（undefined）。总注册 8 个 agent、无覆盖告警。日志 `issue02-agents-registered.log`、`issue02-nested-agents-check.log`。
- `npm run test:installed`（stable 检出）：47 个适配名 canonical 落 `adapted/`，无重名，tdd/teach 不受影响，make-bot-ui 缺席。日志 `issue02-test-installed.log`。
- 429 自动重试行为：未验证（需实机触发）。

历史状态：当时剩余实机项等待网络授权。下方实机验收记录已取代这一状态；未执行的项目不算完成。
### 2026-10-02 实机验收（通过，lead 核查原始事件后判定）

验收依据为 `Agent` 返回的子代理 `.output` JSONL 原始事件而非父代理自述；完整记录见 `/tmp/pi-pstack-full-spec-evidence/issue02-lead-verdict.md` 与 `live-20261002-191327/`。

- 四个后台 `pstack-readonly` 子代理均完成且实测身份与请求一致：openai/gpt-6.1-sol·xhigh、xai/grok-4.7·xhigh、devin/claude-opus-5.5·xhigh、devin/swe-2·medium。
- 子代理实际工具仅为 read/bash/grep/find/ls，extensions 关闭，无任何写/编辑/委派工具调用；bash 只读约束为指令级而非沙箱。
- 不传 thinking 的子代理在父代理 high 档位下实际运行 GPT·medium，即回落到全局默认而非继承父档位（已按实测记录）。
- 不可用 provider/model 返回 `Model not found`；随后新建未 pin 的 GPT 子代理以显式 high 完成并返回 FALLBACK_PROBE；未使用 resume，未改持久表。
- 8 个 agent 文件哈希前后一致；`settings.json` 指纹发生变化——因未留存变更前内容，无法确定被改字段与写入方，不声称配置未变；当前选中项仍为 openai/gpt-6.1-sol/medium。原文件已保留。
- 观察到一次连接错误的自动重试并成功；未触发真实 429，按本项允许记为"未验证"。
- 原始会话 JSONL 与 provider 签名属私有材料，不进公开仓库。
