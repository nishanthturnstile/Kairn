# Windows Android development findings

> Superseded host recommendation: the API/Compose host below was the Mac at research time. The current [mobile development plan](../../implementation/mobile_development_plan.md) places containers on Windows/WSL, keeps Windows-native Android tooling, and reserves the Mac for iOS. Mac API URLs and remote-Metro alternatives below are historical. T3 native tools have since been found, but discovery reported Agent device access disabled; actual device hosts remain unqualified.

Research date: 1 November 2026. Scope: Android development on the user's Windows computer while Docker Compose services and the current repository live on the MacBook. This is a development-host recommendation, not an installation or device qualification.

## Summary

Use the Windows computer for Android Studio, JDK, SDK/NDK, Gradle, and the Android emulator. The user confirms 32 GB RAM, which meets Google's recommended memory for Studio plus the emulator. The inspected Mac has 16 GB RAM and an Intel processor. Keeping Android workloads on Windows leaves the Mac's memory available for Docker Compose and application work. CPU model, virtualization, Windows version, GPU, and free SSD space still need verification. [Android Studio requirements](https://developer.android.com/studio/install).

The preferred development arrangement is Windows-native tooling and Metro against a Windows-local checkout, with the API reached on the Mac through Tailscale. This avoids mixing Windows and Linux SDK paths or depending on remote filesystem watching. The emulator runs directly on Windows, outside Docker Compose. Android's accelerated emulator requires host virtualization rather than running inside Docker or another virtual machine. [Emulator acceleration](https://developer.android.com/studio/run/emulator-acceleration).

## Confirmed and unverified host information

- The Mac's inspected architecture is `x86_64` with 16 GiB physical memory.
- The user reports 32 GB RAM on Windows. Its CPU, Windows version, virtualization setting, SSD space, and graphics support have not been inspected.
- The local Tailscale client is running and lists an online Windows peer. This confirms a tailnet peer, not application/API reachability or emulator behavior.
- T3 environment discovery/link tools were unavailable after explicit attempts in the parent task. No remote Windows shell or device session was established.

Google currently recommends an Intel/AMD Windows system with BIOS virtualization enabled and lists Windows ARM as unsupported for this Studio setup. Its current guide supports 64-bit Windows 10 or newer; verify the actual Windows release and CPU before selecting an emulator image. The recommended memory figure does not establish the PC's complete suitability. [Studio system requirements](https://developer.android.com/studio/install).

On Windows, prefer Windows Hypervisor Platform. Google recommends it and states that the alternative Android Emulator hypervisor driver is scheduled to sunset on 31 December 2026. Do not use older HAXM/driver recipes. [Windows acceleration](https://developer.android.com/studio/run/emulator-acceleration).

## Tool ownership

| Windows | MacBook |
|---|---|
| Windows-native Node/pnpm and a local repository checkout for mobile development | Current repository checkout and web/backend development |
| Android Studio, JDK 17, SDK/build tools, NDK, Gradle wrapper | Docker Compose app/data services |
| Emulator or USB-connected physical Android device | Private development API ingress reachable over Tailscale |
| Metro as the normal local development bundler | Optional remote Metro when preserving Mac-side mobile edits is necessary |

Use the SDK/template pins already recorded in [Android setup findings](findings_android.md). Install API 37, Build Tools 37.0.0, and the selected NDK on the machine that actually compiles Android, normally Windows. There is no need to complete the Mac's missing Android prerequisites merely because it hosts the API. Its Node tools can still perform non-native checks and Metro export. A future Mac-native Android build would need those prerequisites locally too.

Expo documents Windows JDK and Android Studio setup directly. The generated native wrapper must run as `gradlew.bat` on Windows and `./gradlew` on Unix. Root build scripts should choose the proper executable and working directory without requiring a POSIX shell. Apply the same principle to environment variables, filesystem paths, and cleanup commands. [Expo Android emulator setup](https://docs.expo.dev/workflow/android-studio-emulator/).

WSL is not required for this arrangement. It can be a separate Linux development environment, but combining its SDK, network namespace, and dependencies with Windows-hosted Studio/emulator adds integration work. This recommendation avoids that work; it is not a claim that every WSL Android workflow is unsupported.

## Source and dependency ownership

Maintain separate local checkouts and run a frozen-lockfile install on each OS. Do not share `node_modules`, generated `android/`, Gradle caches, or native outputs across an SMB/network folder. Platform packages and SDK paths differ. Build the shared workspace exports in the Windows checkout before Metro consumes them.

Git synchronizes committed changes, not unsaved edits or automatic live reload across machines. The repository currently lacks a remote. Before using two active checkouts, establish a Git destination and a clear commit/push/pull workflow. Prefer making mobile edits in the Windows checkout when Metro runs there. Backend and mobile changes that alter shared contracts must use matching commits.

If the agent continues to edit mobile files on the Mac, those edits must reach Windows before its local Metro can show them. A deliberate one-way source sync excluding dependencies/build outputs is possible, but requires its own conflict and revision rules. Do not introduce bidirectional filesystem synchronization casually.

## Network arrangement

The Windows app's development API base URL points to the Mac's private Tailscale ingress, for example `https://<mac-tailnet-name>.ts.net`. The Compose edge/HTTP service must be reachable through that ingress. A container's internal DNS name is not a client URL, and a loopback-only published port is not directly reachable from another machine.

Tailscale Serve can proxy a loopback HTTP service to an HTTPS URL within the tailnet, subject to access controls and HTTPS enablement. This is a useful development ingress because Compose can keep its public-facing local port on loopback. Configure it only during the implementation step; this research did not change Tailscale settings. Use private Serve for this case. Public Funnel is not needed. [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve).

On a Windows-hosted emulator, `10.0.2.2` means the Windows host's loopback interface. It does not mean the MacBook. Local Metro can use that host route; the Mac API needs the Mac's tailnet route. Emulator outbound traffic can use the workstation's network, but firewall, DNS, and VPN behavior must be checked from the actual app. A Windows browser reaching the API is insufficient proof. [Android emulator address space](https://developer.android.com/studio/run/emulator-networking-address).

A physical phone must also have a route to the API. Installing Tailscale on that phone is one possible route; otherwise use an explicitly configured development network/proxy. The phone does not automatically inherit Windows Tailscale merely because it is connected by USB. Do not expose the ADB server publicly for this workflow.

## Alternative with Metro on the Mac

If preserving immediate reload of Mac-side mobile edits is more useful than a second source checkout, Metro can remain on the Mac while the native APK and emulator live on Windows. A development build can request JavaScript across the tailnet. The installed APK must match the native dependencies/configuration used by Metro.

Expo's dev server normally uses port 8081 and advertises a LAN URL. Its CLI supports an explicit advertised address through `EXPO_PACKAGER_PROXY_URL`. A remote-Metro setup must advertise a URL reachable from the emulator and allow the required HTTP and WebSocket traffic. Test bundles, assets, and hot reload, not just a status page. This option keeps JavaScript work on the Mac and adds network configuration; a native rebuild still occurs on Windows when native inputs change. [Expo CLI networking](https://docs.expo.dev/more/expo-cli/).

Start with Windows-local Metro for the simplest independent native environment. Use remote Mac Metro deliberately when the editing workflow benefits from it. Tailscale itself supplies private connectivity, not source synchronization, command execution, or an agent/device host connection.

## Acceptance and remaining questions

Before calling the split environment ready:

1. Inspect Windows CPU/architecture, Windows version, virtualization, SSD space, and graphics support.
2. Verify frozen installation and shared-package/mobile checks on Windows.
3. Generate the pinned Android project and compile a debug APK through its Windows wrapper.
4. Confirm the emulator can fetch the Mac API using the exact configured hostname and TLS path.
5. Launch the app through the linked device tools, request real status, change a screen, and verify Metro reload.
6. Verify that a native-input change triggers a rebuild and that matching commits resolve shared-contract changes.

No emulator was launched, APK built, Windows software installed, or cross-host application request exercised. The remaining hardware questions do not prevent recommending the 32 GB Windows machine as the Android host, but they prevent promising a qualified environment today.

## Sources

All sources are Tier 1 vendor documentation, checked on 1 November 2026. Five targeted search queries were used, followed by direct page inspection.

- Google, [Android Studio system requirements](https://developer.android.com/studio/install), current Windows and Mac memory/CPU requirements.
- Google, [emulator acceleration](https://developer.android.com/studio/run/emulator-acceleration), host virtualization and Windows Hypervisor Platform.
- Google, [emulator network address space](https://developer.android.com/studio/run/emulator-networking-address), host loopback semantics and network limitations.
- Expo, [Windows Android setup](https://docs.expo.dev/workflow/android-studio-emulator/) and [CLI networking](https://docs.expo.dev/more/expo-cli/).
- Tailscale, [Serve](https://tailscale.com/docs/features/tailscale-serve), private HTTPS access to local services.
