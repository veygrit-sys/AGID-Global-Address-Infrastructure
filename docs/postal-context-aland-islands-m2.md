# Åland Islands Postal Context M2 review

## AX has real statistical areas but is still M2 blocked

AX remains **M2 blocked**. The current Posti PCF release dated 29 August
2026 contains 37 Åland `22xxx` assignments: 33 normal records and four
P.O.-box records. Statistics Finland Paavo `pno_2026` supplies 32 real
Polygon/MultiPolygon features. Every feature joins exactly to a normal PCF
code and all 32 pass geometry validity, ring-closure and coordinate-range
checks.

Five current assignments have no Paavo area: P.O.-box codes `22101`, `22111`,
`22151`, `22411`, and postal-terminal code `22110`. They deliberately produce
a non-area outcome. AGID has not published an approved immutable transformed
artifact and has no AX production loader/API/app path, so source availability
alone does not satisfy M2.

The target is
`M2_current_assignment_and_official_statistical_postal_area_visualization`.
Paavo geometry retains `official_derived_statistical_postal_code_area`
authority and a 2026 basis year. It is not an Åland Post delivery perimeter.

## Thirty-two current codes have valid drawable geometry

The fixed-width PCF payload has 37 unique AX records, one 220-character row
per code, with release date `20260829`. Type `1` contributes 33 normal codes;
type `2` contributes four P.O.-box codes. The terms document explains the
record layout and type field, and states that Åland is present only at postcode
level rather than street level.

The coastline-clipped Paavo layer has 32 unique codes, one Polygon and 31
MultiPolygons across 16 municipalities. Its 530 rings contain 71,496 vertices;
all rings close, no coordinate falls outside longitude/latitude bounds, and
all 32 features pass Turf `booleanValid`. The bounding box is
`[19.47207822, 59.81333355, 21.15211945, 60.54039612]`.

| Evidence grain | Current codes | Drawable areas | Authority | M2 use |
| --- | ---: | ---: | --- | --- |
| Posti PCF 20260829 | 37 | 0 | Postal assignment/type | Current code baseline |
| Paavo pno_2026 | 32 | 32 | Official-derived statistical | Candidate map area |
| Explicit non-area outcome | 5 | 0 | PCF type/operational context | No polygon |
| Published AX artifact/API/app | 0 | 0 | None yet | Blocking gap |

A chart is omitted because this is an exact code-set and topology audit; a
table preserves the five non-area exceptions and avoids implying that record
counts measure geographic coverage.

## Scope and authority remain deliberately separated

A PCF row proves a current assignment, type and effective date for this
review, not a perimeter. Paavo areas are generalized by Statistics Finland
from the postcodes of buildings. The manual explicitly warns that individual
address postcodes do not themselves form areas and that a building's
statistical area may differ from its address postcode. Two geometry variants
exist; this review pins the coastline-clipped `pno_2026` layer and does not
silently substitute the sea-extended layer.

AX territory identity is preserved even though Posti and Statistics Finland
host the source products. The five no-area codes are not filled with an office
point, locality, municipality, buffer, Voronoi cell, learned region or AGID
cell. Postcode containment also does not prove a house number, named building
or delivery point; those require a separate permitted stable relation.

## Reproducible method binds assignments, rights and geometry

Twelve exact official references were byte- and SHA-256-bound. The inspector
checks the current PCF ZIP and extracted payload, fixed-width record schema,
AX region and code filters, code uniqueness, assignment types, WFS catalog and
schema markers, exact GeoJSON bytes, one-to-one code join, geometry types,
Turf validity, ring closure, coordinate range, feature year and aggregate
counts.

Posti service terms physical pages 1–3 and Paavo manual physical pages 2–3
were visually reviewed against the same hashed PDF bytes. Posti permits
third-party disclosure when its terms and download date accompany the data.
Statistics Finland applies CC BY 4.0 attribution. Åland Post pages are used as
corroborating operator references; no separate bulk geometry right is inferred
from those pages.

Raw PCF, HTML, XML, PDF and GeoJSON bodies remain outside Git. No account,
authentication, payment, contract acceptance, new repository, publication
destination, production deployment or force push was used.

## Application capability exists only at the shared-contract level

Shared deterministic tests verify normalized exact search,
Polygon/MultiPolygon-only drawing, geometry opt-in, bounds and fit, translucent
fill, clear outline, update/removal, no-result and API-failure behavior. They
do not load the reviewed AX bytes. AX therefore has no real API geometry
response and no app run proving that a searched code fits and displays the
real area with authority, source, basis date and confidence.

The required production behavior is explicit: the 32 area-backed codes may
draw the Paavo geometry with `official-derived` status; the five non-area
codes must show why no polygon exists. Browser E2E would be synthetic until a
published AX artifact and actual loader exist, so it is not claimed as M2
evidence.

## Limitations and unblock path

The 32 features establish statistical visualization coverage for the joined
codes, not operator delivery boundaries or a land-area coverage percentage.
Paavo is annual while PCF is current on 29 August 2026; changes after the 2026
Paavo classification can create temporal mismatches. The five missing areas
are explicit outcomes, not topology defects.

M2 can resume after approval of a publication destination. Transform the
pinned PCF and Paavo releases into an attributed immutable artifact with exact
bytes and SHA-256, implement the AX loader/API, then run real-data search, fit,
translucent fill, outline, provenance, invalid-geometry, failure, clear and
re-search verification. Recheck public metadata only after the pending-country
pass and no earlier than `2026-09-29`, unless a newer exact release appears.

## Recommended next step and open questions

1. Approve one immutable public data destination and release convention for
   transformed country artifacts.
2. Add AX runtime ingestion with explicit `official-derived` and non-area
   result types.
3. Decide whether PCF daily updates should be joined to the annual Paavo basis
   at request time or only at signed release builds.
4. Determine whether a future Paavo refresh adds geometry for `22110`; never
   infer it from the terminal location.

The next country is **BA (Bosnia and Herzegovina)**. No second country was
started.
