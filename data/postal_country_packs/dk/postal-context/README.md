# Denmark Postal Context country seed

Status: `M1_metadata`

This directory is the reviewable seed for the future `agid-postal-dk`
repository. It contains contracts, source roles, quality gates and synthetic
fixtures only. It contains no PostNord, DAGI, DAR, BBR or GeoDanmark source rows,
real addresses, personal data or production geometry.

## Evidence chain

```text
four-digit Postnummer
  -> PostNord assignment and routing class
  -> DAGI Postnummerinddeling Polygon or MultiPolygon
  -> DAR address/Husnummer UUID and Adgangspunkt
  -> explicit DAR reference to BBR or GeoDanmark building
  -> pinned GeoDanmark building footprint
  -> DAGI administrative context
  -> AGID cell cover
```

Each arrow is independent evidence. A postcode area proves geographic
containment, not a house number, building, recipient or deliverability. The DAR
access point assigns postcode through the DAGI needle principle but is not a
footprint. Exact building display requires the explicit DAR/BBR/GeoDanmark
identifier path; containment and proximity produce candidates only.

## Postal geometry

DAGI `Postnummerinddeling` is the official area layer for PostNord-maintained
postcodes. Preserve local identifier, PostNord-defined name, four-digit string,
`ErGadepostnummer`, MultiSurface geometry, scale, geometry status, valid time
and registration time. Street postcodes in Copenhagen and Frederiksberg are
small road-based areas and must not be generalized to municipality boundaries.

Codes absent from the pinned area release remain classified as facility,
P.O. Box, special routing, historical, foreign-territory or unknown. No polygon
is invented. Any surface generated from address points is explicitly derived,
opt-in and never presented as DAGI or PostNord geometry.

## Address and building display

DAR is the official address register and supplies stable UUIDs, structured
address components, status, bitemporal lineage, an access point and its
technical standard. DAR can explicitly reference BBR and GeoDanmark buildings.
Only that source-backed relationship, or a reviewed identifier crosswalk,
permits exact building output. TA and UF access points may intentionally lack a
building and remain non-building or preliminary context.

## Rights and territory boundary

Every source is pinned with product-specific terms and attribution. The optional
CC BY 4.0 election for Klimadatastyrelsen free geographic data does not replace
the separate GeoDanmark terms. BBR fields are allow-listed independently.
Resident, owner, CPR/CVR, recipient, customer, forwarding, shipment and private
unit data are excluded.

The pack covers Denmark proper. Greenland and the Faroe Islands stay in their
separate `GL` and `FO` packs. Intake must migrate from retiring legacy
Datafordeler services before 15 January 2027 while preserving IDs and history.

## Promotion

Promotion beyond M1 requires pinned releases and digests, terms receipts,
reproducible transforms, postcode topology/classification, DAR point-to-area
checks, exact building-link precision, privacy and territory review, service
transition tests, independent holdouts, correction intake, rollback and two
successful refreshes.

Files:

- `repository-manifest.json`: Danish postcode, address and building rules.
- `source-profile.json`: PostNord, DAGI, DAR, BBR and GeoDanmark evidence roles.
- `fixtures/denmark-synthetic.json`: non-geographic conformance cases.
