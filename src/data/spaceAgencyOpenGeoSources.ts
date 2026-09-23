import { resolveSourceLicenseStatus } from './sourceLicensePolicy';

export type SpaceAgencyOpenGeoSourceId =
  | 'nasa-earthdata-cmr'
  | 'nasa-gibs-worldview'
  | 'nasa-nasadem-srtm'
  | 'nasa-modis-land-cover'
  | 'nasa-firms-fire'
  | 'esa-worldcover'
  | 'copernicus-data-space-stac'
  | 'copernicus-dem'
  | 'jaxa-aw3d30'
  | 'usgs-landsat-collection2';

export type SpaceAgencyGeoUse =
  | 'source-discovery'
  | 'imagery-validation'
  | 'terrain-context'
  | 'land-cover-context'
  | 'water-context'
  | 'sparse-region-confidence'
  | 'polar-context'
  | 'hazard-context';

export interface SpaceAgencyOpenGeoSource {
  id: SpaceAgencyOpenGeoSourceId;
  agency: 'NASA' | 'ESA' | 'Copernicus' | 'JAXA' | 'USGS';
  name: string;
  url: string;
  kind:
    | 'data-catalog'
    | 'stac-catalog'
    | 'imagery'
    | 'elevation'
    | 'land-cover'
    | 'hydrology'
    | 'hazard';
  access:
    | 'catalog-api'
    | 'stac-api'
    | 'wmts-wms'
    | 'direct-download'
    | 'data-api';
  coverage: 'global' | 'near-global' | 'regional';
  usage: 'primary' | 'fallback' | 'validation' | 'reference';
  requiresAccount: boolean;
  redistribution: 'redistributable' | 'review-required' | 'metadata-only';
  license?: string;
  agidUses: SpaceAgencyGeoUse[];
  notes: string;
}

