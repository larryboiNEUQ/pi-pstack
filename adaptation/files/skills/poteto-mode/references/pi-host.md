# Pi Host Mapping

Read this reference before executing a pstack skill on Pi. It overrides Cursor-specific host instructions in the upstream text. Keep the upstream workflow, phases, review requirements, and output contracts.

## Invocation And Routing

- Invoke `/skill:poteto-mode <task>` explicitly. The main conversation executes the selected playbook. There is no persistent mode, per-turn injection, or automatic handoff to poteto-agent.
- `/skill:<name>` expands other skills. Inline `$<name>` depends on the user's existing inline-skill plugins.
- Resolve a relative path against the invoking skill's base directory. Read a sibling skill at `<baseDir>/../<name>/SKILL.md`. From a playbook, first locate its enclosing poteto-mode directory.
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
| resume | Resume only a completed agent using its returned ID |
| interrupt a running agent | steer_subagent with agent_id and message |
| retrieve complete output | get_subagent_result with agent_id and verbose true |
| environment cloud | Local execution; worktree isolation for concurrent writers |
| readonly false to retain MCP | poteto-agent with inherited extension tools |

Pass a description, a self-contained prompt or file pointers, and the resolved role model and thinking. Do not pass unsupported `readonly`, `environment`, or Cursor-only arguments.

Use `run_in_background: true` for top-level agents. Continue independent work until the completion notification. When no independent work remains, call `get_subagent_result` with `wait: true`; avoid repeated polling. Retrieve the complete result, inspect evidence and diffs, and synthesize the answer yourself. A completion preview is not the full result.

Nested delegates are a host exception: Tintinweb ties their lifetime to the parent subagent. Keep nested delegates foreground and finish them before their parent returns. Do not leave detached grandchildren.

For concurrent writers, use `isolation: "worktree"`. Commit inputs before spawning: a worktree cannot see uncommitted edits. Preserve returned branch/commit pointers, review each diff, then integrate accepted changes. A cloud agent URL is not a local session identifier.

The readonly agent exposes only read, bash, grep, find, and ls. Its bash usage is limited by instructions to read-only inspection. This is not an OS sandbox: the absence of write/edit tools does not make unrestricted shell execution safe.

## Models And Thinking

Read `~/.pi/agent/pstack/models.md` before the first role-based spawn in a task. Read the role catalog at `roles.json` beside this reference when a role's identity or purpose is unclear.

- A line is `<role label>: <provider/model>:<thinking>`, or a comma-separated list of model values. Match the full role label; commas in a label are not multiple lines.
- Split only the final thinking suffix from each model value. Pass `model: "provider/model"` and `thinking: "level"` as separate Agent fields.
- A missing role, `auto`, or `inherit-parent` uses the current parent conversation model. Omit model and thinking for inheritance; do not substitute the global settings default.
- Agent files deliberately contain no model or thinking. Leave existing Explore, worker, reviewer, general-purpose, and Plan definitions unchanged.
- Validate each explicit provider/model against the current authenticated model list from `pi --list-models`. Exact identity matters. Do not rely on fuzzy matching or cross-provider substitution.
- Inspect the returned effective model and thinking. A silent provider/model substitution is not a successful configured-model run.
- Initial mappings preserve the upstream model families. Approved exceptions are GPT for how explorer and why investigators. Cursor max maps to xhigh in this adaptation; Cursor fast has no separate Pi model identity. This is a mapping choice, not a statement that Pi never supports max.
- Role defaults are published in `default-models.md` beside this reference. Installation seeds the user table from it. Deleting a user role intentionally enables inheritance rather than reinstating an upstream Cursor slug.

For reviewers and race seats, start one agent per list entry. Track each seat's requested and effective model. Identify model families by model ID (Claude, GPT, Grok, SWE), not by provider: Devin can host several families.

Select a cross-judge or trail auditor from the configured pool with a different family from the working parent when possible. If no distinct family is available, report reduced independence before proceeding.

The adapter-only slice roles are recall slices, automate-me slices, verification source wave, and comment sicko. Use their table lines for upstream instructions that otherwise say fast/cheap or omit a role. The orchestrate and autopilot coordinator stays on the main conversation model.

## Failure And Fallback

1. Preserve the failed seat's requested model, effective model if known, error, and partial output.
2. For quota exhaustion, rate limits, unavailable models, or an effective-model mismatch, retry that seat once on the current main conversation model.
3. Start a fresh Agent without resume. Omit model and thinking so the model follows the parent. Carry forward the original scope and useful partial evidence, not a claim that the first run succeeded.
4. Report requested model, fallback model, failure reason, and any loss of panel diversity. If the inherited retry fails, report the seat incomplete.

This rule overrides all upstream instructions to retry on a same-family default, use Sonnet, select a closest slug from an error, or use Claude when no family matches. Do not change the persistent model table during fallback. Host-internal transport retries may happen first; do not invent their count or claim an unobserved 429.

## Other Host Capabilities

| Upstream capability | Pi capability |
|---|---|
| AskQuestion | ask_user_question; if unavailable, ask the same options in plain text |
| pstack-models.mdc | ~/.pi/agent/pstack/models.md, explicitly read |
| model setup | /skill:setup-pstack |
| /loop or autonomous-run | Existing pi-goal /goal with an explicit stop condition |
| control-ui for a Web page | Read ego-browser SKILL.md and use its browser |
| control-ui for Electron or IDE | Read the bundled control-ui skill |
| CLI or TUI verification | Read the bundled control-cli skill |
| Cursor create-skill | Read writing-for-agents |
| cursor-team-kit deslop | Read the bundled deslop skill |
| .cursor/skills for newly authored skills | .agents/skills, or ~/.agents/skills with explicit user approval |

Replacing create-skill does not supply its proprietary evaluation or description-tuning runtime. Preserve the draft, test, and revise process with tools available in Pi; report unavailable host features.

Existing `/goal` and ask-user tools come from the user's installed plugins. Do not install replacements or edit settings to hide a missing capability.

## Sessions And Privacy

Use the explicitly identified current session path first. Pi can use `--session-dir`, `PI_CODING_AGENT_DIR`, or another agent directory, so do not assume every session lives under the default.

The default workspace directory is `~/.pi/agent/sessions/--<encoded-cwd>--/`. Resolve cwd to an absolute path, remove its first slash, replace `/`, `\`, and `:` with `-`, then wrap it in `--`. List JSONL files in this workspace directory only.

Read each file's session header and check its cwd before using it. Order candidates by modification time, not UUID. The latest file is not proof that it is the current chat. A subagent transcript has its own identity; do not treat it as the parent transcript.

Pi JSONL lines are typed session entries, not all chat messages. For conversation text, read entries with `type: "message"` and inspect `message.role` and `message.content`. Text, thinking, tool calls, tool results, and custom notifications have different shapes. Keep role, tool name, arguments, timestamps, and results when auditing what an agent actually did.

Recall searches only the workspace and time range the user approved. Reflect and show-me-your-work audit only the identified run. If the active session path is unavailable, ask for it or report incomplete; do not scan every project's private sessions.

## Limits And Authority

The package does not implement Cursor cloud execution, persistent mode, background routing of the root chat, make-bot-ui, Benny, webhooks, or Cursor automation.

Run GitHub-dependent playbooks only after checking gh authentication and repository scope. Missing remote infrastructure is an unavailable capability, not a passed live test. Bun helpers may be reused locally, but their cloud-agent assumptions are not restored.

User approval gates still apply to shared configuration, network access, publication, destructive changes, merges to shared branches, and external messages. An upstream autonomy instruction does not grant permission to perform an irreversible action.
