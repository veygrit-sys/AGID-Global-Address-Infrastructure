# Croatia Postal Context M2 review

## Technical summary: Croatia remains blocked

Croatia does not meet Postal Context M2 as reviewed on 30 August 2026. Hrvatska pošta exposes current Excel/XML assignment downloads, but its [legal notice](https://www.posta.hr/pravne-napomene) does not permit AGID redistribution without express consent. The [DGU Spatial Unit Register](https://dgu.gov.hr/registar-prostornih-jedinica-172/172) confirms that official graphical delivery-office areas exist, but delivery is by request, subject to pricing and use conditions, and no versioned operator-office-to-DGU identifier crosswalk was available. No consent, request, payment, authenticated query or contract acceptance was performed.

The reusable [Eurostat TERCET 2025 HR crosswalk](https://gisco-services.ec.europa.eu/tercet/NUTS-2024/pc2025_HR_NUTS-2024_v1.0.zip) contains 667 distinct valid five-digit codes after removing its single-quote text wrapper. It has only `NUTS3` and `CODE` columns, no coordinates and no Polygon/MultiPolygon. Eurostat's methodology attributes zero HR rows to a member-state postal dataset, so this crosswalk is not a current Hrvatska pošta assignment denominator. No real HR postal area was loaded, served or rendered.

## Official evidence leaves no reusable real postcode area

| Source | Exact observation | M2 implication |
| --- | --- | --- |
| [Hrvatska pošta downloads](https://www.posta.hr/preuzimanje-podataka-o-postanskim-uredima-6543/6543) | The page lists Excel/XML settlement, office, Zagreb street and parcel-locker files. No polygon release appears. | Current operator material exists, but the related legal notice blocks copying or redistribution without express consent. The files were not downloaded. |
| [Hrvatska pošta legal notice](https://www.posta.hr/pravne-napomene) | Site content is restricted to private, non-commercial and individual use; copying, modification, transmission and distribution require express consent. | Product-specific AGID reuse and redistribution permission is not established. |
| [DGU Spatial Unit Register](https://dgu.gov.hr/registar-prostornih-jedinica-172/172) | The 3 August 2026 reference page includes delivery-office areas in a graphical HTRS96/TM register delivered as SHP, with list data as XML. Use is request- and price-controlled. | A real government area source exists, but neither a reusable release nor the required explicit operator-office identifier crosswalk was obtained. |
| [DGU Geoportal services](https://geoportal.dgu.hr/cms/podaci-i-servisi/) | Anonymous INSPIRE Address and Administrative Unit ATOM feeds are listed; delivery-office areas are not exposed as an anonymous postal polygon release. | Address and administrative geometry cannot be relabelled as postal membership. No feature rows were queried. |
| [GISCO postal codes](https://ec.europa.eu/eurostat/web/gisco/geodata/administrative-units/postal-codes) | CC BY-SA 4.0 point data excludes non-geographic codes and may contain omissions or mislocations. | A point or NUTS match cannot become a Hrvatska pošta or DGU perimeter. |
| [TERCET methodology V4](https://gisco-services.ec.europa.eu/tercet/NUTS-2024/2025-GISCO-NUTS2024-PC2025-MET-NOTES-V4.0.pdf) | HR has 0 member-state postal rows, 289 address-derived rows, 24 GeoNames rows, 0 GISCO-2020 rows and 354 manually located/geocoded rows, totaling 667. | The total reconciles to the CSV but does not prove operator completeness or geometry. |

The review did not use a chart because an exact authority/geometry matrix is clearer than a quantitative chart for this binary gate, and there is no lawful spatial surface to map.

## M2 means a current assignment plus an auditable real surface

The unit under review is one current Hrvatska pošta five-digit assignment and its real area. Croatia's country-specific M2 definition requires a rights-cleared nationwide operator denominator plus either:

- a DGU delivery-office-area Polygon/MultiPolygon connected by an explicit, versioned operator-office-to-DGU identifier crosswalk; or
- a rights-cleared postcode-membership-derived surface retaining every member, exclusion, method, validity and uncertainty.

The selected release must pin edition, reference date, coverage, non-geographic exceptions, CRS, rights, attribution, bytes and SHA-256, be published as an approved immutable artifact, and pass the real HR loader, API and application path. Operator downloads without a reuse grant, request-priced DGU data without approved rights and a crosswalk, GISCO/GeoNames points, NUTS or administrative polygons, address/building/parcel layers, buffers, Voronoi cells and synthetic fixtures do not meet the definition.

## The public 667-row crosswalk is clean but insufficient

The raw CSV stores text values as single-quoted strings. The reproducible audit strips only the outer quote from `CODE`, keeps the result as text, and evaluates one row as one `NUTS3`-to-postcode match.

| Quality dimension | Exact result | Risk and interpretation |
| --- | --- | --- |
| Volume and shape | 667 rows; columns `NUTS3`, `CODE`; 21 distinct NUTS3 values | No coordinate or geometry column exists. |
| Uniqueness | 667 distinct normalized codes; 0 duplicate rows; 0 duplicate codes | Internal uniqueness passes for the crosswalk grain. |
| Validity | 667/667 codes are exactly five digits after quote removal; 0 blank or invalid codes | Syntax is valid but does not establish current assignment. |
| Consistency | 667 CSV rows equal 289 address + 24 GeoNames + 354 manual rows in methodology V4 | The artifact reconciles internally; its source mix is not operator authority. |
| Completeness | No Hrvatska pošta nationwide denominator was lawfully acquired | The rate cannot be measured against the operator universe. This is critical for M2. |
| Geometry | 0 Polygon/MultiPolygon; 0 eligible records out of 667 reviewed codes | The real API/app area path cannot be exercised. |
| Timeliness | Reference year 2025; methodology dated 9 March 2026; corrections on 19 June 2026; DGU page dated 3 August 2026 | The references are current enough for a blocker review, not for an operator-complete M2 claim. |

The exact ZIP, CSV, PDF and page digests are stored in `reports/postal-context-m2/hr-source-review-2026-08-30.json`. Raw downloads, crosswalk rows and source captures are not committed.

## Postal, geometry and address authority remain separate

Hrvatska pošta controls postcode-to-destination-office assignment. DGU controls the delivery-office-area register and other official spatial units. Eurostat provides official-derived statistical correspondence and point evidence. DGU addresses, buildings, parcels and administrative units have separate identities and purposes. None of these sources alone proves postcode membership, deliverability, an exact address-building link, ownership or occupancy.

The audit created zero point buffers, Voronoi cells, administrative proxies, parcel/building dissolves or invented route, PO-box and organization areas. It queried no address, building, cadastral or land-right rows and committed no raw source data.

## The application path remains capability-only

Shared deterministic tests verify that AGID accepts only Polygon/MultiPolygon for area display, validates geometry, fits bounds, renders a translucent fill and visible outline, exposes loading/no-match/multiple/API-failure/invalid-geometry states, shows selected code/type/classification/source/date/confidence, clears and re-searches. Croatia's existing synthetic fixture tests continue to validate normalization and API contracts without promotion.

Those tests do not prove a real Croatian area exists. No real HR loader, API geometry response, map fit or translucent area was verified, and browser E2E is intentionally not claimed.

## Limitations and robustness checks

- The operator files were not downloaded because doing so would not establish redistribution rights and could imply acceptance beyond this review.
- The DGU register release was not requested or purchased. Its page proves existence and delivery conditions, not the bytes, schema or licence of a specific release.
- The TERCET count is descriptive evidence for a public crosswalk, not an estimate of operator completeness.
- PDF pages 3 and 4 were rendered and visually reconciled with extracted text. The HR row and table headers were legible without clipping or overlap.
- No legal conclusion is claimed; the M2 decision is a conservative engineering and publication gate.

## Recommended next step

Do not request or pay for DGU data, accept Hrvatska pošta terms, seek operator consent, authenticate, query address/cadastral/land rows, create a publication destination, publish or deploy without explicit approval. After pending countries and 6 September 2026 at 09:42 UTC, recheck for an unrestricted current operator assignment release and a reusable delivery-office-area release with an explicit identifier crosswalk. Resume sooner only if such public rights-cleared releases appear.

## Further questions

The decisive questions are whether Hrvatska pošta will grant reusable nationwide assignment rights and whether DGU will release delivery-office-area geometry with public derivative/serving rights and stable identifiers that support an explicit operator crosswalk. Until those answers and the real API/app path pass, M2 remains unmet.
