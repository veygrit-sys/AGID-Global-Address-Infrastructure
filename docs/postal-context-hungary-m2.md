# Hungary Postal Context M2 review

## Technical summary: Hungary remains blocked

Hungary does not meet Postal Context M2 as reviewed on 30 August 2026. [Magyar Posta Partner Extra](https://www.posta.hu/partnerextra) publishes a public, daily updated XML for application use. The current file contains 3,817 unique and format-valid four-character postcode rows, but its schema is only `Code`, `city` and `TimeWindowID`: it has no special/non-geographic classification and no Polygon/MultiPolygon.

The reusable [Eurostat TERCET 2025 HU crosswalk](https://gisco-services.ec.europa.eu/tercet/NUTS-2024/pc2025_HU_NUTS-2024_v1.0.zip) contains 3,156 unique valid four-digit codes with only `NUTS3` and `CODE` columns. It overlaps 3,049 current Posta codes (79.879% of the operator XML), omits 768 current codes and adds 107 codes absent from the current XML. It has no coordinates or areas. No real HU postal area was loaded, served or rendered.

## Public evidence has assignments and points, not a postal surface

| Source | Exact observation | M2 implication |
| --- | --- | --- |
| [Magyar Posta Partner Extra](https://www.posta.hu/partnerextra) | The service is public, available to everyone and usable as an application background database. ZipCodes is linked as settlement-to-postcode data. | Assignment evidence is reusable for validation, but the page supplies no postal area or special-code class. |
| [Partner Extra schema and updates](https://postaportal.posta.hu/partnerextra_leiras) | ZipCodes has `Code`, `city` and `TimeWindowID` and updates daily. | Freshness and format can pass; special/non-geographic classification and geometry cannot. |
| [Current ZipCodes.xml](https://httpmegosztas.posta.hu/PartnerExtra/Out/ZipCodes.xml) | 3,817 rows and 3,817 distinct codes; 0 blank/invalid codes; 16 leading-zero codes; 0 geometry or special-class fields. | A postcode-to-city row is not an area. The raw XML was audited temporarily and not committed. |
| [KCR regulation](https://njt.jog.gov.hu/jogszabaly/2014-345-20-22) | KCR stores address components, coordinates and identifiers and transfers data to named bodies and the universal postal operator. Recipients cannot independently provide or forward transferred data. | Address points are controlled and are not public postal polygons. No KCR rows were queried. |
| [KSH territorial data](https://www.ksh.hu/teruleti-adatok?lang=hu) | KSH publishes region, county, district, settlement and grid context plus postcode attributes. | Administrative and statistical units cannot be relabelled as postal membership. |
| [GISCO postal codes](https://ec.europa.eu/eurostat/web/gisco/geodata/administrative-units/postal-codes) | CC BY-SA 4.0 point data is designed for NUTS correspondence; non-geographic codes may be absent and location/coverage may be imperfect. | A point or NUTS match cannot become a Magyar Posta perimeter. |
| [TERCET methodology V4](https://gisco-services.ec.europa.eu/tercet/NUTS-2024/2025-GISCO-NUTS2024-PC2025-MET-NOTES-V4.0.pdf) | HU has 1 member-state postal row, 3,125 address-derived rows and 30 GeoNames rows, totalling 3,156. | The total reconciles to the CSV but does not prove current operator completeness or geometry. |

No chart was used: the exact authority/geometry matrix is clearer than a quantitative visual for this binary gate, and no lawful spatial surface exists to map.

## M2 means current classification plus an auditable real area

The unit under review is one current four-digit Magyar Posta assignment, its special/non-geographic class and its truthful real area. Hungary's refined country definition requires a current rights-cleared nationwide denominator and either an authoritative postal-area Polygon/MultiPolygon or a rights-cleared address-membership-derived surface with complete members, exclusions, method and uncertainty.

The release must pin edition, effective date, coverage, exceptions, CRS, terms, attribution, bytes and SHA-256, be published as an approved immutable artifact, and pass the real HU loader, API and application search-to-translucent-area path. Partner Extra rows without classification or geometry, GISCO/TERCET points, NUTS or KSH administrative geometry, KCR address points, building or parcel layers, buffers, Voronoi cells and synthetic fixtures do not meet the definition.

## Current assignment quality is high, but the M2 denominator is incomplete

| Quality dimension | Exact result | Risk and interpretation |
| --- | --- | --- |
| Volume and shape | Posta: 3,817 rows with `Code`, `city`, `TimeWindowID`; TERCET: 3,156 rows with `NUTS3`, `CODE` | Neither artifact has coordinate or geometry fields. |
| Uniqueness | 3,817 distinct Posta codes and 3,156 distinct TERCET codes; 0 duplicate codes in either | Internal uniqueness passes at each artifact's grain. |
| Validity | 3,817/3,817 Posta and 3,156/3,156 TERCET codes are exactly four digits; 16 current codes preserve a leading zero | Text normalization passes; syntax does not create a postal area. |
| Completeness | 3,049 overlapping codes; 768 current-only; 107 TERCET-only; 79.879% current coverage by TERCET | TERCET cannot replace the current operator denominator. Special classification is also absent. |
| Geometry | 0 official or rights-cleared derived Polygon/MultiPolygon out of 3,817 current codes | The real API/app area path cannot be exercised. |
| Timeliness | Posta XML last modified 30 August 2026; TERCET reference year 2025; methodology version 4.0 dated 9 March 2026 | References are current enough for a blocker review, not an area-complete M2 claim. |

The exact files and page digests are stored in `reports/postal-context-m2/hu-source-review-2026-08-30.json`. Raw downloads, postcode rows and source captures are not committed.

## Postal, geometry, address and administration remain separate

Magyar Posta controls routing assignments. Eurostat supplies official-derived point/NUTS correspondence. KCR supplies controlled address identity and coordinates. KSH supplies administrative/statistical context. Buildings, parcels and cadastral identifiers have separate authority and rights. None alone proves postcode membership, deliverability, an exact building relation, ownership or occupancy.

The audit created zero point buffers, Voronoi cells, administrative proxies, parcel/building dissolves or invented route, PO-box and organization areas. It queried no address, building, cadastral or land-right rows and committed no raw source data.

## The application path remains capability-only

Shared deterministic tests verify that AGID accepts only Polygon/MultiPolygon for area display, validates geometry, fits bounds, renders a translucent fill and visible outline, exposes loading/no-match/multiple/API-failure/invalid-geometry states, shows selected code/type/classification/source/date/confidence, clears and re-searches. Hungary's existing synthetic fixture tests continue to verify normalization and API contracts without promotion.

Those tests do not prove a real Hungarian area exists. No real HU loader, API geometry response, map fit or translucent area was verified, and browser E2E is intentionally not claimed.

## Limitations and robustness checks

- The public application-use statement was observed, but raw XML redistribution rights were not treated as unlimited and no source rows were committed.
- KCR data was not requested, authenticated or queried; the regulation establishes controlled transfer, not public bulk reuse.
- The TERCET count is descriptive evidence for a public crosswalk, not an estimate of operator completeness or area coverage.
- TERCET methodology page 4 was rendered and visually reconciled with extracted text. The HU row and table layout were legible without clipping or overlap.
- No legal conclusion is claimed; the M2 result is a conservative engineering and publication gate.

## Recommended next step

Do not authenticate, request KCR/cadastral data, accept contracts, request keys, pay, create a publication destination, publish or deploy without explicit approval. After pending countries and 6 September 2026 at 10:04 UTC, recheck for a public current special-code classification and an authoritative or rights-cleared derived postcode-area release. Resume sooner only if such unrestricted releases appear.

## Further questions

The decisive questions are whether Magyar Posta or another competent authority will publish stable special/non-geographic classifications and whether a reusable nationwide postcode-area surface can be released with complete membership, correction rules and derivative/serving rights. Until those answers and the real API/app path pass, M2 remains unmet.
