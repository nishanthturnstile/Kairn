# Accounts and journeys: implementation review

Date: 4 November 2026. The original review checkpoint and reproductions are preserved below. A subsequent user-authorized correction batch is recorded at the end; B04 has not started.

## Scope and reviewer

Reviewed the complete plan implementation delta from foundation `605bc61382f2445eb53aea2f64dc6b45c7032641` through `f10a27a0807e26b05ee429cc23b58861f0c11804`: B01 contracts/web specimens, B02 database/privilege foundation, B03 services/workers/recovery, and the SDK refresh. The implementation plan, selected decisions, product requirements and Kairn architecture/access guidance govern the assessment.

Installed OCR `1.13.4` (`76ab46a`) was retried. Direct mode still failed before a model call because no LLM endpoint is configured. This pass uses OCR's supported [host-agent workflow](https://github.com/alibaba/open-code-review/blob/main/plugins/open-code-review/skills/open-code-review-delegate/SKILL.md): OCR selected files and resolved rules; the current coding agent performed the review. It is **not an independent external-model review**.

OCR accounted for 151 changed entries: 131 reviewable files reviewed, zero skipped, 100% selected-file coverage. Custom inclusions covered tests, Docker packaging, dependency patches, documentation and the native lock. Twenty generated/binary/font/lock entries were excluded from manual diff selection with recorded reasons; their source, regeneration, hashes and existing qualification records were considered separately. File coverage does not claim that every possible behavior has been tested. Schema models were reviewed with their corresponding SQL and a fresh complete 36-table generator comparison; repeated declaration-patch edits were checked for scope and runtime changes.

## Findings

### R01 — P1: a deleted auth subject can be provisioned again when its domain mapping is absent from the backup

Location: `packages/backend/migrations/0008_recovery_boundary.sql:64–66`, together with `identity.ensure_account` in migration 0001 and the account-deletion journal body in migration 0006.

A valid backup may contain an existing verified auth user before their first domain-account provisioning. If that account is subsequently provisioned and deleted, the independently acknowledged event identifies only the new domain UUID. Restoring the earlier backup leaves no `identity.account` row for replay to update or to supply the auth subject for `retired_auth_subject`. Replay nevertheless advances its checkpoint. `ensure_account` then sees a verified, unretired auth subject and creates a different active domain UUID.

The real PostgreSQL probe took a snapshot before provisioning, provisioned and deleted the account through the actual service, confirmed the actual event in `FileRestrictionJournal`, restored that snapshot and ran signed `replayRestrictions`. Replay succeeded, then `provisionVerifiedAccount` returned a different active domain account for the same restored auth subject. The existing clone test creates all account mappings before its snapshot, so it misses this case.

Required correction: preserve the minimum stable auth-subject/domain binding independently, reconstruct the retirement barrier even when the account row is missing, and reject release when the binding cannot be recovered safely. Never reconstruct identity from email. Qualify compatibility with retained journal entries and backups through a new reviewed migration/protocol change; do not edit released SQL.

### R02 — P1: replayed avatar deletion does not prevent reuse of an avatar absent from the backup

Location: `packages/backend/migrations/0007_identity_workers.sql:48–52` and migration 0008's avatar replay branch at lines 84–86.

When an avatar was created and deleted after the selected backup, replay writes its `recovery_barrier` but has no avatar row to mark deleting. It does not reconstruct `retired_avatar`. `begin_avatar` checks only `retired_avatar`, so an old create retry using the same opaque UUID can succeed and allocate an upload again. The barrier cannot currently stop the later upload/activation path.

The signed-journal/PostgreSQL probe created and deleted the avatar through actual commands after its snapshot, confirmed the deletion, restored the snapshot and replayed the journal. Retrying the original create command with the original command ID returned `state: accepted` for that same UUID despite one matching recovery barrier. Ordinary post-cleanup reuse is tested, but reuse after restoring a checkpoint lacking the avatar is not.

Required correction: make allocation and any surviving activation path honor the replay barrier, or safely materialize the retirement record during replay. Cover both absent and present restored avatars and stale command/worker retries. Use a new migration.

### R03 — P2: release may start different containers from those whose inputs were checked

Location: `scripts/restriction-recovery.mjs:162–218`.

Release validates the image IDs and database credentials of stopped server/worker containers, then enables writer logins and invokes `docker compose up`. That invocation permits Compose to recreate containers from its current files/environment. If the stopped containers were prepared with one environment but release resolves another, or Compose inputs change, the running images/credentials can differ from the checked inputs. `--pull never` prevents pulling; it does not prevent recreation from an already available image/configuration.

A real disposable Compose probe created and inspected a container with `REVIEW_INPUT=checked-new-input`. Running the same `up --detach --no-deps --pull never` pattern with stale Compose inputs replaced its ID and started `REVIEW_INPUT=stale-compose-input`.

Required correction: bind release to the exact inspected container IDs and their qualified inputs; prevent unvalidated recreation, then verify the running identities before opening delivery. Add one focused real-Compose acceptance case. The current recovery suite calls the database fencing/release helpers directly and does not exercise this CLI transition.

### R04 — P2: development specimen acceptance can report success without exercising the specimen

Location: `tests/integration/web.test.ts:19–23` and the development/runtime loop in `scripts/verify-web.mjs`.

