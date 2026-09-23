# `agid-postal-tj` contract seed

Status: `M1 metadata / no production Tajik postal geometry`

This seed defines Tajikistan's Postal Context authority boundary. It contains
no Tajik Post source body, postal-office address row, production geometry,
personal data or published runtime artifact.

The reviewed Tajik Post pages expose six-digit locality assignments and postal
facility addresses. They do not define area boundaries. Repeated codes across
localities and facilities must be retained as ambiguity until an explicit
postcode-to-area relation resolves them. Postal-office points, administrative
boundaries, learned cells and Voronoi regions cannot be relabelled as official
postal polygons, and the displayed `753456` outlier cannot be silently fixed.

M2 requires current complete-for-declared-coverage, rights-cleared assignments
and exact Polygon/MultiPolygon features with edition, validity, CRS, topology,
identity and SHA-256 lineage feeding an approved immutable artifact. The real
TJ API and app path must normalize the query, return the geometry, fit the map,
draw a translucent fill and clear outline, expose authority/source/basis date/
confidence, and fail closed for missing or non-area geometry. Buildings and
house numbers remain separate explicit address relations.
