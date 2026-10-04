> **Pi 适配说明（本仓库添加）**：本教程是上游 pstack 原文，针对 Cursor 编写。Pi 安装不同：先在本仓库运行 `npm run generate`，将 `adapted/skills/` 下的技能链接到 `~/.agents/skills/`（先检查同名冲突并备份），再用 `node scripts/install.mjs` 预检，经授权后加 `--apply` 安装三个 agent 与配置种子；不要在 Pi 中使用 Cursor 的 `/add-plugin pstack`。`/poteto-mode` 写作 `/skill:poteto-mode`，其他技能同理写作 `/skill:<名称>`，或在句中输入 `$<名称>`；模型配置使用 `/skill:setup-pstack`；有界自主续跑仍用已安装的 pi-goal `/goal` 并写明停止条件；定时 `/loop` 与 `/loop 1h` 未验证，不要映射到 `/goal`，也不要另装调度器；云端子代理、Cursor 自动化和持续模式不提供。完整差异见本仓库 `.scratch/pi-pstack-adaptation/spec.md`。

# The pstack guide

pstack works best when you stop micromanaging the agent. You describe what you want and how you'll know it's done. `/poteto-mode` picks the playbook, runs the other skills as the steps need them, and shows you the evidence. This guide teaches that habit with realistic prompts.

Here's what you'll learn:

1. [Set up pstack](./01-setup.md). Install the plugin and pick your models.
2. [Route work through `/poteto-mode`](./02-poteto-mode.md). Give it a goal and watch it pick a playbook.
3. [Understand the code](./03-understand.md). `/how`, `/why`, `/pstack-teach`, and `/recall` before you edit anything.
4. [Design the change](./04-design.md). `/architect`, `/arena`, `/swarm`, and `/interrogate` before code locks in a shape.
5. [Build and clean the change](./05-build-and-clean.md). The build playbooks, `/pstack-tdd`, `/unslop`, and `/no-comments`.
6. [Verify and ship](./06-verify-and-ship.md). Prove behavior on the real app, then open a focused PR and drive it to merged.
7. [Run work while you sleep](./07-overnight.md). An overnight contract, a decision log you can audit, and the playbooks that scale past one agent.
8. [Steer with principle names](./08-principles.md). The 24 names that redirect an agent mid-task.
9. [Make it yours](./09-make-it-yours.md). Your own mode, plus how to test a skill change.
10. [Recipes and pitfalls](./10-recipes-and-pitfalls.md). Prompts to copy and mistakes to skip.

Read the pages in order the first time. After that, each page stands alone.

## If you only remember one thing

Give the agent a goal and a way to check it, in your own words:

```text
/poteto-mode the export writes duplicate rows when a retry lands mid-run. repro first, then fix and verify.
```

You don't need to name a playbook or list skills. "repro first" and a checkable outcome are all the routing signal `/poteto-mode` needs. It matches the Bug fix playbook, copies the steps into a todo list, and calls the right skills as each step fires.

Next: [Set up pstack](./01-setup.md).
