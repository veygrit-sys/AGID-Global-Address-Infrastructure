# Sweden Postal Context M2 evidence

## Decision

Sweden (SE) remains **blocked / M2 unmet** under `M2_current_sweden_five_digit_assignment_and_area_visualization` as of 2026-08-31T00:16:38.482Z. The source-of-truth status command selected SE with no country in progress; no second country was started.

The outcome is narrower than “five-digit postcode surfaces exist.” Postnummerservice advertises such a product, but M2 also requires an exact current delivery, a complete assignment and endpoint-exception denominator, compatible processing/storage/derivation/redistribution/public-serving permission, and the real AGID API/application path. Those gates are not met.

## Exact M2 definition

A current complete five-digit Swedish postcode assignment and explicit delivery/endpoint exception denominator and corresponding valid Polygon/MultiPolygon coverage must be usable under explicit reviewed AGID processing, storage, derivation, redistribution and public-serving permission. The approved immutable artifact must pin provider, product, edition, reference date, licence, attribution, byte length, SHA-256, schema, source CRS, reviewed transform, topology, coverage, gaps, conflicts and exceptions.

Any surface derived from complete address membership is labelled `derived` and noncanonical. The real SE API/app must normalize `NNN NN` to five text digits, return only valid real areas, fit the map, render a translucent fill with a clear outline, and expose selected code, geometry kind, official/derived/virtual class, source, reference date and confidence. Poste-restante, P.O.-box, reply/freepost, competition-mail, large-customer, organization, route, point, unmatched and other non-area records remain explicit.

Address Points, municipal/administrative boundaries, buildings/parcels, download envelopes, buffers, hulls, Voronoi/raster cells and synthetic fixtures cannot satisfy M2.

## Authority and data-quality findings

| Gate | Source-backed observation | M2 effect |
|---|---|---|
| Purpose and governance | PTS says postcodes exist only to route mail, need not follow districts, municipalities or counties, and are administered by appointed PostNord. | Establishes postal authority and a required separation from administrative geography, not a perimeter. |
| Current system and exceptions | PostNord's current lookup/change guidance is indexed. The PTS-linked system fact sheet distinguishes ordinary delivery codes from poste-restante, P.O.-box, reply/freepost, competition-mail and large-customer codes; large-customer codes do not specify exact geographic location. Standard GET returned Cloudflare 403, and no bypass was attempted. | A five-digit label or endpoint code is not automatically an area; the exact current exception denominator was not fixed. |
| Current provider statistics | Postnummerservice advertises weekly updates and approximately 17,000 postcodes, 1,743 post towns and 10,500 deliverable postcodes. | Aggregate, approximate product metrics are not exact assignment rows, exceptions or coverage. |
| Five-digit surface product | An indexed 2026 Postnummerservice price document identifies Swedish five-digit postcode surfaces. The exact asset now redirects with HTTP 301 to the general postcode page; no product was purchased or delivered. | A real area product is advertised, but its exact edition, method, CRS, topology, coverage, exceptions, bytes and digest were not inspected. |
| Commercial rights | Current purchase terms grant use within the organization and prohibit resale and sublicensing. | No compatible AGID redistribution or public-serving permission is established. |
| Official address data | Lantmäteriet advertises municipality-partitioned addresses with postcode/post town, GML, EPSG:3006/4258 and half-year updates. Ordering yields a login and requires legal-purpose review and special terms. | No application or approval was made; the product is address-object grain. |
| Address geometry | The reviewed INSPIRE example encodes an entrance `gml:Point`. The current address specification says municipalities maintain addresses and PostNord establishes postcode/post town, normally within 14 days or 30 days for new areas. | Address authority and assignment evidence do not create Polygon/MultiPolygon postal coverage. |
| Geometry | 0 authorized fixed postal geometry artifacts and 0 Polygon/MultiPolygon features were validated. | The real SE API/map area path cannot be claimed. |

