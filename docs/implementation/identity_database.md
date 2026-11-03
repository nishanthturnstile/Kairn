# Identity database foundation

This covers the identity, canonical journey/membership read boundary and enqueue-only producer portions of B02, built from the selected account/journey plan. Avatar, invitation/admission, grant, operation/audit, durable mail and restriction records remain to implement. No authentication endpoint or account-deletion endpoint is enabled by this foundation.

## Ownership and policy graph

| Principal | Current identity authority |
| --- | --- |
| `kairn_migrator` | Owns schemas/tables and runs reviewed migrations. Explicit maintenance RLS policies apply. Only this controlled role can assume the provisioning owner. |
| `kairn_auth` | Library-required DML in `authn`; EXECUTE on the provisioning function; enqueue-only email partition access. No direct private-profile reads or domain writes. |
| `kairn_identity` | NOLOGIN, non-owner, no BYPASSRLS. Owns only the fixed provisioning function and must pass FORCE RLS. Can read/lock the required auth-user columns and provision the subject's account/profile. |
| `kairn_journey_policy` | NOLOGIN, non-owner, no BYPASSRLS. Owns fixed policy lookups and membership/graph triggers, with identifier/state/epoch column access only. No auth subjects, profiles or journey details. |
| `kairn_server` | Read current permitted journey/membership/capability rows through FORCE RLS; no journey writes yet. Read the active context account's permitted columns and private profile; update only its display name, bio and advancing profile revision. Enqueue-only access to the four approved product partitions. No auth-table access or provisioning EXECUTE. |
| `kairn_worker` | No identity-data authority yet. Can inspect the migration ledger/catalog for readiness; queue authority remains separately controlled. |

The API policy graph is `profile → account → transaction-local account UUID`. The provisioning graph is `profile → account → function-local verified subject`; the retired-subject lookup uses the same subject. Neither graph recurses into a protected membership table. The function has an empty `search_path`, qualified relations, restricted EXECUTE and a fixed local subject setting. The auth/API/worker roles cannot assume its owner.

Only trusted auth integration may call `provisionVerifiedAccount`, after resolving the library session. A UUID or subject supplied in request JSON is not an authenticated actor. The helper locks the auth user before looking up the domain account, rejects absent/unverified/retired subjects, and creates at most one account/profile. Repeated provisioning leaves the domain profile intact. Future coordinated retirement must follow that same auth-user/account lock order.

Domain references use the stable UUID in `identity.account`. Its nullable auth link is restrictive, not cascading. Detachment requires a retired-subject barrier; the barrier has no live-auth FK and survives an auth-user purge. The transition trigger prevents reactivation and requires advancing revisions/generations. These constraints support future lifecycle work; they do not implement journal-confirmed deletion or restore replay.

`runAsAccount` owns one checked-out connection and a real Drizzle transaction. It installs transaction-local account context and checks current account state/revision/generation before invoking the typed operation. Nested transactions use savepoints and remain part of the outer atomic unit. A final SQL probe rejects a swallowed SQL failure before PostgreSQL could silently turn COMMIT into ROLLBACK. COMMIT/ROLLBACK clears context; any failed operation discards its connection, including rollback/socket failures. Future complete domain operations must add their resource lock order, authorization, receipt, audit, queue and response-generation checks inside this boundary.

## Canonical journeys and membership reads

Migrations `0002_journeys_foundation.sql` and `0003_journeys_access.sql` add one canonical journey, a stable unique `(journey_id, account_id)` membership across all states, and explicit membership-epoch capabilities. The composite capability FK binds membership and journey. A partial unique index permits at most one active administrator; deferred constraint triggers require exactly one for nonterminal assigned journeys and validate the complete current capability graph at commit. Zero administrators require an explicit freeze or deletion. Ended memberships keep their latest prior power snapshot; rejoining advances the epoch once, clears that snapshot and cannot reactivate old capability rows. The old rows remain revoked history. These are database invariants, not invitation acceptance or command implementations.

The current read policy is:

| Actor | Journey details | Membership/capability rows |
| --- | --- | --- |
| Active administrator | Current active/archived journey | Active roster and its current powers, plus own history |
| Active participant, coauthor or publisher | Same current journey, regardless of which independent power is held | Own membership/power history and the current administrator |
| Former member | None through the journey table | Own minimal participation and power history only |
| Outsider or missing account context | None | None for other accounts |
| Restricted/deleted account | None | None |

Creator identity alone grants no access. Canonical deletion denies the detail row even to its creator and retains only opaque membership references. The API projection layer must still construct the declared limited/admin/former wire shapes; these raw tables are not HTTP response schemas. Profile data remains private under its existing independent RLS graph; permitted display identities need a separate scoped projection in later work.

