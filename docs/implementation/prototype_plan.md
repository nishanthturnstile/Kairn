# Web and mobile experience prototype plan

Date: 3 November 2026. Version: 1.0, final implementation plan after two independent Codex-model reviews, Codex corrections and final OpenCode Go Argon 4 review. Scope: a code-based interaction prototype in the existing applications, followed by a handoff into the complete R1 implementation. No prototype screens, device checks, or product acceptance gates are completed by this plan. Review scope and dispositions are recorded in the [review record](../research/prototype/review_2026-11-03.md).

## 1. Decision and governing documents

Build a connected experience of one shared journey across Android/iOS, responsive creator web, and public web. Keep the accepted foundation and selected stack. Use explicit sample identities and simulated operations to resolve navigation, composition, permission language, and publication understanding before extending production account/journey work.

The user requested this design activity after the original no-trial-build decision. This is a bounded exception for interaction design, not a functional MVP, separate service, reduced R1 release, or market-validation gate. The full [requirements](../core/product_requirements.md), [architecture](../core/architecture.md), [application design](../core/application_design.md), and [account/journey decisions](accounts_journeys_access_decisions.md) still govern actual behaviour. No interviews, recruitment target, paid commitment, or prototype approval becomes a prerequisite for authorised R1 engineering. Prototype findings may refine screens; a change to domain policy or product scope must be recorded explicitly before implementation.

The immediate outcome is a reviewable experience and a resolved implementation backlog. Production delivery resumes with the [account/journey plan](accounts_journeys_access_plan.md), then the existing dependency order. Technical investigation can continue when independent of an unsettled interaction; do not build later production services merely to support the prototype.

## 2. Questions the prototype must answer

1. Can a new participant join the same journey and explain that their gallery remains private?
2. Can a contributor distinguish local saving, private backup, journey review, publication permission, and original-file export?
3. Can a group turn selected moments into a coherent departure-to-return story without designing pages or recreating the trip manually?
4. Can a publisher identify rights/privacy blockers, accept honest unknowns, and predict the viewer output?
5. Can a visitor understand the trip without loading a map, find a dated practical detail, and inspect its supporting source?
6. Can people understand what remains accessible after a withdrawal, unpublish, departure, or pending restriction confirmation?

Use completed tasks and explanations as evidence. A model's approval, attractive screenshots, or a simulated success state proves none of capture durability, server authorization, recovery, SSR performance, or product demand.

## 3. Deliverables and fidelity

- A native walkthrough in the existing Expo development build, including phone and tablet compositions; Android and iOS use the same product model and platform-appropriate navigation.
- A creator-web walkthrough with a working chapter canvas, source inspector, People, rights review, and conflict example.
- A responsive public-web walkthrough with Story, Explore, Learn, approved-source detail, personal highlights, and generic unavailable states.
- One versioned sample dataset, resettable scenario states, a route/screen inventory, task scripts, and evidence tied to source/fixture revisions.
- A findings register, reviewed component inventory, and a concrete removal/reuse handoff into production implementation.

Primary flows have realistic content and functioning forms, selection, navigation, ordering, preview, and local feedback. Secondary branches have enough working states to resolve their specific question. Out-of-scope controls are omitted or clearly labelled with their limit; there are no unexplained dead primary buttons. Avoid polishing every minor settings page before the central flow is usable.

## 4. Surfaces and screen coverage

Retain the canonical A/W/P IDs. Account, invitation, People, and lifecycle subflows refine existing IDs as in the [experience handoff](accounts_journeys_access_design.md); do not invent competing screen numbering. In the prototype progress record, give every route its canonical ID, actor, entry/exit, fixture scenario, and coverage depth.

Depth is explicit: the core connected walkthrough is create/join → native sample capture/contribution → prepared web continuation → suggestion review/composition → publish preview → public Story/Explore/Learn/source → withdrawal. It receives working controls and all consequential error/rights states. Supporting account/profile/research/lifecycle/question examples receive one focused state transition or annotated composition; they do not become a second implementation programme. Once the core has been reviewed, P06 fills only those supporting examples needed to answer a named question. Every inventory row gets a disposition, not necessarily a full working feature.

