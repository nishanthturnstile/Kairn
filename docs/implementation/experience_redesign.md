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

## Component-system implementation — 4 November 2026

Authoring branch: `feat/design-system-redesign`, based on current development `d07a69508d98afecb5c9d1b9003956d1db1fa236`. This supersedes the earlier “new milestones unstarted” planning status above. The complete redesign is **not accepted**: DS01–DS05 now have implemented work and web evidence; device and production dependencies remain open. The [component guide, inventory and screen traceability](design_system_catalog.md) assigns every plan section 7 family and A/W/P screen a disposition.

Implemented:

- Expanded semantic light/dark roles for feedback, review, controls, dividers, elevated surfaces and scrims; shared control dimensions and unitless media ratios.
- One web theme adapter used by prototype and real account surfaces, a pre-mount appearance initializer, and device/Light/Dark preferences. Native now registers both Unistyles themes and persists an explicit preference separately from auth. Navigation and status-bar appearance follow the active theme.
- Canonical platform Buttons, icon controls, fields, Input/TextArea, selection and segmented navigation. Secondary now means a bordered alternative on both platforms. Web small/icon variants meet the 44px floor; native controls use 48dp minimums and growing text.
- Real native account buttons and inputs delegate to the system while retaining their refs, callbacks and form state. Web account buttons consume the same component as prototype actions; password/profile submit labels remain stable while pending.
- Matched, interactive, photography-free catalogs with long content, optional/help/error, pending, disabled/read-only, selected, permissions, persistent failure and confirmation examples. Shared state contracts are platform-owned rather than fixture-coupled rendered components.
- Extracted ChapterNavigation, PracticalDetail and Media on both platforms; readers consume them. Missing/failed media has a text fallback; chapter/source navigation and explicit route-diagram behavior remain.
- Removed superseded catalogs, prototype button/field CSS, and duplicate native prototype font loading. Retained wrappers and CSS aliases have named consumers/removal gates in the ledger.

Consequential corrections during implementation: unique audience radio-group names; reachable segmented radio hit areas; explicit appearance labels; long-button wrapping under scaling; profile form explicitly submits after Button adopted a safe non-submit default; real account revision-conflict draft retention tested; native dialog safe Cancel focus and trigger-return requests implemented. Native focus remains unverified on a compiled device. Reader screenshots are captured after clearing focus and returning scroll to the top.

| Milestone | Current status | Remaining acceptance |
| --- | --- | --- |
| DS01 | Implementing | Complete family/screen disposition and specimen source exist. Component-reference text research is recorded; geographical/visual reference calibration and native composition inspection remain. |
| DS02 | Implemented awaiting verification | Shared mappings, web/native adapters and preference behavior exist. Native runtime/contrast/screen-reader qualification and legacy-alias retirement remain. |
| DS03 | Implemented awaiting verification for initial controls | Core batch works in web catalogs and existing consumers; native source/Metro passes. Date/time, unused advanced controls and actual native interaction gates remain as inventoried. |
| DS04 | Implementing | Browser confirmation focus/Escape/return accepted. Native picker/dialog source implemented; native focus/back/keyboard checks and advanced real-consumer patterns remain. |
| DS05 | Implementing | Chapter/practical/media components extracted and both catalogs work at source level. Full product pattern layer, long real journeys and native visual parity remain. |
| DS06 | Implementing on existing sample reader | Migrated primitive/product components; reader interaction evidence retained. Actual authorized reads/maps/derivatives, all-days/direct-link/return restoration, genuine media and supported answers remain open. |
| DS07 | Blocked for connected UX: real durable capture/import/revision adapters | No fake durable confirmation, transfer queue or conflict service was added. |
| DS08 | Blocked for connected UX: actual journey capability/grant/publication/lifecycle transports | Existing source projection and real account authority contracts preserved. No generated public links. |
| DS09 | Implementing existing supporting surfaces | Real account controls/themes migrated; eligible discovery/private history/saved research/public profiles need their services. |
| DS10 | Implementing foundations only | Reduced-motion CSS and native no-animation overlays exist. Genuine derivatives, device/network performance and numeric budgets remain open. |
| DS11 | Implementing limited web checks | Catalog/reader/real-form transport tests pass; five production scenarios and representative participant/device/screen-reader research are unaccepted. |
| DS12 | Implementing migration documentation only | Removed known duplicates; maintained extension and alias ledger. Production fixture isolation, remaining aliases, CI and release/native handoff still require closure. |

