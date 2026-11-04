# Prototype implementation progress

> Current redesign work continues in [the complete experience redesign record](experience_redesign.md). The founder's later brief supersedes the P02-only visual stop below. This document preserves historical evidence; the new checkpoint does not claim production capture/publication acceptance.

3 November 2026. Scope: P00–P02 only, on `feat/experience-prototype`. P03 is not started. This record distinguishes implementation, agent inspection, founder review and production acceptance.

## Current visual revision — 4 November 2026

The founder rejected the initial visual treatment as insufficiently modern and supplied a travel-app reference. The original execution record below is historical, not visual approval. This revision replaces the text-heavy workshop presentation with a photographic journal composition while preserving P00–P02 behavior and the governing application design. P03 remains unstarted.

Application checkpoint: **8bf85bfd94e515171a874602a96aac5a8b1de997**, on the existing unmerged `feat/experience-prototype` branch. No PR, integration merge or public deployment. Windows remains the authoring checkout; WSL consumes the exact pushed source through `pnpm checkout:sync`. Native code last changed at **bb61e27bf4b79ec8091df7840bc520244fbeef6d**; the following commit changes web ARIA semantics only.

### Design and component changes

- Re-read application design sections 1–6 and the token/component baseline. Used Impeccable, Frontend Design, Emil design engineering, Expo design-system/native guidance and Unistyles guidance. The supplied reference informs composition, rounded surfaces, image prominence and compact controls; no booking, itinerary, weather or AI-planning product features were copied. Official Day One journal-cover and Polarsteps journey presentation references informed the exploration.
- `DESIGN.md` records the reusable system and component contracts; `PRODUCT.md` is a design-tool index pointing to governing product documents. Existing Paper/Forest/Clay roles, Newsreader/Instrument Sans, spacing and radius tokens remain. No runtime dependency or native build input changed.
- Web: quiet desktop rail, compact phone navigation, collapsed sample controls, photographic journey card, contributor initials, create/join disclosures with input focus, readable overview and responsive two-column component specimens. Long-title specimen now wraps in a textarea. Reader remains a labelled shell.
- Native: safe-area header, photographic journey card, persistent navigation for the three available P02 routes, create/join disclosures, grouped specimens, selected-state semantics and editorial heading semantics. Future product destinations remain absent until their batches.
- Purpose-created `ridge-sample.png` is explicitly fictional AI-generated sample media, never a fallback for a real journey with no cover. Inventory records provenance/use; no third-party artwork copied or media hotlinked. Source SHA-256: `50e7bc4502c112e284a4451eb23ae8b2b1ecdd2abf9427d3c9f0a09c573fe02f`. Bundled PNG is 2,693,736 bytes; production media sizing remains future work. The deliberate no-cover specimen is retained.
- Fixture version **p02.2**, hash **c483b298ee281f9bce2e0ef2b2315e90a74d54d25c8eed60827205de3240efcf**. Canonical asset copying now includes PNG. Both continuations and generated copies match the new version. Domain controllers are unchanged.
- Figma plugin discovery found the available integration and installation was user-approved, but installation did not complete/expose Figma tools in this session. No Figma document or Figma review is claimed. The repository implementation and design specification are the delivered artifacts.

### Executed verification

