# Ukraine Postal Context M2 review

## Technical summary

Ukraine remains **blocked / M2 unmet** under `M2_current_ukraine_postal_index_assignment_and_area_visualization`. The current official open-data catalog provides a CC BY August 2025 archive with 320,249 real address-membership rows and 28,796 distinct valid five-digit indices, but the portal marks the monthly dataset not updated, and the release has no coordinate or geometry column. The current Address Classifier v3.20 dated 2026-02-11 requires a contract bearer and documents address membership, a courier-area yes/no flag and office-point coordinates, not postal-index `Polygon`/`MultiPolygon` geometry.

The assignment evidence is therefore useful but insufficient for M2. No current complete assignment, operational exception and explicit non-area denominator, fixed postal-area product, complete area/non-area reconciliation or approved immutable runtime artifact exists. No production postal row or geometry is committed.

## Key findings and evidence

| Gate | Evidence observed | Result |
| --- | --- | --- |
| Official snapshot | The August 2025 archive is 7,193,464 bytes (`sha256:1c30e02d...9455b`) and expands to one Windows-1251 CSV of 117,904,566 bytes (`sha256:46e0a299...2d512`). | Exact and reproducible, but stale for a current August 2026 M2 claim. |
| Assignment rows | 320,249 rows, 28,796 distinct valid locality indices, 5,101 distinct valid office indices and 1,435 leading-zero codes; no invalid nonblank five-digit values. | Strong address-membership evidence, not a complete current operational/exception/non-area denominator. |
| Reuse rights | Data.gov.ua identifies CC BY and Ukrposhta states that open data may be reused and distributed with source attribution. | Source-row reuse is established; no geometry is present to promote. |
| Geometry | All 16 columns are administrative/address/street/house/office/index text; zero latitude, longitude, geometry, WKT, GeoJSON, Polygon or MultiPolygon columns. | No drawable official or derived postcode area product. |
| Current API | Address Classifier v3.20 calls `POSTCODE` a delivery-area code, returns address membership, courier-area yes/no and office-point coordinates, and has no documented postcode Polygon/MultiPolygon endpoint. | Membership/point/service evidence only. |
| API authority and access | The document requires an authorization bearer obtained after signing a contract; the general API document dated 2026-03-09 also requires contract-issued bearer/token values. | No authentication or contract action was authorized or attempted. |
| Immutable artifact and application | No eligible area record exists. | Blocked: 0 production records, 0 approved runtime artifacts, no real UA API/map/browser proof. |

The structured evidence is in `reports/postal-context-m2/ua-source-review-2026-08-31.json`. Raw HTML, PDF, 7z and CSV bodies remain outside Git. A gate table is used instead of a chart because exact categorical pass/fail decisions and audit counts communicate the evidence more accurately than a quantitative visual.

## Scope, data, and definitions

The canonical postal index is five text digits matching `^\d{5}$`; text storage is mandatory because 1,435 observed values begin with zero. Ukrposhta remains postal assignment and service authority. The Ministry/Data.gov.ua release is the rights-cleared distribution surface for the inspected snapshot. KATOTTG, administration, unified address/building registers and NSDI remain separate authorities and cannot create postal membership or change UA identity, sovereignty, occupation or control.

M2 requires a current complete assignment, operational exception and explicit non-area denominator. Every drawable code must reconcile to fixed valid `Polygon`/`MultiPolygon` geometry with official/derived/virtual class, provider, edition/date, rights, attribution, bytes, SHA-256, schema, CRS, topology, member-address denominator, exclusions, wartime/service gaps, territorial policy, method and confidence. Route, P.O.-box, organization and other non-area cases require source-grounded reasons.

## Methodology

The audit started from cumulative branch commit `94204e56b337ee0589f37c925d65a03fe8cc744c` and the ledger-selected `UA` entry. Six exact official bodies totalling 13,280,996 bytes were fixed by byte length and SHA-256: the public-data page, data package, August 2025 archive, Ukrposhta public-information page, Address Classifier v3.20 and general API documentation dated 2026-03-09. The single expanded CSV was independently fixed by byte length and SHA-256.

The reproducible inspector decodes the CSV as Windows-1251, validates every row has 16 columns, preserves five digits as text, counts blanks and invalid values, computes distinct denominators and proves no geometry-like column exists. Both official PDFs were scanned across all 39 and 282 pages for postcode, coordinate, geometry, Polygon and access terms; relevant pages were then inspected directly. No provider contact, registration, authentication, contract acceptance, payment, protected query, publication or deployment occurred.

Geometry is promotion-eligible only when postal authority, compatible rights, correct CRS/location, valid fixed `Polygon`/`MultiPolygon` structure and complete assignment/non-area reconciliation all exist. No office point, address row, KATOTTG/administrative boundary, settlement, street, building, parcel, buffer, hull, Voronoi/raster cell or synthetic substitute is accepted.

## Limitations, uncertainty, and robustness

- The archive can reproduce its August 2025 address membership, but it cannot establish every allocation, temporary service exception, replacement route, P.O.-box, organization or non-area case as of August 2026.
- The absence of a Polygon/MultiPolygon endpoint in the inspected current official documents does not prove that no separately permissioned product exists; it proves none was available in the fixed public evidence.
- Address membership might support a future derived surface only after current complete membership, authoritative rights-cleared address geometry, explicit exclusions, security/territorial review, a reproducible method and uncertainty validation are fixed.
- Office latitude/longitude and the courier-area Boolean were kept as point/service evidence and were not buffered or polygonized.
- No browser E2E was attempted because no production-eligible UA area artifact exists. Rendering a proxy would be misleading evidence.

## Remaining work and unblock conditions

1. Obtain a current complete Ukrposhta assignment, operational exception and explicit non-area denominator under compatible processing, storage, derivation, redistribution and public-serving rights.
2. Obtain a fixed valid postal-index `Polygon`/`MultiPolygon` product, or current complete rights-cleared authoritative address membership plus address geometry and an approved reproducible derivation, with exact edition/date, bytes, SHA-256, schema, CRS, topology, exclusions, coverage, territorial/security policy, method and confidence.
3. Reconcile all indices to valid official/derived/virtual areas or explicit source-grounded non-area reasons without office, point, administration, settlement, street, building, parcel or synthetic proxies.
4. Build an approved immutable artifact and pass real UA normalization, loader, API, validity, loading/no-match/multiple/failure/invalid states, map fit, translucent fill, clear outline, provenance, clear and re-search verification.

Do not retry before `2026-09-07T03:03:41.090Z` while pending countries remain. Provider contact, registration, authentication, contract/terms acceptance, payment, protected-data access, publication destination creation, publication and deployment require explicit approval.

## Further questions

- Will Ukrposhta publish a post-August-2025 complete open-data refresh with operational exceptions and explicit non-area classifications?
- Is there a provider-authorized postcode-area product, or an authoritative public address-geometry release suitable for a documented derived surface, that can be publicly served by AGID?
