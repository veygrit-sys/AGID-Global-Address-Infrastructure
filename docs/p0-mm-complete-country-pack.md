# P0 Complete Country Pack: Myanmar (MM)

Status: completed as a P0 gazetteer rotation slice.

Repository prepared locally:

```text
data/open_geo_repositories/agid-open-mm-gazetteer
```

## Scope

This pack records a source-linked first-order administrative seed layer for
Myanmar. It is designed for AGID place identification, country-specific address
form selection, postal/API compatibility work, and later district/township
expansion.

Included:

- country seed: Myanmar
- all 7 region seeds
- all 7 state seeds
- Nay Pyi Taw as the Union Territory / capital seed
- synthetic conformance vectors for every first-order seed
- publication gates that block raw addresses, recipient records, private
  coordinates, witness material, private keys, proof secrets, and carrier
  operational records

Excluded:

- raw personal addresses
- recipient, resident, building, unit, or private coordinate data
- imported boundary geometry
- self-administered zones/divisions, districts, townships, wards, village
  tracts, routes, postal records, or building-level records

## First-Order Coverage

The seed layer covers Sagaing Region, Bago Region, Magway Region, Mandalay
Region, Tanintharyi Region, Yangon Region, Ayeyarwady Region, Kachin State,
Kayah State, Kayin State, Chin State, Mon State, Rakhine State, Shan State, and
Nay Pyi Taw.

## Source Links

- GeoNames MM administrative division listing: https://www.geonames.org/MM/administrative-division-myanmar-burma.html
- GeoNames Myanmar country metadata: https://www.geonames.org/countries/MM/myanmar.html
- GeoNames Myanmar feature statistics: https://www.geonames.org/statistics/myanmar.html
- Administrative geography of Myanmar cross-reference: https://geo.fyi/2020/12/16/administrative-geography-of-myanmar/

## Verification

Run:

```text
npm run verify:p0-batch-17-20-complete
npm run verify:p0-gazetteer
```

The complete-pack test verifies 15 first-order seeds, 7 regions, 7 states,
Nay Pyi Taw as capital/Union Territory, source links, conformance fixtures, and
the no-raw-address fixture boundary.

## Residual Risk

This is not a complete address, township, village, or boundary database. It is
a complete first-order AGID seed pack. The next improvement is a township-level
pack with official boundary license review and Myanmar/local romanization
fixtures.
