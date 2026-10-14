---
name: verify-pi-pstack
description: "Verify pi-pstack's generator and installer CLI, plus public Pi SDK skill loading and expansion. Use after package, mapping, installer or test changes, and before shipping."
---

# Verify pi-pstack

Verify the real noninteractive CLI and SDK surfaces. Read [the feature map](features/README.md) first. No server or terminal session is needed. Loading and queued expansion are not proof of live model behavior.

## Launch

Work from this repository's root with Node 22 or newer, npm, Git and tar. Install repository-local dependencies:

```sh
npm ci --ignore-scripts
```

Set `PSTACK_UPSTREAM_REPO` to a clone containing the commit exported by `scripts/generate.mjs`. Do not use a different latest commit. To prepare a disposable clone when none is available:

```sh
UPSTREAM_TMP="$(mktemp -d)"
pin="$(node --input-type=module -e 'import { PINNED_COMMIT } from "./scripts/generate.mjs"; console.log(PINNED_COMMIT)')"
git init "$UPSTREAM_TMP"
git -C "$UPSTREAM_TMP" remote add origin https://github.com/cursor/plugins.git
git -C "$UPSTREAM_TMP" fetch --depth=1 origin "$pin"
export PSTACK_UPSTREAM_REPO="$UPSTREAM_TMP"
```

This preparation accesses the network. It creates only the named temporary clone. Reusing an existing clone does not require changing its worktree. `Ready` from doctor is the readiness signal.

## Doctor

```sh
npm run doctor
```

Require exit code 0 and `Ready`. Doctor checks Node, exact local SDK version, pinned upstream Git object, archive tooling and packaged directories. It does not write evidence or apply installation. If it fails, repair the stated prerequisite before driving.

## Drive

```sh
npm run verify
```

The command runs the complete portable suite, regenerates into disposable output directories and compares file hashes, modes and symlink targets. It exercises the public installer CLI against a disposable home, not the real user home. It observes dry-run no-write behavior, five installed files, repeated apply and preservation of customized seeds.

The suite uses the real Pi SDK for loading and queued `/skill:` expansion, with disposable external tdd/teach fixtures. It never prompts a model. Verification runs are serial within one checkout because the suite inspects that checkout's evidence directory. Use separate checkouts for simultaneous verification; do not drive two runs in one checkout.

The actual-home check `npm run test:installed` is a separate, explicit operation. Run it only when the user requests verification of their existing installation. It is not part of CI.

## Evidence

The command prints its unique `.artifacts/verification/run-*/` directory. Capture `summary.json` and each numbered log there. Logs contain the command, stdout, stderr and exit code. Require `passed: true`, `failed: false`, `scratchRemoved: true` and zero exit codes. Confirm the reported scratch path no longer exists.

Check the mapped feature's logs for the action and resulting state. Dry-run proof compares the disposable filesystem before and after. Installation proof checks actual written bytes and preserved custom seeds. Regeneration proof compares the produced tree, not just a generator exit code. No internal SDK mocks replace the production loader or expansion boundary.

Do not claim provider authentication, transport, model quality, persistent mode or live chat behavior from these checks. Local evidence is not a remote CI verdict.

## Cleanup

Verification removes only its owned scratch directory in `finally`, including after a failed check. It preserves logs and summary. A failure before allocation has no scratch to remove. Verify the evidence directory still exists after teardown.

If Launch created `UPSTREAM_TMP`, remove only that recorded directory after verification:

```sh
if [ -n "${UPSTREAM_TMP:-}" ]; then
  rm -rf -- "$UPSTREAM_TMP"
  unset UPSTREAM_TMP
  unset PSTACK_UPSTREAM_REPO
fi
```

Never remove an existing clone supplied by the user. Do not delete `.artifacts/verification/` during cleanup. No long-running process is started by this recipe.

## Helpers

`scripts/verify.mjs` is the executable helper. Use `npm run doctor` for its `--doctor` mode and `npm run verify` for full verification. GitHub Actions runs the same entry point and uploads retained evidence even on failure.

Use `/skill:maintain-verification-skill` to keep this map aligned with user entry points as the project changes.
