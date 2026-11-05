# Accounts and journey access: experience handoff

Date: 3 November 2026. Status: detailed experience handoff; the first B01 web forms, empty/no-cover, powers and restriction specimens are implemented. Full compositions, native components and integrated acceptance remain pending; see [execution progress](accounts_journeys_access_progress.md). Read with the [implementation plan](accounts_journeys_access_plan.md) and [research](../research/accounts-journey-access/analysis_2026-11-03.md).

Independent-review reconciliation: [findings and dispositions](../research/accounts-journey-access/review_2026-11-03.md). The [selected baseline](accounts_journeys_access_decisions.md) now fixes authority, lifecycle and limits; former visual asset choices have been reopened for implementation plan 1.2. Real rendering/API/device acceptance remains required.

[DESIGN.md](../../DESIGN.md) owns fresh visual planning; no visual direction is currently selected. This document specifies its first delivery handoff: account access, private history, journey setup, membership/People, permission primitives and lifecycle feedback. It adds no new visual identity or product scope. Screen references below refine existing A01/A06/A09/W01/W06/W09 and shared entry flows; they do not renumber the core inventory.

## 1. Experience goal

A first-time participant should understand three facts without reading documentation: this is one shared journey, their personal material stays private, and each action has a clear audience and consequence. An organiser should invite people and manage powers without mistaking administration for ownership of their files. Returning users should reach their journeys quickly and trust what happened after a save, error or access change.

Account and People screens need clear tasks, audiences and results. Their visual identity and composition will be designed afresh.

## 2. Functional component requirements

### 2.1 Visual choices reopened

Select colors, typography, spacing, shapes, icons, imagery, motion and layout through DESIGN.md. Existing component values and font assets do not constrain those choices. Keep the selected rendering/styling architecture, current field validation, accessible interaction, safe native Back and keyboard behavior. New assets need appropriate licenses and actual rendering checks; selected semantic roles must be verified in context.

### 2.2 Build a small useful component set

| Primitive/pattern | Required behavior and states |
| --- | --- |
| Action/button | Primary/secondary/tertiary/destructive; default, pressed/focus, disabled and pending. Pending retains label/width and accessible operation name. |
| Field/group | Persistent label, optional hint, required/optional meaning, validation/error, correct keyboard/autofill, help linked to the control. Never placeholder-only labeling. |
| Password field | Show/hide with accessible label/state, password-manager and paste support, correct new/current-password semantics, no password echo in analytics. |
| Form status | Field errors plus a safe submit summary, pending indication, retry retaining values, and intentional error focus. |
| Journey card/row | Same canonical title/date/identity across surfaces, controlled role/status metadata, permitted member presentation, deliberate no-cover state, one clear open action. |
| Person/invite row | Display identity, explicit powers, pending/expired/accepted state, safe contextual actions. Emails appear only where the workflow authorizes them. |
| Capability editor | Independent power facts; coauthor/publisher edits with explicit save, review-audience impact, current revision and error recovery. Administration has a separate accepted-transfer action, not an extra-admin checkbox or bundled role dropdown. |
| Source-scope selector | Full labels: Only me; Journey review; Allow journey publication and sharing. Name the review audience. Kept separate from original-export approval. |
| Impact confirmation | Named resource/action, affected scope, retained items, any required reauthentication and second confirmation. Cancel preserves the current state. |
| Restriction status | Immediate-deny/pending-confirmation, completed receipt, retry-in-progress and failed confirmation. Persistent status is authoritative; a toast alone is insufficient. |
| Data states | Layout-preserving loading, true empty, filtered-empty, refresh failure, offline, session-expired, permission-denied and generic unavailable. |
| Notices | Actor/display identity where permitted, safe object description, effect and next action. Unavailable targets remain generic. |

Create platform components only when a real screen needs them. Keep screen-specific compositions beside their feature; extract repeated structures once their contract is clearer than their implementation. A development-only specimen route should show the actual primitives/states without adding a public design-system product area or a new component-explorer framework.

## 3. Screen and route inventory

Paths are selected route patterns for B01 contract/route implementation, not existing routes. Web and native can use different route files while preserving deep-link intent and canonical IDs. Native files stay in `src/app`, implementations in `src/screens` and `src/components`.

