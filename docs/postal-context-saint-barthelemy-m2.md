# Saint-Barthélemy Postal Context M2

## Outcome

Saint-Barthélemy (BL) reaches its country-specific M2 with the official La
Poste assignment 97133 and one real derived MultiPolygon display feature. La
Poste publishes no open postcode contour, so the map does not claim an
official postal boundary: the displayed surface is the current French
government commune/collectivity geometry for code 97701, joined to the one
official postcode row.

Postal assignment, geometry and address/building authority remain separate:

- official postcode assignment: La Poste 97701 Saint-Barthélemy to 97133;
- displayed surface: geo.api.gouv.fr administrative geometry, classified
  derived rather than official postal geometry;
- addresses, buildings, parcels, recipients, customers and land rights:
  absent.

## Current primary evidence and rights

Observed at 2026-08-31T10:26:19.045Z.

1. [La Poste Base officielle des codes postaux](https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux) was updated on 8 August 2026. Its complete CSV has 39,192 rows and exactly one 977-prefix commune row and one 97133 row: 97701, ST BARTHELEMY, 97133. The CSV SHA-256 is f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22.
2. [La Poste dataset metadata](https://datanova.laposte.fr/explore/dataset/laposte_hexasmal/) describes the publication as semiannual and explicitly says that postcode contours are not provided in open data. The fixed metadata SHA-256 is 1715e9fbe79c398f5619ef4b68b72a8a79c4c6491e43355288f1abee8b99ea1e.
3. [French government commune API documentation](https://geo.api.gouv.fr/decoupage-administratif/communes) defines GeoJSON responses by commune code and postcode. The fixed documentation SHA-256 is c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4.
4. The exact code query for 97701 and postcode query for 97133 each returned the same Saint-Barthélemy MultiPolygon. Their response SHA-256 values are c533f3763f6157fd8c6591da66f79309b0d7983dc452782529febf561bc20b4d and 1f85da8a2f7a5d9882cb920c5cc18dfaf723689badb80ea4e481b6eac2b1de62.
5. [Etalab Open Licence 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) permits reuse and redistribution with attribution. The fixed licence page SHA-256 is 6ec2b985b8f4585dd33f3ff4f3772379db2a1e3ab9945a83b5d976909379bc1c.

The exact source receipts total 1,879,646 bytes and remain outside Git. The
committed generated geometry retains provider identity, observation date,
licence and derived classification. It is not a postal, legal, survey,
cadastral or delivery boundary.

## Country-specific M2 definition

BL M2 requires the current complete La Poste denominator, explicit treatment
of the territory's single postcode, reusable real Polygon/MultiPolygon
geometry, fixed source receipts and hashes, reproducible no-coordinate-change
transformation, geometry and topology validation, a published immutable
artifact, and traversal through the real AGID runtime and application map.

Point, route, PO-box, organization, building, parcel, address, buffered,
hull, Voronoi, raster or synthetic surfaces do not pass. A future official
postal contour may supersede the derived surface only through a newly
source-reviewed release.

## Reproducible transformation

The builder scripts/build-postal-context-bl-m2.mjs requires all seven exact
receipt byte lengths and SHA-256 values. It validates both La Poste metadata
documents, the full CSV denominator, the single 97701 to 97133 row, the
government API documentation, Open Licence text and equality of the two
GeoJSON query results. It then serializes the source coordinates without
geometric modification.

The output has 21 polygon parts, 21 closed rings and 2,912 positions. Turf and
JSTS both accept the MultiPolygon. Bounds are
[-62.926554, 17.870779, -62.789086, 17.974092]. Calculated geodesic area is
20.439471117282295 square kilometres; the API reports 2,048.52 hectares. The
small difference is disclosed as a measurement/projection-method difference,
not silently reconciled. A second isolated build produced byte-identical
graph, geometry and descriptor artifacts.

## Application path

The committed descriptor loads through PostalContextPackRuntime. Country BL
and full-width or spaced input normalize only to 97133. The real Express
Postal Context route returns the derived MultiPolygon with source, reference
date, provenance derived, confidence 0.97 and separate assignment/geometry
authority fields.

The unchanged app conversion accepts only valid Polygon/MultiPolygon
geometry, calculates bounds and drives the map fit path. Deterministic map
verification confirms translucent fill opacity 0.22, outline opacity 0.95,
outline width 3, full removal on clear and successful re-search. The shared
path exposes loading, no-match, multiple-candidate, API-failure and
invalid-geometry states; the BL route test additionally proves an invalid
postcode returns 400 without an invented surface.

A browser E2E screenshot was not used. The real generated
descriptor-to-runtime-to-HTTP-route-to-map-layer path is tested directly and
deterministically.

## Validation

- BL-focused policy/repository/topology/route/map tests: 16 passed, 0 failed.
- Shared Postal Context runtime suite: 162 passed, 0 failed.
- Shared postal-area UI suite: 5 passed, 0 failed.
- TypeScript no-emit check: passed.
- Git whitespace/error diff check: passed.

Machine-readable build and validation evidence is in
reports/postal-context-m2/bl-current-single-postcode-2026-08-31.json and
reports/postal-context-m2/bl-validation-2026-08-31.json. The rollout ledger
pins their published commit URLs and SHA-256 digests.

## Delivery note and limits

This repository Markdown report is the intended technical/governance
deliverable as of 31 August 2026. No generic analytical-site renderer was
available, and creating a new public destination is outside the approved
scope. A chart was intentionally omitted because one postcode and one surface
provide no meaningful comparison and would imply false breadth.

M2 does not establish an official postcode boundary, street/address
assignment, building or parcel identity, recipient identity, land rights or
deliverability. The source-reported administrative surface is display context
only.