| Check | Actual result |
| --- | --- |
| Windows fixture/copy check | Pass: 14 existing critical fixture/controller/continuation tests; no extra tests for reversible styling |
| Windows mobile compiler/lint and changed-file formatting | Pass, including final native semantics and multiline form changes |
| WSL current-source tooling image | `docker compose --profile tools run --build --rm --no-deps tooling …` at 8bf85bf: web client/SSR/declarations/server build pass, 14 prototype tests and 9 server/boundary tests pass, six web prototype files pass Vite+ lint/type check, workspace boundary check passes |
| Android/iOS Hermes JS exports | Pass, explicit process exit 0; image/fonts bundled. Native inputs unchanged, existing compiled dev client reused; no new native binary qualification claimed |
| Android Pixel_10, Android 17 | Created and reopened the same journey, navigated to design kit, selected Only me, observed checked state, triggered Save sample and observed busy/disabled without label replacement. Current Metro rendered cover/fonts, safe-area header, navigation and long text. Captures include home, overview, audience and pending states. |
| Final responsive web confirmation | Captured 1440×1000, 390×844 and 820×1180 viewports. Home and component page both report `scrollWidth === innerWidth === 320` at the narrow check. Opened create form: focus moved to INPUT; submitted and opened `/prototype/journey/sample-journey-01`. Component keyboard ArrowDown changed Only me to Journey review; Save sample became busy/disabled; Retry retained the complete long title. Fonts loaded before capture. |
| Final automated accessibility scan | axe 4.12.1: home 39 passes / 0 violations / 0 incomplete; components 42 passes / 0 violations / 0 incomplete. This does not substitute for screen-reader operation. |
| Running web input check | Rebuilt/restarted the existing server container from 8bf85bf. In-container journeys/CSS hashes match the final Windows hashes below. One WSL connection timeout recovered on retry. No previous running container's screenshot is borrowed as final evidence. |

Final current-input hashes: web CSS `49f804e42957d57c14193e1e506dd366a27fde4ebe190c470819996533e96a2c`; web journeys `170223817565f5fd01554bd3766bc10f8c7a2921b201fdac4c39cd1e90c9be1e`; native screens `209f0751f544d3398421b348c4a6f43536cdc775eb0879c4ef11f8c16d972483`.

### Findings and platform limits

One grouped visual correction reduced mobile web header space, made the long-title specimen multiline, and moved keyboard focus into opened forms. An automated accessibility scan caught a labelled generic palette element; added image roles to the palette and analogous contributor stack. The initial tag-filtered audit returned zero checks and is excluded from acceptance.

T3 preview loaded and evaluated the page, but two screenshot attempts failed with `Preview automation snapshot timed out after 15000ms`. Switched to installed agent-browser in isolated session `kairn-p02-redesign`, as allowed after two failures. Closed the owned T3 tab, leaving the pre-existing unclaimed user tab intact. Browser screenshot output using a body selector included blank space outside the viewport; final captures use the plain viewport screenshot and are copied unchanged.

Android initially reported `Application Not Responding: com.android.systemui`; one supported alert-dismiss recovery succeeded. An old project Metro process held 8081 (`EADDRINUSE`); stopped the known project process and started current-source Metro. The generated image finished loading after the first immediate capture; later images show the loaded asset. Existing Unistyles package-export fallback warnings remain, with successful runtime rendering and native exports.

Mac remains on separate `feat/accounts-journeys-foundation` work at 189fe493 with its own local commit. Did not switch, reset or overwrite it. **iOS simulator visual verification and physical iPad verification remain unavailable for this checkpoint.** No physical iPad is exposed by device tools. Existing online Expo recommendation mismatch is not resolved by this visual revision. TalkBack/VoiceOver and maximum accessibility scaling remain unverified; checked semantics and existing Android text size are narrower evidence.

Evidence is private under `.kairn/verification/prototype-p02-redesign/` (WSL build/check logs in the matching WSL directory). Review entry remains `http://localhost:8080/prototype`; component entry is `/prototype/components`. Founder acceptance of this replacement is pending; stop here before P03.

Final screenshots: `web-desktop.png`, `web-phone.png`, `web-tablet.png`, `web-kit.png`, `android-home-final.png`, `android-journey.png`, `android-kit.png`, `android-pending.png`. The component/native semantic corrections do not alter the earlier captured overview pixels. Agent-browser was closed after confirmation. Review gallery: `review.html`. Superseded `*-first` images, initial audits and transient tool failures remain private provenance.

## Baseline and isolation

