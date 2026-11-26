# Full-resolution island queries

The local pack stores 180,170 distinct GSHHG ocean-island and Antarctic grounding-line island IDs and 1,437 lake-island IDs. It separately indexes 352,589 FieldMaps ADM0 land components from 318 source units. These are counts of physical features and administrative geometries. Several countries can share an island, and an island can have no matching country evidence.

The **High-resolution island data** GitHub Actions workflow builds and verifies the full dataset. Its downloadable `agid-world-islands` artifact contains the SQLite file, build manifest, source audit, downloadable CSV of unresolved and flagged island samples, SHA-256 checksums and instructions. Artifacts are retained for 14 days and the same workflow can rebuild the data.

## Query a downloaded pack

Use a checkout of this repository with its Node dependencies installed, and Python 3.11+ with GDAL/OGR, GEOS and SQLite RTree. On Debian/Ubuntu the Python binding is available as `python3-gdal`. A query runs locally and returns the territorial display used by AGID. The country indicated by a map is independent of the delivery destination.

```sh
npm ci
node --import tsx scripts/query-island-pack.ts /path/to/world.sqlite 45.85 -82.18 --python /usr/bin/python3
```

This example finds Canada's Manitoulin Island as a lake island. At 45.78, −81.97, Lake Manitou on that island has no island assignment. On Borneo, 4.88, 114.93 resolves to Brunei, 1.55, 110.35 to Malaysia and −0.48, 117.13 to Indonesia. All three points have the same physical island ID. Local published outputs apply AGID's Japanese territorial display and disputed-island policy. The Python reader emits intermediate source evidence for the TypeScript policy. The SQLite pack is separate from the web assets.

## Use the local map

Start the Vite development server on the same computer as the pack.

```sh
AGID_ISLAND_PACK_PATH=/path/to/world.sqlite AGID_ISLAND_PACK_PYTHON=/usr/bin/python3 npm run dev
```

Open the site via its printed localhost or 127.0.0.1 URL. Both map views can check a selected manual pin against the installed pack. The local route advertises availability without receiving coordinates. It accepts a point only through a same-origin local POST, rejects routed/forwarded peers and cross-origin requests, and marks responses `no-store`. Device uncertainty and AGID-only cells continue to use their complete-footprint assessment. With no local pack configured, the existing bundled island lookup remains available. Static production deployments do not include this optional local route.

## Rebuild

```sh
/usr/bin/python3 scripts/island-evidence-pack.py build /path/to/world.sqlite
```

