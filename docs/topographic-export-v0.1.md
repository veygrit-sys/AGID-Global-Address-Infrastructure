# AGID Topographic Export v0.1

Status: executable foundation, not a worldwide data-coverage claim.

## Purpose

AGID Topographic Export provides a source-gated workflow for rectangular 2D,
3D, CAD, BIM, raster, and raw geographic exports. The browser workspace is
available at `/topographic-export`.

The feature inventory was checked against the public TopoExport surfaces on
2026-07-26:

- <https://topoexport.com/>
- <https://app.topoexport.com/>

This document describes AGID behavior only. It does not claim commercial
parity, equivalent data coverage, identical accuracy, or access to proprietary
TopoExport datasets.

## Executable surface

| Capability | AGID v0.1 |
| --- | --- |
| Rectangle selection | WGS84 bounds, including antimeridian crossing |
| Area limit | Hard block above 50 km2 |
| Projection | Explicit `EPSG:<code>` required |
| 2D layers | Buildings, parcels, roads, rail, water, shadows, vegetation, contours |
| 3D layers | Buildings, LoD2 roof geometry, parcels, transport, water, vegetation, contours, terrain mesh |
| Raster layers | Satellite/terrain raster contract |
| Formats | DXF, PDF, SVG, IFC4, OBJ, glTF 2.0, STL, GeoJSON, GeoTIFF, TXT |
| Source evidence | Publisher, product, URL, terms, license, version, dates, attribution, coverage, correction route |
| Privacy boundary | No recipient, raw address, query-log, credential, or private coordinate fields |
| Safe demo | Synthetic geometry and elevation fixture only |

## Export gates

`buildTopographicExportPlan()` blocks an export when any required condition is
missing:

1. Valid finite WGS84 bounds and area no greater than 50 km2.
2. Explicit EPSG identifier.
3. At least one selected layer.
4. Format/layer compatibility.
5. A source that covers the selected scope, layer, and output format.
6. Approved reuse status.
7. Source URL, terms URL, license, version, publication/retrieval dates,
   attribution, and correction route.
8. A current freshness deadline when the source declares one.
9. Non-synthetic evidence for `source-backed` mode.

LoD2 roof geometry always carries an additional country/scope warning. A valid
serializer result does not imply cadastral authority, legal boundary accuracy,
delivery reachability, or worldwide availability.

## Format implementation

The conformance suite creates and checks a real artifact for every listed
format:

- DXF uses POLYLINE, POINT, and 3DFACE entities.
- PDF is a vector PDF 1.4 document.
- SVG preserves vector layer identity in element attributes.
- IFC uses IFC4 `IFCTRIANGULATEDFACESET`.
- OBJ preserves points, lines, and triangle faces.
- glTF uses glTF 2.0 point, line, and triangle primitives with an embedded
  binary buffer.
- STL is an ASCII triangle surface.
- GeoJSON is a feature collection with source IDs and AGID layer IDs.
- GeoTIFF is a little-endian WGS84 grayscale raster with pixel scale, tiepoint,
  and GeoKey directory tags.
- TXT is a deterministic feature/mesh interchange fixture.

Run:

```powershell
npm run verify:topographic-export
```

## Source promotion

The built-in source record is synthetic and cannot satisfy a source-backed
request. Real-world sources must be promoted country by country after their
reuse terms and geographic scope are verified. Raw source snapshots stay
separate from derived artifacts.

The next promotion layer should adapt AGID's existing official and reusable OSS
source catalogs into `TopographicSourceRecord`, then add ingestion fixtures for
each layer. Satellite imagery, cadastral data, vegetation classification, and
LoD2 roofs remain blocked where no approved source exists.

## Studio TIN preview

