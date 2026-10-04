# Domain docs

This repo uses a single context with root `CONTEXT.md` and `docs/adr/`.

## Before exploring

Read root `CONTEXT.md` for the project's terminology. Read ADRs in `docs/adr/` that touch the area you are about to work in.

If either is absent, proceed silently. Do not flag the absence or suggest creating placeholder files. `domain-modeling`, reached through `grill-with-docs` and `improve-codebase-architecture`, creates them lazily when terms or decisions get resolved.

## File structure

- `CONTEXT.md` holds the single context's terminology.
- `docs/adr/` holds agreed architectural decisions. Create it lazily when the first ADR is needed.

This repo uses no `CONTEXT-MAP.md` or per-context layout.

## Use the glossary's vocabulary

Use terms as defined in `CONTEXT.md` in issue titles, refactor proposals, hypotheses, and test names. Avoid synonyms the glossary rejects. Keep implementation details and proposals out of `CONTEXT.md`.

If a concept is missing, reconsider whether the project uses it. Note a real terminology gap for `domain-modeling`.

## Flag ADR conflicts

If your output contradicts an existing ADR, name the ADR and explain why the decision is worth reopening. Surface the conflict rather than silently overriding the decision.

Create ADRs only when a consequential decision is agreed.
