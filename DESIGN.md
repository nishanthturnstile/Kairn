# Kairn design hub

**Gather 1.0 — approved and frozen by the user, 5 November 2026.** This is the sole active visual design system. Implement it consistently; do not reopen competing directions or infer defaults from old application styling. The user may request deliberate customization later. Record such changes here and update the specification, tokens, components and affected screens together.

## Authoritative artifacts

- [System specification](docs/design/gather-system.md): visual rules, component anatomy, state and platform contracts.
- [Interactive component collection](design/gather-system/index.html).
- [Editable Gather library](design/gather.pen): GS00–GS17, 18 boards/recipes with 18 external notes; 70 reusable design symbols. Start at GS00 / `kKd6P`.
- [Approved token baseline](design/gather-system/tokens.json), [component catalogue](design/gather-system/catalog.json), [frame registry](design/gather-system/frames.json).
- [Review and qualification record](docs/design/gather-verification.md).

The catalogue covers 66 upstream entries: 50 used, eight optional, three deferred and five omitted. Twenty-two Kairn patterns have specimens. Web uses shadcn/Radix; native uses separate React Native/Unistyles components. Share semantic design values, not rendering dependencies.

## Functional authority and remaining work

[Product requirements](docs/core/product_requirements.md) govern scope. [Screen map](docs/implementation/mockup_screen_map.md) and the owning mobile, creator, public, account and lifecycle workflow specifications govern tasks, permissions, connectivity and recovery. [Architecture](docs/core/architecture.md) governs the stack.

[Connected functional wireframes](design/flow-wireframes.pen) remain useful: 108 screens/states, 108 notes and two overviews. First-flow overview `OjON2`; scope/repair refinement `OLIDE`. Their neutral styling has no visual authority. Broader screen coverage remains incomplete; freezing Gather does not imply that every screen has been drawn.

Visual approval is not runtime qualification. Web/native implementation, screen readers, real text scaling, native font shaping, keyboard/safe areas, physical-device readability and actual durability/authorization still require their acceptance checks. Logo/app icon remain unspecified; use the approved typography and existing textual product name without inventing a new identity.

Next bounded task: apply Gather to the complete scope → publication blocker → authorized repair → refreshed preview contracts, then implement and qualify the native/web slice.

## Freeze and cleanup decision

The user approved the completed system and requested deletion of competing concepts, temporary experiments and design-exploration research. Removed all pre-system concept/refinement canvas frames, comparison viewers, obsolete previews and the exploration research packet. Kept the approved library, its required licensed assets, functional workflow specifications and neutral connected wireframes. No application code, dependency, commit, push or publication is part of this cleanup.
