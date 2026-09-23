# agid-us-montana

AGID United States state repository seed for Montana.

This repository pack is public-safe by design. It contains state-level geography seeds,
gazetteer starter names, source metadata, quality gates, and conformance vectors. It does
not contain raw personal addresses, recipient records, proof witnesses, USPS delivery-point
payloads, or private-key material.

## Scope

- Country: United States (US)
- State: Montana (MT)
- Parent repository: agid-country-us
- Geometry seed: bbox + centroid only
- Gazetteer seed: state name, capital, and major city starters

## What This Is Not

- Not a complete address dataset.
- Not a USPS ZIP Code or delivery-point dataset.
- Not a legal boundary product.
- Not proof that every city seed is source-verified.
- Not a substitute for official Census, USPS, state, county, or municipal systems.

## Quality Gates

- no-raw-personal-addresses
- source-ledger-present
- state-bbox-centroid-present
- capital-seed-present
- major-city-seeds-present
- official-geometry-import-pending
- postal-operator-data-not-bundled
- license-review-before-geometry-import

## Next Import Tasks

- Attach reviewed TIGER/Line state boundary vintage and checksum.
- Import GNIS/Census place identifiers for every place seed.
- Add county-level and incorporated-place conformance fixtures.
- Add ZIP/ZCTA compatibility tests without bundling USPS restricted payloads.
- Add routing and POI graph links only after source-license review.
