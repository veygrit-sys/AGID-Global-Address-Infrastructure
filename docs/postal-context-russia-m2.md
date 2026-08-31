# Russia Postal Context M2 evidence

## Decision

Russia (RU) remains **blocked / M2 unmet** under `M2_current_russia_postcode_assignment_and_area_visualization` as of 2026-08-30T23:41:07.953Z. The source-of-truth status command selected RU with no country in progress; no second country was started.

The decision is deliberately narrower than “Russian postcodes exist” or “official address data exists.” M2 requires a fixed, rights-cleared, current assignment and exception denominator connected to valid real Polygon/MultiPolygon coverage and exercised through the real AGID API/application map path. Those gates are not met.

## Exact M2 definition

A current complete six-digit Russian postcode assignment and exception denominator and corresponding valid Polygon/MultiPolygon coverage must be usable under explicit reviewed AGID processing, storage, derivation, redistribution and public-serving permission. The approved immutable artifact must pin provider, edition, reference date, licence, attribution, byte length, SHA-256, schema, source CRS, transform, topology, coverage, gaps, conflicts and exceptions.

Any surface derived from complete address membership is labelled `derived` and noncanonical. The real RU API/app must normalize the selected six-digit code, return only valid real areas, fit the map, render a translucent fill with a clear outline, and expose selected code, geometry kind, official/derived/virtual class, source, reference date and confidence. Office-only, poste-restante, P.O.-box, organization, military, route, point, temporary, closed, unmatched and other non-area records remain explicit.

Post-office points, tariff/dictionary responses, FIAS address or map points, streets, administrative/cadastral/building/parcel objects, buffers, hulls, Voronoi/raster cells and synthetic fixtures cannot satisfy M2.

## Authority and data-quality findings

| Gate | Official observation | M2 effect |
|---|---|---|
| Postcode semantics | Russian Post says an index is the unique post-office number to which an address is assigned. | Establishes six-digit assignment semantics, not an area. |
| Current operator directory | The live official page advertises 61,358 DBF records formed 2026-08-25, covering index, hierarchy and post-office name, updated at least monthly. | Office-grain reference is not a complete address assignment/exception denominator and contains no advertised Polygon/MultiPolygon. |
| Fixed archive | The current archive URL returned HTTP 417; the numbered relative archive returned 404. No bypass was attempted. | No exact DBF release, schema rows or digest could enter a reproducible transformation. This is availability evidence only, not a non-existence claim. |
| Tariff/post-office API | The fixed 67-page API 3.20 PDF supports post-office lookup by index/date. Its reviewed response fields are office/operational metadata with no advertised coordinate or area geometry. | An API dictionary or tariff response cannot be promoted as membership or area. |
| FIAS/GAR | FNS describes GAR as the unified open official address resource and advertises portal snapshots twice weekly. Federal Law 443-FZ makes GAR address information common-access/open data and mandatory for postal services. | Address identity/postcode attributes may support future assignment reconciliation, but address/map points and hierarchy are not Russian Post perimeters. |
| Rights | GAR address openness and the public Russian Post directory page were observed. No explicit compatible grant for an RU postal-area artifact and AGID public serving was established. | Rights remain dataset/output specific; public visibility is not silently widened. |
| Geometry | No exact official postcode Polygon/MultiPolygon release was discovered; 0 fixed geometry artifacts and 0 features were validated. | Real RU API/map area evidence cannot be claimed. |

The intended M2 grain is one current postcode assignment or explicit exception reconciled to a valid area or reasoned non-area. The operator directory grain is one post-office reference, while FIAS/GAR is address-object grain. Treating either as a national postal surface without complete membership, exceptions and topology would create false coverage.

## Evidence integrity

Seven exact official bodies total 2,062,744 bytes and are bound by byte length and SHA-256 in `reports/postal-context-m2/ru-source-review-2026-08-31.json`. The raw HTML/PDF bodies, rendered pages, DBF/address rows and geometry are not committed.

The fixed PDF is `Описание API Сервиса расчета тарифов и контрольных сроков`, cover version 3.20, 67 pages, created/modified 2026-03-25, 1,072,456 bytes, SHA-256 `78719b084bc47cff09d3300737a437e3c17384bf777ea0c22e09efb14cca2922`. PDF signature, metadata, indexed text and extracted representative-page text were checked. Poppler rendered pages 1, 17 and 28; the local image viewer failed with Windows error 206, so visual image-viewer verification is not claimed.

Official references:

- Russian Post current reference directory: https://info.pochta.ru/support/database/ops
- Russian Post index definition/search guidance: https://info.pochta.ru/support/popular-questions/how-do-you-know-your-zip-code
- Russian Post address-writing guidance: https://info.pochta.ru/support/post-rules/write-address
- Russian Post tariff/post-office API PDF: https://tariff.pochta.ru/post-calculator-api.pdf
- FNS FIAS/GAR service: https://www.nalog.gov.ru/rn77/service/fias/
- FNS GAR integration/update description: https://www.nalog.gov.ru/rn77/news/activities_fts/13824755/
- Federal Law 443-FZ on FIAS/GAR: https://www.nalog.gov.ru/rn77/about_fts/docs/4468685/

## Application status

Existing shared contracts continue to require Polygon/MultiPolygon-only draw, bounds fit, translucent fill, visible outline, clear and re-search behavior, explicit loading/no-match/multiple/API-failure/invalid-geometry states and visible provenance. No approved fixed RU area artifact exists, so no real RU loader/API response, map fit/rendering or browser E2E is claimed. Office maps, FIAS address/map points and inferred or synthetic geometry were not substituted.

Postal Code → Polygon → Address Context authority separation remains intact. Postal assignment does not authorize building display; an exact building requires a separate rights-cleared source and explicit address-to-building relation.

## Unblock and retry

Unblock only after an exact current Russian Post directory and/or complete FIAS/GAR address-to-postcode assignment plus exception snapshot is fixed under ordinary authorized access, with reviewed rights and full provenance; then obtain an official postcode area release or derive a noncanonical surface from the complete denominator without proxy geometry, validate all gaps/conflicts/exceptions/topology, build an immutable artifact, and pass the real RU API/application path.

Do not contact a provider, register, authenticate, accept terms or a contract, bypass access controls, submit protected address/property/shipment data, pay, create a publication destination, publish or deploy without explicit approval. Do not retry before 2026-09-06T23:41:07.953Z while pending countries remain unless a compatible fixed authoritative release or written permission appears.

A chart is intentionally omitted: the exact gate table communicates the decisive grain mismatch, archive availability and zero validated area features without suggesting quantitative completeness that was not measured.
