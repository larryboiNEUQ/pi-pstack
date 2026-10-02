# 01: 生成器与适配包：poteto-mode 能在 Pi 中展开

**What to build:** 用户在 Pi 中输入 `/skill:poteto-mode <任务>` 后，适配包中的 poteto-mode 正文展开，启动时没有 pstack 技能重名警告。适配包由生成器从固定上游快照 `adf3218` 生成，并提交进本仓库。仓库中同时保留上游使用教程原文和一段 Pi 差异说明。

范围：
- 生成器读取上游快照和声明式改动清单，输出适配包。
- 本 Issue 的声明式改动：poteto-mode 改名；排除 make-bot-ui；从 cursor-team-kit 原样带入 deslop、control-cli、control-ui。
- 锚点缺失或匹配多处时生成失败。
- 上游 docs/guide 原样复制到本仓库文档目录，开头加 Pi 差异说明（安装方式、`/skill:poteto-mode`、`/skill:setup-pstack`、`/goal` 替代 `/loop`）。
- 用户共享技能目录中的上游 pstack 软链接改为指向适配包，新增三个 cursor-team-kit 技能的链接。

参考：spec 的"内容源""生成器""声明式改动清单""安装""上游教程"和"测试"第一、二层。

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] 生成器从 `adf3218` 生成适配包，结果提交进仓库，且不在被 git 忽略的目录中
- [ ] 第一层测试通过：poteto-mode 技能名正确；make-bot-ui 不存在；deslop、control-cli、control-ui 与上游逐字节相同；未声明改动的文件与上游逐字节相同；生成两次结果相同
- [ ] 第一层测试通过：删掉一个锚点后生成失败，错误信息指出文件和锚点
- [ ] 第二层测试通过：用 Pi 技能加载函数把适配包与用户现有技能目录一起加载，没有 pstack 技能重名诊断，poteto-mode 可调用
- [ ] 上游教程原文和 Pi 差异说明在仓库中
- [ ] 适配包和上游教程副本附带 pstack 与 cursor-team-kit 的 MIT LICENSE 原文
- [ ] 修改用户共享技能目录前取得用户明确授权；修改后在真实 Pi 会话中 `/skill:poteto-mode` 展开，展开内容包含 baseDir 说明
- [ ] 证据记录在本 Issue 的 Comments 中

## Comments
