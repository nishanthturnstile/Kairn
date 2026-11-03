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

## Executed checks and remaining qualification

- Online `expo install --check`: passed, dependencies up to date.
- Pinned `expo-doctor@1.21.5`: all 20 checks passed.
- Router patch: all eight files pass a dry run against the actual published package; the patch hash is unchanged.
- Full current-source Compose `pnpm verify`, updated iOS lock and affected native build results are recorded here as they complete. Earlier binaries/CI results remain historical.

Ignored logs use `.kairn/verification/expo-refresh-*.log`. The Windows primary checkout currently contains unrelated prototype work; its source and packager remain untouched. The Mac primary checkout was clean at `development` commit `605bc61382f2445eb53aea2f64dc6b45c7032641` when inspected.

## Recovery deployment decision

The user confirmed a separate Linux server is available and explicitly deferred deployment. Continue local module testing and account/product implementation. The existing real-role, S3/SMTP, signed filesystem/HTTPS journal, writer-fence and database-clone replay checks remain the local acceptance boundary. The [recovery runbook](restriction_recovery_runbook.md) records the future independent-host drill, retention/key recovery and credential requirements. Shared-data activation remains closed until those actual deployment checks pass.
