# Czechia Postal Context M2 source review

## Technical summary

Czechia remains at `M1_metadata`. This review pinned four current Czech Post customer-output CSVs, their four certificates, and the ČÚZK RÚIAN nationwide address release valid on 2026-07-31. The operator data establishes current PSČ assignments and exception classes; RÚIAN establishes 3,020,222 address-place memberships and S-JTSK definition points. None of the nine exact artifacts contains a postcode Polygon or MultiPolygon.

The application must therefore not shade locality assignments, address points, postal facilities, P.O. boxes, organization codes, transport hubs, contracted-partner codes or administrative boundaries as official postcode areas. No CZ production artifact, real CZ API result, bounds fit, translucent fill or outline is enabled by this review.

## Key findings

| Evidence | Exact result | M2 consequence |
| --- | ---: | --- |
| Czech Post address-PSČ classification | 15,666 codes | Current class denominator, not perimeter evidence |
| Type 1 / 3 / 4 / 5 / 10 | 2,225 / 988 / 854 / 14 / 11,585 | Special/non-area classes must stay explicit |
| Czech Post locality list | 16,153 rows; 2,677 PSČ | Routing/locality membership only |
| Czech Post municipality-part list | 16,205 rows; 2,680 PSČ | Three codes have no RÚIAN address rows |
| No-delivery-service list | 45 rows; 27 PSČ | Exception evidence, not a blanket deliverability claim |
| RÚIAN address release | 6,258 files; 3,020,222 rows | Official address membership and point evidence |
| Complete S-JTSK coordinate pairs | 3,019,302 | 920 rows across 263 PSČ lack coordinates |
| RÚIAN PSČ matched to operator classification | 2,677 / 2,677 | Classification consistency, not geometry authority |
| Operator codes without RÚIAN address rows | 12,989 | Mostly facility/organization/P.O. box/hub/partner classes; no invented area |
| Operator or derived Polygon/MultiPolygon | 0 / 0 | Real CZ area visualization remains blocked |
| Published immutable CZ artifacts | 0 | M2 cannot be claimed |

## Scope and definitions

- **Operator assignment** means a five-digit PSČ and class in the retrieved Czech Post customer outputs.
- **RÚIAN address membership** means an address-place row with its RÚIAN identity, PSČ, validity and optional S-JTSK definition point. It is not a building footprint or postcode boundary.
- **Derived postcode area** requires a separately approved, reproducible method from permitted members, an explicit `derived_geometry` label, a pinned transform, uncertainty, topology and independent holdout.
- **Current drawable postal area** requires a postcode-specific Polygon/MultiPolygon delivered through the real CZ loader, API and app path.
- Address/building context remains separate. Exact building display requires a source-defined RÚIAN building relationship rather than postcode equality, containment or proximity.

## Sources, versions and rights

