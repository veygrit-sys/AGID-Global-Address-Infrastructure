# Bolivia Postal Context M2 review

## Technical summary - current postal references establish no postcode system

Bolivia remains `blocked` at M1. The Universal Postal Union (UPU) September 2025 Universal DataBase list places Bolivia among countries and territories which do not require postal codes. The UPU Bolivia addressing sheet, edition `2/2026`, independently shows home, P.O. Box and rural delivery examples without a postcode line. The current Agencia Boliviana de Correos (AGBC) portal exposes shipment-tracking identifiers such as `PE123456789`, P.O. Box services and office records; these are not postcode assignments. With no valid postcode search key, there is no assignment denominator or postal Polygon/MultiPolygon that can satisfy M2.

## Scope, evidence and the Bolivia M2 definition

The review covers ISO `BO` and preserves postcode, shipment tracking, P.O. Box, street, rural route, office, department, province, municipality, locality, address, building and AGID identity as separate authorities. The country target is `M2_current_agbc_postcode_assignment_and_area_visualization`.

M2 requires a future current authoritative AGBC or competent public release establishing a postcode system and a complete finite denominator of every assignment, alias, validity interval, correction, exception and explicit non-area object. Exact bytes, SHA-256, edition, coverage and rights compatible with processing, storage, derivation, redistribution and public serving are mandatory. Every drawable code must map to fixed real valid Polygon/MultiPolygon geometry with explicit official/derived/virtual class, source, reference date, CRS, topology, method, confidence and exceptions. Administrative areas, offices, routes, service areas, addresses, buildings, parcels, Points, buffers, hulls, Voronoi/raster cells, models and AGID cells are prohibited proxies.

The immutable artifact must drive the real BO API and app: handle no-code/no-match, loading, multiple, API-failure and invalid-geometry states; fit and render a translucent fill with a clear outline only for eligible geometry; support clear and re-search; and show the selected code, geometry kind, class, source, reference date and confidence. P.O. Box, route, organization, Point and other non-area objects must show type and reason without a fabricated surface. The current absence of postcodes is represented as `none`; it does not itself complete the area-visualization milestone.

## Official postal evidence - no search key exists

The one-page UPU Bolivia addressing sheet is edition `2/2026`. Its home-delivery example uses street plus house number, locality and country. Its P.O. Box example uses `Casilla Postal 3515`; this is a box identifier. Its rural example uses sub-localities and descriptive directions. None contains a postcode line. The sheet identifies Agencia Boliviana de Correos and its current official website.

The current 12-page UPU General Addressing Issues publication says some countries have no postcode system or do not use it. Physical page 4, Universal DataBase `Sep. 2025`, explicitly includes Bolivia in the list of countries which do not require postal codes. Bolivia does not appear in the current countries-requiring-codes list. This is the controlling current no-postcode finding; it must be rechecked when AGBC or UPU announces a system change.

## Current AGBC portal - tracking, boxes and offices are separate objects

The AGBC home API labels `PE123456789` as `Codigo de seguimiento` and uses it to track a shipment. The same fixed body exposes the `Casillas` service and nine office records. Only the aggregate count was retained; office addresses and contact details remain in the temporary source directory and were not copied into Git. Neither a shipment identifier, a box number, an office label nor a department abbreviation is a postcode assignment or area key.

The reviewed portal footer says `© 2026 Correos de Bolivia. Todos los derechos reservados.` Its `Terminos y Condiciones` item points to `#`, so the reviewed bodies expose no published terms target and no open postal dataset licence. Public viewing was not treated as permission for AGID processing, derivation, redistribution or public serving.

## Exact-source and geometry review

Nine exact AGBC, UPU and ArcGIS bodies totaling 1,421,915 bytes were fixed outside Git with URL, length and SHA-256. They comprise AGBC home and contact HTML, its exact home API JSON, the Nuxt page chunk used to discover that API, two UPU PDFs, and three ArcGIS metadata bodies. No office/address row, feature row, recipient, customer, P.O. Box holder, parcel, building, coordinate or geometry was queried or copied.

An ArcGIS search result titled `CodigoPostal` is an explicit false positive. Its Polygon layer uses EPSG:3116, the Colombian projected CRS, and the item WGS84 extent is longitude -75.634102 to -75.588543 and latitude 6.113133 to 6.163226, outside Bolivia. The item was created in 2019, its licence and access-information fields are empty, and no feature row was queried. It was not promoted.

No official or rights-cleared BO postcode Polygon/MultiPolygon exists because no current Bolivia postcode assignment exists. No department, province, municipality, locality, office, route, service area, address, building, parcel, Point, buffer, hull, Voronoi/raster surface, model, AGID cell or foreign Polygon was relabelled as a postal area.

## Reproducibility and application boundary

The offline inspector accepts only the nine expected filenames, lengths and SHA-256 values. It checks AGBC HTML and JavaScript markers, JSON structure and tracking/box/office/rights semantics; both exact UPU PDFs and relevant page markers; and ArcGIS item, service, CRS, extent, Polygon type, field and empty-rights metadata. Missing, renamed, extra, changed or semantically drifted inputs fail closed.

Poppler rendered the UPU Bolivia page to a non-empty 1275x1650 RGB PNG with SHA-256 `205cd9f69e54bc1aa2927025faeb5c01bf9818c704bc053d880ec847dfcfff82`, and physical page 4 of General Addressing Issues to a non-empty 1241x1754 RGB PNG with SHA-256 `16192d1a73cc7ff9734c124088b96e4a6c1145e3aa83078e58aa934d5cca3ec6`. The local image-view helper returned Windows error 206 even through a short mapped path; exact bytes, extracted page text, page counts, dimensions, non-white bounds and render digests were still verified. No chart was produced because plotting zero postcode assignments or zero eligible geometry would imply a measurable postal-area dataset that does not exist.

Shared deterministic tests cover normalization, Polygon/MultiPolygon-only drawing, no-match, loading, multiple, API failure, invalid geometry, bounds fit, translucent fill, visible outline, Point/non-area handling, clear and re-search. They prove the shared fail-closed capability, not a real BO route. With no valid BO postcode input or eligible immutable area artifact, no BO production API, map rendering or browser E2E is claimed.

## Limitations and promotion risks

- The current UPU evidence establishes that Bolivia does not require postcodes; it does not authorize a placeholder code or postal surface.
- The AGBC portal distinguishes shipment tracking and P.O. Box service objects but does not publish a postcode assignment or geometry dataset.
- The generic BO M0 address-format inventory contains an optional postcode placeholder. It is not authority evidence and must not be used to accept or display a fabricated domestic code.
- Copyright and public website access do not establish reusable data rights.
- The ArcGIS candidate is Colombian, geographically outside Bolivia and has empty licence metadata.
- No real BO browser E2E can run until a future authoritative immutable assignment-and-geometry artifact exists.

## Recommended next step

Keep BO blocked and continue to Caribbean Netherlands (`BQ`). Re-check no earlier than `2026-09-07T12:44:51.745Z`, and only after the pending-country sweep, unless AGBC or UPU announces a Bolivia postcode system. Any provider contact, registration, authentication, agreement, payment, protected-row access, new destination, publication or deployment requires explicit approval.

## Further questions

- Will AGBC introduce and publish a dated national postcode assignment release?
- If introduced, what licence permits processing, derived artifacts, redistribution and public serving?
- Which future postal objects are areas, and which remain P.O. Box, route, organization or Point objects?
- Will an operator-authorized fixed Polygon/MultiPolygon release accompany the assignments?
