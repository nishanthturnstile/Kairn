# Creator web: workflow, screen connectivity and interaction specification

> **Visual reset, 5 November 2026:** [DESIGN.md](../../DESIGN.md) is the active planning hub. Keep the tasks, information, permissions, connectivity and recovery requirements below. Visual identity, layout, navigation composition and component appearance are undecided; remaining container/label examples are revisitable interaction proposals, not approved page designs.

Date: 5 November 2026. Version: 1.0. Scope: W01–W08, the creator journey workspace. Status: detailed design proposal grounded in the current R1 baseline; ready for screen-by-screen review. This document does not claim implemented screens, approved new business policy, or production acceptance.

The [shared lifecycle and cross-surface specification](lifecycle_workflow_spec.md) completes W09 account/history, owner contributions, exports, personal presentation, operator handoffs and named lifecycle outcomes. Read it alongside this workspace specification.

## 1. Purpose and reading guide

Design a connected creator experience in which a group turns permitted sources into one coherent departure-to-return journey, reviews its evidence and privacy, and intentionally publishes a version that visitors can experience and learn from.

Every screen specification below names its audience, entry points, exits, internal elements, actions, state changes, failure behavior and acceptance tasks. A screen includes its contextual panels and dialogs; these do not automatically become separate navigation destinations.

