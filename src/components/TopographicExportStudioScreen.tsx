import {
  AlertTriangle,
  Box,
  Check,
  Database,
  Download,
  FileBox,
  Grid2X2,
  Layers3,
  Map,
  Mountain,
  ShieldCheck,
  Upload,
  Waves,
  X,
} from 'lucide-react';
import React from 'react';

import { TopographicExploreMap } from './TopographicExploreMap';
import { TopographicTerrainPreview } from './TopographicTerrainPreview';
import {
  AGID_SYNTHETIC_TOPO_SOURCE,
  MAX_TOPOGRAPHIC_EXPORT_AREA_KM2,
  TOPOGRAPHIC_FORMAT_DEFINITIONS,
  TOPOGRAPHIC_LAYER_DEFINITIONS,
  auditTopographicSourceRecord,
  buildTopographicExportPlan,
  createSyntheticTopographicDataset,
  type TopographicBounds,
  type TopographicExportFormat,
  type TopographicLayerId,
  type TopographicSourceRecord,
} from '../lib/topographicExport';
import { serializeTopographicExport } from '../lib/topographicExportSerializers';
import { isSupportedGeoTiffSourceCrs } from '../lib/topographicGeoTiffAdapter';
import type { SerializedCoastalTerrainGltfBundle } from '../lib/topographicCoastalExport';
import type { LocalGeoTiffWorkflowResult } from '../lib/topographicLocalGeoTiffWorkflow';
import { resolveAuditedTerrainPreviewLod } from '../lib/topographicTerrainLodSelection';
import { cn } from '../lib/utils';

const DEFAULT_BOUNDS: TopographicBounds = {
  south: 35.675,
  west: 139.755,
  north: 35.695,
  east: 139.78,
};

const DEFAULT_LAYERS: TopographicLayerId[] = [
  'buildings',
  'cadastral-parcels',
  'roads',
  'railways',
  'waterways',
  'trees-green-spaces',
  'contour-lines',
];

const EMPTY_SOURCE_BACKED_RECORDS: readonly TopographicSourceRecord[] = [];

const MODE_LABELS = {
  '2d-vector': '2D Vector',
  '3d-model': '3D Model',
  raw: 'Raw',
} as const;

/**
 * Keep Studio's source picker aligned with the local GeoTIFF decoder. Source
 * evidence is still audited separately before a record can be selected.
 */
export function isStudioSupportedLocalGeoTiffSourceCrs(
  horizontalCrs: string | undefined,
) {
  return horizontalCrs !== undefined && isSupportedGeoTiffSourceCrs(horizontalCrs);
}

