# agid-open-gg-license-ledger

Guernsey (GG) P1 high AGID open-geodata recovery seed.

This package is metadata-first. It records source-ledger requirements, missing-role recovery fixtures, and publication gates before any remote repository is created.

## Scope

- Country or region code: `GG`
- Recovery track: `geocoding-only-recovery`
- Present local core role: `geocoding`
- Missing core roles: `address`, `admin-boundary`, `gazetteer`
- Publication state: `recovery-seed`

## Non-Claims

- This recovery seed is not a complete country or territory address dataset.
- This recovery seed does not prove delivery availability, postal validity, or legal boundary authority.
- This recovery seed does not bundle upstream source data before redistribution review.
- This recovery seed does not remove manual fallback by itself.

## Required Files

- `sources.json` - source and redistribution review ledger
- `quality-gates.json` - publication and promotion gates
- `fixtures/missing-role-recovery.json` - synthetic missing-role fixture map
- `fixtures/manual-fallback-trigger.json` - manual review trigger fixture
- `fixtures/non-claim-conformance.json` - overclaim prevention fixture

## Next Actions

- Create a source ledger with URL, license, attribution, update cadence, and redistribution status.
- Use synthetic test fixtures first; never publish raw personal recipient addresses.
- Draft boundary fixtures from OSM/geoBoundaries/HOT OSM and mark contested boundaries as neutral technical identifiers.
- Create README, sources.json, quality-gates.json, and missing-role synthetic fixtures before any remote repository creation.
