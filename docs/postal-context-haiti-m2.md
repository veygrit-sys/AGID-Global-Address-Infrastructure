# Haiti Postal Context M2 review

## Technical summary - M2 remains blocked

Haiti has a current integral six-character `HTNNNN` postcode system. The August 2026 UPU General Addressing Issues tables establish required use, length six and alphanumeric format `HT9999`; the September 2017 Haiti country sheet says the `HT` prefix is part of the postcode even for domestic mail and documents its four-level digit hierarchy. Neither publication supplies a complete current assignment denominator, reusable postal geometry or compatible AGID public-serving rights, so HT remains at `M1_metadata` and is `blocked`.

## Current denominator and M2 definition

The country-specific target is `M2_current_office_des_postes_haiti_htnnnn_postal_area_visualization`. It requires a complete current typed HTNNNN assignment and exception denominator, compatible processing/derivation/redistribution/public-serving rights, reproducible fixed artifacts and valid real Polygon/MultiPolygon geometry for every drawable code. The 42 district examples in the 2017 UPU sheet, including `HT6110 PORT-AU-PRINCE`, are examples and hierarchy evidence rather than a current complete assignment or polygon release.

## Operator, geospatial discovery and rights

Current UPU evidence identifies Office des Postes d'Haiti as the designated operator. Its current UPU-listed `postehaiti.gouv.ht` domain did not resolve during review. The UPU-linked legacy postcode route redirects to `https://laposte.gouv.ht/codes.php` and returns HTTP 404. The active legacy WordPress site exposed 14 pages and three posts, while exact searches for postcode, licence, privacy/confidentiality and open-data terms returned zero results. No complete current assignment, resource-level reuse licence or postal geometry was located.

CNIGS is the national geospatial reference authority and documents administrative-boundary, toponymy and reference-geodata responsibilities. Its HaitiData page describes a GeoNode open-data platform, but the current HaitiData application states that the open-data platform is under improvement and will return later; no operational catalogue/API, postal layer, resource-level licence or competent-authority postcode crosswalk was found. IHSI's six-digit legal territorial code and 509-page 2024 administrative publication remain separate administrative context and were not relabelled as HTNNNN.

The UPU POST*CODE 2026.1 licence package contains nine contract/NDA/declaration/rates/general-condition documents. No terms were accepted, no payment was made and no protected content was accessed. The product is not a postal Polygon/MultiPolygon release.

## Fixed-source and PDF verification

Twenty-two exact official bodies totalling 35,633,074 bytes are fixed by byte count and SHA-256 in `scripts/inspect-postal-context-ht-sources.py`. The fail-closed inspector validates the current UPU tables, September 2017 Haiti sheet, May 2026 designated-operator evidence, Office site and searches, CNIGS/HaitiData state, IHSI administrative evidence and nine-file UPU licence bundle. It emits aggregate receipts only; raw pages, PDFs, extracted text and responses remain temporary and outside Git.

The Haiti country page and the three relevant current UPU table pages were rendered deterministically. All four renders were displayed and visually inspected: the country page showed the integral `HT` prefix, digit hierarchy, district examples and `09/2017`; current pages showed Haiti in scope, total length six and `HT9999 A/N`.

## Running-app visual inspection

The isolated app ran at `http://127.0.0.1:3013/`. The in-app Browser setup failed before navigation because Windows deny-read ACL setup failed. Playwright Chromium opened the real app, entered `HT 6110` and returned 12 results, including two Haiti candidates for 6e Turgeau/Port-au-Prince. Even after selecting the Haiti candidate, the app retained the first `6110` result in Southern River, Western Australia and displayed an AU AGID/address card. The fixed screenshot (297,417 bytes; SHA-256 `c1b30883cd426da91f9bab2a19183a5290a46a2845192360d29ec3872c6f0c8a`) was displayed and visually inspected.

No HT Postal Context request, unavailable notice, translucent postal fill, clear postal outline or postal geometry/source/date/confidence appeared. Direct `GET /api/v1/postal/HT/HT6110?geometry=geojson` returned HTTP `503` with `Postal Context pack is unavailable`. The ordinary background map, AGID grid and Australian selection are explicit non-postal evidence and were not promoted.

## Required next step

Keep HT blocked. Re-check no earlier than `2026-12-01T08:40:22.648Z`, after pending countries have been swept, unless Office des Postes d'Haiti or another competent authority publishes a current complete rights-cleared typed assignment and postal-area artifact. Provider contact, registration, authentication, terms acceptance, contract, payment, protected-data access, new destination, publication or deployment needs explicit approval.
