# Repository cleanup and structure review

Date: 6 November 2026. Scope: remove superseded application prototypes and review tracked structure plus the local workspace folders. This is a source/dependency review, not a full security, production or native-runtime audit. Fieldwork 1.0 remains the sole approved visual baseline.

## Changes

- Removed both apps' prototype implementations, web/mobile routes, generated fixture/font/image copies, fixture generator scripts and prototype-only tests.
- Removed the development-only account/journey specimens, their server flag/route, navigation links, unused access/journey pattern components, dialogs and other prototype-only controls.
- Removed `.impeccable/design.json`, which still declared the superseded Open atlas system. Preserved Fieldwork's editable library, catalogue, tokens, registry, qualification and licensed reference image; neutral functional wireframes remain functional references.
- Regenerated the web route tree through the actual build. Removed prototype links from native stack/status and web home/root. Removed unused shared prototype reader selection logic.
- Kept the real account profile conflict regression from the former design-system suite as `tests/integration/account-ui.test.ts`, configured by `config/integration/vite.account-ui.config.ts` and `pnpm test:account-ui`. Real auth/account services, contracts and accessibility checks in the account service suite remain.
- Moved the layout CSS used by the real account screen into its own account stylesheet, renamed specimen selectors and removed demo-only rules.

## Folder purposes and deletion guidance

| Location | Purpose / decision |
|---|---|
| `.kairn/` | Ignored, private host working data. Keep the folder; it is not application source. `env.ps1` selects pinned Node/pnpm/JDK/Android tools. `p/` is the live Windows pnpm virtual store. Removing it breaks dependency resolution until reinstallation. |
| `.kairn/checkout-backups`, `safety`, `verification`, acceptance snapshots | Recovery backups and recorded verification inputs/results. Preserve unless deliberately retiring their recovery/evidence value. Old logs and temporary helpers may be pruned selectively after checking ownership; no bulk deletion was performed. |
| `.kairn/accounts/` when configured | Private local server/worker credentials and runtime configuration; do not publish or delete without a deliberate runtime reset. This path is used by setup scripts even if absent on this host. |
| `config/integration/` | Vite+ configurations selecting separate web, data, identity, domain, account-service and account-UI suites, with their timeouts/concurrency. Required by root scripts; keep. |
| `config/mobile-lint/` | Separate mobile lint configuration avoiding the root's TS7 type-aware lint path; Expo uses its documented TS6 compiler. Keep. |
| `config/client-boundary.ts`, `lint-rules.ts` | Enforce browser/server dependency isolation and shared lint policy; keep. |
| `apps/mobile`, `web`, `server`, `worker` | Native app, web client/SSR reader, HTTP process and durable worker process. Keep their runtime functionality. |
| `packages/backend`, `contracts`, `shared`, `sync-protocol` | Database/domain implementation, generated API boundary, platform-neutral logic and versioned sync protocol. Migrations and generation snapshots are functional records, not old designs. |
| `packages/design-tokens` | Currently required by the live account/status UI on both platforms. See the Fieldwork gap below; deleting it now would break working application imports. |
| `design/`, `docs/` | Approved Fieldwork source/provenance and governing functional/implementation records. Historical execution evidence is retained and is not visual authority. |
| `infra/`, `scripts/`, `tools/`, `.github/` | Compose/images/database roles, development/verification scripts, isolated schema generators and CI. Keep. |
| `.agents/`, `patches/` | Versioned project guidance and qualified dependency declaration fixes. These are not application prototypes. Keep. |
| `node_modules`, ignored `dist`, `.expo`, native `android`/`ios` outputs | Host-local dependencies/build outputs. Reproducible, but removing them requires reinstall/regeneration/rebuild; preserve host-local environment/signing files. No cache purge was requested or performed. |

## Remaining issues / follow-up

1. Fieldwork is designed but not yet implemented in the applications. Required runtime tokens, controls and fonts still come from the earlier application UI (Instrument Sans/Newsreader rather than Geist/Fraunces). Retained only to keep working account/status behavior usable. They have no visual authority; replace them together in a deliberate Fieldwork implementation and qualify accessibility/native behavior before removing the compatibility layer.
2. `.kairn/` contains historical prototype helpers/logs and other private task output. These are ignored records, not live routes or shipped source. Keep dependency store, tool activation and recovery/evidence separate from any later selective local-cache cleanup.
3. The synthetic `/setup/reader` and connection/status screens remain foundation acceptance harnesses: SSR hydration, request isolation and native/API connectivity depend on them. They are not the removed interaction/design prototypes. Retire them only when replacement acceptance coverage exists.
4. The Windows shared suite reports `EPERM: operation not permitted, fsync` in the unchanged restriction journal's directory flush. Backend/Compose verification belongs on WSL. Preserve the durability operation and repeat that gate on its owning host; do not weaken it to make a Windows run pass.

## Verification

Coverage uses existing real build, import/type boundaries, the server route boundary and one preserved real account form regression. No mirrored prototype or configuration-value tests were added. Evidence applies to the current working tree, not a pushed commit or earlier native binary.

- Web client + SSR build and declaration generation: passed; fresh API/client drift generation and shared package builds passed.
- Rebuilt server package and route suite: passed, 5 tests; retired account-specimen/prototype endpoints are unavailable.
- Real account UI regression: passed, 1 browser test; profile conflict retains the attempted edit.
- Shared suite on Windows: 47 passed, 2 failed in unchanged restriction-journal directory fsync (EPERM).
- Workspace dependency/public-export/client/server boundary scan: passed.
- Web/server TypeScript and mobile compiler/dependency checks: passed; Expo Doctor passed 20/20. Mobile TypeScript also passed after the final unused-control removal.
- Targeted web/server/shared/test/config Vite+ lint/type check: passed without warnings; separate mobile lint passed.
- No Compose integration, APK/iOS build or device interaction is claimed by this cleanup.

- Final repository formatting check: remaining failures are three unchanged approved design artifacts (`design/fieldwork-system/catalog.json`, `tokens.json`, `verification.json`). README formatting was corrected. No Fieldwork artifact bytes were changed by cleanup.
- Final source search found no prototype/specimen references in app/package/script/config implementations; the only test references are the assertions that retired prototype URLs return 404. Historical documentation and ignored private evidence remain.
