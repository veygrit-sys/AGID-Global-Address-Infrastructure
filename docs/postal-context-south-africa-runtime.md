# South Africa Postal Context runtime

South Africa is a typed delivery-network case, not a uniform postcode-polygon case. The UPU country sheet defines four digits below the delivery locality or post-office name. For physical addresses the code identifies a delivery locality; for rural, PO Box and Private Bag addresses it identifies the delivery Post Office. AGID therefore keeps the delivery type and represents an exact permitted office location as `point`, an exact licensed postal area as `polygon`/`multipolygon`, or no canonical geometry.

This is an M1 metadata and synthetic-runtime release. It contains no current SAPO rows, real addresses, PO Box or Private Bag holders, production office points, administrative polygons, civic addresses, building features or personal data.

## Evidence layers

1. The UPU/SAPO country sheet establishes format and physical/rural/postal-delivery semantics, not a current assignment table or geometry.
2. A pinned SAPO record can establish its code, locality or post office and delivery type for the capture time. Website visibility does not grant bulk reuse.
3. PostaFind is third-party fallback evidence. It never outranks a pinned SAPO record and is not silently treated as SAPO authority.
4. NGI mapping, geodetic control, imagery and topography are separate evidence. Stats SA and municipal boundaries are administrative or statistical context, not postal areas.
5. Any polygon generated from permitted points, addresses, roads or administrative units is derived, non-canonical, uncertainty-bearing and versioned. Missing official geometry remains a gap.
6. Exact building display requires separately licensed geometry plus a source-defined stable relation, common identifier or reviewed explicit crosswalk to the exact civic address.

## Resolution flow

`coordinate -> exact permitted civic-address point or postal-office point -> typed four-digit postcode candidate -> delivery locality -> administrative context -> explicit address-building relation -> ZA AGID cell`

AGID reports its grid cell as an independent spatial index. It never relabels a cell, municipality, ward, main place, nearest-office partition, Voronoi cell or model result as canonical postal geometry.

## Licence, privacy, and CRS

- The Spatial Data Infrastructure Act, custodianship or portal access is not an automatic dataset licence. Exact product owner, licence, edition, coverage, fields, CRS, attribution, access and digest are pinned.
- Holder, recipient, contact, correspondence, shipment, residence, occupant, owner, tenant, title and query data never enter public artifacts.
- Every spatial artifact retains source CRS, axis order, epoch and accuracy. Hartebeesthoek94, Lo zones and product CRSs are never relabelled WGS84; conversion requires a reviewed transform.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_ZA_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_ZA_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_ZA_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_ZA_LKG_DESCRIPTOR_DIGEST
```

The standard Postal Context endpoints accept `countryCode=ZA` or `/api/postal/ZA/{postcode}`. Geometry remains opt-in and retains official-area, point or derived evidence classification.
