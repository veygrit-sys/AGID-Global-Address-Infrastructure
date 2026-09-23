# P0 Complete Country Pack: NR Nauru

Status: completed second P0 country slice.

## Scope

This pack turns `agid-open-nr-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public district coverage.

Included:

- country seed: Nauru
- all 14 Nauru districts as source-linked AGID place seeds
- synthetic conformance vectors for every district
- release gates for no raw personal addresses, source links, district code notes, and fixture coverage

Excluded:

- raw personal addresses
- recipient records
- building/unit records
- private coordinates
- imported boundary geometry
- proof witnesses, private keys, or proof secrets

## District Coverage

The completed NR slice records these 14 district seeds:

| District | AGID feature class | GeoNames administrative code |
| --- | --- | --- |
| Aiwo | district | 01 |
| Anabar | district | 02 |
| Anetan | district | 03 |
| Anibare | district | 04 |
| Baiti | district | 05 |
| Boe | district | 06 |
| Buada | district | 07 |
| Denigomodu | district | 08 |
| Ewa | district | 09 |
| Ijuw | district | 10 |
| Meneng | district | 11 |
| Nibok | district | 12 |
| Uaboe | district | 13 |
| Yaren | district | 14 |

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- Government of the Republic of Nauru all-district notice: `https://www.nauru.gov.nr/government-information-office/media-release/nauru-national-sustainable-development-strategy-public-consultation-covers-all-14-districts.aspx`
- GeoNames NR administrative division listing: `https://www.geonames.org/NR/administrative-division-nauru.html`
- GeoNames Nauru country metadata: `https://www.geonames.org/countries/NR/nauru.html`
- Statoids Nauru district reference: `https://statoids.com/unr.html`

## Verification

Run:

```powershell
npm run verify:p0-nr-complete
npm run verify:p0-gazetteer
```

Verified properties:

- NR plan validates with zero repository-plan errors.
- NR contains exactly 14 district seeds.
- Every NR district is source-linked.
- Every NR district records a GeoNames administrative code note.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every district and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public district seed pack, not a full address database. Village-level coverage, official boundary import, postal routing, multilingual alias expansion, and live geocoding require separate license review and import pipelines.
