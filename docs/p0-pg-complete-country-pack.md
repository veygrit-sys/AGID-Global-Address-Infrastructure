# P0 Complete Country Pack: Papua New Guinea (PG)

Status: completed as a P0 gazetteer rotation slice.

Repository prepared locally:

```text
data/open_geo_repositories/agid-open-pg-gazetteer
```

## Scope

This pack records a source-linked first-order administrative seed layer for
Papua New Guinea. It is designed for AGID place identification, island/state
address forms, postal/API compatibility work, and later district/LLG expansion.

Included:

- country seed: Papua New Guinea
- 20 province seeds
- Bougainville as an autonomous region seed
- National Capital as a district/capital seed
- synthetic conformance vectors for every first-order seed
- publication gates for no raw addresses, no recipient records, no private
  coordinates, and no proof-secret material

Excluded:

- raw personal addresses
- recipient, resident, building, unit, or private coordinate data
- imported boundary geometry
- districts, local-level governments, wards, settlements, routes, postal
  records, or building-level records

## First-Order Coverage

The seed layer covers Chimbu, Central, East New Britain, Eastern Highlands,
Enga, East Sepik, Gulf, Hela, Jiwaka, Milne Bay, Morobe, Madang, Manus,
National Capital, New Ireland, Northern, Bougainville, Sandaun, Southern
Highlands, West New Britain, Western Highlands, and Western.

## Source Links

- GeoNames PG administrative division listing: https://www.geonames.org/PG/administrative-division-papua-new-guinea.html
- GeoNames Papua New Guinea country metadata: https://www.geonames.org/countries/PG/papua-new-guinea.html
- OpenFactBook Papua New Guinea country profile: https://openfactbook.org/countries/papua-new-guinea/
- Autonomous Bougainville Government quick facts: https://abg.gov.pg/about/quick-facts

## Verification

Run:

```text
npm run verify:p0-batch-17-20-complete
npm run verify:p0-gazetteer
```

The complete-pack test verifies 22 first-order seeds, 20 provinces,
Bougainville, National Capital, source links, conformance fixtures, and the
no-raw-address fixture boundary.

## Residual Risk

This is not a complete address, LLG, ward, or boundary database. It is a
complete first-order AGID seed pack. The next improvement is a district and LLG
pack with license-reviewed boundaries and multilingual aliases.
