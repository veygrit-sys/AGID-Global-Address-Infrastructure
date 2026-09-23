# Greece Postal Context M2 review

## Technical summary

Greece remains blocked at M1. The current Eurostat TERCET 2025 Greece crosswalk contains 1,041 unique, format-valid five-digit codes, but its methodology records no member-state postal dataset or member-state address source for Greece. The rows are carried from GISCO Postal Code 2020 with GeoNames as the primary source, and the country CSV contains only NUTS3 and CODE - no point coordinates and no Polygon/MultiPolygon. ELTA offers public lookup, not a captured bulk denominator or area release.

## The trustworthy result is 1,041 crosswalk codes and zero eligible areas

The intended grain is one current ELTA assignment and its postcode-specific real area or truthful unavailable result. The TERCET table is useful for format and NUTS correspondence checks, but Eurostat warns that codes can be omitted or incorrectly located and excludes non-geographic codes. It is therefore not the current ELTA nationwide denominator.

| Evidence | Exact result | M2 implication |
|---|---:|---|
| TERCET EL rows / distinct codes | 1,041 / 1,041 | Unique, format-valid crosswalk only |
| Duplicate / invalid / blank codes | 0 / 0 / 0 | Internal validity passes |
| ELTA-authoritative assignment rows in reviewed release | 0 | Nationwide denominator not established |
| Polygon/MultiPolygon records | 0 | Real app area path remains blocked |
| ELSTAT/cadastre/address/land rows queried or committed | 0 | No unrelated authority entered AGID |

A chart is omitted because the exact authority/geometry matrix is more useful than plotting one crosswalk, and no spatial surface exists to map.

## Postal, statistical, address and land authority stay separate

ELTA is the postal assignment authority. GISCO/GeoNames points and NUTS matching are official-derived statistical references, not ELTA perimeters. ELSTAT locality, street, census-sector, block and building cartography remains census/statistical context; its request declaration restricts use and redistribution. Cadastral parcels, buildings, addresses, recipients and land rights remain separate and were not queried or committed. Buffers, Voronoi cells, administrative boundaries and synthetic fixtures were not promoted.

## Method and reproducibility

The audit directly captured eleven official ELTA, Eurostat/GISCO/TERCET and ELSTAT responses, recording retrieval time, HTTP status, byte length, Last-Modified where supplied and SHA-256. The TERCET ZIP was expanded only in a temporary audit directory; its single CSV was parsed by semicolon and apostrophe quoting, then checked for row count, uniqueness, five-digit validity, blanks and NUTS3 completeness. Raw captures and crosswalk rows are not committed.

Poppler rendered TERCET methodology V4 page 4 and ELSTAT's one-page reuse policy. The rendered Greece row and table headers match pdfplumber extraction, and both pages are legible without clipping or overlap. The TERCET CSV count exactly matches the methodology total of 1,041.

## Limitations and robustness

- The Greece methodology row has zero member-state postal and address records; the 1,041 entries are carried from GISCO 2020 and cite GeoNames. They do not prove current ELTA completeness.
- The public GISCO postcode product is a point dataset and warns of omissions and incorrect positions. Non-geographic PO-box and large-organization codes are excluded.
- ELTA's captured finder supports street/village search but does not expose a reviewed bulk assignment file, polygon release or product-specific redistribution grant.
- ELSTAT's general reuse statement does not override the specific cartographic request declaration, which limits purpose and redistribution.
- Shared UI tests prove the application can validate Polygon/MultiPolygon, fit bounds, show translucent fill and a visible outline, clear and re-search. They do not prove a real GR polygon exists.

## Recommended next step

Do not authenticate, submit ELSTAT requests, accept terms, pay, query address/cadastre/land rows, create a publication destination, publish or deploy without explicit approval. After pending countries and 2026-09-06T09:16:27.503Z, recheck ELTA and official geospatial sources for an unrestricted current assignment denominator and postcode-specific polygon release. Resume earlier only if such a release appears.

## Further questions

The decisive questions are whether ELTA will publish a current reusable nationwide assignment denominator and whether an authoritative source will publish postcode membership as Polygon/MultiPolygon with derivative/public-serving rights. Until both are answered and the real API/app path passes, M2 remains unmet.
