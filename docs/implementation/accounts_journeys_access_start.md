# Accounts and journey access: how implementation starts

Date: 3 November 2026. Read with the [final implementation plan](accounts_journeys_access_plan.md), [selected decisions](accounts_journeys_access_decisions.md) and [experience handoff](accounts_journeys_access_design.md).

The planning gaps from the independent review now have concrete designs, selected policies, work owners and acceptance checks. We can begin local implementation. Actual schema, auth, device and independent restore evidence still needs to be produced; “ready to implement” does not mean the feature or deployment is complete.

## 1. What you will see first

The first usable feature is: create an account, receive verification/recovery mail locally, sign in, manage a private profile/session, and reach a polished Your journeys empty state. Next, create one private journey and invite another test account into that exact same journey with clear powers. The later capture/import/publishing product still follows the main R1 order.

We build the design and the data boundary together. The UI is not a final cosmetic task. You will review real buttons/forms/error states and phone/tablet/desktop layouts while schema and security work progresses, then exercise the actual integrated flows. Development-only specimens use labeled fixtures and never create fake journeys in an account.

## 2. Starting branch and checkpoint

The read-only GitHub check on 3 November 2026 found setup handoff [PR #2](https://github.com/nishanthturnstile/Kairn/pull/2) still open/draft at `84d339e734dfe85e9ea12e356f650d59991ab32e`; current main was `605760723ab4c91e2bd7b2d059dd6b67d0b14b39`. This is a dated observation, not a live prerequisite that should be assumed next session.

That earlier observation was superseded when setup PR #2 merged into main at 7db6595 and development was safely fast-forwarded to it. Follow the [current checkout workflow](checkout_workflow.md): new implementation branches start from current `development`, feature PRs target `development`, and reviewed integration checkpoints promote to `main`. At B00 recheck actual remote/PR state and preserve any pending files; do not mix new implementation into a closed setup PR. The [reconciliation record](checkout_reconciliation_progress.md) preserves the pending plans and host settings before synchronization.

Plan finalization itself did not publish a PR. The subsequent authorized checkout reconciliation publishes the preserved planning documents with the source-management helper, separately from application implementation. The next feature uses its own development-based branch/publication; no account credential or signing setting needs to change just to start code.

Implementation has now begun on the WSL authoring checkout. [Implementation progress](accounts_journeys_access_progress.md) records the actual starting commit, selected baseline, first B01 slice and executed evidence. Keep each batch not started/in progress/verified with actual evidence; the repository setup checkpoint remains the source for completed foundation work.

## 3. First reviewable coding batch

Start with B01–B02 as a bounded change, rather than trying to deliver every module at once.

1. **Freeze the selected interface:** turn the decision document into constants/validation and typed contracts for profile, journey, invite, powers and operation status. Add Problem Details, ETag/command-ID rules and safe projections without importing database types into clients. Preserve the existing status/old-client fixtures.
2. **Build the first design specimens:** real token-backed fields/password controls/buttons, journey empty/no-cover state, person/power editor and pending-restriction result. Show compact phone, iPad/tablet and desktop composition with keyboard/focus/error/pending states. Use the existing field-journal direction and pinned font inputs.
3. **Add reviewed database migrations:** auth generation, stable domain identity/provisioning, canonical journey/member/capability identity, invitation admission guards, grants and operation/audit/restriction records, followed by RLS/role/index policy. Migration owner remains outside runtime.
4. **Prove the critical SQL boundary:** first/concurrent account provisioning, one account/journey reference, no cross-account reads, source/asset owner integrity and real API enqueue permissions. Denied enqueue must roll back domain/audit/jobs; producer cannot consume/delete jobs. Use the installed queue adapter and reviewed per-queue producer path.
5. **Review the concrete change:** SQL and policy graph, generated contracts, component specimens, meaningful real-DB results and remaining gates. No shared-data enablement or public launch is implied by this first batch.

Its exit is G03 plus the relevant G04/G05/G07/G08 foundation checks and contract/design validation. Generated schema shape and grant behavior must be proven against pinned packages; installation/compilation alone is insufficient. If a selected version behaves differently, record the evidence and make the smallest compatible adjustment rather than silently upgrading the stack.

## 4. Next visible checkpoints

| Checkpoint | What is delivered | What you can verify |
| --- | --- | --- |
| Account slice, B03–B04 | Durable verification/reset mail, secure web/native sessions, private profile/avatar through the bounded adapter, account controls and empty history. | Complete sign-up/recovery, paste/autofill, failure then retry, sign-out/relaunch, readable forms and larger text; another account's data never flashes. |
| Private journey slice, B05 | Create/correct title/dates/timezone, one history reference, no-cover overview and useful empty/failed/offline states. | Create, retry an uncertain save without duplication, filter, correct dates, rotate/back without losing form context. |
| Group access slice, B06 | Explicit invite/accept, scoped People, independent editing/publishing, notices and restrictive status. | Five test accounts open the same ID; participant/admin-only/publisher-only/coauthor see different allowed actions. Removed members cannot rejoin through an old second invite. |
| Lifecycle/recovery slice, B07–B08 | Transfer/leave/archive/delete and grant foundations with actual independent receipt/replay evidence. | Transfers need acceptance, no successor causes a freeze, source ownership survives departure, pending confirmation never says complete. Restore cannot revive revoked offers or rights. |
| Integrated handoff, B09 | Current-head CI, applicable final-image/contract/native/accessibility evidence and an honest pending list. | Agree that this account/journey milestone is ready for the next durable-capture step; source/archive/publication gates remain with their actual workflows. |

Group flows can be implemented and exercised with synthetic integration identities in a closed local test environment while the journal is being qualified. Real shared-data activation stays disabled until D01/D11/G09 pass. Do not treat a local file-journal test as independent recovery acceptance.

## 5. What we can do concurrently

After contracts are fixed, design/assets and real migration/policy work can run alongside each other. Web and native clients can then consume the same real API. Journal infrastructure qualification can progress separately while local failure/retry tests run. One owner integrates shared contracts/migrations; independent work must not race edits or modify another host's dependencies/output.

The developer/agent owns implementation, tests, generators, migrations, documentation and branch handling. Your useful checkpoints are the consumer flow/layout review and later real-device task confirmation. Apple sign-in/keychain/device trust remains local to the Mac/device; secrets never go into chat or repository files. The independent journal destination and production sender/domain are actual infrastructure inputs, not questions about which UI library to select.

## 6. Required external inputs, at the point they matter

- **Before real shared-data activation:** an independently hosted journal/backup destination with append, receipt, ordered-head, encryption, retention and key recovery; operator ownership; a verified old-writer fence/restore drill. Supply the destination/access through the approved secret mechanism when integration starts.
- **Before public email/deployment:** actual owned domain/app identifiers and verified sender, VPS inventory/region, production credentials and terms matching measured retention/recovery. Private local development and Mailpit do not require these to start.
- **Before changed native-runtime acceptance:** available Android target, Mac/iPhone simulator and unlocked/trusted iPad with current signing. Renew the documented free profile when needed. Physical iPhone acceptance remains deferred until available.

No further product-policy interview is needed to start: the selected decision document supplies the initial authority, lifecycle, field, expiry and retention baseline. These choices can later change through explicit review; there is no need to invent unresolved provider credentials or claim their gates passed now.

## 7. Commands and evidence discipline

Use the [current host guide](native_host_setup.md); activate `. .\.kairn\env.ps1` on Windows and `. .kairn/env.sh` on Mac before Node/pnpm/native commands. Keep Compose in WSL and dependencies/Metro/native output on the owning OS.

Existing checks, used when their changed boundary is ready:

```sh
# WSL: build the current checkout into the tooling image.
docker compose --profile tools run --build --rm tooling pnpm check
docker compose --profile tools run --build --rm tooling pnpm test
docker compose --profile tools run --build --rm tooling pnpm test:integration
```

Windows native uses `pnpm check:mobile` / `pnpm verify:android`; Mac uses `pnpm verify:ios` for the affected rebuilt inputs. The host guide owns exact native sequencing/signing. `pnpm api:generate` intentionally updates contracts; `pnpm api:check` detects drift. Vite+ remains the formatter/lint/test owner.

B02 now supplies identity migration/generation commands, the enqueue-only producer boundary and `pnpm verify:identity` through the existing verification entry point. The [identity boundary guide](identity_database.md) records the policy graph, restricted queue grants, existing-volume upgrade and current/planned pool budget; [implementation progress](accounts_journeys_access_progress.md) owns executed results. Journey/grant/operation schemas and full command/audit/event/mail acceptance remain open. Add only mandatory/critical tests needed for the boundary; do not add routine configuration-value tests or a new task runner.

Before each handoff, record code/schema/lock/image/device inputs, actual command results, visual task evidence and remaining limits. Never borrow setup CI or an earlier native pass to qualify changed auth/SQL/UI inputs. Push/review/CI happen on the actual implementation head when publishing is authorized; a green check from a closed PR does not qualify later changes.
