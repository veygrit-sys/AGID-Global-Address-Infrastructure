import { addressConnectPrivateMaterialPaths } from './addressConnect';
import {
  cleanBoolean,
  cleanNonNegativeInteger,
  cleanText,
  cleanTextArray,
  hashStable,
  stableId,
  toIsoTimestamp,
} from './redactedWorkflowCore';

export const OFFLINE_SYNC_CENTER_VERSION = 'agid-offline-sync-center-v1';

export const OFFLINE_SYNC_SURFACES = ['pos', 'field', 'locker'] as const;
export const OFFLINE_SYNC_STATUSES = ['synced', 'pending-sync', 'conflict'] as const;

export type OfflineSyncSurface = (typeof OFFLINE_SYNC_SURFACES)[number];
export type OfflineSyncStatus = (typeof OFFLINE_SYNC_STATUSES)[number];
export type OfflineSyncSurfaceFilter = OfflineSyncSurface | 'all';

export type OfflineSyncItemInput = {
  itemId?: unknown;
  surface?: unknown;
  title?: unknown;
  status?: unknown;
  deviceRef?: unknown;
  queueRef?: unknown;
  syncRef?: unknown;
  updatedAt?: unknown;
  lastSyncedAt?: unknown;
  pendingCount?: unknown;
  conflictCount?: unknown;
  usedNullifierCount?: unknown;
  usedNullifierTails?: unknown;
  evidenceRefs?: unknown;
  actionRefs?: unknown;
  sourcePayload?: unknown;
  containsPersonalData?: unknown;
  containsPreciseLocation?: unknown;
};

export type OfflineSyncItem = {
  schemaVersion: typeof OFFLINE_SYNC_CENTER_VERSION;
  itemId: string;
  surface: OfflineSyncSurface;
  title: string;
  status: OfflineSyncStatus;
  deviceRef: string;
  queueRef: string;
  syncRef: string;
  updatedAt: string;
  lastSyncedAt?: string;
  pendingCount: number;
  conflictCount: number;
  usedNullifierCount: number;
  usedNullifierTails: string[];
  evidenceRefs: string[];
  actionRefs: string[];
  itemRoot: string;
  accepted: boolean;
  errors: string[];
  warnings: string[];
  privacy: {
    personalDataAccepted: false;
    preciseLocationAccepted: false;
    subjectSecretAccepted: false;
    storesNullifierTailOnly: true;
    refsAndCountsOnly: true;
    forbiddenPaths: string[];
  };
};

export type OfflineSyncCenterInput = {
  items?: readonly OfflineSyncItemInput[];
  query?: unknown;
  surfaceFilter?: unknown;
  selectedItemId?: unknown;
  generatedAt?: unknown;
};

export type OfflineSyncCenter = {
  schemaVersion: typeof OFFLINE_SYNC_CENTER_VERSION;
  generatedAt: string;
  items: OfflineSyncItem[];
  filteredItems: OfflineSyncItem[];
  selectedItem: OfflineSyncItem | null;
  surfaceFilter: OfflineSyncSurfaceFilter;
  query: string;
  totals: {
    total: number;
    synced: number;
    pendingSync: number;
    conflicts: number;
    usedNullifiers: number;
    pos: number;
    field: number;
    locker: number;
  };
  safeExport: {
    schemaVersion: typeof OFFLINE_SYNC_CENTER_VERSION;
    exportId: string;
    generatedAt: string;
    itemRoots: string[];
    selectedItemRoot: string | null;
    totals: OfflineSyncCenter['totals'];
  };
  payloadSafety: {
    safe: boolean;
    forbiddenPaths: string[];
  };
};

function cleanEnum<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  const text = cleanText(value).toLowerCase();
  return allowed.includes(text as T[number]) ? text as T[number] : fallback;
}

function cleanRefs(value: unknown, limit = 16) {
  return Array.from(new Set(cleanTextArray(value).map(ref => ref.slice(0, 120)))).slice(0, limit);
}

function cleanNullifierTail(value: unknown) {
  return cleanText(value).toUpperCase().replace(/[^A-Z0-9_-]+/g, '').slice(-16);
}

