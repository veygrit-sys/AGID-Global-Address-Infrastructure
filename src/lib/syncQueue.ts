import type { SyncQueueAction,SyncQueueRecord } from './appDatabase';
import {
  buildAgidAoidAuditEvent,
  evaluateAgidAoidOperation,
  type AgidAoidLayer,
  type AgidAoidSurface,
} from './agidAoidGovernance';
import { buildAOIDSyncQueuePayload } from './aoid';
import { getHybridSyncEntityPolicy } from './hybridArchitecture';

export type SyncQueueInput = {
  entityType: SyncQueueRecord['entityType'];
  entityId: string;
  action: SyncQueueAction;
  payload?: unknown;
  now?: number;
  targetSurface?: AgidAoidSurface;
};

function cleanId(value: string) {
  return value.trim().replace(/\s+/g, '-');
}

function layerForEntity(entityType: SyncQueueRecord['entityType']): AgidAoidLayer {
  return entityType === 'aoid' ? 'AOID' : 'AGID';
}

function payloadRecord(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function publicHandleFromPayload(payload: unknown) {
  const record = payloadRecord(payload);
  return typeof record.publicHandle === 'string' ? record.publicHandle : undefined;
}

function agidFromPayload(payload: unknown) {
  const record = payloadRecord(payload);
  return typeof record.agid === 'string' ? record.agid : undefined;
}

export function buildSyncQueueRecord(input: SyncQueueInput): SyncQueueRecord {
  const now = input.now ?? Date.now();
  const entityId = cleanId(input.entityId);
  const payload = input.entityType === 'aoid'
    ? buildAOIDSyncQueuePayload(input.payload)
    : input.payload;
  const layer = layerForEntity(input.entityType);
  const surface = input.targetSurface ?? 'local-device';
  const decision = evaluateAgidAoidOperation({
    layer,
    operation: 'sync',
    surface,
    payload,
  });
  if (!decision.allowed) {
    throw new Error(`AGID/AOID sync policy blocked ${input.entityType} payload: ${decision.warnings.join(' ')}`);
  }
  const audit = buildAgidAoidAuditEvent({
    layer,
    operation: 'sync',
    surface,
    entityId,
    agid: agidFromPayload(payload),
    publicHandle: publicHandleFromPayload(payload),
    payload,
    now,
  });

  return {
    id: `${input.entityType}:${entityId}:${input.action}:${now}`,
    entityType: input.entityType,
    entityId,
    action: input.action,
    payload,
    status: 'pending',
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
    audit,
  };
}

export function getSyncBackoffMs(attemptCount: number) {
  const attempts = Math.max(0, attemptCount);
  return Math.min(5 * 60 * 1000, 1000 * 2 ** attempts);
}

export function markSyncQueueRecordFailed(
  record: SyncQueueRecord,
  error: string,
  now = Date.now(),
): SyncQueueRecord {
  const attemptCount = record.attemptCount + 1;
  return {
    ...record,
    status: 'failed',
    attemptCount,
    lastError: error,
    updatedAt: now,
    nextAttemptAt: now + getSyncBackoffMs(attemptCount),
  };
}

export function markSyncQueueRecordSending(record: SyncQueueRecord, now = Date.now()): SyncQueueRecord {
  return {
    ...record,
    status: 'sending',
    updatedAt: now,
  };
}

export function getFlushableSyncQueueRecords(
  records: SyncQueueRecord[],
  options: {
    online: boolean;
    now?: number;
    limit?: number;
  },
) {
  if (!options.online) return [];
  const now = options.now ?? Date.now();
  const limit = options.limit ?? 25;
  return records
    .filter(record => record.status !== 'sending')
    .filter(record => !record.nextAttemptAt || record.nextAttemptAt <= now)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, limit);
}

export function getSyncQueueHybridPolicy(entityType: SyncQueueRecord['entityType']) {
  return getHybridSyncEntityPolicy(entityType);
}
