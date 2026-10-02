# 05: 主要 playbook 跑通

**What to build:** 用户用 `/skill:poteto-mode <任务>` 处理常见工程任务时，模型匹配正确的 playbook，把步骤原样抄进 Markdown 清单，并按步骤调用技能和子代理。

范围：
- 用小任务分别走通 Investigation、Bug fix、Feature、Refactoring。
- 确认 UI 验证按映射说明选用工具：Web 用 ego-browser，Electron 或 IDE 用 control-ui，CLI 或 TUI 用 control-cli。
- 确认提交前调用 deslop 和 no-comments。
- 不验证 Opening a PR 的远端部分，留给 08。

参考：spec 的用户故事 1、3、14、17、18、19、20、26、27。

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] 四个 playbook 各有一次实机运行记录：匹配的 playbook、清单、调用的技能和子代理
- [ ] 写代码的委派使用 Grok，最难任务使用 Claude，与上游角色分工一致；新增机械分片可用 swe-2
- [ ] 至少一次 UI 验证走 ego-browser
- [ ] 提交前 deslop 和 no-comments 被调用
- [ ] 发现的映射缺口都通过声明式改动修正，第一层和第二层测试仍通过
- [ ] 证据记录在本 Issue 的 Comments 中

## Comments
