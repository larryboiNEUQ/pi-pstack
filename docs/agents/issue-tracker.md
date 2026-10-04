# Issue tracker

[GitHub Issues](https://github.com/larryboiNEUQ/pi-pstack/issues) are the source of truth for specs, tickets, and completion state. Local `.scratch/` files are temporary working material, not the tracker.

## Conventions

- Create a GitHub issue for each spec or implementation ticket.
- Use repository issue numbers and URLs when fetching or referencing tickets.
- Apply the five triage labels in `triage-labels.md`. Labels describe triage readiness. GitHub issue state records whether work is open or closed.
- Add progress, evidence, and completion notes as issue comments. Link the commit or PR where the work landed.

## Wayfinding

- Use a parent GitHub issue as the effort map and link its child issues.
- Record `Type:` as research, prototype, grilling, or task in the issue body.
- Record dependencies as `Blocked by:` followed by GitHub issue links.
- A ticket is unblocked once all dependencies are closed.
- Claim a child with an assignee before starting work. The frontier is the lowest-numbered open, unblocked, unassigned child.
- Resolve a child by posting its answer and evidence, closing it, and linking its conclusion from the parent issue.

## Implementation sequencing

Follow each issue's dependency links. Any unblocked issue can start, and independent issues can run in parallel.

## Migrated issues

The migration preserves the adaptation spec, local tickets 01 through 09, upstream upgrade notes, and the Claude recheck conclusion. States below are the migration snapshot. The linked issues hold current state.

| Source | GitHub issue | Migration state |
| --- | --- | --- |
| Adaptation spec | [#3](https://github.com/larryboiNEUQ/pi-pstack/issues/3) | Closed |
| Ticket 01, generator and package | [#4](https://github.com/larryboiNEUQ/pi-pstack/issues/4) | Closed |
| Ticket 02, subagent wiring and smoke | [#5](https://github.com/larryboiNEUQ/pi-pstack/issues/5) | Closed |
| Ticket 03, how end to end | [#6](https://github.com/larryboiNEUQ/pi-pstack/issues/6) | Closed |
| Ticket 04, path changes | [#7](https://github.com/larryboiNEUQ/pi-pstack/issues/7) | Closed |
| Ticket 05, core playbooks | [#8](https://github.com/larryboiNEUQ/pi-pstack/issues/8) | Closed |
| Ticket 06, setup-pstack rewrite | [#9](https://github.com/larryboiNEUQ/pi-pstack/issues/9) | Closed |
| Ticket 07, adversarial panels | [#10](https://github.com/larryboiNEUQ/pi-pstack/issues/10) | Closed |
| Ticket 08, deferred playbooks | [#11](https://github.com/larryboiNEUQ/pi-pstack/issues/11) | Closed |
| Ticket 09, upstream 0.15.5 pin | [#12](https://github.com/larryboiNEUQ/pi-pstack/issues/12) | Closed |
| Upstream 0.15.9 notes, shipped in PR #2 | [#13](https://github.com/larryboiNEUQ/pi-pstack/issues/13) | Closed |
| Claude version-gate recheck | [#14](https://github.com/larryboiNEUQ/pi-pstack/issues/14) | Open |
