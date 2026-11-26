# Point-specific official island land evidence

These sixteen gzip-compressed JSON shards contain strictly interior portions of GSHHG 2.3.7 physical features from the original source-gap register. Each portion fits within both the full-resolution island polygon and an official Canadian or Japanese land polygon. National land boundaries may differ from GSHHG. Coverage applies at the query point, including on shared islands. Original source review, disagreement, water, the Japanese territorial policy and the existing bundled island sources take priority in the offline resolver.

The source register had 108,585 administrative gaps. The whole-feature supplement covers 81 of its IDs. Excluding those 81, the point layer contains 9,290 Canadian and 1,093 Japanese physical IDs with some positive overlap. The original interior sample lies within a retained portion for 935 of the Canadian IDs and 131 of the Japanese IDs. Some of these points already have a result from the bundled sources.

The generator intersects valid source polygons with GEOS, preserving holes. It moves the intersection border inward by 0.000002 degrees, applies a topology-preserving simplification of 0.000001 degrees and quantizes vertices to 0.0000001 degrees. It keeps a portion only if the entire quantized polygon lies strictly inside each original polygon and the intersection. No part is enlarged. The query requires strict containment in this derived geometry and a matching physical feature ID. Source units are WGS84 degrees.

## Reproduction

Build the pinned SQLite pack and export its original source-gap register using the instructions in [the pack guide](../../../docs/high-resolution-island-pack.md). Download the national archives listed in `manifest.json`. The generator uses GDAL/OGR, GEOS through Shapely, SQLite RTree and Python 3.11 or newer.

```sh
python3 scripts/build-national-island-points.py world.sqlite source-gaps.zip \
  lpr_000b21a_e.zip N03-20260101_GML.zip scripts/data/national-island-points
```

The manifest records editions, source/archive links, SHA-256 fingerprints, geometry processing versions, counts and the fingerprint of each shard. The physical ID modulo 16 selects a shard. Within each polygon, the first ring is its exterior and following rings are holes. Coordinates are signed integers at the recorded scale. The first pair gives absolute longitude and latitude, followed by XY deltas. Each ring closes implicitly.

## Source notices

This directory contains geographic data adapted by the AGID project in 2026 from GSHHG 2.3.7 and the national sources below. The derived GSHHG geometry is distributed under GNU LGPL version 3 or later. Original notices and the GPL and LGPL texts accompany it under `licenses/`. The complete preferred input form is available through the listed original archives, and the transformations are implemented in `scripts/build-national-island-points.py`.

- GSHHG by Paul Wessel and Walter H. F. Smith. [Project](https://www.soest.hawaii.edu/pwessel/gshhg/) · [Original shapefile archive](https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-2.3.7.zip)
- Adapted from Statistics Canada, 2021 Census Boundary Files (provinces/territories, cartographic). This does not constitute an endorsement by Statistics Canada of this product. [Reference guide](https://www150.statcan.gc.ca/n1/pub/92-160-g/92-160-g2021002-eng.htm) · [Statistics Canada Open Licence](https://www.statcan.gc.ca/en/reference/licence)
- 国土数値情報（行政区域データ・2026年）（国土交通省）を加工して作成。[行政区域データ](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- FieldMaps International ADM0, USGS coastline edition (2025-07-29), supplies the baseline administrative coverage used to identify source gaps. [FieldMaps](https://fieldmaps.io/data/adm0/)
