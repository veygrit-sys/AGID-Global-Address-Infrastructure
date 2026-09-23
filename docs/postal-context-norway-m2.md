# Norway Postal Context M2 source and data-quality review

Observed: 2026-08-30T20:52:33.425Z

Base: 87842c5f622e733bcd92d28650dac36fbb903777

Outcome: blocked at M1; M2 is not achieved

## Technical summary

Norway publishes both a current official postcode register and an open official
postcode-area product, but the evidence available in this run does not satisfy
the country-specific M2 gate.

The public Posten file effective 1 October 2025 has 5,122 unique, well-formed
four-digit rows with G/P/B/S function categories. Its landing page and manual
support automated download and explain the schema, but no reviewed
dataset-specific permission establishes AGID transformation and public serving.
The separately sold street/address register has internal-use/no-resale terms;
those terms are not silently applied to the free postcode table, but neither do
they grant the missing public-serving permission.

Kartverket's official `Postnummerområder` product is materially stronger for
geometry: Norway's public-data catalogue says it contains official postcode
extents, notes that post-office-box codes are additional, advertises GeoJSON,
GML, GDB, SOSI, WFS and WMS, and marks its distributions CC BY 4.0. The current
catalogue receipt was pinned, but repeated IPv4 HTTPS/HTTP requests to the WFS
and Geonorge download hosts timed out. No fixed geometry body, release digest,
feature count, CRS/topology scan or assignment-to-area reconciliation exists.

No real NO runtime artifact was approved or loaded, so no real postal lookup,
map fit or translucent rendering is claimed.

## Exact data-quality audit

| Gate | Exact result | M2 meaning |
| --- | ---: | --- |
| Posten current rows / distinct codes | 5,122 / 5,122 | current operator reference is internally unique |
| Malformed / duplicate code rows | 0 / 0 | four-digit text gate passes |
| G street-address codes | 3,318 | potentially areal ordinary assignments |
| P P.O.-box codes | 1,740 | must remain non-area unless authoritative geometry exists |
| B combined codes | 60 | assignment and geometry must be reconciled |
| S special-service codes | 4 | not ordinary addressing; no area may be invented |
| Municipality references | 359 | primary municipality is context, not postal geometry |
| County-like 21 / 22 rows | 7 / 1 | Svalbard/Jan Mayen classification is retained without identity merge |
| Fixed Kartverket geometry artifacts inspected | 0 | digest/topology/coverage gate fails |
| Validated Polygon/MultiPolygon features | 0 | real application area gate cannot pass |
| Approved AGID runtime artifacts | 0 | no real API/UI path |

## Country-specific M2 gate

`M2_current_norway_assignment_and_official_area_visualization` requires:

1. A current complete Posten four-digit assignment and G/P/B/S denominator
   usable under reviewed AGID processing and public-serving terms.
2. A current fixed Kartverket `Postnummerområder` release under CC BY 4.0,
   reconciled code by code while retaining every P/O-box, special or unmatched
   non-area state.
3. Edition/effective date, attribution, byte length, SHA-256, schema, source
   CRS, reviewed transform, topology, coverage, exclusions, territory handling
   and a reproducible conversion into an approved immutable artifact.
4. A real NO API/application path that normalizes `NNNN`, validates only real
   Polygon/MultiPolygon geometry, fits the map, renders translucent fill and a
   clear outline, and displays selected code, geometry kind,
   official/derived/virtual class, source, reference date and confidence.
5. Explicit loading, no-match, multiple-result, API-failure,
   invalid-geometry, clear and re-search behavior.

Municipality or county boundaries, address/building points, FKB buildings,
buffers, hulls, Voronoi/raster cells and synthetic fixtures are prohibited
substitutes. Posten county-like 21/22 rows do not authorize merging the
repository's `NO` and `SJ` identities.

## Reproducible source evidence

Run:

    node scripts/inspect-postal-context-no-sources.mjs --source-dir <temporary-source-directory>

The inspector fails closed unless six exact official/licence bodies match their
recorded SHA-256 values. It decodes the full Windows-1252 TAB register,
validates every five-field row and four-digit code, computes uniqueness,
municipality, category and 21/22 territory metrics, and verifies the current
Posten and data.norge metadata signals. Raw bodies and postcode rows are not
committed.

## Source, version and rights assessment

- [Posten Bring postcode register](https://www.bring.no/en/services/address-verification-services/postcodes)
  says the table contains all postcodes used for addressing mail and is valid
  from 1 October 2025. The pinned direct text body is 149,756 bytes with
  SHA-256 `7a9f175cfcaa4d2229b0af904098b2cc8ac0825cbd6535949e0571ae887c3538`.
- [Postcode manual](https://www.bring.no/en/services/address-verification-services/postcodes/postcode-manual)
  defines G, P, B and S and documents Svalbard/Jan Mayen county-like codes.
  It documents format and use but does not publish an open-data licence for
  AGID derivation or public serving.
- [Postnummerområder catalogue](https://data.norge.no/en/datasets/1054a4c3-3d57-39e6-9349-0b1a9007407a/postnummeromrader)
  identifies official areal extents, explicitly separates P.O.-box codes,
  advertises monthly downloads/services and labels distributions CC BY 4.0.
  The pinned HTML is 407,882 bytes with SHA-256
  `8d421592dbf7ce4c2d935dfc6a28a42bfc36fbfc4d334f2040f5621c59f0b597`.
- [CC BY 4.0 legal code](https://creativecommons.org/licenses/by/4.0/legalcode.en)
  was pinned separately. This geometry licence does not license Posten's
  assignment register by implication.
- [Street/address register terms](https://www.bring.no/en/services/address-verification-services/address-registers/Product-Terms-Street-and-Address-register.pdf)
  limit that paid product to internal use and forbid resale. It is retained as
  a boundary around address-level data, not asserted as the postcode-table
  licence.

No provider was contacted; no registration, authentication, purchase, terms
acceptance, protected address query, new data destination, publication or
deployment occurred. This is a conservative engineering reuse gate, not a
legal opinion.

## Application status

Shared deterministic tests cover Polygon/MultiPolygon-only drawing, valid
bounds fit, translucent fill, visible outline, explicit loading/no-match/
multiple/API-failure/invalid-geometry states, provenance, clear and re-search.
Those tests demonstrate application capability, not a real Norway runtime.

For NO:

- normalized real-code lookup: not verified;
- real NO pack loader and API: not verified;
- real official map fit and translucent render: not verified;
- selected-code/provenance UI on real NO data: not verified;
- browser E2E: not run because no approved fixed reconciled artifact exists.

Staging one WFS feature, inventing a P/O-box area or using the synthetic fixture
would create a false M2 claim, so no browser scene was staged.

## Blocker and next check

Resume when Posten publishes or grants reviewed permission for AGID processing,
reconciliation and public serving, and a current fixed Kartverket release can
be downloaded and fully verified. Pin both editions and digests, reconcile all
5,122 assignments to an official area or explicit non-area, preserve `NO`/`SJ`
identity, build an approved immutable artifact, and pass the real NO loader,
API, normalization, validity, fit, translucent fill, outline, provenance,
clear and re-search checks.

Do not retry before 2026-09-06T20:52:33.425Z while pending countries remain,
unless a dataset-specific Posten grant or a retrievable fixed current geometry
release appears. Contact, registration, authentication, contract/terms
acceptance, payment, a new repository/publication destination, publication or
deployment requires explicit approval.

No chart is included: the exact table shows the decisive complete register
versus zero verified fixed geometry artifacts more accurately.

Next country after this blocked entry is Poland (`PL`). No second country was
started in this run.
