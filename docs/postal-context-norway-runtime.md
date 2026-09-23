# Norway Postal Context runtime

The Norway pack keeps Posten Bring four-digit assignment, Kartverket official
postcode areas, Matrikkelen addresses and dwelling units, building points,
licensed FKB footprints, administration and territory as distinct evidence.

```text
Posten Bring four-digit code + function category (G/P/B/S)
  -> official Kartverket postcode area, or explicit non-area
  -> Matrikkelen address ID + official address point
  -> optional address ID + dwelling-unit ID
  -> Matrikkelen building number and representation point
  -> separately licensed FKB footprint linked 1:1 by building number
  -> NO AGID cell relation
```

## Assignment and official postcode areas

The Posten Bring postcode register contains the postcodes used for addressing
mail in Norway, postal place, municipality code/name and function category.
`G` is street address, `P` is post-office box, `B` supports both and `S` is a
special-service code not used as an ordinary address. All codes remain
four-character strings so leading zeroes survive.

Kartverket publishes `Postnummerområder`, describing the official areal extent
of postcodes. The catalog explicitly states that post-office-box codes are
additional to those areas. Polygon coverage is therefore authoritative only
for a pinned feature in the official dataset; it is never fabricated for a
post-office box, special code, missing feature or stale assignment. The area
release is normally updated at month end except July and December.

## Address, dwelling unit and building precision

`Matrikkelen - Adresse` supplies official address identity, point geometry and
postcode-district membership. An official address may refer to a building,
building part, dwelling unit, property or another object, so an address point
alone is not a building footprint.

The apartment-level distribution adds a dwelling-unit number. Its composite
`addressId + bruksenhetId` (or corresponding UUIDs) establishes unit identity
when both are present; it does not identify an occupant, recipient or
household.

`Matrikkelen - Bygningspunkt` supplies building number, status, type,
representation point and address/property link identifiers. That is exact
building identity evidence but still not a footprint. `FKB-Bygning` supplies
detailed building geometry and a documented 1:1 link to Matrikkelen by
building number, but its distribution uses Norge digitalt terms and private
actors may need purchased access. FKB geometry is never bundled or exposed
until the exact access, licence and redistribution rights are pinned.

## APIs and licensing

Kartverket's public Address REST API is suitable for individual address lookup;
bulk refreshes use pinned Geonorge distributions. Each CC BY 4.0 artifact keeps
provider attribution, source URL, download time, release/reference time,
schema, CRS, reviewed transform, coverage and digest, and marks AGID changes.
The Posten register and FKB material remain in separate rights partitions.

Public artifacts exclude recipients, occupants, owners, rightsholders,
personal contacts, title/value information, access credentials, shipment data
and delivery instructions.

## Territory and runtime state

The Posten manual uses county-like codes for Svalbard and Jan Mayen, but states
that they are not ordinary counties. A source classification does not collapse
ISO `SJ` into `NO`. Every artifact records whether it covers mainland Norway,
Svalbard or Jan Mayen, and cross-territory joins require an explicit policy.

The committed seed is `M1_metadata`: contracts and non-production synthetic
fixtures only. It contains no postcode rows, official geometry, Matrikkelen or
FKB records, real addresses, personal data or credentials. Norway remains
`unconfigured` until a separately released M2+ descriptor passes integrity,
licence, assignment, geometry, address/building-link, privacy, coverage,
territory, CRS, freshness and correction gates.
