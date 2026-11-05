# Public web: workflow and screen specification

> **Visual reset, 5 November 2026:** [DESIGN.md](../../DESIGN.md) is the active planning hub. Keep the tasks, information, permissions, connectivity and recovery requirements below. Visual identity, layout, navigation composition and component appearance are undecided; remaining container/label examples are revisitable interaction proposals, not approved page designs.

Date: 5 November 2026. Status: complete planning draft for business and interaction review; no new screens or production capabilities implemented. Authoring checkout: Windows. Source baseline: `4a6528e728bc4c799a957730dcd6244b65417ab7`, equal to fetched `origin/development` when inspected. Branch: `chore/public-web-workflow`.

This document defines what visitors see, how every public-web screen connects, what each screen contains, and how permissions and failures change the experience. It is the public-web workflow input to the [fresh design process](../../DESIGN.md), not a replacement for the complete product plan. Proposed routes and interaction defaults below are design decisions for review, not existing API contracts. Business changes can revise them; changes to governing requirements must be recorded explicitly.

The [shared lifecycle and cross-surface specification](lifecycle_workflow_spec.md) owns complete X-member/X-new/account destinations, operator report/listing handling and cross-surface restriction outcomes. Public `/stories/...` routes are distinct from private creator `/journeys/...` routes; aliases still resolve one canonical journey.

## 1. Product understanding and research conclusions

Kairn turns selected contributions from one group's journey into one approved, departure-to-return record. Visitors experience what happened, understand the geography, and learn from dated, attributable observations. A later group may use that record as research, but does not inherit the original group's experiences as its own history.

The public experience must answer four questions in order:

1. Is this a journey relevant to me, and when did it happen?
2. What happened, including travel, rest and return?
3. What did this group actually arrange or learn, and what supports that account?
4. Can I privately save it or ask a question without losing the context I was reading?

### 1.1 Governing evidence

