# Accounts and journey access: selected implementation baseline

Date: 3 November 2026. Applies to [implementation plan version 1.2](accounts_journeys_access_plan.md). Status: selected design/engineering baseline under the request to finalize the plan; application implementation and operational qualification have not run. This records explicit choices for this workstream, not historical user approval, a deployment authorization or a compliance certification.

Requirements and architecture remain authoritative. The numerical policies below are intended behavior and test configuration, not measured availability, delivery or deletion promises. Change them through a reviewed contract/configuration change rather than silently substituting library defaults. The [starting guide](accounts_journeys_access_start.md) explains delivery order and what the user needs to provide later.

## 1. Decision status

| Decision | Final implementation direction | Status |
| --- | --- | --- |
| D01 Independent recovery destination | Required append/receipt/head/integrity adapter; no local stand-in qualifies. Shared-data activation defaults closed until the actual independent destination and restore drill pass. | Architecture/interface selected. Actual destination, access and independent failure-domain evidence are external integration inputs. |
| D02 Origins and links | Use the existing private HTTPS API/web origin and development app scheme; email/password only. Fragment-carried domain invites, allowlisted auth callbacks and explicit native/web fallback. | Selected for development. Public domain/verified sender remain deployment inputs. |
| D03 Authority/People | One current administrator; accepted transfer; independent coauthor/publisher grants. Minimal non-admin roster. | Selected; section 2. |
| D04 Forms/offers/abuse | Explicit bounds, expiry windows and PostgreSQL-backed budgets. | Selected; sections 3–4. |
| D05 Authentication | Verified email/password, fixed maximum session lifetime, fresh authentication for sensitive actions, bounded reset/verification tokens and current DB sessions. | Selected; section 5. |
| D06 Time/category/history | Intended instants plus IANA context; explicit ambiguous-time handling; canonical start-year filtering; small optional category enum. | Selected; section 6. |
| D07 Assets/components | Existing field-journal system; pinned font source artifacts and weights; defined light/dark-surface focus and enabled-control borders. | Selected inputs; packaging/rendering is implementation work, not another brand decision. |
| D08 Retention/status | Concrete bounded internal defaults, opaque history/tombstones and a separate deletion receipt. Recovery-journal retention is constrained by every restorable backup. | Selected targets; production terms require verified operational configuration. |
| D09 Devices | Windows Android emulator, Mac iPhone simulator and available physical iPad; physical iPhone remains deferred. | Selected qualification scope. Device availability/signing is checked when the affected build runs. |
| D10 Lifecycle | Admin-authorized canonical deletion, two requester confirmations, no invented group consent; archived collaboration is closed; account deletion withdraws owned-source reuse. | Selected; section 8. |
| D11 Restore fence | Maintenance outside the restored DB, stopped/restart-disabled services, DB writer/login/session fencing, independent-head replay, and new credential generation before release. | Selected mechanism; actual host/role/destination proof is an activation gate. |

No unresolved product choice in this register prevents starting schema/contracts and local implementation. External destination/sender/domain credentials and runtime acceptance cannot be completed on paper. They remain explicit activation gates rather than reasons to invent provider configuration or claim the whole milestone passed.

## 2. D03: administration, capabilities and disclosure

- A journey starts with one active administrator. The creator also starts as coauthor and designated publisher. Any number of active accepted members may be explicitly granted coauthor/publisher powers.
- Administration moves only through a current administrator's offer and acceptance by an existing active coauthor. The target gains administration; neither person's coauthor/publisher powers change implicitly. No ordinary capability edit may add a second administrator or revoke the last one without the transfer/departure coordinator.
- Keep explicit capability records. For administration, use a constrained journey ID on the capability row, bound by a composite membership/journey FK, and a unique active-administrator index per journey. Membership end/transfer revokes the old assignment transactionally. A zero-administrator state is allowed only with the documented freeze/terminal lifecycle, never as an accidentally expansive journey.
- The People editor displays administration as a named fact plus **Transfer administration**, and coauthor/publisher as independent editable powers. A “role” dropdown cannot silently bundle them.
- Active coauthors or the administrator may correct the journey title/intended dates while collaboration is open. This event-metadata permission does not give an administrator access to shared draft or other contributors' sources. Publishers without either authority cannot edit those fields.
- Administrators see accepted members' display identities/powers/status and the invitation details needed to manage their own journey. Emails are not a general member directory.
- Other members see their own membership/powers and the administrator's display identity. A contributor can inspect the current named coauthor/publisher review audience before granting scope; a coauthor/publisher can see permitted contributor attribution alongside permitted sources. Neither is a full participant-roster grant. Public roster/profile exposure remains opt-in later work.
- Source ownership is never assigned by the People editor. Former members retain owner-only restrictive actions through the later Your contributions entry; the normal protected journey URL remains unavailable.

