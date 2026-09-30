# Issue tracker: Local Markdown

Issues and specs live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- Spec: `.scratch/<feature-slug>/spec.md`.
- One implementation issue per file: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`.
- Record triage state in a `Status:` line using `docs/agents/triage-labels.md`.
- Append comments under `## Comments`.

## Skill operations

To publish, create the appropriate spec or individual issue file. Create directories only when they have content.

To fetch a ticket, read its referenced path. A number is scoped to its feature directory, not a global repository issue number.

## Wayfinding

- Map: `.scratch/<effort>/map.md`.
- Child: `.scratch/<effort>/issues/NN-<slug>.md`.
- Record `Type:` as research, prototype, grilling, or task.
- Wayfinder lifecycle uses `Status: claimed` or `Status: resolved`; these are distinct from triage labels.
- Record dependencies as `Blocked by: NN, NN`. A ticket is unblocked once all dependencies are resolved.
- The frontier is the lowest-numbered open, unblocked, unclaimed child.
- Claim a child before starting work. Resolve it by adding `## Answer`, setting its status to `resolved`, and linking its conclusion from the map.

## Implementation sequencing

Work on one implementation Issue at a time. Complete its applicable verification, review, commit, CI evidence, and tracker updates before starting another. If blocked, stop.

No remote tracker has been configured. Do not create GitHub or GitLab issues as a side effect of a local tracker operation.
