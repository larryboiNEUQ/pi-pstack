# 07: 多模型对抗：architect、interrogate、arena、swarm

**What to build:** 用户运行 architect、interrogate、arena、swarm 时，各席位按模型表来自不同模型家族，评委和主模型不同家，swarm 的并行写文件子代理在 worktree 中隔离运行。

范围：
- 每个技能用一个小场景实机运行。
- 确认三类对抗席位保留 Claude/GPT/Grok，失败席位回退主模型并报告多样性变化。

参考：spec 的用户故事 15、28、29、30。

**Blocked by:** 03

**Status:** ready-for-agent

**Completion:** complete（2026-10-02；实机验收通过，含 Claude 版本门禁兜底与续跑告诫）

- [x] interrogate：三个审查者分别使用 claude、gpt、grok，汇总时标出各模型的发现（Claude 席位遇版本门禁→GPT 兜底，多样性下降已披露）
- [x] arena：三个参赛者分别使用 claude、gpt、grok；评委与主模型不同家（Claude 版本门禁兜底；独立 Grok cross-judge 续跑完成）
- [x] architect：Phase A 调用 how，Phase B 通过 arena 运行，参赛者与模型表一致（两处 Claude 失败均按 GPT 兜底；续跑含真实 Grok cross-judge 与最终设计包）
- [x] swarm：至少两个写文件的 worker 使用 worktree 隔离，主工作区不受影响；验证后清理 worktree（swarm-native 原生 isolation:worktree 已验证并清理）
- [x] 任一席位失败时回退规则执行，回复中写明多样性是否下降
- [x] 证据记录在本 Issue 的 Comments 中

## Comments
### 2026-10-02 部分实机证据（未完成；lead 冻结记录）

证据目录：`live-issue07-20261002-R27JFJ/`（五独立 fixture，interrogate/arena/architect/swarm/failure-panel）、`live-issue07-continuations-1tbhxqrq/`（swarm-native、architect-continuation）、`live-issue07-arena-fallback-*`/`live-issue07-arena-final-ocvkix_3/`。

- swarm-native（451s 完成）：两个 `xai/grok-4.7`/xhigh worker 以原生 `isolation: "worktree"` 运行（分支 `pi-agent-23e24aa7-660d-472`、`pi-agent-a926fee9-307e-46b`），max_turns 4 轮守卫；预提交基线 `b869c9e` → `13ded0bc4f63cf021bb547bfbf3079b885e1575e`；两份完整结果被回收。
- architect-continuation（770s 完成）：Phase A how（含 Claude 失败→GPT/high 兜底）+ Phase B 三席完成后，xai/grok-4.7/xhigh cross-judge 正常完成；续跑证据中的 final-interface.md、rationale.md、parent-independent-judgment.md、synthesis-review.md 与 cross-judge-full-result.md 构成最终设计包。设计评审不是已执行的实现测试。
- interrogate（338s 完成）：Claude 席位版本门禁失败→全新 GPT/high 兜底；其余两席 GPT/xhigh 与 grok/xhigh 完成；回复注明多样性下降。
- failure-panel（346s 完成）：无效模型经可用性检查拒绝；Claude 再门禁失败→GPT/high 兜底；三份评审全部为 GPT 家族。
- arena：Claude 门禁失败、GPT/xhigh 完成、Grok 设计在首跑 1200s 超时处被截断（stopped/partial）；候选续跑完成后，独立 Grok cross-judge 在 600s 截止时仍未返回，随后一次全新主模型评委兜底在 300s 父进程预算内也未返回完整结果。兜底已发起，但未认证其有效身份或完成结果。
- 隐私事件：一个 swarm 子代理通过 env 子串打印命中了 `*_API_KEY` 环境变量名；值从未进入公共材料（原始转录只留在私有证据目录）。已通知用户考虑轮换。
- 所有 Claude 失败均为同一 Windsurf 版本门禁（非 429；真实 429 仍未观察到）。07 未完成：独立 Arena 评委及该席位的主模型兜底结果缺失；前述 interrogate 与无效配置 panel 的兜底已验证，不由此推定 Arena 通过。
### 2026-10-02 验收完成（lead 判定，含告诫）

依据 `/tmp/pi-pstack-full-spec-evidence/issue07-lead-verdict.md`：07 流程验收通过。

- Arena 收官：续跑 `live-issue07-arena-judge-20261002-231814/` 中唯一 cross-judge（pstack-readonly，实际 `xai/grok-4.7`/xhigh，stop）完成五项 rubric 判断；父级 reconciliation 保留冻结主判与评委判断，分歧如实标注——评委荐 B、主判保留 A 并给出 normalized-path 与 raw OS 语义的区分理由；未声称已实现或证明写入安全。
- swarm-native：原生 `isolation: "worktree"` 下的两个 Grok/xhigh worker 创建 `pi-agent-23e24aa7-660d-472`、`pi-agent-a926fee9-307e-46b` 分支，预提交基线 `13ded0bc`；按验收后约定经 `worktree unlock`+`worktree remove`（无 force）清理 4 个自有 worktree（手动 swarm 的 alpha/beta + 原生两个），目录已不存在，4 个提交对象与分支保留；删除前私有 tar 存档在 `live-issue07-20261002-R27JFJ/worktree-archives/`。
- 首跑 arena/architect 的 1200s 超时与未完成的评委尝试均保留为部分证据，未计入完成。
- 隐私：swarm 一席曾把环境凭据值输出到私有转录，可能随上下文发送至模型服务；值未进入公共材料，原始转录仅存私有证据目录，用户已收到轮换建议。
- 所有 Claude 失败均为同一版本门禁而非 429；真实 429 仍未观察。
- 未发布任何数值排名为外部结论；设计判断仅为 lead 内部验收依据。
