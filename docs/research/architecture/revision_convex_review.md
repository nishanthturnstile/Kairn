# Convex comparison and architecture challenge

Storage follow-up: the user explicitly retained SeaweedFS/S3 for migration portability after this review. The filesystem-only suggestion below is historical; use the current architecture register.

Research date: 1 November 2026. This is supporting research for the architecture revision. It is not an installation plan or a second canonical dependency register.

## Recommendation

Retain PostgreSQL, the application backend, and a PostgreSQL-backed worker for this product. Convex is a credible alternative with substantial developer-experience benefits. Its reactive queries and atomic database functions could remove considerable API, subscription, cache-invalidation, and scheduling code. The recommendation is based on this product's native offline media, route processing, and revocable media delivery, rather than a claim that Convex cannot implement shared journeys.

Convex Cloud would move canonical application data and backend functions off the existing VPS. The user requested that we compare it, but has not changed the preference to self-host application and data. Treat Cloud as an alternative requiring that hosting decision to change. Self-hosted Convex respects the VPS boundary, but leaves backend/dashboard operation, upgrades, backups, auth configuration, and heavy media workers under our ownership.

Do not add Convex alongside PostgreSQL for reactivity alone. Two databases would need an explicit authority, a change-delivery protocol, permission-change propagation, and recovery rules. That adds more complexity than it removes here.

## What Convex provides

