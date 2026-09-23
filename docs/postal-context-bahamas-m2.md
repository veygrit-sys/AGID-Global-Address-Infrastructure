# Bahamas Postal Context M2 review

Reviewed: 2026-08-31T14:59:26.917Z

Decision: **blocked / M2 unmet**

Target: M2_current_bahamas_postcode_assignment_and_area_visualization

## Outcome

The Bahamas does not currently apply a postcode system. The UPU Bahamas country sheet dated October 2025 says that the country also has no home-delivery system: mail is dispatched through Post Office Boxes, and Poste Restante is available when a person has no box. The sheet defines post-office abbreviations such as GT, N, FX, F and AB and shows P.O. Box GT 2001. These elements route a box or identify an office; none is a postcode or postal-area key.

The UPU General Addressing Issues body was produced in August 2026 and its September 2025 table explicitly lists Bahamas among countries that do not require postal codes. The current Bahamas Ministry of Transport page identifies the Post Office Department as an agency under ministry oversight. A government-hosted historical rate book independently describes Nassau-Freeport high-speed mail as delivery through the post-office-box system rather than hand delivery. It is supporting operational context, not a current data release.

M2 therefore cannot be achieved by a syntactically invented ZIP, by a P.O. Box number, by a post-office abbreviation, or merely by proving absence. M2 still requires a real current assignment denominator and an eligible area artifact.

## Area and app gate

No official, derived or virtual rights-cleared BS postcode Polygon/MultiPolygon artifact exists in the reviewed evidence because there is no current postcode assignment to anchor one. Island, planning, electoral, local-government or administrative boundaries; island abbreviations; localities; post offices; routes; P.O. Boxes; Poste Restante; addresses; buildings; parcels; Points; buffers; hulls; Voronoi/raster cells; models and AGID cells are not postal areas and were not promoted.

Consequently the real BS application path is deliberately disabled. There is no valid BS postcode input or eligible BS postal geometry for the API to return, fit or draw with a translucent fill and clear outline. Loading, no-match, multiple, API-failure, invalid-geometry, clear and re-search behavior exists in the shared app capability, but shared code and synthetic fixtures are not BS M2 evidence. Browser E2E was not run because it would test shared or synthetic behavior rather than an approved real BS artifact.

## Rights boundary

The UPU disclaimer permits use or reproduction of website information subject to specific terms and acknowledgement of the UPU as source. Its copyright page also reserves reproduction and restricts external duplication of database documents. These pages are not a bulk postcode or geometry licence. The reviewed Bahamas ministry page and government-hosted rate book publish reference information but no resource-specific current assignment/geometry dataset or compatible AGID processing, derivation, redistribution and public-serving permission.

No provider was contacted, no registration or authentication was attempted, no terms or contract were accepted, no payment was made and no protected address, recipient, customer, P.O.-Box holder, delivery, property, cadastral or land-right row was queried.

## Fixed evidence

Six official/public bodies were downloaded to an isolated temporary directory, checked byte-for-byte and by SHA-256, and excluded from Git:

| Source | Edition | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| [Bahamas Ministry of Transport](https://www.transportbah.com/) | current page fixed 2026-08-31 | 682366 | 302e6d2b51ac159d383d2946ebec4b02fdb5e86ea5f548de186484fd7c84e04c |
| [UPU copyright](https://www.upu.int/en/Copyright) | fixed 2026-08-31 | 93705 | 440904a9d5e8ec8c51dfde9c783eca62188f0aa5b053c6a8102b9d5dc89c15e9 |
| [UPU disclaimer](https://www.upu.int/en/disclaimer) | fixed 2026-08-31 | 94341 | 94f2940ff79617e53a879a64a22d73f70f9632dd76ee0fdd9336c62be25eacee |
| [UPU Bahamas addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/bhsEn.pdf) | 10/2025 | 210984 | 499818cf3672d401f7fc563e9a1a085af79b2de64e04ec5325c1063b27601831 |
| [UPU General Addressing Issues](https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf) | Aug. 2026 body / Sep. 2025 no-code table | 631050 | ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d |
| [Bahamas Postal Rate Book](https://cdn.bahamas.gov.bs/tenant/tenantpostalservice/documents/All%20Documents/PostalRateBook-3-20240426071002.pdf) | historical scanned government copy | 1198185 | 6046cc1e5ff8e44def24d0fb8a114dbaf21a55da32f44eebbc7b3794811620a4 |

The three PDFs contain 36 physical pages. Four relevant pages were rendered to non-empty RGB PNGs; page counts, text markers, dimensions, non-white bounds and render SHA-256 values were validated. The local image helper returned Windows error 206 even through a short C:\tmp path. Web screenshot references were returned for the three UPU pages, while the rate-book page had a cache miss. No source PDF, source HTML or rendered image is committed.

## Unblock condition and next review

A competent Bahamas authority must first put a postcode system into force and publish a current, complete, finite, version-pinned denominator of assignments, aliases, validity intervals, corrections, exceptions and typed non-area objects under written rights compatible with AGID processing, storage, derivation, redistribution and public serving. Every drawable assignment must then reconcile to a fixed, reproducible and rights-cleared Polygon/MultiPolygon artifact with authority, official/derived/virtual class, reference date, CRS, topology, method, confidence and exceptions. P.O. Boxes, Poste Restante, offices, routes, organizations and Points remain non-area unless authoritative area geometry exists. The real BS loader, API, UI metadata states and browser rendering must all pass.

Do not recheck before 2026-09-07T14:59:26.917Z, and then only after the pending-country sweep or if the Bahamas Post Office Department or UPU announces an in-force postcode release.
