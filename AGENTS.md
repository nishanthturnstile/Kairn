# Kairn development guidance

Read `docs/README.md` for the documentation map. Requirements in `docs/core/product_requirements.md` govern functional scope. `docs/core/architecture.md` section 14 is the canonical dependency register; `DESIGN.md` is the active design/workflow hub; `docs/core/application_design.md` retains functional screen responsibilities. The setup/mobile plans under `docs/implementation/` govern the foundation and host workflow. Dated research can contain superseded alternatives.

## Approved design baseline — 6 November 2026

Fieldwork 1.0 is selected by the user, replacing Gather. Start at `DESIGN.md` and `docs/design/fieldwork-system.md`; use `design/fieldwork.pen` and the catalogue/tokens under `design/fieldwork-system/`. Superseded design systems and temporary exploration research are removed after preserving required contracts and provenance. Do not inherit old application styling. The neutral connected wireframes remain functional references only. Record future customization as a deliberate baseline revision. Visual approval does not waive accessibility, permission, durability or platform acceptance checks.

## Testing scope

Keep tests focused on mandatory acceptance gates and critical failure or durability scenarios. Prefer a small integration test against the real boundary over many mocked cases. Do not add tests for routine reversible edits, configuration values, or behavior already proved by another check. Record the chosen coverage and executed results in the relevant implementation progress document; expand coverage when a concrete requirement or regression warrants it.

## Verification records and publication

Use the current checkpoint in `docs/implementation/repository_setup_progress.md` as the setup status source. Historical execution snapshots under `docs/research/repository-setup/` preserve provenance; resolved failures and old source-transfer notes are not current prerequisites. Keep the setup plan, mobile plan, host guide, and checkpoint consistent when acceptance closes, and distinguish completed foundation work from future product/release gates.

Follow [the checkout workflow](docs/implementation/checkout_workflow.md): feature/fix/chore branches start from current `development` and target `development`; reviewed integration checkpoints promote to stable `main`. Recheck the actual PR/base state before publishing a follow-up; never push new work to the former branch of a merged PR. Promotions use the exact checked development commit and a non-forced fast-forward where allowed, preserving identical main/development heads. Keep branch protection intact. Tie CI/native evidence to actual inputs rather than borrowing an earlier pass.

Use one authoring checkout per task: Windows for the immediate Android loop, WSL for the immediate Compose/backend/web loop, Mac for iOS/native-specific work. Other hosts consume committed/pushed checkpoints with `pnpm checkout:sync --branch NAME --commit FULL_SHA`; `pnpm checkout:status` inspects locally. No automatic dirty sync, reset/clean/stash or dependency/native-output transfer. Stop builds/Watch before changing source. Preserve host-local environment/signing files and synchronize exact source commits, not folders. The helper's backups/evidence under `.kairn/` are private and ignored.

Direct Compose tooling runs must build the current checkout into the image (`run --build` or an immediately preceding explicit build). A cached tooling image can contain an older source snapshot even when the host checkout is current; verify the actual container inputs when recording capacity or acceptance evidence.

## Skills

The configured native checkouts and commands are recorded in `docs/implementation/native_host_setup.md`. In the Windows checkout, activate `. .\.kairn\env.ps1` in PowerShell before Node/pnpm/Android commands; on the Mac, use `. .kairn/env.sh`. These ignored host-local files select the project's pinned tools without changing global defaults. Keep Compose in WSL and native dependencies/Metro/build output on their owning OS. T3 device tools act in the agent thread's environment; use a Windows agent for its local Android emulator.

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
