# Architecture research plan

Research date: 1 November 2026.

Question: Which self-hosted architecture and current, compatible libraries support the complete R1 journey product in the three existing product documents?

Confirmed during research: the user has an existing VPS, permits external AI/transcription/maps APIs, and does not need budget estimation now. The primary architecture self-hosts application and stored data; local map/inference services remain alternatives.

## Research assignments

1. Competitor evidence. Review every named competitor and substitute. Separate directly documented technology from inferred architectural requirements and unknown internals. Use primary product, engineering, repository, and careers sources.
2. Client architecture. Assess Vite, React, shadcn/ui, the TanStack catalog, Expo, React Native, offline capture, media import, and native module requirements. Verify stable versions and compatibility from official documentation and package metadata.
3. Self-hosted services. Assess backend, PostgreSQL, object storage, job processing, maps, media, transcription, and grounded answers. Explain operational and licensing constraints and distinguish required services from optional ones.
4. Product synthesis. Trace all functional requirement IDs and cross-cutting privacy, offline, collaboration, publication, and lifecycle obligations to proposed components. Compare whole-system alternatives before choosing.

## Evidence and synthesis

Use short, focused search rounds and open primary sources. Save findings in this directory. Version observations are dated registry or release evidence, not guarantees about future releases. Prefer the latest stable compatible combination and explain SDK-constrained dependencies.

The architecture document will contain the recommendation, full diagrams, component ownership, data and permission models, critical flows, stack and library decisions, self-hosting topology, release gates, requirement coverage, and unresolved operating decisions. Research findings remain supporting material.

## Revision requested on 1 November 2026

Confirmed changes: use Vite+ with React and TanStack, Mailpit in development, and Resend in production. Keep application/data on the existing VPS, with external AI/maps permitted.

Research topics for this revision:

1. Vite+ compatibility, bundled tooling, and the smallest frontend/test toolchain; Vercel AI SDK versus TanStack AI, and SDK versus an actual LLM gateway; email transports.
2. Esri ArcGIS services with MapLibre on web/native versus MapTiler, including outdoor story experience, coverage, attribution, authentication, image exports, and data hosting.
3. Convex Cloud and self-hosted Convex versus the selected PostgreSQL approach, with reactive data, transactions, offline capture, authorization, publication revocation, storage, jobs, and operational fit.
4. Challenge the whole design, make background job ownership explicit, remove speculative installed dependencies, and make architecture section 14 the sole current stack/dependency register.

Save revision findings separately from the previous dated research. Distinguish research alternatives from selected dependencies. Verify current primary sources and stable versions, then recheck requirement coverage and diagrams after editing.

Historical revision synthesis: retained PostgreSQL and pg-boss direct Drizzle transactional enqueue; adopted Vite+, Mailpit/Resend SMTP, Vercel AI SDK and hosted AI Gateway. The filesystem-only and MapLibre/MapTiler recommendations were superseded by the follow-ups below. Architecture section 14 is the only current dependency register.

## Storage portability and map pricing follow-up

The user explicitly retains SeaweedFS and S3-compatible storage to simplify a future R2/AWS S3 migration. This supersedes the prior filesystem-only recommendation. Preserve current publication/source authorization at the media gateway while changing the storage backend.

Research current Mapbox and MapTiler pricing and feature gates from the supplied official pages. Split the investigation into Mapbox SDK/API billing and compatibility, MapTiler Free/Flex billing and eligibility, and synthesis against actual R1 features. Calculate clearly labelled traffic scenarios rather than assuming a viewer equals a tile request or an active mobile user. Keep map costs separate from media storage/AI/VPS costs, and preserve one canonical selected stack register.

Follow-up synthesis: user confirmed at most 10,000 launch people. SeaweedFS/S3 is restored explicitly for migration portability, superseding the filesystem-only recommendation. Compare Mapbox SDK pricing, Mapbox direct tiles, MapTiler direct requests, and a MapTiler web-SDK/native-MapLibre mix. The cost report owns modeled usage assumptions; architecture section 14 still owns selected dependencies.

## Final plan reconciliation

Select Mapbox web/native SDKs for basemaps and satellite imagery. Remove MapLibre, MapTiler, Esri integrations, and extra map wrappers from active dependencies. Keep the prior comparisons as historical evidence. Reconcile product, requirements, design, architecture, cost assumptions, and open decisions without reducing the complete R1 scope. Retain SeaweedFS/S3, PostgreSQL/pg-boss, AI SDK/Gateway, and Mailpit/Resend. Recheck package metadata, requirement identities, local links, Mermaid diagrams, and cost calculations.
