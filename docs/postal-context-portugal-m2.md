# Portugal Postal Context M2 source and data-quality review

Observed: 2026-08-30T21:59:04.571Z

Base: 3dcb4ce38b898edbd5edcefa69c7083258726a7b

Outcome: blocked at M1; M2 is not achieved

## Technical summary

Portugal has a clear current CTT `NNNN-NNN` definition and public address/
postcode search, but the official evidence available in this run cannot
support a production AGID postcode-area artifact.

Six exact CTT HTML bodies total 608,046 bytes and are pinned by SHA-256. They
establish the seven-digit hyphenated format, separate postal designation,
address-driven POST search, reverse postcode lookup and separate P.O.-box
lookup. The public surfaces do not provide a current complete assignment and
exception denominator or a fixed Polygon/MultiPolygon distribution.

CTT describes its Base Nacional de Endereços and Sistema de Informação
Geográfica Postal under “Licenciamento de bases de dados”, offering portions
of the address database and geographic webservices. The customer specifies
geography, detail and a need of at least three years. No reviewed grant for
AGID processing, derivation, storage, redistribution and public serving was
established. CTT's address-treatment page defines georeferencing as WGS84
EPSG:4326 coordinates of the respective door: Point context, not postcode
area geometry.

DGT says CTT assigns postcodes, INE owns DTMNFR codes and DGT only consumes
DTMNFR in CAOP, with no postcode-code creation or intervention role. DGT's
open CAOP, land-use, cadastral and imagery collections retain their declared
authority and were not promoted as postal boundaries.

No real PT runtime artifact was approved or loaded, so no real postal lookup,
map fit or translucent rendering is claimed.

## Key findings

| Gate | Exact result | M2 meaning |
| --- | ---: | --- |
| Exact CTT bodies / bytes | 6 / 608,046 | acquisition receipts are reproducible |
| Canonical numeric format | `NNNN-NNN` / 7 digits | normalization rule is explicit |
| Search contract | POST; address, reverse code and P.O.-box modes | validation surface, not bulk distribution |
| Database licensing named | yes | public page is not an open reuse grant |
| CTT door geometry / CRS | Point / EPSG:4326 | cannot be inflated into postcode area |
| Polygon/MultiPolygon/GeoJSON tokens | 0 | reviewed CTT bodies are not an area artifact |
| Fixed authoritative postal-area artifacts | 0 | digest/topology/coverage gate fails |
| Validated Polygon/MultiPolygon features | 0 | real application area gate cannot pass |
| Approved AGID runtime artifacts | 0 | no real PT API/UI path |

## Scope, data and definitions

`M2_current_portugal_postcode_assignment_and_authoritative_area_visualization`
requires:

1. A current complete CTT `NNNN-NNN` assignment and exception denominator
   usable under explicit reviewed permission for AGID processing, derivation,
   storage, redistribution and public serving.
2. A fixed authoritative Portugal postal-code Polygon/MultiPolygon release,
   reconciled code by code while retaining P.O.-box, organization, route,
   point, membership-only and unmatched non-area states.
3. Edition/reference date, provider, licence, attribution, byte length,
   SHA-256, schema, source CRS, reviewed transform, topology, coverage,
   exclusions and reproducible conversion into an approved immutable artifact.
4. A real PT API/application path that normalizes `NNNN-NNN`, validates only
   real Polygon/MultiPolygon geometry, fits the map, renders translucent fill
   and a clear outline, and displays selected code, geometry kind,
   official/derived/virtual class, source, reference date and confidence.
5. Explicit loading, no-match, multiple-result, API-failure,
   invalid-geometry, clear and re-search behavior.

DGT/CAOP, parish, municipality and cadastral boundaries, postal designations,
addresses, streets, door points, unions of lookup rows, buffers, hulls,
Voronoi/raster cells and synthetic fixtures are prohibited substitutes.

## Methodology and reproducibility

Run:

    node scripts/inspect-postal-context-pt-sources.mjs --source-dir <temporary-source-directory>

The inspector fails closed unless six exact official CTT bodies match recorded
byte lengths and SHA-256 values. It verifies format and area-semantics wording,
the address/reverse/P.O.-box search contract, database-licensing and geographic
webservice signals, WGS84 EPSG:4326 door Point semantics, and zero
Polygon/MultiPolygon/GeoJSON tokens. Raw bodies are not committed.

