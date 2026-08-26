import {
POLAR_OPEN_GEO_SOURCES,
getPolarOpenSourceIds,
type PolarOpenGeoSourceId,
} from './polarOpenGeoSources';

export type AmericasOpenGeoSourceId =
  | PolarOpenGeoSourceId
  | 'osm-nominatim'
  | 'osm-overpass'
  | 'openaddresses'
  | 'geonames-postal'
  | 'geonames-gazetteer'
  | 'geoboundaries'
  | 'upu-addressing'
  | 'copernicus-dem'
  | 'copernicus-corine-land-cover'
  | 'emodnet-bathymetry'
  | 'emodnet-seabed-habitats'
  | 'eea-natura-2000'
  | 'eea-eunis-habitats'
  | 'jrc-esdac-soils'
  | 'usps-web-tools'
  | 'usps-ais-products'
  | 'usps-publication-28-2024'
  | 'usps-zip-code-lookup'
  | 'us-census-zcta-2020'
  | 'us-census-tiger-line'
  | 'us-census-geocoder'
  | 'usdot-national-address-database'
  | 'usgs-national-structures-dataset'
  | 'hud-usps-zip-crosswalk'
  | 'osm-united-states'
  | 'correo-argentino-cpa'
  | 'ign-argentina-geospatial'
  | 'idera-argentina'
  | 'argentina-cadastre-law-26209'
  | 'osm-argentina'
  | 'correo-uruguayo-postal-polygons'
  | 'correo-uruguayo-address-services'
  | 'ide-uy-addresses'
  | 'dnc-uy-parcels'
  | 'osm-uruguay'
  | 'zippopotam'
  | 'canada-post-postal'
  | 'canada-post-addresscomplete'
  | 'canada-post-licensed-postal-data'
  | 'statcan-pccf-licensed'
  | 'statcan-census-fsa-2021'
  | 'statcan-national-address-register'
  | 'statcan-open-database-buildings'
  | 'osm-canada'
  | 'correos-cuba-postal'
  | 'upu-cuba-addressing-2004'
  | 'upu-cuba-postcode-data'
  | 'mincom-cuba-postal-law'
  | 'iderc-cuba-geoportal'
  | 'onei-cuba-dpa'
  | 'geocuba-cartography'
  | 'osm-cuba'
  | 'correos-mexico'
  | 'sepomex-postal-polygons-2025'
  | 'mexico-postal-service-law'
  | 'upu-mexico-addressing-2017'
  | 'inegi-mexico-geo-key-service'
  | 'inegi-mexico-geostatistical-framework-2025'
  | 'inegi-mexico-address-standard-2024'
  | 'inegi-mexico-denue-2025'
  | 'osm-mexico'
  | 'office-postes-haiti-postcode-search'
  | 'upu-haiti-addressing-2017'
  | 'ihsi-haiti-territorial-codes'
  | 'ihsi-haiti-admin-2024'
  | 'cnigs-haiti-reference-geodata'
  | 'osm-haiti'
  | 'correos-panama-postal-system-2026'
  | 'panama-postal-code-api-2026'
  | 'upu-panama-addressing-2015'
  | 'inec-panama-territorial-coding'
  | 'ign-panama-dpa-2025'
  | 'osm-panama'
  | 'correos-cr-postal'
  | 'upu-costa-rica-addressing-2009'
  | 'upu-costa-rica-address-policy-case-study'
  | 'inec-cr-geographic-classification'
  | 'inec-cr-uged-2024'
  | 'snit-cr'
  | 'snit-cr-terms'
  | 'osm-costa-rica'
  | 'correos-nicaragua-postcode-search'
  | 'upu-nicaragua-addressing-2014'
  | 'inide-nicaragua-territorial-2023'
  | 'ineter-ni-ide'
  | 'ineter-nicaragua-cartographic-base'
  | 'ineter-nicaragua-cadastral-ide'
  | 'osm-nicaragua'
  | 'correos-guatemala-postal'
  | 'correos-guatemala-postcode-directory'
  | 'upu-guatemala-addressing-2025'
  | 'correos-guatemala-postal-legal-framework'
  | 'segeplan-gt-ide'
  | 'ine-guatemala-census-settlements'
  | 'ign-guatemala-cartography'
  | 'ric-guatemala-cadastre'
  | 'osm-guatemala'
  | 'belize-statistical-institute'
  | 'data-gouv-fr-postcodes'
  | 'la-poste-fr-overseas'
  | 'postnord-greenland'
  | 'falkland-islands-post'
  | 'falkland-islands-gis'
  | 'british-overseas-postal-reference'
  | 'anguilla-post'
  | 'anguilla-gov-gis'
  | 'bermuda-post'
  | 'bermuda-gov-maps'
  | 'bvi-post'
  | 'bvi-gis'
  | 'cayman-post'
  | 'cayman-lands-survey'
  | 'montserrat-post'
  | 'montserrat-gis'
  | 'turks-caicos-post'
  | 'turks-caicos-gis'
  | 'south-georgia-gis'
  | 'correios-cep-api'
  | 'correios-dne-licensing'
  | 'upu-brazil-addressing'
  | 'ibge-cnefe-2022'
  | 'ibge-municipal-mesh-2024'
  | 'ibge-cartographic-base-2023'
  | 'inde-brazil'
  | 'osm-brazil'
  | 'viacep-br'
  | 'brasilapi'
  | 'ipostel-venezuela-postcode-lookup'
  | 'upu-venezuela-addressing-2019'
  | 'ine-venezuela-populated-places-2001'
  | 'igvsb-venezuela-geographic-authority'
  | 'venezuela-geography-cartography-cadastre-law-2000'
  | 'osm-venezuela'
  | 'georef-ar'
  | 'geoportal-cl'
  | 'correos-chile-postcode-lookup'
  | 'correos-chile-normalization-api'
  | 'upu-chile-addressing-2017'
  | 'ide-chile-dpa-2023'
  | 'subdere-chile-cut'
  | 'ine-chile-open-geodata'
  | 'sii-chile-digital-cadastre'
  | 'osm-chile'
  | 'inposdom-postcode-search'
  | 'upu-dominican-republic-addressing-2005'
  | 'one-dominican-territorial-division-2021'
  | 'iderd-dominican-geoservices'
  | 'ign-dominican-cartographic-base'
  | 'registro-inmobiliario-dominican-cadastre'
  | 'osm-dominican-republic'
  | 'colombia-en-mapas'
  | 'codigo-postal-colombia-472-viewer'
  | 'codigo-postal-colombia-csv'
  | 'codigo-postal-colombia-shapefile'
  | 'codigo-postal-colombia-open-license'
  | 'codigo-postal-colombia-arcgis'
  | 'upu-colombia-addressing-2022'
  | 'upu-colombia-s42-2021'
  | 'dane-colombia-divipola-mgn-2025'
  | 'igac-colombia-open-cadastre'
  | 'igac-colombia-sinic-open-constructions'
  | 'osm-colombia'
  | 'mtc-peru-postcode-lookup'
  | 'mtc-peru-postcode-open-data-2018'
  | 'mtc-peru-cpn-legal-2011'
  | 'mtc-peru-cpn-structure-2017'
  | 'upu-peru-designated-operator'
  | 'inei-peru-ubigeo-2022'
  | 'ign-peru-open-boundaries-settlements'
  | 'geo-vivienda-pe'
  | 'cofopri-peru-geo-llaqta'
  | 'osm-peru'
  | 'codigo-postal-ec'
  | 'codigo-postal-ec-technical-standard'
  | 'dinarp-ecuador-postal-interoperability'
  | 'inec-ecuador-census-cartography'
  | 'igm-ecuador-base-cartography'
  | 'sistema-nacional-catastro-ecuador'
  | 'osm-ecuador'
  | 'correos-el-salvador'
  | 'upu-el-salvador-addressing-2019'
  | 'cnr-el-salvador-geographic-codes'
  | 'onec-el-salvador-geographic-catalog'
  | 'cnr-el-salvador-cadastre'
  | 'osm-el-salvador'
  | 'ide-uy'
  | 'ide-py'
  | 'noaa-etopo'
  | 'geobc-global-multi-resolution-topography'
  | 'hydrosheds'
  | 'protected-planet-wdpa'
  | 'gbif-occurrence'
  | 'esa-worldcover'
  | 'usgs-3dep'
  | 'nrcan-geospatial'
  | 'conabio-geoportal'
  | 'ibge-geosciences'
  | 'inpe-terrabrasilis';

export interface AmericasOpenGeoSource {
  id: AmericasOpenGeoSourceId;
  name: string;
  url: string;
  kind:
    | 'postal-code'
    | 'address'
    | 'geocoding'
    | 'admin-boundary'
    | 'gazetteer'
    | 'standard'
    | 'statistics'
    | 'elevation'
    | 'marine'
    | 'hydrology'
    | 'facility'
    | 'protected-area'
    | 'biodiversity'
    | 'land-cover'
    | 'environment'
    | 'data-catalog'
    | 'bathymetry'
    | 'cryosphere'
    | 'topography'
    | 'cadastre';
  coverage: 'global' | 'americas' | 'country' | 'territory' | 'polar' | 'antarctic' | 'arctic' | 'greenland';
  usage: 'primary' | 'fallback' | 'validation' | 'reference';
  license?: string;
  notes: string;
}

