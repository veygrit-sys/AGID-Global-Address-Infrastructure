import {
POLAR_OPEN_GEO_SOURCES,
getPolarOpenSourceIds,
type PolarOpenGeoSourceId,
} from './polarOpenGeoSources';

export type EuropeOpenGeoSourceId =
  | PolarOpenGeoSourceId
  | 'osm-nominatim'
  | 'osm-overpass'
  | 'openaddresses'
  | 'geonames-postal'
  | 'geonames-gazetteer'
  | 'geoboundaries'
  | 'upu-addressing'
  | 'natural-earth-admin'
  | 'whosonfirst'
  | 'hot-osm-africa'
  | 'openstreetmap-wiki-africa'
  | 'humdata-africa'
  | 'openaerialmap'
  | 'digital-earth-africa-dem'
  | 'digital-earth-africa-coastlines'
  | 'digital-earth-africa-waterbodies'
  | 'digital-earth-africa-wofs'
  | 'digital-earth-africa-fractional-cover'
  | 'digital-earth-africa-geomad'
  | 'fao-wapor'
  | 'esa-worldcover'
  | 'gebco-bathymetry'
  | 'gmrt-topography'
  | 'global-mangrove-watch'
  | 'allen-coral-atlas'
  | 'protected-planet-wdpa'
  | 'gbif-occurrence'
  | 'rcmrd-gmes-africa-geoportal'
  | 'noaa-etopo'
  | 'geobc-global-multi-resolution-topography'
  | 'hydrosheds'
  | 'usgs-3dep'
  | 'nrcan-geospatial'
  | 'conabio-geoportal'
  | 'ibge-geosciences'
  | 'inpe-terrabrasilis'
  | 'jaxa-aw3d30'
  | 'pacific-data-hub'
  | 'digital-earth-pacific'
  | 'pacioos'
  | 'copernicus-dem'
  | 'copernicus-corine-land-cover'
  | 'emodnet-bathymetry'
  | 'emodnet-seabed-habitats'
  | 'eea-natura-2000'
  | 'eea-eunis-habitats'
  | 'jrc-esdac-soils'
  | 'zippopotam'
  | 'data-gouv-fr-postcodes'
  | 'ban-fr'
  | 'ign-bd-topo'
  | 'insee-cog'
  | 'deutsche-post-plz-server'
  | 'openplzapi'
  | 'opendatasoft-nl-postcodes'
  | 'pdok-bag'
  | 'cbs-nl-postcode-areas'
  | 'odwb-be-postcodes'
  | 'postcodes-io'
  | 'ons-postcode-directory'
  | 'ordnance-survey-open-names'
  | 'ordnance-survey-boundary-line'
  | 'ordnance-survey-open-uprn'
  | 'ordnance-survey-openmap-local'
  | 'ideal-postcodes-reference'
  | 'civictechsweden-posmkod'
  | 'lantmateriet-sweden'
  | 'trafikverket-sweden'
  | 'scb-sweden-geodata'
  | 'data-norge'
  | 'kartverket-norway'
  | 'geonorge-norway'
  | 'brreg-address-register'
  | 'postcode-eu'
  | 'dataforsyningen-denmark'
  | 'danish-address-register-dar'
  | 'geodanmark'
  | 'posti-finland-postal-code-services'
  | 'avoindata-fi-postcodes'
  | 'nls-finland'
  | 'maanmittauslaitos-open-data'
  | 'dvv-finland-address-data'
  | 'latvijas-pasts-check-address'
  | 'kartes-lv-postal-codes'
  | 'lgia-latvia'
  | 'vzd-latvia-address-register'
  | 'data-gov-lv-geodata'
  | 'maaamet-estonia'
  | 'estonia-address-data-system'
  | 'xgis-estonia'
  | 'omniva-estonia-postcodes'
  | 'estonia-aks-postal-codes'
  | 'estonia-aks-postal-areas'
  | 'estonia-aks-address-objects'
  | 'estonia-aks-building-shapes'
  | 'estonia-ehak-admin-boundaries'
  | 'lietuvos-pastas-postcode-search'
  | 'geoportal-lt'
  | 'registru-centras-address-register'
  | 'open-data-lithuania'
  | 'okfn-index-postcodes'
  | 'lmmi-iceland'
  | 'iceland-national-registry-addresses'
  | 'island-is-open-data'
  | 'posturinn-iceland-postcodes'
  | 'natt-is50v-postcode-boundaries'
  | 'hms-iceland-address-register'
  | 'natt-is50v-buildings'
  | 'statistics-iceland-geography'
  | 'poste-italiane-cap-search'
  | 'poste-italiane-cap-professional'
  | 'anncsu-italy-addresses'
  | 'istat-italy-admin-boundaries'
  | 'italy-regional-dbgt-buildings'
  | 'eurostat-gisco-postcodes'
  | 'elta-gr'
  | 'istat-italy-geodata'
  | 'agenzia-entrate-catasto'
  | 'geoportale-nazionale-italy'
  | 'ign-spain-cnig'
  | 'catastro-spain'
  | 'idee-spain'
  | 'dgterritorio-portugal'
  | 'snig-portugal'
  | 'bupi-portugal'
  | 'ktimatologio-greece'
  | 'geodata-gov-gr'
  | 'okxe-greece'
  | 'pa-malta-geoserver'
  | 'nso-malta-geodata'
  | 'identity-malta-addressing'
  | 'san-marino-geoportal'
  | 'san-marino-statistics'
  | 'monaco-gouv-cartography'
  | 'monaco-imsee-geodata'
  | 'vatican-city-state'
  | 'openstreetmap-vatican'
  | 'andorra-cartografia'
  | 'andorra-open-data'
  | 'cyprus-department-lands-surveys'
  | 'cyprus-open-data-portal'
  | 'inspire-cyprus'
  | 'datahub-postal'
  | 'zauberware-postal-codes'
  | 'eu-postal-code-package'
  | 'postalcodes-info'
  | 'scrape4u-postal-codes'
  | 'spotzi-postal-codes'
  | 'ceska-posta-psc'
  | 'cuzk-ruian'
  | 'cuzk-geoportal'
  | 'posta-hr'
  | 'dgu-croatia-geoportal'
  | 'croatia-cadastre'
  | 'posta-hu'
  | 'lechner-hungary-geodata'
  | 'hungary-public-road-data'
  | 'poczta-polska'
  | 'geoportal-gov-pl'
  | 'gus-teryt-poland'
  | 'posta-si'
  | 'eprostor-slovenia'
  | 'gurs-slovenia'
  | 'slovenska-posta-psc'
  | 'zbgis-slovakia'
  | 'slovakia-address-register'
  | 'ancpi-romania-geoportal'
  | 'romania-open-data'
  | 'cadastre-bulgaria'
  | 'bulgaria-inspire-geoportal'
  | 'data-gov-ua-geodata'
  | 'ukraine-cadastre-map'
  | 'geoportal-moldova'
  | 'moldova-open-data'
  | 'belarus-nca-geoportal'
  | 'rosreestr-nspd'
  | 'russia-open-data-geo'
  | 'geosrbija'
  | 'rgz-serbia'
  | 'bosnia-geoportal'
  | 'bosnia-cadastre-reference'
  | 'geoportal-montenegro'
  | 'montenegro-cadastre'
  | 'kosovo-geoportal'
  | 'kosovo-cadastre'
  | 'asig-albania'
  | 'albania-geoportal'
  | 'katastar-north-macedonia'
  | 'makstat-geodata'
  | 'la-poste-fr-overseas'
  | 'postnord-greenland'
  | 'postnord-faroe'
  | 'posten-norway-svalbard'
  | 'armstat-geodata'
  | 'cadastre-armenia'
  | 'haypost-address-reference'
  | 'geonames-armenia'
  | 'azerbaijan-state-committee-property'
  | 'azerbaijan-open-data'
  | 'azerpost-address-reference'
  | 'geonames-azerbaijan'
  | 'napr-georgia'
  | 'gdi-georgia'
  | 'gpost-address-reference'
  | 'geonames-georgia'
  | 'correos-spain'
  | 'ctt-portugal'
  | 'guernsey-post'
  | 'digimap-guernsey'
  | 'jersey-post'
  | 'jersey-gov-open-data'
  | 'isle-of-man-post'
  | 'isle-of-man-gov-data'
  | 'royal-gibraltar-post'
  | 'gibraltar-gis'
  | 'falkland-islands-post'
  | 'falkland-islands-gis'
  | 'british-overseas-postal-reference'
  | 'south-georgia-gis'
  | 'saint-helena-postal'
  | 'ascension-post-office'
  | 'tristan-post-office'
  | 'saint-helena-gov';

export interface EuropeOpenGeoSource {
  id: EuropeOpenGeoSourceId;
  name: string;
  url: string;
  kind:
    | 'postal-code'
    | 'building'
    | 'address'
    | 'geocoding'
    | 'admin-boundary'
    | 'gazetteer'
    | 'standard'
    | 'data-catalog'
    | 'elevation'
    | 'bathymetry'
    | 'marine'
    | 'cryosphere'
    | 'facility'
    | 'protected-area'
    | 'biodiversity'
    | 'topography';
  coverage: 'global' | 'europe' | 'territory' | 'country' | 'polar' | 'antarctic' | 'arctic' | 'greenland';
  usage: 'primary' | 'fallback' | 'validation' | 'reference';
  license?: string;
  notes: string;
}

