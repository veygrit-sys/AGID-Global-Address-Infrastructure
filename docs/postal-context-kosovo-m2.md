# Kosovo (XK) Postal Context M2 review

Observed at: `2026-08-31T04:57:44.714Z`
Result: **blocked / M2 unmet**

## Country-specific M2 definition

XK reaches M2 only when the current complete Posta e Kosovës five-digit assignment, alias, exception and explicit non-area denominator is fixed under compatible rights and every normalized code is reconciled to an immutable, valid and rights-cleared Geoportal `PostalZone` Polygon/MultiPolygon or a postal-source-grounded non-area reason. Level, parentage, duplicates, CRS, topology, date, edition, SHA-256, official/derived/virtual class, confidence and exceptions must remain explicit. The artifact must drive the real XK API and application search, fit, translucent fill, clear outline, reset and provenance/error states. Dynamic WMS/GetFeatureInfo output, Level-1 zones, offices, points, administrative areas, addresses, buildings, parcels and synthetic geometry are insufficient.

## Official evidence inspected

- Posta's current postal-code page embeds 133 unique five-digit assignments across seven regions. The exact HTML is 132,695 bytes, `sha256:71518f0ba424d46c6c92238720b809af7ab3473721f46e13c2d69c7cd9a3c569`, and advertises no geometry.
- The current Posta site and postal-service terms were pinned. They establish public access and service terms, but no resource-specific grant for AGID processing, storage, derivation, redistribution and public serving was found.
- The official Geoportal configuration points at `/kgp`; its public Layer API returns 98 records and identifies `PostalZone` and `ZyratPostare` under one postal parent.
- A dynamic WMS GetFeatureInfo receipt returned two duplicate Level-1 `Prishtinë`/`10000` EPSG:4326 `MultiPolygon` features with finite, closed rings. A GetMap receipt rendered actual translucent postal-zone fill and visible boundaries. These prove that real geometry exists; they do not prove a fixed complete release or all-code coverage.

## Why M2 remains blocked

The 133-code operator denominator was not reconciled to a fixed Geoportal export. The dynamic Geoportal endpoint exposes duplicate features and level/parent semantics but no immutable versioned artifact, stable schema contract or complete coverage evidence. Resource-specific Geoportal and Posta rights compatible with AGID public serving were not established. Consequently zero source records are production-eligible and no raw source body or geometry was committed.

No municipality, settlement, postal office, address, building, parcel, Point, buffer, hull, Voronoi/raster cell, WMS image or synthetic fixture was substituted for a postal perimeter. XK identity remains unchanged.

## Application status

Shared application contracts for Polygon/MultiPolygon validation, country/code normalization, loading, no-match, multiple, API failure, invalid geometry, fit, translucent fill, outline, clear and re-search remain verified. No approved XK runtime artifact exists, so a real XK API response, map rendering or browser E2E is not claimed.

## Reproduction and retry

Run `node scripts/inspect-postal-context-xk-sources.mjs --source-dir <temporary-source-directory>` against the eight exact receipts listed in `reports/postal-context-m2/xk-source-review-2026-08-31.json`. Retry no earlier than `2026-09-07T04:57:44.714Z`, after pending countries are traversed. Provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, a new publication destination or deployment requires explicit approval.
