# Regional and Ocean Topographic Open Data Stack v0.1

## Purpose

This stack turns a bounded area of interest into a reproducible acquisition and
conversion plan for 2D vectors and 3D terrain. It combines the existing AGID
global building, road, water, imagery, and land-cover fusion stack with
continent-specific elevation, bathymetry, and coastline sources.

The source catalog is not a data snapshot. Source-backed export stays blocked
until an immutable version, content digest, exact reuse evidence, coverage,
adapter version, horizontal CRS, and vertical datum are verified.

## Source roles

| Region | Preferred high-detail source | Corroboration or fallback |
| --- | --- | --- |
| Africa | Digital Earth Africa SRTM and Coastlines | Copernicus DEM, JAXA AW3D30, GEBCO, ETOPO |
| Asia | National sources such as GSI Japan where available | Copernicus DEM and JAXA AW3D30 |
| Europe | Copernicus DEM and EMODnet Bathymetry | GEBCO and ETOPO |
| North America | USGS 3DEP or NRCan HRDEM | Copernicus DEM, JAXA AW3D30, ETOPO |
| South America | Copernicus DEM | JAXA AW3D30, GEBCO, ETOPO |
| Oceania | Geoscience Australia ELVIS or LINZ elevation | Copernicus DEM, GEBCO, ETOPO |
| Antarctica | REMA | Copernicus DEM, GEBCO, ETOPO |
| Arctic | ArcticDEM and applicable national data | Copernicus DEM, GEBCO, ETOPO |
| Ocean | GEBCO_2025 | NOAA ETOPO 2022 |

## Conversion contract

Elevation and bathymetry remain raster provenance roots. AGID clips the source
window, applies source quality masks, normalizes horizontal and vertical
references, and then derives:

- contour vectors with interval and topology checks;
- a triangulated irregular network for the terrain mesh;
- geometric-error levels of detail for glTF or other 3D formats;
- coastline breaklines that prevent independent land and sea interpolation.

For coastal areas, export is blocked until the elevation model, bathymetry,
shoreline epoch, and vertical references are reconciled. The generated
bathymetry is not a navigational chart.

## Acquisition boundary

`buildRegionalTopographicOpenSourcePlan` produces deterministic tasks and
expected evidence paths. It does not download data. Raw source snapshots belong
under a content-addressed path:

`raw/topography/{source-id}/{immutable-version}/{sha256}`

`promoteRegionalTopographicSnapshot` is the only route from catalog metadata to
an approved `TopographicSourceRecord`. The existing topographic export gate then
checks AOI coverage, freshness, format rights, and requested layers.

## Executable elevation vectorizer

`vectorizeNormalizedElevationGrid` is the first executable conversion stage. It
accepts a bounded, finite, no-data-resolved EPSG:4326 elevation grid linked to
an approved `TopographicSourceRecord`. It then:

- applies the existing rights, freshness, coverage, layer, and AOI gates;
- generates a deterministic alternating-diagonal TIN;
- derives bounded contour levels with Turf isolines;
- emits the existing `TopographicDataset` contract for glTF, GeoJSON, OBJ,
  IFC, STL, DXF, or text serialization.

The execution stage is limited to one million grid cells and 512 contour
levels. Antimeridian grids and unresolved no-data cells fail closed. A
reprojection adapter may provide explicit longitude-by-column and
latitude-by-row axes; both the TIN and contours use those axes instead of
linearly interpolating a transformed outer box.

`decodeGeoTiffElevationGrid` provides the first local GeoTIFF/COG byte adapter.
It does not accept a URL or perform a network request. The adapter verifies the
actual SHA-256 against the promoted source record, converts PixelIsArea extents
to pixel-centre bounds, and reads one explicitly selected elevation band. The
v0.3 adapter accepts unrotated north-up EPSG:4326 and EPSG:3857. For EPSG:3857,
Proj4js transforms every column X and row Y axis to WGS 84 before
vectorization. It does not approximate non-linear Web Mercator latitude by
interpolating transformed corner bounds. Files with unresolved NoData,
unsupported or evidence-mismatched CRS, affine rotation, excessive cells,
stale rights evidence, or a digest mismatch fail closed.

The v0.4 adapter can resolve a narrowly bounded set of isolated NoData cells.
Resolution is opt-in and requires a byte-for-byte quality mask whose SHA-256 is
bound to the same promoted source record as the GeoTIFF. The mask must match
the GeoTIFF NoData cells exactly, cover no more than five percent of the grid,
and each missing cell must have an observed left/right or up/down pair. Values
are derived from the original cardinal observations only, so filled cells
cannot propagate into another fill. The output records the method, mask digest,
encoding, resolved cell count, and fraction.

