# Self-hosted services research

Historical first-pass research. Recommendations may be superseded by the current architecture. The sole current stack/dependency register is [architecture section 14](../../architecture.md#14-canonical-stack-and-dependency-register). This file is evidence, not an install list.

Research date: 1 November 2026. These are proposed decisions for the complete R1 product, not implementation evidence. Product requirements remain authoritative.

## Recommendation

The user clarified that app and data must be self-hosted, external AI and maps APIs are permitted, an existing VPS is available, and budget is not the immediate constraint. The primary deployment therefore uses external licensed basemap delivery and external model/transcription APIs. The detailed self-hosted map and inference research below is an optional deployment path, not a required set of services.

Use a TypeScript modular monolith on Node.js, with separate processes for HTTP serving and background work. Hono serves the API, Better Auth, viewer rendering, and permission-checked media delivery. PostgreSQL owns transactional state, geographical data, search, retrieval metadata, and job queues. SeaweedFS stores private originals and derivatives through an S3-compatible API. Isolate media parsing and transcoding from HTTP serving. Workers call provider adapters for AI and transcription; no GPU process is required on the VPS.

This shape keeps publication and source-grant decisions in one transaction boundary while letting resource-intensive workers scale independently. Microservices would make rights changes distributed before the team has evidence that independent domain deployments are needed. A self-hosted Supabase deployment is viable, but its auth/storage/realtime components do not supply Kairn's canonical publication, derivative-dependency, source-withdrawal, or stale-edit rules. PostgreSQL with a purpose-built application is the smaller fit.

Use MapTiler basemap delivery through MapLibre as the initial map-provider direction, subject to renderer, attribution, caching, and static-card licensing checks against the selected plan. Keep journey geometry and all private source data on the VPS. Use an external AI/transcription provider through a server-only adapter; the parent architecture research selects the current provider models. Reading, capture, editing, publication, and text search survive provider failure. Grounded questions remain a required R1 capability, so an operating provider integration and quality evidence are release obligations.

Keep API keys server-side except a deliberately public, origin-restricted map renderer key. Transcription uploads and model context require disclosed processing permissions and retention terms. Send only selected media for its authorized task, and only currently approved excerpts for public questions. Basemap requests can reveal a viewer's IP and requested area to the provider. Redact source geometry before supplying client payloads; a map key is never an authorization control for journey content.

## Backend and data decisions

| Area | Selection | Reason and alternative |
|---|---|---|
| Runtime | Node.js 26.13.0 LTS | The dated 28 October release marks v26 LTS. A previous-releases overview still labels 26 Current; prefer the dated release and verify again when creating images. Do not select the v27 alpha. |
| HTTP | Hono 4.13.16 with a Node adapter | A small Fetch-based application can mount authentication and serve public React rendering, API routes, and the media gateway. Fastify 5.12.7 is the strongest Node-only alternative when its plugin ecosystem outweighs a common Fetch interface. Framework selection does not replace request limits or authorization. |
| Validation/contracts | Zod 4.6.7 and versioned HTTP contracts | Validate external inputs and derive OpenAPI/client types. Mobile release skew makes a public contract valuable even in one monorepo. |
| Database | PostgreSQL 18.6 | Latest stable listed in the primary release archive. PostgreSQL 19 is still RC1 in the reviewed official documentation. Release 18.5 was withdrawn. |
| Geography | PostGIS 3.7.0 | Released 30 October, supports PostgreSQL 14–19. Use geometry/geography operations for bounds, simplification, spatial lookup, and evidence-preserving statistics. It does not reconstruct a missing measurement. |
| Data access | Drizzle ORM 0.45.4, Drizzle Kit 0.31.11, `pg` 8.23.1 | Explicit SQL suits PostGIS, permission joins, FTS, and queue transactions. Drizzle 1.0 RC is excluded. Use reviewed SQL migrations for extensions and spatial operations not represented cleanly by the ORM. |
| Authentication | Better Auth 1.7.15 | Self-hosted sessions and account recovery with a documented Drizzle integration. Journey capabilities and source grants remain application data; a journey need not become an authentication organization. |
| Jobs | pg-boss 12.38.0 | PostgreSQL queues avoid an initial Redis/Valkey service. pg-boss supports enqueueing inside an existing transaction and requires Node 22.12+ and PostgreSQL 13+. Use separate queues and pools for media, ASR, indexing, publication, deletion, and export. |
| Search | PostgreSQL full-text search, `pg_trgm`, and pgvector 0.8.7 | Metadata filters and lexical search need no separate engine. Embeddings improve paraphrase/cross-language retrieval. For a small journey, exact similarity over authorized chunks may beat a complex ANN index. Add HNSW when measured query sizes justify it. |

Version sources are the [Node release](https://github.com/nodejs/node/releases/tag/v26.13.0), [PostgreSQL 18.6 notes](https://www.postgresql.org/docs/release/18.6/), [PostGIS news](https://postgis.net/news/), [Drizzle extension documentation](https://orm.drizzle.team/docs/extensions), [Better Auth installation](https://better-auth.com/docs/installation), [pg-boss project](https://github.com/timgit/pg-boss), and [pgvector changelog](https://github.com/pgvector/pgvector/blob/master/CHANGELOG.md). These are first-party project sources, Tier 4 in the code-research hierarchy.

Npm versions above were observed directly from the package registry. Registry `latest` is not a reliable stable filter: Prisma CLI currently points to `8.0.0-rc.29`, while `@prisma/client` latest is 7.10.1. Filter prereleases and check compatible peers before freezing a lockfile. Better Auth's observed peers include Drizzle `^0.45.2` and `pg ^8`, so this proposed combination fits its declared peer ranges. It has not been installed or runtime-tested here.

pg-boss claims must not become a promise of exactly-once external effects. A worker can finish writing an object and crash before acknowledging a job. Every effect needs a deterministic key or deduplication record, bounded retries, timeout, cancellation, and visible failure state. Enqueue inside the transaction that records the business change, or use a transactional outbox. Do not perform a database write and an unrelated queue send with a gap between them.

BullMQ 6.5.3 is an alternative when queue throughput, specialized flow control, or the team's Redis experience justify another stateful service. Valkey avoids assuming Redis licensing or compatibility without a decision. Defer both, and measure PostgreSQL queue contention and retention first.

## Object storage decision

Select SeaweedFS 4.51, Apache-2.0, for originals, quarantine, derivatives, and export archives. Its official release is dated 25 October 2026. Its single-node `weed mini` setup can run the S3 store and required internal components together. A production deployment still needs authenticated endpoints, persistent volumes, backups, monitoring, and controlled administrative access. One process on one server is not high availability. [SeaweedFS project](https://github.com/seaweedfs/seaweedfs), [4.51 release](https://github.com/seaweedfs/seaweedfs/releases/tag/4.51).

Garage is a credible smaller alternative for a deliberately narrow S3 subset. Its own table documents presigned URLs and multipart uploads, but no bucket versioning or AWS bucket policies, and a different per-key/bucket permission model. It is AGPL-3.0. Those differences are manageable with application-controlled immutable keys, but SeaweedFS's broader functionality and Apache license make it the default here. Do not call either a drop-in implementation of every AWS operation. Run upload, multipart completion/abort, range, checksum, expiry, and delete compatibility tests against the selected version. [Garage compatibility](https://garagehq.deuxfleurs.fr/documentation/reference-manual/s3-compatibility/), [Garage source and license](https://github.com/deuxfleurs-org/garage).

Do not choose upstream MinIO Community for a new deployment. Its official repository is archived as of 25 April 2026. A separately maintained fork or commercial product needs its own decision and evidence. [MinIO repository](https://github.com/minio/minio).

Use `@aws-sdk/client-s3` 3.1161.0 against the self-hosted endpoint. This is an SDK choice, not a dependency on AWS hosting. Application code uses only the required S3 subset.

### Private-read strategy

Keep original, quarantine, derivative, and export buckets private. A published story never exposes an original object URL. The final architecture uses authenticated bounded upload sessions and proxies chunks to private S3. Presigned uploads to a server-issued immutable key are an evaluated alternative. Either route finalizes only after server-side verification of actual bytes, size, checksum, and ownership.

Serve publication media through the application's media gateway. Each GET, HEAD, and range request resolves current visibility, the active publication, asset dependencies, and current source grants. The gateway can stream private S3 bytes or authorize an internal reverse-proxy route. The private store is unreachable as a public bypass. A raw presigned download remains usable until expiry, so use the gateway when the product requires faster rights revocation.

A rights change commits an immediate authoritative deny and increments the relevant permission generation. It also queues cleanup of thumbnails, old versions, cards, search entries, and cached answers. Cleanup completion is not what makes access denial effective. Cache identity includes publication and permission generation. Workers recheck that generation before committing a derived artifact. Fail closed when policy state cannot be read.

Use conservative cache headers for permission-sensitive responses. Revocation cannot erase a viewer's downloaded bytes or an external social preview. Document and measure the maximum controlled cache lifetime, in-flight response behavior, and token lifetime rather than promising instantaneous global deletion. These are Kairn design recommendations derived from PUB-02 through PUB-08 and COL-07, not properties supplied by an object store.

## Optional self-hosted map delivery

Use MapLibre GL JS 6.16.0 on web, with PMTiles 4.5.0 for archive access. For native maps, `@maplibre/maplibre-react-native` 11.5.1 wraps MapLibre Native; its reviewed requirements are React Native at least 0.80 and the new architecture. Use an Expo development build and real-device checks. The demo tile service is for development, not the production map backend. [MapLibre React Native setup](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/).

Host a Protomaps basemap archive and all style JSON, fonts/glyphs, sprites, and attribution assets on your infrastructure. Browser PMTiles access uses HTTP range requests. `pmtiles serve` can expose standard XYZ endpoints behind Caddy for native portability, instead of assuming the browser protocol adapter works in React Native. Do not introduce a custom Caddy plugin unless its build and update burden is justified. [PMTiles storage requirements](https://docs.protomaps.com/pmtiles/cloud-storage), [server deployment](https://docs.protomaps.com/deploy/server), [styles and sprites](https://docs.protomaps.com/basemaps/flavors).

Start with a low-zoom world archive and detailed extracts for supported regions. This keeps international and participant-specific departure legs visible without downloading the entire detailed planet. The reviewed full planet is roughly 120 GB for zoom levels 0–15. Actual regional size, update frequency, and bandwidth must be measured. Publish coverage and a readable fallback. Store each imported journey's geometry in PostgreSQL; it is separate from the basemap. [Protomaps downloads](https://docs.protomaps.com/basemaps/downloads), [regional extraction](https://docs.protomaps.com/guide/getting-started).

MapLibre/PMTiles rendering code and OSM-derived basemap data have different licenses. Preserve OSM attribution and ODbL obligations, inspect the precise data, style, sprite, and font licenses, and retain a source manifest for downloaded assets. Self-hosting does not remove those requirements. Protomaps documents BSD code and ODbL data. OpenMapTiles is a valid alternative schema/generation stack, but running its full pipeline is unnecessary when a suitable maintained archive can be mirrored. Do not use the public OSM tile server as the production backend.

No geocoding or road router is necessary for the baseline. Authors can correct places and label estimated connections without claiming an exact route. Self-hosted Photon/Nominatim and Valhalla/OSRM are possible later choices for verified conditional suggestions, with substantial import/update/storage costs. Do not start those services just to place a GPX line on a map.

## Media and route processing

| Capability | Selection | Constraint |
|---|---|---|
| Images | Sharp 0.35.5 | Create bounded thumbnail/display derivatives and strip embedded private metadata. Process HEIC/AVIF only if the exact container build supports the declared codecs. |
| Source metadata | `exiftool-vendored` 39.1.0 | Maintained metadata extraction across photographs and media containers. The npm wrapper is MIT and requires Node 22+. Inspect bundled executable licenses and distribution notices as well. Prefer it over relying solely on `exifr` 7.1.3, whose registry release is from 2021. |
| Video/audio inspection and conversion | FFmpeg/ffprobe 9.0.2 | Current stable series observed through the official release archive. Pin the exact build and codec configuration. LGPL/GPL behavior depends on build flags and linked codecs; playback codec/patent questions remain a separate distribution review. |
| GPX | `fast-xml-parser` 5.11.2 plus an application-owned GPX normalizer | Reject DOCTYPE/entity declarations, enforce byte/depth/point/time limits, preserve track segments and missing values, and distinguish recorded tracks from planned routes. The parser is not a complete domain model or security boundary. |
| FIT | Official `@garmin/fitsdk` 21.218.0 | Its FIT Protocol License is not MIT/Apache. Preserve required notices and verify intended use against the exact license. Activity decoding does not grant Garmin Connect API access or rights to publish someone else's data. |
| Static social cards | Server-side bounded image composition | Render only eligible publication derivatives and approved caption/identity. A downloaded card cannot be recalled. A browser automation service is unnecessary for the initial simple image composition. |

Sources are the [Sharp project](https://sharp.pixelplumbing.com/), [ExifTool wrapper](https://github.com/photostructure/exiftool-vendored.js), [FFmpeg release archive](https://ffmpeg.org/releases/), [FFmpeg license](https://ffmpeg.org/legal.html), [fast-xml-parser project](https://github.com/NaturalIntelligence/fast-xml-parser), [Garmin SDK documentation](https://developer.garmin.com/fit/get-the-sdk/), and [FIT SDK license](https://github.com/garmin/fit-javascript-sdk/blob/main/LICENSE.txt). FFmpeg's main download page timed out in this research environment; the official `ffmpeg-9.0.2.tar.xz` URL returned its expected archive content type. Verify signed artifacts before creating a worker image.

Use separate non-root worker containers with memory, CPU, wall-time, input/output, and temporary-disk limits. Parsers and FFmpeg receive local files, not arbitrary user-controlled URLs. Deny worker network egress except the internal object store and required internal inference endpoints. Preserve original files separately from normalized metadata and reviewed corrections. Cancellation must prevent obsolete jobs from restoring a withdrawn derivative.

## Optional self-hosted AI and transcription

Use explicit retrieval and answer functions in the application rather than introducing an agent framework. The model receives only authorized approved-source excerpts, a bounded question, and a response schema. It has no database credentials, raw object-store access, arbitrary browsing, or tools that can widen access. A prompt is not an authorization mechanism.

### Current model candidates

These are concrete, currently available candidates for the required workload. They are not a claim to be the newest or best models globally. Final quantization, language declaration, context limits, concurrency, and quality thresholds require tests with consented community recordings and journey questions.

| Role | Candidate and immutable upstream revision | Serving decision |
|---|---|---|
| Speech transcription | `openai/whisper-large-v3-turbo`, revision `41f01f3fe87f28c78e2fbf8b568835947dd65ed9` | Multilingual candidate. Use whisper.cpp 1.9.5 for the CPU-first native worker path. Convert and record the upstream revision plus converted artifact checksum. A GPU deployment may use faster-whisper 1.2.1 with CTranslate2 4.8.4. |
| Text embeddings | `Qwen/Qwen3-Embedding-0.6B`, revision `97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3` | Apache-2.0. Use 1024-dimensional output initially, unless evaluation selects a smaller supported dimension. Record dimension, model revision, tokenizer, and normalization with each embedding generation. CPU embedding is possible with bounded batches. |
| Grounded answers and structured suggestions | `Qwen/Qwen3.5-9B`, revision `c202236235762e1c871ad0ccb60c8ee5ba337b9a` | Apache-2.0. Use text-only inputs for R1 questions and suggestions, even though the checkpoint also supports vision. vLLM 0.32.0 is the GPU-serving default. llama.cpp 0.8.0 is the CPU/quantized alternative if measured latency and concurrency meet the product's declared limits. |

Primary model cards are [Whisper turbo](https://huggingface.co/openai/whisper-large-v3-turbo), [Qwen embedding](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B), and [Qwen3.5 9B](https://huggingface.co/Qwen/Qwen3.5-9B). Revisions were observed from their first-party Hugging Face model API. Pin generated GGUF/CTranslate2 assets by checksum as well; a model name alone does not identify a reproducible deployment.

The reviewed [whisper.cpp release](https://github.com/ggml-org/whisper.cpp/releases/tag/v1.9.5) is dated 6 October. [llama.cpp 0.8.0](https://github.com/ggml-org/llama.cpp/releases/tag/v0.8.0) is the latest non-prerelease in the first 100 releases from the GitHub API, dated 28 October. Do not select a newer `b...` prerelease by mistake. [vLLM 0.32.0](https://github.com/vllm-project/vllm/releases/tag/v0.32.0) is dated 18 October and its PyPI metadata requires Python >=3.11 and <3.15. Keep the GPU inference image's CUDA/PyTorch/driver combination together rather than upgrading its components independently.

[faster-whisper](https://github.com/SYSTRAN/faster-whisper) documents CUDA 12 and cuDNN 9 for its current CTranslate2 GPU path. A vLLM image need not have the same dependency set as a transcription image. Choose one transcription path per deployment profile, not two default services. CPU execution is a lower-cost option, not proof that any tiny VPS can supply acceptable ASR or answer latency.

Whisper memory tables describe model-dependent memory, not Kairn capacity. Likewise, 9B parameters at two bytes per parameter require roughly 18 GB for weights alone before runtime and context overhead. Quantization changes memory and accuracy. Select GPU memory and supported concurrent requests from measured loaded-model usage; avoid promising a generic GPU count or a per-question latency before hardware exists. Reserve memory separately for ASR and embeddings or serialize their GPU work.

### Grounding and revocation

1. Filter by one canonical journey, its current accessible approved publication, current grants, and source status before constructing model context.
2. Combine PostgreSQL lexical retrieval and semantic ranking. Preserve source IDs, revision IDs, passage offsets or audio time ranges, visit date, and cost units.
3. Generate a bounded structured answer with only the supplied citation IDs. Validate IDs and access again before serving. Abstain when the evidence is absent, contradictory, or outside that historical journey.
4. Recheck publication and permission generations before committing or returning an answer. Do not let a question started before withdrawal return removed content afterward.
5. Cache against the approved version, rights generation, retrieval/model versions, and relevant question/session scope. Apply current access checks to stored answer reads too.

Do not stream factual answer text to the viewer before required citation/access checks complete. A private model endpoint and strict egress rules keep content processing on the chosen infrastructure. Disable telemetry and download models into a controlled build/cache path; no journey content goes to model distribution services. Do not use private material for training.

## Deployment, operations, and versions

Use Docker Compose on the existing Linux VPS for the initial complete production system. Keep API, CPU media workers, database, store, and operations as separate services with resource limits and private networking. External maps and AI do not require local map or inference containers. Add those optional services only under a separate operating decision. A future GPU machine can receive jobs through internal HTTP, with authentication, timeouts, and no public inference endpoint. Separate production and staging storage, credentials, and database state. The VPS CPU, RAM, disk, operating system, available ports, and existing workloads remain unknown; inspect them before assigning worker concurrency and database memory.

| Component | Latest stable observation | Evidence |
|---|---|---|
| Caddy | 2.11.7, 3 October | [Release](https://github.com/caddyserver/caddy/releases/tag/v2.11.7) |
| Docker Compose | 5.6.1, 21 October | [Release](https://github.com/docker/compose/releases/tag/v5.6.1) |
| PostgreSQL backup | pgBackRest 2.60.0, 18 October | [Release](https://github.com/pgbackrest/pgbackrest/releases/tag/release/2.60.0) |
| File/object backup | restic 0.19.1, 5 July | [Release](https://github.com/restic/restic/releases/tag/v0.19.1) |
| Metrics | Prometheus 3.15.1, 21 October | [Release](https://github.com/prometheus/prometheus/releases/tag/v3.15.1) |
| Dashboards | Grafana 13.3.0, 27 October | [Release](https://github.com/grafana/grafana/releases/tag/v13.3.0) |
| Telemetry collection | OpenTelemetry Collector 0.164.0, 26 October | [Release](https://github.com/open-telemetry/opentelemetry-collector-releases/releases/tag/v0.164.0) |

These versions were observed via each project's first-party GitHub release API. Treat them as the dated candidate bill of materials and freeze actual deployment images by digest. Docker Engine, host distribution, GPU runtime, and all transitive libraries still need their own exact release manifest during implementation. This research does not claim an installed compatible system.

Use pgBackRest for PostgreSQL base backups and WAL/PITR. Back up object-store data and metadata consistently and keep the backup on a separate failure domain. restic can back up the store's supported snapshot/export output or a verified consistent filesystem snapshot; do not assume copying a live database or object-store metadata tree yields a valid backup. A second bucket on the same failed disk is not a backup.

Monitor queue age, failures, disk capacity, upload completion, ASR throughput, inference saturation, database locks, media latency, publication failures, withdrawal propagation, and backup freshness. Logs exclude bearer tokens, signed URLs, precise private coordinates, source text, and question contents by default. Prometheus and Grafana suffice initially; keep logs and optional traces bounded rather than adding an entire observability service for every signal.

Transactional email can run through a self-hosted SMTP service, but deliverability requires DNS and reputation work. Keep email behind an adapter and record whether a relay is permitted. Public DNS, certificate authorities, mobile app distribution, and optional platform push services are external boundaries even in a self-hosted application. Push is not required for R1 correctness; foreground sync and in-app status cannot depend on it.

## Open operating decisions

- External AI/maps APIs are permitted. Select provider regions, retention and training terms, credentials, limits, and licensed map usage before integration.
- Inspect the existing VPS and record launch users, uploaded media volume, retention period, expected concurrent viewers/questions, geography coverage, and existing server workloads.
- Declare transcription languages after noisy, mixed-language community samples pass. Select a measured CPU or GPU model profile only if adopting the optional self-hosted inference path.
- Set numerical media/route limits, processing deadlines, public-read quotas, answer quotas, storage quotas, RPO/RTO, and controlled-cache revocation maximum.
- Record who operates updates, backups, restore drills, account recovery, moderation, and takedowns. Full self-hosting includes these duties.

None of these questions changes the complete R1 product commitment or authorizes adding live tracking, navigation, unrestricted gallery access, autonomous agents, a preparation planner, or a separate journey per contributor.
