# Domain transactions and bounded workers

B03 extends the [database foundation](identity_database.md) with server-only services. [Implementation progress](accounts_journeys_access_progress.md) records executed qualification. These modules do not mount account, source, journey or authentication HTTP endpoints. B04–B08 integrate them into the corresponding product slices.

## Authority and commands

`@kairn/backend/commands` validates a closed command union, normalizes shared text fields and exact asset sets, and calls `operations.execute_command` inside `runAsAccount`. The actor and fresh-session assertion come from trusted session integration; neither is accepted from command JSON. HTTP adapters must parse the selected entity ETag into the expected revision/generation and hash preview/status bearer credentials before this boundary.

The API retains its scoped read ACLs. Direct profile updates are now revoked, alongside the already closed domain writes. A separate `kairn_command` NOLOGIN, non-owner, non-BYPASSRLS principal owns checked entry points. Application principals cannot inherit or SET that role. It has explicit service policies under FORCE RLS, no schema CREATE, no auth password/session-token reads, and only the auth row operations needed for named mail/cleanup work. Worker/auth schema USAGE does not grant domain table access. Reset-token eligibility is confined to an event-bound boolean check and cannot return a verification token.

| Action | Current authority and additional checks |
| --- | --- |
| Profile and avatar | Active verified domain account; own profile revision, own upload/manifest, declared bytes/hash/type and current owner lifecycle. |
| Register source/asset identity | Active owner; immutable source ownership. Registration never verifies uploaded original bytes. The asset registration receipt points to its parent source; the new asset UUID remains part of the normalized command. |
| Expand source scope | Source owner with active participation, an active assigned journey and a current active administrator. Administration alone grants no review/source access. |
| Narrow/withdraw source scope | Source owner, including after departure or archival; exact current source-grant revision. Local deny and recovery event commit together. |
| Request originals | Active named participant, exact eligible verified asset IDs and one owner/journey. Requesting grants no review or export authority. |
| Approve originals | Source owner, unexpired request, current recipient membership epoch, eligible source/asset/grant revisions and bounded expiry. Archive-aware exact-original approval grants no contribution/publication power. |
| Use originals | `sources.actor_can_export_asset(asset, grant)` checks current account, owner, recipient/epoch, journey, every asset and source-grant revision, state and expiry. Future archive/read delivery must use it at generation and every managed read. |
| Archive/canonical deletion/remove/invitation revoke/transfer cancellation | Current administrator; current generation and target revision. Implemented lifecycle actions require fresh authentication; archive/delete/member departure also consume a current single-use impact. Canonical deletion requires both named confirmations. |
| Leave | Current participant acting on their own membership, fresh authentication and impact. Ending the sole administration responsibility produces a freeze; no successor is invented. |
| Account deletion | Current account, fresh authentication, impact, named confirmation and a hash-only finite status receipt. Account deny, auth-session revocation and retired-subject barrier precede bounded cleanup. |
| Worker effects | Resolve an ID-only job against durable state. Recheck current target, generation, epoch, account and expiry; never install a client-supplied account context. |

Other command kinds remain closed. Journey creation/correction, invitations and capability/transfer workflows are implemented in their later slices; the existing contracts are not executable permission grants. Coauthor/publisher review access, owner originals and named original-export rights remain distinct.

Lock order is account eligibility/command identity, journey IDs, relevant membership/guard rows, then source/grant IDs in stable order. Journey changes share the journey lock. Account-wide cleanup handles one ordered journey and at most 100 of each source/export grant kind per unit, followed by identity cleanup. Recovery freezes administrative responsibilities in ordered batches before admitting writers. The live expansion predicate also checks the administrator's account state during the interval between account deny and cleanup.

An advisory transaction lock serializes `(actor, command ID)` retries. The durable receipt binds operation and SHA-256 of PostgreSQL's normalized JSONB payload. A changed payload conflicts; an expired/redacted identity never runs again. Replaying an accepted receipt returns only its original opaque resource/revision, not renewed rights. Consumers reconcile current state; all use predicates still inspect current rows.

Domain changes, fixed-shape audit records, recipient notices, restrictions and approved pg-boss sends use the same Drizzle/pg connection. Queue insertion failure rolls back everything. Jobs contain only `{eventId}`. `fromDrizzle` remains the only producer write adapter; metadata reads use the caller-owned bounded pool. External mail, storage and journal effects remain at least once.

## Mail and the pinned auth callback

Mail is AES-256-GCM sealed with a key ID and random nonce. Authenticated data binds event ID, purpose, generation, recipient HMAC and expiry. Only sealed bytes reach `email_delivery`; job payloads contain no URL, body, address or token. The worker resolves the current auth subject/offer/recipient and rejects expired, retired, cancelled or stale work before decrypting and sending a fixed template to an allowlisted application URL. A successful SMTP acceptance clears the sealed payload. A crash after SMTP acceptance but before its database commit can duplicate delivery; stable Message-ID and current-state checks do not claim exactly once.

**Better Auth 1.7.15 swallows failures from `runInBackgroundOrAwait`.** An ordinary throwing callback can return HTTP 200 and leave auth rows/token state committed. The real-library fixture under `tools/identity-generation/src/qualify-mail-callbacks.mjs` qualifies that behavior and the guard around it.

