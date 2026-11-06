# Fieldwork 1.0 qualification record

Date: 6 November 2026. User-selected design baseline, replacing Gather. [System specification](fieldwork-system.md) · [Editable source](../../design/fieldwork.pen) · [Detailed results](../../design/fieldwork-system/verification.json).

## Result and scope

The final static design pass passes the checked contrast, layout and catalogue gates. The source was saved, closed and reopened in Pen; the manifest and verification file identify the same SHA-256. There are 45 boards, 102 reusable masters and 128 linked instances. All 50 Use components, eight Optional specimens and 22 Kairn patterns resolve to actual nodes; three deferred and five omitted entries remain explicit.

The complete resolved canvas contains 3,078 nodes. Both appearances were evaluated: **3,324 visible text checks, 228 visible icon checks and 72 declared semantic/adjacent-edge pairs pass**. The lowest observed text ratio is **5.17:1**. Transparent unselected check placeholders are excluded intentionally. There are no clipped nodes, collapsed frames, unfinished placeholders or overlapping root boards.

This is design qualification, not a claim that the application works or that every state × viewport × language combination is drawn.

## Independent review and corrections

OpenCode's `opencode-go/gemini-4-argon` independently inspected the complete exported canvas data, token/catalogue files and representative screenshots. Its verdict was conditional on bounded design and cleanup corrections. The parent verified and resolved the actionable findings; a second model approval is not claimed.

- Replaced the fixed hover fill and fixed map colors with theme-aware roles.
- Fixed selected-day geometry in the full route workspace: one row background, plain ordinals, aligned check; added recognisable picker chevrons.
- Aligned FW44 editorial headings with Fraunces and web/native control density; corrected native 16px control text and 48px fields across other specimens.
- Replaced the 3D toggle with Map/Satellite and completed Photo/Video/Voice/Text modes.
- Added explicit progress/overlay boundaries, strengthened the light boundary token, and added a labelled switch-off specimen. The slider thumb has a contrasting separator.
- Corrected feedback seams/headings, destructive styling, filled-button borders, input-only focus and separated action focus.
- Applied the link token, underline and href; replaced space-padded suffixes with layout children and corrected the tooltip and required-field copy.
- Updated board references and removed the native Explore composition's incorrect A03 capture-confirmation alias.

Representative final screenshots covered selected stage geometry, native dark controls, switches, map/capture toggles, focused fields/actions, and full dark desktop/native map compositions. Full component coverage was checked structurally and by resolved token usage; not every individual control was exercised as an interactive widget.

## Contrast method and limits

The calculation uses sRGB relative luminance with unrounded comparisons: 4.5:1 for ordinary text, 3:1 for large text and meaningful non-text cues. It resolves ancestor surfaces and supplements them with explicit mapBase/mapLand/mapRoad overlaps and control/focus/slider/progress adjacency checks. These follow [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Overlay outlines are a Fieldwork consistency/readability decision; a low-contrast container surface is not automatically a standalone WCAG failure when its controls already identify the task. Near-threshold boundaries were strengthened without claiming their former passing ratios failed.

Real imagery, tile styling, font antialiasing, assistive technology and future compositions still require runtime evaluation. Ordinary web content must satisfy [320 CSS px reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html); maps/data tables have contextual two-dimensional exceptions, not blanket permission to clip text.

## Cleanup and retained evidence

Removed **126 superseded files**: Gather source/library/viewer/catalogue/tokens/previews, its unused font assets and documents, temporary Fieldwork interaction research/viewer, redundant Fieldwork PNGs and redundant wireframe PNG exports. Tracked removals are recoverable from Git; no commit or push was made.

Retained only the editable Fieldwork and functional wireframe sources, current token/catalogue/registry/verification files, system/qualification documentation and required photograph/license notice. The wireframe source has 218 root frames, no external image dependencies and uses Inter. Its SHA-256 and the photograph's SHA-256 are unchanged.

Before deleting research, retained the S6 receipt contract, implementation boundaries, rejected patterns, accepted/modified review decisions, upstream references, web source-discovery notes and R01–R21 functional bridge. AGENTS.md, PRODUCT.md, DESIGN.md and current workflow references now point to Fieldwork. Required application code, dependencies and host configuration remain unchanged.

Final documentation checks: 642 local file/anchor references across 64 maintained documents resolve. Staged and unstaged whitespace checks pass. Remaining references to removed paths occur only in the explicit cleanup inventory.

## Remaining implementation gates

Web: keyboard/listbox behavior, focus containment/restoration, screen readers, coarse-pointer targets, 200% text and 400% zoom, and reduced motion.

Native: actual hit-testing, Dynamic Type, software keyboard and safe areas, TalkBack/VoiceOver, gesture arbitration, font binaries/licenses, multilingual shaping and physical-device readability.

Maps/domain: real Standard/Satellite overlays and attribution, opt-in map initialization, current authorization and source/export grants, operation outcomes, revocation and capture durability. Installed libraries and passing design measurements do not substitute for these checks.
