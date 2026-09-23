# P0 Complete Country Pack: NC New Caledonia

Status: completed sixth P0 country slice.

## Scope

This pack turns `agid-open-nc-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public province coverage.

Included:

- country seed: New Caledonia
- all 3 New Caledonia provinces as source-linked AGID place seeds
- synthetic conformance vectors for every province
- release gates for no raw personal addresses, source links, province code notes, and fixture coverage

Excluded:

- raw personal addresses
- recipient records
- building/unit records
- private coordinates
- imported boundary geometry
- proof witnesses, private keys, or proof secrets

## Province Coverage

The completed NC slice records these 3 province seeds:

| Province | AGID feature class | GeoNames administrative code | GeoNames subentity code |
| --- | --- | --- | --- |
| Loyalty Islands Province | province | 03 | L |
| North Province | province | 01 | N |
| South Province | province | 02 | S |

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- Government of New Caledonia provinces page: `https://gouv.nc/gouvernement-et-institutions-les-autres-institutions/les-provinces`
- French State services in New Caledonia provinces page: `https://www.nouvelle-caledonie.gouv.fr/Services-de-l-Etat/La-Nouvelle-Caledonie/Institutions-du-territoire/Les-provinces`
- GeoNames NC administrative division listing: `https://www.geonames.org/NC/administrative-division-new-caledonia.html`
- GeoNames New Caledonia country metadata: `https://www.geonames.org/countries/NC/new-caledonia.html`

## Verification

Run:

```powershell
npm run verify:p0-nc-complete
npm run verify:p0-gazetteer
```

Verified properties:

- NC plan validates with zero repository-plan errors.
- NC contains exactly 3 province seeds.
- Every NC province is source-linked.
- Every NC province records a GeoNames administrative code note.
- Every NC province records a GeoNames subentity code note.
- NC does not claim ISO 3166-2 subdivision codes, because ISO 3166-2:NC has no official subdivision codes.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every province and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public province seed pack, not a full address database. Commune coverage, official boundary import, postal routing, multilingual alias expansion, and live geocoding require separate license review and import pipelines.
