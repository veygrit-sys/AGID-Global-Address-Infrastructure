# agid-open-gd-geocoder-fixtures

Grenada (GD) P2 medium AGID open-geodata seed package.

This package is metadata-first. It creates a repository-ready scaffold for source review, synthetic conformance, and future address-quality promotion without bundling upstream geodata.

## Scope

- Country or region code: `GD`
- Stage: `core-role-fill`
- Package kind: `geocoder-fixtures`
- Publication state: `seed-ready`

## Non-Claims

- This seed does not claim complete national address coverage.
- This seed does not prove delivery, postal, legal, or cadastral authority.
- This seed does not bundle upstream geometry or private coordinates before license review.

## Required Files

- `sources.json` - source and redistribution review ledger
- `quality-gates.json` - promotion gates
- `fixtures/synthetic-candidate-conformance.json` - synthetic candidate tests
- `fixtures/source-confidence-conformance.json` - source confidence tests

## First Actions

- Create a source ledger with URL, license, attribution, update cadence, and redistribution status.
- Use synthetic test fixtures first; never publish raw personal recipient addresses.
- Draft boundary fixtures from OSM/geoBoundaries/HOT OSM and mark contested boundaries as neutral technical identifiers.
- Create README, sources.json, quality-gates.json, and synthetic fixtures before any remote repository creation.