The Studio mask input is an explicit `mask8` sidecar with one unsigned byte per
elevation pixel. It implements a strict binary subset of GDAL RFC 15: zero is
invalid and 255 is valid. Other non-zero values are rejected rather than
interpreted as alpha. A GDAL `.msk` file is itself a raster dataset and is not
treated as this raw byte sidecar. Supplying a mask for a band without NoData,
using a mask of the wrong length, or selecting a mask whose digest is not in
the source record's related artifact hashes fails closed.

Additional projected CRSs, datum-grid transformations, continuous-gap or
edge-gap reconstruction, and remote COG range acquisition remain separate
future stages. Callers must not infer that catalog registration means the
corresponding bytes have been acquired.

`serializeCoastalSeamManifest` emits a deterministic JSON evidence sidecar for
reconciled coastal grids. It rechecks all three source gates and binds the land,
bathymetry, and coastline source versions, snapshot hashes, reuse terms,
correction routes, coverage, CRS, vertical datum, shoreline epoch, and
classification hash. Elevation arrays are intentionally excluded. The sidecar
can accompany geometry formats that cannot carry complete multi-source
provenance, but it is not independently signed and does not yet make the
reconciled grid directly exportable as a `TopographicDataset`.

`serializeCoastalTerrainGltfBundle` is the first geometry bridge for that
sidecar. It generates a deterministic LOD0 TIN with the existing glTF
serializer and binds the manifest digest plus the three source IDs into glTF
asset metadata. The function refuses mixed synthetic/source-backed evidence.
It currently emits glTF only; additional LOD selection and sidecars for formats
without embedded metadata remain future stages.

The Studio exposes this bridge as a synthetic-only coastal conformance action.
It generates the bundle first and then offers separate glTF and evidence
downloads. Source-backed mode remains disabled until three promoted source
records and their immutable snapshots are connected.

Promoted source records carry structured snapshot evidence rather than relying
on free-form notes: content SHA-256, adapter version, verification time,
horizontal CRS, vertical datum, and any related artifact hashes. Source-backed
export fails closed when any required snapshot evidence is absent or malformed.
Studio accepts source-backed records only through an explicit component input,
lists their audit state, and lets the operator include or exclude each record.
No source snapshots are bundled by the UI, and the default route has zero
connected source-backed records.

## Local evidenced GeoTIFF workflow

The Studio can also import an operator-provided
`agid-topographic-source-ledger-v0.1` JSON file and a local `.tif` or `.tiff`
file. This boundary follows three implementation decisions:

- browser input uses the W3C File API and reads `File` bytes into an
  `ArrayBuffer`; no upload or network request is performed;
- georeferencing is decoded according to the OGC GeoTIFF 1.1 model already
  supported by GeoTIFF.js;
- remote Cloud Optimized GeoTIFF acquisition remains a separate adapter because
  OGC COG 1.0 requires range-aware HTTP access rather than treating every URL
  as a complete local file.

Primary references:

- <https://www.w3.org/TR/FileAPI/>
- <https://www.ogc.org/standards/geotiff/>
- <https://docs.ogc.org/is/21-026/21-026.html>
- <https://geotiffjs.github.io/geotiff.js/>
- <https://proj.org/en/stable/operations/projections/webmerc.html>
- <https://github.com/proj4js/proj4js/blob/master/README.md>
- <https://gdal.org/en/stable/development/rfc/rfc15_nodatabitmask.html>
- <https://gdal.org/en/stable/drivers/raster/gtiff.html>
- <https://gdal.org/en/stable/programs/gdal_contour.html>
- <https://www.rfc-editor.org/rfc/rfc7946>
- <https://www.ogc.org/standards/sfa/>
- <https://turfjs.org/docs/api/isolines>
- <https://docs.ogc.org/cs/22-025r4/22-025r4.html>
- <https://proj.org/en/stable/operations/conversions/topocentric.html>
- <https://epsg.org/crs_4978/WGS-84.html>
- <https://epsg.org/crs_4979/WGS-84.html>
- <https://github.com/CesiumGS/3d-tiles/blob/main/specification/README.adoc>
- <https://github.com/CesiumGS/3d-tiles-validator>
- <https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html>
- <https://github.com/mapbox/delatin>
- <https://github.com/mapbox/martini>

CRS decision for v0.2:

