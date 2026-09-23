# agid-open-cl-di-gazetteer

Desventuradas Islands (CL-DI) source-linked AGID gazetteer seed.

This repository records place names, AGID place identifiers, and geodata source
links for a P0 critical open-geodata gap. It is designed as a small,
reviewable country pack that can later be moved to GitHub as
`dawnportinfo-design/agid-open-cl-di-gazetteer`.

## Scope

- Country AGID: `agid:country:CL-DI`
- Priority: `P0-critical`
- Region kind: `territory`
- Purpose: Record source-linked place names and AGID place identifiers for countries with critical open-geodata gaps.

This pack stores place-name metadata and source links only. It does not store
raw personal addresses, recipient records, proof witnesses, private keys,
carrier operational records, or precise private coordinates.

## Complete Remote-Island-Group Slice

This pack is the forty-fifth complete P0 slice. It includes:

- the Desventuradas Islands territory seed
- Desventuradas Islands Archipelago, San Ambrosio Island, San Félix Island,
  González Islet, Roca Catedral, and Nazca-Desventuradas Marine Park public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert civilian settlement, facility status,
landing permission, access rights, route safety, postal validity, delivery
availability, or operational logistics.


## Files

- `manifest.json` - repository identity, AGID country link, and release gates
- `sources.json` - upstream geodata and license review ledger
- `data/place-seed.json` - source-linked place-name seed records
- `fixtures/gazetteer-conformance.json` - synthetic conformance vectors
- `quality-gates.json` - publication checks

## Publication Status

This is a seed repository. Source links are recorded, but full upstream data has
not been imported. Importing or bundling external data requires license review.
