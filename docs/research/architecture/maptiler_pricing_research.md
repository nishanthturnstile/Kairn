# MapTiler pricing and product fit

> Evaluated alternative. Mapbox web/native SDKs are selected for the current implementation. This pricing research does not add MapTiler or MapLibre dependencies. Use the [canonical stack register](../../core/architecture.md#14-canonical-stack-and-dependency-register) for the current stack.

Research date: 1 November 2026. This is dated supporting evidence, not a second canonical stack register. Architecture section 14 owns selected dependencies. No paid account, keyed map render, or production traffic measurement was performed.

## What the $30 plan means

Flex is currently $30 USD/month before tax. It includes 500,000 API requests and 25,000 SDK map sessions; additional usage is $0.15 per 1,000 requests or $2.50 per 1,000 map sessions. Free includes 100,000 requests, 5,000 sessions, and five custom styles. Paid entitlements include Static Maps/WMTS/high-DPI features. These are current Free/Flex plans, not historical Starter/Hobby prices. [Official pricing](https://www.maptiler.com/cloud/pricing/).

The important distinction is eligibility. Free is limited to non-commercial use and commercial-product research/development. Budget Flex for a commercial public product unless MapTiler confirms a different applicable agreement. A free community launch does not, by itself, establish that the developer's use is non-commercial. Our custom GPX overlays, evidence styles, timeline animation, and publication features do not themselves require an advanced MapTiler API. [Cloud terms](https://www.maptiler.com/terms/cloud/).

Use normal attribution even on a paid plan. The ability to omit a provider logo in some paid 2D cases does not erase map/data credit requirements. Printing and exported map-bearing social files need their precise rights checked independently of API availability.

## Billing our proposed renderers correctly

Plain MapLibre GL JS and MapLibre Native are third-party clients and consume the API-request bucket. They cannot simply claim SDK session billing. Session accounting applies to MapTiler SDK JS or its Leaflet integration. Session-covered map tiles must not also be charged in our estimate as independent request usage; a mixed web-SDK/native-MapLibre app would consume separate pools.

| Request type | Documented weighted billing units |
|---|---:|
| Style JSON, TileJSON, fonts, viewer/XML metadata | 0 |
| Vector tile | 1 |
| Rendered 256-pixel raster tile | 1 |
| Rendered 512-pixel raster/HiDPI tile | 4 |
| Static Maps image | 15 |
| Hosted GeoJSON file | 1 |

Count weighted billable units, not every browser network request. The exact satellite/DEM endpoint and resolution must be checked against billing analytics; do not assume every 512-pixel raw dataset uses the rendered-raster weight. SDK sessions reset on reload, after six hours, or at 10,000 requests. [Billing model and weights](https://docs.maptiler.com/guides/account/sessions-vs-requests/).

MapTiler's own documentation recommends SDK sessions for heavy interaction and request billing for light map use. Retaining MapLibre keeps the existing rendering architecture smaller, but can cost more for long exploratory sessions. Do not add MapTiler SDK beside MapLibre merely to get another quota; adopting it is a renderer/toolchain decision. [Expense controls](https://docs.maptiler.com/guides/account/controlling-expenses/).

## What R1 uses

| Product behavior | MapTiler dependency/cost consequence |
|---|---|
| A quiet 2D Outdoor/topographic basemap | Basemap/style/tiles under the selected plan. Use vector rendering by default. |
| Recorded tracks, estimated connectors, gaps, participant branches, stops | Our approved GeoJSON and style layers; no hosted tileset or route-engine charge is required. |
| Chapter filtering and user-started playback | Client selection/animation. Playback can fetch more tiles when the camera moves, but it is not a separately priced animation product. |
| Day/story views and map-list accessibility | Our UI. Delay map initialization until intent; no map cost when the visitor only reads text and no map is loaded. |
| Optional satellite view | Same renderer can switch styles. Different tiles/cache/weights can change usage; measure it rather than assuming the vector-view count. |
| Practical knowledge, search, grounded answers | Our PostgreSQL/AI path, not MapTiler search. |
| Photos, clips, transcripts, GPX/FIT originals | Our S3-compatible storage, not the plan's geodata-storage add-on. |
| Static personal social card | Initial photo/text card requires no Static Maps request. A later map image needs both API usage and permitted output rights. |

No R1 requirement needs WMTS, map printing, high-DPI export, weather animation, GeoSplats, geodata upload/processing, turn-by-turn navigation, matrix/isochrone services, or a provider-managed route database. Geocoding and estimated routing remain conditional suggestions; leave them out of the baseline bill until adopted. Outdoor/Satellite are catalog map styles, not a reason to purchase a separate cinematic/3D subsystem. [Map catalog](https://www.maptiler.com/maps/), [tiles API](https://docs.maptiler.com/cloud/api/tiles/).

## Request-based cost model

Let `W` be monthly web map opens, `M` mobile map-active users, `O` mobile map opens per such user, and `q` the average weighted billable units per map open. This definition of `M` is a modeling input, not a MapTiler MAU billing unit.

```text
E = W + M * O
R = E * q
monthly_maptiler_usd = 30 + max(R - 500000, 0) * 0.15 / 1000
```

This models Flex with plain MapLibre and no search/static/3D/storage processing charges. It excludes taxes, currency conversion, media storage, VPS, AI, and negotiated volume discounts. `q` is unmeasured. Use 10, 30, and 60 as sensitivity inputs, not a claim about actual requests per visitor.

| Scenario | Web map opens `W` | Mobile users `M` | Opens/mobile user `O` | Total map opens `E` | Cost at `q=10` | Cost at `q=30` | Cost at `q=60` |
|---|---:|---:|---:|---:|---:|---:|---:|
| Small launch | 1,000 | 100 | 4 | 1,400 | $30 | $30 | $30 |
| Community | 10,000 | 1,000 | 4 | 14,000 | $30 | $30 | $81 |
| Growing | 50,000 | 5,000 | 4 | 70,000 | $60 | $270 | $585 |
| Larger | 100,000 | 10,000 | 4 | 140,000 | $165 | $585 | $1,215 |
| Scale | 200,000 | 30,000 | 4 | 320,000 | $435 | $1,395 | $2,835 |

These are our arithmetic scenarios, not provider forecasts. The included-request break point is approximately 50,000/16,667/8,333 opens at `q=10/30/60`. At 100,000 web map opens alone with `q=10`, Flex costs $105; at `q=30`, it costs $405. A second mobile or route-editing workload can materially change the comparison.

If web alone adopted MapTiler SDK sessions, a different model would apply: base $30 plus $2.50 per 1,000 web sessions above 25,000, with native MapLibre/API usage charged from its request pool. Do not count web tiles twice or apply the session allowance to native MapLibre.

## Cost controls and limits

Lazy-load the map; keep it alive when switching Story/Explore/Learn where appropriate; avoid unnecessary reconstruction on each chapter selection; retain only the intended map layer set; simplify our own route geometry; and do not preload tiles outside permitted usage. Our geometry simplification improves rendering but does not directly change a provider's basemap prices.

Set a Flex spending limit and monitor its weighted analytics. The documented limit can deactivate the API for the rest of the billing period, so Story and the stage list must survive that event. The request/page-view ratio should be measured by device, viewport, zoom behavior, satellite use, and cache state before treating any scenario as a budget. [Expense controls](https://docs.maptiler.com/guides/account/controlling-expenses/).

Temporary personal end-user caching is permitted under the reviewed cloud terms. Proxying/mirroring tiles into our SeaweedFS/R2 store, bulk offline packs, and external map exports are separate restrictions/agreements. Our S3 storage portability does not grant map-content redistribution rights. Keep initial cards photo/text-based and use direct authorized basemap delivery. [Cloud terms](https://www.maptiler.com/terms/cloud/).

## Decision implication

MapTiler is straightforward for the retained MapLibre architecture, and $30 can cover a small commercial launch. It is not automatically the cheapest option at every workload. The map-load/MAU model of a provider's own SDK can outperform request billing for interactive journeys. Compare full web/native workloads and required SDK changes, not the $30 subscription against another provider's advertised free quota alone.
