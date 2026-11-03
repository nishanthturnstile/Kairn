# Accounts, journeys and access: implementation progress

Date: 3 November 2026. Execution against [implementation plan 1.2](accounts_journeys_access_plan.md) and the [selected decisions](accounts_journeys_access_decisions.md). This record is separate from completed [repository foundation acceptance](repository_setup_progress.md).

## Starting checkpoint and scope

- WSL is the single authoring checkout for this backend/contracts/web task. Native hosts have not been synchronized or changed.
- Clean starting source: `605bc61382f2445eb53aea2f64dc6b45c7032641`. A live fetch/GitHub read confirmed `main`, `development` and both remote heads matched; checkout-workflow PR #3 and promotion PR #4 were merged. Earlier notes that setup PR #2 was still open are historical.
- Implementation branch: `feat/accounts-journeys-foundation`, created from that current `development`. No new PR, push or hosted CI evidence is claimed.
- Foundation already completed: pinned tooling/shared exports, status OpenAPI/client and compiler boundaries, composed API/web/worker/data/storage/mail, required CI and the agreed Android emulator/iPhone simulator/physical iPad setup gates. Product accounts, journeys, domain migrations, permissions and recovery were still absent in source.
- B01 contracts/web specimens and the first B02 identity/database boundary are now implemented. B01–B02 remain open; shared data and registration/journey endpoints are not enabled. The generated domain descriptors are intentionally unmounted until real policy/transaction handlers exist.

## Batch status

| Batch | Status | Evidence / remaining work |
| --- | --- | --- |
| B00 Baseline | Verified | Clean source and actual branch/PR state reconciled above. Selected baseline 1.2 retained. |
| B01 Workflow/design/contracts | In progress | Core and extended schemas, 47 domain operation descriptors, regenerated clients and first responsive web specimens. Native specimens and remaining workflow/state mappings stay open. |
| B02 Schema/migration/privileges | In progress | Generated auth tables, domain account/profile/retired-subject SQL, controlled runner, narrow provisioning/RLS, readiness and real-Postgres acceptance. Journey/grant/operation schemas and enqueue-only producer qualification remain. |
| B03 Transactions/restrictions | Not started | Preliminary account transaction wrapper only; domain receipts/audit/jobs, media, durable mail and independent journal/replay remain. |
| B04–B08 Product slices | Not started | Real accounts, journeys, invitations, lifecycle and source/export integration remain unaccepted. |
| B09 Qualification | Not started | Current slice checks do not close integrated G01–G12. |

## Implemented first B01 slice

`packages/contracts/src/domain/` supplies platform-neutral Zod schemas for own profile, canonical journey identity and intended times, one-reference private history, limited/administrative People projections, invitations, independent coauthor/publisher edits, impact-bound lifecycle commands and restriction status. Database/auth implementation types stay out of clients.

- D04/D05 text bounds count Unicode scalars consistently, reject lone surrogates and trim only non-secret profile/title fields. Password bytes remain unchanged; the actual server blocklist and Better Auth credential-path enforcement belong to B02/B04.
- Intended local minute, UTC instant, offset and IANA zone must agree; nonexistent local times and reversed chronology fail. Both ambiguous DST occurrences require an explicit consistent instant/offset. Native ICU/timezone behavior is not yet qualified.
- Administration cannot appear in the editable-power request. Former history cannot contain a protected title/date/category/roster. Limited People and pre-verification invitation states reject private-field additions. These validate projections, not SQL/API access enforcement.
- Commands carry stable UUIDs; journey creation also carries its canonical resource UUID. Mutable contracts require a strong If-Match header. Durable receipts, payload-digest conflicts and replay policy remain service work.
- RFC 9457 errors use `application/problem+json`; private response descriptors specify no-store. HTTP 202 means access denied with recovery confirmation pending, separately from HTTP 200 confirmed restriction and any byte/PII cleanup. A post-deletion operation projection contains no target/account identity.
- Existing status contract 1, sync protocol 1 and old-client fixtures remain intact. OpenAPI/client generation includes descriptors, not mounted endpoints. The resumed slice adds avatar, account-data export/deletion, transfers, notices/access-action, invitation listing/removal and source/export-grant contracts. Sessions/security continue through the pinned auth library; their integrated transports and real flows remain B04 work.

Web development entry `/setup/accounts` uses actual owned shadcn primitives and the selected tokens for labeled fields/password visibility, local error focus, empty/no-cover history, independent capability controls and persistent pending/confirmed restriction states. Every sample is labeled; local validation and power previews send no requests or store credentials. Only the development server enables the route; the production route guard and HTTP factory keep it unavailable by default.

