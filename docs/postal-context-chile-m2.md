# Chile Postal Context M2 review

Observed: `2026-08-31T17:13:59.841Z`
Completed: `2026-08-31T17:48:49.2580256Z`
Decision: `blocked` — M2 is not achieved.

## Country-specific criterion

Chile M2 is `M2_current_correoschile_assignment_and_area_visualization`. It requires an exact current, complete and finite CorreosChile seven-digit assignment release, including aliases, validity, corrections, exceptions and typed postal objects, with retrieval time, edition, schema, coverage, byte length and SHA-256 under rights compatible with AGID processing, storage, derivation, redistribution and public serving.

A syntax match, three-digit distribution-area prefix, UPU example, one public lookup, one credentialed normalization response or commune match is not assignment completion. Each drawable code must have a fixed, real and rights-cleared valid Polygon/MultiPolygon with postal authority, official/derived/virtual class, source release, reference date, CRS, topology, reproducible method, confidence and exceptions. Block-face, commune-fallback, post-office, P.O. box and rural objects remain separately typed; an area is never invented for a non-area object.

DPA/commune and census polygons, roads, ranges, parcels, cadastral/address points, buildings, buffers, hulls, Voronoi/raster cells, models, AGID cells and synthetic fixtures are prohibited postal-area substitutes. An approved immutable artifact must drive the real CL API and application through search, ambiguity, failure, geometry validation, fit, translucent fill, clear outline, clear and re-search, with selected code, geometry kind, class, source, reference date and confidence displayed.

## Official evidence fixed for this review

Eight official bodies totaling `692,958` bytes were fixed and verified by byte count and SHA-256. Raw bodies and rendered pages remain outside Git.

| Authority | Fixed evidence | Finding |
| --- | --- | --- |
| ChileAtiende / CorreosChile | Current page and two-page PDF, last updated 2026-01-27 | The procedure accepts commune, street and municipal number and returns the code for one property. It is not a complete assignment or area release. |
| CorreosChile | Current postcode form HTML | The public form requires commune, street and number. No address was submitted, CAPTCHA bypassed or response row acquired. |
| UPU / CorreosChile | Chile addressing sheet, edition 03/2017, two pages | The first three digits are a distribution area and the last four a sequential block-face identifier. Commune fallback, post-office/P.O. box and rural no-number cases are distinct. No polygon schema is published. |
| IDE Chile Geoportal | CSW 2.0.2 capabilities and two fixed metadata queries | `codigo postal` matched 0 records. Broad `postal` matched only Controles Fronterizos 2018 and 2019 because their abstracts mention postal shipments; neither is a postcode layer. |
| IDE Chile / SUBDERE / IGM / DIFROL / INE | División Política Administrativa 2023 catalog item | This is region/province/commune administrative Polygon geometry, not CorreosChile postal geometry. Source-specific publication controls and scope remain intact. |

The CorreosChile developer normalization, access-control and integration pages were also reviewed live. They describe customer credential/token access, a full-address-plus-commune request and normalized address/postcode fields without geometry. The integration workflow requests customer/company identifiers. Those live pages could not be byte-bound from the local fetch path; no credential, registration, contract, terms acceptance or response was used.

The exact receipts and findings are in [cl-source-review-2026-08-31.json](../reports/postal-context-m2/cl-source-review-2026-08-31.json), digest `sha256:9487c98c69cdbaa5f567c2ed2da9ac42199ce4140aa799b284444f7d0c42d2a1`.

## Why M2 remains blocked

- No current complete reusable CorreosChile assignment release or finite assignment/alias/validity/correction/exception denominator was identified or acquired.
- The credentialed normalization API was not authorized or used and publishes no postal geometry contract.
- Written rights compatible with AGID public assignment and area serving were not established.
- The normal seven-digit object is address-dependent and block-face-first; fallback, post-office, P.O. box and rural cases cannot be forced into one area class.
- No official or rights-cleared real seven-digit Polygon/MultiPolygon record was found. The official Geoportal catalog has no `codigo postal` metadata record at the fixed review time.
- DPA 2023 administrative polygons and every other administrative, statistical, cadastral, point, road, address, model, AGID or synthetic proxy remain ineligible.

The release therefore contains `0` current assignment rows, `0` official postal polygons, `0` derived/virtual production polygons and `0` approved runtime artifacts.

## Application path

The shared application contract and the existing synthetic CL runtime contracts pass. They verify strict seven-digit normalization, country routing, no-match and non-area handling, Polygon/MultiPolygon-only drawing, fit, translucent fill, visible outline, clear and re-search behavior. The bundled `9999999` fixture remains fabricated and derived-review-only.

There is no approved real CL descriptor, so the real CL runtime, API and postcode-to-area application path are not verified. Browser E2E was not run because it would exercise only shared code or synthetic data and cannot prove M2. Loading, no-match, multiple, API failure, invalid geometry, fit, drawing and provenance display therefore remain unverified with real Chile data.

## Validation

All `72` recorded checks passed with `0` failures:

- exact-source inspection: 1;
- fail-closed inspector unit tests: 7;
- shared and CL repository/runtime/API/source tests: 41;
- rollout invariants: 8;
- CL ledger and evidence tests: 6;
- focused TypeScript no-emit graph: 1;
- changed Python, JavaScript and JSON syntax: 8.

Poppler rendered three relevant pages from the two PDFs at 150 DPI; four physical pages, extracted markers, non-empty pixel bounds and render digests passed. The local image viewer returned Windows error 206, so interactive visual inspection is explicitly not claimed. Full engineering details are in [cl-checks-2026-08-31.json](../reports/postal-context-m2/cl-checks-2026-08-31.json), digest `sha256:621b2254cda3d3d4f3808d67f031c45226e3e488f5a238419523a4d57142545f`.

## Unblock and retry

With explicit approval, obtain the exact current operator release and written rights for the intended AGID lifecycle. Establish the complete denominator, keep non-area objects surface-free, build only independently authorized real geometry, publish an immutable artifact and run the real CL API/app verification.

Do not contact the provider, submit an integration request, register, authenticate, accept terms/licence/contract, pay, access protected address/customer/organization/property/land-right data, create a repository/public destination, publish or deploy without approval. Recheck public metadata only after the pending-country sweep and `2026-09-07T17:13:59.841Z`, or sooner after a relevant public release. The next pending country is Colombia (`CO`).
