import {
  createHash,
  verify,
} from 'node:crypto';

import {
  loadAddressQlTrustPolicy,
} from './addressQlTrustPolicy';
import {
  TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION,
  type CoastlineLegendPromotionEvidence,
} from './topographicCoastlineLegendPromotionContract';
import {
  bindCoastlineClassificationLegendReceipt,
  hashCoastlineClassificationLegendReceipt,
  type CoastlineClassificationLegendReceipt,
} from './topographicCoastlineClassificationSemantics';
import type { TopographicSourceRecord } from './topographicExport';

export const TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_PAYLOAD_VERSION =
  'agid-coastline-legend-promotion-payload-v1';
export const TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_VERSION =
  'agid-coastline-legend-promotion-v1';
export {
  TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION,
  type CoastlineLegendPromotionEvidence,
} from './topographicCoastlineLegendPromotionContract';

const TECHNICAL_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;

export type CoastlineLegendPromotionPayload = {
  version: typeof TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_PAYLOAD_VERSION;
  promotionId: string;
  sequence: number;
  previousPromotionDigest: `sha256:${string}` | null;
  source: {
    sourceId: string;
    version: string;
    classificationGeoTiffSha256: `sha256:${string}`;
  };
  legendReceiptSha256: `sha256:${string}`;
  createdAt: string;
  validFrom: string;
  validUntil: string;
  minimumSignatures: number;
};

export type CoastlineLegendPromotionSignature = {
  keyId: string;
  reviewerId: string;
  signature: string;
};

export type CoastlineLegendPromotionState = {
  lastSequence: number;
  lastPromotionDigest: `sha256:${string}`;
};

function sha256(value: string) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}` as const;
}

function exactTimestamp(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`${label} must be an exact UTC timestamp`);
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${label} is invalid`);
  return timestamp;
}

function requireDigest(value: string, label: string) {
  if (!SHA256.test(value)) throw new Error(`${label} must be a SHA-256 digest`);
}

function validatePayload(payload: CoastlineLegendPromotionPayload) {
  if (payload.version !== TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_PAYLOAD_VERSION) {
    throw new Error('coastline legend promotion payload version is invalid');
  }
  if (!TECHNICAL_ID.test(payload.promotionId)) {
    throw new Error('coastline legend promotion id is invalid');
  }
  if (!Number.isSafeInteger(payload.sequence) || payload.sequence < 1) {
    throw new Error('coastline legend promotion sequence must be a positive safe integer');
  }
  if (
    payload.sequence === 1
    && payload.previousPromotionDigest !== null
  ) {
    throw new Error('first coastline legend promotion must not have a previous digest');
  }
  if (
    payload.sequence > 1
    && payload.previousPromotionDigest === null
  ) {
    throw new Error('subsequent coastline legend promotion requires a previous digest');
  }
  if (payload.previousPromotionDigest !== null) {
    requireDigest(payload.previousPromotionDigest, 'previous coastline legend promotion');
  }
  if (!payload.source.sourceId.trim() || !payload.source.version.trim()) {
    throw new Error('coastline legend promotion source identity is required');
  }
  requireDigest(
    payload.source.classificationGeoTiffSha256,
    'coastline legend promotion source GeoTIFF',
  );
  requireDigest(payload.legendReceiptSha256, 'coastline legend promotion receipt');
  const createdAt = exactTimestamp(payload.createdAt, 'coastline legend promotion createdAt');
  const validFrom = exactTimestamp(payload.validFrom, 'coastline legend promotion validFrom');
  const validUntil = exactTimestamp(payload.validUntil, 'coastline legend promotion validUntil');
  if (createdAt > validFrom || validUntil <= validFrom) {
    throw new Error('coastline legend promotion validity window is invalid');
  }
  if (
    !Number.isInteger(payload.minimumSignatures)
    || payload.minimumSignatures < 2
    || payload.minimumSignatures > 10
  ) {
    throw new Error('coastline legend promotion minimumSignatures must be between 2 and 10');
  }
}

export function buildCoastlineLegendPromotionPayload(
  payload: CoastlineLegendPromotionPayload,
) {
  validatePayload(payload);
  return JSON.stringify({
    version: payload.version,
    promotionId: payload.promotionId,
    sequence: payload.sequence,
    previousPromotionDigest: payload.previousPromotionDigest,
    source: {
      sourceId: payload.source.sourceId,
      version: payload.source.version,
      classificationGeoTiffSha256: payload.source.classificationGeoTiffSha256,
    },
    legendReceiptSha256: payload.legendReceiptSha256,
    createdAt: payload.createdAt,
    validFrom: payload.validFrom,
    validUntil: payload.validUntil,
    minimumSignatures: payload.minimumSignatures,
  });
}

function sortedSignatures(
  signatures: readonly CoastlineLegendPromotionSignature[],
) {
  return [...signatures].sort((left, right) => left.keyId.localeCompare(right.keyId));
}

export function hashCoastlineLegendPromotion(
  payload: CoastlineLegendPromotionPayload,
  signatures: readonly CoastlineLegendPromotionSignature[],
) {
  return sha256(JSON.stringify({
    payload: JSON.parse(buildCoastlineLegendPromotionPayload(payload)),
    signatures: sortedSignatures(signatures),
  }));
}

