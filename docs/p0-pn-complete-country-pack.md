# P0 Complete Country Pack: PN Pitcairn Islands

Status: completed eighth P0 country slice.

## Scope

This pack turns `agid-open-pn-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public island-group coverage.

Included:

- country seed: Pitcairn Islands
- all 4 named islands in the Pitcairn Islands group as source-linked AGID place seeds
- Adamstown as the public capital/settlement seed
- synthetic conformance vectors for every island and the capital
- release gates for no raw personal addresses, source links, full island coverage, and no administrative-division overclaiming

Excluded:

- raw personal addresses
- recipient records
- resident records
- building/unit records
- private coordinates
- imported boundary geometry
- proof witnesses, private keys, or proof secrets

## Island Coverage

The completed PN slice records these 4 island seeds:

| Island | AGID feature class | Coverage note |
| --- | --- | --- |
| Pitcairn Island | island | only inhabited island |
| Henderson Island | island | official island group member |
| Ducie Island | island | official island group member |
| Oeno Island | island | official island group member |

The pack also records:

| Settlement | AGID feature class | Coverage note |
| --- | --- | --- |
| Adamstown | capital | public capital/only permanent settlement seed |

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- Official Government of the Pitcairn Islands website: `https://www.government.pn/`
- Visit Pitcairn Islands page: `https://www.visitpitcairn.pn/the-islands`
- GeoNames Pitcairn Islands country metadata: `https://www.geonames.org/countries/pn/pitcairn-islands.html`
- Statoids Pitcairn administrative division note: `https://statoids.com/upn.html`

## Verification

Run:

```powershell
npm run verify:p0-pn-complete
npm run verify:p0-gazetteer
```

Verified properties:

- PN plan validates with zero repository-plan errors.
- PN contains exactly 4 island seeds.
- PN contains exactly one Adamstown capital seed.
- Every PN island is source-linked.
- Every PN island explicitly avoids administrative-division code claims.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every island and the capital and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public island-group seed pack, not a full address database. It does not include full path/road/place-name coverage within Pitcairn Island, imported boundary geometry, marine reserve geometry, resident records, postal routing, delivery routing, multilingual alias expansion, or live geocoding. Administrative divisions are intentionally not claimed.
