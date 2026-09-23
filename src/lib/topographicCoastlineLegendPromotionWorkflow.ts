import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';

import type {
  CoastlineClassificationLegendReceipt,
} from './topographicCoastlineClassificationSemantics';
import type { TopographicSourceRecord } from './topographicExport';
import {
  hashCoastlineLegendPromotion,
  verifyCoastlineLegendPromotion,
  type CoastlineLegendPromotionPayload,
  type CoastlineLegendPromotionSignature,
  type CoastlineLegendPromotionState,
} from './topographicCoastlineLegendPromotion';

export const TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_LEDGER_VERSION =
  'agid-coastline-legend-promotion-ledger-v1';
export const TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_STATE_VERSION =
  'agid-coastline-legend-promotion-state-v1';
export const TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_WORKFLOW_VERSION =
  'agid-coastline-legend-promotion-workflow-v1';

const MAX_LEDGER_BYTES = 512 * 1024;
const MAX_STATE_BYTES = 64 * 1024;
const SHA256 = /^sha256:[a-f0-9]{64}$/;

export type CoastlineLegendPromotionLedger = {
  version: typeof TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_LEDGER_VERSION;
  payload: CoastlineLegendPromotionPayload;
  signatures: CoastlineLegendPromotionSignature[];
  promotionDigest: `sha256:${string}`;
};

export type CoastlineLegendPromotionPersistentState =
  CoastlineLegendPromotionState & {
    version: typeof TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_STATE_VERSION;
    lastReceiptSha256: `sha256:${string}`;
    updatedAt: string;
  };

function exactTimestamp(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`${label} must be an exact UTC timestamp`);
  }
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} is invalid`);
}

function requireDigest(value: string, label: string) {
  if (!SHA256.test(value)) throw new Error(`${label} must be a SHA-256 digest`);
}

function readBoundedJson<T>(path: string, maximumBytes: number, label: string) {
  const absolutePath = resolve(path);
  const stats = statSync(absolutePath);
  if (!stats.isFile() || stats.size <= 0 || stats.size > maximumBytes) {
    throw new Error(`${label} must be a bounded regular file`);
  }
  const value = JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value as T;
}

function parseState(value: CoastlineLegendPromotionPersistentState) {
  if (value.version !== TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_STATE_VERSION) {
    throw new Error('coastline legend promotion state version is invalid');
  }
  if (!Number.isSafeInteger(value.lastSequence) || value.lastSequence < 1) {
    throw new Error('coastline legend promotion state sequence is invalid');
  }
  requireDigest(value.lastPromotionDigest, 'coastline legend promotion state digest');
  requireDigest(value.lastReceiptSha256, 'coastline legend promotion state receipt');
  exactTimestamp(value.updatedAt, 'coastline legend promotion state updatedAt');
  return value;
}

export function readCoastlineLegendPromotionState(path: string) {
  const absolutePath = resolve(path);
  if (!existsSync(absolutePath)) return undefined;
  return parseState(readBoundedJson<CoastlineLegendPromotionPersistentState>(
    absolutePath,
    MAX_STATE_BYTES,
    'coastline legend promotion state',
  ));
}

function readLedger(ledger: CoastlineLegendPromotionLedger) {
  if (ledger.version !== TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_LEDGER_VERSION) {
    throw new Error('coastline legend promotion ledger version is invalid');
  }
  if (!Array.isArray(ledger.signatures) || ledger.signatures.length === 0) {
    throw new Error('coastline legend promotion ledger requires signatures');
  }
  requireDigest(ledger.promotionDigest, 'coastline legend promotion ledger digest');
  const expected = hashCoastlineLegendPromotion(ledger.payload, ledger.signatures);
  if (expected !== ledger.promotionDigest) {
    throw new Error('coastline legend promotion ledger digest mismatch');
  }
  return ledger;
}

export function readCoastlineLegendPromotionLedger(path: string) {
  return readLedger(readBoundedJson<CoastlineLegendPromotionLedger>(
    path,
    MAX_LEDGER_BYTES,
    'coastline legend promotion ledger',
  ));
}

function acquireStateLock(statePath: string) {
  const absoluteStatePath = resolve(statePath);
  const lockPath = `${absoluteStatePath}.lock`;
  mkdirSync(dirname(absoluteStatePath), { recursive: true });
  try {
    writeFileSync(lockPath, `${JSON.stringify({
      workflow: TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_WORKFLOW_VERSION,
      processId: process.pid,
      createdAt: new Date().toISOString(),
    })}\n`, { encoding: 'utf8', flag: 'wx' });
  } catch {
    throw new Error('coastline legend promotion state is locked; refusing concurrent advancement');
  }
  return { absoluteStatePath, lockPath };
}

function writeStateAtomically(
  statePath: string,
  state: CoastlineLegendPromotionPersistentState,
) {
  const absolutePath = resolve(statePath);
  const temporaryPath = `${absolutePath}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(
    temporaryPath,
    `${JSON.stringify(state, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );
  renameSync(temporaryPath, absolutePath);
}

export async function verifyAndAdvanceCoastlineLegendPromotion(input: {
  sourceRecord: TopographicSourceRecord;
  receipt: CoastlineClassificationLegendReceipt;
  ledger: CoastlineLegendPromotionLedger;
  trustStorePath: string;
  statePath: string;
  now: string;
}) {
  exactTimestamp(input.now, 'coastline legend promotion workflow now');
  const lock = acquireStateLock(input.statePath);
  try {
    const ledger = readLedger(input.ledger);
    const previousState = readCoastlineLegendPromotionState(lock.absoluteStatePath);
    const result = await verifyCoastlineLegendPromotion({
      sourceRecord: input.sourceRecord,
      receipt: input.receipt,
      payload: ledger.payload,
      signatures: ledger.signatures,
      trustStorePath: input.trustStorePath,
      now: input.now,
      previousState,
    });
    const nextState: CoastlineLegendPromotionPersistentState = {
      version: TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_STATE_VERSION,
      ...result.nextState,
      lastReceiptSha256: result.receiptSha256,
      updatedAt: input.now,
    };
    const stateAdvanced = previousState?.lastPromotionDigest !== result.promotionDigest;
    if (stateAdvanced) writeStateAtomically(lock.absoluteStatePath, nextState);
    return {
      ...result,
      version: TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_WORKFLOW_VERSION,
      statePath: lock.absoluteStatePath,
      stateAdvanced,
      nextState,
    };
  } finally {
    unlinkSync(lock.lockPath);
  }
}
