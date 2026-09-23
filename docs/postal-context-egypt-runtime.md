# Egypt Postal Context runtime

Egypt is a seven-digit building-group addressing case. The July 2023 UPU/Egypt Post sheet defines a code composed of province (2), locality (1), neighbourhood (2), and community (2) digits. Egypt Post GIS guidance resolves the new code from GPS or a structured address. AGID keeps the returned assignment separate from geometry: an exact licensed Egypt Post surface may be canonical; an app point or generated building-group surface is not.

This is an M1 metadata and synthetic-runtime release. The 2026-09-03 M2 review remains blocked. It contains no current Egypt Post rows, real addresses, saved app locations, production polygons, CAPMAS features, Survey Authority features, buildings or personal data.

## Evidence and migration

1. UPU/Egypt Post establishes the current seven-digit syntax and hierarchy, not a complete assignment database or official polygon file.
2. A pinned official lookup result can establish its returned code and address or point for capture time. It does not establish a reusable national dataset or surface.
3. The UPU Universal DataBase Aug. 2026 table lists both `99999` and `9999999` for Egypt. Five- or six-digit codes therefore require an authoritative versioned crosswalk. AGID never pads, truncates or guesses an old value into seven digits.
4. CAPMAS administrative/statistical products and Egyptian Survey cadastral/topographic products remain independently licensed context.
5. Egy.List and other community files are candidate or discrepancy evidence only; they never outrank Egypt Post or prove the migration.
6. Any polygon generated from permitted points, building clusters, roads or administrative units is derived, non-canonical, uncertainty-bearing and versioned.
7. Exact building display requires separately licensed geometry plus a source-defined stable relation, common identifier or reviewed explicit crosswalk to the exact civic address.

## Resolution flow

`coordinate -> pinned Egypt Post result or exact civic-address point -> seven-digit building-group candidate -> locality/neighbourhood/community/governorate -> explicit address-building relation -> EG AGID cell`

AGID remains an independent spatial index. It never relabels an AGID cell, CAPMAS boundary, cadastral feature, nearest cluster, interpolation or model output as canonical postal geometry.

## M2 review result

Five official UPU/Egypt Post reference bodies totaling 3,278,046 bytes were fixed by SHA-256 and inspected, while the raw bodies remain outside Git. They confirm a live postcode system and the seven-digit hierarchy, but do not publish a complete current five/seven-digit assignment denominator, migration crosswalk, official Polygon/MultiPolygon release, or reuse terms compatible with AGID public serving. No official, derived or virtual surface is promoted.

Hugging Face, libpostal and other open-source components may improve Arabic/Latin parsing evaluation, candidate ranking, drift detection and topology anomaly review only after authority and rights gates. They cannot create an assignment, official boundary, licence, exact building relation or delivery fact.

M2 requires the complete current finite assignment/migration/exception denominator and exact same-code geometry in immutable versioned artifacts with processing, storage, derivative, redistribution and public-serving rights. The real app must then pass search, normalization, loading, no-match, multiple, failure, invalid geometry, fit, translucent fill/outline, metadata, clear and re-search checks. Retry after 2026-12-03T05:17:08.762Z or earlier only if a competent authority publishes a compatible release.

## Runtime configuration

```text
AGID_POSTAL_CONTEXT_EG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_EG_DESCRIPTOR_DIGEST
AGID_POSTAL_CONTEXT_EG_LKG_DESCRIPTOR_PATH
AGID_POSTAL_CONTEXT_EG_LKG_DESCRIPTOR_DIGEST
```

The standard endpoints accept `countryCode=EG` or `/api/postal/EG/{postcode}`. Geometry remains opt-in and preserves official versus derived evidence.
