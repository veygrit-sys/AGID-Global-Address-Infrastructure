# Romania Postal Context M2 source and data-quality review

Observed: 2026-08-30T22:30:06.794Z

Base: a236610d837d0c63500e82cd37fe06eb0f511472

Outcome: blocked at M1; M2 is not achieved

## Technical summary

Poșta Română currently describes a periodically updated national postcode
database with address-to-postcode and postcode-to-address search. Its official
structure document defines exactly six numeric digits, and current
organizational rules assign national postal-nomenclature maintenance to the
operator.

Those facts do not satisfy the production M2 area gate. Infocod is supplied to
clients after a written request and receives monthly updates in the described
sorting arrangement. ANCOM Decision 810/2024 places third-party postal-provider
access to the postcode system behind a civil contract with technical and
economic terms. No reviewed grant for AGID processing, derivation, storage,
redistribution and public serving was established.

Seven exact official bodies total 4,689,771 bytes and are pinned by SHA-256.
The operator's dated digitalization document says the postcode database then
lacked GPS coordinates and distinguishes street-level codes in 47 municipalities
from single-code localities elsewhere. This is time-bounded negative evidence,
not proof that no newer operator geography exists. No newer fixed authoritative
postcode Polygon/MultiPolygon release was identified or validated in this run.

No real RO runtime artifact was approved or loaded, so no real postal lookup,
map fit or translucent rendering is claimed.

## The assignment evidence is current enough to audit but not open enough to serve

| Gate | Exact result | M2 meaning |
| --- | ---: | --- |
| Exact official bodies / bytes | 7 / 4,689,771 | acquisition receipts are reproducible |
| Canonical numeric format | `NNNNNN` / 6 digits | leading-zero normalization is explicit |
| Public search | address-to-code and code-to-address via POST | validation surface, not bulk distribution |
| Infocod update cadence | monthly | controlled assignment evidence exists |
| ANCOM access basis | civil contract | no blanket AGID public-serving grant |
| Dated street-level municipalities | 47 | assignment granularity is heterogeneous |
| Dated postcode database GPS | absent | cannot imply current areal geometry |
| Polygon/MultiPolygon/GeoJSON/Shapefile byte tokens | 0 | pinned bodies do not advertise an area distribution |
| Fixed authoritative postal-area artifacts | 0 | digest/topology/coverage gate fails |
| Validated Polygon/MultiPolygon features | 0 | real application area gate cannot pass |
| Approved AGID runtime artifacts | 0 | no real RO API/UI path |

## Scope and the country-specific M2 definition

`M2_current_romania_postcode_assignment_and_authoritative_area_visualization`
requires:

1. A current complete Poșta Română six-digit assignment and exception
   denominator usable under explicit reviewed permission for AGID processing,
   derivation, storage, redistribution and public serving.
2. A fixed authoritative Romania postcode Polygon/MultiPolygon release,
   reconciled code by code while retaining P.O.-box, organization, route,
   address/street/building assignment, point, membership-only and unmatched
   non-area states.
3. Provider, edition/reference date, licence, attribution, byte length,
   SHA-256, schema, source CRS, reviewed transform, topology, coverage,
   exclusions and reproducible conversion into an approved immutable artifact.
4. A real RO API/application path that preserves leading zeroes, accepts
   exactly six ASCII digits, validates only real Polygon/MultiPolygon geometry,
   fits the map, renders translucent fill and a clear outline, and displays
   selected code, geometry kind, official/derived/virtual class, source,
   reference date and confidence.
5. Explicit loading, no-match, multiple-result, API-failure,
   invalid-geometry, clear and re-search behavior.

County, UAT, locality, SIRUTA, RENNS address point, ANCPI parcel/building,
street/address membership, buffers, hulls, Voronoi/raster cells and synthetic
fixtures are prohibited substitutes.

## Methodology is hash-bound and fails closed

Run:

    node scripts/inspect-postal-context-ro-sources.mjs --source-dir <temporary-source-directory>

The inspector fails closed unless all seven exact official bodies match their
recorded byte lengths and SHA-256 values. It verifies the current search
description and POST contract, PDF signatures, six-digit structure receipt,
controlled Infocod/ANCOM access receipts, current operator responsibility,
dated geography-status receipt and zero byte-level Polygon, MultiPolygon,
GeoJSON or Shapefile tokens. Raw bodies and rendered PDF pages are not
committed.

Relevant PDF pages were text-extracted with `pdfplumber` and rendered with
Poppler. The ANCOM PDF has no extractable text layer in this copy, so its
contract-access finding is also checked against the official public web reader;
the exact PDF remains byte-hash bound.

