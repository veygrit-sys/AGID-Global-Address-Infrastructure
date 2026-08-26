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
  | 'correos-mexico'
  | 'correos-cr-postal'
  | 'snit-cr'
  | 'ineter-ni-ide'
  | 'segeplan-gt-ide'
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
  | 'viacep-br'
  | 'brasilapi'
  | 'georef-ar'
  | 'geoportal-cl'
  | 'colombia-en-mapas'
  | 'geo-vivienda-pe'
  | 'codigo-postal-ec'
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
    | 'topography';
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
    name: 'Canada Post Postal Code Lookup',
    url: 'https://www.canadapost-postescanada.ca/cpc/en/tools/find-a-postal-code.page',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Canadian postal-code lookup reference; use as a reference source, not a bundled open dataset.',
  },
  'correos-mexico': {
    id: 'correos-mexico',
    name: 'Correos de Mexico Codigo Postal',
    url: 'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Descarga.aspx',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Mexican postal-code reference for states, municipalities, settlements, and colonia names.',
  },
  'correos-cr-postal': {
    id: 'correos-cr-postal',
    name: 'Correos de Costa Rica Codigo Postal',
    url: 'https://correos.go.cr/codigo-postal/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Costa Rica postal-code lookup.',
  },
  'snit-cr': {
    id: 'snit-cr',
    name: 'SNIT Costa Rica',
    url: 'https://www.snitcr.go.cr/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Costa Rica national territorial information system and OGC service reference.',
  },
  'ineter-ni-ide': {
    id: 'ineter-ni-ide',
    name: 'INETER IDE Nicaragua',
    url: 'https://www.ineter.gob.ni/ideineter.html',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Nicaragua official spatial data infrastructure for national geospatial reference layers.',
  },
  'segeplan-gt-ide': {
    id: 'segeplan-gt-ide',
    name: 'SEGEPLAN Geoportal Guatemala',
    url: 'https://ideg.segeplan.gob.gt/geoportal/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Guatemala official geoportal for administrative and planning geodata.',
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
  'viacep-br': {
    id: 'viacep-br',
    name: 'ViaCEP',
    url: 'https://viacep.com.br/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Free Brazilian CEP webservice with JSON/XML postal-code lookup and address search.',
  },
  brasilapi: {
    id: 'brasilapi',
    name: 'BrasilAPI',
    url: 'https://brasilapi.com.br/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    notes: 'Open-source Brazilian API project with CEP endpoints and public Brazilian reference data.',
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
    name: 'Geoportal de Chile',
    url: 'https://geoportal.cl/catalog',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Chile national geospatial catalog for administrative and territorial reference data.',
  },
  'colombia-en-mapas': {
    id: 'colombia-en-mapas',
    name: 'Colombia en Mapas',
    url: 'https://www.colombiaenmapas.gov.co/inicio',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Colombian official map portal for territorial, administrative, and geographic reference layers.',
  },
  'geo-vivienda-pe': {
    id: 'geo-vivienda-pe',
    name: 'GeoVivienda Peru',
    url: 'https://geo.vivienda.gob.pe/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Peru housing and urban geospatial portal for address-adjacent territorial reference layers.',
  },
  'codigo-postal-ec': {
    id: 'codigo-postal-ec',
    name: 'Codigo Postal Ecuador',
    url: 'https://www.codigopostal.gob.ec/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Ecuador postal-code lookup from the telecommunications ministry.',
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
  CA: ['canada-post-postal'],
  MX: ['correos-mexico'],
  CR: ['correos-cr-postal', 'snit-cr'],
  NI: ['ineter-ni-ide'],
  GT: ['segeplan-gt-ide'],
  BZ: ['belize-statistical-institute'],
  GL: ['postnord-greenland', ...getPolarOpenSourceIds('GL')],
  PM: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  GP: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  MQ: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  BL: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  MF: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  CP: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  BR: ['viacep-br', 'brasilapi'],
  AR: ['correo-argentino-cpa', 'georef-ar', 'ign-argentina-geospatial', 'idera-argentina', 'argentina-cadastre-law-26209', 'osm-argentina'],
  CL: ['geoportal-cl'],
  CO: ['colombia-en-mapas'],
  PE: ['geo-vivienda-pe'],
  EC: ['codigo-postal-ec'],
  PY: ['ide-py'],
  UY: ['correo-uruguayo-postal-polygons', 'correo-uruguayo-address-services', 'ide-uy-addresses', 'ide-uy', 'dnc-uy-parcels', 'osm-uruguay'],
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