| Flow reference | Selected web route | Native placement | Main composition and result |
| --- | --- | --- | --- |
| E01 Account entry | `/sign-in`, `/create-account` | Signed-out stack | Brief identity statement, compact form, recovery/switch-account actions; success opens intended destination or Your journeys. |
| E02 Verification | `/verify-email` | Link/result stack | Explain next step, resend with honest cooldown/status, wrong-account route, expired/consumed/failed states. |
| E03 Recovery | `/recover`, `/reset-password` | Recovery/link stack | Generic request acknowledgement, new-password form, expiry/reuse recovery, deliberate return to sign-in. |
| E04 Reauthentication | Contextual dialog/page | Contextual native sheet/page | Explain the sensitive action, preserve its intent, revalidate impact afterward. |
| E05 Private history | `/journeys` | A01, Journeys | Page title/actions, relevant invitations/attention, filter controls, journey list, distinct Saved research area only when implemented. |
| E06 Create journey | `/journeys/new` | A01 stack form | One short labeled form, timezone context and inline date errors; committed success opens the new canonical journey. |
| E07 Invite resolver | `/invite` with a secret-handling mechanism selected in B01 | Cold/warm link and manual code entry | Resolve safely, then show valid recipient's journey/inviter/date/powers/privacy facts; explicit accept or decline. |
| E08 Journey overview/details | `/journeys/{journeyId}` and details editor | A06 overview | Identity/date/status, own powers, useful current actions and notices; no invented story/media/progress metrics. |
| E09 People/invitations | `/journeys/{journeyId}/people` | A06 People stack | Admin management, scoped roster or own-membership view, invitation status, capability edit and transfer entry. |
| E10 Private profile | `/account/profile` | A09, You | Display name, optional bio/avatar, private-email explanation, save and avatar-remove states. |
| E11 Sessions/security | `/account/security` | A09 settings stack | Current session, other device sessions, revoke controls, recovery/password management and sign-out. |
| E12 Journey lifecycle | Contextual named action routes/sheets | Journey overflow stack | Separate leave, transfer, archive and canonical-delete previews/results. |
| E13 Account deletion | `/account/delete` | A09 destructive flow | Cross-journey responsibilities, transfer/freeze choice, own-data impact, fresh session, confirmation, durable status. |
| E14 Restriction status | `/operations/{operationId}` | Contextual operation detail | Persistent immediate-deny and recovery-confirmation result, bounded retry, safe navigation away/back. |
| E15 Access unavailable | Generic route/error boundary | Generic screen | No protected title, cover, location, email or roster; safe exit and sign-in only when useful. |
| E16 Notices | Scoped attention list/detail | Journeys/You attention entry | Invitations, capabilities, transfer and lifecycle events introduced in this slice; no fabricated global social inbox. |

Use opaque IDs in route parameters; validate them at the boundary. A route guard never substitutes for server authorization. Resume an invite only after auth storage/session hydration; a successful login must not automatically accept it.

The full native IA still contains Journeys/Capture/Moments/You and the full web workspace remains as specified in application design. During this slice expose working destinations and actions; do not ship dead Capture/Story/Publish buttons. Add those destinations with their actual later workstreams. Do not turn the setup status screen into the consumer home or let unauthenticated readers be forced through creator sign-in.

| Navigation area | This slice, as its real batch completes | Deferred until functional |
| --- | --- | --- |
| Native bottom destinations | Journeys and You. | Capture and Moments with capture/source workflows. |
| Native journey tools | Overview and the scoped People flow. | Story, Route, Learn, Sources, Publish and highlights. |
| Creator web | Your journeys, create/join, account/security and real notices; journey Overview/People/contextual lifecycle. | Saved research, Discover and editorial/publication tools. |
| Contextual controls | Only currently authorized, implemented operations. | No enabled placeholder/export/publish/capture action implying nonexistent behavior. |

This staged exposure implements the full product IA incrementally; it is not a replacement navigation design. G12 checks that every visible destination has a real primary task and useful failure/back path.

## 4. Detailed workflow behavior

### 4.1 First account, verification and returning access

