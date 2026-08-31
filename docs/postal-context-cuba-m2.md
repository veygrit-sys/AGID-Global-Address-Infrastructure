# Cuba Postal Context M2 review

Reviewed at `2026-08-31T22:07:06.826Z`. Result: **blocked / M2 unmet**.

## Country-specific M2 definition

Cuba reaches `M2_current_correos_cuba_assignment_and_postal_area_visualization` only when a complete, pinned current Correos de Cuba assignment denominator covers every active five-digit code, validity interval, alias, exception and typed non-area object, and every drawable code is joined by a stable identifier to a versioned official or rights-cleared derived postal-area Polygon/MultiPolygon. Exact release, receipt, schema, date, CRS, topology, rights, attribution, bytes, SHA-256 and a reproducible no-fabrication transform must be fixed. The real AGID API and application must normalize the code, return valid real geometry and provenance, fit and draw a translucent fill with a clear outline, clear and re-search it, and expose loading, no-match, multiple, API-failure and invalid-geometry states.

A postal office, office address or telephone, postcode example, locality, municipality, province, administrative/statistical/cartographic/cadastral object, point, buffer, hull, Voronoi cell, model surface, synthetic fixture or AGID cell is not a Cuban postal area. Routes, P.O. boxes, organizations and delivery points remain typed non-area objects unless competent real area geometry exists.

## Current Correos surface is an office directory, not an assignment-area release

Correos de Cuba's public `Puntos de Servicios` page calls itself `Oficinas y Códigos Postales`, describes a network of 812 post offices and exposes filters for office name, office address, postcode, province, municipality and services. Its page-linked JavaScript queries the public `oficinas` action and renders office name, address, telephone, postcode, schedule, services, municipality and province.

A single UI-equivalent first-page observation on 31 August 2026 reported 841 offices and returned 10 public institutional office rows. The 13 response fields contain no coordinate, bounding box, Polygon, MultiPolygon, membership, validity, alias or supersession field. The live total of 841 also disagrees with the page narrative of 812. This is a data-quality warning and, more importantly, proves neither a complete active-code denominator nor a delivery-area surface. The temporary office response remains outside Git.

## UPU evidence supplies format and credentialed lookup, not reusable areas

The one-page Cuba addressing sheet visibly dated `09/2004` says that five digits appear to the left of the locality, preceded by `CP`, and shows `CP 10600 CIUDAD HABANA` and `CP 10300 HABANA 3`. It documents address layout and examples, not a current nationwide assignment, validity register or postal geometry.

The 2024 POST*CODE quick guide documents format checks and postcode/locality lookup functions. Page 3 says an API key is obtained by registration and that free calls, costs and trials are provider-managed. The CDS guide requires a country-unique security token from a regional support centre. The product and guides document locality suggestion, postcode/locality verification and format validation; they document no Polygon/MultiPolygon response.

UPU's copyright page reserves all rights, requires written permission for use, reproduction or transmission except as provided, and restricts external distribution or sale of database documents. These terms do not establish AGID processing, derivation, redistribution and public map/API serving rights. No registration, key request, provider contact, contract, NDA, declaration, payment or protected API call was made.

## Exact receipts and quality assessment

Eleven successful official bodies total 1,492,006 bytes and are fixed individually by SHA-256 in `reports/postal-context-m2/cu-source-review-2026-09-01.json`: five Correos public bodies, the dated UPU Cuba sheet, the UPU product page, copyright and disclaimer pages, and two UPU API guides. Empty timeout responses are excluded. Raw HTML, JavaScript, JSON, PDFs, headers, cookies, renders and office rows are not committed.

| Dimension | Result | Interpretation |
| --- | --- | --- |
| Current operator | Correos de Cuba identified | Competent source identified, but no complete reusable assignment release acquired. |
| Office directory | page narrative 812; API total 841; 10 rows observed | Count inconsistency; records describe offices, not delivery-area membership. |
| Assignment completeness | 0 eligible current code assignments | Five-digit examples and office postcodes are not a national denominator. |
| Geometry | 0 Polygon/MultiPolygon fields or records | No official or rights-cleared derived postal area exists in reviewed sources. |
| Rights | Correos bulk/public-serving grant not found; UPU written permission and API key/token required | Public visibility and credentialed lookup do not authorize redistribution. |
| Production artifacts | 0 | No immutable real CU artifact can enter the loader, API or application. |

## Postal, administrative and address authority remain separate

The office directory is official operator evidence for offices. IDERC, ONEI and GEOCUBA may provide source-specific administrative, statistical or cartographic context, but no reachable, versioned postal-area release with suitable rights was identified in this review. They cannot be relabelled as postal assignments. OSM and AGID remain community or independent spatial contexts. No point buffer, administrative proxy, building/parcel dissolve or invented surface was created.

The review queried no person, customer, recipient, private organization, address/building register, parcel, cadastral, land-right or internal delivery-point row. Ten public institutional office rows were observed only to verify the public contract and were not committed. Postal Code → Polygon → Address Context authority separation is preserved.

## Application status

Shared deterministic tests already cover Polygon/MultiPolygon validation, fit, translucent fill, visible outline, loading/no-match/multiple/API-failure/invalid-geometry states, selected code/type/classification/source/date/confidence, clear and re-search. CU's synthetic fixture verifies normalization and runtime/API contracts without promotion.

No real eligible CU geometry exists, so no real CU loader artifact, API geometry response, map fit or translucent area was verified. Browser E2E is intentionally not claimed because it would validate only shared capability or synthetic data.

## PDF and robustness checks

- The one-page UPU Cuba sheet was rendered and visually reconciled with extracted text; the five-digit/`CP` rule and examples are legible.
- POST*CODE guide page 3 was rendered and visually checked; API-key registration, trial/cost contact and lack of geometry output are legible.
- CDS guide page 1 was rendered and visually checked; the country-unique security-token requirement is legible.
- The public office payload was inspected for geometry-like keys and had none.
- The 812/841 discrepancy is retained rather than reconciled by assumption.
- No legal conclusion is claimed; the block is a conservative engineering/publication gate.

## Unblock and retry

M2 requires a public complete current Correos assignment release, a stable rights-cleared postal-area Polygon/MultiPolygon release and explicit rights for AGID processing, derivation, redistribution and public serving. It must then pass the real CU loader, API and application path.

Recheck only after the pending-country sweep and not before `2026-09-07T22:07:06.826Z`. Do not contact a provider, register, request a key/token, accept terms, a declaration, NDA or contract, pay, access protected data, create a publication destination, publish or deploy without explicit approval.
