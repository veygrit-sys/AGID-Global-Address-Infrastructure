# Saint-Martin Postal Context M2

## Outcome

Saint-Martin (MF) reaches its country-specific M2 with the official La
Poste assignment 97150 and one real derived MultiPolygon display feature. La
Poste publishes no open postcode contour, so the map does not claim an
official postal boundary: the displayed surface is the current French
government commune/collectivity geometry for code 97801, joined to the one
official postcode row.

Postal assignment, geometry and address/building authority remain separate:

- official postcode assignment: La Poste 97801 Saint-Martin to 97150;
- displayed surface: geo.api.gouv.fr administrative geometry, classified
  derived rather than official postal geometry;
- addresses, buildings, parcels, recipients, customers and land rights:
  absent.

## Current primary evidence and rights

Observed at 2026-09-01T12:10:26.118Z.

1. [La Poste Base officielle des codes postaux](https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux) was updated on 8 August 2026. Its complete CSV has 39,192 rows and exactly one 978-prefix commune row and one 97150 row: 97801, ST MARTIN, 97150. The CSV SHA-256 is f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22.
2. [La Poste dataset metadata](https://datanova.laposte.fr/explore/dataset/laposte_hexasmal/) describes the publication as semiannual and explicitly says that postcode contours are not provided in open data. The fixed metadata SHA-256 is b5d6b5dcb421ece75d41b5903ded715a88df97ff1b4fa1f070e9fa7535167d65.
3. [French government commune API documentation](https://geo.api.gouv.fr/decoupage-administratif/communes) defines GeoJSON responses by commune code and postcode. The fixed documentation SHA-256 is c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4.
4. The exact code query for 97801 and postcode query for 97150 each returned the same Saint-Martin MultiPolygon. Their response SHA-256 values are a9bb4fe9659f892b9e4261de5a7f397302f7b221a8eab0f9fd523303b995c483 and 63c17509fd85d75e220878e17157d5361af4beed91b035d8308c2db5c841c26f.
5. [Etalab Open Licence 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) permits reuse and redistribution with attribution. The fixed licence page SHA-256 is dc47285333558593b1d0d163c9ca52708503419af0e99e3204a93b7f1eb9e821.

The exact source receipts total 1,844,285 bytes and remain outside Git. The
committed generated geometry retains provider identity, observation date,
licence and derived classification. It is not a postal, legal, survey,
cadastral or delivery boundary.

## Country-specific M2 definition

MF M2 requires the current complete La Poste denominator, explicit treatment
of the territory's single postcode, reusable real Polygon/MultiPolygon
geometry, fixed source receipts and hashes, reproducible no-coordinate-change
transformation, geometry and topology validation, a published immutable
artifact, and traversal through the real AGID runtime and application map.

Point, route, PO-box, organization, building, parcel, address, buffered,
hull, Voronoi, raster or synthetic surfaces do not pass. A future official
postal contour may supersede the derived surface only through a newly
source-reviewed release.

## Reproducible transformation

The builder scripts/build-postal-context-mf-m2.mjs requires all seven exact
receipt byte lengths and SHA-256 values. It validates both La Poste metadata
documents, the full CSV denominator, the single 97801 to 97150 row, the
government API documentation, Open Licence text and equality of the two
GeoJSON query results. It then serializes the source coordinates without
geometric modification.

The output has 11 polygon parts, 11 closed rings and 2,136 positions. Turf and
JSTS both accept the MultiPolygon. Bounds are
[-63.15332, 18.045903, -62.970711, 18.125195]. Calculated geodesic area is
53.649431807733244 square kilometres; the API reports 5,376.96 hectares. The
small difference is disclosed as a measurement/projection-method difference,
not silently reconciled. A second isolated build produced byte-identical
graph, geometry and descriptor artifacts.

## Application path

The committed descriptor loads through PostalContextPackRuntime. Country MF
and full-width or spaced input normalize only to 97150. The real Express
Postal Context route returns the derived MultiPolygon with source, reference
date, provenance derived, confidence 0.97 and separate assignment/geometry
authority fields.

The unchanged app conversion accepts only valid Polygon/MultiPolygon
geometry, calculates bounds and drives the map fit path. Deterministic map
verification confirms translucent fill opacity 0.22, outline opacity 0.95,
outline width 3, full removal on clear and successful re-search. The shared
path exposes loading, no-match, multiple-candidate, API-failure and
invalid-geometry states; the MF route test additionally proves an invalid
postcode returns 400 without an invented surface.

The app was started on its real Express runtime and exercised in Chromium
with an actual OpenStreetMap result. An explicit MF country filter initially
exposed an umbrella-country bug: the France label from the geocoder overrode
MF and sent the request to the FR route. The resolver now gives the single
explicit country filter precedence, with a regression test. The repeated
run issued two successful requests to `/api/v1/postal/MF/97150`, rendered the
derived MultiPolygon, removed it on clear, and restored it on re-search.

The supported interactive browser/image-inspection helper could not start
because its Windows sandbox ACL initialization failed after the documented
retry/reset sequence. Manual visual inspection is therefore **not claimed**.
The fallback evidence is deterministic Chromium rendering: the live DOM
reported MF 97150, MultiPolygon, derived, one area, the source identifier,
reference date and confidence 0.97; both API responses were 200; two map
canvases were present; clear/re-search passed; and a temporary 1440 x 1000
screenshot was captured but intentionally excluded from Git. The generated
descriptor-to-runtime-to-HTTP-route-to-map-layer path and map fit/paint
contract are also tested directly.

## Validation

- MF-focused policy/repository/topology/route/store tests: 12 passed, 0 failed.
- Shared Postal Context runtime suite: 162 passed, 0 failed.
- Shared postal-area UI suite: 7 passed, 0 failed.
- TypeScript no-emit check: passed.
- Git whitespace/error diff check: passed.

Machine-readable build and validation evidence is in
reports/postal-context-m2/mf-current-single-postcode-2026-09-01.json and
reports/postal-context-m2/mf-validation-2026-09-01.json. The rollout ledger
pins their published commit URLs and SHA-256 digests.

## Delivery note and limits

This repository Markdown report is the intended technical/governance
deliverable as of 1 September 2026. No generic analytical-site renderer was
available, and creating a new public destination is outside the approved
scope. A chart was intentionally omitted because one postcode and one surface
provide no meaningful comparison and would imply false breadth.

M2 does not establish an official postcode boundary, street/address
assignment, building or parcel identity, recipient identity, land rights or
deliverability. The source-reported administrative surface is display context
only.