1. [Czech Post customer outputs](https://www.ceskaposta.cz/cs/ke-stazeni/zakaznicke-vystupy) states that outputs update on the first working day monthly, with selected outputs updated each Monday. Four exact CSV ZIPs and four certificates were retrieved on 2026-08-30 and pinned by byte count and SHA-256 in the source contract and report.
2. The address-PSČ certificate defines type 1 as a postal facility, type 3 as an organization collecting mail/P.O. box, type 4 as an organization receiving delivery, type 5 as a collection transport hub, and type 10 as a Czech Post contractual partner. These classes cannot be treated uniformly as residential areas.
3. [ČÚZK nationwide RÚIAN address metadata](https://geoportal.cuzk.gov.cz/Default.aspx?metadataID=CZ-00025712-CUZK_SERIES-MD_RUIAN-CSV-ADR-ST&metadataXSL=Full&mode=TextMeta&side=dSady_RUIAN_vse) identifies nationwide monthly CSV data, validity at the prior month end, S-JTSK address definition points and CC BY 4.0. The exact `20260731_OB_ADR_csv.zip` is 63,391,777 bytes with `sha256:e19d71302c1201d4a7242b58794f2c1b905f5279ab6f832e444f86b0be5fdc2b`.
4. [ČÚZK's attribute definition](https://cuzk.gov.cz/Uvod/Produkty-a-sluzby/RUIAN/2-Poskytovani-udaju-RUIAN-ISUI-VDP/Dopady-zmeny-zakona-c-51-2020-Sb/Adresni-mista-CSV_atributy.aspx) confirms that X/Y are an address-place definition point and `Platí Od` is the validity date.

The Czech Post page exposes public downloads, but this review did not identify an artifact-specific redistribution or derivative-publication license. Those bodies remain audit-only and outside Git. ČÚZK explicitly labels the RÚIAN address dataset CC BY 4.0. This is an engineering evidence review, not a legal opinion.

## Methodology and reproducibility

The byte-bound inspector verifies all nine file sizes and SHA-256 digests before parsing. It then:

1. decodes the operator and RÚIAN CSVs as Windows-1250 and fails on schema or column drift;
2. verifies certificate signatures, declared update cycles, effective dates, scope and PSČ class definitions;
3. profiles the four operator outputs, including PSČ normalization, row counts, distinct codes and type counts;
4. profiles all 6,258 RÚIAN municipality files, address rows, PSČ values, coordinate completeness and validity bounds;
5. compares operator classification, locality, municipality-part and no-delivery classes with RÚIAN address membership;
6. fails closed if exact counts, digests, schemas or authority decisions drift;
7. records zero drawable coverage until a production-eligible immutable surface passes the real AGID path.

Raw ZIP, CSV and Word bodies are deliberately excluded from Git. Only contracts, receipts, hashes, aggregate profiles, tests and the audit conclusion are committed.

## Limitations and robustness

- RÚIAN provides points in S-JTSK, not polygons. A future surface requires a pinned transform to EPSG:4326 and topology validation.
- 920 address rows across 263 PSČ lack coordinates. Every observed RÚIAN PSČ has at least one coordinate-bearing address, but incomplete membership still needs an explicit treatment and uncertainty analysis.
- The municipality-part output contains `25705`, `43002` and `66901`, which do not occur in the current RÚIAN address release. They remain unresolved assignments rather than fabricated areas.
- Exact code equality cannot prove a postal perimeter. Convex hulls, buffers, Voronoi cells, administrative clips or learned boundaries remain derived and require method-specific review.
- The 12,989 operator codes without RÚIAN address rows must retain their facility, P.O. box, organization, transport-hub or contractual-partner class where known; they do not receive polygons by default.
- Independent holdout, national-border clipping, overlap/gap/island checks and a confidence/uncertainty model have not been run.

## Application visualization status

The shared application path supports country/postcode normalization, Polygon/MultiPolygon validation, map bounds fitting, a semi-transparent fill, a distinct outline, clear/re-search and error states. Czechia has no production-eligible artifact wired to that path, so the correct current UI result is **no verified area available**, with the source and authority explanation. RÚIAN points are not silently converted to an area.

## Unblock conditions

1. Establish explicit redistribution and derivative-publication rights for every Czech Post body used in a public pack, or document why the CC BY 4.0 RÚIAN release is independently sufficient.
2. Pin an opt-in derived-surface method, S-JTSK transform, special-code exclusions, uncertainty, border clipping and topology checks.
3. Pass the country holdout gates, including assignment comparison, complete classification, country partition and independent validation.
4. Publish an approved immutable artifact without personal, customer or land-rights data.
5. Pass real CZ loader/API/app tests for normalization, ambiguity, geometry validity, bounds fit, translucent fill, outline, provenance, loading, no-result, invalid geometry, failure, clear and re-search.
6. Recheck public metadata no earlier than 2026-09-30 after all pending countries have been visited. Authentication, agreements, paid access, new publication destinations and deployment require explicit approval.

The next country in the ledger is Germany (`DE`).