export const SPACE_AGENCY_OPEN_GEO_SOURCES: Record<SpaceAgencyOpenGeoSourceId, SpaceAgencyOpenGeoSource> = {
  'nasa-earthdata-cmr': {
    id: 'nasa-earthdata-cmr',
    agency: 'NASA',
    name: 'NASA Earthdata Common Metadata Repository',
    url: 'https://cmr.earthdata.nasa.gov/search/site/docs/search/api',
    kind: 'data-catalog',
    access: 'catalog-api',
    coverage: 'global',
    usage: 'primary',
    requiresAccount: false,
    redistribution: 'metadata-only',
    license: 'NASA Earthdata terms; collection records may include source-specific restrictions',
    agidUses: ['source-discovery'],
    notes: 'Use CMR to discover NASA-led datasets by bbox, time, topic, and collection before downloading or caching any product data.',
  },
  'nasa-gibs-worldview': {
    id: 'nasa-gibs-worldview',
    agency: 'NASA',
    name: 'NASA Global Imagery Browse Services',
    url: 'https://nasa-gibs.github.io/gibs-api-docs/',
    kind: 'imagery',
    access: 'wmts-wms',
    coverage: 'global',
    usage: 'validation',
    requiresAccount: false,
    redistribution: 'review-required',
    license: 'NASA Earthdata terms; imagery layer license follows source product',
    agidUses: ['imagery-validation', 'water-context', 'land-cover-context', 'hazard-context'],
    notes: 'Use GIBS as a live visual validation layer for water, snow, burn scars, vegetation, coastline, and remote-area candidate checks.',
  },
  'nasa-nasadem-srtm': {
    id: 'nasa-nasadem-srtm',
    agency: 'NASA',
    name: 'NASADEM and SRTM Elevation',
    url: 'https://www.earthdata.nasa.gov/centers/lp-daac',
    kind: 'elevation',
    access: 'direct-download',
    coverage: 'near-global',
    usage: 'reference',
    requiresAccount: true,
    redistribution: 'redistributable',
    license: 'NASA Earthdata CC0 for NASA-led mission data; cite source',
    agidUses: ['terrain-context', 'sparse-region-confidence'],
    notes: 'Use 30m elevation to stabilize mountain, valley, pass, escarpment, island, plateau, and desert-edge address context.',
  },
  'nasa-modis-land-cover': {
    id: 'nasa-modis-land-cover',
    agency: 'NASA',
    name: 'NASA MODIS Land Cover',
    url: 'https://www.earthdata.nasa.gov/topics/land-surface/land-use-land-cover/data-access-tools',
    kind: 'land-cover',
    access: 'direct-download',
    coverage: 'global',
    usage: 'reference',
    requiresAccount: true,
    redistribution: 'redistributable',
    license: 'NASA Earthdata CC0 for NASA-led mission data; cite source',
    agidUses: ['land-cover-context', 'sparse-region-confidence'],
    notes: 'Use coarse but stable global land-cover classes as a secondary signal for desert, forest, grassland, wetland, snow, barren, and urban-edge checks.',
  },
  'nasa-firms-fire': {
    id: 'nasa-firms-fire',
    agency: 'NASA',
    name: 'NASA FIRMS Active Fire Data',
    url: 'https://firms.modaps.eosdis.nasa.gov/',
    kind: 'hazard',
    access: 'data-api',
    coverage: 'global',
    usage: 'reference',
    requiresAccount: true,
    redistribution: 'review-required',
    license: 'NASA FIRMS terms; cite source',
    agidUses: ['hazard-context', 'imagery-validation'],
    notes: 'Use active-fire and hotspot data only as temporal context for unsettled or recently changed natural places, never as an address source of truth.',
  },
  'esa-worldcover': {
    id: 'esa-worldcover',
    agency: 'ESA',
    name: 'ESA WorldCover',
    url: 'https://esa-worldcover.org/en/data-access',
    kind: 'land-cover',
    access: 'direct-download',
    coverage: 'global',
    usage: 'reference',
    requiresAccount: false,
    redistribution: 'redistributable',
    license: 'CC BY 4.0',
    agidUses: ['land-cover-context', 'water-context', 'sparse-region-confidence'],
    notes: 'Use 10m global land-cover classes for forest, grassland, wetland, mangrove, cropland, bare ground, snow, water, and built-up confidence.',
  },
  'copernicus-data-space-stac': {
    id: 'copernicus-data-space-stac',
    agency: 'Copernicus',
    name: 'Copernicus Data Space STAC API',
    url: 'https://documentation.dataspace.copernicus.eu/APIs/STAC.html',
    kind: 'stac-catalog',
    access: 'stac-api',
    coverage: 'global',
    usage: 'primary',
    requiresAccount: true,
    redistribution: 'metadata-only',
    license: 'Copernicus Data Space terms; Sentinel data governed by Sentinel legal notice',
    agidUses: ['source-discovery', 'imagery-validation', 'water-context', 'land-cover-context'],
    notes: 'Use STAC search to find Sentinel scenes by bbox, time, cloud cover, and collection, with quotas and registration handled outside bundled data.',
  },
  'copernicus-dem': {
    id: 'copernicus-dem',
    agency: 'Copernicus',
    name: 'Copernicus DEM',
    url: 'https://dataspace.copernicus.eu/ecosystem/services/data-download',
    kind: 'elevation',
    access: 'direct-download',
    coverage: 'global',
    usage: 'reference',
    requiresAccount: true,
    redistribution: 'review-required',
    license: 'Copernicus Data Space terms',
    agidUses: ['terrain-context', 'sparse-region-confidence', 'polar-context'],
    notes: 'Use as an alternate elevation source for terrain cross-checks where NASADEM/SRTM, national DEMs, or polar DEMs disagree.',
  },
  'jaxa-aw3d30': {
    id: 'jaxa-aw3d30',
    agency: 'JAXA',
    name: 'JAXA ALOS World 3D - 30m',
    url: 'https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/index.htm',
    kind: 'elevation',
    access: 'direct-download',
    coverage: 'global',
    usage: 'reference',
    requiresAccount: true,
    redistribution: 'review-required',
    license: 'JAXA AW3D30 terms of use',
    agidUses: ['terrain-context', 'sparse-region-confidence'],
    notes: 'Use AW3D30 as a global surface-model cross-check for mountains, volcanic islands, ridges, valleys, and dense terrain.',
  },
  'usgs-landsat-collection2': {
    id: 'usgs-landsat-collection2',
    agency: 'USGS',
    name: 'USGS Landsat Collection 2',
    url: 'https://www.usgs.gov/landsat-missions/landsat-collection-2-level-1-data',
    kind: 'imagery',
    access: 'direct-download',
    coverage: 'global',
    usage: 'validation',
    requiresAccount: false,
    redistribution: 'redistributable',
    license: 'U.S. public domain',
    agidUses: ['imagery-validation', 'land-cover-context', 'water-context', 'sparse-region-confidence'],
    notes: 'Use no-cost Landsat archive imagery to validate stable surface-water, vegetation, bare-ground, coastline, island, and settlement-edge context.',
  },
};

export const NASA_DIRECT_OPEN_SOURCE_IDS = [
  'nasa-earthdata-cmr',
  'nasa-gibs-worldview',
  'nasa-nasadem-srtm',
  'nasa-modis-land-cover',
  'nasa-firms-fire',
] as const satisfies readonly SpaceAgencyOpenGeoSourceId[];

export const GLOBAL_SPACE_AGENCY_OPEN_SOURCE_IDS = [
  ...NASA_DIRECT_OPEN_SOURCE_IDS,
  'esa-worldcover',
  'copernicus-data-space-stac',
  'copernicus-dem',
  'jaxa-aw3d30',
  'usgs-landsat-collection2',
] as const satisfies readonly SpaceAgencyOpenGeoSourceId[];

