# P0 Complete Country Pack: Indonesia (ID)

Status: completed as a P0 gazetteer rotation slice.

Repository prepared locally:

```text
data/open_geo_repositories/agid-open-id-gazetteer
```

## Scope

This pack records a source-linked first-order administrative seed layer for
Indonesia. It is designed for AGID place identification, Indonesian/English
address form selection, postal/API compatibility work, and later regency/city
expansion.

Included:

- country seed: Indonesia
- 35 province seeds
- Aceh and Yogyakarta as special-region seeds
- Jakarta as the capital district seed
- synthetic conformance vectors for all 38 first-order seeds
- no raw address, recipient, private coordinate, witness, key, or proof-secret
  data

Excluded:

- raw personal addresses
- recipient, resident, building, unit, or private coordinate data
- imported boundary geometry
- regencies, cities, districts, villages, routes, postal records, or
  building-level records

## Source Links

- GeoNames ID administrative division listing: https://www.geonames.org/id/administrative-division-indonesia.html
- GeoNames Indonesia country metadata: https://www.geonames.org/countries/ID/indonesia.html
- PCGN Indonesia toponymic factfile: https://assets.publishing.service.gov.uk/media/67852932c6428e0131881700/Indonesia_Toponymic_Factfile.pdf

## Verification

Run:

```text
npm run verify:p0-batch-21-24-complete
npm run verify:p0-gazetteer
```

The complete-pack test verifies 38 first-order seeds, 35 provinces, 2 special
regions, Jakarta capital district, source links, conformance fixtures, and the
no-raw-address fixture boundary.

## Residual Risk

This is not a complete address, regency/city, district, village, route, or
boundary database. It is a complete first-order AGID seed pack. The next
improvement is a regency/city pack with license-reviewed boundary sources and
Papua province split conformance checks.
