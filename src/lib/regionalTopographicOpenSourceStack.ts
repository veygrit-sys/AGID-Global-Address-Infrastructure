import {
  TOPOGRAPHIC_FORMAT_DEFINITIONS,
  type TopographicBounds,
  type TopographicCoverage,
  type TopographicExportFormat,
  type TopographicLayerId,
  type TopographicSourceRecord,
} from './topographicExport';
import {
  buildGlobalTopographicFusionPlan,
  type GlobalTopographicFusionPlan,
  type GlobalTopographicOpenSourceId,
  type OpenDataLicenseMode,
  type OpenSourceRole,
} from './globalTopographicOpenSourceStack';
import { COUNTRY_REGIONS, LAND_REGIONS, type GeoRegion } from './regions';

export const REGIONAL_TOPOGRAPHIC_OPEN_SOURCE_STACK_VERSION =
  'agid-regional-topographic-open-source-stack-v0.1';

export type TopographicRegionId =
  | 'global'
  | 'africa'
  | 'asia'
  | 'europe'
  | 'north-america'
  | 'south-america'
  | 'oceania'
  | 'antarctica'
  | 'arctic'
  | 'ocean';

export type TopographicSurface = 'land' | 'ocean' | 'coastal';

export type RegionalTopographicOpenSourceId =
  | 'copernicus-dem-glo30'
  | 'gebco-2025'
  | 'noaa-etopo-2022'
  | 'digital-earth-africa-srtm'
  | 'digital-earth-africa-coastlines'
  | 'jaxa-aw3d30'
  | 'gsi-japan-dem'
  | 'emodnet-bathymetry'
  | 'usgs-3dep'
  | 'nrcan-hrdem'
  | 'ga-elvis'
  | 'linz-elevation'
  | 'rema-antarctica'
  | 'arcticdem';

export type RegionalCatalogReference = {
  catalog: 'africa' | 'asia' | 'europe' | 'oceania' | 'americas' | 'polar';
  sourceId: string;
};

export type RegionalTopographicOpenSource = {
  id: RegionalTopographicOpenSourceId;
  publisher: string;
  product: string;
  sourceUrl: string;
  accessUrl: string;
  termsUrl: string;
  correctionUrl: string;
  regions: TopographicRegionId[];
  countryCodes?: string[];
  coverage: string;
  dataKind: 'elevation-raster' | 'bathymetry-raster' | 'coastline-vector';
  accessMethod:
    | 'stac-cog'
    | 'authenticated-catalog'
    | 'ogc-services'
    | 'provider-catalog'
    | 'direct-download';
  license: {
    id: string;
    mode: OpenDataLicenseMode;
    evidence: 'verified-provider-terms' | 'dataset-specific-evidence-required';
    attributionRequired: boolean;
    navigationUseAllowed: boolean;
  };
  version:
    | { strategy: 'fixed'; id: string; resolverUrl: string }
    | { strategy: 'rolling'; id: string; resolverUrl: string };
  checkedAt: string;
  crs: string[];
  verticalDatum: string;
  nativeResolutionMeters: {
    nominal: number;
    detail: string;
  };
  role: OpenSourceRole;
  priority: number;
  maxSnapshotAgeDays: number;
  exportLayerIds: TopographicLayerId[];
  validationLayerIds: TopographicLayerId[];
  transformations: RegionalTopographicTransformation[];
  catalogReferences: RegionalCatalogReference[];
  attribution: string;
  limitations: string[];
};

export type RegionalTopographicTransformation =
  | 'clip-aoi'
  | 'reproject-target-crs'
  | 'normalize-vertical-datum'
  | 'derive-contours'
  | 'triangulate-tin'
  | 'repair-coastline-topology'
  | 'apply-coastline-breakline'
  | 'generate-mesh-lods';

const CHECKED_AT = '2026-07-27';

export const REGIONAL_TOPOGRAPHIC_OPEN_SOURCES: Record<
  RegionalTopographicOpenSourceId,
  RegionalTopographicOpenSource
