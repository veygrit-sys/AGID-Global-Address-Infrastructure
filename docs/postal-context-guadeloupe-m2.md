# Guadeloupe Postal Context M2

## Outcome

Guadeloupe (`GP`) satisfies its country-specific `M2_experimental` definition for the complete current GP assignment denominator captured at `2026-09-01T04:04:46.227Z`. The immutable pack contains all 33 distinct current GP postal codes and 33 real Polygon/MultiPolygon display surfaces. The application can search, normalize, retrieve, fit, render, clear and re-search them.

No surface is an official postal boundary. Each is `derived`: an official La Poste postcode-to-INSEE assignment is joined to the matching official COG 2026 commune contour. Multiple Ligne 5 rows remain one postal identity and one surface. `97139/97142` share the Les Abymes surface. Same-prefix `97133/97701` belongs to BL and `97150/97801` belongs to MF; neither identity is reassigned or merged into GP. No point, buffer, cell, address, building, parcel, recipient, customer or land-right record creates an area.

## Sources, version and rights

### La Poste assignment

- Dataset: <https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal>.
- data.gouv.fr metadata: <https://www.data.gouv.fr/api/1/datasets/545b55e1c751df52de9b6045/>.
- Raw resource: <https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/raw>.
- Resource ID: `008a2dda-2c60-4b63-b910-998f6f818089`.
- Data update: `2026-08-08T02:02:09.846Z`; metadata update: `2026-08-31T23:11:18.251Z`.
- Snapshot: 1,555,485 bytes, 39,192 rows, semiannual frequency.
- SHA-256: `f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22`.

The complete source contains exactly 38 GP rows, 33 distinct postal codes and 32 distinct INSEE 971xx commune identities. Codes `97125`, `97130`, `97131` and `97180` have multiple Ligne 5 rows. These labels are retained in provenance but are not converted into invented sub-commune areas. Territorial identity is determined from the official INSEE commune code, not from postal prefix: BL `97133/97701` and MF `97150/97801` are excluded. La Poste describes the base as a postcode/INSEE-commune crosswalk and states that open postcode contours are not supplied, so assignment and geometry authorities remain separate.

### Administrative geometry

- Department query: <https://geo.api.gouv.fr/departements/971/communes?fields=nom,code,codesPostaux,surface,contour&format=geojson&geometry=contour>.
- Postcode query template: <https://geo.api.gouv.fr/communes?codePostal=97110&fields=nom,code,codesPostaux,surface,contour&format=geojson&geometry=contour>.
- API documentation: <https://geo.api.gouv.fr/decoupage-administratif/communes>.
- INSEE context: <https://www.insee.fr/fr/metadonnees/geographie/departement/971-guadeloupe>.
- Department response SHA-256: `b307845f32aa358bad7df3b2219e3029329748598aa02e52d47656da98ab26db`.

INSEE identifies Guadeloupe as department `971` in COG 2026 and lists 32 communes. The fixed department response contains those same 32 identities. Each of 33 separately fixed GP postcode queries returned exactly one feature whose commune identity and coordinates equal its department feature. All individual byte lengths and hashes are recorded in `reports/postal-context-m2/gp-current-postcodes-2026-09-01.json`.

### Reuse terms

The sources use Etalab Open Licence 2.0: <https://www.etalab.gouv.fr/licence-ouverte-open-licence/>. It permits reuse subject to source and latest-update attribution and prohibits implying official endorsement. The captured terms body SHA-256 is `86a7ee68dd19febfe782f8f3081ade6eedd8911044d6784355fa13ac456100f2`.

Attribution: “La Poste — Base officielle des codes postaux, data update 2026-08-08; INSEE COG 2026; Etalab / geo.api.gouv.fr commune contours; Licence Ouverte 2.0. Retrieved 2026-09-01.” Raw source bodies remain outside Git.

## Reproducible transform and data quality