- use the GeoTIFF model type and EPSG GeoKey as the authority, then require the
  source ledger to declare the same CRS;
- use the decoder's finite CRS allowlist rather than resolving arbitrary EPSG
  definitions over the network: EPSG:4326, EPSG:4269, EPSG:3857, and WGS 84
  UTM EPSG:32601-32660 or EPSG:32701-32760, and NAD83 UTM
  EPSG:26901-26923;
- reject a hand-written Web Mercator shortcut because later datum-aware CRSs
  need one explicit transformation boundary;
- retain per-column longitude and per-row latitude axes because transforming
  only the outer bounds would make Web Mercator latitude interpolation wrong.

`parseTopographicSourceLedger` treats the JSON as untrusted input. It caps the
ledger at 1 MiB and 64 records, rejects unknown fields, duplicate source IDs,
non-HTTPS evidence routes, unsupported layers or formats, stale records,
non-approved reuse, malformed coverage, missing snapshot evidence, and invalid
SHA-256 values. Importing a ledger does not prove a publisher signature; it is
an operator-provided promotion input pending a topographic signature trust
contract.

`runLocalGeoTiffWorkflow` binds the selected record's primary snapshot SHA-256
to the actual file bytes before decoding. It then executes the local GeoTIFF
adapter, elevation vectorizer, source-backed export plan, selected serializer,
and a deterministic evidence sidecar. The sidecar records source terms,
version, correction route, input and output hashes, CRS, vertical datum,
NoData policy, derivation versions, aggregate metrics, and non-claims. It
contains no elevation array, address, recipient, or AOID material.

The local workflow supports unrotated, north-up EPSG:4326, EPSG:4269,
EPSG:3857, WGS 84 UTM EPSG:32601-32660 or EPSG:32701-32760, and NAD83 UTM
EPSG:26901-26923 GeoTIFF input. The source ledger CRS must match the GeoTIFF
GeoKeys exactly. UTM input is inverse-projected at every source-grid node and
retains that curvilinear node provenance for terrain-mesh derivation; it is not
approximated from only the outer bounding box. Studio uses the same finite CRS
gate when listing audited local DEM records. Evidence records both source and
normalized CRS plus the transformation method. An optional source-bound
`mask8` file can resolve only isolated NoData cells within the configured count
and fraction budgets. The workflow emits derived vector or mesh formats; TIFF
passthrough, arbitrary EPSG resolution, internal or external GDAL mask-dataset
decoding, continuous or edge-gap reconstruction, remote COG range access,
worker-thread execution, and cryptographic ledger authentication remain blocked
or future work.

## TIN LOD vertical-error contract

OGC 3D Tiles 1.1 defines geometric error as a nonnegative metre value describing
the difference between simplified and source geometry. The v0.5 vectorizer
records a narrower, reproducible terrain contract: the absolute vertical
residual in metres between every normalized source-grid point and each
simplified TIN surface. The v0.10 3D Tiles serializer now promotes that
measured metric into a per-LOD geometric-error contract while preserving its
one-sided, grid-point scope in the evidence and non-claims.

For every configured stride LOD, the audit:

- uses the adapter-provided EPSG:4326 longitude and latitude axes, including
  non-linear axes produced by reprojection;
- interpolates the exact alternating-diagonal triangle that contains each
  source-grid point;
- evaluates every source-grid point rather than a statistical sample;
- records maximum absolute error, mean absolute error, RMS error, tested point
  count, stride, and configured maximum error;
- requires LOD0 to reproduce all source points with zero error after bounded
  numeric rounding;
- requires an explicit positive maximum vertical error when more than one LOD
  is requested and stops before serialization when any coarse LOD exceeds it.

Delatin and MARTINI are retained as researched alternatives. Both are
reuse-permitted ISC projects designed around error-bounded adaptive terrain
meshes. Delatin supports arbitrary raster dimensions and exposes maximum
vertical error directly; MARTINI provides fast RTIN hierarchies for square
`2^k+1` grids. Neither is connected yet because independently adapting adjacent
tiles can select different boundary vertices and create cracks. AGID keeps the
edge-preserving regular-grid TIN until cross-tile boundary synchronization,
skirts, or another explicit seam contract is implemented.

For 3D Tiles, each coarse level receives the running maximum of its measured
residual and every finer level below it. This monotonic upper envelope prevents
a coarser parent from reporting less error than a finer child. It bounds the
vertical path from every normalized source-grid point to the simplified
surface, but it is not a continuous, bidirectional Hausdorff-distance proof,
external conformance result, or proof of the source raster's survey accuracy.

