# Austria Postal Context M2 review

## AT is M2 blocked despite a complete current assignment match

AT remains **M2 blocked**. Fifteen exact official references establish a
strong current assignment baseline: the September 2026 Österreichische Post
postcode directory, its destination directory and RTR's current table agree
on all 2,234 addressable four-digit codes. None of those releases contains a
postcode Polygon/MultiPolygon. AGID therefore has no eligible AT area artifact,
API area response or real-data search-to-translucent-area result.

The target is
`M2_current_assignment_and_statistical_or_derived_postal_area_visualization`.
It accepts an exact operator area, an official-statistical postcode region, or
a clearly derived surface from complete permitted address members. Each class
must retain its authority, basis date, confidence, omissions and uncertainty.
A destination locality, district, municipality or address point cannot be
relabeled as a postal perimeter.

## Three official assignment views reconcile exactly

The operator postcode directory contains 2,515 distinct code rows. Of these,
2,234 are marked addressable, 248 are P.O.-box type, 14 organization type, four
field-post type, five have no listed type, ten are historical and ten are
internal. The destination directory contains 18,624 postcode/locality rows,
2,234 distinct postcodes, 16,990 distinct locality codes and 2,092 municipality
codes. It contains no geometry or coordinate column.

RTR's monthly table contains 2,712 rows and 2,234 distinct addressable codes;
434 code groups have more than one row. The pinned version is `59134`, published
4 August 2026, with a 17 August 2026 timestamp. Code-set comparison across
operator postcode, operator destination and regulator releases has zero
differences.

| Evidence grain | Rows | Distinct addressable codes | Postal polygons | M2 use |
| --- | ---: | ---: | ---: | --- |
| Post postcode directory SEP26 | 2,515 | 2,234 | 0 | Current assignment and class |
| Post destination directory SEP26 | 18,624 | 2,234 | 0 | Destination membership only |
| RTR current table | 2,712 | 2,234 | 0 | Independent assignment check |
| Statistik Austria public WFS | 146 feature types | 0 postcode types | 0 | Public geometry catalog check |

The 2,234-code match is a powerful allocation check but not a measured area-
coverage rate. No chart is included because bars comparing assignment counts
with zero eligible geometry would visually imply a relationship that the
sources do not establish.

## Public statistical geometry was checked and is not currently exposed

Statistik Austria's regional-data page names postcode regions. Its open-data
policy permits machine-readable reuse, including commercial applications and
visualisations. These statements make the statistical source worth checking,
but neither statement is a feature receipt.

The exact public WFS capabilities document lists 146 feature types and none
has a postcode/PLZ name. The STATatlas map catalog has 112 map records. The
current regional-divisions map, online from 23 February 2026, contains 74
configuration features and 13 distinct active layers. Its information text
mentions postcode regions, but none of the active layer entries is a postcode
layer. A map description is not a downloadable Polygon/MultiPolygon artifact.

Statistik Austria's 1 July 2026 regional-package document also names postcode
regions. The reviewed pages state a EUR 118 minimum, a 40% commercial surcharge
and signed terms. No package was bought and no terms were accepted. The priced
postcode packages describe statistical attributes by region; the reviewed
document does not itself provide an exact geometry release. A purchase or
contract decision needs separate approval and still would require dataset-
specific geometry and reuse verification.

## Address-register membership is not silently converted into a perimeter

BEV describes the Austrian Address Register as nationwide and authentic and
states that postcode areas supplied by Österreichische Post are incorporated
quarterly. This establishes a high-value possible membership source, not a
public immutable postcode-polygon artifact in this run. No full raw address
product was ordered, accepted or committed.

A future derived surface may be built only from a complete permitted stable
address-to-postcode relation. It must retain the exact member set, exclusions,
algorithm, parameters, boundary clips, topology checks, validation holdouts,
valid time, source release, rights and digest. It remains `derived`; it cannot
be called an Austrian Post official perimeter. A district, municipality,
destination locality, point buffer, Voronoi cell, learned model or AGID cell is
not a substitute.

Special records remain non-area unless their source explicitly supplies an
area. The reviewed operator directory has 248 P.O.-box, 14 organization, four
field-post and five unclassified type rows. They receive no invented polygon.
House numbers and buildings require a separate permitted stable address or
building relation; postcode containment alone cannot identify either.

## Reproducible review and application status

The bounded inspector verifies byte length, SHA-256, exact schema and aggregate
profiles for both XLSX files and RTR JSON; markers for official HTML/JavaScript;
WFS and STATatlas catalog counts; and PDF signatures. The Post legend physical
page 1 and Statistik Austria physical pages 2, 7 and 9 were visually reviewed
against the same hashed bytes. Raw HTML, XLSX, JSON, XML and PDF bodies remain
outside Git.

Shared deterministic application tests cover normalized candidate resolution,
Polygon/MultiPolygon-only drawing, geometry opt-in, bounds and fit, translucent
fill, clear outline, update/removal, no-result and API-failure behavior. AT has
only metadata and synthetic fixtures in the AGID pack, so shared capability
cannot produce a postal-authorized area. Browser E2E would be synthetic and is
not claimed as country M2 evidence.

No account, authentication, payment, contract acceptance, new repository,
public destination, production deployment or force push was used. The result
is a source-backed negative finding: current assignments are verified, current
drawable postcode areas are not.

## Uncertainty, retry and unblock path

A reusable official-statistical layer may be published later, or BEV/Post may
offer a permitted complete member relation. Recheck only after the pending-
country pass and no earlier than `2026-09-29`, unless an exact public current
rights-cleared release appears sooner. Do not purchase, sign terms, authenticate
or create a publication destination without explicit approval.

M2 can resume when a source provides either an exact current postcode
Polygon/MultiPolygon or a complete permitted stable member relation. Pin
edition, valid time, schema, coverage, rights, attribution and SHA-256; produce
and validate the correct authority class; publish an approved immutable
artifact; then verify the actual AT loader, API and app search, fit, translucent
fill, outline, provenance, failure states and clear/re-search behavior.

The next country is **AX (Åland Islands)**. No second country was
started.
