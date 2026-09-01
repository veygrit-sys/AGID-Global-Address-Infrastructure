# Martinique Postal Context M2

## Outcome

Martinique (`MQ`) satisfies its country-specific `M2_experimental` definition for the complete current MQ assignment denominator captured at `2026-09-01T13:07:27.205Z`. The pack represents all 30 current postal codes through 35 real Polygon/MultiPolygon postcode/commune surfaces. The application normalizes a country-scoped postal search, retrieves the committed geometry through the Postal Context API, fits the map and renders a translucent fill over a visible background map with a clear outline.

No surface is an official postal boundary. Each is `derived`: an official La Poste postcode-to-INSEE assignment is joined to the matching official COG 2026 commune contour. Multi-commune codes `97218`, `97222` and `97250` remain multiple candidates and are never unioned. `97200/97234` remain separate postal identities sharing the same Fort-de-France contour. Ligne 5 labels are retained without inventing sub-commune areas. No point, buffer, cell, address, building, parcel, recipient, customer, deliverability or land-right record creates an area.

## Sources, version and rights

- La Poste dataset: <https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal>.
- Raw resource: <https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/raw>.
- data.gouv.fr metadata: <https://www.data.gouv.fr/api/1/datasets/545b55e1c751df52de9b6045/>.
- Data update: `2026-08-08`; snapshot: 1,555,485 bytes, 39,192 rows; SHA-256 `f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22`.
- MQ denominator: 38 rows, 30 codes, 34 INSEE 972xx communes and 35 code/commune pairs.
- Department geometry: <https://geo.api.gouv.fr/departements/972/communes?fields=nom,code,codesPostaux,surface,contour&format=geojson&geometry=contour>; SHA-256 `b7a30e913a752fe828d3619095187aae1d42cbc7cf06d9aedfac77110e9e30dd`.
- Commune API documentation: <https://geo.api.gouv.fr/decoupage-administratif/communes>; SHA-256 `c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4`.
- INSEE context: <https://www.insee.fr/fr/metadonnees/geographie/departement/972-martinique>; SHA-256 `3cc336c9ac01e1496cbac460b7ebc37ede0fd7526fad73a510a3cc3490e7560b`.
- Etalab Open Licence 2.0: <https://www.etalab.gouv.fr/licence-ouverte-open-licence/>; captured SHA-256 `706f075457bc6106c64b4040bceb0c63926b67192145e669a278ec72723e2ca3`.

Open Licence 2.0 permits reuse with source and latest-update attribution. The 37 exact evidence bodies (3,608,319 bytes) remain outside Git; every URL, retrieval time, byte length and SHA-256 receipt is recorded in `reports/postal-context-m2/mq-current-postcodes-2026-09-01.json`.

## Reproducible transformation and validation

`scripts/build-postal-context-mq-m2.mjs` verifies all evidence hashes before parsing, decodes the La Poste CSV, requires the exact MQ denominator, joins only exact INSEE identities, compares every postcode-query feature with its department feature, preserves coordinates, validates range and closed rings, and requires Turf and JSTS validity before writing sorted artifacts.

The output has 35 pair surfaces: 21 Polygon and 14 MultiPolygon, 102 rings and 40,100 positions. The largest API response has 2,869 positions, below the 20,000-position response limit. Overall bounds are `[-61.229033, 14.388646, -60.809655, 14.878716]`. Confidence `0.90` expresses the exact official assignment plus official commune contour while discounting the lack of an official postal perimeter; it is not a boundary-accuracy percentage.

## Application path and visual check

The real route test searches full-width `９７２ １８`, normalizes it to `97218`, and returns `ambiguous` with three unmodified derived Polygon candidates. Exact fit bounds are `[[-61.204045, 14.808342], [-61.083423, 14.878716]]`. The map contract uses fill opacity `0.22`, outline opacity `0.95` and outline width `3`, removes the source/layers on clear, and supports re-search.

On 2026-09-01 the application was started with the committed MQ descriptor and exercised through Playwright after the Browser Plugin could not start because the Windows sandbox could not apply deny-read ACLs. The country filter was set to `mq` and search `97218` produced `GET /api/v1/postal/MQ/97218?geometry=geojson` with HTTP 200, `ambiguous`, three postal features, three geometries and three alternatives. The running UI displayed `MQ 97218 · Polygon · derived · 3 area · ... · as of 2026-08-08 · confidence 0.90`. A captured browser frame was manually inspected: the map fit all three areas, the blue fill was translucent over the OpenFreeMap/OpenMapTiles background, and the blue boundaries were clear. The geocoding candidate alone was deterministic; the postal API, committed geometry, style and map rendering were the actual application path.

Loading, no match, multiple candidates, API failure, invalid geometry, clear and re-search are covered by shared deterministic UI tests. Invalid geometry is filtered before map rendering. Structurally valid but unassigned `97299`, malformed `972-00`, and cross-country `97300/97100` cases do not return an MQ area.

## Artifacts

- Graph: `sha256:5d3de3c265f67e440f332891bd158810a51d8987388f8b64b4d9aa250e680220` (68,879 bytes).
- Geometry: `sha256:b0048123e1c1485ba2b1e82e8bdc454484e2ce41e92f9d5d2fa87f3eabebf4d0` (944,549 bytes).
- Descriptor: `sha256:22e0ebf3386c6bfda50d84a102202da4a7f6846a4a0ea3aaf9c1aee409723758` (1,120 bytes).

Machine-readable source evidence is in `reports/postal-context-m2/mq-current-postcodes-2026-09-01.json`; validation command results are in `reports/postal-context-m2/mq-validation-2026-09-01.json`.