1. Show display name, email and password with visible labels and concise guidance. Existing-account sign-in and recovery remain obvious.
2. Validate locally for quick correction; server validation is authoritative. Submit preserves inputs on failure. No invented account-existence details in recovery responses.
3. Verification-required state explains that email access is needed before private/shared actions. Provide rate-limited, enumeration-safe resend even if account creation committed but enqueue failed. Resend reports queued/SMTP-accepted/failed according to known facts; SMTP acceptance does not mean the recipient received the message. Expired/unavailable payload requests a fresh library token.
4. Verification/reset links work on web and native cold/warm starts, with a usable web/manual fallback. Expired or consumed links offer a fresh request. Do not render raw tokens.
5. After verified sign-in, show the intended invite/journey if still available; otherwise Your journeys. A changed account cannot inherit another account's cached data or invite acceptance.
6. Sessions/security identifies the current session and permits revoking another or all eligible sessions. A revoked device receives a safe expired-session state on the next protected interaction.

Passwords support paste/autofill and show/hide. Do not add memory puzzles, prevent password managers or invent social-login options before they are implemented. Preserve only non-secret form intent across navigation; avoid persisting passwords/reset tokens in ordinary application storage.

### 4.2 Your journeys and empty history

Header: **Your journeys**, with **Create journey** primary and **Join with invite** secondary. Attention is a small relevant section, not a row of empty dashboard statistics. A true first-use state explains that journeys created or joined appear here and offers the same actions.

Cards show title, intended dates/time context, role/capabilities and real lifecycle state. A past intended date does not prove completion. Member stacks or counts require the approved roster-disclosure rule. Multiple roles affect labels/filter matches, not row counts. Former membership can retain a minimal reference; opening it always rechecks access.

Role/status/year/category filters preserve their state on return. Filtered empty offers **Clear filters**. Loading never flashes an empty-account message. Failed refresh can retain safe previously loaded history for the same session with an explicit stale/offline message; a confirmed denial removes protected data immediately. Saved research is never mixed into participation totals and arrives with its later functional workstream.

### 4.3 Create and correct journey details

Form order: title; intended start date/time; optional end; timezone; optional category. Use a sensible device timezone as an explicitly shown suggestion, not an invisible assumption. Explain dates as intended/correctable history context, without adding itinerary, booking or packing fields.

Reject whitespace-only/over-limit titles, unsupported zone values and end-before-start. Handle daylight-saving gaps/ambiguous local times with a correction or explicit offset choice. Preserve original zone/offset context. Use the selected optional hike/trek, cycling, road-journey or other category, unset by default; year follows the canonical start in its stated timezone.

Create remains pending until the server confirms the canonical ID. Timeout retry uses the same command identity. Success opens that journey and offers **Invite companions** when permitted; capture becomes an action when the capture workflow exists. Later date corrections use the current revision and must not change journey identity or delete sources.

### 4.4 Invite and accept

Admin: enter recipient email, optionally offer coauthor/publisher powers, read the audience effect, send, then see pending/expired/revoked/accepted or delivery-failed state. Ordinary participant is the default; administration is not an invitation checkbox. No gallery/photo selection is requested.

Recipient: resolve a valid invitation, sign in/verify the invited account as needed, then inspect the journey, inviter's permitted display identity, dates and powers. State plainly: **Joining does not share your gallery or existing moments.** **Accept invitation** commits once and opens the same journey. Decline stays a separate action.

Invalid/revoked/expired/wrong-recipient responses reveal no roster or private account fields. A wrong-account prompt offers switch account without disclosing the full invited email. An already accepted invite may navigate to current permitted membership; it must not restore a membership revoked afterward. Never accept on link GET, verification callback or a preview bot request.

When a former member accepts a new invitation, explain the new explicit powers. Old administrative/editorial powers and original-export approvals do not silently return with the historical journey reference.

Use **Resend invitation** only for the same valid pending offer with unchanged expiry/powers and an available protected mail payload. Otherwise use **Send a new invitation** after current authority checks. Do not resurrect expired/revoked/accepted states. Removal/leave invalidates all prior outstanding offers for the guarded recipient; a second old invite cannot act as a new admission.

### 4.5 People and capability changes

Use grouped rows with each applicable power named independently: manages people/administration, edits the shared story, approves publication. A participant is an accepted member; contributing one's own material does not require an administrator to award ownership.

There is one current administrator. Display that fact and a **Transfer administration** action; grant the new administrator only after an eligible existing coauthor accepts. Coauthor/publisher remain independently editable. Do not render or accept a second-administrator checkbox.

Admin-only management actions live beside the person/invite. Other members see only the scoped information the approved roster rule permits. An administrator without editorial powers sees management controls and safe identity/status, not draft/review content. A publisher without coauthoring can later inspect draft/preview but sees no edit controls.

