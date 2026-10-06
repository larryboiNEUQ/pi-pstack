---
name: poteto-help
description: Guides users through pstack setup, /skill:poteto-mode, and picking the skill, playbook, or principle for a task. Type /skill:poteto-help with a question.
disable-model-invocation: true
---

> Pi: Before executing this skill, read `../poteto-mode/references/pi-host.md`. That mapping overrides Cursor-specific host instructions.

# Poteto help

Answer the user's question about pstack, hand them a prompt they can send, and link the file the answer came from. For a help question, don't start the work. The user asked how, and a pstack run spends real tokens, so let them send the prompt.

A message that asks for work, such as "use pstack to fix this bug", is not a help question. Read [`poteto-mode`](../poteto-mode/SKILL.md), do the work under `/skill:poteto-mode`, and mention once that the user must type that invocation. Pi does not keep a persistent mode.

This file maps questions to the skills and guide pages that hold the answers. Those files own the details. Read the file you route to before you quote it, and trust it when it disagrees with this map. The links here point at packaged files beside this skill. Give the user that local path. Do not send a Cursor plugin URL.

## Find out what they need

Infer the need from the message and the conversation. A named situation, such as "which skill reviews a PR?", goes straight to its section. If the need is still unclear, ask one multiple-choice question with these options, then answer only the section they pick:

- Get set up or start a task
- Pick a skill for a situation
- Fix a run that went wrong
- Make pstack my own

Check the state that changes the answer, and mention it only when it does:

- No `~/.pi/agent/pstack/models.md` means no role assignments exist, so roles inherit the main conversation model through the Pi host mapping. Read the published defaults and [`setup-pstack`](../setup-pstack/SKILL.md) before you propose a table. The user types `/skill:setup-pstack` to run it.
- No `verify-*` skill or other app harness in the project means agents have no scripted way to drive the app. Mention `/skill:create-verification-skill` when the question is about proving a change works.

When the model rule is missing and it matters, ask whether the user wants to pick a model for each role and a reasoning budget now. It matters when the user is new, the question is about setup or cost, or the answer depends on which models run. Ask at most once per chat. If the need is also unclear, ask both questions together. Offer two choices:

- Now: give them `/skill:setup-pstack` to type, and answer their question too.
- Later: answer their question, and add one line saying roles inherit the main conversation model until they approve a model table through `/skill:setup-pstack`.

## Get set up

1. Cursor `/add-plugin` is unsupported. Generate this package in the pi-pstack repo, then link `adapted/skills/` into `~/.agents/skills/` only after the user approves that write in the current task.
2. Run [`/skill:setup-pstack`](../setup-pstack/SKILL.md). It asks for a reasoning budget, proposes a model for each role, and writes `~/.pi/agent/pstack/models.md` only after explicit approval. The user must type that command. It does not apply itself to later chats.
3. Start a real task with `/skill:poteto-mode`, a goal, and a check that can pass or fail.

Installing changes nothing until the user types `/skill:<name>`. The [README](../../../README.md) and [guide page 1](../../../docs/upstream-guide/01-setup.md) have the Pi differences. Offer to word their first prompt with them, per [`references/prompting.md`](references/prompting.md).

If cost is the worry, say where the tokens go and how to spend fewer. pstack spends extra tokens on subagents and review panels. Rerun `/skill:setup-pstack` and pick a smaller budget or cheaper models. A role set to `auto` or `inherit-parent` runs on the chat's model, which saves tokens when the chat runs on Auto or a cheaper model. A shorter panel list runs fewer subagents, one for each entry. Save `/skill:poteto-mode` for work that needs rigor.

This package is the Pi adaptation. Workflow skills such as `/skill:poteto-mode`, `/skill:how`, `/skill:why`, and `/skill:pstack-teach` spawn Pi agents with per-role models from `~/.pi/agent/pstack/models.md`. Pi has no persistent mode. Timed `/loop` is unsupported.

## Start a task with `/skill:poteto-mode`

`/skill:poteto-mode` matches the task to a playbook, copies the playbook's steps into the todo list, and runs the other skills as the steps need them. A step it skips stays in the list as `skip: <reason>`. A good prompt states the goal and how to tell it's done. It doesn't list skills, because a hand-written sequence tends to drop or reorder steps the playbook would keep. Read [`references/prompting.md`](references/prompting.md) before you help word one. [Guide page 2](../../../docs/upstream-guide/02-poteto-mode.md) has examples.

Pi has no persistent mode. Invoke the skill explicitly:

