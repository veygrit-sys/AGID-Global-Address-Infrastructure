# Falkland Islands Postal Context M2

## Outcome

The Falkland Islands (`FK`) reach country-specific M2 with one official postal node, `FIQQ 1ZZ`, and two real derived `MultiPolygon` display features. The country-specific UPU sheet establishes that `FIQQ 1ZZ` is the single postcode for the whole territory. No reusable official postal polygon was located, so the map does **not** claim one: it uses a fixed, reusable geoBoundaries ADM0 source as a derived whole-territory display surface.

Postal assignment, geometry and address/building authority stay separate:

- official postcode assignment: UPU dictionary assertion, geometry authority `none`;
- displayed surfaces: geoBoundaries-derived geometry, assignment authority `derived_spatial_assignment`, geometry authority `derived_geometry`;
- addresses, buildings, parcels, recipients, customers and land rights: absent;
- source identity: `FK` remains distinct and is not merged or relabelled.

## Current primary evidence and rights

Observed at `2026-09-01T01:11:41.684Z`.

1. [UPU Falkland Islands addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/flkEn.pdf), 08/2005. It states “Single postcode for the whole territory” and gives `FIQQ 1ZZ`. SHA-256 `315549e7306f606adf348c33bc2abaf3e474001e9a4146138b5e829f7d353a5d`.
2. [UPU General Addressing Issues](https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf), Universal POST*CODE DataBase, August 2026. It confirms a single code for the whole country or territory but prints `F1QQ 1ZZ`. The country sheet and current official-address evidence below establish `FIQQ 1ZZ`; AGID records `F1QQ 1ZZ` as a source exception and rejects it rather than silently normalizing it. SHA-256 `ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d`.
3. [Falkland Islands Government services](https://falklands.gov.fk/government-services) uses `FIQQ 1ZZ` throughout current contact addresses. The retrieved page had 25 `FIQQ 1ZZ` occurrences and one `F1QQ 1ZZ` occurrence, corroborating that the latter is a typo rather than a second code. SHA-256 `b07d24fe39f2c582c7d3634968187c5ad17ee1b7b14facb69a6562302ab632fb`.
4. [GOV.UK Governor's Office, Stanley](https://www.gov.uk/world/organisations/governors-office-stanley/office/governors-office-stanley) uses `FIQQ 1ZZ` and not `F1QQ 1ZZ`. SHA-256 `27e775bd2ff15d05faa4b8d86449989f969bac983eff36f1c085084aef07ddd2`.
5. [UPU copyright policy](https://www.upu.int/en/legal/copyright) reserves reproduction and redistribution rights. Consequently UPU PDFs and official page bytes are not committed; AGID stores only URLs, editions, factual conclusions and digests.
6. [geoBoundaries API metadata](https://www.geoboundaries.org/api/current/gbOpen/FLK/ADM0/) identifies `FLK-ADM0-20895774`, boundary year 2021, build 2023-12-12, one FLK ADM0 unit, and CC BY 4.0. The simplified geometry is pinned to [commit `9469f09592ced973a3448cf66b6100b741b64c0d`](https://github.com/wmgeolab/geoBoundaries/commit/9469f09592ced973a3448cf66b6100b741b64c0d), SHA-256 `4f584a9a08910fe7b3dd3fd7f279f84928646c37045ec3d199c184093b3c231b`.
7. [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/legalcode.en) permits redistribution with attribution. AGID retains geoBoundaries identity, edition, commit, source year, digest and derived classification.

The Falkland Islands Government data portal also lists a 2017 Falkland Islands boundary under CC BY-SA 4.0, but its CKAN API and resource server returned HTTP 503 during this run. Since fixed bytes and a digest could not be verified, that source was not used. The raw reviewed downloads remain outside Git.

## Reproducible transformation

`scripts/build-postal-context-fk-m2.mjs` requires the exact pinned simplified GeoJSON digest. It verifies FLK/ADM0 identity, 394 polygon parts, 16,194 source positions, bounds and the expected topology profile.

The source is land-cover-derived and excludes water through 488 interior rings containing 2,944 positions. One ring touches its outer ring; the shared AGID runtime rejects that topology even though Turf and JSTS accept it. Because the official code covers the whole territory rather than only land-cover pixels, the builder reproducibly omits all interior water-exclusion rings. It preserves every one of the 394 source outer rings and all 13,250 outer-ring positions without inventing coordinates. This fills 114.45298678976631 km² of source-excluded interior water and is explicitly classified as a derived display transformation.

After that water treatment, Turf reports six cross-part conflict pairs. Source parts `222`, `348` and `383` form a second MultiPolygon, leaving 391 parts in the first. Both output features pass the shared AGID topology validator, Turf and JSTS. Their union bounds are `[-61.45701982833657, -52.91753437962251, -57.7172582353046, -50.99732409384637]`; combined display area is `11,872.946669672885 km²`. A second isolated build must reproduce byte-identical graph, geometry and descriptor digests.

## Application path

The committed descriptor loads through the shared `PostalContextPackRuntime`. A request for country `FK` and input `ＦＩＱＱ １ＺＺ` or `fiqq1zz` normalizes to `FIQQ 1ZZ`, then the real Express Postal Context route returns both derived MultiPolygons with source, source date `2021`, CC BY 4.0 identifier, confidence `0.90` and authority fields. The documented typo `F1QQ 1ZZ` and unknown `FIQQ 1ZY` both return HTTP 400 with no fabricated surface.

The unchanged app conversion accepts only valid Polygon/MultiPolygon geometry, forms a two-feature collection, calculates union bounds, and drives the normal map `fitBounds` path. Deterministic map verification confirms fill opacity `0.22`, outline opacity `0.95`, outline width `3`, full removal on clear, and successful re-search. The shared app path exposes loading, no-match, ambiguous/multiple, API failure and invalid-geometry states and displays the selected postal code, geometry type, official/derived/virtual provenance, source, reference date and confidence.

A browser E2E screenshot was not used; the real generated descriptor-to-runtime-to-HTTP-route-to-map-layer path is tested directly and deterministically.

## Validation

Machine-readable build evidence is in `reports/postal-context-m2/fk-current-whole-territory-2026-09-01.json`. Machine-readable final validation evidence is in `reports/postal-context-m2/fk-validation-2026-09-01.json`. The rollout ledger pins their published commit URLs and SHA-256 digests.

Final verification passed 16 FK-focused assertions, 162 shared postal-context runtime assertions, and 5 deterministic map-conversion assertions, with zero failures. TypeScript completed without diagnostics, `git diff --check` was clean, and a clean rebuild reproduced byte-identical descriptor, graph, and geometry artifacts.

## Remaining limits

M2 does not establish an official postcode boundary, legal/survey/cadastral boundary, delivery zone, street/address assignment, building identity, parcel identity, recipient identity or deliverability. The display surface includes inland/excluded water as documented. A future fixed, reusable official postal or whole-territory boundary supersedes this derived display surface only through a new source-reviewed release; it must not rewrite this release in place.
