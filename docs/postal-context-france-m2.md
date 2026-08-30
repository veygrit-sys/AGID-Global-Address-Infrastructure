# France Postal Context M2

## Outcome

FR satisfies its repository-specific `M2_experimental` definition for a
strictly scoped `75001`-`75020` Paris municipal-arrondissement release captured
at `2026-08-30T06:52:44.942Z`. The immutable pack contains 20 real-data
MultiPolygon display surfaces and the application can search, normalize,
retrieve, fit, render, clear, and re-search them.

This is not national France coverage and none of the surfaces is an official
La Poste postal boundary. Each surface is `derived`: it combines an official
La Poste postcode-to-INSEE assignment with the matching official
administrative arrondissement contour. No point, buffer, Voronoi cell,
building, AGID cell, or synthetic fixture creates an area.

## Sources, version, and rights

### La Poste assignment

- Catalogue: <https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux>.
- API metadata: <https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal>.
- Raw resource:
  <https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/raw>.
- Resource ID: `008a2dda-2c60-4b63-b910-998f6f818089`.
- Metadata update: `2026-08-08T07:04:29.824Z`.
- Snapshot: 1,555,485 bytes, 39,192 rows, 6,328 distinct postal codes,
  35,007 distinct commune codes.
- SHA-256:
  `f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22`.

La Poste describes this base as a postal-code/INSEE-commune mapping and states
that open postal-code contours are not provided. Assignment authority is
therefore kept separate from geometry authority.

### Administrative geometry

- Documentation:
  <https://geo.api.gouv.fr/decoupage-administratif/communes>.
- Exact-query endpoint:
  <https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/lines>.
- Snapshot: 20 separate `code_postal:{code}` queries, each returning exactly
  one row and one `_contours_commune.geometry` MultiPolygon.
- Raw-response set SHA-256, concatenated in ascending file-name order:
  `76d9f52e38386339a15d3becc6f4ed6eb3605af3cb82669cea772feb8fd586ec`.

Every target row is a one-to-one match: `75001`-`75020` map to
`75101`-`75120`, with commune labels `PARIS 01`-`PARIS 20`. Individual API row
IDs, byte lengths, and hashes are recorded in
`reports/postal-context-m2/fr-build-2026-08-30.json`.

### Reuse terms

The inputs are published under Etalab Open Licence 2.0:
<https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf>.
It permits reproduction, redistribution, adaptation, publication, and
commercial or non-commercial use with source and latest-update attribution.
The captured licence PDF SHA-256 is
`1c721702ef459d935f2d097fec4a81d5f9dd258477c92b0857dd8f1d9cdc2909`.

Attribution: “La Poste — Base officielle des codes postaux, latest source
update 2026-08-08; Etalab / API Découpage administratif contours; Licence
Ouverte 2.0. Retrieved 2026-08-30.” No endorsement by a public authority is
implied.

## Reproducible transform and data quality

`scripts/build-postal-context-fr-m2.mjs` verifies the fixed CSV and response-set
hashes before processing. It decodes the Windows-1252 semicolon CSV, requires
the exact postcode/INSEE identities, decodes the geometry string, validates
rings, finite Paris-bounded coordinates, positive area, and boolean topology,
then sorts by postcode and writes the graph, geometry, and descriptor.

The published set has 20 MultiPolygons, 20 rings, and 1,157 positions. All
geometries are source-identical, closed, finite, inside the configured Paris
bounds, and boolean-valid. There are no duplicate input rows and every target
key has exactly one source row. A second clean build reproduced all artifact
hashes exactly.

The numeric confidence `0.99` describes the exact scoped equality join and the
validated display surface. It does not claim 99% postal-boundary accuracy and
does not elevate the surface beyond `derived`.

## Application path

The real HTTP route test loads the committed pack, searches `７５ ００１`, and
normalizes it to `75001`. The API returns its real MultiPolygon with
`sourceType=derived`, `assignmentAuthority=official_postal_operator`,
`geometryAuthority=official_mapping_geometry`, source date `2026-08-08`, and
confidence `0.99`.

The application converts that response to its GeoJSON source, calculates map
fit bounds, and verifies a background-visible fill opacity of `0.22`, outline
opacity `0.95`, and outline width `3`. The same harness removes the layer,
re-searches `75020`, rejects malformed geometry, returns `no_match` for the
unscoped valid code `69001`, and rejects `750-01` as invalid input.

Shared UI/state tests cover loading, no match, multiple candidates, API
failure, invalid geometry, clear, and re-search. The UI exposes normalized
postal code, geometry type, official/derived/virtual classification, source,
reference date, and confidence. This deterministic API-to-map harness is the
relevant visualization evidence; a statistical chart would not improve the
exact spatial/provenance audit, so no chart was added.

## Exceptions and limitations

- Every code outside `75001`-`75020` remains unserved by this release. A
  commune, centroid, nearby polygon, or AGID cell is not substituted.
- CEDEX, BP, CS, TSA, poste restante, route, organization, and large-user codes
  remain non-areal unless a future separately authorized source proves an area.
- Overseas ISO territories and Monaco remain separate country packs.
- No BAN address, BD TOPO building, street, parcel, recipient, customer,
  occupant, deliverability, land right, or legal boundary is included.
- National coverage and M3 holdout/correction/freshness gates remain future
  work; they are not prerequisites for the repository's pinned-snapshot M2
  experimental definition.

## Artifacts and verification

- Graph:
  `sha256:014dadb1970f3f8a56c705f5225a47a88dfdee9572c5639aaf17e206cf29dee1`
  (41,520 bytes).
- Geometry:
  `sha256:15d634af5219dabdc57d297f8d53944064dce00a7ce9ef91a6e648d37e724e07`
  (61,675 bytes).
- Descriptor:
  `sha256:671dbc84b9bdd9d9b48f0530615da314be2d3bfdabd27a64ae53974119371d43`
  (1,137 bytes).
- FR repository, real HTTP API, application map, and negative tests: 7 passed,
  0 failed.
- FR legacy runtime/route and shared graph, runtime, schema, topology, UI,
  service, and store regressions: 74 passed, 0 failed.
- Repository-wide TypeScript `tsc --noEmit`: passed.
- Deterministic rebuild: all three hashes matched.

Machine-readable evidence is in
`reports/postal-context-m2/fr-source-review-2026-08-30.json`,
`reports/postal-context-m2/fr-build-2026-08-30.json`, and
`reports/postal-context-m2/fr-checks-2026-08-30.json`.
