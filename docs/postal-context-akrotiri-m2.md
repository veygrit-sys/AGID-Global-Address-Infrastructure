# Akrotiri (XU) Postal Context M2 review

Observed at: `2026-08-31T05:23:45.136Z`
Result: **blocked / M2 unmet**

## Technical summary

Current GOV.UK evidence maps Akrotiri to BFPO `57` and shadow postcode `BF1 2AT`. A fixed official Cyprus DLS September 2025 Shapefile separately contains one valid `AKROTIRI` / `4640` Polygon. These are real, current-enough authority observations, but they are not an authoritative crosswalk: BFPO routing, Cyprus postal assignment, DLS sector membership and XU identity remain separate. M2 is therefore blocked, and no raw source body or geometry was committed.

## Country-specific M2 definition

XU reaches M2 only when the current complete Akrotiri BFPO 57 / BF1 2AT eligibility and routing denominator plus Cyprus Post 4640 assignment, alias, exception and explicit non-area denominator is pinned under compatible rights. Every supported form must be explicitly reconciled to a fixed, valid and rights-cleared DLS or other authoritative Polygon/MultiPolygon, or to a postal-source-grounded non-area reason. Authority, operator relationship, class, edition, reference date, bytes, SHA-256, schema, CRS, topology, coverage, method, confidence and exceptions must remain explicit. The artifact must drive the real XU API and application search, fit, translucent fill, clear outline, reset, provenance and error states.

The DLS Akrotiri/4640 sector, Akrotiri or combined SBA territory, administrative or environmental maps, offices, addresses, buildings, parcels, Points, buffers, hulls, Voronoi/raster cells and synthetic fixtures do not become BFPO 57, BF1 2AT or XU postal perimeters merely by name or containment. XU, Cyprus, Dhekelia, Episkopi and Ayios Nikolaos identities remain distinct.

## Evidence and findings

- Nine exact official bodies total 8,102,778 bytes and are byte/SHA-256 bound in the source-review report. GOV.UK content is reviewed under OGL v3; it contains route and identity evidence but no area geometry.
- GOV.UK lists Akrotiri as BFPO `57` / `BF1 2AT`. It separately lists Episkopi as `53` / `BF1 2AS`; the latter is not silently treated as an Akrotiri alias. BFPO addressing uses the BFPO number rather than a town or country, supporting route/non-area semantics.
- The official DLS catalog publishes `ORIA_TAXYDROMIKON_KODIKON_Shapefile.zip`, edition September 2025. Read-only GDAL inspection reports 870 Polygon features, 848 distinct integer code values, 459 village names, zero null geometry and zero invalid geometry in CGRS93 LTM (`ESRI:102319`).
- Code `4640` returns one `AKROTIRI` Polygon with 1,285 points, 49,201,505.1905456 m², bounds `[190968.7742, 325882.249, 203343.8008, 335558.972100001]`, village code `5200` and GLOBALID `{71683F95-EB6E-4194-9CEB-9A957E4A219F}`.
- The DLS API catalog asks users to contact the portal manager for access. The disclaimer calls site information advisory and not a substitute for legal text. No resource-specific grant covering AGID processing, storage, derivation, redistribution and public serving was found, so the public ZIP remains validation-only.

## Methodology and scope

The exact bodies were fetched outside Git, hashed, and inspected with a deterministic Node inspector plus read-only GDAL `/vsizip/` queries. The inspector verifies current BFPO table rows, distinct Episkopi routing, OGL terms, DLS catalog/API/disclaimer receipts, ZIP edition/layer/CRS/schema totals, whole-layer validity and the exact Akrotiri/4640 feature. No transformation, crosswalk or publication artifact was produced.

A quantitative chart was intentionally omitted: this is a one-country authority and reconciliation audit, and exact tabular metrics plus the cross-system distinction communicate the decision more clearly.

## Why M2 remains blocked

The current complete BFPO/Cyprus assignment, alias, eligibility, exception and explicit non-area denominator is absent. Cyprus Post has not authoritatively reconciled `4640` to the XU and BFPO forms, and name equality is insufficient. Compatible DLS public-serving rights are unverified. Consequently zero records are production-eligible and no approved immutable XU runtime artifact exists.

## Application status

Shared application contracts for Polygon/MultiPolygon validation, country/code normalization, loading, no-match, multiple, API failure, invalid geometry, fit, translucent fill, outline, clear and re-search remain verified. The DLS feature was not promoted, so no real XU loader, API response, map rendering or browser E2E is claimed.

## Limitations, next steps and questions

Retry no earlier than `2026-09-07T05:23:45.136Z`, after pending countries are traversed. An unblock requires a current Cyprus Post assignment/exception denominator, written or resource-specific DLS reuse terms compatible with public serving, and an authoritative cross-system decision stating whether `4640`, BFPO `57`, `BF1 2AT` and XU area membership are equivalent, overlapping, partially eligible or non-area. Provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, a new publication destination or deployment requires explicit approval.

Open questions are whether Cyprus Post defines `4640` as a complete postal area for XU users, whether DLS `4640` is licensed for derived public serving, and whether BFPO 57 has any authoritative area semantics at all.
