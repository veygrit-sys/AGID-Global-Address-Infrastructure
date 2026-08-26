export type AsiaOpenGeoSourceId =
  | 'osm-nominatim'
  | 'osm-overpass'
  | 'openaddresses'
  | 'geonames-postal'
  | 'geonames-gazetteer'
  | 'geoboundaries'
  | 'upu-addressing'
  | 'nasa-srtm'
  | 'jaxa-aw3d30'
  | 'gebco-bathymetry'
  | 'gmrt-topography'
  | 'hydrosheds'
  | 'esa-worldcover'
  | 'protected-planet-wdpa'
  | 'gbif-occurrence'
  | 'landsd-hk'
  | 'csdi-hk'
  | 'osm-hong-kong'
  | 'dscc-macao'
  | 'geoguide-macao'
  | 'osm-macau'
  | 'zipcloud-jp'
  | 'gsi-japan-tiles'
  | 'gsi-japan-vector'
  | 'gsi-basic-geospatial'
  | 'gsi-dem'
  | 'jageocoder'
  | 'geolonia-addresses'
  | 'osm-japan'
  | 'china-postal-code'
  | 'epost-kr'
  | 'ngii-korea'
  | 'lx-korea'
  | 'juso-kr'
  | 'osm-korea'
  | 'korea-post-postcode-system'
  | 'korea-post-postcode-api'
  | 'mois-juso-basic-districts'
  | 'mois-juso-road-address-api'
  | 'mois-juso-building-db'
  | 'mois-juso-electronic-map'
  | 'molit-korea-gis-integrated-buildings'
  | 'molit-korea-continuous-cadastral-map'
  | 'post-tw'
  | 'nlsc-taiwan'
  | 'tgos-taiwan'
  | 'osm-taiwan'
  | 'g0v-taiwan'
  | 'chunghwa-post-3plus3-data'
  | 'chunghwa-post-3plus3-lookup'
  | 'chunghwa-post-3plus3-license'
  | 'moi-taiwan-national-doorplate-location'
  | 'nlsc-taiwan-emap-buildings'
  | 'nlsc-taiwan-emap-doorplates'
  | 'nlsc-taiwan-administrative-boundaries'
  | 'nlsc-taiwan-cadastral-map'
  | 'alamgc-mongolia'
  | 'nsdi-mongolia'
  | 'zipcode-mn'
  | 'hot-osm-mongolia'
  | 'osm-mongolia'
  | 'crc-mongolia-unified-postcode-2019'
  | 'upu-mongolia-addressing'
  | 'crc-mongolia-postal-regulation'
  | 'gazar-mongolia-address-system'
  | 'gazar-mongolia-spatial-data-standards'
  | 'gazar-mongolia-boundaries'
  | 'gazar-mongolia-open-spatial-data'
  | 'nso-mongolia-administrative-units'
  | 'india-post-regulations-2024'
  | 'postalpincode-in'
  | 'data-gov-in-pincode'
  | 'data-gov-in-pincode-boundary'
  | 'data-gov-in-godl'
  | 'india-lgd-pin-crosswalk'
  | 'india-digipin'
  | 'survey-of-india-abdb'
  | 'india-pincode-api-oss'
  | 'survey-of-india'
  | 'datameet-maps'
  | 'osm-india'
  | 'hot-osm-south-asia'
  | 'pakpost'
  | 'survey-of-pakistan'
  | 'pak-nsdi'
  | 'pbs-gis-pakistan'
  | 'osm-pakistan'
  | 'pakistan-post-postcode-directory'
  | 'upu-pakistan-addressing'
  | 'pakistan-post-postcode-amendments'
  | 'survey-of-pakistan-mapping-law'
  | 'survey-of-pakistan-geospatial-products'
  | 'pakistan-nsdi'
  | 'pakistan-pbs-census-gis'
  | 'bangladesh-post-postcode-tables'
  | 'upu-bangladesh-addressing'
  | 'survey-of-bangladesh-gis-services'
  | 'bangladesh-nsdi-geoportal'
  | 'bangladesh-nsdi-data-catalog'
  | 'bbs-bangladesh-census-2022'
  | 'dlrs-bangladesh-map-portal'
  | 'bd-post'
  | 'survey-bangladesh'
  | 'osm-bangladesh'
  | 'hot-osm-bangladesh'
  | 'postalservice-np'
  | 'national-geoportal-nepal'
  | 'survey-department-nepal'
  | 'osm-nepal'
  | 'hot-osm-nepal'
  | 'cambodia-post'
  | 'odc-cambodia-postal-codes'
  | 'osm-cambodia'
  | 'slpost'
  | 'survey-department-sri-lanka'
  | 'data-gov-lk'
  | 'osm-sri-lanka'
  | 'maldives-post'
  | 'mlsa-maldives'
  | 'onemap-maldives'
  | 'upu-maldives-addressing-2004'
  | 'maldives-onemap-island-api-2024'
  | 'maldives-geomatics-land-survey-standard-2025'
  | 'maldives-land-registration-survey-guideline-2020'
  | 'maldives-bureau-statistics-gis-maps'
  | 'maldives-census-island-atoll-2022'
  | 'osm-maldives'
  | 'afghan-post'
  | 'afghan-postal-code-system'
  | 'hot-osm-afghanistan'
  | 'osm-afghanistan'
  | 'nlcs-bhutan'
  | 'bhutan-geoportal'
  | 'osm-bhutan'
  | 'thailand-post'
  | 'vietnam-postcode'
  | 'vietnam-national-postcode-portal'
  | 'vietnam-postcode-decision-2334-2025'
  | 'vnpost-two-tier-postcode-notice'
  | 'upu-vietnam-addressing'
  | 'vnpost-vpostcode-digital-address'
  | 'vietnam-nso-administrative-units'
  | 'vietnam-nsdi-portal'
  | 'vietnam-survey-map-data-service'
  | 'pos-malaysia-postcode-finder'
  | 'upu-malaysia-addressing'
  | 'malaysia-mygdx-postcode-catalog'
  | 'malaysia-mygeo-fundamental-data-2026'
  | 'malaysia-mygos-data-services'
  | 'malaysia-mygeo-upi'
  | 'malaysia-mygdi-licensing-2024'
  | 'malaysia-mygeoname'
  | 'myanmar-post-postcode-lookup'
  | 'myanmar-national-portal-post-services'
  | 'upu-myanmar-addressing-2022'
  | 'myanmar-survey-department'
  | 'myanmar-one-map-geodatabase-2024'
  | 'mimu-place-codes-v9-6-2025'
  | 'mimu-geospatial-data'
  | 'mimu-terms-and-conditions'
  | 'ycdc-land-building-services'
  | 'pos-malaysia'
  | 'onemap-sg'
  | 'indonesia-post-law-2009'
  | 'indonesia-post-regulation-2025'
  | 'pos-indonesia'
  | 'upu-indonesia-addressing'
  | 'sdi-indonesia-village-postcode'
  | 'kemendagri-indonesia-admin-codes'
  | 'bps-indonesia-statistical-area-codes'
  | 'big-indonesia-village-boundaries'
  | 'big-indonesia-rbi-buildings'
  | 'phlpost-zip-code-locator'
  | 'upu-philippines-addressing'
  | 'psa-philippine-standard-geographic-code'
  | 'geoportal-philippines-data-inventory'
  | 'geoportal-philippines-download-policy'
  | 'namria-topographic-mapping'
  | 'psa-popcen-cbms-geotagging'
  | 'philippines-lra-land-registration'
  | 'phlpost'
  | 'post-gov-bn'
  | 'brunei-post-postcode-booklet'
  | 'upu-brunei-addressing'
  | 'brunei-survey-house-numbering'
  | 'brunei-survey-digital-map-products'
  | 'brunei-survey-geoportal'
  | 'brunei-survey-geoportal-user-guide'
  | 'brunei-deps-bpp-2021'
  | 'brunei-land-registration-framework'
  | 'bhutan-post'
  | 'bhutan-post-postcode-finder'
  | 'bhutan-post-domestic-footprint'
  | 'upu-bhutan-addressing'
  | 'bhutan-nlcs-geoportal'
  | 'bhutan-nlcs-map-products'
  | 'bhutan-nlcs-cadastral-information'
  | 'bhutan-nsb-phcb-2017'
  | 'bhutan-esakor-land-building-transactions'
  | 'turkiye-ptt'
  | 'osm-turkey'
  | 'gavahi-post-ir'
  | 'iran-nsdi'
  | 'iran-open-data'
  | 'osm-iran'
  | 'iraq-post'
  | 'osm-iraq'
  | 'syria-post'
  | 'osm-syria'
  | 'hot-osm-west-asia'
  | 'libanpost'
  | 'osm-lebanon'
  | 'jordanpost'
  | 'rjgc-jordan'
  | 'upu-jordan-addressing-2004'
  | 'modee-jordan-postal-policy-2025'
  | 'trc-jordan-postal-sector'
  | 'jordan-post-offices-open-data-2023'
  | 'jordan-open-government-data-license-v1'
  | 'rjgc-jordan-eservices'
  | 'rjgc-gam-building-mou'
  | 'dls-jordan-village-codes-2022'
  | 'gam-jordan-streets-2019'
  | 'jordan-digital-mailbox-pilot-2026'
  | 'osm-jordan'
  | 'israel-post'
  | 'govmap-israel'
  | 'data-gov-il'
  | 'osm-israel'
  | 'palestine-open-data-postcodes'
  | 'palestine-post'
  | 'osm-palestine'
  | 'spl-sa'
  | 'spl-national-address-api'
  | 'spl-national-address-components'
  | 'spl-national-address-api-v31'
  | 'spl-national-address-api-terms'
  | 'spl-national-address-short-address'
  | 'geosa-saudi-geospatial-foundation-themes'
  | 'rega-saudi-geospatial-real-estate-portal'
  | 'rega-saudi-real-estate-registration-framework'
  | 'saudi-gis-national-platform'
  | 'osm-saudi-arabia'
  | 'makani-dubai-open-data'
  | 'osm-uae'
  | 'qatar-gis-geoportal'
  | 'osm-qatar'
  | 'bahrain-open-data'
  | 'bahrain-post-services-directory'
  | 'upu-bahrain-addressing'
  | 'iga-bahrain-address-services'
  | 'bahrain-open-data-terms'
  | 'bahrain-open-data-geographic-locations'
  | 'bahrain-municipal-geographic-explorer'
  | 'slrb-bahrain-cadastre'
  | 'osm-bahrain'
  | 'kuwait-post'
  | 'upu-kuwait-addressing'
  | 'paci-kuwait-finder'
  | 'paci-kuwait-address-services'
  | 'paci-kuwait-building-register'
  | 'kuwait-municipality-parcels'
  | 'kuwait-csb-census-gis'
  | 'osm-kuwait'
  | 'upu-oman-postal-addressing'
  | 'oman-post-office-locator'
  | 'oman-post-website-terms'
  | 'gov-oman-building-addressing-service'
  | 'ncsi-oman-wilayat-boundaries'
  | 'ncsi-oman-open-government-data-policy'
  | 'nsgia-oman-geospatial-governance'
  | 'nsgia-oman-portal-terms'
  | 'nsgia-oman'
  | 'oman-post'
  | 'osm-oman'
  | 'yemen-post'
  | 'osm-yemen'
  | 'haypost-am'
  | 'armstat-geodata'
  | 'cadastre-armenia'
  | 'haypost-address-reference'
  | 'geonames-armenia'
  | 'armenia-real-estate-address-register'
  | 'armenia-national-geoportal-buildings'
  | 'azerbaijan-state-committee-property'
  | 'azerbaijan-address-register'
  | 'azerbaijan-open-data'
  | 'azerpost-address-reference'
  | 'geonames-azerbaijan'
  | 'gpost-ge'
  | 'napr-georgia'
  | 'gdi-georgia'
  | 'gpost-address-reference'
  | 'geonames-georgia'
  | 'georgian-post-postcode-finder'
  | 'georgian-post-addressing-guide'
  | 'napr-georgia-address-registry'
  | 'nsdi-georgia-address-layer'
  | 'nsdi-georgia-registered-buildings'
  | 'nsdi-georgia-registered-parcels'
  | 'nsdi-georgia-administrative-boundaries'
  | 'geostat-georgia-administrative-classification'
  | 'post-kz'
  | 'pochta-uz'
  | 'datahub-postal-kz'
  | 'kazakhstan-nsdi'
  | 'qazpost-open-api'
  | 'osm-kazakhstan'
  | 'uzbekistan-open-data-geo'
  | 'uzbekistan-state-urban-cadastre'
  | 'osm-uzbekistan'
  | 'nsdi-kyrgyzstan'
  | 'data-gov-kg'
  | 'caiag-geonode-kg'
  | 'osm-kyrgyzstan'
  | 'tajik-post'
  | 'osm-tajikistan'
  | 'openaerialmap-tajikistan'
  | 'hot-osm-central-asia'
  | 'turkmenpost'
  | 'osm-turkmenistan';

export interface AsiaOpenGeoSource {
  id: AsiaOpenGeoSourceId;
  name: string;
  url: string;
  kind:
    | 'postal-code'
    | 'address'
    | 'building'
    | 'geocoding'
    | 'admin-boundary'
    | 'gazetteer'
    | 'standard'
    | 'map-tile'
    | 'elevation'
    | 'marine'
    | 'hydrology'
    | 'land-cover'
    | 'protected-area'
    | 'biodiversity';
  coverage: 'global' | 'asia' | 'country';
  usage: 'primary' | 'fallback' | 'validation' | 'reference';
  license?: string;
  notes: string;
}

