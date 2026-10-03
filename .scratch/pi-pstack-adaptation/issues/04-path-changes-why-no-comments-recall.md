# 04: 路径改动：why、no-comments、recall、reflect、show-me-your-work、create-verification-skill

**What to build:** 依赖 Cursor 路径或 agent 名的技能在 Pi 中可用。why 能查证并汇总；no-comments 能启动 comment-sicko；recall、reflect、show-me-your-work 能读取 Pi 会话记录；create-verification-skill 把生成的技能写进 Pi 能发现的目录。

范围：
- 声明式改动：会话记录位置改为 Pi 会话目录；create-verification-skill 写入位置改为 Pi 项目技能目录；no-comments 调用的 agent 名改为 comment-sicko。

参考：spec 的"声明式改动清单"和用户故事 10、22、23。

**Blocked by:** 03

**Status:** ready-for-agent

**Completion:** complete（2026-10-02；实机验收通过，含 Claude 版本门禁→主模型回退与功能图续跑两项告诫）

- [x] 第一层测试覆盖本 Issue 的每处改动
- [x] 实机：why 跑通，investigators 使用 GPT，synthesizer 使用 Claude；失败时按主模型回退规则报告
- [x] 实机：no-comments 启动 comment-sicko，并对一处真实 diff 给出结果
- [x] 实机：recall 找到当前项目最近的 Pi 会话记录
- [x] 实机：reflect 定位到当前会话记录，三个复盘子代理按模型表启动
- [x] 实机：create-verification-skill 生成的技能能被 Pi 发现；验证后删除测试生成物
- [x] 证据记录在本 Issue 的 Comments 中

## Comments
### 2026-10-02 实机验收（通过，含告诫；lead 核查原始转录后判定）

依据 `/tmp/pi-pstack-full-spec-evidence/issue04-lead-verdict.md`，证据目录 `live-issue04-20261002-202736/` 与 `live-issue04-featmap-20261002-210022/`。

- 第一层测试：路径清单启用后每处声明改动存在且唯一、replace 锚点移除；62/62 通过。
- why：两个 GPT/xhigh investigator 按表运行；Claude/xhigh synthesizer 报版本门禁错误后按规则以全新 GPT/medium 兜底完成；回答区分直接证据与推断。
- no-comments：以小写 `comment-sicko` 类型启动，继承 GPT/medium，完整回收结果，仅报告未应用删除（report-only 遵守）。
- recall：只读两个合成会话，校验 header/cwd 与 typed entries，返回 capsule 契约并识破"测试通过/已发布"的不实结论。
- reflect：三个复盘 seat 中 Claude 报相同版本门禁，全新 GPT 重试完成；Accepted/Rejected/Backlog 已注明独立性降低，不宣称为三家族成功运行。
- create-verification-skill：生成技能经真实 DefaultResourceLoader 项目级发现（无显式路径旁路），helper 可执行且对真实模块运行通过；功能图为后续续跑补齐，四文件与冻结模板逐字节一致。
- 版本门禁（"Your Windsurf version is out of date"）是 provider 侧错误，非 429；因果机制未确定。省略 thinking 的兜底子代理实际为 medium（继承全局默认）。
- 清理：测试生成技能已存档至 `live-issue04-20261002-202736/create-verification/published-skill-archive/`（含 tar 与 sha256 manifest）后按批准范围删除；`.agents/skills` 目录保留。
- 本批各案例 settings/agent 快照前后一致。
