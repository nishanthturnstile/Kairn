# Kairn ecosystem direction

Date: 4 November 2026. Status: recorded product direction and proposed engineering boundaries, not a claim of implemented packages. The founder requested that this vision be carried into the actual plan. [Requirements](product_requirements.md) continue to own complete R1 scope; [architecture section 14](architecture.md#14-canonical-stack-and-dependency-register) continues to own dependencies.

## 1. Product and toolkit

**Kairn: an open-source geographic storytelling toolkit.**

Kairn's integrated application is the first consumer: a group captures and coauthors one departure-to-return journey, then visitors experience its approved story and practical knowledge. Reusable engines should eventually let other applications tell geographic stories without adopting Kairn's accounts, storage, or entire creator interface.

This direction preserves the first audience: self-organised multi-day trips with friends. Bloggers, race organisers, cyclists, photographers, and family archives are potential later consumers, not five new vertical products to build now. Navigation, live tracking, a social network, bookings, and fitness competition remain outside the agreed product.

The ecosystem names describe responsibilities, not eight services, repositories, navigation destinations, or immediately published npm packages. Use Kairn as the working ecosystem name; domain registration, public package names, licensing and trademark decisions are separate. An open-source ambition is not evidence of a selected license or that third-party maps, fonts, media, codecs and fixtures can be redistributed.

## 2. Fit with the existing plan

| Name | Existing R1 responsibility | Later ecosystem extension |
|---|---|---|
| Studio | Web/native capture, import, coauthoring, chapters, practical details and exact publication preview. CAP, SYN, IMP, COL, STO, LRN. | Reusable authoring integrations after the integrated product proves the workflow. |
| Player | Account-free Story, Explore and Learn views of one approved record, accessible lists and explicit map loading. VWR. | Independently consumable viewer with a documented safe input format. |
| Replay | Basic user-started Explore playback: pause, next, previous and stage selection, with reduced motion. VWR-03 and section 12. | Rich chapter-driven playback engine, timeline scrubbing and optional advanced camera adapters. No automatic promotion of 3D or video export into R1. |
| Embed | Existing hosted publication and personal-share links supply a future delivery source. PUB, SHR. | First a managed iframe; consider a TypeScript/React integration after its external-consumer contract is proven. Embeds remain later scope. |
| GeoKit | Bounded GPX/FIT import, normalized segmented geometry, provenance, honest statistics and preserved gaps. IMP, GEO. | Standalone processing APIs; KML, KMZ, TCX and GeoJSON input support only through later scope decisions. |
| Moments | Selected imports, metadata/time review, suggested chapter/route placement and durable manual corrections. IMP, REC, STO. | Independent photo-to-route matching, including bulk workflows and reusable correction interfaces. |
| Privacy | Source grants, sensitive-location review, redaction, safe derivatives, exact preview, withdrawal and access enforcement. COL, PUB, OWN. | Reusable redaction transforms and preview tools; explicit endpoint trimming can be considered within a later privacy interface. Server authorization remains authoritative. |
| Publisher | Approved snapshots, hosted delivery, simple static share cards and permitted data export. PUB, SHR, OWN. | Self-hostable story bundles, embeddable outputs, designed print/poster formats and eventually video. Data portability is already R1; these new presentation formats are not. |

Atlas (world-map journey collection), Compare (repeated routes or journeys), and Cinematics (camera direction and video production) remain longer-term candidates. Existing private history and public-profile selections do not imply an implemented Atlas. An interactive Player should still work for journeys with photographs and notes but no GPS.

## 3. Recommendation and differentiation

Replay is the strongest candidate for a visible flagship. Its value should be helping a viewer understand a whole journey: travel legs, rest days, chapters, participant branches, moments, and evidence. A continuously moving marker alone does not deliver that outcome.

Engineering order differs from the marketing order. GeoKit and Moments make the reconstruction trustworthy; Privacy and publication make it deliverable; Player and Replay make it understandable. Embed then distributes the same experience. Publisher's additional output formats follow when their rights and delivery contracts are clear.

[TrailReplay's maintainer repository](https://github.com/bresca-ai/TrailReplay), checked 4 November 2026, already advertises multi-track 3D playback, photo placement, annotations, comparisons and video export. This is published capability evidence, not hands-on verification. It weakens any claim that replay alone is novel. Kairn's proposed emphasis is reusable chapter-driven viewing combined with collaborative source ownership, truthful gaps, and approved practical knowledge. That differentiation remains a hypothesis to test, not a claim that competitors lack it.

Build the journey semantics and rights integration that Kairn needs. Evaluate reuse of format parsers or rendering components against the selected stack and actual license before adding them; neither this comparison nor the toolkit ambition selects a new runtime dependency.

## 4. How it works overall

1. Studio captures or imports private originals through the durable source pipeline. GeoKit normalizes permitted recordings without replacing the originals.
2. Moments proposes placements using known coordinates, timestamps, timezone context and route segments. It returns reasons and uncertainty; the author can correct or leave an item unplaced.
3. Studio assembles chapters and practical details from permitted material. Observed, recorded, confirmed and estimated evidence remain distinguishable.
4. The server checks current capabilities and source grants, applies privacy rules, builds safe derivatives and an approved publication projection, and records dependencies. Preview renders that same projection through the Player.
5. Player reads only viewer-safe content. Replay advances selection across its approved stages and moments. Map adapters turn those selections into platform-specific display; readable content does not depend on the map.
6. A later managed Embed resolves the same approved publication through current-access checks. Publisher may later materialize an explicitly permitted portable output, with a manifest describing the approved inputs and output rights.

Draft edits do not silently change an approved publication. Restrictive actions override old snapshots and managed outputs according to the existing publication, gateway and recovery rules. A cached safe projection still needs current access checks when served; a schema alone cannot prove that its contents are authorized.

## 5. Engineering boundaries to preserve now

Start within the current monorepo. Keep platform UI in `apps/web` and `apps/mobile`, wire schemas in `packages/contracts`, pure algorithms in `packages/shared`, and authoritative policy, storage, jobs and domain operations in `packages/backend`. These are proposed ownership boundaries for upcoming slices, not new files or packages created by this document.

- **GeoKit boundary:** normalized segments, coordinates, optional times, units, provenance, validation issues and derived statistics. Keep source samples separate from simplified display and redacted geometry. Do not bridge unknown gaps or silently repair measurements. Untrusted file decoding stays bounded in the processing boundary; do not bundle every decoder into every viewer.
- **Moments boundary:** selected media metadata plus permitted route/time context produce placement candidates and reasons. Original local time, offset/timezone uncertainty and manual overrides remain separate. Rerunning suggestions cannot overwrite a confirmed correction. Missing GPS/time permits abstention.
- **Replay boundary:** an explicit playback clock and approved ordered chapters/moments produce selection events. Actual timestamps and presentation timing are different concepts; a rest day or untimestamped segment must not acquire invented speed. Keep the timeline independent of React, Mapbox, storage and authentication. Implement only the controls selected for each delivery slice.
- **Player boundary:** a versioned viewer-safe document and delivery adapter supply chapters, permitted geometry, media references and accessible text. Renderer failures retain readable content. Web and native share plain contracts and logic, not DOM components or native styling dependencies.
- **Privacy boundary:** pure redaction transforms can be reusable; grants, policy generations, dependency invalidation, journal confirmation and gateway authorization remain server responsibilities. A browser toggle is never access enforcement. Examine coordinates in bounds, thumbnails, metadata, captions and statistics as well as visible map geometry.
- **Publisher boundary:** approved input revision plus current rights plus output kind produce a bounded job and artifact manifest. Rendering cannot reuse private originals merely because they exist in storage. Check authority at generation and managed delivery, and reject stale jobs after rights changes.

The future viewer document should identify its schema/publication version, ordered stages, evidence semantics, redacted geometry and permitted media references. Exact fields belong to the implementation contract review. It must exclude private source identifiers that reveal hidden content, raw EXIF, private transcripts and direct bucket URLs. Public APIs use the established versioned wire contracts, not database rows.

Extract a public package when its production boundary and external consumption path are demonstrated. Require an explicit export surface, compiled artifacts, compatible versioning, a small independent consumer example, meaningful failure fixtures, dependency/license review and maintenance ownership. Do not create empty package scaffolds or a plugin system just to reserve the eight names.

## 6. Hosting, privacy and portable outputs

A managed iframe is the recommended first Embed because the existing hosted Player and revocation path can own delivery. Its later acceptance must cover embedding policy, isolation, validated cross-origin messages, accessibility, responsive sizing, map usage and generic unavailable states. Do not transmit account credentials to a host page. Private/reviewer embedding needs a separate supported access contract; do not assume third-party cookies will make it work.

A portable story bundle is an independent copy. Kairn cannot recall it, an externally posted card, a printed poster, or an exported video. Show that consequence before export and include only material the exporter may retain in that form. Raw-original grants remain distinct from publication reuse. A self-hosted bundle cannot promise permanent offline basemaps or redistribute provider tiles by default; any bundled map/media/font assets need a permitted delivery approach. Preserve attribution and useful reading when external maps are unavailable.

Open source therefore describes the intended software distribution, not free unlimited map usage, storage, hosted AI, or unrestricted redistribution of contributors' work. Managed hosting/support and later publishing services are possible business directions; they do not put existing own-data export behind payment.

## 7. Delivery and parallel engineering

Keep the [complete R1 sequence](product_requirements.md#182-dependency-aware-implementation-sequence). The ecosystem does not replace accounts, capture durability, collaboration, discovery, grounded questions or lifecycle acceptance with a replay-only release.

The current [setup checkpoint](../implementation/repository_setup_progress.md) records accepted foundation work. [Accounts/journeys progress](../implementation/accounts_journeys_access_progress.md) records incomplete product work. Sample experience screens are not proof of source capture, publication safety or replay implementation.

Recommended future work packets:

| Packet | Can proceed alongside | Dependency and reviewable result |
|---|---|---|
| E0: contracts and fixture agreement | Current account/access delivery; no runtime activation | Define normalized route, placement proposal, playback event and safe-viewer seams. Map each field to ownership and existing requirements; include no-GPS, timezone ambiguity, gap, withdrawal and rest-day fixtures. |
| E1: geography and matching | E2 after E0 agreement | Implement the R1 route normalization and matching rules as pure logic with bounded processing adapters. Integrate into real imports after source/capture contracts are ready. |
| E2: Player and basic Replay | E1 and E3 after E0 agreement | Implement readable stages and R1 playback using explicit safe fixtures, then replace fixture delivery with the real approved projection. Synthetic inputs prove interaction only. |
| E3: privacy and publication | E1/E2 contract work; production integration follows account/source grants | Implement authorized projection, identical preview/delivery, safe derivatives and current-policy denial. Use the existing restriction/recovery boundary. |
| E4: integrated R1 journey | Follows E1/E2/E3 and their product dependencies | Capture/import through correction, approval, playback and withdrawal using real boundaries. Complete the remaining R1 workstreams and release gates as planned. |
| E5: external distribution | Later scope decision after viewer boundary is proven | Managed Embed first; independent Player/Replay consumption and portable Publisher formats in separately scoped slices. |

E0 is the recommended next ecosystem engineering packet. This is production-oriented contract work, not a separate trial service or an adoption gate. It can be scheduled alongside existing milestones without interrupting their acceptance. Implemented E1/E2 logic may be developed in parallel, but their product slices cannot be marked complete before the underlying import and publication paths work.

Agree shared contracts before parallel edits. Give each packet clear file ownership and integrate contract changes first to avoid divergent schemas. Follow [checkout workflow](../implementation/checkout_workflow.md): short-lived `feat/*` or `chore/*` branches from current `development`, PRs into `development`, and reviewed promotions to `main`. Avoid a permanent competing ecosystem branch. Backend/web authoring uses WSL; immediate Android work uses Windows; iOS-native work uses Mac. Each task has one authoring checkout; other hosts consume exact committed checkpoints. This plan does not start concurrent agents, builds or host handoffs.

## 8. Acceptance and decisions

Keep coverage small and tied to real failures: route segments/gaps and limits; ambiguous time and preserved manual corrections; playback without GPS and with reduced motion; hidden coordinates absent from actual payloads and derivatives; withdrawal during publication/delivery; export content obeying grants. Existing equivalent gates should be reused, not duplicated for every ecosystem name. Record actual input commits and results in the implementing workstream's progress document.

Decisions still required before public toolkit distribution: license and contribution policy, public package ownership, supported external runtimes and compatibility window, maintenance responsibility, portable artifact format/rights, and provider-specific map delivery. These do not block authorized R1 development. Numerical performance and size budgets must come from representative devices and files, not invented promises in this vision.

Success means Kairn itself uses these boundaries successfully, another developer can consume a supported engine without the full platform, and ordinary viewers can understand a multi-day story with or without GPS. Keep ecosystem integration evidence separate from community adoption measures and complete-product release evidence.