- Author: Windows checkout, from fetched `origin/development` **605bc61382f2445eb53aea2f64dc6b45c7032641**. The prior `chore/prototype-plan` checkout was at this same base with documentation edits; those exact inputs were preserved in **53473b0** before code authoring. No PR existed for the planning branch at inspection. The prototype branch is not an integration PR and must not merge wholesale into development.
- Existing applications, routers, native development client, package boundaries, React/TypeScript exceptions and foundation probes remain. No service, workspace, auth bypass, database change, runtime dependency, NativeWind or @expo/ui was introduced.
- Native font assets use the pinned Google Fonts commits/checksums in `font_sources_2026-11-03.json`. `scripts/prototype/fonts.py` derives static named weights using an isolated ignored venv (fonttools 4.61.1, brotli 1.2.0). Native uses TTF; web self-hosts WOFF2. `derived-fonts.json` records output hashes, source hashes and axes. Both OFL notices are bundled. No external media is loaded; no-cover is intentional type/date composition. No icons or map instances are needed in these batches.
- `tests/fixtures/prototype/` is canonical. `pnpm prototype:seed` copies bytes and a combined source hash to each app's `src/prototype/generated/`; `pnpm prototype:check` checks copies and runs the critical vectors against both app-local pure controllers. No cross-workspace application import was added.
- Session state clears on reload/relaunch or explicit reset; route navigation within a surface preserves it. Native and web do not sync. Prepared continuations are named equivalent fixtures, with explicit disclosure. No real save, upload, publication, server authorization, retention or recovery receipt is claimed.

## Batch state

| Batch | Implementation | Inspection / review |
| --- | --- | --- |
| P00 | Baseline, inventories, scenarios, assets and scope recorded | Source/host baseline inspected; no product acceptance |
| P01 | Complete for this batch: canonical seed/copy/check, app-local controllers, manifest, reset/actor panels, create/join/revisit and thin routes | 14 vectors/manifest checks pass; actual web and Android tasks below |
| P02 | Complete for this batch: platform-owned controls and representative compositions | One bounded inspection, grouped correction and confirmation completed on web/Android; founder review and unavailable-platform checks remain open |
| P03–P08 | Not started | Outside this checkpoint |

## Actual routes and coverage depth

Native paths are real Expo URLs without parenthesized route groups. Web paths are generated by the existing TanStack plugin. Root/status and `/setup/reader` retain their foundation purpose. All prototype URLs are branch-only, client-rendered sample screens, including the public shell.

| Canonical IDs | Web path / native path | Actor, entry → exit, scenario | Current depth / later disposition |
| --- | --- | --- | --- |
| A01 / W01 | `/prototype/` on both | Any sample actor; first-run → create/join RIDGE → history/open | Working local create/join/revisit, empty/no-cover; sample identity controls instead of auth |
| A06 / W02 | `/prototype/journey/sample-journey-01` / `/prototype/journey` | Joined actor; history → overview → prepared checkpoint/back | Working navigation, independent powers summary; detailed People/invites P03 |
| A/W shared controls | `/prototype/components` on both | Any actor; navigation → specimens → back | Working isolated control states, audience selector, error/retry, pending/reset, impact/cancel, long text/no-cover, source-badged chapter and dated practical-detail compositions |
| A/W sample harness | Web side panel / native `/prototype/samples` | Any actor; shell → actor/scenario/reset → journeys | Working harness; no demo identities in production extraction |
| A02/A03/A04 | No routes yet | Participant capture → confirmation/queue, prepared-trip | P03 deferred, simulated capture only |
| A05 | No route yet | Source owner import selection → review | P03 deferred, selected sample inputs only |
| A07 / W03/W04/W05/W06/W07 | No routes yet | Coauthor/publisher/denied variants; sources → composition/conflict | P04 deferred; no dead navigation controls installed |
| W08 | No route yet | Publisher; rights preview → local publication | P05 deferred |
| P01/P02/P03/P04/P05/P08 | Web `/prototype/reader` only | Guest; public sample entry → shell/back | Labelled Story shell; Explore/Learn/search/source/unavailable transitions P05 |
| A08 / P06 | No routes yet | Member; approved or withdrawn continuation → highlight | P05 deferred; manifest supplied |
| A09 / W09 / P07 / research / questions in P04 | No routes yet | Account owner / guest / signed-in sample; focused secondary examples | P06 deferred; no auth, profile, saved research or AI implementation claimed |

