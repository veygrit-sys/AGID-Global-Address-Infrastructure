# Full-resolution island queries

The local pack stores 180,170 distinct GSHHG ocean-island and Antarctic grounding-line island IDs and 1,437 lake-island IDs. It separately indexes 352,589 FieldMaps ADM0 land components from 318 source units. These are counts of physical features and administrative geometries. Several countries can share an island, and an island can have no matching country evidence.

The **High-resolution island data** GitHub Actions workflow builds and verifies the full dataset. Its downloadable `agid-world-islands` artifact contains the SQLite file, build manifest, SHA-256 checksum and instructions. Artifacts are retained for 14 days and the same workflow can rebuild the data.

## Query a downloaded pack

Use a checkout of this repository with its Node dependencies installed, and Python 3.11+ with GDAL/OGR, GEOS and SQLite RTree. On Debian/Ubuntu the Python binding is available as `python3-gdal`. A query runs locally and returns the territorial display used by AGID. The country indicated by a map is independent of the delivery destination.

```sh
npm ci
node --import tsx scripts/query-island-pack.ts /path/to/world.sqlite 45.85 -82.18 --python /usr/bin/python3
```

This example finds Canada's Manitoulin Island as a lake island. At 45.78, −81.97, Lake Manitou on that island has no island assignment. On Borneo, 4.88, 114.93 resolves to Brunei, 1.55, 110.35 to Malaysia and −0.48, 117.13 to Indonesia. All three points have the same physical island ID. Local published outputs apply AGID's Japanese territorial display and disputed-island policy. The Python reader emits intermediate source evidence for the TypeScript policy. The SQLite pack is separate from the web assets.

## Rebuild

```sh
/usr/bin/python3 scripts/island-evidence-pack.py build /path/to/world.sqlite
```

The build downloads and verifies two pinned archives before producing the SQLite file. Allow approximately 4 GiB of local disk space for the pack, downloads, and temporary files. To use publicly downloaded files already on disk, add `--gshhg-archive gshhg-shp-2.3.7.zip --fieldmaps-archive adm0_polygons.gpkg.zip`. The extracted pinned FieldMaps GeoPackage is also accepted via `--fieldmaps-gpkg`. The generator completes its work in a temporary directory and atomically publishes the finished file.

The verified sample pack is 1,066,053,632 bytes with SHA-256 `ad244f5ee9831f5ad06046f716d4aa65ba4beb948b1f7a5cd4d0aedcd3c4748c`. Source archives are checked independently. SQLite, zlib and GDAL versions can change the generated container's bytes. Its `metadata` table includes source versions, digests and feature counts, and its `source_files` table includes the GSHHG distribution notices.

## Reproduce the audit

```sh
node --import tsx scripts/verify-island-evidence-pack.ts /path/to/world.sqlite /usr/bin/python3
/usr/bin/python3 scripts/audit-island-evidence-pack.py /path/to/world.sqlite
/usr/bin/python3 scripts/audit-island-evidence-pack.py /path/to/world.sqlite --fieldmaps-components
```

Thirteen end-to-end controls cover a shared island, a lake island and its interior water body, a small island from the separate ADM0 source, both sides of the antimeridian, the Japanese and disputed display policies, an overseas territory, mainland and open water.

The first source audit takes one point on the largest represented fragment of each of the 181,607 GSHHG islands. It intersects that point with the full ADM0 archive. At 72,657 points it finds one unflagged code, 336 meet a flagged unit, 108,585 return no administrative code, and 29 fall on a nested lake or pond. These figures precede AGID's display policy. A positive code at one point cannot label a whole shared island. Disagreement between the two source shorelines is material for small features.

The separate FieldMaps audit evaluates 352,294 small administrative land components and proves spatial separation of the entire padded bounding rectangle for 137,665. Of those, 136,872 have an unflagged regional code across 191 distinct codes and 793 meet a flagged source unit. This is a conservative source-geometry lower bound for isolated components. The coordinates may also occur in GSHHG; the totals must not be added, and the point query can still abstain on independently mapped inland water.

## Geometry and limits

The pack retains original double-precision source polygons as compressed WKB. Point queries use a spatial index followed by tests against the polygon interiors, holes and edges. GSHHG levels 2 and 4 preserve lakes and ponds within island groups. Antarctic island shapes use the grounding-line alternative. Each cut fragment at the antimeridian retains its original island ID; points on both planar representations are evaluated. When the GSHHG shape matches but the administrative data has a gap, the public query can use an affirmative bundled island classification.

A supplementary FieldMaps result can identify a small land component absent from GSHHG. It requires containment at the point and separation of the **entire component** from neighbouring source polygons. This cross-check considers components under two degrees per axis with no more than 64 nearby geometries, away from the antimeridian cut and outside a positively mapped GSHHG inland water body. Its physical kind is `shoreline-island`. Its IDs are specific to this FieldMaps edition. These supplementary results overlap the coverage of the two sources and should not be added to the GSHHG count.

Survey dates, minimum feature size, inland-water completeness, shoreline differences, reclamation and political changes limit interpretation. A miss carries no country assignment. Administrative groups in the FieldMaps international edition refer to that dataset's perspective. Ambiguous or unsettled groups must pass the shared AGID display policy. No shipping destination is inferred.

## Data sources and redistribution

GSHHG full-resolution 2.3.7 was released on 2017-06-15 by Paul Wessel and Walter H. F. Smith. Its data are distributed under LGPL-3.0-or-later. Preserve upstream notices and applicable license and source access when redistributing the derived pack. [GSHHG source and documentation](https://www.soest.hawaii.edu/pwessel/gshhg/) · [Exact original data archive](https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-2.3.7.zip)

The FieldMaps International USGS/LSIB edition used here is dated 2025-07-29 and uses the public-domain USGS coastline distribution. [FieldMaps editions and terms](https://fieldmaps.io/data/adm0/) · [Exact archive endpoint, SHA-256 pinned by the generator](https://data.fieldmaps.io/adm0/usgs/intl/adm0_polygons.gpkg.zip)
