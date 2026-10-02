# 03: how 跑通

**What to build:** 用户在真实 Pi 会话中运行 `/skill:how <问题>`，how 的 explorer 和 explainer 子代理按模型表启动、后台完成，主对话回收完整结果并输出架构解释。

范围：
- 用本仓库或另一个小仓库中的真实问题运行 how。
- 发现映射说明或插入行不足时，用声明式改动修正，不手改适配包。

参考：spec 的用户故事 3、4、5、7、8、11、12、24。

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] how explorer 使用 GPT，how explainer 使用 Claude，与用户最后确认的模型表一致；失败时按主模型回退规则报告
- [ ] 两个子代理在后台运行，主对话收到完成通知
- [ ] 主对话回收子代理的完整结果，最终回复基于主对话自己的审查
- [ ] how 引用的原则技能或兄弟技能被成功读取
- [ ] 所有修正都通过声明式改动完成，第一层和第二层测试仍通过
- [ ] 证据记录在本 Issue 的 Comments 中

## Comments