> = {
  'copernicus-dem-glo30': {
    id: 'copernicus-dem-glo30',
    publisher: 'European Union Copernicus Programme',
    product: 'Copernicus DEM GLO-30',
    sourceUrl:
      'https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM',
    accessUrl: 'https://dataspace.copernicus.eu/explore-data',
    termsUrl: 'https://dataspace.copernicus.eu/terms-and-conditions',
    correctionUrl: 'https://helpcenter.dataspace.copernicus.eu/hc/en-gb/requests/new',
    regions: ['global'],
    coverage: 'Global land surface, including islands represented by the provider collection.',
    dataKind: 'elevation-raster',
    accessMethod: 'authenticated-catalog',
    license: {
      id: 'Copernicus-DEM-provider-terms',
      mode: 'permissive',
      evidence: 'verified-provider-terms',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: 'COP-DEM_GLO-30-DGED',
      resolverUrl:
        'https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM',
    },
    checkedAt: CHECKED_AT,
    crs: ['EPSG:4326'],
    verticalDatum: 'EGM2008',
    nativeResolutionMeters: {
      nominal: 30,
      detail: 'Nominal GLO-30 grid spacing; local effective accuracy varies.',
    },
    role: 'primary',
    priority: 30,
    maxSnapshotAgeDays: 730,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'generate-mesh-lods',
    ],
    catalogReferences: [
      { catalog: 'europe', sourceId: 'copernicus-dem' },
      { catalog: 'oceania', sourceId: 'copernicus-dem' },
    ],
    attribution: 'Produced using Copernicus WorldDEM-30 data and published Copernicus notices.',
    limitations: [
      'Provider access category and license acceptance must be rechecked at acquisition time.',
      'A global elevation model is not evidence of an entrance or delivery point.',
    ],
  },
  'gebco-2025': {
    id: 'gebco-2025',
    publisher: 'GEBCO Compilation Group',
    product: 'GEBCO_2025 Grid and Type Identifier Grid',
    sourceUrl: 'https://www.gebco.net/data_and_products/gridded_bathymetry_data/',
    accessUrl: 'https://download.gebco.net/',
    termsUrl: 'https://www.gebco.net/data-products/gridded-bathymetry/terms-of-use',
    correctionUrl: 'https://www.gebco.net/about_us/contact_us/',
    regions: ['global', 'ocean'],
    coverage: 'Global ocean and land relief grid.',
    dataKind: 'bathymetry-raster',
    accessMethod: 'provider-catalog',
    license: {
      id: 'GEBCO-public-domain-terms',
      mode: 'public-domain',
      evidence: 'verified-provider-terms',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'fixed',
      id: 'GEBCO_2025',
      resolverUrl: 'https://www.gebco.net/data_and_products/gridded_bathymetry_data/',
    },
    checkedAt: CHECKED_AT,
    crs: ['EPSG:4326'],
    verticalDatum: 'sea-level reference documented by GEBCO',
    nativeResolutionMeters: {
      nominal: 463,
      detail: '15 arc-second grid; metre spacing varies with latitude.',
    },
    role: 'primary',
    priority: 20,
    maxSnapshotAgeDays: 730,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'apply-coastline-breakline',
      'generate-mesh-lods',
    ],
    catalogReferences: [
      { catalog: 'africa', sourceId: 'gebco-bathymetry' },
      { catalog: 'asia', sourceId: 'gebco-bathymetry' },
      { catalog: 'oceania', sourceId: 'gebco-bathymetry' },
    ],
    attribution: 'GEBCO Compilation Group (2025) GEBCO_2025 Grid.',
    limitations: [
      'GEBCO explicitly disclaims use for navigation or safety at sea.',
      'Type Identifier data must remain linked to derived bathymetric mesh cells.',
    ],
  },
  'noaa-etopo-2022': {
    id: 'noaa-etopo-2022',
    publisher: 'NOAA National Centers for Environmental Information',
    product: 'ETOPO 2022 Global Relief Model',
    sourceUrl: 'https://www.ncei.noaa.gov/products/etopo-global-relief-model',
    accessUrl: 'https://www.ncei.noaa.gov/products/etopo-global-relief-model',
    termsUrl: 'https://www.noaa.gov/disclaimer',
    correctionUrl: 'https://www.ncei.noaa.gov/contact',
    regions: ['global', 'ocean'],
    coverage: 'Global integrated topography, bathymetry, and shoreline.',
    dataKind: 'bathymetry-raster',
    accessMethod: 'direct-download',
    license: {
      id: 'US-public-domain',
      mode: 'public-domain',
      evidence: 'verified-provider-terms',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'fixed',
      id: 'ETOPO_2022_v1',
      resolverUrl: 'https://www.ncei.noaa.gov/products/etopo-global-relief-model',
    },
    checkedAt: CHECKED_AT,
    crs: ['EPSG:4326'],
    verticalDatum: 'dataset-defined geoid or sea-level reference',
    nativeResolutionMeters: {
      nominal: 463,
      detail: '15 arc-second grid; metre spacing varies with latitude.',
    },
    role: 'corroboration',
    priority: 40,
    maxSnapshotAgeDays: 1825,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'apply-coastline-breakline',
    ],
    catalogReferences: [{ catalog: 'americas', sourceId: 'noaa-etopo' }],
    attribution: 'NOAA/NCEI ETOPO 2022 Global Relief Model.',
    limitations: [
      'Resolution is suitable for regional context, not entrance-scale geometry.',
      'Vertical-reference variants must not be mixed without explicit conversion.',
    ],
  },
  'digital-earth-africa-srtm': {
    id: 'digital-earth-africa-srtm',
    publisher: 'Digital Earth Africa',
    product: 'SRTM Digital Elevation Model',
    sourceUrl: 'https://docs.digitalearthafrica.org/en/latest/data_specs/SRTM_DEM_specs.html',
    accessUrl: 'https://explorer.digitalearth.africa/products/srtm_dem/measurements',
    termsUrl: 'https://docs.digitalearthafrica.org/en/latest/about/licensing.html',
    correctionUrl: 'https://github.com/digitalearthafrica/deafrica-docs/issues',
    regions: ['africa'],
    coverage: 'Africa land surface in the Digital Earth Africa service area.',
    dataKind: 'elevation-raster',
    accessMethod: 'stac-cog',
    license: {
      id: 'DE-Africa-upstream-SRTM-terms',
      mode: 'public-domain',
      evidence: 'dataset-specific-evidence-required',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: 'srtm_dem',
      resolverUrl: 'https://explorer.digitalearth.africa/products/srtm_dem',
    },
    checkedAt: CHECKED_AT,
    crs: ['EPSG:4326'],
    verticalDatum: 'EGM96',
    nativeResolutionMeters: {
      nominal: 30,
      detail: 'One arc-second SRTM elevation coverage.',
    },
    role: 'primary',
    priority: 10,
    maxSnapshotAgeDays: 730,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'generate-mesh-lods',
    ],
    catalogReferences: [{ catalog: 'africa', sourceId: 'digital-earth-africa-dem' }],
    attribution: 'Digital Earth Africa and the declared SRTM upstream source.',
    limitations: ['Void filling, provenance, and upstream reuse terms must be retained per snapshot.'],
  },
  'digital-earth-africa-coastlines': {
    id: 'digital-earth-africa-coastlines',
    publisher: 'Digital Earth Africa',
    product: 'Africa Coastlines',
    sourceUrl: 'https://docs.digitalearthafrica.org/en/latest/data_specs/Coastlines_specs.html',
    accessUrl: 'https://explorer.digitalearth.africa/products',
    termsUrl: 'https://docs.digitalearthafrica.org/en/latest/about/licensing.html',
    correctionUrl: 'https://github.com/digitalearthafrica/deafrica-coastlines/issues',
    regions: ['africa', 'ocean'],
    coverage: 'Annual shoreline positions and coastal change for Africa.',
    dataKind: 'coastline-vector',
    accessMethod: 'provider-catalog',
    license: {
      id: 'DE-Africa-dataset-terms',
      mode: 'permissive',
      evidence: 'dataset-specific-evidence-required',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: 'deafrica-coastlines',
      resolverUrl: 'https://docs.digitalearthafrica.org/en/latest/data_specs/Coastlines_specs.html',
    },
    checkedAt: CHECKED_AT,
    crs: ['EPSG:4326'],
    verticalDatum: 'not-applicable-vector-shoreline',
    nativeResolutionMeters: {
      nominal: 30,
      detail: 'Shoreline is derived from Landsat-scale observations.',
    },
    role: 'primary',
    priority: 10,
    maxSnapshotAgeDays: 730,
    exportLayerIds: ['waterways'],
    validationLayerIds: ['terrain-mesh'],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'repair-coastline-topology',
      'apply-coastline-breakline',
    ],
    catalogReferences: [{ catalog: 'africa', sourceId: 'digital-earth-africa-coastlines' }],
    attribution: 'Digital Earth Africa Coastlines and declared upstream observations.',
    limitations: ['Shoreline epoch and uncertainty must remain attached to derived breaklines.'],
  },
  'jaxa-aw3d30': {
    id: 'jaxa-aw3d30',
    publisher: 'Japan Aerospace Exploration Agency',
    product: 'ALOS World 3D 30 meter mesh',
    sourceUrl: 'https://www.eorc.jaxa.jp/ALOS/en/aw3d30/',
    accessUrl: 'https://www.eorc.jaxa.jp/ALOS/en/aw3d30/data/index.htm',
    termsUrl: 'https://earth.jaxa.jp/en/data/policy/',
    correctionUrl: 'https://www.eorc.jaxa.jp/ALOS/en/aw3d30/contact.htm',
    regions: ['global'],
    coverage: 'Global land digital surface model.',
    dataKind: 'elevation-raster',
    accessMethod: 'direct-download',
    license: {
      id: 'JAXA-AW3D30-terms',
      mode: 'permissive',
      evidence: 'dataset-specific-evidence-required',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: 'AW3D30',
      resolverUrl: 'https://www.eorc.jaxa.jp/ALOS/en/aw3d30/',
    },
    checkedAt: CHECKED_AT,
    crs: ['EPSG:4326'],
    verticalDatum: 'EGM96',
    nativeResolutionMeters: {
      nominal: 30,
      detail: 'Approximately one arc-second digital surface model.',
    },
    role: 'corroboration',
    priority: 50,
    maxSnapshotAgeDays: 1095,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
    ],
    catalogReferences: [{ catalog: 'asia', sourceId: 'jaxa-aw3d30' }],
    attribution: 'JAXA ALOS World 3D (AW3D30).',
    limitations: ['This is a surface model; vegetation and structures may affect derived terrain.'],
  },
  'gsi-japan-dem': {
    id: 'gsi-japan-dem',
    publisher: 'Geospatial Information Authority of Japan',
    product: 'GSI elevation tiles',
    sourceUrl: 'https://maps.gsi.go.jp/development/demtile.html',
    accessUrl: 'https://maps.gsi.go.jp/development/ichiran.html',
    termsUrl: 'https://www.gsi.go.jp/ENGLISH/page_e30086.html',
    correctionUrl: 'https://www.gsi.go.jp/ENGLISH/contact.html',
    regions: ['asia'],
    countryCodes: ['JP'],
    coverage: 'Japan; resolution and source class vary by tile.',
    dataKind: 'elevation-raster',
    accessMethod: 'provider-catalog',
    license: {
      id: 'GSI-content-terms',
      mode: 'permissive',
      evidence: 'dataset-specific-evidence-required',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: 'gsi-dem-tiles',
      resolverUrl: 'https://maps.gsi.go.jp/development/ichiran.html',
    },
    checkedAt: CHECKED_AT,
    crs: ['EPSG:4326', 'EPSG:3857'],
    verticalDatum: 'Japanese geodetic vertical reference; tile-class specific',
    nativeResolutionMeters: {
      nominal: 5,
      detail: 'Nominal high-resolution class; 10 m and other classes also occur.',
    },
    role: 'primary',
    priority: 5,
    maxSnapshotAgeDays: 365,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'generate-mesh-lods',
    ],
    catalogReferences: [{ catalog: 'asia', sourceId: 'gsi-dem' }],
    attribution: 'Geospatial Information Authority of Japan.',
    limitations: [
      'Tile source class, update date, and terms evidence must be recorded per snapshot.',
      'Nominal 5 m coverage must not be assumed for every tile.',
    ],
  },
  'emodnet-bathymetry': {
    id: 'emodnet-bathymetry',
    publisher: 'European Marine Observation and Data Network',
    product: 'EMODnet Digital Terrain Model',
    sourceUrl: 'https://emodnet.ec.europa.eu/en/bathymetry',
    accessUrl: 'https://emodnet.ec.europa.eu/geoviewer/',
    termsUrl:
      'https://emodnet.ec.europa.eu/en/terms-use-emodnet-online-services-data-and-data-products',
    correctionUrl: 'https://emodnet.ec.europa.eu/en/contact-us',
    regions: ['europe', 'ocean'],
    coverage: 'European seas with provider-declared source and quality layers.',
    dataKind: 'bathymetry-raster',
    accessMethod: 'ogc-services',
    license: {
      id: 'CC-BY-4.0',
      mode: 'permissive',
      evidence: 'verified-provider-terms',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: 'emodnet-bathymetry-dtm',
      resolverUrl: 'https://emodnet.ec.europa.eu/en/bathymetry',
    },
    checkedAt: CHECKED_AT,
    crs: ['EPSG:4326', 'provider OGC CRS list'],
    verticalDatum: 'source-cell-specific; consult DTM quality layers',
    nativeResolutionMeters: {
      nominal: 115,
      detail: 'Nominal central European latitude spacing; local DTMs may be finer.',
    },
    role: 'primary',
    priority: 10,
    maxSnapshotAgeDays: 730,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'apply-coastline-breakline',
      'generate-mesh-lods',
    ],
    catalogReferences: [
      { catalog: 'europe', sourceId: 'emodnet-bathymetry' },
      { catalog: 'oceania', sourceId: 'emodnet-bathymetry' },
    ],
    attribution: 'EMODnet Bathymetry and the source surveys declared by its quality layers.',
    limitations: ['Not for navigation; source survey and quality metadata must be retained.'],
  },
  'usgs-3dep': {
    id: 'usgs-3dep',
    publisher: 'U.S. Geological Survey',
    product: '3D Elevation Program products and services',
    sourceUrl: 'https://www.usgs.gov/3d-elevation-program/about-3dep-products-services',
    accessUrl: 'https://apps.nationalmap.gov/downloader/',
    termsUrl: 'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
    correctionUrl: 'https://www.usgs.gov/3d-elevation-program/contact-us',
    regions: ['north-america'],
    countryCodes: ['US'],
    coverage: 'United States and declared territories; product resolution varies.',
    dataKind: 'elevation-raster',
    accessMethod: 'ogc-services',
    license: {
      id: 'US-public-domain',
      mode: 'public-domain',
      evidence: 'verified-provider-terms',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: '3dep-products',
      resolverUrl: 'https://www.usgs.gov/3d-elevation-program/about-3dep-products-services',
    },
    checkedAt: CHECKED_AT,
    crs: ['product-specific projected CRS'],
    verticalDatum: 'NAVD88 or product-declared datum',
    nativeResolutionMeters: {
      nominal: 10,
      detail: 'Seamless national layer; local lidar-derived products can be finer.',
    },
    role: 'primary',
    priority: 5,
    maxSnapshotAgeDays: 365,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'generate-mesh-lods',
    ],
    catalogReferences: [{ catalog: 'americas', sourceId: 'usgs-3dep' }],
    attribution: 'U.S. Geological Survey 3D Elevation Program.',
    limitations: ['Product date, quality level, resolution, CRS, and vertical datum vary by tile.'],
  },
  'nrcan-hrdem': {
    id: 'nrcan-hrdem',
    publisher: 'Natural Resources Canada',
    product: 'High Resolution Digital Elevation Model',
    sourceUrl:
      'https://natural-resources.canada.ca/maps-tools-publications/maps/elevation-data',
    accessUrl: 'https://app.geo.ca/',
    termsUrl: 'https://open.canada.ca/en/open-government-licence-canada',
    correctionUrl: 'https://natural-resources.canada.ca/contact-us',
    regions: ['north-america', 'arctic'],
    countryCodes: ['CA'],
    coverage: 'Canada where HRDEM products are published.',
    dataKind: 'elevation-raster',
    accessMethod: 'provider-catalog',
    license: {
      id: 'Open-Government-Licence-Canada-2.0',
      mode: 'permissive',
      evidence: 'dataset-specific-evidence-required',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: 'nrcan-hrdem',
      resolverUrl: 'https://app.geo.ca/',
    },
    checkedAt: CHECKED_AT,
    crs: ['product-specific projected CRS'],
    verticalDatum: 'CGVD2013 or product-declared datum',
    nativeResolutionMeters: {
      nominal: 1,
      detail: 'High-resolution product class; availability and resolution vary.',
    },
    role: 'primary',
    priority: 5,
    maxSnapshotAgeDays: 365,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'generate-mesh-lods',
    ],
    catalogReferences: [{ catalog: 'americas', sourceId: 'nrcan-geospatial' }],
    attribution: 'Contains information licensed under the Open Government Licence - Canada.',
    limitations: ['Coverage and license evidence must be resolved for the exact product item.'],
  },
  'ga-elvis': {
    id: 'ga-elvis',
    publisher: 'Geoscience Australia',
    product: 'ELVIS elevation and bathymetry discovery service',
    sourceUrl:
      'https://www.ga.gov.au/scientific-topics/national-location-information/digital-elevation-data',
    accessUrl: 'https://elevation.fsdf.org.au/',
    termsUrl: 'https://www.ga.gov.au/copyright',
    correctionUrl: 'https://www.ga.gov.au/contact-us',
    regions: ['oceania', 'ocean'],
    countryCodes: ['AU'],
    coverage: 'Australia and published offshore elevation or bathymetry products.',
    dataKind: 'elevation-raster',
    accessMethod: 'provider-catalog',
    license: {
      id: 'GA-product-specific-open-license',
      mode: 'permissive',
      evidence: 'dataset-specific-evidence-required',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: 'elvis-catalog',
      resolverUrl: 'https://elevation.fsdf.org.au/',
    },
    checkedAt: CHECKED_AT,
    crs: ['product-specific Australian CRS'],
    verticalDatum: 'AHD or product-declared datum',
    nativeResolutionMeters: {
      nominal: 5,
      detail: 'Representative high-resolution class; catalog products vary widely.',
    },
    role: 'primary',
    priority: 5,
    maxSnapshotAgeDays: 365,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'apply-coastline-breakline',
      'generate-mesh-lods',
    ],
    catalogReferences: [{ catalog: 'oceania', sourceId: 'geoscience-australia-elvis' }],
    attribution: 'Geoscience Australia and the exact ELVIS product publisher.',
    limitations: ['The exact product license, datum, epoch, and resolution must be captured.'],
  },
  'linz-elevation': {
    id: 'linz-elevation',
    publisher: 'Land Information New Zealand',
    product: 'LINZ elevation data',
    sourceUrl:
      'https://www.linz.govt.nz/products-services/data/types-linz-data/elevation-data/access-elevation-data',
    accessUrl: 'https://data.linz.govt.nz/',
    termsUrl: 'https://www.linz.govt.nz/products-services/data/licensing-and-using-data',
    correctionUrl: 'https://www.linz.govt.nz/contact-us',
    regions: ['oceania'],
    countryCodes: ['NZ'],
    coverage: 'New Zealand where LINZ elevation products are published.',
    dataKind: 'elevation-raster',
    accessMethod: 'provider-catalog',
    license: {
      id: 'LINZ-product-specific-mostly-CC-BY-4.0',
      mode: 'permissive',
      evidence: 'dataset-specific-evidence-required',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: 'linz-elevation-catalog',
      resolverUrl: 'https://data.linz.govt.nz/',
    },
    checkedAt: CHECKED_AT,
    crs: ['NZTM2000', 'product-specific CRS'],
    verticalDatum: 'NZVD2016 or product-declared datum',
    nativeResolutionMeters: {
      nominal: 1,
      detail: 'Representative lidar-derived product class; product coverage varies.',
    },
    role: 'primary',
    priority: 5,
    maxSnapshotAgeDays: 365,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'generate-mesh-lods',
    ],
    catalogReferences: [{ catalog: 'oceania', sourceId: 'linz-elevation' }],
    attribution: 'Land Information New Zealand and the exact dataset attribution notice.',
    limitations: ['Dataset-specific attribution and vertical datum must be recorded per layer.'],
  },
  'rema-antarctica': {
    id: 'rema-antarctica',
    publisher: 'Polar Geospatial Center',
    product: 'Reference Elevation Model of Antarctica',
    sourceUrl: 'https://www.pgc.umn.edu/data/rema/',
    accessUrl: 'https://www.pgc.umn.edu/data/rema/',
    termsUrl:
      'https://www.pgc.umn.edu/guides/stereo-derived-elevation-models/pgc-dem-products-arcticdem-rema-and-earthdem/',
    correctionUrl: 'https://www.pgc.umn.edu/about/contact/',
    regions: ['antarctica'],
    coverage: 'Antarctic land and ice surface.',
    dataKind: 'elevation-raster',
    accessMethod: 'direct-download',
    license: {
      id: 'CC-BY-4.0',
      mode: 'permissive',
      evidence: 'verified-provider-terms',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: 'REMA',
      resolverUrl: 'https://www.pgc.umn.edu/data/rema/',
    },
    checkedAt: CHECKED_AT,
    crs: ['EPSG:3031'],
    verticalDatum: 'ellipsoidal height unless product metadata states otherwise',
    nativeResolutionMeters: {
      nominal: 2,
      detail: 'Mosaic and strip products have product-specific resolution and epoch.',
    },
    role: 'primary',
    priority: 5,
    maxSnapshotAgeDays: 730,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'generate-mesh-lods',
    ],
    catalogReferences: [{ catalog: 'polar', sourceId: 'rema-antarctica' }],
    attribution: 'Polar Geospatial Center Reference Elevation Model of Antarctica.',
    limitations: ['Surface elevation includes ice; acquisition epoch must be retained.'],
  },
  arcticdem: {
    id: 'arcticdem',
    publisher: 'Polar Geospatial Center',
    product: 'ArcticDEM',
    sourceUrl: 'https://www.pgc.umn.edu/data/arcticdem/',
    accessUrl: 'https://www.pgc.umn.edu/data/arcticdem/',
    termsUrl:
      'https://www.pgc.umn.edu/guides/stereo-derived-elevation-models/pgc-dem-products-arcticdem-rema-and-earthdem/',
    correctionUrl: 'https://www.pgc.umn.edu/about/contact/',
    regions: ['arctic'],
    coverage: 'Arctic land surface within provider-published coverage.',
    dataKind: 'elevation-raster',
    accessMethod: 'direct-download',
    license: {
      id: 'CC-BY-4.0-with-provider-exceptions',
      mode: 'permissive',
      evidence: 'dataset-specific-evidence-required',
      attributionRequired: true,
      navigationUseAllowed: false,
    },
    version: {
      strategy: 'rolling',
      id: 'ArcticDEM',
      resolverUrl: 'https://www.pgc.umn.edu/data/arcticdem/',
    },
    checkedAt: CHECKED_AT,
    crs: ['EPSG:3413'],
    verticalDatum: 'ellipsoidal height unless product metadata states otherwise',
    nativeResolutionMeters: {
      nominal: 2,
      detail: 'Mosaic and strip products have product-specific resolution and epoch.',
    },
    role: 'primary',
    priority: 5,
    maxSnapshotAgeDays: 730,
    exportLayerIds: ['terrain-mesh', 'contour-lines'],
    validationLayerIds: [],
    transformations: [
      'clip-aoi',
      'reproject-target-crs',
      'normalize-vertical-datum',
      'derive-contours',
      'triangulate-tin',
      'generate-mesh-lods',
    ],
    catalogReferences: [{ catalog: 'polar', sourceId: 'arcticdem' }],
    attribution: 'Polar Geospatial Center ArcticDEM.',
    limitations: [
      'Provider exceptions, including Alaska-related source restrictions, require item review.',
      'Surface elevation includes vegetation, buildings, snow, and ice where present.',
    ],
  },
};

