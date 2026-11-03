# SDK 58 patch refresh

Date: 3 November 2026. Follow-up to B03 checkpoint `e90ba88e6f2ddfb800de77cd48b3dc0170a21b18`. WSL authors the dependency update; owning hosts consume exact committed checkpoints. The [dependency register](../core/architecture.md#143-expo-supported-direct-modules-and-peers), [host guide](native_host_setup.md) and [checkout workflow](checkout_workflow.md) continue to govern the graph and builds.

## Scope and selected versions

The live Expo compatibility endpoint moved during B03 verification. The user authorized correcting it and continuing local development. Stay on SDK 58 and retain React Native `0.88.1`, mobile React `19.3.0`, Unistyles `3.7.0`, Nitro `0.37.1` and the documented compiler split.

| Dependency | Previous | Refreshed |
| --- | --- | --- |
| `expo` | 58.0.22 | 58.0.23 |
| `@expo/metro-runtime` | 58.0.16 | 58.0.17 |
| `expo-constants` | 58.0.14 | 58.0.15 |
| `expo-linking` | 58.0.15 | 58.0.16 |
| `expo-router` | 58.0.29 | 58.0.30 |
| `react-native-safe-area-context` | 5.10.1 | 5.11.1 |
| `babel-preset-expo` | 58.0.23 | 58.0.24 |

The first six are the online SDK recommendations. The Babel preset follows the refreshed Expo package's own dependency. Direct application versions remain exact. The native/core/CLI transitive resolutions are retained in the frozen lockfile. The existing Router declaration patch applies unchanged to all eight affected files in `58.0.30`; only its version selector/file name changes. Other patches remain unchanged.

The package manager recorded exact-version release-age exceptions for the 22 newly published SDK graph packages, without adding a wildcard exception or changing strict peer/build-script policy. A first install met an incomplete upstream publication (`@expo/cli@58.1.19` required `@expo/env~2.5.4` while registry resolution still reported `2.5.3`). The exact `2.5.4` release became available; the subsequent ordinary install succeeded without substituting another package version. The attempted unsupported package-manager flag is retained as a nonqualifying diagnostic.

Expo's [upgrade guidance](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) calls for matching dependencies, Doctor and updated native projects. These checks run against the adopted SDK; no Expo Go or cloud build is substituted for native qualification.

## Executed checks and source identity

The dependency correction is commit `1e8e835b6b7320710901ceccf4aace982ebc5218`. The intentional iOS lock refresh was authored on the Mac and committed as `189fe4935231a580469ec5005c1da97af08344b1`. The full verification and native builds below use that exact latter source. Documentation-only closure follows it; it does not change the tested application inputs.

| Boundary | Executed result |
| --- | --- |
| SDK and package patch | Ordinary online `expo install --check` passed on WSL, Windows and Mac. Pinned `expo-doctor@1.21.5` passed all 20 checks on each host. All eight Router declaration files passed a patch dry run against the published package; the patch bytes/hash are unchanged. |
| Full aggregate | Normal online `pnpm verify` passed from `2026-11-03T17:46:40.718Z` to `2026-11-03T18:19:00.701Z`. `.kairn/verification/run-pstQ2u/result.json` records clean source `189fe4935231a580469ec5005c1da97af08344b1`, nine retained artifacts and six generated/source comparisons. No offline bypass or version-check exclusion was used. |
| Shared/tooling | All 50 tests passed, including the filesystem/HTTPS journal boundary. Strict types/lint, auth/OpenAPI generation, universal package/client boundaries, TS6/TS7 consumers and both mobile JavaScript exports passed. |
| Real database/domain | All 18 identity scenarios and nine B03 command/worker/media/mail/recovery scenarios passed. This includes actual non-owner roles, S3/SMTP, Better Auth callback handling, signed journal replay and writer fencing. The packaged non-root avatar decoder passed. |
| Web and service recovery | All six web checks passed in each development, production and post-recovery run. Data seed passed three checks; restart passed two, with its seed-only SMTP check intentionally skipped. Real database outage/readiness/reconnect, migration-failure startup gating and packaged non-root worker delivery passed. |
| Android native | Windows `pnpm verify:android` passed `assembleDebug` and `lintDebug` for `x86_64`: `BUILD SUCCESSFUL in 25m 53s`, zero lint errors and 31 warnings. The APK has 98,822,543 bytes and SHA-256 `d6d7af3168044fffab187afbe3d809ae2b63b34cd7b6c04ad85af8195aa99545`. |
| iOS native | Mac `pnpm verify:ios` passed canonical-path locked Pod installation (120 dependencies, 119 total pods) and `x86_64` simulator compilation. The clean-source build record was written at `2026-11-03T18:29:11.897Z`: Xcode 26.5 build 17F42, macOS 26.7.2, CocoaPods 1.16.2 and the retained `expo-template-bare-minimum@58.0.30`. |

The 238 application/configuration/native inputs in `.kairn/verification/expo-refresh/inputs.json` have manifest SHA-256 `6ce96e9c2359bca3e7d7429f2ffbb5ce8e3e5dca63513cb715e3a30cf1098818`. All were compared byte-for-byte inside the actual built tooling image, `sha256:17a3642debb64933a2f8db87cfee86b4b3fae4f0c238dee5a113bc4e8a922383`; `image-inputs.json` retains the comparison. Documentation and ignored host/evidence files are outside this application manifest. Released SQL migrations `0000`–`0008` are byte-identical to B03.

The refreshed native lock SHA-256 is `af67b96211728a2722f73fdfe7cba7abf05dc81afa5a9476be9f99d615e0c2ef`. Its changes follow the Expo/safe-area dependency update; React Native, Nitro and Unistyles remain pinned. An attempted Mac worktree at another absolute path failed the locked Expo prebuilt Core podspec checksum: that generated podspec includes the local archive's absolute `file://` URL and preparation path. The same package at the configured canonical checkout passed locked installation. This diagnostic does not justify changing Core or relaxing locked mode; a checkout relocation requires an intentional reviewed native-lock refresh.

WSL verification uses the isolated authoring worktree `/home/dev/dev/projects - WSL/nishanth/Kairn-sdk-refresh`. Windows consumes the committed checkpoint in `C:\dev\kairn-sdk-refresh`; its qualified APK is under `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`. The Mac uses `/Users/nishanth/projects/nishanth/kairn` and the configured two-job Xcode simulator build. The original WSL and Windows checkouts contain unrelated prototype work; their source and packager were preserved. Each host installed its own frozen dependencies; source and the Mac-authored lock moved through Git.

The iOS simulator app is `.kairn/ios-build/Build/Products/Debug-iphonesimulator/KairnDev.app`: 161 files, 141,694,327 bytes and tree SHA-256 `badf73e8be303cb6be42afd6f7e6a0b84de9ad5d07545ca727f3c14cfd21776f`. The tree digest covers sorted relative-file entries with their size/content hash or symlink target, serialized as compact JSON with sorted object keys. The main code library `KairnDev.debug.dylib` has SHA-256 `128cfb0ad2286fac30f2c92f1e749aa3a4cac8fcd4906f22ad709936e992ce5f`. Mac `.kairn/verification/ios-build.json` and `sdk-refresh-ios-artifact.json` retain the build record and full artifact manifest; the WSL metadata copy is `.kairn/verification/expo-refresh/ios-evidence.json`.

Ignored logs use `.kairn/verification/expo-refresh-*.log`; the Android fingerprint is retained in `.kairn/verification/expo-refresh/android-evidence.log`. These are build and local integration results. No refreshed native install/device/UI result, hosted CI, deployment or independent failure-domain qualification is claimed. Earlier device/binary evidence remains tied to its original source. T3 device discovery in this WSL environment exposed neither platform, so there was no new device interaction.

Coverage uses the existing aggregate and owning-host native gates; no tests were added for dependency values or documentation. Final formatting/diff checks passed, all 238 frozen application inputs remained unchanged, and the six Mac build-input hashes matched the WSL source.

## Recovery deployment decision

The user confirmed a separate Linux server is available and explicitly deferred deployment. Continue local module testing and account/product implementation. The existing real-role, S3/SMTP, signed filesystem/HTTPS journal, writer-fence and database-clone replay checks remain the local acceptance boundary. The [recovery runbook](restriction_recovery_runbook.md) records the future independent-host drill, retention/key recovery and credential requirements. Shared-data activation remains closed until those actual deployment checks pass.
