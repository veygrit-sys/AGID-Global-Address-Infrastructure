import {
  TOPOGRAPHIC_FORMAT_DEFINITIONS,
  type TopographicCoverage,
  type TopographicLayerId,
  type TopographicSourceRecord,
} from './topographicExport';

export const GLOBAL_TOPOGRAPHIC_OPEN_SOURCE_STACK_VERSION =
  'agid-global-topographic-open-source-stack-v0.1';

export type GlobalTopographicOpenSourceId =
  | 'overture-2026-07-22'
  | 'openstreetmap-weekly-planet'
  | 'microsoft-global-ml-buildings'
  | 'google-open-buildings-v3'
  | 'google-open-buildings-temporal-v1'
  | 'openlandmap-gedtm30-v1'
  | 'copernicus-lcfm-lcm10-v1'
  | 'esa-worldcover-2021-v200'
  | 'jrc-global-surface-water-v1-5'
  | 'ghsl-p2023a'
  | 'natural-earth'
  | 'nasa-nasadem-hgt-v1'
  | 'usgs-landsat-collection-2'
  | 'copernicus-sentinel-2-l2a';

export type OpenDataLicenseMode = 'permissive' | 'reciprocal' | 'public-domain';
export type OpenSourceRole = 'primary' | 'corroboration' | 'fallback' | 'validation-only';

export type GlobalTopographicOpenSource = {
  id: GlobalTopographicOpenSourceId;
  publisher: string;
  product: string;
  sourceUrl: string;
  accessUrl: string;
  termsUrl: string;
  correctionUrl: string;
  license: {
    id: string;
    mode: OpenDataLicenseMode;
    attributionRequired: boolean;
    shareAlikeDatabase: boolean;
  };
  version:
    | {
        strategy: 'fixed';
        id: string;
        publishedAt: string;
        resolverUrl: string;
      }
    | {
        strategy: 'rolling';
        id: string;
        resolverUrl: string;
      };
  checkedAt: string;
  coverage: string;
  crs: string[];
  nativeResolutionMeters?: {
    nominal: number;
    detail: string;
  };
  accessMethod:
    | 'cloud-parquet'
    | 'planet-pbf'
    | 'partition-manifest'
    | 'cloud-geojson'
    | 'cloud-raster'
    | 'stac-cog'
    | 'direct-download';
  role: OpenSourceRole;
  priority: number;
  maxSnapshotAgeDays: number;
  exportLayerIds: TopographicLayerId[];
  validationLayerIds: TopographicLayerId[];
  attribution: string;
  limitations: string[];
};

const CHECKED_AT = '2026-07-26';

export const GLOBAL_TOPOGRAPHIC_OPEN_SOURCES: Record<
  GlobalTopographicOpenSourceId,
  GlobalTopographicOpenSource
