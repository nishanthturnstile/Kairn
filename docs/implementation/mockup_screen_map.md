# Kairn mockup screen map

Date: 5 November 2026. Status: functional screen mapping complete for the current workflow inventory; the connected static flow and scope-to-preview refinement now have 108 screen/state frames, with broader inventory coverage still partial. The user requested screen mapping before mockup production. [DESIGN.md](../../DESIGN.md) remains the design authority: this map selects no visual identity, navigation chrome, page layout or implementation sequence.

Use this map to choose a connected mockup task, find its platform equivalents, and include its permission and recovery states. Existing screen IDs describe responsibilities. A responsibility may become a page, section, inspector or overlay when designed; it is not automatically a separate page or route.

## 1. Scope and how to use the map

The map reconciles the [canonical inventory](../core/application_design.md), [mobile contracts](mobile_workflow_specification.md), [creator-web contracts](creator_web_workflow_spec.md), [public-web contracts](public_web_workflow.md), [shared workflows](lifecycle_workflow_spec.md), and [account handoff](accounts_journeys_access_design.md). Requirements and selected domain decisions retain authority over behavior. Existing specification labels and decompositions remain revisitable interaction proposals.

| Register | Coverage | Interpretation |
| --- | --- | --- |
| Mobile | All 48 A-screen/overlay contracts across A01–A09 | Android and iOS share task identities; platform adaptation still needs design and verification. |
| Creator workspace | W01–W08, including their internal task states | Inspectors/forms remain under the owning W ID. |
| Web history and account | W09 with nine named child compositions | Shared account tasks also reference E IDs; these are aliases, not additional products. |
| Public and supporting web | All 17 inventory entries: P families/subflows, private research and X handoffs | Some entries resolve to existing E/W tasks rather than new screens. |
| Shared account/access | E01–E16 mapped to native and web owners | Sign-in, verification, recovery and sensitive-action returns have one functional contract. |
| Lifecycle | L01–L16 mapped to invokers, review and result | Action contracts, not 16 additional destinations. |
| Native boundaries | All seven X-dot destinations | OS/provider handoffs and launch resolution, not seven app-owned pages. |

Do not add these counts together as a page or frame estimate. States, sizes and platform adaptations multiply frames; aliases and reusable compositions reduce duplication.

