# Bosnia and Herzegovina Postal Context M2 review

## BA remains M2 blocked: official inventories are points, not areas

BA now has a country-specific target,
`M2_current_three_operator_assignment_and_postal_area_visualization`, but
remains **M2 blocked**. Twelve exact official references establish three
authorized public postal operators, a five-digit format and substantial
office/code inventories. They do not establish a current complete, versioned
three-operator assignment or reusable postal Polygon/MultiPolygon. Therefore
AGID cannot yet return a real BA area, fit the map and draw its translucent
fill and clear outline.

## Evidence and definitions

The Postal Traffic Agency registry identifies Hrvatska pošta Mostar, JP BH
Pošta Sarajevo and Pošte Srpske Banja Luka. The exact registry page was
retrieved only after TLS certificate verification failed for an expired
certificate; the bypass and SHA-256 are explicit. This is regulator/operator
identity evidence, not a data licence or postal perimeter.

The UPU physical page was visually reviewed against its pinned PDF bytes. Its
04/2019 sheet says five digits, with the first two a postal region and the last
three a post office. Examples include `71000`, `75411` and `75101`. A postal
region prefix and office code are routing semantics, not coordinates for a
full-code polygon.

| Reviewed official inventory | Rows/markers | Distinct codes | Area geometry |
| --- | ---: | ---: | ---: |
| JP BH Pošta network locator | 285 | 240 | 0 |
| BH PostExpress drop-off table | 468 | 461 | 0 |
| Pošte Srpske locator | 584 | 234 | 0 |

The 1,337 total observations overlap and cannot be summed into a national
coverage denominator. One BH Pošta marker lacks coordinates, while the Pošte
Srpske markers are all points. The drop-off table carries 258 `BA-BIH`, 200
`BA-SRP` and 10 `BA-BRC` labels, but labels do not prove operator completeness,
edition, validity or area boundaries. Hrvatska pošta Mostar's reviewed page
confirms operator identity only.

## Method and authority separation

A bounded inspector verifies every reviewed byte length, SHA-256, MIME,
content marker and the three structured locator/table profiles. Raw HTML and
PDF bodies stay outside Git. The FGU, SDI FBiH, Katastar.ba and RUGIPP pages
were inspected for administrative, cadastral, address and building context.
The exact Katastar service page enumerates administrative boundaries,
orthophotos, terrain, cadastral municipalities, parcels, land use and
buildings, not postal areas. The RUGIPP catalog API request timed out, so this
review does not claim an exhaustive catalog absence; its reviewed issuance
page describes fee/permission conditions.

No office point, two-digit postal region, locality, municipality,
administrative unit, cadastral area, parcel, building, route, buffer, Voronoi
surface, model or AGID cell is relabelled as a postcode area. Postal
containment cannot prove a house number or building. Those require a separate
permitted stable address/building relation.

## Rights, application status and limitations

The reviewed operator pages do not attach a complete dataset edition or an
explicit bulk/derivative/redistribution/API grant. FGU/SDI pages state all
rights reserved; the July 2026 SDI item documents licensing work, not a reuse
grant. RUGIPP describes fees/permissions. No login, contract, payment, new
repository, publication destination or deployment was used.

Shared deterministic application tests verify exact postcode candidate
resolution, Polygon/MultiPolygon-only drawing, explicit geometry opt-in,
bounds/fit, opacity-0.22 fill, opacity-0.95 width-3 outline, update/removal,
clear/re-search and error states. They do not load eligible BA geometry. A
browser E2E with a synthetic polygon would be misleading and is not claimed.

## Unblock path and further questions

Recheck after the pending-country pass and no earlier than
`2026-09-05T10:31:04.634Z`, unless the regulator or an operator publishes a
current rights-cleared release sooner. Authentication, terms acceptance,
payment or licence negotiation requires explicit approval.

M2 resumes when all relevant operator assignments have stable identity,
edition, validity, declared coverage and permitted reuse, plus exact official
areas or complete permitted address/road members for reproducible derivation.
After validation and approved immutable publication, verify the real BA loader,
API and app search, fit, translucent fill, outline, provenance, no-result,
multiple, invalid, failure, clear and re-search paths. Open questions are
whether the regulator can publish a consolidated versioned cross-operator
assignment, whether operators hold service-area geometry, and whether a public
derivative/API licence can be granted. Next is **BE (Belgium)**; no second
country was started.
