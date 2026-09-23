# Thailand Postal Context M2 review

Date: 2026-08-29
Country: TH / Thailand
Decision: M1 metadata, M2 blocked

## Required country outcome

Thailand uses `M2_exception_aware_postal_area_visualization`. Completion is not
a postcode string or shared UI component. A current, rights-cleared assignment
and exact postal-area release must resolve Thailand-specific subdistrict,
village, road and house-number exceptions; reproducibly publish an approved
immutable artifact; pass the real TH loader/API; and reach the app's search,
fit, translucent fill, outline, status and provenance display path.

Only a source-qualified postal `Polygon` or `MultiPolygon` may be shown as an
area. Administrative boundaries, postcode centroids, service points, routes,
P.O. boxes, organizations, address points, buildings, Voronoi cells and learned
regions keep their own authority. House number and building display requires a
separate permitted source record and explicit relation.

## Primary-source findings

Five exact public bodies were kept outside Git and reviewed by SHA-256. The
Thailand Post national postcode PDF is two pages, has 27,603 extracted text
characters, 979 distinct five-digit codes and 219 exception tokens. The
exceptions include subdistrict, village, road and house-number scopes. It has
no feature geometry, CRS, topology, stable row identifiers or declared current
validity. It is therefore an assignment reference, not a polygon release.

The official postcode-search page accepts Thai administrative inputs but does
not provide polygons. The government catalog describes a Zipcode dataset and
shows `Open Data Common`; its only resource is HTML with an empty URL. No data
bytes or edition can be validated. The exact data.go.th dataset was blocked by
HTTP 403 from this host; no bypass was attempted. Thailand Post's reviewed
terms contain no explicit bulk extraction, derivative polygon, redistribution
or API-serving grant. This is an engineering rights gate, not a legal opinion.

The source report is
`reports/postal-context-m2/th-source-review-2026-08-29.json`. Raw HTML, PDF and
catalog bytes are deliberately excluded from the repository.

## Quality and spatial decision

No eligible current machine-readable assignment rows or postal geometries were
obtained, so completeness, duplication, geometry validity and coverage rates
are `null`, not zero. Historical code count must not be read as national current
coverage. In particular, joining each postcode to a district polygon would
erase the documented exceptions and make false delivery-area claims.

The acceptable transform is fail-closed:

1. normalize a five-digit postcode without inventing missing digits;
2. bind every assignment and exception to stable source relations;
3. build or ingest only licensed source-qualified postal areas;
4. validate CRS, ring closure, self-intersections, overlaps, gaps and declared
   coverage while retaining official/derived/virtual authority;
5. pin source and output digests in an approved immutable release;
6. verify the real TH API and app path.

## Application path

The shared application already requests Postal Context geometry after an exact
postcode search, filters to postal-feature Polygon/MultiPolygon geometry,
installs a MapLibre fill at opacity 0.22 with a clear outline, fits bounds, and
supports loading, unavailable, API-failure, clear and repeat-search behavior.
It does not turn a point or building into an area.

This is not TH completion. There is no TH real-data runtime, so the API cannot
return an eligible Thai area and the app cannot demonstrate a real Thai result.
The shared visible notice also still needs distinct official/derived/virtual,
basis-date and confidence fields. Multiple candidates and invalid geometry must
remain explicit in the final country E2E proof.

## Blocker and retry

M2 remains blocked until a current rights-cleared exact area source (or all
permitted relations needed for reproducible exception-aware derivation),
declared coverage and validity, approved immutable artifact, real TH API and
country E2E app proof exist. Recheck public official sources after
`2026-09-05T03:09:44.464Z` and the pending-country pass. Restricted data,
contracts, paid services, new accounts, repositories, publication destinations
or production deployment require separate approval.
