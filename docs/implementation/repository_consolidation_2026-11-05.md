# Cross-host source consolidation

Date: 5 November 2026. The user requested that outstanding Kairn work across Windows, WSL and macOS be committed and integrated into development through PRs. This records the pre-integration audit and source selection; GitHub PR/merge history records the resulting integration commits.

## Audited checkouts

| Host | Checkout | Initial source | Working tree |
| --- | --- | --- | --- |
| Windows | Main Kairn checkout | chore/ecosystem-direction at 1ad7970 | Clean |
| Windows | C:/dev/kairn-sdk-refresh | Detached at 189fe49 | Clean |
| Windows | .t3/worktrees/Kairn/test-accounts-b04-native-20261104 | chore/accounts-b04-validation-evidence at 3c7b779 | Clean |
| WSL | /home/dev/dev/projects - WSL/nishanth/Kairn | feat/product-experience-redesign at 86b0fd1 | Clean |
| WSL | /home/dev/dev/projects - WSL/nishanth/Kairn-sdk-refresh | feat/accounts-b04 at 0324b0e | Clean |
| macOS | /Users/nishanth/projects/nishanth/kairn | feat/design-system-redesign at c81f294 | Clean |
| macOS | /Users/nishanth/projects/nishanth/kairn-sdk-refresh | Detached at 189fe49 | Clean |

Inspected registered worktrees, local branches, remote heads and stashes, plus bounded repository discovery under the configured project/worktree directories. No uncommitted source or stashes were found. This is an audit of Kairn, not unrelated repositories on those machines.

## Outstanding work and integration order

- Development initially pointed to d07a69508d98afecb5c9d1b9003956d1db1fa236.
- The ecosystem-planning branch had the existing PR #10 into development. Its actual head 1ad7970822e9a448c062c9040a132925ea478de1 passed Quality, Android and Repository setup required, with no outstanding comments/reviews. It merged normally as 85858c1e5533f8d8bf211c696f2b1d4468b5cc23.
- The design-system branch had the outstanding application and verification commits through 883fffd817a75a29dc884a3ca63a697533b9e5c6. It includes the shared controls/themes, timeline/moment patterns and sample-reader navigation described in the current redesign progress record.
- Windows remains the design-system integration author. The protected checkout helper selected the exact published feature checkpoint; a normal merge incorporated current development at 85858c1. The resulting source merge 938348319c57a35d6df3a6608703ce8c3690a729 was clean.
- Accounts/access, native qualification and account-validation evidence are already included in development through prior PRs. Historical foundation documentation commits e98b9a6/3ed213e, and the Mac account checkpoint 5035b56, are patch-equivalent to integrated changes. They are preserved without reapplying obsolete documentation/code or rewriting branch history.

Host-local settings, signing, dependency trees, generated native output, private evidence and T3 checkpoint refs are preserved. None are staged as application source. Existing local branches and detached historical worktrees are retained.

## Verification and remaining acceptance

The integration PR must pass the existing protected Repository setup required gate on its actual head. Fresh focused browser/prototype/native-source checks accompany it; their results and any corrections belong in the PR and the source verification records. Earlier native artifacts do not qualify this integration's new runtime behavior.

Full redesign, production capture/import/grant/publication, screen-reader/tablet, and remaining native interaction gates remain as recorded in the governing progress documents. Source consolidation does not close those product/release gates or authorize promotion to main.

After integration, synchronize the idle canonical Windows, WSL and Mac checkouts to the exact resulting development commit using the protected helper. Preserve historical worktree refs and all local configuration; do not reset, clean, stash or force-push to reconcile them.
