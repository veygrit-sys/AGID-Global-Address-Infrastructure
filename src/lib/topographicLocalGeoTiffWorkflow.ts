import {
  TOPOGRAPHIC_FORMAT_DEFINITIONS,
  TOPOGRAPHIC_LAYER_DEFINITIONS,
  auditTopographicSourceRecord,
  buildTopographicExportPlan,
  type TopographicCoverage,
  type TopographicBounds,
  type TopographicDataset,
  type TopographicExportFormat,
  type TopographicExportPlan,
  type TopographicLayerId,
  type TopographicSnapshotEvidence,
  type TopographicSourceRecord,
} from './topographicExport';
import {
  TOPOGRAPHIC_ELEVATION_VECTORIZER_VERSION,
  vectorizeNormalizedElevationGrid,
  type ElevationVectorizationResult,
} from './topographicElevationVectorizer';
import {
  GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
  MAX_GEOTIFF_RESOLVED_NODATA_CELLS,
  MAX_GEOTIFF_RESOLVED_NODATA_FRACTION,
  TOPOGRAPHIC_GEOTIFF_ADAPTER_VERSION,
  TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
  decodeGeoTiffElevationGrid,
  isSupportedGeoTiffSourceCrs,
  type GeoTiffElevationDecodeResult,
  type GeoTiffReadWindow,
} from './topographicGeoTiffAdapter';
import {
  serializeTopographicExport,
  type SerializedTopographicExport,
} from './topographicExportSerializers';
import {
  bindPassedTopographicCogValidationEvidence,
  type TopographicCogValidationEvidence,
  type TopographicCogValidationReceipt,
} from './topographicCogValidation';
import type { Topographic3dTilesBuildResult } from './topographic3dTiles';

export const TOPOGRAPHIC_SOURCE_LEDGER_SCHEMA =
  'agid-topographic-source-ledger-v0.1';
export const TOPOGRAPHIC_LOCAL_GEOTIFF_WORKFLOW_VERSION =
  'agid-local-geotiff-workflow-v0.8';
export const TOPOGRAPHIC_LOCAL_EVIDENCE_SCHEMA =
  'agid-local-geotiff-evidence-v0.8';
export const TOPOGRAPHIC_MESH_LOD_BUNDLE_SCHEMA =
  'agid-topographic-mesh-lod-bundle-v0.2';
export const MAX_TOPOGRAPHIC_SOURCE_LEDGER_BYTES = 1024 * 1024;
export const MAX_TOPOGRAPHIC_SOURCE_LEDGER_RECORDS = 64;
export const MAX_LOCAL_GEOTIFF_QUALITY_MASK_BYTES = 1_000_000;

const textEncoder = new TextEncoder();
const layerIds = new Set(TOPOGRAPHIC_LAYER_DEFINITIONS.map(layer => layer.id));
const formatIds = new Set(TOPOGRAPHIC_FORMAT_DEFINITIONS.map(format => format.id));
const sha256Pattern = /^sha256:[a-f0-9]{64}$/i;

export type TopographicSourceLedger = {
  schemaVersion: typeof TOPOGRAPHIC_SOURCE_LEDGER_SCHEMA;
  generatedAt: string;
  records: TopographicSourceRecord[];
};

export type LocalGeoTiffDerivedLayer =
  | Extract<TopographicLayerId, 'terrain-mesh'>
  | Extract<TopographicLayerId, 'contour-lines'>;

export type LocalGeoTiffWorkflowRequest = {
  arrayBuffer: ArrayBuffer;
  sourceRecord: TopographicSourceRecord;
  gridId: string;
  title: string;
  generatedAt: string;
  countryCode?: string;
  format: TopographicExportFormat;
  layerIds: LocalGeoTiffDerivedLayer[];
  contourIntervalMeters: number;
  meshLodStrides?: readonly number[];
  meshMaxVerticalErrorMeters?: number;
  bandIndex?: number;
  imageIndex?: number;
  window?: GeoTiffReadWindow;
  qualityMask?: {
    arrayBuffer?: ArrayBuffer;
    encoding: typeof GEOTIFF_GDAL_VALIDITY_MASK_ENCODING;
    sourceDerivedNoDataMask?: boolean;
    maxResolvedCells?: number;
    maxResolvedFraction?: number;
  };
  cogValidation?: {
    receipt: TopographicCogValidationReceipt;
    receiptSha256: `sha256:${string}`;
  };
  signal?: AbortSignal;
};

