# `agid-postal-tm` contract seed

Status: `M1 metadata / no production Turkmenistan postal geometry`

This seed defines Turkmenistan's Postal Context authority boundary. It contains
no Turkmenpost source body, address row, production geometry, personal data or
published runtime artifact.

The public Turkmenpost departments API currently exposes 153 unique six-digit
office indices. Of those records, 137 include an office point and 16 do not.
The API publishes no Polygon/MultiPolygon, boundary, CRS or delivery-area
relation. Office points and addresses are useful lookup evidence but are not
postal areas and are never buffered, joined to administrative boundaries or
converted to Voronoi cells.

M2 requires a current complete-for-declared-coverage, rights-cleared assignment
and exact Polygon/MultiPolygon delivery areas with edition, validity, CRS,
topology, identity and SHA-256 lineage feeding an approved immutable artifact.
The real TM API and app path must normalize six digits, return the area, fit the
map, draw a translucent fill and clear outline, expose authority, source, basis
date and confidence, and fail closed for missing or non-area geometry. P.O.
boxes, poste restante, routes, offices, buildings and house numbers remain
separately typed facts.
