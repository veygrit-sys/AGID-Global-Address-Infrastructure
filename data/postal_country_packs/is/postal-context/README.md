# Iceland Postal Context repository seed

This directory is the metadata-only seed for the planned `agid-postal-is`
country repository. It defines Iceland-specific source roles, public-sector
reuse boundaries, three-digit postcode semantics, exceptions, quality gates,
and non-geographic synthetic fixtures. It contains no Pósturinn customer or
shipment data, IS 50V rows, HMS rows, Statistics Iceland rows, real addresses,
or production geometry.

## Authority model

```text
Pósturinn
  -> official postcode routing and rural-service classification

Náttúrufræðistofnun IS 50V postcode layer
  -> official public Polygon / MultiPolygon postcode geometry

HMS Staðfangaskrá
  -> official public address point, house number, postcode and coordinate type

Náttúrufræðistofnun IS 50V buildings
  -> topographic building candidate, not an address link

Statistics Iceland
  -> municipalities, urban nuclei and statistical context

AGID cell cover
  -> candidate index followed by original geometry checks
```

Assignment authority, geometry authority, redistribution terms, and evidence
purpose remain independent on every assertion.

## Postal geometry

The pinned IS 50V postcode layer is the canonical public geometry source for a
postcode release. A code may have Polygon or MultiPolygon geometry, including
disconnected islands or rural components. Pósturinn's public tables add routing
and service classification, but they are not scraped into an unversioned bulk
geometry set.

An AGID cell, municipality, urban nucleus, address-point hull, buffer, or
Voronoi surface is always `derived_geometry`. It never replaces the original
IS 50V polygon or inherits Pósturinn authority.

## Address and building display

HMS Staðfangaskrá publishes address identifiers, house number and suffix,
postcode, municipality, coordinate geometry, coordinate type, review state,
and estimated accuracy. Its coordinate can represent an estimated building
centre, main entrance, driveway, parcel interior, or estimated building site.

IS 50V buildings are topographic features at 1:50,000. Nearest or containing
geometry remains a candidate. AGID displays a definitive building only when a
source-backed path connects the HMS address identifier to that building.

## Required exceptions

- Store the three-digit postcode as a string.
- Preserve multipart rural and island geometry.
- Keep Pósturinn routing, IS 50V geometry and HMS assignment evidence separate.
- Preserve HMS coordinate type, review state, accuracy and stable identifiers.
- Do not infer a building from IS 50V proximity or containment alone.
- A selected Póstbox is a delivery preference, not a residence or premise
  postcode reassignment.
- Statistical municipalities and urban nuclei are not postcode boundaries.

## Promotion

This seed is `M1_metadata`. Promotion requires rights-reviewed and pinned IS
50V, HMS and Statistics Iceland releases; reviewed Pósturinn evidence;
three-digit normalization; topology validation; coherent address/building
links; independent holdout results; attribution; correction/rollback flows;
and two successful source refreshes.

Files:

- `repository-manifest.json`: country contract and promotion gates.
- `source-profile.json`: Pósturinn, IS 50V, HMS and Statistics Iceland roles.
- `fixtures/iceland-synthetic.json`: non-geographic conformance cases.