## Audited mesh LOD artifact bundle

The v0.7 local workflow serializes every passed mesh LOD as a separate
terrain-only artifact in the requested compatible format. The existing primary
output remains unchanged and contains LOD0 plus any selected contour features,
which preserves the v0.5 caller contract. Each LOD artifact has a deterministic
dataset and file identity and is bound into
`agid-topographic-mesh-lod-bundle-v0.2` with:

- source snapshot SHA-256, source CRS, vertical datum, normalized WGS 84 bounds,
  minimum and maximum elevation, output format, and all-source-grid-point
  sample basis;
- LOD level, stride, mesh ID, file name, media type, byte length, SHA-256,
  vertex count, and triangle count;
- maximum, mean, and RMS vertical residual plus tested source-point count;
- an independently hashed canonical JSON manifest and a verifier that rejects
  changed manifest metadata or artifact bytes.

Khronos glTF 2.0 permits separate indexed triangle mesh assets, so one glTF per
LOD is a valid asset-level representation.

## Fail-closed 3D Tiles placement

The v0.10 workflow can derive an internal OGC 3D Tiles 1.1 hierarchy from an
audited glTF LOD bundle. It does so only when the source record explicitly
identifies WGS 84 ellipsoidal height as `EPSG:4979`. Unknown or orthometric
vertical references leave the glTF and LOD bundle available but block
`tileset.json`; AGID does not silently treat geoid-referenced height as
ellipsoidal height.

For an eligible bundle, the serializer:

- uses the southwest grid corner at zero ellipsoidal height as the local origin;
- transforms every WGS 84 longitude, latitude, and ellipsoidal height through
  geocentric `EPSG:4978` into the shared east-north-up frame, rather than using
  fixed metres-per-degree approximations;
- writes the explicit ENU-to-ECEF basis as the column-major tile transform;
- keeps mesh positions in source Z-up coordinates and places the OGC-specified
  Z-up-to-glTF-Y-up matrix on the glTF root node, so the mandatory 3D Tiles
  runtime Y-up-to-Z-up conversion cancels it exactly;
- records an `EPSG:4979` bounding region in radians and ellipsoidal metres;
- places the coarsest LOD at the root and nests each finer LOD down to LOD0
  using `REPLACE` refinement and direct glTF content URIs;
- assigns each tile the all-grid-point maximum vertical residual recorded by
  its LOD audit, raised only when needed to preserve parent-to-child monotonic
  error, while LOD0 remains exactly zero;
- records a deterministic perspective SSE reference profile: 1080 px viewport
  height, 60 degree vertical field of view, pixel ratio 1, dynamic SSE disabled,
  and a 16 px threshold;
- evaluates the same formula used by CesiumJS perspective traversal,
  `error * viewportHeight / (distance * 2*tan(fovY/2) * pixelRatio)`, and binds
  the corresponding refinement-distance threshold for every LOD;
- round-trips every horizontal corner and elevation extreme through ECEF/ENU
  and blocks 3D Tiles when transform consistency exceeds one millimetre;
- binds the source snapshot, LOD manifest, every glTF content file, the
  `tileset.json`, CRS decision, transform, region, and error method into a
  deterministic SHA-256 evidence sidecar.

The internal verifier recomputes every serialized digest and checks that the
hierarchy references every audited LOD exactly once. It rebuilds the refinement
contract from the hashed LOD manifest, verifies every tile error and its
parent-child monotonicity, then checks each glTF root-node axis matrix,
coordinate metadata, and placement audit. A changed tile error or SSE evidence
is rejected even when the surrounding JSON is internally rehashed.

The `topographic-3d-tiles-conformance.yml` workflow creates a deterministic,
generated 3x3 fixture and runs the pinned CesiumGS 3D Tiles Validator `0.6.1`.
The validator is Apache-2.0 and supports 3D Tiles 1.1 plus glTF content. AGID
then parses the version-specific report contract independently and requires
both `numErrors` and `numWarnings` to be zero. The resulting attestation binds
the tileset, internal evidence, and validator report by SHA-256. A generated
workflow or local internal check is not itself an external pass; only a
successfully produced validator attestation is one.

The report-import gate accepts only the canonical pinned report name
`cesium-validator-0.6.1.json`, `tileset.json`, and
`tileset.evidence.json`, and writes a newly created
`external-validator.evidence.json`. It rejects a name/version mismatch,
non-UTF-8 or oversized input, any reused input/output path, and any existing
output rather than overwriting evidence. This binds a reviewed validator report
to one exact generated fixture; it does not make the report a source-promotion,
survey, coverage, or production-runtime claim.

