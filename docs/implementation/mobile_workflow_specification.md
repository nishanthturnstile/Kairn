# Mobile workflow and screen specification

> **Visual reset, 5 November 2026:** [DESIGN.md](../../DESIGN.md) is the active planning hub. Keep the tasks, information, permissions, connectivity and recovery requirements below. Visual identity, layout, navigation composition and component appearance are undecided; remaining container/label examples are revisitable interaction proposals, not approved page designs.

Date: 5 November 2026. Version: 1.0. Status: proposed detailed interaction specification for the complete mobile prototype; existing product rules remain binding. No new production capability or native acceptance is claimed.

Scope: Android and iOS journey history, create/join, journey overview, capture, moments/sync, selected import, focused editing, highlights, and account. Includes necessary supporting screens and explicit handoffs to creator/public web. This is the screen specification requested for this workstream; the skill selection at the end supports implementation, rather than replacing the screen design.

Read the [shared lifecycle and cross-surface specification](lifecycle_workflow_spec.md) for complete web handoffs, action-specific lifecycle outcomes, freshness and account isolation. Platform-specific connections remain below.

## 1. Purpose, authority and research findings

### 1.1 What Kairn is helping people do

A group records one departure-to-return journey, including separate departures, transfers, rest days, activity and return. People own their original moments, contribute selected material, coauthor one truthful account, and approve a story that others can experience and learn from. A useful journey does not require GPS or AI. One canonical event appears once in each member's history; personal highlights are presentations of that event, not new trips.

Mobile's primary job is fast, reassuring capture and manageable follow-up while travelling. It also supports selected imports after the trip, source control, focused corrections, and personal sharing. Dense composition remains web-led. Visitors can read approved stories on responsive web without installing the app or creating an account. The native app does not become a navigation, live tracking, SOS, packing, booking or social-feed product.

Initial users are people taking self-organised multi-day trips with friends, initially reachable Indian outdoor/travel communities. The first-year emphasis is useful community adoption. Do not add subscription upsells, unlimited-storage promises or invented activity metrics to these screens. Own-data export is not paywalled.

### 1.2 Authorities and inspected evidence