The specimen test treats any HTTP 404 as a passing production case and returns before its form, permission, layout and accessibility assertions. The wrapper knows whether it launched development or production, but does not pass that expectation to the test. Removing the development entry's specimen enablement therefore permits the mandatory development acceptance case to pass without visiting the screen. Conversely, an incorrectly exposed production specimen could enter the browser assertions rather than fail immediately for exposure.

This finding is established by the test/wrapper control flow; no new browser acceptance is claimed.

Required correction: pass the expected delivery mode explicitly, require HTTP 200 in development and HTTP 404 in production, and exercise the development path after that assertion. A broken development route must fail the gate.

### R05 — P3: valid years below 1000 fail the intended-time contract

Location: `packages/contracts/src/domain/journeys.ts:67–71`.

The wire/SQL bounds admit four-digit years `0001`–`9999`, but `Intl.DateTimeFormat` with `year: numeric` returns unpadded years. `matchesZone` compares that directly with the padded local string. Valid UTC dates in years `0001`, `0099` and `0999` were rejected by the actual compiled contract; `1000` and `2026` passed.

Required correction: normalize the formatted year to the contract's four-digit representation and add one lower-bound regression alongside the existing DST/chronology checks. This is a lower-priority supported-range defect.

## Executed evidence and limits

Private evidence is under `.kairn/verification/plan-review/` in the isolated WSL review checkout. `preview.json`, `rules-resolved.json`, `coverage.json` and `review.json` retain selection, rules, file accounting and structured findings.

- `boundary-probes.log`: fresh disposable PostgreSQL and ordinary compiled API/auth/worker roles; actual pre-provision/pre-avatar snapshot, real commands and confirmed events, database restore, signed filesystem journal, public-key verification and ordered replay reproduced R01/R02. `boundary-probes-sql.log` and `signed-fixture-probe.log` preserve earlier diagnostics. Each disposable database project/volume was removed by its owning probe.
- `release-compose-probe.json`: real Compose recreation reproduced the unchecked input replacement behind R03; only the probe's own project/container was removed.
- `time-probe.json`: actual compiled contract results for years 1, 99, 999, 1000 and 2026. The first host attempt lacked compiled contracts; it is nonqualifying. The successful probe followed a normal contracts build.
- `schema-parity.log`: offline generator inspected all 36 current models and reported no schema changes. It ran in the freshly built current-source image without changing tracked migrations.
- `probe-image-inputs.json`: all 238 frozen application/configuration/native inputs matched the actual snapshot probe image, `sha256:fda57b80a342c1158a04f2ee0330cd1f222a87ed6e863c87a54757e4a5937706`, byte-for-byte. The earlier fixture image comparison is retained separately. Documentation-only review records are outside that application manifest.

The earlier full `pnpm verify` and native compilation records remain valid for the cases they executed. They did not cover the newly reproduced cases and are not a clean-review conclusion. This review did not rerun full verification, rebuild/install native applications, perform browser/device acceptance, deploy to the Linux server or qualify an independent failure domain. No code fixes were applied during the original review pass; subsequent corrections follow below.

B01's native specimens, B04–B09 product/transport/device work, and the user-deferred independent-host drill are documented pending work, not newly discovered defects. The user authorized the focused correction batch below before continuing B04; shared-data activation remains closed.

## Correction batch

All five findings are corrected and their regressions passed in the full online `pnpm verify` run on 4 November 2026 (04:09:30–04:21:43 UTC). Final validation evidence is recorded in the [implementation progress](../../implementation/accounts_journeys_access_progress.md).

| Finding | Correction | Regression boundary |
| --- | --- | --- |
| R01 | New migration 0009 persists the opaque auth-subject binding transactionally for new version-2 account-deletion events, outside API column grants. Replay reconstructs a missing deleting account and retirement; exact legacy mappings remain supported, and missing/conflicting bindings fail closed before checkpoint advancement. Released SQL and old signed bytes remain unchanged. | A real snapshot predating provisioning, actual deletion/confirmation, signed replay, reprovision denial, legacy compatibility/gap rejection, conflict rejection and restored auth cleanup; existing-volume 0000–0008 upgrade. |
| R02 | Allocation, upload/process target lookup, final activation and managed reads honor avatar recovery barriers. | Same original create command/UUID retried after restoring a snapshot without the avatar, plus an available avatar present in the snapshot and stale worker/activation/read attempts. |
| R03 | Release checks exactly the stopped, restart-disabled edge/server/worker containers and their project/service/image inputs. It starts and reinspects those exact IDs, waits for writer health and then starts the checked edge; it never reconciles through Compose `up`. | Disposable real Compose project: changed configuration cannot replace checked inputs; a missing checked writer fails before the remaining writer starts. |
| R04 | Every integration caller declares development/runtime mode; development requires 200 before browser assertions and runtime requires 404. | Existing development form/access/layout/accessibility gate and packaged-production exclusion gate. |
| R05 | Format the ISO year to four digits before comparing the intended local time. | UTC years 0001, 0099, 0999, 1000 and 9999 alongside existing DST/chronology cases. |

This correction pass does not add independent external-model review, native runtime acceptance or independent-host recovery qualification. The Linux deployment remains deferred and shared-data activation remains closed.
