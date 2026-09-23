export const TOPOGRAPHIC_EXPORT_MODEL_VERSION = 'agid-topographic-export-v0.1';
export const MAX_TOPOGRAPHIC_EXPORT_AREA_KM2 = 50;

export type TopographicExportMode = '2d-vector' | '3d-model' | 'raw';

export type TopographicExportFormat =
  | 'dxf'
  | 'pdf'
  | 'svg'
  | 'ifc'
  | 'obj'
  | 'gltf'
  | 'stl'
  | 'geojson'
  | 'tiff'
  | 'txt';

export type TopographicLayerId =
  | 'satellite-imagery'
  | 'buildings'
  | 'building-roofs-lod2'
  | 'cadastral-parcels'
  | 'roads'
  | 'railways'
  | 'waterways'
  | 'building-shadows'
  | 'trees-green-spaces'
  | 'trees-hedges'
  | 'contour-lines'
  | 'terrain-mesh';

export type TopographicBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type TopographicCoverage =
  | { scope: 'global'; description: string }
  | { scope: 'country'; countryCodes: string[]; description: string }
  | { scope: 'bbox'; bounds: TopographicBounds; description: string };

export type TopographicSnapshotEvidence = {
  contentSha256: `sha256:${string}`;
  adapterVersion: string;
  verifiedAt: string;
  horizontalCrs: string;
  verticalDatum: string;
  relatedArtifactSha256?: `sha256:${string}`[];
};

export type TopographicSourceRecord = {
  sourceId: string;
  publisher: string;
  product: string;
  sourceUrl: string;
  termsUrl: string;
  licenseId: string;
  version: string;
  publishedAt: string;
  retrievedAt: string;
  freshUntil?: string;
  attribution: string;
  correctionUrl: string;
  coverage: TopographicCoverage;
  layerIds: TopographicLayerId[];
  allowedFormats: TopographicExportFormat[];
  reuseStatus: 'approved' | 'pending' | 'prohibited';
  syntheticOnly?: boolean;
  snapshotEvidence?: TopographicSnapshotEvidence;
  notes?: string[];
};

export type TopographicGeometry =
  | { type: 'Point'; coordinates: [number, number, number?] }
  | { type: 'LineString'; coordinates: Array<[number, number, number?]> }
  | { type: 'Polygon'; coordinates: Array<Array<[number, number, number?]>> };

export type TopographicFeature = {
  id: string;
  layerId: Exclude<TopographicLayerId, 'satellite-imagery' | 'terrain-mesh'>;
  geometry: TopographicGeometry;
  properties: Record<string, string | number | boolean | null>;
  sourceId: string;
};

export type TopographicMesh = {
  id: string;
  layerId: 'terrain-mesh' | 'buildings' | 'building-roofs-lod2';
  vertices: Array<[number, number, number]>;
  triangles: Array<[number, number, number]>;
  sourceId: string;
};

export type TopographicRaster = {
  id: string;
  layerId: 'satellite-imagery' | 'terrain-mesh';
  width: number;
  height: number;
  pixels: Uint8Array;
  bounds: TopographicBounds;
  sourceId: string;
};

export type TopographicDataset = {
  datasetId: string;
  title: string;
  bounds: TopographicBounds;
  crs: string;
  generatedAt: string;
  synthetic: boolean;
  features: TopographicFeature[];
  meshes: TopographicMesh[];
  rasters: TopographicRaster[];
};

export type TopographicExportRequest = {
  bounds: TopographicBounds;
  countryCode?: string;
  crs: string;
  format: TopographicExportFormat;
  layerIds: TopographicLayerId[];
  sourceRecords: TopographicSourceRecord[];
  dataMode: 'synthetic' | 'source-backed';
  contourIntervalMeters?: number;
  terrainResolutionMeters?: number;
  now?: string;
};

export type TopographicExportIssue = {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  layerId?: TopographicLayerId;
  sourceId?: string;
};

