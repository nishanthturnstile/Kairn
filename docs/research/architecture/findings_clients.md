# Client architecture research

Historical first-pass research. Recommendations may be superseded by the current architecture. The sole current stack/dependency register is [architecture section 14](../../architecture.md#14-canonical-stack-and-dependency-register). This file is evidence, not an install list.

Research date: 1 November 2026. These are architecture recommendations and metadata observations, not implementation evidence. Sources are the official maintainers' documentation, release notes, and package registries. No community blog establishes a compatibility claim here. The user clarified that application/data hosting belongs on the existing VPS, external maps and AI are allowed, and budget is not a current constraint.

## Recommendation

Keep Expo and React Native for Android capture, and Vite with React for web. Share API contracts, validation, domain calculations, and design tokens. Keep the native screens and web components separate. Expo supports native extensions and local builds, so self-hosting does not require changing mobile frameworks. Kotlin becomes worth reconsidering only if measured native capture or background-transfer requirements cannot be met through Expo modules. Flutter would introduce Dart and duplicate contracts without resolving a demonstrated R1 problem.

Use TanStack Router for web URL state, Query for server data in both clients, Form for both clients, Table for web import/moderation tools, and Virtual for large web import/review lists. Use Expo Router for native navigation. Query's official [React Native guide](https://tanstack.com/query/latest/docs/framework/react/react-native) documents NetInfo and app-focus integration. Form also has an official [React Native guide](https://tanstack.com/form/latest/docs/framework/react/guides/react-native).

The durable native SQLite outbox owns offline edits and uploads. TanStack Query is a cache and server-state coordinator; it does not replace that outbox or durable media files.

## Web rendering decision

TanStack Start is a good functional match for a server-rendered Story/Discover reader with a client-rendered creator workspace. It remains Vite plus React and TanStack Router when configured with the Vite plugin. Keep business operations in the separate common API used by native and web. Start would own rendering and request-specific page metadata only. Sources: [Start build configuration](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch), [selective SSR](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr), and [head metadata](https://tanstack.com/start/latest/docs/framework/react/guide/seo).

There is a release-channel exception. Start itself is stable at `1.169.4`, but its documented Vite-to-Node/Docker route currently uses `nitro/vite`. The `nitro` package's latest version is `3.0.261029-rc`, a release candidate. Stable `nitropack@2.13.5` is a different package and must not be described as a drop-in replacement for that plugin. The [Start hosting guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) explicitly calls the integration actively developed. A `latest` tag is not proof of stable release status.

Choose explicitly between these shapes:

| Shape | Assessment |
|---|---|
| Vite + React + Router creator SPA, with a small React server renderer for public Story/share HTML in the Node service | Default if every production dependency must be stable. Public HTML, page metadata, and client hydration use the same viewer-safe contract. This adds rendering integration code. |
| TanStack Start + Vite + Nitro RC | Less rendering plumbing and a clean selective SSR model, but requires a documented RC exception and release integration checks. Do not quietly call it an all-stable stack. |
| TanStack Start with a custom Node request adapter | Potential alternative. The official Rsbuild path documents a fetch-style handler, but the documented Vite Node path uses Nitro. A custom Vite production-output adapter needs evidence from the actual complete implementation before adoption. |

For Nitro, the documented runtime preset is `node_server`. Build output runs with `node .output/server/index.mjs`, deploys to an ordinary server/container, and needs no hosting SaaS. See [Nitro Node runtime](https://nitro.build/deploy/runtimes/node). If Start is selected, pin Start and Router as a compatible pair. Current Start metadata directly depends on Router `1.170.46`; their numbers do not need to match.

Public rendering must fetch the currently accessible approved version for every request, using the same rights check as the media and answer endpoints. Do not statically prerender journey content, unlisted links, or private workspace data. Generate safe Open Graph metadata server-side. Return generic unavailable metadata after revocation. `noindex` remains the R1 default even for public catalog pages because external search indexing is later scope. A server-rendered page is useful for readable text and previews without committing to external indexing.

Avoid depending on Router's low-level SSR APIs without an integration check. Its current [SSR page](https://tanstack.com/router/latest/docs/guide/ssr) still contains an experimental warning that refers to Start becoming stable. This is a documentation inconsistency, so do not assume that warning has disappeared merely because Start is v1.

## Complete current TanStack catalog

The [official catalog](https://tanstack.com/libraries) currently lists the following 19 products. Decisions below are specific to Kairn, not judgments of general library quality. Version observations come from each package's official npm metadata.

| Product | Observed version/channel | Decision and application | Native implications |
|---|---|---|---|
| Router | `@tanstack/react-router` `1.170.46`, stable | Use for web routes and validated `view`, `chapter`, and `moment` search parameters. | Use Expo Router for native screens. |
| Start | `@tanstack/react-start` `1.169.4`, stable; documented Vite Node adapter currently RC | Conditional on rendering/RC decision above. | Web rendering only; native still uses the common API. |
| Query | `@tanstack/react-query` `5.105.1`, stable | Use for API cache, pagination, invalidation, and upload/job status queries. | Official RN support; connect focus and online managers. |
| Form | `@tanstack/react-form` `1.33.5`, stable | Use for journey setup, details, permissions, and review forms. Validate with shared Zod schemas. | Official headless RN support. |
| Table | `@tanstack/react-table` `9.3.1`, stable | Use for desktop import batches and moderation, when table interaction helps. | Use native list UI; headless portability does not provide native cells. |
| Virtual | `@tanstack/react-virtual` `3.14.24`, stable | Use on large web media/review lists after measurement. | Use FlatList or SDK-compatible FlashList. |
| DB | Core `0.15.2` and React adapter `0.5.12` last non-prerelease; both latest tags point to `1.0.0-rc.1.1`; catalog says beta | Defer. Reactive collections do not by themselves provide durable native media sync, scoped grants, or R1 conflict rules. | SQLite remains authoritative locally. |
| AI | `@tanstack/ai` and `@tanstack/ai-react` `1.0.1`, stable | Evaluate later if provider adapters and chat streaming justify it. A bounded server inference adapter plus explicit citation DTOs is sufficient. | Client receives answers/citations, never model credentials. React adapter has a React DOM peer; do not assume native UI support. |
| Store | `@tanstack/react-store` `0.11.2`; catalog alpha | Defer standalone adoption. URL state, local component state, Query, and SQLite cover initial ownership. | Do not use an alpha store for durable capture. |
| Pacer | `@tanstack/react-pacer` `0.24.1`; catalog beta | Defer. Basic debounce does not justify a dependency yet. | Core scheduling is not durable Android job scheduling. |
| Hotkeys | `@tanstack/react-hotkeys` `0.20.1`; catalog beta | Optional later for editor shortcuts after baseline keyboard access works. | DOM keyboard adapter; no native navigation role. |
| Devtools | `@tanstack/react-devtools` `0.10.14`; catalog alpha | Optional development-only panel. Use stable library-specific devtools first where practical. | Web panel; native debug tooling is separate. |
| Config | `@tanstack/config` `0.22.2` | Skip. It targets package publishing/maintenance and does not replace app build configuration. | No runtime role. |
| CLI | `@tanstack/cli` `0.72.0`; catalog alpha | Optional scaffold tool, not a production dependency or architecture choice. | No runtime role. |
| Intent | `@tanstack/intent` `0.5.6`; catalog alpha | Optional developer guidance. Not a product requirement. | No runtime role. |
| Redact | `@tanstack/redact` `0.2.3`, recently introduced | Skip. It is an alternative React runtime, unrelated to privacy redaction of travel data. Keep upstream React. | Not a replacement for RN. |
| Charts | `@tanstack/react-charts` `1.1.0`, stable published release; docs follow unreleased main | Defer. R1 does not need a chart grammar. Basic recorded statistics can be text. | Published React adapter targets DOM SVG/Canvas. |
| Markdown | `@tanstack/markdown` `1.0.0`, stable | Defer unless Markdown becomes a chosen content/answer format. Structured story blocks and citation objects are easier to govern. | React renderer is web-oriented; AST core is portable. |
| Highlight | `@tanstack/highlight` `1.2.0`, stable | Skip for R1. Travel stories do not need source-code syntax highlighting. | HTML output has no native presentation role. |

The newer products are described in their own official sources: [Redact overview](https://tanstack.com/redact/latest/docs/overview), [Charts overview](https://tanstack.com/charts/latest/docs/overview), [Markdown overview](https://tanstack.com/markdown/latest/docs/overview), [Markdown installation](https://tanstack.com/markdown/latest/docs/installation), [Highlight overview](https://tanstack.com/highlight/latest/docs/overview), and the [AI repository](https://github.com/TanStack/ai).

Table is v9 now. Do not copy old v8 examples without migration review. Conversely, a `0.x` version with no prerelease suffix does not prove a project's APIs are declared stable. DB's catalog beta and Store's alpha labels matter separately from semver spelling.

## Version and compatibility snapshot

Registry observations were fetched on 1 November 2026. Package-level primary sources are `https://registry.npmjs.org/<package>`, and exact snapshots can be fetched from `<package>/<version>`. `latest` and the highest non-prerelease release were checked separately for prerelease-sensitive packages. No packages were installed for this research.

| Component | Latest observed | Recommended selection / constraint |
|---|---|---|
| React / React DOM | `19.3.1` | Web `19.3.1`; Expo 58's current bundle and template pin `19.3.0`. Keep native on that supported baseline unless Expo updates its matrix. Shared packages declare React as peer and must not bundle another React. |
| Vite | `8.3.5` | Use for web. Node `^20.19.0` or `>=22.12.0`; use a current even-numbered LTS matching the full toolchain. |
| React Vite plugin | `@vitejs/plugin-react` `6.1.2` | Matches Vite `^8.0.0`. |
| TypeScript | `7.0.2` | Latest candidate for web/server. Current Expo template still uses `~6.0.3`. Validate mobile tooling before overriding that template; document any temporary mobile exception. |
| Expo | `58.0.22` | Current SDK 58 stable baseline. SDK 58 release was 15 October 2026. |
| React Native | `0.88.1` | Current Expo bundle also selects `0.88.1`. |
| Expo Router | `58.0.29` | SDK bundle selects `~58.0.29`. |
| shadcn CLI | `4.23.0` | Generation/update tool. Components are checked-in source, so there is no single shadcn runtime version. |
| Tailwind CSS | `4.3.3` | Web styling. Generate shared primitive design tokens for native. |
| Motion | `14.9.0` | Optional web interaction animation; CSS suffices for basic fades. Use reduced-motion settings. |
| Zod | `4.6.7` | Shared boundary validation. |
| Zustand | `5.0.16` | Optional only if measured local editor state warrants it. Do not add alongside another store without a distinct owner. |
| Dexie | `4.4.7` | Optional web IndexedDB draft/outbox storage. Browser eviction means it cannot inherit native durability promises. |
| idb | `8.0.4` | Smaller IndexedDB alternative; choose this or Dexie, not both. |
| tus-js-client | `4.3.1` | Candidate resumable foreground transport; verify RN URI/chunk behavior in the complete implementation. It does not run JavaScript after process death. |
| date-fns | `4.4.0` | Optional formatting/calculation helper. Preserve event instants, original offset, IANA timezone context, and unknowns in the contract. |
| Temporal polyfill | `@js-temporal/polyfill` `0.5.1` | Optional for robust timezone-aware domain operations. Keep formatting separate from source-time evidence. |
| Lucide web/native | `lucide-react` / `lucide-react-native` `1.66.0` | Optional matching icon family; native requires compatible `react-native-svg`. |
| Web map renderer | `maplibre-gl` `6.16.0` | Use directly, with an optional `react-map-gl` `8.1.3` wrapper. Keep renderer ownership in one map component. |
| Native map renderer | `@maplibre/maplibre-react-native` `11.5.1` | Use with an Expo development/release build and its config plugin. Current peers accept Expo >=54, React >=19.1, and RN >=0.80, matching the selected SDK baseline. |

Primary SDK compatibility evidence is the actual shipped [Expo 58.0.22 bundled module matrix](https://unpkg.com/expo@58.0.22/bundledNativeModules.json) and [current default template 58.0.31 package metadata](https://registry.npmjs.org/expo-template-default/58.0.31). The [SDK 58 release notes](https://expo.dev/changelog/sdk-58) establish the release and native toolchain change. Use `expo install` and `expo-doctor` during implementation rather than independently maximizing every native package version.

| Native dependency | Expo 58.0.22 supported selection | Purpose |
|---|---|---|
| `expo-sqlite` | `~58.0.15` | Durable records and outbox. |
| `expo-file-system` | `~58.0.13` | App-owned original files and resumable-transfer state references. |
| `expo-camera` | `~58.0.14` | Foreground photo and bounded video capture. |
| `expo-audio` | `~58.0.11` | Voice recording and audio playback. |
| `expo-video` | `~58.0.13` | User-started video playback. |
| `expo-image-picker` | `~58.0.10` | Selected media import. |
| `expo-document-picker` | `~58.0.4` | Explicit audio, GPX, and FIT selection. |
| `expo-location` | `~58.0.20` | Bounded foreground fix. |
| `expo-secure-store` | `~58.0.2` | Session secrets, not bulk content. |
| `expo-background-task` | `~58.0.12` | Opportunistic deferred sync. |
| `expo-image` | `~58.0.18` | Native image display and governed cache. |
| `expo-image-manipulator` | `~58.0.16` | Optional local preview transformation. |
| `react-native-reanimated` | `4.7.1` | Native animation, with compatible Worklets. |
| `react-native-worklets` | `0.13.0` | SDK pin, although registry latest is `0.13.1`. |
| `react-native-gesture-handler` | `~3.3.0` | SDK selection, although registry latest is `3.4.0`. |
| `@react-native-community/netinfo` | `12.0.1` | Network state and Wi-Fi policy. |
| `@shopify/flash-list` | `2.3.2` | Optional large native lists; registry latest is `2.3.3`. Start with FlatList unless needed. |

The SDK bundle has a newer BackgroundTask recommendation than one cached docs page, which displayed `~58.0.11`. Prefer the shipped SDK package matrix and validate it during install. This is why versions must carry a date and source rather than being presented as timeless facts.

## Native storage and sync design

For each capture, assign a client-generated identifier, copy completed media into app-owned persistent storage, and commit its metadata, checksum state, destination, and queued operation to SQLite. Claim a completed save only after both file persistence and the metadata transaction succeed. Reconcile an interrupted filesystem/SQLite boundary at startup. Never retain only a picker cache path or content URI that can expire. Neither file copy nor SQLite commit can make a two-resource transaction atomic by themselves, so use staged states and startup repair.

The [SQLite documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) provides persistent database APIs. The [FileSystem documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/) supplies app file access. The [DocumentPicker documentation](https://docs.expo.dev/versions/latest/sdk/document-picker/) covers files from device providers. These are the building blocks, not a turnkey guarantee that Kairn capture is durable.

Queue metadata commands with client operation IDs and expected server revisions. Resume uploads using persisted upload IDs and offsets. The server must finalize and verify the upload before the app marks a cloud backup complete. A cancellation pauses/removes a transfer task without deleting the last original. Maintain distinct local-save, queued, uploading, private-cloud, contributed, and published states.

Foreground sync runs when the app opens or connectivity returns. The scheduler may perform bounded work later. Android force-stop and vendor battery behavior can prevent it until restart. The [BackgroundTask documentation](https://docs.expo.dev/versions/latest/sdk/background-task/) documents Android WorkManager's minimum periodic interval of 15 minutes and OS control of actual execution. Do not promise immediate or continuous background upload. A JS resumable client resumes across launches only when Kairn persists its metadata and reopens the correct file.

Use a small native Expo module for Android transfer integration only if required after exercising the complete production flow. Keep its contract limited to durable transfer start/cancel/status and platform scheduling. Do not add background location permissions. All native checks are part of the complete product implementation and release qualification; they do not introduce a preliminary reduced-scope product.

## Capture and media constraints

Use the platform selected-media flow as baseline. Wider date scanning stays conditional and is not needed to finish R1. `expo-media-library` is an optional conditional module, not a reason to request broad gallery permissions by default. Preserve raw original files and distinguish original capture time from upload or entry time. Imported media does not receive the device's current coordinates.

The [ImagePicker guide](https://docs.expo.dev/versions/latest/sdk/imagepicker/) documents Android activity loss and `getPendingResultAsync`. Include that recovery path in import qualification. Capture location uses a bounded foreground request and preserves its measured time, accuracy, permission mode, and unknown result. The [Location guide](https://docs.expo.dev/versions/latest/sdk/location/) distinguishes foreground and background behavior; Kairn needs the former only.

Treat EXIF and original-time availability as a native integration question, particularly with Android selected-media access, cloud providers, stripped metadata, and location-related media permissions. A returned media URI does not establish original GPS access. Permission denial must still allow capture/import and a useful story.

Use `expo-audio` and `expo-video`, not the older combined `expo-av` API. Preserve recordings for playback when transcription fails. Normalize supported inputs server-side to declared playback profiles. HEIC/HEIF support is conditional until the actual codec path is verified.

## UI and sharing boundaries

Use MapLibre with MapTiler styles/tiles under the clarified external-service allowance. The current [MapLibre Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/) requires the config plugin and a native rebuild; Expo Go cannot load it. Version 11 uses the New Architecture and its [current setup requirements](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/) fit SDK 58. Use the current `<Map />` API and [v11 migration documentation](https://maplibre.org/maplibre-react-native/docs/setup/migrations/v11/). The [MapTiler native example](https://docs.maptiler.com/react-native/) still shows older `MapView` calls, so it establishes provider compatibility rather than the exact current wrapper API. Keep provider keys scoped to their intended browser/native use and retain licensed attribution. A map renderer's permissive code license does not supply a tile-data license or permission for offline packs.

shadcn/ui supplies source code that the web app owns and reviews. Its [introduction](https://ui.shadcn.com/docs) explicitly describes the code-distribution model. Keep those DOM components in `ui-web`; build native primitives from React Native or stable Expo UI where appropriate. Native does not import Radix DOM components, Motion DOM, or Tailwind browser CSS. Share color, space, radius, and typography tokens with platform-specific output.

Keep animation subtle: opacity/position transitions for panels and selection, with CSS on web and Reanimated on native where useful. Do not make scroll, map animation, or autoplay a prerequisite for reading. Keep map/media code split from the first readable story payload. Use a textual itinerary when maps fail.

Local builds and private CI can compile Expo apps. Neither EAS Build nor EAS Update is a required runtime service. [Expo production build documentation](https://docs.expo.dev/deploy/build-project/) supports local/other-CI builds, and the [local compilation guide](https://docs.expo.dev/guides/local-app-development/) describes native project generation. App stores remain external distribution systems if used. Native push would depend on platform delivery systems; defer optional push and use in-app notifications unless specifically selected.

## Required integration and release checks

- Offline completed captures survive process kill, device restart, low storage, and interrupted file/SQLite commits. Android picker activity recreation recovers a pending result.
- Selected local/cloud media retain the best available original bytes and time/location provenance. Expired access identifies the affected item without restarting a whole batch.
- Queue replay after session expiry, Wi-Fi changes, cancellation, and duplicate requests creates one logical moment. Persisted uploads resume across an app restart without keeping whole videos in JavaScript memory.
- Five editors with stale revisions preserve both conflicting candidates. Query invalidation does not overwrite an unsent local edit.
- Server-rendered public HTML and social metadata contain only approved viewer data. Unpublish/withdrawal blocks old HTML, covers, media ranges, cached answers, and old share URLs at the managed endpoints.
- Browser draft storage remains best effort unless persistent-storage behavior has been demonstrated for the supported browsers. Do not silently give it native capture guarantees.
- Reanimated, Worklets, maps, media, and authentication native modules pass SDK 58 New Architecture builds and real target-device tests. Minimum Android version follows those tests and the SDK/toolchain support floor.
- Inspect logs, crash reports, and analytics for media, transcripts, coordinates, and unlisted tokens. Do not send those to an observability SaaS while describing the deployment as fully self-hosted.

## Open decisions

1. The final architecture selects stable dependencies and defers Start's current Nitro RC path. Revisit the adapter when its selected deployment route meets that policy.
2. External maps and AI are approved. Optional EAS builds, OTA update hosting, native push, and third-party analytics remain independent decisions; the baseline does not require them.
3. What target Android devices and upload sizes govern storage reserve, concurrency, multipart/chunk size, and foreground-transfer behavior?
4. The final architecture includes web unsent-edit persistence with explicit browser-eviction/file-reselection limits. The native files/SQLite path owns the stronger Android capture durability guarantee.
5. Expo's mobile TypeScript baseline currently differs from latest TypeScript. Adopt latest only after the actual mobile CLI/build integration passes, and record any SDK-constrained exception.
