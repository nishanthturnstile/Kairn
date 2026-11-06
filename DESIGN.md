# Kairn design hub

**Fieldwork 1.0 — selected by the user, 6 November 2026.** This replaces Gather as the sole active visual baseline. Preserve Fieldwork's compact editorial character and subtle relationships. Future customization is a deliberate baseline revision.

## Authoritative artifacts

- [System specification](docs/design/fieldwork-system.md): foundations, anatomy, state contracts, platform behavior and implementation boundaries.
- [Editable Fieldwork library](design/fieldwork.pen): FW00–FW44, 45 boards, 102 reusable masters and 128 linked instances. Start at FW00 / `exiKV`; FW44 compares web/native in light/dark.
- [Design tokens](design/fieldwork-system/tokens.json), [component catalogue](design/fieldwork-system/catalog.json), [frame and component registry](design/fieldwork-system/manifest.json).
- [Review and qualification record](docs/design/fieldwork-verification.md) and [machine-readable verification](design/fieldwork-system/verification.json).

Coverage: 66 upstream entries — 50 Use, eight Optional, three Defer and five Omit — plus 22 Kairn patterns. Web uses shadcn/Radix/Tailwind; native uses separate React Native/Unistyles components. Share plain tokens and semantics, not rendering dependencies.

## Functional authority

[Product requirements](docs/core/product_requirements.md) govern scope. [Screen map](docs/implementation/mockup_screen_map.md) and the owning mobile, creator, public, account and lifecycle specifications govern tasks, permissions, connectivity and recovery. [Architecture](docs/core/architecture.md) owns the selected stack.

[Connected functional wireframes](design/flow-wireframes.pen) remain functional references: 108 screens/states, 108 annotations and two overviews. First-flow overview `OjON2`; scope/repair overview `OLIDE`. Their neutral styling has no visual authority. Component coverage does not mean every application screen has been designed.

## Approval and qualification

The final pass includes independent Gemini Argon review, parent corrections, contrast calculations, canvas bounds checks and saved-file verification. These qualify the design specification, not a running web/native application. Keyboard and screen readers, actual text scaling, font shaping, safe areas, map imagery, physical-device readability, permissions and durability still need implementation acceptance.

Next bounded implementation/design slice: apply Fieldwork to the complete scope → publication blocker → authorized repair → refreshed exact preview contracts on native and compact web. Logo/app icon remain unspecified.

## Baseline revision and cleanup

The user selected Fieldwork and requested only required files remain. Gather's library, catalogue, viewer, tokens, previews and unused font assets are superseded. Temporary Fieldwork research viewers and redundant preview exports are removed after preserving accepted decisions, domain contracts, upstream references and asset provenance in the current catalogue/specification.

Keep the editable Fieldwork source, its tokens/catalogue/registry/verification, required licensed media, functional wireframes and current workflow documents. No application implementation, dependency update, commit, push or publication is part of this task.
