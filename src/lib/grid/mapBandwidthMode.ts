import { OPENFREEMAP_STYLES } from '../mapEngine';

export type MapBandwidthMode = 'standard' | 'low';

export const MAP_BANDWIDTH_MODE_STORAGE_KEY = 'agid_map_bandwidth_mode';
export const LOW_BANDWIDTH_VECTOR_STYLE = OPENFREEMAP_STYLES.positron;

export type HeavyMapOverlay =
  | 'satellite'
  | 'terrain-dem'
  | '3d-buildings'
  | 'globe-projection'
  | 'arcgis-raster'
  | 'bathymetry-raster'
  | 'overpass-poi'
  | 'risk-overlays'
  | 'transport-hubs';

export type LowBandwidthPrioritySurface =
  | 'agid-grid'
  | 'address-candidates';

export type MapBandwidthProfile = {
  mode: MapBandwidthMode;
  lowBandwidth: boolean;
  preferredStyle: string;
  maxParallelImageRequests: number;
  maxTileCacheSize: number;
  refreshExpiredTiles: boolean;
  disabledOverlays: HeavyMapOverlay[];
  prioritySurfaces: LowBandwidthPrioritySurface[];
};

const LOW_BANDWIDTH_DISABLED_OVERLAYS: HeavyMapOverlay[] = [
  'satellite',
  'terrain-dem',
  '3d-buildings',
  'globe-projection',
  'arcgis-raster',
  'bathymetry-raster',
  'overpass-poi',
  'risk-overlays',
  'transport-hubs',
];

export function normalizeMapBandwidthMode(value: unknown): MapBandwidthMode {
  return value === 'low' || value === 'low-bandwidth' || value === true ? 'low' : 'standard';
}

export function getMapBandwidthProfile(mode: unknown): MapBandwidthProfile {
  const normalizedMode = normalizeMapBandwidthMode(mode);
  if (normalizedMode === 'low') {
    return {
      mode: 'low',
      lowBandwidth: true,
      preferredStyle: LOW_BANDWIDTH_VECTOR_STYLE,
      maxParallelImageRequests: 4,
      maxTileCacheSize: 48,
      refreshExpiredTiles: false,
      disabledOverlays: [...LOW_BANDWIDTH_DISABLED_OVERLAYS],
      prioritySurfaces: ['agid-grid', 'address-candidates'],
    };
  }

  return {
    mode: 'standard',
    lowBandwidth: false,
    preferredStyle: OPENFREEMAP_STYLES.liberty,
    maxParallelImageRequests: 16,
    maxTileCacheSize: 192,
    refreshExpiredTiles: true,
    disabledOverlays: [],
    prioritySurfaces: [],
  };
}

export function isLowBandwidthMapMode(mode: unknown): boolean {
  return getMapBandwidthProfile(mode).lowBandwidth;
}

export function shouldLoadMapOverlayInBandwidthMode(overlay: HeavyMapOverlay, mode: unknown): boolean {
  const profile = getMapBandwidthProfile(mode);
  return !profile.disabledOverlays.includes(overlay);
}

export function resolveBandwidthSafeMapStyle(style: string, mode: unknown): string {
  if (!isLowBandwidthMapMode(mode)) return style;
  return style === 'satellite' ? LOW_BANDWIDTH_VECTOR_STYLE : style;
}
