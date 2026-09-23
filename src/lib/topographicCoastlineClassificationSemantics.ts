import {
  auditTopographicSourceRecord,
  type TopographicSourceRecord,
} from './topographicExport';
import {
  COASTAL_SURFACE_BREAKLINE,
  COASTAL_SURFACE_LAND,
  COASTAL_SURFACE_OCEAN,
} from './topographicCoastalSeam';
import { MAX_GEOTIFF_BYTE_LENGTH } from './topographicGeoTiffAdapter';

export const TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA =
  'agid-coastal-surface-semantics-v0.1';
export const TOPOGRAPHIC_COASTLINE_LEGEND_RECEIPT_SCHEMA =
  'agid-topographic-coastline-legend-receipt-v0.1';
export const MAX_COASTLINE_LEGEND_BYTE_LENGTH = 1_048_576;

export type CoastlineClassificationSemanticEvidence = {
  schemaVersion: typeof TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA;
  bandIndex: number;
  legend: {
    url: string;
    version: string;
    publishedAt: string;
    sha256: `sha256:${string}`;
  };
  classes: Array<{
    value: 0 | 1 | 2;
    meaning: 'ocean' | 'breakline' | 'land';
  }>;
};

export type CoastlineClassificationLegendReceipt = {
  schemaVersion: typeof TOPOGRAPHIC_COASTLINE_LEGEND_RECEIPT_SCHEMA;
  validatedAt: string;
  source: {
    sourceId: string;
    version: string;
    classificationGeoTiffSha256: `sha256:${string}`;
  };
  legend: {
    contentSha256: `sha256:${string}`;
    byteLength: number;
  };
  classificationSemantics: CoastlineClassificationSemanticEvidence;
  result: {
    status: 'validated';
  };
};

function requireSha256(field: string, value: string) {
  if (!/^sha256:[a-f0-9]{64}$/i.test(value)) {
    throw new Error(`${field} must be a SHA-256 digest.`);
  }
}

function requireIsoTimestamp(field: string, value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
}

function validatePublicLegendUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Coastline classification legend URL must be absolute.');
  }
  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.username ||
    url.password
  ) {
    throw new Error('Coastline classification legend URL must be a public HTTP(S) URL without credentials.');
  }
  for (const key of url.searchParams.keys()) {
    if (/(?:api[-_]?key|token|secret|signature|credential|password)/i.test(key)) {
      throw new Error('Coastline classification legend URL must not contain credential-like query parameters.');
    }
  }
}

export function sourceBindsRelatedArtifactDigest(
  source: TopographicSourceRecord,
  digest: `sha256:${string}`,
) {
  return (
    source.snapshotEvidence?.relatedArtifactSha256?.some(
      value => value.toLowerCase() === digest.toLowerCase(),
    ) === true
  );
}

export function validateCoastlineClassificationSemantics(
  semantics: CoastlineClassificationSemanticEvidence,
) {
  if (
    semantics.schemaVersion !==
    TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA
  ) {
    throw new Error('Coastline classification semantics schema version is unsupported.');
  }
  if (!Number.isInteger(semantics.bandIndex) || semantics.bandIndex < 0) {
    throw new Error('Coastline classification semantics bandIndex must be a non-negative integer.');
  }
  validatePublicLegendUrl(semantics.legend.url);
  if (!semantics.legend.version.trim()) {
    throw new Error('Coastline classification legend version is required.');
  }
  requireIsoTimestamp(
    'Coastline classification legend publishedAt',
    semantics.legend.publishedAt,
  );
  requireSha256('Coastline classification legend', semantics.legend.sha256);
  const expectedByValue = new Map<
    number,
    CoastlineClassificationSemanticEvidence['classes'][number]['meaning']
  >([
    [COASTAL_SURFACE_OCEAN, 'ocean'],
    [COASTAL_SURFACE_BREAKLINE, 'breakline'],
    [COASTAL_SURFACE_LAND, 'land'],
  ]);
  if (semantics.classes.length !== expectedByValue.size) {
    throw new Error('Coastline classification semantics must declare exactly ocean, breakline, and land values.');
  }
  const declaredValues = new Set<number>();
  for (const entry of semantics.classes) {
    if (
      declaredValues.has(entry.value) ||
      expectedByValue.get(entry.value) !== entry.meaning
    ) {
      throw new Error('Coastline classification semantics class mapping is not the approved ocean/breakline/land mapping.');
    }
    declaredValues.add(entry.value);
  }
  if (declaredValues.size !== expectedByValue.size) {
    throw new Error('Coastline classification semantics class mapping is incomplete.');
  }
}

