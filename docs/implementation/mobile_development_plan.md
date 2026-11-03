# Local mobile development and distribution plan

Date: 3 November 2026. Status: foundation implementation and local acceptance passed for Windows Android, the iPhone simulator, and the connected physical iPad. The user deferred the unavailable physical iPhone. [Repository setup progress](repository_setup_progress.md#current-checkpoint) records executed checks and the remaining operational follow-up; [native host setup](native_host_setup.md) records the configured workflow.

The [product requirements](../core/product_requirements.md#12-platform-and-capability-baseline) own functional scope. [Architecture section 14](../core/architecture.md#14-canonical-stack-and-dependency-register) owns dependencies and versions. This document owns local host allocation, mobile verification, and the boundary between development and store distribution. The [repository setup plan](repository_setup_plan.md) implements the foundation commands and acceptance gates.

## 1. Confirmed policy

Develop web, Android, and iOS during the current build. Implement the agreed native capture, import, durable storage, sync, and focused editing flows on Android and iOS, with platform-specific adapters and tests. Android remains the first public mobile distribution target. iOS implementation and local verification are required now; iOS public distribution waits for prospective client/customer interest and an explicit decision to enroll with Apple.

Use Expo/React Native with **Unistyles v3** for mobile styling and locally compiled development builds. NativeWind is excluded. Do not make EAS Build, EAS Update, paid cloud simulators, or an Expo subscription a prerequisite. Use Expo CLI with the native SDKs directly rather than adding EAS CLI/account setup to the local path. Unistyles/Nitro Modules and Mapbox's native bridge require development/native builds and cannot run in Expo Go; this requirement applies from the styled mobile foundation. [Expo local builds](https://docs.expo.dev/guides/local-app-development/), [Unistyles prerequisites](https://www.unistyl.es/v3/start/getting-started/), [Mapbox bridge installation](https://rnmapbox.github.io/docs/install).

Use the Unistyles/Nitro pins in architecture section 14 with New Architecture enabled. The published Unistyles floors are React Native 0.81+, React 19+, Expo SDK 54+, and Xcode 16.4+ for Nitro; use higher requirements imposed by the adopted SDK. These floors do not establish that the complete app already builds. Register the native theme from shared token values before Expo Router loads, and use the supported Babel plugin over `src/app`, screens, and components. Keep Tailwind/shadcn on web. The setup plan specifies entry order, plugin scope, and checks. Agent skills for mobile UI, Unistyles, native modules, upgrades, maps, and later workstreams are already installed; see the [skills inventory](development_skills.md).

| Item | Development now | Distribution later |
|---|---|---|
| Android | Local APK builds, emulator and device checks without Play membership | Play registration is an accepted later expense; verify current pricing and testing rules before enrollment |
| iOS/iPadOS | Simulator builds and Personal Team installation on the user's devices without paid membership | Defer paid Apple enrollment until the explicit distribution decision; verify current fees and entitlements then |
| Expo | Expo CLI, SDK modules, and local development builds | EAS remains optional; store submission can also use native tools |

These are store/build-service costs, not a zero-cost promise for hosting, maps, AI, or other providers. [Google registration](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en), [Apple enrollment](https://developer.apple.com/programs/enroll/).

The [SDK 58 patch refresh](expo_sdk_refresh_progress.md) records the later dependency update, full online verification and affected native compilation. Earlier simulator/iPad interaction evidence remains tied to its original source and installed binaries; refreshed native builds do not by themselves claim new device/UI acceptance.

## 2. Host allocation and memory

| Host | Responsibilities |
|---|---|
| Windows/WSL, 32 GB physical RAM | WSL checkout, Docker Compose application/data services, containerized tooling, web/backend development, and shared checks |
| Windows native | Separate local checkout, Node/pnpm, Android Studio, JDK, SDK/NDK, Gradle, emulator, and Android Metro |
| 2019 Intel MacBook Pro, 16 GB RAM | Separate local checkout, Node/pnpm, Xcode toolchain, CocoaPods, iOS builds, and iOS Metro; simulator when needed |
| User's iPad; iPhone when available | iPad foundation acceptance passed; physical iPhone checks are deferred. Future product work requires physical-device capture, permissions, media, networking, recovery, and performance checks. |

The Mac's native builds and agreed local acceptance have passed, and its selected Xcode, macOS, SDK, and device versions are recorded in [host setup](native_host_setup.md#mac). Revisit compatibility only if a build/runtime failure or a toolchain change requires it.

Keep application containers on Windows/WSL. Prefer physical-device runs, keep at most one simulator running when needed, and perform native builds serially on the Mac. Initial signing/pairing may require Xcode's UI; routine builds can use CLI tools without keeping its editor open. Keep the Mac powered, reachable, and awake during remote work. T3 control still consumes host resources, and compilation still runs on the Mac; remote control does not transfer iOS build work to WSL.

The Windows inventory records 31.4 GiB usable RAM, a Ryzen 7 7730U with 8 cores/16 threads, a present hypervisor, Radeon graphics, and NVMe storage. WSL is capped at 20 GB RAM, 12 processors, and 4 GB swap; Compose services have memory, CPU, and PID limits. Keep those bounds and later media-processing concurrency within the host's capacity so the Windows-native emulator retains headroom. The [progress record](repository_setup_progress.md#current-checkpoint) owns combined-workload measurements and their limits; repeat them when the workload changes. Do not treat 32 GB as a per-environment allocation or run a second development container stack on the Mac by default. The production target remains the existing VPS.

## 3. Source ownership and networking

Use separate per-OS installs, caches, generated native directories, and build outputs. Keep the WSL checkout in its Linux filesystem and Windows native builds in a Windows-local checkout. Never share `node_modules`, Pods, generated `android/` or `ios/`, or Gradle caches across hosts. Commit app configuration, config plugins, owned native modules, and the single pnpm dependency lockfile. Preserve the reviewed iOS Podfile.lock snapshot outside ignored `ios/` as specified in the setup plan; restore and enforce it after native generation. Native generation must use the pinned inputs from that plan.

Use Git to move reviewed changes between checkouts. The remote is `https://github.com/nishanthturnstile/Kairn.git`; synchronize the reviewed branch and commit recorded in the current handoff. Edit mobile code in the checkout serving that platform's Metro; unsaved WSL edits do not appear automatically in Windows or Mac Metro. Changes to contracts and native inputs must reach each host at the same reviewed commit before acceptance. Preserve local changes and ignored signing settings when updating a checkout. See [host paths and commands](native_host_setup.md).

The private development API is `https://nishanth-windows.tail30fb6a.ts.net:8443`, with Windows Tailscale Serve forwarding to the WSL application ingress on port 8080. Normal-TLS requests passed from both hosts, the Android emulator, the iPhone simulator, and the iPad. Physical iPhone verification remains deferred. Preserve this route and recheck forwarding, DNS, TLS, firewall, and actual app requests when it changes or a new device joins. Phones need their own tailnet route or another deliberately configured route. `localhost` refers to the client device; Android emulator `10.0.2.2` reaches Windows, not automatically a WSL container. Container service names are internal.

Keep Metro local to each native build host. Android uses Windows Metro at `http://10.0.2.2:8081`, and the iPhone simulator uses Mac loopback. The iPad uses the verified private HTTPS Mac route `https://nishanths-macbook-pro.tail30fb6a.ts.net:8081`, which forwards to the existing loopback Metro. Verify bundles, assets, WebSockets, and Fast Refresh when a device route changes. Tailscale supplies connectivity; it does not synchronize files or grant native device-control access. [Configured routes](native_host_setup.md#metro-and-private-api), [Tailscale Serve](https://tailscale.com/docs/reference/tailscale-cli/serve).

## 4. Local builds and free Apple signing

SDK-compatible `expo-dev-client` is installed and frozen in the lockfile. Generate native projects from the committed pinned configuration. Platform wrappers use Expo CLI/native tools with shared-package prerequisites already built. Android build/lint, locked iOS simulator builds, and the signed iPad build/install have passed; [host setup](native_host_setup.md) records the commands and separate runtime evidence.

After a development build is installed, use Metro with the development client for ordinary JavaScript/TypeScript changes. Rebuild when native modules, native configuration, or generation inputs change. Keep release-mode checks in the platform verification work; JavaScript export alone is not a native build. [Expo development builds](https://docs.expo.dev/guides/local-app-development/).

For physical iPhone/iPad runs, sign into Xcode locally with the user's free Apple Account, select Personal Team, pair/trust the devices, and enable Developer Mode as required. Account credentials remain in the native account/signing flow.

Free provisioning expires after seven days, requiring rebuild/reinstallation; the accepted iPad profile expires November 9, 2026. Follow the [host recovery procedure](native_host_setup.md#metro-and-private-api) to renew, rebuild, reinstall, and repeat launch/API checks. Check current Personal Team device/app quotas before adding devices or capabilities. Simulator builds avoid device provisioning expiry. Keep repeatable seed data and recovery checks as durable capture is implemented; do not assume reinstalling preserves unsynced captures. [Apple Personal Team limits](https://developer.apple.com/help/account/basics/about-your-developer-account).

App Store and TestFlight distribution, distribution signing, and capabilities requiring paid entitlements remain outside the free verification claim. Prepare code, configuration, icons, permission descriptions, privacy information, and test evidence with their product and release workstreams. After enrollment, perform final signing, distribution-build/TestFlight checks, metadata submission, and review. Local readiness is not completed store approval.

## 5. T3 native device integration

T3 exposes `device_list`, `device_open`, and device screenshot tools. Opening a configured device provides a device-pinned `agent-device` command for UI inspection and interactions. The agent can inspect accessibility state, exercise flows, and collect evidence. `agent-device` operates the installed app; it is not an application module or an EAS dependency. [Expo agent-device guide](https://docs.expo.dev/agents/agent-device/).

**Device support** and **Agent device access** are enabled. Windows T3 has working local Android control and the configured **Mac iOS** SSH device host. Android and iPhone-simulator UI/API acceptance passed on 2 November 2026. Mac iOS simulator discovery, open, supported inspection, input, and screenshot were revalidated in this handoff. The physical iPad is not listed by this tool configuration; its accepted native/log and user-observed evidence stays separate. [Setup progress](repository_setup_progress.md#t3-control-revalidation) records the current result.

Use a Windows-environment thread for its local emulator. Device tools act in their calling thread's environment; selecting another desktop project or linking environments does not move a device into that thread. Linked environments provide access to the existing WSL and Mac environments, while the configured Mac device host provides the simulator route. Keep each OS's dependency installation, Metro process, and native output local.

For each new acceptance session, call `device_list`, then `device_open` with the exact host/device identifiers, and use its returned command for app launch, deep links, input, alerts, settings, screenshots, and recordings. Follow a failed tool's recovery advice once and report a persistent failure. Let T3 own integration startup and recovery; do not reuse or close another session. Historical discovery, DNS, and Xcode failures remain in archived execution records rather than the current instructions.

Personal Team provisioning and physical-device acceptance are recorded separately from simulator evidence. Confirm physical-device support for the actual host/tool configuration before relying on automation; the user can also perform hardware checks locally through Xcode. An unavailable platform is reported without a shell UI bypass. For the completed iPad check, the user explicitly authorized native SSH launch/logs after T3 discovery failed; visible hardware behavior was confirmed by the user.

Current hardware scope, 2 November 2026: the iPhone simulator and connected iPad have passed the agreed foundation checks; the user deferred the unavailable physical iPhone. The iPad's signed arm64 build, strict signature/profile checks, installation, native launch, and schema-validated real HTTPS status passed. The user confirmed manual refetch, spacing/rotation, and automatic Connected after an original-source process relaunch. These visible iPad observations are user reports, without agent screenshots. No further iPad foundation acceptance gate remains.

Use the built-in integration first for subsequent agent-driven native interaction; do not install a competing automation stack or use paid hosted devices as a workaround.

## 6. Verification and release boundary

The completed foundation gates cover Android and iOS simulator build/launch, actual typed API status requests, Fast Refresh, and Personal Team installation/status checks on the available iPad. Physical iPhone checks were explicitly deferred. The Unistyles checks cover theme initialization, resizing/orientation, larger text, safe areas, and styles after Fast Refresh and full relaunch, with the platform-specific evidence described in setup progress. Repeat affected checks when their inputs change, running devices sequentially if necessary. Keep evidence tied to the checked commit; compilation and screenshots alone do not prove product behavior.

As features are implemented, verify capture, selected-media import, permissions including denial/revocation, app-owned file/SQLite persistence, offline restart/recovery, idempotent upload retries, authentication, maps, and sharing on both native platforms. Use the iPhone/iPad for hardware behavior and actual performance; simulators cannot establish camera, energy, or full background-scheduling behavior. Test HEIC/HEIF inputs and declare conversion support only after the worker path passes. UI automation complements these checks. [Apple device testing](https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices).

Keep the Quality and Android GitHub Actions jobs and their always-run final required status. Quality exports both Android and iOS JavaScript. Required iOS native build and runtime evidence comes from the local Mac at the reviewed commit; do not make paid macOS CI or EAS a prerequisite. Verify iOS when shared/mobile dependencies, config, or relevant code change and before release readiness. Document those results with the review; a green Linux job is not iOS native evidence.

The complete agreed product and local iOS verification remain required as features are implemented. The current physical iPhone deferral does not waive later hardware qualification. iOS public distribution and paid-entitlement checks await the later enrollment decision; Web/Android launch does not require Apple enrollment. Before Play production access, verify the current closed-testing and production-access requirements for the chosen account type. Plan that work before the intended Android launch rather than treating a dated tester count or duration as a permanent rule. [Google testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

## 7. Foundation handoff and subsequent work

The workspace/compiler split, shared exports, generated status contract, Compose services, private ingress, native wrappers, styled mobile shells, Git remote, required CI, and agreed local device acceptance are complete. [Setup progress](repository_setup_progress.md#current-checkpoint) owns final housekeeping and tooling follow-up; those records do not reopen passed foundation gates.

Continue the [product delivery sequence](../core/product_requirements.md#182-dependency-aware-implementation-sequence), retaining this host workflow and verification policy. Accounts, capabilities/grants, native capture/import, durable files/SQLite, offline recovery, synchronization, maps, sharing, and the remaining product flows are future implementation work. Physical iPhone evidence is still required for the hardware behavior introduced by those workstreams. Confirm permanent application identifiers, scheme, and domain before distribution or production authentication links; local development currently uses `dev.kairn.app` and `kairn-dev`.
