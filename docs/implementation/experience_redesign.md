# Complete journey experience redesign

4 November 2026. Active implementation record. This supersedes the P02 visual direction and its stop-at-P02 constraint, following the founder's complete redesign brief. Product requirements, source rights, production gates and the selected stack remain authoritative. Windows is the single authoring checkout for shared/web/native source; Compose verification remains in WSL.

The [design system and product experience redesign plan](design_system_redesign_plan.md) defines the remaining DS01–DS12 sequence, component inventory, web/native contracts, production dependencies and acceptance criteria. This record owns executed evidence; the plan does not mark pending implementation complete.

## Audit and preservation

The prototype branch contained create/join/revisit, actor projections, audience selection, pending/error specimens and a reader placeholder. Its permanent desktop sidebar, repeated rounded panels and oversized cover obscured chronology and gave discovery, editing and reading the same hierarchy. The reader could not tell a story. No discovery, chapter exploration or practical-information navigation existed. The library mixed personal journeys and a sample without a clear reading destination. Motion and theme roles were incomplete.

Current development separately contains real account screens, identity/access boundaries and database commands. This task starts at development e2e40cc and integrates prototype 1f0d189; it must preserve both. Authentication, grants, restriction handling, input retention, domain transactions and account routes are not replaced with sample implementations. The existing test suite remains the regression boundary.

## Research and limits

Public sources reviewed on 4 November 2026:

