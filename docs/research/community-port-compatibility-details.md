# 社区移植兼容性补充

调查日期为 2026-09-30。版本与实数汇总见 [社区对比](2026-09-30-community-package-comparison.md)。本文只保留会影响选择、设置写入和维护的补充信息，未运行这些候选插件。

## 两种 subagents 包不可混同

本机 `@tintinweb/pi-subagents` 提供 `Agent`、`SubagentWorkflow`、`get_subagent_result` 和 `steer_subagent`。Nico 的独立 npm 包 `pi-subagents` 提供小写 `subagent`，并使用另一套设置和 agent manifest。

调查时前者 npm 版本为 0.19.0，后者为 0.73.1。名字相近不能证明 API、模型配置或恢复语义一致。以下三个候选明确针对 Nico 系统；casualjim 则使用第三种角色协议。

## Zenspc

[@zenspc/pi-pstack 0.6.0](https://github.com/zenspc/pi-extensions/tree/master/packages/pi-pstack)发布于 09-09，实际为 47 skills、23 playbooks、2 agents。[同步提交](https://github.com/zenspc/pi-extensions/commit/79943ee84f9fb76bd8e57c78870708616febaac7)记录 0.15.0 / 71ed0d1；排除 make-bot-ui 和 Benny，并补 Pi 的 deslop/setup。

- 角色配置存于独立 `~/.pi/agent/pstack/models.json`。
- 持续 mode 用 session entry，四个技能自动可见。
- 要求 Nico 的 runner，角色通过 `pi.subagents.agents` manifest 暴露。
- [reground 脚本](https://github.com/zenspc/pi-extensions/blob/master/packages/pi-pstack/scripts/reground-from-cursor.mjs)和测试有助于审查同步，但本次没有执行。
- Pi host peer 为 `@earendil-works/pi-coding-agent: *`，不是 0.99.1 认证。

适合作为较轻的内容参考，不应原样视为本机 runner 的插件。

## McCune

[@mccune1224/pi-pstack 0.2.0](https://github.com/McCune1224/pi-pstack)发布于 09-13，实数为 50 skills、23 playbooks、2 agents。搜索结果出现的 0.1.0 已不是此次 registry latest。

[pi-deltas.json](https://github.com/McCune1224/pi-pstack/blob/master/scripts/pi-deltas.json)钉住上游 0.15.2 / `5bf2b1544db739998121a306340631963c2ff3de`，替换规则有理由，失效规则能暴露 drift。额外补 control-cli、control-ui、create-skill、deslop。本次未独立执行其完整同步守卫或变异测试。

- `/pstack-setup` 写用户或项目 settings 的 `subagents.*`，项目优先，默认 inherit。
- 它可能重新配置同名 worker/reviewer 的模型策略，不能假定不会影响现有工作流。
- sticky、上下文阈值和 compaction 机制比目标旧包完整，但仍需宿主集成测试。
- 依赖 Nico 的 `subagent` 工具。doctor 仅发现同名工具不足以证明协议兼容。
- Pi AI、coding-agent、TUI 和 typebox peers 为 `*`，带 optional metadata；不代表实测本机版本。

是同步维护方法的首选参考，但不是当前环境的直接安装建议，也不是 0.15.5 全量对齐声明。

## Poteto-pi

[poteto-pi 0.1.0](https://github.com/marcelormendes/poteto-pi)发布于 09-05，实数为 45 skills、23 playbooks、37 agents，21 principles。作者记录 09-04 的上游基线，声明验证 Pi 0.84.4。

- setup 写 `pstack/models.md`，并尝试安装 `pi-subagents@0.64.0`。
- 默认开启 routing，增加多个 role agents 和 pstack 状态、todo、transcript 工具。
- 委派、list/runs 及设置逻辑针对 Nico 协议。
- 明确不移植云代理、Benny、SSH 和 Grok UI；另增加 loop。
- Host peers 为 `*`，未在本机 0.99.1 运行。

默认行为与安装改动较多，不优先叠加到现有环境。

## Casualjim

[@casualjim/pi-pstack 0.1.9](https://github.com/casualjim/pi-mimir/tree/main/packages/pi-pstack)发布于 09-25。归档实数 45 skills，README 声称 46，不一致；实际有 23 playbooks、2 agents。精确上游基点未确认。

[roles.ts](https://github.com/casualjim/pi-mimir/blob/main/packages/pi-pstack/extensions/pstack/roles.ts)通过 `pi-herdr-subagents:roles:discover:v1` 事件向 pi-herdr-agents 注册角色。它删除自身 runner，但没有因此对接 Tintinweb。mode、外部操作确认仍由自己的 extension 提供。

Node 要求至少 22，host peers 为 `*`。发布时间较新不证明上游最新对齐或本机协议兼容。

## Potetos-for-everyone

[potetos-for-everyone 0.1.0](https://github.com/TheOnlyFusionCube/potetos-for-everyone)发布于 09-10，实际 47 skills、23 playbooks、3 agents。[UPSTREAM.json](https://github.com/TheOnlyFusionCube/potetos-for-everyone/blob/main/UPSTREAM.json)记录 71ed0d1，但 mode 是 portable edition 改写，不能把宣传的 100% parity 当作已验证事实。

Pi manifest 仅技能和提示词，不自动注册 Pi mode 或 runner。文本使用通用委派说法，不是 Tintinweb 的明确调用契约。

[npm/postinstall.mjs](https://github.com/TheOnlyFusionCube/potetos-for-everyone/blob/main/npm/postinstall.mjs)默认尝试往安装目标项目复制技能和修改指令。`POTETOS_SKIP_AUTO_INSTALL=1` 可以跳过，但是否安装仍需单独授权和审查。没有 Pi host peers，Node 要求至少 18；这不构成运行认证。

## Bnema

[bnema/pi-pstack](https://github.com/bnema/pi-pstack)最后推送为 07-28，实际 40 skills、17 playbooks、0 bundled agents。README 声称上游 0.11.12，未记录源 SHA。

自带 `pstack_task` 子进程 runner 和独立模型配置。内容较旧，且此仓库的 npm 发布未确认，不能和 kkgogogo17 的 npm 同名包混淆。作者最低宿主声明为 0.82.1，不证明当前兼容。

## 选择边界

没有候选完成本机集成运行验证。peer `*`、同名工具存在、CI 曾成功或最近发布都不是兼容证明。

保留现有 Tintinweb 的方向仍是建议。若用户选择换 runner，应重新审查角色注册、模型与 thinking、权限、状态恢复和同名配置迁移，不同时盲装多套竞争系统。

session-orchestrator、ai-orchestrator、pi-subagent-workflows 只做 registry/manifest 级调查，不能据此选为 pstack 等价物或安全替代。
