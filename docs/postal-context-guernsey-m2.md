# Guernsey Postal Context M2 source review

## Outcome

Guernsey remains at `M1_metadata` and is blocked under
`M2_current_guernsey_postcode_area_visualization`.

The current official evidence can establish the GY postcode denominator and
important exception classes, but it does not provide a public rights-cleared
full-code Polygon or MultiPolygon. ONSPD supplies no usable Channel Islands
coordinates. Digimap sells a postcode centroid product, licenses an
authenticated address-point API, and exposes agreement-gated tiled base maps;
none is a postcode area. Public Digimap service metadata also exposes land
parcel Polygons with postcode fields, but a parcel is not postal geometry and
no AGID derivative or redistribution authority was established.

The application therefore has no real GG artifact to return, fit, or draw with
a translucent fill and clear outline. Shared tests prove only the area-rendering
contract. They do not satisfy GG M2 and no synthetic, point-derived, parcel,
building, administrative, tile-derived, or AGID proxy surface is promoted.

## Scope and definitions

The intended grain is one full `GY` unit-postcode assignment and its explicit
area or non-area result. Compact, lowercase, or irregularly spaced input may be
normalized only when it matches a source-backed GY code. Postal assignment,
postage area geometry, address points, land parcels, buildings, background-map
tiles, and AGID crosswalks are separate authorities.

The M2 definition requires a current, rights-cleared, Bailiwick-wide Guernsey
Post assignment denominator and full-code Polygon/MultiPolygon release; pinned
edition, validity, terms, SHA-256, island coverage and exception handling; an
approved immutable artifact; and the real GG loader/API/app path through map
fit, translucent fill, visible outline, provenance, loading, no result,
multiple candidates, failure, invalid geometry, clear, and re-search.

## Official source and rights review

| Source | Current reviewed capability | Geometry/grain | Reuse consequence |
|---|---|---|---|
| Guernsey Post address/postcode finder and FAQ | Official Bailiwick lookup; postcodes usually cover multiple addresses; some organizations and every PO Box can have unique codes | Interactive address results and policy; no area release | No public bulk file, polygon, or open redistribution grant was found |
| ONS Postcode Directory, May 2026 | 3,384 GY records, including 3,298 live and 86 terminated | Feature service declares Point, but Channel Islands are PQI 9 with null grid references and latitude/longitude placeholders | OGL reference evidence is reusable with attribution, but it creates no usable GG point or area |
| Digimap Post Code Products | Government-licensed Channel Islands postcode centres and address counts | Centroid Point product | Annual fee and provider terms apply; no polygon is advertised and no purchase occurred |
| Digimap Corporate Address File | Real-time/daily official address search | Licensed authenticated address point | Credentials and an arranged licence are required; no query or agreement occurred |
| Guernsey Public Mapping | Temporary REST endpoint for a Guernsey base map | Tiled image service | Registration/agreement and API key are required; image tiles are background context, not postcode vectors |
| Digimap States of Guernsey map services | Guernsey, Sark, Herm and Alderney land-parcel layers with postcode and cadastral/address fields | Land-parcel Polygon | Wrong grain for postal extent; metadata has no AGID reuse grant and no feature row was queried or committed |

The ONSPD User Guide is decisive for the open path. It states that no
geographic coordinates are provided for Channel Islands or Isle of Man
postcodes. Table 3 puts all 2,048 large-user and 5,010 small-user Channel
Islands records in positional-quality class 9. The record specification uses
latitude `99.999999` and longitude `0.000000` as placeholders. The ArcGIS float
service returns the latitude placeholder rounded to `100`; this is not a point
near Guernsey.

The May 2026 GY arithmetic reconciles exactly:

- 3,384 total = 3,298 live + 86 terminated;
- 3,298 live = 2,480 small-user + 818 large-user;
- the User Guide reports 10 districts and 16 sectors for the GY area;
- all 3,384 entries have no usable open coordinate or postal polygon.

Guernsey Post says a PO Box has a unique postcode different from the holder's
actual address. It also says some organizations receive unique postcodes.
Neither case receives the holder's parcel, a sorting-office buffer, an address
point, or any other invented surface.

Exact URLs, retrieval time, HTTP status, byte length, release metadata, User
Guide pages, API counts, and SHA-256 values are bound in
`reports/postal-context-m2/gg-source-review-2026-08-30.json`. Raw HTML, PDF,
API responses, ONSPD rows, address records, parcel features, buildings,
customers, recipients, credentials, and land-right data are not committed.

## Data-quality decision

The review follows the intended postcode-search use case and evaluates the
following dimensions:

