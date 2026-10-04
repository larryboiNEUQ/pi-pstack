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
- Pin additions: `correct`, `benchmark-checklist`, `principle-explain-the-number`. The combined package also copies upstream tdd and teach as `pstack-tdd` and `pstack-teach`. Current adapted skill count is 52. The upgrade-only record below measured 50 before those two copies.

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

## Upgrade-only verification (historical)

```text
node scripts/generate.mjs
# Generated 50 skills ... (50 changes applied).

npm test
# tests 98, pass 98, fail 0, duration_ms 14897.845

# third generate, tree hash unchanged
# fe64f3c175902beeff345315956574355591db4e6127c8fbbd965742c9631878
```

Passing tests include `every file not targeted by a change is byte-identical to upstream`, `bannered files are upstream text plus the host pointer`, `check-plan stays a structural /loop 1h marker check`, and the public SDK expansions of `/skill:correct` and `/skill:benchmark-checklist` with `allowModelNetwork: false`.

## Upgrade-only not done (historical)

- No CI. This repo has no CI config. Local pass is not a CI pass.
- `npm run test:installed` was not run. Installed skills remain the previous 47 links. Real `~/.agents/skills` and `~/.pi/agent` were not written.
- No live `/loop 1h`, no push, no PR, no merge.

## Combined decision

Same PR as the 0.15.9 refresh. The data shape stays the ordered `Change` registry. `scripts/generate.mjs` stays the only writer of `adapted/` and `docs/upstream-guide/`. No new op.

Bare `tdd` and `teach` stay excluded so the user's Matt Pocock skills keep those names. `copy-upstream` copies each upstream `SKILL.md` to `skills/pstack-tdd/SKILL.md` and `skills/pstack-teach/SKILL.md`. A following replace sets `name: pstack-tdd` and `name: pstack-teach`. Directory rename alone is not enough. Pi keys skills by frontmatter name, so a directory-only rename collides with the user skill.

`disable-model-invocation: true` stays. Host banners point at `../poteto-mode/references/pi-host.md`. `pstack-teach` dispatches `how` and `why` on the existing role lines. No teach role was added. A picture request uses mermaid unless the user authorized a raster. It does not call image generation, including Codex image generation, on its own.

The packaged bug-fix playbook always says `pstack-tdd`. Explicit `/skill:tdd` and `/skill:teach` stay the user skills. Tutorial commands and links in the named guide pages point at the prefixed names and `skills/pstack-tdd` / `skills/pstack-teach`. The recipes image alt text was relabeled. `images/recipes.jpg` bytes were not regenerated.

macOS measurement gaps and the `/goal` versus `/loop 1h` split from the upgrade stay in `pi-host.md`. `check-plan.mjs` is still the upstream checker. A passing structural run is not a live timer.

`scripts/install.mjs` and the agent files were not changed. User skill directories were not written.

## Combined synthesis

The collision is the frontmatter name, not the directory. Parent loader checks already showed that. This tree repeats that with the real user files and the generated package. Wrong frontmatter in a `pstack-*` directory collides on `tdd` and `teach`. Matching frontmatter loads four names from the expected paths, with no collision diagnostic.

SDK `session.steer` expands each explicit `/skill:` command into the queue. `allowModelNetwork` is false. The test does not call `session.prompt`. The queued `location` realpath is the user file for the bare names and the adapted file for the prefixed names.

## Combined verification

This section is this worktree's run. It is not the parent main baseline and not the historical 98-test upgrade run.

Parent receipt, not remeasured here. `/tmp/pi-pstack-0.15.5-baseline-tests.log` ends with `tests 92`, `pass 92`, `fail 0`, `duration_ms 14542.517834`.

```text
node scripts/generate.mjs
# Generated 52 skills ... (68 changes applied).

npm test
# tests 104, pass 104, fail 0, duration_ms 17664.14025

# second generate after that test left no further generated diff
```

`git diff --check` was clean. The only whitespace-only delta against `git diff --ignore-space-change` is the `test/pi-load.test.mjs` closing-brace indent fix.

Passing checks include byte identity for untouched files, exact text ops for retargeted files, the valid `/loop 1h` plan exiting 0, the `/goal` variant exiting 1 with `Program checklist lacks "/loop 1h"`, and the four-skill loader and queue checks. Role, anchor, and atomic output checks were not loosened.

## Combined not done

- No CI config. Local pass is not a CI pass.
- `npm run test:installed` was not run. Installed links remain the previous 47. This worker did not write `~/.agents` or `~/.pi`.
- No live `/loop 1h`. No push and no merge from this worker.
