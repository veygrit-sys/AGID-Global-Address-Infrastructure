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
