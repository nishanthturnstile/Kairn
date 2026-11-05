# Gather component system

5 November 2026 · approved baseline 1.0 · active direction selected by the user. [DESIGN.md](../../DESIGN.md) remains the decision hub.

The user has frozen Gather's fresh, warm, curved character and asks to develop the full component collection. This advances the work from competing visual directions to one system. The values and component behavior below are the approved visual baseline; it is not evidence that web/native components or product operations have shipped.

[Interactive collection](../../design/gather-system/index.html) · [Editable Pen canvas](../../design/gather.pen) · [Catalogue with component references](../../design/gather-system/catalog.json) · [Frame registry](../../design/gather-system/frames.json) · [Design-only tokens](../../design/gather-system/tokens.json).

## What the review adds

Gather works best when its shapes describe relationships: a note belongs to a photograph, a tab belongs to a chapter, and a receipt belongs to an operation. Uniform oversized rounded cards would dilute that identity. The collection adds four practical refinements:

- **Different curves for different jobs.** Full-pill actions, quieter rounded fields, attached tabs, asymmetric photograph corners and plain list rows. Most prose stays unboxed.
- **Sources that open beside their claims.** Keep the approved excerpt, observation date and return path together. On compact screens this can become a full-screen source task with the same return contract.
- **Current versus proposed information.** Scope changes, transcript corrections and stale edits make both sides visible. A selection never masquerades as a completed operation.
- **Progress with a named phase.** Local saving, private backup, contribution and publication eligibility each have their own status. An unknown outcome gets a receipt/status path, not a fabricated success animation.

Modern additions worth keeping are responsive split views, intrinsic text growth, theme-aware semantic colors, visible keyboard focus and reversible inline disclosure. Glass layers, magnetic targets, looping shimmer, autoplay, scroll hijacking, mascots and celebration around consent are not part of this direction. This is a product judgment, not a claim that a styling technique is universally bad.

## Catalogue and actual source audit

