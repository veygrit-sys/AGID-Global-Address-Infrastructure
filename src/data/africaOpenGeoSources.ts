export type AfricaOpenGeoSourceId =
  | 'osm-nominatim'
  | 'osm-overpass'
  | 'openaddresses'
  | 'geonames-postal'
  | 'geonames-gazetteer'
  | 'geoboundaries'
  | 'upu-addressing'
  | 'hot-osm-africa'
  | 'hot-osm-west-africa'
  | 'hot-osm-east-southern-africa'
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
  | 'rcmrd-geoportal'
  | 'kenya-open-data'
  | 'posta-kenya'
  | 'posta-kenya-customer-service-charter-2022'
  | 'posta-kenya-properties-2026'
  | 'upu-kenya-addressing-2004'
  | 'ca-kenya-national-addressing-system'
  | 'kenya-national-addressing-policy-2023'
  | 'survey-of-kenya-mapping-policy-2021'
  | 'ardhisasa-kenya'
  | 'odpc-kenya-address-location-privacy'
  | 'osm-kenya'
  | 'ethiopost-branches'
  | 'ethiopost-delivery-address-form'
  | 'upu-ethiopia-addressing-2002'
  | 'ethiopia-ssgi-edas'
  | 'ethiopia-nsdi-geoportal'
  | 'ethiopia-bishoftu-address-book'
  | 'ethiopia-addis-land-registration-edas'
  | 'osm-ethiopia'
  | 'mcpt-djibouti-poste'
  | 'snpsf-comores-poste'
  | 'somalia-moct-posta'
  | 'somalia-moct-postal-revival-2025'
  | 'somalia-national-postal-policy-2026'
  | 'somalia-moct-digital-addressing'
  | 'somalia-sobs-address-observation'
  | 'somalia-sobs-cbca-jurisdiction'
  | 'somalia-snbs-gis'
  | 'somalia-nira-principles'
  | 'somalia-nca-privacy'
  | 'osm-somalia'
  | 'tcra-tanzania-postcodes'
  | 'tcra-tanzania-postcode-plan-2026'
  | 'tcra-tanzania-addressing'
  | 'tanzania-postal-regulations-2018'
  | 'nbs-tanzania-wards-2022'
  | 'tcra-tanzania-napa'
  | 'pdpc-tanzania-act-2022'
  | 'pdpc-tanzania-enforcement-2026'
  | 'osm-tanzania'
  | 'south-sudan-nca-postal-sector'
  | 'malawi-postcodes-macra'
  | 'posta-uganda-physical-address'
  | 'nampost-postal-codes'
  | 'seychelles-postal-regulator-nas'
  | 'seychelles-statehouse-nas-2024'
  | 'seychelles-finance-nas-2025'
  | 'seychelles-statehouse-nas-bill-2026'
  | 'seychelles-postal-regulator-operators'
  | 'seychelles-nbs-gis'
  | 'seychelles-lands-webgis'
  | 'seychelles-webgis-disclaimer'
  | 'seychelles-land-registration-act'
  | 'seychelles-data-protection-act-2023'
  | 'osm-seychelles'
  | 'osm-seychelles-building-import'
  | 'ghanapostgps'
  | 'nipost-postcode'
  | 'nipost-national-digital-postcode-2026'
  | 'nipost-addressing-standard-2017'
  | 'upu-nigeria-addressing-2022'
  | 'npc-nigeria-ead-2023'
  | 'fcta-nigeria-agis'
  | 'ndpc-nigeria-data-protection-act-2023'
  | 'ndpc-nigeria-gaid-2025'
  | 'osm-nigeria'
  | 'la-poste-cote-divoire'
  | 'correios-cabo-verde'
  | 'correios-cabo-verde-contact-identifiers'
  | 'correios-cabo-verde-cip'
  | 'upu-cabo-verde-addressing-2014'
  | 'upu-cabo-verde-postcode-length-2026'
  | 'ingt-cabo-verde-idecv'
  | 'ingt-cabo-verde-admin-feature-service'
  | 'ingt-cabo-verde-cadastre'
  | 'osm-cabo-verde'
  | 'la-poste-benin'
  | 'la-poste-burkina'
  | 'gambia-post-services'
  | 'guinee-poste'
  | 'mopt-liberia-postal-services'
  | 'la-poste-senegal-codes'
  | 'la-poste-senegal-po-box'
  | 'upu-senegal-addressing-2015'
  | 'artp-senegal-national-addressing-2015'
  | 'geosenegal-basegeo'
  | 'geosenegal-basegeo-license'
  | 'geosenegal-urban-buildings-2019'
  | 'dgid-senegal-nicad'
  | 'senegal-data-protection-law-2008-12'
  | 'osm-senegal'
  | 'societe-postes-togo'
  | 'la-poste-mali'
  | 'niger-poste'
  | 'salpost-sierra-leone'
  | 'algerie-poste'
  | 'algerie-poste-mobile-offices'
  | 'algerie-poste-privacy'
  | 'upu-algeria-addressing-2002'
  | 'algeria-postal-addressing-regulation-2019'
  | 'algeria-national-address-referential'
  | 'algeria-local-authorities-directory'
  | 'inct-algeria-digital-geodata'
  | 'osm-algeria'
  | 'libya-post-services'
  | 'upu-morocco-postcode-manual'
  | 'poste-maroc-codepostal'
  | 'morocco-open-data-postal'
  | 'morocco-open-data-license'
  | 'ancfcc-morocco-cartography'
  | 'mauripost'
  | 'la-poste-tunisienne-codes'
  | 'upu-tunisia-addressing-2014'
  | 'tunisian-open-data-national-license'
  | 'tunisian-open-data-delegations-2025'
  | 'tunisian-open-data-governorates-2025'
  | 'otc-tunisia-cadastral-geoportal'
  | 'inpdp-tunisia-law-2004-63'
  | 'la-poste-tunisienne-privacy'
  | 'osm-tunisia'
  | 'sudapost'
  | 'correios-mocambique-codigos-postais'
  | 'upu-south-africa-postal-addressing'
  | 'stats-sa-geography'
  | 'sasdi-south-africa'
  | 'nspdr-south-africa-terms'
  | 'ngi-south-africa'
  | 'datahub-postal'
  | 'upu-egypt-postal-addressing-2023'
  | 'egypt-post-new-postcode-guide'
  | 'egypt-post'
  | 'capmas-egypt-gis'
  | 'esa-egypt-geoportal'
  | 'egy-list'
  | 'sapo-postcodes'
  | 'postafind-za'
  | 'british-overseas-postal-reference'
  | 'saint-helena-postal'
  | 'ascension-post-office'
  | 'tristan-post-office'
  | 'biot-gov'
  | 'zampost'
  | 'zampost-locations'
  | 'upu-zambia-addressing-2013'
  | 'zicta-zambia-national-addressing-postcode'
  | 'zambia-parliament-addressing-statement-2013'
  | 'zambia-ecommerce-strategy-2023'
  | 'znsdi-zambia-policy-2026'
  | 'znsdi-zambia-cadastre-lots'
  | 'zilas-zambia'
  | 'zambia-data-protection-act-2021'
  | 'dpc-zambia-location-data-guidance'
  | 'osm-zambia'
  | 'zimpost';

export interface AfricaOpenGeoSource {
  id: AfricaOpenGeoSourceId;
  name: string;
  url: string;
  kind:
    | 'postal-code'
    | 'address'
    | 'geocoding'
    | 'admin-boundary'
    | 'gazetteer'
    | 'standard'
    | 'elevation'
    | 'coastline'
    | 'hydrology'
    | 'land-cover'
    | 'marine'
    | 'protected-area'
    | 'biodiversity'
    | 'imagery';
  coverage: 'global' | 'africa' | 'country' | 'territory';
  usage: 'primary' | 'fallback' | 'validation' | 'reference';
  license?: string;
  notes: string;
}

