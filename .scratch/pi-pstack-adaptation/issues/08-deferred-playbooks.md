# 08: 后置 playbook：babysit、shipping、opening-a-pr、autonomous-run、orchestrate、autopilot

**What to build:** 依赖 GitHub、Bun 脚本或长时间运行的 playbook 在 Pi 中可用，或被明确记录为不可用及原因。

范围：
- 先确认 gh 已登录、Bun 可用。不满足时停止并报告，不自行安装。
- 按用户修订复用现有 PR #1：隔离本地 fixture 验证 opening-a-pr 的提交前流程；babysit、shipping 只读真实 PR。既有 draft PR 的创建事实保留，本轮不再创建新 PR 或分支。
- autonomous-run 使用 `/goal`。
- orchestrate、autopilot-full、autopilot-stack 只验证能启动并给出计划；完整长时间运行不在验收范围。

参考：spec 的用户故事 16、50。

**Blocked by:** 05

**Status:** ready-for-agent

**Completion:** complete（2026-10-03；实机验收通过，按用户批准的 PR 复用范围）

- [x] 记录 gh 登录状态和 Bun 版本
- [x] opening-a-pr 本地提交前运行 interrogate、deslop、no-comments（全部通过，fixture 提交 `abd9adc` 只含 logic.mjs 精确改动）；复用已创建的 draft PR #1，不把本轮未重测的新建 PR 步骤声明为通过
- [x] babysit 以 check 模式读取真实 PR #1（head/base/draft/CI 不可用/无评审），未做任何远端变更
- [x] shipping：独立 xai/grok-4.7/xhigh verifier 在精确 head d604c3c/base 0378242 上跑 7/7 定向回归，PASS+NOTES（功能代码证明，非合并授权）；patch-id 已记录
- [x] autonomous-run：PTY 真实 /goal 完成（goal id d437094d…，状态持久化 complete，goal_complete 被接受，goal-proof.txt 为 GOAL_OK\n 精确 8 字节）；交互 CLI 由 harness TERM/KILL 清理（-9），不声称自然退出；print 模式的边界错误记为失败尝试
- [x] orchestrate、autopilot-full、autopilot-stack 的启动计划与能力缺口已记录（受限工具集为 harness 设定，不代表用户 Pi 缺能力；打包 watcher 因会向共享技能目录安装依赖未运行）
- [x] 用户确认复用 PR #1 和现有交付分支，不新增远端测试资源，也不合并或删除既有资源
- [x] 证据记录在本 Issue 的 Comments 中

## Comments
### 用户修订验收方式：复用现有 PR

- 用户明确要求“复用现有pr完成验收吧”。不再新建测试分支、第二条 PR 或测试仓库。
- Opening a PR 的本地门禁仍在私有 fixture 中验收；Babysit、Shipping 读取 `https://github.com/larryboiNEUQ/pi-pstack/pull/1`。创建 PR 本轮不重复测试，权限边界禁止合并、自动合并、评论、关闭和删除。

### 2026-10-02 状态记录（未开始，仍 Blocked by 05）

- 仅做过预检：`gh` 登录状态与 Bun 1.3.14 可用性已记录，均为环境事实，不构成任何 playbook 的启动或通过证据。
- 05 未完成（UI 恢复需要用户许可新 TaskSpace），本 Issue 的 opening-a-pr、babysit、shipping、autonomous-run、orchestrate、autopilot 均未实机启动；测试仓库与远端 PR 的清理方案未与用户确认。
- 已知事实：本仓库无 CI（记录为不可用）；真实 429 行为至今未观察过。
### 2026-10-03 验收完成（lead 判定，含告诫）

依据 `/tmp/pi-pstack-full-spec-evidence/issue08-lead-verdict.md`：08 在用户批准的 PR 复用范围下通过。

- opening-local：三审查席位中 Claude 遇版本门禁→全新 GPT 兜底（已披露），Grok/GPT 实测完成；提交 `abd9adc` 仅含 logic.mjs 一行的精确改动；不重复新 PR 创建，不作为本运行证据。
- babysit：Origin 不可用后用 gh 读真实状态；draft 为合并阻塞，CI 不可用≠通过；打包 watcher 因 bootstrap 会安装依赖到共享技能目录而未运行。
- shipping：实际 xai/grok-4.7/xhigh 独立 verifier 完整回收；在精确 head/base 上 7/7 通过，PASS+NOTES；patch-id `68300074…`；模型表 READ 超出严格探针范围但已如实披露、无写入；历史全量门禁日志（f7706db，无 SHA）是冻结证据而非对本 head 的新执行。
- goal：两次 print 模式失败保留为失败尝试（首次 verbatim recipe 缺 goal_blocked；第二次激活后 0s 退出+边界错误）；修正 readiness（`[Extensions]`+模型标记）后 PTY 一次通过；真实用户目录无 goal state 变更，隔离 agentdir 的 auth/settings 为案例自有副本被进程重写。
- 三个 deferred playbook 仅做只读启动计划，未运行长程序/装依赖/发消息/合并。
- 全部探针进程已结束；PR #1 与交付分支保留不合并不删除。CI 不可用；真实 429 未观察。
