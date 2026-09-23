# AGID Global Topographic Open Data Stack v0.1

## Purpose

This stack turns provider documentation into a quality-gated source selection
layer for AGID topographic export. It deliberately overlaps Overture Maps,
OpenStreetMap, Microsoft, Google, Copernicus, ESA, NASA, USGS, JRC,
OpenGeoHub, GHSL, and Natural Earth.

Source count alone is not a quality metric. A source contributes only when its
license, immutable version, retrieval time, content digest, coverage, adapter,
attribution, and correction route are recorded.

## Initial stack

The registry in `src/lib/globalTopographicOpenSourceStack.ts` includes:

1. Overture Maps release 2026-07-22.0.
2. OpenStreetMap weekly planet snapshots.
3. Microsoft Global ML Building Footprints.
4. Google Open Buildings V3 polygons.
5. Google Open Buildings 2.5D Temporal V1.
6. OpenLandMap GEDTM30.
7. Copernicus LCFM global 10 m land cover.
8. ESA WorldCover 2021 v200.
9. EC JRC Global Surface Water v1.5.
10. Global Human Settlement Layer P2023A.
11. Natural Earth.
12. NASADEM HGT v1.
13. USGS Landsat Collection 2.
14. Copernicus Sentinel-2 Level-2A.

## Fusion policy

For exportable layers, AGID selects an open primary source and retains at
least one independent export or validation source where the catalog permits.
Model-derived and coarse sources can corroborate a layer without becoming its
delivery-level source of truth.

The initial corroborated core is:

- satellite imagery;
- building footprints;
- roads;
- railways;
- waterways;
- green space and land-cover context;
- contours;
- terrain mesh.

Cadastral parcels and LoD2 roof geometry remain explicit gaps. They require
country-level official or clearly reusable open sources and cannot be inferred
from building presence or height rasters.

## Promotion gate

`promoteGlobalTopographicSnapshot()` accepts only:

- a fixed release version match or resolved immutable rolling version;
- ISO publication, retrieval, and verification timestamps;
- a SHA-256 content digest;
- a non-empty ingestion adapter version;
- a non-negative feature count;
- HTTPS license evidence;
- explicit snapshot coverage.

Validation-only sources cannot be promoted to export sources. Catalog entries
do not enable source-backed export by themselves.

## Non-claims

This registry does not claim positional parity with commercial mapping
providers, universal cadastral coverage, LoD2 roof coverage, or delivery-point
verification. Those claims require licensed country evidence, source-backed
holdouts, and independently reproducible measurements.
