# Israel Postal Context

Status: **M1 metadata / M2 blocked**, reviewed 2026-08-28. This directory is a
contract seed, not a published postal-assignment or address database.

The previously unnamed M2 criterion is now `M2_licensed_assignment`, derived
from the existing manifest's rules. All nine hard blockers remain unchanged.
Street/locality references, postal assignments, geometry, civic addresses,
buildings and AGID crosswalks retain separate source and permission gates.

- [Manifest](repository-manifest.json): country semantics and promotion gates.
- [Source review contract](m2-source-review.json): bounded inspection and quality rules.
- [M2 review](../../../../docs/postal-context-israel-m2.md): observations, limits and unblock conditions.
- [Aggregate source receipt](../../../../reports/postal-context-m2/il-source-review-2026-08-28.json): request times, hashes and quality counts, no source rows.

The government street API responded successfully, but contains no postal
assignment, house number, coordinate or building relation. The source total
is not verified coverage. No raw CSV, recipient, private-address or owner
records are bundled. Existing synthetic runtime fixtures remain synthetic.