The admin limitation is an implementation choice within the existing role model, not an ownership claim. An administrator may archive/delete the canonical record under section 8, but cannot transfer ownership of or delete another person's private originals.

## 3. D04: forms, identities and expiry

| Input/state | Selected rule |
| --- | --- |
| Display name | 1–80 Unicode code points after trimming non-secret surrounding whitespace. Preserve the person's text; do not derive public identity from email. |
| Journey title | 1–160 Unicode code points after trimming; no empty/whitespace-only value. |
| Bio | Optional, at most 500 Unicode code points; plain text. |
| Invitation | Seven days from issue; one current pending offer per guarded journey/recipient. |
| Transfer offer | 72 hours from issue; one current pending transfer for the sole administrator/journey. |
| Impact preview | Five minutes, plus exact actor/action/target/revision/generation binding. Time remaining never overrides changed policy. |
| Domain invitation/impact/status secret | At least 32 cryptographically random bytes; hashed server-side; no token in ordinary logs, analytics, Query keys or referrers. Auth-library token generation remains library-owned. Original-export grant IDs are references, never bearer authorization to file bytes. |
| Original-export approval | Default 24 hours, owner can choose a shorter interval or up to seven days. Must pin each asset/source revision and recipient epoch. No indefinite grant or future-files wildcard. |
| Pagination | Default 20, maximum 100; opaque cursor bound to actor/scope/filter and immutable tie-breaker. |
| Domain JSON request | 64 KiB maximum for this slice, with narrower per-field limits. Avatar bytes use a separate bounded upload path. Auth-library transport limits must also be configured and qualified. |

Non-secret text length is identical in native/web/server validation and generated contract documentation. Passwords follow section 5 and are never trimmed/truncated. Invalid local values get fast inline correction; server state remains authoritative.

Resend retransmits only a still-pending unchanged offer with its original expiry and available sealed mail payload. It does not extend the offer. Reissue creates a new ID/secret, supersedes old rights and advances the recipient guard. A revoked/consumed/expired invite cannot become pending again. Leave/removal/account deletion invalidates all older pending offers and their epochs, including a second invite issued before removal. Natural expiry is checked from server time at use.

## 4. D04: initial abuse budgets

These are conservative initial limits for local/integration qualification, adjustable in reviewed configuration after measured use. Apply all relevant account/IP/recipient budgets, not whichever is easiest to pass. Expiry/revocation checks still run; a successful idempotent retry never repeats the side effect.

| Operation | Initial budget |
| --- | --- |
| Sign-in / sensitive reauthentication failures | Five per 15 minutes per account-identifier+IP key, plus 30 per 15 minutes per IP. Generic failure; bounded delay/backoff rather than a permanent attacker-triggered account lock. |
| Registration | Five per hour per IP. Enumeration-safe response. |
| Verification/reset request or resend | Three per hour per normalized recipient key, 20 per hour per IP; at least 60 seconds between sends to the same target. Do not disclose whether an account exists. |
| Journey invitation create/reissue | 20 per hour per administrator account and journey, 100 per day per administrator, three deliveries per hour per recipient target. |
| Invitation secret resolution | 30 per ten minutes per IP; bounded payload and generic unavailable response. |
| Invite acceptance / transfer acceptance / policy mutation | 30 per ten minutes per account; same-command replay reconciles current state. |
| Export request/approval | Ten per hour per account; at most one pending archive export when actual archives arrive. Bounded profile JSON export needs no archive job. |
| Operation-status polling | Client interval five seconds initially, backing off to 30 seconds; server limit 60 reads per minute per operation receipt/account and 120 per minute per IP. |

Use atomic PostgreSQL counters with trusted Caddy proxy/IP handling and non-enumerating `429` plus retry guidance. Retain counters no longer than 48 hours after their longest active window. Avoid raw recipient emails in generic counters/logs; keep restricted target lookup in the identity/invitation boundary. A distributed Redis service or new CAPTCHA provider is not selected. Exercise concurrent exceed/retry and pre-verification recovery in G01/G08.

## 5. D05: authentication and reauthentication

