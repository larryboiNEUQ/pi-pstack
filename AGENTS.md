# Agent instructions

## Verification evidence

When CI does not exist, record it as unavailable rather than claiming a pass.

## Agent skills

### Issue tracker

Local Markdown issues live under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

Use a single root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

## Discussion history

Read `docs/discussions/2026-09-30-initial-discussion.md` for the recorded facts, proposals, and open questions. Read `docs/research/2026-09-30-community-package-comparison.md` when choosing a community port or reasoning about version parity.

Research findings are not approved implementation decisions. Versions and environment details in dated notes are snapshots; recheck them before installing or publishing.

## Configuration boundary

Keep development and verification scoped to this repository. Changes to shared skills, global Pi settings, installed plugins, or external repositories require explicit scope from the user. Do not install a competing runner merely because its name resembles the current one.
