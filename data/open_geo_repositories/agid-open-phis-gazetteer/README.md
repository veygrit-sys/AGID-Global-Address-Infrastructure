# agid-open-phis-gazetteer

Pheasant Island (PHIS) source-linked AGID gazetteer seed.

This repository records place names, AGID place identifiers, and geodata source
links for a P0 critical open-geodata gap. It is designed as a small,
reviewable country pack that can later be moved to GitHub as
`dawnportinfo-design/agid-open-phis-gazetteer`.

## Scope

- Country AGID: `agid:country:PHIS`
- Priority: `P0-critical`
- Region kind: `special-region`
- Purpose: Record source-linked place names and AGID place identifiers for countries with critical open-geodata gaps.

This pack stores place-name metadata and source links only. It does not store
raw personal addresses, recipient records, proof witnesses, private keys,
carrier operational records, or precise private coordinates.

## Complete Condominium-Island Slice

This pack is the forty-third complete P0 slice. It includes:

- the Pheasant Island neutral special-region seed
- Pheasant Island Condominium, Bidasoa River Setting, Hendaye Shore, Irun Shore,
  and Hondarribia Reference public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert date-specific current authority,
border-crossing rights, public access, event access, postal validity, or delivery
availability.


## Files

- `manifest.json` - repository identity, AGID country link, and release gates
- `sources.json` - upstream geodata and license review ledger
- `data/place-seed.json` - source-linked place-name seed records
- `fixtures/gazetteer-conformance.json` - synthetic conformance vectors
- `quality-gates.json` - publication checks

## Publication Status

This is a seed repository. Source links are recorded, but full upstream data has
not been imported. Importing or bundling external data requires license review.
