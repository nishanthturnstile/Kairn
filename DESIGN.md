# Kairn visual system — P02 revision

This implementation companion applies `docs/core/application_design.md`; it does not replace its product, access or evidence rules. The user rejected the initial text-heavy prototype on 4 November 2026 and authorized a modern, reference-informed redesign.

## Direction

Photo-led journal: one generous cover with an editorial title, supported by compact task controls and quiet, layered surfaces. Real content leads. Sample/debug controls are a disclosure, not a permanent third column. Creator tools use sans-serif; journey names use Newsreader. No booking, weather, AI-planning or gamified readiness features.

Exploration considered a contact sheet, a chronological album, a photographic journal, a museum collection, a walking guide, a correspondence archive and a reading library. The photographic journal is the chosen composition (Impeccable direction seed 96b1153c, candidate 3), constrained by the user's reference and application design. Dense reference rails and miniature catalog grids lose legibility on phones; their useful discipline is precise alignment and repeatable metadata. The authorized autonomous workflow replaces an additional concept-approval round.

## Tokens and roles

Use the existing shared tokens, not a parallel theme: Paper 50 `#F6F2E8` canvas, Paper 0 `#FFFDF8` surfaces, Ink 950 `#172019` text, Forest 800 `#234F3B` primary action, Clay 100/800 review, Line 200 separators. Ink 500 remains the visible enabled-control boundary. Newsreader 500 titles; Instrument Sans 400/600 controls and body. Existing radius scale: 8 small, 14 medium, 22 large; photo containers use large, grouped surfaces medium, small status pills round. Spacing follows the existing 4-point scale.

## Component contracts

- Journey cover: bundled image only when explicitly supplied; compact date/place row, editorial title, separate contributors and action. A missing cover renders the typographic empty specimen; it never substitutes this image.
- Navigation: narrow desktop rail, compact web mobile header; native persistent footer for the available P02 routes. Future product destinations remain absent until their batches.
- Avatar stack: initials for fictional contributors, textual equivalent, no fabricated portraits.
- Form disclosure: create and join have explicit controls, retained input, validation and a clear close action. Only one form is open at a time.
- Audience choice: full-row labelled radio, selected fill plus checked indicator, complete permission language.
- Specimen panels: white grouped surfaces, clear section hierarchy, text examples with source/date attribution. Disabled, pending, error and focus remain visible.
- Sample controls: always reachable, collapsed initially, honest reset notice. Scope and source content remain governed by the existing controller.

## Responsive and interaction

Desktop uses a 216px rail and generous content canvas, two-column task/specimen layouts where useful. Tablet compresses the rail. Phones use one column with 16px margins and a cover-led first screen. Native uses safe areas, system back and 48dp targets. Long content grows vertically. No auto-playing or decorative entrance motion; pressed/hover feedback respects input mode and reduced motion.

## Provenance

Reference: user-supplied travel-app image (composition only); official Day One journal-cover documentation and Polarsteps travel-tracker presentation (reviewed 4 November 2026). No third-party screen or artwork is copied. `tests/fixtures/prototype/assets.json` records purpose-created sample media. Figma installation was requested; no Figma edit is claimed until connected tools are available.
