# Repository setup implementation plan

Date: 1 November 2026. Status: revised after TypeScript 6 execution tests and the user's Compose requirement. GitHub Actions and Docker Compose for all application runtime services are confirmed. Windows has 32 GB RAM and is the recommended Android development host; its remaining hardware checks are open. Android application ID, deep-link scheme, and domain are undecided.

Establish one pnpm workspace containing the web application, Expo Android application, Hono server, Node worker, and five shared packages. Keep the stack selected in [architecture version 1.4](architecture.md#14-canonical-stack-and-dependency-register). Repository setup is the first engineering milestone within the complete R1 build. It does not replace the [product delivery sequence](product_requirements.md#182-dependency-aware-implementation-sequence).

The repository currently contains documentation and one initial commit. It has no application manifests, lockfile, source code, build configuration, tests, workflows, or Git remote. Commands below describe the interface to implement. They are not available yet.

## 1. Result of this milestone

A fresh checkout can start the application and data services with `docker compose up --build`, run checks and JavaScript builds in the tooling container, and build a native Android debug APK on Windows or native CI. A small status request proves that both clients consume the generated API contract. A real PostgreSQL job proves that the worker is a separate durable process.

The public web renderer uses a synthetic, non-product fixture to prove server HTML and client hydration. It does not publish journey data or stand in for the later authorization and publication workstream.

```text
Mac / Compose: edge → server + web artifacts → PostgreSQL / private storage
                        worker ──────────────→ PostgreSQL / private storage
                        Mailpit in development
Windows: Android Studio + Gradle + emulator + Metro / local checkout
                        app ── Tailscale ───→ Mac private API ingress
```

The milestone now includes Dockerfiles, Compose orchestration, local ingress, private storage, and the development email sink. Accounts, journey tables, uploads, capture, maps, AI, production email delivery, database extensions, and production backup/recovery behavior remain in their existing workstreams. Every application runtime introduced later joins Compose. External Mapbox, AI Gateway, and Resend remain external providers. Android Studio, the emulator, and Gradle are native development tools rather than hosted application services.

## 2. Repository and package ownership

Use `apps/mobile` for the Android-first application, as already specified by the architecture. Keep the name platform-neutral because iOS capture is a later extension. Internal package names use `@kairn/*` without publishing them or reserving a product identity.

```text
apps/
  web/                 @kairn/web
    src/               creator routes, reader component, client and SSR entries
  mobile/              @kairn/mobile
    app/               Expo Router screens
    src/               platform adapters and client setup
  server/              @kairn/server
    src/               app factory, HTTP entry, renderer adapter, environment
  worker/              @kairn/worker
    src/               queue registration, process entry, environment
packages/
  contracts/           @kairn/contracts
    src/               wire schemas and named public exports
    openapi/           committed generated OpenAPI document
    generated/         committed generated API types
  backend/             @kairn/backend, server-only
  shared/              @kairn/shared, pure rules
  sync-protocol/       @kairn/sync-protocol, versioned wire envelope
  design-tokens/       @kairn/design-tokens, platform-neutral token values
config/
  mobile-lint/         lint configuration without Vite+ type checking
tools/
  api-generation/      private development-only generator with TypeScript 6
scripts/               doctor, API generation, boundary checks, smoke checks
tests/
  integration/         real process, HTTP, renderer, queue checks
  fixtures/            synthetic setup fixtures
compose.yaml           core application/data service topology
compose.override.yaml  automatically loaded development settings
infra/compose/         production and CI overrides, environment examples
infra/images/          multi-stage Node images and selected service config
.github/workflows/     quality and Android verification
docs/                  existing product documents and setup instructions
```

Create root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `vite.config.ts`, a strict environment-neutral TypeScript base, `.gitignore`, `.gitattributes`, `.editorconfig`, and a short `README.md`. Each workspace owns its manifest, public exports, environment-specific TypeScript config, and applicable build/check scripts. Every manifest is private and explicitly declares its workspace dependencies with `workspace:*`. Workspace globs cover `apps/*`, `packages/*`, and `tools/*`. The package set is four apps, five shared packages, and one development-only generator workspace.

| Package | Owns | Allowed workspace dependencies |
|---|---|---|
| `contracts` | Zod wire schemas, OpenAPI inputs, generated types, client factory with an explicit base URL and fetch transport | None initially |
| `shared` | Pure rules with no network, storage, React, DOM, or Node dependencies | None initially |
| `sync-protocol` | Protocol version and validated command/result envelope; later revisions, conflicts, cursors, and tombstones | `contracts` only where a wire type needs it |
| `design-tokens` | Existing design values; generated CSS and native-consumable values from one source | None |
| `backend` | Server-only configuration, logging, queue connection/lifecycle; later domain operations, policy, data access, and transactional jobs | `contracts`, `shared`, `sync-protocol` |
| `web` | Browser app and bounded public reader exports | Universal packages only |
| `mobile` | Native navigation and adapters | Universal packages only |
| `server` | HTTP binding, route wiring, safe artifact delivery, renderer invocation | `backend`, universal packages, the explicit `web` reader export |
| `worker` | Job registration, execution lifecycle, shutdown | `backend` and universal packages as needed |
| `tools/api-generation` | OpenAPI generation CLI and its compatible compiler API, excluded from application runtime | The schema-only `contracts` export |

The server dependency on `web` is limited to its reader artifact. Declare it in the package graph so the web build precedes server packaging. Neither client depends on the server. API generation must not import the server process, connect to a database, or create a `server → contracts → server` cycle.

Add a small repository check over manifests and imports that rejects client references to `backend`, application-to-application imports outside the reader boundary, undeclared cross-workspace imports, and private `src` deep imports. Complement it with production client bundle checks for Node-only modules and seeded secret markers. A browser-only `server-only` marker would not cover Metro or every build path.

## 3. Workspace and compatibility rules

Retain the architecture's Node `26.13.0`, pnpm `12.16.1`, Vite+ `1.4.0`, and web/shared TypeScript `7.0.2`. Retain Expo `58.0.22`, React Native `0.88.1`, mobile React `19.3.0`, and the SDK's TypeScript `~6.0.3` compatibility range, resolved exactly in the lockfile. Web React and React DOM both use `19.3.1`. This is an intentional compiler and React split.

1. Pin the package manager and Node runtime in project metadata. Bootstrap with the selected pnpm version and use project-local `pnpm exec vp` after installation. A global `vp` installation is optional. Pin generator versions and GitHub Actions revisions too.
2. Use pnpm's isolated linker and one lockfile. Put structural pnpm 12 settings in `pnpm-workspace.yaml`. Reserve `.npmrc` for registry, authentication, and transport settings. Explicitly declare runtime peers instead of relying on automatic installation. Verify the chosen peer-resolution settings against Expo's real graph.
3. Preserve Vite+'s supported overrides for its Vite core and bundled Vitest. Keep a narrowly scoped compatibility rule for the Vite alias. Do not copy the maintainer repository's broad internal peer exceptions. pnpm 12 still supports `peerDependencyRules`, but marks it deprecated; use its current supported replacement where applicable.
4. Keep React and React types out of the workspace root and pure packages. Install compatible types inside the owning application. The reader uses the web React pair; mobile resolves only its SDK pair. Do not force a workspace-wide React or TypeScript override.
5. Keep Metro on Expo defaults unless a reproduced issue requires a change. Do not add legacy watch-folder/resolver fixes or hoisting preemptively. Run duplicate dependency and autolinking checks against the installed graph.
6. Approve only the dependency lifecycle builds actually required by the selected packages through pnpm 12's current `allowBuilds` settings. Keep blocked builds visible. Do not globally enable install scripts or disable checks to make installation pass.

There is one newly identified compiler API conflict. `openapi-typescript@7.13.0` declares `typescript: ^5.x` and its shipped implementation calls `ts.factory` and `ts.SyntaxKind`. TypeScript `7.0.2` exports version information at the root import instead of that legacy API. An isolated probe of the shipped root export reproduces failure of the generator's factory expression. Suppressing the peer warning cannot fix this.

Follow-up execution proves that `typescript@6.0.3` works with this generator through both its CLI and JavaScript API. Its generated output is identical to the TypeScript 5.9.3 control for the synthetic OpenAPI 3.1 fixture, and passes consumer checks under TypeScript 5, 6, and 7. TypeScript 7 fails both generator paths. [Executed compatibility evidence](research/repository-setup/typescript6_compatibility.json).

Use `openapi-typescript@7.13.0` with pinned `typescript@6.0.3` in `tools/api-generation`. A TypeScript 5 installation is unnecessary for the proposed setup. The generator still declares `^5.x`, so record the proven TypeScript 6 combination with a package-specific peer compatibility adjustment. Keep strict checks for unrelated peers. Root/shared checking stays on TypeScript 7; mobile stays on SDK TypeScript 6. Record the tooling exception and its regression check in architecture section 14 during implementation. The tool depends on the schema-only contracts export; contracts do not depend on the tool. Qualify actual project schemas during implementation. [Detailed TypeScript 6 findings](research/repository-setup/findings_typescript6.md).

## 4. Builds, exports, and development

Use compiled ESM exports for all five shared packages. Build JavaScript and declarations with `vp pack`, backed by the selected Vite+ toolchain. Expose named package entry points from `dist`; do not introduce parallel source aliases or conditional source exports. Universal package declarations must pass mobile's TypeScript 6 check as well as the web compiler. Use Node-compatible module resolution for compiled Node boundaries, bundler resolution for web, and the Expo base for mobile. Avoid `baseUrl`, which the shipped Vite+ checker identifies as unsupported, and do not hide first-party declaration failures behind `skipLibCheck`.

Source-exported universal packages would reduce initial build work, but require coordinated Metro, Vite, Node development, and production export conditions. Compiled exports give this repository one consumption path and make the runtime artifact check explicit. This choice adds a package watch stage during development.

`vp pack` externalizes ordinary dependencies, so a server `dist/index.js` is not a standalone deployment. A staged Node runtime must include every referenced workspace's compiled exports and the production dependency graph. Prove this in an isolated runtime directory without repository source or dev dependencies. Retain source maps for operational diagnosis under controlled access.

| Owner | Build action | Required artifact |
|---|---|---|
| Universal packages and `backend` | `vp pack` with explicit ESM/declaration entries | `dist` JavaScript and declarations, plus generated token assets |
| `web` | `vp build` for browser entries and `vp build --ssr` for the reader | `dist/client`, asset manifest, and `dist/server` reader entry |
| `server` | `vp pack` Node entry after dependencies | `dist/index.js` and staged web artifacts |
| `worker` | `vp pack` Node entry | `dist/index.js` plus production dependency closure |
| `mobile`, JavaScript | `expo export --platform android` | Metro-produced Android JavaScript/assets; this is not an APK |
| `mobile`, native | Pinned Expo prebuild, generated Gradle wrapper, `:app:assembleDebug` | Installable debug APK |

Every root command that consumes compiled workspace exports first ensures those dependency packages are built. This includes `check`, `test`, `check:mobile`, `dev:mobile`, and JavaScript export, not only `build`. A clean checkout must not need a previous manual build for its type checker to resolve package declarations. Keep this prerequisite in the aggregate scripts and avoid circular task dependencies.

Compose owns the separate runtime processes. The development server/worker image targets build their package dependencies and run their own watch tasks. Use Compose Watch or explicit source mounts with Linux container dependencies kept separate from host dependencies. Shared-source changes must reach every affected runtime; dependency/config changes rebuild the appropriate images. No host Node supervisor starts the application services. Metro runs on the selected native development host through `dev:mobile`.

## 5. Public rendering and API generation

The server owns the production HTTP socket. It serves the web build's static assets and invokes the web reader export. There is no production Vite server. Implement separate app construction and process startup so tests can import the Hono app without binding a port. Development can use Vite's documented SSR middleware integration, with one owner of the HTTP listener and correct React refresh handling.

Prove the reader path with synthetic text, an HTML title, and client hydration from the same component. Use the real production manifest, lazy assets, per-request state, and safe serialized data. Check two overlapping requests with distinct markers for state leakage. Public journey routes remain unavailable until publication policy exists. [Vite SSR](https://vite.dev/guide/ssr.html), [backend integration](https://vite.dev/guide/backend-integration.html).

Start with `GET /api/v1/system` as a small, read-only setup endpoint. Its response contains only the contract/protocol version and service status needed for the smoke check. Keep process health routes separate from the versioned product API. The route implementation imports its schema; the clients use the generated types and parse untrusted responses where their application boundary requires it.

Generate OpenAPI and client types offline from shared schemas and route descriptors. Keep Hono/OpenAPI registration and generation tooling outside client runtime exports. A small explicit schema-only generation entry must not depend on previously generated types. Compile that entry, generate the document/types, then compile the full contracts package. This makes generation work even when all build output is absent and avoids a self-bootstrap cycle. Commit generated API artifacts so reviews can assess wire changes.

`api:check` regenerates into a temporary directory and compares both artifacts byte for byte. It does not rewrite tracked files in CI. Normalize ordering and omit timestamps. Generated TypeScript supplies static types, not runtime validation or compatibility with older installed applications. Retain a protocol version and add backward-compatibility fixtures when the first product endpoint is introduced. [Hono OpenAPI](https://hono.dev/examples/zod-openapi), [OpenAPI TypeScript](https://openapi-ts.dev/introduction).

## 6. Worker and environment behavior

Create a real, separate pg-boss process with bounded startup, error logging, signal handling, and graceful stop. Use a disposable development/test PostgreSQL instance for its acceptance check. A smoke job runs through PostgreSQL, records completion, and survives stopping the consumer before consumption. Register this job only in the test harness; it is not a public HTTP endpoint or a production product queue.

Initialize pg-boss's own schema through a controlled bootstrap task. Normal runtime uses restricted credentials with `migrate: false` and `createSchema: false`. Keep bootstrap credentials out of both application processes. Declare pg-boss's required `@opentelemetry/api` peer explicitly; the API package does not require adding a tracing backend or observability service. Do not add a second dispatch outbox. This check establishes queue wiring; application transaction integration and Drizzle's `fromDrizzle` adapter remain part of the subsequent domain/database milestone. [pg-boss operations](https://pgboss.io/api/ops), [constructor options](https://pgboss.io/api/constructor), [peer metadata](research/repository-setup/metadata.json).

The Compose definition pins the selected PostgreSQL image and keeps database/storage ports private to its network. Integration checks own and clean up their test state. Production deployment, domain schema, RLS, PostGIS/pgvector installation, and backup policy are subsequent work. Do not report a worker as ready when its required database is unavailable.

Validate each process's environment at startup. Keep server/worker secrets separate from browser `VITE_*` and mobile `EXPO_PUBLIC_*` values. Clients receive an API base URL only. The server accepts only its intended public origins; the worker has no public product listener. Keep example files beside each app and load them from predictable paths. Builds and static checks must not require production credentials.

Publish only development ingress on Mac loopback by default. Expose it privately over Tailscale through an explicitly configured tailnet binding or Tailscale Serve HTTPS. Do not use public Funnel for this development path. On the Windows emulator, `10.0.2.2` reaches Windows, not the Mac; the API URL must name the Mac's reachable private ingress. Confirm DNS, TLS, firewall, and an actual in-app request. Any cleartext HTTP allowance is development-only. The release profile requires HTTPS and a confirmed application identity.

### 6.1 All runtime services in Compose

| Service | Ownership and lifetime |
|---|---|
| `edge` | Caddy ingress, the only normal host-published application port |
| `server` | Hono HTTP plus built web assets and React reader; development target integrates Vite SSR/HMR |
| `worker` | Separate long-running pg-boss coordinator, with no public product listener |
| `postgres` | Persistent private PostgreSQL, shared by application and queue responsibilities |
| `storage` | Authenticated private SeaweedFS, persistent object data and metadata |
| `migrate` | One-shot queue/schema bootstrap with separate credentials |
| `mailpit` | SMTP sink and local message UI, development override only |
| `tooling` | Explicit one-off checks, tests, generation, and JavaScript builds |
| Media and operations execution | Containerized commands added with processing, backup, and recovery capabilities |

`apps/web` does not require a separate production service. Its client/reader artifacts are built into the server image and delivered through ingress. Development uses the already selected single-listener Vite/Hono integration inside the development server container. If that integration fails qualification, a development-only Vite service is a bounded alternative to review.

Root `compose.yaml` defines core topology, named volumes, internal networks, image targets, health checks, and the migration dependency. The automatically loaded `compose.override.yaml` selects development targets, local ports, source updates, and Mailpit. `docker compose up --build` starts local development without requiring a production domain. Production uses explicit `-f compose.yaml -f infra/compose/production.yaml`, which excludes the automatic development override. CI uses its own explicit override and isolated project/volumes. Validate all exact merged configurations; file merge behavior must not accidentally retain development ports or mounts.

Use multi-stage images with exact runtime pins, frozen installation, package/schema builds, and separate final server/worker targets. Test final images without source mounts or development dependencies. Never share macOS/Windows `node_modules` with Linux containers. Tool commands that intentionally write generated source artifacts must persist those specific outputs back to the checkout through narrow output mounts or a copy wrapper; check commands compare temporary outputs without modifying the checkout.

Require healthy PostgreSQL before `migrate` and successful migration completion before server/worker startup. Health gates do not replace bounded reconnect/error behavior after startup. Keep named volumes for database, storage data/metadata, and Caddy state. Normal stop/restart retains data. Do not mount the Docker daemon socket into the normal worker. Backup containers still need the independent off-host destination required by the architecture.

The foundation verifies startup ordering, failed-migration behavior, actual HTTP/HTML/assets, queue persistence, and storage authentication/persistence. It verifies Mailpit as a local sink when introduced, without claiming account email flows exist. Bound worker concurrency and measure Docker Desktop's VM allocation on the 16 GB Mac before enabling heavy conversion or backup work. [Compose findings and sources](research/repository-setup/findings_compose.md).

For the current undecided identity, a clearly documented local-development-only application ID and scheme can keep emulator work moving. Do not create a store listing, enroll an account, register a domain, establish final signing, or distribute that identity. Decide the permanent ID and scheme before the first distributable build.

## 7. Commands to implement

Keep root aliases stable. CI and local development use the same scripts. Task names defined as package scripts must not also be defined as Vite+ custom tasks of the same name. Workspace selectors must fail if no package matches.

| Root command | Behavior |
|---|---|
| `docker compose up --build` | Start all core development application/data services, including development Mailpit |
| `docker compose up --build --watch` | Start the development stack with configured source updates |
| `docker compose --profile tools run --rm tooling pnpm check` | Run the JavaScript/static check suite in its tooling container |
| `docker compose --profile tools run --rm tooling pnpm build` | Run package/web/Node/Metro export builds in Linux tooling |
| `docker compose logs -f server worker` | Inspect the separate runtime services |
| `docker compose down` | Stop services while retaining named volumes |
| `pnpm install --frozen-lockfile` | Reproduce the recorded dependency graph |
| `pnpm run doctor` | Check the current role: Compose host, Linux tooling, or Windows native Android host |
| `pnpm dev` | Host convenience wrapper for the development Compose stack |
| `pnpm dev:services` | Alias for the complete Compose stack, not a database-only environment |
| `pnpm queue:bootstrap` | Host wrapper for the one-shot `migrate` container; uses separate bootstrap credentials |
| `pnpm dev:mobile` | Start Expo Metro in the Windows checkout, with dependency package builds |
| `pnpm dev:android` | Build/install from the native development host; separate from headless CI builds |
| `pnpm format` | Run Vite+ formatting in write mode |
| `pnpm format:check` | Run `vp fmt --check .` without changes |
| `pnpm check` | Formatting, web/Node static/type checks, native lint/TypeScript checks, dependency boundaries, API drift |
| `pnpm check:mobile` | Dedicated native lint, package-local TypeScript 6, `expo install --check`, and pinned `expo-doctor` |
| `pnpm api:generate` | Generate and update the OpenAPI document and client types |
| `pnpm api:check` | Compare fresh generated artifacts against committed ones |
| `pnpm test` | Run existing meaningful tests with `vp test run`; no placeholder tests to fill packages |
| `pnpm test:integration` | Run real server/renderer/worker checks against disposable PostgreSQL |
| `pnpm build` | Build packages, web, server, worker, and Android JavaScript export; requires no Android SDK |
| `pnpm build:packages` | Build all five shared-package exports/declarations without starting services |
| `pnpm build:web` | Build packages required by web, then client/reader outputs |
| `pnpm build:server` | Build the server and its full workspace dependency chain, including reader |
| `pnpm build:worker` | Build the worker and its workspace dependencies |
| `pnpm build:mobile` | Export Android JavaScript and assets through Metro |
| `pnpm build:android` | Prebuild and assemble the native debug APK, with no emulator launch |
| `pnpm start:server` | Run staged production server JavaScript with `node` |
| `pnpm start:worker` | Run staged production worker JavaScript with `node` |
| `pnpm verify` | Host orchestration of Compose config checks, tooling checks/builds, final images, and composed integration tests |
| `pnpm verify:android` | Run native-specific checks, APK build, and Gradle lint |

Tooling-container scripts do not invoke Docker recursively or require a Docker socket. Host wrappers own Compose lifecycle; in-container tests use the test stack's explicit internal URLs. `build` excludes SDK-dependent native compilation. GitHub's native job requires `verify:android` separately. The direct Docker commands work without host Node for the app services; native development still needs Node/pnpm on Windows. Use explicit `pnpm run doctor` because pnpm also has its own built-in diagnostic.

Use `pnpm exec vp run -t @kairn/server#build` for dependency-ordered server builds and the equivalent worker/web selectors. For a multi-package selection, use the documented filters and `--fail-if-no-match`. Do not use a root `build` alias that recursively invokes itself through an unfiltered workspace run. Root aggregate scripts explicitly select the app/package tasks they own. The following direct check commands assume that the aggregate has already built package exports. [Vite+ task execution](https://viteplus.dev/guide/run).

Vite+ check settings are root-scoped, so implement the check split explicitly:

```sh
pnpm exec vp fmt --check .
pnpm exec vp check --no-fmt apps/web apps/server apps/worker packages tools scripts config vite.config.ts
pnpm exec vp lint --config config/mobile-lint/vite.config.ts apps/mobile
pnpm --filter @kairn/mobile exec tsc --noEmit
CI=1 pnpm --filter @kairn/mobile exec expo install --check
pnpm --filter @kairn/mobile exec expo-doctor
```

Enable Vite+'s type-aware and type-check options in the root configuration. Include `tools` in the root non-mobile check paths too. The explicit mobile lint config shares ordinary rules but disables those two options. Root TypeScript projects must not import/reference mobile. Mobile extends Expo's base and runs its own compiler. Before accepting this configuration, inject one web type error and one mobile type error and prove that each makes `pnpm check` fail. Remove the intentional errors afterward. [Detailed toolchain findings](research/repository-setup/findings_toolchain.md).

## 8. Android generation and CI

Use Expo Continuous Native Generation initially. Ignore generated `android/` and `ios/` directories. Commit app configuration, config plugins when needed, Metro configuration only if needed, and generation inputs. Native customizations must live in reviewed config plugins or local Expo modules. Reconsider committing Android sources only when a required integration cannot be expressed reliably through generation.

Pin the adopted Expo bare template, currently `expo-template-bare-minimum@58.0.30`, independently of the package lockfile. A repeatable native build starts from committed inputs, generates Android, asserts that manifests and the lockfile did not change, then invokes the generated Gradle wrapper. Expo SDK 58 prebuild defaults to clean regeneration. Do not combine its mutually exclusive `--no-install` and `--pnpm` flags.

The proposed generation command inside `apps/mobile` is:

```sh
pnpm exec expo prebuild --platform android --no-install --template expo-template-bare-minimum@58.0.30 --skip-dependency-update react,react-native
```

The portable build wrapper runs `gradlew.bat :app:assembleDebug` on Windows or `./gradlew :app:assembleDebug` on Unix, inside the generated Android directory. Native verification also runs Gradle lint. Avoid POSIX-only environment assignments and cleanup commands in root scripts. Validate wrapper and generated SDK settings on the first real prebuild rather than maintaining a separately invented Android project. Pin inputs and record generated versions in CI artifacts. [Android findings](research/repository-setup/findings_android.md).

Shipped Expo/RN defaults indicate Android minSdk 24, targetSdk 36, compileSdk 37, build tools `37.0.0`, NDK `27.1.12297006`, and Gradle `9.4.1`. Treat these as generation inputs to verify, not an adopted minimum-device commitment. Install JDK 17 and the selected SDK/NDK on Windows, where native compilation will run. The Mac's existing NDK/JDK and missing API/build tools 37 are no longer a prerequisite for hosting the Compose services. Mac Android installation can wait unless the Mac will also perform native builds.

### 8.1 Windows Android development over Tailscale

The Mac is Intel with 16 GiB physical RAM. The user reports 32 GB RAM on Windows. Google's current recommendation for Studio plus emulator is 32 GB, so Windows is the preferred native host, subject to checking its CPU/architecture, Windows version, virtualization, GPU, and SSD capacity. Prefer Windows Hypervisor Platform for acceleration. This is a supported development arrangement, not a claim that the uninspected Windows environment is already qualified.

Use Windows-native Android Studio, JDK, SDK/NDK, Gradle, Node/pnpm, emulator, and normally Metro against a local checkout. WSL is not required. Keep separate per-OS dependencies, Gradle caches, and generated native output. Do not use a network-mounted `node_modules` or share an Android generated project across hosts.

Mobile edits should occur in the Windows checkout when Metro runs there. Git synchronizes committed changes; it does not live-sync unsaved edits from the Mac. A Git remote and matching commits are needed for shared-contract changes across machines. If immediate reload of Mac-side edits matters more, Metro can run on the Mac, optionally in a development-only Compose profile, while the emulator/native builds stay on Windows. That alternative needs an explicitly advertised tailnet URL and tested HTTP/WebSocket/assets delivery, not just an open port.

The Windows emulator uses the Mac's tailnet API URL. Its `10.0.2.2` host address is useful for Windows-local Metro but does not address the Mac. A physical phone needs its own route, such as Tailscale installed on the phone. Do not expose ADB publicly. Tailscale provides network connectivity; remote agent/device control needs a separately linked host. T3 environment tools were unavailable in this session, and the Windows hardware/emulator were not inspected. [Windows development findings](research/repository-setup/findings_windows_android.md).

Create two required GitHub Actions jobs, with a final required status that runs even when an upstream job fails and succeeds only when both jobs succeed:

| Job | Required work | Evidence |
|---|---|---|
| Quality | Compose config validation, frozen tooling-image install, checks/tests/JS builds, final image builds, composed HTTP/queue/storage integration | Test output, API drift comparison, web manifests, image runtime results, startup/persistence checks |
| Android | Frozen install, native checks, pinned prebuild, debug APK, Gradle lint | APK, lint results, generated build settings and logs |

Run both on pull requests and the main branch initially. Avoid path filters until dependency-sensitive invalidation has been proven. Use read-only default token permissions, cancel superseded PR runs, bound job timeouts, pin actions by reviewed commit SHA, and preserve failure logs. Untrusted pull requests require no production secrets. Native debug signing is suitable for setup; signed release AABs belong to distribution configuration after identity is decided. [GitHub workflow guidance](https://docs.github.com/en/actions/reference/security/secure-use).

Provision the selected Playwright Chromium runtime in the quality job for the synthetic reader's hydration and request-isolation checks. Keep these tests in the integrated acceptance suite. No separate browser application or service is needed.

Cache the pnpm store and appropriate Gradle/download caches using toolchain, OS/architecture, lockfile, and native generation inputs. Begin with Vite+ task caching disabled for composite verification, generators, integration checks, prebuild, and native builds. Enable individual deterministic build caches only after input/output tests prove invalidation, including referenced web outputs, public build-time environment, shared config, app config, native plugins, template, and lockfile. Never cache secrets or claim a restored task cache is fresh runtime verification.

## 9. Implementation sequence and acceptance gates

| Step | Changes | Completion gate |
|---|---|---|
| 1. Lock the toolchain | Root metadata, workspace manifests, Vite+ overrides, generator/compiler isolation, peer/build settings, strict TypeScript configs, ignore rules, doctor | Frozen reinstall works; package set is exact; Vite compatibility is proved; generator uses its supported compiler API; no unrelated peer failures are suppressed |
| 2. Establish shared exports | Five package boundaries, compiled exports, minimal status contract/protocol, tokens from existing design | Package builds pass; TS7 and mobile TS6 consume the same declarations; no React/Node leakage into universal exports |
| 3. Compose server and web | Multi-stage images, Caddy, Hono factory/entry, health/status endpoint, typed client, React routes, synthetic SSR/hydration, development override | Default Compose command starts the app; final images serve expected HTML/assets without source mounts; requests remain isolated |
| 4. Compose data and worker | PostgreSQL, authenticated persistent SeaweedFS, dev Mailpit, worker, controlled `migrate` task | Health/migration gates work; real queued work survives consumer restart; storage data survives recreation; internal services are not host-public |
| 5. Wire Windows Android | Native prerequisite inspection/install, local checkout/Metro, Expo shell, typed status, pinned portable CNG wrapper, private Mac ingress | Metro export, Expo checks, APK/lint, actual emulator-to-Mac API request, and reload pass |
| 6. Finish verification and CI | Containerized tooling, complete Compose config checks, generation/boundary/runtime checks, GitHub Actions and README | Both CI jobs pass; final images work; native host commands work; tracked files stay clean after checks |

These are reviewable implementation batches, not separate product releases. Resolve issues where first encountered instead of deferring compatibility until CI setup.

The initial test set proves integration boundaries: generated contract drift, actual schema validation, forbidden imports, production HTTP/SSR delivery, request isolation, worker persistence/shutdown, mobile dependency resolution, and negative type-check coverage. Do not write tests that merely assert a config file contains the values just written.

Foundation acceptance requires an actual Android launch and status request. CI compilation proves the native artifact builds; it does not prove runtime networking or later capture durability. Capture process-death, grants, revocation, media processing, and restore tests enter with their respective production capabilities.

## 10. Issues and open decisions

| Item | State | Required action or timing |
|---|---|---|
| GitHub Actions | Confirmed by user | Create workflows during setup. Git remote/repository creation and branch protection require a repository destination. Local work can proceed. |
| OpenAPI generator compiler API | TypeScript 6.0.3 passed CLI/API generation; TypeScript 7 failed | Use generator-local TypeScript 6 and record its tested peer exception. Qualify actual project schemas during implementation. |
| Vite alias peer range | Known supported exception | Preserve the narrow current convention and prove the real resolved plugin/build graph. |
| Android prerequisites | Windows is the recommended native host | Inspect/install selected tools on Windows. No need to complete Mac Android prerequisites for Compose hosting. |
| Windows capacity | User confirms 32 GB RAM; other hardware unverified | Check CPU/architecture, Windows version, virtualization, GPU, and SSD before qualifying emulator performance. |
| Docker Compose | Confirmed user requirement for runtime services | Implement app/data containers, development/production overrides, health gates, persistent volumes, and tooling commands in this milestone. |
| Final application ID, scheme, domain | Undecided by user | Use a documented local-only identity for development. Confirm before signing, distribution, or production auth links. |
| Target Android devices and supported floor | Open | Begin with SDK-supported builds; qualify the product policy with representative devices during native work. |
| VPS and backup/journal destination | Open in existing architecture | Required before infrastructure configuration and shared-data deployment. Not a local repository setup blocker. |
| Provider credentials and approved AI routes | Later integration inputs | Not needed for repository checks or debug Android builds. Current selected Mapbox bridge no longer requires a secret SDK download token; verify again when adding maps. A runtime public map token remains an integration input. |

No additional product decision blocks writing the foundation. The setup compatibility gates require engineering evidence. The permanent distribution identity and GitHub repository destination remain user inputs at the stages above.

## 11. Research and verification record

The [research report](research/repository-setup/research.md) explains the alternatives and risks. Supporting files include [toolchain findings](research/repository-setup/findings_toolchain.md), [Android findings](research/repository-setup/findings_android.md), [Compose findings](research/repository-setup/findings_compose.md), [Windows findings](research/repository-setup/findings_windows_android.md), [TypeScript 6 execution findings](research/repository-setup/findings_typescript6.md), [host/registry observations](research/repository-setup/metadata.json), and the earlier [TypeScript 7 source probe](research/repository-setup/compiler_api_evidence.json).

This planning task inspected documentation, package artifacts, installed tool versions, Mac memory, and trimmed Tailscale peer status. It ran temporary isolated generator/compiler installations and real CLI/API/type-consumer checks, with a [repeatable research probe](research/repository-setup/probe_openapi_typescript6.py). It did not install application dependencies, create Dockerfiles/Compose application files, generate native projects, start services, inspect Windows hardware, or qualify a device. Implementation establishes the remaining acceptance evidence.
