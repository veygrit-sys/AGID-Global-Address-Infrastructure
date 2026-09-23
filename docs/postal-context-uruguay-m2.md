# Uruguay Postal Context M2 review

## Result

Uruguay remains **M1 / blocked**. This run publishes a complete, non-synthetic, fixed transformation of the latest official catalog body (August 2023), but does not prove that the 2023 one-time publication is the complete current 2026 assignment and supersession state. The pack is `M2_experimental` and `promotionEligible: false`.

## Fixed primary evidence

The source is Correo Uruguayo dataset `7eb3681f-3e58-475d-9cd4-4527dc6ab234`, version 1.0. The fixed KML resource is `271e6277-6b0f-44f6-962d-21b8ba88e9e4`; the fixed SHP resource is `8f701b15-5299-4176-b94e-260f69086494`. The build report records the exact URLs, retrieval time, byte lengths and SHA-256 digests for the KML, SHP ZIP/components, CKAN metadata, resource page, Uruguay open-data licence and two official Correo PDFs.

The Uruguay open-data licence permits reproduction, distribution, publication, adaptation and combination with origin and modification disclosure. The pack carries an origin note naming Correo Uruguayo, the licence and dataset, and discloses the KML-to-GeoJSON transform, one degenerate-ring removal and the AGID reference crosswalk.

The reviewed Correo decision distinguishes ordinary public postal-code data from the detailed/amplified CPA structure. Zero CPA rows are included.

## Data and polygon quality

- 121 official features, 121 unique five-digit postal codes and 121 unique `cp_id` values.
- KML and DBF IDs match exactly; SHP and KML bounds match in WGS84.
- Source: 121 Polygon parts, 122 rings, 251,684 positions.
- One zero-area four-position interior ring occurs in code `15400`.
- Output: 121 Polygon parts, 121 closed non-zero-area rings, 251,680 positions.
- The repair removes only the degenerate ring; no coordinate value is changed and no surface is invented.
- Bounds: `[-58.439348978944, -34.9740543027889, -53.1810509363889, -30.0855024328926]`.

## More detailed ID-linked results

Each of the 121 search records exposes independently typed IDs:

- normalized five-digit postal code;
- official Correo `cp_id` in the postal node label;
- stable Postal Context node ID;
- stable geometry feature ID;
- country assertion ID;
- derived AGID reference assertion, node and cell ID;
- release/source ID, resource UUID, source date, licence, provenance and confidence.

For `11000`, the IDs include postal `postal-uy-correo-2023-11000`, geometry `correo-uy-postal-2023-11000`, official `cp_id 1` and AGID interior reference cell `UY0FZ5D9368V`. The AGID link is a deterministic point-inside reference only. It is not postal coverage, official assignment authority, an address or a building relation.

## Application and visual boundary

The real isolated application start failed because `tsx`/`node_modules` are unavailable. The ambient port-3001 app was not used as branch evidence. The in-app Browser process exited before navigation. A deterministic Playwright fallback from the committed graph/geometry passed render, fit-status, translucent fill, outline, ID panel, clear, re-search and no-match checks plus a pixel audit. Local image inspection failed, so no real-app or human visual success is claimed.

## M2 definition and blocker

Country-specific M2 requires a current, complete, typed ordinary Correo assignment/alias/validity/correction/exception denominator; fixed eligible Polygon/MultiPolygon; explicit non-area handling; compatible rights; reproducible validation; immutable artifacts; actual API/app search, fit, translucent render, detailed IDs, clear/re-search and browser visual confirmation. Detailed CPA, civic address, building and parcel data remain separately authorized.

Unblock when Correo or another competent authority publishes or explicitly confirms and licenses the complete current assignment/supersession state compatible with AGID processing and serving, and the fixed pack is verified through the real app. Do not contact, register, authenticate, accept terms, pay, publish or deploy without explicit approval. Recheck after the pending-country sweep and not before 2026-12-02.
