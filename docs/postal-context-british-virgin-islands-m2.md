# British Virgin Islands Postal Context M2 review

Observed at: 2026-09-02T17:35:56.549Z  
Result: **M2 blocked; current postal system confirmed, complete typed denominator and public-serving polygon rights unavailable**

## What is confirmed

Virgin Islands Postal Services is the current official operator. Current government content uses `VG1110`, `VG1140`, `VG1150` and `VG1160`; the UPU 02/2007 addressing sheet defines the `VG` plus four-digit format. VG therefore remains in postcode data-creation scope.

The evidence does not establish a current immutable complete assignment denominator. A retired official FAQ URL returns 404; search-cache text mentioning six codes is retained only as discovery evidence. It is not promoted to current assignment data.

## Polygon quality and rights

The NIQ/GfK 2024 catalog advertises six British Virgin Islands four-digit postcode-area polygons. No data bytes were purchased, downloaded or inspected. Its observed America Map Edition terms begin at EUR 375, limit use to a 12-month single-workstation in-house licence and require a signed agreement. AGID processing, derivation, redistribution and public-serving rights are therefore not established.

No island, district, registration section, delivery or collection office, P.O. box, locality, National Addressing System building, administrative boundary, point, buffer, hull, Voronoi cell or AGID cell was substituted for a postal area. Eligible real polygon count is zero; topology, CRS, gaps, overlaps, authority and reference date cannot be checked without authorized bytes.

## Actual application check

The actual app returned HTTP 200 at `http://127.0.0.1:3025/`. Searching `VG1110` twice caused four real requests to `/api/v1/postal/VG/VG1110?geometry=geojson`; each returned HTTP 404 with `Postal Context country is not supported`. Both searches showed the explicit unavailable message and stated that no inferred polygon was displayed. The background MapLibre canvas was present and polygon/MultiPolygon detail labels were absent.

The in-app Browser was attempted first but could not navigate because its Windows sandbox helper failed while applying deny-read ACLs. A deterministic Playwright fallback exercised the actual app path; only unrelated OSM/Photon search routes were fixed and Postal Context routes remained real. The screenshot was fixed at `reports/postal-context-m2/vg-deterministic-unavailable-2026-09-03.png` (`sha256:509dceca2775dbe1407d57cca1aa1b7947533c6fd7623d26fc7c42491c7b10b7`, 133091 bytes). Bitmap inspection also failed with Windows path error 206. Human/live browser visual inspection and successful postal-area visualization are not claimed.

## ID and authority separation

Future search results must expose distinct source-qualified IDs for postcode assignment, postal object, postal geometry, administrative context, civic address, building relation, evidence release/assertion and AGID crosswalk. A postcode or National Addressing System label must not imply a building relation. VG identity remains separate from all neighbouring territories.

## Unblock conditions

M2 can advance only after a competent authority or approved supplier provides a current complete typed VG assignment, alias, validity, correction, exception and area/non-area denominator plus eligible Polygon/MultiPolygon bytes under explicit rights for AGID processing, storage, derivation, redistribution and public serving. The immutable release must include edition, coverage, schema, CRS, reference date and SHA-256. It must then drive the real VG API and app through normalization, loading, no-match, multiple, API-failure, invalid-geometry and non-area states, map fit, translucent fill, clear outline, details, clear and re-search.

No provider was contacted, no account was created, no terms or contract were accepted, no payment was made and no protected data was accessed. Recheck after 2026-12-02T17:35:56.549Z or earlier only if qualifying primary evidence becomes public. The pending sweep continues to `VI`.
