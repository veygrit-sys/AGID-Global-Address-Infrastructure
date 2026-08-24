import {
POLAR_OPEN_GEO_SOURCES,
getPolarOpenSourceIds,
type PolarOpenGeoSourceId,
} from './polarOpenGeoSources';

export type OceaniaOpenGeoSourceId =
  | PolarOpenGeoSourceId
  | 'osm-nominatim'
  | 'osm-overpass'
  | 'openaddresses'
  | 'geonames-postal'
  | 'geonames-gazetteer'
  | 'geoboundaries'
  | 'upu-addressing'
  | 'zippopotam'
  | 'jaxa-aw3d30'
  | 'gebco-bathymetry'
  | 'gmrt-topography'
  | 'hydrosheds'
  | 'esa-worldcover'
  | 'protected-planet-wdpa'
  | 'gbif-occurrence'
  | 'global-mangrove-watch'
  | 'allen-coral-atlas'
  | 'pacific-data-hub'
  | 'digital-earth-pacific'
  | 'pacioos'
  | 'digital-earth-australia-coastlines'
  | 'digital-earth-australia-wofs'
  | 'digital-earth-australia-fractional-cover'
  | 'geoscience-australia-elvis'
  | 'linz-data-service'
  | 'linz-elevation'
  | 'la-poste-fr-overseas'
  | 'data-gouv-fr-postcodes'
  | 'copernicus-dem'
  | 'copernicus-corine-land-cover'
  | 'emodnet-bathymetry'
  | 'emodnet-seabed-habitats'
  | 'eea-natura-2000'
  | 'eea-eunis-habitats'
  | 'jrc-esdac-soils'
  | 'auspost-postcode'
  | 'auspost-paf'
  | 'gnaf-au'
  | 'abs-au-postal-areas'
  | 'geoscape-au-buildings'
  | 'abs-au-boundaries'
  | 'auspost-territories'
  | 'linz-nz-addresses'
  | 'nz-post-postcode-network'
  | 'linz-nz-building-outlines'
  | 'stats-nz-geographic-boundaries'
  | 'nz-post-territories'
  | 'post-fiji'
  | 'post-png'
  | 'samoa-post'
  | 'tonga-post'
  | 'vanuatu-post'
  | 'solomon-post'
  | 'fsm-postal-service'
  | 'marshall-islands-postal-service'
  | 'palau-postal-service'
  | 'usps-pacific-territories'
  | 'kiribati-post'
  | 'tuvalu-post'
  | 'nauru-post'
  | 'british-overseas-postal-reference'
  | 'pitcairn-post';

export interface OceaniaOpenGeoSource {
  id: OceaniaOpenGeoSourceId;
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
    | 'elevation'
    | 'marine'
    | 'hydrology'
    | 'facility'
    | 'land-cover'
    | 'protected-area'
    | 'biodiversity'
    | 'coastline'
    | 'imagery'
    | 'oceanography'
    | 'data-catalog'
    | 'bathymetry'
    | 'cryosphere'
    | 'topography';
  coverage: 'global' | 'oceania' | 'country' | 'territory' | 'polar' | 'antarctic' | 'arctic' | 'greenland';
  usage: 'primary' | 'fallback' | 'validation' | 'reference';
  license?: string;
  notes: string;
}

