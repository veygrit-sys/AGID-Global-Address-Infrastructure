import {
  Compass,
  Crosshair,
  RotateCcw,
  RotateCw,
  ScanLine,
} from 'lucide-react';
import React from 'react';
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  StyleSpecification,
} from 'maplibre-gl';

import {
  buildTopographicExploreMapGeoJson,
  canApplyTopographicExploreViewport,
  topographicExploreAreaKm2,
  topographicExploreBoundsFromViewport,
} from '../lib/topographicExploreMap';
import type { TopographicBounds } from '../lib/topographicExport';
import { cn } from '../lib/utils';

const LOCAL_EXPLORE_STYLE: StyleSpecification = {
  version: 8,
  name: 'AGID local topographic explorer',
  sources: {},
  layers: [{
    id: 'agid-explore-background',
    type: 'background',
    paint: { 'background-color': '#dbe7eb' },
  }],
};

export type TopographicExploreMapProps = {
  bounds: TopographicBounds;
  maximumAreaKm2: number;
  sourceCount: number;
  sourceBacked: boolean;
  status: 'ready' | 'blocked';
  onBoundsChange: (bounds: TopographicBounds) => void;
};

type ExploreScreenSelection = {
  left: number;
  top: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

function fitBounds(map: MapLibreMap, bounds: TopographicBounds) {
  const east = bounds.east < bounds.west ? bounds.east + 360 : bounds.east;
  map.fitBounds(
    [[bounds.west, bounds.south], [east, bounds.north]],
    {
      duration: 0,
      maxZoom: 16,
      padding: 44,
    },
  );
}

function projectSelection(
  map: MapLibreMap,
  bounds: TopographicBounds,
): ExploreScreenSelection | null {
  const east = bounds.east < bounds.west ? bounds.east + 360 : bounds.east;
  const northWest = map.project([bounds.west, bounds.north]);
  const southEast = map.project([east, bounds.south]);
  const left = Math.min(northWest.x, southEast.x);
  const top = Math.min(northWest.y, southEast.y);
  const width = Math.abs(southEast.x - northWest.x);
  const height = Math.abs(southEast.y - northWest.y);

  if (![left, top, width, height].every(Number.isFinite) || width < 1 || height < 1) {
    return null;
  }

  return {
    left,
    top,
    width,
    height,
    centerX: left + width / 2,
    centerY: top + height / 2,
  };
}

export function TopographicExploreMap({
  bounds,
  maximumAreaKm2,
  sourceCount,
  sourceBacked,
  status,
  onBoundsChange,
}: TopographicExploreMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const [mapStatus, setMapStatus] = React.useState<'loading' | 'ready' | 'blocked'>('loading');
  const [mapError, setMapError] = React.useState<string | null>(null);
  const [viewportBounds, setViewportBounds] = React.useState<TopographicBounds | null>(bounds);
  const [selectionScreen, setSelectionScreen] = React.useState<ExploreScreenSelection | null>(null);
  const [headingDegrees, setHeadingDegrees] = React.useState(0);
  const boundsRef = React.useRef(bounds);
  boundsRef.current = bounds;

  const updateSelectionScreen = React.useCallback((map: MapLibreMap) => {
    setSelectionScreen(projectSelection(map, boundsRef.current));
  }, []);

  const updateHeading = React.useCallback((map: MapLibreMap) => {
    const bearing = map.getBearing();
    if (!Number.isFinite(bearing)) return;
    setHeadingDegrees(Math.round((bearing % 360 + 360) % 360));
  }, []);

  const readViewport = React.useCallback((map: MapLibreMap) => {
    const viewport = map.getBounds();
    const nextBounds = topographicExploreBoundsFromViewport({
      south: viewport.getSouth(),
      west: viewport.getWest(),
      north: viewport.getNorth(),
      east: viewport.getEast(),
    });
    setViewportBounds(nextBounds);
    updateSelectionScreen(map);
    updateHeading(map);
  }, [updateHeading, updateSelectionScreen]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let disposed = false;
    let map: MapLibreMap | null = null;
    let onMoveEnd: (() => void) | null = null;
    let onRotateEnd: (() => void) | null = null;

    void import('maplibre-gl').then(({ default: maplibregl }) => {
      if (disposed) return;
      map = new maplibregl.Map({
        container,
        style: LOCAL_EXPLORE_STYLE,
        attributionControl: false,
        center: [0, 20],
        zoom: 1,
        minZoom: 1,
        maxZoom: 18,
        renderWorldCopies: false,
      });
      mapRef.current = map;
      onMoveEnd = () => {
        if (map) readViewport(map);
      };
      onRotateEnd = () => {
        if (map) updateHeading(map);
      };
      map.once('load', () => {
        if (disposed || !map) return;
        map.addSource('agid-local-explore-selection', {
          type: 'geojson',
          data: buildTopographicExploreMapGeoJson(boundsRef.current) as never,
        });
        map.addLayer({
          id: 'agid-local-explore-fill',
          type: 'fill',
          source: 'agid-local-explore-selection',
          filter: ['==', 'kind', 'selection'],
          paint: {
            'fill-color': '#0f766e',
            'fill-opacity': 0.16,
          },
        } as never);
        map.addLayer({
          id: 'agid-local-explore-grid',
          type: 'line',
          source: 'agid-local-explore-selection',
          filter: ['==', 'kind', 'grid'],
          paint: {
            'line-color': '#0f766e',
            'line-width': 1,
            'line-opacity': 0.48,
            'line-dasharray': [2, 2],
          },
        } as never);
        map.addLayer({
          id: 'agid-local-explore-outline',
          type: 'line',
          source: 'agid-local-explore-selection',
          filter: ['==', 'kind', 'selection'],
          paint: {
            'line-color': '#115e59',
            'line-width': 2,
          },
        } as never);
        map.addLayer({
          id: 'agid-local-explore-focus-halo',
          type: 'circle',
          source: 'agid-local-explore-selection',
          filter: ['==', 'kind', 'focus'],
          paint: {
            'circle-color': '#2dd4bf',
            'circle-radius': 12,
            'circle-opacity': 0.26,
          },
        } as never);
        map.addLayer({
          id: 'agid-local-explore-focus',
          type: 'circle',
          source: 'agid-local-explore-selection',
          filter: ['==', 'kind', 'focus'],
          paint: {
            'circle-color': '#0f766e',
            'circle-radius': 5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          },
        } as never);
        map.on('moveend', onMoveEnd);
        map.on('rotateend', onRotateEnd);
        fitBounds(map, boundsRef.current);
        readViewport(map);
        setMapStatus('ready');
      });
      map.on('error', event => {
        if (disposed) return;
        setMapStatus('blocked');
        setMapError(event.error?.message ?? 'local-explore-map-failed');
      });
    }).catch(error => {
      if (disposed) return;
      setMapStatus('blocked');
      setMapError(error instanceof Error ? error.message : 'local-explore-map-failed');
      });

    return () => {
      disposed = true;
      if (onMoveEnd) map?.off('moveend', onMoveEnd);
      if (onRotateEnd) map?.off('rotateend', onRotateEnd);
      map?.remove();
      if (mapRef.current === map) mapRef.current = null;
    };
  }, [readViewport]);

  React.useEffect(() => {
    setViewportBounds(bounds);
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return;
    const source = map.getSource('agid-local-explore-selection') as GeoJSONSource | undefined;
    source?.setData(buildTopographicExploreMapGeoJson(bounds) as never);
    fitBounds(map, bounds);
    updateSelectionScreen(map);
  }, [bounds, mapStatus, updateSelectionScreen]);

  const viewportAreaKm2 = viewportBounds
    ? topographicExploreAreaKm2(viewportBounds)
    : null;
  const canApplyViewport = viewportBounds !== null
    && canApplyTopographicExploreViewport(viewportBounds, maximumAreaKm2);

  return (
    <div
      data-testid="topographic-explore-map"
      data-map-status={mapStatus}
      data-map-data="local-geojson"
      className="relative h-full min-h-[420px] w-full overflow-hidden bg-[#dbe7eb] lg:min-h-[580px]"
    >
      <div
        ref={containerRef}
        aria-label="Local topographic exploration map"
        className="absolute inset-0"
      />

      <div
        aria-hidden="true"
        data-testid="topographic-explore-reticle"
        className="pointer-events-none absolute inset-0 grid place-items-center"
      >
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-teal-700/30 motion-safe:animate-ping" />
          <span className="absolute inset-2 rounded-full border border-teal-700/45" />
          <span className="absolute inset-[19px] rounded-full border border-teal-800/70 bg-white/65" />
          <Crosshair className="relative h-4 w-4 text-teal-800" strokeWidth={2.25} />
        </div>
      </div>

      {selectionScreen && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden"
        >
          <rect
            x={selectionScreen.left}
            y={selectionScreen.top}
            width={selectionScreen.width}
            height={selectionScreen.height}
            fill="#2dd4bf"
            fillOpacity="0.16"
            stroke="#115e59"
            strokeWidth="2"
          />
          {[1, 2].map(index => {
            const x = selectionScreen.left + (selectionScreen.width * index) / 3;
            const y = selectionScreen.top + (selectionScreen.height * index) / 3;
            return (
              <React.Fragment key={index}>
                <line
                  x1={x}
                  y1={selectionScreen.top}
                  x2={x}
                  y2={selectionScreen.top + selectionScreen.height}
                  stroke="#0f766e"
                  strokeDasharray="5 4"
                  strokeOpacity="0.7"
                />
                <line
                  x1={selectionScreen.left}
                  y1={y}
                  x2={selectionScreen.left + selectionScreen.width}
                  y2={y}
                  stroke="#0f766e"
                  strokeDasharray="5 4"
                  strokeOpacity="0.7"
                />
              </React.Fragment>
            );
          })}
          <circle
            cx={selectionScreen.centerX}
            cy={selectionScreen.centerY}
            r="11"
            fill="#2dd4bf"
            fillOpacity="0.32"
          />
          <circle
            cx={selectionScreen.centerX}
            cy={selectionScreen.centerY}
            r="4"
            fill="#0f766e"
            stroke="#ffffff"
            strokeWidth="2"
          />
        </svg>
      )}

      <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-teal-200 bg-white/95 px-2 text-[10px] font-black text-teal-800 shadow-sm">
          <ScanLine className="h-3.5 w-3.5" />
          EXPLORE
        </span>
        <span className={cn(
          'inline-flex h-7 items-center rounded-md border px-2 text-[10px] font-black shadow-sm',
          sourceBacked
            ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
            : 'border-cyan-200 bg-cyan-50/95 text-cyan-900',
        )}>
          {sourceBacked ? 'EVIDENCED' : 'SYNTHETIC'}
        </span>
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-slate-300 bg-white/95 p-1 shadow-sm">
        <button
          type="button"
          title="Reset map to current selection"
          aria-label="Reset map to current selection"
          onClick={() => {
            const map = mapRef.current;
            if (map) fitBounds(map, bounds);
          }}
          disabled={mapStatus !== 'ready'}
          className="flex h-8 w-8 items-center justify-center rounded text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Use visible map area as the export selection"
          aria-label="Use visible map area as the export selection"
          onClick={() => {
            if (viewportBounds) onBoundsChange(viewportBounds);
          }}
          disabled={mapStatus !== 'ready' || !canApplyViewport}
          className="flex h-8 items-center gap-1.5 rounded bg-slate-900 px-2 text-[10px] font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Crosshair className="h-3.5 w-3.5" />
          Use view
        </button>
      </div>

      <button
        type="button"
        data-testid="topographic-explore-rotate"
        title="Rotate map clockwise by 15 degrees"
        aria-label="Rotate map clockwise by 15 degrees"
        onClick={() => {
          const map = mapRef.current;
          if (!map) return;
          const nextHeading = Math.round((map.getBearing() + 15) % 360);
          map.easeTo({ bearing: nextHeading, duration: 250 });
          setHeadingDegrees(nextHeading);
        }}
        disabled={mapStatus !== 'ready'}
        className="absolute bottom-28 right-3 flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white/95 text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RotateCw className="h-4 w-4" />
      </button>

      <button
        type="button"
        data-testid="topographic-explore-north-up"
        title={`Reset map orientation to north (${headingDegrees} degrees)`}
        aria-label="Reset map orientation to north"
        onClick={() => {
          const map = mapRef.current;
          if (!map) return;
          map.easeTo({ bearing: 0, pitch: 0, duration: 250 });
          setHeadingDegrees(0);
        }}
        disabled={mapStatus !== 'ready'}
        className="absolute bottom-16 right-3 flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white/95 text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Compass
          className="h-4 w-4 transition-transform duration-200"
          style={{ transform: `rotate(${headingDegrees}deg)` }}
        />
      </button>

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-slate-950/88 px-3 py-2 text-[10px] font-bold text-white">
        <span>{viewportAreaKm2?.toFixed(2) ?? '---'} km² view</span>
        <span>9 local grid cells</span>
        <span>HDG {String(headingDegrees).padStart(3, '0')}°</span>
        <span>{sourceCount} source{sourceCount === 1 ? '' : 's'}</span>
        <span className={status === 'ready' ? 'text-emerald-300' : 'text-amber-300'}>
          {status === 'ready' ? 'GATE READY' : 'GATE BLOCKED'}
        </span>
        {!canApplyViewport && mapStatus === 'ready' && (
          <span className="text-amber-300">ZOOM TO {maximumAreaKm2} km²</span>
        )}
      </div>

      {mapStatus === 'blocked' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/95 p-6 text-center">
          <div>
            <p className="text-sm font-black text-slate-900">Explore map blocked</p>
            <p className="mt-2 max-w-md break-words text-xs font-semibold text-slate-600">
              {mapError}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