export type SpaceAgencyDataWorkflowId =
  | 'source-discovery'
  | 'terrain-and-relief'
  | 'land-cover-and-biome'
  | 'water-and-wetland'
  | 'remote-imagery-validation'
  | 'hazard-and-temporal-context';

export interface SpaceAgencyDataWorkflow {
  id: SpaceAgencyDataWorkflowId;
  sourceIds: readonly SpaceAgencyOpenGeoSourceId[];
  useWhen: string;
  outputSignals: readonly string[];
  cachePolicy: 'metadata-only' | 'derived-signals-only' | 'review-before-bundling';
}

export const SPACE_AGENCY_DATA_USAGE_PLAN: Record<SpaceAgencyDataWorkflowId, SpaceAgencyDataWorkflow> = {
  'source-discovery': {
    id: 'source-discovery',
    sourceIds: ['nasa-earthdata-cmr', 'copernicus-data-space-stac'],
    useWhen: 'Coordinates are known and AGID needs direct official Earth-observation source discovery by bbox, time, and collection.',
    outputSignals: ['candidate datasets', 'collection provenance', 'download endpoint candidates'],
    cachePolicy: 'metadata-only',
  },
  'terrain-and-relief': {
    id: 'terrain-and-relief',
    sourceIds: ['nasa-nasadem-srtm', 'jaxa-aw3d30', 'copernicus-dem'],
    useWhen: 'Mountain, valley, island, desert-edge, plateau, pass, ridge, or sparse rural context needs elevation confirmation.',
    outputSignals: ['elevation band', 'slope class', 'ridge/valley confidence', 'terrain disagreement flag'],
    cachePolicy: 'derived-signals-only',
  },
  'land-cover-and-biome': {
    id: 'land-cover-and-biome',
    sourceIds: ['esa-worldcover', 'nasa-modis-land-cover', 'usgs-landsat-collection2', 'copernicus-data-space-stac'],
    useWhen: 'Address tabs need forest, grassland, wetland, desert, ice, bare-ground, cropland, or built-up context.',
    outputSignals: ['dominant land-cover class', 'natural/built confidence', 'remote-area quality modifier'],
    cachePolicy: 'derived-signals-only',
  },
  'water-and-wetland': {
    id: 'water-and-wetland',
    sourceIds: ['esa-worldcover', 'usgs-landsat-collection2', 'copernicus-data-space-stac', 'nasa-gibs-worldview'],
    useWhen: 'Named lakes, rivers, wetlands, marshes, salt flats, seasonal water, waterfalls, or coasts need independent visual or class confirmation.',
    outputSignals: ['water presence confidence', 'seasonal water warning', 'shoreline/crossing validation'],
    cachePolicy: 'derived-signals-only',
  },
  'remote-imagery-validation': {
    id: 'remote-imagery-validation',
    sourceIds: ['nasa-gibs-worldview', 'usgs-landsat-collection2', 'copernicus-data-space-stac'],
    useWhen: 'OSM/geocoder candidates are sparse, conflicting, or low-quality and a satellite-derived sanity check is useful.',
    outputSignals: ['imagery availability', 'cloud/no-data warning', 'candidate visual consistency'],
    cachePolicy: 'review-before-bundling',
  },
  'hazard-and-temporal-context': {
    id: 'hazard-and-temporal-context',
    sourceIds: ['nasa-firms-fire', 'nasa-gibs-worldview'],
    useWhen: 'Recent fire, smoke, flood, or rapid natural surface change may explain address-quality degradation.',
    outputSignals: ['recent hazard context', 'temporal instability warning'],
    cachePolicy: 'review-before-bundling',
  },
};

export function getSpaceAgencyOpenGeoSources(): SpaceAgencyOpenGeoSource[] {
  return GLOBAL_SPACE_AGENCY_OPEN_SOURCE_IDS.map(sourceId => SPACE_AGENCY_OPEN_GEO_SOURCES[sourceId]);
}

export function getSpaceAgencyOpenGeoSourcesForUse(use: SpaceAgencyGeoUse): SpaceAgencyOpenGeoSource[] {
  return getSpaceAgencyOpenGeoSources().filter(source => source.agidUses.includes(use));
}

export function getSpaceAgencySourceIdsForWorkflow(
  workflowId: SpaceAgencyDataWorkflowId,
): readonly SpaceAgencyOpenGeoSourceId[] {
  return SPACE_AGENCY_DATA_USAGE_PLAN[workflowId].sourceIds;
}

export function getRedistributableSpaceAgencyOpenGeoSources(): SpaceAgencyOpenGeoSource[] {
  return getSpaceAgencyOpenGeoSources().filter(source => {
    const licenseStatus = resolveSourceLicenseStatus(source);
    return source.redistribution === 'redistributable' && licenseStatus.redistributable;
  });
}
