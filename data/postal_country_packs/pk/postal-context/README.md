# Pakistan Postal Context

M1 metadata and synthetic-runtime contracts; **M2 remains blocked**.
The 2026-08-28 audit profiles 2,298 delivery and 832 non-delivery HTML rows, but does not certify
complete current assignments, redistribution rights, a production descriptor or postal polygons.

The source manifest retains the existing country-specific M2 definition. `m2-source-review.json`
pins nine public source observations and distinguishes data structure from authority, dates and rights.
The source bodies are not bundled. See `docs/postal-context-pakistan-m2.md` for findings and reproduction,
and the source/engineering reports under `reports/postal-context-m2/`.

Keep office class, office code, account office, province and attached-branch code separate. Never
calculate branch codes, infer a building from a postcode, discard shared-code rows, drop leading zeroes,
or treat a filename date as assignment effectivity. No new data destination or paid service is authorized.