1. **Completeness.** The official ONS denominator is observable, but zero
   current assignment rows and zero postcode-area records are authorized and
   available to AGID. Full island coverage and a published artifact are absent.
2. **Uniqueness.** The User Guide and bounded API counts agree, but a full raw
   file was not retained and full-code uniqueness was not re-audited because no
   eligible area source exists. This remains a required promotion check.
3. **Validity.** Seventeen official HTTP responses and the extracted ONS PDF
   are byte- and SHA-bound. The User Guide pages and API sample agree that GY
   coordinates are unavailable. No topology can be validated because there is
   no eligible Polygon/MultiPolygon.
4. **Consistency.** Total/live/terminated and small/large-user counts reconcile.
   GG, GB, JE, and IM identities remain distinct. Guernsey, Sark, Herm, and
   Alderney source partitions are preserved and never silently merged.
5. **Integrity.** There is no assignment-to-area join, area-to-source-feature
   link, immutable artifact, or AGID crosswalk to verify. No parcel or address
   key is used as a postal boundary shortcut.
6. **Timeliness.** ONSPD May 2026 is the latest full ONSPD release found as of
   the observation time; the ONS latest-centroids service was modified on
   22 June 2026. The Guernsey Post PO Box form is April 2026. A future pass must
   re-pin all sources rather than treating live endpoints as immutable.

No chart is included because the decision is an exact rights-and-geometry gate,
not a distribution whose shape benefits from visualization. The source table
and reconciled counts are the clearer audit evidence.

## Application status

The shared Postal Context application contract already supports normalized
postcode search, Polygon/MultiPolygon validation, multiple candidates,
loading, no match, API failure, invalid geometry, bounds fit, translucent fill,
visible outline, selected postcode, geometry class, official/derived/virtual
classification, source, reference date, confidence, clear, and re-search.

There is no GG production loader, real API geometry response, or app map layer.
The truthful result is blocked/unavailable rather than an invented area. The
GG repository tests enforce the country-specific source roles and prohibit
promotion of ONS placeholders, paid centroids, CAF address points, parcels,
tiles, and synthetic fixtures.

## Method, limitations, and robustness

The review used official Guernsey Post, ONS/ONS Geography, Digimap, and States
of Guernsey/Digimap service metadata only. It downloaded the small official
User Guide archive and bounded count/sample responses into a temporary audit
directory, reconciled the published tables against the API, and stored only
metadata and digests in Git.

Relevant User Guide pages were rendered to PNG, but the local image viewer
rejected the Windows workspace path with an OS path-length error. Complete text
extraction and table arithmetic were used instead. This does not affect the
central geometry finding because the User Guide's coordinate exception and the
API's null/placeholder values independently agree. It remains a presentation
QA limitation, not proof of visual PDF inspection.

The public ArcGIS land layers were reviewed at metadata level only. Querying or
dissolving parcel features would introduce address/cadastre fields, unresolved
reuse rights, wrong-grain geometry, and incomplete-road/non-addressed-space
assumptions. No such operation was performed. No paid product, authentication,
API key, agreement, new account, publication destination, or deployment was
used or accepted.

## Unblock conditions and next review

M2 requires all of the following:

1. explicit authority for a current complete Bailiwick-wide Guernsey Post
   assignment denominator and the intended AGID storage, derivation, serving,
   and publication use;
2. a source-linked full-code Polygon/MultiPolygon release, or an explicitly
   approved reproducible derivation with complete island, gap, terminated,
   large-user, organization, PO Box, route, and non-area handling;
3. pinned edition, validity, terms, attribution, exact bytes, SHA-256, schema,
   CRS, coverage and exception rules, followed by uniqueness, join, topology,
   freshness and privacy validation;
4. an approved immutable artifact and real GG loader/API/app verification.

Recheck only after the pending-country pass and
`2026-09-06T08:18:41.047Z`, unless a new unrestricted polygon release or explicit
authority appears earlier. Purchase, authentication, agreement acceptance,
credential use, publication, new hosting, or deployment requires separate
approval.

## Further questions

- Will Guernsey Post or the States of Guernsey publish a complete current GY
  assignment denominator with explicit derivative and redistribution terms?
- Does Digimap offer a full-code Polygon/MultiPolygon product distinct from its
  advertised centroid and CAF products, and can AGID publicly serve an approved
  derivative?
- If an authorized derivation is proposed, how are public roads, water,
  unaddressed land, multi-parcel addresses, large users, PO Boxes, and island
  partitions represented without converting cadastre into a postal claim?
