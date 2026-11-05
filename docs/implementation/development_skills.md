# Installed development skills

Date: 1 November 2026. Scope: this repository, under `.agents/skills/`. All 38 upstream skills and three Kairn-specific skills below are installed now, including guidance for later workstreams. This inventory replaces the earlier recommendation to defer installing future-workstream skills. [Setup progress](repository_setup_progress.md) records application package implementation; installing guidance alone does not install application packages or qualify native integrations.

## Inventory and provenance

The [source manifest](../../.agents/skills-manifest.json) records each upstream repository, source path, pinned Git commit, and installed content hash. The skill-installer helper copied skill folders and their supporting files into the repository. These are ordinary project files, so the same committed checkout supplies them on WSL, Windows, and Mac without relying on one machine's global skills. Existing global skills were left in place; project copies of `find-skills`, `emil-design-eng`, and `shadcn` make those capabilities portable too.

| Area | Installed skill names | Upstream source |
|---|---|---|
| Expo foundation and navigation | `expo-overview`, `expo-project-structure`, `expo-router`, `expo-dev-client` | [expo/skills](https://github.com/expo/skills) |
| Native UI and styling structure | `expo-native-ui`, `expo-design-system`, `expo-ui`, `expo-animation` | [expo/skills](https://github.com/expo/skills) |
| Mobile networking and future integrations | `expo-data-fetching`, `expo-module`, `expo-examples`, `expo-upgrade` | [expo/skills](https://github.com/expo/skills) |
| Optional future Expo distribution and OTA workflows | `eas-app-stores`, `eas-workflows`, `eas-update`, `eas-update-insights` | [expo/skills](https://github.com/expo/skills) |
| Unistyles v3 | `react-native-unistyles-v3` | [jpudysz/react-native-unistyles](https://github.com/jpudysz/react-native-unistyles/tree/main/skills) |
| Web routing and Query integration | `router-core`, `react-router`, `router-query` | [TanStack/router](https://github.com/TanStack/router) |
| Authentication | `better-auth-best-practices`, `better-auth-security-best-practices` | [better-auth/skills](https://github.com/better-auth/skills) |
| Database | `supabase-postgres-best-practices` | [supabase/agent-skills](https://github.com/supabase/agent-skills) |
| Container builds | `multi-stage-dockerfile` | [github/awesome-copilot](https://github.com/github/awesome-copilot) |
| Web acceptance and accessibility tests | `playwright-best-practices` | [currents-dev/playwright-best-practices-skill](https://github.com/currents-dev/playwright-best-practices-skill) |
| React, native performance, and UI review | `vercel-react-best-practices`, `vercel-react-native-skills`, `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |
| Maps | `mapbox-web-integration-patterns`, `mapbox-web-performance-patterns`, `mapbox-ios-patterns`, `mapbox-android-patterns` | [mapbox/mapbox-agent-skills](https://github.com/mapbox/mapbox-agent-skills) |
| Server-side AI tasks | `ai-sdk` | [vercel/ai](https://github.com/vercel/ai) |
| Test APIs and fixtures | `vitest` | [antfu/skills](https://github.com/antfu/skills) |
| HTTP/backend | `hono` | [honojs/skills](https://github.com/honojs/skills) |
| Existing design and discovery capabilities | `find-skills`, `emil-design-eng`, `shadcn` | [vercel-labs/skills](https://github.com/vercel-labs/skills), [emilkowalski/skills](https://github.com/emilkowalski/skills), [shadcn-ui/ui](https://github.com/shadcn-ui/ui) |

`router-core` also includes its upstream topic-specific subskills. They are supporting content within that installed package, not additional top-level packages in the count above. The `react-router` skill here describes TanStack's React bindings, not the separate React Router library.

| Local skill | Purpose |
|---|---|
| [kairn-architecture](../../.agents/skills/kairn-architecture/SKILL.md) | Selected stack, package boundaries, Unistyles setup, compiler exceptions, local hosts, and meaningful verification gates. |
| [kairn-capture-sync](../../.agents/skills/kairn-capture-sync/SKILL.md) | Durable files/SQLite, capture acknowledgments, interruption recovery, resumable uploads, revisions, and access tombstones. |
| [kairn-publication-access](../../.agents/skills/kairn-publication-access/SKILL.md) | Capabilities, source/export grants, approved snapshots, stale jobs, current-access checks, citations, and restriction replay during recovery. |

## Applying the skills to Kairn

[AGENTS.md](../../AGENTS.md) records the project choices that take precedence over generic skill examples. Use relevant skills when their work begins; no later installation step is needed for this inventory.

- **Native styling:** use Unistyles v3 and shared token values. NativeWind and its setup skill are excluded. Broad Expo UI examples can mention `@expo/ui`, other component libraries, platform-specific icons, or a different palette; those examples do not select the new visual direction. Colors, fonts, icons and component appearance are reopened in [DESIGN.md](../../DESIGN.md); installed packages are not visual requirements. Install additional runtime UI dependencies only through the architecture's selection process.
- **Native builds:** use Expo CLI/native SDKs locally with Nitro/New Architecture. Unistyles already requires a compiled development build, before maps arrive. Ignore generic Expo Go-first advice for this app. The installed development-client skill includes EAS/TestFlight examples; keep the confirmed local-build and free-provisioning workflow. Future EAS distribution, workflows, OTA publishing, and update-insight skills are installed as optional knowledge so they are not forgotten. Installing them does not select those services, start a build/update, enroll with Apple, or add a subscription; native-tool store submission remains possible. Cloud hosting and hosted-device skills are outside the confirmed VPS/local-device workflow.
- **Compiler/tooling:** keep Vite+ configuration and `vite-plus/test` imports. The installed Vitest skill currently references a newer beta than the selected bundled runner; verify features against the installed runner before using them. Do not install that beta, standalone Vitest, or a second lint/format/task stack because a skill example uses it.
- **Version boundaries:** retain the documented mobile/web React and TypeScript exceptions. The native performance skill's general monorepo version-unification advice does not override the adopted Expo SDK. FlashList and other example packages still need a demonstrated application requirement.
- **Backend:** use the selected Hono version, Node host, React reader, and OpenAPI-generated clients. The Hono skill includes newer-major/prerelease CLI material, Hono JSX, RPC, and Cloudflare examples; confirm APIs against the selected version instead of adopting those alternatives. Authentication skills do not replace domain source grants or add an organization model.
- **Data durability:** networking/Query persistence guidance handles server state and connectivity. It does not replace the app-owned media files, SQLite state machine, command IDs, checksum verification, and recovery protocol.
- **Maps:** web skills apply to GL JS. Swift/Kotlin Mapbox skills provide native SDK knowledge for troubleshooting and bridge work; the Expo app still integrates through `@rnmapbox/maps`. Keep map-free reading, accessible stage-list alternatives, and current access checks.
- **AI:** use the installed SDK's version-matched documentation. Keep server-only calls, evaluated provider routes, authorized retrieval, validated citations, and buffered answers. Agent/tool/streaming/chat-hook examples do not expand the selected product interface.

No additional Next.js, NativeWind, Supabase backend, PowerSync, generic CRDT, or hosted-device framework is selected by these skill installations. Low-adoption SeaweedFS/pg-boss search results were not part of the recommended set; use the installed architecture/PostgreSQL guidance with first-party version-matched docs for those integrations.

## Maintenance

Commit the project skill folders, manifest, and local guidance together. Preserve vendored upstream contents; put Kairn-specific adaptations in `AGENTS.md`, the three local skills, or the governing plans. If an upstream relative link assumes its original monorepo layout, resolve the referenced installed skill by frontmatter name under `.agents/skills`.

To update an upstream skill, inspect the new source revision, install it into a temporary directory with the skill-installer helper, review the diff and supporting files, then replace the selected vendored folder and update its commit/content hash in the manifest. The hash is SHA-256 over sorted file paths relative to the skill folder, with each UTF-8 path followed by a NUL byte, file contents, and another NUL byte. Local skills use repository ownership instead of an upstream Git commit. Validate their frontmatter and documentation references after edits. Do not treat a manifest hash as an upstream security audit.

The CLI can inspect discovery with `npx skills list --json`. Its ordinary source lockfile is not generated by the Codex installer; use the committed source manifest for this installation's provenance. New skills become available to the agent on the next turn.
