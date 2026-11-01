# Product plan and vision

| Document field | Value |
|---|---|
| Version | 2.2 |
| Date | 1 November 2026 |
| Status | Product vision and strategy with the current architecture choices reconciled. Implementation has not started. |
| Product owner | Founder. |
| Brand | Not selected. The product description is not a confirmed brand. |
| Initial audience | People taking self-organised multi-day trips with friends. |
| Initial market | Reachable Indian outdoor and travel communities. |
| First-year priority | Useful community adoption, followed by revenue experiments. |
| Document responsibility | Product purpose, audience, problem, comparisons, experience, direction, launch, and success measures. |
| Companion document | [Product requirements](product_requirements.md), the complete functional and release baseline. |
| Technical decisions | [Architecture section 14](architecture.md#14-canonical-stack-and-dependency-register) owns the selected stack, versions, and installation stages. |

Read this document to understand what the product is and why it should exist. Use the companion requirements document to plan and verify implementation.

The implementation uses React with Vite+ and TanStack on web, Expo/React Native on Android, and Mapbox for basemaps, satellite imagery, and journey overlays. The existing VPS hosts application data and SeaweedFS with an S3-compatible interface for future R2/AWS S3 migration. External AI/maps are allowed. Development email uses Mailpit; production uses Resend. These choices support the complete agreed R1 scope.

## Contents

1. [Product vision and promise](#1-product-vision-and-promise)
2. [Problem and opportunity](#2-problem-and-opportunity)
3. [Audience and jobs](#3-audience-and-jobs)
4. [Positioning and comparisons](#4-positioning-and-comparisons)
5. [Product principles and boundaries](#5-product-principles-and-boundaries)
6. [End-to-end product experience](#6-end-to-end-product-experience)
7. [Product direction and release boundaries](#7-product-direction-and-release-boundaries)
8. [Success measures and community evaluation](#8-success-measures-and-community-evaluation)
9. [Community launch and commercial direction](#9-community-launch-and-commercial-direction)
10. [Product risks and responses](#10-product-risks-and-responses)
11. [Open product and operating decisions](#11-open-product-and-operating-decisions)
12. [Research basis and product evidence](#12-research-basis-and-product-evidence)

## 1. Product vision and promise

The product records one shared journey from departure to return and turns its photographs, short videos, voice notes, written observations, and optional GPS recordings into an interactive story and reusable practical knowledge.

One group event has one canonical journey, meaning the authoritative shared account of that event. Companions coauthor it, retain attribution and source ownership, and share personal highlights from the same record. A later group or departure creates a separate journey.

### 1.1 Vision

Make a complete journey easy to capture, worth experiencing, and useful to learn from.

### 1.2 Product promise

Capture your whole journey. Let others experience it and learn from it.

The journey includes the travel before an activity, the activity itself, stays, rest days, transfers, challenges, and the return. A mountain trek, a road trip, a cycling expedition, or another multi-day adventure can use the same basic structure.

### 1.3 Intended outcome

A group turns captured moments into one coherent journey with little post-trip editing. Each member sees the same event in their history and can share personal highlights from it. Friends and other visitors understand what happened. Someone preparing for a similar trip can discover a public journey and find its reported transport, accommodation, equipment, rentals, guides, costs, and lessons.

## 2. Problem and opportunity

### 2.1 The fragmented journey

People already capture photographs, videos, activity recordings, messages, and occasional notes. They later explain a trip through an album, social posts, a vlog, or separate daily activity links. The overall sequence and the practical arrangements are often distributed across those sources.

The product addresses four connected jobs:

1. Preserve what happened across the entire trip without repeatedly writing a journal.
2. Explain the journey in an understandable sequence and geographical context.
3. Let companions coauthor one account while retaining source ownership, attribution, and personal sharing choices.
4. Make the details behind the experience findable by someone learning from it.

### 2.2 Practical information people seek

Public discussions show prospective trekkers asking recent visitors about camps, transport, permissions, equipment, food, and actual arrangements. A [Hampta Pass planning discussion](https://www.reddit.com/r/trekkingIndia/comments/1tqtxa3/planning_to_do_hampta_pass_solo_without_an_agency/) and a [separate returning-group discussion](https://www.reddit.com/r/trekkingIndia/comments/1udoarh/did_hampta_pass_diy_with_friends_ama/) illustrate the job.

These examples support testing the problem. They do not establish how many community members need a separate product or how much they will contribute or pay.

### 2.3 Opportunity hypothesis

A low-effort capture workflow, a coherent story, and source-linked practical details can make the same trip record valuable to its author, its audience, and a later group.

The hypothesis succeeds only if contributors supply useful material and the finished result is preferable to their current tools. Software cannot create fresh field observations when nobody supplies them.

## 3. Audience and jobs

| Person | Situation | Desired result | Initial priority |
|---|---|---|---|
| Trip organiser and main author | Takes a multi-day trip with friends and already captures media. | A complete story without assembling a separate blog and map. | Primary |
| Companion and contributor | Has photographs or observations that the organiser does not have. | Contribute selected material without giving away control of the entire gallery. | Primary |
| Coauthor and personal sharer | Wants to edit the shared account and highlight their own contribution. | Collaborate on one journey and share approved personal highlights without duplicating the event. | Primary |
| Friend, family member, or follower | Opens a shared link, usually on a phone. | Understand and experience the trip without installing an app. | Primary |
| Prospective traveller | Searches for a route or destination and considers a similar trip. | Discover a public journey, save it as a reference, and ask source-grounded questions. | Primary |
| Repeat club organiser | Reuses knowledge from previous trips. | Reduce repeated questions and lost community knowledge. | Early learning research |
| Professional creator or operator | Publishes regularly or on behalf of clients. | Branded outputs, repeat workflows, or private archives. | Later commercial research |

Initial recruitment focuses on people with a recently completed or upcoming multi-day trip, existing photographs, and a reason to share or learn. Strava or watch use is common in the intended community, but a GPS file is not required to create a story.

The audience size, repeat-trip frequency, available founder time, and operating budget still require confirmation. Record these for launch and operating capacity. No market-size estimate is assumed.

## 4. Positioning and comparisons

### 4.1 Positioning

For people taking multi-day trips with friends, the product turns captured moments and optional recordings into one collaboratively edited account of the whole journey. Members retain attribution and personal sharing choices. Visitors discover public journeys, experience the story, and inspect the practical knowledge behind it.

### 4.2 Intended differentiation

| Intended advantage | Product behaviour | Evidence needed |
|---|---|---|
| A complete departure-to-return account | Travel legs and rest days sit alongside recorded activity sections. | Viewers can reconstruct the full sequence without asking the author. |
| Capture with little interruption | In-app capture and later import feed an automatically organised draft. | Authors spend less preparation and editing time than with their current workflow. |
| Honest reconstruction | Captured stops, recorded routes, confirmed travel, and estimates have distinct meanings. | Authors correct suggestions easily and viewers distinguish evidence from inference. |
| One journey with personal sharing | Coauthors edit one account and share their own approved highlights. | Five members can share without creating five journey results or conflicting factual versions. |
| Learning grounded in the story | Practical cards and answers link back to approved moments and transcripts. | Prospective travellers resolve concrete questions and can inspect the supporting material. |
| Community knowledge that can be reused | Returning groups preserve dated arrangements and lessons. | Another group voluntarily uses the material and contributes corrections after its own trip. |
| Discoverable experience with private history | Account history references shared journeys while public discovery includes only opted-in publications. | People find relevant journeys without exposing private account history or producing duplicate results. |

These are intended advantages, not claims of unique features or demonstrated superiority.

### 4.3 Competitive reality

| Alternative | Existing capability to respect | Required comparison |
|---|---|---|
| [Render My Trip](https://rendermytrip.com/) | Advertises GPX tracks, photo placement, statistics, playback, and sharing. | Compare whole-trip creation effort, day structure, practical detail retrieval, and ownership. |
| [RouteTale](https://routetale.app/docs/) | Documents route imports, interactive publishing, moments, and exports. | Compare a real multi-day authoring task and the resulting viewer experience. |
| [Polarsteps Travel Together](https://support.polarsteps.com/hc/en-us/articles/24266906223506-How-to-add-photos-and-videos-with-Travel-Together) | Supports shared trip media and collaborative editing. | Compare common-record editing, conflict recovery, source control, and personal sharing. |
| [FindPenguins shared trips](https://support.findpenguins.com/hc/en-us/articles/360015640874-How-do-I-add-a-fellow-traveler) and [GPX imports](https://support.findpenguins.com/hc/en-us/articles/360018036854-Can-I-import-a-GPX-or-other-location-file-into-FindPenguins) | Supports fellow travellers, trip-route imports with documented restrictions, and detailed GPX attachments. | Compare canonical collaboration, missing timestamps, route gaps, and adding recordings to an existing journey. |
| [TravelMap GPS imports](https://travelmap.net/support/maps/import-gps-files) and [paid-account expiry](https://travelmap.net/support/payments/paid-account-expiration) | Documents GPX and KML imports and continued access to existing content after paid access expires. | Assess file handling and hosting expectations. Define our retention and export terms explicitly. |
| [AllTrails reviews](https://support.alltrails.com/hc/en-us/articles/360018930652-How-to-write-a-review-for-a-trail) | Include practical information such as conditions, fees, permits, and parking. | Compare whether a source-linked account answers a group's actual planning questions better. |
| [BrightBlaze](https://brightblaze.app/) and [Packalong](https://packalong.app/) | Advertise group preparation, assigned equipment, and shared trip information. | Keep generic preparation outside the initial scope. |
| Google Photos, shared documents, group chat, blogs, and video | Familiar ways to preserve, explain, and discuss a trip. | Demonstrate enough improvement to justify another workflow. |

Published capabilities establish overlap. They do not establish adoption, reliability, revenue, or dissatisfaction in the intended community. The competitor benchmark uses the same trip material and independent viewers.

### 4.4 Research behind the collaboration model

One shared trip is an existing product pattern. Polarsteps documents common editing but also warns that near-simultaneous text saves can overwrite previous work. Its owner-account deletion removes the trip for the group. FindPenguins documents leaving a trip while the other travellers retain it. These are reasons to define conflict recovery and transferable administration explicitly, not evidence that collaboration is unique. [Polarsteps shared editing](https://support.polarsteps.com/hc/en-us/articles/24266763379218-How-to-edit-text-with-Travel-Together), [Polarsteps account deletion](https://support.polarsteps.com/hc/en-us/articles/24266807023634-I-want-to-delete-my-account-What-happens-to-my-Travel-Together-trips), [FindPenguins trip departure](https://support.findpenguins.com/hc/en-us/articles/31194398246812-How-do-I-leave-a-trip).

Google Photos distinguishes shared-album access from saving independent media copies. This product deliberately uses journey references for account history and share selections for personal presentation. It does not infer another product's backend identity model from its interface. [Google Photos sharing](https://support.google.com/photos/answer/6131416?co=GENIE.Platform%3DDesktop&hl=en).

## 5. Product principles and boundaries

### 5.1 Product principles

- Capture first, organise automatically, and ask for correction only when it matters.
- Preserve an original observation separately from a suggestion or editorial description.
- Let an author finish a useful story with photographs and notes alone.
- Use recorded geometry when available and preserve uncertainty elsewhere.
- Keep personal ownership clear within collaborative trips.
- Maintain one canonical event record. A profile placement, contributor filter, or social share never creates a second journey.
- Separate local selection, private synchronisation, group contribution, and publication.
- Present historical experience with its date and context.
- Make mobile reading usable before loading a full map or large media.
- Keep source citations useful and viewer permissions consistent across all views.
- Prefer a small number of strong defaults over extensive formatting controls.

### 5.2 Excluded from the initial product

- Continuous location recording, live location following, navigation, SOS, rescue coordination, and offline messaging.
- A booking marketplace, permit reseller, guide marketplace, or travel-payment service.
- A social feed, follower network, comments, likes, streaks, or engagement gamification.
- Automatic publication of a person's gallery or location.
- Claims that a historical route is safe, currently accessible, or legally permitted.
- Fabricated experiences, missing GPS points, prices, identities, or transport details.
- Preparation task management, shared packing allocation, identity-document collection, and group expense settlement.
- General travel advice presented as if it came from this journey.

Recording what the group carried, rented, paid, or arranged is included. Planning what a future group must carry or book is a later workflow.

## 6. End-to-end product experience

The product connects the creator's trip record to the experience of companions, viewers, and a later group. These are the intended outcomes at each stage. The [requirements document](product_requirements.md#1-purpose-scope-and-journey-order) defines the complete behaviour and build sequence.

| Stage | Person and intended outcome |
|---|---|
| Set up and create or join | An organiser starts one journey. Companions join it and find it in their private histories. |
| Capture during the trip | Each person preserves moments and observations with little interruption, including when offline. |
| Import after the trip | People select existing media and optional watch recordings, keeping unrelated and private material under their control. |
| Contribute and coauthor | The group combines permitted sources, organises the whole journey, and resolves shared edits without losing work. |
| Preserve practical knowledge | The group records what it actually arranged, paid, carried, rented, and learned, with dates and sources. |
| Review and publish | A designated publisher approves the shared account after checking rights, sensitive information, and uncertain reconstruction. |
| Experience and share | Friends open the story on the web. Members share approved personal highlights that refer to the same journey. |
| Discover and learn | A prospective traveller finds a public journey, checks its dates and evidence, saves it as a reference, and asks grounded questions. |
| Correct and retain control | Contributors can withdraw sources. Members can transfer responsibility, leave, export, or remove content with a clear impact on the group. |

The learning loop ends with another group recording its own trip. Reusing knowledge does not mean claiming the earlier group's media or observations as a new personal experience.

Creators normally progress from account setup to capture or import, contribution, composition, publication, and sharing. Visitors normally enter through Discover or a direct link, read and search without an account, then sign in to save research or ask questions. Withdrawal, access checks, export, and other lifecycle controls apply throughout both paths. The [requirements journey sequence](product_requirements.md#13-user-journey-sequence) groups these paths separately.

## 7. Product direction and release boundaries

### 7.1 First complete product

The first complete release, R1, supports Android capture and responsive web authoring, viewing, and discovery. It combines a shared departure-to-return story, private account history, coauthoring, personal highlight sharing, editable route reconstruction, practical knowledge, and questions grounded in approved sources.

The creator can finish a useful journey with photographs and notes alone. GPS is optional. The viewer experiences Story, Explore, and Learn as three views of the same approved record. Public reading and discovery are account-free, while personal features and question sessions require sign-in.

The initial market is reachable Indian outdoor and travel communities. The model supports other regions and several trip categories without requiring a single sport.

### 7.2 Delivery commitment

The agreed direction is direct implementation of the complete production product. Technical work follows dependencies within that build. Community interviews, paid commitments, adoption targets, and competitor comparisons inform the product but do not gate the authorised implementation.

R1 is the complete agreed scope. Conditional capabilities retain working baseline fallbacks. The [requirements baseline](product_requirements.md#1-purpose-scope-and-journey-order) owns detailed scope labels, platform support, and functional obligations. Release readiness depends on that document's acceptance evidence.

The complete release candidate undergoes internal verification and representative community acceptance testing before release. Post-release community evaluation measures usefulness and adoption. Neither activity introduces a reduced product or a preliminary approval gate for the authorised build.

### 7.3 Future direction

Later capabilities remain future product decisions. Candidates include iOS capture, cinematic exports, richer playback, visual media search, additional formats, external search-engine indexing, creator collections, preparation checklists, document workflows, equipment allocation, club archives, operator tools, and paid plans.

The agreed complete build remains the R1 scope. Live tracking, navigation, rescue, a marketplace, and a social network require a separate product decision.

The product does not promise a launch date, permanent unlimited hosting, or a subscription price. The backend, Mapbox integration, AI SDK/Gateway, storage, and email technologies are selected in the [canonical stack register](architecture.md#14-canonical-stack-and-dependency-register). Account access, integration qualification, numerical limits, retention, and other operating evidence remain in the [release decision register](product_requirements.md#19-decisions-required-before-release).

## 8. Success measures and community evaluation

### 8.1 Primary product outcomes

Measure completed, intentionally shared canonical journeys that receive a meaningful external view, together with evidence that viewers understand or learn from them. Count each journey once regardless of members, profile appearances, bookmarks, or personal shares. Track private keepsakes separately so private use is not misclassified as failure.

### 8.2 Funnel and metric definitions

| Metric | Definition |
|---|---|
| Qualified creator | A person with a suitable real trip and a reason to preserve or share it. |
| Source acquisition success | The person can obtain their intended photographs, notes, and optional recordings without rescue. |
| Capture reliability | Completed captures remain available after offline use and tested interruptions. |
| First meaningful draft | A coherent chronology and chapters are visible from the available material. |
| Authoring completion | The person reaches an intentionally approved share-ready story. |
| Preparation time | Time spent finding and selecting source material before organisation. |
| Processing time | Time waiting for accepted imports and derivatives. |
| Review time | Active correction and publication effort after the draft is ready. |
| Contribution usefulness | Another member's permitted material is intentionally used in a story. |
| Collaborative completion | A group reaches one approved journey with understandable roles and no unresolved lost edits. |
| Personal sharing usefulness | A member creates an intentional selection with their own eligible material or knowingly chooses permitted group content. |
| Discovery success | A prospective traveller finds a relevant public journey and understands its visit dates and evidence limits. |
| Saved research | A viewer saves a reference or note without it appearing as a trip they completed. |
| Meaningful external view | A non-member viewer reads beyond the opening or inspects a relevant moment. Exclude preview bots and member previews where identifiable without fingerprinting. |
| Learning success | A prospective traveller resolves a concrete question and can inspect its source. |
| Answer grounding | Factual answer claims have accessible supporting evidence, with abstention when absent. |
| Return or referral | A creator returns after another suitable trip or brings another qualified creator. |
| Operating effort | Provider cost and support or curation minutes per canonical journey, personal share, listing review, and question session. |

Report failures and abandonments alongside timing percentiles. Do not calculate time-to-value only among successful users and imply that all users succeed. Trip frequency makes daily retention a poor default metric.

### 8.3 Community evaluation of the complete product

Before release, invite representative authors, contributors, coauthors, viewers, and learners to acceptance testing of the complete release candidate. Internal security and privacy checks pass before using their consented data. Observe the required tasks, record failures, and resolve release-blocking issues under [requirements section 20](product_requirements.md#20-acceptance-scenarios-and-definition-of-done).

After readiness approval, launch the complete product and evaluate adoption and usefulness with a broader community cohort. A useful starting cohort is two self-organised groups plus prospective viewers or upcoming organisers, with 10–20 distinct people where recruitment permits. That is a recruitment suggestion for post-release evaluation, not a minimum acceptance-test sample or an adoption gate. The founder's actual reachable community size remains unconfirmed.

Observe real participants using their own sources and independent viewers learning from approved journeys. If comparing with another product, use equivalent source material, include file-acquisition effort, and vary task order to reduce learning effects. These comparisons inform improvements to the completed product.

Measure whether:

- Groups reach a coherent approved journey without repeated support. Count group outcomes separately from individual member tasks.
- Members join, contribute permitted material, find the same journey, and understand publication authority.
- Different personal shares preserve one event record, discovery listing, and answer index.
- Prospective travellers resolve concrete questions and can inspect the sources.
- Public journeys are findable while private history and unlisted journeys remain excluded.
- Costs and support effort stay within the launch operating budget.

Record unsuccessful attempts, unsupported inputs, assistance, and the size of the sample. Post-release usage does not establish market-wide conversion or willingness to pay by itself. It guides usability fixes, operational improvements, and later revenue experiments.

## 9. Community launch and commercial direction

### 9.1 First community launch

1. Complete release-candidate verification and representative community acceptance tasks, then launch to self-organised groups with completed or upcoming multi-day trips.
2. Obtain permission to observe their use of source selection, capture, publication, and viewer questions in that product.
3. Publish consented examples created in the complete application, showing the whole journey and practical details.
4. Invite a second group to use those examples for concrete questions.
5. Improve the workflow that causes abandonment or repeated support requests.
6. Expand through referrals and consented case studies once usage is demonstrated.

The product does not require friends or followers to install the app to view a story. Contributors can add material later through supported web import even when they did not use Android capture during the trip.

### 9.2 First-year commercial stance

Community usefulness is the first goal. Establish a bounded free community offer with clear limits and hosting terms. Do not promise free unlimited storage forever.

Later offers can test a specific outcome, such as a premium export, a private club archive, reusable departure briefs, creator publishing, or managed knowledge upkeep. A subscription requires evidence of repeat use.

### 9.3 Economic reporting

The cost model includes all private and published storage, derivatives, media processing, transcription, questions, map delivery, hosting, support, acquisition effort, and future hosting obligations. Add payment fees, taxes, refunds, and entitlements when charging begins.

Launch planning uses the founder's ceiling of 10,000 people, not a validated adoption forecast. The existing VPS removes the need for an initial hosting-budget estimate. Measure usage and set operating limits before release. Mapbox costs depend on web map loads and native map users, including public viewers; [the map cost model](map_cost_comparison.md) records the assumptions. Reading a Story without initializing a map does not consume a web map load.

No price, revenue forecast, or market-size claim is approved. Monetisation must not restrict access to one's own data or let sponsorship silently change factual travel information.

## 10. Product risks and responses

| Risk | Signal | Response |
|---|---|---|
| Existing products are sufficient. | Users prefer familiar albums, maps, or shared documents after comparison. | Use post-release evidence to improve capture effort, shared authoring, and learning before adding future scope. |
| Reconstruction overstates what is known. | Wrong travel modes, places, or paths appear as fact. | Preserve evidence categories, author corrections, and unknown gaps. |
| Broad gallery access is unavailable. | Permission denial or distribution-policy rejection. | Keep the picker and explicit import as the complete baseline. |
| Media lacks useful metadata. | Many imported items have no location or reliable time. | Use manual stage placement and supported contextual suggestions. |
| Capture drains battery or loses files. | Device tests show unacceptable overhead or missing acknowledged saves. | Bound location use, delay heavy processing, and fix durability before expansion. |
| Shared-trip ownership is confusing. | Contributors expect private material to remain private or dispute reuse. | Explicit scopes, clear destinations, attribution, withdrawal, and named publishers. |
| A person's route absorbs other members' travel. | Split-departure tests imply everyone travelled every segment. | Keep attributed travel branches inside the shared journey and never sum overlapping tracks as group distance. |
| Personal sharing recreates duplicate events. | Shares add journey rows, activity counts, or AI indexes. | Reference one canonical journey and one approved source set from every presentation. |
| Coauthor edits are lost or administration disappears. | Stale saves overwrite work or creator departure disables group access. | Conflict detection, basic history and restore, accepted transfer, and a disclosed recovery policy. |
| Discovery exposes private history or unsuitable content. | Search, profiles, or share previews include ineligible records. | Explicit publication, approved-metadata indexing, listing review, reporting, and takedown controls. |
| Private material leaks through derivatives or AI. | Hidden data appears in previews, payloads, citations, or answers. | One access policy, source-filtered publication, and invalidation across all derivatives. |
| Knowledge becomes stale. | Old prices or arrangements appear current. | Observation dates, correction history, and explicit report context. |
| Contribution requires constant chasing. | Only the founder or organiser supplies useful information. | Reduce contributor effort and improve the product's capture and contribution workflow using post-release observations. |
| Usage is too infrequent for the business model. | People publish one occasional trip and do not buy repeat access. | Keep costs bounded and test outcome-based purchases later. |
| Heavy media or questions create excessive cost. | Storage, processing, maps, or answer usage grows faster than useful adoption. | Visible quotas, budgets, caching, progressive delivery, and measured limits. |
| Scope exceeds founder capacity. | Later visuals or preparation work delay the core loop. | Enforce R1 baseline and defer independent extensions. |
| Viewers mistake historical experience for current authority. | Questions seek guaranteed access, safety, or future availability. | Attribute experience, retain dates, and avoid unsupported assurances. |

## 11. Open product and operating decisions

| Decision | Current position |
|---|---|
| Brand and distribution identity | The title describes the product. A name, app identity, domain, and applicable rights checks remain open. |
| Reachable audience and recruitment | Plan for at most 10,000 launch people. Community size, repeat-trip frequency, recruitment reach, and actual map use remain unconfirmed. No market-size estimate is approved. |
| Founder and operating capacity | The VPS already exists, and hosting-budget estimation does not block architecture. Record founder time, support capacity, usage limits, and backup resources before release. |
| Free community offer | Use clear limits and hosting terms. Exact allowances depend on measured operating costs. |
| Revenue experiments | Community usefulness comes first. Prices, paid entitlements, forecasts, and subscription assumptions are undecided. |
| Future product expansion | iOS, richer exports, preparation tools, club and operator workflows, and paid plans require separate scope decisions. |

The [decision baseline](product_requirements.md#212-inherited-decision-baseline) preserves all 25 original decisions and their historical status, with a separate current-application column linked to the governing requirements. The [release decision register](product_requirements.md#19-decisions-required-before-release) records the engineering and operating evidence still needed. Architecture section 18 identifies when technical inputs are needed during implementation.

## 12. Research basis and product evidence

### 12.1 Evidence basis

The original baseline reviewed product, opportunity, source-file, collaboration, sharing, and discovery research. Product and competitive findings stay here. Platform, format, permission, and provider constraints are preserved in the [requirements research appendix](product_requirements.md#22-inherited-research-constraints-and-references).

Product, platform, and workflow sources were reviewed on 31 October 2026. Collaboration, personal sharing, profiles, and discovery sources were reviewed again on 1 November 2026. These are dated documentation findings, not claims that competitor behaviour or terms will remain unchanged. Check relevant platform terms and provider documentation when integrating them.

The founder confirmed multi-day events, self-organised groups of friends, common Strava or GPS-watch use, Android first, no continuous recorder, one canonical group journey, personal sharing, and public learning. Community usefulness comes before revenue experiments. Direct implementation of the complete agreed product is also confirmed.

Official documentation supports specific capabilities and constraints. Public discussions supply examples of problems. Product decisions in this plan are our design choices; another product's interface does not establish its internal data model. No accounts, purchases, competitor editing sessions, device imports, or interviews were tested as part of the documentation research. No market-size, conversion, adoption, or willingness-to-pay estimate is established.

### 12.2 Practical learning and competitive context

Indian discussions show prospective independent travellers asking returnees about transport, camping, food, equipment, rental arrangements, costs, connectivity, and access. The Hampta Pass planning and returning-group discussions in section 2.2 illustrate questions beyond a photo album. A separate itinerary request asks for actual costs, transport, and recent seasonal observations. These are examples of the information-seeking job, not independent confirmation of the advice in replies. [Itinerary request](https://www.reddit.com/r/india_tourism/comments/1n3h2jx/).

Existing services already address parts of this need. AllTrails reviews include practical details and condition tags. FarOut supports categorized comments, filtering, reporting, and offline guides. Indiahikes publishes extensive logistics FAQs and operational news. Historical visitor reports, current official notices, and modeled conditions must remain distinguishable. [AllTrails reviews](https://support.alltrails.com/hc/en-us/articles/360018930652-How-to-write-a-review-for-a-trail), [FarOut help](https://faroutguides.com/help/), [FarOut filtering and reports](https://faroutguides.com/new-in-farout-filter-flag-report-for-a-better-trail/), [Indiahikes FAQs](https://indiahikes.com/faq), [Indiahikes news](https://indiahikes.com/news).

International trail discussions also show uncertainty about the freshness or completeness of water and condition reports. Sparse recent observations can reflect low traffic rather than missing software. Our app cannot create fresh field evidence when nobody contributes it. A visible visit date, update date, and source are essential; none certifies present safety or access. [Example water-information discussion](https://www.reddit.com/r/arizonatrail/comments/1ngy6u5/water_source_questions/).

The product preserves dated, attributed experience and lets readers inspect its sources. The [practical-knowledge requirements](product_requirements.md#10-practical-details-and-lessons) and [question requirements](product_requirements.md#15-search-and-questions-about-the-journey) define the functional scope.

Render My Trip, RouteTale, TravelMap, Polarsteps, FindPenguins, Google Photos, forums, and shared documents provide substantial substitution. Section 4 records the relevant comparisons. RouteTale advertises broad import and interactive sharing; Render My Trip advertises multi-track trips, photo placement, playback, and account-free links. Documentation does not establish inferior usability or missing multi-day support. No historical competitor price or free-tier allowance is adopted as our pricing or cost assumption. [RouteTale imports](https://routetale.app/docs/import-a-route/), [RouteTale sharing](https://routetale.app/docs/share-and-embed/), [Render My Trip](https://rendermytrip.com/).

Official-domain search results for TrekYatra and TrailScout advertised Indian guides and related trip information, but direct fetches were unavailable during research. These are competing propositions to acknowledge, not verified functionality or adoption. Claims about a vacant Indian guide market are unsupported. [TrekYatra](https://www.trekyatra.co.in/), [TrailScout](https://www.trailscout.club/trekking-app).

The product's intended value is the combined capture, canonical group narrative, personal sharing, and source-grounded learning workflow. Evaluate usefulness in the completed product; competitor overlap does not change the approved implementation commitment.

### 12.3 Evidence behind deferred directions

| Direction considered | Relevant finding | Scope consequence |
|---|---|---|
| General group preparation, gear allocation, and readiness tracking | BrightBlaze and Packalong advertise overlapping itineraries, shared equipment, and preparation workflows. Coordination also depends on participants engaging. [BrightBlaze](https://brightblaze.app/), [Packalong](https://packalong.app/). | Preserve what the group actually carried, rented, and arranged inside the journey. Full checklists, allocation, reminders, reservations, and documents remain later. Do not add a separate preparation product to this build. |
| Standalone activity-file diagnosis, conversion, and repair | Garmin publishes repair tooling; GOTOES already offers merging and repair workflows. Recovery cannot create genuine measurements that were never recorded. [Garmin tools](https://github.com/garmin/fit-sdk-tools), [GOTOES](https://gotoes.org/). | Provide reliable supported imports, original preservation, clear errors, and visible gaps. A repair service or general file-conversion suite is outside R1. |
| Live trail intelligence, navigation, and safety assessment | Existing guides and reports already cover parts of this job. Freshness depends on recent observations and source coverage. | Retain historical evidence and uncertainty. Do not claim current route safety, replace navigation, or introduce continuous recording or rescue features. |
| Independent personal stories from one group event | Collaboration and shared-album research show that participation, ownership, saved copies, and sharing can be distinct concepts. | Keep one canonical journey and personal share selections. Separate factual narratives, duplicated listings, and per-member answer indexes are excluded. |

Research dates and source limitations are retained from version 1.2. This document split adds no new market, legal, pricing, or competitor verification.
