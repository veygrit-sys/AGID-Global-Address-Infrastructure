# Svalbard and Jan Mayen Postal Context M2 evidence

## Technical summary

Svalbard and Jan Mayen (SJ) remains **blocked / M2 unmet** under `M2_current_svalbard_jan_mayen_assignment_and_official_area_visualization` as of 2026-08-31T01:28:39.617Z. The source-of-truth status command selected SJ with no country in progress; no second country was started.

The current complete Posten register establishes eight exact SJ assignments: seven rows use the source's county-like 21 Svalbard classification and one uses 22 Jan Mayen. This is an assignment result, not an area result. Kartverket advertises official `Postnummerområder` geometry under CC BY 4.0, but no geometry body was reachable and fixed in this run. Posten's public download also has no reviewed dataset-specific grant for AGID derivation, redistribution and public serving. The postcode-search-to-translucent-area path therefore cannot be promoted.

## Findings and evidence

| Gate | Source-backed observation | M2 effect |
|---|---|---|
| Current complete operator denominator | Posten's exact Windows-1252 TAB body is valid from 2025-10-01 and contains 5,122 unique well-formed rows. Filtering municipality-code prefixes 21/22 after full-file validation yields eight unique SJ codes. | Establishes the observed assignments, postal places, source classifications and G/P/B categories. |
| SJ identity | Posten's manual says 21 Svalbard and 22 Jan Mayen are not ordinary counties; the codes distinguish postcodes belonging to the territories. | Source fields are retained without changing or merging repository SJ, NO, Svalbard or Jan Mayen identity. |
| Assignment semantics | SJ contains six G rows, one P row (`9171`) and one B row (`9173`); there are no S rows. | Category is preserved, but neither G nor B proves an area, and P is not assigned an invented polygon. |
| Official area authority | data.norge/Kartverket describes `Postnummerområder` as official postcode extent, says P.O.-box codes are additional, advertises monthly distribution/services and CC BY 4.0, with metadata modified 2026-08-28. | Establishes the candidate geometry authority and licence metadata, not actual SJ coverage or topology. |
| Fixed geometry | Five ordinary public requests across WFS capabilities/sample and HTTPS/HTTP Atom timed out during TCP connection. No response or geometry body was pinned. | Zero fixed artifacts, zero validated Polygon/MultiPolygon features and zero eight-code reconciliations. Timeout is not evidence of non-existence. |
| Rights | The Posten register is freely downloadable, but no explicit reviewed terms authorize AGID processing, storage, derivation, redistribution and public serving. | Assignment rows remain validation receipts rather than a production artifact. Kartverket CC BY 4.0 does not license Posten data. |
| Application | Shared area contracts require valid Polygon/MultiPolygon-only draw, bounds fit, translucent fill, clear outline, clear/re-search behavior and explicit loading/no-match/multiple/API-failure/invalid-geometry/provenance states. | No approved real SJ artifact exists, so no real loader, API response, map fit/rendering or browser E2E is claimed. |

Five exact official bodies total 723,960 bytes and are bound by byte length and SHA-256 in `reports/postal-context-m2/sj-source-review-2026-08-31.json`. Raw HTML/text, source rows, WFS/Atom attempts and temporary inspector output stay outside Git.

Primary references:

- Posten postcode tables: https://www.bring.no/en/services/address-verification-services/postcodes
- Posten postcode manual: https://www.bring.no/en/services/address-verification-services/postcodes/postcode-manual
- Posten direct register: https://www.bring.no/postnummerregister-ansi.txt
- Kartverket/data.norge `Postnummerområder`: https://data.norge.no/en/datasets/1054a4c3-3d57-39e6-9349-0b1a9007407a/postnummeromrader
- Kartverket WFS: https://wfs.geonorge.no/skwms1/wfs.postnummeromrader?service=wfs&request=getcapabilities
- CC BY 4.0 legal code: https://creativecommons.org/licenses/by/4.0/legalcode

## Scope and exact M2 definition

The intended M2 grain is one current SJ four-digit assignment/category row reconciled to one or more valid current official postcode-area features or an explicit source-defined non-area reason. The complete eight-row denominator is:

| Code | Postal place | Source municipality | Category |
|---|---|---|---|
| 8099 | JAN MAYEN | 2211 JAN MAYEN | G |
| 9170 | LONGYEARBYEN | 2100 SVALBARD | G |
| 9171 | LONGYEARBYEN | 2100 SVALBARD | P |
| 9173 | NY-ÅLESUND | 2100 SVALBARD | B |
| 9174 | HOPEN | 2100 SVALBARD | G |
| 9175 | SVEAGRUVA | 2100 SVALBARD | G |
| 9176 | BJØRNØYA | 2100 SVALBARD | G |
| 9178 | BARENTSBURG | 2100 SVALBARD | G |

M2 requires explicit reviewed Posten rights for the actual AGID workflow; a fixed current Kartverket distribution; complete code-to-area/non-area reconciliation; valid topology, CRS and reviewed transform; and an approved immutable artifact. The real SJ API/app must normalize four text digits, return only valid real areas, fit the map, render translucent fill with a clear outline, and show the selected code, geometry kind, official/derived/virtual class, source, reference date and confidence.

P.O.-box, special, route, Point, unmatched and other source-defined non-area records remain explicit. Municipality, settlement, island, administrative boundary, building, buffer, hull, Voronoi/raster and synthetic surfaces cannot satisfy the geometry gate. Postal Code → Polygon → Address Context authority separation remains intact; buildings require a separate source and explicit relation.

## Methodology

The reproducible inspector `scripts/inspect-postal-context-sj-sources.mjs` verifies all five exact SHA-256 values; decodes the full register as Windows-1252; validates every five-field row, canonical text code, municipality code and G/P/B/S category; checks full-register uniqueness and category counts; asserts the exact eight SJ rows; and verifies the effective-date, source-classification, official-area, update-date, CC BY 4.0 and WFS metadata signals.

Direct WFS and Atom access was retried through ordinary public URLs with bounded connection/request timeouts. No authentication, browser workaround, access-control bypass, provider contact, product purchase, terms acceptance or cached geometry substitution was used. No raw data was committed.

## Limitations and robustness

The geometry result is deliberately fail-closed. A connection timeout does not show that Kartverket lacks SJ data; it only means this run did not receive a body that can be hashed and audited. Likewise, `Postnummerområder` metadata saying all Norway is divided into postcode areas is not treated as proof that every one of the eight SJ codes has Polygon/MultiPolygon coverage.

The Posten download is current and internally valid, but public availability alone is not treated as a legal or contractual permission conclusion. This review records an engineering promotion gate, not legal advice. No G/B code was inferred to have a polygon, and the P code was not declared non-area solely from its category without a complete source reconciliation.

A chart is intentionally omitted: the gate table and eight-row denominator communicate the decisive rights and zero-geometry gap without suggesting production completeness.

## Next steps and further questions

Unblock after explicit compatible Posten permission or an equivalent expressly open current complete assignment/category source is established. Then download and pin a current Kartverket distribution, determine the exact SJ coverage, validate every Polygon/MultiPolygon, and reconcile all eight codes to areas or source-defined non-area reasons while preserving 21/22 fields and repository SJ identity.

Only after an approved immutable artifact exists should the real SJ loader/API/application and browser path be exercised. Provider contact, registration, authentication, agreement or contract acceptance, payment, protected-data access, publication-destination creation and deployment require explicit approval.

Do not retry before 2026-09-07T01:28:39.617Z while pending countries remain unless compatible written permission or a fixed current authoritative geometry delivery appears. The next country in the ledger is Slovakia (`SK`).
