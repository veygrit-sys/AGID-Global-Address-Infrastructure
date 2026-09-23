# Vietnam Postal Context M2 review

## Decision

VN remains **M2 blocked**. Official current notices establish a five-digit,
two-tier administrative assignment regime, but the reviewed official portal
does not provide a verifiable current Decision 2334 annex, a postal-area
Polygon/MultiPolygon release, or a search-to-translucent-area application path.
AGID therefore has no eligible VN artifact, API result or real-data app view.

## Definition and gate

`M2_current_five_digit_postal_area_visualization` requires a current complete-
for-declared-coverage assignment and permitted Polygon/MultiPolygon artifact,
with code-to-area semantics, jurisdiction, validity, CRS, topology, terms,
edition and SHA-256 pinned. The immutable approved artifact must load through
the VN runtime/API and the app must normalize search, distinguish all result
and failure states, fit the map, render a translucent fill and clear boundary,
clear/re-search, and show authority, source, basis date and confidence.

Administrative assignments and boundaries, office or Vpostcode points,
buffers, Voronoi cells and models are not official postal areas. Buildings and
house numbers require a separate explicit permitted stable address relation.

## Evidence and data quality

Seven official references were bound to exact bytes and SHA-256. Vietnam Post's
current notice dates Decision 2334/QD-BKHCN to 24 August 2025 and directs
users to the national portal. The ministry article was published on 25
November 2025 but states 18 November 2024 in its body. That official date
conflict is unresolved and the reviewed article exposes no annex attachment.

The portal client provides text autocomplete through a cleartext HTTP POST.
The equivalent HTTPS route returned 404 in the bounded probe. No
Polygon/MultiPolygon, GeoJSON, map client or fit behavior appears in the exact
portal shell. Its legal-document page lists Decision 2475/QD-BTTTT from 2017,
not Decision 2334. The linked 386,841,053-byte directory advertises a 19 June
2018 Last-Modified value and therefore cannot be treated as the current 2025
allocation without a provider release statement. The complete SHA-bound PDF
has 552 scanned pages created and modified in June 2018. Visual checks of the
cover, abbreviations, lookup instructions, a district/code table and the final
page found tabular routing content, not polygon coordinates, CRS or topology.

The two-page May 2021 UPU sheet verifies five-digit syntax and home, rural,
building-complex, post-office and special-delivery semantics. It predates the
two-tier reform and contains no postal-area geometry.

## Rights and authority separation

The ministry and Vietnam Post pages request source attribution for republished
website information. That is not a verified grant for bulk rows, derivative
polygons, persistence, immutable publication, redistribution or public AGID
API serving. No account, registration, application, contract or payment was
performed.

No ward, commune, administrative border, address row, office point,
Vpostcode point, building, parcel, buffer, Voronoi cell or model was relabelled
as official postal geometry. Raw source bodies remain outside Git.

## App status and validation

Shared deterministic tests cover exact postcode search, geometry opt-in,
Polygon/MultiPolygon-only drawing, fit, translucent fill, clear outline,
clear/re-search and failure states. Vietnam's existing runtime remains
metadata/synthetic only. There is no rights-cleared real VN descriptor, API
area response or app end-to-end result; the shared visible notice also lacks
distinct authority, basis-date and confidence fields.

No chart is included: zero current rows and zero production postal polygons
were validated, so a chart would add no information and could imply coverage.

## Unblock and next action

After the pending-country pass and no earlier than
`2026-09-05T07:20:00.000Z`, recheck for a current public rights-cleared
Decision annex and postal-area release. Using controlled address, NSDI,
Vpostcode or mapping products requires explicit approval plus exact written
rights. Then validate all declared coverage, non-area exceptions, CRS,
topology and dates; publish an approved immutable artifact outside AGID; and
verify a real VN API/app search-to-translucent-area result with provenance.

The next country in the ledger is **YE (Yemen)**. No second country was
started in this run.
