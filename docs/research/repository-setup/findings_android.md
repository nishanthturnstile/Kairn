# Android repository setup findings

> Historical scope note: these Android generation findings remain evidence for that platform. The current [setup plan](../../implementation/repository_setup_plan.md) extends foundation acceptance to local iOS builds and device checks without paid Apple membership or an EAS subscription. Architecture section 14 is the current dependency authority.

Research date: 1 November 2026. Scope: the repository foundation for the Android-first Expo application. These findings preserve architecture version 1.4. No application was scaffolded, installed, generated, built, signed, or run.

## Summary

Keep `apps/mobile` as the native application, with its own Expo-compatible React, TypeScript, and native modules. Use pnpm isolated workspaces and Expo's Metro configuration. Adopt Continuous Native Generation, keep generated `android` and `ios` directories ignored, and express native changes through application configuration, config plugins, and owned native modules. Build Android through the generated Gradle wrapper in local or private CI. EAS is optional and is not needed for this workflow.

A JavaScript export, type check, or Expo Doctor pass does not establish that an Android APK compiles or runs. The foundation needs both Metro export and a native build gate.

## Stack and verified metadata

Registry metadata and shipped npm tarballs were read directly. Exact availability does not establish runtime integration.

| Item | Observation | Evidence |
|---|---|---|
| `expo` | `58.0.22`; Node accepts `^22.13.0`, `^24.3.0`, `^26.0.0`, or `>=27.0.0`. The existing Node `26.13.0` fits. | [Expo metadata](https://registry.npmjs.org/expo/58.0.22). |
| Default template | `expo-template-default@58.0.31` selects React `19.3.0`, React Native `0.88.1`, TypeScript `~6.0.3`, and `@types/react ~19.3.0`. | [Template metadata](https://registry.npmjs.org/expo-template-default/58.0.31). |
| Native generation template | `expo-template-bare-minimum@58.0.30` contains Gradle wrapper `9.4.1`. Its React and RN pins match the default template. | [Bare template tarball](https://registry.npmjs.org/expo-template-bare-minimum/-/expo-template-bare-minimum-58.0.30.tgz). |
| React Native Android catalog | Minimum API `24`, compile API `37`, target API `36`, Build Tools `37.0.0`, NDK `27.1.12297006`, AGP `9.2.1`. | `gradle/libs.versions.toml` in the [RN tarball](https://registry.npmjs.org/react-native/-/react-native-0.88.1.tgz). |
| Expo Android root plugin | `expo-modules-autolinking@58.0.16` reads RN's version catalog, with matching Android defaults. Its Kotlin resolution accounts for AGP's KGP version. | `ExpoRootProjectPlugin.kt` in the [autolinking tarball](https://registry.npmjs.org/expo-modules-autolinking/-/expo-modules-autolinking-58.0.16.tgz). |
| Android build runtime | AGP 9.2 requires Gradle `9.4.1` and JDK `17`; its KGP floor is `2.2.10`. | [Android AGP compatibility](https://developer.android.com/build/releases/agp-9-2-0-release-notes). |
| Expo Doctor | `1.21.5` is available and supports the selected Node family. Pin as a local development dependency. | [Doctor metadata](https://registry.npmjs.org/expo-doctor/1.21.5). |

API 24 is a toolchain floor, not a final product device-support promise. Adopt and test the actual supported minimum when capture and the selected native integrations are qualified. The Expo SDK 58 matrix independently identifies RN 0.88 and React 19.3.0. [SDK reference](https://docs.expo.dev/versions/v58.0.0/).

The original Mac inspection found Node `26.13.0`, pnpm `12.16.1`, JDK `17.0.19`, `ANDROID_HOME`, and NDK `27.1.12297006`. Its Android platforms/build tools reach 36.1. API 37 and Build Tools `37.0.0` are missing for a Mac-native build. The follow-up recommends the user's 32 GB Windows PC for native development, so install the selected native prerequisites there. The Mac does not need those additions merely to host Compose/API services. [Windows host findings](findings_windows_android.md).

Do not copy every default-template dependency into the app. That template also includes web support, sample UI packages, Reanimated, Worklets, and Gesture Handler. Preserve only the modules needed for the foundation screen and router, then add capture and map modules with their owning workstreams. Application code should use development builds rather than rely on Expo Go's fixed native runtime. [Development environment choices](https://docs.expo.dev/get-started/set-up-your-environment/).

## Existing patterns and package isolation

The baseline intentionally permits web React `19.3.1` and mobile React `19.3.0`. Keep both applications' dependency declarations explicit. Avoid root overrides that force one React or TypeScript version across every workspace. A pure shared package needs no React runtime dependency. Any future shared React library must resolve the consumer's React rather than bundle another copy.

Expo supports isolated pnpm dependencies starting with SDK 54. SDK 58 can use normal `apps/*` and `packages/*` workspaces. Use `expo/metro-config`; automatic monorepo support removes the need to add historical `watchFolders`, `extraNodeModules`, or resolver path workarounds. Confirm actual web and mobile resolution independently. [Expo monorepos](https://docs.expo.dev/guides/monorepos/).

Native autolinking and Metro must resolve the same native modules. Expo's duplicate checks and its default monorepo autolinking-resolution behavior help identify mismatches, but dependency deduplication remains the complete fix. Verify a single effective RN/native-module installation within the mobile app graph. A separate web React installation is expected. [Expo autolinking](https://docs.expo.dev/modules/autolinking/).

## Integration points and command contracts

The package name below is a proposed private workspace name. Run these from the repository root after the application and scripts exist.

| Purpose | Command | Result |
|---|---|---|
| Start Metro | `pnpm --filter @kairn/mobile exec expo start --dev-client` | Development server for an installed development build. |
| Native dependency validation | `CI=1 pnpm --filter @kairn/mobile exec expo install --check` | Noninteractive failure on incompatible installed package versions. |
| Project diagnostics | `pnpm --filter @kairn/mobile exec expo-doctor` | Local pinned diagnostics, including duplicated native modules. |
| Mobile compiler | `pnpm --filter @kairn/mobile exec tsc --noEmit` | Uses the mobile package's SDK-compatible TypeScript. |
| Metro production export | `pnpm --filter @kairn/mobile exec expo export --platform android --output-dir dist` | JavaScript/assets for Android, not an APK or AAB. |
| Native project generation | `pnpm --filter @kairn/mobile exec expo prebuild --platform android --no-install --template expo-template-bare-minimum@58.0.30 --skip-dependency-update react,react-native` | Generates Android without triggering a second package install. |
| Compile development APK | `./gradlew :app:assembleDebug --no-daemon` from `apps/mobile/android` | Normally `app/build/outputs/apk/debug/app-debug.apk`. |
| Compile release-shaped APK | `./gradlew :app:assembleRelease --no-daemon` from the same directory | Release compilation with bundled JS. Verify signing before describing it as distributable. |
| Compile release bundle | `./gradlew :app:bundleRelease --no-daemon` from the same directory | Normally `app/build/outputs/bundle/release/app-release.aab`. Requires an adopted release-signing configuration for distribution. |

Use root scripts to perform generation and Gradle execution with explicit working directories. Check tracked application manifests and the lockfile for changes after generation. `--skip-dependency-update` protects React and RN only, so it does not replace a drift check. Expo CLI documents immutable CI version validation and separate Metro export/native commands. [Expo CLI](https://docs.expo.dev/more/expo-cli/).

Inspect the native-generation template path before freezing the wrapper. The shipped CLI accepts an npm package spec or local tarball for `--template`. Its `58.1.18` parser defaults to regeneration unless `--no-clean` is present. `--no-install` and `--pnpm` are mutually exclusive. Avoid combining those flags. These details come from `build/src/prebuild/index.js` and `resolveOptions.js` in the [CLI tarball](https://registry.npmjs.org/@expo/cli/-/cli-58.1.18.tgz), and take precedence over older examples that assume clean generation is opt-in.

## Native project strategy

Choose CNG for the foundation. Commit `app.config.ts`, Expo configuration, config plugins, required source modules, the pnpm lockfile, and a dated native-toolchain record. Ignore generated `apps/mobile/android`, `apps/mobile/ios`, `.expo`, and build outputs. Do not edit generated native configuration manually. Recreate it from a pinned template and assert that fresh generation is repeatable. [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/).

Committing the native project is a valid alternative when the team deliberately owns direct Gradle/Kotlin changes. It moves upgrade responsibility to checked-in native files and requires reviewing Expo's native upgrade diffs. Reconsider that choice if custom Android transfer integration cannot be expressed through an owned Expo module and config plugin. Config plugins are designed to preserve native configuration across regeneration. [Custom native code](https://docs.expo.dev/workflow/customizing/), [config plugins](https://docs.expo.dev/config-plugins/introduction/).

## Gotchas and issues

- The selected Mapbox bridge is a native dependency and needs an application rebuild when introduced. Qualify RN 0.88 and Android API/toolchain compatibility in the map workstream. Keep it out of the repository foundation install while its screen is absent.
- The selected bridge's shipped Android installation guide says Mapbox removed authentication from SDK downloads. Do not assume an old `MAPBOX_DOWNLOADS_TOKEN` secret is a prerequisite. A public runtime access token remains a provider-integration input. The package retains legacy download-token configuration for other cases. Its default engine is Mapbox Android `11.33.0`. [Bridge tarball](https://registry.npmjs.org/@rnmapbox/maps/-/maps-10.3.16.tgz), files `android/install.md`, `plugin/build/withMapbox.js`, and `package.json`.
- The bare template's release variant uses debug signing by default. A successful `assembleRelease` or `bundleRelease` is not evidence of approved release signing. Separate the foundation's local build qualification from a future signed distribution command. [Android release signing](https://reactnative.dev/docs/signed-apk-android).
- Public `EXPO_PUBLIC_*` values enter the application bundle. API base URLs can be public. Backend, storage, email, and model credentials cannot be mobile configuration.
- A CNG workflow needs the Android SDK/NDK, accepted SDK licenses, JDK 17, network access to artifact repositories, and a reproducible template/Gradle selection on every native CI runner. An emulator is unnecessary for compilation. It is necessary to exercise emulator behavior, and actual target-device qualification remains separate.
- `eas build --local` still authenticates to Expo and has its own environment limitations. Direct Expo generation plus Gradle avoids adding an Expo account dependency to the selected local/private-CI workflow. [Local EAS builds](https://docs.expo.dev/build-reference/local-builds/).

## Testing and acceptance

The foundation acceptance evidence should include:

1. Frozen-lockfile install with no repository drift.
2. Mobile TypeScript check, `CI=1 expo install --check`, and pinned Doctor diagnostics.
3. Metro Android export that imports the chosen universal workspace package through its actual package exports.
4. Fresh native generation from the pinned template and a real Gradle APK build on the recorded toolchain.
5. Inspection of the resulting package identity, SDK levels, version, and signing certificate. Mark debug and release artifacts accurately.
6. A launch of the installed foundation app on an Android target through the available device tools during implementation, with the correct API base URL configuration. Avoid declaring capture, offline durability, native maps, or synchronization complete at this milestone.

## Open questions

Repository setup can proceed with the existing descriptive naming and local development defaults. Record these decisions before the dependent actions:

- Final Android application ID, URL scheme, and signing ownership before distributing a stable package. A temporary development identity is acceptable and must be described as temporary.
- GitHub Actions is confirmed. Configure an Android-capable Actions runner with the recorded JDK, SDK, NDK, Node, and pnpm pins. Native runner capacity remains an implementation detail to verify.
- Final supported minimum Android version and target device set before native capability acceptance. API 24 is only the current baseline toolchain floor.
- Release keystore and Play ownership before store distribution. No release credentials are required for a development APK or repository planning.

## Evidence confidence

High confidence: official documentation establishes the workspace, CNG, command, signing, and build-runtime semantics. Shipped package inspection confirms exact baseline package availability, default native values, CLI flag handling, and the Mapbox download-auth update. Untested: frozen install of the complete selected graph, config-plugin composition, prebuild output, native compilation, signing, app launch, and real-device behavior. Do not infer those outcomes from this research.

## Sources

All sources above are Tier 1 maintainer documentation, registry metadata, or shipped artifacts. Versions and source URLs are attached directly to their claims. The research used five targeted web search queries across Expo's monorepo, Android environment, CNG, CLI, and local-build topics, followed by direct documentation and tarball inspection.
