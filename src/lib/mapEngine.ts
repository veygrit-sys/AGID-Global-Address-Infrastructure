import { Protocol } from 'pmtiles';
import { apiV1Path } from './apiVersion';

export const OPENFREEMAP_STYLES = {
  bright: 'https://tiles.openfreemap.org/styles/bright',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  positron: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const;

export type OpenFreeMapStyleId = keyof typeof OPENFREEMAP_STYLES;
export type AgidMapProjection = 'mercator' | 'globe';
export type AgidMapEngineId = 'maplibre-gl' | 'openlayers';

export type AgidMapEngineSource = {
  id: string;
  name: string;
  url: string;
  role: 'engine' | 'style' | 'schema' | 'archive' | 'terrain';
  license: string;
};

export type AgidMapEngineProfile = {
  id: AgidMapEngineId;
  name: string;
  license: string;
  runtimePackage: string;
  recommendedUse: 'primary-3d-vector' | 'fallback-2d-ogc';
  capabilities: string[];
  sources: AgidMapEngineSource[];
};

export const AGID_MAP_ENGINE: AgidMapEngineProfile = {
  id: 'maplibre-gl',
  name: 'MapLibre GL JS',
  license: 'BSD-3-Clause',
  runtimePackage: 'maplibre-gl',
  recommendedUse: 'primary-3d-vector',
  capabilities: [
    'vector-tiles',
    'raster-tiles',
    'terrain-dem',
    'globe-projection',
    'pmtiles-offline-archives',
    'self-hosted-style-json',
  ],
  sources: [
    {
      id: 'maplibre',
      name: 'MapLibre GL JS',
      url: 'https://maplibre.org/maplibre-gl-js/docs/',
      role: 'engine',
      license: 'BSD-3-Clause',
    },
    {
      id: 'openfreemap',
      name: 'OpenFreeMap public styles and tiles',
      url: 'https://openfreemap.org/',
      role: 'style',
      license: 'OpenStreetMap/OpenMapTiles based open data',
    },
    {
      id: 'openmaptiles-schema',
      name: 'OpenMapTiles vector tile schema',
      url: 'https://openmaptiles.org/schema/',
      role: 'schema',
      license: 'BSD-3-Clause / OSM open data compatible',
    },
    {
      id: 'protomaps-pmtiles',
      name: 'PMTiles single-file tile archives',
      url: 'https://docs.protomaps.com/pmtiles/',
      role: 'archive',
      license: 'BSD-3-Clause',
    },
    {
      id: 'terrarium-terrain',
      name: 'Terrarium terrain raster-dem proxy',
      url: apiV1Path('/terrain/{z}/{x}/{y}.png'),
      role: 'terrain',
      license: 'Open terrain data via local proxy',
    },
  ] satisfies AgidMapEngineSource[],
};

export const AGID_OPENLAYERS_ENGINE: AgidMapEngineProfile = {
  id: 'openlayers',
  name: 'OpenLayers',
  license: 'BSD-2-Clause',
  runtimePackage: 'ol',
  recommendedUse: 'fallback-2d-ogc',
  capabilities: [
    'raster-tiles',
    'vector-tiles',
    'ogc-services',
    'wms-wmts',
    'geojson-overlays',
    'projection-transforms',
  ],
  sources: [
    {
      id: 'openlayers',
      name: 'OpenLayers',
      url: 'https://openlayers.org/',
      role: 'engine',
      license: 'BSD-2-Clause',
    },
    {
      id: 'openstreetmap',
      name: 'OpenStreetMap raster tiles',
      url: 'https://www.openstreetmap.org/',
      role: 'style',
      license: 'OpenStreetMap open data',
    },
    {
      id: 'ogc-services',
      name: 'OGC WMS/WMTS/WFS service compatibility',
      url: 'https://www.ogc.org/standards/',
      role: 'schema',
      license: 'Open standards',
    },
  ],
};

export const AGID_MAP_ENGINES = [
  AGID_MAP_ENGINE,
  AGID_OPENLAYERS_ENGINE,
] as const;

export function getAgidMapEngine(engineId?: string | null): AgidMapEngineProfile {
  return AGID_MAP_ENGINES.find(engine => engine.id === engineId) || AGID_MAP_ENGINE;
}

type MapLibreLike = {
  addProtocol: (name: string, handler: (params: unknown, abortController: AbortController) => unknown) => void;
};

type BuildMapOptionsInput = {
  container: unknown;
  style: string;
  satelliteStyle: unknown;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  projection: AgidMapProjection;
  lowBandwidth?: boolean;
};

const registeredMapLibreObjects = new WeakSet<object>();

export function resolveMapStyle(style: string | null | undefined, satelliteStyle: unknown): string | unknown {
  const styleId = (style || '').trim();
  if (styleId === 'satellite') return satelliteStyle;
  if (styleId in OPENFREEMAP_STYLES) return OPENFREEMAP_STYLES[styleId as OpenFreeMapStyleId];
  return styleId || OPENFREEMAP_STYLES.liberty;
}

export function buildMapLibreOptions(input: BuildMapOptionsInput) {
  const lowBandwidth = Boolean(input.lowBandwidth);

  return {
    container: input.container,
    style: resolveMapStyle(input.style, input.satelliteStyle),
    center: input.center,
    zoom: input.zoom,
    pitch: input.pitch,
    bearing: input.bearing,
    attributionControl: true,
    projection: { type: input.projection },
    antialias: !lowBandwidth,
    fadeDuration: lowBandwidth ? 0 : 300,
    refreshExpiredTiles: !lowBandwidth,
    maxParallelImageRequests: lowBandwidth ? 4 : 16,
    maxTileCacheSize: lowBandwidth ? 48 : 192,
    maxTileCacheZoomLevels: lowBandwidth ? 3 : 5,
    pixelRatio: lowBandwidth ? 1 : undefined,
    transformRequest: (url: string) => ({ url }),
  };
}

export function registerPmtilesProtocol(maplibre: MapLibreLike) {
  if (registeredMapLibreObjects.has(maplibre)) return;

  const protocol = new Protocol();
  maplibre.addProtocol('pmtiles', protocol.tile);
  registeredMapLibreObjects.add(maplibre);
}