function cleanNullifierTails(value: unknown) {
  if (!Array.isArray(value)) {
    const tail = cleanNullifierTail(value);
    return tail ? [tail] : [];
  }
  return Array.from(new Set(value.map(cleanNullifierTail).filter(Boolean))).slice(0, 20);
}

function privateMaterialErrors(input: unknown) {
  return addressConnectPrivateMaterialPaths(input)
    .map(path => `private-material-not-accepted:${path}`);
}

function statusFromCounts(input: {
  errors: string[];
  conflictCount: number;
  pendingCount: number;
}) {
  if (input.errors.length > 0 || input.conflictCount > 0) return 'conflict';
  if (input.pendingCount > 0) return 'pending-sync';
  return 'synced';
}

function buildItemRoot(item: Omit<OfflineSyncItem, 'itemRoot'>) {
  return hashStable({
    itemId: item.itemId,
    surface: item.surface,
    status: item.status,
    deviceRef: item.deviceRef,
    queueRef: item.queueRef,
    syncRef: item.syncRef,
    pendingCount: item.pendingCount,
    conflictCount: item.conflictCount,
    usedNullifierCount: item.usedNullifierCount,
    usedNullifierTails: item.usedNullifierTails,
    evidenceRefs: item.evidenceRefs,
    actionRefs: item.actionRefs,
  });
}

export function buildOfflineSyncItem(input: OfflineSyncItemInput = {}): OfflineSyncItem {
  const errors = privateMaterialErrors(input);
  const warnings: string[] = [];
  if (cleanBoolean(input.containsPersonalData, false)) errors.push('personal-data-not-accepted');
  if (cleanBoolean(input.containsPreciseLocation, false)) errors.push('precise-location-not-accepted');

  const surface = cleanEnum(input.surface, OFFLINE_SYNC_SURFACES, 'pos');
  const pendingCount = cleanNonNegativeInteger(input.pendingCount, 0);
  const conflictCount = cleanNonNegativeInteger(input.conflictCount, 0);
  const usedNullifierTails = cleanNullifierTails(input.usedNullifierTails);
  const usedNullifierCount = Math.max(
    cleanNonNegativeInteger(input.usedNullifierCount, usedNullifierTails.length),
    usedNullifierTails.length,
  );
  const fallbackStatus = statusFromCounts({ errors, conflictCount, pendingCount });
  const status = cleanEnum(input.status, OFFLINE_SYNC_STATUSES, fallbackStatus);
  const deviceRef = cleanText(input.deviceRef, `${surface}-device-local`, 96);
  const queueRef = cleanText(input.queueRef, `${surface}-offline-queue`, 96);
  const syncRef = cleanText(input.syncRef, `${surface}-sync-ref`, 96);
  const evidenceRefs = cleanRefs(input.evidenceRefs);
  const actionRefs = cleanRefs(input.actionRefs);
  const updatedAt = toIsoTimestamp(input.updatedAt);
  const lastSyncedAt = input.lastSyncedAt ? toIsoTimestamp(input.lastSyncedAt) : undefined;
  if (pendingCount === 0 && status === 'pending-sync') warnings.push('pending-status-without-pending-count');
  if (conflictCount === 0 && status === 'conflict' && errors.length === 0) warnings.push('conflict-status-without-conflict-count');
  if (usedNullifierCount === 0) warnings.push('no-used-nullifier-state');

  const itemId = cleanText(input.itemId, '', 64) || stableId('OSC', {
    surface,
    deviceRef,
    queueRef,
    syncRef,
    updatedAt,
  });
  const accepted = errors.length === 0;
  const itemWithoutRoot: Omit<OfflineSyncItem, 'itemRoot'> = {
    schemaVersion: OFFLINE_SYNC_CENTER_VERSION,
    itemId,
    surface,
    title: cleanText(input.title, `${surface.toUpperCase()} offline sync`, 96),
    status,
    deviceRef,
    queueRef,
    syncRef,
    updatedAt,
    ...(lastSyncedAt ? { lastSyncedAt } : {}),
    pendingCount,
    conflictCount,
    usedNullifierCount,
    usedNullifierTails,
    evidenceRefs,
    actionRefs,
    accepted,
    errors,
    warnings,
    privacy: {
      personalDataAccepted: false,
      preciseLocationAccepted: false,
      subjectSecretAccepted: false,
      storesNullifierTailOnly: true,
      refsAndCountsOnly: true,
      forbiddenPaths: addressConnectPrivateMaterialPaths(input),
    },
  };

  return {
    ...itemWithoutRoot,
    itemRoot: buildItemRoot(itemWithoutRoot),
  };
}