export type LocalGeoTiffEvidenceManifest = {
  schemaVersion: typeof TOPOGRAPHIC_LOCAL_EVIDENCE_SCHEMA;
  workflowVersion: typeof TOPOGRAPHIC_LOCAL_GEOTIFF_WORKFLOW_VERSION;
  generatedAt: string;
  source: {
    sourceId: string;
    publisher: string;
    product: string;
    version: string;
    licenseId: string;
    termsUrl: string;
    correctionUrl: string;
    attribution: string;
    snapshotSha256: `sha256:${string}`;
    adapterVersion: string;
    verifiedAt: string;
    horizontalCrs: string;
    verticalDatum: string;
  };
  input: {
    contentSha256: `sha256:${string}`;
    width: number;
    height: number;
    sourceImageWidth: number;
    sourceImageHeight: number;
    imageLayout: GeoTiffElevationDecodeResult['metadata']['imageLayout'];
    georeferencing: GeoTiffElevationDecodeResult['metadata']['georeferencing'];
    readWindow: GeoTiffReadWindow;
    selectedBandIndex: number;
    pixelInterpretation: 'area' | 'point';
    sourceHorizontalCrs:
      GeoTiffElevationDecodeResult['metadata']['sourceHorizontalCrs'];
    horizontalCrs: 'EPSG:4326';
    gridCoordinateModel:
      GeoTiffElevationDecodeResult['metadata']['gridCoordinateModel'];
    coordinateNormalization:
      GeoTiffElevationDecodeResult['metadata']['coordinateNormalization'];
    verticalDatum: string;
    cogValidation: TopographicCogValidationEvidence | null;
    qualityMaskByteLength: number | null;
    noDataResolution: GeoTiffElevationDecodeResult['metadata']['noDataResolution'];
  };
  derivation: {
    geotiffAdapterVersion: string;
    vectorizerVersion: string;
    selectedLayers: LocalGeoTiffDerivedLayer[];
    meshLodStrides: number[];
    meshLodQuality: ElevationVectorizationResult['meshLodQuality'];
    metrics: ElevationVectorizationResult['metrics'];
    contourTopology: ElevationVectorizationResult['contourTopology'];
  };
  output: {
    format: TopographicExportFormat;
    fileName: string;
    mediaType: string;
    byteLength: number;
    sha256: `sha256:${string}`;
    includedLayers: TopographicLayerId[];
    meshLodBundle: {
      schemaVersion: typeof TOPOGRAPHIC_MESH_LOD_BUNDLE_SCHEMA;
      artifactCount: number;
      manifestFileName: string;
      manifestSha256: `sha256:${string}`;
    } | null;
    threeDTiles: {
      status: 'ready';
      tilesetFileName: string;
      tilesetSha256: `sha256:${string}`;
      evidenceFileName: string;
      evidenceSha256: `sha256:${string}`;
    } | {
      status: 'blocked';
      issueCodes: string[];
    } | null;
  };
  warnings: string[];
  nonClaims: string[];
};

export type LocalGeoTiffMeshLodManifest = {
  schemaVersion: typeof TOPOGRAPHIC_MESH_LOD_BUNDLE_SCHEMA;
  workflowVersion: typeof TOPOGRAPHIC_LOCAL_GEOTIFF_WORKFLOW_VERSION;
  generatedAt: string;
  datasetId: string;
  source: {
    sourceId: string;
    snapshotSha256: `sha256:${string}`;
    horizontalCrs: string;
    verticalDatum: string;
  };
  bounds: TopographicBounds;
  terrain: {
    minimumElevationMeters: number;
    maximumElevationMeters: number;
  };
  output: {
    format: TopographicExportFormat;
    layerId: 'terrain-mesh';
    sampleBasis: ElevationVectorizationResult['meshLodQuality']['sampleBasis'];
    maximumAllowedVerticalErrorMeters: number;
  };
  levels: Array<{
    level: number;
    stride: number;
    meshId: string;
    fileName: string;
    mediaType: string;
    byteLength: number;
    sha256: `sha256:${string}`;
    vertexCount: number;
    triangleCount: number;
    sourceSampleCount: number;
    maximumAbsoluteVerticalErrorMeters: number;
    meanAbsoluteVerticalErrorMeters: number;
    rootMeanSquareVerticalErrorMeters: number;
  }>;
  warnings: string[];
  nonClaims: string[];
};

export type LocalGeoTiffMeshLodBundle = {
  artifacts: Array<{
    level: number;
    stride: number;
    output: SerializedTopographicExport;
    sha256: `sha256:${string}`;
  }>;
  manifest: {
    fileName: string;
    mediaType: 'application/json';
    data: string;
    byteLength: number;
    sha256: `sha256:${string}`;
    manifest: LocalGeoTiffMeshLodManifest;
  };
};

export type LocalGeoTiffWorkflowResult = {
  decoded: GeoTiffElevationDecodeResult;
  vectorized: ElevationVectorizationResult;
  plan: TopographicExportPlan;
  output: SerializedTopographicExport;
  meshLodBundle: LocalGeoTiffMeshLodBundle | null;
  threeDTiles: Topographic3dTilesBuildResult | null;
  evidence: {
    fileName: string;
    mediaType: 'application/json';
    data: string;
    byteLength: number;
    manifest: LocalGeoTiffEvidenceManifest;
  };
};

