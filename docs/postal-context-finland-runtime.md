# Finland Postal Context runtime

The Finland pack keeps Posti routing assignment, Statistics Finland Paavo
statistical geometry, DVV address/building identity, Ryhti building data, NLS
topographic evidence, administration and the FI/AX territory partition as
separate evidence layers.

```text
Posti five-digit assignment or special postal endpoint
  -> optional Paavo annual statistical postcode area (noncanonical)
  -> Posti street/house-number membership or allowed DVV/Ryhti address
  -> explicit stairway/apartment components
  -> permanent building identifier or source-defined relation
  -> exact rights-cleared Ryhti or other building feature
  -> FI AGID cell relation
```

## Postal assignment and Paavo geometry

Posti's Postal Code Data File establishes current five-digit codes valid as
addresses and their basic attributes. The Basic Address File adds municipality,
street and house-number-selection membership outside Aland. Both retain the
exact file, release/effective time, service description and terms, schema and
digest. Neither file contains map data, so neither creates a postcode polygon.

Statistics Finland's annual Paavo product supplies official-derived statistical
postcode areas under CC BY 4.0. These areas are generalized from postcodes of
building addresses in the Population Information System. An individual address
postcode does not itself form an area, and a building's statistical area may
differ from its address postcode. AGID therefore returns Paavo geometry as
`derived` and `canonicalPostalGeometry: false`, with the reference year and
sea-extended or coastline-clipped variant pinned. It is never described as a
Posti delivery perimeter. PO-box, corporate and dedicated codes remain non-area
unless independent authoritative geometry exists.

## Address, apartment and building precision

Posti Basic Address File proves routing membership, not a premise. DVV's
Population Information System Building and Dwelling Register can supply
authoritative building, dwelling, address and permanent identifiers under its
applicable controlled access. Apartment and stairway components may be shown
only from an exact allowed record and never identify residents, occupants,
recipients, households, owners or rightsholders.

Ryhti exposes open completed-building and building-address services, but the
exact endpoint/package, update time, municipal transition coverage and dataset
licence are pinned. Finland's municipal transition remains incomplete through
2028, and detailed fields may require a contract. Exact building output requires
a permanent building identifier or source-defined address-to-building relation.

NLS Topographic Database is open under CC BY 4.0 and provides road addresses,
buildings and administrative boundaries. Its road-address locations can be
calculated or interpolated and are not exact entrances. A topographic building
is an independent feature: proximity, parcel containment and text similarity
produce candidates only, never an exact link.

## CRS, Aland, licensing and runtime state

Paavo, Ryhti and NLS geometries retain their source CRS. ETRS89-TM35FIN
(EPSG:3067) is converted to WGS84 only through a reviewed, versioned transform.
Every artifact pins provider, exact URL, terms/licence, attribution, edition,
capture time, coverage, schema, CRS, transform and digest.

Posti's Basic Address File excludes Aland, while the Postal Code Data File has
only postcode-level Aland information. Aland Post evidence is partitioned as
AX. AGID never extrapolates mainland street membership or geometry into Aland
and never silently merges FI and AX address/building records.

The committed seed is `M1_metadata`: contracts and non-production synthetic
fixtures only. It contains no Posti, Paavo, DVV, Ryhti, NLS or Aland Post source
rows, no real address, no production geometry and no personal data. Finland
remains `unconfigured` until a separately released M2+ descriptor passes
integrity, assignment, statistical-semantics, rights, address/building-link,
privacy, coverage, territory, CRS, freshness and correction gates.
