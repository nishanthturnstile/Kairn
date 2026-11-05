# Product requirements

| Document field | Value |
|---|---|
| Version | 2.3 |
| Date | 1 November 2026 |
| Status | Complete R1 requirements with permissions, recovery, delivery order, and release validation reconciled. This document is not implementation evidence. |
| Product owner | Founder. |
| Delivery approach | Direct implementation of the complete agreed production product. |
| Document responsibility | Complete functional requirements in journey order, supporting rules, acceptance evidence, release obligations, and source traceability. |
| Companion document | [Product plan and vision](product_plan.md), the product and strategy reference. |
| Technical decisions | [Architecture section 14](architecture.md#14-canonical-stack-and-dependency-register) owns the selected stack, versions, and installation stages. |
| Requirement identity | All 117 original functional IDs and 25 decision IDs are retained. |

## Contents

1. [Purpose, scope, and journey order](#1-purpose-scope-and-journey-order)
2. [Shared journey model and permissions](#2-shared-journey-model-and-permissions)
3. [Account, profile, and private history](#3-account-profile-and-private-history)
4. [Create or join a journey](#4-create-or-join-a-journey)
5. [Capture, offline saving, and synchronisation](#5-capture-offline-saving-and-synchronisation)
6. [Import existing media and recordings](#6-import-existing-media-and-recordings)
7. [Contribute and coauthor with explicit rights](#7-contribute-and-coauthor-with-explicit-rights)
8. [Reconstruct chronology, chapters, and route](#8-reconstruct-chronology-chapters-and-route)
9. [Edit the canonical story](#9-edit-the-canonical-story)
10. [Practical details and lessons](#10-practical-details-and-lessons)
11. [Review, publish, and republish](#11-review-publish-and-republish)
12. [Read Story, Explore, and Learn](#12-read-story-explore-and-learn)
13. [Share approved personal highlights](#13-share-approved-personal-highlights)
14. [Discovery, public profiles, and saved research](#14-discovery-public-profiles-and-saved-research)
15. [Search and questions about the journey](#15-search-and-questions-about-the-journey)
16. [Withdrawal, transfer, export, and deletion](#16-withdrawal-transfer-export-and-deletion)
17. [Quality, security, limits, and operations](#17-quality-security-limits-and-operations)
18. [Implementation order and complete release](#18-implementation-order-and-complete-release)
19. [Decisions required before release](#19-decisions-required-before-release)
20. [Acceptance scenarios and definition of done](#20-acceptance-scenarios-and-definition-of-done)
21. [Traceability and inherited baseline](#21-traceability-and-inherited-baseline)
22. [Inherited research constraints and references](#22-inherited-research-constraints-and-references)

## 1. Purpose, scope, and journey order

This document defines the complete high-level functional requirements and the quality, privacy, operational, and release obligations that support them. It is the implementation reference. The [product plan and vision](product_plan.md) explains the problem, audience, comparisons, strategy, and success measures.

The baseline comes from product plan version 1.2, dated 1 November 2026. All 117 original functional requirement IDs and their scope labels are preserved. The supporting rules in each section are requirements too, including rules that were originally outside the functional tables. The split reorganises scope without adding a reduced release or marking any feature implemented.

### 1.1 Scope labels

| Label | Meaning |
|---|---|
| R1 | Required for the first complete community release. |
| Conditional R1 | Desired for that release only after feasibility, permission, licensing, and cost checks. A usable fallback is required. |
| Later | Outside the first complete release. Requires a separate decision based on usage. |

### 1.2 Platform and capability baseline

| Area | R1 baseline | Conditional or later |
|---|---|---|
| Creator devices | Android capture and contribution; the same agreed native flows implemented and verified locally on iOS during this build. Responsive web editing and import management. | Android is the first public mobile target. Apple membership and iOS public distribution are deferred. Supported OS/device floors follow platform tests. |
| Capture | Photos, short video clips, voice notes, and text. One-time location requests around capture when permitted. | No continuous recorder. |
| Existing media | User-selected media import and date-based organisation within accessible items. | Whole-library date scanning is Conditional R1. Silent gallery monitoring is excluded. |
| Recorded routes | Optional GPX and FIT import. | TCX, KML, KMZ, and GeoJSON later if needed. Direct platform sync later and conditional. |
| Reconstruction | Chronology, candidate chapters and stops, editable legs, source labels, and explicit gaps. | OCR or visual place suggestions and provider-calculated travel geometry are Conditional R1. |
| Accounts and history | Account profile, private created and joined journey history, saved research references, and an optional public profile. | Rich statistics, automatic import of all third-party history, and follower features later. |
| Collaboration | One canonical journey, coauthor editing, scoped sources, basic revision recovery, conflict detection, and designated publication. | Character-level simultaneous coediting and complex voting workflows later. |
| Viewing | Story, Explore, Learn, all-days and day filters, 2D Map/Satellite switching, and basic user-started playback. Maps initialize on an explicit map action. | 3D, cinematic camera controls, and rendered video exports later. |
| Learning | Practical cards, source links, reported dates, text search, grounded questions, and saved reference journeys. | Cross-journey answer aggregation and full preparation workspaces later. |
| AI input | Owner-authorised or permitted contributed sources for private transcription and draft suggestions. Only publication-approved text, captions, details, and supported transcripts enter viewer answers. | Exhaustive video visual understanding and universal landmark recognition later. |
| Sharing | Private draft, journey review, unlisted links, public publication, personal highlight links, and a simple social image card. | Rendered reels, animated social exports, embeds, and audience passwords later. |
| Discovery | A basic public-journey catalog with metadata filters, one result per event, and listing moderation. | External search-engine indexing and recommendation algorithms later. |
| Ownership | Export of own uploads and story data, deletion, unpublishing, and contribution withdrawal. | Designed PDF keepsakes, viewer downloads, and print products later. |

The initial interface language is English. Preserve the source language of contributed material. Declare supported transcription languages after verification.

The confirmed implementation uses Unistyles v3 for Android/iOS styling and Tailwind/shadcn for web, sharing plain design tokens whose visual values will be selected through the fresh design process. NativeWind is excluded. This styling choice does not change functional scope or accessibility obligations. [Architecture section 14](architecture.md#14-canonical-stack-and-dependency-register) owns package versions; the [design hub](../../DESIGN.md) owns fresh visual choices and the [application experience requirements](application_design.md#9-component-system) preserve functional component obligations.

The [mobile development plan](../implementation/mobile_development_plan.md) governs local host allocation, free Apple provisioning, and native verification. Development uses local Expo builds without an EAS subscription. Windows/WSL hosts application containers; Windows native hosts Android tools; the 16 GB Mac hosts iOS builds with the available iPhone/iPad for real-device checks. The user confirms prior Mac compatibility testing, so another inventory check is not an implementation gate. Local iOS behavior is part of the agreed build; TestFlight/App Store distribution and paid-entitlement checks follow a later Apple enrollment decision. This distribution deferral does not defer native implementation or replace any R1 functional requirement.

### 1.3 User-journey sequence

Creators and visitors enter through different paths. Capture and import are alternative source-acquisition paths that can also be combined.

| Creator order | User goal | Requirement sections |
|---|---|---|
| 1 | Sign in and see a private profile and journey history. | 3 |
| 2 | Create one journey or join the existing group event. | 4 |
| 3 | Capture and save offline, import existing sources, or do both. | 5 and 6 |
| 4 | Contribute selected sources and collaborate with explicit rights. | 7 |
| 5 | Reconstruct chronology, geography, chapters, and the shared story. | 8 and 9 |
| 6 | Record sourced practical arrangements and lessons. | 10 |
| 7 | Review rights and privacy, preview the viewer experience, and publish deliberately. | 11 and 12 |
| 8 | Share approved personal highlights. | 13 |

| Visitor order | User goal | Requirement sections |
|---|---|---|
| 1 | Discover a public journey or open an approved direct link. | 14 and 12 |
| 2 | Read Story, Explore, and Learn, inspect sources, and search approved text without signing in. | 12 and 15 |
| 3 | Sign in when saving research or starting a question session. | 3, 14, and 15 |
| 4 | Save a reference or ask questions grounded in that journey's accessible approved sources. | 14 and 15 |
| 5 | Optionally create a distinct future journey with a reference to the earlier event. | 4 and 14.3 |

Contribution can happen during capture or after import. Correction, withdrawal, transfer, departure, archival, export, deletion, privacy, and permission checks apply throughout. [Section 18](#18-implementation-order-and-complete-release) defines the separate implementation dependencies.

The document groups related requirements without changing their stable section numbers or IDs:

| Group | Sections | Responsibility |
|---|---|---|
| Foundation | 1 and 2 | Scope, shared concepts, roles, and permissions. |
| Creator workflow | 3 through 11 | Account setup, source acquisition, contribution, composition, and publication. |
| Published experience and reuse | 12 through 15 | Viewing, personal highlights, discovery, saved research, search, and questions. |
| Controls across every workflow | 16 and 17 | Lifecycle, quality, security, limits, and operations. |
| Delivery and release | 18 through 20 | Build dependencies, remaining decisions, acceptance, and release readiness. |
| Reference appendices | 21 and 22 | Historical traceability, current decision application, and dated research. |

### 1.4 Exclusions and later scope

The [Kairn ecosystem direction](ecosystem_direction.md) maps reusable toolkit responsibilities onto the requirement families below. It is a design direction, not additional R1 scope: basic Explore playback, metadata/placement review, privacy enforcement and permitted data export remain R1; external package distribution, embeds, additional route formats, richer cinematic playback, self-hostable story websites and designed print/video outputs remain later. Existing Conditional R1 labels and fallbacks are unchanged. Toolkit extraction must preserve these permission, evidence, accessibility and lifecycle requirements.

- Continuous location recording, live location following, navigation, SOS, rescue coordination, and offline messaging.
- A booking marketplace, permit reseller, guide marketplace, or travel-payment service.
- A social feed, follower network, comments, likes, streaks, or engagement gamification.
- Automatic publication of a person's gallery or location.
- Claims that a historical route is safe, currently accessible, or legally permitted.
- Fabricated experiences, missing GPS points, prices, identities, or transport details.
- Preparation task management, shared packing allocation, identity-document collection, and group expense settlement.
- General travel advice presented as if it came from this journey.

Recording what the group carried, rented, paid, or arranged is included. Planning what a future group must carry or book is a later workflow.

R1 also excludes independent factual stories for each participant, per-share answer indexes, general activity-file repair or conversion, and a global authoritative route database. Face recognition is not required in R1.

Additional formats, cinematic or animated exports, embeds, audience passwords, viewer downloads, designed PDF keepsakes, print products, external search indexing, algorithmic recommendations, full preparation workspaces, and cross-journey answer aggregation remain later. The capability table distinguishes Conditional R1 suggestions from those later features.

## 2. Shared journey model and permissions

### 2.1 Core concepts

| Concept | Definition | Rule |
|---|---|---|
| Journey | Shared event, membership, dates, common narrative, and stable identifier. Trip is an everyday synonym, not another event object. | One group event has one canonical journey and one published account. |
| Account history entry | A person's participation or administration reference to a journey. | The same journey appears once per account without copying its narrative or media. |
| Personal capture | Material captured or imported by one person before contribution. | Private unless that person selects another destination or sharing scope. |
| Moment | Media or an observation with time, location evidence, contributor, and provenance. | Time captured, time uploaded, and time edited remain distinct. |
| Contribution | A moment made available to the journey under an explicit sharing grant. | Membership alone grants no access to a person's gallery. |
| Story | The canonical journey's editorial presentation in Story view. | It is not an independently owned journey variant. |
| Personal share presentation | Selected approved moments, a cover, and a sharing caption referencing the canonical journey. | It has no independent chronology, discovery record, or question index. |
| Chapter or day | Ordered part of a story, usually a calendar day or meaningful stage. | May have no GPS, several recordings, overnight travel, or a custom label. |
| Travel leg | Movement between stops or chapters. | Transport type, geometry source, and uncertainty are independently recorded. |
| Recorded segment | Continuous geometry supplied by an imported recording. | Gaps remain gaps. Several people's copies do not multiply distance. |
| Practical detail | Reported arrangement, cost, item, lesson, or unresolved question linked to sources. | Retains observation date, scope, and attribution. |
| Published version | Approved canonical journey snapshot and its viewer-safe derivatives. | Ordinary draft edits stay private. Rights changes override every hosted presentation. |
| Saved research reference | A bookmark and optional private note about another journey. | It is not a completed activity or a copied journey. |

### 2.2 Roles and authority

One person may hold several roles. All five trusted members can be coauthors. Source ownership, editing, publication, and sharing remain separate authorities.

| Role | Authority |
|---|---|
| Journey administrator | Manages invitations, roles, administrative transfer, and archival. The creator starts in this role. |
| Participant | Appears as an accepted member. Reads permitted approved publications, with no automatic access to private captures, review sources, the shared draft, or editing. |
| Contributor | Selects their own material, sets its sharing scope, and can withdraw it. |
| Coauthor | Edits common chapters, narrative, captions, and selected moments in the shared draft, with revision history and conflict checks. |
| Designated publisher | Approves canonical publication and visibility changes. The creator starts with this capability; the administrator can assign it explicitly. |
| Member sharing an approved journey | Creates a personal share from eligible published material without changing canonical facts or visibility. |
| Viewer | Reads the version accessible through their link or access grant. Has no draft or source-library access. |

A coauthor can exclude a moment from the narrative without deleting another person's original. Editors do not gain permission to publish review-only sources. Personal sharing of an already approved publication does not require approving the whole journey again, but it cannot add unpublished media or widen visibility.

A named publisher provides a clear release decision. R1 does not require unanimous approval from every coauthor for every edit. Each contributor's source-use grant remains necessary and can be withdrawn independently.

### 2.3 Source-sharing scopes

| Scope | Who can see it | Publication authority |
|---|---|---|
| Only me | Capture owner. | Not eligible for the shared publication or personal share outputs. |
| Journey review | Source owner and active journey members with coauthor or designated-publisher capability. | No public reuse until the contributor grants it. |
| Allow journey publication and sharing | The same review audience, plus viewers of approved presentations of this journey. | Eligible for the canonical publication and permitted personal shares, with attribution and current source checks. |

The interface explains these scopes in plain language and supports batch choices. Contributors can opt into sending future in-app captures to journey review. Normal-camera gallery suggestions remain local until the person approves adding them. Publication permission for this journey is not a general licence to reuse the source in unrelated journeys.

### 2.4 State and access rules

Personal capture, local selection, private cloud upload, journey review, shared draft, and approved publication are distinct states. Only the explicit source grant and the current journey access permit reuse. Joining, uploading, editing, or saving a reference never grants publication permission by itself.

Public contributor credit uses an approved display identity. Membership does not automatically publish the full participant roster, account fields, or home cities. A moment's source contributor, original photographer when supplied, people pictured, and participants actually present are separate facts.

The creator initially holds administration, coauthoring, and publishing capabilities. Coauthor editing, source ownership, administration, publishing, and personal sharing remain separate capabilities throughout the journey.

### 2.5 Capability and source-access matrix

Each capability applies only within the current journey and source grants. A contributor always retains access to their own sources. Coauthors and designated publishers must be active members to review other contributors' sources. Administration alone grants no source-review, draft-editing, publishing, or original-file export rights.

| Operation | Required authority | Source and access limit |
|---|---|---|
| Read a personal capture or browse its private original | Source owner. | Ordinary membership, review, or publication does not expose another person's original. Export of specific originals uses the separate grant below. |
| Read contributed review media, metadata, and transcripts | Source owner, or an active coauthor or designated publisher. | Only contributed sources and review fields allowed by the grant. This is not access to the owner's personal library. |
| Read the shared draft and publication preview | Active coauthor or designated publisher. | Current review grants apply. Publishers can inspect without receiving editing capability. |
| Edit the common draft, restore revisions, or include/exclude moments | Active coauthor. | Current grants apply. Editing cannot delete another person's original or widen its scope. |
| Set or withdraw a source grant | Source owner. | An administrator, coauthor, or publisher cannot grant rights on the owner's behalf. |
| Manage invitations, capabilities, transfer, or archival | Active journey administrator. | Changes are explicit and audited. Adding a capability can change the review audience. |
| Approve publication, republish, change visibility, or unpublish | Active designated publisher. | Source grants and privacy review remain mandatory. A scoped operator can also impose a rights takedown. |
| Create personal highlights or a social card | Active journey member. | Only currently approved material whose grant permits sharing. Draft and review access do not make material eligible. |
| Read an approved publication | Viewer permitted by its current visibility and valid link where required. | Viewer-safe approved fields and derivatives only. Membership alone grants no private workspace access. |
| Export structured story data | Signed-in person with current access to that data. | Only permitted draft or approved fields and media. Export never widens access. |
| Export another contributor's raw originals | Active recipient member with a separate owner-issued original-file export grant. | Exact assets, journey, recipient, source-grant revision, and expiry must match. |

The source-scope interface names the review audience and explains that later coauthor or publisher assignments can change it. Adding an ordinary participant does not expose review sources. Revoking membership or a capability removes its protected access. Existing public reading follows normal public access rules.

### 2.6 Original-file export grants

An original-file export grant is separate from the three sharing scopes. Review access, publication reuse, a social card, and coauthor status never imply permission to export another contributor's original.

The recipient requests specific contributed originals for a journey. The owner reviews the recipient, asset list, and expiry, then explicitly grants or declines original-file export. The approval explains that originals can include metadata omitted from public derivatives. The grant records its ID, owner, recipient account, journey, exact asset IDs, source-grant revision, creation time, expiry, and revocation state. A batch approval still identifies every eligible asset. Only-me sources cannot be included in another member's grant.

The service checks the grant, active recipient membership, source revision, and expiry when generating an archive and on every managed download. Withdrawal, a narrower source grant, recipient departure, expiry, or explicit export-grant revocation blocks further managed export. The owner can still export their own originals without another person's grant or a payment gate. Explain that already downloaded copies cannot be recalled. These rules refine COL-02, COL-06, PUB-02, and OWN-02.

## 3. Account, profile, and private history

The person creates an account or signs in, can recover access, and opens a profile and private journey history. Public reading and discovery remain available without sign-in. Creation, contribution, coauthoring, publication, personal-share creation, saved references, private history, and question sessions require an account.

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| OWN-01 | Provide account creation and sign-in for history, collaboration, publishing, personal share creation, saved references, and questions. | R1 | A person can recover access and see only their permitted private resources. |
| PRO-01 | Create an account profile with display name and optional avatar or bio. | R1 | Private account details and email are not automatically public fields. |
| PRO-02 | Show one private history reference per created or joined journey. | R1 | Five participants open the same journey identifier from their own histories. |
| PRO-03 | Filter history by role, status, year, and available journey category. | R1 | Several roles or personal shares do not inflate the all-journey count. |
| PRO-04 | Separate saved research journeys from recorded or participated journeys. | R1 | Saving another group's trip never marks it as the person's completed activity. |

After sign-in, a person sees their account profile and a private history of journeys created or joined. The same journey appears once even when the person is creator, coauthor, contributor, and sharer. Filters can show role, status, year, or trip category without duplicating the underlying entry.

History contains journeys recorded in or explicitly imported into this product. It does not imply automatic import of the entire Strava or watch-account history. Saved journeys from other groups belong in a separate research collection and never count as completed personal activities.

Basic account fields are a display name, optional avatar, and optional bio. Email and private account details are not automatically public. The optional public profile is specified in [section 14](#14-discovery-public-profiles-and-saved-research), after eligible public journeys exist.

## 4. Create or join a journey

The organiser supplies a title, intended start time, optional end time, and timezone context. Companions accept an invitation into that same journey, with explicit roles and no implied gallery access. The person chooses whether future in-app captures remain personal or go to journey review.

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| TRP-01 | Create one journey with title, start time, optional end time, and timezone context. | R1 | Dates can be corrected without losing captured material. |
| TRP-02 | Give a shared event one canonical identifier, draft, and approved publication. | R1 | Five members and five personal shares still reference one journey. |
| TRP-03 | Invite, accept, revoke, and remove scoped members through the existing journey. | R1 | An accepted invitation opens the same journey. Revoked membership blocks protected workspace access. |
| TRP-04 | Support a participant who does not contribute media. | R1 | Joining creates no gallery access or editing grant. |
| TRP-06 | List created and joined journeys with roles and status. | R1 | A member sees one entry for the event despite several roles or shares. |

The creator starts one journey and invites the group into that same record. Each member's history points to its stable identifier. Coauthors edit the common draft and a designated publisher approves a version. Adding the journey to five accounts creates five membership references, not five journeys.

Personalisation changes presentation rather than the group's facts. A member can choose approved photographs, a cover, and a personal sharing caption. The canonical chronology, route evidence, practical details, source grants, and question index remain common.

Different groups or later departures on the same route create distinct journeys with different dates and observations. They are not duplicates merely because the destination matches. Joining an invitation opens the existing journey instead of creating another event. Suspected independently created duplicates require an explicit resolution rather than automatic merging of private records.

## 5. Capture, offline saving, and synchronisation

The person captures a photograph, bounded short video, independent voice note, text, or a remembered event. A completed local save does not wait for network access, transcription, or other AI processing.

### 5.1 Capture requirements

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| CAP-01 | Capture a photograph into an explicit personal or trip destination. | R1 | A saved capture appears locally even without network access. |
| CAP-02 | Capture a bounded short video clip with playback support. | R1 | Limits are shown before recording and the accepted output plays on supported viewers. |
| CAP-03 | Capture a voice note without requiring a photograph. | R1 | The note retains its capture time and can be played before transcription. |
| CAP-04 | Add text or a remembered moment with an author-specified event time. | R1 | Event time and entry time remain distinguishable. |
| CAP-05 | Attach a bounded foreground location observation when permitted. | R1 | Missing, approximate, and stale location cases save without a fabricated coordinate. |
| CAP-06 | Persist capture metadata and file references before claiming a successful local save. | R1 | A process restart after save recovers the moment. |
| CAP-07 | Support permission denial, cancellation, storage exhaustion, and interrupted recording. | R1 | The user receives an actionable state and existing captures remain intact. |
| CAP-08 | Never initiate continuous or background route recording. | R1 | Device and request logs show no location polling outside explicit capture actions. |

Capture records the original media, local capture time, available timezone context, contributor, trip destination, and location evidence. A location observation includes its own measurement time and accuracy. It is not automatically accepted merely because the device has a cached location.

The app requests location only around an explicit foreground action. If permission is denied, the fix is unavailable, or accuracy is unsuitable, it saves the moment with an unknown or approximate location. It does not keep polling after the action to build a hidden route.

Android distinguishes cached location from a fresh request. Cached results can be stale and fresh computation can use device sensors. Battery benefit must be measured against ordinary capture rather than advertised as zero energy use. [Android location guidance](https://developer.android.com/develop/sensors-and-location/location/retrieve-current).

### 5.2 Offline and sync requirements

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| SYN-01 | Queue media and metadata locally with durable identifiers. | R1 | Captures survive a tested offline session and process termination. |
| SYN-02 | Retry uploads idempotently and resume supported interrupted transfers. | R1 | Repeated attempts create one server moment and one logical contribution. |
| SYN-03 | Show local, queued, uploading, private-cloud, contributed, and failed states. | R1 | A user can tell whether material is backed up or shared. |
| SYN-04 | Allow upload cancellation, retry, and a configurable Wi-Fi preference. | R1 | A stalled upload can be managed without deleting the local original. |
| SYN-05 | Preserve unsynchronised edits and detect conflicts against the shared draft revision. | R1 | A stale device cannot silently overwrite another coauthor's saved draft. |
| SYN-06 | Recover gracefully from expired media access, sign-in expiry, and missing source files. | R1 | The affected item is identified and can be reselected without restarting the whole trip. |

Each capture has a durable local identifier. Retrying an upload must not create another moment. Pending metadata edits and media uploads survive ordinary process termination and device restart after a completed save.

The interface distinguishes saving on this device, queued for upload, uploaded privately, contributed, and published. It shows why a job is waiting and lets the person retry or cancel it. Background work follows Android and iOS scheduling constraints and is not promised to run instantly. Foreground retry remains available on both platforms.

The app does not claim a cloud backup before upload verification. It does not silently delete the last local copy or delete files from the person's normal gallery. Local-storage exhaustion produces a clear warning before accepting more capture work.

## 6. Import existing media and recordings

The person explicitly selects existing photographs, videos, supported audio, and optional GPX or FIT recordings. Candidate review happens before upload or contribution. One rejected item does not discard the rest of the batch. A journey remains usable without a GPS recording or successful transcription.

### 6.1 Import requirements

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| IMP-01 | Select and batch-import supported photographs and videos through permitted access flows. | R1 | The app reads only granted items and reports individual failures. |
| IMP-02 | Import supported audio files through an explicit selection flow. | R1 | An audio import does not require broad gallery or audio-library access. |
| IMP-03 | Extract available original capture times, location evidence, and source metadata privately. | R1 | Upload time and current phone location never replace missing historical metadata. |
| IMP-04 | Suggest trip membership from dates within accessible media and show a review list. | R1 | Out-of-range additions and uncertain-date corrections remain possible. |
| IMP-05 | Support manual import when broader access is denied or absent. | R1 | The complete core story workflow remains available. |
| IMP-06 | Detect exact duplicate imports within the owner's destination and preserve original source files. | R1 | Retries do not double-count material. Matching content never grants access across people. |
| IMP-07 | Import GPX tracks with segments, gaps, and optional timestamps or elevation. | R1 | Known fixtures preserve geometry and uncertainty correctly. |
| IMP-08 | Import usable FIT activities as optional recorded sections. | R1 | A realistic watch-file corpus yields correct accepted sections or clear rejections. |
| IMP-09 | Discover trip-date candidates across the wider gallery when access and policy permit. | Conditional R1 | Device and distribution-policy checks pass, with explicit review and the picker fallback intact. |

### 6.2 Date-bounded suggestions

The start time defines candidate membership, not proof of departure location or movement. The end time prevents an open-ended import window. Both remain editable, and an author can add an item outside the suggested range manually.

The baseline uses access to user-selected media. The app can organise those items by original capture date where available. Android's picker grants access to selected photos and videos rather than the complete library. [Android Photo Picker](https://developer.android.com/training/data-storage/shared/photo-picker).

Apply the selected-media baseline on iOS through the adopted native modules. Verify limited/denied access, cloud-backed selections, metadata availability, and durable copies on the physical iPhone/iPad. Android permission and picker behavior does not establish iOS behavior. Both platforms retain review before upload and a usable fallback when broader access is unavailable.

Whole-library scanning is conditional. Broad media access is restricted by Google Play and a custom gallery alone does not establish qualification. The fallback remains usable if broader access is denied or unavailable. [Google Play media-access requirements](https://support.google.com/googleplay/android-developer/answer/16935362?hl=en).

Candidate discovery runs when requested, such as after finishing a trip. It does not require continuous gallery monitoring. Screenshots, downloads, unrelated pictures, and uncertain dates receive review. Candidates are not uploaded or contributed until the user approves them.

### 6.3 Import integrity

- Prefer original capture metadata over upload time. Preserve uncertainty when metadata is missing or edited.
- Never assign the current phone location to an old imported file.
- Do not assume an imported voice recording contains location metadata.
- Match a media timestamp to a compatible recording only when the recording, contributor, clock alignment, and proximity support that association.
- Support clock corrections without modifying the uploaded original.
- Flag exact duplicate uploads within the owner's import destination first. Similar photographs can remain separate perspectives. Matching file content does not transfer ownership or sharing permissions between people.
- Treat unsupported inputs individually so one failed item does not discard the rest of a batch.

### 6.4 Supported-input baseline

| Input | Initial support target | Fallback |
|---|---|---|
| Photographs | JPEG, PNG, and WebP imports, plus tested Android and iOS camera output in declared supported formats. | Clear unsupported-format message. HEIC and HEIF, including iPhone/iPad inputs, need a validated conversion path before claiming support. |
| Video | Short clips in a tested MP4 playback profile. | Convert supported inputs when feasible or explain the unsupported codec. Long-form uploads are later. |
| Audio | In-app voice notes and selected supported M4A, MP3, or WAV imports. | Preserve the recording for playback if transcription is unavailable. |
| GPS | GPX tracks and segments, and FIT activities with usable location data. | Preserve valid geometry when timestamps are missing. Reject unsupported planned-route input clearly. |

Supported formats, codec handling, batch sizes, duration limits, storage limits, and supported devices must be published before production release. No unlimited-media promise is made. Test both ordinary usage and the declared limits in the complete production implementation.

Provide guidance for obtaining supported GPX or FIT files manually and clear explanations for unusable recordings. Direct Strava or Garmin integration is not required. Do not infer mobile export convenience, ownership, or reuse rights from the existence of an export option.

## 7. Contribute and coauthor with explicit rights

A member contributes selected moments to journey review or grants reuse in the journey's publication and personal shares. Batch choices and an explicit opt-in for future in-app captures reduce repeated work. An authorised coauthor edits the common draft and inspects changes from other members.

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| COL-01 | Keep personal captures private until a sharing action or explicit capture destination applies. | R1 | A new trip member cannot see another person's private captures. |
| COL-02 | Separate journey-review access from canonical publication, personal-share reuse, and original-file export. | R1 | A review-only item blocks unauthorised publication and sharing. Another contributor's original requires its separate export grant. |
| COL-03 | Allow batch contributions and explicit opt-in for future in-app captures to journey review. | R1 | Destination and audience are visible before capture or sharing. |
| COL-04 | Retain contributor, creator credit where supplied, and source references. | R1 | Uploading or selecting a source does not transfer ownership or falsely identify its photographer. |
| COL-05 | Personalise a share from approved journey material without a separate story record. | R1 | The selection references the canonical journey and adds no discovery or activity count. |
| COL-06 | Grant administration, coauthor editing, and designated-publisher capabilities separately. | R1 | The capability matrix governs review and draft access. Five coauthors can edit; only designated publishers approve publication or visibility. |
| COL-07 | Withdraw or narrow a source grant and notify coauthors and publishers. | R1 | Publication, profile previews, discovery, hosted shares, retrieval, and answers stop exposing withdrawn material. |
| COL-08 | Attribute participant-specific travel within one shared journey. | R1 | Separate departures appear as branches, not a false path through everyone's home. |
| COL-09 | Provide shared-field change attribution, conflict detection, and basic revision recovery. | R1 | Concurrent stale edits preserve both candidates. Restore rechecks current source grants. |
| COL-10 | Support accepted administrator transfer and non-destructive member departure. | R1 | A creator can hand over administration without deleting the journey; no-successor cases follow the disclosed freeze policy. |

Trusted members can all receive the coauthor role. Source grants still determine what can be published. The designated publisher makes the final publication or visibility change after review, while other coauthors can share the existing approved version.

R1 detects stale edits, retains both candidates when a conflict occurs, records who changed shared fields, and provides basic revision inspection and recovery. Restoring an earlier narrative rechecks current source permissions and never restores a withdrawn private asset. Full character-level simultaneous coediting is later; preventing silent overwrite is required now.

Private source observations remain attributable to their contributor. Shared narrative edits belong to the common draft. Ordinary coauthor edits do not become public until an approved revision is published.

Withdrawal and transfer are available throughout use. Their complete lifecycle effects are specified in [section 16](#16-withdrawal-transfer-export-and-deletion).

## 8. Reconstruct chronology, chapters, and route

Selected media, notes, source metadata, and optional recordings produce suggestions for one editable departure-to-return draft. Coauthors review consequential uncertainty. Unknown places, movement, and missing recordings remain visible rather than becoming invented facts.

### 8.1 Reconstruction requirements

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| REC-01 | Suggest chronology from source time and explicit corrections. | R1 | Missing times, timezone changes, and clock offsets remain reviewable. |
| REC-02 | Suggest editable stops, chapters, and travel legs in the common draft. | R1 | An authorised coauthor can merge, split, reorder, rename, or reject them. |
| REC-03 | Preserve evidence type and uncertainty for locations, modes, and associations. | R1 | An inferred connection never renders or reads as a recorded route. |
| REC-04 | Use available text and supported transcripts to suggest contextual details. | R1 | Suggestions link to their source and await confirmation before becoming author-confirmed facts. |
| REC-05 | Associate moments with compatible recordings using time, contributor, and proximity. | R1 | Off-route or incompatible moments are not silently snapped to a path. |
| REC-06 | Preserve missing days, rest stages, gaps, and unknown movement. | R1 | The story remains complete in sequence without inventing a route or event. |
| REC-07 | Suggest places or scene context from OCR or supported image analysis. | Conditional R1 | A labelled test corpus establishes useful accuracy and corrections are available. |
| REC-08 | Regenerate suggestions without overwriting explicit author decisions. | R1 | Reprocessing a file retains approved corrections. |

### 8.2 Evidence categories

| Category | Meaning | Viewer treatment |
|---|---|---|
| Captured stop | A media moment has usable location evidence. | Show its approximate position at the supported accuracy. |
| Recorded route | Geometry comes from an accepted GPS recording. | Solid recorded-section style, preserving gaps. |
| Author-confirmed travel | The author confirms a movement or arrangement. | Show the mode and report source. Confirmation does not create an exact path. |
| Estimated connection | The app or author supplies a plausible connection. | Distinct estimated style and label. |
| Unknown | Evidence does not support a place, path, time, or activity. | Preserve the gap or ask for an optional correction. |

A confirmed train journey can still have an estimated rail path. A road-routing result is not evidence that the group used that exact road. A flight arc is an illustration of a leg, not a recorded flight trace.

### 8.3 Suggestion sequence

1. Group moments by usable capture times and author-confirmed timezone context.
2. Suggest stops from compatible nearby observations, allowing poor accuracy and missing data.
3. Suggest chapters and travel legs without forcing every midnight crossing into a new meaningful stage.
4. Use captions, transcripts, optional nearby-place lookup, and explicit notes to suggest context.
5. Use OCR or visual clues only when supported and label the result as a suggestion.
6. Associate compatible GPS sections and preserve disjoint segments.
7. Show consequential questions such as an uncertain transfer or misplaced image for coauthor review.

The app never infers a private home address as a confirmed fact, guesses a person or guide identity from a photograph, or supplies a price because similar trips commonly pay it.

### 8.4 Participant-specific travel

One shared journey can contain participant-specific departure or return legs and a common group phase. If A departs from Chennai and B from Bengaluru, their separate legs retain participant attribution. The default overview emphasises shared travel and makes branches explicit rather than drawing a route through both homes.

Coauthors can include a member's observation without claiming that every participant visited that location. Source contributor, people actually present when known, and route association are distinct facts. A personal contributor filter changes what is highlighted, not the canonical geography or its evidence.

### 8.5 Geography and statistics requirements

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| GEO-01 | Display the overall story route and selected chapters in a licensed 2D map with Map/Satellite switching. | R1 | Recorded sections, observed stops, and estimates remain distinguishable across styles. Overlays and selected context survive switching. |
| GEO-02 | Preserve disjoint recorded geometry and support route simplification. | R1 | Large and disconnected fixtures remain correct and usable. |
| GEO-03 | Calculate source-labelled recorded statistics without duplicate participant totals. | R1 | Recorded distance excludes inferred transfers and duplicate recordings. |
| GEO-04 | Allow authorised correction, sensitive-section removal, and location generalisation. | R1 | Public payloads and derived views respect the chosen redaction. |
| GEO-05 | Suggest provider-calculated travel geometry for a supported, confirmed mode. | Conditional R1 | Licensing and behaviour are verified and the geometry remains labelled estimated. |
| GEO-06 | Provide a readable fallback when geography or map delivery is unavailable. | R1 | Text, chapters, and media remain usable through a map failure. |

- Preserve source timestamps, offsets when supplied, manual corrections, and their provenance.
- Support overnight transfers, rest days, timezone changes, and recordings without timestamps.
- One source file can contribute to several story chapters. Several files can contribute to one chapter.
- Do not draw a traversed line across a recording gap.
- Distinguish planned-route data from recorded activity data.
- Calculate recorded distance from eligible recorded segments only. Do not multiply a group's distance by summing everyone's recording of the same leg.
- Select one primary recording for an overlapping group leg by default. Alternate participant recordings can remain available without being added to its distance again.
- Present estimated travel distance separately if shown. Never add it to recorded hiking distance without an explicit label.
- Use suitable route simplification and map bounds, including antimeridian cases.
- Treat elevation as a source-dependent estimate. Missing or unreliable statistics do not block a story.

## 9. Edit the canonical story

Every journey has one common title, cover, summary, chapter structure, chronology, travel legs, practical-knowledge record, draft, and publication settings. Story is a presentation of that record. Members do not receive separately published factual versions of the same event.

The default draft uses chronology, readable chapter names, selected media, and short factual descriptions. It does not invent events to fill an empty day. Coauthors can reorder presentation without overwriting original capture metadata.

Common editing supports adding, excluding, reordering, and captioning moments; correcting stops and modes; adding stages without GPS; recording practical details; and previewing the approved publication. Excluding a source from the narrative does not delete its contributor's original.

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| STO-01 | Generate one reader-ready default layout from selected moments and chapters. | R1 | An author reaches a coherent preview without page-design work. |
| STO-02 | Edit cover, title, summary, chapter labels, captions, order, and inclusion. | R1 | Presentation changes preserve source provenance. |
| STO-03 | Add a stage or note without media or a GPS recording. | R1 | A rest day and a missing-recording day can be represented. |
| STO-04 | Autosave and recover draft changes. | R1 | Tested interruption does not lose completed edits. |
| STO-05 | Keep one shared narrative separate from private originals and personal sharing captions. | R1 | Coauthors see common edits, while a personal share caption cannot overwrite canonical facts. |
| STO-06 | Show missing rights, unresolved important suggestions, and privacy issues before publication. | R1 | The designated publisher can locate and resolve every publication blocker. |
| STO-07 | Preview and republish deliberately while keeping ordinary draft edits private. | R1 | Public readers continue seeing the prior approved version until republishing. |

The publisher's exact viewer and question-source preview depends on the approved-view behaviour in sections 11, 12, and 15. Missing rights and privacy violations block publication. Consequential uncertainties need review, but an explicitly unknown or estimated leg remains publishable without an invented answer.

## 10. Practical details and lessons

The author records what happened and what the group actually arranged. Each detail remains attributable and dated. This is historical trip knowledge, not a future-trip preparation planner.

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| LRN-01 | Add transport, stay, guide, equipment, rental, cost, challenge, lesson, and unresolved-question details. | R1 | Each type can be added without a preparation planner. |
| LRN-02 | Link every detail to a source or mark it as an explicit author report. | R1 | A viewer can inspect provenance and observation date. |
| LRN-03 | Store cost context such as currency, unit, group size, and inclusions when supplied. | R1 | Group fare and per-person fare are not confused. |
| LRN-04 | Filter practical details by topic and relevant chapter. | R1 | A viewer finds a rental or transfer detail without reading the full narrative. |
| LRN-05 | Preserve corrections and distinguish visit date from edit date. | R1 | An old observation does not appear newly verified after a text edit. |
| LRN-06 | Apply explicit permission and redaction to contacts, receipts, and personal details. | R1 | Hidden data does not appear in cards, images, transcripts, or answers. |

### 10.1 Supported detail types

| Type | Examples of reported experience |
|---|---|
| Transport | Pickup point, mode, transfer arrangement, duration reported, group fare, and return arrangement. |
| Accommodation | Where the group stayed, how it arranged the stay, and observations relevant to that visit. |
| Guide or local service | Who helped, how the group arranged assistance, and a contact only when publication is permitted. |
| Equipment carried | Backpacks, clothing, tools, electronics, and what was useful or unused. |
| Rental | Item, supplier or place, reported fee, deposit terms reported, and how the return worked. |
| Costs | Amount, currency, date, unit, group size, inclusions, and whether exact or estimated. |
| Challenge and lesson | What happened, how the group responded, and the author's reflection. |
| Access and practical arrangements | What the group encountered, plus a dated official source when available. |
| Unresolved question | Something the author could not establish or recommends checking again. |

### 10.2 Detail structure and corrections

A practical detail contains a category, short statement, observation date, relevant chapter or leg, author or contributor, source references, and evidence status. Optional fields add money, units, group size, contact publication permission, or a linked official notice.

The author can create a detail manually. Extraction from a voice note or caption creates a reviewable suggestion. A recorded statement is attributed to its speaker rather than treated as independently verified fact.

Personal experiences and official notices remain distinct. The date of observation is separate from the date an editor last changed the card. A later correction can be appended without making the older account appear recent.

## 11. Review, publish, and republish

The designated publisher reviews the whole draft, resolves missing source rights, checks sensitive media and locations, confirms important suggestions, and previews exactly what viewers and the question system can access. Ordinary later edits stay private until intentional republication.

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| PUB-01 | Keep capture, contribution, editorial draft, and publication states separate. | R1 | Private sync or group contribution does not publish a story. |
| PUB-02 | Enforce source reuse grants before publication and when serving content. | R1 | A publisher or personal sharer cannot expose a review-only or withdrawn item. |
| PUB-03 | Generate a viewer-safe approved version with redacted media and metadata. | R1 | Inspecting public payloads reveals no hidden coordinates or original-private EXIF. |
| PUB-04 | Issue share links and a safe cover preview. | R1 | Link previews use only approved information and respect visibility. |
| PUB-05 | Unpublish, revoke links, and block access to prior asset and version URLs. | R1 | Managed caches and old references cannot bypass the tested revocation policy. |
| PUB-06 | Separate private, unlisted, and explicitly public-discoverable publication. | R1 | Only eligible opted-in public journeys enter the catalog; drafts and unlisted journeys stay absent. |
| PUB-07 | Keep publication state consistent across viewer modes, profiles, discovery, shares, and questions. | R1 | All surfaces enforce the current accessible approved journey version. |
| PUB-08 | Handle source withdrawal without deleting the entire shared event. | R1 | Affected material disappears and coauthors receive a repair notice. |

### 11.1 Visibility and publication states

Public means eligible for the in-platform discovery catalog after explicit publication and any required listing review. Unlisted means accessible through a valid link but absent from discovery and public-profile listings. Private drafts and review workspaces require member access. External search-engine indexing is a separate later choice.

Public reading and browsing do not require an account. Unlisted links remain forwardable, not authenticated audience boundaries. A personal highlight selection never widens the canonical journey's visibility.

Missing publication rights and unresolved privacy violations block publication. An uncertain location or travel leg can remain explicitly unknown or estimated and does not force the author to invent an answer.

### 11.2 Privacy review

- Personal captures and drafts are private by default.
- Account history is private. Public profiles are optional and expose only intentionally selected, currently public journeys and approved profile fields.
- Public contributor credit uses an approved display identity. Membership does not automatically publish the full participant roster, private account fields, or home cities.
- Trip participation does not grant device-gallery access.
- Sensitive departure and return locations are hidden or generalised in public output by default and reviewed by the author.
- An explicit publication preview covers map geometry, moments, photographs, transcripts, practical cards, contacts, and question sources.
- Public copies strip sensitive embedded metadata. Originals stay in private storage.
- Exclude identifying media or transcript passages when generalising a coordinate is insufficient to protect the chosen private location.
- Public or unlisted links can be forwarded. Authenticated audience gating is a separate capability.
- A personal share's photo selection does not limit access to the full public journey. Explain the full-journey link before sharing.

### 11.3 Redaction and removal propagation

A privacy change applies to public geometry, map bounds and camera positions, pins, labels, text, transcripts, image metadata, thumbnails, cover previews, discovery listings, public profiles, hosted personal shares, saved-reference previews, search, citations, and answer caches. Hiding a marker visually is insufficient if the coordinate remains in a public payload.

Generated summaries and practical cards retain source dependencies so removing a source also removes affected derived claims. Removing only the photograph while retaining a revealing transcript or cached answer is incomplete.

Ordinary approved narrative snapshots stay stable while an author edits. Current access rules, contribution withdrawals, takedowns, and privacy removals override all snapshots. Old version URLs and asset links must not become a route around revocation.

The service can control its own endpoints and managed caches. It cannot erase screenshots, files, or previews held by other people or external services. Publication and hosting terms explain that limit.

## 12. Read Story, Explore, and Learn

A recipient opens an approved public or unlisted link in a mobile browser without installing an app or creating an account. The person reads immediately, chooses a day or view, plays media on request, and can inspect sources or report an issue.

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| VWR-01 | Open approved public or unlisted stories without a viewer account. | R1 | A fresh mobile browser can read the story. |
| VWR-02 | Provide a readable Story view before full map or media loading. Initialize maps only on an explicit map action. | R1 | Core narrative remains understandable on the target mobile profile. Ordinary Story reading makes no map-instance or basemap requests. |
| VWR-03 | Provide Explore with an overview, moment selection, and basic user-started playback. | R1 | Pause, next, previous, and stage selection work with clear route semantics. |
| VWR-04 | Preserve selected context between Story, Explore, and Learn. | R1 | Switching from a Day 2 moment opens the same context in another view. |
| VWR-05 | Support whole-story and chapter filters, including stages without geometry. | R1 | A rest-day filter shows its material without a fake route. |
| VWR-06 | Play audio and video only on request and expose captions or transcripts. | R1 | Scrolling does not trigger competing audio or forced playback. |
| VWR-07 | Provide keyboard, screen-reader, and reduced-motion alternatives. | R1 | The primary journey can be understood without map gestures or animation. |
| VWR-08 | Display generic unavailable states and a report contact. | R1 | An inaccessible story reveals no private title, location, cover, or source. |

### 12.1 Three views of one approved record

| View | Viewer job | Required behaviour |
|---|---|---|
| Story | Experience what happened. | Readable vertical chapters, inline media, short narrative, optional corresponding map highlight. |
| Explore | Understand the route and sequence. | 2D overview, selected-stage geometry, moment selection, timeline controls, and user-started playback. |
| Learn | Find arrangements and lessons. | Practical cards, categories, source links, observation dates, text search, and questions about the journey. |

Whole journey and day selection are filters. Switching views preserves the selected chapter or moment. A story with incomplete geography remains readable.

Contributor filtering can highlight a member's approved moments while preserving the same canonical record. It never adds source locations to that person's route merely because they uploaded or selected a photograph. Discover is the portal's journey catalog; Explore remains the map-and-timeline mode inside a journey.

### 12.2 Interaction and accessibility

- Ordinary scrolling remains under the reader's control. The map can follow selection without trapping scroll.
- Photos appear inline or in an accessible gallery. Repeated forced overlays are avoided.
- Audio and video start on request. Playback pauses or waits at media moments rather than playing several sounds at once.
- Explore playback supports pause, next, previous, stage selection, and a reduced-motion alternative.
- Estimated connections stay visibly different during animation.
- Day navigation works without fine map gestures or map literacy.
- The page displays useful text before a heavy map or media file finishes loading.
- Captions, alt text, transcript access, keyboard controls, and readable contrast support accessible reading.

## 13. Share approved personal highlights

A member opens the approved journey and chooses Share my highlights. The member reviews eligible moments, a cover, and a personal caption, then shares a focused hosted link or a simple static social image card through the device share flow.

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| SHR-01 | Start sharing from an approved canonical journey and record its source version. | R1 | The action never creates another journey or draft chronology. |
| SHR-02 | Default personal highlights to the member's approved attributed contributions. | R1 | It neither selects every coauthor's media nor assumes who appears in a photograph. |
| SHR-03 | Let the member review moments, cover, and a personal sharing caption. | R1 | Sharing text and selection do not overwrite the canonical narrative. |
| SHR-04 | Handle no eligible personal media with an explicit permitted fallback. | R1 | Another person's media is not silently inserted as the member's own. |
| SHR-05 | Produce a focused hosted selection and an ordinary full-journey link. | R1 | Both resolve one canonical record, with no extra listing or answer index. |
| SHR-06 | Generate a simple static social image card and use the device share flow. | R1 | The preview includes permitted media, attribution, and a journey reference where supported. |
| SHR-07 | Enforce current grants and visibility for hosted share views and managed assets. | R1 | Withdrawn or unpublished items do not survive through an old share URL. External-copy limits are disclosed. |
| SHR-08 | Prevent share selections from widening visibility or exposing private draft material. | R1 | A private journey cannot be publicly exported through the personal-share action. |

### 13.1 Selection and attribution

Share my highlights starts with the sharing member's approved contributions. My photos means attributed contributions, not photographs that an AI believes contain that member's face. Uploader, original photographer when supplied, and people pictured are distinct attributes. R1 does not require face recognition.

The member can choose a cover, select approved moments, arrange the share selection within the canonical trip context, and add a sharing caption. Another person's material is available only when its grant permits sharing in this journey, and its credit remains visible. If no personal media is eligible, ask for an explicit permitted group selection or offer the ordinary journey link.

R1 outputs a focused hosted link and a simple static social image card with a journey reference or link where supported. Sharing uses the device share flow rather than automatically posting to social accounts. Rendered personalised reels and cinematic exports remain later features.

A presentation records the canonical journey and approved source revision. It creates no new journey, public discovery entry, activity count, canonical narrative, or AI index. Personal sharing captions are presentation text and do not replace group facts or silently enter the journey's answer sources.

### 13.2 Access and source versions

A personal view is a selection, not a privacy boundary. If the canonical journey is public, a recipient can choose View full journey. The app explains that action rather than implying that the rest of the public content is inaccessible.

Generating a share rechecks current publication status and source grants. A private journey cannot be made public through personal sharing. An unlisted selection uses authorised link access and stays out of discovery. A public selection can contain only approved public material, even if its creator can see additional private draft items.

Hosted selection links resolve the current accessible approved journey and suppress removed selections rather than substituting private material. Static cards record their source version, and managed derivatives obey withdrawal. A downloaded or externally posted card cannot be recalled. [Google Photos sharing controls](https://support.google.com/photos/answer/6280921?hl=en) illustrate the same distinction between access revocation and exported copies.

## 14. Discovery, public profiles, and saved research

A visitor browses Discover without signing in, finds a public event, checks visit dates and evidence, and opens the approved journey. Signing in enables a private research bookmark and note, question sessions, or starting a distinct future journey with a reference link.

### 14.1 Discovery and saved-reference requirements

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| DIS-01 | List approved public journeys through an explicit publication and listing choice. | R1 | Private drafts, unlisted links, and unapproved listings are absent. |
| DIS-02 | Search approved route or destination text and filter available region, dates, category, and duration. | R1 | Results preserve visit dates and unknown metadata without searching private fields. |
| DIS-03 | Deduplicate listings and counts by canonical journey identifier. | R1 | Five members and five personal shares yield one result; another group's later trip remains separate. |
| DIS-04 | Recheck access and remove managed search snippets and thumbnails after visibility changes. | R1 | A stale search result cannot return protected content after unpublishing. |
| DIS-05 | Save a journey reference and optional private research note to an account. | R1 | The bookmark is not a copied journey, a public note, or a completed activity. |
| DIS-06 | Connect discovery to approved viewing, signed-in questions, and a new future journey with a source reference. | R1 | The new event does not copy the earlier group's media or completed observations as its own experience. |
| DIS-07 | Provide listing review states, reporting, anti-spam limits, and operational takedown controls. | R1 | Reports can remove a listing without implying factual or route-safety certification. |

R1 provides a basic Discover catalog, including keyword search for route and destination and available filters for region, trip category, visit dates or season, duration, and journey status such as ongoing or completed. Missing metadata stays unknown. Search uses approved public fields, never private capture coordinates or draft text.

Each canonical journey has one result regardless of how many members or personal shares reference it. Different groups or departures on the same route are legitimate separate results. A personal share links to that journey and does not compete with it as another event listing.

The publisher explicitly chooses public discovery. Draft and private journeys are excluded. Unlisted journeys are absent even if someone possesses their link. Listing review has visible pending, listed, or removed status. A controlled manual review process is sufficient for launch. It checks suitability and rights; it does not certify route safety or factual accuracy.

Results show visit dates separately from publication or correction dates. Visitors can open the approved journey, inspect sources, and sign in to save it or ask questions. Accounts can save a private bookmark and optional research note. A future journey can reference that source without copying its actual observations or media.

Reports, takedown, anti-spam limits, and rapid removal are required for listing. Public-to-unlisted or private changes remove results, snippets, thumbnails, and public-profile references across managed caches. Canonical access checks remain authoritative while indexes update. External search-engine indexing and algorithmic recommendations remain later choices.

Removing a catalog listing and taking down a publication are distinct actions. Catalog removal alone does not imply that an otherwise accessible journey was unpublished. A content or rights takedown applies the required broader access restriction across every managed surface.

### 14.2 Optional public profile

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| PRO-05 | Offer an optional public profile with selected eligible public journey references. | R1 | Private drafts, unlisted journeys, private notes, and precise private locations remain excluded. |
| PRO-06 | Recheck profile cards, history access, and counts after visibility or membership changes. | R1 | An old profile reference cannot bypass revoked journey or source access. |

Basic account fields include a display name, optional avatar, and optional bio. Email, private journeys, draft dates, precise locations, and private research notes are not public profile fields. A public profile is optional and includes only selected eligible public journey references and approved attribution. The private history remains complete for its owner regardless of public-profile choices.

Unpublishing and source withdrawal update profile cards and counts. A historical membership reference cannot bypass current access to a private journey. Hiding one's public-profile association does not create another journey or silently unpublish the group's record.

### 14.3 Reuse by another group

R1 provides Discover and a useful Learn view within each public journey. An upcoming organiser can save a reference and inspect relevant cards and sources. A global authoritative route database, automatic aggregation across conflicting journeys, and a full preparation workspace are later decisions.

Starting a future journey creates a distinct event with its own group and dates. It may retain a reference link, but the earlier group's actual travel, photographs, costs, and completed activities are not copied into the new group's recorded history. Questions support independent preparation; they do not replace checking current conditions, availability, or requirements.

Questions about future availability, current prices, permits, conditions, and safety cannot be answered from historical experience alone. The product displays the date and source and directs the reader to confirm current arrangements where necessary.

## 15. Search and questions about the journey

The person searches the journey's approved text and practical details, or signs in to ask a question. The answer cites evidence that person can open and preserves the experience's date, attribution, and uncertainty.

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| ASK-01 | Search the canonical journey's approved text and practical details. | R1 | Results contain no private or other-journey material, regardless of contributor. |
| ASK-02 | Transcribe supported owner-authorised or permitted contributed voice and video speech asynchronously. Index only publication-approved passages for viewers. | R1 | Processing, unsupported, failed, and ready states are visible. Private review transcripts never enter viewer answers without publication approval. |
| ASK-03 | Answer questions using only sources available to that viewer and story version. | R1 | Adversarial queries cannot reveal draft material or another member's private departure. |
| ASK-04 | Attach citations and media timestamps where supported. | R1 | Citations open the actual supporting approved source. |
| ASK-05 | Abstain when the story lacks evidence and attribute conflicting reports. | R1 | No invented rental, price, identity, route, or current permission appears in an answer. |
| ASK-06 | Preserve reported dates, units, attribution, and uncertainty. | R1 | An old group taxi fare is not presented as a current per-person quote. |
| ASK-07 | Invalidate affected retrieval entries and answer caches after rights or privacy changes. | R1 | A previously answered query stops exposing withdrawn content. |
| ASK-08 | Keep reading usable during indexing failures, rate limits, or AI outages. | R1 | Story, media, and practical cards work when questions are unavailable. |
| ASK-09 | Require sign-in for question sessions and enforce disclosed account-based limits. | R1 | Guests can still read public material; signed-in sessions use the same permission-filtered canonical index. |

### 15.1 Initial question scope

Signed-in users ask questions about the canonical journey and approved version they can access. R1 answers use approved narrative, captions, structured practical details, and supported voice or video-speech transcripts. Public reading and practical cards remain available without sign-in; account-based question sessions have disclosed rate and cost limits.

Questions opened from a personal share are explicitly about the complete accessible journey, not only the sharing member's highlights. A citation can open another approved contributor's source after a clear jump. No separate answer index is created for each member or share presentation. Cross-journey synthesis is outside R1.

Examples include:

- How did this group reach the base?
- Where did they rent their equipment?
- What did they report paying for the taxi, and how many people shared it?
- What happened on the second day?
- Which part did the author describe as difficult?

### 15.2 Sources and answer rules

- Every factual answer links to a supporting card or moment. Audio and video citations include a supported timestamp where available.
- Answers distinguish author-reported experience, direct media observations, and estimates.
- An answer preserves currency, unit, group size, and observation date when reporting costs.
- Missing evidence produces a clear statement that the story does not contain the answer.
- Conflicting accounts are attributed rather than silently reconciled.
- Hidden coordinates, private transcripts, unpublished contributions, and inaccessible stories are excluded from retrieval and answers.
- Content inside uploads or transcripts is treated as source material, not instructions to change permissions or system behaviour.
- A source link points to material the viewer can actually open.

### 15.3 Media boundaries

Audio transcription supports the languages and recording conditions verified during production implementation and release testing. Publish the supported set. Low-confidence passages remain reviewable. Unsupported audio still works as a media attachment when playable.

R1 video search covers approved speech transcripts and captions. It does not promise understanding of every visual event in every clip. Image descriptions, OCR, and selected video-frame analysis can be introduced after quality and cost validation. An image suggestion does not establish a person's identity or an exact location.

AI processing is asynchronous. A story can remain readable while indexing is pending, with questions temporarily unavailable or limited to the ready sources. The interface never implies that pending media has already been analysed.

### 15.4 Question privacy and freshness

An answer must reference one consistent approved canonical journey version. Republishing, hiding material, withdrawing a contribution, or revoking access invalidates affected retrieval entries and answer caches. Stored answers, saved references, profile placements, and personal shares cannot bypass a later rights or privacy change.

Viewers' questions are not automatically public comments. Retention and use of question logs are disclosed, and analytics do not collect private media or precise journey coordinates.

## 16. Withdrawal, transfer, export, and deletion

These controls apply as soon as their resources exist. Their position here follows the journey lifecycle and does not defer source withdrawal, export, or access checks until after release.

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| TRP-05 | Archive a journey without deleting members' private originals. | R1 | Archival closes collaboration deliberately and preserves permitted history and export access. |
| OWN-02 | Export own uploaded originals and permitted structured story data without a payment gate. | R1 | Export includes permitted chapters, narrative, source references, and media. Another contributor's original requires the grant in section 2.6 at generation and download. |
| OWN-03 | Delete owned media or an account, or perform an authorised canonical journey deletion, with explicit impact. | R1 | Departure is distinct from group deletion, source rights are respected, and shared continuity is considered. |

### 16.1 Withdrawal and ownership changes

- Contributors retain ownership of their uploads and can withdraw a sharing grant.
- Withdrawal hides affected material and source-dependent claims from hosted publication, profile previews, discovery, personal share views, search, and answers, including old versions.
- Coauthors and the publisher receive a notice and can repair the common record.
- Leaving removes editing access but does not delete the shared journey for other members. The person can retain a minimal historical participation reference subject to current access. Source grants remain explicit and revocable.
- Removing a member revokes protected workspace access and future personal-share creation. It does not pretend an already public journey is secret from that person as a public visitor.
- Before the administrator leaves or deletes their account, offer an accepted transfer to an eligible coauthor. No successor is invented automatically. With no eligible successor, freeze role expansion, new publication, and visibility widening. Retain permitted member access and exports. Source withdrawal/deletion and authorised visibility restrictions remain available under the disclosed recovery or deletion process.
- Account deletion handles the departing person's sources according to their grants and deletion policy. It does not silently destroy all other members' contributions or the canonical event.
- Archival closes contribution activity. Unpublishing or deleting the canonical journey affects all references and is an explicitly confirmed privileged action; other members' private originals remain theirs.
- Material already downloaded or copied outside the service cannot be recalled. The app does not promise otherwise.

### 16.2 Rights, retention, and provider processing

Contributors confirm that they may upload and share material in the selected scope. Journey review and publication reuse are separate grants. Publication does not grant the administrator ownership of another person's files or permission for unrelated journeys.

Leaving membership, withdrawing contributed material, transferring administration, archiving, and deleting an account are separate actions with a clear impact preview. A departing administrator can transfer to an accepting coauthor. If no successor is available, freeze role expansion, new publication, and visibility widening while preserving permitted access/export and the restrictive safety controls described above. Do not silently erase a group's journey because its creator leaves. A former member cannot continue editing the protected workspace or creating new member-only shares; public reading follows the ordinary public-access rules.

Export of one's own data is available without payment. Exporting another contributor's raw originals requires an explicit grant. Story export includes only material the exporter may retain in that form.

Use the [original-file export contract](#26-original-file-export-grants). Publication reuse permits approved presentation and sharing, while raw-original export remains a separate owner decision.

Define retention for local pending captures, private cloud uploads, unreferenced assets, deleted accounts, backups, AI-provider processing, and published versions before production release. Explain deletion delay and exceptions required by applicable obligations. Do not promise permanent unlimited storage or permanent availability.

Disclose which processing providers receive selected media and for what purpose. Do not send unselected gallery candidates to cloud processing. Do not use private journey content to train models, or allow vendors to do so, without separate explicit permission and suitable contractual terms.

Verify applicable Indian privacy, consumer, copyright, and platform requirements for the actual launch. Reassess obligations when adding markets, payments, children, sensitive documents, or new processing providers. No legal commencement date or compliance certification is assumed here.

## 17. Quality, security, limits, and operations

These obligations apply across the functional journey from the first implementation step. They are release requirements, not optional work after feature completion.

| ID | Requirement | Scope | Acceptance evidence |
|---|---|---|---|
| OWN-04 | Show usage, upload limits, processing state, and retention terms. | R1 | Limits are visible before an operation exceeds them. |
| OWN-05 | Record role transfer, shared revisions, source grants, publication, listing, withdrawal, and deletion actions. | R1 | Support can investigate changes without unrestricted private-content access. |

### 17.1 Release quality targets

These are product targets to verify, not measured performance claims.

| Area | Target or required property | Verification |
|---|---|---|
| Location use | No continuous recorder and no location polling outside explicit capture actions. | Android and iOS permission and request audits during idle and capture sessions. |
| Battery | Measure added energy from capture-time location, processing, and sync against a normal camera workflow. | Representative Android and physical iPhone/iPad tests. Set an acceptable budget before production release. |
| Local durability | Completed local saves and edits survive tested process termination and restart. | Offline capture and recovery scenarios with real files. |
| Synchronisation | Retries preserve one logical moment and do not claim completion prematurely. | Network loss, app restart, expired access, and partial-upload tests. |
| Shared editing | Stale edits cannot silently overwrite another member's accepted changes. | Concurrent offline edits, conflict resolution, history, and restore scenarios. |
| Canonical identity | One group event retains one journey identifier across accounts, listings, and personal shares. | Five members join, edit, save, and share without multiplying journeys or discovery results. |
| Web reading | Target p75 LCP at or below 2.5 seconds on an agreed mobile 4G profile. | Device tests and later real-user measurements. Map loading is not a prerequisite for reading. |
| Media delivery | Thumbnails and derivatives load progressively. Playback limits and processing states are clear. | Slow-network and unsupported-codec scenarios. |
| Import correctness | All accepted fixtures preserve required segments, source attribution, and uncertainty. | Curated real-device corpus. Expected unsupported inputs are separate from failures. |
| Accessibility | Target WCAG 2.2 AA for primary controls and reading surfaces. | Automated checks plus keyboard, screen-reader, and reduced-motion review. |
| Geography | Public display preserves route gaps and source labels. | Disconnected, missing-time, duplicate, split-party, and large-route fixtures. |
| Revocation | Access denial propagates within a documented measured maximum across infrastructure controlled by the app. | Main links, old versions, media URLs, search, citations, and answer caches. |
| Discovery and sharing | Listings, public profiles, bookmarks, and hosted shares obey current publication and source permissions. | Unpublish, withdraw a source, remove a listing, and revoke membership across each surface. |
| AI correctness | Published factual answers cite accessible evidence or abstain. | A question set including missing evidence, conflicting reports, privacy attacks, and old prices. |
| Service degradation | Core reading survives AI or map-provider failure. | Controlled provider failures with visible fallbacks. |

### 17.2 Limits and costs

Before production release, define numerical limits for image size, clip length, audio length, media per trip, route size, processing concurrency, question rate, and storage. Test at the declared maximum as well as a normal trip. The service must not accept an unbounded job because its interface lacks a limit.

Track storage, image and video processing, transcription, AI answers, map requests, application infrastructure, and support effort. Include private drafts, free journeys, discovery traffic, and personal-share derivatives rather than accounting only for paying users. Set provider budgets and per-journey and per-account usage controls. Personal shares reuse the canonical answer index rather than creating one index per member.

### 17.3 Operations

Minimum operations include account-scoped support diagnostics, job status, quota visibility, a report and takedown contact, backup and restore, access auditing, monitoring, and a rollback path. Public discovery also needs a named listing-review owner, a review queue or controlled equivalent, reporting, spam controls, and a removal process. A custom administrative application is not required if simpler controlled tools meet those needs.

Recovery must preserve acknowledged access restrictions independently of a database backup. Source withdrawal, grant narrowing, membership/capability removal, original-export grant revocation, link revocation, privacy removal, takedown, and deletion create restriction events in an encrypted off-VPS journal. A successful completion acknowledgement requires both the local deny and a durable journal receipt. If the journal is unavailable, enforce the local deny immediately and show recovery confirmation as pending; retry without restoring access. After a restore, keep affected content and exports unavailable until journal replay and completeness checks succeed. An uncertain journal history keeps all potentially affected access denied. [Architecture section 15.4](architecture.md#154-backup-restore-and-release) defines the mechanism and verification. This applies to PUB-05, PUB-08, COL-07, and OWN-03.

Processing jobs are retryable and idempotent. Publication and permission changes are auditable. Support access to private content is exceptional, justified, and logged.

### 17.4 Security requirements

- Server-side checks enforce membership, administrator and publisher capabilities, journey access, and source grants on every operation.
- Private source files are not made public by publishing a story.
- Upload handling validates size and actual type and isolates untrusted parsing and transformation.
- GPX parsing rejects unsafe XML behaviour. Media and FIT processing have resource limits.
- Signed upload and download access is scoped and short-lived where appropriate.
- Authentication, invitations, imports, exports, public reads, and questions have abuse controls.
- Uploaded content and transcripts cannot instruct the AI to bypass permissions or expose other data.
- Secrets, backups, logs, and staging data have controlled access. Precise location and private media do not enter third-party analytics.

### 17.5 Experience coverage

| Surface | Main screens or areas |
|---|---|
| Android/iOS creator | Account and profile, My journeys, create or join, capture, personal moments, import review, sync status, shared draft, recent changes, publication preview, personal sharing, settings. iOS is verified locally now; public distribution is deferred. |
| Web creator | Profile and history, import, shared chapter editing, practical details, contribution and role management, revision recovery, preview, publishing, sharing, export, and account controls. |
| Public web and portal | Discover, journey results, optional public profiles, Story, Explore, Learn, source moments, sign-in for questions and saved references, unavailable states, and report contact. |

These are capabilities, not a requirement for a separate screen for every row. A small number of contextual editing surfaces is preferred.

Metric definitions and community evaluation belong to the [product plan](product_plan.md#8-success-measures-and-community-evaluation). Instrument those measures without collecting private media or precise coordinates in analytics. Disclose retention and use of question logs. Count canonical journeys separately from members, shares, bookmarks, and listings.

## 18. Implementation order and complete release

### 18.1 Build commitment

Build the complete agreed product directly in the production codebase. The R1 baseline and requirement tables in this document define that complete scope. Technical work follows dependencies, but every component contributes to the final application and its complete user journeys.

Do not introduce an MVP, functional proof of concept, manually curated trial service, or reduced end-to-end product as a prerequisite for the full implementation. The user-requested [Fresh design hub](../../DESIGN.md) is a bounded design activity in the existing applications using labelled sample data and simulated operations. It does not change R1 scope, qualify production capabilities, or create a market-validation or release-approval gate. Community interviews, preliminary adoption targets, paid commitments, and competitor benchmarks are not approval gates for building the agreed product.

Implement the selected [architecture](architecture.md) and qualify its integrations, supported inputs, and operating limits during implementation. Run component tests, integration tests, device checks, and full-product acceptance tests as the production capabilities become available. Testing verifies the implementation and prepares it for release.

### 18.2 Dependency-aware implementation sequence

Sections 3 through 16 follow user progression. The sequence below turns that order into buildable dependencies within one complete production build. Each step extends the same application. All R1 steps remain required for release.

| Build order | Production result and requirement sections | Dependency or completion condition |
|---|---|---|
| 1 | Contracts, accounts, canonical identity, membership, capabilities, source/export grants, and audit. Sections 2 through 4 and 17. | Establish private defaults, account recovery, the restriction journal, and one journey reference per member before shared data exists. |
| 2 | Android and iOS capture, durable local saving, queues, and sync. Section 5. | Uses the account and journey destination; verifies offline survival and idempotent upload with real captures on each platform. |
| 3 | Selected-media, audio, GPX, and FIT import and safe processing. Section 6. | Uses durable source identity and grants; preserves originals, metadata, unknowns, and processing states. |
| 4 | Contributions, revision-aware shared editing, conflicts, transfer, and departure. Section 7 and lifecycle rules in section 16. | Builds on the capability matrix and source grants. Retains both stale-edit candidates and supports withdrawal immediately. |
| 5 | Supported transcription and transcript review. ASK-02 and sections 6 and 15.3. | Uses owner-authorised or permitted contributed sources. Retains real source offsets, corrections, language/failure states, and playback. Transcripts remain private review artifacts until publication. |
| 6 | Reconstruction, geography, canonical story editing, and practical details. Sections 8 through 10. | Uses permitted metadata, notes, reviewed transcripts, and common revisions. Preserves corrections, branches, gaps, dates, cost context, and original metadata. |
| 7 | Accessible viewer modes, safe approved-version generation, privacy preview, publishing, and revocation. Sections 11 and 12. | Build the viewer and approved-source selection together so the publisher previews actual viewer and question access. No question interface is required to check source eligibility. |
| 8 | Personal highlights, static cards, and optional public-profile references. Sections 13 and 14.2. | Requires an approved journey, eligible sources, viewer links, and current revocation enforcement. |
| 9 | Public catalog, listing moderation, saved research, and future-event references. Section 14. | Requires explicit public eligibility, approved metadata, takedown controls, and one listing per canonical event. |
| 10 | Search, grounded question sessions, citations, quotas, and answer invalidation. Section 15. | Requires consistent approved versions, source eligibility, transcripts where supported, viewer source links, and account limits. |
| Throughout | Withdrawal, archival, permitted export, deletion, retention, security, limits, monitoring, support, backups, and restore. Sections 16 and 17. | Implement each lifecycle control, its impact preview, and its recovery rule when its data or action is introduced. Verify the whole chain before release. |

The [responsibility map](#213-logical-responsibilities) assigns product responsibilities without selecting a framework, provider, or database schema.

This sequence is authoritative for delivery order. [Architecture section 16](architecture.md#16-implementation-dependencies-and-release-evidence) maps the same ten steps to technical responsibilities. [Design section 18](application_design.md#18-handoff-package) supplies the corresponding handoffs. Source transcription precedes transcript-based reconstruction and extraction; approval for the public answer corpus follows publication review.

### 18.3 Complete-product release criteria

Release the complete product when all R1 requirements have implementation evidence and the definition of done in section 20 passes. An unfinished workstream does not become the public product merely because one demonstration journey works.

- Verify the complete creator, contributor, coauthor, personal sharer, viewer, and learner workflows in the integrated production application.
- Exercise Android and local iOS capture, ordinary-camera imports, offline recovery, GPX/FIT handling, permissions, publication, discovery, and grounded questions on the declared support matrix. iOS public distribution is not required for web/Android launch.
- Inspect actual public payloads, managed media, saved previews, retrieval entries, and old links after privacy or rights changes.
- Meet the quality, accessibility, supported-input, security, retention, and operating requirements in sections 11, 16, and 17.
- Publish supported limits and processing behaviour. Conditional R1 features are enabled only when verified; their complete baseline fallbacks remain available.
- Prepare support, moderation, backups, monitoring, and rollback before inviting community members to the released product.

Before release, representative community participants complete the creator, contributor, coauthor, viewer, and learner tasks in the complete release candidate. Internal security and privacy checks pass before using their consented data. Record failures and resolve release-blocking issues. This is acceptance testing of the complete application. The broader launch and adoption evaluation follows readiness approval under [product plan section 8.3](product_plan.md#83-community-evaluation-of-the-complete-product). Recruitment, willingness to pay, and adoption targets do not gate authorised implementation.

The agreed complete build remains R1. Deferred extensions stay in the [product direction](product_plan.md#7-product-direction-and-release-boundaries) and the scope baseline in section 1.

## 19. Decisions required before release

| Decision | Current direction | Completion evidence |
|---|---|---|
| Brand and distribution identity | Descriptive working title until selected. | Name, app identity, domain, and rights checks where applicable. |
| Native support | Android public distribution first; Android and iOS development/local testing now. | Supported OS versions and representative Android/iPhone/iPad list from capture/import tests. Accept prior Mac compatibility testing and record actual build tool versions. |
| Mobile distribution | Local builds without an EAS subscription. Apple enrollment and iOS public distribution deferred until prospective client/customer interest and an explicit enrollment decision. | Android signing and applicable Play closed-testing/production-access checks before Android publication; Apple distribution signing, TestFlight, and store review after enrollment. See the mobile development plan. |
| Media, route, storage, question, and original-export grant limits | Bounded, transparent, configurable. | Numerical operation limits and grant-expiry bounds are published and tested at their maximum. |
| Capture battery budget | No continuous recording. | Measured capture-and-sync comparison with an acceptable production energy budget. |
| Gallery discovery | Picker baseline, wider scan conditional. | Permission and distribution feasibility with a working fallback. |
| Authentication | Accounts for personal history, authoring, saved references, and question sessions; public reading remains open. | Tested recovery, secure device sessions, permission checks, and question quotas. |
| Language support | English interface initially. Source language is preserved. | Declared transcription languages and unsupported-language behaviour from community samples. |
| Map and processing providers | Mapbox for web/native basemaps and satellite. Vercel AI SDK/Gateway for external model tasks. Mailpit development email and Resend production email. | Actual account access, native SDK integration, licensing, privacy, attribution/telemetry, billing, and failure behaviour verified. |
| Publication semantics | Private draft, journey review, unlisted links, and explicitly public discovery. | Access, forwarding explanation, full-journey access from personal shares, and unavailable states tested. |
| Collaborative authority | Coauthors edit; designated publishers approve and change visibility. | Five-member conflict, restore, source-grant, transfer, and departure tasks pass. |
| Personal sharing | Own eligible contributions by default, selectable approved group material, one canonical destination. | Empty-selection, attribution, static-card, revocation, and no-duplication tasks pass. |
| Public catalog moderation | Explicit opt-in catalog with review and reporting. | Named operator, listing states, handling process, spam limits, and private/unlisted exclusion tested. |
| Source grants | Review, publication reuse, and original-file export remain separate under section 2. | Participant/coauthor/publisher access, recipient-specific export, expiry, withdrawal, and comprehension scenarios pass. |
| Retention and revocation | No permanent unlimited promise. Acknowledged restrictions survive database rollback through the independent journal. | Disclosed retention schedule, durable restriction receipts, restore replay, and measured managed-cache revocation maximum. |
| Community launch resources | Complete product, community-first launch, existing VPS, and a planning ceiling of 10,000 people. | Actual recruitment reach, founder time, support plan, storage/processing limits, and provider-usage controls recorded. A VPS budget estimate is not a prerequisite. |

Password-protected audience gating, external search-engine indexing, silent gallery automation, cinematic social exports, detailed billing, and preparation tools remain outside the agreed release. Only iOS public distribution and paid-entitlement verification are deferred; iOS implementation and local device testing are included. The complete R1 product includes the basic in-platform public catalog.

Date-bounded wider-gallery discovery remains Conditional R1 under IMP-09. The excluded automation above means silent or unreviewed monitoring, not permissioned candidate suggestions. Provider choices are recorded in the architecture. Numerical operating limits, supported Android/iOS versions, subscription price, retention duration, and launch date still require their own evidence or decision.

## 20. Acceptance scenarios and definition of done

### 20.1 Full-product acceptance scenario

Run this acceptance scenario against the complete production implementation. Use a fictional trip with five people and real consented fixture media. A and B depart from different cities, meet near a base, complete several trekking stages, have a rest day, and return separately. The fixture is not a suggested route.

1. A creates an account and one journey, selects dates, and invites B, C, D, and E. Their private histories reference the same identifier once each.
2. A grants all five coauthor access and designates A and C as publishers. B captures separately; B's departure material stays private until selected for contribution.
3. A captures a departure photograph without location permission. The app saves it with unknown location. Several offline captures survive a process restart.
4. A imports ordinary-camera photographs, including unrelated items, a duplicate, a missing timestamp, and stripped location metadata. The review list supports exclusion and correction before sharing.
5. A imports a GPX recording with a gap. B imports an overlapping FIT activity. Neither duplicates the group's distance or implies that everyone travelled every branch.
6. The common draft shows attributed separate departures, confirmed shared stages, a rest day, and estimated transport connections.
7. A records a voice note about a group taxi fare and rental arrangement. Suggested practical cards link to the recording; A confirms currency, observation date, and group-size context.
8. B contributes one review-only photograph and one item permitted for publication. The former cannot appear in the publication, public profile, personal share, or answer index.
9. B and C edit an older version of the same chapter. A stale save produces an explicit conflict rather than silently overwriting accepted work. They resolve it using basic history.
10. A designated publisher previews home-location redaction and approves the group's single publication. All five histories still show the same journey, with no new personal event records.
11. B creates a hosted personal share and static social card. B's approved contributions are the default; adding C's material requires an explicit eligible selection. A member without eligible contributions chooses permitted group content or a plain link.
12. An external viewer opens B's focused share without an account and can explicitly open the complete public journey. The selection does not imply that the rest is private.
13. The group opts into public discovery. Review produces one listing, even after all five share it or add it to their optional public profiles. Private history and unlisted journeys remain absent.
14. A new visitor finds the journey, checks its trip dates and update date, then signs in to save a reference and ask about the taxi. The answer cites the approved note and preserves historical group-fare context.
15. The visitor asks for an unknown current rental price. The answer abstains. Saving the reference does not add a completed trip to the visitor's history.
16. The visitor starts a separate future journey with new dates and a reference to the source. Completed event facts, media, and group membership are not copied as their own experience.
17. A fresh mobile browser reads the canonical Story, selects Day 2, switches to Explore or Learn, and plays media on request. Map or AI-provider failure leaves core reading available.
18. B withdraws a published item. Canonical pages, hosted personal shares, profiles, listings, previews, citations, and affected answers stop exposing it. An already exported social card cannot be remotely recalled.
19. C edits the common draft without changing the approved narrative. An intentional later publication updates it. Restoring an older draft cannot restore withdrawn material or stale permissions.
20. A transfers administration to accepting coauthor C and leaves. The group keeps its canonical journey and permitted sources. A loses protected member access; the departure flow treats withdrawal as a separate choice.
21. C exports owned sources and permitted journey data, then unpublishes. Managed links, saved previews, listings, and old versions cannot bypass current access denial.
22. Repeating membership joins, upload retries, bookmarks, or personal shares creates no duplicate journey, listing, distance total, or canonical AI index.

### 20.2 Additional edge cases

Test permission changes after selection, cloud-only media downloads, unsupported codecs, noisy speech, several source languages, imported planned routes, one file spanning several days, several files in one stage, timezone changes, midnight travel, device-clock offsets, large tracks, redacted map bounds, malicious uploads, expired invitations, concurrent edits, account deletion, and restored backups. Also test repeated joins, multi-role history counts, an empty personal-share selection, photographer versus uploader attribution, removal of a coauthor, a sole administrator leaving without a successor, stale share revisions, profile removal, listing takedown, and restoring revisions whose sources are no longer permitted.

Verify the capability matrix with a participant, administrator without editorial capabilities, coauthor, publisher without editing capability, source owner, and public viewer. Attempt cross-account and cross-journey access. Original-file export tests cover owner approval, exact asset/recipient scope, expiry, source-grant narrowing, recipient departure, and revocation during archive generation or download.

Restore a backup taken before an acknowledged withdrawal, membership removal, link revocation, and deletion. Replay their off-VPS journal events before enabling reads or exports. Test crashes between local commit, journal append, and response; duplicate append/retry; journal outage; missing/corrupt history; and an unknown journal tail. Local restrictions remain effective while recovery confirmation is pending. An uncertain recovery stays closed rather than exposing a restored grant.

For the selected Mapbox integration, test Map/Satellite switching without losing journey overlays, selected stage, or camera context. Verify native build compatibility, imagery credits, accessible attribution/telemetry controls, stage-list fallback, and actual SDK billing units. Story reading without a map must not initialize a map instance.

### 20.3 Definition of done for R1

- All R1 requirements have implementation evidence and pass their relevant acceptance scenarios.
- Every Conditional R1 feature is either verified or disabled with its baseline fallback working.
- Representative community authors, contributors, coauthors, viewers, and learners complete the intended tasks in pre-release acceptance testing of the complete release candidate. Post-release adoption evaluation is separate.
- Five members can collaborate on one event and make different personal shares while one canonical identifier, history entry per member, discovery listing, and answer index are preserved.
- Conflict recovery, accepted administration transfer, and departure without erasing others' permitted work pass observed scenarios.
- Private information remains inaccessible through public pages, payloads, media, search, and questions.
- Offline capture, sync recovery, withdrawal, deletion, and export work on the declared support matrix.
- Android and iOS local native verification passes on the reviewed build, including physical iPhone/iPad checks. Free provisioning limits are documented; Apple distribution-only checks are recorded as deferred and completed after enrollment, without blocking web/Android launch.
- Performance, accessibility, input limits, retention, and provider budgets are measured or documented as required.
- Support, reporting, backup and restore, restriction-journal replay, monitoring, and rollback are ready for production release. Recovery cannot re-expose an acknowledged withdrawn or deleted source.
- Verification uses actual production behaviour, source files, access checks, and public payloads. A demonstration or successful compilation alone is insufficient.

## 21. Traceability and inherited baseline

### 21.1 Original-section coverage

This map accounts for every numbered section of the combined version 1.2 plan. It is a migration reference, not a third source of requirements.

| Original section | Product plan destination | Requirements destination |
|---|---|---|
| 1. Executive summary | 1, 7, and 8 | 1 and the complete functional sequence |
| 2. Decision baseline | 7 and 11 for direction | 21.2 retains all D-01 through D-25 decisions |
| 3. Problem and opportunity | 2 | Context links to the product plan |
| 4. Audience and jobs | 3 | Roles in 2 and user progression in 1.3 |
| 5. Positioning and differentiation | 4 and 12 | Relevant constraints in 22 |
| 6. Principles and boundaries | 5 | 1.4, 2, and workflow rules |
| 7. Journey model, ownership, permissions | Concept in 1 and 6 | 2, 4, 7, 8.4, 13, and 16 |
| 8. Release and platform scope | Direction in 7 | 1.1, 1.2, 6.4, and 19 |
| 9. End-to-end journeys | Experience in 6 | 1.3 and sequential sections 3 through 16 |
| 10. Capture, import, sync | Principle in 5 | 5 and 6 |
| 11. Reconstruction and route integrity | Product principles in 5 | 8 |
| 12. Collaboration and personal sharing | Product concept in 1 and 6 | 7, 9, and 13 |
| 13. Viewer and information architecture | Product experience in 6 | 3, 12, 14, and 17.5 |
| 14. Practical knowledge and handover | Problem and outcome in 1 and 2 | 10 and 14.3 |
| 15. Search and journey questions | Product direction in 7 | 15 |
| 16. Functional requirements | Link to implementation reference | All 117 original IDs retained once in sections 3 through 17 |
| 17. Quality and operations | Product risks in 10 | 17 |
| 18. Privacy, security, rights | Principles in 5 | 2, 11, 16, and 17.4 |
| 19. Logical responsibilities | None | 21.3 |
| 20. Direct implementation and release | 7 | 18 and 20 |
| 21. Quality and usage metrics | 8 | Instrumentation obligation in 17 |
| 22. Community launch and commerce | 9 | Limits, ownership, and operations in 16 and 17 |
| 23. Risks and open decisions | 10 and 11 | 19 |
| 24. Acceptance and definition of done | None | 20 |
| 25. Requirement coverage | Product commitments throughout | 21.4 |
| 26. Research and references | 12 and comparison sources in 4 | 22 |

### 21.2 Inherited decision baseline

This register preserves the original decision wording and historical status. The current-application column points to the normative R1 requirements or exclusions that now govern implementation. An inherited "proposed" or "planning" label is historical, while the linked current requirements determine release scope. This does not relabel a historical proposal as a founder-confirmed decision.

| ID | Decision | Historical status | Current application and authority |
|---|---|---|---|
| D-01 | Cover the whole journey from departure to return, including travel around the recorded activity. | Confirmed direction | R1. TRP-01, REC-02, REC-06, STO-03. |
| D-02 | Support several trip categories through one model. Recruit the first cohort by shared behaviour rather than a mandatory single sport. | Confirmed direction | R1 model. Sections 1.2 and 4. |
| D-03 | Start with self-organised trips with friends. | Confirmed audience | Current audience. Product plan section 3. |
| D-04 | Build the first creator experience for Android. | Confirmed platform | Android remains the first public mobile target. The later founder clarification includes iOS implementation and local verification now under CAP-01 through CAP-08; only Apple enrollment/public distribution is deferred. Section 1.2 governs. |
| D-05 | Do not implement continuous location recording in this app. | Confirmed boundary | R1 boundary. CAP-08 and section 1.4. |
| D-06 | Support in-app photographs, short videos, voice notes, and later imports. | Confirmed direction | R1. CAP-01 through CAP-04, IMP-01, IMP-02. |
| D-07 | Use journey dates to help suggest relevant media, followed by user review. | Confirmed desired experience | R1. IMP-04; user review remains required. |
| D-08 | Use Android media selection as the baseline. Whole-library date scanning depends on access, policy qualification, and device tests. | Conditional capability | Picker is R1 under IMP-01 and IMP-05. Wider scanning is Conditional R1 under IMP-09. |
| D-09 | One shared group event has one canonical journey, one collaborative draft, and one approved published account. | Confirmed revised direction | R1. TRP-02, STO-05, PUB-01. |
| D-10 | Personal sharing selects a member's approved highlights without creating another journey or narrative fork. | Confirmed revised direction | R1. COL-05 and SHR-01 through SHR-08. |
| D-11 | Reconstruct unrecorded travel from available evidence. Label estimates and preserve unresolved gaps. | Planning baseline | R1. REC-01 through REC-06 and REC-08. Visual suggestions and calculated routes remain conditional. |
| D-12 | Offer Story, Explore, and Learn views, with whole-journey and day filters. | Planning baseline | R1. VWR-01 through VWR-08. |
| D-13 | Include practical experience and questions about the story in the first complete release. | Confirmed direction with bounded scope | R1. LRN-01 through LRN-06 and ASK-01 through ASK-09. |
| D-14 | Keep preparation planners, document checklists, and equipment allocation for later. | Confirmed deferral | Later. Exclusions in section 1.4. |
| D-15 | Capture and drafts are private by default. A designated publisher reviews publication and visibility changes. | Proposed release default | Required R1 behavior. COL-01, COL-06, STO-07, PUB-01, PUB-02. |
| D-16 | Use optional imported GPX and FIT recordings. Direct Strava or Garmin integration is not a launch dependency. | Proposed release default | Required R1 import capability. IMP-07 and IMP-08. Supplying GPS remains optional for users; direct sync is Later. |
| D-17 | Viewer questions use the approved story only. Private source material is excluded. | Required trust rule | R1 trust rule. ASK-03 through ASK-07. |
| D-18 | Prioritise community usefulness before revenue experiments. | Confirmed first-year goal | Current commercial direction. Product plan section 9. |
| D-19 | Each account has a profile and private history of created and joined journeys, with one reference per event. | Confirmed revised direction | R1. TRP-06 and PRO-01 through PRO-04. |
| D-20 | Public journeys can be discovered in the portal and inspected for trip research. | Confirmed revised direction | R1. DIS-01 through DIS-07 and PUB-06. |
| D-21 | Coauthors can edit the common draft. Administration, publication, source ownership, and personal sharing are separate permissions. | Planning baseline | Required R1 behavior. Section 2.5 and COL-06, COL-09, COL-10. |
| D-22 | Personal highlight defaults use the sharer's approved contributions, not face recognition or all coauthors' media. | Proposed release default | Required R1 default. SHR-02 and SHR-04. |
| D-23 | Public discovery lists one canonical record regardless of profile references, authors, or share presentations. | Required identity rule | R1 identity rule. TRP-02 and DIS-03. |
| D-24 | Public reading and discovery remain account-free. Sign-in enables history, contribution, sharing creation, saving, and question sessions. | Proposed access default | Required R1 access model. OWN-01, VWR-01, DIS-01, ASK-09. |
| D-25 | Build the complete agreed product directly. Development and release testing exercise that implementation rather than a preliminary reduced-scope product. | Confirmed delivery approach | Current delivery commitment. Sections 18 and 20. |

The inherited decisions above retain their product meaning, with the later platform clarification recorded in D-04's current-application column. The current [architecture](architecture.md) selects React/Vite+/TanStack, Expo/React Native, the modular backend and worker, PostgreSQL, SeaweedFS/S3, Mapbox, AI SDK/Gateway, and Mailpit/Resend. Section 14 of that document owns all stack versions. Supported Android/iOS versions, numerical operating limits, subscription price, and launch date remain release decisions in section 19 here.

### 21.3 Logical responsibilities

This is a responsibility map, not a selected implementation stack or database schema.

| Responsibility | Owns |
|---|---|
| Android/iOS client | Capture, foreground permission requests, selected-media import, durable local drafts, contribution choices, and upload queue, with platform-specific adapters and tests. |
| Creator web experience | Bulk review, common chapter editing, practical details, conflict recovery, preview, publication, and administration controls. |
| Identity and permission boundary | Accounts, journey membership, editorial roles, designated publishers, asset grants, invitation state, and revocation. |
| Private source storage | Uploaded originals, protected metadata, source identity, checksums, and retention. |
| Processing | Safe parsing, derivatives, transcription, candidate organisation, and optional evidence extraction. |
| Canonical journey record | Stable event identity, source references, attributed travel branches, common draft, editorial revisions, and publication state. |
| Publication | Approved snapshots, viewer-safe derivatives, current permission enforcement, and invalidation. |
| Profile and history | Private membership references, created/joined filters, optional selected public journeys, and separate saved references. |
| Personal sharing | Approved selections, contributor attribution, hosted highlights, static social cards, and current access checks. No cloned journey. |
| Discovery | One listing per eligible journey, approved metadata search, listing review, reporting, and takedowns. |
| Retrieval and answers | Approved-version index, accessible citations, source grounding, abstention, and cache invalidation. |
| Viewer delivery | Story, Explore, Learn, progressive media, and unavailable-state behaviour. |
| Operations | Limits, diagnostics, cost reporting, backups, incidents, and access audit. |

A single backend with clear modules is the starting preference. Background processing can use durable jobs without turning the product into a collection of independent services. Heavy media stays separate from ordinary story metadata.

Use the selected technologies in the [canonical stack register](architecture.md#14-canonical-stack-and-dependency-register). The existing VPS hosts application data, PostgreSQL, the worker, and private SeaweedFS objects through an S3-compatible interface. External Mapbox and AI services are permitted. Preserve the capture, permission, publishing, and search constraints below and verify integrations within the production application.

Direct platform integration remains separate from manual import. In particular, Strava's API-sourced data rules require review for public storytelling. User-supplied files are assessed by their own rights and provenance rather than automatically treated as API data. [Strava API policy](https://www.strava.com/legal/api_policy), [Strava export documentation](https://support.strava.com/en-us/articles/15401919-how-do-i-export-my-strava-data?mobile_site=true).

### 21.4 Product commitment coverage

| Product commitment | Primary requirement references |
|---|---|
| Whole departure-to-return journey | TRP-01, REC-02, REC-06, GEO-01, STO-03 |
| Android first and no continuous recorder | CAP-01 through CAP-08, SYN-01 through SYN-06 |
| In-app photos, video, audio, and notes | CAP-01 through CAP-04 |
| Later import and date-bounded suggestions | IMP-01 through IMP-05, IMP-09 |
| Optional watch and activity recordings | IMP-07, IMP-08, REC-05, GEO-02, GEO-03 |
| One canonical group journey with collaborative authority and recovery | TRP-01, TRP-02, COL-01 through COL-10, STO-05, STO-06 |
| Private account history and optional public profile | TRP-06, PRO-01 through PRO-06 |
| Personal sharing without duplicate journeys | COL-05, SHR-01 through SHR-08 |
| Public discovery and saved research | DIS-01 through DIS-07, PUB-06 |
| Editable contextual reconstruction | REC-01 through REC-08, GEO-04, GEO-05 |
| Whole-journey and day-based viewing | VWR-01 through VWR-07 |
| Practical transport, guide, equipment, rental, cost, and lesson information | LRN-01 through LRN-06 |
| Questions grounded in approved journey sources | ASK-01 through ASK-09 |
| Publisher review and safe sharing | STO-06, STO-07, PUB-01 through PUB-08 |
| Privacy, ownership, withdrawal, and portability | COL-07, GEO-04, PUB-02 through PUB-08, OWN-01 through OWN-05 |
| Community adoption before monetisation | Product plan sections 8 and 9; complete-build commitment in requirement section 18 |
| Preparation workflows deferred | Requirement section 1; product plan sections 5 and 7 |

## 22. Inherited research constraints and references

The following constraints and direct sources are retained from version 1.2. Product and workflow sources were reviewed on 31 October 2026, with collaboration, sharing, profiles, and discovery reviewed again on 1 November 2026. These dates describe the original documentation research. Relevant provider terms and platform documentation still need verification when integrating them.

Official documentation supports specific capabilities and constraints. These notes do not establish actual compatibility, legal clearance, provider selection, or measured performance. Product comparisons and the limits of market evidence belong in the [product research section](product_plan.md#12-research-basis-and-product-evidence).

### 22.1 Android capture, source acquisition, and route formats

| Finding and source | Consequence for the production build | Requirement references |
|---|---|---|
| Android's picker provides access to selected media, not an unrestricted gallery. Broad photo and video permissions are subject to Google Play restrictions. [Photo Picker](https://developer.android.com/training/data-storage/shared/photo-picker), [Play media permissions](https://support.google.com/googleplay/android-developer/answer/16935362?hl=en). | Selected-media import is the complete baseline. Date suggestions operate within permitted access. Wider scanning stays conditional, with review before upload and no silent gallery monitoring. | IMP-01, IMP-04, IMP-05, IMP-09 |
| Capture-date fields and location metadata have access and availability constraints. A file's presence does not guarantee reliable original time, timezone, or GPS. [Shared media](https://developer.android.com/training/data-storage/shared/media), [capture-date field](https://developer.android.com/reference/android/provider/MediaStore.MediaColumns#DATE_TAKEN). | Preserve source metadata, correction provenance, and unknown values. Do not use upload time or the current phone location as a historical observation. Test original files, screenshots, cloud-backed selections, stripped metadata, clock offsets, and timezone changes. | CAP-04, IMP-03, REC-01, REC-03 |
| Android distinguishes cached and fresh location. Cached data can be stale; obtaining a fresh observation can use sensors. [Location guidance](https://developer.android.com/develop/sensors-and-location/location/retrieve-current). | Request location only around explicit foreground capture. Retain observation age and accuracy, allow denial, and save without a fix. Measure battery overhead rather than promising zero energy use. | CAP-05 through CAP-08 |
| Strava documents website-based export, original-format downloads that may be FIT, separate GPX export, and account archives that can take hours. Non-GPS activities may not yield a usable GPX. [Export guide](https://support.strava.com/en-us/articles/15401919-how-do-i-export-my-strava-data?mobile_site=true). | Include FIT alongside GPX. Provide clear manual-import guidance and processing errors. Include source acquisition in usability measurements. Website-only export does not prove that mobile-browser export is impossible or convenient. | IMP-07, IMP-08, OWN-04 |
| Strava's API terms distinguish API-sourced data from arbitrary author-supplied files and constrain API-data display. [API agreement](https://www.strava.com/legal/api?hl=en), [API policy](https://www.strava.com/legal/api_policy). | Manual imports are independent of direct account integration. Preserve provenance and upload permission. Evaluate any later API integration against its actual intended use and current terms; this research is not legal clearance for every uploaded file. | IMP-03, OWN-02, PUB-02 |
| GPX distinguishes tracks, segments, routes, and waypoints. Point timestamps, elevation, and track type are optional. [GPX 1.1 schema](https://www.topografix.com/GPX/1/1/). | Preserve segmented geometry and missing fields. Timestamp-free tracks can retain valid geometry without invented chronology. Planned routes do not prove travel. One file may span chapters and several files may belong to one chapter. | IMP-07, REC-05, REC-06, GEO-02, GEO-03 |
| FIT activities are a relevant source for watch users. Invalid or interrupted recordings also occur; parsing cannot recover measurements that were never recorded. [Garmin FIT resources](https://developer.garmin.com/fit/), [Garmin failed-upload guidance](https://support.garmin.com/en-IN/?faq=j3epr66mmJ0V26Yq0SO6IA). | Use realistic watch files, bounded parsing, clear rejection, and original preservation. A failed recording does not block a media-based journey. Do not fabricate missing coordinates, timestamps, or physical measurements. | IMP-08, REC-03, REC-06, GEO-06 |

Two competitor import findings make the required edge cases concrete. Polarsteps documents no GPX or other location-file import. FindPenguins documents restrictions in its trip-route importer, including missing timestamps and closely spaced points, while separately supporting detailed GPX attachments. These are documented differences, not proof of poor overall products. Our import handling must be verified with actual files rather than inferred from a format checklist. [Polarsteps imports](https://support.polarsteps.com/hc/en-us/articles/24267546737426-Can-I-import-a-GPX-or-other-location-file-into-Polarsteps), [FindPenguins imports](https://support.findpenguins.com/hc/en-us/articles/360018036854-Can-I-import-a-GPX-or-other-location-file-into-FindPenguins).

### 22.2 Collaboration, sharing, profiles, and discovery

| Documented pattern and source | Decision retained in this product |
|---|---|
| Polarsteps Travel Together supports a common trip, shared steps, and contributions from companions' devices. It advises one creator per step to avoid duplication. [Shared-trip overview](https://support.polarsteps.com/hc/en-us/articles/24266789457170-What-is-Travel-Together), [shared media](https://support.polarsteps.com/hc/en-us/articles/24266906223506-How-to-add-photos-and-videos-with-Travel-Together). | One stable journey identifier across membership, histories, publication, discovery, and personal shares. Review duplicate moments inside that journey as well as preventing duplicate event records. Do not automatically merge private journeys merely because their dates and places match. |
| Polarsteps separates owner administration from broad buddy edits. FindPenguins documents fellow travellers with broad shared rights. Wanderlog supports view and edit access to a shared plan. [Polarsteps roles](https://support.polarsteps.com/hc/en-us/articles/24266959407250-What-is-a-trip-owner-Travel-Buddy-and-trip-group), [FindPenguins roles](https://support.findpenguins.com/hc/en-us/articles/360015640874-How-do-I-add-a-fellow-traveler), [Wanderlog sharing](https://help.wanderlog.com/hc/en-us/articles/4625495771163-Add-friends-to-plan-together). | All five trusted members may coauthor one draft. Source ownership, editing, administration, publication, and personal sharing remain separate capabilities. A designated publisher approves release without requiring a vote on every edit. Source-use grants still apply. |
| Polarsteps warns that overlapping text saves can overwrite earlier changes and says editing is not visible in real time. [Text editing](https://support.polarsteps.com/hc/en-us/articles/24266763379218-How-to-edit-text-with-Travel-Together). | Stale-edit detection and basic revision history and recovery are R1. Preserve both conflicting candidates. Restoring a draft rechecks current grants. Character-level simultaneous editing remains later. |
| Polarsteps documents loss of the group trip when its owner's account is deleted. FindPenguins documents leaving while others retain the trip, with deletion when the last traveller leaves. [Owner deletion](https://support.polarsteps.com/hc/en-us/articles/24266807023634-I-want-to-delete-my-account-What-happens-to-my-Travel-Together-trips), [leaving a trip](https://support.findpenguins.com/hc/en-us/articles/31194398246812-How-do-I-leave-a-trip). | Offer accepted administration transfer. Separate leaving, source withdrawal, archival, account deletion, and canonical journey deletion. Preserve others' permitted work. Define a freeze and recovery policy if no successor accepts. |
| Google Photos distinguishes shared-album access, attribution, and separately saved media copies. Saved copies do not follow subsequent original edits. [Sharing guide](https://support.google.com/photos/answer/6131416?co=GENIE.Platform%3DDesktop&hl=en). | Account history uses references, not personal journey copies. Share selections default to the member's approved attributed contributions. Uploader, photographer, and person pictured are different attributes. No face recognition or independent personal narrative is required. |
| Google Photos documents shared-link controls and the limits of revocation once material has been downloaded or copied. [Sharing controls](https://support.google.com/photos/answer/6280921?hl=en). | Recheck current permissions across links, hosted cards, old versions, previews, and answers. Personal highlights do not hide the rest of a public journey. Explicitly disclose that external social posts and downloaded files cannot be recalled. |
| Polarsteps distinguishes basic public profile fields from trip privacy. FindPenguins has per-trip visibility and permits public reading without sign-in. [Polarsteps profile visibility](https://support.polarsteps.com/hc/en-us/articles/38224904688786-Which-parts-of-my-profile-can-other-people-see-publicly), [FindPenguins privacy](https://support.findpenguins.com/hc/en-us/articles/360013804914-Privacy-of-trips-and-footprints). | Keep full account history private and make a selected public profile optional. Public discovery and reading remain open. Sign-in enables personal features and question sessions. A forwardable unlisted link is not authenticated member access. |
| Polarsteps Explore includes guides, curated trips, saved collections, and adding destinations to future plans. FindPenguins separates external search visibility and warns that search-engine removal takes time. [Explore](https://support.polarsteps.com/hc/en-us/articles/34772880134034-How-do-I-use-the-Explore-tab), [search visibility](https://support.findpenguins.com/hc/en-us/articles/360013805334-Will-my-profile-be-listed-in-search-engines). | Build the in-platform public catalog and saved references in R1. External search indexing remains separate. A future departure is a new event that can reference an earlier journey without copying its media or completed observations. |

These findings support the model, collaboration, sharing, discovery, and question rules in sections 2, 7, 13, 14, and 15 and requirements COL-01 through COL-10, PRO-01 through PRO-06, SHR-01 through SHR-08, and DIS-01 through DIS-07. They do not establish that our combination is unique or that another product uses the same internal record structure.

### 22.3 Provider costs, hosting, privacy, and operations

| Finding and source | Build and operating implication |
|---|---|
| Mapbox SDK billing uses web map loads and native map users; direct tiles and other APIs have separate meters. Attribution, caching, and export rights still apply. [Mapbox pricing](https://www.mapbox.com/pricing), [SDK billing](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/). | Mapbox is selected for basemaps and satellite. Measure actual SDK usage, including guests and author previews. Verify native bridge billing, attribution/telemetry, and output rights. Use the [dated cost model](../research/architecture/map_cost_comparison.md); do not equate 10,000 accounts with a guaranteed free bill. |
| SeaweedFS with an S3-compatible application interface is selected on the VPS. R2/AWS S3 are future migration destinations. Their storage and operation charges remain relevant even where direct egress has no charge. [R2 pricing](https://developers.cloudflare.com/r2/pricing/). | Preserve portable object identities, checksums, access checks, and a tested migration path. Include originals, derivatives, drafts, share assets, backups, processing, maps, questions, and support in usage limits. Account for free users and future hosting obligations. |
| TravelMap documents continued access to existing content after paid access expires. Render My Trip describes reduced-size photos, revocable share links, and account-linked retention. [TravelMap expiry](https://travelmap.net/support/payments/paid-account-expiration), [Render My Trip privacy](https://rendermytrip.com/privacy). | Publish our own clear hosting, retention, deletion, export, and paid-expiry terms before charging. Neither a competitor's policy nor account existence is our guarantee of unlimited or permanent hosting. |
| Source withdrawal and location redaction affect more than a visible marker or photograph. Shared-media and external-copy behaviour make this distinction material. [Google Photos sharing controls](https://support.google.com/photos/answer/6280921?hl=en). | Apply current access checks to geometry, bounds, labels, media metadata, thumbnails, transcripts, practical cards, listings, profiles, hosted shares, citations, and caches. Preserve source dependencies for derived claims and verify actual public payloads. |
| Binding Indian privacy commencement evidence was not independently verified in the original review because the linked notification could not be retrieved. [Government Gazette reference](https://egazette.gov.in/WriteReadData/2025/267647.pdf), [MeitY rules page](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa). | Verify the obligations applicable to the actual launch and providers during implementation. Do not assert a commencement date or compliance certification from these notes. Reassess when changing markets, collecting sensitive documents, adding children, or introducing payments. |

These inherited research notes do not override the current [architecture selections](architecture.md#14-canonical-stack-and-dependency-register). Numerical prices, usage allowances, energy targets, and service guarantees require current provider information and measurements from the production implementation.

### 22.4 Engineering checks retained for implementation

Resolve these checks within production architecture, development, and release testing:

- Android/iOS support matrices, platform picker and cloud-file behaviour, recoverable metadata, foreground location, background upload constraints, and measured battery overhead. iOS distribution verification follows the separate enrollment decision.
- Real GPX/FIT and media compatibility, unsafe or oversized input handling, clock corrections, route gaps, retry safety, and local durability.
- Shared-edit recovery, source grants, attribution, publisher authority, accepted transfer, and account or member departure.
- Publication redaction, old-version access, catalog eligibility, profile privacy, hosted share revocation, and permission-filtered retrieval.
- Supported transcription languages, noisy recordings, evidence coverage, citation accuracy, abstention, processing limits, and question quotas.
- Provider licensing, attribution, current costs, retention, export, takedown operations, backups, monitoring, and applicable launch obligations.

Complete these checks in the production implementation before release.
