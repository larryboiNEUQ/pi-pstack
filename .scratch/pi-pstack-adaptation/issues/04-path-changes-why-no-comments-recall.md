# 04: 路径改动：why、no-comments、recall、reflect、show-me-your-work、create-verification-skill

**What to build:** 依赖 Cursor 路径或 agent 名的技能在 Pi 中可用。why 能查证并汇总；no-comments 能启动 comment-sicko；recall、reflect、show-me-your-work 能读取 Pi 会话记录；create-verification-skill 把生成的技能写进 Pi 能发现的目录。

范围：
- 声明式改动：会话记录位置改为 Pi 会话目录；create-verification-skill 写入位置改为 Pi 项目技能目录；no-comments 调用的 agent 名改为 comment-sicko。

参考：spec 的"声明式改动清单"和用户故事 10、22、23。

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] 第一层测试覆盖本 Issue 的每处改动
- [ ] 实机：why 跑通，investigators 使用 GPT，synthesizer 使用 Claude；失败时按主模型回退规则报告
- [ ] 实机：no-comments 启动 comment-sicko，并对一处真实 diff 给出结果
- [ ] 实机：recall 找到当前项目最近的 Pi 会话记录
- [ ] 实机：reflect 定位到当前会话记录，三个复盘子代理按模型表启动
- [ ] 实机：create-verification-skill 生成的技能能被 Pi 发现；验证后删除测试生成物
- [ ] 证据记录在本 Issue 的 Comments 中

## Comments
