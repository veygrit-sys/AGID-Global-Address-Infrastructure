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
| US–Canada digital boundary v1.3, sections 11, 13 and 20 | © International Boundary Commission. Contains information licensed under the Open Government Licence – Canada. AGID uses the cartographic line to locate land on each side of the border. [Dataset](https://www.internationalboundarycommission.org/en/maps-coordinates/coordinates.php) · [Archive with Canadian and US metadata](https://www.internationalboundarycommission.org/uploads/shapefile/us-canada-boundary-v1-3.zip) · [Licence](https://open.canada.ca/en/open-government-licence-canada) |
| National Hydro Network (NHN), work unit 05NFC00 v2.0 | Natural Resources Canada. Contains information licensed under the Open Government Licence – Canada. AGID joins the Metigoshe island pieces along their shared administrative edge and intersects the resulting island and lake polygons with US hydrography. [Dataset](https://open.canada.ca/data/dataset/a4b190fe-e090-4e6d-881e-b87956c07977) · [Work unit archive](https://ftp.maps.canada.ca/pub/nrcan_rncan/vector/geobase_nhn_rhn/shp_en/05/nhn_rhn_05nfc00_shp_en.zip) · [Licence](https://open.canada.ca/en/open-government-licence-canada) |
| National Hydrography Dataset (NHD), Lake Memphremagog and Lake Metigoshe waterbodies | U.S. Geological Survey, U.S. public domain. AGID extracts lake surfaces and island rings from the high-resolution waterbody layer (object IDs 2771880 and 2166435). [Dataset](https://www.usgs.gov/national-hydrography/national-hydrography-dataset) · [Source layer](https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/12) · [USGS terms](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits) |

The Québec Commission de toponymie entry verifies the name and transboundary extent of Île de la Province. The USDA Farm Service Agency’s public-domain National Agriculture Imagery Program imagery from 2019, 2022 and 2023 was consulted to evaluate the northern shallows of Lake Metigoshe. The extract links these verification records and derives its geometry from the three datasets listed above. [Québec gazetteer](https://toponymie.gouv.qc.ca/ct/ToposWeb/Fiche.aspx?no_seq=141213) · [NAIP imagery service and credits](https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer) · [2023 acquisition](https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer/117792)

## Detailed Canadian island extracts

AGID clips official island outlines to the land and water evidence listed in each window. The regional guide identifies the local areas, adaptations and reproduction commands. [Canadian small islands and channels](docs/canadian-small-islands.md)

| Dataset | Credit and terms |
| --- | --- |
| Freshwater Atlas – Islands, marine features | Province of British Columbia, GeoBC. Contains information licensed under the Open Government Licence – British Columbia. [Source](https://open.canada.ca/data/dataset/4483aeea-df26-4b83-a565-934c769e74de) · [Licence](https://www2.gov.bc.ca/gov/content/data/open-data/open-government-licence-bc) |
| Canadian Geographical Names Database | Natural Resources Canada. Contains information licensed under the Open Government Licence – Canada. The extracts retain the version of the selected island geometry in each build script. [Database](https://natural-resources.canada.ca/maps-tools-publications/tools-applications/canadian-geographical-names-database) · [Licence](https://open.canada.ca/en/open-government-licence-canada) |
| CanVec, 1:50,000 hydrographic features | Natural Resources Canada. Contains information licensed under the Open Government Licence – Canada. AGID extracts permanent marine water polygons for the Hudson Bay and James Bay windows. [Source files](https://ftp.maps.canada.ca/pub/nrcan_rncan/vector/canvec/) · [Licence](https://open.canada.ca/en/open-government-licence-canada) |
| ArcticDEM mosaics v4.1 | Porter et al. (2023), Polar Geospatial Center and Byrd Polar and Climate Research Center. AGID compares terrain with nearby marine elevations in two Arctic windows. The dataset is distributed on the AWS Registry of Open Data under CC BY 4.0. [Mosaic dataset](https://doi.org/10.7910/DVN/3VDC4W) · [Registry and licence](https://registry.opendata.aws/pgc-arcticdem/) · [Acknowledgements](https://www.pgc.umn.edu/guides/user-services/acknowledgement-policy/) |
| ADMIN EXPRESS COG, commune 97502 | © IGN France. Selected Saint-Pierre coastal polygons are clipped and intersected with physical land evidence. [Source](https://geoservices.ign.fr/adminexpress) · [Licence Ouverte 2.0](https://www.data.gouv.fr/pages/legal/licences/etalab-2-0) |

The Ontario, International Boundary Commission, Statistics Canada and U.S. Census sources are credited in the United States and Canada table above. The ESA WorldCover and Copernicus DEM credits and terms below also apply to the Canadian extracts that use these products. Each survey records the editions it used.

## United States–Mexico border and Central America

The local geography extracts distinguish land cover, water and administrative boundaries. The [regional guide](docs/mesoamerican-geography.md) lists the sites, source editions and reproduction commands.

| Source | Credit and transformations |
| --- | --- |
| ESA WorldCover 10 m 2020 v100 and 2021 v200 | © ESA WorldCover project 2020 / Contains modified Copernicus Sentinel data (2020) processed by ESA WorldCover consortium. © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium. AGID derives local land and water polygons from selected land-cover classes. Zanaga et al., [2020 dataset](https://doi.org/10.5281/zenodo.5571936) and [2021 dataset](https://doi.org/10.5281/zenodo.7254221). [Product terms](https://esa-worldcover.org/en/data-access) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| FieldMaps International ADM0, USGS coastline / LSIB, 2025-07-29 | FieldMaps, U.S. Department of State, U.S. Geological Survey. Public domain. AGID extracts local country boundaries and clips selected land polygons to physical evidence. [Source and terms for the USGS edition](https://fieldmaps.io/data/adm0/) |
| JRC Global Surface Water occurrence v1.4 (1984–2021) | Source: EC JRC/Google. AGID uses local Landsat water-occurrence pixels to screen land and water classes. Pekel, Cottam, Gorelick & Belward (2016), [High-resolution mapping of global surface water and its long-term changes](https://doi.org/10.1038/nature20584). [Copernicus terms and attribution](https://global-surface-water.appspot.com/download) · [v1.4 product and terms](https://developers.google.com/earth-engine/datasets/catalog/JRC_GSW1_4_GlobalSurfaceWater) |
| Costa Rica COD-AB v01, national boundary | Costa Rica National Statistics Office and UN OCHA FIS/HDX. Boundary geometry from 21 June 2022, reviewed 6 December 2024. AGID intersects the national polygon with the FieldMaps administrative line and land evidence. [HDX dataset](https://data.humdata.org/dataset/cod-ab-cri) · [CC BY 3.0 IGO](https://creativecommons.org/licenses/by/3.0/igo/) |
| USIBWC United States–Mexico International Boundary (US_MexicoIB) | International Boundary and Water Commission, United States and Mexico; National Institute of Geography and Statistics, Mexico; United States Geological Survey. The feature metadata identify this as public-domain information with public use and no access or use constraint. AGID extracts the local cartographic segments to cut the independently mapped land at each crossing. [USIBWC feature source](https://gisserver.ibwc.gov/agsserver/rest/services/USIBWCPublic/US_MexicoIB/FeatureServer/0) · [Layer credits and terms](https://gisserver.ibwc.gov/agsserver/rest/services/USIBWCPublic/US_MexicoIB/FeatureServer/0/metadata) · [Agency GIS information](https://www.ibwc.gov/gis-program/) |
| National Hydrography Dataset (NHD) | U.S. Geological Survey, public domain. AGID extracts local water features for comparison with satellite land-cover classes. [USGS NHD](https://www.usgs.gov/national-hydrography/national-hydrography-dataset) · [USGS copyright and credits](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits) |
| GSHHG 2.3.7, full resolution | Paul Wessel and Walter H. F. Smith. AGID extracts physical island geometry. The derived GSHHG shoreline data are distributed under the GNU Lesser General Public License. [GSHHG](https://www.soest.hawaii.edu/pwessel/gshhg/) · [Source notice](scripts/data/national-island-points/licenses/GSHHG-LICENSE.txt) · [LGPL text](scripts/data/national-island-points/licenses/COPYING.LESSERv3) |

## South American border and island extracts

The regional JSON files include modified ESA WorldCover 2020 v100 and 2021 v200 land-cover pixels converted to local land and water polygons. Country and island geometries also draw on FieldMaps International ADM0 (USGS/LSIB, 2025-07-29) and GSHHG 2.3.7. The Andean extracts and the Fernando de Noronha extract also use JRC Global Surface Water occurrence v1.4 (1984–2021). The credits, release links and redistribution terms for these shared datasets appear in the preceding table. Each extract identifies the source editions and adaptations for its individual windows. [South American coverage, verification and build instructions](docs/south-american-geography.md) · [ESA WorldCover attribution](https://esa-worldcover.org/en/data-access) · [FieldMaps USGS source](https://fieldmaps.io/data/adm0/) · [GSHHG licence](scripts/data/national-island-points/licenses/GSHHG-LICENSE.txt)

The Tabatinga and Santana do Livramento municipal polygons come from the Instituto Brasileiro de Geografia e Estatística (IBGE), Malha Municipal Digital. These polygons are adapted to retain agreement with FieldMaps on dry urban land. IBGE distributes the grid and derived data under a licence compatible with CC BY 4.0 and describes its role as a statistical representation of the boundary. [Municipal grid](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html) · [IBGE usage terms, p. 8](https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102152.pdf) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Argentina’s Instituto Geográfico Nacional (IGN), *Límite internacional*, features 40604 and 40669, supplies the cartographic lines used on Tierra del Fuego and Martín García. The source layer permits use with appropriate credit to the Instituto Geográfico Nacional de la República Argentina. AGID extracts portions of the lines and combines them with physical land polygons. [IGN geoservices](https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/ServiciosOGC) · [Layer metadata and use terms](https://www.ign.gob.ar/capas-sig/metadata/linea_de_limite_FA004.pdf)

The Oyapock bridge exclusion uses the Institut national de l’information géographique et forestière (IGN France) BD TOPO® survey line for *Pont de l’Oyapock*, feature `CONSLINE0000001371313056`, dated 2024-03-13. AGID removes the area around the line from its two-dimensional land and water evidence. Source: IGN, BD TOPO®, Licence Ouverte / Open Licence 2.0. [BD TOPO®](https://geoservices.ign.fr/bdtopo) · [IGN RGE licence metadata](https://www.data.gouv.fr/datasets/referentiel-a-grande-echelle-rge) · [Licence Ouverte 2.0](https://www.data.gouv.fr/pages/legal/licences/etalab-2-0)

Copernicus GLO-30 Public is used in the Fernando de Noronha extract to compare mapped dry land and sea with surface elevation. The resulting polygons are produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30. Redistributions incorporating this extract must retain the notices and meet Article 6 of the GLO-30 Public licence. [Product credits](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM) · [GLO-30-F licence, pp. 22–24](https://dataspace.copernicus.eu/sites/default/files/media/files/2025-06/copernicus_contributing_mission_data_access_v2_cop_dem_licenses.pdf)

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
