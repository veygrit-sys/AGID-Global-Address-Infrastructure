# Netherlands Postal Context M2 review

Observed: 2026-08-30T20:04:32.662Z

Base: df4aeb32ed390585a8d763484b77eb2b8d196fe6

Outcome: blocked at M1; M2 is not achieved

## Executive summary

The Netherlands has an unusually strong open derived-geometry source, but it
still does not satisfy the country-specific Postal Context M2 gate.

CBS corrected its 2025 PC5/PC6 publication on 18 August 2026. The pinned
2025-v1 PC6 ZIP is 192,553,634 bytes
(SHA-256 `53c399212f68c195dcfbf8d94df2442a5dec55cc748b32d663dbb4c347482520`).
Its GeoPackage is 626,851,840 bytes and contains 465,935 unique PC6
MultiPolygons. A full GDAL/SQLite scan found no malformed code, empty geometry
or invalid geometry. CBS says Esri Nederland derives these postcode surfaces
from BAG addresses and permits distribution under CC BY 4.0 NL with CBS and
Esri Nederland attribution. They are therefore useful, rights-cleared
`derived_geometry`, not official PostNL boundaries.

The missing authority is the current complete postal assignment denominator.
PostNL's January 2026 specification says PCT-R contains current house-number
and P.O.-box ranges and distinguishes H, B and NAPO/N range types, while PCT-H
contains about nine million addresses. The current table is purchased and
downloaded from a protected environment. PostNL's public data terms limit use
to personal or strictly internal purposes and prohibit reproduction or
third-party availability. Address Check requires an API key and returns
address fields plus latitude/longitude points, not postcode areas.

The gap is concrete: the corrected CBS file contains PostNL's public
headquarters address code `2521 CA`, but not its public P.O.-box code
`2500 GG`. Thus the CBS surface cannot silently stand in for ordinary and
exception assignment authority. No real NL runtime artifact was published or
loaded, and no real NL API lookup, map fit or translucent render is claimed.

## Country-specific M2 gate

`M2_current_netherlands_pc6_assignment_and_cbs_area_visualization` requires:

1. A current, complete and rights-cleared PostNL PC6 assignment and exception
   denominator covering house-number ranges, P.O.-box ranges, NAPO,
   organizations, reply/freepost, facilities, special/non-geographic endpoints
   and historical or transition classes.
2. The corrected current CBS/Esri PC6 Polygon/MultiPolygon release reconciled
   to that denominator, with non-area exceptions preserved and every surface
   labelled derived rather than official PostNL geometry.
3. Pinned edition, effective date, dataset-specific terms, attribution, byte
   length, SHA-256, coverage, exclusions and a reproducible transformation into
   an approved immutable artifact.
4. The real NL API/application path: normalize `NNNN AA`, validate
   Polygon/MultiPolygon, fit the map, render a translucent fill and clear
   outline, and display selected code, geometry kind, official/derived/virtual
   class, source, reference date and confidence.
5. Explicit loading, no-match, multiple-result, API-failure and
   invalid-geometry states, plus clear and re-search behavior.

PostNL site/API observations, BAG points or buildings, PC4/PC5 areas,
statistical/administrative/cadastral units, point buffers, hulls, Voronoi or
raster cells and synthetic fixtures are prohibited substitutes. PO boxes,
NAPO and other non-areal endpoints stay non-area unless an authoritative area
exists.

## Reproducible source evidence

Run:

    node scripts/inspect-postal-context-nl-sources.mjs --source-dir <temporary-source-directory>

The inspector verifies twelve exact bodies, including the corrected ZIP,
GeoPackage, workbook, current CBS pages and PDOK OGC API metadata. It fails
closed on SHA-256 mismatch, then uses read-only GDAL/SQLite queries to verify
the full GeoPackage, not a fixture or sample.

| Gate | Exact result | M2 meaning |
| --- | ---: | --- |
| Corrected CBS release | 2025 v1, fixed 2026-08-18 | current derived source is pinned |
| PC6 features / distinct codes | 465,935 / 465,935 | unique full-code surfaces |
| Geometry type | MultiPolygon | display-eligible geometry kind |
| CRS | EPSG:28992 | explicit source projection |
| Malformed / empty / invalid | 0 / 0 / 0 | format and validity pass |
| Polygon parts / positions | 597,956 / 14,458,509 | full-data topology scale |
| Public address `2521 CA` | 1 surface | ordinary address example is present |
| Public P.O. box `2500 GG` | 0 surfaces | exception denominator is not complete |
| Rights-cleared derived surfaces | 465,935 | useful CBS/Esri display geometry |
| Complete public PostNL denominator | unavailable | assignment authority gate fails |
| Approved AGID runtime artifacts | 0 | real application path cannot pass |

The raw 192.6 MB ZIP, 626.9 MB GeoPackage, 54.1 MB workbook and downloaded page
bodies are temporary audit inputs and are not committed.

## Source, version and rights assessment

