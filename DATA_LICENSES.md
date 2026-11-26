# AGID Data License Index

Last updated: 2026-11-26

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

## Europe, the Mediterranean and overseas territories

The European continental and offshore extracts adapt Natural Earth v5.1.2 (public domain), FieldMaps international USGS/LSIB 2025-07-29 (public domain) and GSHHG full resolution 2.3.7, © Paul Wessel and Walter H. F. Smith (LGPL v3 or later). The source geometry transformations and input versions are recorded in the [regional guide](docs/europe-mediterranean-boundaries.md). [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) · [FieldMaps](https://fieldmaps.io/data/adm0/) · [GSHHG notice](scripts/data/national-island-points/licenses/GSHHG-LICENSE.txt) · [LGPL](scripts/data/national-island-points/licenses/COPYING.LESSERv3)

The Bidasoa and Îles du Salut extracts adapt IGN BD TOPO® hydrography, coastal limits, place names and municipal geometry. Source feature identifiers and revision dates are included. © IGN, under Licence Ouverte 2.0. [BD TOPO](https://geoservices.ign.fr/bdtopo) · [Licence Ouverte](https://www.etalab.gouv.fr/licence-ouverte-open-licence/)

The Märket subdivision uses coordinates published in the Finland–Sweden boundary demarcation and a derived dry-ground mask. © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium (CC BY 4.0). The mask selects and erodes the connected land component, then clips it to the administrative outline. [National Land Survey of Finland](https://www.maanmittauslaitos.fi/en/stateboundaries) · [ESA WorldCover data terms](https://esa-worldcover.org/en/data-access)

## Europe-wide frontier atlas

| Dataset | Attribution and reuse |
| --- | --- |
| Boundary lines and country sides | U.S. Department of State LSIB v11.4 of 24 February 2025, FieldMaps USGS/LSIB International of 29 July 2025, Natural Earth v5.1.2. Public-domain editions. Original lines have been quantized and indexed. Original administrative faces were clipped to local tiles. [LSIB](https://geodata.state.gov/geonetwork/srv/api/records/3bdb81a0-c1b9-439a-a0b1-85dac30c59b2) · [FieldMaps](https://fieldmaps.io/data/adm0/) · [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) |
| Neighbour inventory | GeoNames, CC BY 4.0. AGID cross-referenced neighbouring codes and applied the documented territory exceptions. [GeoNames](https://www.geonames.org/export/) · [Code inventory](scripts/data/europe-frontiers/scope.json) |
| Maritime lines | Flanders Marine Institute (2023). Maritime Boundaries Geodatabase, version 12. Selected bilateral lines are indexed with original IDs, designations and cited evidence. [Boundary polylines](https://doi.org/10.14284/632) · [Geodatabase](https://doi.org/10.14284/628) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Treaty coordinates and joint administrative areas | Published coordinates from Canada, the Kingdom of Denmark and Greenland, Article 4 (2022), the French Republic and the Kingdom of the Netherlands, Annex A (2023), and the 2006 Finland–Sweden demarcation. Luxembourg ACT INSPIRE joint territory polygons, CC0. [Tartupaluk](https://www.retsinformation.dk/api/pdf/239124) · [Saint-Martin](https://zoek.officielebekendmakingen.nl/trb-2023-66.html) · [ACT](https://data.public.lu/en/datasets/inspire-annex-i-theme-administrative-units-condominium-2/) |
| Monaco coastline and administrative area | © OpenStreetMap contributors, via Geofabrik, 24 November 2026. The complete adapted Monaco database is separately available under ODbL 1.0. Coastline ways were polygonized and intersected with relation 1124039. [Adapted database](src/data/monaco-osm-shoreline.json) · [Original snapshot](https://download.geofabrik.de/europe/monaco-261124.osm.pbf) · [Attribution](https://www.openstreetmap.org/copyright) · [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) |

The atlas also indexes the national and cadastral extracts credited below, including an indexed copy of the separately downloadable Serbian ODbL line. [Feature provenance](src/data/europe-frontiers/sources.json) · [Scope, transformations and validation](docs/europe-frontier-atlas.md)

## European inland borders and exclaves

The administrative outlines are clipped, reprojected where necessary, rounded to seven decimal places and delta-encoded in distinct JSON files. The runtime compares the two editions at query time. Exact input datasets, retrieval URLs and transformation scripts are listed in the [inland border guide](docs/europe-complex-borders.md).

| Source | Credit and reuse terms |
| --- | --- |
| Vennbahn municipalities and holes | FPS Finance, General Administration of Patrimonial Documentation (GAPD), Belgian CadGIS, CC BY 4.0. The bundled snapshot retains a geometry, municipality key and revision for each of six municipalities. [Official record and terms](https://www.geo.be/catalog/details/63b98ade-71dc-11eb-8bf5-3448ed25ad7c?l=en) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| German state boundary and water surfaces | Land NRW, Geobasis NRW. DVG1 and INSPIRE ATKIS Basis-DLM physical hydrography are distributed under Datenlizenz Deutschland – Zero 2.0. [DVG1](https://www.opengeodata.nrw.de/produkte/geobasis/vkg/dvg/dvg1/) · [WFS terms](https://www.wfs.nrw.de/geobasis/wfs_nw_inspire-gewaesser-physisch_atkis-basis-dlm?SERVICE=WFS&REQUEST=GetCapabilities) · [License](https://www.govdata.de/dl-de/zero-2-0) |
| Austrian and Bavarian cadastral boundaries | © BEV 2026, VGD 2026-04-01, CC BY 4.0, transformed with the BEV GIS-Grid 2021. Datenquelle: Bayerische Vermessungsverwaltung – www.geodaten.bayern.de, ALKIS, CC BY 4.0. [BEV](https://doi.org/10.48677/2d7b8f24-deb9-42eb-82f2-c7c1c7ff7075) · [Bayern](https://www.ldbv.bayern.de/produkte/liegenschaftsinformationen/verwalt_grenzen.html) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Bosnian detached polygon | geoBoundaries gbOpen BIH-ADM0-45210373, Wikimedia Commons, public domain per the release. [Source and license record](https://www.geoboundaries.org/api/current/gbOpen/BIH/ADM0/) |
| Serbian interior ring | © OpenStreetMap contributors, via Wambacher and geoBoundaries gbOpen SRB-ADM0-94879208. The complete separately distributed adapted database is available under ODbL 1.0. [Download the derivative database](src/data/europe-border-surveys/medjurecje-srb.json) · [Source and license record](https://www.geoboundaries.org/api/current/gbOpen/SRB/ADM0/) · [OSM attribution](https://www.openstreetmap.org/copyright) · [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) |
| Water-class masks and other physical layers | © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium, CC BY 4.0. Water pixels were extracted, eroded and vectorized. The GSHHG 2.3.7 layers are distributed under LGPL v3 or later. [ESA terms](https://esa-worldcover.org/en/data-access) · [GSHHG notice](scripts/data/national-island-points/licenses/GSHHG-LICENSE.txt) · [LGPL](scripts/data/national-island-points/licenses/COPYING.LESSERv3) |

## United States and Canada shoreline extracts

The regional shoreline, North Rock and cross-border lake island extracts use the following sources. The regional guide describes their coverage, survey control points and reproducible builds. [US and Canadian shorelines](docs/us-canada-shorelines.md)

| Source | Credit and terms |
| --- | --- |
| GSHHG 2.3.7 full resolution | Paul Wessel and Walter H. F. Smith. GSHHG geometry derivatives, including the generalized-shoreline exclusion in the North Rock extract, are available under the GNU Lesser General Public License. [GSHHG notice](scripts/data/national-island-points/licenses/GSHHG-LICENSE.txt) · [LGPL text](scripts/data/national-island-points/licenses/COPYING.LESSERv3) |
| FieldMaps international USGS/LSIB edition, 2025-07-29 | Public-domain administrative geometry from FieldMaps. [Dataset and source editions](https://fieldmaps.io/data/adm0/) |
| Statistics Canada 2021 Census cartographic boundaries | Adapted from Statistics Canada, 2021 Census Boundary Files, provinces and territories. This does not constitute an endorsement by Statistics Canada of this product. [Statistics Canada Open Licence](https://www.statcan.gc.ca/en/terms-conditions/open-licence) |
| Ontario Hydro Network – Waterbody | Contains information licensed under the [Open Government Licence – Ontario](https://www.ontario.ca/page/open-government-licence-ontario). Ontario Ministry of Natural Resources. [Source layer](https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open01/MapServer/25) |
| Great Lakes Islands (International) | Ontario Ministry of Natural Resources © King’s Printer for Ontario, 2023. Contains information licensed under the Open Government Licence – Ontario. [Dataset](https://geohub.lio.gov.on.ca/datasets/lio::great-lakes-islands-international) · [Licence](https://www.ontario.ca/page/open-government-licence-ontario) |
| TIGER/Line 2025 Area Hydrography | Source: U.S. Census Bureau, 2025 TIGER/Line Shapefiles. The extracts have been modified by AGID. [Area Hydrography](https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/) · [Documentation](https://www.census.gov/programs-surveys/geography/technical-documentation/complete-technical-documentation/tiger-geo-line.html) |
| CanVec 1:50,000 New Brunswick Land and Hydro (2019 release) | Natural Resources Canada. Contains information licensed under the Open Government Licence – Canada. [Land archive](https://ftp.maps.canada.ca/pub/nrcan_rncan/vector/canvec/shp/Land/canvec_50K_NB_Land_shp.zip) · [Hydro archive](https://ftp.maps.canada.ca/pub/nrcan_rncan/vector/canvec/shp/Hydro/canvec_50K_NB_Hydro_shp.zip) · [Licence](https://open.canada.ca/en/open-government-licence-canada/) |
| US–Canada digital boundary v1.3, sections 11 and 20 | © International Boundary Commission. Contains information licensed under the Open Government Licence – Canada. AGID extracts these two sections and uses the cartographic line to divide mapped island land. [Dataset](https://www.internationalboundarycommission.org/en/maps-coordinates/coordinates.php) · [Archive with Canadian and US metadata](https://www.internationalboundarycommission.org/uploads/shapefile/us-canada-boundary-v1-3.zip) · [Licence](https://open.canada.ca/en/open-government-licence-canada) |
| National Hydro Network (NHN), work unit 05NFC00 v2.0 | Natural Resources Canada. Contains information licensed under the Open Government Licence – Canada. AGID joins the Metigoshe island pieces along their shared administrative edge and intersects the resulting island and lake polygons with US hydrography. [Dataset](https://open.canada.ca/data/dataset/a4b190fe-e090-4e6d-881e-b87956c07977) · [Work unit archive](https://ftp.maps.canada.ca/pub/nrcan_rncan/vector/geobase_nhn_rhn/shp_en/05/nhn_rhn_05nfc00_shp_en.zip) · [Licence](https://open.canada.ca/en/open-government-licence-canada) |
| National Hydrography Dataset (NHD), Lake Memphremagog and Lake Metigoshe waterbodies | U.S. Geological Survey, U.S. public domain. AGID extracts lake surfaces and island rings from the high-resolution waterbody layer (object IDs 2771880 and 2166435). [Dataset](https://www.usgs.gov/national-hydrography/national-hydrography-dataset) · [Source layer](https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/12) · [USGS terms](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits) |

The Québec Commission de toponymie entry verifies the name and transboundary extent of Île de la Province. The USDA Farm Service Agency’s public-domain National Agriculture Imagery Program imagery from 2019, 2022 and 2023 was consulted to evaluate the northern shallows of Lake Metigoshe. The extract links these verification records and derives its geometry from the three datasets listed above. [Québec gazetteer](https://toponymie.gouv.qc.ca/ct/ToposWeb/Fiche.aspx?no_seq=141213) · [NAIP imagery service and credits](https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer) · [2023 acquisition](https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer/117792)

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
