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
- [x] 提交前 deslop 和 no-comments 被调用
- [ ] 发现的映射缺口都通过声明式改动修正，第一层和第二层测试仍通过
- [x] 证据记录在本 Issue 的 Comments 中

## Comments
### 2026-10-02 部分实机验收（未完成；lead 核查后记录）

证据目录 `/tmp/pi-pstack-full-spec-evidence/live-issue05-20261002-210604/`（0700 私有）。fixture 提交链：`817d22d` baseline → `c0a20b2` fix(normalize) → `484721d` feat(slugify) → `2b748de` Share private whitespace tokenization。

- investigation（237s 完成）与 bug-fix（656s 完成）交付；bug-fix 先经本地提交修复空字符串用例。
- feature 首跑 1200s 超时（comment-sicko 门在飞行中）；续跑 `issue05-feature-finish` 用全新 comment-sicko（继承 GPT/high，max_turns 3）零删除通过审计，16 测试绿，提交 `484721d`。
- refactoring 首跑 1200s 超时（"Extract shared whitespace renderer" 委派未完成）；续跑按 lead 冻结的 `whitespaceTokens(text)` seam 落地：先整体 toLowerCase 再 split，normalize 保留空输入特例与 `|| null` fallback，16 行为矩阵（含 Unicode 大小写）全绿，提交 `2b748de`。
- 实测身份（来自子代理转录）：`xai/grok-4.7`/xhigh 切实运行了实现席位；`devin/claude-opus-5.5` 全部 spawn 报 "Your Windsurf version is out of date"（版本门禁，非 429），按规则以全新 GPT 兜底；兜底 thinking 为显式 high 或继承 medium（见各 case）。
- UI 验证未通过：ego-browser TaskSpace 6 页面 viewport 为 0×0（`Cannot take screenshot with 0 width`；full-page CDP 超时），两处输入验证未运行；TaskSpace 已 keep:[] 关闭，恢复探测返回 `task space not found: 6`。需要用户批准新建 TaskSpace 才能续验。服务器 pid 63052（`http://127.0.0.1:65436`）保持运行。
- 勾选状态：仅提交前清理门和证据项已勾选；UI 与整体验收仍未完成，不把续跑交付等同于完整验收。
