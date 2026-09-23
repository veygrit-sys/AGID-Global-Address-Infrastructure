# Liechtenstein Postal Context M2 pack

This directory publishes the current 2026-08-11 swisstopo official-directory
postcode perimeters for Liechtenstein as a digest-pinned M2 runtime pack. It
contains all 13 domicile-address PLZ4/PLZ6 suffix-00 polygons classified to
Liechtenstein by official municipality BFS codes 7001-7011 and joined to the
polygon layer with `ZIP_ID`. It contains no address, building or person rows.

The authority chain remains explicit:

- Swiss Post supplies shared CH/LI PLZ4 assignment and street evidence.
- swisstopo PLZO supplies official domicile-address locality and PLZ6
  perimeters for Switzerland and Liechtenstein.
- Liechtensteinische Post supplies local delivery endpoints and facilities.
- The Liechtenstein National Administration supplies official building
  addresses, public GWR identity, official-survey geometry, and boundaries.
- AGID supplies spatial indexing and cell relations, never postal assignment.

Shared Swiss-Liechtenstein sources are partitioned before publication. Every
selected `ZIP_ID` must resolve exclusively to BFS 7001-7011 rows. A blank
canton field, `94xx` syntax, or proximity to the border is insufficient on its
own. Swiss and Austrian features never enter the LI artifact, and LI features
never receive CH country or AGID identity.

An exact building requires the same official building identifier or a reviewed
explicit crosswalk. Address points, GWR coordinates, containment, and nearest
official-survey footprints remain candidates on their own. Facilities, PO
boxes, parcel terminals, company codes, and other special routing records stay
non-areal unless independent source evidence proves otherwise.

Reproduce the artifacts after expanding the pinned swisstopo Shapefile and
WGS84 CSV ZIPs:

```text
node scripts/build-postal-context-li-m2.mjs <AMTOVZ_ZIP.shp> <AMTOVZ_ZIP.dbf> <AMTOVZ_CSV_WGS84.csv> <output-directory> <report.json>
```

The synthetic fixtures remain behavior tests and never replace the real
descriptor. See `M2-SOURCE-NOTICE.md` and the `m2/` directory.
