# Republic of the Congo Postal Context M2 review

Status: **blocked at M1 metadata; excluded from current postcode data creation**. M2 is not achieved.

The UPU Universal DataBase September 2025 list, in the file updated 20 August 2026, explicitly lists Congo (Rep.) among countries that do not require postal codes. The official UPU 09/2004 sheet ends its physical-address example with `BRAZZAVILLE / CONGO (REP.)` and lists `BP 652` as a contact. SOPECO's current location page gives `68 Boulevard Denis Sassou Nguesso ... Brazzaville - Congo` without a postcode and reports 39 postal establishments. BP is a P.O.-box delivery object, not a postcode.

Four exact official/reference bodies were checked offline by byte length, SHA-256, page count and content markers (848,825 bytes total). UPU copyright/database conditions and SOPECO's all-rights-reserved notice are recorded. Raw bodies are excluded from Git.

The CG gate rejects numeric lookalikes, BP, offices, routes, Points, administrative polygons, buffers, hulls, Voronoi/raster cells, AGID cells, draft planning cells, CD/CF assignments and Hugging Face/libpostal output as CG postal truth. OSM may provide separately attributed place, address, building or administrative context only. Detailed building display still needs a separate rights-cleared identity and explicit geometry relation.

The actual app ran at `http://127.0.0.1:3034/`. A live `Brazzaville, Congo` search rendered the Photon-qualified candidate, two map canvases and independent AGID `CG039MN8CVH1`. The unmocked request `GET /api/v1/postal/CG/00000?geometry=geojson` returned 404 `Postal Context country is not supported`; no postal-area notice or translucent postal overlay rendered. In-app Browser setup failed before navigation with a Windows ACL helper error, so deterministic Playwright was used. The screenshot passed deterministic assertions, but local image viewing failed with Windows error 206; manual visual inspection is explicitly false.

M2 can be reconsidered only after a competent authority introduces a current CG postcode system, releases a complete versioned assignment denominator and exact real Polygon/MultiPolygon geometry under AGID-compatible processing, derivation, redistribution and serving rights, and the real CG API/app/browser path passes all state, fit, styling, clear and re-search checks. Retry after the pending-country sweep or 2026-12-03, unless such an official release appears earlier.
