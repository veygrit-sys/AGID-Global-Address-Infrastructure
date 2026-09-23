import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';

import {
  AGID_SECURE_POS_MODEL_VERSION,
  AGID_SECURE_POS_REGISTRY_FRESHNESS_SECONDS,
  verifyAgidSecurePosRegistry,
  type AgidSecurePosRegistryDecision,
  type AgidSecurePosRegistrySnapshot,
} from '../lib/agidSecurePos';

export const POS_AGID_SECURE_REGISTRY_ID = 'AGID-S-POS-SERVER-REGISTRY';
export const POS_AGID_SECURE_STORE_VERSION = 'agid-s-pos-registry-store-v1';

export type PosAgidSecureRegistryAction =
  | 'mark-used'
  | 'revoke-token'
  | 'revoke-key'
  | 'deferred-sync';

export type PosAgidSecureAuditEvent = {
  eventId: string;
  action: PosAgidSecureRegistryAction;
  createdAt: string;
  keyId?: string;
  jtiTail?: string;
  terminalId?: string;
  operatorId?: string;
  reason?: string;
  requestId?: string;
  outcome: 'accepted' | 'rejected' | 'conflict';
  errors: string[];
};

export type PosAgidSecureDeferredSyncItem = {
  action: 'mark-used' | 'revoke-token' | 'revoke-key';
  keyId?: string;
  jti?: string;
  terminalId?: string;
  operatorId?: string;
  reason?: string;
  createdAt?: string;
};

export type PosAgidSecureDeferredSyncResult = {
  accepted: number;
  rejected: number;
  conflicts: number;
  events: PosAgidSecureAuditEvent[];
  registry: PosAgidSecurePublicRegistryStatus;
};

export type PosAgidSecurePublicRegistryStatus = {
  modelVersion: typeof AGID_SECURE_POS_MODEL_VERSION;
  storeVersion: typeof POS_AGID_SECURE_STORE_VERSION;
  registryId: string;
  version: string;
  checkedAt: string;
  freshUntil: string;
  usedCount: number;
  revokedTokenCount: number;
  revokedKeyCount: number;
  auditCount: number;
  storageMode: 'file' | 'sqlite' | 'postgres' | 'redis';
  publicFieldsOnly: true;
  rawAddressStorage: false;
  decryptedAgidStorage: false;
  rawAgidSecureStorage: false;
  deferredSyncSupported: true;
  sourceIds: string[];
};

type PosAgidSecureStoredState = {
  storeVersion: typeof POS_AGID_SECURE_STORE_VERSION;
  registryId: string;
  sequence: number;
  updatedAt: string;
  usedJtis: string[];
  revokedJtis: string[];
  revokedKeyIds: string[];
  audit: PosAgidSecureAuditEvent[];
};

export type PosAgidSecureRegistryMutationInput = {
  keyId?: string;
  jti?: string;
  terminalId?: string;
  operatorId?: string;
  reason?: string;
  requestId?: string;
  now?: number;
};

export type PosAgidSecureRegistryMutationResult = {
  ok: boolean;
  decision?: AgidSecurePosRegistryDecision;
  event: PosAgidSecureAuditEvent;
  registry: PosAgidSecurePublicRegistryStatus;
};

export type PosAgidSecureRegistryStoreAdapter = {
  snapshot(nowMs?: number): Promise<AgidSecurePosRegistrySnapshot>;
  publicStatus(nowMs?: number): Promise<PosAgidSecurePublicRegistryStatus>;
  verify(input: PosAgidSecureRegistryMutationInput & { exp?: number }): Promise<AgidSecurePosRegistryDecision>;
  markUsed(input: PosAgidSecureRegistryMutationInput): Promise<PosAgidSecureRegistryMutationResult>;
  revokeToken(input: PosAgidSecureRegistryMutationInput): Promise<PosAgidSecureRegistryMutationResult>;
  revokeKey(input: PosAgidSecureRegistryMutationInput): Promise<PosAgidSecureRegistryMutationResult>;
  applyDeferredSync(input: {
    items: PosAgidSecureDeferredSyncItem[];
    terminalId?: string;
    operatorId?: string;
    requestId?: string;
    now?: number;
  }): Promise<PosAgidSecureDeferredSyncResult>;
  recentAudit(limit?: number): Promise<PosAgidSecureAuditEvent[]>;
};

