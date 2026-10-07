# Pi Host Mapping

Read this reference before executing a pstack skill on Pi. It overrides Cursor-specific host instructions in the upstream text. Keep the upstream workflow, phases, review requirements, and output contracts.

## Invocation And Routing

- Invoke `/skill:poteto-mode <task>` explicitly. The main conversation executes the selected playbook. There is no persistent mode, per-turn injection, or automatic handoff to poteto-agent.
- `/skill:<name>` expands other skills. Inline `$<name>` depends on the user's existing inline-skill plugins.
- Resolve a relative path against the invoking skill's base directory. Read a sibling skill at `<baseDir>/../<name>/SKILL.md`. From a playbook, first locate its enclosing poteto-mode directory.
- Bare `tdd` and `teach` stay the user's existing Matt Pocock skills. They are not siblings in this package. An explicit `/skill:tdd` or `/skill:teach` resolves from the host's advertised skill catalog. If absent there, check `~/.agents/skills/<name>/SKILL.md`, then `~/.pi/agent/skills/<name>/SKILL.md`. Report unavailable if neither exists. Never recreate or overwrite those skills.
- This package ships `pstack-tdd` and `pstack-teach`. Directory names and frontmatter names match. Read them at `<baseDir>/../pstack-tdd/SKILL.md` and `<baseDir>/../pstack-teach/SKILL.md`. The packaged bug-fix playbook always uses `pstack-tdd`. Do not send that playbook to the bare user skill.
- `pstack-teach` dispatches `how` and `why` on the existing role lines. Do not add a teach role. When the skill asks for a picture and the user did not authorize a raster in this task, draw mermaid. Do not call image generation, including Codex image generation, only because the skill mentions a whiteboard image.
- Read hidden sibling and principle skills by path. `disable-model-invocation` hides discovery metadata, not explicit invocation or file access.
- Copy the selected playbook steps into a Markdown checklist. Track skipped steps with a reason. A missing todo tool does not remove the checklist.

## Subagents

Use the installed Tintinweb `Agent` tool, not Cursor Task or another subagent runner.

| Upstream instruction | Pi instruction |
|---|---|
| Task | Agent |
| generalPurpose, readonly true | subagent_type pstack-readonly |
| generalPurpose, read-write | subagent_type poteto-agent |
| poteto-agent | subagent_type poteto-agent |
| Comment Sicko | subagent_type comment-sicko |
| run_in_background | run_in_background true for top-level delegation |
| resume | Resume a completed agent by its returned ID only when costly local state is essential. Otherwise start a fresh Agent |
| interrupt a running agent | steer_subagent with agent_id and message |
| retrieve complete output | get_subagent_result with agent_id and verbose true |
| environment cloud | Local execution; worktree isolation for concurrent writers |
| readonly false to retain MCP | poteto-agent with inherited extension tools |

Fresh agents are the default for new work, a fix round, a follow-up, a retry, and the next queue item. Carry the original brief, later directives, and the prior report and branch in the new prompt. Resume a completed agent, using its returned ID, only when the new work needs state that lives in that agent and is costly to move. That state is its local checkout, its uncommitted changes, or a process it still runs. A stop or hold sent to a running agent is not reuse. A role such as a PR owner outlives its agent. Once that agent returns, a fresh agent takes the role's next round. Do not resume a running agent. Use `steer_subagent` to interrupt one.

Pass a description, a self-contained prompt or file pointers, and the resolved role model and thinking. Do not pass unsupported `readonly`, `environment`, or Cursor-only arguments.

Use `run_in_background: true` for top-level agents. Continue independent work until the completion notification. When no independent work remains, call `get_subagent_result` with `wait: true`; avoid repeated polling. Retrieve the complete result, inspect evidence and diffs, and synthesize the answer yourself. A completion preview is not the full result.

Nested delegates are a host exception: Tintinweb ties their lifetime to the parent subagent. Keep nested delegates foreground and finish them before their parent returns. Do not leave detached grandchildren.

Nested delegation is opt-in in Tintinweb, even for agents with inherited extension tools. The packaged poteto-agent allows the three pstack agent types; comment-sicko allows pstack-readonly and poteto-agent for its how/why checks. The readonly agent has no delegation tools. Respect the host depth limit.

For concurrent writers, use `isolation: "worktree"`. Commit inputs before spawning: a worktree cannot see uncommitted edits. Preserve returned branch/commit pointers, review each diff, then integrate accepted changes. A cloud agent URL is not a local session identifier.

For swarm writers, let Tintinweb create the worktrees through each Agent call's `isolation: "worktree"`. Do not substitute a manually created worktree plus `isolation: "off"`. If the host disables native isolation, report that capability gap before spawning writers. Do not pass Cursor-only `cloud_base_branch`; prepare and commit the local base before spawning.

