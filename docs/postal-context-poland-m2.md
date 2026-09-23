# Poland Postal Context M2 source and data-quality review

Observed: 2026-08-30T21:20:33.981Z

Base: 2d527216c5817dfa70f5e46296b8437ad1034703

Outcome: blocked at M1; M2 is not achieved

## Technical summary

Poland has a current official Poczta Polska PNA list and public lookup, but the
evidence available in this run cannot support a production AGID postcode-area
artifact.

The pinned July 2026 official PDF has 1,786 pages, is 7,874,157 bytes and has
SHA-256
`42cac01f8e64ed7cf67d47aed8007b6f0d4e849a845accf3d1a91ebad3700cfe`.
Deterministic full-text inspection found 121,627 `NN-NNN` occurrences and
21,642 distinct values from `00-001` through `99-440`, with no Polygon,
MultiPolygon, GeoJSON or coordinate terms. The PDF says all rights are
reserved and prohibits reproduction, electronic processing, use in another
publication and database storage without Poczta's written consent. Official
pages separately state that electronic PNA lists are purchased and updated
quarterly.

Poczta's current public search database reported 2026-08-30. One minimal
non-personal lookup for `00-940` returned six rows and seven published fields,
but no geometry. It demonstrates multiple membership rows, not an area, a
complete denominator or a reuse grant.

GUGiK documents reusable official PRG administrative boundaries and address
services. Those are administrative/address authorities, not PNA postal-area
authority. The six direct Geoportal/WFS attempts in this environment timed out;
that availability observation does not prove non-existence. No fixed official
postcode-area Polygon/MultiPolygon artifact, digest, topology audit or complete
assignment-to-area reconciliation was established.

No real PL runtime artifact was approved or loaded, so no real postal lookup,
map fit or translucent rendering is claimed.

## Exact data-quality audit

| Gate | Exact result | M2 meaning |
| --- | ---: | --- |
| Official PDF edition | July 2026 | current official public reference |
| PDF pages / bytes | 1,786 / 7,874,157 | exact body pinned |
| PNA occurrences / distinct codes | 121,627 / 21,642 | assignment/membership evidence, not geometry |
| Minimum / maximum code | `00-001` / `99-440` | leading-zero canonical form retained |
| Geometry terms in extracted PDF | 0 | PDF is not a postal-area artifact |
| Public search database date | 2026-08-30 | current individual validation surface |
| `00-940` rows / fields | 6 / 7 | multiple results; no inferred union or envelope |
| Geometry tokens in search result | 0 | search response is not an area |
| Fixed authoritative postal-area artifacts | 0 | digest/topology/coverage gate fails |
| Validated Polygon/MultiPolygon features | 0 | real application area gate cannot pass |
| Approved AGID runtime artifacts | 0 | no real PL API/UI path |

## Country-specific M2 gate

`M2_current_poland_pna_assignment_and_postcode_area_visualization` requires:

1. A current complete Poczta Polska PNA assignment and exception denominator
   usable under explicit reviewed permission for AGID processing, derivation,
   storage, redistribution and public serving.
2. A fixed authoritative Poland postal-code Polygon/MultiPolygon release,
   reconciled code by code while retaining organization, route, P.O.-box,
   point, membership-only and unmatched non-area states.
3. Edition/reference date, provider, licence, attribution, byte length,
   SHA-256, schema, source CRS, reviewed transform, topology, coverage,
   exclusions and reproducible conversion into an approved immutable artifact.
4. A real PL API/application path that normalizes `NN-NNN`, validates only
   real Polygon/MultiPolygon geometry, fits the map, renders translucent fill
   and a clear outline, and displays selected code, geometry kind,
   official/derived/virtual class, source, reference date and confidence.
5. Explicit loading, no-match, multiple-result, API-failure,
   invalid-geometry, clear and re-search behavior.

Voivodeship, district, commune or PRG boundaries, localities, address/building
points, unions of lookup rows, buffers, hulls, Voronoi/raster cells and
synthetic fixtures are prohibited substitutes.

## Reproducible source evidence

