# agid-open-cygl-gazetteer

Cyprus Green Line (CYGL) source-linked AGID gazetteer seed.

This repository records place names, AGID place identifiers, and geodata source
links for a P0 critical open-geodata gap. It is designed as a small,
reviewable country pack that can later be moved to GitHub as
`dawnportinfo-design/agid-open-cygl-gazetteer`.

## Scope

- Country AGID: `agid:country:CYGL`
- Priority: `P0-critical`
- Region kind: `disputed-region`
- Purpose: Record source-linked place names and AGID place identifiers for countries with critical open-geodata gaps.

This pack stores place-name metadata and source links only. It does not store
raw personal addresses, recipient records, proof witnesses, private keys,
carrier operational records, or precise private coordinates.

## Complete Buffer-Zone Slice

This pack is the thirty-second complete P0 slice. It includes:

- the Cyprus Green Line neutral buffer-zone seed
- the UN Buffer Zone and Nicosia Green Line anchors
- Ledra Palace, Ledra Street, and Pyla public anchors
- conformance vectors for every public anchor

The pack intentionally does not grant crossing rights, route permission,
property rights, or administrative recognition.


## Files

- `manifest.json` - repository identity, AGID country link, and release gates
- `sources.json` - upstream geodata and license review ledger
- `data/place-seed.json` - source-linked place-name seed records
- `fixtures/gazetteer-conformance.json` - synthetic conformance vectors
- `quality-gates.json` - publication checks

## Publication Status

This is a seed repository. Source links are recorded, but full upstream data has
not been imported. Importing or bundling external data requires license review.
