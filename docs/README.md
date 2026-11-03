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

## Implementation plans

- [Repository setup](implementation/repository_setup_plan.md) — completed foundation interface, acceptance gates, and constraints on later changes
- [Repository setup progress](implementation/repository_setup_progress.md) — implemented batches, compatibility decisions, and executed checks
- [Local mobile development](implementation/mobile_development_plan.md) — hosts, testing, and distribution constraints
- [Native host setup](implementation/native_host_setup.md) — current Windows/Mac commands, Metro/API routes, signing renewal, and device workflow
- [Branch and checkout workflow](implementation/checkout_workflow.md) — development/main promotion, authoring-host choice, protected checkpoint synchronization and recovery
- [Checkout reconciliation record](implementation/checkout_reconciliation_progress.md) — preserved pending files, branch-history backups and initial host alignment
- [Development skills](implementation/development_skills.md) — installed project skills, source provenance, and how to apply them to Kairn
- [Accounts, journeys and access implementation](implementation/accounts_journeys_access_plan.md) — plan 1.2: modules, data/migrations, APIs, permissions, delivery order, and acceptance gates
- [Accounts/journeys implementation progress](implementation/accounts_journeys_access_progress.md) — verified starting checkpoint, B01 contracts/web specimens, B02 identity database slice, executed checks and remaining batches
- [Identity database foundation](implementation/identity_database.md) — B02 identity roles/policy graph, migrations, existing-volume upgrade and pool budget
- [Accounts and journey experience handoff](implementation/accounts_journeys_access_design.md) — consumer workflows, screen/route inventory, components, responsive behavior, and UI/UX acceptance
- [Selected account/journey decisions](implementation/accounts_journeys_access_decisions.md) — chosen authority/lifecycle policy, field limits, expiry, retention targets, asset inputs, and external activation gates
- [How account/journey implementation starts](implementation/accounts_journeys_access_start.md) — first coding batch, visible checkpoints, user/developer responsibilities, existing checks, and current branch dependency

## Research

- [Architecture research](research/architecture/) — stack, maps, providers, and the [map cost comparison](research/architecture/map_cost_comparison.md)
- [Repository setup research](research/repository-setup/) — toolchain, native builds, Compose, compatibility probes, and host observations
- [Accounts and journey-access research](research/accounts-journey-access/analysis_2026-11-03.md) — current-code gaps, functional analysis, version-matched integration findings, and design/accessibility research for the next milestone
- [Independent plan review](research/accounts-journey-access/review_2026-11-03.md) — OpenCode/DeepSeek V4.1 Flash findings, parent assessment, plan corrections, and remaining activation/verification gates

[Setup execution history](research/repository-setup/repository_setup_progress_2026-11-02.md) and [native host history](research/repository-setup/native_host_setup_2026-11-02.md) preserve archived attempts and detailed qualification. Current status stays in the implementation documents.

The current core documents and implementation plans govern the build. Dated research preserves supporting evidence and earlier alternatives; superseded recommendations are marked in those files.