| Policy | Selected behavior |
| --- | --- |
| Sign-in methods | Verified email/password. No social login, passkey, organisation-based journey model or client-managed JWT scheme introduced. |
| Password | 15–128 Unicode code points; passphrases/spaces, password managers, autofill, paste and show/hide supported. No composition puzzle, truncation, security questions or scheduled password replacement. Reject common/compromised/context-specific values through a bounded offline blocklist at creation/change/reset. Preserve library-owned secure hashing; no custom hashing algorithm. |
| Password validation integration | Enforce the same scalar-count/blocklist policy on all server credential paths. Map the pinned library's length options to that policy and test Unicode boundaries rather than assuming JavaScript code units equal code points. No silent trimming or normalization introduced independently on one client. |
| Session maximum | 30 days from authentication; disable rolling refresh for this baseline. Reauthentication creates a current session under the same maximum, not an indefinite background renewal. |
| Sensitive-action freshness | Ten minutes, with current server validation. Required for capability changes, accepted administrative transfer, leave/removal/archive/deletion, original-export approval, credential/email change and session-revocation controls as applicable. Recheck impact afterward. Owner-only source withdrawal/narrowing and export revocation can deny with a valid current session; no extra freshness prompt delays that safety restriction. Broad byte deletion still uses fresh impact/confirmation. |
| Email verification | Token valid for 24 hours; signup does not establish a usable unverified domain session. Rate-limited resend remains available through the library's enumeration-safe flow. |
| Password reset | Token valid for 30 minutes; use once; successful reset revokes prior sessions. Test the pinned adapter's actual commit/revocation behavior. |
| Session storage/cache | PostgreSQL-backed sessions; secure HttpOnly browser cookie and Expo SecureStore native transport. Disable positive cookie session caching for this baseline; domain permissions always read current state. |
| Account/email reuse | New verified auth identity means a new domain account. Old domain tombstone, membership, recipient offers or export grants cannot be rebound by email. A retired-subject deny record blocks the old auth identity even if live-row purge/detachment only partly completes. |

