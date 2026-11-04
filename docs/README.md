# Documentation

Start with the product plan and requirements. Use the implementation plans for the next engineering work.

| Folder | Contents |
|---|---|
| [core/](core/) | Current product, requirements, architecture, and design references |
| [implementation/](implementation/) | Foundation, host workflow, and product implementation plans |
| [research/](research/) | Supporting findings, research plans, cost comparisons, probes, and recorded evidence, grouped by topic |

## Core documents

- [Product plan and vision](core/product_plan.md)
- [Product requirements](core/product_requirements.md)
- [Architecture and stack](core/architecture.md)
- [Application design](core/application_design.md)
- [Open atlas component guide and coverage ledger](implementation/design_system_catalog.md)

## Implementation plans

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
- [Web and mobile experience prototype](implementation/prototype_plan.md) — connected sample workflows, screen coverage, branch isolation, delivery batches, verification and production handoff before the next product coding batch
- [Accounts and journey experience handoff](implementation/accounts_journeys_access_design.md) — consumer workflows, screen/route inventory, components, responsive behavior, and UI/UX acceptance
- [Selected account/journey decisions](implementation/accounts_journeys_access_decisions.md) — chosen authority/lifecycle policy, field limits, expiry, retention targets, asset inputs, and external activation gates
- [How account/journey implementation starts](implementation/accounts_journeys_access_start.md) — first coding batch, visible checkpoints, user/developer responsibilities, existing checks, and current branch dependency

- [Prototype progress](implementation/prototype_progress.md) — P00–P02 implementation, executed checks, visual checkpoint and platform gaps

- [Design system and product experience redesign plan](implementation/design_system_redesign_plan.md): remaining component inventory, web/native consistency, DS01-DS12 delivery, screen migration and acceptance gates.
- [Experience redesign audit and progress](implementation/experience_redesign.md): Open atlas direction, implemented checkpoint, executed evidence and outstanding production gates.

## Research

- [Architecture research](research/architecture/) — stack, maps, providers, and the [map cost comparison](research/architecture/map_cost_comparison.md)
- [Repository setup research](research/repository-setup/) — toolchain, native builds, Compose, compatibility probes, and host observations
- [Accounts and journey-access research](research/accounts-journey-access/analysis_2026-11-03.md) — current-code gaps, functional analysis, version-matched integration findings, and design/accessibility research for the next milestone
- [Independent plan review](research/accounts-journey-access/review_2026-11-03.md) — OpenCode/DeepSeek V4.1 Flash findings, parent assessment, plan corrections, and remaining activation/verification gates
- [Implementation review](research/accounts-journey-access/implementation_review_2026-11-04.md) — OCR host-agent review of B01–B03 and the SDK refresh, reproduced defects, corrections and validation before B04
- [Prototype plan review](research/prototype/review_2026-11-03.md) — independent model findings, Codex dispositions, final OpenCode Go Argon 4 review and planning verification

[Setup execution history](research/repository-setup/repository_setup_progress_2026-11-02.md) and [native host history](research/repository-setup/native_host_setup_2026-11-02.md) preserve archived attempts and detailed qualification. Current status stays in the implementation documents.

The current core documents and implementation plans govern the build. Dated research preserves supporting evidence and earlier alternatives; superseded recommendations are marked in those files.