| Surface | Connected walkthrough | Additional required examples | Deliberate limit |
| --- | --- | --- | --- |
| A01/A06: journeys and overview | Sample sign-in, empty/history, create, invite preview/accept, journey overview, People/powers | Invalid/expired invite, no-cover journey, date correction, administrator-only and publisher-only views | No auth session, mail delivery, or real invitation tokens |
| A02/A03/A04: capture and moments | Photo/voice/note mode selection, sample capture, visible destination, confirmation, queue, retry, scope change | Video limit preview, permission denial, location unavailable/approximate, storage failure, cancelled save | Camera/microphone/location and durable files are simulated; no OS permissions requested |
| A05: import review | Select sample files, include/exclude, correct date, batch scope, review final audience | Duplicate, unsupported FIT/GPX example, missing timezone, per-file failure | No real gallery scanning, picker, parsing, upload, or media processing |
| A07: focused editing | Edit a chapter/caption/practical detail, reorder with buttons, inspect source, conflict comparison | Estimated/reported/unknown route correction, participant branch, unsaved back navigation | Dense composition remains creator-web led |
| A08/A09: highlights and account | Select approved highlights, inspect canonical link; profile and storage/sync summary | Empty eligible selection, signed-out/expired state, departure/withdrawal entry | No real export, share-sheet output, account deletion, or storage measurement |
| W01/W02/W05/W06 | Journey overview, same-ID history, source review, audience choice, chapter editing, attribution, independent powers | Participant/admin-only denial, publisher-only inspection, stale candidate, missing media | No collaborative transport or server mutations |
| W03/W04/W07 | Stage list with schematic route, sourced suggestion review, evidence correction, dated practical detail, conflict resolution | Accept/Edit/Dismiss, one merge/split/reject, regeneration retaining corrections, no-GPS/rest day, uncertain time, rental cost context | No Mapbox SDK, geocoding, routing, AI generation, or transcription |
| W08/W09 | Rights/privacy review, exact sample viewer preview, visibility/listing choice, local publish/republish; account/history | Source withdrawal, archive, transfer acceptance, canonical deletion impacts, export grant and pending restriction | No publication pipeline, backup receipts, original-file archive, or real public URL |
| P01/P02/P03/P04/P05/P08 | Discover sample listing/filter, Story/Explore/Learn, persistent stage, guest search/result/source jump, unavailable | Whole-journey/Day 2/rest filters, next/previous, user-started schematic play/pause, no-results, old cost context | Fictional sample material; no production SSR/SEO, Map/Satellite rendering, or search performance claim |
| P06/P07 and research | Own-contribution highlight defaults, credited group-item selection, preview/full-journey disclosure; optional public-profile reference; save research separately | Empty-personal-selection fallback, withdrawn highlight, private saved note, new distinct event reference, listing pending/taken down | Static social-card preview only; profile is a small example, not a new social product |
| Journey questions within P04 | Select a prepared question and inspect a buffered sample answer/citations | Sign-in, quota/provider failure, invalidated answer, unknown current-price abstention | Fixed sample responses; no AI call, streaming, or general travel advice |

Web creator navigation: Home, Journeys, Saved research, Discover, Account; inside a journey use Overview, Story, Route, Learn, Sources, People, Publish. Native uses Journeys, Capture, Moments, You, with journey tabs from the design baseline. Public uses Story, Explore, Learn. Preserve selected stage/moment when switching public views. Mobile web remains a responsive web experience, not an imitation of native capture.

## 5. One coherent sample journey

Use a labelled fictional multi-day group journey, spanning departure, activity, rest/transfer, and return. All dates, claims, prices, identities, and geometry are sample content. Do not imply actual travel, current access, route safety, or current provider availability.

Use five accepted sample identities on one canonical journey: creator with administration/coauthor/publisher powers, participant without editorial powers, administrator-only variant, coauthor without publishing, and publisher without editing. Variant scenarios change the administrator assignment while preserving the one-administrator rule; they must never create two current administrators. Include a source owner who has left and retains only owner restriction/export access through Your contributions. These are test actors, not real accounts.

The seed includes:

