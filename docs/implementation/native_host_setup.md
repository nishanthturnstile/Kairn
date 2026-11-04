# Native host setup

Date: 3 November 2026. Current operating instructions for the configured hosts. Android emulator, iPhone simulator, and available physical iPad foundation acceptance passed. Physical iPhone checks are deferred by the user. The [current checkpoint](repository_setup_progress.md#current-checkpoint) records evidence, CI revisions, resource measurements, and renewal timing.

## Checkouts and ownership

| Host | Checkout | Responsibility |
|---|---|---|
| WSL | `/home/dev/dev/projects - WSL/nishanth/Kairn` | Compose, web/server/worker, containerized tooling |
| Windows | `C:\Users\Nishanth Murugan\projects\projects - WIN\Kairn` | Android builds, emulator, Metro, local T3 |
| Mac | `/Users/nishanth/projects/nishanth/kairn` | Xcode/Pods, iOS builds, Metro, simulator/device checks |

Origin is `https://github.com/nishanthturnstile/Kairn.git`. Follow [the current checkout workflow](checkout_workflow.md): idle hosts use `development`, feature PRs target it, and checked integration checkpoints promote to `main`. Use `pnpm checkout:status` and `pnpm checkout:sync --branch NAME --commit FULL_SHA` on clean hosts; the helper refuses divergence/overwrites and preserves local settings. Choose one authoring checkout per task; no live folder sync. Keep dependencies, caches, generated native output and ignored environment/signing files on their owning OS. The original application inputs were accepted at `58d258c`; later source/CI/native evidence remains tied to actual commits.

## Windows

Private tools under `C:\dev\.kairn-tools` select Node `26.13.0`, pnpm `12.16.1`, and Temurin JDK `17.0.20.1+1`. Activate the checkout-local environment before Node/pnpm/Android commands; global defaults are unchanged.

```powershell
Set-Location 'C:\Users\Nishanth Murugan\projects\projects - WIN\Kairn'
. .\.kairn\env.ps1
pnpm run doctor android
pnpm install --frozen-lockfile
pnpm check:mobile
# Emulator build; select the appropriate ABI for other hardware.
$env:KAIRN_ANDROID_ARCHITECTURES = 'x86_64'
pnpm verify:android
```

The activation file selects the space-free SDK junction `C:\dev\.kairn-tools\android-sdk`, the short `.kairn/p` virtual store, and a 32-character virtual-store directory limit. The underlying SDK remains in the user's Android SDK directory. These guards avoid the qualified CMake/Ninja path and C++ driver-name failures. Required selected tools are platform `android-37.0`, build tools `37.0.0`, NDK `27.1.12297006`, CMake `3.22.1`, and Ninja `1.13.2`. Windows long paths are enabled; doctor/build guard these prerequisites. Do not undo those local fixes or share this dependency tree with another OS. Backups and original hashes remain in the [host history](../research/repository-setup/native_host_setup_2026-11-02.md#windows).

APK assembly/lint passed with 0 lint errors; app installation and real emulator UI/API acceptance are recorded separately in setup progress. Windows hardware and current WSL/Compose capacity are in the [combined-load record](repository_setup_progress.md#combined-host-resource-verification); no host limits were changed in the handoff.

For this host's Android MagicDNS path, the prepared ignored launcher `.kairn/start-t3-android-dns.ps1` supplies `EXPO_DEVICE_HUB_EMULATOR_EXTRA_ARGS=-dns-server 100.100.100.100` to the T3 desktop and its children. Inspect it with `-InspectOnly`; after a normal user-initiated desktop quit, run the launcher for subsequent T3 sessions. It refuses an already-running desktop and changes no user/machine environment or adapter DNS. `-OriginalDns` is its recorded rollback option. The helper and backups are host-local, not a fresh-clone dependency; the [archived procedure](../research/repository-setup/native_host_setup_2026-11-02.md#windows-android-dns-repair-preparation--2-november-2026-1212-utc-historical) records reproduction and ownership. Boot or restart a stopped Pixel_10 through that environment-bearing T3 desktop's Device controls. Starting it directly through Android Studio or the SDK does not inherit this process override, and attaching T3 afterward cannot add it. Inspect the actual emulator/QEMU command line after startup for `-dns-server 100.100.100.100`, then verify device DNS/API through the supported device workflow. The current QEMU process was inspected in this handoff and contains that override for Pixel_10. Retain the qualified cold-boot configuration rather than restoring an unverified old snapshot.

## Mac

The Intel Mac uses macOS `26.7.2`, Xcode `26.5` (build `17F42`), iOS/iOS Simulator SDK `26.5`, the matching universal iOS 26.5 simulator runtime, CocoaPods `1.16.2`, and private Node `26.13.0` / pnpm `12.16.1`. The project-local activation selects those tools and UTF-8 locale. Full Xcode system selection is already qualified; `pnpm run doctor ios` checks simulator-tool discovery without relying on a project-only `DEVELOPER_DIR` override. Recheck selection after an actual Xcode/toolchain change, not on every task.

For a fresh checkout or changed native inputs, run the locked simulator verification:

```sh
cd ~/projects/nishanth/kairn
. .kairn/env.sh
pnpm install --frozen-lockfile
pnpm verify:ios
```

The wrapper generates pinned iOS inputs, restores `apps/mobile/native-locks/ios/Podfile.lock`, installs Pods in locked mode, and compiles the host simulator architecture with two Xcode jobs. The qualified lock SHA-256 is `af67b96211728a2722f73fdfe7cba7abf05dc81afa5a9476be9f99d615e0c2ef`. Use `pnpm ios:pods:update` only for an intentional, reviewed native dependency update. Native generation recreates local project settings, so reselect Personal Team afterward if a physical build needs it.

The [SDK 58 patch refresh](expo_sdk_refresh_progress.md) records follow-up compilation separately from the original device/UI acceptance. Its Expo prebuilt Core podspec embeds an absolute local tarball URL in its checksum. Locked Pods therefore use the configured canonical Mac checkout above; moving to another checkout path requires an intentional reviewed native-lock refresh. The isolated-path checksum diagnostic did not change a dependency version.

The simulator artifact is `.kairn/ios-build/Build/Products/Debug-iphonesimulator/KairnDev.app` (`dev.kairn.app`, x86_64 on this host). The signed arm64 iPad artifact is `.kairn/ipad-build/Build/Products/Debug-iphoneos/KairnDev.app`. Build/install, runtime, and user-observed results are separate entries in setup progress.

## Metro and private API

Each native host owns one loopback Metro on port `8081`; its PID/logs are in that checkout's ignored `.kairn/`. Inspect an existing packager before starting a replacement. For ordinary JavaScript changes use the existing development client and Metro; rebuild for changed native inputs.

```sh
pnpm dev:mobile --host localhost --port 8081
```

| Client | Verified route |
|---|---|
| Android emulator ? Windows Metro | `http://10.0.2.2:8081` |
| iPhone simulator ? Mac Metro | `http://localhost:8081` |
| iPad ? Mac Metro | `https://nishanths-macbook-pro.tail30fb6a.ts.net:8081` |
| All accepted clients ? Windows/WSL API | `https://nishanth-windows.tail30fb6a.ts.net:8443` |

The iPad route uses private Tailscale Serve, terminating normal TLS and forwarding to Mac `http://127.0.0.1:8081`. It preserves the packager and unrelated Serve endpoints. Configure it on the Mac with `tailscale serve --bg --https=8081 http://127.0.0.1:8081`; remove only this route with `tailscale serve --https=8081 off`. Use HTTPS and the MagicDNS hostname: the bare IP returned 404, and the compiled local-network ATS allowance does not cover the fully qualified HTTP hostname. No TLS exception or custom CA is required.

Windows private HTTPS `8443` forwards the WSL application port `8080`; the pre-existing T3 `443` route is separate. Each native checkout's ignored `apps/mobile/.env.local` contains `EXPO_PUBLIC_API_URL=https://nishanth-windows.tail30fb6a.ts.net:8443`, and WSL Compose uses that origin as `KAIRN_PUBLIC_ORIGIN`. The hosts, emulator, simulator, and physical iPad passed the status contract over this route. Physical iPhone verification remains deferred.

`pnpm check:mobile:host` checks the API, development bundle, and HMR WebSocket. It is a host route check and does not replace native launch/style/device evidence.

## Personal Team renewal and device recovery

The accepted profile expires November 9, 2026. Renew it through Xcode locally, then rebuild/reinstall and repeat launch/API checks. Open `apps/mobile/ios/KairnDev.xcworkspace`, select the Personal Team and Automatically manage signing on the KairnDev application target. Keep Apple sign-in and key-access prompts on the Mac. A signing-only retry uses the existing generated workspace and a Mac-local context with usable keychain access; avoid a clean prebuild or Pod reinstall during that retry.

Set `KAIRN_IOS_DEVICE` to the available device UDID shown by Xcode, then run this incremental workflow from the Mac checkout:

```sh
KAIRN_IOS_DEVICE='<device-udid>'
. .kairn/env.sh
xcodebuild -workspace apps/mobile/ios/KairnDev.xcworkspace -scheme KairnDev -configuration Debug -sdk iphoneos -destination "id=$KAIRN_IOS_DEVICE" -derivedDataPath .kairn/ipad-build -jobs 2 CODE_SIGN_STYLE=Automatic -allowProvisioningUpdates -allowProvisioningDeviceRegistration build
xcrun devicectl device install app --device "$KAIRN_IOS_DEVICE" .kairn/ipad-build/Build/Products/Debug-iphoneos/KairnDev.app
```

Approve the active codesign prompt locally while its process is alive; never put a keychain password in a command or repository file. Keep the physical device unlocked with Developer Mode enabled. If iOS refuses an otherwise verified install as untrusted, select its Developer App under Settings ? General ? VPN & Device Management and trust it on the device. After renewal, update the recorded expiry and verify the profile, signature, installation, and real API status again.

## Device verification and history

Use the Windows thread for its local emulator and the configured `mac-ios` host for iOS simulator UI. A fresh `device_list` ? `device_open` supplies the bound command for every app/UI action; follow its advice once after a failure and close only your own session. Current Mac simulator discovery, open, XCTest-backed inspection, input/refetch, and screenshot passed in this handoff. The physical iPad is not listed by this tool configuration; its accepted SSH/native logs and user-observed UI results remain separate. Direct SSH app control requires an explicit user request.

Detailed superseded failures, rollback preparation, and original acceptance timestamps are preserved in [native host history](../research/repository-setup/native_host_setup_2026-11-02.md) and [setup history](../research/repository-setup/repository_setup_progress_2026-11-02.md). Current results live in the [checkpoint](repository_setup_progress.md#current-checkpoint). Do not turn archived failures into new setup prerequisites.
