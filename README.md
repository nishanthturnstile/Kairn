# Kairn

Shared journey capture, composition, and reading. Start with the [documentation map](docs/README.md).

Repository setup follows the [setup plan](docs/implementation/repository_setup_plan.md#9-implementation-sequence-and-acceptance-gates). Toolchain, shared packages, generated contracts, composed services, and Android native/UI/API acceptance have passed their recorded checks. The iOS simulator build and runtime checks are recorded separately from Personal Team iPhone/iPad acceptance and actual hosted CI results in the [current checkpoint](docs/implementation/repository_setup_progress.md#current-checkpoint).

Windows Android and Mac iOS checkouts now have separate local tools, dependencies, and Metro. See [native host setup](docs/implementation/native_host_setup.md) for your paths, environment activation, build commands, source synchronization, and pending Xcode/device gates. `check:mobile`, `build:mobile`, `verify:android`, `prebuild:ios`, `ios:pods:update`, `build:ios:simulator`, and `verify:ios` build shared prerequisites. `check:mobile:host` checks the real API and running host Metro; it does not establish device acceptance.

`pnpm build` builds every JavaScript application and both mobile exports without a native SDK. On WSL/Linux, `pnpm verify` validates Compose, builds frozen tooling, runs checks/tests/exports, qualifies final images, and exercises real HTTP, queue, and storage boundaries in isolated projects. It retains logs, exports, manifests, and generated-input comparisons under ignored `.kairn/verification/`. Container build contexts exclude `.kairn/` and host mobile exports.

`pnpm dev:android` and `pnpm dev:ios` are human-invoked local build/install/Metro commands for the Windows and Mac checkouts respectively; pass Expo CLI options such as `--device` when needed. Do not start them over an existing Metro process. Agents use T3's bound device command for launches and UI checks. `pnpm verify:ios` records native build inputs/results but deliberately leaves runtime and physical-device evidence separate. `pnpm start:worker` starts the compiled worker with its runtime database URL.

The [repository setup workflow](.github/workflows/repository-setup.yml) runs Quality and Android on pull requests, `main`, and `development`. Its final `Repository setup required` status succeeds only when both jobs pass. All three checks passed on `58d258c`; `main` requires that final GitHub Actions status and an up-to-date branch, including for administrators. Hardware iPad acceptance remains open in the [current checkpoint](docs/implementation/repository_setup_progress.md#current-checkpoint).

Start the local web app with Docker; host Node is not required for these services:

```sh
docker compose up --build
# Open http://localhost:8080
docker compose down
```

The creator shell links to a typed status page and a synthetic server-rendered reader at `/setup/reader`. These are foundation checks; journey routes remain unavailable. Caddy publishes the application's loopback port; development Mailpit publishes its UI at `http://localhost:8025`. Database, storage, worker, and SMTP ports remain private. `/health/live` reports process liveness; `/health/ready` also checks the bootstrapped database. The worker's health check stops passing when its database is unavailable.

Compose waits for PostgreSQL health and successful queue bootstrap before starting the server and worker. The one-shot `migrate` service uses schema-owner credentials; server and worker roles cannot create schema objects. The optional acceptance tooling also receives bootstrap credentials for its isolated fixtures. `pnpm queue:bootstrap` repeats the controlled task. The production worker currently runs queue supervision without product handlers; the synthetic smoke handler lives only in the integration harness.

After changing bootstrap code, run `docker compose run --build --rm migrate` and recreate the dependent services. Compose Watch does not run privileged migrations automatically.

PostgreSQL and SeaweedFS data/metadata use named volumes retained by ordinary `docker compose down`. The defaults are local development credentials. Copy the [environment example](infra/compose/.env.example) to a root `.env` when overriding them; changing PostgreSQL initialization variables does not rotate existing database roles. The local image-qualification configuration is not a production deployment.

Use `docker compose up --build --watch` (or `pnpm dev`) for edits. Compose Watch synchronizes web source for Vite HMR, synchronizes server source and restarts its process, and rebuilds shared-package/dependency/config changes. Container dependencies stay separate from host dependencies. See [local environment inputs](infra/compose/.env.example); changing the port also requires a matching `KAIRN_PUBLIC_ORIGIN`. Recreate the stack after changing Compose, Caddy, or environment configuration.

```sh
docker compose --profile tools build tooling
docker compose --profile tools run --rm tooling pnpm check
docker compose --profile tools run --rm tooling pnpm test
docker compose --profile tools run --rm tooling pnpm test:integration
```

Integration checks require the application stack running. The tooling image includes the pinned Chromium runtime, requires no Docker socket, and builds its own compiled-package prerequisites. `pnpm verify:web` is a host wrapper that builds isolated development and final-runtime stacks, runs their HTTP/browser checks, verifies the production dependency closure, and removes its own containers/networks. The final-runtime override is for local image qualification; public deployment/TLS is later work.

Run `pnpm verify:data` for the critical data acceptance check. It owns an isolated project and disposable volumes, checks the migration failure gate, stops/recreates its database and storage, verifies queued-work and object persistence, tests the local SMTP sink, and reuses the existing web integration suite. Its resources are removed afterward. It does not reset development volumes. Test coverage stays focused on mandatory and critical scenarios as recorded in [AGENTS.md](AGENTS.md#testing-scope).

```sh
docker compose -f compose.yaml -f infra/compose/production.yaml up --build
```

Use Node **26.13.0** (`.node-version`) and pnpm **12.16.1** (`packageManager`). With fnm already installed:

```sh
fnm install
fnm use
corepack enable
pnpm install --frozen-lockfile
pnpm run doctor
pnpm verify:toolchain
pnpm check
pnpm test
pnpm verify:shared
```

Doctor detects the host role. An explicit role is also supported: `pnpm run doctor tooling`, `wsl`, `android`, or `ios`. It returns a failure for missing prerequisites. It does not install native tools or establish device readiness.

The ten private workspaces are four apps (`web`, `mobile`, `server`, `worker`), five shared packages (`contracts`, `backend`, `shared`, `sync-protocol`, `design-tokens`), and the development-only API generator. Workspace dependencies use `workspace:*`. Shared packages expose compiled ESM/declarations from `dist`; no source aliases are needed. `check`, `test`, and `verify:shared` build prerequisites automatically.

`pnpm build:packages` builds the five shared packages, including generated design-token CSS. `pnpm api:generate` updates the OpenAPI document and client types offline from the schema-only contracts entry. `pnpm api:check` compares fresh output without changing the artifacts. Run generation after an intentional schema change; builds/checks detect stale artifacts rather than silently updating them.

The implemented contract is `GET /api/v1/system`. Consumers import runtime schemas from `@kairn/contracts`, the explicit-base-URL/fetch client from `@kairn/contracts/client`, plain tokens from `@kairn/design-tokens`, and CSS from `@kairn/design-tokens/tokens.css`. The `@kairn/contracts/schema` entry is restricted to generation/server registration. The server invokes only the web package's explicit `reader` export and serves client assets from its actual Vite manifest.

Vite+ owns web/server tooling. Web/shared TypeScript is 7.0.2; mobile and the isolated OpenAPI generator use 6.0.3. Web React is 19.3.1; mobile React is 19.3.0. Mobile uses Unistyles v3 with exactly pinned Nitro Modules and requires compiled native development builds. See the [dependency register](docs/core/architecture.md#14-canonical-stack-and-dependency-register).

Keep a separate checkout, dependency installation, and generated native output on each OS: WSL for Compose, Windows native for Android/Metro, and Mac for iOS/Metro. Local development requires no EAS subscription or paid Apple membership.

`verify:toolchain` checks pinned tool compatibility. `verify:shared` checks package boundaries, compiled declarations under TypeScript 7 and mobile TypeScript 6, and a browser bundle of the shared exports/client. Actual client builds also reject Node/server modules and seeded secret markers. `test` exercises wire validation, client transport, sync envelopes, logging, HTTP factories, and boundaries through `vite-plus/test`. Native behavior has its own later gates. [Setup evidence and compatibility notes](docs/implementation/repository_setup_progress.md) record the qualification limits and declaration patches retained by the lockfile.