Runtime RLS calls three fixed, empty-search-path, SECURITY DEFINER boolean lookups. Their non-login owner receives SELECT only on required identity/journey IDs, lifecycle/state and membership/capability epochs, plus journey-ID UPDATE solely for the graph trigger's row lock. Its explicit UPDATE policy has a false WITH CHECK, so it cannot change rows. All helper reads themselves pass FORCE RLS through role-specific policies. The acyclic helper policies do not call runtime membership policies; runtime roles can neither assume nor inherit the helper role. Auth/worker have no journey-schema access. Catalog readiness rejects excess helper columns, runtime DML, missing/disabled integrity triggers, unsafe helper functions and missing administrator uniqueness. The protected policy fingerprint rejects changed or additional policies.

The graph check locks the canonical journey row before checking committed constraints. Future B03 coordinators must acquire journey, membership and capability locks in that order before changing them, end membership before revoking its capabilities, and perform current authority/generation checks with their atomic receipts/audit/restriction records. The API has only SELECT grants on these three tables until that boundary exists. Freeze and archive cannot be reversed through ordinary updates; separately authenticated/audited orphan-administration recovery is still pending.

Journey fields store the intended local minute, UTC instant, IANA context and signed offset. SQL validates that both start/end instant/offset pairs map to the supplied local minute, including DST transitions, and rejects partial tuples/reversed time. Title/time details may be purged on a deleted tombstone; restrictive FKs preserve canonical and actor references. This does not yet implement retention workers or deletion confirmation.

## Generation and controlled execution

Schema definitions are in `packages/backend/src/identity` and `packages/backend/src/journeys`; reviewed SQL, Drizzle snapshots and the SHA-256 manifest are in `packages/backend/migrations`. The backend build copies only runtime SQL/manifest, excluding authoring snapshots. `tools/identity-generation` owns the pinned offline Better Auth/Drizzle generation graph. It is absent from production dependency closures.

```sh
pnpm auth:schema:generate  # Regenerate from the pinned shared auth options.
pnpm auth:schema:check    # Detect generator/configuration drift.
pnpm db:generate         # Generate the next Drizzle SQL/snapshot for review.
pnpm --filter @kairn/backend db:manifest # Refresh checksums only after reviewing SQL.
pnpm verify:identity     # Disposable PostgreSQL project/volume; never the development DB.
```

The one-shot `migrate` service runs identity migrations before the existing controlled pg-boss bootstrap. The identity runner serializes with a database advisory lock, verifies every SQL checksum and applied ledger entry, and applies the pending release in one transaction. Failure rolls back the whole pending release. Changed SQL, unsupported newer versions, missing policies, unsafe role ownership/privileges and missing grants block readiness. The final applied ledger entry records a SHA-256 fingerprint of every supported identity/journey policy's schema, table, name, permissiveness, roles, command, USING and WITH CHECK definition. Readiness, repeated migration and the start of an upgrade compare the complete catalog with that protected baseline; they never adopt changed or additional policies on a repeat. Deparsing uses a transaction-local fixed search path on one connection. Runtime never migrates. The existing two-migration identity checkpoint is a supported upgrade input, alongside a fresh queue-only database. Before adding the journey policies, the runner compares the original identity-only fingerprint using its original JSON representation; the new final ledger entry then covers both schemas. Applied SQL/checksums are unchanged.

For an existing foundation volume, stop Compose Watch/builds and the API/worker first. Keep the volume. Recreate only the PostgreSQL container from current Compose inputs so it receives the new read-only principal script and `KAIRN_AUTH_DB_PASSWORD`; a healthy database does not re-run new-volume initialization. Then run the explicit controlled principal step, followed by the normal migration/build/start:

```sh
docker compose stop server worker
docker compose up -d --no-deps --wait postgres
docker compose exec -T postgres psql --username postgres --dbname kairn --set ON_ERROR_STOP=1 --file /etc/kairn-postgres/identity-principals.sql
docker compose up -d --build --wait
```

The principal script creates absent auth/provisioning/journey-policy roles and explicitly sets the auth credential from the container environment. It does not reset existing server/worker credentials or drop data. Supply the intended host-local auth credential before using it. Runtime images never receive the migration-owner secret. Application rollback is allowed only to a schema-compatible image; do not edit applied SQL or drop domain data to undo application code.

Declaring the function-local custom setting needs PostgreSQL's narrow [SET parameter privilege](https://www.postgresql.org/docs/18/sql-grant.html). Controlled bootstrap grants it only to the migrator and provisioning owner, without granting runtime DDL or superuser authority.

