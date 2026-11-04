# Kairn design system and product experience redesign plan

Date: 4 November 2026. Status: implementation plan; remaining work is not accepted or complete.

Implementation is now underway. See the [component/consumer inventory, screen traceability and extension guide](design_system_catalog.md) and the latest [component-system evidence](experience_redesign.md#component-system-implementation--4-november-2026). These records separate implemented components from native runtime and production acceptance; the unchecked completion gates below remain open.

This plan takes Kairn from the current Open atlas checkpoint to a coherent, maintainable experience across web, Android and iOS. It covers individual controls, advanced interactions, product components, complete screens, production integration and validation. The next implementation milestone is a matched component system demonstrated in real forms and journey content, before further broad screen expansion.

The goal is that capture feels reassuring, shared creation feels understandable, viewing feels immersive, and learning feels useful. Every component must support those jobs and belong to one recognizable identity.

## 1. Authority and scope

Read this plan with:

- [Product requirements](../core/product_requirements.md): functional scope, rights, durability and release obligations.
- [Architecture](../core/architecture.md), especially section 14: selected dependencies and platform boundaries.
- [Application design](../core/application_design.md): screen inventory, interaction and evidence rules.
- [Open atlas direction](../../DESIGN.md): current visual identity and composition.
- [Redesign audit and progress](experience_redesign.md): implemented checkpoint and actual verification evidence.
- [Accounts and journeys plan](accounts_journeys_access_plan.md) and its [progress](accounts_journeys_access_progress.md): existing account, journey, invitation, lifecycle and grant delivery.
- [Prototype plan](prototype_plan.md): sample-state isolation and extraction into production.
- [Checkout workflow](checkout_workflow.md) and [native host guide](native_host_setup.md): source ownership and platform verification.

This plan governs the remaining redesign sequence. It does not change product permissions, introduce a new frontend framework, or treat prototype interactions as production services. DS01–DS12 below are redesign milestones; they do not renumber the existing production B00–B09 batches or prototype P00–P08 batches.

Every required component and screen receives a disposition. A component without a current product use is specified or deferred explicitly, rather than implemented as an unused showcase. The full agreed product experience remains the completion target.

## 2. Starting point and known gaps

Baseline: application checkpoint `d285e27cd2d9e67ad0527a2c248803a68eab0563`, with evidence recorded at documentation checkpoint `3273ce3`. Recheck the actual branch and integration state before starting implementation; these identifiers are provenance, not permission to overwrite newer work.

Already present:

- Three documented creative directions and an interactive direction study; Open atlas is the selected working direction.
- Shared color, spacing, radius, typography and layout values, with initial semantic light/dark and motion roles.
- Sample discovery, a chapter reader with Story/Explore/Learn, a focused native reader, and a sample creator workspace.
- Real account code and existing identity/access boundaries, alongside separate prototype controls.
- Limited reader accessibility/responsive evidence and passing Linux regression tests at the recorded inputs.

Still incomplete:

- Multiple button, field and status implementations express different variants and behavior. Native buttons remain rounded pills while the redesigned web controls use smaller corners.
- Web shadcn controls and prototype controls are separate systems. Some small/icon web variants are below the project's target-size policy and need review.
- Native theme configuration currently exposes only a light theme. A dark reader demonstration is not app-wide theme support.
- Legacy color names, literal dimensions and overlapping CSS rules remain. A shared palette alone does not establish component parity.
- Advanced controls, overlays, native equivalents and full component-state catalogs are missing or partial.
- Product patterns are still embedded in screens, and most new journey flows use session-only fictional data.
- Real capture/import, maps, collaboration/publication integration, optimized genuine imagery and broader device/accessibility/performance validation remain open.

Do not reopen accepted foundation engineering without a concrete regression. Do not mark these gaps complete through documentation, screenshots or token changes alone.

## 3. Design direction and decision rules

Open atlas combines mineral white surfaces, deep blue actions, slate text, editorial journey titles and precise interface typography. Chronology is the signature: time and place remain legible while photographs and personal accounts lead the experience. Rest days, transfers and unknown locations belong to the journey.

Apply the direction to controls as carefully as to covers:

- Use hierarchy and spacing to explain importance. Avoid making every section a card.
- Give actions consistent emphasis; reserve strong fills for primary or selected actions.
- Let corner radii express component purpose. Buttons, fields, media and small badges need related treatments, not one radius imposed everywhere.
- Keep essential labels outside photographs and away from unpredictable map backgrounds.
- Use restrained motion to show state, continuity or user intent. Do not require animation to understand or operate a control.
- Carry source attribution, uncertainty and sharing state near the content/action they qualify.
- Prefer plain, specific language: saving, uploading, contributing and publishing are separate operations.

DS01 will strengthen the existing inspiration evidence with annotated component references and actual compositions. The first research pass is a starting point, not proof of an exceptional finished system. Retain Newsreader and Instrument Sans as the working pair; change them only if realistic component and reading specimens demonstrate a clear improvement, with licensing, payload and native impact recorded.

An inspiration entry should identify the source and access date, the actual pattern inspected, the user problem it solves, the lesson to adopt and the mismatch to avoid. Include editorial, museum/atlas and geographical interfaces alongside travel products. An inspiration image is not an implementation target until it survives the product's content, accessibility and platform constraints.

Routine design choices do not require repeated founder approval. Bring meaningful changes to product meaning, navigation, dependency choices or the overall visual direction to a concrete review checkpoint. Record the reason and tradeoff for major decisions.

## 4. What consistency across web and mobile means

One system has two platform implementations. Shared design contracts must be recognizable in screenshots and predictable in use; platform conventions remain intact.

Shared contracts include semantic colors, type roles, shape rules, icon vocabulary, spacing relationships, action emphasis, variant names, state meanings, content terminology and accessibility intent. A destructive action, selected chapter or pending upload must mean the same thing everywhere.

Platform adaptations are explicit:

- Web supports keyboard focus, pointer hover, browser zoom, semantic HTML, URL navigation and appropriate desktop layouts.
- Native supports safe areas, system back, software keyboards, text scaling, native accessibility actions and OS permission/picker flows.
- A desktop dropdown may become a mobile sheet or native picker. Its label, current value, selection rules, validation and cancellation behavior remain consistent.
- Web hover has no artificial mobile equivalent; native pressed feedback answers the same need for interaction confirmation.
- Compact visual density must not reduce hit areas below the project policy: 44 CSS px on web and 48 dp on Android. Use comfortable native targets on iOS and verify them on devices.
- Native and web screen layouts can differ to suit the task. They must retain the same content, permissions, outcomes and recoverability.

Any intentional difference goes into the component catalog with its reason. An accidental discrepancy is a defect, not a platform adaptation.

## 5. Architecture and migration approach

Preserve the selected stack: React/TanStack/Tailwind/owned shadcn primitives on web; Expo Router/React Native/Unistyles v3 on native. Keep the New Architecture and pinned Nitro dependency. NativeWind and a separate test runner are excluded. Do not add another UI framework, animation framework or Storybook by default; any new dependency needs a demonstrated gap and an explicit architecture decision.

Use these ownership boundaries:

- `packages/design-tokens`: platform-neutral primitives, semantic roles, component dimensions and motion values. Platform adapters must handle units; CSS strings must not become native style values accidentally.
- `apps/web/src/components/ui`: the canonical web primitive layer. Preserve useful shadcn/Radix accessibility behavior and own its appearance and public API.
- `apps/mobile/src/components/ui`: proposed native primitive destination, using Unistyles and selected native dependencies. Move components incrementally; do not restructure unrelated native code.
- Platform-local product component folders: chapter navigation, media, practical details, contribution and publication compositions. Keep source/access policy out of presentational components.
- Existing data layers: TanStack Query for fetched server state; durable files/SQLite/commands for capture; server authority for capabilities, source grants and approved publication.

Migration rules:

1. Inventory each existing implementation and its consumers before changing a public component API.
2. Define the new contract and implement it once per platform.
3. Add temporary compatibility wrappers where needed, with an explicit consumer list and removal milestone.
4. Migrate one real surface at a time and verify its consequential behavior.
5. Remove superseded controls, styling overrides and imports only after all consumers have moved.
6. Keep sample data/controllers out of production component APIs. Components accept data, actions and states; they do not import fixture JSON or assume sample actors.
7. Preserve existing routes/contracts until the replacement is verified. If navigation changes, preserve direct-link, back and unavailable-state behavior.

Do not use a single cross-platform rendered component package to erase DOM/native differences. Share plain tokens and genuinely reusable pure logic when it improves maintenance.

## 6. Complete foundations work

DS02 must produce the following foundations, with usage rules and code mappings:

- **Color:** primitive palette; canvas/surface/overlay roles; text and icon emphasis; control boundaries; action and selected states; error, warning, success, information and review roles. Keep uncertainty and publication permission distinguishable from generic success.
- **Themes:** complete light/dark mappings, intended system/explicit preference behavior, initial loading appearance, persistence scope and fallback. Theme changes must not reset user work or chapter selection. Document surfaces that intentionally retain a fixed treatment, such as media.
- **Typography:** family/weight roles, display and reading scales, labels/helper/error text, line heights, responsive mappings, long-title handling and numeric formatting. Native named font weights must map to the web roles without synthetic bold.
- **Spacing and layout:** field anatomy, control padding, icon gaps, grouped controls, section spacing, reading measure, containers, grids and responsive breakpoints. Use the existing scale unless realistic specimens justify changing it.
- **Shape and surfaces:** radii by role, border weights, dividers, elevation and scrims. Specify when elevation conveys a layer and when a border is sufficient.
- **Icons:** one selected visual family and size/stroke mappings; accessible naming; icon-only button rules; text/icon alignment. Use the canonical dependency register before activating packages.
- **Media:** cover/card/gallery ratios, focal-point behavior, missing and failed media, loading placeholders, attribution, licenses and responsive derivatives. Preserve originals and never imply that generated demonstration imagery documents a real journey.
- **Cartography:** basemap/overlay roles, contrast, markers, clusters if required, selection, attribution and leg evidence. Recorded/reported/estimated/unknown use text and line patterns as well as color.
- **Motion:** duration/easing roles, immediate press feedback, expansion/navigation continuity, indeterminate progress and reduced-motion equivalents. Current 120/220 ms values are a baseline, not a reason to animate every component.
- **Accessibility:** contrast, target sizes, focus, text growth, accessible names/descriptions, error association and announcement priorities.

Acceptance: a change to a semantic role updates both specimen apps coherently; no new screen-level hex values or arbitrary control dimensions are needed for ordinary cases. All retained legacy aliases have named consumers and an exit plan.

## 7. Component inventory

The following is the required audit/design inventory. Implement components when their named product consumers require them; mark unused variants explicitly instead of silently omitting them.

### 7.1 Core controls

| Family | Required design and behavior | Initial consumer |
|---|---|---|
| Button, icon button, link | Primary/secondary/quiet/destructive emphasis, sizes, icon positions, pending label stability, disabled rules, link semantics | Accounts, save, review, viewer controls |
| Field composition | Label, optional/required indication, description, validation, error association, counter where needed, form spacing | All forms |
| Text input, text area | Empty/filled/read-only/disabled/error, multiline growth, keyboard/input purpose, retained drafts | Account/profile, journey caption, notes |
| Password and search input | Visibility control, accessible toggle, autocomplete behavior, clear action, search pending/no results | Authentication and discovery/search |
| Select and picker | Placeholder/value, single selection, long options, empty/disabled/error, cancel and focus return | Filters, audience and editing metadata |
| Combobox and multiselect | Searchable options, loading/no matches, selected value removal, keyboard/touch behavior | Large option sets only; prefer a simple select when sufficient |
| Checkbox and radio group | Checked/unchecked, group label, mixed state where meaningful, full-row hit area, error/disabled | Imports, consent, source permission |
| Switch | Immediate reversible setting; labelled pending/error recovery if a server write is needed | Appearance and appropriate settings |
| Segmented control and tabs | Selected state, appropriate navigation semantics, focus behavior and preserved panel state | Story/Explore/Learn and workspace areas |
| Date and time input | Local date/time context, unknown value, range errors, timezone corrections, native/browser entry | Journey dates and imported timestamps |
| Slider/range control | Accessible value, discrete steps, keyboard adjustment and direct alternative where useful | Playback/media controls only where a slider serves the task |

Do not make a bespoke calendar, combobox or slider merely to look sophisticated. Its complexity must earn its place in a real flow.

### 7.2 Overlays, feedback and structure

| Family | Required design and behavior | Important adaptation |
|---|---|---|
| Dialog and confirmation | Named purpose, protected focus, safe initial focus, Escape/back, return focus, retained input | Destructive actions explain scope and irreversible consequences |
| Drawer and bottom sheet | Clear dismissal, internal scroll, keyboard-safe content, action placement, scroll lock | Native system/back behavior; accessible non-drag dismissal |
| Menu and popover | Trigger state, positioning, overflow, focus and keyboard behavior | Touch-friendly action menu; no essential hover-only content |
| Tooltip | Brief supplementary help, keyboard access and touch alternative | Never the only label, error explanation or source information |
| Alert, notice and toast | Severity, action, duration, announcements, repeated-message handling | Critical offline, permission and recovery states remain persistent |
| Progress, skeleton and loading | Determinate vs indeterminate, truthful counts, stable layout, retry/cancel | Local save, upload, processing and publication are distinct states |
| Empty, error and unavailable | Appropriate explanation, next action, retained work, protected-data redaction | Permission denial must not reveal hidden title/media/location |
| Navigation and header | Current destination, direct entry, back behavior, responsive composition | Native safe areas and browser/history semantics |
| Card, list and data display | Content hierarchy, full-row vs nested actions, long content, dense and quiet variants | Cards are not mandatory wrappers for every section |
| Accordion and disclosure | Expanded state, keyboard semantics, useful summary and discoverable contents | Avoid hiding essential safety or error information |
| Breadcrumb and pagination | Location and bounded result navigation, loading/empty/page restoration | Use only when the hierarchy or result set warrants them |
| Badge, avatar and contributor group | Textual meaning, initials/missing image, selected/disabled if interactive | Contributor identity does not imply permission |

### 7.3 Product components

| Pattern | Required coverage |
|---|---|
| Journey preview and cover | Character of the whole journey, place/date/activity summary, missing cover, private/published state, one result per event |
| Day/chapter navigation | All-days/day selection, rest and transfer chapters, long titles, deep entry and preserved selection |
| Timeline and activity segment | Chronology, timezone uncertainty, missing timestamps, parallel participant branches, keyboard alternative to drag |
| Route context and map controls | Explicit initialization, Map/Satellite, textual itinerary, evidence legend, selected segment, failure, attribution and optional playback |
| Moment and media gallery | Ownership, media type, captured/entered context, unavailable derivative, video/voice alternatives, accessible full-screen viewer |
| Practical detail | Category, dated observation, currency/unit/group scope, author/source, estimate vs firsthand report, missing information |
| Import review and upload queue | Selected inputs, grouping preview, ambiguous dates, duplicate/unsupported file, per-item progress, retry/cancel and original preservation |
| Collaboration and source scope | Invitation status, participant powers, source-owner permission, attribution, review-only vs publication eligibility |
| Story editing and conflict | Local draft, save/pending/failure, expected revision, both conflict candidates, undo/recovery, suggestions with Accept/Edit/Dismiss |
| Publish review and sharing | Exact reviewed version, excluded sources, redaction preview, private/unlisted/public destination, stale review, success/pending/failure |
| Restriction and lifecycle | Withdrawal/unpublish/leave/delete distinctions, impact summary, immediate denial, pending recovery receipt and completion |
| Highlights and saved research | Own-source defaults, credits, full-story-access disclosure, stale/withdrawn reference and private saved notes |
| Search and grounded answer | Query/no results, source jumps, buffered supported answer, citations, quota/failure/abstention and invalidated answer |

## 8. Definition of done for each component

Each catalog entry must contain:

1. Purpose, product consumers, when to use it and when another pattern is better.
2. Anatomy and mappings to spacing, typography, color, shape and motion roles.
3. Variants and size/density rules, including long labels and localization resilience.
4. Controlled state/value and action contract; matching conceptual API names across platforms where practical.
5. Default, hover where applicable, focused, pressed, selected, disabled and read-only states as appropriate.
6. Loading, empty, error, success, offline and permission-limited states when the component participates in those situations.
7. Keyboard, screen-reader, touch, text-scaling, dismissal and focus-return behavior.
8. Reduced-motion treatment, expensive-content lifecycle and failure fallback.
9. Realistic web and native specimens, including text-heavy and missing-media examples.
10. Consumers migrated, chosen critical coverage, evidence links and outstanding limitations.

Use “not applicable” with a reason for states a component cannot meaningfully have. Do not add a fake success state to a separator or a loading spinner to every interaction.

For buttons, specifically unify variant naming and pending behavior: a stable label, explicit busy state, guarded repeated activation and consistent icon placement. For fields, unify error/help associations and retained input. For selection controls, selection and focus must be visually distinguishable. For overlays, verify focus return and system back rather than relying on appearance alone.

## 9. Delivery sequence

Each milestone ends with a reviewable artifact and recorded acceptance. The sequence is dependency-driven; calendar estimates should follow DS01's measured inventory and confirmed backend/device availability, not an assumed percentage complete.

### DS01 Inventory and design calibration

**Start:** current source/PR and product requirements reconciled.

Audit all reusable controls, local style definitions, screens, assets and data adapters. Record implementation path, web/native consumer, duplication, missing states and intended disposition: retain behavior/restyle, consolidate, replace or add. Map every application-design screen to its redesign milestone. Inventory existing real endpoints separately from fixture actions.

Expand the inspiration board with component-level observations from accessible references: button anatomy, form rhythm, selection, sheets, media controls, chapter navigation and maps. Record what is borrowed as a principle, what is rejected and why. Identify sources actually inspected; do not inflate research with inaccessible galleries.

Produce three representative Open atlas compositions: an account/import form, a dense creator workspace and the immersive reader. Include phone and desktop, light and dark, missing photography and long text. Critique these together before freezing foundations.

**Deliverables:** component/consumer inventory, screen traceability, annotated references, compositions and design decisions.

**Exit:** no unknown component family or required screen lacks a disposition; the direction works for ordinary controls and content-rich storytelling. Existing direction studies are input, not a substitute for these specimens.

### DS02 Complete tokens and platform theme adapters

**Depends on:** DS01.

Implement the foundations in section 6. Map semantic roles into Tailwind/shadcn and Unistyles, remove new hardcoded duplicates and define migration aliases. Resolve responsive typography, actual font weights, shape hierarchy, control sizes and appearance behavior.

**Deliverables:** token specification, platform adapters, theme specimen and alias migration list.

**Exit:** the same semantic change produces coherent results on web/Android/iOS; all documented token roles have valid values and intended contrast pairings. Native dark configuration is implemented and checked, not inferred from web.

### DS03 Core controls and form patterns

**Depends on:** DS02.

Implement the core inventory, starting with Button/IconButton/Link, Field/Input/TextArea, selection controls and segmented navigation. Add search/password/date/combobox/slider patterns only for named consumers. Normalize public variant/state vocabulary. Migrate existing account and prototype form consumers through compatibility wrappers where necessary.

**Deliverables:** working platform-owned controls, forms demonstrating errors/pending/retained input, initial matching catalogs.

**Exit:** account and journey forms use the new primitives without changing their contract or permission behavior; button shape/variants and field anatomy no longer drift between platforms. No enabled small/icon control violates target policy.

### DS04 Overlays, feedback and structural components

**Depends on:** DS03.

Complete dialogs, sheets, menus, popovers, tooltips, alerts, notifications, progress, loading/empty/error states and structural components. Establish one overlay ownership/focus model per platform and avoid conflicting nested modal systems. Define cancellation, retry, unsaved-work and destructive-action compositions.

**Deliverables:** advanced component catalog, overlay interaction examples and persistent status patterns.

**Exit:** a keyboard user and a native screen-reader user can open, use and dismiss the implemented overlays; focus/back/scroll behavior is correct. Critical failures are not transient toasts. Motion honors reduced-motion settings.

### DS05 Product component layer and catalog completion

**Depends on:** DS03–DS04.

Extract and redesign the product inventory in section 7.3. Build against typed props representing real permissions/evidence/states; keep fixture state outside reusable components. Ensure timeline reordering and range/media controls have accessible alternatives. Use long journeys and partial data, not only the four-day sample.

**Deliverables:** journey component families, matched web/native specimen routes, component documentation and coverage ledger.

**Exit:** no existing screen needs a second bespoke button, field, audience control or status vocabulary. The catalog demonstrates all required component families, identifies deferred unused variants and shows intentional platform adaptations.

**Milestone:** the component system is ready for broad screen migration only after DS03–DS05 pass on the available target platforms; any unavailable-platform result remains explicitly open.

### DS06 Signature reader and practical knowledge

**Depends on:** DS05; authorized publication/source reads and map/media boundaries for production completion.

Reader design and component integration can begin after DS05 using the labelled approved-content fixture. Production acceptance waits for the publication boundary delivered with DS08 and the actual read/media/map adapters. DS06 is not a reason to create a second publication service or block independent creator work while those services are unfinished.

Develop the chapter reader into a full Story/Explore/Learn experience. Preserve selected day/chapter and location context across views, direct links and return navigation. Support all-days, rest days, transfers, parallel perspectives, incomplete tracks, media failures and missing covers. Desktop may pair map/story; mobile uses a focused view with explicit context access.

Integrate the selected Mapbox web/native adapters only after an explicit map action. Add Map/Satellite, authorized evidence overlays and basic user-started playback with pause/stop, manual chapter selection and reduced-motion behavior. Never fabricate route continuity. Preserve provider attribution and a usable text-only itinerary.

Complete dated practical categories, source navigation, approved search and grounded answers according to existing domain rules. Do not turn historical costs into current prices or a generated answer into unsupported advice. Replace generated demonstration imagery with licensed genuine content and correctly sized derivatives before production acceptance.

**Deliverables:** reader on all target surfaces, real map/media adapters, source/knowledge navigation and failure fallbacks.

**Exit:** visitors can understand the whole journey, choose a day, inspect evidence and find useful logistics without installing an app or loading a map. Production reads expose only currently authorized approved material.

### DS07 Capture, selected import and creator editing

**Depends on:** DS05; durable capture/import/sync and revision APIs for production completion.

Design and implement capture → local confirmation → personal moments → upload → contribution as distinct states. Cover camera/media/location/microphone permission denial, low storage, unknown location, failed derivatives, expired authentication, offline relaunch, interrupted transfer and cancellation.

Selected photos/videos and GPX/FIT enter a review flow with date groups, ambiguous timestamps, timezone correction, duplicate/unsupported inputs and explicit inclusion. Users can finish with minimal editing or refine chapters. Do not claim a local save until app-owned bytes and durable metadata satisfy the capture protocol.

Complete chapter, caption, chronology, route and practical-detail editing. Suggestions remain reviewable; regeneration preserves corrections. Reordering has keyboard/touch alternatives. Stale edits keep the attempted candidate and provide conflict resolution; changing one chapter cannot silently alter unrelated contributors' sources.

**Deliverables:** capture/import/queue flows, focused native editors, full web editor and recovery states.

**Exit:** the solo multi-day import scenario and return-to-draft scenario pass against real persistence and revision boundaries. Session-only changes are never labelled saved or synchronized.

### DS08 Collaboration, publication and lifecycle

**Depends on:** DS05 and DS07; corresponding account/journey capabilities, source grants, publication and recovery services.

Complete invite/accept/expire/revoke, People and scoped contribution flows. Show participant, administrator, coauthor and publisher capabilities independently. Provide attribution, private/review/publication source choices and separate original-file export grants.

Build exact-version publish review, exclusion explanations, redaction preview, stale review handling and private/unlisted/public outcomes. Personal highlights retain credits and explain whether the full journey is accessible. Republish must not silently adopt unreviewed edits.

Complete withdrawal, unpublish, leave, remove, transfer, archive and deletion impact flows. Keep local denial, pending independent recovery confirmation and byte cleanup distinct. Do not promise recall of already downloaded files.

**Deliverables:** collaboration and publish/share flows, permission-aware previews, lifecycle confirmations/status and recovery UX.

**Exit:** five participants share one journey with distinct powers; private/review-only sources never leak into public views. Restriction races, old links and pending receipts behave according to the server contract.

### DS09 Discovery, personal library, profiles and supporting screens

**Depends on:** DS05; public listing/private history/profile services and DS06/DS08 destinations.

Complete metadata filters, meaningful summaries, paginated results and one listing per journey event. Preserve filters and scroll location when returning. Avoid a generic social feed or unsupported recommendation claims.

Redesign personal created/joined history, drafts, published entries, invitations, saved research and optional public profile. Keep private notes/history separate from deliberately selected public information. Add loading, empty, no-cover, offline, removed and restricted states. Geographic history should remain useful without maps or imply metrics not yet supported.

Migrate account, recovery, profile, security, settings, support and unavailable screens into the same component system while retaining actual account flows.

**Deliverables:** complete navigation and supporting surfaces; required screen inventory has no unreviewed gaps.

**Exit:** every visible navigation destination works at its claimed capability level; private history and public identity are unambiguous. No sample account, fake upload or inert production action replaces a real integration.

### DS10 Motion, media and performance integration

**Depends on:** the relevant DS06–DS09 flows; motion foundations begin in DS02 and are applied throughout.

Review transitions at complete task boundaries: chapter changes, opening/closing media and sheets, upload progression, reorder, success/error and navigation return. Specify interruption behavior, focus continuity and reduced-motion equivalents. Avoid automatic route playback, attention loops or cosmetic delays.

Generate appropriately sized licensed image derivatives, lazy-load off-screen media, prioritize only the genuine leading image and reserve media dimensions. Bound list rendering and memory for long journeys, release media/map resources, avoid unnecessary native rerenders and use progressive enhancement for low-power devices.

Measure representative production builds and network/device conditions. Record device/browser, viewport, network profile, asset bytes, startup/interaction timings, layout shifts and map/media costs. Establish numeric budgets from the measured baseline and product performance requirements before accepting the flow; a small JS chunk alone is not a performance pass.

**Deliverables:** motion recipes, media pipeline contracts, measurements, budgets and degradation results.

**Exit:** essential reading/editing remains usable without graphics, all motion is interruptible where appropriate, reduced motion is respected, and agreed device/network budgets pass.

### DS11 Full scenario validation and correction

**Depends on:** the implemented DS06–DS10 scope.

Run the scenarios in section 12 on exact recorded inputs. Review responsive composition, interaction, accessibility, source/privacy semantics, recovery and emotional clarity together. Use a bounded first inspection, fix findings as a batch, then confirm; repeat only when new changes or unresolved failures justify it.

Record issues with reproduction, severity, affected platform, owner and disposition. Distinguish automated results, agent inspection, founder walkthrough and participant observation. Do not claim usability research from self-review. Seek representative participant feedback for capture, guest viewing and practical research; record the participant count and findings actually obtained.

**Deliverables:** scenario evidence, accessibility/device matrix, prioritized corrections and confirmation results.

**Exit:** no unresolved blocker or serious issue in essential navigation, permission presentation, capture/recovery or accessibility. Lesser accepted issues have an explicit owner and release disposition; unavailable platforms stay open.

### DS12 Consolidation and production handoff

**Depends on:** DS11 and applicable production/release gates.

Remove obsolete prototype wrappers, parallel styling systems, unused variants and migration aliases after consumer checks. Archive the reviewed sample checkpoint and keep development catalogs separate from public production routes. Extract only the real components/adapters into production; verify fixture routes, actors and debug controls cannot enter the shipped experience.

Update DESIGN.md, application design, component guidance, route/consumer maps, progress records and affected implementation plans. Preserve historical evidence and distinguish foundation completion from new product acceptance. Document how to add a token, component, variant, screen and intentional platform adaptation.

**Deliverables:** coherent production integration, maintained catalogs, migration closure, actual CI/native evidence and extension guide.

**Exit:** all required component/screen rows have verified outcomes, real services back production claims, critical scenario and release gates pass, and no remaining prototype limitation is described as finished functionality.

## 10. Screen and backend dependency mapping

| Existing surface | Redesign owner | Production dependency |
|---|---|---|
| Account/auth/profile/security | DS03–DS04 and DS09 | Existing B04 account slice; preserve its verified contracts |
| Native A01 and web W01 private history/overview | DS05 and DS09 | B05 private journey/history |
| Native A02–A05 capture, moments and import | DS07 | Capture/files/SQLite/transfer/import protocol; not closed by account foundation |
| Native A06–A07 and web W02–W04 overview/story/route/Learn editing | DS05 and DS07 | Canonical journey, coauthor/source access, reconstruction and revisions |
| Web W05 sources and W06 People/roles | DS07–DS08 | Import/transfer services plus B06 capabilities and B08 grant foundations |
| Web W07 revision and conflict view | DS07 | Expected revisions, retained edit candidates and safe restore |
| Web W08 publish and native A08 highlights | DS08 | Exact-version approval, publication generations, source dependencies and sharing |
| Native A09 and web W09 account/lifecycle/support | DS08–DS09 | B04 accounts, B07 lifecycle/recovery, saved research |
| Public P01 discovery and P07 optional profile | DS09 | Eligible public listings, moderation and chosen public identity |
| Public P02–P05 Story/Explore/Learn/source | DS06 | Approved reads, authorized media/maps, search and grounded answers |
| Public P06 highlights and P08 unavailable | DS08–DS09 | Approved highlight access, current restrictions and non-disclosing errors |

Keep exact screen labels aligned with the governing inventory during DS01. The B08 grant foundation does not itself deliver capture/upload UI, and a database table is not an available endpoint. Each feature's readiness record must identify its actual transport/adapter, permissions, state contract and acceptance evidence.

While a backend dependency is unfinished, use an explicitly labelled catalog fixture to validate the component and list the missing adapter. Component readiness, connected UX readiness and production readiness are three separate statuses.

## 11. Testing and evidence policy

Use the repository's Vite+ testing/tooling and selected browser tooling. Do not introduce a separate runner or large sets of tests that mirror styling constants. Choose a small number of meaningful integration checks at real boundaries and use visual/interaction inspection for routine reversible presentation changes.

Minimum coverage by risk:

- Core controls: one representative form proving labels, errors, retained values, pending/repeated activation and keyboard/native accessibility behavior.
- Overlays: focus entry/return, Escape/system back, keyboard appearance, scrolling and destructive-action cancellation.
- Selection: visible and programmatic selected state, keyboard navigation and native picker cancellation.
- Domain UI: actor/source isolation, stale revision recovery, publication exclusion, revoked links and persistent restriction status through actual services.
- Capture/transfer: real local files and SQLite, interruption/relaunch, retry/cancel, missing files, denied permission and expired authentication.
- Reader/media: explicit map initialization, no-GPS fallback, preserved chapter state, media failure, source navigation and public payload eligibility.

Validate web at 320/390 px, tablet and representative desktop widths, browser zoom/text growth and both appearances. Validate Android and iOS on their own compiled clients, plus available tablet portrait/landscape. Include VoiceOver/TalkBack, web keyboard/screen-reader operation, text scaling, contrast, reduced motion and usable target sizes. Automated axe results are supporting evidence, not a complete accessibility certification.

For every accepted batch, record exact commit, fixture/API version where relevant, built image/native artifact, runtime source, device/browser, checks run, result, evidence location and remaining gap in [redesign progress](experience_redesign.md). Do not borrow earlier CI/native passes after relevant inputs change. Freeze screenshot inputs, font readiness and test state before comparing visual regressions.

## 12. End-to-end acceptance scenarios

1. **Solo trekker with seven tracked days and two rest days.** Select media and GPX/FIT, review grouping/timezones, include rest days, resolve ambiguous timestamps, retain unknown locations, contribute and publish with minimal editing. Validate real durable save and interrupted upload recovery. Story covers the complete journey without invented tracks.
2. **Five friends on a mixed road trip.** Create/join the same journey; contribute driving, accommodation, sightseeing and hiking moments; retain attribution and private sources. Test participant/admin-only/coauthor/publisher distinctions, denied actions, invite expiry and contribution withdrawal.
3. **Guest on a mobile browser.** Open a shared approved link without installing an app, understand the whole journey, change day/view, explore media and optional geography, inspect a source and return to the same place. Test weak network, image/map failure, back navigation and unavailable publication.
4. **Traveler researching a similar expedition.** Find costs with currency/date/group scope, transport, equipment, accommodation, challenges and lessons. Distinguish firsthand reports, estimates and missing information; follow source evidence and save a private reference. Supported questions cite authorized material and abstain when information is missing or no longer accessible.
5. **Creator returning to a draft.** Open a specific chapter, preserve unfinished edits, save or undo without changing unrelated contributions, and resolve a stale revision with both candidates intact. Publishing remains a separate action and the public version does not change on a draft save.

Also exercise no-cover journeys, very long titles/names, large journeys, denied permissions, sign-in expiry, text scaling, keyboard-only use, screen readers, reduced motion, and revoked material in old links/previews/answers. Record task completion and friction; do not convert a successful scripted path into a claim that users find the experience intuitive.

## 13. Work ownership and host workflow

One implementation owner is accountable for each batch, even when the same person performs several roles. Design owns component contracts and critique; frontend owns platform implementation and migration; backend owns real authority/durability adapters; verification owns evidence and unresolved findings. Founder reviews major experience checkpoints and unresolved product choices. This role structure does not itself authorize spawning agents or new parallel workstreams.

Use one authoring checkout per active batch. Choose Windows for immediate Android/shared iteration, WSL for immediate web/backend iteration and Mac for native iOS work, following the host guide. Other hosts consume committed checkpoints through `pnpm checkout:sync --branch NAME --commit FULL_SHA`. Stop builds/Watch before changing source; preserve local configuration/signing and never transfer dependency/native-output directories across operating systems.

Activate the pinned host environment before Node/pnpm/native commands. Keep Compose in WSL and build current checkout inputs into tooling/runtime images. Use current session device tools; never take another session's device. When a device is occupied or unavailable, continue independent work and leave that platform's acceptance open.

New implementation branches start from current `development` and target `development`. Recheck whether an earlier PR merged before publishing follow-up work. Use reviewed commits and the existing protected promotion process for stable `main`; do not treat a design review as release authorization.

## 14. Risks and concrete responses

- **The same palette hides different components:** compare matched specimens and variant/state contracts, not just token exports.
- **A visually impressive direction fails on forms:** validate quiet/dense/error compositions in DS01 before expanding the visual system.
- **Catalog perfection delays the product:** require named consumers; finish the foundational gate, then migrate connected vertical slices rather than inventing unused controls.
- **“Fancy” components undermine accessibility:** choose native/accessible foundations; prove keyboard, touch, dismissal and reduced-motion behavior before adding expression.
- **Screens claim services that do not exist:** keep fixture demonstrations explicit and block production acceptance until real adapters pass.
- **Redesign changes permissions or destroys drafts:** preserve contracts, retain attempted input and test critical actor/revision/restriction boundaries.
- **Photography hides weak composition or harms performance:** inspect no-image layouts and license/provenance; ship measured derivatives rather than oversized placeholders.
- **Web evidence substitutes for mobile:** maintain separate Android/iOS/tablet verification rows tied to actual binaries and runtime source.
- **Migration leaves permanent duplicates:** maintain the consumer/alias removal ledger and close it in DS12.

## 15. First implementation batch and completion checklist

Start with DS01 inventory and representative specimens, then DS02 foundations and the first DS03 controls. The first reviewable implementation should show Button, IconButton, Field, Input, TextArea, Select/Picker, Checkbox, Radio and SegmentedControl in the web and native catalogs, including long content, error, pending, disabled and selected examples. Use a real account form and a journey-edit composition to prove their fit. Do not begin by adding another polished hero screen.

Track milestones in the progress record using: not started, implementing, implemented awaiting verification, verified, or blocked with a named dependency. Track design/component, connected UX and production acceptance separately. Do not assign completion percentages without a completed inventory.

- [ ] Every existing/required component and screen is inventoried and assigned.
- [ ] Inspiration and the selected direction are demonstrated in forms, dense tools and reading.
- [ ] Shared semantic foundations and complete platform adapters are implemented.
- [ ] Core, advanced and product component families have matching contracts and specimens.
- [ ] Required component states and intentional platform differences are documented.
- [ ] Existing real accounts and all required journey surfaces consume the system.
- [ ] Production flows use real authorized, durable services and honest state wording.
- [ ] Genuine licensed media, maps and measured performance fallbacks are ready.
- [ ] Five representative scenarios pass with critical recovery/permission variants.
- [ ] Responsive, keyboard, screen-reader, text-scale, reduced-motion and native checks pass.
- [ ] Legacy duplicates, temporary aliases and production fixture/debug entry points are removed.
- [ ] Documentation, exact-input evidence, required CI and relevant release gates are current.

The redesign is complete only when these outcomes hold across the agreed platforms. A complete-looking catalog, a passing reader scan or a merged PR is not sufficient on its own.
