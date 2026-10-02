# 02: 子代理接入与实机冒烟

**What to build:** pstack 技能在 Pi 中能按模型表启动子代理。每家模型的子代理实际使用模型表指定的模型和 thinking 档位。指定模型失败时，回退规则执行并在回复中写明。

范围：
- 映射说明，放在 poteto-mode 的 references 中，内容按 spec 的"映射说明"表。
- 在约 15 个调用子代理、提问或读取模型配置的文件开头插入"在 Pi 上先读映射说明"，作为声明式改动。
- 三个 agent 文件：poteto-agent、pstack-readonly、comment-sicko。都不写 model 和 thinking。
- 按 spec 初始内容写入模型表和订阅档案。

参考：spec 的"映射说明""Agent 文件""模型表""订阅档案""回退规则"和"测试"第三层。

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] 第一层测试覆盖新增的插入行：每处存在且只出现一次
- [ ] 修改用户级 agent 目录和 pstack 配置目录前取得用户明确授权
- [ ] 实机：swe-2、gpt、grok、claude 各起一个子代理，记录每个的实际模型和 thinking 档位，与模型表一致
- [ ] 实机：pstack-readonly 子代理没有写文件工具
- [ ] 实机：指定一个不可用的模型，回退规则执行，回复中写明原定模型、实际模型和原因
- [ ] 实机：记录不传 thinking 时子代理的实际档位
- [ ] 实机：确认 Tintinweb 按文件名还是 frontmatter 名称识别 agent 类型，必要时修正 agent 文件
- [ ] 记录子代理遇到 429 时 Pi 是否先自动重试；无法触发时写明未验证
- [ ] 现有 Explore、worker、reviewer、general-purpose、Plan 文件未被修改
- [ ] 证据记录在本 Issue 的 Comments 中

## Comments