export const REGIONAL_TOPOGRAPHIC_OPEN_SOURCE_IDS = Object.freeze(
  Object.keys(REGIONAL_TOPOGRAPHIC_OPEN_SOURCES) as RegionalTopographicOpenSourceId[],
);

const REGION_ID_BY_LAND_ID: Record<string, TopographicRegionId> = {
  AF: 'africa',
  AQ: 'antarctica',
  AS: 'asia',
  EU: 'europe',
  NA: 'north-america',
  SA: 'south-america',
  OC: 'oceania',
};

function normalizeLongitude(longitude: number) {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

function longitudeSpan(bounds: TopographicBounds) {
  return bounds.east >= bounds.west
    ? bounds.east - bounds.west
    : 360 - bounds.west + bounds.east;
}

function boundsCenter(bounds: TopographicBounds): [number, number] {
  return [
    (bounds.south + bounds.north) / 2,
    normalizeLongitude(bounds.west + longitudeSpan(bounds) / 2),
  ];
}

function regionCenter(region: GeoRegion): [number, number] {
  const span = region.e >= region.w ? region.e - region.w : 360 - region.w + region.e;
  return [
    (region.s + region.n) / 2,
    normalizeLongitude(region.w + span / 2),
  ];
}

function regionContainsPoint(region: GeoRegion, latitude: number, longitude: number) {
  const longitudeMatches =
    region.w <= region.e
      ? longitude >= region.w && longitude <= region.e
      : longitude >= region.w || longitude <= region.e;
  return latitude >= region.s && latitude <= region.n && longitudeMatches;
}

function validateBounds(bounds: TopographicBounds) {
  if (
    !Number.isFinite(bounds.south) ||
    !Number.isFinite(bounds.west) ||
    !Number.isFinite(bounds.north) ||
    !Number.isFinite(bounds.east) ||
    bounds.south < -90 ||
    bounds.north > 90 ||
    bounds.west < -180 ||
    bounds.west > 180 ||
    bounds.east < -180 ||
    bounds.east > 180 ||
    bounds.south >= bounds.north ||
    longitudeSpan(bounds) <= 0 ||
    longitudeSpan(bounds) > 180
  ) {
    throw new Error('Topographic bounds must be a valid AOI no wider than 180 degrees.');
  }
}

function resolveLandRegion(
  bounds: TopographicBounds,
  countryCode?: string,
): TopographicRegionId | undefined {
  const normalizedCountryCode = countryCode?.trim().toUpperCase();
  const country = normalizedCountryCode
    ? COUNTRY_REGIONS.find(region => region.code?.toUpperCase() === normalizedCountryCode)
    : undefined;
  const [latitude, longitude] = country ? regionCenter(country) : boundsCenter(bounds);
  const land = LAND_REGIONS.find(region => regionContainsPoint(region, latitude, longitude));
  return land?.id ? REGION_ID_BY_LAND_ID[land.id] : undefined;
}

export type RegionalTopographicSourceAuditIssue = {
  sourceId: RegionalTopographicOpenSourceId;
  field: string;
  message: string;
};

export function auditRegionalTopographicOpenSources(): RegionalTopographicSourceAuditIssue[] {
  const issues: RegionalTopographicSourceAuditIssue[] = [];

  for (const source of Object.values(REGIONAL_TOPOGRAPHIC_OPEN_SOURCES)) {
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
          message: `${field} must be an HTTPS provider-controlled URL.`,
        });
      }
    }
    if (!source.license.id.trim()) {
      issues.push({ sourceId: source.id, field: 'license.id', message: 'License ID is required.' });
    }
    if (source.license.attributionRequired && !source.attribution.trim()) {
      issues.push({
        sourceId: source.id,
        field: 'attribution',
        message: 'Required attribution is missing.',
      });
    }
    if (source.nativeResolutionMeters.nominal <= 0) {
      issues.push({
        sourceId: source.id,
        field: 'nativeResolutionMeters.nominal',
        message: 'Nominal resolution must be positive.',
      });
    }
    if (!source.verticalDatum.trim()) {
      issues.push({
        sourceId: source.id,
        field: 'verticalDatum',
        message: 'Vertical datum or explicit not-applicable marker is required.',
      });
    }
    if (source.exportLayerIds.length === 0 && source.validationLayerIds.length === 0) {
      issues.push({
        sourceId: source.id,
        field: 'layers',
        message: 'At least one export or validation layer is required.',
      });
    }
    if (source.catalogReferences.length === 0) {
      issues.push({
        sourceId: source.id,
        field: 'catalogReferences',
        message: 'At least one regional catalog reference is required.',
      });
    }
  }

  return issues;
}

