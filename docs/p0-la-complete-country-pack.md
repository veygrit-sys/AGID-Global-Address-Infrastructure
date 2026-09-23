# P0 Complete Country Pack: Laos (LA)

Status: completed as the sixteenth P0 gazetteer rotation slice.

Repository prepared locally:

```text
data/open_geo_repositories/agid-open-la-gazetteer
```

## Scope

This pack records a source-linked first-order administrative seed layer for
Laos. It is designed for AGID place identification, multilingual address form
selection, postal/API compatibility work, and future district-level expansion.

Included:

- country seed: Laos
- all 17 province seeds
- Vientiane Capital as a distinct first-order capital/prefecture seed
- Vientiane Province as a separate province seed
- synthetic conformance vectors for every first-order division seed
- publication gates that block raw addresses, recipient records, private
  coordinates, witness material, private keys, proof secrets, and carrier
  operational records

Excluded for this slice:

- raw personal addresses
- recipient, resident, building, unit, or private coordinate data
- imported boundary geometry
- district, village, hamlet, route, postal, or building-level records
- live geocoding or delivery routing claims

## First-Order Coverage

| Seed | Type used in AGID seed | Source cross-check |
| --- | --- | --- |
| Attapu | province | OpenFactBook province list; GeoNames khoueng row |
| Bokeo | province | OpenFactBook province list; GeoNames khoueng row |
| Bolikhamxai | province | OpenFactBook province list; GeoNames khoueng row |
| Champasak | province | OpenFactBook province list; GeoNames khoueng row |
| Houaphan | province | OpenFactBook province list; GeoNames khoueng row |
| Khammouan | province | OpenFactBook province list; GeoNames khoueng row |
| Louang Namtha | province | OpenFactBook province list; GeoNames khoueng row |
| Louangphabang | province | OpenFactBook province list; GeoNames khoueng row |
| Oudomxai | province | OpenFactBook province list; GeoNames khoueng row |
| Phongsali | province | OpenFactBook province list; GeoNames khoueng row |
| Salavan | province | OpenFactBook province list; GeoNames khoueng row |
| Savannakhet | province | OpenFactBook province list; GeoNames khoueng row |
| Vientiane Capital | capital / prefecture | OpenFactBook prefecture list; GeoNames capital metadata |
| Vientiane Province | province | OpenFactBook province list; GeoNames khoueng row; disambiguated from capital |
| Xaignabouli | province | OpenFactBook province list; GeoNames khoueng row |
| Xekong | province | OpenFactBook province list; GeoNames khoueng row |
| Xiangkhoang | province | OpenFactBook province list; GeoNames khoueng row |
| Xaisomboun | province | OpenFactBook province list; GeoNames khoueng row |

## Source Links

- GeoNames LA administrative division listing: https://www.geonames.org/LA/administrative-division-laos.html
- GeoNames Laos country metadata: https://www.geonames.org/countries/LA/laos.html
- GeoNames Laos feature statistics: https://www.geonames.org/statistics/laos.html
- OpenFactBook Laos country profile: https://openfactbook.org/countries/laos/
- Open Development Mekong Laos administrative boundaries dataset: https://data.laos.opendevelopmentmekong.net/dataset/lao-administrative-boundaries-level-0-3

## Verification

Run:

```text
npm run verify:p0-la-complete
npm run verify:p0-gazetteer
```

The complete-pack test verifies:

- 18 first-order division seeds are present
- 17 province seeds are present
- Vientiane Capital is the only capital seed
- Vientiane Province is present separately
- no ambiguous bare `Vientiane` seed is used
- every first-order seed is source-linked
- every first-order seed records OpenFactBook and GeoNames cross-references
- generated conformance fixtures cover every first-order seed
- fixtures must not return raw address data

## Residual Risk

This is not a complete address, district, village, or boundary database. It is
a complete first-order AGID seed pack. The next improvement is a Laos
district-level pack with official boundary license review and romanization
fixtures for Lao and English address forms.
