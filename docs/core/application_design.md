# Application design specification

| Document field | Value |
|---|---|
| Version | 1.4 |
| Date | 1 November 2026 |
| Status | R1 design baseline reconciled with requirements version 2.3 and architecture version 1.6, including confirmed Unistyles mobile styling. No screens are implemented by this document. |
| Product name | Not selected. This document uses "the product" and "journey". |
| Platforms | Android/iOS creator app developed and tested locally; responsive creator, public, and discovery web experiences. Android public mobile distribution first; iOS public distribution deferred. |
| Source documents | [Product plan and vision](product_plan.md) and [product requirements](product_requirements.md) |
| Implementation stack | [Architecture section 14](architecture.md#14-canonical-stack-and-dependency-register) owns stack choices and versions. Web uses Vite+/React/TanStack/shadcn/Tailwind; Android and iOS use Expo/React Native with Unistyles v3. NativeWind is excluded. |
| Reference material | Three Pinterest concept images supplied with the design request |
| Document responsibility | Visual direction, information architecture, interaction patterns, screen specifications, design tokens, accessibility, and design acceptance criteria |

This document defines how the R1 product looks and behaves. The product plan owns product intent. The requirements document owns functional scope and release obligations. If this document conflicts with either source, the product requirements take precedence.

## 1. Design position

### 1.1 Product reading

The product is a shared record of a journey that already happened. It is not a trip planner, booking dashboard, live tracker, or safety tool.

The interface supports three connected modes:

1. **Capture.** A participant records a moment with little interruption and knows where it is saved.
2. **Compose.** The group turns permitted sources into one canonical journey, checks evidence, and publishes deliberately.
3. **Experience and learn.** A visitor follows the journey, understands its geography, and inspects dated practical knowledge.

The same journey identity, chapter selection, route meaning, and source permissions carry across every mode.

### 1.2 Aesthetic direction

The visual direction is a **contemporary field journal**. It combines an editorial travel publication with the precision of a field record.

The experience is warm, quiet, and photographic. Off-white paper tones replace stark white. Deep mineral green anchors actions and recorded geography. Clay orange marks review and uncertainty without turning the interface into a warning panel. Serif display type gives published stories an editorial voice. A restrained sans serif keeps creator tasks clear.

Real journey media is the main visual material. Maps, route marks, dates, source labels, and contributor credit add context. Decorative travel illustrations are limited to empty states and onboarding.

### 1.3 The memorable product element

The **journey line** is the recurring visual element across the product. It appears as:

- the chapter spine in Story.
- route geometry and gaps in Explore.
- a slim timeline in the creator workspace.
- a short provenance line on practical cards.
- the progress path through capture, review, and publication.

The line changes style according to evidence. A solid segment means recorded geometry. A dashed segment means an estimated connection. A labelled endpoint pair means reported travel without a known path. A visible break means the route is unknown. The line never invents continuity for decoration.

## 2. How the references influence the product

The supplied references establish a useful mood, not a feature model.

| Reference decision | Use in this product | Adaptation |
|---|---|---|
| Calm natural palette | Use warm paper, forest, moss, clay, and muted blue. | Green is an anchor, not the color of every card and icon. |
| Large editorial headings | Use on public journey covers, Discover, and major empty states. | Creator tools use compact headings so content remains primary. |
| Layered cards and rounded surfaces | Use to separate a map, a chapter, a source, or a review task. | Avoid wrapping every row in a card. Use borders and spacing for routine lists. |
| Map with a linked day timeline | Make this the core of Explore and route editing. | Route styles communicate evidence, gaps, and participant branches. |
| Strong photography | Use journey media for covers, chapters, and discovery results. | Do not use generic destination imagery when no approved journey image exists. |
| Serif and sans serif pairing | Use a serif for story titles and a sans serif for controls and body copy. | Long practical text and all controls remain sans serif. |
| Compact bottom navigation | Use on Android and iOS creator surfaces with platform-appropriate navigation behavior. | Capture is the central action. Booking and itinerary tabs do not appear. |
| Dashboard tiles | Use only when a small set of facts benefits from comparison. | Avoid readiness scores, weather widgets, booking cards, and packing progress. |
| AI-led planning language | Do not use. | Suggestions name their source and ask for review. The interface never claims an "AI optimized" journey. |
| Boarding passes and booking status | Do not use. | Transport appears as historical travel legs and practical details. |

## 3. Product-wide design principles

### 3.1 One event always looks like one journey

Every account history, personal highlight, profile card, discovery result, and question session points to the same canonical journey. Personal sharing changes the cover, selection, and caption. It does not create a second story.

The journey title, dates, location summary, member stack, and stable cover treatment remain recognizable across surfaces. Role, visibility, and draft status appear as secondary metadata.

### 3.2 Show what is known

The interface distinguishes recorded, captured, reported, estimated, and unknown information with text, icons, and line styles. Color only reinforces the distinction.

Suggestions use specific language:

- "Suggested from 14 selected moments"
- "Recorded from Neha's GPX file"
- "Reported by Arjun on 18 June 2026"
- "Estimated between Manali and Jobra"
- "No route recorded for this stage"

The interface does not use "smart", "magic", or "optimized" as evidence labels.

### 3.3 Save before processing

A successful native capture state means the item is durable on the device. Transcription, upload, and route association can happen later. A bounded location attempt stays within the explicit foreground capture action; saving does not wait for it. The confirmation message names the actual state.

### 3.4 Keep private and shared states visible

Capture destination and source scope remain visible before a person saves or contributes material. "Only me", "Journey review", and "Allow journey publication and sharing" are full labels, not hidden settings.

Journey review names its audience as the source owner and active coauthors/designated publishers. Ordinary participants do not gain review or draft access. Original-file export has a separate owner approval, with the recipient, selected files, and expiry visible.

### 3.5 Put the story before the map

Public Story loads useful text and a cover before a map or large media file. A journey without GPS still reads as complete. The map supplements the narrative and never becomes the only way to navigate.

### 3.6 Make publication deliberate

Ordinary edits stay in the draft. Publication uses a review flow with a blocker list and an exact viewer preview. A readiness percentage is not used because it can hide one serious privacy or rights problem inside an aggregate score.

### 3.7 Date every practical claim

Costs, arrangements, access observations, and lessons show the visit or observation date. The last edit date is separate. Historical experience never looks like current availability or advice.

### 3.8 Use defaults instead of page design tools

Authors edit content, order, inclusion, captions, and evidence. They do not choose templates, card colors, font pairs, or custom map themes in R1. One strong layout keeps public journeys readable and reduces authoring work.

## 4. Experience architecture

### 4.1 Product surfaces

| Surface | Primary user | Main job | Default character |
|---|---|---|---|
| Android/iOS creator app | Organiser, participant, contributor | Capture, import, sync, review, and make focused edits during or after travel | Fast, durable, and explicit about state |
| Responsive creator web | Coauthor, designated publisher, administrator | Organise the draft, resolve evidence, add practical details, preview, and publish | Dense enough for work, with a stable canvas and inspector |
| Public journey web | Friend, family member, follower, prospective traveller | Read Story, inspect Explore, and use Learn | Editorial, media-led, and account-free |
| Discover web | Prospective traveller | Find one relevant public journey and understand its dates and limits | Searchable catalog without social-feed mechanics |
| Personal highlight web | Journey member's audience | View a focused approved selection and open the full journey | Personal in selection, canonical in facts |

### 4.2 Journey state model

| State | Visible to | Primary action | Interface treatment |
|---|---|---|---|
| Local capture | Capture owner | Keep, edit, or queue | Device icon and "Saved on this device" |
| Private cloud | Capture owner | Contribute or retain | Cloud-lock icon and "Backed up privately" |
| Journey review | Source owner and active coauthors/designated publishers | Review or request rights; coauthors can include/exclude | People icon and amber review label |
| Shared draft | Active coauthors and designated publishers | Coauthors edit; publishers inspect and approve | Draft label with last saved revision |
| Approved version | Eligible viewers | Read or share | Version date and current visibility |
| Unlisted publication | Anyone with the link | Read and forward | Link icon and plain forwarding notice |
| Public publication | Anyone, including Discover visitors | Read, save, or ask | Globe icon and listing state |
| Archived journey | Permitted members and eligible viewers | View or export | Archive label and no contribution controls |

State changes use explicit verbs. Uploading, contributing, publishing, and listing are separate actions.

These rows describe different state axes, not one mandatory progression. Local persistence, upload, source scope, draft inclusion, publication, and archival can coexist. The [requirements capability matrix](product_requirements.md#25-capability-and-source-access-matrix) determines which actions each person sees.

### 4.3 Primary object hierarchy

1. Account
2. Journey reference in private history
3. Canonical journey
4. Chapter or meaningful stage
5. Travel leg, stop, moment, or practical detail
6. Source and source grant
7. Approved publication
8. Personal highlight selection or saved research reference

The interface never presents a personal highlight or saved research reference as a child journey.

## 5. Navigation and information architecture

### 5.1 Native app navigation

The existing A01–A09 screen IDs cover both native platforms; retain them for traceability. Adapt safe areas, system back behavior, permission dialogs, keyboard handling, and phone/tablet layout to each platform. iOS implementation and local verification are included now; store distribution is deferred under the [mobile development plan](../implementation/mobile_development_plan.md).

The signed-in Android/iOS app uses four bottom destinations:

| Destination | Content | Notes |
|---|---|---|
| Journeys | Created and joined journeys, invitations, and create action | This is the default destination. |
| Capture | Camera, short video, voice note, and text moment | The capture button is centered and visually prominent. |
| Moments | Personal captures, import review, and sync queue | Private items remain separate from journey contributions. |
| You | Account profile, saved research, storage, settings, and support | Public profile settings remain optional. |

Selecting a journey opens a journey workspace with these tabs:

- Overview
- Story
- Route
- Learn
- Sources
- People

Publish, Share my highlights, export, archive, and administration actions live in the journey overflow or a contextual action panel. They do not occupy persistent bottom-navigation space.

### 5.2 Creator web navigation

The creator web experience uses a persistent left rail at desktop widths:

- Home
- Journeys
- Saved research
- Discover
- Account

Inside a journey, the rail changes to journey tools:

- Overview
- Story
- Route
- Learn
- Sources
- People
- Publish

The journey title and a back action remain at the top. A compact status cluster shows draft save state, unresolved conflicts, publication visibility, and the last approved version.

### 5.3 Public web navigation

Global public navigation contains:

- Discover
- About the product
- Sign in

Inside a journey, a sticky segmented control contains:

- Story
- Explore
- Learn

The day or stage filter sits below this control. Switching views preserves the selected stage or moment.

### 5.4 Mobile web behavior

On mobile web, the journey title collapses into a compact header after the cover scrolls away. Story, Explore, and Learn remain reachable in one tap. The current day filter becomes a horizontal scroll row with a visible selected state.

## 6. Core workflows

### 6.1 Sign in and private history

The first signed-in screen answers two questions: "Which journeys are mine?" and "What needs attention?"

The screen contains:

- a title, "Your journeys".
- **Create journey** as the primary action.
- **Join with invite** as a secondary action.
- a small attention area for pending invites, failed uploads, publication blockers, or conflicts.
- journey cards with cover, title, dates, role, visibility, draft state, and member stack.
- filters for role, status, year, and category.
- a separate Saved research section.

The empty state uses a quiet field-note illustration and two actions. It does not populate the account with demo trips that can be mistaken for real history.

### 6.2 Create or join a journey

Create journey uses one short form:

1. Title
2. Intended start date and time
3. Optional end date and time
4. Timezone context
5. Optional journey category

After creation, the interface offers **Invite companions** and **Start capturing**. It does not request a detailed itinerary.

Joining an invitation shows the journey identity, inviter, dates, assigned role, and the permission facts before acceptance. The page states that joining does not grant access to the person's gallery and does not share existing personal moments.

### 6.3 Capture during the journey

The capture screen keeps the camera or selected input full height. A destination control remains visible at the top:

- Only me
- Journey review for [journey name]

The bottom mode rail contains Photo, Video, Voice, and Note. The location control uses three states: available, unavailable, and approximate. Location is never required to save.

After capture, a compact confirmation sheet shows:

- a thumbnail or media type.
- the local save state.
- the destination.
- the location evidence state.
- **Add note** and **Done** actions.

If offline, the confirmation reads "Saved on this device. Upload waiting for a connection." The app never displays "Backed up" before upload verification.

### 6.4 Import and candidate review

Import separates source selection from journey contribution.

The first step uses the system picker for photographs and videos, plus explicit Audio file, GPX, and FIT actions. The second step presents a review grid grouped by source date. Each item can show:

- original date and timezone confidence.
- location evidence.
- duplicate status.
- supported or unsupported state.
- suggested journey membership.
- current owner and destination.

The batch toolbar supports Include, Exclude, Correct date, Move to stage, and Set scope. A failed item stays in place with its own explanation. One unsupported file never rejects the whole batch.

The final step states exactly what uploads and who can see it. The default is private cloud storage unless the person deliberately chooses Journey review or publication reuse.

### 6.5 Contribute sources

The source-scope control uses three stacked radio cards with full explanations:

| Scope label | Explanation in the interface |
|---|---|
| Only me | Only you can access this item. |
| Journey review | You and active coauthors and designated publishers can review this item. It cannot be published yet. |
| Allow journey publication and sharing | The same review audience can inspect it. It can appear in the approved journey and eligible personal highlights, with credit. |

The person can apply a scope to a batch and inspect exceptions. The current scope appears on every source detail view. Explain that adding a coauthor or publisher changes the review audience; adding an ordinary participant does not. Administration alone grants no review, editing, publishing, or original-file export rights. Withdrawal uses a separate impact preview.

The source detail offers a separate original-file export request. The owner reviews the exact files, requesting member, journey, and expiry, then chooses **Allow original-file export** or **Decline**. Explain that originals can retain metadata omitted from public derivatives. The owner can inspect and revoke existing grants. Review or publication permission never checks this option automatically. Explain that downloaded originals cannot be recalled. [Requirements section 2.6](product_requirements.md#26-original-file-export-grants) owns the grant rules.

### 6.6 Build the shared draft

The creator workspace uses three panes on wide screens:

1. **Journey navigation.** Chapters, stages, gaps, and review counts.
2. **Editing canvas.** The selected chapter with narrative, moments, travel legs, and practical details.
3. **Inspector.** Source evidence, permissions, contributor credit, location, and revision details for the selected item.

The editing canvas uses the final reading width rather than a generic document editor width. Authors can preview how text and media will flow without entering a separate page-design mode.

Suggested chapters, stops, associations, and practical details appear in a review queue. Each suggestion shows its source before **Accept**, **Edit**, and **Dismiss**. Regeneration never replaces an accepted correction.

### 6.7 Resolve route and chronology

Route editing combines a map with an ordered stage list. The list remains usable when the map fails.

Each stage shows:

- time or explicit unknown time.
- stage title.
- people present when known.
- moment count.
- geometry evidence.
- unresolved questions.
- actions to merge, split, reorder, rename, or remove from the story.

Participant-specific departures appear as labelled branches that join the shared stage. The default overview emphasizes the shared route. It does not connect separate home locations into one false path.

Unknown movement appears as a gap row between two stages. The row can accept a reported mode without gaining exact geometry. If estimated provider geometry is enabled, the row retains an **Estimated route** label.

### 6.8 Edit practical details

Learn editing uses category groups for transport, stay, guide or local service, equipment, rental, costs, challenges and lessons, access, and unresolved questions.

A detail editor contains:

- a short factual statement.
- category.
- observation date.
- relevant chapter or leg.
- contributor.
- source link or explicit author report.
- evidence state.
- optional money, currency, unit, group size, and inclusions.
- optional contact-publication permission.

Suggested details remain visibly unconfirmed. A transcript excerpt can prefill a suggestion, but the author must confirm the structured detail before publication.

### 6.9 Resolve a conflict

When a stale edit conflicts with a saved revision, the interface opens a comparison panel. It shows:

- the current shared value.
- the contributor and save time.
- the stale candidate.
- the contributor and original edit time.
- source and permission changes since both edits.
- **Keep current**, **Use candidate**, and **Combine manually** actions.

The product never resolves a text conflict silently. Restore actions recheck current source grants before showing a preview.

### 6.10 Review and publish

Publish is a five-part review, not a percentage score:

1. Sources and publication rights
2. Sensitive places, media, and personal details
3. Unknown, estimated, and unresolved information
4. Story, Explore, Learn, link-preview, and question-source preview
5. Visibility and Discover listing choice

The review header reports the number of blockers, review items, and accepted unknowns. Missing rights and privacy violations block publication. An explicitly unknown route does not.

The visibility selector explains:

- Private draft
- Unlisted link
- Public and eligible for Discover review

The final action names the result, such as **Publish unlisted journey** or **Submit public listing**. Later draft edits display "Draft changed since 24 October publication" and require **Review and republish**.

### 6.11 Share personal highlights

Share my highlights opens from the approved journey. The first selection contains the member's eligible attributed contributions. The member can:

- select or remove eligible moments.
- choose a cover.
- add a personal caption.
- reorder the selection within the canonical journey context.
- preview a hosted selection and static social card.

Group material is never silently presented as the member's own. Selecting another contributor's eligible item keeps its credit visible. If the member has no eligible contributions, the interface offers **Choose permitted group moments** or **Share full journey**.

The preview states that the full public journey remains available. The action never widens the journey's visibility.

### 6.12 Withdraw, leave, transfer, archive, or delete

These actions have separate entries and separate impact previews.

| Action | Impact preview must state |
|---|---|
| Withdraw a source | Which story moments, cards, shares, citations, and answers will disappear |
| Leave journey | Which member access ends and whether source grants remain |
| Transfer administration | Who must accept and which powers move |
| Archive journey | Which contribution actions close and what remains readable or exportable |
| Unpublish | Which public and unlisted links, listings, profiles, and saved previews become unavailable |
| Delete personal media | Which derived content depends on it |
| Delete account | Which journeys, sources, grants, and administration responsibilities are affected |
| Delete canonical journey | That the shared record and every reference are affected while members keep their private originals |
| Allow original-file export | Which files the named member may export, the expiry, and the limit on recalling downloaded copies |
| Revoke original-file export | Which managed archives and future downloads stop working |

Destructive dialogs use the journey or source name. Broad actions require a second confirmation. Transfer must be accepted before the current administrator can rely on it.

Restriction status distinguishes **Access restricted. Recovery confirmation pending** from **Restriction complete**. Local access stops immediately. Completion requires the independently persisted recovery record; a delayed confirmation offers status and retry without restoring access. A journey without an accepted successor can remain frozen for new publication and role expansion while source withdrawal, deletion, and authorised visibility restrictions stay available.

## 7. Screen specifications

### 7.1 Screen inventory

| ID | Surface | Screen | Primary job |
|---|---|---|---|
| A01 | Android/iOS | Your journeys | Open, create, or join a canonical journey |
| A02 | Android/iOS | Capture | Save a photo, video, voice note, or text moment |
| A03 | Android/iOS | Capture confirmation | Verify local state, destination, and location evidence |
| A04 | Android/iOS | Moments and sync | Manage personal sources and upload state |
| A05 | Android/iOS | Import review | Select, correct, and scope existing sources |
| A06 | Android/iOS | Journey overview | See stages, recent changes, review work, and publication state |
| A07 | Android/iOS | Story or route edit | Make focused chapter, moment, and leg changes |
| A08 | Android/iOS | Share my highlights | Create a personal approved selection |
| A09 | Android/iOS | You and account | Manage the private profile, saved research, storage, settings, and support |
| W01 | Creator web | Journey home | See status, contributors, recent changes, and work queue |
| W02 | Creator web | Story editor | Edit chapters, narrative, captions, order, and inclusion |
| W03 | Creator web | Route editor | Correct stages, branches, recorded routes, and gaps |
| W04 | Creator web | Learn editor | Add dated, sourced practical details |
| W05 | Creator web | Sources | Review media, sharing/export grants, processing, attribution, and withdrawal |
| W06 | Creator web | People and roles | Manage invitations, roles, publishers, and administration |
| W07 | Creator web | Revision and conflict view | Compare changes and restore safely |
| W08 | Creator web | Publish review | Inspect rights, privacy, viewer output, and visibility |
| W09 | Creator web | History and account | Manage journey references, saved research, profile, exports, and account controls |
| P01 | Public web | Discover | Find a public journey |
| P02 | Public web | Story | Experience the approved narrative |
| P03 | Public web | Explore | Understand route, sequence, and evidence |
| P04 | Public web | Learn | Find practical details and ask sourced questions |
| P05 | Public web | Source detail | Inspect an approved supporting moment or transcript |
| P06 | Public web | Personal highlight | View a focused selection and open the full journey |
| P07 | Public web | Optional public profile | View intentionally selected eligible journeys |
| P08 | Public web | Unavailable | Reveal no protected title, cover, or location |

### 7.2 Journey home

Journey home has a photographic cover strip, the journey identity, and a concise status row. The main content is a work queue, not tourism marketing.

Desktop layout:

- left: journey facts, dates, members, roles, and visibility.
- center: chapter timeline with missing stages and recent activity.
- right: tasks such as three uploads waiting, two rights blockers, one conflict, or publication review due.

The native phone layout stacks the same content; iPad layouts adapt to the available width. The most urgent actionable item appears first. No weather, booking, packing, or readiness widget appears.

### 7.3 Story editor

The canvas previews the public reading rhythm. Chapters use generous vertical spacing and a visible journey-line spine. Inline controls appear on selection or keyboard focus instead of surrounding every block.

The author can:

- edit the title, summary, chapter title, narrative, and caption.
- choose a cover from eligible sources.
- insert an eligible moment or source-linked practical detail.
- reorder a chapter or moment.
- exclude an item without deleting the original.
- add a stage or note with no media.
- inspect provenance in the right panel.

Autosave state sits in the top bar. A successful save includes a revision timestamp. Offline or conflict states replace the success message and remain visible until resolved.

### 7.4 Route editor

Desktop uses a 55 percent map and 45 percent stage panel. The selected stage controls both. Mobile uses a map with a draggable sheet, but the stage list can expand to full screen.

Map controls include zoom, fit journey, fit stage, legend, and a list fallback. Editing actions live in the stage panel. Dragging pins is not the only correction method because fine map gestures are inaccessible and imprecise.

### 7.5 Publish review

The left side contains the five review sections. The right side shows the exact mobile viewer preview. The preview can switch among Story, Explore, Learn, link card, and question sources.

Blockers use a red square icon and a direct explanation. Review items use an amber diamond. Accepted unknowns use an open gray circle. The primary action remains disabled only for true blockers.

### 7.6 Discover

Discover is an editorial catalog, not an endless social feed.

The page contains:

- a direct search field for route or destination.
- filters for region, visit date or season, category, duration, and status when data exists.
- one result card per canonical journey.
- a clear visited date range.
- journey duration and category.
- a short approved summary.
- source and route coverage hints such as "4 recorded stages, 2 estimated transfers".
- contributor identity only when approved.

Results do not show likes, follower counts, popularity rankings, invented ratings, current weather, or booking prices. Missing metadata remains absent or labelled unknown.

### 7.7 Story

Story opens with approved content before account prompts. The cover contains:

- journey title.
- date range and duration.
- place summary.
- approved contributor credit.
- a short factual summary.
- **Start story** and **Explore route** actions.

The body uses a readable vertical sequence. Each chapter can contain narrative, a media group, travel legs, selected practical callouts, and an optional route sketch from approved geometry. A **Show map** action can open a desktop side map that follows the selected chapter without trapping page scrolling. Reading, scrolling, and idle time do not initialize a map or request basemap resources. Provider map screenshots are outside the R1 thumbnail/export baseline.

The final chapter includes the return, not only the headline activity. The footer offers Explore, Learn, report, and permitted share actions.

### 7.8 Explore

Explore prioritizes a 2D map and stage timeline. It contains:

- whole journey and stage filters.
- a Map/Satellite control using the same Mapbox map, with Map selected initially.
- visible evidence legend.
- participant-branch control when relevant.
- moment markers with accessible list equivalents.
- play, pause, next, previous, and stage selection.
- a bottom or side panel with the selected moment and its context.

Playback starts only after user action. Estimated connections stay dashed while moving through the sequence. Route gaps remain breaks. Reduced motion replaces camera travel with direct stage changes.

### 7.9 Learn

Learn opens with a short statement: "Reported from this journey, visited 12 to 19 June 2026." It contains category filters, text search, practical cards, unresolved questions, and the signed-in question entry.

Every card shows:

- category.
- concise reported detail.
- observation date.
- evidence state.
- contributor or author report.
- chapter or travel leg.
- source link.
- money context when applicable.

Question answers use the same card and source styles. If evidence is missing, the answer states that the journey does not contain the answer. Questions about current conditions display a prompt to confirm with a current official or local source.

### 7.10 Unavailable state

The unavailable page uses neutral brand treatment and the text "This journey is not available." It provides **Go to Discover** and **Report a problem**. It does not reveal the private title, dates, place, member names, cover, or prior visibility.

## 8. Visual system

### 8.1 Color palette

The palette is light-first. Full dark mode is not part of this baseline. Dark media controls and map overlays use the Ink inverse tokens.

| Token | Value | Use |
|---|---|---|
| Paper 50 | `#F6F2E8` | Page background and public story field |
| Paper 0 | `#FFFDF8` | Main surfaces, sheets, and cards |
| Ink 950 | `#172019` | Primary text and dark controls |
| Ink 700 | `#3F4C43` | Secondary text |
| Ink 500 | `#646F66` | Metadata with approved contrast on light surfaces |
| Line 200 | `#D8DDD6` | Borders, separators, and inactive tracks |
| Forest 800 | `#234F3B` | Primary action and recorded-route anchor |
| Forest 600 | `#3D735A` | Selected controls and secondary route marks |
| Forest 100 | `#DDE9E0` | Selected backgrounds and success surfaces |
| Clay 800 | `#81411F` | Review text and strong estimated-route label |
| Clay 500 | `#C86F3F` | Accent marks, suggestion icons, and focus accents |
| Clay 100 | `#F4E0D3` | Review and suggestion backgrounds |
| River 800 | `#285E78` | Captured-stop and information states |
| River 100 | `#DFEBF0` | Information backgrounds |
| Danger 800 | `#963D38` | Destructive actions and blockers |
| Danger 100 | `#F5DFDC` | Error backgrounds |
| Night 950 | `#0E1511` | Media overlays and dark map chrome |
| White | `#FFFFFF` | Text and icons on dark controls |

Primary text uses Ink 950. Forest 800, Clay 800, River 800, and Danger 800 are the only semantic colors used for text on Paper 0 or Paper 50. Lighter semantic colors are backgrounds only.

### 8.2 Evidence palette and patterns

| Evidence | Color | Shape or line | Required label |
|---|---|---|---|
| Recorded route | Forest 800 | 3 px solid line | Recorded |
| Captured stop | River 800 | Filled center with an accuracy ring | Captured stop |
| Author-reported travel | Ink 700 | Endpoint pair with transport icon, no implied exact line | Reported travel |
| Estimated connection | Clay 800 | 2 px dashed line | Estimated |
| Unknown movement | Ink 500 | Visible break with open-circle endpoints | No route recorded |
| Suggested association | Clay 500 | Diamond marker | Suggested |
| Publication blocker | Danger 800 | Square marker with cross | Blocker |

Map, timeline, and card legends use the same words. Do not rename "Estimated" as "Likely" or "Suggested route" on another surface.

### 8.3 Typography

| Role | Family | Weight | Use |
|---|---|---|---|
| Editorial display | Newsreader | 500 and 600 | Public journey title, Discover title, and major chapter title |
| Interface and body | Instrument Sans | 400, 500, 600, and 700 | Controls, body copy, metadata, creator tools, and practical details |

Self-host WOFF2 files when licensing permits. Use a short fallback stack and reserve line height to prevent layout shift.

| Style | Desktop | Mobile | Family |
|---|---|---|---|
| Display | 52 px at 56 px | 38 px at 42 px | Newsreader 600 |
| Page title | 38 px at 44 px | 32 px at 38 px | Newsreader 600 on public pages, Instrument Sans 700 in creator tools |
| Section title | 28 px at 34 px | 25 px at 31 px | Newsreader 600 on Story, Instrument Sans 700 elsewhere |
| Card title | 19 px at 25 px | 18 px at 24 px | Instrument Sans 600 |
| Body | 16 px at 25 px | 16 px at 24 px | Instrument Sans 400 |
| Compact body | 14 px at 20 px | 14 px at 20 px | Instrument Sans 400 |
| Label | 13 px at 17 px | 13 px at 17 px | Instrument Sans 600 |
| Metadata | 12 px at 16 px | 12 px at 16 px | Instrument Sans 500 |

Primary reading text never drops below 16 px. Map labels and dense metadata may use 12 px when an accessible list equivalent contains the same information.

### 8.4 Spacing and grid

Use a 4 px base unit with these named steps: 4, 8, 12, 16, 24, 32, 48, 64, and 96.

| Width | Grid | Outer margin | Gutter | Content behavior |
|---|---|---|---|---|
| 320 to 767 px | 4 columns | 16 px | 12 px | One primary pane and sticky contextual actions |
| 768 to 1199 px | 8 columns | 24 px | 16 px | Two panes or a main pane with a drawer |
| 1200 px and above | 12 columns | 32 px | 24 px | Three-pane creator layout or story with side map |

Public page content has a maximum width of 1280 px. The main Story reading column stays between 640 and 720 px. Full-bleed approved media can extend beyond it at desktop widths.

### 8.5 Shape and elevation

| Token | Value | Use |
|---|---|---|
| Radius small | 8 px | Tags, compact inputs, and thumbnails |
| Radius medium | 14 px | Buttons, cards, and panels |
| Radius large | 22 px | Sheets, cover cards, and major map containers |
| Radius round | 999 px | Chips, avatars, and segmented controls only |
| Border | 1 px Line 200 | Default surface separation |
| Raised shadow | `0 12px 32px rgba(23, 32, 25, 0.10)` | Floating sheets, menus, and map panels |
| Focus ring | 3 px Clay 500 with 2 px Paper 0 offset | Keyboard and switch-access focus |

Routine list rows use spacing and separators, not individual shadows. One screen has no more than two elevation levels.

### 8.6 Iconography

Use a single rounded-outline icon set at 1.75 px stroke. Fill indicates a selected destination or a completed state. Do not mix detailed illustrations with utility icons.

Critical meanings pair icons with text. Evidence icons remain fixed:

- route trace for Recorded.
- pin with ring for Captured stop.
- person and note for Reported.
- dashed connector for Estimated.
- open circle for Unknown.
- lock for Only me.
- people for Journey review.
- globe and check for publication reuse.

### 8.7 Photography and illustration

Use approved journey photography in its original aspect ratio where practical. Cropped covers preserve a user-selected focal point. Public thumbnails strip private metadata.

Editorial treatment:

- natural color with modest contrast.
- no artificial tropical tint applied across all trips.
- no text over a busy image without a tested scrim.
- no generic stock photo as a journey cover.
- clear credit when the photographer differs from the uploader.

Illustration is reserved for onboarding, empty states, and generic errors. Use simple topographic contours, notebook marks, and sparse field objects. Do not use robots, magic sparkles, airplane doodles, or destination stereotypes to represent automated processing.

### 8.8 Map styling

Use Mapbox Standard in a quiet 2D configuration, secondary to journey evidence. Reduce commercial points of interest and saturated road colors. Retain labels that help viewers orient themselves. A user-selected Satellite view uses Mapbox Standard Satellite through the same renderer. Keep branding, attribution, imagery credits, and required telemetry controls accessible above the native sheet.

Selected journey geometry is the highest-contrast map element. Nonselected geometry recedes but remains distinguishable. Sensitive location generalization changes both visible markers and the data used to calculate bounds.

Changing Map/Satellite preserves the stage, camera context, evidence legend, markers, and route overlays. Restore layers after the new style loads. Check contrast in both styles. Satellite imagery is geographical context, not evidence of current conditions or the participant's recorded route. An unavailable map retains the ordered stage list. The architecture owns SDK integration and billing; no additional map provider or imagery library enters the design handoff.

## 9. Component system

Web components use owned shadcn source and Tailwind. Native components use React Native controls styled with Unistyles v3. Both consume the color, spacing, typography, shape, and evidence tokens defined in this document through `packages/design-tokens`; the token package remains platform-neutral. Mobile owns its Unistyles theme registration, typed variants, and responsive styles. Use variants for component size/state differences and style arrays when composing reactive styles. Do not spread Unistyles style objects or substitute NativeWind utility classes.

Initialize the native theme before routes create stylesheets. Preserve the existing field-journal palette and component semantics rather than adopting example colors or a new visual direction from a skill. Responsive behavior, larger text, safe areas, touch targets, and reduced motion remain design acceptance obligations on both platforms. Unistyles does not add a dark-mode product requirement; any additional theme must meet the same approved design and accessibility rules. The [repository setup plan](../implementation/repository_setup_plan.md) owns integration details and native verification.

### 9.1 Buttons

| Variant | Use | Treatment |
|---|---|---|
| Primary | One main action in a region | Forest 800 background, white label |
| Secondary | Supporting action | Paper 0 background, Forest 800 border and label |
| Tertiary | Low-emphasis action | Text and icon with no persistent container |
| Destructive | Confirmed removal or deletion | Danger 800 background or label, depending on severity |
| Floating capture | Open capture modes | 56 dp Forest 800 circle with camera-plus icon and text alternative |

Buttons use a minimum height of 48 dp on Android, 44 pt on iOS, and 44 CSS px on web. Loading buttons retain their label width and state the active operation.

### 9.2 Inputs and selection controls

Inputs use persistent labels above the field. Placeholder text provides an example and never replaces a label. Errors appear below the field with an icon and a correction.

Segmented controls are limited to three to five peer views, such as Story, Explore, and Learn. Filters use chips only when several values can be scanned horizontally. Destructive, permission, and visibility choices use radio cards or explicit menus rather than compact chips.

### 9.3 Journey card

A journey card contains:

- approved or private cover thumbnail.
- title.
- start and end date.
- duration when known.
- role and draft or publication state.
- member stack when permitted.
- one status line.
- one primary opening action.

The same card component supports private history, Discover, saved research, and public profiles through controlled variants. The variant never changes the canonical identity.

### 9.4 Chapter card

A chapter card connects to the journey line. It contains the chapter title, time or date, short summary, moment strip, and route evidence. Creator variants add review count and drag handles. Public variants omit editing controls.

A chapter without media uses type, spacing, and the journey line. It does not insert a placeholder image.

### 9.5 Moment card

A moment card contains media or a text or audio representation, capture time, contributor, place evidence, source scope, and processing state. Public variants show only approved fields. Audio includes a play control and transcript access. Video never autoplays with sound.

### 9.6 Practical detail card

The top row contains category and observation date. The body contains the concise report. The footer contains evidence, contributor, chapter, and source action. Money uses a structured row for amount, currency, unit, group size, and inclusions.

An edit date can appear in a details view. It never replaces the observation date in the card header.

### 9.7 Source badge

Source badges use an icon, evidence word, and optional contributor or file. Examples:

- Recorded · `hampta-day-2.gpx`
- Reported · Mira · 18 Jun 2026
- Captured stop · accuracy about 80 m
- Estimated · between confirmed stops
- Unknown · no source supplied

Badges open a source detail when the viewer has access.

### 9.8 Sync status

Use these exact state names across Android, iOS, and web:

| State | Icon | Default message |
|---|---|---|
| Saving | Spinner | Saving on this device |
| Saved locally | Device check | Saved on this device |
| Queued | Clock | Waiting to upload |
| Uploading | Progress ring | Uploading, 42% |
| Private cloud | Cloud lock | Backed up privately |
| Journey review | People check | Shared for journey review |
| Published | Globe check | Included in the approved journey |
| Failed | Warning triangle | Upload failed. Your local copy is safe. |
| Missing source | Broken file | Reselect the original file to continue |

Success toasts may confirm a transition, but the durable state remains visible on the item.

Use "Your local copy is safe" only after verifying that the persistent file remains available. Missing, evicted, or unreadable sources use the missing-source state. The completed Android/iOS capture guarantee relies on app-owned files and SQLite. Web drafts use browser storage and disclose eviction/clearing limits and any need to reselect files; the shared labels do not promise identical storage guarantees.

### 9.9 Empty, loading, failure, and unavailable states

Every data component defines four states:

- Empty explains what belongs here and offers one relevant action.
- Loading preserves layout with a small skeleton or progress label.
- Failure names what failed and separates retry from destructive actions.
- Unavailable reveals no protected content and offers a safe exit.

Map and question failures never replace Story or Learn content that is already available.

### 9.10 Notifications and attention

Use inline notices for states that affect the current task. Use a global inbox only for invitation, source withdrawal, role change, conflict, publication, listing, and administrative events. Upload progress stays with the source or sync queue.

Notifications state the actor, object, and impact. Example: "Ravi withdrew one photo. It was removed from Day 3 and your hosted highlights."

## 10. Interaction and motion

### 10.1 Motion principles

Motion explains continuity and selection. It does not imply certainty or simulate travel that was not recorded.

- Screen transitions use 160 to 220 ms ease-out.
- Sheets use 220 to 280 ms with direct finger tracking.
- Saved-state changes use a brief icon morph without moving surrounding content.
- Story chapters can fade and rise by 8 px as they first enter the viewport.
- Explore playback moves only along recorded or explicitly estimated geometry.
- Unknown gaps cut directly to the next known stage.
- Reduced motion removes camera travel, parallax, and scroll-triggered movement.

### 10.2 Gestures

Every gesture has a visible control alternative. Reordering supports keyboard and move-up or move-down actions. Map pin correction supports a search or coordinate form. Swipe actions never expose the only path to delete, withdraw, or contribute.

### 10.3 Feedback

Capture confirmation uses light haptic feedback after the local write succeeds. Publishing and destructive actions do not use celebratory confetti. They use a stable result screen with the new visibility and next available actions.

## 11. Responsive behavior

### 11.1 Creator tools

At 1200 px and above, the creator workspace uses navigation, canvas, and inspector panes. Between 768 and 1199 px, the inspector becomes a right drawer. Below 768 px, only one pane is visible and selection opens a full-height sheet or page.

The editor preserves content order across widths. Mobile editing does not hide rights, evidence, or publication state behind hover interactions.

### 11.2 Public Story

On desktop, Story can use a reading column with a sticky map or chapter index. On tablet, the map becomes an inline chapter module. On mobile, Story is one column and the stage filter remains sticky below the compact header.

### 11.3 Explore

Desktop uses map plus side panel. Tablet uses map plus bottom panel. Mobile opens with a 55 percent height map and a draggable stage sheet. A **View as list** action is always visible.

### 11.4 Learn

Desktop can use a filter rail and two-column card grid. Mobile uses a horizontal filter row and one-column cards. Search and question input remain distinct. Search works without sign-in. Questions require sign-in.

## 12. Accessibility

R1 targets WCAG 2.2 AA for primary controls and reading surfaces.

### 12.1 Required behavior

- Text and interactive controls meet AA contrast in all defined states.
- Color never carries evidence, sync, permission, or error meaning alone.
- Touch targets are at least 48 dp on Android, 44 pt on iOS, and 44 CSS px on web.
- Keyboard focus order follows visual order.
- Focus remains visible over maps, media, and dark overlays.
- Story, Explore, and Learn use landmarks and stable heading levels.
- Every map selection has an equivalent ordered list item.
- Route styles have text labels and accessible descriptions.
- Media has captions, transcripts, or an explicit unavailable state.
- Photographs have author-supplied or reviewed alt text when they convey story information.
- Decorative images use empty alternative text.
- Playback never starts automatically with audio.
- Reduced motion replaces route animation and camera movement.
- Screen-reader announcements report save, upload, conflict, and publication state changes without stealing focus.
- Verify native flows with Android TalkBack and iOS VoiceOver, including iPhone/iPad safe areas, larger text, keyboard behavior, and permission-denied recovery.
- Drag-and-drop actions have button and keyboard alternatives.
- Charts, statistics, and progress displays include text values.

### 12.2 Map description pattern

An Explore map exposes a concise summary before its controls. Example:

> Day 2 contains one recorded hiking segment from Jobra to Chika, two captured stops, and an unknown connection after Chika.

The stage list provides the full navigable alternative.

## 13. Content design

### 13.1 Voice

The interface is calm, factual, and direct. It separates product state from travel storytelling. Creator tools use verbs. Public stories use the authors' approved voice.

### 13.2 Terminology

| Use | Do not use |
|---|---|
| Journey | Plan, itinerary, package, or adventure when referring to the canonical record |
| Moment | Post or content |
| Chapter or stage | Day only, because a stage can cross dates or contain no route |
| Recorded | Verified or exact |
| Reported | Proven |
| Estimated | Optimized or smart route |
| Unknown | Missing data error when the absence is valid |
| Journey review | Shared album |
| Allow journey publication and sharing | Public by default |
| Story, Explore, Learn | Feed, map mode, and tips |
| Saved research | Wishlist or completed trip |

### 13.3 Dates and freshness

Use "Visited 12 to 19 June 2026" for the journey period. Use "Reported 14 June 2026" for a practical observation. Use "Edited 1 November 2026" only as secondary history.

For old or potentially time-sensitive details, add: "This is a report from June 2026. Confirm current availability and requirements."

### 13.4 Automated suggestions

Name the action and its input:

- "We grouped these 12 moments by capture time."
- "This place name came from the note attached to the photo."
- "The recording has a gap from 14:12 to 15:03."
- "Review the suggested taxi fare before it appears in Learn."

Do not personify the system or place an AI badge on every suggestion. A single information link can explain automated processing, privacy, and source handling.

### 13.5 Errors

Errors answer three questions: what failed, what remains safe, and what the person can do next.

Example: "The video could not upload. The copy on this device is safe. Retry on Wi-Fi or remove it from the queue."

## 14. Trust, privacy, and permission presentation

### 14.1 Permission facts stay near the action

Before capture, contribution, publication, personal sharing, or withdrawal, show the current audience and consequence. Do not rely on a settings page to explain scope.

Apply the [capability matrix](product_requirements.md#25-capability-and-source-access-matrix) consistently to navigation and controls. A publisher can inspect the draft without coauthor editing controls. An administrator without editorial capabilities sees management actions, not review sources. A contributor manages their own sources even when they cannot inspect other members' contributions. Publication reuse and original-file export use separate controls.

### 14.2 Redaction preview

The publication preview can overlay:

- generalized map areas.
- hidden route sections.
- removed media.
- stripped metadata.
- excluded transcript passages.
- disabled source links.
- affected practical cards and questions.

The preview reads the same viewer-safe payload used by the public experience. A decorative mock preview is insufficient.

### 14.3 Attribution

Uploader, original photographer when supplied, contributor, people pictured, and people present are separate fields. Public credit uses the approved display identity. Membership never publishes a full roster by default.

### 14.4 Historical limits

Learn and question answers never imply current safety, access, prices, or legal permission. The journey date, source, and evidence state remain visible at the point of use.

## 15. Performance and graceful degradation

The public experience targets p75 LCP at or below 2.5 seconds on the agreed mobile 4G profile.

### 15.1 Loading order

1. Journey title, dates, summary, and first chapter text
2. Responsive cover derivative
3. First visible media derivative
4. Remaining chapter media

Reserve media dimensions to prevent layout shifts. Lazy-load offscreen media. Never require the map bundle to render Story text.

Initialize a map and request its basemap resources only when the person opens Explore, opens the route editor, or selects **Show map** in Story. A direct Explore link counts as that action. Story reading, scrolling, and idle time do not initialize a map. Load transcripts and question controls when their source or Learn interface needs them, independently of whether a map has opened.

### 15.2 Failure behavior

| Failure | Product response |
|---|---|
| Map provider unavailable | Keep Story and Learn available. Explore opens the ordered stage list with a retry action. |
| Question service unavailable | Keep search, practical cards, and source links available. State that questions are temporarily unavailable. |
| Transcript processing failed | Keep playable approved media and captions. Offer the transcript failure state to authors. |
| Large media delayed | Show the derivative or poster frame, file state, and user-started retry. |
| Source withdrawn | Remove the source and dependent claims. Show a generic unavailable state to ineligible viewers. |
| Offline creator | Keep durable local capture and editing where supported. Show queued work and conflict risk. |

## 16. Design measurement and usability checks

Design validation uses tasks from the product requirements instead of preference ratings alone. Before release, representative community participants complete these tasks in the full release candidate after internal security/privacy checks. Record consent, failures, assistance, and fixes. Post-release adoption evaluation is a separate activity under product plan section 8.3.

### 16.1 Creator checks

- A participant captures offline and can state whether the item is local, backed up, or shared.
- A participant joins a journey without believing that the group can see their gallery.
- A contributor changes a batch from Only me to Journey review and explains the publication limit.
- A coauthor identifies recorded, reported, estimated, and unknown route sections without opening the legend after first use.
- A publisher finds every rights and privacy blocker and knows which unknowns can remain.
- Two coauthors resolve a stale edit without losing either candidate.
- An administrator distinguishes leaving, withdrawing sources, transferring administration, archiving, unpublishing, and deleting.
- A participant, coauthor, publisher without editing capability, and administrator without editorial capabilities see only their permitted sources and actions.
- A source owner can approve or revoke original-file export for a named member and explain the difference from publication reuse.
- A contributor can distinguish immediate access restriction, pending recovery confirmation, and a completed restriction.

### 16.2 Viewer checks

- A new mobile visitor explains the complete departure-to-return sequence without using the map.
- The visitor switches from Day 2 in Story to the same Day 2 context in Explore and Learn.
- The visitor finds a dated transport or rental detail and opens its source.
- The visitor recognizes an estimated connection and does not describe it as a recorded route.
- A signed-in visitor asks for an unknown current price and receives an abstention rather than an invented answer.
- A personal highlight viewer understands that the selection belongs to one full canonical journey.
- Reading Story without opening a map makes no map-instance or basemap requests, including after idle time.

### 16.3 Design quality signals

Track task completion, errors, time on task, help requests, abandoned imports, unresolved review items, and misinterpretations of evidence or permission. Count canonical journeys separately from memberships, shares, bookmarks, listings, and question sessions.

## 17. Requirement traceability

| Design area | Main requirement coverage |
|---|---|
| Journey identity and history | TRP-01 through TRP-06, PRO-01 through PRO-06, OWN-01 |
| Capture and durable state | CAP-01 through CAP-08, SYN-01 through SYN-06 |
| Import review | IMP-01 through IMP-09 |
| Source scopes and collaboration | COL-01 through COL-10 |
| Journey line and route evidence | REC-01 through REC-08, GEO-01 through GEO-06 |
| Story editor | STO-01 through STO-07 |
| Learn cards | LRN-01 through LRN-06 |
| Publish review and redaction preview | PUB-01 through PUB-08 |
| Story, Explore, and Learn | VWR-01 through VWR-08 |
| Personal highlights | SHR-01 through SHR-08 |
| Discover, saved research, and public profiles | DIS-01 through DIS-07, PRO-05, PRO-06 |
| Search and sourced questions | ASK-01 through ASK-09 |
| Lifecycle controls | TRP-05, OWN-02 through OWN-05 |
| Accessibility, limits, and operations | Product requirements section 17 |

## 18. Handoff package

Design handoffs follow the ten delivery steps in [requirements section 18.2](product_requirements.md#182-dependency-aware-implementation-sequence) and [architecture section 16](architecture.md#16-implementation-dependencies-and-release-evidence). Foundation tokens, type, iconography, responsive layouts, and accessibility behavior start with step 1 and continue throughout.

| Order | Design handoff | Controls delivered with it |
|---|---|---|
| 1 | Contracts, accounts, canonical identity, membership, capabilities, source/export grants, and audit. | Sign-in/recovery, private history, journey setup, role-aware controls, permission selectors, account impacts, and restriction status language. |
| 2 | Android/iOS capture, durable local saving, queues, and sync. | Confirmation, cancellation/retry, offline and storage failures, own-source removal/export, and visible destination. |
| 3 | Selected-media, audio, GPX, and FIT import and safe processing. | Candidate review, provenance, per-file errors, batch choices, and declared limits. |
| 4 | Contributions, revision-aware shared editing, conflicts, transfer, and departure. | Sources/People, stale-candidate comparison, revision recovery, source withdrawal, original-file export approval/revocation, transfer acceptance, and departure impacts. |
| 5 | Supported transcription and transcript review. | Language support, correction provenance, source offsets, pending/failed/unsupported states, and source playback. |
| 6 | Reconstruction, geography, canonical story editing, and practical details. | Story/Route/Learn editors, evidence legend, branches/gaps, transcript-based suggestions, dated cost context, and accessible correction controls. |
| 7 | Accessible viewer modes, safe approved-version generation, privacy preview, publishing, and revocation. | Story/Explore/Learn/source/unavailable views, exact publisher preview, explicit map loading, unpublish, privacy impacts, and pending recovery confirmation. |
| 8 | Personal highlights, static cards, and optional public-profile references. | Eligible selection, attribution, empty-selection fallback, full-journey access explanation, and revocation. |
| 9 | Public catalog, listing moderation, saved research, and future-event references. | Discover filters, listing/report/takedown states, private notes, reference removal, and distinct-event creation. |
| 10 | Search, grounded question sessions, citations, quotas, and answer invalidation. | Guest search, signed-in questions, source jumps, limits, abstention, provider failures, and invalidated answers. |

Withdrawal, archival, permitted export, deletion, retention, security, and support interactions accompany the data/action that introduces them. They are not a final handoff. Transcription precedes the reconstruction and practical suggestions that consume it.

Each handoff includes the relevant mobile, tablet, and desktop layouts. It also includes keyboard and screen-reader behavior, component tokens, copy, and requirement references. Native handoffs specify Unistyles token/variant mappings and responsive behavior; web handoffs specify the matching shadcn/Tailwind tokens. Loading, empty, failure, offline, and permission-denied states are part of the handoff.

## 19. Open design decisions

The following choices remain open because the product baseline does not settle them:

- final product name, wordmark, app icon, and domain.
- final font licensing and delivery method.
- final Mapbox style configuration, outdoor-detail legibility, and overlay contrast on the selected Android and iOS devices. Mapbox and the Map/Satellite behavior are already selected.
- supported Android/iOS versions and platform-specific phone/tablet navigation details.
- numerical media, route, storage, and question limits.
- supported transcript languages.
- exact public listing review status copy and service-level expectations.
- retention and revocation timing shown to users.
- whether a full dark theme enters a later design scope.

These decisions can change tokens or copy. They do not change the journey model, evidence semantics, privacy states, or Story, Explore, and Learn structure defined here.

## 20. Design acceptance checklist

A screen or flow is ready for implementation when all applicable statements are true:

- It represents one canonical journey and does not imply a copied event.
- It shows the current audience, source scope, and publication state near relevant actions.
- It applies the capability matrix and keeps original-file export approval separate from review/publication grants.
- It distinguishes recorded, captured, reported, estimated, and unknown evidence without relying on color.
- It preserves valid gaps, missing media, rest stages, and routes without GPS.
- Map/Satellite changes retain selected context and journey layers, with readable attribution and an equivalent stage list.
- It names the actual local, upload, review, draft, and publication state.
- It provides loading, empty, failure, permission-denied, offline, and unavailable states.
- It has keyboard, screen-reader, reduced-motion, and map-list behavior.
- It keeps Story readable without a map, AI response, transcript, or heavy media file.
- It initializes maps only on an explicit map action, including when the page has been idle.
- It shows observation dates and source access for practical claims.
- It provides an exact impact preview for permission, withdrawal, transfer, unpublish, and deletion actions.
- It distinguishes a local access restriction from pending recovery confirmation and completed independent persistence.
- It uses approved sources in previews, cards, listings, profiles, highlights, and question citations.
- It contains no booking, readiness, packing, navigation, live tracking, social-feed, rating, or safety-certification behavior.
- It maps to the product requirement IDs in section 17 of this document.