export type RegionalTopographicBuildRequest = {
  bounds: TopographicBounds;
  countryCode?: string;
  regionHint?: Exclude<TopographicRegionId, 'global'>;
  surface: TopographicSurface;
  layerIds: TopographicLayerId[];
  outputFormat?: TopographicExportFormat;
  targetCrs?: string;
  targetResolutionMeters?: number;
};

export type RegionalTopographicLayerPlan = {
  layerId: TopographicLayerId;
  state: 'corroborated' | 'single-source' | 'gap';
  regionalSourceIds: RegionalTopographicOpenSourceId[];
  globalExportSourceIds: GlobalTopographicOpenSourceId[];
  globalValidationSourceIds: GlobalTopographicOpenSourceId[];
  preferredSourceId?: RegionalTopographicOpenSourceId | GlobalTopographicOpenSourceId;
  conversionStages: string[];
};

export type RegionalTopographicAcquisitionTask = {
  sourceId: RegionalTopographicOpenSourceId;
  accessUrl: string;
  accessMethod: RegionalTopographicOpenSource['accessMethod'];
  bounds: TopographicBounds;
  rawSnapshotPath: string;
  adapterId: string;
  requiredEvidence: string[];
  transformations: RegionalTopographicTransformation[];
};

export type RegionalTopographicBuildPlan = {
  stackVersion: string;
  state: 'snapshot-evidence-required' | 'catalog-gaps';
  request: Required<
    Pick<RegionalTopographicBuildRequest, 'bounds' | 'surface' | 'layerIds'>
  > &
    Pick<RegionalTopographicBuildRequest, 'countryCode'> & {
      outputFormat: TopographicExportFormat;
      targetCrs: string;
      targetResolutionMeters?: number;
    };
  regionIds: TopographicRegionId[];
  layerPlans: RegionalTopographicLayerPlan[];
  regionalSourceIds: RegionalTopographicOpenSourceId[];
  globalFusion: GlobalTopographicFusionPlan;
  acquisitionTasks: RegionalTopographicAcquisitionTask[];
  gates: {
    licenseAndReuseEvidence: 'required';
    immutableVersionAndDigest: 'required';
    verticalDatumNormalization: 'required';
    coastlineSeam: 'required' | 'not-applicable';
    outputTopologyValidation: 'required';
  };
  nonClaims: string[];
};