export type TopographicExportPlan = {
  modelVersion: string;
  status: 'ready' | 'blocked';
  request: Omit<TopographicExportRequest, 'sourceRecords' | 'now'>;
  areaKm2: number;
  longitudeSpanDegrees: number;
  selectedSources: TopographicSourceRecord[];
  sourceByLayer: Partial<Record<TopographicLayerId, string>>;
  issues: TopographicExportIssue[];
  nonClaims: string[];
};

export type TopographicLayerDefinition = {
  id: TopographicLayerId;
  label: string;
  geometry: 'raster' | 'point' | 'line' | 'polygon' | 'mesh' | 'mixed';
  modes: TopographicExportMode[];
};

export type TopographicFormatDefinition = {
  id: TopographicExportFormat;
  label: string;
  mode: TopographicExportMode;
  mediaType: string;
  extension: string;
  supportedLayers: TopographicLayerId[];
  fidelity: 'lossless-for-mode' | 'geometry-only' | 'raster-only';
};

const VECTOR_2D_LAYERS: TopographicLayerId[] = [
  'buildings',
  'cadastral-parcels',
  'roads',
  'railways',
  'waterways',
  'building-shadows',
  'trees-green-spaces',
  'trees-hedges',
  'contour-lines',
];

const MODEL_3D_LAYERS: TopographicLayerId[] = [
  'buildings',
  'building-roofs-lod2',
  'cadastral-parcels',
  'roads',
  'railways',
  'waterways',
  'trees-green-spaces',
  'trees-hedges',
  'contour-lines',
  'terrain-mesh',
];

const RAW_VECTOR_LAYERS: TopographicLayerId[] = [
  'buildings',
  'building-roofs-lod2',
  'cadastral-parcels',
  'roads',
  'railways',
  'waterways',
  'building-shadows',
  'trees-green-spaces',
  'trees-hedges',
  'contour-lines',
];

export const TOPOGRAPHIC_LAYER_DEFINITIONS: TopographicLayerDefinition[] = [
  { id: 'satellite-imagery', label: 'Satellite imagery', geometry: 'raster', modes: ['raw'] },
  { id: 'buildings', label: 'Buildings', geometry: 'polygon', modes: ['2d-vector', '3d-model', 'raw'] },
  { id: 'building-roofs-lod2', label: 'Buildings with LoD2 roofs', geometry: 'mesh', modes: ['3d-model', 'raw'] },
  { id: 'cadastral-parcels', label: 'Cadastral parcels', geometry: 'polygon', modes: ['2d-vector', '3d-model', 'raw'] },
  { id: 'roads', label: 'Roads', geometry: 'line', modes: ['2d-vector', '3d-model', 'raw'] },
  { id: 'railways', label: 'Railways', geometry: 'line', modes: ['2d-vector', '3d-model', 'raw'] },
  { id: 'waterways', label: 'Waterways', geometry: 'line', modes: ['2d-vector', '3d-model', 'raw'] },
  { id: 'building-shadows', label: 'Building shadows', geometry: 'polygon', modes: ['2d-vector', 'raw'] },
  { id: 'trees-green-spaces', label: 'Trees and green spaces', geometry: 'mixed', modes: ['2d-vector', '3d-model', 'raw'] },
  { id: 'trees-hedges', label: 'Trees and hedges', geometry: 'mixed', modes: ['2d-vector', '3d-model', 'raw'] },
  { id: 'contour-lines', label: 'Contour lines', geometry: 'line', modes: ['2d-vector', '3d-model', 'raw'] },
  { id: 'terrain-mesh', label: 'Digital terrain model', geometry: 'mesh', modes: ['3d-model', 'raw'] },
];