- [CBS Kerncijfers per postcode](https://www.cbs.nl/nl-nl/dossier/nederland-regionaal/geografische-data/gegevens-per-postcode)
  records the 18 August 2026 correction, identifies 2025 v1 as the newest
  reporting-year release, states that map and workbook files contain all
  postcodes regardless of statistical suppression and publishes the fixed ZIP.
- [CBS product information](https://www.cbs.nl/nl-nl/longread/diversen/2025/statistische-gegevens-per-vierkant-en-postcode-2022-2023-2024/1-statistische-gegevens-per-vierkant-en-postcode)
  says Esri Nederland derives PC4/PC5/PC6 surfaces from BAG addresses, that the
  surfaces are full-covering, change over time and are distributable under
  CC BY 4.0 NL.
- [CBS rights](https://www.cbs.nl/nl-nl/longread/diversen/2025/statistische-gegevens-per-vierkant-en-postcode-2022-2023-2024/5-voorwaarden-en-recht-gebruik)
  allows use without charge and requires `© CBS, © ESRI Nederland` for
  postcode map visualization.
- [PDOK CBS Postcode6 OGC API](https://api.pdok.nl/cbs/postcode6/ogc/v1?f=html&lang=en)
  is unauthenticated and CC BY 4.0, but its current description only reaches
  reporting year 2024. Its default ten-feature response is 2015 data, so it was
  not substituted for the newer corrected 2025 artifact.
- [PostNL Postcode Table](https://www.postnl.nl/zakelijk/slimme-dataoplossingen/postcodetabel/)
  is purchased, supplied from a protected environment and updated weekly or
  monthly. The [January 2026 structure](https://www.postnl.nl/api/assets/blt43aa441bfc1e29f2/bltfcd225acf8c54b1e/69aad68afa2e53eeaaf76e79/postcode-table-file-structure.pdf)
  defines PCT-R/PCT-H and H/B/N range classes.
- [PostNL website data terms](https://www.postnl.nl/gebruiksvoorwaarden/)
  restrict site data to personal or strictly internal use and prohibit
  reproduction or making it available to third parties.
- [PostNL Address Check v4](https://developer.postnl.nl/integration-with-postnl/api-overview/addresses/adrescheck-nederland/documentation-v4/)
  requires an API key and a house number and returns address fields and a
  latitude/longitude point only.
- [Postcodecheck terms](https://www.postnl.nl/Images/gebruikersvoorwaarden-postcodecheck_tcm10-213687.pdf)
  require an API account, restrict use to the customer's own webshop/internal
  workflow and prohibit third-party service delivery or building/exploiting a
  database.

No provider was contacted; no account, API key, table purchase, contract or
terms acceptance was requested. This is a conservative engineering reuse gate,
not a legal opinion.

## Data-quality and authority method

Completeness is evaluated at two grains. The corrected CBS geometry passes its
published geographic-PC6 feature audit, while the complete ordinary and
exception assignment denominator remains unavailable. Statistical suppression
does not remove the geometries, but PostNL P.O.-box and NAPO assignments are a
separate class and cannot be inferred from BAG-derived surfaces.

Validity was checked over all 465,935 features. Codes remain six-character text
during source inspection and normalize to the app form `NNNN AA` only at
the application boundary. All geometries are non-empty valid MultiPolygons;
the source CRS, extent, part count and position count are pinned.

Timeliness is explicit: the fixed source is reporting year 2025 v1, corrected
18 August 2026. The PDOK service's 2024 description is retained as a separate
older service and not represented as the current artifact.

Postal assignment, CBS/Esri derived geometry, BAG address/building identity,
administrative/statistical/cadastral context and AGID containment remain
separate authorities. An address-to-building claim would require an explicit
source relationship or reviewed crosswalk. No person, customer, recipient,
owner, tenant, land-right or protected address row is committed.

## Application status

Shared deterministic tests verify fail-closed application capability: only
Polygon/MultiPolygon draws; valid bounds fit; fill remains translucent; outline
is visible; loading, no-match, multiple-candidate, API-failure and
invalid-geometry states are explicit; metadata, clear and re-search are
covered. Those shared tests do not prove a real Netherlands runtime.

For NL:

- normalized real-code lookup: not verified;
- real NL pack loader and API: not verified;
- real CBS-derived map fit and translucent render: not verified;
- selected-code/provenance UI on real NL data: not verified;
- browser E2E: not run because there is no approved complete assignment plus
  runtime artifact.

Staging one CBS polygon or synthesizing areas for `2500 GG` and other
exceptions would create a false M2 claim, so no browser scene was staged.

## Blocker and next check

M2 can resume after a reviewed PostNL agreement expressly permits AGID
processing, derived linkage and public serving, or after a separately open
complete current assignment release appears. The assignment denominator must
be reconciled to the corrected CBS surfaces, classify every non-area exception
and produce a deterministic approved immutable artifact. The real NL loader,
API, normalization, validity, fit, translucent fill, outline, metadata, clear
and re-search checks must then pass.

Do not retry before 2026-09-06T20:04:32.662Z while pending countries remain,
unless an unrestricted current release appears. Provider contact,
registration, authentication, contract or terms acceptance, payment, a new
repository or publication destination, publication or deployment requires
explicit approval.

No chart is included: the exact audit table communicates the decisive
465,935-valid-surfaces versus missing-authorized-denominator result more
accurately.

Next country after this blocked entry is Norway (`NO`). No second country
was started in this run.