Direct `data.gov.ro` catalogue API and ANCPI address-task acquisitions each
failed twice in this environment; the ANCPI web reader also returned 502.
These are availability observations only and do not prove that an artifact is
absent.

## Official source, version and rights findings

- [Current Poșta Română postcode search](https://www.posta-romana.ro/index.php/?page=cauta-cod-postal)
  says its postcode database is periodically updated and supports both search
  directions. Returned address and postal-subunit context is not an area.
- [Six-digit structure](https://www.posta-romana.ro/cnpr-data/_editor/files/2016-09/Anexa%204A.pdf)
  defines the code syntax and examples across assignment classes, not current
  boundaries.
- [Infocod conditions](https://www.posta-romana.ro/cnpr-data/_editor/files/2016-09/Criterii%20si%20conditii.pdf)
  describe electronic delivery after a prior written request and monthly
  updates. No compatible open AGID reuse grant is stated.
- [Dated postcode geography status](https://www.posta-romana.ro/cnpr-data/_editor/files/Invitatie%20de%20participare%20la%20consultarea%20pietei%20-%20Proiecte%20Digitalizare%20Posta%20Romana%20%28update%201%29.pdf)
  says Poșta Română assigns and updates codes and that the then-current
  database lacked GPS coordinates. It must yield to any newer exact release.
- [Poșta Română 2025 organization regulation](https://www.posta-romana.ro/cnpr-data/_editor/files/HCA%20nr%2004_31.01.2025_ROF%20Pos%CC%A6ta%20Roma%CC%82na%CC%86%202025.pdf)
  assigns development and updating of national postal coding to operator
  functions. It is responsibility evidence, not an area distribution.
- [ANCOM Decision 810/2024](https://www.posta-romana.ro/cnpr-data/_editor/files/DECIZIA%20NR.%20810_19.12.2024%20DESEMNARE%20FSU.pdf)
  treats the postcode system as non-physical network infrastructure and places
  relevant third-party postal-provider access behind negotiated civil-contract
  conditions.

No provider was contacted; no registration, authentication, contract or terms
acceptance, purchase, protected/private query, address submission, new data
destination, publication or deployment occurred. This is a conservative
engineering reuse gate, not a legal opinion.

## The shared map path exists, but there is no real Romania scene

Shared deterministic tests cover Polygon/MultiPolygon-only drawing, valid
bounds fit, translucent fill, visible outline, explicit loading/no-match/
multiple/API-failure/invalid-geometry states, provenance, clear and re-search.
Those tests demonstrate application capability, not a real Romania runtime.

For RO:

- normalized real-code lookup: not verified;
- real RO pack loader and API: not verified;
- real official map fit and translucent render: not verified;
- selected-code/provenance UI on real RO data: not verified;
- browser E2E: not run because no approved fixed authoritative area artifact
  exists.

Staging a search row, locality/SIRUTA boundary, RENNS point, ANCPI geometry or
synthetic area would create a false M2 claim, so no browser scene was staged.

## Limitations and robustness checks

The seven bodies are exact acquisition receipts, but the public search is not a
complete fixed assignment/exception release. The dated lack-of-GPS statement
does not prove the current database still lacks coordinates or areas. No
provider contract, protected service or authoritative postal-area feature was
inspected.

Zero byte-level area-distribution tokens in the pinned bodies is a bounded
observation, not a proof of global non-existence. The official portal failures
likewise do not prove absence. M2 remains blocked because positive proof is
required and was not obtained.

No chart is included: the exact table communicates the decisive controlled-
rights, assignment-versus-area and zero-authoritative-geometry gates more
accurately.

## Recommended next steps

Resume when Poșta Română or the controlling authority publishes or grants
explicit compatible permission and an authoritative fixed postcode-area
release can be obtained. Pin assignment and geometry editions/digests,
reconcile the complete denominator to exact areas or explicit non-areas, build
an approved immutable artifact, and pass the real RO loader, API, six-digit
normalization, validity, fit, translucent fill, outline, provenance, clear and
re-search checks.

Do not retry before 2026-09-06T22:30:06.794Z while pending countries remain,
unless compatible written permission or a fixed authoritative current
postcode-area release appears. Contact, registration, authentication,
contract/terms acceptance, payment, a new repository/publication destination,
publication or deployment requires explicit approval.

## Further questions

- Will Poșta Română provide a versioned national six-digit
  assignment/exception denominator under terms compatible with AGID public
  serving?
- Does the operator now maintain an authoritative postcode-area
  Polygon/MultiPolygon release distinct from address points and administrative
  or cadastral context?
- Which P.O.-box, organization, route, point and address/street/building-only
  codes must remain explicit non-areas?

Next country after this blocked entry is Serbia (`RS`). No second country was
started in this run.
