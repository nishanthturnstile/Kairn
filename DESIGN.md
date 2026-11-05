# Kairn design and workflow hub

Status: **fresh design planning — no visual direction selected**. Reset requested by the user on 5 November 2026. Start every new design or prototype task here.

The previous visual identity, design constraints, component styling, page layouts and prototype delivery plans are withdrawn. Colors, typography, spacing, icons, logo, imagery, motion, navigation composition and every page will be explored again, one decision at a time. Existing screens and source tokens are implementation history, not defaults or inspiration for this work unless the user explicitly chooses to revisit them.

## 1. Product and workflow context

Kairn records one shared journey that happened: people capture selected moments, contribute under explicit permissions, compose an account, approve publication, and let others experience and learn from dated evidence. The visual reset keeps that functional purpose and its privacy/durability obligations. Kairn remains the working product name; logo and identity treatment are undecided.

| Read for | Active document |
| --- | --- |
| Product purpose and audience | [Product context](PRODUCT.md), [product plan](docs/core/product_plan.md) |
| Functional scope and acceptance | [Product requirements](docs/core/product_requirements.md) |
| Whole journey, cross-surface handoffs and lifecycle | [Shared workflow specification](docs/implementation/lifecycle_workflow_spec.md) |
| Complete mockup screen map, platform equivalents, states and open interaction choices | [Mockup screen map](docs/implementation/mockup_screen_map.md) |
| Native journey history, create/join, capture, moments/sync, import, focused editing, highlights and account | [Mobile workflows](docs/implementation/mobile_workflow_specification.md) |
| Creator overview, story, route, practical details, sources, people, conflicts and publishing | [Creator-web workflows](docs/implementation/creator_web_workflow_spec.md) |
| Discovery, approved reader, sources, highlights, profiles, research and questions | [Public-web workflows](docs/implementation/public_web_workflow.md) |
| Sign-in, verification, recovery and account/journey access | [Account workflow handoff](docs/implementation/accounts_journeys_access_design.md) |
| Canonical screen IDs and functional handoff summary | [Application experience requirements](docs/core/application_design.md) |
| Authority, limits, freshness and lifecycle policy | [Selected domain decisions](docs/implementation/accounts_journeys_access_decisions.md) |
| Implementation boundaries and installed dependencies | [Architecture](docs/core/architecture.md) |

The workflow specifications supply tasks, information, incoming/outgoing paths, actions, permissions and failure states. Their existing groupings, labels, example containers and route shapes are proposals to revisit during fresh planning. They do not prescribe the new appearance or page composition. Preserve screen IDs for traceability; a screen may become a page, section or overlay after its interaction is designed. Record any deliberate change to the connectivity instead of losing a path accidentally.

## 2. Decisions to make from scratch

| Area | What we will decide | Current status |
| --- | --- | --- |
| Brand direction | Desired character, audience impression, reference criteria and writing voice | Undecided |
| Logo and identity | Wordmark/symbol, variants, app icon and small-size use | Undecided |
| Color | Palette, semantic roles, contrast and appearance variants | Undecided |
| Typography | Families, licenses, fallbacks, weights, sizes, line heights and reading behavior | Undecided |
| Spacing and layout foundations | Scale, density, widths, grid, breakpoints, safe areas and text growth | Undecided |
| Icons and imagery | Icon family/style, illustrations, photography treatment and fallbacks | Undecided |
| Shape, depth and motion | Borders, corners, elevation, focus/feedback and reduced-motion behavior | Undecided |
| Components | Anatomy, variants, interaction and all relevant states | Undecided |
| Navigation and pages | Destination grouping, page hierarchy, composition and cross-surface continuity | Undecided |
| Connected prototype | New scenarios, implementation slices and evaluation sequence | Not planned yet |

No palette, font, logo, icon package, radius, spacing value, layout template or old milestone is implicitly approved. Installed packages are a compatibility fact, not a design preference. Dependency changes are assessed only when a new decision requires them.

## 3. Work one decision at a time

