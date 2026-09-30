# Domain docs

This repo uses a single context: root `CONTEXT.md` and `docs/adr/`.

Read `CONTEXT.md` for the project's terminology. Before working in an area, read ADRs that affect it. If either is absent, proceed without requesting placeholder files.

Use the glossary's vocabulary in issues, designs, and tests. Keep implementation details and proposals out of `CONTEXT.md`.

Create ADRs only when a consequential decision is actually agreed. Flag conflicts with an existing ADR instead of silently overriding it.

There is no `CONTEXT-MAP.md` or multi-context layout. Create `docs/adr/` lazily when the first ADR is needed.
