# Kairn development guidance

Read `docs/README.md` for the documentation map. Requirements in `docs/core/product_requirements.md` govern functional scope. `docs/core/architecture.md` section 14 is the canonical dependency register; `docs/core/application_design.md` governs design. The setup/mobile plans under `docs/implementation/` govern the foundation and host workflow. Dated research can contain superseded alternatives.

## Skills

Project skills live in `.agents/skills/`. Read `docs/implementation/development_skills.md` for the inventory and `.agents/skills-manifest.json` for upstream source commits. Skills for later workstreams are installed now; select only the skills relevant to the current task. The `kairn-architecture`, `kairn-capture-sync`, and `kairn-publication-access` skills carry project-specific guidance.

Apply user decisions and the current project documents when a generic skill example differs. In particular:

- Mobile uses Expo/React Native and **Unistyles v3**, with the New Architecture and an exactly pinned Nitro Modules dependency. **Do not use NativeWind.** Web uses Tailwind/shadcn. Share plain design tokens, not DOM components or native styling dependencies.
- Configure Unistyles before importing Expo Router. The planned mobile layout is `apps/mobile/src/app` for routes and `src/screens`, `src/components`, and `src/theme` for implementations. The Babel plugin covers `src`; the experimental Metro integration is not selected.
- Use local compiled development builds from the foundation onward. Unistyles and Mapbox require native code; Expo Go does not qualify this app. EAS subscriptions, cloud builds, cloud simulators, and paid Apple membership are not development prerequisites. Native UI skill examples do not authorize adding `@expo/ui` or another UI framework to the selected stack.
- Windows/WSL hosts Compose; Windows native hosts Android/Metro; the Mac hosts iOS/Metro. Keep dependencies and generated native output local to each OS. Use T3 device tools for agent UI interaction when available, following the session's device instructions.
- Vite+ owns web/server tooling and tests. Adapt generic Vitest examples to `vite-plus/test` and the selected bundled version; do not add a separate test runner, formatter, linter, or monorepo task stack.
- Preserve the documented web/mobile React and TypeScript version exceptions. A generic monorepo skill's single-version rule must not override the Expo SDK or generator compatibility rules.
- TanStack Query owns fetched server state. Durable capture files, SQLite, pending commands, and resumable transfers have their own protocol. Query persistence is not proof of capture durability.
- Better Auth owns authentication. Journey capabilities, source/export grants, publication versions, and revocation are server-side domain rules; an organization plugin is not the journey model.
- React skills may assume Next.js, RSC, or SWR; Hono skills may assume a newer Hono major/prerelease CLI. Use the actual selected versions, React renderer, OpenAPI clients, and TanStack Query. Mapbox's Swift/Kotlin skills explain native SDK behavior; the app integration remains `@rnmapbox/maps`.
- AI work uses server-side AI SDK/Gateway calls and buffered, validated answers. Generic agent/chat examples do not add tools, streaming exposure, provider routes, or client chat hooks to the product.

Keep vendored upstream skills intact when making project-specific changes; update this file, the local Kairn skills, or the governing documents. Some upstream links assume their source monorepo layout. Resolve another installed skill by its frontmatter name under `.agents/skills/` when a relative cross-package link does not resolve. Installing a skill is not evidence that its application integration has passed, and does not itself install runtime packages.
