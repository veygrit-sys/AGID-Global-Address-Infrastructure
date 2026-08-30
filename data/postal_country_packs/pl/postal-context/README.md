# `agid-postal-pl` contract seed

Status: `M1 metadata / no production Poland data`

This directory contains Poland-specific source policy and quality gates. It
does not contain the Poczta Polska PNA PDF, search results, purchased lists,
real addresses, credentials, production postcode geometry or a runtime pack.

## Authority boundary

- Poczta Polska establishes current PNA assignment and published
  locality/address membership. The canonical form is `NN-NNN`.
- A postal polygon requires a separate exact authoritative PNA
  Polygon/MultiPolygon feature. Poczta search rows, localities, address points,
  voivodeships, districts, communes and GUGiK PRG boundaries are not postal
  areas.
- Organization, route, P.O.-box, point, membership-only and unmatched codes
  remain explicit non-areas unless authoritative areal geometry exists.
- Postal Code -> Polygon -> Address Context remains an authority-separated
  chain. Postal evidence never creates a building or private address record.

## 2026-08-30 M2 audit

The current official PNA PDF is the July 2026 edition: 1,786 pages and
7,874,157 bytes, SHA-256
`42cac01f8e64ed7cf67d47aed8007b6f0d4e849a845accf3d1a91ebad3700cfe`.
Deterministic extraction found 121,627 PNA occurrences and 21,642 distinct
well-formed `NN-NNN` values, but no Polygon, MultiPolygon, GeoJSON or coordinate
terms. Poczta states that System PNA copyrights belong to it and that the
electronic list is purchased with quarterly updates. The PDF itself prohibits
reproduction, electronic processing, use in another publication and database
storage without written consent.

The current public search database reported 2026-08-30. A single non-personal
lookup for `00-940` returned six rows with PNA/name/locality/address and
administrative fields, but no geometry. This receipt does not establish a
complete denominator, redistribution right or postal area.

GUGiK documents reusable official administrative and address geometry, but no
authoritative postal-code area layer or fixed postcode-area artifact was
established. Administrative/address geometry was not relabelled or buffered.

Poland therefore remains `M1_metadata` and is blocked under
`M2_current_poland_pna_assignment_and_postcode_area_visualization`. See
`docs/postal-context-poland-m2.md` and `reports/postal-context-m2/`.
