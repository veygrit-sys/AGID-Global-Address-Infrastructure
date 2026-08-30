# `agid-postal-no` contract seed

Status: `M1 metadata / no production Norway data`

This directory contains Norway-specific source policy, quality gates and a
synthetic conformance fixture. It does not contain the Posten postcode
register, Kartverket Postnummerområder geometry, Matrikkelen rows, FKB
buildings, real addresses, credentials or a production data pack.

## Authority boundary

- Posten Bring establishes the current four-digit postcode, postal place,
  primary municipality reference and G/P/B/S function category.
- Kartverket `Postnummerområder` supplies official postcode-area geometry
  under CC BY 4.0. Post-office-box postcodes are additional and may have no
  area.
- Matrikkelen address, dwelling-unit and building-point products are separate
  address/building authorities. FKB footprints have separate access and reuse
  conditions.
- Postal area, municipality, address point, building point, building
  footprint and AGID containment never substitute for one another.
- Posten's county-like 21/22 classifications for Svalbard and Jan Mayen do not
  merge repository `NO` and `SJ` identities.

## 2026-08-30 M2 audit

The current public Posten file, effective 1 October 2025, contains 5,122
unique valid four-digit rows: 3,318 G, 1,740 P, 60 B and 4 S. Seven rows use
the county-like 21 Svalbard classification and one uses 22 Jan Mayen. The file
is a current assignment reference, but the reviewed public page and manual do
not establish dataset-specific permission for AGID transformation and public
serving. A free download is not treated as an open-data licence.

The Norwegian public-data catalogue identifies `Postnummerområder` as the
official postcode-area product, advertises monthly GeoJSON/GML/GDB/SOSI and
WFS/WMS access, and labels the distributions CC BY 4.0. During this run the
Kartverket WFS and download hosts timed out repeatedly. No fixed geometry body,
release digest or full Polygon/MultiPolygon topology audit was therefore
produced. The catalogue receipt does not substitute for the missing artifact.

No P/O-box or special area was invented. No municipality, address/building
point, FKB object, buffer, hull, Voronoi/raster cell or synthetic fixture was
promoted. The country remains `M1_metadata` and is blocked under
`M2_current_norway_assignment_and_official_area_visualization`. See
`docs/postal-context-norway-m2.md` and `reports/postal-context-m2/`.