Adding coauthor or publisher capability explicitly warns that it can expand access to contributed review material, as contributors were told by the source-scope selector. Save waits for authoritative current-state acceptance. Stale revisions preserve the proposed selection and offer reload/compare. Removal immediately clears affected protected UI and opens the persistent restriction result when confirmation is pending.

### 4.6 Profile, avatar and account controls

Display name and bio are private-account profile edits until an explicit public-display feature selects fields. Label email private. Support optional bounded avatar selection/removal with validation and failure recovery; use initials if absent or unreadable. Never accept an arbitrary remote avatar URL that leaks visits or bypasses media controls.

Avatar processing/storage/deletion is its own small identity-media boundary if delivered here, with type/size validation and metadata stripping. It is not a journey source and cannot accidentally be included in a source/export grant. Do not request full-gallery access to select one profile image. Own-data export includes the profile data/assets introduced now without a payment gate.

Account deletion shows every affected administration responsibility and the relevant own-data policy. Complete an accepted transfer or explain the no-successor freeze; do not invent a successor. After commit, revoke sessions and prevent sign-in/old tokens from reopening protected state. Delayed purge and pending journal confirmation remain distinct from completed deletion.

A narrowly scoped read-only operation receipt permits minimal pending/complete status after logout without reopening the account. Do not expose journey names, personal details or a general account session through that status path. Confirmation retry is server-owned or requires the separately authorized actor; a status receipt cannot authorize a new write.

The receipt lives outside account-scoped Query/form state: a separate native SecureStore namespace or a dedicated path-scoped web HttpOnly status cookie. The status route remains available outside signed-in guards through logout, relaunch and account switching without loading deleted-account data. Show its disclosed finite recovery/status window and a safe support path on expiry; never store the bearer value in the route, analytics or Query key.

For this post-deletion view, the action is **Check status** while the coordinator retries confirmation automatically. Show a write-capable **Retry confirmation** only to a currently authorized actor in an active-account flow.

### 4.7 Leave, transfer, archive and delete

Present separate entries and previews. Leaving ends membership powers while preserving the canonical journey for others and any permitted minimal history. Source grants are a separate decision; do not imply leaving automatically withdraws or transfers ownership.

Transfer names the eligible accepting coauthor and powers being moved. Offering it is pending; acceptance rechecks eligibility and state. Transferring administration does not silently grant or remove coauthor/publisher powers. With no remaining administrator, show the freeze on role expansion/new publication/visibility widening and retain allowed restrictive actions.

Archival closes contribution activity but is not unpublish or deletion. Canonical deletion clearly affects the shared record/references, with other members' private originals retained. Broad deletion requires a second explicit confirmation using the resource identity. State changes while the preview is open require a new preview; reauthentication alone cannot authorize stale impact.

The implementation plan's sections 5.3–5.4 and selected D10 supply the archive/deletion matrices: retained read/export rights, closed expansion/offers, owner restrictions, source/export-grant invalidation and retention. Canonical deletion is the current administrator's privileged action with fresh authentication, current impact and two explicit confirmations including typed title. It requires no independent countersignature; do not label it group consent. Account deletion withdraws the deleting owner's reuse/export permissions; no keep-sharing-after-deletion checkbox is offered in this slice.

### 4.8 Source/export controls and staged activation

Specify these primitives now, validate them with clearly labeled development fixtures, and activate their real screens alongside capture/import/contribution/export workflows. No production placeholder may claim a file is shared, backed up, downloadable or revoked when that integration does not exist.

Source-scope choices name both audience and publication consequence. Only me means no journey grant; Journey review excludes public reuse; Allow journey publication and sharing applies to this journey's approved uses. Batch selection lists the affected sources and preserves individual failures.

Original export is a separate request/approval: named recipient, exact files, per-source grant revisions, expiry, and the warning that downloaded copies cannot be recalled. No default checked permission or generic “share everything” switch. Revocation blocks future managed downloads and shows the same restriction-confirmation distinction. Full acceptance includes archive generation and GET/HEAD/Range enforcement when file delivery exists.

With real source workflows, add an owner-only **Your contributions** entry from You/Moments and the corresponding web account area. It lists only the person's sources/minimal permitted journey references and preserves withdrawal/own export after departure without reopening a protected journey workspace. Keep it hidden until actual sources exist; a former member's ordinary journey URL remains generic unavailable.

