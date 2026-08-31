# Slovakia Postal Context M2 source and application review

## Technical summary

Slovakia (`SK`) remains **blocked / M2 unmet** under `M2_current_slovakia_psc_assignment_and_area_visualization`. This review fixes 20 exact official bodies (135,325,717 bytes) by SHA-256 and inspects current real address data, but it does not find the complete operator assignment/exception denominator, operator public-serving permission, or a valid PSČ Polygon/MultiPolygon product required by M2. No production data or geometry is committed.

The decisive observation is geometric, not merely documentary. The exact current Register adries `SK010` GeoJSON contains 160,897 real address features: 158,803 `Point`, 2,094 null geometry, and zero `Polygon` or `MultiPolygon`. The Slovenská pošta access-point XML contains 2,449 service points and no areas. These sources are valuable for address membership and service context but cannot be inflated into postal areas.

## Key findings and evidence

| Gate | Evidence observed | Result |
| --- | --- | --- |
| Current PSČ assignment denominator | The public operator UI calls a bounded `scope=zip`, `limit=5` street/municipality endpoint. A non-personal sample returned `81107` and `81108`; direct `81108` returned no row. | Blocked: sample receipts are not a complete assignment and exception denominator. |
| Operator rights | Public search and daily XML are accessible; no exact terms granting AGID processing, storage, derivation, redistribution and public serving were established. | Blocked. |
| Address data rights | Eight NUTS3 metadata records are daily, state no access limitations, and bind CC BY 4.0 for author work and database rights. | Pass for those address resources only. It does not license operator assignments or create area authority. |
| Real geometry | `SK010`: 158,803 Point + 2,094 null; 108 distinct valid five-digit `postalcode` values; zero area features. Access XML: 2,449 service points; zero areas. | Blocked: no PSČ Polygon/MultiPolygon. |
| Complete code reconciliation | No nationwide fixed area product or complete operator denominator was available to reconcile. | Blocked: 0 assignments reconciled to area or explicit non-area. |
| Immutable AGID artifact | No eligible area record exists. | Blocked: 0 production records and 0 approved runtime artifacts. |
| Real API and app map path | Existing shared contracts remain fail closed, but there is no real SK artifact to load. | Blocked: no real SK API, map fit, translucent fill/outline, provenance display, or browser proof. |

The structured evidence is in `reports/postal-context-m2/sk-source-review-2026-08-31.json`. It binds every captured body by byte length and SHA-256. The raw HTML, JavaScript, JSON, XML and GeoJSON remain outside Git.

## Scope, data, and definitions

The canonical PSČ is five text digits and is displayed `NNN NN`; leading zeroes may never be lost. Slovenská pošta remains the postal-assignment authority. The Ministry of Interior Register adries remains the address-identity and address-point authority. Offices and access points describe service locations. These authorities are retained as separate assertions.

M2 requires a current complete assignment and exception denominator under reviewed rights. Each drawable code must be reconciled to fixed valid `Polygon`/`MultiPolygon` geometry with official/derived/virtual classification, provider, version/date, rights, attribution, bytes, SHA-256, schema, CRS, topology, method, coverage, confidence and exceptions. Point, route, P.O.-box, organization, office and other non-area codes need source-grounded reasons rather than invented geometry.

## Methodology

The audit started from cumulative branch commit `6f00aef6c2dd517165631df381ccef8936fd1967` and the ledger-selected `SK` entry. It used public official endpoints only and made no provider contact, registration, authentication, agreement, payment, protected query, publication or deployment.

The reproducible inspector verifies all 20 exact bodies, the operator endpoint contract and samples, access-point record counts, all eight NUTS3 rights/frequency metadata records, and the complete exact `SK010` GeoJSON geometry/postcode profile. Geometry is accepted only when it is valid real `Polygon`/`MultiPolygon`; absence stays absence. Point buffering, convex/concave hulls, Voronoi/raster cells, administrative/cadastral/building/office substitutes and synthetic fixtures are explicitly zero.

The report intentionally uses a gate table rather than a chart: the zero-area result and authority separation are categorical and clearer as exact counts and pass/block decisions.

## Limitations and robustness

- Only `SK010` was downloaded as a full regional address GeoJSON. All eight current metadata records were validated, but the other seven large data bodies were not needed to establish that the inspected address product's advertised geometry is address-point context rather than a published postal-area product. This does not prove no area product exists elsewhere.
- Eight regional `HEAD` attempts returned HTTP 405, while an ordinary `GET` for `SK010` succeeded. Method rejection is treated only as availability evidence.
- `validfrom` includes the sentinel-like minimum `0999-12-27`; no semantic reinterpretation or correction was made.
- Register adries CC BY 4.0 is resource-specific. It is not silently extended to Slovenská pošta assignments and does not convert address membership Points into boundaries.
- No browser E2E was attempted because the only available real geometry is Point/null and no approved area artifact exists. Staging Points or fixtures as areas would produce false evidence.

## Remaining work and unblock conditions

1. Obtain a current complete Slovenská pošta assignment/exception denominator and explicit compatible AGID processing, storage, derivation, redistribution and public-serving permission, or an equivalent expressly open operator-authorized source.
2. Obtain and pin a valid fixed PSČ Polygon/MultiPolygon product with complete provenance and rights. Address Points/null geometry alone cannot satisfy this step.
3. Reconcile every code to valid area geometry or an explicit source-grounded non-area reason without buffers, hulls, Voronoi/raster, administration, parcel, building, office or synthetic substitution.
4. Build an approved immutable artifact and pass real SK normalization, loader, API, validity, loading/no-match/multiple/failure/invalid states, map fit, translucent fill, clear outline, provenance, clear and re-search verification.

Do not retry before `2026-09-07T02:02:10.112Z` while pending countries remain. Provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, publication destination creation, publication and deployment require explicit approval.