function sourceSupportsSurface(
  source: RegionalTopographicOpenSource,
  surface: TopographicSurface,
) {
  if (surface === 'coastal') return true;
  if (surface === 'ocean') return source.dataKind === 'bathymetry-raster';
  return source.dataKind !== 'bathymetry-raster';
}

function sourceRegionRank(
  source: RegionalTopographicOpenSource,
  regions: readonly TopographicRegionId[],
  countryCode?: string,
) {
  const normalizedCountryCode = countryCode?.trim().toUpperCase();
  if (source.countryCodes) {
    if (normalizedCountryCode) {
      return source.countryCodes.includes(normalizedCountryCode) ? 0 : 3;
    }
    const scopedRegionMatches = source.regions.some(
      region => region !== 'global' && region !== 'ocean' && regions.includes(region),
    );
    return scopedRegionMatches ? 1 : 3;
  }
  const scopedRegions = source.regions.filter(
    region => region !== 'global' && region !== 'ocean',
  );
  if (scopedRegions.some(region => regions.includes(region))) return 1;
  if (scopedRegions.length > 0) return 3;
  if (source.regions.includes('global')) return 2;
  if (source.regions.includes('ocean') && regions.includes('ocean')) return 2;
  return 3;
}

function conversionStagesForLayer(
  layerId: TopographicLayerId,
  surface: TopographicSurface,
) {
  if (layerId === 'terrain-mesh') {
    return [
      'clip-source-raster-to-aoi',
      'resolve-no-data-and-source-quality-mask',
      'normalize-horizontal-and-vertical-reference',
      ...(surface === 'coastal' ? ['snap-land-and-bathymetry-to-coastline-breakline'] : []),
      'triangulate-raster-to-tin',
      'generate-geometric-error-lods',
      'validate-watertight-mesh-and-bounds',
    ];
  }
  if (layerId === 'contour-lines') {
    return [
      'clip-source-raster-to-aoi',
      'normalize-horizontal-and-vertical-reference',
      ...(surface === 'coastal' ? ['preserve-zero-elevation-coastline-breakline'] : []),
      'derive-contour-vectors',
      'repair-vector-topology',
      'validate-contour-interval-and-elevation',
    ];
  }
  if (layerId === 'waterways') {
    return [
      'clip-vector-to-aoi',
      'normalize-coastline-and-waterway-semantics',
      'repair-vector-topology',
      'validate-land-water-side-consistency',
    ];
  }
  return [
    'clip-vector-or-raster-to-aoi',
    'normalize-source-schema',
    'reproject-target-crs',
    'validate-output-topology',
  ];
}