### 4.9 Honest restriction feedback

After a restrictive transaction, protect the interface immediately. If independent persistence is pending, show **Access restricted. Recovery confirmation pending** with a status link and safe retry. On receipt confirmation, show **Restriction complete**. Neither the button nor a toast says the operation completed while its receipt is unknown.

Back/refresh/relaunch should recover operation status from the server; failure to fetch status does not re-enable access. Repeat retry uses the same event. An old screen, expired impact token or stale queued action cannot widen rights.

## 5. Layout, interaction and content ranges

| Context | Required adaptation |
| --- | --- |
| Compact web / phone | Single main pane; short forms scroll; primary action stays reachable above keyboard/safe area; native forms use an appropriate stack/sheet/page. No horizontal scrolling needed to read permission facts. |
| Tablet / iPad | Constrain form width; use main list/detail or management drawer where it helps. Rotation preserves draft, selection and operation status. Avoid stretching a phone dialog across the screen. |
| Wide web | Stable navigation, readable main list/form and contextual details; use extra panes only for real content. Account access is still a focused form, not a three-pane dashboard. |
| Keyboard/screen reader | Logical headings/order; labeled controls, selected/busy/disabled state; errors associated with fields; focus moves to a result/error deliberately and returns to the trigger after dismissal. Sticky actions never hide focused controls. |
| Larger text | Rows grow and labels wrap; do not disable scaling, clamp essential permission copy or hide actions. |
| Reduced motion | Preserve state/selection without entrance choreography, camera motion or animated layout dependence. |

Use synthetic, clearly labeled development fixtures for: no journeys; one journey with no cover; five accounts sharing one ID; several capabilities; long title/name/bio; many paginated journeys; pending and expired invites; last-administrator departure; revoked access during a form; offline save/retry; and delayed restriction confirmation. Never insert synthetic journeys into a real user's history.

Every active screen needs first-load, success, empty where meaningful, field error, failed save, offline, expired-session and denied/unavailable behavior. A refetch failure differs from a confirmed denial: preserve permitted content for the former and clear protected content for the latter. Disable repeat submission while pending, preserve the draft on error and dismiss only after accepted success. Policy-expanding mutations are online, server-confirmed operations in this slice.

## 6. Copy and interaction checks

| Avoid | Use | Reason |
| --- | --- | --- |
| “Member can access everything” | Name each available power and source scope. | Membership does not expose private galleries or originals. |
| “Shared” for an uploaded file | Actual private/review/publication state. | Upload is not contribution or publication. |
| “Success” after journal timeout | “Access restricted. Recovery confirmation pending.” | Distinguishes local denial from recovery assurance. |
| “Delete trip” for departure | “Leave journey.” | Departure does not erase the canonical group record. |
| “Admin owns all files” | Explain administration separately from source ownership. | Preserves contributor rights. |
| Spinner replacing every screen | Stable skeleton or inline pending/refresh state. | Preserves context and perceived responsiveness. |
| One generic permission chip | Explicit scope selection and audience explanation. | Makes consequences understandable. |

Keep action names consistent from button to result. Avoid misleading readiness scores or imagery that fabricates journey evidence. Motion should explain a person's action, not hold up routine use.

## 7. Design acceptance and handoff packet

Before each feature batch is called complete, supply:

- Screen/route and requirement IDs, actual API/query/mutation wiring, permitted actor variants, field rules and all material states.
- Compact phone, iPad/tablet and desktop compositions using the same actual components/tokens, with long-content and missing-media examples.
- A primary-task walkthrough including one failure/retry, back/dismiss behavior, keyboard operation, focus management and session/access change.
- Actual native font/control rendering, Android back/safe areas, iPhone simulator/iPad layout, larger text, reduced motion, TalkBack/VoiceOver, and web keyboard/automated accessibility evidence.
- A batched visual inspection of the relevant viewport/device classes, one grouped fix pass and one confirmation pass. Broaden only for a concrete unresolved failure; do not turn polish into an unbounded loop.
- Evidence that role controls match current server policy, account switching clears prior content, and no UI success overstates a pending operation.

UI/UX acceptance is mandatory alongside the corresponding API/data acceptance. Database completion alone does not complete this handoff, and a static mockup does not prove the behavior. Physical iPhone acceptance remains a separately recorded deferred device item until available; new auth/storage behavior needs fresh evidence on the devices actually exercised.
