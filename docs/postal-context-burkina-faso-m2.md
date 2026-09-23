# Burkina Faso Postal Context M2 review

## Result — current five-digit system confirmed; M2 remains blocked

La Poste Burkina Faso's current public search and the UPU December 2021 addressing sheet confirm five-digit postcodes. Exact live references validated commune `10000 OUAGADOUGOU`, quartier `10010 CISSIN`, additional Ouagadougou quartier assignments and separate agency-style codes. The UPU general list saying Burkina Faso does not *require* postal codes is recorded as an international addressing caveat; it does not negate the operator's current system. BP/BV/poste restante numbers remain delivery objects, not postcodes.

The BF address metadata now follows the UPU line structure and keeps premise, thoroughfare, sub-locality, special-delivery/office reference, postcode and locality separate. The stale postcode portal URL now points to the current La Poste page. This improves address context but does not satisfy M2.

## Evidence, rights and reproducibility

Ten exact official bodies totaling 1,364,535 bytes were fixed outside Git with retrieval time, byte size and SHA-256: the La Poste page, FAQ, live search script and representative live responses; two UPU PDFs and the UPU copyright page; and the IGB administrative-map page. The offline inspector verifies the complete filename set, exact bytes/digests, HTML/JavaScript markers, PDF signatures/page counts, typed assignment examples and rights text. Missing, renamed, extra or changed bodies and marker drift fail closed. Raw bodies remain outside Git.

The La Poste page states all rights reserved, and the UPU terms restrict reproduction and database use. The reviewed bodies grant no compatible AGID licence for complete bulk extraction, storage, derivation, redistribution or public serving. No provider contact, registration, authentication, terms acceptance, contract, payment, protected-data access, publication or deployment was attempted.

## Geometry and AGID boundary

No reviewed source provides a complete postal Polygon/MultiPolygon artifact or an authoritative equivalence between a commune/quartier/agency result and an exact postal surface. IGB confirms official administrative map products, but administrative geometry is not postal geometry. Country, region, province, commune, quartier, village, agency, route, BP/BV, Point, buffer, hull, raster/Voronoi cell, AGID cell and synthetic BF planning geometry were not promoted.

Postal Code → Polygon → Address Context separation remains intact. The actual app can show a non-postal Ouagadougou result with BF AGID identity and detailed address context, but that ID is not a postal ID. Civic addresses and buildings require independent rights-cleared identities and explicit relations.

## Application verification

The isolated application was started. Search for `Ouagadougou, Burkina Faso` produced an actual BF result, AGID `BF01RP0JZ6JW`, French/international address views and map movement. The real BF postal API returned `404 Postal Context country is not supported`; the app also requested the nearest-postcode path and received 404. No postcode geometry metadata or translucent postal overlay appeared.

The in-app Browser failed before navigation at the Windows sandbox ACL helper. The deterministic Playwright fallback ran against the real app without mocking the BF postal API, captured the initial and searched states, verified two map canvases, no framework overlay, the AGID/context result and the absence of postal overlay metadata. Local image-viewing failed with Windows error 206, so no manual visual claim is made.

## Next step

Keep BF blocked until La Poste Burkina Faso or another competent authority publishes a complete immutable assignment/object/validity/exception denominator and real postal geometry under compatible rights. Continue the pending-country sweep with BI (Burundi); re-check BF no earlier than 2 December 2026 unless an official release appears sooner.
