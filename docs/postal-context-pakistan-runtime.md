# Pakistan Postal Context runtime

Pakistan uses five-digit postcodes. The UPU addressing sheet describes the first two digits as a routing district and the last three as a delivery post office. AGID preserves the complete code as a five-character string, including leading zeroes, and never turns those digit groups into geometry.

This is an M1 metadata and synthetic-runtime release. It contains no Pakistan Post directory rows, amendments, real addresses, recipients, customers, P.O. box holders, tracking data, census rows, Survey of Pakistan products, production polygons, buildings, owners, occupants or other personal data.

## Evidence and geometry

1. Pakistan Post publishes separate delivery and non-delivery post-office directories with delivery office, postcode, account office, province and attached branch-office code. A pinned row is typed routing evidence, not a polygon, delivery point or building.
2. Pakistan Post amendments change delivery and non-delivery assignments over time. A production release must pin the base directory, every applicable amendment, effective dates, schema and digests.
3. The UPU sheet establishes five-digit syntax, digit semantics and address layout. Its 2004 examples are not a current allocation database or geometry release.
4. Survey of Pakistan guidance records registration, official-base-map, vetting and licensing controls for covered geospatial activity. Public access, an API or mathematical generation is not automatic permission to publish a map.
5. Survey of Pakistan products and NSDI layers require exact product or layer authority, edition, coverage, approval, terms, CRS, scale, topology and digest before reuse.
6. PBS census blocks are enumerator-workload units and remain census context. They are not postcode polygons, delivery areas, addresses or buildings.
7. A derived postal surface records the exact assignment input, boundary inputs, method, uncertainty, exclusions, topology, time, CRS, rights, mapping compliance and digest and remains non-canonical.
8. Exact building display requires rights-cleared civic-address evidence, separately permitted building geometry and a source-defined stable relation or reviewed explicit crosswalk.

## Resolution flow

`coordinate -> official postal surface or permitted civic-address point -> typed delivery/non-delivery office assignment -> locality/district/province-or-territory -> explicit address-building relation -> PK AGID cell`

AGID remains an independent spatial index. It never relabels a routing prefix, office point, census block, administrative boundary, nearest building, Voronoi cell or model output as canonical postal geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_PK_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_PK_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_PK_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_PK_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=PK` or `/api/postal/PK/{postcode}`. Geometry remains opt-in and preserves official, derived and non-spatial evidence classes.

## M2 audit

The 2026-08-28 source audit remains blocked. Typed-office HTML counts, PDF/notice dates,
shared-code exceptions, missing amendment reconciliation and rights gates are documented in
[the Pakistan M2 review](postal-context-pakistan-m2.md). No production descriptor is activated.
