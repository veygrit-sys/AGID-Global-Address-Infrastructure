# Isle of Man Postal Context M2 review

## Technical summary: Isle of Man remains blocked

Isle of Man does not meet Postal Context M2 as reviewed on 30 August 2026. The latest public [ONSPD Online](https://www.data.gov.uk/dataset/0965390d-a9ca-451c-a10a-2ad85c86530a/onspd-online-latest-postcode-centroids2) gives a useful, reusable live-code denominator: the complete `DOTERM IS NULL AND PCDS LIKE 'IM%'` query returned 4,591 distinct format-valid unit postcodes. It does not give an IM location or postal surface. Every row has positional indicator 9, null easting/northing, sentinel latitude/longitude `100/0` in the online service and no ArcGIS geometry.

The [ONSPD February 2025 user guide](https://www.ons.gov.uk/file?uri=%2Faboutus%2Ftransparencyandgovernance%2Ffreedomofinformationfoi%2Fukpostcodesandcorrespondinglocalauthorityfebruary2025%2Fonspduserguidefeb2025.pdf) makes the interpretation explicit: no geographic coordinates are provided for Isle of Man postcodes, PQI 9 means no grid reference is available, and the directory reserves latitude/longitude sentinels for Isle of Man and other no-grid-reference rows. A sentinel is not a point, and a point would still not satisfy the required Polygon/MultiPolygon gate.

The official Post Office Finder is restricted to personal use and a 2024 Post Office procurement document describes its postcode lookup as an internal RESTful API whose use must be capped. The complete public Isle of Man Government GIS catalog snapshot exposed no postcode/postal boundary; its only broad `post` matches were point layers for post boxes and post offices. No rights-cleared real unit-postcode or outward-code Polygon/MultiPolygon was found, loaded, published, served or rendered.

## Official evidence supports a code denominator, not a postal area

| Source | Exact observation | M2 implication |
| --- | --- | --- |
| [Isle of Man Post Office postcode finder](https://www.iompost.com/tools-forms/postcode-finder/) | Interactive address search is expressly limited to the user's own personal use. | No crawl or address extraction was performed; the page is not bulk/API/geometry authority. |
| [Post Office terms](https://www.iompost.com/help/terms-conditions/) | Current website content is protected and no public bulk or derivative-database right is stated. | Finder access cannot be converted into a public AGID data service. |
| [Post Office RFQ47](https://www.iompost.com/uploads/rfq47_corporate-site_quotation-exercise.pdf) | Page 4 requires the corporate site to use an internal RESTful postcode/address API and cap usage; page 8 offers an API overview to tenderers. | An internal integration is not a public unauthenticated data licence. No contact, credential, agreement or API request was made. |
| [ONS postcode products](https://www.ons.gov.uk/methodology/geography/geographicalproducts/postcodeproducts) | ONSPD is a directory/lookup linking postcode points to other geographies through point-in-polygon; straddling codes are assigned by a mean point. | Administrative assignments are not postal boundaries. |
| [ONS licences](https://www.ons.gov.uk/methodology/geography/licences) | Non-BT postcode-product content is reusable under OGL v3 with ONS, OS and Royal Mail attribution. | Rights pass for the inspected IM code list, but rights do not create withheld geometry. |
| [ONSPD User Guide February 2025](https://www.ons.gov.uk/file?uri=%2Faboutus%2Ftransparencyandgovernance%2Ffreedomofinformationfoi%2Fukpostcodesandcorrespondinglocalauthorityfebruary2025%2Fonspduserguidefeb2025.pdf) | No coordinates are provided for Isle of Man postcodes; PQI 9 is no coordinate; easting/northing are blank; latitude/longitude use sentinels. | `100/0` from the online service and null geometry must fail closed. |
| [ONSPD Online May 2026 item](https://www.arcgis.com/home/item.html?id=84787e80aca04bb388caad29f89946b0) | Public ONS feature service, modified 22 June 2026, described as May 2026 centroids. The layer type is point. | Even a valid centroid would not prove an exact postcode area. |
| [Public Isle of Man Government GIS root](https://ppmaps.gov.im/manngispubserver/rest/services?f=pjson) | Six folders, 25 services, 122 layers and 4 tables were enumerated with zero metadata errors. No name contained `postcode` or `postal`. | This dated public snapshot contains no candidate postal boundary. It does not claim that no private/future layer can exist. |
| [Post Boxes layer](https://ppmaps.gov.im/manngispubserver/rest/services/CorporateDynamicServices/PPFeeds/MapServer/10?f=pjson) and [Post Offices layer](https://ppmaps.gov.im/manngispubserver/rest/services/CorporateDynamicServices/PPFeeds/MapServer/11?f=pjson) | Both are `esriGeometryPoint`; features were not queried. | Postal facilities remain points and are never buffered or relabelled as postcode areas. |

No chart was used. An authority/rights/geometry audit table communicates the binary promotion gate more faithfully, and no truthful postal surface exists to map.

## The country-specific M2 definition preserves unit and context grain

The search grain is one current unit postcode such as `IM1 1AD`, kept as text and displayed with one space before the final three characters. Syntax never proves that a code is live or geographic. An exact unit surface requires an explicit competent rights-cleared Polygon/MultiPolygon relation. Codes classified as non-geographic, large-user, PO-box, route or organisation remain non-area.

A broader outward-code surface such as `IM1` may be shown only from a complete authoritative or rights-cleared real postal-boundary release with deterministic unit membership. It must be labelled as broader postal context, not as the searched unit postcode. `IM99`, facility points, sentinel coordinates and outward text alone do not justify a surface.

The real AGID API/app path must distinguish exact unit code from broader postal context, expose an honest non-area/unavailable reason, label official/derived/virtual, validate Polygon/MultiPolygon, fit and render translucent fill plus a clear outline, and show selected code, geometry kind, source, reference date and confidence. ONSPD sentinels, post-box/post-office points, constituencies, parishes, government service areas, addresses, routes, PO boxes, organisations, buffers, Voronoi cells and synthetic fixtures never pass.

## The current ONSPD denominator passes code quality and fails geometry

| Quality dimension | Exact result | Risk and interpretation |
| --- | --- | --- |
| Volume | 4,591 live rows from the count endpoint and three paged queries: 2,000 + 2,000 + 591 | Page totals reconcile to the official query count. |
| Uniqueness | 4,591 distinct unit codes; 0 duplicates | Uniqueness passes at the public live-code grain. |
| Validity | 4,591/4,591 match the IM unit-postcode grammar; 0 invalid | Syntax passes; assignment and geometry remain separate. |
| Outward distribution | `IM1` 509, `IM2` 929, `IM3` 392, `IM4` 733, `IM5` 279, `IM6` 80, `IM7` 335, `IM8` 420, `IM9` 782, `IM99` 132 | These counts are a denominator audit, not polygon membership evidence. |
| Coordinate integrity | 4,591 PQI 9; 4,591 null eastings; 4,591 null northings; 4,591 service sentinels `LAT=100`, `LONG=0` | The official guide identifies the no-coordinate condition; sentinel values are not usable points. |
| Geometry | 0 returned ArcGIS geometries; 0 official/derived eligible Polygon/MultiPolygon | Exact-unit and outward-context area gates both fail. |
| Timeliness | ONSPD reference month May 2026; item modified 22 June; data.gov page updated 24 June | Current enough for this blocker audit. |
| Rights | Non-BT ONSPD reuse under OGL v3 with attribution; Finder personal-use-only; Post Office API internal | The code denominator is reusable with attribution, while Post Office extraction/serving authority is not established. |

The exact query, pagination, transforms, bytes and SHA-256 values are stored in `reports/postal-context-m2/im-source-review-2026-08-30.json`. Raw ONSPD pages, HTML, PDFs and government GIS dumps are not committed.

## Postal assignment, facilities, address, administration and building remain separate

Royal Mail and Isle of Man Post Office govern postal assignment. ONS publishes a licensed postcode directory and administrative crosswalk. Isle of Man Government GIS publishes facility and administrative layers. An address source would govern address identity; a separate competent building source would govern a building relation. None controls the others by proximity or shared text.

The audit created zero point buffers, Voronoi cells, administrative proxies, parcel/building dissolves or invented PO-box, route, organisation or address areas. It queried no Finder address, post-box/post-office feature, building, cadastral, personal, customer or land-right record and committed no raw source data.

## The application path remains capability-only

Shared deterministic tests verify that AGID accepts only Polygon/MultiPolygon for area display, validates geometry, fits bounds, renders a translucent fill and visible outline, exposes loading/no-match/multiple/API-failure/invalid-geometry states, shows selected code/type/classification/source/date/confidence, clears and re-searches. Generic IM planning fixtures remain synthetic non-production evidence.

Those tests do not prove a real Isle of Man postal area exists. No real IM loader, API geometry response, non-area reason joined to a real context surface, map fit or translucent area was verified, and browser E2E is intentionally not claimed.

## Limitations and robustness checks

- The current ONSPD public service is treated as the live-code denominator inspected on the observed date. Its all-PQI-9 result agrees with the user guide's IM no-coordinate rule.
- The online service rounds or maps the documented latitude sentinel to `100`; neither `100/0` nor `99.999999/0` is interpreted as geography.
- The government GIS review exhaustively traversed the public root's six advertised folders and all 25 listed services with no metadata errors. It is not a claim about private, unlisted or future services.
- The two broad `post` matches were inspected at layer-metadata level and are points. Feature rows were not needed or queried.
- Relevant PDF pages were rendered with Poppler and reconciled against extracted text. The local image inspection tool failed with Windows error 206 even for `C:\tmp` images, so no successful visual-inspection claim is made.
- No legal conclusion is claimed; the result is a conservative engineering and publication gate.

## Recommended next step

Do not contact a procurement party, register, authenticate, accept Post Office terms or a contract, request an API overview/key/data, pay, crawl Finder, query private addresses, create a publication destination, publish or deploy without explicit approval. After pending countries and 6 September 2026 at 11:20 UTC, recheck for a public current rights-cleared IM postal-boundary release or a public documented Post Office API/data licence. Resume sooner only if an unrestricted competent release appears.

## Further questions

The decisive questions are whether a competent provider will publish a current unit-postcode-to-surface relation, or a source-defined non-area classification plus complete outward-code postal boundaries, and whether those surfaces can be publicly served with derivative/API rights. Until that artifact exists and the real API/app path passes, Isle of Man remains below M2.
