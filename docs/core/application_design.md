# Application experience requirements

Updated 6 November 2026 after the user selected Fieldwork 1.0. [DESIGN.md](../../DESIGN.md) owns the active visual baseline; this document retains functional screen responsibilities. Superseded styling and fixed layouts do not override the selected system.

## 1. Functional purpose

One canonical journey records what happened from departure to return. Source owners choose what to contribute; coauthors edit permitted material; publishers deliberately approve a version. Guests experience eligible approved stories and inspect dated evidence. Preserve uncertainty, chronology and attribution. Private backup, contribution, publication permission, publication and original-file export are separate states.

## 2. Workflow ownership

Use the [shared lifecycle specification](../implementation/lifecycle_workflow_spec.md) to connect [mobile](../implementation/mobile_workflow_specification.md), [creator web](../implementation/creator_web_workflow_spec.md) and [public web](../implementation/public_web_workflow.md). The [account handoff](../implementation/accounts_journeys_access_design.md) covers authentication and E01–E16. Requirements and selected domain decisions govern permission and lifecycle behavior.

Screen IDs identify responsibilities, not fixed navigation chrome, page counts or layouts. Task groupings, labels, containers and presentation can change during new design; update the connectivity contracts when they do.

## 7. Screen responsibilities

### 7.1 Screen inventory

| ID | Surface | Screen | Primary job |
|---|---|---|---|
| A01 | Android/iOS | Your journeys | Open, create, or join a canonical journey |
| A02 | Android/iOS | Capture | Save a photo, video, voice note, or text moment |
| A03 | Android/iOS | Capture confirmation | Verify local state, destination, and location evidence |
| A04 | Android/iOS | Moments and sync | Manage personal sources and upload state |
| A05 | Android/iOS | Import review | Select, correct, and scope existing sources |
| A06 | Android/iOS | Journey overview | See stages, recent changes, review work, and publication state |
| A07 | Android/iOS | Story or route edit | Make focused chapter, moment, and leg changes |
| A08 | Android/iOS | Share my highlights | Create a personal approved selection |
| A09 | Android/iOS | You and account | Manage the private profile, saved research, storage, settings, and support |
| W01 | Creator web | Journey home | See status, contributors, recent changes, and work queue |
| W02 | Creator web | Story editor | Edit chapters, narrative, captions, order, and inclusion |
| W03 | Creator web | Route editor | Correct stages, branches, recorded routes, and gaps |
| W04 | Creator web | Learn editor | Add dated, sourced practical details |
| W05 | Creator web | Sources | Review media, sharing/export grants, processing, attribution, and withdrawal |
| W06 | Creator web | People and roles | Manage invitations, roles, publishers, and administration |
| W07 | Creator web | Revision and conflict view | Compare changes and restore safely |
| W08 | Creator web | Publish review | Inspect rights, privacy, viewer output, and visibility |
| W09 | Creator web | History and account | Manage journey references, saved research, profile, exports, and account controls |
| P01 | Public web | Discover | Find a public journey |
| P02 | Public web | Story | Experience the approved narrative |
| P03 | Public web | Explore | Understand route, sequence, and evidence |
| P04 | Public web | Learn | Find practical details and ask sourced questions |
| P05 | Public web | Source detail | Inspect an approved supporting moment or transcript |
| P06 | Public web | Personal highlight | View a focused selection and open the full journey |
| P07 | Public web | Optional public profile | View intentionally selected eligible journeys |
| P08 | Public web | Unavailable | Reveal no protected title, cover, or location |

## 9. Component system

Fieldwork 1.0 is the selected direction. The [approved component system](../design/fieldwork-system.md) defines approved visual anatomy, values, variants and platform mappings; the [design hub](../../DESIGN.md) owns its decision status. Preserve functional states: loading, true empty, filtered-empty, offline, pending/uncertain action, success, failure/retry, stale data and access denial. Keep labels, drafts, focus, safe returns and accessible alternatives through those transitions. Design specimens do not establish runtime acceptance.

Web and native own their rendering. Share approved plain design values and pure behavior through the existing architecture; do not infer a color, type family or icon choice from current package contents. Existing implementation can be reused only after assessing it against the newly selected design.

## 12. Accessibility and resilience

Reading and essential actions must work without a map, unavailable media, color alone or a fine gesture. Preserve semantic labels, keyboard/focus behavior, sufficient contrast, scalable text, safe areas and reduced motion. Reordering needs a non-drag path; playback must be user controlled. Platform qualification and source permission checks remain required.

## 18. Handoff package

Design handoffs follow the ten delivery steps in [requirements section 18.2](product_requirements.md#182-dependency-aware-implementation-sequence) and [architecture section 16](architecture.md#16-implementation-dependencies-and-release-evidence). Visual foundation and page choices are reopened in the design hub; this table preserves functional delivery responsibilities.

| Order | Design handoff | Controls delivered with it |
|---|---|---|
| 1 | Contracts, accounts, canonical identity, membership, capabilities, source/export grants, and audit. | Sign-in/recovery, private history, journey setup, role-aware controls, permission selectors, account impacts, and restriction status language. |
| 2 | Android/iOS capture, durable local saving, queues, and sync. | Confirmation, cancellation/retry, offline and storage failures, own-source removal/export, and visible destination. |
| 3 | Selected-media, audio, GPX, and FIT import and safe processing. | Candidate review, provenance, per-file errors, batch choices, and declared limits. |
| 4 | Contributions, revision-aware shared editing, conflicts, transfer, and departure. | Sources/People, stale-candidate comparison, revision recovery, source withdrawal, original-file export approval/revocation, transfer acceptance, and departure impacts. |
| 5 | Supported transcription and transcript review. | Language support, correction provenance, source offsets, pending/failed/unsupported states, and source playback. |
| 6 | Reconstruction, geography, canonical story editing, and practical details. | Story/Route/Learn editors, evidence legend, branches/gaps, transcript-based suggestions, dated cost context, and accessible correction controls. |
| 7 | Accessible viewer modes, safe approved-version generation, privacy preview, publishing, and revocation. | Story/Explore/Learn/source/unavailable views, exact publisher preview, explicit map loading, unpublish, privacy impacts, and pending recovery confirmation. |
| 8 | Personal highlights, static cards, and optional public-profile references. | Eligible selection, attribution, empty-selection fallback, full-journey access explanation, and revocation. |
| 9 | Public catalog, listing moderation, saved research, and future-event references. | Discover filters, listing/report/takedown states, private notes, reference removal, and distinct-event creation. |
| 10 | Search, grounded question sessions, citations, quotas, and answer invalidation. | Guest search, signed-in questions, source jumps, limits, abstention, provider failures, and invalidated answers. |

Withdrawal, archival, permitted export, deletion, retention, security, and support interactions accompany the data/action that introduces them. They are not a final handoff. Transcription precedes the reconstruction and practical suggestions that consume it.

Each handoff includes the relevant mobile, tablet, and desktop layouts. It also includes keyboard and screen-reader behavior, component tokens, copy, and requirement references. Native handoffs specify Unistyles token/variant mappings and responsive behavior; web handoffs specify the matching shadcn/Tailwind tokens. Loading, empty, failure, offline, and permission-denied states are part of the handoff.

## 19. Open design decisions

All visual and composition choices are reopened. Track them only in [the design hub](../../DESIGN.md), including fonts, colors, logo, icons, spacing, motion, responsive layouts, components and every page. There is no inherited visual approval or old milestone to resume.