B04 must bind the Better Auth Drizzle adapter to the transaction supplied by `runAuthMailTransaction`, and await its `guard` inside every mail callback. The outer guard drains tracked callbacks before closing its transaction, detects a callback failure even when the library catches it and rolls back auth rows, mail and jobs. The actual pinned signup succeeds with a sealed mail enqueue on that connection; guarded signup/reset failure rolls back. Unknown-recipient successful recovery responses traverse the same restricted queue using an ID-only no-op job, so enqueue availability is not checked only for existing accounts. This is not permission to use a separate pool transaction inside a callback. Keep detached background tasks disabled and apply the selected non-enumerating account/IP/recipient budgets before the handler.

`consume_budget` uses atomic PostgreSQL counters and the selected D04 limits. HMAC keys distinguish operation and target scope; cooldown uses a serialized real 60-second interval. HTTP integration must supply trusted proxy/account/recipient keys and apply every applicable dimension, not choose one budget. Counter retention is bounded separately from auth request transactions.

## Private identity media

`@kairn/backend/media` supplies the private S3-compatible adapter, bounded upload reader, owner upload gateway, sanitized worker and managed owner read. No raw object URL is returned. Configure the same private bucket in the producer/worker; there are no client bucket/key selectors at the HTTP boundary.

- Accept JPEG/PNG only, at most 5 MiB and 12 million decoded pixels. Compare actual bytes, declared SHA-256 and actual type. SVG/GIF/PDF/HEIC and animation are unsupported.
- Record `uploaded_at` only after the gateway verifies the immutable private write. Completing before upload fails without consuming the command ID or closing the pending upload; upload and completion can then be retried.
- Decode/re-encode with pinned Sharp in a killable child: one decoder per worker process, one libvips thread, cache disabled, 96 MiB V8 heap, five-second codec timeout/eight-second parent deadline. The worker container retains its 512 MiB/one CPU limit. Re-encode to metadata-free JPEG, at most 512 pixels, without upscaling.
- Put an immutable deterministic candidate privately, then lock/recheck the active owner, upload revision/state and expiry before switching the profile pointer. A failed replacement preserves the previous avatar. Duplicate workers cannot delete an already committed matching representation.
- Delete raw quarantine after activation; a durable `quarantine_purged_at` allows retry after a crash. The cleaner removes both quarantine and the deterministic candidate, including a candidate written before a crash that never reached the manifest.
- Byte/manifest cleanup retains only `retired_avatar` allocation identity. A UUID cannot be reused by a new upload while an old job or backup could refer to it. Those opaque barriers have no automatic GC without retirement proof.

Actual native picker output, device flows, HTTP adapters and UI states remain B04 gates. Source capture/original storage, archives, Range delivery and publication derivatives remain later work.

## Workers, retention and readiness

`registerDomainWorkers` registers only the four approved product queues. The real worker process activates them only when `KAIRN_DOMAIN_WORKER_CONFIG` names a bounded mode-0600 server-side configuration file. There are no usable default mail/journal credentials. The file contains journal **public verification keys** plus append credential, private S3 credentials/bucket and mail decryption/recipient keys, origin and TLS SMTP configuration. It must be mounted read-only; never commit it or transfer it between authoring hosts.

A 30-second reconciler retries durable work after queue retry exhaustion, deletes bounded eligible avatar objects, purges expired sealed mail and runs bounded metadata retention. It processes pending restrictions before object cleanup; a failed cleanup cannot suppress their retry. Account/canonical cleanup status and independent recovery confirmation are separate. Receipt expiry stops receipt access; it never stops recovery/cleanup. Retention handles expired counters/auth token/session records, mail metadata, impact previews, terminal recipient PII, notices, audit metadata and resource redaction of expired completed receipts. Pending restriction receipts retain the minimal identity needed for reconciliation. Restriction events/receipts, retired identities and recovery barriers are never automatically collected while backup-retirement proof is absent.

B03 adds migrations 0006–0009 and three records (`retired_avatar`, `recovery_barrier`, `recovery_checkpoint`) to B02's 33-table checkpoint: 36 current tables. Migration 0009 adds the private auth-subject binding for new account-deletion journal events and makes avatar allocation/activation/read helpers honor recovered denies. Retained legacy journal bytes remain unchanged; replay fails closed when their exact account binding is unavailable. The ledger also fingerprints protected function definitions/ACLs, table/column privileges and types, indexes, constraints and triggers. Policy fingerprints remain separately checked. Runtime rejects drift; it never repairs/migrates schema. Additional auth expiry/retention indexes are SQL-owned and leave the pinned generated auth schema untouched.

Connection accounting includes the worker readiness pool: the configured current API/worker foundation is 4 API + 4 pg-boss + 1 readiness; opting into domain workers adds 2. The integrated account server reserves 2 auth + 1 shared producer metadata, for **14 runtime connections**, or **16** with the overlapping two-connection controlled bootstrap. Reserve separate operator capacity. No module/request creates its own pool.

Use `pnpm verify:domain` for the isolated real-role/database/S3/SMTP/recovery suite and final packaged non-root decoder check. `pnpm verify` includes it alongside the existing identity, web and data checks. See the [recovery runbook](restriction_recovery_runbook.md) for the independent-host protocol and concrete fence procedure.
