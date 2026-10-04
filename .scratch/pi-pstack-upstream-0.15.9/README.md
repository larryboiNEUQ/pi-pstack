# pstack 0.15.9 pin

Measured on this isolated worktree. Not an install receipt and not a CI receipt.

## Source

- Local repo: `$HOME/.agents/repos/cursor-plugins`.
- Local HEAD at inspection: `adf3218ca2f5b9971eedc07a76bef22df7701539`. The pin is not that HEAD.
- Pin: `e43c7ee26e0038c6c1fa8380dd34ce86ff94cb2a`.
- `git show e43c7ee26e0038c6c1fa8380dd34ce86ff94cb2a:pstack/.cursor-plugin/plugin.json` reports `"version": "0.15.9"`.
- Previous pin: `c47b12849e43f18d5c374c7069c744cc55b0ea00` (manifest 0.15.5). Issue 09 remains that older record.
- Selected input diff is 21 pstack paths, 198 insertions and 66 deletions. `cursor-team-kit` deslop, control-cli, control-ui, and LICENSE had no diff.
- setup-pstack SHA-256 is still `125dd0c8f588782cfb271efae8f97a0719e43e79f56b3495c095f460bcee6389`.
- New skill directories: `correct`, `benchmark-checklist`, `principle-explain-the-number`. Adapted skill count is 50.

## Design

The domain shape stays the existing `Change` discriminated op registry plus `GenerationResult`. Four ordered registries remain the only adaptation input. `scripts/generate.mjs` remains the only writer of `adapted/` and `docs/upstream-guide/`. No new runner, op, or compiler.

Host gaps are `insert-before` banners, the same shape as the existing multi-phase banner, plus the `pi-host.md` overlay. Upstream phases, fresh-owner steps, hourly tick text, and PR body sections stay. The banner is what stops those host instructions from bypassing the mapping.

The parent brief records that cross-judge rejected mapping hourly `/loop 1h` to `/goal`. This worktree did not rerun that review. Bounded continuation still uses the installed pi-goal `/goal` with an explicit stop condition. Timed `/loop` and `/loop 1h` are unsupported and unverified. No scheduler was added. `check-plan.mjs` stays the upstream structural checker. A pass is not live timer proof.

Pi has no built-in PR tool. The mapping says to use resolved `gh` after an auth check, not a hypothetical Cursor tool. Origin stays the documented fallback only when it actually resolves.

Fresh agents are the default. Resume a completed agent only when costly local state is essential. The custom `agents/poteto-agent.md` overlay was not replaced by the upstream description change. Upstream `pstack/agents/poteto-agent.md` is not in the snapshot copy list.

`/skill:correct` gets a host pointer. It may edit the named repo's agent instruction file only after the user authorizes that write. It must not scan private sessions.

`benchmark-checklist` names Linux commands. On this macOS host, `command -v` found `uptime`, `sysctl`, `top`, `sample`, and `dtruss`. It did not find `nproc`, `pidstat`, `strace`, `py-spy`, or `perf`. `node --help` mentions `cpu-prof`. No profile was captured. `dtruss` was not proven as a `strace -c` replacement. The host text says to report those gaps.

No new role was added. Role catalog validation ran inside generate and passed.

Throughput checkpoint: one owner, one upgrade, one isolated tree, generator as sole writer. The pin, registries, generated tree, and test inventory are coupled, so they were not split.

## Verification

```text
node scripts/generate.mjs
# Generated 50 skills ... (50 changes applied).

npm test
# tests 98, pass 98, fail 0, duration_ms 14897.845

# third generate, tree hash unchanged
# fe64f3c175902beeff345315956574355591db4e6127c8fbbd965742c9631878
```

Passing tests include `every file not targeted by a change is byte-identical to upstream`, `bannered files are upstream text plus the host pointer`, `check-plan stays a structural /loop 1h marker check`, and the public SDK expansions of `/skill:correct` and `/skill:benchmark-checklist` with `allowModelNetwork: false`.

## Not done

- No CI. This repo has no CI config. Local pass is not a CI pass.
- `npm run test:installed` was not run. Installed skills remain the previous 47 links. Real `~/.agents/skills` and `~/.pi/agent` were not written.
- No live `/loop 1h`, no push, no PR, no merge.
