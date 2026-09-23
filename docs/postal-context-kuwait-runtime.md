# Kuwait Postal Context runtime

Kuwait uses a five-digit postal code, but a full code is not uniformly a polygon. The Ministry of Communications publishes one table by governorate, area and block number and a separate table by P.O. box-number range. The UPU sheet likewise distinguishes P.O. box or block, zone and sector coding.

AGID therefore records an assignment class for every pinned Ministry row. A block assignment can acquire an optional derived membership surface only from a separately rights-cleared, editioned boundary. A P.O. box range remains non-spatial routing evidence and never produces a catchment, home, recipient or building.

This is an M1 metadata and synthetic-runtime release. It contains no current Ministry rows, P.O. box subscribers, real PACI addresses, Civil IDs, parcels, production polygons, buildings, owners, tenants, tracking records or personal data.

## Evidence and geometry

1. The Ministry table is current assignment authority when an exact row, capture time, terms and digest are pinned. Public search does not prove bulk redistribution rights or geometry.
2. The UPU sheet defines five-digit placement and home/P.O.-box address structure. Its examples are not a current directory or surface.
3. PACI is the civil-address and automated-number authority. Public address identifiers may support explicit joins; Civil IDs, occupants, owners, tenants, leases and query history remain excluded.
4. Kuwait Finder is informational and supplied as-is; its boundary disclaimer prevents treating viewer lines as legal, surveying or canonical postal geometry.
5. Kuwait Municipality parcels and base maps use artifact-specific layers and Kuwait-specific CRS. A parcel is not automatically a postal block or building.
6. CSB Census 2011 geography is historical statistical context, not current postal assignment.
7. A permitted derived block surface records the Ministry row, boundary input, crosswalk, method, uncertainty, validity, CRS, topology, licence and digest and remains non-canonical.
8. Exact building display requires separately permitted geometry plus a source-defined PACI or Municipality identifier relation or reviewed explicit crosswalk.

## Resolution flow

`coordinate -> official postal surface or permitted PACI civic-address point -> five-digit block assignment or non-spatial P.O. box evidence -> block/area/governorate -> street/building/automated-number evidence -> explicit address-building relation -> KW AGID cell`

AGID remains an independent spatial index. It never relabels an AGID cell, block, parcel, census surface, viewer feature, nearest building, Voronoi cell or model output as canonical postal geometry.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_KW_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_KW_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_KW_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_KW_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=KW` or `/api/postal/KW/{postcode}`. Geometry remains opt-in and preserves official, derived and non-spatial assignment evidence.

## M2 evidence review

The [2026-08-28 source and partial-assignment review](postal-context-kuwait-m2.md)
keeps Kuwait at M1 / blocked. Its M2 criterion is complete licensed block and
P.O. box assignments, not geometry. Partial public UI observations do not
constitute national coverage or a production release; the Ministry catalog
remains metadata-only for validation until release evidence is complete.
