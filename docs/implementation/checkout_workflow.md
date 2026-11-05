# Branches and checkouts across Windows, WSL and Mac

Date: 3 November 2026. This is the current source/branch operating policy. The [host guide](native_host_setup.md) owns tool activation, ports, Metro and signing. The [reconciliation record](checkout_reconciliation_progress.md) records the preservation and verification work. Historical source-transfer procedures are not the everyday workflow.

## 1. Branch model

- `main` is the stable promoted source; `development` is the integration branch.
- Start `feat/*`, `fix/*` or `chore/*` from current `development`. Feature PRs target `development`, with the existing required CI gate. Never keep editing the former branch of a merged PR.
- Promote a reviewed integration checkpoint through a `development` → `main` PR. After its exact head passes required checks, the maintainer/agent advances `main` to that exact `development` commit with a normal fast-forward push. GitHub recognizes the included PR as merged. Never force-push, disable checks or rewrite shared history to make the branches agree.
- This promotion preserves identical commit IDs on `main` and `development`. A promotion using an extra GitHub merge commit instead needs a checked fast-forward of `development` to that resulting `main` commit. The branches may intentionally differ while unpromoted feature work is being integrated; they agree at a completed promotion.
- Keep the current check protection/admin enforcement, no-force/no-delete policy on both long-lived branches. Use feature/release PRs for review. Required status checks alone do not technically require a PR; do not treat a successful direct push as permission to skip the review workflow.
- CI policy selected by the user on 5 November 2026: PRs targeting `development` run dependency-free whitespace, unresolved-merge-marker and package-JSON checks only. The existing `Repository setup required` gate remains mandatory. PRs targeting `main`, pushes to `main`, and explicit workflow dispatch run the full Quality and Android suites. Development pushes do not duplicate CI. Fast integration checks are not application/native acceptance evidence; production promotion retains the full gates.
- A hotfix begun from stable `main` needs review and immediate reconciliation into `development` before normal development continues. No automatic merge/conflict resolution is part of source synchronization.

## 2. One authoring checkout per active task

| Host/checkout | Normal role | Where edits happen |
| --- | --- | --- |
| Windows: `C:\Users\Nishanth Murugan\projects\projects - WIN\Kairn` | Android, its Metro/dev client and the usual Windows editing session. | Mobile/shared changes normally start here for immediate Android Fast Refresh. |
| WSL Ubuntu: `/home/dev/dev/projects - WSL/nishanth/Kairn` | Compose, API/worker/data services, web/backend development and Linux verification. | For the fast backend/web loop, open this checkout through a WSL-aware editor/session and use Compose Watch here. |
| Mac: `/Users/nishanth/projects/nishanth/kairn` | iOS Metro, simulator/device builds, Xcode signing and native-specific fixes. | Usually consumes a published feature checkpoint. Author a native fix here only after an explicit clean source handoff. |

Choose the authoring checkout at the start of a task; the other hosts consume its checkpoints. Do not edit the same feature branch independently on several machines at once. If changing authoring host, commit and push intended source, verify a clean checkout, then sync the receiving host to that exact commit. Unpublished local branches stay preserved; the helper never resets them.

Windows/WSL are two separate Git clones on one physical computer. Linux uses its own filesystem, not `/mnt/c` dependency/build trees. Do not use OneDrive, bidirectional folder sync, or a live rsync mirror for these repositories. Git transfers source; each OS owns dependencies and generated output.

An edit on Windows does not instantly change WSL's Compose source. Use Windows for immediate Android UI iteration; use WSL as author for immediate backend/web Watch iteration. Push a coherent checkpoint when another OS needs it. The agent can execute the host handoff for you; it does not require copying files manually or committing every keystroke.

## 3. Everyday commands

At rest, keep each host on clean `development`. Activate its pinned tools as documented, then inspect:

```sh
pnpm checkout:status
```

Start a feature on its authoring host only, after fetching/current-development verification:

```sh
pnpm checkout:sync --branch development --commit <expected-full-remote-SHA>
git checkout --no-overwrite-ignore -b feat/account-identity
```

After reviewing/staging only intended source and committing it on that feature, push it. On the receiving host:

```sh
pnpm checkout:sync --branch feat/account-identity --commit <published-full-feature-SHA>
```