### Executed evidence for this component batch

Inputs are the named development base plus the authored source delta recorded in ignored `.kairn/verification/design-system/inputs.json` (public source hashes and built manifests; no environment/credential files). The final checkpoint ID is available from the feature branch history. Runtime tests use the actual built Windows web client through an isolated loopback harness. The harness has no real database/account service; its real-profile test deliberately uses contract-validated transport fixtures to prove click → submit → PATCH/If-Match → retained conflict draft, not account-service security.

| Check | Result / practical limit |
| --- | --- |
| `pnpm build:web` | Passed shared/API prerequisite builds, client build, approved-reader SSR build and declarations. Final client rebuilt after review fixes. |
| `pnpm --filter @kairn/web check` and targeted Vite+ check | Passed; no TypeScript/lint warnings or errors. |
| Native TypeScript/Expo check and Vite+ mobile lint | Passed; 20/20 Expo checks. Final log `.kairn/verification/design-system-native-check.log`. |
| Android/iOS Metro exports | Passed from final source, `.kairn/verification/design-system-mobile-final.log`; Android/iOS metadata and HBC outputs remain OS-local. This is not a native build/install/runtime pass. |
| Built-client integration | 3/3 passed, `.kairn/verification/design-system-review-fixes.log`: retained fields, pending repeat prevention, arrow-key selection, dialog safe focus/trapping/Escape/return, appearance persistence without resetting current draft; actual profile form submit/revision-conflict draft retention; reader rest-day route gap, Learn/source chapter. |
| Responsive/accessibility catalog matrix | 320/390/820/1440 CSS px, light/dark: no document overflow, no undersized enabled buttons, no axe WCAG A/AA-tag violations in the catalog states tested. `browser.json` and `catalog-{appearance}-{width}.png` are private evidence. This does not certify all controls, real account states or WCAG conformance. |
| Text-growth stress | CSS `zoom:2` at 820 CSS px scales all catalog content without overflow. `catalog-text-growth.png`. CSS zoom does not change media-query breakpoints; browser-UI zoom, text-only scaling and reader scaling remain separate open acceptance. The earlier root-font-size-only capture is superseded and was not full text-growth evidence. |
| Reader visual confirmation | `reader-dark-390.png` reset to document top with cleared focus. No map SDK is loaded; the route context remains explicitly an illustrative diagram. |
| Prototype actor/source isolation | 14/14 existing tests passed. Backend/recovery tests were not unnecessarily rerun for presentation changes. |
| Boundaries / formatting / whitespace | Workspace boundaries passed; targeted Vite+ formatting and `git diff --check` passed. Existing Vite+ tooling retained. |
| Mechanical design detector | Changed system CSS scan returned `[]`. Native was not scanned by the DOM/CSS detector. |
| Independent review | Initial disposition fix: caught implicit profile submission regression, native modal focus implementation gap and overstated mixed-unit scaling evidence. Corrected in one batch with profile regression coverage and clean captures. Final fix-list verdict recorded below when returned; this is not whole-product acceptance. |
| Android Device | `device_list`/`device_open` supplied local Pixel_10. Launch returned `DEVICE_IN_USE` for foreign session `t3-7b1a03fb29d76972b9c1d45c`; inspected session list per advice, did not reuse/close it. No device runtime acceptance. |
| iOS/tablet/assistive technology | No final source handoff or new native build/install/session here. VoiceOver/TalkBack, text scaling, keyboard/sheet/back and native appearance runtime remain open. No earlier device pass is attributed to this input. |

No Compose image, production service, public deployment, provider account, schema, source permission or published journey was changed. Host-local dependency output that blocked the checkout helper was moved within this Windows checkout under `.kairn`, then restored after exact-source sync; it was not transferred to another OS. This authoring checkout remains the source owner.

Final fix-list review: profile submission resolved; native focus implementation added but runtime acceptance partial/open; CSS-scaling evidence resolved at its narrowed stress-test scope; clean reader recapture accepted. The reviewer accepted the reviewed web fixes, not DS01–DS12 completion. The subsequent authentication-label source correction now uses `pending` with stable action labels and was included in the final passing build/three-test rerun. Browser: headless Microsoft Edge `156.0.4314.58` on Windows, reduced motion enabled for the catalog matrix. Remaining visual migration drift includes legacy account/global focus styling and differing media crops; those are not silently certified as universal token parity.