The v0.11 browser gate adds a separate runtime-compatibility proof using pinned
CesiumJS package `1.132.0` (runtime `Cesium.VERSION` value `1.132`,
Apache-2.0) and Chromium through Playwright. It serves only local generated
artifacts and the installed Cesium distribution; it does not use Cesium ion,
remote imagery, credentials, or production traffic. The fixed view contract is:

- 1280 by 720 CSS and drawing-buffer pixels at device pixel ratio 1;
- perspective camera at the tileset region centre, 100 metres above the
  tileset bounding-sphere centre, looking nadir;
- `maximumScreenSpaceError` 16, dynamic SSE disabled, and skip-LOD disabled;
- both synthetic fixture LOD contents loaded, at least one visible-tile event,
  initial-view and all-required-tiles completion events, two post-render frames
  after idle, and no render, tile, page, or console errors;
- a canvas pixel audit with `preserveDrawingBuffer` enabled and at least 1,000
  pixels differing from the configured background.

The gate writes a runtime report, PNG screenshot, and fail-closed validation.
The validation binds those two artifacts to the exact tileset and internal
evidence SHA-256 digests. This closes the narrower claim that the deterministic
fixture can be loaded and visibly rendered by the pinned CesiumJS runtime. It
does not replace the external validator, prove semantic or survey accuracy, or
demonstrate production-scale, cross-browser, mobile-GPU, antimeridian, or
device-wide compatibility.

The placement decision follows OGC 3D Tiles 1.1: a `region` bounding volume is
already expressed in EPSG:4979 and is therefore not transformed by the tile
matrix, while glTF content is transformed. The shared metric serializers use
the PROJ geographic-to-ECEF-to-ENU sequence. When a non-ellipsoidal source is
exported outside 3D Tiles, its source height remains a local-up value and is
labelled as such; it is never relabelled as EPSG:4979.

Relevant primary references are the
[OGC 3D Tiles 1.1 specification](https://docs.ogc.org/cs/22-025r4/22-025r4.html),
the [Khronos glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html),
the [PROJ topocentric conversion](https://proj.org/en/stable/operations/conversions/topocentric.html),
the [CesiumJS perspective SSE implementation](https://github.com/CesiumGS/cesium/blob/main/packages/engine/Source/Scene/Cesium3DTile.js),
the [Cesium3DTileset runtime events](https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html),
the [Cesium Scene render events](https://cesium.com/learn/cesiumjs/ref-doc/Scene.html),
and the
[CesiumGS validator repository](https://github.com/CesiumGS/3d-tiles-validator).
The reference SSE profile and synthetic runtime proof are not claims about a
production tileset. Dynamic, foveated, orthographic, and device-specific
adjustments, orthometric-to-ellipsoidal geoid transformation, antimeridian
handling, and production-scale renderer conformance remain blocked stages.

## Contour topology gate

The v0.4 vectorizer keeps Turf's reviewed marching-squares implementation for
fixed contour levels, then applies an AGID-owned deterministic topology gate.
Turf documents rectangular gridded input and MultiLineString output, but does
not promise tile-edge continuity or duplicate-segment rejection. The gate:

- maps Turf's uniform bounding-box coordinates back onto adapter-provided
  longitude columns and latitude rows, preserving non-linear projected axes;
- rounds WGS 84 positions to nine decimal places, snaps boundary intersections,
  removes consecutive duplicate positions, and canonicalizes line direction;
- requires every open LineString endpoint to touch the raster boundary and
  rejects degenerate lines, interior dangling endpoints, or duplicate segments;
- caps line features and boundary contacts independently of the existing cell
  and contour-level limits;
- records closed/open counts, vertex and segment counts, and bounded
  tile-boundary contacts in the evidence manifest.

Each boundary contact has a deterministic `matchKey` built from contour
elevation and WGS 84 endpoint coordinates. Adjacent tiles can compare these
keys even though one tile calls the shared edge east and the other west. These
are topology matching hints, not cryptographic signatures and not proof that
independently sourced tiles use the same vertical datum, epoch, or resolution.
Those source compatibility gates remain mandatory before a coastal or
cross-tile merge.

## Privacy and non-claims

The plan accepts only a bounded AOI and optional country code. It does not
accept or retain recipients, unit numbers, delivery instructions, query logs,
or private AOID material. Terrain and map context do not prove an address,
entrance, recipient, or delivery point.