The expected SHA is a guard against a moved branch tip. If it differs, stop and reconcile which input should be tested; do not silently test a newer commit. Use a separate published checkpoint branch if historical verification is needed. A new branch is created tracking `origin`; an existing branch advances only by fast-forward. Omit `--commit` only when deliberately requesting the latest fetched branch tip.

The helper uses only Node built-ins/Git and can also run as `node scripts/checkouts.mjs ...` before dependency install. Windows activates `. .\.kairn\env.ps1`; Mac and the configured WSL checkout activate `. .kairn/env.sh`. WSL's ignored activation points to its existing pinned Node installation and a checkout-local pinned pnpm; it does not change other projects' global defaults. Application verification remains in Compose tooling.

Stop active native builds, dependency installation and source Watch processes before a source/dependency checkpoint change. The helper never kills another session, stops services, operates a device or pulls in the background while you are typing. Restart the appropriate Metro/Compose Watch after the handoff; ordinary JS edits then use the normal hot-reload loop.

## 4. Preservation contract

`checkout:sync` fetches and verifies source without pushing, cleaning or resolving conflicts. It:

- refuses tracked/staged/untracked source changes and ahead/divergent target branches;
- guards ignored-file collisions, including case-only and file/directory conflicts;
- uses Git's no-overwrite-ignore checkout and a pinned-SHA fast-forward;
- backs up/checks the known local environment/tool/signing files before switching;
- preserves ignored dependencies, generated output, local environment files and signing material;
- verifies clean source and exact resulting SHA, then writes ignored `.kairn/verification/checkout-sync.json` with changed inputs and preservation evidence;
- serializes its own runs with a per-checkout Git-directory lock and stops on uncertainty. It never runs reset/clean/force-push/stash, installs packages or silently removes another branch/worktree.

Backups live in ignored `.kairn/checkout-backups/`; they contain private host configuration and must not be staged or uploaded. A sync failure leaves the evidence and original branch refs available. Reconcile the actual files/commits; do not “fix” it with a blanket stash/reset/clean. The helper is not a replacement for committing source or backing up credentials independently.

The old `development` snapshot lacked the current ignore rules, so generated dependencies and `.env` appeared untracked. This is not a reason to commit them. Restoring the reviewed source/ignore rules suppresses that noise. Never use `git add .` to resolve an unknown mass of untracked files; inspect and stage an explicit source allowlist.

## 5. What changes require after syncing

| Input change | Follow-up on the owning OS |
| --- | --- |
| Only ordinary JS/TS/UI source | Rebuild shared-package exports if needed; run affected tests and use the existing compiled dev client/Metro. |
| Dependencies/lock/tool inputs | Frozen install separately on each host; inspect the actual lock/module changes. A root script-only package edit does not itself require a native rebuild. |
| Expo config/native dependency/Pod lock inputs | Locked owning-OS native regeneration/build/qualification under the host guide. Preserve local signing; never copy Pods/Gradle/node_modules from another host. |
| Compose/server/shared build inputs | Build the current WSL checkout into the tooling/runtime image. Use `run --build` or an immediately preceding explicit build; cached images are not proof of current source. |
| Signing-only repair | Use Mac-local incremental signing procedures; avoid clean prebuild/Pods churn. |

Changes on another host are not verified until its checked-out SHA and relevant input hashes match. Record build source, runtime source/Metro, installed artifact, actual device and CI head separately. Do not attribute an old installed binary to the new branch just because source synchronization succeeded.

## 6. Completing a feature and promotion

1. Review the feature PR into `development`; run actual required CI and affected local native checks.
2. Merge it into `development`, then synchronize replicas to the resulting integration SHA. No reset to an older feature head.
3. Open the promotion PR from `development` to `main`; wait for required checks/review on its actual head and confirm current `main` is an ancestor. If either branch moves, re-evaluate the promotion.
4. Fast-forward `main` to that exact checked development SHA, without force or protection changes. Verify GitHub marked the PR merged and both remote branch IDs agree. If GitHub refuses, resolve the required checks/restrictions; do not bypass them.
5. Fast-forward local long-lived refs as needed and run the sync helper on idle Windows/WSL/Mac checkouts to the promoted `development` SHA. Keep local feature/safety branches and host outputs; no cleanup is implicit.

No timer/cron job auto-merges or auto-checks out source. These are explicit, repeatable handoffs with a clear author and checkpoint. They protect local work while allowing the agent to coordinate the commands across connected hosts.