export const AFRICA_OPEN_GEO_SOURCES: Record<AfricaOpenGeoSourceId, AfricaOpenGeoSource> = {
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
    notes: 'Open address point/reference data where country or city coverage is available.',
  },
  'geonames-postal': {
    id: 'geonames-postal',
    name: 'GeoNames Postal Code Data',
    url: 'https://download.geonames.org/export/zip/',
    kind: 'postal-code',
    coverage: 'global',
    usage: 'validation',
    license: 'CC BY 4.0',
    notes: 'Postal-code place matching for countries with downloadable GeoNames ZIP datasets.',
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
    notes: 'Open administrative boundary data for country, province, district, and local hierarchy checks.',
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
    coverage: 'africa',
    usage: 'reference',
    license: 'ODbL',
    notes: 'OpenStreetMap humanitarian mapping reference for roads, buildings, settlements, and low-address-density areas across Africa.',
  },
  'hot-osm-west-africa': {
    id: 'hot-osm-west-africa',
    name: 'HOT Open Mapping Hub West and Northern Africa',
    url: 'https://www.hotosm.org/en/open-mapping-hubs/west-northern-africa/',
    kind: 'address',
    coverage: 'africa',
    usage: 'reference',
    license: 'ODbL',
    notes: 'Regional HOT/OSM mapping support for West and Northern Africa, useful for settlement and delivery-location fallback.',
  },
  'hot-osm-east-southern-africa': {
    id: 'hot-osm-east-southern-africa',
    name: 'HOT Open Mapping Hub Eastern and Southern Africa',
    url: 'https://www.hotosm.org/en/open-mapping-hubs/eastern-southern-africa/',
    kind: 'address',
    coverage: 'africa',
    usage: 'reference',
    license: 'ODbL',
    notes: 'Regional HOT/OSM mapping support for Eastern and Southern Africa, including disaster, rural road, and building datasets.',
  },
  'openstreetmap-wiki-africa': {
    id: 'openstreetmap-wiki-africa',
    name: 'OpenStreetMap Africa Project Pages',
    url: 'https://wiki.openstreetmap.org/wiki/Africa',
    kind: 'gazetteer',
    coverage: 'africa',
    usage: 'reference',
    license: 'ODbL',
    notes: 'OSM country and community project index for African tagging conventions, local names, roads, and settlement coverage.',
  },
  'humdata-africa': {
    id: 'humdata-africa',
    name: 'Humanitarian Data Exchange Africa',
    url: 'https://data.humdata.org/group/africa',
    kind: 'admin-boundary',
    coverage: 'africa',
    usage: 'reference',
    license: 'Varies by dataset',
    notes: 'HDX open humanitarian datasets for administrative boundaries, settlements, roads, health sites, and crisis geography.',
  },
  openaerialmap: {
    id: 'openaerialmap',
    name: 'OpenAerialMap',
    url: 'https://map.openaerialmap.org/',
    kind: 'gazetteer',
    coverage: 'global',
    usage: 'fallback',
    license: 'Varies by imagery',
    notes: 'Openly licensed aerial and UAV imagery useful for validating roads, settlements, coastlines, and rural delivery points.',
  },
  'digital-earth-africa-dem': {
    id: 'digital-earth-africa-dem',
    name: 'Digital Earth Africa SRTM DEM and derivatives',
    url: 'https://docs.digitalearthafrica.org/en/latest/data_specs/SRTM_DEM_specs.html',
    kind: 'elevation',
    coverage: 'africa',
    usage: 'reference',
    license: 'Open data via Digital Earth Africa / NASA SRTM terms',
    notes: 'Africa-wide elevation and terrain derivatives for mountain, escarpment, slope, and highland address context.',
  },
  'digital-earth-africa-coastlines': {
    id: 'digital-earth-africa-coastlines',
    name: 'Digital Earth Africa Coastlines',
    url: 'https://docs.digitalearthafrica.org/en/latest/data_specs/Coastlines_specs.html',
    kind: 'coastline',
    coverage: 'africa',
    usage: 'reference',
    notes: 'Annual African shoreline and coastal-change vectors for sea, island, beach, port, estuary, and waterfront address context.',
  },
  'digital-earth-africa-waterbodies': {
    id: 'digital-earth-africa-waterbodies',
    name: 'Digital Earth Africa Waterbodies',
    url: 'https://docs.digitalearthafrica.org/en/latest/sandbox/notebooks/Datasets/Waterbodies.html',
    kind: 'hydrology',
    coverage: 'africa',
    usage: 'reference',
    notes: 'Continental waterbody monitoring for lakes, reservoirs, wetlands, river-adjacent settlements, and natural water address display.',
  },
  'digital-earth-africa-wofs': {
    id: 'digital-earth-africa-wofs',
    name: 'Digital Earth Africa Water Observations from Space',
    url: 'https://digitalearthafrica.org/en_za/water-observations-from-space/',
    kind: 'hydrology',
    coverage: 'africa',
    usage: 'reference',
    notes: 'Continental satellite water observation layers for surface water recurrence, floodplains, deltas, wetlands, and seasonal water address context.',
  },
  'digital-earth-africa-fractional-cover': {
    id: 'digital-earth-africa-fractional-cover',
    name: 'Digital Earth Africa Fractional Cover',
    url: 'https://docs.digitalearthafrica.org/en/latest/data_specs/Fractional_Cover_specs.html',
    kind: 'land-cover',
    coverage: 'africa',
    usage: 'reference',
    notes: 'Africa vegetation, bare ground, and non-photosynthetic cover layers for savanna, desert, mountain foothill, cropland, and natural landscape context.',
  },
  'digital-earth-africa-geomad': {
    id: 'digital-earth-africa-geomad',
    name: 'Digital Earth Africa GeoMAD Cloud-Free Composites',
    url: 'https://docs.digitalearthafrica.org/en/latest/data_specs/GeoMAD_specs.html',
    kind: 'imagery',
    coverage: 'africa',
    usage: 'reference',
    notes: 'Cloud-free satellite composites for validating natural features, coastlines, mountain terrain, water edges, vegetation, and rural settlements.',
  },
  'fao-wapor': {
    id: 'fao-wapor',
    name: 'FAO WaPOR',
    url: 'https://www.fao.org/in-action/remote-sensing-for-water-productivity/wapor-data/en',
    kind: 'hydrology',
    coverage: 'africa',
    usage: 'reference',
    license: 'FAO WaPOR data terms',
    notes: 'Open remote-sensing water productivity data for Africa and the Near East, useful for irrigated areas, river basins, oases, wetlands, and agricultural water context.',
  },
  'esa-worldcover': {
    id: 'esa-worldcover',
    name: 'ESA WorldCover',
    url: 'https://esa-worldcover.org/en/data-access',
    kind: 'land-cover',
    coverage: 'global',
    usage: 'reference',
    license: 'Free and open data access',
    notes: '10 m global land cover for African forest, grassland, desert, wetland, cropland, mangrove, and other natural landscape labels.',
  },
  'gebco-bathymetry': {
    id: 'gebco-bathymetry',
    name: 'GEBCO Gridded Bathymetry',
    url: 'https://www.gebco.net/data_and_products/gridded_bathymetry_data/',
    kind: 'marine',
    coverage: 'global',
    usage: 'reference',
    license: 'GEBCO terms of use',
    notes: 'Global bathymetry and land elevation grid for African seas, channels, continental shelf, trench, and offshore island context.',
  },
  'gmrt-topography': {
    id: 'gmrt-topography',
    name: 'Global Multi-Resolution Topography',
    url: 'https://www.gmrt.org/',
    kind: 'marine',
    coverage: 'global',
    usage: 'reference',
    notes: 'Multi-resolution topography and bathymetry synthesis for coastal Africa, offshore ridges, seamounts, and marine terrain context.',
  },
  'global-mangrove-watch': {
    id: 'global-mangrove-watch',
    name: 'Global Mangrove Watch',
    url: 'https://www.wetlands.org/coasts-and-deltas/global-mangrove-watch/',
    kind: 'land-cover',
    coverage: 'global',
    usage: 'reference',
    notes: 'Mangrove distribution and change monitoring for African coasts, deltas, estuaries, lagoons, protected wetlands, and coastal natural address context.',
  },
  'allen-coral-atlas': {
    id: 'allen-coral-atlas',
    name: 'Allen Coral Atlas',
    url: 'https://www.allencoralatlas.org/atlas/',
    kind: 'marine',
    coverage: 'global',
    usage: 'reference',
    notes: 'Shallow coral reef habitat and geomorphic-zone mapping for Red Sea, Indian Ocean, island, lagoon, reef, and marine protected area context.',
  },
  'protected-planet-wdpa': {
    id: 'protected-planet-wdpa',
    name: 'Protected Planet WDPA / WDPCA',
    url: 'https://www.protectedplanet.net/en/thematic-areas/wdpa',
    kind: 'protected-area',
    coverage: 'global',
    usage: 'reference',
    license: 'UNEP-WCMC and IUCN terms',
    notes: 'Protected terrestrial and marine areas for national parks, reserves, conservation areas, habitats, and natural address context.',
  },
  'gbif-occurrence': {
    id: 'gbif-occurrence',
    name: 'GBIF Occurrence API',
    url: 'https://techdocs.gbif.org/en/openapi/v1/occurrence',
    kind: 'biodiversity',
    coverage: 'global',
    usage: 'reference',
    license: 'Varies by dataset record',
    notes: 'Open biodiversity occurrence data for African habitat, ecosystem, protected-area, and natural feature enrichment.',
  },
  'rcmrd-gmes-africa-geoportal': {
    id: 'rcmrd-gmes-africa-geoportal',
    name: 'RCMRD GMES and Africa Geoportal',
    url: 'https://geoportal.rcmrd.org/',
    kind: 'admin-boundary',
    coverage: 'africa',
    usage: 'reference',
    notes: 'Regional open geospatial portal for environmental monitoring, land, water, coastal, disaster, and natural resource layers across Eastern and Southern Africa.',
  },
  'rcmrd-geoportal': {
    id: 'rcmrd-geoportal',
    name: 'RCMRD Geoportal',
    url: 'https://rcmrd.org/en/resources/apps-data',
    kind: 'admin-boundary',
    coverage: 'africa',
    usage: 'reference',
    notes: 'Regional Centre for Mapping of Resources for Development geospatial datasets and maps for Eastern and Southern Africa.',
  },
  'kenya-open-data': {
    id: 'kenya-open-data',
    name: 'Kenya Open Data',
    url: 'https://www.opendata.go.ke/',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'validation',
    notes: 'Kenya open-data reference for counties, administrative datasets, and public geospatial context where available.',
  },
  'posta-kenya': {
    id: 'posta-kenya',
    name: 'Postal Corporation of Kenya postcode and mail-service guidance',
    url: 'https://posta.co.ke/services/services/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Posta Kenya website copyright and exact observation or reuse terms must be pinned',
    notes: 'The official operator defines a five-digit postcode as an identifier for an individual post office within a postal region. It does not define a postcode catchment polygon, civic address, building, delivery entitlement, complete history, stable bulk API or reuse licence.',
  },
  'posta-kenya-customer-service-charter-2022': {
    id: 'posta-kenya-customer-service-charter-2022',
    name: 'Posta Kenya Customer Service Charter 2022',
    url: 'https://posta.co.ke/wp-content/uploads/2023/08/CUSTOMER-SERVICE-CHARTER-2022sep-6th-2022.pdf',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    license: 'Posta Kenya publication terms; no address-row redistribution permission inferred',
    notes: 'Official examples keep P.O. Box number, five-digit post-office code and post-office name as separate fields; EMS geographic addressing adds street, estate or building, house, floor, room and telephone. Examples and form requirements are not reusable customer rows, official postcode polygons or address-building crosswalks.',
  },
  'posta-kenya-properties-2026': {
    id: 'posta-kenya-properties-2026',
    name: 'Posta Kenya property and post-office list (February 2026)',
    url: 'https://posta.co.ke/wp-content/uploads/2026/02/The-following-is-the-list-of-Postal-Corporation-of-Kenya-properties-that-was-omitted-from-Clause-1-of-the-Terms-of-Reference-TORs.pdf',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    license: 'Tender publication context; exact table reuse and redistribution terms must be pinned',
    notes: 'The official 2026 tender addendum lists operator properties with postcodes, office names, regions, counties and constituencies. It may support a pinned office observation but is not asserted to be a complete current assignment table, service-area geometry, address database, building crosswalk or open-data licence.',
  },
  'upu-kenya-addressing-2004': {
    id: 'upu-kenya-addressing-2004',
    name: 'UPU Kenya addressing sheet (September 2004)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/kenEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; Universal POST*CODE data is separately licensed',
    notes: 'Dated five-digit format, delivery-post-office position and postal-region, regional-distribution-centre and delivery-office coding semantics only. It is not a current complete assignment table, postal polygon, address row release, building relation or blanket reuse right.',
  },
  'ca-kenya-national-addressing-system': {
    id: 'ca-kenya-national-addressing-system',
    name: 'Communications Authority of Kenya National Addressing System status',
    url: 'https://www.ca.go.ke/kenya-moves-towards-national-addressing-system-stakeholders-support-bill',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    license: 'Government publication; exact future address dataset terms remain dataset-specific',
    notes: 'The June 2026 official status describes a proposed geographically tied address for every dwelling while the National Addressing Bill 2025 remains before Parliament. It does not expose an operational nationwide row release, public API, geometry, property link or redistribution licence.',
  },
  'kenya-national-addressing-policy-2023': {
    id: 'kenya-national-addressing-policy-2023',
    name: 'Kenya National Addressing Policy (March 2023)',
    url: 'https://ict.go.ke/sites/default/files/2024-09/National%20Addressing%20Policy%20-%20March%202023.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Government policy publication; no operational address database reuse right inferred',
    notes: 'The policy defines addressable objects, child addresses, geocoding, GIS, geospatial referencing and a proposed unique alphanumeric NASK address. Policy definitions and planned governance do not prove a current assignment, postcode polygon, public address row or exact building crosswalk.',
  },
  'survey-of-kenya-mapping-policy-2021': {
    id: 'survey-of-kenya-mapping-policy-2021',
    name: 'Survey of Kenya mapping and cadastral authority context',
    url: 'https://lands.go.ke/wp-content/uploads/2021/10/Draft-National-Land-Surveying-and-Mapping-Policy-2021.pdf',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Draft policy context; exact map, boundary and cadastral artifact rights are dataset-specific',
    notes: 'The official draft identifies Survey of Kenya as the government surveying and mapping authority maintaining geodetic control and property-boundary plans. This authority context is not a postcode assignment, postal surface, public address-building relation or reuse licence.',
  },
  'ardhisasa-kenya': {
    id: 'ardhisasa-kenya',
    name: 'Kenya Ardhisasa land-information platform',
    url: 'https://ardhisasa.lands.go.ke/home',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    license: 'Government land information with service-specific access, privacy and reuse controls',
    notes: 'The Ministry and National Land Commission platform supports property search, registration, survey and mapping workflows. Portal availability does not publish a reusable national parcel-building-address-postcode crosswalk, owner data, title data or postal geometry.',
  },
  'odpc-kenya-address-location-privacy': {
    id: 'odpc-kenya-address-location-privacy',
    name: 'Kenya ODPC address, location and property privacy guidance',
    url: 'https://www.odpc.go.ke/faqs/',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Kenyan data-protection law and official guidance',
    notes: 'ODPC identifies physical and postal address and location as personal data and property details as sensitive personal data. Precise address, household, phone, MPost, parcel, title, owner and query data therefore require a lawful purpose, minimisation, access control, retention and disclosure review.',
  },
  'osm-kenya': {
    id: 'osm-kenya',
    name: 'OpenStreetMap Kenya community mapping',
    url: 'https://wiki.openstreetmap.org/wiki/OSM_Kenya',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL 1.0 separate partition',
    notes: 'Community roads, places, addresses and buildings remain in a separate attributed ODbL partition. They are not Posta Kenya assignments, NASK addresses, Survey of Kenya boundaries, cadastral relations or exact delivery-building authority.',
  },
  'ethiopost-branches': {
    id: 'ethiopost-branches',
    name: 'Ethiopost branch locator',
    url: 'https://ethio.post/branches/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Exact Ethiopost website, observation and reuse terms must be pinned',
    notes: 'Official branch, region, service and available location observation; a pinned result does not itself publish a complete four-digit assignment table, postal perimeter, history, bulk API or redistribution right.',
  },
  'ethiopost-delivery-address-form': {
    id: 'ethiopost-delivery-address-form',
    name: 'Ethiopost pickup and delivery address form',
    url: 'https://ethio.post/delivery/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Current operator input schema exposes sub-city, woreda, house number, city, province and ZIP/postal-code fields; an input form and its examples are not assignment rows, geometry, deliverability evidence or reuse permission.',
  },
  'upu-ethiopia-addressing-2002': {
    id: 'upu-ethiopia-addressing-2002',
    name: 'UPU Ethiopia addressing sheet (July 2002)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/ethEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; database reproduction requires separate permission',
    notes: 'Dated four-digit format, left-of-locality position and region/central-office/delivery-office coding semantics only; it is not a current assignment release, polygon source, complete history, reusable address database or building link.',
  },
  'ethiopia-ssgi-edas': {
    id: 'ethiopia-ssgi-edas',
    name: 'SSGI Ethiopian Digital Addressing System (eDAS)',
    url: 'https://ssgi.gov.et/platform-and-application-development/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official national digital-address programme for buildings, parcels, neighbourhoods and physical locations, rolling out city by city; programme pages do not expose a nationwide row-level dataset, stable public API, licence, release digest or postal-code geometry.',
  },
  'ethiopia-nsdi-geoportal': {
    id: 'ethiopia-nsdi-geoportal',
    name: 'Ethiopia NSDI Geoportal',
    url: 'https://ethionsdi.gov.et/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official SSGI metadata, map and OGC-service portal; each dataset may be public or access-controlled and needs its exact owner, licence, version, CRS and digest. Catalog visibility is not postal authority or blanket redistribution permission.',
  },
  'ethiopia-bishoftu-address-book': {
    id: 'ethiopia-bishoftu-address-book',
    name: 'SSGI Bishoftu Digital Addressing System address book',
    url: 'https://www.ethionsdi.gov.et/uploaded/documents/Bishoftu_AddressBook.pdf',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official city-specific eDAS publication describing unique addresses for buildings, parcels and neighbourhoods; it is not nationwide coverage, a four-digit postal assignment file, an automatically reusable row dataset or unrestricted building geometry.',
  },
  'ethiopia-addis-land-registration-edas': {
    id: 'ethiopia-addis-land-registration-edas',
    name: 'SSGI and Addis Ababa land-registration eDAS cooperation',
    url: 'https://ssgi.gov.et/ssgi-signed-mou-with-addis-ababa-city-land-acquisition-and-registration-agency/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official institutional context linking digital addressing and the city land-registration agency; the cooperation announcement supplies no address rows, parcel/building crosswalk, public licence, postal assignment or automatic exact-building relation.',
  },
  'osm-ethiopia': {
    id: 'osm-ethiopia',
    name: 'OpenStreetMap Ethiopia community mapping',
    url: 'https://wiki.openstreetmap.org/wiki/Ethiopia',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL 1.0 separate partition',
    notes: 'Community road, place, address and building context retained in a separate attributed partition; it is not Ethiopost, SSGI, land-registry or exact address-building authority.',
  },
  'mcpt-djibouti-poste': {
    id: 'mcpt-djibouti-poste',
    name: 'Djibouti MCPT La Poste de Djibouti page',
    url: 'https://communication.gouv.dj/structures-sous-tutelle/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Djibouti Ministry of Communication, Posts and Telecommunications page identifying La Poste de Djibouti as the national postal service and linking the operator site.',
  },
  'snpsf-comores-poste': {
    id: 'snpsf-comores-poste',
    name: 'SNPSF Comoros postal services',
    url: 'https://www.snpsf.com/poste',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official SNPSF postal-services portal covering Comoros postal products, tracking, EMS, mandates, postal guides, and customer contact channels.',
  },
  'somalia-moct-posta': {
    id: 'somalia-moct-posta',
    name: 'Somalia MOCT Postal Service',
    url: 'https://moct.gov.so/en/posta/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Somalia Ministry of Communications and Technology postal-service department page; use with current MOCT postal-exchange updates as the primary official postal reference while public postcode tooling remains limited.',
  },
  'somalia-moct-postal-revival-2025': {
    id: 'somalia-moct-postal-revival-2025', name: 'Somalia MOCT National Postal Service revival 2025', url: 'https://moct.gov.so/en/inauguration-of-the-national-postal-service-revival-at-aden-adde-international-airport-led-by-minister-mohamed-soomaali/', kind: 'postal-code', coverage: 'country', usage: 'primary',
    notes: 'Official July 2025 ministry report says sending and receiving mail resumed in May 2025. Operational service evidence is not a postcode assignment table, delivery catchment or polygon release.',
  },
  'somalia-national-postal-policy-2026': {
    id: 'somalia-national-postal-policy-2026', name: 'Somalia Cabinet National Postal Policy 2025-2030 approval', url: 'https://sonna.so/en/article/somali-cabinet-commends-army-victory-in-kudhaa-approves-maritime-agreements-and-national-postal-policy', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Official national news agency reports Cabinet approval in January 2026. Policy approval does not prove an effective public assignment register or postcode geometry.',
  },
  'somalia-moct-digital-addressing': {
    id: 'somalia-moct-digital-addressing', name: 'Somalia MOCT digital addressing programme', url: 'https://moct.gov.so/en/pillars/', kind: 'address', coverage: 'country', usage: 'reference',
    notes: 'Current ministry pillars include setting up an address system and operationalising post offices. Programme status is not a complete nationwide civic-address or building registry.',
  },
  'somalia-sobs-address-observation': {
    id: 'somalia-sobs-address-observation', name: 'Somali Bureau of Standards official contact address observation', url: 'https://sobs.gov.so/contact-us/', kind: 'postal-code', coverage: 'country', usage: 'validation',
    notes: 'Official organisation contact page publicly displays P.O. Box 67 with BN03010. It validates an observed AA plus five-digit shape only, not nationwide assignment, code semantics, subscriber data or geometry.',
  },
  'somalia-sobs-cbca-jurisdiction': {
    id: 'somalia-sobs-cbca-jurisdiction', name: 'Somali Bureau of Standards CBCA jurisdiction context', url: 'https://sobs.gov.so/wp-content/uploads/2023/08/CBCA.pdf', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Official conformity document demonstrates that operational territorial scopes and entry points must remain explicit. It is not postal or address assignment evidence.',
  },
  'somalia-snbs-gis': {
    id: 'somalia-snbs-gis', name: 'Somalia National Bureau of Statistics cartography and GIS', url: 'https://nbs.gov.so/directorate-of-information-communication-technology/', kind: 'admin-boundary', coverage: 'country', usage: 'reference',
    notes: 'Official statistical cartography and GIS capability provides contextual mapping only; enumeration areas, administrative units and service points are not postal polygons or address-building links.',
  },
  'somalia-nira-principles': {
    id: 'somalia-nira-principles', name: 'Somalia NIRA identity and data-sovereignty principles', url: 'https://nira.gov.so/nira-principles', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'The 11-digit National Identification Number identifies a person, not a postcode or address. Identity data remains controlled and subject to stated in-country data-sovereignty principles.',
  },
  'somalia-nca-privacy': {
    id: 'somalia-nca-privacy', name: 'Somalia NCA privacy policy', url: 'https://nca.gov.so/privacy-policy', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Public authority site privacy notice supports minimisation, security and data-subject controls for site processing; it is not represented as a comprehensive national privacy statute.',
  },
  'osm-somalia': {
    id: 'osm-somalia', name: 'OpenStreetMap Somalia project', url: 'https://wiki.openstreetmap.org/wiki/Somalia', kind: 'address', coverage: 'country', usage: 'fallback', license: 'ODbL; separate attributed partition required',
    notes: 'Community roads, localities and buildings are candidate context only. OSM does not establish official Somali postcode assignments, jurisdiction, cadastre, delivery entitlement or exact address-to-building links.',
  },
  'tcra-tanzania-postcodes': {
    id: 'tcra-tanzania-postcodes', name: 'TCRA Tanzania postcode search', url: 'https://www.tcra.go.tz/services/postcodes', kind: 'postal-code', coverage: 'country', usage: 'primary',
    license: 'TCRA public lookup; bulk extraction and redistribution rights are not inferred',
    notes: 'Official current lookup publishes region, district, postcode-for text and five-digit code. Rows are reference observations, not a blanket reusable bulk release, category proof, building relation or polygon.',
  },
  'tcra-tanzania-postcode-plan-2026': {
    id: 'tcra-tanzania-postcode-plan-2026', name: 'TCRA National Postcode Allocation Plan July 2026', url: 'https://tcra.go.tz/publications/guidebooks', kind: 'standard', coverage: 'country', usage: 'primary',
    license: 'Official plan publication; database and redistribution rights remain source-specific',
    notes: 'Current official plan version metadata. Tanzania uses five digits across administrative wards, post offices, big mailers, landmarks and temporary events, so syntax alone cannot identify an area or current assignment.',
  },
  'tcra-tanzania-addressing': {
    id: 'tcra-tanzania-addressing', name: 'TCRA National Addressing and Postcode service', url: 'https://address.tcra.go.tz/services/postcode', kind: 'address', coverage: 'country', usage: 'primary',
    license: 'TCRA public reference; address-file and bulk reuse rights are not inferred',
    notes: 'Official system semantics define six postcode zones plus Zanzibar, the digit hierarchy, five postcode categories and address examples. Landmark/event coordinates are not automatically polygons, and P.O. Box remains separate from the physical address.',
  },
  'tanzania-postal-regulations-2018': {
    id: 'tanzania-postal-regulations-2018', name: 'Tanzania Electronic and Postal Communications (Postal) Regulations 2018', url: 'https://www.tcra.go.tz/download/sw-1619086897-The%20Electronic%20and%20Postal%20Communications%20%28Postal%29%20Regulations%2C%202018.pdf', kind: 'standard', coverage: 'country', usage: 'reference',
    license: 'Official legislation publication',
    notes: 'Regulation 28 places the national address database and address/postcode map under TCRA management and makes TCRA the sole disseminator of address files. Public postcode access does not grant unrestricted address-file redistribution.',
  },
  'nbs-tanzania-wards-2022': {
    id: 'nbs-tanzania-wards-2022', name: 'NBS Tanzania 2022 Census ward/shehia boundaries', url: 'https://microdata.nbs.go.tz/index.php/catalog/49', kind: 'admin-boundary', coverage: 'country', usage: 'validation',
    license: 'NBS terms: statistical/scientific research only; no redistribution or sale without written agreement',
    notes: 'Official v0.1 ward-area polygons use GCS Arc 1960 and are continually improved. They are administrative/census geometry, not TCRA postcode polygons; redistribution, exact ward assignment crosswalk, edition, CRS transformation and Zanzibar/shehia scope must be approved.',
  },
  'tcra-tanzania-napa': {
    id: 'tcra-tanzania-napa', name: 'Tanzania National Physical Addressing system (NaPA)', url: 'https://testnapa.mawasiliano.go.tz/', kind: 'address', coverage: 'country', usage: 'reference',
    license: 'Controlled operational/test interface; no bulk address or building reuse right inferred',
    notes: 'NaPA exposes address-code and postcode search concepts. LGAs allocate and register residential addresses and house numbers; only an explicit rights-cleared stable address-to-building relation can support exact building display.',
  },
  'pdpc-tanzania-act-2022': {
    id: 'pdpc-tanzania-act-2022', name: 'Tanzania Personal Data Protection Act 2022', url: 'https://www.pdpc.go.tz/media/media/THE_PERSONAL_DATA_PROTECTION_ACT.pdf', kind: 'standard', coverage: 'country', usage: 'reference',
    license: 'Official legislation publication',
    notes: 'The Act treats address information as personal data and governs collection, processing, disclosure, security and transfers. It supplies governance, not postal, address or geometry data.',
  },
  'pdpc-tanzania-enforcement-2026': {
    id: 'pdpc-tanzania-enforcement-2026', name: 'Tanzania PDPC full-enforcement notice 2026', url: 'https://www.pdpc.go.tz/media/media/PUBLIC_NOTICE_MARCH_2026.pdf', kind: 'standard', coverage: 'country', usage: 'reference',
    license: 'Official regulator notice',
    notes: 'PDPC announced full enforcement from 9 April 2026, including controller/processor registration and compliance. Precise addresses, residents, owners, occupants, deliveries and query logs remain controlled.',
  },
  'osm-tanzania': {
    id: 'osm-tanzania', name: 'OpenStreetMap Tanzania community mapping', url: 'https://wiki.openstreetmap.org/wiki/Tanzania', kind: 'address', coverage: 'country', usage: 'validation',
    license: 'ODbL 1.0 separate attributed partition',
    notes: 'Community roads, names, addresses and buildings are useful candidate context but are not TCRA assignments, NBS/OCGS boundaries, LGA address registrations, cadastre or exact address-building authority.',
  },
  'south-sudan-nca-postal-sector': {
    id: 'south-sudan-nca-postal-sector',
    name: 'South Sudan NCA postal-sector oversight',
    url: 'https://www.nca.gov.ss/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official South Sudan National Communication Authority site stating the agency regulates the postal and courier sectors; use as current country-specific official postal evidence while direct public postal-operator tooling remains limited.',
  },
  'malawi-postcodes-macra': {
    id: 'malawi-postcodes-macra',
    name: 'MACRA Malawi post codes',
    url: 'https://macra.mw/post-codes/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Malawi Communications Regulatory Authority postcode table covering national region, district, town, and traditional authority codes.',
  },
  'posta-uganda-physical-address': {
    id: 'posta-uganda-physical-address',
    name: 'Posta Uganda physical address service',
    url: 'https://ugapost.co.ug/our-services/physical-address/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Posta Uganda physical-address and postal-address application guidance used as current postal-network evidence while postcode tooling remains service-led.',
  },
  'nampost-postal-codes': {
    id: 'nampost-postal-codes',
    name: 'NamPost postal codes',
    url: 'https://www.nampost.com.na/postal/postal-codes',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official NamPost postal-code directory with public postcode listings grouped by political region.',
  },
  'seychelles-postal-regulator-nas': {
    id: 'seychelles-postal-regulator-nas', name: 'Seychelles Postal Regulator National Addressing System', url: 'https://seychellespostalregulator.com/pages/national-addressing-system', kind: 'address', coverage: 'country', usage: 'primary',
    notes: 'Current regulator page marks the S42-aligned national addressing and postcode system as coming soon. It does not publish an authoritative postcode assignment table, national address directory or postcode geometry.',
  },
  'seychelles-statehouse-nas-2024': {
    id: 'seychelles-statehouse-nas-2024', name: 'Seychelles Cabinet National Addressing System decision 2024', url: 'https://www.statehouse.gov.sc/index.php/cabinet-decisions/6201/cabinet-business-thursday-25th-july-2024', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Cabinet approved S42 implementation and a postcode proposition with a Beau Vallon pilot and planned March 2025 rollout; a plan or target does not prove completed national assignments.',
  },
  'seychelles-finance-nas-2025': {
    id: 'seychelles-finance-nas-2025', name: 'Seychelles National Address System update 2025', url: 'https://www.finance.gov.sc/blog/2025/04/17/postal-courier-shipment-and-national-address-system-update-2024/', kind: 'address', coverage: 'country', usage: 'reference',
    notes: 'Official update says Beau Vallon building-address work was underway and described a future Mahé, Praslin and La Digue objective; it is rollout evidence, not a complete current address or postcode database.',
  },
  'seychelles-statehouse-nas-bill-2026': {
    id: 'seychelles-statehouse-nas-bill-2026', name: 'Seychelles National Addressing System Bill Cabinet approval 2026', url: 'https://statehouse.gov.sc/news/6905/vice-president-pillay-outlines-cabinet-decisions-on-public-safety-system-reform-and-service-delivery', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Official April 2026 briefing says 0000 is a placeholder rather than a proper postcode and describes a place-linked system. Cabinet approval of a Bill is not enactment, commencement or proof of an assigned code.',
  },
  'seychelles-postal-regulator-operators': {
    id: 'seychelles-postal-regulator-operators', name: 'Seychelles Postal Regulator operator register', url: 'https://seychellespostalregulator.com/pages/postal-and-courier-operators', kind: 'postal-code', coverage: 'country', usage: 'reference',
    notes: 'Official regulator identifies Seychelles Postal Services and licensed courier context; operator status does not establish a reusable P.O. Box subscriber directory, postcode or delivery catchment.',
  },
  'seychelles-nbs-gis': {
    id: 'seychelles-nbs-gis', name: 'Seychelles National Bureau of Statistics GIS', url: 'https://www.nbs.gov.sc/statistics/gis', kind: 'admin-boundary', coverage: 'country', usage: 'validation',
    notes: 'Official census GIS maintains enumeration-area frames using household and facility locations. Statistical areas and confidential household frames are not postal areas or public exact-address/building links.',
  },
  'seychelles-lands-webgis': {
    id: 'seychelles-lands-webgis', name: 'Seychelles Department of Lands WebGIS', url: 'https://www.lh.gov.sc/webgis', kind: 'admin-boundary', coverage: 'country', usage: 'validation',
    notes: 'Government WebGIS describes parcel, planning and geographic layers, but public maps are informational, partner raw-data access is controlled and exact artifact rights and lineage must be pinned.',
  },
  'seychelles-webgis-disclaimer': {
    id: 'seychelles-webgis-disclaimer', name: 'Seychelles WebGIS disclaimer', url: 'https://www.webgis.gov.sc/mobile/', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Official disclaimer says map data are informational, not live, do not replace licensed surveys and are not official court documents; WebGIS display is not postal or cadastral title authority.',
  },
  'seychelles-land-registration-act': {
    id: 'seychelles-land-registration-act', name: 'Seychelles Land Registration Act', url: 'https://seylii.org/akn/sc/act/1965/25/eng%402014-12-01/source', kind: 'standard', coverage: 'country', usage: 'reference', license: 'CC BY 4.0 legal text reproduction',
    notes: 'Legal land-registration context for parcels and interests. A parcel identifier or WebGIS parcel does not equal a postcode, national address, building identifier, owner or occupant record.',
  },
  'seychelles-data-protection-act-2023': {
    id: 'seychelles-data-protection-act-2023', name: 'Seychelles Data Protection Act 2023', url: 'https://seylii.org/akn/sc/act/2023/24/eng%402023-12-22/source.pdf', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Official privacy framework includes safe custody, privacy by design, security, records, impact assessment and cross-border data-flow duties for personal and location-linked data.',
  },
  'osm-seychelles': {
    id: 'osm-seychelles', name: 'OpenStreetMap WikiProject Seychelles', url: 'https://wiki.openstreetmap.org/wiki/WikiProject_Seychelles', kind: 'address', coverage: 'country', usage: 'fallback', license: 'ODbL; separate attributed partition required',
    notes: 'Community road, locality and building context only; it is not authoritative NAS assignment, postal coverage, cadastral title or exact occupant evidence.',
  },
  'osm-seychelles-building-import': {
    id: 'osm-seychelles-building-import', name: 'OpenStreetMap Seychelles building import 2018', url: 'https://wiki.openstreetmap.org/wiki/Seychelles_Building_Import', kind: 'address', coverage: 'country', usage: 'fallback', license: 'ODbL; separate attributed partition required',
    notes: 'Dated one-time 2018 import of about 31,000 government/NBS-derived building outlines, mainly on Mahé, Praslin and La Digue. A footprint is not a current national address, postcode, parcel-title or occupant link.',
  },
  ghanapostgps: {
    id: 'ghanapostgps',
    name: 'GhanaPostGPS National Digital Address System',
    url: 'https://www.ghanapostgps.com/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Ghana Post digital addressing system with postcode-area and unique digital address lookup for Ghanaian delivery and location validation.',
  },
  'nipost-postcode': {
    id: 'nipost-postcode',
    name: 'NIPOST Numeric Postcode and Mail Services',
    url: 'https://nipost.gov.ng/Mails/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public NIPOST reference; no bulk extraction or redistribution rights inferred',
    notes: 'The current NIPOST mails page describes the numeric postcode system for mail processing and delivery. The postcode-finder page exposes no stable documented public API or reusable nationwide assignment table, address corpus, building relation or polygon.',
  },
  'nipost-national-digital-postcode-2026': {
    id: 'nipost-national-digital-postcode-2026', name: 'NIPOST National Digital Alphanumeric Postcode', url: 'https://www.postcode.gov.ng/', kind: 'postal-code', coverage: 'country', usage: 'reference',
    license: 'NIPOST site is all rights reserved; developer and data redistribution terms are not yet published',
    notes: 'Official site schedules nationwide launch for 1 October 2026 and describes an 11-character State/LGA/District/Area/Building hierarchy. Before that effective date, and without a current official assignment response, a syntax-shaped value is prelaunch metadata only; the site says the developer portal is still forthcoming.',
  },
  'nipost-addressing-standard-2017': {
    id: 'nipost-addressing-standard-2017', name: 'Nigerian National Addressing Standard and Guidelines July 2017', url: 'https://nipost.gov.ng/wp-content/uploads/2024/09/NIGERIAN-NATIONAL-ADDRESSING-STANDARD-AND-GUIDELINES.pdf', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Official standard covers street naming, property numbering, address components, the six-digit postcode system and building-identification methodology. It is not a current public address/building database, postcode assignment table, geometry release or reuse licence.',
  },
  'upu-nigeria-addressing-2022': {
    id: 'upu-nigeria-addressing-2022', name: 'UPU Nigeria postal addressing sheet', url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/ngaEn.pdf', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Dated UPU semantics place six digits with locality and distinguish street addresses, organisations, P.O. Boxes and poste restante. Examples do not prove current assignments, exclusive areas, public address rows, buildings or geometry.',
  },
  'npc-nigeria-ead-2023': {
    id: 'npc-nigeria-ead-2023', name: 'Nigeria National Population Commission Enumeration Area Demarcation', url: 'https://nationalpopulation.gov.ng/EAD', kind: 'admin-boundary', coverage: 'country', usage: 'reference',
    license: 'NPC states EAD products are available to researchers/users at a cost; exact contract, confidentiality and redistribution terms required',
    notes: 'EA, supervisory area, locality, ward/registration area, LGA, building and road layers are census/statistical context. They are not NIPOST postal geometry, current digital-code assignments, civic-address records or automatic address-to-building links.',
  },
  'fcta-nigeria-agis': {
    id: 'fcta-nigeria-agis', name: 'FCT Abuja Geographic Information Systems', url: 'https://fcta.gov.ng/ova_dep/abuja-geographic-information-systems/', kind: 'geocoding', coverage: 'territory', usage: 'reference',
    license: 'FCT land/cadastral system; exact service, contract, fields, privacy and redistribution rights required',
    notes: 'AGIS supports FCT land registry, cadastre, street naming and house numbering only within its jurisdiction. A parcel or property record is not a national NIPOST assignment, postcode polygon or exact civic-address-to-building relation unless explicitly linked by an authorized source.',
  },
  'ndpc-nigeria-data-protection-act-2023': {
    id: 'ndpc-nigeria-data-protection-act-2023', name: 'Nigeria Data Protection Act 2023', url: 'https://ndpc.gov.ng/download/nigeria-data-protection-act-2023', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Official data-protection law governs lawful, fair, accountable and secure processing and cross-border transfer safeguards. It supplies governance only, not permission to publish precise private addresses, building codes, residents, owners, occupants or query trails.',
  },
  'ndpc-nigeria-gaid-2025': {
    id: 'ndpc-nigeria-gaid-2025', name: 'NDPC General Application and Implementation Directive 2025', url: 'https://ndpc.gov.ng/wp-content/uploads/2025/03/NDP-ACT-GAID-2025-MARCH-20TH.pdf', kind: 'standard', coverage: 'country', usage: 'reference',
    notes: 'Current implementation guidance covers lawful basis, DPIA, security, data processing agreements, retention and cross-border processing. It is legal metadata, not a postal, address, cadastral or building dataset.',
  },
  'osm-nigeria': {
    id: 'osm-nigeria', name: 'OpenStreetMap Nigeria community mapping', url: 'https://wiki.openstreetmap.org/wiki/Nigeria', kind: 'address', coverage: 'country', usage: 'fallback',
    license: 'ODbL; separate attributed partition required',
    notes: 'Community roads, addresses and building footprints are candidate context only. OSM does not establish NIPOST assignment, postal authority, cadastre, delivery entitlement or an exact address-to-building link.',
  },
  'la-poste-cote-divoire': {
    id: 'la-poste-cote-divoire',
    name: "La Poste de Cote d'Ivoire",
    url: 'https://www.laposte.ci/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: "Official La Poste de Cote d'Ivoire portal with postal directory and post-office services; use as current postal-network evidence while direct public postcode lookup remains limited.",
  },
  'correios-cabo-verde': {
    id: 'correios-cabo-verde',
    name: 'Correios de Cabo Verde four-digit postcode guidance',
    url: 'https://correios.cv/faq',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Correios website copyright and exact reuse terms must be pinned',
    notes: 'Official operator guidance states a four-digit postcode followed by the locality or zone and gives locality examples; it is not a bulk assignment release, polygon source, complete history or redistribution licence.',
  },
  'correios-cabo-verde-contact-identifiers': {
    id: 'correios-cabo-verde-contact-identifiers',
    name: 'Correios de Cabo Verde contact-location identifiers',
    url: 'https://www.correios.cv/contactos',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    license: 'Correios website all-rights-reserved notice; observation-only unless permission is pinned',
    notes: 'The operator contact page publishes NNNN-NNN values labelled Codigo Postal for branches. It does not document a nationwide extended-code schema, mapping to the four-digit UPU postcode, CIP mapping, geometry, bulk API or reuse right.',
  },
  'correios-cabo-verde-cip': {
    id: 'correios-cabo-verde-cip',
    name: 'Correios de Cabo Verde CIP user portal',
    url: 'https://www.correios.cv/cip',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    license: 'Authenticated personal or company account data; no bulk redistribution',
    notes: 'The operator describes CIP as a numeric domiciliary postal identifier for a person or company associated with a georeference. It is separate from a public four-digit postcode table and may expose personal or business location data.',
  },
  'upu-cabo-verde-addressing-2014': {
    id: 'upu-cabo-verde-addressing-2014',
    name: 'UPU Cabo Verde addressing sheet (April 2014)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/CPVEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; database reproduction requires separate permission',
    notes: 'Dated four-digit format and island, commune, commune-district and post-office digit semantics only; not a current complete assignment table, polygon, address database or building relation.',
  },
  'upu-cabo-verde-postcode-length-2026': {
    id: 'upu-cabo-verde-postcode-length-2026',
    name: 'UPU Universal POST*CODE general addressing issues (August 2026)',
    url: 'https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; Universal POST*CODE data is separately licensed',
    notes: 'The August 2026 UPU length table lists Cabo Verde as four digits. It establishes current length context only, not assignments, geometry, a CIP mapping or redistribution rights.',
  },
  'ingt-cabo-verde-idecv': {
    id: 'ingt-cabo-verde-idecv',
    name: 'INGT Cabo Verde Spatial Data Infrastructure (IDE-CV)',
    url: 'https://ingt.gov.cv/ingt/Servi%C3%A7os/idecv/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Dataset-specific owner, access and reuse terms',
    notes: 'Official OGC-oriented metadata, viewer and geoservice infrastructure. Catalog visibility and public query capability do not make every layer open or postal authority.',
  },
  'ingt-cabo-verde-admin-feature-service': {
    id: 'ingt-cabo-verde-admin-feature-service',
    name: 'INGT Cabo Verde administrative division feature service',
    url: 'https://ingtgeo.gov.cv/arcgisingt/rest/services/SDI/Divisao_Administrativa_CaboVerde/FeatureServer',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'INGT copyright; exact layer reuse and redistribution terms must be pinned',
    notes: 'Official 2010 cartography at 1:5000 for island, municipality, parish, zone, city, town, place and neighbourhood context. These layers are administrative or toponymic, not postcode polygons.',
  },
  'ingt-cabo-verde-cadastre': {
    id: 'ingt-cabo-verde-cadastre',
    name: 'INGT Cabo Verde property cadastre programme',
    url: 'https://ingt.gov.cv/ingt/Servi%C3%A7os/cadastro-predial/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    license: 'Public access subject to personal-data law and exact artifact terms',
    notes: 'Official cadastral programme for physical, economic and legal property identity. Programme access language does not publish a nationwide reusable parcel-building-address-CIP crosswalk or authorize disclosure of owners.',
  },
  'osm-cabo-verde': {
    id: 'osm-cabo-verde',
    name: 'OpenStreetMap Cabo Verde community mapping',
    url: 'https://wiki.openstreetmap.org/wiki/Cabo_Verde',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL 1.0 separate partition',
    notes: 'Community roads, places, addresses and buildings retained in a separate attributed partition; not Correios, UPU, INGT, cadastral or exact CIP-building authority.',
  },
  'la-poste-benin': {
    id: 'la-poste-benin',
    name: 'La Poste du Benin agency directory',
    url: 'https://laposte.bj/nos-agences/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official La Poste du Benin agency and service directory used as current postal-operator evidence while public postcode tooling remains limited.',
  },
  'la-poste-burkina': {
    id: 'la-poste-burkina',
    name: 'La Poste Burkina Faso postcode search',
    url: 'https://codespostaux.laposte.bf/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official La Poste Burkina Faso postcode search for locality and five-digit postal-code confirmation.',
  },
  'gambia-post-services': {
    id: 'gambia-post-services',
    name: 'Gambia Postal Services Corporation',
    url: 'https://gambiapost.gm/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official GAMPOST operator portal used as current postal-network evidence while direct public postcode search remains limited.',
  },
  'mopt-liberia-postal-services': {
    id: 'mopt-liberia-postal-services',
    name: 'Liberia Ministry of Posts and Telecommunications',
    url: 'https://mopt.gov.lr/about-us/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Liberia postal authority page describing the ministry mandate to provide postal services nationwide and linking current postal-service resources.',
  },
  'guinee-poste': {
    id: 'guinee-poste',
    name: 'La Poste Guineenne',
    url: 'https://www.laposte.gn/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Guinea postal-operator portal used as current postal-network evidence while direct public postcode lookup remains limited.',
  },
  'la-poste-senegal-codes': {
    id: 'la-poste-senegal-codes', name: 'La Poste Senegal postcode and office locator', url: 'https://www.laposte.sn/services/code-postal-senegal/', kind: 'postal-code', coverage: 'country', usage: 'primary', license: 'La Poste website and service terms; bulk reuse right is not inferred', notes: 'Current operator page resolves a user location or address to a five-digit code, nearest post office and distance. A permitted successful response is a dated assignment and office observation, not a complete reusable directory, customer-address release, catchment or delivery entitlement.',
  },
  'la-poste-senegal-po-box': {
    id: 'la-poste-senegal-po-box', name: 'La Poste Senegal P.O. Box service', url: 'https://www.laposte.sn/services/boite-postale/', kind: 'address', coverage: 'country', usage: 'reference', license: 'La Poste website copyright; subscriber and holder records are not reusable', notes: 'Official service defines a nominative BP number at a chosen post office and explicitly separates postal reception from the home address. BP, subscriber, key and confidentiality records remain separate from postcode, residence and building.',
  },
  'upu-senegal-addressing-2015': {
    id: 'upu-senegal-addressing-2015', name: 'UPU Senegal addressing sheet (February 2015)', url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/senFr.pdf', kind: 'standard', coverage: 'country', usage: 'reference', license: 'UPU publication terms; Universal POST*CODE database rights are separate', notes: 'Dated five-digit syntax, code position before delivery-office name, routing components and examples for geographic and P.O. Box delivery. It is not a current assignment database, postal geometry, customer-address release or blanket reuse right.',
  },
  'artp-senegal-national-addressing-2015': {
    id: 'artp-senegal-national-addressing-2015', name: 'ARTP national addressing workshop report (2015)', url: 'https://artp.sn/sites/default/files/documents/rapport_synthese_atelier_adressage_version_finale.pdf', kind: 'standard', coverage: 'country', usage: 'reference', license: 'Official regulatory report; operational datasets and participant material retain separate rights', notes: 'Dated report documents the five-digit plan, street and villa numbering gaps, non-exhaustive addressing and the need for a single national system. Historical findings do not prove current incompleteness, assignments, boundaries or public address rows.',
  },
  'geosenegal-basegeo': {
    id: 'geosenegal-basegeo', name: 'ANAT BaseGeo Senegal', url: 'https://www.geosenegal.gouv.sn/-base-de-donnees-geographiques-.html', kind: 'admin-boundary', coverage: 'country', usage: 'validation', license: 'BaseGeo Senegal licence acceptance, attribution, downstream terms, duration and termination obligations', notes: 'Official multi-scale topography includes administration, transport, toponyms and selected buildings. Scale, coverage and edition vary; these layers are not La Poste assignments, postcode catchments, civic-address rows or cadastral relations.',
  },
  'geosenegal-basegeo-license': {
    id: 'geosenegal-basegeo-license', name: 'BaseGeo Senegal data-use licence', url: 'https://www.geosenegal.gouv.sn/conditions-d-utilisation.html', kind: 'standard', coverage: 'country', usage: 'reference', license: 'Contractual BaseGeo Senegal data-use agreement', notes: 'Licence grants conditional use and distribution with ANAT attribution, requires prior Senegal agreement for commercial derived products, imposes downstream terms, renews annually and requires deletion after termination. Exact acceptance and artifact lineage must be recorded.',
  },
  'geosenegal-urban-buildings-2019': {
    id: 'geosenegal-urban-buildings-2019', name: 'Geo Senegal city building datasets (2019)', url: 'https://www.geosenegal.gouv.sn/-terra-.html', kind: 'address', coverage: 'country', usage: 'validation', license: 'BaseGeo Senegal licence; dataset edition and city coverage are separate', notes: 'Official city-specific 2019 building datasets exist for Dakar and selected cities. The catalog country scope is not nationwide feature coverage; a footprint is not a current structure, a postal assignment, an address relation, a NICAD parcel or occupancy evidence.',
  },
  'dgid-senegal-nicad': {
    id: 'dgid-senegal-nicad', name: 'DGID Senegal NICAD parcel identification', url: 'https://www.dgid.sn/wp-content/uploads/2023/02/NICAD.pdf', kind: 'address', coverage: 'country', usage: 'reference', license: 'Official cadastral documentation; parcel, owner and domain records are controlled', notes: 'NICAD is a 16-character parcel identifier administered by DGID and encodes administrative and cadastral section/parcel context. It is not a postcode, postal polygon, building ID or public owner-address relation.',
  },
  'senegal-data-protection-law-2008-12': {
    id: 'senegal-data-protection-law-2008-12', name: 'Senegal Personal Data Protection Law No. 2008-12', url: 'https://www.archives.sn/docs/codes/loi-protection-donnees-a-caractere-personnel', kind: 'standard', coverage: 'country', usage: 'reference', license: 'Official Senegalese law publication', notes: 'The law governs collection, processing, transmission, storage and use of directly or indirectly identifying personal data, requires declarations or authorizations for relevant processing and conditions transfers to third countries. It provides governance, not postal or geometry data.',
  },
  'osm-senegal': {
    id: 'osm-senegal', name: 'OpenStreetMap Senegal community mapping', url: 'https://wiki.openstreetmap.org/wiki/Senegal', kind: 'address', coverage: 'country', usage: 'validation', license: 'ODbL 1.0 separate partition', notes: 'Community roads, names, addresses and buildings require ODbL attribution and lineage. They are not La Poste assignments, ANAT BaseGeo, DGID NICAD or exact delivery-building authority.',
  },
  'societe-postes-togo': {
    id: 'societe-postes-togo',
    name: 'Societe des Postes du Togo office network',
    url: 'https://www.laposte.tg/bureaux-poste',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Togo postal-operator office network and service portal used as current postal-reference evidence while direct postcode search remains limited.',
  },
  'la-poste-mali': {
    id: 'la-poste-mali',
    name: 'La Poste du Mali official portal',
    url: 'https://laposte.ml/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Mali postal operator portal used as current postal-network evidence while direct public postcode lookup remains limited.',
  },
  'niger-poste': {
    id: 'niger-poste',
    name: 'Niger Poste official portal',
    url: 'https://nigerposte.ne/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Niger Poste portal with product pages for agencies, postal boxes, and code-postal services; use as current postal-reference evidence.',
  },
  'salpost-sierra-leone': {
    id: 'salpost-sierra-leone',
    name: 'SALPOST Sierra Leone',
    url: 'https://salpost.gov.sl/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Sierra Leone Postal Services portal used as current postal-network evidence while direct public postcode lookup remains limited.',
  },
  'algerie-poste': {
    id: 'algerie-poste',
    name: 'Algérie Poste postal establishment directory',
    url: 'https://www.poste.dz/customer/bureaux_postaux',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Exact Algérie Poste web and observation terms must be pinned',
    notes: 'Official wilaya-filtered establishment, five-digit code, address and hours observations; one pinned result supports only its stated postal object, not bulk reuse, complete history, geometry or redistribution.',
  },
  'algerie-poste-mobile-offices': {
    id: 'algerie-poste-mobile-offices',
    name: 'Algérie Poste mobile postal establishments',
    url: 'https://www.poste.dz/customer/bureaux_postaux_itinerant',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    license: 'Exact Algérie Poste web and observation terms must be pinned',
    notes: 'Official mobile-establishment and five-digit-code reference showing that a postal code can identify a non-area service object; it does not publish a stable route or polygon.',
  },
  'algerie-poste-privacy': {
    id: 'algerie-poste-privacy',
    name: 'Algérie Poste privacy policy',
    url: 'https://www.poste.dz/page/confidentialite',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official access-log and personal-data processing context; it is not a data licence, assignment source, address dataset or geometry authority.',
  },
  'upu-algeria-addressing-2002': {
    id: 'upu-algeria-addressing-2002',
    name: 'UPU Algeria addressing sheet (July 2002)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/dzaEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; database reproduction requires separate permission',
    notes: 'Dated five-digit address-format and delivery-area/wilaya coding context only; it is not a current assignment table, polygon source, complete history or reusable postal database.',
  },
  'algeria-postal-addressing-regulation-2019': {
    id: 'algeria-postal-addressing-regulation-2019',
    name: 'Algeria Executive Decree 19-258 postal addressing regulation',
    url: 'https://www.mpt.gov.dz/wp-content/uploads/2023/11/Decret-executif-n%C2%B0-19-258.fr_.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official six-line address structure ending in five-digit postcode and commune; legal formatting context is not reusable address rows, current assignments, geometry or building linkage.',
  },
  'algeria-national-address-referential': {
    id: 'algeria-national-address-referential',
    name: 'Algeria National Addressing Referential',
    url: 'https://interieur.gov.dz/2024/10/13/referentiel-national-dadressage-2/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official institutional and rollout context for geospatial address databases; the article is not a public nationwide row dataset, API, schema, licence, geometry release or building relation.',
  },
  'algeria-local-authorities-directory': {
    id: 'algeria-local-authorities-directory',
    name: 'Algeria Ministry of Interior local authorities directory',
    url: 'https://www.interieur.gov.dz/index.php/fr/component/annuaires/annuairecommunes.html',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official commune, daïra and wilaya identity context; directory access does not establish bulk reuse, postal assignment, postal geometry, address rows or buildings.',
  },
  'inct-algeria-digital-geodata': {
    id: 'inct-algeria-digital-geodata',
    name: 'INCT Algeria digital geographic information',
    url: 'https://www.inct.mdn.dz/source/act-dn.php',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Commercial or product-specific permission required',
    notes: 'Official topographic, administrative, toponymic and construction-capable GIS product context that INCT states it commercialises; it is not open postal geometry, an address-building link or blanket redistribution permission.',
  },
  'osm-algeria': {
    id: 'osm-algeria',
    name: 'OpenStreetMap Algeria community mapping',
    url: 'https://wiki.openstreetmap.org/wiki/Algeria',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL 1.0 separate partition',
    notes: 'Community road, address, building and postcode discrepancy context; it is not Algérie Poste, government, cadastral or exact address-building authority.',
  },
  'upu-morocco-postcode-manual': {
    id: 'upu-morocco-postcode-manual',
    name: 'UPU Morocco postcode case study',
    url: 'https://www.upu.int/UPU/media/upu/publications/manualAddressingAddressingAndPostcodeManualEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Defines five digits: routeing zone and province positions; endings 0, 1, 7 and 8 are home-delivery sectors, 2 through 6 use an agency or centre code, and 9 is a large-volume recipient. It is not an assignment table or polygon source.',
  },
  'poste-maroc-codepostal': {
    id: 'poste-maroc-codepostal',
    name: 'Barid Al-Maghrib postcode directory',
    url: 'https://www.codepostal.ma/search.aspx',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Exact operator record and terms must be pinned',
    notes: 'Official postcode search and directory; only a pinned record validates its stated code or locality, not geometry, completeness, live bulk API access or redistribution permission.',
  },
  'morocco-open-data-postal': {
    id: 'morocco-open-data-postal',
    name: 'Morocco Open Data – Poste Maroc datasets',
    url: 'https://www.data.gov.ma/data/fr/organization/poste-maroc',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Open Data Commons Open Database License (ODbL), exact resource metadata controls',
    notes: 'Official district, locality, agency-code, agency-address and agency-coordinate resources; postcode lists state September 2018. Agency coordinates are points, not sector surfaces, and freshness plus exact resource licence must be pinned.',
  },
  'morocco-open-data-license': {
    id: 'morocco-open-data-license',
    name: 'Morocco Open Data reuse licence',
    url: 'https://www.data.gov.ma/fr/la-licence',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'ODbL-derived portal licence',
    notes: 'ODbL-derived attribution, licence notice, share-alike and open-access duties apply to the exact covered dataset; the policy is legal metadata, not postal assignment or geometry evidence.',
  },
  'ancfcc-morocco-cartography': {
    id: 'ancfcc-morocco-cartography',
    name: 'ANCFCC Morocco cartography and cadastre',
    url: 'https://www.ancfcc.gov.ma/nos-m%C3%A9tiers/cartographie/produits/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Exact product order, permission and terms required',
    notes: 'Official topographic, administrative, city-plan, cadastral and geodetic context; these products are not postal sectors or explicit address-building links, and catalogue visibility or payment is not public redistribution permission.',
  },
  'la-poste-tunisienne-codes': {
    id: 'la-poste-tunisienne-codes',
    name: 'La Poste Tunisienne postcode search',
    url: 'https://www.poste.tn/codes.php',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Public interactive lookup; bulk extraction, mirroring and redistribution rights are not inferred',
    notes: 'Official search accepts governorate, delegation and locality criteria and returns four-digit postcode context. A dated permitted result may validate an assignment observation; it is not a bulk release, delivery catchment, address-to-building relation or polygon.',
  },
  'upu-tunisia-addressing-2014': {
    id: 'upu-tunisia-addressing-2014', name: 'UPU Tunisia postal addressing sheet (April 2014)', url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/tunEn.pdf', kind: 'standard', coverage: 'country', usage: 'reference',
    license: 'UPU reference publication; no national assignment database or geometry redistribution right',
    notes: 'Dated official addressing guidance places four digits before the delivery office, delivery centre or locality and models building, entrance, staircase and letter-box details as separate address components. Examples are not current production rows or polygon evidence.',
  },
  'tunisian-open-data-national-license': {
    id: 'tunisian-open-data-national-license', name: 'Tunisia national open-data licence framework', url: 'https://data.gov.tn/fr/licences/licence-nationale/', kind: 'standard', coverage: 'country', usage: 'reference',
    license: 'National open-data licence framework under Government Decree 2021-3; dataset-specific licence still required',
    notes: 'The framework describes attribution and reuse principles. Portal visibility or the framework alone does not cure a dataset whose resource metadata says licence not specified or supply postal/address/building authority.',
  },
  'tunisian-open-data-delegations-2025': {
    id: 'tunisian-open-data-delegations-2025', name: 'Tunisia administrative delegations GeoJSON metadata 2025', url: 'https://catalog.data.gov.tn/fr/dataset/a04051fe-0b5c-4ff1-bc7d-59dfc2732866/resource/01b6fc4a-e490-451c-b932-96e63b4aa7e6', kind: 'admin-boundary', coverage: 'country', usage: 'validation',
    license: 'Resource metadata says licence not specified; no bundling until exact terms are pinned',
    notes: 'Official-portal delegation geometry metadata updated 11 March 2025. Delegations are administrative context, not La Poste catchments; exact producer authority, fields, CRS, edition, licence and digest are promotion blockers.',
  },
  'tunisian-open-data-governorates-2025': {
    id: 'tunisian-open-data-governorates-2025', name: 'Tunisia governorates GeoJSON 2025', url: 'https://catalog.data.gov.tn/fr/dataset/49344be7-06aa-45f9-bc5d-4a1d37b42f06/resource/492e157e-a8a8-4741-b2e9-c059ddacfc93', kind: 'admin-boundary', coverage: 'country', usage: 'validation',
    license: 'CC BY as stated by resource metadata; exact attribution, artifact, edition and digest required',
    notes: 'Official open-data portal governorate geometry updated 7 March 2025 is coarse administrative context only. It does not define four-digit postcode delivery areas, civic addresses, parcels or buildings.',
  },
  'otc-tunisia-cadastral-geoportal': {
    id: 'otc-tunisia-cadastral-geoportal', name: 'Office de la Topographie et du Cadastre geoportal', url: 'https://www.otc.nat.tn/geoportail', kind: 'geocoding', coverage: 'country', usage: 'reference',
    license: 'Cadastral portal access; no blanket public bulk or redistribution permission inferred',
    notes: 'Official cadastral information context remains a separate parcel/title domain. A parcel, map search result or footprint is not a postcode or La Poste assignment, civic-address identifier, address-to-building link, owner or occupant publication permission.',
  },
  'inpdp-tunisia-law-2004-63': {
    id: 'inpdp-tunisia-law-2004-63', name: 'INPDP Organic Law No. 2004-63', url: 'https://www.inpdp.tn/ressources/loi_2004.pdf', kind: 'standard', coverage: 'country', usage: 'reference',
    license: 'Official legislation publication',
    notes: 'The official personal-data law governs identifiable natural-person data, transparency, purpose and controls. Articles 50-52 regulate foreign transfers and require INPDP authorization; it supplies no postal, address or geometry data.',
  },
  'la-poste-tunisienne-privacy': {
    id: 'la-poste-tunisienne-privacy', name: 'La Poste Tunisienne personal-data charter', url: 'https://www.poste.tn/page.php?code_menu=155', kind: 'standard', coverage: 'country', usage: 'reference',
    license: 'Official operator privacy notice',
    notes: 'Current operator charter covers postal addresses and geolocation, minimisation, retention, recipients, security and foreign-transfer authorization. It does not authorize scraping, address publication or query-log export.',
  },
  'osm-tunisia': {
    id: 'osm-tunisia', name: 'OpenStreetMap Tunisia community mapping', url: 'https://wiki.openstreetmap.org/wiki/Tunisia', kind: 'address', coverage: 'country', usage: 'validation',
    license: 'ODbL 1.0 separate attributed partition',
    notes: 'Community Arabic/French names, roads, addresses and buildings are candidate context only and retain ODbL lineage. They are not La Poste assignments, official administrative or cadastral geometry, or an exact address-to-building authority.',
  },
  'libya-post-services': {
    id: 'libya-post-services',
    name: 'Libya Post services portal',
    url: 'https://libyapost.ly/en/services/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Libya Post service portal covering postal boxes, mail, parcels, and postal-network service information for postcode/address validation fallback.',
  },
  mauripost: {
    id: 'mauripost',
    name: 'MAURIPOST official portal',
    url: 'https://www.mauripost.mr/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official MAURIPOST portal for postal-network, service, and customer-information reference where public postcode tooling is limited.',
  },
  sudapost: {
    id: 'sudapost',
    name: 'Sudapost official site',
    url: 'https://sudapost.sd/wp/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Sudan Post site with operator, service, and network information used as current postal-reference evidence.',
  },
  'correios-mocambique-codigos-postais': {
    id: 'correios-mocambique-codigos-postais',
    name: 'Correios de Mocambique codigos postais',
    url: 'https://www.correios.co.mz/?cod=11&pagina=codigo',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Correios de Mocambique postal-code directory and customer guidance for postcode and locality validation.',
  },
  'upu-south-africa-postal-addressing': {
    id: 'upu-south-africa-postal-addressing',
    name: 'UPU South Africa Postal Addressing System',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/zafEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Defines four digits and separates physical, rural, PO Box and Private Bag delivery semantics; it is not a current code table or polygon source.',
  },
  'stats-sa-geography': {
    id: 'stats-sa-geography',
    name: 'Statistics South Africa Geography Metadata',
    url: 'https://apps.statssa.gov.za/census01/html/Geography_Metadata.htm',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Exact release terms must be pinned',
    notes: 'Official statistical and administrative geography; exact edition and licence are required and boundaries are not postal areas.',
  },
  'sasdi-south-africa': {
    id: 'sasdi-south-africa',
    name: 'South African Spatial Data Infrastructure Act',
    url: 'https://www.gov.za/documents/acts/spatial-data-infrastructure-act-54-2003-04-feb-2004',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official spatial-data governance and metadata framework, not a dataset licence, postal assignment, or feature source.',
  },
  'nspdr-south-africa-terms': {
    id: 'nspdr-south-africa-terms',
    name: 'National Spatial Planning Data Repository access terms',
    url: 'https://nspdr.dlrrd.gov.za/',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Portal access and disclaimer boundary; visibility or credentials do not grant public redistribution of postal, address, or building features.',
  },
  'ngi-south-africa': {
    id: 'ngi-south-africa',
    name: 'Chief Directorate: National Geospatial Information',
    url: 'https://ngi.dlrrd.gov.za/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    notes: 'National mapping, geodetic control, aerial imagery and topographic authority; the authority page is not postal geometry or an explicit address-building link.',
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
  'upu-egypt-postal-addressing-2023': {
    id: 'upu-egypt-postal-addressing-2023',
    name: 'UPU Egypt Postal Addressing System (July 2023)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/egyEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    notes: 'Defines seven digits as province, locality, neighbourhood and community components; it is not a current assignment table, crosswalk or polygon source.',
  },
  'egypt-post-new-postcode-guide': {
    id: 'egypt-post-new-postcode-guide',
    name: 'Egypt Post GIS New Postcode User Guide',
    url: 'https://www.eta.gov.eg/sites/default/files/2021-12/%D8%AF%D9%84%D9%8A%D9%84%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%AE%D8%AF%D9%85%20%D9%84%D9%84%D8%B9%D8%AB%D9%88%D8%B1%20%D8%B9%D9%84%D9%89%20%D8%A7%D9%84%D8%B1%D9%82%D9%85%20%D8%A7%D9%84%D8%A8%D8%B1%D9%8A%D8%AF%D9%8A%20%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF.pdf',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official GPS or structured-address lookup workflow; a pinned result may establish a point and code, not a postal surface, reusable bulk dataset or app licence.',
  },
  'egypt-post': {
    id: 'egypt-post',
    name: 'Egypt Post',
    url: 'https://www.egyptpost.org/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Exact Egypt Post product permission and terms must be pinned',
    notes: 'Official operator reference; only a pinned record validates its stated code or office, not geometry, building linkage or bulk licence.',
  },
  'capmas-egypt-gis': {
    id: 'capmas-egypt-gis',
    name: 'CAPMAS Egypt GIS services',
    url: 'https://capmas.gov.eg/Admin/Pages%20Files/20242714302%D8%AF%D9%84%D9%8A%D9%84%20%D8%A7%D9%84%D8%A7%D8%B5%D8%AF%D8%A7%D8%B1%D8%A7%D8%AA%20%D9%88%D8%A7%D9%84%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%202024.pdf',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Exact product terms must be pinned',
    notes: 'Official statistical, administrative and described building-level GIS services; service metadata is not postal geometry, an address-building relation or a product licence.',
  },
  'esa-egypt-geoportal': {
    id: 'esa-egypt-geoportal',
    name: 'Egyptian Survey Authority Geoportal',
    url: 'https://www.esa.gov.eg/geoportal.aspx',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Copyright and product-specific permission required',
    notes: 'National survey, cadastral and topographic context; portal visibility is not postal authority, explicit address-building linkage or redistribution permission.',
  },
  'egy-list': {
    id: 'egy-list',
    name: 'Egy.List',
    url: 'https://github.com/Badawy403/Egy.List',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    license: 'Dataset licence and Egypt Post provenance must be proven',
    notes: 'Community legacy candidate and discrepancy data only; it is not current Egypt Post authority, a seven-digit migration crosswalk or geometry evidence.',
  },
  'sapo-postcodes': {
    id: 'sapo-postcodes',
    name: 'South African Post Office Postal Codes',
    url: 'https://www.postoffice.co.za/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'Exact SAPO product permission and terms must be pinned',
    notes: 'Official postcode and delivery type validation reference; an exact product licence is required, and search output is not geometry or bulk reuse permission.',
  },
  'postafind-za': {
    id: 'postafind-za',
    name: 'PostaFind South Africa Postal Code Search',
    url: 'https://pcf.postafind.co.za/search',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    license: 'Terms and provenance must be pinned',
    notes: 'Third-party discrepancy and fallback search; it is not silently promoted to SAPO assignment authority or bulk redistribution permission.',
  },
  'british-overseas-postal-reference': {
    id: 'british-overseas-postal-reference',
    name: 'British Overseas Territories Postal Reference',
    url: 'https://www.royalmail.com/sending/international/country-guides',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Royal Mail destination guide reference for UK overseas territories using assigned territory postcodes.',
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
  'biot-gov': {
    id: 'biot-gov',
    name: 'British Indian Ocean Territory Administration',
    url: 'https://biot.gov.io/',
    kind: 'gazetteer',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Territory reference for Diego Garcia, BIOT place names, and restricted delivery handling.',
  },
  zampost: {
    id: 'zampost',
    name: 'Zambia Postal Services Corporation',
    url: 'https://www.zampost.com.zm/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'ZAMPOST website copyright; exact observation and redistribution terms must be pinned',
    notes: 'Official postal-operator and service context. The portal does not expose a rights-cleared complete current postcode assignment table, official postcode polygons, public address database, building crosswalk or stable bulk API.',
  },
  'zampost-locations': {
    id: 'zampost-locations',
    name: 'ZAMPOST locations and service-centre search',
    url: 'https://www.zampost.com.zm/index.php/locations',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'validation',
    license: 'Interactive operator directory; no bulk reuse right inferred',
    notes: 'The operator page supports search by city, province or postal code and distinguishes post offices, agency services and smart post boxes. A permitted successful result is a dated network observation only, not a complete assignment release, service boundary or delivery entitlement.',
  },
  'upu-zambia-addressing-2013': {
    id: 'upu-zambia-addressing-2013',
    name: 'UPU Zambia addressing sheet (January 2013)',
    url: 'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/zmbEn.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'UPU publication terms; Universal POST*CODE database rights are separate',
    notes: 'Dated five-digit formatting, routing hierarchy and examples for street, rural delivery, P.O. Box, private bag, Postnet agency and poste restante. It is not a current complete assignment database, postal geometry, customer-address release or blanket reuse right.',
  },
  'zicta-zambia-national-addressing-postcode': {
    id: 'zicta-zambia-national-addressing-postcode',
    name: 'ZICTA National Addressing and Postcode Project',
    url: 'https://www.zicta.zm/services/postal-courier-regulation/projects',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    license: 'Government project description; operational dataset terms remain source-specific',
    notes: 'The current regulator page describes a project with councils to give each property a deliverable address. It does not publish a nationwide operational address row set, stable property identifier, postcode directory, geometry artifact, public API or redistribution licence.',
  },
  'zambia-parliament-addressing-statement-2013': {
    id: 'zambia-parliament-addressing-statement-2013',
    name: 'Zambia National Assembly postal addressing statement (2013)',
    url: 'https://www.parliament.gov.zm/node/609',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Official parliamentary record; no operational database reuse right inferred',
    notes: 'The ministerial statement says 10101 was a proposal not representative of a particular location and describes a phased street, property-number, national-database and GIS project. It is dated legal and implementation context, not proof of current assignments or completion.',
  },
  'zambia-ecommerce-strategy-2023': {
    id: 'zambia-ecommerce-strategy-2023',
    name: 'Zambia National E-Commerce Strategy 2023',
    url: 'https://www.mcti.gov.zm/wp-content/uploads/2024/01/National-E-Commerce-Strategy-2023.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Government strategy publication; resulting address database terms are separate',
    notes: 'The strategy calls for street naming, property addresses, digital addresses and development of a national postcode. Planned outputs and targets do not prove current nationwide operational assignments, public rows, polygons or building links.',
  },
  'znsdi-zambia-policy-2026': {
    id: 'znsdi-zambia-policy-2026',
    name: 'Zambia National Spatial Data Infrastructure Policy 2026',
    url: 'https://www.szi.gov.zm/wp-content/uploads/2026/06/NSDI_Policy.pdf',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'Government policy; every geospatial dataset retains custodian-specific access and reuse terms',
    notes: 'The policy establishes custodian-led geodetic, topographic, administrative, parcel and imagery governance and protects sensitive data and sovereignty. Policy openness and portal software do not make every layer open, postal or an address-building crosswalk.',
  },
  'znsdi-zambia-cadastre-lots': {
    id: 'znsdi-zambia-cadastre-lots',
    name: 'ZNSDI / ZILMIS cadastral lots feature service',
    url: 'https://map.gov.zm/arcgis/rest/services/NSDI_Vector/CadasterNew/MapServer/0',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'validation',
    license: 'Dataset-specific; service metadata exposes no blanket redistribution licence',
    notes: 'The official service exposes polygon lots, plot identifiers, survey references and land-use fields. A queryable parcel is not a postcode polygon, public title record, building footprint or explicit national-address relation and requires exact permission, version, CRS, fields and privacy review.',
  },
  'zilas-zambia': {
    id: 'zilas-zambia',
    name: 'Zambia Integrated Lands Administration System',
    url: 'https://www.mlnr.gov.zm/',
    kind: 'address',
    coverage: 'country',
    usage: 'reference',
    license: 'Controlled government land services; access, property and reuse rights are service-specific',
    notes: 'The Ministry exposes land registration, survey, deeds and ZILAS service context. Portal access does not provide a reusable nationwide parcel-owner-title-address-postcode crosswalk or authorize publication of controlled records.',
  },
  'zambia-data-protection-act-2021': {
    id: 'zambia-data-protection-act-2021',
    name: 'Zambia Data Protection Act No. 3 of 2021',
    url: 'https://www.parliament.gov.zm/sites/default/files/documents/acts/Act%20No.%203%20The%20Data%20Protection%20Act%202021_0.pdf',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Zambian law and official parliamentary publication',
    notes: 'Personal-data processing requires lawful, explicit and limited purposes, accuracy, retention and security controls; cross-border transfers are conditional. The Act is governance evidence, not postal or geometry data.',
  },
  'dpc-zambia-location-data-guidance': {
    id: 'dpc-zambia-location-data-guidance',
    name: 'Zambia Data Protection Commission location-data guidance',
    url: 'https://www.dataprotection.gov.zm/faq/',
    kind: 'standard',
    coverage: 'country',
    usage: 'reference',
    license: 'Official regulatory guidance',
    notes: 'The Commission identifies location data as personal data and requires lawful, transparent, purpose-limited, minimized, accurate, retained and secured processing. Precise address, household, query and property relations therefore remain gated.',
  },
  'osm-zambia': {
    id: 'osm-zambia',
    name: 'OpenStreetMap Zambia community mapping',
    url: 'https://wiki.openstreetmap.org/wiki/WikiProject_Zambia',
    kind: 'address',
    coverage: 'country',
    usage: 'validation',
    license: 'ODbL 1.0 separate partition',
    notes: 'Community roads, localities, addresses and buildings remain a separately attributed ODbL partition. They are not ZAMPOST assignments, ZICTA national addresses, ZNSDI cadastre or exact delivery-building authority.',
  },
  zimpost: {
    id: 'zimpost',
    name: 'Zimbabwe Posts official portal',
    url: 'https://www.zimpost.co.zw/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Zimbabwe postal operator portal used as current postal-network evidence while public postcode search remains limited.',
  },
};

export const AFRICA_COUNTRY_CODES = [
  'AO',
  'BF',
  'BI',
  'BJ',
  'BW',
  'CD',
  'CF',
  'CG',
  'CI',
  'CM',
  'CV',
  'DJ',
  'DZ',
  'EG',
  'EH',
  'ER',
  'ET',
  'GA',
  'GH',
  'GM',
  'GN',
  'GQ',
  'GW',
  'KE',
  'KM',
  'LR',
  'LS',
  'LY',
  'MA',
  'MG',
  'ML',
  'MR',
  'MU',
  'MW',
  'MZ',
  'NA',
  'NE',
  'NG',
  'RW',
  'SC',
  'SD',
  'SL',
  'SN',
  'SO',
  'SS',
  'ST',
  'SZ',
  'TD',
  'TG',
  'TN',
  'TZ',
  'UG',
  'ZA',
  'ZM',
  'ZW',
] as const;

export type AfricaCountryCode = (typeof AFRICA_COUNTRY_CODES)[number];

const BASE_OPEN_SOURCE_IDS: AfricaOpenGeoSourceId[] = [
  'osm-nominatim',
  'osm-overpass',
  'openaddresses',
  'geonames-postal',
  'geonames-gazetteer',
  'geoboundaries',
  'upu-addressing',
  'hot-osm-africa',
  'openstreetmap-wiki-africa',
  'humdata-africa',
  'openaerialmap',
  'digital-earth-africa-dem',
  'digital-earth-africa-coastlines',
  'digital-earth-africa-waterbodies',
  'digital-earth-africa-wofs',
  'digital-earth-africa-fractional-cover',
  'digital-earth-africa-geomad',
  'fao-wapor',
  'esa-worldcover',
  'gebco-bathymetry',
  'gmrt-topography',
  'global-mangrove-watch',
  'allen-coral-atlas',
  'protected-planet-wdpa',
  'gbif-occurrence',
  'rcmrd-gmes-africa-geoportal',
];

const COUNTRY_POSTAL_SOURCE_IDS: Partial<Record<AfricaCountryCode, AfricaOpenGeoSourceId[]>> = {
  DZ: ['algerie-poste', 'algerie-poste-mobile-offices', 'algerie-poste-privacy', 'upu-algeria-addressing-2002', 'algeria-postal-addressing-regulation-2019', 'algeria-national-address-referential', 'algeria-local-authorities-directory', 'inct-algeria-digital-geodata', 'osm-algeria'],
  EG: ['upu-egypt-postal-addressing-2023', 'egypt-post-new-postcode-guide', 'egypt-post', 'capmas-egypt-gis', 'esa-egypt-geoportal', 'egy-list', 'datahub-postal'],
  LY: ['libya-post-services'],
  MA: ['upu-morocco-postcode-manual', 'poste-maroc-codepostal', 'morocco-open-data-postal', 'morocco-open-data-license', 'ancfcc-morocco-cartography', 'datahub-postal'],
  MR: ['mauripost'],
  NG: ['nipost-postcode', 'nipost-national-digital-postcode-2026', 'nipost-addressing-standard-2017', 'upu-nigeria-addressing-2022', 'npc-nigeria-ead-2023', 'fcta-nigeria-agis', 'ndpc-nigeria-data-protection-act-2023', 'ndpc-nigeria-gaid-2025', 'osm-nigeria', 'hot-osm-west-africa'],
  SD: ['sudapost'],
  TN: ['la-poste-tunisienne-codes', 'upu-tunisia-addressing-2014', 'tunisian-open-data-national-license', 'tunisian-open-data-delegations-2025', 'tunisian-open-data-governorates-2025', 'otc-tunisia-cadastral-geoportal', 'inpdp-tunisia-law-2004-63', 'la-poste-tunisienne-privacy', 'osm-tunisia'],
  GH: ['ghanapostgps', 'hot-osm-west-africa'],
  CI: ['la-poste-cote-divoire', 'hot-osm-west-africa'],
  BF: ['la-poste-burkina', 'hot-osm-west-africa'],
  GN: ['guinee-poste', 'hot-osm-west-africa'],
  ML: ['la-poste-mali', 'hot-osm-west-africa'],
  NE: ['niger-poste', 'hot-osm-west-africa'],
  SN: ['la-poste-senegal-codes', 'la-poste-senegal-po-box', 'upu-senegal-addressing-2015', 'artp-senegal-national-addressing-2015', 'geosenegal-basegeo', 'geosenegal-basegeo-license', 'geosenegal-urban-buildings-2019', 'dgid-senegal-nicad', 'senegal-data-protection-law-2008-12', 'osm-senegal', 'hot-osm-west-africa'],
  TG: ['societe-postes-togo', 'hot-osm-west-africa'],
  BJ: ['la-poste-benin', 'hot-osm-west-africa'],
  LR: ['mopt-liberia-postal-services', 'hot-osm-west-africa'],
  SL: ['salpost-sierra-leone', 'hot-osm-west-africa'],
  GM: ['gambia-post-services', 'hot-osm-west-africa'],
  GW: ['hot-osm-west-africa'],
  CV: ['correios-cabo-verde', 'correios-cabo-verde-contact-identifiers', 'correios-cabo-verde-cip', 'upu-cabo-verde-addressing-2014', 'upu-cabo-verde-postcode-length-2026', 'ingt-cabo-verde-idecv', 'ingt-cabo-verde-admin-feature-service', 'ingt-cabo-verde-cadastre', 'osm-cabo-verde', 'hot-osm-west-africa'],
  KM: ['snpsf-comores-poste', 'rcmrd-gmes-africa-geoportal', 'hot-osm-east-southern-africa'],
  KE: ['posta-kenya', 'posta-kenya-customer-service-charter-2022', 'posta-kenya-properties-2026', 'upu-kenya-addressing-2004', 'ca-kenya-national-addressing-system', 'kenya-national-addressing-policy-2023', 'survey-of-kenya-mapping-policy-2021', 'ardhisasa-kenya', 'odpc-kenya-address-location-privacy', 'osm-kenya', 'rcmrd-geoportal', 'kenya-open-data', 'hot-osm-east-southern-africa'],
  TZ: ['tcra-tanzania-postcodes', 'tcra-tanzania-postcode-plan-2026', 'tcra-tanzania-addressing', 'tanzania-postal-regulations-2018', 'nbs-tanzania-wards-2022', 'tcra-tanzania-napa', 'pdpc-tanzania-act-2022', 'pdpc-tanzania-enforcement-2026', 'osm-tanzania', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  UG: ['posta-uganda-physical-address', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  RW: ['rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  SO: ['somalia-moct-posta', 'somalia-moct-postal-revival-2025', 'somalia-national-postal-policy-2026', 'somalia-moct-digital-addressing', 'somalia-sobs-address-observation', 'somalia-sobs-cbca-jurisdiction', 'somalia-snbs-gis', 'somalia-nira-principles', 'somalia-nca-privacy', 'osm-somalia', 'rcmrd-gmes-africa-geoportal', 'hot-osm-east-southern-africa'],
  SS: ['south-sudan-nca-postal-sector', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  ET: ['ethiopost-branches', 'ethiopost-delivery-address-form', 'upu-ethiopia-addressing-2002', 'ethiopia-ssgi-edas', 'ethiopia-nsdi-geoportal', 'ethiopia-bishoftu-address-book', 'ethiopia-addis-land-registration-edas', 'osm-ethiopia', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  DJ: ['mcpt-djibouti-poste', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  MZ: ['correios-mocambique-codigos-postais', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  MW: ['malawi-postcodes-macra', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  ZM: ['zampost', 'zampost-locations', 'upu-zambia-addressing-2013', 'zicta-zambia-national-addressing-postcode', 'zambia-parliament-addressing-statement-2013', 'zambia-ecommerce-strategy-2023', 'znsdi-zambia-policy-2026', 'znsdi-zambia-cadastre-lots', 'zilas-zambia', 'zambia-data-protection-act-2021', 'dpc-zambia-location-data-guidance', 'osm-zambia', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  ZW: ['zimpost', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  BW: ['rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  NA: ['nampost-postal-codes', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  LS: ['rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  SC: ['seychelles-postal-regulator-nas', 'seychelles-statehouse-nas-2024', 'seychelles-finance-nas-2025', 'seychelles-statehouse-nas-bill-2026', 'seychelles-postal-regulator-operators', 'seychelles-nbs-gis', 'seychelles-lands-webgis', 'seychelles-webgis-disclaimer', 'seychelles-land-registration-act', 'seychelles-data-protection-act-2023', 'osm-seychelles', 'osm-seychelles-building-import', 'rcmrd-gmes-africa-geoportal'],
  SZ: ['rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  ZA: ['upu-south-africa-postal-addressing', 'sapo-postcodes', 'postafind-za', 'ngi-south-africa', 'stats-sa-geography', 'sasdi-south-africa', 'nspdr-south-africa-terms', 'hot-osm-east-southern-africa'],
};

export function getAfricaOpenSourceIds(countryCode: string): AfricaOpenGeoSourceId[] {
  const code = countryCode.toUpperCase() as AfricaCountryCode;
  return [...new Set([...(COUNTRY_POSTAL_SOURCE_IDS[code] ?? []), ...BASE_OPEN_SOURCE_IDS])];
}

export const AFRICA_COUNTRY_OPEN_SOURCE_IDS = AFRICA_COUNTRY_CODES.reduce(
  (sourcesByCountry, countryCode) => ({
    ...sourcesByCountry,
    [countryCode]: getAfricaOpenSourceIds(countryCode),
  }),
  {} as Record<AfricaCountryCode, AfricaOpenGeoSourceId[]>,
);