export const AMERICAS_OPEN_GEO_SOURCES: Record<AmericasOpenGeoSourceId, AmericasOpenGeoSource> = {
  ...POLAR_OPEN_GEO_SOURCES,
  'osm-nominatim': {
    id: 'osm-nominatim',
    name: 'OpenStreetMap Nominatim',
    url: 'https://nominatim.org/release-docs/latest/api/Overview/',
    kind: 'geocoding',
    coverage: 'global',
    usage: 'fallback',
    license: 'ODbL',
    notes: 'Open geocoding and reverse geocoding for address display and fallback lookup.',
  },
  'osm-overpass': {
    id: 'osm-overpass',
    name: 'OpenStreetMap Overpass API',
    url: 'https://overpass-api.de/',
    kind: 'address',
    coverage: 'global',
    usage: 'reference',
    license: 'ODbL',
    notes: 'Queryable OSM address tags, roads, settlements, and administrative relations.',
  },
  openaddresses: {
    id: 'openaddresses',
    name: 'OpenAddresses',
    url: 'https://openaddresses.io/',
    kind: 'address',
    coverage: 'global',
    usage: 'validation',
    license: 'Varies by source dataset',
    notes: 'Address point and street-address reference data where official sources are indexed.',
  },
  'geonames-postal': {
    id: 'geonames-postal',
    name: 'GeoNames Postal Code Data',
    url: 'https://download.geonames.org/export/zip/',
    kind: 'postal-code',
    coverage: 'global',
    usage: 'validation',
    license: 'CC BY 4.0',
    notes: 'Postal-code to locality matching for countries with downloadable GeoNames ZIP datasets.',
  },
  'geonames-gazetteer': {
    id: 'geonames-gazetteer',
    name: 'GeoNames Gazetteer',
    url: 'https://download.geonames.org/export/dump/',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    license: 'CC BY 4.0',
    notes: 'Settlement names, alternate names, coordinates, and administrative hierarchy reference.',
  },
  geoboundaries: {
    id: 'geoboundaries',
    name: 'geoBoundaries',
    url: 'https://www.geoboundaries.org/',
    kind: 'admin-boundary',
    coverage: 'global',
    usage: 'reference',
    license: 'CC BY 4.0',
    notes: 'Open administrative boundaries for state, province, department, municipality, parish, and district checks.',
  },
  'upu-addressing': {
    id: 'upu-addressing',
    name: 'UPU Addressing Solutions',
    url: 'https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions',
    kind: 'standard',
    coverage: 'global',
    usage: 'reference',
    notes: 'Postal addressing-system reference for country-level delivery conventions.',
  },
  'copernicus-dem': {
    id: 'copernicus-dem',
    name: 'Copernicus DEM',
    url: 'https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM.html',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    notes: 'Open elevation and mountain terrain reference used by European-linked territories for altitude, slope, ridge, valley, and natural-address context.',
  },
  'copernicus-corine-land-cover': {
    id: 'copernicus-corine-land-cover',
    name: 'Copernicus CORINE Land Cover',
    url: 'https://land.copernicus.eu/en/products/corine-land-cover',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'European land cover reference for French, Danish, Dutch, and UK-linked territories that are also represented in Americas metadata.',
  },
  'emodnet-bathymetry': {
    id: 'emodnet-bathymetry',
    name: 'EMODnet Bathymetry',
    url: 'https://emodnet.ec.europa.eu/en/bathymetry',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Marine bathymetry and coastline reference for European-linked Atlantic, Caribbean, Arctic, and overseas territory context.',
  },
  'emodnet-seabed-habitats': {
    id: 'emodnet-seabed-habitats',
    name: 'EMODnet Seabed Habitats',
    url: 'https://emodnet.ec.europa.eu/en/seabed-habitats',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Marine habitat and seabed environment reference for European-linked coastal, island, and offshore territory context.',
  },
  'eea-natura-2000': {
    id: 'eea-natura-2000',
    name: 'EEA Natura 2000 Protected Areas',
    url: 'https://www.eea.europa.eu/data-and-maps/data/natura-2',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'European protected natural areas source used when European overseas or autonomous territories share address metadata with Americas coverage.',
  },
  'eea-eunis-habitats': {
    id: 'eea-eunis-habitats',
    name: 'EEA EUNIS Habitat Classification',
    url: 'https://eunis.eea.europa.eu/habitats',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'European habitat classification for terrestrial, freshwater, and marine natural contexts in overlapping territory records.',
  },
  'jrc-esdac-soils': {
    id: 'jrc-esdac-soils',
    name: 'JRC European Soil Data Centre',
    url: 'https://data.jrc.ec.europa.eu/collection/ESDAC',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'European soil and terrain source for natural geography context in overlapping European-linked territory records.',
  },
  'usps-web-tools': {
    id: 'usps-web-tools', name: 'USPS Addresses 3.0 APIs', url: 'https://developers.usps.com/apis',
    kind: 'address', coverage: 'country', usage: 'primary',
    notes: 'OAuth-protected USPS address standardization and ZIP/ZIP+4 delivery-point context. Credentials, request addresses, and responses are never bundled; a result does not prove an occupant or building footprint.',
  },
  'usps-ais-products': {
    id: 'usps-ais-products', name: 'USPS Address Information System Products', url: 'https://postalpro.usps.com/address-quality-solutions',
    kind: 'postal-code', coverage: 'country', usage: 'primary',
    notes: 'Licensed monthly City State, ZIP+4, Five-Digit ZIP, Carrier Route, and delivery-statistics products. They describe delivery objects and assignments, not open reusable polygons or address-building links.',
  },
  'usps-publication-28-2024': {
    id: 'usps-publication-28-2024', name: 'USPS Publication 28, October 2024', url: 'https://pe.usps.com/text/pub28/',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Official postal-addressing format guidance for delivery lines, secondary units, rural and highway-contract routes, general delivery, PO Boxes, Puerto Rico, and military mail; not a redistributable address or geometry dataset.',
  },
  'usps-zip-code-lookup': {
    id: 'usps-zip-code-lookup', name: 'USPS ZIP Code Lookup', url: 'https://tools.usps.com/zip-code-lookup.htm',
    kind: 'postal-code', coverage: 'country', usage: 'primary',
    notes: 'Official interactive address, City/State, and ZIP lookup. Results are transient validation evidence and USPS explicitly does not confirm that a person or company is at an address.',
  },
  'us-census-zcta-2020': {
    id: 'us-census-zcta-2020', name: 'U.S. Census ZIP Code Tabulation Areas', url: 'https://www.census.gov/programs-surveys/geography/guidance/geo-areas/zctas.html',
    kind: 'admin-boundary', coverage: 'country', usage: 'validation', license: 'U.S. public domain; exact release metadata required',
    notes: 'Generalized statistical block-based representations of some USPS ZIP Codes. ZCTAs are not USPS delivery boundaries, do not represent every valid ZIP, and cannot disclose Title 13 protected address locations.',
  },
  'us-census-tiger-line': {
    id: 'us-census-tiger-line', name: 'U.S. Census TIGER/Line', url: 'https://www.census.gov/programs-surveys/geography/technical-documentation/complete-technical-documentation/tiger-geo-line.html',
    kind: 'admin-boundary', coverage: 'country', usage: 'validation', license: 'U.S. public domain; exact release metadata required',
    notes: 'Official statistical geography and address-range context. TIGER/Line does not determine legal ownership, jurisdiction, USPS delivery assignment, or exact building membership.',
  },
  'us-census-geocoder': {
    id: 'us-census-geocoder', name: 'U.S. Census Geocoder', url: 'https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html',
    kind: 'geocoding', coverage: 'country', usage: 'validation',
    notes: 'Public MAF/TIGER-based address-to-coordinate and geography evidence. It is not USPS delivery validation, occupant proof, a building footprint, or an automatic address-building relation.',
  },
  'usdot-national-address-database': {
    id: 'usdot-national-address-database', name: 'USDOT National Address Database', url: 'https://catalog.data.gov/dataset/national-address-database-nad',
    kind: 'address', coverage: 'country', usage: 'validation', license: 'Artifact-specific; catalog metadata reports CC0 with access and rights restrictions',
    notes: 'Provider-dependent address-point compilation. Pin the exact release, contributing jurisdiction, field provenance, disclaimer, access class, rights and digest; a point is not a USPS assignment or building footprint.',
  },
  'usgs-national-structures-dataset': {
    id: 'usgs-national-structures-dataset', name: 'USGS National Structures Dataset', url: 'https://data.usgs.gov/datacatalog/data/USGS:db4fb1b6-1282-4e5b-9866-87a68912c5d1',
    kind: 'facility', coverage: 'country', usage: 'validation', license: 'U.S. public domain; exact layer provenance required',
    notes: 'Selected structure points and preliminary building polygons. Coverage and feature purpose vary; no civic-address, USPS delivery, parcel, owner, occupant, or comprehensive-building relation is implied.',
  },
  'hud-usps-zip-crosswalk': {
    id: 'hud-usps-zip-crosswalk', name: 'HUD USPS ZIP Code Crosswalk', url: 'https://www.huduser.gov/portal/dataset/uspszip-api.html',
    kind: 'statistics', coverage: 'country', usage: 'validation',
    notes: 'Derived ZIP-to-geography allocation ratios for analysis. It is not a USPS delivery polygon, delivery-point validator, civic address, or building relation.',
  },
  'osm-united-states': {
    id: 'osm-united-states', name: 'OpenStreetMap United States', url: 'https://wiki.openstreetmap.org/wiki/United_States',
    kind: 'address', coverage: 'country', usage: 'validation', license: 'ODbL',
    notes: 'Community road, address and building validation kept in an ODbL provenance partition. It is not USPS authority, cadastral authority, occupant proof, or an automatic address-building join.',
  },
  zippopotam: {
    id: 'zippopotam',
    name: 'Zippopotam.us',
    url: 'https://api.zippopotam.us/',
    kind: 'postal-code',
    coverage: 'global',
    usage: 'fallback',
    notes: 'Free postal-code lookup API useful for countries and territories with public coverage.',
  },
  'canada-post-postal': {
    id: 'canada-post-postal',
    name: 'Canada Post postal-code structure and lookup',
    url: 'https://www.canadapost-postescanada.ca/cpc/en/support/articles/addressing-guidelines/postal-codes.page',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public official guidance and lookup; not a bulk assignment or geometry data licence',
    notes: 'Canada Post defines the FSA and LDU and explains that a full code can represent a block face, single building, large-volume receiver or rural community. Public guidance or lookup observations are time-bound reference evidence, not bundled bulk assignments, universal polygons, building footprints or delivery entitlement.',
  },
  'canada-post-addresscomplete': {
    id: 'canada-post-addresscomplete',
    name: 'Canada Post AddressComplete API',
    url: 'https://www.canadapost-postescanada.ca/ac/support/api/',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'Authenticated service under Canada Post AddressComplete account and EULA terms',
    notes: 'Official Find and Retrieve service requires an API key and returns formatted address details. A response is a time-bound address observation, not a reusable postal polygon, building footprint, occupant identity or automatic address-building relation.',
  },
  'canada-post-licensed-postal-data': {
    id: 'canada-post-licensed-postal-data',
    name: 'Canada Post licensed postal data products',
    url: 'https://www.canadapost-postescanada.ca/cpc/en/commercial/data-solutions/license-data.page',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Commercial licence; product, purpose, transfer, retention and redistribution specific',
    notes: 'Licensed monthly products include full postal-code address ranges, delivery data and postal-code coordinates. They can provide assignment evidence under an exact contract and release, but coordinates or ranges are not blanket official full-code polygons and licensed rows cannot be republished here.',
  },
  'statcan-pccf-licensed': {
    id: 'statcan-pccf-licensed',
    name: 'Statistics Canada Postal Code Conversion File',
    url: 'https://www.statcan.gc.ca/en/microdata/dli/application/section1/section_i-postal_codemo_coversion_file_pccf_access.pdf',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'reference',
    license: 'Non-transferable purpose-limited PCCF licence including Canada Post intellectual property',
    notes: 'PCCF links postal codes to census geography and coordinates but the licence requires a disclaimer that it does not validate postal codes. Distribution and external derived services are restricted; a crosswalk or coordinate is not a postal boundary, exact address-building relation or delivery entitlement.',
  },
  'statcan-census-fsa-2021': {
    id: 'statcan-census-fsa-2021',
    name: 'Statistics Canada 2021 Census Forward Sortation Area Boundary File',
    url: 'https://www150.statcan.gc.ca/n1/pub/92-179-g/92-179-g2021001-eng.htm',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    license: 'Official-derived public census release with Canada Post acknowledgement; exact terms apply',
    notes: 'CFSA polygons are derived from respondent-reported postal codes and dissemination areas and are not necessarily equivalent to Canada Post FSA geography. The 2021 product supplies census reference geometry, not current assignment validation, LDU geometry, full-code polygons, addresses or buildings.',
  },
  'statcan-national-address-register': {
    id: 'statcan-national-address-register',
    name: 'Statistics Canada National Address Register',
    url: 'https://www150.statcan.gc.ca/n1/en/catalogue/46260002',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'Statistics Canada Open Licence with provider-specific acknowledgements',
    notes: 'The versioned NAR publishes non-confidential georeferenced civic addresses with addressId and locationId fields and mailing context. It does not prove Canada Post delivery entitlement, an occupant or organization, full provider coverage or an automatic link to a building footprint.',
  },
  'statcan-open-database-buildings': {
    id: 'statcan-open-database-buildings',
    name: 'Statistics Canada Open Database of Buildings',
    url: 'https://www150.statcan.gc.ca/n1/en/catalogue/34260001',
    kind: 'facility',
    coverage: 'country',
    usage: 'validation',
    license: 'Open Government Licence - Canada; contributing provider and release specific',
    notes: 'The ODB harmonizes government building footprints, but current coverage is incomplete and provider quality varies. Footprints are not postal assignments, address points, units, occupants or exact address-building relations without an explicit stable cross-key.',
  },
  'osm-canada': {
    id: 'osm-canada',
    name: 'OpenStreetMap Canada',
    url: 'https://wiki.openstreetmap.org/wiki/Canada',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separate ODbL provenance partition and are not Canada Post, Statistics Canada, provincial, territorial, municipal, cadastral, occupant or exact address-building authority.',
  },
  'correos-cuba-postal': {
    id: 'correos-cuba-postal',
    name: 'Grupo Empresarial Correos de Cuba',
    url: 'https://www.correos.cu/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public operator website; no reusable bulk-data licence identified',
    notes: 'UPU identifies Grupo Empresarial Correos de Cuba as the designated operator. Use only pinned operator observations or licensed data; the website and a syntactically valid five-digit value are not reusable nationwide assignments, polygons, addresses or delivery entitlement.',
  },
  'upu-cuba-addressing-2004': {
    id: 'upu-cuba-addressing-2004',
    name: 'UPU Cuba postal addressing sheet (2004)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/cubEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; dated reference, not a bulk-data licence',
    notes: 'The dated UPU sheet documents five digits, CP before the code, postal-zone context, cross streets, s/n and P.O. Box examples. It does not provide current assignments, reusable full-code geometry, address points or buildings.',
  },
  'upu-cuba-postcode-data': {
    id: 'upu-cuba-postcode-data',
    name: 'UPU POST*CODE database and Address Verification API - Cuba scope',
    url: 'https://www.upu.int/en/Postal-Solutions/Technical-Solutions/Products/POST-CODE-and-Locality-Lookups',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'UPU contract, non-disclosure agreement and data-use declaration; release specific',
    notes: 'Current UPU lookup and licensed data may validate structure, locality and postcode observations. Pin contract, release and API terms; no licensed row or response is bundled, and a lookup result is not postal geometry or an exact address-building relation.',
  },
  'mincom-cuba-postal-law': {
    id: 'mincom-cuba-postal-law',
    name: 'Cuba Decreto-Ley 30 postal-services framework',
    url: 'https://www.granma.cu/cuba/2021-12-19/en-vivo-continuan-los-debates-previos-a-la-sesion-ordinaria',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Official legal and institutional reference; not postal reference data',
    notes: 'The 2021 framework identifies the universal postal service and Correos de Cuba as designated operator and records that code dissemination and updating remained work items. It is legal context, not a postcode dataset, geometry release or address register.',
  },
  'iderc-cuba-geoportal': {
    id: 'iderc-cuba-geoportal',
    name: 'IDERC Cuba geospatial portal',
    url: 'http://www.iderc.cu/',
    kind: 'data-catalog',
    coverage: 'country',
    usage: 'reference',
    license: 'Layer-specific rights and access terms must be pinned; catalog access is not an open-data licence',
    notes: 'National SDI metadata and OGC services can provide named-place, administrative and cartographic context. Every layer needs producer, scale, CRS, vintage, access and reuse terms; catalog availability is not postal assignment, official postal geometry, civic address or building authority.',
  },
  'onei-cuba-dpa': {
    id: 'onei-cuba-dpa',
    name: 'ONEI Cuba political-administrative and settlement statistics',
    url: 'https://www.onei.gob.cu/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    license: 'Official publication terms; table and edition specific',
    notes: 'ONEI province, municipality, settlement and statistical identifiers support administrative context only. Pin the exact edition and code list; statistical identity or a boundary is not a Correos postal assignment, delivery route, address point or building relation.',
  },
  'geocuba-cartography': {
    id: 'geocuba-cartography',
    name: 'GEOCUBA cartographic and geomatics products',
    url: 'https://www.geocuba.cu/',
    kind: 'topography',
    coverage: 'country',
    usage: 'reference',
    license: 'Product, contract and redistribution terms must be pinned',
    notes: 'Official cartographic, urban, cadastral or building context may be product- and contract-specific. Do not treat portal visibility, rendered tiles, containment or proximity as an open licence, postal assignment, civic-address register or exact address-building relation.',
  },
  'osm-cuba': {
    id: 'osm-cuba',
    name: 'OpenStreetMap Cuba',
    url: 'https://wiki.openstreetmap.org/wiki/Cuba',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Community roads, between-street descriptions, addresses and buildings stay in a separate ODbL partition and are not Correos, UPU, MINCOM, ONEI, IDERC, GEOCUBA, cadastral, occupant or exact address-building authority.',
  },
  'office-postes-haiti-postcode-search': {
    id: 'office-postes-haiti-postcode-search', name: 'Office des Postes d’Haïti postcode search', url: 'https://laposte.gouv.ht/codes.php',
    kind: 'postal-code', coverage: 'country', usage: 'primary', license: 'Public operator lookup; observation, cache, automation and redistribution terms must be confirmed',
    notes: 'UPU links this designated-operator lookup. It can support a pinned time-bound HT plus four digits assignment observation when available; syntax or a response is not a bulk catalogue, polygon release, civic-address corpus, building relation or delivery entitlement.',
  },
  'upu-haiti-addressing-2017': {
    id: 'upu-haiti-addressing-2017', name: 'UPU Haiti addressing sheet, September 2017', url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/HTIEn.pdf',
    kind: 'standard', coverage: 'country', usage: 'reference', license: 'UPU publication terms; not a bulk postcode or geometry licence',
    notes: 'Documents HT plus four digits as the integral postcode even for domestic mail and describes department, arrondissement, commune and delivery area digits. It provides dated examples, not current nationwide assignments, reusable geometry, real addresses or building evidence.',
  },
  'ihsi-haiti-territorial-codes': {
    id: 'ihsi-haiti-territorial-codes', name: 'IHSI territorial coding manual and hierarchy', url: 'https://ihsi.gouv.ht/statistiques/statistiques_demographiques_et_sociales/gouvernance_et_autres_activites_communautaires',
    kind: 'gazetteer', coverage: 'country', usage: 'reference', license: 'Exact manual, edition and resource-level reuse terms must be pinned',
    notes: 'Official six-digit territorial codes identify department, arrondissement, commune and communal section, town or quarter. This administrative/statistical hierarchy remains separate from Office des Postes HTNNNN assignment and postal geometry.',
  },
  'ihsi-haiti-admin-2024': {
    id: 'ihsi-haiti-admin-2024', name: 'IHSI 2024 disaggregated population and administrative divisions', url: 'https://ihsi.gouv.ht/public/storage/document-views/March2025/Oan4m17p5LEKtsGEnHgt.pdf',
    kind: 'statistics', coverage: 'country', usage: 'reference', license: 'IHSI publication terms; machine-readable-resource permission must be confirmed separately',
    notes: 'Official 2024 context records 10 departments and the evolving arrondissement, commune, quarter and communal-section structure. It is administrative/statistical context, not postal assignment, operator geometry, a civic-address register or building relation.',
  },
  'cnigs-haiti-reference-geodata': {
    id: 'cnigs-haiti-reference-geodata', name: 'CNIGS Haiti reference geospatial information', url: 'https://cnigs.ht/',
    kind: 'admin-boundary', coverage: 'country', usage: 'reference', license: 'Exact CNIGS resource permission, attribution, edition, schema, CRS and digest required',
    notes: 'CNIGS is the public reference-geodata authority and produces administrative boundaries and toponymy. A specific authorized resource can support independent context or a reviewed derived surface; it is not operator postal assignment or official postal geometry without an explicit crosswalk and source authority.',
  },
  'osm-haiti': {
    id: 'osm-haiti', name: 'OpenStreetMap Haiti', url: 'https://wiki.openstreetmap.org/wiki/Haiti',
    kind: 'address', coverage: 'country', usage: 'validation', license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separate ODbL provenance partition and are not Office des Postes, UPU, IHSI, CNIGS, cadastral, owner, occupant or exact address-building authority.',
  },
  'correos-panama-postal-system-2026': {
    id: 'correos-panama-postal-system-2026', name: 'Correos Panama national geolocated postcode launch, May 2026', url: 'https://www.correospanama.gob.pa/panama-da-un-paso-firme-hacia-la-modernizacion-con-el-nuevo-sistema-de-codigos-postales/',
    kind: 'standard', coverage: 'country', usage: 'reference', license: 'Public official announcement; underlying system, API, automation, cache and redistribution terms must be pinned separately',
    notes: 'Correos Panama states that the national system launched on 7 May 2026 with COTEL, INEC, AIG and ANATI participation and geolocates homes, buildings and points. The announcement is system and temporal evidence, not a bulk assignment table, reusable geometry licence, civic-address corpus or exact building relation.',
  },
  'panama-postal-code-api-2026': {
    id: 'panama-postal-code-api-2026', name: 'Sistema de Codigos Postales de Panama public lookup and decoder', url: 'https://codigospostalespanama.gob.pa/',
    kind: 'postal-code', coverage: 'country', usage: 'primary', license: 'Free public lookup; API contract, rate, cache, automation and redistribution terms are not an open bulk-data licence',
    notes: 'The official portal accepts a full two-character estafeta prefix plus eight-character grid and also an eight-character grid alone. A successful pinned response can provide full code, postal zone, estafeta, administrative hierarchy and PICO grid-cell observation; it does not publish a reusable nationwide postal-zone polygon release, stable civic-address ID, building ID, occupant or delivery entitlement.',
  },
  'upu-panama-addressing-2015': {
    id: 'upu-panama-addressing-2015', name: 'UPU Panama addressing sheet, February 2015', url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/panEn.pdf',
    kind: 'standard', coverage: 'country', usage: 'reference', license: 'UPU publication terms; not a bulk postcode, address or geometry licence',
    notes: 'The dated pre-2026 sheet documents home delivery, P.O. Box and poste restante address layouts and then-current provinces but no national geolocated code. It must not override the May 2026 system or be treated as current assignments, real-address data, postal geometry or building evidence.',
  },
  'inec-panama-territorial-coding': {
    id: 'inec-panama-territorial-coding', name: 'INEC Panama cartography and political-administrative coding', url: 'https://www.inec.gob.pa/aplicaciones/env2008/otros/manuales/cartografia.pdf',
    kind: 'gazetteer', coverage: 'country', usage: 'reference', license: 'Exact INEC publication or data resource, edition and reuse terms must be pinned',
    notes: 'INEC documents a legally constituted and coded province or comarca, district and corregimiento hierarchy used for census cartography. Its edition-specific codes and boundaries remain administrative or statistical context and are not postal zones, estafeta prefixes, PICO cells, civic addresses or building relations.',
  },
  'ign-panama-dpa-2025': {
    id: 'ign-panama-dpa-2025', name: 'IGN Tommy Guardia DPA and settlements map service 2025', url: 'https://sigigntg.anati.gob.pa/arcgisserver/rest/services/Mapa_Web_de_Poblados_2025_MIL1/MapServer',
    kind: 'admin-boundary', coverage: 'country', usage: 'reference', license: 'CC BY-NC-SA; exact layer, item terms, edition, attribution, CRS and digest required',
    notes: 'Official 1:25,000 political-administrative and settlement reference layers published in 2025 and described as updated through 2024. The non-commercial share-alike constraint stays attached; DPA containment cannot be relabelled as a Correos postal-zone or grid-cell boundary and does not prove an address-to-building relation.',
  },
  'osm-panama': {
    id: 'osm-panama', name: 'OpenStreetMap Panama', url: 'https://wiki.openstreetmap.org/wiki/Panama',
    kind: 'address', coverage: 'country', usage: 'validation', license: 'ODbL',
    notes: 'Community roads, addresses and buildings stay in a separate ODbL provenance partition and are not Correos, COTEL, INEC, IGN, ANATI, cadastral, owner, occupant, delivery-entitlement or exact address-building authority.',
  },
  'correos-mexico': {
    id: 'correos-mexico', name: 'Correos de México national postcode catalog', url: 'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Descarga.aspx',
    kind: 'postal-code', coverage: 'country', usage: 'primary',
    notes: 'Official five-digit SEPOMEX catalog for settlements, municipalities or territorial demarcations, cities and federative entities. Pin the exact download, edition, schema, terms, attribution and digest; a catalog row is assignment evidence but is not itself polygon geometry, a civic-address corpus, occupant proof or an exact building relation.',
  },
  'sepomex-postal-polygons-2025': {
    id: 'sepomex-postal-polygons-2025', name: 'SEPOMEX 2025 postcode boundaries by federative entity', url: 'https://www.datos.gob.mx/es/dataset/codigos_postales_entidad_federativa',
    kind: 'postal-code', coverage: 'country', usage: 'primary', license: 'Creative Commons Attribution 4.0; exact catalog and state resource records, files, attribution, schema, CRS and digests required',
    notes: 'Official 2025 geographic postcode delimitations published as 32 state SHP resources. Unmodified validated source features may support official-source Polygon or MultiPolygon geometry. Pin every selected resource and validate topology, gaps, overlaps, invalid rings, duplicate-code parts and state coverage; repairs, dissolves, generalisation and compression are separate derived artifacts.',
  },
  'mexico-postal-service-law': {
    id: 'mexico-postal-service-law', name: 'Ley del Servicio Postal Mexicano', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LSPM.pdf',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Current consolidated postal-service legal framework. A statute is not a current assignment table, open-data license, geometry release, address corpus or building relation.',
  },
  'upu-mexico-addressing-2017': {
    id: 'upu-mexico-addressing-2017', name: 'UPU Mexico addressing sheet, March 2017', url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/mexEn.pdf',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Documents five digits before locality name and federative-entity abbreviation plus mailing examples. It is historical format context, not current assignments, reusable geometry, a bulk address corpus or building evidence.',
  },
  'inegi-mexico-geo-key-service': {
    id: 'inegi-mexico-geo-key-service', name: 'INEGI unique geographic-key catalog and GeoJSON service', url: 'https://www.inegi.org.mx/servicios/catalogounico.html',
    kind: 'gazetteer', coverage: 'country', usage: 'reference', license: 'INEGI free-use terms; exact period, query, response digest and attribution required',
    notes: 'Official federative-entity, municipality or territorial-demarcation, locality, settlement and road identifiers plus geo-statistical geometry. They are not SEPOMEX assignments, postal boundaries, civic addresses or exact building relations.',
  },
  'inegi-mexico-geostatistical-framework-2025': {
    id: 'inegi-mexico-geostatistical-framework-2025', name: 'INEGI Marco Geoestadístico 2025', url: 'https://www.inegi.org.mx/programas/mg/',
    kind: 'admin-boundary', coverage: 'country', usage: 'reference', license: 'INEGI free-use terms; exact product, partition, dictionary, attribution, schema, CRS and digest required',
    notes: 'Official federative-entity, municipality, locality, AGEB, block and road context. Geo-statistical geometry is not SEPOMEX assignment or postal geometry, and an AGEB or block is not an individual building.',
  },
  'inegi-mexico-address-standard-2024': {
    id: 'inegi-mexico-address-standard-2024', name: 'SNIEG / INEGI Norma Técnica sobre Domicilios Geográficos, 2024', url: 'https://snieg.inegi.org.mx/2024/11/25/actualizacion-de-la-norma-tecnica-sobre-domicilios-geograficos/',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'The 22 November 2024 update standardizes structured geographic-address components for identifying a property or building. It does not publish a nationwide address register, SEPOMEX assignment, postal geometry or exact address-to-building rows.',
  },
  'inegi-mexico-denue-2025': {
    id: 'inegi-mexico-denue-2025', name: 'INEGI DENUE 05/2025 economic establishments', url: 'https://www.inegi.org.mx/rnm/index.php/catalog/1103',
    kind: 'address', coverage: 'country', usage: 'reference', license: 'INEGI free-use terms; exact edition, attribution, public-field policy, schema and digest required',
    notes: 'Public business-establishment IDs, structured addresses and approximate coordinates. DENUE does not cover every residence or building; street-front positions can be approximate and rural points can be locality centroids. It is not postal geometry, a residential footprint, owner or occupant evidence or an automatic exact building relation.',
  },
  'osm-mexico': {
    id: 'osm-mexico', name: 'OpenStreetMap Mexico', url: 'https://wiki.openstreetmap.org/wiki/Mexico',
    kind: 'address', coverage: 'country', usage: 'validation', license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separate ODbL provenance partition and are not SEPOMEX, UPU, INEGI, DENUE, cadastral, owner, occupant or exact address-building authority.',
  },
  'correos-cr-postal': {
    id: 'correos-cr-postal',
    name: 'Correos de Costa Rica Código Postal',
    url: 'https://correos.go.cr/codigo-postal/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public interactive operator service; request, response, cache and redistribution terms must be pinned',
    notes: 'Official single-observation postcode service. A response can support a time-bound assignment, but is not a reusable nationwide address corpus, district polygon release, building relation, occupant identity or delivery entitlement.',
  },
  'upu-costa-rica-addressing-2009': {
    id: 'upu-costa-rica-addressing-2009',
    name: 'UPU Costa Rica addressing sheet (April 2009)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/criEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; not a bulk postal-data licence',
    notes: 'Documents five digits, the province-canton-district coding method and address layout. It is historical semantics and example context, not a current nationwide assignment table, geometry, civic-address register or building relation.',
  },
  'upu-costa-rica-address-policy-case-study': {
    id: 'upu-costa-rica-address-policy-case-study',
    name: 'UPU Addressing the World: Costa Rica case study',
    url: 'https://www.upu.int/UPU/media/upu/publications/whitePaperAddressingTheWorldEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; not a delivery-point data licence',
    notes: 'Explains that each district received a postcode based on official administrative numbering and that the operator created a separate internal 19-digit delivery-point code. The publication does not release those delivery points, addresses or buildings.',
  },
  'inec-cr-geographic-classification': {
    id: 'inec-cr-geographic-classification',
    name: 'INEC Costa Rica geographic classification and DTA codes',
    url: 'https://sistemas.inec.cr/pad5/index.php/catalog/379/related-materials',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Exact manual edition and resource-level reuse terms must be pinned',
    notes: 'Official province, canton and district identity/code context. It can validate the 1+2+2 code structure, but is not by itself a current Correos assignment, postal geometry, civic address or building authority.',
  },
  'inec-cr-uged-2024': {
    id: 'inec-cr-uged-2024',
    name: 'INEC Unidad Geoestadística Distrital 2024',
    url: 'https://inec.cr/mapas-cartografia/unidad-geoestadistica-distrital-2024',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Pin archive digest and confirm resource-level CC BY-SA 4.0 applicability before redistribution',
    notes: 'Downloadable 2024 geostatistical district geometry whose boundaries deliberately avoid some imaginary DTA limits. It is a candidate official-derived reference surface only after exact code, vintage, topology and licence checks; it is not operator-issued postal geometry.',
  },
  'snit-cr': {
    id: 'snit-cr',
    name: 'SNIT Costa Rica',
    url: 'https://www.snitcr.go.cr/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Reference-only: SNIT general conditions prohibit commercial use of direct or derived geographic information',
    notes: 'Official national territorial catalog and OGC-service reference. Preserve layer producer, officiality, release, CRS and metadata; portal visibility is not postal authority or redistribution permission.',
  },
  'snit-cr-terms': {
    id: 'snit-cr-terms',
    name: 'SNIT Costa Rica general conditions of use',
    url: 'https://www.snitcr.go.cr/snit_condiciones',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Commercial use of direct or derived SNIT geographic information is not authorized',
    notes: 'Rights gate only. It prevents silently publishing or serving commercial direct or derived SNIT geometry and is not assignment, address, polygon or building data.',
  },
  'osm-costa-rica': {
    id: 'osm-costa-rica',
    name: 'OpenStreetMap Costa Rica',
    url: 'https://wiki.openstreetmap.org/wiki/Costa_Rica',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Community roads, landmarks, addresses and buildings remain in a separate ODbL partition and are not Correos, UPU, INEC, IGN, SNIT, cadastral, occupant or exact civic-address-to-building authority.',
  },
  'correos-nicaragua-postcode-search': {
    id: 'correos-nicaragua-postcode-search',
    name: 'Correos de Nicaragua official postcode search',
    url: 'https://www.correos.gob.ni/codigo-postal/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Interactive official service; pin exact terms, automation, caching and redistribution authority',
    notes: 'Official five-digit structure links geopostal region, municipality or Managua quadrant, and urban barrio or rural comarca; detail results may be Código Maestro. A result is a time-bound observation, not bulk reuse permission, an automatic polygon, exact address, building link, person or delivery entitlement.',
  },
  'upu-nicaragua-addressing-2014': {
    id: 'upu-nicaragua-addressing-2014',
    name: 'UPU Nicaragua addressing sheet (May 2014)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/nicEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; not a current bulk assignment or address-data licence',
    notes: 'Dated evidence for five digits before municipality, with traditional directional and barrio or residential address lines. Its examples and 2014 status are not current assignment rows, reusable addresses, geometry, civic-address identity or building evidence.',
  },
  'inide-nicaragua-territorial-2023': {
    id: 'inide-nicaragua-territorial-2023',
    name: 'INIDE Anuario Estadístico 2023 territorial context',
    url: 'https://www.inide.gob.ni/docs/Anuarios/Anuario2023/Anuario_Estadistico_2023.pdf',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Government publication; pin exact edition, tables, artifact and item terms',
    notes: 'Official statistical identities for fifteen departments, two autonomous Caribbean Coast regions and 153 municipalities. Administrative identity is not Correos assignment, postal geometry, address or building linkage.',
  },
  'ineter-ni-ide': {
    id: 'ineter-ni-ide',
    name: 'INETER Nicaragua national boundary geoservices',
    url: 'https://www.ineter.gob.ni/geoportales/miacnicaragua/index.html',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Official WMS/WFS access; exact layer terms and reproduction authority must be pinned',
    notes: 'Official national, departmental and municipal WMS/WFS layers with source metadata. Pin exact layer, date, maintenance state, CRS, terms and digest; service access and administrative containment are not Correos assignment or postal geometry.',
  },
  'ineter-nicaragua-cartographic-base': {
    id: 'ineter-nicaragua-cartographic-base',
    name: 'INETER national digital cartographic base BCN50',
    url: 'https://www.ineter.gob.ni/geoportales/idebcn/index.html',
    kind: 'topography',
    coverage: 'country',
    usage: 'reference',
    license: 'Official map and OGC service access; exact dataset, edition and reuse terms must be pinned',
    notes: 'Official 1:50,000 national base-cartography discovery. Roads, settlements, names and topography support review only and do not prove a Correos assignment, postal polygon, civic address or building relation.',
  },
  'ineter-nicaragua-cadastral-ide': {
    id: 'ineter-nicaragua-cadastral-ide',
    name: 'INETER cadastral spatial data infrastructure terms',
    url: 'https://idec.ineter.gob.ni/agrimensuras/terminos/',
    kind: 'cadastre',
    coverage: 'country',
    usage: 'validation',
    license: 'Consultation is limited to lawful academic or personal non-commercial use; reproduction or a substitute dataset requires express authorization',
    notes: 'Official cadastral consultation and spatial context are not bulk-open. Parcel, survey, owner, credential or licensed-user data cannot establish Correos geometry or an exact civic-address-to-building relation and must not be republished without authority.',
  },
  'osm-nicaragua': {
    id: 'osm-nicaragua',
    name: 'OpenStreetMap Nicaragua',
    url: 'https://wiki.openstreetmap.org/wiki/Nicaragua',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Community roads, landmarks, addresses and buildings remain in a separately attributed ODbL partition and are not Correos, UPU, INIDE, INETER, cadastral, owner, occupant or exact civic-address-to-building authority.',
  },
  'correos-guatemala-postal': {
    id: 'correos-guatemala-postal',
    name: 'Dirección General de Correos y Telégrafos de Guatemala',
    url: 'https://correos.gob.gt/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public official operator website; individual artifact and reuse terms must be pinned',
    notes: 'The current government postal operator runs the national postal system and publishes postcode directories. Use pinned operator artifacts or observations; the website alone is not a reusable nationwide address corpus, full-code geometry release, building relation or delivery entitlement.',
  },
  'correos-guatemala-postcode-directory': {
    id: 'correos-guatemala-postcode-directory',
    name: 'Correos de Guatemala department postcode directories',
    url: 'https://correos.gob.gt/CodigosPos/ListaCodigos/Guatemala.pdf',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public official PDF directories; no blanket open bulk-data licence asserted',
    notes: 'Official department PDFs enumerate five-digit assignments for departments, municipalities, Guatemala City zones and named localities. A production release must inventory every file, retrieval time and digest. The tables provide assignment labels, not postal polygons, civic addresses, buildings, occupants or perpetual validity.',
  },
  'upu-guatemala-addressing-2025': {
    id: 'upu-guatemala-addressing-2025',
    name: 'UPU Guatemala addressing sheet (November 2025)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/gtmEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; current syntax and layout reference, not a bulk-data licence',
    notes: 'The November 2025 UPU sheet documents five digits, department, distribution-route, delivery-office and code positions, plus municipality or rural-locality and premises layout. It does not provide nationwide reusable geometry, address points or building relations.',
  },
  'correos-guatemala-postal-legal-framework': {
    id: 'correos-guatemala-postal-legal-framework',
    name: 'Correos de Guatemala postal legal framework',
    url: 'https://correos.gob.gt/transparencia/laip/estructura-organica-y-funciones/',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Public legal and institutional reference; not postal reference data',
    notes: 'Official transparency material identifies the national postal legal framework and operator mandate. It is legal context, not a current assignment table, geometry release, civic-address register or delivery entitlement.',
  },
  'segeplan-gt-ide': {
    id: 'segeplan-gt-ide',
    name: 'SEGEPLAN SINIT and IDE Guatemala',
    url: 'https://portal.segeplan.gob.gt/segeplan/?page_id=6743',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Portal described as freely accessible; layer producer, release and reuse terms remain specific',
    notes: 'The official SINIT/IDE geoportal exposes administrative, planning and settlement context through downloads and OGC services. Pin layer, producer, vintage, CRS and rights; an accessible department, municipality, populated place or urban layer is not a Correos assignment or postal polygon.',
  },
  'ine-guatemala-census-settlements': {
    id: 'ine-guatemala-census-settlements',
    name: 'INE Guatemala 2018 census populated places',
    url: 'https://datos.ine.gob.gt/dataset/censo-2018-lugares-poblados',
    kind: 'statistics',
    coverage: 'country',
    usage: 'validation',
    license: 'Creative Commons Attribution; exact resource and edition specific',
    notes: 'INE publishes census tables and georeferenced populated-place resources under CC BY. Names may be self-identified and are not automatically official municipal names, current postal assignments, postal geometry, civic addresses or buildings.',
  },
  'ign-guatemala-cartography': {
    id: 'ign-guatemala-cartography',
    name: 'Instituto Geográfico Nacional Guatemala',
    url: 'https://www.ign.gob.gt/',
    kind: 'topography',
    coverage: 'country',
    usage: 'reference',
    license: 'Product, service and dataset-specific terms must be pinned',
    notes: 'IGN is the national cartographic provider. Pin the exact product, scale, release, CRS, coverage and reuse rights; maps and boundaries are not postal assignments, official full-code geometry, civic-address data or exact building relations.',
  },
  'ric-guatemala-cadastre': {
    id: 'ric-guatemala-cadastre',
    name: 'Registro de Información Catastral de Guatemala',
    url: 'https://portal.ric.gob.gt/productos',
    kind: 'cadastre',
    coverage: 'country',
    usage: 'reference',
    license: 'Registered, paid, product and purpose-specific cadastral services',
    notes: 'RIC cadastral products and remote consultations are registered or tariffed and coverage is process-specific. Parcel, finca, owner, tenure, legal record, containment or proximity is not postal assignment, public address data or an exact address-to-building relation.',
  },
  'osm-guatemala': {
    id: 'osm-guatemala',
    name: 'OpenStreetMap Guatemala',
    url: 'https://wiki.openstreetmap.org/wiki/Guatemala',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Community roads, zones, addresses and buildings remain in a separate ODbL partition and are not Correos, UPU, SEGEPLAN, INE, IGN, RIC, cadastral, occupant or exact address-building authority.',
  },
  'belize-statistical-institute': {
    id: 'belize-statistical-institute',
    name: 'Statistical Institute of Belize',
    url: 'https://sib.org.bz/',
    kind: 'statistics',
    coverage: 'country',
    usage: 'reference',
    notes: 'Belize district and settlement reference source for geography and statistical boundaries.',
  },
  'data-gouv-fr-postcodes': {
    id: 'data-gouv-fr-postcodes',
    name: 'France API Codes Postaux',
    url: 'https://www.data.gouv.fr/datasets/api-codes-postaux',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'French official open-data postal-code API and dataset, including overseas departments where covered.',
  },
  'la-poste-fr-overseas': {
    id: 'la-poste-fr-overseas',
    name: 'La Poste French Overseas Postal Reference',
    url: 'https://www.laposte.fr/outils/trouver-un-code-postal',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'primary',
    notes: 'French postal-code lookup for overseas territories in the Americas and Caribbean.',
  },
  'postnord-greenland': {
    id: 'postnord-greenland',
    name: 'PostNord Greenland Postal Codes',
    url: 'https://www.postnord.dk/en',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Greenland postal-code reference through Danish/PostNord postal conventions.',
  },
  'falkland-islands-post': {
    id: 'falkland-islands-post',
    name: 'Falkland Islands Post Service',
    url: 'https://www.falklands.gov.fk/postal-services',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Falkland Islands postcode and delivery reference.',
  },
  'falkland-islands-gis': {
    id: 'falkland-islands-gis',
    name: 'Falkland Islands Government GIS',
    url: 'https://www.fig.gov.fk/',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Falkland Islands government reference for settlements, islands, roads, and territory geography.',
  },
  'british-overseas-postal-reference': {
    id: 'british-overseas-postal-reference',
    name: 'British Overseas Territories Postal Reference',
    url: 'https://www.royalmail.com/sending/international/country-guides',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Royal Mail country guides provide current destination addressing and service reference for UK overseas territories using assigned territory postcodes.',
  },
  'anguilla-post': {
    id: 'anguilla-post',
    name: 'Anguilla Postal Service',
    url: 'https://gov.ai/ministry/ministry-of-finance-immigration-labour-home-affairs--constitutional-affairs/general-post-office',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Anguilla postal and delivery reference for AI-2640 routing.',
  },
  'anguilla-gov-gis': {
    id: 'anguilla-gov-gis',
    name: 'Government of Anguilla GIS Reference',
    url: 'https://www.gov.ai/',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Government reference for Anguilla districts, settlements, and territory geography.',
  },
  'bermuda-post': {
    id: 'bermuda-post',
    name: 'Bermuda Post Office',
    url: 'https://www.gov.bm/department/post-office',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'primary',
    notes: 'Official Bermuda postal-code and delivery reference.',
  },
  'bermuda-gov-maps': {
    id: 'bermuda-gov-maps',
    name: 'Bermuda Government Maps',
    url: 'https://www.gov.bm/maps',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Bermuda government map reference for parishes, roads, and places.',
  },
  'bvi-post': {
    id: 'bvi-post',
    name: 'British Virgin Islands Postal Service',
    url: 'https://www.bvi.gov.vg/departments/bvi-post-0',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Official BVI Post department reference for postal and delivery routing.',
  },
  'bvi-gis': {
    id: 'bvi-gis',
    name: 'British Virgin Islands Government GIS Reference',
    url: 'https://bvi.gov.vg/',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Government reference for BVI islands, districts, roads, and localities.',
  },
  'cayman-post': {
    id: 'cayman-post',
    name: 'Cayman Islands Postal Service',
    url: 'https://www.caymanpost.gov.ky/',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'primary',
    notes: 'Official Cayman Islands postcode and delivery reference.',
  },
  'cayman-lands-survey': {
    id: 'cayman-lands-survey',
    name: 'Cayman Islands Lands and Survey',
    url: 'https://www.caymanlandinfo.ky/',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Cayman Islands land, parcel, road, and geography reference for address validation.',
  },
  'montserrat-post': {
    id: 'montserrat-post',
    name: 'Montserrat Postal Service',
    url: 'https://www.gov.ms/government/ministries/ministry-of-finance-economic-management/montserrat-postal-service/',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Montserrat postal and delivery reference for MSR postcode routing.',
  },
  'montserrat-gis': {
    id: 'montserrat-gis',
    name: 'Montserrat Government GIS Reference',
    url: 'https://www.gov.ms/',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Government reference for Montserrat parishes, settlements, exclusion zones, and roads.',
  },
  'turks-caicos-post': {
    id: 'turks-caicos-post',
    name: 'Turks and Caicos Islands Postal Service',
    url: 'https://tcipostal.gov.tc/',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Turks and Caicos postal and delivery reference for island routing.',
  },
  'turks-caicos-gis': {
    id: 'turks-caicos-gis',
    name: 'Turks and Caicos Government GIS Reference',
    url: 'https://www.gov.tc/',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Government reference for Turks and Caicos islands, districts, settlements, and geography.',
  },
  'south-georgia-gis': {
    id: 'south-georgia-gis',
    name: 'Government of South Georgia and the South Sandwich Islands',
    url: 'https://www.gov.gs/',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Territory reference for South Georgia settlements, research stations, islands, and protected areas.',
  },
  'correios-cep-api': {
    id: 'correios-cep-api', name: 'Correios Busca CEP API', url: 'https://www.correios.com.br/atendimento/developers/manuais/manual-api-busca-cep',
    kind: 'postal-code', coverage: 'country', usage: 'primary', license: 'Contract credentials and exact API terms required',
    notes: 'Official eight digits and typed CEP/address observations for authorized contract clients. Query data and response caches require exact terms; a response is not a polygon, building footprint, occupant proof or bulk redistribution right.',
  },
  'correios-dne-licensing': {
    id: 'correios-dne-licensing', name: 'Correios DNE licensing contract reference', url: 'https://www.correios.com.br/enviar/precisa-de-ajuda/contrate-os-correios/arquivos/contratos-formalizados-ate-fevereiro-de-2020/anexo-dne-gu',
    kind: 'address', coverage: 'country', usage: 'reference', license: 'Commercial, non-exclusive and purpose-limited Correios licence',
    notes: 'DNE is licensed national address and CEP reference data. Contract access is not open redistribution or automatic postal geometry, building, occupant or AGID authority.',
  },
  'upu-brazil-addressing': {
    id: 'upu-brazil-addressing', name: 'UPU Brazil addressing sheet', url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/braEn.pdf',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Pinned publication evidence for the eight-digit CEP structure and Brazilian address layout, including Brasília and P.O. box examples. It is not a current assignment table, geometry release, address corpus or building relation.',
  },
  'ibge-cnefe-2022': {
    id: 'ibge-cnefe-2022', name: 'IBGE CNEFE 2022 Census address register for statistical purposes', url: 'https://www.ibge.gov.br/estatisticas/sociais/populacao/38734-cadastro-nacional-de-enderecos-para-fins-estatisticos.html',
    kind: 'address', coverage: 'country', usage: 'validation', license: 'Exact CNEFE release, privacy controls, dictionary and terms required',
    notes: 'Official statistical address, CEP aggregate and geocoded-point context. Preserve NV_GEO_COORD or equivalent quality: a point may be an entrance, accessible point, rural gate, earlier location, street-face midpoint or census-sector centroid; it is not Correios assignment, deliverability, postal polygon, building footprint, occupant proof or exact address-to-building relation.',
  },
  'ibge-municipal-mesh-2024': {
    id: 'ibge-municipal-mesh-2024', name: 'IBGE 2024 municipal territorial mesh', url: 'https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2024/Brasil/',
    kind: 'admin-boundary', coverage: 'country', usage: 'validation', license: 'Exact IBGE release metadata and terms required',
    notes: 'Official 2024 administrative boundary context in SIRGAS 2000. Municipality, Federal District and special operational coverage is administrative, not postal, address, parcel, building or Correios assignment authority.',
  },
  'ibge-cartographic-base-2023': {
    id: 'ibge-cartographic-base-2023', name: 'IBGE Continuous Cartographic Base of Brazil 1:250,000, 2023', url: 'https://www.ibge.gov.br/geociencias/todos-os-produtos-geociencias/15759-brasil.html?edicao=38558',
    kind: 'topography', coverage: 'country', usage: 'reference',
    notes: 'Official national reference cartography for names, roads and geographic context. It is not CEP assignment, postal geometry, exact civic address, building or cadastral evidence.',
  },
  'inde-brazil': {
    id: 'inde-brazil', name: 'Brazil National Data Infrastructure / geospatial discovery', url: 'https://www.gov.br/governodigital/pt-br/infraestrutura-nacional-de-dados',
    kind: 'data-catalog', coverage: 'country', usage: 'reference',
    notes: 'Government discovery, governance and interoperability context. Catalog presence does not transfer a producer, licence, scope, postal authority, address authority or building relation.',
  },
  'osm-brazil': {
    id: 'osm-brazil', name: 'OpenStreetMap Brazil', url: 'https://wiki.openstreetmap.org/wiki/Brazil',
    kind: 'address', coverage: 'country', usage: 'validation', license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separate ODbL provenance partition and are not Correios, DNE, IBGE, CNEFE, cadastral, occupant or exact address-building authority.',
  },
  'viacep-br': {
    id: 'viacep-br',
    name: 'ViaCEP',
    url: 'https://viacep.com.br/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Third-party Brazilian CEP candidate service with JSON/XML lookup and address search. Preserve service provenance and never treat a response as Correios assignment proof, postal geometry, deliverability or a building relation.',
  },
  brasilapi: {
    id: 'brasilapi',
    name: 'BrasilAPI',
    url: 'https://brasilapi.com.br/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    notes: 'Open-source third-party Brazilian API project with CEP endpoints and public reference data. It is validation evidence, not Correios assignment, polygon, deliverability or exact building proof.',
  },
  'ipostel-venezuela-postcode-lookup': {
    id: 'ipostel-venezuela-postcode-lookup', name: 'IPOSTEL Venezuelan postcode lookup', url: 'https://www.ipostel.gob.ve/codigo-postal-venezolano/',
    kind: 'postal-code', coverage: 'country', usage: 'primary',
    notes: "UPU identifies IPOSTEL as Venezuela's designated operator. Retain only a permitted time-bound four-digit lookup observation with endpoint state and digest; public availability must be revalidated, and a result is not bulk data, a polygon, occupant proof or a building relation.",
  },
  'upu-venezuela-addressing-2019': {
    id: 'upu-venezuela-addressing-2019', name: 'UPU Venezuela addressing sheet, May 2019', url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/venEn.pdf',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'May 2019 evidence for four digits, with first digit as postal region and remaining digits as delivery office, plus home, organization, rural and P.O. box address layouts. It is not a current assignment table, bulk address corpus, geometry release or building relation.',
  },
  'ine-venezuela-populated-places-2001': {
    id: 'ine-venezuela-populated-places-2001', name: 'INE Venezuela populated-place nomenclator context for the 2001 census', url: 'https://unstats.un.org/unsd/demographic/meetings/wshops/Chile_31May11/docs/country/venezuela-s4.pdf',
    kind: 'gazetteer', coverage: 'country', usage: 'reference',
    notes: 'A 2011 UN Statistics workshop document describes dated INE 2001 populated-place and indigenous-community context classified by federal entity, municipality and parish. Obtain the exact underlying INE artifact before production; this is not current administration, IPOSTEL assignment, postal geometry or building evidence.',
  },
  'igvsb-venezuela-geographic-authority': {
    id: 'igvsb-venezuela-geographic-authority', name: 'Instituto Geográfico de Venezuela Simón Bolívar', url: 'https://www.igvsb.gob.ve/',
    kind: 'data-catalog', coverage: 'country', usage: 'reference',
    notes: 'National geographic, cartographic and cadastral authority reference. Each usable layer requires current availability, producer, edition, jurisdiction, terms, CRS, quality and digest; geographic, administrative or cadastral authority is not IPOSTEL assignment, postal geometry or an exact address-building link.',
  },
  'venezuela-geography-cartography-cadastre-law-2000': {
    id: 'venezuela-geography-cartography-cadastre-law-2000', name: 'Venezuela Geography, Cartography and National Cadastre Law, 2000', url: 'https://faolex.fao.org/docs/pdf/ven24796.pdf',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Legal context for public territorial information, IGVSB functions and national or municipal cadastral roles. Public-information language is not automatically a bulk-data licence, current dataset, postal polygon, address-building relation, owner-data permission or resolution of territorial status.',
  },
  'osm-venezuela': {
    id: 'osm-venezuela', name: 'OpenStreetMap Venezuela', url: 'https://wiki.openstreetmap.org/wiki/Venezuela',
    kind: 'address', coverage: 'country', usage: 'validation', license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separate ODbL provenance partition and are not IPOSTEL, UPU, INE, IGVSB, cadastral, owner, occupant or exact address-building authority.',
  },
  'correo-argentino-cpa': {
    id: 'correo-argentino-cpa', name: 'Correo Argentino CPA lookup and guidance', url: 'https://www.correoargentino.com.ar/categorias/consulta-cpa',
    kind: 'postal-code', coverage: 'country', usage: 'primary',
    notes: 'Official operator reference for the current eight-character CPA. Urban assignments can identify each block face, while small settlements, rural zones and special cases can share one CPA. The operator does not publish open code lists, and an interactive result is not geometry, occupant proof or a building relation.',
  },
  'georef-ar': {
    id: 'georef-ar', name: 'Argentina Georef service', url: 'https://portal-andino.datos.gob.ar/dataset/servicio-normalizacion-datos-geograficos',
    kind: 'geocoding', coverage: 'country', usage: 'primary', license: 'CC BY 4.0 catalog entry; pin exact resource metadata',
    notes: 'Official geographic normalization for provinces, departments, municipalities, localities, streets and addresses using IGN, BAHRA and INDEC context. Address and location endpoints provide derived points/context, not postal assignment, parcel or building geometry.',
  },
  'ign-argentina-geospatial': {
    id: 'ign-argentina-geospatial', name: 'Instituto Geográfico Nacional SIG layers', url: 'https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG',
    kind: 'admin-boundary', coverage: 'country', usage: 'validation', license: 'Artifact-specific attribution and metadata required',
    notes: 'Official names and territorial layers require exact layer authority, release, CRS, validity and licence. Some departmental or international representations are reference geometry and must not be relabelled as CPA delivery boundaries.',
  },
  'idera-argentina': {
    id: 'idera-argentina', name: 'IDERA geoservice and fundamental-data catalog', url: 'https://www.idera.gob.ar/index.php/servicios/buscador-de-dbyf',
    kind: 'data-catalog', coverage: 'country', usage: 'reference',
    notes: 'National discovery and interoperability catalog for decentralized government geospatial producers. Each discovered service or layer retains its own producer, jurisdiction, metadata, licence, coverage and release; catalog presence is not postal or building authority.',
  },
  'argentina-cadastre-law-26209': {
    id: 'argentina-cadastre-law-26209', name: 'Argentina National Cadastre Law 26.209', url: 'https://www.argentina.gob.ar/normativa/nacional/ley-26209-124298/texto',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Legal framework establishing provincial and CABA cadastral administration and georeferenced parcel status. Parcels and ownership records are not postal areas, addresses, buildings or public address-building relations.',
  },
  'osm-argentina': {
    id: 'osm-argentina', name: 'OpenStreetMap Argentina', url: 'https://wiki.openstreetmap.org/wiki/Argentina',
    kind: 'address', coverage: 'country', usage: 'validation', license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separate ODbL provenance partition and are not Correo Argentino, IGN, Georef, cadastral, occupant or exact address-building authority.',
  },
  'correo-uruguayo-postal-polygons': {
    id: 'correo-uruguayo-postal-polygons', name: 'Correo Uruguayo official postal-code polygons', url: 'https://catalogodatos.gub.uy/dataset/correo-codigo-postal',
    kind: 'postal-code', coverage: 'country', usage: 'primary', license: 'Licencia de Datos Abiertos de Uruguay',
    notes: 'Official five-digit postcode SHP/KML releases from Correo Uruguayo. The August 2023 SHP is EPSG:4326 and supplies official release geometry, but production must pin its exact resource UUID, retrieval time, digest, validity and supersession instead of treating the catalog page or a current lookup as a timeless boundary.',
  },
  'correo-uruguayo-address-services': {
    id: 'correo-uruguayo-address-services', name: 'Correo Uruguayo address and postcode web services', url: 'https://www.correo.com.uy/servicios-web',
    kind: 'address', coverage: 'country', usage: 'primary',
    notes: 'Official services can return normalized street, door number, block, lot, locality, department, postcode and EPSG:4326 address point context. A response is time-bound assignment/address evidence, not a parcel, building footprint, occupant record or bulk redistribution grant; pin terms and minimize retained requests.',
  },
  'ide-uy-addresses': {
    id: 'ide-uy-addresses', name: 'Sistema Único de Direcciones Geográficas del Uruguay', url: 'https://catalogodatos.gub.uy/dataset/ide-direcciones-geograficas-del-uruguay',
    kind: 'address', coverage: 'country', usage: 'primary', license: 'Licencia de Datos Abiertos de Uruguay',
    notes: 'Official nationwide address points and identifiers with street nomenclature, door numbers and locality/department context, updated by participating authorities. Preserve departmental resource release and provenance; an address point or identifier is not postal-area geometry, a cadastral parcel, building footprint or automatic address-building relation.',
  },
  'dnc-uy-parcels': {
    id: 'dnc-uy-parcels', name: 'Dirección Nacional de Catastro parcel shapes', url: 'https://catalogodatos.gub.uy/dataset/direccion-nacional-de-catastro-shapes-del-parcelario-rural-y-urbano',
    kind: 'admin-boundary', coverage: 'country', usage: 'validation', license: 'Licencia de Datos Abiertos de Uruguay',
    notes: 'Official monthly urban and rural parcel shapes from DNC. A parcel supplies cadastral context only and is not a postal polygon, civic address, building footprint, unit, owner/occupant record or exact address-building relation without an explicit stable source key.',
  },
  'osm-uruguay': {
    id: 'osm-uruguay', name: 'OpenStreetMap Uruguay', url: 'https://wiki.openstreetmap.org/wiki/Uruguay',
    kind: 'address', coverage: 'country', usage: 'validation', license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separate ODbL provenance partition and are not Correo Uruguayo, IDE, DNC, occupant or exact address-building authority.',
  },
  'geoportal-cl': {
    id: 'geoportal-cl',
    name: 'Geoportal de Chile / IDE Chile catalog',
    url: 'https://geoportal.cl/catalog',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'National geospatial catalog for discovering administrative and territorial layers. Every production layer still requires its producer, edition, scope, CRS, item terms and digest; catalog presence is not CorreosChile assignment, block-face geometry, civic-address identity or a building relation.',
  },
  'correos-chile-postcode-lookup': {
    id: 'correos-chile-postcode-lookup',
    name: 'CorreosChile official postcode lookup and FAQ',
    url: 'https://www.correos.cl/codigo-postal',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Interactive official service; exact site, cache, automation and redistribution terms must be pinned',
    notes: 'CorreosChile states that a seven-digit code is address-dependent and identifies an area down to one side of a block; lookup requires commune, street and municipal number. A result is a time-bound assignment observation, not bulk reuse permission, exact parcel, apartment, person, building or polygon geometry.',
  },
  'correos-chile-normalization-api': {
    id: 'correos-chile-normalization-api',
    name: 'CorreosChile v2 address normalization API',
    url: 'https://developers.correos.cl/v2/normalizacion',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'Customer credential and CorreosChile integration terms required',
    notes: 'Credentialed POST service accepts address plus commune and returns normalized street, municipal number, remainder, commune and postcode. Pin customer authorization, request purpose, service version, observed time, retention and cache terms; a response is not coordinates, a building ID, a reusable address corpus or a national postcode polygon release.',
  },
  'upu-chile-addressing-2017': {
    id: 'upu-chile-addressing-2017',
    name: 'UPU Chile addressing sheet (March 2017)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/chlEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; not a bulk assignment or address-data licence',
    notes: 'Documents seven digits to the left of the commune: three for the postal distribution area, usually a commune, and four for a sequential block face. It also separates commune fallbacks, post-office codes, rural no-number addresses and building/floor/apartment remainder; its examples are not production address rows.',
  },
  'ide-chile-dpa-2023': {
    id: 'ide-chile-dpa-2023',
    name: 'IDE Chile political-administrative division 2023',
    url: 'https://www.ide.cl/noticias/2023-09-actualizacion-de-la-cartografia-de-division-politica-administrativa-en/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Pin exact Shapefile edition, producer metadata and item-level terms',
    notes: 'Joint SUBDERE, IGM, DIFROL and INE region-to-commune cartography. It is official administrative context, not CorreosChile postal assignment, block-face geometry, civic address, parcel or building linkage.',
  },
  'subdere-chile-cut': {
    id: 'subdere-chile-cut',
    name: 'SUBDERE Chile unique territorial codes (CUT)',
    url: 'https://www.subdere.gov.cl/documentacion/c%C3%B3digos-%C3%BAnicos-territoriales-actualizados-al-06-de-septiembre-2018',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Government publication; pin the exact edition and reuse terms',
    notes: 'Official identifiers for regions, provinces and communes, including the Ñuble update. CUT codes identify administrative units and cannot prove a current postcode, block face, address, building, parcel or delivery entitlement.',
  },
  'ine-chile-open-geodata': {
    id: 'ine-chile-open-geodata',
    name: 'INE Chile open geodata and Census 2024 cartography',
    url: 'https://www.ine.gob.cl/herramientas/portal-de-mapas/geodatos-abiertos',
    kind: 'statistics',
    coverage: 'country',
    usage: 'reference',
    license: 'Open-access catalog; pin exact dataset methodology, disclosure controls and item terms',
    notes: 'Official census block/entity, base-cartography, building-count and building-permit context. Statistical blocks, counted structures or permits are not CorreosChile assignments, postal geometry, exact civic-address-to-building relations, households or occupants.',
  },
  'sii-chile-digital-cadastre': {
    id: 'sii-chile-digital-cadastre',
    name: 'SII Chile digital real-estate cadastre',
    url: 'https://www.sii.cl/destacados/impuesto_territorial/index.html',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'Public consultation is not bulk reuse; interoperability and detailed records are access-controlled',
    notes: 'Official parcel/property, role, land, construction and valuation context. Public or authorized queries must not be scraped or republished, and owner RUT, valuation and detailed property data remain restricted; a parcel or tax role is not postal geometry or an automatic address-building relation.',
  },
  'osm-chile': {
    id: 'osm-chile',
    name: 'OpenStreetMap Chile',
    url: 'https://wiki.openstreetmap.org/wiki/Chile',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separately attributed ODbL partition and are not CorreosChile, IDE, SUBDERE, INE, SII, occupant or exact civic-address-to-building authority.',
  },
  'inposdom-postcode-search': {
    id: 'inposdom-postcode-search',
    name: 'INPOSDOM official postcode search',
    url: 'https://inposdom.gob.do/codigo-postal/index.html',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Interactive official service; pin exact terms, automation, caching and redistribution authority',
    notes: 'Official search accepts an address, sector or five-digit postcode and returns current operator context. A result is a time-bound observation, not bulk reuse permission, a person, delivery entitlement, exact civic address, building link or verified national polygon release.',
  },
  'upu-dominican-republic-addressing-2005': {
    id: 'upu-dominican-republic-addressing-2005',
    name: 'UPU Dominican Republic addressing sheet (March 2005)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/domEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; not a current bulk assignment or address-data licence',
    notes: 'Dated formatting evidence for five digits to the left of the locality, with street and number plus district. Its example and 2005 status are not current assignment rows, geometry, civic-address identity or building evidence.',
  },
  'one-dominican-territorial-division-2021': {
    id: 'one-dominican-territorial-division-2021',
    name: 'ONE División Territorial 2021',
    url: 'https://one.gob.do/publicaciones/2021/division-territorial-2021',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Government publication; pin exact edition, downloadable artifact and item terms',
    notes: 'Official legal and cartographic identities for provinces, municipalities, municipal districts, sections, parajes and barrios. Administrative codes and boundaries are not INPOSDOM assignment, postal geometry, address or building relations.',
  },
  'iderd-dominican-geoservices': {
    id: 'iderd-dominican-geoservices',
    name: 'IDE-RD metadata catalog and OGC geoservices',
    url: 'https://iderd.gob.do/recursos/directorio-de-geoservicios/',
    kind: 'data-catalog',
    coverage: 'country',
    usage: 'reference',
    license: 'Catalog and services are discoverable; each producer layer requires independent terms review',
    notes: 'Official CSW, WMS, WMTS and WFS discovery and access. Pin producer, layer, edition, scope, CRS, quality, terms and digest; service visibility is not postal assignment or an exact civic-address-to-building relation.',
  },
  'ign-dominican-cartographic-base': {
    id: 'ign-dominican-cartographic-base',
    name: 'IGN-JJHM Dominican Republic cartographic base',
    url: 'https://mapas.ign.gob.do/',
    kind: 'topography',
    coverage: 'country',
    usage: 'reference',
    license: 'Official map access; exact dataset, edition and reuse terms must be pinned',
    notes: 'Official cartographic and geographic context from IGN-JJHM. Roads, place names, imagery or topographic objects can support review but do not prove an INPOSDOM postcode, official postal polygon, civic address or building relation.',
  },
  'registro-inmobiliario-dominican-cadastre': {
    id: 'registro-inmobiliario-dominican-cadastre',
    name: 'Registro Inmobiliario parcel locator and cadastral consultation',
    url: 'https://servicios.ri.gob.do/ConsultaParcelario',
    kind: 'cadastre',
    coverage: 'country',
    usage: 'validation',
    license: 'Portal consultation is limited by RI terms; commercial reuse requires prior written authorization',
    notes: 'Official approved and in-process parcel context, positional designation and property-location services. Portal content is not bulk-open, and parcel containment, ownership or condominium data cannot establish postal geometry or an exact civic-address-to-building relation.',
  },
  'osm-dominican-republic': {
    id: 'osm-dominican-republic',
    name: 'OpenStreetMap Dominican Republic',
    url: 'https://wiki.openstreetmap.org/wiki/Dominican_Republic',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separately attributed ODbL partition and are not INPOSDOM, ONE, IDE-RD, IGN, RI, owner, occupant or exact address-to-building authority.',
  },
  'colombia-en-mapas': {
    id: 'colombia-en-mapas',
    name: 'Colombia en Mapas',
    url: 'https://www.colombiaenmapas.gov.co/inicio',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official national map catalog for territorial, administrative, cadastral and geographic reference layers. Every production layer still requires its producer, release, coverage, CRS, licence and digest; catalog visibility is not postal assignment or an exact civic-address-to-building relation.',
  },
  'codigo-postal-colombia-472-viewer': {
    id: 'codigo-postal-colombia-472-viewer',
    name: 'Código Postal Colombia 4-72 official viewer',
    url: 'https://visor.codigopostal.gov.co/472/visor/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Site publishes an open-data clause; exact response, cache and service terms must be pinned',
    notes: 'Official 4-72/MINTIC lookup states that six digits represent an area on the national map and exposes normal and expanded postcode results. A live query is time-bound evidence and must not be republished as a nationwide address, parcel, building, person or delivery database.',
  },
  'codigo-postal-colombia-csv': {
    id: 'codigo-postal-colombia-csv',
    name: '4-72 national postcode CSV',
    url: 'https://visor.codigopostal.gov.co/472/visor/Codigos_Postales_Nacionales.csv',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: '4-72/MINTIC open-data clause with mandatory attribution and preserved update metadata',
    notes: 'Official direct national postcode download linked by the viewer. Promotion requires retrieval time, content digest, schema, row scope, update metadata and the applicable licence snapshot; a row is assignment evidence, not geometry or an address-building relation.',
  },
  'codigo-postal-colombia-shapefile': {
    id: 'codigo-postal-colombia-shapefile',
    name: '4-72 national postcode Shapefile',
    url: 'https://visor.codigopostal.gov.co/472/visor/Shapefile_Codigo_Postal.zip',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: '4-72/MINTIC open-data clause, subject to artifact-level confirmation against conflicting service metadata',
    notes: 'Official direct polygon download linked by the viewer. An exact digest-pinned six-digit feature can become official release geometry only after confirming that the open clause applies to the archive, preserving attribution and update metadata, validating CRS/topology and resolving the ArcGIS item all-rights-reserved notice.',
  },
  'codigo-postal-colombia-open-license': {
    id: 'codigo-postal-colombia-open-license',
    name: '4-72/MINTIC Código Postal Colombia open-data clause',
    url: 'https://visor.codigopostal.gov.co/472/visor/Clausula_Licencia_Abierta.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'OpenDefinition-style clause permitting use, reuse, redistribution and transformation with attribution',
    notes: 'Requires the textual source attribution, preservation of update metadata, non-distortion and personal-data protection. It is a rights gate, not a postcode assignment, polygon, address, building or delivery record.',
  },
  'codigo-postal-colombia-arcgis': {
    id: 'codigo-postal-colombia-arcgis',
    name: '4-72 CCPP ArcGIS MapServer',
    url: 'https://visor.codigopostal.gov.co/arcgis/rest/services/ccpp/MapServer',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    license: 'Reference-only until item-level all-rights-reserved metadata is reconciled with the viewer open-data clause',
    notes: 'Official EPSG:4326 service exposes normal six-digit CodigoPostal polygons, expanded-postcode polygons, sites of interest and property-address points as distinct layers. Do not conflate layers, scrape property points or treat service access as redistribution permission.',
  },
  'upu-colombia-addressing-2022': {
    id: 'upu-colombia-addressing-2022',
    name: 'UPU Colombia addressing sheet (October 2022)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/colEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; not a bulk data licence',
    notes: 'Documents six digits after the locality and the two-digit department, postal-zone and district coding method. Address examples and format semantics are not a reusable assignment table, polygon archive, civic-address register or building relation.',
  },
  'upu-colombia-s42-2021': {
    id: 'upu-colombia-s42-2021',
    name: 'UPU S42 Colombia standardized address format v8',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/s42/colEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; sample addresses must not be bundled as production rows',
    notes: 'Separates organization, postcode, department, city, neighborhood/locality, P.O. box, primary and generating thoroughfares, placa, building and apartment elements. It defines formatting, not address existence, ownership, deliverability or an exact building crosswalk.',
  },
  'dane-colombia-divipola-mgn-2025': {
    id: 'dane-colombia-divipola-mgn-2025',
    name: 'DANE DIVIPOLA Marco Geoestadístico Nacional 2025',
    url: 'https://geoportal.dane.gov.co/mparcgis/rest/services/Divipola/Serv_DIVIPOLA_MGN_2025/FeatureServer',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Pin exact DANE resource terms, service version, layer and retrieval digest',
    notes: 'Official department, municipality and populated-centre identities and geometry for the 2025 statistical frame. Statistical or administrative membership is context, not 4-72 postal assignment, postal geometry, civic address or building linkage.',
  },
  'igac-colombia-open-cadastre': {
    id: 'igac-colombia-open-cadastre',
    name: 'IGAC Colombia open cadastral data',
    url: 'https://www.igac.gov.co/datos-abiertos/datos-abiertos-geoespaciales',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'CC BY-SA 4.0 for expressly listed releases; legal-reserve records excluded',
    notes: 'Official monthly parcel, construction and nomenclature data for municipalities within the relevant cadastral-manager coverage. Pin manager, release, class, field and licence; a parcel or nomenclature point is not postal geometry, a person record or an automatic address-building relation.',
  },
  'igac-colombia-sinic-open-constructions': {
    id: 'igac-colombia-sinic-open-constructions',
    name: 'IGAC SINIC open cadastral constructions',
    url: 'https://sigi.igac.gov.co/habilitacion/rest/services/sinic/SINIC_DA/FeatureServer',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'Service metadata states no use limitations; exact layer/release licence and exceptions must be pinned',
    notes: 'Official bimonthly cadastral land, construction and construction-unit context reported by cadastral managers. Coverage, legal exceptions and stable identifiers remain source-specific; geometry alone does not establish a postal assignment, civic address, owner, occupant or explicit address-building relation.',
  },
  'osm-colombia': {
    id: 'osm-colombia',
    name: 'OpenStreetMap Colombia',
    url: 'https://wiki.openstreetmap.org/wiki/Colombia',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separately attributed ODbL partition and are not 4-72, DANE, IGAC, cadastral, occupant or exact civic-address-to-building authority.',
  },
  'mtc-peru-postcode-lookup': {
    id: 'mtc-peru-postcode-lookup', name: 'MTC Código Postal Nacional lookup', url: 'https://www.codigopostal.gob.pe/pages/invitado/consultaSimple.jsf',
    kind: 'postal-code', coverage: 'country', usage: 'primary',
    notes: 'Official five-digit location, address, urban nucleus, point-of-interest and populated-centre lookup. Record only permitted time-bound observations with endpoint state and digest. The viewer says geographic boundaries are referential; a result is not bulk data, reusable official polygon, occupant proof or building relation.',
  },
  'mtc-peru-postcode-open-data-2018': {
    id: 'mtc-peru-postcode-open-data-2018', name: 'MTC Código Postal Peru open dataset, 2018', url: 'https://www.datosabiertos.gob.pe/dataset/mtc-codigo-postal-peru',
    kind: 'postal-code', coverage: 'country', usage: 'primary', license: 'Open Data Commons Attribution License; exact 2018 release, catalog snapshot, attribution and digest required',
    notes: 'Official 23 March 2018 XLSX assignment table. It is dated and must not be presented as current without revalidation. The spreadsheet is not a polygon release, address corpus, deliverability proof or building relation.',
  },
  'mtc-peru-cpn-legal-2011': {
    id: 'mtc-peru-cpn-legal-2011', name: 'Decreto Supremo 007-2011-MTC Código Postal Nacional', url: 'https://www.gob.pe/institucion/mtc/normas-legales/322604-007-2011-mtc',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Legal and technical framework assigning MTC administration, updating and dissemination of the CPN. A statute and linked technical annexes are not current assignment rows, a bulk address dataset, geometry release or building relation.',
  },
  'mtc-peru-cpn-structure-2017': {
    id: 'mtc-peru-cpn-structure-2017', name: 'MTC postal-sector statistics and CPN structure, 2017', url: 'https://portal.mtc.gob.pe/comunicaciones/regulacion_internacional/estadistica_catastro/documentos/2017/postales/BoletinEstadisticoSectorPostal-anual2017.pdf',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Dated official evidence for 2,670 codes and five-digit semantics: department or region, road-network routing zone, then postal district, locality, populated centre or urban concentration. Publication maps are not a reusable current geometry release.',
  },
  'upu-peru-designated-operator': {
    id: 'upu-peru-designated-operator', name: 'UPU Peru addressing and designated-operator profile', url: 'https://www.upu.int/en/postal-solutions/programmes-services/addressing-solutions?cid=234&csid=20',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'UPU identifies SERPOST as the designated operator. Institutional and general addressing context is not a current MTC assignment table, bulk address corpus, geometry release or exact building relation.',
  },
  'inei-peru-ubigeo-2022': {
    id: 'inei-peru-ubigeo-2022', name: 'INEI Peru Ubigeo 2022', url: 'https://www.datosabiertos.gob.pe/dataset/ubigeos-c%C3%B3digos-de-ubicaci%C3%B3n-geogr%C3%A1fica-instituto-nacional-de-estad%C3%ADstica-e-inform%C3%A1tica-3',
    kind: 'gazetteer', coverage: 'country', usage: 'reference',
    notes: 'Official department, province and district identifiers for statistical and administrative joins. Pin the exact edition and terms; identity is not an MTC assignment, postcode geometry, civic address or building relation.',
  },
  'ign-peru-open-boundaries-settlements': {
    id: 'ign-peru-open-boundaries-settlements', name: 'IGN Peru open referential boundaries and populated centres', url: 'https://www.datosabiertos.gob.pe/node/9204/revisions/23616/view',
    kind: 'admin-boundary', coverage: 'country', usage: 'reference', license: 'Open Data Commons Attribution License; release, scale, attribution and digest required',
    notes: 'Official referential department, province and district boundaries plus separate populated-centre releases. They are administrative and cartographic context, not MTC assignments, postcode polygons or exact civic-address-to-building links.',
  },
  'geo-vivienda-pe': {
    id: 'geo-vivienda-pe', name: 'GeoVivienda Peru', url: 'https://geo.vivienda.gob.pe/',
    kind: 'admin-boundary', coverage: 'country', usage: 'reference',
    notes: 'MVCS housing and urban geospatial portal. Each layer requires current availability, producer, edition, jurisdiction, terms, CRS, coverage and digest; portal visibility is not MTC assignment, postal geometry or building-link authority.',
  },
  'cofopri-peru-geo-llaqta': {
    id: 'cofopri-peru-geo-llaqta', name: 'COFOPRI Geo Llaqta and urban-cadastre services', url: 'https://www.idep.gob.pe/wms/wms_cofopri.html',
    kind: 'cadastre', coverage: 'country', usage: 'reference',
    notes: 'Official street, lot, block, settlement and construction context with layer-specific coverage. Pin endpoint, layer, jurisdiction, terms, privacy, vintage, CRS and digest; cadastral visibility is not postal assignment, nationwide completeness, owner-data permission or an automatic address-building link.',
  },
  'osm-peru': {
    id: 'osm-peru', name: 'OpenStreetMap Peru', url: 'https://wiki.openstreetmap.org/wiki/Peru',
    kind: 'address', coverage: 'country', usage: 'validation', license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separate ODbL provenance partition and are not MTC, SERPOST, INEI, IGN, GeoVivienda, COFOPRI, cadastral, owner, occupant or exact address-building authority.',
  },
  'codigo-postal-ec': {
    id: 'codigo-postal-ec',
    name: 'Sistema Código Postal Ecuador',
    url: 'https://www.codigopostal.gob.ec/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public official lookup; no blanket bulk polygon redistribution grant identified',
    notes: 'Official MINTEL postal lookup for the six-digit province-district-postal-zone code. The site accepts address, place, code and CUEN searches and describes its adjusted cartography as referential and unsuitable for precision projects. A lookup observation or rendered boundary is time-bound evidence, not a reusable bulk polygon, cadastral parcel, building footprint or delivery entitlement.',
  },
  'codigo-postal-ec-technical-standard': {
    id: 'codigo-postal-ec-technical-standard',
    name: 'Norma Técnica del Código Postal Ecuatoriano',
    url: 'https://www.gob.ec/sites/default/files/regulations/2018-11/Documento_Norma-Tecnica-Codigo-Postal-Ecuatoriano.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Official legal publication; not a data redistribution licence',
    notes: 'The national technical standard defines six numeric digits: two for province, two for planning district and two for postal zone. It establishes the postal zone as a territorial portion and provides system semantics, not current reusable assignments, digital polygons, addresses, buildings or a perpetual boundary release.',
  },
  'dinarp-ecuador-postal-interoperability': {
    id: 'dinarp-ecuador-postal-interoperability',
    name: 'DINARP postal interoperability catalog',
    url: 'https://www.registrospublicos.gob.ec/wp-content/uploads/downloads/2023/08/anexo_2_-_interoperabilidad_-_catalogo_de_datos_-_libre_acceso_y_justificacion_juridica-ago_2023-1.pdf',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'Institutional interoperability access; exact authorization, purpose and response terms required',
    notes: 'The official catalog enumerates postal-zone, street-intersection, locality, parish, latitude and longitude fields. Catalog metadata is not anonymous API authorization, bulk redistribution rights, postal polygon bytes, a building footprint or an exact civic-address-to-building relation.',
  },
  'inec-ecuador-census-cartography': {
    id: 'inec-ecuador-census-cartography',
    name: 'INEC Cartografía Censal WMS 2022',
    url: 'https://idgn.ecuadorencifras.gob.ec/server/rest/services/Cartografia_Censal_WMS_2022/MapServer',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'INEC statistical cartography use and distribution policy; exact service and download terms apply',
    notes: 'Official census layers include localities, road axes, entrances, blocks and census-building multipoints with census identifiers. They are statistical operational context without metric precision or jurisdictional proof and are not postal assignments, cadastral parcels, address registers, footprints, occupants or automatic building links.',
  },
  'igm-ecuador-base-cartography': {
    id: 'igm-ecuador-base-cartography',
    name: 'Instituto Geográfico Militar Ecuador base cartography',
    url: 'https://www.geoportaligm.gob.ec/portal/index.php/descargas/cartografia-de-libre-acceso/registro/',
    kind: 'data-catalog',
    coverage: 'country',
    usage: 'reference',
    license: 'Artifact-specific IGM licence; some products restrict commercial use and redistribution',
    notes: 'Official base-cartography discovery and OGC services. Every selected artifact must pin scale, vintage, CRS, licence and digest. IGM reference geography is not postal assignment authority, a precise postal boundary, civic address, parcel, building relation or blanket publication permission.',
  },
  'sistema-nacional-catastro-ecuador': {
    id: 'sistema-nacional-catastro-ecuador',
    name: 'Sistema Nacional de Catastro and national cadastral standard',
    url: 'https://www.registrospublicos.gob.ec/sistema-nacional-de-catastro/',
    kind: 'data-catalog',
    coverage: 'country',
    usage: 'reference',
    license: 'Municipal and artifact-specific access, privacy and reuse conditions',
    notes: 'The national framework standardizes an integrated georeferenced cadastre, while municipal and metropolitan GADs remain responsible for their urban and rural cadastral data. A national framework page is not an open parcel corpus; parcel, owner, resident, value, unit and property identifiers require exact local authority and privacy review.',
  },
  'osm-ecuador': {
    id: 'osm-ecuador',
    name: 'OpenStreetMap Ecuador',
    url: 'https://wiki.openstreetmap.org/wiki/Ecuador',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separate ODbL provenance partition and are not MINTEL, DINARP, INEC, IGM, cadastral, occupant or exact address-building authority.',
  },
  'correos-el-salvador': {
    id: 'correos-el-salvador',
    name: 'Dirección General de Correos de El Salvador',
    url: 'https://www.correos.gob.sv/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public official website; no blanket bulk assignment or polygon redistribution grant identified',
    notes: 'Official postal operator operational reference. The public site lists services and offices but no versioned reusable national bulk assignment or postal-polygon release was identified; page or permitted lookup observations are time-bound evidence, not bulk assignment rows, polygon bytes, parcels, buildings or delivery entitlements.',
  },
  'upu-el-salvador-addressing-2019': {
    id: 'upu-el-salvador-addressing-2019',
    name: 'UPU El Salvador addressing sheet (May 2019)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/SLVEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Official intergovernmental publication; not a data redistribution licence',
    notes: 'The dated UPU sheet specifies four digits for region, department, locality or delivery area, and distribution and places the code left of the locality. It supplies format semantics, not current assignments, reusable digital geometry, exact addresses, buildings or a perpetual boundary release.',
  },
  'cnr-el-salvador-geographic-codes': {
    id: 'cnr-el-salvador-geographic-codes',
    name: 'CNR national geographic location codes',
    url: 'https://www.cnr.gob.sv/codigos-de-ubicaciones-geograficas-nacionales/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Public downloadable artifacts; exact terms, administrative vintage and redistribution rights must be pinned',
    notes: 'CNR publishes two-digit department, four-digit municipality and six-digit canton location codes plus municipality GeoJSON and Shapefile context. These are administrative codes, not postal codes; administrative polygons are not postal boundaries, address points, parcels, building footprints or exact address-building relations.',
  },
  'onec-el-salvador-geographic-catalog': {
    id: 'onec-el-salvador-geographic-catalog',
    name: 'ONEC El Salvador geographic catalog',
    url: 'https://onec.bcr.gob.sv/clasificadoresv2/Clasificadores/Index/195?tipo=11',
    kind: 'statistics',
    coverage: 'country',
    usage: 'reference',
    license: 'Official statistical reference; exact catalog vintage and artifact terms apply',
    notes: 'Official statistical geographic identities require a pinned vintage. The 2019 catalog and current post-2023 department-municipality-district hierarchy need an explicit crosswalk; these identities are not postal assignments, postal polygons, parcels, buildings or delivery authority.',
  },
  'cnr-el-salvador-cadastre': {
    id: 'cnr-el-salvador-cadastre',
    name: 'CNR geographic and national cadastre services',
    url: 'https://www.cnr.gob.sv/servicios/detalle-de-servicios-del-instituto-geografico-y-del-catastro-nacional/',
    kind: 'data-catalog',
    coverage: 'country',
    usage: 'reference',
    license: 'Paid or purpose-bound products; exact access, field, privacy and redistribution terms required',
    notes: 'Official paid cadastral location and parcel products may contain parcel graphics, addresses, owners, neighbors and registration context. A parcel is not postal geometry or an automatic address-building relation, and personal or property fields require explicit lawful purpose, minimisation and publication authority.',
  },
  'osm-el-salvador': {
    id: 'osm-el-salvador',
    name: 'OpenStreetMap El Salvador',
    url: 'https://wiki.openstreetmap.org/wiki/El_Salvador',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Community roads, addresses and buildings remain in a separate ODbL provenance partition and are not Correos, UPU, CNR, ONEC, cadastral, occupant or exact address-building authority.',
  },
  'ide-uy': {
    id: 'ide-uy',
    name: 'Infraestructura de Datos Espaciales de Uruguay',
    url: 'https://www.gub.uy/infraestructura-datos-espaciales/',
    kind: 'data-catalog',
    coverage: 'country',
    usage: 'reference',
    license: 'Artifact-specific; open catalog resources commonly use Licencia de Datos Abiertos de Uruguay',
    notes: 'Official national discovery and interoperability context. Each selected boundary, road, locality or address resource retains its producer, resource UUID, release, CRS, validity, licence and digest; catalog presence is not postal assignment or building authority.',
  },
  'ide-py': {
    id: 'ide-py',
    name: 'Paraguay Infraestructura de Datos Espaciales',
    url: 'https://www.ine.gov.py/noticias/2459/paraguay-se-encuentra-a-un-paso-de-contar-con-una-infraestructura-de-datos-espaciales',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Paraguay national spatial data infrastructure reference from INE.',
  },
  'noaa-etopo': {
    id: 'noaa-etopo',
    name: 'NOAA NCEI ETOPO Global Relief Model',
    url: 'https://www.ncei.noaa.gov/products/etopo-global-relief-model',
    kind: 'elevation',
    coverage: 'global',
    usage: 'reference',
    license: 'NOAA open data terms',
    notes: 'Global land topography, seafloor bathymetry, and shoreline relief for mountains, trenches, continental shelves, islands, and coastal context across the Americas.',
  },
  'geobc-global-multi-resolution-topography': {
    id: 'geobc-global-multi-resolution-topography',
    name: 'Global Multi-Resolution Topography',
    url: 'https://www.gmrt.org/',
    kind: 'marine',
    coverage: 'global',
    usage: 'reference',
    license: 'GMRT terms of use',
    notes: 'Marine and coastal topography reference for Caribbean, Atlantic, Pacific, Arctic, seamount, ridge, shelf, and island address context.',
  },
  hydrosheds: {
    id: 'hydrosheds',
    name: 'HydroSHEDS',
    url: 'https://www.hydrosheds.org/',
    kind: 'hydrology',
    coverage: 'global',
    usage: 'reference',
    license: 'Free for non-commercial use; check HydroSHEDS license for redistribution',
    notes: 'Hydrographic basins, river networks, lakes, and drainage context for Amazon, Orinoco, La Plata, Mississippi, Mackenzie, and Caribbean water-adjacent locations.',
  },
  'protected-planet-wdpa': {
    id: 'protected-planet-wdpa',
    name: 'Protected Planet WDPA',
    url: 'https://www.protectedplanet.net/en/thematic-areas/wdpa',
    kind: 'protected-area',
    coverage: 'global',
    usage: 'reference',
    license: 'UNEP-WCMC and IUCN terms',
    notes: 'Protected terrestrial and marine areas for national parks, reserves, Indigenous protected areas, marine parks, and conservation-region address context.',
  },
  'gbif-occurrence': {
    id: 'gbif-occurrence',
    name: 'GBIF Occurrence API',
    url: 'https://techdocs.gbif.org/en/openapi/v1/occurrence',
    kind: 'biodiversity',
    coverage: 'global',
    usage: 'reference',
    license: 'Varies by dataset record',
    notes: 'Species occurrence and biodiversity evidence for ecosystem, habitat, rainforest, desert, wetland, and protected-nature context.',
  },
  'esa-worldcover': {
    id: 'esa-worldcover',
    name: 'ESA WorldCover',
    url: 'https://esa-worldcover.org/en/data-access',
    kind: 'land-cover',
    coverage: 'global',
    usage: 'reference',
    license: 'Free and open data access',
    notes: 'Land-cover reference for forest, grassland, wetland, mangrove, cropland, desert, snow, bare ground, and urban-edge address context.',
  },
  'usgs-3dep': {
    id: 'usgs-3dep',
    name: 'USGS 3D Elevation Program',
    url: 'https://www.usgs.gov/3d-elevation-program',
    kind: 'elevation',
    coverage: 'country',
    usage: 'reference',
    license: 'U.S. public domain',
    notes: 'High-resolution U.S. elevation and terrain source for mountains, valleys, slopes, ridges, floodplains, and domestic natural-address context.',
  },
  'nrcan-geospatial': {
    id: 'nrcan-geospatial',
    name: 'Natural Resources Canada Geospatial Data, Tools and Services',
    url: 'https://natural-resources.canada.ca/science-data/data-analysis/geospatial-data-tools-services/geospatial-data-tools-services',
    kind: 'environment',
    coverage: 'country',
    usage: 'reference',
    license: 'Open Government Licence - Canada',
    notes: 'Canadian open geospatial foundation data, including elevation, hydrography, Arctic, land, water, and infrastructure reference layers.',
  },
  'conabio-geoportal': {
    id: 'conabio-geoportal',
    name: 'CONABIO Geoportal',
    url: 'https://www.conabio.gob.mx/informacion/gis/',
    kind: 'biodiversity',
    coverage: 'country',
    usage: 'reference',
    notes: 'Mexico biodiversity and ecological cartography reference for protected areas, habitats, vegetation, species, and regional Spanish place context.',
  },
  'ibge-geosciences': {
    id: 'ibge-geosciences',
    name: 'IBGE Geosciences Downloads',
    url: 'https://downloads.ibge.gov.br/',
    kind: 'environment',
    coverage: 'country',
    usage: 'reference',
    notes: 'Brazilian official geoscience, cartography, natural resources, environmental, relief, and territorial reference datasets.',
  },
  'inpe-terrabrasilis': {
    id: 'inpe-terrabrasilis',
    name: 'INPE TerraBrasilis',
    url: 'https://terrabrasilis.dpi.inpe.br/',
    kind: 'land-cover',
    coverage: 'country',
    usage: 'reference',
    notes: 'Brazilian environmental monitoring platform for Amazon, Cerrado, forest cover, deforestation, fire, and biome-aware address context.',
  },
};

