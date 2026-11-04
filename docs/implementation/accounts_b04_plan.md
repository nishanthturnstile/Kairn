# B04 account and design-system delivery

Date: 4 November 2026. Implements B04 in [plan 1.2](accounts_journeys_access_plan.md), using the [selected decisions](accounts_journeys_access_decisions.md) and [experience handoff](accounts_journeys_access_design.md). “V0.1/V0.4” in the implementation request is interpreted as B01/B04, the batch identifiers in the repository.

## Reviewed starting point

Source checkpoint: `410455d8ae01a1fbcab919b9ebd8824a00ad87fb`. B01 supplies strict Unicode/time/privacy contracts, 47 domain descriptors, generated clients, owned web primitives, licensed source fonts and development-only specimens. It is still incomplete: native specimens, remaining state mappings and actual account flows were not delivered. B02 supplies reviewed migrations 0000–0005 and real-role provisioning/RLS/producer boundaries. B03 and its review corrections supply checked profile/avatar/lifecycle commands, atomic audit/jobs, guarded auth-mail transactions, private avatar processing and restriction recovery through migration 0009. The last full online verification passed on the review correction inputs; that result does not qualify B04 changes.

Live GitHub inspection found no PR for `feat/accounts-journeys-foundation`; remote development/main remain at `605bc61382f2445eb53aea2f64dc6b45c7032641`. The WSL authoring branch `feat/accounts-b04` starts at current development and fast-forwards the prerequisite feature history to 410455d. Publication must reconcile this dependency; do not push B04 onto the old branch or claim its integration is complete. Existing Compose services belong to the other WSL checkout; all new acceptance uses disposable named projects.

## Ordered implementation

| Slice | Deliverable | Boundary and acceptance |
| --- | --- | --- |
| B04.1 Verified account transport | Server-only pinned Better Auth factory, credential policy on creation/change/reset, allowlisted callbacks/routes, guarded transaction/mail enqueue, verified current-session actor resolution and own-account projection. | Real PostgreSQL roles and real Better Auth HTTP requests; Mailpit verification/reset; unverified/expired/reused token denial, rollback on enqueue failure, independent accounts, current-session revocation and retired-subject denial. No shared-data activation. |
| B04.2 Account services | Wire profile update to checked idempotent command/If-Match; own data export; safe session descriptions/revoke controls; bounded avatar HTTP adapter and removal. | Real HTTP/SQL/private storage, stale revisions, invalid type/size, own-only projections, no raw storage paths or session tokens. Restrictive lifecycle continues through B03/B07. |
| B04.3 Web account experience | Registration, verification/resend, sign-in/reset, private profile/security/export/avatar and current-session hydration. Reuse owned shadcn primitives and TanStack Form/Query. | G01/G02 and account G10/G11/G12: real Mailpit and secure-cookie browser flow, keyboard/error focus, password managers, loading/offline/error/denied states, compact/tablet/desktop accessibility. |
| B04.4 Native experience | Actual SDK 58 Better Auth Expo/SecureStore/network integration, awaited cookie transport, hydration and protected intent, account screens, named font weights/licenses and primitives using Unistyles. | Exact pinned native graph; owning-OS frozen install/build; Windows Android emulator, Mac iPhone simulator and physical iPad tasks; cold/warm links, storage failure, account switch and late-response isolation. Physical iPhone remains deferred. |
| B04.5 Qualification | Affected full verification, packaged dependency closure, compiled old-client contracts, actual image/source identity, current device evidence and implementation progress. | Evidence belongs to actual B04 inputs. Missing native/operational results remain open; B04 is complete only when its applicable account gates pass. |

## Implementation rules

- Keep Better Auth `/api/auth` separate from generated `/api/v1` domain schemas. Enable only reviewed auth operations. Generic user deletion/email mutation and arbitrary callback destinations cannot bypass domain lifecycle.
- Use the existing outer auth-mail transaction guard with its transaction-bound Drizzle adapter. Do not assume callback rejection propagates through the pinned library. Never send SMTP while holding the transaction; persist sealed mail plus ID-only job.
- Passwords remain unchanged: 15–128 Unicode scalars, no lone surrogates, offline common/context blocklist, library-owned hashing. Sign-in must continue accepting an existing password independently of creation policy. Failures never echo credentials.
- Resolve a current DB session before provisioning through `identity.ensure_account`; never accept actor/freshness from JSON or bind identities by email. The domain profile owns display name after provisioning.
- Use the existing atomic SQL abuse budgets with a trusted transport IP, HMAC target keys and cooldowns. A forwarded header alone is not trusted client identity. Missing/invalid transport identity fails closed. Keep counters outside failed auth transactions so rollback cannot refund abuse attempts.
- Client auth epochs must cancel private requests and reject late results on logout, account switch and revoked-session detection. Clear Query/private state before rendering another account. Deletion receipts use their separately scoped storage.
- Production HTTPS/origin/sender and independent-host G09 remain activation gates. Accounts can be developed locally; shared journeys remain closed. No EAS, new UI framework, source-import pipeline or public avatar URL is introduced.

## Current execution

B04.1–B04.4 now have implementation in the WSL authoring checkout: failure-only authentication reservations, offline blocklist, trusted ingress/process activation, web account forms, native SDK/SecureStore/network integration, recovery intent and derived named fonts. Avatar retries retain original command identities across a lost completion response. B04.5 qualification is in progress. The [progress record](accounts_journeys_access_progress.md#b04-account-experience-and-native-checkpoint-4-november-2026) distinguishes real-boundary checks from outstanding owning-OS/device acceptance. B04 remains open until those applicable checks are recorded.

## Coverage and evidence

Prefer a few real-boundary scenarios in the existing isolated domain harness, extending it only where a B04 requirement is newly exercised. Reuse B03 SQL/media tests without duplicating them with mocks. Run Vite+ static/build/declaration/boundary checks and affected shared tests; run composed web/native checks as those slices land. Record results and exact limits in [implementation progress](accounts_journeys_access_progress.md). Planning is not acceptance.