- [Polarsteps travel tracker](https://www.polarsteps.com/travel-tracker): sequential stops connect media and geography. Borrow continuity; reject continuous tracking as it conflicts with Kairn's selected-import model.
- [Komoot collections](https://www.komoot.com/premium/personal-collections): group related routes and highlights for return visits. Kairn instead preserves one canonical journey and attribution.
- [Strava features](https://www.strava.com/features): route/point-of-interest information supports action. Performance and competitive metrics should not define a shared travel story.
- [AllTrails map layers](https://support.alltrails.com/hc/en-us/articles/37228180990228-AllTrails-map-types-overlays-and-extras): purposeful map layers are useful; do not present controls without working data.
- [Relive](https://www.relive.com/app): route progression provides a legible narrative. Kairn should allow stopping, reading and choosing chapters instead of requiring video playback.
- [Awwwards travel catalog](https://www.awwwards.com/websites/travel/): used as an inspiration index, not proof of usability. No authenticated Mobbin/Behance research or competitor hands-on tests claimed.
- Patagonia Stories search results suggest subject-led editorial groupings; direct fetch timed out. NPS map reference was inaccessible. These are research limitations, not inspected visual references.

Research answers: premium means consistent decisions and trustworthy states; adventure comes from specific content, not texture everywhere. A journey needs a short synopsis and a chapter index before deeper detail. Geography and time share a selected chapter, not a competing viewport. Motion should follow user intent and preserve location. Tactility comes from type, scale and material photographs, not fabricated paper grain. Essential content must survive without maps or photographs. Delight comes from finding an unexpected detail without losing one's place.

## Three creative directions

1. **Travel album / tactile organic.** Warm limestone, deep brown, muted ochre; intimate serif captions, soft daylight photographs, low-contrast relief maps, rounded album windows, page-like crossfades. Welcoming for memory, but easily sentimental and too quiet for dense editing. Reject ornamental paper textures.
2. **Expedition editorial.** White and charcoal with signal red; large editorial headlines, documentary crops, restrained terrain, asymmetric spreads, decisive cuts between chapters. Strong emotional entry; risky for long editing sessions and low-light contrast transitions.
3. **Open atlas / selected.** Mineral white, deep blue, slate and pale blue-grey; expressive Newsreader titles paired with Instrument Sans for controls; photographs have their own space, never carry essential text. A horizontal journey index and an adjacent chapter establish place and time. Maps are explicitly opened, with solid/dashed/dotted evidence and gaps. Controls are compact, surfaces broad and calm. State transitions use short fades, with no scroll hijack or automatic camera motion.

Seven grounded references considered: travel albums, expedition magazines, public-library atlases, museum oral histories, railway timetables, contact sheets and coastal field guides. Impeccable seed 400a4599 assigned candidate three. Origami and raku challengers lose product clarity as literal interfaces; retain their discipline of recoverable discrete steps and honest material boundaries, not their motifs. Founder authorization replaces a concept approval round.

The existing fonts survive because their readable interface/editorial distinction fits the selected direction, not because they were already installed. Replacing them adds downloads and native rebuild risk without a demonstrated benefit. Color, topology, navigation and viewer composition change substantially.

## Architecture and implementation sequence

1. Reconcile current development and prototype without dropping account functionality.
2. Introduce semantic theme and motion foundations, with legacy token compatibility.
3. Replace the sidebar with a compact product navigation; distinguish Discover, Your journeys and the reader.
4. Build a chapter reader with Story/Explore/Learn, explicit map action, evidence legend, practical detail sources and keyboard-accessible chapter selection.
5. Extend native with the same focused reading sequence and preserve create/join/contribution specimens.
6. Verify the actual merged inputs, bounded responsive review and permission regression checks; document unimplemented production boundaries.

## UX contracts

Discover is a bounded catalog, one entry per journey. Filters never invent results. Personal history owns drafts and invitations. Reader is accessible without joining a sample journey. Story, Explore and Learn keep the selected chapter. Mobile focuses on one surface at a time; desktop pairs chapter navigation with content. Text chronology remains usable when a map is unavailable. No route geometry is inferred from missing GPS.

Capture groups selected media by date, with explicit unknown dates, selectable group boundaries and a preview before contribution. Minimal editing is a valid finish. Editing a chapter must leave other contributors' sources untouched. Publishing is a separate review operation, never a side effect of saving. Collaboration displays contributor attribution and source permission separately from journey roles. These contracts guide future real capture/publication delivery; sample UI does not establish durability or access enforcement.

## Component specification

Use existing semantic native controls and web accessible primitives. Buttons retain labels while pending, indicate busy, and guard repeat activation. Inputs retain data on failure with associated help/error text. Selection uses native radios/selects or aria-pressed buttons with visible selected text. Dialogs require focus return, Escape and protected focus; ordinary details use disclosure. Tooltips never hold essential instructions. Menus require native keyboard behavior. Notifications are polite live regions; destructive operations explain scope and recovery. Do not implement unused variants merely to fill a catalog.

Product components: chapter selector (date, title, evidence, selected state), journey cover (separate title and media, missing-image fallback), route summary (explicit gaps and textual alternative), practical detail (observation, date, contributor, source), source audience selector (private/review/publication), contribution row (owner and review state), and publish review (permission exclusions before action).

All controls: 44 CSS px web / 48 dp Android; visible keyboard focus, text wrapping, 200% text accommodation and reduced-motion support. Layout: compact <768, medium 768–1199, wide ≥1200. Reading width ≤70ch. Shapes: small controls, medium media and grouped surfaces; no nested card grids. Spacing uses shared 4-point scale. Daylight canvas is the default for outdoor readability; dark reader is user-selected. Map evidence never relies on color alone.

## Scenario acceptance and remaining gates

The five founder scenarios require real selected import/durable save, group contributions, public reader, dated practical information and revision-safe editing. Reader prototypes can demonstrate chronology, no-GPS days, chapter switching and knowledge navigation. They cannot prove capture, publication, collaboration security or revision durability. Production release additionally needs all R1 backend integrations, genuine licensed journey media, live map integration, device evidence on Android/iOS, screen-reader review and performance measurements. Do not mark this record production-ready before those pass.

Executed verification and exact limitations are recorded below as work proceeds.

## Implemented checkpoint and verification

Application checkpoint: `d285e27cd2d9e67ad0527a2c248803a68eab0563`, branch `feat/product-experience-redesign`. This is an active, incomplete redesign, not full-product or production-ready acceptance.

- Shared mineral/blue foundations, semantic light/dark roles and motion durations; compatibility keys retained for current web/native/account consumers.
- Horizontal product navigation, with sample/design controls in a disclosure. Compact navigation was revised after inspecting the phone layout.
- Discover: one honestly labelled sample journey, place/text and activity filters, explicit empty results and reset.
- Reader: four chapters, Story/Explore/Learn, retained chapter selection, dated practical observations, source-chapter navigation, explicit route-context action and an illustrative evidence diagram. The reader fixture is separate from private source state.
- Creator: existing create/join/revisit retained; moments filter by day and visibility; caption editing has one-step undo; people show distinct powers; review explains publication eligibility without issuing fake links. These remain session-only samples.
- Native: focused chapter reader and practical details using Unistyles; existing creation and audience controls remain. Runtime inspection is blocked, not passed.

| Check | Actual result and limits |
|---|---|
| Windows package/API builds | Passed. Initial direct web build failed on stale compiled package exports; rebuilding packages resolved it. |
| Web TypeScript, native TypeScript, targeted Vite+ lint and boundaries | Passed on authored changes. No compiler strictness relaxed. |
| Existing prototype regression | 14/14 passed, including actor/source projections and continuations. |
| Broader Windows test run | 62/64 passed; two existing restriction-journal tests fail with `EPERM: fsync` on Windows. Do not treat this as a complete pass. |
| Fresh Linux tooling image, source `2d6182202c4d3d60b9fde2d123019a018de1acd4` | `docker compose run --build --rm --no-deps tooling pnpm test`: 64/64 passed. Subsequent d285e27 changes affect only shell composition/CSS; they received web type and final browser checks. |
| Final browser input | WSL checkout and rebuilt server at d285e27. Container shell/experience/workspace SHA-256 matched the authored files; runtime source was not borrowed from an old image. |
| Reader interaction | Rest day, view selection retention, explicit route opening, visible unknown gap, practical filter and source chapter exercised. |
| Responsive | Headless Edge measured 1440, 390 and 320 CSS px, no document overflow; desktop/mobile inspected. This is responsive web evidence, not native/tablet qualification. |
| Automated accessibility | Axe WCAG 2 A/AA, 2.1 AA and 2.2 AA tag scans: no violations for tested reader states at all three widths and dark reader. Not a complete WCAG conformance claim; screen readers, maximum text scaling and all account/creator states remain unverified. |
| Discovery and creator | Native select filtering, clear/reset, search empty state, create/revisit, caption save/undo and administrator-only edit denial passed in headless browser. |
| Color calculations | Light body 13.12:1, secondary 7.37:1, action 9.01:1; dark body 14.76:1, secondary 8.27:1, action 10.39:1. These are named semantic pairs, not every possible overlay. |
| Android | Initial id became stale; refreshed list/open found Pixel_10. Launch then returned DEVICE_IN_USE for another session. No takeover, screenshot or runtime pass claimed. iOS not exercised. |
| Performance | Reader chunk about 12 kB before gzip in build output; route context creates no map/network dependency. Existing generated cover is 2.69 MB, so image derivatives and genuine licensed media remain a release blocker. No CWV/device-performance pass claimed. |

Private evidence: Windows `.kairn/verification/redesign/browser.mjs`, `browser.json`, `contrast.json`, and reader screenshots; WSL `.kairn/verification/redesign-test.log`, `redesign-final-sync.json` and `redesign-final-server.log`. The first axe harness attempt needed an explicit browser context; corrected before reported results. Shared preview automation repeatedly timed out on reset, so final checks used the permitted headless fallback.

Host reconciliation: the WSL ignored `tools/identity-generation` directory contained only its host-local `node_modules`. Preserved the complete directory under `.kairn/checkout-backups/redesign-pre-sync/` before exact-commit sync; no dependencies crossed hosts. Current development requires identity migrations missing from the older foundation database. Followed the documented existing-volume principal/migration procedure without dropping data; API, worker and supporting services returned healthy. No account provider or public deployment was activated.

## Work still required for the complete brief

1. Real selected-media/GPX/FIT import and durable capture UI against its protocol; grouping, recovery, progress and offline behavior need real boundary tests.
2. Full chapter/revision editing, collaboration invitations/conflicts, publishing/sharing and profile/library flows backed by authorized APIs, beyond sample caption controls.
3. Genuine licensed travel photography with responsive derivatives; Mapbox integration and authorized real overlays, explicit map action, failure fallback and playback. 3D remains outside the governing R1 baseline.
4. Complete cross-platform component specimens and native counterparts for newly connected flows; remove remaining legacy primitive-name aliases when consumers migrate.
5. Native Android/iOS/tablet runtime checks, screen-reader and text-scale review, broader responsive/accessibility coverage, media performance and representative user scenario sessions.

The founder's five scenarios are therefore not all accepted: the public-reader and learning interactions have prototype evidence; capture, secure group contribution and revision-safe production editing remain incomplete. Do not promote this checkpoint as the finished redesign or erase these gates.

## Detailed planning update

The 4 November follow-up request adds the DS01–DS12 plan linked above. It inventories core, advanced and journey components; defines shared web/native contracts; maps the required screens to implementation and backend dependencies; and specifies migration, motion, media, accessibility, five end-to-end scenarios and production handoff. DS01 begins with a complete consumer inventory and representative form/editor/reader compositions. The new milestones remain unstarted; this documentation update does not change application acceptance.

Planning verification: checked all 53 local document links across the plan, index, DESIGN.md and this record; confirmed twelve ordered milestones with exit criteria and all five founder scenarios; reconciled the screen mapping with application design and corrected W07 to revision/conflict. `git diff --check` passed. No application tests were rerun for this documentation-only change.