## Pool budget and qualification scope

The current API pool has four connections. The worker has four pg-boss connections plus one readiness connection. The migration unit has one identity/DDL connection and one pg-boss bootstrap connection, so the configured maximum with all three units overlapping is eleven. The future auth runtime/producer pools are not instantiated; their bounds must be added before B04 activation. PostgreSQL administrative/recovery and test connections require separate headroom. Readiness uses the same supported identity/queue checks in both application processes.

## Enqueue-only product queue boundary

Controlled bootstrap pre-creates `kairn.email.v1`, `kairn.restriction.confirm.v1`, `kairn.lifecycle.cleanup.v1` and `kairn.identity.avatar.v1`, each using standard policy, a dedicated partition and polling (`notify: false`). It resolves the actual table name from pg-boss metadata and quotes it as an identifier. Queue creation is idempotent; incompatible existing policy/partition/notification settings fail. ACL installation uses one checked-out connection/transaction after creation; a failed phase blocks startup and can be repeated.

The API role receives INSERT and SELECT of `id` only on the four approved partition tables. Auth receives the same rights on email only. Both may read queue/version metadata and execute `pgboss.job_now()`, as required by pinned `pg-boss@12.38.0`'s real insert SQL. Neither receives payload reads, job UPDATE/DELETE, sequence rights, worker functions, queue administration or shared/unapproved table inserts. Worker permissions remain separate. Readiness checks the complete producer ACL boundary, actual partition-parent relationship and required queue configuration; missing and excess rights fail closed.

`startJobProducer` accepts one caller-owned bounded metadata pool and returns four named enqueue methods plus shutdown. Configure a single one-connection metadata pool shared by process callers; do not create it per request or send. Migration, supervision, scheduling, instance registration, persisted warnings/statistics, reindex and LISTEN/NOTIFY are disabled. The factory handles idle metadata errors while active and leaves pool shutdown to its owner. No application entry instantiates it yet, so this slice does not increase the current eleven-connection maximum. The planned integrated allocation remains API domain four, auth two, shared producer metadata one, worker domain two and queue four: thirteen runtime connections, or fifteen including the one-shot migration overlap, plus explicit operator/test headroom. The current one-connection worker readiness pool is part of the future two-connection worker domain allocation.

Every send uses `fromDrizzle(transaction, sql)` on the supplied real domain/auth transaction; the factory never dispatches a write through the metadata pool. Payloads contain only a stable event UUID reference; no recipients, tokens, mail bodies or account impersonation context. The same UUID is the job ID. A duplicate returns `inserted: false`, which is not proof of an equal command payload or current authority. B03 must resolve durable command/event identity and atomically add audit/notices/generations before using this boundary. Handlers, live event authorization, secret delivery storage, auth-library callback failure semantics and independent restriction confirmation remain unimplemented.

`pnpm verify:identity` now includes two producer scenarios on its own disposable PostgreSQL volume after the five identity scenarios. They exercise actual API/auth transactions, allowed sends, denied enqueue rollback, payload/consume/admin/unapproved-partition denials, ID deduplication, excess-grant readiness rejection and restart/consumption through the actual worker role. This is the producer portion of G08; it does not close the later command/audit/event/mail-callback acceptance gate.

## Declaration and production packaging

Drizzle's strict declaration graph reaches other dialect declarations. The exact `gel@2.2.1` and `mysql2@3.24.6` development peers satisfy those published type imports; neither is a selected runtime database driver. Declaration-only Drizzle/Gel patches retain strict checking and Node-only globals. The compiled transaction consumer includes negative checks for invalid profile revisions and invented credential fields. Preserve and requalify these repairs with upgrades.

The pinned pnpm `12.16.1` default production deploy fails when its dedicated lockfile prunes the patched development-only Gel peer but retains that patch hash inside Drizzle's identity. Production image stages therefore use the supported [legacy deploy path](https://github.com/pnpm/pnpm/blob/main/pnpm/docs/cli/deploy.md) with `--prod --frozen-lockfile`. `allowUnusedPatches=true` is scoped to those deployment commands because the source workspace also contains native/declaration patches absent from production. The normal Docker dependency stage still installs the full source workspace with frozen patch/config checks and no such override; an altered-patch fixture must fail there. Included patches stay applied, production closure probes reject the generator and unused Gel/MySQL drivers, and the source lockfile is never rewritten by packaging. Requalify this workaround when pnpm changes.

Executed results and actual source/image inputs belong in [implementation progress](accounts_journeys_access_progress.md), including failures. This document describes the boundary; it is not acceptance evidence by itself.