export const TOPOGRAPHIC_FORMAT_DEFINITIONS: TopographicFormatDefinition[] = [
  {
    id: 'dxf',
    label: 'DXF',
    mode: '2d-vector',
    mediaType: 'application/dxf',
    extension: 'dxf',
    supportedLayers: [...new Set([...VECTOR_2D_LAYERS, ...MODEL_3D_LAYERS])],
    fidelity: 'geometry-only',
  },
  {
    id: 'pdf',
    label: 'PDF',
    mode: '2d-vector',
    mediaType: 'application/pdf',
    extension: 'pdf',
    supportedLayers: VECTOR_2D_LAYERS,
    fidelity: 'geometry-only',
  },
  {
    id: 'svg',
    label: 'SVG',
    mode: '2d-vector',
    mediaType: 'image/svg+xml',
    extension: 'svg',
    supportedLayers: VECTOR_2D_LAYERS,
    fidelity: 'lossless-for-mode',
  },
  {
    id: 'ifc',
    label: 'IFC4',
    mode: '3d-model',
    mediaType: 'application/x-step',
    extension: 'ifc',
    supportedLayers: MODEL_3D_LAYERS,
    fidelity: 'geometry-only',
  },
  {
    id: 'obj',
    label: 'Wavefront OBJ',
    mode: '3d-model',
    mediaType: 'model/obj',
    extension: 'obj',
    supportedLayers: MODEL_3D_LAYERS,
    fidelity: 'geometry-only',
  },
  {
    id: 'gltf',
    label: 'glTF 2.0',
    mode: '3d-model',
    mediaType: 'model/gltf+json',
    extension: 'gltf',
    supportedLayers: MODEL_3D_LAYERS,
    fidelity: 'geometry-only',
  },
  {
    id: 'stl',
    label: 'STL',
    mode: '3d-model',
    mediaType: 'model/stl',
    extension: 'stl',
    supportedLayers: ['buildings', 'building-roofs-lod2', 'terrain-mesh'],
    fidelity: 'geometry-only',
  },
  {
    id: 'geojson',
    label: 'GeoJSON',
    mode: 'raw',
    mediaType: 'application/geo+json',
    extension: 'geojson',
    supportedLayers: RAW_VECTOR_LAYERS,
    fidelity: 'lossless-for-mode',
  },
  {
    id: 'tiff',
    label: 'GeoTIFF',
    mode: 'raw',
    mediaType: 'image/tiff',
    extension: 'tif',
    supportedLayers: ['satellite-imagery', 'terrain-mesh'],
    fidelity: 'raster-only',
  },
  {
    id: 'txt',
    label: 'Raw text',
    mode: 'raw',
    mediaType: 'text/plain',
    extension: 'txt',
    supportedLayers: [...RAW_VECTOR_LAYERS, 'terrain-mesh'],
    fidelity: 'geometry-only',
  },
];

export const AGID_SYNTHETIC_TOPO_SOURCE: TopographicSourceRecord = {
  sourceId: 'agid-synthetic-topography-v0.1',
  publisher: 'AGID',
  product: 'Synthetic topographic conformance fixture',
  sourceUrl: 'https://github.com/kitauji/Address-Grid-ID',
  termsUrl: 'https://github.com/kitauji/Address-Grid-ID/blob/main/LICENSE',
  licenseId: 'MIT',
  version: TOPOGRAPHIC_EXPORT_MODEL_VERSION,
  publishedAt: '2026-07-26T00:00:00.000Z',
  retrievedAt: '2026-07-26T00:00:00.000Z',
  attribution: 'AGID synthetic topographic conformance fixture',
  correctionUrl: 'https://github.com/kitauji/Address-Grid-ID/issues',
  coverage: { scope: 'global', description: 'Synthetic geometry only; no real-world coverage claim.' },
  layerIds: TOPOGRAPHIC_LAYER_DEFINITIONS.map(layer => layer.id),
  allowedFormats: TOPOGRAPHIC_FORMAT_DEFINITIONS.map(format => format.id),
  reuseStatus: 'approved',
  syntheticOnly: true,
  notes: [
    'Contains no raw address, recipient, building-level real-world location, or precise real-world point.',
    'May be used for serializer, UI, and holdout conformance tests only.',
  ],
};

