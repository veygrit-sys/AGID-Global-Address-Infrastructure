# Ecuador (EC) Postal Context M2 review

Observed: 2026-09-01T00:34:11.103Z

Result: `blocked` / M2 unmet

Definition: `M2_current_mintel_assignment_and_postal_area_visualization`

## Outcome

Ecuador has an official six-digit postal-zone system and a working official area lookup. The fixed response for the official example `180204` contains one closed MultiPolygon with 227 coordinate pairs, and the official client fetches the same-origin response, draws it and fits the map. This is useful direct evidence, but it is one live observation rather than a current complete immutable national release. The response carries only postcode, province, WKT and centroid fields; it does not publish validity, alias, correction, supersession, typed non-area exceptions, producer lineage, edition, reference date, CRS, method, confidence or reusable-rights metadata.

Resolution ARCP-DE-2020-26 declares the national postcode list, locality list, thematic maps and vector postal-polygon file public. Article 3 nevertheless requires interested natural or legal persons to accept the annexed use agreement and comply with its conditions, and Article 4 requires safeguards before download. The fixed official PDF has five pages and omits Annex 1. No agreement was reviewed or accepted, no registration or provider contact occurred, and no vector artifact was downloaded. Those actions require explicit approval.

The 2015 technical standard is marked vigente and defines six digits as province, planning district and postal zone. Its historical 1,225-zone description is not treated as a current denominator because the same standard permits codes to change after geographic or demographic updates and assigns changes after technical review.

## Fixed evidence and quality

Nine official HTML, JavaScript, JSON and PDF bodies total 667,199 bytes and are pinned by exact byte count and SHA-256 in `reports/postal-context-m2/ec-source-review-2026-09-01.json`. The reproducible inspector validates the exact set, client behavior markers, PDF signatures/page counts/text markers, official-example schema, MultiPolygon kind, finite in-country positions, ring closure, coordinate-pair count and bounding-box aggregate. It emits no source rows or geometry.

The official site's cartography notice says its source cartography was adjusted for postal purposes, is referential and is unsuitable for precision projects. GeoServer capabilities probes returned HTTP 503 while the PHP lookup worked; no bulk crawl was attempted. A single fixed example cannot establish complete assignment or geometry coverage.

## Authority and application boundary

Zero records are production-eligible. No province, planning district, circuit, parish, census sector, locality, address, office, route, P.O. box, organization, parcel, building, Point, buffer, hull, Voronoi/raster cell, AGID cell, interpolation/model surface or synthetic `999999` fixture was promoted. Postal Code → Polygon → Address Context authority remains separated; postcode containment never establishes a building, occupant, customer, property or land-right relation.

The official client proves search-to-area fit/draw capability but does not expose the required AGID loading, no-match, multiple-candidate, API-failure and invalid-geometry distinctions or the required classification/provenance metadata. Shared AGID normalization, API, Polygon/MultiPolygon draw/fit, translucent fill, clear outline, clear and re-search contracts are tested, but no real EC artifact feeds them. Real EC API/app visualization and browser E2E are therefore not claimed. A separate data app was not built because there are no eligible EC production records to visualize.

## Unblock and retry

Obtain a current complete competent-authority denominator and corresponding vector artifact, including every assignment, alias, validity interval, correction, supersession, exception and typed area/non-area object. Fix release identity, schema, coverage, retrieval time, exact bytes and SHA-256; review the complete use agreement and establish rights compatible with AGID processing, storage, derivation, redistribution and public serving; and reconcile each drawable code to valid finite closed real Polygon/MultiPolygon geometry with authority, official/derived/virtual class, source, edition, reference date, CRS, method, confidence and exceptions. Then build and verify the real EC loader, API and application path.

Do not retry before `2026-09-08T00:34:11.103Z` while pending countries remain, unless MINTEL or its competent successor publishes an ungated eligible release or complete compatible terms. Provider contact, registration, authentication, agreement acceptance, protected download, payment, destination creation, publication and deployment require explicit approval.
