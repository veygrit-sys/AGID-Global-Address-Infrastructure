# `agid-postal-tl` contract seed

Status: `M1 metadata / no production Timor-Leste postal geometry`

This seed defines Timor-Leste's Postal Context authority boundary. It contains
no Correios source body, address row, production geometry, personal data or
published runtime artifact.

The August 2026 UPU sheet documents a seven-character postcode: the `TL`
country prefix followed by five digits. Its five examples cover P.O. box,
home and organization delivery, but are not a complete national assignment
table. The operator contact page also displays an unlabelled six-digit
`535022`; AGID retains that discrepancy for authoritative review and does not
silently convert it into a postcode.

M2 requires current complete-for-declared-coverage, rights-cleared assignments
and exact Polygon/MultiPolygon delivery areas with edition, validity, CRS,
topology, identity and SHA-256 lineage feeding an approved immutable artifact.
The real TL API and app path must normalize the canonical code, return the
geometry, fit the map, draw a translucent fill and clear outline, expose
authority/source/basis date/confidence, and fail closed for missing or non-area
geometry. Administrative Post boundaries, offices and address examples cannot
be relabelled as postal areas. Buildings and house numbers remain separate
explicit address relations.
