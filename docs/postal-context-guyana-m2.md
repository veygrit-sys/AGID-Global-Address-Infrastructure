# Guyana Postal Context M2 review

## Technical summary - M2 remains blocked

Guyana has a current seven-digit postcode system. The reviewed Guyana Post Office Corporation (GPOC) finder is real operator data, but it supplies labels rather than Polygon/MultiPolygon geometry and no compatible processing, derivation, redistribution and public-serving licence was located. GY advances from an inaccurate `M0_inventory` placeholder to a digest-bound `M1_metadata` contract and remains `blocked`.

## Current denominator and M2 definition

The current GPOC finder page was modified `2025-08-20T18:44:53` and its public table contains 2,272 rows, 214 distinct valid seven-digit values across ten regions, and one six-digit anomaly (`120101`). It has 23 non-empty locality strings, 239 sub-localities, 1,910 streets, 64 post offices and three exact duplicate rows. No longitude, latitude or geometry field exists.

The UPU Guyana sheet, edition `08/2025`, confirms seven digits and current address layout. Its digit explanation is not silently substituted for the current GPOC page's source-specific terminology. It also contains a six-digit P.O. Box example (`413018`), which is retained as a non-area exception rather than padded or fabricated as a surface.

The country-specific target is `M2_current_gpoc_guyana_seven_digit_postcode_area_visualization`. It requires a current complete typed assignment and exception denominator, compatible rights, reproducible fixed artifacts and valid real Polygon/MultiPolygon geometry for every drawable code.

## Rights, geometry and authority boundary

The reviewed GPOC site searches did not locate an applicable open-data or public-serving licence. Public table visibility does not authorize AGID redistribution. The current UPU POST*CODE 2026.1 licence package has nine documents and requires contract, NDA, data-use declaration and annual fees, with transfer restrictions; nothing was accepted or purchased.

The Government GeoPortal public dataset and resource APIs returned zero resources. The Bureau of Statistics open licence applies to Bureau-owned material, but no Bureau postcode-linked area dataset or official GPOC crosswalk was found. Region, administrative boundary, locality, street, delivery office, Point, buffer, hull, Voronoi/raster cell, model or AGID cell was not promoted. Postal Code, geometry authority and Address Context remain independent. No address, building, person, customer, parcel or land-right record is bundled.

## Fixed-source and PDF verification

Fourteen exact bodies totalling 3,938,769 bytes are fixed by byte count and SHA-256 in `scripts/inspect-postal-context-gy-sources.py`. The fail-closed inspector validates page metadata, table schema and aggregate denominators, the two-page UPU PDF and edition markers, the nine-file UPU licence bundle, the empty GeoPortal results and the GPOC legal-page search result. It emits aggregate receipts only; raw rows and bodies remain temporary and outside Git.

The two UPU pages were text-extracted and locally rendered. Web PDF rendering returned both pages. The local image-view helper failed with Windows error 206, so no local-tool visual audit of those PNGs is claimed.

## Running-app visual inspection

The isolated app ran at `http://127.0.0.1:3011/`. The in-app Browser setup failed before navigation because Windows sandbox deny-read ACL setup failed. Playwright Chromium opened the real app, entered `GY 4130106`, recorded related HTTP responses and produced a fixed screenshot that was displayed and visually inspected in this task.

The app did not recognize the query as a Guyana postal lookup. It returned twelve unrelated place results and auto-selected `Nova City 6` in Astana, Kazakhstan, fitting the background map and an ordinary AGID grid cell. It made no GY Postal Context request, showed no unavailable notice, translucent postal fill, postal outline, source/date/confidence or geometry class. Direct `GET /api/v1/postal/GY/4130106?geometry=geojson` returned HTTP `404` with `Postal Context country is not supported`. The Kazakhstan place and AGID cell are explicit failures, not Guyana M2 evidence.

## Required next step

Keep GY blocked. Re-check no earlier than `2026-12-01T07:07:19.468Z`, after pending countries have been swept, unless GPOC or another competent authority publishes a current complete rights-cleared typed assignment and postal-area artifact. Provider contact, registration, authentication, terms acceptance, contract, payment, protected-data access, new destination, publication or deployment needs explicit approval.