| Capability | Published behavior | Value and remaining work for this product |
|---|---|---|
| Typed backend and reactive queries | TypeScript query/mutation functions, generated API types, automatic rerunning of queries whose dependencies change. React clients present subscription results from a consistent database state. | Shared draft, membership, job-status, and contribution screens update without our polling/invalidation plumbing. Still implement source grants and public projections. [Overview](https://docs.convex.dev/understanding/overview), [React client](https://docs.convex.dev/client/react/overview). |
| Transactions and OCC | Queries/mutations run with optimistic concurrency control and atomic database changes. | Supports one canonical journey, grant changes, publication pointers, and revision records. Database conflict retry does not preserve a user's stale edit automatically. Expected revisions and retained candidates remain application behavior. [OCC and atomicity](https://docs.convex.dev/database/advanced/occ). |
| Durable scheduling and cron | Scheduling from a mutation commits atomically with that mutation. Scheduled work survives restarts. Scheduled mutations and external-effect actions have different retry guarantees. | Could replace pg-boss and a dispatch loop for database/provider tasks. Actions need explicit retry/idempotency policy, and scheduled work must receive explicit authority context and recheck current grants. [Scheduling](https://docs.convex.dev/scheduling/scheduled-functions). |
| Workflows and work pools | First-party components provide persisted steps, delays, cancellation, retry policy, and bounded concurrency. | Useful for transcript/index/publication orchestration if Convex is the backend. They are optional components, not proof that a single action can run indefinitely or that external effects happen exactly once. [Workflow component](https://www.convex.dev/components/workflow). |
| External APIs and Node actions | Actions call external HTTP APIs, and an opt-in Node runtime supports Node-oriented libraries. Current documented action ceiling is ten minutes, with 512 MB for Node actions. Separate query/mutation calls inside an action are separate transactions. | AI and Resend calls fit bounded actions. FFmpeg, untrusted media parsing, large file operations, and predictable resource isolation still belong in an owned media worker. Do not assume cloud actions allow arbitrary installed executables. [Actions](https://docs.convex.dev/functions/actions), [runtimes](https://docs.convex.dev/functions/runtimes). |
| File storage | Upload/storage APIs and direct file URLs, plus authenticated HTTP-action delivery. | May remove a simple object-store integration. Direct URLs are bearer access and remain reusable; they do not recheck a journey grant per read. Authenticated HTTP actions are capped at 100 MiB. Our proposed 150 MiB clips need bounded ranges/chunks or the external gateway, so storage consolidation is incomplete. [Serving files](https://docs.convex.dev/file-storage/serve-files). |
| Full-text search | Search indexes and filters operate on Convex documents. | Catalog and approved text search need no separate search engine. Source/version eligibility remains a query design obligation. [Full-text search](https://docs.convex.dev/search/text-search). |
| Vector search | Current index dimensions span 2–4096. Vector search runs in actions, and subsequent document validation is a separate operation. Equality/OR filters are more restricted than arbitrary SQL joins. | The proposed 3072-dimensional embeddings fit. Index eligible chunks by canonical publication identity, then recheck current grants and generation before generation/return. Do not retrieve private text then filter it in the browser. [Vector search](https://docs.convex.dev/search/vector-search). |
| Authentication integration | Integrates identity providers and offers Convex Auth. | It does not replace journey authorization. Self-hosted Convex Auth currently requires manual setup because its setup CLI does not support self-hosting. [Auth overview](https://docs.convex.dev/auth/overview), [self-hosted guide](https://github.com/convex/convex-backend/blob/main/self-hosted/README.md). |
| TanStack and Expo | React Native is supported. A React Query adapter converts query subscriptions into live TanStack Query data. | Good client fit. The adapter is currently documented as beta and does not expose every Convex React feature. It is not a reason to install a second cache layer by default. [React Native](https://docs.convex.dev/client/react-native), [TanStack Query](https://docs.convex.dev/client/tanstack/tanstack-query). |
| Reconnection and optimistic UI | Client reconnection and optimistic updates improve temporary disconnection and perceived latency. | The reviewed normal client docs do not establish persistent camera files or an acknowledged command queue surviving Android process death. Keep app-owned files and SQLite until that exact requirement is demonstrated by a supported sync solution. [Optimistic updates](https://docs.convex.dev/client/react/optimistic-updates). |
| Point geospatial component | A first-party beta component indexes geographic points and supports regional/nearby queries. | Convex is not devoid of geospatial capability. This component is not PostGIS line/polygon processing, route simplification, geodesic length, clipping, or antimeridian handling. Those operations need owned code or another service. [Geospatial component](https://www.convex.dev/components/geospatial). |

Rate limits, usage reservation, publication review, rights propagation, source dependency tracking, export permissions, and deletion semantics remain application behavior in either architecture. Components may reduce implementation effort, but installing every component would violate the request to avoid unneeded dependencies.

## Cloud versus self-hosted deployment

| Dimension | Convex Cloud | Self-hosted Convex | PostgreSQL with owned backend |
|---|---|---|---|
| Data authority | Hosted Convex deployment. | Convex document model and runtime on our server. | Our relational schema and domain implementation. |
| Backend operations | Provider operates the database/function system. | We operate backend, dashboard, persistence, ingress, upgrades, auth setup, and recovery. | We operate PostgreSQL, HTTP and worker processes, and private file storage. |
| Feature consolidation | Strongest removal of operational work. | Database, reactive functions, scheduling, and storage remain integrated, but maintenance is ours. | More application code, with mature SQL/spatial tools and one transactional authority. |
| Native offline capture | Needs a durable capture/file/outbox design or a separately verified sync layer. | Same. | Explicit files/SQLite protocol already planned. |
| Heavy media | Needs an owned external worker for our required resource isolation and native binaries. | A colocated worker is possible, but is still a separate execution responsibility. | Owned worker executes the same jobs directly. |
| Public media revocation | Direct storage URLs are insufficient; per-read authorized delivery still needed. | Same API issue, even with locally stored bytes. | Existing gateway evaluates current policy before each managed read. |
| Spatial operations | Custom processing or component/service. | Same unless we add a separate spatial service. | PostGIS directly queries canonical geometry. |
| Portability | TypeScript function/data model remains Convex-specific. Self-hosting/export provide an exit path, not a zero-rewrite SQL migration. | Own deployment with Convex-specific query/function/runtime semantics. | Direct PostgreSQL data and SQL tooling; application contracts remain ours. |
| Current hosting preference | Changes the application/data hosting boundary. | Respects it. | Respects it. |

Self-hosted Convex defaults to local SQLite. The maintainer guide also supports PostgreSQL/MySQL persistence and S3-backed exports, snapshots, modules, files, and search indexes. This PostgreSQL option is internal persistence for Convex. It does not expose our documents as ordinary application tables with Drizzle relations, SQL transactions, pgvector, or PostGIS APIs. Directly modifying its persistence schema would bypass Convex's runtime/index/reactivity guarantees. [Persistence guide](https://github.com/convex/convex-backend/blob/main/self-hosted/advanced/postgres_or_mysql.md), [self-hosted guide](https://github.com/convex/convex-backend/blob/main/self-hosted/README.md).

The self-hosted guide describes backend, dashboard, and frontend as deployment responsibilities. It states support for Cloud's free-tier feature set, while Cloud is optimized for scale. Do not promise all paid Cloud operational capabilities for self-hosting without checking each one. [Self-hosting documentation](https://docs.convex.dev/self-hosting).

Convex data snapshots can include files, but code/configuration, environment variables, and pending scheduled functions are excluded. A restore plan must preserve those separately and replay current deny/deletion state before exposing data. Export/import helps move data, but it is not a complete running-system migration by itself. [Backup and restore](https://docs.convex.dev/database/backup-restore).

## Versions and licenses observed

These are evaluated versions, not selected dependencies to install.

| Artifact | Observation on 1 November 2026 | Evidence/constraint |
|---|---|---|
| `convex` client and CLI | `1.49.0`, Apache-2.0, Node >=22. | [npm metadata](https://registry.npmjs.org/convex/latest). React peer supports current React 19. |
| `@convex-dev/react-query` | `0.1.0`, Apache-2.0. Docs label the integration beta. | [npm metadata](https://registry.npmjs.org/@convex-dev/react-query/latest), [adapter docs](https://docs.convex.dev/client/tanstack/tanstack-query). |
| `@convex-dev/workflow` | `0.4.10`, Apache-2.0, Convex >=1.46. | [npm metadata](https://registry.npmjs.org/@convex-dev/workflow/latest). Workpool/helper peers also need compatible versions if selected. |
| Backend source | FSL-1.1-Apache-2.0, with a future Apache-2.0 grant after two years. | [Exact backend license](https://github.com/convex/convex-backend/blob/main/LICENSE.md). Fair-source restrictions differ from the Apache-2.0 client package. This is not a claim of unrestricted OSI licensing for every current backend file. |
| Self-hosted binary/image | Reviewed release listing shows dated `Precompiled 2026-10-28-cccbade` marked prerelease. | [Maintainer releases](https://github.com/convex/convex-backend/releases). Do not mistake the npm client semver for a stable backend server release. Select and test an immutable backend image/commit if adopting it; do not deploy a floating `latest` tag. |

The backend can support a commercial journey product without that product being another hosted backend platform, but the actual permitted use still follows the precise license. No legal clearance is asserted here.

## Background-worker recommendation and a concrete simplification

Use **pg-boss in a separate Node worker process** for the retained PostgreSQL architecture. It uses the same PostgreSQL server for queue state and does not require Redis. The HTTP process validates a domain operation and enqueues work. The worker claims jobs, calls providers, coordinates media subprocesses, and commits an eligible result after rechecking the input/policy generation. This is a concrete execution component, not a reference to browser Web Workers or a hosted queue product.

Queue responsibilities include metadata extraction, image/video derivatives, GPX/FIT imports, transcription, embedding/index refresh, candidate publication, static cards, exports, deletion, and email. Use separate queue/concurrency policies inside the same worker application before adding a service per job type. CPU-heavy parsing/transcoding executes under bounded process/container resources, while network-provider jobs have deadlines and concurrency limits.

The earlier document prescribed a generic outbox plus a dispatcher because shared transactions were unproven. Current pg-boss provides a first-party Drizzle transaction adapter. In the actual published `pg-boss@12.38.0` tarball, `dist/index.d.ts` exports `fromDrizzle`, and `dist/adapters/drizzle.js` implements it. Domain writes and `boss.send(..., { db: fromDrizzle(tx, sql) })` can commit in the same real database transaction. Prefer that route and remove the duplicate generic outbox/dispatcher from the initial design. Keep domain audit/change records because they serve user history and sync, not queue transport. [pg-boss database adapters](https://github.com/timgit/pg-boss/blob/master/docs/database-backends.md), [package metadata](https://registry.npmjs.org/pg-boss/12.38.0).

Verify commit and rollback using the actual selected pg/Drizzle connection before release. Keep file transformation and external API calls outside the open transaction. Job delivery does not guarantee exactly-once external effects; deterministic result keys, idempotency, bounded retries, stale-generation checks, and visible terminal failures remain required.

## Challenge of the earlier architecture

| Earlier choice | Objection | Proposed correction |
|---|---|---|
| Small custom public SSR renderer | Saves an adapter dependency but creates routing/hydration/security maintenance. Avoiding an RC at any cost can be more expensive than adopting a maintained renderer. | Parent should re-evaluate current TanStack Start/Vite+ deployment compatibility. If stable supported Node hosting exists, prefer it; otherwise keep the public renderer narrow and test real output. |
| SeaweedFS plus S3 SDK from the first build | A single VPS does not automatically require an object-store control plane. Future multi-host portability is not a current requirement. | Consider private filesystem volumes behind the existing gateway, with hashed directory layout, chunk manifests, atomic final rename, quotas, and consistent backups. Keep S3 as a future adapter unless near-term multi-host/object storage is concrete. |
| Generic outbox plus pg-boss queue | Duplicates durable job state/dispatch despite a supported same-transaction adapter. | Direct transactional enqueue, after real integration verification. Retain an outbox only for a distinct delivery destination that cannot join the transaction. |
| Universal RLS policy ambition | The source/grant/publication model has complex joins, and policy recursion or tenant context mistakes can create another security implementation. | Keep one explicit server authorization model and least-privilege runtime roles. Apply tested RLS to suitable private tables as defense in depth; do not promise that enabling RLS automatically implements source rights. |
| Every evaluated tool in the version register | Alternatives and optional observability/styling/testing tools can be mistaken for initial dependencies. | One canonical selected stack register. Move rejected/deferred alternatives to this research record or a compact decision table. Add a library when the implemented behavior needs it. |
| PostGIS portrayed as a prerequisite | GPX lines can be rendered and normalized without a spatial database; Convex has point geospatial tooling. | Retain PostGIS because this product benefits from shared spatial operations over canonical evidence, not because alternatives cannot display maps. Keep spatial work bounded and source-labelled. |
| Realtime/backend replacement judged only by service count | Convex removes meaningful subscription and typed-function work, but media delivery and local durability remain. | Compare end-to-end ownership, including worker/gateway/auth/backup obligations. Do not choose a second backend merely to avoid polling. |

## Decision trigger

Reconsider Convex if online collaborative responsiveness becomes central enough that its integrated reactive functions materially reduce implementation effort, and the team accepts its function/runtime model, exact self-hosted release process, and remaining media worker/gateway obligations. That is a whole-backend choice. It should not be introduced as an extra database in this production build.

The present R1 does not require character-level simultaneous editing, live location, or a social feed. A PostgreSQL-backed modular application with focused polling/change feeds, durable local capture, direct transactional jobs, and a narrow private media gateway is the smaller fit after pruning unnecessary services.

## Research method and limits

Four focused search rounds located official Convex docs, maintainer source/release pages, and pg-boss transaction documentation. Direct page/Markdown retrieval checked behaviors, and registry metadata checked package versions. The pg-boss published archive was inspected in memory to confirm the transaction adapter exists in the selected version.

No Convex deployment, PostgreSQL transaction integration, native capture workflow, load test, cloud account, or benchmark was executed. Reconnection behavior is not claimed to prove process-death durability. Cloud limits do not automatically describe every self-hosted configuration, and speculative alternative packages are not part of the selected stack.
