import type { PosAcceptanceReceipt } from './posAcceptance';
import { sha256Hex } from './sha256';

export const POS_OFFLINE_USAGE_LEDGER_VERSION = 'agid-pos-offline-usage-ledger-v1';
export const POS_OFFLINE_USAGE_SYNC_ACTION = 'mark-shipping-label-nullifier-used';

export type PosOfflineUsageSyncStatus =
  | 'pending-sync'
  | 'synced'
  | 'audit-required';

export type PosOfflineUsageLedgerEntry = {
  id: string;
  modelVersion: typeof POS_OFFLINE_USAGE_LEDGER_VERSION;
  nullifier: string;
  receiptId: string;
  waybillAlias?: string;
  waybillCommitment?: string;
  addressReferenceCommitment?: string;
  jtiTail?: string;
  terminalId: string;
  operatorId?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: PosOfflineUsageSyncStatus;
  conflictReason?: string;
  conflictingReceiptId?: string;
  conflictDetectedAt?: string;
  serverEventId?: string;
  rawPayloadStored: false;
  rawAddressStored: false;
  rawAgidStored: false;
  rawWaybillIdStored: false;
  rawProofStored: false;
};

export type PosOfflineUsageSyncItem = {
  action: typeof POS_OFFLINE_USAGE_SYNC_ACTION;
  nullifier: string;
  receiptId: string;
  terminalId?: string;
  operatorId?: string;
  waybillAlias?: string;
  waybillCommitment?: string;
  addressReferenceCommitment?: string;
  jtiTail?: string;
  createdAt?: string;
};

export type PosOfflineUsageSyncOutcome = 'accepted' | 'conflict' | 'rejected';

export type PosOfflineUsageSyncEvent = {
  eventId: string;
  action: typeof POS_OFFLINE_USAGE_SYNC_ACTION;
  createdAt: string;
  nullifier: string;
  nullifierTail: string;
  receiptId?: string;
  terminalId?: string;
  operatorId?: string;
  outcome: PosOfflineUsageSyncOutcome;
  errors: string[];
  auditRequired: boolean;
};

export type PosOfflineUsageSyncResult = {
  modelVersion: typeof POS_OFFLINE_USAGE_LEDGER_VERSION;
  accepted: number;
  rejected: number;
  conflicts: number;
  auditRequired: number;
  events: PosOfflineUsageSyncEvent[];
};

const NULLIFIER_PATTERN = /^SLN-[0-9A-F]{16,64}$/;

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function boundedText(value: unknown, maxLength = 96) {
  return cleanText(value).replace(/[\r\n\t]+/g, ' ').slice(0, maxLength);
}

function cleanNullifier(value: unknown) {
  const cleaned = cleanText(value).toUpperCase();
  return NULLIFIER_PATTERN.test(cleaned) ? cleaned : '';
}