function isFiniteCoordinate(value: number) {
  return Number.isFinite(value);
}

export function longitudeSpanDegrees(bounds: TopographicBounds): number {
  if (bounds.east >= bounds.west) return bounds.east - bounds.west;
  return 360 - bounds.west + bounds.east;
}

export function calculateTopographicAreaKm2(bounds: TopographicBounds): number {
  const earthRadiusKm = 6_371.0088;
  const radians = Math.PI / 180;
  const longitudeRadians = longitudeSpanDegrees(bounds) * radians;
  const south = bounds.south * radians;
  const north = bounds.north * radians;
  return earthRadiusKm ** 2 * Math.abs(Math.sin(north) - Math.sin(south)) * longitudeRadians;
}

function validBounds(bounds: TopographicBounds): boolean {
  return (
    Object.values(bounds).every(isFiniteCoordinate)
    && bounds.south >= -90
    && bounds.north <= 90
    && bounds.west >= -180
    && bounds.west <= 180
    && bounds.east >= -180
    && bounds.east <= 180
    && bounds.south < bounds.north
    && longitudeSpanDegrees(bounds) > 0
    && longitudeSpanDegrees(bounds) < 360
  );
}

function bboxContains(outer: TopographicBounds, inner: TopographicBounds): boolean {
  if (outer.west > outer.east || inner.west > inner.east) return false;
  return (
    outer.south <= inner.south
    && outer.north >= inner.north
    && outer.west <= inner.west
    && outer.east >= inner.east
  );
}

function sourceCoversRequest(
  source: TopographicSourceRecord,
  bounds: TopographicBounds,
  countryCode?: string,
): boolean {
  if (source.coverage.scope === 'global') return true;
  if (source.coverage.scope === 'bbox') return bboxContains(source.coverage.bounds, bounds);
  if (!countryCode) return false;
  return source.coverage.countryCodes.includes(countryCode.toUpperCase());
}

export function topographicSourceBindsDigest(
  source: TopographicSourceRecord,
  digest: string,
) {
  const evidence = source.snapshotEvidence;
  if (!evidence) return false;
  const normalized = digest.toLowerCase();
  return evidence.contentSha256.toLowerCase() === normalized
    || evidence.relatedArtifactSha256?.some(value => value.toLowerCase() === normalized) === true;
}