The readonly agent exposes only read, bash, grep, find, and ls. Its bash usage is limited by instructions to read-only inspection. This is not an OS sandbox: the absence of write/edit tools does not make unrestricted shell execution safe.

## Models And Thinking

Read `~/.pi/agent/pstack/models.md` before the first role-based spawn in a task. Read the role catalog at `roles.json` beside this reference when a role's identity or purpose is unclear.

- A line is `<role label>: <provider/model>:<thinking>`, or a comma-separated list of model values. Match the full role label; commas in a label are not multiple lines.
- Split only the final thinking suffix from each model value. Pass `model: "provider/model"` and `thinking: "level"` as separate Agent fields.
- A missing role, `auto`, or `inherit-parent` uses the root main conversation model. At the root, omit model; inside a delegate, pass the recorded `root-main` provider/model explicitly, or return to the root if that context is missing. Never substitute the global settings default or the immediate delegate's role model. Pass known root thinking explicitly; otherwise report the host's effective level rather than claiming live thinking inheritance.
- Agent files deliberately contain no model or thinking. Leave existing Explore, worker, reviewer, general-purpose, and Plan definitions unchanged.
- Validate each explicit provider/model against the current authenticated model list from `pi --list-models`. Exact identity matters. Do not rely on fuzzy matching or cross-provider substitution.
- Inspect the returned effective model and thinking. A silent provider/model substitution is not a successful configured-model run.
- `default-models.md` beside this reference is the single source of truth for role defaults. The shipped table is a user-approved project allocation across the Sol, SWE, Opus, and Grok families with mixed per-role thinking, not the upstream two-family xhigh cut. Cursor max maps to xhigh in this adaptation. Cursor fast has no separate Pi model identity. This is a mapping choice, not a statement that Pi never supports max.
- Role defaults are published in `default-models.md` beside this reference. Installation seeds the user table from it. Deleting a user role intentionally enables inheritance rather than reinstating an upstream Cursor slug.
- Route `swarm workers` and the other `devin/swe-2:medium` seats only to explicit, small, verifiable tasks. Complex or ambiguous work goes to a `high` Sol seat or the `hardest tasks` role. There is no automatic difficulty classifier; the caller chooses the seat.

For reviewers and race seats, start one agent per list entry. Track each seat's requested and effective model. Identify model families by model ID (Claude, GPT, Grok, SWE), not by provider: Devin can host several families.

At the root, record the main conversation's exact provider/model and known thinking as `root-main` task context. Include that context in each top-level delegation and preserve it unchanged in nested briefs. The immediate parent of a nested agent may use another role model; it is not the root main model.

Select a cross-judge or trail auditor from the configured pool with a different family from the root-main conversation when possible, including inside nested delegates. Do not compare only with the immediate delegate's role model. If root-main context is missing, return the selection to the root; if no distinct family is available, report reduced independence before proceeding.

The adapter-only slice roles are recall slices, automate-me slices, verification source wave, and comment sicko. Use their table lines for upstream instructions that otherwise say fast/cheap or omit a role. The orchestrate and autopilot coordinator stays on the main conversation model.

## Failure And Fallback

1. Preserve the failed seat's requested model, effective model if known, error, and partial output.
2. For a model/provider startup failure (including authentication or version gates), quota exhaustion, rate limits, unavailable models, or an effective-model mismatch, retry that seat once on the current main conversation model. Preserve a version-gate error as such; do not relabel it as quota exhaustion or update installed providers without approval.
3. Start a fresh Agent without resume. At the root, omit model to use the root main conversation model. Inside a delegate, pass the recorded `root-main` provider/model explicitly and its known thinking; do not omit model and accidentally inherit the immediate delegate's role model. If root-main context is missing, return the failed seat to the root for its fresh retry rather than guessing from global settings. Carry forward the original scope and useful partial evidence, not a claim that the first run succeeded. Report the effective thinking if the root level is unknown.
4. Report requested model, fallback model, failure reason, and any loss of panel diversity. If the inherited retry fails, report the seat incomplete.

This rule overrides all upstream instructions to retry on a same-family default, use Sonnet, select a closest slug from an error, or use Claude when no family matches. Do not change the persistent model table during fallback. Host-internal transport retries may happen first; do not invent their count or claim an unobserved 429.

## Other Host Capabilities

