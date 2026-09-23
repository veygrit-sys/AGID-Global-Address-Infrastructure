import Dexie,{ Table } from 'dexie';

import { normalizeAOIDRecord } from './aoid';
import type { AgidAoidAuditEvent } from './agidAoidGovernance';
import type { DeliveryPosScenarioKind } from './deliveryPosSimulation';
import type { PosAcceptanceReceipt } from './posAcceptance';
import {
  normalizePosOfflineUsageEntries,
  type PosOfflineUsageLedgerEntry,
} from './posOfflineUsageLedger';
import type {
  PosDeviceDiagnostic,
  PosExceptionAuditCase,
  PosHandoffReverificationReport,
} from './posOperationalControls';
import type { RegisteredAddressRecord,SavedRegisteredAddressQr } from './registeredAddressQr';
import type { TradeComplianceSourceId } from './tradeComplianceDataPlan';

export type SavedAgidRecord = {
  id: string;
  lat?: number;
  lon?: number;
  prefix?: string;
  isSea?: boolean;
  address?: string;
  savedAt?: string;
  [key: string]: unknown;
};

export type SavedQrRecord = SavedRegisteredAddressQr & {
  [key: string]: unknown;
};

export type AoidDatabaseRecord = RegisteredAddressRecord & {
  isAoid?: boolean;
  [key: string]: unknown;
};

export type DeliveryPosPrivacyFlags = {
  rawPayloadStored: false;
  rawAddressStored: false;
  decryptedAgidStored: false;
  rawAgidSecureStored: false;
};

export type DeliveryPosShipmentStatus =
  | 'draft'
  | 'accepted'
  | 'review'
  | 'rejected'
  | 'handoff'
  | 'completed'
  | 'cancelled';

export type DeliveryPosShipmentRecord = DeliveryPosPrivacyFlags & {
  id: string;
  kind: DeliveryPosScenarioKind;
  status: DeliveryPosShipmentStatus;
  receiptId?: string;
  crossBorderDeclarationId?: string;
  handoffId?: string;
  terminalId?: string;
  operatorId?: string;
  originCountry?: string;
  destinationCountry?: string;
  addressLanguage?: string;
  addressQuality?: number;
  agidTail?: string;
  aoidTail?: string;
  privacyMode: 'metadata-only' | 'redacted-receipt' | 'encrypted-envelope';
  createdAt: string;
  updatedAt: string;
};

export type DeliveryPosReceiptRecord = PosAcceptanceReceipt & {
  id: string;
  shipmentId?: string;
  rawPayloadStored: false;
  rawAddressStored: false;
  decryptedAgidStored: false;
  rawAgidSecureStored: false;
};

export type DeliveryPosAuditRecord = PosExceptionAuditCase & {
  id: string;
  shipmentId?: string;
  rawPayloadStored: false;
  rawAddressStored: false;
  decryptedAgidStored: false;
  rawAgidSecureStored: false;
};

