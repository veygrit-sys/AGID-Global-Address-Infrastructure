# Timor-Leste Postal Context M2 source and visualization review

## Executive summary

Timor-Leste remains at **M1 metadata**. Five exact primary references were
retrieved on 2026-08-29 and bound to SHA-256 receipts: the Correios home and
contact pages, the August 2026 UPU Timor-Leste addressing sheet, UPU's current
Addressing Solutions page, and the Ninth Constitutional Government programme.

The UPU sheet corrects AGID's old five-digit-only metadata: the canonical
postcode has seven characters, `TL` followed by five digits. The references do
not provide a complete current assignment table, Postal Code to Polygon
relation, coverage statement, CRS, topology or explicit AGID redistribution/
API grant. No geometry was generated. Administrative Post boundaries, office
points and delivery examples do not become postal areas.

## Evidence and lineage

| Reference | Exact receipt | Observed fact | M2 limitation |
|---|---|---|---|
| Correios home | `sha256:318ff095…abfbf` / 29,007 bytes | Current official operator surface; footer says all rights reserved | No public assignment or geometry dataset identified on the reviewed page |
| Correios contact | `sha256:7b4e913d…55d3` / 15,692 bytes | Dili Central Post Office contact address includes unlabelled `535022` | Six digits conflict with documented `TL` + five-digit syntax; not classified as a postcode |
| UPU Timor-Leste sheet | `sha256:569613b0…8f3f` / 291,930 bytes | August 2026; 2 pages; seven characters; five delivery examples | Format/examples only, not complete assignments or postal areas |
| UPU Addressing Solutions | `sha256:56a6a7af…e81e` / 199,998 bytes | Universal POST*CODE 2026.1 has licence documents, contract, NDA, declaration and rates | Contractual/paid path was not entered |
| Government programme | `sha256:66cab68a…3714` / 338,384 bytes | Plans municipal hubs and delivery to Administrative Post level | Planning and administrative geography do not define postcode boundaries |

Raw HTML/PDF bodies and rendered PDF pages were used only in the isolated
audit workspace and are excluded from Git. The source report preserves URLs,
byte counts, digests and observations without republishing source content.

## Definitions and scope

The canonical syntax is `^TL[0-9]{5}$`; the country prefix is part of the
postcode. The UPU sheet lists country ISO code, region code, office type and
delivery code as components and gives `TL11212`, `TL10901`, `TL42000`,
`TL11200` and `TL10001` as examples. These examples do not prove that all
five-digit suffixes are assigned, current or polygonal.

M2 is defined as a current, complete-for-declared-coverage assignment and
exact permitted delivery-area release with real TL API and application proof.
It excludes administrative boundaries, point buffers, Voronoi cells, learned
regions, routes, P.O. boxes, organizations and synthetic fixtures.

## Quality assessment and robustness

The current UPU PDF was profiled as a two-page A4, non-encrypted, tagged PDF
and visually rendered. Text extraction confirmed the seven-character rule and
five examples. The rendered-page inspection path was attempted; the local
viewer rejected the long Windows path, so the review relies on exact-byte
binding, PDF metadata, extraction and the already rendered files retained only
in the temporary audit workspace. This limitation does not change the absence
of geometry.

The Correios contact page's `535022` is retained as an unclassified contact-
address token. It is not silently corrected to `TL535022`, truncated or used
to infer an assignment. Missingness, duplicates, national coverage, current
validity and geometry validity remain `null`: no eligible row or feature set
provides defensible denominators.

## Rights and authority boundary

Correios states that all rights are reserved. No express bulk redistribution,
derivative-polygon or AGID API-serving grant was found on the exact reviewed
pages. The UPU country sheet is copyrighted format documentation. Its
Universal POST*CODE product is accompanied by a contract, NDA, use declaration
and rates; no login, contract, payment or terms acceptance occurred. This is an
engineering gate, not a legal opinion.

Postal polygons may only come from a permitted source that explicitly defines
their postal meaning. House numbers and buildings may only be displayed from a
separate explicit address/building relation. Containment and proximity never
create those facts.

## Current app result and blocker

Shared deterministic tests cover exact-code candidate selection, API geometry
opt-in, Polygon/MultiPolygon filtering, map fit, opacity-0.22 fill,
opacity-0.95 width-3 outline, clear and repeat search, and failure states. The
shared notice still lacks separate authority-class, basis-date and confidence
fields. More importantly, TL has zero eligible postal-area features, no real
runtime, no API response and no browser-verifiable country result. A synthetic
feature would test code only and cannot establish M2.

## Required M2 pipeline

1. Obtain a current complete-for-declared-coverage `TL`-prefixed assignment
   source and exact permitted Polygon/MultiPolygon delivery areas or explicit
   relations from which they can be reproduced.
2. Preserve delivery-mode, locality, shared-code and non-area exceptions;
   resolve `535022` only through authoritative evidence.
3. Record terms, retrieval time, edition, validity, CRS, mappings and hashes;
   validate schema, topology, duplicates, gaps and overlap rules.
4. Publish an approved immutable artifact outside the AGID code repository and
   verify its remote digest. A new repository/destination requires approval.
5. Load the artifact through the real TL runtime/API and verify country plus
   postcode search, failure states, fit, translucent rendering, clear/research
   and visible authority/source/basis-date/confidence.

## Reproducibility and next steps

- Source contract: `data/postal_country_packs/tl/postal-context/m2-source-review.json`
- Audit report: `reports/postal-context-m2/tl-source-review-2026-08-29.json`
- Engineering checks: `reports/postal-context-m2/tl-checks-2026-08-29.json`
- Verification: `npm run verify:postal-context-timor-leste-m2`
- Queue status: `npm run postal-context:m2:status`

Recheck on or after `2026-09-05T04:04:11.098Z` and after the pending-country
pass, or earlier if a rights-cleared assignment/area source or explicit reuse
permission appears. Open questions are national assignment completeness,
`535022` semantics, exact area authority, rights, validity and geometry lineage.

No chart is included because there is no eligible geographic or coverage
measure to visualize; charting five address examples would imply a coverage
precision the sources do not support.