## Scenario catalogue and transition boundary

Seed `p02.1` contains one fictional journey, six stages (recorded/reported/estimated/unknown, rest/no-GPS and participant branch), 19 named moments with distinct captured/entered/uploaded times and unknown timezone, four practical details, independent actors, separate source/export grants, draft/approved/stale candidates, accepted correction and prepared suggestions. These are data inputs for later batches, not completed screens.

| Scenario | Initial intent / depth now |
| --- | --- |
| first-run | Empty session; create/join one canonical ID |
| prepared-trip | Joined history and overview |
| editing / publication-blocked / edited-draft | Joined shell with draft/approved seed inputs; composition and blocker UI deferred |
| published-v1 / native-highlights-v1 | Joined shell and approved-source dependency fixture; reader/highlight walkthrough deferred |
| withdrawn-source / native-highlights-withdrawn | Withdrawn source and invalidated dependencies fixture; unavailable walkthrough deferred |
| unavailable / restriction-pending | Named data checkpoints; full secondary presentations deferred, no fabricated receipts |
| review-moment-19 | Named source/content/scope continuation shown in overview; does not imply transfer of arbitrary edits |

Mira is creator/admin/coauthor/publisher; Dev is participant; Asha is the administrator-only variant (moves the sole administrator); Leo is coauthor only; Noor publisher only; Eli is departed source owner. No email roster is supplied. Both controllers test actor rights, sole administrator, source eligibility, owner restrictions, draft/approved separation, reset, canonical journey identity and named continuation. These are sample model checks, not security tests.

Manifest: `capture-and-contribute` → web `review-moment-19`; `web-published-v1` → `native-highlights-v1`; `web-source-withdrawn` → `native-highlights-withdrawn`. Source IDs/content/scope/revisions/powers and expected next tasks are explicit. P03–P05 will connect the remaining screens.

## Component provenance and reuse

Web uses owned native HTML primitives and Tailwind/token mappings in the existing web stack. Input/button registry source was inspected through shadcn CLI 4.23.0 (`@shadcn/input`, `@shadcn/button`, new-york-v4). The bounded native-element subset keeps semantic inputs/buttons, data slots, focus/invalid/disabled contracts and project-owned styling; it does not install unused Slot/cva/cn dependencies or claim a complete shadcn registry installation. Native uses React Native primitives styled through Unistyles v3 and Expo Stack. Controls receive explicit values/actions; fixture state and actor switching stay under prototype directories.

Enabled boundaries use Ink 500; focus uses Clay 500 with a Paper halo/offset. Web controls are at least 44 CSS px (forms/buttons 48); native controls are at least 48 dp/pt. Semantic labels, radio checked state, live status and error text accompany color. No automatic audio or motion. Shared tokens remain plain values.

## Executed checks and findings

Application checkpoint: **b15c0de4bd4a575f35d97916aa6f035a72fbb5e4**. Verification-tooling checkpoint: **87b5c9661bf0e86a50f56126fa4e04419274f55d**; its only change after the application checkpoint is the boundary-checker correction described below. Final fixture SHA-256: **c9d2447c8fdf16d3ae6426f188434d763b6eb79b0759ee586e0e7325f556c342**. Later progress-record edits do not change application inputs. No PR, integration merge, public deployment or CI pass is claimed. The prototype branch was pushed as the permitted review checkpoint.