function selectRegionalSources(
  candidates: RegionalTopographicOpenSource[],
  layerId: TopographicLayerId,
  surface: TopographicSurface,
) {
  if (
    surface !== 'coastal' ||
    (layerId !== 'terrain-mesh' && layerId !== 'contour-lines')
  ) {
    return candidates.slice(0, 3);
  }

  const selected: RegionalTopographicOpenSource[] = [];
  for (const kind of ['elevation-raster', 'bathymetry-raster'] as const) {
    const source = candidates.find(candidate => candidate.dataKind === kind);
    if (source) selected.push(source);
  }
  for (const source of candidates) {
    if (selected.length >= 3) break;
    if (!selected.includes(source)) selected.push(source);
  }
  return selected;
}

export function buildRegionalTopographicOpenSourcePlan(
  request: RegionalTopographicBuildRequest,
): RegionalTopographicBuildPlan {
  validateBounds(request.bounds);
  const layerIds = [...new Set(request.layerIds)];
  if (layerIds.length === 0) throw new Error('At least one topographic layer is required.');
  if (
    request.targetResolutionMeters !== undefined &&
    (!Number.isFinite(request.targetResolutionMeters) || request.targetResolutionMeters <= 0)
  ) {
    throw new Error('targetResolutionMeters must be positive when provided.');
  }

  const landRegion = resolveLandRegion(request.bounds, request.countryCode);
  const regionIds = new Set<TopographicRegionId>();
  if (request.regionHint) regionIds.add(request.regionHint);
  if (!request.regionHint && landRegion) regionIds.add(landRegion);
  if (request.surface !== 'land') regionIds.add('ocean');
  if (request.bounds.north >= 66) regionIds.add('arctic');
  if (request.bounds.south <= -60) regionIds.add('antarctica');
  if (regionIds.size === 0) regionIds.add(request.surface === 'land' ? 'global' : 'ocean');

  const resolvedRegions = [...regionIds];
  const globalFusion = buildGlobalTopographicFusionPlan(layerIds);
  const layerPlans = layerIds.map<RegionalTopographicLayerPlan>(layerId => {
    const regionalCandidates = Object.values(REGIONAL_TOPOGRAPHIC_OPEN_SOURCES)
      .filter(source => source.exportLayerIds.includes(layerId))
      .filter(source => sourceSupportsSurface(source, request.surface))
      .filter(source => sourceRegionRank(source, resolvedRegions, request.countryCode) < 3)
      .sort(
        (left, right) =>
          sourceRegionRank(left, resolvedRegions, request.countryCode) -
            sourceRegionRank(right, resolvedRegions, request.countryCode) ||
          left.priority - right.priority ||
          left.id.localeCompare(right.id),
      );
    const regionalSources = selectRegionalSources(
      regionalCandidates,
      layerId,
      request.surface,
    );
    const globalLayer = globalFusion.layers.find(layer => layer.layerId === layerId);
    const corroboratorCount =
      regionalSources.length +
      (globalLayer?.exportSourceIds.length ?? 0) +
      (globalLayer?.validationSourceIds.length ?? 0);
    const preferredRegional = regionalSources[0];

    return {
      layerId,
      state:
        regionalSources.length === 0 && (globalLayer?.exportSourceIds.length ?? 0) === 0
          ? 'gap'
          : corroboratorCount >= 2
            ? 'corroborated'
            : 'single-source',
      regionalSourceIds: regionalSources.map(source => source.id),
      globalExportSourceIds: globalLayer?.exportSourceIds ?? [],
      globalValidationSourceIds: globalLayer?.validationSourceIds ?? [],
      preferredSourceId: preferredRegional?.id ?? globalLayer?.preferredSourceId,
      conversionStages: conversionStagesForLayer(layerId, request.surface),
    };
  });
  const regionalSourceIds = [
    ...new Set(layerPlans.flatMap(layer => layer.regionalSourceIds)),
  ];
  const acquisitionTasks = regionalSourceIds.map<RegionalTopographicAcquisitionTask>(sourceId => {
    const source = REGIONAL_TOPOGRAPHIC_OPEN_SOURCES[sourceId];
    return {
      sourceId,
      accessUrl: source.accessUrl,
      accessMethod: source.accessMethod,
      bounds: request.bounds,
      rawSnapshotPath: `raw/topography/${sourceId}/{immutable-version}/{sha256}`,
      adapterId: `agid-topography-${sourceId}-adapter-v1`,
      requiredEvidence: [
        'immutable version identifier',
        'retrieval and verification timestamps',
        'sha256 content digest',
        'exact license or terms evidence URL',
        'coverage bounds and source quality mask',
        'horizontal CRS and vertical datum',
      ],
      transformations: [...source.transformations],
    };
  });

  return {
    stackVersion: REGIONAL_TOPOGRAPHIC_OPEN_SOURCE_STACK_VERSION,
    state: layerPlans.some(layer => layer.state === 'gap')
      ? 'catalog-gaps'
      : 'snapshot-evidence-required',
    request: {
      bounds: request.bounds,
      countryCode: request.countryCode?.trim().toUpperCase(),
      surface: request.surface,
      layerIds,
      outputFormat: request.outputFormat ?? 'gltf',
      targetCrs: request.targetCrs ?? 'EPSG:4978',
      targetResolutionMeters: request.targetResolutionMeters,
    },
    regionIds: resolvedRegions,
    layerPlans,
    regionalSourceIds,
    globalFusion,
    acquisitionTasks,
    gates: {
      licenseAndReuseEvidence: 'required',
      immutableVersionAndDigest: 'required',
      verticalDatumNormalization: 'required',
      coastlineSeam: request.surface === 'coastal' ? 'required' : 'not-applicable',
      outputTopologyValidation: 'required',
    },
    nonClaims: [
      'Catalog selection does not prove that a source snapshot was acquired or verified.',
      'Raster elevation and bathymetry are converted to TIN meshes and contour vectors; the source raster remains the provenance root.',
      'Coastal output is blocked until land elevation, bathymetry, shoreline epoch, and vertical references are reconciled.',
      'Bathymetric output is not for navigation, safety at sea, or hydrographic chart replacement.',
      'Terrain, buildings, and map context do not prove an address, entrance, recipient, or delivery point.',
    ],
  };
}