export type DeliveryPosHandoffRecord = DeliveryPosPrivacyFlags & {
  id: string;
  shipmentId: string;
  receiptId?: string;
  terminalId?: string;
  operatorId?: string;
  carrierId?: string;
  status: 'pending' | 'in-transit' | 'completed' | 'blocked';
  report?: PosHandoffReverificationReport;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type DeliveryPosDeviceDiagnosticRecord = PosDeviceDiagnostic & {
  id: string;
  terminalId: string;
  operatorId?: string;
  rawPayloadStored: false;
  rawAddressStored: false;
  decryptedAgidStored: false;
  rawAgidSecureStored: false;
};

export type DeliveryPosCrossBorderDeclarationRecord = DeliveryPosPrivacyFlags & {
  id: string;
  shipmentId: string;
  status: 'draft' | 'complete' | 'review' | 'blocked';
  originCountry: string;
  destinationCountry: string;
  hsCode?: string;
  declaredValue?: number;
  currency?: string;
  evidenceSourceIds: TradeComplianceSourceId[];
  advisoryOnly: true;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryPosOfflineUsageRecord = PosOfflineUsageLedgerEntry & DeliveryPosPrivacyFlags;

export type SyncQueueAction = 'create' | 'update' | 'delete';
export type SyncQueueStatus = 'pending' | 'sending' | 'failed';

export type SyncQueueRecord = {
  id: string;
  entityType:
    | 'savedAgid'
    | 'savedQr'
    | 'registeredAddress'
    | 'aoid'
    | 'settings'
    | 'posShipment'
    | 'posReceipt'
    | 'posAuditCase'
    | 'posHandoff'
    | 'posDeviceDiagnostic'
    | 'posCrossBorderDeclaration'
    | 'posOfflineUsage';
  entityId: string;
  action: SyncQueueAction;
  payload?: unknown;
  status: SyncQueueStatus;
  attemptCount: number;
  createdAt: number;
  updatedAt: number;
  nextAttemptAt?: number;
  lastError?: string;
  audit?: AgidAoidAuditEvent;
};

export type AppDatabaseSnapshot = {
  savedAgids: SavedAgidRecord[];
  savedQrs: SavedQrRecord[];
  registeredAddresses: RegisteredAddressRecord[];
  aoids: AoidDatabaseRecord[];
  syncQueue: SyncQueueRecord[];
  posShipments: DeliveryPosShipmentRecord[];
  posReceipts: DeliveryPosReceiptRecord[];
  posAuditCases: DeliveryPosAuditRecord[];
  posHandoffs: DeliveryPosHandoffRecord[];
  posDeviceDiagnostics: DeliveryPosDeviceDiagnosticRecord[];
  posCrossBorderDeclarations: DeliveryPosCrossBorderDeclarationRecord[];
  posOfflineUsageLedger: DeliveryPosOfflineUsageRecord[];
};

export const EMPTY_APP_DATABASE_SNAPSHOT: AppDatabaseSnapshot = {
  savedAgids: [],
  savedQrs: [],
  registeredAddresses: [],
  aoids: [],
  syncQueue: [],
  posShipments: [],
  posReceipts: [],
  posAuditCases: [],
  posHandoffs: [],
  posDeviceDiagnostics: [],
  posCrossBorderDeclarations: [],
  posOfflineUsageLedger: [],
};

class AgidAppDatabase extends Dexie {
  savedAgids!: Table<SavedAgidRecord, string>;
  savedQrs!: Table<SavedQrRecord, string>;
  registeredAddresses!: Table<RegisteredAddressRecord, string>;
  aoids!: Table<AoidDatabaseRecord, string>;
  syncQueue!: Table<SyncQueueRecord, string>;
  posShipments!: Table<DeliveryPosShipmentRecord, string>;
  posReceipts!: Table<DeliveryPosReceiptRecord, string>;
  posAuditCases!: Table<DeliveryPosAuditRecord, string>;
  posHandoffs!: Table<DeliveryPosHandoffRecord, string>;
  posDeviceDiagnostics!: Table<DeliveryPosDeviceDiagnosticRecord, string>;
  posCrossBorderDeclarations!: Table<DeliveryPosCrossBorderDeclarationRecord, string>;
  posOfflineUsageLedger!: Table<DeliveryPosOfflineUsageRecord, string>;

  constructor() {
    super('AGID_AppDB');
    this.version(1).stores({
      savedAgids: 'id, savedAt, prefix, address',
      savedQrs: 'id, savedAt, source, address, regionName',
      registeredAddresses: 'id, type, agid, country, updatedAt, registeredAt, name, address',
      aoids: 'id, type, agid, country, updatedAt, registeredAt, name, address',
    });
    this.version(2).stores({
      savedAgids: 'id, savedAt, prefix, address',
      savedQrs: 'id, savedAt, source, address, regionName',
      registeredAddresses: 'id, type, agid, country, updatedAt, registeredAt, name, address',
      aoids: 'id, type, agid, country, updatedAt, registeredAt, name, address',
      syncQueue: 'id, status, entityType, entityId, updatedAt, nextAttemptAt',
    });
    this.version(3).stores({
      savedAgids: 'id, savedAt, prefix, address',
      savedQrs: 'id, savedAt, source, address, regionName',
      registeredAddresses: 'id, type, agid, country, updatedAt, registeredAt, name, address',
      aoids: 'id, type, agid, country, updatedAt, registeredAt, name, address',
      syncQueue: 'id, status, entityType, entityId, updatedAt, nextAttemptAt',
      posShipments: 'id, kind, status, receiptId, terminalId, updatedAt, destinationCountry',
      posReceipts: 'id, shipmentId, status, channel, terminalId, createdAt',
      posAuditCases: 'id, shipmentId, receiptId, status, severity, createdAt',
      posHandoffs: 'id, shipmentId, receiptId, status, terminalId, updatedAt',
      posDeviceDiagnostics: 'id, terminalId, kind, status, checkedAt',
      posCrossBorderDeclarations: 'id, shipmentId, status, originCountry, destinationCountry, updatedAt',
    });
    this.version(4).stores({
      savedAgids: 'id, savedAt, prefix, address',
      savedQrs: 'id, savedAt, source, address, regionName',
      registeredAddresses: 'id, type, agid, country, updatedAt, registeredAt, name, address',
      aoids: 'id, type, agid, country, updatedAt, registeredAt, name, address',
      syncQueue: 'id, status, entityType, entityId, updatedAt, nextAttemptAt',
      posShipments: 'id, kind, status, receiptId, terminalId, updatedAt, destinationCountry',
      posReceipts: 'id, shipmentId, status, channel, terminalId, createdAt',
      posAuditCases: 'id, shipmentId, receiptId, status, severity, createdAt',
      posHandoffs: 'id, shipmentId, receiptId, status, terminalId, updatedAt',
      posDeviceDiagnostics: 'id, terminalId, kind, status, checkedAt',
      posCrossBorderDeclarations: 'id, shipmentId, status, originCountry, destinationCountry, updatedAt',
      posOfflineUsageLedger: 'id, nullifier, receiptId, terminalId, syncStatus, updatedAt',
    });
  }
}

const appDatabase = new AgidAppDatabase();

function cloneSnapshot(snapshot: Partial<AppDatabaseSnapshot> = {}): AppDatabaseSnapshot {
  return {
    savedAgids: [...(snapshot.savedAgids || [])],
    savedQrs: [...(snapshot.savedQrs || [])],
    registeredAddresses: [...(snapshot.registeredAddresses || [])],
    aoids: [...(snapshot.aoids || [])],
    syncQueue: [...(snapshot.syncQueue || [])],
    posShipments: [...(snapshot.posShipments || [])],
    posReceipts: [...(snapshot.posReceipts || [])],
    posAuditCases: [...(snapshot.posAuditCases || [])],
    posHandoffs: [...(snapshot.posHandoffs || [])],
    posDeviceDiagnostics: [...(snapshot.posDeviceDiagnostics || [])],
    posCrossBorderDeclarations: [...(snapshot.posCrossBorderDeclarations || [])],
    posOfflineUsageLedger: [...(snapshot.posOfflineUsageLedger || [])],
  };
}

export function isClientDatabaseSupported() {
  return typeof globalThis.indexedDB !== 'undefined';
}

export function sanitizeDatabaseRecords<T extends { id?: unknown }>(records: unknown): Array<T & { id: string }> {
  if (!Array.isArray(records)) return [];
  return records.filter((record): record is T & { id: string } => (
    Boolean(record)
    && typeof record === 'object'
    && typeof (record as { id?: unknown }).id === 'string'
    && (record as { id: string }).id.trim().length > 0
  ));
}

export function mergeRecordsById<T extends { id?: unknown }>(primary: unknown, fallback: unknown): Array<T & { id: string }> {
  const merged = new Map<string, T & { id: string }>();
  for (const record of sanitizeDatabaseRecords<T>(primary)) {
    merged.set(record.id, record);
  }
  for (const record of sanitizeDatabaseRecords<T>(fallback)) {
    if (!merged.has(record.id)) merged.set(record.id, record);
  }
  return Array.from(merged.values());
}

function normalizeAoidRecords(records: unknown) {
  return sanitizeDatabaseRecords<AoidDatabaseRecord>(records)
    .flatMap(record => {
      try {
        return [normalizeAOIDRecord({ ...record, type: 'AOID' })];
      } catch {
        return [];
      }
    });
}

function withDeliveryPosPrivacyFlags<T extends object>(record: T): T & DeliveryPosPrivacyFlags {
  return {
    ...record,
    rawPayloadStored: false,
    rawAddressStored: false,
    decryptedAgidStored: false,
    rawAgidSecureStored: false,
  };
}

function normalizePosShipmentRecords(records: unknown) {
  return sanitizeDatabaseRecords<DeliveryPosShipmentRecord>(records)
    .map(record => withDeliveryPosPrivacyFlags(record));
}

function normalizePosReceiptRecords(records: unknown) {
  return sanitizeDatabaseRecords<DeliveryPosReceiptRecord>(records)
    .map(record => withDeliveryPosPrivacyFlags(record));
}

function normalizePosAuditRecords(records: unknown) {
  return sanitizeDatabaseRecords<DeliveryPosAuditRecord>(records)
    .map(record => withDeliveryPosPrivacyFlags(record));
}

function normalizePosHandoffRecords(records: unknown) {
  return sanitizeDatabaseRecords<DeliveryPosHandoffRecord>(records)
    .map(record => withDeliveryPosPrivacyFlags(record));
}

function normalizePosDeviceDiagnosticRecords(records: unknown) {
  return sanitizeDatabaseRecords<DeliveryPosDeviceDiagnosticRecord>(records)
    .map(record => withDeliveryPosPrivacyFlags(record));
}

function normalizePosCrossBorderDeclarationRecords(records: unknown) {
  return sanitizeDatabaseRecords<DeliveryPosCrossBorderDeclarationRecord>(records)
    .map(record => ({
      ...withDeliveryPosPrivacyFlags(record),
      advisoryOnly: true as const,
      evidenceSourceIds: Array.isArray(record.evidenceSourceIds) ? record.evidenceSourceIds : [],
    }));
}

function normalizePosOfflineUsageRecords(records: unknown) {
  return normalizePosOfflineUsageEntries(records)
    .map(record => withDeliveryPosPrivacyFlags(record));
}

export function toDeliveryPosReceiptRecord(
  receipt: PosAcceptanceReceipt,
  options: {
    shipmentId?: string;
  } = {},
): DeliveryPosReceiptRecord {
  return withDeliveryPosPrivacyFlags({
    ...receipt,
    id: receipt.receiptId,
    ...(options.shipmentId ? { shipmentId: options.shipmentId } : {}),
  });
}

async function replaceTable<T, TKey>(table: Table<T, TKey>, records: T[]) {
  await table.clear();
  if (records.length > 0) {
    await table.bulkPut(records);
  }
}

async function orderedByNewest<T>(table: Table<T, string>, key: string) {
  try {
    return await table.orderBy(key).reverse().toArray();
  } catch {
    return table.toArray();
  }
}

export async function loadAppDatabaseSnapshot(
  fallback: Partial<AppDatabaseSnapshot> = EMPTY_APP_DATABASE_SNAPSHOT,
): Promise<AppDatabaseSnapshot> {
  const fallbackSnapshot = cloneSnapshot(fallback);
  if (!isClientDatabaseSupported()) {
    return {
      ...fallbackSnapshot,
      aoids: normalizeAoidRecords(fallbackSnapshot.aoids),
      posShipments: normalizePosShipmentRecords(fallbackSnapshot.posShipments),
      posReceipts: normalizePosReceiptRecords(fallbackSnapshot.posReceipts),
      posAuditCases: normalizePosAuditRecords(fallbackSnapshot.posAuditCases),
      posHandoffs: normalizePosHandoffRecords(fallbackSnapshot.posHandoffs),
      posDeviceDiagnostics: normalizePosDeviceDiagnosticRecords(fallbackSnapshot.posDeviceDiagnostics),
      posCrossBorderDeclarations: normalizePosCrossBorderDeclarationRecords(
        fallbackSnapshot.posCrossBorderDeclarations,
      ),
      posOfflineUsageLedger: normalizePosOfflineUsageRecords(fallbackSnapshot.posOfflineUsageLedger),
    };
  }

  try {
    const [
      savedAgids,
      savedQrs,
      registeredAddresses,
      aoids,
      syncQueue,
      posShipments,
      posReceipts,
      posAuditCases,
      posHandoffs,
      posDeviceDiagnostics,
      posCrossBorderDeclarations,
      posOfflineUsageLedger,
    ] = await Promise.all([
      orderedByNewest(appDatabase.savedAgids, 'savedAt'),
      orderedByNewest(appDatabase.savedQrs, 'savedAt'),
      orderedByNewest(appDatabase.registeredAddresses, 'updatedAt'),
      orderedByNewest(appDatabase.aoids, 'updatedAt'),
      orderedByNewest(appDatabase.syncQueue, 'updatedAt'),
      orderedByNewest(appDatabase.posShipments, 'updatedAt'),
      orderedByNewest(appDatabase.posReceipts, 'createdAt'),
      orderedByNewest(appDatabase.posAuditCases, 'createdAt'),
      orderedByNewest(appDatabase.posHandoffs, 'updatedAt'),
      orderedByNewest(appDatabase.posDeviceDiagnostics, 'checkedAt'),
      orderedByNewest(appDatabase.posCrossBorderDeclarations, 'updatedAt'),
      orderedByNewest(appDatabase.posOfflineUsageLedger, 'updatedAt'),
    ]);

    return {
      savedAgids: mergeRecordsById<SavedAgidRecord>(savedAgids, fallbackSnapshot.savedAgids),
      savedQrs: mergeRecordsById<SavedQrRecord>(savedQrs, fallbackSnapshot.savedQrs),
      registeredAddresses: mergeRecordsById<RegisteredAddressRecord>(
        registeredAddresses,
        fallbackSnapshot.registeredAddresses,
      ),
      aoids: normalizeAoidRecords(mergeRecordsById<AoidDatabaseRecord>(aoids, fallbackSnapshot.aoids)),
      syncQueue: mergeRecordsById<SyncQueueRecord>(syncQueue, fallbackSnapshot.syncQueue),
      posShipments: normalizePosShipmentRecords(
        mergeRecordsById<DeliveryPosShipmentRecord>(posShipments, fallbackSnapshot.posShipments),
      ),
      posReceipts: normalizePosReceiptRecords(
        mergeRecordsById<DeliveryPosReceiptRecord>(posReceipts, fallbackSnapshot.posReceipts),
      ),
      posAuditCases: normalizePosAuditRecords(
        mergeRecordsById<DeliveryPosAuditRecord>(posAuditCases, fallbackSnapshot.posAuditCases),
      ),
      posHandoffs: normalizePosHandoffRecords(
        mergeRecordsById<DeliveryPosHandoffRecord>(posHandoffs, fallbackSnapshot.posHandoffs),
      ),
      posDeviceDiagnostics: normalizePosDeviceDiagnosticRecords(
        mergeRecordsById<DeliveryPosDeviceDiagnosticRecord>(
          posDeviceDiagnostics,
          fallbackSnapshot.posDeviceDiagnostics,
        ),
      ),
      posCrossBorderDeclarations: normalizePosCrossBorderDeclarationRecords(
        mergeRecordsById<DeliveryPosCrossBorderDeclarationRecord>(
          posCrossBorderDeclarations,
          fallbackSnapshot.posCrossBorderDeclarations,
        ),
      ),
      posOfflineUsageLedger: normalizePosOfflineUsageRecords(
        mergeRecordsById<DeliveryPosOfflineUsageRecord>(
          posOfflineUsageLedger,
          fallbackSnapshot.posOfflineUsageLedger,
        ),
      ),
    };
  } catch (error) {
    console.warn('[AGID DB] Falling back to localStorage snapshot:', error);
    return fallbackSnapshot;
  }
}

export async function persistSavedAgids(records: SavedAgidRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.savedAgids, sanitizeDatabaseRecords<SavedAgidRecord>(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist saved AGIDs:', error);
    return false;
  }
}

export async function persistSavedQrs(records: SavedQrRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.savedQrs, sanitizeDatabaseRecords<SavedQrRecord>(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist saved QR records:', error);
    return false;
  }
}

export async function persistRegisteredAddresses(records: RegisteredAddressRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.registeredAddresses, sanitizeDatabaseRecords<RegisteredAddressRecord>(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist registered addresses:', error);
    return false;
  }
}

export async function persistAoids(records: AoidDatabaseRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.aoids, normalizeAoidRecords(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist AOIDs:', error);
    return false;
  }
}

export async function persistSyncQueue(records: SyncQueueRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.syncQueue, sanitizeDatabaseRecords<SyncQueueRecord>(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist sync queue:', error);
    return false;
  }
}

export async function persistDeliveryPosShipments(records: DeliveryPosShipmentRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.posShipments, normalizePosShipmentRecords(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist POS shipments:', error);
    return false;
  }
}

export async function persistDeliveryPosReceipts(records: DeliveryPosReceiptRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.posReceipts, normalizePosReceiptRecords(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist POS receipts:', error);
    return false;
  }
}

export async function persistDeliveryPosAuditCases(records: DeliveryPosAuditRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.posAuditCases, normalizePosAuditRecords(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist POS audit cases:', error);
    return false;
  }
}

export async function persistDeliveryPosHandoffs(records: DeliveryPosHandoffRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.posHandoffs, normalizePosHandoffRecords(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist POS handoffs:', error);
    return false;
  }
}

export async function persistDeliveryPosDeviceDiagnostics(records: DeliveryPosDeviceDiagnosticRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.posDeviceDiagnostics, normalizePosDeviceDiagnosticRecords(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist POS device diagnostics:', error);
    return false;
  }
}

export async function persistDeliveryPosCrossBorderDeclarations(records: DeliveryPosCrossBorderDeclarationRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.posCrossBorderDeclarations, normalizePosCrossBorderDeclarationRecords(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist POS cross-border declarations:', error);
    return false;
  }
}

export async function persistDeliveryPosOfflineUsageLedger(records: DeliveryPosOfflineUsageRecord[]) {
  if (!isClientDatabaseSupported()) return false;
  try {
    await replaceTable(appDatabase.posOfflineUsageLedger, normalizePosOfflineUsageRecords(records));
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to persist POS offline usage ledger:', error);
    return false;
  }
}

export async function clearAppDatabasePrivateData() {
  if (!isClientDatabaseSupported()) return false;
  try {
    await Promise.all([
      appDatabase.savedAgids.clear(),
      appDatabase.savedQrs.clear(),
      appDatabase.registeredAddresses.clear(),
      appDatabase.aoids.clear(),
      appDatabase.syncQueue.clear(),
      appDatabase.posShipments.clear(),
      appDatabase.posReceipts.clear(),
      appDatabase.posAuditCases.clear(),
      appDatabase.posHandoffs.clear(),
      appDatabase.posDeviceDiagnostics.clear(),
      appDatabase.posCrossBorderDeclarations.clear(),
      appDatabase.posOfflineUsageLedger.clear(),
    ]);
    return true;
  } catch (error) {
    console.warn('[AGID DB] Failed to clear private data:', error);
    return false;
  }
}