function asObject(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireOnlyKeys(
  object: Record<string, unknown>,
  field: string,
  allowedKeys: readonly string[],
) {
  const allowed = new Set(allowedKeys);
  const unknown = Object.keys(object).find(key => !allowed.has(key));
  if (unknown) {
    throw new Error(`${field} contains unsupported field ${unknown}.`);
  }
}

function asString(
  object: Record<string, unknown>,
  field: string,
  options: { maxLength?: number; optional?: boolean } = {},
) {
  const value = object[field];
  if (options.optional && value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > (options.maxLength ?? 2048)) {
    throw new Error(`${field} exceeds its maximum length.`);
  }
  return trimmed;
}

function asIsoTimestamp(
  object: Record<string, unknown>,
  field: string,
  optional = false,
) {
  const value = asString(object, field, { optional, maxLength: 64 });
  if (value === undefined) return undefined;
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
  return value;
}

function asHttpsUrl(object: Record<string, unknown>, field: string) {
  const value = asString(object, field);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${field} must be an absolute HTTPS URL.`);
  }
  if (url.protocol !== 'https:') {
    throw new Error(`${field} must be an absolute HTTPS URL.`);
  }
  return value;
}

function asStringArray(
  object: Record<string, unknown>,
  field: string,
  options: { optional?: boolean; maxItems?: number } = {},
) {
  const value = object[field];
  if (options.optional && value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > (options.maxItems ?? 64)) {
    throw new Error(`${field} must be a bounded string array.`);
  }
  return value.map((item, index) => {
    if (typeof item !== 'string' || !item.trim() || item.length > 2048) {
      throw new Error(`${field}[${index}] must be a bounded non-empty string.`);
    }
    return item.trim();
  });
}

function asCoverage(value: unknown): TopographicCoverage {
  const coverage = asObject(value, 'coverage');
  const scope = asString(coverage, 'scope', { maxLength: 16 });
  const description = asString(coverage, 'description');
  if (scope === 'global') {
    requireOnlyKeys(coverage, 'coverage', ['scope', 'description']);
    return { scope, description };
  }
  if (scope === 'country') {
    requireOnlyKeys(coverage, 'coverage', ['scope', 'description', 'countryCodes']);
    const countryCodes = asStringArray(coverage, 'countryCodes', { maxItems: 300 })
      ?.map(value => value.toUpperCase()) ?? [];
    if (
      countryCodes.length === 0 ||
      countryCodes.some(code => !/^[A-Z]{2,3}$/.test(code))
    ) {
      throw new Error('coverage.countryCodes must contain ISO-like country codes.');
    }
    return { scope, countryCodes: [...new Set(countryCodes)], description };
  }
  if (scope === 'bbox') {
    requireOnlyKeys(coverage, 'coverage', ['scope', 'description', 'bounds']);
    const bounds = asObject(coverage.bounds, 'coverage.bounds');
    requireOnlyKeys(bounds, 'coverage.bounds', ['south', 'west', 'north', 'east']);
    const south = Number(bounds.south);
    const west = Number(bounds.west);
    const north = Number(bounds.north);
    const east = Number(bounds.east);
    if (
      ![south, west, north, east].every(Number.isFinite) ||
      south < -90 ||
      north > 90 ||
      west < -180 ||
      east > 180 ||
      south >= north ||
      west >= east
    ) {
      throw new Error('coverage.bounds must be a finite non-antimeridian WGS84 extent.');
    }
    return { scope, bounds: { south, west, north, east }, description };
  }
  throw new Error('coverage.scope must be global, country, or bbox.');
}

function asSnapshotEvidence(value: unknown): TopographicSnapshotEvidence {
  const evidence = asObject(value, 'snapshotEvidence');
  requireOnlyKeys(evidence, 'snapshotEvidence', [
    'contentSha256',
    'adapterVersion',
    'verifiedAt',
    'horizontalCrs',
    'verticalDatum',
    'relatedArtifactSha256',
  ]);
  const contentSha256 = asString(evidence, 'contentSha256', { maxLength: 80 });
  if (!sha256Pattern.test(contentSha256)) {
    throw new Error('snapshotEvidence.contentSha256 must be SHA-256.');
  }
  const relatedArtifactSha256 = asStringArray(
    evidence,
    'relatedArtifactSha256',
    { optional: true, maxItems: 16 },
  ) as `sha256:${string}`[] | undefined;
  if (relatedArtifactSha256?.some(digest => !sha256Pattern.test(digest))) {
    throw new Error('snapshotEvidence.relatedArtifactSha256 must contain SHA-256 digests.');
  }
  return {
    contentSha256: contentSha256 as `sha256:${string}`,
    adapterVersion: asString(evidence, 'adapterVersion', { maxLength: 128 }),
    verifiedAt: asIsoTimestamp(evidence, 'verifiedAt')!,
    horizontalCrs: asString(evidence, 'horizontalCrs', { maxLength: 128 }),
    verticalDatum: asString(evidence, 'verticalDatum', { maxLength: 256 }),
    ...(relatedArtifactSha256 ? { relatedArtifactSha256 } : {}),
  };
}

function asSourceRecord(value: unknown, now: string): TopographicSourceRecord {
  const source = asObject(value, 'record');
  requireOnlyKeys(source, 'record', [
    'sourceId',
    'publisher',
    'product',
    'sourceUrl',
    'termsUrl',
    'licenseId',
    'version',
    'publishedAt',
    'retrievedAt',
    'freshUntil',
    'attribution',
    'correctionUrl',
    'coverage',
    'layerIds',
    'allowedFormats',
    'reuseStatus',
    'syntheticOnly',
    'snapshotEvidence',
    'notes',
  ]);
  const rawLayers = asStringArray(source, 'layerIds', { maxItems: layerIds.size }) ?? [];
  const rawFormats = asStringArray(source, 'allowedFormats', { maxItems: formatIds.size }) ?? [];
  if (rawLayers.some(value => !layerIds.has(value as TopographicLayerId))) {
    throw new Error('record.layerIds contains an unsupported layer.');
  }
  if (rawFormats.some(value => !formatIds.has(value as TopographicExportFormat))) {
    throw new Error('record.allowedFormats contains an unsupported format.');
  }
  if (source.reuseStatus !== 'approved') {
    throw new Error('record.reuseStatus must be approved.');
  }
  if (source.syntheticOnly === true) {
    throw new Error('Synthetic source records cannot be imported as source-backed evidence.');
  }
  const notes = asStringArray(source, 'notes', { optional: true, maxItems: 32 });
  const record: TopographicSourceRecord = {
    sourceId: asString(source, 'sourceId', { maxLength: 160 }),
    publisher: asString(source, 'publisher', { maxLength: 256 }),
    product: asString(source, 'product', { maxLength: 256 }),
    sourceUrl: asHttpsUrl(source, 'sourceUrl'),
    termsUrl: asHttpsUrl(source, 'termsUrl'),
    licenseId: asString(source, 'licenseId', { maxLength: 128 }),
    version: asString(source, 'version', { maxLength: 256 }),
    publishedAt: asIsoTimestamp(source, 'publishedAt')!,
    retrievedAt: asIsoTimestamp(source, 'retrievedAt')!,
    ...(source.freshUntil === undefined
      ? {}
      : { freshUntil: asIsoTimestamp(source, 'freshUntil')! }),
    attribution: asString(source, 'attribution'),
    correctionUrl: asHttpsUrl(source, 'correctionUrl'),
    coverage: asCoverage(source.coverage),
    layerIds: rawLayers as TopographicLayerId[],
    allowedFormats: rawFormats as TopographicExportFormat[],
    reuseStatus: 'approved',
    snapshotEvidence: asSnapshotEvidence(source.snapshotEvidence),
    ...(notes ? { notes } : {}),
  };
  const issues = auditTopographicSourceRecord(record, {
    now,
    requireSnapshotEvidence: true,
  });
  if (issues.length > 0) {
    throw new Error(
      `record ${record.sourceId} failed evidence audit: ${issues
        .map(issue => issue.message)
        .join('; ')}`,
    );
  }
  return record;
}

export function parseTopographicSourceLedger(
  json: string,
  options: { now?: string } = {},
): TopographicSourceLedger {
  if (textEncoder.encode(json).byteLength > MAX_TOPOGRAPHIC_SOURCE_LEDGER_BYTES) {
    throw new Error(
      `Source ledger exceeds ${MAX_TOPOGRAPHIC_SOURCE_LEDGER_BYTES} bytes.`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Source ledger must contain valid JSON.');
  }
  const ledger = asObject(parsed, 'ledger');
  requireOnlyKeys(ledger, 'ledger', ['schemaVersion', 'generatedAt', 'records']);
  if (ledger.schemaVersion !== TOPOGRAPHIC_SOURCE_LEDGER_SCHEMA) {
    throw new Error(`Source ledger schema must be ${TOPOGRAPHIC_SOURCE_LEDGER_SCHEMA}.`);
  }
  const generatedAt = asIsoTimestamp(ledger, 'generatedAt')!;
  const now = options.now ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(now))) throw new Error('now must be an ISO timestamp.');
  if (
    !Array.isArray(ledger.records) ||
    ledger.records.length === 0 ||
    ledger.records.length > MAX_TOPOGRAPHIC_SOURCE_LEDGER_RECORDS
  ) {
    throw new Error(
      `Source ledger must contain 1-${MAX_TOPOGRAPHIC_SOURCE_LEDGER_RECORDS} records.`,
    );
  }
  const records = ledger.records.map(value => asSourceRecord(value, now));
  const identities = new Set<string>();
  for (const record of records) {
    const identity = record.sourceId.toLowerCase();
    if (identities.has(identity)) {
      throw new Error(`Source ledger contains duplicate sourceId ${record.sourceId}.`);
    }
    identities.add(identity);
  }
  return {
    schemaVersion: TOPOGRAPHIC_SOURCE_LEDGER_SCHEMA,
    generatedAt,
    records,
  };
}

function asDigestBytes(data: string | Uint8Array) {
  if (typeof data === 'string') return textEncoder.encode(data);
  return Uint8Array.from(data);
}

async function sha256(data: string | Uint8Array) {
  const bytes = asDigestBytes(data);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes.buffer);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

function safeId(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'agid-topography';
}

function meshLodDataset(
  dataset: TopographicDataset,
  level: number,
  stride: number,
  mesh: TopographicDataset['meshes'][number],
): TopographicDataset {
  return {
    ...dataset,
    datasetId: `${dataset.datasetId}-terrain-lod${level}-s${stride}`,
    title: `${dataset.title} terrain LOD ${level}`,
    features: [],
    meshes: [mesh],
    rasters: [],
  };
}

async function createLocalGeoTiffMeshLodBundle(
  vectorized: ElevationVectorizationResult,
  plan: TopographicExportPlan,
  sourceRecord: TopographicSourceRecord,
): Promise<LocalGeoTiffMeshLodBundle | null> {
  if (vectorized.meshLods.length === 0) return null;
  const maximumAllowedVerticalErrorMeters =
    vectorized.meshLodQuality.maximumAllowedVerticalErrorMeters;
  if (
    !vectorized.meshLodQuality.passed
    || maximumAllowedVerticalErrorMeters === null
  ) {
    throw new Error('Mesh LOD bundle requires a passed explicit vertical-error audit.');
  }
  if (
    vectorized.meshLodQuality.levels.length
    !== vectorized.meshLods.length
  ) {
    throw new Error('Mesh LOD bundle audit count does not match its mesh count.');
  }

  const artifacts: LocalGeoTiffMeshLodBundle['artifacts'] = [];
  const levels: LocalGeoTiffMeshLodManifest['levels'] = [];
  for (const lod of vectorized.meshLods) {
    const quality = vectorized.meshLodQuality.levels[lod.level];
    if (
      !quality
      || quality.level !== lod.level
      || quality.stride !== lod.stride
      || !quality.passed
    ) {
      throw new Error(`Mesh LOD${lod.level} lacks a matching passed quality audit.`);
    }
    const output = serializeTopographicExport(
      meshLodDataset(
        vectorized.dataset,
        lod.level,
        lod.stride,
        lod.mesh,
      ),
      plan,
    );
    if (
      output.includedLayers.length !== 1
      || output.includedLayers[0] !== 'terrain-mesh'
    ) {
      throw new Error(
        `Mesh LOD${lod.level} serializer did not retain terrain geometry.`,
      );
    }
    const outputSha256 = await sha256(output.data);
    artifacts.push({
      level: lod.level,
      stride: lod.stride,
      output,
      sha256: outputSha256,
    });
    levels.push({
      level: lod.level,
      stride: lod.stride,
      meshId: lod.mesh.id,
      fileName: output.fileName,
      mediaType: output.mediaType,
      byteLength: output.byteLength,
      sha256: outputSha256,
      vertexCount: lod.vertexCount,
      triangleCount: lod.triangleCount,
      sourceSampleCount: quality.sourceSampleCount,
      maximumAbsoluteVerticalErrorMeters:
        quality.maximumAbsoluteVerticalErrorMeters,
      meanAbsoluteVerticalErrorMeters:
        quality.meanAbsoluteVerticalErrorMeters,
      rootMeanSquareVerticalErrorMeters:
        quality.rootMeanSquareVerticalErrorMeters,
    });
  }

  const manifest: LocalGeoTiffMeshLodManifest = {
    schemaVersion: TOPOGRAPHIC_MESH_LOD_BUNDLE_SCHEMA,
    workflowVersion: TOPOGRAPHIC_LOCAL_GEOTIFF_WORKFLOW_VERSION,
    generatedAt: vectorized.dataset.generatedAt,
    datasetId: vectorized.dataset.datasetId,
    source: {
      sourceId: sourceRecord.sourceId,
      snapshotSha256: sourceRecord.snapshotEvidence!.contentSha256,
      horizontalCrs: sourceRecord.snapshotEvidence!.horizontalCrs,
      verticalDatum: sourceRecord.snapshotEvidence!.verticalDatum,
    },
    bounds: { ...vectorized.dataset.bounds },
    terrain: {
      minimumElevationMeters: vectorized.metrics.minimumElevationMeters,
      maximumElevationMeters: vectorized.metrics.maximumElevationMeters,
    },
    output: {
      format: plan.request.format,
      layerId: 'terrain-mesh',
      sampleBasis: vectorized.meshLodQuality.sampleBasis,
      maximumAllowedVerticalErrorMeters,
    },
    levels,
    warnings: [
      'Each artifact contains one audited terrain mesh LOD and no contour geometry.',
      'LOD0 remains the highest-resolution normalized-grid TIN; larger strides are coarser representations.',
    ],
    nonClaims: [
      'Vertical residual is not OGC 3D Tiles geometricError or screen-space error.',
      'This bundle is not a 3D Tiles tileset and does not define ECEF placement, refinement, or runtime selection.',
      'Derived terrain does not prove an address, entrance, recipient, or delivery point.',
    ],
  };
  const data = `${JSON.stringify(manifest, null, 2)}\n`;
  const bundle: LocalGeoTiffMeshLodBundle = {
    artifacts,
    manifest: {
      fileName: `${safeId(vectorized.dataset.datasetId)}.terrain-lods.json`,
      mediaType: 'application/json',
      data,
      byteLength: textEncoder.encode(data).byteLength,
      sha256: await sha256(data),
      manifest,
    },
  };
  await verifyLocalGeoTiffMeshLodBundle(bundle);
  return bundle;
}

export async function verifyLocalGeoTiffMeshLodBundle(
  bundle: LocalGeoTiffMeshLodBundle,
) {
  if (
    bundle.manifest.manifest.schemaVersion
    !== TOPOGRAPHIC_MESH_LOD_BUNDLE_SCHEMA
  ) {
    throw new Error('Mesh LOD bundle schema is unsupported.');
  }
  const canonicalManifest =
    `${JSON.stringify(bundle.manifest.manifest, null, 2)}\n`;
  if (
    bundle.manifest.data !== canonicalManifest
    || bundle.manifest.byteLength
      !== textEncoder.encode(canonicalManifest).byteLength
    || bundle.manifest.sha256 !== await sha256(canonicalManifest)
  ) {
    throw new Error('Mesh LOD bundle manifest integrity check failed.');
  }
  if (
    bundle.artifacts.length === 0
    || bundle.artifacts.length !== bundle.manifest.manifest.levels.length
  ) {
    throw new Error('Mesh LOD bundle artifact count is invalid.');
  }
  const { minimumElevationMeters, maximumElevationMeters } =
    bundle.manifest.manifest.terrain;
  if (
    !Number.isFinite(minimumElevationMeters)
    || !Number.isFinite(maximumElevationMeters)
    || minimumElevationMeters > maximumElevationMeters
  ) {
    throw new Error('Mesh LOD bundle terrain range is invalid.');
  }
  for (let index = 0; index < bundle.artifacts.length; index += 1) {
    const artifact = bundle.artifacts[index];
    const level = bundle.manifest.manifest.levels[index];
    if (
      artifact.level !== index
      || level.level !== artifact.level
      || level.stride !== artifact.stride
      || level.fileName !== artifact.output.fileName
      || level.mediaType !== artifact.output.mediaType
      || level.byteLength !== artifact.output.byteLength
      || level.sha256 !== artifact.sha256
      || artifact.output.includedLayers.length !== 1
      || artifact.output.includedLayers[0] !== 'terrain-mesh'
    ) {
      throw new Error(`Mesh LOD bundle artifact ${index} metadata mismatch.`);
    }
    if (artifact.sha256 !== await sha256(artifact.output.data)) {
      throw new Error(`Mesh LOD bundle artifact ${index} digest mismatch.`);
    }
  }
}

export async function runLocalGeoTiffWorkflow(
  request: LocalGeoTiffWorkflowRequest,
): Promise<LocalGeoTiffWorkflowResult> {
  if (request.sourceRecord.syntheticOnly) {
    throw new Error('Local GeoTIFF workflow requires source-backed evidence.');
  }
  if (!request.sourceRecord.snapshotEvidence) {
    throw new Error('Local GeoTIFF workflow requires structured snapshot evidence.');
  }
  if (!isSupportedGeoTiffSourceCrs(
    request.sourceRecord.snapshotEvidence.horizontalCrs,
  )) {
    throw new Error(
      'Local GeoTIFF workflow supports EPSG:4326, EPSG:4269, EPSG:3857, WGS 84 UTM EPSG:32601-32660 or EPSG:32701-32760, and NAD83 UTM EPSG:26901-26923 snapshot evidence.',
    );
  }
  const cogValidation = request.cogValidation
    ? bindPassedTopographicCogValidationEvidence({
        receipt: request.cogValidation.receipt,
        receiptSha256: request.cogValidation.receiptSha256,
        expectedContentSha256: request.sourceRecord.snapshotEvidence.contentSha256,
        expectedByteLength: request.arrayBuffer.byteLength,
      })
    : null;
  const selectedLayers = [...new Set(request.layerIds)];
  if (selectedLayers.length === 0) {
    throw new Error('Local GeoTIFF workflow requires terrain-mesh or contour-lines.');
  }
  if (request.format === 'tiff') {
    throw new Error('Local GeoTIFF workflow emits derived vector or mesh formats, not TIFF.');
  }
  const sourceDerivedNoDataMask = request.qualityMask?.sourceDerivedNoDataMask === true;
  if (request.qualityMask && !sourceDerivedNoDataMask && !request.qualityMask.arrayBuffer) {
    throw new Error('Local GeoTIFF workflow qualityMask requires bytes unless it is source-derived.');
  }
  const qualityMaskBytes = request.qualityMask?.arrayBuffer
    ? new Uint8Array(request.qualityMask.arrayBuffer)
    : null;
  if (
    qualityMaskBytes
    && (
      qualityMaskBytes.byteLength < 1
      || qualityMaskBytes.byteLength > MAX_LOCAL_GEOTIFF_QUALITY_MASK_BYTES
    )
  ) {
    throw new Error(
      `Local GeoTIFF quality mask must contain between 1 and ${MAX_LOCAL_GEOTIFF_QUALITY_MASK_BYTES} bytes.`,
    );
  }
  const qualityMaskSha256 = qualityMaskBytes
    ? await sha256(qualityMaskBytes)
    : null;

  const decoded = await decodeGeoTiffElevationGrid({
    arrayBuffer: request.arrayBuffer,
    expectedSha256: request.sourceRecord.snapshotEvidence.contentSha256,
    gridId: request.gridId,
    title: request.title,
    verticalDatum: request.sourceRecord.snapshotEvidence.verticalDatum,
    sourceRecord: request.sourceRecord,
    generatedAt: request.generatedAt,
    countryCode: request.countryCode,
    bandIndex: request.bandIndex,
    imageIndex: request.imageIndex,
    window: request.window,
    ...(request.qualityMask && (
      sourceDerivedNoDataMask || (qualityMaskBytes && qualityMaskSha256)
    )
      ? {
          noDataResolution: {
            method: TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
            encoding: request.qualityMask.encoding,
            qualityMask: qualityMaskBytes ?? new Uint8Array(),
            expectedMaskSha256: qualityMaskSha256 ?? `sha256:${'0'.repeat(64)}`,
            maxResolvedCells:
              request.qualityMask.maxResolvedCells
              ?? MAX_GEOTIFF_RESOLVED_NODATA_CELLS,
            maxResolvedFraction:
              request.qualityMask.maxResolvedFraction
              ?? MAX_GEOTIFF_RESOLVED_NODATA_FRACTION,
            sourceDerivedNoDataMask,
          },
        }
      : {}),
    signal: request.signal,
  });
  const vectorized = vectorizeNormalizedElevationGrid(decoded.grid, {
    contourIntervalMeters: request.contourIntervalMeters,
    includeTerrainMesh: selectedLayers.includes('terrain-mesh'),
    includeContours: selectedLayers.includes('contour-lines'),
    ...(selectedLayers.includes('terrain-mesh')
      ? {
          meshLodStrides: request.meshLodStrides ?? [1, 2, 4, 8],
          meshMaxVerticalErrorMeters: request.meshMaxVerticalErrorMeters,
        }
      : {}),
  });
  const plan = buildTopographicExportPlan({
    bounds: decoded.grid.bounds,
    countryCode: request.countryCode,
    crs: decoded.grid.horizontalCrs,
    format: request.format,
    layerIds: selectedLayers,
    sourceRecords: [request.sourceRecord],
    dataMode: 'source-backed',
    contourIntervalMeters: selectedLayers.includes('contour-lines')
      ? request.contourIntervalMeters
      : undefined,
    now: request.generatedAt,
  });
  if (plan.status !== 'ready') {
    throw new Error(
      `Local GeoTIFF export gate blocked: ${plan.issues
        .map(issue => `${issue.code}: ${issue.message}`)
        .join('; ')}`,
    );
  }
  const output = serializeTopographicExport(vectorized.dataset, plan);
  const outputSha256 = await sha256(output.data);
  const meshLodBundle = await createLocalGeoTiffMeshLodBundle(
    vectorized,
    plan,
    request.sourceRecord,
  );
  const threeDTiles = meshLodBundle
    ? await (
        await import('./topographic3dTiles')
      ).buildTopographic3dTilesBundle(meshLodBundle)
    : null;
  const evidenceManifest: LocalGeoTiffEvidenceManifest = {
    schemaVersion: TOPOGRAPHIC_LOCAL_EVIDENCE_SCHEMA,
    workflowVersion: TOPOGRAPHIC_LOCAL_GEOTIFF_WORKFLOW_VERSION,
    generatedAt: request.generatedAt,
    source: {
      sourceId: request.sourceRecord.sourceId,
      publisher: request.sourceRecord.publisher,
      product: request.sourceRecord.product,
      version: request.sourceRecord.version,
      licenseId: request.sourceRecord.licenseId,
      termsUrl: request.sourceRecord.termsUrl,
      correctionUrl: request.sourceRecord.correctionUrl,
      attribution: request.sourceRecord.attribution,
      snapshotSha256: request.sourceRecord.snapshotEvidence.contentSha256,
      adapterVersion: request.sourceRecord.snapshotEvidence.adapterVersion,
      verifiedAt: request.sourceRecord.snapshotEvidence.verifiedAt,
      horizontalCrs: request.sourceRecord.snapshotEvidence.horizontalCrs,
      verticalDatum: request.sourceRecord.snapshotEvidence.verticalDatum,
    },
    input: {
      contentSha256: decoded.metadata.contentSha256,
    width: decoded.metadata.width,
    height: decoded.metadata.height,
    sourceImageWidth: decoded.metadata.sourceImageWidth,
    sourceImageHeight: decoded.metadata.sourceImageHeight,
    imageLayout: decoded.metadata.imageLayout,
    georeferencing: decoded.metadata.georeferencing,
    readWindow: decoded.metadata.readWindow,
      selectedBandIndex: decoded.metadata.selectedBandIndex,
      pixelInterpretation: decoded.metadata.pixelInterpretation,
      sourceHorizontalCrs: decoded.metadata.sourceHorizontalCrs,
      horizontalCrs: decoded.metadata.horizontalCrs,
      gridCoordinateModel: decoded.metadata.gridCoordinateModel,
      coordinateNormalization: decoded.metadata.coordinateNormalization,
      verticalDatum: decoded.metadata.verticalDatum,
      cogValidation,
      qualityMaskByteLength:
        decoded.metadata.noDataResolution.maskOrigin === 'source-nodata-derived'
          ? decoded.metadata.width * decoded.metadata.height
          : qualityMaskBytes?.byteLength ?? null,
      noDataResolution: decoded.metadata.noDataResolution,
    },
    derivation: {
      geotiffAdapterVersion: TOPOGRAPHIC_GEOTIFF_ADAPTER_VERSION,
      vectorizerVersion: TOPOGRAPHIC_ELEVATION_VECTORIZER_VERSION,
      selectedLayers,
      meshLodStrides: vectorized.meshLods.map(lod => lod.stride),
      meshLodQuality: vectorized.meshLodQuality,
      metrics: vectorized.metrics,
      contourTopology: vectorized.contourTopology,
    },
    output: {
      format: output.format,
      fileName: output.fileName,
      mediaType: output.mediaType,
      byteLength: output.byteLength,
      sha256: outputSha256,
      includedLayers: output.includedLayers,
      meshLodBundle: meshLodBundle
        ? {
            schemaVersion: TOPOGRAPHIC_MESH_LOD_BUNDLE_SCHEMA,
            artifactCount: meshLodBundle.artifacts.length,
            manifestFileName: meshLodBundle.manifest.fileName,
            manifestSha256: meshLodBundle.manifest.sha256,
          }
        : null,
      threeDTiles: threeDTiles?.status === 'ready'
        ? {
            status: 'ready',
            tilesetFileName: threeDTiles.bundle.tileset.fileName,
            tilesetSha256: threeDTiles.bundle.tileset.sha256,
            evidenceFileName: threeDTiles.bundle.evidence.fileName,
            evidenceSha256: threeDTiles.bundle.evidence.sha256,
          }
        : threeDTiles?.status === 'blocked'
          ? {
              status: 'blocked',
              issueCodes: threeDTiles.issues.map(issue => issue.code),
            }
          : null,
    },
    warnings: [
      ...decoded.warnings,
      ...vectorized.warnings,
      ...output.warnings,
    ],
    nonClaims: [...plan.nonClaims],
  };
  const evidenceData = `${JSON.stringify(evidenceManifest, null, 2)}\n`;
  return {
    decoded,
    vectorized,
    plan,
    output,
    meshLodBundle,
    threeDTiles,
    evidence: {
      fileName: `${safeId(vectorized.dataset.datasetId)}.evidence.json`,
      mediaType: 'application/json',
      data: evidenceData,
      byteLength: textEncoder.encode(evidenceData).byteLength,
      manifest: evidenceManifest,
    },
  };
}
