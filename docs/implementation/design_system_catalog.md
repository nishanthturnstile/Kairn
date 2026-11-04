# Open atlas component system

Implementation owner: frontend/design. Date: 4 November 2026. Authoring checkout: Windows, `feat/design-system-redesign`, based on development `d07a69508d98afecb5c9d1b9003956d1db1fa236`.

This is the DS01 consumer inventory, DS02–DS05 implementation guide and dependency ledger. The [redesign plan](design_system_redesign_plan.md) remains the completion authority. Component implementation, connected UX and production acceptance are separate. A fixture specimen does not implement a service.

## Direction and calibration

Retain Newsreader 500/600 for journey titles and Instrument Sans 400/500/600/700 for instructions, controls and prose. Use the bundled named native weights; never synthesize bold. The Open atlas palette starts with mineral canvas `#F3F6F8`, white `#FFFFFF`, slate text `#172D3B`, secondary slate `#405969`, deep blue `#164D70`, and selected blue `#E0EDF5`. Semantic light/dark mappings, including review, information, warning, success, danger, control boundaries and scrims, live in `packages/design-tokens/src/index.ts`.

The compositions are intentionally different: the catalog pairs explanation with working specimens; the account form is a narrow sequential task; the workspace groups permissions and edits; the reader pairs chronology with a focused chapter. On a phone, each becomes one readable column. No photography is needed to judge the forms or content specimen. Dates, rest days and unknown locations carry meaning rather than decoration.

References inspected on 4 November 2026 (text/structure, not a visual-browser or usability study):

