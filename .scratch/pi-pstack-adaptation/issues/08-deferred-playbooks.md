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

- [ ] 记录 gh 登录状态和 Bun 版本
- [ ] opening-a-pr 本地提交前运行 interrogate、deslop、no-comments；复用已创建的 draft PR #1，不把本轮未重测的新建 PR 步骤声明为通过
- [ ] babysit 能读取该 PR 的状态并声明模式
- [ ] shipping 在合并前给出独立验证结论；不合并到任何共享分支
- [ ] autonomous-run 通过 `/goal` 运行一个小任务并正常停止
- [ ] orchestrate 和 autopilot 的启动结果或不可用原因已记录
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
