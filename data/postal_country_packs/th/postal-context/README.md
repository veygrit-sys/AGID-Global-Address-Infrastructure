# `agid-postal-th` contract seed

Status: `M1 metadata / no production Thai postal geometry`

This seed defines Thailand's Postal Context authority boundary. It contains no
Thailand Post source body, address record, production geometry, personal data
or published runtime artifact.

The reviewed Thailand Post nationwide list confirms five-digit assignments,
but it is a two-page assignment poster rather than polygon data. Its exceptions
refer to subdistricts, villages, roads and house-number ranges. Administrative
boundaries, postcode centroids, service points, address points, learned cells
and Voronoi regions therefore cannot be relabelled as official postal areas.

M2 requires a current, complete-for-declared-coverage and rights-cleared
postcode-to-Polygon/MultiPolygon release whose exception scopes are resolved by
explicit permitted source relations. Exact acquisition time, edition, validity,
CRS, schema, topology checks and SHA-256 must feed a reproducible transform and
an approved immutable artifact. The real TH API and app path must then normalize
the query, return the geometry, fit the map, draw a translucent fill and clear
outline, expose authority/source/basis-date/confidence, and fail closed for
missing or non-area geometry. Buildings and house numbers remain separate
explicit address relations.
