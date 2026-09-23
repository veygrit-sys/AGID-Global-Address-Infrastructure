# P0 Complete Country Pack: Cambodia (KH)

Status: completed as a P0 gazetteer rotation slice.

Repository prepared locally:

```text
data/open_geo_repositories/agid-open-kh-gazetteer
```

## Scope

This pack records a source-linked ADM1 seed layer for Cambodia. It is designed
for AGID place identification, Khmer/English address form selection,
postal/API compatibility work, and later district/commune expansion.

Included:

- country seed: Cambodia
- Phnom Penh as the capital autonomous municipality seed
- all 24 province seeds
- synthetic conformance vectors for every ADM1 seed
- no raw address, recipient, private coordinate, witness, key, or proof-secret
  data

Excluded:

- raw personal addresses
- recipient, resident, building, unit, or private coordinate data
- imported boundary geometry
- districts, communes, villages, routes, postal records, or building-level
  records

## Source Links

- GeoNames KH administrative division listing: https://www.geonames.org/kh/administrative-division-cambodia.html
- GeoNames Cambodia country metadata: https://www.geonames.org/countries/KH/cambodia.html
- PCGN Cambodia toponymic factfile: https://assets.publishing.service.gov.uk/media/6a33d3aec6e94f095f3efa35/Cambodia_Toponymic_Factfile.pdf

## Verification

Run:

```text
npm run verify:p0-batch-21-24-complete
npm run verify:p0-gazetteer
```

The complete-pack test verifies 25 ADM1 seeds, Phnom Penh, 24 provinces, source
links, conformance fixtures, and the no-raw-address fixture boundary.

## Residual Risk

This is not a complete address, district, commune, village, route, postal, or
boundary database. It is a complete ADM1 AGID seed pack. The next improvement
is a district/commune pack with Khmer romanization fixtures and official
boundary license review.
