# Map provider revision research

> Historical comparison. The MapLibre/MapTiler recommendation below is superseded by Mapbox web/native SDKs with basemaps and satellite. Use the [canonical stack register](../../core/architecture.md#14-canonical-stack-and-dependency-register) for current decisions. This file preserves the earlier Esri comparison and is not an install plan.

Research date: 1 November 2026. Scope: the complete R1 product's licensed 2D journey map, web/native parity, evidence overlays, and static sharing. This is research evidence and a recommendation, not a second canonical stack register. The current selected stack belongs in `docs/core/architecture.md` section 14.

## Recommendation

Keep MapLibre GL JS on web and MapLibre React Native in Expo. Keep MapTiler as the first production basemap provider, with a restrained Outdoor style and an optional satellite view if the adopted plan permits it. This is the simpler implementation for the product's current 2D storytelling requirements, not a claim that its Indian trail coverage or imagery is superior.

Esri ArcGIS Location Platform is a credible alternative. It explicitly supports MapLibre GL JS and offers outdoor, topographic, imagery, relief, and low-detail reference styles. It can supply basemaps without hosting our journeys, routes, files, or permissions in ArcGIS. Its web integration is confirmed; its native MapLibre integration requires our own tested service/authentication/attribution handling. Do not change the app to a native ArcGIS SDK or host journey data in ArcGIS merely to use an Esri basemap.

Use one provider in the initial production implementation. Do not install both provider SDKs or implement automatic vendor failover. The application's own ordered stage list remains the outage fallback. Reconsider Esri if a licensed production comparison shows materially better imagery, terrain labeling, static-output suitability, or useful GIS services for actual community journeys.

## Can Esri be used with MapLibre?

Yes on web. Esri maintains the Apache-2.0 `@esri/maplibre-arcgis` plugin. It handles basemap style loading, sessions, and Esri/data attribution, with additional feature-layer capabilities that this product does not need. See the [official plugin overview](https://developers.arcgis.com/maplibre-gl-js/maplibre-arcgis-plugin/).

The service's current endpoint is:

```text
https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/{style_name}
```

It returns Mapbox Style Specification JSON for third-party renderers. The `webmaps` response is a different ArcGIS format and is not the direct MapLibre style input. Access needs a valid token with the basemap privilege. With `echoToken=true`, the service embeds token access in returned resource URLs; disabling that requires the client to authenticate all dependent resources. A style request succeeding does not prove tiles, fonts, sprites, and token refresh all work. [Service introduction](https://developers.arcgis.com/documentation/mapping-and-location-services/mapping/basemaps/introduction-basemap-styles-service/).

For native, this JSON format makes direct loading with MapLibre Native technically plausible. That is an inference from supported formats, not an official Expo integration guarantee. Esri's documented native SDK list names Kotlin, Swift, Flutter, .NET, and Qt, rather than a first-party React Native SDK. Its JavaScript MapLibre plugin uses browser controls and must not be imported into React Native. [Native SDK list](https://developers.arcgis.com/documentation/glossary/arcgis-maps-sdks-for-native-apps/), [MapLibre Native setup](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/).

The native Esri path must verify style parsing, dependent URLs, token refresh, native request headers, correct provider attribution after style/viewport changes, and resource failures. Browser CORS and native networking are separate checks. Do not assume web referrer restrictions behave like native app authentication. Scope the credential narrowly, use separate web/native credentials, and keep any app secret or token-minting secret on the server. Basemap keys never grant journey access. [ArcGIS authentication](https://developers.arcgis.com/documentation/security-and-authentication/api-key-authentication/).

## Current compatibility finding

| Component | Observation | Consequence |
|---|---|---|
| `maplibre-gl` | Registry latest `6.16.0`. | Existing current renderer candidate. |
| `@maplibre/maplibre-react-native` | Registry latest `11.5.1`; current peer ranges fit the proposed Expo combination. | Still requires a native development build and actual device integration. |
| `@esri/maplibre-arcgis` | Registry latest `1.3.2`; declared peer is `maplibre-gl ~5.24.0 \|\| ~6.3.0`. | Declared peers exclude `6.16.0`. Do not force an override and call it compatible. |
| Esri installation docs | Currently identify plugin `1.3.1` and show a CDN example with GL JS `6.14.0`. | Official examples and current peer metadata disagree. Resolve with an upstream compatible release or an explicitly tested supported renderer pair before adopting. |
| `@maptiler/sdk` | Registry latest `4.2.0` contains `maplibre-gl 5.24`. | Unnecessary when using plain MapLibre. Adding it would introduce another renderer version and different billing behavior. |

Version evidence: [Esri package metadata](https://registry.npmjs.org/@esri%2fmaplibre-arcgis/1.3.2), [Esri install documentation](https://developers.arcgis.com/maplibre-gl-js/api-reference/), [MapLibre GL metadata](https://registry.npmjs.org/maplibre-gl/6.16.0), [native metadata](https://registry.npmjs.org/@maplibre%2fmaplibre-react-native/11.5.1), and [MapTiler SDK metadata](https://registry.npmjs.org/@maptiler%2fsdk/4.2.0). Metadata and documents were read directly; no provider-authenticated render was executed.

## Product comparison

| Dimension | MapLibre with MapTiler | MapLibre with ArcGIS Location Platform | ArcGIS Maps SDKs | Self-hosted open basemaps |
|---|---|---|---|---|
| Current product fit | Direct style integration and documented Expo/MapLibre example. | Good web option, with additional native/auth/attribution work. | Valuable for advanced GIS, offline GIS packages, or Esri-centered workflows, which R1 does not need. | Meets independent hosting, but adds data updates and delivery operations. |
| Outdoor visual experience | Outdoor/Topo plus satellite styles; quiet style can keep source overlays dominant. | `arcgis/outdoor`, `topographic`, `terrain`, hillshade, and `imagery` options. | Rich map/scene tools, but do not add product value merely by replacing the renderer. | Styling control depends on the data package; satellite/terrain require separate licensed sources. |
| Native parity | Same provider style family through MapLibre Native. Tutorial uses older component names; follow the current native API. | REST style compatibility is promising but not a complete Expo recipe. Web helper is not native. | Requires platform SDK integration or a maintained custom native bridge for Expo. | Browser PMTiles protocol does not automatically work in native; serve standard tile endpoints if chosen. |
| Our routes and rights | Journey GeoJSON stays in our API/DB. | Same. No hosted feature service is required. | Could tempt duplication into Esri services; avoid a second authority. | Same application authority. |
| Useful defaults | One Outdoor style, optional satellite switch, own stage/route overlays. | Similar experience is possible; imagery/reference styles may justify selection after actual coverage review. | Too much additional API/licensing/platform scope for current requirements. | More preparation before a comparable visual result. |
| Billing | Plain third-party MapLibre generally consumes tile requests. | Can use tile usage or explicit basemap sessions on Location Platform. | Account/SDK/service model must be selected together. | Storage, bandwidth, update tooling, and operations instead of provider requests. |
| Static sharing | Reviewed standard cloud terms restrict exported screenshots/static reuse; verify the exact image/export product and agreement. | A dedicated Static Maps service exists; agreement permits certain unalterable static output subject to attribution and third-party terms. | Does not erase content-license restrictions. | Data, font, sprite, and style licenses still apply. |
| R1 choice | Recommended. | Credible alternative, not installed. | Do not add. | Do not install an unused tile pipeline. |

Sources for visual options: [ArcGIS style catalog](https://developers.arcgis.com/documentation/mapping-and-location-services/mapping/basemaps/arcgis-styles/), [MapTiler pricing/catalog](https://www.maptiler.com/cloud/pricing/), and [MapTiler React Native example](https://docs.maptiler.com/react-native/). These establish available styles and integration paths, not a measured winner for India.

## Licensing, output, and attribution

MapTiler's reviewed cloud terms require direct end-user requests unless a proxy agreement says otherwise. They restrict exporting map content and server-side screenshot/cache reuse, while allowing a temporary single-user personal cache. Do not equate an interactive basemap subscription with rights to generate and retain downloadable social cards. Keep initial share cards photo/text-based. [MapTiler Cloud terms](https://www.maptiler.com/terms/cloud/).

Esri's current linked Location Platform agreement distinguishes permitted HTTP-cache behavior and unalterable static output from prohibited scraping/extraction or unrestricted redistribution. Attribution and third-party data conditions still apply. Its Static Maps API is designed for images used in websites, emails, and other static outputs; account privileges, billing, image attribution, and intended retained/downloaded-card usage must be checked against the selected agreement. This is evidence of a potentially useful export path, not blanket legal clearance. [Current agreement](https://www.esri.com/en-us/legal/requirements/arcgis-location-platform-agreement), [Static Maps guide](https://developers.arcgis.com/documentation/mapping-and-location-services/mapping/static-maps/), [static attribution API](https://developers.arcgis.com/rest/static-maps/basemap-style-attribution-get/).

Do not use an anonymous `World_Imagery/MapServer` URL as a free, license-free production service. Use the documented authenticated service/style endpoint. Preserve visible Esri and applicable data credits. The Esri web helper handles this, but native needs equivalent verified handling, especially for imagery where data providers can vary. [Esri attribution control](https://developers.arcgis.com/maplibre-gl-js/api-reference/AttributionControl/).

## Usage units and privacy

MapTiler's session accounting is tied to MapTiler SDK JS or its Leaflet integration. Plain MapLibre web/native usage is counted through API requests rather than assuming the advertised SDK session allowance. Do not install its SDK just for a headline price comparison without measuring the resulting renderer/version and experience trade-off. [Sessions versus requests](https://docs.maptiler.com/guides/account/sessions-vs-requests/).

ArcGIS Location Platform supports per-tile use and explicit basemap sessions. The documented session can last up to 12 hours for one application user. This is not the same unit as an arbitrary web page view, and the documented session tutorial requires a Location Platform account, not ArcGIS Online/Enterprise. [ArcGIS basemap usage](https://developers.arcgis.com/documentation/mapping-and-location-services/mapping/basemaps/basemap-usage-styles/), [session tutorial](https://developers.arcgis.com/maplibre-gl-js/maps/vector-tile-basemaps/display-a-map-with-a-basemap-session/).

Neither option requires uploading private GPX/FIT files or storing journey features with the map vendor. Both expose requested viewport areas and network metadata to the provider through direct tile traffic. Apply public geometry redaction before client delivery, disclose private-view provider requests, and keep private titles, source URLs, and unlisted credentials out of request referrers and logs.

## Experience and release checks

Use one calm 2D Outdoor basemap for Explore. Keep recorded paths solid, estimates dashed, unknown connections broken, and participant branches explicit. Optional satellite mode should serve source interpretation, not introduce a 3D/cinematic subsystem. Attribution remains readable on the mobile sheet layout. Text and source access must work before the map loads and while it is unavailable.

Within the complete production implementation, compare representative Himalayan, Western Ghats, and mixed city/transport journeys at both overview and local zooms. Check actual path labels, contour legibility, satellite date/resolution, place-name language, border/worldview presentation, night/low contrast, and sparse remote coverage. Verify identical stage/route semantics on a midrange Android device and mobile web. Global coverage claims are not evidence that either provider contains every campsite or footpath.

Inspect cold load, text-first rendering, tile fan-out, peak memory, gesture smoothness, attribution, token expiry, style switching, and map-failure fallback. Test source withdrawal separately: an external basemap is not a reason to retain revoked journey overlays in a client payload.

## Dependency decision

Required now: only the web and native MapLibre renderers already needed by the product. MapTiler can be accessed using its style URLs; no `@maptiler/sdk`, `react-map-gl`, ArcGIS feature-service package, native ArcGIS SDK, or PMTiles server is required for the chosen baseline. If ArcGIS replaces MapTiler, select its smallest verified web/native integration then, after resolving the peer mismatch. Do not add those alternatives to the canonical installed-dependency list now.

Five focused search rounds plus direct first-party page/package retrieval produced this research. No keys, accounts, paid calls, native renders, source uploads, or provider production measurements were used.
