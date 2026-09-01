# French Guiana Postal Context M2

## Outcome

French Guiana (`GF`) satisfies its country-specific `M2_experimental` definition for the complete current `973NN` postcode denominator captured at `2026-09-01T02:54:50.355Z`. The immutable pack contains all 25 current La Poste codes and 25 real Polygon/MultiPolygon display surfaces. The application can search, normalize, retrieve, fit, render, clear and re-search them.

No surface is an official postal boundary. Each is `derived`: an official La Poste postcode-to-INSEE assignment is joined to the matching official COG 2026 commune contour. Three code pairs share a whole-commune surface and are not separated by an invented boundary. No point, buffer, cell, address, building, parcel, recipient, customer or land-right record creates an area.

## Sources, version and rights

### La Poste assignment

- Dataset: <https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal>.
- data.gouv.fr metadata: <https://www.data.gouv.fr/api/1/datasets/545b55e1c751df52de9b6045/>.
- Raw resource: <https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/raw>.
- Resource ID: `008a2dda-2c60-4b63-b910-998f6f818089`.
- Data update: `2026-08-08T02:02:09.846Z`; metadata update: `2026-08-31T23:11:18.251Z`.
- Snapshot: 1,555,485 bytes, 39,192 rows, semiannual frequency.
- SHA-256: `f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22`.

The complete source contains exactly 25 distinct `973` postal-code rows and 22 distinct commune codes. Each postcode appears once. La Poste describes the base as a postcode/INSEE-commune crosswalk and states that open postcode contours are not supplied, so assignment and geometry authorities remain separate.

### Administrative geometry

- Department query: <https://geo.api.gouv.fr/departements/973/communes?fields=nom,code,codesPostaux,surface,contour&format=geojson&geometry=contour>.
- Postcode query template: <https://geo.api.gouv.fr/communes?codePostal=97300&fields=nom,code,codesPostaux,surface,contour&format=geojson&geometry=contour>.
- API documentation: <https://geo.api.gouv.fr/decoupage-administratif/communes>.
- INSEE context: <https://www.insee.fr/fr/metadonnees/geographie/departement/973-guyane>.
- Department response SHA-256: `d4fba56670e484cdbed767862263b959546d6aa515ea9fc5690a3c500ad9b724`.

INSEE identifies Guyane as department `973` in COG 2026 and lists 22 communes. The fixed department response contains those same 22 identities. Each of 25 separately fixed postcode queries returned exactly one feature whose commune identity and coordinates equal its department feature. All individual byte lengths and hashes are recorded in `reports/postal-context-m2/gf-current-postcodes-2026-09-01.json`.

### Reuse terms

The sources use Etalab Open Licence 2.0: <https://www.etalab.gouv.fr/licence-ouverte-open-licence/>. It permits reuse subject to source and latest-update attribution and prohibits implying official endorsement. The captured terms body SHA-256 is `85c8dd8ecfeb60531069a9e8e6208946778360fcb925673b1de39a20bd3d309c`.

Attribution: “La Poste — Base officielle des codes postaux, data update 2026-08-08; INSEE COG 2026; Etalab / geo.api.gouv.fr commune contours; Licence Ouverte 2.0. Retrieved 2026-09-01.” Raw source bodies remain outside Git.

## Reproducible transform and data quality

`scripts/build-postal-context-gf-m2.mjs` verifies every one of the 32 fixed evidence bodies (6,473,543 bytes) before processing. It validates metadata, decodes the Windows-1252 CSV, rejects duplicate rows, requires the exact 25-code/22-commune denominator, validates COG identity, requires one exact postcode-query feature, compares its coordinates to the department feature, checks coordinate range and closed rings, and passes Turf and JSTS validity before writing sorted graph, geometry and descriptor artifacts.

The published set contains 17 Polygon and 8 MultiPolygon responses, 73 rings and 118,559 positions. The largest runtime response has 11,375 positions, below the 20,000-position response gate. A second clean build reproduced the three artifact hashes exactly. Coordinates are copied without geometric modification.

Confidence `0.90` reflects the exact official assignment and official commune contour while explicitly discounting the fact that a commune is not a postal perimeter. It is not a 90% boundary-accuracy claim.

## Shared-surface exceptions

- `97311` and `97352` both map to Roura (`97310`).
- `97318` and `97360` both map to Mana (`97306`).
- `97353` and `97390` both map to Régina (`97301`).

Each code remains a distinct searchable postal identity but returns the same full commune display geometry as its partner. The pack does not infer a sub-commune division. This limitation is present in the manifest, source profile, node label, report, API provenance and tests.

## Application path

The real HTTP route test loads the committed GF pack, searches `９７３ ００`, and normalizes it to `97300`. The API returns one real MultiPolygon with `sourceType=derived`, `assignmentAuthority=official_postal_operator`, `geometryAuthority=official_mapping_geometry`, source date `2026-08-08` and confidence `0.90`.

The application converts the response to its GeoJSON source, obtains fit bounds `[[-52.593833, 4.886669], [-52.163557, 5.297322]]`, and verifies background-visible fill opacity `0.22`, outline opacity `0.95` and outline width `3`. The same deterministic harness removes the source/layers, re-searches `97370`, confirms the disclosed equal Roura surfaces for `97311/97352`, returns `no_match` for structurally valid but unassigned `97399`, rejects `973-00` and cross-country `75001`, and refuses malformed geometry before map rendering.

Shared UI/state tests cover loading, no match, multiple candidates, API failure, invalid geometry, clear and re-search. The UI contract exposes normalized postcode, geometry type, official/derived/virtual classification, source, reference date and confidence. This deterministic real HTTP/API-to-map-source/style/fit harness is the relevant rendering evidence; a statistical chart would not improve the spatial/provenance audit.

## Authority separation and limitations

- The official La Poste crosswalk has assignment authority and no geometry authority.
- The COG/geo.api.gouv.fr contour has administrative geometry authority and no postal-assignment authority.
- The joined surface is `derived`; it is not an official postal, legal, survey, cadastral or delivery boundary.
- P.O. boxes, routes, organizations, delivery points and other non-area objects are not expanded into areas.
- No address, BAN point, building, parcel, recipient, customer, occupant, deliverability or land-right record is published.
- French Guiana remains ISO identity `GF`, department/territory code `973`; no identity is merged into France or another territory.

## Artifacts and verification

- Graph: `sha256:1aff3293404e6ab813c14b83593a4b4f461ee6a062060dd6aef44c2716098db8` (46,818 bytes).
- Geometry: `sha256:4947e12fc0a4f90b4d157c34b21e2da4ae8b22d999c64e4df963ef4943c9915b` (2,603,322 bytes).
- Descriptor: `sha256:d225a9de69e70e80ce487be5b90c5ce69aa2ddf9c045944d946e95c135cb404c` (1,122 bytes).
- GF policy/repository/real HTTP API/application-map/negative tests: 10 passed, 0 failed.
- Shared graph/runtime/schema/topology/UI/service/store and France regression: 75 passed, 0 failed.
- Repository-wide TypeScript `tsc --noEmit`: passed.
- Deterministic rebuild: all three hashes matched.

Machine-readable evidence is in `reports/postal-context-m2/gf-current-postcodes-2026-09-01.json` and `reports/postal-context-m2/gf-validation-2026-09-01.json`.