export const EUROPE_OPEN_GEO_SOURCES: Record<EuropeOpenGeoSourceId, EuropeOpenGeoSource> = {
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
    notes: 'Open address point and street-address reference data where official sources are indexed.',
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
    notes: 'Open administrative boundaries for regions, provinces, municipalities, parishes, and districts.',
  },
  'natural-earth-admin': {
    id: 'natural-earth-admin',
    name: 'Natural Earth Admin Boundaries',
    url: 'https://www.naturalearthdata.com/downloads/',
    kind: 'admin-boundary',
    coverage: 'global',
    usage: 'reference',
    license: 'Public domain',
    notes: 'Small-scale public-domain country, dependency, and disputed-boundary reference used as a fallback for special territories and disputed regions.',
  },
  whosonfirst: {
    id: 'whosonfirst',
    name: "Who's On First",
    url: 'https://whosonfirst.org/docs/',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    license: 'CC0 / open data, varies by property',
    notes: 'Open gazetteer and placetype hierarchy for countries, dependencies, localities, enclaves, and disputed or special-place aliases.',
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
  'hot-osm-africa': {
    id: 'hot-osm-africa',
    name: 'Humanitarian OpenStreetMap Team Africa',
    url: 'https://www.hotosm.org/',
    kind: 'address',
    coverage: 'territory',
    usage: 'reference',
    license: 'ODbL',
    notes: 'OSM humanitarian mapping reference used by African and Indian Ocean territories with sparse formal addressing.',
  },
  'openstreetmap-wiki-africa': {
    id: 'openstreetmap-wiki-africa',
    name: 'OpenStreetMap Africa Project Pages',
    url: 'https://wiki.openstreetmap.org/wiki/Africa',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    license: 'ODbL',
    notes: 'OSM Africa project index for local names, settlements, roads, coastline, and natural feature tagging references.',
  },
  'humdata-africa': {
    id: 'humdata-africa',
    name: 'Humanitarian Data Exchange Africa',
    url: 'https://data.humdata.org/group/africa',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    license: 'Varies by dataset',
    notes: 'HDX Africa datasets for boundaries, settlements, roads, crisis geography, and natural context near overseas territories.',
  },
  openaerialmap: {
    id: 'openaerialmap',
    name: 'OpenAerialMap',
    url: 'https://map.openaerialmap.org/',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'fallback',
    license: 'Varies by imagery',
    notes: 'Open aerial imagery for validating coastlines, rural settlements, natural areas, and remote territory delivery points.',
  },
  'digital-earth-africa-dem': {
    id: 'digital-earth-africa-dem',
    name: 'Digital Earth Africa SRTM DEM and derivatives',
    url: 'https://docs.digitalearthafrica.org/en/latest/data_specs/SRTM_DEM_specs.html',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Africa elevation and mountain terrain reference for Indian Ocean and African-adjacent overseas territories.',
  },
  'digital-earth-africa-coastlines': {
    id: 'digital-earth-africa-coastlines',
    name: 'Digital Earth Africa Coastlines',
    url: 'https://docs.digitalearthafrica.org/en/latest/data_specs/Coastlines_specs.html',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Coastline and coastal-change vectors for island, sea, beach, port, and waterfront address context.',
  },
  'digital-earth-africa-waterbodies': {
    id: 'digital-earth-africa-waterbodies',
    name: 'Digital Earth Africa Waterbodies',
    url: 'https://docs.digitalearthafrica.org/en/latest/sandbox/notebooks/Datasets/Waterbodies.html',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Waterbody monitoring for lakes, wetlands, rivers, and natural water address context.',
  },
  'digital-earth-africa-wofs': {
    id: 'digital-earth-africa-wofs',
    name: 'Digital Earth Africa Water Observations from Space',
    url: 'https://digitalearthafrica.org/en_za/water-observations-from-space/',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Surface-water recurrence reference for African and Indian Ocean overseas territories with wetland, floodplain, river, and coastal contexts.',
  },
  'digital-earth-africa-fractional-cover': {
    id: 'digital-earth-africa-fractional-cover',
    name: 'Digital Earth Africa Fractional Cover',
    url: 'https://docs.digitalearthafrica.org/en/latest/data_specs/Fractional_Cover_specs.html',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Vegetation, bare-ground, and landscape-cover reference for African-linked overseas territory natural address context.',
  },
  'digital-earth-africa-geomad': {
    id: 'digital-earth-africa-geomad',
    name: 'Digital Earth Africa GeoMAD Cloud-Free Composites',
    url: 'https://docs.digitalearthafrica.org/en/latest/data_specs/GeoMAD_specs.html',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Cloud-free imagery composites for validating coastlines, water edges, natural features, and settlements in overlapping territory metadata.',
  },
  'fao-wapor': {
    id: 'fao-wapor',
    name: 'FAO WaPOR',
    url: 'https://www.fao.org/in-action/remote-sensing-for-water-productivity/wapor-data/en',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Water productivity and agricultural water context for African and Near East overlapping metadata.',
  },
  'esa-worldcover': {
    id: 'esa-worldcover',
    name: 'ESA WorldCover',
    url: 'https://esa-worldcover.org/en/data-access',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    license: 'Free and open data access',
    notes: 'Global land cover for forest, grassland, desert, wetland, mangrove, and other natural landscape labels.',
  },
  'gebco-bathymetry': {
    id: 'gebco-bathymetry',
    name: 'GEBCO Gridded Bathymetry',
    url: 'https://www.gebco.net/data_and_products/gridded_bathymetry_data/',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    license: 'GEBCO terms of use',
    notes: 'Global bathymetry and elevation grid for seas, offshore islands, channels, shelves, and marine terrain.',
  },
  'gmrt-topography': {
    id: 'gmrt-topography',
    name: 'Global Multi-Resolution Topography',
    url: 'https://www.gmrt.org/',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    notes: 'Topography and bathymetry synthesis for coastal, offshore ridge, seamount, and marine natural context.',
  },
  'global-mangrove-watch': {
    id: 'global-mangrove-watch',
    name: 'Global Mangrove Watch',
    url: 'https://www.wetlands.org/coasts-and-deltas/global-mangrove-watch/',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    notes: 'Mangrove distribution and change monitoring for coastal, delta, estuary, lagoon, and protected wetland context.',
  },
  'allen-coral-atlas': {
    id: 'allen-coral-atlas',
    name: 'Allen Coral Atlas',
    url: 'https://www.allencoralatlas.org/atlas/',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    notes: 'Shallow reef habitat and geomorphic-zone reference for island, lagoon, reef, and marine protected area context.',
  },
  'protected-planet-wdpa': {
    id: 'protected-planet-wdpa',
    name: 'Protected Planet WDPA / WDPCA',
    url: 'https://www.protectedplanet.net/en/thematic-areas/wdpa',
    kind: 'admin-boundary',
    coverage: 'global',
    usage: 'reference',
    notes: 'Protected terrestrial and marine areas for parks, reserves, conservation zones, habitats, and natural address context.',
  },
  'gbif-occurrence': {
    id: 'gbif-occurrence',
    name: 'GBIF Occurrence API',
    url: 'https://techdocs.gbif.org/en/openapi/v1/occurrence',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    license: 'Varies by dataset record',
    notes: 'Open biodiversity occurrence data for habitat, ecosystem, protected-area, and natural feature enrichment.',
  },
  'rcmrd-gmes-africa-geoportal': {
    id: 'rcmrd-gmes-africa-geoportal',
    name: 'RCMRD GMES and Africa Geoportal',
    url: 'https://geoportal.rcmrd.org/',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Environmental monitoring and natural resource layers for African and Indian Ocean territory metadata.',
  },
  'noaa-etopo': {
    id: 'noaa-etopo',
    name: 'NOAA NCEI ETOPO Global Relief Model',
    url: 'https://www.ncei.noaa.gov/products/etopo-global-relief-model',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    license: 'NOAA open data terms',
    notes: 'Global relief model registered for Americas-Europe overlap territories with mountain, island, coastal, shelf, and seafloor context.',
  },
  'geobc-global-multi-resolution-topography': {
    id: 'geobc-global-multi-resolution-topography',
    name: 'Global Multi-Resolution Topography',
    url: 'https://www.gmrt.org/',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    license: 'GMRT terms of use',
    notes: 'Marine and coastal topography reference for Atlantic, Caribbean, Arctic, ridge, seamount, shelf, and island context.',
  },
  hydrosheds: {
    id: 'hydrosheds',
    name: 'HydroSHEDS',
    url: 'https://www.hydrosheds.org/',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    license: 'Free for non-commercial use; check HydroSHEDS license for redistribution',
    notes: 'Hydrographic basins, river networks, lakes, and drainage context for Americas-Europe overlap territories.',
  },
  'usgs-3dep': {
    id: 'usgs-3dep',
    name: 'USGS 3D Elevation Program',
    url: 'https://www.usgs.gov/3d-elevation-program',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    license: 'U.S. public domain',
    notes: 'U.S. elevation reference kept registered for shared Americas metadata validation.',
  },
  'nrcan-geospatial': {
    id: 'nrcan-geospatial',
    name: 'Natural Resources Canada Geospatial Data, Tools and Services',
    url: 'https://natural-resources.canada.ca/science-data/data-analysis/geospatial-data-tools-services/geospatial-data-tools-services',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    license: 'Open Government Licence - Canada',
    notes: 'Canadian open geospatial reference kept registered for shared Americas metadata validation.',
  },
  'conabio-geoportal': {
    id: 'conabio-geoportal',
    name: 'CONABIO Geoportal',
    url: 'https://www.conabio.gob.mx/informacion/gis/',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Mexico biodiversity and ecological cartography reference kept registered for shared Americas metadata validation.',
  },
  'ibge-geosciences': {
    id: 'ibge-geosciences',
    name: 'IBGE Geosciences Downloads',
    url: 'https://downloads.ibge.gov.br/',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Brazil geoscience and environmental reference kept registered for shared Americas metadata validation.',
  },
  'inpe-terrabrasilis': {
    id: 'inpe-terrabrasilis',
    name: 'INPE TerraBrasilis',
    url: 'https://terrabrasilis.dpi.inpe.br/',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Brazil Amazon, Cerrado, forest, and biome-monitoring reference kept registered for shared Americas metadata validation.',
  },
  'jaxa-aw3d30': {
    id: 'jaxa-aw3d30',
    name: 'JAXA ALOS World 3D - 30m',
    url: 'https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/index.htm',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'reference',
    license: 'JAXA AW3D30 terms of use',
    notes: 'Global elevation source registered for French Pacific and Europe-overlap territory metadata validation.',
  },
  'pacific-data-hub': {
    id: 'pacific-data-hub',
    name: 'Pacific Data Hub',
    url: 'https://pacificdata.org/',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Pacific regional geospatial and environmental data source registered for French Pacific overseas territory metadata.',
  },
  'digital-earth-pacific': {
    id: 'digital-earth-pacific',
    name: 'Digital Earth Pacific Data Access',
    url: 'https://digitalearthpacific.github.io/data-access/',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Digital Earth Pacific satellite-derived coastline, water, land, and hazard data registered for French Pacific overseas territory metadata.',
  },
  pacioos: {
    id: 'pacioos',
    name: 'Pacific Islands Ocean Observing System',
    url: 'https://www.pacioos.hawaii.edu/',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Pacific ocean data service registered for reef, bathymetry, coastal water, and marine context in French Pacific metadata.',
  },
  'copernicus-dem': {
    id: 'copernicus-dem',
    name: 'Copernicus DEM',
    url: 'https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM.html',
    kind: 'gazetteer',
    coverage: 'europe',
    usage: 'reference',
    notes: 'Open elevation and mountain terrain reference for altitude, slope, ridge, valley, and mountainous address-context checks.',
  },
  'copernicus-corine-land-cover': {
    id: 'copernicus-corine-land-cover',
    name: 'Copernicus CORINE Land Cover',
    url: 'https://land.copernicus.eu/en/products/corine-land-cover',
    kind: 'gazetteer',
    coverage: 'europe',
    usage: 'reference',
    notes: 'Pan-European land cover and natural land-use reference for forests, wetlands, agricultural land, urban edges, mountains, and water-adjacent context.',
  },
  'emodnet-bathymetry': {
    id: 'emodnet-bathymetry',
    name: 'EMODnet Bathymetry',
    url: 'https://emodnet.ec.europa.eu/en/bathymetry',
    kind: 'gazetteer',
    coverage: 'europe',
    usage: 'reference',
    notes: 'European marine bathymetry, coastline, sea-basin, and seabed terrain reference for sea, coast, island, and offshore delivery-location context.',
  },
  'emodnet-seabed-habitats': {
    id: 'emodnet-seabed-habitats',
    name: 'EMODnet Seabed Habitats',
    url: 'https://emodnet.ec.europa.eu/en/seabed-habitats',
    kind: 'gazetteer',
    coverage: 'europe',
    usage: 'reference',
    notes: 'European marine habitat and seabed environment reference for coastal, marine protected area, offshore, and water-adjacent natural geography.',
  },
  'eea-natura-2000': {
    id: 'eea-natura-2000',
    name: 'EEA Natura 2000 Protected Areas',
    url: 'https://www.eea.europa.eu/data-and-maps/data/natura-2',
    kind: 'admin-boundary',
    coverage: 'europe',
    usage: 'reference',
    notes: 'European protected natural areas network for parks, reserves, habitats, mountains, wetlands, rivers, coasts, and conservation-area context.',
  },
  'eea-eunis-habitats': {
    id: 'eea-eunis-habitats',
    name: 'EEA EUNIS Habitat Classification',
    url: 'https://eunis.eea.europa.eu/habitats',
    kind: 'gazetteer',
    coverage: 'europe',
    usage: 'reference',
    notes: 'Pan-European habitat classification covering terrestrial, freshwater, and marine natural environments for nature-aware address rendering.',
  },
  'jrc-esdac-soils': {
    id: 'jrc-esdac-soils',
    name: 'JRC European Soil Data Centre',
    url: 'https://data.jrc.ec.europa.eu/collection/ESDAC',
    kind: 'gazetteer',
    coverage: 'europe',
    usage: 'reference',
    notes: 'European soil and terrain reference for natural geography, mountain slopes, erosion, wetlands, agricultural areas, and environmental context.',
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
  'data-gouv-fr-postcodes': {
    id: 'data-gouv-fr-postcodes',
    name: 'La Poste Base officielle des codes postaux',
    url: 'https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Licence Ouverte 2.0',
    notes: 'Official La Poste code-to-INSEE-commune assignment table; commune contours are administrative context, not official postal-code boundaries.',
  },
  'ban-fr': {
    id: 'ban-fr',
    name: 'Base Adresse Nationale',
    url: 'https://adresse.data.gouv.fr/contenu-de-la-ban',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'Licence Ouverte 2.0',
    notes: 'Official French georeferenced address reference for house-number and street evidence; an address point does not by itself prove a building link.',
  },
  'ign-bd-topo': {
    id: 'ign-bd-topo',
    name: 'IGN BD TOPO',
    url: 'https://geoservices.ign.fr/documentation/donnees/vecteur/bdtopo',
    kind: 'building',
    coverage: 'country',
    usage: 'primary',
    license: 'Licence Ouverte 2.0',
    notes: 'Official IGN topographic building geometry and explicit BAN address-to-building link evidence; proximity alone remains derived.',
  },
  'insee-cog': {
    id: 'insee-cog',
    name: 'INSEE Code officiel géographique',
    url: 'https://www.insee.fr/fr/information/2560452',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Licence Ouverte 2.0',
    notes: 'Official administrative identities and histories; COG codes and boundaries are not La Poste postal assignments.',
  },
  'deutsche-post-plz-server': {
    id: 'deutsche-post-plz-server',
    name: 'Deutsche Post / Postdirekt Postcode Search',
    url: 'https://www.postdirekt.de/plzserver/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Deutsche Post interactive postcode and locality search via Postdirekt.',
  },
  openplzapi: {
    id: 'openplzapi',
    name: 'OpenPLZ API',
    url: 'https://www.openplzapi.org/en/',
    kind: 'postal-code',
    coverage: 'europe',
    usage: 'primary',
    notes: 'Open postal-code API for Germany, Austria, Switzerland, and Liechtenstein.',
  },
  'opendatasoft-nl-postcodes': {
    id: 'opendatasoft-nl-postcodes',
    name: 'Netherlands PC4 Postcode Dataset',
    url: 'https://public.opendatasoft.com/explore/dataset/georef-netherlands-postcode-pc4/information/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    notes: 'OpenDataSoft Netherlands postcode reference dataset.',
  },
  'pdok-bag': {
    id: 'pdok-bag',
    name: 'PDOK BAG OGC API',
    url: 'https://api.pdok.nl/kadaster/bag/ogc/v2?f=html&lang=nl',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'Public Domain Mark 1.0',
    notes: 'Official daily Dutch address points, addressable objects, and building geometry from Kadaster LV-BAG.',
  },
  'cbs-nl-postcode-areas': {
    id: 'cbs-nl-postcode-areas',
    name: 'CBS PC4, PC5, and PC6 Postcode Areas',
    url: 'https://www.cbs.nl/nl-nl/dossier/nederland-regionaal/geografische-data/gegevens-per-postcode',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'CC BY 3.0 NL',
    notes: 'Annual CBS postcode GeoPackages with Esri Nederland derived geometry and required attribution.',
  },
  'odwb-be-postcodes': {
    id: 'odwb-be-postcodes',
    name: 'Open Data Wallonia-Brussels Postal Codes Belgium',
    url: 'https://www.odwb.be/explore/dataset/postal-codes-belgium/information/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    notes: 'Belgium postal-code open dataset.',
  },
  'postcodes-io': {
    id: 'postcodes-io',
    name: 'postcodes.io',
    url: 'https://postcodes.io/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Free UK postcode and geolocation API.',
  },
  'ons-postcode-directory': {
    id: 'ons-postcode-directory',
    name: 'ONS Postcode Directory',
    url: 'https://www.ons.gov.uk/methodology/geography/geographicalproducts/postcodeproducts',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    license: 'Open Government Licence v3.0; BT subject to separate LPS terms',
    notes: 'Quarterly live and terminated UK postcode coordinates and administrative crosswalks; the address-mean point is not a delivery point or postal boundary.',
  },
  'ordnance-survey-open-names': {
    id: 'ordnance-survey-open-names',
    name: 'Ordnance Survey Open Names',
    url: 'https://osdatahub.os.uk/downloads/open/OpenNames',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    license: 'Open Government Licence',
    notes: 'Official open GB place-name gazetteer for settlements, localities, roads, and named places.',
  },
  'ordnance-survey-boundary-line': {
    id: 'ordnance-survey-boundary-line',
    name: 'Ordnance Survey Boundary-Line',
    url: 'https://osdatahub.os.uk/downloads/open/BoundaryLine',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Open Government Licence',
    notes: 'Official GB administrative boundary data for counties, districts, wards, and parishes.',
  },
  'ordnance-survey-open-uprn': {
    id: 'ordnance-survey-open-uprn',
    name: 'OS Open UPRN',
    url: 'https://www.ordnancesurvey.co.uk/products/os-open-uprn',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'Open Government Licence v3.0',
    notes: 'Authoritative GB UPRN identifiers and coordinate references for addressable locations; not full addresses or building footprints.',
  },
  'ordnance-survey-openmap-local': {
    id: 'ordnance-survey-openmap-local',
    name: 'OS OpenMap Local',
    url: 'https://www.ordnancesurvey.co.uk/products/os-open-map-local',
    kind: 'building',
    coverage: 'country',
    usage: 'reference',
    license: 'Open Government Licence v3.0',
    notes: 'Generalised GB building geometry and street-level context; proximity to a UPRN is not an exact premise relationship.',
  },
  'ideal-postcodes-reference': {
    id: 'ideal-postcodes-reference',
    name: 'Ideal Postcodes Reference',
    url: 'https://docs.ideal-postcodes.co.uk/docs/changelog',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Ireland Eircode reference used as a non-bundled validation source.',
  },
  'civictechsweden-posmkod': {
    id: 'civictechsweden-posmkod',
    name: 'civictechsweden pOSMkod',
    url: 'https://github.com/civictechsweden/pOSMkod',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    notes: 'Swedish postal-code open-source project.',
  },
  'lantmateriet-sweden': {
    id: 'lantmateriet-sweden',
    name: 'Lantmateriet Sweden Open Geodata',
    url: 'https://www.lantmateriet.se/en/geodata/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Swedish mapping, cadastral, place-name, and administrative geodata reference.',
  },
  'trafikverket-sweden': {
    id: 'trafikverket-sweden',
    name: 'Trafikverket Sweden Road Data',
    url: 'https://www.trafikverket.se/en/startpage/services/open-data/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Swedish road-network and transport open data useful for street and route-name validation.',
  },
  'scb-sweden-geodata': {
    id: 'scb-sweden-geodata',
    name: 'Statistics Sweden Geodata',
    url: 'https://www.scb.se/en/services/open-data-api/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Statistics Sweden regional and municipality reference data for administrative hierarchy checks.',
  },
  'data-norge': {
    id: 'data-norge',
    name: 'Data Norge',
    url: 'https://data.norge.no/nb',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Norwegian open data portal for postal and geographic datasets.',
  },
  'kartverket-norway': {
    id: 'kartverket-norway',
    name: 'Kartverket Norway',
    url: 'https://www.kartverket.no/en',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Norwegian Mapping Authority data for addresses, place names, cadastre, and administrative boundaries.',
  },
  'geonorge-norway': {
    id: 'geonorge-norway',
    name: 'GeoNorge',
    url: 'https://www.geonorge.no/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Norwegian national geodata catalog for addresses, boundaries, roads, elevation, and place-name datasets.',
  },
  'brreg-address-register': {
    id: 'brreg-address-register',
    name: 'Norway Address Register Reference',
    url: 'https://data.brreg.no/',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    notes: 'Norwegian registry/open-data reference useful for address and organization delivery validation.',
  },
  'postcode-eu': {
    id: 'postcode-eu',
    name: 'Postcode.eu',
    url: 'https://www.postcode.eu/produits/address-api/international/',
    kind: 'postal-code',
    coverage: 'europe',
    usage: 'reference',
    notes: 'European address and postal-code API reference; use where open alternatives are limited.',
  },
  'dataforsyningen-denmark': {
    id: 'dataforsyningen-denmark',
    name: 'Dataforsyningen Denmark',
    url: 'https://dataforsyningen.dk/',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'primary',
    notes: 'Danish national geodata service for address, cadastral, map, and geocoding reference.',
  },
  'danish-address-register-dar': {
    id: 'danish-address-register-dar',
    name: 'Danish Address Register DAR',
    url: 'https://danmarksadresser.dk/',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official Danish address register for road names, house numbers, postal towns, and municipalities.',
  },
  geodanmark: {
    id: 'geodanmark',
    name: 'GeoDanmark',
    url: 'https://www.geodanmark.dk/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Danish topographic and geospatial reference data for map and administrative validation.',
  },
  'posti-finland-postal-code-services': {
    id: 'posti-finland-postal-code-services',
    name: 'Posti Finland Postal Code Services',
    url: 'https://www.posti.fi/en/for-businesses/customer-support/postal-code-services',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Posti postal-code and basic-address files, updated daily or weekly for current Finnish address data.',
  },
  'avoindata-fi-postcodes': {
    id: 'avoindata-fi-postcodes',
    name: 'Finland Postcodes Open Data',
    url: 'https://avoindata.suomi.fi/data/fi/dataset/?collection_type=Open+Data&vocab_keywords_fi=postinumerot',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    notes: 'Finnish open postcode dataset.',
  },
  'nls-finland': {
    id: 'nls-finland',
    name: 'National Land Survey of Finland',
    url: 'https://www.maanmittauslaitos.fi/en/e-services/open-data-file-download-service',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Finnish national mapping and cadastral open data for place names, roads, buildings, and boundaries.',
  },
  'maanmittauslaitos-open-data': {
    id: 'maanmittauslaitos-open-data',
    name: 'Maanmittauslaitos Open Data',
    url: 'https://www.maanmittauslaitos.fi/en/maps-and-spatial-data/datasets-and-interfaces',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Finnish open geospatial datasets and APIs for address-adjacent and map validation.',
  },
  'dvv-finland-address-data': {
    id: 'dvv-finland-address-data',
    name: 'Digital and Population Data Services Agency Finland',
    url: 'https://dvv.fi/en/open-data',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    notes: 'Finnish registry/open-data reference for municipality and address-related validation.',
  },
  'latvijas-pasts-check-address': {
    id: 'latvijas-pasts-check-address',
    name: 'Latvijas Pasts Check Address',
    url: 'https://pasts.lv/en/check-address',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Latvijas Pasts address and postcode lookup for current Latvian address formatting and postal-index validation.',
  },
  'kartes-lv-postal-codes': {
    id: 'kartes-lv-postal-codes',
    name: 'Baltic Postal Codes API',
    url: 'https://developers.kartes.lv/en/postal_codes/',
    kind: 'postal-code',
    coverage: 'europe',
    usage: 'reference',
    notes: 'Postal-code API reference used for Latvia, Estonia, and Lithuania.',
  },
  'lgia-latvia': {
    id: 'lgia-latvia',
    name: 'Latvian Geospatial Information Agency',
    url: 'https://www.lgia.gov.lv/en',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Latvian national mapping and geospatial authority reference for place names and boundaries.',
  },
  'vzd-latvia-address-register': {
    id: 'vzd-latvia-address-register',
    name: 'Latvia State Land Service Address Register',
    url: 'https://www.vzd.gov.lv/en',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    notes: 'Latvian address register and cadastral reference for street, building, village, and municipality validation.',
  },
  'data-gov-lv-geodata': {
    id: 'data-gov-lv-geodata',
    name: 'Latvia Open Data Portal Geodata',
    url: 'https://data.gov.lv/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Latvian open-data portal for geospatial and administrative datasets.',
  },
  'maaamet-estonia': {
    id: 'maaamet-estonia',
    name: 'Estonian Land Board',
    url: 'https://maaamet.ee/en',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Estonian Land Board reference for address data, cadastral data, maps, and administrative boundaries.',
  },
  'estonia-address-data-system': {
    id: 'estonia-address-data-system',
    name: 'Estonia Address Data System',
    url: 'https://www.riha.ee/',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    notes: 'Estonian address data system reference for structured address hierarchy validation.',
  },
  'xgis-estonia': {
    id: 'xgis-estonia',
    name: 'X-GIS Estonia',
    url: 'https://xgis.maaamet.ee/',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'reference',
    notes: 'Estonian national map service for cadastral, address, and place-name reference layers.',
  },
  'omniva-estonia-postcodes': {
    id: 'omniva-estonia-postcodes',
    name: 'Omniva Estonia ZIP Codes',
    url: 'https://www.omniva.ee/en/zip-codes/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public operator search and download; review Omniva terms for redistribution',
    notes: 'Official address-to-postcode search and download from Estonia postal operator; postal routing evidence is distinct from ADS geometry and delivery guarantees.',
  },
  'estonia-aks-postal-codes': {
    id: 'estonia-aks-postal-codes',
    name: 'Estonia AKS Postal Codes',
    url: 'https://geoportaal.maaamet.ee/eng/spatial-data/address-data/postal-codes-p661.html',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Open address data; attribute Estonian Land and Spatial Development Board and extraction date',
    notes: 'Monthly current-address extract and AKS/ADS query evidence with ADR_ID, five-digit postcode and reference coordinates, based on Omniva postal zones.',
  },
  'estonia-aks-postal-areas': {
    id: 'estonia-aks-postal-areas',
    name: 'Estonia AKS Postal Code Areas',
    url: 'https://geoportaal.maaamet.ee/eng/services/public-wms-wfs-p346.html',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Open spatial data; attribute Estonian Land and Spatial Development Board and extraction date',
    notes: 'Official public AKS OGC postal-code-area layer derived from Omniva-managed zones; pin service schema, CRS, retrieval time and digest.',
  },
  'estonia-aks-address-objects': {
    id: 'estonia-aks-address-objects',
    name: 'Estonia AKS/ADS Address Objects',
    url: 'https://geoportaal.maaamet.ee/eng/spatial-data/address-data-p313.html',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'Open data; attribute Estonian Land and Spatial Development Board',
    notes: 'Official addresses for parcels, buildings and building parts with stable ADS_OID, version ADOB_ID, object type, history and geometry.',
  },
  'estonia-aks-building-shapes': {
    id: 'estonia-aks-building-shapes',
    name: 'Estonia AKS/ADS Building Shapes',
    url: 'https://geoportaal.maaamet.ee/eng/services/public-wms-wfs-p346.html',
    kind: 'building',
    coverage: 'country',
    usage: 'primary',
    license: 'Open spatial data; attribute Estonian Land and Spatial Development Board and extraction date',
    notes: 'Official ADS building point and polygon layers; a definitive address-to-building display requires the shared ADS object path, not proximity.',
  },
  'estonia-ehak-admin-boundaries': {
    id: 'estonia-ehak-admin-boundaries',
    name: 'Estonia EHAK Administrative and Settlement Division',
    url: 'https://geoportaal.maaamet.ee/eng/Spatial-Data/Administrative-and-Settlement-Division-p312.html',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    license: 'Unrestricted use with provider and validity-date attribution',
    notes: 'Official county, municipality and settlement geometry with EHAK codes; administrative context is not a postal-code boundary.',
  },
  'lietuvos-pastas-postcode-search': {
    id: 'lietuvos-pastas-postcode-search',
    name: 'Lietuvos pastas Postal Code and Address Search',
    url: 'https://www.post.lt/pasto-kodu-ir-adresu-paieska',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Lithuania Post search for postcode-by-address and address-by-postcode validation.',
  },
  'geoportal-lt': {
    id: 'geoportal-lt',
    name: 'Lithuania Geoportal',
    url: 'https://www.geoportal.lt/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Lithuanian national geospatial portal for address, cadastral, road, and boundary reference data.',
  },
  'registru-centras-address-register': {
    id: 'registru-centras-address-register',
    name: 'Registru Centras Address Register Lithuania',
    url: 'https://www.registrucentras.lt/',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    notes: 'Lithuanian address register and cadastral reference for municipality, street, and building validation.',
  },
  'open-data-lithuania': {
    id: 'open-data-lithuania',
    name: 'Lithuania Open Data Portal',
    url: 'https://data.gov.lt/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Lithuanian open-data portal for administrative and geospatial datasets.',
  },
  'okfn-index-postcodes': {
    id: 'okfn-index-postcodes',
    name: 'Open Knowledge Index Postal Codes',
    url: 'https://2015.index.okfn.org/',
    kind: 'postal-code',
    coverage: 'europe',
    usage: 'reference',
    notes: 'Open Data Index postal-code references for countries with listed postcode data.',
  },
  'posturinn-iceland-postcodes': {
    id: 'posturinn-iceland-postcodes',
    name: 'Pósturinn Iceland Postcode Regions',
    url: 'https://posturinn.is/einstaklingar/ymsar-upplysingar/verdskra/svaedaskipting-postnumera/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public web reference; operator terms apply',
    notes: 'Official Pósturinn postcode groupings and rural-service context; reference evidence, not a bulk polygon or deliverability dataset.',
  },
  'natt-is50v-postcode-boundaries': {
    id: 'natt-is50v-postcode-boundaries',
    name: 'Náttúrufræðistofnun IS 50V Postcode Boundaries',
    url: 'https://www.natt.is/en/resources/geospatial-data/base-map-data',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Icelandic public-sector reuse with attribution; verify layer metadata',
    notes: 'Official continuously revised 1:50,000 postcode polygon layer; pin release, CRS, terms, attribution, and digest.',
  },
  'hms-iceland-address-register': {
    id: 'hms-iceland-address-register',
    name: 'HMS Staðfangaskrá',
    url: 'https://hms.is/gogn-og-maelabord/grunngogntilnidurhals/stadfangaskra',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'Icelandic public-sector reuse with attribution',
    notes: 'Official weekly address register with postcode, stable identifiers, coordinate type, review status, and estimated accuracy.',
  },
  'natt-is50v-buildings': {
    id: 'natt-is50v-buildings',
    name: 'Náttúrufræðistofnun IS 50V Buildings',
    url: 'https://www.natt.is/en/resources/geospatial-data/base-map-data',
    kind: 'building',
    coverage: 'country',
    usage: 'validation',
    license: 'Icelandic public-sector reuse with attribution; verify layer metadata',
    notes: 'Official 1:50,000 topographic building geometry; not an exact address-to-building link from proximity or containment.',
  },
  'statistics-iceland-geography': {
    id: 'statistics-iceland-geography',
    name: 'Statistics Iceland Municipalities and Urban Nuclei',
    url: 'https://www.statice.is/statistics/population/inhabitants/municipalities-and-urban-nuclei/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    license: 'CC BY 4.0',
    notes: 'Official statistical and administrative context; municipalities and urban nuclei are not postcode boundaries.',
  },
  'lmmi-iceland': {
    id: 'lmmi-iceland',
    name: 'National Land Survey of Iceland',
    url: 'https://www.lmi.is/en',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Icelandic national mapping authority reference for place names, maps, and administrative geography.',
  },
  'iceland-national-registry-addresses': {
    id: 'iceland-national-registry-addresses',
    name: 'Iceland National Registry Address Reference',
    url: 'https://www.skra.is/english/',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    notes: 'Icelandic registry reference for address and residence geography validation.',
  },
  'island-is-open-data': {
    id: 'island-is-open-data',
    name: 'Iceland Open Data Portal',
    url: 'https://island.is/en/o/opin-gogn',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Iceland open-data reference for public geospatial, administrative, and registry datasets.',
  },
  'eurostat-gisco-postcodes': {
    id: 'eurostat-gisco-postcodes',
    name: 'Eurostat GISCO Postal Codes',
    url: 'https://ec.europa.eu/eurostat/web/gisco/geodata/administrative-units/postal-codes',
    kind: 'postal-code',
    coverage: 'europe',
    usage: 'validation',
    notes: 'EU GISCO postal-code geodata for European administrative-unit validation.',
  },
  'elta-gr': {
    id: 'elta-gr',
    name: 'ELTA Postal Code Search',
    url: 'https://itemsearch.elta.gr/en-GB/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Greek postal-code search.',
  },
  'poste-italiane-cap-search': {
    id: 'poste-italiane-cap-search',
    name: 'Poste Italiane CAP Search',
    url: 'https://www.poste.it/cap',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public web reference; Poste Italiane terms apply',
    notes: 'Official five-digit CAP search and change reference; not a reusable bulk dataset, official polygon source, or deliverability guarantee.',
  },
  'poste-italiane-cap-professional': {
    id: 'poste-italiane-cap-professional',
    name: 'Poste Italiane CAP Professional',
    url: 'https://business.poste.it/professionisti-imprese/prodotti/cap-professional.html',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Commercial licensed data; contract-specific redistribution',
    notes: 'Official locality, multiCAP city-zone, street-arc, and house-number range assignment; no open redistribution or official polygon claim.',
  },
  'anncsu-italy-addresses': {
    id: 'anncsu-italy-addresses',
    name: 'ANNCSU Italian Streets and Civic Numbers',
    url: 'https://www.anncsu.gov.it/it/consultazione-dellarchivio/open-data/index.html',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'CC BY 4.0',
    notes: 'Official national street and civic-number register with monthly bulk and daily API updates; coordinates when present are not exact building links.',
  },
  'istat-italy-admin-boundaries': {
    id: 'istat-italy-admin-boundaries',
    name: 'ISTAT Administrative Boundaries',
    url: 'https://www.istat.it/notizia/confini-delle-unita-amministrative-a-fini-statistici-al-1-gennaio-2018-2/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    license: 'CC BY 3.0 Italy unless otherwise indicated',
    notes: 'Official regions, provinces, metropolitan cities, and municipalities in WGS84; administrative context and derivation clip, never a CAP boundary.',
  },
  'italy-regional-dbgt-buildings': {
    id: 'italy-regional-dbgt-buildings',
    name: 'Italian Regional and Municipal DBGT Buildings',
    url: 'https://geodati.gov.it/geoportale/datiterritoriali/regole-tecniche',
    kind: 'building',
    coverage: 'country',
    usage: 'validation',
    license: 'Federated per-dataset terms; review every provider and release',
    notes: 'DBGT provides a national content specification, while actual building geometry is federated; proximity alone is not an exact civic-to-building link.',
  },
  'istat-italy-geodata': {
    id: 'istat-italy-geodata',
    name: 'ISTAT Italy Geographic Data',
    url: 'https://www.istat.it/en/analysis-and-products/territorial-data/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Italian official statistical geography for regions, provinces, municipalities, and locality hierarchy checks.',
  },
  'agenzia-entrate-catasto': {
    id: 'agenzia-entrate-catasto',
    name: 'Agenzia delle Entrate Catasto',
    url: 'https://www.agenziaentrate.gov.it/portale/web/english/nse/services/cadastral-and-cartographic-services',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Italian cadastral and cartographic services for parcel, municipality, and address-adjacent validation.',
  },
  'geoportale-nazionale-italy': {
    id: 'geoportale-nazionale-italy',
    name: 'Geoportale Nazionale Italy',
    url: 'https://www.pcn.minambiente.it/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Italian national geoportal for INSPIRE and environmental map layers used as geospatial reference.',
  },
  'ign-spain-cnig': {
    id: 'ign-spain-cnig',
    name: 'IGN/CNIG Spain',
    url: 'https://centrodedescargas.cnig.es/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'primary',
    notes: 'Spanish national geographic institute open download center for maps, gazetteers, roads, and boundaries.',
  },
  'catastro-spain': {
    id: 'catastro-spain',
    name: 'Spanish Cadastre',
    url: 'https://www.sedecatastro.gob.es/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Spanish cadastral reference for parcels, municipalities, streets, and address-adjacent validation.',
  },
  'idee-spain': {
    id: 'idee-spain',
    name: 'IDEE Spain Spatial Data Infrastructure',
    url: 'https://www.idee.es/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Spanish spatial data infrastructure for national and regional geospatial services.',
  },
  'dgterritorio-portugal': {
    id: 'dgterritorio-portugal',
    name: 'Direcao-Geral do Territorio Portugal',
    url: 'https://www.dgterritorio.gov.pt/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Portuguese national territory and cartography authority for administrative geography and map validation.',
  },
  'snig-portugal': {
    id: 'snig-portugal',
    name: 'SNIG Portugal',
    url: 'https://snig.dgterritorio.gov.pt/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Portuguese national geographic information system and INSPIRE catalog.',
  },
  'bupi-portugal': {
    id: 'bupi-portugal',
    name: 'BUPi Portugal',
    url: 'https://bupi.gov.pt/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Portuguese cadastral and property identification reference for rural and parcel-adjacent address checks.',
  },
  'ktimatologio-greece': {
    id: 'ktimatologio-greece',
    name: 'Hellenic Cadastre',
    url: 'https://www.ktimatologio.gr/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Greek cadastre and mapping reference for municipalities, parcels, and address-adjacent geography.',
  },
  'geodata-gov-gr': {
    id: 'geodata-gov-gr',
    name: 'geodata.gov.gr',
    url: 'https://geodata.gov.gr/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'Greek open geodata catalog for administrative, road, and place-name datasets.',
  },
  'okxe-greece': {
    id: 'okxe-greece',
    name: 'Greek Mapping and Cadastre Reference',
    url: 'https://www.ktimatologio.gr/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Greek mapping/cadastre reference for historic OKXE-aligned national geospatial layers.',
  },
  'pa-malta-geoserver': {
    id: 'pa-malta-geoserver',
    name: 'Planning Authority Malta GeoServer',
    url: 'https://geoserver.pa.org.mt/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Malta Planning Authority geospatial services for local councils, streets, development zones, and map layers.',
  },
  'nso-malta-geodata': {
    id: 'nso-malta-geodata',
    name: 'National Statistics Office Malta Geodata',
    url: 'https://nso.gov.mt/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Maltese official statistics geography for locality and district validation.',
  },
  'identity-malta-addressing': {
    id: 'identity-malta-addressing',
    name: 'Identity Malta Address Reference',
    url: 'https://identita.gov.mt/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Malta government identity and civil registry reference useful for locality and address naming conventions.',
  },
  'san-marino-geoportal': {
    id: 'san-marino-geoportal',
    name: 'San Marino Geoportal',
    url: 'https://www.gov.sm/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'San Marino government reference for castelli, roads, public maps, and local geography.',
  },
  'san-marino-statistics': {
    id: 'san-marino-statistics',
    name: 'San Marino Statistics',
    url: 'https://www.statistica.sm/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'San Marino official statistical geography for castelli and settlement validation.',
  },
  'monaco-gouv-cartography': {
    id: 'monaco-gouv-cartography',
    name: 'Government of Monaco Cartography',
    url: 'https://en.gouv.mc/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Monaco government cartographic and administrative reference for quartiers, streets, and delivery geography.',
  },
  'monaco-imsee-geodata': {
    id: 'monaco-imsee-geodata',
    name: 'IMSEE Monaco Geodata',
    url: 'https://www.imsee.mc/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'Monaco statistical and territorial reference for districts and address-adjacent geography.',
  },
  'vatican-city-state': {
    id: 'vatican-city-state',
    name: 'Vatican City State',
    url: 'https://www.vaticanstate.va/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Vatican City State reference for territory, institutional addresses, and internal geography.',
  },
  'openstreetmap-vatican': {
    id: 'openstreetmap-vatican',
    name: 'OpenStreetMap Vatican City',
    url: 'https://www.openstreetmap.org/relation/36989',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'OSM relation and address-adjacent place reference for Vatican City where official open APIs are limited.',
  },
  'andorra-cartografia': {
    id: 'andorra-cartografia',
    name: 'Andorra Cartography and GIS',
    url: 'https://www.cartografia.ad/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Andorran cartographic reference for parishes, roads, buildings, and national geodata.',
  },
  'andorra-open-data': {
    id: 'andorra-open-data',
    name: 'Andorra Open Data',
    url: 'https://www.data.ad/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'Andorran open-data portal for public administrative and geographic datasets.',
  },
  'cyprus-department-lands-surveys': {
    id: 'cyprus-department-lands-surveys',
    name: 'Cyprus Department of Lands and Surveys',
    url: 'https://portal.dls.moi.gov.cy/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Cyprus land, survey, cadastral, and map reference for municipalities, streets, and parcels.',
  },
  'cyprus-open-data-portal': {
    id: 'cyprus-open-data-portal',
    name: 'Cyprus Open Data Portal',
    url: 'https://www.data.gov.cy/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'Cyprus open-data portal for administrative, postcode, and geographic datasets.',
  },
  'inspire-cyprus': {
    id: 'inspire-cyprus',
    name: 'INSPIRE Cyprus',
    url: 'https://inspire.cyprus.gov.cy/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Cyprus INSPIRE spatial data infrastructure for boundaries and national geospatial validation layers.',
  },
  'datahub-postal': {
    id: 'datahub-postal',
    name: 'DataHub Logistics Postal Codes',
    url: 'https://datahub.io/logistics',
    kind: 'postal-code',
    coverage: 'global',
    usage: 'validation',
    license: 'Varies by dataset',
    notes: 'Reusable postal-code CSV datasets for countries where maintained open packages exist.',
  },
  'zauberware-postal-codes': {
    id: 'zauberware-postal-codes',
    name: 'zauberware postal-codes-json-xml-csv',
    url: 'https://github.com/zauberware/postal-codes-json-xml-csv',
    kind: 'postal-code',
    coverage: 'global',
    usage: 'validation',
    notes: 'Open-source postal-code package useful for microstates and fallback validation.',
  },
  'eu-postal-code-package': {
    id: 'eu-postal-code-package',
    name: '@mohamadalkadiri/eu-postal-code',
    url: 'https://www.npmjs.com/package/@mohamadalkadiri/eu-postal-code',
    kind: 'postal-code',
    coverage: 'europe',
    usage: 'validation',
    notes: 'Open-source EU postal-code validation package.',
  },
  'postalcodes-info': {
    id: 'postalcodes-info',
    name: 'postalcodes.info',
    url: 'https://postalcodes.info/',
    kind: 'postal-code',
    coverage: 'global',
    usage: 'reference',
    notes: 'Postal-code reference for countries where official API coverage is limited.',
  },
  'scrape4u-postal-codes': {
    id: 'scrape4u-postal-codes',
    name: 'Scrape4u Postal Codes',
    url: 'https://scrape4u.com/postal-codes/',
    kind: 'postal-code',
    coverage: 'europe',
    usage: 'reference',
    notes: 'Postal-code reference used for countries without a better free API in current metadata.',
  },
  'spotzi-postal-codes': {
    id: 'spotzi-postal-codes',
    name: 'Spotzi Postal Codes',
    url: 'https://www.spotzi.com/en/data-catalog?page=1&categories=Postal+Codes',
    kind: 'postal-code',
    coverage: 'global',
    usage: 'reference',
    notes: 'Postal-code catalog reference for Kosovo and Albania fallback validation.',
  },
  'ceska-posta-psc': {
    id: 'ceska-posta-psc',
    name: 'Ceska posta PSC Search',
    url: 'https://www.postaonline.cz/vyhledani-psc',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Czech postal-code lookup.',
  },
  'cuzk-ruian': {
    id: 'cuzk-ruian',
    name: 'CUZK RUIAN',
    url: 'https://www.cuzk.cz/',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    notes: 'Czech national register of territorial identification, addresses, and real estate for address validation.',
  },
  'cuzk-geoportal': {
    id: 'cuzk-geoportal',
    name: 'CUZK Geoportal',
    url: 'https://geoportal.cuzk.cz/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Czech cadastral and mapping geoportal for administrative and parcel-adjacent geography.',
  },
  'posta-hr': {
    id: 'posta-hr',
    name: 'Croatian Post Office Search',
    url: 'https://www.posta.hr/pretrazivanje-postanskih-ureda/263',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Croatia postal office and postal-code search.',
  },
  'dgu-croatia-geoportal': {
    id: 'dgu-croatia-geoportal',
    name: 'State Geodetic Administration Croatia Geoportal',
    url: 'https://geoportal.dgu.hr/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Croatian official geodetic geoportal for cadastral, topographic, and administrative reference layers.',
  },
  'croatia-cadastre': {
    id: 'croatia-cadastre',
    name: 'Croatia Cadastre',
    url: 'https://oss.uredjenazemlja.hr/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Croatian cadastre and land registry reference for parcel, municipality, and settlement validation.',
  },
  'posta-hu': {
    id: 'posta-hu',
    name: 'Magyar Posta Postal Code Search',
    url: 'https://www.posta.hu/ugyfelszolgalat/iranyitoszam-kereso',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Hungary postal-code lookup.',
  },
  'lechner-hungary-geodata': {
    id: 'lechner-hungary-geodata',
    name: 'Lechner Knowledge Center Hungary Geodata',
    url: 'https://lechnerkozpont.hu/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Hungarian national geospatial and planning data reference for settlements and administrative geography.',
  },
  'hungary-public-road-data': {
    id: 'hungary-public-road-data',
    name: 'Hungarian Public Road Data',
    url: 'https://internet.kozut.hu/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Hungarian road-network and road-name reference useful for locality and street validation.',
  },
  'poczta-polska': {
    id: 'poczta-polska',
    name: 'Poczta Polska Postal Code Search',
    url: 'https://kody.poczta-polska.pl/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Poland postal-code search.',
  },
  'geoportal-gov-pl': {
    id: 'geoportal-gov-pl',
    name: 'Geoportal.gov.pl',
    url: 'https://www.geoportal.gov.pl/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Polish national spatial data infrastructure for boundaries, cadastral parcels, addresses, and map layers.',
  },
  'gus-teryt-poland': {
    id: 'gus-teryt-poland',
    name: 'GUS TERYT Register',
    url: 'https://eteryt.stat.gov.pl/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official Polish territorial identifier and locality register for wojewodztwo, powiat, gmina, and locality checks.',
  },
  'posta-si': {
    id: 'posta-si',
    name: 'Posta Slovenije Postal Code Search',
    url: 'https://www.posta.si/zasebno/postne-storitve',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Slovenia postal-code lookup.',
  },
  'eprostor-slovenia': {
    id: 'eprostor-slovenia',
    name: 'eProstor Slovenia',
    url: 'https://www.e-prostor.gov.si/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Slovenian official spatial portal for cadastre, addresses, buildings, and administrative geography.',
  },
  'gurs-slovenia': {
    id: 'gurs-slovenia',
    name: 'Surveying and Mapping Authority of Slovenia',
    url: 'https://www.gov.si/en/state-authorities/bodies-within-ministries/surveying-and-mapping-authority/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Slovenian surveying authority reference for address register, settlement, and boundary data.',
  },
  'slovenska-posta-psc': {
    id: 'slovenska-posta-psc',
    name: 'Slovenska posta PSC Search',
    url: 'https://psc.posta.sk/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Slovakia postal-code lookup.',
  },
  'zbgis-slovakia': {
    id: 'zbgis-slovakia',
    name: 'ZBGIS Slovakia',
    url: 'https://zbgis.skgeodesy.sk/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Slovak national geospatial portal for addresses, buildings, roads, and administrative boundaries.',
  },
  'slovakia-address-register': {
    id: 'slovakia-address-register',
    name: 'Slovakia Address Register',
    url: 'https://data.gov.sk/',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    notes: 'Slovak open-data address and register reference for municipality, street, and building validation.',
  },
  'ancpi-romania-geoportal': {
    id: 'ancpi-romania-geoportal',
    name: 'ANCPI Romania Geoportal',
    url: 'https://geoportal.ancpi.ro/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Romanian cadastre and land registration geoportal for administrative and cadastral geography.',
  },
  'romania-open-data': {
    id: 'romania-open-data',
    name: 'Romania Open Data Portal',
    url: 'https://data.gov.ro/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Romanian open data portal for public administrative, locality, and geospatial datasets.',
  },
  'cadastre-bulgaria': {
    id: 'cadastre-bulgaria',
    name: 'Bulgaria Cadastre Agency',
    url: 'https://kais.cadastre.bg/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Bulgarian cadastral and address-adjacent map reference for settlements, streets, and parcels.',
  },
  'bulgaria-inspire-geoportal': {
    id: 'bulgaria-inspire-geoportal',
    name: 'Bulgaria INSPIRE Geoportal',
    url: 'https://inspire.egov.bg/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Bulgarian INSPIRE spatial data infrastructure for national geospatial validation layers.',
  },
  'data-gov-ua-geodata': {
    id: 'data-gov-ua-geodata',
    name: 'Ukraine Open Data Portal Geodata',
    url: 'https://data.gov.ua/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Ukraine open-data portal for administrative and geospatial datasets.',
  },
  'ukraine-cadastre-map': {
    id: 'ukraine-cadastre-map',
    name: 'Ukraine Public Cadastral Map',
    url: 'https://map.land.gov.ua/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Ukrainian cadastral map reference for parcel, settlement, and administrative validation.',
  },
  'geoportal-moldova': {
    id: 'geoportal-moldova',
    name: 'Moldova Geoportal',
    url: 'https://geoportal.md/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Moldovan national geoportal for administrative, cadastral, and geospatial reference layers.',
  },
  'moldova-open-data': {
    id: 'moldova-open-data',
    name: 'Moldova Open Data Portal',
    url: 'https://date.gov.md/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Moldovan open data portal for public administrative and locality datasets.',
  },
  'belarus-nca-geoportal': {
    id: 'belarus-nca-geoportal',
    name: 'Belarus National Cadastral Agency Geoportal',
    url: 'https://nca.by/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Belarus cadastral and administrative geography reference for settlement and parcel-adjacent validation.',
  },
  'rosreestr-nspd': {
    id: 'rosreestr-nspd',
    name: 'Rosreestr National Spatial Data Platform',
    url: 'https://nspd.gov.ru/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Russian spatial data platform reference for cadastral and administrative geodata.',
  },
  'russia-open-data-geo': {
    id: 'russia-open-data-geo',
    name: 'Russian Open Data Geodata',
    url: 'https://data.gov.ru/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Russian open-data portal for administrative, locality, and geospatial datasets where available.',
  },
  geosrbija: {
    id: 'geosrbija',
    name: 'GeoSrbija',
    url: 'https://a3.geosrbija.rs/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Serbian national geospatial portal for addresses, roads, settlements, and administrative units.',
  },
  'rgz-serbia': {
    id: 'rgz-serbia',
    name: 'Republic Geodetic Authority Serbia',
    url: 'https://www.rgz.gov.rs/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Serbian cadastre and geodetic authority reference for address and parcel validation.',
  },
  'bosnia-geoportal': {
    id: 'bosnia-geoportal',
    name: 'Bosnia and Herzegovina Geoportal Reference',
    url: 'https://www.fgu.com.ba/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Bosnia and Herzegovina federation geodetic geoportal reference for cadastral and administrative layers.',
  },
  'bosnia-cadastre-reference': {
    id: 'bosnia-cadastre-reference',
    name: 'Bosnia and Herzegovina Cadastre Reference',
    url: 'https://www.rgurs.org/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Bosnia and Herzegovina cadastre reference for entity-level cadastral and settlement validation.',
  },
  'geoportal-montenegro': {
    id: 'geoportal-montenegro',
    name: 'Montenegro Geoportal',
    url: 'https://www.geoportal.co.me/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Montenegro spatial data portal for cadastral, address, and administrative reference layers.',
  },
  'montenegro-cadastre': {
    id: 'montenegro-cadastre',
    name: 'Montenegro Real Estate Administration',
    url: 'https://www.nekretnine.co.me/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Montenegro cadastre and real-estate reference for parcel, settlement, and municipality validation.',
  },
  'kosovo-geoportal': {
    id: 'kosovo-geoportal',
    name: 'Kosovo Geoportal',
    url: 'https://geoportal.rks-gov.net/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Kosovo national geoportal for administrative, cadastral, and spatial reference layers.',
  },
  'kosovo-cadastre': {
    id: 'kosovo-cadastre',
    name: 'Kosovo Cadastral Agency',
    url: 'https://akk.rks-gov.net/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Kosovo cadastral agency reference for parcels, municipalities, and settlement validation.',
  },
  'asig-albania': {
    id: 'asig-albania',
    name: 'ASIG Albania',
    url: 'https://geoportal.asig.gov.al/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Albanian national geospatial information authority geoportal for spatial data and boundaries.',
  },
  'albania-geoportal': {
    id: 'albania-geoportal',
    name: 'Albania Open Geodata Reference',
    url: 'https://geoportal.asig.gov.al/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'Albanian geodata reference for settlements, roads, and administrative geography.',
  },
  'katastar-north-macedonia': {
    id: 'katastar-north-macedonia',
    name: 'Agency for Real Estate Cadastre North Macedonia',
    url: 'https://www.katastar.gov.mk/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'North Macedonia cadastre reference for parcels, municipalities, and settlement geography.',
  },
  'makstat-geodata': {
    id: 'makstat-geodata',
    name: 'MAKStat Geodata',
    url: 'https://www.stat.gov.mk/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'North Macedonia statistical office reference for municipalities, settlements, and territorial datasets.',
  },
  'la-poste-fr-overseas': {
    id: 'la-poste-fr-overseas',
    name: 'La Poste French Overseas Postal Reference',
    url: 'https://www.laposte.fr/outils/trouver-un-code-postal',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'primary',
    notes: 'French postal-code lookup covering metropolitan and overseas territories.',
  },
  'postnord-greenland': {
    id: 'postnord-greenland',
    name: 'PostNord Greenland Postal Codes',
    url: 'https://www.postnord.dk/en/tools/find-postcode',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'PostNord postcode finder used for Greenland postal-code reference and addressing conventions.',
  },
  'postnord-faroe': {
    id: 'postnord-faroe',
    name: 'PostNord Faroe Islands Postal Codes',
    url: 'https://www.postnord.dk/en/tools/find-postcode',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'PostNord postcode finder used for Faroe Islands postal-code reference and addressing conventions.',
  },
  'posten-norway-svalbard': {
    id: 'posten-norway-svalbard',
    name: 'Posten Norway Svalbard and Jan Mayen Postal Reference',
    url: 'https://adressesok.posten.no/',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Posten address and postcode search tool used for Svalbard and Jan Mayen postal routing reference.',
  },
  'armstat-geodata': {
    id: 'armstat-geodata',
    name: 'Armstat Armenia Geodata',
    url: 'https://armstat.am/en/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'Armenian official statistical geography reference for marz, community, and settlement validation.',
  },
  'cadastre-armenia': {
    id: 'cadastre-armenia',
    name: 'Cadastre Committee of Armenia',
    url: 'https://www.cadastre.am/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Armenian cadastral and map reference for parcels, communities, roads, and address-adjacent geography.',
  },
  'haypost-address-reference': {
    id: 'haypost-address-reference',
    name: 'HayPost Address and Postal Index Reference',
    url: 'https://www.haypost.am/en/find-index',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Armenian postal-index lookup and delivery reference for settlement and postal-code validation.',
  },
  'geonames-armenia': {
    id: 'geonames-armenia',
    name: 'GeoNames Armenia',
    url: 'https://www.geonames.org/countries/AM/armenia.html',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'fallback',
    license: 'CC BY 4.0',
    notes: 'Open gazetteer fallback for Armenian alternate settlement names and coordinates.',
  },
  'azerbaijan-state-committee-property': {
    id: 'azerbaijan-state-committee-property',
    name: 'Azerbaijan State Service on Property Issues',
    url: 'https://emlak.gov.az/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Azerbaijani cadastral and property reference for administrative geography and address-adjacent validation.',
  },
  'azerbaijan-open-data': {
    id: 'azerbaijan-open-data',
    name: 'Azerbaijan Open Data Portal',
    url: 'https://www.opendata.az/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'Azerbaijan open-data reference for public administrative and geographic datasets where available.',
  },
  'azerpost-address-reference': {
    id: 'azerpost-address-reference',
    name: 'Azerpost Postal Reference',
    url: 'https://www.azerpost.az/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Azerbaijan postal and delivery reference for postcode and locality validation.',
  },
  'geonames-azerbaijan': {
    id: 'geonames-azerbaijan',
    name: 'GeoNames Azerbaijan',
    url: 'https://www.geonames.org/countries/AZ/azerbaijan.html',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'fallback',
    license: 'CC BY 4.0',
    notes: 'Open gazetteer fallback for Azerbaijani alternate settlement names and coordinates.',
  },
  'napr-georgia': {
    id: 'napr-georgia',
    name: 'National Agency of Public Registry Georgia',
    url: 'https://napr.gov.ge/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Georgian public registry and cadastral reference for parcels, addresses, settlements, and administrative geography.',
  },
  'gdi-georgia': {
    id: 'gdi-georgia',
    name: 'Georgia Spatial Data Infrastructure',
    url: 'https://gdi.gov.ge/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Georgian spatial data infrastructure reference for national geospatial services and map layers.',
  },
  'gpost-address-reference': {
    id: 'gpost-address-reference',
    name: 'Georgian Post Address Reference',
    url: 'https://www.gpost.ge/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Georgian postal and delivery reference for postcode and locality validation.',
  },
  'geonames-georgia': {
    id: 'geonames-georgia',
    name: 'GeoNames Georgia',
    url: 'https://www.geonames.org/countries/GE/georgia.html',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'fallback',
    license: 'CC BY 4.0',
    notes: 'Open gazetteer fallback for Georgian alternate settlement names and coordinates.',
  },
  'correos-spain': {
    id: 'correos-spain',
    name: 'Correos Spain Postal Code Search',
    url: 'https://www.correos.es/es/es/herramientas/codigos-postales/detalle',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Spanish postal-code finder covering mainland, Balearic Islands, and Canary Islands.',
  },
  'ctt-portugal': {
    id: 'ctt-portugal',
    name: 'CTT Portugal Postal Code Search',
    url: 'https://www.ctt.pt/feapl_2/app/open/postalCodeSearch/postalCodeSearch.jspx?lang=def',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'CTT postal-code finder covering mainland Portugal, the Azores, and Madeira.',
  },
  'guernsey-post': {
    id: 'guernsey-post',
    name: 'Guernsey Post',
    url: 'https://www.guernseypost.com/',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Guernsey postcode and delivery reference.',
  },
  'digimap-guernsey': {
    id: 'digimap-guernsey',
    name: 'Digimap Guernsey',
    url: 'https://digimap.gg/',
    kind: 'geocoding',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Guernsey government map and address/geographic reference service for island addressing.',
  },
  'jersey-post': {
    id: 'jersey-post',
    name: 'Jersey Post',
    url: 'https://www.jerseypost.com/tools/address-finder/',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Jersey Post official address and postcode finder.',
  },
  'jersey-gov-open-data': {
    id: 'jersey-gov-open-data',
    name: 'Government of Jersey Open Data',
    url: 'https://opendata.gov.je/',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Jersey open-data portal for parishes, roads, property-adjacent geodata, and public boundary reference.',
  },
  'isle-of-man-post': {
    id: 'isle-of-man-post',
    name: 'Isle of Man Post Office',
    url: 'https://www.iompost.com/tools-forms/postcode-finder/',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Isle of Man Post Office official postcode finder.',
  },
  'isle-of-man-gov-data': {
    id: 'isle-of-man-gov-data',
    name: 'Isle of Man Government Data',
    url: 'https://www.gov.im/about-the-government/departments/cabinet-office/data-and-statistics/',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Isle of Man government data and statistics reference for parish, town, and administrative validation.',
  },
  'royal-gibraltar-post': {
    id: 'royal-gibraltar-post',
    name: 'Royal Gibraltar Post Office',
    url: 'https://www.gibraltar.gov.gi/public-services/post-office',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Gibraltar postal addressing reference.',
  },
  'gibraltar-gis': {
    id: 'gibraltar-gis',
    name: 'Gibraltar Land and Property Services',
    url: 'https://www.gibraltar.gov.gi/land-property-services',
    kind: 'admin-boundary',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Gibraltar land, property, street, and address-adjacent government reference.',
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
  'south-georgia-gis': {
    id: 'south-georgia-gis',
    name: 'Government of South Georgia and the South Sandwich Islands',
    url: 'https://www.gov.gs/',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Territory reference for South Georgia settlements, research stations, islands, and protected areas.',
  },
  'saint-helena-postal': {
    id: 'saint-helena-postal',
    name: 'St Helena Government Postal Service',
    url: 'https://www.sainthelena.gov.sh/public-services/postal/',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Official St Helena postal-service reference for Jamestown routing, postal operations, and STHL 1ZZ delivery conventions.',
  },
  'ascension-post-office': {
    id: 'ascension-post-office',
    name: 'Ascension Island Government Post Office',
    url: 'https://www.ascension.gov.ac/postal-service/post-office',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Official Ascension Island Post Office reference for ASCN 1ZZ routing, mail services, and settlement delivery handling.',
  },
  'tristan-post-office': {
    id: 'tristan-post-office',
    name: 'Tristan da Cunha Post Office',
    url: 'https://www.tristandc.com/postoffice.php',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Official Tristan da Cunha Post Office reference for TDCU 1ZZ routing, postage, and island mail handling.',
  },
  'saint-helena-gov': {
    id: 'saint-helena-gov',
    name: 'Saint Helena Government',
    url: 'https://www.sainthelena.gov.sh/',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Government reference for Saint Helena, Ascension, and Tristan da Cunha settlements and delivery locations.',
  },
};

export const EUROPE_COUNTRY_AND_TERRITORY_CODES = [
  'AD', 'AL', 'AT', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ',
  'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU',
  'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME',
  'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'RU', 'SE',
  'SI', 'SK', 'SM', 'UA', 'VA', 'XK',
  'SBA',
  'BQ', 'AW', 'CW', 'SX',
  'GL', 'FO', 'SJ', 'SJ_SVA', 'SJ_JAN',
  'ES_BAL', 'ES_CAN', 'PT_AZO', 'PT_MAD',
  'GP', 'MQ', 'GF', 'RE', 'YT', 'PF', 'NC', 'WF', 'MF', 'BL', 'PM', 'TF', 'CP',
  'GG', 'JE', 'IM', 'GI', 'FK', 'GS', 'SH', 'AC', 'TA',
] as const;

export type EuropeCountryOrTerritoryCode = (typeof EUROPE_COUNTRY_AND_TERRITORY_CODES)[number];

const BASE_OPEN_SOURCE_IDS: EuropeOpenGeoSourceId[] = [
  'osm-nominatim',
  'osm-overpass',
  'openaddresses',
  'geonames-postal',
  'geonames-gazetteer',
  'geoboundaries',
  'upu-addressing',
  'copernicus-dem',
  'copernicus-corine-land-cover',
  'emodnet-bathymetry',
  'emodnet-seabed-habitats',
  'eea-natura-2000',
  'eea-eunis-habitats',
  'jrc-esdac-soils',
];

const COUNTRY_SOURCE_IDS: Partial<Record<EuropeCountryOrTerritoryCode, EuropeOpenGeoSourceId[]>> = {
  FR: ['data-gouv-fr-postcodes', 'ban-fr', 'ign-bd-topo', 'insee-cog'],
  DE: ['deutsche-post-plz-server', 'openplzapi'],
  NL: ['pdok-bag', 'cbs-nl-postcode-areas', 'opendatasoft-nl-postcodes'],
  BE: ['odwb-be-postcodes'],
  CH: ['openplzapi'],
  AT: ['openplzapi'],
  GB: [
    'postcodes-io',
    'ons-postcode-directory',
    'ordnance-survey-open-names',
    'ordnance-survey-boundary-line',
    'ordnance-survey-open-uprn',
    'ordnance-survey-openmap-local',
  ],
  IE: ['ideal-postcodes-reference'],
  LI: ['openplzapi'],
  SE: ['civictechsweden-posmkod', 'lantmateriet-sweden', 'trafikverket-sweden', 'scb-sweden-geodata'],
  NO: ['data-norge', 'kartverket-norway', 'geonorge-norway', 'brreg-address-register'],
  DK: ['postcode-eu', 'dataforsyningen-denmark', 'danish-address-register-dar', 'geodanmark'],
  FI: ['posti-finland-postal-code-services', 'avoindata-fi-postcodes', 'nls-finland', 'maanmittauslaitos-open-data', 'dvv-finland-address-data'],
  LV: ['latvijas-pasts-check-address', 'kartes-lv-postal-codes', 'lgia-latvia', 'vzd-latvia-address-register', 'data-gov-lv-geodata'],
  EE: ['omniva-estonia-postcodes', 'estonia-aks-postal-codes', 'estonia-aks-postal-areas', 'estonia-aks-address-objects', 'estonia-aks-building-shapes', 'estonia-ehak-admin-boundaries'],
  LT: ['lietuvos-pastas-postcode-search', 'geoportal-lt', 'registru-centras-address-register', 'open-data-lithuania'],
  IS: ['posturinn-iceland-postcodes', 'natt-is50v-postcode-boundaries', 'hms-iceland-address-register', 'natt-is50v-buildings', 'statistics-iceland-geography', 'island-is-open-data'],
  IT: ['poste-italiane-cap-search', 'poste-italiane-cap-professional', 'anncsu-italy-addresses', 'istat-italy-admin-boundaries', 'italy-regional-dbgt-buildings', 'agenzia-entrate-catasto', 'geoportale-nazionale-italy'],
  ES: ['eurostat-gisco-postcodes', 'correos-spain', 'ign-spain-cnig', 'catastro-spain', 'idee-spain'],
  PT: ['eurostat-gisco-postcodes', 'ctt-portugal', 'dgterritorio-portugal', 'snig-portugal', 'bupi-portugal'],
  GR: ['elta-gr', 'ktimatologio-greece', 'geodata-gov-gr', 'okxe-greece'],
  MT: ['eurostat-gisco-postcodes', 'pa-malta-geoserver', 'nso-malta-geodata', 'identity-malta-addressing'],
  SM: ['zauberware-postal-codes', 'san-marino-geoportal', 'san-marino-statistics'],
  MC: ['eu-postal-code-package', 'monaco-gouv-cartography', 'monaco-imsee-geodata'],
  VA: ['zauberware-postal-codes', 'vatican-city-state', 'openstreetmap-vatican'],
  AD: ['postalcodes-info', 'andorra-cartografia', 'andorra-open-data'],
  CY: ['postalcodes-info', 'cyprus-department-lands-surveys', 'cyprus-open-data-portal', 'inspire-cyprus'],
  RO: ['okfn-index-postcodes', 'ancpi-romania-geoportal', 'romania-open-data'],
  BG: ['scrape4u-postal-codes', 'cadastre-bulgaria', 'bulgaria-inspire-geoportal'],
  UA: ['eurostat-gisco-postcodes', 'data-gov-ua-geodata', 'ukraine-cadastre-map'],
  MD: ['scrape4u-postal-codes', 'geoportal-moldova', 'moldova-open-data'],
  BY: ['scrape4u-postal-codes', 'belarus-nca-geoportal'],
  RU: ['datahub-postal', 'rosreestr-nspd', 'russia-open-data-geo'],
  RS: ['datahub-postal', 'geosrbija', 'rgz-serbia'],
  BA: ['datahub-postal', 'bosnia-geoportal', 'bosnia-cadastre-reference'],
  ME: ['eurostat-gisco-postcodes', 'geoportal-montenegro', 'montenegro-cadastre'],
  XK: ['spotzi-postal-codes', 'kosovo-geoportal', 'kosovo-cadastre'],
  AL: ['spotzi-postal-codes', 'asig-albania', 'albania-geoportal'],
  MK: ['datahub-postal', 'katastar-north-macedonia', 'makstat-geodata'],
  CZ: ['ceska-posta-psc', 'cuzk-ruian', 'cuzk-geoportal'],
  HR: ['posta-hr', 'dgu-croatia-geoportal', 'croatia-cadastre'],
  HU: ['posta-hu', 'lechner-hungary-geodata', 'hungary-public-road-data'],
  PL: ['poczta-polska', 'geoportal-gov-pl', 'gus-teryt-poland'],
  SI: ['posta-si', 'eprostor-slovenia', 'gurs-slovenia'],
  SK: ['slovenska-posta-psc', 'zbgis-slovakia', 'slovakia-address-register'],
  BQ: ['zippopotam'],
  AW: ['zippopotam'],
  CW: ['zippopotam'],
  SX: ['zippopotam'],
  GL: ['postnord-greenland', ...getPolarOpenSourceIds('GL')],
  FO: ['postnord-faroe'],
  SJ: ['posten-norway-svalbard', ...getPolarOpenSourceIds('SJ')],
  SJ_SVA: ['posten-norway-svalbard', ...getPolarOpenSourceIds('SJ_SVA')],
  SJ_JAN: ['posten-norway-svalbard', ...getPolarOpenSourceIds('SJ_JAN')],
  ES_BAL: ['correos-spain', 'eurostat-gisco-postcodes'],
  ES_CAN: ['correos-spain', 'eurostat-gisco-postcodes'],
  PT_AZO: ['ctt-portugal', 'eurostat-gisco-postcodes'],
  PT_MAD: ['ctt-portugal', 'eurostat-gisco-postcodes'],
  GP: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  MQ: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  GF: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  RE: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  YT: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  PF: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  NC: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  WF: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  MF: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  BL: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  PM: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  TF: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes', ...getPolarOpenSourceIds('TF')],
  CP: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  GG: ['guernsey-post', 'digimap-guernsey'],
  JE: ['jersey-post', 'jersey-gov-open-data'],
  IM: ['isle-of-man-post', 'isle-of-man-gov-data'],
  GI: ['royal-gibraltar-post', 'gibraltar-gis'],
  FK: ['falkland-islands-post', 'falkland-islands-gis'],
  GS: ['british-overseas-postal-reference', 'south-georgia-gis', ...getPolarOpenSourceIds('GS')],
  SH: ['british-overseas-postal-reference', 'saint-helena-postal'],
  AC: ['british-overseas-postal-reference', 'ascension-post-office'],
  TA: ['british-overseas-postal-reference', 'tristan-post-office'],
};

export function getEuropeOpenSourceIds(countryCode: string): EuropeOpenGeoSourceId[] {
  const code = countryCode.toUpperCase() as EuropeCountryOrTerritoryCode;
  return [...new Set([...(COUNTRY_SOURCE_IDS[code] ?? []), ...BASE_OPEN_SOURCE_IDS])];
}

export const EUROPE_COUNTRY_OPEN_SOURCE_IDS = EUROPE_COUNTRY_AND_TERRITORY_CODES.reduce(
  (sourcesByCountry, countryCode) => ({
    ...sourcesByCountry,
    [countryCode]: getEuropeOpenSourceIds(countryCode),
  }),
  {} as Record<EuropeCountryOrTerritoryCode, EuropeOpenGeoSourceId[]>,
);
