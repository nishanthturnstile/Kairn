# Identity database foundation

This is the identity portion of B02, built from the selected account/journey plan. Journey, grant, audit, mail, restriction and producer migrations remain to implement. No authentication endpoint or account-deletion endpoint is enabled by this foundation.

## Ownership and policy graph

| Principal | Current identity authority |
| --- | --- |
| `kairn_migrator` | Owns schemas/tables and runs reviewed migrations. Explicit maintenance RLS policies apply. Only this controlled role can assume the provisioning owner. |
| `kairn_auth` | Library-required DML in `authn`; EXECUTE on the provisioning function. No direct private-profile reads or domain writes. |
| `kairn_identity` | NOLOGIN, non-owner, no BYPASSRLS. Owns only the fixed provisioning function and must pass FORCE RLS. Can read/lock the required auth-user columns and provision the subject's account/profile. |
| `kairn_server` | Read the active context account's permitted columns and private profile; update only its display name, bio and advancing profile revision. No auth-table access or provisioning EXECUTE. |
| `kairn_worker` | No identity-data authority yet. Can inspect the migration ledger/catalog for readiness; queue authority remains separately controlled. |

The API policy graph is `profile → account → transaction-local account UUID`. The provisioning graph is `profile → account → function-local verified subject`; the retired-subject lookup uses the same subject. Neither graph recurses into a protected membership table. The function has an empty `search_path`, qualified relations, restricted EXECUTE and a fixed local subject setting. The auth/API/worker roles cannot assume its owner.

Only trusted auth integration may call `provisionVerifiedAccount`, after resolving the library session. A UUID or subject supplied in request JSON is not an authenticated actor. The helper locks the auth user before looking up the domain account, rejects absent/unverified/retired subjects, and creates at most one account/profile. Repeated provisioning leaves the domain profile intact. Future coordinated retirement must follow that same auth-user/account lock order.

Domain references use the stable UUID in `identity.account`. Its nullable auth link is restrictive, not cascading. Detachment requires a retired-subject barrier; the barrier has no live-auth FK and survives an auth-user purge. The transition trigger prevents reactivation and requires advancing revisions/generations. These constraints support future lifecycle work; they do not implement journal-confirmed deletion or restore replay.

`runAsAccount` owns one checked-out connection and a real Drizzle transaction. It installs transaction-local account context and checks current account state/revision/generation before invoking the typed operation. Nested transactions use savepoints and remain part of the outer atomic unit. A final SQL probe rejects a swallowed SQL failure before PostgreSQL could silently turn COMMIT into ROLLBACK. COMMIT/ROLLBACK clears context; any failed operation discards its connection, including rollback/socket failures. Future complete domain operations must add their resource lock order, authorization, receipt, audit, queue and response-generation checks inside this boundary.

## Generation and controlled execution

Schema definitions are in `packages/backend/src/identity`; reviewed SQL, Drizzle snapshots and the SHA-256 manifest are in `packages/backend/migrations`. The backend build copies only runtime SQL/manifest, excluding authoring snapshots. `tools/identity-generation` owns the pinned offline Better Auth/Drizzle generation graph. It is absent from production dependency closures.

```sh
pnpm auth:schema:generate  # Regenerate from the pinned shared auth options.
pnpm auth:schema:check    # Detect generator/configuration drift.
pnpm db:generate         # Generate the next Drizzle SQL/snapshot for review.
pnpm --filter @kairn/backend db:manifest # Refresh checksums only after reviewing SQL.
pnpm verify:identity     # Disposable PostgreSQL project/volume; never the development DB.
```

The one-shot `migrate` service runs identity migrations before the existing controlled pg-boss bootstrap. The identity runner serializes with a database advisory lock, verifies every SQL checksum and applied ledger entry, and applies the pending release in one transaction. Failure rolls back the whole pending release. Changed SQL, unsupported newer versions, missing policies, unsafe role ownership/privileges and missing grants block readiness. The final applied ledger entry records a SHA-256 fingerprint of every identity policy's table, name, permissiveness, roles, command, USING and WITH CHECK definition. Readiness, repeated migration and the start of an upgrade compare the complete catalog with that protected baseline; they never adopt changed or additional policies on a repeat. Deparsing uses a transaction-local fixed search path on one connection. Runtime never migrates. There is no earlier supported domain migration release; the foundation's previous queue-only database is the initial upgrade input.

For an existing foundation volume, stop Compose Watch/builds and the API/worker first. Keep the volume. Recreate only the PostgreSQL container from current Compose inputs so it receives the new read-only principal script and `KAIRN_AUTH_DB_PASSWORD`; a healthy database does not re-run new-volume initialization. Then run the explicit controlled principal step, followed by the normal migration/build/start:

```sh
docker compose stop server worker
docker compose up -d --no-deps --wait postgres
docker compose exec -T postgres psql --username postgres --dbname kairn --set ON_ERROR_STOP=1 --file /etc/kairn-postgres/identity-principals.sql
docker compose up -d --build --wait
```

The principal script creates absent auth/provisioning roles and explicitly sets the auth credential from the container environment. It does not reset existing server/worker credentials or drop data. Supply the intended host-local auth credential before using it. Runtime images never receive the migration-owner secret. Application rollback is allowed only to a schema-compatible image; do not edit applied SQL or drop domain data to undo application code.

Declaring the function-local custom setting needs PostgreSQL's narrow [SET parameter privilege](https://www.postgresql.org/docs/18/sql-grant.html). Controlled bootstrap grants it only to the migrator and provisioning owner, without granting runtime DDL or superuser authority.

## Pool budget and qualification scope

The current API pool has four connections. The worker has four pg-boss connections plus one readiness connection. The migration unit has one identity/DDL connection and one pg-boss bootstrap connection, so the configured maximum with all three units overlapping is eleven. The future auth runtime/producer pools are not instantiated; their bounds must be added before B04 activation. PostgreSQL administrative/recovery and test connections require separate headroom. Readiness uses the same supported identity/queue checks in both application processes.

Drizzle's strict declaration graph reaches other dialect declarations. The exact `gel@2.2.1` and `mysql2@3.24.6` development peers satisfy those published type imports; neither is a selected runtime database driver. Declaration-only Drizzle/Gel patches retain strict checking and Node-only globals. The compiled transaction consumer includes negative checks for invalid profile revisions and invented credential fields. Preserve and requalify these repairs with upgrades.

The pinned pnpm `12.16.1` default production deploy fails when its dedicated lockfile prunes the patched development-only Gel peer but retains that patch hash inside Drizzle's identity. Production image stages therefore use the supported [legacy deploy path](https://github.com/pnpm/pnpm/blob/main/pnpm/docs/cli/deploy.md) with `--prod --frozen-lockfile`. `allowUnusedPatches=true` is scoped to those deployment commands because the source workspace also contains native/declaration patches absent from production. The normal Docker dependency stage still installs the full source workspace with frozen patch/config checks and no such override; an altered-patch fixture must fail there. Included patches stay applied, production closure probes reject the generator and unused Gel/MySQL drivers, and the source lockfile is never rewritten by packaging. Requalify this workaround when pnpm changes.

Executed results and actual source/image inputs belong in [implementation progress](accounts_journeys_access_progress.md), including failures. This document describes the boundary; it is not acceptance evidence by itself.
