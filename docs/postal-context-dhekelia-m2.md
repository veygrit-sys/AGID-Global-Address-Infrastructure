# Dhekelia (XD) Postal Context M2 source and application review

## Technical summary

XD remains M2-blocked. Current official evidence establishes the BFPO route `58` / shadow postcode `BF1 2AU` and Cyprus Post references `6370` / `7502`, but it does not establish a rights-cleared fixed postal Polygon/MultiPolygon or a complete cross-system area/non-area denominator. No area was invented from the Dhekelia territory, combined Sovereign Base Areas, Cyprus administration, streets, communities, environmental maps, offices, addresses or points.

## Key findings and evidence gates

| Gate | Result | Evidence |
|---|---:|---|
| Current BFPO route | Pass | GOV.UK maps Dhekelia to BFPO 58 and BF1 2AU; BFPO addressing uses the number rather than a town/country. |
| Current Cyprus Post references | Partial | Exact workbook inspection finds 39 `Dekeleia` street rows at 7502, one military-labelled row at 6370 and two community rows. |
| Complete assignment/exception/non-area denominator | Fail | BFPO eligibility and Cyprus Post membership/exception semantics are not completely reconciled for XD. |
| Compatible resource rights | Fail | GOV.UK text is OGL v3, but Cyprus Post displays copyright and no resource-specific AGID-compatible public-serving grant was found. |
| Fixed postal area geometry | Fail | Six-sheet XLSX has no coordinate, CRS, WKT, GeoJSON, Polygon or MultiPolygon field; the SBA document is environmental, not postal geometry. |
| Real XD application path | Fail | No eligible immutable artifact exists, so real API retrieval, map fit, translucent rendering and browser E2E are not claimed. |

## Scope, data and definitions

The audit used seven exact official bodies (4,207,851 bytes), each bound by URL, byte count and SHA-256 in the source-review JSON. Raw HTML, XLSX, PDF, row data and rendered pages remain outside Git. `BFPO 58`, `BF1 2AU`, `6370` and `7502` are operator assertions with independent provenance; none is silently converted into territory membership or a building relation.

The country-specific M2 definition requires a current complete BFPO and Cyprus Post denominator, reviewed processing/storage/derivation/redistribution/public-serving rights, fixed valid Polygon/MultiPolygon geometry or source-grounded non-area reasons, and a real XD API/UI path with normalization, loading/no-match/multiple/failure/invalid-geometry states, map fit, translucent fill, outline and provenance.

## Methodology

The source inspector verifies exact bytes and SHA-256, GOV.UK route/addressing/OGL statements, Cyprus Post page copyright and XLSX link, XLSX core metadata and all six worksheet XML bodies, exact Dhekelia-related row counts, absence of geospatial fields/media/charts, and the three-page SBA PDF receipt. A separate read-only spreadsheet inspection cross-checked all six sheets and 44 matching cells. PDF text extraction confirmed the Area Office address uses BFPO 58; all three pages were rendered, but no environmental map was interpreted as postal geometry.

Shared deterministic tests cover the application contract only: valid Polygon/MultiPolygon rendering, bounds fit, translucent fill, visible outline, clearing and re-search, non-area handling, error states, authority/purpose/validity gates and independent country routing. Shared capability is not XD production evidence.

## Limitations and robustness

The Cyprus Post workbook is a current dynamic download rather than a published immutable edition, and its resource-specific reuse permissions are unresolved. Text matches do not prove that Cyprus Post rows belong to the XD identity. The 2015 SBA PDF is stale and has an environmental purpose. Local rendering succeeded with `pypdfium2`; the Windows image viewer failed, so no visual-only conclusion was used. A browser E2E was intentionally not staged without an eligible geometry artifact.

## Remaining work

Obtain a current complete dual-system denominator and written compatible resource rights. Acquire and pin a fixed postal area product with edition, reference date, bytes, SHA-256, schema, CRS, topology, coverage, method, confidence and exceptions. Reconcile each supported normalized form to valid area geometry or an explicit non-area reason, preserve all identities, publish only through an already approved destination, then exercise the real API and application states.

## Further questions

- Which operator is authoritative for each address/service class inside XD, and how are BFPO and Cyprus Post assignments reconciled?
- Are BFPO 58 and BF1 2AU strictly non-area routing identifiers for all eligible records?
- Does Cyprus Post license the current workbook and any geospatial postal-area product for AGID processing, derivation, redistribution and public serving?
- Is there a versioned Polygon/MultiPolygon product that separates postal areas from SBA, community and environmental boundaries?

Retry no earlier than `2026-09-07T04:15:44.116Z` while pending countries remain. Provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, destination creation, publication or deployment requires explicit approval.