| Upstream capability | Pi capability |
|---|---|
| AskQuestion | ask_user_question; if unavailable, ask the same options in plain text |
| pstack-models.mdc | ~/.pi/agent/pstack/models.md, explicitly read |
| model setup | /skill:setup-pstack |
| bounded autonomous continuation | Existing pi-goal `/goal` with an explicit stop condition. Not a timer and not a substitute for `/loop 1h` |
| `/loop`, `/loop 1h`, or another timed wake | Unsupported and unverified. Do not map it to `/goal`. Do not install a scheduler. Do not fake a sleep loop and call it `/loop` |
| built-in PR tool | None on this host. Use resolved `gh` after an auth check. Do not call a hypothetical Cursor or host PR tool |
| control-ui for a Web page | Read ego-browser SKILL.md and use its browser |
| control-ui for Electron or IDE | Read the bundled control-ui skill |
| CLI or TUI verification | Read the bundled control-cli skill |
| Cursor create-skill | Read writing-for-agents |
| cursor-team-kit deslop | Read the bundled deslop skill |
| .cursor/skills for newly authored skills | .agents/skills, or ~/.agents/skills with explicit user approval |

The upstream plan template and `scripts/check-plan.mjs` stay aligned with each other. The checker is structural. It requires the literal marker `/loop 1h` in the program checklist. A passing run is not proof that a live hourly timer exists or fired. Do not edit the checker or the template to hide that marker. When a playbook says to arm `/loop 1h`, report the timed loop as unsupported and unverified. Do not claim the tick ran.

Pi has no built-in PR tool. Create, edit, retarget, and mark ready through the resolved forge. Check `gh` authentication and repository scope first. If `command -v origin` succeeds and Origin can resolve the repository, Origin remains the documented fallback. Otherwise stay on `gh`. Do not invent a Cursor PR tool.

Replacing create-skill does not supply its proprietary evaluation or description-tuning runtime. Preserve the draft, test, and revise process with tools available in Pi; report unavailable host features.

Existing `/goal` and ask-user tools come from the user's installed plugins. Do not install replacements or edit settings to hide a missing capability.

## Measurement Tools

`benchmark-checklist` names Linux commands. Check `command -v` before using one. If the command is absent, report the gap. Do not claim the tool exists, and do not install it to satisfy the checklist.

On macOS, when `nproc` is absent, use `sysctl -n hw.ncpu` for the core count. When `pidstat` is absent, use `top` for a per-process CPU look. That does not mean `top` matches `pidstat` output.

`strace -c` is a Linux command. Do not substitute an unverified tool for it. `dtruss` may be present on macOS, but it was not proven as a `strace -c` replacement and it often needs extra privileges. Report the syscall-count gap instead.

`py-spy` and `perf` were absent on the macOS host checked for this adaptation. Do not claim them. For a Node workload, `node --cpu-prof` is a flag on the installed Node. Confirm it with `node --help` before citing a profile.

## Sessions And Privacy

Use the explicitly identified current session path first. Pi can use `--session-dir`, `PI_CODING_AGENT_DIR`, or another agent directory, so do not assume every session lives under the default.

The default workspace directory is `~/.pi/agent/sessions/--<encoded-cwd>--/`. Resolve cwd to an absolute path, remove its first slash, replace `/`, `\`, and `:` with `-`, then wrap it in `--`. List JSONL files in this workspace directory only.

Read each file's session header and check its cwd before using it. Order candidates by modification time, not UUID. The latest file is not proof that it is the current chat. A subagent transcript has its own identity; do not treat it as the parent transcript.

Pi JSONL lines are typed session entries, not all chat messages. For conversation text, read entries with `type: "message"` and inspect `message.role` and `message.content`. Text, thinking, tool calls, tool results, and custom notifications have different shapes. Keep role, tool name, arguments, timestamps, and results when auditing what an agent actually did.

Recall searches only the workspace and time range the user approved. Reflect and show-me-your-work audit only the identified run. If the active session path is unavailable, ask for it or report incomplete; do not scan every project's private sessions.

`/skill:correct` may read commits, reverts, review comments, and agent instruction files in the repo the user named. It may edit that repo's agent instruction file and its rule table only after the user authorizes that write in the current task. It must not scan Pi session JSONL, other projects' private sessions, or credential files. If the user did not identify a session, do not mine transcripts for corrections.

## Limits And Authority

Never dump the environment, enumerate environment values by substring, or read credential files to identify a model or diagnose a provider failure. A filter for `PI_` also matches `API_KEY`. Obtain effective model/thinking from returned host records, not environment inspection. Workers report task evidence; the parent records identities. Do not print API keys, tokens, cookies, or authorization headers. If a secret is accidentally printed, stop, keep raw evidence private, report only its variable name, and ask the user about rotation.

The package does not implement Cursor cloud execution, persistent mode, timed `/loop`, a built-in PR tool, background routing of the root chat, make-bot-ui, Benny, webhooks, or Cursor automation.

Run GitHub-dependent playbooks only after checking gh authentication and repository scope. Missing remote infrastructure is an unavailable capability, not a passed live test. Bun helpers may be reused locally, but their cloud-agent assumptions are not restored.

User approval gates still apply to shared configuration, network access, publication, destructive changes, merges to shared branches, and external messages. An upstream autonomy instruction does not grant permission to perform an irreversible action.
