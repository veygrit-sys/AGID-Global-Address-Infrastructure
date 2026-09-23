# New Zealand Postal Context repository seed

This directory is the metadata-only seed for the planned `agid-postal-nz`
country repository. It defines New Zealand-specific source roles, licensing,
delivery-network semantics, exceptions, quality gates, and non-geographic
synthetic fixtures. It contains no NZ Post PNF or PAF rows, Address Checker
responses, LINZ rows, Stats NZ boundaries, real addresses, or production
geometry.

## Authority model

```text
NZ Post PNF
  -> official postcode assignment
  -> licensed urban/RD network geometry or box-lobby reference

NZ Post PAF / Address Checker
  -> official postal address validation
  -> restricted delivery fields and optional building name

LINZ NZ Addresses
  -> open official address point and address lifecycle

LINZ Building Outlines
  -> open roof outline, not an address link

Stats NZ SSGA
  -> statistical and administrative context

AGID cell cover
  -> candidate index followed by original geometry checks
```

Assignment authority, geometry authority, redistribution rights, and evidence
purpose remain independent on every assertion.

## Postal geometry

The licensed Postcode Network File is NZ Post's authoritative network
definition. Urban and Rural Delivery postcodes may have Polygon or
MultiPolygon geometry. PO Box and Private Bag postcodes identify a box lobby or
routing record and must not be rendered as a residential area merely because
they use four digits.

Open fallback geometry generated from LINZ addresses, roads, parcels,
statistical areas, buffers, Voronoi cells, or AGID cells is always
`derived_geometry`. It never inherits NZ Post authority.

## Address and building display

AGID may display a house number, suffix, road, suburb/locality, mailtown,
postcode, and building name only when they form one coherent evidence path.
LINZ address positions may represent a dwelling, access, frontage, property,
letterbox, or another positioning method. LINZ building outlines represent roof
outlines. Nearest or containing geometry therefore remains a candidate unless a
source-backed relationship resolves ambiguity.

## Required exceptions

- Leading zeroes remain part of the four-character postcode.
- RD number is a delivery round, not a house number.
- Rural mailtown is routing context and may differ from physical locality.
- PO Box and Private Bag records are non-premise and normally non-areal.
- API Restricted Data is not scraped, bulk-cached, or redistributed.
- Cook Islands, Niue, Tokelau, and other independent ISO territories use their
  own country packs.

## Promotion

This seed is `M1_metadata`. Promotion requires rights-reviewed and pinned PNF,
PAF/API, LINZ, and Stats NZ releases; complete four-digit normalization;
single/multipart topology validation; coherent address/building links;
restricted-data isolation; territory separation; independent holdout results;
and two successful refreshes.

Files:

- `repository-manifest.json`: country contract and promotion gates.
- `source-profile.json`: NZ Post, LINZ, and Stats NZ authority and rights.
- `fixtures/new-zealand-synthetic.json`: non-geographic conformance cases.
