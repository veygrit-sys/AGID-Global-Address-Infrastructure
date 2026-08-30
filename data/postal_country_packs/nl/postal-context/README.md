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

## 2026-08-30 M2 audit

CBS corrected the 2025 PC5/PC6 publication on 18 August 2026. The pinned
2025-v1 PC6 ZIP contains a 626,851,840-byte GeoPackage with 465,935 unique
PC6 MultiPolygons in EPSG:28992. Every code matches the six-character format,
every geometry is non-empty and valid, and the full scan found 597,956 polygon
parts and 14,458,509 positions. CBS permits postcode-map distribution under
CC BY 4.0 NL with CBS and Esri Nederland attribution and explicitly labels the
surfaces as Esri Nederland geometry derived from BAG addresses.

Those surfaces do not complete Postal Context M2. The January 2026 PostNL
Postcode Table specification defines the current assignment denominator at
house-number/P.O.-box range or address level, including H, B and NAPO/N range
types. The current table is purchased and downloaded from a protected
environment; PostNL's public data terms restrict use to personal or strictly
internal purposes and prohibit reproduction or third-party availability. The
credentialed Address Check returns address fields and latitude/longitude
points, not postcode areas.

The authority gap is observable: the corrected CBS surface contains the public
PostNL headquarters address code `2521 CA`, but not its public P.O. box code
`2500 GG`. No PO box, NAPO, organization, reply/freepost, facility or
other non-geographic endpoint is assigned an invented area. No CBS geometry,
BAG point/building, PC4/PC5 unit, administrative/statistical/cadastral area,
buffer, hull, Voronoi/raster cell or synthetic fixture is promoted as PostNL
assignment.

The country therefore remains `M1_metadata` and is blocked under
`M2_current_netherlands_pc6_assignment_and_cbs_area_visualization`. See
`docs/postal-context-netherlands-m2.md` and the machine reports under
`reports/postal-context-m2/`. Raw CBS files are audit inputs only and are
not committed.
