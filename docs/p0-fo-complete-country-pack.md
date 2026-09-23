# P0 Complete Country Pack: FO Faroe Islands

Status: completed ninth P0 country slice.

## Scope

This pack turns `agid-open-fo-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public main-island coverage.

Included:

- country seed: Faroe Islands
- all 18 Faroe Islands main islands as source-linked AGID place seeds
- Tórshavn as the public capital seed
- synthetic conformance vectors for every main island and the capital
- release gates for no raw personal addresses, source links, full main-island coverage, and no smaller-islet overclaiming

Excluded:

- raw personal addresses
- recipient records
- resident records
- building/unit records
- private coordinates
- imported boundary geometry
- municipality datasets
- smaller islets, skerries, and unverified microfeatures
- proof witnesses, private keys, or proof secrets

## Main-Island Coverage

The completed FO slice records these 18 main island seeds:

| Island | AGID feature class | Coverage note |
| --- | --- | --- |
| Streymoy | island | main island seed |
| Eysturoy | island | main island seed |
| Vágar | island | main island seed |
| Suðuroy | island | main island seed |
| Sandoy | island | main island seed |
| Borðoy | island | main island seed |
| Viðoy | island | main island seed |
| Kunoy | island | main island seed |
| Kalsoy | island | main island seed |
| Svínoy | island | main island seed |
| Fugloy | island | main island seed |
| Nólsoy | island | main island seed |
| Mykines | island | main island seed |
| Skúvoy | island | main island seed |
| Hestur | island | main island seed |
| Stóra Dímun | island | main island seed |
| Koltur | island | main island seed |
| Lítla Dímun | island | uninhabited main island seed |

The pack also records:

| Settlement | AGID feature class | Coverage note |
| --- | --- | --- |
| Tórshavn | capital | public capital seed on Streymoy |

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- Government of the Faroe Islands about page: `https://www.government.fo/en/foreign-relations/about-the-faroe-islands`
- Official site of the Faroe Islands: `https://www.faroeislands.fo/`
- Statistics Faroe Islands island geography page: `https://hagstova.fo/en/environment/geography/islands-mountains-islets-og-lakes`
- Visit Faroe Islands maps page: `https://visitfaroeislands.com/en/plan-your-stay/get-ready-for-your-trip/maps-of-the-faroe-islands`
- GeoNames Faroe Islands country metadata: `https://www.geonames.org/countries/fo/faroe-islands.html`
- GeoNames Faroe Islands feature statistics: `https://www.geonames.org/statistics/faroe-islands.html`

## Verification

Run:

```powershell
npm run verify:p0-fo-complete
npm run verify:p0-gazetteer
```

Verified properties:

- FO plan validates with zero repository-plan errors.
- FO contains exactly 18 main-island seeds.
- FO contains exactly one Tórshavn capital seed.
- Every FO main island is source-linked.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every main island and the capital and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public main-island seed pack, not a full address database. It does not include all 29 municipalities, all settlements, road/path datasets, imported boundary geometry, smaller islets and skerries, postal routing, delivery routing, multilingual alias expansion, or live geocoding.
