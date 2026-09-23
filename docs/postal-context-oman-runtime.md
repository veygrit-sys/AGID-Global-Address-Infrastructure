# Oman Postal Context runtime

Oman is a post-office-routing and P.O.-box-first case. The January 2026 UPU country sheet defines a three-digit postcode, coded by post office and region, on its own line above the locality in a P.O. box address. The code is not inherently a surface. AGID therefore represents an exact permitted office location as `point`, or no canonical geometry, rather than manufacturing a postcode polygon.

This commit is an M1 metadata and synthetic-runtime release. It contains no current Oman Post rows, real P.O. boxes, subscribers, recipients, correspondence, production office points, administrative polygons, civic addresses, building features or personal data.

## Evidence layers

1. The UPU/Oman Post country sheet establishes the three-digit format and address-line semantics, not a current code table, subscriber assignment or geometry.
2. A pinned Oman Post office-locator record can establish its displayed office, code and point for the capture time. A point is not its service catchment or a postal polygon.
3. A P.O. box is a postal delivery endpoint. It does not identify a building, resident, recipient or footprint.
4. Building Number, Way Number and street/locality fields are separate physical-address evidence. The Gov.om building-numbering service documents a workflow, not reusable address rows or building geometry.
5. NCSI governorate and wilayat geometry is administrative context only. A boundary cannot silently become a post-office catchment.
6. Any surface generated from permitted office, delivery or address evidence is derived, non-canonical, uncertainty-bearing and versioned. Missing official geometry remains a gap.
7. Exact building display requires a separately licensed feature plus a source-defined stable relation, common identifier or reviewed explicit crosswalk to the exact civic address.

## Resolution flow

`coordinate -> exact permitted civic-address point or post-office point -> three-digit routing-code candidate -> locality/wilayat/governorate -> explicit civic-address/building relation -> OM AGID cell`

AGID reports its grid cell as an independent spatial index. It never relabels the cell, a wilayat, nearest-office partition, Voronoi cell or model result as canonical postal geometry.

## Licence, privacy, and CRS

- Oman Post website visibility does not authorize harvesting or republication. A separately controlling product licence or permission is required before source records enter a public pack.
- NCSI open-data policy does not automatically license every portal layer. The exact owner, dataset licence, edition, fields, CRS, attribution and digest are pinned.
- Subscriber, recipient, telephone, identity, account, P.O. box key, correspondence, shipment, residence, occupant, owner, title and query data never enter public artifacts.
- Every spatial artifact retains its source CRS, axis order, epoch and stated accuracy. ONGD17 or a product CRS is never relabelled WGS84; conversion requires a reviewed, versioned transform.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_OM_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_OM_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_OM_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_OM_LKG_DESCRIPTOR_DIGEST
```

The standard Postal Context endpoints accept `countryCode=OM` or `/api/postal/OM/{postcode}`. Geometry remains opt-in and retains its point-or-derived evidence classification.