Official DGT FAQ and open-data/current-collection pages were also reviewed
through the public web reader. Two direct download attempts to the FAQ timed
out in this environment; this is availability evidence only and not proof of
absence.

## Source, version and rights assessment

- [CTT postcode definition](https://www.ctt.pt/ajuda/empresas/enviar-correio-e-encomendas/codigos-postais/o-que-sao)
  establishes area semantics, seven digits, the hyphen and postal designation.
- [CTT search help](https://www.ctt.pt/ajuda/particulares/enviar/codigos-postais/como-pesquisar?language_id=1555597541833)
  describes address-driven inputs; the
  [search application](https://www.ctt.pt/feapl_2/app/open/postalCodeSearch/postalCodeSearch.jspx)
  also exposes reverse-code and P.O.-box modes.
- [CTT address supply](https://www.ctt.pt/empresas/marketing-publicidade/servicos-geograficos/fornecimento-de-moradas?language_id=1555597541833)
  describes database licensing, supplied database portions and geographic
  webservices. It does not establish compatible open AGID reuse rights.
- [CTT address treatment](https://www.ctt.pt/empresas/marketing-publicidade/servicos-geograficos/tratamento-de-moradas)
  identifies door coordinates in WGS84 EPSG:4326, not postcode polygons.
- [DGT postcode authority FAQ](https://www.dgterritorio.gov.pt/node/1305)
  assigns postcode responsibility to CTT and separates it from DGT/CAOP.
- [DGT open data](https://www.dgterritorio.gov.pt/dados-abertos)
  covers DGT's declared collections under CC BY 4.0; no advertised national
  postcode-area collection was observed in the current list.

No provider was contacted; no registration, authentication, contract or terms
acceptance, purchase, protected/private query, address/P.O.-box submission,
new data destination, publication or deployment occurred. This is a
conservative engineering reuse gate, not a legal opinion.

## Application status

Shared deterministic tests cover Polygon/MultiPolygon-only drawing, valid
bounds fit, translucent fill, visible outline, explicit loading/no-match/
multiple/API-failure/invalid-geometry states, provenance, clear and re-search.
Those tests demonstrate application capability, not a real Portugal runtime.

For PT:

- normalized real-code lookup: not verified;
- real PT pack loader and API: not verified;
- real official map fit and translucent render: not verified;
- selected-code/provenance UI on real PT data: not verified;
- browser E2E: not run because no approved fixed authoritative area artifact
  exists.

Staging a CTT door point, CAOP boundary, public search result or synthetic area
would create a false M2 claim, so no browser scene was staged.

## Limitations, uncertainty and robustness

The six CTT bodies are exact acquisition receipts but are web pages, not a
complete dataset release. Search presence does not prove a complete current
denominator or public redistribution right. DGT direct downloads timed out;
the public web-reader observations are therefore not byte-hash receipts, and
no non-existence claim is made. No provider contract, protected service or
postal-area feature was inspected.

No chart is included: the exact table communicates the decisive controlled-
rights, point-versus-area and zero-authoritative-geometry gates more accurately.

## Recommended next steps

Resume when CTT publishes or grants explicit compatible permission and an
authoritative fixed postal-area release can be obtained. Pin both editions and
digests, reconcile the complete current denominator to exact areas or explicit
non-areas, build an approved immutable artifact, and pass the real PT loader,
API, normalization, validity, fit, translucent fill, outline, provenance,
clear and re-search checks.

Do not retry before 2026-09-06T21:59:04.571Z while pending countries remain,
unless compatible written permission or a fixed authoritative current
postcode-area release appears. Contact, registration, authentication,
contract/terms acceptance, payment, a new repository/publication destination,
publication or deployment requires explicit approval.

## Further questions

- Will CTT provide a versioned national `NNNN-NNN` assignment/exception
  denominator under terms compatible with AGID public serving?
- Does CTT maintain an authoritative postal-area Polygon/MultiPolygon release,
  distinct from door points and administrative/cadastral context?
- Which P.O.-box, organization, route and point-only codes must remain explicit
  non-areas?

Next country after this blocked entry is Romania (`RO`). No second country was
started in this run.
