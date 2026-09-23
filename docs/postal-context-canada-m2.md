# Canada Postal Context M2 review

Reviewed: 2026-08-31T16:29:28.906Z

Decision: **blocked / M2 unmet**

Target: M2_current_canada_post_assignment_and_area_visualization

## Outcome

Canada Post's current six-character assignment denominator is a monthly licensed Postal Code Address Data product. The current review-date release is `260807ad.zip`, but obtaining it requires a use request, pricing and an applicable licence agreement. No contact, request, registration, authentication, contract acceptance or payment was authorized, and no licensed row was acquired.

Public technical specifications describe valid mailing addresses, ranges, changes, lock boxes, routes, general delivery, named buildings, governments and large-volume receivers. They do not publish a six-character Polygon/MultiPolygon, CRS or topology schema. A full `ANA NAN` code can identify a block face, single building, large-volume receiver or rural community and is not universally an area.

## Geometry and application gate

Statistics Canada's open 2021 Census Forward Sortation Area boundary file contains 1,643 Polygon CFSAs keyed by the first three characters. It is built from respondent-reported codes and dissemination areas, may differ from Canada Post-assigned FSA geography, has no LDU/full-code geometry and is census-vintage. It was therefore not returned for a submitted six-character code or labelled as Canada Post geometry.

PCCF coordinates, CFSA/FSA boundaries, NAR points, ODB footprints, administrative areas, roads, parcels, buffers, hulls, Voronoi/raster cells, models and AGID cells were not promoted. Buildings, large-volume receivers, lock boxes, routes, general-delivery and other non-area objects remain typed without invented surfaces.

The shared application still passes Polygon/MultiPolygon-only draw, fit, translucent fill, visible outline, no-match, non-area, clear and re-search contracts. There is no approved immutable real CA full-code area artifact for the real CA API/app, so country search-to-map visualization and browser E2E are not claimed.

## Rights, privacy and identity

The licensed-data request asks about internal and third-party use, geospatial/derivative products, sublicensing, hosting, bulk-download and scraping controls; submission leads to pricing and the applicable licence. AddressComplete requires a key and limits Canada Post Data to licensed purposes. The Statistics Canada Open Licence covers eligible Statistics Canada information but does not open Canada Post assignment intellectual property or turn 2021 CFSA into current full-code postal geometry.

No provider was contacted; no key, response, assignment, address, recipient, customer, organization, delivery, property, cadastral or land-right row was queried. Canada, province/territory, Indigenous, postal, census, administrative, address, building and AGID identities remain separate.

## Fixed evidence and PDF validation

Eleven exact official bodies totaling 2,395,946 bytes were fixed outside Git with URLs, retrieval time, edition, bytes and SHA-256. They comprise Canada Post format/licensed-data/API/terms material, the 2026 production schedule, technical specification and request form, plus Statistics Canada CFSA guide/layer metadata and Open Licence. No raw body, feature row or rendered image is committed.

Four PDFs contain 49 physical pages. Schedule page 2, technical-specification page 2, request-form page 6 and CFSA-guide page 5 rendered to non-empty 150-DPI RGB PNGs with fixed dimensions, non-white bounds and render SHA-256. Text, page counts and editions passed. The image-view helper returned Windows error 206 through both original and short `C:\tmp` paths, so interactive visual inspection could not be completed; this does not promote any data.

## Unblock and retry

M2 requires explicit approval to obtain the current licensed assignment denominator and compatible processing, derivation, redistribution and public-serving rights. It additionally requires real full-code Polygon/MultiPolygon artifacts, or explicit typed non-area results, with immutable provenance and complete reconciliation, followed by real CA loader/API/UI/rendering verification.

Do not recheck before 2026-09-07T16:29:28.906Z, and then only after the pending-country sweep or a material Canada Post/Statistics Canada release. Provider contact, request submission, authentication, licence/contract acceptance, payment, protected-row access, repository or destination creation, publication and deployment require explicit approval.
