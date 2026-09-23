# Dominican Republic (DO) Postal Context M2 review

Observed: 2026-08-31T23:54:10.401Z
Result: **blocked / M2 unmet**
Definition: `M2_current_inposdom_assignment_and_postal_area_visualization`

## Decision

INPOSDOM's official public postcode application does expose real Polygon responses and the reviewed examples are geometrically valid. That is useful evidence, but it is not yet a production-eligible M2 release. The search index is dated 2021, the polygon service has no complete-coverage or immutable-release contract, the responses omit postal class and provenance, and the reviewed terms do not grant bulk processing, derivation, redistribution or public serving. The current complete UPU 2026.1 database is contract-, NDA-, data-use- and rates-controlled.

No provider was contacted, no account or contract was created, no terms or NDA were accepted, no payment was made, and no bulk crawl was attempted. DO remains M1 metadata with M2 blocked.

## Fixed official evidence

| Body | Bytes | SHA-256 | Finding |
|---|---:|---|---|
| INPOSDOM search HTML | 7,768 | `81ab3b1a965de54f83798759943d1c8a5b2f24fdf931e6de4355ece86c14c613` | Official search client |
| INPOSDOM config JS | 50 | `f8c063ea706b3b672cd6b31b61a4e7ddb496e2b85da32f41a6d610c9885cbad6` | Same-origin base path |
| INPOSDOM postal app JS | 18,417 | `ff38170f4cc440367d2298e883b1a70c647191dd2c530480b7c768d58e49931b` | Loads index, fetches polygon, fits and styles map |
| INPOSDOM index JSON | 155,272 | `da7d2d9a714cfc0ef642cbd7cf9c1f2f49016a48a67513bbe449a5dc78832592` | Last-Modified 2021-04-16 |
| Polygon 10100 | 1,162,053 | `107d55ca3e25a18d0c4199024d54a1b8c7a088f30f8d256b41fb9c86e449b78a` | 1 Polygon, 11,278 vertices |
| Polygon 10101 | 1,892 | `527d9446f4eb7929dc0a15c7b788a44d06156aa2c876ec94bae40e5cb2145f02` | 1 Polygon, 17 vertices |
| Polygon 11903 | 17,941 | `24d47fc553398eafaa6626d6af5d72f35937f85ec2aca150de4ff50fdb19df75` | 4 Polygon features, 170 vertices |
| INPOSDOM terms | 161,376 | `8e64ed0f16a7fcc283c631fd08fae4dc884fae3ecd16c7bbf69f03ba28ba45e7` | Portal IP protected; no compatible bulk licence |
| UPU DO sheet | 137,292 | `3d312d2079279f81cc55e2c9754e92e0ca652b5d196e226d919e1ab83ac48020` | 03/2005, five digits, examples 10101/11903 |
| UPU General Addressing Issues | 631,050 | `ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d` | Aug. 2026, DO length 5, pattern 99999 |
| UPU addressing solutions | 200,637 | `ae10d9e5953b2a67ec6fd51181cb5168b34692a2e5483056314d8b0253372b28` | 2026.1 contract/NDA/data-use/rates path |
| datos.gob.do INPOSDOM page | 30,304 | `d391edccbbcf0b96b8aae78b3533cc0a8c83b76954db3cd7e65f5ca70934fa10` | Four datasets, none postal assignments/polygons |

Total fixed bodies: 12; total bytes: 2,524,052. Raw bodies, postcode rows, coordinates and geometry remain temporary and are not committed.

## Data and geometry quality

The fixed index has 1,403 rows, 1,401 syntactically valid rows, 528 unique five-digit codes, two invalid code values, no missing coordinates and 29 exact duplicate groups. It lacks release identity, validity intervals, aliases, supersession, corrections, exception types and area/non-area object classes.

The three fixed official-example probes contain six Polygon features, six closed finite rings and 11,465 vertices. Their only published property is `zipcode`. There is no complete-coverage proof, immutable edition, producer lineage, official/derived/virtual class, reference date, CRS, derivation method, confidence or exception model. No Point, locality, sector, administrative boundary, office, route, P.O. box, parcel, building, buffer, hull, cell or synthetic `99999` fixture was promoted.

## Search-to-map status

The official INPOSDOM client can search, show multiple candidates and no-match, fetch a Polygon, fit the map, and draw an 18% translucent fill with a 2-pixel outline. It does not distinctly expose API failure versus no result, validate and label invalid geometry, or show official/derived/virtual, source, reference date and confidence.

The real AGID path remains disabled because no approved immutable artifact exists. Shared tests cover normalization, API contracts, Polygon/MultiPolygon-only rendering, fit, translucent fill, outline, clear and re-search behavior, but synthetic/shared code cannot satisfy DO M2. Browser E2E and a separate Data App were deliberately not run/built because zero records are eligible for public serving.

## Reproducibility and PDF verification

Run:

```text
<bundled-python> scripts/inspect-postal-context-do-sources.py --source-dir <temporary-source-directory>
```

The inspector fails closed on source-set, byte, SHA-256, HTML/JS markers, JSON schema/counts, GeoJSON type/rings/positions and PDF signature/page/marker drift. It emits aggregates only.

Poppler rendered the DO sheet and physical pages 2 and 7 of General Addressing Issues to non-empty 992×1404, 993×1404 and 993×1404 RGB PNGs. The local image viewer failed with Windows error 206 on original and short paths, so no visual-inspection claim is made; bytes, page counts, text markers, dimensions and render hashes were checked.

## Unblock condition

Obtain a current complete INPOSDOM or competent-authority release covering every assignment, alias, validity interval, correction, exception and typed non-area object; fix its release identity, schema, coverage, retrieval time, bytes and SHA-256; and establish rights compatible with AGID processing, storage, derivation, redistribution and public serving. Reconcile every drawable code to real valid Polygon/MultiPolygon geometry with postal authority, official/derived/virtual class, source, edition, reference date, CRS, method, confidence and exceptions. Build an approved immutable artifact and verify the real DO loader, API and application—including loading, no-match, multiple, failure, invalid geometry, fit, translucent fill, outline, metadata, clear and re-search—without area proxies or address/building inference.

Retry no earlier than 2026-09-07T23:54:10.401Z while pending countries remain, unless INPOSDOM or UPU publishes an eligible new release or compatible rights.
