# Generate the fixed package

Users regenerate the adapted skills and guide from a fixed upstream Git commit. Verification checks that the committed package equals fresh output without replacing tracked files.

## Sub-features

- Strict declaration application rejects missing or repeated anchors.
- Regeneration preserves content, file modes and symlink targets.
- Source defaults, generated defaults and configuration seeds agree.

## How to get to it (user POV)

Use `npm run generate` for an intentional tracked-output update. Use `npm run verify` to check the existing package without changing tracked output. Both use `PSTACK_UPSTREAM_REPO` and the exported fixed pin.

## Driving it with verify-pi-pstack

Preconditions: dependencies installed and `npm run doctor` reports Ready.

Run `npm run verify`. Inspect `fresh-generation`, `adapted-parity`, `guide-parity` and `model-source-seed-parity` logs. Fresh generation must succeed. Tree comparisons must pass. The summary must report produced file counts and all22 configured roles. The full suite also covers generator failure behavior and strict anchor errors.

Confirm `summary.json` remains after scratch removal. Tracked outputs must remain unchanged in `git diff -- adapted docs/upstream-guide`.

## Gotchas

Verification calls the production generator API into isolated directories; it does not run the tracked-output command. A newer upstream HEAD is not a substitute for the pinned commit. Directory metadata is excluded from output parity, but file modes and symlink targets are compared. A stale source object produces a prerequisite failure, not a passing generation check.
