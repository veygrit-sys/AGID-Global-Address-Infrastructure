# P0 Complete Country Pack: LU Luxembourg

Status: completed fifth P0 country slice.

## Scope

This pack turns `agid-open-lu-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public canton coverage.

Included:

- country seed: Luxembourg
- all 12 Luxembourg cantons as source-linked AGID place seeds
- synthetic conformance vectors for every canton
- release gates for no raw personal addresses, source links, canton code notes, ISO subdivision code notes, and fixture coverage

Excluded:

- raw personal addresses
- recipient records
- building/unit records
- private coordinates
- imported boundary geometry
- proof witnesses, private keys, or proof secrets

## Canton Coverage

The completed LU slice records these 12 canton seeds:

| Canton | AGID feature class | GeoNames administrative code | ISO 3166-2 subdivision code |
| --- | --- | --- | --- |
| Capellen | canton | 04 | LU-CA |
| Clervaux | canton | 05 | LU-CL |
| Diekirch | canton | 06 | LU-DI |
| Echternach | canton | 07 | LU-EC |
| Esch-sur-Alzette | canton | 08 | LU-ES |
| Grevenmacher | canton | 09 | LU-GR |
| Luxembourg Canton | canton | 10 | LU-LU |
| Mersch | canton | 11 | LU-ME |
| Redange-sur-Attert | canton | 12 | LU-RD |
| Remich | canton | 13 | LU-RM |
| Vianden | canton | 14 | LU-VD |
| Wiltz | canton | 15 | LU-WI |

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- Luxembourg.lu territory page: `https://luxembourg.public.lu/en/society-and-culture/territoire-et-climat/territoire.html`
- GeoNames LU administrative division listing: `https://www.geonames.org/lu/administrative-division-luxembourg.html`
- GeoNames Luxembourg country metadata: `https://www.geonames.org/countries/LU/luxembourg.html`

## Verification

Run:

```powershell
npm run verify:p0-lu-complete
npm run verify:p0-gazetteer
```

Verified properties:

- LU plan validates with zero repository-plan errors.
- LU contains exactly 12 canton seeds.
- Every LU canton is source-linked.
- Every LU canton records a GeoNames administrative code note.
- Every LU canton records an ISO 3166-2 subdivision code note.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every canton and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public canton seed pack, not a full address database. Municipality coverage, official boundary import, postal routing, multilingual alias expansion, and live geocoding require separate license review and import pipelines.