export function requireSourceBoundCoastlineClassificationSemantics(
  semantics: CoastlineClassificationSemanticEvidence,
  sourceRecord: TopographicSourceRecord,
  expectedBandIndex?: number,
) {
  validateCoastlineClassificationSemantics(semantics);
  if (
    expectedBandIndex !== undefined &&
    semantics.bandIndex !== expectedBandIndex
  ) {
    throw new Error('Coastline classification semantics bandIndex does not match the selected GeoTIFF band.');
  }
  if (!sourceBindsRelatedArtifactDigest(sourceRecord, semantics.legend.sha256)) {
    throw new Error('Coastline source must bind the reviewed legend digest as related evidence.');
  }
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map(key => (
    `${JSON.stringify(key)}:${canonicalJson(object[key])}`
  )).join(',')}}`;
}

async function sha256Bytes(bytes: Uint8Array) {
  const copiedBytes = Uint8Array.from(bytes);
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    copiedBytes.buffer,
  );
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

async function sha256Json(value: unknown) {
  return sha256Bytes(new TextEncoder().encode(canonicalJson(value)));
}

export async function hashCoastlineClassificationLegendReceipt(
  receipt: CoastlineClassificationLegendReceipt,
) {
  return sha256Json(receipt);
}

function requireSourceAudit(sourceRecord: TopographicSourceRecord, now: string) {
  const issues = auditTopographicSourceRecord(sourceRecord, {
    now,
    requireSnapshotEvidence: true,
  });
  if (issues.length > 0) {
    throw new Error(
      `Coastline legend source audit blocked: ${issues
        .map(issue => `${issue.code}: ${issue.message}`)
        .join('; ')}`,
    );
  }
  if (!sourceRecord.layerIds.includes('waterways')) {
    throw new Error('Coastline legend source record must be approved for the waterways layer.');
  }
}

export async function createCoastlineClassificationLegendReceipt(input: {
  sourceRecord: TopographicSourceRecord;
  classificationGeoTiff: ArrayBuffer;
  legendBytes: Uint8Array;
  classificationSemantics: CoastlineClassificationSemanticEvidence;
  validatedAt: string;
}): Promise<{
  receipt: CoastlineClassificationLegendReceipt;
  receiptSha256: `sha256:${string}`;
}> {
  requireIsoTimestamp('Coastline legend validatedAt', input.validatedAt);
  requireSourceAudit(input.sourceRecord, input.validatedAt);
  validateCoastlineClassificationSemantics(input.classificationSemantics);
  if (
    input.classificationGeoTiff.byteLength === 0 ||
    input.classificationGeoTiff.byteLength > MAX_GEOTIFF_BYTE_LENGTH
  ) {
    throw new Error('Coastline classification GeoTIFF byte length is unsupported.');
  }
  if (
    input.legendBytes.byteLength === 0 ||
    input.legendBytes.byteLength > MAX_COASTLINE_LEGEND_BYTE_LENGTH
  ) {
    throw new Error('Coastline classification legend byte length is unsupported.');
  }
  const classificationGeoTiffSha256 = await sha256Bytes(
    new Uint8Array(input.classificationGeoTiff),
  );
  if (
    input.sourceRecord.snapshotEvidence!.contentSha256.toLowerCase() !==
    classificationGeoTiffSha256.toLowerCase()
  ) {
    throw new Error('Coastline legend receipt GeoTIFF digest does not match the source snapshot.');
  }
  const legendSha256 = await sha256Bytes(input.legendBytes);
  if (
    input.classificationSemantics.legend.sha256.toLowerCase() !==
    legendSha256.toLowerCase()
  ) {
    throw new Error('Coastline legend receipt digest does not match the supplied legend bytes.');
  }
  const receipt: CoastlineClassificationLegendReceipt = {
    schemaVersion: TOPOGRAPHIC_COASTLINE_LEGEND_RECEIPT_SCHEMA,
    validatedAt: new Date(input.validatedAt).toISOString(),
    source: {
      sourceId: input.sourceRecord.sourceId,
      version: input.sourceRecord.version,
      classificationGeoTiffSha256,
    },
    legend: {
      contentSha256: legendSha256,
      byteLength: input.legendBytes.byteLength,
    },
    classificationSemantics: input.classificationSemantics,
    result: { status: 'validated' },
  };
  return {
    receipt,
    receiptSha256: await hashCoastlineClassificationLegendReceipt(receipt),
  };
}

export async function bindCoastlineClassificationLegendReceipt(input: {
  sourceRecord: TopographicSourceRecord;
  receipt: CoastlineClassificationLegendReceipt;
  expectedReceiptSha256: `sha256:${string}`;
}): Promise<TopographicSourceRecord> {
  requireSha256('Coastline legend receipt', input.expectedReceiptSha256);
  requireSourceAudit(input.sourceRecord, input.receipt.validatedAt);
  if (
    input.receipt.schemaVersion !==
    TOPOGRAPHIC_COASTLINE_LEGEND_RECEIPT_SCHEMA ||
    input.receipt.result.status !== 'validated'
  ) {
    throw new Error('Coastline legend receipt is not a validated supported receipt.');
  }
  requireIsoTimestamp('Coastline legend receipt validatedAt', input.receipt.validatedAt);
  if (
    input.receipt.source.sourceId !== input.sourceRecord.sourceId ||
    input.receipt.source.version !== input.sourceRecord.version ||
    input.receipt.source.classificationGeoTiffSha256.toLowerCase() !==
      input.sourceRecord.snapshotEvidence!.contentSha256.toLowerCase()
  ) {
    throw new Error('Coastline legend receipt does not match the selected source record.');
  }
  if (
    input.receipt.legend.contentSha256.toLowerCase() !==
    input.receipt.classificationSemantics.legend.sha256.toLowerCase()
  ) {
    throw new Error('Coastline legend receipt semantic digest does not match its legend digest.');
  }
  if (
    !Number.isSafeInteger(input.receipt.legend.byteLength) ||
    input.receipt.legend.byteLength <= 0 ||
    input.receipt.legend.byteLength > MAX_COASTLINE_LEGEND_BYTE_LENGTH
  ) {
    throw new Error('Coastline legend receipt byte length is unsupported.');
  }
  validateCoastlineClassificationSemantics(input.receipt.classificationSemantics);
  const receiptSha256 = await hashCoastlineClassificationLegendReceipt(
    input.receipt,
  );
  if (receiptSha256.toLowerCase() !== input.expectedReceiptSha256.toLowerCase()) {
    throw new Error('Coastline legend receipt SHA-256 does not match its content.');
  }
  const relatedArtifactSha256 = [
    ...(input.sourceRecord.snapshotEvidence!.relatedArtifactSha256 ?? []),
    input.receipt.legend.contentSha256,
    receiptSha256,
  ].filter((value, index, values) => (
    values.findIndex(candidate => candidate.toLowerCase() === value.toLowerCase()) === index
  ));
  const sourceRecord: TopographicSourceRecord = {
    ...input.sourceRecord,
    snapshotEvidence: {
      ...input.sourceRecord.snapshotEvidence!,
      relatedArtifactSha256,
    },
  };
  requireSourceBoundCoastlineClassificationSemantics(
    input.receipt.classificationSemantics,
    sourceRecord,
  );
  return sourceRecord;
}
