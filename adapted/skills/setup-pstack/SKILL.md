---
name: setup-pstack
description: Configure Pi pstack role models after a subscription or model change. Show exact available models, propose per-role choices, and back up the table before an approved update.
disable-model-invocation: true
---

# Setup pstack

Read `../poteto-mode/references/pi-host.md` first. This skill maintains `~/.pi/agent/pstack/models.md` and `subscriptions.md`. It does not edit Pi settings, authentication, agent definitions, or installed plugins. A proposal does not write either file. Write only after the user accepts the proposal in this chat.

## 1. Read Current Choices

Read the role catalog at `../poteto-mode/references/roles.json`, the published defaults at `../poteto-mode/references/default-models.md`, and the user's model table and subscription profile.

Use the published defaults only when the user table does not exist. A missing role in an existing table intentionally inherits the parent. Preserve `auto` and `inherit-parent` values. Preserve a custom family or a custom panel list the user already chose. Do not reset those rows to the shipped defaults on a re-run.

Treat an explanation such as "grok subscription expired" as a proposed subscription change. Remove that family from proposed assignments, not from the existing file before approval.

## 2. Discover Available Models

Run `pi --list-models`. Keep the exact provider/model identities from its current authenticated list. Label existing assignments that are absent. Show newly available models of the same family as candidates, not automatic upgrades.

If the command fails, stop before writing and report the error. A cached list or a fuzzy model match is not proof of current availability.

## 3. Propose The Whole Table

The upstream default budget is `large`, Pi thinking `xhigh`. That is the upstream cut, distinct from the shipped project defaults, which are the user-approved mixed allocation in `default-models.md` with per-role thinking values.

Preserve each role's recorded thinking. Only apply a uniform named budget when the user explicitly asks for one. Without an explicit uniform-budget request, do not ask for a budget and do not normalize thinking values; propose the existing table as-is, or the shipped defaults when no table exists.

When the user explicitly asks for a uniform named budget, ask for one before you build the proposal. Use `ask_user_question` when it is available. Otherwise ask in plain text and wait. Offer these four labels, and name the current budget when the table records one.

- `unlimited`. Upstream calls this max reasoning. This host maps unsupported `max` to `xhigh` through the host rule, and the proposal must report that mapping.
- `large`. Pi thinking `xhigh`.
- `medium`. Pi thinking `high`.
- `small`. Pi thinking `medium`.

Validate the answer against those four labels. An unsupported label stops the proposal. Do not invent a fifth budget.

Apply the chosen budget only to the thinking suffix of real model values, including each panel entry. Leave `auto` and `inherit-parent` unchanged. On a re-run, keep any role the user changed by family, list, or alias. The shipped defaults are the starting table only when the user table does not exist.

Supported thinking values in a written table are `off`, `minimal`, `low`, `medium`, `high`, and `xhigh`. If a budget would write `max`, map that value to `xhigh` through the host rule, put both the requested budget and the mapped thinking in the proposal, and do not write `max`.

Two distinct model families are enough for a panel. Do not require a third family. Report reduced diversity when the available families are fewer than the seats you propose, and wait for the user to accept that reduction or to edit the rows. Do not fabricate a model.

Preserve the user's approved upstream-family mappings unless they request reallocation. Subscription quotas inform a proposal. They do not authorize silently replacing all Claude seats with GPT or SWE.

If the user requests quota-based reallocation, prefer unlimited models for mechanical work and primary quota for judgment and prose. Keep each adversarial panel's families distinct. Use scarce quota for at most one seat per proposed panel. Choose judges from a different family than the working parent when possible.

Group models by model family, not by provider. Devin Claude and Devin SWE are different families. `auto` and `inherit-parent` count as panel seats but may reduce diversity when resolved to the current parent.

For every role, show role, purpose, current assignment, proposed assignment, thinking, and reason. Show unavailable assignments, newly available same-family candidates, removed rows, the chosen budget, any `max` to `xhigh` mapping, and any reduced family diversity.

## 4. Ask For Approval

Use `ask_user_question` to offer accepting the whole table, editing selected rows, or canceling. If that tool is unavailable, present the same choices in plain text and wait.

Reallocation and file writes require explicit acceptance. A smoke-test request to propose a table is not acceptance to write it. Do not write `~/.pi/agent/pstack/models.md` or `subscriptions.md` before that acceptance.

## 5. Validate, Back Up, And Write

Refresh `pi --list-models` immediately before writing. Validate every explicit provider/model, every thinking value, every role label, and every panel entry against the accepted proposal. Missing, unavailable, ambiguous, or unregistered entries stop the write.

Use `provider/model:thinking` values and preserve full comma-containing role labels. Alias values stay `auto` or `inherit-parent`. Do not write Cursor model slugs. Do not write `max`. If the accepted proposal still contains `max`, stop and report the host mapping to `xhigh` instead of writing it.

Create a unique backup of every existing file to be changed. Preserve its bytes and report the backup paths. Stage the accepted new files beside their destinations, reread and validate them, then replace the destinations. On failure, retain the backup and report partial state rather than claiming success.

Write only the accepted model table and accepted subscription changes. Report the effective table, backup paths, inherited roles, the accepted budget, and any reported `max` to `xhigh` mapping. Re-running this skill should propose against the current table rather than reset it.

## 6. Optional Verification Skill

If the project has no documented way to drive its app, offer `/skill:create-verification-skill` once. Create it only after the user accepts. Follow writing-for-agents and use `.agents/skills/verify-<app>/`.