The intended M2 grain is one current five-digit assignment or reasoned delivery/endpoint exception reconciled to a valid area or explicit non-area. Postnummerservice's public counts are aggregate grain, Lantmäteriet is address-object/Point grain, and the commercial surface delivery was not acquired. Substituting any of them without the complete denominator and compatible rights would create false coverage.

## Evidence integrity

Nine exact PTS, Postnummerservice and Lantmäteriet bodies total 910,512 bytes and are bound by byte length and SHA-256 in `reports/postal-context-m2/se-source-review-2026-08-31.json`. Raw HTML/PDF bodies, rendered pages, address rows and geometry are not committed.

Three Lantmäteriet PDFs were fixed and checked: valuable-personal-data terms version 1.1 dated 2025-03-04 (3 pages), technical address download description version 1.2 (6 pages), and address exchange specification version 2.0 published 2024-06-05 (44 pages). PDF signatures, metadata, representative-page text and exact digests were checked. Poppler rendered terms pages 1-2, technical pages 1 and 5, and specification pages 1, 9 and 21. Poppler reported missing display fonts for some legacy fonts and the local image viewer failed with Windows error 206, so visual image-viewer verification is not claimed.

Primary/provider references:

- PTS postcode governance: https://pts.se/post/postnummer/
- PostNord postcode and address lookup: https://www.postnord.se/vara-verktyg/sok-postnummer-och-adress
- PostNord/Postnummerrådet system fact sheet: https://www.postnord.se/siteassets/pdf/faktablad/postnummersystemet-i-sverige-171213.pdf
- Postnummerservice current service description: https://postnummerservice.se/sv/om-oss
- Postnummerservice postcode statistics: https://postnummerservice.se/sv/information/postnummer
- Postnummerservice purchase terms: https://postnummerservice.se/sv/information/kopvillkor
- Postnummerservice five-digit surface product: https://postnummerservice.se/sv/shop/postnummerytor-5
- Lantmäteriet address download product: https://www.lantmateriet.se/sv/geodata/vara-produkter/produktlista/belagenhetsadress-nedladdning-inspire/
- Lantmäteriet valuable-personal-data terms: https://www.lantmateriet.se/globalassets/geodata/geodataprodukter/anvandningsvillkor_for_vardefulla_datamangder_pu.pdf
- Lantmäteriet address technical description: https://www.lantmateriet.se/globalassets/geodata/geodatatjanster/tb_belagenhetsadress_nedladdning_inspire_v1.2_1.2.pdf
- Lantmäteriet address exchange specification: https://www.lantmateriet.se/globalassets/om-lantmateriet/var-samverkan-med-andra/byggnad-adress-lagenhet/informationsspecifikation-utbyte-belagenhetsadress.pdf

## Application status

Existing shared contracts continue to require Polygon/MultiPolygon-only draw, bounds fit, translucent fill, visible outline, clear and re-search behavior, explicit loading/no-match/multiple/API-failure/invalid-geometry states and visible provenance. No approved fixed SE area artifact exists, so no real SE loader/API response, map fit/rendering or browser E2E is claimed. Commercial listings, address Points, municipal envelopes and inferred or synthetic geometry were not substituted.

Postal Code → Polygon → Address Context authority separation remains intact. Postal assignment does not authorize building display; an exact building requires a separate rights-cleared source and explicit address-to-building relation.

## Unblock and retry

Unblock only after explicit approval permits acquisition or provider coordination and an exact current assignment/endpoint-exception denominator plus five-digit surface delivery can be fixed under compatible rights. Pin product, edition, date, licence, attribution, bytes, digest, schema, CRS, transform, method, coverage and exclusions; validate every geometry, topology, gap, conflict and non-area; then build an immutable artifact and pass the real SE API/application path.

Do not contact a provider, register, authenticate, submit an application, accept terms or a contract, query protected address/property data, purchase, create a publication destination, publish or deploy without explicit approval. Do not retry before 2026-09-07T00:16:38.482Z while pending countries remain unless a compatible fixed authoritative delivery or written permission appears.

A chart is intentionally omitted: the exact gate table communicates the decisive licensing, grain and zero-validated-area findings without turning approximate provider counts into false completeness.