Run:

    node scripts/inspect-postal-context-pl-sources.mjs --source-dir <temporary-source-directory> --pdf-text <temporary-extracted-pdf-text>

The inspector fails closed unless eight exact official bodies match recorded
byte lengths and SHA-256 values. It validates the July 2026 PDF metadata,
rights notice, full extracted PNA counts/range and absence of geometry terms;
the public search date, POST contract, endpoints, `00-940` rows/fields and
absence of geometry; and six recorded Geoportal/WFS availability attempts.
Raw bodies, extracted text and search rows are not committed.

## Source, version and rights assessment

- [Poczta Polska System PNA](https://bip.poczta-polska.pl/bez-kategorii/system-pocztowych-numerow-adresowych-pna/)
  defines the five-digit hyphenated system, says Poczta owns its economic
  copyrights and says electronic PDF/XLS/TXT lists are purchased with
  quarterly updates.
- [PNA sales terms](https://sklep.poczta-polska.pl/Regulaminy/Regulamin-kodow-PNA/)
  effective 2023-11-01 describe controlled electronic-list access and
  quarterly updates. They do not establish AGID public redistribution rights.
- [Current official PNA PDF](https://www.poczta-polska.pl/wp-content/uploads/2024/05/spispna.pdf)
  is July 2026. Its first page reserves all rights and requires written consent
  for reproduction, electronic processing, other-publication use and database
  storage.
- [PNA search](https://www.poczta-polska.pl/znajdz-kod-pocztowy/)
  reported database update 2026-08-30. The one `00-940` receipt returned no
  geometry and was retained only as a minimal non-personal validation result.
- [GUGiK PRG](https://www.geoportal.gov.pl/pl/dane/panstwowy-rejestr-granic-prg/)
  documents official reusable administrative and address/location data.
  [GUGiK WFS services](https://www.geoportal.gov.pl/pl/usluga/uslugi-pobierania-wfs/)
  list administrative and address/street services; no postal-code area layer
  or fixed postal-area artifact was verified in this run.

No provider was contacted; no registration, authentication, contract or terms
acceptance, purchase, protected/private query, new data destination,
publication or deployment occurred. This is a conservative engineering reuse
gate, not a legal opinion.

## Application status

Shared deterministic tests cover Polygon/MultiPolygon-only drawing, valid
bounds fit, translucent fill, visible outline, explicit loading/no-match/
multiple/API-failure/invalid-geometry states, provenance, clear and re-search.
Those tests demonstrate application capability, not a real Poland runtime.

For PL:

- normalized real-code lookup: not verified;
- real PL pack loader and API: not verified;
- real official map fit and translucent render: not verified;
- selected-code/provenance UI on real PL data: not verified;
- browser E2E: not run because no approved fixed authoritative area artifact
  exists.

Staging `00-940` as an envelope, an administrative proxy or a synthetic area
would create a false M2 claim, so no browser scene was staged.

## Limitations, blocker and next check

PDF first-page rendering succeeded at the Poppler level, but the local image
inspection tool returned Windows error 206 even for a shortened path. The
first-page rights text was therefore verified by exact-body hashing, PDF
metadata and deterministic text extraction, not claimed as visual review.
Geoportal failures are availability evidence only; they are not proof that a
postal-area dataset does not exist.

Resume when Poczta publishes or grants explicit compatible permission and an
authoritative fixed postal-area release can be obtained. Pin both editions and
digests, reconcile the complete current denominator to exact areas or explicit
non-areas, build an approved immutable artifact, and pass the real PL loader,
API, normalization, validity, fit, translucent fill, outline, provenance,
clear and re-search checks.

Do not retry before 2026-09-06T21:20:33.981Z while pending countries remain,
unless compatible written permission or a fixed authoritative current
postcode-area release appears. Contact, registration, authentication,
contract/terms acceptance, payment, a new repository/publication destination,
publication or deployment requires explicit approval.

No chart is included: the exact table communicates the decisive rights and
zero-geometry-artifact gates more accurately.

Next country after this blocked entry is Portugal (`PT`). No second country
was started in this run.
