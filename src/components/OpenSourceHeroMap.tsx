import { Grid3X3, Loader2, LocateFixed, Minus, Plus, RefreshCw, Search } from 'lucide-react';
import React from 'react';
import type maplibregl from 'maplibre-gl';

import { useAgidGridLayer } from '../hooks/useAgidGridLayer';
import { useMapLibreLayerSync } from '../hooks/useMapLibreLayerSync';
import { decodeAGID, encodeAGID, type AGIDResult } from '../lib/agid';
import { OPENFREEMAP_STYLES, registerPmtilesProtocol } from '../lib/mapEngine';
import type { PhotonFeature } from '../types/navigation';

type OpenSourceHeroMapProps = {
  locale: 'en' | 'ja';
};

const INITIAL_VIEW = {
  lat: 35.6427,
  lng: 139.7538,
  zoom: 18.7,
};

const MAP_LOAD_TIMEOUT_MS = 15_000;

const mapCopy = {
  en: {
    label: 'Interactive AGID vector map',
    loading: 'Preparing the map',
    loadingDetail: 'Loading map data and the AGID grid…',
    unavailable: 'The vector map could not be loaded.',
    retry: 'Try again',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    locate: 'Move to current location',
    grid: 'Toggle AGID grid',
    gridBusy: 'Updating AGID grid',
    gridReady: 'AGID grid visible',
    gridHidden: 'AGID grid hidden',
    searchLabel: 'Search the map',
    searchPlaceholder: 'Address, postal code, or AGID',
    searchAction: 'Search',
    noResults: 'No matching places were found.',
    searchError: 'Search is temporarily unavailable.',
    selectedId: 'Selected AGID',
    copyId: 'Copy selected AGID',
    copied: 'Copied',
    copyFailed: 'Could not copy',
  },
  ja: {
    label: '操作できるAGIDベクター地図',
    loading: '地図を準備しています',
    loadingDetail: '地図データとAGID Gridを読み込んでいます…',
    unavailable: 'ベクター地図を読み込めませんでした。',
    retry: '再読み込み',
    zoomIn: '拡大',
    zoomOut: '縮小',
    locate: '現在地へ移動',
    grid: 'AGID Gridの表示切替',
    gridBusy: 'AGID Gridを更新中',
    gridReady: 'AGID Gridを表示中',
    gridHidden: 'AGID Gridは非表示です',
    searchLabel: '地図を検索',
    searchPlaceholder: '住所・郵便番号・AGIDを検索',
    searchAction: '検索',
    noResults: '一致する場所が見つかりませんでした。',
    searchError: '現在検索を利用できません。',
    selectedId: '選択中のAGID',
    copyId: '選択中のAGIDをコピー',
    copied: 'コピーされました',
    copyFailed: 'コピーできませんでした',
  },
} as const;

