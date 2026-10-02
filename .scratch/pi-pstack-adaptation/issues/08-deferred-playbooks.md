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
- [ ] 证据记录在本 Issue 的 Comments 中

## Comments
