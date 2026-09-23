# P0 Complete Country Pack: Kiribati (KI)

Status: completed as the fourteenth P0 gazetteer rotation slice.

Repository prepared locally:

```text
data/open_geo_repositories/agid-open-ki-gazetteer
```

## Scope

This pack records a source-linked Kiribati seed layer for AGID. It is designed
for open-source address validation, no-postcode country handling, and future
postal-equivalent generation.

Included:

- country seed: Kiribati
- all 5 Kiribati National Statistics Office district groupings
- all 33 Kiribati public island anchors
- capital seed: Tarawa
- synthetic conformance vectors for every district, island, and the capital seed
- publication gates that block raw addresses, recipient records, private
  coordinates, witness material, private keys, proof secrets, and carrier
  operational records

Excluded for this slice:

- raw personal addresses
- recipient, resident, building, unit, or private coordinate data
- imported boundary geometry
- local council and island-level delivery routing records
- live geocoding or postal-routing claims

## District Coverage

| AGID district seed | National Statistics Office district list |
| --- | --- |
| Northern Kiribati | Makin; Butaritari; Marakei; Abaiang; North Tarawa |
| South Tarawa | Tarawa Urban Council (TUC); Betio Town Council (BTC) |
| Central Kiribati | Abemama; Kuria; Aranuka; Maiana; Banaba |
| Southern Kiribati | Nonouti; North Tabiteuea; South Tabiteuea; Beru; Onotoa; Nikunau; Tamana; Arorae |
| Line and Phoenix | Kanton/Canton; Kiritimati; Tabuaeran/Fanning; Teraina/Washington Island |

## Island Coverage

This pack now records all 33 Kiribati public island anchors as source-linked
AGID place seeds. The island seeds are gazetteer anchors only. They do not claim
legal boundaries, parcel boundaries, delivery routing, access permission,
population, or private coordinates.

| Island group | Island anchors |
| --- | --- |
| Gilbert Islands and Banaba | Makin; Butaritari; Marakei; Abaiang; Tarawa Atoll; Maiana; Abemama; Kuria; Aranuka; Banaba; Nonouti; Tabiteuea; Beru; Nikunau; Onotoa; Tamana; Arorae |
| Line Islands | Kiritimati; Tabuaeran; Teraina; Malden Island; Starbuck Island; Flint Island; Vostok Island; Millennium Island |
| Phoenix Islands | Kanton Island; Enderbury Island; Birnie Island; McKean Island; Rawaki Island; Manra Island; Orona Island; Nikumaroro |

GeoNames records broader island-group and island layers separately. This pack
uses GeoNames as a cross-reference only; geometry import and island-level
delivery routing remain deferred until license review and route policy are
ready.

## Source Links

- Kiribati National Statistics Office district listing: https://nso.gov.ki/kiribati-districts/
- Kiribati National Tourism Office country overview: https://www.kiribatitourism.gov.ki/kiribati-pacific-ocean-location/
- GeoNames KI administrative division listing: https://www.geonames.org/KI/administrative-division-kiribati.html
- GeoNames Kiribati country metadata: https://www.geonames.org/countries/KI/kiribati.html
- GeoNames Kiribati statistics: https://www.geonames.org/statistics/kiribati.html
- Commonwealth Kiribati profile: https://thecommonwealth.org/our-member-countries/kiribati
- Australian DFAT Kiribati country brief: https://www.dfat.gov.au/geo/kiribati/kiribati-country-brief

## Verification

Run:

```text
npm run verify:p0-ki-complete
npm run verify:p0-gazetteer
```

The complete-pack test verifies:

- 5 district seeds are present
- 33 island seeds are present
- Tarawa is present as the only capital seed
- every district is source-linked
- every island is source-linked and records the no-boundary/no-delivery
  overclaim guard
- every district records the NSO list and GeoNames cross-reference
- generated conformance fixtures cover every district, island, and the capital seed
- fixtures must not return raw address data

## Residual Risk

This is not yet a complete island, settlement, building, or route database. It
is a complete district-level and all-island public gazetteer seed pack. The next
improvement is to add council/settlement layers, geometry checksums, and
route/delivery policy fixtures without importing raw personal address material.
