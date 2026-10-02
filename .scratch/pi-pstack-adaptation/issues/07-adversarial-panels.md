# 07: 多模型对抗：architect、interrogate、arena、swarm

**What to build:** 用户运行 architect、interrogate、arena、swarm 时，各席位按模型表来自不同模型家族，评委和主模型不同家，swarm 的并行写文件子代理在 worktree 中隔离运行。

范围：
- 每个技能用一个小场景实机运行。
- 确认 claude 只出现在 interrogate 中。

参考：spec 的用户故事 15、28、29、30。

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] interrogate：三个审查者分别使用 claude、gpt、grok，汇总时标出各模型的发现
- [ ] arena：三个参赛者分别使用 gpt、grok、swe-2；评委与主模型不同家
- [ ] architect：Phase A 调用 how，Phase B 通过 arena 运行，参赛者与模型表一致
- [ ] swarm：至少两个写文件的 worker 使用 worktree 隔离，主工作区不受影响；验证后清理 worktree
- [ ] 任一席位失败时回退规则执行，回复中写明多样性是否下降
- [ ] 证据记录在本 Issue 的 Comments 中

## Comments