Final public-source/build-input manifest SHA-256: `4326e1039c75e37dac6ed2c79a6e22c9b651c3ee6447dc2645e3abcfd7ae67fd`, `.kairn/verification/design-system/inputs.json`. It records modified/new source hashes, the deleted legacy catalog, web manifest and both Metro metadata hashes. Design/progress prose is separate from those tested application inputs. No hosted CI check, full native runtime or release acceptance is asserted by this local record.

### Native control hardening — 4 November 2026

Continued on the unmerged `feat/design-system-redesign` branch from `d4b906a`. Native configuration and modal/picker corrections are committed at `177c85fb4a45e1c64285c0023248a7694ecf5755`; the JavaScript-only Router Link correction is `0f215009503e1087bcd0f51977d559162192d004`. Windows remains the authoring checkout. This batch advances DS02–DS04 and limited DS11 evidence; it does not close those milestones or add product transports.

Corrections:

- Enabled native automatic appearance. The earlier app configuration forced light even though Unistyles offered a device preference. Expo SDK 58 documentation and the installed SystemUI plugin confirm the native setting; introspection produces Android `automatic` and iOS `Automatic`. A newly compiled client is required.
- Unified picker/dialog focus-return requests. Closed dialogs no longer request focus on initial mount; pickers no longer request focus while their modal is still visible. iOS uses `onDismiss`; Android schedules after the visible-to-closed commit because RN 0.88 implements `onDismiss` only on iOS. These requests still need TalkBack/VoiceOver verification.
- Added pressed/disabled picker feedback and reserved separate layout space for its wrapping selected value and Change action.
- Device inspection exposed native Router Link text retaining light colors when its surrounding native footer changed to dark. The links now resolve styles through `withUnistyles`; selected navigation uses the selected role instead of the legacy success role.

| Check / actual inputs | Result and limit |
| --- | --- |
| `pnpm verify:android`, Windows x86_64 | Passed mobile lint/type checking, 20/20 Expo checks, pinned native generation, assembly and Android lint. Gradle: 930 tasks, 17m 38s; lint: 0 errors, 31 warnings. Package manifests and lockfile unchanged. Log: `.kairn/verification/design-system-native-hardening-android.log`. |
| Native artifact | Installed `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`; SHA-256 `1b0b4639d54890bea80a2ea2973d52c45441e57ce51972686201517a41839f79`. Native inputs are `177c85f`; the later footer correction changes JavaScript only. |
| Runtime source and device | Local Metro 8081 from this Windows checkout; Pixel_10 / emulator-5554, Android 17, 1080×2424. No Expo Go or remote source copy. B04's owner released its underlying automation lease on request; no foreign session was taken over. |
| Initial source inspection on existing client | Pending Save kept its label and exposed busy/disabled state; clearing pending restored it. Dialog system Back, picker Back and title retention were inspected. This older installed client is exploratory evidence, separate from the fresh APK confirmation below. |
| Fresh APK confirmation | At device text-size `extra-extra-extra-large`, confirmation text/actions remained readable and Cancel dismissed without confirming. Long picker choice wrapped beside Change, selection updated its accessible name, and system Back retained both the selection and an edited title. `design-system-native-large-{text,dialog,picker}.png` under `.kairn/verification/`. |
| Automatic appearance on fresh APK | Dark app launch and subsequent live light/dark changes rendered the theme; edited title survived. Final Router Link appearance confirmation is recorded below. `.kairn/verification/design-system-native-system-dark.png` records the earlier footer contrast finding, not its correction. |
| Startup diagnostic | Overlapping development-client launches during install/theme changes produced a blank surface with live accessibility nodes. Metro reported multiple linking roots. A single cold relaunch rendered the app and subsequent live theme changes worked. Startup/repeated-deep-link reliability remains a separate open gate; the native compile is not a universal launch pass. |
| Keyboard and assistive technology | Native field entry worked, but the on-screen IME stayed hidden. No keyboard-avoidance, hardware-keyboard, TalkBack focus/traversal, VoiceOver or accessibility certification is claimed. |
| iOS/tablets/account backend | iOS native config introspected; no current-source Mac handoff, iOS compile/runtime, tablet or physical-device check. Existing account-unavailable boundary was visible; no account/API gate was closed. |