- Six stages, including a no-GPS/rest stage, a participant-specific branch, one recorded segment, a reported leg, an estimated connection, and an explicit unknown gap.
- Around 18 moments: sample photographs, a short-video placeholder, two voice-note/transcript examples, text, and remembered events. Include capture/entry/upload times separately and one unknown timezone.
- Sources across all three scopes, missing publication rights, a redacted sensitive place/contact, permitted attribution, a failed import, and one separate original-file export grant with recipient/files/expiry.
- A draft and approved version with intentionally different captions; an accepted correction, a stale candidate, and one withdrawn source referenced by a highlight and a prepared answer.
- A pre-composition state with selected sources but no assembled draft; prepared chapter/association suggestions and one transcript-derived practical detail, with explicit source links and uncertainty. Include Accept/Edit/Dismiss, a merge/split/reject example, and a second prepared suggestion set that preserves accepted corrections.
- At least four practical details with observation date, contributor, source, and money/currency/unit/group-size context where relevant. Include an unknown current-price example.

Store an asset inventory with source, licence/permission, attribution and intended use. Prefer owned, licensed, or purpose-created sample media; native previews must work from bundled assets without hotlinking. The no-cover state remains a deliberate typographic composition. Sample basemap/route panels are labelled schematic; never use unlicensed map screenshots or add Mapbox merely for decoration.

Use seeded variants rather than multiplying independent trips: first run, prepared trip, editing, publication blocked, published version 1, edited draft, withdrawn source, unavailable, and restriction pending. Start each observed task from a named variant. Reset is explicit and clears the sample state; reloading/relaunching resets unless session-only retention is deliberately implemented and labelled. No durable-save claim follows from retained sample state.

### Cross-surface continuation without a sync service

Mobile and web do not synchronize their live sample controllers. The walkthrough deliberately switches to equivalent prepared checkpoints. Maintain a canonical continuation manifest with scenario ID, fixture version, actor/powers, journey/source IDs, draft/approved revision, completed sample actions, expected next task and corresponding native/web starting state.

For example, native task `capture-and-contribute` ends with source `sample-moment-19` permitted for journey review. The matching web checkpoint `review-moment-19` contains that exact source ID/content/scope in the same journey, ready for editorial review. The handoff control names the next checkpoint and states: “Load the prepared web continuation. This prototype does not sync devices.” Arbitrary native edits do not transfer and the interface must not imply they do. Separate exploratory tasks start from their own named checkpoints rather than pretending that an unmatched edit carried across.

Within web, creator edits, publication preview and public sample reading share one local scenario controller and one viewer projection; publish changes that local approved snapshot, while later edits stay draft-only. Opening a fresh browser/device starts a named prepared snapshot, not a second live consumer. Verify the named source's identity/content/scope through the native endpoint, web continuation, review, publication eligibility and approved reader. This tests narrative continuity and local projection behaviour; real cross-device synchronization remains later production work.

Name the reverse continuations too: `web-published-v1` → `native-highlights-v1` for A08 highlight selection, and `web-source-withdrawn` → `native-highlights-withdrawn` for the same source's removal/empty-selection state. Match journey/source IDs, actor, approved revision, scope and attribution in the manifest. Both controls state: “Load the prepared mobile continuation. This prototype does not sync devices.” These fixed checkpoints do not imply that arbitrary web edits synchronize to the native sample controller.

## 6. Repository and isolation decision

Use the existing `apps/mobile` and `apps/web`, existing design tokens and toolchains, and a feature branch `feat/experience-prototype` from current `development`. This planning change is documentation-only. Do not create another app, backend, workspace package, repository, hosted builder, database schema, or authentication bypass.

Proposed prototype implementation structure:

```text
apps/mobile/src/prototype/           screens, native scenario controller, generated seed/assets
apps/mobile/src/app/prototype/       thin native route files on the prototype branch only
apps/mobile/src/components/          reviewed reusable native controls
apps/web/src/prototype/              creator/public screens, scenario controller, generated seed/assets
apps/web/src/routes/prototype/       thin web routes on the prototype branch only
apps/web/src/components/             reviewed reusable web controls
tests/fixtures/prototype/            canonical seed, transitions, continuation manifest, asset inventory
scripts/prototype/                  deterministic seed copy/check and review helpers if needed
```