export const ASIA_OPEN_GEO_SOURCES: Record<AsiaOpenGeoSourceId, AsiaOpenGeoSource> = {
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
    notes: 'Queryable OSM address tags, streets, settlements, and administrative relations.',
  },
  openaddresses: {
    id: 'openaddresses',
    name: 'OpenAddresses',
    url: 'https://openaddresses.io/',
    kind: 'address',
    coverage: 'global',
    usage: 'validation',
    license: 'Varies by source dataset',
    notes: 'Open address point/reference data where country, city, or regional coverage is available.',
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
    notes: 'Open administrative boundaries for province, district, municipality, township, and local hierarchy checks.',
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
  'nasa-srtm': {
    id: 'nasa-srtm',
    name: 'NASA Shuttle Radar Topography Mission',
    url: 'https://www.earthdata.nasa.gov/data/instruments/srtm',
    kind: 'elevation',
    coverage: 'global',
    usage: 'reference',
    license: 'NASA Earthdata terms',
    notes: 'Near-global elevation reference for Asian mountain ranges, plateaus, valleys, slopes, watersheds, and coastal terrain context.',
  },
  'jaxa-aw3d30': {
    id: 'jaxa-aw3d30',
    name: 'JAXA ALOS World 3D - 30m',
    url: 'https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/index.htm',
    kind: 'elevation',
    coverage: 'global',
    usage: 'reference',
    license: 'JAXA AW3D30 terms of use',
    notes: 'Open 30m digital surface model useful for Asia-specific mountains, islands, dense urban terrain, highlands, and rural route context.',
  },
  'gebco-bathymetry': {
    id: 'gebco-bathymetry',
    name: 'GEBCO Gridded Bathymetry',
    url: 'https://www.gebco.net/data_and_products/gridded_bathymetry_data/',
    kind: 'marine',
    coverage: 'global',
    usage: 'reference',
    license: 'GEBCO terms of use',
    notes: 'Global bathymetry and land elevation grid for Asian seas, straits, trenches, shelves, archipelagos, and offshore island context.',
  },
  'gmrt-topography': {
    id: 'gmrt-topography',
    name: 'Global Multi-Resolution Topography',
    url: 'https://www.gmrt.org/',
    kind: 'marine',
    coverage: 'global',
    usage: 'reference',
    license: 'GMRT terms of use',
    notes: 'Marine and coastal topography synthesis for Asian island arcs, seamounts, ridges, trenches, shelves, ports, and coastal address context.',
  },
  hydrosheds: {
    id: 'hydrosheds',
    name: 'HydroSHEDS',
    url: 'https://www.hydrosheds.org/',
    kind: 'hydrology',
    coverage: 'global',
    usage: 'reference',
    license: 'Free for non-commercial use; check HydroSHEDS license for redistribution',
    notes: 'Hydrographic basins, river networks, lakes, and drainage context for Asian river systems, deltas, wetlands, and water-adjacent settlements.',
  },
  'esa-worldcover': {
    id: 'esa-worldcover',
    name: 'ESA WorldCover',
    url: 'https://esa-worldcover.org/en/data-access',
    kind: 'land-cover',
    coverage: 'global',
    usage: 'reference',
    license: 'Free and open data access',
    notes: '10m global land-cover reference for Asian forest, wetland, mangrove, desert, cropland, snow, bare ground, and urban-edge context.',
  },
  'protected-planet-wdpa': {
    id: 'protected-planet-wdpa',
    name: 'Protected Planet WDPA',
    url: 'https://www.protectedplanet.net/en/thematic-areas/wdpa',
    kind: 'protected-area',
    coverage: 'global',
    usage: 'reference',
    license: 'UNEP-WCMC and IUCN terms',
    notes: 'Protected terrestrial and marine areas for Asian national parks, reserves, sacred natural sites, marine parks, and conservation-area context.',
  },
  'gbif-occurrence': {
    id: 'gbif-occurrence',
    name: 'GBIF Occurrence API',
    url: 'https://techdocs.gbif.org/en/openapi/v1/occurrence',
    kind: 'biodiversity',
    coverage: 'global',
    usage: 'reference',
    license: 'Varies by dataset record',
    notes: 'Biodiversity occurrence evidence for Asian ecosystem, habitat, rainforest, desert, alpine, island, and protected-nature context.',
  },
  'landsd-hk': {
    id: 'landsd-hk',
    name: 'Hong Kong Lands Department Geospatial Information Services',
    url: 'https://www.landsd.gov.hk/en/spatial-data/geospatial-infomation-services.html',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Hong Kong geospatial source for roads, buildings, administrative areas, elevation, imagery, 3D map data, and open spatial services.',
  },
  'csdi-hk': {
    id: 'csdi-hk',
    name: 'Hong Kong Common Spatial Data Infrastructure Portal',
    url: 'https://portal.csdi.gov.hk/',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'primary',
    notes: 'Hong Kong CSDI portal with open spatial datasets, APIs, OGC WFS/WMS, ArcGIS REST services, and smart-city geodata integration.',
  },
  'osm-hong-kong': {
    id: 'osm-hong-kong',
    name: 'OpenStreetMap Hong Kong',
    url: 'https://wiki.openstreetmap.org/wiki/Hong_Kong',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'High-density Hong Kong OSM building, POI, road, and local-name data for address fallback and validation.',
  },
  'dscc-macao': {
    id: 'dscc-macao',
    name: 'Cartography and Cadastre Bureau Macao',
    url: 'https://www.dscc.gov.mo/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Macao cartography and cadastre source for cadastral data, administrative boundaries, roads, buildings, and geospatial services.',
  },
  'geoguide-macao': {
    id: 'geoguide-macao',
    name: 'Macao GeoGuide',
    url: 'https://www.map.gov.mo/',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'primary',
    notes: 'Macao public map search and GIS service for local place, road, building, and public-data lookup.',
  },
  'osm-macau': {
    id: 'osm-macau',
    name: 'OpenStreetMap Macau',
    url: 'https://wiki.openstreetmap.org/wiki/Macau',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'OSM Macau data for roads, buildings, POI, local names, and fallback address validation.',
  },
  'zipcloud-jp': {
    id: 'zipcloud-jp',
    name: 'zipcloud Japan Postal Code API',
    url: 'https://zipcloud.ibsnet.co.jp/doc/api',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Free Japan postal-code lookup API backed by Japan Post data.',
  },
  'gsi-japan-tiles': {
    id: 'gsi-japan-tiles',
    name: 'Geospatial Information Authority of Japan Tiles',
    url: 'https://maps.gsi.go.jp/development/ichiran.html',
    kind: 'map-tile',
    coverage: 'country',
    usage: 'primary',
    notes: 'Japan official XYZ tile catalog for standard maps, aerial imagery, disaster maps, and basemap rendering.',
  },
  'gsi-japan-vector': {
    id: 'gsi-japan-vector',
    name: 'GSI Maps Vector Experiment',
    url: 'https://github.com/gsi-cyberjapan/gsimaps-vector-experiment',
    kind: 'map-tile',
    coverage: 'country',
    usage: 'reference',
    notes: 'Experimental vector tiles for roads, buildings, administrative boundaries, and Japanese basemap styling.',
  },
  'gsi-basic-geospatial': {
    id: 'gsi-basic-geospatial',
    name: 'GSI Fundamental Geospatial Data',
    url: 'https://www.gsi.go.jp/kiban/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Japanese base geospatial data for administrative boundaries, roads, buildings, water, and reference features.',
  },
  'gsi-dem': {
    id: 'gsi-dem',
    name: 'GSI Elevation Tiles and DEM',
    url: 'https://maps.gsi.go.jp/development/demtile.html',
    kind: 'elevation',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Japan elevation tiles for mountain, slope, watershed, coastal, and disaster-context address quality.',
  },
  jageocoder: {
    id: 'jageocoder',
    name: 'jageocoder',
    url: 'https://github.com/t-sagara/jageocoder',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'primary',
    license: 'MIT',
    notes: 'Open-source Japanese address geocoder for address parsing, normalization, chome/ban/go decomposition, and coordinate lookup.',
  },
  'geolonia-addresses': {
    id: 'geolonia-addresses',
    name: 'Geolonia Japanese Addresses',
    url: 'https://github.com/geolonia/japanese-addresses',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'CC BY 4.0',
    notes: 'Open Japanese town-level address dictionary and GeoJSON reference for prefecture, municipality, and town normalization.',
  },
  'osm-japan': {
    id: 'osm-japan',
    name: 'OpenStreetMap Japan',
    url: 'https://openstreetmap.jp/',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Japan OSM community data for buildings, shops, POI, roads, and fallback address tags.',
  },
  'china-postal-code': {
    id: 'china-postal-code',
    name: 'China Post / EMS Postal Code Reference',
    url: 'http://www.ems.com.cn/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'China postal-code reference source for mainland delivery validation.',
  },
  'korea-post-postcode-system': {
    id: 'korea-post-postcode-system',
    name: 'Korea Post Five-digit Postcode System',
    url: 'https://www.koreapost.go.kr/kpost/subIndex/134.do?pSiteIdx=125',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official system reference: since 1 August 2015 the five-digit National Basic District Number is the postcode. Digit structure is not current assignment or geometry evidence.',
  },
  'korea-post-postcode-api': {
    id: 'korea-post-postcode-api',
    name: 'Korea Post Postcode API',
    url: 'https://www.data.go.kr/data/15056971/openapi.do?recommendDataYn=Y',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Credentialed public-data API; service-key, approval, traffic, field and redistribution terms apply',
    notes: 'Official service-key API returns a five-digit postcode with road-name and land-lot addresses. A query receipt is assignment evidence, not geometry or a bulk redistribution licence.',
  },
  'mois-juso-basic-districts': {
    id: 'mois-juso-basic-districts',
    name: 'MOIS Juso National Basic Districts',
    url: 'https://eng.juso.go.kr/addrlink/adresInfoProvd/guidance/provdAdresInfo.do',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'KOGL Type 1 attribution shown for the electronic-map product; application approval and exact product-specific terms still apply',
    notes: 'The exact current official Polygon or MultiPolygon carrying the same five-digit National Basic District Number is canonical postal geometry. Every layer pins product-specific CRS: EPSG:5179 or EPSG:5186 is verified rather than assumed.',
  },
  'mois-juso-road-address-api': {
    id: 'mois-juso-road-address-api',
    name: 'MOIS Juso Real-time Road Address API',
    url: 'https://www.data.go.kr/data/15057017/openapi.do?recommendDataYn=Y',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'Credentialed public-data API; exact approval, purpose, fields and reuse terms apply',
    notes: 'Official road-address API can return five-digit postcode, public address components, road-address management number and 25-digit building management number. The response is not a building footprint.',
  },
  'mois-juso-building-db': {
    id: 'mois-juso-building-db',
    name: 'MOIS Juso Public Building DB',
    url: 'https://eng.juso.go.kr/addrlink/adresInfoProvd/guidance/othbcAdresInfo.do',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'Exact public-address artifact terms, edition, public-field allowlist and attribution required',
    notes: 'Official building-level address and 25-digit building-management identity. One road address can relate to multiple buildings; a DB row supplies no geometry and no resident or household identity.',
  },
  'mois-juso-electronic-map': {
    id: 'mois-juso-electronic-map',
    name: 'MOIS Juso Electronic Map',
    url: 'https://www.data.go.kr/tcs/dss/selectFileDataDetailView.do?publicDataPk=15050413',
    kind: 'building',
    coverage: 'country',
    usage: 'primary',
    license: 'Application, identity and purpose approval with exact KOGL, derivative and redistribution terms per layer',
    notes: 'Official buildings, building groups, entrances, roads, National Basic Districts and administrative geometry. Exact building output needs an explicit source-defined identifier or documented join; approval is not unrestricted vector redistribution.',
  },
  'molit-korea-gis-integrated-buildings': {
    id: 'molit-korea-gis-integrated-buildings',
    name: 'MOLIT GIS Integrated Building Information',
    url: 'https://www.data.go.kr/data/15052097/fileData.do?recommendDataYn=Y',
    kind: 'building',
    coverage: 'country',
    usage: 'validation',
    license: 'No use restriction recorded for the exact portal product; edition, schema, fields, attribution and third-party rights still pinned',
    notes: 'Official topographic building geometry integrated with public building-register attributes. Exact Juso linkage requires a stable identifier or reviewed crosswalk; spatial overlap is not a crosswalk and private register fields stay excluded.',
  },
  'molit-korea-continuous-cadastral-map': {
    id: 'molit-korea-continuous-cadastral-map',
    name: 'MOLIT Nationwide Continuous Cadastral Map',
    url: 'https://www.data.go.kr/data/15125044/fileData.do?recommendDataYn=Y',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    license: 'KOGL Type 4: attribution, non-commercial use and no modification for the exact nationwide snapshot',
    notes: 'Official reference-only continuous cadastral drawing, not survey data. A parcel is not a building, postcode area or exact address link; owner and rights data are excluded.',
  },
  'epost-kr': {
    id: 'epost-kr',
    name: 'Korea Post Postal Code Search',
    url: 'https://www.epost.go.kr/search/zipcode/cmzcd001k01.jsp',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Current ePOST postal-code search page for Korean road-name and land-lot address lookup.',
  },
  'ngii-korea': {
    id: 'ngii-korea',
    name: 'National Geographic Information Institute Korea',
    url: 'https://www.ngii.go.kr/eng/main.do',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'South Korea official national mapping source for base maps, geographic names, elevation, roads, and administrative areas.',
  },
  'lx-korea': {
    id: 'lx-korea',
    name: 'Korea Land and Geospatial Informatix Corporation',
    url: 'https://www.lx.or.kr/eng.do',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Korean cadastral, land, geospatial information, and digital-twin reference source.',
  },
  'juso-kr': {
    id: 'juso-kr',
    name: 'Korea Road Name Address System',
    url: 'https://www.juso.go.kr/openEngPage.do',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Korean road-name address lookup and English address rendering reference.',
  },
  'osm-korea': {
    id: 'osm-korea',
    name: 'OpenStreetMap Korea',
    url: 'https://osm.kr/',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Korean OSM community data for roads, POI, buildings, and fallback address tags.',
  },
  'chunghwa-post-3plus3-data': {
    id: 'chunghwa-post-3plus3-data',
    name: 'Chunghwa Post 3+3 Postal Code Open Data',
    url: 'https://data.gov.tw/dataset/150689',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Taiwan Open Government Data License v1 with exact Chunghwa Post public authorization review',
    notes: 'Official six-digit 3+3 address-range and delivery-specific assignment data. The first three digits are an administrative prefix and the last three are a delivery district or specific code; rows are not official polygons.',
  },
  'chunghwa-post-3plus3-lookup': {
    id: 'chunghwa-post-3plus3-lookup',
    name: 'Chunghwa Post 3+3 Postal Code Lookup',
    url: 'https://www.post.gov.tw/post/internet/Postal/index.jsp?ID=208&list=3',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official address lookup uses county or city, district, road or place, section, lane, alley, house number, floor, room, odd-even and range semantics. The registered Web Service is single-query and access-controlled; lookup is not bulk data or geometry.',
  },
  'chunghwa-post-3plus3-license': {
    id: 'chunghwa-post-3plus3-license',
    name: 'Chunghwa Post 3+3 Public Authorization',
    url: 'https://www.post.gov.tw/post/internet/Download/all_list.jsp',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official legal and download reference for exact covered 3+3 artifacts and third-party-rights review. License metadata is not postal assignment, address, geometry or deliverability evidence.',
  },
  'moi-taiwan-national-doorplate-location': {
    id: 'moi-taiwan-national-doorplate-location',
    name: 'MOI Nationwide Doorplate Location Coordination',
    url: 'https://maps.nlsc.gov.tw/pro/get_map_message.jsp',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'Controlled/query or exact local-government terms; no blanket national bulk grant assumed',
    notes: 'Local governments maintain and upload doorplate locations; NLSC obtains nationwide positions every two months for map and search functions. A doorplate is a point, not a building footprint, and public positioning is not blanket bulk permission; household data stays private.',
  },
  'nlsc-taiwan-emap-buildings': {
    id: 'nlsc-taiwan-emap-buildings',
    name: 'NLSC Taiwan eMap Building Frames',
    url: 'https://www.nlsc.gov.tw/cp.aspx?n=1549',
    kind: 'building',
    coverage: 'country',
    usage: 'validation',
    license: 'Controlled, fee or subscription product; exact derivative and redistribution rights required',
    notes: 'Official Taiwan eMap building geometry requires an explicit address relation or common stable identifier for exact output. Viewer, WMS, WMTS or government WFS eligibility is not an open reusable vector licence.',
  },
  'nlsc-taiwan-emap-doorplates': {
    id: 'nlsc-taiwan-emap-doorplates',
    name: 'NLSC Taiwan eMap Doorplate Layer',
    url: 'https://maps.nlsc.gov.tw/S09SOA/pro/wfs.jsp',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'Viewer/WMS or controlled government-unit WFS; exact vector rights required',
    notes: 'Official doorplate layer is point and address evidence, not a building or postal polygon. Public image display and government-unit WFS application do not automatically authorize public vector redistribution.',
  },
  'nlsc-taiwan-administrative-boundaries': {
    id: 'nlsc-taiwan-administrative-boundaries',
    name: 'NLSC Taiwan Administrative Boundary Downloads',
    url: 'https://maps.nlsc.gov.tw/pro/download.jsp',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Taiwan Open Government Data License v1; exact edition and attribution required',
    notes: 'Official county or city, township or district, and village or li boundaries retain TWD97 EPSG:3824, TM2 zone 121 EPSG:3826 or zone 119 EPSG:3825 source metadata. They are not postal areas and coverage is not a sovereignty conclusion.',
  },
  'nlsc-taiwan-cadastral-map': {
    id: 'nlsc-taiwan-cadastral-map',
    name: 'NLSC Taiwan Cadastral Map',
    url: 'https://maps.nlsc.gov.tw/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    license: 'Viewer or source-specific controlled access; no blanket vector redistribution right assumed',
    notes: 'Official cadastral viewer and services provide parcel validation context. Viewer pixels are not reusable vectors, parcels are not buildings or exact address links, and owner or rights information is excluded.',
  },
  'post-tw': {
    id: 'post-tw',
    name: 'Chunghwa Post Postal Code Lookup',
    url: 'https://www.post.gov.tw/post/internet/Postal/index.jsp?ID=208',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Taiwan postal-code lookup and administrative delivery reference.',
  },
  'nlsc-taiwan': {
    id: 'nlsc-taiwan',
    name: 'National Land Surveying and Mapping Center Taiwan',
    url: 'https://www.nlsc.gov.tw/en/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Taiwan official land surveying and mapping source for national maps, cadastral data, administrative boundaries, roads, and elevation.',
  },
  'tgos-taiwan': {
    id: 'tgos-taiwan',
    name: 'Taiwan Geospatial One Stop TGOS',
    url: 'https://api.tgos.tw/TGOS_MAP_API/docs/site/web',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'primary',
    notes: 'Taiwan official geospatial platform for map APIs, geocoding, reverse geocoding, and administrative geodata.',
  },
  'osm-taiwan': {
    id: 'osm-taiwan',
    name: 'OpenStreetMap Taiwan',
    url: 'https://wiki.openstreetmap.org/wiki/Taiwan',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Active Taiwan OSM community data for roads, buildings, POI, local names, and address fallback.',
  },
  'g0v-taiwan': {
    id: 'g0v-taiwan',
    name: 'g0v Taiwan Open Government Community',
    url: 'https://g0v.tw/',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Taiwan civic-tech and open-government community reference for open-data projects and local data interoperability.',
  },
  'alamgc-mongolia': {
    id: 'alamgc-mongolia',
    name: 'Mongolia General Authority for Land Administration, Geodesy and Cartography',
    url: 'https://en.gazar.gov.mn/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official land, mapping, address and administrative-geography authority. Authority status does not make every viewer, cadastral record, building or service output openly redistributable or postal.',
  },
  'nsdi-mongolia': {
    id: 'nsdi-mongolia',
    name: 'Mongolia National Spatial Data Infrastructure Geoportal',
    url: 'https://en.gazar.gov.mn/p/500',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Geoportal supports searching, viewing and purchasing spatial products under access levels. Exact layer, edition, rights, CRS, scale and digest are required; portal access is not a postcode relation or blanket reuse right.',
  },
  'zipcode-mn': {
    id: 'zipcode-mn',
    name: 'CRC Mongolia Unified Postal Code map and list',
    url: 'https://www.zipcode.mn/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official current CRC map, search and list reference for five-digit zones and nine-digit unified codes. An exact result is assignment evidence, not automatically reusable bulk rows, a canonical postcode polygon, a civic-address licence or proof of delivery.',
  },
  'crc-mongolia-unified-postcode-2019': {
    id: 'crc-mongolia-unified-postcode-2019',
    name: 'CRC Mongolia unified postal-code introduction and MNS 6775:2019',
    url: 'https://old.crc.gov.mn/articles/slug12105/en',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official CRC explanation distinguishes a five-digit zone from a nine-digit code formed by appending four digits and assigned to a building. It is syntax and policy evidence, not current rows, geometry or a redistribution licence.',
  },
  'upu-mongolia-addressing': {
    id: 'upu-mongolia-addressing',
    name: 'UPU Mongolia addressing sheet',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/mngEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'UPU documents five digits to the right of province or capital and urban, rural, P.O. Box and organization examples including extended codes. Examples and codification are not a current national allocation set or polygon release.',
  },
  'crc-mongolia-postal-regulation': {
    id: 'crc-mongolia-postal-regulation',
    name: 'CRC Mongolia postal regulation',
    url: 'https://www.crc.gov.mn/postal-regulation',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official current postal regulator mandate and service-network framework. Regulatory authority is not a postcode row, postal boundary, building relation or data reuse permission.',
  },
  'gazar-mongolia-address-system': {
    id: 'gazar-mongolia-address-system',
    name: 'Mongolia government coordinate-based address system',
    url: 'https://address.gazar.gov.mn/mn',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official system reports standardized coordinate-based addresses and hierarchical grids down to 10 metres. Its grid code is distinct from CRC postal codes and AGID; viewer and service access do not establish public address or building reuse rights.',
  },
  'gazar-mongolia-spatial-data-standards': {
    id: 'gazar-mongolia-spatial-data-standards',
    name: 'Mongolia spatial-data standards including address and boundary themes',
    url: 'https://gazar.gov.mn/service/spatial-data',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official page lists MNS 6925-15 address and MNS 6925-16 boundary spatial-data specifications. Standards define schemas, not released address, parcel, building or postal data and not a reuse licence.',
  },
  'gazar-mongolia-boundaries': {
    id: 'gazar-mongolia-boundaries',
    name: 'Mongolia official boundaries theme',
    url: 'https://en.gazar.gov.mn/service/9',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official administrative-boundary theme uses point and polygon geodatabases with open and ordered distribution and access levels. An exact permitted product may support a derived join, but a boundary is not a postal polygon or building address.',
  },
  'gazar-mongolia-open-spatial-data': {
    id: 'gazar-mongolia-open-spatial-data',
    name: 'Mongolia Gazar open spatial data programme',
    url: 'https://en.gazar.gov.mn/p/oron-zajn-neelttej-g-gd-l',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official programme describes usable and redistributable government open data. Each exact portal artifact still requires its own item, licence, edition, fields, coverage and digest; programme status alone does not license viewer outputs.',
  },
  'nso-mongolia-administrative-units': {
    id: 'nso-mongolia-administrative-units',
    name: 'Mongolia NSO administrative and territorial units',
    url: 'https://data.1212.mn/pxweb/en/NSO/NSO__Regional%20development__Territory%2C%20administrative%20units/DT_NSO_0100_001V1.px/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official annual aggregate statistics validate aimag, capital, soum, district, bag and khoroo context and change timing. Counts and areas do not establish postal assignments, boundaries, civic addresses or buildings.',
  },
  'hot-osm-mongolia': {
    id: 'hot-osm-mongolia',
    name: 'Humanitarian OpenStreetMap Team Mongolia',
    url: 'https://www.hotosm.org/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    license: 'ODbL',
    notes: 'Humanitarian OSM mapping reference for rural roads, settlements, disaster response, and remote delivery context in Mongolia.',
  },
  'osm-mongolia': {
    id: 'osm-mongolia',
    name: 'OpenStreetMap Mongolia',
    url: 'https://wiki.openstreetmap.org/wiki/Mongolia',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Mongolia OSM roads, settlements, POI, local names, and fallback address tags for sparse-address areas.',
  },
  'india-post-regulations-2024': {
    id: 'india-post-regulations-2024',
    name: 'India Post Office Regulations 2024 – PIN definition',
    url: 'https://www.indiapost.gov.in/documents/actsandpolicies',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official six-digit PIN maps a particular area to the post office receiving mail for delivery; these semantics are not a current directory, PIN polygon, address, or building relation.',
  },
  'postalpincode-in': {
    id: 'postalpincode-in',
    name: 'Third-party India Postal PIN Code API',
    url: 'https://api.postalpincode.in/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'fallback',
    notes: 'Public third-party lookup for discrepancy validation only; it is not an official India Post source, geometry authority, or bulk redistribution grant.',
  },
  'data-gov-in-pincode': {
    id: 'data-gov-in-pincode',
    name: 'Department of Posts All India Pincode Directory',
    url: 'https://www.data.gov.in/resource/all-india-pincode-directory-till-last-month',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official monthly OGD PIN directory with circle, region, division, office, office type, Delivery or Non Delivery status, district and state. Multiple typed office rows may share a PIN; rows are assignments, not geometry.',
  },
  'data-gov-in-pincode-boundary': {
    id: 'data-gov-in-pincode-boundary',
    name: 'Department of Posts All India Pincode Boundary GeoJSON catalog',
    url: 'https://sikkim.data.gov.in/catalog/all-india-pincode-boundary-geo-json',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official catalog metadata states that PIN boundary GeoJSON exists; the exact resource, edition, licence, coverage, CRS, topology, join key and digest are required. Catalog metadata is not geometry.',
  },
  'data-gov-in-godl': {
    id: 'data-gov-in-godl',
    name: 'Government Open Data License – India',
    url: 'https://ap.data.gov.in/godl',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Reuse framework for an exact covered dataset whose metadata declares GODL-India; it is legal metadata, not postal assignment, PIN geometry, address, or building evidence.',
  },
  'india-lgd-pin-crosswalk': {
    id: 'india-lgd-pin-crosswalk',
    name: 'Local Government Directory PIN crosswalk',
    url: 'https://data.gov.in/catalog/local-government-directory-lgd',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official village and local-body administrative crosswalk with PIN context; it is not Department of Posts assignment authority, PIN geometry, civic-address geometry, or a building relation.',
  },
  'india-digipin': {
    id: 'india-digipin',
    name: 'India Post DIGIPIN',
    url: 'https://www.indiapost.gov.in/digipin',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official ten-character location grid with approximately four-metre cells under a pinned specification and encoder version; a parallel location layer, not a six-digit PIN, address, building, person, or postal-booking entitlement.',
  },
  'survey-of-india-abdb': {
    id: 'survey-of-india-abdb',
    name: 'Survey of India Administrative Boundary Database',
    url: 'https://surveyofindia.gov.in/pages/administrative-boundary-data-base-abdb-',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official state, district, subdistrict and village administrative geometry under exact product terms; administrative context is not PIN geometry or an address-building relation.',
  },
  'india-pincode-api-oss': {
    id: 'india-pincode-api-oss',
    name: 'India PIN Code API Open Source Implementations',
    url: 'https://aniket-thapa.github.io/india-pincode-api/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'fallback',
    notes: 'Open-source PIN code API/data implementation used as a fallback when the live postal API is unavailable.',
  },
  'survey-of-india': {
    id: 'survey-of-india',
    name: 'Survey of India Maps',
    url: 'https://indiamaps.gov.in/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'India national mapping authority source for authoritative base maps, topographic data, boundaries, and geospatial reference layers.',
  },
  'datameet-maps': {
    id: 'datameet-maps',
    name: 'DataMeet Maps',
    url: 'https://github.com/datameet/maps',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'CC BY 4.0',
    notes: 'Open India community geospatial repository for boundaries and GIS data used as an OSS validation layer.',
  },
  'osm-india': {
    id: 'osm-india',
    name: 'OpenStreetMap India',
    url: 'https://wiki.openstreetmap.org/wiki/India',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'OSM India roads, settlements, POI, multilingual name tags, and alternate place names for address fallback.',
  },
  'hot-osm-south-asia': {
    id: 'hot-osm-south-asia',
    name: 'Humanitarian OpenStreetMap Team South Asia',
    url: 'https://www.hotosm.org/',
    kind: 'address',
    coverage: 'asia',
    usage: 'reference',
    license: 'ODbL',
    notes: 'Humanitarian OSM mapping reference for disaster, rural, and low-address-density areas across South Asia.',
  },
  'pakistan-post-postcode-directory': {
    id: 'pakistan-post-postcode-directory',
    name: 'Pakistan Post Post Code Directory',
    url: 'https://pakpost.gov.pk/postcodes.php',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official searchable and downloadable delivery and non-delivery post-office directories expose five-digit strings, delivery post office, account office, province and attached branch-office code. A pinned row is assignment and routing evidence, not a postal polygon, delivery entitlement, building relation, complete history or blanket redistribution licence.',
  },
  'upu-pakistan-addressing': {
    id: 'upu-pakistan-addressing',
    name: 'UPU Pakistan addressing sheet',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/pakEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official addressing metadata defines exactly five digits to the right of the locality, with the first two digits identifying a routing district and the last three a delivery post office. The 2004 sheet establishes syntax and address order, not a current allocation table, polygon, delivery point or building.',
  },
  'pakistan-post-postcode-amendments': {
    id: 'pakistan-post-postcode-amendments',
    name: 'Pakistan Post National Post Code Directory amendments',
    url: 'https://www.pakpost.gov.pk/pdfForms/2024-5-16-Director-General-Circular-02-4-2022-under-the-DGPPO-IBD.pdf',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official circular records additions and amendments to delivery and non-delivery post-office entries. It proves allocations change by effective edition and must be overlaid explicitly; it is not a consolidated current directory, polygon release or reuse grant.',
  },
  'survey-of-pakistan-mapping-law': {
    id: 'survey-of-pakistan-mapping-law',
    name: 'Survey of Pakistan mapping-law and registration guidance',
    url: 'https://www.surveyofpakistan.gov.pk/detail/MDRlMTFkMjktMDRiMy00MDAyLTkzOTQtNGZjYmFlN2ZkNTdi',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official guidance under the Surveying and Mapping Act and Rules requires applicable registration, approved official base mapping and vetting or licensing for covered geospatial production. Public access or mathematical generation is not permission to distribute a map, and generated postal surfaces remain non-official unless all legal and source-specific gates pass.',
  },
  'survey-of-pakistan-geospatial-products': {
    id: 'survey-of-pakistan-geospatial-products',
    name: 'Survey of Pakistan geospatial products',
    url: 'https://www.surveyofpakistan.gov.pk/Detail/ZWU5ZmYxYmQtZWJhMy00MjNiLWFmMTktMmE0OTMwYTAzMTE1',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'The national mapping authority supplies maps and digital geospatial products by request and applicable terms. Product availability is not an open licence, postal-code boundary authority, civic-address register or building relation; exact product, approval, edition, CRS, scale, rights and digest must be pinned.',
  },
  'pakistan-nsdi': {
    id: 'pakistan-nsdi',
    name: 'Pakistan National Spatial Data Infrastructure',
    url: 'https://nsdi.gov.pk/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Survey of Pakistan leads the NSDI for spatial-data coordination and access. Portal or map presence is context only until an exact permitted layer, authoritative identifiers, edition, coverage, CRS, licence and digest are pinned; NSDI context is not automatically postal geometry.',
  },
  'pakistan-pbs-census-gis': {
    id: 'pakistan-pbs-census-gis',
    name: 'Pakistan Bureau of Statistics GIS and Digital Census 2023',
    url: 'https://www.pbs.gov.pk/gis/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official census GIS provides separately versioned administrative and census context. Census blocks are enumerator-workload units, not postal areas, delivery points or buildings, and administrative overlap never proves a postcode boundary or address-building link.',
  },
  pakpost: {
    id: 'pakpost',
    name: 'Pakistan Post Postcode Lookup',
    url: 'https://www.pakpost.gov.pk/postcode.php',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Pakistan postcode search.',
  },
  'survey-of-pakistan': {
    id: 'survey-of-pakistan',
    name: 'Survey of Pakistan',
    url: 'https://sop.gov.pk/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Pakistan national surveying and mapping organization for official geospatial and topographic reference.',
  },
  'pak-nsdi': {
    id: 'pak-nsdi',
    name: 'Pak-NSDI',
    url: 'https://sop.gov.pk/pak-nsdi/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Survey of Pakistan national spatial data infrastructure for shared geospatial data and administrative reference layers.',
  },
  'pbs-gis-pakistan': {
    id: 'pbs-gis-pakistan',
    name: 'Pakistan Bureau of Statistics GIS',
    url: 'https://www.pbs.gov.pk/gis/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Census-area and administrative mapping reference for Pakistan regional validation.',
  },
  'osm-pakistan': {
    id: 'osm-pakistan',
    name: 'OpenStreetMap Pakistan',
    url: 'https://wiki.openstreetmap.org/wiki/Pakistan',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Pakistan OSM roads, places, POI, and multilingual names for address lookup fallback.',
  },
  'bangladesh-post-postcode-tables': {
    id: 'bangladesh-post-postcode-tables',
    name: 'Bangladesh Post official postcode tables',
    url: 'https://bdpost.portal.gov.bd/site/page/6aaeabe4-479b-4e5a-a671-e9e5b994bf9a/1000',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official district tables publish Upazila, English and Bengali post-office names, office classes and four-digit postcodes. GPO, HO, TSO, UPO, SO, EDSO and EDBO labels and rows with no code remain typed. A pinned page row is assignment evidence, not a polygon, delivery point, building, complete current bulk directory or redistribution licence.',
  },
  'upu-bangladesh-addressing': {
    id: 'upu-bangladesh-addressing',
    name: 'UPU Bangladesh addressing sheet',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/bgdEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official 2014 addressing metadata defines four digits to the right of the locality, a routing hierarchy through the main regional head office, thana and secondary post office, and village, delivery-post-office and optional thana address lines. It is not a current allocation database, polygon, delivery point or building relation.',
  },
  'survey-of-bangladesh-gis-services': {
    id: 'survey-of-bangladesh-gis-services',
    name: 'Survey of Bangladesh GIS services and products',
    url: 'https://sob.portal.gov.bd/pages/static-pages/6922dd32933eb65569e13e50',
    kind: 'building',
    coverage: 'country',
    usage: 'reference',
    notes: 'The national mapping authority supplies photogrammetric GIS products under existing policy, including Building and Structure, administrative and topographic features in source-declared scales and BUTM2010. Product availability is not an open licence, postal boundary, civic-address register or address-building relation; exact product, terms, edition, scale, CRS and digest are required.',
  },
  'bangladesh-nsdi-geoportal': {
    id: 'bangladesh-nsdi-geoportal',
    name: 'Bangladesh National Spatial Data Infrastructure',
    url: 'https://new.nsdi.gov.bd/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Survey of Bangladesh leads the national geoportal for discovery, access and sharing. Public information may not require sign-in and portal data may be free to use, but the official FAQ says provider-specific terms vary. Portal presence never proves postal authority, exact-layer completeness, building identity or blanket redistribution rights.',
  },
  'bangladesh-nsdi-data-catalog': {
    id: 'bangladesh-nsdi-data-catalog',
    name: 'Bangladesh NSDI official data catalog',
    url: 'https://new.nsdi.gov.bd/datacatalog/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'The official catalog lists editioned SoB geodatabases, coverage, scale, security classification and BUTM2010 CRS, including city and nationwide products. Catalog metadata or a non-restricted label is not the dataset, postal-code crosswalk or reuse licence; the exact layer and provider terms must be pinned.',
  },
  'bbs-bangladesh-census-2022': {
    id: 'bbs-bangladesh-census-2022',
    name: 'Bangladesh Bureau of Statistics Population and Housing Census 2022',
    url: 'https://bbs.gov.bd/pages/static-pages/6922e073933eb65569e27220',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official census publications describe GIS and geocode-based enumeration-area maps for complete population counting and separately versioned administrative context. Enumeration areas are census operations, not postcode areas, delivery surfaces, civic addresses or buildings; individual census information is never public AGID output.',
  },
  'dlrs-bangladesh-map-portal': {
    id: 'dlrs-bangladesh-map-portal',
    name: 'Bangladesh DLRS integrated map purchase portal',
    url: 'https://map.settlement.gov.bd/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'The Department of Land Records and Surveys sells official CS, SA, RS, BRS and BDS mouza maps by district, upazila, mouza and sheet. A purchased or viewed mouza or cadastral map is controlled land evidence, not a postcode polygon, building footprint, civic address relation or permission to publish ownership and occupant data.',
  },
  'bd-post': {
    id: 'bd-post',
    name: 'Bangladesh Postcode Lookup',
    url: 'https://bdpost.portal.gov.bd/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Bangladesh Post official portal, including postcode-search services, for district and local delivery validation.',
  },
  'survey-bangladesh': {
    id: 'survey-bangladesh',
    name: 'Survey of Bangladesh',
    url: 'https://www.sob.gov.bd/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Bangladesh national mapping and surveying authority for official maps, control, and administrative geospatial reference.',
  },
  'osm-bangladesh': {
    id: 'osm-bangladesh',
    name: 'OpenStreetMap Bangladesh',
    url: 'https://wiki.openstreetmap.org/wiki/Bangladesh',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Bangladesh OSM roads, settlements, building, and local-name data for address fallback.',
  },
  'hot-osm-bangladesh': {
    id: 'hot-osm-bangladesh',
    name: 'Humanitarian OpenStreetMap Team Bangladesh',
    url: 'https://www.hotosm.org/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    license: 'ODbL',
    notes: 'HOT/OSM humanitarian mapping reference for flood-prone, coastal, rural, and disaster-response address context in Bangladesh.',
  },
  'postalservice-np': {
    id: 'postalservice-np',
    name: 'Nepal Postal Service Postcode',
    url: 'https://nepalpost.gov.np/content/1716/1716-postal-codes-of-nepal/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Nepal Post official postal-codes reference page under the current nepalpost.gov.np domain.',
  },
  'national-geoportal-nepal': {
    id: 'national-geoportal-nepal',
    name: 'National Geoportal Nepal',
    url: 'https://nationalgeoportal.gov.np/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Nepal national spatial data platform for basemaps, map layers, and administrative geospatial validation.',
  },
  'survey-department-nepal': {
    id: 'survey-department-nepal',
    name: 'Survey Department Nepal',
    url: 'https://dos.gov.np/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Nepal official survey department reference for topographic and administrative geography.',
  },
  'cambodia-post': {
    id: 'cambodia-post',
    name: 'Cambodia Post',
    url: 'https://cambodiapost.com.kh/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Cambodia Post official site for national postal-service and postcode reference under the live 2026 domain.',
  },
  'odc-cambodia-postal-codes': {
    id: 'odc-cambodia-postal-codes',
    name: 'Open Development Cambodia Postal Codes',
    url: 'https://data.opendevelopmentcambodia.net/en/dataset/postal-codes',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    license: 'Open Development Cambodia terms; verify source-file redistribution before bundling',
    notes: '2026 postal-code dataset referencing Cambodia Ministry of Posts and Telecommunications Prakas No. 77 dated 2025-12-30.',
  },
  'osm-cambodia': {
    id: 'osm-cambodia',
    name: 'OpenStreetMap Cambodia',
    url: 'https://wiki.openstreetmap.org/wiki/WikiProject_Cambodia',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Cambodia OSM roads, settlements, Khmer names, and fallback address-tag reference.',
  },
  'osm-nepal': {
    id: 'osm-nepal',
    name: 'OpenStreetMap Nepal',
    url: 'https://wiki.openstreetmap.org/wiki/Nepal',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Nepal OSM roads, settlements, trekking-region names, and local place aliases for address fallback.',
  },
  'hot-osm-nepal': {
    id: 'hot-osm-nepal',
    name: 'Humanitarian OpenStreetMap Team Nepal',
    url: 'https://www.hotosm.org/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    license: 'ODbL',
    notes: 'HOT Nepal humanitarian mapping reference for mountain, disaster, rural road, and building completeness checks.',
  },
  slpost: {
    id: 'slpost',
    name: 'Sri Lanka Post Code Search',
    url: 'https://slpost.gov.lk/si/information/postcodes/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Sri Lanka Post postcode search for locality validation.',
  },
  'survey-department-sri-lanka': {
    id: 'survey-department-sri-lanka',
    name: 'Survey Department of Sri Lanka',
    url: 'https://www.survey.gov.lk/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Sri Lanka official survey department for national maps, topographic data, and authoritative geospatial reference.',
  },
  'data-gov-lk': {
    id: 'data-gov-lk',
    name: 'Sri Lanka Open Data Portal',
    url: 'https://data.gov.lk/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Government open-data portal for Sri Lanka datasets and validation references.',
  },
  'osm-sri-lanka': {
    id: 'osm-sri-lanka',
    name: 'OpenStreetMap Sri Lanka',
    url: 'https://wiki.openstreetmap.org/wiki/Sri_Lanka',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Sri Lanka OSM road, building, settlement, Sinhala/Tamil/English name tags, and fallback address data.',
  },
  'maldives-post': {
    id: 'maldives-post',
    name: 'Maldives Post Postcode Finder',
    url: 'https://www.maldivespost.com/postcode-finder',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official five-digit postcode finder for island and atoll delivery. A pinned result is assignment evidence, not a canonical polygon, civic-address registry, building relation, complete history or bulk reuse licence.',
  },
  'mlsa-maldives': {
    id: 'mlsa-maldives',
    name: 'Maldives Land and Survey Authority',
    url: 'https://www.geomatics.gov.mv/nationalmapping.php',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official authority for the national map, authoritative boundary maps, island registry, geographic feature names and NSDI. Exact layer, rights, edition, scale, CRS and digest are required; land-registry context does not create a postcode or civic-address relation.',
  },
  'onemap-maldives': {
    id: 'onemap-maldives',
    name: 'OneMap Maldives',
    url: 'https://onemap.mv/',
    kind: 'map-tile',
    coverage: 'country',
    usage: 'reference',
    notes: 'Authoritative national map maintained by the Geomatics Department. Public viewing does not establish a postal-code relation, civic address, building identity, exact layer reuse rights or blanket redistribution permission.',
  },
  'upu-maldives-addressing-2004': { id: 'upu-maldives-addressing-2004', name: 'UPU Maldives addressing sheet 2004', url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/mdvEn.pdf', kind: 'standard', coverage: 'country', usage: 'reference', notes: 'Documents five digits to the right of locality, Malé-region and atoll prefix structures, and a centered address example. The September 2004 sheet is dated syntax, not current allocations, geometry, civic addresses or buildings.' },
  'maldives-onemap-island-api-2024': { id: 'maldives-onemap-island-api-2024', name: 'OneMap Maldives island FeatureServer 2024', url: 'https://services7.arcgis.com/yvCbn3q8PPtPLZIM/arcgis/rest/services/island_20240509/FeatureServer', kind: 'admin-boundary', coverage: 'country', usage: 'reference', notes: 'Official linked island layer endpoint. An exact layer may provide island geometry and identifiers when item metadata and reuse rights are pinned; it is not a postcode polygon, civic-address registry or building relation.' },
  'maldives-geomatics-land-survey-standard-2025': { id: 'maldives-geomatics-land-survey-standard-2025', name: 'Maldives Land Survey Submission Standard 2025', url: 'https://geomatics.gov.mv/uploads/Land%20Survey%20Submission%20Standards_SRVY2025-1.pdf', kind: 'standard', coverage: 'country', usage: 'reference', notes: 'Defines WGS 84, UTM Zone 43N, survey exchange files and plot, reef and island feature codes. A submission standard is not public cadastral data, postcode authority, civic-address data, building geometry or a reuse licence.' },
  'maldives-land-registration-survey-guideline-2020': { id: 'maldives-land-registration-survey-guideline-2020', name: 'Maldives land-registration survey guideline 2020', url: 'https://geomatics.gov.mv/uploads/Guidelines%20for%20Land%20Registration%20Survey%20of%20Islands_20201015%20V1_1.pdf', kind: 'standard', coverage: 'country', usage: 'reference', notes: 'Requires atoll, island name, FCode, surveyor, shoreline and survey-map details for island registration. It is a controlled survey workflow, not a public parcel, postcode, address or building dataset.' },
  'maldives-bureau-statistics-gis-maps': { id: 'maldives-bureau-statistics-gis-maps', name: 'Maldives Bureau of Statistics GIS Maps', url: 'https://statisticsmaldives.gov.mv/quicklink/gis-maps/', kind: 'admin-boundary', coverage: 'country', usage: 'validation', notes: 'Official Census and statistics map entry point. The map disclaimer makes data informational, dynamic and unsuitable without independent verification for legal, engineering, navigational or precision use; it is not postal, civic-address or building authority.' },
  'maldives-census-island-atoll-2022': { id: 'maldives-census-island-atoll-2022', name: 'Maldives Census 2022 island and atoll indicators', url: 'https://statisticsmaldives.gov.mv/census-2022-island-and-atoll-level-indicator-sheets/', kind: 'gazetteer', coverage: 'country', usage: 'validation', notes: 'Official aggregate island and atoll indicator sheets for administrative-name and coverage validation. Census aggregates do not establish postcode assignments, household addresses, building relations or postal polygons.' },
  'osm-maldives': {
    id: 'osm-maldives',
    name: 'OpenStreetMap Maldives',
    url: 'https://wiki.openstreetmap.org/wiki/Maldives',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Maldives OSM island, road, resort, and place-name data for atoll and island delivery fallback.',
  },
  'afghan-post': {
    id: 'afghan-post',
    name: 'Afghan Post Postal Code Reference',
    url: 'http://afghanpost.gov.af/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Afghanistan postal-code reference from Afghan Post.',
  },
  'afghan-postal-code-system': {
    id: 'afghan-postal-code-system',
    name: 'Afghanistan Postal Code System',
    url: 'https://postalcode.afghanpost.gov.af/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Afghan Post postal-code search interface with road and locality lookup for 4-digit postcode validation.',
  },
  'hot-osm-afghanistan': {
    id: 'hot-osm-afghanistan',
    name: 'Humanitarian OpenStreetMap Team Afghanistan',
    url: 'https://www.hotosm.org/where-we-work/afghanistan/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    license: 'ODbL',
    notes: 'HOT Afghanistan humanitarian mapping and OSM activation reference for roads, buildings, and conflict/disaster context.',
  },
  'osm-afghanistan': {
    id: 'osm-afghanistan',
    name: 'OpenStreetMap Afghanistan',
    url: 'https://wiki.openstreetmap.org/wiki/Afghanistan',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Afghanistan OSM roads, settlements, POI, local names, and fallback address tags.',
  },
  'thailand-post': {
    id: 'thailand-post',
    name: 'Thailand Post Postal Code Search',
    url: 'https://postbase.thailandpost.co.th/en/home',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Thailand Post postal-code lookup for province, district, and subdistrict delivery checks.',
  },
  'vietnam-postcode': {
    id: 'vietnam-postcode',
    name: 'Vietnam Post Vpostcode',
    url: 'https://vpostcode.vn/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Vietnam Post national postal-address code platform and postcode lookup reference.',
  },
  'vietnam-national-postcode-portal': {
    id: 'vietnam-national-postcode-portal',
    name: 'Vietnam National Postcode Portal',
    url: 'https://mabuuchinh.vn/Default.aspx',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'The Ministry of Science and Technology portal is the current lookup and download entry point for five-digit national postcode assignments. A pinned result proves a dated assignment only; it is not a polygon, delivery entitlement, civic address, building relation, complete history or blanket redistribution licence.',
  },
  'vietnam-postcode-decision-2334-2025': {
    id: 'vietnam-postcode-decision-2334-2025',
    name: 'Vietnam Decision 2334/QD-BKHCN postcode amendment',
    url: 'https://cspl.mic.gov.vn/Pages/TinTuc/tinchitiet.aspx?tintucid=139048',
    kind: 'standard',
    coverage: 'country',
    usage: 'primary',
    notes: 'The Ministry legal-policy notice records the 2025 amendment for wards, communes and equivalent units under the new two-tier administration and confirms a five-character structure. Legal structure and assignment tables do not themselves publish postal geometry, civic addresses or building links.',
  },
  'vnpost-two-tier-postcode-notice': {
    id: 'vnpost-two-tier-postcode-notice',
    name: 'Vietnam Post two-tier postcode notice',
    url: 'https://vnpost.vn/en/hoat-dong-nganh/thong-bao-sua-doi-ma-buu-chinh-quoc-gia-theo-don-vi-hanh-chinh-2-cap',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Vietnam Post confirms Decision 2334, five-digit lookup through the national portal and alignment to the two-tier administrative system. The notice is routing and transition evidence, not a bulk allocation licence, polygon set, address registry or building database.',
  },
  'upu-vietnam-addressing': {
    id: 'upu-vietnam-addressing',
    name: 'UPU Viet Nam addressing sheet',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/vnmEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'The 2021 UPU sheet defines five digits, position beside the province name, house, alley, lane, street, ward, district, province, rural and post-office formats, and non-area assignments to service or special-delivery objects. It predates the 2025 two-tier reform and is not current allocation data, geometry or a building relation.',
  },
  'vnpost-vpostcode-digital-address': {
    id: 'vnpost-vpostcode-digital-address',
    name: 'Vietnam Post Vpostcode digital address platform',
    url: 'https://vnpost.vn/vi/hoat-dong-nganh/ra-mat-nen-tang-ma-dia-chi-buu-chinh-vpostcode',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Vietnam Post describes a national digital address platform built from digital maps and national postcodes for location codes. A viewed or queried code is not automatically a legal civic address, postal polygon, building footprint, occupant record or reusable bulk dataset; exact API and reuse terms are required.',
  },
  'vietnam-nso-administrative-units': {
    id: 'vietnam-nso-administrative-units',
    name: 'Vietnam NSO administrative-unit directory and crosswalk',
    url: 'https://danhmuchanhchinh.nso.gov.vn/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'The National Statistics Office directory exposes current units, new-to-old conversion, comparison and history. Identifiers and names support temporal administrative validation; directory rows are not boundary geometry, postcode assignments, civic addresses, buildings or redistribution permission.',
  },
  'vietnam-nsdi-portal': {
    id: 'vietnam-nsdi-portal',
    name: 'Vietnam National Spatial Data Infrastructure portal',
    url: 'https://vnsdi.mae.gov.vn/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'The official NSDI portal advertises administrative maps, base maps and registered data access. Registration, viewing or attribution does not prove reuse rights, postal authority, a current postcode relation, civic address or exact address-building link; exact product, edition, CRS, scale and terms must be pinned.',
  },
  'vietnam-survey-map-data-service': {
    id: 'vietnam-survey-map-data-service',
    name: 'Vietnam official surveying and mapping data service',
    url: 'https://dichvucong.monre.gov.vn/pages/ChiTietThuTucHanhChinh.aspx?tt=129',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'The ministry procedure governs requests for surveying, mapping and geospatial products and excludes state-secret material. A supplied product remains subject to exact request, product, scale, CRS, fee and rights; roads, parcels or buildings do not become postcode surfaces or civic-address links by containment or proximity.',
  },
  'pos-malaysia-postcode-finder': {
    id: 'pos-malaysia-postcode-finder',
    name: 'Pos Malaysia Postcode Finder',
    url: 'https://www.pos.com.my/postal-services/quick-access/?postcode-finder',
    kind: 'postal-code', coverage: 'country', usage: 'primary',
    notes: 'Official five-digit postcode and locality lookup. A pinned result is dated assignment evidence, not a canonical polygon, civic-address registry, building relation, complete history or blanket redistribution licence.',
  },
  'upu-malaysia-addressing': {
    id: 'upu-malaysia-addressing', name: 'UPU Malaysia addressing sheet',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/mysEn.pdf',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Documents five digits before locality, address-line order, 13 states and three federal territories, plus P.O. box, locked bag, poste restante and window-ticket delivery. The 2010 sheet is not current allocations, geometry, addresses or buildings.',
  },
  'malaysia-mygdx-postcode-catalog': {
    id: 'malaysia-mygdx-postcode-catalog', name: 'MyGDX Malaysian Postcode catalog',
    url: 'https://jombelajar.mygdx.gov.my/en/landing-page/listCatalog/256063c2-dbf9-4765-8d84-47a60db3c742?theme=third-theme',
    kind: 'postal-code', coverage: 'country', usage: 'reference',
    notes: 'Government exchange catalog describes Malaysian postcode and locality data sourced from Pos Malaysia. Provider approval and exact API terms are required; catalog visibility is not bulk reuse permission, postal geometry, civic-address or building evidence.',
  },
  'malaysia-mygeo-fundamental-data-2026': {
    id: 'malaysia-mygeo-fundamental-data-2026', name: 'MyGeoportal Fundamental Data List 2026',
    url: 'https://www.mygeoportal.gov.my/sites/default/files/Dokumen_MyGeoportal/Senarai_Data_Fundamental_2026.pdf',
    kind: 'admin-boundary', coverage: 'country', usage: 'reference',
    notes: 'Lists state, division, district or jajahan, mukim, town and pekan fundamental layers. Release follows each provider agency; an administrative layer is not a postal boundary, address registry or building relation.',
  },
  'malaysia-mygos-data-services': {
    id: 'malaysia-mygos-data-services', name: 'MyGeo Data Services / MyGOS',
    url: 'https://www.mygeoportal.gov.my/en/applications/mygeo-data-services',
    kind: 'admin-boundary', coverage: 'country', usage: 'reference',
    notes: 'Secure G2G services expose fundamental geospatial themes, lot finding and map views to approved users. Access does not confer public reuse, postal authority, a civic address, building identity or address-building relation.',
  },
  'malaysia-mygeo-upi': {
    id: 'malaysia-mygeo-upi', name: 'Malaysia Unique Parcel Identifier (UPI)',
    url: 'https://www.mygeoportal.gov.my/index.php/en/unique-parcel-identifier-upi',
    kind: 'gazetteer', coverage: 'country', usage: 'reference',
    notes: 'UPI composes state, district or division, subdistrict or town, section, lot and grant identifiers. Public codes and parcel context do not establish postcode assignment, postal geometry, civic address, building footprint, owner or occupant.',
  },
  'malaysia-mygdi-licensing-2024': {
    id: 'malaysia-mygdi-licensing-2024', name: 'MyGDI geospatial pricing and copyright guideline',
    url: 'https://www.mygeoportal.gov.my/sites/default/files/Dokumen_MyGeoportal/Garis%20Panduan%20MyGDI.pdf',
    kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Documents provider-specific pricing, copyright and licence agreements under Malaysian law. Viewing, requesting, paying or attributing is not blanket redistribution permission.',
  },
  'malaysia-mygeoname': {
    id: 'malaysia-mygeoname', name: 'MyGeoName geographical names portal',
    url: 'https://mygeoname.mygeoportal.gov.my/index.jsp?lang=en',
    kind: 'gazetteer', coverage: 'country', usage: 'validation',
    notes: 'Official geographical-name reference for locality validation. Portal labels are not legal evidence, postcode assignments, boundary geometry, civic addresses or exact building links.',
  },
  'myanmar-post-postcode-lookup': { id: 'myanmar-post-postcode-lookup', name: 'Myanmar Post Postcode Lookup', url: 'https://www.myanmarpost.com.mm/postcode?tab=information', kind: 'postal-code', coverage: 'country', usage: 'primary', notes: 'Official seven-digit Quarter and Village Tract postcode lookup. A pinned result is assignment evidence, not a canonical polygon, civic-address registry, building relation, complete history or bulk reuse licence.' },
  'myanmar-national-portal-post-services': { id: 'myanmar-national-portal-post-services', name: 'Myanmar National Portal postal services', url: 'https://myanmar.gov.mm/-/myanmar-post-services', kind: 'postal-code', coverage: 'country', usage: 'reference', notes: 'Government service page identifies Myanmar Post postcode information, door-to-door, smart-locker and postal-agent services. Service availability does not make every postal object an area or grant output redistribution rights.' },
  'upu-myanmar-addressing-2022': { id: 'upu-myanmar-addressing-2022', name: 'UPU Myanmar addressing sheet 2022', url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/mmrEn.pdf', kind: 'standard', coverage: 'country', usage: 'reference', notes: 'Documents seven digits for Quarter and Village Tract, address-line order, 14 states and regions plus Nay Pyi Taw Union Territory, and home, rural, P.O. Box and building formats. It is not current allocations, geometry or a civic-address registry.' },
  'myanmar-survey-department': { id: 'myanmar-survey-department', name: 'Myanmar Survey Department', url: 'https://surveydepartment.gov.mm/', kind: 'admin-boundary', coverage: 'country', usage: 'reference', notes: 'Official topographic mapping and aerial-photography authority. Exact product, permission, edition, scale, CRS and digest are required; maps do not create postcode boundaries, civic addresses or building links.' },
  'myanmar-one-map-geodatabase-2024': { id: 'myanmar-one-map-geodatabase-2024', name: 'One Map Myanmar Geo Database platform', url: 'https://surveydepartment.gov.mm/news/930', kind: 'admin-boundary', coverage: 'country', usage: 'reference', notes: 'Official platform context for standardized inter-agency geospatial information. A news or platform page is not public data, a reuse licence, postal authority, civic-address registry or building relation.' },
  'mimu-place-codes-v9-6-2025': { id: 'mimu-place-codes-v9-6-2025', name: 'MIMU Place Codes v9.6', url: 'https://www.themimu.info/place-codes', kind: 'gazetteer', coverage: 'country', usage: 'validation', notes: 'Administrative place identifiers for state or region, district, township, village tract and village. MIMU PCodes are not Myanmar Post postcodes and cannot create postal assignments or postal boundaries.' },
  'mimu-geospatial-data': { id: 'mimu-geospatial-data', name: 'MIMU GIS Resources', url: 'https://www.themimu.info/gis-resources', kind: 'admin-boundary', coverage: 'country', usage: 'reference', notes: 'Operational 1:250,000 WGS84 administrative and thematic layers for humanitarian and development work. Geospatial datasets require source-specific permission and are not postal boundaries, civic addresses or exact building links.' },
  'mimu-terms-and-conditions': { id: 'mimu-terms-and-conditions', name: 'MIMU data terms and conditions', url: 'https://www.themimu.info/about-us', kind: 'standard', coverage: 'country', usage: 'reference', notes: 'Records attribution, non-sale and non-commercial constraints, as-is disclaimers and special written permission for MIMU geospatial data. Attribution or access alone is not blanket redistribution permission.' },
  'ycdc-land-building-services': { id: 'ycdc-land-building-services', name: 'Yangon City Development Committee land and building services', url: 'https://myanmar.gov.mm/yangon-city-development-council', kind: 'building', coverage: 'country', usage: 'validation', notes: 'Local controlled land, building and property-service context. Forms and tax records may contain private evidence and are not a national public address registry, postal geometry release or exact reusable address-building relation.' },
  'pos-malaysia': {
    id: 'pos-malaysia',
    name: 'Pos Malaysia Postcode Finder',
    url: 'https://www.pos.com.my/postal-services/quick-access/?postcode-finder',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Legacy registry alias for the official Pos Malaysia finder; lookup rows require pinned retrieval metadata and do not constitute postcode polygons, civic addresses, buildings or redistribution rights.',
  },
  'onemap-sg': {
    id: 'onemap-sg',
    name: 'Singapore OneMap Search API',
    url: 'https://www.onemap.gov.sg/apidocs/',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'primary',
    notes: 'Authoritative Singapore address and postal search; current API access requires a registered bearer token.',
  },
  'indonesia-post-law-2009': {
    id: 'indonesia-post-law-2009',
    name: 'Indonesia Postal Law 38/2009',
    url: 'https://jdih.komdigi.go.id/produk_hukum/view/id/155/t/undangundang%20nomor%2038%20tahun%202009%20tanggal%2014%20oktober%202009',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official definition permits numbers, letters, or their combination and uses kode pos to identify an address or area; the law is not a current directory, polygon, or building relation.',
  },
  'indonesia-post-regulation-2025': {
    id: 'indonesia-post-regulation-2025',
    name: 'Indonesia Ministerial Regulation 8/2025 – postal code system',
    url: 'https://jdih.komdigi.go.id/produk_hukum/view/id/967/t/peraturan%2Bmenteri%2Bkomunikasi%2Bdan%2Bdigital%2Bnomor%2B8%2Btahun%2B2025',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official 2025 scheme permits numeric, alphabetic, or combined codes down to the smallest area; the regulation is not an assignment schedule, postal geometry, or proof that future codes remain five digits.',
  },
  'pos-indonesia': {
    id: 'pos-indonesia',
    name: 'Pos Indonesia Kodepos Search',
    url: 'https://kodepos.posindonesia.co.id/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official current postcode and locality lookup at capture time; search access is not a documented bulk API, complete history, postal geometry, delivery entitlement, or redistribution grant.',
  },
  'upu-indonesia-addressing': {
    id: 'upu-indonesia-addressing',
    name: 'UPU Indonesia Addressing Sheet',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/idnEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official addressing reference shows five digits after the locality and province, city or regency, district, village or urban village and RT/RW context; it is not a current assignment database or geometry.',
  },
  'sdi-indonesia-village-postcode': {
    id: 'sdi-indonesia-village-postcode',
    name: 'Satu Data village and urban-village postcode crosswalk',
    url: 'https://data.go.id/dataset/dataset/kode-pos-desa-kelurahan-di-indonesia',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    notes: 'Provincial dataset crosswalks postcode with BPS and Kemendagri identifiers and is marked as still fulfilling Satu Data principles; it is not a national Pos Indonesia directory or postal geometry.',
  },
  'kemendagri-indonesia-admin-codes': {
    id: 'kemendagri-indonesia-admin-codes',
    name: 'Kemendagri administrative area codes 2025',
    url: 'https://ditjenbinaadwil.kemendagri.go.id/peraturan/keputusan-menteri-dalam-negeri-300.2.2-2430-2025-228',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official province, city or regency, district, village and island identifiers for a pinned edition; administrative codes require an explicit crosswalk and are not postcodes or postal geometry.',
  },
  'bps-indonesia-statistical-area-codes': {
    id: 'bps-indonesia-statistical-area-codes',
    name: 'BPS statistical work-area codes',
    url: 'https://ppid.bps.go.id/app/konten/1202/Unduh.html',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official statistical-area and village identifiers for pinned regulations or master editions; BPS codes need explicit crosswalks and are not Pos Indonesia assignments or geometry.',
  },
  'big-indonesia-village-boundaries': {
    id: 'big-indonesia-village-boundaries',
    name: 'BIG village and urban-village administrative boundaries',
    url: 'https://tanahair.indonesia.go.id/sdi/dataset/administrasi_ar_desakel',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'BIG metadata warns that non-definitive boundaries are not an official reference and documents equal-distance gap allocation in an edition; administrative geometry is not postal geometry and exact rights must be pinned.',
  },
  'big-indonesia-rbi-buildings': {
    id: 'big-indonesia-rbi-buildings',
    name: 'BIG RBI building and public-facility layers',
    url: 'https://tanahair.indonesia.go.id/sdi/id/organization/badan-informasi-geospasial',
    kind: 'building',
    coverage: 'country',
    usage: 'reference',
    notes: 'Regional, scale- and edition-specific RBI building or public-facility features require an exact layer, licence, CRS and digest plus an explicit civic-address relation; proximity is not an address link.',
  },
  'phlpost-zip-code-locator': {
    id: 'phlpost-zip-code-locator',
    name: 'PHLPost official ZIP Code Locator',
    url: 'https://phlpost.gov.ph/zip-code-locator/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'The official locator publishes Region, Province, City/Municipality and four-digit ZIP Code rows. A locator row is postal assignment and routing evidence, not barangay coverage, a canonical polygon, delivery point, civic address, building, complete version history or blanket redistribution licence.',
  },
  'upu-philippines-addressing': {
    id: 'upu-philippines-addressing',
    name: 'UPU Philippines addressing sheet',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/phlEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'The official addressing sheet places four digits to the left of the locality or province and describes zone, province/district/city and municipality/delivery-office digit roles. Digit hierarchy and address examples are semantics, not current allocation, boundaries, deliverability, address points or building relations.',
  },
  'psa-philippine-standard-geographic-code': {
    id: 'psa-philippine-standard-geographic-code',
    name: 'PSA Philippine Standard Geographic Code',
    url: 'https://psa.gov.ph/classification/psgc',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    license: 'CC BY 4.0 unless otherwise stated by PSA',
    notes: 'The versioned PSGC classifies regions, provinces, highly urbanized cities, cities, municipalities and barangays and publishes dated masterlists and an API. A PSGC code or administrative unit is not a PHLPost assignment, postal polygon, street address or building relation; exact edition and any content-specific exception must be pinned.',
  },
  'geoportal-philippines-data-inventory': {
    id: 'geoportal-philippines-data-inventory',
    name: 'Geoportal Philippines data inventory',
    url: 'https://www.geoportal.gov.ph/gpresources/GP_DataInventory.pdf',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'The March 2025 official inventory records providers, uploaded layers, metadata and restriction classes including no restriction/open, conditional downloading, restricted and not indicated. Inventory metadata is not the dataset, a common licence, postal authority, civic-address register or address-building crosswalk.',
  },
  'geoportal-philippines-download-policy': {
    id: 'geoportal-philippines-download-policy',
    name: 'Geoportal Philippines download procedure',
    url: 'https://www.geoportal.gov.ph/gpresources/How%20to%20Download%20data%20from%20Geoportal%20Philippines.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'The official procedure requires requestor identity, agency, purpose, contact details and acceptance of terms and privacy provisions for downloadable layers. Portal access or download success is not blanket redistribution, postal authority, address authority or permission to publish personal or restricted attributes.',
  },
  'namria-topographic-mapping': {
    id: 'namria-topographic-mapping',
    name: 'NAMRIA topographic mapping roadmap and products',
    url: 'https://www.namria.gov.ph/jdownloads/Info_Mapper/Infomapper_2024_NAMRIA_Advancing_Geospatial_Information_Management_through_Innovation.pdf',
    kind: 'building',
    coverage: 'country',
    usage: 'reference',
    notes: 'NAMRIA documents nationwide and selected urban topographic map series, digital line maps, orthoimages, administrative maps and varying production and update coverage. Topographic roads or buildings are geometry, not PHLPost polygons or civic-address identities; exact product, rights, scale, epoch, CRS, coverage and digest are required.',
  },
  'psa-popcen-cbms-geotagging': {
    id: 'psa-popcen-cbms-geotagging',
    name: 'PSA POPCEN-CBMS geotagging and building-construction listing',
    url: 'https://psa.gov.ph/content/psa-clears-2024-popcen-cbms-geotagging-service-facilities-and-government-projects',
    kind: 'building',
    coverage: 'country',
    usage: 'validation',
    notes: 'PSA geotags service facilities, government projects and ongoing building constructions for statistics and planning. Census and CBMS collection is not a public national civic-address or building register, postal geometry or delivery evidence; confidential household, respondent, permit and establishment details never become public AGID output.',
  },
  'philippines-lra-land-registration': {
    id: 'philippines-lra-land-registration',
    name: 'Philippines Land Registration Authority',
    url: 'https://lra.gov.ph/message-from-the-administrator/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'LRA registers transactions involving titled and untitled land and provides controlled title and registered-document services. A title, parcel or recorded interest is not a postal surface, building footprint, civic-address relation or public owner/occupant dataset; exact service terms, authority and privacy controls apply.',
  },
  phlpost: {
    id: 'phlpost',
    name: 'PHLPost ZIP Code Search',
    url: 'https://phlpost.gov.ph/zip-code-locator/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Philippines ZIP code search reference.',
  },
  'post-gov-bn': {
    id: 'post-gov-bn',
    name: 'Brunei Postal Services Postcodes',
    url: 'https://www.post.gov.bn/SitePages/Postcodes.aspx',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Brunei official postcode reference.',
  },
  'brunei-post-postcode-booklet': {
    id: 'brunei-post-postcode-booklet',
    name: 'Brunei Postal Services Postcode Booklet, second edition',
    url: 'https://www.post.gov.bn/Documents/Buku%20Poskod%20Edisi%20ke%202%20%28Kemaskini%2026122018%29.pdf',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official dated booklet lists Mukim, Kampong and six-character postcode rows and shows addressing examples. A pinned row is assignment and routing evidence, not a polygon, delivery entitlement, exact house or building relation, complete current history or blanket redistribution licence.',
  },
  'upu-brunei-addressing': {
    id: 'upu-brunei-addressing',
    name: 'UPU Brunei Darussalam addressing sheet',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/brnEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Defines six alphanumeric characters without an internal space, district, Mukim, village and delivery-point routing roles, and house, floor, building, Simpang, Jalan, Kampong, town or district and P.O. box address formats. Routing roles and examples are not geographic boundaries, current assignments or building identities.',
  },
  'brunei-survey-house-numbering': {
    id: 'brunei-survey-house-numbering',
    name: 'Brunei Survey Department House Numbering',
    url: 'https://www.survey.gov.bn/permohonan-maklumat-peralamatan/',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official house, building and unit address-information and verification applications require site plan, land title or TOL, applicant identity and a fee. An exact authorized result can support a civic address, but application access is not a public address register, building geometry, owner relation or redistribution licence.',
  },
  'brunei-survey-digital-map-products': {
    id: 'brunei-survey-digital-map-products',
    name: 'Brunei Survey Department digital map products',
    url: 'https://www.survey.gov.bn/peta/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official paid products include roads, settlements, administrative boundaries, cadastral lots and public and private buildings at declared scales and coverage. Exact product, layer, price, restriction, edition, scale, CRS and rights are required; a mapped feature is not postcode geometry or a civic-address link.',
  },
  'brunei-survey-geoportal': {
    id: 'brunei-survey-geoportal',
    name: 'Brunei Survey Department Geoportal',
    url: 'https://geoportal.survey.gov.bn/start',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official portal separates public and registered capabilities for LOT, TOL, Gazette, plans, imagery and certified-plan access. Search, viewing, purchase or registration does not create postal authority, an address-building relation or blanket redistribution rights.',
  },
  'brunei-survey-geoportal-user-guide': {
    id: 'brunei-survey-geoportal-user-guide',
    name: 'Brunei Survey Geoportal user guide and restriction-of-use gate',
    url: 'https://geoportal.survey.gov.bn/pdf/GeoportalUserGuide.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'The official guide requires acceptance of restriction-of-use terms and documents GDBD2009/Brunei BRSO map context, lot search and viewer workflows. The guide and displayed parcel examples are legal and access metadata, not reusable geometry, postcode assignment, civic address or building evidence.',
  },
  'brunei-deps-bpp-2021': {
    id: 'brunei-deps-bpp-2021',
    name: 'Brunei DEPS Population and Housing Census 2021',
    url: 'https://deps.mofe.gov.bn/census-and-survey/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official published aggregates describe population, households and occupied housing units by district, Mukim and village. Census geography and housing statistics are not postcode boundaries, public household or address records, building identities or exact address-building relations.',
  },
  'brunei-land-registration-framework': {
    id: 'brunei-land-registration-framework',
    name: 'Brunei Land Department registration framework',
    url: 'https://www.land.gov.bn/undang-undang/',
    kind: 'standard',
    coverage: 'country',
    usage: 'validation',
    notes: 'The official land framework governs titles, registers, ownership, leases, mortgages, strata and certified survey plans. Land titles, lot searches, owners and transactions are controlled property-rights evidence, not public postcode polygons, building footprints, civic-address links or reusable personal data.',
  },
  'bhutan-post': {
    id: 'bhutan-post',
    name: 'Bhutan Post Postcode Finder',
    url: 'https://bhutanpost.bt/postcode/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Bhutan Post postcode finder.',
  },
  'bhutan-post-postcode-finder': {
    id: 'bhutan-post-postcode-finder',
    name: 'Bhutan Post Postcode Finder',
    url: 'https://bhutanpost.bt/postcode/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official five-digit locator exposes Dzongkhag, Gewog, Post Office and Postal Code rows. A pinned row is routing-assignment evidence, not a polygon, delivery entitlement, exact address, building relation, complete history or blanket redistribution licence.',
  },
  'bhutan-post-domestic-footprint': {
    id: 'bhutan-post-domestic-footprint',
    name: 'Bhutan Post domestic postal footprint',
    url: 'https://bhutanpost.bt/forms/ar2023.pdf',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'The official annual report maps post offices and codes across the domestic network. Office symbols and labels describe service footprint; they are not catchment polygons, address points, building links or a reusable boundary dataset.',
  },
  'upu-bhutan-addressing': {
    id: 'upu-bhutan-addressing',
    name: 'UPU Bhutan addressing sheet',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/btnEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Defines five digits to the right of the locality and routing semantics for Dzongdey, Dzongkhag, Dungkhag and delivery area, plus building, flat, shop, village, Gewog, P.O. box and organization formats. Digit roles and examples are not boundaries, current assignments, civic-address records or building identities.',
  },
  'bhutan-nlcs-geoportal': {
    id: 'bhutan-nlcs-geoportal',
    name: 'Bhutan NLCS Geo-Portal',
    url: 'https://www.nlcs.gov.bt/dz/?page_id=38',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official portal coordinates map, data and metadata sharing. Portal discovery does not create postal authority, guarantee nationwide layer coverage or grant common download and redistribution rights.',
  },
  'bhutan-nlcs-map-products': {
    id: 'bhutan-nlcs-map-products',
    name: 'Bhutan NLCS map services and access rules',
    url: 'https://www.nlcs.gov.bt/dz/?page_id=203',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official topographic and administrative map products require exact applications, approval, payment or use agreements as applicable, and cadastral maps are not public. Product access is not an open licence or postal, civic-address or building relation.',
  },
  'bhutan-nlcs-cadastral-information': {
    id: 'bhutan-nlcs-cadastral-information',
    name: 'Bhutan NLCS Cadastral Information Division',
    url: 'https://web.nlcs.gov.bt/cadastral-information-division/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'NLCS manages cadastral surveys, maps, geodatabases and eSakor. Parcels, Thrams and map features remain controlled land evidence and do not become postal surfaces, public civic addresses, buildings or owner and occupant relations.',
  },
  'bhutan-nsb-phcb-2017': {
    id: 'bhutan-nsb-phcb-2017',
    name: 'Bhutan NSB 2017 Population and Housing Census mapping',
    url: 'https://www.nsb.gov.bt/wp-content/uploads/2020/10/PHCB2017_national.pdf',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official house listing and mapping created urban and rural enumeration areas for statistics. Enumeration areas, household listings and mapped structures are not postal boundaries, public address points or exact address-building relations, and confidential records stay excluded.',
  },
  'bhutan-esakor-land-building-transactions': {
    id: 'bhutan-esakor-land-building-transactions',
    name: 'Bhutan eSakor land, flat and building transactions',
    url: 'https://esakor.nlcs.gov.bt/faq_eSakor',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    notes: 'The controlled NDI-linked transaction service handles land, flat and building records plus identity, permanent-address, party, witness, Thram and plot information. It is private rights evidence, not a public address or building API, postcode polygon or redistribution source.',
  },
  'nlcs-bhutan': {
    id: 'nlcs-bhutan',
    name: 'National Land Commission Bhutan',
    url: 'https://web.nlcs.gov.bt/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Bhutan national land and cadastral authority for official land, topographic, and administrative geography reference.',
  },
  'bhutan-geoportal': {
    id: 'bhutan-geoportal',
    name: 'Bhutan National Land Commission Geoportal',
    url: 'https://geoportal.nlcs.gov.bt/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Bhutan geospatial portal reference for administrative, cadastral, and base-map validation layers.',
  },
  'osm-bhutan': {
    id: 'osm-bhutan',
    name: 'OpenStreetMap Bhutan',
    url: 'https://wiki.openstreetmap.org/wiki/Bhutan',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Bhutan OSM roads, settlements, dzongkhag/gewog names, POI, and fallback address tags.',
  },
  'turkiye-ptt': {
    id: 'turkiye-ptt',
    name: 'PTT Postal Code Search',
    url: 'https://postakodu.ptt.gov.tr/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Turkey official postal-code lookup.',
  },
  'osm-turkey': {
    id: 'osm-turkey',
    name: 'OpenStreetMap Turkey',
    url: 'https://wiki.openstreetmap.org/wiki/Turkey',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Turkey OSM roads, buildings, POI, Turkish names, and fallback address tags.',
  },
  'gavahi-post-ir': {
    id: 'gavahi-post-ir',
    name: 'Iran Post Postal Code Service',
    url: 'https://gavahi.post.ir/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Iran Post 10-digit postal-code validation reference.',
  },
  'iran-nsdi': {
    id: 'iran-nsdi',
    name: 'Iran National Data Infrastructure Geoportal',
    url: 'https://iransdi.ir/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Iran national spatial data infrastructure reference for geospatial layers and administrative validation.',
  },
  'iran-open-data': {
    id: 'iran-open-data',
    name: 'Iran Open Data',
    url: 'https://iranopendata.org/en/map/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Iran open-data map and public-data reference for place-name and regional checks.',
  },
  'osm-iran': {
    id: 'osm-iran',
    name: 'OpenStreetMap Iran',
    url: 'https://wiki.openstreetmap.org/wiki/Iran',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Iran OSM roads, settlements, Persian names, POI, and fallback address data.',
  },
  'iraq-post': {
    id: 'iraq-post',
    name: 'Iraq Post',
    url: 'https://www.iraqpost.net/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Iraq postal-service reference for local postal-code and delivery validation.',
  },
  'osm-iraq': {
    id: 'osm-iraq',
    name: 'OpenStreetMap Iraq',
    url: 'https://wiki.openstreetmap.org/wiki/Iraq',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Iraq OSM roads, settlements, Arabic/Kurdish names, POI, and fallback address tags.',
  },
  'syria-post': {
    id: 'syria-post',
    name: 'Syrian Post',
    url: 'https://syrianpost.gov.sy/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Syria postal-service reference for delivery and postal-code metadata where available.',
  },
  'osm-syria': {
    id: 'osm-syria',
    name: 'OpenStreetMap Syria',
    url: 'https://wiki.openstreetmap.org/wiki/Syria',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Syria OSM roads, settlements, Arabic/Kurdish names, POI, and fallback address tags.',
  },
  'hot-osm-west-asia': {
    id: 'hot-osm-west-asia',
    name: 'Humanitarian OpenStreetMap Team West Asia',
    url: 'https://www.hotosm.org/',
    kind: 'address',
    coverage: 'asia',
    usage: 'reference',
    license: 'ODbL',
    notes: 'Humanitarian OSM reference layer for conflict, disaster, refugee, rural, and low-address-density West Asia coverage.',
  },
  libanpost: {
    id: 'libanpost',
    name: 'LibanPost',
    url: 'https://www.libanpost.com/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Lebanon postal-service and postal-code reference.',
  },
  'osm-lebanon': {
    id: 'osm-lebanon',
    name: 'OpenStreetMap Lebanon',
    url: 'https://wiki.openstreetmap.org/wiki/Lebanon',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Lebanon OSM roads, buildings, place names, POI, and fallback address tags.',
  },
  jordanpost: {
    id: 'jordanpost',
    name: 'Jordan Post',
    url: 'https://jordanpost.com.jo/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Jordan postal-operator reference. A current pinned Jordan Post result may support a five-digit routing assignment, but it is not a canonical polygon, exact civic address, building relation, delivery entitlement, complete history, or blanket reuse licence.',
  },
  'rjgc-jordan': {
    id: 'rjgc-jordan',
    name: 'Royal Jordanian Geographic Centre',
    url: 'https://www.rjgc.gov.jo/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Jordan national mapping and survey authority. Exact product, edition, CRS, scale, access terms and rights are mandatory; official mapping does not itself create a postcode assignment, postal polygon, civic address, or public building relation.',
  },
  'upu-jordan-addressing-2004': {
    id: 'upu-jordan-addressing-2004', name: 'UPU Jordan Addressing Sheet 2004', url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/jorEn.pdf', kind: 'standard', coverage: 'country', usage: 'reference', notes: 'Dated September 2004 syntax evidence for five digits to the right of the locality and the region-department-zone-sector-unit coding description. It is not current assignment rows, postal geometry, civic addresses, buildings, or reuse permission.'
  },
  'modee-jordan-postal-policy-2025': {
    id: 'modee-jordan-postal-policy-2025', name: 'Jordan ICT and Postal Policy 2025', url: 'https://www.modee.gov.jo/EBV4.0/Root_Storage/AR/EB_News/ICTP_Policy_2025.pdf', kind: 'standard', coverage: 'country', usage: 'primary', notes: 'Current policy and explanatory memorandum describe incomplete physical addressing and postal codes used for carrier-route sorting, and call for finer digital street/building location. Policy evidence is not a postcode polygon, address registry, or building dataset.'
  },
  'trc-jordan-postal-sector': {
    id: 'trc-jordan-postal-sector', name: 'Jordan TRC Postal Sector', url: 'https://trc.gov.jo/EN/ListDetails/Postal_Sector/1289/1', kind: 'standard', coverage: 'country', usage: 'reference', notes: 'Official regulator context for Jordan Post as the public postal operator. Regulatory status does not publish current assignments, geometry, civic addresses, or buildings.'
  },
  'jordan-post-offices-open-data-2023': {
    id: 'jordan-post-offices-open-data-2023', name: 'Jordan Post Offices Open Data', url: 'https://opendata.gov.jo/en/dataset/jordan-post-offices-1661-2023', kind: 'postal-code', coverage: 'country', usage: 'primary', license: 'Jordan Open Government Data License when attached to the exact artifact', notes: 'Official post-office rows include governorate, directorate, address, hours, postal code and property status. They are point or service-routing references, not postal polygons, civic-address coverage, delivery points, or buildings; pin the exact artifact, license, dates, schema, attribution and digest.'
  },
  'jordan-open-government-data-license-v1': {
    id: 'jordan-open-government-data-license-v1', name: 'Jordan Open Government Data License v1.0', url: 'https://www.modee.gov.jo/ebv4.0/root_storage/en/eb_list_page/ogd-license_en.pdf', kind: 'standard', coverage: 'country', usage: 'reference', license: 'Jordan Open Government Data License v1.0', notes: 'Permits reuse of data expressly published under it with required attribution, non-endorsement and disclaimers. A portal page, map, service or institutional source is not covered unless the exact artifact carries the license; Arabic prevails.'
  },
  'rjgc-jordan-eservices': {
    id: 'rjgc-jordan-eservices', name: 'RJGC Geospatial E-services', url: 'https://rjgc.gov.jo/eservices/index.php', kind: 'admin-boundary', coverage: 'country', usage: 'reference', notes: 'Official maps, imagery and geospatial products use account, application and payment workflows. Access is product-specific and does not grant a postal relation or blanket redistribution rights.'
  },
  'rjgc-gam-building-mou': {
    id: 'rjgc-gam-building-mou', name: 'RJGC and Greater Amman Municipality geospatial MoU', url: 'https://www.rjgc.gov.jo/index.php/ar/node/607', kind: 'building', coverage: 'country', usage: 'reference', notes: 'The institutional MoU mentions numbered building points, neighbourhoods, districts, streets and boundaries exchanged with Greater Amman Municipality. Controlled exchange is not a public building/address artifact or reuse licence.'
  },
  'dls-jordan-village-codes-2022': {
    id: 'dls-jordan-village-codes-2022', name: 'Jordan DLS Village Codes Open Data', url: 'https://opendata.gov.jo/en/dataset/dlsvillagecode-1344-2022', kind: 'gazetteer', coverage: 'country', usage: 'reference', license: 'Jordan Open Government Data License when attached to the exact artifact', notes: 'Official village-code administrative and cadastral context. Village codes are not postcodes, postal assignments, civic addresses, building identifiers, or geometry.'
  },
  'gam-jordan-streets-2019': {
    id: 'gam-jordan-streets-2019', name: 'Greater Amman Streets Open Data', url: 'https://opendata.gov.jo/en/dataset/streets-inside-and-outside-265-2019', kind: 'address', coverage: 'country', usage: 'reference', license: 'Jordan Open Government Data License when attached to the exact artifact', notes: 'Official street and planning-area context for the exact licensed spreadsheet. It is not national address coverage, postcode geometry, a civic-address registry, or a building relation.'
  },
  'jordan-digital-mailbox-pilot-2026': {
    id: 'jordan-digital-mailbox-pilot-2026', name: 'Jordan Digital Postal Box Pilot 2026', url: 'https://petra.gov.jo/gweb/index.php/en/news/jordan-post-digital-mailbox-strategic-project-to-build-integrated-national-database', kind: 'address', coverage: 'country', usage: 'reference', notes: 'Official-news evidence of a pilot linking a digital postal box, postal code and home location, with planned Sanad integration. No public production schema, API, bulk dataset, personal-address permission or geometry licence is established.'
  },
  'osm-jordan': {
    id: 'osm-jordan',
    name: 'OpenStreetMap Jordan',
    url: 'https://wiki.openstreetmap.org/wiki/Jordan',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Jordan OSM roads, places, Arabic/English names, POI, and fallback address data.',
  },
  'israel-post': {
    id: 'israel-post',
    name: 'Israel Post Postal Code Lookup',
    url: 'https://israelpost.co.il/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Israel Post postcode lookup for Hebrew, Arabic, and English address rendering.',
  },
  'govmap-israel': {
    id: 'govmap-israel',
    name: 'Govmap Israel API',
    url: 'https://api.govmap.gov.il/',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'primary',
    notes: 'Israel government map API and national geospatial reference for addresses, places, and map layers.',
  },
  'data-gov-il': {
    id: 'data-gov-il',
    name: 'Israel Open Government Data',
    url: 'https://data.gov.il/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Israel open-government data portal for datasets and administrative validation references.',
  },
  'osm-israel': {
    id: 'osm-israel',
    name: 'OpenStreetMap Israel',
    url: 'https://wiki.openstreetmap.org/wiki/Israel',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Israel OSM address, road, building, Hebrew/Arabic/English names, and fallback data.',
  },
  'palestine-open-data-postcodes': {
    id: 'palestine-open-data-postcodes',
    name: 'Palestine Open Data Post Codes',
    url: 'https://www.opendata.ps/dataset/postcodes',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Palestine open-data postal-code dataset for P3/P7 postal zones and delivery validation.',
  },
  'palestine-post': {
    id: 'palestine-post',
    name: 'Palestine Post',
    url: 'https://www.palpost.ps/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Palestine postal-service reference for postal-code and delivery metadata.',
  },
  'osm-palestine': {
    id: 'osm-palestine',
    name: 'OpenStreetMap Palestine',
    url: 'https://wiki.openstreetmap.org/wiki/Palestine',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Palestine OSM roads, places, Arabic/English names, POI, and fallback address tags.',
  },
  'spl-national-address-components': {
    id: 'spl-national-address-components',
    name: 'SPL National Address Components',
    url: 'https://narg.address.gov.sa/en/national-address-1/',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official semantics define a five-digit postal code plus Building Number, Street, District, City and four-digit Secondary or Additional Number. Component semantics alone are not current assignment, polygon, footprint, unit or deliverability evidence.',
  },
  'spl-national-address-api-v31': {
    id: 'spl-national-address-api-v31',
    name: 'SPL National Address API v3.1',
    url: 'https://api.address.gov.sa/apidocumentation',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'Credentialed, purpose-limited SPL API; exact product, plan, terms, display, retention and redistribution conditions apply',
    notes: 'Pinned responses can supply public National Address components, opaque PKAddressID, BuildingNumber, PostCode, AdditionalNumber, optional UnitNumber and a point. A point or nullable PolygonString is not a postal polygon, parcel or building footprint.',
  },
  'spl-national-address-api-terms': {
    id: 'spl-national-address-api-terms',
    name: 'SPL National Address API Terms of Use',
    url: 'https://api.address.gov.sa/termsofuse',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Limited non-exclusive non-sublicensable API licence; exact current terms control',
    notes: 'Legal boundary only: credentials, purpose limits, privacy disclosure, requested removal, rate limits and restricted resale or sublicensing do not grant bulk harvesting or repository redistribution rights.',
  },
  'spl-national-address-short-address': {
    id: 'spl-national-address-short-address',
    name: 'SPL National Address Short Address',
    url: 'https://narg.address.gov.sa/en/door-step/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Short Address has four letters and four numbers and resolves through SPL. It is a typed lookup identifier, not geometry, a reusable building footprint, a unit, or permission to expose account identity.',
  },
  'geosa-saudi-geospatial-foundation-themes': {
    id: 'geosa-saudi-geospatial-foundation-themes',
    name: 'GEOSA National Geospatial Foundation Themes and Governance',
    url: 'https://www.geoportal.sa/Geoportal/pdf/Saudi%20Arabian%20National%20Geospatial%20Governance.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official governance defines separate Buildings, Land Parcels, National Address and administrative themes under SANSRS. A standard or theme listing is metadata, not a redistributable dataset or cross-theme join.',
  },
  'rega-saudi-geospatial-real-estate-portal': {
    id: 'rega-saudi-geospatial-real-estate-portal',
    name: 'REGA Geospatial Real Estate Portal',
    url: 'https://rega.gov.sa/en/rega-services/platforms/geospatial-real-estate-portal/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official viewer can validate regions, cities, neighborhoods, land plots and registration areas. Viewer visibility is not reusable vector, parcel-to-address, building, ownership or redistribution authority.',
  },
  'rega-saudi-real-estate-registration-framework': {
    id: 'rega-saudi-real-estate-registration-framework',
    name: 'REGA Real Estate Registration Law and Implementing Regulations',
    url: 'https://rega.gov.sa/en/laws-and-decisions/regulations-and-by-laws/regulations/implementing-regulations-of-the-law-of-real-estate-registration/',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Legal and cadastral semantics describe Real Estate Maps and Sheets. They do not publish parcel vectors or authorize public owner, rightsholder, title, encumbrance, value or transaction output.',
  },
  'spl-sa': {
    id: 'spl-sa',
    name: 'Saudi Post SPL National Address',
    url: 'https://splonline.com.sa/en/national-address-api/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Saudi Post/SPL postcode and national address lookup.',
  },
  'spl-national-address-api': {
    id: 'spl-national-address-api',
    name: 'Saudi Post SPL National Address API',
    url: 'https://api.address.gov.sa/',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'primary',
    notes: 'Saudi national address API for building number, short address, geocode, free-text, and bulk address lookup.',
  },
  'saudi-gis-national-platform': {
    id: 'saudi-gis-national-platform',
    name: 'Saudi National Platform GIS',
    url: 'https://my.gov.sa/en/content/gis',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Saudi GIS and national address platform reference for spatial identity and map validation.',
  },
  'osm-saudi-arabia': {
    id: 'osm-saudi-arabia',
    name: 'OpenStreetMap Saudi Arabia',
    url: 'https://wiki.openstreetmap.org/wiki/Saudi_Arabia',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Saudi Arabia OSM roads, districts, Arabic/English names, POI, and fallback address data.',
  },
  'makani-dubai-open-data': {
    id: 'makani-dubai-open-data',
    name: 'Dubai Makani Open Data',
    url: 'https://www.dm.gov.ae/open-data2/open-data-for-makani/',
    kind: 'geocoding',
    coverage: 'country',
    usage: 'primary',
    notes: 'Dubai Makani smart geo-tagging open data for precise building/location addressing in the UAE.',
  },
  'osm-uae': {
    id: 'osm-uae',
    name: 'OpenStreetMap United Arab Emirates',
    url: 'https://wiki.openstreetmap.org/wiki/United_Arab_Emirates',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'UAE OSM roads, buildings, POI, community names, and fallback address tags.',
  },
  'qatar-gis-geoportal': {
    id: 'qatar-gis-geoportal',
    name: 'Qatar GIS Geoportal',
    url: 'https://geoportal.gisqatar.org.qa/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Qatar national GIS geoportal for zones, streets, buildings, and administrative spatial validation.',
  },
  'osm-qatar': {
    id: 'osm-qatar',
    name: 'OpenStreetMap Qatar',
    url: 'https://wiki.openstreetmap.org/wiki/Qatar',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Qatar OSM zones, streets, buildings, POI, and fallback address data.',
  },
  'bahrain-open-data': {
    id: 'bahrain-open-data',
    name: 'Bahrain Open Data Portal',
    url: 'https://www.data.gov.bh/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Bahrain open-data portal and map reference for public geodata and regional validation.',
  },
  'bahrain-post-services-directory': {
    id: 'bahrain-post-services-directory',
    name: 'Bahrain Post Services Directory',
    url: 'https://www.bahrainpost.gov.bh/en/images/pdf/services-directory-eng.pdf',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Bahrain Post office addresses demonstrate current three- and four-digit locality postcodes. Directory examples are not a complete postcode-block assignment release, canonical boundary, delivery entitlement or bulk redistribution grant.',
  },
  'upu-bahrain-addressing': {
    id: 'upu-bahrain-addressing',
    name: 'UPU Bahrain addressing sheet',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/bhrEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official addressing metadata defines three or four digits to the right of the locality, valid range 1XX to 12XX, and home versus P.O. box examples. Syntax and examples do not establish a complete allocation table, polygon, box subscriber or building.',
  },
  'iga-bahrain-address-services': {
    id: 'iga-bahrain-address-services',
    name: 'Bahrain iGA Building and Establishment Address Services',
    url: 'https://www.iga.gov.bh/en/category/building-and-establishment-address-services',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official iGA services issue, modify and delete building address certificates and numbers. A certificate or registered building number is strong civic-address evidence, but not an unrestricted footprint; CPR, owners, occupants, deeds, applications and contact data are excluded.',
  },
  'bahrain-open-data-terms': {
    id: 'bahrain-open-data-terms',
    name: 'Bahrain Open Data Portal Terms of Use',
    url: 'https://www.data.gov.bh/pages/terms-and-conditions/',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Bahrain Open Data Portal Terms of Use',
    notes: 'Portal datasets permit royalty-free copying, distribution, adaptation and applications subject to source/date attribution, transformation notice, prescribed disclaimer, sublicence propagation and removal on iGA request. These terms apply only to exact portal datasets, not every government webpage or viewer.',
  },
  'bahrain-open-data-geographic-locations': {
    id: 'bahrain-open-data-geographic-locations',
    name: 'Bahrain Open Data Geographic Locations',
    url: 'https://www.data.gov.bh/explore/dataset/geographical-locations-of-landmarks/api/',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'Bahrain Open Data Portal Terms of Use',
    notes: 'Official API datasets expose selected public-place points with block and governorate context under portal terms. Point rows can validate labels and block membership but are not a complete address register, block polygon, building footprint or postcode boundary.',
  },
  'bahrain-municipal-geographic-explorer': {
    id: 'bahrain-municipal-geographic-explorer',
    name: 'Bahrain Municipal Geographic Explorer',
    url: 'https://www.mun.gov.bh/newportal/ar/municipal-affairs/services/almstkshf-albldy-aljghrafy',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official interactive map supports location, area classification and road reference. Viewer availability is not a vector licence, exact block-postcode crosswalk, canonical postal surface or legal survey.',
  },
  'slrb-bahrain-cadastre': {
    id: 'slrb-bahrain-cadastre',
    name: 'Bahrain Survey and Land Registration Bureau Cadastre',
    url: 'https://www.slrb.gov.bh/en/cadastralsurveys',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'SLRB is the cadastral authority for property boundaries and paid/requested maps. A parcel or deed map is not a postal block, public building footprint or address-building relation, and owner, CPR, title, right and restriction data are never public AGID output.',
  },
  'osm-bahrain': {
    id: 'osm-bahrain',
    name: 'OpenStreetMap Bahrain',
    url: 'https://wiki.openstreetmap.org/wiki/Bahrain',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Bahrain OSM blocks, roads, places, POI, and fallback address tags.',
  },
  'kuwait-post': {
    id: 'kuwait-post',
    name: 'Kuwait Ministry of Communications postal-code tables',
    url: 'https://www.moc.gov.kw/en/important-links?tab=2',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official tables distinguish governorate, area and block-number assignments from P.O. box-number ranges. A row is current assignment evidence when captured and pinned; it is not a polygon, complete history, public bulk API or redistribution grant.',
  },
  'upu-kuwait-addressing': {
    id: 'upu-kuwait-addressing',
    name: 'UPU Kuwait addressing sheet',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/kwtEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official addressing reference specifies five digits to the left of KUWAIT and separates P.O. box or block, zone and sector coding. Its examples are not a current assignment database, postal surface or building relation.',
  },
  'paci-kuwait-finder': {
    id: 'paci-kuwait-finder',
    name: 'PACI Kuwait Finder',
    url: 'https://pacigis.github.io/?language=en',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official PACI address and landmark viewer with informational-only, as-is and boundary-accuracy disclaimers. View access is not bulk redistribution permission; map boundaries are not legal, engineering, survey or canonical postal geometry.',
  },
  'paci-kuwait-address-services': {
    id: 'paci-kuwait-address-services',
    name: 'PACI address availability and civil-address services',
    url: 'https://services.paci.gov.kw/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official services register and validate civil addresses and automated unit or property numbers. Personal Civil ID, tenancy, owner and resident records are restricted and never public AGID output.',
  },
  'paci-kuwait-building-register': {
    id: 'paci-kuwait-building-register',
    name: 'PACI building and automated-number services',
    url: 'https://services.paci.gov.kw/applications-guide',
    kind: 'building',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official workflows add or update buildings and issue automated parcel or address numbers. A registered identifier is address evidence, not a public building footprint, ownership record or redistribution permission; exact geometry needs a permitted stable relation.',
  },
  'kuwait-municipality-parcels': {
    id: 'kuwait-municipality-parcels',
    name: 'Kuwait Municipality GIS parcel service',
    url: 'https://gismaps.baladia.gov.kw/arcgis/rest/services/KM/KM_Dynamic_All_Parcels/MapServer/layers',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Municipality ArcGIS layers expose parcel and base-map metadata in Kuwait-specific CRS. Endpoint queryability is not licence or topology approval; a parcel is not a postal block, civic building or ownership output.',
  },
  'kuwait-csb-census-gis': {
    id: 'kuwait-csb-census-gis',
    name: 'Kuwait CSB Census 2011 GIS',
    url: 'https://gis.csb.gov.kw/en/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official 2011 census portal provides historical governorate, population-settlement and municipal-block statistical context with accuracy, timeliness and completeness disclaimers. It is not current postal assignment, canonical postal geometry or unrestricted redistribution authority.',
  },
  'osm-kuwait': {
    id: 'osm-kuwait',
    name: 'OpenStreetMap Kuwait',
    url: 'https://wiki.openstreetmap.org/wiki/Kuwait',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Kuwait OSM roads, blocks, areas, POI, and fallback address tags.',
  },
  'upu-oman-postal-addressing': {
    id: 'upu-oman-postal-addressing',
    name: 'UPU Oman Postal Addressing System',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/omnEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'The January 2026 UPU/Oman Post sheet defines three digits coded by post office and region and placed above the locality for P.O. box delivery. It is format metadata, not a current code table, subscriber record, office catchment or polygon.',
  },
  'oman-post-office-locator': {
    id: 'oman-post-office-locator',
    name: 'Oman Post Office Locator',
    url: 'https://www.omanpost.om/index.php/office-locator',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Oman Post website terms; exact record reuse and redistribution permission must be separately pinned',
    notes: 'Pinned records can validate a displayed office, three-digit code and office point. A locator point is not a service catchment, postal polygon, P.O. box subscriber, building or delivery entitlement.',
  },
  'oman-post-website-terms': {
    id: 'oman-post-website-terms',
    name: 'Oman Post Website Terms and Privacy Policy',
    url: 'https://website.omanpost.om/index.php/privacy-and-policy',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Website viewing only; republishing and data harvesting are restricted unless separate permission controls',
    notes: 'Legal boundary only. Public page access does not authorize scraping, bulk reuse, derivative publication or redistribution of office, address, P.O. box or subscriber records.',
  },
  'gov-oman-building-addressing-service': {
    id: 'gov-oman-building-addressing-service',
    name: 'Gov.om Building Addressing or Numbering Service',
    url: 'https://gov.om/en/w/request-building-addressing-or-numbering',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Muscat Governorate workflow metadata confirms a building-addressing or numbering service. The service page is not a reusable address register, building footprint source or claim of national coverage.',
  },
  'ncsi-oman-wilayat-boundaries': {
    id: 'ncsi-oman-wilayat-boundaries',
    name: 'NCSI Oman Wilayat Boundaries',
    url: 'https://ncsigeostatportal.ncsi.gov.om/server/rest/services/NCSIData/WilayatB/FeatureServer/layers',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'Official metadata names the Ministry of Interior as owner and NCSI as alternative source. Exact edition, owner permission, dataset licence, fields, CRS and digest must be pinned; a wilayat is not a postal catchment.',
  },
  'ncsi-oman-open-government-data-policy': {
    id: 'ncsi-oman-open-government-data-policy',
    name: 'Oman Open Government Data Policy',
    url: 'https://data.ncsi.gov.om/sites/default/files/documents/Open%20_Government_data_policy.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'The national policy governs data actually published as open data. It is not the dataset licence for every portal layer and does not validate postal, address or building records.',
  },
  'nsgia-oman-geospatial-governance': {
    id: 'nsgia-oman-geospatial-governance',
    name: 'NSGIA Oman Geospatial Governance and ONGD17',
    url: 'https://nsaomangeoportal.gov.om/en/about-nsa',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'NSGIA governs national geospatial standards and ONGD17. Governance, map indexes and datum pages are not postal assignments, building datasets, product licences or automatic WGS84 transform attestations.',
  },
  'nsgia-oman-portal-terms': {
    id: 'nsgia-oman-portal-terms',
    name: 'NSGIA Geoportal Terms and Conditions',
    url: 'https://gisserver.nsaomangeoportal.gov.om/en/node/83',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Registration, authorization and portal access terms are legal metadata. Viewer or query access is not a postal assignment, feature licence or repository redistribution permission.',
  },
  'nsgia-oman': {
    id: 'nsgia-oman',
    name: 'Oman National Survey and Geospatial Information Authority',
    url: 'https://www.nsaomangeoportal.gov.om/en/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Oman national survey and geospatial authority for official spatial data, maps, and administrative validation.',
  },
  'oman-post': {
    id: 'oman-post',
    name: 'Oman Post',
    url: 'https://www.omanpost.om/ar/office-locator',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Oman postal-service reference for PO box, office, and delivery metadata.',
  },
  'osm-oman': {
    id: 'osm-oman',
    name: 'OpenStreetMap Oman',
    url: 'https://wiki.openstreetmap.org/wiki/Oman',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Oman OSM roads, settlements, Arabic/English names, POI, and fallback address data.',
  },
  'yemen-post': {
    id: 'yemen-post',
    name: 'Yemen Post',
    url: 'https://www.post.ye/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Yemen postal-service reference for delivery and postal metadata where available.',
  },
  'osm-yemen': {
    id: 'osm-yemen',
    name: 'OpenStreetMap Yemen',
    url: 'https://wiki.openstreetmap.org/wiki/Yemen',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Yemen OSM roads, settlements, Arabic names, POI, and fallback address tags.',
  },
  'haypost-am': {
    id: 'haypost-am',
    name: 'HayPost Postal Index Search',
    url: 'https://www.haypost.am/en/find-index',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official HayPost four-digit postal-region and post-office assignment search. Syntax or a post-office point is not a canonical postcode polygon, and public search does not establish bulk reuse rights.',
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
    url: 'https://www.cadastre.am/index.php/en/cadastre_mapping',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official cadastral-map and boundary authority. Review every layer, access class, license or fee terms, schema, coverage, territorial vintage, CRS, and digest; it is not postal assignment authority.',
  },
  'haypost-address-reference': {
    id: 'haypost-address-reference',
    name: 'HayPost Address and Postal Index Reference',
    url: 'https://www.haypost.am/image/Editor/d/3/d3cded6c5e6205e50a54b3c9d7018e78.pdf',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official HayPost post-office directory mapping four-digit codes to regions, offices, and office addresses; it is delivery-network evidence, not an official postcode-area dataset or bulk license.',
  },
  'armenia-real-estate-address-register': {
    id: 'armenia-real-estate-address-register',
    name: 'Armenia Real Estate Address Registration',
    url: 'https://www.cadastre.am/index.php/en/real-estate-registration',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Cadastre Committee address registration based on authorized community decisions. Public search does not establish bulk reuse rights, and an address point is not a building footprint.',
  },
  'armenia-national-geoportal-buildings': {
    id: 'armenia-national-geoportal-buildings',
    name: 'Armenia National Geoportal Buildings',
    url: 'https://www.cadastre.am/news/1786',
    kind: 'building',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official National Geoportal building and cadastral layers. Exact address-to-building display requires an explicit common identifier or reviewed crosswalk; containment and proximity remain candidates and layer rights require review.',
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
    url: 'https://emlak.gov.az/az/news/view/5733-Da%C5%9F%C4%B1nmaz-%C9%99mlak-nec%C9%99-kadastr-u%C3%A7otuna-al%C4%B1n%C4%B1r',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official cadastral and property authority for parcel, building-object, and jurisdiction context. Exact address-to-building display requires an explicit common identifier or reviewed crosswalk; proximity is insufficient.',
  },
  'azerbaijan-address-register': {
    id: 'azerbaijan-address-register',
    name: 'Azerbaijan Address Register Information System (ÜRIS)',
    url: 'https://emlak.gov.az/az/news/view/9349-%C3%9Cnvan-Reyestri-%C4%B0nformasiya-Sistemi-n%C9%99dir-v%C9%99-sistemin-hans%C4%B1-%C3%BCst%C3%BCnl%C3%BCkl%C9%99ri-var',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official address-register reference for settlements, postcodes, transport infrastructure, and immovable-property addresses with source object identifiers; portal visibility is not a bulk redistribution license.',
  },
  'azerbaijan-open-data': {
    id: 'azerbaijan-open-data',
    name: 'Azerbaijan Open Data Portal',
    url: 'https://www.opendata.az/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'Dataset-discovery and validation only until each publisher, license, schema, coverage, territorial vintage, update date, and digest passes dataset-by-dataset review.',
  },
  'azerpost-address-reference': {
    id: 'azerpost-address-reference',
    name: 'Azerpost Postal Reference',
    url: 'https://www.azerpost.az/az/tez-tez-verilen-suallar/umumi-br-suallar/yasadigim-unvanin-poct-indeksini-nece-oyrene-bilerem',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official postcode, branch, and locality assignment reference. Search results and office points are not canonical postcode polygons, and public search does not imply bulk reuse rights.',
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
  'gpost-ge': {
    id: 'gpost-ge',
    name: 'Georgian Post',
    url: 'https://www.gpost.ge/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Georgia postal-code and delivery reference.',
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
  'georgian-post-postcode-finder': {
    id: 'georgian-post-postcode-finder',
    name: 'Georgian Post Postcode Finder',
    url: 'https://www.gpost.ge/?group=3&letter=I&site-lang=en&site-path=help%2Fzipcodes%2F',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official four-digit operator assignment lookup; returned post office or locality is not a postcode polygon, and a public finder is not an open bulk release.',
  },
  'georgian-post-addressing-guide': {
    id: 'georgian-post-addressing-guide',
    name: 'Georgian Post Addressing Guide',
    url: 'https://www.gpost.ge/Content/ContentFiles/addressingRule24125.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official format guidance places the postcode before the locality; examples and syntax are not evidence of current allocation, address existence, geometry, or deliverability.',
  },
  'napr-georgia-address-registry': {
    id: 'napr-georgia-address-registry',
    name: 'NAPR Georgia Address Registry',
    url: 'https://www.napr.gov.ge/en/page/frequently-asked-questions/address-registration',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official address identity is a unique text record for a building, structure, parcel, apartment, or other object; the public FAQ or search is not a bulk release, and address identity is not a building footprint or postcode assignment.',
  },
  'nsdi-georgia-address-layer': {
    id: 'nsdi-georgia-address-layer',
    name: 'Georgian NSDI Address Layer and Named Streets',
    url: 'https://nsdi.gov.ge/en/geoportal',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official spatial address context requires the exact resource-specific access licence, metadata, endpoint, schema, coverage, validity, CRS, and digest; portal visibility is not a blanket open licence.',
  },
  'nsdi-georgia-registered-buildings': {
    id: 'nsdi-georgia-registered-buildings',
    name: 'Georgian NSDI Registered Buildings',
    url: 'https://nsdi.gov.ge/en/geoportal',
    kind: 'building',
    coverage: 'country',
    usage: 'validation',
    notes: 'Exact address-to-building output needs an explicit relationship, common authoritative identifier, or reviewed crosswalk; footprint, containment, parcel overlap, and proximity remain candidate evidence only.',
  },
  'nsdi-georgia-registered-parcels': {
    id: 'nsdi-georgia-registered-parcels',
    name: 'Georgian NSDI Registered Parcels',
    url: 'https://nsdi.gov.ge/en/geoportal',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    notes: 'A registered parcel is not a building, address link, or postcode area and never authorizes publication of an owner, rightsholder, occupant, title, or restriction record.',
  },
  'nsdi-georgia-administrative-boundaries': {
    id: 'nsdi-georgia-administrative-boundaries',
    name: 'Georgian NSDI Administrative and Settlement Boundaries',
    url: 'https://nsdi.gov.ge/en/geoportal',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official administrative and settlement boundaries never create postcode membership, delivery coverage, sovereignty, or permission to fill a coverage gap from the nearest feature.',
  },
  'geostat-georgia-administrative-classification': {
    id: 'geostat-georgia-administrative-classification',
    name: 'GeoStat Georgia Administrative Classification',
    url: 'https://www.geostat.ge/index.php/en/modules/categories/738/the-geographical-distribution-of-the-population-and-internal-migration',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official statistical and administrative classification is not postal assignment evidence and is not geometry unless a separate rights-cleared spatial release is pinned.',
  },
  'post-kz': {
    id: 'post-kz',
    name: 'Kazpost',
    url: 'https://post.kz/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Kazakhstan postcode lookup and postal reference.',
  },
  'pochta-uz': {
    id: 'pochta-uz',
    name: 'Uzbekiston Pochtasi Postal Index Search',
    url: 'https://www.uz.post/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Uzbekistan official postal-index lookup.',
  },
  'datahub-postal-kz': {
    id: 'datahub-postal-kz',
    name: 'DataHub Logistics Postal Codes Kazakhstan',
    url: 'https://datahub.io/logistics/postal-codes-kz',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    notes: 'Open Kazakhstan postal-code dataset useful as a validation fallback.',
  },
  'kazakhstan-nsdi': {
    id: 'kazakhstan-nsdi',
    name: 'Kazakhstan NSDI Geoportal',
    url: 'https://map.gov.kz/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Kazakhstan national spatial data infrastructure geoportal for open geospatial data, administrative layers, and official map validation.',
  },
  'qazpost-open-api': {
    id: 'qazpost-open-api',
    name: 'QazPost Open API',
    url: 'https://open.post.kz/services/details/26',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Kazakhstan postal address search API for postcode, street, and locality validation.',
  },
  'osm-kazakhstan': {
    id: 'osm-kazakhstan',
    name: 'OpenStreetMap Kazakhstan',
    url: 'https://wiki.openstreetmap.org/wiki/Kazakhstan',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Kazakhstan OSM roads, settlements, buildings, POI, Kazakh/Russian names, and fallback address tags.',
  },
  'uzbekistan-open-data-geo': {
    id: 'uzbekistan-open-data-geo',
    name: 'Open Data Portal of the Republic of Uzbekistan Geo Data',
    url: 'https://data.egov.uz/eng/geo-data',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Uzbekistan government open-data portal section for datasets with geographic information and regional validation.',
  },
  'uzbekistan-state-urban-cadastre': {
    id: 'uzbekistan-state-urban-cadastre',
    name: 'State Urban Cadastre of Uzbekistan Geoportal',
    url: 'https://api.dshk.uz/ru/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Uzbekistan public geoportal for urban cadastre and authoritative geospatial reference layers.',
  },
  'osm-uzbekistan': {
    id: 'osm-uzbekistan',
    name: 'OpenStreetMap Uzbekistan',
    url: 'https://wiki.openstreetmap.org/wiki/Uzbekistan',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Uzbekistan OSM streets, settlements, local Uzbek/Russian names, POI, and fallback address data.',
  },
  'nsdi-kyrgyzstan': {
    id: 'nsdi-kyrgyzstan',
    name: 'Kyrgyz Republic Geoportal',
    url: 'https://www.nsdi.kg/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Kyrgyz Republic geoinformation and climate data portal with map interface, metadata catalog, and spatial layers.',
  },
  'data-gov-kg': {
    id: 'data-gov-kg',
    name: 'Kyrgyz Republic Open Data Portal',
    url: 'https://data.gov.kg/en/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    notes: 'Kyrgyz government open-data portal for public datasets, statistics, and geography-linked validation references.',
  },
  'caiag-geonode-kg': {
    id: 'caiag-geonode-kg',
    name: 'CAIAG GeoNode Kyrgyzstan',
    url: 'https://geonode.caiag.kg/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Kyrgyzstan GeoNode instance for geospatial layers, documents, and climate/geography reference data.',
  },
  'osm-kyrgyzstan': {
    id: 'osm-kyrgyzstan',
    name: 'OpenStreetMap Kyrgyzstan',
    url: 'https://wiki.openstreetmap.org/wiki/Kyrgyzstan',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Kyrgyzstan OSM roads, settlements, mountain/rural place names, POI, and fallback address tags.',
  },
  'tajik-post': {
    id: 'tajik-post',
    name: 'Tajik Post',
    url: 'http://www.tajikpost.tj/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Tajikistan postal service reference for 6-digit postal-index validation.',
  },
  'osm-tajikistan': {
    id: 'osm-tajikistan',
    name: 'OpenStreetMap Tajikistan',
    url: 'https://wiki.openstreetmap.org/wiki/WikiProject_Tajikistan',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Tajikistan OSM roads, settlements, Pamir/mountain place names, POI, and fallback address tags.',
  },
  'openaerialmap-tajikistan': {
    id: 'openaerialmap-tajikistan',
    name: 'OpenAerialMap Tajikistan Reference Imagery',
    url: 'https://openaerialmap.org/',
    kind: 'map-tile',
    coverage: 'country',
    usage: 'reference',
    notes: 'Open aerial imagery reference used by Tajikistan mapping projects for roads, settlements, and rural validation.',
  },
  'hot-osm-central-asia': {
    id: 'hot-osm-central-asia',
    name: 'Humanitarian OpenStreetMap Team Central Asia',
    url: 'https://www.hotosm.org/',
    kind: 'address',
    coverage: 'asia',
    usage: 'reference',
    license: 'ODbL',
    notes: 'Humanitarian OSM reference layer for disaster, mountain, rural, and low-address-density Central Asia coverage.',
  },
  turkmenpost: {
    id: 'turkmenpost',
    name: 'Turkmenpost',
    url: 'https://www.turkmenpost.gov.tm/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Turkmenistan postal-service reference for 6-digit postal-index validation.',
  },
  'osm-turkmenistan': {
    id: 'osm-turkmenistan',
    name: 'OpenStreetMap Turkmenistan',
    url: 'https://wiki.openstreetmap.org/wiki/Turkmenistan',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL',
    notes: 'Turkmenistan OSM roads, settlements, official Turkmen place names, POI, and fallback address data.',
  },
};

export const ASIA_COUNTRY_CODES = [
  'AF', 'AM', 'AZ', 'BD', 'BH', 'BN', 'BT', 'CN', 'GE', 'HK',
  'ID', 'IL', 'IN', 'IQ', 'IR', 'JO', 'JP', 'KG', 'KH', 'KP',
  'KR', 'KW', 'KZ', 'LA', 'LB', 'LK', 'MM', 'MN', 'MO', 'MV',
  'MY', 'NP', 'OM', 'PH', 'PK', 'PS', 'QA', 'SA', 'SG', 'SY',
  'TH', 'TJ', 'TL', 'TM', 'TR', 'TW', 'AE', 'UZ', 'VN', 'YE',
] as const;

export type AsiaCountryCode = (typeof ASIA_COUNTRY_CODES)[number];

const BASE_OPEN_SOURCE_IDS: AsiaOpenGeoSourceId[] = [
  'osm-nominatim',
  'osm-overpass',
  'openaddresses',
  'geonames-postal',
  'geonames-gazetteer',
  'geoboundaries',
  'upu-addressing',
  'nasa-srtm',
  'jaxa-aw3d30',
  'gebco-bathymetry',
  'gmrt-topography',
  'hydrosheds',
  'esa-worldcover',
  'protected-planet-wdpa',
  'gbif-occurrence',
];

const COUNTRY_SOURCE_IDS: Partial<Record<AsiaCountryCode, AsiaOpenGeoSourceId[]>> = {
  AF: ['afghan-post', 'afghan-postal-code-system', 'hot-osm-afghanistan', 'osm-afghanistan'],
  AM: ['haypost-am', 'haypost-address-reference', 'armenia-real-estate-address-register', 'armenia-national-geoportal-buildings', 'cadastre-armenia', 'armstat-geodata', 'geonames-armenia'],
  AZ: ['azerpost-address-reference', 'azerbaijan-address-register', 'azerbaijan-state-committee-property', 'azerbaijan-open-data', 'geonames-azerbaijan', 'geonames-postal'],
  BD: ['bangladesh-post-postcode-tables', 'upu-bangladesh-addressing', 'survey-of-bangladesh-gis-services', 'bangladesh-nsdi-geoportal', 'bangladesh-nsdi-data-catalog', 'bbs-bangladesh-census-2022', 'dlrs-bangladesh-map-portal', 'bd-post', 'survey-bangladesh', 'osm-bangladesh', 'hot-osm-bangladesh'],
  BN: ['brunei-post-postcode-booklet', 'upu-brunei-addressing', 'brunei-survey-house-numbering', 'brunei-survey-digital-map-products', 'brunei-survey-geoportal', 'brunei-survey-geoportal-user-guide', 'brunei-deps-bpp-2021', 'brunei-land-registration-framework', 'post-gov-bn'],
  BT: ['bhutan-post-postcode-finder', 'bhutan-post-domestic-footprint', 'upu-bhutan-addressing', 'bhutan-nlcs-geoportal', 'bhutan-nlcs-map-products', 'bhutan-nlcs-cadastral-information', 'bhutan-nsb-phcb-2017', 'bhutan-esakor-land-building-transactions', 'bhutan-post', 'nlcs-bhutan', 'bhutan-geoportal', 'osm-bhutan'],
  CN: ['china-postal-code'],
  GE: ['gpost-ge', 'napr-georgia', 'gdi-georgia', 'gpost-address-reference', 'geonames-georgia', 'georgian-post-postcode-finder', 'georgian-post-addressing-guide', 'napr-georgia-address-registry', 'nsdi-georgia-address-layer', 'nsdi-georgia-registered-buildings', 'nsdi-georgia-registered-parcels', 'nsdi-georgia-administrative-boundaries', 'geostat-georgia-administrative-classification'],
  HK: ['landsd-hk', 'csdi-hk', 'osm-hong-kong'],
  ID: [
    'indonesia-post-law-2009',
    'indonesia-post-regulation-2025',
    'pos-indonesia',
    'upu-indonesia-addressing',
    'sdi-indonesia-village-postcode',
    'kemendagri-indonesia-admin-codes',
    'bps-indonesia-statistical-area-codes',
    'big-indonesia-village-boundaries',
    'big-indonesia-rbi-buildings',
  ],
  AE: ['makani-dubai-open-data', 'osm-uae'],
  BH: ['bahrain-post-services-directory', 'upu-bahrain-addressing', 'iga-bahrain-address-services', 'bahrain-open-data-terms', 'bahrain-open-data-geographic-locations', 'bahrain-municipal-geographic-explorer', 'slrb-bahrain-cadastre', 'bahrain-open-data', 'osm-bahrain'],
  IL: ['israel-post', 'govmap-israel', 'data-gov-il', 'osm-israel'],
  IN: [
    'india-post-regulations-2024',
    'data-gov-in-pincode',
    'data-gov-in-pincode-boundary',
    'data-gov-in-godl',
    'india-lgd-pin-crosswalk',
    'india-digipin',
    'survey-of-india-abdb',
    'postalpincode-in',
    'india-pincode-api-oss',
    'survey-of-india',
    'datameet-maps',
    'osm-india',
    'hot-osm-south-asia',
  ],
  IQ: ['iraq-post', 'osm-iraq'],
  IR: ['gavahi-post-ir', 'iran-nsdi', 'iran-open-data', 'osm-iran'],
  JP: [
    'zipcloud-jp',
    'gsi-japan-tiles',
    'gsi-japan-vector',
    'gsi-basic-geospatial',
    'gsi-dem',
    'jageocoder',
    'geolonia-addresses',
    'osm-japan',
  ],
  KR: ['korea-post-postcode-system', 'korea-post-postcode-api', 'mois-juso-basic-districts', 'mois-juso-road-address-api', 'mois-juso-building-db', 'mois-juso-electronic-map', 'molit-korea-gis-integrated-buildings', 'molit-korea-continuous-cadastral-map', 'epost-kr', 'ngii-korea', 'lx-korea', 'juso-kr', 'osm-korea'],
  KG: ['nsdi-kyrgyzstan', 'data-gov-kg', 'caiag-geonode-kg', 'osm-kyrgyzstan'],
  KH: ['cambodia-post', 'odc-cambodia-postal-codes', 'osm-cambodia'],
  KZ: ['post-kz', 'datahub-postal-kz', 'kazakhstan-nsdi', 'qazpost-open-api', 'osm-kazakhstan'],
  LK: ['slpost', 'survey-department-sri-lanka', 'data-gov-lk', 'osm-sri-lanka'],
  MV: ['maldives-post', 'upu-maldives-addressing-2004', 'mlsa-maldives', 'onemap-maldives', 'maldives-onemap-island-api-2024', 'maldives-geomatics-land-survey-standard-2025', 'maldives-land-registration-survey-guideline-2020', 'maldives-bureau-statistics-gis-maps', 'maldives-census-island-atoll-2022', 'osm-maldives'],
  MN: ['zipcode-mn', 'crc-mongolia-unified-postcode-2019', 'upu-mongolia-addressing', 'crc-mongolia-postal-regulation', 'alamgc-mongolia', 'nsdi-mongolia', 'gazar-mongolia-address-system', 'gazar-mongolia-spatial-data-standards', 'gazar-mongolia-boundaries', 'gazar-mongolia-open-spatial-data', 'nso-mongolia-administrative-units', 'hot-osm-mongolia', 'osm-mongolia'],
  MO: ['dscc-macao', 'geoguide-macao', 'osm-macau'],
  MM: ['myanmar-post-postcode-lookup', 'myanmar-national-portal-post-services', 'upu-myanmar-addressing-2022', 'myanmar-survey-department', 'myanmar-one-map-geodatabase-2024', 'mimu-place-codes-v9-6-2025', 'mimu-geospatial-data', 'mimu-terms-and-conditions', 'ycdc-land-building-services'],
  MY: ['pos-malaysia-postcode-finder', 'upu-malaysia-addressing', 'malaysia-mygdx-postcode-catalog', 'malaysia-mygeo-fundamental-data-2026', 'malaysia-mygos-data-services', 'malaysia-mygeo-upi', 'malaysia-mygdi-licensing-2024', 'malaysia-mygeoname', 'pos-malaysia'],
  NP: ['postalservice-np', 'national-geoportal-nepal', 'survey-department-nepal', 'osm-nepal', 'hot-osm-nepal'],
  PH: ['phlpost-zip-code-locator', 'upu-philippines-addressing', 'psa-philippine-standard-geographic-code', 'geoportal-philippines-data-inventory', 'geoportal-philippines-download-policy', 'namria-topographic-mapping', 'psa-popcen-cbms-geotagging', 'philippines-lra-land-registration', 'phlpost'],
  PK: ['pakistan-post-postcode-directory', 'upu-pakistan-addressing', 'pakistan-post-postcode-amendments', 'survey-of-pakistan-mapping-law', 'survey-of-pakistan-geospatial-products', 'pakistan-nsdi', 'pakistan-pbs-census-gis', 'osm-pakistan'],
  JO: ['jordanpost', 'upu-jordan-addressing-2004', 'modee-jordan-postal-policy-2025', 'trc-jordan-postal-sector', 'jordan-post-offices-open-data-2023', 'jordan-open-government-data-license-v1', 'rjgc-jordan', 'rjgc-jordan-eservices', 'rjgc-gam-building-mou', 'dls-jordan-village-codes-2022', 'gam-jordan-streets-2019', 'jordan-digital-mailbox-pilot-2026', 'osm-jordan'],
  KW: ['kuwait-post', 'upu-kuwait-addressing', 'paci-kuwait-finder', 'paci-kuwait-address-services', 'paci-kuwait-building-register', 'kuwait-municipality-parcels', 'kuwait-csb-census-gis', 'osm-kuwait'],
  LB: ['libanpost', 'osm-lebanon'],
  OM: ['upu-oman-postal-addressing', 'oman-post-office-locator', 'oman-post-website-terms', 'gov-oman-building-addressing-service', 'ncsi-oman-wilayat-boundaries', 'ncsi-oman-open-government-data-policy', 'nsgia-oman-geospatial-governance', 'nsgia-oman-portal-terms', 'nsgia-oman', 'oman-post', 'osm-oman'],
  PS: ['palestine-open-data-postcodes', 'palestine-post', 'osm-palestine'],
  QA: ['qatar-gis-geoportal', 'osm-qatar'],
  SA: ['spl-national-address-components', 'spl-national-address-api-v31', 'spl-national-address-api-terms', 'spl-national-address-short-address', 'geosa-saudi-geospatial-foundation-themes', 'rega-saudi-geospatial-real-estate-portal', 'rega-saudi-real-estate-registration-framework', 'spl-sa', 'spl-national-address-api', 'saudi-gis-national-platform', 'osm-saudi-arabia'],
  SG: ['onemap-sg'],
  SY: ['syria-post', 'osm-syria', 'hot-osm-west-asia'],
  TH: ['thailand-post'],
  TR: ['turkiye-ptt', 'osm-turkey'],
  TW: ['chunghwa-post-3plus3-data', 'chunghwa-post-3plus3-lookup', 'chunghwa-post-3plus3-license', 'moi-taiwan-national-doorplate-location', 'nlsc-taiwan-emap-buildings', 'nlsc-taiwan-emap-doorplates', 'nlsc-taiwan-administrative-boundaries', 'nlsc-taiwan-cadastral-map', 'post-tw', 'nlsc-taiwan', 'tgos-taiwan', 'osm-taiwan', 'g0v-taiwan'],
  TJ: ['tajik-post', 'osm-tajikistan', 'openaerialmap-tajikistan', 'hot-osm-central-asia'],
  TM: ['turkmenpost', 'osm-turkmenistan', 'hot-osm-central-asia'],
  UZ: ['pochta-uz', 'uzbekistan-open-data-geo', 'uzbekistan-state-urban-cadastre', 'osm-uzbekistan'],
  VN: ['vietnam-national-postcode-portal', 'vietnam-postcode-decision-2334-2025', 'vnpost-two-tier-postcode-notice', 'upu-vietnam-addressing', 'vnpost-vpostcode-digital-address', 'vietnam-nso-administrative-units', 'vietnam-nsdi-portal', 'vietnam-survey-map-data-service', 'vietnam-postcode'],
  YE: ['yemen-post', 'osm-yemen', 'hot-osm-west-asia'],
};

export function getAsiaOpenSourceIds(countryCode: string): AsiaOpenGeoSourceId[] {
  const code = countryCode.toUpperCase() as AsiaCountryCode;
  return [...new Set([...(COUNTRY_SOURCE_IDS[code] ?? []), ...BASE_OPEN_SOURCE_IDS])];
}

export const ASIA_COUNTRY_OPEN_SOURCE_IDS = ASIA_COUNTRY_CODES.reduce(
  (sourcesByCountry, countryCode) => ({
    ...sourcesByCountry,
    [countryCode]: getAsiaOpenSourceIds(countryCode),
  }),
  {} as Record<AsiaCountryCode, AsiaOpenGeoSourceId[]>,
);