The [official shadcn catalogue](https://ui.shadcn.com/docs/components) was checked on 5 November 2026: **66 entries**, each mapped to a Kairn task and given a disposition in the linked catalogue. **50 Use, 8 Optional, 3 Defer, 5 Omit.** Every Use entry has an editable visual specimen, sometimes in a shared specimen for complementary primitives. All **22 Kairn compositions** have specimens and requirement-state contracts. Optional/deferred entries are documented, not installed or falsely counted as drawn.

Current web source is a smaller inventory: Button, Input, Label, Separator, Alert, Empty and Field exist as shadcn-style source modules. Dialog and form-controls are local implementations/equivalents; that does not establish parity with upstream Dialog, Checkbox, Radio Group, Select, Textarea or Toggle Group APIs. Existing source is compatibility evidence, not inherited styling approval.

`shadcn 4.23.0 info --cwd apps/web --json` detected Vite, Tailwind v4, Radix and the `new-york` configuration. It returned zero components because its resolved paths contain a literal `@/components` segment. Direct file inspection establishes the inventory above. This discovery must be reconciled before a later CLI add/update; it is not a reason to replace aliases or reinstall components during design work. No `add`, `init` or `apply` command was used. The first environment activation was blocked by PowerShell's execution policy; process-scoped invocation with the existing environment script succeeded. No global policy was changed.

The current docs may default to Base UI. Kairn's existing web base is Radix. Use the matching upstream variant and its composition API when implementing; do not migrate bases as a visual-design side effect. [shadcn theming](https://ui.shadcn.com/docs/theming) supplies semantic roles, while Gather supplies the proposed values.

## Foundations

The light appearance is the working default. A coherent dark baseline is shown and demonstrated, but still needs full platform qualification.

| Role | Light baseline | Dark baseline |
|---|---|---|
| Page / foreground | `#FFF8EF` / `#3E2637` | `#241C23` / `#FFF8EF` |
| Primary action / text | `#753851` / `#FFFFFF` | `#E9B9CF` / `#3E2637` |
| Attached surface / text | `#F3DDE6` / `#3E2637` | `#43303D` / `#FFF8EF` |
| Supporting text | `#735B68` | `#D6BBC8` |
| Interactive boundary | `#8B6978` | `#AD899B` |
| Focus | `#753851` | `#F9CD6C` |
| Error text / surface | `#9B2C3C` / `#FBE5E8` | `#FFBAC4` / `#4C2630` |
| Attention text / surface | `#704C0A` / `#FFF0CA` | `#F9CD6C` / `#443618` |
| Verified result / surface | `#365D46` / `#E6F0E5` | `#BBDDC3` / `#243D30` |
| Information / surface | `#315B73` / `#E7EFF4` | `#B9DCEE` / `#223844` |

Sun yellow and leaf green may support imagery, but do not independently mean approval, safety or an action. Every meaningful state has words and, where useful, an icon/mark.

Heading: Bricolage Grotesque, weight 600. Body/control: Source Sans 3, regular/600. Proposed size/line-height pairs: small supporting text 14/20, controls 16/22, body 18/27, sections 24/30, compact titles 36/40, display 56/60. Fonts are already bundled for design presentation with their OFL licenses; no application font dependency changed. Source-language text needs tested fallback and platform shaping. The canvas includes Tamil and the rupee symbol; that single specimen is not language coverage or Android/iOS font acceptance.

Spacing: 4, 8, 12, 16, 24, 32, 48, 64. Dense corners 12; fields 20; task surfaces 28; action pills fully rounded; photo corners 64/20/64/20. Use borders for ordinary controls and one soft shadow for elevated overlays. Do not put every sentence into a separate card.

Targets: 48 px for touch; compact desktop controls may use 44 px with suitable input conditions. Focus: 2 px contrasting outline with 3 px separation. These are minimums, not fixed heights: labels wrap and controls grow. Text must not be clipped, shrunk to fit or hidden behind a keyboard. Compact layouts stack; complementary panes are proposed from approximately 900 px when content permits. Body measure is about 68 characters. Use actual safe-area and keyboard insets.

Motion: press 120 ms, context change 180 ms, note reveal 220 ms; decelerating easing `cubic-bezier(0.16,1,0.3,1)`. No automatic carousels, repeated entrance animations or animation of consequential permission decisions. Reduced motion removes movement and smooth scrolling; it does not hide content or status. Native haptics remain an untested optional refinement, never confirmation of network success.

## Component behavior and platform mappings

Every catalogue record defines its purpose, Gather customization, states, owning screen IDs, source presence and specimen. These shared rules apply in addition:

| Family | Web realization | Native realization | Shared contract |
|---|---|---|---|
| Actions and toggles | Radix/shadcn Button, Toggle, ToggleGroup; named icons | Pressable with accessibility role/state and platform feedback | Stable target; pressed/disabled/pending are distinct; no repeat submission while uncertain |
| Fields and choices | Field + Label, InputGroup, Textarea, RadioGroup, Checkbox; existing TanStack Form boundary | TextInput and separate accessible native choice controls | Visible labels, helper/error relationships, preserved input, keyboard-safe action area |
| Dates and lists | Calendar/DatePicker; Combobox or NativeSelect for suitable cases | Platform picker/date entry with explicit unknown-date path | Dates, timezone and uncertainty remain distinct; do not infer a date from missing metadata |
| Reader/task navigation | Tabs for same-context view changes; links for destinations | Native navigation and labelled segmented view choice | Preserve chapter/stage/source context and Back; no mandatory global sidebar |
| Dialogs and source panels | Accessible Dialog/AlertDialog/Sheet, focus containment and restored opener | Platform modal/full-screen task, accessibility focus and Back handling | Named title, clear close/cancel, dirty-work guard when applicable; compact is not a squeezed desktop overlay |
| Feedback and lists | Alert, Empty, Progress, Table/DataTable, ordinary document flow | Labelled status/list rows and platform announcements | Persistent status for critical outcomes; no toast-only receipt; loading, empty and denied are different |
| Media | Accessible gallery and media controls; captions/transcripts | Native media controls with explicit user start | Missing media fallback, approved assets only, Previous/Next and seek alternatives |
| Dense editing | Optional contents rail/resizable evidence panes | Focused single task and explicit browser continuation | Retained candidate, non-drag ordering, independent browser authentication |

No DOM component, CSS dependency or shadcn package is shared into React Native. Plain semantic values belong in the existing token boundary when implementation begins; native rendering remains React Native/Unistyles. Existing upstream components may be reused after checking the new specification, without importing their former appearance.

## Required states and composition coverage

The 14 library boards cover 67 reusable specimen compositions plus three atomic reusable masters. Four compact task recipes use linked instances. These are design symbols, not 70 production component APIs. The broad inventory includes all required primitives and product composition families; not every Cartesian combination of state, role, theme, viewport and language is drawn.

GS11 pins button default/hover/focus/pressed/disabled/pending and field rest/focus/error, plus mixed selection and uncertain operation. GS17 adds the full calendar, Unknown dates, denied/interrupted/saving/failed capture, and missing/unsupported import states. Other boards demonstrate true empty, review-only sources, stale candidates, no-GPS rest stages, participant branches, unavailable public content and dark/light foundations. The interactive viewer adds input validation, source disclosure, current/proposed scope review with cancellation, honest transfer phases, theme switching, catalogue search and reduced-motion behavior. Its 125% live-text study is not a substitute for 200% platform text qualification.

The four compact recipes are a **role walkthrough**, not automatic account switching or a complete replacement for R01–R21:

| Recipe | Existing screen / actor | Entry, forward, return |
|---|---|---|
| GS13N | A04.scope / Arun source owner, native 390 × 1040 | Owned source → select/review scope → exact caller; export independent |
| GS14W | W08 / Dev publisher only, compact browser 390 × 1040 | Publication review → identify authorized repair task → review; no coauthor edit action |
| GS15W | W02 + W04 / Leela coauthor, compact browser 390 × 1040 | Blocker → compare dependent-use exclusion → accepted scoped repair → W08; stale proposal retained |
| GS16N | A06.preview / Dev publisher, native 390 × 1040 | Refreshed candidate → inspect exact Story/Explore/Learn → approval review; Back to review; changes invalidate candidate |

Nilgiris fixture identities and prior approved V1 remain consistent. The voice source is review-only; the repair excludes its placement and dependent fare claim. A coauthor does not acquire publisher power, and a publisher does not acquire editing power. Source owner correction is an alternative authorized repair, not an action available to every collaborator. Native/browser sessions authenticate independently.

Remaining detailed visual states: full native/browser overlay and keyboard permutations, 200% text on the new component collection, full dark-mode state matrix, non-Latin fallback coverage, complete recording/import errors, export/lifecycle confirmations, operator tooling and every screen outside the existing first-flow artifacts. Their component contracts are curated; their complete screens are not newly drawn.

## Implementation and governance

This task builds the design library, catalogue, tokens and isolated presentation. Application routes, components, shared runtime tokens, dependencies and lockfile are unchanged. Runtime implementation should proceed in bounded vertical slices; importing every available registry entry would increase maintenance without proving a product need.

Use semantic names such as `action.primary`, `surface.attached`, `status.pending`, `source.scope` and `publication.candidate`; do not encode one screen's color directly into a shared component API. Separate visual variants from capability decisions. Components render authorized projections; server rules remain authoritative.

Before production acceptance, verify keyboard/focus and screen readers on web; TalkBack/VoiceOver and keyboard/safe-area behavior on native; text growth, language shaping, contrast in both appearances, touch targets, physical outdoor readability and reduced motion. Verify real permissions, durable saving and operation receipts against their domain boundaries separately. A successful mockup click cannot satisfy those gates.

Changes to a foundation or shared interaction update this specification, the token candidate, Pen master and affected specimens together. Record review evidence and explicit remaining limitations. Competing explorations and their research packet were removed at the user’s request. Gather is the sole active baseline; future customization requires an explicit recorded change.

Next implementation/design slice: use the selected components for the complete owner/coauthor/publisher scope → blocker → authorized repair → refreshed exact preview flow on native and compact browser, with keyboard/text-growth and stale-permission variants. The neutral R01–R21 contracts remain the coverage baseline.

## Review evidence

[Qualification record](gather-verification.md).
Freeze: approved by the user on 5 November 2026. Editable source: `design/gather.pen`, 36 root frames and 70 reusable symbols. Review evidence: [qualification record](gather-verification.md). Future changes are deliberate revisions to this baseline.