const JTI_PATTERN = /^[0-9A-Z]{16,64}$/;
const KEY_ID_PATTERN = /^[A-Za-z0-9._:-]{1,48}$/;
const MAX_AUDIT_EVENTS = 500;

function nowIso(now = Date.now()) {
  return new Date(now).toISOString();
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanJti(value: unknown) {
  const cleaned = cleanText(value).toUpperCase();
  return JTI_PATTERN.test(cleaned) ? cleaned : '';
}

function cleanKeyId(value: unknown) {
  const cleaned = cleanText(value);
  return KEY_ID_PATTERN.test(cleaned) ? cleaned : '';
}

function cleanAuditText(value: unknown, maxLength = 96) {
  return cleanText(value)
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, maxLength);
}

function isDeferredSyncAction(value: unknown): value is PosAgidSecureDeferredSyncItem['action'] {
  return value === 'mark-used' || value === 'revoke-token' || value === 'revoke-key';
}

function jtiTail(jti: string) {
  return jti ? jti.slice(-8) : undefined;
}

function arrayFromSet(values: Set<string>) {
  return Array.from(values).sort();
}

function defaultRegistryPath() {
  return process.env.AGID_POS_REGISTRY_PATH
    || join(process.cwd(), '.agid-runtime', 'pos-agid-s-registry.json');
}

function hashState(state: Pick<PosAgidSecureStoredState, 'sequence' | 'usedJtis' | 'revokedJtis' | 'revokedKeyIds'>) {
  return createHash('sha256')
    .update(JSON.stringify({
      sequence: state.sequence,
      used: state.usedJtis,
      revoked: state.revokedJtis,
      keys: state.revokedKeyIds,
    }))
    .digest('hex')
    .slice(0, 16);
}

function readStoredArray(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map(item => cleanText(item)).filter(Boolean))).sort()
    : [];
}

function readAuditEvent(value: unknown): PosAgidSecureAuditEvent | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const event = value as Partial<PosAgidSecureAuditEvent>;
  const action = event.action;
  if (action !== 'mark-used' && action !== 'revoke-token' && action !== 'revoke-key' && action !== 'deferred-sync') {
    return null;
  }
  const outcome = event.outcome === 'accepted' || event.outcome === 'rejected' || event.outcome === 'conflict'
    ? event.outcome
    : 'rejected';
  return {
    eventId: cleanAuditText(event.eventId, 80) || randomUUID(),
    action,
    createdAt: cleanAuditText(event.createdAt, 40) || nowIso(),
    ...(cleanKeyId(event.keyId) ? { keyId: cleanKeyId(event.keyId) } : {}),
    ...(cleanAuditText(event.jtiTail, 12) ? { jtiTail: cleanAuditText(event.jtiTail, 12) } : {}),
    ...(cleanAuditText(event.terminalId, 64) ? { terminalId: cleanAuditText(event.terminalId, 64) } : {}),
    ...(cleanAuditText(event.operatorId, 64) ? { operatorId: cleanAuditText(event.operatorId, 64) } : {}),
    ...(cleanAuditText(event.reason) ? { reason: cleanAuditText(event.reason) } : {}),
    ...(cleanAuditText(event.requestId, 80) ? { requestId: cleanAuditText(event.requestId, 80) } : {}),
    outcome,
    errors: Array.isArray(event.errors) ? event.errors.map(item => cleanAuditText(item, 80)).filter(Boolean) : [],
  };
}