function getPhotonFeatureLabel(feature: PhotonFeature) {
  const values = [
    feature.properties.name,
    feature.properties.postcode,
    feature.properties.city,
    feature.properties.state,
    feature.properties.country,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  return [...new Set(values)].join(', ') || 'Selected location';
}

export function OpenSourceHeroMap({ locale }: OpenSourceHeroMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const gridWorkerRef = React.useRef<Worker | null>(null);
  const selectedResultRef = React.useRef<AGIDResult | null>(null);
  const gridUpdateRef = React.useRef<ReturnType<typeof useAgidGridLayer> | null>(null);
  const copyAnnouncementTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = React.useRef(0);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [loadAttempt, setLoadAttempt] = React.useState(0);
  const [isGridVisible, setIsGridVisible] = React.useState(true);
  const [isGridRegenerating, setIsGridRegenerating] = React.useState(false);
  const [viewport, setViewport] = React.useState(INITIAL_VIEW);
  const [selectedResult, setSelectedResult] = React.useState<AGIDResult>(() =>
    encodeAGID(INITIAL_VIEW.lat, INITIAL_VIEW.lng),
  );
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<PhotonFeature[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchMessage, setSearchMessage] = React.useState('');
  const [copyMessage, setCopyMessage] = React.useState('');
  const copy = mapCopy[locale];
  const isMapReady = isLoaded && !loadFailed;
  const ensureSourceAndLayer = useMapLibreLayerSync(mapRef, OPENFREEMAP_STYLES.bright);
  const updateGrid = useAgidGridLayer({
    map: mapRef,
    gridWorker: gridWorkerRef,
    lat: viewport.lat,
    lng: viewport.lng,
    zoom: viewport.zoom,
    mapPitch: 0,
    mapStyle: OPENFREEMAP_STYLES.bright,
    isGridVisible,
    gridOpacityLevel: 4,
    ensureSourceAndLayer,
    setIsGridRegenerating,
  });

  React.useEffect(() => {
    selectedResultRef.current = selectedResult;
  }, [selectedResult]);

  React.useEffect(() => {
    gridUpdateRef.current = updateGrid;
  }, [updateGrid]);

  React.useEffect(() => {
    gridWorkerRef.current = new Worker(new URL('../lib/gridWorker.ts', import.meta.url), { type: 'module' });
    return () => {
      gridWorkerRef.current?.terminate();
      gridWorkerRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let map: maplibregl.Map | null = null;
    let moveFrame: number | null = null;
    const loadTimeout = window.setTimeout(() => {
      if (!disposed) setLoadFailed(true);
    }, MAP_LOAD_TIMEOUT_MS);

    void import('maplibre-gl').then(({ default: maplibre }) => {
      if (disposed || !containerRef.current) return;
      registerPmtilesProtocol(maplibre);
      map = new maplibre.Map({
        container: containerRef.current,
        style: OPENFREEMAP_STYLES.bright,
        center: [INITIAL_VIEW.lng, INITIAL_VIEW.lat],
        zoom: INITIAL_VIEW.zoom,
        pitch: 0,
        bearing: 0,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
      });
      mapRef.current = map;

      map.addControl(new maplibre.ScaleControl({ maxWidth: 110, unit: 'metric' }), 'bottom-right');
      map.on('load', () => {
        window.clearTimeout(loadTimeout);
        if (!disposed) {
          setLoadFailed(false);
          setIsLoaded(true);
        }
      });
      map.on('move', () => {
        if (disposed || !map || moveFrame !== null) return;
        moveFrame = window.requestAnimationFrame(() => {
          moveFrame = null;
          if (disposed || !map) return;
          const center = map.getCenter();
          gridUpdateRef.current?.(
            encodeAGID(center.lat, center.lng),
            selectedResultRef.current || undefined,
            4,
            false,
          );
        });
      });
      map.on('moveend', () => {
        if (disposed || !map) return;
        const center = map.getCenter();
        setViewport({
          lat: center.lat,
          lng: center.lng,
          zoom: map.getZoom(),
        });
      });
      map.on('click', event => {
        if (!disposed) {
          setSelectedResult(encodeAGID(event.lngLat.lat, event.lngLat.lng));
        }
      });

      resizeObserver = new ResizeObserver(() => map?.resize());
      resizeObserver.observe(containerRef.current);
    }).catch(() => {
      window.clearTimeout(loadTimeout);
      if (!disposed) setLoadFailed(true);
    });

    return () => {
      disposed = true;
      window.clearTimeout(loadTimeout);
      if (moveFrame !== null) window.cancelAnimationFrame(moveFrame);
      resizeObserver?.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  }, [loadAttempt]);

  React.useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const center = mapRef.current.getCenter();
    updateGrid(encodeAGID(center.lat, center.lng), selectedResult, 4, true);
  }, [isGridVisible, isLoaded, selectedResult, updateGrid, viewport]);

  React.useEffect(() => () => {
    if (copyAnnouncementTimerRef.current) clearTimeout(copyAnnouncementTimerRef.current);
    searchRequestRef.current += 1;
  }, []);

  const selectCoordinates = React.useCallback((lat: number, lng: number, label?: string) => {
    const result = encodeAGID(lat, lng);
    setSelectedResult(result);
    if (label) setSearchQuery(label);
    setSearchResults([]);
    setSearchMessage('');
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: Math.max(mapRef.current.getZoom(), 18.7),
      essential: true,
    });
  }, []);

  const handleSearch = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isMapReady) return;
    const query = searchQuery.trim();
    if (!query) return;

    const decoded = decodeAGID(query);
    if (decoded) {
      selectCoordinates(decoded.lat, decoded.lon, encodeAGID(decoded.lat, decoded.lon).id);
      return;
    }

    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setIsSearching(true);
    setSearchMessage('');
    try {
      const { fetchPhotonFeatures } = await import('../services/RouteSearchService');
      const results = await fetchPhotonFeatures(query, 5);
      if (requestId !== searchRequestRef.current) return;
      setSearchResults(results);
      if (results.length === 0) setSearchMessage(copy.noResults);
    } catch {
      if (requestId === searchRequestRef.current) {
        setSearchResults([]);
        setSearchMessage(copy.searchError);
      }
    } finally {
      if (requestId === searchRequestRef.current) setIsSearching(false);
    }
  }, [copy.noResults, copy.searchError, isMapReady, searchQuery, selectCoordinates]);

  const retryMapLoad = React.useCallback(() => {
    setIsLoaded(false);
    setLoadFailed(false);
    setIsGridRegenerating(false);
    setLoadAttempt(attempt => attempt + 1);
  }, []);

  const copySelectedId = React.useCallback(async () => {
    if (copyAnnouncementTimerRef.current) clearTimeout(copyAnnouncementTimerRef.current);
    try {
      await navigator.clipboard.writeText(selectedResult.id);
      setCopyMessage(copy.copied);
    } catch {
      setCopyMessage(copy.copyFailed);
    }
    copyAnnouncementTimerRef.current = setTimeout(() => setCopyMessage(''), 2000);
  }, [copy.copied, copy.copyFailed, selectedResult.id]);

  const moveToCurrentLocation = React.useCallback(() => {
    if (!mapRef.current || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(position => {
      mapRef.current?.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 18.7),
        essential: true,
      });
    });
  }, []);

  return (
    <section
      className="relative h-[58svh] min-h-[430px] w-full overflow-hidden border-y border-slate-200 bg-slate-100 sm:h-[64svh] sm:min-h-[560px] lg:h-[68svh] lg:max-h-[760px]"
      aria-label={copy.label}
      aria-busy={!isMapReady}
      data-map-status={loadFailed ? 'failed' : isMapReady ? 'ready' : 'loading'}
    >
      <div ref={containerRef} className="h-full w-full" />

      {!isMapReady ? (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-slate-100 px-6"
          style={{
            backgroundImage: 'linear-gradient(rgba(100, 116, 139, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.12) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          role={loadFailed ? 'alert' : 'status'}
          aria-live="polite"
        >
          <div className="w-full max-w-xs border border-slate-300 bg-white px-5 py-4 shadow-lg shadow-slate-900/10">
            {loadFailed ? (
              <>
                <p className="text-[13px] font-bold text-slate-800">{copy.unavailable}</p>
                <button
                  type="button"
                  onClick={retryMapLoad}
                  className="mt-4 inline-flex h-10 items-center gap-2 bg-slate-950 px-4 text-[12px] font-bold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  {copy.retry}
                </button>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-blue-600 motion-reduce:animate-none" aria-hidden="true" />
                <div>
                  <p className="text-[13px] font-bold text-slate-900">{copy.loading}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-600">{copy.loadingDetail}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div
        className={`absolute left-4 right-20 top-4 z-20 max-w-md transition-opacity duration-300 sm:left-6 sm:right-auto sm:top-6 sm:w-[420px] ${isMapReady ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!isMapReady}
      >
        <form onSubmit={handleSearch} className="flex h-11 border border-slate-300 bg-white shadow-lg shadow-slate-900/10" role="search">
          <label htmlFor="open-source-map-search" className="sr-only">{copy.searchLabel}</label>
          <Search className="ml-3 h-4 w-4 shrink-0 self-center text-slate-500" aria-hidden="true" />
          <input
            id="open-source-map-search"
            value={searchQuery}
            onChange={event => {
              setSearchQuery(event.target.value);
              setSearchMessage('');
              if (searchResults.length) setSearchResults([]);
            }}
            placeholder={copy.searchPlaceholder}
            autoComplete="off"
            disabled={!isMapReady}
            className="min-w-0 flex-1 bg-transparent px-3 text-[13px] font-bold text-slate-950 outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!isMapReady || isSearching || searchQuery.trim().length === 0}
            className="flex w-11 shrink-0 items-center justify-center border-l border-slate-200 bg-slate-950 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            aria-label={copy.searchAction}
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </form>
        {searchResults.length > 0 ? (
          <ul className="max-h-60 overflow-y-auto border-x border-b border-slate-200 bg-white shadow-xl shadow-slate-900/10">
            {searchResults.map((feature, index) => {
              const label = getPhotonFeatureLabel(feature);
              return (
                <li key={`${feature.geometry.coordinates.join(',')}-${index}`} className="border-b border-slate-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => selectCoordinates(feature.geometry.coordinates[1], feature.geometry.coordinates[0], label)}
                    className="block min-h-12 w-full px-4 py-3 text-left text-[12px] font-bold leading-5 text-slate-800 transition hover:bg-blue-50 focus-visible:bg-blue-50"
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {searchMessage ? (
          <p role="status" className="border-x border-b border-slate-200 bg-white px-4 py-3 text-[12px] font-bold text-slate-600 shadow-lg">
            {searchMessage}
          </p>
        ) : null}
      </div>

      <div
        className={`absolute right-4 top-4 z-10 flex flex-col border border-slate-300 bg-white transition-opacity duration-300 sm:right-6 sm:top-6 ${isMapReady ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!isMapReady}
      >
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          disabled={!isMapReady}
          className="flex h-10 w-10 items-center justify-center border-b border-slate-200 text-slate-800 transition hover:bg-slate-100 focus-visible:z-10"
          aria-label={copy.zoomIn}
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          disabled={!isMapReady}
          className="flex h-10 w-10 items-center justify-center border-b border-slate-200 text-slate-800 transition hover:bg-slate-100 focus-visible:z-10"
          aria-label={copy.zoomOut}
        >
          <Minus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={moveToCurrentLocation}
          disabled={!isMapReady}
          className="flex h-10 w-10 items-center justify-center border-b border-slate-200 text-slate-800 transition hover:bg-slate-100 focus-visible:z-10"
          aria-label={copy.locate}
        >
          <LocateFixed className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-pressed={isGridVisible}
          onClick={() => setIsGridVisible(value => !value)}
          disabled={!isMapReady}
          className={isGridVisible
            ? 'flex h-10 w-10 items-center justify-center bg-blue-600 text-white transition hover:bg-blue-700 focus-visible:z-10'
            : 'flex h-10 w-10 items-center justify-center text-slate-800 transition hover:bg-slate-100 focus-visible:z-10'}
          aria-label={copy.grid}
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
      </div>

      <div
        className={`absolute bottom-12 left-4 z-20 max-w-[calc(100%-6.5rem)] border border-slate-300 bg-white px-3 py-2 shadow-lg shadow-slate-900/10 transition-opacity duration-300 sm:bottom-6 sm:left-6 ${isMapReady ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!isMapReady}
      >
        <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{copy.selectedId}</span>
        <button
          type="button"
          onClick={copySelectedId}
          disabled={!isMapReady}
          className="mt-1 block max-w-full truncate font-mono text-[13px] font-black tracking-[0.08em] text-slate-950 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          aria-label={`${copy.copyId}: ${selectedResult.id}`}
          title={copy.copyId}
        >
          {selectedResult.id}
        </button>
        <p role="status" aria-live="polite" aria-atomic="true" className="pointer-events-none absolute left-0 top-full mt-1 whitespace-nowrap bg-slate-950 px-3 py-2 text-[11px] font-bold text-white empty:hidden">
          {copyMessage}
        </p>
      </div>

      <p className="sr-only" aria-live="polite">
        {isGridVisible ? (isGridRegenerating ? copy.gridBusy : copy.gridReady) : copy.gridHidden}
      </p>
    </section>
  );
}
