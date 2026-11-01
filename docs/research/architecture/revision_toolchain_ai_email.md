# Toolchain, AI gateway, and email revision research

Research date: 1 November 2026. This is supporting evidence for the requested architecture revision. The current selected dependency register belongs in architecture section 14; this file also records alternatives and must not be treated as an install list. No application was scaffolded, installed, built, or sent to an external service during this research.

## Recommended changes

Use Vite+ for the web toolchain, keeping React and the useful TanStack libraries. Use Vercel AI SDK core on the server and hosted Vercel AI Gateway as the actual model gateway. Use one Nodemailer SMTP transport with Mailpit in development and Resend in production.

This removes separate direct plans for Biome, standalone Vitest, Turborepo, the OpenAI SDK, TanStack AI, and a self-hosted LLM proxy. Necessary compatibility aliases are retained. Vite+ remains development/build tooling; it does not replace Expo Metro, Hono, PostgreSQL, or a production job worker.

## Vite+ and frontend integration

The current stable `vite-plus` release is `1.4.0`, requiring Node `^22.18.0 || ^24.11.0 || >=26.0.0`. Node 26.13.0 from the previous architecture satisfies it. The shipped package's `dist/versions.js` reports the following bundled tools. These are observations of the official npm tarball, not independently selected direct dependencies. [Package metadata](https://registry.npmjs.org/vite-plus/1.4.0).

| Bundled tool | Observed version |
|---|---|
| Vite | 8.3.5 |
| Rolldown | 1.2.15 |
| Vitest | 5.0.5 |
| Oxlint | 1.89.0 |
| Oxfmt | 0.74.0 |
| Oxlint TypeScript Go integration | 7.0.2004 |
| tsdown | 0.23.1 |

