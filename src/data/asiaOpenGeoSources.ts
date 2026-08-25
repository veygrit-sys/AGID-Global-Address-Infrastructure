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
  | 'pos-malaysia'
  | 'onemap-sg'
  | 'pos-indonesia'
  | 'phlpost'
  | 'post-gov-bn'
  | 'bhutan-post'
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
  | 'osm-bahrain'
  | 'kuwait-post'
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
    name: 'Agency for Land Administration and Management, Geodesy and Cartography Mongolia',
    url: 'https://www.gazar.gov.mn/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Mongolia land administration, geodesy, cartography, cadastre, and administrative geography reference.',
  },
  'nsdi-mongolia': {
    id: 'nsdi-mongolia',
    name: 'Mongolia National Spatial Data Infrastructure',
    url: 'https://nsdi.gov.mn/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Mongolia national spatial data infrastructure for official geospatial layers and administrative validation.',
  },
  'zipcode-mn': {
    id: 'zipcode-mn',
    name: 'Mongolia ZipCode',
    url: 'https://zipcode.mn/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Mongolia 5-digit postal-code lookup for aimag, sum, bag, and delivery-area validation.',
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
    notes: 'Maldives postcode finder for island and atoll delivery.',
  },
  'mlsa-maldives': {
    id: 'mlsa-maldives',
    name: 'Maldives Land and Survey Authority',
    url: 'https://www.mlsa.gov.mv/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Maldives official mapping and island registry authority for base maps, land registry, islands, and atolls.',
  },
  'onemap-maldives': {
    id: 'onemap-maldives',
    name: 'OneMap Maldives',
    url: 'https://onemap.mv/',
    kind: 'map-tile',
    coverage: 'country',
    usage: 'primary',
    notes: 'National map of Maldives maintained by the Maldives Land and Survey Authority for island and address context.',
  },
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
  'pos-malaysia': {
    id: 'pos-malaysia',
    name: 'Pos Malaysia Postcode Finder',
    url: 'https://www.pos.com.my/postcode-finder',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Malaysia postcode finder.',
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
  'pos-indonesia': {
    id: 'pos-indonesia',
    name: 'Pos Indonesia Postcode Search',
    url: 'https://www.posindonesia.co.id/id',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Indonesia postcode lookup.',
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
  'bhutan-post': {
    id: 'bhutan-post',
    name: 'Bhutan Post Postcode Finder',
    url: 'https://bhutanpost.bt/postcode/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Bhutan Post postcode finder.',
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
    notes: 'Jordan postal-code and post-office delivery reference.',
  },
  'rjgc-jordan': {
    id: 'rjgc-jordan',
    name: 'Royal Jordanian Geographic Centre',
    url: 'https://www.rjgc.gov.jo/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'primary',
    notes: 'Jordan national geospatial and cartographic authority reference for maps, imagery, and survey data.',
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
    name: 'Kuwait Ministry Postal Services',
    url: 'https://www.moc.gov.kw/en/important-links?tab=3',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Kuwait Ministry of Communications page listing postal codes and post-office numbers.',
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
  BD: ['bd-post', 'survey-bangladesh', 'osm-bangladesh', 'hot-osm-bangladesh'],
  BN: ['post-gov-bn'],
  BT: ['bhutan-post', 'nlcs-bhutan', 'bhutan-geoportal', 'osm-bhutan'],
  CN: ['china-postal-code'],
  GE: ['gpost-ge', 'napr-georgia', 'gdi-georgia', 'gpost-address-reference', 'geonames-georgia', 'georgian-post-postcode-finder', 'georgian-post-addressing-guide', 'napr-georgia-address-registry', 'nsdi-georgia-address-layer', 'nsdi-georgia-registered-buildings', 'nsdi-georgia-registered-parcels', 'nsdi-georgia-administrative-boundaries', 'geostat-georgia-administrative-classification'],
  HK: ['landsd-hk', 'csdi-hk', 'osm-hong-kong'],
  ID: ['pos-indonesia'],
  AE: ['makani-dubai-open-data', 'osm-uae'],
  BH: ['bahrain-open-data', 'osm-bahrain'],
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
  MV: ['maldives-post', 'mlsa-maldives', 'onemap-maldives', 'osm-maldives'],
  MN: ['alamgc-mongolia', 'nsdi-mongolia', 'zipcode-mn', 'hot-osm-mongolia', 'osm-mongolia'],
  MO: ['dscc-macao', 'geoguide-macao', 'osm-macau'],
  MY: ['pos-malaysia'],
  NP: ['postalservice-np', 'national-geoportal-nepal', 'survey-department-nepal', 'osm-nepal', 'hot-osm-nepal'],
  PH: ['phlpost'],
  PK: ['pakpost', 'survey-of-pakistan', 'pak-nsdi', 'pbs-gis-pakistan', 'osm-pakistan'],
  JO: ['jordanpost', 'rjgc-jordan', 'osm-jordan'],
  KW: ['kuwait-post', 'osm-kuwait'],
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
  VN: ['vietnam-postcode'],
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
