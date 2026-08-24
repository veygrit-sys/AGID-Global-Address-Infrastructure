# Liechtenstein Postal Context contract seed

This directory is the M1 metadata seed for the future `agid-postal-li`
country repository. It contains no Swiss Post or Liechtensteinische Post rows,
Liechtenstein National Administration records, real addresses, building
geometry, or production postal perimeters.

The authority chain remains explicit:

- Swiss Post supplies shared CH/LI PLZ4 assignment and street evidence.
- swisstopo PLZO supplies official domicile-address locality and PLZ6
  perimeters for Switzerland and Liechtenstein.
- Liechtensteinische Post supplies local delivery endpoints and facilities.
- The Liechtenstein National Administration supplies official building
  addresses, public GWR identity, official-survey geometry, and boundaries.
- AGID supplies spatial indexing and cell relations, never postal assignment.

Shared Swiss-Liechtenstein sources are partitioned before publication. A blank
canton field, `94xx` syntax, or proximity to the border does not prove that a
feature belongs to Liechtenstein. Swiss and Austrian features never enter the
LI artifact, and LI features never receive CH country or AGID identity.

An exact building requires the same official building identifier or a reviewed
explicit crosswalk. Address points, GWR coordinates, containment, and nearest
official-survey footprints remain candidates on their own. Facilities, PO
boxes, parcel terminals, company codes, and other special routing records stay
non-areal unless independent source evidence proves otherwise.

The synthetic fixtures test runtime behavior only and cannot promote a real
release. See `repository-manifest.json` and `source-profile.json` for gates.