| Source | What it governs / what was learned |
| --- | --- |
| [Product plan](../core/product_plan.md), [requirements](../core/product_requirements.md) | Purpose, complete R1 scope, 117 functional IDs, capabilities, privacy, durability and release scenarios. |
| [Functional screen inventory](../core/application_design.md#71-screen-inventory) | Canonical A01–A09 responsibilities; shell composition is reopened. |
| [Architecture](../core/architecture.md), especially §§5–11, 14–16 | Modular monolith, app-owned files/SQLite, versioned operations, source grants, approval, current-access enforcement and independent restriction recovery. Section 14 alone owns dependency selection. |
| [Fresh design hub](../../DESIGN.md), [product context](../../PRODUCT.md) | Visual decisions are reopened. Existing code and screenshots do not prescribe colors, fonts, spacing, icons or page layouts. |
| [Account/journey decisions](accounts_journeys_access_decisions.md), [experience handoff](accounts_journeys_access_design.md) | One administrator; separate coauthor/publisher powers; limited People disclosure; selected form limits, invite/transfer expiry and lifecycle policy. E01–E16 remain cross-references. |
| [Design process and prototype boundary](../../DESIGN.md#5-prototype-boundary) | Plan a new connected prototype after relevant choices; keep sample data and simulated capabilities explicit. |
| [Mobile plan](mobile_development_plan.md), [host guide](native_host_setup.md), [setup checkpoint](repository_setup_progress.md) | Android/iOS local compiled clients, separate native host ownership and evidence. iOS public distribution is deferred, not iOS design or local verification. |
| Existing native source at `4a6528e728bc4c799a957730dcd6244b65417ab7` | Inspected root/prototype layouts, route inventory, account screen and prototype navigation. `/`, `/account`, `/verify-email`, `/reset-password`, `/prototype`, `/prototype/journey`, `/prototype/reader` and specimen routes exist. This is not evidence that the complete screens below work. |

Research was a repository/source review plus first-party platform guidance, not competitor testing, interviews, native UI execution or a new backend audit. Existing prototype shells and real account code must stay distinguishable; existing auth transport must not be replaced by sample login.

### 1.3 External research and design consequences

Sources checked 5 November 2026. These inform interaction design, not library installation or support-matrix qualification.

| First-party source | Applicable finding | Consequence here |
| --- | --- | --- |
| [Apple: Explore navigation design for iOS](https://developer.apple.com/videos/play/wwdc2022/10001/) | Familiar tab, hierarchical and modal navigation reduces confusion; modality fits bounded tasks. | Keep stable top-level destinations; use a stack for deeper work and a sheet only for a short choice. Long editors need full-height pages. |
| [Android accessibility](https://developer.android.com/guide/topics/ui/accessibility/apps) | Large touch targets and sufficient text contrast improve access; Android recommends at least 48×48 dp touch targets. | Adopt the existing 48dp native control floor, scalable text, explicit labels and state announcements; never make color or gesture the sole instruction. |
| [Android Photo Picker](https://developer.android.com/training/data-storage/shared/photo-picker) | Selected-item access avoids whole-library access and can include cloud-hosted media. | Start import with explicit selection; show retrieval/per-file failure; do not equate a selected URI with a durable local copy. |

The attempted Android predictive-back documentation fetch failed; it is not counted as reviewed external evidence. System-back behavior below follows the existing project navigation requirements and must be verified on actual native builds. No new claim of OS/API compatibility is made.

### 1.4 Binding rules versus proposals

Existing requirements and selected decisions are **baseline**. Child-screen decomposition, presentation choice, specific return paths and prototype sequencing in this document are **proposed design**. An entry marked conditional stays disabled unless its production qualification passes. Final wording, numerical media limits and release-support choices remain in the decision register in §10. This document makes the proposed design concrete without declaring new business policy approved.

## 2. Mobile interaction requirements

Visual decisions belong to the fresh design hub. No existing palette, font, spacing scale, icon family, component catalog or page layout is selected for the new work.

Keep dates, participant-specific travel, rest days and unknown locations truthful. Evidence and permission are distinct meanings and cannot rely on color alone. An unknown route must not imply recorded geometry.

- Preserve accessible labels, target sizes, text scaling, safe areas, keyboard access, reduced motion and screen-reader semantics.
- Back/close/system gestures retain work or offer explicit discard; never silently lose a capture or accepted edit.
- Choose page, section, sheet and tablet composition during fresh screen planning; maintain the declared entry/exit and focus-return behavior.
- Appearance changes, if offered, retain active work and selection; their controls and visual mappings are undecided.
- Request camera, microphone, gallery or location only for the action requiring it; provide useful denial recovery.

## 3. Navigation contract

### 3.1 Destinations and identifiers

The working destination groups are **Journeys (A01)**, **Capture (A02)**, **Moments (A04)** and **You (A09)**; their placement and grouping are reopened for design. Capture opens a capture workspace; opening its destination never starts recording, asks for every permission or immediately commits content. Navigation must not silently start recording.

Each destination retains its safe local stack/filter state. The signed-in default is Journeys. A valid pending invite or safe resumable destination can override that default after session hydration and current-access resolution. Choose responsive navigation during design; preserve destination meanings.

Retain A01–A09. Dotted IDs below are child screens/overlays of those families, not replacement canonical IDs or committed route filenames. E01–E16 map to the account/access handoff. Exact Expo Router paths are implementation work; never expose tokens, file paths, emails, raw metadata or private captions in URLs.

The journey workspace offers Overview, Story, Route, Learn, Sources and People **only where authorised**. Publish and Highlights are contextual actions, not new global tabs. A participant without editorial powers must not see draft previews or another contributor's review library. Public reading uses the approved viewer path, not a relaxed draft guard.

### 3.2 Global connectivity rules

The screen registry in §5 lists task-specific forward entries and destinations. These global edges apply in addition:

| Edge | Eligible screens | Behavior |
| --- | --- | --- |
| Global destinations | A01, A02 while idle, A04 and A09 roots | Switch to any other root; restore its safe state. During capture/edit/confirmation complete the Back/close guard first. |
| Back / Cancel | Every pushed page or sheet | Return to the actual in-app caller from the registry, preserving its filters/scroll/selection. Do not always jump to a hardcoded parent. |
| No valid caller | Cold link, invalidated caller, resumed task | Use the declared family fallback: A01 for journey tasks; A04 for owner sources/imports; A09 for account tasks. Never reconstruct a forbidden parent page. |
| Authentication required | Remote protected work or first-use account entry; established-account local capture/drafts remain available during expiry/offline | A09.auth receives a typed, allowlisted return intent. On success recheck authority and return to that intent; do not replay destructive actions or automatically accept an invite. |
| Current access denied | Any protected journey/source/editor/share route | A06.unavailable clears protected content. Owner-only routes can remain accessible if their own authority still holds. |
| Operation receipt | Any restrictive action returning pending/confirmed status | A06.operation is persistent and can outlive its caller; account-deletion status also works outside auth via the separate restricted receipt. |
| Safe external link | Invite, verification/reset, permitted journey/approved share | Hydrate session, validate route/ID, resolve current authority, then show the matching screen. Unknown paths show safe unavailable. No side effects on link open. |
| App interruption | Any task | Reconcile durable local state before rendering a success claim. Restore safe task context; active camera/recording does not silently resume. Prototype reset is a separate explicit sample action. |

**Navigation context:** actor/account, caller, journey ID, source IDs, selected chapter/moment, active filters, base revision, and approved version where relevant. Only permitted IDs/view state belong in route parameters. Store content drafts/outbox state separately; validate any return destination rather than accepting arbitrary URLs. Invite intent and post-deletion receipts have their dedicated protected storage boundaries.

**Unsaved-work contract:** a persisted local draft can be left and restored; a truly unpersisted edit offers Keep editing or Discard changes. A capture save failure never offers a misleading saved/keep option. Upload cancellation retains the local original. A pending server command retains its command identity and status across navigation; retry is not a second action. Back from a destructive preview cancels the preview, not a committed restriction.

### 3.3 External boundary destinations

| ID | Destination | Input and return contract |
| --- | --- | --- |
| X.picker | OS selected-photo/video or document picker | A05 supplies media kind; A05.item may reselect one missing input. Cancellation returns to the unchanged review. Chosen handles enter local staging and review, not upload. Avatar selection under A09.profile has its own bounded flow. |
| X.settings | OS app permissions/settings | Return to the originating capture/import/profile/storage screen, refresh permission facts and preserve work. Do not launch a capture automatically. |
| X.share | Device share sheet | A08.preview supplies an eligible link/card, or A09.export a permitted finished artifact. Cancel returns unchanged. Success means handed to the OS, not posted or delivered. Prototype shows a labelled simulation. |
| X.reader | Approved Story/Explore/Learn/source/highlight web destination | Preserve journey/version and safe chapter/view where supported. No account or app-install wall for public reading. Return to the app keeps the previous private screen context. |
| X.web | Creator-web continuation | Same canonical journey and permitted task, with independent browser authentication/access checks; never transfer credentials. Prototype uses the documented prepared continuation fixture, not a claimed live cross-device sync. |
| X.support | Safe support/recovery channel | A09.help exposes only a configured channel, never an invented address. Attach only explicitly reviewed redacted diagnostics. Return restores caller. |
| X.entry | OS launch or external link | Dispatcher only, not a consumer screen. Cold/warm launch and verification/reset/invite routing obey §3.2. |

## 4. End-to-end mobile workflows

| Workflow | Connected path | What the prototype must demonstrate |
| --- | --- | --- |
| First journey | Account entry → verification → A01 → create → A06 → invite | One identity, explicit timezone, pending/confirmed creation, one canonical destination. |
| Join an existing event | Invite link/manual join → account check → invitation review → explicit accept → A06 | Joining does not share a gallery, grant editing by default or duplicate the journey. |
| Capture in poor connectivity | A06/A02 → destination → photo/video/voice/text → A03 → A04/queue | Distinct local save, private backup and source scope; location/network failure does not block a valid local save. |
| Import after returning | A04/A06 → A05 → picker → item correction → batch review → A04 → source scope | Unrelated items excluded, duplicates/unknown dates visible, no upload until approval, no forced GPS dependency. |
| Contribute and correct | Personal detail → source scope → A06.sources → A07 → focused editor/conflict | Owner grants and coauthor rights stay separate; edits affect the intended entity and retain both stale candidates. |
| Review and share | A06 → publish review → exact approved preview → approval → A08 → highlight preview/share | Draft differs from approved record; publication permission does not itself publish; shares never widen visibility. |
| Retain control | Own source/contributions → withdrawal impact → operation status → affected share unavailable | Immediate denial distinct from journal confirmation; external copies cannot be recalled. |
| Return later | A01 restored filters → A06 → A07 unchanged chapter context | Accepted corrections persist; interrupted/pending work is visible without false success. |
| Leave or delete | A06 People/More or A09 → impact → optional reauth → refreshed impact → operation status | Accepted transfer, departure, account deletion and canonical deletion have different effects. |

## 5. Screen registry and detailed behavior

Every registry entry has an actor, components, actions, critical states, data boundary, entry list and exit list. A mode (Photo/Video/Voice/Text), error state or filter is not automatically a separate route. A child screen may be a sheet on one device and a page on another without changing its ID or semantics.

Task-specific incoming/outgoing lists are generated from the same directed edge inventory during authoring and checked for consistency. They exclude the universal edges in §3.2 and X.entry dispatcher branches; those are not missing connections. Back returns to the actual caller, including cross-family callers. All permission-dependent edges disappear or explain their restriction without leaking protected data.

### 5.1 Inventory at a glance

| ID | Screen / overlay | Placement |
| --- | --- | --- |
| [A01](#screen-a01) | Your journeys | Top-level destination |
| [A01.create](#screen-a01-create) | Create journey | Child page or bounded overlay; see contract |
| [A01.join](#screen-a01-join) | Join with invitation | Child page or bounded overlay; see contract |
| [A01.notices](#screen-a01-notices) | Attention and notices | Child page or bounded overlay; see contract |
| [A02](#screen-a02) | Capture workspace | Top-level destination |
| [A02.destination](#screen-a02-destination) | Capture destination and audience | Child page or bounded overlay; see contract |
| [A03](#screen-a03) | Capture confirmation | Child page or bounded overlay; see contract |
| [A04](#screen-a04) | Personal moments | Top-level destination |
| [A04.moment](#screen-a04-moment) | Moment/source detail | Child page or bounded overlay; see contract |
| [A04.queue](#screen-a04-queue) | Sync and transfer queue | Child page or bounded overlay; see contract |
| [A04.scope](#screen-a04-scope) | Contribution and source scope | Child page or bounded overlay; see contract |
| [A04.export](#screen-a04-export) | Original-file permission | Child page or bounded overlay; see contract |
| [A05](#screen-a05) | Selected import and batch review | Child page or bounded overlay; see contract |
| [A05.item](#screen-a05-item) | Import item inspection/correction | Child page or bounded overlay; see contract |
| [A06](#screen-a06) | Journey overview | Child page or bounded overlay; see contract |
| [A06.details](#screen-a06-details) | Journey details | Child page or bounded overlay; see contract |
| [A06.people](#screen-a06-people) | People and powers | Child page or bounded overlay; see contract |
| [A06.invite](#screen-a06-invite) | Invite companion | Child page or bounded overlay; see contract |
| [A06.powers](#screen-a06-powers) | Edit member powers | Child page or bounded overlay; see contract |
| [A06.transfer](#screen-a06-transfer) | Transfer administration | Child page or bounded overlay; see contract |
| [A06.sources](#screen-a06-sources) | Journey source review | Child page or bounded overlay; see contract |
| [A06.publish](#screen-a06-publish) | Review publication | Child page or bounded overlay; see contract |
| [A06.preview](#screen-a06-preview) | Exact viewer preview | Child page or bounded overlay; see contract |
| [A06.lifecycle](#screen-a06-lifecycle) | Impact review for a named action | Child page or bounded overlay; see contract |
| [A06.operation](#screen-a06-operation) | Restriction/deletion operation status | Child page or bounded overlay; see contract |
| [A06.unavailable](#screen-a06-unavailable) | Unavailable destination | Child page or bounded overlay; see contract |
| [A07](#screen-a07) | Focused editing workspace | Child page or bounded overlay; see contract |
| [A07.chapter](#screen-a07-chapter) | Chapter, narrative or placement editor | Child page or bounded overlay; see contract |
| [A07.route](#screen-a07-route) | Stage and route-evidence editor | Child page or bounded overlay; see contract |
| [A07.knowledge](#screen-a07-knowledge) | Practical detail editor | Child page or bounded overlay; see contract |
| [A07.conflict](#screen-a07-conflict) | Resolve a stale edit | Child page or bounded overlay; see contract |
| [A07.revisions](#screen-a07-revisions) | Revision history and restore | Child page or bounded overlay; see contract |
| [A08](#screen-a08) | Choose personal highlights | Child page or bounded overlay; see contract |
| [A08.preview](#screen-a08-preview) | Highlight preview and share | Child page or bounded overlay; see contract |
| [A09](#screen-a09) | You and account | Top-level destination |
| [A09.auth](#screen-a09-auth) | Sign in / create account | Child page or bounded overlay; see contract |
| [A09.verify](#screen-a09-verify) | Verify email | Child page or bounded overlay; see contract |
| [A09.recover](#screen-a09-recover) | Recover account / reset password | Child page or bounded overlay; see contract |
| [A09.reauth](#screen-a09-reauth) | Confirm your identity | Child page or bounded overlay; see contract |
| [A09.profile](#screen-a09-profile) | Private profile and optional public selection | Child page or bounded overlay; see contract |
| [A09.security](#screen-a09-security) | Sessions and security | Child page or bounded overlay; see contract |
| [A09.research](#screen-a09-research) | Saved research | Child page or bounded overlay; see contract |
| [A09.contributions](#screen-a09-contributions) | Your contributions | Child page or bounded overlay; see contract |
| [A09.storage](#screen-a09-storage) | Storage and sync preferences | Child page or bounded overlay; see contract |
| [A09.appearance](#screen-a09-appearance) | Appearance and accessibility preferences | Child page or bounded overlay; see contract |
| [A09.export](#screen-a09-export) | Export your permitted data | Child page or bounded overlay; see contract |
| [A09.help](#screen-a09-help) | Help, privacy and supported limits | Child page or bounded overlay; see contract |
| [A09.delete](#screen-a09-delete) | Delete account | Child page or bounded overlay; see contract |

### 5.2 Detailed screen contracts

<a id="screen-a01"></a>
#### A01 — Your journeys

**User and authority:** Signed-in account; offline owner of previously available local state.

**Arrive from:** `A01.join` — Decline; `A06.operation` — Safe history exit; `A06.unavailable` — Safe history; `A09.auth` — Success without return intent; global entry under §3.2.

**Navigate to:** `A01.create` — Create journey; `A01.join` — Join with invite / pending invitation; `A01.notices` — Attention; `A06` — Open permitted journey.

**Back / close:** Switch global destinations with safe stack state; system Back follows the platform root behavior. Guard active capture before leaving.

**Components and elements:** Top title; Create journey; Join with invite; attention entry; role/status/year/category filters; unique journey rows with intended dates, safe cover and own powers; explicit no-cover and empty states.

**Functions and feedback:** Open an accessible journey, create or resolve an invitation, inspect a notice, clear filters, refresh. Preserve filter/scroll context on return. Saved research is a separate destination under You.

**Required states and recovery:** Initial loading is not empty history. Distinguish first-use empty, filtered-empty, refresh failure, offline/stale and former membership. A former reference has neutral unavailable copy, not protected title/cover/location. Filters requiring hidden fields explain exclusions.

**Data and implementation boundary:** One membership reference per account/journey. Server-authorized history plus safe local presentation; dates do not automatically mean completed. No invented participant totals.

**Traceability:** TRP-01–04, TRP-06; PRO-02–04; E05.

<a id="screen-a01-create"></a>
#### A01.create — Create journey

**User and authority:** Verified account creating a canonical event.

**Arrive from:** `A01` — Create journey; `A09.research` — New distinct journey with reference.

**Navigate to:** `A06` — Confirmed creation.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Short full-page form: title, intended start date/time, optional end, visible timezone suggestion, optional category; field errors; Create journey and Cancel.

**Functions and feedback:** Validate then submit once. Success opens the confirmed journey and offers invitation. Timeout retains the same operation ID for retry. Back retains a local form draft or asks before discarding genuinely unsaved values.

**Required states and recovery:** Title 1–160 Unicode code points; end not before start; unsupported zone, DST gap/ambiguity and server error handled inline. Offline form can be retained but not presented as confirmed canonical creation. Category starts unset.

**Data and implementation boundary:** Title/timezone/instant/offset rules from selected D04/D06. Categories: hike/trek, cycling, road journey, other. Canonical ID and operation identity survive retry; no booking/itinerary fields.

**Traceability:** TRP-01–02; E06.

<a id="screen-a01-join"></a>
#### A01.join — Join with invitation

**User and authority:** Invited recipient; signed-out/wrong-account states resolve before private details.

**Arrive from:** `A01` — Join with invite / pending invitation; `A01.notices` — Resolve invitation; validated cold/warm link or resumed intent under §3.2.

**Navigate to:** `A06` — Explicit acceptance / current membership; `A09.auth` — Authenticate invited account; `A01` — Decline.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Manual invite-code entry or safe link resolver; valid-recipient journey/inviter/dates/powers; privacy explanation; Accept invitation, Decline, Switch account and request-fresh-link guidance.

**Functions and feedback:** Resolve without side effects. Authenticate/verify if needed and return here. Accept explicitly, creating one current membership; success opens the same journey. Decline returns to history. Never join from link GET or verification callback.

**Required states and recovery:** Invalid, expired, revoked, consumed, wrong recipient, already accepted, offline and unavailable. A previously accepted link cannot restore removed membership. Do not reveal invited email or protected journey facts before authorized resolution.

**Data and implementation boundary:** Protected bounded invite intent, not ordinary Query keys/logs/routes. Seven-day expiry; server-time validation. Rejoining never restores old powers/export grants automatically.

**Traceability:** TRP-02–04; COL-01, COL-06; E07.

<a id="screen-a01-notices"></a>
#### A01.notices — Attention and notices

**User and authority:** Account viewing only permitted operational notices.

**Arrive from:** `A01` — Attention.

**Navigate to:** `A01.join` — Resolve invitation; `A06.transfer` — Transfer offer; `A07.conflict` — Resolve edit; `A06.operation` — Restriction status; `A06` — Permitted journey change.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Grouped actionable rows for invites, capability changes, transfer, conflict, withdrawal, publication and operation status; timestamp; permitted actor label; read/unread state where supported.

**Functions and feedback:** Open the exact relevant task; keep notice position on return. Mark acknowledgement separately from completing the underlying action. An invalid target offers safe history/account navigation.

**Required states and recovery:** No notices, failed refresh, offline, expired invite, revoked target. No social activity feed, invented unread counts or protected snippets retained after denial.

**Data and implementation boundary:** Persisted scoped domain notices; preview fields receive current access checks. Notifications/push delivery are not introduced by this screen.

**Traceability:** COL-07, COL-09–10; E16.

<a id="screen-a02"></a>
#### A02 — Capture workspace

**User and authority:** Established account/source owner; local capture remains available during network/session expiry under the account-isolation contract.

**Arrive from:** `A03` — Capture another; `A04` — Capture; `A06` — Capture to visible context; global entry under §3.2.

**Navigate to:** `A02.destination` — Choose destination/audience; `A03` — Local-save result; `A05` — Import instead; `X.settings` — Permission settings.

**Back / close:** Switch global destinations with safe stack state; system Back follows the platform root behavior. Guard active capture before leaving.

**Components and elements:** Visible destination/audience strip; Photo, Video, Voice and Text/remembered-event modes; preview/recording area; separate start/stop/save controls; configured remaining limit; optional foreground-location evidence; import shortcut.

**Functions and feedback:** Choose mode and destination before capture. Request only needed camera/microphone permission on action. Stop/play voice or video, write text with optional event time, attempt save and open the appropriate A03 result. Only its successful state follows verified local commit; failure never shows a saved claim. Capture another returns here.

**Required states and recovery:** Denied camera → import/text; denied microphone → text/photo; missing/stale/approximate location → truthful label without blocking save. Low storage, interrupted recording, unsupported output and cancellation preserve existing captures. Leaving an active recording requires explicit stop/discard; never silently resume recording.

**Data and implementation boundary:** No background route recorder. Files/SQLite own durability; event time differs from entry/capture time. Journey-review opt-in is explicit and scoped. Numeric duration/size limits come from qualified configuration.

**Traceability:** CAP-01–08; SYN-01, SYN-06; COL-01, COL-03.

<a id="screen-a02-destination"></a>
#### A02.destination — Capture destination and audience

**User and authority:** Source owner choosing a destination, not an administrator assigning ownership.

**Arrive from:** `A02` — Choose destination/audience.

**Navigate to:** No separate forward destination; complete/cancel returns to caller.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Personal option; accessible journey list with lifecycle eligibility; Only me / Journey review choice; current named review audience; optional clearly scoped future-in-app-capture preference.

**Functions and feedback:** Confirm destination and return to capture without saving or uploading anything. Existing explicit preference remains visible on every capture; changing it does not retroactively share old moments. Publication reuse is a later explicit owner action.

**Required states and recovery:** No journeys, offline/cached membership, archived/frozen/revoked destination. Default ambiguous context to personal/Only me. A stale journey destination can retain a personal capture but cannot silently contribute it.

**Data and implementation boundary:** Separate destination, source grant and transfer preference. Review audience is coauthors/publishers, not every participant. Revalidate current access on contribution.

**Traceability:** CAP-01; COL-01–03, COL-06.

<a id="screen-a03"></a>
#### A03 — Capture confirmation

**User and authority:** Owner of a just-saved or failed local capture.

**Arrive from:** `A02` — Local-save result.

**Navigate to:** `A02` — Capture another; `A04.moment` — View/edit saved moment; `A04.queue` — Inspect transfer; `A04.scope` — Change source scope.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Media/text preview; Saved on this device only if true; capture/event time and location evidence; destination and source scope; separate transfer state; View moment, Capture another and queue entry.

**Functions and feedback:** Inspect/edit own metadata through moment detail, change audience explicitly, open queue or return to capture. Leave without losing the confirmed local original. A failed save offers retry or explicit discard, not a success-style dismissal.

**Required states and recovery:** Saving, interrupted/staged, saved, failed/no space, unknown location, queued/offline and verified-private-cloud. Never conflate local save with backup or contribution. No automatic publication.

**Data and implementation boundary:** Acknowledgement depends on verified persistent bytes plus committed SQLite references/outbox; startup repair resolves interrupted boundaries. Confirmation is not itself an extra original or journey.

**Traceability:** CAP-04–07; SYN-01–04.

<a id="screen-a04"></a>
#### A04 — Personal moments

**User and authority:** Source owner; own library is distinct from journey review sources.

**Arrive from:** `A05` — Approved import result; global entry under §3.2.

**Navigate to:** `A02` — Capture; `A05` — Import; `A04.moment` — Open item; `A04.queue` — Sync queue; `A04.scope` — Contribute selection.

**Back / close:** Switch global destinations with safe stack state; system Back follows the platform root behavior. Guard active capture before leaving.

**Components and elements:** Date-grouped media/text list, unknown-date group, type/journey/scope/transfer filters, selected count, Import and Capture actions, queue summary, multi-select toolbar and clear selection.

**Functions and feedback:** Open a moment, select a batch for contribution or import, inspect queued work. Batch actions show affected count and compatible scope; mixed permission/processing items are explained individually. Return restores scroll/selection if still valid.

**Required states and recovery:** Empty library, filtered-empty, loading, offline, missing local bytes, processing failure and withdrawn contribution. New membership never populates the library with others’ private originals. Avoid accidental selection changes while scrolling.

**Data and implementation boundary:** App-owned local manifest plus authorized private-cloud records. Identity stays stable through transfer/deduplication. A review source accessed through A06.sources is not added as an owned capture.

**Traceability:** CAP-01–04; SYN-03–06; IMP-01–06; COL-01–04.

<a id="screen-a04-moment"></a>
#### A04.moment — Moment/source detail

**User and authority:** Owner sees own fields/actions; active coauthor/publisher sees only contributed review projection allowed by grants.

**Arrive from:** `A03` — View/edit saved moment; `A04` — Open item; `A04.queue` — Resolve item; `A06.sources` — Permitted source detail; `A06.publish` — Inspect permitted blocker/source; `A07.chapter` — Inspect source; `A07.route` — Inspect recording/source; `A07.knowledge` — Inspect supporting source; `A09.contributions` — Own source.

**Navigate to:** `A04.scope` — Owner changes scope; `A04.queue` — Inspect/retry transfer; `A04.export` — Original-file approval/request; `A06.lifecycle` — Owner withdrawal/delete; `A07.chapter` — Authorized draft placement/caption; `A09.export` — Export owned/permitted data.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Media/player or text; contributor and photographer credit; original/corrected time and evidence; destination/grants; local/transfer/processing/inclusion facts; source-linked reviewed transcript when available; contextual actions.

**Functions and feedback:** Owner corrects own metadata/caption without replacing original bytes, changes grant, queues/retries upload, requests permitted export or opens withdrawal/delete impact. Authorized coauthor opens focused placement/caption edit in the shared draft. Transcript correction retains provenance and actual offsets; reading does not start playback.

**Required states and recovery:** Missing file offers reselection; processing/transcription failure retains source playback if available; review-only source explains publication exclusion. Read-only inspection has no owner actions. Revocation clears protected content; no original download from review permission alone.

**Data and implementation boundary:** Original observation and correction are separate. Owner metadata edits and shared editorial edits are different operations. No raw private object URL, fabricated time/coordinate or cross-owner dedup disclosure.

**Traceability:** IMP-03, IMP-06; COL-02, COL-04, COL-07; REC-01–08; ASK-02; OWN-02–03.

<a id="screen-a04-queue"></a>
#### A04.queue — Sync and transfer queue

**User and authority:** Current account managing its own pending files and commands.

**Arrive from:** `A03` — Inspect transfer; `A04` — Sync queue; `A04.moment` — Inspect/retry transfer; `A05` — Approved transfer status; `A09.storage` — Resolve queue.

**Navigate to:** `A04.moment` — Resolve item; `A09.auth` — Expired sign-in; `A07.conflict` — Pending-edit conflict; `A09.storage` — Transfer preferences.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Per-item local/transfer state, verified progress where known, waiting reason, safe failure text, retry/pause/cancel, Wi-Fi preference, affected-item link and account-recovery action.

**Functions and feedback:** Retry/resume the same operation; pause/cancel transfer without deleting original; reselect missing source through its detail; reconnect/authenticate same account; expose conflict candidates for pending edits. Foreground retry is always visible when usable.

**Required states and recovery:** Waiting for Wi-Fi/quota, expired sign-in, revoked contribution, checksum failure, incomplete finalization, missing bytes and offline. Do not promise immediate background completion after force-stop. No invented ETA or verified-cloud status before finalization.

**Data and implementation boundary:** Durable SQLite outbox/upload acknowledgement state, idempotent server receipts and checksum verification. Account switch isolates pending data; unsent work is not automatically reassigned.

**Traceability:** SYN-01–06; CAP-06–07.

<a id="screen-a04-scope"></a>
#### A04.scope — Contribution and source scope

**User and authority:** Owner of selected sources; active journey authority checked before expansion.

**Arrive from:** `A03` — Change source scope; `A04` — Contribute selection; `A04.moment` — Owner changes scope; `A05` — Choose batch scope for staged selection; `A06.sources` — Contribute own selection.

**Navigate to:** `A06.lifecycle` — Narrow/withdraw with impact; `A04.export` — Separate original export permission.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Selected items/count; destination; three fully labelled scopes; named review audience; existing inclusion/derived-use impact; separate original-export explanation; Confirm scope and Cancel.

**Functions and feedback:** Grant review or publication reuse explicitly for existing verified sources. When entered from A05 with staged candidates, this view only records the proposed batch audience and returns to import review; it neither uploads nor activates a server grant before final import approval. Explain that eligibility is not publication. Batch confirmation uses current source/grant versions. Narrowing/withdrawal opens a current impact review and persistent restriction status; no hidden ownership transfer.

**Required states and recovery:** Mixed selection, ineligible/Only-me items, source already withdrawn, archive/freeze, changed audience or revision, offline request. Expansion must not bypass current checks; a queued restriction is not yet server denial.

**Data and implementation boundary:** Owner/source/journey grant identity independent of membership capability. Current coauthors/publishers can change with future assignments; ordinary join does not expand review access. Original export remains separate.

**Traceability:** COL-01–03, COL-06–07; PUB-02; OWN-03.

<a id="screen-a04-export"></a>
#### A04.export — Original-file permission

**User and authority:** Owner approving/revoking exact originals, or active member requesting only eligible contributed assets.

**Arrive from:** `A04.moment` — Original-file approval/request; `A04.scope` — Separate original export permission; `A09.contributions` — Review original-export request; `A09.export` — Request exact-original permission.

**Navigate to:** `A09.export` — Generate permitted output; `A06.lifecycle` — Revoke grant; `A09.reauth` — Fresh identity before original-export approval.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Named recipient, exact asset list/count, journey, expiry, permission explanation, raw-metadata warning; request state; Approve/Decline or Request approval; revoke entry.

**Functions and feedback:** Recipient sends a request for specific contributed originals. Owner approves exact assets and bounded expiry or declines. Current recipient then opens permitted export workflow. Revocation opens impact/status; approval never starts a public share.

**Required states and recovery:** Only-me ineligible, recipient departed, source scope narrowed, expired/revoked grant, changed revision and request pending. Default 24h; shorter or up to 7 days. No indefinite or future-files permission.

**Data and implementation boundary:** Owner-issued export grant binds recipient, journey, exact assets, source revisions and expiry. Check generation and every managed download; prior downloaded originals cannot be recalled.

**Traceability:** COL-02, COL-06; OWN-02; requirements §2.6.

<a id="screen-a05"></a>
#### A05 — Selected import and batch review

**User and authority:** Owner selecting media/audio/recordings; journey destination optional.

**Arrive from:** `A02` — Import instead; `A04` — Import; `A06` — Import own material; `A06.sources` — Import own sources.

**Navigate to:** `X.picker` — Select/add files; `A05.item` — Inspect/correct candidate; `A04` — Approved import result; `A04.queue` — Approved transfer status; `A04.scope` — Choose batch scope for staged selection; `X.settings` — Resolve permitted access.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Choose photos/videos or audio/GPX/FIT; sample/OS selection boundary; date-grouped candidates, unknown dates, include/exclude, add more, destination/scope, duplicate/error badges, per-file status and final approval summary.

**Functions and feedback:** Inspect only selected accessible items; suggest date membership without locking out out-of-range files. Correct items, choose scope, then explicitly approve local import/queued private backup or contribution. One failed item does not discard the rest. Cancel cleans only uncommitted staging after reconciliation.

**Required states and recovery:** Picker cancel, limited access, cloud download pending/failure, unsupported HEIC/codec/route, duplicates, stripped metadata, batch/storage limits. No wider-gallery scan unless separately qualified and requested. No upload of unapproved candidates.

**Data and implementation boundary:** Persistent copies and local records before saved claim. Baseline JPEG/PNG/WebP, qualified camera/MP4, M4A/MP3/WAV, GPX/FIT. Exact limits/conversion require evidence; original files remain unchanged.

**Traceability:** IMP-01–09; SYN-01, SYN-06; COL-01–03.

<a id="screen-a05-item"></a>
#### A05.item — Import item inspection/correction

**User and authority:** Owner reviewing one uncommitted candidate.

**Arrive from:** `A05` — Inspect/correct candidate.

**Navigate to:** `X.picker` — Reselect missing input.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Preview/file kind; original capture-time/timezone evidence; correction fields with unknown option; include toggle; duplicate explanation; destination; route segment/gap summary or parser rejection; previous/next candidate.

**Functions and feedback:** Include/exclude, correct ambiguous date/offset, keep unknown, retry retrieval or reselect, confirm and return to the same batch position. Geometry-only tracks stay valid when timestamps are absent. Editing review metadata never rewrites the original.

**Required states and recovery:** Cloud-only/missing handle, unreadable file, planned-route-only input, FIT without usable recording, incompatible date and duplicates. Current phone location is never assigned to historical media; no fabricated samples or connected gaps.

**Data and implementation boundary:** Staged candidate metadata and correction provenance; bounded parsers in production. No external AI or map call is necessary to review sample candidates.

**Traceability:** IMP-03–08; REC-03, REC-05; GEO-02–03.

<a id="screen-a06"></a>
#### A06 — Journey overview

**User and authority:** Active member with a capability-specific projection; approved reading follows its own visibility.

**Arrive from:** `A01` — Open permitted journey; `A01.create` — Confirmed creation; `A01.join` — Explicit acceptance / current membership; `A01.notices` — Permitted journey change; `A06.publish` — Successful approval result; validated cold/warm link or resumed intent under §3.2.

**Navigate to:** `A06.details` — Correct event metadata; `A06.people` — People / own powers; `A06.sources` — Permitted source review; `A07` — Story/Route/Learn workspace; `A02` — Capture to visible context; `A05` — Import own material; `A08` — Share approved highlights; `A06.publish` — Publication review; `A06.lifecycle` — Named lifecycle action; `X.reader` — Read approved journey; `A09.contributions` — Manage own contributions; `A09.export` — Permitted journey export.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Canonical title/intended dates/status; own powers; allowed stages/recent changes; personal contribution summary; permitted workspace entries; capture/import; Highlights/Publish and More only when authorized.

**Functions and feedback:** Continue the next real task: add own material, edit permitted draft, inspect source pool, manage People, preview approval or open approved reader. Preserve journey/stage context across tools. Return to history restores its filters.

**Required states and recovery:** No sources/stages, no cover, pending upload, draft differs from approval, archive/freeze, partial network failure and access revoked. Ordinary participant/admin-only sees no protected draft, review thumbnails or another owner’s counts.

**Data and implementation boundary:** Canonical journey and distinct draft/publication states. Source-backed attention only, not invented completion percentages. Role facts do not grant source ownership.

**Traceability:** TRP-02, TRP-05–06; COL-06; STO-01–07; E08.

<a id="screen-a06-details"></a>
#### A06.details — Journey details

**User and authority:** Active administrator or coauthor while collaboration remains open.

**Arrive from:** `A06` — Correct event metadata.

**Navigate to:** No separate forward destination; complete/cancel returns to caller.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Title, intended start/end/timezone, optional category, base revision, correction explanation, Save and Cancel.

**Functions and feedback:** Correct event metadata without replacing journey identity or deleting sources. Save with expected revision. Back respects unsaved work. If dates change, source membership suggestions can be reviewed later, not silently reassigned.

**Required states and recovery:** Invalid/ambiguous times, stale revision, archived editing or action-specific freeze restrictions, permission loss and offline pending. A stale metadata edit preserves the proposed values and shows current versus proposed inline before a new save; an admin-only actor is not sent into shared-draft conflict history. Publisher-only without admin/coauthor cannot edit these fields.

**Data and implementation boundary:** Selected metadata permission exception is narrower than draft access. Retain original local/offset context and current command/revision.

**Traceability:** TRP-01–02; E08; D03–04, D06.

<a id="screen-a06-people"></a>
#### A06.people — People and powers

**User and authority:** Administrator gets scoped management; others see their own powers and administrator identity plus separately permitted attribution/audience.

**Arrive from:** `A06` — People / own powers.

**Navigate to:** `A06.invite` — Invite companion; `A06.powers` — Manage member powers; `A06.transfer` — Offer/inspect transfer; `A06.lifecycle` — Leave/remove/archive.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** One administrator fact; independently named coauthor/publisher powers; authorized member/invite rows; invitation status; Transfer administration; own leave entry.

**Functions and feedback:** Administrator invites, edits powers, manages valid pending offers, removes members or offers transfer. Non-admin sees no general roster/email directory. Own membership opens impact for leave; changes remain pending until authoritative result.

**Required states and recovery:** Empty invitations, expired/delivery-failed invite, stale management state, archive/freeze, removed membership. Admin-only cannot use People as an entry to review sources or draft.

**Data and implementation boundary:** Exactly one administrator; coauthor and publisher separate. Emails only for authorized invite administration. Capability expansion explains changed review audience.

**Traceability:** TRP-03–04; COL-06, COL-10; E09.

<a id="screen-a06-invite"></a>
#### A06.invite — Invite companion

**User and authority:** Current administrator with invitation authority.

**Arrive from:** `A06.people` — Invite companion.

**Navigate to:** No separate forward destination; complete/cancel returns to caller.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Recipient email; ordinary-participant default; independent optional coauthor/publisher toggles; audience consequence; Send invitation; pending/delivery facts; resend/new-offer distinction.

**Functions and feedback:** Send an explicit offer. Resend only a still-valid unchanged offer, preserving expiry. Expired/revoked offers require a newly authorized offer. Cancel preserves no sent action; pending send retains operation identity.

**Required states and recovery:** Invalid email, rate limit, mail queued/failed, stale role state, archived/frozen journey. SMTP acceptance is not recipient receipt. No administrator checkbox or imported contact list requirement.

**Data and implementation boundary:** Seven-day invitation and exact recipient scope under current server authority. No gallery access, account enumeration or bearer tokens in logs.

**Traceability:** TRP-03; COL-06; E09; D04.

<a id="screen-a06-powers"></a>
#### A06.powers — Edit member powers

**User and authority:** Current administrator managing an eligible active member.

**Arrive from:** `A06.people` — Manage member powers.

**Navigate to:** `A06.lifecycle` — Remove member; `A09.reauth` — Fresh identity before capability change.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Member display identity, current powers, independent Edit shared story and Approve publication controls, review-audience impact, Save changes; separate Remove member action.

**Functions and feedback:** Save current-revision powers; resolve stale state without dropping proposed selection. Removal routes to impact/status. Administration transfer uses its own flow and cannot be toggled here.

**Required states and recovery:** Member departed, stale revision, restricted expansion, last-administrator guard. Coauthor/publisher removal immediately loses corresponding protected access after server denial; old offline copies are not remotely erased.

**Data and implementation boundary:** Explicit capability command, never a bundled role preset that adds source/export rights. Adding an ordinary participant has no review-audience effect.

**Traceability:** COL-06–07, COL-10; E09.

<a id="screen-a06-transfer"></a>
#### A06.transfer — Transfer administration

**User and authority:** Current administrator offering; eligible existing active coauthor accepting/rejecting.

**Arrive from:** `A01.notices` — Transfer offer; `A06.people` — Offer/inspect transfer; `A06.lifecycle` — Arrange accepted transfer; `A09.delete` — Transfer before deletion.

**Navigate to:** `A06.lifecycle` — No-successor departure impact; `A09.reauth` — Fresh identity before transfer acceptance.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Current administrator; eligible successor selector or received-offer view; consequence summary; expiry; Offer transfer / Accept / Decline / Cancel offer.

**Functions and feedback:** Offer then wait for explicit acceptance. Acceptance atomically replaces administrator without changing either person’s coauthor/publisher powers. Return shows accepted or pending state. No-successor choice routes to lifecycle explanation.

**Required states and recovery:** No eligible successor, 72h expiry, stale state, successor left, offer revoked, offline. Archive can permit a fresh transfer to an existing eligible coauthor under selected policy, not a new invitation.

**Data and implementation boundary:** One active administrator; at most one current offer. Transfer is not source ownership transfer or automatic grant of editorial rights.

**Traceability:** COL-10; E12; D03–04, D10.

<a id="screen-a06-sources"></a>
#### A06.sources — Journey source review

**User and authority:** Active coauthor/publisher under grants; owner accesses own items through personal/contribution paths.

**Arrive from:** `A06` — Permitted source review; `A07` — Review sources.

**Navigate to:** `A04.moment` — Permitted source detail; `A05` — Import own sources; `A04.scope` — Contribute own selection; `A07` — Place in draft.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Contributed review list; owner/credit; source scope and publication eligibility; processing state; date/type filters; add-own-source action; reason for blocked inclusion.

**Functions and feedback:** Inspect permitted review detail; coauthor places eligible sources through editor. Publisher inspects without edit. Source owner can open grant/export controls on their own item. Add-own-source returns through explicit import/contribution, not silent library exposure.

**Required states and recovery:** No contributions, review-only exclusion, failed transcript/derivative, source withdrawal, permission loss and filtered-empty. No personal-library browse or original-download button based on coauthor status.

**Data and implementation boundary:** Current-grant review projection; raw originals and private metadata remain governed separately. Source references stay attributed.

**Traceability:** COL-01–04, COL-06–07; IMP-03; PUB-02.

<a id="screen-a06-publish"></a>
#### A06.publish — Review publication

**User and authority:** Active designated publisher; coauthor may inspect allowed preview but cannot approve without publisher authority.

**Arrive from:** `A06` — Publication review.

**Navigate to:** `A06.preview` — Preview exact candidate; `A04.moment` — Inspect permitted blocker/source; `A06` — Successful approval result; `A06.lifecycle` — Unpublish/narrow/manage unlisted link; `X.web` — Dense review/correction continuation.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Exact draft/version; rights/privacy blockers; source inclusion/exclusion list; sensitive-location/metadata/contact review with before/after safe projection; permitted redaction choices and source-owner correction guidance; uncertain-evidence review; excluded-source reasons; visibility choice and separate catalog-listing choice; current unlisted-link status and Manage link; preview action; Publish/Republish or restrict/unpublish.

**Functions and feedback:** Review the actual safe projection, inspect source issues, request owner fixes rather than granting on their behalf. Activate only the reviewed generation. Draft/rights change requires refreshed preview. Dense corrections can continue in creator web; narrowing/unpublish and selected unlisted-link revocation open impact; explicit replacement returns a newly authorized link without reviving the old one.

**Required states and recovery:** No ready sources, review-only source, sensitive place/contact, unknown evidence, stale generation, job failure, archive/freeze and unauthorized actor. Honest unknowns may remain; privacy/rights blockers cannot be dismissed as cosmetic.

**Data and implementation boundary:** Server-approved manifest and current policy. Unlisted is a forwardable link; public does not automatically mean catalog-listed. Pending processing leaves old approved version intact.

**Traceability:** PUB-01–08; STO-06–07; COL-06; W08 handoff.

<a id="screen-a06-preview"></a>
#### A06.preview — Exact viewer preview

**User and authority:** Publisher/coauthor inspecting the permitted publication candidate.

**Arrive from:** `A06.publish` — Preview exact candidate.

**Navigate to:** `X.reader` — Open already approved public version only.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Preview label and exact generation; Story/Explore/Learn selectors; chapter/stage context; source detail; safe media/evidence; explicit map/list choice and Map/Satellite control when the real adapter is available; audience and excluded-content explanation; Return to review.

**Functions and feedback:** Inspect candidate using the same safe viewer representation as delivery. Retain chapter when switching views; Map/Satellite switching preserves selected stage, overlays and camera context with required attribution. Inspect cited source and return. Preview never activates publication. Public reader handoff is only for an already accessible approved version. Prototype map styles are labelled schematic states rather than real imagery.

**Required states and recovery:** Empty candidate, inaccessible source, missing media, map failure, no GPS, candidate invalidated by rights/draft change. No private library payload hidden behind viewer controls.

**Data and implementation boundary:** Candidate safe projection; current authorization even for preview. Map initializes on request. Prototype uses schematic/map-free fixture, not licensed live geography.

**Traceability:** PUB-01–04; VWR-01–08; W08/P02–P05 handoff.

<a id="screen-a06-lifecycle"></a>
#### A06.lifecycle — Impact review for a named action

**User and authority:** Source owner, administrator, publisher or self-member according to the action; never one universal destructive permission.

**Arrive from:** `A04.moment` — Owner withdrawal/delete; `A04.scope` — Narrow/withdraw with impact; `A04.export` — Revoke grant; `A06` — Named lifecycle action; `A06.people` — Leave/remove/archive; `A06.powers` — Remove member; `A06.transfer` — No-successor departure impact; `A06.publish` — Unpublish/narrow/manage unlisted link; `A09.contributions` — Owner restriction; `A08.preview` — Revoke owned hosted highlight.

**Navigate to:** `A06.transfer` — Arrange accepted transfer; `A09.reauth` — Fresh identity if required; `A06.operation` — Committed/pending restriction result.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Named action/resource; affected journeys/sources/shares; what remains; current impact expiry; separate confirmations; optional fresh-session step; Confirm named action and Cancel.

**Functions and feedback:** Dedicated variants: withdraw/narrow own source, delete own media, revoke original export, leave, remove member, archive, unpublish/narrow visibility, revoke/replace a canonical unlisted link, revoke an owned hosted highlight, canonical-delete. Select the existing link/share and inspect its current state before impact. Canonical link management requires publisher authority; a personal share owner controls only their hosted share. Replacement is a separate explicit action; external downloaded copies remain outside recall. Refresh impact after reauth or state change. Canonical-delete requires named-resource confirmation and a second typed-title confirmation. Transfer entry is offered when relevant.

**Required states and recovery:** Offline intent is waiting to send, not server denial. Stale/expired impact, unauthorized action, no successor/freeze and already-restricted result are explicit. Archive is not deletion/unpublish; leave does not withdraw grants automatically.

**Data and implementation boundary:** Five-minute version-bound impact plus current actor/action authority. Preserve others’ originals; account deletion is a separate A09.delete flow. Committed restriction opens persistent result.

**Traceability:** COL-07, COL-10; TRP-05; PUB-03–08; OWN-02–03; E12.

<a id="screen-a06-operation"></a>
#### A06.operation — Restriction/deletion operation status

**User and authority:** Authorized account or narrowly scoped post-deletion receipt; receipt permits minimal read-only status.

**Arrive from:** `A01.notices` — Restriction status; `A06.lifecycle` — Committed/pending restriction result; `A09.delete` — Minimal status after logout; validated cold/warm link or resumed intent under §3.2.

**Navigate to:** `A01` — Safe history exit; `A09.help` — Support/status help.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Named safe operation if permitted; request/deny/recovery-confirmation/cleanup facts; last checked status; Check status; authorized Retry confirmation only where allowed; safe exit/support.

**Functions and feedback:** Keep status accessible after caller disappears. Refresh without reissuing the destructive action. Active authorized actor can retry the same event; post-deletion receipt only checks status while coordinator retries. Route to safe remaining content or support.

**Required states and recovery:** Waiting to send, access denied with journal confirmation pending, confirmed, cleanup pending, delayed/error, expired receipt. Never show successful journal persistence based on a timer or erase uncertainty with a toast.

**Data and implementation boundary:** Independent receipt/status boundary; deletion receipt outside account cache in protected storage. No protected identity/title in logged-out status and no receipt that grants general account access.

**Traceability:** COL-07; OWN-03; requirements §§16–17; E14.

<a id="screen-a06-unavailable"></a>
#### A06.unavailable — Unavailable destination

**User and authority:** Any user encountering denied, revoked, malformed or nonexistent protected target.

**Arrive from:** global entry under §3.2.

**Navigate to:** `A01` — Safe history; `A09.auth` — Sign in where useful; `A09.contributions` — Owner-only route.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Generic unavailable heading, short neutral explanation, safe history/account return; sign-in only if it can help; support. No cover, title, dates, coordinates or roster.

**Functions and feedback:** Return to a valid root; authenticate without revealing whether a private resource exists; open owner-only contributions separately if available. Clear invalid cached screen content and unsafe back-stack entries.

**Required states and recovery:** Deep-link denial, former membership, withdrawn media, deleted journey, token expiry and takedown. Public access follows ordinary public rules, not former-member role inference.

**Data and implementation boundary:** Safe error projection, no resource-existence oracle. Network failure with no denial remains an error/retry state rather than falsely declaring deletion.

**Traceability:** PUB-03–08; PRO-02; OWN-03; E15.

<a id="screen-a07"></a>
#### A07 — Focused editing workspace

**User and authority:** Active coauthor edits; publisher can inspect permitted draft in read-only mode.

**Arrive from:** `A06` — Story/Route/Learn workspace; `A06.sources` — Place in draft.

**Navigate to:** `A07.chapter` — Chapter/narrative/placement; `A07.route` — Route or stage; `A07.knowledge` — Practical detail; `A07.conflict` — Pending conflict; `A07.revisions` — Revision history; `A06.sources` — Review sources; `X.web` — Dense composition continuation.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Selected journey/chapter; Story/Route/Learn workspace selector; chapter/leg/detail list; source entry; draft saved/pending state; change attribution; focused edit and revision/conflict entries; web continuation.

**Functions and feedback:** Select one entity, reorder using explicit accessible controls, add a sourced moment/detail, open focused editor or compare revisions. Keep chapter selection on return. No forced map or full desktop canvas on a phone.

**Required states and recovery:** No stages, unknown/rest-day stage, offline pending edits, read-only publisher, archived/frozen, source withdrawal and access loss. No edit rights inferred from participant/admin status.

**Data and implementation boundary:** Expected entity revisions and journey draft generation. Accepted commands advance draft, not public record. Large composition can continue on web with the same identity.

**Traceability:** STO-01–07; REC-01–08; GEO-01–06; LRN-01–06; A07/W02–W04.

<a id="screen-a07-chapter"></a>
#### A07.chapter — Chapter, narrative or placement editor

**User and authority:** Coauthor; source owner separately controls original observation.

**Arrive from:** `A04.moment` — Authorized draft placement/caption; `A07` — Chapter/narrative/placement.

**Navigate to:** `A04.moment` — Inspect source; `A07.conflict` — Stale revision; `A07.revisions` — Revision history.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Chapter title/narrative/caption fields; selected moment and credit; placement/order controls; inclusion and evidence; source link; save status; Save draft/Cancel; suggestion reasons where applicable.

**Functions and feedback:** Edit only the chosen entity. Accept/Edit/Dismiss a sourced suggestion; move with buttons rather than drag only. Preview split/merge impacts when that supported operation is used. Preserve manual corrections on regeneration. Change grant only through owner action.

**Required states and recovery:** Empty text, long content, missing source, stale base, offline pending, suggestion incompatible with participant/time and denied edits. Back preserves durable draft or confirms discard. A conflict retains typed candidate.

**Data and implementation boundary:** Original metadata stays separate from editorial values. Draft changes are attributed and never silently republished; source ownership and photographer credit remain intact.

**Traceability:** STO-01–07; REC-01–08; COL-04, COL-08–09.

<a id="screen-a07-route"></a>
#### A07.route — Stage and route-evidence editor

**User and authority:** Coauthor working within permitted geographic/source evidence.

**Arrive from:** `A07` — Route or stage.

**Navigate to:** `A04.moment` — Inspect recording/source; `A07.conflict` — Stale revision.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Accessible stage/leg list; participants where permitted; evidence category; known time/zone; recording/segment reference; alternative/primary track; gap/uncertainty labels; optional map and correction fields.

**Functions and feedback:** Correct ordering, participant branch or reported travel; select a primary overlapping recording without summing alternatives; associate a moment only with compatible evidence. Keep no-GPS/rest days useful. Manual change records reason/provenance.

**Required states and recovery:** Missing timestamps/elevation, gap, split-party route, invalid coordinates, uncertain timezone, map unavailable and stale revision. Never interpolate missing points as fact, fabricate speed or draw everyone through each participant’s home.

**Data and implementation boundary:** Raw samples, simplified display and redacted public geometry are distinct. Mapbox is a display adapter; no live recorder/navigation provider is introduced.

**Traceability:** GEO-01–06; REC-03, REC-05–08; COL-08.

<a id="screen-a07-knowledge"></a>
#### A07.knowledge — Practical detail editor

**User and authority:** Coauthor confirming a dated source-backed report.

**Arrive from:** `A07` — Practical detail.

**Navigate to:** `A04.moment` — Inspect supporting source; `A07.conflict` — Stale revision.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Category (transport/stay/guide/equipment/rental/cost/lesson); report text; source picker; observation date; amount/currency/unit/group size/inclusions where relevant; estimate label; contributor and correction history.

**Functions and feedback:** Create/edit a report or Accept/Edit/Dismiss a prepared transcript-derived suggestion. Open source/playback, preserve real offsets, confirm context and save draft. Unconfirmed suggestion never becomes an approved fact automatically.

**Required states and recovery:** Missing evidence, uncertain amount/date, mixed currency/unit, unsupported transcript and conflicting reports. Historical fare is not current price; no unsupported advice or fabricated source.

**Data and implementation boundary:** Exact decimal amount crosses wire as string; source dependency and observation/edit dates distinct. Native form mirrors selected contract, not free-form generated claims.

**Traceability:** LRN-01–06; ASK-02; STO-07.

<a id="screen-a07-conflict"></a>
#### A07.conflict — Resolve a stale edit

**User and authority:** Current authorized editor with a preserved candidate.

**Arrive from:** `A01.notices` — Resolve edit; `A04.queue` — Pending-edit conflict; `A07` — Pending conflict; `A07.chapter` — Stale revision; `A07.route` — Stale revision; `A07.knowledge` — Stale revision; `A07.revisions` — Restore race.

**Navigate to:** No separate forward destination; complete/cancel returns to caller.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Entity/context, base revision, current accepted value, my attempted value, permitted author/time; differences; combine/rebase/keep-current controls; Save resolution and Back.

**Functions and feedback:** Keep current, manually combine, or explicitly reapply after reading the current revision. Save as a new guarded command; a second race stays recoverable. Back retains the conflict candidate. No silent last-write-wins.

**Required states and recovery:** Current source withdrawn, actor lost edit rights, repeated stale write, offline and missing revision. Candidate remains recoverable without exposing forbidden source material.

**Data and implementation boundary:** Conflict candidate survives rejected update transaction. Resolution and restore recheck current rights; neither resurrects old grants.

**Traceability:** SYN-05; COL-09; STO-05–06.

<a id="screen-a07-revisions"></a>
#### A07.revisions — Revision history and restore

**User and authority:** Coauthor may restore; permitted publisher may inspect only.

**Arrive from:** `A07` — Revision history; `A07.chapter` — Revision history.

**Navigate to:** `A07.conflict` — Restore race.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Entity revision list with allowed actor/time; selected change comparison; current source eligibility; Restore as new draft revision and Cancel.

**Functions and feedback:** Inspect changes, compare current/base, restore eligible content only through fresh expected-revision command. Open conflict on race. Return to same edited entity/chapter.

**Required states and recovery:** Old content depends on withdrawn source, revision unavailable, read-only actor, archive/freeze and stale current revision. Explain excluded content; restoring never restores a permission or publication.

**Data and implementation boundary:** Basic revision recovery, not character-level live coediting or unlimited history promise.

**Traceability:** COL-09; STO-05–06.

<a id="screen-a08"></a>
#### A08 — Choose personal highlights

**User and authority:** Active member with an accessible approved journey and eligible sharing sources.

**Arrive from:** `A06` — Share approved highlights.

**Navigate to:** `A08.preview` — Preview selection/card.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Approved-version/audience facts; own attributed eligible moments initially selected; explicit group-content selector with credit; cover; selection order; personal caption; full-journey disclosure; Preview.

**Functions and feedback:** Review/toggle approved items, choose cover, arrange the presentation within canonical context and write personal caption. If none of own items qualify, explicitly choose permitted group items or a plain journey link. Never silently substitute someone else’s photos.

**Required states and recovery:** No approval, no eligible personal/group media, withdrawn selection, republished/stale version, private visibility and revoked membership. Draft/review sources never appear simply because the member can inspect them.

**Data and implementation boundary:** Share references canonical journey/approved source version. Caption is personal presentation, not canonical narrative or AI answer corpus. No face recognition or duplicate listing.

**Traceability:** SHR-01–05, SHR-07–08; COL-05.

<a id="screen-a08-preview"></a>
#### A08.preview — Highlight preview and share

**User and authority:** Current active member for new output; a share owner may use separately authorized restrictive management without regaining member-only creation rights. Revalidate approved source eligibility before managed output.

**Arrive from:** `A08` — Preview selection/card.

**Navigate to:** `X.share` — Explicit share action; `X.reader` — Full approved journey / hosted selection; `A06.lifecycle` — Revoke owned hosted highlight.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Focused hosted preview; visible credits; canonical/full-journey link; static card preview; audience/forwarding explanation; external-copy warning; Edit selection, Share link, Share card and plain-link option; existing owned hosted-share list with status, selection and Revoke link.

**Functions and feedback:** Generate only allowed output and open device share sheet on explicit action. Preview full approved journey. Cancel returns without posting; handoff to OS is not delivery proof. Edit selection returns with preserved choices. Select an existing owned hosted share to revoke through impact/status; creating a new share never silently replaces or revokes an earlier link.

**Required states and recovery:** Generation pending/failure, stale rights/version, no eligible cover, unlisted-link revoked and unavailable share. Public focus does not hide the rest of the public story. A downloaded/posted card cannot be recalled.

**Data and implementation boundary:** Managed artifacts recheck current policy and source dependencies; no raw original or basemap export by default. Prototype card/share is explicitly simulated and never auto-posts.

**Traceability:** SHR-03–08.

<a id="screen-a09"></a>
#### A09 — You and account

**User and authority:** Signed-in user; signed-out variant offers access entry without protected account details.

**Arrive from:** global entry under §3.2.

**Navigate to:** `A09.auth` — Sign in / expired-session recovery; `A09.profile` — Profile; `A09.security` — Security; `A09.research` — Saved research; `A09.contributions` — Your contributions; `A09.storage` — Storage and sync; `A09.appearance` — Appearance; `A09.export` — Export data; `A09.help` — Help/privacy; `A09.delete` — Delete account.

**Back / close:** Switch global destinations with safe stack state; system Back follows the platform root behavior. Guard active capture before leaving.

**Components and elements:** Display identity/initials; private-account label; Profile; Security; Saved research; Your contributions; Storage & sync; Appearance; Export data; Help/privacy; account deletion and Sign out.

**Functions and feedback:** Open a focused account task. Keep private history separate from saved references/public-profile selection. Sign out shows unsent/unbacked work and offers Stay or Sign out and keep local work. Stop sends, cancel fetched queries and discard late responses; isolate retained files/drafts/outbox until the same account authenticates. Follow shared lifecycle §3.3 for browser/native limits and account deletion; never expose or reassign retained work to another account.

**Required states and recovery:** Signed-out, session-expired, profile pending, avatar unavailable and operation status. No invented storage totals, subscription benefits or public identity exposure.

**Data and implementation boundary:** Account data plus installation preferences; protected source/outbox partition remains per account. Public-profile opt-in is separate from editing private profile.

**Traceability:** OWN-01–03; PRO-01, PRO-04–06; A09/W09.

<a id="screen-a09-auth"></a>
#### A09.auth — Sign in / create account

**User and authority:** Signed-out person or expired session; sample prototype uses fictional identity selection separately.

**Arrive from:** `A01.join` — Authenticate invited account; `A04.queue` — Expired sign-in; `A06.unavailable` — Sign in where useful; `A09` — Sign in / expired-session recovery; `A09.verify` — Resolve session / wrong account; `A09.recover` — Return to sign-in; `A09.security` — Signed-out result; validated cold/warm link or resumed intent under §3.2.

**Navigate to:** `A09.verify` — Verification required; `A09.recover` — Forgot password; `A01` — Success without return intent.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Sign-in/create modes; create display name/email/password; sign-in email/password; persistent labels, show/hide password, autofill/paste, terms/provider text from actual approved copy; recovery and switch-account actions.

**Functions and feedback:** Validate, submit, verify if required, then resolve safe return intent. Default success → A01. Invite returns to review, never auto-accepts; sensitive action returns to refreshed preview, never auto-confirms. Preserve non-secret intent on failure.

**Required states and recovery:** Invalid inputs, generic auth failure, unverified, rate-limit/cooldown, offline, transport unavailable and session revoked. No OAuth/passkeys invented for this baseline; never log/persist passwords in ordinary state.

**Data and implementation boundary:** Better Auth/session storage; native SecureStore. Real forms remain separate from sample sign-in. Changed account cannot inherit another account’s cache/local work.

**Traceability:** OWN-01; E01; selected D05–06.

<a id="screen-a09-verify"></a>
#### A09.verify — Verify email

**User and authority:** Person with verification requirement or safe verification callback.

**Arrive from:** `A09.auth` — Verification required; validated cold/warm link or resumed intent under §3.2.

**Navigate to:** `A09.auth` — Resolve session / wrong account.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Next-step instruction; resend with actual cooldown/queue status; Check verification; wrong-account action; valid/expired/consumed/failure result.

**Functions and feedback:** Complete the library-owned verification flow; return through session resolution to pending invite or history. Request a fresh token where needed. A successful callback never accepts a journey invitation or sensitive action automatically.

**Required states and recovery:** Delivery pending/failure, expired link, invalid/consumed token, offline and wrong account. Show generic responses where disclosure would enumerate accounts. No raw token rendering.

**Data and implementation boundary:** Pinned auth link format and allowlisted callbacks. Native cold/warm launch after hydration; domain invite token conventions do not replace auth token format.

**Traceability:** OWN-01; E02.

<a id="screen-a09-recover"></a>
#### A09.recover — Recover account / reset password

**User and authority:** Person requesting recovery or opening a valid reset link.

**Arrive from:** `A09.auth` — Forgot password; `A09.security` — Recovery management; validated cold/warm link or resumed intent under §3.2.

**Navigate to:** `A09.auth` — Return to sign-in.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Email request form; generic acknowledgement; reset form for valid callback with new password and visibility control; expiration/retry guidance; return to sign-in.

**Functions and feedback:** Request recovery without exposing account existence; set password through actual auth contract; return deliberately to sign-in. Preserve pending non-secret navigation intent. Do not automatically replay the interrupted mutation.

**Required states and recovery:** Invalid/expired/used link, rate limit, offline and server failure; password-manager/paste supported. No new weak password rule, security questions or token retention in ordinary routes/cache.

**Data and implementation boundary:** Better Auth owns reset validation and secret storage. A09.auth owns resumed identity validation.

**Traceability:** OWN-01; E03.

<a id="screen-a09-reauth"></a>
#### A09.reauth — Confirm your identity

**User and authority:** Current account performing a sensitive operation that requires fresh authentication.

**Arrive from:** `A06.lifecycle` — Fresh identity if required; `A09.security` — Fresh-session check; `A09.export` — Fresh identity when required; `A09.delete` — Fresh identity; `A04.export` — Fresh identity before original-export approval; `A06.powers` — Fresh identity before capability change; `A06.transfer` — Fresh identity before transfer acceptance.

**Navigate to:** No separate forward destination; complete/cancel returns to caller.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Named reason for reauthentication, appropriate current-credential form, pending/error state, Confirm identity and Cancel.

**Functions and feedback:** Use the selected ten-minute server-validated freshness matrix in shared lifecycle §3.1. Confirm identity then return to the exact caller for a fresh impact/policy check. Cancel returns without executing the operation. Reauth is not a shortcut around a stale preview or withdrawn capability.

**Required states and recovery:** Session revoked, wrong credential, rate limit, offline and account changed. Retain safe caller intent, never password. No automatic destructive confirmation after successful auth.

**Data and implementation boundary:** Fresh-session contract from auth boundary; allowlisted typed return intent. This is a global detour under §3.2, not an independent destination.

**Traceability:** OWN-01, OWN-03; E04.

<a id="screen-a09-profile"></a>
#### A09.profile — Private profile and optional public selection

**User and authority:** Account owner.

**Arrive from:** `A09` — Profile.

**Navigate to:** `X.picker` — Bounded avatar selection; `X.settings` — Avatar permission recovery; `X.reader` — Optional public-profile preview.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Display name, optional bio/avatar, private email label; initials fallback; avatar select/remove; save status; separate optional public-profile selection of permitted fields/journeys.

**Functions and feedback:** Edit display name/bio; choose one avatar through bounded picker; remove it; save with revision handling. Review optional public representation separately and open its viewer. Public journey selections never expose full private history.

**Required states and recovery:** Name 1–80 Unicode code points, bio ≤500; avatar invalid/type/size/pixels, pending replacement, upload failure and stale profile revision. Keep previous valid avatar until replacement commits. No arbitrary remote avatar URL.

**Data and implementation boundary:** Selected avatar JPEG/PNG ≤5 MiB and 12 megapixels, sanitized ≤512×512 without upscale. Unsupported HEIC needs qualified conversion or clear correction. Identity media is not a journey source/export grant.

**Traceability:** PRO-01, PRO-05–06; E10; D04, D07.

<a id="screen-a09-security"></a>
#### A09.security — Sessions and security

**User and authority:** Current account; fresh identity for sensitive actions when required.

**Arrive from:** `A09` — Security.

**Navigate to:** `A09.reauth` — Fresh-session check; `A09.recover` — Recovery management; `A09.auth` — Signed-out result.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Current session identified, other permitted device sessions, revoke controls, password/recovery management and sign-out; pending/error notices.

**Functions and feedback:** Revoke a selected other session or eligible sessions, manage password/recovery under auth contract. Reauth when needed; show current-session effects explicitly. Sign-out follows unsynced-work guard.

**Required states and recovery:** Expired session, revoke failure, rate limit and offline. Do not fabricate device location/history or treat revoked session as deleted account.

**Data and implementation boundary:** Better Auth session authority; protected local secrets separate from ordinary app data. Never expose session bearer values.

**Traceability:** OWN-01; E11.

<a id="screen-a09-research"></a>
#### A09.research — Saved research

**User and authority:** Signed-in person keeping references to other journeys.

**Arrive from:** `A09` — Saved research.

**Navigate to:** `X.reader` — Approved reader/catalog; `A01.create` — New distinct journey with reference.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Saved approved journey references, dates/last update, private note, search/filter, remove bookmark, Open journey and Start a new journey with reference.

**Functions and feedback:** Open allowed approved reader, edit own research note, unsave or start a distinct journey carrying only a source reference. Discover continuation opens the public catalog; no imported completed-trip facts/media or membership.

**Required states and recovery:** Empty/no results, source unlisted/private/taken down, stale preview, offline and inaccessible reference. Generic unavailable replaces protected cached title/cover after denial.

**Data and implementation boundary:** Unique account/journey saved reference, separate from participation and activity totals. Private notes do not enter public story or answer corpus.

**Traceability:** PRO-04; DIS-01–07.

<a id="screen-a09-contributions"></a>
#### A09.contributions — Your contributions

**User and authority:** Source owner, including a former journey member.

**Arrive from:** `A06` — Manage own contributions; `A06.unavailable` — Owner-only route; `A09` — Your contributions.

**Navigate to:** `A04.moment` — Own source; `A06.lifecycle` — Owner restriction; `A04.export` — Review original-export request; `A09.export` — Owned/permitted export.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Own source list and permitted contribution links; destination availability; grant/inclusion facts; outstanding original-export requests; withdrawal/export entry; source-level filtering.

**Functions and feedback:** Open own source, narrow/withdraw own grant, revoke export or export owned data. Former member uses this owner-only route rather than reopening protected workspace. No grant expansion into a journey after departure without current authority.

**Required states and recovery:** Former/deleted/private destination uses neutral safe context; no other-owner review pool. Source missing, offline queued restriction and pending recovery status remain visible.

**Data and implementation boundary:** Owner authority survives loss of member workspace access where permitted; current restriction and export checks still apply. Do not expose hidden journey metadata through a contribution row.

**Traceability:** COL-07, COL-10; OWN-02–03; E12.

<a id="screen-a09-storage"></a>
#### A09.storage — Storage and sync preferences

**User and authority:** Account owner managing installation/account data under current permissions.

**Arrive from:** `A04.queue` — Transfer preferences; `A09` — Storage and sync.

**Navigate to:** `A04.queue` — Resolve queue; `X.settings` — OS permissions/settings.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Measured local usage if available; pending/unbacked item count; separate configured cloud usage/quota; Wi-Fi preference; queue link; permission/settings entry; explanation of background limitations.

**Functions and feedback:** Set transfer preference, inspect waiting items, resolve permissions. Any local cleanup must identify copies and prove safe retention; omit cleanup until the preservation contract is implemented. Never delete phone gallery files.

**Required states and recovery:** Measurement unavailable, quota reached, low local storage, account/session expiry and missing source. Do not promise that force-stopped apps upload immediately or that clearing app data preserves unsynced captures.

**Data and implementation boundary:** Local manifests/files and actual server usage; cache eviction is not source deletion. Query persistence is not cloud backup.

**Traceability:** SYN-01–06; CAP-07; requirements §17.

<a id="screen-a09-appearance"></a>
#### A09.appearance — Appearance and accessibility preferences

**User and authority:** Installation user; preference can exist without sign-in.

**Arrive from:** `A09` — Appearance.

**Navigate to:** `A09.help` — Accessibility guidance.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** System/Light/Dark choices with selected state; readable preview; explanation that OS text-size/reduced-motion/accessibility settings are respected; relevant help link.

**Functions and feedback:** Change appearance without losing form input, selected chapter or actor. Use OS settings for system accessibility preferences rather than building competing text/motion policies.

**Required states and recovery:** Restricted preference storage uses session-only state with truthful behavior. Large text, reduced motion and both appearances remain supported; color alone never signifies status.

**Data and implementation boundary:** Existing installation preference adapter, independent from account identity. Shared semantic tokens; platform owns native rendering.

**Traceability:** VWR-01–07 where viewer applies; requirements §17; DESIGN.md.

<a id="screen-a09-export"></a>
#### A09.export — Export your permitted data

**User and authority:** Owner exporting own data or current authorized recipient exporting precisely granted data.

**Arrive from:** `A04.moment` — Export owned/permitted data; `A04.export` — Generate permitted output; `A06` — Permitted journey export; `A09` — Export data; `A09.contributions` — Owned/permitted export; `A09.delete` — Export before deletion.

**Navigate to:** `A04.export` — Request exact-original permission; `X.share` — Explicit permitted file handoff; `A09.reauth` — Fresh identity when required.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Export kind/scope, exact eligible source/structured-data list, excluded-item explanations, current grant expiry, independent-copy warning; Request export, progress, Download/share when ready.

**Functions and feedback:** Export own profile/owned originals and permitted story data without payment. Request other-owner originals through A04.export if eligible. Revalidate artifact access on download; send to OS only on explicit request.

**Required states and recovery:** No eligible data, job failure, stale rights, recipient departed, source withdrawn, expired grant or offline. Account-profile JSON export is distinct from a heavy archive; never label one as completion of the other.

**Data and implementation boundary:** Private bounded job/manifest where needed; access at generation and GET/HEAD/Range. Independent copies cannot be recalled; outputs do not include private originals on publication permission alone.

**Traceability:** OWN-02; COL-02; requirements §2.6.

<a id="screen-a09-help"></a>
#### A09.help — Help, privacy and supported limits

**User and authority:** Any user; specific private diagnostics require current authorization.

**Arrive from:** `A06.operation` — Support/status help; `A09` — Help/privacy; `A09.appearance` — Accessibility guidance.

**Navigate to:** `X.support` — Configured support channel.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Capture/import guidance, supported formats/limits/languages, state glossary, privacy/provider/retention explanation, app version, safe support entry and optional redacted diagnostics preview.

**Functions and feedback:** Read contextual help and return; open configured support after reviewing what is sent. Explain manual GPX/FIT acquisition without promising a direct watch-service connection. Request no whole-gallery access for help.

**Required states and recovery:** Offline bundled help, outdated configuration, unavailable channel and unknown receipt. Never invent support address, legal compliance badge or promise guaranteed recovery.

**Data and implementation boundary:** Published actual limits and approved policy copy; redact tokens, precise locations and personal media from diagnostics. No telemetry or email send implicit in opening Help.

**Traceability:** IMP-05, IMP-07–08; OWN-04–05; requirements §17.

<a id="screen-a09-delete"></a>
#### A09.delete — Delete account

**User and authority:** Account owner with fresh identity and current cross-journey impact.

**Arrive from:** `A09` — Delete account.

**Navigate to:** `A06.transfer` — Transfer before deletion; `A09.export` — Export before deletion; `A09.reauth` — Fresh identity; `A06.operation` — Minimal status after logout.

**Back / close:** Return to the actual caller listed above, retaining its context; apply the global unsaved-work guard. If that caller is absent or no longer authorized, use the family fallback in §3.2.

**Components and elements:** Separate account-deletion heading; own sources/grants and administration responsibilities; accepted-transfer or no-successor freeze explanation; retained others’ work; disclosed cleanup/receipt window; export option; explicit confirmation.

**Functions and feedback:** Offer permitted export/accepted transfer before irreversible commitment. Reauthenticate as required, refresh impact and confirm deliberately. Commit withdraws deleting-owner reuse and invalidates issued/received export permissions; move to minimal operation status after logout.

**Required states and recovery:** Pending transfer, no eligible successor, stale impact, auth cancellation, offline request, server deny pending journal and delayed purge. No keep-my-sources-shared checkbox in selected policy and no cascade deleting others’ originals.

**Data and implementation boundary:** Account deny and coordinator, separate protected read-only receipt (45-day hard validity under selected policy). Purge target is not proof of deletion from all backups; disclose verified actual policy.

**Traceability:** OWN-03; COL-07, COL-10; E13–14; D08, D10.

### 5.3 Directed navigation edge ledger

This is the forward-action ledger behind the per-screen entry/exit lists. Return, authentication, denial and shell edges are governed by §3.2. OS boundaries return as specified in §3.3. Each action still requires its screen-specific authority.

| From | To | Trigger / result |
| --- | --- | --- |
| A01 | A01.create | Create journey |
| A01 | A01.join | Join with invite / pending invitation |
| A01 | A01.notices | Attention |
| A01 | A06 | Open permitted journey |
| A01.create | A06 | Confirmed creation |
| A01.join | A06 | Explicit acceptance / current membership |
| A01.join | A09.auth | Authenticate invited account |
| A01.join | A01 | Decline |
| A01.notices | A01.join | Resolve invitation |
| A01.notices | A06.transfer | Transfer offer |
| A01.notices | A07.conflict | Resolve edit |
| A01.notices | A06.operation | Restriction status |
| A01.notices | A06 | Permitted journey change |
| A02 | A02.destination | Choose destination/audience |
| A02 | A03 | Local-save result |
| A02 | A05 | Import instead |
| A02 | X.settings | Permission settings |
| A03 | A02 | Capture another |
| A03 | A04.moment | View/edit saved moment |
| A03 | A04.queue | Inspect transfer |
| A03 | A04.scope | Change source scope |
| A04 | A02 | Capture |
| A04 | A05 | Import |
| A04 | A04.moment | Open item |
| A04 | A04.queue | Sync queue |
| A04 | A04.scope | Contribute selection |
| A04.moment | A04.scope | Owner changes scope |
| A04.moment | A04.queue | Inspect/retry transfer |
| A04.moment | A04.export | Original-file approval/request |
| A04.moment | A06.lifecycle | Owner withdrawal/delete |
| A04.moment | A07.chapter | Authorized draft placement/caption |
| A04.moment | A09.export | Export owned/permitted data |
| A04.queue | A04.moment | Resolve item |
| A04.queue | A09.auth | Expired sign-in |
| A04.queue | A07.conflict | Pending-edit conflict |
| A04.queue | A09.storage | Transfer preferences |
| A04.scope | A06.lifecycle | Narrow/withdraw with impact |
| A04.scope | A04.export | Separate original export permission |
| A04.export | A09.export | Generate permitted output |
| A04.export | A06.lifecycle | Revoke grant |
| A05 | X.picker | Select/add files |
| A05 | A05.item | Inspect/correct candidate |
| A05 | A04 | Approved import result |
| A05 | A04.queue | Approved transfer status |
| A05 | A04.scope | Choose batch scope for staged selection |
| A05 | X.settings | Resolve permitted access |
| A05.item | X.picker | Reselect missing input |
| A06 | A06.details | Correct event metadata |
| A06 | A06.people | People / own powers |
| A06 | A06.sources | Permitted source review |
| A06 | A07 | Story/Route/Learn workspace |
| A06 | A02 | Capture to visible context |
| A06 | A05 | Import own material |
| A06 | A08 | Share approved highlights |
| A06 | A06.publish | Publication review |
| A06 | A06.lifecycle | Named lifecycle action |
| A06 | X.reader | Read approved journey |
| A06 | A09.contributions | Manage own contributions |
| A06 | A09.export | Permitted journey export |
| A06.people | A06.invite | Invite companion |
| A06.people | A06.powers | Manage member powers |
| A06.people | A06.transfer | Offer/inspect transfer |
| A06.people | A06.lifecycle | Leave/remove/archive |
| A06.powers | A06.lifecycle | Remove member |
| A06.transfer | A06.lifecycle | No-successor departure impact |
| A06.sources | A04.moment | Permitted source detail |
| A06.sources | A05 | Import own sources |
| A06.sources | A04.scope | Contribute own selection |
| A06.sources | A07 | Place in draft |
| A06.publish | A06.preview | Preview exact candidate |
| A06.publish | A04.moment | Inspect permitted blocker/source |
| A06.publish | A06 | Successful approval result |
| A06.publish | A06.lifecycle | Unpublish/narrow/manage unlisted link |
| A06.publish | X.web | Dense review/correction continuation |
| A06.preview | X.reader | Open already approved public version only |
| A06.lifecycle | A06.transfer | Arrange accepted transfer |
| A06.lifecycle | A09.reauth | Fresh identity if required |
| A06.lifecycle | A06.operation | Committed/pending restriction result |
| A06.operation | A01 | Safe history exit |
| A06.operation | A09.help | Support/status help |
| A06.unavailable | A01 | Safe history |
| A06.unavailable | A09.auth | Sign in where useful |
| A06.unavailable | A09.contributions | Owner-only route |
| A07 | A07.chapter | Chapter/narrative/placement |
| A07 | A07.route | Route or stage |
| A07 | A07.knowledge | Practical detail |
| A07 | A07.conflict | Pending conflict |
| A07 | A07.revisions | Revision history |
| A07 | A06.sources | Review sources |
| A07 | X.web | Dense composition continuation |
| A07.chapter | A04.moment | Inspect source |
| A07.chapter | A07.conflict | Stale revision |
| A07.chapter | A07.revisions | Revision history |
| A07.route | A04.moment | Inspect recording/source |
| A07.route | A07.conflict | Stale revision |
| A07.knowledge | A04.moment | Inspect supporting source |
| A07.knowledge | A07.conflict | Stale revision |
| A07.revisions | A07.conflict | Restore race |
| A08 | A08.preview | Preview selection/card |
| A08.preview | X.share | Explicit share action |
| A08.preview | X.reader | Full approved journey / hosted selection |
| A09 | A09.auth | Sign in / expired-session recovery |
| A09 | A09.profile | Profile |
| A09 | A09.security | Security |
| A09 | A09.research | Saved research |
| A09 | A09.contributions | Your contributions |
| A09 | A09.storage | Storage and sync |
| A09 | A09.appearance | Appearance |
| A09 | A09.export | Export data |
| A09 | A09.help | Help/privacy |
| A09 | A09.delete | Delete account |
| A09.auth | A09.verify | Verification required |
| A09.auth | A09.recover | Forgot password |
| A09.auth | A01 | Success without return intent |
| A09.verify | A09.auth | Resolve session / wrong account |
| A09.recover | A09.auth | Return to sign-in |
| A09.profile | X.picker | Bounded avatar selection |
| A09.profile | X.settings | Avatar permission recovery |
| A09.profile | X.reader | Optional public-profile preview |
| A09.security | A09.reauth | Fresh-session check |
| A09.security | A09.recover | Recovery management |
| A09.security | A09.auth | Signed-out result |
| A09.research | X.reader | Approved reader/catalog |
| A09.research | A01.create | New distinct journey with reference |
| A09.contributions | A04.moment | Own source |
| A09.contributions | A06.lifecycle | Owner restriction |
| A09.contributions | A04.export | Review original-export request |
| A09.contributions | A09.export | Owned/permitted export |
| A09.storage | A04.queue | Resolve queue |
| A09.storage | X.settings | OS permissions/settings |
| A09.appearance | A09.help | Accessibility guidance |
| A09.export | A04.export | Request exact-original permission |
| A09.export | X.share | Explicit permitted file handoff |
| A09.export | A09.reauth | Fresh identity when required |
| A09.help | X.support | Configured support channel |
| A09.delete | A06.transfer | Transfer before deletion |
| A09.delete | A09.export | Export before deletion |
| A09.delete | A09.reauth | Fresh identity |
| A09.delete | A06.operation | Minimal status after logout |
| A04.export | A09.reauth | Fresh identity before original-export approval |
| A06.powers | A09.reauth | Fresh identity before capability change |
| A06.transfer | A09.reauth | Fresh identity before transfer acceptance |
| A08.preview | A06.lifecycle | Revoke owned hosted highlight |


## 6. Shared component and state contracts

Archive and no-successor freeze have different allowed-action matrices; apply shared lifecycle §4.1 to every archived/frozen state below. Freeze alone does not ban all editing or own capture/contribution. Archive invalidates pending expansion offers, retains current authorized reading/export/restriction paths and permits exact-original approval for existing contributed sources under current policy.

### 6.1 Components to reuse or complete

| Component family | Elements and behavior | Main consumers |
| --- | --- | --- |
| Navigation shell | Stable destination names, top title/back, scoped menus, badge with meaningful count, safe focus/Back, tablet adaptation | All roots and child stacks |
| Journey row | Canonical title, intended date/timezone, permitted status/powers, optional safe cover, text fallback, one open action | A01, A09.research |
| Attention/notice | Specific action and retained status; invalid targets become generic; no social inbox mechanics | A01.notices, A06, A09 |
| Fields | Persistent label, hint/error association, keyboard/autofill, paste support, pending label retained, input preserved on errors | Create/join, auth, editing, profile |
| Date/time and evidence | Original time/context, correction provenance, unknown state, explicit DST ambiguity choice | Create, import item, moment, route, knowledge |
| Media/moment | Thumbnail or meaningful fallback, type, owner/credit, duration, explicit playback, selected state | Capture confirmation, moments, sources, highlights |
| Capture controls | Separate mode, start/stop/save, visible destination/audience, configured limits, permission/failure alternatives | A02/A03 |
| State facts | Separate persistence, transfer, scope, inclusion and restriction status; plain labels plus semantic state | A03/A04/A06/A08 |
| Source audience | Only me / Journey review / Allow journey publication and sharing; named review audience and future audience-change explanation | A02.destination, A04.scope, A05 |
| Original export approval | Exact recipient/assets/current source revisions/expiry; metadata warning; revoke | A04.export, A09.export |
| Chapter/evidence list | Stable IDs, selected chapter, reorder alternatives, rest/transfer/parallel branches, no-GPS fallback | A06/A07 |
| Conflict comparison | Base/current/mine, actor/time when permitted, explicit combine/rebase/discard, candidate retained on failure | A07.conflict |
| Practical detail | Category, dated report, source, currency/amount/unit/group-size context, uncertainty/correction | A07.knowledge, approved preview |
| Privacy/publication review | Rights/privacy blockers, exact version, audience and listing separately, preview identical to delivery | A06.publish/preview |
| Impact and result | Current scope, retained data, named action, required confirmations, immediate-deny/pending/confirmed/cleanup axes | A06.lifecycle/operation, A09.delete |
| Feedback | Loading, true empty, filtered empty, stale/offline, recoverable error, unavailable; layout stable and primary recovery clear | Every data-bearing screen |

### 6.2 State vocabulary and allowed claims

| Axis | Labels / interpretation | Not equivalent to |
| --- | --- | --- |
| Local persistence | Saving on this device; Saved on this device; Save failed; Local file missing | Upload, group contribution or backup |
| Transfer | Queued; Waiting for Wi-Fi; Uploading; Paused; Verifying; Backed up privately; Failed; Cancelled | Source grant or publication |
| Source scope | Only me; Journey review; Allow journey publication and sharing; Withdrawn | Actual inclusion in an approved story or original export permission |
| Editorial | Local changes; Waiting to sync; Saved draft revision; Conflict needs review | Published narrative |
| Publication | Not included; Included in approved version; Suppressed by current access; Draft differs from approved | Blanket continued access to old versions |
| Restriction | Request not yet confirmed by server; Access denied, recovery confirmation pending; Restriction confirmed | Physical byte purge or recall of external copies |
| Deletion cleanup | Cleanup pending/in progress/completed under disclosed policy | Journal confirmation or immediate removal from every backup |

Offline withdrawal can record local intent but must say **Waiting to send restriction** until the server commits a deny. Do not show the server-denied state merely because an offline button was pressed. A failed journal append after local server commit keeps denial enforced; repeated taps never restore access. Received bytes on offline devices or outside the service cannot be remotely recalled.

### 6.3 Permission-specific presentation

| Person | Own library | Journey review/draft | Edit | People/admin | Publish | Highlights |
| --- | --- | --- | --- | --- | --- | --- |
| Ordinary active participant | Own sources | No other-owner review/draft | No | Own powers + administrator identity only | No | Eligible approved content only |
| Administrator only | Own sources | No extra access | Event title/intended dates under selected rule, not common draft | Scoped roster, invites, powers, transfer/archive/delete | No | Eligible approved content only |
| Active coauthor | Own sources plus permitted review projections | Yes, under grants | Shared draft and allowed event metadata | Own/allowed projection; no implicit admin | Only if separately designated | Eligible approved content only |
| Active publisher only | Own sources plus permitted review projections | Yes, under grants | No | No implicit admin | Exact approved review | Eligible approved content only |
| Former member/source owner | Own sources/contribution restrictions | No protected workspace | No | No | No | No new member-only share; ordinary public reading remains |

The creator initially has administration, coauthoring and publishing. Exactly one active administrator is the selected baseline. Ownership, uploader, photographer and person pictured are distinct. Raw-original access/export follows its own contract; a review projection is not an unrestricted original-file URL.

## 7. Prototype fidelity and implementation boundaries

### 7.1 What must work in the complete walkthrough

All named screens need a reachable disposition. Core capture/import/contribution/edit/publication/highlights paths have working form state, selection, back/cancel, retries, actor projections and consequential failures. Supporting account/settings/lifecycle branches need the specific transitions documented here; a static placeholder does not demonstrate its functionality. Mark external boundaries explicitly. Do not polish every secondary view before the connected path works.

Choose versioned fictional scenarios for the newly planned prototype, with group contributions and review/publication variants. Include no-GPS/rest day, separate departure, duplicate, missing timezone, review-only source, conflict and withdrawn-source cases. Label all images, prices, people and map geometry as sample content. Record asset provenance; do not hotlink unknown photos or present a schematic as actual route data.

Prototype navigation, input validation, local scenario transitions, selection/order, focus, pending/error feedback and preview are interactive. Camera/microphone/picker, durable storage, server auth in the sample walkthrough, uploads, mail, invite acceptance, Mapbox, transcription, AI, publication, share output, journal receipt and deletion are simulated. Existing real account screens remain separate. No real permissions, messages, provider calls or destructive actions occur from sample controls.

The prototype reset/actor/scenario panel is accessible but separate from product navigation. Reset requires warning if it discards current sample edits. It must not reset real accounts, preferences or application data. A prepared web continuation maps the canonical fixture/version; it is not live cross-device sync.

### 7.2 Production seams a screen builder must preserve

| Boundary | Required contract | Screen consequence |
| --- | --- | --- |
| Native persistence | App-owned verified files + SQLite metadata/outbox; startup reconciliation | Only then acknowledge local save. Query cache never owns the only copy. |
| Transfer | Stable object/operation IDs, acknowledged parts, checksum finalization, current grants | One logical item after retries; progress survives interruption; no multipart-ETag-as-checksum claim. |
| Data/query | Generated versioned API contracts; server current-access checks | Loading/error/denial stay distinct. Route guards and cached roles cannot authorize actions. |
| Editing | Base revision, command ID, retained conflict candidate, canonical draft generation | Offline command stays pending; conflict preserves typed work; restore rechecks current rights. |
| Publication | Exact reviewed draft/policy generation and current safe projection | Changed draft/rights requires a new review; no automatic public update from editing. |
| Lifecycle | Version-bound impact, fresh auth when required, local server deny, independent receipt | Stale previews are refreshed; post-deletion read-only status is outside signed-in state. |
| Maps/AI | Explicit map load; approved version/source eligibility; server-only buffered answers | Reading/capture still work during provider failures. No live route recorder or client AI agent is introduced. |
| Native delivery | Expo/React Native, Expo Router, Unistyles v3/Nitro and existing components | Keep platform styles/navigation in mobile; no NativeWind, @expo/ui addition, Expo Go qualification or paid build prerequisite. |

## 8. Walkthrough and acceptance checklist

These are planned checks, not passed product tests. Use one small integrated scenario per meaningful boundary and reuse existing coverage.

1. Cold start from an invite; sign in/verify; return to invite; cancel once, then accept explicitly. History shows the same journey once. Wrong account/expired/revoked offer discloses no protected fields.
2. Create with an invalid end date and an ambiguous timezone example; correct without losing input. Retry a timed-out creation with the same operation identity. Confirm intended dates do not label a trip completed.
3. Capture each supported mode with explicit private/journey-review destination. Deny location; save remains possible. Interrupt a save and recover truthfully; do not advertise a missing file as saved.
4. Queue offline captures; expire the established account session and save another local personal capture without a forced auth detour; explicitly sign out/switch accounts and verify isolated retained work. Relaunch; pause/cancel/retry; expire sign-in; restore the same account; verify originals and logical identities remain. Production device test proves durability separately from the prototype.
5. Select a mixed import batch with a cloud-only item, duplicate, unrelated photo, unknown timezone, segmented GPX and unusable FIT. Exclude/correct/retry individual items without losing the batch; approve before upload.
6. Use participant, admin-only, coauthor, publisher-only and former-owner variants. Check every screen and action against §6.3, including deep links and access changes while a screen is open.
7. Grant review-only use, then publication reuse, then original export for exact assets/recipient. Confirm these are separate decisions; inspect audience changes and expiry.
8. Edit a chapter, route leg and practical detail; preserve unrelated sources and accepted corrections. Receive a stale revision; retain mine and theirs; resolve without silent overwrite. Back/gesture/keyboard dismissal retains or explicitly discards the right work.
9. Preview exact publication; introduce a rights/draft change; require renewed review. Publisher-only actor can inspect/approve but cannot edit. A participant can read only eligible approved material.
10. Share personal highlights; select an existing hosted share and revoke it through impact/status, separately from canonical unlisted-link management. Test no eligible personal media and explicit group selection. Preserve credits and the full-public-journey disclosure. Cancel the device share; nothing is posted automatically.
11. Withdraw a source while publication/share work is pending. Deny affected managed views; distinguish offline queued request, server denial, pending journal receipt and completion. Previously exported bytes remain outside recall.
12. Transfer administration through acceptance, leave, archive and delete as separate scenarios. Test no successor, stale preview, reauthentication cancellation and two confirmations for canonical deletion.
13. Delete an account; status survives logout/relaunch via the limited receipt without revealing protected identity. Expired receipt provides safe support, not a general account session.
14. Switch theme, increase text size, use TalkBack/VoiceOver and reduce motion. Exercise phone/tablet portrait/landscape, long names/titles, missing cover, empty/filter-empty, keyboard overlap and smallest declared layouts.
15. Open an approved story externally without signing in. Return from reader/source or web continuation without losing local chapter/filter state; map/AI failure must not block the readable fallback.

Record fixture revision, source commit, platform/device, artifact/runtime inputs, tested actor, entry path, result and remaining limitation. Web/browser evidence cannot close Android/iOS native acceptance. Installed dependencies or compiling screens do not prove server policy or durable capture.

## 9. Functional dependency guide for a future prototype

1. Start at DESIGN.md, make the relevant visual decisions and revisit this registry; retain permission/return contracts and flag business changes in §10.
2. Connect the shell, account return intent, history, create/join and role-specific overview using current components.
3. Complete capture → confirmation → personal moments/queue → import review → owner scope, with failure variants.
4. Add shared sources and focused editors/conflicts with preserved chapter and item context.
5. Add publisher review, exact approved preview, personal highlights and the reader/share boundaries.
6. Complete supporting People, lifecycle, account, research/settings/support and post-deletion status flows.
7. Run the full walkthrough and native accessibility/layout review; fix unresolved paths and record accepted design decisions before real integration of the affected screen.

This orders prototype work only; it does not replace the ten production dependency steps or reduce complete R1. Reuse accepted UI components and current account behavior. Reconcile actual branch/prototype inclusion before shipping; sample controls, actor switching and simulated receipts cannot enter production accidentally.

## 10. Decision register and change procedure

| Decision | Recommendation / current rule | Status and impact |
| --- | --- | --- |
| Native shell | Four destinations; Capture is a workspace, not immediate recording; role-specific journey tools | Baseline destinations, proposed precise composition. Verify tablet adaptation. |
| First-time capture without an account | Account-first baseline; established account can capture locally offline/with expired session, then reauthenticate for cloud work | Anonymous capture is not silently added. Any change needs identity/ownership/recovery design. |
| Default destination/scope | New or ambiguous capture context defaults to personal/Only me; explicit opt-in can target future captures to journey review | Preserve visible destination and scoped preference. Never auto-opt into publication. |
| Creation while offline | Retain create form locally; canonical creation remains pending until accepted, with the same command ID | Do not invent a joined canonical journey or invite delivery before confirmation. |
| Native publication | Bounded native review/preview plus explicit creator-web continuation for dense work | Proposed decomposition of existing publication capability, not permission expansion. |
| Visual identity and page composition | Fresh decisions tracked in DESIGN.md | Undecided; existing values and old approvals are withdrawn. |
| Formats and capture/import limits | Use the declared supported set and show configured limits before action | Video/audio duration, batch/storage limits and supported device/OS set need qualification. Do not invent values. HEIC/wider scan stay conditional. |
| Source-language support | Preserve source language and unsupported/failure states | Exact transcription language list and quality evidence remain open. |
| Export / lifecycle values | Use selected 24h default/7-day maximum export grants; 7-day invites; 72h transfer offers; 5-minute impact previews with revision binding | Existing selected rules, not new design choices. Check server truth at action time. |
| Saved research and optional public profile | Keep under You and separate from participation; viewer/discovery remains a shared public surface | Focused supporting prototypes; no new social feed. |
| Brand distribution identity | Kairn is the working name; current native identity remains unchanged | Public domain/name/rights and distribution choices remain separate decisions. |
| Support/privacy/retention text | Use actual approved provider, retention and support configuration | No invented support email, launch date, policy certification or unlimited promise. |

To change a business decision, record the affected screen IDs, inbound/outbound edges, capability/data rules and acceptance scenarios. Reconcile the requirements/selected-decision document first where policy changes; architecture for a new boundary/dependency; design for presentation; this registry and prototype scenario vectors for navigation. A local visual preference never overrides server rights or source ownership.

## 11. Skills for the next implementation work

No new skill installation or subscription is required. This is a selection of existing guidance, not a new SKILL.md or a request to implement all workstreams at once.

| Skill | Apply when | Project constraint |
| --- | --- | --- |
| `impeccable` planning guidance | Screen hierarchy, workflow/interaction review and design critique | Follow the fresh design process and confirmed product rules; planning does not claim visual/device acceptance. |
| [expo-overview](../../.agents/skills/expo-overview/SKILL.md), [expo-router](../../.agents/skills/expo-router/SKILL.md) | Native navigation, stacks, links, sheets and back handling | Existing Expo version and `src/app`; stable canonical IDs; no app restructuring merely to match examples. |
| [expo-native-ui](../../.agents/skills/expo-native-ui/SKILL.md), [expo-design-system](../../.agents/skills/expo-design-system/SKILL.md), [Unistyles v3](../../.agents/skills/react-native-unistyles-v3/SKILL.md) | Native controls, responsive compositions, theme/state consistency | Fresh visual decisions; preserve native semantics and the selected styling framework. No NativeWind or automatic @expo/ui adoption. |
| [kairn-architecture](../../.agents/skills/kairn-architecture/SKILL.md) | Contracts, package boundaries, adapters and verification | Architecture §14 remains dependency authority; current compiled development clients. |
| [kairn-capture-sync](../../.agents/skills/kairn-capture-sync/SKILL.md) | A02–A05, local drafts/outbox, sync and recovery | App-owned bytes/SQLite; no Query-cache durability claim. |
| [kairn-publication-access](../../.agents/skills/kairn-publication-access/SKILL.md) | Audience/export grants, preview/publication, highlights and restrictions | Server authority, exact versions, current checks, independent receipt and external-copy limits. |
| [expo-data-fetching](../../.agents/skills/expo-data-fetching/SKILL.md) | Actual transport/query integration | TanStack Query for fetched state, separate durable queues, generated clients. |
| [better-auth-best-practices](../../.agents/skills/better-auth-best-practices/SKILL.md), [security guidance](../../.agents/skills/better-auth-security-best-practices/SKILL.md) | Auth/session/recovery integration | Preserve current Better Auth and native protected storage; journey policy is separate. |
| [vercel-react-native-skills](../../.agents/skills/vercel-react-native-skills/SKILL.md) | Native lists/media performance and accessibility | Measure real consumers before adding packages. |
| [expo-animation](../../.agents/skills/expo-animation/SKILL.md) | Necessary interaction motion after navigation is stable | Reduce motion; no automatic camera movement or new dependency without review. |

Applied to this document: Impeccable planning/context, Expo overview/router, Kairn architecture context from this thread, capture/sync and publication/access. Other listed skills are recommended for the corresponding future implementation task, not claimed executed here. Platform research links and local authority documents are in §1.

## 12. Specification verification record

Checked 5 November 2026 against source baseline `4a6528e728bc4c799a957730dcd6244b65417ab7` plus this documentation-only delta. Windows was the authoring checkout. No application, dependency, native build or provider configuration was changed by this work.

| Check | Executed result and limit |
| --- | --- |
| Canonical inventory | All A01–A09 retained; 48 distinct screen/overlay contracts, each containing authority, incoming/outgoing connections, Back, components, functions, recovery, data boundary and traceability. These are not 48 new top-level destinations. |
| Navigation consistency | 143 explicit forward-action edges; every endpoint declared; every screen reachable from roots/global handlers; per-screen incoming/outgoing lists exactly match the edge ledger. Global Back/auth/denial edges remain explicit separate rules. |
| Boundaries | Seven declared OS/external entry/exit boundaries with input/return behavior. No unresolved literal destination ID. |
| Requirement references | 109 distinct functional IDs referenced by screen contracts and checked against the requirements register. This is design traceability, not completion evidence or a one-to-one implementation claim. |
| Remaining functional-ID handoff | ASK-01 and ASK-03–09 belong to the approved search/question workflow reached through X.reader; source/transcript review here includes ASK-02. Their account/quota/provider/abstention/citation states remain required by the public Learn/question specification, not a new native chat screen in this workstream. |
| Local references | 79 Markdown link targets checked after the visual reset, including explicit screen anchors and local document/skill files; local targets resolved. External research was inspected separately as recorded in §1.3. |
| Manual policy review | Checked sole-administrator and restricted People rules, staged-import audience choice, save acknowledgement, offline restriction intent, unchanged-original ownership, exact preview, external-copy limits and logged-out operation status. |
| Whitespace | Changed documentation checked for whitespace errors; no application tests were needed for this documentation-only task. |

The consolidated executed checks are recorded in [workflow review](workflow_review.md); temporary authoring output is not a maintained deliverable. Browser/device flows, screen-reader behavior, actual exports/imports, native persistence, API permissions and full-product acceptance were not executed in this task. The proposed design and open business/qualification decisions remain reviewable in this document.
