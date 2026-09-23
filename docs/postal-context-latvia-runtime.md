# Latvia Postal Context runtime

Status: `M1_metadata`

The Latvia pack connects Latvijas Pasts assignment evidence, the VZD State
Address Register, VZD cadastral building contours, and AGID without collapsing
their different authority roles.

## Resolution chain

```text
Latvijas Pasts directory / permitted validation receipt
  -> LV-NNNN assignment and membership type
  -> VZD address object and lifecycle
  -> explicit VZD cadastral relation
  -> cadastral building contour
  -> AGID cell relation
```

The runtime normalizes `LV-1234`, `lv 1234`, `LV1234`, and bare `1234` to
`LV-1234`. Syntax validation never asserts that a code is currently allocated.

Latvijas Pasts directories are the postal authority. Rīga listings can express
street and house-number sets, municipal listings can express locality coverage,
and special organization/institution codes can be non-areal. No reviewed
source in this contract publishes a canonical nationwide postcode boundary.

VZD open Address Register data is updated as a versioned civic registry and can
provide address code, full address, postcode attribute, lifecycle, coordinates,
and related cadastral objects. The postcode attribute is useful evidence but is
cross-checked against Latvijas Pasts for postal claims. VZD administrative
boundaries, villages, and road centerlines remain context only.

VZD cadastral data supplies building external contours. Exact building display
requires an explicit stable relationship from the address object to the
cadastral building. A point contained by or nearest to a footprint yields only
a candidate. Geometry accuracy and whether it was surveyed or vectorized remain
part of the evidence.

## Postal surfaces

A postal surface can be generated only when a pinned source release proves a
complete address-membership set. The build records inputs, method, exclusions,
topology, uncertainty, and digest. The result remains `derived` and
`canonicalPostalGeometry: false`; gaps are not filled with municipal boundaries
and organization or delivery-endpoint codes do not acquire residential areas.

## Repository and runtime boundary

The country repository owns source acquisition contracts, snapshots, rights,
normalization, lineage, validation, and published release descriptors. AGID
loads only an attested descriptor and serves lookup, coordinate resolution,
bbox intersection, address/building context, and AGID relations. Production raw
sources and restricted artifacts are not stored in the AGID repository.

Environment slots use `AGID_POSTAL_CONTEXT_LV_*`. Until a separately attested
M2+ descriptor exists, these fields remain unset and the service reports Latvia
as `unconfigured`; synthetic packs are tests only.