The precise route filenames follow the installed routers, verified when implemented. Native implementations stay under `src`, covered by the existing Unistyles Babel configuration; initialize theme before Router as today. Public prototype screens use a labelled client-rendered sample entry; retain the existing server reader/status qualification unchanged. Real public SSR and safe server projection remain production work.

Apps cannot import relatively outside their workspace. Keep canonical sample JSON/assets under `tests/fixtures/prototype`; a deterministic copy/check script materializes identical app-local fixture files. Commit the generated fixture outputs with their source hash so both hosts can consume exact checkpoints. The script uses Node built-ins, not a new fixture package or build stack. No React/native imports enter shared tokens or pure packages; do not widen workspace boundaries to share temporary mocks.

Scenario controllers are app-local, synchronous, and use the same documented transition rules. Put canonical input/action/expected-output vectors beside the seed and run the same critical vectors against both pure controllers: actor permissions, source scope versus eligibility, draft/approved separation, invalidated dependencies, reset, and continuation mapping. Compare projected outputs and effects, not just seed hashes. Presentation receives explicit data/actions; keep sample transitions, actor switching, prepared answers, and preview selection out of reusable controls. Use a small local reducer/controller, not a speculative generic data framework or fake OpenAPI server. Any future production adapter uses real generated clients and current server authorization.

### Isolation through branch lifecycle

