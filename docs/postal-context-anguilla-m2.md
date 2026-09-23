# Anguilla Postal Context M2

## Outcome

Anguilla (`AI`) reaches country-specific M2 with one official postal node, `AI-2640`, and two real derived `MultiPolygon` display features. The UPU evidence establishes that `AI-2640` is the single postcode for the whole territory. No official postal polygon was located, so the map does **not** claim one: it uses a fixed, reusable geoBoundaries ADM0 source as a derived whole-territory display surface.

Postal assignment, geometry and address/building authority stay separate:

- official postcode assignment: UPU dictionary assertion, geometry authority `none`;
- displayed surface: geoBoundaries-derived geometry, assignment authority `derived_spatial_assignment`, geometry authority `derived_geometry`;
- addresses, buildings, parcels, recipients, customers and land rights: absent.

## Current primary evidence and rights

Observed at `2026-08-31T06:30:16.139Z`.

1. [UPU General Addressing Issues](https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf), Universal POST*CODE DataBase, August 2026. It lists Anguilla among jurisdictions requiring a postcode and among jurisdictions with a single postcode for the whole territory: `AI-2640`. SHA-256 `ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d`.
2. [UPU Anguilla addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/aiaEn.pdf), 09/2017, corroborated by the current August 2026 database. It states that the whole territory has the single code `AI-2640` and documents its prefix/dash form. SHA-256 `6c7d3ec9cad17c159e4b66d85e319bbef9518edab4f1fde6f2a4bf136b9c8218`.
3. [UPU copyright policy](https://www.upu.int/en/legal/copyright) reserves reproduction and redistribution rights. Consequently the two PDF files are not committed; AGID stores only their URLs, editions, factual conclusions and digests.
4. [Anguilla Postal Service](https://www.aps.ai/) currently uses `AI-2640`. Its POCDS zones effective 2026-01-01 are fee/drop-off service zones and are expressly excluded from postcode geometry.
5. [geoBoundaries API metadata](https://www.geoboundaries.org/api/current/gbOpen/AIA/ADM0/) identifies `AIA-ADM0-96724787`, boundary year 2021, build 2023-12-12, one AIA ADM0 unit, and CC BY 4.0. Geometry is pinned to [commit `9469f09592ced973a3448cf66b6100b741b64c0d`](https://github.com/wmgeolab/geoBoundaries/commit/9469f09592ced973a3448cf66b6100b741b64c0d), SHA-256 `6fa5dff75ac3ab9d8064c46a5b6ec1d4e307e67d033d100f0a4a6f4b3aac1237`.
6. [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/legalcode.en) permits redistribution with attribution. AGID retains geoBoundaries identity, edition, commit, source year, digest and derived classification.

The raw source and reference downloads remain outside Git. The committed generated geometry is attributed to geoBoundaries and is not a postal, legal, survey, cadastral or delivery boundary.

## Reproducible transformation

`scripts/build-postal-context-ai-m2.mjs` requires the exact pinned GeoJSON digest. It verifies the AIA/ADM0 identity, 28 polygon parts, 10,606 positions, source bounds and the expected cross-part topology profile. Turf reports overlap pairs `4/5`, `6/15` and `18/19`, while JSTS accepts the original MultiPolygon. The builder changes no coordinate: source parts `5`, `15` and `19` form a second MultiPolygon, leaving 25 parts in the first.

Both output features pass Turf and JSTS validation. Their union bounds are `[-63.42901273399514, 18.155156419596608, -62.926366790615475, 18.595112128484345]`. Combined area is `74.862608789302 km²`; floating-point delta from the source is `1.4901161193847656e-8 m²`. A second isolated build produced byte-identical graph, geometry and descriptor digests.

## Application path

The committed descriptor loads through the shared `PostalContextPackRuntime`. A request for country `AI` and input `ＡＩ ２６４０` or `ai2640` normalizes to `AI-2640`, then the real Express Postal Context route returns both derived MultiPolygons with source, source date `2021`, CC BY 4.0 identifier, confidence `0.92` and authority fields.

The unchanged app conversion accepts only valid Polygon/MultiPolygon geometry, forms a two-feature collection, calculates union bounds, and drives the normal map `fitBounds` path. Deterministic map verification confirms fill opacity `0.22`, outline opacity `0.95`, outline width `3`, full removal on clear, and successful re-search. The shared app path already exposes loading, no-match, ambiguous/multiple, API failure and invalid-geometry states; the AI route test additionally proves invalid `AI-2641` returns a 400 without an invented surface.

A browser E2E screenshot was not used; the real generated descriptor-to-runtime-to-HTTP-route-to-map-layer path is tested directly and deterministically.

## Validation

- AI-focused policy/repository/topology/route/map tests: 16 passed, 0 failed.
- Shared Postal Context runtime suite: 162 passed, 0 failed.
- Shared postal-area UI suite: 5 passed, 0 failed.
- `tsc --noEmit`: passed.
- `git diff --check`: passed.

Machine-readable build and validation evidence is in `reports/postal-context-m2/ai-current-whole-territory-2026-08-31.json` and `reports/postal-context-m2/ai-validation-2026-08-31.json`. The rollout ledger pins their published commit URLs and SHA-256 digests.

## Remaining limits

M2 does not establish an official postcode boundary, street/address assignment, building identity, parcel identity, recipient identity or deliverability. A future official postal polygon supersedes the derived display surface only through a new source-reviewed release; it must not rewrite this release in place.
