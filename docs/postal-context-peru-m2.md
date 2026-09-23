# Peru Postal Context M2 review

PE remains M2-blocked. Peru has a current five-digit national postcode system, and the MTC open-data catalogue provides a rights-cleared but dated 2018 assignment workbook. The fixed workbook contains 98,378 assignment rows and 2,669 distinct codes, while the MTC 2022 sector bulletin reports 2,670 codes. It contains no geometry or coordinate column. No current complete denominator or reusable nationwide postal Polygon/MultiPolygon artifact was established.

## Country-specific M2 definition

`M2_current_mtc_complete_assignment_and_postal_area_visualization` requires a current complete MTC release or explicitly authorized service inventory of every five-digit assignment, populated-centre/locality/routing/postal-district association, validity interval, correction, exception and typed area/non-area postal object. The denominator must be fixed by retrieval time, release or service version, stable identity, schema, coverage, exact bytes and SHA-256 under rights compatible with AGID processing, storage, derivation, redistribution and public serving. The dated 2018 ODC-By workbook remains dated assignment evidence only; its 2,669-code count must be reconciled with the published 2,670 denominator and current assignments.

Every drawable code must reconcile to finite closed valid Polygon/MultiPolygon geometry with official/derived/virtual class, source feature identity, reference date, CRS, topology, reproducible method, confidence and exceptions. Workbook rows, referential viewer limits, routing/locality/populated-centre labels, administrative or cadastral boundaries, points, routes, P.O. boxes, organizations, buffers, hulls, Voronoi/raster surfaces and AGID cells cannot be promoted as postal areas. A non-area postal object must expose its type and reason without fabricated geometry.

An approved immutable artifact must drive the real PE API/app, normalize exactly five digits, handle loading, no-match, multiple candidates, API failure and invalid geometry, fit and render a translucent fill with a clear outline only for eligible real geometry, support clear and re-search, and display the selected code, geometry kind, official/derived/virtual class, source, reference date and confidence.

## Fixed primary evidence

- MTC official guidance, last changed 14 January 2024, confirms a five-digit code based on location and links the national lookup.
- The official open-data catalogue and resource page fix the MTC workbook as a public 23 March 2018 resource under Open Data Commons Attribution. ODC-By permits use and derivative databases subject to attribution and notice requirements.
- The fixed workbook has 98,378 non-empty rows, all with valid five-digit values, 2,669 unique codes and 97,992 populated-centre identifiers. It has zero geometry and zero coordinate columns. Code `15082` occurs twice.
- The 2022 MTC sector bulletin describes 2,670 national codes and area/locality semantics. The one-code gap and the age of the workbook prevent it from serving as the current complete denominator.
- The legal framework assigns ongoing administration and revision to MTC and describes supporting cartography, but legislation is not a reusable postal polygon release.
- The current MTC viewer states that geographic limits are referential. Its direct page was unavailable from the review environment, and the wrapper returned a Cloudflare block. Current lookup automation, caching and redistribution rights were therefore not established.

Eight exact official or licence bodies total 10,888,424 bytes. The fail-closed inspector binds every body to its URL, byte count and SHA-256, validates the workbook schema and counts, and emits zero raw rows and zero production records. Source bodies, workbook rows, screenshots and temporary inspection output remain outside Git.

## App and visual result

The actual isolated app returned HTTP 200 at `http://127.0.0.1:3020/`. Direct unmocked `GET /api/v1/postal/PE/15082?geometry=geojson` returned HTTP 503 `Postal Context pack is unavailable`.

The in-app Browser failed before navigation while its Windows deny-read ACL sandbox initialized. Deterministic Playwright therefore queried `15082 Peru` against the actual app without mocking the Postal Context API and selected the Lima result. The browser made four legacy nearest-postcode requests, all HTTP 404, and zero PE `/api/v1/postal/PE/...` requests. A fixed map-only image, cropped to exclude unrelated search results, was manually inspected through the app. It showed the background map, AGID grid, selected PE AGID cell and Lima address card, but no translucent postal area, clear postal outline, unavailable notice or postal geometry class/source/date/confidence. The AGID cell was not relabelled as a postal area. This is negative visual evidence, not a successful browser E2E.

## Decision and unblock condition

M2 is unmet. No workbook row, referential limit, administration, cadastral feature, point, route, address, building, synthetic fixture or AGID cell was promoted. The block can be removed only when MTC or another competent authority publishes or supplies a current complete immutable typed assignment and eligible postal-area/non-area artifact with compatible AGID rights, after which the real PE API and app must pass normalization, topology, state handling, fit, translucent fill/outline, clear and re-search verification.

Retry no earlier than `2026-12-01T18:18:02.840Z`, after pending countries have been swept. Contacting a provider, requesting data, registering, authenticating, accepting terms/licence/contract, paying, accessing protected data, creating a publication destination, publishing or deploying requires explicit approval.
