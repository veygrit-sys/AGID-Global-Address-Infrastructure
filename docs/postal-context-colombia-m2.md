# Colombia Postal Context M2

Status: `m2_verified`

Criterion: `M2_current_national_472_derived_area_visualization`

## Result

Colombia now has a complete searchable M2 display pack for the 3,681 current normal six-digit postal assignments published by Servicios Postales Nacionales 4-72. Each code joins one-to-one to a real 4-72 Polygon source feature. AGID publishes a deterministic simplified MultiPolygon as `derived` display context, not as an unsimplified current official boundary.

The pack contains no expanded postcodes, sites, property points, addresses, buildings, P.O. boxes, organizations, routes, customers, people, parcels, cadastral facts or land-right records. No Point, buffer, hull, Voronoi cell, administrative area, model output or AGID cell is expanded into postal area geometry.

Required attribution:

`Fuente: MINTIC-Servicios Postales Nacionales 4-72 (Unidad Codigo Postal Colombia)`

## Fixed primary evidence

- Official viewer: `https://visor.codigopostal.gov.co/472/visor/`; SHA-256 `d133a173d89451f2a7df64b76b28ba46efa337e2fbb99b5722399cd1b2f12fc5`.
- datos.gov.co metadata: `https://www.datos.gov.co/api/views/ixig-z8b5`; SHA-256 `4772bdfea1e93c037b31ae1928bf60fb86c9303b7d1d28cfee78d5d0796cc928`; current assignment update `2025-05-20T20:24:15Z`; CC BY-SA 4.0.
- Current national assignments: `https://www.datos.gov.co/resource/ixig-z8b5.csv?$limit=50000&$order=noid%20ASC`; SHA-256 `e2fc2c40402481282ab700366b7692031c57f118eb01e07212779333ba72bf6e`; 3,681 distinct valid six-digit codes, 1,395 urban and 2,286 rural.
- Official national Shapefile: `https://visor.codigopostal.gov.co/472/visor/Shapefile_Codigo_Postal.zip`; SHA-256 `121d26a488ae9b2dd73e72e2d9495a9b892ca3068b95fe969fc64610d7615ff8`; HTTP Last-Modified `2016-06-28T19:42:41Z`; EPSG:4326; 3,681 valid Polygon features.
- Official open clause: `https://visor.codigopostal.gov.co/472/visor/Clausula_Licencia_Abierta.pdf`; SHA-256 `78a301079fdd0ef473b264123185ff3ddf70a84d3f26cfa5669d2aa3bcac9198`. It permits use, reuse, redistribution and transformation subject to attribution, update metadata, non-distortion and personal-data safeguards.
- MapServer schema: `https://visor.codigopostal.gov.co/arcgis/rest/services/Division_Codigo_postal/MapServer?f=pjson`; SHA-256 `8f88e58d9411a7be48ffe2972dbebaa4925901c6e804993064394ded92270e97`.
- Normal layer schema: `https://visor.codigopostal.gov.co/arcgis/rest/services/Division_Codigo_postal/MapServer/1?f=pjson`; SHA-256 `8780c7f6c5051b8c6e4fb6dad90186a3003a607fa9f3110ae1e2d9549ec8faa2`.
- Normal layer attributes: fixed 3,681-row response; SHA-256 `0b1090391d994306db3cc502771b7d050f121680b2dbfc144505c19c330ac76d`.

The eight exact upstream bodies total 70,743,890 bytes. None is committed to AGID.

## Reproducible transform

The fixed Shapefile is converted with GDAL 3.12.1 using EPSG:4326, RFC 7946 GeoJSON, topology-preserving simplification at 0.001 degrees, `makevalid`, and six-decimal coordinate precision. The builder retains only Polygon/MultiPolygon area components.

The input display GeoJSON SHA-256 is `d8c2cc3da30a5da4cfb1f8e6e91fe88d1cd7d1ea618ce90e45b5322ca711e7e9`. Two independent runs produced identical descriptor, graph and geometry digests. One collapsed non-area LineString component was discarded; zero areas were invented.

Output:

- 3,681 MultiPolygons
- 312,937 coordinate positions
- 4,586 rings
- bounds `[-81.735813, -4.227887, -66.847339, 13.393803]`
- provenance `derived`
- confidence `0.97`
- accuracy estimate `120 m`

Immutable artifact commit: [5afa0ae7a01b23615a56a0d578881ce0ff54539a](https://github.com/veygrit-sys/Address-Grid-ID/commit/5afa0ae7a01b23615a56a0d578881ce0ff54539a).

## API and app path

A real request for country `CO` and full-width/spaced input equivalent to `110 911` normalizes to `110911`, returns one real derived MultiPolygon, and exposes geometry type, provenance, source, assignment date, geometry source date, confidence and accuracy. The app converts the response to GeoJSON, fits bounds `[[-74.177047, 4.666119], [-74.118246, 4.717995]]`, renders fill opacity `0.22`, outline opacity `0.95`, outline width `3`, clears, and re-searches.

Shared UI logic separately covers loading, no match, multiple candidates, API failure and invalid geometry. Input `110-911` is rejected with HTTP 400 and no fabricated area. A deterministic real route-to-map integration test was used; browser E2E was not run.

## Validation

- CO country, topology, repository, API and app suite: 143 passed, 0 failed.
- Shared store, graph, runtime, topology and postal-area UI suite: 45 passed, 0 failed.
- Rollout policy suite: 8 passed, 0 failed.
- TypeScript `--noEmit`: passed.
- Builder syntax, JSON parse and `git diff --check`: passed.
- Deterministic second build: all three artifact digests matched.
- The one-page licence PDF was parsed and rendered; required reuse and attribution markers were found. The local image-view helper failed with Windows error 206, which did not affect PDF parsing, rendering or digest verification.