> = {
  'overture-2026-07-22': {
    id: 'overture-2026-07-22',
    publisher: 'Overture Maps Foundation',
    product: 'Overture Maps base, buildings, divisions, and transportation themes',
    sourceUrl: 'https://docs.overturemaps.org/',
    accessUrl: 'https://docs.overturemaps.org/getting-data/',
    termsUrl: 'https://docs.overturemaps.org/attribution/',
    correctionUrl: 'https://github.com/OvertureMaps/data/issues',
    license: {
      id: 'ODbL-1.0',
      mode: 'reciprocal',
      attributionRequired: true,
      shareAlikeDatabase: true,
    },
    version: {
      strategy: 'fixed',
      id: '2026-07-22.0',
      publishedAt: '2026-07-22T00:00:00.000Z',
      resolverUrl: 'https://docs.overturemaps.org/release-calendar/',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Global, partitioned by Overture theme and release.',
    crs: ['OGC:CRS84'],
    accessMethod: 'cloud-parquet',
    role: 'primary',
    priority: 10,
    maxSnapshotAgeDays: 45,
    exportLayerIds: [
      'buildings',
      'roads',
      'railways',
      'waterways',
      'trees-green-spaces',
    ],
    validationLayerIds: [],
    attribution: 'OpenStreetMap contributors, Overture Maps Foundation, and declared upstream sources.',
    limitations: [
      'Theme-level and feature-level upstream attribution must be preserved.',
      'A release is not treated as current after its freshness window without a new snapshot.',
    ],
  },
  'openstreetmap-weekly-planet': {
    id: 'openstreetmap-weekly-planet',
    publisher: 'OpenStreetMap Foundation and contributors',
    product: 'OpenStreetMap weekly planet PBF',
    sourceUrl: 'https://planet.openstreetmap.org/',
    accessUrl: 'https://planet.openstreetmap.org/pbf/planet-latest.osm.pbf',
    termsUrl: 'https://www.openstreetmap.org/copyright',
    correctionUrl: 'https://www.openstreetmap.org/fixthemap',
    license: {
      id: 'ODbL-1.0',
      mode: 'reciprocal',
      attributionRequired: true,
      shareAlikeDatabase: true,
    },
    version: {
      strategy: 'rolling',
      id: 'weekly-planet',
      resolverUrl: 'https://planet.openstreetmap.org/',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Global community-maintained map database.',
    crs: ['EPSG:4326'],
    accessMethod: 'planet-pbf',
    role: 'corroboration',
    priority: 20,
    maxSnapshotAgeDays: 14,
    exportLayerIds: [
      'buildings',
      'roads',
      'railways',
      'waterways',
      'trees-green-spaces',
    ],
    validationLayerIds: [],
    attribution: 'OpenStreetMap contributors.',
    limitations: [
      'Completeness and tagging consistency vary by place.',
      'Bulk ingestion must use planet or regional extracts rather than public editing or tile APIs.',
    ],
  },
  'microsoft-global-ml-buildings': {
    id: 'microsoft-global-ml-buildings',
    publisher: 'Microsoft',
    product: 'Global ML Building Footprints',
    sourceUrl: 'https://github.com/microsoft/GlobalMLBuildingFootprints',
    accessUrl: 'https://minedbuildings.z5.web.core.windows.net/global-buildings/dataset-links.csv',
    termsUrl: 'https://cdla.dev/permissive-2-0/',
    correctionUrl: 'https://github.com/microsoft/GlobalMLBuildingFootprints/issues',
    license: {
      id: 'CDLA-Permissive-2.0',
      mode: 'permissive',
      attributionRequired: false,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'fixed',
      id: 'dataset-links-2024-08-28',
      publishedAt: '2024-08-28T00:00:00.000Z',
      resolverUrl: 'https://github.com/microsoft/GlobalMLBuildingFootprints',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Worldwide published coverage partitions; coverage and source imagery vintage vary.',
    crs: ['EPSG:4326'],
    accessMethod: 'partition-manifest',
    role: 'corroboration',
    priority: 30,
    maxSnapshotAgeDays: 1095,
    exportLayerIds: ['buildings'],
    validationLayerIds: [],
    attribution: 'Microsoft Global ML Building Footprints.',
    limitations: [
      'Model quality varies between rural, urban, mountain, and plain environments.',
      'Partition manifest and source imagery vintage must be retained with each snapshot.',
    ],
  },
  'google-open-buildings-v3': {
    id: 'google-open-buildings-v3',
    publisher: 'Google Research',
    product: 'Open Buildings V3 polygons',
    sourceUrl:
      'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings_v3_polygons',
    accessUrl:
      'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings_v3_polygons',
    termsUrl:
      'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings_v3_polygons#terms-of-use',
    correctionUrl:
      'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings_v3_polygons',
    license: {
      id: 'CC-BY-4.0',
      mode: 'permissive',
      attributionRequired: true,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'fixed',
      id: 'v3-2023-05-30',
      publishedAt: '2023-05-30T00:00:00.000Z',
      resolverUrl:
        'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings_v3_polygons',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Africa, Latin America, Caribbean, South Asia, and Southeast Asia.',
    crs: ['EPSG:4326'],
    nativeResolutionMeters: {
      nominal: 0.5,
      detail: 'Footprints inferred from approximately 50 cm imagery; not a positional-accuracy claim.',
    },
    accessMethod: 'cloud-geojson',
    role: 'corroboration',
    priority: 25,
    maxSnapshotAgeDays: 1825,
    exportLayerIds: ['buildings'],
    validationLayerIds: [],
    attribution: 'Google Research Open Buildings.',
    limitations: [
      'Coverage is regional rather than global.',
      'Confidence is model output and must not be interpreted as delivery-point verification.',
    ],
  },
  'google-open-buildings-temporal-v1': {
    id: 'google-open-buildings-temporal-v1',
    publisher: 'Google Research',
    product: 'Open Buildings 2.5D Temporal V1',
    sourceUrl:
      'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings-temporal_v1',
    accessUrl:
      'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings-temporal_v1',
    termsUrl:
      'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings-temporal_v1#terms-of-use',
    correctionUrl:
      'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings-temporal_v1',
    license: {
      id: 'CC-BY-4.0',
      mode: 'permissive',
      attributionRequired: true,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'fixed',
      id: 'v1-2016-2023',
      publishedAt: '2023-06-30T00:00:00.000Z',
      resolverUrl:
        'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings-temporal_v1',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Africa, South Asia, Southeast Asia, Latin America, and Caribbean.',
    crs: ['UTM zones', 'S2 cells'],
    nativeResolutionMeters: {
      nominal: 4,
      detail: 'Effective spatial resolution for annual presence, count, and height signals.',
    },
    accessMethod: 'cloud-raster',
    role: 'validation-only',
    priority: 35,
    maxSnapshotAgeDays: 1825,
    exportLayerIds: [],
    validationLayerIds: ['buildings', 'building-roofs-lod2', 'building-shadows'],
    attribution: 'Google Research Open Buildings; contains modified Copernicus Sentinel-2 data.',
    limitations: [
      'Height and presence are raster estimates, not individual authoritative building models.',
      'Model confidence is uncalibrated and is suitable only for ranking and holdout checks.',
    ],
  },
  'openlandmap-gedtm30-v1': {
    id: 'openlandmap-gedtm30-v1',
    publisher: 'OpenGeoHub Foundation and OpenLandMap contributors',
    product: 'GEDTM30 global ensemble digital terrain model',
    sourceUrl: 'https://github.com/openlandmap/GEDTM30',
    accessUrl: 'https://stac.openlandmap.org/gedtm-30m/collection.json',
    termsUrl: 'https://doi.org/10.5281/zenodo.14900180',
    correctionUrl: 'https://github.com/openlandmap/GEDTM30/issues',
    license: {
      id: 'CC-BY-4.0',
      mode: 'permissive',
      attributionRequired: true,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'fixed',
      id: 'GEDTM30-v1.0',
      publishedAt: '2025-07-24T00:00:00.000Z',
      resolverUrl: 'https://doi.org/10.5281/zenodo.14900180',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Global land terrain, approximately 1 arc-second grid spacing.',
    crs: ['EPSG:4326', 'Equi7'],
    nativeResolutionMeters: {
      nominal: 30,
      detail: 'Global ensemble DTM at approximately 30 m grid spacing.',
    },
    accessMethod: 'stac-cog',
    role: 'primary',
    priority: 10,
    maxSnapshotAgeDays: 1825,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    attribution: 'OpenGeoHub GEDTM30 contributors and declared upstream elevation sources.',
    limitations: [
      'Underlying elevation observations represent roughly 2006-2015.',
      'Known water-body and regional artifacts must be masked or flagged during ingestion.',
    ],
  },
  'copernicus-lcfm-lcm10-v1': {
    id: 'copernicus-lcfm-lcm10-v1',
    publisher: 'Copernicus Land Monitoring Service',
    product: 'LCFM global 10 m Land Cover Map',
    sourceUrl:
      'https://land.copernicus.eu/en/products/global-dynamic-land-cover/land-cover-2020-raster-10-m-global-annual',
    accessUrl:
      'https://documentation.dataspace.copernicus.eu/Data/ComplementaryData/CLMS.html#global-dynamic-land-cover',
    termsUrl:
      'https://land.copernicus.eu/en/products/global-dynamic-land-cover/land-cover-2020-raster-10-m-global-annual',
    correctionUrl: 'https://land.copernicus.eu/en/contact-service-helpdesk',
    license: {
      id: 'CC-BY-4.0',
      mode: 'permissive',
      attributionRequired: true,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'fixed',
      id: 'LCFM-LCM10-V100-2020',
      publishedAt: '2025-06-11T00:00:00.000Z',
      resolverUrl:
        'https://land.copernicus.eu/en/products/global-dynamic-land-cover/land-cover-2020-raster-10-m-global-annual',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Global land coverage from 60 degrees south to 82.75 degrees north.',
    crs: ['EPSG:4326'],
    nativeResolutionMeters: {
      nominal: 10,
      detail: 'Global categorical land cover in 3 by 3 degree COG tiles.',
    },
    accessMethod: 'stac-cog',
    role: 'primary',
    priority: 10,
    maxSnapshotAgeDays: 1095,
    exportLayerIds: ['trees-green-spaces', 'trees-hedges'],
    validationLayerIds: ['waterways', 'buildings'],
    attribution: 'LCFM project 2020; contains modified Copernicus Sentinel data processed by the LCFM consortium.',
    limitations: [
      'The current fixed release represents the 2020 reference year.',
      'Categorical land cover does not identify individual trees, hedges, or delivery entrances.',
    ],
  },
  'esa-worldcover-2021-v200': {
    id: 'esa-worldcover-2021-v200',
    publisher: 'ESA WorldCover consortium',
    product: 'ESA WorldCover 10 m 2021',
    sourceUrl: 'https://esa-worldcover.org/en/data-access',
    accessUrl: 'https://registry.opendata.aws/esa-worldcover/',
    termsUrl: 'https://esa-worldcover.org/en/data-access#license',
    correctionUrl: 'https://esa-worldcover.org/en/contact',
    license: {
      id: 'CC-BY-4.0',
      mode: 'permissive',
      attributionRequired: true,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'fixed',
      id: 'WorldCover-2021-v200',
      publishedAt: '2022-01-01T00:00:00.000Z',
      resolverUrl: 'https://doi.org/10.5281/zenodo.7254221',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Global 3 by 3 degree land-cover tiles.',
    crs: ['EPSG:4326'],
    nativeResolutionMeters: {
      nominal: 10,
      detail: 'Eleven-class global land-cover map.',
    },
    accessMethod: 'cloud-raster',
    role: 'corroboration',
    priority: 20,
    maxSnapshotAgeDays: 1825,
    exportLayerIds: ['trees-green-spaces', 'trees-hedges'],
    validationLayerIds: ['waterways', 'buildings'],
    attribution: 'ESA WorldCover project 2021; contains modified Copernicus Sentinel data.',
    limitations: [
      'The 2020 and 2021 products use different algorithms and are not direct change maps.',
      'Use LCFM as the operational successor while retaining WorldCover for independent corroboration.',
    ],
  },
  'jrc-global-surface-water-v1-5': {
    id: 'jrc-global-surface-water-v1-5',
    publisher: 'European Commission Joint Research Centre and Google',
    product: 'Global Surface Water 1984-2024',
    sourceUrl: 'https://global-surface-water.appspot.com/download',
    accessUrl: 'https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GSWE/',
    termsUrl: 'https://global-surface-water.appspot.com/download',
    correctionUrl: 'https://global-surface-water.appspot.com/download',
    license: {
      id: 'Copernicus-free-use',
      mode: 'permissive',
      attributionRequired: true,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'fixed',
      id: 'GSW-v1.5-1984-2024',
      publishedAt: '2025-01-01T00:00:00.000Z',
      resolverUrl: 'https://global-surface-water.appspot.com/download',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Global surface-water occurrence, recurrence, seasonality, transitions, and extent.',
    crs: ['EPSG:4326'],
    nativeResolutionMeters: {
      nominal: 30,
      detail: 'Landsat-derived global water history.',
    },
    accessMethod: 'cloud-raster',
    role: 'validation-only',
    priority: 15,
    maxSnapshotAgeDays: 730,
    exportLayerIds: [],
    validationLayerIds: ['waterways'],
    attribution: 'Source: EC JRC/Google.',
    limitations: [
      'Raster water occurrence is corroboration, not an authoritative named waterway network.',
      'Collection transitions after 2021 can introduce co-registration artifacts.',
    ],
  },
  'ghsl-p2023a': {
    id: 'ghsl-p2023a',
    publisher: 'European Commission Joint Research Centre',
    product: 'Global Human Settlement Layer P2023A',
    sourceUrl: 'https://human-settlement.emergency.copernicus.eu/datasets.php',
    accessUrl: 'https://human-settlement.emergency.copernicus.eu/datasets.php',
    termsUrl: 'https://human-settlement.emergency.copernicus.eu/GHSLhowToCite.php',
    correctionUrl: 'https://human-settlement.emergency.copernicus.eu/GHSLhowToCite.php',
    license: {
      id: 'CC-BY-4.0',
      mode: 'permissive',
      attributionRequired: true,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'fixed',
      id: 'P2023A',
      publishedAt: '2023-01-01T00:00:00.000Z',
      resolverUrl: 'https://human-settlement.emergency.copernicus.eu/datasets.php',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Global built-up surface, settlement characteristics, height, and volume rasters.',
    crs: ['Mollweide', 'EPSG:4326 product-dependent'],
    nativeResolutionMeters: {
      nominal: 10,
      detail: 'Best available built-up surface product resolution; other GHSL layers are coarser.',
    },
    accessMethod: 'direct-download',
    role: 'validation-only',
    priority: 40,
    maxSnapshotAgeDays: 1825,
    exportLayerIds: [],
    validationLayerIds: ['buildings', 'building-roofs-lod2'],
    attribution: 'European Commission, Joint Research Centre, GHSL release-specific citation.',
    limitations: [
      'The product-specific citation is required in addition to generic GHSL attribution.',
      'Aggregated built-up signals cannot prove an individual building or delivery point.',
    ],
  },
  'natural-earth': {
    id: 'natural-earth',
    publisher: 'Natural Earth contributors',
    product: 'Natural Earth vector and raster map data',
    sourceUrl: 'https://www.naturalearthdata.com/downloads/',
    accessUrl: 'https://www.naturalearthdata.com/downloads/',
    termsUrl: 'https://www.naturalearthdata.com/about/terms-of-use/',
    correctionUrl: 'https://github.com/nvkelso/natural-earth-vector/issues',
    license: {
      id: 'Public-Domain',
      mode: 'public-domain',
      attributionRequired: false,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'rolling',
      id: 'current-release',
      resolverUrl: 'https://www.naturalearthdata.com/downloads/',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Global small-scale reference data at 1:10m, 1:50m, and 1:110m.',
    crs: ['EPSG:4326'],
    accessMethod: 'direct-download',
    role: 'validation-only',
    priority: 80,
    maxSnapshotAgeDays: 730,
    exportLayerIds: [],
    validationLayerIds: ['roads', 'railways', 'waterways'],
    attribution: 'Made with Natural Earth.',
    limitations: [
      'Small-scale cartographic data is unsuitable for parcel, building, or delivery-level geometry.',
      'Use only for global sanity checks and low-zoom context.',
    ],
  },
  'nasa-nasadem-hgt-v1': {
    id: 'nasa-nasadem-hgt-v1',
    publisher: 'NASA LP DAAC',
    product: 'NASADEM Merged DEM Global 1 arc second',
    sourceUrl: 'https://www.earthdata.nasa.gov/data/instruments/srtm',
    accessUrl: 'https://search.earthdata.nasa.gov/search?q=NASADEM_HGT',
    termsUrl:
      'https://www.earthdata.nasa.gov/engage/open-data-services-and-software/data-and-information-policy',
    correctionUrl: 'https://www.earthdata.nasa.gov/contact',
    license: {
      id: 'NASA-open-data',
      mode: 'public-domain',
      attributionRequired: true,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'fixed',
      id: 'NASADEM_HGT.001',
      publishedAt: '2020-02-13T00:00:00.000Z',
      resolverUrl: 'https://search.earthdata.nasa.gov/search?q=NASADEM_HGT',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Near-global SRTM land coverage, approximately 60 north to 56 south.',
    crs: ['EPSG:4326'],
    nativeResolutionMeters: {
      nominal: 30,
      detail: 'One arc-second elevation grid.',
    },
    accessMethod: 'direct-download',
    role: 'corroboration',
    priority: 20,
    maxSnapshotAgeDays: 3650,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    attribution: 'NASA EOSDIS Land Processes DAAC, NASADEM_HGT.001.',
    limitations: [
      'Coverage excludes high northern and southern latitudes.',
      'Radar-derived elevation needs void, water, canopy, and built-surface quality flags.',
    ],
  },
  'usgs-landsat-collection-2': {
    id: 'usgs-landsat-collection-2',
    publisher: 'United States Geological Survey',
    product: 'Landsat Collection 2 Level-2',
    sourceUrl: 'https://www.usgs.gov/landsat-missions/landsat-collection-2',
    accessUrl: 'https://landsatlook.usgs.gov/stac-server',
    termsUrl: 'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
    correctionUrl: 'https://www.usgs.gov/landsat-missions/landsat-contact-us',
    license: {
      id: 'US-Public-Domain',
      mode: 'public-domain',
      attributionRequired: true,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'rolling',
      id: 'Collection-2-Level-2',
      resolverUrl: 'https://landsatlook.usgs.gov/stac-server',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Near-global Landsat archive.',
    crs: ['UTM zones', 'Polar stereographic'],
    nativeResolutionMeters: {
      nominal: 30,
      detail: 'Most multispectral bands; product-specific resolutions vary.',
    },
    accessMethod: 'stac-cog',
    role: 'corroboration',
    priority: 20,
    maxSnapshotAgeDays: 45,
    exportLayerIds: ['satellite-imagery'],
    validationLayerIds: ['waterways', 'trees-green-spaces'],
    attribution: 'U.S. Geological Survey Landsat.',
    limitations: [
      'Cloud, shadow, snow, and acquisition-time quality masks are mandatory.',
      'Imagery validates context but does not prove an address or delivery entrance.',
    ],
  },
  'copernicus-sentinel-2-l2a': {
    id: 'copernicus-sentinel-2-l2a',
    publisher: 'European Union Copernicus Programme',
    product: 'Sentinel-2 Level-2A',
    sourceUrl: 'https://dataspace.copernicus.eu/explore-data/data-collections/sentinel-data/sentinel-2',
    accessUrl: 'https://stac.dataspace.copernicus.eu/v1/',
    termsUrl: 'https://dataspace.copernicus.eu/terms-and-conditions',
    correctionUrl: 'https://helpcenter.dataspace.copernicus.eu/hc/en-gb/requests/new',
    license: {
      id: 'Copernicus-Sentinel-open-data',
      mode: 'permissive',
      attributionRequired: true,
      shareAlikeDatabase: false,
    },
    version: {
      strategy: 'rolling',
      id: 'Sentinel-2-L2A',
      resolverUrl: 'https://stac.dataspace.copernicus.eu/v1/',
    },
    checkedAt: CHECKED_AT,
    coverage: 'Global land and coastal observation archive.',
    crs: ['UTM zones'],
    nativeResolutionMeters: {
      nominal: 10,
      detail: 'Visible and near-infrared bands; other bands are 20 m or 60 m.',
    },
    accessMethod: 'stac-cog',
    role: 'primary',
    priority: 10,
    maxSnapshotAgeDays: 30,
    exportLayerIds: ['satellite-imagery'],
    validationLayerIds: ['waterways', 'trees-green-spaces', 'buildings'],
    attribution: 'Contains modified Copernicus Sentinel data.',
    limitations: [
      'Cloud and atmospheric quality screening is mandatory.',
      'Public data access terms and feature-level provenance must be archived with each snapshot.',
    ],
  },
};

export const GLOBAL_TOPOGRAPHIC_OPEN_SOURCE_IDS = Object.freeze(
  Object.keys(GLOBAL_TOPOGRAPHIC_OPEN_SOURCES) as GlobalTopographicOpenSourceId[],
);

export type GlobalTopographicSourceAuditIssue = {
  sourceId: GlobalTopographicOpenSourceId;
  field: string;
  message: string;
};

export function auditGlobalTopographicOpenSources(): GlobalTopographicSourceAuditIssue[] {
  const issues: GlobalTopographicSourceAuditIssue[] = [];

  for (const source of Object.values(GLOBAL_TOPOGRAPHIC_OPEN_SOURCES)) {
    const urls: Array<[string, string]> = [
      ['sourceUrl', source.sourceUrl],
      ['accessUrl', source.accessUrl],
      ['termsUrl', source.termsUrl],
      ['correctionUrl', source.correctionUrl],
      ['version.resolverUrl', source.version.resolverUrl],
    ];

    for (const [field, value] of urls) {
      if (!value.startsWith('https://')) {
        issues.push({
          sourceId: source.id,
          field,
          message: `${field} must be an HTTPS primary or provider-controlled URL.`,
        });
      }
    }

    if (!source.license.id.trim()) {
      issues.push({ sourceId: source.id, field: 'license.id', message: 'License identifier is required.' });
    }
    if (source.license.attributionRequired && !source.attribution.trim()) {
      issues.push({ sourceId: source.id, field: 'attribution', message: 'Required attribution is missing.' });
    }
    if (source.version.strategy === 'fixed' && !Number.isFinite(Date.parse(source.version.publishedAt))) {
      issues.push({
        sourceId: source.id,
        field: 'version.publishedAt',
        message: 'Fixed releases require an ISO publication timestamp.',
      });
    }
    if (source.exportLayerIds.length === 0 && source.validationLayerIds.length === 0) {
      issues.push({
        sourceId: source.id,
        field: 'layers',
        message: 'At least one export or validation layer is required.',
      });
    }
    if (source.nativeResolutionMeters && source.nativeResolutionMeters.nominal <= 0) {
      issues.push({
        sourceId: source.id,
        field: 'nativeResolutionMeters.nominal',
        message: 'Nominal resolution must be positive.',
      });
    }
    if (!Number.isInteger(source.maxSnapshotAgeDays) || source.maxSnapshotAgeDays <= 0) {
      issues.push({
        sourceId: source.id,
        field: 'maxSnapshotAgeDays',
        message: 'Snapshot age must be a positive integer.',
      });
    }
  }

  return issues;
}

export type GlobalTopographicLayerFusion = {
  layerId: TopographicLayerId;
  state: 'corroborated' | 'single-source' | 'gap';
  exportSourceIds: GlobalTopographicOpenSourceId[];
  validationSourceIds: GlobalTopographicOpenSourceId[];
  preferredSourceId?: GlobalTopographicOpenSourceId;
};

export type GlobalTopographicFusionPlan = {
  stackVersion: string;
  state: 'catalog-ready' | 'catalog-gaps';
  layers: GlobalTopographicLayerFusion[];
  sourceIds: GlobalTopographicOpenSourceId[];
  nonClaims: string[];
};

export function buildGlobalTopographicFusionPlan(
  layerIds: readonly TopographicLayerId[],
): GlobalTopographicFusionPlan {
  const layers = [...new Set(layerIds)].map<GlobalTopographicLayerFusion>(layerId => {
    const exportSources = Object.values(GLOBAL_TOPOGRAPHIC_OPEN_SOURCES)
      .filter(source => source.exportLayerIds.includes(layerId))
      .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
    const validationSources = Object.values(GLOBAL_TOPOGRAPHIC_OPEN_SOURCES)
      .filter(source => source.validationLayerIds.includes(layerId))
      .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
    const corroboratorCount = exportSources.length + validationSources.length;

    return {
      layerId,
      state:
        exportSources.length === 0
          ? 'gap'
          : corroboratorCount >= 2
            ? 'corroborated'
            : 'single-source',
      exportSourceIds: exportSources.map(source => source.id),
      validationSourceIds: validationSources.map(source => source.id),
      preferredSourceId: exportSources[0]?.id,
    };
  });
  const sourceIds = [...new Set(
    layers.flatMap(layer => [...layer.exportSourceIds, ...layer.validationSourceIds]),
  )];

  return {
    stackVersion: GLOBAL_TOPOGRAPHIC_OPEN_SOURCE_STACK_VERSION,
    state: layers.some(layer => layer.state === 'gap') ? 'catalog-gaps' : 'catalog-ready',
    layers,
    sourceIds,
    nonClaims: [
      'Catalog coverage does not prove that a source snapshot has been downloaded or verified.',
      'Model-derived buildings, heights, land cover, and water signals are not delivery-point evidence.',
      'Source-backed export remains blocked until versioned snapshot evidence and an adapter are verified.',
    ],
  };
}

export type GlobalTopographicSnapshotEvidence = {
  sourceId: GlobalTopographicOpenSourceId;
  versionId: string;
  publishedAt: string;
  retrievedAt: string;
  verifiedAt: string;
  sha256: `sha256:${string}`;
  adapterVersion: string;
  featureCount: number;
  coverage: TopographicCoverage;
  licenseEvidenceUrl: string;
  horizontalCrs: string;
  verticalDatum: string;
};

function requireIsoTimestamp(field: string, value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
}

export function promoteGlobalTopographicSnapshot(
  evidence: GlobalTopographicSnapshotEvidence,
): TopographicSourceRecord {
  const source = GLOBAL_TOPOGRAPHIC_OPEN_SOURCES[evidence.sourceId];

  if (!source) throw new Error(`Unknown global topographic source: ${evidence.sourceId}`);
  if (source.exportLayerIds.length === 0) {
    throw new Error(`${source.id} is validation-only and cannot back an export.`);
  }
  if (source.version.strategy === 'fixed' && evidence.versionId !== source.version.id) {
    throw new Error(
      `${source.id} requires version ${source.version.id}; received ${evidence.versionId}.`,
    );
  }
  if (source.version.strategy === 'rolling' && evidence.versionId === source.version.id) {
    throw new Error(`${source.id} rolling snapshots require a resolved immutable version identifier.`);
  }
  if (!/^sha256:[a-f0-9]{64}$/i.test(evidence.sha256)) {
    throw new Error(`${source.id} snapshot requires a sha256 content digest.`);
  }
  if (!evidence.adapterVersion.trim()) {
    throw new Error(`${source.id} snapshot requires an ingestion adapter version.`);
  }
  if (!Number.isInteger(evidence.featureCount) || evidence.featureCount < 0) {
    throw new Error(`${source.id} featureCount must be a non-negative integer.`);
  }
  if (!evidence.licenseEvidenceUrl.startsWith('https://')) {
    throw new Error(`${source.id} snapshot requires an HTTPS license evidence URL.`);
  }
  if (!evidence.horizontalCrs.trim()) {
    throw new Error(`${source.id} snapshot requires an explicit horizontal CRS.`);
  }
  if (!evidence.verticalDatum.trim()) {
    throw new Error(
      `${source.id} snapshot requires an explicit vertical datum or not-applicable marker.`,
    );
  }

  requireIsoTimestamp('publishedAt', evidence.publishedAt);
  requireIsoTimestamp('retrievedAt', evidence.retrievedAt);
  requireIsoTimestamp('verifiedAt', evidence.verifiedAt);

  const freshUntil = new Date(
    Date.parse(evidence.retrievedAt) + source.maxSnapshotAgeDays * 86_400_000,
  ).toISOString();
  const allowedFormats = TOPOGRAPHIC_FORMAT_DEFINITIONS
    .filter(format => format.supportedLayers.some(layerId => source.exportLayerIds.includes(layerId)))
    .map(format => format.id);

  return {
    sourceId: source.id,
    publisher: source.publisher,
    product: source.product,
    sourceUrl: source.sourceUrl,
    termsUrl: evidence.licenseEvidenceUrl,
    licenseId: source.license.id,
    version: evidence.versionId,
    publishedAt: evidence.publishedAt,
    retrievedAt: evidence.retrievedAt,
    freshUntil,
    attribution: source.attribution,
    correctionUrl: source.correctionUrl,
    coverage: evidence.coverage,
    layerIds: [...source.exportLayerIds],
    allowedFormats,
    reuseStatus: 'approved',
    snapshotEvidence: {
      contentSha256: evidence.sha256,
      adapterVersion: evidence.adapterVersion,
      verifiedAt: evidence.verifiedAt,
      horizontalCrs: evidence.horizontalCrs,
      verticalDatum: evidence.verticalDatum,
    },
    notes: [
      `Catalog stack: ${GLOBAL_TOPOGRAPHIC_OPEN_SOURCE_STACK_VERSION}.`,
      `Snapshot digest: ${evidence.sha256}.`,
      `Adapter: ${evidence.adapterVersion}.`,
      `Verified at: ${evidence.verifiedAt}.`,
      `Feature count: ${evidence.featureCount}.`,
      ...source.limitations,
    ],
  };
}
