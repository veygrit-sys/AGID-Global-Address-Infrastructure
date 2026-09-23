# Tajikistan Postal Context M2 source and visualization review

## Executive summary

Tajikistan remains at **M1 metadata**. Three exact official references were
retrieved on 2026-08-29 and bound to SHA-256 receipts: the Tajik Post postcode
list, its postal-office list, and the UPU Tajikistan addressing sheet. They
confirm a six-digit system and expose locality assignments and office
addresses, but no Postal Code → Polygon relation, coverage statement, CRS,
topology, effective edition or explicit AGID redistribution/API grant.

No geometry was generated. Turning an office point, settlement footprint,
administrative boundary, learned cell or Voronoi region into a postal polygon
would assert an authority the sources do not provide. The shared AGID search
and translucent-map path is tested, but no real TJ runtime result exists, so
the country cannot satisfy the visualization part of M2.

## Evidence and lineage

| Reference | Exact receipt | Observed fact | M2 limitation |
|---|---|---|---|
| Tajik Post postcode list | `sha256:621be62b…712d7a6` / 78,606 bytes | Two articles; 258 six-digit occurrences, 188 distinct codes | Mixed summary/detail grain, repeated codes, no geometry or edition |
| Tajik Post office list | `sha256:5d0c9a08…7762dfa5` / 85,839 bytes | 88 facility rows, 80 distinct codes | Office locations are not service/postal areas |
| UPU Tajikistan sheet | `sha256:80fbaacb…52735cb7` / 212,789 bytes | September 2019; six digits; province/district/post-office coding components | Address-format documentation, not area data |

Raw bodies and the rendered PDF page were used only in the isolated audit
workspace and are excluded from Git. The source receipt report preserves the
URLs, byte counts, digests and observations without republishing source data.

## Quality assessment

The index page contains 37 codes repeated within its two differently grained
articles; the most frequent code occurs 18 times. The office table contains
eight repeated codes, with at most two listed facilities per code. These facts
show that code-to-place is not safely one-to-one. They are not interpreted as
an error rate because the page does not publish row identity or declare the two
articles to be one normalized dataset.

The displayed `753456` value is a six-digit syntactic match but an outlier from
nearby `735…` values. AGID records it as requiring authoritative confirmation;
it is not silently corrected. Completeness, missingness, current validity,
coverage and geometry validity remain `null` because the reviewed materials do
not support defensible denominators or any eligible feature set.

## Rights and authority boundary

The Tajik Post pages state that all rights are reserved. The review found no
explicit bulk redistribution, derivative-polygon or AGID API-serving grant.
The UPU sheet is copyrighted format documentation. UPU's Universal POST*CODE
database is a licensed contractual product; no login, contract, payment or
terms acceptance was performed. This report records evidence and an
engineering gate, not a legal opinion.

Postal polygons may only come from an explicitly permitted source that defines
their postal meaning. House numbers and buildings may only be displayed from a
separate explicit address/building relation. Containment or proximity never
creates those facts.

## Required M2 pipeline

1. Acquire an editioned, current and complete-for-declared-coverage assignment
   source plus exact permitted Polygon/MultiPolygon areas or explicit relations
   from which those areas can be reproduced.
2. Preserve shared-code and locality exceptions; do not dissolve unrelated
   places merely because the normalized six-digit value matches.
3. Record terms, source time, edition, validity, CRS, field mapping and hashes;
   validate schema, topology, duplicates, gaps and overlap rules.
4. Publish an approved immutable artifact outside the AGID code repository and
   verify its remote digest. New repositories or data destinations require
   additional approval.
5. Load that artifact through the real TJ runtime/API. In the app, search by
   country plus normalized postcode, expose not-found/multiple/API-failure/
   invalid/non-area states, fit valid areas, draw a translucent fill and clear
   outline, and show authority class, source, basis date and confidence.

## Current app result and blocker

Shared deterministic tests cover exact-code candidate selection, API geometry
opt-in, Polygon/MultiPolygon filtering, map fit, opacity-0.22 fill,
opacity-0.95 width-3 outline, clear and repeat search, and failure states. The
shared notice still lacks separate authority-class, basis-date and confidence
fields. More importantly, TJ has zero eligible postal-area features, no real
runtime, no API response and no browser-verifiable country result. A synthetic
feature would test code only and cannot establish M2.

Recheck after `2026-09-05T03:38:36.537Z` and after the pending-country pass,
or sooner when a rights-cleared current postcode-area source or explicit reuse
permission becomes available.

## Reproducibility

- Source contract: `data/postal_country_packs/tj/postal-context/m2-source-review.json`
- Audit report: `reports/postal-context-m2/tj-source-review-2026-08-29.json`
- Engineering checks: `reports/postal-context-m2/tj-checks-2026-08-29.json`
- Verification: `npm run verify:postal-context-tajikistan-m2`
- Queue status: `npm run postal-context:m2:status`

No chart is included because there is no eligible geographic or coverage
measure to visualize; charting counts from mixed-grain HTML would imply a data
quality precision the sources do not support.
