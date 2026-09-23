# agid-open-mh-gazetteer

Marshall Islands (MH) source-linked AGID gazetteer seed.

This repository records place names, AGID place identifiers, and geodata source
links for a P0 critical open-geodata gap. It is designed as a small,
reviewable country pack that can later be moved to GitHub as
`dawnportinfo-design/agid-open-mh-gazetteer`.

## Scope

- Country AGID: `agid:country:MH`
- Priority: `P0-critical`
- Region kind: `country-or-main-region`
- Purpose: Record source-linked place names and AGID place identifiers for countries with critical open-geodata gaps.

This pack stores place-name metadata and source links only. It does not store
raw personal addresses, recipient records, proof witnesses, private keys,
carrier operational records, or precise private coordinates.

## Complete Country Slice

This pack is the tenth complete P0 country slice. It includes:

- the country seed
- all 24 Marshall Islands constitutional electoral districts / local-government units, source-linked and assigned AGID place IDs
- 34 base and associated atoll/island anchors under those districts, preserving combined-district non-claims
- conformance vectors for every constitutional district and atoll/island anchor seed


## Files

- `manifest.json` - repository identity, AGID country link, and release gates
- `sources.json` - upstream geodata and license review ledger
- `data/place-seed.json` - source-linked place-name seed records
- `fixtures/gazetteer-conformance.json` - synthetic conformance vectors
- `quality-gates.json` - publication checks

## Publication Status

This is a seed repository. Source links are recorded, but full upstream data has
not been imported. Importing or bundling external data requires license review.
