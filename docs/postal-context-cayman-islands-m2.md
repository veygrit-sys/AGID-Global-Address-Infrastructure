# Cayman Islands Postal Context M2 review

Observed: `2026-09-01T10:40:54.523Z`

Result: **blocked; M2 unmet**
Definition: `M2_current_cips_box_section_and_unique_postcode_context_visualization`

## Current postal system

The UPU Cayman Islands addressing sheet (edition 02/2019) establishes seven characters separated by a hyphen: integral `KY`, island code `1`/`2`/`3`, and four section digits. It names Grand Cayman, Cayman Brac and Little Cayman, requires the official island name on the postcode line, says mail is delivered through private letter boxes at post offices and says ordinary street-only mail is undeliverable. `KY1-1100`, `KY1-1103` and `KY1-1600` remain reference examples only.

The Postal (Amendment) Regulations, 2025 confirm a paid unique-postcode service for companies. Such organization-specific codes are typed non-area objects unless competent-authority geometry explicitly says otherwise.

## Blocker and authority boundary

Six exact official bodies total 876,000 bytes and are byte-count/SHA-256 pinned in the source review. They do not supply a current complete assignment, alias, validity, correction, exception and explicit area/non-area denominator. The legacy CIPS postcode-finder PDF could not be retrieved (Schannel `SEC_E_INTERNAL_ERROR`, HTTP 000), and a secondary historical list was not substituted as current primary evidence.

Cayman Land Info exposes one Polygon layer named `Street Address` and no tables. Its fields contain no postcode. This is address context, not postal authority. The FAQ also says purchased maps convey no rights and publication requires express written permission of the Chief Surveyor; blank ArcGIS copyright metadata is not an open licence. No island, address polygon, post office, P.O. Box, box section, unique organization code, parcel, building, Point, buffer, hull, cell or model was promoted.

## Application evidence

The isolated actual app returned HTTP 200 at `http://127.0.0.1:3016/`. The real unmocked request `GET /api/v1/postal/KY/KY1-1100?geometry=geojson` returned 404 `Postal Context country is not supported`. The in-app Browser failed before documentation/navigation while applying Windows deny-read ACLs. Deterministic Playwright then used the real Japanese search control with `KY1-1100 Cayman Islands`, observed two map canvases, no search result, no KY postal request, no postal notice and no geometry metadata. Screenshot bytes were fixed, but the image-view helper failed with Windows error 206, so browser E2E, visual inspection and translucent-area success are not claimed.

## Result

The address metadata now reflects P.O. Box, official island name and integral KYN-NNNN placement. M2 remains blocked with zero official/derived/virtual postal polygons and zero production records. Retry after 2026-12-01T10:40:54.523Z or a competent rights-cleared release, after the pending-country sweep. Next country: Saint Lucia (LC).
