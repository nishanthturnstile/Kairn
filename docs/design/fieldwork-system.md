# Fieldwork 1.0 component system

Selected by the user on 6 November 2026, replacing Gather. This is Kairn's active visual baseline. [Design hub](../../DESIGN.md) · [Editable library](../../design/fieldwork.pen) · [Tokens](../../design/fieldwork-system/tokens.json) · [Catalogue](../../design/fieldwork-system/catalog.json) · [Registry](../../design/fieldwork-system/manifest.json) · [Qualification](fieldwork-verification.md).

## Identity and anatomy

Fieldwork is a compact field journal for dense maps, sources and journey narratives. Linen, Basalt, Terracotta, Sage, Ochre and Mist supply the material character; semantic light/dark tokens determine actual usage. Brand swatches are not unrestricted text colors.

Geist is the UI, label and data face. Fraunces is for journey titles and editorial headings. Labels start at 13, compact web UI at 14, native control/body text at 16, and reading at 18. These are scalable starting values, not fixed text boxes. Fraunces should not replace the UI font inside controls.

Ordinary controls have an 8 radius; fields 10; large surfaces 16. A forward action has an attached leading edge and rounded trailing edge. Evidence slips attach to the exact claim through a shared margin. Photo corners use 24/8/24/8, preserving the frame when opening an uncropped image. Do not apply an unusual contour to every control.

The selected day has one full-row fill, a plain aligned ordinal column and a non-color selection mark. Keyboard focus remains independent of selection. The day spine indicates chronology, never continuous GPS recording. Gaps require explicit text and honest route geometry.

## Component coverage

The 45 boards FW00–FW44 contain 102 reusable masters and 128 linked instances. They map 66 catalogue entries: 50 Use, 8 Optional, 3 Defer and 5 Omit. All 50 Use entries, all 8 Optional entries and 22 Kairn patterns have editable specimens; the remaining dispositions are explicit on FW38. These counts describe design coverage, not installed component APIs or every possible screen/state permutation.

| Boards | Purpose |
|---|---|
| FW00–FW11 | Foundations, control families, state and motion rules, dark foundation |
| FW12–FW16 | Route workspace, native map sheet, editorial reader, sources and publication compositions |
| FW17 | Scope of qualification |
| FW18–FW20 | Day picker, claim/evidence relationship and photo inspection |
| FW21–FW29 | 50 core component specimens |
| FW30–FW35 | K01–K22 domain patterns |
| FW36–FW38 | Optional, deferred and omitted components |
| FW39–FW42 | Platform rules, per-component state register, native/error/dark specimens |
| FW43 | Research references and dependency boundaries |
| FW44 | Web/native light/dark comparison |

Start at FW00 / `exiKV`. The manifest provides exact node IDs. Catalogue entries retain purpose, screens, state contracts, customization, platform behavior and upstream references.

## Color and state contracts

Use `ink` and `muted` for readable text; `link` with an underline or equivalent non-color cue for links; `onAction` on `action` and `actionHover`. Use the error role for destructive actions. Status headings and seams use `good`, `warn` or `error` on their paired backgrounds; supporting copy may use ink/muted. Success never means merely queued.

`boundary` identifies controls and meaningful track/overlay edges. `line` is only a quiet decorative separator. The slider thumb has a contrasting surface ring. Selected rows combine fill, label and check; switches show a position and On/Off text. Disabled controls retain readable reasons.

Focus is a 2px outline. Filled actions require 3px of surface separation so focus does not merge into the fill. Input focus outlines the input, not its label. Focus, hover, selection, pending and disabled are separate states.

All 72 declared text, control, focus, status, map and adjacent-edge pairs pass their stated thresholds. The complete static text/icon scan also passes. The [verification record](fieldwork-verification.md) gives the method, fixes and limits; runtime combinations still require checks.

## Web and native behavior

| Concern | Web | Native / touch |
|---|---|---|
| Controls | 36px minimum for ordinary compact controls; rich rows may be larger | 48 minimum touch target; rich choices usually 56 |
| Density | Dense rows and contextual tools | Preserve information order; stack tools and grow rows |
| Type | UI 14; readable labels 13 | Control/body 16; labels may remain 13 and scale |
| Pickers | Accessible combobox/listbox, separate focused and committed values | Search sheet or platform picker; no hover dependency |
| Calendar | Labelled date grid with keyboard navigation | Native picker/list when seven usable columns cannot fit |
| Overlays | Focus containment, Escape/cancel, opener restoration | Safe areas, keyboard-aware height, explicit Close/Back/Expand |
| Reflow | Ordinary content fits 320 CSS px; 200% text resizing and 400% zoom qualify separately | Dynamic Type and multilingual shaping; content-driven minimum heights |
| Motion | Hover only on capable pointers; keyboard selection immediate | No hover-only action; gestures have visible alternatives |

