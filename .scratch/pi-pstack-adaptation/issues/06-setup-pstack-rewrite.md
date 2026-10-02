# 06: 重写 setup-pstack：角色目录、订阅档案、角色检查

**What to build:** 用户在模型更新或订阅变化后运行 `/skill:setup-pstack`（可带一句说明），看到每个角色的用途、当前模型、建议模型和理由，确认后写入新模型表。上游出现未登记的角色时，生成器失败。

范围：
- 角色目录随适配包发布。每个角色包含名称、所在技能、用途、工作类别。
- 生成器检查上游出现的角色名都在角色目录中。
- setup-pstack 整篇替换，步骤按 spec 的"setup-pstack"一节。

参考：spec 的"订阅档案""setup-pstack"和用户故事 34 至 39、42。

**Blocked by:** 02

**Status:** ready-for-agent
**Completion:** complete（2026-10-02；lead 验收代码与 fixture-only 实机流程，真实用户配置未改动）

- [x] 第一层测试：上游出现未登记角色时生成失败，错误信息指出角色和文件
- [x] 角色目录覆盖模型表中的全部角色
- [x] 实机：带说明"grok 订阅到期"运行 setup-pstack，建议表中不再出现 grok，且对抗类技能各席位家族仍不同
- [x] 实机：建议表标出模型列表中同家族的新模型和已失效模型
- [x] 实机：只写入可用列表中的模型；写入前备份旧模型表
- [x] 实机运行后恢复用户确认的模型表（fixture 已守卫恢复；真实用户表从未改动）
- [x] 证据记录在本 Issue 的 Comments 中

## Comments

### 2026-10-02 完成（lead 判定；隔离 fixture 验收）

- 权威结论：`/tmp/pi-pstack-full-spec-evidence/issue06-lead-verdict.md`。lead 已审查完整代码/测试/生成输出 diff，并独立核对真实 fixture 目标和备份字节、认证模型列表及 thinking 证据；本记录不重新推导结论。
- 生成器整篇复制冻结的 setup 模板；角色检查先于整篇替换 hash 检查。第一层角色漂移、目录覆盖及失败保留旧输出的证据见 `issue06-tests.log`；Issue 09 的新 pin/四清单栈回归见 `issue09-tests.log`，均位于上述私有证据目录。CI 不可用。
- proposal-only 实机使用真实已安装配置的副本，仅把副本的 `bug-fix` 行替换为预定的失效模型。建议覆盖全部角色，标出该模型不可用、列出同家族候选、排除所有 Grok，并维持各 panel 的 Claude/GPT/SWE 家族差异；没有把候选声称为有已证实发布时间的新模型。
- lead 编写并确认接受的数据后，实机刷新认证列表、对两个 fixture 文件建立唯一且保留原字节的备份、在目标旁暂存并重读，再仅替换两个 fixture 目标。proposal 与写入阶段分别保存完整真实用户 settings/模型表/订阅档案的前后副本；均未变化，无真实用户表需要恢复。
- case：`/tmp/pi-pstack-full-spec-evidence/live-issue06-20261002-195357-hy8nvu48/`。proposal 日志为该目录的 `stdout.jsonl`、`final-proposal.md`；写入日志为 `accept-20261002-200936-khwrvgpo/stdout.jsonl`、`final-result.md`。完整会话和 provider 签名只保存在私有证据中，不进入公开仓库。
- 写入验收后，先检查两个 fixture 目标的当前字节均仍等于 lead 接受的数据，再从写入阶段的 `fixture-before/` 恢复且核对字节；恢复证据为 case 下的 `fixture-restore-evidence.json`。所有 after 副本、唯一备份和运行证据保留；没有重新运行 proposal、writer 或模型测试。
