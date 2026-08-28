# India Postal Context

Status: **M1 metadata / M2 blocked**, reviewed 2026-08-28. This is a contract
seed, not a current PIN/office database or a published geometry pack.

The existing **M2_assignment** criterion requires a complete rights-cleared
PIN and typed office assignment. It is unchanged, as are all 13 hard blockers.
M3 geometry and M4 explicit building relations remain separate stages.

- [Manifest](repository-manifest.json): original semantics and promotion gates.
- [Inspection contract](m2-source-review.json): bounded, credential-free review.
- [M2 review](../../../../docs/postal-context-india-m2.md): source observations and unblock conditions.
- [Source receipt](../../../../reports/postal-context-m2/in-source-review-2026-08-28.json): timestamps, hashes and aggregate diagnostics only.

The official portal currently returns sandbox/empty-result responses; public
Swagger requires an API key. GODL text and official PIN-boundary/DIGIPIN
references were checked, but no current complete assignment was obtained.
No raw records, credentials, personal addresses or inferred polygons are
bundled. Existing runtime fixtures remain synthetic.
