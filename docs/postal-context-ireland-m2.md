# Ireland Postal Context M2 review

## Technical summary: Ireland remains blocked

Ireland does not meet Postal Context M2 as reviewed on 30 August 2026. [Eircode](https://www.eircode.ie/what-is-eircode) makes the decisive country distinction: each seven-character Eircode uniquely identifies a postal address and its geographic location, while only its first three characters identify one of 139 Routing Key postal areas. A full Eircode is therefore an address/property identity, not a grouped postcode polygon.

The current nationwide ECAF/ECAD assignment and coordinate products are distributed through paid annual licences and a secure portal. The public [TERCET 2025 IE crosswalk](https://gisco-services.ec.europa.eu/tercet/NUTS-2024/pc2025_IE_NUTS-2024_v1.0.zip) contains 139 unique format-valid Routing Keys, including D6W, but only `NUTS3` and `CODE` columns. Eurostat's methodology says all 139 IE rows are GeoNames-derived. No reusable real Routing Key Polygon/MultiPolygon was found, loaded, served or rendered.

## Official evidence establishes identity and licence gates, not a publishable area

| Source | Exact observation | M2 implication |
| --- | --- | --- |
| [What is Eircode](https://www.eircode.ie/what-is-eircode) | Seven characters split into Routing Key and Unique Identifier; every full Eircode is unique to an address/location; 139 postal areas may cross counties. | The full code remains point/non-area. Routing Key context must be separately labelled. |
| [Eircode Code of Practice v7](https://www.eircode.ie/docs/default-source/common/code-of-practice-version-7b23930b5-1cbd-4b89-bafe-bcd6f72438f8.pdf?Status=Master&sfvrsn=da5b1d12_3) | Routing Keys are letter-number-number, with D6W as the sole letter-number-letter exception; assignment is to complete postal addresses/properties. | Country normalization must preserve D6W and cannot turn the Unique Identifier into an area. |
| [Eircode FAQs](https://www.eircode.ie/faqs) | GeoDirectory updates arrive monthly/quarterly; Finder shows building markers; licensed users receive data updates; the letter O is not issued. | Interactive public access is not bulk/redistribution authority and a marker is not a polygon. |
| [Products and Services](https://www.eircode.ie/business/products-and-services) | ECAF holds Eircode/address points; ECAD adds coordinates/other address data; access is an annual licence through a secure portal. | No licensed rows, coordinates or boundaries were acquired. |
| [Eircode legal terms](https://www.eircode.ie/legal) and [licensing PDF](https://www.eircode.ie/files/eircode-pricing-information.pdf) | Direct End User use is internal; a Provider licence is needed to resell/integrate. The linked PDF's price schedule is explicitly effective March 2015. | Licence control is current evidence; old price numbers are not treated as current. No contract or payment was accepted. |
| [11 August 2026 quarterly update](https://www.eircode.ie/news/2026/08/11/quarterly-update-Aug26) | The latest Finder update is live and new-code letters were posted. | Timeliness passes for the blocker review, not for a reusable data edition. |
| [GISCO postal codes](https://ec.europa.eu/eurostat/web/gisco/geodata/administrative-units/postal-codes) | Public outputs are point/NUTS correspondence with coverage/location caveats. | A point or NUTS match cannot become a Routing Key perimeter. |
| [TERCET methodology V4](https://gisco-services.ec.europa.eu/tercet/NUTS-2024/2025-GISCO-NUTS2024-PC2025-MET-NOTES-V4.0.pdf) | IE has 0 member-state postal rows, 0 address-derived rows, 139 GeoNames rows, 0 GISCO carryovers and 0 manual rows. | The 139-row total reconciles, but it is not authoritative boundary evidence. |
| [CSO 2026 SIMS report](https://www.cso.ie/en/media/csoie/methods/newdwellingcompletions/New_Dwelling_Completions_SIMS_2026.pdf) | CSO classifies by Eircode Routing Key Area, but ESB records are received under Section 24, individual connections are not published and no microdata leaves CSO. | An internal statistical point-in-polygon process is not a reusable boundary release. |
| [CSO Q1 2026 Background Notes](https://www.cso.ie/en/releasesandpublications/ep/p-ndc/newdwellingcompletionsq12026/backgroundnotes/) | Routing Key splits use substation information rather than exact dwelling location and may not precisely follow geographical boundaries. | Published statistics cannot be reverse-engineered into postal polygons. |

No chart was used: the exact authority, rights and geometry matrix is clearer than a quantitative visual for this binary gate, and no lawful spatial surface exists to map.

## The refined Ireland M2 definition preserves two grains

The search grain is one current seven-character Eircode. It is normalized as text, preserves the D6W exception, and returns an honest point/non-area reason. The area grain is its separate three-character Routing Key. A Routing Key surface may be displayed only when a complete authoritative or rights-cleared real 139-key Polygon/MultiPolygon release is pinned by edition, effective date, CRS, topology, coverage, exceptions, terms, attribution, bytes and SHA-256.

The real API/app path must show full-code identity and area-context granularity separately, label official/derived/virtual, fit and render the Routing Key surface with translucent fill and a clear outline, and expose selected code, geometry kind, source, reference date and confidence. Finder markers, ECAF/ECAD fields without serving rights, GISCO/TERCET correspondence, CSO statistics, counties, buildings, parcels, buffers, Voronoi cells and generic synthetic planning fixtures do not pass.

## Public Routing Key quality passes syntax, not geometry or authority

| Quality dimension | Exact result | Risk and interpretation |
| --- | --- | --- |
| Volume and shape | TERCET: 139 rows with only `NUTS3`, `CODE`; official site: 139 Routing Key areas | Counts agree, but official set equality was not established because no rights-cleared official list edition was acquired. |
| Uniqueness | 139 distinct Routing Keys; 0 duplicates | Internal uniqueness passes at the crosswalk grain. |
| Validity | 139/139 keys match letter-two-digits or D6W; D6W is present | Syntax passes and the country exception is preserved. Syntax does not prove a current assignment or area. |
| Completeness | 0 current seven-character assignment rows acquired; 0 public official-set membership proof | The full-code denominator required for M2 is unavailable. |
| Geometry | 0 official or rights-cleared derived Routing Key Polygon/MultiPolygon out of 139 | The real API/app area path cannot be exercised. |
| Timeliness | Official Finder update: 11 August 2026; TERCET reference year 2025; methodology version 4.0 dated 9 March 2026; CSO edition 2026 | Sources are current enough to bound the blocker, not to promote M2. |
| Rights | ECAF/ECAD require annual licence; Direct End User use is internal; CSO microdata is closed | Public immutable serving/redistribution rights are not established. |

The exact source-body and extracted-file digests are stored in `reports/postal-context-m2/ie-source-review-2026-08-30.json`. Raw HTML, PDFs, ZIP, CSV, address points and licensed data are not committed.

## Postal identity, area context, address and building stay separate

Eircode controls address/property assignment. A future Routing Key polygon release would control postal-area context. ECAF/ECAD and GeoDirectory govern licensed address identity/coordinates. CSO governs confidential statistical processing. NUTS, counties and local authorities govern administrative/statistical context. Buildings, parcels, occupancy and ownership require separate explicit authority and relations.

The audit created zero point buffers, Voronoi cells, county/NUTS proxies, parcel/building dissolves or invented PO-box, route, organization or address areas. It queried no Finder address, licensed ECAF/ECAD row, building, cadastral, personal or land-right record and committed no raw source data.

## The application path remains capability-only

Shared deterministic tests verify that AGID accepts only Polygon/MultiPolygon for area display, validates geometry, fits bounds, renders a translucent fill and visible outline, exposes loading/no-match/multiple/API-failure/invalid-geometry states, shows selected code/type/classification/source/date/confidence, clears and re-searches. Ireland's generic synthetic planning pack remains non-production evidence.

Those tests do not prove a real Irish Routing Key area exists. No real IE loader, API geometry response, point/non-area reason joined to a real context surface, map fit or translucent area was verified, and browser E2E is intentionally not claimed.

## Limitations and robustness checks

- The official public pages were treated as identity, cadence and licence evidence, not as permission to crawl Finder or extract the database.
- The linked licensing PDF contains an old March 2015 price schedule; only its licence categories and use restrictions are used, and no current-price claim is made.
- The TERCET CSV has 139 keys and the methodology IE row totals 139, but all are GeoNames-derived and no official-set equality or geometry is inferred from the matching count.
- CSO's statistical use of Routing Key Areas does not expose the underlying boundary or confidential coordinate records.
- Relevant PDF pages were rendered with Poppler and reconciled against extracted text. The local image inspection tool failed with Windows error 206 even at `C:\tmp\i.png`, so no successful visual-inspection claim is made.
- No legal conclusion is claimed; the result is a conservative engineering and publication gate.

## Recommended next step

Do not register, authenticate, accept ECAF/ECAD or Provider terms, request data or keys, pay, crawl Finder, query private addresses, create a publication destination, publish or deploy without explicit approval. After pending countries and 6 September 2026 at 10:32 UTC, recheck for an official reusable nationwide Eircode assignment edition and an authoritative or rights-cleared real 139-key Routing Key Polygon/MultiPolygon release. Resume sooner only if such unrestricted releases appear.

## Further questions

The decisive questions are whether a competent provider will publish a current rights-cleared assignment denominator and whether a complete Routing Key boundary surface can be publicly served with derivative/API rights. Until both exist and the real point/non-area plus separate context-area API/app path passes, Ireland remains below M2.
