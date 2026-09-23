# Faroe Islands Postal Context M2

## Outcome

FO satisfies `M2_current_umhvorvisstovan_postoki_visualization` for the
Umhvørvisstovan `Postnr` layer snapshot captured at
`2026-08-30T05:59:44.058Z`. The release contains 117 distinct three-digit
postal areas backed by real Polygon or MultiPolygon geometry. It does not
claim postal-operator deliverability, an address register, buildings,
recipients, customers, or land rights.

## Source, version, and rights

- Provider: Umhvørvisstovan / Faroese Environment Agency.
- Catalogue: <https://www.foroyakort.fo/vevtaenastur>.
- Service: <https://gis.us.fo/arcgis/rest/services/fyrisitingarlig_kort/us_postnr/MapServer>.
- Layer: `0`, `Postnr`, “Postøki í Føroyum”; source CRS EPSG:5316, queried as EPSG:4326.
- Version identity: ArcGIS 11.4, document 2.9.0, item GUID
  `7826BA83-8C7C-48D4-A8A7-67CD9F1D5328`, 117 distinct object IDs.
- Raw query SHA-256:
  `952d2b52d358cd2671673ea1bc5ee3e9161eacd6b15981a9c97f9fc08709ced2`.
- Terms: <https://www.foroyakort.fo/um-foeroyakort/terms-and-conditions-in-english>,
  June 2019. They permit commercial and non-commercial copying,
  distribution, publication, modification, and combination with attribution.
  Captured terms SHA-256:
  `9b78c1c03c495bff72bfdc1cb5d30946ced18d92b8945fa95ab064749fc0e083`.
- Attribution: “Data from the Faroese Environment Agency,
  Umhvørvisstovan: Postnummur; downloaded through web service 2026-08-30.”

The raw ArcGIS response and page captures are audit-only inputs and are not
committed. `scripts/build-postal-context-fo-m2.mjs` deterministically converts
the pinned raw query to the committed graph, geometry, and descriptor.

## Geometry and exceptions

The source has 115 Polygon and two MultiPolygon features. Postal code `476`
contains eight self-intersections. Only that feature is repaired with Turf
`buffer(0.000001 metres, steps=8)`; its output is a valid Polygon, has relative
area delta `1.5494530300567815e-9`, and is labelled `derived` with confidence
`0.999999`. All other features retain official provenance. No point, route,
PO box, organization, municipality, address, building, Voronoi, or AGID proxy
surface is substituted.

The published set contains 116 Polygon and one MultiPolygon feature, 52,065
positions, and 118 closed rings. All 117 geometries pass boolean validity and
Faroe bounds checks.

## Application path

The configured runtime accepts `100` and `FO-100`, normalizes them to `100`,
and rejects ambiguous `FO100`. A real HTTP route test loads the committed pack,
searches `FO-100`, receives the corresponding area geometry and provenance,
converts the response to the application GeoJSON source, calculates fit bounds,
and verifies a background-visible fill opacity of `0.22` plus a clear outline
of opacity `0.95` and width `3`. The same deterministic harness verifies clear,
re-search, no-match (`999`), invalid-input, geometry rejection, metadata, and
the derived provenance for `476`. Shared UI state covers loading, no match,
multiple candidates, API failure, invalid geometry, clear, and re-search.

The UI exposes normalized postal code, geometry type, official/derived/virtual
classification, source, reference date, and confidence. This run used the real
API/application path plus deterministic map-source/style/fit verification; no
browser screenshot is used as a substitute for the assertions.

## Reproducibility and validation

- Graph: `sha256:ec6fcf83737924e62f2b390b24090c668cb28ceeb2464d281df8e3233d30b458`
  (114,065 bytes).
- Geometry: `sha256:5550de7a2236aa6137a112b9b80e9286bd156b1bc6c2d0c8c3a55bc56b6d2f74`
  (2,138,282 bytes).
- Descriptor: `sha256:3b9969799a19fd495065b27919095279697708d4da1ce7f2d50f63d07091112a`
  (1,147 bytes).
- A second clean transform reproduced all three digests exactly.
- FO policy/repository/API/app tests: 9 passed, 0 failed.
- Shared postal-area UI tests: 5 passed, 0 failed.
- Shared Postal Context runtime suite: 159 passed, 0 failed.
- Focused typecheck for every changed FO/shared source and its import closure:
  passed.
- Repository-wide `tsc --noEmit` remains blocked only by six pre-existing
  unresolved local workspace package aliases in `workspaceSplitContract.test.ts`;
  it produced no FO diagnostic.

Machine-readable evidence is in
`reports/postal-context-m2/fo-source-review-2026-08-30.json`,
`reports/postal-context-m2/fo-build-2026-08-30.json`, and
`reports/postal-context-m2/fo-checks-2026-08-30.json`.
