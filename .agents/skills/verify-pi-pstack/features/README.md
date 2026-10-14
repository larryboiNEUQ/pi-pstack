# pi-pstack verification map

Run from the repository root. Read the skill's Launch and Doctor sections before using a recipe. All mapped portable features run through `npm run verify`. This uses disposable directories and the real CLI or SDK boundary. Evidence stays in the printed `.artifacts/verification/run-*/` directory after scratch cleanup.

## Features

- [Generate the fixed package](generation.md) covers strict declarations and regenerated tree equality.
- [Install host files](installation.md) covers dry-run, first apply, repeated apply and custom-seed preservation.
- [Load and expand skills](skill-loading.md) covers the real public Pi SDK, namespaced skills and offline command expansion.

## Proof rules

Require the matching check logs, exit code 0 and a passing summary with scratch removed. Report skipped or inaccessible entry points explicitly. The portable lane does not verify actual-home installation or live model calls. Preserve evidence when cleaning up the owned upstream clone.
