# Taiwan Postal Context pack

This directory is a metadata-only M1 seed. It contains no Chunghwa Post
assignment rows, doorplate records, buildings, parcels, personal data or real
postal geometry.

The 2026-08-29 M2 review is pinned in `m2-source-review.json`. The government
CSV resource was a four-row link catalog, while the current operator rules
require an external account, sealed application and approval for the address
text file. Public operator methods return strings without geometry. NLSC
doorplates are points, buildings are separate polygons and vector use is
controlled; none is a postcode-area release.

Taiwan therefore remains M1. Promotion requires an exact current
complete-for-declared-coverage six-digit assignment and rights-cleared
Polygon/MultiPolygon artifact, immutable approved publication, TW runtime/API
and real app verification. Point buffers, Voronoi cells, administrative
boundaries, buildings, parcels, address ranges, P.O. boxes and synthetic
fixtures never satisfy that criterion.

See `docs/postal-context-taiwan-m2.md` and
`reports/postal-context-m2/tw-source-review-2026-08-29.json` for the evidence
and explicit unblock conditions.