**Current mockup status:** the [first connected static flow](../../design/flow-wireframes.pen) contains 108 screen/state frames, 108 external annotation panels and overviews `00 / OjON2` and `R00 / OLIDE`. Frame-level coverage/status is recorded in the owning workflow specifications under “First connected static wireframes” and “Scope-to-preview refinement”. Remaining dedicated destinations and platform compositions are listed in the [shared workflow record](lifecycle_workflow_spec.md#remaining-decisions-and-undrawn-scope). Other entries remain mapped but undrawn; no visual-system approval is claimed. As mockups are made, record the artifact/frame, state, size, review result and remaining work in the owning workflow specification, with selected decisions linked from DESIGN.md. Avoid a second competing screen-status ledger.


The Entry and Forward columns below show principal connections for planning. The full mobile directed ledger, creator N01–N27 register and public adjacency register remain the complete edge records. Global navigation, caller-specific Back/Cancel, auth, access denial and cold-link fallbacks apply in addition to the listed paths.

## 2. Shared navigation and return rules

- Preserve the same canonical journey across capture, editing, approval, reading and highlights. Research-to-create carries a reference into a distinct event, never a copied completed trip.
- Native working destination meanings are Journeys, Capture, Moments and You; their placement/grouping is open. Capture navigation never starts recording. Creator tools are capability-filtered; W07 is contextual. Story/Explore/Learn are views of one approved record, not separate copies.
- Back/Cancel returns to the actual permitted invoker with selection, filters, scroll and supported draft state. Native cold-task fallbacks are A01 for journey work, A04 for own sources/imports, and A09 for account work. Web falls back to an authorized owning list/history; public unknown callers have a safe Story/Discover parent.
- E01/A09.auth returns through session hydration and current authorization. E04/A09.reauth returns to refreshed action impact. Neither auto-accepts an invite, asks a question, publishes, exports or confirms a destructive action.
- Local save, verified private backup, contribution scope, draft save, approved publication, listing and original-file export are separate facts. Prototype simulations must label their scope and cannot claim real saving/sync/deletion/publication.
- Access loss removes protected content and resume context. Own-source access is independently authorized; it must not reopen a former member's workspace. A post-account-deletion E14/A06.operation receipt remains narrowly scoped and outside account guards.
- Native-to-browser continuation authenticates independently and rechecks the same permitted task. Do not transfer credentials. Browser import/recovery must not claim native capture durability.

## 3. Mobile screen map

Source: the [48 detailed contracts and full directed edge ledger](mobile_workflow_specification.md). All rows inherit the shared navigation rules and the state matrix in section 9. A row's final column highlights additional distinguishing states, not an exhaustive replacement for its contract.

### 3.1 Journeys and entry

| ID and task | Principal entry | Forward task / completion | Distinguishing mockup states |
| --- | --- | --- | --- |
| [A01](mobile_workflow_specification.md#screen-a01) Your journeys | App/root; resolved auth/invite; safe history return | A01.create, A01.join, A01.notices, A06 | First-use empty, filtered-empty, stale/offline, neutral former reference. |
| [A01.create](mobile_workflow_specification.md#screen-a01-create) Create journey | A01; A09.research reference | Confirmed creation → A06; cancel → caller | Date/timezone validation, ambiguous time, retained offline form, uncertain result. |
| [A01.join](mobile_workflow_specification.md#screen-a01-join) Invitation review | A01; notices; validated invite link | A09.auth when needed; explicit accept → A06; decline → A01 | Wrong account, expired/revoked/consumed invite, existing membership, offline. |
| [A01.notices](mobile_workflow_specification.md#screen-a01-notices) Attention | A01 | A01.join, A06.transfer, A07.conflict, A06.operation, permitted A06 | Empty, failed refresh, unavailable target without protected snippets. |

### 3.2 Capture, personal moments and import

| ID and task | Principal entry | Forward task / completion | Distinguishing mockup states |
| --- | --- | --- | --- |
| [A02](mobile_workflow_specification.md#screen-a02) Capture workspace | Root; A04; A06; capture another from A03 | A02.destination; local-save result → A03; A05; X.settings | Photo/video/voice/text, denied permissions, unknown location, low storage, interrupted recording. |
| [A02.destination](mobile_workflow_specification.md#screen-a02-destination) Destination and audience | A02 | Apply/cancel → capture caller | Personal/Only me, selected journey, stale membership, no journeys; no automatic contribution. |
| [A03](mobile_workflow_specification.md#screen-a03) Capture confirmation | A02 save attempt | A02; A04.moment; A04.queue; A04.scope | Saving, staged/interrupted, saved locally, failed/no space, queued, verified private backup. |
| [A04](mobile_workflow_specification.md#screen-a04) Personal moments | Root; approved A05 result | A02, A05, A04.moment, A04.queue, A04.scope | Empty, selection/filter, missing local bytes, processing failure, offline. |
| [A04.moment](mobile_workflow_specification.md#screen-a04-moment) Source detail | Library, capture result, queue, permitted review/editor, own contributions | A04.scope/queue/export; A06.lifecycle; A07.chapter; A09.export | Owner versus review-only projection; missing file; transcript review/correction, pending/failed/unsupported processing; source withdrawn. |
| [A04.queue](mobile_workflow_specification.md#screen-a04-queue) Sync and transfer queue | A03/A04/detail; approved import; storage | Item → A04.moment; auth → A09.auth; conflict → A07.conflict; A09.storage | Wi-Fi/quota wait, interrupted transfer, checksum/finalization failure, missing bytes. |
| [A04.scope](mobile_workflow_specification.md#screen-a04-scope) Contribution scope | Capture, personal selection/detail, import, source review | Apply → caller; narrow/withdraw → A06.lifecycle; separate A04.export | Only me / Journey review / publication-and-sharing eligibility; mixed selection, changed audience, pending request. |
| [A04.export](mobile_workflow_specification.md#screen-a04-export) Exact-original permission | Source/scope; contributions; export request | A09.reauth if required; A09.export; revoke → A06.lifecycle | Request/approve/decline/revoke; exact recipient/assets/expiry; departed recipient, expired grant. |
| [A05](mobile_workflow_specification.md#screen-a05) Selected import and batch review | A02/A04/A06/A06.sources | X.picker; A05.item; A04.scope; approved result → A04/A04.queue; X.settings | Picker cancelled, cloud retrieval, duplicates, unsupported input, unknown metadata, partial batch failure. |
| [A05.item](mobile_workflow_specification.md#screen-a05-item) Inspect import candidate | A05 | Correct/exclude → batch caller; missing input → X.picker | Missing handle, planned-only route, unusable FIT, uncertain date/location; no fabricated historical location. |

### 3.3 Journey, people, publication and lifecycle

| ID and task | Principal entry | Forward task / completion | Distinguishing mockup states |
| --- | --- | --- | --- |
| [A06](mobile_workflow_specification.md#screen-a06) Journey overview | History, confirmed create/join, notice, validated link | Details/People/Sources/edit; capture/import; publish/highlights; reader; own contributions/export; lifecycle | Participant, admin-only, coauthor and publisher projections; no cover/sources; draft differs from approval; archive/freeze. |
| [A06.details](mobile_workflow_specification.md#screen-a06-details) Event metadata | A06 | Save/cancel → caller | Invalid time, stale current-versus-proposed fields, permission loss, offline; no shared-history access for admin-only. |
| [A06.people](mobile_workflow_specification.md#screen-a06-people) People and powers | A06 | A06.invite, A06.powers, A06.transfer, A06.lifecycle | Scoped admin roster versus own powers; pending/expired invitations; archive/freeze. |
| [A06.invite](mobile_workflow_specification.md#screen-a06-invite) Invite companion | A06.people | Send/cancel → People caller | Invalid email, independent power offers, queued/failed delivery, rate limit. |
| [A06.powers](mobile_workflow_specification.md#screen-a06-powers) Edit member powers | A06.people | A09.reauth; save → caller; removal → A06.lifecycle | Separate coauthor/publisher controls; stale target, expansion restricted, member departed. |
| [A06.transfer](mobile_workflow_specification.md#screen-a06-transfer) Transfer administration | People, notice, lifecycle, account deletion | Offer/accept/decline → caller; A09.reauth; no-successor departure → A06.lifecycle | Pending is not accepted; expired/revoked offer, no eligible successor, existing-coauthor archive exception. |
| [A06.sources](mobile_workflow_specification.md#screen-a06-sources) Permitted journey sources | A06; A07 | A04.moment; A05; own A04.scope; placement → A07 | Own versus shared review, review-only exclusion, failed transcript, withdrawal, no contribution. |
| [A06.publish](mobile_workflow_specification.md#screen-a06-publish) Publication review | A06 | A06.preview; permitted source/blocker → A04.moment; X.web; approval → A06; restriction → A06.lifecycle | Rights/privacy blockers, stale candidate, visibility and separate listing status, job failure, read-only coauthor. |
| [A06.preview](mobile_workflow_specification.md#screen-a06-preview) Exact candidate preview | A06.publish | Close → review; already approved version only → X.reader | Candidate Story/Explore/Learn, missing media/no GPS, privacy-safe derivatives, invalidated candidate. |
| [A06.lifecycle](mobile_workflow_specification.md#screen-a06-lifecycle) Named impact review | Source/grant, People, journey/publication, own share/contribution | A06.transfer if needed; A09.reauth if required; submit → A06.operation | Action-specific authority/impact, stale preview, offline intent, distinct leave/archive/delete/unpublish consequences. |
| [A06.operation](mobile_workflow_specification.md#screen-a06-operation) Persistent operation status | Lifecycle/deletion, notice, permitted operation link/receipt | Safe A01 or A09.help; status reconciliation | Waiting to send, checking result, denied/pending recovery receipt, confirmed, separate cleanup, expired receipt. |
| [A06.unavailable](mobile_workflow_specification.md#screen-a06-unavailable) Safe unavailable | Protected link/task denied or unknown | A01; A09.auth where useful; independently authorized A09.contributions | No protected title/cover/location; source-owner route does not restore workspace access. |

### 3.4 Focused editing and highlights

| ID and task | Principal entry | Forward task / completion | Distinguishing mockup states |
| --- | --- | --- | --- |
| [A07](mobile_workflow_specification.md#screen-a07) Editing workspace | A06; placement from A06.sources | A07.chapter/route/knowledge/conflict/revisions; A06.sources; X.web | Empty/rest stages, retained pending work, publisher read-only, source withdrawn. |
| [A07.chapter](mobile_workflow_specification.md#screen-a07-chapter) Narrative and placements | A07; authorized source detail | Source → A04.moment; stale edit → A07.conflict; A07.revisions; save → caller | Long/empty text, missing source, suggestion review, offline candidate, non-drag ordering. |
| [A07.route](mobile_workflow_specification.md#screen-a07-route) Stages and route evidence | A07 | Source → A04.moment; stale edit → A07.conflict; save → caller | No GPS, gaps, rest/transfer, split-party travel, overlapping recordings, unavailable map. |
| [A07.knowledge](mobile_workflow_specification.md#screen-a07-knowledge) Practical detail | A07 | Evidence → A04.moment; stale edit → A07.conflict; save → caller | Dated cost/unit/currency, uncertain or conflicting reports, unsupported transcript, Accept/Edit/Dismiss suggestion. |
| [A07.conflict](mobile_workflow_specification.md#screen-a07-conflict) Stale edit comparison | Notices, pending queue/editor, revision restore race | Keep current/combine/reapply or cancel → exact caller | Preserved candidate, repeated race, withdrawn evidence, lost rights, offline. |
| [A07.revisions](mobile_workflow_specification.md#screen-a07-revisions) History and restore | A07; chapter editor | Compare/restore → caller; race → A07.conflict | Read-only publisher, unavailable historical content, current-rights filtered restore. |
| [A08](mobile_workflow_specification.md#screen-a08) Choose personal highlights | A06 eligible approved journey | A08.preview; cancel → caller | Own eligible default, explicit group-item selection, empty/plain-link fallback, stale approval. |
| [A08.preview](mobile_workflow_specification.md#screen-a08-preview) Preview and share | A08; owned-share management state | X.share; X.reader → P06/P02; owned hosted-share revocation → A06.lifecycle | Generation failure, copy/link fallback, full-journey access disclosure, hosted revocation versus external copies. |

### 3.5 Account and personal control

| ID and task | Principal entry | Forward task / completion | Distinguishing mockup states |
| --- | --- | --- | --- |
| [A09](mobile_workflow_specification.md#screen-a09) You and account | Root | All A09 child tasks | Signed out/expired, private account hub, pending profile, sign-out with isolated retained work. |
| [A09.auth](mobile_workflow_specification.md#screen-a09-auth) Sign in / create account | Account, invite, expiry, validated callback | A09.verify/recover; safe intent or A01 | Form errors, generic failure, unverified, cooldown, revoked session; no OAuth/passkeys added. |
| [A09.verify](mobile_workflow_specification.md#screen-a09-verify) Verify email | Auth; verification link | Resolve session through A09.auth → permitted intent | Delivery pending/failure, expired/consumed token, wrong account. |
| [A09.recover](mobile_workflow_specification.md#screen-a09-recover) Recovery / reset password | Auth/security; reset link | Request/result/reset states → deliberate A09.auth | Generic acknowledgement, invalid/used/expired link, rate limit, offline. |
| [A09.reauth](mobile_workflow_specification.md#screen-a09-reauth) Fresh identity | Sensitive grant/power/transfer/security/export/lifecycle task | Success/cancel → exact caller; refresh impact before confirmation | Wrong credential, account changed, expired session, offline; never automatic action execution. |
| [A09.profile](mobile_workflow_specification.md#screen-a09-profile) Private profile / optional public selection | A09 | X.picker/settings; save → caller; optional P07 preview via X.reader | Avatar replace/remove/failure, stale profile, private/public field and journey selection, disable public profile. |
| [A09.security](mobile_workflow_specification.md#screen-a09-security) Sessions and security | A09 | A09.reauth/recover; explicit sign-out → A09.auth | Current/other sessions, revoke failure, unsent-work warning and same-account recovery boundary. |
| [A09.research](mobile_workflow_specification.md#screen-a09-research) Saved research | A09 | Edit/remove note within task; X.reader → reader/Discover; A01.create with reference only | Empty/filtered-empty, missing reference, private note retained on failure, inaccessible preview scrubbed. |
| [A09.contributions](mobile_workflow_specification.md#screen-a09-contributions) Own contributions | Account, overview, independently authorized owner exit | A04.moment/export; A06.lifecycle; A09.export | Former membership, neutral destination, own sources retained, queued restriction. |
| [A09.storage](mobile_workflow_specification.md#screen-a09-storage) Storage and transfer preferences | Account; queue | A04.queue; X.settings | Unknown measurements, low storage, quota, Wi-Fi preference; no unsafe cleanup control. |
| [A09.appearance](mobile_workflow_specification.md#screen-a09-appearance) Appearance/accessibility preferences | A09 | Apply → caller; A09.help | System/appearance preference, text growth/reduced motion, session-only preference storage where necessary; theme values open. |
| [A09.export](mobile_workflow_specification.md#screen-a09-export) Permitted data export | Account, source/grant, journey, contributions, deletion | A04.export; A09.reauth where required; completed artifact → X.share | Profile JSON versus archive, no eligible data, job failure, expired/revoked rights. |
| [A09.help](mobile_workflow_specification.md#screen-a09-help) Help/privacy/limits | Account, operation status, appearance | Configured X.support; return → caller | Bundled offline help, unknown limits/channel, reviewed redacted diagnostics. |
| [A09.delete](mobile_workflow_specification.md#screen-a09-delete) Delete account | A09 | Optional A06.transfer/A09.export; A09.reauth; confirmed submission → A06.operation outside auth | Cross-journey impact, accepted transfer/no successor, stale impact, pending receipt and cleanup. |

## 4. Creator web screen map

Source: [W01–W08 contracts and N01–N27 contextual connections](creator_web_workflow_spec.md). All workspace screens have permitted tool navigation, Back to journeys → W09.history, and an account exit. W07 remains contextual. Exact rail, panels, compact composition and routes are revisitable.

| ID and task | Principal entry | Internal compositions to include | Forward task / recovery |
| --- | --- | --- | --- |
| W01 Journey overview | W09.history; confirmed E06/E07; permitted notice/link | Capability-scoped status/work queue, event metadata form, notices, no-cover and empty states | W02–W08 relevant task; W09 contributions/export/highlights; lifecycle → E12/E14; approved reader → P02. |
| W02 Story editor | W01; source insertion; route/detail relation; publish repair; direct permitted link | Chapter/order controls, title/summary/cover, narrative/placements, insertion chooser, suggestion review, source inspector, pending save | W05 evidence; W03/W04 related task; W07 stale edit/history; W08 review and explicit return from repair. |
| W03 Route editor | W01; recording/source; chapter/detail relation; publish repair | Stage/leg form, rest/transfer/branch, split/merge impact, recording association/primary selection, evidence list, optional map, safe-geometry review | W05 evidence; W02/W04 related task; W07 conflict/history; W08 review. No-GPS/map failure retains list-based task. |
| W04 Practical details editor | W01; source extraction; story/stage link; publish repair | Category/detail list, dated report form, money/unit context, source playback/transcript offsets, correction provenance, suggestion review | W05 evidence; W02/W03 context; W07 conflict/history; W08 review. Preserve unsupported/conflicting evidence. |
| W05 Sources | W01; editor/revision citation; publication blocker; own-only participant entry | Selected-import batch/item review, transfer queue, source/media/transcript detail and correction, scope/audience, exact-original request/approval, withdrawal impact | W02 insertion; W03 recording correction; W04 sourced detail; W09.export; E12/E14; exact caller return. Participant mode never exposes shared review pool. |
| W06 People and permissions | W01; permitted member/invite notice; scoped management entry | Own powers/admin identity versus admin roster, invite form/status, independent capability edit, transfer offer/acceptance, leave/removal/archive/delete impact | E04 freshness where required; E12 impact/E14 result; return → origin. Stale/expired offer, narrowed powers and frozen/archive variants. |
| W07 Revisions and conflicts | W01 conflict task; W02/W03/W04 stale save/history; permitted notice | Entity history, selected revision comparison, current/stale/base values where allowed, resolution candidate, restore preview | Resolve/restore → exact owning entity; source → W05; W08 repair return. Read-only inspection never implies restore authority. |
| W08 Review and publish | W01; editor review; repair return | Sources/rights, privacy, uncertainty, exact Story/Explore/Learn/link/question-source preview, visibility/listing, current-generation approval, approved result | Blocker → W02–W05/W07 then review; approved → P02; highlights → W09.highlights; unpublish/link restriction → E12/E14. Separate listing pending/listed/removed from publication. |

### 4.1 W09 history and account compositions

Source: [shared web screen contracts](lifecycle_workflow_spec.md). The nine named child compositions below expand canonical W09. Account profile/security forms retain E10/E11; saved research retains R-list/R-note.

| Child composition | Entry | Forward / completion | Required variants |
| --- | --- | --- | --- |
| W09.history | Global Your journeys; auth default; workspace exit | E06 create; E07 join; W01; E16; W09.account; R-list | Unique canonical journeys, filters, no cover, empty, unavailable former reference. |
| W09.account | Account menu/history; safe status exit | E10 profile; E11 security; contributions/export/highlights/public-profile/preferences/help; E13; R-list | Private identity, profile save state, sign-out/unsent-work guard, account isolation. |
| W09.contributions | Account/history; own-contribution action; former-owner safe entry | Own detail/import/scope/original-grant compositions; W09.export; L01–L03 and E14 | Own-only source projection, missing browser file/reselection, former member, no grant expansion after departure. |
| W09.export | Account, own source, W01/W05, E13 pre-deletion | Exact-original permission task; E04 as required; L15 generation/status/download; caller | Profile JSON distinct from archive; no eligible data, job failure, stale/expired grants. |
| W09.highlights | Approved W01/W08; eligible X-member; own share management | W09.highlight-preview; source inspection; cancel → origin | Own eligible default, group opt-in, hosted-share list/status, no eligible selection, stale approval. |
| W09.highlight-preview | Highlight selection / owned hosted share | Explicit copy/card/share; P06; P02; L09 revoke; edit → selection | Unsupported browser share fallback, generation failure, external-copy and full-journey disclosure. |
| W09.public-profile | Account/profile; own P07 through X-member | Save/remove/disable; P07 preview; permitted reader; caller | Selected fields and eligible public journeys only; save failure, eligibility loss, disabled profile. |
| W09.preferences | Account | Apply → caller; relevant help | Appearance variants after design, actual usage/limits, applicable transfer preference, unavailable measurements. |
| W09.help | Account; public-safe help from X-info/unavailable/status | Configured support; relevant guidance; safe caller | Public versus private diagnostic context; formats/privacy/retention/limits; no invented address or guarantees. |

## 5. Public and supporting web screen map

Source: [public inventory and complete adjacency register](public_web_workflow.md). Public reading is available without sign-in when current visibility allows it. Saved research and submitted questions are account-private. Public source views never expose creator source-management projections.

| ID and task | Principal entry | Forward / completion | Distinguishing mockup states |
| --- | --- | --- | --- |
| P01 Discover | Direct/global; safe unavailable exit; research empty | Result → P02; Save → R-note; X-report; global destinations | Catalog empty versus no filter matches, retained filters/pagination, removed listing, network error. |
| P02 Story | Discover, direct link, reader modes, highlight/profile/research, approved creator result | P03/P04/P04.search/P05; eligible P07; R-note; X-report; authorized X-member | Chapter/all-days selection, long narrative, no cover/media/GPS, partial source removal, current access lost. |
| P03 Explore | Story/Learn/source; valid view link | P02/P04/P04.search/P05; R-note; X-report | Map not requested/loading/failed; list-only, satellite failure, branch/gap/unknown evidence, user-controlled playback. |
| P04 Learn | Reader modes, saved context, valid link | P02/P03/P05; P04.search/question; R-note; X-new; X-report | No details/no matches, historical amounts, uncertain/conflicting reports, withdrawn dependency. |
| P04.search Journey search | Reader search; safe direct search link | Passage → P02; detail → P04; source → P05; explicit Ask → P04.question; close → caller | Empty query/no results, journey/stage scope, partial index, error and unavailable result. |
| P04.question Journey questions | Learn/search; P06 full-journey handoff; auth return; own session | X-auth if needed; explicit Ask; P05 citations/P04 details; P02/P03; close → caller | Guest, ready/invalid/submitting, validated answer, abstention, historical/conflicting evidence, partial index, quota, provider failure, stale/withdrawn answer. |
| P05 Approved source detail | Story/Explore/Learn/search/question/highlight; direct source URL | Exact caller; P02 stage; P03 when placement exists; eligible P07; X-report | Text/transcript/media and real citation offset, missing media, withdrawn source, compact/direct-link safe parent. |
| P06 Personal highlight landing | Shared link; creator share/preview result | P02 full journey; P05 source; disclosed full-journey P04.question; eligible P07; R-note; X-report | Eligible selection, plain-link fallback, changed/withdrawn share, explicit whole-journey scope. Read-only recipient page. |
| P07 Optional public profile | External link; eligible credit; own preview | Selected journey → P02; X-report; own management → X-member | Explicit public selection, no eligible journeys, removed item, disabled/unavailable profile. |
| P08 Generic unavailable | Denied/unknown/deleted managed public target | P01; safe Back; X-report/support; classified transient Retry only | No protected metadata or existence explanation. Preserve unaffected surrounding journey only when safe. |
| R-list Saved research | Signed-in global/account; R-note; private direct route | P02/P04; R-note edit; X-new; P01; L11 remove; X-auth on expiry | Own private list, empty/no matches, invalidated preview, remove-note confirmation. Native equivalent A09.research. |
| R-note Save/edit private note | Save from P01/P02/P03/P04/P06; edit from R-list; auth continuation | Save/cancel → invoker; R-list; remain on error | Retained private text, explicit save after sign-in, inaccessible reference, L11 clear/remove distinction. |
| X-auth Account handoff | Save/Ask/research/account/global sign-in | E01/E02 as needed; return to permitted caller; cancel → public origin | Retained safe intent; no auto-submit. Native equivalent A09.auth/verify. |
| X-report Report issue | Public screens; safe support context | Submit → safe receipt/origin; cancel → origin; failure retains text | Guest/account form, duplicate/stale target, optional contact, no removal claim or operator access. |
| X-new Start distinct journey | R-list or explicit Learn action | E06; confirmed result → W01; cancel → research/reader | Source reference only, independent dates/identity/membership, auth if required. Native A01.create. |
| X-member Personal management handoff | Eligible reader member action; own profile/account | W09.highlights/highlight-preview or W09.public-profile; E01 if needed; cancel → origin | Current eligibility; no edit controls added to public P06/P07. |
| X-info Product/policy/help content | Global, unavailable, report/status help | Chosen About/privacy/terms/support content; X-report/configured support; safe origin/P01 | Separate content destinations under this local label; final policy/support copy pending. No private diagnostics by default. |

## 6. Shared account and access crosswalk

Source: [E01–E16 handoff](accounts_journeys_access_design.md). An E ID is a reusable functional flow. It may need several form/result frames within the same contract. Do not count it again as an additional native or web screen when its owning composition is already mapped.

| Flow | Native owner | Web owner / entry | Completion and mockup coverage |
| --- | --- | --- | --- |
| E01 Account entry | A09.auth | Sign-in/create-account entry; X-auth | Sign-in and registration forms; validation/pending/failure; E02 if needed; safe intended destination. |
| E02 Verification | A09.verify | Verify-email entry/callback | Instructions/resend, pending/failed delivery, valid/expired/consumed result; resolve session without auto-action. |
| E03 Recovery | A09.recover | Recovery and reset-password entries | Request, generic acknowledgement, reset form/result, invalid/expired link; deliberate sign-in. |
| E04 Reauthentication | A09.reauth | Contextual fresh-identity composition | Success/cancel → refreshed exact action; wrong credential/session/account; no automatic confirmation. |
| E05 Private history | A01 | W09.history | Root, populated/empty/filtered/offline, unique event references and safe former membership. |
| E06 Create journey | A01.create | Create entry from W09.history/X-new | Form, validation, pending/uncertain/confirmed; canonical result → A06/W01. |
| E07 Invitation resolver | A01.join | Invite entry from history/notices/link | Recipient/account check, offered powers/audience, explicit accept/decline, invalid/expired/revoked; same event result. |
| E08 Overview/details | A06/A06.details | W01 and event-details composition | Capability-specific overview; metadata form/current-versus-proposed stale state; safe return. |
| E09 People/invitations | A06.people/invite/powers/transfer | W06 | Admin versus minimal-member presentation; invitations, independent powers, explicit accepted transfer. |
| E10 Private profile | A09.profile | Profile form from W09.account | Display name/bio/avatar, update/remove/error/conflict; optional public selection remains explicit. |
| E11 Sessions/security | A09.security | Security from W09.account | Current/other sessions, revoke/password/recovery, fresh auth, sign-out/unsent-work guard. |
| E12 Journey lifecycle | A06.lifecycle/transfer | Action-bound impact from W01/W05/W06/W08 or owner controls | Exact named action, permitted impact, reauth only when required, current confirmation, E14 result. |
| E13 Account deletion | A09.delete | Account-delete entry from W09.account | Export/transfer options, no-successor impact, refreshed confirmation, logout and minimal E14 receipt. |
| E14 Operation status | A06.operation | Persistent operation/receipt view | Waiting/uncertain/denied/pending receipt/confirmed; separate cleanup; finite post-deletion read-only status. |
| E15 Access unavailable | A06.unavailable | Private unavailable boundary; P08 for public access | Generic metadata-safe denial; safe history/auth/independent owner route. No cached protected preview. |
| E16 Notices | A01.notices | Scoped attention list/detail from history/workspace | Invite, powers, transfer, conflict and lifecycle entries; empty/error/expired target; no new social inbox. |

## 7. Lifecycle action map

Source: [L01–L16 exact authority, impacts and result contracts](lifecycle_workflow_spec.md). Use action-specific review/result variants under the owning screens. E14/A06.operation applies to journal-backed restrictions where defined; profile presentation, local selection, research and report submission must not fabricate restriction receipts.

| Action | Native / web invokers | Review, result and onward path |
| --- | --- | --- |
| L01 Narrow/withdraw source reuse | A04.scope/moment, A09.contributions / W05 own source, W09.contributions | A06.lifecycle/E12 → operation status; retain own original, deny affected managed reuse; return to independently authorized own source. |
| L02 Delete owned media | Own source/contributions on both platforms | Distinguish source deletion from local-copy cleanup; last-copy/impact review → status plus separate cleanup; never delete others' originals or phone gallery. |
| L03 Revoke original-export permission | A04.export / W05 or W09 original-grant composition | Exact recipient/assets/expiry → restriction status → grant detail; publication reuse is separate. |
| L04 Leave journey | A06.people/lifecycle / W01/W06 | Transfer option or explicit no-successor impact → status/safe history; source grants do not automatically withdraw. |
| L05 Remove member/narrow powers | A06.people/powers / W06 | Current administrator reviews exact membership/power consequence → applicable restriction status; retained source ownership. |
| L06 Transfer administration | A06.transfer; deletion continuity / W06; E13 continuity | Offer → pending; recipient explicitly accepts/declines; accepted transfer → People or refreshed deletion/departure impact. Exactly one administrator. |
| L07 Archive | A06.lifecycle / W01/W06 | Collaboration closure review → status/archived overview; existing permitted reads/exports/restrictions remain; no unarchive control. |
| L08 Unpublish/narrow visibility/revoke or rotate unlisted access | A06.publish/lifecycle / W08; separately scoped operator | Audience/link impact → status/current publication controls; affected public views become P08 where denied. Replacement link issuance is separate. |
| L09 Revoke hosted personal share | A08.preview / W09.highlight-preview owned share | Exact hosted share and external-copy warning → result/status as applicable → own share management; P06 unavailable while canonical story may remain public. |
| L10 Remove selection/disable public profile | A09.profile / W09.public-profile | Explicit selected fields/journeys or disable → profile result; P07 loses eligible card or becomes unavailable; account/journey retained. |
| L11 Unsave research/delete private note | A09.research / R-list/R-note | Distinguish edit/clear note from unsave; confirm nonempty-note loss → retained list/reader; failure retains text. |
| L12 Delete account | A09.delete / E13 from W09.account | Optional export/accepted transfer, current impact/fresh identity/explicit confirm → logout → minimal status and cleanup; no keep-owned-sources-shared option. |
| L13 Delete canonical journey | A06.lifecycle / W01/W06, administrator only | Named event impact plus second typed-title confirmation → status/safe history; all canonical managed references denied, personal originals retained. |
| L14 Submit/review/remove catalog listing | A06.publish / W08; restricted operator workflow | Creator submission/status versus operator decision/receipt; pending/listed/rejected/removed; listing removal alone does not unpublish P02. |
| L15 Generate/download permitted export | A09.export, A04.export / W09.export, original-grant detail | Exact scope/rights → direct bounded profile export or archive job/status → reauthorized download/explicit OS share; expiry/withdrawal invalidates managed artifact. |
| L16 Report/request operator help | X-report; account/status help / public-safe support | Report form → safe receipt/origin; restricted review may invoke L14/L08; report alone does not remove content. |

### 7.1 Restricted operator boundary

The required path is authenticated restricted queue → currently authorized evidence → listing decision or separately authorized takedown → audit/result/status → queue. Include target gone, duplicate report, stale state, lost operator authority and failed/pending result. A public report receipt never grants entry.

This boundary has no new canonical consumer screen ID. The existing specification permits a founder-operated runbook; whether it needs a product UI remains open. Preserve its workflow coverage without adding an administration-dashboard build to the mockup scope. Named operator, production channel and response policy remain release inputs.

## 8. Native and external boundaries

Source: [native external destination contracts](mobile_workflow_specification.md). Use annotated handoff/return states; do not redraw OS interfaces as app-owned components or promise their behavior from a static mockup.

| Boundary | Invoker | Mapping and return |
| --- | --- | --- |
| X.picker | A05/A05.item; bounded avatar from A09.profile | Selected OS media/document input → staged review or avatar flow; cancellation keeps caller unchanged; no upload on selection. |
| X.settings | Capture/import/profile/storage recovery | OS permissions/settings → exact caller; refresh facts, preserve work, no automatic recording. |
| X.share | A08.preview; completed permitted A09.export | Explicit eligible link/card/file → OS handoff; cancel returns; handed to OS does not prove delivery. |
| X.reader | Approved journey/source/share/profile/research action | P01–P07 as appropriate, otherwise P08; preserve safe reader selection and previous app context. |
| X.web | Dense A07 composition or A06.publish review | Corresponding permitted W02/W03/W04/W08 task; browser has independent authentication; return retains native caller. |
| X.support | A09.help/status | Configured channel only, reviewed redacted diagnostics, safe return; no invented contact details. |
| X.entry | OS launch/external invite/auth/journey/share link | Dispatch to permitted account/invite/task/reader after hydration; invalid link → safe unavailable. Not a consumer screen. |

## 9. State and permission coverage for mockups

Do not create every possible state for every screen. Draw a distinct frame when the available action, explanation, structure or safe return changes; annotate shared behavior when the same component contract covers it. All state labels below need truthful sample data and a recovery/exit.

| State family | Mandatory consumers / meaningful variants |
| --- | --- |
| Loading, empty and filtered-empty | Histories, libraries, sources, People/invites, revisions, practical details, Discover/research, shares. Loading never masquerades as empty. |
| Validation, pending, success, failure/retry | Account, create/join, invite/powers, source scope/export, editors, notes, publication, reports. Keep input and action meaning. |
| Local persistence and transfer | Capture saving/interrupted/failed/saved; Wi-Fi/quota/offline/auth wait; verified private cloud; processing pending/unsupported/failed. |
| Unknown mutation result | Create/join, shared edits, permission/lifecycle/publish/export tasks. Check the same operation identity before retry. |
| Permission or session change | Guest/account, participant, coauthor, publisher, admin-only, combined powers and former source owner. Read versus edit versus approve remain separate. |
| Editing and evidence | Empty/long narrative, rest days, no GPS, gaps/branches, uncertain dates/location, historical prices, corrected transcript, suggestion pending/accepted/dismissed, conflict/restore. |
| Publication and distribution | Draft versus approved, review-only source, privacy blocker, stale candidate, unlisted/public, publish versus listing, withdrawn source/share/profile and link revocation. |
| Restrictions and deletion | Waiting to send → checking result where uncertain → server denial/pending receipt → confirmed restriction; cleanup separately pending/delayed/complete; expired minimal receipt. |
| Archive versus no-successor freeze | Archive closes collaboration and invalidates expansion offers. Freeze alone does not ban all editing/capture/existing-grant contribution. Apply action-specific rules; no claim-admin/unarchive shortcut. |
| Questions/search | Partial index/no results; guest prompt; explicit submit; sourced answer/abstention/conflicting or historical evidence; quota/provider failure; changed-version/withdrawn answer suppression. |
| Navigation interruption and sign-out | Active recording stop/discard, unpersisted edit guard, preserved candidate, same-account local-work isolation, cold link, lost caller and safe fallback. |
| Accessibility and media fallback | Long text/text growth, keyboard/focus/screen reader, reduced motion, non-color cues, non-drag reorder, safe areas/keyboard, no image/map/audio dependency for essential tasks. |

Shared component candidates are forms/actions, scoped collection rows and filters, media/transcript detail, source/audience/export controls, evidence labels, conflict comparison, review/impact, and persistent status. Build the actual component set from representative mockups; this list does not select component appearance or a new framework.

## 10. Connected walkthrough coverage

These are review scenarios for the mapped scope, not an approved build order or old prototype milestone sequence. Capture permission, durability, server authority and provider behavior remain later implementation acceptance obligations.

| Walkthrough | Mapped path | What the mockup review checks |
| --- | --- | --- |
| First account and journey | E01 → E02 if required → E05 → E06 → E08 → E09 invite | Account/create variants, explicit timezone, one canonical result, invitation/delivery state. |
| Invited participant | Link/E16 → E07 → E01/E02 if needed → explicit accept → E08 | Wrong/expired recipient path, no automatic acceptance, no implied editorial powers/gallery sharing. |
| Offline capture | A06/A02 → A02.destination → A02 capture → A03 → A04.queue → A04.scope | Local save versus backup/contribution; permissions/unknown location/low storage; safe interruption. |
| Selected import | A04/A06 → A05 → X.picker → A05.item → A05 approval → A04/queue; web W05 equivalent | No upload before approval, duplicates/unsupported/missing files, per-item recovery, optional scope. |
| Contribute without editorial access | A04.scope/A09.contributions or W09.contributions/W05 own-only → source controls | Own-source task never depends on shared-draft access; current audience and original-export separation. |
| Compose and correct | A07.chapter/route/knowledge or W02/W03/W04 ↔ source detail → conflict/history if needed | Evidence, stage/chapter relations, manual corrections, retained stale candidate, exact caller return. |
| Review, repair and publish | A06.publish/preview or W08 → authorized blocker repair → refreshed exact preview → explicit approval | Current rights/privacy/generation, independent publisher power, separate listing result. |
| Create and receive highlights | A08/preview or W09.highlights/preview → explicit share → P06 → P02/P05 | Own/group selection, no eligible selection, full-journey disclosure, browser-share fallback, revoked share. |
| Discover and understand | P01 → P02 ↔ P03/P04 → P05 → exact origin | Filters/Back, chapter/moment continuity, dated evidence and list-based no-map experience. |
| Save research and start another event | Reader → X-auth if needed → R-note → R-list → X-new/E06 | Explicit save, private note/remove confirmation, unavailable reference, new event carries reference only; native A09.research equivalent. |
| Ask and inspect | P04/P04.search/P06 → P04.question → X-auth if needed → explicit Ask → P05 → question | Full accessible journey scope, complete validated answer/abstention, source offsets, failure/quota/stale-source suppression. |
| Retain source/export control after departure | L04 → safe history → own contributions → L01/L03 → status → denied managed reader/export | Former-owner path, separate leave/source/export effects, denial versus receipt/cleanup. |
| Account/journey lifecycle | E09/E12/E13 → accepted L06 or no-successor impact → required E04 → refreshed confirm → E14 | Archive/freeze distinctions, two confirmations for canonical deletion, account logout/minimal receipt, others' originals preserved. |
| Optional profile and support | Profile selection → P07 → remove/disable; X-report → receipt → restricted operator handling | Public/private field boundary, no automatic full history, listing removal versus takedown, safe help fallback. |

## 11. Open choices and next mockup task

Screen mapping is complete for the current documented scope. The following choices remain open; a completed map does not approve their proposed defaults.

| Choice | Affected scope | How to proceed before resolution |
| --- | --- | --- |
| Visual identity and shared foundations | All surfaces | Choose through DESIGN.md using representative content. Wireframes may use explicitly provisional neutral styling. |
| Navigation grouping, page/section/overlay and responsive composition | A roots/children, W workspace/W09, public reader/source/question tasks | Keep task identities and paths; explore composition in wireframes. No tab/sidebar/inspector layout is inherited. |
| Review sizes and adaptation | Android/iPhone/iPad; compact and wide responsive web | Select representative frame sizes before detailed layout; exercise text growth, keyboard/safe areas and dense-task adaptation. Breakpoints remain open. |
| Narrative formatting and limits | A07.chapter, W02 | Keep content/control examples provisional; settle wire schema and validation before interactive editor implementation. |
| Chapter/stage/leg associations and split/merge impact | A07.route/chapter, W02/W03 | Show explicit relationships and review consequences; do not assume a one-to-one relationship or invent commands. |
| Publisher historical inspection, redaction command authority and publication conflict policy | A07.revisions, W07, W03/W08 and native equivalents | Preserve current capability/source boundaries; mark detailed projection/blocker decisions pending rather than inventing rights. |
| New request-permission/fix messaging | Source and publication blocker tasks | Use existing permitted issue/notice paths. Any new messaging/delivery command needs its own decision. |
| Reader opening, Discover ordering, search matching and final routes | P01–P05, X handoffs | Use labelled scenarios; retain valid linked selection, explicit map loading and safe unlisted access. Exact defaults/URL schema remain open. |
| Research note bounds and question session limits/retention | R-list/R-note, A09.research, P04.question | Show the required controls/disclosure locations using sample-only content; no invented numerical promise. |
| Public profile identifiers/validation and final policy/support copy | P07, profile management, X-info/X-report/help | Explicit opt-in and generic approved placeholders until selected; do not invent an address or handle contract. |
| Input formats, media/route/storage limits, transcription languages and supported device set | Capture/import/processing/source/editing/help | Use declared/qualified capability and labelled samples; unsupported/conditional inputs retain fallback states. Real values require qualification. |
| Operator channel/ownership, production domain/providers, retention and measured recovery guarantees | Reporting/listing, account/help, publication/restriction status | Preserve workflows and selected policy targets; actual operational qualification is a release gate, not a prerequisite for static screen mapping. |

**First connected wireframe task (now drawn as a static flow; see owner records):** wireframe one connected create/join → capture/import → source-scope → compose → review/publish → public-reader path, carrying its mobile/web handoffs and consequential failure states. Use the journey list, capture confirmation, creator editor and public Story to explore the shared visual system before expanding polished screens. This recommendation is new; it does not resume the withdrawn prototype batches.

Use clearly labelled fictional content spanning long/short narrative, no-cover/no-GPS/rest days, split-party travel, mixed source scopes, a stale edit and a withdrawn source. The fictional Nilgiris fixture and frame references are recorded in the owning workflow specifications. A Pen canvas map may mirror these connections; this document does not claim a clickable prototype exists.

## 12. Mapping completion and verification

Mapping completion means the current screen/subflow inventory, aliases, native boundaries and lifecycle actions have owners, principal connections, safe returns and required state coverage. It does not mean mockups are drawn, visual choices are selected, every illustrative route is implemented, or runtime acceptance has passed.

Verification for this documentation checkpoint is recorded in [the workflow review record](workflow_review.md). Recheck inventory and connection coverage whenever a responsibility is combined, split or rerouted. Update the owning workflow contract before the derived map when behavior changes.

## Approved visual baseline

Fieldwork 1.0 is selected. See the [system specification](../design/fieldwork-system.md) and [library](../../design/fieldwork.pen). The neutral connected wireframes retain functional authority; 45 library boards are component and composition coverage, not a claim that every product screen has been drawn.
