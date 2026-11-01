# Mapbox and MapTiler cost comparison

Research date: 1 November 2026. Scope: the complete R1 journey product and the user's launch ceiling of 10,000 people. Prices are USD per month before taxes, currency conversion, and any negotiated discounts. These are modeled map costs, not a quote or the application's total operating bill.

Mapbox SDKs are selected for web/native maps, basemaps, and satellite. [Architecture section 14](architecture.md#14-canonical-stack-and-dependency-register) owns the exact dependencies and versions. The other routes below are evaluated alternatives retained for cost comparison. SeaweedFS/S3 remains the selected media store.

## Selected route

Use the **Mapbox SDK route**. Its modeled launch charges fit the included web-load and native-user allowances at four openings per person. Mapbox supplies basemaps and satellite imagery. Our application supplies route overlays, markers, chapter selection, and playback without buying a Navigation product.

The superseded **MapLibre + MapTiler** route starts at $30 on Flex, but our illustrative 10,000-person case reaches $135. A MapTiler SDK web integration with MapLibre Native reaches $47.50 in the same model. These alternatives are not installed or configured in the current plan.

Mapbox data can also be used with MapLibre, but its direct tile rates are a different product from SDK pricing. That route reaches $250 in the illustrative vector-only launch case. Switching the tile URL alone does not earn the SDK allowances. [Mapbox's MapLibre guide](https://docs.mapbox.com/help/ja/dive-deeper/mapbox-in-maplibre/).

Mapbox selection is settled; implementation qualification remains. No map SDK has yet been built or tested in this application. Validate the community native bridge, account billing, attribution/telemetry, both selected styles, and representative India journeys during production implementation. Neither price nor a marketing screenshot establishes a coverage winner.

## What the product actually needs

| Feature | R1 need | Cost consequence |
|---|---|---|
| Quiet 2D outdoor/topographic map | Required. | Normal basemap/style delivery using the selected billing route. |
| Recorded GPX/FIT lines, captured stops, participant branches, uncertain gaps | Required. | Our approved geometry/style layers. No hosted tileset, provider route database, or map-matching service is needed. |
| Day filters and user-started timeline playback | Required. | Application controls. Camera movement can fetch tiles, but playback is not a separately purchased API. |
| Public Story and Learn | Required, map-independent. | No map charge when no map is initialized or requested. Lazy-load Explore or its map module. |
| Satellite view | Selected user-controlled option in the same Mapbox renderer. | Ordinary SDK imagery uses the SDK map-load/MAU route. The direct-tile alternatives below model vector requests only; they do not estimate satellite raster traffic. |
| Photo/text social cards | Required. | No Static Maps/Image call. Our media worker renders approved photographs/text. |
| Map-bearing social image | Not required now. | Optional Static Images/Maps requests plus output-rights review. |
| Place lookup or saved geocoded names | Conditional. | Separate lookup meter and storage/use permissions. Manual labels remain the baseline. |
| Provider-estimated road/walking connection | Conditional. | Directions/routing request if adopted; stays labelled estimated. Rendering an imported track does not require routing. |
| Navigation, traffic, Matrix, Optimization, Isochrone, offline basemap downloads, 3D/cinematic features | Outside R1. | Exclude from the baseline bill. Offline photo/voice capture is not offline-map downloading. |
| Photographs, video, transcripts, GPX/FIT originals | Required, self-hosted. | Our SeaweedFS/S3 storage; no MapTiler geodata-storage or Mapbox Tiling Service purchase. |

Both evaluated providers can support the required 2D experience. Mapbox is selected for its SDK integration, basemap/satellite coverage, and modeled launch pricing. Preserve solid recorded paths, dashed estimates, explicit gaps, readable attribution, and a complete stage-list fallback. The actual Indian coverage and native performance still need verification.

## What MapTiler's $30 means

Current Flex is a $30 monthly minimum with 500,000 API requests and 25,000 supported SDK map sessions. Overage is $0.15 per 1,000 API requests or $2.50 per 1,000 SDK sessions. Free includes 100,000 requests and 5,000 sessions, but eligibility is restricted to personal/non-commercial use and commercial research/development. Budget Flex for commercial production unless a different agreement applies. A free-to-users community app does not automatically qualify as non-commercial. [MapTiler pricing](https://www.maptiler.com/cloud/pricing/), [Cloud terms](https://www.maptiler.com/terms/cloud/).

The subscription is not a fee for our GPX overlay, timeline, chapter filters, or custom story UI. Free already supports basic vector/raster maps and custom styles. Flex also adds production entitlements and features such as Static Maps/WMTS/high-DPI outputs that our initial journey map does not require.

Plain MapLibre web/native consumes the **request** pool. MapTiler SDK JS uses **sessions**. Its web session allowance cannot be assigned to native MapLibre. In a mixed web-SDK/native-MapLibre deployment, web sessions and native requests consume their respective pools; do not count web tiles twice. [Billing definitions](https://docs.maptiler.com/guides/account/sessions-vs-requests/).

Count weighted billable units rather than every network call. Vector tiles count as one; style JSON, TileJSON, and font requests are not billed in that model. Rendered 512-pixel raster/HiDPI tiles can count as four, and a Static Maps image as fifteen. Check the exact satellite/DEM endpoint rather than applying one weight to every raw tile product. Long sessions also have reset rules.

## Mapbox units and prices that matter

| Integration/product | Included per month | First paid bracket | Why it matters |
|---|---:|---:|---|
| Mapbox GL JS map loads | 50,000 loads | $5 per 1,000 for the next 50,000 | A new `Map` initialization starts a load; ordinary interaction within that instance is included. |
| Native Maps SDK map users | 25,000 MAUs | $4 per 1,000 for the next 100,000 | Repeated map opens do not normally create new users. A provider installation identity is not necessarily our account identity. |
| Direct Vector Tiles through MapLibre | 200,000 requests | $0.25 per 1,000 up to 2 million | No web-load/mobile-MAU allowance applies to these calls. |
| Direct Raster Tiles through MapLibre | 750,000 requests | $0.25 per 1,000 up to 2 million | Separate meter from vector tiles; a satellite-plus-label style can use both. |
| Static Images | 50,000 images | $1 per 1,000 up to 500,000 | Optional only; initial social cards use no map image. |

These are progressive brackets and have no equivalent mandatory $30 subscription for the listed metered Mapbox products. Later web rates are $4/1,000 for 100k–200k loads and $3/1,000 for 200k–1m. Direct vector/raster rates fall to $0.20/1,000 from 2m–4m and $0.15/1,000 from 4m–20m. Use the actual product's brackets. [Mapbox pricing](https://www.mapbox.com/pricing).

The community React Native Mapbox bridge is classified as Legacy SDK MAU billing, but Mapbox explicitly states the same free allowance and per-MAU prices as current Maps SDKs. This supports the native estimate; confirm the real account line item during qualification. MapLibre Native is a different client and does not inherit that MAU pricing. [Hybrid framework billing](https://docs.mapbox.com/accounts/guides/pricing/#hybrid-frameworks).

Mapbox GL JS map loads include ordinary vector/raster tiles for the SDK map, with a maximum twelve-hour load session. Preserve one map instance where appropriate across chapter/view changes. Standalone APIs, offline resources, and any extra chosen terrain/imagery source must be checked against the actual SDK/account line items rather than assumed free. [GL JS metering](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/), [native included services](https://docs.mapbox.com/android/maps/guides/pricing/).

## Launch model for at most 10,000 people

The user supplied the people ceiling. The following additional inputs are our explicit assumptions:

- All modeled people are active and open maps during the month, including public/guest viewers. If 10,000 means registered accounts only, additional public viewers must be counted separately.
- 80% are web-only and 20% Android-only for this illustration. No person overlaps platforms in this simplified model.
- Each opens a map four times per month, including any counted authoring/preview map visits.
- The tile illustration uses thirty weighted MapTiler API units, or thirty direct Mapbox vector requests, per opening. These values are unmeasured. Actual provider request counts need not match.
- Dedicated account allowances are available; no other projects consume them. No search/routing/static/offline use is added.

| Monthly people | Web map loads | Android map MAUs | Selected Mapbox SDKs | Alternative MapLibre + MapTiler | Alternative MapTiler SDK web + MapLibre native | Alternative MapLibre + Mapbox vector tiles |
|---|---:|---:|---:|---:|---:|---:|
| 1,000 | 3,200 | 200 | $0 | $30 | $30 | $0 |
| 5,000 | 16,000 | 1,000 | $0 | $45 | $30 | $100 |
| 10,000 | 32,000 | 2,000 | $0 | $135 | $47.50 | $250 |
| 10,000 with ten opens each | 80,000 | 2,000 | $150 | $405 | $182.50 | $650 |

The $0 figures mean modeled map charges fit the public included allowances. They do not mean unlimited use, a guaranteed future tariff, or a $0 total application bill.

For the 10,000-person/four-open case, total map openings are 40,000 and the illustrative direct usage is 1.2 million units. MapTiler request billing is `$30 + 700,000 / 1,000 × $0.15 = $135`. The mixed MapTiler route bills 32,000 web sessions, or `$17.50` above its session allowance; 8,000 native openings at thirty units use 240,000 included requests, giving `$47.50`. Mapbox SDK usage stays below both allowances. Direct Mapbox vector cost is `1,000,000 / 1,000 × $0.25 = $250`.

At the same people ceiling with ten openings, 80,000 web loads give Mapbox `$150`; 2,000 native users remain included. User count alone therefore cannot guarantee a free bill.

### Sensitivity to tile use

With 10,000 people, four openings each, and the same platform split:

| Illustrative direct units per opening | Mapbox SDKs | MapLibre + MapTiler | MapTiler SDK web + MapLibre native | MapLibre + Mapbox vector |
|---:|---:|---:|---:|---:|
| 10 | $0 | $30 | $47.50 | $50 |
| 30 | $0 | $135 | $47.50 | $250 |
| 60 | $0 | $315 | $47.50 | $530 |

MapTiler's 500,000-request allowance covers 40,000 openings only while the average is at most 12.5 billable units per opening. Fewer people opening maps, light interaction, and permitted client caching can leave it at $30. Wide viewports, repeated exploration, multiple data sources, and high-resolution raster use can raise it. The request/session ratio is a measurement target, not an architectural constant.

## Calculation rules and optional services

Let `W` be monthly web map loads/sessions, `N` native map users, `O` native openings per user, and `q` illustrative direct units per opening.

```text
R = (W + N * O) * q

MapTiler + MapLibre =
  30 + max(R - 500000, 0) * 0.15 / 1000

MapTiler SDK web + MapLibre native =
  30 + max(W - 25000, 0) * 2.50 / 1000
     + max(N * O * q - 500000, 0) * 0.15 / 1000

Mapbox SDKs = progressiveWebLoadCost(W) + progressiveNativeMauCost(N)

Mapbox + MapLibre = progressiveVectorCost(vectorRequests)
                 + progressiveRasterCost(rasterRequests)
```

The [machine-readable model](research/architecture/map_cost_model.json) records inputs, progressive brackets, verified scenario outputs, and sources. Baseline optional API use is zero. If adopted, 10,000 Mapbox static images fit the published image allowance. Persisting geocoded place data needs the appropriate permanent-use mode; the researched permanent rate starts at $5/1,000, while temporary results cannot simply be saved in published journeys. Directions has a separate allowance/meter and never requires us to buy a Navigation SDK just to draw a calculated connection. Check use/storage rights and the current selected contract before enabling either conditional capability. [Geocoding storage rules](https://docs.mapbox.com/api/search/geocoding/#storing-geocoding-results).

## Implementation and spending controls

Implement the selected Mapbox web/native SDKs and required attribution/telemetry controls. Exact selected versions and workspace compatibility constraints are in the [canonical stack register](architecture.md#14-canonical-stack-and-dependency-register). Qualify the native build and real account metering during this workstream. Keep the evaluated alternative renderers out of the application dependency graph.

Initialize maps only when needed, avoid one map per journey card/chapter, retain the active instance across appropriate view changes, and inspect real billing after representative usage. Keep source overlays in our own data; route simplification improves rendering but does not change tariff rates. Set alerts and suitable provider limits, and keep Story/Learn/list reading usable when the map is unavailable. An alert is not automatically a hard spending cap.

Keep map attribution and all imagery credits. A Static Images/Maps API returning a PNG does not grant unrestricted retained/downloaded export rights. Current photo/text share cards avoid that additional dependency. Never mirror vendor basemap tiles into SeaweedFS/R2/S3 just because our media storage supports migration; those bytes have separate provider licenses and caching conditions.

## Evidence and limits

Primary research: [Mapbox findings](research/architecture/mapbox_pricing_research.md), [MapTiler findings](research/architecture/maptiler_pricing_research.md), and the official pricing/billing documents linked above. No keyed render, paid call, SDK build, account invoice, or real traffic benchmark was performed. The model excludes media storage and requests, VPS, AI, email, taxes, exchange rates, optional provider products, and support contracts.