Generated source provenance: `shadcn@4.23.0`, official `@shadcn` new-york/Radix button/input/field/empty/alert with generated label/separator dependencies. Reviewed changes preserve light-first tokens, readable wrapping, enabled borders, Paper-separated focus, larger touch controls and reduced motion. Imports are normalized to relative paths for the existing workspace boundary checker. The generated full `radix-ui` dependency was replaced by the three used primitive packages; exact runtime/test pins are in [architecture section 14](../core/architecture.md#142-web-backend-and-worker-package-pins).

Newsreader and Instrument Sans variable TTF inputs and both OFL notices were downloaded from the exact pinned URLs in [font source evidence](../research/accounts-journey-access/font_sources_2026-11-03.json). Their SHA-256 values match that record. Web bundles the unchanged TTFs and notices as managed static assets; no font conversion or new font source was introduced. WOFF2 optimization, native named-weight packaging and actual Android/iOS font/control rendering remain B04 work.

## First B01 coverage and executed results

Chosen coverage targets the B01 contract boundary and required specimen behavior: Unicode/secret preservation, timezone/DST correction, protected-field rejection, capability separation, pending-versus-confirmed state, generated-client command/ETag transport, compiled TS6/TS7 consumers, and one composed web acceptance scenario for form focus/password controls/independent powers/layout/accessibility. No routine configuration-value or mocked permission-service suite was added.

All qualifying application checks in this section used that B01 slice built into Compose images. Private logs/screenshots/input hashes live under `.kairn/verification/accounts-journeys-b01/`; these ignored artifacts are not publication or independent recovery evidence. The resumed B02 results below supersede this application-input checkpoint.

| Executed check | Result and scope |
| --- | --- |
| `docker compose --profile tools run --build --rm --no-deps tooling sh -c 'pnpm check && pnpm test'` | Passed. Formatting, tooling/lint/types, generated OpenAPI drift, workspace boundaries, TS7.0.2/TS6.0.3 compiled consumers/negative fixtures, mobile static checks and 20/20 Expo Doctor checks; all 45 shared tests passed. |
| `docker compose up -d --build server` | Passed; existing development server rebuilt and healthy. Existing queue bootstrap completed; this is not a new domain migration. |
| Current-image `pnpm test:integration` through Compose ingress | All six tests passed. The new specimen scenario exercised local validation/error focus, password visibility, independent powers, pending/confirmed feedback and no domain writes. |
| Specimen layout/accessibility | 390×844, 820×1180 and 1440×1000; no horizontal overflow and zero axe violations at each width. Reduced-motion path exercised. All three screenshots inspected; this is web evidence, not iPad/phone native acceptance. |
| `pnpm verify:web` | Passed both isolated development and packaged runtime projects, six integration tests each. HTTP/SSR/hydration/lazy assets/request isolation and guarded delivery passed. Runtime denied the specimen route, resolved the compiled production dependency closure without source/dev tooling, and ran non-root. Wrapper removed only its own disposable projects/volumes. |
| Actual image/source comparison | Passed SHA-256 comparisons for all 150 recorded code/config inputs inside the rebuilt tooling image, including generated client/OpenAPI and the lockfile. |
| `git diff --check` | Passed. No hosted CI, native rebuild or new SQL policy evidence is inferred. |

Input identity: base commit `605bc61382f2445eb53aea2f64dc6b45c7032641` plus this uncommitted feature-branch slice, with code/config manifest SHA-256 `447a5b7ed92971dafdc9a2de1df88edd8b89916142a26288dfe8132a3e7e7603`. Lockfile SHA-256: `08b618b2609192d00314c6799876b48c30694f908cdaec664c930fef88bf115a`. No new migration/schema ID exists. Tooling image ID: `sha256:ca82457d6e5f22ed48240d4bf6b6abc41914d3f143525c50609b021f94ea2b8b`; live development server image: `sha256:2a017e08b45e25e4e2543a54dd7247b376048f72ac5e61ec270510b63c7387c4`; qualified packaged server image: `sha256:6cae92a08374030e20b48466edfb24032b1785df3d3779ffbef546fbc73f6186`.

Evidence files: `inputs.json`, `image-inputs.log`, `check-test.log`, `server-build.log`, `web-integration.log`, `packaged-web.log`, and `accounts-{compact,tablet,desktop}.png`. The code/config manifest excludes documentation and private host files, matching the application verification scope; documentation-only handoff edits do not change those application inputs.

Initial integration corrections: the accessibility adapter required an explicit matching `playwright-core` peer under strict peer rules; the restriction response header needed a literal OpenAPI type. Both were corrected. The first tooling attempt is retained as a failed run, not qualifying evidence. A review also tightened password end-of-string handling so a final newline cannot bypass the maximum scalar count.

A direct host diagnostic after schema-only generation could not resolve the universal contracts exports because that generation intentionally cleans their build output. The full package prerequisite in the existing Compose check pipeline restored them; both platform compiler checks above then passed. No dependency/type-check bypass or altered build order was introduced to hide the diagnostic.

## Next implementation work

1. Complete B01 action-to-policy mappings and lifecycle/source/export specimens; cover stale save/offline/access-loss and native component specimens before calling B01 complete.
2. Continue B02 beyond the identity slice: journey/membership/admission/grant/operation schemas, their nonrecursive policies and relational tests, supported upgrades and actual enqueue-only API/auth producer acceptance.
3. Continue B03 transactions/mail/restriction/media, then connect B04 accounts and B05 private journeys. Keep actual independent journal/fence and production origin/sender activation gates separate from local progress.

Physical iPhone remains explicitly deferred. No current native build/device acceptance, actual account recovery, five-account canonical journey result or independent journal/restore result is claimed from this slice. Identity SQL results are recorded separately below and do not qualify journey/source permissions.

## Resumed B01/B02 identity slice

The interrupted run's work was preserved on the same feature branch. Extended contract groups include strict grant projections, exact asset/source-revision bindings, owner approval, transfer/lifecycle actions, notices, avatar upload descriptors and minimal post-deletion status. There are now 48 generated operations including the original system status. These remain wire descriptions; no fake success endpoint was mounted.

The [identity database boundary](identity_database.md) records the actual files, role/policy graph, controlled existing-volume upgrade and pool budget. Better Auth `1.7.15`/matched `auth` generator and Drizzle Kit `0.31.11` live in an isolated development workspace. The backend uses Drizzle `0.45.4`/pg, without importing the auth generator or Bun/browser globals. Pinned auth generation reproduces all five library models; namespace adaptation changes only the schema factory. Drizzle reports no drift across the eight identity/auth tables.

The two reviewed migrations introduce the auth namespace, stable domain accounts/private profiles/retired subjects, restrictive FKs, bounds and monotonic-transition triggers, FORCE RLS, explicit column grants, and a fixed narrow provisioning helper. The advisory-locked/checksummed runner applies the pending release atomically. Both API and worker readiness require the supported ledger and safe identity structure/privileges. Runtime does not own schemas or migrate. The current connection ceiling is eleven across API, worker/control and the overlapping one-shot migrator; future auth/producer pools require a revised budget.

Strict declaration repairs: the Drizzle patch restores missing SQL-wrapper methods, removes invalid interface implementation/abstract declarations and private method exclusions, in matching ESM/CJS declarations. The transitive Gel patch derives the fetch input from the actual runtime fetch type. These patches change no JavaScript and keep `skipLibCheck: false`. Development-only Gel/MySQL peers satisfy Drizzle's published declaration graph. The compiled Node-only transaction fixture proves selected row inference and rejects invalid revision/credential fields. A missing generator workspace boundary and an uninvoked backend fixture from the interrupted run were corrected.

Coverage is four real-Postgres scenarios: failed-release rollback/fresh application/repeat/checksum/readiness failure, concurrent first provisioning under the auth role, private-profile and pooled-context isolation, and retired-subject denial across auth-FK detachment/purge/email reuse. The owner connection is used only to set up destructive failure fixtures; enforcement assertions run as real auth/API roles. No broad mocked policy suite was added.

Identity acceptance passed: `pnpm verify:identity` rebuilt the current source image, passed all four scenarios and removed only its disposable PostgreSQL project/volume. It exercised both API and worker readiness without granting the worker identity-schema access, missing/unsafe privileges, newer ledgers, cross-account writes, rollback after SQL failure, and a new identity reusing the retired identity's email. It does not implement or qualify a user-facing deletion coordinator.

Corrections retained in failed-run evidence: PostgreSQL requires a narrow SET-parameter grant for the function's custom setting; function EXECUTE ACLs must be set before transferring ownership to the NOINHERIT provisioning role; worker catalog inspection must use OIDs without identity-schema USAGE. The RESTRICT-FK assertion now expects the actual PostgreSQL 18 restriction SQLSTATE, and transaction failure assertions follow Drizzle's actual error cause. The first broad verification also exposed the outdated workspace inventory, which now includes the isolated generator. None of these failures is reported as a passing attempt.

Current execution evidence is under ignored `.kairn/verification/accounts-journeys-b02/`. The earlier B01 image/hash record above remains historical and does not qualify these changed dependencies or migrations.

## Pre-review B01/B02 qualification

The final complete `pnpm verify` run passed from 2026-11-03 10:54:22 UTC to 11:03:22 UTC. Its independent wrapper record is `.kairn/verification/run-EUAP5E/result.json` (`status: passed`, nine retained artifacts and six generated-input comparisons). It built the actual current checkout into its images; no earlier foundation image/CI result was reused as qualification.

| Executed check | Result and scope |
| --- | --- |
| Full workspace/toolchain checks | Passed frozen installation, format/lint/types, Vite/React/compiler probes, actual OpenAPI/auth generator drift, package/import boundaries and compiled TS6/TS7 positive/negative consumers. The backend transaction fixture also passed with Node-only globals. |
| Shared tests | All 47 passed, including the extended source/export/deletion contract assertions. |
| Mobile static/export gates | 20/20 Expo Doctor checks, native lint/types and both Android/iOS JavaScript exports passed. These are not native rebuild, device, font/control, auth transport or accessibility acceptance. Existing upstream Metro export-resolution warnings remain visible in the logs. |
| Development and production web packages | Six integration tests passed in each mode. SSR/hydration, lazy assets, request isolation, guarded specimens and specimen behavior/layout/axe checks passed. The production runtime ran non-root and resolved its compiled closure without source, auth generation tools or unused Gel/MySQL drivers. |
| Isolated identity SQL | All four scenarios passed again inside the complete run. Fresh/failed/repeated/concurrent migration, checksum/newer-ledger rejection, missing/unsafe readiness, real auth/API/worker privileges, stable provisioning, private-profile reads/writes, pooled cleanup and retired-subject/email-reuse isolation were exercised. |
| Composed migration/recovery/data boundary | Invalid migration credentials blocked API/worker startup; controlled bootstrap repeated safely. All three seed scenarios passed. PostgreSQL outage removed readiness while preserving liveness; the existing worker reconnected with the new control-pool error handler. Both post-restart durability scenarios passed; the seed-only SMTP scenario was intentionally skipped in that second phase. Queue state and private object bytes/metadata survived container recreation. All six web tests passed after recovery. |
| Final production worker | Compiled non-root closure, no source/dev tools/declaration drivers/generator, and no migration-owner credential passed. |
| Exact input and migration packaging | All 190 recorded code/configuration files matched SHA-256 inside the final tooling image. The packaged server's compiled migration reader returned both reviewed SQL filenames/checksums exactly. Source/generated-input drift checks and `git diff --check` passed. |

Packaging exposed a pnpm `12.16.1` defect in the dedicated production lock: a pruned patched Gel development peer remained in Drizzle's identity. The [documented workaround](identity_database.md#pool-budget-and-qualification-scope) uses frozen legacy production deployment, with unused-patch permission scoped to absent development/native packages. The full source install retains ordinary frozen patch/config validation; a disposable altered-patch fixture failed with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. Both final package probes prove that the development-only peers/generator were excluded. No lockfile editing, package upgrade, skipped declaration checking or skipped included-patch application was used. The initial packaging failure and the intentionally stopped check before the worker idle-connection fix remain nonqualifying attempts.

Actual inputs: base `605bc61382f2445eb53aea2f64dc6b45c7032641` plus the preserved uncommitted feature-branch work. The 190-file code/configuration manifest digest is `f7ee8713a28590b3322f0656732bbe80f854c2b98c6e42455d212d7c2033e384`; lockfile SHA-256 is `629353d2dc8265fdc6ea103240d629140c92be46f4ef3a5ebcc2d2b9b059fcc2`. Runtime migrations are `0000_identity_auth_foundation.sql` and `0001_identity_access.sql`; their manifest SHA-256 is `ab8461d6f1024c85a037ba8025ab3052f9d07e4a743ad65c0e2e98cd3f6e08eb`. The final tooling image ID is `sha256:87e4c493e1c99944188e5f6a064f48182032ffb2e0033e15ac543e0775f8019b`. The separately probed, accepted packaged server image is `sha256:0ec420fb4cab233d3e7cb9b131abbdb457a9567c03398f8819bc221799d4618c`.

Evidence files include `inputs.json`, `image-inputs.json`, `runtime-inputs.json`, `identity-qualified.log`, `web-qualified.log`, `patch-negative.log` and the successful complete `verify-complete.log`. Earlier `identity-*.log` / `verify*.log` failures retain debugging provenance. Documentation and private host files are excluded from the application-input manifest; documentation-only handoff edits do not change the qualified application inputs.

B01 and B02 remain in progress. This closes the first identity SQL/provisioning boundary, not complete G03/G05/G10 or the full B02 schema/producer foundation. Next work is journey/membership/admission/grant/operation migrations and policies, command/audit/job atomicity under actual producer roles, and the remaining design/native specimens. Real registration/recovery/profile/avatar flows, shared-data activation and independent journal/restore evidence are still pending. The developer's existing database was not migrated by the isolated acceptance wrappers; its controlled upgrade is documented separately. No native host synchronization, new device acceptance, commit/push/PR or hosted CI is claimed.

## Open Code Review pass and corrections

On 3 November 2026 the requested single review used installed `ocr` 1.13.4 (`76ab46a`). Direct review stopped before a model call because no OCR LLM endpoint was configured. The supported [Open Code Review host-agent workflow](https://github.com/alibaba/open-code-review/blob/main/plugins/open-code-review/skills/open-code-review-delegate/SKILL.md) supplied file selection and resolved rules; the current coding agent performed the review. This is not an independent external-model pass. Custom inclusions covered tests, Docker packaging and declaration patches that defaults omit. Coverage was 75/75 reviewable files (100%, zero skipped); OCR excluded 18 generated/binary/unsupported entries from 93 changed files. Relevant governing documents were also consulted.

| Finding | Correction and focused regression |
| --- | --- |
| P1: the manually opened account transaction passed a Drizzle database, so a nested `transaction()` could COMMIT before a later outer failure. | Pass a real Drizzle transaction so nested work uses savepoints; reject a swallowed aborted SQL statement before COMMIT. The real-PostgreSQL regression checks rollback of nested profile writes and rejects false success after an aborted statement. |
| P2: readiness counted known policy names but accepted changed USING/WITH CHECK definitions or an extra permissive policy. | Fingerprint the complete policy catalog in the protected applied-release ledger, using a fixed search path; reject drift on readiness, repeat and before upgrade. Real-role checks alter a same-name policy and add an unexpected permissive policy, then restore each fixture. |
| P2: the source-grant HTTP 200 response replaced the restriction response with a union missing `restriction_complete`. | Include the confirmed restriction schema, regenerate OpenAPI/client output and add the actual result to compiled client-consumer fixtures. |

The pre-fix disposable PostgreSQL run reproduced the policy and nested-write failures; it is retained as failing evidence, including the cascading assertions caused by its deliberately altered policy. The final regression fixture restores policy changes in `finally`. Private OCR selection/rules/coverage/findings and verification logs are under `.kairn/verification/accounts-journeys-review/`.

Final `pnpm verify` passed from 11:26:15 to 11:36:29 UTC on 3 November 2026 (`.kairn/verification/run-20GZwN/result.json`, `status: passed`). It rebuilt the current source and passed format/lint/types, generation/boundaries/compiled consumers, all 47 shared tests, 20/20 Expo Doctor checks, both mobile JavaScript exports, six web tests in each development/production mode, all five identity scenarios, migration-startup rejection, outage/readiness recovery, queue/object restart durability and the final production closures. All three data seed tests passed; both restart tests passed with the seed-only SMTP test skipped, and all six post-recovery web tests passed. Native compilation/device acceptance and hosted CI remain outside this evidence.

All 190 recorded code/configuration inputs matched the tooling image byte-for-byte (`sha256:163558590c29ba084b59236968711938b47847aeb1913d238ec160a6acc9a33e`); the compact ordered input-list digest is `3275c538ed9346b2ffcb88c23266b055febc1b1c2052118a0548ae9708ca6986`. The lockfile and reviewed SQL/manifest hashes are unchanged from the pre-review record. Documentation and Git whitespace attributes are outside the application-input manifest. Staged whitespace validation preserves the exact pinned OFL notices through a scoped attribute, as with the existing upstream patch rule. No secret/host files were staged. Subsequent B02 work starts with section 8.5's enqueue-only producer qualification; journey/membership/admission/grant/operation migrations remain open.
