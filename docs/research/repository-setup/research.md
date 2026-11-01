# Repository setup research

Date: 1 November 2026. Scope: the repository foundation for web, Android, server, worker, shared packages, and build/check commands. The [implementation plan](../../repository_setup_plan.md) turns these findings into reviewable work. Architecture version 1.4 remains the stack authority.

## Summary

Keep the four-application, five-package TypeScript monorepo and a development-only generation workspace. Use compiled ESM exports and Vite+ tasks. The user confirms GitHub Actions and Docker Compose for all runtime services. Recommend the 32 GB Windows PC for Android tools/emulator and the inspected 16 GB Intel Mac for Compose. Application ID, deep-link scheme, and domain are undecided.

Executed follow-up tests establish that the generator works with TypeScript 6.0.3 while TypeScript 7 fails. Use generator-local TypeScript 6 with a documented peer exception. Install native prerequisites on Windows rather than completing the Mac's SDK merely for API hosting. Windows CPU/virtualization and actual cross-host app connectivity remain unverified.

## Stack

The repository already selects Vite+ React/TanStack web, Expo/React Native Android, Hono Node HTTP, PostgreSQL/pg-boss jobs, and pure shared packages. There is no reason to introduce another task runner or change client frameworks for repository setup. [Architecture sections 5 and 14](../../architecture.md#5-module-ownership-and-repository-structure).

First-party metadata confirms the availability of the recorded Vite+, pnpm, Hono, contract, queue, and Expo package pins. The selected local Node and pnpm versions match the architecture. Availability and declared engines establish candidate compatibility, not integrated build success. [Toolchain evidence](findings_toolchain.md), [Android evidence](findings_android.md), [registry and host observations](metadata.json).

`openapi-typescript@7.13.0` declares `typescript: ^5.x` and its shipped `dist/lib/ts.mjs` calls `ts.factory` and `ts.SyntaxKind`. TypeScript `7.0.2` maps its root export to `lib/version.cjs`, which exposes version fields only. An isolated execution of the generator's factory expression against that exact shipped module fails with a `TypeError`. This establishes a real API mismatch, not merely a restrictive peer range. [Compiler API probe and package evidence](compiler_api_evidence.json).

Use `tools/api-generation` with pinned TypeScript `6.0.3`. Both CLI and JavaScript API generation passed, emitted the same declarations as the TypeScript 5 control, and produced output accepted by TypeScript 5/6/7 consumers. The generator's declared `^5.x` peer still needs a narrow tested compatibility adjustment; a TypeScript 5 installation is unnecessary. This supersedes the earlier metadata-only compiler recommendation. [Executed findings](findings_typescript6.md), [full evidence](typescript6_compatibility.json), [Microsoft's compiler transition](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/).