function initialState(registryId: string): PosAgidSecureStoredState {
  return {
    storeVersion: POS_AGID_SECURE_STORE_VERSION,
    registryId,
    sequence: 0,
    updatedAt: nowIso(),
    usedJtis: [],
    revokedJtis: [],
    revokedKeyIds: [],
    audit: [],
  };
}

function normalizeState(value: unknown, registryId: string): PosAgidSecureStoredState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return initialState(registryId);
  const state = value as Partial<PosAgidSecureStoredState>;
  const audit = Array.isArray(state.audit)
    ? state.audit.map(readAuditEvent).filter((event): event is PosAgidSecureAuditEvent => Boolean(event))
    : [];
  return {
    storeVersion: POS_AGID_SECURE_STORE_VERSION,
    registryId: cleanAuditText(state.registryId, 80) || registryId,
    sequence: Number.isInteger(state.sequence) && Number(state.sequence) >= 0 ? Number(state.sequence) : 0,
    updatedAt: cleanAuditText(state.updatedAt, 40) || nowIso(),
    usedJtis: readStoredArray(state.usedJtis).filter(item => JTI_PATTERN.test(item)),
    revokedJtis: readStoredArray(state.revokedJtis).filter(item => JTI_PATTERN.test(item)),
    revokedKeyIds: readStoredArray(state.revokedKeyIds).filter(item => KEY_ID_PATTERN.test(item)),
    audit: audit.slice(-MAX_AUDIT_EVENTS),
  };
}

export class PosAgidSecureRegistryStore {
  private state: PosAgidSecureStoredState | null = null;
  private readonly filePath: string;
  private readonly auditLogPath: string;
  private readonly registryId: string;

  constructor(input: {
    filePath?: string;
    auditLogPath?: string;
    registryId?: string;
  } = {}) {
    this.filePath = input.filePath || defaultRegistryPath();
    this.auditLogPath = input.auditLogPath || `${this.filePath}.audit.ndjson`;
    this.registryId = input.registryId || POS_AGID_SECURE_REGISTRY_ID;
  }

