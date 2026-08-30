# Lithuania Postal Context runtime

Status: `M1_metadata` (`M2` blocked on authenticated operator area rights and evidence)

The Lithuania pack connects Lietuvos paštas assignment evidence, Registrų
centras address points, NTR building boundaries, and AGID without collapsing
their different authority roles.

## Resolution chain

```text
Lietuvos paštas current rights-cleared assignment / geoArea
  -> LT-NNNNN postcode membership and truthful postcode surface
  -> Registrų centras Address Register point
  -> explicit registry identifier relation or reviewed crosswalk
  -> NTR building boundary
  -> AGID cell relation
```

The runtime normalizes `LT-12345`, `lt 12345`, `LT12345`, and bare `12345` to
`LT-12345`. Syntax validation never asserts that a code is currently allocated.

The operator's public search supports address-to-postcode and
postcode-to-address queries. Its current authenticated API also documents an
optional postcode `geoArea`, centre point and types `Post`, `PostBox`,
`Address`, and `BigCustomer`. All API communication requires authentication,
provider configuration and a Lietuvos paštas contract. Until a rights review
proves complete current coverage, postcode-area meaning and AGID processing,
serving and redistribution permission, the field remains unavailable M2
evidence. Endpoint and organization codes do not acquire invented areas.

Registrų centras publishes a CC BY 4.0 Address Register point model with
postcode and coordinates. Its current storage view reports no data, and even a
complete point release would remain civic-address authority rather than
postal-operator boundary authority. NTR building data separately provides
building geometry. Exact building display requires a stable source relation or
reviewed crosswalk; containment and nearest-footprint results remain
candidates. Administrative, settlement and street geometry is context only.

## Postal surfaces

A Lietuvos paštas `geoArea` can be official only after a complete current
response denominator proves its code type, postcode meaning, validity,
coverage, rights, byte digest and exception policy. A derived surface requires
separately pinned complete operator assignments and address points, remains
`derived` with `canonicalPostalGeometry: false`, and preserves source gaps and
conflicts. Buffers, Voronoi cells, administrative boundaries, buildings and
cross-border interpolation are prohibited substitutes.

## Repository and runtime boundary

The country repository owns source contracts, snapshots, rights,
normalization, lineage, validation and release descriptors. AGID loads an
attested descriptor and serves lookup, coordinate resolution, bbox
intersection, address/building context and AGID relations. Raw addresses,
restricted API responses, credentials, personal/customer data, cadastral and
land-right records stay outside the AGID repository.

Environment slots use `AGID_POSTAL_CONTEXT_LT_*`. Until a separately attested
M2 descriptor exists, Lithuania remains `unconfigured`; synthetic packs test
behavior only and never satisfy M2.
