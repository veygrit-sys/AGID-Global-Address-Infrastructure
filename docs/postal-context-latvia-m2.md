# Latvia Postal Context M2 review

## Technical summary: Latvia remains blocked

Latvia does not meet Postal Context M2 as reviewed on 30 August 2026.
[Latvijas Pasts' current postcode directory](https://pasts.lv/en/services/tariffs-and-information/postcode-book)
publishes eleven city/municipality PDF books that assign postcodes to streets,
house numbers, localities and special recipients, but it publishes no postcode
Polygon/MultiPolygon product. Eight current books were byte-pinned locally;
their PDF metadata is dated 25 May 2026. Three remaining books repeatedly
returned HTTP 522 through the non-browser retrieval path, so this audit does
not claim a complete postal-operator assignment denominator. No explicit
licence authorizing AGID processing, public serving and redistribution of the
directory contents was found.

The current [VZD State Address Register](https://data.gov.lv/dati/eng/dataset/varis-atvertie-dati)
is CC BY 4.0 and was updated on 29 August 2026. Its address CSV contains
610,513 rows; all 550,515 active (`EKS`) rows are approved, have valid
`LV-NNNN` postcodes and WGS84 coordinates, covering 693 distinct active
postcodes. Those geometries are address Points. The simultaneously published
SHP archive contains nine address/administrative layers and no postcode-area
layer. City, municipality, parish and village polygons are administrative or
address context, not postal boundaries.

No address point was buffered, hulled or tessellated, and no administrative,
village, road, parcel or building geometry was relabelled as a postcode area.
Therefore no real LV Polygon/MultiPolygon was loaded, served, fitted or
rendered.

## Exact data-quality evidence

| Gate | Exact result | M2 implication |
| --- | ---: | --- |
| Latvijas Pasts books | 11 listed; 8 byte-pinned; 142 pinned pages; 3 retrievals returned 522 | Current assignment evidence exists, but no complete machine denominator or reuse grant was established. |
| VZD current address CSV | 610,513 rows; 550,515 active/approved rows; 693 active postcodes | Current rights-cleared civic-address membership exists. It is not the postal operator's boundary authority. |
| VZD active coordinate coverage | 550,515 of 550,515 active rows have coordinates | Complete active point coverage still does not define a service-area edge. |
| VZD spatial archive | 9 layers; `Ekas` is Point; administrative/locality polygons carry no postal-area authority | There is no postcode Polygon/MultiPolygon layer to promote. |
| Official portal catalog search | 0 datasets for `pasta indekss`, `pasta indeksi` and `postal code` | No separate official postcode-boundary release was found. |
| Official/rights-cleared postcode polygons | 0 | No production artifact or real app visualization can pass. |

Eighteen exact official bodies/distributions are byte and SHA-256 bound in the
machine source review: eight postal books; VZD's current package metadata,
address metadata, address CSV and spatial ZIP; VZD's reuse terms, current data
description and spatial specification; and three official catalog API search
responses. Raw PDFs, the 135 MiB CSV, the 50 MiB SHP archive and transient
retrieval bodies are not committed.

## Country-specific M2 definition

Latvia M2 now requires a current complete rights-cleared Latvijas Pasts
assignment denominator, explicit code-class exceptions and real postcode
Polygon/MultiPolygon surfaces pinned by edition or retrieval basis, effective
date, terms, byte length and SHA-256. An approved immutable artifact must then
traverse the real LV loader and API into the application map, fit the selected
area and render translucent fill plus a clear outline while showing normalized
code, geometry kind, official/derived/virtual classification, source,
reference date and confidence.

Latvijas Pasts tables and VZD address points do not pass. Neither do
organization, institution, post-office, PO-box or route endpoints,
administrative/locality polygons, roads, parcels, buildings, point buffers,
convex/concave hulls, Voronoi/raster cells or synthetic fixtures. A derived
surface is eligible only when an expressly authorized reproducible method is
grounded in a complete current postal assignment denominator and its
limitations and noncanonical status are preserved.

## Authority, method and limitations

Postal assignment, civic-address membership, address-point geometry,
administrative context, cadastral buildings and land records remain separate
authorities and grains. The audit profiled CSV rows as text so `LV-` and all
four digits are retained, filtered current records using `STATUSS=EKS`, and
checked missing/invalid codes and coordinates before examining the companion
SHP layer and DBF schemas. Provider dates, file sizes and digests are retained
without committing source rows.

The eight obtained postal books are authoritative reference examples, but the
three failed downloads prevent a complete operator denominator claim. The VZD
address release is current and openly reusable with attribution, but it is a
civic-address source and all postcode-bearing geometry is Point. Those two
limitations are independently sufficient to keep M2 unmet. The review makes
no legal conclusion beyond the absence of an explicit Latvijas Pasts reuse
grant in the material inspected.

An audit chart was omitted because the decisive comparison is exact tabular
counts versus zero eligible polygons; a chart would obscure rather than
clarify that gate.

## Application status

Shared deterministic tests verify the fail-closed application capability:
only Polygon/MultiPolygon draws; valid bounds fit; fill remains translucent;
the outline is visible; loading, no-match, multiple-candidate, API-failure and
invalid-geometry states are explicit; metadata, clear and re-search are
covered. Latvia's synthetic fixture continues to test contracts only.

Those tests do not prove a real LV area. The real LV runtime, API lookup, map
fit and translucent postcode rendering remain unverified, so browser E2E was
not attempted and M2 remains unmet.

## Recommended next step

After pending countries and 6 September 2026 at 16:45 UTC, recheck for an
unrestricted current authoritative postcode-boundary release. Resume sooner
only if such a release appears or explicit written Latvijas Pasts processing,
public-serving and redistribution permission plus an approved authoritative
geometry/derivation basis becomes available. Do not contact a provider,
register, authenticate, accept terms, pay, create a repository or publication
destination, publish or deploy without explicit approval.

See `reports/postal-context-m2/lv-source-review-2026-08-30.json` and
`reports/postal-context-m2/lv-checks-2026-08-30.json` for exact machine
evidence and engineering gates.
