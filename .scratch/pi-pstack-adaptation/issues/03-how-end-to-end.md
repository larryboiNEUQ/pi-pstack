# 03: how 跑通

**What to build:** 用户在真实 Pi 会话中运行 `/skill:how <问题>`，how 的 explorer 和 explainer 子代理按模型表启动、后台完成，主对话回收完整结果并输出架构解释。

范围：
- 用本仓库或另一个小仓库中的真实问题运行 how。
- 发现映射说明或插入行不足时，用声明式改动修正，不手改适配包。

参考：spec 的用户故事 3、4、5、7、8、11、12、24。

**Blocked by:** 02

**Status:** ready-for-agent

**Completion:** complete（2026-10-02；续跑两阶段通过，explainer 达 turn 上限属已知告诫）

- [x] how explorer 使用 GPT，how explainer 使用 Claude，与用户最后确认的模型表一致；失败时按主模型回退规则报告
- [x] 两个子代理在后台运行，主对话收到完成通知
- [x] 主对话回收子代理的完整结果，最终回复基于主对话自己的审查
- [x] how 引用的原则技能或兄弟技能被成功读取
- [x] 所有修正都通过声明式改动完成，第一层和第二层测试仍通过
- [x] 证据记录在本 Issue 的 Comments 中

## Comments
### 2026-10-02 实机验收（通过，续跑方式，lead 核查原始转录后判定）

依据 `/tmp/pi-pstack-full-spec-evidence/issue03-lead-verdict.md` 与两个证据目录 `live-issue03-20261002-192353/`、`live-issue03-cont-20261002-195228/`。这是一次续跑两阶段验收，不是单次不间断运行：

- 首跑：两个 GPT/xhigh explorer（generation-validation、loading-installation，pstack-readonly，后台）均完成且全文结果被 `get_subagent_result wait:true verbose:true` 回收；900 秒父级超时中断了原 Claude explainer。该中断是 harness 预算问题，不是配额失败。
- lead 核查两份 explorer 原始转录后冻结为 findings；续跑以 `/skill:how` 继续，不重复探索。
- 续跑：一个全新配置的 `devin/claude-opus-5.5`/xhigh explainer（e018af17-16df-426）返回最终 `stop`；宿主状态为 `steered`（八轮上限触发收尾），属已知告诫而非正常完成声明。
- 实测角色映射与模型表一致：explorer=GPT/xhigh，explainer=Claude/xhigh。父代理最终答复经自查，引用 worktree `1135a68` 的具体路径，覆盖快照→清单→生成→加载→安装链。
- 读取的相关叶子技能：guard-the-context-window、minimize-reader-load、prove-it-works、boundary-discipline、make-operations-idempotent、unslop、how 的 explorer/explainer prompt 模板。
- 本案例 settings.json 前后逐字节一致、models-store 一致、8 个 agent 哈希不变、worktree 无改动（只读遵守）。
- 范围提醒：对整个适配仓库的广泛探索很慢；本冒烟证明编排与有据回答，不证明延迟或后续所有 workflow。