  async load() {
    if (this.state) return this.state;
    try {
      const raw = await readFile(this.filePath, 'utf8');
      this.state = normalizeState(JSON.parse(raw), this.registryId);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        this.state = initialState(this.registryId);
        return this.state;
      }
      throw error;
    }
    return this.state;
  }

  async snapshot(nowMs = Date.now()): Promise<AgidSecurePosRegistrySnapshot> {
    const state = await this.load();
    return {
      registryId: state.registryId,
      version: this.versionFor(state),
      checkedAt: new Date(nowMs).toISOString(),
      freshUntil: this.freshUntil(nowMs),
      usedJtis: state.usedJtis,
      revokedJtis: state.revokedJtis,
      revokedKeyIds: state.revokedKeyIds,
      sourceIds: ['agid-pos-agid-s-file-registry'],
    };
  }

  async publicStatus(nowMs = Date.now()): Promise<PosAgidSecurePublicRegistryStatus> {
    const state = await this.load();
    return {
      modelVersion: AGID_SECURE_POS_MODEL_VERSION,
      storeVersion: POS_AGID_SECURE_STORE_VERSION,
      registryId: state.registryId,
      version: this.versionFor(state),
      checkedAt: new Date(nowMs).toISOString(),
      freshUntil: this.freshUntil(nowMs),
      usedCount: state.usedJtis.length,
      revokedTokenCount: state.revokedJtis.length,
      revokedKeyCount: state.revokedKeyIds.length,
      auditCount: state.audit.length,
      storageMode: 'file',
      publicFieldsOnly: true,
      rawAddressStorage: false,
      decryptedAgidStorage: false,
      rawAgidSecureStorage: false,
      deferredSyncSupported: true,
      sourceIds: ['agid-pos-agid-s-file-registry'],
    };
  }

  async verify(input: PosAgidSecureRegistryMutationInput & { exp?: number }) {
    const nowMs = input.now ?? Date.now();
    return verifyAgidSecurePosRegistry({
      registry: await this.snapshot(nowMs),
      keyId: cleanKeyId(input.keyId),
      jti: cleanJti(input.jti),
      exp: input.exp,
      now: nowMs,
    });
  }

  async markUsed(input: PosAgidSecureRegistryMutationInput): Promise<PosAgidSecureRegistryMutationResult> {
    return this.mutate('mark-used', input, async (state, nowMs) => {
      const keyId = cleanKeyId(input.keyId);
      const jti = cleanJti(input.jti);
      const errors: string[] = [];
      if (!keyId) errors.push('key-id-invalid');
      if (!jti) errors.push('jti-invalid');

      const decision = verifyAgidSecurePosRegistry({
        registry: this.snapshotFromState(state, nowMs),
        keyId,
        jti,
        now: nowMs,
      });
      errors.push(...decision.errors);

      if (errors.length === 0) {
        state.usedJtis = arrayFromSet(new Set([...state.usedJtis, jti]));
      }
      return {
        decision,
        outcome: errors.length === 0 ? 'accepted' as const : decision.errors.includes('token-already-used') ? 'conflict' as const : 'rejected' as const,
        errors,
      };
    });
  }

  async revokeToken(input: PosAgidSecureRegistryMutationInput): Promise<PosAgidSecureRegistryMutationResult> {
    return this.mutate('revoke-token', input, async (state) => {
      const jti = cleanJti(input.jti);
      const errors = jti ? [] : ['jti-invalid'];
      if (errors.length === 0) {
        state.revokedJtis = arrayFromSet(new Set([...state.revokedJtis, jti]));
      }
      return {
        outcome: errors.length === 0 ? 'accepted' as const : 'rejected' as const,
        errors,
      };
    });
  }

  async revokeKey(input: PosAgidSecureRegistryMutationInput): Promise<PosAgidSecureRegistryMutationResult> {
    return this.mutate('revoke-key', input, async (state) => {
      const keyId = cleanKeyId(input.keyId);
      const errors = keyId ? [] : ['key-id-invalid'];
      if (errors.length === 0) {
        state.revokedKeyIds = arrayFromSet(new Set([...state.revokedKeyIds, keyId]));
      }
      return {
        outcome: errors.length === 0 ? 'accepted' as const : 'rejected' as const,
        errors,
      };
    });
  }

  async applyDeferredSync(input: {
    items: PosAgidSecureDeferredSyncItem[];
    terminalId?: string;
    operatorId?: string;
    requestId?: string;
    now?: number;
  }): Promise<PosAgidSecureDeferredSyncResult> {
    const events: PosAgidSecureAuditEvent[] = [];
    let accepted = 0;
    let rejected = 0;
    let conflicts = 0;

    for (const item of input.items.slice(0, 100)) {
      if (!item || typeof item !== 'object' || !isDeferredSyncAction(item.action)) {
        const event = this.auditEvent('deferred-sync', input, 'rejected', ['offline-sync-action-invalid'], input.now ?? Date.now());
        events.push(event);
        rejected += 1;
        continue;
      }
      const base = {
        keyId: item.keyId,
        jti: item.jti,
        terminalId: item.terminalId || input.terminalId,
        operatorId: item.operatorId || input.operatorId,
        reason: item.reason || 'deferred-sync',
        requestId: input.requestId,
        now: item.createdAt ? Date.parse(item.createdAt) : input.now,
      };
      const result = item.action === 'revoke-key'
        ? await this.revokeKey(base)
        : item.action === 'revoke-token'
          ? await this.revokeToken(base)
          : await this.markUsed(base);
      events.push(result.event);
      if (result.event.outcome === 'accepted') accepted += 1;
      else if (result.event.outcome === 'conflict') conflicts += 1;
      else rejected += 1;
    }

    return {
      accepted,
      rejected,
      conflicts,
      events,
      registry: await this.publicStatus(input.now),
    };
  }

  async recentAudit(limit = 25) {
    const state = await this.load();
    return state.audit.slice(-Math.max(1, Math.min(limit, 100))).reverse();
  }

  private async mutate(
    action: PosAgidSecureRegistryAction,
    input: PosAgidSecureRegistryMutationInput,
    apply: (
      state: PosAgidSecureStoredState,
      nowMs: number,
    ) => Promise<{ decision?: AgidSecurePosRegistryDecision; outcome: PosAgidSecureAuditEvent['outcome']; errors: string[] }>
      | { decision?: AgidSecurePosRegistryDecision; outcome: PosAgidSecureAuditEvent['outcome']; errors: string[] },
  ): Promise<PosAgidSecureRegistryMutationResult> {
    const state = await this.load();
    const nowMs = input.now ?? Date.now();
    const result = await apply(state, nowMs);
    const event = this.auditEvent(action, input, result.outcome, result.errors, nowMs);
    state.audit = [...state.audit, event].slice(-MAX_AUDIT_EVENTS);

    if (result.outcome === 'accepted') {
      state.sequence += 1;
    }
    state.updatedAt = nowIso(nowMs);
    await this.persist(state, event);

    return {
      ok: result.outcome === 'accepted',
      decision: result.decision,
      event,
      registry: await this.publicStatus(nowMs),
    };
  }

  private auditEvent(
    action: PosAgidSecureRegistryAction,
    input: PosAgidSecureRegistryMutationInput,
    outcome: PosAgidSecureAuditEvent['outcome'],
    errors: string[],
    nowMs: number,
  ): PosAgidSecureAuditEvent {
    const keyId = cleanKeyId(input.keyId);
    const jti = cleanJti(input.jti);
    return {
      eventId: randomUUID(),
      action,
      createdAt: nowIso(nowMs),
      ...(keyId ? { keyId } : {}),
      ...(jtiTail(jti) ? { jtiTail: jtiTail(jti) } : {}),
      ...(cleanAuditText(input.terminalId, 64) ? { terminalId: cleanAuditText(input.terminalId, 64) } : {}),
      ...(cleanAuditText(input.operatorId, 64) ? { operatorId: cleanAuditText(input.operatorId, 64) } : {}),
      ...(cleanAuditText(input.reason) ? { reason: cleanAuditText(input.reason) } : {}),
      ...(cleanAuditText(input.requestId, 80) ? { requestId: cleanAuditText(input.requestId, 80) } : {}),
      outcome,
      errors: Array.from(new Set(errors)),
    };
  }

  private snapshotFromState(state: PosAgidSecureStoredState, nowMs: number): AgidSecurePosRegistrySnapshot {
    return {
      registryId: state.registryId,
      version: this.versionFor(state),
      checkedAt: new Date(nowMs).toISOString(),
      freshUntil: this.freshUntil(nowMs),
      usedJtis: state.usedJtis,
      revokedJtis: state.revokedJtis,
      revokedKeyIds: state.revokedKeyIds,
      sourceIds: ['agid-pos-agid-s-file-registry'],
    };
  }

  private versionFor(state: PosAgidSecureStoredState) {
    return `${AGID_SECURE_POS_MODEL_VERSION}.${state.sequence}.${hashState(state)}`;
  }

  private freshUntil(nowMs: number) {
    return new Date(nowMs + AGID_SECURE_POS_REGISTRY_FRESHNESS_SECONDS * 1000).toISOString();
  }

  private async persist(state: PosAgidSecureStoredState, event: PosAgidSecureAuditEvent) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    await rename(tempPath, this.filePath);
    await this.appendAudit(event);
  }

  private async appendAudit(event: PosAgidSecureAuditEvent) {
    await mkdir(dirname(this.auditLogPath), { recursive: true });
    await appendFile(this.auditLogPath, `${JSON.stringify(event)}\n`, 'utf8');
  }
}

export function createPosAgidSecureRegistryStore(input: {
  filePath?: string;
  auditLogPath?: string;
  registryId?: string;
} = {}) {
  return new PosAgidSecureRegistryStore(input);
}
