# Checkout reconciliation and preservation record

Date: 3 November 2026. Scope: preserve existing work, restore the integration branch, publish the finalized planning documents and provide the [ongoing workflow](checkout_workflow.md). This is tooling/source management; no account/journey feature or native runtime acceptance is claimed.

## Preserved inputs and initial alignment

- Windows began on `chore/setup-handoff` at 84d339e with seven new planning/research files and modified `docs/README.md`. All eight pending files were copied with SHA-256 manifests to ignored `.kairn/safety/checkout-reconciliation-2026-11-03/pending/` before branch work. A Git bundle preserves named local/remote branch history.
- WSL began on `development` at 81196d4, with no tracked modifications. Its 64,408 untracked entries were classified as 59,227 dependency entries, 5,015 cache/verification files, 164 generated outputs and two local environment files. No uncommitted application source was found. No environment contents were printed or staged.
- Mac began clean on `chore/setup-handoff` at 84d339e. Named branch history and eight critical local/signing/artifact files were preserved in its ignored safety directory.
- GitHub setup PR #2 had merged; current main was 7db6595. `development` contained no unique committed work and was fast-forwarded normally from 81196d4 to 7db6595. No force push or branch deletion was used.
- WSL and Mac were then moved to clean `development` at 7db6595. Before/after checks preserved both WSL environment files and all eight Mac critical files, including signing/native artifacts. Restoring the reviewed ignore rules removed the mass of untracked output from status without deleting it.

## Delivered workflow and verification boundary

The helper refuses dirty or divergent checkouts and ignored-path collisions, pins the selected commit, preserves critical files and records source evidence. Focused real-Git fixtures exercise the loss-prevention boundary rather than routine configuration values. Tooling lint/type/format, those fixtures and actual source synchronization on Windows/WSL/Mac qualify this change; existing native acceptance is not rerun solely for documentation/helper changes.

WSL's non-interactive PATH had expired temporary Node/pnpm links. Its existing Node 26.13.0 installation was reused, pinned pnpm 12.16.1 installed only under ignored `.kairn/host-tools`, and `.kairn/env.sh` selects them without changing global defaults. Both exact versions were verified. Git was added only to the tooling image for disposable repository tests; final application runtime images remain unchanged.

Executed against helper/test inputs committed in `7ad8ea8`: all nine real-Git safety tests passed separately on Windows, Mac and Linux. Linux used `docker compose --profile tools run --build --no-deps --rm tooling pnpm exec vp test run tests/shared/checkouts.test.ts`; hashes of the helper, tests, Dockerfile and root package manifest matched between checkout and container. Windows tooling lint/type checks, the test-file lint/type check, formatting of 115 files, and staged whitespace checks passed. Publication validation checked 117 local documentation links and all eight original pending-file backups with no errors. All three hosts then had clean source at that feature commit; both WSL original environment files and all eight Mac critical files still matched their preservation manifests. These results establish the tested inputs, while hosted checks qualify the final PR head.

Final publication commits, PR checks, remote equality and per-host sync results belong to the actual PR/head and ignored verification records; this dated initial-alignment record is not a claim that later heads have passed. Preserve the planning snapshots and safety bundles during future cleanup; generated dependencies, local secrets and binaries do not belong in the commit.