function cleanSurfaceFilter(value: unknown): OfflineSyncSurfaceFilter {
  const text = cleanText(value).toLowerCase();
  if (text === 'all') return 'all';
  return OFFLINE_SYNC_SURFACES.includes(text as OfflineSyncSurface)
    ? text as OfflineSyncSurface
    : 'all';
}

function matchesQuery(item: OfflineSyncItem, query: string) {
  if (!query) return true;
  const haystack = [
    item.itemId,
    item.surface,
    item.title,
    item.status,
    item.deviceRef,
    item.queueRef,
    item.syncRef,
    ...item.usedNullifierTails,
    ...item.evidenceRefs,
    ...item.actionRefs,
  ].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function countSurface(items: OfflineSyncItem[], surface: OfflineSyncSurface) {
  return items.filter(item => item.surface === surface).length;
}

export function validateOfflineSyncCenterPayloadIsSafe(value: unknown) {
  const forbiddenPaths = addressConnectPrivateMaterialPaths(value);
  return {
    safe: forbiddenPaths.length === 0,
    forbiddenPaths,
  };
}

export function buildOfflineSyncCenter(input: OfflineSyncCenterInput = {}): OfflineSyncCenter {
  const generatedAt = toIsoTimestamp(input.generatedAt);
  const query = cleanText(input.query, '', 120);
  const surfaceFilter = cleanSurfaceFilter(input.surfaceFilter);
  const items = (input.items ?? []).map(item => buildOfflineSyncItem(item));
  const filteredItems = items.filter(item => (
    (surfaceFilter === 'all' || item.surface === surfaceFilter)
    && matchesQuery(item, query)
  ));
  const selectedItemId = cleanText(input.selectedItemId);
  const selectedItem = filteredItems.find(item => item.itemId === selectedItemId)
    ?? filteredItems[0]
    ?? items[0]
    ?? null;
  const totals = {
    total: items.length,
    synced: items.filter(item => item.status === 'synced').length,
    pendingSync: items.reduce((sum, item) => sum + item.pendingCount, 0),
    conflicts: items.reduce((sum, item) => sum + item.conflictCount + (item.accepted ? 0 : 1), 0),
    usedNullifiers: items.reduce((sum, item) => sum + item.usedNullifierCount, 0),
    pos: countSurface(items, 'pos'),
    field: countSurface(items, 'field'),
    locker: countSurface(items, 'locker'),
  };
  const safeExport = {
    schemaVersion: OFFLINE_SYNC_CENTER_VERSION as typeof OFFLINE_SYNC_CENTER_VERSION,
    exportId: stableId('OSE', {
      generatedAt,
      itemRoots: items.map(item => item.itemRoot),
      selectedItemRoot: selectedItem?.itemRoot ?? null,
      totals,
    }),
    generatedAt,
    itemRoots: items.map(item => item.itemRoot),
    selectedItemRoot: selectedItem?.itemRoot ?? null,
    totals,
  };

  return {
    schemaVersion: OFFLINE_SYNC_CENTER_VERSION,
    generatedAt,
    items,
    filteredItems,
    selectedItem,
    surfaceFilter,
    query,
    totals,
    safeExport,
    payloadSafety: validateOfflineSyncCenterPayloadIsSafe(safeExport),
  };
}

export function listOfflineSyncCenterCapabilities() {
  return {
    schemaVersion: OFFLINE_SYNC_CENTER_VERSION,
    surfaces: [...OFFLINE_SYNC_SURFACES],
    statuses: [...OFFLINE_SYNC_STATUSES],
    rejectsPrivateMaterial: true,
    displaysUsedNullifierState: 'tail-counts-only',
    safeExportFields: ['itemRoots', 'selectedItemRoot', 'totals'],
  };
}