| Executed check | Actual result |
| --- | --- |
| Windows `pnpm prototype:check` | Pass: generated bytes/hash and 14 tests, including every forward/reverse continuation's actor/powers, source content/scope and revisions |
| WSL `docker compose --profile tools run --build --rm --no-deps tooling …` at 87b5c96 | Pass, explicit process exit 0: current-source web/server builds (client, SSR and declarations), prototype checks (14), existing server/boundary tests (9), Vite+ lint/type check (34 files), workspace boundary inspection |
| Windows changed-file `vp fmt --check`, mobile `tsc --noEmit`, configured mobile lint, workspace boundary inspection | Pass; compiler and lint settings preserved |
| Windows native JS export at b15c0de | Pass: Android and iOS Hermes exports; explicit final export process exit 0. No native dependency/configuration/Pod inputs changed, so no new native compilation was required. Existing compiled foundation dev client was reused. |
| Full online `pnpm check:mobile` / Expo Doctor | **Not a pass.** Live SDK recommendations moved to newer Expo/router/peer versions; Doctor 19/20, version check fails. Installed `expo@58.0.22`'s bundled matrix passes `EXPO_OFFLINE=1 … expo install --check` (CLI warns offline validation is less reliable). No exclusions, blanket ignore, declaration relaxation or unrequested upgrade was introduced. The separate active foundation-upgrade branch is not evidence for this prototype's pins. |
| Web task through T3 preview, final application inputs | Created the journey, switched to Dev, rejected WRONG, joined RIDGE, reopened `sample-journey-01`, observed participant draft denial, loaded `sample-moment-19` with exact content/review scope, switched to administrator-only Asha and confirmed source content hidden. Fresh navigation/refresh reset to Mira/first-run and made the journey unavailable until create/join. |
| Web composition/layout | Actual CSS widths 1440, 390 and 820 captured; actual 320 checked without horizontal overflow or undersized non-radio enabled controls. Font-ready check passed. T3's resize response can report the preceding viewport; measured `innerWidth` after settlement, compensating for one-pixel rounding at 820/320. Radio labels provide the larger hit area. |
| Web keyboard/focus | ArrowDown selected publication; computed Clay outline approximately 3 px, offset approximately 2 px, Paper halo. This inspection was at a5b9fe3; the inspected control/focus CSS bytes are unchanged at the final application checkpoint. Final 320 px preview clicks on the pending button and radio timed out; these calls do **not** establish a web pending-state pass. Native pending/checked states were independently exercised. |
| Android Pixel_10 / Android 17 | Current Windows Metro 8081, existing `dev.kairn.app`: created/opened canonical journey; inspected audience radios and selected Only me; observed busy/disabled and explicit pending state, retained long title after retry, and system back. Final correction confirmed Save sample label remains stable while busy; source-badged chapter/practical detail and long names wrap. Tool reports text size **large**; no size setting was changed. Final screenshots exclude transient overlays/development FAB. |
| Request observation | T3's retained network entries for core web tasks contain local GET bundle/assets/dev tooling, no observed business writes/auth/uploads/AI/maps/hotlinks. Native prototype code is synchronous with no I/O; no independent native packet-capture claim. Foundation status probes remain separate. |

Actual image input hashes matched Windows and the current running web container: controllers on both surfaces `7c8fd50cb54cd3fc0f8e180f2147fa1804b8b96216b6c1a46a44e00597f56309`; web specimens `c8a67d49d06583451604d31d4a01f9fea949f520552aaffcb9c8bb88716e1448`; native screens `13202f95b7845e0abab7225dfc62c6dab4b8eb7c8ee56b19615f611cafa691ca`; unchanged lockfile `72e2fa896b6b3323724fb4dc22f61ed484b9c0e51cd1fde495dd26be0fe7b8c3`. The rebuilt tooling container prints these inputs before checking. Earlier a5b9fe3 tooling results were not borrowed for the final application/fixture acceptance.

Private evidence under Windows `.kairn/verification/prototype-p02/`: `checked-head-wsl.log` and explicit exit record; `export-final-stdout.log`, stderr and exit record; `browser-task.json`; `web-desktop.png`, `web-phone.png`, `web-tablet.png` with JSON sidecars; `android-components-final.png`, `android-feedback-final.png`, `android-details-final.png`. Browser images are scaled captures of the recorded CSS viewports. Earlier captures/logs retain provenance and are superseded where marked. No private evidence is committed.

## Bounded findings and corrections

