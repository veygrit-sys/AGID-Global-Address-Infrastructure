# P0 Complete Country Pack: FM Federated States of Micronesia

Status: completed fourth P0 country slice.

## Scope

This pack turns `agid-open-fm-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public state coverage.

Included:

- country seed: Federated States of Micronesia
- all 4 FSM states as source-linked AGID place seeds
- synthetic conformance vectors for every state
- release gates for no raw personal addresses, source links, state code notes, ISO subdivision code notes, and fixture coverage

Excluded:

- raw personal addresses
- recipient records
- building/unit records
- private coordinates
- imported boundary geometry
- proof witnesses, private keys, or proof secrets

## State Coverage

The completed FM slice records these 4 state seeds:

| State | AGID feature class | GeoNames administrative code | ISO 3166-2 subdivision code |
| --- | --- | --- | --- |
| Kosrae | state | 01 | FM-KSA |
| Pohnpei | state | 02 | FM-PNI |
| Chuuk | state | 03 | FM-TRK |
| Yap | state | 04 | FM-YAP |

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- Official FSM Government website: `https://gov.fm/`
- GeoNames FM administrative division listing: `https://www.geonames.org/FM/administrative-division-micronesia.html`
- GeoNames Micronesia country metadata: `https://www.geonames.org/countries/FM/micronesia.html`
- Pacific RISA FSM profile: `https://www.pacificrisa.org/places/federated-states-of-micronesia/`

## Verification

Run:

```powershell
npm run verify:p0-fm-complete
npm run verify:p0-gazetteer
```

Verified properties:

- FM plan validates with zero repository-plan errors.
- FM contains exactly 4 state seeds.
- Every FM state is source-linked.
- Every FM state records a GeoNames administrative code note.
- Every FM state records an ISO 3166-2 subdivision code note.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every state and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public state seed pack, not a full address database. Municipality coverage, outlying island coverage, official boundary import, postal routing, multilingual alias expansion, and live geocoding require separate license review and import pipelines.