export function auditTopographicSourceRecord(
  source: TopographicSourceRecord,
  options: {
    now: string;
    requireSnapshotEvidence: boolean;
  },
): TopographicExportIssue[] {
  const issues: TopographicExportIssue[] = [];
  const { now, requireSnapshotEvidence } = options;
  const required: Array<[string, string]> = [
    ['source-url', source.sourceUrl],
    ['terms-url', source.termsUrl],
    ['license', source.licenseId],
    ['version', source.version],
    ['published-at', source.publishedAt],
    ['retrieved-at', source.retrievedAt],
    ['attribution', source.attribution],
    ['correction-url', source.correctionUrl],
  ];

  for (const [field, value] of required) {
    if (!value.trim()) {
      issues.push({
        code: `source-missing-${field}`,
        severity: 'error',
        message: `${source.sourceId} is missing required ${field} evidence.`,
        sourceId: source.sourceId,
      });
    }
  }

  if (source.reuseStatus !== 'approved') {
    issues.push({
      code: `source-reuse-${source.reuseStatus}`,
      severity: 'error',
      message: `${source.sourceId} reuse is ${source.reuseStatus}; export remains blocked.`,
      sourceId: source.sourceId,
    });
  }

  if (source.freshUntil && Date.parse(source.freshUntil) < Date.parse(now)) {
    issues.push({
      code: 'source-stale',
      severity: 'error',
      message: `${source.sourceId} passed its freshness deadline ${source.freshUntil}.`,
      sourceId: source.sourceId,
    });
  }

  if (requireSnapshotEvidence) {
    const evidence = source.snapshotEvidence;
    if (!evidence) {
      issues.push({
        code: 'source-missing-snapshot-evidence',
        severity: 'error',
        message: `${source.sourceId} has no structured snapshot evidence.`,
        sourceId: source.sourceId,
      });
    } else {
      const evidenceFields: Array<[string, string]> = [
        ['adapter-version', evidence.adapterVersion],
        ['horizontal-crs', evidence.horizontalCrs],
        ['vertical-datum', evidence.verticalDatum],
      ];
      for (const [field, value] of evidenceFields) {
        if (!value.trim()) {
          issues.push({
            code: `source-missing-${field}`,
            severity: 'error',
            message: `${source.sourceId} is missing snapshot ${field}.`,
            sourceId: source.sourceId,
          });
        }
      }
      if (!/^sha256:[a-f0-9]{64}$/i.test(evidence.contentSha256)) {
        issues.push({
          code: 'source-invalid-snapshot-sha256',
          severity: 'error',
          message: `${source.sourceId} snapshot digest must be SHA-256.`,
          sourceId: source.sourceId,
        });
      }
      if (!Number.isFinite(Date.parse(evidence.verifiedAt))) {
        issues.push({
          code: 'source-invalid-verified-at',
          severity: 'error',
          message: `${source.sourceId} snapshot verification time is invalid.`,
          sourceId: source.sourceId,
        });
      }
      for (const digest of evidence.relatedArtifactSha256 ?? []) {
        if (!/^sha256:[a-f0-9]{64}$/i.test(digest)) {
          issues.push({
            code: 'source-invalid-related-artifact-sha256',
            severity: 'error',
            message: `${source.sourceId} related artifact digest must be SHA-256.`,
            sourceId: source.sourceId,
          });
        }
      }
    }
  }

  return issues;
}

