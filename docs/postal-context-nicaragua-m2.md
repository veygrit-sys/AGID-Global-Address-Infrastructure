# Nicaragua Postal Context M2 review

NI remains M2-blocked. Current UPU primary material confirms that Nicaragua uses a numeric five-digit postcode and is therefore in the data-creation scope. It does not supply the current complete Correos de Nicaragua assignment denominator, compatible reuse/public-serving rights, or postcode Polygon/MultiPolygon geometry required by AGID.

## Country-specific M2 definition

`M2_current_correos_nicaragua_typed_postcode_assignments_and_postal_area_visualization` requires a current complete Correos de Nicaragua release of every five-digit assignment, alias, validity interval, correction, exception and typed area/non-area postal object, including an explicit distinction between barrio-or-comarca codes and municipality Código Maestro or other non-area objects. The denominator must be fixed by retrieval time, service or release version, stable identity, schema, coverage, exact bytes and SHA-256 under rights compatible with AGID processing, storage, derivation, redistribution and public serving. Current UPU evidence confirms that Nicaragua requires five numeric digits and the 2014 country sheet explains placement and examples, but those publications are not a current assignment denominator or geometry licence.

Every drawable code must reconcile to finite closed valid Polygon/MultiPolygon geometry with official/derived/virtual class, source feature identity, reference date, CRS, topology, reproducible method, confidence and exceptions. INETER national, departmental, municipal, community, cadastral and base-cartography layers, barrios, comarcas, localities, offices, routes, P.O. boxes, organizations, addresses, buildings, points, buffers, hulls, Voronoi/raster cells, AGID cells and models cannot replace missing postal geometry without an exact time-compatible competent-authority postcode crosswalk and compatible rights. Non-area objects must expose their type and reason without a fabricated surface.

An approved immutable artifact must drive the real NI API/app, normalize five digits, handle loading, no-match, multiple, API failure and invalid geometry, fit and render translucent fill with a clear outline only for eligible real geometry, support clear and re-search, and display selected code, geometry kind, official/derived/virtual class, source, reference date and confidence.

## Fixed primary evidence

- UPU General Addressing Issues, Universal DataBase August 2026: Nicaragua is on the list of countries requiring postcodes and its format is numeric `99999`.
- UPU Nicaragua country sheet edition `05/2014`: five digits appear before the municipality, with examples `12005` and `11147`. The dated sheet is syntax/placement evidence, not the current assignment denominator.
- Correos de Nicaragua postcode landing and `12012` detail URLs: both exact browser bodies were Cloudflare managed challenges. Their current operator content, bulk terms, assignments and geometry were not retrieved; search-index snippets were not promoted as source data.
- INETER political-administrative limits and geoservices pages: the two reviewed bodies contain no postal/postcode/código-postal dataset entry. Their national, departmental, municipal and other spatial services remain administrative/cartographic context, not postal geometry.
- UPU copyright page: written-permission and database-access restrictions are recorded; compatible AGID processing, storage, derivation, redistribution and public-serving rights are not established.

Seven exact bodies total 1,024,163 bytes. The fail-closed inspector binds every body to its URL, byte count and SHA-256, validates 13 PDF pages and required markers, and emits zero production records. Raw bodies, operator responses, addresses and geometry remain outside Git.

## App and visual result

The actual isolated app returned HTTP 200 at `http://127.0.0.1:3018/`. Direct unmocked `GET /api/v1/postal/NI/12012?geometry=geojson` returned HTTP 503 `Postal Context pack is unavailable`.

The in-app Browser failed before navigation while its Windows deny-read ACL sandbox initialized. Deterministic Playwright therefore queried `12012 Nicaragua` against the actual app without mocking the Postal Context API. A Nicaragua result was selected. The fixed screenshot was manually inspected through the app after the local-image helper failed with Windows error 206: the background map, AGID grid, road and NI address card were visible, while no translucent postal fill, clear postal outline, unavailable notice or postal source/date/confidence metadata was visible. No NI Postal Context browser request was observed. This is negative visual evidence, not a successful browser E2E.

## Decision and unblock condition

M2 is unmet. No geometry was invented and existing NI synthetic runtime fixtures remain M1 test material only. The block can be removed only when Correos de Nicaragua or another competent authority publishes or supplies a current complete typed assignment denominator and eligible postal-area/non-area artifact with compatible rights, fixed version and hashes, after which the real NI API and app must pass normalization, topology, state handling, fit, translucent fill/outline, clear and re-search verification.

Retry no earlier than `2026-12-01T17:00:01.381Z`, after pending countries have been swept. Contacting a provider, requesting data, registering, authenticating, accepting terms/licence/contract, paying, accessing protected data, creating a publication destination, publishing or deploying requires explicit approval.
