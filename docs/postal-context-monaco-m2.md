# Monaco Postal Context M2 review

## Technical summary: Monaco remains blocked

Monaco does not meet Postal Context M2 as reviewed on 30 August 2026. The
[current official La Poste postal-code base](https://www.data.gouv.fr/dataservices/base-officielle-des-codes-postaux)
is updated from 8 August 2026, is released under Open Licence 2.0 and contains
39,192 exact rows. It contains one Monaco row: `99138;MONACO;98000;MONACO;`.
The current geocoded export has the same row but blank geopoint, latitude and
longitude. An API request for geoshape, geopoint and commune-contour geometry
returns no geometry fields. The official catalogue also states directly that
postcode contours are not supplied in open data.

[La Poste Monaco's current tariff page](https://www.lapostemonaco.mc/tarifs.html)
publishes 2026 material and displays `98020 MONACO CEDEX` in the operator
address. That is a current routing example, not a complete list of allocated
`980xx` ordinary, CEDEX, organization, service or PO-box classes. The public
operator publications contain no postal Polygon/MultiPolygon or bulk address
data grant.

The reviewed public alternative,
[Contours calculés des zones codes postaux](https://www.data.gouv.fr/datasets/contours-calcules-des-zones-codes-postaux),
is a 2021 convex-hull product derived from BAN address numbers. Its actual
Open-Licence GeoJSON contains 6,158 overlapping features and exactly zero
`98xxx` features. It therefore supplies no Monaco geometry even as a stale,
noncanonical derived candidate. No Principality, commune, quartier, urban-plan,
address, building, road or endpoint geometry was relabelled as a postcode area.

## Exact data-quality evidence

| Gate | Exact result | M2 implication |
| --- | ---: | --- |
| Current La Poste base | 39,192 rows; 6,328 distinct codes; 1 Monaco row (`98000`) | Current ordinary assignment is pinned, but a complete 980xx exception denominator is absent. |
| Current Monaco geocoded row | 1 row; geopoint/latitude/longitude all blank | No official Point or area geometry is available for the Monaco record. |
| La Poste contour policy | Postcode contours explicitly not supplied | Commune contours cannot be promoted as postal contours. |
| Current operator publication | 2026 tariff, 146 pages; `98020 MONACO CEDEX` example | A CEDEX example is non-areal and not a complete allocation table. |
| BAN-derived hull product | 6,158 Polygon features; 0 `98xxx` features | The reviewed derived product has no Monaco candidate. |
| Official/rights-cleared Monaco postcode polygons | 0 | No immutable production artifact or real app visualization can pass. |

Seventeen exact official/public-service bodies or distributions are byte and
SHA-256 bound in the machine source review. These include current La Poste
metadata, raw and geocoded CSVs, three exact API responses, the Open Licence
legal text, current operator pages and tariff PDF, two current Monaco
government pages, the derived-hull metadata and GeoJSON, and current France-only
postal metadata. Raw source bodies are not committed.

## Country-specific M2 definition

Monaco M2 now requires a current complete rights-cleared ordinary-postcode and
`980xx` exception allocation denominator plus real postcode Polygon/MultiPolygon
surfaces pinned by edition or retrieval basis, effective date, terms, byte
length and SHA-256. An approved immutable artifact must traverse the real MC
loader and API into the application, fit the selected area and render
translucent fill plus a clear outline while showing normalized code, geometry
kind, official/derived/virtual classification, source, reference date and
confidence.

A La Poste row, the Principality or commune boundary, a centroid, DPUM internal
system evidence, CEDEX/organization/service/PO-box endpoints, quartiers, urban
plans, buildings, roads, point buffers, convex or concave hulls,
Voronoi/raster cells and synthetic fixtures do not pass. A derived surface is
eligible only from an expressly authorized complete current postal-membership
denominator with reproducible lineage, limitations and noncanonical status.

## Authority, method and limitations

Postal assignment, address/building identity, government geographic context
and AGID containment remain separate authorities. CSV fields were parsed as
text, retaining all five digits, and exact duplicates, syntax, Monaco scope and
geometry fields were counted before reviewing alternative public geometry.
The derived GeoJSON was parsed feature-by-feature and checked for both `98000`
and the `98` prefix; neither exists.

Open Licence 2.0 permits attribution-preserving reuse of the pinned La Poste
open rows and the derived-hull file. It does not grant geometry that the files
do not contain. Current government material confirms official GIS and
registry-based systems, but no public licensed DPUM address/building bulk
release with postal membership was found. This review makes no legal conclusion
beyond the observed terms and absence of a reviewed public grant.

An audit chart was omitted because the decisive comparison is an exact table:
one current ordinary assignment, one current CEDEX example and zero eligible
Monaco polygons. A chart would hide the authority and denominator distinction.

## Application status

Shared deterministic tests verify the fail-closed application capability:
only Polygon/MultiPolygon draws; valid bounds fit; fill remains translucent;
the outline is visible; loading, no-match, multiple-candidate, API-failure and
invalid-geometry states are explicit; metadata, clear and re-search are
covered. Monaco's synthetic fixture remains contract evidence only.

Those tests do not prove a real MC area. The real MC runtime, API lookup, map
fit and translucent postcode rendering remain unverified, so browser E2E was
not attempted and M2 remains unmet.

## Recommended next step

After pending countries and 6 September 2026 at 17:24 UTC, recheck for an
unrestricted current authoritative Monaco postcode-boundary release. Resume
sooner only if such a release appears or an expressly authorized complete
current postal-membership denominator plus an approved geometry/derivation
basis becomes available. Do not contact a provider, register, authenticate,
accept terms, pay, create a repository or publication destination, publish or
deploy without explicit approval.

See `reports/postal-context-m2/mc-source-review-2026-08-30.json` and
`reports/postal-context-m2/mc-checks-2026-08-30.json` for exact machine evidence
and engineering gates.