export const AMERICAS_COUNTRY_CODES = [
  'US', 'CA', 'MX', 'GL', 'PM', 'PR', 'GU', 'VI', 'AS', 'MP',
  'CU', 'DO', 'HT', 'JM', 'TT', 'BB', 'KN', 'AG', 'DM', 'LC', 'VC', 'GD', 'BS',
  'GP', 'MQ', 'BL', 'MF', 'CP',
  'BZ', 'GT', 'HN', 'SV', 'NI', 'CR', 'PA',
  'BQ', 'AW', 'CW', 'SX', 'AI', 'BM', 'MS', 'KY', 'TC', 'VG',
  'BR', 'AR', 'CL', 'CO', 'PE', 'EC', 'BO', 'PY', 'UY', 'VE', 'GY', 'SR', 'GF', 'FK', 'GS',
] as const;

export type AmericasCountryCode = (typeof AMERICAS_COUNTRY_CODES)[number];

const BASE_OPEN_SOURCE_IDS: AmericasOpenGeoSourceId[] = [
  'osm-nominatim',
  'osm-overpass',
  'openaddresses',
  'geonames-postal',
  'geonames-gazetteer',
  'geoboundaries',
  'upu-addressing',
  'zippopotam',
  'noaa-etopo',
  'geobc-global-multi-resolution-topography',
  'hydrosheds',
  'protected-planet-wdpa',
  'gbif-occurrence',
  'esa-worldcover',
  'usgs-3dep',
  'nrcan-geospatial',
  'conabio-geoportal',
  'ibge-geosciences',
  'inpe-terrabrasilis',
];

