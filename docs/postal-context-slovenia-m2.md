# Slovenia Postal Context M2 evidence

## Decision

Slovenia (SI) remains **blocked / M2 unmet** under `M2_current_slovenia_assignment_crosswalk_and_area_visualization` as of 2026-08-31T00:49:09.000Z. The source-of-truth status command selected SI with no country in progress; no second country was started.

This is not a geometry-availability failure. GURS publishes 466 valid official `poštni okoliš` Polygon/MultiPolygon features under CC BY 4.0, and every GURS code occurs in the current Pošta Slovenije normal-postcode CSV. M2 still fails because 103 operator codes have no GURS geometry, the official current special-code PDF needed to classify those exceptions returns HTTP 404, Pošta assignment redistribution/public-serving permission was not established, and no complete approved artifact can drive the real application.

## Exact M2 definition

A current complete Pošta Slovenije four-digit normal and special-code denominator must be usable under explicit reviewed AGID processing, storage, derivation, redistribution and public-serving permission. Every area code must join through an explicit versioned code/identifier crosswalk to a valid GURS `poštni okoliš` Polygon/MultiPolygon. Organization, institution, postal-centre, P.O.-box, route, point, unmatched and other source-defined non-area records remain explicit.

The approved immutable artifact must pin provider, release/reference date, rights, attribution, byte length, SHA-256, schema, source CRS, reviewed transform, coverage, conflicts and exceptions. The real SI API/app must normalize optional `SI-` input to four text digits, return only valid real areas, fit the map, render a translucent fill with a clear outline, and expose selected code, geometry kind, official/derived/virtual class, source, reference date and confidence.

Absence of geometry, Points, unaddressed-mail delivery areas, administrative boundaries, buildings/parcels, buffers, hulls, Voronoi/raster cells and synthetic fixtures cannot satisfy M2.

## Authority and data-quality findings

| Gate | Source-backed observation | M2 effect |
|---|---|---|
| Current operator denominator | The Pošta CSV returned HTTP 200 with Last-Modified `2026-07-01T09:45:14Z`; Windows-1250/semicolon parsing yields 570 rows and 569 unique four-digit codes. Code `1002` occurs twice for Ljubljana and Ljubljana postal centre. | Fixes the observed normal-assignment body and duplicate, but not complete special/non-area semantics or publication rights. |
| Current exception release | The official addressing page links the special-code PDF, but that exact URL returned HTTP 404 with a 744-byte error body. No cached/indexed copy was substituted. | The 103 operator-only codes cannot be source-classified as special/non-area. Geometry absence is not proof. |
| Government postal geometry | GURS RPE declares `poštni okoliš`; WFS capabilities updateSequence 3921 expose `SI.GURS.RPE:POSTNI_OKOLISI`, default CRS EPSG:3794 and schema fields including `EID_POSTNI_OKOLIS`, `SIFRA`, `NAZIV`, `GEOM` and dates. | Establishes official spatial-register authority, not operator deliverability or special-code authority. |
| Geometry validation | Ten ordered pages contain all 466 unique features: 445 Polygon and 21 MultiPolygon, 489 polygons, 497 closed rings and 626,693 finite WGS84 positions. There are no duplicate feature IDs or geometry codes. | All 466 matched source geometries are technically usable once the complete denominator and rights pass. |
| Assignment crosswalk | All 466 GURS codes occur in Pošta CSV; no GURS-only codes exist. Pošta has 103 codes without GURS geometry and six normalized name mismatches among matched codes. | 466 code joins are evidenced, but the complete 569-code area/non-area denominator and mismatch review are not complete. |
| GURS rights | GURS public access describes free unregistered WFS/WMS access and CC BY 4.0 sharing/adaptation with attribution to GURS, data type and date/reference. | Compatible for the GURS geometry layer with attribution; it does not license Pošta assignments. |
| Pošta rights | The normal CSV is publicly downloadable, but no explicit reviewed terms authorizing AGID processing, storage, crosswalk/derivation, redistribution and public serving were established. | Public availability is not widened into production permission. |
| Production artifact | Zero approved immutable SI artifacts and zero production-eligible records were created. Raw bodies and geometry stay outside Git. | No real SI loader, API response, map area or browser E2E can be claimed. |

