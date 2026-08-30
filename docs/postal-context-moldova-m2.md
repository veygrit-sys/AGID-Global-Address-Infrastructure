# Moldova Postal Context M2 source and data-quality review

## Technical summary

Moldova does not meet M2. The current official public map/API is a postal-facility Point product, while the official-government workbooks are stale, geometry-free and do not specify dataset-level reuse terms. No reviewed source supplies a real postcode Polygon/MultiPolygon or a complete current ordinary-plus-exception denominator.

## Exact data-quality audit

| Evidence | Rows/features | Distinct codes | Point | Polygon/MultiPolygon | Rights/currentness | M2 use |
|---|---:|---:|---:|---:|---|---|
| Poșta Moldovei public office API | 1,164 active facilities | 1,144 labels | 1,164 | 0 | Current public lookup; no reviewed bulk-serving grant | Facility context only |
| Poșta query `zip_code=2012` | 1 facility + 26 membership rows | 1 requested code | 1 | 0 | Current public lookup | Assignment context, not area |
| ASP `Coduri postale RM` XLSX | 1,676 code-bearing rows | 1,174 canonical codes | 0 | 0 | 2015 resource / 2020 metadata / License Not Specified | Legacy audit only |
| ASP district and Chișinău XLSX | 3,197 code-bearing rows | 58 + 37 per workbook | 0 | 0 | 2015 resources / 2020 metadata / License Not Specified | Legacy membership audit only |

A chart is intentionally omitted: the exact table communicates the decisive zero-area result without implying a continuous measure.

## Country-specific M2 definition

A current complete rights-cleared Poșta Moldovei/ASP ordinary and exception assignment denominator, including post-office, agency, center, terminal, transit, courier, PO-box, route and special/non-geographic classes, and real postcode Polygon/MultiPolygon surfaces are pinned by edition or retrieval basis, effective date, terms, byte length, SHA-256, coverage and exceptions, published as an approved immutable artifact, and loaded through the real MD API/app so a normalized MD-NNNN search fits and renders a translucent area with a clear outline, selected code, geometry kind, official/derived/virtual classification, source, reference date and confidence. Public office points, street/house membership tables, 2015-2020 XLSX, broad distribution-quality zones, facility/route/PO-box/organization endpoints, locality/administrative/address/building/parcel proxies, buffers, hulls, Voronoi/raster cells and synthetic fixtures never satisfy M2 by themselves. A derived surface is eligible only from an expressly authorized complete current postal-membership denominator with reproducible lineage, limitations and noncanonical status preserved.

## Authority and method

The audit pins nineteen exact official bodies by byte length and SHA-256. The public API was profiled by record status, distinct code label, facility type and geometry type. All coordinates are valid Points; five postal-terminal labels are not four-digit codes and remain exception labels. The three workbooks were profiled sheet-by-sheet for nonempty rows, code-bearing cells, canonicalization variants, duplicates and geometry fields. No raw source body is committed.

Postal assignment, facility identity, street/house membership, broad service-quality distribution zones, administration, address/building identity and AGID containment remain separate authorities. The distribution zones aggregate many codes and are not code boundaries. Street/house rows are not buffered, hulled or dissolved.

## Rights and limitations

The current date.gov.md portal describes general reuse, but also requires dataset-specific licences to be respected. Each reviewed legacy CKAN package says `License Not Specified`; general guidance is not treated as a dataset grant. The e-commerce API requires an Authorization token and was not used. No account, contact, contract, terms acceptance, payment or protected row was requested.

## Application status

The shared application contract correctly accepts only Polygon/MultiPolygon for area rendering, fits valid geometry, uses a translucent fill and clear outline, and handles clear/re-search plus non-area Points. No real eligible MD polygon exists, so no MD API area response, real map fit, translucent postal area or browser E2E is claimed. Point, membership and synthetic data were not staged as an area.

## Unblock condition

Recheck after pending countries and 2026-09-06T17:52:30.260Z. M2 can proceed only when a current complete rights-cleared ordinary-and-exception denominator plus real authoritative or expressly authorized reproducible derived Polygon/MultiPolygon basis is available, source terms and hashes are pinned, exception classes remain non-area where appropriate, an immutable artifact is approved, and the real MD API/application rendering path passes.
