# Load and expand skills

Users invoke packaged skills through Pi `/skill:` commands. Portable verification loads the real package with the pinned local SDK and tests queued command expansion without a model request.

## Sub-features

- Adapted skill names load without package collisions.
- External tdd/teach fixtures remain separate from pstack-tdd/pstack-teach.
- Poteto-mode, correct, benchmark-checklist, poteto-help and ketchup commands expand from expected files.
- Guide links and mapped references point to the intended package.

## How to get to it (user POV)

In Pi, type `/skill:poteto-mode`, `/skill:correct`, `/skill:benchmark-checklist`, `/skill:poteto-help` or `/skill:ketchup` with the task. In this repository, `npm test` exercises the public SDK path for these commands. `npm run verify` wraps that suite and retains the log.

## Driving it with verify-pi-pstack

Preconditions: doctor passes. Run `npm run verify`.

Inspect the `npm-test` log for the skill loading, coexistence and queued expansion tests. Require all to pass without skips. Expansion uses the public session steering path, not test-only body replacement. The expected result includes the skill identity, location, body and supplied probe arguments.

Require a passing summary and retained log after cleanup. Real-home tdd/teach files and credentials are not inputs to this portable recipe.

## Gotchas

The synthetic external skill files represent user-owned skills at the filesystem boundary; SDK internals remain real. No model is prompted. Command expansion cannot prove provider access, model instruction following or persistent Poteto Mode. A separate explicitly authorized live exercise is needed for those claims.