export const OCEANIA_OPEN_GEO_SOURCES: Record<OceaniaOpenGeoSourceId, OceaniaOpenGeoSource> = {
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
    notes: 'Queryable OSM address tags, roads, settlements, islands, and administrative relations.',
  },
  openaddresses: {
    id: 'openaddresses',
    name: 'OpenAddresses',
    url: 'https://openaddresses.io/',
    kind: 'address',
    coverage: 'global',
    usage: 'validation',
    license: 'Varies by source dataset',
    notes: 'Open address point and street-address reference data where country or city coverage is available.',
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
    notes: 'Settlement names, alternate names, coordinates, island names, and administrative hierarchy reference.',
  },
  geoboundaries: {
    id: 'geoboundaries',
    name: 'geoBoundaries',
    url: 'https://www.geoboundaries.org/',
    kind: 'admin-boundary',
    coverage: 'global',
    usage: 'reference',
    license: 'CC BY 4.0',
    notes: 'Open administrative boundaries for states, provinces, districts, islands, and territories.',
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
  zippopotam: {
    id: 'zippopotam',
    name: 'Zippopotam.us',
    url: 'https://api.zippopotam.us/',
    kind: 'postal-code',
    coverage: 'global',
    usage: 'fallback',
    notes: 'Free postal-code lookup API useful for countries and territories with public coverage.',
  },
  'jaxa-aw3d30': {
    id: 'jaxa-aw3d30',
    name: 'JAXA ALOS World 3D - 30m',
    url: 'https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/index.htm',
    kind: 'elevation',
    coverage: 'global',
    usage: 'reference',
    license: 'JAXA AW3D30 terms of use',
    notes: 'Open 30m elevation and surface model for Pacific mountains, volcanic islands, ridges, valleys, and coastal terrain context.',
  },
  'gebco-bathymetry': {
    id: 'gebco-bathymetry',
    name: 'GEBCO Gridded Bathymetry',
    url: 'https://www.gebco.net/data_and_products/gridded_bathymetry_data/',
    kind: 'marine',
    coverage: 'global',
    usage: 'reference',
    license: 'GEBCO terms of use',
    notes: 'Global bathymetry and land elevation grid for Pacific seas, island shelves, trenches, channels, reefs, and offshore delivery context.',
  },
  'gmrt-topography': {
    id: 'gmrt-topography',
    name: 'Global Multi-Resolution Topography',
    url: 'https://www.gmrt.org/',
    kind: 'marine',
    coverage: 'global',
    usage: 'reference',
    license: 'GMRT terms of use',
    notes: 'Marine and coastal topography synthesis for Pacific ridges, seamounts, trenches, volcanic island arcs, and ocean floor context.',
  },
  hydrosheds: {
    id: 'hydrosheds',
    name: 'HydroSHEDS',
    url: 'https://www.hydrosheds.org/',
    kind: 'hydrology',
    coverage: 'global',
    usage: 'reference',
    license: 'Free for non-commercial use; check HydroSHEDS license for redistribution',
    notes: 'Hydrographic basins, streams, drainage, lakes, wetlands, and natural water context for Oceania islands and continental Australia.',
  },
  'esa-worldcover': {
    id: 'esa-worldcover',
    name: 'ESA WorldCover',
    url: 'https://esa-worldcover.org/en/data-access',
    kind: 'land-cover',
    coverage: 'global',
    usage: 'reference',
    license: 'Free and open data access',
    notes: '10 m land cover for Pacific forest, grassland, wetland, mangrove, cropland, bare ground, reef-island, and natural landscape labels.',
  },
  'protected-planet-wdpa': {
    id: 'protected-planet-wdpa',
    name: 'Protected Planet WDPA',
    url: 'https://www.protectedplanet.net/en/thematic-areas/wdpa',
    kind: 'protected-area',
    coverage: 'global',
    usage: 'reference',
    license: 'UNEP-WCMC and IUCN terms',
    notes: 'Protected terrestrial and marine areas for Pacific reserves, national parks, marine protected areas, lagoons, reefs, and conservation context.',
  },
  'gbif-occurrence': {
    id: 'gbif-occurrence',
    name: 'GBIF Occurrence API',
    url: 'https://techdocs.gbif.org/en/openapi/v1/occurrence',
    kind: 'biodiversity',
    coverage: 'global',
    usage: 'reference',
    license: 'Varies by dataset record',
    notes: 'Biodiversity occurrence evidence for Pacific habitats, endemic species, reefs, forests, wetlands, islands, and protected natural areas.',
  },
  'global-mangrove-watch': {
    id: 'global-mangrove-watch',
    name: 'Global Mangrove Watch',
    url: 'https://www.wetlands.org/coasts-and-deltas/global-mangrove-watch/',
    kind: 'land-cover',
    coverage: 'global',
    usage: 'reference',
    notes: 'Mangrove distribution and change monitoring for Pacific coasts, lagoons, estuaries, deltas, wetlands, and natural shoreline context.',
  },
  'allen-coral-atlas': {
    id: 'allen-coral-atlas',
    name: 'Allen Coral Atlas',
    url: 'https://www.allencoralatlas.org/atlas/',
    kind: 'marine',
    coverage: 'global',
    usage: 'reference',
    notes: 'Shallow coral reef habitat and geomorphic-zone mapping for Pacific reefs, lagoons, atolls, reef islands, and marine protected areas.',
  },
  'pacific-data-hub': {
    id: 'pacific-data-hub',
    name: 'Pacific Data Hub',
    url: 'https://pacificdata.org/',
    kind: 'gazetteer',
    coverage: 'oceania',
    usage: 'reference',
    notes: 'Official Pacific regional data hub with geospatial, environment, ocean, island, social, and natural resource datasets for Pacific Island countries.',
  },
  'digital-earth-pacific': {
    id: 'digital-earth-pacific',
    name: 'Digital Earth Pacific Data Access',
    url: 'https://digitalearthpacific.github.io/data-access/',
    kind: 'imagery',
    coverage: 'oceania',
    usage: 'reference',
    notes: 'Open Digital Earth Pacific data access for satellite-derived Pacific coastline, water, land, island, and natural hazard monitoring workflows.',
  },
  pacioos: {
    id: 'pacioos',
    name: 'Pacific Islands Ocean Observing System',
    url: 'https://www.pacioos.hawaii.edu/',
    kind: 'oceanography',
    coverage: 'oceania',
    usage: 'reference',
    notes: 'Pacific ocean data services for waves, currents, bathymetry, coastal waters, reefs, hazards, and marine natural context.',
  },
  'digital-earth-australia-coastlines': {
    id: 'digital-earth-australia-coastlines',
    name: 'Digital Earth Australia Coastlines',
    url: 'https://www.ga.gov.au/scientific-topics/dea/dea-data-and-products/dea-coastlines/faqs',
    kind: 'coastline',
    coverage: 'country',
    usage: 'reference',
    notes: 'Annual Australian coastline and coastal-change product for beaches, ports, islands, erosion, estuaries, and shoreline address context.',
  },
  'digital-earth-australia-wofs': {
    id: 'digital-earth-australia-wofs',
    name: 'Digital Earth Australia Water Observations',
    url: 'https://data.gov.au/data/dataset/dea-water-observations',
    kind: 'hydrology',
    coverage: 'country',
    usage: 'reference',
    notes: 'Surface water observations for floodplains, lakes, wetlands, rivers, reservoirs, coastal water edges, and Australian water-adjacent addresses.',
  },
  'digital-earth-australia-fractional-cover': {
    id: 'digital-earth-australia-fractional-cover',
    name: 'Digital Earth Australia Fractional Cover',
    url: 'https://www.ga.gov.au/scientific-topics/dea/dea-data-and-products/dea-fractional-cover',
    kind: 'land-cover',
    coverage: 'country',
    usage: 'reference',
    notes: 'Australian green vegetation, dry vegetation, and bare-ground cover for bushland, desert, grassland, farms, mountain foothills, and natural landscape context.',
  },
  'geoscience-australia-elvis': {
    id: 'geoscience-australia-elvis',
    name: 'Geoscience Australia ELVIS Elevation and Depth',
    url: 'https://www.ga.gov.au/scientific-topics/national-location-information/digital-elevation-data',
    kind: 'elevation',
    coverage: 'country',
    usage: 'reference',
    notes: 'Australian elevation and depth foundation data for mountain terrain, escarpments, coastal elevation, flood risk, and natural-address precision.',
  },
  'linz-data-service': {
    id: 'linz-data-service',
    name: 'LINZ Data Service',
    url: 'https://www.linz.govt.nz/products-services/data/linz-data-service',
    kind: 'gazetteer',
    coverage: 'country',
    usage: 'reference',
    license: 'CC BY 4.0 for many datasets; check dataset metadata',
    notes: 'New Zealand official land, seabed, topographic, hydrographic, address, imagery, and natural geography data service.',
  },
  'linz-elevation': {
    id: 'linz-elevation',
    name: 'LINZ Elevation Data',
    url: 'https://www.linz.govt.nz/products-services/data/types-linz-data/elevation-data/access-elevation-data',
    kind: 'elevation',
    coverage: 'country',
    usage: 'reference',
    license: 'CC BY 4.0 for many datasets; check dataset metadata',
    notes: 'New Zealand elevation datasets for mountains, volcanic terrain, valleys, coastal cliffs, islands, and natural route/address context.',
  },
  'la-poste-fr-overseas': {
    id: 'la-poste-fr-overseas',
    name: 'La Poste French Overseas Postal Reference',
    url: 'https://www.laposte.fr/outils/trouver-un-code-postal',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'primary',
    notes: 'French postal-code lookup for Pacific French overseas territories represented in Oceania metadata.',
  },
  'data-gouv-fr-postcodes': {
    id: 'data-gouv-fr-postcodes',
    name: 'France API Codes Postaux',
    url: 'https://www.data.gouv.fr/datasets/api-codes-postaux',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'primary',
    notes: 'French official open-data postal-code API and dataset for French Pacific territory validation where covered.',
  },
  'copernicus-dem': {
    id: 'copernicus-dem',
    name: 'Copernicus DEM',
    url: 'https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM.html',
    kind: 'elevation',
    coverage: 'territory',
    usage: 'reference',
    notes: 'European elevation reference retained for French Pacific territory metadata compatibility.',
  },
  'copernicus-corine-land-cover': {
    id: 'copernicus-corine-land-cover',
    name: 'Copernicus CORINE Land Cover',
    url: 'https://land.copernicus.eu/en/products/corine-land-cover',
    kind: 'land-cover',
    coverage: 'territory',
    usage: 'reference',
    notes: 'European land-cover reference retained for French overseas territory metadata compatibility.',
  },
  'emodnet-bathymetry': {
    id: 'emodnet-bathymetry',
    name: 'EMODnet Bathymetry',
    url: 'https://emodnet.ec.europa.eu/en/bathymetry',
    kind: 'marine',
    coverage: 'territory',
    usage: 'reference',
    notes: 'European marine bathymetry reference retained for overseas coastal and island metadata compatibility.',
  },
  'emodnet-seabed-habitats': {
    id: 'emodnet-seabed-habitats',
    name: 'EMODnet Seabed Habitats',
    url: 'https://emodnet.ec.europa.eu/en/seabed-habitats',
    kind: 'marine',
    coverage: 'territory',
    usage: 'reference',
    notes: 'European seabed habitat reference retained for overseas marine natural context compatibility.',
  },
  'eea-natura-2000': {
    id: 'eea-natura-2000',
    name: 'EEA Natura 2000 Protected Areas',
    url: 'https://www.eea.europa.eu/data-and-maps/data/natura-2',
    kind: 'protected-area',
    coverage: 'territory',
    usage: 'reference',
    notes: 'European protected-area reference retained for French overseas metadata validation.',
  },
  'eea-eunis-habitats': {
    id: 'eea-eunis-habitats',
    name: 'EEA EUNIS Habitat Classification',
    url: 'https://eunis.eea.europa.eu/habitats',
    kind: 'biodiversity',
    coverage: 'territory',
    usage: 'reference',
    notes: 'European habitat classification retained for overseas terrestrial, freshwater, and marine habitat context.',
  },
  'jrc-esdac-soils': {
    id: 'jrc-esdac-soils',
    name: 'JRC European Soil Data Centre',
    url: 'https://data.jrc.ec.europa.eu/collection/ESDAC',
    kind: 'land-cover',
    coverage: 'territory',
    usage: 'reference',
    notes: 'European soil and terrain source retained for overlapping French Pacific metadata validation.',
  },
  'auspost-postcode': {
    id: 'auspost-postcode',
    name: 'Australia Post Postcode Search',
    url: 'https://auspost.com.au/postcode',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Australia Post allocation lookup; a postcode record does not itself provide an authoritative postcode boundary.',
  },
  'auspost-paf': {
    id: 'auspost-paf',
    name: 'Australia Post Postal Address File',
    url: 'https://auspost.com.au/business/services/data-services/supporting-our-data-partners/resources-and-key-dates',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'Australia Post licensed PAF; contract rights govern use and redistribution',
    notes: 'Official licensed postal-address and DPID reference updated monthly; it is not a building-footprint source and no PAF row is bundled here.',
  },
  'gnaf-au': {
    id: 'gnaf-au',
    name: 'Geocoded National Address File (G-NAF)',
    url: 'https://www.data.gov.au/data/dataset/geocoded-national-address-file-g-naf',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'G-NAF EULA based on CC BY 4.0; secondary verification required for sending mail',
    notes: 'Official public address identities and geocodes; postcode is commonly locality-derived and the EULA requires secondary verification before using an address for mail.',
  },
  'abs-au-postal-areas': {
    id: 'abs-au-postal-areas',
    name: 'ABS ASGS Postal Areas',
    url: 'https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/non-abs-structures/postal-areas',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    license: 'ABS source-specific terms and attribution',
    notes: 'Official-derived Mesh Block approximation for statistics, not an Australia Post boundary; non-street-delivery codes are excluded and the ASGS edition must be pinned.',
  },
  'geoscape-au-buildings': {
    id: 'geoscape-au-buildings',
    name: 'Geoscape Buildings',
    url: 'https://docs.geoscape.com.au/projects/buildings_guide/en/stable/',
    kind: 'building',
    coverage: 'country',
    usage: 'primary',
    license: 'Geoscape commercial product; product-specific rights apply',
    notes: 'Licensed building geometry and building_address crosswalk; containment or nearest-footprint matching remains candidate evidence.',
  },
  'abs-au-boundaries': {
    id: 'abs-au-boundaries',
    name: 'ABS Australian Statistical Geography Standard boundaries',
    url: 'https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'ABS source-specific terms and attribution',
    notes: 'Official statistical and administrative context; state, LGA and locality geometry cannot create, clip or replace postcode assignment.',
  },
  'auspost-territories': {
    id: 'auspost-territories',
    name: 'Australia Post Territory Postal Reference',
    url: 'https://auspost.com.au/postcode',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'primary',
    notes: 'Australian external territory postcode reference for Norfolk Island, Christmas Island, Cocos Islands, and Antarctic routing.',
  },
  'nz-post-postcode-network': {
    id: 'nz-post-postcode-network',
    name: 'NZ Post Postcode Network File',
    url: 'https://www.nzpost.co.nz/business/sending-within-nz/quality-addressing/postcode-network-file',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    license: 'NZ Post licensed PNF; redistribution rights vary by licence',
    notes: 'Authoritative NZ Post postcode network with licensed urban and rural areas plus box-lobby references; not open bulk data.',
  },
  'linz-nz-addresses': {
    id: 'linz-nz-addresses',
    name: 'LINZ NZ Addresses',
    url: 'https://data.linz.govt.nz/layer/123113-nz-addresses/',
    kind: 'address',
    coverage: 'country',
    usage: 'primary',
    license: 'CC BY 4.0',
    notes: 'Official weekly New Zealand address and road data; point-position method must be retained and does not by itself prove NZ Post assignment or a building link.',
  },
  'linz-nz-building-outlines': {
    id: 'linz-nz-building-outlines',
    name: 'LINZ NZ Building Outlines',
    url: 'https://data.linz.govt.nz/layer/101290-nz-building-outlines/',
    kind: 'building',
    coverage: 'country',
    usage: 'primary',
    license: 'CC BY 4.0',
    notes: 'Official mapping roof outlines extracted from imagery; the dataset is not an exact address-to-building link or legal parcel boundary.',
  },
  'stats-nz-geographic-boundaries': {
    id: 'stats-nz-geographic-boundaries',
    name: 'Stats NZ Geographic Boundaries',
    url: 'https://www.stats.govt.nz/methods/geographic-hierarchy/',
    kind: 'admin-boundary',
    coverage: 'country',
    usage: 'reference',
    license: 'CC BY 4.0',
    notes: 'Official statistical and administrative geography context; these areas are not NZ Post postcode boundaries.',
  },
  'nz-post-territories': {
    id: 'nz-post-territories',
    name: 'New Zealand Post Territory Postal Reference',
    url: 'https://www.nzpost.co.nz/contact-support/international-delivery-updates',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Current NZ Post destination and delivery-status reference covering Cook Islands, Niue, Tokelau, and other South Pacific mail destinations handled through the NZ Post network.',
  },
  'post-fiji': {
    id: 'post-fiji',
    name: 'Post Fiji',
    url: 'https://www.postfiji.com.fj/PostFiji/service',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Post Fiji postal services reference with current delivery, tracking, and address-handling guidance.',
  },
  'post-png': {
    id: 'post-png',
    name: 'Post PNG',
    url: 'https://postpng-live.prontoavenue.biz/about',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Current Post PNG company page for the national postal operator, replacing the stale postpng.com.pg domain now serving unrelated content.',
  },
  'samoa-post': {
    id: 'samoa-post',
    name: 'Samoa Post',
    url: 'https://www.samoapost.ws/index.php/special-services/post-code-for-samoa',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Samoa Post postcode directory for village-level postal-code lookup.',
  },
  'tonga-post': {
    id: 'tonga-post',
    name: 'Tonga Post',
    url: 'https://tongapost.org/services/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Tonga Post services page with current mail, parcel, and national post-office coverage details.',
  },
  'vanuatu-post': {
    id: 'vanuatu-post',
    name: 'Vanuatu Post',
    url: 'https://www.vanuatupost.vu/index.php/services/postal-services/receiving-mail',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Vanuatu Post receiving-mail guidance covering delivery handling across the postal network.',
  },
  'solomon-post': {
    id: 'solomon-post',
    name: 'Solomon Post',
    url: 'https://www.mca.gov.sb/about-us/statutory-bodies/state-owned-enterprises/solomon-islands-postal-corporation-sipc.html',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Solomon Islands government reference for the Solomon Islands Postal Corporation (SIPC), the state-owned national postal operator.',
  },
  'fsm-postal-service': {
    id: 'fsm-postal-service',
    name: 'FSM Postal Service',
    url: 'https://post.gov.fm/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Federated States of Micronesia Postal Services site with current postal-service, location, and contact information for the national postal network.',
  },
  'marshall-islands-postal-service': {
    id: 'marshall-islands-postal-service',
    name: 'Marshall Islands Postal Service Authority',
    url: 'https://rmiparliament.org/cms/library/communications/58-2025-nitijela-session.html?download=831%3A2025-nitijela-communication-no-42-rmi-postal-service-faq-english-version',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Current official Marshall Islands Postal Service Authority FAQ published through the Nitijela site, documenting active postal operations, domestic ZIP handling, and public contact channels.',
  },
  'palau-postal-service': {
    id: 'palau-postal-service',
    name: 'Republic of Palau Postal Service',
    url: 'https://palaupost.pw/',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'primary',
    notes: 'Official Palau Post Office site with current postal-service notices, PO box information, and public service/contact pages for the national postal network.',
  },
  'usps-pacific-territories': {
    id: 'usps-pacific-territories',
    name: 'USPS Pacific Island ZIP Code Reference',
    url: 'https://tools.usps.com/go/ZipLookupAction_input',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'validation',
    notes: 'USPS ZIP Code lookup used as secondary validation for freely associated Pacific states and US-handled Pacific mail routes.',
  },
  'kiribati-post': {
    id: 'kiribati-post',
    name: 'Kiribati Post',
    url: 'https://www.kiribati.gov.ki/services/postal',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Official Kiribati government postal-services page covering ordinary mail, parcel post, EMS, and POSMO postal operations; pair with current UPU guidance for the KI plus 4-digit island postcode scheme.',
  },
  'tuvalu-post': {
    id: 'tuvalu-post',
    name: 'Tuvalu Post',
    url: 'https://stamp.tuvalupost.tv/contact',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Officially endorsed Tuvalu Post Limited contact page with current postal-operator contact details and opening hours.',
  },
  'nauru-post': {
    id: 'nauru-post',
    name: 'Nauru Post',
    url: 'https://www.naurupost.com.nr/nauru-postal-services',
    kind: 'postal-code',
    coverage: 'country',
    usage: 'reference',
    notes: 'Current Naoero Postal Services Corporation postal-services page under the live naurupost.com.nr domain; international mail uses the single country postcode NRU68.',
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
  'pitcairn-post': {
    id: 'pitcairn-post',
    name: 'Pitcairn Islands Post Office',
    url: 'https://www.visitpitcairn.pn/activities',
    kind: 'postal-code',
    coverage: 'territory',
    usage: 'reference',
    notes: 'Current Pitcairn Islands government tourism page documenting the Pitcairn Island Post Office, mail routing via New Zealand, and local post-office operations.',
  },
};

export const OCEANIA_COUNTRY_AND_TERRITORY_CODES = [
  'AU', 'NZ', 'FJ', 'PG', 'WS', 'TO', 'VU', 'SB', 'FM', 'PW',
  'MH', 'KI', 'TV', 'NR', 'NF', 'CX', 'CC', 'AQ', 'CK', 'TK',
  'NU', 'PN', 'NC', 'PF', 'WF',
] as const;

export type OceaniaCountryOrTerritoryCode = (typeof OCEANIA_COUNTRY_AND_TERRITORY_CODES)[number];

const BASE_OPEN_SOURCE_IDS: OceaniaOpenGeoSourceId[] = [
  'osm-nominatim',
  'osm-overpass',
  'openaddresses',
  'geonames-postal',
  'geonames-gazetteer',
  'geoboundaries',
  'upu-addressing',
  'zippopotam',
  'jaxa-aw3d30',
  'gebco-bathymetry',
  'gmrt-topography',
  'hydrosheds',
  'esa-worldcover',
  'protected-planet-wdpa',
  'gbif-occurrence',
  'global-mangrove-watch',
  'allen-coral-atlas',
  'pacific-data-hub',
  'digital-earth-pacific',
  'pacioos',
];

const COUNTRY_SOURCE_IDS: Partial<Record<OceaniaCountryOrTerritoryCode, OceaniaOpenGeoSourceId[]>> = {
  AU: [
    'auspost-postcode',
    'digital-earth-australia-coastlines',
    'auspost-paf',
    'gnaf-au',
    'abs-au-postal-areas',
    'geoscape-au-buildings',
    'abs-au-boundaries',
    'digital-earth-australia-wofs',
    'digital-earth-australia-fractional-cover',
    'geoscience-australia-elvis',
  ],
  NZ: ['nz-post-postcode-network', 'linz-nz-addresses', 'linz-nz-building-outlines', 'stats-nz-geographic-boundaries', 'linz-data-service', 'linz-elevation'],
  FJ: ['post-fiji'],
  PG: ['post-png'],
  WS: ['samoa-post'],
  TO: ['tonga-post'],
  VU: ['vanuatu-post'],
  SB: ['solomon-post'],
  FM: ['fsm-postal-service'],
  PW: ['palau-postal-service', 'usps-pacific-territories'],
  MH: ['marshall-islands-postal-service'],
  KI: ['kiribati-post'],
  TV: ['tuvalu-post'],
  NR: ['nauru-post'],
  NF: ['auspost-territories'],
  CX: ['auspost-territories'],
  CC: ['auspost-territories'],
  AQ: ['auspost-territories', ...getPolarOpenSourceIds('AQ')],
  CK: ['nz-post-territories'],
  TK: ['nz-post-territories'],
  NU: ['nz-post-territories'],
  PN: ['british-overseas-postal-reference', 'pitcairn-post'],
  NC: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  PF: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
  WF: ['la-poste-fr-overseas', 'data-gouv-fr-postcodes'],
};

export function getOceaniaOpenSourceIds(countryCode: string): OceaniaOpenGeoSourceId[] {
  const code = countryCode.toUpperCase() as OceaniaCountryOrTerritoryCode;
  return [...new Set([...(COUNTRY_SOURCE_IDS[code] ?? []), ...BASE_OPEN_SOURCE_IDS])];
}

export const OCEANIA_COUNTRY_OPEN_SOURCE_IDS = OCEANIA_COUNTRY_AND_TERRITORY_CODES.reduce(
  (sourcesByCountry, countryCode) => ({
    ...sourcesByCountry,
    [countryCode]: getOceaniaOpenSourceIds(countryCode),
  }),
  {} as Record<OceaniaCountryOrTerritoryCode, OceaniaOpenGeoSourceId[]>,
);
