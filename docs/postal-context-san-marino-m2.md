# San Marino Postal Context M2 review

## Technical summary

San Marino remains **blocked / M2 unmet** under `M2_current_san_marino_cap_assignment_and_area_visualization`. This review fixes ten exact official bodies totalling 1,699,234 bytes by SHA-256 and verifies all ten five-digit `4789x` values on the current Poste San Marino office page. It does not find a complete operator assignment/exception denominator, compatible AGID public-serving rights, or a valid authoritative CAP `Polygon`/`MultiPolygon` product. No production postal row or geometry is committed.

The decisive mismatch is authority and grain. San Marino has nine Castelli but the official office page exhibits ten CAP values because Dogana (`47891`) and Serravalle (`47899`) are distinct postal examples within the Serravalle administrative context. The official `CASTELLI` map layer contains twelve sobborgo polygons for nine Castelli, not ten postal areas. Its requested GeoJSON also declares EPSG:4326 while landing at longitude 21.32–21.44 rather than San Marino. Neither the administrative subdivisions nor a guessed CRS correction may be promoted as CAP geometry.

## Key findings and evidence

| Gate | Evidence observed | Result |
| --- | --- | --- |
| Current CAP examples | The Poste office page, modified 2026-03-26, contains `47890` through `47899`, including Dogana `47891` and Serravalle `47899`. | Useful operator examples only; not a complete assignment and exception denominator. |
| Operator rights | Public pages and a privacy policy are accessible, but no exact grant compatible with AGID processing, storage, derivation, redistribution and public serving was established. | Blocked. |
| Administrative denominator | The Ministry of Interior lists nine Castelli. | Administrative identity only; it cannot define ten CAP areas. |
| Official map geometry | The `CASTELLI` layer has 12 Polygon features, 9 distinct Castelli, 12 closed rings and 27,446 finite positions. Serravalle has 3 sub-polygons and Borgo Maggiore 2. | Valid structural administrative geometry, not postal authority. |
| CRS/location | The query declares EPSG:4326 but returns bbox `[21.3237, 43.8931, 21.4370, 43.9915]`, outside expected San Marino longitudes. | Blocked and fail closed; no guessed transform. |
| Rights for map data | Layer `copyrightText` is blank and the government page carries a copyright footer; no resource-specific open reuse licence was fixed. | Blocked; blank metadata is not permission. |
| Complete code reconciliation | No operator-authorized area membership or non-area classification was available. | Blocked: 0 assignments reconciled. |
| Immutable artifact and application | No eligible area record exists. | Blocked: 0 production records, 0 approved runtime artifacts, no real SM API/map/browser proof. |

The structured evidence is in `reports/postal-context-m2/sm-source-review-2026-08-31.json`. Raw HTML, JSON and GeoJSON remain outside Git.

## Scope, data, and definitions

The canonical CAP is five text digits matching `^4789\d$`. Poste San Marino remains postal-assignment authority. Castelli and sobborghi remain administrative authority. The Ufficio Tecnico del Catasto e Cartografia remains cadastral/base-cartography authority. Office locations remain service points. These assertions are deliberately separate.

M2 requires a current complete assignment and exception denominator under reviewed rights. Every drawable code must reconcile to fixed valid `Polygon`/`MultiPolygon` geometry with official/derived/virtual classification, provider, edition/date, rights, attribution, bytes, SHA-256, schema, CRS, topology, method, coverage, confidence and exceptions. Non-area cases require source-grounded reasons. In particular, Dogana `47891` and Serravalle `47899` need a postal-source-defined membership split; the three administrative Serravalle sub-polygons cannot silently supply it.

## Methodology

The audit started from cumulative branch commit `acc729a5c7bc84054085d317bfdb18642304fa99` and the ledger-selected `SM` entry. It used public official pages and the government ArcGIS REST layer only. It made no provider contact, registration, authentication, agreement, payment, protected query, publication or deployment.

The reproducible inspector binds all ten bodies by byte length and SHA-256, checks the exact office-code set, verifies the official nine-Castelli list, profiles every administrative feature, ring and coordinate, and proves that the returned bbox does not intersect the expected San Marino longitude range. Geometry is promotion-eligible only when it has postal authority, reviewed rights, correct CRS/location and valid fixed `Polygon`/`MultiPolygon` structure. No point, office, settlement, street, administration, cadastre, building, parcel, buffer, hull, Voronoi/raster or synthetic substitute is accepted.

The report intentionally uses a gate table instead of a chart: the ten-code/nine-Castelli/twelve-feature mismatch and binary promotion gates are more accurately communicated as exact counts and decisions.

## Limitations and robustness

- Office addresses prove real current examples but do not prove every deliverable address, exception, organization, route, P.O.-box or non-area case.
- The `CASTELLI` layer may be useful after a provider-approved datum transformation for administrative display, but this audit does not guess a transformation or extend it to postal authority.
- Public access and blank `copyrightText` do not establish database or public-serving rights. This audit does not claim no compatible licence or independent CAP-area product exists elsewhere.
- No browser E2E was attempted because no production-eligible CAP area artifact exists. Rendering the administrative layer would be misleading evidence.

## Remaining work and unblock conditions

1. Obtain a current complete Poste San Marino assignment and exception denominator plus explicit compatible AGID processing, storage, derivation, redistribution and public-serving permission, or an equivalent expressly open operator-authorized source.
2. Obtain a fixed valid CAP `Polygon`/`MultiPolygon` product with exact provenance, rights, edition/date, bytes, SHA-256, schema, correct CRS transformation, topology, coverage, method and confidence.
3. Reconcile all ten codes to valid official/derived/virtual areas or explicit source-grounded non-area reasons, including a source-defined Dogana/Serravalle split, without administrative, office, point, cadastral, building, parcel or synthetic proxies.
4. Build an approved immutable artifact and pass real SM normalization, loader, API, validity, loading/no-match/multiple/failure/invalid states, map fit, translucent fill, clear outline, provenance, clear and re-search verification.

Do not retry before `2026-09-07T02:35:10.604Z` while pending countries remain. Provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, publication destination creation, publication and deployment require explicit approval.
