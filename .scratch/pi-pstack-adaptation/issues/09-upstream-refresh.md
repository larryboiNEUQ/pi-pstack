# 09: 跟进上游最新版本

**What to build:** 维护者把适配包的上游快照更新到远端最新提交。锚点检查或角色检查失败时，逐项处理并记录。

范围：
- 拉取远端最新提交，记录新的固定提交和 pstack 版本。
- 重新生成适配包，查看与上一版的 diff。
- 处理失效的锚点、新增角色、新增或删除的技能。

参考：spec 的"内容源"和用户故事 40 至 43。

**Blocked by:** 06

**Status:** ready-for-agent
**Completion:** complete（2026-10-02；lead 已提交新 pin，独立 worktree 生成无 diff，第一层/第二层通过；本次文档待 lead 审查提交）

- [x] 新的固定提交和 pstack 版本已记录
- [x] 每个失效锚点都有处理结论：更新锚点、删除改动，或新增改动（无失效锚点，无需修复）
- [x] 新增角色已登记到角色目录，并经用户确认模型分配（N/A：没有新增角色，无需新增分配或确认）
- [x] 第一层和第二层测试通过
- [x] 适配包 diff 已经过审查后提交（生成 diff 为空；新 pin 已由 lead 提交于 aa34638，无生成文件需要另行提交）
- [x] 证据记录在本 Issue 的 Comments 中

## Comments

### 2026-10-02 完成（固定源刷新与独立 worktree 验证）

- 依据 lead 冻结的 `/tmp/pi-pstack-full-spec-evidence/upstream-lead-audit.md`：官方 `https://github.com/cursor/plugins.git` 的 HEAD 已于 2026-10-02 查询并获取为 `c47b12849e43f18d5c374c7069c744cc55b0ea00`，pstack 版本仍为 0.15.5。lead 已在 aa34638 更新 `PINNED_COMMIT`；本次不重新 fetch 或重复源比较。
- lead 审计确认从旧 pin `adf3218ca2f5b9971eedc07a76bef22df7701539` 到新 pin，全部选定输入的字节和模式相同。没有新增/删除技能、失效锚点或新增角色；新增角色的模型分配确认不适用，不声称有新角色经用户确认。
- 从集成基线 `9e99cf14ce16a4315e9542ac1064f3b5ac6d39a8` 建立独立 `pstack-ticket-09` worktree，仅在该 worktree 执行 `node scripts/generate.mjs`：生成 47 个技能，应用 45 条改动。`git diff --exit-code HEAD -- adapted docs/upstream-guide` 无输出变化；未在集成检出重新生成。
- 仅运行一次 `node --test test/generate.test.mjs test/pi-load.test.mjs`，63 项通过、0 失败、0 跳过；覆盖新 pin、base/host/path/setup 四清单栈、metadata-key 角色拒绝及 Pi 加载/离线展开。未运行完整测试集或安装器；没有实机模型调用、全局更新或配置变更。
- 日志：`/tmp/pi-pstack-full-spec-evidence/issue09-tests.log`。CI 未配置，记为不可用，而非通过。
- 本次只有 README、当前 spec 内容源和 Issue 06/09 完成记录的文档 diff，等待 lead 审查提交与后续集成；没有修改提示词、模型表、角色目录、manifest、role guard 或测试文本。历史 ADR/讨论记录保留原样。
