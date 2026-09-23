# Saint Kitts and Nevis Postal Context M2 review

## Technical summary - postcode system confirmed; M2 remains blocked

Saint Kitts and Nevis has an official integral `KN` plus four-digit postcode system. The December 2017 UPU addressing sheet fixes the format and position, while Government SKNIS publications describe two postal-zone digits followed by two delivery-district digits and confirm the system's official launch on 9 October 2016. The Government assignment article, updated in April 2017, exposes 32 codes including `KN0101`, `KN1202` and exceptional-looking `KN7000`. KN remains in postcode-data scope.

M2 is not achieved. The reviewed bodies do not provide a current versioned complete assignment, alias, validity, correction, exception and explicit non-area denominator. Their area descriptions are prose lists of localities and streets rather than a Polygon/MultiPolygon artifact with feature identity, CRS, topology, class, method, confidence and exceptions. No island, parish, locality, street, office, route, Point, buffer, hull, cell or model was promoted.

## Country-specific M2 definition and metadata

The target is `M2_current_skn_postal_assignments_and_delivery_district_area_visualization`. Every drawable current code must reconcile to fixed valid real Polygon/MultiPolygon geometry and retain postal authority, official/derived/virtual class, source, date, CRS, topology, method, confidence and exceptions. Non-area delivery objects must remain typed and explain why no surface exists. A rights-cleared immutable artifact must drive normalization, API lookup, loading/no-match/multiple/failure/invalid-geometry states, map fit, translucent fill, clear outline, clear/re-search and code/geometry/class/source/date/confidence UI.

KN address JSON, YAML and the generated Americas hierarchy now use `KN9999`, regex `^KN\d{4}$`, integral-prefix examples and the Government/UPU source boundary. The update prevents the previous ambiguous `country specific or not used` prompt; it does not promote the dated article to a current data release.

## Fixed evidence, rights and reproducibility

Seven exact Government/SKNIS and UPU bodies totalling 1,176,198 bytes were fixed outside Git with retrieval time and SHA-256. The fail-closed inspector validates the current ministry page, official launch, 2023 addressing-system modernization statement, exact 32-code article set, UPU one-page format sheet and Government/UPU rights markers. It rejects missing, renamed, additional or changed bodies, code-set drift, discovered dataset links and PDF signature/page/marker drift. Raw pages, article locality/street lists and the UPU PDF are not committed.

The current Government footer states All Rights Reserved. UPU copyright terms restrict reproduction, transmission and database use. Public access supplies reference evidence, not permission for AGID processing, storage, derivation, redistribution or public serving. No provider contact, registration, authentication, terms acceptance, contract, payment, protected access, new repository, publication or deployment was attempted.

The UPU sheet rendered deterministically as a 1323x1871 RGB PNG (140,885 bytes; SHA-256 `cbfa77f5a0cb97ce61733728d9cab7a59fd706e3b142271fdd824dc5ecf91c37`). The local image-view helper failed with Windows error 206, so PDF visual inspection is not claimed; exact PDF bytes, page count, extracted markers, dimensions and render hash were verified.

## Running-app verification

The isolated app returned HTTP 200 at `http://127.0.0.1:3015/`. A real unmocked `GET /api/v1/postal/KN/KN0101?geometry=geojson` returned 404 with `Postal Context country is not supported`, so no KN production descriptor or area artifact is enabled.

The in-app Browser was attempted first but failed before navigation because its Windows sandbox could not apply deny-read ACLs. A deterministic Playwright fallback then loaded the real app, entered `KN0101 Saint Kitts and Nevis`, clicked Search, observed 12 generic place results and two map canvases, and kept the postal API unmocked. The app selected a Turkish honorary-consulate result, issued no KN Postal Context request and showed no postal-area notice or geometry/class/source/date/confidence metadata. The screenshot was fixed at 72,410 bytes (SHA-256 `c74b1f4c902421b4b5eae3269b6d1883bda5afd814039f221f66ec15b32b2d3c`) outside Git, but the local image-view helper failed; neither browser E2E nor visual postal-area success is claimed.

## Required next step

Keep KN blocked and continue to `KY` (Cayman Islands). Re-check no earlier than `2026-12-01T10:04:53.864Z`, after pending countries have been swept, unless the Ministry of Posts or another competent authority publishes a current complete rights-cleared assignment and postal-area artifact. Contact, agreement, paid access, protected data, a new public destination or deployment requires explicit approval.
