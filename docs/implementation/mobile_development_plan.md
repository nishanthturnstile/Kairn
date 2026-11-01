# Local mobile development and distribution plan

Date: 1 November 2026. Status: confirmed development and spending constraints, ready for repository implementation. No application has been scaffolded or tested by this plan.

The [product requirements](../core/product_requirements.md#12-platform-and-capability-baseline) own functional scope. [Architecture section 14](../core/architecture.md#14-canonical-stack-and-dependency-register) owns dependencies and versions. This document owns local host allocation, mobile verification, and the boundary between development and store distribution. The [repository setup plan](repository_setup_plan.md) implements the foundation commands and acceptance gates.

## 1. Confirmed policy

Develop web, Android, and iOS during the current build. Implement the agreed native capture, import, durable storage, sync, and focused editing flows on Android and iOS, with platform-specific adapters and tests. Android remains the first public mobile distribution target. iOS implementation and local verification are required now; iOS public distribution waits for prospective client/customer interest and an explicit decision to enroll with Apple.

Use Expo/React Native with **Unistyles v3** for mobile styling and locally compiled development builds. NativeWind is excluded. Do not make EAS Build, EAS Update, paid cloud simulators, or an Expo subscription a prerequisite. Use Expo CLI with the native SDKs directly rather than adding EAS CLI/account setup to the local path. Unistyles/Nitro Modules and Mapbox's native bridge require development/native builds and cannot run in Expo Go; this requirement applies from the styled mobile foundation. [Expo local builds](https://docs.expo.dev/guides/local-app-development/), [Unistyles prerequisites](https://www.unistyl.es/v3/start/getting-started/), [Mapbox bridge installation](https://rnmapbox.github.io/docs/install).

Use the Unistyles/Nitro pins in architecture section 14 with New Architecture enabled. The published Unistyles floors are React Native 0.81+, React 19+, Expo SDK 54+, and Xcode 16.4+ for Nitro; use higher requirements imposed by the adopted SDK. These floors do not establish that the complete app already builds. Register the native theme from shared token values before Expo Router loads, and use the supported Babel plugin over `src/app`, screens, and components. Keep Tailwind/shadcn on web. The setup plan specifies entry order, plugin scope, and checks. Agent skills for mobile UI, Unistyles, native modules, upgrades, maps, and later workstreams are already installed; see the [skills inventory](development_skills.md).

| Item | Development now | Distribution later |
|---|---|---|
| Android | Local APK builds, emulator and device checks without Play membership | Play Console registration is US$25 once, not monthly; the user accepts this expense when needed |
| iOS/iPadOS | Simulator builds and Personal Team installation on the user's devices without paid membership | Apple Developer Program is US$99 per membership year, subject to regional pricing; defer enrollment and payment |
| Expo | Expo CLI, SDK modules, and local development builds | EAS remains optional; store submission can also use native tools |

These are store/build-service costs, not a zero-cost promise for hosting, maps, AI, or other providers. [Google registration](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en), [Apple enrollment](https://developer.apple.com/programs/enroll/).

## 2. Host allocation and memory

| Host | Responsibilities |
|---|---|
| Windows/WSL, 32 GB physical RAM | WSL checkout, Docker Compose application/data services, containerized tooling, web/backend development, and shared checks |
| Windows native | Separate local checkout, Node/pnpm, Android Studio, JDK, SDK/NDK, Gradle, emulator, and Android Metro |
| 2019 Intel MacBook Pro, 16 GB RAM | Separate local checkout, Node/pnpm, Xcode toolchain, CocoaPods, iOS builds, and iOS Metro; simulator when needed |
| User's iPhone and iPad | Physical-device capture, permissions, media, networking, recovery, and performance checks |

The user confirms that Mac compatibility was checked previously. Accept that result; do not make another model/OS compatibility questionnaire a prerequisite. Record the selected Xcode, macOS, SDK, and device versions during the first actual build for reproducibility. Revisit compatibility only if a build/runtime failure or a toolchain change requires it. That prior check does not claim Kairn itself has already built.

Move the planned application containers off the Mac. Prefer physical-device runs, keep at most one simulator running when needed, and perform native builds serially on the Mac. Initial signing/pairing may require Xcode's UI; routine builds can use CLI tools without keeping its editor open. Keep the Mac powered, reachable, and awake during remote work. T3 control still consumes host resources, and compilation still runs on the Mac; remote control does not transfer iOS build work to WSL.

On Windows, bound WSL/Docker memory, container concurrency, and later media-processing jobs so the Windows-native emulator retains capacity. Measure the combined workload before selecting final limits; do not treat 32 GB as a per-environment allocation. Do not run a second development container stack on the Mac by default. The production target remains the existing VPS.

## 3. Source ownership and networking

Use separate per-OS installs, caches, generated native directories, and build outputs. Keep the WSL checkout in its Linux filesystem and Windows native builds in a Windows-local checkout. Never share `node_modules`, Pods, generated `android/` or `ios/`, or Gradle caches across hosts. Commit app configuration, config plugins, owned native modules, and the single pnpm dependency lockfile. Preserve the reviewed iOS Podfile.lock snapshot outside ignored `ios/` as specified in the setup plan; restore and enforce it after native generation. Native generation must use the pinned inputs from that plan.

Use Git to move reviewed changes between checkouts. A remote destination is still needed before push/pull synchronization works. Edit mobile code in the checkout serving that platform's Metro; unsaved WSL edits do not appear automatically in Windows or Mac Metro. Changes to contracts and native inputs must reach each host at the same commit before verification. Record the commit and native generation inputs with device evidence.

Publish one private development API HTTPS address from the Windows/WSL stack through Tailscale. Select and verify the ingress route during setup: a Windows Tailscale endpoint proxying a WSL-forwarded port or a WSL tailnet endpoint are possible implementations, not already-working assumptions. Verify host forwarding, DNS, TLS, firewall, and app requests from the Mac, Android emulator, iPhone, and iPad. Phones need their own tailnet route or another deliberately configured route. `localhost` refers to the client device; Android emulator `10.0.2.2` reaches Windows, not automatically a WSL container. Container service names are internal.

Keep Metro local to each native build host initially. Verify JavaScript bundles, assets, WebSockets, and Fast Refresh on the selected device route. Tailscale supplies connectivity; it does not synchronize files or grant native device-control access. [Tailscale Serve](https://tailscale.com/docs/reference/tailscale-cli/serve).

## 4. Local builds and free Apple signing

Install SDK-compatible `expo-dev-client` through `expo install` and freeze the resulting resolution in the lockfile. Generate native projects from the committed pinned configuration. Platform wrappers then use Expo CLI/native tools to build and install, with shared-package prerequisites already built. The setup plan defines the public root commands; they do not exist yet.

After a development build is installed, use Metro with the development client for ordinary JavaScript/TypeScript changes. Rebuild when native modules, native configuration, or generation inputs change. Keep release-mode checks in the platform verification work; JavaScript export alone is not a native build. [Expo development builds](https://docs.expo.dev/guides/local-app-development/).

For physical iPhone/iPad runs, sign into Xcode locally with the user's free Apple Account, select Personal Team, pair/trust the devices, and enable Developer Mode as required. Account credentials remain in the native account/signing flow.

Free provisioning expires after seven days, requiring rebuild/reinstallation. Apple currently limits Personal Teams to three registered devices and three installed apps per device. Simulator builds avoid device provisioning expiry. Keep repeatable seed data and recovery checks; do not assume reinstalling preserves unsynced captures. [Apple Personal Team limits](https://developer.apple.com/help/account/basics/about-your-developer-account).

App Store and TestFlight distribution, distribution signing, and capabilities requiring paid entitlements remain outside the free verification claim. Prepare code, configuration, icons, permission descriptions, privacy information, and test evidence now. After enrollment, perform final signing, distribution-build/TestFlight checks, metadata submission, and review. Local readiness is not completed store approval.

## 5. T3 native device integration

T3 exposes `device_list`, `device_open`, and device screenshot tools. Opening a configured device provides a device-pinned `agent-device` command for UI inspection and interactions. The agent can inspect accessibility state, exercise flows, and collect evidence. `agent-device` operates the installed app; it is not an application module or an EAS dependency. [Expo agent-device guide](https://docs.expo.dev/agents/agent-device/).

The latest attempted discovery in this conversation returned: "Agent device access is turned off for this environment." Enable **Settings → Integrations → Devices → Agent device access**. The tool says this applies when the agent session next starts. Configure/select the native device hosts and rerun discovery in that session. Existing T3/Tailscale machine connections alone do not establish device discovery. No simulator, emulator, or physical-device automation has been qualified here. Confirm physical-device support for the actual host/tool configuration before relying on it; physical hardware checks can also be run directly through Xcode.

This setting is a prerequisite for agent-driven native interaction, not a reason to stop repository scaffolding or non-device checks. Use the built-in integration first; do not install a competing automation stack or use paid hosted devices as a workaround.

## 6. Verification and release boundary

Foundation acceptance requires Android and iOS simulator build/launch, an actual typed API status request from each platform, Fast Refresh, and Personal Team installation/status checks on the available iPhone and iPad. Verify the initial Unistyles screen's theme initialization, resizing/orientation, larger text, safe areas, and styles after Fast Refresh and full relaunch. Run device checks sequentially if necessary. Keep evidence tied to the checked commit; compilation and screenshots alone do not prove product behavior.

As features are implemented, verify capture, selected-media import, permissions including denial/revocation, app-owned file/SQLite persistence, offline restart/recovery, idempotent upload retries, authentication, maps, and sharing on both native platforms. Use the iPhone/iPad for hardware behavior and actual performance; simulators cannot establish camera, energy, or full background-scheduling behavior. Test HEIC/HEIF inputs and declare conversion support only after the worker path passes. UI automation complements these checks. [Apple device testing](https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices).

Keep the two required GitHub Actions jobs for quality and Android. Quality exports both Android and iOS JavaScript. Required iOS native build and runtime evidence initially comes from the local Mac at the reviewed commit; do not make paid macOS CI or EAS a prerequisite. Verify iOS when shared/mobile dependencies, config, or relevant code change and before release readiness. Document those results with the review; a green Linux job is not iOS native evidence.

The complete agreed product and local iOS verification remain required. Defer only iOS public distribution and paid-entitlement checks. Web/Android launch does not require Apple enrollment. Before Play production access, new personal accounts created after 13 November 2023 currently need at least 12 testers continuously opted into a closed test for 14 days and approval of their production-access application. Plan that work before the intended Android launch. [Google testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

## 7. Immediate implementation order

1. Implement workspace metadata, the selected toolchain/compiler split, package boundaries, and role-aware diagnostics. Local scaffolding does not require a store account or remote Git repository.
2. Build shared exports and the minimal generated status contract; scaffold web, server, worker, and the single Android/iOS Expo application with token-backed Unistyles styling and its native dependency/configuration inputs.
3. Implement and start Compose on Windows/WSL with private storage, database, Mailpit, and bounded worker behavior. Verify the private API ingress.
4. Add Windows Android and Mac iOS build wrappers, platform-local Metro, and native acceptance checks. Accept the existing Mac compatibility result and proceed to an actual app build.
5. Enable/discover T3 devices in a fresh agent session, prove UI control, and record API/reload/device evidence. Run the checks directly on their native hosts if agent integration still needs setup.
6. Establish the chosen Git remote and checkout synchronization, finish required CI, and continue the complete product sequence. Confirm permanent app identifiers before distribution; local-only identities may be used for development provisioning.
