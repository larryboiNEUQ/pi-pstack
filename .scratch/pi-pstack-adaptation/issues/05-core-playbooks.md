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

**Completion:** complete（2026-10-02；实机验收通过，含续跑与截图能力告诫）

- [x] 四个 playbook 各有一次实机运行记录：匹配的 playbook、清单、调用的技能和子代理（feature/refactoring 经 deadline 续跑完成，见 Comments）
- [x] 写代码的委派使用 Grok，最难任务尝试 Claude；Claude 遇版本门禁后按规则全新主模型兜底并如实披露（非真实 Claude 内容）
- [x] 至少一次 UI 验证走 ego-browser（授权 Space 7 原生 DOM 断言通过；Page.captureScreenshot 在本机不可用为单独记录的能力缺口）
- [x] 提交前 deslop 和 no-comments 被调用
- [x] 发现的映射缺口都通过声明式改动修正，第一层和第二层测试仍通过
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
### 2026-10-02 验收完成（lead 判定，含告诫）

依据 `/tmp/pi-pstack-full-spec-evidence/issue05-lead-verdict.md`：05 通过。补充已验证事实：

- 授权 Space 7（1024×768 viewport）内原生 Ego fill/click 得到两项精确浏览器输出：`result="hello world"` 与 `result=""`；DOM 快照与 finish receipt 已经 lead 核查；未以 HTTP 直连替代 UI 交互。
- `Page.captureScreenshot` 在本机不可用（fromSurface:false/captureBeyondViewport:false 同样超时），无图像证明声明；该能力缺口单独记录。
- Space 6（已关闭无法恢复）与授权 Space 7 均只关闭自有页面；未触碰用户标签、资料、插件或共享设置。
- 所有 Claude 请求均命中同一 Windsurf 版本门禁并以全新主模型兜底，报告中如实披露多样性下降；真实 Grok 席位实际运行。
- 最终代码门禁（f7706db）86 项测试 + 1 项 installed-skills 通过；后续澄清文案源与输出逐字节一致。CI 不可用，真实 429 未观察到。
- 自有 fixture HTTP 服务器（pid 63052，cwd 确认为本 fixture）已按批准 TERM 停止；全部 fixture 提交、浏览器证据与日志保留。