Coverage choice: use the existing mobile compiler/lint/Expo checks, native assembly/lint, Metro exports and real device interactions for this platform boundary. No new mock-based hook tests or tests asserting configuration constants were added. Web/backend behavior was not changed or re-certified. Remaining native gates are real IME handling, screen-reader focus entry/return, explicit appearance persistence, iOS/tablet qualification and controlled startup/deep-link recovery. The catalog's three-option picker is not evidence for a large import list. Media-crop and remaining web/global-focus migration work also remain open.

Final footer confirmation: source `0f21500`, using the same APK (native inputs unchanged), passed cold Metro launch followed by live device dark → light changes. Inspected `design-system-native-footer-{dark,light}-fixed.png`: footer text and selected background now use their active semantic theme. Final mobile TypeScript, mobile lint and changed-source formatting passed. The Expo Router Link wrapper preserves typed hrefs without new dependencies. Device appearance was restored to light and text-size to its original `large`; only this task's automation session was closed, without shutting down Pixel_10. Task Metro was stopped. No source was published or synchronized to another host, and no PR/CI acceptance is claimed.

Both final Android/iOS Metro exports passed from `0f21500`, log `.kairn/verification/design-system-native-hardening-exports-final.log`. Metro still emits upstream Unistyles export-path warnings and resolves through its documented fallback; no package patch or version change was introduced. `.kairn/verification/design-system-native-hardening-inputs.json` records tracked public mobile/shared/package inputs, native APK and final export metadata hashes; environment files are excluded. The iOS export remains a JavaScript build check, not iOS native acceptance.

### Native keyboard and iOS qualification follow-up — 4 November 2026

Inputs: published `4fdda4916293d355b9d93d97a965ddcd7ace19b6`, with Windows retaining source ownership. Mac `/Users/nishanth/projects/nishanth/kairn` consumed this exact SHA through `checkout:sync`; clean source and six protected host files were preserved. Frozen installation passed without dependency/lock changes. No application folders, dependencies, generated native output or private configuration were transferred between hosts.

Android continued with the preceding native APK and the current Windows Metro 8081 bundle. The following checks add evidence to the previous batch rather than replacing its unresolved accessibility/platform gates:

- Real Gboard: tapped the journey title with `--no-test-ime`, observed the actual keyboard and app-owned focus, pressed a keyboard key and confirmed the title changed. System Back dismissed the keyboard while retaining the edit. The focused text was above the IME; the lower Chapter notes field remained editable and the page could scroll with the keyboard open.
- Opened the confirmation from a scrolled page while the IME was active. Its content and Cancel/Confirm actions were visible; Cancel returned to the page and input state. This is keyboard/layout evidence, not TalkBack focus evidence.
- Selected explicit Light appearance, cold-relaunched the client, and waited for the persisted `Appearance: Light` control. A serialized cold launch and warm catalog/account navigation completed without reproducing the earlier overlapping-launch failure. This bounded check does not close arbitrary startup/deep-link reliability, overlapping development-client launches or production link handling.
- Restored the original saved Dark preference, closed this task's Android automation lease without emulator shutdown, and stopped its Metro. No account operation was submitted. The existing account storage/connection-unavailable boundary remained visible; B04 service acceptance is unchanged.

Private Windows evidence: `.kairn/verification/design-system-android-real-keyboard.png`, `design-system-android-dialog-from-keyboard.png`, and `design-system-android-appearance-cold-light.png`. Coverage uses real compiled-client interactions at the selected boundary; no mocked keyboard/persistence tests or repeated backend/web checks were added.

#### iOS finding, correction and bounded confirmation

The initial iOS inspection used the existing development client with current JavaScript while the replacement compiled. It reproduced a serious layout issue: tapping a title near the bottom raised the keyboard and moved the focused editor outside the visible scroll viewport. Account forms already used native keyboard insets; the sample journey forms instead resized their parent with `KeyboardAvoidingView`.

Correction `c81f29444158a5bbe0e081de4ce598ffa52da4c6` makes `SamplePage` use the native scroll view's `automaticallyAdjustKeyboardInsets` and iOS interactive keyboard-dismissal mode, without a second parent keyboard avoider. Android keeps its existing resize and non-dismissing scroll behavior. The installed RN 0.88.1 Fabric scroll implementation explicitly computes first-responder offsets when keyboard insets change; no dependency or native configuration changed.