The build downloads and verifies two pinned archives before producing the SQLite file. GitHub Actions fetches the identical coastline archive from [the upstream project's release](https://github.com/GenericMappingTools/gshhg-gmt/releases/tag/2.3.7). Allow approximately 4 GiB of local disk space for the pack, downloads, and temporary files. To use publicly downloaded files already on disk, add `--gshhg-archive gshhg-shp-2.3.7.zip --fieldmaps-archive adm0_polygons.gpkg.zip`. The extracted pinned FieldMaps GeoPackage is also accepted via `--fieldmaps-gpkg`. The generator completes its work in a temporary directory and atomically publishes the finished file.

The verified sample pack is 1,066,053,632 bytes with SHA-256 `ad244f5ee9831f5ad06046f716d4aa65ba4beb948b1f7a5cd4d0aedcd3c4748c`. Source archives are checked independently. SQLite, zlib and GDAL versions can change the generated container's bytes. Its `metadata` table includes source versions, digests and feature counts, and its `source_files` table includes the GSHHG distribution notices.

## Reproduce the audit

```sh
node --import tsx scripts/verify-island-evidence-pack.ts /path/to/world.sqlite /usr/bin/python3
/usr/bin/python3 scripts/audit-island-evidence-pack.py /path/to/world.sqlite
/usr/bin/python3 scripts/audit-island-evidence-pack.py /path/to/world.sqlite --fieldmaps-components
/usr/bin/python3 scripts/audit-island-evidence-pack.py /path/to/world.sqlite --gap-register island_source_gaps.zip
```

The end-to-end controls cover a shared island, a lake island and its interior water body, a small island from the separate ADM0 source, both sides of the antimeridian, the Japanese and disputed display policies, an overseas territory, mainland and open water.

The first source audit takes one point on the largest represented fragment of each of the 181,607 GSHHG islands. It intersects that point with the full ADM0 archive. At 72,657 points it finds one unflagged code, 336 meet a flagged unit, 108,585 return no administrative code, and 29 fall on a nested lake or pond. These figures precede AGID's display policy. A positive code at one point cannot label a whole shared island. Disagreement between the two source shorelines is material for small features.

The separate FieldMaps audit evaluates 352,294 small administrative land components and proves spatial separation of the entire padded bounding rectangle for 137,665. Of those, 136,872 have an unflagged regional code across 191 distinct codes and 793 meet a flagged source unit. This is a conservative source-geometry lower bound for isolated components. The coordinates may also occur in GSHHG; the totals must not be added, and the point query can still abstain on independently mapped inland water.

## Additional national land evidence

The local reader can identify a country for 81 source island IDs with an administrative gap at their audit point. For 52 IDs in Canada and 29 in Japan, the entire outward-rounded envelope of **every** GSHHG fragment, enlarged by 0.0001° on all sides, lies strictly inside a valid national land polygon. The test excludes contact with its shoreline, borders and interior holes. This whole-feature index stores only IDs and source metadata. At the original 81 audit points the public lookup gained 48 Canadian and four Japanese assignments. The other 29 already had positive bundled evidence.

An additional 10,383 physical island IDs overlap official land in part, comprising 9,290 IDs in Canada and 1,093 in Japan. A lookup must fall strictly inside the intersection between GSHHG and national land. The same physical island can return a country at one coordinate and remain unresolved at another. The 16 compressed point-data files total 2,443,382 bytes and are read locally by the optional pack lookup.

At the 108,585 original sample points without an ADM0 code, the public lookup returns a country at **7,377**, shows a dispute at **78**, leaves **101,054** unresolved and finds no qualifying land in **76** reviewed shoreline gaps. The 7,377 comprise 6,364 existing positive results, 52 additions from whole-feature containment and 961 from strict point intersections. The national datasets added 907 Canadian and 106 Japanese results at these sample points. Each figure describes a single sample per physical island ID.

The lookup requires a single physical island ID from the pinned GSHHG and FieldMaps editions. The exact point must lie in the interior of the physical island, with no conflicting territorial evidence or mapped inland water at that point. National proofs leave the Japanese review masks and other disputed areas to the common display policy. The archived source audit continues to report the original two data sources.

To regenerate both supplements, download the two archives identified by URL and SHA-256 in `src/data/nationalIslandSupplement.json`. The point-overlap generator also requires Python Shapely 2.

```sh
/usr/bin/python3 scripts/build-national-island-supplement.py /path/to/world.sqlite island_source_gaps.zip \
  lpr_000b21a_e.zip N03-20260101_GML.zip src/data/nationalIslandSupplement.json
/usr/bin/python3 scripts/build-national-island-points.py /path/to/world.sqlite island_source_gaps.zip \
  lpr_000b21a_e.zip N03-20260101_GML.zip scripts/data/national-island-points
```

Adapted from Statistics Canada, 2021 Census Boundary Files (provinces/territories, cartographic). This does not constitute an endorsement by Statistics Canada of this product. [Canadian boundary-file reference guide](https://www150.statcan.gc.ca/n1/pub/92-160-g/92-160-g2021002-eng.htm) · [Statistics Canada Open Licence](https://www.statcan.gc.ca/en/terms-conditions/open-licence)

国土数値情報（行政区域データ・2026年）（国土交通省）を加工して作成。The MLIT prefectural polygons follow administrative boundaries and shorelines as of 2026-01-01. [MLIT source and use terms](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Geometry and limits

The pack retains original double-precision source polygons as compressed WKB. Point queries use a spatial index followed by tests against the polygon interiors, holes and edges. GSHHG levels 2 and 4 preserve lakes and ponds within island groups. Antarctic island shapes use the grounding-line alternative. Each cut fragment at the antimeridian retains its original island ID; points on both planar representations are evaluated. The public query also checks bundled island evidence where the pack has no affirmative result or its administrative data has a gap. Positively mapped interior lake and pond water takes precedence over ordinary bundled land. Japanese shoreline policy still applies.

A supplementary FieldMaps result can identify a small land component absent from GSHHG. It requires containment at the point and separation of the **entire component** from neighbouring source polygons. This cross-check considers components under two degrees per axis with no more than 64 nearby geometries, away from the antimeridian cut and outside a positively mapped GSHHG inland water body. Its physical kind is `shoreline-island`. Its IDs are specific to this FieldMaps edition. These supplementary results overlap the coverage of the two sources and should not be added to the GSHHG count.

Survey dates, minimum feature size, inland-water completeness, shoreline differences, reclamation and political changes limit interpretation. A miss carries no country assignment. Administrative groups in the FieldMaps international edition refer to that dataset's perspective. Ambiguous or unsettled groups must pass the shared AGID display policy. No shipping destination is inferred.

## Data sources and redistribution

GSHHG full-resolution 2.3.7 was released on 2017-06-15 by Paul Wessel and Walter H. F. Smith. Its data are distributed under LGPL-3.0-or-later. Preserve upstream notices and applicable license and source access when redistributing the derived pack. [GSHHG source and documentation](https://www.soest.hawaii.edu/pwessel/gshhg/) · [Exact original data archive](https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-2.3.7.zip)

The FieldMaps International USGS/LSIB edition used here is dated 2025-07-29 and uses the public-domain USGS coastline distribution. [FieldMaps editions and terms](https://fieldmaps.io/data/adm0/) · [Exact archive endpoint, SHA-256 pinned by the generator](https://data.fieldmaps.io/adm0/usgs/intl/adm0_polygons.gpkg.zip)

The optional gap register is a zipped CSV of physical IDs, interior sample coordinates, and source review reasons for unmatched or disputed/flagged samples. Its rows carry no territorial decision or postal destination.
