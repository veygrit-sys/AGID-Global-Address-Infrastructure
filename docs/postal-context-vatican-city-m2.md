# Vatican City Postal Context M2 review

## Technical summary

Vatican City remains **blocked / M2 unmet** under `M2_current_vatican_00120_assignment_delivery_zone_and_area_visualization`. The August 2026 Universal Postal Union reference and the current designated Vatican postal operator establish `00120` as the country's single postcode and document four delivery zones. This review fixes eight exact official bodies totalling 1,667,950 bytes by SHA-256, but it does not find a rights-cleared geospatial delivery-area product, a complete area/non-area reconciliation, or an approved immutable runtime artifact.

The decisive issue is that “one postcode for the whole country” is an assignment statement, not a geometry licence or perimeter. The operator's 2025 delivery-zone PDF depicts zones 1-3 inside the walls as one raster image and defines zone 4 through 32 address rows carrying `00120` plus 24 recipient categories, including P.O. boxes. Those destinations cross distinct sovereign/property and non-area concepts. The raster has no CRS, coordinates or vector topology. It was not traced or georeferenced, and neither the Vatican City boundary nor Holy See extraterritorial properties were merged or relabelled as a postcode polygon.

## Key findings and evidence

| Gate | Evidence observed | Result |
| --- | --- | --- |
| Current postcode | UPU “Universal DataBase (Aug. 2026)” lists Vatican City `00120` among countries using one postcode for the whole country. | Canonical code established; perimeter not established. |
| Current operator | The current service-quality page identifies Servizio Poste e Filatelia as the designated universal-service operator. | Assignment/service authority established. |
| Delivery topology | The current delivery-zone page says four zones: the first three inside the Vatican walls and the fourth covering extra-territorial zones. | A sovereign-boundary-only polygon is incomplete. |
| Operator PDF | Exact 2025 PDF: 3 pages; page 1 has one raster image, 1 text character and no vector rectangles, curves or lines; pages 2-3 contain 32 `00120` address rows and 24 recipient categories. | Useful topology and exception evidence, not fixed GIS. |
| Non-area cases | The zone-4 categories include P.O. boxes and named organizations. The separate P.O.-box page describes authorized recipients and delivery to boxes. | Must remain non-area unless the operator supplies distinct geometry. |
| CRS/topology | No geospatial CRS, coordinates, rings, feature identifiers or topology are present. | Blocked; no raster tracing, buffer or inferred property union. |
| Rights | The operator site carries a copyright footer; no resource-specific grant compatible with AGID processing, storage, derivation, redistribution and public serving was established. | Blocked. |
| Immutable artifact and application | No eligible area record exists. | Blocked: 0 production records, 0 approved runtime artifacts, no real VA API/map/browser proof. |

The structured evidence, exact URLs, sizes and SHA-256 values are in `reports/postal-context-m2/va-source-review-2026-08-31.json`. Raw HTML and PDFs remain outside Git.

## Scope, data, and definitions

The canonical postcode is the exact five-character text `00120`. The Vatican postal operator remains assignment and delivery-zone authority. UPU remains a current international syntax/reference source. Vatican City territory remains sovereign context. Holy See extraterritorial properties remain distinct legal/property context. Addresses, organizations, P.O. boxes, offices and service state remain separate assertions.

M2 requires the current complete operator assignment, four-zone membership, address/category exception and explicit non-area denominator under reviewed rights. Every drawable component must reconcile to fixed finite closed valid `Polygon`/`MultiPolygon` geometry with official/derived/virtual class, provider, edition, reference date, rights, attribution, bytes, SHA-256, schema, CRS, topology, coverage, method, confidence and exceptions. Non-area cases need source-grounded reasons.

Postal Code → Polygon → Address Context authority separation is preserved. Postal evidence cannot create an address/building relationship, and a building can appear only through a separately sourced explicit distributable relation or common authoritative identifier.

## Methodology

The audit started from cumulative branch commit `a8a3c6502790e50b78e07d1ca8e451c79ac47560` and the ledger-selected `VA` entry. It downloaded only public official pages and PDFs into a temporary directory, bound all eight bodies by exact byte length and SHA-256, and made no provider contact, registration, authentication, agreement, payment, protected query, publication or deployment.

The reproducible Node inspector checks every fixed body and the current official-page assertions. Poppler `pdfinfo` 26.05.0 verified the 2025 PDF metadata and three-page count. `pdfplumber` 0.11.9 profiled text and PDF objects: page 1 contains one raster image, one text character and no vector rectangles, curves or lines; page 2 contains 32 occurrences of `00120`; page 3 contains 24 recipient-category lines. Poppler `pdftoppm` 26.05.0 rendered all pages at 150 dpi for visual inspection. Page 1 is a labelled illustrative base map of zones 1-3 and territory/property context. No pixels were traced or georeferenced.

Geometry is promotion-eligible only when it has postal authority, reviewed rights, fixed coordinates/CRS, valid topology and complete area/non-area reconciliation. No sovereign boundary, extraterritorial property, raster, address, organization, P.O.-box, office, building, parcel, point, buffer, hull, Voronoi/raster cell or synthetic substitute is accepted.

The report uses a gate table rather than a chart because the four-zone topology, exact row/category counts and binary promotion requirements are more accurately communicated as categorical decisions.

## Limitations and robustness

- The current UPU reference establishes `00120` as the single postcode for the whole country but does not state that the sovereign boundary is its exact delivery perimeter.
- The current operator PDF is strong evidence that zone 4 includes destinations beyond the three inside-wall zones, but its address/category list is not a geospatial product.
- A raster could potentially be aligned to another base map, but that would create a derived interpretation without operator-supplied coordinates, topology, tolerance, coverage rules or a compatible derivation/public-serving grant. This audit deliberately does not perform it.
- Public access and a visible copyright notice do not prove database, derivation, redistribution or public-serving rights. This audit does not claim that compatible permission or a separate GIS product cannot exist.
- No browser E2E was attempted because no production-eligible area artifact exists. Rendering the sovereign boundary, raster trace, properties, address buffers or synthetic fixtures would be misleading evidence.

## Remaining work and unblock conditions

1. Obtain a current complete Vatican operator assignment, four-zone membership, address/category exception and explicit non-area denominator plus explicit rights compatible with AGID processing, storage, derivation, redistribution and public serving.
2. Obtain a fixed valid postal `Polygon`/`MultiPolygon` product with exact provenance, edition/date, rights, attribution, bytes, SHA-256, schema, CRS, topology, coverage, method and confidence.
3. Reconcile `00120` across all drawable components and explicit non-area cases without merging Vatican City and Holy See property identity or using raster tracing, sovereign/property boundaries, addresses, recipients, P.O. boxes, offices, points, buildings, parcels or synthetic proxies.
4. Build an approved immutable artifact and pass real VA normalization, loader, API, validity, loading/no-match/multiple/failure/invalid states, map fit, translucent fill, clear outline, provenance, clear and re-search verification.

Do not retry before `2026-09-07T03:43:11.854Z` while pending countries remain. Provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, publication destination creation, publication and deployment require explicit approval.

## Further questions

- Does the operator maintain a geospatial source for zones 1-4 whose coordinates and membership rules differ from the published raster?
- Can the operator grant explicit processing, derivation, redistribution and public-serving rights for a fixed release?
- Which zone-4 recipient categories are strictly non-area, and which named destinations have operator-defined delivery polygons?