1. Choose the next area with the user and write its purpose and evaluation criteria.
2. Explore a small set of distinct options using realistic product content, including long text, empty content and failure states where relevant. Do not seed every option from the superseded design.
3. Record the user's choice, its rationale, affected surfaces and remaining questions. A recommendation is still a proposal until selected.
4. Apply selected choices to the relevant components/screens and check usability, accessibility and platform behavior.
5. Connect those screens using the workflow contracts. Evaluate one complete journey plus its meaningful failures before calling that portion complete.

This is an incremental design process, not a mandate to pick everything now. Future design notes and artifacts get linked here when created; do not create a parallel authority or a collection of empty plans. No new subscription is required by this process.

### Decision record

| ID | Decision | Status | Consequence |
| --- | --- | --- | --- |
| RESET-01 | Start visual identity, components and page design afresh | User requested, 5 November 2026 | Prior visual decisions and design milestones have no authority over new work. |
| RESET-02 | Keep functional workflow research and domain rules as planning input | Reset scope | Screen connectivity, ownership, privacy and durability remain available without inheriting their former presentation. |
| MAP-01 | Complete screen mapping before mockup production | User requested, 5 November 2026 | The [screen map](docs/implementation/mockup_screen_map.md) reconciles current responsibilities and handoffs; visual choices and mockup composition remain open. |

For each future choice record: area, options considered, selection/date, rationale, affected screen/component IDs, artifact link and verification still needed. This file tracks the current choice; rejected alternatives do not become active rules.

## 4. Requirements that still apply

Privacy, authorization, honest source/evidence labels, explicit publication, accessible interaction, input preservation and truthful offline/sync feedback remain product requirements. They constrain behavior, not a particular aesthetic. Essential information must remain usable without color alone, fine gestures, a map, motion or unavailable media. New choices need actual contrast, text growth, keyboard and screen-reader checks; old screenshots do not qualify the new design.

The existing web/native architecture remains in place. Rebuilding the design does not require replacing authentication, durable storage, API contracts, the toolchain or the selected rendering/styling frameworks. Shared design values can be implemented in the existing token boundary once chosen; present values are not retained by default.

## 5. Prototype boundary

The old prototype is a superseded implementation reference, not the next design milestone. This cleanup does not delete working application code, account behavior, tests or dependencies. Do not resume old prototype/redesign batches or copy their fixture-driven compositions as the new baseline.

Plan the new connected prototype after its relevant design decisions are made. Use clearly labelled fictional data and simulated actions until real adapters are deliberately integrated. Simulation must not claim durable saving, live sync, publication, account deletion or recovery confirmation. Keep production artifact exclusion and actual product acceptance separate from design review. Later replacement/removal of old prototype routes and assets belongs to an explicit application change with affected checks.

## 6. Pen.dev tooling proposal

The user plans to use Pen.dev for design-system exploration and screen mockups. The [Pen.dev setup plan](docs/implementation/pen_dev_setup_plan.md) records documentation findings, the installed extension, the T3/Codex MCP configuration gap, account limits, proposed design files and the screen-by-screen process. Live MCP canvas read/edit/render/save/reopen checks passed for Nishanth, Kartik and Deva profiles; existing T3 sessions need a provider/session reload to refresh their tools. Pen's free agent-day allowance must be considered before relying on daily AI design. This tooling proposal selects no visual choices and does not restore the superseded prototype plan.

## 7. Context hygiene and records

This hub is the only active design entry point. The documentation map and agent instructions point here. Do not load historical design plans, screenshots, old token values or archived progress as fresh-design requirements. Mixed historical verification records are isolated under `docs/archive/design-before-2026-11-05/` for explicit implementation audits only; their visual prescriptions are withdrawn. Obsolete visual plans, direction studies and the stale planning HTML have been removed.

[Workflow review and reset verification](docs/implementation/workflow_review.md) records the retained functional review and this cleanup. Implementation status still comes from the relevant account/setup/host records, not from an old visual-design approval.