A hidden menu, route guard, route group name, or development flag is not evidence that fixtures are absent from release artifacts. Expo Router SDK 58 protected screens remain registered and redirect when a guard fails; see the [SDK 58 migration source](https://github.com/expo/expo/blob/expo%4058.0.0/docs/pages/router/migrate/sdk-57-to-58.mdx), verified through Context7 for this plan. Parenthesized native route groups do not provide a URL namespace: record the actual resolved paths in the inventory, including collisions with existing/future routes. Therefore the first prototype stays on its review branch and is never merged into `development` wholesale. It may be shared as an exact committed/pushed source checkpoint under the normal workflow; it is not publicly deployed.

At handoff, preserve the reviewed prototype at its exact commit/branch and move selected reusable work into a fresh integration branch from current `development`. Review the actual diff; include production-quality controls/tokens and documentation only. Exclude prototype routes/controllers/seeds/assets, demo actor switching, fake account screens, prepared answers, and prototype-only dependencies. Regenerate and review `apps/web/src/routeTree.gen.ts`; inspect root layouts, navigation and entry imports on both platforms for leftover references. Do not blindly cherry-pick the whole prototype commit. The production integration has its own PR/checks when publication is requested.

On that integration branch, build actual web client/reader and native export/release inputs as applicable, inspect generated route inventories, bundles/source maps and packaged assets for prototype path/fixture markers, and attempt the former prototype deep links. They must be absent/unavailable without a flash of fixture content. Verify reusable modules do not import sample controllers. Preserve this evidence with the integration head. If selected screens later move over, replace their sample bindings in the owning production workstream before including them. Git preserves the walkthrough; a permanently shipped demo mode is not the handoff mechanism.

The artifact coverage record names web creator entry, reader client entry, server reader, Android JS export/assets and iOS JS export/assets individually. Verify actual served production web output as well as dev routing. Where packaging produces a native release APK/app, inspect its routes/assets too; a JS export alone is not native-package proof. Record exact commands, artifact hashes, host and any uninspected package/platform. Do not require a store-signed release merely to review the prototype, or borrow an older package's evidence.

## 7. What works and what is simulated

| Boundary | Prototype interaction | Production proof still required |
| --- | --- | --- |
| Forms/navigation | Real typing, validation feedback, back/cancel, selected context, focus and pending/error presentation | Real auth/session, server validation, invitation consumption, operation replay |
| Capture/import | Bundled media and deterministic selection/save/queue/permission scenarios | Real OS permissions, file/SQLite durability, process-kill recovery, real pickers and formats |
| Collaboration/rights | Actor-specific sample projection, source-scope changes, stale candidate comparison | Current server grants, concurrency, revocation, migration and cross-account isolation |
| Publication/reading | One sample projection shared by viewer preview and reading; approved/draft separation | Server-safe derivatives, caches, SSR, actual publication races and URL enforcement |
| AI/maps | Schematic route/list, prepared buffered answer and real UI source navigation | Authorized Mapbox integration/billing, processing, retrieval, citations and provider failures |
| Lifecycle | Impact preview, deny/pending/confirmed examples, transfer acceptance and frozen state | Independent journal receipt, replay, old-writer fencing, backup and restore qualification |

Show a persistent compact “Prototype · sample data” indicator and a separate accessible scenario panel. Sample sign-in selects a preset fictional identity; it never asks for real account credentials. A simulated save/backup/publication/receipt has a nearby simulation label; fake camera capture never claims a real file was saved. Simulated device connectivity never changes host networking. No real notification, email, invite, upload, download, API write, analytics, or external AI/map call is triggered. Sample sharing displays a labelled local prototype path that can be selected/copied using available platform affordances and explains that the recipient needs the same prototype environment. No clipboard/share dependency is added for a cosmetic interaction.

Use separate projected sample data for public views. The viewer/preview receives only eligible approved fields, never the full source library with hidden controls. A sample publication permission makes a source eligible, not automatically published; review-only content blocks inclusion. Changes after publication remain draft-only. Narrowing a source grant/withdrawing it immediately invalidates dependent sample highlights/answers and removes inaccessible output. This demonstrates the mental model, not a security boundary over synthetic bundled fixtures.

## 8. Interaction rules and consequential branches

- Membership, coauthor, publisher, administrator, source owner and original-export authority stay independent. Ordinary participants and admin-only actors cannot inspect the draft or another person's review sources. Non-admin People views expose only permitted identities; no general email roster.
- Grant selection names the current review audience. Adding coauthors/publishers changes that audience; adding ordinary participants does not. Original-file export needs its own exact recipient/files/expiry approval.
- Capture destination is visible before the simulated save. Location is optional, bounded to the explicit action, and can be absent. Saving, uploading, contributing, permitting publication and publishing are separate transitions.
- Route gaps stay gaps. Recorded/reported/estimated/unknown use text and line styles as well as colour. Stage lists work without the map panel; no map instance or tile request exists in this prototype.
- Publication review covers sources/rights, privacy, evidence, viewer/link/question-source previews, visibility and listing. Rights/privacy block; honest unknowns can remain. Unlisted and public discovery are distinct choices; publishing does not silently add a listing.
- A publisher without coauthor power can review/publish but cannot edit. A stale candidate preserves both versions and offers explicit resolution; accepted corrections survive regeneration scenarios.
- Reconstruction starts with selected sources, not an already finished story. Prepared suggestions show their source/uncertainty before Accept/Edit/Dismiss. One chapter/association merge/split/reject and a transcript-derived practical suggestion are reviewable; regenerating prepared suggestions retains the user's accepted correction. No actual AI generation runs.
- Guest search filters the local approved projection and practical categories with results, source navigation and an empty result. Starting questions or saving research introduces the sample sign-in boundary; reading/searching do not. Explore supports whole journey/Day 2/rest-stage filters, next/previous and user-started play/pause over the schematic sequence. Gaps/labels remain visible; reduced motion uses direct selection without animation. Web audio/video uses user-started bundled samples where supported; otherwise show a labelled playback-state example with transcript, never an implied working player.
- Personal highlights default to the actor's eligible attributed moments, allow a permitted group item with contributor credit, and show an explicit fallback when none of their own are eligible. Explain beside the preview that a recipient can open the full journey according to its visibility; a focused public highlight does not hide the rest of that public story. Static-card rendering is a shallow composition; system sharing remains simulated.
- Withdrawal, departure, transfer, archive, unpublish, personal-media deletion, account deletion and canonical deletion have separate impact language. Administration transfers only on acceptance; a missing successor can freeze expansion while restrictive owner actions remain available. Already downloaded copies cannot be recalled.
- Pending restriction confirmation remains distinct from complete. Retry cannot restore sample access. Real receipts are never fabricated or inferred from a UI timer.

## 9. Visual system and responsive behaviour

Use the existing contemporary field-journal direction: Paper/Forest/Clay roles, Newsreader editorial display, Instrument Sans controls, the established 4-point spacing scale, Lucide family, and evidence-aware journey line. Honour the selected font assets/weights and licences in the account/journey handoff. Shared tokens remain plain values; native styles stay Unistyles v3 and web stays Tailwind/owned shadcn. No NativeWind, `@expo/ui`, new design framework, cloud native build subscription, or Expo Go dependency is introduced.

Start with a small set of buttons, labelled fields, journey/source/person rows, scope selection, status, impact confirmation, chapter/practical cards and source badges. Preserve enabled-control borders and the focus halo specified by the design handoff. Creator tools favour readable compact work; public reading favours approved photography and narrative. The prototype does not add a page builder, booking UI, social feed, or trip planner.

Web layout checks cover 320–767 px, 768–1199 px, and 1200+ px: single-pane small screens, two-pane/drawer tablet, and three-pane creator workspace at wide sizes. Use representative 360/390, 820, and 1440 CSS-pixel captures plus a 320 px overflow check; these are test viewports, not additional breakpoints. On phones open the inspector as a separate panel with a clear back path; on tablets preserve selected chapter/source through layout changes. Public reading keeps Story useful before any map interaction.

Native checks cover the existing Windows Android emulator, Mac iPhone simulator, and available physical iPad in portrait/landscape; physical iPhone remains deferred. Include safe areas, system back, keyboard avoidance, long titles/names, large text and reduced motion. Use at least 48 dp Android, 44 pt iOS, and 44 CSS px web interaction targets. Provide keyboard/button alternatives to reordering, visible focus, semantic labels, text alternatives, accessible status announcements, no automatic audio, and screen-reader task checks. If a platform/device is unavailable, record the exact gap rather than substituting a web screenshot.

## 10. Implementation batches

Each batch has one visible outcome and a recorded source/fixture checkpoint. Record not started/in progress/reviewed/verified separately; model-reviewed does not mean device-verified. Batch numbering here is P00–P08 and does not renumber production B00–B09.

| Batch | Work and outputs | Exit evidence |
| --- | --- | --- |
| P00 Scope and baseline | Recheck requirements/decisions, actual Git/PR state, clean authoring checkout and host availability. Create route/actor/depth inventory, scenario catalogue, asset inventory and prototype progress record. | Exact base SHA; settled scope and simulation boundaries; no product implementation claimed |
| P01 Seed and navigation | Build canonical fixture copy/check and transition vectors, continuation manifest, app-local controllers, sample/reset panel and thin routes; keep status/reader probes intact. | Same seeds and critical transition outputs; actual paths inventoried; create/join/revisit one ID; no business API writes |
| P02 Component specimens | Implement shared token mappings and the bounded platform-owned controls. Render empty/no-cover, long text, pending/error, audience selector and rights status at phone/tablet/desktop sizes. | One bounded composition inspection, grouped corrections, and confirmation; accessible keyboard/touch states |
| P03 Native capture and group entry | Complete A01–A06 walkthrough, sample auth/invite, capture confirmation, queue/retry, import review, scopes and People. | Founder can create/join/capture/contribute; participant/admin-only denial and save-vs-upload explanations demonstrated |
| P04 Creator composition | Complete the native-to-web prepared continuation, W01–W07 pre-composition/suggestion review, chapter edits, source inspection, stage evidence, practical details and stale conflict. Add focused A07 editing. | Same named source continues; Accept/Edit/Dismiss and merge/split/reject work; regeneration preserves correction; both conflict candidates retained |
| P05 Publication and public reading | Complete W08 projection; P01–P05/P08, guest search, Explore sequence controls, republish/withdrawal; A08/P06 highlight privacy. | Preview equals local viewer output; Day 2 survives switches; guest search opens a source; highlights disclose full-story access; protected fields absent |
| P06 Secondary trust states | Supply bounded A09/W09/research, P07 profile, lifecycle/export/transfer and prepared question examples only for named remaining review questions. | Every inventory row has a depth/disposition; supporting examples do not delay core review; simulations and unbuilt capabilities labelled |
| P07 Task review and correction | Founder walkthrough; model critique of actual routes/screens/state; optional small participant round; accessibility and targeted checks below. Fix material misunderstandings as one grouped pass and confirm. | Findings with reproduction, severity, owner, disposition and evidence; open issues scoped honestly |
| P08 Production handoff | Archive exact prototype checkpoint; map reusable controls/screens and required real adapters to the production backlog; select a fresh integration branch and remove all fixture entry paths from the integration diff. | Reviewed extraction, artifact/deep-link absence checks, current-head evidence, and resumed B01–B02 plan |

Build one meaningful route through all three surfaces before expanding variants. P03/P04 can iterate sequentially from coherent shared fixture checkpoints; no concurrent edits to shared data/contracts or to another host's dependencies. Do not spend a separate sprint perfecting account forms before the sample story and viewer are connected. If scope grows, retain the central walkthrough and record lower-depth examples instead of silently dropping privacy/evidence checks.

## 11. Host and tool workflow

Windows is the authoring checkout for this combined prototype, giving the immediate Android loop. Windows native owns Android/Metro; WSL owns Compose/web verification; Mac owns iOS/Metro. Other checkouts consume exact committed/pushed checkpoints using the existing `checkout:sync` workflow. Do not copy dependency trees/native output, sync dirty folders, or create additional worktrees in shell commands. Stop builds/Watch before any source checkout change. If moving authorship to WSL for a sustained web batch, perform the documented clean handoff first and stop Windows source edits until returning authorship.

Activate `. .\.kairn\env.ps1` on Windows and `. .kairn/env.sh` on Mac before pinned tool commands; use the current [host guide](native_host_setup.md) for routes, signing and platform commands. Compose tooling must build current source into its image with `run --build`; record the in-container source/fixture inputs. Native compilation is repeated only when relevant native inputs change; changed JavaScript still needs actual Metro/device task evidence at the current source checkpoint. Prior foundation passes are not prototype acceptance.

Use Impeccable's planning/critique guidance within the existing design authority; Expo overview/routes/native UI and Unistyles skills for mobile; shadcn/router guidance for web; Kairn architecture/capture-sync/publication-access guidance for domain truth. Generic skill defaults never expand the selected stack. Use Context7 for actual version-specific API/configuration choices when implementing. No additional plugin is required.

For web interaction, use T3 preview tools according to the active session instructions. For devices, discover with `device_list`, open the specific host/device with `device_open`, use its returned `agent-device` command for all UI interaction, and inspect with `device_screenshot`. Do not drive UI through adb/ssh/simctl; those remain appropriate only for permitted builds/install/logs and unsupported device operations. No actual browser/device testing occurs while authoring this plan.

## 12. Verification and review tasks

Keep checks proportional. No database/auth/security suite or second testing stack is added for sample state. Use Vite+'s existing test runner and existing Playwright installation only where a real regression boundary warrants automation.

| Check | Scope and expected observation |
| --- | --- |
| Seed/transition boundary | Run canonical input/action/expected-output vectors against both pure controllers: deterministic reset, identity, actor rights, source eligibility, approved/draft separation and invalidation. Check the continuation manifest's named moment/content/scope on both surfaces. Test model outcomes, not every button. |
| Web integrated task | One browser scenario creates/joins sample journey, scopes a source, composes, resolves a blocker, previews/publishes and reads a source. A second critical branch withdraws that source and checks highlights/answers/unavailable. Include keyboard reorder and back/refresh. |
| Request boundary | Observe actual requests during core web/native tasks: no business API writes, auth calls, real uploads, AI/map calls, or external media hotlinks. Allow normal local bundle/assets/dev tooling. No polling is introduced merely to imitate progress. |
| Accessibility and layout | Keyboard/focus, screen-reader labels/status, contrast, large text, reduced motion, overflow, orientation and map/list equivalent on the stated surfaces. Use actual TalkBack/VoiceOver where available and record operator versus agent evidence separately. |
| Changed code/tooling | Existing format/type/boundary checks relevant to affected workspaces; web build and native JS export; changed native dependencies require the documented native build gates. No unrelated toolchain requalification for a JS-only screen edit. |
| Extraction safety | On the production integration head: inspect generated route graph, actual web/native artifacts and assets, attempt prototype URLs, and confirm no prototype imports/demo actors/fixtures. A string scan alone is insufficient. |

Founder task script: join without sharing the gallery; save a sample moment offline and explain its state; permit review without publication; load its explicitly prepared web continuation; build a draft from sourced suggestions and retain a correction after regeneration; resolve a stale caption; publish while retaining an unknown route; use guest text search to find a dated cost/source without the map; select Day 2/rest stage and control the Explore sequence; explain what a highlight recipient can open beyond the selection; withdraw a source and explain downstream changes. Include publisher-only and admin-only role variants. Observe attempts before explaining the controls.

An optional exploratory round with 3–5 reachable intended users can reveal vocabulary/navigation issues; it is not a statistical success estimate, demand validation, release acceptance, or a recruitment gate. Obtain consent for recordings, use only sample material, record task completion/assistance/misunderstandings, and remove recording data on the agreed retention schedule. If participants are unavailable, proceed with internal review and record that limitation.

For each task record source commit, fixture version/hash, platform/device/viewport, initial scenario/actor, result, assistance, screenshot/video if available, and finding IDs. Never mark a task as passed solely from another model's account. Keep private screenshots and host logs under ignored `.kairn/verification/`; commit concise sanitised findings/progress only.

## 13. Multi-model plan review and issue resolution

This plan is drafted and corrected by Codex. Use two independent Codex-model reviews with explicit briefs: one for end-to-end UX/scope/domain consistency, another for architecture/isolation/host workflow/verification. Give each the document paths, governing requirements, and a read-only task; require reproducible findings, severity, exact section, rationale, and a concrete correction. Reviewers do not create a new product scope or claim that simulated states prove backend behaviour.

Codex consolidates duplicates, checks each claim against current code/documents, fixes material issues, and records rejected suggestions with reasons. Then request the final independent review through OpenCode model `opencode-go/gemini-4-argon` (Gemini 4 Argon), specifically checking remaining contradictions, omission of web/native surfaces, mock leakage, unsupported acceptance claims and handoff feasibility. Model availability was confirmed for this planning task; future runs must recheck available providers.

Codex applies final findings and authors the final plan. If the final review exposes a substantive design contradiction, obtain a fresh Argon review of the corrected version; small editorial fixes need no new delegate. Record which exact revision each reviewer saw and whether the final changes were independently rechecked. Do not describe a fix-list verification as a full clean review. A model verdict is planning feedback, not founder approval or executed device acceptance.

Keep provenance, findings/dispositions and unresolved issues in [the review record](../research/prototype/review_2026-11-03.md). Start `docs/implementation/prototype_progress.md` only when implementation starts; this plan and its model reviews do not create an implementation pass.

## 14. Completion and return to production work

The design activity is ready to hand off when the connected core task works on the stated platforms, every screen has its planned depth, critical privacy/evidence/state misunderstandings have a disposition, real versus simulated capabilities are clear, and the reusable-code/exclusion backlog is actionable. Record unavailable-device or external-user gaps explicitly. Do not turn a founder preference or participant count into an approval gate for R1 implementation.

Keep two completion records: prototype interaction evidence and production-capability acceptance. The former never closes account/auth, SQL/migrations, local file/SQLite durability, real synchronization, current grants, publication/revocation, native integration, or recovery gates.

Resume B01–B02 with the selected account/journey contracts, reviewed design specimens and real migration/policy tests. Reuse qualified controls and interaction decisions; implement real data adapters only in their owning production slice. Native capture, imports, collaboration, transcription, reconstruction, publication, highlights, discovery and questions retain the existing order and complete-release obligations.

## 15. Next implementation action

The first coding change is P00–P01: confirm the actual source/host checkpoint, create the inventory and canonical sample seed, implement resettable prototype shells inside the existing apps, and demonstrate create/join of one sample journey without touching real account or journey data. Subsequent batches supply the story and public-reading value before expanding the secondary examples. This planning task does not start those changes or publish a PR.