| Source | What it determines here |
| --- | --- |
| [Product plan](../core/product_plan.md), sections 1–4 | Initial audience, shared journey value, experience versus planning, and unproven commercial hypotheses |
| [Requirements](../core/product_requirements.md), sections 2, 10–17 | Canonical identity, evidence, public access, viewer, highlights, discovery, profiles, saved research, questions and revocation |
| [Architecture](../core/architecture.md), sections 5–7, 9, 11–14 | Safe publication projection, server rendering, current access, map loading, search and buffered answers; section 14 remains the dependency authority |
| [Functional screen inventory](../core/application_design.md#71-screen-inventory) | P01–P08 IDs, view continuity, stage navigation, source inspection and accessibility |
| [Fresh design hub](../../DESIGN.md) | Visual direction, navigation composition and reader layout are undecided. |
| [Ecosystem direction](../core/ecosystem_direction.md) | Player and Replay responsibilities, with Privacy and Publisher as delivery boundaries; these are not additional navigation destinations |
| [Prototype boundary](../../DESIGN.md#5-prototype-boundary) | Fictional data, explicit simulations and a new plan after relevant design decisions. |
| [Account/journey handoff](accounts_journeys_access_design.md) | Ownership of sign-in, account settings, member highlight creation and new-journey handoffs |

Research interpretation: a generic travel homepage, social feed, map-first dashboard or chatbot-first application would obscure the product. Use a catalog to find an event, a reader to understand it, and evidence links to inspect claims. This is a product-specific design conclusion, not a claim of market validation.

External research is limited to primary accessibility guidance relevant to these interactions: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/), [modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) and [pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide), consulted 5 November 2026. These inform reflow, focus management, status announcements and playback control. No competitor feature or new service is selected by this document.

### 1.2 Fresh visual and page planning

Brand, color, type, spacing, icons, logo and page composition are undecided. Plan them through DESIGN.md; no former layout, breakpoint, reading width or token is the baseline.

Keep the functional distinctions: Story explains the event, Explore adds geography/sequence, Learn exposes dated practical evidence, and Discover finds eligible journeys. Dates of travel, observation and publication remain distinct. Missing media and unknown locations need useful accessible states. Choose how those facts appear during fresh page design.

### 1.3 Product boundaries

- Guests can discover, read, search approved journey text, inspect sources, view eligible profiles and highlights, and report an issue.
- Sign-in enables private saved research and question sessions. It does not unlock unpublished material.
- A public profile is optional. Contributor attribution does not imply a public profile or permission to expose a roster.
- Personal highlights are a presentation of one canonical journey. They are not a privacy boundary, separate trip, listing or question corpus.
- No bookings, current-price promises, navigation instructions, safety certification, social feed, comments, likes or follower counts.
- No cross-journey AI synthesis, general travel assistant, automatic gallery access, viewer original downloads, cinematic exports or preparation workspace in this specification.
- Local prototyping requires no new subscription. Production map, hosting and model costs remain separate architecture decisions; this document promises no free production service.

## 2. Inventory and screen ownership

Canonical P IDs are retained. Suffixes below identify states or subflows, not competing top-level screen IDs. `R-*` and `X-*` are document-local handoff labels only.

| ID | Screen or subflow | Audience | Main success | Prototype depth |
| --- | --- | --- | --- | --- |
| P01 | Discover and filtered results | Guest or account | Find one relevant eligible journey | Connected filters/results/open journey |
| P02 | Story | Anyone with current publication access | Understand the event in order | Core, including all days and no-cover states |
| P03 | Explore | Same as P02 | Understand sequence and evidence without requiring map gestures | Core schematic map, selection and playback |
| P04 | Learn | Same as P02 | Find dated arrangements and supporting evidence | Core categories, stage filtering and practical cards |
| P04.search | Journey text search | Same as P02, no sign-in | Find an approved passage or detail | Core query/result/source transition |
| P04.question | Private journey question panel | Guest prompt; account to submit | Obtain a sourced answer or honest abstention | Focused prepared response and failure transitions |
| P05 | Approved source detail | Same current publication access | Inspect actual evidence and return to origin | Core text/media/citation/back behavior |
| P06 | Personal highlight landing | Eligible link recipient | Enjoy the selection and understand full-journey access | Focused selection/full journey/withdrawal |
| P07 | Optional public profile | Guest or account | View intentionally selected public references | Focused profile/list/empty/unavailable |
| P08 | Generic unavailable | Any visitor | Understand lack of access without protected details | Core safe fallback and onward navigation |
| R-list | Saved research | Signed-in owner | Revisit privately saved references | Focused list/open/remove |
| R-note | Save/edit research note | Signed-in owner | Save a reference with an optional private note | Focused save/failure/return |
| X-auth | Sign-in and return | Guest or expired session | Resume the intended personal action | Existing account flow handoff |
| X-report | Report issue/contact | Guest or account | Submit an issue without needing membership | Focused form/submitted/error |
| X-new | Create distinct journey | Signed-in account | Start another event with a reference only | Existing creator flow handoff |
| X-member | Highlight creation/profile management | Authorized member or account owner | Configure personal presentation | W09.highlights / W09.highlight-preview / W09.public-profile in the shared specification |
| X-info | About, privacy, terms and support | Anyone | Understand product and data use | Supporting content destinations; copy remains a separate handoff |

Existing code is a starting point, not full coverage: `apps/web/src/routes/prototype.reader.tsx` validates view, chapter, one/all-days and category; `apps/web/src/prototype/experience.tsx` contains sample Discover and reader compositions; `reader-navigation.ts` delegates selection parsing to shared logic. Their existence does not demonstrate production permissions, public SSR, real discovery, saved research or questions. Do not replace existing route semantics silently when implementing this plan.

## 3. Connectivity: incoming and outgoing navigation

### 3.1 End-to-end routes through the experience

| Workflow | Connected sequence | Completion |
| --- | --- | --- |
| Find and understand | P01 → P02 → P03 → P02 | Reader can explain chronology and route uncertainty |
| Research a detail | P01 → P02 → P04 → P05 → P04 | Reader can identify observation date and evidence |
| Ask and inspect | P04.question → X-auth if needed → P04.question → P05 → P04.question | Reader sees a validated answer and can inspect its source |
| Save and return later | P02/P04/P06 → R-note via X-auth if needed → origin → R-list → P02/P04 | Same canonical reference, private note, retained reading context |
| Receive personal share | External link → P06 → P05 or P02 → P04.question | Full-journey scope is explicit before asking |
| Browse a profile | Eligible attribution or external link → P07 → P02 | Only selected eligible public journeys appear |
| Reuse research | R-list → X-new → new creator journey | New event identity; original history is not copied |
| Handle removal | Any managed read → safe partial state or P08 → P01 | No stale title, location, source or answer disclosed |
| Report a problem | Any public surface → X-report → origin/receipt | Failure is recoverable; reporting does not itself claim removal |

### 3.2 Complete adjacency register

Global links apply to P01–P08: brand/Discover → P01; About/privacy/terms/support → X-info; Sign in → X-auth; signed-in Saved research → R-list; account menu → existing account screen. All return paths must be local validated destinations. No action follows an arbitrary supplied return URL.

| Screen | Can arrive from | Can leave to | Context carried |
| --- | --- | --- | --- |
| P01 | Direct URL; global navigation; P08; R-list empty state; browser Back | P02 via result; R-note via Save; X-report for listing; global destinations | Search/filter/page/scroll retained on Back; journey ID on result |
| P02 | P01, P03, P04, P04.search, P04.question, P05, P06, P07, R-list, external full-journey link, creator preview handoff | P03, P04, P04.search, P05, P07 when credit has eligible profile, R-note, X-report; authorized member handoff to X-member | Journey, selection, approved version and optional origin |
| P03 | P02, P04, P04.question, P05 “View in Explore”, direct valid view link | P02, P04, P04.search, P05, R-note, X-report | Same stage/moment; map style/camera are temporary, not access state |
| P04 | P02, P03, P04.search, P04.question, P05 return, P06 question handoff, R-list saved context, direct link | P02, P03, P05, P04.search, P04.question, R-note, X-new, X-report | Stage/moment, category, focused practical detail |
| P04.search | Search action in P02/P03/P04; direct safe search URL | P02 passage, P04 detail, P05 source; clear/close returns to origin; P04.question via explicit Ask | Query and selected result context; results never cross journeys |
| P04.question | P04 Ask; P04.search Ask; P06 Ask about full journey; X-auth return; own session resume | P05 citation; P04 cited detail; P02/P03 mode switch; X-auth when expired; close to originating view | Journey/version, account-owned session, return focus; never question text in shared URLs |
| P05 | P02 moment, P03 marker/list, P04 source, P04.search result, question citation, P06 selection, direct source link | Exact invoking screen; P02 stage; P03 if public placement exists; P07 if eligible credit; X-report | Source ID, supported citation offset, origin view/filter/scroll |
| P06 | External hosted share link; authorized creator preview/share flow | P02 full journey; P05 selected source; P04.question with full-journey disclosure; P07 eligible sharer profile; R-note; X-report | Canonical ID, selected source identity and share origin |
| P07 | External profile link; approved linked credit from P02/P05/P06; account own-profile preview | P02 selected journey; X-report; own account settings via X-member | Eligible public journey ID; profile list scroll on return |
| P08 | Any denied, deleted, unknown or unsupported managed publication/source/share/profile URL | P01; safe Back; X-report/support; Retry only for a classified transient failure | No protected context or existence explanation |
| R-list | Signed-in global navigation/account; R-note “View saved research”; direct private route | P02/P04 saved reference; R-note edit; X-new; P01; remove confirmation; X-auth on expiry | Private account scope, saved context when still valid |
| R-note | Save from P01/P02/P03/P04/P06; edit from R-list; X-auth continuation | Invoker on save/cancel; R-list; remain with input on failure | Canonical reference and private draft note, not a media copy |
| X-auth | Save, Ask, R-list, account/global sign-in | Original eligible destination and explicit pending action, or original screen on cancel | Validated return intent; public reading remains available |
| X-report | P01–P08, including source and profile contexts; X-info support | Receipt then safe origin; cancel to origin; support fallback | Opaque report target and user description; no protected preview |
| X-new | R-list selected reference or explicit Learn handoff | Creator create-journey flow; cancel to R-list/reader | Original reference only, never original media or completed facts |
| X-member | P02 eligible highlight action; P07 own-profile action; account | W09.highlights / W09.highlight-preview; W09.public-profile; E01 if needed; origin on cancel | Current eligibility and validated return; P06/P07 are reader/preview results, not composers |
| X-info | Global navigation; safe unavailable/report/status help | Chosen public-safe help/policy content; X-report or configured support; safe origin/Discover | Public content and validated return only |

P08 is also the terminal fallback for a source-specific failure, but preserve the still-accessible surrounding journey when possible. A withdrawn source need not erase unaffected chapters. Where dependency safety is uncertain, deny the affected publication rather than guess a safe remainder.

### 3.3 URL, history and return contract

Proposed production route shapes, to reconcile with the routing implementation before coding:

| Destination | Proposed shape | Shareable state |
| --- | --- | --- |
| Discover | `/discover` | Approved-field query, region, date interval, category, duration, status, page |
| Journey | `/stories/:publicationAlias` | `view`, `chapter`, `moment`, `days`, practical category/detail |
| Source | `/stories/:publicationAlias/sources/:approvedSourceId` | Supported media offset; no raw object URL |
| Highlights | `/highlights/:shareId` | Authorized share identifier |
| Profile | `/people/:profileId` | Public profile identifier |
| Saved research | `/research` | Private account-owned navigation only |

Unlisted link credentials require the architecture's dedicated access treatment; these illustrative paths do not define token placement or make opaque IDs authorization. Use no-referrer for unlisted access, exclude credentials from logs, and keep it out of listings/profiles. R1 public pages remain `noindex`; that is not access control.

Mode switches retain selected stage/moment. All days does not falsely mark a single chapter selected. If a moment has no representation in the next mode, retain its chapter and explain the missing map/detail rather than silently jump to day one. A search result outside the current stage explicitly offers a jump that updates the stage; changing filters cannot secretly widen the query scope.

Explicit page, mode and source navigation should create meaningful browser-history entries. Replace history for transient playback ticks or intermediate filter typing; do not generate dozens of Back steps. Stop playback before leaving Explore. Going Back restores the result/filter/reader position where valid, without automatically restarting media or loading a map.

P05 can be a desktop inspector or compact full-page view, but must have a standalone direct-link rendering. In-app close restores the invoking control and selection; a cold source link offers “View in Story” as its deterministic parent. Do not use unconditional browser Back for a link opened from another site. Unknown public selection IDs fall back to an accessible chapter with neutral feedback, while inaccessible resources use P08 without echoing private labels.

## 4. Screen specifications

### P01 — Discover

**Job:** find a relevant historical journey without signing in. Entries and exits are defined in section 3.2.

**Composition, in reading order:** global header; short product framing; labelled route/destination search; filter summary; result count; editorial result list; pagination/load-more control; support/footer. Wide screens can place filters alongside results. Compact screens expose a Filters button and selected-filter chips with individual remove actions and Clear all.

**Elements and functionality:**

- Search approved destination/route text. Enter or Search submits; the label states catalog scope. This does not search private sources or answer travel questions.
- Region, trip category, visit-date/season, duration and journey-status filters use available metadata. Unknown values remain unknown. Define matching behavior in the contract rather than guessing dates or treating absent duration as zero.
- Result: approved cover or no-cover composition, title, safe region summary, visit dates, duration when known, category/status when known, short approved excerpt, Open journey and Save reference. Attribution appears only if permitted.
- One result per canonical ID. Shares and members never multiply counts. Separate departures on the same route remain separate entries.
- Display publication/correction information separately when useful. No “verified safe” badge, popularity score or invented ranking.
- Save enters R-note, with X-auth first for guests; Open journey enters P02. Reporting a listing enters X-report.

**States:** initial loading without fake results; populated; catalog empty; no filter matches with Clear filters; invalid date range with inline error; network failure with Retry preserving filters; bounded loading-more failure preserving accessible current results; listing removed while open. Pending/removed listing status is primarily publisher-facing; visitors must not see an unauthorized pending card. Catalog removal alone can leave direct P02 access valid.

**Prototype proof:** filter a sample catalog, open a result, return to the same filters, and show one result despite several member shares. Ranking and production pagination are not claimed by a static fixture.

### P02 — Story

**Job:** understand the complete journey before loading a map.

**Composition:** public header; cover or typographic title block; title, visit dates, safe geographic summary and approved credit; Story/Explore/Learn links; All days/One day and chapter selector; ordered narrative; contextual source links; next/previous chapter; Save reference and Report. Authorized creator controls, if offered, are a distinct workspace handoff rather than reader editing tools.

**Elements and functionality:**

- Read useful title and text from the approved server-rendered projection before hydration. Do not show private draft content to a signed-in coauthor in the public reader.
- Chapters include departure, activities, rest, transfers and return when supplied. Preserve meaningful stage labels; do not force each stage into a calendar day.
- Approved photographs show captions/alt text and attribution. Short audio/video has deliberate Play and transcript/caption access. Media failure leaves narrative and source context readable.
- Select a chapter/moment, then Explore or Learn without losing selection. Open a moment in P05; return to the same scroll position.
- Show source-linked uncertainty in adjacent prose. A reported claim is not converted into a measured statistic.
- Save reference does not count the journey as the viewer's completed activity. An optional linked contributor identity opens P07 only when that profile is currently public and eligible.

**States:** loading; complete story; no cover; no GPS; sparse chapter; all-days; approved story while a newer private draft exists; partial source removal; full P08 denial; transient media failure. Do not reveal “the author has a draft” to visitors unless explicitly approved public metadata.

**Prototype proof:** complete the reader with maps disabled, visit a rest stage, switch modes and return from a source. Confirm no automatic media playback.

### P03 — Explore

**Job:** understand where and in what order the journey happened, including gaps and branches.

**Composition:** shared reader header and mode/stage controls; explicit Show map action; route overview; evidence legend; accessible ordered stage/moment list; selected moment summary; previous, Play/Pause and next controls; optional contributor filter when backed by approved attribution. On compact screens, keep the list usable without expanding the map.

**Elements and functionality:**

- Proposed conservative default: direct entry displays the list and Show map; only that action initializes Mapbox. This satisfies map-free reading even for a restored Explore URL. Architecture permits other explicit map actions; this document selects a single predictable trigger for review.
- Production offers Map and Satellite in the existing Mapbox instance, with attribution retained. Stage/style changes preserve selection and restore approved overlays after style readiness.
- Solid recorded geometry, dashed estimated connections, labelled endpoints for reported travel, and visible unknown gaps have textual explanations. Never animate a plausible-looking path across an unknown gap.
- Rest/no-GPS stages retain text, moments and next/previous. “No route recorded for this stage” is useful content, not an error.
- User-started playback advances approved stages/moments. Pause, previous, next and stage selection work without fine gestures. Reduced motion uses direct selection changes. Presentation timing is not actual speed or elapsed travel measurement.
- Stop or wait at media; do not autoplay competing audio. Keyboard users have list controls equivalent to map selection. Photograph attribution does not imply a contributor travelled through its location.
- Map/provider failure keeps the list and narrative usable; retry is scoped to the map. Route bounds and camera positions use redacted geometry only.

**States:** map not requested; loading; map ready; satellite switch pending/failed; no geometry; recorded/estimated/reported/unknown; participant branch; playback stopped/playing/paused/end; source removed; whole-publication denial.

**Prototype proof:** label the route diagram “Schematic sample route”; demonstrate playback, pause, a gap and a rest day without Mapbox calls. No production route correctness or satellite rendering is asserted.

### P04 — Learn and P04.search

**Job:** find what the group reported arranging, paying or learning, and inspect evidence.

**Composition:** shared reader navigation; selected-stage context; practical category filter; “Search this journey” field; dated practical-detail list; source actions; secondary “Ask about this journey” action. Avoid making the question composer the main landing content.

**Practical card fields:** category and subject; reported arrangement/lesson; observation or visit date; approved contributor identity; evidence type/uncertainty; one or more source links; correction date separately if supplied. Costs retain amount, currency, unit, group size and scope. Missing context is labelled unknown rather than calculated. Contacts and locations appear only in the approved redacted projection.

**Functions:** category and stage filtering; expand a detail; open source in P05; show a source's stage in Story/Explore when available; save the canonical reference with a contextual private note. Conflicting reports remain separately attributed. Learn does not silently merge them into an authoritative recommendation.

Search is account-free and limited to the same accessible approved journey. Proposed default scope is the whole journey, visibly labelled; optionally narrow to the selected stage. Results show content type, stage, approved snippet, date and direct destination: narrative → P02 anchor, practical detail → P04 detail, supporting media/transcript → P05. Preserve query and filters on return. Search and Ask are distinct actions; entering a keyword never triggers a paid model call.

**States:** no practical details yet; no matching category/stage; no search results; loading/error/retry; partial/index-pending search with an explicit coverage message; old observation with unknown current position; conflicting accounts; source removed with dependent claim suppressed. Private pending transcripts and draft details are never listed as unavailable teasers.

**Prototype proof:** find a fictional group taxi cost, identify the date/group-size/unit, open its evidence, return to the same category, and show that “What does it cost now?” cannot be answered by relabelling the old figure.

### P04.question — Journey questions and answer states

**Job:** answer a bounded question using accessible evidence from this one journey. This is a panel/subflow of Learn, not a new global chatbot destination.

**Elements:** journey scope/title only while accessible; short evidence limitation; labelled question input; explicit Ask button; disclosed usage/retention information; progress status; complete validated answer; per-claim citations; date/unit/attribution context; follow-up input; close/back action. Suggested sample questions must be relevant to available approved content and must not imply analysis of pending media.

| State | Visitor sees | Available transition |
| --- | --- | --- |
| Guest | Reading remains open; “Sign in to ask about this journey” | X-auth then return; cancel to Learn |
| Ready | Input and disclosed applicable limits | Submit a valid bounded question |
| Invalid input | Inline explanation, input retained | Correct and resubmit |
| Submitting | Stable labelled button with busy state; no partial factual answer | Wait or leave; no automatic duplicate submission |
| Answer ready | Buffered, validated answer and accessible citations | Inspect P05/detail; follow up |
| Evidence missing | “This journey does not contain that information” | Search/read relevant sources; rephrase |
| Historical-only evidence | Dated report; explicit inability to establish today's price/availability | Open original evidence; no fabricated current answer |
| Conflicting evidence | Attributed alternatives and their sources | Inspect each source |
| Index pending/partial | Coverage limit; no claim that all media was analysed | Read/search ready sources or retry when ready |
| Quota/rate limit | Actual disclosed limit/reset information supplied by service | Continue reading; retry when allowed; no invented upsell |
| Provider/network failure | No invented answer; retained input and Retry | Explicit retry or return to Learn |
| Session expired | Private answer UI cleared as appropriate; sign-in prompt | Reauthenticate and recheck access before resuming |
| Version changed during generation | Stale result withheld; neutral changed-content notice | Explicit retry against current accessible version |
| Citation/source withdrawn | Affected stored answer suppressed, including derived text | Ask again against remaining evidence |
| Journey inaccessible | P08, no old title/answer/citation preview | Discover or safe return |

Questions launched from P06 display “Questions use the full accessible journey, not only these highlights.” A citation to another approved contributor is allowed and visibly credited. Return from P05 preserves question/session position. Questions are private account activity, not public comments. Do not put question text, private notes or answer bodies in URLs, analytics, social metadata or shared browser caches.

Client-side state is not enforcement. Production retrieves only the authorized approved corpus, buffers generation, validates citation membership and rechecks version/policy before delivery. Stored sessions must be rechecked on reopen; earlier conversation cannot restore withdrawn facts. Sign-in does not widen the evidence set.

**Prototype proof:** fixed sample answers for an evidenced cost, unsupported current-price query, conflict, provider failure and withdrawal. Label responses simulated; no AI call or quota enforcement claim.

### P05 — Approved source detail

**Job:** see the actual support for a statement without losing reading context.

**Composition:** Close/Back to named origin; source type; approved media/text; caption; approved attribution; observation/capture date with timezone uncertainty where applicable; transcript/caption panel; evidence/placement context; View in Story; View in Explore only when meaningful; Report.

**Functions:** deliberate media playback; accessible transcript; highlight cited passage or seek to a supported timestamp without autoplay; inspect a reported/estimated location label; return to originating card/citation. Distinguish upload/edit timestamps from the actual observation. Do not expose raw EXIF, private originals, owner account IDs, private transcripts, exact redacted locations or direct storage URLs. Public permission is not original-download permission.

**States:** image/text/audio/video; supported timestamp; missing/invalid timestamp with safe start and explanation; approved transcript absent; media loading/failure; partial transcript selection; unavailable source. Public absence of a transcript does not expose a private processing queue. If the surrounding journey is accessible, an unavailable source can show neutral text and a safe return without its former caption or thumbnail.

**Prototype proof:** open from a Learn card and a question citation, then return to each exact origin. Demonstrate direct-link parent navigation and removed-source behavior.

### P06 — Personal highlight landing

**Job:** experience a member's chosen approved highlights and understand that the full journey remains available under its existing access rules.

**Composition:** permitted personal cover/title treatment; approved sharer identity; presentation caption; clear “Highlights from [accessible journey]” relationship; selected approved moments with source credit; prominent View full journey; Ask about full journey; Save journey reference; Report.

**Functions:** selection browsing and P05 source inspection; P02 full-journey handoff preserving a selected stage where relevant; question scope disclosure before P04.question; optional eligible profile link. The presentation caption does not replace group facts or enter the answer corpus. R-note saves the canonical journey, not a second completed event.

**States:** normal selection; no eligible personal contributions at creator handoff; all selected sources removed while full journey remains accessible; partial removal; unlisted authorized access; canonical publication unavailable. Do not substitute another member's photo silently. With no selected content, offer the ordinary eligible full-journey link or neutral unavailable state as appropriate.

Creation belongs to X-member: default to the member's approved attributed contributions; explicitly choose permitted group items; retain credit; choose cover/order/caption; preview full-journey access and external-copy limits; generate hosted link/static card through current grants. Prototype includes the receiving page and a focused creation/withdrawal handoff, not a second authoring system. Static image cards already copied externally cannot be recalled; managed links and assets remain subject to restrictions.

### P07 — Optional public profile

**Job:** inspect an intentionally public identity and its selected eligible journey references.

**Composition:** approved display name, optional avatar/bio; selected public journeys; safe empty state; Report and global navigation. No followers, likes, leaderboard, private participation count, hidden journey count, email or home-location inference.

**Functions:** open P02 from a journey; return to prior list position. Owner management links hand off to account settings. Public attribution can remain plain text when no profile link is eligible. Hiding a profile association does not unpublish the group journey.

**States:** selected eligible cards; no selected journeys; missing avatar/bio; removed card after visibility change; disabled/deleted/unavailable profile → P08. Counts, if shown, derive only from currently eligible visible cards. Unlisted journeys never appear, even to a signed-in visitor who separately possesses their link.

### R-list and R-note — Private saved research

**Job:** retain useful references and personal thoughts separately from participated journeys.

**Composition:** “Saved research” title and private-audience explanation; reference list with currently authorized preview; optional note excerpt; Open, Edit note, Remove; Discover action for empty state. The note editor has a labelled optional note field, Save, Cancel and explicit dirty/saving/saved/error states. A reference can be saved with no note.

**Functions:** save one account-to-canonical-journey reference; repeated Save opens/updates that reference rather than duplicating it. Preserve source view/stage/detail as a convenience when still accessible, not a frozen copy. New journey with reference enters X-new with fresh dates/group/identity. Do not prefill recorded costs, actual media or completed activities as new facts.

**States:** signed out → X-auth; loading; empty; saved; edited; save failed with draft retained; removal confirmation; session expired; referenced journey unavailable. Remove deletes the bookmark/note after explicit confirmation, never the original journey. On cancel/back from an edited note, ask Save/Discard/Keep editing.

When access is lost, suppress the fetched title/cover/snippet and show a generic unavailable reference. The account owner's independently authored private note is separate from the managed source preview; its retention/deletion policy must be resolved in section 8 before production. Never automatically snapshot source text into a private note as a revocation workaround. Sign-out clears private Query/session UI state. Prototype notes remain explicitly session-only; do not claim durable account persistence.

### P08 — Generic unavailable

**Job:** provide a safe exit when a resource cannot be served.

Show “This content is unavailable,” Discover and support/report access, with safe Back when there is a known accessible origin. Unknown, private, withdrawn and deleted resources must not reveal which condition applies through page copy, metadata or previews. Sign-in is not presented as a guaranteed solution to revoked publication access. A separately classified network failure can offer Retry, without showing protected cached data.

Generic content applies to server HTML, page title, social metadata, API errors and managed media responses, not only the visible body. Do not leave a stale cover behind a modal. A restricted source can use this presentation inside the reader while unaffected content remains available under the server's decision.

### X-auth, X-report and X-info — Supporting boundaries

**Sign-in return:** use the existing account flow, preserving a validated local return intent and safe reader context. Save/Ask remains an explicit action after return; authentication alone must not auto-send a question or report. Cancel returns to public reading. Inputs may be retained in short-lived memory where feasible; do not promise survival across redirects/reloads or store private draft text in a return URL.

**Reporting:** identify a listing/journey/source/share/profile by an opaque permitted target. Offer reason, description, optional reply contact and Submit/Cancel. Proposed reasons: privacy/rights, harmful or inappropriate material, misleading information, broken content, other. Required-field and limit errors stay inline; submission errors retain input; success provides a receipt if supported and a return action. Reports are not public comments. Abuse limits are server responsibilities. The shared specification defines the restricted operator queue → evidence review → listing-only decision or separately authorized takedown → persistent audit/result; a public report grants no access or moderation power. Contact, response expectations and retention need actual business choices before launch. Do not invent a support address or promise a takedown deadline.

**About/privacy/terms/support:** linked from the shell and unavailable state. Explain remembered journeys, historical observations, forwardable links, personal data use and external-copy limits in approved copy. These content pages are dependencies of the public workflow, not additional reader modes or a marketing-site rebuild.

## 5. Shared component contracts

| Component | Used by | Responsibility and important states |
| --- | --- | --- |
| Public shell | All public screens | Navigation composition to be designed, skip link, appearance, account/guest actions, footer; no private history leakage |
| Eligible journey entry | P01, P07, R-list | Canonical identity, current approved preview, dates, no-cover state; private note is a separate owner-only slot |
| Reader header/mode links | P02–P05 | Same journey/version context and accessible selected view |
| Chapter selector | P02–P04 | One/all-days, rest/transfer stages, previous/next, keyboard and overflow handling |
| Evidence label | P02–P06 | Recorded/reported/estimated/unknown via text and pattern, not color alone |
| Approved media | P02, P05, P06 | Authorized derivative, alt/caption, user-started play, loading/failure; no original export affordance |
| Source link/citation | Story, Learn, questions | Accessible target, optional valid timestamp, origin restoration, unavailable response |
| Practical-detail block | P04 and cited focus | Date, currency/unit/group scope, attribution, source dependencies |
| Map adapter and timeline controls | P03 | Explicit initialization, list equivalence, evidence legend, style/error states and pause |
| Search form/results | P01 and P04 | Shared form primitives; separate catalog/journey scopes and result contracts |
| Save-reference editor | R-note | Private optional note, dirty/error states, idempotent canonical reference |
| Question composer/answer | P04.question | Bounded request, busy state, buffered answer, citations, limits, invalidation |
| Report form | X-report | Target-safe context, validation, receipt and failure recovery |
| Unavailable presentation | P08 and local failures | Neutral content and safe navigation without stale data |

Define components and token values through the [fresh design hub](../../DESIGN.md); assess existing code for reuse after the new choices. Share public reader components with publisher preview; do not share private workspace payloads. Keep source inspection and note editing distinct: the former is evidence reading, the latter mutates private account data.

Accessibility intent: semantic links for navigation, buttons for actions, visible focus, labelled fields, errors associated with inputs and polite result/status announcements. Modal variants manage focus and return it to the invoking control; full-page variants have a useful heading and parent link. Reflow prose and controls at 320 CSS px; map interactions have an equivalent text path. Respect reduced motion, captions/transcripts and contrast in both appearances. Verify these in implementation; writing them here is not an accessibility pass.

## 6. Architecture and data ownership

The reader is a consumer of approved data. It must never assemble a public story by fetching private sources and hiding fields in React.

| Boundary | Owner and input | Output/guarantee needed by screens |
| --- | --- | --- |
| Publication projection | Server policy + approved snapshot + current restrictions | Versioned safe journey, chapters, redacted geometry, approved sources/credit and permitted derivatives |
| Public renderer | Existing bounded Node/React renderer | Useful HTML and safe metadata; hydration from the same projection; no cross-request account state |
| Selection and navigation | Web router + shared pure selection logic | Valid chapter/moment/view/filter; access decisions remain server-side |
| Fetched state | TanStack Query and generated contracts | Account/version-scoped state; clear/invalidate when identity or policy changes |
| Media gateway | Backend + private object storage | Current checks on GET/HEAD/Range, no raw-public bucket escape |
| Discover/profile | Domain eligibility and approved metadata | Deduplicated public entries, listing and profile restrictions applied |
| Saved research | Account-owned reference/note domain | Private bookmark separate from journey membership/history; preview reauthorized |
| Questions | Server retrieval + AI SDK/Gateway | Same-journey authorized corpus, buffered and validated answer, quota and version checks |
| Replay/map | Pure sequence selection + owned Mapbox lifecycle | Evidence-preserving display; geography provider is not proof of actual travel |
| Restrictions | Domain denies + dependency tracking + recovery journal | Affected sources/claims/answers suppressed across old links and managed projections |

Current restrictions override approved historical versions. Publication replacement is atomic; ordinary edits do not change the public record. If indexing for a new approved version is pending, do not silently answer from an old version. Partial ready-source answering needs an explicit coverage message.

Public and publisher-preview rendering consume the same safe contract. A preview may carry an authorized candidate under separate access, but never accidentally exposes a draft through a public route. Avoid persistent offline caches of rights-sensitive public data in this scope. Static app assets can cache independently; safe content still needs current access checks when served.

Prototype adapters stay isolated and explicitly simulated. Use the existing fictional fixture family and named prepared continuations; do not create real accounts, publish public URLs, call a model, install a map SDK, or write production database rows to demonstrate this document.

## 7. Prototype coverage and acceptance scenarios

Choose fictional scenarios for the new prototype that cover departure, rest/transfer and return; evidence uncertainty; contributor credits; dated practical details; a transcript citation; and a withdrawn source affecting a highlight and answer. The old fixture size/content is not mandatory. Use a small additional catalog fixture only where filtering genuinely needs another distinct event. Every fixture is labelled fictional and versioned.

Core connectivity is working prototype scope. Supporting profile, research, reporting and question states receive focused transitions first, under a newly planned prototype sequence. This screen specification describes complete intended behavior; it does not expand every supporting flow into a full production build before the central walkthrough is reviewed.

| ID | Scenario | Expected result | Coverage boundary |
| --- | --- | --- | --- |
| PW-01 | Guest filters Discover, opens journey and goes Back | Same filters/scroll; one listing per canonical event | Prototype navigation; later real eligibility integration |
| PW-02 | Guest reads no-cover/no-GPS journey | Useful chronology without map or sign-in | Prototype reading; production HTML/map-request check later |
| PW-03 | Day 2 → Explore → Learn → source → Back | Same chapter and category; source returns to exact origin | Prototype selection/history |
| PW-04 | All days and rest stage; replay across unknown gap | Rest remains visible; no invented path; pause/keyboard alternative works | Prototype schematic semantics |
| PW-05 | Guest searches approved text and opens a result outside selected stage | Scope explicit; selected stage changes intentionally; source accessible | Prototype search; production corpus filtering later |
| PW-06 | Inspect dated group cost; ask current-price question | Date/currency/unit/group size retained; current-price abstention | Prepared answers; later real grounding evaluation |
| PW-07 | Save as guest, sign in, cancel/edit/save note, revisit research | Returns to context; note private; no completed-journey duplication | Simulated auth/save; real boundary later |
| PW-08 | Highlight recipient asks and opens another contributor's citation | Full-journey scope disclosed and credit retained | Focused prototype transition |
| PW-09 | Public profile loses a journey's eligibility | Card/count disappears; unlisted link not exposed | Simulated restriction; production read checks later |
| PW-10 | Withdraw source referenced by card, share, search and stored answer | Dependent text and previews suppressed, including old links | Prototype scenario; real revocation integration mandatory later |
| PW-11 | Remove listing without unpublishing; then unpublish | First disappears from catalog but direct reader works; second returns P08 | Separate policy fixtures |
| PW-12 | Map outage, AI timeout, quota and indexing delay | Reading/source access remain useful; retry scoped appropriately | Prepared failure states |
| PW-13 | Direct source link, malformed stage, expired session and unavailable journey | Safe parent/fallback; private data cleared; no protected metadata | Prototype routing; real SSR/session checks later |
| PW-14 | Keyboard, zoom/reflow, reduced motion, both appearances | No essential map-only action or focus loss; readable content | Actual browser/a11y inspection during implementation |
| PW-15 | Save reference → create future journey | Fresh identity/dates/group; reference only, no copied history | Creator boundary handoff |
| PW-16 | Report from available and unavailable content; submission fails | Safe target, input retained, retry; no false takedown promise | Focused form transition |

Prioritize a few real boundary integration checks for production eligibility, source/media access, answer invalidation and SSR metadata. Avoid adding mocked tests for every presentation value. Record executed prototype/browser and production evidence separately, tied to actual source and fixture versions.

## 8. Decisions and revision rules

These defaults make the plan concrete. They are proposals where the governing documents leave implementation discretion; none changes publication rights or R1 scope implicitly.

| Decision | Proposed default now | What remains to decide |
| --- | --- | --- |
| Entry emphasis | Discover for browsing; direct Story for journey links | Editorial landing copy and any later marketing homepage |
| Reader opening | Honor valid linked selection; otherwise start at first meaningful stage; All days always available | Whether first visits should default to All days after prototype review |
| Map initiation | Show map button, including direct Explore links | Confirm interaction in walkthrough; retain explicit loading requirement |
| Discover ordering | Simple deterministic order labelled by visit recency, with unknown dates handled explicitly | Tie-break rules, ongoing-date handling and operational catalog priorities |
| Search scope | Whole journey, visibly labelled; optional stage narrowing | Query/field bounds and matching behavior at real data boundary |
| Source presentation | Wide inspector; compact full page; standalone direct-link fallback | Confirm focus/back behavior with actual routing |
| Save semantics | Canonical reference plus optional private note; contextual anchor if valid | Note limits and retention when referenced material is removed |
| Question sessions | Account-private, buffered and sourced | Numerical limits, retention disclosure, supported languages and production provider qualification |
| Reporting | Guest-accessible form with optional reply contact and support fallback | Operational owner, address, response policy and retention; shared specification owns the review workflow |
| Public identity | Optional profile; approved credit remains useful without a profile | Handle/URL format and profile copy/field validation |
| Routes | Illustrative route families in section 3.3 | Final canonical identifiers, unlisted credential transport and migration from prototype paths |
| Statistics/analytics | Count canonical journeys; minimal safe events | Consent/retention and instrumentation selection; no private question/note text |

No business-decision approval is claimed by this draft. If a decision would add current advice, social features, cross-journey answers, new visibility rules or paid dependencies, update product requirements and architecture before implementing it. Ordinary layout and copy refinements can be recorded here without redefining the domain model.

## 9. Relevant skills for implementation

Use the following existing skills for the relevant implementation slice; no new skill installation is required.

| Work | Relevant existing skills | Limit |
| --- | --- | --- |
| Public screen composition | Impeccable, frontend-design, emil-design-eng, shadcn | Follow the fresh design process; assess dependencies only when needed |
| Screen routing and return context | router-core, navigation, search-params, not-found-and-errors | Use existing TanStack setup and validate selections |
| Server/fetched state | data-loading, router-query, ssr, kairn-architecture | Bounded public renderer; no new full-stack framework |
| Rights and lifecycle | kairn-publication-access | Current server access across every projection and source |
| Sign-in handoff | auth-and-guards, better-auth-best-practices | Account session is separate from publication authority |
| Explore production map | mapbox-web-integration-patterns, mapbox-web-performance-patterns | Explicit loading, redacted geometry, useful map failure fallback |
| Grounded answers | ai-sdk, kairn-publication-access | Server-only buffered responses, no generic agent/chat scope |
| Accessibility and verification | web-design-guidelines, playwright-best-practices; vitest adapted to Vite+ | Critical boundaries and task evidence, not exhaustive mocked UI tests |

Planning applied Impeccable and Kairn publication-access guidance with root PRODUCT.md and DESIGN.md. Other skills above are selected for future implementation, not claimed executed.

## 10. Planning verification and handoff

Coverage selected for this documentation-only change: canonical screen IDs, complete incoming/outgoing navigation, ownership of supporting flows, relative document links, requirement traceability and whitespace/diff checks. No application tests or device builds are warranted for a new Markdown specification. No production, browser, accessibility or founder-approval gate is closed by this document.

| Requirement family | Covered sections |
| --- | --- |
| VWR-01–08 | P02/P03/P05/P08, shared navigation/accessibility, PW-02–04/PW-13–14 |
| PUB-06–08 | Eligibility, projection/restrictions, P08, PW-09–11 |
| SHR-01–08 | P06 plus explicit creator ownership of creation/card generation |
| DIS-01–07 | P01, R-list/R-note, X-new/X-report, PW-01/PW-07/PW-11/PW-15–16 |
| PRO-05–06 | P07 and current eligible preview/count behavior |
| ASK-01–09 | P04.search/question/P05, architecture boundaries, PW-05–06/PW-08/PW-10/PW-12 |
| LRN and cross-cutting privacy/accessibility | Practical detail fields, evidence labels, safe projection and shared components |

Next implementation handoff: use this inventory to refine the existing sample reader, add connected source and Learn transitions, then demonstrate highlight, research, profile and question edge states at the bounded depths above. Keep one fixture identity across screens. Record any business changes here and in the governing document before they become behavior. Production adapters follow the existing dependency-aware delivery plan.

Initial planning checks covered all eight canonical screens, 16 acceptance scenarios, links and navigation. The combined review corrected route ownership, public search/new-journey edges and shared handoffs; current executed results are in [workflow review](workflow_review.md). No runtime tests were run for this documentation change.
