# DR Congo Postal Context M2 review

Observed 2026-09-02T23:01:02.073Z on the cumulative rollout branch.

## Decision

CD has a current seven-digit postcode system and reaches corrected `M1_metadata`, but remains blocked from M2. SCPT's public directory confirms source row ID 175 for `1004131` (Résidentiel, Limete, Kinshasa) and ID 1160 for `3202011` (Bulungu, Kwilu). The UPU September 2022 sheet confirms the seven-digit format and its address position. The public API contains no geometry and the reviewed sources do not establish a complete versioned national denominator or compatible bulk redistribution rights.

## Polygon and algorithm quality

The country-specific gate normalizes seven digits, then requires an exact assignment match, exact delivery-area/neighbourhood granularity, Polygon/MultiPolygon, valid topology, matching names and locality, reviewed source class and compatible rights. It rejects the observed Résidentiel Point, the broader Limete administrative MultiPolygon and the unrelated Bulungu health Polygon. It never produces buffers, hulls, Voronoi/raster cells or AGID-cell proxies.

## Hugging Face and open source

`ellenhp/libpostal` was evaluated at revision `79e9bdd2145dcd2040e0bafea4596a49e0c2f70b`. The Hub card says under construction, has no licence tag, refers to mixed upstream source licensing, and sampled OpenAddresses/OSM-address rows did not establish CD coverage. It has no postal geometry or official authority. It is therefore not ingested; libpostal-compatible parsing remains a future offline evaluation option after licence, CD coverage and holdout evidence are fixed. OSM stays an ODbL, attributed, separate candidate partition.

## App verification

The actual app ran at `http://127.0.0.1:3032/`. Live search selected a detailed Limete place and rendered independent AGID ID `CD039MNVG8PJ` with two map canvases. The unmocked `GET /api/v1/postal/CD/1004131?geometry=geojson` returned 404 `Postal Context country is not supported`; no translucent postal area was displayed. In-app browser connection failed at the Windows sandbox helper, so a deterministic Playwright fallback was used. Local screenshot viewing also hit Windows error 206; manual visual inspection and successful postal browser E2E are explicitly not claimed.

Retry after 2026-12-02T23:01:02.073Z, after the pending-country sweep, or earlier on a competent-authority rights-cleared assignment-and-polygon release.
