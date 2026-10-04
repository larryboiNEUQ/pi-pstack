# Issue tracker

[GitHub Issues](https://github.com/larryboiNEUQ/pi-pstack/issues) are the source of truth for specs, tickets, and completion state. Use the `gh` CLI for issue operations. Local `.scratch/` files are temporary working material, not the tracker.

GitHub Issues is the store. `to-spec` and `to-issue` remain the authoring path for specs and task records.

## Conventions

- Create an issue with `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- Read an issue with `gh issue view <number> --comments`. Fetch labels with `gh issue view <number> --json labels --jq '[.labels[].name]'`. To filter comment bodies, use `gh issue view <number> --json comments --jq '[.comments[].body]'`.
- List issues with `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`. Use appropriate `--label` and `--state` filters.
- Comment with `gh issue comment <number> --body "..."`. Add progress, evidence, and completion notes. Link the commit or PR where the work landed.
- Apply labels with `gh issue edit <number> --add-label "..."`. Remove labels with `gh issue edit <number> --remove-label "..."`. Use the five triage labels in `triage-labels.md`.
- Close with `gh issue close <number> --comment "..."`. Labels describe triage readiness. GitHub issue state records whether work is open or closed.

Infer the repo from `git remote -v`. `gh` does this automatically inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** Set to `yes` only if this repo treats external PRs as feature requests. `/triage` reads this flag.

When set to `yes`, use the same labels and states as issues through the `gh pr` equivalents.

- Read a PR with `gh pr view <number> --comments` and `gh pr diff <number>`.
- List external PRs with `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`. Keep only `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` in `authorAssociation`. Drop `OWNER`, `MEMBER`, and `COLLABORATOR`.
- Comment, label, or close with `gh pr comment`, `gh pr edit --add-label` or `--remove-label`, and `gh pr close`.

GitHub shares one number space across issues and PRs. Resolve a bare reference with `gh pr view <number>`, then fall back to `gh issue view <number>`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

`wayfinder` uses one map issue and child issues as tickets.

- Create the map with `gh issue create --label wayfinder:map`. Its body holds Notes, Decisions-so-far, and Fog.
- Label each child `wayfinder:<type>`. The types are `research`, `prototype`, `grilling`, and `task`. Link the child as a GitHub sub-issue with `gh api --method POST repos/<owner>/<repo>/issues/<map>/sub_issues -F sub_issue_id=<child-db-id>`. If sub-issues are unavailable, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body.
- Use native GitHub issue dependencies for blocking. Get the blocker's numeric database id with `gh api repos/<owner>/<repo>/issues/<n> --jq .id`. This is not the issue number or `node_id`. Add the edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`.
- `issue_dependencies_summary.blocked_by` counts open blockers and is the live gate. If dependencies are unavailable, put `Blocked by: #<n>, #<n>` at the top of the child body. A ticket is unblocked when every blocker is closed.
- For the frontier, list open children with `gh issue list --state open`, scoped to the map's sub-issues or task list. Drop children with an assignee or an open blocker. Check `issue_dependencies_summary.blocked_by > 0`, or the open issues in the fallback line. The first eligible child in map order wins.
- Claim with `gh issue edit <n> --add-assignee @me` as the session's first write. The assignee is the driving developer.
- Resolve with `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`. Append a context pointer with the conclusion's gist and link to the map's Decisions-so-far.

## Implementation sequencing

Follow each issue's dependencies. Any unblocked issue can start, and independent issues can run in parallel.

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