function formatBytes(bytes: number) {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_024 ** 2) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_024 ** 2).toFixed(1)} MB`;
}

function downloadFile(
  data: string | Uint8Array,
  fileName: string,
  mediaType: string,
) {
  const blobPart: BlobPart = typeof data === 'string'
    ? data
    : Uint8Array.from(data);
  const objectUrl = URL.createObjectURL(new Blob([blobPart], { type: mediaType }));
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function NumericField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[10px] font-bold text-slate-500">{label}</span>
      <input
        type="number"
        step="0.001"
        value={Number.isFinite(value) ? value : ''}
        onChange={event => onChange(Number(event.target.value))}
        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function StatusBadge({ ready }: { ready: boolean }) {
  return (
    <span className={cn(
      'inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[10px] font-black uppercase',
      ready
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-amber-200 bg-amber-50 text-amber-800',
    )}>
      {ready ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {ready ? 'Ready' : 'Blocked'}
    </span>
  );
}

export type TopographicExportStudioScreenProps = {
  sourceBackedRecords?: readonly TopographicSourceRecord[];
};

export function TopographicExportStudioScreen({
  sourceBackedRecords = EMPTY_SOURCE_BACKED_RECORDS,
}: TopographicExportStudioScreenProps = {}) {
  const [bounds, setBounds] = React.useState(DEFAULT_BOUNDS);
  const [countryCode, setCountryCode] = React.useState('JP');
  const [crs, setCrs] = React.useState('EPSG:4326');
  const [format, setFormat] = React.useState<TopographicExportFormat>('svg');
  const [layerIds, setLayerIds] = React.useState<TopographicLayerId[]>(DEFAULT_LAYERS);
  const [dataMode, setDataMode] = React.useState<'synthetic' | 'source-backed'>('synthetic');
  const [contourIntervalMeters, setContourIntervalMeters] = React.useState(5);
  const [terrainResolutionMeters, setTerrainResolutionMeters] = React.useState(20);
  const [meshMaxVerticalErrorMeters, setMeshMaxVerticalErrorMeters] =
    React.useState(100);
  const [downloadSummary, setDownloadSummary] = React.useState<string | null>(null);
  const [coastalBundle, setCoastalBundle] =
    React.useState<SerializedCoastalTerrainGltfBundle | null>(null);
  const [coastalBusy, setCoastalBusy] = React.useState(false);
  const [coastalError, setCoastalError] = React.useState<string | null>(null);
  const [importedSourceRecords, setImportedSourceRecords] = React.useState<
    TopographicSourceRecord[]
  >([]);
  const [ledgerSummary, setLedgerSummary] = React.useState<string | null>(null);
  const [ledgerError, setLedgerError] = React.useState<string | null>(null);
  const [geoTiffFile, setGeoTiffFile] = React.useState<File | null>(null);
  const [qualityMaskFile, setQualityMaskFile] = React.useState<File | null>(null);
  const [localSourceId, setLocalSourceId] = React.useState('');
  const [localWorkflowResult, setLocalWorkflowResult] =
    React.useState<LocalGeoTiffWorkflowResult | null>(null);
  const [selectedPreviewLodLevel, setSelectedPreviewLodLevel] =
    React.useState<number | null>(null);
  const [localWorkflowBusy, setLocalWorkflowBusy] = React.useState(false);
  const [localWorkflowError, setLocalWorkflowError] = React.useState<string | null>(null);
  const [previewMode, setPreviewMode] = React.useState<'2d' | '3d' | 'explore'>('3d');
  const [studioNow] = React.useState(() => new Date().toISOString());
  const sourceBackedCandidates = React.useMemo(
    () => {
      const records = new globalThis.Map<string, TopographicSourceRecord>();
      for (const source of sourceBackedRecords) {
        if (!source.syntheticOnly) records.set(source.sourceId, source);
      }
      for (const source of importedSourceRecords) {
        records.set(source.sourceId, source);
      }
      return [...records.values()];
    },
    [importedSourceRecords, sourceBackedRecords],
  );
  const sourceBackedKey = sourceBackedCandidates
    .map(source => (
      `${source.sourceId}@${source.version}@${source.snapshotEvidence?.contentSha256 ?? 'missing'}`
    ))
    .join('|');
  const [enabledSourceIds, setEnabledSourceIds] = React.useState(
    () => new Set(sourceBackedCandidates.map(source => source.sourceId)),
  );

  React.useEffect(() => {
    setEnabledSourceIds(new Set(sourceBackedCandidates.map(source => source.sourceId)));
  }, [sourceBackedKey]);

  const activeSourceBackedRecords = React.useMemo(
    () => sourceBackedCandidates.filter(source => enabledSourceIds.has(source.sourceId)),
    [enabledSourceIds, sourceBackedCandidates],
  );
  const sourceAudits = React.useMemo(
    () => new globalThis.Map(sourceBackedCandidates.map(source => [
      source.sourceId,
      auditTopographicSourceRecord(source, {
        now: studioNow,
        requireSnapshotEvidence: true,
      }),
    ])),
    [sourceBackedCandidates, studioNow],
  );
  const localGeoTiffSources = React.useMemo(
    () => sourceBackedCandidates.filter(source => (
      source.layerIds.includes('terrain-mesh')
      && source.allowedFormats.includes('tiff')
      && isStudioSupportedLocalGeoTiffSourceCrs(source.snapshotEvidence?.horizontalCrs)
      && (sourceAudits.get(source.sourceId)?.length ?? 1) === 0
    )),
    [sourceAudits, sourceBackedCandidates],
  );

  React.useEffect(() => {
    if (
      localSourceId
      && localGeoTiffSources.some(source => source.sourceId === localSourceId)
    ) {
      return;
    }
    setLocalSourceId(localGeoTiffSources[0]?.sourceId ?? '');
  }, [localGeoTiffSources, localSourceId]);

  const formatDefinition = TOPOGRAPHIC_FORMAT_DEFINITIONS.find(item => item.id === format)!;
  const plan = React.useMemo(() => buildTopographicExportPlan({
    bounds,
    countryCode,
    crs,
    format,
    layerIds,
    sourceRecords: dataMode === 'synthetic'
      ? [AGID_SYNTHETIC_TOPO_SOURCE]
      : activeSourceBackedRecords,
    dataMode,
    contourIntervalMeters,
    terrainResolutionMeters,
    now: studioNow,
  }), [
    activeSourceBackedRecords,
    bounds,
    countryCode,
    crs,
    format,
    layerIds,
    dataMode,
    contourIntervalMeters,
    terrainResolutionMeters,
    studioNow,
  ]);
  const displayedPlan = localWorkflowResult?.plan ?? plan;
  const displayedSource = localWorkflowResult?.plan.selectedSources[0]
    ?? (dataMode === 'synthetic'
      ? AGID_SYNTHETIC_TOPO_SOURCE
      : plan.selectedSources[0] ?? activeSourceBackedRecords[0] ?? null);
  const localGeoTiffSource = localGeoTiffSources.find(
    source => source.sourceId === localSourceId,
  ) ?? null;
  const localDerivedLayerIds = layerIds.filter(
    (layerId): layerId is 'terrain-mesh' | 'contour-lines' => (
      (layerId === 'terrain-mesh' || layerId === 'contour-lines')
      && formatDefinition.supportedLayers.includes(layerId)
    ),
  );

  const dataset = React.useMemo(() => {
    try {
      return createSyntheticTopographicDataset(bounds);
    } catch {
      return createSyntheticTopographicDataset(DEFAULT_BOUNDS);
    }
  }, [bounds]);

  const previewUrl = React.useMemo(() => {
    const previewPlan = buildTopographicExportPlan({
      bounds: dataset.bounds,
      countryCode,
      crs: 'EPSG:4326',
      format: 'svg',
      layerIds: DEFAULT_LAYERS,
      sourceRecords: [AGID_SYNTHETIC_TOPO_SOURCE],
      dataMode: 'synthetic',
      contourIntervalMeters: 5,
      terrainResolutionMeters: 20,
      now: dataset.generatedAt,
    });
    const preview = serializeTopographicExport(dataset, previewPlan);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(String(preview.data))}`;
  }, [countryCode, dataset]);
  const localPreviewLodResolution = React.useMemo(() => (
    localWorkflowResult
      ? resolveAuditedTerrainPreviewLod(
          localWorkflowResult.vectorized,
          selectedPreviewLodLevel ?? undefined,
        )
      : null
  ), [localWorkflowResult, selectedPreviewLodLevel]);
  const selectedSourceBackedLod = localPreviewLodResolution?.status === 'ready'
    ? localPreviewLodResolution.selected
    : null;
  const sourceBackedPreviewMesh = selectedSourceBackedLod?.mesh ?? null;
  const previewMesh = sourceBackedPreviewMesh ?? dataset.meshes[0];
  const previewBounds = sourceBackedPreviewMesh
    ? localWorkflowResult!.vectorized.dataset.bounds
    : dataset.bounds;

  const setBound = (key: keyof TopographicBounds, value: number) => {
    setBounds(current => ({ ...current, [key]: value }));
    setDownloadSummary(null);
    setCoastalBundle(null);
    setCoastalError(null);
    setLocalWorkflowResult(null);
    setLocalWorkflowError(null);
  };

  const setExploreBounds = (nextBounds: TopographicBounds) => {
    setBounds(nextBounds);
    setDownloadSummary(null);
    setCoastalBundle(null);
    setCoastalError(null);
    setLocalWorkflowResult(null);
    setLocalWorkflowError(null);
  };

  const selectFormat = (nextFormat: TopographicExportFormat) => {
    const nextDefinition = TOPOGRAPHIC_FORMAT_DEFINITIONS.find(item => item.id === nextFormat)!;
    const compatible = layerIds.filter(layerId => nextDefinition.supportedLayers.includes(layerId));
    setFormat(nextFormat);
    setLayerIds(compatible.length > 0 ? compatible : [nextDefinition.supportedLayers[0]]);
    setDownloadSummary(null);
    setLocalWorkflowResult(null);
    setLocalWorkflowError(null);
  };

  const toggleLayer = (layerId: TopographicLayerId) => {
    if (!formatDefinition.supportedLayers.includes(layerId)) return;
    setLayerIds(current => current.includes(layerId)
      ? current.filter(item => item !== layerId)
      : [...current, layerId]);
    setDownloadSummary(null);
    setLocalWorkflowResult(null);
    setLocalWorkflowError(null);
  };

  const download = () => {
    if (plan.status !== 'ready' || dataMode === 'source-backed') return;
    const output = serializeTopographicExport(dataset, plan);
    downloadFile(output.data, output.fileName, output.mediaType);
    setDownloadSummary(`${output.fileName} · ${formatBytes(output.byteLength)}`);
  };

  const importSourceLedger = async (file: File | null) => {
    setLedgerSummary(null);
    setLedgerError(null);
    setLocalWorkflowResult(null);
    setLocalWorkflowError(null);
    if (!file) return;
    try {
      const { parseTopographicSourceLedger } = await import(
        '../lib/topographicLocalGeoTiffWorkflow'
      );
      const ledger = parseTopographicSourceLedger(await file.text(), {
        now: new Date().toISOString(),
      });
      setImportedSourceRecords(ledger.records);
      setLedgerSummary(
        `${ledger.records.length} approved record${ledger.records.length === 1 ? '' : 's'} · ${ledger.generatedAt}`,
      );
    } catch (error) {
      setImportedSourceRecords([]);
      setLedgerError(error instanceof Error ? error.message : 'Source ledger import failed.');
    }
  };

  const selectGeoTiff = (file: File | null) => {
    setGeoTiffFile(file);
    setQualityMaskFile(null);
    setLocalWorkflowResult(null);
    setLocalWorkflowError(null);
  };

  const selectQualityMask = (file: File | null) => {
    setQualityMaskFile(file);
    setLocalWorkflowResult(null);
    setLocalWorkflowError(null);
  };

  const runLocalGeoTiff = async () => {
    if (
      !geoTiffFile
      || !localGeoTiffSource
      || format === 'tiff'
      || localDerivedLayerIds.length === 0
    ) {
      return;
    }
    setLocalWorkflowBusy(true);
    setLocalWorkflowResult(null);
    setLocalWorkflowError(null);
    try {
      const { runLocalGeoTiffWorkflow } = await import(
        '../lib/topographicLocalGeoTiffWorkflow'
      );
      const generatedAt = new Date().toISOString();
      const result = await runLocalGeoTiffWorkflow({
        arrayBuffer: await geoTiffFile.arrayBuffer(),
        sourceRecord: localGeoTiffSource,
        gridId: `${localGeoTiffSource.sourceId}-local-grid`,
        title: `${localGeoTiffSource.product} local terrain`,
        generatedAt,
        countryCode,
        format,
        layerIds: localDerivedLayerIds,
        contourIntervalMeters,
        meshLodStrides: [1, 2, 4, 8],
        meshMaxVerticalErrorMeters,
        ...(qualityMaskFile
          ? {
              qualityMask: {
                arrayBuffer: await qualityMaskFile.arrayBuffer(),
                encoding: 'gdal-rfc15-validity-byte-mask-v1',
              },
            }
          : {}),
      });
      setBounds(result.decoded.grid.bounds);
      setCrs(result.decoded.grid.horizontalCrs);
      setLocalWorkflowResult(result);
      setSelectedPreviewLodLevel(result.vectorized.meshLods[0]?.level ?? null);
      if (result.vectorized.meshLods.length > 0) setPreviewMode('3d');
    } catch (error) {
      setLocalWorkflowError(
        error instanceof Error ? error.message : 'Local GeoTIFF conversion failed.',
      );
    } finally {
      setLocalWorkflowBusy(false);
    }
  };

  const generateCoastalBundle = async () => {
    if (dataMode !== 'synthetic' || crs !== 'EPSG:4326') return;
    setCoastalBusy(true);
    setCoastalBundle(null);
    setCoastalError(null);
    try {
      const { createSyntheticCoastalTerrainGltfBundle } = await import(
        '../lib/topographicCoastalExport'
      );
      const bundle = await createSyntheticCoastalTerrainGltfBundle({
        bounds,
        countryCode,
        generatedAt: dataset.generatedAt,
      });
      setCoastalBundle(bundle);
    } catch (error) {
      setCoastalError(error instanceof Error ? error.message : 'Coastal bundle failed.');
    } finally {
      setCoastalBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="/"
            aria-label="AGID map"
            title="AGID map"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white transition hover:bg-slate-800"
          >
            <Grid2X2 className="h-4 w-4" />
          </a>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black">Topographic Export Studio</h1>
            <p className="truncate text-[11px] font-semibold text-slate-500">AGID terrain, vector, BIM, CAD and raw export</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-[10px] font-bold text-slate-500 sm:block">{displayedPlan.areaKm2.toFixed(2)} / {MAX_TOPOGRAPHIC_EXPORT_AREA_KM2} km²</span>
          <StatusBadge ready={displayedPlan.status === 'ready'} />
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Map className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs font-black uppercase text-slate-700">Selection</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumericField label="North" value={bounds.north} onChange={value => setBound('north', value)} />
              <NumericField label="East" value={bounds.east} onChange={value => setBound('east', value)} />
              <NumericField label="South" value={bounds.south} onChange={value => setBound('south', value)} />
              <NumericField label="West" value={bounds.west} onChange={value => setBound('west', value)} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label>
                <span className="mb-1 block text-[10px] font-bold text-slate-500">Country</span>
                <input
                  value={countryCode}
                  maxLength={3}
                  onChange={event => {
                    setCountryCode(event.target.value.toUpperCase());
                    setCoastalBundle(null);
                    setCoastalError(null);
                    setLocalWorkflowResult(null);
                    setLocalWorkflowError(null);
                  }}
                  className="h-9 w-full rounded-md border border-slate-300 px-2 text-xs font-bold uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label>
                <span className="mb-1 block text-[10px] font-bold text-slate-500">Projection</span>
                <input
                  value={crs}
                  onChange={event => {
                    setCrs(event.target.value.toUpperCase());
                    setCoastalBundle(null);
                    setCoastalError(null);
                    setLocalWorkflowResult(null);
                    setLocalWorkflowError(null);
                  }}
                  className="h-9 w-full rounded-md border border-slate-300 px-2 text-xs font-bold uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
          </div>

          <div className="border-b border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileBox className="h-4 w-4 text-violet-600" />
              <h2 className="text-xs font-black uppercase text-slate-700">Output</h2>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {TOPOGRAPHIC_FORMAT_DEFINITIONS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  title={`${item.label} · ${MODE_LABELS[item.mode]}`}
                  onClick={() => selectFormat(item.id)}
                  className={cn(
                    'h-9 rounded-md border text-[10px] font-black transition',
                    item.id === format
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400',
                  )}
                >
                  {item.id.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-500">
              <span>{MODE_LABELS[formatDefinition.mode]}</span>
              <span>{formatDefinition.fidelity.replaceAll('-', ' ')}</span>
            </div>
          </div>

          <div className="border-b border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-black uppercase text-slate-700">Layers</h2>
              </span>
              <span className="text-[10px] font-bold text-slate-400">{layerIds.length} selected</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TOPOGRAPHIC_LAYER_DEFINITIONS.map(layer => {
                const compatible = formatDefinition.supportedLayers.includes(layer.id);
                const selected = layerIds.includes(layer.id);
                return (
                  <label
                    key={layer.id}
                    className={cn(
                      'flex min-h-10 items-center gap-2 rounded-md border px-2 py-1.5 text-[10px] font-bold',
                      selected && compatible
                        ? 'border-blue-200 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-600',
                      !compatible && 'cursor-not-allowed opacity-35',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!compatible}
                      onChange={() => toggleLayer(layer.id)}
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600"
                    />
                    <span className="leading-tight">{layer.label}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <NumericField label="Contours (m)" value={contourIntervalMeters} onChange={setContourIntervalMeters} />
              <NumericField label="Terrain mesh (m)" value={terrainResolutionMeters} onChange={setTerrainResolutionMeters} />
              <NumericField label="LOD error cap (m)" value={meshMaxVerticalErrorMeters} onChange={setMeshMaxVerticalErrorMeters} />
            </div>
          </div>

          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-700" />
              <h2 className="text-xs font-black uppercase text-slate-700">Evidence mode</h2>
            </div>
            <div className="grid grid-cols-2 rounded-md border border-slate-200 bg-slate-100 p-1">
              {(['synthetic', 'source-backed'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setDataMode(mode);
                    setDownloadSummary(null);
                    setCoastalBundle(null);
                    setCoastalError(null);
                    setLocalWorkflowResult(null);
                    setLocalWorkflowError(null);
                  }}
                  className={cn(
                    'h-8 rounded text-[10px] font-black capitalize transition',
                    dataMode === mode ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500',
                  )}
                >
                  {mode.replace('-', ' ')}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-md border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Database className="h-3.5 w-3.5 shrink-0 text-blue-700" />
                  <span className="truncate text-[10px] font-black uppercase text-slate-700">
                    Source-backed records
                  </span>
                </span>
                <span className="shrink-0 text-[9px] font-black text-slate-400">
                  {activeSourceBackedRecords.length}/{sourceBackedCandidates.length} selected
                </span>
              </div>
              {sourceBackedCandidates.length === 0 ? (
                <p className="px-3 py-2.5 text-[9px] font-semibold leading-relaxed text-slate-500">
                  No source-backed records connected. Export remains blocked.
                </p>
              ) : (
                <div className="max-h-36 divide-y divide-slate-100 overflow-y-auto">
                  {sourceBackedCandidates.map(source => {
                    const issues = sourceAudits.get(source.sourceId) ?? [];
                    const selected = enabledSourceIds.has(source.sourceId);
                    return (
                      <label
                        key={`${source.sourceId}@${source.version}`}
                        className="flex min-w-0 cursor-pointer items-start gap-2 px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            setEnabledSourceIds(current => {
                              const next = new Set(current);
                              if (next.has(source.sourceId)) next.delete(source.sourceId);
                              else next.add(source.sourceId);
                              return next;
                            });
                            setDownloadSummary(null);
                            setCoastalBundle(null);
                            setCoastalError(null);
                          }}
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 accent-blue-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-[9px] font-black text-slate-800">
                              {source.product}
                            </span>
                            <span className={cn(
                              'shrink-0 text-[8px] font-black uppercase',
                              issues.length === 0 ? 'text-emerald-700' : 'text-amber-700',
                            )}>
                              {issues.length === 0 ? 'Evidence ready' : `${issues.length} gaps`}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[8px] text-slate-400">
                            {source.sourceId} · {source.version}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5 text-violet-700" />
                  <span className="text-[10px] font-black uppercase text-slate-700">
                    Local evidenced GeoTIFF
                  </span>
                </span>
                <span className="text-[8px] font-black uppercase text-emerald-700">
                  Browser only
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <label className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 text-[9px] font-black text-slate-700 hover:border-slate-500">
                  <Database className="h-3.5 w-3.5" />
                  Import ledger
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    onChange={event => {
                      void importSourceLedger(event.target.files?.[0] ?? null);
                      event.target.value = '';
                    }}
                  />
                </label>
                <label className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 text-[9px] font-black text-slate-700 hover:border-slate-500">
                  <FileBox className="h-3.5 w-3.5" />
                  Choose TIFF
                  <input
                    type="file"
                    accept="image/tiff,.tif,.tiff"
                    className="sr-only"
                    onChange={event => selectGeoTiff(event.target.files?.[0] ?? null)}
                  />
                </label>
                <label className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 text-[9px] font-black text-slate-700 hover:border-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Mask8
                  <input
                    type="file"
                    accept="application/octet-stream,.bin,.mask8"
                    className="sr-only"
                    onChange={event => {
                      selectQualityMask(event.target.files?.[0] ?? null);
                      event.target.value = '';
                    }}
                  />
                </label>
              </div>
              {(ledgerSummary || geoTiffFile || qualityMaskFile) && (
                <div className="mt-2 space-y-1 text-[8px] font-semibold text-slate-500">
                  {ledgerSummary && <p className="truncate">Ledger · {ledgerSummary}</p>}
                  {geoTiffFile && (
                    <p className="truncate" title={geoTiffFile.name}>
                      TIFF · {geoTiffFile.name} · {formatBytes(geoTiffFile.size)}
                    </p>
                  )}
                  {qualityMaskFile && (
                    <p className="flex items-center gap-1">
                      <span className="min-w-0 flex-1 truncate" title={qualityMaskFile.name}>
                        MASK8 · {qualityMaskFile.name} · {formatBytes(qualityMaskFile.size)}
                      </span>
                      <button
                        type="button"
                        aria-label="Remove quality mask"
                        onClick={() => selectQualityMask(null)}
                        className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-500 hover:text-slate-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </p>
                  )}
                </div>
              )}
              {ledgerError && (
                <p className="mt-2 text-[8px] font-bold leading-relaxed text-amber-700">
                  {ledgerError}
                </p>
              )}
              <label className="mt-2 block">
                <span className="mb-1 block text-[9px] font-bold text-slate-500">
                  Snapshot-bound source
                </span>
                <select
                  value={localSourceId}
                  disabled={localGeoTiffSources.length === 0}
                  onChange={event => {
                    setLocalSourceId(event.target.value);
                    setLocalWorkflowResult(null);
                    setLocalWorkflowError(null);
                  }}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-[9px] font-bold text-slate-800 outline-none focus:border-blue-500"
                >
                  {localGeoTiffSources.length === 0 && (
                    <option value="">Import an approved EPSG:4326/4269/3857, WGS 84 UTM, or NAD83 UTM DEM record</option>
                  )}
                  {localGeoTiffSources.map(source => (
                    <option key={source.sourceId} value={source.sourceId}>
                      {source.product} · {source.version} · {source.snapshotEvidence?.horizontalCrs}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={
                  localWorkflowBusy
                  || !geoTiffFile
                  || !localGeoTiffSource
                  || format === 'tiff'
                  || localDerivedLayerIds.length === 0
                  || !localGeoTiffSource.allowedFormats.includes(format)
                }
                onClick={() => void runLocalGeoTiff()}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-violet-700 px-3 text-[10px] font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Mountain className="h-3.5 w-3.5" />
                {localWorkflowBusy
                  ? 'Verifying and building...'
                  : `Verify SHA-256 & build ${format.toUpperCase()}`}
              </button>
              {format === 'tiff' && (
                <p className="mt-2 text-[8px] font-bold text-amber-700">
                  Choose a derived vector or 3D format; TIFF passthrough is not an export claim.
                </p>
              )}
              {localDerivedLayerIds.length === 0 && format !== 'tiff' && (
                <p className="mt-2 text-[8px] font-bold text-amber-700">
                  Select terrain mesh or contour lines for local raster conversion.
                </p>
              )}
              {localWorkflowError && (
                <p className="mt-2 text-[8px] font-bold leading-relaxed text-amber-700">
                  {localWorkflowError}
                </p>
              )}
              {localWorkflowResult && (
                <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2">
                  <p className="mb-2 text-center text-[8px] font-black text-emerald-800">
                    {localWorkflowResult.decoded.metadata.sourceHorizontalCrs}
                    {' → '}
                    {localWorkflowResult.decoded.metadata.horizontalCrs}
                    {' · '}
                    {localWorkflowResult.decoded.metadata.coordinateNormalization.method}
                    {' · '}
                    {localWorkflowResult.decoded.metadata.noDataResolution.resolvedCellCount}
                    {' filled'}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <span>
                      <strong className="block text-[10px] text-emerald-900">
                        {localWorkflowResult.vectorized.metrics.gridCellCount}
                      </strong>
                      <span className="text-[7px] font-bold uppercase text-emerald-700">cells</span>
                    </span>
                    <span>
                      <strong className="block text-[10px] text-emerald-900">
                        {localWorkflowResult.vectorized.metrics.triangleCount}
                      </strong>
                      <span className="text-[7px] font-bold uppercase text-emerald-700">triangles</span>
                    </span>
                    <span>
                      <strong className="block text-[10px] text-emerald-900">
                        {localWorkflowResult.vectorized.metrics.meshLodCount}
                      </strong>
                      <span className="text-[7px] font-bold uppercase text-emerald-700">LODs</span>
                    </span>
                  </div>
                  {localWorkflowResult.vectorized.metrics.contourFeatureCount > 0 && (
                    <p className="mt-2 text-center text-[7px] font-bold text-emerald-800">
                      Contour topology ·{' '}
                      {localWorkflowResult.vectorized.metrics.contourFeatureCount}
                      {' lines · '}
                      {localWorkflowResult.vectorized.metrics.contourBoundaryContactCount}
                      {' seam contacts · '}
                      {localWorkflowResult.vectorized.contourTopology.closedLineCount}
                      {' closed'}
                    </p>
                  )}
                  {localWorkflowResult.vectorized.meshLods.length > 0 && (
                    <p className="mt-2 text-center text-[7px] font-bold text-emerald-800">
                      LOD vertical audit ·{' '}
                      {localWorkflowResult.vectorized.meshLodQuality
                        .maximumObservedVerticalErrorMeters}
                      {'m max / '}
                      {localWorkflowResult.vectorized.meshLodQuality
                        .maximumAllowedVerticalErrorMeters ?? 0}
                      {'m cap · all '}
                      {localWorkflowResult.vectorized.meshLodQuality.levels[0]
                        ?.sourceSampleCount ?? 0}
                      {' grid points'}
                    </p>
                  )}
                  {localPreviewLodResolution?.status === 'ready' && (
                    <label className="mt-2 block border-t border-emerald-200 pt-2">
                      <span className="mb-1 block text-[7px] font-black uppercase text-emerald-800">
                        3D preview LOD
                      </span>
                      <select
                        value={selectedSourceBackedLod!.level}
                        onChange={event => setSelectedPreviewLodLevel(Number(event.target.value))}
                        className="h-8 w-full rounded-md border border-emerald-300 bg-white px-2 text-[8px] font-black text-emerald-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                      >
                        {localPreviewLodResolution.available.map(lod => (
                          <option key={lod.level} value={lod.level}>
                            LOD{lod.level} · stride {lod.stride} · {lod.triangleCount.toLocaleString()} triangles
                          </option>
                        ))}
                      </select>
                      <span className="mt-1 block text-[7px] font-bold leading-relaxed text-emerald-800">
                        Grid residual {selectedSourceBackedLod!.quality.maximumAbsoluteVerticalErrorMeters.toFixed(3)} m / {selectedSourceBackedLod!.quality.maximumAllowedVerticalErrorMeters.toFixed(3)} m cap. This is not 3D Tiles geometric error.
                      </span>
                    </label>
                  )}
                  {localPreviewLodResolution?.status === 'blocked' && (
                    <p className="mt-2 flex items-start gap-1.5 border-t border-amber-200 pt-2 text-[7px] font-bold leading-relaxed text-amber-800">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                      3D terrain preview blocked · {localPreviewLodResolution.message}
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => downloadFile(
                        localWorkflowResult.output.data,
                        localWorkflowResult.output.fileName,
                        localWorkflowResult.output.mediaType,
                      )}
                      className="flex h-8 items-center justify-center gap-1 rounded-md bg-emerald-800 px-2 text-[8px] font-black text-white hover:bg-emerald-900"
                    >
                      <Download className="h-3 w-3" />
                      Output
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadFile(
                        localWorkflowResult.evidence.data,
                        localWorkflowResult.evidence.fileName,
                        localWorkflowResult.evidence.mediaType,
                      )}
                      className="flex h-8 items-center justify-center gap-1 rounded-md bg-slate-900 px-2 text-[8px] font-black text-white hover:bg-slate-700"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      Evidence
                    </button>
                  </div>
                  {localWorkflowResult.meshLodBundle && (
                    <div className="mt-2 border-t border-emerald-200 pt-2">
                      <p className="text-center text-[7px] font-black uppercase text-emerald-800">
                        Verified terrain LOD bundle ·{' '}
                        {localWorkflowResult.meshLodBundle.artifacts.length} levels
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {localWorkflowResult.meshLodBundle.artifacts.map(artifact => (
                          <button
                            key={`${artifact.level}-${artifact.stride}`}
                            type="button"
                            onClick={() => downloadFile(
                              artifact.output.data,
                              artifact.output.fileName,
                              artifact.output.mediaType,
                            )}
                            className="flex h-8 items-center justify-center gap-1 rounded-md border border-emerald-300 bg-white px-2 text-[8px] font-black text-emerald-900 hover:border-emerald-500"
                          >
                            <Download className="h-3 w-3" />
                            LOD{artifact.level} · s{artifact.stride}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => downloadFile(
                            localWorkflowResult.meshLodBundle!.manifest.data,
                            localWorkflowResult.meshLodBundle!.manifest.fileName,
                            localWorkflowResult.meshLodBundle!.manifest.mediaType,
                          )}
                          className="flex h-8 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 text-[8px] font-black text-slate-800 hover:border-slate-500"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          LOD manifest
                        </button>
                      </div>
                    </div>
                  )}
                  {localWorkflowResult.threeDTiles?.status === 'ready' && (
                    <div className="mt-2 border-t border-emerald-200 pt-2">
                      <p className="text-center text-[7px] font-black uppercase text-emerald-800">
                        3D Tiles 1.1 · EPSG:4978 placement ready
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => downloadFile(
                            localWorkflowResult.threeDTiles!.bundle!.tileset.data,
                            localWorkflowResult.threeDTiles!.bundle!.tileset.fileName,
                            localWorkflowResult.threeDTiles!.bundle!.tileset.mediaType,
                          )}
                          className="flex h-8 items-center justify-center gap-1 rounded-md bg-cyan-800 px-2 text-[8px] font-black text-white hover:bg-cyan-900"
                        >
                          <Download className="h-3 w-3" />
                          tileset.json
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadFile(
                            localWorkflowResult.threeDTiles!.bundle!.evidence.data,
                            localWorkflowResult.threeDTiles!.bundle!.evidence.fileName,
                            localWorkflowResult.threeDTiles!.bundle!.evidence.mediaType,
                          )}
                          className="flex h-8 items-center justify-center gap-1 rounded-md bg-slate-900 px-2 text-[8px] font-black text-white hover:bg-slate-700"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          3D evidence
                        </button>
                      </div>
                    </div>
                  )}
                  {localWorkflowResult.threeDTiles?.status === 'blocked' && (
                    <p className="mt-2 flex items-start gap-1.5 border-t border-amber-200 pt-2 text-[7px] font-bold leading-relaxed text-amber-800">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                      3D Tiles blocked ·{' '}
                      {localWorkflowResult.threeDTiles.issues
                        .map(issue => issue.message)
                        .join(' ')}
                    </p>
                  )}
                </div>
              )}
              <p className="mt-2 text-[8px] font-semibold leading-relaxed text-slate-500">
                Bytes remain in this browser session. Imported ledgers are operator-provided,
                not publisher-signed. Optional Mask8 is 1 byte per pixel: 0 invalid, 255 valid,
                and its hash must be source-bound. No upload, address data, or AOID material is used.
              </p>
            </div>
            <button
              type="button"
              disabled={
                plan.status !== 'ready'
                || dataMode === 'source-backed'
                || localWorkflowResult !== null
              }
              onClick={download}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Download className="h-4 w-4" />
              {localWorkflowResult
                ? 'Use verified downloads above'
                : dataMode === 'source-backed'
                ? 'Use evidenced GeoTIFF workflow'
                : `Export ${format.toUpperCase()}`}
            </button>
            {downloadSummary && <p className="mt-2 truncate text-center text-[10px] font-bold text-emerald-700">{downloadSummary}</p>}
            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Waves className="h-4 w-4 text-cyan-700" />
                  <span className="text-[10px] font-black uppercase text-slate-700">Coastal 3D bundle</span>
                </span>
                <span className="text-[9px] font-black uppercase text-slate-400">3 sources</span>
              </div>
              <button
                type="button"
                disabled={dataMode !== 'synthetic' || crs !== 'EPSG:4326' || coastalBusy}
                onClick={generateCoastalBundle}
                className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-cyan-300 bg-cyan-50 px-3 text-[10px] font-black text-cyan-900 transition hover:border-cyan-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Mountain className="h-3.5 w-3.5" />
                {coastalBusy ? 'Generating...' : 'Generate GLTF + evidence'}
              </button>
              {coastalBundle && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => downloadFile(
                      coastalBundle.model.data,
                      'agid-synthetic-coastal.gltf',
                      coastalBundle.model.mediaType,
                    )}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-slate-900 px-2 text-[9px] font-black text-white hover:bg-slate-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    GLTF
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadFile(
                      coastalBundle.manifest.data,
                      'agid-synthetic-coastal.coastal-manifest.json',
                      coastalBundle.manifest.mediaType,
                    )}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-slate-900 px-2 text-[9px] font-black text-white hover:bg-slate-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Evidence
                  </button>
                </div>
              )}
              {coastalError && (
                <p className="mt-2 text-[9px] font-bold leading-relaxed text-amber-700">
                  {coastalError}
                </p>
              )}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="grid border-b border-slate-200 bg-slate-950 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="relative min-h-[420px] overflow-hidden border-b border-white/10 bg-[#e6edf3] lg:min-h-[580px] lg:border-b-0 lg:border-r">
              {previewMode === 'explore' ? (
                <TopographicExploreMap
                  bounds={bounds}
                  maximumAreaKm2={MAX_TOPOGRAPHIC_EXPORT_AREA_KM2}
                  sourceCount={displayedPlan.selectedSources.length}
                  sourceBacked={dataMode === 'source-backed'}
                  status={displayedPlan.status}
                  onBoundsChange={setExploreBounds}
                />
              ) : previewMode === '3d' ? (
                localWorkflowResult && localPreviewLodResolution?.status === 'blocked' ? (
                  <div className="flex min-h-[420px] items-center justify-center bg-amber-50 p-6 text-center lg:min-h-[580px]">
                    <div className="max-w-md">
                      <AlertTriangle className="mx-auto h-6 w-6 text-amber-700" />
                      <p className="mt-3 text-sm font-black text-amber-950">Local 3D terrain preview blocked</p>
                      <p className="mt-2 text-xs font-semibold leading-relaxed text-amber-900">
                        {localPreviewLodResolution.message}
                      </p>
                    </div>
                  </div>
                ) : (
                  <TopographicTerrainPreview
                    bounds={previewBounds}
                    mesh={previewMesh}
                    sourceBacked={Boolean(sourceBackedPreviewMesh)}
                    lod={selectedSourceBackedLod ? {
                      level: selectedSourceBackedLod.level,
                      stride: selectedSourceBackedLod.stride,
                      maximumAbsoluteVerticalErrorMeters:
                        selectedSourceBackedLod.quality.maximumAbsoluteVerticalErrorMeters,
                      maximumAllowedVerticalErrorMeters:
                        selectedSourceBackedLod.quality.maximumAllowedVerticalErrorMeters,
                    } : undefined}
                  />
                )
              ) : (
                <div className="flex min-h-[420px] items-center justify-center p-5 lg:min-h-[580px]">
                  <img
                    src={previewUrl}
                    alt="Synthetic topographic export preview"
                    className="h-auto max-h-[540px] w-full max-w-[900px] object-contain"
                  />
                  <span className="absolute left-3 top-3 rounded-md border border-slate-300 bg-white/95 px-2 py-1 text-[10px] font-black text-slate-700 shadow-sm">
                    {localWorkflowResult
                      ? 'SYNTHETIC PREVIEW · NOT LOCAL OUTPUT'
                      : 'SYNTHETIC PREVIEW'}
                  </span>
                </div>
              )}
              <div
                aria-label="Preview mode"
                className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 rounded-md border border-slate-300 bg-white/95 p-1 shadow-sm"
              >
                <button
                  type="button"
                  aria-pressed={previewMode === '2d'}
                  onClick={() => setPreviewMode('2d')}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded px-2 text-[10px] font-black transition',
                    previewMode === '2d'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Map className="h-3.5 w-3.5" />
                  2D
                </button>
                <button
                  type="button"
                  aria-pressed={previewMode === '3d'}
                  onClick={() => setPreviewMode('3d')}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded px-2 text-[10px] font-black transition',
                    previewMode === '3d'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Box className="h-3.5 w-3.5" />
                  3D
                </button>
                <button
                  type="button"
                  aria-pressed={previewMode === 'explore'}
                  onClick={() => setPreviewMode('explore')}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded px-2 text-[10px] font-black transition',
                    previewMode === 'explore'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Map className="h-3.5 w-3.5" />
                  Explore
                </button>
              </div>
              {previewMode === '2d' && (
                <span className="absolute bottom-3 right-3 rounded-md bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-white">
                  {bounds.west.toFixed(4)}, {bounds.south.toFixed(4)} · {bounds.east.toFixed(4)}, {bounds.north.toFixed(4)}
                </span>
              )}
            </div>

            <div className="bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-2">
                <Mountain className="h-4 w-4 text-cyan-300" />
                <h2 className="text-xs font-black uppercase">Export gate</h2>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
                <div>
                  <dt className="text-[9px] font-bold uppercase text-slate-500">Area</dt>
                  <dd className="mt-0.5 text-sm font-black">{displayedPlan.areaKm2.toFixed(2)} km²</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-bold uppercase text-slate-500">Format</dt>
                  <dd className="mt-0.5 text-sm font-black">{formatDefinition.label}</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-bold uppercase text-slate-500">CRS</dt>
                  <dd className="mt-0.5 text-sm font-black">{crs}</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-bold uppercase text-slate-500">Sources</dt>
                  <dd className="mt-0.5 text-sm font-black">{displayedPlan.selectedSources.length}</dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-white/10 pt-4">
                <h3 className="text-[9px] font-black uppercase text-slate-400">Checks</h3>
                <div className="mt-2 space-y-2">
                  {displayedPlan.issues.length === 0 && (
                    <p className="flex items-center gap-2 text-[10px] font-bold text-emerald-300">
                      <Check className="h-3.5 w-3.5" />
                      All gates passed
                    </p>
                  )}
                  {displayedPlan.issues.map(issue => (
                    <p
                      key={`${issue.code}-${issue.layerId ?? ''}-${issue.sourceId ?? ''}`}
                      className={cn(
                        'flex gap-2 text-[10px] font-semibold leading-relaxed',
                        issue.severity === 'error' ? 'text-amber-300' : 'text-slate-300',
                      )}
                    >
                      {issue.severity === 'error'
                        ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        : <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                      {issue.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid bg-white md:grid-cols-2">
            <div className="border-b border-slate-200 p-5 md:border-b-0 md:border-r">
              <h2 className="text-xs font-black uppercase text-slate-700">Active source record</h2>
              {displayedSource ? (
                <dl className="mt-3 grid grid-cols-[100px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[10px]">
                  <dt className="font-bold text-slate-400">Publisher</dt>
                  <dd className="font-bold text-slate-800">{displayedSource.publisher}</dd>
                  <dt className="font-bold text-slate-400">Product</dt>
                  <dd className="font-bold text-slate-800">{displayedSource.product}</dd>
                  <dt className="font-bold text-slate-400">Version</dt>
                  <dd className="break-all font-mono text-slate-700">{displayedSource.version}</dd>
                  <dt className="font-bold text-slate-400">License</dt>
                  <dd className="font-bold text-slate-800">{displayedSource.licenseId}</dd>
                  <dt className="font-bold text-slate-400">Snapshot</dt>
                  <dd
                    title={displayedSource.snapshotEvidence?.contentSha256}
                    className="truncate font-mono text-slate-700"
                  >
                    {displayedSource.snapshotEvidence?.contentSha256 ?? 'synthetic fixture'}
                  </dd>
                  <dt className="font-bold text-slate-400">Reference</dt>
                  <dd className="truncate font-bold text-slate-800">
                    {displayedSource.snapshotEvidence
                      ? `${displayedSource.snapshotEvidence.horizontalCrs} · ${displayedSource.snapshotEvidence.verticalDatum}`
                      : 'synthetic-only'}
                  </dd>
                  <dt className="font-bold text-slate-400">Correction</dt>
                  <dd className="truncate">
                    <a className="font-bold text-blue-700 hover:underline" href={displayedSource.correctionUrl}>
                      Correction route
                    </a>
                  </dd>
                </dl>
              ) : (
                <p className="mt-3 text-[10px] font-semibold text-slate-500">
                  Select an evidenced source record to inspect it.
                </p>
              )}
            </div>
            <div className="p-5">
              <h2 className="text-xs font-black uppercase text-slate-700">Safety boundary</h2>
              <ul className="mt-3 space-y-2">
                {displayedPlan.nonClaims.map(item => (
                  <li key={item} className="flex gap-2 text-[10px] font-semibold leading-relaxed text-slate-600">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default TopographicExportStudioScreen;
