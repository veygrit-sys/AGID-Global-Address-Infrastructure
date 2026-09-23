# P0 Complete Country Pack: China (CN)

Status: completed as a P0 gazetteer rotation slice.

Repository prepared locally:

```text
data/open_geo_repositories/agid-open-cn-gazetteer
```

## Scope

This pack records a source-linked province-level compatibility seed layer for
China. It is designed for AGID place identification, multilingual address form
selection, postal/API compatibility work, and later province-prefecture-city
expansion.

Included:

- country seed: China
- 23 province compatibility seeds
- 5 autonomous region seeds
- 4 municipality seeds
- 2 special administrative region compatibility seeds
- synthetic conformance vectors for every province-level seed
- neutral notes for Taiwan, Hong Kong, and Macao so AGID does not assert
  sovereignty, legal routing authority, or production delivery coverage

Excluded:

- raw personal addresses
- recipient, resident, building, unit, or private coordinate data
- imported boundary geometry
- prefecture, county, township, postal, route, or building-level records
- any political or legal claim over disputed or separately published regions

## Source Links

- GeoNames CN administrative division listing: https://www.geonames.org/CN/administrative-division-china.html
- GeoNames China country metadata: https://www.geonames.org/countries/CN/china.html
- Administrative Division System, People's Republic of China: https://hrlibrary.umn.edu/research/china-admin.html

## Verification

Run:

```text
npm run verify:p0-batch-21-24-complete
npm run verify:p0-gazetteer
```

The complete-pack test verifies 34 province-level seeds, 23 provinces, 5
autonomous regions, 4 municipalities, 2 SAR compatibility seeds, neutral
sensitive-region notes, conformance fixtures, and the no-raw-address boundary.

## Residual Risk

This is not a complete address, boundary, prefecture, county, or postal
database. It is a province-level AGID compatibility seed pack. The next
improvement is a policy-aware split between mainland provincial packs,
standalone SAR packs, and disputed/neutral regional packs.