| Source | Actual pattern inspected | Adopt | Mismatch to avoid |
| --- | --- | --- | --- |
| [USWDS forms](https://designsystem.digital.gov/components/form/) | Visible labels, grouping, instructions and form accessibility guidance | Explicit help/error associations and task order | Government-specific visual branding and dense instructions |
| [V&A collections](https://www.vam.ac.uk/collections) | Collection search, separate date bounds, object titles, credited media and availability labels | Keep provenance and availability adjacent to the item; clear search scope | Trending/social popularity as evidence of journey relevance |
| Existing Kairn [direction studies](experience_directions.html) | Open atlas compared with travel-album and expedition-editorial directions | Chronology beside content; images carry no essential labels | Decorative paper, maps or photographic heroes masking weak forms |

The NPS maps page could not be retrieved and is not counted as inspected inspiration. Geographical/map calibration remains open with DS06. These observations supplement the selected direction; they do not constitute full DS01 visual research acceptance.

## Ownership and API

| Concern | Web | Native |
| --- | --- | --- |
| Semantic roles and dimensions | `packages/design-tokens` via generated CSS | Same plain tokens via `theme/unistyles.ts` |
| Button | `components/ui/button.tsx` | `components/ui/button.tsx` |
| Field and controls | Owned shadcn `field.tsx`, `input.tsx`; `form-controls.tsx` compositions | `components/ui/field.tsx` |
| Selection | Browser select, checkbox/radio; `SegmentedControl` | `components/ui/selection.tsx` picker/checkbox/radio/segments |
| Confirmation | `components/ui/dialog.tsx`, browser top-layer dialog | `components/ui/feedback.tsx`, RN Modal |
| Journey content | `components/journey-content.tsx` | `components/journey-content.tsx` |
| Catalog | `/prototype/components` | `/prototype/components` |
| Appearance | `components/appearance.tsx`, pre-mount `appearance-init.ts` | `theme/appearance.tsx` and Unistyles adaptive themes |

Buttons use `primary`, `secondary`, `quiet`, `destructive`. Primary commits the task; secondary is a bordered alternative; quiet is reversible supporting navigation; destructive requires an impact explanation. Web children and native `label` carry the same stable name. `pending` disables repeat activation and exposes busy state; it never replaces the label. Native shows the platform progress indicator; web shows busy state and a dashed boundary. Existing account actions keep their contract and command identity.

Fields put the visible label before the control, then description or error. Web `FormField` provides IDs to the input and helper/error. Existing account TanStack Form composition keeps its validated Field APIs. Native `Field` associates the visible label and supplies the description as an accessibility hint; account inputs retain their existing refs/focus and field-specific errors. TextArea grows through scrolling/native multiline or browser resize. Drafts stay in caller state on failures, theme changes and panel changes. A session-only draft never says it was durably saved.

Minimum controls: 44 CSS px web; 48dp native, including icon-only and compact variants. Controls grow with text rather than using fixed heights. Shape: 6px controls; 12px media/layers; 16px large content surfaces; circular radios/avatars only. Focus is distinct from selection. Native pressed feedback replaces web hover; web radio groups use browser arrow-key behavior, native exposes radiogroup/radio/checked semantics. Long native picker options scroll in a Modal with a visible Cancel action and system-back dismissal. Native picker focus requests are implemented but require real screen-reader confirmation.

Web Dialog uses `showModal`, inert siblings, safe Cancel autofocus, Escape and return focus; actions do not implicitly submit surrounding forms. Native Modal supplies its own window and system back; accessible focus return, keyboard and TalkBack/VoiceOver acceptance remain open. No animation is required for comprehension. CSS removes transitions under reduced motion; native new overlays use no transition animation.

## Theme behavior

Default is the device preference. An explicit Light/Dark choice persists per browser origin in localStorage and per native installation in SecureStore. Storage failure falls back to memory for that session; appearance storage is independent of account credentials. The web boot module applies the stored/system appearance before mounting React. Native starts adaptive, loads its preference before rendering the app navigator, then responds through Unistyles. Theme changes do not replace the navigator, reset account forms, change actors or select another chapter. Navigation/status-bar colors use the active native theme. Photographs retain their original pixels; labels and fallback surfaces adapt.

Native shared static fonts are loaded once at the root. Prototype font-loading duplicates were removed. Account ScrollView styling uses `withUnistyles` for reactive `contentContainerStyle` rather than assuming it behaves like a normal style prop.

## Complete family disposition

“Implemented” below means source/component implementation. Evidence and platform acceptance are in [redesign progress](experience_redesign.md).

| Family from plan section 7 | Existing consumers / duplication | Disposition / owner / next gate |
| --- | --- | --- |
| Button, icon button, link | Owned shadcn; prototype Button; JournalButton; account Action | Consolidated into platform UI Button. Legacy wrappers delegate. Browser links retain URL semantics; native links retain Expo routing. Full native evidence open. |
| Field | Shadcn account fields, prototype render-prop Field, JournalField | Canonical field anatomy. Existing account validation preserved. |
| Input, TextArea | Accounts, create/join, caption, discovery | Canonical web inputs and native Input/Field; real account refs retained. |
| Password | Real account sign-in/create/reset | Existing visibility/autocomplete behavior retained through Input and Button. No second password framework. |
| Search | Discover | Browser search Input, current result/clear states retained. Native discovery awaits listing adapter. |
| Select/picker | Discovery, moment-day, sample actors/scenarios; appearance; metadata specimen | Browser Select and native cancellable Picker. Native runtime/accessibility gate open. |
| Combobox/multiselect | No large-option-set product consumer yet | Specified/deferred to DS07 import or DS09 search only when simple select fails. No unused component. |
| Checkbox/radio | Capabilities, scopes, import specimen | Implemented both; full-row native/DOM controls. Mixed state deferred until real grouped import selection. |
| Switch | No current binary setting warrants it | Deferred. Appearance has three values and correctly uses Select/Picker. Future binary settings must recover failed writes. |
| Segmented control/tabs | Reader and workspace custom button loops | Consolidated. Radio selection semantics, visible selected state, caller-owned preserved panel values. Route navigation remains links. |
| Date/time | No connected journey-date/import editor | Browser date specimen; optional/unknown date explicit. Native date/time and timezone corrections deferred to DS07 real import adapter, no text field pretending to be a date picker. |
| Slider/range | No connected playback/media consumer | Deferred to explicit DS06 playback with direct value/keyboard alternative. |
| Dialog/confirmation | Catalog impact disclosure; account platform alerts | New platform Dialog specimens; real account native alerts retained. Web focus accepted; native focus/keyboard gate open. |
| Drawer/sheet | Native picker | Modal option sheet implemented with scroll/Cancel/back. General editor drawer deferred until DS07 task. |
| Menu/popover | Sample controls disclosure | Retain native browser disclosure, explicit selections. No ARIA menu pretending all content is menuitems. Dedicated action menu deferred to named consumer. |
| Tooltip | No essential consumer | Deferred. All essential help remains visible; icon-only controls have accessible names. |
| Alert/notice/toast | Account alerts, restriction receipts, sample status | Existing persistent account/restriction behavior retained. Native Notice and semantic web notices. Transient toast deliberately deferred for critical states. |
| Progress/skeleton/loading | Account and button pending, real avatar processing | Truthful busy/processing states retained; no fake percentages. Per-file progress/skeleton deferred to real transfer/derivative adapter. |
| Empty/error/unavailable | Search, account outage, missing cover | Retained/redesigned and media fallback added. Protected errors must remain non-disclosing. Full restricted publication reads await DS08. |
| Navigation/header | Web horizontal shell; native bottom links | Retained semantics/current state/safe areas, themed. Production-route gating remains server-owned. |
| Card/list/data | Journey previews, source and people rows | Quiet full-width rows and separate media; no new generic card grid. Bulk table deferred to actual import data. |
| Accordion/disclosure | Source explanations, sample tools | Browser details retained; do not hide critical errors/rights explanations. Native generic disclosure deferred. |
| Breadcrumb/pagination | Previous/next reader chapters; one catalog result | Chapter paging retained. Discovery result pagination/breadcrumb deferred until real bounded hierarchy/result service. |
| Badge/avatar/contributors | JournalStatus, prototype Status, account avatars, sample people | Themed via semantic adapter, circular avatars retained. Native and real account avatar failure behavior unchanged. Generic contributor data extraction still open. |
| Journey preview/cover | Existing visual wrappers, reader, discovery | Retain title outside media; new Media accepts source/alt/caption without fixtures and fails to text. Remaining legacy covers need adapter migration. |
| Day/chapter navigation | Web reader and native reader inline loops | Extracted ChapterNavigation on both; rest/transfer/long titles remain. All-days/deep-link/back restoration still DS06. |
| Timeline/activity segment | Existing sample stage list only | Keep chronology; full parallel branches/reorder deferred to canonical revision/import adapters, DS07. |
| Route context/map controls | Explicit diagram and evidence legend | Retained honest diagram. Actual map/satellite/attribution/playback awaits selected SDK and authorized overlays, DS06. |
| Moment/media gallery | Source rows; cover media | Media fallback extracted. Full-screen photo/video/voice viewer requires authorized derivatives, DS06–07. |
| Practical detail | Reader Learn inline cards | Extracted PracticalDetail with dated value, author and source action, fixture-independent both platforms. Currency/units remain observed content. |
| Import review/upload queue | Session-only legacy sample descriptions | Not a real queue. Blocked for production by durable files/SQLite/resumable transfer boundary; DS07. |
| Collaboration/source scope | AudienceSelector; native source scopes; People | Existing actor/source projection preserved. Selected authority/real invitations await B05/B06/B08 transports, DS08. |
| Story editing/conflict | Session caption and one-step undo | Form controls migrated. Expected-revision conflict resolution and durable drafts require real revision service, DS07. |
| Publish review/sharing | Prepared approved fixture set | Keep no-publication/no-link wording. Exact-version preview/redaction/approval awaits actual publication service, DS08. |
| Restriction/lifecycle | Existing account restriction and recovery boundary | Preserve persistent receipts and command semantics. Journey-level withdrawal/leave/unpublish/transfer UX awaits corresponding commands, DS08. |
| Highlights/saved research | No connected consumer | Specified/deferred to authorized reads and private saved-notes adapter, DS08–09. |
| Search/grounded answer | Metadata search only | Metadata filter retained. Buffered answers/citations/quota/invalidation require approved corpus and server AI adapters; DS06/09. No fake answer UI. |

## Screen traceability

| Governing ID | Current location / source reality | Redesign milestone and disposition |
| --- | --- | --- |
| A01 | `prototype/screens.tsx` NativeJourneys; sample create/join | DS09; primitives migrated, real private history B05 open |
| A02 | No capture screen | DS07; add after durable capture boundary |
| A03 | No durable confirmation screen | DS07; depends on actual bytes/SQLite acknowledgement |
| A04 | Sample source/status content only | DS07; real sync queue and relaunch recovery open |
| A05 | No real import review | DS07; selected files/timezones/duplicates adapter open |
| A06 | Native sample journey overview | DS05/07; source-status sample retained |
| A07 | No connected native chapter editor | DS07; revisions and authorized source writes open |
| A08 | No connected personal highlights | DS08; approved selection service open |
| A09 | `screens/account-screen.tsx`; real account APIs | DS09; Button/Input/appearance migrated; existing B04 native gates still open |
| W01 | `prototype/journeys.tsx` and workspace | DS05/09; form primitives migrated, B05 transport open |
| W02 | Workspace Story sample caption/undo | DS07; controls migrated, durable revisions open |
| W03 | Reader diagram; no route editor | DS07; authorized route writes open |
| W04 | Reader Learn is read-only fixture | DS07; sourced detail edits open |
| W05 | Workspace Moments and audience fixture | DS07/08; scope behavior retained, real transfers/grants open |
| W06 | Workspace People and real account capability specimen | DS08; rights remain distinct, journey service open |
| W07 | No connected revision comparison | DS07; retain both candidates when revision API exists |
| W08 | Workspace Review fixture | DS08; no issued links/publication claims, exact approval open |
| W09 | `features/accounts/account.tsx`; real profile/security/export | DS09; button vocabulary/themes migrated, private history/saved research open |
| P01 | Discover fixture in `prototype/experience.tsx` | DS09; actual metadata filtering retained; eligible listings/moderation open |
| P02 | JourneyReader and NativeReader plus existing approved SSR reader | DS06; chapter/practical/media primitives, fixture interactions verified; authorized full reader open |
| P03 | Explicit illustrative route diagram | DS06; genuine map/authorized overlay open |
| P04 | Learn practical fixture | DS06; source jumps retained; real search/answers open |
| P05 | Source chapter action only | DS06; approved supporting source detail open |
| P06 | No public highlights | DS08; approved selection/access open |
| P07 | No public profile | DS09; deliberate public identity/listing service open |
| P08 | Existing non-disclosing unavailable boundary | DS08/09; preserve protected payload redaction; old-link tests need service |

## Migration and compatibility ledger

| Retained compatibility | Named consumers | Exit |
| --- | --- | --- |
| Web prototype `Button`/`Field`/`Status` | Journeys, Workspace, Shell, prototype scope rows | Button/Field already delegate to canonical UI. Remove wrapper imports after remaining Status/Audience product extraction in DS05/12. |
| Native JournalButton/JournalField | NativeJourneys, NativeJourney, Samples, NativeReader | Both delegate to canonical controls. Remove names after complete native screen migration; JournalText/Status still own typography/badges. |
| Native account Action | Real AccountScreen sign-in/profile/security/export | Delegates to Button; preserve callback and ref contracts until account acceptance rerun. |
| Web default/outline/ghost aliases | Public Button API compatibility; active account consumers now use secondary | Remove in DS12 after downstream consumer/API check. New use should choose primary/secondary/quiet. |
| CSS color aliases paper/ink/forest/clay | Legacy account specimen CSS, prototype CSS/visual wrappers, setup shell | Adapter maps to semantic roles in either appearance. Remove as these styles move; never add new consumers. |
| Static legacy colors in tokens.color | Existing consumers of plain legacy palette | Audit remaining native/static-reader consumers before removal. Dark preference must not silently change source imagery. |

Removed: obsolete web prototype Specimens/ReaderShell, native NativeSpecimens, prototype button/field style implementations, duplicate native prototype font registration. Preserve upstream skills and licensed font originals.

## Extension and verification

Add a token only for a real semantic or repeated layout need; update both theme mappings and generate CSS. Units are handled by platform adapters: dimensions are numeric on native and px in generated CSS, media ratios remain unitless. Add a component under the owning platform's UI folder, document controlled state and named consumer, then add a matched specimen with a consequential failure or edge state. Keep fixture imports in catalog/controller files, outside component APIs. Choose platform selection/modal semantics before custom interaction code. New controls must inherit text scaling, system appearance, minimum targets and reduced-motion behavior.

Run `pnpm test:design-system` for built-client catalog/reader interactions and accessibility/responsive evidence, `pnpm --filter @kairn/web check`, `pnpm --filter @kairn/mobile check`, relevant Vite+ lint and existing prototype isolation tests. The built-client harness is deliberately API-free and is not account/backend or production routing acceptance. It writes private screenshots and JSON under `.kairn/verification/design-system/`. A real compiled native session remains necessary for native focus, back, keyboard, screen-reader and text-scale acceptance.
