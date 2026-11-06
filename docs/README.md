# Documentation

Start design and workflow work with [DESIGN.md](../DESIGN.md). Fieldwork 1.0 is the selected visual baseline; superseded concepts and old application styling are not design inputs. Product requirements and technical implementation records retain their own scope.

| Folder | Contents |
|---|---|
| [core/](core/) | Current product, requirements, architecture, and design references |
| [implementation/](implementation/) | Foundation, host workflow, and product implementation plans |
| [research/](research/) | Supporting findings, research plans, cost comparisons, probes, and recorded evidence, grouped by topic |

## Core documents

- [Product plan and vision](core/product_plan.md)
- [Kairn ecosystem direction](core/ecosystem_direction.md) — toolkit vision, current-scope mapping, reusable boundaries and parallel engineering packets
- [Product requirements](core/product_requirements.md)
- [Architecture and stack](core/architecture.md)
- [Application experience requirements and screen IDs](core/application_design.md) — functional responsibilities; visual planning lives in DESIGN.md

## Design and workflows

[DESIGN.md](../DESIGN.md) connects Fieldwork to all surfaces. Its [system specification](design/fieldwork-system.md), [editable library](../design/fieldwork.pen), [catalogue](../design/fieldwork-system/catalog.json) and [qualification record](design/fieldwork-verification.md) are the active visual references. Runtime behavior still requires acceptance checks. Workflow documents below preserve tasks and connections.

- [Pen.dev setup and design workflow](implementation/pen_dev_setup_plan.md) — extension/MCP connection, three configured Codex profiles, verified MCP canvas access, session refresh, free-plan limits, reusable libraries and screen-by-screen handoff
- [Cross-surface journeys and lifecycle workflows](implementation/lifecycle_workflow_spec.md) — start here for the complete journey map, shared account/history/export/highlight screens, named lifecycle actions and combined scenarios
- [Mockup screen map](implementation/mockup_screen_map.md) — complete mobile/web inventory, shared-flow aliases, principal connections, required states, lifecycle coverage and open choices before mockup production
- [Mobile workflow and screen specification](implementation/mobile_workflow_specification.md) — A01–A09 screen families, 48 screen/overlay contracts, incoming/outgoing navigation, components, actions, permission/recovery states and prototype acceptance
- [Creator-web workflow and screen specification](implementation/creator_web_workflow_spec.md) — W01–W08 entry/exit connectivity, components, actions, permissions, adverse states, architecture boundaries and prototype review tasks
- [Public-web workflow and screen specification](implementation/public_web_workflow.md) — P01–P08 incoming/outgoing navigation, components, saved research, question states, publication boundaries and prototype acceptance scenarios
- [Accounts and journey experience handoff](implementation/accounts_journeys_access_design.md) — consumer workflows, screen/route inventory, components, responsive behavior, and UI/UX acceptance
- [Workflow review and reset verification](implementation/workflow_review.md) — functional findings, corrections and documentation checks

## Implementation plans

- [Ecosystem planning progress](implementation/ecosystem_direction_progress.md) — recorded direction, branch baseline, documentation checks and unimplemented follow-ups

- [Repository setup](implementation/repository_setup_plan.md) — completed foundation interface, acceptance gates, and constraints on later changes
- [Repository setup progress](implementation/repository_setup_progress.md) — implemented batches, compatibility decisions, and executed checks
- [Local mobile development](implementation/mobile_development_plan.md) — hosts, testing, and distribution constraints
- [SDK 58 patch refresh](implementation/expo_sdk_refresh_progress.md) — dependency corrections, full online verification and affected native qualification
- [Native host setup](implementation/native_host_setup.md) — current Windows/Mac commands, Metro/API routes, signing renewal, and device workflow
- [Branch and checkout workflow](implementation/checkout_workflow.md) — development/main promotion, authoring-host choice, protected checkpoint synchronization and recovery
- [Checkout reconciliation record](implementation/checkout_reconciliation_progress.md) — preserved pending files, branch-history backups and initial host alignment
- [Development skills](implementation/development_skills.md) — installed project skills, source provenance, and how to apply them to Kairn
- [Accounts, journeys and access implementation](implementation/accounts_journeys_access_plan.md) — plan 1.2: modules, data/migrations, APIs, permissions, delivery order, and acceptance gates
- [Local account runtime](implementation/accounts_runtime.md) — private paired config, isolated Mailpit/S3 activation, trusted ingress and native handoff
- [B04 account delivery plan](implementation/accounts_b04_plan.md) — reviewed B01–B03 baseline, ordered account/backend/web/native slices and acceptance boundaries
- [Accounts/journeys implementation progress](implementation/accounts_journeys_access_progress.md) — starting checkpoint, B01 contracts/web specimens, complete B02 database and B03 local boundaries, B04 auth/account services in progress, executed checks, resolved Expo compatibility and remaining batches
- [Domain transactions and bounded workers](implementation/domain_transaction_boundary.md) — B03 checked commands, atomic jobs, sealed mail/auth callback guard, private identity media and retention
- [Restriction recovery runbook](implementation/restriction_recovery_runbook.md) — independent journal protocol, concrete operator fence/replay/credential sequence and actual deployment gate
- [Identity database foundation](implementation/identity_database.md) — B02 identity/journey/source/operation models and policy graph, migrations, enqueue-only producer grants, existing-volume upgrade and pool budget
- [Selected account/journey decisions](implementation/accounts_journeys_access_decisions.md) — chosen authority/lifecycle policy, field limits, expiry, retention targets and external activation gates; visual asset choices are reopened
- [How account/journey implementation starts](implementation/accounts_journeys_access_start.md) — first coding batch, visible checkpoints, user/developer responsibilities, existing checks, and current branch dependency

## Research

- [Architecture research](research/architecture/) — stack, maps, providers, and the [map cost comparison](research/architecture/map_cost_comparison.md)
- [Repository setup research](research/repository-setup/) — toolchain, native builds, Compose, compatibility probes, and host observations
- [Accounts and journey-access research](research/accounts-journey-access/analysis_2026-11-03.md) — current-code gaps, functional analysis, version-matched integration findings; historical visual recommendations are withdrawn
- [Independent plan review](research/accounts-journey-access/review_2026-11-03.md) — OpenCode/DeepSeek V4.1 Flash findings, parent assessment, plan corrections, and remaining activation/verification gates
- [Implementation review](research/accounts-journey-access/implementation_review_2026-11-04.md) — OCR host-agent review of B01–B03 and the SDK refresh, reproduced defects, corrections and validation before B04

[Setup execution history](research/repository-setup/repository_setup_progress_2026-11-02.md) and [native host history](research/repository-setup/native_host_setup_2026-11-02.md) preserve archived attempts and detailed qualification. Current status stays in the implementation documents.

DESIGN.md governs new design planning; product requirements and current technical plans govern functional implementation. Historical visual prescriptions in research and archived records are not design inputs. Dated research preserves supporting evidence and earlier alternatives; superseded recommendations are marked in those files.
