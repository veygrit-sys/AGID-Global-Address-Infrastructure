import { gridCellsCoverBounds } from './gridGeometry';
import {
GRID_VIEWPORT_RENDER_PADDING_RATIO,
GRID_VIEWPORT_PREFETCH_PADDING_RATIO,
getViewportGridBounds,
getViewportSamplePixelCoordinates,
} from './gridViewport';

type MapViewportPoint = {
  lng: number;
  lat: number;
};

type MapViewportLike = {
  getCanvas: () => { clientWidth: number; clientHeight: number };
  unproject: (point: [number, number]) => MapViewportPoint;
};

export function getMapViewportPoints(map: MapViewportLike | null | undefined): MapViewportPoint[] {
  if (!map) return [];
  const canvas = map.getCanvas();
  return getViewportSamplePixelCoordinates(canvas.clientWidth, canvas.clientHeight)
    .map(([x, y]) => map.unproject([x, y]));
}

export function getGridRenderPaddingRatio(mapPitch: number) {
  return mapPitch > 30 ? 1 : GRID_VIEWPORT_RENDER_PADDING_RATIO;
}

export function getGridPrefetchPaddingRatio(mapPitch: number) {
  return mapPitch > 30 ? 0.35 : GRID_VIEWPORT_PREFETCH_PADDING_RATIO;
}

export function getVisibleGridBounds(points: MapViewportPoint[]) {
  return getViewportGridBounds(points, 0);
}

export function getPaddedGridBounds(points: MapViewportPoint[], mapPitch: number) {
  return getViewportGridBounds(points, getGridRenderPaddingRatio(mapPitch));
}

export function getGridPrefetchBounds(points: MapViewportPoint[], mapPitch: number) {
  return getViewportGridBounds(points, getGridPrefetchPaddingRatio(mapPitch));
}

export function shouldHidePartialGridForViewport(
  gridCells: any[] | null | undefined,
  visibleBounds: [[number, number], [number, number]],
) {
  return Boolean(gridCells?.length) && !gridCellsCoverBounds(gridCells, visibleBounds);
}
