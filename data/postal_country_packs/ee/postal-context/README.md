# Estonia Postal Context repository seed

This directory is the metadata-only seed for the planned `agid-postal-ee`
country repository. It defines Estonia-specific source roles, open-data
attribution, five-digit postcode semantics, AKS postal areas, ADS address and
building identity, service migration, privacy boundaries, exceptions, quality
gates, and non-geographic synthetic fixtures. It contains no Omniva rows, AKS
or ADS rows, EHAK features, real addresses, private units, or production
geometry.

## Authority model

```text
Omniva
  -> official postal-code management, search, downloads and routing rules

AKS postal-code assignments
  -> official current address-to-postcode evidence with ADR_ID

AKS Sihtnumbri alad
  -> official public Polygon / MultiPolygon postal-area geometry

ADS / AKS address objects
  -> official address, stable ADS_OID, version ADOB_ID, type and history

ADS building shapes
  -> official source-linked building point / polygon

EHAK administration
  -> county, municipality and settlement context, not postal geometry

AGID cell cover
  -> candidate index followed by original geometry and source-object checks
```

Assignment authority, geometry authority, object identity, redistribution
terms, valid time, known time, and evidence purpose remain independent.

## Postal geometry

A postcode is stored as a five-character string. The pinned AKS OGC
`Sihtnumbri alad` layer is the canonical public area source for an edition. A
code can have Polygon or MultiPolygon geometry. Omniva search and downloads
establish operator assignment and routing evidence but do not supply geometry.

EHAK boundaries, address-point hulls, buffers, Voronoi output and AGID cells are
never substituted for AKS postal areas. An experimental surface remains
`derived_geometry` and keeps the original inputs, rights, parameters, topology,
holdout results and version.

## Address and building display

ADS contains official addresses of cadastral parcels, residential and
non-residential buildings, dwellings and other building parts. `ADS_OID`
identifies an address object across versions; `ADOB_ID` identifies one version.
These identifiers, object type, legal-basis date, status, geometry and history
must survive ingestion.

The AKS postal-code extract contains current addresses, `ADR_ID`, postcode,
full and short address, and reference coordinates. It is not a historical
snapshot and its point does not automatically equal an entrance or footprint.

ADS building point and polygon layers can support a definitive building when
the address and geometry follow the same source object. Nearest or containing
geometry without that path remains a candidate. Public AGID resolution stops
at building or public entrance; dwellings, other private building parts,
occupants and owners stay purpose-scoped.

## Required exceptions

- Preserve leading zeroes and reject hyphenated input.
- Preserve multipart postal areas and original AKS geometry.
- Keep ADR_ID, ADS_OID and ADOB_ID semantics distinct.
- Use change/history services for historical queries; monthly postcode CSV is
  current-only.
- Preserve farm and named-place address structures without inventing a street.
- Treat parcel-machine, post-office, offload-postcode and Poste Restante records
  as facility/routing points, not residences or surrounding postal areas.
- Keep EHAK administrative areas separate from postal areas.
- Do not infer a building from proximity when no ADS source-object path exists.
- Migrate to In-AKS/AKS REST and OGC; do not hard-code retired ADS SOAP services.

## Promotion

This seed is `M1_metadata`. Promotion requires pinned Omniva evidence, AKS
postal assignments and areas, ADS address/building snapshots, EHAK context,
interface-generation and attribution records, five-digit normalization,
topology and containment validation, ADS identity continuity, source-linked
building paths, privacy review, independent holdout results, correction and
rollback flows, and two successful source refreshes.

Files:

- `repository-manifest.json`: country contract and promotion gates.
- `source-profile.json`: Omniva, AKS/ADS and EHAK source roles.
- `fixtures/estonia-synthetic.json`: non-geographic conformance cases.
