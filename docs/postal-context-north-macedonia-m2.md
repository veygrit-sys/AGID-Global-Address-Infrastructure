# North Macedonia Postal Context M2 source and data-quality review

## Technical summary

North Macedonia does not meet M2. The current official addressing table supplies locality-to-postcode and delivery-office membership, while the official locator supplies postal-facility Points. Neither publishes postcode Polygon/MultiPolygon geometry or documents a complete ordinary-plus-exception denominator. No reviewed source supplies both a reusable real postcode surface and the coverage needed for a production artifact.

## Exact data-quality audit

| Evidence | Rows/features | Distinct codes | Point | Polygon/MultiPolygon | Rights/currentness | M2 use |
|---|---:|---:|---:|---:|---|---|
| Operator correct-addressing table | 1,831 data rows; 1,693 localities; 230 delivery offices; 87 municipalities; 15 branches | 230 | 0 | 0 | Current unversioned public table; no reviewed dataset grant | Assignment reference only |
| Operator post-office locator | 331 facilities plus 36 grouping headers | 326 rendered codes | 331 | 0 | Current unversioned lookup; no reviewed dataset grant | Facility context only |
| Table/locator reconciliation | 218 shared; 12 table-only; 108 locator-only | 338 union | 331 | 0 | Sources have different grains and no exception-completeness statement | Denominator gap |
| Government open-data / NSDI portals | Requests timed out | unknown | unknown | unknown | Current availability failure is not a nonexistence finding | Recheck later |

A chart is intentionally omitted: the exact table communicates the decisive zero-area and denominator-reconciliation result without implying a continuous measure.

## Country-specific M2 definition

A current complete rights-cleared Pošta na Severna Makedonija four-digit postcode assignment and exception denominator, including localities, delivery offices, PO boxes, poste restante, organizations and other special or non-geographic endpoints, and real postcode Polygon/MultiPolygon surfaces are pinned by edition or retrieval basis, effective date, terms, byte length, SHA-256, coverage and exceptions, published as an approved immutable artifact, and loaded through the real MK API/app so a normalized NNNN search fits and renders a translucent area with a clear outline, selected code, geometry kind, official/derived/virtual classification, source, reference date and confidence. Locality rows, delivery offices, facility points, municipalities, branches, address or cadastral units, buffers, hulls, Voronoi or raster cells and synthetic fixtures never satisfy M2 by themselves. A derived surface is eligible only from an expressly authorized complete current postal-membership denominator with reproducible lineage, limitations and noncanonical status preserved.

## Scope, authority and method

Eight exact public bodies are pinned by byte length and SHA-256 outside Git. The reproducible inspector selects the largest HTML table, strips markup, normalizes Unicode/text, accepts only five-cell rows whose second cell is exactly four digits, deduplicates semantic dimensions and profiles geometry tokens. It separately parses the public locator JSON, counts unique facility IDs and finite latitude/longitude records, extracts rendered four-digit values, and reconciles both code sets. The command is `node scripts/inspect-postal-context-mk-sources.mjs --source-dir <temporary-source-directory>`.

The official table contains 1,831 data rows, zero exact duplicates and code range 1000-7550. The public locator response contains 367 array entries: 36 grouping headers and 331 unique facilities with finite coordinates. `GeoJSON`, `FeatureCollection`, `Polygon` and `MultiPolygon` are absent. The 230 table codes and 326 locator codes share only 218 values. This difference may reflect delivery-office versus facility grains, but the public sources do not supply a versioned reconciliation, PO-box/poste-restante/organization exception denominator or postal-area surface.

Postal assignment, locality, delivery office, facility identity, municipality/branch, address/spatial-unit/cadastral context and AGID containment remain separate authorities. No raw source body, locality row or facility coordinate is committed.

## Rights, limitations and robustness

The operator pages are publicly viewable and a privacy notice plus public-information contact are available. Neither is a dataset-specific grant to bulk extract, derive, bundle or serve a production postcode pack, and no contact was made. Public Government open-data and NSDI requests timed out; this is recorded only as an availability failure, not proof that no dataset exists. General open-data goals cannot license a missing or unidentified postal product.

Both operator products are live and unversioned. Locality rows and facility points can change without a release identifier, and the difference between their postcode sets demonstrates that neither can silently define completeness. Points and locality membership cannot be buffered, hulled, dissolved, rasterized or converted to Voronoi cells to fill the gap.

## Application status

The shared application contract accepts only Polygon/MultiPolygon for area rendering, fits valid geometry, uses a translucent fill and clear outline, and handles loading, no-match, multiple-candidate, API-failure, invalid-geometry, clear and re-search states with provenance metadata. No real eligible MK polygon exists, so no MK runtime, API area response, real map fit, translucent postal area or browser E2E is claimed. Facility points, locality membership, administrative context and synthetic data were not staged as an area.

## Recommended next steps

Recheck after pending countries and 2026-09-06T18:56:31.619Z. Resume sooner only if an unrestricted current authoritative North Macedonia postcode-boundary release appears, or an expressly authorized complete current postal-membership denominator and approved derivation basis becomes available. Then pin every ordinary and exception class, terms, version, effective date, byte length and SHA-256; validate truthful Polygon/MultiPolygon geometry; approve an immutable artifact; and pass the real MK normalization, loader, API and application rendering path.

## Further questions

- Does the operator publish a versioned reconciliation of locality assignments, delivery offices, facilities, PO boxes, poste restante, organization and non-geographic exceptions under explicit processing and public-serving terms?
- Is any official postcode-area product available separately from the locality table, facility locator and address/cadastral products?
- If only authorized membership exists, what completeness and non-geographic exception evidence permits a conservative derived surface?
