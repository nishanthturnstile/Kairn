# Repository setup research plan

Date: 1 November 2026.

Question: How should Kairn establish the repository foundation for web, Android, server, worker, and shared packages, with reproducible build and check commands, while preserving architecture version 1.4?

This work produces research and an implementation plan. It does not scaffold applications, install dependencies, provision infrastructure, or implement product features.

## Research tracks

1. Workspace and web toolchain. Verify Vite+ and pnpm installation, task ordering, caching, Node builds, public React rendering, static checks, and compatibility overrides. Compare source packages with compiled packages and choose explicit runtime boundaries.
2. Android and native isolation. Verify the adopted Expo SDK/template, pnpm isolation, React and TypeScript separation, native dependency checks, reproducible Android builds, local prerequisites, and CI requirements.
3. Foundation integration and acceptance. Inspect the existing product documents and environment. Define package ownership, build artifacts, environment boundaries, contract generation, worker startup semantics, and executable acceptance gates. Reconcile research findings and unresolved questions.

Each delegated track uses three to five targeted searches, prioritizes maintainer documentation and shipped package metadata, and saves findings with source URLs and limitations. Existing architecture section 14 owns selected versions. Registry rechecks establish availability, not successful integration.

## Synthesis

Write a research report distinguishing confirmed baseline decisions, verified tool behavior, recommendations, and untested compatibility. Write the implementation sequence in the existing docs directory, with concrete files, root commands, expected outputs, acceptance checks, issues, and decisions that can be deferred. Validate local links and consistency with the governing documents before delivery.

## Follow-up on compiler compatibility and development hosts

The user requests a real TypeScript 6 compatibility check for OpenAPI generation, Docker Compose for all runtime services, and an assessment of Windows Android development while the repository and application services run on the Mac over Tailscale.

1. Execute the pinned OpenAPI generator with the adopted TypeScript 6 release in an isolated temporary project. Compare a TypeScript 5 control and TypeScript 7 failure case where practical. Check generated declarations with the selected compilers. Distinguish functional compatibility from the generator's declared peer range.
2. Research container service ownership, development/production Compose differences, health/migration ordering, persistent volumes, build isolation, and optional media/mail/operations profiles. Specify one-command orchestration without containerizing the Android emulator.
3. Research Windows-native Android tooling, emulator hardware requirements, Metro/source ownership, Tailscale API connectivity, and device-host access. Inspect available host information without claiming the Windows machine has been inspected when remote access is unavailable.

Save follow-up findings and executable compatibility evidence, then revise the existing plan. Use only temporary dependency installations for compatibility research. Do not scaffold the application or install Android/Docker prerequisites on either machine in this planning task.