const COUNTRY_SOURCE_IDS: Partial<Record<AmericasCountryCode, AmericasOpenGeoSourceId[]>> = {
  US: ['usps-web-tools', 'usps-ais-products', 'usps-publication-28-2024', 'usps-zip-code-lookup', 'us-census-zcta-2020', 'us-census-tiger-line', 'us-census-geocoder', 'usdot-national-address-database', 'usgs-national-structures-dataset', 'hud-usps-zip-crosswalk', 'osm-united-states'],
  CA: ['canada-post-postal', 'canada-post-addresscomplete', 'canada-post-licensed-postal-data', 'statcan-pccf-licensed', 'statcan-census-fsa-2021', 'statcan-national-address-register', 'statcan-open-database-buildings', 'osm-canada'],
  DO: ['inposdom-postcode-search', 'upu-dominican-republic-addressing-2005', 'one-dominican-territorial-division-2021', 'iderd-dominican-geoservices', 'ign-dominican-cartographic-base', 'registro-inmobiliario-dominican-cadastre', 'osm-dominican-republic'],
  HT: ['office-postes-haiti-postcode-search', 'upu-haiti-addressing-2017', 'ihsi-haiti-territorial-codes', 'ihsi-haiti-admin-2024', 'cnigs-haiti-reference-geodata', 'osm-haiti'],
  PA: ['correos-panama-postal-system-2026', 'panama-postal-code-api-2026', 'upu-panama-addressing-2015', 'inec-panama-territorial-coding', 'ign-panama-dpa-2025', 'osm-panama'],
  CU: ['correos-cuba-postal', 'upu-cuba-addressing-2004', 'upu-cuba-postcode-data', 'mincom-cuba-postal-law', 'iderc-cuba-geoportal', 'onei-cuba-dpa', 'geocuba-cartography', 'osm-cuba'],
  MX: ['correos-mexico', 'sepomex-postal-polygons-2025', 'mexico-postal-service-law', 'upu-mexico-addressing-2017', 'inegi-mexico-geo-key-service', 'inegi-mexico-geostatistical-framework-2025', 'inegi-mexico-address-standard-2024', 'inegi-mexico-denue-2025', 'osm-mexico'],
  CR: ['correos-cr-postal', 'upu-costa-rica-addressing-2009', 'upu-costa-rica-address-policy-case-study', 'inec-cr-geographic-classification', 'inec-cr-uged-2024', 'snit-cr', 'snit-cr-terms', 'osm-costa-rica'],
  NI: ['correos-nicaragua-postcode-search', 'upu-nicaragua-addressing-2014', 'inide-nicaragua-territorial-2023', 'ineter-ni-ide', 'ineter-nicaragua-cartographic-base', 'ineter-nicaragua-cadastral-ide', 'osm-nicaragua'],
  GT: ['correos-guatemala-postal', 'correos-guatemala-postcode-directory', 'upu-guatemala-addressing-2025', 'correos-guatemala-postal-legal-framework', 'segeplan-gt-ide', 'ine-guatemala-census-settlements', 'ign-guatemala-cartography', 'ric-guatemala-cadastre', 'osm-guatemala'],
  BZ: ['belize-statistical-institute'],
  GL: ['postnord-greenland', ...getPolarOpenSourceIds('GL')],
  PM: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  GP: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  MQ: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  BL: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  MF: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  CP: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  BR: ['correios-cep-api', 'correios-dne-licensing', 'upu-brazil-addressing', 'ibge-cnefe-2022', 'ibge-municipal-mesh-2024', 'ibge-cartographic-base-2023', 'inde-brazil', 'osm-brazil', 'viacep-br', 'brasilapi'],
  AR: ['correo-argentino-cpa', 'georef-ar', 'ign-argentina-geospatial', 'idera-argentina', 'argentina-cadastre-law-26209', 'osm-argentina'],
  CL: ['correos-chile-postcode-lookup', 'correos-chile-normalization-api', 'upu-chile-addressing-2017', 'ide-chile-dpa-2023', 'subdere-chile-cut', 'ine-chile-open-geodata', 'sii-chile-digital-cadastre', 'geoportal-cl', 'osm-chile'],
  CO: ['codigo-postal-colombia-472-viewer', 'codigo-postal-colombia-csv', 'codigo-postal-colombia-shapefile', 'codigo-postal-colombia-open-license', 'codigo-postal-colombia-arcgis', 'upu-colombia-addressing-2022', 'upu-colombia-s42-2021', 'dane-colombia-divipola-mgn-2025', 'igac-colombia-open-cadastre', 'igac-colombia-sinic-open-constructions', 'colombia-en-mapas', 'osm-colombia'],
  PE: ['mtc-peru-postcode-lookup', 'mtc-peru-postcode-open-data-2018', 'mtc-peru-cpn-legal-2011', 'mtc-peru-cpn-structure-2017', 'upu-peru-designated-operator', 'inei-peru-ubigeo-2022', 'ign-peru-open-boundaries-settlements', 'geo-vivienda-pe', 'cofopri-peru-geo-llaqta', 'osm-peru'],
  EC: ['codigo-postal-ec', 'codigo-postal-ec-technical-standard', 'dinarp-ecuador-postal-interoperability', 'inec-ecuador-census-cartography', 'igm-ecuador-base-cartography', 'sistema-nacional-catastro-ecuador', 'osm-ecuador'],
  SV: ['correos-el-salvador', 'upu-el-salvador-addressing-2019', 'cnr-el-salvador-geographic-codes', 'onec-el-salvador-geographic-catalog', 'cnr-el-salvador-cadastre', 'osm-el-salvador'],
  PY: ['ide-py'],
  UY: ['correo-uruguayo-postal-polygons', 'correo-uruguayo-address-services', 'ide-uy-addresses', 'ide-uy', 'dnc-uy-parcels', 'osm-uruguay'],
  VE: ['ipostel-venezuela-postcode-lookup', 'upu-venezuela-addressing-2019', 'ine-venezuela-populated-places-2001', 'igvsb-venezuela-geographic-authority', 'venezuela-geography-cartography-cadastre-law-2000', 'osm-venezuela'],
  GF: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  AI: ['british-overseas-postal-reference', 'anguilla-post', 'anguilla-gov-gis'],
  BM: ['british-overseas-postal-reference', 'bermuda-post', 'bermuda-gov-maps'],
  VG: ['british-overseas-postal-reference', 'bvi-post', 'bvi-gis'],
  KY: ['british-overseas-postal-reference', 'cayman-post', 'cayman-lands-survey'],
  MS: ['british-overseas-postal-reference', 'montserrat-post', 'montserrat-gis'],
  TC: ['british-overseas-postal-reference', 'turks-caicos-post', 'turks-caicos-gis'],
  FK: ['falkland-islands-post', 'falkland-islands-gis'],
  GS: ['british-overseas-postal-reference', 'south-georgia-gis', ...getPolarOpenSourceIds('GS')],
};

export function getAmericasOpenSourceIds(countryCode: string): AmericasOpenGeoSourceId[] {
  const code = countryCode.toUpperCase() as AmericasCountryCode;
  return [...new Set([...(COUNTRY_SOURCE_IDS[code] ?? []), ...BASE_OPEN_SOURCE_IDS])];
}

export const AMERICAS_COUNTRY_OPEN_SOURCE_IDS = AMERICAS_COUNTRY_CODES.reduce(
  (sourcesByCountry, countryCode) => ({
    ...sourcesByCountry,
    [countryCode]: getAmericasOpenSourceIds(countryCode),
  }),
  {} as Record<AmericasCountryCode, AmericasOpenGeoSourceId[]>,
);
