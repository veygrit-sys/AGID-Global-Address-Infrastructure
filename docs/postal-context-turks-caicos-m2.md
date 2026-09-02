# Turks and Caicos Islands Postal Context M2

## Result

Turks and Caicos Islands (`TC`) reaches its country-specific M2 with the normalized postcode `TKCA 1ZZ` and 39 valid source-aligned derived surfaces bundled into two runtime `MultiPolygon` display features. Search responses expose the postal ID, official country context ID, geometry IDs, source digest, licence, date, confidence and pinned AGID release. The graph retains 27 stable government-source region IDs and their derived audit assertions, but the public lookup does not promote them as definitive postal or administrative contexts. The map conversion fits both geometry bundles' combined bounds and uses a translucent `0.22` fill with a clear `0.95` outline.

This is intentionally more detailed than a postcode label while preserving the authority boundary. The UPU assignment is official; the surface is derived from government shoreline and land-extent geometry. It is not represented as an official postal, delivery, legal, survey or cadastral boundary, and it proves no address, building, parcel, population, recipient or land right.

## Official postal evidence

1. [UPU Turks and Caicos Islands addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/tcaEn.pdf), edition 10/2025, retrieved `2026-09-02T08:30:58.215Z`. It specifies seven alphanumeric characters, a space before the final three characters and `TKCA 1ZZ` as the single postcode for the whole territory. The 176,872-byte PDF has SHA-256 `81411e006295b278736bdde53996cfcfa193ee3b27f6ea9b6764ef5f7f19cb48`.
2. [UPU General Addressing Issues](https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf), Universal POST*CODE DataBase August 2026, retrieved at the same time. Its single-code table corroborates TC; the 631,050-byte PDF has SHA-256 `ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d`. The newer country sheet controls the exact format.

UPU bytes are not redistributed. Only factual findings, edition, retrieval time, byte count, URL and digest are retained.

## Government geometry and rights

The official [Turks and Caicos Government Data Portal CKAN package](https://dataportal.gov.tc/api/3/action/package_show?id=shoreline-tci) identifies package `2dcdda81-48c8-4135-b233-c70e34b9c432`, resource `df348511-c995-413c-ac79-cf8b99e16ff2`, title `Shoreline and land exent of Turks and Caicos, 2020`, and portal licence identifier `cc-by-sa`. The exact 7,056-byte metadata response has SHA-256 `15f214ae2c43e62f6aa514b1f94373c1a5a7e2d27d6fbfaeadeea4e03c5bd1f7`.

The fixed [GeoJSON resource](https://dataportal.gov.tc/datasets/Shoreline.geojson), updated 2020-12-02, contains 861 source `MultiPolygon` features and 253,775 positions. The 11,623,218-byte response has SHA-256 `92a1fc68840bd3bd049e10e262610db31e92cb77e693b078dd74a1824149ba94`. The portal states Creative Commons Attribution Share-Alike without a version; AGID retains that exact unversioned declaration and does not silently substitute one.

The raw source body, population attributes and historical-population attributes are not committed.

## Reproducible transformation and polygon quality

[`scripts/build-postal-context-tc-m2.mjs`](../scripts/build-postal-context-tc-m2.mjs) performs the fixed transformation:

1. verify exact source and metadata SHA-256 values, feature counts and geometry type;
2. repair only source index 716 / `OBJECTID` 717 with `buffer(0)` because JSTS reports it invalid;
3. dissolve by all 27 government `Region` values;
4. keep the 14 Grand Turk source features separate because their dissolved result is invalid;
5. topology-preserving simplify at `0.0005` degrees (about 55 metres), repairing six explicitly recorded post-simplification invalid results;
6. exclude population and all non-spatial personal, address, building, parcel, customer and land-rights fields;
7. emit stable IDs, canonical JSON, digests and a deterministic build report.

The output has 39 `MultiPolygon` features, 848 polygon parts, 857 rings and 7,838 positions. Source index 101 / `OBJECTID` 102 collapses to a zero-area ring at the declared tolerance and is omitted rather than expanded or fabricated. Every feature passes Turf validity, JSTS validity and the shared AGID topology validator. Bounds are `[-72.48277771282113, 21.17765818467751, -71.07836651670135, 21.962492454937887]`. Output area is `933.8372453090698 km²`, a `+0.0640153695%` change from the repaired source area, within the documented simplification/repair envelope.

Five missing `OBJECTID` values and three repetitions of `OBJECTID` 853 do not become ambiguous public IDs: the builder retains fixed source indices internally and generates unique AGID geometry IDs.

## Runtime and UI contract

`TKCA1ZZ`, mixed case, ordinary spacing and NFKC full-width input normalize only to `TKCA 1ZZ`; any other code is rejected before geometry lookup. The API returns one postal object, the official country context/assertion and two derived geometry bundles containing all 39 source-aligned surfaces. The underlying graph also retains 27 source-region nodes and derived audit assertions for review without returning them as definitive lookup contexts. Each geometry exposes `MultiPolygon`, `derived`, source, resource date `2020-12-02`, confidence `0.90`, geometry ID and release identity.

The app conversion combines all features for `fitBounds`, keeps the background map visible with fill opacity `0.22`, draws outline opacity `0.95` at width `3`, and supports clear and re-search. It does not convert points, routes, P.O. boxes or organisations into areas.

## Verification record

The country suite covers normalization, descriptor/artifact digests, graph and ID linkage, repository rights, source exclusions, shared runtime loading, Turf/JSTS/shared topology, exact bounds and area, real HTTP API lookup, result-to-map conversion, translucent paint, union fit, clear, re-search and invalid-code rejection.

Automated browser initialization was attempted through the in-app browser harness, but its trusted Node process exited before a page connection was established. Human visual inspection therefore remains unperformed. That limitation is reported honestly: the fallback is deterministic verification of the same real API response and map-layer contract, not a claim of completed visual inspection.

The canonical descriptor digest is `sha256:bae55b493e9303a8d47bc20ef34371d56fbbcfcd9e012e0b8629b5ce8f4437ac`.