pg-boss also declares an `@opentelemetry/api` peer. It must be present in a workspace policy that disables automatic peers. That is a small library dependency, not a decision to add a collector or tracing dashboard. [Queue package metadata](https://registry.npmjs.org/pg-boss/12.38.0).

## Existing patterns

There is one initial commit and documentation only. No package manifests, dependency lockfile, application source, workflow, or Git remote exists. Product requirements govern scope; architecture section 14 governs selected dependencies; existing research files are historical evidence rather than installation manifests.

The baseline separates server policy/data from client-safe contracts, pure rules, sync protocol, and design tokens. Web and native UI stay inside their apps. Preserve this separation before domain modules exist so future code has a clear ownership boundary.

The requirements' ten delivery steps remain the complete R1 commitment. Repository setup precedes the first account/domain work and proves the build/runtime connections. It does not establish accounts, capture durability, media authorization, publishing, or release readiness. [Requirements delivery sequence](../../product_requirements.md#182-dependency-aware-implementation-sequence).

## Integration points

### Workspace tasks and compiled packages

Vite+ supplies the chosen build, test, lint, format, and task commands. Use `vp build` for browser/SSR output and `vp pack` for library and Node entries. Task order follows ordinary workspace dependencies. A missing selector can otherwise exit successfully, so use failure-on-no-match in aggregate scripts. These behaviors are established by the [Vite+ run guide](https://viteplus.dev/guide/run) and [packing guide](https://viteplus.dev/guide/pack).

Two package designs are viable. Source exports can reduce local rebuild work, but require separate conditions across Metro, Vite, Node, and production. Compiled ESM exports require a build/watch stage but let every runtime consume the same JavaScript and declarations. Recommend compiled exports for all five shared packages. This is a repository design decision supported by Node's export rules and the bundler's output behavior, not a claim that Expo mandates compiled workspace packages. [Node exports](https://nodejs.org/api/packages.html#package-entry-points), [tsdown dependencies](https://tsdown.dev/options/dependencies).

Bundling a Node entry does not necessarily bundle its dependency tree. The selected packer externalizes declared production dependencies. Runtime staging therefore includes the referenced workspace builds and installed production graph. An isolated production-directory smoke check is the direct proof that packaging works. Checks, tests, and Metro commands also need compiled package outputs on a clean checkout, so their aggregate scripts must build those dependencies first.

pnpm 12 places structural settings in `pnpm-workspace.yaml`. Its peer and dependency-build controls need deliberate settings, with supported Vite alias exceptions kept narrow. Do not reuse obsolete install-policy snippets or broad maintainer-internal peer suppression. [pnpm settings](https://pnpm.io/settings), [peer settings](https://pnpm.io/settings/peer-dependencies), [build policy](https://pnpm.io/settings/build).

### Web/Node and mobile checks

Web and mobile intentionally use different React and compiler versions. Pure packages contain no React runtime. The web reader uses the web React/DOM pair; mobile retains its Expo SDK pair. Expo supports isolated pnpm installations and automatic monorepo resolution, so legacy Metro aliases and global hoisting are unnecessary unless an actual failure establishes otherwise. [Expo monorepos](https://docs.expo.dev/guides/monorepos/), [autolinking](https://docs.expo.dev/modules/autolinking/).

`vp check` reads lint/type settings from the workspace root. Running it from mobile does not select mobile's compiler. Use root formatting, web/Node Vite+ checks, a separate native lint configuration, and mobile's local TypeScript command. The proposed split follows documented configuration behavior and still requires a negative test with an intentional native type error. Avoid `baseUrl`, which the shipped tool identifies as unsupported for its type-check path. [Vite+ check](https://viteplus.dev/guide/check), [explicit lint configuration](https://viteplus.dev/config/lint), [shipped-tool findings](findings_toolchain.md).

### Rendering, contracts, and worker lifecycle

Keep one server process responsible for production HTTP. The web package emits browser assets and a bounded React reader entry. The server imports that entry and uses the production manifest. Useful HTML, matching hydration, safe serialization, and request-local state need direct acceptance checks. Vite documents this as low-level integration, so its maintenance cost remains real. [Vite SSR](https://vite.dev/guide/ssr.html), [backend integration](https://vite.dev/guide/backend-integration.html).

OpenAPI generation can run from schema/route declarations without a running API. Keep its entry independent of backend startup and previously generated types to avoid a package/build cycle. Compare regenerated output in a temporary directory rather than mutating the checkout during checks. Static generated types do not validate untrusted runtime input. [Hono Zod/OpenAPI](https://hono.dev/examples/zod-openapi), [OpenAPI generator](https://openapi-ts.dev/introduction), [typed fetch](https://openapi-ts.dev/openapi-fetch/).

pg-boss startup can create/migrate its schema by default. Use controlled bootstrap credentials and disable that work for normal runtime. Prove persistence with a real PostgreSQL job while stopping and restarting the separate consumer. This foundation check does not prove application-owned transactional enqueue, which arrives with domain transactions. [pg-boss operations](https://pgboss.io/api/ops), [constructor](https://pgboss.io/api/constructor).

### Android artifacts and GitHub Actions

Use Expo Continuous Native Generation. Its alternative, committing native sources, is valid when the team deliberately owns direct native edits, but adds upgrade work before this repository needs it. Pin generation inputs, keep generated projects ignored, express customizations through app configuration/plugins, and check that generation leaves manifests and lockfile unchanged. [Expo CNG](https://docs.expo.dev/workflow/continuous-native-generation/), [native customization](https://docs.expo.dev/workflow/customizing/).

The adopted template's shipped Android defaults indicate compile API 37 and Build Tools 37.0.0. Both are missing on the Mac, but the Windows native build host now owns those prerequisites. Its installation has not been inspected. Verify actual generated Gradle/AGP/Kotlin/SDK settings, and select `gradlew.bat` on Windows. A Metro export is separate from an APK build; the template's debug signing is not distribution qualification. [Shipped-template evidence](findings_android.md), [Windows findings](findings_windows_android.md), [Android signing](https://reactnative.dev/docs/signed-apk-android).

Require quality and native jobs on GitHub Actions. Run both for every PR initially, use the same root scripts locally, and keep integration/native tasks uncached until reproducibility is established. These are project recommendations. GitHub's documented action-pinning and least-privilege practices support the workflow configuration. [GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use).

### Docker Compose and split development hosts

Compose owns Caddy, HTTP/web artifacts, worker, PostgreSQL, private SeaweedFS, schema bootstrap, and development Mailpit. A tooling container runs checks and JavaScript builds. Production web is built output within the HTTP/edge runtime, not a mandatory extra application server. Media and operations execution join Compose with their capabilities. Separate development/production configuration, health/completion gates, persistent volumes, and final-image tests are required. [Compose findings](findings_compose.md).

Use root core topology with an automatic development override so `docker compose up --build` starts local development. Select production/CI files explicitly to exclude development-only mounts/ports/Mailpit. Keep host dependencies out of Linux containers. Containerization does not supply backups, correct permissions, or native emulator qualification by itself.

Windows has 32 GB RAM according to the user, meeting Google's current memory recommendation for Studio plus emulator. Its CPU, virtualization, OS, GPU, and SSD remain unverified. Use Windows-native Studio/Gradle/SDK/emulator and normally Metro with a local checkout. Keep the Mac API behind private Tailscale ingress; `10.0.2.2` from the Windows emulator addresses Windows, not the Mac. [Windows research](findings_windows_android.md), [Android requirements](https://developer.android.com/studio/install).

A Mac Metro alternative preserves reload of Mac-side edits but needs an explicit tailnet URL and working WebSockets/assets. Two local checkouts require a commit/synchronization workflow because Git does not live-sync edits. Tailscale connectivity does not imply remote command or device-control access. No Windows environment was inspected or linked in this session.

## Gotchas

| Risk | How it can produce a misleading result | Required check |
|---|---|---|
| Vite alias identity | Plugin's raw peer major and aliased package version differ | Real resolved graph plus React/TanStack client and SSR builds |
| Generator compiler API | TypeScript 7 lacks factory APIs even if peers are ignored | Use the executed TypeScript 6 combination and regress actual project schemas |
| Root native type checking | Web checker reports success while SDK-specific types fail | Mobile-local compiler and intentional-error rejection |
| Missing compiled workspace output | Fresh checks cannot find declarations, or deployment relies on source access | Bootstrap package outputs for every consumer and run production files/dependencies only |
| Generated API cycle | Contracts generation needs a server which itself imports generated contracts | Schema-only bootstrap from a clean output directory |
| Native cache or export substituted for APK | JavaScript passes while Gradle/native composition fails | Fresh prebuild and APK compilation |
| Environment leakage | Backend secret reaches the browser or native bundle | Import boundaries and seeded-secret artifact inspection |
| Worker in memory | A timer works until the request/process exits | PostgreSQL job across consumer restart |
| `pnpm doctor` command collision | pnpm's built-in diagnostic runs instead of the repository script | Use explicit `pnpm run doctor`; confirmed with local pnpm 12.16.1 help |
| Compose development configuration in production | Merged ports/mounts survive an incomplete override | Explicit file selection and validation of each effective configuration |
| Cross-host source drift | Windows Metro serves an older checkout than Mac-edited contracts | Matching commits or an explicit source-sync workflow |

## Testing

Planning verification checks local references, Markdown, captured metadata, and baseline consistency. The first probe established the TypeScript 7 root API mismatch. Follow-up temporary installations executed the complete generator CLI/API against a synthetic OpenAPI 3.1 fixture, with positive and negative consumer checks and TypeScript 5/6/7 controls. Application behavior, Compose startup, and Windows native builds remain untested. [Execution evidence](typescript6_compatibility.json).

Implementation acceptance includes frozen tooling images, static checks, contract drift, production web/Node/Metro builds, merged Compose configuration, final-image runtime, startup/migration gates, persistent queue/storage, HTML/hydration, Windows native APK/lint, and an emulator-to-Mac status request. The plan defines the commands and acceptance gates.

## Open questions

GitHub Actions is confirmed. Final Android application ID, scheme, and domain remain undecided. A documented development-only identity permits local native work; permanent identity and signing ownership precede distribution. GitHub remote/repository destination is required before publishing the workflow or enforcing checks.

Docker Compose is also confirmed. Windows RAM is known from the user; remaining hardware and emulator network behavior require inspection during implementation. The Mac need not install additional Android SDK packages for the recommended split arrangement.

VPS inventory, backup/restriction-journal destination, provider credentials, supported languages, and product retention limits remain in the architecture's decision register. They do not block local repository setup. Target-device qualification and the final supported Android floor are later native acceptance decisions.

## Sources

All external evidence is Tier 1 maintainer documentation, official registry metadata, or shipped artifacts, observed on 1 November 2026. Recommendations are identified in the integration discussion. No source establishes that the selected complete application graph has passed a build.

- VoidZero, Vite+ 1.4.0 and bundled tsdown 0.23.1. [Detailed toolchain sources and limitations](findings_toolchain.md#sources).
- Expo SDK 58, React Native 0.88.1, Android AGP 9.2, and selected native templates. [Detailed Android evidence](findings_android.md#sources).
- Hono, current Node adapter and OpenAPI integration. [Node runtime](https://hono.dev/docs/getting-started/nodejs), [Zod/OpenAPI](https://hono.dev/examples/zod-openapi).
- Node.js 26.13.0 and TypeScript. [Package entry points](https://nodejs.org/api/packages.html#package-entry-points), [module resolution reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html).
- OpenAPI TypeScript 7.13.0 and openapi-fetch 0.17.0. [Generator metadata](https://registry.npmjs.org/openapi-typescript/7.13.0), [generator](https://openapi-ts.dev/introduction), [fetch](https://openapi-ts.dev/openapi-fetch/).
- pg-boss 12.38.0. [Operations](https://pgboss.io/api/ops), [runtime constructor](https://pgboss.io/api/constructor), [metadata](https://registry.npmjs.org/pg-boss/12.38.0).
- GitHub Actions. [Workflow secure use](https://docs.github.com/en/actions/reference/security/secure-use).
