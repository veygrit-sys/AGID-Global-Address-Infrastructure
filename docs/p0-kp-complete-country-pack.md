# P0 Complete Country Pack: North Korea (KP)

Status: completed as the fifteenth P0 gazetteer rotation slice.

Repository prepared locally:

```text
data/open_geo_repositories/agid-open-kp-gazetteer
```

## Scope

This pack records a source-linked first-order administrative seed layer for
North Korea. It is designed for AGID place identification, address validation
experiments, and future postal/API compatibility work where direct local open
geodata is weak.

Included:

- country seed: North Korea
- all 9 province seeds
- all 4 first-order special administration city seeds
- Pyongyang recorded as the capital first-order seed
- synthetic conformance vectors for every first-order division seed
- publication gates that block raw addresses, recipient records, private
  coordinates, witness material, private keys, proof secrets, and carrier
  operational records

Excluded for this slice:

- raw personal addresses
- recipient, resident, building, unit, or private coordinate data
- imported boundary geometry
- second-order city, county, district, town, village, or neighborhood records
- routing, sanctions, political, sovereignty, or logistics claims

## First-Order Coverage

| Seed | Type used in AGID seed | Source cross-check |
| --- | --- | --- |
| Pyongyang | capital / directly controlled city | OpenFactBook special administration city; GeoNames si row; PCGN centre note |
| South Pyongan | province | OpenFactBook province list; GeoNames province row; PCGN centre note |
| North Pyongan | province | OpenFactBook province list; GeoNames province row; PCGN centre note |
| Chagang | province | OpenFactBook province list; GeoNames province row; PCGN centre note |
| South Hwanghae | province | OpenFactBook province list; GeoNames province row; PCGN centre note |
| North Hwanghae | province | OpenFactBook province list; GeoNames province row; PCGN centre note |
| Kangwon | province | OpenFactBook province list; GeoNames province row; PCGN centre note |
| South Hamgyong | province | OpenFactBook province list; GeoNames province row; PCGN centre note |
| North Hamgyong | province | OpenFactBook province list; GeoNames province row; PCGN centre note |
| Ryanggang | province | OpenFactBook province list; GeoNames province row; PCGN centre note |
| Rason | special administration city | OpenFactBook special administration city; GeoNames si row; PCGN centre note |
| Nampo | special administration city | OpenFactBook special administration city; GeoNames si row; PCGN centre note |
| Kaesong | special administration city | OpenFactBook special administration city; GeoNames si row; PCGN reinstatement note |

This pack is intentionally neutral. It records technical place identifiers and
source links only. It does not decide or express any political position.

## Source Links

- GeoNames KP administrative division listing: https://www.geonames.org/kp/administrative-division-north-korea.html
- GeoNames North Korea country metadata: https://www.geonames.org/countries/KP/north-korea.html
- GeoNames North Korea feature statistics: https://www.geonames.org/statistics/north-korea.html
- OpenFactBook North Korea country profile: https://openfactbook.org/countries/north-korea/
- PCGN North Korea administrative divisions update: https://assets.publishing.service.gov.uk/media/626bbca9e90e0746cec75b2c/North_Korea_-_2017_annex_2021_update2.pdf

## Verification

Run:

```text
npm run verify:p0-kp-complete
npm run verify:p0-gazetteer
```

The complete-pack test verifies:

- 13 first-order division seeds are present
- 9 province seeds are present
- 4 special administration city seeds are present
- Pyongyang is the only capital seed
- every first-order seed is source-linked
- every first-order seed records OpenFactBook, GeoNames, and type notes
- Kaesong keeps the PCGN status note
- generated conformance fixtures cover every first-order seed
- fixtures must not return raw address data

## Residual Risk

This is not a complete address, settlement, or boundary database. It is a
complete first-order AGID seed pack. The next improvement is a second-order
division pack with city/county/district coverage and stricter romanization
fixtures.
