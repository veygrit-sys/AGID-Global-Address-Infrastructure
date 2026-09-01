# Mexico Postal Context M2

Status: `m2_verified`

Criterion: `M2_latest_official_sepomex_2025_national_postcode_polygons_derived_display`

## Result

Mexico now has a complete searchable M2 display pack for the 35,898 distinct five-digit postal areas in Servicio Postal Mexicano's latest published national spatial release. Every entry comes from one real Polygon feature in one of the 32 state Shapefiles. AGID publishes a deterministic simplified Polygon or MultiPolygon as `derived` display context; it does not claim that the display geometry is an unsimplified or continuously current delivery boundary.

The pack contains no addresses, address points, buildings, customers, people, parcels, cadastral facts or land-right records. No point, route, P.O. box, organization, administrative boundary, buffer, hull, Voronoi cell, model output or AGID cell is expanded into postal-area geometry.

Required attribution: `Fuente: Servicio Postal Mexicano (SEPOMEX), Códigos postales por entidad federativa, 2025; CC BY 4.0.`

## Fixed primary evidence

- Official datos.gob.mx dataset: `https://www.datos.gob.mx/es/dataset/codigos_postales_entidad_federativa`.
- Official CKAN package body: `https://www.datos.gob.mx/api/3/action/package_show?id=codigos_postales_entidad_federativa`; 34,251 bytes; SHA-256 `c523637ff6ebf6a417bd277d637b7a628d759e68c65bcc2c1e8c17cc5d230da1`; package modified `2026-01-29T22:30:08.783191`; dataset ID `d0074e50-d661-44d4-a1a3-73a89e671e1f`.
- 32 official state Shapefile ZIP resources, individually URL-, byte-, version- and SHA-256-bound in `source-profile.json`; 129,070,835 source bytes; each DBF reports `2026-01-05`; 35,898 source features and 35,898 distinct five-digit codes.
- SEPOMEX's official catalogue page was checked at `https://www.correosdemexico.gob.mx/sslservicios/consultacp/CodigoPostal_Exportar.aspx`; it reported a `2026-08-30` update. Its catalogue restrictions are not used to broaden or redistribute the spatial polygons; the bundled spatial release is the datos.gob.mx CC BY 4.0 release titled 2025.
- Exact receipt set: the CKAN package body plus 32 ZIP bodies, 33 bodies and 129,105,086 bytes total. All are SHA-256-bound and none is committed to AGID.

The latest published official spatial release is titled 2025. This M2 pack therefore states geometry date `2025-01-01`, confidence `0.92`, effective display accuracy `250 m`, and `derived` provenance. It does not assert that the polygons alone are a 2026-09-01 delivery-assignment register.

## Reproducible transform

`npm run build:postal-context-mexico-m2` re-downloads and verifies the CKAN package and all 32 state resources, transforms the official surfaces to EPSG:4326, applies GDAL `makevalid`, six-decimal precision and a 100 m topology-preserving base simplification, then builds the AGID graph and geometry artifacts. An additional topology-preserving 0.0012-degree display simplification is accepted only when a feature's relative area delta is at most 1%.

Collapsed simplified features are restored only from polygonal components of their official original surfaces. Selected invalid source surfaces use deterministic GEOS make-valid/zero-buffer fallbacks, and four strict-runtime cases receive bounded sub-metre ring cleanup. Non-surface members are discarded; no surface is invented.

Two clean end-to-end builds produced the same final descriptor digest:

- descriptor: 1,140 bytes; SHA-256 `2f5dc6bd36f5700ff8b97accd936c4f7b9defbdd0247288f174dc417a4d1ca37`
- graph: 33,219,644 bytes; SHA-256 `b737b2c34ecfe0c6b428987ddb486fc561d5427b88f8a77ab419b0199f3ae7e9`; 35,899 nodes and 35,898 assertions
- geometry: 51,868,958 bytes; SHA-256 `26e8a0a34454c3f2f91161065ebd0e59ad42d4066617860123396e928ebc27c6`; 35,898 features and 1,065,949 positions
- 228 collapsed-source fallbacks, 35 invalid-original fallbacks, 10 selected GEOS fallbacks, 8 strict-parser GEOS fallbacks and 4 bounded strict-runtime repairs
- maximum strict-runtime relative area delta `0.00025700261674698084`; maximum final JSTS repair relative area delta `0.000004073789482394257`

## API and app path

The application was started against the fixed descriptor and exercised in a real Playwright Chromium browser on `http://0.0.0.0:3002`. The requested in-app browser bridge could not be initialized because its Windows ACL bootstrap failed twice, so the check is honestly recorded as an actual local Chromium visual check, not as an in-app-browser check.

Country `MX` plus `06000` made `GET /api/v1/postal/MX/06000?geometry=geojson`, returned HTTP 200 with a real derived Polygon, fitted the map, and displayed a translucent blue fill with a clear blue outline while the background basemap remained visible. The UI showed `MX 06000`, `Polygon`, `derived`, source `mx-sepomex-derived-display-2025`, geometry date `2025-01-01`, and confidence `0.92`. Clear removed the area; a second search for `01000` returned HTTP 200, refitted, and rendered the new real Polygon with the same metadata contract.

Deterministic UI tests cover loading, no match, multiple candidates, API failure, invalid geometry, fit, clear and re-search. The map style contract fixes fill opacity `0.22`, outline opacity `0.95`, and outline width `3`.

## Validation

- MX repository/API targeted suite: 6 passed, 0 failed.
- Shared Postal Context runtime suite: 162 passed, 0 failed.
- Shared postal-area UI suite: 9 passed, 0 failed.
- TypeScript `--noEmit`: passed.
- Strict runtime topology parser over all 35,898 features: passed.
- Clean end-to-end rebuild: descriptor digest matched `sha256:2f5dc6bd36f5700ff8b97accd936c4f7b9defbdd0247288f174dc417a4d1ca37`.
- JSON parse and `git diff --check`: passed.

## Limits

Postal Code to Polygon to Address Context authority remains separated. This pack can display postal context only. It cannot assert a delivery point, street address, building, occupancy, ownership, cadastral extent or land right. A future upstream release must be re-fetched, re-hashed, revalidated and republished as a new immutable release.