export type RegionalTopographicSnapshotEvidence = {
  sourceId: RegionalTopographicOpenSourceId;
  versionId: string;
  publishedAt: string;
  retrievedAt: string;
  verifiedAt: string;
  sha256: `sha256:${string}`;
  adapterVersion: string;
  recordOrCellCount: number;
  coverage: TopographicCoverage;
  licenseEvidenceUrl: string;
  rightsDecision: 'approved' | 'pending' | 'rejected';
  horizontalCrs: string;
  verticalDatum: string;
};

function requireIsoTimestamp(field: string, value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
}

export function promoteRegionalTopographicSnapshot(
  evidence: RegionalTopographicSnapshotEvidence,
): TopographicSourceRecord {
  const source = REGIONAL_TOPOGRAPHIC_OPEN_SOURCES[evidence.sourceId];
  if (!source) throw new Error(`Unknown regional topographic source: ${evidence.sourceId}`);
  if (source.exportLayerIds.length === 0) {
    throw new Error(`${source.id} is validation-only and cannot back an export.`);
  }
  if (evidence.rightsDecision !== 'approved') {
    throw new Error(`${source.id} requires an approved rights decision.`);
  }
  if (source.version.strategy === 'fixed' && evidence.versionId !== source.version.id) {
    throw new Error(`${source.id} requires version ${source.version.id}.`);
  }
  if (source.version.strategy === 'rolling' && evidence.versionId === source.version.id) {
    throw new Error(`${source.id} rolling snapshots require an immutable resolved version.`);
  }
  if (!/^sha256:[a-f0-9]{64}$/i.test(evidence.sha256)) {
    throw new Error(`${source.id} snapshot requires a sha256 content digest.`);
  }
  if (!evidence.adapterVersion.trim()) {
    throw new Error(`${source.id} snapshot requires an ingestion adapter version.`);
  }
  if (!Number.isInteger(evidence.recordOrCellCount) || evidence.recordOrCellCount <= 0) {
    throw new Error(`${source.id} recordOrCellCount must be a positive integer.`);
  }
  if (!evidence.licenseEvidenceUrl.startsWith('https://')) {
    throw new Error(`${source.id} requires an HTTPS license evidence URL.`);
  }
  if (!evidence.horizontalCrs.trim()) {
    throw new Error(`${source.id} requires an explicit horizontal CRS.`);
  }
  if (!evidence.verticalDatum.trim()) {
    throw new Error(`${source.id} requires an explicit vertical datum or not-applicable marker.`);
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
      `Regional stack: ${REGIONAL_TOPOGRAPHIC_OPEN_SOURCE_STACK_VERSION}.`,
      `Snapshot digest: ${evidence.sha256}.`,
      `Adapter: ${evidence.adapterVersion}.`,
      `Verified at: ${evidence.verifiedAt}.`,
      `Record or cell count: ${evidence.recordOrCellCount}.`,
      `Vertical datum: ${evidence.verticalDatum}.`,
      ...source.limitations,
    ],
  };
}
