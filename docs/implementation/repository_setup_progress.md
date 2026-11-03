# Repository setup progress

Date: 3 November 2026. All seven foundation implementation and local acceptance gates passed for the agreed Windows Android emulator, iPhone simulator, and physical iPad scope. Physical iPhone checks were explicitly deferred by the user. Product capabilities and release qualification remain later work under the [mobile plan](mobile_development_plan.md#6-verification-and-release-boundary).

## Current checkpoint

| Work | Accepted result |
|---|---|
| Toolchain and shared exports (steps 1?2) | Frozen install, exact workspace/compiler split, generated contracts, strict declarations, and dependency boundaries passed. |
| Composed application/data/worker (steps 3?4) | Development and final-image HTTP/SSR/hydration, migration gates, database readiness recovery, durable queued work, authenticated persistent storage, and SMTP passed. |
| Windows Android (step 5) | APK/lint and emulator API/style/Fast Refresh/relaunch/orientation/larger-text gates passed. |
| Mac iOS (step 6) | Locked Pods, simulator build/UI/API/refresh/layout, and signed physical iPad build/install/API acceptance passed. Visible iPad behavior was confirmed by the user. |
| Verification and CI (step 7) | Full local `pnpm verify` passed, including all 30 tests. Source `58d258c` and merged `main` at `6057607` passed hosted CI. Later PR heads require their own checks. |
| T3 iOS control | Revalidated in this handoff: discovery, open, supported XCTest snapshot, input/refetch, and screenshot passed on the iPhone simulator. The owned session was closed. The physical iPad was not listed by this tool configuration. |
| Combined host capacity | Current stack + Android emulator + Windows Metro + containerized `pnpm check` measured successfully; all six services remained healthy. Scope and sampled limits are below. |

## Publication and source handoff

The foundation merged in [PR #1](https://github.com/nishanthturnstile/Kairn/pull/1) at source `58d258c036db6f0428bdced710259798630566ad`. Merged `main` at `605760723ab4c91e2bd7b2d059dd6b67d0b14b39` passed [CI run 41474006988](https://github.com/nishanthturnstile/Kairn/actions/runs/41474006988). The final GitHub Actions status is required on `main`, with strict up-to-date checks and administrator enforcement.

Two documentation commits were pushed to the old review branch after that PR merged; they were not part of the merge and never triggered PR CI. This follow-up starts from merged `main`, carries those records forward, and reconciles all active plans. Its publication uses a new PR and its own check results. A local commit or push is not evidence that an already-merged PR ran again.

Subsequent handoff: setup PR #2 merged at main 7db6595. The authorized [checkout reconciliation](checkout_reconciliation_progress.md) fast-forwarded the old development branch without losing unique commits and established the [development/main and multi-host workflow](checkout_workflow.md). That workflow now governs new feature branches; the main-based setup publication above is historical provenance.

Use Git to synchronize the reviewed branch and commit across the three owning-OS checkouts. Preserve ignored host tools, dependencies, native output, environment files, and user signing settings. The earlier source snapshot is historical transfer evidence, not the current synchronization mechanism.

## Qualified compatibility decisions

- Keep the selected TypeScript split: TS7 for web/shared tooling and TS6 for mobile/API generation; preserve the SDK-matched React exception and exact dependency pins in [architecture section 14](../core/architecture.md#14-canonical-stack-and-dependency-register).
- Vite+ owns supported formatting/lint/tests. Metro/native tooling stays platform-local. No second monorepo task or formatting stack was added.
- The seven qualified patches under `patches/` correct upstream declarations, without changing their runtime JavaScript. Preserve hash-sensitive patch bytes and requalify them on upgrades. Detailed rationale is in the [historical qualification record](../research/repository-setup/repository_setup_progress_2026-11-02.md#step-2-declaration-compatibility-patches).
- Native generation uses the pinned template and an owned iOS Pod lock. Windows uses its short local dependency layout and space-free SDK alias; Mac builds are serial with two Xcode jobs. [Current host instructions](native_host_setup.md) retain the necessary path/tool guards.

## Step 2 verification

Actual project-schema generation, byte-for-byte OpenAPI drift checks, compiled public exports, TS6/TS7 consumers, browser/native boundaries, and deliberate type-failure gates passed. The [original step 2 results](../research/repository-setup/repository_setup_progress_2026-11-02.md#step-2-verification) preserve the exact qualification and patch details. These are completed checks, not pending scaffolding.

## Hosted CI and iPad signing checkpoint

The existing arm64 build initially failed while signing a framework from a locked SSH keychain. In the user-selected Mac-local Karthi context the keychain was unlocked; a coordinated codesign probe succeeded in 11.8 seconds after the user approved its active key-access prompt. The incremental build then passed without clean generation, a Pod update, or certificate replacement. Deep/strict signature, `dev.kairn.app`, arm64, an unexpired device-containing profile, and bounded installation passed. The profile expires November 9, 2026. Credentials stayed in native signing flows.

The user explicitly authorized native SSH launch/logs after the earlier T3 failure. Device-side Developer App trust resolved the initial launch refusal; Developer Mode and app/profile entitlements were confirmed. The fully qualified HTTP Metro route did not load JavaScript under the compiled ATS settings. Private HTTPS Serve on Mac port 8081 now forwards to loopback Metro, preserving normal TLS verification, correct HTTPS bundle URLs, other Serve endpoints, and the existing packager. No ATS exception or custom CA was added.

An iPad-only temporary query diagnostic recorded HTTP 200 and schema-validated contract 1 / sync protocol 1 / status `ok` from the unchanged private Windows API. The user confirmed manual refetch, compact spacing, readable landscape, and portrait restoration. Those visible UI checks are operator reports, not agent screenshots or an independently attributed manual-request log.

The diagnostic was restored in `finally` to the exact accepted bytes. Layout, screen, and query hashes match the original source. Native launch then exited 0 in a new process (`887` ? `889`), and the user confirmed automatic Connected without pressing Check again. Bounded console capture timeouts are separate from this successful final non-console launch and API evidence.

Evidence: ignored `.kairn/verification/ios-2026-11-02/` on Mac and the copied small Windows records contain `ipad-signed-artifact-audit.json`, `ipad-api-validated-events.json`, `ipad-api-probe-session.json`, `ipad-final-pristine-runtime.json`, and `ipad-runtime-acceptance.json`. Earlier Android and iPhone-simulator Fast Refresh/larger-text evidence remains accepted.

## T3 control revalidation

The configured `mac-ios` host reported ready with hub `0.19.1` and agent `0.21.31`. A fresh device-bound session opened Kairn on the existing iPhone simulator, inspected Connected / Contract 1 / Sync protocol 1, pressed Check service connection, and captured the settled Connected screen. The AX bridge was circuit-disabled; T3's supported XCTest fallback succeeded. Only this owned session was closed; no simulator shutdown, host restart, dependency install, or settings change was needed.

The physical iPad is not exposed in this configuration's device list. Its accepted native/log and user-observed results remain separate from simulator automation. Current session evidence is in ignored `.kairn/verification/handoff-device-recovery.json` and `handoff-device-snapshot.txt`. Earlier device-discovery failures are preserved only as history.

## Combined host resource verification

The Windows inventory is 31.4 GiB usable RAM, Ryzen 7 7730U (8 cores/16 threads), a present hypervisor, Radeon graphics, and an NVMe system disk. Existing WSL limits remain 20 GB RAM, 12 processors, and 4 GB swap; Compose memory/CPU/PID limits were retained. No global host configuration was changed.

The first capacity trial reused an old cached tooling image that lacked the current mobile source and was discarded. The corrected workflow uses `docker compose --profile tools run --build --rm --no-deps tooling`, asserts the actual three accepted mobile source hashes inside the image, then runs `pnpm check`. Direct tooling command examples now include `--build` so a current host checkout cannot silently validate an older image.

The rebuilt-source run initially failed one Expo Doctor schema check on `ENOTFOUND exp.host`. Independent WSL/container probes then resolved the host successfully; one retry passed the complete check, including 20/20 Expo Doctor checks. The first failure is retained rather than reported as a pass. No DNS, dependency, or runtime configuration was changed.

The six-service development stack, Windows Android emulator, and Metro remained running. Sampling covered 2026-11-02T18:20:48.6755074Z through 2026-11-02T18:30:40.5714030Z: 100 observations, including 26 within the exact successful 158.48-second retry. The profile also includes the preceding current-image build/check. All six original services remained healthy, with zero restarts and no recorded OOM kills.

| Observed measure | Result |
|---|---|
| Minimum Windows available RAM during the successful check | 3547 MiB |
| Minimum Windows available RAM across all current-image samples | 3478 MiB |
| Maximum sampled WSL used memory during the successful check | 9.13 GiB |
| Maximum sampled tooling memory during the successful check | 769.7 MiB of its 3GiB limit |
| Maximum sampled tooling CPU | 208.45% (Docker reports per-core CPU) |
| Maximum observed WSL swap used | 1.65 GiB |

This qualifies the observed current workload, not worst-case stress, native release builds, media conversion, backup jobs, or larger concurrency. [Docker CLI memory](https://docs.docker.com/reference/cli/docker/container/stats/) excludes inactive-file cache; whole-host Windows measurements include other running software. Active-window results use actual command timestamps rather than phase labels. Reprofile when heavier capabilities are introduced.

Ignored `.kairn/verification/handoff-capacity-current/` retains raw `samples.jsonl`, `summary.json`, actual-input/command records, the successful check log, first-failure logs, and post-check service state. The earlier `.kairn/verification/handoff-capacity/` trial is explicitly invalidated. Coverage was this real combined boundary plus supported device-tool recovery; no mock/config tests or duplicate full native suite was added.

## Deferred and ongoing work

| Item | Timing |
|---|---|
| Physical iPhone | Explicitly deferred until the user makes it available; the iPhone simulator covers the current agreed scope. |
| Personal Team renewal | Refresh, rebuild/reinstall, and repeat launch/API checks when the current profile expires November 9, 2026. |
| Product and release work | Capture/import, permissions, durable SQLite/offline sync, auth, maps, sharing, release-mode/store tests, permanent identities, and deployment/backup decisions follow the governing product sequence. They were not implemented by foundation setup. |

## Historical evidence

Superseded troubleshooting and full execution detail are archived in [repository setup history](../research/repository-setup/repository_setup_progress_2026-11-02.md) and [native host history](../research/repository-setup/native_host_setup_2026-11-02.md). The active host guide contains current operating instructions; do not treat historical failures or uncommitted-transfer notes as present blockers.
