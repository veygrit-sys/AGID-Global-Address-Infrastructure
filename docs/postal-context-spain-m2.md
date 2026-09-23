# Spain Postal Context M2 source review

## Outcome

Spain remains at `M1_metadata` under
`M2_current_correos_postcode_area_visualization`. The anonymous official
CartoCiudad WMS returned one real `Polygon` for normalized postcode `28013`
from layer `codigo-postal`. The response contains feature
`codigo-postal.280790000019`, one closed ring with 16 positions, EPSG:4326,
source effective date `20260112`, source creation time
`2026-01-13T13:14:31Z`, and response timestamp
`2026-08-30T04:43:03.302Z`.

M2 is blocked. The direct CartoCiudad postcode candidate has null geometry and
the `find` response is a `Point`, not an area. More importantly, CartoCiudad
and CNIG explicitly describe Correos postcode surface geometry as
view/consultation only and state that Grupo Correos alone may distribute the
postcode database. Correos offers the complete database and national polygon
layer only under payment, contract and licence terms that do not permit a
public third-party postcode-search service or sublicensing. No purchase,
agreement, authentication or operator database download was made.

No complete current assignment denominator, area/non-area classification,
national polygon count, immutable release, nationwide topology audit,
approved artifact, reproducible production transform, real ES loader/API or
real-data app visualization exists. The one real Polygon is retained as source
evidence and its production-eligible count is zero.

## Evidence and quality

| Measure | Reviewed result | M2 consequence |
|---|---:|---|
| Official bodies byte- and SHA-256-bound | 10 | Evidence is reproducible |
| WMS version / update sequence | 1.3.0 / 3203 | Live view state, not an edition |
| Declared national polygon count | none | Completeness is not established |
| `28013` candidate geometry | null | Candidate cannot draw an area |
| `28013` find geometry | Point | Point cannot be expanded into an area |
| `28013` WMS feature-info geometry | 1 Polygon | Official area existence is confirmed |
| Sample closed rings / positions | 1 / 16 | Sample structure passes |
| National topology validated | no | Geometry gate fails |
| Public immutable ES artifacts approved | 0 | Fixedness/publication gate fails |
| Real ES postcode search -> API -> translucent map | 0 | Application gate fails |

The CartoCiudad dataset metadata records creation `2006-12-31`, revision
`2026-03-01`, publication `2026-05-01`, metadata date `2026-05-19`, and a
quarterly refresh cadence. The WMS service metadata records creation
`2018-02-01` and metadata date `2026-05-04`. Neither metadata record embeds a
postcode-polygon release edition, validity date or national feature count.
The WMS `updateSequence` is mutable service state, not an immutable release.

## Authority, rights and fixedness

1. [CartoCiudad dataset metadata](https://www.idee.es/csw-inspire-idee/srv/spa/csw?SERVICE=CSW&VERSION=2.0.2&REQUEST=GetRecordById&outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full&ID=spaign_cartociudad_addresses)
   identifies Grupo Correos as the postcode source and explicitly says the
   surface geometry is for visualization while point centroids may be located
   or downloaded.
2. [CartoCiudad visualization documentation](https://www.cartociudad.es/web/portal/directorio-de-servicios/visualizacion)
   states that postcode data is unavailable for download and can only be
   visualized.
3. The [CNIG response on datos.gob.es](https://datos.gob.es/es/solicitud-de-datos/listado-de-codigos-postales-por-poblacion-y-provincia),
   updated 22 May 2026, says Correos is the only distributor, CartoCiudad is
   consultation-only, and the database must be obtained from Correos.
4. [Correos's product page](https://www.correos.es/es/es/empresas/marketing/identifica-a-tus-clientes-potenciales/base-de-datos-de-codigos-postales)
   offers the database and national cartographic layer commercially in
   ETRS89/WGS84 under a restrictive licence. The reviewed page lists quarterly
   and static prices; AGID accepted neither payment nor contract.
5. The official [CartoCiudad geocoder documentation](https://github.com/IDEESpain/Cartociudad/tree/73f47e7b390e5ef98ed9c62e0b30292695045ff1)
   is pinned by commit. Its actual `28013` path returns a `Point`; the Polygon
   was only recovered by querying the view layer at a selected map position.

WMS capabilities advertise `CC BY 4.0 scne.es`, but that view-service notice
does not override the source-specific view-only statements or create a public
right to distribute the complete Correos polygon product. The exact response
lengths, URLs and SHA-256 values are pinned in the
[machine-readable source report](../reports/postal-context-m2/es-source-review-2026-08-30.json).
Raw response bodies remain outside Git and are deleted only after the pushed
commit is verified on GitHub.

## Identity and application status

`EA` remains the separate Africa-queue identity defined by the rollout ledger.
The national WMS footprint does not merge it into ES. `ES_BAL` and `ES_CAN`
remain ES address-format variants and do not become separate postal artifacts.

Shared tests exercise normalized search, Polygon/MultiPolygon validation,
bounds fit, translucent fill, visible outline, selected postcode, geometry
type, provenance, reference date, confidence, loading, no-result, multiple,
API-failure, invalid-geometry, clear and re-search states. Those shared tests
prove reusable behavior only. There is no immutable artifact-backed `ES/28013`
API response or real ES app rendering, so the correct production outcome is
**no verified ES area available**.

Postal geometry remains separate from address, building, cadastre,
administration, facility routing and AGID coverage. Point, route, P.O. box,
organization, facility and other non-area codes receive no buffer, hull,
Voronoi/model, administrative proxy or AGID-cell surface.

## Remaining work

1. Obtain a current complete Correos assignment and area/non-area denominator
   plus an edition-pinned Polygon/MultiPolygon release with declared validity,
   schema, CRS and coverage.
2. Obtain a written redistribution and public-search grant. Payment, contract
   acceptance or authentication requires explicit authorization.
3. With explicit publication authorization, publish an approved immutable
   artifact outside AGID Git, record its SHA-256 and implement a reproducible,
   authority-preserving transform.
4. Validate nationwide codes, geometry, topology, exceptions and identity
   separation without inventing areas.
5. Connect the artifact to the real ES loader, API and app and pass all search,
   map, provenance, error, clear and re-search checks using real ES data.

Recheck only after the pending-country pass and
`2026-09-30T04:36:12.827Z`, unless an official rights-cleared immutable release
appears earlier. Elapsed time does not authorize an account, agreement,
payment, publication destination or deployment.