| Check / input | Executed result and limit |
| --- | --- |
| Mac `pnpm verify:ios` at clean `4fdda49` | Passed mobile prerequisite builds/checks, 20/20 Expo checks, pinned native generation, locked Pods, x86_64 simulator compilation and strict local signature verification. Xcode 26.5 / 17F42, macOS 26.7.2, CocoaPods 1.16.2. Log: Mac `.kairn/verification/design-system-ios-build.log`. No Personal Team or physical-device signing claim. |
| Build evidence | Mac `.kairn/verification/ios-build.json` SHA-256 `54c693596d670c40fc03829458b608f2504e1185a69df823468bf8ae5d0041bd`. Pod lock remains `d6a114172c0d6bd3945bd9962226e5a68243609e9cb41c7773f77eecfc6efbd8`. |
| Installed artifact | Mac `.kairn/ios-build/Build/Products/Debug-iphonesimulator/KairnDev.app`; executable SHA-256 `99e3f41254d1f7dee63b2ab1eeb029a62154e931d980d0d7a2ad4bc2399afce1`. Installed on Kairn iPhone / `B2423D2D-A4D6-455E-B07F-742B6D513DE6`, iOS 26.5, 402×874 pt / 1206×2622 px. |
| Runtime source handoff | After the build and task Metro stopped, protected sync advanced the clean Mac to `c81f294`. Only `screens.tsx` changed; helper reported dependency inputs and native review unchanged, with all six protected files preserved. The above native artifact was reused with exact `c81f294` JavaScript from Mac Metro **8082**. The initial 8081 start was refused; no other process was stopped to obtain that port. |
| Fresh iOS keyboard confirmation | The lower Chapter notes editor remained visible when its real iOS keyboard appeared, and pressing a keyboard key changed the draft. This confirms the focused-input correction; a user-directed scroll may still move content away. `design-system-ios-keyboard-fixed.png` is private Windows evidence. |
| Appearance persistence | Explicit Dark remained selected and rendered after the new install and cold launch. Selecting the original Use device setting preference rendered light in the light simulator. `design-system-ios-cold-dark.png` records the fresh client. Live system dark/light transitions on iOS were not tested. |
| Gesture limitation | Drag-dismissal commands failed with `INVALID_ARGS: Gesture trajectory does not fit inside the viewport`. The advised retry farther from the edge with shorter travel failed identically (diagnostics `mw2bgkrx-a5449510`, `mw2bgttg-4264c042`). Stopped iOS interaction after that retry, without SSH UI control. Drag dismissal is implemented but **not verified**; larger-text iOS states and remaining dialog/picker cancellation checks were not completed. The tool failure is not recorded as an application gesture defect. |
| Final source checks | Windows mobile TypeScript, mobile lint and changed-source formatting passed. Both Android/iOS Metro exports passed from `c81f294`, `.kairn/verification/design-system-native-keyboard-exports.log`. Existing upstream Unistyles export-path fallback warnings remain. |
| Android regression check at `c81f294` | Serialized cold launch, warm catalog navigation and real Gboard entry into the lower multiline field passed using the previously qualified native APK. System Back dismissed the IME. `design-system-android-keyboard-final.png`. No native inputs changed, so another native rebuild was unnecessary. |

Cleanup: restored Android's original saved Dark preference and iOS's original Use device setting preference. iOS text-size was read as `large` and never changed; no simulator OS appearance override was applied. Both task automation leases were released without device shutdown and both task Metros stopped. Mac source remains clean at the tested `c81f294`; Windows retains documentation authorship. Native build output and dependencies remain on their owning OS.

This advances the initial control/theme/keyboard evidence only. VoiceOver/TalkBack traversal and modal focus, iOS drag/overlay/large-text confirmation, tablets/physical devices, exhaustive startup/deep-link recovery, and production account/journey/capture/publication gates remain open. A native build, accessibility snapshot or successful typed key does not close those gates. No whole DS02–DS04/DS11 completion or hosted CI acceptance is asserted.

Public-input/artifact summary: `.kairn/verification/design-system-native-keyboard-inputs.json`, SHA-256 `c563843ebec21a6fe4b83919ea7201d60b87d45490d76aa1672bb030f72a22a3`. It ties the exact runtime/native checkpoints, APK/Mach-O/build evidence and final Metro metadata hashes to the scoped results and open checks; no environment or credential files are included.
