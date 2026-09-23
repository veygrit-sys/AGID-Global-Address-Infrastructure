# Indonesia Postal Context

Status: **M1_metadata**, M2_assignment **blocked**. The pre-existing M2 criterion
requires a complete, rights-cleared current postcode-to-locality assignment;
the bounded operator search inspection does not meet that national criterion.

- [Repository contract](repository-manifest.json): original staged requirements.
- [Source roles](source-profile.json): separate operator, administrative,
  statistical, topographic, civic-address and building authority.
- [M2 source inspection contract](m2-source-review.json): permitted public
  queries, strict parsing, access/rights conflict detection and no raw retention.
- [Review and unblock requirements](../../../../docs/postal-context-indonesia-m2.md).

The committed reports contain aggregate checks and SHA-256 receipts, not source
rows or published postal data. A postcode/locality result has geometry `none`;
it cannot populate a premise, building, occupant or guessed coordinate.

Run `npm run verify:postal-context-indonesia` for synthetic parser and existing
AGID runtime conformance checks. A new live aggregate report can be created with
`node scripts/inspect-postal-context-id-sources.mjs --report <new-path.json>`.
This is a development-only inspector, not an API endpoint or a bulk exporter.
Recheck unavailable sources only after the pending-country pass and review date.