The password direction is informed by the [current NIST password guidance](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/), including long single-factor passwords, blocklists and assisted entry. This selection is not an assertion of NIST assurance-level compliance. The [Better Auth 1.7.15 options](https://github.com/better-auth/better-auth/blob/v1.7.15/docs/content/docs/reference/options.mdx) and [session guide](https://github.com/better-auth/better-auth/blob/v1.7.15/docs/content/docs/concepts/session-management.mdx) support explicit expiry/freshness/refresh controls; qualify their actual configuration in B02/B04. Do not use an option value of zero that disables a required freshness check.

## 6. D02/D06: links, time and history

### Development origins and links

- Canonical local HTTPS browser/API origin: `https://nishanth-windows.tail30fb6a.ts.net:8443`, as recorded in the host guide. Native development scheme: `kairn-dev://`. Keep existing bundle/package ID `dev.kairn.app`.
- Browser domain writes use the canonical same origin. Approve explicit additional loopback development origins only in a reviewed host configuration if actually needed; do not trust arbitrary LAN/Expo hosts or infer authentication from a missing Origin.
- Invitation email opens canonical `/invite#token=...`; the app resolves through a redacted-body POST. Offer explicit **Open in app** or manual-code fallback using the allowed development scheme. No GET or link-preview side effect; no need for paid Apple universal-link entitlements to start locally.
- Auth verification/reset links remain the pinned library's format and allowlisted callback paths (`/verify-email`, `/reset-password`, auth-specific native callback). Do not blindly rewrite library tokens into the domain invitation format. Redact query secrets, use no-referrer on token-bearing surfaces and reject arbitrary redirect destinations.
- Persist invite intent only for its bounded validity in a dedicated protected intent store, not in ordinary Query keys. Hydrate auth before navigating; sign-in never implies invite acceptance.
- Production domain, permanent app identifiers and Resend verified sender are deployment inputs. Mailpit/private routes qualify local behavior without pretending production email is ready.

### Time, categories and private history

- Required start: intended date/time to minute precision, explicit IANA timezone and resolved instant/offset. End is optional, in the same journey timezone for this slice, and cannot precede start.
- Show the device timezone as a visible suggestion. Reject nonexistent daylight-saving local time; ask which offset applies for an ambiguous time. Preserve the selected local/offset context; no invented UTC conversion or automatic “completed” status.
- History year uses the canonical start in the journey's timezone. Category is optional; initial values are `hike_trek`, `cycling`, `road_journey`, `other`, with plain human labels. No category is inferred from a destination or source.
- Keep one reference per account/journey, regardless of multiple roles. Active/archived entries show only current permitted data. Former participation can retain opaque ID, the person's own past role and end date with a neutral unavailable label; no protected title/cover/location/roster remains in that projection.
- Year/category filtering that requires unavailable journey fields excludes former references and explains that omission; the Former status filter still reaches them. A normal journey URL remains generic unavailable. Account deletion removes that account's normal history access altogether.

## 7. D07: selected assets and identity media

### Fonts and components

Use the existing Newsreader editorial / Instrument Sans interface system, light-first Paper/Forest/Clay palette and shared scales. Font sources are pinned in [font source evidence](../research/accounts-journey-access/font_sources_2026-11-03.json): actual downloaded TTF/license/metadata checksums, not only family names.

- Newsreader normal, weights 500/600, optical size 16 baseline with the specified display scale.
- Instrument Sans normal, weights 400/500/600/700, standard width 100.
- Ship the corresponding license notices. Web uses self-hosted WOFF2 outputs from these inputs where produced; native uses correctly mapped named weights through Expo Font. B04 records derived hashes and the exact build transformation, and proves real iOS/Android weight rendering; synthetic bold/fallback is not acceptance.
- Empty/no-cover state: owned simple field-note/journey-line vector composition, no stock destination photography, generated journey data or new icon family. Lucide remains the selected utility icons.
- Enabled borders use Ink 500 on Paper; Line 200 is a separator. Preserve Paper separation around Clay light-surface focus, and a Paper companion on dark/Forest surfaces. Follow the existing handoff's actual-adjacency checks.

### Bounded avatar dependency

Avatar selection accepts one JPEG/PNG, at most 5 MiB and 12 megapixels, and produces a metadata-stripped 512×512-or-smaller representation without upscaling. Default initials work while absent/pending/failed. Qualify the native picker format/explicit conversion path; unsupported HEIC must produce a useful correction, not be trusted as JPEG because of its extension.

Use a short-lived authenticated upload, private quarantine, server actual-type/pixel validation and bounded Sharp re-encoding in the existing worker boundary. No direct public bucket/raw download. Keep one active avatar plus one bounded pending replacement; abandon unlinked uploads after 24 hours. Replacement preserves the current valid avatar until the new sanitized representation commits. Deletion removes normal access immediately.

Use selected S3/Sharp dependencies; no FFmpeg, ExifTool, map or full source-import pipeline is required for this identity flow. Small profile export is current authenticated JSON plus an authorized managed-avatar manifest, with no ZIP/polling job. This is not completion of uploaded-original/story export.

## 8. D10: lifecycle policy selected for implementation

### Canonical deletion and administration

The current sole administrator can request canonical deletion. Require fresh authentication, a version-bound impact preview, a named-resource confirmation and a second explicit typed-title confirmation. No independent-member countersignature is required in this baseline. Explain that this is the administrator's privileged action, not group consent, and that every reference becomes unavailable while other owners keep their private originals. Publisher/coauthor/participant status alone cannot delete the canonical record.

There is no ordinary “claim orphaned administration” flow. If the last administrator departs without accepted transfer, revoke their powers and freeze expansion/new publication/visibility widening. Existing permitted reads/exports and owner restrictions remain. Recovery requires a separately authenticated and audited operator/ownership-resolution process; it cannot grant source ownership or erase restrictions.

### Archive

Adopt the plan's section-5.3 matrix: existing authorized draft/review reads and permitted exports remain; new contribution, shared editing, event-detail correction, scope expansion, invites/acceptance and capability expansion stop. Prior pending expansion offers are invalidated. A fresh accepted administration transfer to an existing eligible coauthor can maintain continuity; no new member is admitted through it. New publication/republish/widening is blocked; authorized unpublish/narrowing and owner withdrawal/deletion remain available when those modules exist. Exact-original owner approval for already contributed assets is permitted under its separate current checks. No unarchive control is implemented in this slice.

### Account deletion and retention choice

Adopt section 5.4 with a single initial policy: withdraw the deleting owner's journey reuse, invalidate both issued/received original-export permissions and account-bound offers, and block managed reads immediately through the owner-account deny. There is no “keep my sources shared after deletion” checkbox in this slice. Keep other owners' originals/canonical records, apply accepted transfer or freeze, then purge eligible owned bytes/PII under section 9. Do not cascade through shared history/audit. Deletion status survives logout through its narrowly scoped receipt.

Later retention/continued-use features need an explicit revised owner-consent contract and review. They cannot be inferred from a historical publication grant or silently added by an operator.

## 9. D08: retention, cleanup and recovery targets

These are selected initial configuration targets to implement and test. Before production activation, verify actual provider/backups and publish terms that match; no target below is an executed or legally certified guarantee.

| Record/window | Selected initial target |
| --- | --- |
| Access deny | Immediate on local commit, including owner-account deny during bounded cleanup. Journal confirmation may remain pending. |
| Active-system owned-byte/PII purge | Complete policy-eligible purge within 30 days from the accepted local request, not delayed until a journal receipt arrives. A failed/delayed operation is escalated and shown accurately; byte purge never means backup bytes already vanished or recovery confirmation is complete. |
| DB/object backup retention | Initial operational target 35 days; actual off-host setup/checkpoints must verify it before activation. Never expire restriction history based on an assumed backup expiry. |
| Restriction journal | At least 90 days and, if longer, through retirement of every backup that could restore the superseded rights plus a seven-day safety margin. Missing completeness/retirement proof blocks journal garbage collection. |
| Deletion status receipt | 45-day hard validity from issue, terminal status available for seven days within that window. Server hashes the secret; native separate SecureStore namespace; web per-operation path-scoped Secure/HttpOnly cookie. Rotation cannot silently extend the hard window. |
| Operation delay escalation | Alert operator after 15 minutes without expected confirmation progress; escalate missed 30-day purge/recovery window. Receipt expiry provides only a generic safe support route, never account access. |
| Audit/security event metadata | 365 days; retain a minimal related restriction record longer if needed for restorable backups. No secrets/media/precise locations. |
| Safe operational request logs | 14 days; no bearer URLs, email bodies/passwords or precise private content. |
| Notices | 90 days, with inaccessible targets sanitized. Active operation status remains separately available for its window. |
| Sealed mail payload | Until the bound token/offer expiry plus at most one hour for cleanup; delayed jobs cannot use an expired payload. Minimal safe delivery metadata 30 days. |
| Terminal invite/transfer recipient PII | Purge within 30 days of terminal state; retain only opaque admission/deny barriers necessary to prevent replay, under current journey/backup policy. |
| Abandoned avatar upload | 24 hours; never publish quarantine bytes. |
| Command receipts | 30 days plus a minimal resource/operation identity barrier as needed to prevent duplicate creation. After receipt expiry, reconcile by canonical resource ID; do not blindly repeat a destructive command. |

Deleted account/journey tombstones contain only the opaque relational identity and justified deny/audit metadata. Active account private-history former references follow section 6; deletion/new email registration does not recreate them. Legal/incident holds, if actually required later, must be separately recorded, access-controlled and disclosed; this plan invents no hold or legal basis.

Retain the retired-auth-subject barrier while the old live auth record exists or any retained backup can restore it, with the restriction-journal safety margin. Purging a nullable auth FK is not evidence that the identity was retired. Session/provisioning hooks and restore replay check this barrier before creating usable domain access; G10 includes an auth-purge failure/retry case.

## 10. D01/D11: concrete activation gate

### Independent journal integration record

Before real shared-data activation, operations must supply and verify: destination type/endpoint, independent machine/provider/failure domain, append-only application credential and separate retention administrator, idempotency behavior for event UUIDs, durable receipt semantics, ordered head/checkpoint and integrity checks, encrypted storage/key recovery, backup generations/expiry evidence, and operator escalation owner. Secrets stay in the secret/host configuration mechanism, never this document or chat.

The deployment capability flag stays closed until this record and G09 pass. A local test append adapter is explicitly a failure fixture. If an available backup destination cannot provide the required append/head/integrity semantics, implement the reviewed coordinator there or choose an independently hosted alternative before activation; do not call an ordinary object upload equivalent proof.

### Writer fence

Implement the single-VPS fence in plan section 8.3 using external maintenance/service controls, writer roles set unable to establish new sessions, termination of old pooled sessions, disabled automatic service restart and replay-only credentials. Restore under that fence, reapply it if restored role metadata differs, obtain the independent head and replay. Release using a new writer credential generation only after completeness/integrity tests pass; old credentials remain invalid.

G09 must actually attempt a commit/reconnect from the old API/worker during the drill and show it rejected. The chosen mechanism is final; actual deployment role names, network access, credentials and proof are implementation/operations inputs. Local schema, contracts, policy, design and auth work can start without claiming this activation gate passed.