Use `vite-plus` for application build/config imports and `vite-plus/test` for test APIs. Vite+ configuration stays in `vite.config.ts`; package-specific files may extend shared root defaults. Keep `@vitejs/plugin-react` and the TanStack Router plugin because they provide framework integration rather than duplicating the toolchain. Current React plugin `6.1.2` declares a Vite 8 peer. [Getting started](https://viteplus.dev/guide/), [configuration](https://viteplus.dev/config/), [monorepo guide](https://viteplus.dev/guide/monorepo), [React plugin metadata](https://registry.npmjs.org/@vitejs%2fplugin-react/6.1.2).

Do not remove Vite aliases as unnecessary duplication. The maintainer's manual-install instructions require package-manager overrides that make every plugin resolve the same Vite core and Vitest runner. For the observed release, pnpm overrides map `vite@*` to `npm:@voidzero-dev/vite-plus-core@1.4.0` and `vitest@*` to `5.0.5`. Update these together when Vite+ changes. A transitive plugin resolving another Vite can break runtime identity checks, including TanStack integration. [Project-local installation and compatibility overrides](https://viteplus.dev/guide/local-cli), [complete official instructions](https://viteplus.dev/llms-full.txt).

The alias target's package version is `1.4.0`, although its bundled Vite implementation is `8.3.5`. It therefore does not literally satisfy a plugin's ordinary `vite ^8` peer check. Vite+ maintainers addressed this with scoped pnpm `peerDependencyRules`; their current workspace uses an exception for `vite`. Preserve the current CLI-generated Vite peer rule, without globally ignoring unrelated peer failures. This is a supported compatibility convention that still needs an actual resolved-graph/build check, not evidence that all raw semver peers pass. [Maintainer issue](https://github.com/voidzero-dev/vite-plus/issues/1021), [maintainer fix](https://github.com/voidzero-dev/vite-plus/pull/1222), [current workspace configuration](https://github.com/voidzero-dev/vite-plus/blob/main/pnpm-workspace.yaml).

`vp check` supplies formatting/linting and type checks when both `typeAware` and `typeCheck` are enabled. `vp test` supplies the bundled Vitest runner; `vp run <task>` executes configured project tasks. Keep Expo-specific/native type checks and native builds as distinct tasks. Vite+ does not prove that Expo modules or native capture work. [Static checks](https://viteplus.dev/guide/check), [tests](https://viteplus.dev/guide/test).

Remove separate Biome/ESLint/Prettier, direct standalone Vitest, tsup, and Turborepo choices unless an actual uncovered requirement appears. Vite Task supplies workspace task execution and caching. Keep an existing needed alias or upstream import identity if the Vite+ installation rules require it; the goal is one toolchain, not the deletion of every package named `vite`.

The toolchain does not itself settle web SSR. Vite+ retains Vite builds and plugin integration. The earlier comparison between a simple public React renderer and TanStack Start's selected hosting adapter remains a rendering decision. Do not infer that switching to Vite+ automatically removes an adapter's release-channel constraint.

## AI SDK and an actual gateway

An AI SDK is an in-process TypeScript abstraction for calling models. A gateway is a network service that authenticates, routes, applies provider policy, and forwards those calls. Neither replaces application authorization, approved-source retrieval, citations, or revocation.

| Candidate | What it supplies | Product fit and decision |
|---|---|---|
| Vercel AI SDK core | Provider abstraction, text and structured output, embeddings, transcription, streaming, common error/result types. | Select server-only core. It supports the needed modalities without an agent framework or client chat dependency. |
| TanStack AI | Stable typed core, provider adapters, tools, structured output, media support, and web/native transports. | Credible alternative, not a second dependency to install. Its recent 1.0 release is not a reason to call it alpha. No feature here requires two SDKs. |
| Hosted Vercel AI Gateway | Actual managed multi-provider HTTP gateway, credentials, routing/fallback controls, budgets, usage metadata, supported multimodal endpoints. | Recommended actual gateway because external AI APIs are allowed and it adds no VPS service. The SDK is open source; this gateway is a hosted service. The application can remain on the VPS. |
| LiteLLM proxy | Actual self-hosted OpenAI-compatible gateway with routing, credentials, budgets, logging, and broad provider support. | Strong alternative if self-hosted gateway policy becomes necessary. Adds a Python service, updates, configuration, and operational state. Do not install it now alongside the hosted gateway. |
| Direct provider adapters with an application module | Lightweight typed task interfaces and direct calls to provider APIs. | Valid if only SDK/provider switching is wanted, but it is not a separately operating gateway. It should not be described as fulfilling central gateway controls automatically. |

Sources: [AI SDK introduction](https://ai-sdk.dev/docs/introduction), [TanStack AI overview](https://tanstack.com/ai/latest/docs/getting-started/overview), [TanStack AI 1.0 announcement index](https://tanstack.com/ai/latest/docs/blog), [AI Gateway overview](https://vercel.com/docs/ai-gateway), [LiteLLM gateway](https://docs.litellm.ai/docs/simple_proxy).

### Current package and model compatibility

| Observation | Exact version or evidence |
|---|---|
| Direct dependency `ai` | `7.0.159`, Node >=22, Zod peer `^3.25.76 \|\| ^4.1.8`, Apache-2.0. |
| Gateway provider bundled by `ai` | `@ai-sdk/gateway` `4.0.132`. The `ai` package exports `gateway` and `createGateway`; a separate direct installation is unnecessary when only those exports are used. |
| Evaluated direct OpenAI adapter | `@ai-sdk/openai` `4.0.106`. Do not add while the selected gateway supplies all required operations. |
| Evaluated OpenAI-compatible adapter | `@ai-sdk/openai-compatible` `3.0.82`. Only needed if a future selected gateway requires it. |
| Evaluated TanStack SDK | `@tanstack/ai` and `@tanstack/ai-openai` `1.0.1`, MIT. |
| Evaluated self-hosted proxy | LiteLLM `1.106.6` from PyPI, Python >=3.10 and <3.15. This is not a selected runtime. Review community/enterprise feature boundaries if adopted. |

These values were fetched from first-party package metadata. AI SDK 7 core's installed gateway dependency declares `languageModel`, `embeddingModel`, and `transcriptionModel`. Its type definitions explicitly include the selected transcription model. The live public [Gateway model catalog](https://ai-gateway.vercel.sh/v1/models) returned `openai/gpt-6.1-sol`, `openai/gpt-transcribe`, and `openai/text-embedding-3-large` on the research date. Availability in this public catalog does not establish a particular account's access, region, or rate limits.

Stable recorded-audio `transcribe` is supported by recent AI SDK 7/gateway releases, so a separate direct OpenAI SDK is unnecessary. Gateway transcription uses a dedicated endpoint; its REST audio payload is base64 JSON rather than OpenAI's multipart upload. Account for encoding overhead and enforce the gateway's and upstream model's limits. Keep bounded server-side audio chunks and real original offsets. Do not turn on experimental live-streaming APIs for recorded R1 voice notes. The stable SDK function does not independently establish service GA status or account availability for every gateway modality. [Gateway speech-to-text](https://vercel.com/docs/ai-gateway/modalities/speech-to-text).

The direct OpenAI adapter also documents the current Sol model, Responses options, and GPT-Transcribe support. It is a fallback choice if an actual gateway compatibility failure requires it, not an advance dependency. Generic compatibility does not prove every provider-specific control is forwarded. Verify structured output, storage controls, timeouts, cancellation, usage accounting, and transcription language/timing behavior against the selected route in implementation. [OpenAI adapter](https://ai-sdk.dev/providers/ai-sdk-providers/openai), [OpenAI Sol model](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [OpenAI transcription model](https://developers.openai.com/api/docs/models/gpt-transcribe).

### Gateway controls for this product

Keep all gateway credentials and model routing on the server. Use an explicit validated model allowlist, and restrict serving providers with the request-level `only` filter. Team-wide allowlisting is a separate Pro/Enterprise capability; its initial enablement includes existing providers, so merely enabling it does not restrict the system to one provider. [Provider restrictions](https://vercel.com/docs/ai-gateway/security-and-compliance/provider-allowlist).

Set `disallowPromptTraining` for eligible system-credential calls and review BYOK agreements separately. This policy applies to fallback providers but does not enforce a BYOK provider agreement. It is not equivalent to zero data retention. [Prompt training control](https://vercel.com/docs/ai-gateway/security-and-compliance/disallow-prompt-training).

Gateway ZDR currently requires Pro or Enterprise. It can be enforced per request or team-wide, applies to fallbacks, and has BYOK-specific configuration. Do not promise ZDR solely because `store: false` is passed to an upstream model. Record the adopted gateway/provider retention, request metadata logging, region, and contract settings before private source processing. [ZDR controls](https://vercel.com/docs/ai-gateway/security-and-compliance/zdr).

Send the gateway only authorized selected audio or approved bounded passages. Source files, vectors, retrieval indexes, approved versions, and question sessions remain application data on the VPS. Disable unnecessary content telemetry and prompt caching; record metadata only where possible. Do not let gateway fallback select an unevaluated model or unapproved provider/region. If no permitted route works, return the existing unavailable/pending behavior.

Use one end-to-end attempt/deadline budget across application jobs, SDK retries, and gateway fallback. Otherwise nested retries can multiply provider charges and delay cancellation. Continue to buffer public answers until citations and current policy generations are checked. Gateway budget controls do not replace account-scoped product quotas or permission enforcement.

LiteLLM is suitable later if a self-hosted gateway becomes a concrete requirement. Its documented `turn_off_message_logging` setting can suppress message/response contents while retaining spend metadata. A self-hosted proxy still sends approved inputs to the chosen external provider, and operating it does not grant new data-processing permission. [Logging controls](https://docs.litellm.ai/docs/proxy/logging), [source license](https://github.com/BerriAI/litellm/blob/main/LICENSE).

Do not add `@ai-sdk/react` or `@tanstack/ai-react` for a buffered question-and-answer screen. Existing Query requests and owned answer/citation components are enough. Do not add agent harnesses, a workflow SDK, hosted file search, LangChain, a second vector store, or model-serving containers merely because the SDK offers integrations.

## Mailpit in development and Resend in production

Both services support SMTP. Use one Nodemailer adapter so the application message template and queue job remain the same across environments. Mailpit also has HTTP APIs, and Resend has a Node SDK, but neither is necessary for this baseline. [Mailpit sending](https://mailpit.axllent.org/docs/usage/sending-messages/), [Resend SMTP](https://resend.com/docs/send-with-smtp).

| Environment | Selected component | Behavior |
|---|---|---|
| Development | Mailpit `1.33.0` container | Capture test mail through private/local SMTP `1025`; inspect through its private/local web UI, normally `8025`. Do not enable forwarding to real recipients by default. |
| Production | Resend SMTP | Verified sender domain, Resend API key as SMTP credential, TLS, provider delivery monitoring as needed. No public SMTP server or MTA is required on the VPS. |
| Application code | Nodemailer `10.3.1` | One SMTP transport interface selected by environment and invoked by durable email jobs. |
| Evaluated but not installed | Resend SDK `6.37.0` | Add only if selected HTTP API/webhook-management features cannot be served by the chosen transport. Do not install it solely because production uses Resend. |

The [Mailpit release API](https://api.github.com/repos/axllent/mailpit/releases/latest) reported `v1.33.0`, published 31 October 2026. The [Nodemailer metadata](https://registry.npmjs.org/nodemailer/10.3.1) and [Resend metadata](https://registry.npmjs.org/resend/6.37.0) establish the observed package versions. Mailpit does not belong in the production Compose profile.

Resend documents an SMTP `Resend-Idempotency-Key` header. Use a deterministic application mail-event key when a durable job retries. Retain a database send/result record and safe delivery failure state; do not describe SMTP effects as exactly once. Configure sender verification and email recovery/invitation templates, including plain text. Do not add React Email unless template complexity makes it useful. [Resend SMTP idempotency](https://resend.com/docs/send-with-smtp#idempotency-key).

Better Auth email callbacks, invitations, and operational notices should all call the same message interface. Persist or enqueue the intended message before claiming it was queued. Check token expiry and relevant current state when a delayed job runs. Never put account recovery tokens, invitation bearer links, or message bodies in ordinary logs.

## Validation still required in the production implementation

- Resolve the Vite+ aliases, React plugin, TanStack plugin, TypeScript, and Node combination together. Inspect `vp toolchain`; do not independently maximize bundled tools.
- Run static checks with type-aware/type-check options enabled, client/server web builds, real native builds, and the existing requirements' public-reader performance checks.
- Exercise structured generation, embeddings, recorded transcription, quota rejection, timeout/cancellation, provider failure, and approved fallback through the selected gateway account. Test current grant changes during a request.
- Verify gateway and provider retention/region controls instead of assuming SDK portability implies identical policies.
- Verify Mailpit capture, Resend sender/authentication, stable SMTP idempotency headers, delayed/expired-token jobs, and account recovery. No mail was sent by this research.

## Evidence confidence

Package versions, peer ranges, exports, Vite+ bundled versions, Mailpit release, and public gateway model IDs were read directly from maintainer metadata or shipped tarballs. These are high-confidence observations as of the research date. Functional/API capabilities come from first-party docs. Product fit, dependency removals, retry policy, and gateway selection are architecture recommendations. Account access, real payload behavior, latency, production delivery, and native build compatibility remain untested.
