# `agid-postal-tr` contract seed

Status: `M1 metadata / no production Türkiye postal geometry`

This seed defines Türkiye's Postal Context authority boundary. It contains no
PTT source body, address row, production geometry, personal data or published
runtime artifact.

The current PTT postcode service exposes five-digit assignments by province,
district, neighbourhood and street. A bounded ALTINDAĞ review returned 3,269
rows, 8 unique valid postcodes, 26 neighbourhoods and 3,169 street labels. The
response has no Polygon, MultiPolygon, coordinates, boundary, CRS or topology.
It is address-assignment context, not a postal-area release.

M2 requires a current complete-for-declared-coverage, rights-cleared assignment
and exact Polygon/MultiPolygon delivery areas with edition, validity, CRS,
topology, identity and SHA-256 lineage feeding an approved immutable artifact.
The real TR API and app path must normalize five digits, return the area, fit
the map, draw a translucent fill and clear outline, expose authority, source,
basis date and confidence, and fail closed for missing or non-area geometry.
P.O. boxes, poste restante, routes, offices, buildings and house numbers remain
separately typed facts.