Jump to a screen: [Overview](#w01), [Sources](#w05), [Story editor](#w02), [Route/stages](#w03), [Practical details](#w04), [People and permissions](#w06), [Revision/conflict](#w07), [Publication review](#w08).

Use this document in this order:

1. Agree the product and permission rules in sections 2–3.
2. Walk the screen inventory and connection contracts in sections 4–6.
3. Review each screen in sections 7–14, including its non-happy paths.
4. Use sections 15–18 to plan reusable components, responsive behavior and architecture boundaries.
5. Use DESIGN.md to make fresh choices; sections 19–20 retain revisitable interaction proposals and functional dependencies.

The first design exercise is a complete workflow, not eight disconnected mockups. The prototype uses one fictional journey, five fictional members and explicit scenario controls. Production services follow their existing implementation sequence.

### 1.1 Authority and interpretation

| Source | What it governs here |
| --- | --- |
| [Product plan](../core/product_plan.md), especially §§1, 3, 5–9 | Purpose, audience, whole-trip promise, exclusions and community-first direction. |
| [Product requirements](../core/product_requirements.md), especially §§2, 6–11, 16–20 | Functional scope, source rights, editing, release requirements and acceptance. |
| [Architecture](../core/architecture.md), especially §§5–6, 8–11, 13–17 | Module ownership, contracts, durable edits, current authorization and publication/recovery boundaries. Section 14 remains the sole dependency register. |
| [Application experience requirements](../core/application_design.md) | Canonical screen responsibilities and functional handoff; appearance is reopened in DESIGN.md. |
| [Selected account/journey decisions](accounts_journeys_access_decisions.md), D03–D06, D08, D10 | One administrator, restricted roster, independent powers, freshness, expiry and lifecycle behavior. |
| [Account/journey handoff](accounts_journeys_access_design.md) | Existing entry, history, People, reauthentication, lifecycle and operation-status destinations. |
| [Fresh design hub](../../DESIGN.md) | All visual and composition decisions are reopened; current components are implementation history. |
| [Prototype boundary](../../DESIGN.md#5-prototype-boundary) | Explicit sample state; new scenario/delivery planning after relevant design choices. |
| [Ecosystem direction](../core/ecosystem_direction.md) | Studio/GeoKit/Moments/Privacy/Publisher/Player responsibilities, without adding services or packages. |

**Interpretation labels:** “Baseline” means an existing requirement or selected decision. “Proposed” means a screen-level design choice in this specification. “Open” means the decision is intentionally unresolved. Proposed paths and component names are planning contracts, not claims that routes or APIs already exist. A business change is allowed, but its effect on requirements, policy, schemas, screens and acceptance must be recorded before implementation.

### 1.2 Research method and limits

Reviewed the governing documents above, the current setup/account/experience progress records, and the current creator specimen in [workspace.tsx](../../apps/web/src/prototype/workspace.tsx). Inspected current component ownership and reader-navigation contracts. Supplemented that analysis with first-party accessibility and form guidance in section 21.

This is document and source analysis. No new usability study, competitor hands-on test, production permission audit, browser session, device test or implementation qualification was performed for this specification. Existing sample behavior is evidence of its own narrow interactions only.

## 2. Product, brand and experience thesis

### 2.1 What the creator is making

The object is **one shared journey that happened**, including separate departures, common stages, rest days, stays, transfers and return. It is not a future itinerary, booking plan, fitness activity feed or page-builder project.

- A member's history and personal highlights reference the same canonical event.
- GPS is optional; photographs and notes can make a useful complete story.
- Original observations, editorial interpretations and approved publication remain distinct.
- Contributors retain ownership and decide source scope. A publisher approves release, not ownership transfer.
- Practical knowledge describes a dated experience. An edited old fare does not become a current-price claim.
- The complete R1 includes collaboration, privacy, discovery, questions and lifecycle controls. A beautiful editor does not replace those obligations.

### 2.2 Who is doing the work

The primary creator is organizing a recent multi-day trip with friends, often with mixed-quality sources and limited time. A coauthor may contribute only one part of the journey. A publisher needs a reliable review rather than another editing task. A source owner may only want to contribute or withdraw a few items.

Success is reaching an understandable, deliberately approved story without re-entering the trip, designing pages, losing edits, or confusing private backup with sharing. The workspace must make the next useful action clear without demanding that everyone follow a rigid wizard.

### 2.3 Visual direction is undecided

Select brand, typography, colors, icons, spacing, components and page composition through DESIGN.md. The creator's functional needs are chronology, attributable evidence, understandable permissions, retained work and deliberate publication. These needs do not select a palette, sidebar, chapter spine or editorial type treatment. Authors edit journey content; R1 does not add an end-user page/theme builder.

### 2.4 Terminology to keep consistent

| Term/action | Meaning |
| --- | --- |
| Sources | Creator-web collection and review tool, W05. Native “Moments” can retain its platform label; the temporary web specimen label does not rename W05. |
| Story | Shared draft composition in W02; distinguish its Draft label from the approved public Story. |
| Route | W03 stage, branch and evidence correction; not navigation directions. |
| Learn | W04 practical-detail editing. Heading “Practical details” clarifies its creator task. |
| Publish | W08 review destination. Coauthors may inspect it without authority to activate publication. |
| Exclude from story | Remove an editorial reference; preserve the original and its independent grant. |
| Withdraw from journey | Source owner narrows/removes journey use; affected managed outputs become inaccessible. |
| Allow journey publication and sharing | Source becomes eligible; this action does not itself publish it. |
| Original-file export | Separate owner-issued permission for exact files and recipient; never bundled with publication reuse. |
| Saved draft / Published version | Different facts with different timestamps and approval state. |

## 3. Permission and lifecycle model

### 3.1 Capability gates

Capabilities compose; they are not mutually exclusive roles. Apply current source grants and lifecycle state after checking the capability. Every protected route and operation requires server enforcement in production.

| Actor | W01 Overview | W05 Sources | W02/W03/W04 | W06 People | W07 Revisions | W08 Publish |
| --- | --- | --- | --- | --- | --- | --- |
| Active participant without editorial powers | Permitted event metadata, own powers/contributions and safe next actions; no draft counts or review activity | Own items only; cannot browse others' review pool | No shared draft | Own membership and administrator identity only | No shared editorial history | No draft preview or publishing |
| Source owner | Own-source access and controls supplement the actor's membership view | Set/narrow/withdraw own grants; inspect own originals and exact export grants | Ownership alone does not grant draft editing | Ownership does not grant roster management | Ownership alone does not grant shared revision access | Ownership alone does not grant preview or approval |
| Active coauthor | Draft work queue and permitted changes | Own items plus permitted contributed review fields | Read and edit common draft | Minimal member view; review-audience identities exposed only in the relevant scope context | Inspect permitted history; resolve/restore with current grants | Inspect review and safe preview; cannot publish without publisher capability |
| Active designated publisher | Permitted draft/review work | Own items plus permitted contributed review fields | Inspect shared draft; no editing without coauthor capability | Minimal member view unless also administrator | Inspect currently permitted revision context; resolution/restore requires coauthor | Approve, republish, change visibility and unpublish with current checks |
| Sole administrator | Administrative metadata/actions; title/dates editable while collaboration is open | Own items only unless also coauthor/publisher | No draft access from administration alone | Manage invitations/powers; offer transfer; limited administrative roster | No editorial access from administration alone | No publication authority from administration alone |
| Former member who owns sources | Normal journey URL unavailable | Separate W09 “Your contributions” owner access; not a workspace bypass | No | No protected member access | No | No |
| Public/unlisted viewer | Public reader boundary only | Public approved source detail only, never W05 | No | No | No | No |

Full member counts, names, chapters, media, conflict counts and activity can themselves reveal protected facts. Use authorized projections for counts and summaries; hiding buttons over a fully downloaded private payload is not sufficient.

### 3.2 Lifecycle overlays

- **Active:** capability-appropriate collaboration is open.
- **Archived:** existing authorized draft/review reads and exports remain. New contributions, shared edits, event-detail corrections, invitations, scope/capability expansion and new publication/republish/widening stop. Owner restrictions and authorized visibility narrowing remain. Accepted transfer to an existing eligible coauthor can maintain continuity. Pending invitations and expansion offers are invalidated. Exact-original approval on already contributed sources remains allowed under current authority. No unarchive action is selected in the current baseline; shared lifecycle §4.1 defines the separate freeze matrix.
- **No administrator/frozen:** do not invent a “Claim ownership” button. Freeze expansion, new publication and widening under the selected policy. Show only operations permitted by the authoritative state; source restrictions remain possible. Recovery uses the separate audited operator process.
- **Removed/revoked/deleted:** stop protected requests and scrub protected page data and cached summaries. Use a generic unavailable destination; retain only separately authorized own-source recovery/export material.
- **Restriction pending:** local denial is already effective; independent recovery confirmation is pending. Do not say the material remains available until confirmation or offer an Undo that restores access.

Broad lifecycle changes use their named impact/confirmation flow. Owner withdrawal, narrowing and export revocation must not be delayed by an unnecessary fresh-auth prompt; broad byte deletion and other sensitive actions follow the selected freshness rules.

## 4. Screen and route inventory

Preserve canonical W IDs. W09 already owns private account/history; its child contracts are defined in the shared specification. Workspace modals retain their owning W01–W08 IDs. Route suffixes below are proposed where not already selected by the account/journey handoff. `J` is an opaque journey ID; `S`, `C`, `T`, `K`, `R` and `Q` denote source, chapter, stage/leg, practical detail, revision and conflict IDs. Validate ownership and membership of each referenced entity, not merely its syntax.

| ID | Navigation label / heading | Proposed address | Task and principal internal states |
| --- | --- | --- | --- |
| W01 | Overview / journey title | `/journeys/{J}` | Status, timeline, authorized work queue; event-details panel and lifecycle entry. |
| W02 | Story / Story editor | `/journeys/{J}/story` | Chapter canvas, moment insertion, editorial fields, suggestions, inspector and save state. |
| W03 | Route / Stages and route | `/journeys/{J}/route` | Ordered stages, branches, gap correction, recording associations, map/list view and evidence inspector. |
| W04 | Learn / Practical details | `/journeys/{J}/learn` | Category list, detail form, sourced suggestions, corrections and source inspection. |
| W05 | Sources / Sources | `/journeys/{J}/sources` | Own/permitted pool, selected-import review, transfer queue, source detail, scope, original-export and withdrawal panels. |
| W06 | People / People and permissions | `/journeys/{J}/people` | Scoped roster, invitations, independent powers, transfer and removal/departure entry. |
| W07 | Contextual / Revisions and conflicts | `/journeys/{J}/revisions` | Entity history, selected revision, conflict comparison, resolution and safe restore preview. Not a permanent primary rail item. |
| W08 | Publish / Review and publish | `/journeys/{J}/publish` | Five review areas, exact safe preview, generation-change state, publishing, approved result and restriction controls. |

Selected IDs and bounded filters may be validated URL state; edited text, private snippets, recipient email, credentials and capability assertions may not. Exact query names remain a router-contract task. A selected entity that becomes inaccessible is removed from route/resume state without leaking its label.

### 4.1 Boundary destinations outside these eight screens

| Boundary | Existing identity | Contract needed by creator web |
| --- | --- | --- |
| Private history | W09 / E05 `/journeys` | Opens a permitted W01 or an explicit contextual destination; receives Back to journeys. W09.history has its complete screen contract in the shared specification. |
| Create/join | E06/E07 | Successful committed create or explicit acceptance opens W01 for that canonical ID. Sign-in is not acceptance. |
| Sign-in / reauthenticate | E01/E04 | Resume a validated same-app intent after current authorization; never auto-execute a publish/delete/capability action. |
| Notices | E16 | Open the exact permitted source/entity/conflict/review item. Inaccessible target becomes a generic unavailable notice. |
| Lifecycle impact/status | E12/E14 `/operations/{operationId}` | Action-bound impact review, fresh-auth where required, confirmation and durable status. Safe Back remains available. |
| Account / Your contributions | W09.account / W09.contributions | Account/security route; former owners manage separately authorized own-source restrictions without exposing the former workspace. |
| Public reader | P02/P03/P04/P05 | Actual approved Story/Explore/Learn/source. W08 candidate preview is an internal mode, not a public URL. |
| Personal highlights | W09.highlights / W09.highlight-preview → P06 | Approved selection only. Creator entry appears only when eligible approved content and membership exist. No visibility widening. |
| Unavailable | E15/P08 as applicable | No protected title, cover, dates, place, roster or historic thumbnails. Safe exit to history/sign-in when useful. |

## 5. Connectivity contract

### 5.1 Universal navigation

Within the workspace, the persistent journey navigation links to W01, W02, W03, W04, W05, W06 and W08 **only when the actor may open that destination**. W07 retains that shell when accessible, so it can exit to any permitted destination. W07 is entered through History, a conflict notice or an explicit revision link, not a generic extra tab.

Every W screen also has Back to journeys → W09/E05 and a safe Account boundary. Crossing to global navigation does not discard unsent edits silently. There is no forced “Next screen” wizard between tools.

Direct links, refresh and browser Back/Forward are supported entry methods for all eight IDs, subject to access checks. A copied internal URL grants no authority. A fresh deep link with no valid return context falls back to that screen's owning list, then W01 if authorized, otherwise W09/E05.

### 5.2 Explicit contextual connection register

Universal rail links above apply in addition to these action-specific edges. Every edge states both the target and how the user returns; the per-screen sections reference this register rather than silently inventing new destinations.

| Edge | From and trigger | To and required context | Return/completion behavior |
| --- | --- | --- | --- |
| N01 | W09 history; E06 create; E07 accepted invite | W01, canonical J and current powers | Back to history; never duplicate the event. |
| N02 | E16 notice, saved internal link or refresh | Any authorized W screen, exact permitted entity/action | Explicit destination fallback if origin is absent; no arbitrary external `returnTo`. |
| N03 | W01 “Add sources” or import/transfer task | W05 collection, import batch or failed item | Return to W01 queue, recomputed from current state. |
| N04 | W01 “Continue story” or chapter task | W02, selected C/block | Return to W01 timeline selection. |
| N05 | W01 route/gap task | W03, selected T/leg/recording | Return to W01 relevant task. |
| N06 | W01 practical-detail task | W04, selected K or category | Return to W01 task. |
| N07 | W01 member/invitation task | W06, permitted invitation/member | Return to W01; use restricted summary for non-admins. |
| N08 | W01 conflict task or shell conflict indicator | W07, Q/entity | Completion returns to owning W02/W03/W04 editor or W01 if it was only a queue visit. |
| N09 | W01 publication task | W08, current review state | Back to W01; publication result stays in W08 until user chooses next action. |
| N10 | W02/W03/W04/W07 source citation, evidence or permission link | W05 source detail S, originating entity/selection | “Back to Story/Route/Practical details/Revisions” restores source-linked item, filters, scroll and unsent draft where still permitted. |
| N11 | W05 “Place in story” | W02 insertion chooser, S and optional C | Insertion returns to selected block; “Back to source” available. Current grants checked again. |
| N12 | W05 recording/placement correction | W03, recording or source association | Return to W05 selected source; changing association does not mutate original metadata. |
| N13 | W05 “Create practical detail” | W04 new detail with permitted source reference | Save opens detail; cancel returns to W05. Prepared extraction remains a suggestion. |
| N14 | W02 “Edit stage/route” or W03 “Edit chapter” | W03 T or W02 C through explicit relationship | Return to originating item; chapter and stage IDs are not interchangeable. |
| N15 | W02 detail reference or W04 “View in story” | W04 K or W02 C/block | Return preserves the focused detail. No chapter association means show a chooser, not a guessed destination. |
| N16 | W03 practical-detail action or W04 “View stage” | W04 K/new linked detail or W03 T/leg | Return to original stage/detail and selection. |
| N17 | W02/W03/W04 stale save or History | W07 Q/entity/R with expected revision | Compare, resolve/restore, return to same entity with refreshed revision; preserve candidate. |
| N18 | W08 blocker or review item | W05 rights/source; W02 narrative; W03 geography; W04 practical detail; W07 relevant conflict | Explicit “Return to publication review”; re-evaluate generations and refresh preview, not a remembered checked box. |
| N19 | W02/W03/W04 review action | W08 and focused review item or safe preview | Back to originating editor selection; pending local edits must be resolved before exact preview. |
| N20 | W06 capability audience context or W05 “Who can review?” | Scoped audience panel; W06 only for authorized management | Return to original panel. No full-roster access is implied. |
| N21 | W01/W06 lifecycle action; W05 withdrawal/export revoke; W08 unpublish/revoke | E12 impact where applicable, E04 when required, E14 status | Cancel before submission restores origin; after submission show current status. Never pretend browser Back undoes an action. |
| N22 | W08 exact preview | W08 preview subview Story/Explore/Learn/link/question sources | Close returns to originating review section; private preview cannot be copied as a public share. |
| N23 | W08 “Open published journey”; W01 approved result | P02, optionally P03/P04 approved context | Public reader remains independently usable; editor tab/context retained when opened separately. |
| N24 | W08/W01 “Share highlights” | W09.highlights → W09.highlight-preview → P06, canonical J/version | Return to approved result. Empty eligible selection offers permitted group material or full-journey link. |
| N25 | Any W screen: session expires | E01 sign-in; E04 for action freshness | Reauthorize before restoring protected content or offering the pending action again. |
| N26 | Any W screen: protected access lost | E15 unavailable; W09/E05 safe exit | Never return to cached protected content. Owner-only Your contributions remains a separate checked path. |
| N27 | W01/W05 permitted export or W09 account | W09.export, exact-original grant detail, export job/status/download | Retain job identity and return to invoker; recheck current download rights. Profile JSON and a source archive are different exports. |

The selected ten-minute freshness matrix applies to capability changes, accepted transfer, departure/removal/archive/deletion, original-export approval and account security controls. Recheck the five-minute revision-bound impact after E04. Valid-session owner withdrawal/narrowing and export revocation require no extra freshness prompt. Shared lifecycle §3 defines waiting, uncertain, server-denied, journal-confirmed and cleanup states; N21 must not collapse them.

### 5.3 History, cancellation and return context

- Push history for meaningful screen/entity visits such as opening W05 from a citation. Replace history for ordinary filtering, tab/panel selection and search refinement; do not create dozens of Back steps while typing.
- Keep only validated context: journey, permitted selected IDs, filter/page state and a known return destination. Resume protected context only after authorization. Never store source bodies, bearer links or recipient emails in URL/history keys.
- Preserve browser Back to the prior list position and filters. If an item was removed or access narrowed, focus the safe list heading/next available item and explain the change without repeating protected text.
- A dialog's Cancel/Escape closes it and returns focus to its trigger; if the trigger is gone, use a logical safe fallback. A multi-step import Cancel explains what has and has not been submitted.
- Navigation during unsent work offers Stay, leave with recoverable local work where supported, or explicit discard. A browser's unload prompt is a last defense, not the draft protocol.
- Sign-out/account switching follows shared lifecycle §3.3: warn about unsaved work, stop transports, cancel queries/drop late responses and isolate account state; browser recovery requires actual persisted work.
- Switching a journey changes the context key. It cannot attach one journey's source selection, chapter or pending command to another event.
- Access loss takes precedence over restoring scroll, form contents and thumbnails. Local unsent user-authored work requires a safe recovery policy; it must not preserve access to revoked shared source content.

## 6. End-to-end workflow scripts

### F01 — Start from permitted sources and reach a draft

W09/create/join → W01 → W05 import review → confirm selected files, dates and scope → W05 processing/ready → W02 prepared suggestions → Accept/Edit/Dismiss → W03 correct branches/gaps → W04 confirm dated practical details → W02 inspect assembled story. Every source jump returns to the originating item.

### F02 — Contribute without coauthor rights

W01 restricted overview → W05 own items → inspect named review audience → choose Journey review or publication reuse → see contribution state → W01. W02/W03/W04/W07/W08 remain inaccessible. Publishing is neither automatic nor offered as the completion action.

### F03 — Resolve an edit conflict

W02/W03/W04 edit at revision R → another edit advances R → attempted save retains candidate and reports conflict → W07 compare current/base/candidate as permitted → Keep current / Use candidate / Combine manually → current revision rechecked → owning editor. A second race leaves a new conflict, not an overwrite.

### F04 — Review and publish intentionally

W01 or editor → W08 source rights → W05 owner grants or coauthor excludes in W02 → Return to W08 and regenerate review → privacy/evidence checks → exact safe preview → choose unlisted/public intent and separate listing opt-in → publisher activates → W08 approved result → public reader or highlights. A publisher-only actor can inspect but cannot perform editorial fixes on behalf of a coauthor.

### F05 — Withdraw after publication

W05 own source → current impact preview → explicit withdraw → waiting to send if offline / checking result if uncertain → server-confirmed denied state plus pending/confirmed recovery status → E14 when needed → W01/W08 repair notice → authorized coauthor repairs affected draft → publisher reviews updated output. Existing hosted source-dependent shares and answers become inaccessible under current policy; screenshots and exported copies cannot be recalled.

### F06 — Hand over responsibility

W06 administrator → select existing active coauthor → offer administration transfer → pending offer → recipient's permitted notice/People flow → explicit acceptance → refresh current powers → former administrator may leave through separate impact review. No automatic change to coauthor/publisher powers. No successor means the documented frozen state, not a made-up replacement owner.

<a id="w01"></a>

## 7. W01 — Journey overview

### Job, audience and entry

Answer “What is this journey, what can I do, and what needs attention next?” Active members receive a capability-scoped overview. Entry: N01, N02, universal journey navigation, or return from any tool/action. It is not a marketing dashboard or a full roster for every member.

### Layout and elements

| Area | Required elements | Behavior |
| --- | --- | --- |
| Identity header | Journey title, intended dates/timezone, optional category, own capabilities, lifecycle badge | Title/date correction for current administrator or coauthor while open. No automatic “completed” inference from dates. |
| Workspace status | Draft save state where entitled, current approved-version date/visibility, explicit pending restriction | Do not show private draft statistics to a participant/admin-only actor. Never combine backup, draft and publication into one progress percentage. |
| Next-action area | Prioritized actionable items with entity links | Rights/privacy repairs, failed transfers, conflicts and meaningful review tasks. Counts derive only from authorized data. |
| Chronology | Permitted chapters/stages, rest/no-GPS/gap and branch indicators | Coauthor/publisher draft timeline; others receive only their permitted overview/approved entry, not hidden draft structure. |
| Changes | Attributed recent permitted edits and notices | No social feed, full member activity surveillance or email roster. Each notice has a real destination or a safe unavailable explanation. |
| Own contributions | Own source count/status and Add sources | Opens W05 own-source view. Being a member is not automatic contribution. |
| Approved result | Open published journey and eligible highlights entry | Only appears when an accessible approved publication exists. Stale output is rechecked before open. |
| Administrative actions | People, details and lifecycle menu, capability-dependent | Destructive actions use named flows; do not mix archive, leave and delete into one ambiguous action. |

### Actions, exits and state

- Add sources → W05 (N03); continue chapter → W02 (N04); correct a gap → W03 (N05); confirm a practical detail → W04 (N06).
- Manage people/invitation → W06 (N07); compare conflict → W07 (N08); review publication → W08 (N09).
- Open approved story/highlights → N23/N24. Leave/archive/delete → N21. Back → W09/E05.
- Edit event details opens a focused panel: title, start/end, explicit IANA timezone, optional category, validation and Save/Cancel. Title uses the selected 1–160-code-point bound. Ambiguous/nonexistent local times need the existing correction flow; original capture metadata does not change with intended trip dates.

### States and acceptance

First journey/no sources: explain the single-event model and offer Add sources or authorized Invite people. Missing cover: use typography, never stock imagery suggesting a real trip. Loading: stable shell with no invented metrics. Error: retry the failed overview without discarding local work. No tasks: say no current items need attention, not “ready to publish” without a real review. Archived/frozen: retain allowed reading with a specific reason for restricted work. Access removed: N26.

Accept when a participant, admin-only, coauthor and publisher-only each see a useful different next action; no hidden-source counts leak; and every work item opens its exact entity and returns correctly.

<a id="w05"></a>

## 8. W05 — Sources, import and rights

### Job, audience and entry

Acquire selected material, understand its evidence and processing, and explicitly control its use. Entry: N03, source citations N10, W08 source blockers N18, notices N02, or universal navigation. A non-editor owner can manage their own items without receiving shared draft access.

### Layout and elements

| Area | Components and content | Function |
| --- | --- | --- |
| Collection header | Sources heading; own/permitted collection scope; Add files; selected count | Never suggest access to the whole device gallery or another owner's private library. |
| Find and filter | Source type, owner/credit where permitted, date certainty, contribution scope, processing state, selected stage and publication issue filters | State empty results distinctly from no sources. Clear filters is always available. Filter counts must be permission-safe. |
| Source collection | List/grid presentation, thumbnail or type fallback, source name, attribution, capture/entry date, evidence, scope and processing state | Selection is explicit. “Select all” names the current page/result scope; no silent whole-account selection. |
| Batch toolbar | Include/exclude from candidate import; scope controls for owned items; retry/cancel applicable transfers | Name ineligible items and reasons. Never expand grants on another owner's behalf. Report partial results per item. |
| Detail inspector | Permitted media playback, original vs corrected metadata, contributor/photographer distinction, location/time uncertainty, source dependency and grant summaries | Owned-original access remains distinct from permitted review derivatives/fields. User-started media and supported transcript/chunk references. |
| Scope editor | Only me; Journey review; Allow journey publication and sharing; named review audience | Explain eligible reuse and future audience changes. Record grant outcome separately from publication inclusion. |
| Export permission | Request/approve/decline/revoke exact originals; recipient, assets, expiry, state | Separate from source scope. Warn originals may retain metadata and external downloads cannot be recalled. |
| Impact panel | Withdraw or delete own media; affected managed story/share/knowledge uses where entitled | Return safe impact counts without exposing draft content to an owner who cannot read it. If exact coverage is uncertain, use safe broader suppression wording. |
| Transfer/processing queue | Item state, verified-private status, reason waiting, retry/reselect/cancel | No cloud-backup claim until server verification. Browser recovery limits visible. |

### Selected-import subflow

1. **Choose files:** explicit supported selections; visible limits supplied by the qualified configuration, not invented unlimited values. Drag-and-drop is optional; a file-selection button remains.
2. **Review candidates:** thumbnail/type, original time/timezone certainty, suggested trip-date inclusion, duplicate indication, Include/Exclude and corrections. Out-of-range items can be included deliberately. Current location/upload time never fills missing historical metadata.
3. **Choose destination and scope:** one canonical journey, Only me default unless an explicit user choice applies; inspect audience and batch exceptions. A destination is not a publication action.
4. **Confirm selected items:** show accepted, excluded and problematic counts. Start upload only after selection review. Rejected items do not cancel valid files.
5. **Transfer and processing:** queue → uploading → verifying → backed up privately → processing/ready, with failures and cancellation shown on the appropriate independent axis.

Prototype: use bundled candidates and deterministic simulated transitions. No real picker, parsing, upload, broad gallery permission or provider call is needed to resolve this interaction. Production imports follow the actual supported-input matrix, including conditional HEIC/HEIF qualification.

### Actions and exits

- Inspect source is a W05 detail state. Back returns to collection and selected item; a direct detail link falls back to the collection.
- Place in story → W02 (N11); recording/association correction → W03 (N12); create practical detail → W04 (N13). These require editorial authority; an owner's contribution alone does not insert content into the shared draft.
- Who can review? opens a narrowly scoped audience panel (N20). Manage capabilities links to W06 only when authorized.
- Return to originating editor/review restores the N10/N18 context. A grant change makes W08's old review stale.
- Narrow/withdraw/revoke export → N21 and E14 status when needed. Cancel upload preserves the original; delete bytes is a separate explicit owner action.
- Own-original export is not paywalled. A recipient's export request selects exact contributed assets and active recipient identity; approval defaults/maximum follow the selected 24-hour/seven-day policy, with current checks at generation and download.

### Required states and failure branches

Empty own library; empty permitted pool; no filter matches; mixed-scope batch; missing/ambiguous time; location unknown; same-owner duplicate; cloud-file unavailable; unsupported codec/GPX/FIT; partial batch failure; expired sign-in; quota wait; interrupted transfer; missing browser file handle needing reselection; processing/transcription failure with original retained; grant changed mid-selection; withdrawn source; grant expired during export; recovery confirmation pending.

A failed transcript does not make the entire source or journey unusable. A retry keeps stable identities; it must not create duplicate sources. A source removed while its inspector is open closes protected content and preserves a safe navigation path. Browser IndexedDB/file-handle recovery never claims native-grade durability.

### Acceptance tasks

An owner imports a mixed sample batch, excludes one item, corrects uncertain time, changes one owned source to review-only and another to publication reuse, and can explain the difference. A coauthor can review allowed derivatives but cannot inspect private originals or change ownership. W08's blocked-source link opens the same S and returns to a refreshed review. Withdrawal suppresses dependent sample views immediately and shows pending confirmation honestly.

<a id="w02"></a>

## 9. W02 — Story editor

### Job, audience and entry

Compose a readable shared account from permitted material. Coauthors edit; publishers may inspect without editing. Entry: W01 N04, source placement N11, route/detail context N14/N15, W07 resolution N17, W08 repair N18, notices/deep links or universal navigation.

### Layout and elements

| Region | Required elements | Functional contract |
| --- | --- | --- |
| Context/header | Journey, Draft label, saved revision/time, unsent/conflict state, preview/review action | Saving never means publishing. Warn about draft changes since the last approved version. |
| Chapter index | Ordered chapters, stage/day labels, empty/rest chapters, selection, relevant issue markers | Stable IDs; explicit move up/down/move-to controls, optional drag; do not alter raw capture times. |
| Story header editor | Title, summary and eligible cover selection | Simple owned fields; no layout-template selector or unrestricted page builder. Event title changes obey shared metadata rules. |
| Reading-width canvas | Chapter title, narrative, moment blocks/captions, attributed branch/leg references, sourced detail references | Selection/focus exposes controls; no essential hover-only action. Empty chapters are valid. |
| Insertion chooser | Permitted source candidates, note/stage without media, practical-detail reference | Review-only material can remain in review draft where permitted but visibly blocks inclusion in a publication until fixed/excluded. |
| Suggestion review | Source/reason, uncertainty, proposed change, Accept/Edit/Dismiss | Regeneration cannot overwrite confirmed corrections. Confirming editorial content never widens its source grant. |
| Inspector | Source, time/location provenance, credit, inclusion, linked stage/detail, current revision, permission summary | Inline summary plus W05 evidence detail; do not expose owner-only fields. |
| Revision controls | History, conflict entry, reversible local Undo when meaningful | Shared restoration is a new checked revision; it is not browser undo or permission rollback. |

### Actions and exits

- Edit title/summary/chapter/caption; add a note or chapter without media; select cover; insert/exclude a moment; reorder chapters/blocks; rename/merge/split relevant chapter structure with a preview of reference changes.
- Exclude from story removes its placement, not the original or source grant. Show the named effect before a broad removal. Avoid a generic Delete label for all operations.
- Source/credit/rights inspection → W05 (N10); stage correction → W03 (N14); practical detail → W04 (N15).
- History/stale save → W07 (N17); review or exact safe preview → W08 (N19). Publication repairs return through N18.
- Source insertion opened from W05 carries a source reference, never private bytes or a permission assertion in the URL. Revalidate eligibility when saving.

### Save and revision behavior

Production: unsent local edit → queued command with stable ID and base revision → server accepted revision, or retained conflict candidate. Show “Saved to shared draft” only after acknowledged acceptance. “Saved on this browser” requires successful local persistence and must explain browser-storage limits; an in-memory prototype says “Sample edit for this session.”

Do not autosave unfinished invalid fields over valid shared values. Keep errors next to the relevant field, preserve entered text and announce meaningful save failures. Debounce details are an implementation choice; no timing promise is selected here. Each entity's failure should not freeze unrelated edits unless current policy or the command boundary requires it.

### Required states and acceptance

No assembled draft with selected sources; empty chapter; no eligible cover; unplaced source; accepted/dismissed/stale suggestion; read-only publisher; unsent/offline edit; local persistence failure; server error; conflict; removed source; changed capabilities; archived/frozen; long narrative and non-Latin names.

Accept when a coauthor assembles a meaningful no-GPS story from sources, corrects a suggestion and regenerates without losing that correction, resolves a stale caption, and sees that the public approved story remains unchanged. A publisher-only actor must be able to inspect the draft without receiving enabled editing controls.

<a id="w03"></a>

## 10. W03 — Stages, route and geographical evidence

### Job, audience and entry

Make chronology and movement truthful, including what is unknown. Coauthors edit; publishers inspect. Entry: W01 N05, source recording N12, chapter N14, detail N16, conflict return N17, W08 geography/privacy item N18, notices or universal navigation.

### Layout and elements

| Region | Elements | Function |
| --- | --- | --- |
| Ordered stage list | Title, known/unknown time, timezone context, participants where permitted/known, linked moments, evidence and unresolved items | The complete primary task remains usable without a map. Chapter and stage relationships remain explicit. |
| Stage/leg inspector | Rename, time correction, participants, mode, evidence category, notes and source links | A confirmed mode does not create measured geometry. Do not infer every member traveled every leg. |
| Structure actions | Add rest/transfer stage, reorder, split, merge, remove from story | Preview effects on chapters, moments and practical details; no silent dangling references or deletion of originals. |
| Recordings | File provenance, segments/gaps, primary recording and alternatives, optional time/elevation | One recording may span stages; several can belong to one stage. Select primary per overlapping leg to avoid double-counting distance. |
| Moment associations | Placement candidates with reasons, manual association/unplace, uncertainty | Do not snap incompatible or off-route moments to a track. Preserve original metadata and manual corrections. |
| Optional map | Explicit Load map, Map/Satellite, zoom/fit stage/fit journey, evidence legend and attribution | Mapbox in production only; schematic in prototype. Style switch preserves selection and overlays. No map instance until requested. |
| Statistics | Recorded distance/source, separately labelled estimated travel, missing/unreliable elevation | Never add overlapping participants' distances as group distance or fill measurements from a decorative line. |
| Privacy projection | Sensitive section/precision review and publication-context cue | Distinguish private editing evidence from safe output. W08 verifies final geometry, bounds, labels and derived content. |

### Actions and exits

- Reorder using buttons or optional drag; correct time/timezone context explicitly; select participants only from permitted data; record reported movement without drawing a path; preserve a visible unknown gap.
- Splitting/merging shows affected chapter/leg relationships and any needed reassignment before commit. Raw segments and source IDs survive presentation changes.
- Open source/recording → W05 (N10); edit corresponding chapter → W02 (N14); add/inspect practical detail → W04 (N16); history/conflict → W07 (N17); publication review → W08 (N19).
- A W08 repair opens the exact affected stage/geometry context and returns to regenerated review (N18). Proposed composition: coauthors edit redaction configuration; publisher-only actors inspect it and return unresolved items to an authorized editor rather than gaining general editing authority.

### Evidence presentation

Recorded route: solid segmented line with visible gaps. Captured stop: point plus supported accuracy. Author-reported movement: labelled mode and source without invented exact path. Estimated connection: distinct pattern and text. Unknown movement/time: explicit gap/unknown label. Meaning must survive monochrome, map failure and screen-reader use.

### Required states and acceptance

No recordings; geometry without timestamps; rest day; overnight/ambiguous timezone; split departures; overlapping GPX/FIT; planned-route rejection; corrupt recording; off-route photo; antimeridian/large track; redacted endpoints/bounds; map unavailable; no location permission evidence; invalid coordinate; conflict; archived read-only.

Accept when separate departures do not produce a false path through homes, a gap stays a gap, primary/alternate tracks do not double distance, a rest stage is editable without GPS, and every map-dependent action has a non-map route. The prototype proves interaction with prepared geometry; parser correctness and map licensing remain production gates.

<a id="w04"></a>

## 11. W04 — Practical details

### Job, audience and entry

Preserve what the group arranged, paid, carried, rented and learned, with dates and sources. Coauthors edit; publishers inspect. Entry: W01 N06, W05 source extraction N13, story reference N15, stage N16, conflict N17, W08 repair N18, notices or universal navigation.

### Layout and elements

| Region | Required content | Function |
| --- | --- | --- |
| Category navigation | Transport, accommodation, guide/local service, equipment, rental, costs, challenges/lessons, access/arrangements, unresolved questions | Filter by topic and associated chapter/stage; show scope clearly. Not a packing planner or expense settlement tool. |
| Detail list | Short statement, category, observation date, attribution, evidence/source state, relevant chapter/leg | Distinguish suggested/unconfirmed, author report, confirmed correction and unavailable dependency. |
| Detail editor | Statement, category, observation date, contributor, chapter/leg, source reference or explicit author report, evidence | Required values have visible labels; unknown dates remain explicit rather than being replaced by edit date. |
| Cost fields | Exact/estimated amount, currency, unit, group size when relevant, inclusions and deposit context where supplied | Do not infer per-person fare by dividing without an explicit derived-context decision. Decimal money crosses API as strings. |
| Source panel | Permitted note/transcript/media reference and real source offset/chunk range where available | Preserve the distinction between what a speaker reported and an independently verified fact. |
| Contact/privacy controls | Whether a contact may be published; sensitive receipts/media/transcript notice | Editing text alone cannot sanitize an attached image or original. Missing permission blocks inclusion. |
| Suggestion queue | Proposed extraction, source, uncertainty, Accept/Edit/Dismiss | A prepared/model suggestion does not become author-confirmed until reviewed. |
| Correction/history | Original observation date, edit time and correction provenance | An old arrangement stays historical after revision. |

### Actions and exits

- Add manually or from a permitted source. Select a category and related chapter/leg; leave location unknown when unsupported. Save as a new draft detail; do not publish directly from the form.
- Accept/Edit/Dismiss a suggestion. Correction of an extracted amount preserves the source and shows editorial provenance. Regeneration leaves accepted changes intact.
- Inspect source → W05 (N10); view in story → W02 (N15); view stage → W03 (N16); history/conflict → W07 (N17); review publication → W08 (N19).
- Remove a detail from the draft explicitly; preserve permitted source material. A new author report must not be used as a cosmetic replacement for a withdrawn source-derived claim. Affected claims require real independent support and review.

### Required states and acceptance

No details; no category matches; unsourced suggestion; explicit author report; missing amount/currency/unit/group context; unknown observation date; disputed reports; private contact/receipt; unsupported/noisy transcript; lost source permission; conflict; read-only publisher; offline unsent form.

Accept when a sample group taxi fare retains currency, observation date, group-size/unit context and accessible evidence; updating its wording does not change its observation date; and a withdrawn supporting source suppresses dependent publication/answer content until safely repaired.

<a id="w06"></a>

## 12. W06 — People and permissions

### Job, audience and entry

Understand who may do what, manage legitimate access, and transfer responsibility without losing the canonical journey. Entry: W01 N07, administrative notices/deep links N02, authorized management from N20, or universal navigation. Ordinary member access is intentionally much narrower than the administrator view.

### Layout and elements

| Region | Administrator view | Other active member view |
| --- | --- | --- |
| Current authority | Named sole administrator; own powers and state | Own membership/powers and administrator display identity |
| Accepted members | Permitted display identities, powers and status | No general full-roster directory |
| Capability editor | Coauthor and publisher as independent controls; named target and consequence | Read own powers; no edit controls |
| Review-audience explanation | Adding a coauthor/publisher expands access to contributed review material | Contributor sees the named current review audience in source-scope context, not a general roster |
| Invitations | Recipient-specific administration details, powers offered, pending/accepted/expired/revoked state, expiry and delivery state | Only own relevant invitation intent, if applicable |
| Transfer | Offer administration to existing active coauthor; pending/accepted/expired/revoked | Eligible recipient can explicitly accept a valid offer; others cannot claim it |
| Lifecycle | Remove member, archive, canonical delete, own leave under current policy | Own leave and authorized owner restrictions; no administrator powers |

No general email column, role bundle dropdown, “make owner” source-control action or public member directory. Changing administration does not change source ownership, coauthoring or publishing implicitly.

### Actions, transitions and exits

- Invite: select recipient and explicit offered powers, show private-gallery explanation, validate, submit once, show actual pending/delivery state. Invitation validity is seven days in the selected baseline; resend does not extend expiry, reissue supersedes the prior offer.
- Edit powers: show target's current coauthor/publisher values and the change in review audience. Save requires current administrator authority and fresh authentication as specified. Stale member state refreshes the impact, not a blind overwrite. The requester cannot change administration via these controls.
- Transfer: choose an existing active coauthor; show that acceptance is required; 72-hour baseline offer; acceptance rechecks eligibility and exact current offer. One current administrator remains the rule.
- Remove/leave/archive/delete → N21. Removal ends protected membership access and applicable export rights; do not describe it as automatically deleting every contributed original or undoing external copies. Source grant treatment follows the explicit lifecycle policy.
- Return to W01 (N07) or original source audience panel (N20). Notices of role changes route the affected person to a safe authorized destination. If current user's powers change, immediately update the navigation and invalidate protected data.

### Required states and acceptance

Only creator; minimal participant view; administrator without editorial powers; publisher without editing; pending invite; wrong recipient/unverified session; expired/revoked/consumed offer; resend cooldown; safe mail failure; concurrent role change; fresh-auth cancellation; transfer pending/accepted/expired; last admin departure/frozen; archived expansion blocked; source owner who has left.

Accept when five members can hold independent powers on one event, a participant cannot enumerate the full roster, adding a publisher explains its review access, and a transfer moves only administration after acceptance. A publisher/coauthor cannot acquire source ownership or raw-original export by editing People.

<a id="w07"></a>

## 13. W07 — Revision history and conflict resolution

### Job, audience and entry

Understand changes and preserve legitimate work without silently overwriting someone else or reviving forbidden material. Entry: W01/shell conflict N08, entity History or stale save N17, W08 relevant issue N18, authorized notice/deep link N02. Coauthors resolve/restore; publishers may inspect currently permitted history without receiving edit authority.

### Layout and elements

| Area | Elements | Behavior |
| --- | --- | --- |
| Entity context | Owning screen, chapter/stage/detail/field, current revision | Explicit Back to Story/Route/Practical details. Never confuse source grant conflict with a story text merge. |
| History list | Attributed revision time, operation summary, selected revision | Filter to permitted entity history; archived/private/withdrawn content is not exposed by historical snapshots. |
| Comparison | Current saved value, stale candidate, author/time for each; base where available and permitted | Text/structured changes have labels, not only red/green color. Chronology/reordering shows changed references as well as prose. |
| Policy changes | Source unavailable, scope narrowed, membership changed, stale generation | Sanitize comparison before presentation. A historical version is not a permission snapshot to restore. |
| Resolution | Keep current, Use candidate, Combine manually | Show resulting candidate and current base revision before commit. Disable ineligible resolutions with a specific reason. |
| Restore preview | Selected old content transformed into a proposed new revision with current eligibility checks | Identify omitted/ineligible references; never silently restore a withdrawn source or old capabilities. |

### Actions and exits

- Keep current resolves/discards the attempted change deliberately without changing accepted content. Preserve the existing retention/audit behavior; do not promise infinite candidate retention.
- Use candidate creates a new checked revision against the latest state; it is not a force overwrite.
- Combine manually opens an editable proposed result. Cancel retains the unresolved candidate and returns to the originating editor/queue; show the remaining conflict.
- Restore selected revision creates a new revision after current checks. It does not republish, restore source grants or return visibility to an old state.
- Missing source/rights can lead to W05 only under N10 current access; return to the same comparison. Result returns via N17 or N08. W08 returns through N18 and receives a fresh generation.

### Required states and acceptance

No history; no conflicts; candidate unavailable/expired; current entity deleted; source withdrawn since revision; read-only publisher; simultaneous second resolution; network failure after uncertain commit; unsent manual merge; access removed during comparison.

Accept when both conflicting candidates survive a stale save, a second race produces a recoverable conflict, cancel does not discard the candidate, and restore cannot re-expose withdrawn material. Prototype vectors must include structured reorder/association conflict as well as a caption example.

<a id="w08"></a>

## 14. W08 — Publication review and approved result

### Job, audience and entry

Approve exactly what readers and the question system may see. Coauthors can inspect and repair; designated publishers alone activate publication/visibility changes. Entry: W01 N09, editor N19, notices/deep links N02, return from a blocker N18, or universal navigation.

### Layout and elements

Desktop: review navigation and issues beside an exact safe preview. The preview is readable at mobile width, expandable for inspection. Compact web: review and preview are separate selected panels in the same W08 context, with a visible Return to review. Do not shrink two unreadable columns into a phone viewport.

Header: current draft generation/review timestamp, last approved version, blockers/review items/accepted unknowns, authority, and candidate freshness. Internal generation identifiers may live in detail metadata; user-facing copy explains “The draft changed. Review the latest version.”

### Five review areas

| Area | Components and required review | Resolution destination |
| --- | --- | --- |
| 1. Sources and rights | Included source manifest, scope/eligibility, attribution and missing reuse rights; independent original-export explanation | W05 owner scope/rights; W02 exclusion by coauthor. Publisher cannot grant another person's permission. |
| 2. Privacy | Sensitive starts/ends, route/bounds, images, captions, transcripts, contacts, receipts and preview derivatives | W03 geometry; W02 narrative/media inclusion; W04 practical/contact; W05 source. Hiding a map marker alone is insufficient. |
| 3. Evidence and uncertainty | Unresolved important suggestions, participant branches, estimated/unknown legs, source-labelled statistics and dated costs | W02/W03/W04; W07 for a relevant unresolved edit. Honest unknowns may remain. |
| 4. Exact audience preview | Story, Explore, Learn, link card and eligible question-source set from one safe projection | W08 internal preview N22; source detail uses only permitted candidate projection. No need for a live question interface to inspect eligibility. |
| 5. Visibility and listing | Current state, unlisted/public choice, forwarding disclosure, listing opt-in/status, proposed result summary | Final checked publisher action; listing submission has a separate result/state. |

### Actions and publication semantics

1. Reconcile unsent changes before preparing a candidate. The UI must not preview local text while submitting an older server generation.
2. Prepare the safe candidate from exact draft, source-grant and privacy generations. Candidate artifacts are inaccessible to public readers.
3. Show blockers, review items and accepted unknowns separately. Missing rights/privacy violations block. An explicit unknown route is valid; do not fabricate a fact to clear a score.
4. A publisher-only actor can approve a valid candidate but must return editorial repairs to a coauthor/source owner. Coauthor inspection does not expose an enabled publish action.
5. Name the action: **Publish unlisted journey**, **Publish public journey**, or **Review and republish**, matching the actual result. Proposed UX separates **Submit for Discover review** from publication activation so a pending listing is never presented as immediate discoverability.
6. On submit, recheck capabilities, reviewed draft and policy generations. A change returns review-required state; no unseen edits are silently included.
7. Build/verify artifacts outside a long transaction; activate the approved pointer atomically only after final checks. Failure preserves the prior accessible approved version, subject to current restrictions.
8. Success shows approved version/date, actual visibility, actual link, listing state and indexing state separately. “Questions preparing” does not mean unapproved passages are available.

### Approved result and later changes

- Open published journey → N23; share eligible highlights → N24; continue editing → W02, leaving the approved narrative stable.
- New draft edits or late transcripts require another deliberate review. Source narrowing, takedown and privacy restrictions apply immediately across old managed versions.
- Unlisted links are forwardable. Copy link has feedback but no claim that recipients are authenticated. Do not reveal raw bucket URLs or treat a personal highlight as a privacy boundary around the full public journey.
- Unpublish/revoke link/visibility narrowing → N21; current managed access is denied even when journal confirmation remains pending. “Private draft” is not a magic inverse of publication: an already published journey needs the explicit restriction flow.
- Discover status is separate: not submitted, pending review, listed, or removed/rejected with permitted explanation. Creator may correct/resubmit under policy but cannot self-approve moderation. External search-engine indexing remains later scope.
- A rights-dependent repair may temporarily make the affected publication unavailable when safe partial suppression cannot be established. Do not promise every withdrawal preserves all other visible content in every case.

### Required states and acceptance

No publishable draft; no blockers; rights blocker; privacy blocker; accepted unknown; editor-only inspection; publisher-only inspection; draft changed during review; source withdrawn during artifact generation; expired authority; pending/failed build; prior version intact; activated version with indexing pending; listing pending/taken down; restriction confirmation pending; archived/frozen widening blocked; safe preview without map/AI.

Accept when the reviewer can identify every blocker and reach its repair screen, return to the same review section, and see a refreshed exact preview. A race must reject stale approval. A public read continues to show the prior approved narrative during ordinary draft edits, while a rights restriction stops affected old content immediately.

## 15. Shared components and their ownership

Names below describe proposed responsibilities. Reuse existing owned primitives before creating a new abstraction. Shared components receive already permitted data; they do not decide server authorization.

| Family | Components/elements | Consumers and required behavior |
| --- | --- | --- |
| Workspace structure | Journey shell, capability-filtered rail, breadcrumb/back, title/context header | All W screens; current route and focus are distinct; responsive navigation preserves context. |
| Status | DraftSaveStatus, PublicationSummary, RestrictionStatus, lifecycle notice | All relevant screens; separate local persistence, server acceptance, contribution, approval and recovery confirmation. |
| Navigation context | Selected-entity link, return-to-task control, source citation, safe unavailable boundary | Every contextual edge; no arbitrary redirect or hidden-source label leakage. |
| Forms | Existing Button, FormField/Input/TextArea, select, radio/checkbox, error summary | Stable labels, helper/error association, entered-value preservation, busy state without changing action meaning. |
| Collection | Filter bar, scoped result count, pagination, selection/batch toolbar, empty/no-results state | W05/W04/W06/W07; page selection scope explicit; no hidden counts. |
| Journey content | Existing JourneyTimeline, permitted MomentGallery, media fallback, evidence label, contributor credit | W01/W02/W03/W05; extend behavior deliberately without making presentational controls own inference or grants. |
| Editorial | Chapter index, reading-width canvas, block toolbar, insertion chooser, suggestion card | W02; keyboard and pointer alternatives, current-source checks and explicit decision provenance. |
| Geography | Stage/leg editor, recording selector, gap row, participant branch, evidence legend, map adapter | W03; readable list first, optional map, known vs inferred geometry preserved. |
| Knowledge | Practical-detail form/card, cost-context fields, observation-date field, source excerpt | W04/W02/W08; historical context and permissions carried through. |
| Source rights | Existing SourceScopeSummary plus explicit ScopeEditor, audience detail, export-grant form | W05/W08; summary does not issue commands; grants stay independent. |
| People | Capability editor, minimal member summary, invite row, transfer offer | W06; administrator fact separated from editable coauthor/publisher powers. |
| Revision | History list, three-way comparison where available, merge composer, restore preview | W07; permission-filtered old content and expected-revision submission. |
| Publication | Review sections, issue row, safe-preview adapter, visibility form, approved-result summary | W08; selected generation and current rights; no copied private draft in the public renderer. |
| Feedback/overlays | Existing Dialog, impact confirmation, inline status, operation-status link | Cancel/focus return, safe defaults and no nested-dialog maze. Durable status is not toast-only. |

Component inventory is not an instruction to install a new UI library, rich-text editor, map wrapper or drag-and-drop dependency. Additional dependencies require an actual scoped need and the canonical register decision.

## 16. Responsive, accessible and recoverable behavior

### 16.1 Layout adaptation

Design responsive composition from scratch. On each supported size, keep tasks, selected context and return paths usable, including imports, editing, conflict comparison and publication review. Larger text must wrap without hiding actions or focus. Choose navigation, pane counts, inspector placement, breakpoints and density during the new screen work. Any appearance change retains form values and review state.

### 16.2 Interaction baseline

Visible labels; semantic links for navigation and buttons for actions; logical headings/landmarks; explicit selected and focus states; no hover-only controls. Choose and validate accessible target sizes during the new component design.

Reordering and correction have both keyboard and single-pointer non-drag alternatives. Modal focus enters the dialog, remains contained while modal, and returns safely on close. Meaningful asynchronous saves/errors are announced without repeatedly interrupting typing. Forms group related fields and connect inline errors/help to controls. These applications follow the researched patterns in section 21, and still require actual accessibility testing.

### 16.3 Shared state vocabulary

| Situation | What the interface communicates | Recovery |
| --- | --- | --- |
| Loading | Specific task/data loading, stable structure | Cancel/Back when meaningful; retry actual failure. |
| Empty | No items exist for this allowed scope | One relevant creation/import action. |
| No results | Existing collection has no matching items | Clear or change filters; retain underlying collection. |
| Unsent edit | Change is not server-accepted | Preserve supported local work, retry after connectivity/auth, resolve conflicts. |
| Save uncertain | Response lost; completion unknown | Reconcile same command ID before retry; do not duplicate. |
| Upload/processing failure | Exact item and safe reason | Retry, cancel, reselect or retain original; rest of batch remains usable. |
| Session expired | Sign in to resume permitted work | Recheck current capabilities and intent before action. |
| Permission changed | Action/content no longer available | Remove protected data, offer safe destination. |
| Source no longer allowed | Dependent material needs repair | Suppress unsafe output and direct authorized user to repair. |
| Restriction pending | Access already restricted; recovery confirmation pending | Persistent status/retry; never re-enable content to clear the error. |
| Provider failure | Map/transcription/AI unavailable | Keep stages, source playback where supported, text and manual correction usable. |

## 17. Architecture and data responsibilities

### 17.1 Screen-to-domain mapping

| Screens | Domain authority | Core data/command contracts | Technical failure to preserve |
| --- | --- | --- | --- |
| W01/W06 | Journeys + Identity + Lifecycle | Canonical identity, scoped membership, invitations, independent powers, transfer, notices | Unauthorized roster/summary; stale impact; duplicate join; no-successor freeze. |
| W05 | Sources + Processing + Lifecycle | Upload session/parts/checksum, source identity/provenance, grants, exact export grants, dependency impact | Object/DB interruption, unsupported input, grant race, owner-only originals, stale archive. |
| W02/W07 | Editorial | Expected entity revision, stable command, retained conflict candidate, draft generation and restore | Save retry vs conflict; candidate must survive rejection; no old-rights restore. |
| W03 | Geography + Editorial | Segments, legs, participants, explicit chapter associations, evidence/corrections, separate safe geometry | False continuity, duplicate statistics, lost manual correction, redaction leak. |
| W04 | Knowledge + Editorial + Sources | Dated detail, source/report provenance, money context, reviewable extraction, dependency graph | Historical date confusion, unsourced claims, private contacts, withdrawn support. |
| W08 | Publication + Policy + Discovery + Answers eligibility | Reviewed draft/policy generation, safe candidate manifest, derivatives, active version, listing/index state | Stale approval, unsafe preview, late artifact activation, old-link bypass. |

### 17.2 Boundaries that screen design must preserve

- Existing React/Vite+/TanStack creator app and owned Tailwind/shadcn components. TanStack Query owns fetched state; explicit editor state and durable web outbox own unsent commands. Query persistence alone is not a draft durability proof.
- Versioned Zod/OpenAPI wire contracts and generated clients; never import server database/auth objects into screens. Better Auth authentication and journey authorization remain different boundaries.
- Server domain operations own permissions, revision checks, transactional audit/jobs and restrictions. Hono handlers do not assemble policies ad hoc in UI-specific paths.
- PostgreSQL holds canonical state. Private SeaweedFS objects are delivered through current-authorized media/export gateways. Ordinary image URLs are not a way around later revocation.
- Jobs capture input revisions/policy generations and cannot activate obsolete outputs. Publication candidate preparation and final activation are separate phases.
- Exact preview and delivered reader use the same viewer-safe projection contract. An editor-only “hide private fields” switch over full private data is not that contract.
- GeoKit and Moments are reusable pure processing/placement responsibilities. Studio composes the UI; Privacy/Publisher retain server authority; Player consumes the safe output. These names do not create eight services or npm packages.
- WSL owns a future immediate web/backend runtime loop. This Windows task is documentation authoring only; no host sync, Compose, dependency install, native build or runtime activation is performed.

### 17.3 Candidate viewer contract to refine first

Agree schema/version identity, ordered chapters/stages, evidence semantics, permitted attribution, redacted geometry/bounds, safe media references, practical details and approved-source references. Keep private original IDs that reveal hidden data, raw EXIF, private transcripts and direct bucket URLs out. Record publication and policy generations for current checks. Exact fields belong to contract review, not this planning document.

This contract connects W02/W03/W04/W05/W08 to the public viewer and question corpus. It is the first cross-screen architecture decision to review before implementing exact preview.

## 18. Requirement traceability and known implementation gaps

| Screen | Primary requirement anchors | Critical prototype proof | Production proof remains |
| --- | --- | --- | --- |
| W01 | TRP-01/02/05/06, COL-06/10, STO-06/07 | Role-scoped overview and exact task destinations | Current authorized projections, notices and lifecycle checks. |
| W05 | IMP-01–08; COL-01–04/07; SYN-02/03/05/06; OWN-02/03/04; PUB-02/08 | Selected import, independent scope/export, per-item recovery, return to blocker | Real file processing, resumable transfer, durable state, grant/gateway enforcement and withdrawal propagation. |
| W02 | REC-01/02/04/06/08; STO-01–07; COL-04/08/09; SYN-05 | Compose from sources, persistent corrections, shared vs approved distinction | Server revisions, web outbox/recovery and source-safe composition. |
| W03 | REC-01–06/08; GEO-01–04/06; COL-08 | Branches, gaps, rest stages, primary recordings and non-map correction | Real GPX/FIT normalization, statistics, Mapbox integration and actual redacted payloads. |
| W04 | LRN-01–06; REC-04/08; ASK-02 | Dated sourced details, group-fare context, suggested vs confirmed | Authorized extraction/transcription, offsets, dependencies and private-data enforcement. |
| W06 | TRP-03/04/05; COL-06/07/10; OWN-01/05 | Minimal roster, independent powers, accepted transfer | Real offers/auth freshness, concurrency, revocation and lifecycle operations. |
| W07 | COL-09; STO-04/07; SYN-05; PUB-02 | Preserve candidates, explicit merge/restore and safe return | Atomic conflict retention, current-grant checks and retry races. |
| W08 | STO-06/07; PUB-01–08; GEO-04; LRN-06; ASK-03/08; DIS-01 | Five-part review, exact safe sample preview, deliberate activation and withdrawal | Real projection/derivatives, publication race checks, catalog/index integration, managed access and recovery journal. |

Conditional REC-07, GEO-05 and IMP-09 must not appear as working unconditional promises. Manual corrections, labelled gaps and explicit selected imports remain complete fallbacks. This traceability is coverage planning, not closure of any requirement.

### 18.1 Current-source observations

At source checkpoint `4a6528e728bc4c799a957730dcd6244b65417ab7`, the creator specimen uses Moments/Story/People/Review areas. It has prepared timeline/gallery behavior, one sample source-scope control and a session caption save/undo. It is not the complete eight-screen workspace.

- The specimen People area maps all member actors into rows. That presentation must not be copied into the proposed production/minimal-member view; D03 requires capability-scoped roster disclosure.
- The specimen Story branch offers editing only under `canEdit`; the target specification additionally needs readable publisher-only draft inspection.
- Review currently describes prepared eligibility and explicitly issues no publication link. It does not qualify W08 exact approval or a publication pipeline.
- Route editing, practical-detail editing, connected revision comparison and detailed import flows remain separate work, under the functional implementation dependencies; old design milestones are withdrawn.
- The newer sample-reader navigation record establishes selected-view/context behavior for that fixture only. It does not establish production authorization or exact-publication resume.

These are narrow source observations, not a full code audit. Do not replace the existing source wholesale based on this planning artifact or label current specimen gaps as new production regressions without further review.

## 19. Decisions and change control

### 19.1 Baseline choices to carry forward

One canonical event; private-by-default source selection; independent administration/coauthor/publisher/source/export authorities; a single administrator with accepted transfer; honest uncertainty; current grants on all historical views; expected-revision editing; immutable approved narrative with immediate restrictive overrides; complete R1 scope; selected technical stack; visual direction is undecided.

### 19.2 Proposed screen-level choices in this specification

| Decision | Recommended choice | Reason / affected screens |
| --- | --- | --- |
| P01 Navigation | Seven primary journey destinations; W07 contextual | Keeps the main task menu concise while making conflicts reachable from their entities. All W screens. |
| P02 Label consistency | Creator “Sources” and “Publish”; W04 navigation “Learn,” heading “Practical details” | Matches canonical IA while explaining editing tasks. W04/W05/W08. |
| P03 Repair continuity | Explicit Return to publication review after blocker navigation | Prevents losing review position and requires refreshed generations. W02–W05/W07/W08. |
| P04 Compact composition | One task panel at a time; full-width inspector/preview | Keeps editing/review readable without imitating native navigation. All W screens. |
| P05 Publication vs listing | Distinct publish result and Discover submission/status | Avoids implying a moderation decision occurred with publication. W08 and public catalog handoff. |
| P06 Redaction editing | Coauthors edit draft privacy configuration; publishers inspect/approve and can restrict visibility | Preserves publisher-without-editor capability separation. W03/W08; contract review must settle exact redaction commands. |
| P07 Safe read-only views | Publishers can inspect W02–W04/W07 without edit controls | Matches existing draft-review authority and makes publication review practical. |
| P08 Editor structure | Bounded chapter/narrative/moment/detail composition, no general page builder | Supports the product's default layout and minimizes unnecessary control. W02. Exact rich-text needs remain open. |

These proposals are ready to review, not a record of explicit user approval. They do not require a paid prototyping tool.

### 19.3 Open decisions and required evidence

| Open decision | Safe design behavior until settled | Resolution needed before |
| --- | --- | --- |
| Narrative formatting and field limits beyond the selected title/account bounds | Plain bounded content controls; do not invent rich-text dependency or arbitrary numeric promises | Editor wire schema and validation UI. |
| Exact chapter/stage/leg association editing contract | Explicit relationships and impact preview; no assumption of one-to-one identity | W02/W03 split/merge commands and fixture vectors. |
| Scope of publisher-only historical inspection and revision metadata | Current draft/review entitlement only; no old denied source content | W07 authorized history projection. |
| Redaction command authority and owner vs editorial location correction | Coauthor draft changes; owner grants; publisher approval/restriction remain distinct | W03/W08 command contracts. |
| A “request permission/fix” action beyond existing notices | Show the permitted owner/editor and actionable issue; no invented chat, email or notification delivery | Any new notification command or collaboration promise. |
| Conflict consequences for publication | Only a demonstrably reviewed generation may publish; distinguish rejected stale candidate from accepted draft content | Publication blocker policy; do not blanket-block unrelated history without a rule. |
| Media/codecs, batch, duration and source/route limits | Render qualified configuration and sample-only bounds; explain unsupported inputs | Real import UI and release. |
| Transcription languages, alignment and processing budgets | Prepared sample text; actual chunk offsets only; unsupported state | Real transcription/extraction. |
| Revocation/retention/RPO/RTO guarantees | Show actual state; selected policy targets are not measured guarantees | Shared-data activation and public release. |
| Public brand/domain, moderation ownership, production email and provider terms | Working product name; visual identity undecided; local sample links and no delivery claims | Relevant deployment/public toolkit release. |

For a business change, record: decision, prior rule, reason, affected actors, incoming/outgoing edges, source/visibility consequences, data/API implications, migration/compatibility impact and replacement acceptance scenarios. Update the governing document first when policy changes; this screen specification then follows. Do not silently add voting, unrestricted collaboration, navigation, AI chat, bookings or payment gates through a UI example.

## 20. Prototype delivery and review packet

### 20.1 Fidelity and coverage

All eight screens receive a connected primary task. Core interactions work with deterministic sample data: typing, selection, filtering, ordering, suggestion decisions, conflict resolution, scope changes, safe preview and scenario-state transitions. Consequential failure/permission states are selectable and visibly simulated. Supporting account/lifecycle boundaries reuse their documented handoffs rather than growing into a second production implementation.

Every visible primary control must either work in the sample or carry an explicit simulation boundary. No fake “backup complete,” live email, public link, original-file archive, map service, AI generation or recovery receipt is inferred from a timer or cosmetic success message.

### 20.2 Build order for this creator-web prototype

1. **Shell and connectivity:** W01 plus capability-aware destinations, contextual selection/Back, unavailable and unsent-navigation behavior. Use the W IDs for traceability and newly selected design choices when available.
2. **Sources:** W05 import candidates, owner/permitted pool, scope/export distinctions, transfer failures and withdrawal.
3. **Composition:** W02 plus prepared suggestions; W03 stages/branches/gaps; W04 sourced practical details. Build mutual source/entity links together.
4. **Conflict and authority:** W07 candidate retention/restore plus W06 scoped People/independent powers/transfer. Exercise actors across already-built screens.
5. **Publication:** W08 safe sample projection, five-part review, blocker-return loops, stale generation, approved result and restrictive changes.
6. **Complete walkthrough review:** run F01–F06, all supported compact/wide layouts and the shared adverse states; record findings and proposed business decisions.

This order is for interaction design. It does not reorder the production requirement sequence or authorize production services just to make the prototype appear functional. Preserve the prototype's branch/isolation and selective production-handoff policy.

### 20.3 Fixture checklist

Use one labelled fictional five-person journey with separate departures, common stages, a rest day and returns. Include a creator with all initial capabilities, a coauthor without publishing, a publisher without editing, a participant and an administrator-only variant that still has exactly one administrator. Include a former-owner scenario separately.

At minimum: private/review/publication-permitted sources; a missing-time source; an overlapping recording with a gap; a failed import; a prepared transcript with actual fixture chunk offsets; a dated group-fare detail; a contact without publication permission; a draft differing from the approved version; two stale-edit candidates; a rights change during review; a withdrawn source used by a highlight and answer; pending and confirmed restriction examples. Do not present synthetic geometry, imagery or reported costs as an actual trip.

### 20.4 Bounded acceptance matrix

| Check | Scenario and expected result |
| --- | --- |
| C01 Connectivity | Walk N01–N26 with applicable actors; each target/return exists; no dead primary control or arbitrary redirect. |
| C02 Scope comprehension | Participant contributes without draft access; owner explains backup, review, reuse and original-export distinctions. |
| C03 Composition | Build from sources rather than only opening a finished story; missing media/GPS does not block chapters/rest days. |
| C04 Evidence | Correct branch/gap/primary track and group-fare context; no fabricated path or multiplied distance. |
| C05 Conflict | Retain candidate, compare, cancel, resolve and race again; old revision does not restore withdrawn source. |
| C06 People | Minimal member roster, independent powers, fresh-auth cancellation and accepted transfer preserve correct authority. |
| C07 Publication | Each blocker opens its owner screen and returns; safe preview matches prepared activated projection; stale generation rejected. |
| C08 Restriction | Withdrawal suppresses dependent output immediately; pending confirmation remains separate; no old-preview bypass. |
| C09 Navigation/recovery | Deep link, refresh, Back, filters, selection and local unsent work behave as specified; revoked data never reappears. |
| C10 Accessibility/layout | Keyboard and non-drag completion; dialog focus; status announcements; compact/wide light/dark; zoom/long text/reduced motion. |

Prefer a few connected scenario tests against the real prototype controller/UI boundary over a mocked test for each component. Actual production durability, concurrency, authorization, media, recovery and provider gates remain separately required. Automated accessibility scans supplement, not replace, keyboard/screen-reader task inspection.

### 20.5 Required review outputs

Screen inventory with state/actor coverage; navigation-edge pass/fail ledger; sample dataset/version; annotated wide/compact screen captures; issue list with source requirement and severity; proposed business decisions; component reuse ledger; explicit production handoff/exclusion list. Record actual source/fixture inputs for each executed check. Do not mark these outputs complete because this specification exists.

## 21. External research and application

Sources consulted 5 November 2026. These support interaction decisions, not Kairn's domain policy or a compliance claim. No third-party branding/components are adopted merely because their guidance is cited.

| First-party source | Finding applied here | Application |
| --- | --- | --- |
| [USWDS forms](https://designsystem.digital.gov/components/form/) | Clear labels, grouping and associated help/errors support understandable form completion. | W01 details, W04 cost/source fields, W05 scope/export and W06 invitations. Use Kairn's own design system. |
| [WAI-ARIA APG modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | Modal focus must enter and stay within the modal; closing restores a logical focus target. | Import decisions, impact confirmation and contextual inspectors that are actually modal. Not every side panel needs modal behavior. |
| [WCAG 2.2 dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements) | Dragging needs a non-drag single-pointer alternative; keyboard support is also required under its own criteria. | Move up/down/move-to and explicit stage/location forms in W02/W03. |
| [WCAG status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | Important status changes should be available to assistive technology without taking focus. | Save failures, filtered-result counts, processing and pending restriction status. Avoid announcing every keystroke. |

Design inference from the product and these patterns: keep evidence inspection adjacent but give it a stable return path; use persistent status for durable work; keep permission consequences close to the action; and preserve readable list-based editing when geography fails. These are reasoned design choices, not findings from a new user study.

## 22. Skills and implementation handoff

This is a workflow specification, not a new reusable agent skill. Relevant existing skills are selected by actual work; no new skill or dependency is installed by this document.

| Work | Skills to apply | Project-specific constraint |
| --- | --- | --- |
| Screen planning and visual refinement | Impeccable, frontend-design; emil-design-eng for interaction polish | Follow the fresh design process and real content/permission semantics. Planning does not require new brand interviews for settled facts. |
| Module/contract decisions | kairn-architecture; codebase-design when designing module interfaces | Existing modular monolith, generated contracts and platform ownership. |
| Sources, grants, preview and lifecycle | kairn-publication-access; kairn-capture-sync when implementing actual import/recovery | Server current policy, separate export grants, generation checks and honest browser durability limits. |
| Web components/forms | shadcn, vercel-react-best-practices | Existing React renderer and owned UI; no Next.js/RSC or competing state stack. |
| Routing and preserved context | router-core with navigation, search-params, auth-and-guards, data-loading/router-query as needed | Route guards never substitute for domain authorization; validate every resume parameter. |
| Maps | mapbox-web-integration-patterns; performance patterns when measured | Selected Mapbox only, explicit loading and list fallback; prototype uses a schematic. |
| Verification | web-design-guidelines, playwright-best-practices; vitest adapted to Vite+ if unit coverage is justified | Small critical scenario coverage; no second runner or toolchain. |

### 22.1 Verification of this planning artifact

Authoring host: Windows. Source baseline: `4a6528e728bc4c799a957730dcd6244b65417ab7` plus the combined documentation delta. Scope is documentation only; consolidated review and verification are recorded in [workflow review](workflow_review.md).

Chosen checks: canonical W01–W08 inventory; entry/exit/action/state/acceptance coverage; contextual-edge references and endpoint vocabulary; relative Markdown links; requirement-ID references; whitespace/diff review. No application tests are required for this reversible documentation change, and no product acceptance is claimed.

Executed results: all eight canonical screen sections present; N01–N27 defined once with no undefined N references; local source links resolve; explicitly named requirement IDs and numeric ranges resolve against the governing register; screen-section structure check passed after heading normalization; `git diff --check` passed. Manual review reconciled publisher read-only access, restricted People disclosure, current-grant revision access, return-to-review freshness and separate publication/listing state. Replaced the initial W07 source-link shorthand with the explicit N10 connection. This checks document consistency, not runtime navigation or accessibility conformance.

## First connected static wireframes — 5 November 2026

Artifact: [flow-wireframes.pen](../../design/flow-wireframes.pen). Start at canvas frame **00 / OjON2**, then follow numbered frames and the adjacent review annotations. This is a **static flow wireframe**, not a clickable prototype. Pen's installed schema/execute API exposes no frame-navigation interaction primitive; a text `href` does not establish prototype transitions. The overview has drawn arrow connectors and each frame has explicit forward, Back/Cancel, entry, actor, state and accessibility notes outside its product UI.

Review status **S** below means static contract/connection review and structural canvas check completed, with representative rendered screens inspected. It does not mean user-approved interaction design, runtime/device acceptance or individually exercised accessibility. N = native shared Android/iOS review size 390 × 844; W = browser review size 1280 × 900. Aliases on a wide frame are functional equivalents, not an additional drawn native composition; compact/wide adaptations remain open. A state under an existing ID is not a new page requirement.

All content and outcomes are fictional/simulated. Inter, grayscale, rectangle controls, dimensions and spacing are disposable wireframe choices. They establish no visual system. Frame-level annotations carry state reuse and alternatives; they do not claim actual durable saving, upload, email delivery, publishing or deletion.

| Frame / Pen node | Screen IDs and task/state | Drawn size | Actor / source state | Notes node | Review |
| --- | --- | --- | --- | --- | --- |
| 33 / `T6qgn4` | W01 — Journey workspace | W | Leela; coauthor | `v3wWJ` | S |
| 34 / `fVjiW` | W05 / A06.sources — Choose a permitted source | W | Leela; coauthor, review projections | `eO56s` | S |
| 35 / `PyxKp` | W05 / A04.moment — Review source evidence | W | Leela permitted reviewer / Arun owner variant | `w8AvV` | S |
| 36 / `qKIem` | W02 — Compose the shared story | W | Leela; coauthor | `tDfVR` | S |
| 37 / `CFcUc` | W03 — Correct stages and route | W | Leela; coauthor | `X7y53X` | S |
| 38 / `P4c2Mg` | W04 — Correct practical detail | W | Leela; coauthor | `m6z8MP` | S |
| 39 / `llGVn` | A07.conflict / W07 — The draft changed | W | Leela; coauthor | `slSEs` | S |
| 40 / `vVe4S` | W07 / A07.conflict — Resolve safely | W | Leela; coauthor | `Z7Pu5` | S |
| 41 / `l3G33` | W08 / A06.publish — Review before publishing | W | Dev; publisher only | `spQp7` | S |
| 42 / `f9V4j` | W08 — Publication blocked | W | Dev publisher / Leela coauthor variant | `yWy9L` | S |
| 43 / `fDsjx` | W02 — Repair publication blocker | W | Leela; coauthor | `PEjMh` | S |
| 44 / `iZeUL` | W08 / A06.preview — Candidate preview · Story | W | Dev; publisher; candidate C2 | `QZ8xL` | S |
| 45 / `V930q3` | W08 / A06.preview — Candidate preview · Explore | W | Dev; publisher; same candidate C2 | `iF7hX` | S |
| 46 / `kF0CJ` | W08 / A06.preview — Candidate preview · Learn | W | Dev; publisher; same candidate C2 | `SV3Qj` | S |
| 47 / `zTbWh` | W08 — Choose audience and approve | W | Dev; publisher only | `TBBJb` | S |
| 48 / `NHrMY` | W08 / A06.publish — Review is out of date | W | Dev; publisher | `eLNs9` | S |
| 49 / `Hmjs4` | W08 / A06 — Publication approved | W | Dev; publisher · simulated success | `yLXMf` | S |
| 50 / `C3mig` | W08 — Discover listing status | W | Dev; publisher | `o5YLT` | S |
| 56 / `oZPC5` | A08 / W09.highlights — Choose your highlights | N | Arun; active participant; approved V1 | `iikbx` | S |
| 57 / `GUxwL` | A08.preview / W09.highlight-preview — Preview your highlights | N | Arun; active member | `T4d8ft` | S |
| 58 / `M6R5ee` | A08.preview / W09.highlight-preview — Share explicitly | N | Arun; hosted selection ready (simulated) | `lNIgy` | S |
| 63 / `XRAlV` | W09.history / E05 — Your journeys | W | Leela; authenticated browser | `jgNlL` | S |
| 64 / `ejLTk` | W09.highlights / W09.highlight-preview — Create personal highlights | W | Arun; browser authenticated active member | `P5bLr` | S |

## Scope-to-preview refinement — 5 November 2026

Continue in [flow-wireframes.pen](../../design/flow-wireframes.pen), overview **R00 / `OLIDE`**. The R labels are artifact/state references, **not new canonical screen IDs**. This refinement adds 21 paired native/compact-browser states (42 screens and 42 external annotation panels). Original first-flow frames remain intact and their relevant annotations point here. The detailed loop below supersedes their schematic treatment for this task only; unrelated canvas work is preserved.

All ordinary frames use a **390 × 844** native or browser content viewport. R19 uses 200% text and a **390 × 1316 full scroll-content capture** for that same 844px viewport. R20 is a scrolled editor fragment with a 300px keyboard-occlusion allowance; its actions end at y=388, above the y=544 occlusion boundary. Browser chrome/OS keyboard are not app-owned drawings. These are temporary review sizes, not selected breakpoints or typography.

Status **S** = static contract review, settled canvas bounds check, and representative screenshot inspection; no runtime/accessibility certification. Every screen has entry, action, caller-specific return, actor/current source state, failures and focus notes outside product UI. N/W are platform equivalents of the existing A/W/E responsibilities.

| Artifact / Pen node | Existing screen responsibility and state | Actor | Size | Notes node | Review |
| --- | --- | --- | --- | --- | --- |
| R01W / `LJEtT` | W05 — Who may use this source? | Arun · active source owner | 390 × 844 | `znqWe` | S |
| R02W / `m8tWo` | W05 — Confirm each source | Arun · source owner | 390 × 844 | `uXoXp` | S |
| R03W / `RdJzN` | W05 — Review the audience again | Arun · source owner | 390 × 844 | `Qsdmq` | S |
| R04W / `WdVPg` | W05 — Correct your transcript | Arun · source owner | 390 × 844 | `y4rQ6L` | S |
| R05W / `YyMhg` | W05 — Checking the save | Arun · source owner | 390 × 844 | `wAdWk` | S |
| R06W / `b4WarO` | W08 — Publication is blocked | Dev · publisher only | 390 × 844 | `P6uAa` | S |
| R07W / `S3T8z` | W08 — Repair the rights blocker | Leela · coauthor, not publisher | 390 × 844 | `rDg4S` | S |
| R08W / `Z3mZnS` | W02 / W04 — Exclude the affected uses | Leela · coauthor | 390 × 844 | `HUN8b` | S |
| R09W / `iQR1w` | W07 — Keep your repair candidate | Leela · coauthor | 390 × 844 | `q2jt6v` | S |
| R10W / `fBGR0` | W08 — Preparing a fresh preview | Dev publisher / Leela reviewer | 390 × 844 | `i5WK2` | S |
| R11W / `coNL2` | W08 — Review the refreshed result | Dev · publisher only | 390 × 844 | `QvK3r` | S |
| R12W / `pzSqg` | W08 — Story preview | Dev · publisher; candidate C2 | 390 × 844 | `KH9dT` | S |
| R13W / `gtOF8` | W08 — Explore preview | Dev · publisher; candidate C2 | 390 × 844 | `Z7d52` | S |
| R14W / `gb0Tf` | W05 — Inspect the review source | Dev publisher / Leela coauthor | 390 × 844 | `h5rxCX` | S |
| R15W / `S83Qn` | W08 — Learn preview | Dev · publisher; candidate C2 | 390 × 844 | `DBZvw` | S |
| R16W / `FAHfZ` | W08 — This preview is out of date | Dev · publisher | 390 × 844 | `p3TH7M` | S |
| R17W / `o1BT9` | W08 — Approve this exact candidate | Dev · publisher only | 390 × 844 | `E6efZw` | S |
| R18W / `oAsxq` | E15 — This task is unavailable | Current account lacks required access | 390 × 844 | `mkhGo` | S |
| R19W / `thlOr` | W05 — Who may use this source? | Arun · source owner · large-text review | 390 × 1316 scroll; 844 viewport | `MGUGN` | S |
| R20W / `mBN8F` | W05 — Correct transcript | Arun · source owner · keyboard review | 390 × 844 | `nvAMm` | S |
| R21W / `nogEX` | E01 / W02 — Independent browser sign-in and repair return | Leela; browser initially signed out | 390 × 844 | `B16ou` | S |


## Gather component recipes — 5 November 2026

[System specification](../design/gather-system.md) and [frame registry](../../design/gather-system/frames.json) describe the selected Gather direction and candidate components in [gather.pen](../../design/gather.pen).

| Recipe / screen | Frame / external note | Platform and review size | Actor, state and transition | Review status |
|---|---|---|---|---|
| GS14W / W08 | `bp64o` / `zCKmD` | Compact browser, 390 × 1040 | Dev publisher only sees the review-only voice blocker and two dependent uses. Repair requires an independently authorized coauthor/owner; Back returns review. | Static component composition reviewed; runtime pending |
| GS15W / W02 + W04 | `U2uvL` / `e9aJpo` | Compact browser, 390 × 1040 | Leela coauthor reviews removal of voice placement and dependent fare claim. Accepted scoped repair returns W08 for a fresh candidate; stale proposal remains retained. | Static component composition reviewed; runtime pending |

The role walkthrough is not an automatic account switch. Native/browser authentication remains independent. A coauthor cannot grant source reuse or approve publication; a publisher without coauthor powers cannot apply this edit. R01–R21 retain the complete repair/invalidation/return contracts.
