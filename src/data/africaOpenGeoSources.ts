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
  | 'south-sudan-nca-postal-sector'
  | 'malawi-postcodes-macra'
  | 'posta-uganda-physical-address'
  | 'nampost-postal-codes'
  | 'seychelles-post-po-box-directory'
  | 'ghanapostgps'
  | 'nipost-postcode'
  | 'la-poste-cote-divoire'
  | 'correios-cabo-verde'
  | 'la-poste-benin'
  | 'la-poste-burkina'
  | 'gambia-post-services'
  | 'guinee-poste'
  | 'mopt-liberia-postal-services'
  | 'la-poste-senegal-codes'
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
    name: 'Postal Corporation of Kenya post offices',
    url: 'https://posta.co.ke/post-offices/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Postal Corporation of Kenya office locator and postal-service directory used as current postcode and post-office evidence.',
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
  'seychelles-post-po-box-directory': {
    id: 'seychelles-post-po-box-directory',
    name: 'Seychelles Post P.O. Box directory',
    url: 'https://www.seychelles-post.com/poboxdirectory.php',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Seychelles Postal Services directory search and postal-service reference for P.O. Box routing and operator contact details.',
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
    name: 'Nigerian Postal Service Postcode Finder',
    url: 'https://nipost.gov.ng/postcode-finder/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'NIPOST postcode finder and national addressing reference for Nigerian state, city, street, and postcode validation.',
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
    name: 'Correios de Cabo Verde postcode reference',
    url: 'https://correios.cv/faq',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Correios de Cabo Verde postcode reference and customer guidance, including public postcode examples and postcode-search instructions.',
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
    id: 'la-poste-senegal-codes',
    name: 'La Poste Senegal postcode directory',
    url: 'https://www.laposte.sn/code-postal-senegal/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official La Poste Senegal postcode directory and office locator for five-digit postal-code and delivery-office validation.',
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
    url: 'https://www.laposte.tn/codes.php',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Tunisian Post postcode search for locality and four-digit postal-code lookup.',
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
    usage: 'reference',
    notes: 'Official ZAMPOST operator portal and branch/service locator used as current postcode and postal-network evidence for Zambia.',
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
  NG: ['nipost-postcode', 'hot-osm-west-africa'],
  SD: ['sudapost'],
  TN: ['la-poste-tunisienne-codes'],
  GH: ['ghanapostgps', 'hot-osm-west-africa'],
  CI: ['la-poste-cote-divoire', 'hot-osm-west-africa'],
  BF: ['la-poste-burkina', 'hot-osm-west-africa'],
  GN: ['guinee-poste', 'hot-osm-west-africa'],
  ML: ['la-poste-mali', 'hot-osm-west-africa'],
  NE: ['niger-poste', 'hot-osm-west-africa'],
  SN: ['la-poste-senegal-codes', 'hot-osm-west-africa'],
  TG: ['societe-postes-togo', 'hot-osm-west-africa'],
  BJ: ['la-poste-benin', 'hot-osm-west-africa'],
  LR: ['mopt-liberia-postal-services', 'hot-osm-west-africa'],
  SL: ['salpost-sierra-leone', 'hot-osm-west-africa'],
  GM: ['gambia-post-services', 'hot-osm-west-africa'],
  GW: ['hot-osm-west-africa'],
  CV: ['correios-cabo-verde', 'hot-osm-west-africa'],
  KM: ['snpsf-comores-poste', 'rcmrd-gmes-africa-geoportal', 'hot-osm-east-southern-africa'],
  KE: ['posta-kenya', 'rcmrd-geoportal', 'kenya-open-data', 'hot-osm-east-southern-africa'],
  TZ: ['rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  UG: ['posta-uganda-physical-address', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  RW: ['rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  SO: ['somalia-moct-posta', 'rcmrd-gmes-africa-geoportal'],
  SS: ['south-sudan-nca-postal-sector', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  ET: ['ethiopost-branches', 'ethiopost-delivery-address-form', 'upu-ethiopia-addressing-2002', 'ethiopia-ssgi-edas', 'ethiopia-nsdi-geoportal', 'ethiopia-bishoftu-address-book', 'ethiopia-addis-land-registration-edas', 'osm-ethiopia', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  DJ: ['mcpt-djibouti-poste', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  MZ: ['correios-mocambique-codigos-postais', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  MW: ['malawi-postcodes-macra', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  ZM: ['zampost', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  ZW: ['zimpost', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  BW: ['rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  NA: ['nampost-postal-codes', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  LS: ['rcmrd-geoportal', 'hot-osm-east-southern-africa'],
  SC: ['seychelles-post-po-box-directory', 'rcmrd-gmes-africa-geoportal'],
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