The intended M2 grain is one current four-digit operator assignment or source-defined exception reconciled to a valid GURS area or explicit non-area. The CSV is assignment-row grain and GURS is spatial-unit grain. Treating the unmatched 103 codes as non-area based only on missing GURS geometry would convert missing coverage into invented postal semantics.

## Evidence integrity

Twenty exact official bodies total 17,226,218 bytes and are bound by byte length and SHA-256 in `reports/postal-context-m2/si-source-review-2026-08-31.json`. They include the Pošta addressing page, CSV, HTTP receipts, GURS access/RPE/terms pages, WFS capabilities/schema/index and all ten geometry pages. Raw HTML/XML/CSV/GeoJSON and temporary inspection output are not committed.

The reproducible inspector `scripts/inspect-postal-context-si-sources.mjs` checks every pinned digest, Windows-1250 parsing, row/code uniqueness, the complete feature/index set, Polygon/MultiPolygon-only geometry, finite coordinate ranges, ring closure, bbox, crosswalk set differences, normalized name mismatches, WFS/schema/CRS signals, GURS rights-page signals and the special-PDF 404 receipt.

Primary references:

- Pošta Slovenije addressing: https://www.posta.si/naslavljanje
- Pošta normal-postcode CSV: https://www.posta.si/zasebno-site/Documents/Seznami/Seznam%20po%C5%A1t%20in%20po%C5%A1tnih%20%C5%A1tevilk%20v%20Sloveniji%20za%20naslavljanje.csv
- Pošta special-postcode PDF endpoint: https://www.posta.si/zasebno-site/Documents/Seznami/Seznam%20posebnih%20po%C5%A1tnih%20%C5%A1tevilk.pdf
- GURS Register prostorskih enot: https://www.e-prostor.gov.si/podrocja/prostorske-enote-in-naslovi/register-prostorskih-enot/
- GURS public access and licence: https://www.e-prostor.gov.si/dostopi/javni-dostop/
- GURS RPE WFS: https://ipi.eprostor.gov.si/wfs-si-gurs-rpe/wfs

## Application status

Existing shared contracts continue to require Polygon/MultiPolygon-only draw, bounds fit, translucent fill, visible outline, clear and re-search behavior, explicit loading/no-match/multiple/API-failure/invalid-geometry states and visible provenance. The existing SI implementation remains metadata and synthetic conformance only.

No approved complete SI artifact exists, so no real SI loader/API response, map fit/rendering or browser E2E is claimed. The 466 raw GURS geometries were audited, not promoted. The missing 103 classifications were not filled with Points, postal-office locations, direct-mail delivery zones, administrative envelopes or inferred/synthetic surfaces.

Postal Code → Polygon → Address Context authority separation remains intact. Postal assignment does not authorize building display; an exact building requires a separate rights-cleared address/building source and explicit relation.

## Unblock and retry

Unblock after the exact current Pošta special-code release or an equivalent authoritative exception denominator is fixed, and explicit written terms compatible with AGID processing, storage, reproducible crosswalk/derivation, redistribution and public serving are established. Provider contact, registration, agreement or contract acceptance requires explicit approval.

Then reconcile all 569 operator codes and duplicate `1002` rows to 466 GURS features or explicit source-defined non-area reasons, review the six normalized name mismatches, validate every gap/conflict/exception, build an approved immutable artifact, and pass real SI normalization, loader, API, validity, map fit, translucent fill, outline, provenance, clear and re-search verification.

Do not retry before 2026-09-07T00:49:09.000Z while pending countries remain unless the official special-code release is restored or compatible written permission appears.

A chart is intentionally omitted: the gate table states the decisive 466 matched geometries, 103 unresolved codes and rights gap without suggesting production completeness.
