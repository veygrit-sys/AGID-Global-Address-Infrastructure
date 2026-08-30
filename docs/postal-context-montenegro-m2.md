# Montenegro Postal Context M2 source and data-quality review

## Technical summary

Montenegro does not meet M2. The current official operator directory is a postal-facility Point map, while the operator's dictionary and rules define routing identifiers without publishing a complete current assignment denominator or postcode Polygon/MultiPolygon. The public rights page is under construction. No reviewed source supplies both a reusable real postcode surface and the ordinary-plus-exception coverage needed for a production artifact.

## Exact data-quality audit

| Evidence | Rows/features | Distinct codes | Point | Polygon/MultiPolygon | Rights/currentness | M2 use |
|---|---:|---:|---:|---:|---|---|
| Pošta Crne Gore office map | 164 embedded markers; 12 initial listings | 12 rendered codes | 164 | 0 | Current unversioned lookup; rights page under construction | Facility context only |
| Operator dictionary and Gazette 150 rule | Semantic publications | N/A | 0 | 0 | Official five-digit/PAK/addressing semantics; no data grant | Rules only |
| Government CKAN search | 5 queries; 4 zero-result, 6 `PAK` substring false positives | 0 postal datasets | 0 | 0 | Current public catalogue and general reuse guidance | Negative catalogue evidence |
| UZN services/property access | Address and spatial-unit services; property-list eID/payment path | N/A | not acquired | 0 postal areas | Separate authority and access purpose | Address/cadastral context only |

A chart is intentionally omitted: the exact table communicates the decisive zero-area and authority-separation result without implying a continuous measure.

## Country-specific M2 definition

A current complete rights-cleared Pošta Crne Gore five-digit postcode and six-digit PAK/exception denominator, including delivery and non-delivery offices, PO boxes, poste restante, route or street-part, organization and other special or non-geographic classes, and real postcode Polygon/MultiPolygon surfaces are pinned by edition or retrieval basis, effective date, terms, byte length, SHA-256, coverage and exceptions, published as an approved immutable artifact, and loaded through the real ME API/app so a normalized NNNNN search fits and renders a translucent area with a clear outline, selected code, geometry kind, official/derived/virtual classification, source, reference date and confidence. Facility points or addresses, PAK alone, municipalities or spatial units, cadastral parcels or buildings, route or street buffers, hulls, Voronoi or raster cells and synthetic fixtures never satisfy M2 by themselves. A derived surface is eligible only from an expressly authorized complete current postal-membership denominator with reproducible lineage, limitations and noncanonical status preserved.

## Scope, authority and method

The audit pins seventeen exact official bodies by byte length and SHA-256. The operator HTML `data-markers` payload was HTML-decoded and parsed as JSON. It contains 164 unique marker IDs and 164 valid latitude/longitude pairs spanning latitude 41.894354-43.4558525 and longitude 18.4943751-20.2971675. The first server-rendered listing page contains 12 distinct five-digit codes. `GeoJSON`, `FeatureCollection`, `Polygon` and `MultiPolygon` are absent from the marker payload.

Five unauthenticated CKAN `package_search` queries were captured. `postanski`, `poštanski`, `postcode` and `postal code` return zero. `PAK` returns six incidental substring matches concerning procedures, passports, tax and NGO funding; none is a postal-address-code dataset. The 256-page Gazette 150 rule was text-extracted across all pages, and pages 24-25 were rendered for visual inspection preparation. It requires the official office name, says PAK becomes mandatory after introduction, and treats the five-digit postcode as part of an address. It does not define a surface.

Postal assignment, facility identity, PAK routing, address and spatial-unit registers, cadastral/property context and AGID containment remain separate authorities. No raw source body or public-office coordinate is committed.

## Rights, limitations and robustness

The current Government portal describes general reuse, but no postal dataset exists in the reviewed catalogue. The operator's rights page says it is under construction, so public viewing is not treated as a grant to process, derive, bundle or serve a production postcode pack. The UZN property-list path requires national eID and payment; it was not used. No account, authentication, contact, contract, terms acceptance, payment or protected address/property row was requested.

The office page is live and unversioned. Its points can move without a release identifier and offices need not represent every delivery, non-delivery, route, PAK, PO-box, poste-restante, organization or special class. A point set cannot be buffered, hulled, dissolved, rasterized or converted to Voronoi cells to fill this denominator gap. PDF text and hashes reconcile; local PNG visual inspection was attempted after rendering but the app image reader returned Windows error 206, so visual fidelity is not claimed.

## Application status

The shared application contract correctly accepts only Polygon/MultiPolygon for area rendering, fits valid geometry, uses a translucent fill and clear outline, and handles loading, no-match, multiple-candidate, API-failure, invalid-geometry, clear and re-search states with provenance metadata. No real eligible ME polygon exists, so no ME runtime, API area response, real map fit, translucent postal area or browser E2E is claimed. Facility points, PAK semantics, UZN context and synthetic data were not staged as an area.

## Recommended next steps

Recheck after pending countries and 2026-09-06T18:22:01.106Z. Resume sooner only if an unrestricted current authoritative Montenegro postcode-boundary release appears, or if an expressly authorized complete current postal-membership denominator and approved derivation basis becomes available. Then pin every ordinary and exception class, terms, version, effective date, byte length and SHA-256; validate truthful Polygon/MultiPolygon geometry; approve an immutable artifact; and pass the real ME normalization, loader, API and application rendering path.

## Further questions

- Does Pošta Crne Gore publish a versioned complete office/postcode/PAK and exception denominator under explicit processing and public-serving terms?
- Is any official postcode-area product available separately from office-marker, UZN address, spatial-unit and cadastral products?
- If only authorized address membership exists, what completeness and non-geographic exception evidence permits a conservative derived surface?
