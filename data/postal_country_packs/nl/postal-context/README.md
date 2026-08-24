# `agid-postal-nl` contract seed

Status: `M1 metadata / no production Netherlands data`

This directory is the lightweight seed for a future independent
`agid-postal-nl` repository. It contains source policy, quality gates, and
non-geographic synthetic fixtures only. It does not contain the PostNL
Postcode Table, copied API responses, BAG extracts, CBS GeoPackages, real Dutch
addresses, API keys, or production geometry.

The shared resolver remains in Address-Grid-ID. A future NL repository will
publish immutable, digest-addressed packs through the same country interface as
Japan and Singapore.

## Netherlands geometry rule

A PC6 postcode (`1234 AB`) is an address-range-first postal assignment. PostNL
describes the final letters as a group of roughly 25 homes, business premises,
or PO boxes. That grouping does not by itself define an official boundary.

```text
PostNL PC6 assignment/range
  -> BAG address + nummeraanduiding
  -> verblijfsobject / ligplaats / standplaats
  -> BAG pand footprint when a relationship exists
  -> optional CBS/Esri derived PC6 polygon
  -> AGID cell cover for candidate indexing
```

The sources stay independent:

- PostNL is authoritative for the postal assignment and delivery validation.
- BAG is authoritative for public registered addresses and building objects.
- CBS distributes PC4, PC5, and PC6 areas whose geometry is derived by Esri
  Nederland from BAG addresses. These areas are useful and redistributable with
  attribution, but remain `derived_geometry`, not PostNL official boundaries.

PC4 is a coarse numeric prefix. It must not be substituted for PC6 when
displaying an exact address or deciding a building.

## Source boundary

- PostNL's Postcode Table is licensed bulk data. PCT-R contains house-number
  and PO-box ranges; PCT-H contains address-level rows. Neither enters public
  artifacts without reviewed rights.
- PostNL Address Check requires an API key. Receipts may validate an assignment
  but are not silently converted into a public database.
- PDOK's BAG OGC API is unauthenticated, updated daily, and published under
  Public Domain Mark 1.0. It supplies public address points and building
  objects, not postal-operator geometry.
- CBS postcode GeoPackages are annual, require CBS and Esri Nederland
  attribution for map visualization, and have correction history. A build must
  pin the corrected release and digest before promotion.

## Address display ceiling

AGID may display street, house number, public addition, locality, municipality,
province, and a BAG building relation only when they belong to one coherent
source-backed path. A building label is not invented when BAG supplies only an
identifier and footprint. Occupants, recipients, phone numbers, delivery
instructions, and private unit semantics remain outside public artifacts.

## Production promotion

Promotion beyond M1 requires:

- reviewed PostNL contract and API conditions;
- pinned BAG and CBS releases, checksums, attribution, and correction status;
- exact PC6 + house-number + addition joins with unresolved conflicts retained;
- explicit `derived_geometry` labels on every CBS/Esri postal surface;
- PC4 and PC6 containment, topology, offshore, PO-box, and historical tests;
- independent holdout evaluation and two successful refreshes;
- no customer or occupant data in Git or public packs.

## Files

- `repository-manifest.json`: PC6/PC4 semantics, quality gates, and blockers.
- `source-profile.json`: conservative PostNL, BAG/PDOK, and CBS roles.
- `fixtures/netherlands-synthetic.json`: non-geographic range, polygon,
  building, PC4, PO-box, and change cases.
