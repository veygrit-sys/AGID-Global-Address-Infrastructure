# Lithuania Postal Context runtime

Status: `M1_metadata`

The Lithuania pack connects Lietuvos paštas assignment evidence, Registrų
centras address points, NTR building boundaries, and AGID without collapsing
their different authority roles.

## Resolution chain

```text
Lietuvos paštas lookup / rights-cleared source
  -> LT-NNNNN address membership
  -> Registrų centras Address Register point
  -> explicit registry identifier relation or reviewed crosswalk
  -> NTR building boundary
  -> AGID cell relation
```

The runtime normalizes `LT-12345`, `lt 12345`, `LT12345`, and bare `12345` to
`LT-12345`. Syntax validation never asserts that a code is currently allocated.

The operator's official lookup supports address-to-postcode and
postcode-to-address queries and returns code, post office, address, and
municipality fields. It is postal assignment evidence, not a canonical polygon.

Registrų centras publishes CC BY 4.0 Address Register points for parcels,
buildings, and premises. NTR open data separately provides nationwide,
municipality-partitioned registered building boundaries. Exact building display
requires a stable source relation or reviewed crosswalk; a point contained by or
nearest to a boundary remains a candidate. Administrative, settlement, and
street geometry is context only.

## Postal surfaces

A surface can be generated only when a pinned source proves complete postal
membership and address-point coverage. Inputs, method, exclusions, topology,
uncertainty, and digest are retained. The result remains `derived` and
`canonicalPostalGeometry: false`; gaps are not filled with municipality borders,
and delivery endpoints do not acquire residential areas.

## Repository and runtime boundary

The country repository owns source contracts, snapshots, rights, normalization,
lineage, validation, and release descriptors. AGID loads an attested descriptor
and serves lookup, coordinate resolution, bbox intersection, address/building
context, and AGID relations. Raw sources and restricted artifacts stay outside
the AGID repository.

Environment slots use `AGID_POSTAL_CONTEXT_LT_*`. Until a separately attested
M2+ descriptor exists, Lithuania remains `unconfigured`; synthetic packs are
tests only.