export function buildTopographicExportPlan(request: TopographicExportRequest): TopographicExportPlan {
  const issues: TopographicExportIssue[] = [];
  const now = request.now ?? new Date().toISOString();
  const format = TOPOGRAPHIC_FORMAT_DEFINITIONS.find(candidate => candidate.id === request.format);
  const requestedLayers = [...new Set(request.layerIds)];
  const areaKm2 = validBounds(request.bounds) ? calculateTopographicAreaKm2(request.bounds) : 0;

  if (!validBounds(request.bounds)) {
    issues.push({
      code: 'invalid-bounds',
      severity: 'error',
      message: 'Bounds must be finite WGS84 coordinates with positive height and width.',
    });
  } else if (areaKm2 > MAX_TOPOGRAPHIC_EXPORT_AREA_KM2 + 1e-9) {
    issues.push({
      code: 'area-limit-exceeded',
      severity: 'error',
      message: `Selection is ${areaKm2.toFixed(2)} km2; maximum is ${MAX_TOPOGRAPHIC_EXPORT_AREA_KM2} km2.`,
    });
  }

  if (!/^EPSG:\d{4,6}$/i.test(request.crs.trim())) {
    issues.push({
      code: 'invalid-crs',
      severity: 'error',
      message: 'CRS must use an explicit EPSG identifier such as EPSG:4326.',
    });
  }

  if (!format) {
    issues.push({ code: 'unknown-format', severity: 'error', message: `Unknown format ${request.format}.` });
  }

  if (requestedLayers.length === 0) {
    issues.push({ code: 'missing-layers', severity: 'error', message: 'Select at least one topographic layer.' });
  }

  if (request.contourIntervalMeters !== undefined && (
    !Number.isFinite(request.contourIntervalMeters)
    || request.contourIntervalMeters < 0.25
    || request.contourIntervalMeters > 100
  )) {
    issues.push({
      code: 'invalid-contour-interval',
      severity: 'error',
      message: 'Contour interval must be between 0.25 and 100 metres.',
      layerId: 'contour-lines',
    });
  }

  if (request.terrainResolutionMeters !== undefined && (
    !Number.isFinite(request.terrainResolutionMeters)
    || request.terrainResolutionMeters < 0.5
    || request.terrainResolutionMeters > 250
  )) {
    issues.push({
      code: 'invalid-terrain-resolution',
      severity: 'error',
      message: 'Terrain resolution must be between 0.5 and 250 metres.',
      layerId: 'terrain-mesh',
    });
  }

  const sourceByLayer: Partial<Record<TopographicLayerId, string>> = {};
  const selectedSourceIds = new Set<string>();

  for (const layerId of requestedLayers) {
    if (format && !format.supportedLayers.includes(layerId)) {
      issues.push({
        code: 'format-layer-incompatible',
        severity: 'error',
        message: `${layerId} cannot be represented in ${format.label}.`,
        layerId,
      });
      continue;
    }

    const candidates = request.sourceRecords
      .filter(source => source.layerIds.includes(layerId))
      .filter(source => source.allowedFormats.includes(request.format))
      .filter(source => sourceCoversRequest(source, request.bounds, request.countryCode))
      .filter(source => request.dataMode === 'synthetic' || !source.syntheticOnly)
      .sort((a, b) => Number(Boolean(a.syntheticOnly)) - Number(Boolean(b.syntheticOnly)));
    const selected = candidates[0];

    if (!selected) {
      issues.push({
        code: 'missing-approved-source',
        severity: 'error',
        message: `No source covers ${layerId}, ${request.format}, and the requested scope.`,
        layerId,
      });
      continue;
    }

    sourceByLayer[layerId] = selected.sourceId;
    selectedSourceIds.add(selected.sourceId);
  }

  const selectedSources = request.sourceRecords.filter(source => selectedSourceIds.has(source.sourceId));
  for (const source of selectedSources) {
    issues.push(...auditTopographicSourceRecord(source, {
      now,
      requireSnapshotEvidence: request.dataMode === 'source-backed',
    }));
  }

  if (request.dataMode === 'synthetic') {
    issues.push({
      code: 'synthetic-non-coverage',
      severity: 'warning',
      message: 'Synthetic mode proves export mechanics only and makes no real-world coverage or delivery claim.',
    });
  }

  if (requestedLayers.includes('building-roofs-lod2')) {
    issues.push({
      code: 'lod2-country-scope-required',
      severity: 'warning',
      message: 'LoD2 roof output requires explicit country and source coverage evidence; no global availability is implied.',
      layerId: 'building-roofs-lod2',
    });
  }

  return {
    modelVersion: TOPOGRAPHIC_EXPORT_MODEL_VERSION,
    status: issues.some(issue => issue.severity === 'error') ? 'blocked' : 'ready',
    request: {
      bounds: { ...request.bounds },
      countryCode: request.countryCode?.toUpperCase(),
      crs: request.crs.toUpperCase(),
      format: request.format,
      layerIds: requestedLayers,
      dataMode: request.dataMode,
      contourIntervalMeters: request.contourIntervalMeters,
      terrainResolutionMeters: request.terrainResolutionMeters,
    },
    areaKm2,
    longitudeSpanDegrees: validBounds(request.bounds) ? longitudeSpanDegrees(request.bounds) : 0,
    selectedSources,
    sourceByLayer,
    issues,
    nonClaims: [
      'A syntactically valid export does not prove cadastral authority, title, boundary accuracy, or deliverability.',
      'Terrain, imagery, vegetation, and LoD2 coverage are source-specific and must not be inferred globally.',
      'The export pipeline does not collect or retain recipient names, raw addresses, query logs, or private coordinates.',
    ],
  };
}