function cleanIsoTimestamp(value: unknown, fallback: string) {
  const cleaned = cleanText(value);
  if (!cleaned) return fallback;
  const parsed = Date.parse(cleaned);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function stableId(prefix: string, payload: unknown) {
  return `${prefix}-${sha256Hex(stableJson(payload)).slice(0, 24).toUpperCase()}`;
}

function nullifierTail(nullifier: string) {
  return nullifier.slice(-10);
}

function withPrivacyFlags<T extends object>(entry: T) {
  return {
    ...entry,
    rawPayloadStored: false as const,
    rawAddressStored: false as const,
    rawAgidStored: false as const,
    rawWaybillIdStored: false as const,
    rawProofStored: false as const,
  };
}

export function normalizePosOfflineUsageEntries(records: unknown): PosOfflineUsageLedgerEntry[] {
  if (!Array.isArray(records)) return [];
  const byNullifier = new Map<string, PosOfflineUsageLedgerEntry>();
  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) continue;
    const value = record as Partial<PosOfflineUsageLedgerEntry>;
    const nullifier = cleanNullifier(value.nullifier);
    const receiptId = boundedText(value.receiptId, 80);
    const terminalId = boundedText(value.terminalId, 80) || 'AGID-POS-LOCAL';
    if (!nullifier || !receiptId) continue;
    const createdAt = cleanIsoTimestamp(value.createdAt, new Date(0).toISOString());
    const syncStatus: PosOfflineUsageSyncStatus = value.syncStatus === 'synced' || value.syncStatus === 'audit-required'
      ? value.syncStatus
      : 'pending-sync';
    const normalized: PosOfflineUsageLedgerEntry = withPrivacyFlags({
      id: boundedText(value.id, 80) || stableId('POU', { nullifier, receiptId, terminalId }),
      modelVersion: POS_OFFLINE_USAGE_LEDGER_VERSION,
      nullifier,
      receiptId,
      ...(boundedText(value.waybillAlias, 80) ? { waybillAlias: boundedText(value.waybillAlias, 80) } : {}),
      ...(boundedText(value.waybillCommitment, 96) ? { waybillCommitment: boundedText(value.waybillCommitment, 96) } : {}),
      ...(boundedText(value.addressReferenceCommitment, 96) ? { addressReferenceCommitment: boundedText(value.addressReferenceCommitment, 96) } : {}),
      ...(boundedText(value.jtiTail, 16) ? { jtiTail: boundedText(value.jtiTail, 16) } : {}),
      terminalId,
      ...(boundedText(value.operatorId, 80) ? { operatorId: boundedText(value.operatorId, 80) } : {}),
      createdAt,
      updatedAt: cleanIsoTimestamp(value.updatedAt, createdAt),
      syncStatus,
      ...(boundedText(value.conflictReason, 96) ? { conflictReason: boundedText(value.conflictReason, 96) } : {}),
      ...(boundedText(value.conflictingReceiptId, 80) ? { conflictingReceiptId: boundedText(value.conflictingReceiptId, 80) } : {}),
      ...(value.conflictDetectedAt ? { conflictDetectedAt: cleanIsoTimestamp(value.conflictDetectedAt, createdAt) } : {}),
      ...(boundedText(value.serverEventId, 80) ? { serverEventId: boundedText(value.serverEventId, 80) } : {}),
    });
    const previous = byNullifier.get(nullifier);
    if (!previous || Date.parse(normalized.updatedAt) >= Date.parse(previous.updatedAt)) {
      byNullifier.set(nullifier, normalized);
    }
  }
  return Array.from(byNullifier.values()).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function createPosOfflineUsageEntryFromReceipt(
  receipt: PosAcceptanceReceipt,
  options: {
    now?: string;
  } = {},
): PosOfflineUsageLedgerEntry | null {
  const shippingLabel = receipt.shippingLabel;
  if (!receipt.accepted || !shippingLabel) return null;
  if (shippingLabel.scanRole !== 'recipient' || !shippingLabel.recipientControlVerified) return null;
  const nullifier = cleanNullifier(shippingLabel.nullifier);
  if (!nullifier) return null;
  const createdAt = cleanIsoTimestamp(options.now, receipt.createdAt);
  return withPrivacyFlags({
    id: stableId('POU', {
      nullifier,
      receiptId: receipt.receiptId,
      terminalId: receipt.terminalId,
    }),
    modelVersion: POS_OFFLINE_USAGE_LEDGER_VERSION,
    nullifier,
    receiptId: receipt.receiptId,
    waybillAlias: shippingLabel.waybillId,
    ...(shippingLabel.waybillCommitment ? { waybillCommitment: shippingLabel.waybillCommitment } : {}),
    ...(shippingLabel.addressReferenceCommitment ? { addressReferenceCommitment: shippingLabel.addressReferenceCommitment } : {}),
    jtiTail: shippingLabel.jti.slice(-8),
    terminalId: receipt.terminalId,
    ...(receipt.operatorId ? { operatorId: receipt.operatorId } : {}),
    createdAt,
    updatedAt: createdAt,
    syncStatus: 'pending-sync' as const,
  });
}

