# 08: 后置 playbook：babysit、shipping、opening-a-pr、autonomous-run、orchestrate、autopilot

**What to build:** 依赖 GitHub、Bun 脚本或长时间运行的 playbook 在 Pi 中可用，或被明确记录为不可用及原因。

范围：
- 先确认 gh 已登录、Bun 可用。不满足时停止并报告，不自行安装。
- 用一个可丢弃的测试仓库验证 opening-a-pr、babysit、shipping。
- autonomous-run 使用 `/goal`。
- orchestrate、autopilot-full、autopilot-stack 只验证能启动并给出计划；完整长时间运行不在验收范围。

参考：spec 的用户故事 16、50。

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] 记录 gh 登录状态和 Bun 版本
- [ ] opening-a-pr 在测试仓库中开出草稿 PR，提交前运行 interrogate、deslop、no-comments
- [ ] babysit 能读取该 PR 的状态并声明模式
- [ ] shipping 在合并前给出独立验证结论；不合并到任何共享分支
- [ ] autonomous-run 通过 `/goal` 运行一个小任务并正常停止
- [ ] orchestrate 和 autopilot 的启动结果或不可用原因已记录
- [ ] 测试仓库和远端测试 PR 的清理方式已与用户确认
- [x] 证据记录在本 Issue 的 Comments 中

## Comments
### 2026-10-02 状态记录（未开始，仍 Blocked by 05）

- 仅做过预检：`gh` 登录状态与 Bun 1.3.14 可用性已记录，均为环境事实，不构成任何 playbook 的启动或通过证据。
- 05 未完成（UI 恢复需要用户许可新 TaskSpace），本 Issue 的 opening-a-pr、babysit、shipping、autonomous-run、orchestrate、autopilot 均未实机启动；测试仓库与远端 PR 的清理方案未与用户确认。
- 已知事实：本仓库无 CI（记录为不可用）；真实 429 行为至今未观察过。
