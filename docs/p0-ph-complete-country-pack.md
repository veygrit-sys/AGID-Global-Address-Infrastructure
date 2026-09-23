# P0 Complete Country Pack: Philippines (PH)

Status: completed as a P0 gazetteer rotation slice.

Repository prepared locally:

```text
data/open_geo_repositories/agid-open-ph-gazetteer
```

## Scope

This pack records a source-linked current region seed layer for the
Philippines. It is designed for AGID place identification, local-language and
English address form selection, postal/API compatibility work, and later
province/city expansion.

Included:

- country seed: Philippines
- all 18 current region seeds
- Negros Island Region as a current region
- Bangsamoro Autonomous Region in Muslim Mindanao as the current autonomous
  region seed
- synthetic conformance vectors for every region seed
- publication gates for no raw addresses, no recipient records, no private
  coordinates, and no proof-secret material

Excluded:

- raw personal addresses
- recipient, resident, building, unit, or private coordinate data
- imported boundary geometry
- provinces, cities, municipalities, barangays, routes, postal records, or
  building-level records

## Current Region Coverage

The seed layer covers National Capital Region, Cordillera Administrative
Region, Ilocos Region, Cagayan Valley, Central Luzon, Calabarzon, Mimaropa,
Bicol Region, Western Visayas, Negros Island Region, Central Visayas, Eastern
Visayas, Zamboanga Peninsula, Northern Mindanao, Davao Region, Soccsksargen,
Caraga, and Bangsamoro Autonomous Region in Muslim Mindanao.

## Source Links

- PhilAtlas Philippines regions: https://www.philatlas.com/regions.html
- Philippine Statistics Authority Negros Island Region PSGC record: https://psa.gov.ph/classification/psgc/provinces/1800000000
- GeoNames PH administrative division listing: https://www.geonames.org/PH/administrative-division-philippines.html
- GeoNames Philippines country metadata: https://www.geonames.org/countries/PH/philippines.html

## Verification

Run:

```text
npm run verify:p0-batch-17-20-complete
npm run verify:p0-gazetteer
```

The complete-pack test verifies 18 current region seeds, current NIR and BARMM
coverage, stale ARMM exclusion, source links, conformance fixtures, and the
no-raw-address fixture boundary.

## Residual Risk

This is not a complete province, city, municipality, barangay, or boundary
database. It is a complete current-region AGID seed pack. The next improvement
is a province/city pack with PSGC fixture tests and multilingual address-form
aliases.
