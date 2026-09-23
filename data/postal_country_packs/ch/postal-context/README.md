# Switzerland Postal Context repository seed

This directory is the metadata-only seed for the planned `agid-postal-ch`
country repository. It defines Switzerland-specific source roles, rights and
attribution, four-digit NPA semantics, NPA6 refinement, PLZO official
perimeters, official building-address and GWR identity, phased
swissBUILDINGS3D geometry, exceptions, privacy boundaries, quality gates, and
non-geographic synthetic fixtures. It contains no Swiss Post rows, PLZO/GWR
records, real EGAID/EGID/EDID values, real addresses, private dwellings, or
production geometry.

## Authority model

```text
Swiss Post
  -> official NPA4/NPA6 assignment, postcode type, street/sorting and routing

swisstopo PLZO_CH
  -> official domicile-address locality and NPA4/NPA6 Polygon/MultiPolygon

Official building-address directory
  -> street + house number + locality/NPA4 + EGAID + EGID/EDID + entrance point

Federal GWR
  -> official building EGID and nationwide-unique EGID + EDID entrance identity

swissBUILDINGS3D 3.0 Beta
  -> exact building geometry where the pinned feature carries the same EGID

swissBOUNDARIES3D
  -> canton, district and municipality context, not postcode geometry

AGID cell cover
  -> candidate index followed by original geometry and identity checks
```

Assignment authority, geometry authority, product contract, OGD attribution,
source edition, postcode type, valid time, known time, country partition and
evidence purpose remain independent.

## Postal geometry

The public postcode is stored as a four-character string. The additional
Swiss Post two-digit component is stored separately as NPA6. A pinned monthly
PLZO_CH release is canonical public geometry for domicile-address postcode
types 10 and 20. It can contain Polygon or MultiPolygon locality/postcode
perimeters.

Professional, company, internal and administrative postcode types can be
absent from PLZO_CH. Their absence is evidence of a non-area or contract-only
routing record, not permission to generate an official-looking residential
polygon. Swiss Post GeoPost areas remain separately contracted products.

Municipality boundaries, address-point hulls, buffers, Voronoi output and AGID
cells are never substituted for PLZO_CH geometry.

## Address, entrance and building display

The official building-address directory is updated daily and supplies the
official street, house number, locality, NPA4, municipality, address status,
entrance location and source identifiers. `EGAID` identifies the building
address; `EGID` identifies the building; `EGID + EDID` uniquely identifies an
entrance throughout Switzerland.

The entrance point is not a building footprint. swissBUILDINGS3D 3.0 Beta can
provide definitive 3D building geometry only where the pinned feature contains
the identical EGID. EGID integration is phased by canton/tile, so a nearby
shape without the identifier remains candidate evidence.

Public AGID output excludes EWID dwelling identity, recipients, occupants,
owners, forwarding data, shipment data and non-public register attributes.

## Required exceptions

- Preserve leading zeroes and reject hyphenated input.
- Keep NPA4, the extra two NPA6 digits and postcode type distinct.
- Keep PLZO locality perimeters separate from municipalities.
- Treat special, professional, company and internal codes as non-areal unless
  separately licensed geometry proves otherwise.
- Preserve EGAID, EGID and EDID roles and every entrance branch.
- Never present an entrance coordinate as a building footprint.
- Require the same EGID for definitive swissBUILDINGS3D geometry.
- Record the beta product's EGID coverage by canton, tile and release.
- Apply the mandatory swisstopo source attribution.
- Keep Swiss Post contract products outside public artifacts unless reviewed.
- Filter Liechtenstein rows into a separately governed `LI` pack.

## Promotion

This seed is `M1_metadata`. Promotion requires pinned Swiss Post evidence,
PLZO and building-address releases, reviewed GWR access, swissBUILDINGS3D EGID
coverage receipts, swissBOUNDARIES3D context, model/CRS/digest and attribution
records, postcode-type classification, topology, EGAID and EGID/EDID uniqueness,
same-EGID building links, privacy and CH/LI partition review, independent
holdout results, correction and rollback flows, and two successful refreshes.

Files:

- `repository-manifest.json`: country contract and promotion gates.
- `source-profile.json`: Swiss Post, swisstopo and GWR evidence roles.
- `fixtures/switzerland-synthetic.json`: non-geographic conformance cases.
