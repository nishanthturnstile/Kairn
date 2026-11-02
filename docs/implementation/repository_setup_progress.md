# Repository setup progress

Date: 2 November 2026. Implementation and local acceptance passed for the agreed scope: Windows Android, iPhone simulator, and the connected physical iPad. The user deferred the unavailable physical iPhone. Full local verification and hosted CI passed on the application inputs at `58d258c`; subsequent documentation heads retain their own PR check results. Tracks the [setup plan](repository_setup_plan.md#9-implementation-sequence-and-acceptance-gates).

## Current checkpoint

| Work | Current result |
|---|---|
| Toolchain, shared exports, composed web/server/data/worker (steps 1–4) | Recorded acceptance passed. |
| Windows Android (step 5) | APK/lint, launch, styles, Fast Refresh, orientation/larger text, real HTTPS status, manual refetch, and process relaunch passed. |
| Mac iOS (step 6) | Simulator build/UI/API/refresh/layout acceptance passed. Physical iPad signing, arm64 build, profile/signature checks, install, launch, and schema-validated HTTPS status passed. The user confirmed manual refetch, spacing/rotation, and automatic Connected after a fresh process with original source. Physical iPhone checks are explicitly deferred. |
| Verification and CI (step 7) | Full local `pnpm verify` and all three hosted checks passed on `58d258c`. `main` requires the GitHub Actions final status and an up-to-date branch, including for administrators. Local iOS acceptance is complete for the agreed devices. CI also runs on the final documentation update; its result remains revision-specific in draft PR #1. |

The dated entries below preserve execution history. Earlier DNS and Xcode-selection failures are superseded by later results; they are not the current task list. The user authorized publishing the foundation on review branch `setup/foundation-verification`. Windows, WSL, and Mac were synchronized with clean tracked trees at `58d258c`; each retained its owning OS's dependencies and generated output. Local acceptance preceded publication, so its recorded source hashes identify the tested inputs.

### Hosted CI and iPad signing checkpoint

All three hosted jobs passed on `58d258c036db6f0428bdced710259798630566ad`: Quality, Android, and Repository setup required ([run 41465354056](https://github.com/nishanthturnstile/Kairn/actions/runs/41465354056)). The Android SDK package correction is therefore qualified. The final status is required on `main`, bound to GitHub Actions app ID 15368, with strict up-to-date checks and administrator enforcement. Force pushes and branch deletion are disabled. No approving-review requirement was added. The draft PR remains unmerged.

The initial arm64 iPad build failed in `[CP] Embed Pods Frameworks` while signing `ExpoFileSystem.framework` with `errSecInternalComponent`. The SSH login-keychain status was locked (flags 2). The user selected the Mac's Karthi provider for a local retry; that context reports an unlocked keychain (status 0, flags 7). An initial probe failed before signing because copying protected system metadata was not permitted; an ordinary file copy corrected that helper. Short signing probes then timed out while macOS displayed key-access prompts. The security log confirmed the user's local Always Allow approval and a later fresh prompt. A coordinated probe with a 180-second limit succeeded in 11.8 seconds after the user approved that active prompt. No credentials passed through chat or repository files, and the agent did not change keychain settings or replace certificates.

The single incremental two-job build then succeeded using the existing generated workspace and object files. Deep/strict signature verification passed; the app is arm64 with bundle identifier `dev.kairn.app`. Its unexpired Personal Team profile includes the connected iPad and expires November 9, 2026. Bounded native installation succeeded, and the install JSON confirms that bundle ID. A follow-up audit records the clean Mac source revision `58d258c`, accepted source/Pod-lock hashes, and executable/debug-library hashes. No prebuild, Pod update, or permanent application-source change was needed.

The user explicitly authorized SSH/native app launch and logs after T3 discovery failed its advised retry. Initial launch was refused until the user trusted the Developer App on the iPad; Developer Mode was already enabled, and app/profile entitlements matched. The initial private HTTP Metro route passed host checks but did not load JavaScript on the iPad. The compiled app permits local HTTP addresses, while the fully qualified Tailscale hostname requires HTTPS. Private Tailscale Serve now terminates normal TLS on Mac port 8081 and forwards to the existing loopback Metro. Expo respects the forwarded protocol and generates HTTPS bundle URLs. Host manifest and WSS checks passed, followed by a native iPad bundle load and JavaScript evaluation. No ATS exception, custom CA, TLS bypass, Metro restart, or unrelated Serve change was needed. See [Apple's local-networking rules](https://developer.apple.com/documentation/bundleresources/information-property-list/nsapptransportsecurity/nsallowslocalnetworking).

The working Metro origin is `https://nishanths-macbook-pro.tail30fb6a.ts.net:8081`; rollback removes only that route with `tailscale serve --https=8081 off`. The API remains `https://nishanth-windows.tail30fb6a.ts.net:8443`. An iPad-only temporary query diagnostic recorded HTTP 200 and the schema-validated `{ contractVersion: 1, syncProtocolVersion: 1, status: "ok" }` response. The user confirmed a successful manual Check again, compact spacing, readable landscape, and portrait restoration. These UI observations are operator reports, not agent screenshots or an independently attributed manual-request log.

The diagnostic was restored in `finally` to the exact accepted query bytes; layout and screen hashes also match their originals. Native process launch then exited 0 with a fresh PID (`887` → `889`) and the original source. Without pressing Check again, the user confirmed automatic Connected / Contract 1 / Sync protocol 1. The final Mac tracked tree was clean. Bounded console sessions end with a timeout because they wait for app exit; those capture timeouts are separate from the successful final non-console launch and API evidence. No further iPad acceptance gate remains for this scope. Physical iPhone checks stay deferred, and T3 panel discovery/control remains a separate tooling limitation.

Evidence is retained under ignored `.kairn/verification/ios-2026-11-02/` on the Mac: coordinated build/signing/install records, `ipad-metro-https-route.json`, `ipad-api-validated-events.json`, `ipad-api-probe-session.json`, `ipad-final-pristine-launch.json`, `ipad-final-pristine-runtime.json`, and `ipad-runtime-acceptance.json`. Small records are also copied to Windows; its `.kairn/verification/` retains the original Tailscale/host route probes and branch-protection request/result. Coverage proved the real signing/build/install, native client/API, source-restoration, and fresh-process boundaries, with operator confirmation for visible hardware behavior. The already-passed simulator Fast Refresh/larger-text and Android suites were not duplicated. This checkpoint supersedes the earlier incomplete signing, device, and CI entries below.

## Setup cleanup and iOS simulator acceptance — 2 November 2026

### Draft PR and signing revalidation

The user authorized committing/pushing the full foundation and opening draft [PR #1](https://github.com/nishanthturnstile/Kairn/pull/1) from `setup/foundation-verification` to `main`. Initial head `f8fa5c6` contains the reviewed source; Windows Git lacked an author, so that commit reused the latest repository commit's author identity for the command only, without changing global configuration. The first hosted Android job failed before dependency installation because `platforms;android-37` is not a repository package. The actual qualified Windows SDK metadata identifies `platforms;android-37.0`; CI's install path/cache key now use that exact name, and SDK-install logs are retained even on setup failure. No SDK floor, dependency pin, or app configuration changed.

The first signing revalidation still showed no team/certificate/profile. After the user confirmed the target selection, a fresh project read found the development team in both configurations, one valid Apple Development signing identity, and one provisioning profile. A signed arm64 iPad build has started against the existing generated workspace; no prebuild erased the user's signing selection. T3 discovery still failed after its single advised refresh, so no iPad UI acceptance is claimed.

The cleanup excludes `.kairn/` and host mobile exports from Docker build contexts, replaces stale current-status instructions, and adds the missing `build`, `verify`, `dev:android`, `dev:ios`, and `start:worker` commands. `verify:ios` now records native build inputs/results without claiming device acceptance. The Quality/Android workflow has SHA-pinned actions, read-only permissions, scoped caches, PR cancellation, failure artifacts, bounded jobs, and an always-run final required status. Actionlint 1.7.12, YAML/required-job checks, all fourteen Bash script syntax checks, and targeted Vite+ checks passed. The first staged-diff whitespace check exposed literal whitespace in pnpm-generated patch headers/context; a patch-only `blank-at-eol` attribute preserves their qualified, hash-sensitive bytes while retaining ordinary source checks. Actual hosted execution and branch protection are still pending.

The real container install exposed pnpm using `/app/node_modules/.pnpm-store` despite the existing BuildKit cache mount. `PNPM_CONFIG_STORE_DIR` now explicitly selects `/home/node/.local/share/pnpm/store`; subsequent install/deploy logs confirm that path and reuse the resulting build layers. Full WSL `pnpm verify` passed: frozen tooling install, toolchain probes, `check`, 30 tests, every JS build including both mobile exports, universal/client boundaries, development and final-runtime browser/HTTP checks, production dependency closures, failed-migration gating, database readiness loss/recovery, durable queued work, authenticated persistent storage, and SMTP. Owned verification containers/networks/volumes were removed. The wrapper retained nine required artifacts and all six generated-input byte comparisons under WSL `.kairn/verification/run-udgeHN/`; its result/logs are also available in Windows `.kairn/verification/wsl-run-udgeHN/`. A separate WSL inspection command timed out during the run, while the already-running verifier and Docker remained healthy; no host reset or development-service restart was performed.

T3 opened the existing `mac-ios` / Kairn iPhone simulator. The first daemon call returned `ECONNRESET`; its advised retry succeeded. The compiled x86_64 app was installed with native tooling, and all app/UI operations used the returned bound command. The first deep link required the normal Open confirmation. Launch then exposed the native assertion that `statusBarStyle` requires `UIViewControllerBasedStatusBarAppearance=YES`, while the built Expo shell has `false`. The shared layout now supplies this override only on Android; iOS retains Expo's light-interface default. This JS-only correction removes the assertion and preserves Android's existing option, with no dependency or native-input changes.

| iOS simulator gate | Result |
|---|---|
| Launch / Unistyles initialization / private HTTPS | Passed: unobstructed Service connection, Connected, Contract 1, Sync protocol 1 at the unchanged private HTTPS origin. |
| Manual Check service connection | Passed: supported button press settles back to Connected without refresh error or pending/disabled state. |
| Spacing variants | Passed: Compact spacing becomes selected and the card visibly contracts. |
| Fast Refresh / exact restoration | Passed: temporary heading changes to Service connection refreshed with compact state retained; restoring exact screen bytes restores the heading with state still retained. |
| Full process relaunch / automatic status | Passed after exact restoration: PID changes from 75423 to 76977; a new in-memory QueryClient reaches Connected automatically. |
| Landscape / safe areas | Passed: native rotation and scrolling expose both controls above the home indicator; portrait restored. |
| Larger text | Passed at accessibility-medium: text wraps and scrolling exposes both controls; original large category restored and read back. |
| Source checks | Windows and Mac mobile TS6 pass; targeted formatting/lint pass. Screen/query hashes remain their accepted originals; final layout SHA-256 is `0a120f21a39e052e4a441b53bfb81c45ad3a2d7edfd7abe828263718282bc218`. |

Evidence: ignored `.kairn/verification/ios-2026-11-02/` contains compact, landscape, larger-text, and final Connected captures plus the final accessibility snapshot. The temporary heading was restored in `finally`. T3 used its supported XCTest snapshot fallback where its AX bridge was unavailable. A PowerShell ref-splatting error was corrected by quoting the snapshot ref before the successful manual press; no UI bypass was used.

The user has deferred the unavailable physical iPhone and selected the connected iPad for current hardware testing. Fresh Xcode/CoreDevice inspection sees iPad Air (5th generation), iPadOS 26.6.2, available on USB; Kairn's device build settings resolve arm64 but have no development team, and `security find-identity -v -p codesigning` reports zero valid identities. The actual automatic-signing device build failed with `Signing for "KairnDev" requires a development team. Select a development team in the Signing & Capabilities editor.` The user has been asked to select their Personal Team and automatic signing in Xcode, keeping Apple sign-in on the Mac. Its build settings/log remain under the Mac's `.kairn/verification/ios-2026-11-02/`. Later T3 discovery failed twice with `Could not communicate with device support. Try refreshing devices.`; device UI operations stopped after that advised refresh. This does not invalidate the completed simulator evidence, and no physical-device success is claimed.

## Step 1 implementation

Step 1 created the ten planned private workspaces and one pnpm lockfile, Node/package-manager metadata, isolated dependency resolution, strict peer/build settings, environment-specific strict TypeScript configs, Vite+ configuration, ignore/line-ending rules, role-aware doctor, and a repeatable `verify:toolchain` command. Shared package exports followed in step 2 below; application process commands remain for later batches.

Root tooling configs include DOM declarations because Vite+'s bundled browser-test configuration types reference them. The environment-neutral base and pure package configs remain free of DOM and Node types. Mobile extends Expo's base and retains its own compiler. `skipLibCheck` remains false.

## Compatibility decisions

- Node 26.13.0 was installed alongside the host's existing Node versions with fnm. The machine's default Node version was not changed. Use `fnm use` in this checkout.
- Strict peers stay enabled. Automatic peer installation, peer deduplication across optional contexts, and root peer inheritance are disabled. React and React types belong to the owning apps.
- The Vite alias is restricted to Vite+ core 1.4.0; Vitest is restricted to the bundled 5.0.5. Exact-parent overrides extend the Vite peer ranges of React plugin 6.1.2, Vitest 5.0.5, and its mocker 5.0.5 to accept the alias identity. Live pnpm documentation shows `:peer` selectors, but the installed pnpm 12.16.1 binary rejects them with `ERR_PNPM_INVALID_SELECTOR`. Plain parent/dependency overrides work with this pinned release; these packages declare Vite only as a peer. No global peer mismatch suppression is used. [pnpm override documentation](https://pnpm.io/settings/dependency-resolution), [Vite+ installation](https://viteplus.dev/guide/local-cli).
- The isolated generator uses `openapi-typescript@7.13.0` and TypeScript 6.0.3 with one exact-parent peer-range override. The regression command verifies the generator's actual compiler resolution, compares CLI/API declarations, and checks positive/negative consumers under TypeScript 6 and 7. Actual project wire schemas enter in step 2.
- Redocly OpenAPI core 1.34.22 publishes declarations importing `json-schema-to-ts` and `js-yaml` types but lists their providers as development dependencies. One version-specific `packageExtensions` entry supplies `json-schema-to-ts@3.1.1` and `@types/js-yaml@4.0.9` so generator declaration checking can remain enabled. These are isolated tooling dependencies.
- Expo's actual graph requires Gesture Handler 3.3.0 and Reanimated 4.7.1 through Router's drawer dependency; Reanimated requires Worklets 0.13.0. These enter now under the register's navigation-peer exception. Radix dependencies also require SDK-matched React DOM 19.3.0 in mobile. Worklets requires the matching `@react-native/metro-config@0.88.1` peer, declared as mobile development tooling; Expo's Metro defaults remain selected. Expo's install/version check selected Babel core 7.29.7. No `@expo/ui`, NativeWind, or deprecated edge-to-edge package is installed.
- Dependency lifecycle approvals are currently empty (`allowBuilds: {}`), with `strictDepBuilds: true`. The current graph uses published binaries without requiring an approved install build. Later dependencies that require builds must receive reviewed approvals.

## Verification

Step 1's completion gate passed on WSL Linux x64 after removing all eleven generated `node_modules` directories (root plus ten workspaces) and reinstalling from the frozen lockfile. The install restored 609 dependency packages from the pnpm store. The lockfile SHA-256 stayed `b7bfb146c2a31524becf1d72f36345b8c34f607ba6c77f8dfc0a33d898e6ecd0`.

| Check | Executed result |
|---|---|
| `pnpm install --frozen-lockfile` with empty dependency directories | Pass; lockfile unchanged, strict peers/build policy enabled |
| `pnpm verify:toolchain` after reinstall | Pass; exact ten-workspace set, resolved compiler/React split, Vite core identity, browser and SSR builds, React render, positive/negative compiler checks, generator CLI/API and TS6/TS7 consumers |
| `pnpm check:tooling` | Pass; Vite+ lint/type checks, root TypeScript 7 check, and generator-local TypeScript 6 check with declaration checking enabled |
| `pnpm peers check` | Pass; no peer dependency issues |
| `CI=1 pnpm --filter @kairn/mobile exec expo install --check` | Pass; dependencies up to date for SDK 58 |
| `pnpm run doctor wsl` | Pass; Node 26.13.0, pnpm 12.16.1, Vite+ 1.4.0, Docker Compose 5.6.1, Docker daemon 29.9.2 |
| `pnpm format:check` and `git diff --check` | Pass |
| Installed package lifecycle inspection | No actual installed package has preinstall/install/postinstall scripts; no approvals needed yet |

Native compilation, autolinking, simulator/emulator launch, device behavior, production hydration, Compose application services, and CI have not been qualified by step 1. Doctor checks here are WSL/tooling results; no Windows-native or Mac checks were run.

## Step 2 implementation

All five shared packages now build ESM JavaScript, declarations, and source maps with the selected `vp pack`. Export maps expose only `dist` artifacts. Vite+ builds packages in their declared dependency order, with task caching disabled. The root test harness declares its workspace dependencies explicitly.

- `contracts` owns strict Zod status/error schemas and the read-only `/api/v1/system` descriptor. The status response contains contract version, sync protocol version, and `status: "ok"`. Separate `schema`, `client`, and generated `types` exports keep Hono/OpenAPI registration out of client runtime imports. Generation needs neither server processes nor generated types: `build:schema` compiles only the descriptor/schemas; the TypeScript 6 tool generates the sorted OpenAPI 3.1 document and API types; the full package then compiles. `api:check` compares fresh bytes without rewriting artifacts. Generated JSON/types are excluded from formatting to preserve their canonical generator output.
- `shared` supplies an exhaustive-union assertion without platform dependencies. `sync-protocol` owns version 1, stable UUID command IDs, named/validated payload envelopes, and mutually exclusive accepted-result/rejected-error envelopes. It introduces no product commands, persistence, server execution, or idempotency guarantee.
- `design-tokens` contains the existing section 8 colors, typography, spacing, radii, responsive grid/layout values, and visual measurements as plain values. CSS custom properties are generated from the same compiled values during its build. Font files, native theme registration, and UI components are not introduced here.
- `backend` provides explicit environment parsing for `NODE_ENV`/`LOG_LEVEL` and Pino logger factories with standard credential-field redaction. Imports do not read the process environment or start a runtime. Database/queue lifecycle joins with step 4.
- Boundary checks inspect manifests and import syntax, including type imports and dynamic imports, rejecting undeclared dependencies, client/backend dependencies, private workspace paths, relative workspace escapes, nonliteral runtime imports, universal Node/React imports, and application imports outside the server's explicit reader export. The browser bundle probe retains all universal exports and the client, checks module IDs/secret markers, and exercises deliberate Node/secret failures. Step 3 must wire these checks to actual application artifacts.

`check`, `test`, `check:declarations`, and `verify:shared` build their prerequisites. Builds run `api:check` and fail on drift; they do not repair stale generated artifacts. Package source checks and both declaration consumers use `skipLibCheck: false`. Pure shared/tokens declarations are consumed with ES-only libraries and no ambient types. Contracts/protocol need the standard `URL` type referenced by Zod 4.6.7: their web consumer uses DOM globals and their mobile consumer uses actual Expo/React Native globals. No Node/React imports are added to universal runtime exports.

### Step 2 declaration compatibility patches

Strict source and platform-consumer checks exposed upstream declaration defects. The selected runtime versions are retained with small `patchedDependencies` files under `patches/`; these alter declarations only, not JavaScript/native runtime code:

| Patch | Correction and verification |
|---|---|
| `react-native@0.88.1` | Optional animated allowlist properties permit `undefined` in the index signature; the virtualized-list instance alias uses its constructor's `InstanceType` without React's incompatible static-method constraint; base node `textContent` permits the document subclass's existing `null` result. The complete native declarations pass the actual mobile TS6 consumer with declaration checking enabled. |
| `openapi-fetch@0.17.0` | Derive stream response data conditionally from the platform's `Response.body`; React Native's declared response has no body stream, so its stream data type is `never`. This neither adds a native stream implementation nor widens the application's transport. JSON client types pass both web and native consumers. |
| `thread-stream@4.2.0` | Derive transfer-list type from `Worker.postMessage` rather than the removed Node `TransferListItem` alias. Backend declarations/source pass the selected Node 26 types. |

Vite+'s bundled declaration builder reports that its TypeScript 7 integration is experimental. Real builds and TS6/TS7 consumers pass; the warning is retained. Requalify patches and generation on dependency upgrades. pnpm also recorded an exact `hono@4.13.16` release-age exception for the already selected foundation pin; there is no wildcard age exception.

### Step 2 verification

Step 2's completion gate passed on WSL Linux x64. Removing all eleven dependency directories and reinstalling frozen restored 631 packages with the three recorded patches. The lockfile SHA-256 remained `dbe22e80a3ab30042d643814dc7aaa8c27586f2e344e0d6448f4c03383134394`.

| Check | Executed result |
|---|---|
| Clean frozen reinstall | Pass; patches applied with unchanged lockfile |
| `api:generate` after removing all five `dist` directories and both generated API artifacts | Pass; byte-identical document/types, demonstrating no bootstrap cycle |
| `pnpm check` after removing all package build outputs | Pass; builds its own prerequisites, checks drift/format/tooling, all five package sources, boundaries, and both declaration consumers |
| `pnpm test` / final Vite+ test run | Pass; 25 tests across wire validation, generated client transport/errors, compiled schema load order, envelope constraints, logging, and forbidden imports |
| `pnpm verify:shared` | Pass; compiled export checks under TS7/TS6 plus production browser bundle and deliberate Node/secret probes |
| Direct generator `--check` after the full contracts build | Pass; compiled schema export loads independently of schema-only bootstrap output |
| Temporary drift in each generated API artifact | Both fail with the expected drift error and preserve input bytes; fixtures restored afterward |
| Actual temporary web source importing backend | AST boundary command fails with the expected error; fixture removed afterward |
| `pnpm verify:toolchain` | Pass; existing pinned tool/plugin/generator compatibility retained |
| `pnpm peers check`, SDK `expo install --check`, WSL doctor | Pass; no peer/version failures and Docker prerequisites available |
| Formatting and whitespace checks | Pass |

The compiled-schema regression exposed an initialization-order issue: the full build's shared schema chunk can initialize before Hono extends Zod. The schema descriptor now clones the validators after that extension loads, retaining the original validation rules before attaching OpenAPI metadata. A test imports universal schemas first, then the full compiled schema export; both that order and standalone generation work. Generated API bytes remain unchanged.

The HTTP server, application UI, durable synchronization, native autolinking/build/runtime, and Compose services remain outside step 2's acceptance claim. The deliberate Node bundle rejection prints an expected failed-build line before the verification command reports success.

## Step 3 implementation

The web/server batch now includes:

- A Hono app factory separate from process startup, the actual generated-contract `GET /api/v1/system` implementation, separate live/ready routes, validated startup environment, explicit allowed origin, safe errors, and graceful shutdown. Readiness currently qualifies the process and web artifacts; it does not claim database or worker readiness.
- A React creator shell with TanStack Router's generated route tree and code splitting, TanStack Query-owned status fetching, runtime response parsing, Tailwind, and shared token CSS. Client router instances own their Query client. No source aliases or separate web application service were introduced.
- A synthetic reader at `/setup/reader` using the same React component for SSR and hydration. Per-request data stays local, JSON bootstrap escapes HTML delimiters and Unicode separators, and title/text arrive in server HTML. A button proves hydration; a second action loads a lazy chunk and reads the typed API. Public journey routes remain unavailable.
- Production delivery from the actual Vite manifest: CSS/preloads, lazy assets, immutable hashed assets, and a narrow `@kairn/web/reader` export. All manifest assets must exist within the client directory before startup succeeds. Raw source/config, maps, unknown assets, and traversal paths are not served.
- One Node HTTP listener in development with Vite middleware, HTML transformation/React refresh, HMR through Caddy, and fresh SSR module loading. Middleware routing and file allowances exclude private server source. Compose Watch syncs web source, syncs/restarts server source, and rebuilds shared/dependency/config changes.
- Digest-pinned Node 26.13.0 bookworm-slim and Caddy 2.11.7 alpine images; one loopback ingress port; no host-published server port; non-root runtime, read-only production root, bounded resources, health gates, and independent Linux dependencies. `pnpm deploy --prod` stages the compiled production closure, including the web artifacts; a single packed server file is not treated as standalone.
- A tooling image with pinned Playwright/Chromium and no Docker socket. Browser installation is cached before source copying. Vite+ remains the sole test/check runner, using Playwright as the browser engine. `verify:web` owns isolated Compose projects and cleans up their containers/networks.

### Step 3 compatibility and build decisions

The selected Router/Query, Tailwind, Hono Node adapter, and Playwright pins were installed at their foundation stage. The Router and Tailwind plugins need exact-parent Vite alias peer adjustments; unrelated strict peers remain enabled. Babel React Compiler 1.0.0's published declarations require missing Babel core/traverse types, supplied by one version-specific dependency extension. The server's Hono/Vite tooling program includes standard DOM declarations for WebSocket/Fetch interfaces; pure packages and mobile retain their existing environments.

The development pack must use `deps.neverBundle: true`: bundling the aliased Vite core, or selecting it only by its upstream `vite` name, relocates native binding lookups and fails startup. The qualified output keeps Vite as a normal development dependency import. Production has no Vite dependency. Vite+ task options precede task names to avoid passing options such as `--no-cache` to TypeScript.

Docker uses a BuildKit pnpm cache; step 4 below records a correction to its store path. pnpm's automatically recorded release-age exceptions remain version-specific for the selected pins. Package-distributed agent skills are left awaiting approval; the repository's existing vendored skills/manifest are unchanged. Installing runtime dependencies did not replace them.

### Step 3 verification

The isolated development and final-runtime stacks passed the composed HTTP/browser suite. The production closure probe passed with 44 installed runtime packages, all first-party exports resolving under `/app`, development tools/source absent, and a non-root process.

| Check | Executed result |
|---|---|
| `pnpm verify:web` | Pass; isolated development and final-runtime builds start healthy, each passes all five HTTP/browser integration tests, and their containers/networks are removed afterward |
| Final runtime closure | Pass; compiled workspace exports resolve inside the deployed image; Vite, Vite+, TypeScript, generator, Playwright, source directories, and environment files are absent; process is non-root with a read-only root filesystem |
| `pnpm check`, on the host and in the tooling container | Pass; real application builds, API drift, formatting, tooling/app/package types, boundaries, and both declaration consumers |
| Vite+ unit/behavior suite | Pass; 30 tests including the importable HTTP factory, origin checks, safe errors, wire validation, and shared-package behavior |
| Current development stack integration | Pass; five tests cover typed status through Caddy, concurrent SSR isolation, escaped bootstrap data, hydration, lazy chunks, creator routing/reloads, private-file rejection, shared token CSS, and the Vite HMR WebSocket connection |
| Compose Watch source synchronization | Pass; a temporary reader-text edit appeared in served SSR HTML, the original source was restored, and the restored text appeared without recreating the stack |
| Actual web build boundary probes | Pass; shared exports/client build with the application Vite configuration; intentional Node imports and seeded server-secret output are rejected |
| `pnpm verify:toolchain`, `pnpm peers check`, tooling-container doctor | Pass; compiler/React/generator compatibility retained, no peer issues, and container role detection reports tooling prerequisites |

The default development stack is left running at `http://localhost:8080` for review. Start the Watch session with `docker compose up --build --watch` when editing. The temporary synchronization and rejection fixtures were restored or removed.

No database, object storage, worker, Mailpit, native build/device, private Tailscale ingress, or production deployment success is claimed in this batch.

## Step 4 implementation

Compose now starts PostgreSQL 18.6, authenticated SeaweedFS 4.51, a one-shot queue bootstrap, and the separate pg-boss worker, with Mailpit 1.33.0 in the development override. Service image tags are pinned by digest in the Compose files. Database and object data/metadata use named volumes; ordinary shutdown retains them. Only Caddy and the development Mailpit UI publish loopback ports. PostgreSQL/storage have a private internal network, and the application receives no host paths or Docker socket.

PostgreSQL initializes separate schema-owner, server, and worker login roles on a new volume. The migration role owns only the queue schema; server/worker roles cannot create objects. The controlled bootstrap installs/upgrades pg-boss and grants runtime permissions. It can run repeatedly without clearing queue state. Server/worker startup requires successful bootstrap and healthy data services. PostgreSQL health uses TCP so its temporary initialization server cannot satisfy the gate prematurely. Storage health requires the S3 endpoint to reject an anonymous request.

`@kairn/backend/database` owns bounded pools and safe connection-URL validation; `@kairn/backend/queue` creates runtime pg-boss instances with migration/schema creation disabled. Scheduling, persisted queue statistics, and owner-only index rebuilding are disabled until their owning work is introduced; expiration/retry supervision remains active. The worker has bounded startup, graceful signal handling, and a readiness heartbeat that checks its live database connection. Server readiness also checks the bootstrapped database and returns 503 during an outage. Neither application process receives migration credentials.

The production worker registers no synthetic or product handler yet. A test-only fixture starts the compiled worker factory in a separate Node process and registers one bounded synthetic queue handler. No public smoke endpoint or domain table was added. Final worker/migration images deploy their compiled production dependencies; the development worker supports Compose Watch. `queue:bootstrap`, `build:worker`, `test:data`, and `verify:data` expose these operations.

### Step 4 compatibility and scope

- Added the selected `pg@8.23.1` and `pg-boss@12.38.0`, plus its explicit `@opentelemetry/api@1.10.0` peer and development `@types/pg@8.23.1`. No tracing backend, ORM, or domain migration tooling was needed for queue bootstrap.
- The published pg-boss declarations reference `ResolvedConstructorOptions`, but its declaration build strips that interface and its `CompatibilityFlags` parent. The [declaration-only patch](../../patches/pg-boss@12.38.0.patch) restores the exact fields from the [12.38.0 source](https://github.com/timgit/pg-boss/blob/12.38.0/src/types.ts). Strict checking passes without changing runtime JavaScript or disabling declaration checks.
- The selected S3 SDK is a root development dependency for real protocol acceptance. Application uploads/storage adapters remain later work. Mailpit acceptance uses Node's SMTP socket, adding no email runtime library early.
- Container install output identified pnpm's actual store as `/home/node/.local/share/pnpm/store`; the BuildKit mount now uses that path for installs and deployments.
- Mailpit uses the application bridge so its loopback UI port can be published; an exclusively internal Docker network suppressed that binding. SMTP stays unpublished, and PostgreSQL/storage remain on the internal data network.
- Local credentials are documented in `infra/compose/.env.example`. Existing PostgreSQL roles require deliberate password rotation; changing initialization variables does not rewrite them. The verification wrappers force isolated local connection settings, use their own projects, and remove only their disposable volumes. They never follow a developer's shared-service URLs.

### Step 4 verification

Coverage follows the user's preference recorded in [AGENTS.md](../../AGENTS.md#testing-scope): three critical integration scenarios, required lifecycle gates, and the existing checks. No new unit-test matrix or mocked infrastructure suite was introduced.

| Critical scenario | Acceptance boundary |
|---|---|
| Queue recovery | Start/stop a separate consumer, enqueue while it is stopped, recreate PostgreSQL retaining its volume, then start a new consumer and observe the recorded completion/output; runtime DDL is denied |
| Private object durability | Signed put/get, anonymous and invalid-credential rejection, then exact bytes/metadata after storage container recreation |
| Development email sink | Send SMTP to Mailpit and find the unique message through its local API; no external provider involved |

The full final-image integration run passed all three scenarios, failed-bootstrap gating, repeated bootstrap, readiness loss/recovery during a database outage, the five existing browser checks, and the non-root worker runtime closure probe. The two persistence scenarios run before and after container recreation; Mailpit is exercised once in that sequence.

| Check | Executed result |
|---|---|
| `pnpm verify:data` after the final image/cache changes | Pass; three initial integration scenarios and both post-recreation checks; actual failed bootstrap blocks dependents; repeat bootstrap succeeds; server/worker lose readiness with PostgreSQL stopped and recover without process recreation |
| Final worker closure | Pass; compiled imports load in the non-root, read-only image without source, Vite+, TypeScript, Playwright, or migration credentials |
| Existing browser integration | Pass; five checks against final runtime and five against the updated development stack, including development HMR connectivity |
| Mailpit after the network adjustment | Pass; loopback UI returns HTTP 200 and the existing SMTP scenario passes against the updated development service |
| `docker compose up --build -d --wait` | Pass; server, worker, PostgreSQL, storage, Caddy, and development Mailpit are healthy; `migrate` exits successfully |
| `pnpm check` | Pass; real builds, API drift, format/tooling/app/worker checks, boundaries, and TS6/TS7 compiled declaration consumers |
| Existing unit/behavior suite | Pass; all 30 tests retained, with no additional unit cases |
| Frozen install, peer check, Expo SDK version check | Pass; lockfile unchanged by frozen install, no peer failures, mobile SDK dependencies remain current |
| Compose configurations and whitespace | Pass; development/final/data-test configurations validate; production excludes Mailpit; `git diff --check` passes |

The final step-4 lockfile SHA-256 is `96fc8d90d28259bc64558ee7d13c1d5afb0815a579d2c49452239c9ac3ba6c85`. Verification projects clean up their own containers, networks, and disposable volumes. The development stack remains running at `http://localhost:8080`, with Mailpit at `http://localhost:8025`; both development data volumes are retained.

Domain schema/transactions, production upload protocols, account email, backup/restore, PostGIS/pgvector, private Tailscale ingress, and native device behavior are outside this batch's acceptance claim.

## Step 5 host/device integration — in progress

On 2 November 2026, the Windows T3 service at `127.0.0.1:3773` returned HTTP 200 with the T3 Code title. Windows had Android Studio, the SDK under the user's local Android directory, current command-line tools, the `Pixel_10` AVD, and running emulator/QEMU processes. This is host inspection, not proof of app launch or UI control.

Both Windows and WSL already had device support and agent device access enabled. This thread's `device_list` still returned only Linux `local`, no devices, and "Android SDK was not found." Its server identity was Linux, independently of which environment the desktop UI selected. The Windows web app was reachable over the existing private Tailscale route but required pairing before browser settings could be used; no pairing credential was read or exposed.

The missing `linkedEnvironmentsEnabled` setting was set to `true` in both user-level T3 settings files. Exact pre-change backups remain under each host's `.t3/config-backups/kairn-device-link-20261102-035244/settings.json`; all other parsed settings were verified unchanged. The live WSL tool's error changed from "Linked environments is off on this machine" to "This environment is not linked," proving the setting was reloaded without restarting either server. The current agent still lacks `t3_environment_link`/`t3_environment_links`; no machine pairing was completed.

Inspection of the installed `0.1.7-nightly.20261101.4048` server declarations confirms that device tools act as the calling thread and do not route through `environmentId`. A Windows-environment T3 session is the direct path to its emulator; environment linking alone does not move that emulator into this WSL thread. Windows had managed hub `0.19.1` installed, but its saved hub record did not identify a live hub and its port refused connections. No managed `agent-device` version was installed. Windows T3 must refresh/start its own Device integration and install the required agent tools (`0.21.31` for this build), then pass `device_list` → `device_open` and actual UI checks.

Verification was limited to these real host/configuration boundaries. No test cases were added for this reversible settings/documentation change. That inspection did not qualify Android installation; the subsequent successful APK installation is recorded below. Device UI interaction, typed API access from the emulator, and reload/style behavior remain unverified; step 5 is not complete.

### Mobile shell and compatibility

The Expo shell now has the custom Unistyles-before-Router entry, light design-token theme, responsive spacing variants, Query provider, and generated typed status request. It displays configuration/request errors and retains a previous successful response during a failed refresh. Requests have bounded cancellation/timeouts; credentials and server URLs are not embedded in source. The local-only app identity is `dev.kairn.app`, with scheme `kairn-dev`; permanent distribution identity is still undecided.

Native generation uses `expo-template-bare-minimum@58.0.30` and verifies that root/mobile package manifests and the pnpm lockfile do not change. SDK 58 requires New Architecture; its schema rejects the legacy `newArchEnabled` field. System UI `58.0.7` applies the light native appearance. Babel preset `58.0.23` and its explicit React Refresh peer `0.14.2` are required by the actual transform. Router's published native-tab declarations require Symbols `58.0.4` and Font `58.0.11`; these do not introduce a second UI framework. Exact selections are in architecture section 14.

Strict native TypeScript uses real RN globals and the RN 0.88 legacy deep-import declaration condition, keeping `skipLibCheck: false`. Declaration-only patches correct Router's dangling navigator generics/exact-optional/DOM Performance dependencies, Unistyles' React component constraints and hydration state declaration, and Expo Server's native-missing Fetch union aliases. Runtime JavaScript is unchanged. Expo startup removes typed-route includes when typed routes are disabled; the canonical mobile config now matches that supported include list and passes a fresh strict type check. Metro emits warnings for Unistyles' extensionless component export targets and successfully falls back to the actual native source; those warnings are retained pending device/runtime qualification rather than changing the package's platform-resolution behavior.

### Native checkout setup and checks

The user-selected native paths are recorded in [native host setup](native_host_setup.md). The Mac checkout was clean and fast-forwarded to `81196d4`; a Windows clone was created at the same base. Both switched to `development`. Since the foundation code is uncommitted in WSL, its first Git binary patch had SHA-256 `7e186e82e7ee1f0ba41d0c0ca47f1de6d93b9dea7b2b7039321ade14b5544fb2` and source-tree hash `7ea700eed97e7995137e9977fbf552d8987b200a`. Named subsequent corrections are reflected in each host's final ignored `.kairn/source-snapshot.json`. This is working-tree evidence, not a reviewed commit or completed Git synchronization workflow. No commits or pushes were made.

Node `26.13.0` and pnpm `12.16.1` are selected privately on each native OS. Windows additionally selects checksum-verified Temurin 17.0.20.1+1 and the existing Android SDK. Both native frozen installs passed using separate local stores/dependency directories. Their ignored activation files keep existing global defaults unchanged. The first Windows run exposed POSIX single quotes in Vite+ package filters; double-quoted filters now work through both cmd.exe and Unix shells. Doctor rejects a non-17 Android JDK and checks that the selected SDK directory exists.

Windows T3 successfully opened its native project using `t3 app`. A backed-up user-setting change adds the existing `mac-dev` SSH alias as its **Mac iOS** device host. Mac T3 already had device/agent access enabled. Mac desktop project activation over SSH was explicitly refused by the supported CLI; it was not bypassed.

The first Windows native build compiled Java/Kotlin and failed in Nitro's CMake build after 17 minutes: Ninja 1.10.2 treated an existing 293-character ReactAndroid prefab config path as missing. A second build with checksum-verified Ninja 1.13.2 still regenerated `build.ninja` 100 times because OS long-path support was disabled. After the user approved Windows UAC, `LongPathsEnabled` changed from 0 to 1; a dry run then stopped regenerating CMake inputs. The original Ninja and registry value are backed up under the private tools directory. Doctor and the native wrapper check both prerequisites; the checkout location is preserved. The third build passed C++ compilation but failed linking: CMake shortened the compiler name under the spaced SDK path, omitting libc++ from the link command. A space-free junction to the same SDK now preserves `clang++.exe`; a driver probe confirms libc++ is added, and regenerated native compiler metadata confirms libc++ linkage. That retry then exposed a separate CMake compiler-identification directory over 260 characters. Windows now selects the shorter ignored `.kairn/p` virtual store and 32-character directory limit through its activation file, keeping the isolated linker and frozen resolutions. Doctor/build reject a spaced selected SDK path. Earlier failures are not passing native evidence.

Coverage stays limited to mandatory compiler/export/native gates and one real host integration scenario, with no mocked native component suite or configuration-value test matrix. Final tooling lint/types, normalized mobile TS6 checking, formatting, and whitespace checks pass; the final source inventory verifies all 576 owned source files across the three hosts.

| Check | Executed result |
|---|---|
| `pnpm check` on WSL | Pass, including source boundaries, TS6/TS7 declaration consumers, separate mobile compiler, and Expo Doctor; new host helper also passes tooling lint/type checks |
| Required root type-failure gates | Pass; one temporary web error fails with TS7 `TS2322`, one temporary mobile error fails with TS6 `TS2322`; both fixtures removed; clean mobile type check passes afterward |
| Android/iOS production JS exports | Pass; both Metro/Hermes exports completed after the final SDK dependency selections |
| Windows and Mac `check:mobile` | Pass on their own dependency installs; 20/20 Expo Doctor checks on each |
| `pnpm check:mobile:host` on Windows | Pass again after the short dependency layout: private HTTPS status contract, Android dev bundle (6,910,070 bytes), and HMR WebSocket. The first cold request timed out while Metro initialized; the completed bundle and warm retry passed |
| `pnpm check:mobile:host` on Mac | Pass; real private HTTPS status contract, iOS dev bundle (6,896,679 bytes), and HMR WebSocket |
| Windows pinned prebuild | Pass; package/lock fingerprints unchanged |
| Windows APK / emulator installation | Pass; x86_64 debug APK assembled and `adb -e install -r` returned `Success`; 98,806,163 bytes, SHA-256 `a8655a9293b26f2a7609c2df83b2d781969193a3a7359fe2fce071a9f227f2cd`; lint passes with 0 errors / 31 warnings in the full 20m54s native run (930 executed tasks) |
| Mac pinned iOS prebuild | Pass; package/lock fingerprints unchanged |
| Mac native dependencies | Pass; initial 119-Pod resolution, reviewed owned lock snapshot, and subsequent `pod install --deployment` without lock drift |
| Mac simulator build | Matching iOS 26.5 runtime installed; mobile checks and locked Pod installation passed. Pass; generic compilation was intentionally stopped to avoid building both simulator architectures, then the equivalent x86_64 Xcode build completed with `BUILD SUCCEEDED` and the Pod lock unchanged |

Both native Metro servers remain running on their own loopback `8081` ports, with logs/PIDs under ignored `.kairn/`. The private API is `https://nishanth-windows.tail30fb6a.ts.net:8443`; Windows Tailscale Serve proxies the WSL-forwarded application port. The pre-existing T3 route on HTTPS 443 is preserved. Host API/WebSocket success is not an emulator/simulator request or visible Fast Refresh proof.

## Step 6 Mac native prerequisites — in progress

The inspected Intel Mac runs macOS 26.7.2 with CocoaPods 1.16.2. The user's reinstall supplied `/Applications/Xcode.app`: Xcode 26.5 (17F42), selected in the project shell through `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`, with iOS/Simulator SDK 26.5. No Xcode license or first-run prerequisite prevented Pod installation. The matching universal simulator runtime 23F77 is installed and registered; its earlier absence prevented `generic/platform=iOS Simulator` destination discovery.

The iOS wrapper performs pinned CNG, an explicit Pod-lock update workflow outside ignored native output, locked subsequent Pod installation, and an unsigned simulator build for the local Mac architecture with two Xcode jobs. Initial resolution and locked installation both passed. The reviewed owned snapshot has SHA-256 `08f7d47babd31b361ab39b95617dde4d50d3427ea2cc0c80fca567407522a41a` and preserves Expo 58.0.22, RN 0.88.1, Nitro 0.37.1, and Unistyles 3.7.0. The original generic compilation was intentionally stopped when it began building both simulator architectures. The wrapper now selects the local host architecture, and the equivalent x86_64 Xcode command resumed the same generated project, locked Pods, and DerivedData and passed with `BUILD SUCCEEDED`. The app is `.kairn/ios-build/Build/Products/Debug-iphonesimulator/KairnDev.app`, identifier `dev.kairn.app`, with x86_64 confirmed by `lipo`. The debug library SHA-256 is `e3569de5c9adf8a7ee8ad7de06cac2d0ad72f0308b5ae369c0bed465644e189c`. No simulator definitions existed, so one shutdown Kairn iPhone definition was prepared for iOS 26.5; installation awaits opening it in a native T3 session. No SSH device UI bypass was used. Personal Team login/pairing, iPhone/iPad installation, and physical-device API/reload/style checks remain pending; no EAS or paid Apple membership was added.

## Remaining native gates

Android's native/UI/API gates and Mac iOS simulator build/runtime checks passed in the later acceptance entries. The remaining platform work is separate Personal Team installation/status checks on the iPhone and iPad. The historical failures below explain the repairs and must not reopen completed Android, Xcode-selection, or simulator work.

## Native UI acceptance — 2 November 2026

This run used the shared uncommitted Windows checkout and the existing Mac checkout, without another checkout, delegates, commits, pushes, native rebuilds, or cloud services. All device actions used T3 and its returned device-bound CLI. Coverage stayed focused on the requested real acceptance journey; no mocked component tests or configuration matrix were added.

### iOS: blocked before simulator installation

T3 discovery confirmed the existing **Mac iOS** SSH host as `mac-ios`, but reported iOS unavailable. The actual host now returns `/Library/Developer/CommandLineTools` from `xcode-select -p`, because the earlier check inherited the project-local `DEVELOPER_DIR` override. `/Applications/Xcode.app/Contents/Developer` exists. Discovery's exact failure was:

```text
[apple-utils] Failed to run `xcrun simctl list devices --json`: Error: Command failed: xcrun simctl list devices --json xcrun: error: unable to find utility "simctl", not a developer tool or in PATH
```

Opening the supplied simulator `B2423D2D-A4D6-455E-B07F-742B6D513DE6` returned:

```text
No device B2423D2D-A4D6-455E-B07F-742B6D513DE6 on 'Mac iOS' (hostId mac-ios). Call device_list for current ids.
```

The advised `device_list` retry still could not discover iOS. The attempted noninteractive repair, `sudo -n /usr/bin/xcode-select --switch /Applications/Xcode.app/Contents/Developer`, returned `sudo: a password is required`. This device path was stopped, without a replacement connection or SSH UI bypass. A local Mac administrator must select full Xcode with `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`, then retry T3 discovery/open. Only after that should the existing `KairnDev.app` be installed and the iOS journey run. No iOS screenshot, installation, launch, API, reload, or layout pass is claimed. Mac Metro was verified still listening on `127.0.0.1:8081` (PID `82458`); no duplicate packager was started.

### Android: UI checks pass; private API DNS blocked

T3 discovered/opened `local / emulator-5554`, **Pixel_10**, Android 17.0. The first open failed with:

```text
android devices are unavailable on host local: Android emulator video needs working ffmpeg with the libx264 encoder. Install it on the device host's PATH or set SERVE_EMU_FFMPEG there, then retry opening the emulator. After changing PATH or SERVE_EMU_FFMPEG, turn device support off and on for SSH hosts, or restart the local environment server.
```

WinGet installed `Gyan.FFmpeg` `9.0.2`, verified the installer hash, and created its normal user PATH entries/aliases. `ffmpeg -hide_banner -encoders` reports `libx264` and `libx264rgb`. A hard link at `C:\Users\Nishanth Murugan\.t3\bin\ffmpeg.exe` exposes that installed executable through the existing T3 PATH without restarting the active environment. Its SHA-256 is `589e50b766d251afdf181dd664d40bd94407e200b019989fd7468c7d118a28d0`. The one advised device-open retry succeeded. WinGet's initial source lookup had returned `0x80071130 : Fast Cache data not found`; the subsequent installation succeeded.

The old Windows Expo process (`14744`, supervisor `30460`) had no listening socket on 8081. After verifying both commands belonged to this checkout, they were replaced by one hidden project Metro supervisor (`32636`, Expo child `21624`). No native build or host-integration suite was rerun. The already installed compiled APK was used.

| Acceptance | Actual result and evidence |
|---|---|
| Compiled app launch and style initialization | Pass. `dev.kairn.app` reaches **Service connection**, renders the Unistyles theme, and has no native/Unistyles error overlay. [Initial app screen](../../.kairn/acceptance-2026-11-02/android-service-connection.png); [final screen](../../.kairn/acceptance-2026-11-02/android-final.png). |
| Actual API response and Check again | Blocked. The accessible **Check service connection** button was pressed; it returns **No connection yet. / Could not reach the service. Check the connection and try again.** Temporary diagnostic logging captured `Error: fetch failed: java.net.UnknownHostException: Unable to resolve host "nishanth-windows.tail30fb6a.ts.net": No address associated with hostname`. The Windows host's concrete-failure diagnostic returned HTTPS 200 with `{"contractVersion":1,"syncProtocolVersion":1,"status":"ok"}` at the same origin; these values were **not** returned to the emulator or displayed as Connected. [Native error log](../../.kairn/acceptance-2026-11-02/android-network-diagnostic.txt). |
| Compact spacing | Pass. Pressing **Compact spacing** exposes `[selected]` and **Use comfortable spacing**. Card content's left edge changes from x=108 to x=76 in 1080-pixel captures (24 to 12 dp padding at density 2.625, including the border); the button widens and card shrinks. [Compact screen](../../.kairn/acceptance-2026-11-02/android-compact-fixed.png). |
| Visible Fast Refresh and restoration | Initially failed: the heading refreshed but compact state reset. After the source fix below, **Service connection refreshed** appeared without reload, with compact `[selected]`; restoring the exact pre-probe bytes in `finally` restored **Service connection** while retaining compact `[selected]`. [Changed heading](../../.kairn/acceptance-2026-11-02/android-refresh-fixed.png), [restored heading](../../.kairn/acceptance-2026-11-02/android-refresh-fixed-restored.png), and their same-named `.txt` accessibility records. No test heading remains. |
| Full app relaunch | Pass for launch/style initialization and automatic request attempt. The bound CLI's `open dev.kairn.app --relaunch` with the SDK 58 development URL reopened the app without onboarding/menu. Reconnection remains blocked by DNS. Local compact state correctly resets on a full process relaunch. [Loaded relaunch](../../.kairn/acceptance-2026-11-02/android-relaunch-loaded.png). |
| Landscape and safe areas | Pass for this emulator. The CLI reported rotation **unconfirmed**, but the resulting 2424×1080 screenshot and T3 screenshot inspection establish landscape rendering. The centered page fits; scrolling to the bottom exposes both controls above the gesture area. [Landscape](../../.kairn/acceptance-2026-11-02/android-landscape.png), [bottom](../../.kairn/acceptance-2026-11-02/android-landscape-bottom.png). Portrait was restored, then `orientation auto` reported **Rotation follows the device sensor**. Other notch/tablet/physical configurations remain untested. |
| Larger text | Pass for the exercised size. The bound CLI read the original category **large**, applied **accessibility-medium**, and relaunched the app. Text visibly grows and wraps; both controls remain usable, with no horizontal clipping. The original **large** category was restored and read back. [Larger text](../../.kairn/acceptance-2026-11-02/android-large-text.png), [bottom](../../.kairn/acceptance-2026-11-02/android-large-text-bottom.png). |
| System-bar contrast | Initial screenshots exposed white status text on the light background. The source fix below gives dark status text; T3 screenshot inspection and the [final screen](../../.kairn/acceptance-2026-11-02/android-final.png) confirm the correction. |

The exact SDK 58 URL used through the bound CLI was `kairn-dev://?__expo_url=http%3A%2F%2F10.0.2.2%3A8081&__expo_disable_onboarding=1&__expo_disable_fab=1&__expo_disable_auto_launch=1`. The first Windows batch invocation split its unquoted ampersands, producing `'__expo_disable_onboarding' is not recognized as an internal or external command` (and the equivalent errors for the other two flags). Passing literal double quotes around the URL corrected it; subsequent full relaunches had no menu. The first attempt to press the dev-menu Close group returned `Ref @e19 has no parent-owned touch point outside its interactive descendants` with the hint to tap its interactive child. A fresh unfiltered snapshot and a press on the Close button child succeeded. `help rotate` reported `rotate was renamed to orientation; for the two-finger gesture use: gesture rotate`; subsequent orientation commands used the supported name.

Android DNS resolution of the private MagicDNS hostname must be made available through the supported emulator/host configuration before retrying **Connected**, returned versions, and Check again. The bound CLI exposes no DNS control. No DNS setting, TLS bypass, substitute API origin, hosts-file edit, or shell UI workaround was applied. Metro also emits Unistyles package-export fallback warnings for native component subpaths; rendering, variants, and refresh worked, and the pinned dependency was preserved.

### Permanent changes and reconciliation

Only two application source files changed:

- `apps/mobile/src/screens/status-screen.tsx`: put variant selection in `selectDensityStyles`, retaining Unistyles variants and the existing state owner. Inspection of the installed Babel transform showed the original stateful component's Refresh signature referring to its generated local `_styles.useVariants`; this invalid custom-hook reference forced remounts. The helper keeps that generated variant scope out of the stateful component signature. Real device refresh now preserves compact state in both edit directions.
- `apps/mobile/src/app/_layout.tsx`: set the existing native Stack's `statusBarStyle` to `dark` for the selected light interface.

| File | Original SHA-256 (Windows and Mac) | Final SHA-256 (Windows and Mac) |
|---|---|---|
| `apps/mobile/src/screens/status-screen.tsx` | `984b65311ed2c68d4a9377de4aa6fdeb3127542d98c29a2798093c4ea5270046` | `5d7035dbc14f4d658a7aece356d57b38ae5166d9b455cf9dca0ff740405311b3` |
| `apps/mobile/src/app/_layout.tsx` | `1b0e6b05d799dbde9e44cd837fd39207a69d16b5630981a4579536640fcc2f8d` | `17f948b04a38f3c221a13c701cdbac5b7a77db7e6ad78197cf4230d6fc00d872` |

Both files were copied to the existing Mac checkout only after checking all original and incoming hashes, then verified after writing. Original bytes are backed up on each host under ignored `.kairn/acceptance-source-2026-11-02/`. Mac dependencies, generated native output, and Metro remain Mac-local. WSL was not changed and still needs the parent's guarded reconciliation; the original 576-file source inventory was retained rather than overwritten with a claim of three-host equality.

Temporary edits to `status-screen.tsx` and diagnostic logging in `system-query.ts` were restored with `finally` blocks. The latter's restored SHA-256 is `d0fa105e2dfbd1476be69b82e42b64e8dca5fffa800b6aa24515cd9e02c62a7f`. The original progress-document SHA-256 before this acceptance entry was `5c611a69ea899faeee57520914a41be1ff50af00064588f4a7c2c1d55c5a2c3d`; its original is also backed up in the ignored Windows handoff directory. This progress document is updated only in Windows.

Focused validation passed on both hosts: Vite+ formatting, the existing mobile-config Vite+ lint for the two changed files, and mobile TypeScript `tsc --noEmit`. Windows' first format check identified the edited screen and was corrected using Vite+. The first Mac check script carried a trailing Windows carriage return into `--noEmit`, producing `TS5025: Unknown compiler option '--noEmit\r'`; a corrected command passed, and the ignored helper script was normalized to LF. The progress Markdown is excluded by the existing formatter rules; an explicit formatting attempt reported `Expected at least one target file. All matched files may have been excluded by ignore rules.` No alternate formatter was added. Package manifests, `pnpm-lock.yaml`, the Babel config, and the owned iOS Pod lock match their original inventory blobs. A read-only audit of all 576 Windows source files found exactly the two application edits above and this progress-document update, with no extra source changes. The [handoff manifest](../../.kairn/acceptance-2026-11-02/changed-files.json) records original/final SHA-256 and Git blob hashes for all three files. `git diff --check` passes. No new dependency, patch, test runner, or native rebuild was needed for these JS-only fixes.

Remaining gates: restore Mac full-Xcode selection, open/install/run the existing iOS simulator app and its entire acceptance journey; resolve Android private-hostname DNS and prove actual Connected/version/refetch/relaunch success; separately complete Personal Team login, pairing/Developer Mode, real iPhone/iPad installation, physical-device Metro/API connectivity, safe areas, styles, orientation/larger text, and reload checks. No Apple credentials were requested and none of those physical/account gates passed in this run.


## Parent reconciliation and host prerequisites — 2 November 2026

The parent copied both accepted application fixes and this acceptance record from Windows into WSL only after verifying the handoff manifest's original/incoming SHA-256 values. The ignored evidence directory was copied as well. App sources now match the accepted bytes on WSL, Windows, and Mac; the earlier “WSL not changed” statement describes the delegate's handoff time.

**Xcode correction:** the previous “selected globally” claim came from checking `xcode-select` inside the project environment. The unsigned build used the valid full-Xcode override, while actual T3 discovery sees the system CommandLineTools selection. An administrator dialog attempt returned `The administrator username or password was incorrect. (-60007)`; the local administrator command remains pending. Doctor now checks `xcrun --find simctl` with `DEVELOPER_DIR` removed to expose this specific missing prerequisite. No simulator acceptance is claimed from the successful build.

**Android DNS follow-up:** a new T3-bound session could not acquire the device: `DEVICE_IN_USE` named prior session `t3-6adc2fbeef2e562cb199abc8`. The advised `--wait 5000` retry still failed, so device operations stopped without closing or reusing another session. Read-only investigation found the installed hub's supported `EXPO_DEVICE_HUB_EMULATOR_EXTRA_ARGS` launch hook and the candidate value `-dns-server 100.100.100.100`. Windows resolved the hostname through that resolver and still returned HTTPS 200 with contract/sync versions 1. The hook was not applied, the emulator was not restarted, and no fresh successful app request or screenshot exists. The original owner has been asked to release its own session before a fresh attempt. See ignored [DNS follow-up evidence](../../.kairn/acceptance-2026-11-02/android-dns-followup.md).

Coverage remains the existing real device acceptance journey plus the host doctor check for this observed Xcode failure. No additional test cases, mocked suites, dependency changes, or native rebuilds were added. `pnpm check:tooling` passed in WSL after the doctor change: Vite+ lint and both tooling/generator TypeScript checks, with no warnings or errors. The updated doctor was executed on the actual Mac: Node, pnpm, Vite+, Xcode, and CocoaPods passed, while **System simulator tools (T3)** correctly failed with `xcrun: error: unable to find utility "simctl", not a developer tool or in PATH` and exit 1. Evidence: ignored `.kairn/verification/mac-doctor-system-xcode.log`. Final source equality is recorded by the ignored per-host `.kairn/source-snapshot.json` inventories; baseline inventories are retained separately.

## iOS simulator follow-up — 2 November 2026, 11:09 UTC

**System Xcode selection resolved; simulator UI acceptance still blocked by T3 discovery.** The user completed the administrator command after the historical failures above. Fresh read-only SSH checks through the existing `mac-dev` alias, without `DEVELOPER_DIR`, return `/Applications/Xcode.app/Contents/Developer` and `/Applications/Xcode.app/Contents/Developer/usr/bin/simctl`. Mac `pnpm run doctor ios`, after `. .kairn/env.sh`, passes all checks including **System simulator tools (T3)**. Native discovery lists Kairn iPhone (`B2423D2D-A4D6-455E-B07F-742B6D513DE6`) in Shutdown state and iOS 26.5 universal runtime 23F77.

The requested Windows T3 SSH host `mac-ios` reports iOS unavailable with `iOS needs macOS with Xcode and working xcrun simctl.`; it lists Android `Pixel_8` only. Opening the exact requested simulator returned:

```text
No device B2423D2D-A4D6-455E-B07F-742B6D513DE6 on 'Mac iOS' (hostId mac-ios). Call device_list for current ids.
```

The advised `device_list(hostId="mac-ios")` retry still reports iOS unavailable and no requested simulator. Device operations stopped, as required, after that one advised retry. The existing Windows T3 settings still associate `mac-ios` with `mac-dev`; the cause of T3's discrepancy with fresh SSH/native discovery is not established. No replacement connection, host/tool restart, simulator boot through SDK/SSH, app UI bypass, or other session reuse/closure was attempted. Open attachments were empty; no bound session or attachment was created, so there was nothing owned by this run to release. No simulator shutdown was issued.

| Focused boundary | Result |
|---|---|
| System Xcode / Mac doctor | Pass, including simulator tools without a project override. |
| Existing compiled artifact | Inspected; `dev.kairn.app`, x86_64. Debug dylib SHA-256 `e3569de5c9adf8a7ee8ad7de06cac2d0ad72f0308b5ae369c0bed465644e189c`; Pod lock SHA-256 `08f7d47babd31b361ab39b95617dde4d50d3427ea2cc0c80fca567407522a41a`, both unchanged. No rebuild. |
| Mac Metro | Existing PID `82458` still listening at `127.0.0.1:8081`, running this checkout's Expo 58.0.22 CLI; left unchanged. |
| T3 simulator open and app installation | Blocked before installation by discovery failure above. |
| Visible Service connection / Unistyles initialization | Not observed on iOS. |
| Real API Connected / contract 1 / sync 1 and Check again | Not executed; host results do not satisfy device acceptance. |
| Compact variant / temporary heading Fast Refresh retaining state / exact restoration | Not executed. No source probe applied; accepted source bytes remain unchanged. |
| Full process relaunch with successful automatic request | Not executed. |
| Landscape / safe areas / larger text / original settings restored | Not executed. No device settings changed; restoration was unnecessary. |

The API remains `https://nishanth-windows.tail30fb6a.ts.net:8443` with normal TLS. No API URL, dependency, generated native output, source inventory baseline, or application source was changed. The three known mobile files match the supplied accepted hashes on Windows and Mac. Only this progress document and `native_host_setup.md` were edited; originals and final SHA-256 values are in the ignored [handoff manifest](../../.kairn/acceptance-2026-11-02/ios-followup/handoff-manifest.json). Parent reconciliation of WSL/native documentation and inventories remains pending.

Coverage was limited to the observed host prerequisite failure, existing artifact inspection, and the required T3 discovery/open attempt. No mocked tests, broad suites, repeated Android acceptance, or new native builds were run. `git diff --check` passes. New ignored [evidence](../../.kairn/acceptance-2026-11-02/ios-followup/) contains discovery responses, Mac inspection, and the exact blocker/restoration record; no fresh screenshots/accessibility snapshot could be obtained. The inspection wrapper returned exit 127 after all intended checks because PowerShell's piped stdin added a final carriage-return-only line; the log records this wrapper failure separately from the successful doctor and read-only commands.

Outstanding: restore T3 visibility/opening for the existing `mac-ios` simulator, then complete the entire focused iOS journey above. Physical iPhone/iPad, Personal Team, pairing/Developer Mode, physical-device Metro/API, and associated device UI acceptance remain separate and unpassed. Android remains outside this run, blocked by the previously documented DNS/session ownership issue.


Parent follow-up: accepted both documentation updates into WSL using the handoff's original/final SHA-256 guards, copied the ignored evidence, and synchronized those documents to Mac with the same guards. Read-only inspection confirms the existing SSH alias reaches Darwin and Mac hub PID `45545` runs expo-device-hub 0.19.1. This proves a Mac-local hub exists, not that T3's failed capability discovery has refreshed. No process, device session, or simulator was stopped. The user was asked to refresh device support for the existing **Mac iOS** SSH host in Windows T3's Settings → Integrations → Devices, because this thread exposes discovery/open/close tools but no host-integration restart tool. The exact cause remains unproved; no fresh UI attempt will be made until integration state changes. Documentation whitespace checks pass; no tests or rebuilds are warranted for these evidence-only updates.

## Running-simulator iOS retry — 2 November 2026, 11:33 UTC

**T3 discovered the booted simulator; opening still failed before installation.** The user explicitly authorized another attempt after starting the simulator locally. The existing Windows T3 SSH host `mac-ios` initially returned:

```text
Device list failed: Could not communicate with device support. Try refreshing devices.
```

That response reported iOS available, hub 0.19.1 running, no devices, and no open attachments. Following its advice once, `device_list(hostId="mac-ios")` succeeded: host ready; **Kairn iPhone**, `B2423D2D-A4D6-455E-B07F-742B6D513DE6`, iOS 26.5, booted. `device_open` with those exact ids then returned the same communication error above. Device work stopped after the recurrence. No bound session/CLI or successful panel attachment was acquired, so no owned session required release; no other session was reused or closed. No simulator shutdown occurred. The cause of this communication failure remains unproved, and no claim is made that the user refreshed host support.

| Focused boundary | Actual result |
|---|---|
| Fresh T3 discovery | Pass after one advised refresh; exact simulator listed as booted. |
| Bound T3 open / existing app installation | Blocked by device-support communication; installation not attempted. |
| Visible Service connection / Unistyles initialization | Not observed on iOS. |
| Actual HTTPS Connected / contract 1 / sync 1 / Check again | Not executed; no host result substitutes for device success. |
| Compact variant / one heading Fast Refresh retaining state / exact restoration | Not executed. No temporary source edit applied. |
| Process relaunch with successful automatic request | Not executed. |
| Landscape / safe areas / larger text / settings restoration | Not executed. No device setting changed; restoration unnecessary. |

No application source, dependency pin, Pod lock, generated native output, API origin, Metro process, simulator setting, host configuration, or connection was changed. The existing compiled artifact was not rebuilt, installed, or freshly re-inspected. Native prerequisite diagnosis was not repeated. The API remains `https://nishanth-windows.tail30fb6a.ts.net:8443` with normal TLS. Physical iPhone/iPad, Personal Team, pairing/Developer Mode, and physical-device networking remain separate unpassed gates; Android was outside this retry.

Only Windows `native_host_setup.md` and this progress document were updated. The three accepted mobile files retain their supplied SHA-256 values on Windows. Original document bytes, exact T3 responses, restoration/ownership record, and original/final SHA-256 handoff are retained under ignored [running-simulator retry evidence](../../.kairn/acceptance-2026-11-02/ios-running-retry/); previous evidence remains intact. WSL/Mac documentation reconciliation belongs to the parent. Coverage was the required T3 discovery/open boundary only: no mocked suites, repeated Android tests, new native builds, or unnecessary toolchain checks. `git diff --check` and a comparison of the document updates against their saved originals verify these evidence-only edits; no application tests are warranted.

## Windows Android DNS repair preparation — 2 November 2026, 12:12 UTC

**Supported launch configuration prepared; running hub/emulator unchanged; Android API acceptance remains open.** This task used only the shared Windows checkout and made no Mac contact. Fresh `device_list(local)` and `device_open(local, emulator-5554)` succeeded. The new bound CLI opened `dev.kairn.app` without `DEVICE_IN_USE`; a T3 screenshot showed Service connection with the existing failed-connection message. The earlier lease failure is historical, not this run's blocker.

The installed hub supports `EXPO_DEVICE_HUB_EMULATOR_EXTRA_ARGS=-dns-server 100.100.100.100`. Read-only inspection confirmed T3's local hub inherits its backend's process environment, with no per-host environment setting. T3's official desktop documentation describes launching the actual executable from the environment-bearing shell; its device documentation requires restarting the local environment server for environment changes. No available supported tool can replace this active desktop environment. Stopping the main T3 environment or injecting environment/code into its running process was outside scope and was not attempted.

The ignored `.kairn/start-t3-android-dns.ps1` now implements a process-scoped launch path for the existing packaged desktop executable, preserving unrelated emulator arguments and refusing a conflicting DNS setting or an already-running T3 instance. It makes no user/machine environment or Windows DNS/routing change. Original environment observations (all three scopes absent), the unchanged Start menu shortcut, document bytes, and Metro PID/logs were retained. Syntax and inspect-only DNS/rollback plans passed; executing against this still-running T3 correctly refused without stopping or launching anything. Actual inheritance requires the user's normal quit and one exact prepared launcher command, documented in [native host setup](native_host_setup.md#windows-android-dns-repair-preparation--2-november-2026-1212-utc). `-OriginalDns` launches with the saved absent override for rollback; subsequent emulator stop/start must use T3 controls.

| Mandatory boundary | Actual result |
|---|---|
| Fresh owned T3 device access | Pass; bound app open and T3 screenshot succeeded. No foreign session was reused or closed. |
| Host MagicDNS / unchanged private HTTPS | Pass at 12:12 UTC: resolver 100.100.100.100 returned 100.110.113.52; HTTPS `/api/v1/system` returned 200 with contract 1 / sync 1 under normal TLS. Host-only evidence. |
| Scoped launcher preparation / safeguards | Pass for syntax, inspect-only plan, original-value rollback plan, and refusal over the existing desktop process. Desktop was not relaunched. |
| Hub environment / emulator DNS launch args | Pending normal desktop quit/relaunch; current emulator process arguments still have no `-dns-server`. No T3-controlled emulator restart occurred. |
| App Connected / contract 1 / sync 1 | Unpassed; fresh pre-repair screen shows failure. |
| Check service connection completes a new successful response | Unpassed; no fresh successful request evidence exists. |
| Full app process relaunch performs successful automatic request | Unpassed; not attempted as a post-repair assertion because the repair has not reached the hub. |
| Metro readiness | Replacement returns real HTTP 200 / `packager-status:running`; one checkout-owned supervisor remains. |

Metro replacement limitation: socket enumeration reported no listener for verified old wrapper/Expo PIDs 32636/21624, although established connections remained. They were stopped before corroborating staleness with HTTP. Windows also reports the replacement's healthy listener inconsistently, so the original process's staleness was not proved. The new hidden supervisor is 26980 (Node wrapper 32360, Expo 31228), with pinned tools activated and the existing command `node scripts/mobile.mjs start --host localhost --port 8081`; `.kairn/metro.pid` was updated. Future checks must probe HTTP before replacing Metro. Original logs/PID bytes remain backed up; new logs are under the evidence directory. No dependency resolution, build, or source change accompanied this replacement.

Coverage was limited to the actual host configuration boundary, fresh device access/failed-state inspection, launcher safeguards, DNS/TLS, Metro HTTP readiness, source/hash reconciliation, and document whitespace. The earlier layout/Unistyles/Fast Refresh/orientation/larger-text checks were not rerun. No mocked success, extra test matrix, API substitution, TLS exception, new dependency, native rebuild, Git write, vendor patch, T3 database edit, adapter/route/hosts change, or emulator shell boot/UI workaround occurred. The API remains exactly `https://nishanth-windows.tail30fb6a.ts.net:8443`. The three accepted mobile source hashes remain unchanged. Original/final document and unchanged-source SHA-256 values, installed-tool excerpts, prepared launch/rollback configuration, screenshot, host responses, and next acceptance steps are retained under ignored [Android DNS repair evidence](../../.kairn/acceptance-2026-11-02/android-dns-repair/).

The owned bound session and panel attachment are released with no shutdown, leaving Pixel_10 running. DNS fix and the three successful app-request assertions must not be marked passed until the next Windows session has inherited the prepared value, T3 has restarted the emulator, resulting args are inspected, and fresh request evidence is captured. Parent reconciliation of WSL documents/inventories remains pending; no Mac operations belong to this task.

## Windows Android DNS validation follow-up — 2 November 2026, 12:31 UTC

**The supported DNS arguments reached the restarted emulator; actual application API acceptance is still incomplete.** The parent-reviewed launcher receipt records the user's desktop launch at 12:22:51 UTC (PID 28228). Fresh T3 local discovery/open succeeded without a lease conflict. This run used `device_close(shutdown:true)` on its own attachment, rediscovered the shutdown `Pixel_10` AVD, and booted it using `device_open`. New emulator/QEMU PIDs 16616/11964 both have the literal argument pair `-dns-server 100.100.100.100`. The prior PIDs 11664/19488 had no DNS override. This is concrete inheritance/application evidence for the launch setting, without claiming a successful API request.

| Remaining boundary | Executed result |
|---|---|
| Process-scoped DNS applied after T3-controlled emulator restart | Pass; both emulator and QEMU command lines saved in `process-after.json` and `process-final.json`. |
| Existing Metro actual HTTP readiness | Pass; HTTP 200 / `packager-status:running`. The first PowerShell probe failed locally without `-UseBasicParsing`; the corrected probe succeeded. No Metro replacement or duplicate was started. |
| Bound SDK 58 dev-client open | Open command succeeded with the quoted original URL and all three suppression flags; native app PID 1833 started. Loading did not reach the app's Service connection screen. |
| App Connected / contract 1 / sync 1 | Unpassed; T3 screenshot showed development-client `ConnectException` to `10.0.2.2:8081` / `ENETUNREACH`, covered by a System UI unresponsive dialog. |
| Completed new successful manual refetch | Unpassed; the API control was never reached. No cached Query result was accepted as evidence. |
| Full process relaunch and automatic successful API request | Unpassed; no completed post-relaunch API request was observed. |
| Owned cleanup | Pass; bound CLI close released this run's session, then its Device attachment was removed with `shutdown:false`. Emulator remains running. |

The first app launch preceded the Wi-Fi/cellular connection creation timestamps in read-only native connectivity evidence, so boot timing may explain the Metro failure; no recovery was proved. The System UI snapshot exposed Wait as `@e2`. An unquoted PowerShell ref caused `Error (INVALID_ARGS): Missing target. Pass an @ref from snapshot, a selector like text="Sign in", or "x y" coordinates.` A subsequent successful app open invalidated that snapshot. Command help was read, then the quoted press returned `Error (COMMAND_FAILED): Ref @e2 belongs to an expired ref frame — a device action since the snapshot invalidated it`. A new snapshot still showed the dialog. Per the explicit stop-after-failed-retry instruction, validation stopped; this was a control/argument error rather than a proved remaining DNS/TLS failure. No success screenshot, successful request log, or Connected assertion exists for this run.

The current emulator retains the DNS override. Future emulator launches inherit it only from the prepared environment-bearing desktop/hub; the user/machine environment and shortcuts remain unchanged. No second restart test was run. Rollback is a normal desktop quit, the existing launcher with `-OriginalDns`, then a T3-controlled emulator restart and argument verification. The parent's current launcher hash remains `0e976e3fae69905c804047b7628521fd2e3fbed40becc652dc8533023c0bc687`; historical manifests were not used to overwrite it. No T3 main-process termination, foreign session closure, SDK boot/UI shortcut, vendor/database patch, adapter/route/hosts change, native rebuild, new dependency, or API/TLS substitution occurred.

Only Windows `native_host_setup.md` and this document were changed. The three accepted application files retain their supplied SHA-256 values; no temporary source logging was applied. The unchanged private origin is `https://nishanth-windows.tail30fb6a.ts.net:8443` with normal TLS. Existing Metro PIDs 26980/32360/31228 were retained. Original document/source bytes, exact control errors and cleanup, process proof, native diagnosis, HTTP readiness, and original/final hashes are under ignored [DNS validation evidence](../../.kairn/acceptance-2026-11-02/android-dns-validation/). The 576-file baseline inventory remains unchanged; the parent must reconcile the two document updates into WSL. No Mac contact/sync occurred.

Coverage stayed at the requested real device boundary and read-only host diagnostics. Passed layout/Unistyles/Fast Refresh/orientation/larger-text gates were not repeated. No mocked/broad tests were added or run. Source inventory comparison and `git diff --check` qualify the evidence-only changes. The next device attempt must take a fresh snapshot immediately before each quoted ref interaction and still prove all three HTTPS gates; the repair is not complete.


Parent network follow-up: read-only diagnostics from the running emulator now resolve `nishanth-windows.tail30fb6a.ts.net` to `100.110.113.52` and receive one ping reply (0% loss, 2.817 ms). This proves guest DNS resolution and IP reachability after the override, while all three actual application HTTPS gates remain unpassed. Windows Metro still returns HTTP 200. A guest raw TCP diagnostic reaches Metro and receives HTTP 400; it does not prove a successful bundle request. A subsequent raw probe stalled and only its owned diagnostic adb client was stopped. No device UI operation or other process change was performed. The user was asked to dismiss the System UI dialog (or report it already absent) before fresh app validation. Evidence: ignored `android-dns-validation/parent-network-diagnosis.json`. Parent reconciled the latest documents into WSL with SHA-256 guards; macOS remains untouched.


## Windows Android reopen validation - 2 November 2026, 12:40-12:45 UTC

**Emulator reopened in T3; actual request acceptance remains incomplete because System UI blocks supported input.** The user explicitly requested a fresh attempt after reporting that the emulator had closed. Fresh local discovery instead found Pixel_10 already booted as emulator-5554 with no panel attached. T3 device_open attached it visibly and returned this run's bound CLI. Metro's actual /status returned HTTP 200 / packager-status:running at 12:40:19 UTC; existing PIDs 26980/32360/31228 were retained. The existing emulator/QEMU PIDs 16616/11964 still had -dns-server 100.100.100.100. No DNS repair or desktop restart was needed.

The bound CLI opened dev.kairn.app using the literally quoted SDK 58 URL and all three onboarding/menu/Tools suppression flags. A T3 screenshot showed Connected / Contract 1 / Sync protocol 1 behind a persistent System UI isn't responding dialog. A fresh snapshot exposed Wait as @e2; the correctly quoted press returned: `Error (COMMAND_FAILED): Android system dialog is blocking press: Application Not Responding: com.android.systemui (package com.android.systemui).` Its hint advised recovery, dialog closure, app restart, or emulator reboot before retrying. This is a different failure from the earlier unquoted/expired-ref errors.

Following that advice once, this run released only its own input session, shut down its own T3 attachment, discovered the stopped AVD as Pixel_10, and opened that actual AVD id through T3. New emulator/QEMU PIDs 17976/31772 both retain the DNS override. Boot-completed was 1 and native connectivity reported connected Wi-Fi/cellular before app loading. After allowing the host checks/read-only inspection to run, the newly returned bound CLI performed a full --relaunch with the unchanged SDK 58 URL. Open succeeded at 12:42:46 UTC; native ReactNativeJS main ran in PID 6634 at guest 18:12:48.874 (12:42:48.874 UTC), compared with initial PID 1833. A fresh snapshot still exposed the same system dialog. The correctly quoted Wait retry at 12:42:55 UTC returned the exact same COMMAND_FAILED error. Device interaction stopped under the explicit one-retry rule; no SDK/shell UI or boot bypass was used.

| Requested gate | Observed result |
|---|---|
| Actual app Connected / contract 1 / sync 1 | Visible behind the blocking dialog, including after relaunch; no independently timestamped completed HTTPS response was captured. Full gate remains unpassed. |
| Completed fresh successful Check service connection request | Unpassed; the system overlay prevented access to the control. No completed manual request evidence exists. |
| Full process relaunch followed by successful automatic request | Process relaunch observed; completed successful request not independently captured. Full gate remains unpassed. |

Read-only T3 screenshot system-ui-blocker.png records the actual blocked Connected screen, not an unobstructed acceptance screenshot. Native logs and timestamped CLI request diagnostics record app/control activity only; they are not successful API request timestamps. No host response, guest ping, or cached UI is promoted to completed HTTPS evidence. API origin remains https://nishanth-windows.tail30fb6a.ts.net:8443 with normal TLS.

Final bound CLI close succeeded, releasing only session t3-70f8a3a6a22fd9dcfc0b70dd. Final T3 discovery confirms Pixel_10 booted and its Device panel still attached for the user. There was no final device_close or shutdown. Close also terminates the session app; it does not resolve the System UI fault. No foreign session was reused/closed. No temporary source probe, source/dependency/native-build change, preference change, Metro replacement, API substitution, TLS bypass, host DNS/route/hosts change, Git write, WSL sync, or Mac contact occurred. The three accepted source hashes and parent-reviewed launcher hash remain unchanged; no source restoration was needed.

Evidence, original document/source bytes, exact diagnostics, native logs, process arguments, screenshot hash, session release, original/final SHA-256 handoff, and rollback instructions are in ignored [Android reopen validation](../../.kairn/acceptance-2026-11-02/android-reopen-validation/). The source snapshot/inventory remains intact; parent reconciliation of these two Windows document updates into WSL is pending. Coverage was the requested real T3/app boundary, native boot/network/process inspection, source inventory/hash guards, and documentation whitespace. No broad tests, repeated styling/refresh/orientation/text checks, or rebuild was warranted. A future authorized acceptance attempt requires recovery of the Android System UI/input boundary before the fresh request gates can be completed.

## Windows Android final API validation - 2 November 2026, 12:54-13:00 UTC

**System UI input recovered; the three successful API gates remain unpassed because the app cannot resolve the API hostname.** Fresh T3 discovery/open attached the already booted Pixel_10 through this run's own bound session. Corrected literal URL quoting preserved all SDK 58 onboarding/menu/Tools suppression flags. Supported Check service connection presses succeeded from fresh snapshots. Actual unobstructed screens show No connection yet / Could not reach the service, without the ANR dialog.

A single temporary development-only diagnostic, restored from saved original bytes in finally at 12:58:26.903 UTC, recorded `java.net.UnknownHostException: Unable to resolve host "nishanth-windows.tail30fb6a.ts.net": No address associated with hostname`. Native request/failure timestamps are 12:57:48.135/12:57:48.245 UTC and, after full bound process relaunch, 12:58:15.377/12:58:15.844 UTC. Host press markers and guest diagnostic clocks differ; no exact clock synchronization is claimed. Relaunch changed native PID 3825 to 5117 and logged fresh Running main before the automatic failed request. No HTTP response or schema-validated success was received. Thus Connected/contract 1/sync 1, successful NEW manual refetch, and successful automatic request after fresh in-memory QueryClient initialization all remain unpassed. No additional test matrix is needed to establish these failures.

Read-only process inspection found current emulator/QEMU PIDs 27432/9572, both without the DNS override; historical 17976/31772 are absent. This contradicts the supplied handoff state, without proving how it changed. This run did not restart/reconfigure the emulator or T3 and performed no DNS repair. Existing Metro 26980/32360/31228 was retained and real /status returned 200. Host normal-TLS HTTPS returned 200 with contract/sync 1, which is not device evidence. API remains exactly https://nishanth-windows.tail30fb6a.ts.net:8443, with no bypass or substitution.

The temporary system-query probe is restored to SHA-256 d0fa105e2dfbd1476be69b82e42b64e8dca5fffa800b6aa24515cd9e02c62a7f. All three accepted mobile sources and the reviewed DNS launcher retain their exact supplied hashes. No settings changed. Bound close released only session t3-8359139664d3ba7834d55eae; final T3 discovery confirms Pixel_10 booted and Device panel attached. Final inspected foreground remains Kairn's Service connection failure screen. No panel detach, shutdown, foreign session, Mac operation, WSL synchronization, build, dependency change, broad test, or repeated passed UI check occurred.

Coverage was the small real app request/relaunch boundary, one guarded diagnostic with exact restoration, native PID/log evidence, retained host process/HTTP readiness, source inventory/hash guards, and document whitespace. Only these two Windows implementation documents changed outside ignored evidence. Original bytes, failure screenshots manual-result.png/relaunch-result.png, exact diagnostics and timestamps, probe restoration, source audit, original/final SHA-256 handoff, and rollback are under ignored [Android final API validation](../../.kairn/acceptance-2026-11-02/android-final-api-validation/). There is no success screenshot. Parent reconciles WSL; the baseline inventory stays unchanged. Remaining work is a supported DNS launch-state recovery and the same three app API gates. Source/preference rollback is complete or unnecessary; document rollback must first guard final hashes and later edits. The existing -OriginalDns desktop-launch/T3-controlled emulator rollback remains documented and was not executed.

## Windows Android DNS restoration — 2 November 2026, 13:03–13:10 UTC

**Current DNS launch state is repaired and guest resolution works; full API acceptance remains incomplete due to renewed System UI ANR.** This run used T3 controls to shut down emulator-5554, discover stopped Pixel_10, and boot that actual AVD. Before-state emulator/QEMU 27432/9572 lacked the override. Current emulator 12744 (parent hub 21108) and QEMU 13020 both have `-dns-server 100.100.100.100`. These actual new process arguments prove current hub inheritance; the old desktop-launch receipt is historical evidence only. No additional desktop restart, persistent user variable, vendor/database patch, or broad network change was needed.

The first network diagnostic preceded Android connectivity-service readiness and failed. Before app loading, subsequent read-only diagnostics proved boot-completed 1, active connected Wi-Fi, private-hostname resolution to 100.110.113.52, and one ping reply / 0% loss. Metro's real HTTP /status returned 200 / packager-status:running; existing PIDs 26980/32360/31228 were retained. No native rebuild/install or package change occurred. Current Android DNS-option documentation was fetched through Context7 and retained with evidence.

Bound app open with the literally quoted SDK 58 URL and all suppression flags succeeded, but System UI ANR reappeared. A fresh snapshot immediately preceded the quoted Close app press. It returned `Error (COMMAND_FAILED): Android system dialog is blocking press: Application Not Responding: com.android.systemui (package com.android.systemui).` The hint advised waiting, closing the dialog, restarting the app, or rebooting. One advised bound full app relaunch succeeded; native logs show PID 2733 killed, PID 4063 started, and fresh Running main at guest 18:38:19.513 (13:08:19.513 UTC). A new snapshot and recovery-button press returned the same error. Further input attempts stopped under the required one-retry rule; no SDK/adb/shell UI or boot bypass occurred.

| Actual gate | Final result |
|---|---|
| Connected / Contract 1 / Sync protocol 1 | Visible behind the ANR after process relaunch; full gate incomplete without unobstructed acceptance and separately timestamped response evidence. |
| Completed NEW successful manual Check service connection / Check again | Unpassed: overlay blocked service control; no manual request success captured. |
| Full process relaunch then successful automatic request | PID change and native main proved; Connected visible afterward, but independently timestamped response not captured. Full gate incomplete. |

The API remains exactly `https://nishanth-windows.tail30fb6a.ts.net:8443`, normal TLS. Screenshot `system-ui-blocker.png` records actual Connected UI behind the ANR and is not an unobstructed success screenshot. No query diagnostic/source edit was made once supported input remained blocked; original/final source hashes match, with no restoration required. Host or guest network diagnostics do not substitute for the outstanding request evidence.

For future boots use this configured T3 environment's Device controls. After normally quitting Windows T3, launch it with `.kairn/start-t3-android-dns.ps1`, then boot the stopped AVD through T3 and inspect actual arguments. An ordinary Android Studio/SDK emulator start can omit the option; attaching through T3 afterward does not retrofit it. The process-only launcher remains at reviewed SHA-256 `0e976e3fae69905c804047b7628521fd2e3fbed40becc652dc8533023c0bc687`. No restart-persistence claim is based solely on the old receipt. Rollback: normal quit, launcher `-OriginalDns`, then T3-controlled emulator restart and argument inspection. No persistent setting needs removal.

Own bound `close` succeeded for session `t3-f23c2239b7c48d1ca8168e8b`; final discovery confirms emulator running and panel attached. No foreign session or final panel detach was used. Focused coverage was actual launch-configuration repair, guest DNS, retained Metro HTTP readiness, app/relaunch/input attempts, screenshot/native evidence, source/hash audit, and documentation whitespace. No broad suite or repeated style/refresh/orientation/text matrix was warranted. Only these two Windows documents changed outside ignored evidence. Original bytes, exact diagnostics, before/after process arguments, DNS response, no-probe restoration record, source audit, original/final SHA-256 handoff, and rollback are in ignored [Android DNS restored validation](../../.kairn/acceptance-2026-11-02/android-dns-restored-validation/). Parent reconciles WSL; no Mac contact, delegation, new thread, Git write, or source-inventory rewrite occurred. The remaining blocker is System UI ANR and supported input refusal, not the previously missing emulator DNS argument.


Parent System UI diagnosis: read-only `dumpsys activity lastanr` reports no ANR since boot; guest available RAM is about 2.1 GiB and Windows free RAM about 3.1 GiB. The AVD had Quick Boot forced on. A restored bad snapshot is a hypothesis, not an established cause. Prepared the reversible, Pixel_10-only boot configuration `fastboot.forceColdBoot=yes` / `fastboot.forceFastBoot=no`, retaining original full bytes and SHA-256 guards under ignored `system-ui-diagnosis/`. No emulator restart, user-data wipe, RAM/graphics change, app edit, or DNS change was performed by this parent step. The next T3-controlled start is required to test it; existing DNS args must be verified again. Rollback helper: ignored `.kairn/restore-android-quick-boot.ps1`, which refuses to overwrite later AVD edits. The device input path remains stopped after the failed advised recovery. [Android snapshot recovery guidance](https://developer.android.com/studio/run/emulator-snapshots).

## Windows Android cold-boot acceptance - 2 November 2026, 13:33-13:40 UTC

**All three focused Android API gates passed.** After the user manually stopped Pixel_10, Windows T3 discovered the stopped AVD and booted it into emulator-5554. Pre-boot config exactly matched the parent-prepared SHA-256 800f2d2df590b302cc1aaa88d2faa35a85ec0986756d24803eb4080afe153fe1 (`fastboot.forceColdBoot=yes`, `fastboot.forceFastBoot=no`); no overwrite was needed. Generated hardware configuration reported `fastboot.forceColdBoot = true`, and fresh guest uptime corroborated cold startup. Current emulator 24096 / QEMU 7276 both carry `-dns-server 100.100.100.100`, inherited from existing hub 21108. Final config and process args retain those settings. Historical receipts are not the proof.

Boot-completed and active Wi-Fi were awaited before app loading. Early boot DNS failures were transient observations; the ready guest resolved the private hostname to 100.110.113.52 and pinged successfully. Existing Metro 26980/32360/31228 remained healthy by actual HTTP /status 200 / packager-status:running and was retained. The existing compiled APK was used. API remains exactly `https://nishanth-windows.tail30fb6a.ts.net:8443`, with normal TLS and no mock or address substitution. Bound launch retained all SDK 58 onboarding/menu/Tools suppression flags and literal URL quoting.

| Mandatory gate | Actual result |
|---|---|
| Real HTTPS Connected / Contract 1 / Sync protocol 1 | Passed: unobstructed initial and final T3 screens. The temporary diagnostic also recorded automatic schema-validated success at 13:38:11.102 UTC. |
| Completed NEW successful manual Check service connection / Check again | Passed: fresh snapshot immediately preceded supported literal @e9 press. New request started 13:38:12.350 UTC and completed schema validation 13:38:12.481 UTC, contract/sync 1; raw native logs and manual-success.png retained. |
| Full APP PROCESS relaunch followed by successful automatic request after exact source restoration | Passed: finally restored original query bytes at 13:38:14.7265112 UTC. Bound relaunch killed PID 4530, started 4822, and logged fresh Running main at 13:38:47.678 UTC. New in-memory QueryClient plus restored-relaunch-success.png / snapshot show actual Connected / contract 1 / sync 1 without a manual press, verified by 13:38:51.7957899 UTC. No separately instrumented exact response timestamp is claimed for the restored run. |

Cold boot avoided the historical System UI/input blocker in this attempt; final read-only lastanr reports no ANR since boot. This is an observed recovery, not proof that a bad Quick Boot snapshot caused earlier failures. One early screenshot-tool failure recovered after its advised device_list and one screenshot retry. The first probe's successful but empty startup snapshot caused no press and exact finally restoration; a fresh tree was then healthy, and supported wait-for-Connected preceded the completed diagnostic run. No unchanged restart loop, user-data wipe, RAM/graphics/system-image change or UI bypass was used.

The temporary development-only query log is fully removed; query SHA-256 remains d0fa105e2dfbd1476be69b82e42b64e8dca5fffa800b6aa24515cd9e02c62a7f, status-screen 5d7035dbc14f4d658a7aece356d57b38ae5166d9b455cf9dca0ff740405311b3, layout 17f948b04a38f3c221a13c701cdbac5b7a77db7e6ad78197cf4230d6fc00d872. No dependency/build or broad suite was needed. Coverage was the real request/manual-refetch/restored-process boundary, current boot/DNS arguments, guest/Metro readiness, screenshots/native logs, guarded restoration, source inventory and document whitespace. Passed style/refresh/orientation/font checks were not repeated.

Continue starting the stopped AVD with configured Windows T3 Device controls, verifying actual DNS args. After normal desktop quit, use ignored `.kairn/start-t3-android-dns.ps1`; its reviewed SHA-256 remains 0e976e3fae69905c804047b7628521fd2e3fbed40becc652dc8533023c0bc687. DNS rollback is normal quit, launcher `-OriginalDns`, then a T3-controlled emulator restart and process-argument inspection. Cold-boot rollback is `.kairn/restore-android-quick-boot.ps1`, which guards current full config before restoring original e825a58beeed400c3ffe168f9a2a22b475c7c2fac1a1224864a44db648a4d483 bytes retained under system-ui-diagnosis; a later T3 restart applies them. Neither rollback was executed during this successful acceptance.

Own bound close released only session t3-31e4a412d2d3d04c91c0e4ad and closed its app. Final T3 discovery confirms emulator-5554 remains running with this thread's Device panel attached. No panel detach/shutdown, foreign session, Mac contact, delegation, new thread, Git write or WSL reconciliation occurred. Only these two Windows implementation documents changed outside ignored evidence; parent owns WSL reconciliation. Original/final SHA-256 handoff, saved bytes, success screenshots, exact request/process timestamps, transient observations, restoration, both rollback paths and final device state are under ignored [Android cold-boot validation](../../.kairn/acceptance-2026-11-02/android-cold-boot-validation/). All three Android DNS/API gates are closed; other platform/device requirements retain their existing scope.
