# Lithuania Postal Context M2 review

## Technical summary: Lithuania remains blocked

Lithuania does not meet Postal Context M2 as reviewed on 30 August 2026. The
current [Lietuvos paštas API documentation](https://www.post.lt/savitarna/api_doc.html)
defines postcode and postcode-to-address endpoints and an optional `geoArea`
on a postcode object. That makes a provider area response plausible, but does
not make it a public reusable postcode-boundary release. The same
documentation requires authentication and provider configuration; the
[business conditions](https://www.post.lt/lt/api-verslui) require a Lietuvos
paštas contract. An anonymous postcode request returned `401 Unauthorized`
with a Bearer challenge.

No contract, account, credentials, terms acceptance or paid operation was
used. Therefore the audit could not establish real `geoArea` availability,
nationwide coverage, postcode meaning, topology, validity or permission to
process, publicly serve and redistribute the response. No real LT
Polygon/MultiPolygon was loaded, served or rendered.

## Official evidence bounds the blocker

| Source | Exact observation | M2 implication |
| --- | --- | --- |
| [Public postcode search](https://www.post.lt/post/codes/search) | Searches address to postcode and postcode to addresses and displays code, post office, address and municipality. | Interactive membership is not a bulk edition, rights receipt or polygon product. No address was queried. |
| [Current API documentation](https://www.post.lt/savitarna/api_doc.html) | Documents `/api/v2/address/lt/postcodes`, postcode-to-address lookup, optional postcode `geoArea`/centre and types `Post`, `PostBox`, `Address`, `BigCustomer`. All API communication must be authenticated and provider configuration is required. | The schema cannot prove that every current address postcode has a valid postcode surface or that AGID may publish it. Endpoint and code types require explicit non-area handling. |
| [API business conditions](https://www.post.lt/lt/api-verslui) | Integration starts after a Lietuvos paštas contract. | Contract, credentials and any associated rights require separate approval; none were obtained. |
| [Registrų centras address points](https://data.gov.lt/datasets/1351/) | Public CC BY 4.0 annual nationwide address-point model includes `pasto_koda` and WGS84/LKS-94 coordinates; the current storage view reports no data. | Civic-address points can support a future rights-cleared derivation, but are not postal-operator boundary authority and cannot be buffered or Voronoi-filled into M2. |
| [Postal-boundary open-data requests](https://data.gov.lt/requests/submitted/?selected_facets=jurisdiction_exact%3A19) | The official portal still lists Lithuanian postcode geographic boundaries as an evaluated/submitted data need. | No public official postcode-boundary release was found. |

The byte lengths and SHA-256 values of the three retrievable Lietuvos paštas
pages and the anonymous 401 capture are recorded in the machine source review.
The data.gov.lt pages were verified live but could not be byte-pinned through
the local retrieval path because the portal returned its WAF page; they are not
presented as fixed provider artifacts. Raw HTML, transient cookies, old address
dumps and API responses are not committed.

## Country-specific M2 definition

Lithuania M2 now requires a current complete rights-cleared Lietuvos paštas
postcode assignment denominator and real postcode Polygon/MultiPolygon
surfaces pinned by response edition or retrieval basis, validity, code-type
exceptions, terms, byte length and SHA-256. An approved immutable artifact must
then traverse the real LT loader and API into the application map, fit the
selected area and render translucent fill plus a clear outline while showing
normalized code, geometry kind, official/derived/virtual classification,
source, reference date and confidence.

An authenticated schema field alone does not pass. Neither do Registrų centras
address points, delivery areas, post offices, routes, PO boxes, organizations,
administrative boundaries, buildings, buffers, Voronoi cells or synthetic
fixtures.

## Data-quality and authority result

| Gate | Result | Risk |
| --- | --- | --- |
| Current assignment denominator | 0 rows acquired | Completeness and current allocation cannot be tested. |
| Real operator `geoArea` | 0 responses acquired; anonymous request is 401 | Area meaning, code-class coverage, closure and topology remain unknown. |
| Public official postcode polygons | 0 | No production artifact can be published. |
| Public address points | Schema is nationwide, CC BY 4.0 and postcode-bearing; current storage view reports no data | Points remain address-registry evidence, not a postal surface. |
| Rights | Contract/API processing, public serving and redistribution rights not established | AGID cannot lawfully claim or distribute M2 geometry. |
| Privacy and authority separation | 0 address, building, cadastral, personal, customer or land-right rows acquired | Postal Code -> Polygon remains separate from Address Context. |

The audit created zero point buffers, Voronoi cells, administrative/building
proxies or invented route, PO-box, organization or endpoint areas. It made no
authenticated request and committed no raw source data.

## Application status

Shared deterministic tests verify the fail-closed application capability:
only Polygon/MultiPolygon draws; valid bounds fit; fill remains translucent;
the outline is visible; loading, no-match, multiple-candidate, API-failure and
invalid-geometry states are explicit; metadata, clear and re-search are
covered. Lithuania's synthetic fixture continues to test contracts only.

Those tests do not prove a real LT area. The real LT runtime, API lookup, map
fit and translucent postcode rendering remain unverified, so browser E2E was
not attempted and M2 remains unmet.

## Recommended next step

Do not register, authenticate, request credentials, accept a contract or
terms, pay, query address/building/cadastral/land records, create a publication
destination, publish or deploy without explicit approval. After pending
countries and 6 September 2026 at 15:28 UTC, recheck for an unrestricted
official postcode-boundary release. Resume sooner only if such a release
appears or explicit approval and written processing/serving/redistribution
rights make the authenticated provider path reviewable.

See `reports/postal-context-m2/lt-source-review-2026-08-30.json` and
`reports/postal-context-m2/lt-checks-2026-08-30.json` for the exact machine
evidence and engineering gates.
