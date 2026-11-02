# Repository setup implementation plan

Date: 1 November 2026. Status: revised for Android and iOS local development without an EAS subscription or paid Apple membership. Windows/WSL on the 32 GB computer hosts Compose; Windows native hosts Android; the 16 GB Mac hosts iOS builds and testing. The user confirms prior Mac compatibility testing and has an iPhone and iPad. Application identifiers, deep-link scheme, and domain are undecided. This plan supersedes earlier Mac-hosted Compose and iOS-later recommendations.

Establish one pnpm workspace containing the web application, one Expo Android/iOS application, Hono server, Node worker, and five shared packages. Keep the stack selected in [architecture version 1.6](../core/architecture.md#14-canonical-stack-and-dependency-register), including Unistyles v3 for mobile styling. The [mobile development plan](mobile_development_plan.md) owns host allocation, free provisioning, T3 device setup, and deferred distribution. Repository setup is the first engineering milestone within the complete R1 build. It does not replace the [product delivery sequence](../core/product_requirements.md#182-dependency-aware-implementation-sequence).

The repository began with planning documents, research utilities, and project-local agent skills with a source manifest. Steps 1–5 now have recorded acceptance results; iOS runtime/physical-device checks and final CI qualification remain. The [progress record](repository_setup_progress.md#current-checkpoint) owns current completion status and executed checks. Commands below define the milestone interface. The [development skills inventory](development_skills.md) records guidance installed for both current and future workstreams; skill installation alone does not qualify an application integration.

## 1. Result of this milestone

A fresh WSL checkout can start the application and data services with `docker compose up --build` and run checks and JavaScript builds in the tooling container. Platform-local checkouts build an Android debug APK on Windows and an iOS simulator app on the Mac, plus Personal Team installs on the available iPhone/iPad. A small status request proves that web and both native platforms consume the generated API contract. A real PostgreSQL job proves that the worker is a separate durable process.

The public web renderer uses a synthetic, non-product fixture to prove server HTML and client hydration. It does not publish journey data or stand in for the later authorization and publication workstream.

```text
Windows/WSL / Compose: edge → server + web artifacts → PostgreSQL / private storage
                             worker ──────────────→ PostgreSQL / private storage
                             Mailpit in development
Windows native: Android SDK + Gradle + emulator + Metro / local checkout
Mac: Xcode + iOS build tools + Metro / local checkout; one simulator when needed
iPhone/iPad: Personal Team installs and physical-device checks
All clients ── verified private Tailscale HTTPS route ──→ WSL application ingress
```

The milestone includes Dockerfiles, Compose orchestration, local ingress, private storage, the development email sink, and both native shells. Accounts, journey tables, uploads, capture, maps, AI, production email delivery, database extensions, and production backup/recovery behavior remain in their existing workstreams and enter both native platforms where applicable. Every server-side application runtime introduced later joins Compose. External Mapbox, AI Gateway, and Resend remain external providers. Native IDEs, SDKs, Metro, simulators/emulators, and build tools run on their platform hosts outside Compose.

## 2. Repository and package ownership

Use one `apps/mobile` workspace for Android and iOS, with platform-specific adapters where required. Android public distribution is first; iOS implementation and local tests are included now. Internal package names use `@kairn/*` without publishing them or reserving a product identity.

```text
apps/
  web/                 @kairn/web
    src/               creator routes, reader component, client and SSR entries
  mobile/              @kairn/mobile
    index.ts           Unistyles initialization, then Expo Router entry
    babel.config.cjs   Expo preset and Unistyles plugin rooted at src/
    src/app/           Expo Router route files only
    src/screens/       native screen implementations
    src/components/    owned React Native controls styled with Unistyles
    src/theme/         token-backed Unistyles config and type augmentation
    src/               remaining platform adapters and client setup
    native-locks/ios/  reviewed Podfile.lock snapshot retained outside generated ios/
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
.github/workflows/     quality and Android verification; local Mac evidence for iOS
docs/                  README index; core/, implementation/, and research/
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

Install the selected Unistyles and exact Nitro Modules pins from architecture section 14 in `apps/mobile` during foundation, with the required `@react-native/normalize-colors` peer matching React Native. Keep New Architecture enabled. Unistyles' Reanimated and edge-to-edge peers are optional; do not auto-install deprecated `react-native-edge-to-edge`, NativeWind, or another UI framework. Retain the existing feature-driven Reanimated/Worklets/Gesture Handler policy. Confirm actual peer resolution, native autolinking, and both platform builds before recording this candidate combination as qualified.

Set mobile `main` to `index.ts`. Import `./src/theme/unistyles` before `expo-router/entry` so theme configuration runs before routes or components create stylesheets. Use `babel-preset-expo` and `['react-native-unistyles/plugin', { root: 'src' }]` in the mobile Babel configuration. Put routes in `src/app` and styled components/screens in `src` so the plugin covers them without broad workspace transforms. `packages/design-tokens` continues exporting plain values; mobile owns theme registration, breakpoints, Unistyles type augmentation, and native styles. Keep Expo's Metro defaults and omit the experimental Unistyles Metro wrapper; running both integrations is invalid. [Official setup](https://www.unistyl.es/v3/start/getting-started/), [Expo Router initialization](https://www.unistyl.es/v3/guides/expo-router/).

There is one newly identified compiler API conflict. `openapi-typescript@7.13.0` declares `typescript: ^5.x` and its shipped implementation calls `ts.factory` and `ts.SyntaxKind`. TypeScript `7.0.2` exports version information at the root import instead of that legacy API. An isolated probe of the shipped root export reproduces failure of the generator's factory expression. Suppressing the peer warning cannot fix this.

Follow-up execution proves that `typescript@6.0.3` works with this generator through both its CLI and JavaScript API. Its generated output is identical to the TypeScript 5.9.3 control for the synthetic OpenAPI 3.1 fixture, and passes consumer checks under TypeScript 5, 6, and 7. TypeScript 7 fails both generator paths. [Executed compatibility evidence](../research/repository-setup/typescript6_compatibility.json).

Use `openapi-typescript@7.13.0` with pinned `typescript@6.0.3` in `tools/api-generation`. A TypeScript 5 installation is unnecessary for the proposed setup. The generator still declares `^5.x`, so record the proven TypeScript 6 combination with a package-specific peer compatibility adjustment. Keep strict checks for unrelated peers. Root/shared checking stays on TypeScript 7; mobile stays on SDK TypeScript 6. Record the tooling exception and its regression check in architecture section 14 during implementation. The tool depends on the schema-only contracts export; contracts do not depend on the tool. Qualify actual project schemas during implementation. [Detailed TypeScript 6 findings](../research/repository-setup/findings_typescript6.md).

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
| `mobile`, JavaScript | Separate `expo export --platform android` and `expo export --platform ios` outputs | Metro-produced platform JavaScript/assets; neither proves a native binary builds |
| `mobile`, Android native | Pinned Expo prebuild, generated Gradle wrapper, `:app:assembleDebug` | Installable debug APK |
| `mobile`, iOS native | Pinned Expo prebuild on Mac, CocoaPods, and Xcode simulator build without device signing | Installable simulator `.app` and build logs; Personal Team device installation is a separate check |

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

Initialize pg-boss's own schema through a controlled bootstrap task. Normal runtime uses restricted credentials with `migrate: false` and `createSchema: false`. Keep bootstrap credentials out of both application processes. Declare pg-boss's required `@opentelemetry/api` peer explicitly; the API package does not require adding a tracing backend or observability service. Do not add a second dispatch outbox. This check establishes queue wiring; application transaction integration and Drizzle's `fromDrizzle` adapter remain part of the subsequent domain/database milestone. [pg-boss operations](https://pgboss.io/api/ops), [constructor options](https://pgboss.io/api/constructor), [peer metadata](../research/repository-setup/metadata.json).

The Compose definition pins the selected PostgreSQL image and keeps database/storage ports private to its network. Integration checks own and clean up their test state. Production deployment, domain schema, RLS, PostGIS/pgvector installation, and backup policy are subsequent work. Do not report a worker as ready when its required database is unavailable.

Validate each process's environment at startup. Keep server/worker secrets separate from browser `VITE_*` and mobile `EXPO_PUBLIC_*` values. Clients receive an API base URL only. The server accepts only its intended public origins; the worker has no public product listener. Keep example files beside each app and load them from predictable paths. Builds and static checks must not require production credentials.

Publish development ingress on WSL host loopback by default, then configure one private Tailscale HTTPS address for all clients. Select and verify Windows-to-WSL port forwarding or a WSL tailnet endpoint; neither route is established merely by a running Tailscale peer. On the Android emulator, `10.0.2.2` reaches Windows and does not automatically reach the WSL service. Confirm forwarding, DNS, TLS, firewall, and actual in-app requests from Android, Mac/iOS simulator, iPhone, and iPad. Phones need their own route. Keep this development path private. Any cleartext HTTP allowance is development-only. The release profile requires HTTPS and a confirmed application identity. [Host/network policy](mobile_development_plan.md#3-source-ownership-and-networking).

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

The foundation verifies startup ordering, failed-migration behavior, actual HTTP/HTML/assets, queue persistence, and storage authentication/persistence. It verifies Mailpit as a local sink when introduced, without claiming account email flows exist. Bound worker concurrency and WSL/Docker memory on the 32 GB Windows computer, leaving capacity for native Android tools. Keep development containers off the 16 GB Mac; use it for iOS builds and sequential device/simulator checks. Measure combined resource use before enabling heavy conversion or backup work. [Compose findings and sources](../research/repository-setup/findings_compose.md).

For the current undecided identity, clearly documented local-only Android package/iOS bundle identifiers and a scheme keep development moving. Free Personal Team signing and device installation are permitted for local checks; they do not establish the final distribution identity. Do not create store listings or enroll paid accounts as part of foundation setup. Decide permanent identifiers and the scheme before external distribution.

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
| `pnpm run doctor` | Check the current role: Windows/WSL Compose, Linux tooling, Windows native Android, or Mac iOS; report selected tool versions |
| `pnpm dev` | Host convenience wrapper for the development Compose stack |
| `pnpm dev:services` | Alias for the complete Compose stack, not a database-only environment |
| `pnpm queue:bootstrap` | Host wrapper for the one-shot `migrate` container; uses separate bootstrap credentials |
| `pnpm dev:mobile` | Start development-client Metro in the current Windows or Mac native checkout, with dependency package builds |
| `pnpm dev:android` | Build/install locally on Windows with Expo/native tools; separate from headless CI builds |
| `pnpm dev:ios` | Build/install and launch on a selected Mac simulator or locally paired Personal Team device, with no EAS dependency |
| `pnpm format` | Run Vite+ formatting in write mode |
| `pnpm format:check` | Run `vp fmt --check .` without changes |
| `pnpm check` | Formatting, web/Node static/type checks, native lint/TypeScript checks, dependency boundaries, API drift |
| `pnpm check:mobile` | Dedicated native lint, package-local TypeScript 6, `expo install --check`, and pinned `expo-doctor` |
| `pnpm api:generate` | Generate and update the OpenAPI document and client types |
| `pnpm api:check` | Compare fresh generated artifacts against committed ones |
| `pnpm test` | Run existing meaningful tests with `vp test run`; no placeholder tests to fill packages |
| `pnpm test:integration` | Run real server/renderer/worker checks against disposable PostgreSQL |
| `pnpm build` | Build packages, web, server, worker, and both native JavaScript exports; requires no native SDK |
| `pnpm build:packages` | Build all five shared-package exports/declarations without starting services |
| `pnpm build:web` | Build packages required by web, then client/reader outputs |
| `pnpm build:server` | Build the server and its full workspace dependency chain, including reader |
| `pnpm build:worker` | Build the worker and its workspace dependencies |
| `pnpm build:mobile` | Export Android and iOS JavaScript/assets through Metro into separate platform output directories |
| `pnpm build:android` | Prebuild and assemble the native debug APK, with no emulator launch |
| `pnpm build:ios:simulator` | Generate pinned iOS inputs, install Pods, and compile the simulator `.app` on Mac without device signing or simulator launch |
| `pnpm start:server` | Run staged production server JavaScript with `node` |
| `pnpm start:worker` | Run staged production worker JavaScript with `node` |
| `pnpm verify` | Host orchestration of Compose config checks, tooling checks/builds, final images, and composed integration tests |
| `pnpm verify:android` | Run native-specific checks, APK build, and Gradle lint |
| `pnpm verify:ios` | Run native checks and locked simulator build on Mac; record commit/tool/native inputs and build result. Accompany it with T3 launch/API/reload evidence and separate Personal Team device results. |

Tooling-container scripts do not invoke Docker recursively or require a Docker socket. Host wrappers own Compose lifecycle; in-container tests use the test stack's explicit internal URLs. `build` excludes SDK-dependent native compilation. GitHub's native job requires `verify:android` separately; local Mac `verify:ios` and device evidence are required for native acceptance. Do not report `verify` alone as full iOS verification. The direct Docker commands work without host Node for the app services; native development needs Node/pnpm on Windows and Mac. Use explicit `pnpm run doctor` because pnpm also has its own built-in diagnostic.

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

Enable Vite+'s type-aware and type-check options in the root configuration. Include `tools` in the root non-mobile check paths too. The explicit mobile lint config shares ordinary rules but disables those two options. Root TypeScript projects must not import/reference mobile. Mobile extends Expo's base and runs its own compiler. Before accepting this configuration, inject one web type error and one mobile type error and prove that each makes `pnpm check` fail. Remove the intentional errors afterward. [Detailed toolchain findings](../research/repository-setup/findings_toolchain.md).

## 8. Native generation, hosts, and CI

Use Expo Continuous Native Generation initially. Ignore generated `android/` and `ios/` directories. Commit app configuration, the Unistyles Babel configuration/custom entry/theme setup, config plugins when needed, Metro configuration only if needed, and generation inputs. Native customizations must live in reviewed config plugins or local Expo modules. Reconsider committing Android sources only when a required integration cannot be expressed reliably through generation.

Pin the adopted Expo bare template, currently `expo-template-bare-minimum@58.0.30`, independently of the package lockfile. A repeatable native build starts from committed inputs, generates the selected platform, asserts that manifests and the lockfile did not change, then invokes the platform build tools. Expo SDK 58 prebuild defaults to clean regeneration. Do not combine its mutually exclusive `--no-install` and `--pnpm` flags. Include SDK-compatible `expo-dev-client` in the committed mobile dependencies.

The proposed generation command inside `apps/mobile` is:

```sh
pnpm exec expo prebuild --platform android --no-install --template expo-template-bare-minimum@58.0.30 --skip-dependency-update react,react-native
```

The portable build wrapper runs `gradlew.bat :app:assembleDebug` on Windows or `./gradlew :app:assembleDebug` on Unix, inside the generated Android directory. Native verification also runs Gradle lint. Avoid POSIX-only environment assignments and cleanup commands in root scripts. Validate wrapper and generated SDK settings on the first real prebuild rather than maintaining a separately invented Android project. Pin inputs and record generated versions in CI artifacts. [Android findings](../research/repository-setup/findings_android.md).

Shipped Expo/RN defaults indicate Android minSdk 24, targetSdk 36, compileSdk 37, build tools `37.0.0`, NDK `27.1.12297006`, and Gradle `9.4.1`. Treat these as generation inputs to verify, not an adopted minimum-device commitment. Install JDK 17 and the selected SDK/NDK on Windows, where native Android compilation will run. No Mac Android SDK installation is required for the selected host allocation.

### 8.1 Windows Android development over Tailscale

The Mac is Intel with 16 GiB physical RAM. The user reports 32 GB RAM on Windows. Google's current recommendation for Studio plus emulator is 32 GB, so Windows is the preferred native host, subject to checking its CPU/architecture, Windows version, virtualization, GPU, and SSD capacity. Prefer Windows Hypervisor Platform for acceleration. This is a supported development arrangement, not a claim that the uninspected Windows environment is already qualified.

Use Windows-native Android Studio, JDK, SDK/NDK, Gradle, Node/pnpm, emulator, and Metro against a Windows-local checkout. WSL owns the separate Compose/web/backend checkout; do not mix its SDK paths or dependency tree into Windows-native builds. Keep separate per-OS dependencies, caches, and generated native output. Do not use a network-mounted `node_modules` or share generated native projects across hosts.

Mobile edits should occur in the checkout serving that platform's Metro: Windows for Android, Mac for iOS. Git synchronizes committed changes; it does not live-sync unsaved WSL or Mac edits. A Git remote and matching commits are needed for cross-host changes, especially shared contracts and native inputs. Keep Metro local to each native platform initially and verify bundles, assets, and Fast Refresh on actual devices. Remote Metro is a later workflow change requiring an explicit reachable URL and HTTP/WebSocket qualification.

All clients use the verified private Windows/WSL API ingress. The emulator's `10.0.2.2` address is useful for Windows-local Metro but does not prove WSL forwarding. A physical phone needs its own route, such as Tailscale installed on the phone. Do not expose ADB publicly. Tailscale provides connectivity; native agent control requires T3 device-host configuration. Windows T3 has working local Android control and an SSH device host for the Mac. Use a Windows-environment session for its emulator and the configured Mac host for iOS. [Current integration status](mobile_development_plan.md#5-t3-native-device-integration), [host setup](native_host_setup.md), [historical Windows findings](../research/repository-setup/findings_windows_android.md).

### 8.2 Mac iOS development and local verification

Accept the user's prior Mac compatibility test. Use its native Xcode/CocoaPods/Node toolchain and a Mac-local checkout. Generate iOS from the same pinned app/template inputs, resolve Pods reproducibly, record native dependency resolutions, and compile a simulator `.app` with device signing disabled. Choose the simulator SDK/destination from the installed toolchain rather than hardcoding a machine-specific device ID. The initial setup commits a reviewed `apps/mobile/native-locks/ios/Podfile.lock` snapshot outside ignored `ios/` and records the CocoaPods version. Subsequent wrappers restore that snapshot into the generated project before installing Pods in locked mode and fail on unexpected resolution changes. Intentional native upgrades update the snapshot in review. Do not share installed Pods or build output across hosts.

Build and install locally through Expo CLI/native tools without EAS. Pair the user's iPhone/iPad with Xcode and use free Personal Team provisioning for hardware checks. This requires local account/signing setup but no paid Apple enrollment. Record the seven-day provisioning expiry and repeatable reinstall/recovery procedure. Prefer physical devices and serial Mac builds, with one simulator when automation needs it. Keep application containers on WSL. T3 remote control does not remove Mac compilation memory use. [Build/signing/test policy](mobile_development_plan.md#4-local-builds-and-free-apple-signing).

`verify:ios` records the commit/worktree, Xcode/macOS/CocoaPods versions, native inputs, and simulator build result under `.kairn/verification/ios-build.json`. Its simulator-runtime and physical-device fields remain `not_run`; the accompanying acceptance record must separately establish launch/API/reload/style and hardware results. An unavailable device or disabled agent integration is reported as missing evidence, not a passing check. Platform-native tools can build and install while T3 discovery is being configured. Agent app launch and UI checks use `device_list` → `device_open` and its returned device-bound command; report missing access when the required host is unavailable. A direct SSH UI workflow requires an explicit user request.

### 8.3 CI and review evidence

Create two required GitHub Actions jobs, with a final required status that runs even when an upstream job fails and succeeds only when both jobs succeed:

| Job | Required work | Evidence |
|---|---|---|
| Quality | Compose config validation, frozen tooling-image install, checks/tests/JS builds including both native exports, final image builds, composed HTTP/queue/storage integration | Test output, API drift comparison, web manifests, Android/iOS export output, image runtime results, startup/persistence checks |
| Android | Frozen install, native checks, pinned prebuild, debug APK, Gradle lint | APK, lint results, generated build settings and logs |

Run both on pull requests and the main branch initially. Avoid path filters until dependency-sensitive invalidation has been proven. Use read-only default token permissions, cancel superseded PR runs, bound job timeouts, pin actions by reviewed commit SHA, and preserve failure logs. Untrusted pull requests require no production secrets. Native debug signing is suitable for setup; signed release AABs belong to distribution configuration after identity is decided. [GitHub workflow guidance](https://docs.github.com/en/actions/reference/security/secure-use).

Require local Mac iOS verification evidence for relevant mobile/shared code, dependency, and configuration changes and before release readiness. Record the reviewed commit and results with the review. The two GitHub jobs do not establish iOS native success; paid hosted macOS CI, self-hosted runner installation, and EAS are not prerequisites. Android distribution remains first; Apple distribution signing/TestFlight/store checks follow later enrollment.

Provision the selected Playwright Chromium runtime in the quality job for the synthetic reader's hydration and request-isolation checks. Keep these tests in the integrated acceptance suite. No separate browser application or service is needed.

Cache the pnpm store and appropriate Gradle/download caches using toolchain, OS/architecture, lockfile, and native generation inputs. Begin with Vite+ task caching disabled for composite verification, generators, integration checks, prebuild, and native builds. Enable individual deterministic build caches only after input/output tests prove invalidation, including referenced web outputs, public build-time environment, shared config, app config, native plugins, template, and lockfile. Never cache secrets or claim a restored task cache is fresh runtime verification.

## 9. Implementation sequence and acceptance gates

Steps 1–7 have passed implementation and local acceptance for the agreed scope: Windows Android, iPhone simulator, and the available physical iPad. The user explicitly deferred physical iPhone checks. Full local verification and all three hosted checks passed on the application inputs at `58d258c`, and `main` requires the final GitHub Actions status. Signed iPad build/install, real HTTPS status, operator-confirmed refetch/spacing/rotation, exact source restoration, and automatic Connected after a fresh process now pass. Final documentation updates retain revision-specific CI results in draft PR #1. See the [current checkpoint](repository_setup_progress.md#current-checkpoint), [executed checks and compatibility decisions](repository_setup_progress.md), and [host setup](native_host_setup.md).

| Step | Changes | Completion gate |
|---|---|---|
| 1. Lock the toolchain | Root metadata, workspace manifests, Vite+ overrides, generator/compiler isolation, peer/build settings, strict TypeScript configs, ignore rules, doctor | Frozen reinstall works; package set is exact; Vite compatibility is proved; generator uses its supported compiler API; no unrelated peer failures are suppressed |
| 2. Establish shared exports | Five package boundaries, compiled exports, minimal status contract/protocol, tokens from existing design | Package builds pass; TS7 and mobile TS6 consume the same declarations; no React/Node leakage into universal exports |
| 3. Compose server and web | Multi-stage images, Caddy, Hono factory/entry, health/status endpoint, typed client, React routes, synthetic SSR/hydration, development override | Default Compose command starts the app; final images serve expected HTML/assets without source mounts; requests remain isolated |
| 4. Compose data and worker | PostgreSQL, authenticated persistent SeaweedFS, dev Mailpit, worker, controlled `migrate` task | Health/migration gates work; real queued work survives consumer restart; storage data survives recreation; internal services are not host-public |
| 5. Wire Windows Android | Native prerequisite inspection/install, local checkout/Metro, Unistyles/Nitro Expo shell, typed status, pinned portable CNG wrapper, private WSL ingress | Android export, Expo checks, APK/lint, actual emulator-to-API request, theme/style runtime checks, and reload pass |
| 6. Wire Mac iOS | Accept prior host compatibility, local checkout/Metro, pinned iOS generation including Unistyles/Nitro, Pods, simulator build, and Personal Team setup | iOS export, simulator build/launch/API/reload, theme/style runtime checks, and iPhone/iPad install/status checks pass; no paid Apple/EAS dependency |
| 7. Finish verification and CI | Containerized tooling, complete Compose checks, generation/boundary/runtime checks, device evidence, GitHub Actions and README | Both CI jobs and local iOS checks pass; final images/native host commands work; tracked files stay clean after checks |

These are reviewable implementation batches, not separate product releases. Resolve issues where first encountered instead of deferring compatibility until CI setup.

The initial test set proves integration boundaries: generated contract drift, actual schema validation, forbidden imports, production HTTP/SSR delivery, request isolation, worker persistence/shutdown, mobile dependency resolution, and negative type-check coverage. Do not write tests that merely assert a config file contains the values just written.

Keep coverage limited to mandatory acceptance gates and critical failure or durability scenarios. Prefer a small real integration scenario that proves the boundary; avoid duplicate mocked cases and tests for routine reversible changes. The [repository guidance](../../AGENTS.md#testing-scope) records this user preference for future batches.

Foundation acceptance requires Android and iOS simulator launch/status/reload plus Personal Team install/status checks on the available iPhone/iPad. Include a token-backed Unistyles control/screen in that evidence: verify initialization before route loading, responsive resizing/orientation, larger text, safe areas, and styles surviving Fast Refresh and a full relaunch on both platforms. Nitro autolinking and clean native builds must pass; Expo Go is not a foundation verification path. CI compilation proves the Android artifact builds; JavaScript export proves neither platform's native runtime. Capture process-death, grants, revocation, media processing, accessibility, and restore checks enter on both platforms with their production capabilities. T3 device discovery/UI control is verified separately once agent device access is enabled; no device success is claimed by this document.

## 10. Issues and open decisions

| Item | State | Required action or timing |
|---|---|---|
| GitHub Actions | Quality, Android, and final status passed on `58d258c`; `main` requires the GitHub Actions final status with strict checks and administrator enforcement | Keep hosted results tied to their revision; preserve separate local iOS acceptance evidence. |
| OpenAPI generator compiler API | TypeScript 6.0.3 passed CLI/API generation; TypeScript 7 failed | Use generator-local TypeScript 6 and record its tested peer exception. Qualify actual project schemas during implementation. |
| Vite alias peer range | Known supported exception | Preserve the narrow current convention and prove the real resolved plugin/build graph. |
| Android prerequisites | Windows native is the selected host | Inspect/install selected tools on Windows. No Mac Android SDK installation is needed. |
| Mac iOS compatibility | Previously tested and confirmed by the user | Proceed to an actual iOS app build; record installed tool versions. Recheck compatibility only for a concrete failure or toolchain change. |
| iPhone/iPad | iPad signing/build/install and physical runtime acceptance passed; physical iPhone deferred by user | Renew/reinstall after the current Personal Team profile expires November 9, 2026. Complete physical iPhone checks when it is available. |
| T3 native devices | Agent access enabled; Windows Android control qualified; Mac iOS host configured | Discover/open the required device in each new session and use the returned bound command. Record iOS runtime and separate physical-device results; do not reopen historical access-disabled or Xcode-selection blockers. |
| Windows capacity | User confirms 32 GB RAM; other hardware unverified | Check CPU/architecture, Windows version, virtualization, GPU, and SSD before qualifying emulator performance. |
| Docker Compose | Confirmed for application runtime; development host is Windows/WSL | Implement app/data containers, overrides, health gates, persistent volumes, bounded memory/concurrency, and tooling commands. Verify private ingress from every client. |
| Store/service spending | No paid Apple membership or EAS subscription during development; Play registration accepted | Use local builds and Personal Team provisioning now. Play's US$25 registration is one-time; defer Apple's annual enrollment and distribution until the later decision. |
| Final application identifiers, scheme, domain | Undecided by user | Use documented local-only Android/iOS identities for development and free provisioning. Confirm permanent identities before distribution or production auth links. |
| Target native devices and supported floors | Product policy open | Begin with SDK-supported builds; qualify Android and iPhone/iPad support with representative device tests. |
| VPS and backup/journal destination | Open in existing architecture | Required before infrastructure configuration and shared-data deployment. Not a local repository setup blocker. |
| Provider credentials and approved AI routes | Later integration inputs | Not needed for repository checks or debug Android builds. Current selected Mapbox bridge no longer requires a secret SDK download token; verify again when adding maps. A runtime public map token remains an integration input. |

No additional product decision blocks completing the foundation. The setup compatibility gates require engineering evidence. The GitHub repository destination is established; permanent distribution identity remains a later user decision.

## 11. Research and verification record

The [mobile development plan](mobile_development_plan.md) records the current platform/host/distribution decision and sources. The earlier [research report](../research/repository-setup/research.md) explains prior alternatives and risks; its Mac-hosted Compose/iOS-later guidance is superseded. Supporting files include [toolchain findings](../research/repository-setup/findings_toolchain.md), [Android findings](../research/repository-setup/findings_android.md), [Compose findings](../research/repository-setup/findings_compose.md), [Windows findings](../research/repository-setup/findings_windows_android.md), [TypeScript 6 execution findings](../research/repository-setup/findings_typescript6.md), [host/registry observations](../research/repository-setup/metadata.json), and the earlier [TypeScript 7 source probe](../research/repository-setup/compiler_api_evidence.json). Dated measurements and execution evidence remain unchanged.

This planning task inspected documentation, package artifacts, installed tool versions, Mac memory, and trimmed Tailscale peer status. It ran temporary isolated generator/compiler installations and real CLI/API/type-consumer checks, with a [repeatable research probe](../research/repository-setup/probe_openapi_typescript6.py). It did not install application dependencies, create Dockerfiles/Compose application files, generate native projects, start services, inspect Windows hardware, or qualify a device. Implementation establishes the remaining acceptance evidence.
