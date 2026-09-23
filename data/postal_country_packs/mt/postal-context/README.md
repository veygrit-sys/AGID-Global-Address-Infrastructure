# Malta Postal Context repository seed

This directory is the metadata-only seed for a future `agid-postal-mt`
repository. It connects Malta to the shared Postal Context contract without
bundling MaltaPost results, official addresses, building geometry or personal
data.

## Evidence boundary

The production evidence path is:

```text
MaltaPost postcode assignment
  -> confirmed Office of the Address Registrar addressable object
  -> explicit address-to-building identifier or reviewed crosswalk
  -> pinned Planning Authority Buildings 2D footprint
  -> OAR and NSO geographic context
  -> optional derived postcode surface
  -> AGID cell cover
```

Each arrow requires its own source assertion. A postcode never supplies a door,
building or recipient. An address geocode never becomes a footprint. A nearby
building remains a candidate.

## Current register state

The Office of the Address Registrar replaced the Electoral Office Address
Management Unit and became the address authority. The 2025 regulations establish
address and related geospatial registers, with services moving to
`address.gov.mt` from 1 January 2026. The National Data Portal nevertheless says
its contents are work in progress and are not official records without a
confirmation request. Production promotion therefore requires a confirmed
release or receipt.

## Postal geometry

No reviewed official nationwide MaltaPost postcode polygon product is assumed.
The full postcode uses `AAA NNNN` and is modeled as address-range or delivery-
group assignment. A surface built from confirmed address points or ranges is
`derived_geometry`, opt-in and noncanonical. P.O. Box and facility routing remain
non-areal unless authoritative area evidence exists.

## Public boundary

Public artifacts may contain confirmed civic address components, public
geocodes, public building geometry and source provenance. Electoral-register,
person-register, resident, household, owner, identity-card, recipient,
forwarding, customer and shipment data are prohibited.

## Maturity

The current stage is `M1_metadata`. All fixtures are synthetic, contain no
upstream records and are ineligible for promotion. M2 requires pinned,
rights-reviewed and confirmed snapshots. M3 requires independent postcode,
address, building-link, privacy and freshness holdouts. M4 requires two
successful refreshes and tested rollback.

## 2026-08-30 M2 audit

The current MaltaPost finder bundle exposes versioned town, street, address and
search endpoints. The public API returned 89 towns, 116 streets for Il-Ħamrun
and three records for the operator's published example HMR 2042. Those records
are assignment responses only: the app contract and sampled responses contain
no Polygon, MultiPolygon or coordinate field and do not document a complete
ordinary-plus-exception allocation denominator.

The current OAR localities table contains 85 data rows with locality, local
council and region context only. It has no postcode or geometry column.
MaltaPost website terms restrict unaltered reproduction to personal,
non-commercial use or internal circulation, so this review did not infer a
dataset-specific bulk-processing, derivation, public-serving or redistribution
grant. No OAR locality/street record, address response, point, building,
administrative or statistical area, buffer, hull, Voronoi/raster cell or
synthetic fixture was promoted to a postcode area.

Malta therefore remains at M1_metadata and is blocked under
M2_current_malta_postcode_area_visualization. See
docs/postal-context-malta-m2.md and the corresponding source and engineering
reports under reports/postal-context-m2/. Raw finder responses and official
page bodies are not committed.