| Finding | Disposition / confirmation |
| --- | --- |
| Deep-link web request returned 404 despite generated client routes | Existing Hono adapter now serves `/prototype` and `/prototype/*`; final direct loads and refresh exercised through Compose. Remove these server entry paths during P08 extraction too. |
| Pending label/width changed; native hint disappeared after retry; web lacked a main landmark; chapter/practical specimens absent | One grouped correction retains Save sample while busy, restores hint, adds main and bounded source/evidence/cost specimens. Android busy label and chapter/detail capture confirmed; web landmark and compositions confirmed. No composition/capture workflow was added. |
| Continuation audit lacked full reverse actor/scope proof | Added all-manifest integration check; it caught withdrawn source scope still publication. Both app controllers now narrow the withdrawn checkpoint to only-me; 14 tests pass. Forward endpoint `capture-and-contribute` and web `review-moment-19` contain the same review-scoped source and Dev actor. |
| Cross-host font metadata newline mismatch | Canonical metadata and copied revision are LF-normalized; final copies check identically on Windows and in Linux tooling. |
| Boundary script treated preserved ignored `tools/identity-generation/node_modules` as a workspace | Skip directories without a package manifest. Nothing was deleted. Final real Linux boundary check and existing forbidden-import tests pass with the preserved directory still present. |
| Impeccable mechanical detector flagged the selected Instrument Sans family | Retained the governing pinned family; generic font-popularity advice does not override D07. No redesign/brand expansion. |
| Host/tool interruptions | WSL sync first refused unrelated dirty source correctly; retried only after it was committed. One WSL WSAETIMEDOUT recovered on a bounded retry. A shell CR suffix and a shared-package rebuild/Metro race caused invalid earlier attempts; explicit final process exits and current-input results replace those attempts. Metro overlay was dismissed through the supported tool and final captures are clean. |

## Unavailable platforms and acceptance limits

- **iOS simulator UI unavailable for this checkpoint:** device host and simulator were discoverable, but another active task switched the Mac checkout from the consumed prototype checkpoint to `feat/accounts-journeys-foundation` and began changing its Pod lock. The observed unmatched/old foundation screen is excluded from prototype evidence. Stopped this task's temporary Metro on 8082; did not overwrite native work, discard files, rebuild or claim prototype screenshots. Earlier Mac fixture tests at abc057d passed 13 tests; they are provenance, not the final 14-test/native UI pass.
- **Physical iPad unavailable:** not exposed by the supported device list. Portrait/landscape verification remains open. Physical iPhone remains deferred. No web screenshot substitutes for these platforms.
- TalkBack/VoiceOver operation, maximum accessibility text scaling, native tablet/orientation and a real-keyboard appearance task remain unverified. AX labels/checked/busy state and Android's existing large-text layout were inspected, which is narrower evidence.
- Founder visual review is pending. Agent inspection is not founder confirmation, production authorization, capture durability, source security, publication/revocation, real synchronization, media/AI/map integration, SSR product acceptance or a release qualification. The online dependency recommendation gate and the final small-viewport automation timeouts remain explicit limitations.

Early corrections: PowerShell activation initially refused script execution; subsequent commands use process-only Bypass before activating the pinned host file. Native TypeScript caught unsupported `structuredClone`; both JSON-only controllers now use the same JSON clone boundary. Strict web checking caught an optional-prop mismatch; it was corrected without relaxing compiler settings. Root test imports were aligned with NodeNext JSON/extension rules. These first failures are retained as failures, not borrowed foundation passes.

## Run and review

- Native owning host: activate its documented environment; `pnpm dev:mobile --host localhost --port 8081`; open the existing Kairn development client and its interaction-prototype link. No native inputs changed.
- WSL: consume the exact published prototype commit using `pnpm checkout:sync`, build current source with Compose, then open `http://localhost:8080/prototype` or `/prototype/components`.
- `pnpm prototype:seed` regenerates bundled fixtures; `pnpm prototype:check` verifies drift and vectors. Reset clears session changes; refresh starts first-run.
- Review create/join/revisit, invalid invite, no-cover and long text, keyboard/radio focus, explicit pending/reset, retained error input and impact/cancel. P03 capture and all later walkthroughs are deliberately absent.
- Stop at the P02 visual-review checkpoint. Founder feedback is pending; this record does not turn agent screenshots into founder confirmation or R1 capability acceptance.