function interpolate(min: number, max: number, ratio: number) {
  return min + (max - min) * ratio;
}

function syntheticCoordinate(bounds: TopographicBounds, x: number, y: number, z = 0): [number, number, number] {
  const longitudeSpan = longitudeSpanDegrees(bounds);
  let longitude = bounds.west + longitudeSpan * x;
  if (longitude > 180) longitude -= 360;
  return [
    longitude,
    interpolate(bounds.south, bounds.north, y),
    z,
  ];
}

export function createSyntheticTopographicDataset(
  bounds: TopographicBounds,
  generatedAt = '2026-07-26T00:00:00.000Z',
): TopographicDataset {
  if (!validBounds(bounds)) throw new Error('invalid-synthetic-bounds');

  const sourceId = AGID_SYNTHETIC_TOPO_SOURCE.sourceId;
  const polygon = (points: Array<[number, number, number]>): TopographicGeometry => ({
    type: 'Polygon',
    coordinates: [[...points, points[0]]],
  });
  const line = (points: Array<[number, number, number]>): TopographicGeometry => ({
    type: 'LineString',
    coordinates: points,
  });

  const features: TopographicFeature[] = [
    {
      id: 'synthetic-building-1',
      layerId: 'buildings',
      geometry: polygon([
        syntheticCoordinate(bounds, 0.18, 0.2, 12),
        syntheticCoordinate(bounds, 0.42, 0.2, 12),
        syntheticCoordinate(bounds, 0.42, 0.48, 12),
        syntheticCoordinate(bounds, 0.18, 0.48, 12),
      ]),
      properties: { height_m: 12, synthetic: true },
      sourceId,
    },
    {
      id: 'synthetic-roof-1',
      layerId: 'building-roofs-lod2',
      geometry: polygon([
        syntheticCoordinate(bounds, 0.18, 0.2, 12),
        syntheticCoordinate(bounds, 0.42, 0.2, 12),
        syntheticCoordinate(bounds, 0.3, 0.34, 17),
      ]),
      properties: { lod: 2, synthetic: true },
      sourceId,
    },
    {
      id: 'synthetic-parcel-1',
      layerId: 'cadastral-parcels',
      geometry: polygon([
        syntheticCoordinate(bounds, 0.08, 0.1),
        syntheticCoordinate(bounds, 0.5, 0.1),
        syntheticCoordinate(bounds, 0.5, 0.58),
        syntheticCoordinate(bounds, 0.08, 0.58),
      ]),
      properties: { authoritative: false, synthetic: true },
      sourceId,
    },
    {
      id: 'synthetic-road-1',
      layerId: 'roads',
      geometry: line([
        syntheticCoordinate(bounds, 0.02, 0.68, 2),
        syntheticCoordinate(bounds, 0.98, 0.48, 4),
      ]),
      properties: { class: 'local', synthetic: true },
      sourceId,
    },
    {
      id: 'synthetic-rail-1',
      layerId: 'railways',
      geometry: line([
        syntheticCoordinate(bounds, 0.06, 0.84, 5),
        syntheticCoordinate(bounds, 0.94, 0.72, 6),
      ]),
      properties: { class: 'rail', synthetic: true },
      sourceId,
    },
    {
      id: 'synthetic-water-1',
      layerId: 'waterways',
      geometry: line([
        syntheticCoordinate(bounds, 0.58, 0.98, 8),
        syntheticCoordinate(bounds, 0.66, 0.62, 3),
        syntheticCoordinate(bounds, 0.86, 0.02, 0),
      ]),
      properties: { class: 'stream', synthetic: true },
      sourceId,
    },
    {
      id: 'synthetic-shadow-1',
      layerId: 'building-shadows',
      geometry: polygon([
        syntheticCoordinate(bounds, 0.2, 0.18),
        syntheticCoordinate(bounds, 0.46, 0.18),
        syntheticCoordinate(bounds, 0.42, 0.48),
        syntheticCoordinate(bounds, 0.18, 0.48),
      ]),
      properties: { synthetic: true },
      sourceId,
    },
    {
      id: 'synthetic-tree-1',
      layerId: 'trees-green-spaces',
      geometry: { type: 'Point', coordinates: syntheticCoordinate(bounds, 0.72, 0.3, 7) },
      properties: { class: 'tree', synthetic: true },
      sourceId,
    },
    {
      id: 'synthetic-hedge-1',
      layerId: 'trees-hedges',
      geometry: line([
        syntheticCoordinate(bounds, 0.55, 0.18, 1),
        syntheticCoordinate(bounds, 0.82, 0.18, 1),
      ]),
      properties: { class: 'hedge', synthetic: true },
      sourceId,
    },
    ...[0.25, 0.5, 0.75].map((ratio, index): TopographicFeature => ({
      id: `synthetic-contour-${index + 1}`,
      layerId: 'contour-lines',
      geometry: line([
        syntheticCoordinate(bounds, 0.05, ratio - 0.05, (index + 1) * 5),
        syntheticCoordinate(bounds, 0.5, ratio + 0.04, (index + 1) * 5),
        syntheticCoordinate(bounds, 0.95, ratio - 0.03, (index + 1) * 5),
      ]),
      properties: { elevation_m: (index + 1) * 5, synthetic: true },
      sourceId,
    })),
  ];

  const terrainVertices: Array<[number, number, number]> = [];
  const gridSize = 8;
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const nx = x / (gridSize - 1);
      const ny = y / (gridSize - 1);
      const elevation = 2 + 28 * Math.sin(nx * Math.PI) * Math.sin(ny * Math.PI);
      terrainVertices.push(syntheticCoordinate(bounds, nx, ny, elevation));
    }
  }
  const terrainTriangles: Array<[number, number, number]> = [];
  for (let y = 0; y < gridSize - 1; y += 1) {
    for (let x = 0; x < gridSize - 1; x += 1) {
      const topLeft = y * gridSize + x;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + gridSize;
      const bottomRight = bottomLeft + 1;
      terrainTriangles.push([topLeft, bottomLeft, topRight], [topRight, bottomLeft, bottomRight]);
    }
  }

  const rasterWidth = 64;
  const rasterHeight = 64;
  const pixels = new Uint8Array(rasterWidth * rasterHeight);
  for (let y = 0; y < rasterHeight; y += 1) {
    for (let x = 0; x < rasterWidth; x += 1) {
      const nx = x / (rasterWidth - 1);
      const ny = y / (rasterHeight - 1);
      pixels[y * rasterWidth + x] = Math.round(50 + 180 * Math.sin(nx * Math.PI) * Math.sin(ny * Math.PI));
    }
  }

  return {
    datasetId: 'agid-synthetic-topography',
    title: 'AGID synthetic topographic conformance fixture',
    bounds: { ...bounds },
    crs: 'EPSG:4326',
    generatedAt,
    synthetic: true,
    features,
    meshes: [{
      id: 'synthetic-terrain-mesh',
      layerId: 'terrain-mesh',
      vertices: terrainVertices,
      triangles: terrainTriangles,
      sourceId,
    }],
    rasters: [{
      id: 'synthetic-terrain-raster',
      layerId: 'terrain-mesh',
      width: rasterWidth,
      height: rasterHeight,
      pixels,
      bounds: { ...bounds },
      sourceId,
    }, {
      id: 'synthetic-satellite-raster',
      layerId: 'satellite-imagery',
      width: rasterWidth,
      height: rasterHeight,
      pixels: pixels.slice(),
      bounds: { ...bounds },
      sourceId,
    }],
  };
}

export function getTopographicFormatDefinition(format: TopographicExportFormat) {
  return TOPOGRAPHIC_FORMAT_DEFINITIONS.find(candidate => candidate.id === format);
}
