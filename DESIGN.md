# Kairn: Open atlas

The complete-redesign brief of 4 November 2026 replaces the P02 photographic-journal direction. See [audit, research, architecture and acceptance](docs/implementation/experience_redesign.md) and the [direction studies](docs/implementation/experience_directions.html).

The [detailed redesign plan](docs/implementation/design_system_redesign_plan.md) governs the remaining component-system work, platform consistency, screen migration and validation.

## Visual identity

Mineral white canvas, white surfaces, slate text and deep blue actions. Shared semantic light/dark theme roles live in `packages/design-tokens/src/index.ts`. Existing color-key names remain compatibility aliases while their values follow the new identity. Do not introduce per-screen hex values. Newsreader is the expressive reading voice; Instrument Sans carries instructions and controls. The chronology is the signature: a visible sequence of days beside a focused story, including pauses and unknown locations.

## Composition

Horizontal navigation replaces the permanent sidebar. Discover has one editorial journey entry per event and useful filters. Your journeys owns create/join/revisit. The reader separates Story, Explore and Learn while preserving chapter selection. Mobile uses a compact chapter grid and one focused content view; desktop places the chapter spine beside the reading surface. Images never carry essential text. No metrics-only hero, autoplay, scroll hijacking, 3D prerequisites or decorative cartography.

## System contracts

Use shared spacing, radius, typography, focus and motion tokens. Feedback is 120ms and optional reveal 220ms; reduced motion removes transitions. Strong focus and pressed/selected text remain visible in both appearances. Web actions are at least 44px, Android 48dp. Unknown geometry stays a gap. Recorded/reported/estimated routes use solid/dashed/dotted patterns plus text. Map initialization requires explicit user action. The current route specimen is a labelled diagram, not a geographical map.

Retain native control semantics and existing account/access contracts. Source ownership, coauthor authority, publication permission and original-file export remain distinct. Sample controls stay reachable but subordinate. Prototype changes are session-only and must never claim durable saving or publication.

## Extending the system

Add a semantic role only when an existing role cannot express the intent. Share plain token values across platforms; keep DOM and Unistyles components separate. Reuse button, field, audience, status, cover, chapter, practical-detail and source patterns. Every future screen needs usable empty/error/loading states and a text-first route through its content. Do not add unused component variants to inflate coverage.