Coarse-pointer web uses the touch target contract. Pen dimensions are specimen dimensions; implementation uses minimums and flexible layouts. Tables and maps may need two-dimensional navigation, while text, cells, controls and accessible list alternatives remain readable.

Default appearance follows the system, with an explicit user override. Both appearances use the same semantic roles and interaction meanings. Use native and DOM implementations separately, sharing plain tokens and domain semantics only.

Map previews use themed mapBase/mapLand/mapRoad/mapRoute/mapLabel. Real Mapbox Standard and Satellite imagery need their own overlay checks; use opaque surfaces or tested halos, visible provider attribution, and an accessible list alternative. The map loads on an explicit action. Follow story is opt-in and stops on manual pan. R1 uses Map/Satellite in 2D; terrain/3D is not added by the component catalogue.

## Interactions and domain truth

The three strongest signatures are a day picker attached to the chronology, evidence attached to the exact claim, and an editorial photograph revealing its full frame while restoring the reader's place. Mixed selections show capability-specific eligibility rather than inferring rights from ownership. The catalogue preserves the research decisions and rejected patterns.

Keep familiar consent, checkbox, radio, switch and destructive confirmation mechanics. Local save, private backup, journey contribution, publication and original-file export have independent meanings. An operation receipt reports those axes explicitly; animation is not evidence of completion. K01–K22 preserve permission changes, unknown outcomes, conflict candidates, source withdrawal, stale previews and safe unavailable responses.

Press feedback is at most 120ms; context changes approximately 180ms; occasional disclosure/photo transitions approximately 220ms. Repeated keyboard actions remain immediate. Reduced motion removes spatial movement and camera flights; use immediate state or a short fade. Avoid magnetic controls, radial or gesture-only menus, bouncing consent, auto-advancing media and scroll hijacking.

## Source compatibility and implementation boundary

The selected stack remains web shadcn/Radix with Tailwind, native Expo/React Native with Unistyles v3, and the current Mapbox web/native integrations. [Architecture section 14](../core/architecture.md#14-canonical-stack-and-dependency-register) owns dependencies. Base UI, Motion Primitives, coss, React Aria, PhotoSwipe and other researched libraries are references or feature-specific candidates, not automatic additions.

Direct source inspection confirms Button, Input, Label, Separator, Alert, Empty and Field as shadcn-style source modules. Dialog and form-controls are local equivalents; this does not establish upstream API parity for Dialog, Checkbox, Radio Group, Select, Textarea or Toggle Group. Existing styling has no visual authority.

The 5 November source audit used `shadcn 4.23.0 info --cwd apps/web --json`: it detected Vite, Tailwind v4, Radix and new-york, but returned zero components because resolved paths contained a literal `@/components` segment. Reconcile discovery before a later CLI add/update. Do not replace aliases, reinstall primitives or migrate to Base UI as a design side effect. The current pass rechecked source files without invoking add/init/apply.

No application routes, dependencies, native modules or runtime tokens were changed by this design decision. Implement bounded vertical slices and qualify actual behavior.

## Functional wireframe bridge

[Connected functional wireframes](../../design/flow-wireframes.pen) and the owning workflow specifications retain R01–R21 scope/repair/preview responsibilities. Fieldwork specimens supplement those contracts; the removed Gather recipes are no longer visual references.

| Existing task and actor | Fieldwork composition | Required transition |
|---|---|---|
| A04.scope / source owner | K05 Scope review and K06 Original export grant, FW31 | Owned source → deliberate proposal/review → exact caller; export remains independent |
| W08 / publisher only | K13 Publication blocker, FW33; FW16 narrow browser | Inspect blocker → authorized owner/coauthor repair task → review; no inferred editing power |
| W02/W04 or A07 / coauthor | K11 Editor and K12 Conflict comparison, FW32 | Compare affected-use exclusion → accepted scoped repair → fresh candidate; retain stale proposal |
| A06.preview or W08 / publisher | K14 Exact candidate and K15 Approval, FW33 | Inspect exact Story/Explore/Learn → approval review; draft/permission changes invalidate |

Native and browser sessions authenticate independently. A role walkthrough is not an account switch. The source owner can repair their source; a coauthor cannot grant reuse or approve publication solely by being a coauthor.

## Assets, governance and acceptance

The reference photograph and its [license notice](../../design/exploration-assets/NOTICE.md) are retained. It is illustrative media, not evidence for the fictional journey. Pen uses Geist/Fraunces font support; exact application font files, licenses, language fallbacks and native shaping must be qualified when bundled.

Future changes are deliberate revisions to this baseline: update the specification, token definitions, masters and affected specimens together. Visual approval does not waive real keyboard/screen-reader operation, text growth, mobile safe areas, focus restoration, outdoor readability, reduced motion, actual map styles, permissions or capture durability. Logo/app icon remain unspecified.