export function getPosOfflineUsedNullifiers(entries: Iterable<PosOfflineUsageLedgerEntry>) {
  return Array.from(new Set(Array.from(entries)
    .map(entry => cleanNullifier(entry.nullifier))
    .filter(Boolean)));
}

export function recordPosOfflineUsage(
  entries: PosOfflineUsageLedgerEntry[],
  receipt: PosAcceptanceReceipt,
  options: {
    now?: string;
  } = {},
) {
  const normalized = normalizePosOfflineUsageEntries(entries);
  const entry = createPosOfflineUsageEntryFromReceipt(receipt, options);
  if (!entry) {
    return {
      entries: normalized,
      recorded: false,
      conflict: false,
      auditRequired: false,
      warnings: ['receipt-does-not-create-offline-used-nullifier'],
    };
  }

  const existingIndex = normalized.findIndex(item => item.nullifier === entry.nullifier);
  if (existingIndex >= 0) {
    const existing = normalized[existingIndex];
    if (existing.receiptId === entry.receiptId) {
      return {
        entries: normalized,
        entry: existing,
        recorded: false,
        conflict: false,
        auditRequired: existing.syncStatus === 'audit-required',
        warnings: ['offline-used-nullifier-already-recorded-locally'],
      };
    }
    const updated = {
      ...existing,
      syncStatus: 'audit-required' as const,
      conflictReason: 'local-nullifier-duplicate',
      conflictingReceiptId: entry.receiptId,
      conflictDetectedAt: cleanIsoTimestamp(options.now, entry.createdAt),
      updatedAt: cleanIsoTimestamp(options.now, entry.createdAt),
    };
    const nextEntries = [...normalized];
    nextEntries[existingIndex] = updated;
    return {
      entries: normalizePosOfflineUsageEntries(nextEntries),
      entry: updated,
      recorded: false,
      conflict: true,
      auditRequired: true,
      warnings: ['offline-used-nullifier-local-conflict-requires-audit'],
    };
  }

  return {
    entries: normalizePosOfflineUsageEntries([entry, ...normalized]),
    entry,
    recorded: true,
    conflict: false,
    auditRequired: false,
    warnings: [],
  };
}

export function buildPosOfflineUsageSyncItems(
  entries: Iterable<PosOfflineUsageLedgerEntry>,
): PosOfflineUsageSyncItem[] {
  return normalizePosOfflineUsageEntries(Array.from(entries))
    .filter(entry => entry.syncStatus === 'pending-sync')
    .map(entry => ({
      action: POS_OFFLINE_USAGE_SYNC_ACTION,
      nullifier: entry.nullifier,
      receiptId: entry.receiptId,
      terminalId: entry.terminalId,
      ...(entry.operatorId ? { operatorId: entry.operatorId } : {}),
      ...(entry.waybillAlias ? { waybillAlias: entry.waybillAlias } : {}),
      ...(entry.waybillCommitment ? { waybillCommitment: entry.waybillCommitment } : {}),
      ...(entry.addressReferenceCommitment ? { addressReferenceCommitment: entry.addressReferenceCommitment } : {}),
      ...(entry.jtiTail ? { jtiTail: entry.jtiTail } : {}),
      createdAt: entry.createdAt,
    }));
}

export function normalizePosOfflineUsageSyncItem(value: unknown): PosOfflineUsageSyncItem | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Partial<PosOfflineUsageSyncItem>;
  if (item.action !== POS_OFFLINE_USAGE_SYNC_ACTION) return null;
  const nullifier = cleanNullifier(item.nullifier);
  const receiptId = boundedText(item.receiptId, 80);
  if (!nullifier || !receiptId) return null;
  return {
    action: POS_OFFLINE_USAGE_SYNC_ACTION,
    nullifier,
    receiptId,
    ...(boundedText(item.terminalId, 80) ? { terminalId: boundedText(item.terminalId, 80) } : {}),
    ...(boundedText(item.operatorId, 80) ? { operatorId: boundedText(item.operatorId, 80) } : {}),
    ...(boundedText(item.waybillAlias, 80) ? { waybillAlias: boundedText(item.waybillAlias, 80) } : {}),
    ...(boundedText(item.waybillCommitment, 96) ? { waybillCommitment: boundedText(item.waybillCommitment, 96) } : {}),
    ...(boundedText(item.addressReferenceCommitment, 96) ? { addressReferenceCommitment: boundedText(item.addressReferenceCommitment, 96) } : {}),
    ...(boundedText(item.jtiTail, 16) ? { jtiTail: boundedText(item.jtiTail, 16) } : {}),
    ...(item.createdAt ? { createdAt: cleanIsoTimestamp(item.createdAt, new Date(0).toISOString()) } : {}),
  };
}

