---
name: kairn-architecture
description: Apply Kairn's selected stack, package boundaries, mobile styling, host workflow, and verification gates when scaffolding or changing its application architecture or development tooling.
---

# Kairn architecture and verification

Read [architecture](../../../docs/core/architecture.md), especially sections 5, 7, 14, and 16, and the [repository setup plan](../../../docs/implementation/repository_setup_plan.md) for the affected boundary. [Requirements](../../../docs/core/product_requirements.md) govern functional scope. Use dated research as evidence, not a second dependency list.

- Keep the TypeScript modular monolith: distinct HTTP and worker processes, PostgreSQL authority, pg-boss transactional jobs, and private SeaweedFS behind an S3 adapter and authenticated gateway.
- Web uses Vite+, React, TanStack, and Tailwind/shadcn. Mobile uses Expo Router, React Native, and Unistyles v3/Nitro. Share plain tokens and pure logic; keep native theme configuration and styles in mobile. NativeWind is excluded.
- Mobile's custom entry initializes Unistyles before `expo-router/entry`. Keep routes in `src/app` and components/screens under `src` covered by the Babel plugin. Native builds are required from foundation; Expo Go cannot verify Unistyles. Consult the installed `react-native-unistyles-v3` skill for version-matched API details.
- Preserve server-only/client boundaries and compiled universal exports. Keep the documented per-workspace React/TypeScript exceptions and the isolated API generator compiler. Do not unify versions to satisfy a generic skill.
- Version `/api/v1` wire contracts; generate clients from Zod/OpenAPI, not database rows or server process imports. Retain old-client fixtures for mobile release skew.
- Use Vite+ config/test APIs and its bundled tools. Metro/native toolchains remain separate. Account for package build prerequisites on a clean checkout.
- Follow the [mobile plan](../../../docs/implementation/mobile_development_plan.md) for WSL Compose, Windows Android, Mac iOS, free provisioning, and local Metro. Reuse prior host compatibility evidence unless a concrete failure requires rechecking it.

Select checks that prove the changed boundary: real contract generation, forbidden imports, packaged production delivery, request isolation, persisted worker jobs, native dependency resolution/builds, or device behavior. Compilation alone cannot establish capture, permission, style-runtime, or recovery correctness. Record actual results and missing evidence without turning a plan into a passing integration claim.