function assertNoRollback(
  payload: CoastlineLegendPromotionPayload,
  promotionDigest: `sha256:${string}`,
  previousState?: CoastlineLegendPromotionState,
) {
  if (!previousState) return;
  if (
    !Number.isSafeInteger(previousState.lastSequence)
    || previousState.lastSequence < 1
  ) {
    throw new Error('coastline legend promotion state sequence is invalid');
  }
  requireDigest(previousState.lastPromotionDigest, 'coastline legend promotion state digest');
  if (payload.sequence < previousState.lastSequence) {
    throw new Error('coastline legend promotion rollback was detected');
  }
  if (payload.sequence === previousState.lastSequence) {
    if (promotionDigest !== previousState.lastPromotionDigest) {
      throw new Error('coastline legend promotion sequence conflicts with stored state');
    }
    return;
  }
  if (
    payload.sequence !== previousState.lastSequence + 1
    || payload.previousPromotionDigest !== previousState.lastPromotionDigest
  ) {
    throw new Error('coastline legend promotion chain does not continue stored state');
  }
}

export async function verifyCoastlineLegendPromotion(input: {
  sourceRecord: TopographicSourceRecord;
  receipt: CoastlineClassificationLegendReceipt;
  payload: CoastlineLegendPromotionPayload;
  signatures: readonly CoastlineLegendPromotionSignature[];
  trustStorePath: string;
  now: string;
  previousState?: CoastlineLegendPromotionState;
}) {
  const now = exactTimestamp(input.now, 'coastline legend promotion verification time');
  validatePayload(input.payload);
  const validFrom = Date.parse(input.payload.validFrom);
  const validUntil = Date.parse(input.payload.validUntil);
  if (now < validFrom || now > validUntil) {
    throw new Error('coastline legend promotion is outside its validity window');
  }
  const receiptSha256 = await hashCoastlineClassificationLegendReceipt(input.receipt);
  if (receiptSha256 !== input.payload.legendReceiptSha256) {
    throw new Error('coastline legend promotion receipt digest mismatch');
  }
  if (
    input.payload.source.sourceId !== input.receipt.source.sourceId
    || input.payload.source.version !== input.receipt.source.version
    || input.payload.source.classificationGeoTiffSha256
      !== input.receipt.source.classificationGeoTiffSha256
  ) {
    throw new Error('coastline legend promotion source does not match its receipt');
  }
  const boundSourceRecord = await bindCoastlineClassificationLegendReceipt({
    sourceRecord: input.sourceRecord,
    receipt: input.receipt,
    expectedReceiptSha256: receiptSha256,
  });
  const trust = loadAddressQlTrustPolicy(input.trustStorePath, {
    now: input.now,
    requireV2: true,
  });
  const required = Math.max(input.payload.minimumSignatures, trust.minimumSignatures);
  if (new Set(input.signatures.map(item => item.keyId)).size !== input.signatures.length) {
    throw new Error('coastline legend promotion has duplicate reviewer keys');
  }
  if (
    new Set(input.signatures.map(item => item.reviewerId)).size
    !== input.signatures.length
  ) {
    throw new Error('coastline legend promotion requires independent reviewers');
  }
  if (input.signatures.length < required) {
    throw new Error(`coastline legend promotion requires at least ${required} signatures`);
  }
  const canonical = buildCoastlineLegendPromotionPayload(input.payload);
  for (const item of input.signatures) {
    const key = trust.usableKeys.get(item.keyId);
    if (!key) {
      throw new Error(`coastline legend reviewer key ${item.keyId} is not active`);
    }
    if (
      !TECHNICAL_ID.test(item.reviewerId)
      || trust.records.get(item.keyId)?.reviewerId !== item.reviewerId
    ) {
      throw new Error(`coastline legend reviewer identity mismatch for ${item.keyId}`);
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(item.signature)) {
      throw new Error('coastline legend promotion signature is not base64');
    }
    const signature = Buffer.from(item.signature, 'base64');
    if (
      signature.length !== 64
      || !verify(null, Buffer.from(canonical, 'utf8'), key, signature)
    ) {
      throw new Error(`coastline legend promotion signature failed for ${item.keyId}`);
    }
  }
  const promotionDigest = hashCoastlineLegendPromotion(
    input.payload,
    input.signatures,
  );
  assertNoRollback(input.payload, promotionDigest, input.previousState);
  const relatedArtifactSha256 = [
    ...(boundSourceRecord.snapshotEvidence?.relatedArtifactSha256 ?? []),
    promotionDigest,
  ].filter((value, index, values) => (
    values.findIndex(candidate => candidate.toLowerCase() === value.toLowerCase()) === index
  ));
  const sourceRecord: TopographicSourceRecord = {
    ...boundSourceRecord,
    snapshotEvidence: {
      ...boundSourceRecord.snapshotEvidence!,
      relatedArtifactSha256,
    },
  };
  const promotionEvidence: CoastlineLegendPromotionEvidence = {
    schemaVersion: TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION,
    status: 'approved',
    sourceId: input.payload.source.sourceId,
    sourceVersion: input.payload.source.version,
    classificationGeoTiffSha256:
      input.payload.source.classificationGeoTiffSha256,
    receiptSha256,
    promotionDigest,
    sequence: input.payload.sequence,
    verifiedSignatureCount: input.signatures.length,
    minimumSignatures: required,
  };
  return {
    status: 'approved' as const,
    version: TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_VERSION,
    sourceRecord,
    receiptSha256,
    promotionDigest,
    sequence: input.payload.sequence,
    verifiedSignatureCount: input.signatures.length,
    minimumSignatures: required,
    promotionEvidence,
    nextState: {
      lastSequence: input.payload.sequence,
      lastPromotionDigest: promotionDigest,
    },
    rollbackProtected: true,
    privacy: {
      containsRawAddress: false,
      containsRecipientData: false,
      containsAoidSecret: false,
      containsPrivateKey: false,
    },
  };
}
