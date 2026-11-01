# Mapbox pricing and product-fit research

> Selection update: Mapbox web/native SDKs are now selected. The alternatives below remain dated comparison evidence. Current versions and installation stages belong in the [canonical stack register](../../architecture.md#14-canonical-stack-and-dependency-register).

Research date: 1 November 2026. Scope: Kairn's R1 web/native 2D journey maps. This is supporting evidence, not a selected dependency list. Architecture section 14 remains the canonical stack register. USD estimates exclude taxes, currency conversion, support, special contracts, storage, AI, and VPS costs.

## Recommendation

Mapbox deserves serious consideration for a small community launch because its SDK pricing has separate free web-map-load and mobile-MAU allowances. Those advantages do not automatically apply when Mapbox tiles are consumed through MapLibre. We have three real paths: keep MapLibre with MapTiler, keep MapLibre with Mapbox APIs and pay per tile, or adopt Mapbox GL JS plus its native SDK through a community React Native bridge.

Our required experience is a readable 2D journey with imported route overlays, markers, honest gaps, day selection, and user-started playback. It does not require a Navigation SDK, turn-by-turn directions, traffic, live tracking, Matrix, Optimization, Isochrone, Search Box, MapGPT, 3D scenes, offline basemap downloads, or hosted journey tiling. Those products must not be added to an initial cost estimate merely because Mapbox offers them. Offline photo/voice capture is a different feature from downloading offline maps.

## Public rates observed

These are progressive monthly brackets, not a price applied retroactively to all usage. Public pricing has no mandatory $30/month map subscription equivalent to MapTiler Flex for these metered Mapbox products. Recheck actual account terms before activation. [Mapbox pricing](https://www.mapbox.com/pricing).

| Product | Included monthly units | Marginal price per 1,000 units above allowance |
|---|---:|---|
| GL JS web map loads | 50,000 | 50,001–100,000: $5; 100,001–200,000: $4; 200,001–1,000,000: $3; 1,000,001–5,000,000: $2.50. |
| Maps SDK mobile MAUs | 25,000 | 25,001–125,000: $4; 125,001–250,000: $3.20; 250,001–1,250,000: $2.40. |
| Static Images requests | 50,000 | 50,001–500,000: $1; 500,001–1,000,000: $0.80; 1,000,001–5,000,000: $0.60. |
| Direct Vector Tiles requests | 200,000 | 200,001–2,000,000: $0.25; 2,000,001–4,000,000: $0.20; 4,000,001–20,000,000: $0.15. |
| Direct Raster Tiles requests | 750,000 | 750,001–2,000,000: $0.25; 2,000,001–4,000,000: $0.20; 4,000,001–20,000,000: $0.15. |

Higher volume brackets require sales or the relevant current agreement. Static Tiles is another product, distinct from Static Images and Raster Tiles; do not substitute one unit/rate for another.

### Web metering

A GL JS map load starts when a `Map` object is initialized. Its maximum session is 12 hours. Pan, zoom, layer changes, and switching styles on the same instance do not create another map load. A fresh map instance does. Lazy-load Explore and retain its instance through day/view changes where appropriate rather than initializing one map per chapter, card, or tab. [GL JS billing definition](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/).

GL JS load pricing bundles the ordinary Vector/Raster Tiles use required to display and interact with that SDK map. Satellite imagery is supplied by Raster Tiles. Terrain elevation sources use raster terrain data, but an arbitrary standalone terrain/API request is not proof of being bundled. Budget chosen style/source requests through the actual SDK and inspect billing during qualification. Own GeoJSON from our API can be displayed without uploading it to Mapbox Tiling Service. [Mobile included services](https://docs.mapbox.com/android/maps/guides/pricing/), [elevation data](https://docs.mapbox.com/data/tilesets/guides/access-elevation-data/).

### Native and React Native metering

The current native SDK counts users who invoke map functionality during the billing period, not everyone who signs into our app. It counts a reinstall as another SDK identity. Repeated map opens by the same counted installation do not normally produce another MAU. These are provider billing identities, not our canonical account totals. [Android MAU definition](https://docs.mapbox.com/android/maps/guides/pricing/).

The official accounts guide classifies the community React Native bridge under Legacy SDK MAUs and explicitly states that its allowance and per-MAU rates equal the current Maps SDK mobile rates. Therefore the published 25,000/$4 bracket can support an illustrative React Native estimate. Confirm the actual SDK/bridge line item in the account. Maps-only legacy/current MAU docs include ordinary Vector/Raster use; old Navigation SDK combinations have separate exceptions that do not apply to our excluded Navigation product. Downloaded offline-map resources are a separate case and are excluded from these R1 scenarios. [Hybrid framework classification and equal rates](https://docs.mapbox.com/accounts/guides/pricing/#hybrid-frameworks), [legacy map-only coverage](https://docs.mapbox.com/android/legacy/maps/guides/pricing/).

## Keeping MapLibre is possible, but changes the calculation

Mapbox documents using its vector/raster/satellite APIs in MapLibre GL JS. This is not inherently an unsupported or forbidden combination. The English canonical fetch was unavailable in this research environment; Mapbox's current Japanese-locale URL served the full English-content guide and examples. [Official MapLibre guide](https://docs.mapbox.com/help/ja/dive-deeper/mapbox-in-maplibre/).

The guide confirms these important details:

- Direct HTTPS resource URLs replace `mapbox://` URIs, which MapLibre does not resolve automatically.
- Vector tiles can be combined with an owned compatible style and glyph/sprite resources.
- Mapbox GL JS is the first-class route to the full Mapbox Standard ecosystem; do not assume a Mapbox Standard style is portable to another renderer.
- Tile calls through a third-party renderer are billed individually rather than bundled as a GL JS map load.

Mapbox vector and raster meters have separate allowances. A satellite-plus-label style may use both. Count each source request in its actual product meter. Fonts, styles, sprites, retries, cache behavior, device pixel ratio, viewport, zoom, and source composition affect the real footprint; do not assume every vendor produces an identical request count for an identical interaction. The direct-tile scenario below is deliberately a pure-vector illustration, not an imagery bill or measured workload.

A native MapLibre client is not the Mapbox native SDK. Do not assign its tiles the React Native Mapbox MAU tariff merely because both clients run in React Native. Authenticate and verify all style/tile/glyph resources and the actual attribution path before selecting Mapbox under MapLibre Native.

## Concrete SDK and compatibility implications

Observed npm candidates are `mapbox-gl` 3.34.1 and community `@rnmapbox/maps` 10.3.16. These are evaluated alternatives, not dependencies to install while MapLibre remains selected. The bridge supports Mapbox native SDK v11 and React Native 0.79+, has an Expo config plugin, and requires a native build rather than Expo Go. Its broad RN/Expo peers do not prove Expo SDK 58 / RN 0.88 device compatibility. [Bridge repository](https://github.com/rnmapbox/maps), [Expo installation](https://rnmapbox.github.io/docs/install), [web metadata](https://registry.npmjs.org/mapbox-gl/3.34.1), [bridge metadata](https://registry.npmjs.org/@rnmapbox/maps/10.3.16).

The bridge is MIT/community maintained, while Mapbox GL JS and underlying native SDKs use Mapbox terms. The bridge's optional web shim still declares `mapbox-gl ^2.9.0`; it is not a reason to downgrade the separate Vite web application or claim that all web/native peer ranges align. Keep the native workspace separate and qualify the exact selected pair. Installation docs also explicitly say they cover the 10.2 series, so current package/source and real builds take precedence over copying that guide blindly. [GL JS license](https://github.com/mapbox/mapbox-gl-js/blob/v3.34.1/LICENSE.txt).

Retain required attribution/logo controls and native telemetry opt-out behavior. The Android documentation requires a separate opt-out if replacing the built-in information button. Satellite has extra imagery attribution. No location component, background recorder, Navigation SDK, or live tracking permission is required to render our historical routes. Review actual SDK telemetry and requested-area exposure against product privacy commitments. [Attribution and opt-out](https://docs.mapbox.com/help/dive-deeper/attribution/).

## Product feature costs

| Feature | Required now? | Cost treatment |
|---|---|---|
| 2D outdoor/street basemap, own routes/markers, day selection, playback | Yes. | Base SDK load/MAU or direct-tile meter. Our own overlays do not require a hosted tileset. |
| Satellite style | Optional same-renderer style. | SDK bundle or Raster Tiles meter depending integration; test source composition. |
| 3D terrain/globe/buildings/cinematic cameras | No. | No extra product/processing pipeline selected for R1. |
| Static map in social card | Not required; current cards are approved photo/text. | Optional Static Images API usage and terms/attribution review. |
| Place lookup/reverse geocoding | Conditional. | Separate Geocoding API and storage rights. Manual correction is complete baseline. |
| Calculated road/walking connection | Conditional. | Separate Directions API; stays labelled estimated. No Navigation SDK required. |
| Navigation, Matrix, Optimization, Isochrone, map matching | No. | Exclude entirely. Imported route display does not imply any of them. |
| Offline maps, custom tileset hosting/processing | No. | Exclude. Our source storage is SeaweedFS/S3, not a map-hosted media store. |

Temporary Geocoding allows no stored/cached results. A place label written into a permanent published journey needs the proper permanent-use mode and permitted redistribution/use, not a silent assumption that a free temporary lookup may be saved. The current pricing page shows permanent rates beginning at $5/1,000 with no free allowance, and says to contact sales. An illustrative 1,000 such lookups starts at $5, subject to suitability/terms. Temporary lookup starts with 100,000 free and $0.75/1,000 in the next bracket; Directions starts with 100,000 free and $2/1,000 in the next bracket. These conditional APIs are not added to the baseline bill. [Geocoding storage rules](https://docs.mapbox.com/api/search/geocoding/#storing-geocoding-results), [pricing](https://www.mapbox.com/pricing).

Static Images has an explicit image API and attribution guidance, but neither a low price nor its ability to return PNG files grants unrestricted caching/export/redistribution. Verify the current product terms for the exact intended downloadable/share-card output. The currently linked October 20, 2026 terms PDF could not be fetched here; do not rely on older terms as legal clearance. [Static Images](https://docs.mapbox.com/api/maps/static-images/), [current terms landing page](https://www.mapbox.com/legal/product-terms).

## Calculated monthly illustrations

These are scenario inputs from the parent analysis, not forecasts or measured traffic. `W` means all billable web map initializations, including creator views. `N` means billed native Mapbox SDK users. Four native map opens per `N` affect direct tile traffic, not the SDK MAU count.

| Scenario | W web map loads | N native map MAUs | Mapbox SDK map-only total |
|---|---:|---:|---:|
| Small | 5,000 | 500 | $0 |
| Growing | 25,000 | 2,500 | $0 |
| Larger | 100,000 | 10,000 | $250 |
| Higher | 250,000 | 30,000 | $820 |

For W=250,000, progressive web charge is `50,000×5/1,000 + 100,000×4/1,000 + 50,000×3/1,000 = $800`. N=30,000 adds `5,000×4/1,000 = $20`. This is not $5 applied to all 250,000 loads.

An alternative pure-vector MapLibre illustration with billable Vector Tiles requests `R` yields:

| R requests/month | Direct Vector Tiles charge |
|---:|---:|
| 210,000 | $2.50 |
| 1,050,000 | $212.50 |
| 4,200,000 | $880 |
| 11,100,000 | $1,915 |

For `R ≤ 20,000,000`:

```text
vectorCost(R) =
  max(0, min(R, 2,000,000) - 200,000) × 0.25 / 1,000
  + max(0, min(R, 4,000,000) - 2,000,000) × 0.20 / 1,000
  + max(0, R - 4,000,000) × 0.15 / 1,000
```

Raster uses the same paid brackets but replaces the first allowance with 750,000. Do not apply that larger allowance to vector data, add identical tile calls to an already bundled SDK estimate, or use a web free map-load allowance for MapLibre.

## Decisions for the parent document

Mapbox SDKs are often cheapest at modest user counts because a mobile MAU can make many map visits and a web session can pan extensively without a tile meter for its ordinary included map use. MapLibre plus Mapbox APIs preserves the current renderer but can become more expensive than a plan with cheaper marginal API requests once its own tile allowance is exceeded. Cost depends on the integration route, not just the vendor logo.

Keep all journey geometry/private source data under our own authority in every option. Use actual representative India fixtures to compare trail/contour labels, remote coverage, satellite freshness, typography, memory, and gesture performance; no provider-quality winner was measured by this research.

Before selecting a route, qualify actual SDK/native build compatibility, the account's billable line items, imagery/terrain sources, current terms, privacy, and burst/usage controls. Billing alerts are not necessarily hard spending caps. Retain readable Story/Learn and the list fallback when a map is not loaded or a provider is unavailable.

Three focused search rounds plus direct first-party documentation, pricing, source, and registry retrieval produced these findings. No SDK was installed, map rendered, account created, token used, paid API called, or production cost measured.