`scripts/build-postal-context-gp-m2.mjs` verifies every one of the 40 fixed evidence bodies (3,663,819 bytes) before processing. It validates metadata, decodes the Windows-1252 CSV, rejects duplicate rows, requires the exact 38-row/33-code/32-commune GP denominator and explicit BL/MF exclusion, validates COG identity, requires one exact postcode-query feature, compares its coordinates to the department feature, checks coordinate range and closed rings, and passes Turf and JSTS validity before writing sorted graph, geometry and descriptor artifacts.

The published set contains 21 Polygon and 12 MultiPolygon responses, 67 rings and 41,291 positions. The largest runtime response has 2,446 positions, below the 20,000-position response gate. A second clean build reproduced the three artifact hashes exactly. Coordinates are copied without geometric modification.

Confidence `0.90` reflects the exact official assignment and official commune contour while explicitly discounting the fact that a commune is not a postal perimeter. It is not a 90% boundary-accuracy claim.

## Shared and multi-row exceptions

- `97139` and `97142` both map to Les Abymes (`97101`) and keep separate postal identities with the same whole-commune surface.
- `97125` (Pigeon), `97130` (Bananier and Sainte-Marie), `97131` (Les Mangles) and `97180` (Douville) have multiple official rows for one postal code; each publishes one surface and exposes the labels without inventing internal boundaries.
- `97133` (BL) and `97150` (MF) are rejected in GP normalization and do not exist in the GP graph or geometry.

## Application path

The real HTTP route test loads the committed GP pack, searches `９７１ １０`, and normalizes it to `97110`. The API returns one real MultiPolygon with `sourceType=derived`, `assignmentAuthority=official_postal_operator`, `geometryAuthority=official_mapping_geometry`, source date `2026-08-08` and confidence `0.90`.

The application converts the response to its GeoJSON source, obtains fit bounds `[[-61.557972, 16.213163], [-61.525526, 16.253081]]`, and verifies background-visible fill opacity `0.22`, outline opacity `0.95` and outline width `3`. The same deterministic harness removes the source/layers, re-searches `97190`, confirms the disclosed equal Les Abymes surfaces for `97139/97142`, returns `no_match` for structurally valid but unassigned `97199`, rejects `971-00`, cross-country `97300`, BL `97133` and MF `97150`, and refuses malformed geometry before map rendering.

Shared UI/state tests cover loading, no match, multiple candidates, API failure, invalid geometry, clear and re-search. The UI contract exposes normalized postcode, geometry type, official/derived/virtual classification, source, reference date and confidence. This deterministic real HTTP/API-to-map-source/style/fit harness is the relevant rendering evidence; a statistical chart or screenshot would not improve the spatial/provenance audit.

## Authority separation and limitations

- The official La Poste crosswalk has assignment authority and no geometry authority.
- The COG/geo.api.gouv.fr contour has administrative geometry authority and no postal-assignment authority.
- The joined surface is `derived`; it is not an official postal, legal, survey, cadastral or delivery boundary.
- P.O. boxes, routes, organizations, delivery points and other non-area objects are not expanded into areas.
- No address, BAN point, building, parcel, recipient, customer, occupant, deliverability or land-right record is published.
- Guadeloupe remains identity `GP`, department code `971`; BL and MF remain their own identities.

## Artifacts and verification

- Graph: `sha256:6498e3deaff95420ebae23f44449835757ed104b744c6f5664f6030ea9b561d5` (64,523 bytes).
- Geometry: `sha256:bfaa43b5d2d513dab824f6c08103a96c36c4011fd23e43ad73d0a9ef1c11d7c8` (971,190 bytes).
- Descriptor: `sha256:2cb4b29c35dfbf4daeb085f3d85fc3a7f82111a898bdc52d206961c693b8d0d8` (1,120 bytes).
- GP repository/real HTTP API/application-map/negative tests: 9 passed, 0 failed.
- Shared graph/runtime/schema/topology/service/store and France regression: 162 passed, 0 failed.
- Shared postal-area UI/map tests: 5 passed, 0 failed.
- Repository-wide TypeScript `tsc --noEmit`: passed.
- Deterministic rebuild: all three hashes matched.

Machine-readable evidence is in `reports/postal-context-m2/gp-current-postcodes-2026-09-01.json` and `reports/postal-context-m2/gp-validation-2026-09-01.json`.