- Type `/skill:poteto-mode` with the task. That invocation runs the selected playbook for the task.
- Start each new task with `/skill:poteto-mode` again. There is no per-turn injection.
- Inline `$poteto-mode` depends on the user's existing inline-skill plugins. Do not claim those plugins are installed.

Mid-chat, "new task" makes the next `/skill:poteto-mode` match a fresh playbook. The playbook already uses `poteto-agent` for the subagents its steps spawn. To get the same style from a subagent of your own, spawn it with `subagent_type: "poteto-agent"`.

## Pick a skill

The default answer is `/skill:poteto-mode`, which runs most of the others when its steps need them. Name a skill directly when the user wants more or less of something than the playbook gives. Read the skill before you recommend it, and give one example prompt.

| The user wants to | Skill |
|---|---|
| Do any non-trivial task with rigor | [`/skill:poteto-mode`](../poteto-mode/SKILL.md) |
| Know how code works now, or where new code should live | [`/skill:how`](../how/SKILL.md) |
| Know why code is shaped this way, or where a number came from | [`/skill:why`](../why/SKILL.md) |
| Understand a change or subsystem, explained plainly | [`/skill:pstack-teach`](../pstack-teach/SKILL.md) |
| Catch up on their own recent work on a topic | [`/skill:recall`](../recall/SKILL.md) |
| Know what a small diff could break outside itself | [`/skill:blast-radius`](../blast-radius/SKILL.md) |
| Settle types and module shape before code that crosses a function boundary | [`/skill:architect`](../architect/SKILL.md) |
| Get several attempts at one brief, merged into the best one | [`/skill:arena`](../arena/SKILL.md) |
| Run parallel checks over slices, or race workers, in local worktrees | [`/skill:swarm`](../swarm/SKILL.md) |
| Have different models review a diff and try to break it | [`/skill:interrogate`](../interrogate/SKILL.md) |
| Fix a bug test-first when a cheap local test exists | [`/skill:pstack-tdd`](../pstack-tdd/SKILL.md) |
| Apply TypeScript rules to `.ts` or `.tsx` work | [`/skill:typescript-best-practices`](../typescript-best-practices/SKILL.md) |
| Strip comments before review, using a reviewer that didn't write them | [`/skill:no-comments`](../no-comments/SKILL.md) |
| Clean AI tells out of prose | [`/skill:unslop`](../unslop/SKILL.md) |
| Write docs, an RFC, a README, a PR description, or a commit message to a standard | [`/skill:technical-writing`](../technical-writing/SKILL.md) |
| Hear the last reply again in plain words | [`/skill:bro`](../bro/SKILL.md) |
| Give agents a scripted way to drive the app and prove behavior | [`/skill:create-verification-skill`](../create-verification-skill/SKILL.md) |
| Bring a verification skill and its feature map back in line with the app | [`/skill:maintain-verification-skill`](../maintain-verification-skill/SKILL.md) |
| Vet a performance number before reporting or acting on it | [`/skill:benchmark-checklist`](../benchmark-checklist/SKILL.md) |
| Run a large or cross-cutting change, or one to review after stepping away | [`/skill:figure-it-out`](../figure-it-out/SKILL.md) |
| Keep a decision log during a run, and review it afterward | [`/skill:show-me-your-work`](../show-me-your-work/SKILL.md) |
| Pick a model for each role and a reasoning budget | [`/skill:setup-pstack`](../setup-pstack/SKILL.md) |
| Turn their own working habits into a personal mode skill | [`/skill:automate-me`](../automate-me/SKILL.md) |
| Turn what a finished task taught into skill edits | [`/skill:reflect`](../reflect/SKILL.md) |
| Stop agents from repeating the same mistakes in this repo | [`/skill:correct`](../correct/SKILL.md) |
| Build a page whose buttons wake a Grok Bot over a webhook | Unsupported. `make-bot-ui` depends on Cursor webhooks and is not in this package. |
| Find their way around pstack | `/skill:poteto-help` |

If a skill directory next to this one is missing from the table, read its frontmatter and route by its description. The `principle-*` directories are covered under principles below.

Close calls:

- `/skill:how` explains what the code does. `/skill:why` explains the reasons. `/skill:pstack-teach` runs one or both and explains the result plainly.
- `/skill:arena` gives every worker the same brief and merges the best parts. `/skill:swarm` splits work into slices or a race and returns one report.
- `/skill:architect` implements right after it settles the design. Add "with checkpoint" to review the design before it writes code.
- `/skill:interrogate` reviews the diff. `/skill:blast-radius` looks for breakage outside the diff and proves the one fact that makes the change safe.
- `/skill:recall` rebuilds context across recent chats. Resuming one specific chat or branch is the Session pickup playbook.
- `/skill:figure-it-out` designs one rigorous run. The Orchestrate playbook runs a program that spans days and many PRs. The Autonomous run playbook drives one task to a finish condition.

