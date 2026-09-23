# Paraguay Postal Context M2

Status: `m2_verified`

Criterion: `M2_current_national_dinacopa_postal_zone_derived_area_visualization`

## Result

Paraguay has a searchable national display pack for all 2,887 distinct six-digit postal codes in the fixed 8,646-feature DINACOPA `ZONA POSTAL PARAGUAY` release. The app/API result retains the official postal code plus department, district and postal-locality context IDs, including every source `cod_bar`, `BARLOC`, name and exception note. Repeated `cod_bar` values are not treated as globally unique.

AGID publishes deterministic simplified MultiPolygons as `derived` display context. It does not present them as unsimplified official boundaries and does not infer an address, building, point, route, P.O. box, organization, customer, parcel or land-right surface.

## Fixed primary evidence

- DINACOPA catalog: `https://www.datos.gov.py/dataset/nuevo-codigo-postal-del-paraguay`; dataset ID `2ba6d169-85d9-433e-ad44-aefa320ceff7`; metadata SHA-256 `29a677eff064f7426ea48350d0e43df653f63d39002f5bc4a410d07d294f358f`; modified `2023-11-08`.
- Shapefile components: SHP `abc2c58b04ab7de61436f01938e7c8a2e8d561738ff8392629a40815d55699e7`; DBF `f513bddb1ccd368843c1da5968f254ebe85c546eba53fef581d6d556df9d8589`; SHX `4ef8bea2dd8e9a3b07be77beb9eee017cb7262ab9364eef3c4eb47c6c9041324`; PRJ `d26a953b5eb0782c31f0c8148f48177508cd0bf977e8667eaf7bf36b0ce97a5e`.
- CSV SHA-256 `fe1d54c15d2d1e4c5ea4a170960397989105f45306e9a0a3e4b25afdd57945dd`; data dictionary SHA-256 `ac8d2303aec3309d02bac672d8dc789ea868b7d58159c11f0951362f6dea588d`.
- Current Correo Paraguayo explanation: `https://correoparaguayo.gov.py/sitio/la-importancia-del-codigo-postal-para-ubicar-las-direcciones-7/`; SHA-256 `4e7f6fc0549080ca97955a51d96c94398c1f71c7b8ec79d17313f891060d1c01`. It documents two department digits, two district digits and two barrio digits, including `001518`.
- Public-information licence: `https://www.paraguay.gov.py/datos-abiertos/licencias`; shell SHA-256 `b6a6ca4ed6be1d9103434cec14f193580747cbf6fec8a2c82e73b0c2e3d442d7`; application bundle SHA-256 `2d5d19e86534e3f815ddc1b569143c86ed3fa553baec9ed162ed5b8f48477ade`.

The licence under Decree 4064 and Law 5282/2014 permits free, perpetual, non-exclusive copying, extraction, reproduction, distribution, public communication, adaptation and transformation. Reuse must cite the public source and licence, cite the last update when known and must not imply official or state-sponsored use. Raw upstream files are not committed to AGID.

## Reproducible transform and quality

GDAL 3.12.1 repairs five invalid EPSG:32721 source polygons, unions the official areas by `COD_POST`, simplifies each postal-code union by 20 metres, repairs again, transforms to EPSG:4326, snaps to a `0.0000001` degree grid and applies a final zero-width repair. The nine-decimal RFC 7946 display input SHA-256 is `6ce1239d15c20e80393c0c1457090095ff82df151f44f596aa36796d47340640`. Sixty-three closed hole rings below `1e-12` square degrees that collapsed under display precision and one consecutive duplicate position are removed deterministically before publication; no postal code or meaningful area feature is dropped.

Output:

- 2,887 valid non-empty MultiPolygons
- 339,723 coordinate positions and 8,058 rings
- bounds `[-62.6446174, -27.5918336, -54.2589239, -19.2896]`
- provenance `derived`, confidence `0.98`, accuracy estimate `25 m`
- zero invented areas

## API, IDs and app path

Input equivalent to full-width/spaced `００１ ５１８` normalizes to `001518`. The real API returns postal context ID `postal-py-001518`, geometry feature ID `dinacopa-py-derived-001518`, official source-row locality context `locality-py-001518-0000052-052-row-00001`, district `admin-py-district-0015`, department `admin-py-department-00`, and country `country-py`. The locality label includes `SANTA ROSA — postal 001518; cod_bar 0000052; BARLOC 052`. All 8,646 official rows have their own context ID; a postal code containing several official locality rows returns them as explicit alternatives rather than collapsing their identities.

The app converts that response to GeoJSON, fits bounds `[[-57.5898855, -25.2569718], [-57.5782528, -25.2472184]]`, uses translucent fill opacity `0.22` with outline opacity `0.95` and width `3`, clears, and re-searches. The final configured-store regression also caught and corrected a missing `PY` production-country registration; the real configured repository now returns the same IDs and MultiPolygon through the production route.

## Browser evidence and limitation

Playwright Chromium loaded the production Postal Context route against the real configured PY pack, MapLibre renderer and live OpenStreetMap raster background. Search `００１ ５１８` normalized to `001518`, displayed `表示中: PY 001518 · 1 area`, fitted to center `[-57.584069150000005, -25.252095197890966]` at zoom `15.698883`, received 25 successful raster-tile responses with no network failures, then cleared the source/layers and reproduced the same paint and geometry on re-search. The visually inspected screenshot is `reports/postal-context-m2/py-visual-001518-2026-09-02.png`, SHA-256 `ff8b289b624d4749efbf6c8cd4a332685f5f51a94e30adf6e953284e8ea01a94`.

The in-app browser could not start because the Windows sandbox failed while applying its deny-read ACL, and the full isolated Vite app could not resolve the preserved dependency worktree without modifying another worktree. Those paths are not claimed as completed E2E. The recorded result is the permitted deterministic browser fallback, and it uses the actual configured API store and production map contract rather than a synthetic postal fixture. Full details and validation counts are in `reports/postal-context-m2/py-checks-2026-09-02.json`.
