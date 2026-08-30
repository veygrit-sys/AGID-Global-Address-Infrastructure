# United Kingdom Postal Context M2 source review

## Outcome

The United Kingdom remains at `M1_metadata`. Current official open products can
confirm postcode identity, status, administrative crosswalks, and representative
points, but they do not provide a unit-postcode Polygon or MultiPolygon. The
official product that does provide notional unit-postcode extents, OS Code-Point
with Polygons, is agreement-controlled and covers Great Britain only. No
agreement was accepted and no licence-controlled bytes were acquired.

The application therefore has no authorized real GB artifact from which a
postcode search can retrieve, fit, and draw a semi-transparent area. Shared
runtime and synthetic GB fixtures prove the API and UI contract only; they do
not satisfy M2 and are not promoted.

## Official source and rights review

| Source | Current reviewed capability | Geometry | Reuse consequence |
|---|---|---|---|
| ONS Postcode Directory | Quarterly current/terminated postcode reference and administrative/statistical crosswalk | Address-mean representative point; no unit-postcode boundary | Open reference evidence does not create an area |
| OS Code-Point Open | August 2026 current Great Britain unit postcodes | Point coordinates; the OS comparison says `Polygons: No` | OGL point data cannot be presented as a postcode polygon |
| OS Code-Point with Polygons | About 1.7 million notional Great Britain unit-postcode extents, updated quarterly | Derived Thiessen Polygon/MultiPolygon coverage | Product access and use are agreement-controlled; no AGID public redistribution right was established |
| OS NI Postcodes | Northern Ireland postcode-unit reference | Representative point | A Data Exploration Licence/product access is required and no postcode polygons are supplied |
| LPS Central Postcode Directory | Northern Ireland postcode reference | Directory/point evidence | Supply and use require LPS application/licence review |

OS describes Code-Point with Polygons as notional extents derived from
georeferenced Royal Mail PAF delivery addresses by Thiessen construction. It is
not an official Royal Mail boundary. Product documentation also excludes or
discards records such as P.O. Box/no-quality cases that cannot support an area.
The product covers Great Britain; Northern Ireland postcodes do not inherit a
GB polygon and retain their separate LPS rights and source identity.

The August 2026 Code-Point Open Data Hub page, the current OS product pages,
ONS methodology, OS NI product page, and LPS licensing page were captured with
HTTP status, byte length, retrieval time, and SHA-256 in
`reports/postal-context-m2/gb-source-review-2026-08-30.json`. Raw captures stay
outside Git. A former OS overview PDF URL returned HTTP 404 and is recorded as
a stale link, not treated as evidence.

## Data-quality decision

The audit separates five questions:

1. **Completeness:** current open GB and UK postcode point/crosswalk products
   exist, but authorized unit-postcode polygons available to AGID are zero.
2. **Validity:** seven official pages returned HTTP 200 and were byte-bound;
   one legacy PDF link returned HTTP 404. No unavailable body was inferred.
3. **Consistency:** Great Britain and Northern Ireland scope and rights remain
   distinct. A `BT` postcode never borrows a Great Britain polygon.
4. **Timeliness:** the reviewed Code-Point Open Data Hub release is August 2026;
   OS says postcode products are updated quarterly. The OS roadmap also
   announces Code-Point and Code-Point with Polygons end of life on 31 March
   2028, so any future implementation needs a migration plan.
5. **Integrity and privacy:** no licensed PAF address, customer, recipient,
   building, land-right, point dump, or derived geometry was persisted or
   committed. There is no source-to-artifact join to validate yet.

No buffer, Voronoi/Thiessen reconstruction, administrative proxy, building
footprint, ONS/OS point, or AGID cell is substituted for a missing authorized
postcode surface. P.O. Box, BFPO, route, organization, large-user, and other
non-area cases remain non-areal with an explicit reason.

## Application status

The GB runtime normalizes compact or spaced input (`sw1a1aa` to `SW1A 1AA`),
and the shared application contract supports loading, no match, multiple
candidates, API failure, invalid geometry, clear, re-search, map bounds fit,
semi-transparent fill, visible outline, and provenance metadata. Existing GB
tests use deliberately non-geographic `ZZ0` fixtures.

There is no real GB Polygon/MultiPolygon pack, immutable artifact, production
loader result, API geometry response, or app map layer. Consequently postcode
search to semi-transparent GB area visualization is **not verified**. The
correct real-data response remains unavailable/blocked rather than an invented
surface. A statistical chart would not improve this exact rights-and-geometry
decision, so the source/rights table and deterministic contract tests are the
chosen evidence.

## Unblock conditions and next review

M2 requires all of the following:

1. explicit authority to obtain a current complete OS Code-Point with Polygons
   (or equivalent) release and to publish/serve the intended AGID derivative;
2. a separately rights-cleared Northern Ireland polygon source, or an explicit
   GB-only release scope that returns a truthful non-area result for `BT`;
3. pinned edition, validity date, terms, attribution, SHA-256, CRS, coverage,
   exception classes, and a reproducible transform without inventing surfaces;
4. an approved immutable artifact and real GB loader/API/app verification for
   normalization, ambiguity, geometry validity, fit, translucent fill, outline,
   provenance, loading, no result, failure, clear, and re-search.

Recheck only after the pending-country pass and
`2026-09-06T07:40:08.000Z`, unless an unrestricted current polygon release or
explicit licence authority appears earlier. Authentication, agreement
acceptance, purchase, new publication destination, and deployment require
separate approval.