Host tools and limits:

- `deslop`, `control-cli`, and `control-ui` ship in this package. Read [`deslop`](../deslop/SKILL.md), [`control-cli`](../control-cli/SKILL.md), and [`control-ui`](../control-ui/SKILL.md).
- Timed `/loop` is unsupported and unverified. Do not map it to `/goal`. Cursor create-skill is not in this package. Read writing-for-agents when authoring a skill. The Pi host mapping names that replacement.
- pstack has no `/orchestrate` skill. Orchestrate is a `/skill:poteto-mode` playbook. If the slash menu shows `/orchestrate`, another plugin provides it.

## Playbooks and principles

Playbooks are step lists inside `/skill:poteto-mode`, not skills, so they have no slash command. Inside `/skill:poteto-mode`, describing the task picks one, and these phrases name one directly:

- "babysit this pr" or "check on pr 123" runs Babysit. It drives the PR to merge-ready and stops there. It doesn't merge unless the user asks to merge, land, or ship.
- "land the stack" runs Shipping.
- "take over this branch" runs Session pickup.
- "pause safely" runs Pause safely.
- "full autopilot on this queue" runs Autopilot-full. "stack them, don't ship" runs Autopilot-stack.
- "run the eval playbook" runs Eval.

Without `/skill:poteto-mode`, a phrase such as "babysit this pr" is not this package's Babysit playbook. The Playbooks section of [`poteto-mode`](../poteto-mode/SKILL.md) lists every playbook and when it applies. [Guide page 6](../../../docs/upstream-guide/06-verify-and-ship.md) covers opening, babysitting, and landing a PR.

This package has no planning skill. For work that spans phases or stacked PRs, asking `/skill:poteto-mode` for a plan runs the [Multi-phase plan playbook](../poteto-mode/playbooks/multi-phase-plan.md), which writes the plan and doesn't implement it. For a design question, the Prototype playbook or `/skill:architect` settles it in code first.

Principles are one-rule skills that `/skill:poteto-mode` reads and cites in its replies. The user rarely invokes one. They steer with the names instead, as in "apply prove it works. show me the real output." Typing `/skill:principle-<name>` still loads one on demand. [Guide page 8](../../../docs/upstream-guide/08-principles.md) lists them.

## Fix a run that went wrong

| Symptom | Fix |
|---|---|
| The last task's playbook stopped applying | Start the next task with `/skill:poteto-mode`. Pi does not keep a persistent mode. |
| A question got treated as the next step of the last task | Say "new task", or say the turn doesn't need the mode. |
| A new model choice had no effect | The table is `~/.pi/agent/pstack/models.md`. The next task must read it through the Pi host mapping. Writing the table does not inject it into an already running chat. |
| Runs cost more than expected | See the cost paragraph under Get set up. |
| A skill didn't load on its own | The user types `/skill:<name>`, or `/skill:poteto-mode` runs a skill its playbook names. Mentioning a skill does not load it. |
| Parallel agents overwrote each other | Give each agent its own worktree. Pi does not provide a cloud agent runtime. |
| An overnight run moved but finished nothing | Timed `/loop` is unsupported. A finish check can pass or fail, but this host has no verified timer. See [guide page 7](../../../docs/upstream-guide/07-overnight.md). |
| The reply claims success from a green build | Ask for the real command, flow, stored value, or profile. That's the prove-it-works principle. |

For a run that drifts, [`references/prompting.md`](references/prompting.md) has one-line steers. [Guide page 10](../../../docs/upstream-guide/10-recipes-and-pitfalls.md) has more pitfalls and the recipes worth copying.

## Make pstack my own

- [`/skill:automate-me`](../automate-me/SKILL.md) drafts a personal mode skill from the user's own history, to use alongside `/skill:poteto-mode`.
- [`/skill:reflect`](../reflect/SKILL.md) after a session turns its lessons into skill edits the user approves.
- `/skill:poteto-mode write a skill for <workflow>` runs the authoring playbook. The eval playbook tests a skill change blind.
- Fix a misbehaving skill in its own PR, not inside the feature work where it went wrong.

[Guide page 9](../../../docs/upstream-guide/09-make-it-yours.md) covers each of these.

## Reply

Lead with the answer. Give at most one example prompt in a code block, adapted from [`references/recipes.md`](references/recipes.md) when one fits, then the link to that file. Keep it short unless the user asked for the whole map.
