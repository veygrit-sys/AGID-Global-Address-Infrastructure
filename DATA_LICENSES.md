# AGID Data License Index

Last updated: 2026-09-24

This file is the top-level entry point for AGID data-license handling. It
separates software licensing from geographic, postal, map, trade, carrier,
official-source, and other external datasets.

AGID source code and AGID-owned documentation are governed by the licenses
declared in `LICENSE`, `LICENSE_POLICY.md`, package manifests, or document
front matter. Third-party data is not automatically covered by those licenses.

## Büsingen administrative boundary

The Büsingen subset uses **Federal Office of Topography swisstopo**, swissBOUNDARIES3D
2026-01. The official CH and DE administrative areas were transformed to WGS84
and checked for complete, non-overlapping coverage of the local window.
Display the source credit with this boundary in maps and published or redistributed
data. The source archive, SHA-256 and attribution are recorded in the
[subset](src/data/buesingenBoundary.json). [Official terms of use](https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices)

## Regional coasts and islands

The Natural Earth Map Units and Ocean extracts use the public-domain 1:10m layers from natural-earth-vector v5.1.2. The Pearl River Delta land polygons use the public-domain USGS coastline edition of FieldMaps International ADM0 dated 2025-07-29. The manifests in both extracts record checksums and coverage. [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) · [FieldMaps distributions](https://fieldmaps.io/data/adm0/)

## Worldwide islands and Japanese territorial display

The browser's island extracts use Natural Earth v5.1.2 and the FieldMaps USGS/LSIB public-domain edition. The Japanese shoreline extract is adapted from MLIT National Land Numerical Information, Administrative Areas N03 (2026), under CC BY 4.0. Sources, transformations, checksums and attribution are retained in each extract's manifest. The separately downloadable GSHHG full-resolution geometry is subject to LGPL and includes its license notices. [MLIT N03](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html) · [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) · [FieldMaps](https://fieldmaps.io/data/adm0/) · [High-resolution pack](docs/high-resolution-island-pack.md)

## United States and Canada shoreline extracts

The regional shoreline data and the North Rock survey extract use the following sources. The regional guide describes their coverage and the reproducible build. [US and Canadian shorelines](docs/us-canada-shorelines.md)

| Source | Credit and terms |
| --- | --- |
| GSHHG 2.3.7 full resolution | Paul Wessel and Walter H. F. Smith. GSHHG geometry derivatives, including the generalized-shoreline exclusion in the North Rock extract, are available under the GNU Lesser General Public License. [GSHHG notice](scripts/data/national-island-points/licenses/GSHHG-LICENSE.txt) · [LGPL text](scripts/data/national-island-points/licenses/COPYING.LESSERv3) |
| FieldMaps international USGS/LSIB edition, 2025-07-29 | Public-domain administrative geometry from FieldMaps. [Dataset and source editions](https://fieldmaps.io/data/adm0/) |
| Statistics Canada 2021 Census cartographic boundaries | Adapted from Statistics Canada, 2021 Census Boundary Files, provinces and territories. This does not constitute an endorsement by Statistics Canada of this product. [Statistics Canada Open Licence](https://www.statcan.gc.ca/en/terms-conditions/open-licence) |
| Ontario Hydro Network – Waterbody | Contains information licensed under the [Open Government Licence – Ontario](https://www.ontario.ca/page/open-government-licence-ontario). Ontario Ministry of Natural Resources. [Source layer](https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open01/MapServer/25) |
| Great Lakes Islands (International) | Ontario Ministry of Natural Resources © King’s Printer for Ontario, 2023. Contains information licensed under the Open Government Licence – Ontario. [Dataset](https://geohub.lio.gov.on.ca/datasets/lio::great-lakes-islands-international) · [Licence](https://www.ontario.ca/page/open-government-licence-ontario) |
| TIGER/Line 2025 Area Hydrography | Source: U.S. Census Bureau, 2025 TIGER/Line Shapefiles. The extracts have been modified by AGID. [Area Hydrography](https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/) · [Documentation](https://www.census.gov/programs-surveys/geography/technical-documentation/complete-technical-documentation/tiger-geo-line.html) |
| CanVec 1:50,000 New Brunswick Land and Hydro (2019 release) | Natural Resources Canada. Contains information licensed under the Open Government Licence – Canada. [Land archive](https://ftp.maps.canada.ca/pub/nrcan_rncan/vector/canvec/shp/Land/canvec_50K_NB_Land_shp.zip) · [Hydro archive](https://ftp.maps.canada.ca/pub/nrcan_rncan/vector/canvec/shp/Hydro/canvec_50K_NB_Hydro_shp.zip) · [Licence](https://open.canada.ca/en/open-government-licence-canada/) |

## Canonical Policy

- Detailed policy: `docs/data-licenses.md`
- License split and open-core policy: `LICENSE_POLICY.md`
- Security boundary: `docs/agid-security.md`
- Standard boundary: `docs/agid-standard.md`

## Source Categories

| Category | Handling rule |
| --- | --- |
| OpenStreetMap-derived data | Preserve ODbL attribution and share-alike obligations where applicable. |
| Government open data | Follow each government or agency license, attribution, and redistribution term. |
| Postal authority data and APIs | Use under source terms; do not imply official deliverability unless supported by the source. |
| Open geographic datasets | Preserve license, citation, version, and redistribution limits. |
| Space agency and Earth-observation datasets | Preserve mission, product, and provider terms; do not bundle uncertain data as redistributable. |
| Trade, tariff, customs, and carrier data | Keep terms and allowed-use metadata separate from AGID software. |
| Commercial or restricted sources | Do not bundle into public data packs unless redistribution is explicitly allowed. |

## Address OSS Stack

The operational catalog is defined in
'src/lib/openSourceAddressStack.ts' and explained in
'docs/open-source-address-stack.md'.

| Component | Handling rule |
| --- | --- |
| libpostal | MIT software; keep model and training-data provenance separate. Use only through the loopback-only sidecar for private address text. |
| Photon | Apache-2.0 software; preserve ODbL attribution and obligations for OSM-derived indexes. |
| Pelias | MIT software and an optional self-hosted geocoder; record every imported dataset license independently. |
| Overture Addresses | Treat as a versioned, source-specific, license-gated dataset. Do not treat alpha address IDs as stable AGIDs. |

## Required Manifest Fields

Every redistributable AGID data pack should include a manifest with:

- `source_id`
- `source_name`
- `source_url`
- `provider`
- `coverage_region`
- `license_or_terms`
- `retrieved_at` or `source_version`
- `redistribution_status`
- `allowed_use`
- `transformed_fields`
- `freshness`
- `confidence_notes`

## Default Rule

When license or redistribution status is unclear, the source may be referenced
as an evidence candidate, but it must not be bundled in a redistributable data
pack. In code and manifests, unclear sources should resolve to:

```text
License review required before redistribution
```

This status is compatible with research and source discovery. It is not a claim
that the data can be redistributed.
