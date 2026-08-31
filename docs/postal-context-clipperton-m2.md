# Clipperton Island Postal Context M2

## Outcome

Clipperton Island (CP) reaches its country-specific M2 with the official La Poste assignment 98799 and one real derived Polygon display feature. La Poste publishes no open postcode contour, so the map does not claim an official postal boundary: the displayed surface is the current French government administrative geometry for current application code 98901, joined to the one official postcode row.

Postal assignment, geometry and address/building authority remain separate:

- official postcode assignment: La Poste 98901 ILE DE CLIPPERTON to 98799;
- displayed surface: geo.api.gouv.fr administrative geometry, classified derived rather than official postal geometry;
- addresses, buildings, parcels, recipients, customers and land rights: absent.

## Current primary evidence and rights

Observed at 2026-08-31T19:52:38.2058302Z.

1. [La Poste Base officielle des codes postaux](https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux) was updated on 8 August 2026. Its complete CSV has 39,192 rows and exactly one 98901 row and one 98799 row: 98901, ILE DE CLIPPERTON, 98799. The CSV SHA-256 is f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22.
2. Exact La Poste searches by postcode 98799, current application code 98901 and CLIPPERTON each return the same row. Their fixed response SHA-256 values are 276668cd0607355e35bf8abb27602857be5820b5cb8cca45426466817bcac077 and d44b0e7964cdc9234adea99cebe356f105f44059fe9cfbc504139174ab905a75.
3. [French government commune API documentation](https://geo.api.gouv.fr/decoupage-administratif/communes) defines GeoJSON responses by code and postcode. The exact 98901 and 98799 queries each returned the same Île de Clipperton Polygon; response SHA-256 values are 7ccf2420ff6b59a73b5ff2275d83758080b288ada3b8ebadec1ef7bfc8a740c8 and 5dcb3cf3c6564be2fb53cebc5319b618540c39d9747bc5d9a6eb7e925d08dacd.
4. [INSEE codification](https://www.insee.fr/fr/information/7929495) separates historical COG code 98799 from current five-position application code 98901; [COG 2026](https://www.insee.fr/fr/information/8740222) supplies the current edition. These are identity/history evidence, not postcode assignment authority.
5. [French Ministry of Armed Forces primary evidence](https://www.colsbleus.defense.gouv.fr/fr/pacifique-nord-oriental-clipperton-lile-des-fous) states that the island has no inhabitants and no habitation. No address or building is inferred.
6. [UPU General Addressing Issues](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/General-Addressing-Issues.pdf) lists a five-digit postcode length for Clipperton Island. The current table and two legacy sheets are used only for format/identity context, never assignment or geometry authority.
7. [Etalab Open Licence 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) permits reuse and redistribution with attribution. The fixed licence-page SHA-256 is 5c9f219a2566f7aeea5ada10df8b96131ea319853750beee06645b40cc8bdc8f.

The 15 exact source receipts total 2,845,023 bytes and remain outside Git. The committed generated geometry retains provider identity, observation date, licence and derived classification. It is not a postal, legal, survey, cadastral or delivery boundary.

## Country-specific M2 definition

CP M2 requires the current complete La Poste denominator, explicit treatment of the territory's single postcode and separate COG history, reusable real Polygon/MultiPolygon geometry, fixed source receipts and hashes, reproducible no-coordinate-change transformation, geometry and topology validation, a published immutable artifact, and traversal through the real AGID runtime and application map.

Point, route, PO-box, organization, building, parcel, address, buffered, hull, Voronoi, raster or synthetic surfaces do not pass. A future official postal contour may supersede the derived surface only through a newly source-reviewed release.

## Reproducible transformation

The builder `scripts/build-postal-context-cp-m2.mjs` requires all 15 exact receipt byte lengths and SHA-256 values. It validates both La Poste metadata documents, three exact search receipts, the full CSV denominator, the single 98901-to-98799 row, the government API documentation, Open Licence text, INSEE history/current-edition evidence, the uninhabited primary statement, PDF signatures and equality of the two GeoJSON query results. It then serializes the source coordinates without geometric modification.

The output has one polygon part, one closed ring and 110 positions. Turf and JSTS both accept the Polygon. Bounds are [-109.234607, 10.287154, -109.19979, 10.31957]. Calculated geodesic area is 8.889080340032724 square kilometres. A second isolated build produced byte-identical graph, geometry and descriptor artifacts.

## Application path

The committed descriptor loads through PostalContextPackRuntime. Country CP and full-width or spaced input normalize only to 98799. The real Express Postal Context route returns the derived Polygon with source, reference date, provenance derived, confidence 0.97 and separate assignment/geometry authority fields.

The unchanged app conversion accepts only valid Polygon/MultiPolygon geometry, calculates bounds and drives the map fit path. Deterministic map verification confirms translucent fill opacity 0.22, outline opacity 0.95, outline width 3, full removal on clear and successful re-search. The shared path exposes loading, no-match, multiple-candidate, API-failure and invalid-geometry states; the CP route test additionally proves an invalid postcode returns 400 without an invented surface.

A browser E2E screenshot was not used. The real generated descriptor-to-runtime-to-HTTP-route-to-map-layer path is tested directly and deterministically.

## Validation

- CP-focused policy/repository/topology/route/map tests: 9 passed, 0 failed.
- Shared Postal Context runtime suite: 162 passed, 0 failed.
- Shared postal-area UI suite: 7 passed, 0 failed.
- TypeScript no-emit check: passed.
- Git whitespace/error diff check: passed.

Machine-readable build and validation evidence is in `reports/postal-context-m2/cp-current-single-postcode-2026-09-01.json` and `reports/postal-context-m2/cp-validation-2026-09-01.json`. The rollout ledger pins their published commit URLs and SHA-256 digests.

The two relevant UPU PDFs were text-extracted, page-counted and rasterized at 150 DPI. Raster dimensions and non-white pixel counts were checked. Local visual-preview opening failed because of a Windows path-handling error, so the PDF evidence is deliberately limited to format/identity reference and cross-checked against the current La Poste assignment.

## Delivery note and limits

This repository Markdown report is the intended technical/governance deliverable as of 1 September 2026. No new public destination was created. A chart was intentionally omitted because one postcode and one surface provide no meaningful comparison and would imply false breadth.

M2 does not establish an official postcode boundary, street/address assignment, building or parcel identity, recipient identity, land rights or deliverability. The source-reported administrative surface is display context only.
