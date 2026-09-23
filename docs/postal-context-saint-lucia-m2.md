# Saint Lucia Postal Context M2 review

Observed: `2026-09-01T11:09:55.107Z`

Result: **blocked; M2 unmet**
Definition: `M2_current_saint_lucia_postal_delivery_point_assignment_and_area_visualization`

## Current postal system

The Saint Lucia Postal Service customer notice says implementation took effect on 1 December 2015 and publishes postcodes for all delivery points then in scope. The Government HTML and Gazette reconcile to 54 normalized `LCNN  NNN` assignments. The Gazette's `LC04  113` appears only in a home-delivery address example and is deliberately excluded from the table denominator. The UPU July 2019 sheet confirms integral `LC`, two district digits, an official double space and three post-office/community digits, with home, rural, P.O. Box and poste-restante examples.

## Blocker and authority boundary

Seven exact official bodies total 3,776,665 bytes and are byte-count/SHA-256 pinned. They do not supply a current versioned complete assignment, alias, validity, correction, exception and explicit area/non-area denominator. A postcode identifies a delivery point, which official prose says may be a mailbox, post office, private letter box, residential or business address. That object is not necessarily an area. No reviewed body publishes postcode Polygon/MultiPolygon geometry, a competent code-to-feature crosswalk or rights compatible with AGID storage, derivation, redistribution and public serving. UPU copyright/database restrictions were recorded; no public-web-access inference was used as a licence.

No office, mailbox, delivery point, community, district, quarter, administrative boundary, address, parcel, building, Point, buffer, hull, cell or model was promoted. The address metadata now preserves official double-space syntax and the different delivery forms without asserting M2 data completion.

## Application evidence

The isolated actual app returned HTTP 200 at `http://127.0.0.1:3017/`. The real unmocked request `GET /api/v1/postal/LC/LC04%20%20101?geometry=geojson` returned 404 `Postal Context country is not supported`. The in-app Browser failed before documentation/navigation because its Windows sandbox could not apply deny-read ACLs. Deterministic Playwright then used the real Japanese search control with `LC04 101 Saint Lucia`, observed Saint Lucia search content and one map canvas, but no LC postal request, postal-area notice or geometry/provenance metadata. Screenshot bytes were fixed. The image-view helper failed with Windows error 206 even at a short path, so visual inspection and translucent-area success are not claimed.

UPU page 1 and Gazette pages 13-14 were rendered to non-empty PNGs with fixed byte counts and SHA-256. The same image-view error prevented visual display; exact source bytes, PDF signatures, page counts, extracted markers, render dimensions and hashes were verified.

## Result

LC remains blocked with zero official/derived/virtual postal polygons and zero production records. Retry after `2026-12-01T11:09:55.107Z` or a competent rights-cleared current release, after the pending-country sweep. Next country: Saint Martin (French part) (MF).
