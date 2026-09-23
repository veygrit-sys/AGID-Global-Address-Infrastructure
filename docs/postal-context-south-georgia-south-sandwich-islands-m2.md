# South Georgia and the South Sandwich Islands Postal Context M2

## Outcome

South Georgia and the South Sandwich Islands (`GS`) reach country-specific M2 with one official postal node, `SIQQ 1ZZ`, and two real derived `MultiPolygon` display features. Current UPU evidence and the country-specific addressing sheet establish that `SIQQ 1ZZ` is the single postcode for the whole territory. No reusable official postal polygon was located, so the map does not claim one: fixed BAS edition 1.0 coastline features explicitly sourced from South Georgia GIS supply a derived whole-territory display surface.

Postal assignment, geometry and address/building authority stay separate:

- official postcode assignment: UPU dictionary assertion, geometry authority `none`;
- displayed surfaces: South Georgia GIS/BAS-derived geometry, assignment authority `derived_spatial_assignment`, geometry authority `official_mapping_geometry`;
- addresses, buildings, parcels, recipients, customers and land rights: absent;
- source identity: `GS` remains distinct and is not merged or relabelled.

## Current primary evidence and rights

Observed at `2026-09-01T04:46:46.948Z`.

1. [UPU General Addressing Issues](https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf), Universal POST*CODE DataBase, August 2026, lists `GS` with `SIQQ 1ZZ`. SHA-256 `ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d`.
2. [UPU South Georgia and South Sandwich Islands addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/sgsEn.pdf), 08/2005, states “Single postcode for the whole territory” and gives `SIQQ 1ZZ`. SHA-256 `b301ba2e6f28548adcb193cda244c07e0003ec7be209913c9acea6a02ebcd928`.
3. [UPU copyright policy](https://www.upu.int/en/legal/copyright) reserves reproduction and redistribution rights. The PDFs are not committed; AGID stores URLs, editions, factual conclusions and digests.
4. [BAS Vector polygons of the Sub-Antarctic coastline](https://data.bas.ac.uk/items/c1d83502-8799-4e3c-bdca-21db6a4405d4/), edition 1.0, DOI `10.5285/c1d83502-8799-4e3c-bdca-21db6a4405d4`, is complete and recommended for general use. Its lineage explicitly says South Georgia and the South Sandwich Islands come from South Georgia GIS. Fixed Shapefile archive SHA-256 `27b4cd2085b9c845abf7928c336cf82f0d37492bbe2c21522ac4c670750f6cff`.
5. [South Georgia GIS data notice](https://sggis.gov.gs/data/README.html) places the relevant base data under CC BY 4.0 and specifies the attribution “South Georgia GIS, accessed [year]”. SHA-256 `6380e2f985bf88f85e3062943e7416b68cf58d1a972f71c5910fb72550636dfb`.
6. [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/legalcode.en) permits redistribution and adaptation with attribution. AGID retains source identity, edition, dates, exact digests and derived classification.

Raw reviewed downloads remain outside Git.

## Reproducible transformation

`scripts/build-postal-context-gs-m2.mjs` requires ten exact receipt bodies totalling 6,655,035 bytes. It verifies the UPU, BAS and South Georgia GIS metadata and exact hashes, then accepts only the no-rounding WGS84 conversion SHA-256 `5da93ae838fbdb0ad216a946e492391c5cdf8176c9b00eea49e0a0f4cd5aa1f8`.

The source Shapefile has 466 features in EPSG:3031. The exact `source='South Georgia GIS'` filter keeps 357 Polygon features; `ogr2ogr` reprojects them to EPSG:4326 without coordinate rounding or simplification. The natural empty longitude gap at `-30` partitions 340 South Georgia parts and 17 South Sandwich Islands parts into two MultiPolygons. Every one of the 357 rings and all 90,610 positions occurs exactly once. All source polygons and both outputs pass Turf, JSTS and the shared AGID topology validator. Union bounds are `[-42.010362430401265, -59.462019286868944, -26.263554479353903, -53.5409753944407]`; combined geodesic area is `3,776.140051597529 km²`.

No buffer, hull, cell, simplification, coordinate rounding or invented area is used. A second isolated build must reproduce byte-identical graph, geometry and descriptor digests.

## Application path

The committed descriptor loads through the shared `PostalContextPackRuntime`. A request for country `GS` and input `ＳＩＱＱ １ＺＺ` or `siqq1zz` normalizes to `SIQQ 1ZZ`, then the real Express Postal Context route returns both derived MultiPolygons with source, source date `2020-11-03`, CC BY 4.0 identifier, confidence `0.90` and authority fields. `FIQQ 1ZZ` and unknown `SIQQ 1ZY` both return HTTP 400 with no fabricated surface.

The unchanged app conversion accepts only valid Polygon/MultiPolygon geometry, forms a two-feature collection, calculates union bounds and drives the normal map `fitBounds` path. Deterministic map verification confirms fill opacity `0.22`, outline opacity `0.95`, outline width `3`, full removal on clear and successful re-search. The shared app path exposes loading, no-match, ambiguous/multiple, API failure and invalid-geometry states and displays the selected postal code, geometry type, official/derived/virtual provenance, source, reference date and confidence.

The application was started locally with the committed GS descriptor and experimental-country gate on port 3017. The in-app Browser integration was attempted first but its Node setup failed before navigation because the Windows sandbox could not apply deny-read ACLs; this is recorded as unavailable, not as a visual pass. The fallback used bundled Chromium 151.0.7922.34 against the same running application. Only the place-search response and a fixed OpenFreeMap/Natural Earth background style were controlled; the two observed `/api/v1/postal/GS/SIQQ%201ZZ?geometry=geojson` requests both used the real local AGID route and returned HTTP 200.

Visual inspection passed. The automatic fit view shows both South Georgia and the South Sandwich Islands with the translucent blue fill, clear blue coastline outline and visible background relief. The close-up confirms the outline follows the real source coastline. Clearing removes the notice and 5,110 blue canvas pixels relative to the fit view; re-search restores the notice and 5,116 pixels. The fixed evidence is:

- `reports/postal-context-m2/gs-browser-visual-2026-09-01-fit.png`, SHA-256 `8945c0080bb867f5b47fcba176605c044c823ef637a558ac1037db68096576f7`;
- `reports/postal-context-m2/gs-browser-visual-2026-09-01-closeup.png`, SHA-256 `358f34da9552a34aa13364cae0a8baf1396412db2ba54f9e3a5388cddbb4efcf`;
- `reports/postal-context-m2/gs-browser-visual-2026-09-01.json`, the machine-readable API, fit, clear, re-search, pixel-delta and visual-inspection record.

The run also observed expected best-effort enrichment failures from nearest-postcode, Overture building-name, Overpass and Zippopotam routes. Their exact URLs and statuses are retained in the browser report; none supplied or replaced the GS postal geometry.

The browser run exposed a shared style-load race: the Postal Context notice could appear while the map style was no longer reported as fully loaded after its one-time `style.load` event, leaving the layer unsynchronized. The app now attempts the source/layer update immediately and, only when MapLibre rejects it as not ready, retries on `styledata` or `idle`. A regression test covers that delayed-style path.

## Validation

Machine-readable build evidence is in `reports/postal-context-m2/gs-current-whole-territory-2026-09-01.json`. Machine-readable final validation evidence is in `reports/postal-context-m2/gs-validation-2026-09-01.json`. The rollout ledger pins their published commit URLs and SHA-256 digests.

## Remaining limits

M2 does not establish an official postcode boundary, legal/survey/cadastral boundary, delivery zone, street/address assignment, building identity, parcel identity, recipient identity or deliverability. A future fixed, reusable official postal or whole-territory boundary supersedes this derived display surface only through a new source-reviewed release; it must not rewrite this release in place.
