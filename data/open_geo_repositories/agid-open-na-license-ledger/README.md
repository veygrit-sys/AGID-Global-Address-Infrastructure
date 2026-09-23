# agid-open-na-license-ledger

Namibia (NA) P2 medium AGID open-geodata seed package.

This package is metadata-first. It creates a repository-ready scaffold for source review, synthetic conformance, and future address-quality promotion without bundling upstream geodata.

## Scope

- Country or region code: `NA`
- Stage: `manual-fallback-reduction`
- Package kind: `license-ledger`
- Publication state: `seed-ready`

## Non-Claims

- This seed does not claim complete national address coverage.
- This seed does not prove delivery, postal, legal, or cadastral authority.
- This seed does not bundle upstream geometry or private coordinates before license review.
- Manual review remains part of the expected behavior until conformance fixtures pass.

## Required Files

- `sources.json` - source and redistribution review ledger
- `quality-gates.json` - promotion gates
- `fixtures/synthetic-candidate-conformance.json` - synthetic candidate tests
- `fixtures/source-confidence-conformance.json` - source confidence tests

## First Actions

- Create a source ledger with URL, license, attribution, update cadence, and redistribution status.
- Use synthetic test fixtures first; never publish raw personal recipient addresses.
- Add forward/reverse geocoding conformance vectors using coarse AGID cells and public place references.
- Create README, sources.json, quality-gates.json, and synthetic fixtures before any remote repository creation.
