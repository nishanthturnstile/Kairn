# B04 branch audit and deferred work — 4 November 2026

This audit covers Kairn's registered Windows, Mac and WSL checkouts and local/remote branches after fetching origin. It preserves the product experience redesign and does not merge, promote, delete branches, switch other checkouts or restart devices. [Native qualification evidence](b04_native_2026-11-04.md) distinguishes completed work from remaining acceptance. The account follow-up is reviewable; B04 is not complete.

## Checkout inventory

| Host / checkout | Observed source | Tracked/untracked source |
| --- | --- | --- |
| Windows canonical `projects/projects - WIN/Kairn` | `feat/product-experience-redesign`, `007dae163656cd53eca288ccf6e5b8f83f010ec0` | Clean; excluded from changes |
| Windows managed `test-accounts-b04-native-20261104` | `fix/accounts-b04-native-qualification`, `0893ffe3c1ab0666b8b8fd9e4330c311a9339ff7` before this audit documentation | Clean |
| Windows `C:/dev/kairn-sdk-refresh` | Detached `189fe4935231a580469ec5005c1da97af08344b1` | Clean; preserved |
| Mac canonical `/Users/nishanth/projects/nishanth/kairn` | Account qualification branch, same `0893ffe` before this documentation | Clean; sole author of this documentation/follow-up |
| Mac `kairn-sdk-refresh` | Detached `189fe4935231a580469ec5005c1da97af08344b1` | Clean; preserved |
| WSL canonical `/home/dev/dev/projects - WSL/nishanth/Kairn` | `feat/product-experience-redesign`, `d285e27cd2d9e67ad0527a2c248803a68eab0563` | Clean; behind its published tip, left untouched |
| WSL `Kairn-sdk-refresh` | `feat/accounts-b04`, `0324b0eb5019f7c24a6cd7152d988dc4f30596e2` | Clean; frozen source left untouched |

All three independent repositories report zero local branch commits unreachable from fetched remote refs (`git rev-list --count --branches --not --remotes`). Ignored dependencies, credentials, local environment, native outputs and verification logs are deliberately outside this source audit and are not publication candidates. Unrelated non-Kairn WSL repositories are outside scope.

## Branch disposition

Remote `development` is `e2e40cc26d65752f86858158b469ef71e0ae5cb9`. PR5 merged the original B04 implementation; it must not receive further work.

| Branch group | Finding / action |
| --- | --- |
| `fix/accounts-b04-native-qualification` | Only independent unmerged code outside redesign. Before this audit, three published commits: `4fa323f18e3b327665cbc5ce80e68e91ac95ecea` storage/simulator signing, `f07fdb65a25a46370ecb6ade71d0da2da424fa7a` accepted profile defaults, and `0893ffe3c1ab0666b8b8fd9e4330c311a9339ff7` native evidence. Publish this audit and open one draft PR to development. |
| Former `feat/accounts-b04` remote tip `5035b56` | A post-merge publication duplicate; `git cherry` marks it patch-equivalent to `4fa323f` on the authoritative follow-up. No second PR or new work on the former branch. Preserve the ref. |
| `feat/experience-prototype` / `feat/product-experience-redesign` | Prototype's 14 unmerged commits are ancestors of redesign's published tip `007dae1`; redesign is already draft PR6 to development. This workstream is explicitly excluded and left untouched. |
| `setup/foundation-verification` | Two old commits (`e98b9a6`, `3ed213e`) are not literal ancestors but both are patch-equivalent to integrated development history (`git cherry` returns minus for each). No missing changes or duplicate PR needed. |
| Accounts/journeys foundation, checkout/setup handoff, prototype-plan and original qualification test refs | Already integrated ancestors or preserved older pointers. No independent unpublished code. |
| `main` and local `development` pointers | Some local long-lived refs lag remote development; remote main remains `605bc61`. This is source lag / unpromoted integration, not another feature to include here. Future promotion is a separate reviewed action, not requested or performed by this audit. |

## Remaining work for a later session

1. Review the account follow-up PR and its current-head required CI. Earlier green CI at `ad7106a` is evidence only for that head. Merge into development only after the normal review/check process; then consume the exact integration SHA on idle hosts using the protected checkout helper. No merge or promotion is performed now.
2. Release Pixel_10's owning automation session through the owning chat/session. Reattempt this thread's supported device open, then install/use the fresh owning-OS Android app with explicit task Metro/API inputs. Complete Android native account tasks; test actual HTTPS resolution before diagnosing DNS. Do not destroy emulator data or change T3/prototype state to clear the lease.
3. Recover supported iOS input, inspect actual app/draft state before retyping, and restore Reduce Motion to its original OFF state. Text size remains original Large. The watchdog persisted after its supported retry; do not bypass the device workflow with SSH UI.
4. Complete native profile outage/retry, stale 412 with draft preservation and explicit reload, authenticated late-response isolation, session list/revoke/logout/switch, old-field clearing, and denied-refresh clearing after current-session revocation. Cross-device acceptance requires both sessions/devices to be available.
5. Complete warm verification, cold/warm reset links and warm recovery for another account: current client session must end and reset heading must take priority. Reuse only the two existing private synthetic fixtures; keep credentials/bearer links private and retain rate limits/cooldowns.
6. Exercise storage failure after private hydration, larger text, reduced motion and supported TalkBack/VoiceOver controls; inspect actual Newsreader 500/600 and Instrument Sans 400/500/600/700 plus full native font-license views. Keep unexercised controls marked unaccepted.
7. Physical iPad acceptance awaits availability; physical iPhone remains deferred. Independent-host recovery G09, production sender/origin activation and shared journeys remain closed. Local avatar removal does not prove recovery confirmation.
8. Preserve task runtime ownership on resume/cleanup: Mac loopback Metro 8082 and its owned ignored `.env.development.local` override belong together. Remove only that owned override after verifying its recorded hash when stopping its Metro. Private Windows Serve 8444 points to loopback 8086; preserve 443/8443 and other projects. Do not reset or clean any checkout as housekeeping.

## Android access retry during this audit

Pixel_10 is booted and shown in this chat's Device panel. Nevertheless, the bound command returned `DEVICE_IN_USE`: the automation lease belongs to session `t3-b3c42592db5b65924b715ca5`, while this thread's binding is `t3-7b1a03fb29d76972b9c1d45c`. `session list` confirmed the older owner, and the supported 15-second wait still did not obtain access. Device-panel visibility does not transfer that lease. No foreign session was reused/closed, emulator destroyed, app installed or Android UI pass claimed. The device-tool instructions explicitly prohibit closing/reusing another session; release must happen from its owner. Private retry logs are under Windows `.kairn/b04-native/android-audit-*.log`.