export function buildPosOfflineUsageSyncEvent(input: {
  item: PosOfflineUsageSyncItem;
  outcome: PosOfflineUsageSyncOutcome;
  errors?: string[];
  now?: string;
}) {
  const now = cleanIsoTimestamp(input.now, new Date().toISOString());
  const nullifier = cleanNullifier(input.item.nullifier);
  return {
    eventId: stableId('POUSE', {
      nullifier,
      receiptId: input.item.receiptId,
      outcome: input.outcome,
      now,
    }),
    action: POS_OFFLINE_USAGE_SYNC_ACTION,
    createdAt: now,
    nullifier,
    nullifierTail: nullifierTail(nullifier),
    receiptId: input.item.receiptId,
    ...(input.item.terminalId ? { terminalId: input.item.terminalId } : {}),
    ...(input.item.operatorId ? { operatorId: input.item.operatorId } : {}),
    outcome: input.outcome,
    errors: Array.from(new Set(input.errors || [])),
    auditRequired: input.outcome !== 'accepted',
  } satisfies PosOfflineUsageSyncEvent;
}

export function reconcilePosOfflineUsageSync(
  entries: PosOfflineUsageLedgerEntry[],
  result: PosOfflineUsageSyncResult,
  options: {
    now?: string;
  } = {},
) {
  const now = cleanIsoTimestamp(options.now, new Date().toISOString());
  const byNullifier = new Map(normalizePosOfflineUsageEntries(entries).map(entry => [entry.nullifier, entry]));

  for (const event of result.events) {
    const nullifier = cleanNullifier(event.nullifier);
    if (!nullifier) continue;
    const existing = byNullifier.get(nullifier);
    if (!existing) continue;
    byNullifier.set(nullifier, {
      ...existing,
      syncStatus: event.outcome === 'accepted' ? 'synced' : 'audit-required',
      updatedAt: now,
      serverEventId: event.eventId,
      ...(event.outcome !== 'accepted'
        ? {
          conflictReason: event.outcome === 'conflict'
            ? 'server-nullifier-conflict'
            : event.errors[0] || 'server-sync-rejected',
          conflictDetectedAt: now,
        }
        : {}),
    });
  }

  return normalizePosOfflineUsageEntries(Array.from(byNullifier.values()));
}

export function summarizePosOfflineUsageLedger(entries: Iterable<PosOfflineUsageLedgerEntry>) {
  const normalized = normalizePosOfflineUsageEntries(Array.from(entries));
  const pendingSync = normalized.filter(entry => entry.syncStatus === 'pending-sync').length;
  const synced = normalized.filter(entry => entry.syncStatus === 'synced').length;
  const auditRequired = normalized.filter(entry => entry.syncStatus === 'audit-required').length;
  return {
    modelVersion: POS_OFFLINE_USAGE_LEDGER_VERSION,
    total: normalized.length,
    pendingSync,
    synced,
    auditRequired,
    conflictTails: normalized
      .filter(entry => entry.syncStatus === 'audit-required')
      .map(entry => nullifierTail(entry.nullifier)),
    rawPayloadStored: false as const,
    rawAddressStored: false as const,
    rawAgidStored: false as const,
    rawWaybillIdStored: false as const,
    rawProofStored: false as const,
  };
}
