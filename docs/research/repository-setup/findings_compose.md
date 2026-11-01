# Docker Compose setup findings

Date: 1 November 2026. Scope: the user's requirement that all application runtime services run through Docker Compose. This revises the previous host-process development plan. No images, Compose files, application code, or services were created or run by this research.

## Recommendation

Docker Compose owns the application runtime from the first repository milestone. Keep the agreed modular monolith and separate HTTP/worker processes, but package them as separate containers. The browser and Android app remain clients. An Android emulator, Android Studio, and local Gradle development are host tools, not application services that should be put inside the Compose project.

The following service ownership preserves [architecture section 15.1](../../architecture.md#151-deployment-units-and-portable-object-storage):

| Service | Runtime responsibility | Scope and exposure |
|---|---|---|
| `edge` | Caddy ingress | Only application ingress published to host; local-only binding by default, explicit Tailscale access when configured |
| `server` | Hono API and React public renderer | Internal HTTP port; image includes the web client assets and reader build |
| `worker` | Durable pg-boss coordination and trusted external provider calls | Separate long-running process; no public product port |
| `postgres` | Application and queue data | Persistent named volume; container network only by default |
| `storage` | Authenticated private SeaweedFS S3 service | Persistent data/metadata; private network only |
| `migrate` | One-shot queue/domain schema initialization | Separate credentials; must succeed before dependent runtime starts |
| `mailpit` | Development SMTP sink and message UI | Development configuration only; UI local-only by default |
| `tooling` | One-shot checks, tests, code generation, and JavaScript builds | Explicit `run --rm` invocation; not an always-running service |
| Media execution and operations jobs | Bounded media execution and backup/restore/recovery work | Add containerized commands/profiles with the owning capability; do not add empty placeholder daemons |

There is no need for a second production web server solely because `apps/web` is a workspace. Its build outputs are runtime inputs to the HTTP/edge images. The synthesis selects Vite SSR/HMR inside the development HTTP container under the single-listener integration. A separate development-only Vite service is an alternative only if that integration fails qualification. Do not accidentally run two competing public renderers.

## Files and environment differences

Use root `compose.yaml` for core topology and built application runtime. The synthesis selects automatically loaded `compose.override.yaml` for development targets, source updates, local bindings, and Mailpit, making `docker compose up --build` the local default. Production selects `-f compose.yaml -f infra/compose/production.yaml` explicitly, excluding the automatic development override. CI uses its own explicit override. Defaults must not require an undecided production domain for local development.

Docker merges services across files; later files are not complete replacements. All relative paths resolve from the base Compose file. Validate each exact merged configuration with `docker compose ... config --quiet`, especially port and volume overrides. Use profiles for optional tools/operations, not to hide required API/database services. A profile is a service-selection mechanism and does not by itself provide a production configuration. [Docker merge semantics](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/), [profiles](https://docs.docker.com/compose/how-tos/profiles/).

Use Compose Watch or deliberate bind mounts for source updates. Keep Linux container dependency installations separate from macOS and Windows `node_modules`. Never sync or bind-mount a host dependency tree over the image's installation. Shared package builds/watchers run inside the appropriate container; changing a shared package must update every relevant consumer. Lockfile, manifest, toolchain, or native library changes trigger image rebuilds. [Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/).

## Images, startup, and data

Use a multi-stage Node image with pinned Node/pnpm, frozen dependency installation, package/schema builds, application builds, and separate final HTTP/worker targets. The final image needs compiled workspace exports and the complete production dependency closure, because `vp pack` externalizes normal dependencies. Build tools and source are not substitutes for missing runtime packages. Prove container startup from final images without a source mount. [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/).

Require database health before `migrate`, then require successful migration completion before HTTP/worker startup. Compose supports `service_healthy` and `service_completed_successfully`. These gates solve startup ordering, not failures after startup; retain bounded application connection/retry behavior and useful readiness diagnostics. Runtime processes do not receive migration-owner credentials. [Startup conditions](https://docs.docker.com/compose/how-tos/startup-order/).

SeaweedFS currently documents a single-node `weed mini` container and separately composed master/volume/filer/S3 components. Prefer the documented single-node shape for development, with explicit authentication and persistent storage. Qualify the adopted pinned release rather than assuming current `master` documentation matches it. Separate components are an option when operational requirements justify them. Application media remains private behind the application gateway. Test object persistence and credentials, not only container process health. [SeaweedFS first-party quick start](https://github.com/seaweedfs/seaweedfs/blob/master/README.md?plain=1).

Keep named volumes for PostgreSQL, object-store data/metadata, and Caddy state. An ordinary stop/restart must retain them. Backups and the independent restriction journal still need an off-host failure domain. Containerizing the backup runner does not make a second volume on the Mac an independent backup. Do not mount the Docker daemon socket into the normal worker to launch media containers; select a bounded invocation interface when the media execution capability is implemented.

## Proposed command contract

These are future commands to implement and verify, not commands available in the documentation-only repository:

```sh
docker compose config --quiet
docker compose up --build
docker compose up --build --watch
docker compose -f compose.yaml -f infra/compose/production.yaml config --quiet
docker compose --profile tools run --rm tooling pnpm check
docker compose --profile tools run --rm tooling pnpm test
docker compose --profile tools run --rm tooling pnpm build
docker compose --profile tools run --rm tooling pnpm api:generate
docker compose logs -f server worker
docker compose down
```

`compose run` executes a one-off container command and normally does not publish the service's ports. Keep tool commands and long-running app commands distinct. Native Android builds run on the selected native host or native CI, outside the JavaScript-only tooling image. [Docker one-off commands](https://docs.docker.com/reference/cli/docker/compose/run).

Quality CI should validate the merged Compose files, build the actual final images, run static/tests through the tooling image, and exercise production HTTP/HTML/assets plus a real PostgreSQL queue path in the composed runtime. Check that volumes persist across recreation and that missing/failed migration prevents readiness. The native CI job remains separate.

## Capacity and milestone scope

The inspected Mac has 16 GiB physical memory; the user reports 32 GB on Windows. Running the core development containers on the Mac while Windows owns Android Studio, Metro, Gradle, and the emulator is a reasonable starting arrangement. Docker Desktop's Linux VM has its own resource limits, with a documented default memory allocation of half the host's memory. Do not treat that default or an invented per-container estimate as a measured project capacity. Start with bounded worker concurrency and avoid media conversion/backup jobs while they are not needed. [Docker Desktop resources](https://docs.docker.com/desktop/settings-and-maintenance/settings/).

The foundation now includes container image/build/orchestration work, rather than only a PostgreSQL container. It should register and prove the current core runtimes and the chosen private storage service. Mailpit belongs in development. Media/AI/auth/backup/recovery product features are implemented in their existing workstreams, and their runtime commands must join Compose when introduced. Do not interpret a skeleton `compose.yaml` or healthy empty worker as proof that those features are complete.

## Verification limits

Evidence comes from Tier 1 Docker and SeaweedFS documentation, reviewed 1 November 2026, with five targeted search queries plus direct source reads. No merged Compose configuration, selected SeaweedFS image, resource allocation, dependency closure, remote API path, Docker daemon, or native device was exercised. Those remain implementation acceptance gates.
