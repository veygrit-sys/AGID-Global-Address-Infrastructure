# Albania Postal Context M2 review

## AL is M2 blocked despite 535 official office/code rows

AL remains **M2 blocked**. Twenty-two exact official references establish the
four-digit format, 14 Posta Shqiptare regional tables and 535 observable
office/code rows. They do not publish a current edition/completeness contract,
a postcode-to-address or road membership table, or a reusable Albania postal
Polygon/MultiPolygon. AGID therefore has no eligible AL artifact, API area
response or real-data search-to-translucent-area result.

The country target is
`M2_current_office_assignment_and_postal_area_visualization`. It preserves
office/branch semantics and requires a separately authoritative area. An
office point, cadastral asset or address-system building cannot be relabelled
as the complete area for a four-digit code.

## The public tables are useful but not versioned area evidence

The 14 official pages contained 535 syntactically valid rows and 532 distinct
codes at review time. Three codes repeat: `4018`, `5008` and `8502`. The
duplicates include both repeated-office and different-office cases, so code
uniqueness and one-office-per-code cannot be assumed. The pages expose no
edition, validity interval, row identifier or declared completeness boundary.

The one-page UPU sheet is labelled September 2014. It confirms four digits,
shows `1001` and `1041`, and distinguishes postal office and branch positions.
It is address-format evidence, not a current allocation or geometry release.

| Evidence grain | Observed rows | Distinct codes | Postal polygons | M2 use |
| --- | ---: | ---: | ---: | --- |
| Posta Shqiptare 14 regional pages | 535 | 532 | 0 | Current public reference only |
| Open cadastral-assets workbook | 562 | 0 | 0 | Property inventory; excluded as postal membership |
| UPU and ASIG references | 0 | 0 | 0 | Format, rights and non-postal context only |

No chart is included because the only quantitative comparison is an audit
inventory with zero eligible postcode geometry. A chart would imply measured
postal-area coverage that the evidence cannot support.

## The Open Data workbook does not contain postal coverage

Posta Shqiptare's Open Data page explicitly describes listed files as open and
reusable under Albania's public-sector information reuse framework. Its link
labelled “postal offices by cadastral zones” resolves to a 33,841-byte XLSX
last modified 4 November 2025. The workbook has one sheet, 562 data rows, 430
populated cadastral-zone values and 333 distinct zones. It has no postcode,
coordinate or geometry column and no relation from a code to served addresses.

The actual columns describe company property, cadastral zone, property number,
area, property type and value. Those are cadastral asset/land-right records,
not delivery membership. Raw workbook rows stayed in temporary audit storage
and are not committed. A cadastral zone cannot become a postcode polygon merely
because a postal-company property lies inside it.

## ASIG supplies context under incompatible authority and use terms

ASIG lists Buildings, Enumeration and Road Addresses for the national address
system. Enumeration explicitly refers to 2007 aerial photography. These
layers may provide address, road or building context, but the reviewed catalog
does not assert that their features are Posta Shqiptare delivery areas.

The Geoportal terms restrict users to non-profit and non-commercial use,
prohibit automated programs, and describe tariffs for download/transformation.
A separate notice says public-institution download needs credentials; the 2026
ATOM notice requires registration or e-Albania credentials. None was used or
accepted. These conditions do not support an AGID public postal API or bundled
artifact and are recorded as operational gates, not a legal opinion.

## Reproducible review and application status

The bounded inspector verifies byte length, SHA-256, MIME, HTML markers, all
14 table counts, PDF signature and the XLSX schema/aggregate profile. UPU
physical page 1 was visually reviewed against the same hashed bytes. Raw HTML,
PDF and XLSX bodies stay outside Git. No account, authentication, payment,
contract acceptance, new repository, public destination or deployment was
used.

Shared deterministic tests cover exact candidate resolution,
Polygon/MultiPolygon-only drawing, geometry opt-in, bounds/fit, opacity-0.22
fill, opacity-0.95 width-3 outline, update/removal and API failures. AL has only
metadata and synthetic fixtures, so shared capability cannot produce a
postal-authorized area. Browser E2E would be synthetic and is not claimed as
country M2 evidence.

## Uncertainty, retry and unblock path

The official tables may be operationally current, and a permitted address/code
crosswalk may exist behind an agreement. Recheck only after the pending-country
pass and no earlier than `2026-09-05T08:52:51.000Z`, unless Posta Shqiptare or
ASIG publishes a current rights-cleared area/member release sooner. Logging in,
accepting terms or arranging a licence needs explicit approval and rights
review.

M2 can resume when a source supplies current complete four-digit assignments,
stable row identity, edition, validity, schema, explicit reuse/derivative/
redistribution/API rights and a complete postcode-to-address/road relation or
exact official area. Reproduce and validate official or clearly derived
Polygon/MultiPolygon, publish an approved immutable artifact outside AGID, then
verify the actual AL loader, API and app search, fit, translucent fill, outline,
clear/re-search and provenance fields.

Further questions are whether Posta Shqiptare will publish versioned postcode
assignments as an explicitly listed reusable file, whether a permitted National
Address System crosswalk exists, and whether ASIG can grant public commercial
derivative/API rights. The next country is **AT (Austria)**; no second country
was started.