The Studio 3D preview uses Three.js `0.185.1` under the MIT license. The
implementation was checked against the official
[BufferGeometry](https://threejs.org/docs/#api/en/core/BufferGeometry),
[WebGLRenderer](https://threejs.org/docs/#api/en/renderers/WebGLRenderer),
[PerspectiveCamera](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera),
and
[OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)
interfaces, together with the official
[responsive rendering](https://threejs.org/manual/en/responsive.html) and
[resource cleanup](https://threejs.org/manual/en/cleanup.html) guidance.

Three.js is used for direct in-browser inspection of the already-gated TIN.
Cesium remains the independent runtime compatibility check for serialized 3D
Tiles. This avoids adding a tile server or external runtime assets to the
Studio and keeps the preview local and credential-free.

The preview contract has these boundaries:

- WGS84 longitude/latitude is converted to a local east-north-up horizontal
  frame at the selection center. Antimeridian-crossing bounds are supported.
- Source elevation is rendered relative to its own minimum/maximum range. It
  is not relabeled as ellipsoidal height and is not used for EPSG:4978
  placement.
- Display-only vertical exaggeration is reported in the UI and is bounded from
  1x to 20x.
- Meshes above 250,000 vertices or 500,000 triangles, malformed indices,
  missing identities, and vertices outside the declared bounds fail closed.
- The `VERIFIED LOCAL TIN` label is shown only for a mesh produced by the
  evidenced local GeoTIFF workflow. The built-in fixture remains explicitly
  labeled `SYNTHETIC TIN FIXTURE`.
- Geometry, material, controls, grid, resize observers, animation frames, and
  renderer resources are explicitly released when the preview changes or
  unmounts.

The preview proves that a bounded TIN can be inspected interactively. It does
not prove real-world source coverage, vertical accuracy, cadastral authority,
or delivery suitability.

### Local Explore Map

The Studio `Explore` tab is a local direct-manipulation surface for choosing a
small export extent. It uses MapLibre GL JS with a local style containing only
a background layer and an in-memory GeoJSON source. The source draws the
current selection, a nine-cell reference grid, and a focus marker; it has no
remote style, tile, terrain, geolocation, address, recipient, AOID, or source
geometry input. MapLibre's documented
[GeoJSON source update API](https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/)
redraws that local scene when the explicit export selection changes.

Panning and zooming merely inspect a candidate view. `Use view` is enabled
only for a valid non-polar WGS84 extent within the existing 50 km2 export cap.
World-wrap extents and invalid latitude ranges fail closed. Antimeridian
selections are split into local GeoJSON polygons and fit through a continuous
viewport, while retaining the normal bounded-export contract. This is not a
basemap, a data-coverage assertion, a navigation feature, or a claim that an
interactive screen represents a real place. The local style follows the
[MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/).

The field-style interaction layer keeps the map useful without turning it into
a location-tracking surface: a screen-centre survey reticle indicates the
visible working area, a heading readout follows local map rotation, and the
compass returns to north-up. These controls only affect the browser-resident
map camera; they do not create a point record, query a map service, or change
the export selection until `Use view` is chosen.

## Audited local LOD selection

Local GeoTIFF conversion may produce a regular-grid TIN bundle at multiple
strides. Studio exposes a 3D-preview LOD only when its evidence has an explicit
vertical-error cap, a passed audit for every advertised level, matching level
and stride metadata, and a matching count of generated meshes and audit rows.
An invalid selection or any evidence mismatch blocks the local terrain preview
rather than falling back to a synthetic mesh.

The reported `grid residual` is the maximum all-grid-node vertical residual for
that derived mesh. It is deliberately separate from the 3D Tiles
`geometricError`, which the [OGC 3D Tiles specification](https://docs.ogc.org/cs/22-025r4/22-025r4.pdf)
defines as a meter-valued screen-space-error input. Studio therefore never
labels the residual as a 3D Tiles geometric error or a delivery-accuracy claim.

## NYC 3DEP case-study intake

NYC intake has two explicit, non-interchangeable source profiles: the existing
1/3 arc-second NAD83 geographic DEM (`EPSG:4269`) and the 1-meter NAD83 / UTM
zone 18N DEM (`EPSG:26918`). The intake inspects the GeoTIFF GeoKeys and
selects the matching profile, or fails closed. The profile is recorded in the
derived ledger alongside the source version, NAVD88 declaration, official
metadata route, and content digest; it does not assert that any specific USGS
asset has been downloaded, validated, or promoted.

When an operator also supplies separately retained ScienceBase and FGDC product
metadata snapshots, the XML is checked against the inspected GeoTIFF profile:
the geographic profile requires a `geograph` declaration, while the NYC 1-meter
profile requires `Universal Transverse Mercator` and UTM zone `18`. Both routes
also require explicit NAD83 and NAVD88 declarations. Missing, ambiguous, or
contradictory metadata is rejected; this is local evidence binding, not a claim
that AGID has acquired or promoted a particular USGS asset.

New York City is the first concentrated terrain intake profile. It combines two
separate sources with distinct responsibilities:

| Evidence | Role | Reuse/version boundary |
| --- | --- | --- |
| [USGS 3DEP products and services](https://www.usgs.gov/3d-elevation-program/about-3dep-products-services) | Bare-earth terrain input | USGS states that 3DEP products are free of charge and without use restrictions. The exact DEM asset must still carry a resolved version, SHA-256 digest, CRS, vertical datum, and product metadata. |
| [USGS 3DEP product metadata](https://www.usgs.gov/ngp-standards-and-specifications/3dep-product-metadata) | Acquisition evidence | Product metadata is retained with the exact DEM receipt; it does not substitute for hashing the downloaded raster. |
| [NYC DCP Borough Boundary 26B metadata](https://s-media.nyc.gov/agencies/dcp/assets/files/pdf/data-tools/bytes/nybb_metadata.pdf) | Administrative scope reference | Edition 26B, published 2026-05-19. It is scope context only, not embedded geometry, and DCP's informational-use disclaimer remains attached. |

`createNyc3depSourceLedger()` accepts no address, AOID, recipient, coordinate
point, token, or secret. It accepts only an operator-produced receipt for a
public USGS/National Map asset: immutable product version, SHA-256, timestamps,
cell count, official asset and metadata URLs, `EPSG:4269`, and `NAVD88`.
Credentials or signed URL query parameters are rejected. The function then
creates the existing Studio-importable ledger after applying the regional
source-promotion gate.

The generic GeoTIFF adapter accepts geographic WGS84 (`EPSG:4326`), NAD83
(`EPSG:4269`), Web Mercator (`EPSG:3857`), and WGS84 UTM zones
`EPSG:32601`-`EPSG:32660` / `EPSG:32701`-`EPSG:32760`. UTM cells are inverse
projected with Proj4js at every grid node and retained as a curvilinear WGS84
lattice. Contours run through Turf's gridded marching-squares implementation in
the affine source-grid index space, then each interpolated point is mapped back
through the same UTM-to-WGS84 transform; their evidence records this
`source-affine-inverse-projection` remapping. Coastal seam reconciliation
accepts a curvilinear grid only when land DEM, bathymetry DEM, and coastline
classification serialize to the exact same canonical coordinate-lattice SHA-256
and the coastline source record binds that digest as related evidence. A
different lattice, an altered lattice, or a source record without that binding
fails closed. This is not a survey-grade horizontal datum claim. The NYC 3DEP
ledger and intake CLI remain intentionally limited to their separately evidenced
`EPSG:4269` / `NAVD88` contract; vertical data is not eligible for ellipsoidal
3D Tiles placement unless a separately evidenced vertical transformation is
supplied.

No NYC DEM, boundary geometry, individual address, building location, or
delivery data has been fetched or bundled by this case-study adapter. A
source-backed preview stays blocked until an exact public source asset is
provided locally and its digest matches the generated ledger.

### NYC source-window batches

`planNyc3depSourceTiles()` turns one retained, ledger-bound NYC 3DEP GeoTIFF
image into deterministic local source windows. It uses pixel offsets and
dimensions only, not geographic coordinates: neighboring windows share exactly
one source-sample edge, so later regular-grid TIN exports can compare the same
input sample at both sides of a seam. Tiled inputs align starts to the GeoTIFF
tile grid where possible; striped inputs align to strip rows and make no false
claim about horizontal block locality. Every window remains inside the selected
IFD, respects the existing elevation-cell cap, and is bounded by an explicit
tile-count limit.

This adopts the non-resampling, source-pixel window approach of GDAL
[`gdal_translate -srcwin`](https://gdal.org/en/stable/programs/gdal_translate.html).
AGID rejects a partial or out-of-image window instead of accepting GDAL's
possible outside-image fill behavior. The plan's `gdalSrcwin` tuple is a recipe
for a separately controlled local extraction, not an execution record; AGID
does not invoke GDAL during planning or claim a COG optimization merely because
a plan is block-aligned. It also follows PDAL's reproducible JSON-pipeline
principle while retaining this first terrain intake as a small, content-bound
JSON plan rather than a point-cloud transformation
([PDAL pipeline documentation](https://pdal.io/en/stable/pipeline.html)).

The local helper below reads only a separately retained GeoTIFF and its approved
single-record ledger, checks the file's SHA-256 against that ledger, writes a
new JSON plan with exclusive-create semantics, and omits elevations, bounds,
addresses, recipients, AOID material, and credentials:

```powershell
npm run plan:nyc-3dep-local-tiles -- `
  --asset <retained-nyc-dem.tif> `
  --ledger <approved-source-ledger.json> `
  --output output/topography/nyc.tile-plan.json `
  --generated-at <iso-8601> `
  --max-window-width <samples> `
  --max-window-height <samples> `
  --max-tiles <count>
```

`createNyc3depTileBatchReceipt()` now accepts one source-backed local GeoTIFF
workflow result per planned tile. It checks the USGS snapshot digest, selected
IFD, source dimensions, read window, evidence sidecar, output digest, and
matching 3D Tiles status evidence before comparing each shared edge in memory
with exact Float64 values. It emits only source-plan, artifact, and shared-edge hashes;
it retains no raw elevations, coordinates, addresses, recipients, AOID
material, or credentials. A missing tile, source/evidence mismatch, blocked
3D Tiles status mismatch, non-finite shared sample, or one unequal edge fails
the entire batch receipt closed. A blocked child stays explicitly blocked in
the receipt; `requireNyc3depTileBatchReadyFor3dTilesHierarchy()` rejects any
parent hierarchy build until every child has independently become ready.

The receipt is deliberately not a merged tileset. It establishes neither
vertical accuracy, comprehensive NYC coverage, inter-tile visual continuity
after renderer processing, building geometry, nor delivery suitability. A
subsequent exporter must persist the attested child artifacts and build a
validated parent 3D Tiles hierarchy.

`buildNyc3depParent3dTileset()` provides that parent hierarchy assembly for
ready child bundles. It implements the OGC 3D Tiles 1.1 external-tileset model:
the root contains no terrain content, uses `REPLACE`, encloses child regions,
has a geometric error strictly above every child, and refers to each child by a
safe relative `.../tileset.json` URI. Before emitting its own hash-bound
sidecar it re-verifies each child bundle, its LOD bundle, snapshot digest,
EPSG:4979 vertical-datum gate, and receipt hashes. It rejects missing or
blocked children, unsafe URIs, child source drift, invalid regions, or altered
bundle data. Persisting the children and running external/renderer validation
remain separate steps.

The local batch exporter is the execution path for an approved tile plan. It
reads the retained GeoTIFF once, rebinds its SHA-256 to both the plan and the
single approved `usgs-3dep` ledger record, processes every planned source
window, and writes a new output directory only. Every file uses exclusive
creation and `batch.export.json` is written last as the completion marker. A
failed run may leave non-overwritable partial files, but never a completion
marker; use a fresh output directory after inspection rather than replacing
those files.

```powershell
npm run export:nyc-3dep-local-tile-batch -- `
  --asset <retained-nyc-dem.tif> `
  --ledger <approved-source-ledger.json> `
  --plan <digest-bound-tile-plan.json> `
  --output-dir output/topography/nyc-batch `
  --generated-at <iso-8601>
```

An optional `--cog-validation-receipt` is re-bound to the reviewed ledger just
as it is for the single-window export. `--derive-nodata-mask` remains limited
to the source-tagged NoData path. The exporter writes no raw raster or raw
elevation array. If the ledger's vertical datum does not independently satisfy
the EPSG:4979 placement gate, child glTF/LOD artifacts and a blocked batch
receipt may be written, but no parent `tileset.json` is created.

After transfer or before Studio import, re-check the completed package without
re-reading the raw GeoTIFF:

```powershell
npm run verify:nyc-3dep-local-tile-batch -- `
  --output-dir output/topography/nyc-batch
```

The verifier re-hashes `tile.plan.json`, `batch.receipt.json`, each primary
child artifact and evidence sidecar, every referenced LOD manifest and LOD
artifact, ready child tilesets, and the optional parent tileset. It also
reconstructs the ready child and parent 3D Tiles contracts from those retained
files: LOD order and geometric-error bindings, glTF coordinate-frame evidence,
source snapshot linkage, external child URIs, and the blocked-parent rule must
all still verify. This is an internal package-integrity check, not
source-promotion, signature, external-validator, renderer, survey, coverage,
or delivery evidence.

For the ready root hierarchy, the external validator evidence is deliberately
kept outside the immutable batch package. This follows the OGC 3D Tiles 1.1
external-tileset model: the root `REPLACE` tile is a traversal hierarchy over
the independently derived child tilesets, so the validator report must bind the
root `tileset.json` and the parent sidecar rather than a merged terrain mesh.
After independently running the pinned CesiumGS 3D Tiles Validator and saving
its JSON report as `cesium-validator-0.6.1.json`, bind it to the already
verified package with a new, external output path:

```powershell
npm run verify:nyc-3dep-parent-3d-tiles-validator-report -- `
  --output-dir output/topography/nyc-batch `
  --report output/topography/nyc-validator/cesium-validator-0.6.1.json `
  --output output/topography/nyc-validator/parent.external-validator.evidence.json
```

The command first reconstructs and verifies the retained batch package, then
rehashes the root parent files and emits a hash-bound sidecar only when the
report names and digests are canonical. The sidecar records a strict
zero-errors-and-zero-warnings policy and the root's batch-receipt and child
hash bindings. A warning or error produces a blocked sidecar and a nonzero CLI
exit. It never runs the validator, changes the package, or upgrades the source,
vertical accuracy, coverage, survey, building, cadastral, route, or delivery
status. The local contract is aligned with the [OGC 3D Tiles 1.1
specification](https://docs.ogc.org/cs/22-025r4/22-025r4.html); the independent
validator remains the [CesiumGS 3D Tiles Validator](https://github.com/CesiumGS/3d-tiles-validator).

To collect a separate CesiumJS runtime observation for a ready retained parent
tileset, serve the package locally through the verifier and write the runtime
report, screenshot, and validation sidecar to a new directory outside the
package:

```powershell
tsx scripts/verify-topographic-3d-tiles-cesium-renderer.ts `
  --tileset-dir output/topography/nyc-batch `
  --output output/topography/nyc-batch-renderer-evidence
```

The retained-package mode never writes into the 3D Tiles package and binds the
runtime evidence to its root `tileset.json` and `tileset.evidence.json` hashes.
It remains a local renderer observation only; run the independent validator
separately and do not treat either result as source, survey, or coverage proof.

### Local coastline classification adapter

`adaptCoastlineClassificationGrid()` is the local handoff from an already
classified coastal grid into the seam contract. The compact byte encoding is
limited to land (`2`), breakline (`1`), and ocean (`0`) cells. It does not infer
coastline classes from elevation values, download a coastline dataset, or add a
new source to the approved ledger. Inferring a shoreline from a DEM would make
datum, tide, and source-semantics assumptions that the input evidence does not
establish.

The adapter verifies the exact classification-byte SHA-256, source snapshot
SHA-256, reference-grid lattice SHA-256, timestamp, class domain, approved
reuse gate, and the coastline record's explicit related-artifact binding to the
lattice. Its output can be supplied directly to the three-source seam
reconciler. Any missing binding, altered class byte, unsupported class, stale or
out-of-scope source gate, or grid mismatch fails closed.

The design follows the OGC Coverage model's distinction between a coverage's
values and its domain positions in the [OGC Coverage Implementation
Schema](https://docs.ogc.org/is/09-146r8/09-146r8.html): the classification
bytes are meaningful only relative to the exact referenced grid lattice. This
adapter is not an OGC Coverage decoder. Its explicit
`agid-coastal-surface-semantics-v0.1` record also binds the selected band index
to a reviewed public legend URL, legend version, publication time, and legend
SHA-256. That legend digest must appear in the promoted source record's related
artifact list, and the mapping must be exactly `0=ocean`, `1=breakline`, and
`2=land`. A source record with a matching raster but no bound legend remains
blocked; the adapter does not derive semantics from pixel values, palette
colors, or class names.

`createCoastlineClassificationLegendReceipt()` is the local evidence handoff
for that binding. It hashes a separately retained classification GeoTIFF and
its separately retained public legend bytes, confirms that the raster hash is
the exact source-snapshot hash and that the legend hash is the declared
semantic hash, then produces a canonical hash-bound receipt. It neither fetches
either artifact nor writes either artifact into derived output.
`bindCoastlineClassificationLegendReceipt()` can add that verified legend hash
and receipt hash to an already approved source record without changing its
reuse status, terms, version, coverage, correction route, or snapshot hash. A
changed receipt, source ID/version/raster hash mismatch, invalid source audit,
or missing `waterways` authority fails closed. This is a local candidate-binding
step, not independent proof that a legend is authoritative or that a source is
approved.

The local CLI accepts retained files only and creates new JSON outputs with
exclusive-create semantics; it does not overwrite an input or existing output:

```powershell
npm run create:coastline-classification-legend-receipt -- `
  --source-record <approved-source-record.json> `
  --classification-geotiff <retained-classification.tif> `
  --legend <retained-public-legend.json> `
  --legend-url <public-legend-url> `
  --legend-version <resolved-legend-version> `
  --legend-published-at <iso-8601> `
  --band-index <categorical-band-index> `
  --validated-at <iso-8601> `
  --output output/topography/coastline.legend-receipt.json `
  --bound-source-output output/topography/coastline.source-candidate.json
```

The CLI parses IFD `0` only to ensure the selected band exists. It hashes but
does not copy, upload, print, or embed the GeoTIFF and legend bytes. The output
contains only the receipt, source/legend digests, semantic declaration, and,
when requested, a separate source-record candidate that preserves the original
source's approval and policy fields unchanged.

`decodeGeoTiffCoastlineClassification()` now provides the first such local
reader for a deliberately narrow intake: IFD `0`, one selected categorical
band, a north-up non-rotated affine grid, and exact co-registration with the
supplied reference grid. Geographic WGS84 (`EPSG:4326`) inputs require exact
rectilinear axes. WGS84 UTM `EPSG:32601`-`EPSG:32660` and
`EPSG:32701`-`EPSG:32760` inputs require a matching `per-grid-node` WGS84
reference lattice: the reader checks the UTM centre extent and inverse-projects
every class-band node with Proj4js before comparing it to the stored lattice.
It reads no network source and performs no resampling, arbitrary reprojection,
NoData filling, or shoreline inference. Every cell must be an integer byte in
the documented land/breakline/ocean domain; any other value or NoData stops the
intake.

This restriction follows the [OGC GeoTIFF Standard](https://docs.ogc.org/is/19-008r4/19-008r4.html),
which defines a band as a rectangular array of sample values, and the GDAL
[raster data model](https://gdal.org/en/stable/user/raster_data_model.html),
which distinguishes band values from optional NoData and mask semantics and
identifies category names, color tables, and raster attribute tables as
optional band metadata. A source-specific reviewed legend is therefore required
outside the byte-domain check: the adapter does not assume that an arbitrary
`0`/`1`/`2` GeoTIFF has AGID coastline meaning.

An optional strict COG receipt may accompany the class band. When present, it
must pass the existing GDAL full-check gate, bind the exact input digest and byte
length, and itself be listed as a related artifact in the reviewed source
record. The raw validator report stays outside derived artifacts. Projected
CRSs outside the listed WGS84 UTM zones, rotated grids, overview selection,
multi-source mosaics, and palette/legend decoding remain blocked until their
coordinate and semantic contracts are implemented. The `0`/`1`/`2` value domain
does not by itself prove a source's land/breakline/ocean legend; promotion still
requires that semantic evidence.

### Coastal evidence sidecar

`serializeCoastalTerrainGltfEvidenceBundle()` emits a third, deterministic
`.coastal-evidence.json` artifact beside the glTF and coastal manifest. It binds
the final glTF hash and manifest hash to the three source snapshot hashes, the
coastline-classification hash, and the shared coordinate-lattice hash. It does
not copy terrain arrays, grid-node coordinates, raw source files, address data,
or credentials.

The sidecar uses a deliberately small, `W3C-PROV-DM-inspired-minimal` JSON
shape: source snapshots and output files are entities, reconciliation is the
activity, and the output declares its used source roles and manifest. This is
not a W3C PROV serialization or independent signature. The structure follows
the provenance distinction between entities, activities, and derivation in
[W3C PROV-DM](https://www.w3.org/2012/10/prov-dm), while keeping the record
small enough to publish as static metadata. It is also compatible in spirit
with [OGC API Records](https://docs.ogc.org/is/20-004r1/20-004r1.html), whose
record model is designed to be extended for specific resource types; AGID does
not claim OGC API Records conformance for this standalone file.

Serialization re-hashes the reconciled coordinate lattice and fails closed when
it differs from the seam provenance or when the coastline source does not list
that lattice hash as a related artifact. The manifest repeats only the lattice
model and digest, never the lattice coordinate values.

For a source-backed coastline classification, the manifest and sidecar also
repeat the approved legend-promotion receipt digest, promotion digest, monotonic
sequence, and verified/minimum reviewer counts. Before publishing either file,
the serializer checks those values against the source ID, source version,
classification snapshot, and the source record's related-artifact bindings.
Missing, mismatched, or under-quorum evidence fails closed. Explicit synthetic
fixtures carry `null` promotion evidence so a sample cannot be mistaken for an
approved source. This extends the existing entity/activity/derivation chain in
the minimal sidecar; it is still neither a W3C PRO serialization nor a claim of
OGC API Records or 3D Tiles Metadata conformance.

### Independent legend promotion

A local coastline legend receipt is evidence, not an activation signal. Before a
source-bound classification can be accepted for a source-backed coastline
export, `verifyCoastlineLegendPromotion()` requires a detached-review ledger
whose canonical payload binds the source ID/version, GeoTIFF snapshot hash,
legend-receipt hash, validity window, and monotonic promotion sequence. It
loads the existing `addressql-trust-store-v2` public-key policy and accepts
only active, unexpired Ed25519 keys. The effective threshold is the stricter
of the payload and trust-policy thresholds, with two or more distinct reviewer
identities required. Duplicate keys, duplicate reviewer identities, revoked or
rotated keys, wrong identities, malformed signatures, stale validity windows,
and receipt/source mismatches stop the promotion.

The implementation uses Node's [`crypto.verify`](https://nodejs.org/api/crypto.html#cryptoverifyalgorithm-data-key-signature)
with `null` for Ed25519, letting the key type select the signature algorithm as
documented by Node. Test keys are generated only in memory; no private key,
raw raster, legend bytes, address, recipient, or AOID material appears in the
promotion record. The returned decision contains only hashes, sequence,
reviewer count, and the bound source candidate.

Callers that retain the returned `nextState` must store its last sequence and
promotion digest in an integrity-protected local release state. Supplying that
state on the next verification rejects an older sequence, a competing payload
at the same sequence, or a chain that does not name the recorded predecessor.
The lower-level verifier intentionally does not write trust policies or
signatures. State persistence is delegated to the separate offline workflow so
the data-intake and signature-verification authority remain distinct.

### Offline promotion verification

`verify:coastline-classification-legend-promotion` is that intentionally
offline handoff. It accepts a bounded source-record JSON, a previously created
legend receipt, a signed promotion ledger, the public-key trust policy, and a
local state path. The ledger is self-checking: its SHA-256 covers the canonical
payload and deterministically key-sorted reviewer signatures before the
Ed25519 quorum is evaluated. The command re-hashes the receipt, verifies the
source binding, then advances the state only after the full review and chain
checks pass.

```powershell
npm run verify:coastline-classification-legend-promotion -- `
  --source-record <approved-source-record.json> `
  --receipt <legend-receipt.json> `
  --ledger <signed-promotion-ledger.json> `
  --trust-store <addressql-trust-store-v2.json> `
  --state output/topography/coastline.promotion-state.json `
  --output output/topography/coastline.promotion-report.json `
  --now <iso-8601>
```

State advancement takes a new exclusive `.lock` file, writes a temporary state
file in the same directory, then replaces the prior state with Node's
[`fs.rename`](https://nodejs.org/api/fs.html#fsrenameoldpath-newpath-callback).
This is a bounded, single-file update with concurrent attempts rejected; it is
not a cross-file transaction or a substitute for an integrity-protected local
filesystem. Replaying an already recorded ledger is idempotent, while an older
sequence, a same-sequence competing digest, or a missing predecessor stops the
command. The output report is newly created and contains only decision hashes,
counts, state status, and privacy flags; it never copies the source record,
raw GeoTIFF, legend bytes, public keys, signatures, addresses, recipient data,
or AOID material.

The classified-grid and GeoTIFF coastline adapters now require this promotion
gate for every non-synthetic source-backed request. They re-read the persisted
state and re-verify the receipt, signed ledger, active public keys, quorum, and
source/snapshot identity before exposing classification bytes to the seam
reconciler. The verified source record is augmented in memory with the receipt
and promotion digests, and the adapter provenance retains only those digests,
sequence, and reviewer counts. Missing state, stale/revoked keys, a ledger
digest mismatch, a receipt mismatch, or a ledger that is no longer the state
head blocks decoding. Explicit synthetic fixtures retain their non-authoritative
path and report no promotion evidence; this is not an exception for any real
source-backed export.

This is an AGID metadata profile, not a claim of OGC API Records or 3D Tiles
Metadata conformance. It follows the same basic separation of resource content
from discoverable metadata described by [OGC API - Records](https://ogcapi.ogc.org/records/),
while retaining the evidence as local sidecars until a separately designed
catalog publication interface exists.

### Local receipt CLI

`create:nyc-3dep-source-ledger` is the deliberately local-only acquisition
handoff. It reads a previously retained public `.tif` or `.tiff`, verifies that
its first image declares `EPSG:4269`, calculates its SHA-256 and raster cell
count, then writes only the Studio-importable ledger. It neither downloads,
uploads, copies, nor embeds the source raster. The source file must stay in a
separate, access-controlled raw-snapshot location; the generated ledger can be
kept under ignored `output/` until it is reviewed.

```powershell
npx tsx scripts/create-nyc-3dep-source-ledger.ts -- `
  --asset <local-dem.tif> `
  --asset-url <exact-official-usgs-asset-url> `
  --metadata-url <matching-official-usgs-metadata-url> `
  --version-id <resolved-product-version> `
  --published-at <iso-8601> `
  --retrieved-at <iso-8601> `
  --verified-at <iso-8601> `
  --output output/topography/nyc-3dep.source-ledger.json
```

When the candidate came from the official [TNMAccess](https://apps.nationalmap.gov/tnmaccess/)
product search, retain that JSON response separately and add
`--tnm-catalog <products.json> --tnm-product-id <selected-source-id>`. The CLI
requires that exactly one product has the selected ID and that its download URL
exactly matches the receipt. If TNMAccess includes a metadata URL, that URL must
also match. It records only the selected ID and the response SHA-256 in the
ledger, never the catalog payload, search area, or product geometry.

For a product that has a [ScienceBase](https://www.sciencebase.gov/) item and
FGDC product XML, also add `--sciencebase-metadata <item.json>` and
`--product-metadata-xml <product.xml>`. The item must bind the exact source ID,
ScienceBase URL, and download URL; the XML must explicitly declare North
American Datum of 1983 and North American Vertical Datum of 1988. Their hashes
and official product-metadata URL are retained in the ledger notes while both
source responses remain separate raw snapshots.

Large published DEMs are read only through an explicit integer raster window.
The window is recorded in the evidence sidecar with the full source image
dimensions, while the original asset digest remains bound to the ledger. For
example, a reviewed ledger and its retained DEM can produce a local glTF plus
evidence sidecar without expanding the full source grid:

```powershell
npx tsx scripts/export-nyc-3dep-local-window.ts -- `
  --asset <local-dem.tif> `
  --ledger <source-ledger.json> `
  --cog-validation-receipt <asset>.cog-validation.json `
  --image-index <internal-image-ifd> `
  --window <x,y,width,height> `
  --generated-at <iso-8601> `
  --output-dir output/topography/derived/<window-name>
```

The command permits no implicit crop or resampling. It fails when the selected
window is outside the image, larger than the elevation-grid safety limit, does
not bind to the ledger digest, or cannot pass the existing source and NoData
gates.

`--cog-validation-receipt` is optional because a GeoTIFF can be a valid input
without claiming COG conformance. When supplied, the local workflow requires
the strict passed receipt to bind the exact retained DEM hash and byte length,
then records only the receipt hash, GDAL version/time, and raw-report hash in
the derived evidence sidecar. A blocked, stale-GDAL, warning-bearing, or
mismatched receipt stops the export; neither the raw validator report nor DEM
bytes are copied into the output.

The same receipt must have been supplied to
`create-nyc-3dep-source-ledger.ts` first. Its SHA-256 is then recorded as a
related artifact in the reviewed source ledger, and the export command rejects
a receipt that the ledger does not bind. This is a content-addressed evidence
link, not a claim that every GeoTIFF is a COG.

For PowerShell callers that split comma values, the equivalent explicit form is
`--window-x <x> --window-y <y> --window-width <width> --window-height <height>`.

`--image-index` is optional and defaults to `0`. It selects one internal TIFF
image file directory (IFD), which may be a COG reduced-resolution subfile. The
window is always measured in that selected IFD's pixel coordinates. The evidence
sidecar records the selected index, total IFD count, reduced-resolution flag,
and tile/strip block layout. A reduced-resolution IFD that omits GeoTIFF tags
inherits affine georeferencing from IFD `0`, as specified for COG overviews;
the sidecar records this inherited path. No overview is selected automatically
and no extra resampling is performed, so an operator must choose the intended
resolution.

For a COG conformance claim, run the official GDAL validator in a GDAL 3.13 or
newer environment before importing the ledger. The command below performs the
full local check, retains the raw validator report separately, and writes a
digest-bound receipt. It rejects warnings as well as errors.

```powershell
npx tsx scripts/validate-nyc-3dep-cog.ts -- `
  --asset <local-dem.tif> `
  --raw-report output/topography/raw/<asset>-gdal-cog-validator.txt `
  --output output/topography/<asset>.cog-validation.json `
  --validated-at <iso-8601>
```

Then pass both `--cog-validation-receipt <asset>.cog-validation.json` and
`--cog-validation-report <asset>-gdal-cog-validator.txt` to
`create-nyc-3dep-source-ledger.ts`. The ledger re-hashes the separately
retained report and requires its basename, byte length, and SHA-256 to match
the receipt before recording only those digests, GDAL version, and validation
time. A missing, warning-bearing, stale-GDAL, report-mismatched, or
GeoTIFF-digest-mismatched receipt is rejected rather than being represented as
COG conformance.

When the GeoTIFF's selected band declares NoData, `--derive-nodata-mask` may be
used to create an in-memory GDAL RFC 15 0/255 validity mask from those tagged
cells. The evidence sidecar records its digest and `maskOrigin` as
`source-nodata-derived`; the original raster remains the only retained input.
This does not download an external mask or fill broad holes: the existing
isolated-cardinal-neighbor method, cell-count/fraction budgets, and fail-closed
edge checks still apply.

The CLI rejects non-GeoTIFF input, oversized input, non-regular files,
non-NAD83 input, missing timestamps, non-official URLs, signed or credentialed
URLs, generic versions, wrong vertical datum, and attempts to overwrite the
source asset. An operator must still review the matching USGS product metadata
for scope, resolution, terms, correction route, and the `NAVD88` vertical
datum before importing the ledger into Studio.
