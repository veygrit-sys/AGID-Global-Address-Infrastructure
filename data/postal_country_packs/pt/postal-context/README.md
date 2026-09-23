# `agid-postal-pt` contract seed

Status: `M1 metadata / no production Portugal data`

This directory contains Portugal-specific source policy and quality gates. It
does not contain CTT search results, licensed address data, geographic-service
responses, real addresses, credentials, production postcode geometry or a
runtime pack.

## Authority boundary

- CTT establishes current `NNNN-NNN` assignment and postal designation. The
  public search is address-driven and separately supports P.O.-box lookup.
- A postal polygon requires a separate exact authoritative postcode
  Polygon/MultiPolygon feature. Search rows, postal designations, localities,
  parishes, municipalities, CAOP boundaries, cadastre, addresses and CTT door
  coordinates are not postal areas.
- P.O.-box, organization, route, point, membership-only and unmatched codes
  remain explicit non-areas unless authoritative areal geometry exists.
- Postal Code -> Polygon -> Address Context remains an authority-separated
  chain. Postal evidence never creates a building or private address record.

## 2026-08-30 M2 audit

Six exact CTT public HTML bodies were pinned by byte length and SHA-256. CTT
defines a seven-digit numeric code written `NNNN-NNN`, describes the code as
identifying a geographic area, and provides address and P.O.-box search. Those
pages do not provide a current complete assignment/exception distribution or
Polygon/MultiPolygon artifact.

CTT's geographic-services page explicitly describes database licensing,
supply of portions of its national address database, a requested information
area/detail and a minimum three-year need. Its webservices offer postal
addresses and optional georeferencing. The address-treatment page identifies
that georeferencing as WGS84 EPSG:4326 coordinates of the respective door: a
point, not a postcode area.

DGT states that CTT assigns postcodes and that DGT does not create or
otherwise intervene in postcode codes. DGT's open administrative, land-use,
cadastral and imagery data retain their own authority and were not relabelled
or buffered into postal areas.

Portugal therefore remains `M1_metadata` and is blocked under
`M2_current_portugal_postcode_assignment_and_authoritative_area_visualization`.
See `docs/postal-context-portugal-m2.md` and `reports/postal-context-m2/`.
