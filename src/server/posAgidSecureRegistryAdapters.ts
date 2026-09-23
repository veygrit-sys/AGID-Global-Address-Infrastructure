import { createHash, randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  AGID_SECURE_POS_MODEL_VERSION,
  AGID_SECURE_POS_REGISTRY_FRESHNESS_SECONDS,
  verifyAgidSecurePosRegistry,
  type AgidSecurePosRegistryDecision,
  type AgidSecurePosRegistrySnapshot,
} from '../lib/agidSecurePos';
import {
  POS_AGID_SECURE_REGISTRY_ID,
  POS_AGID_SECURE_STORE_VERSION,
  createPosAgidSecureRegistryStore,
  type PosAgidSecureAuditEvent,
  type PosAgidSecureDeferredSyncItem,
  type PosAgidSecureDeferredSyncResult,
  type PosAgidSecurePublicRegistryStatus,
  type PosAgidSecureRegistryAction,
  type PosAgidSecureRegistryMutationInput,
  type PosAgidSecureRegistryMutationResult,
  type PosAgidSecureRegistryStoreAdapter,
} from './posAgidSecureRegistryStore';
import { assertDatabaseProductionReady } from './databaseProductionGuard';

type DurableStorageMode = 'sqlite' | 'postgres' | 'redis';

type RegistrySets = {
  usedJtis: string[];
  revokedJtis: string[];
  revokedKeyIds: string[];
  auditCount: number;
};

type InsertUsedInput = {
  keyId: string;
  jti: string;
  terminalId?: string;
  operatorId?: string;
  requestId?: string;
  nowIso: string;
};

type RevokeJtiInput = Omit<InsertUsedInput, 'keyId'> & { reason?: string };
type RevokeKeyInput = Omit<InsertUsedInput, 'jti'> & { reason?: string };

type DurableStoreInput = {
  registryId?: string;
};

export type ConfiguredPosAgidSecureRegistryStoreInput = DurableStoreInput & {
  storageMode?: 'file' | DurableStorageMode;
  filePath?: string;
  auditLogPath?: string;
  sqlitePath?: string;
  postgresUrl?: string;
  redisUrl?: string;
  redisKeyPrefix?: string;
};

const JTI_PATTERN = /^[0-9A-Z]{16,64}$/;
const KEY_ID_PATTERN = /^[A-Za-z0-9._:-]{1,48}$/;
const MAX_AUDIT_EVENTS = 500;

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

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

function arrayFromSet(values: Iterable<string>) {
  return Array.from(new Set(Array.from(values).map(item => cleanText(item)).filter(Boolean))).sort();
}

function defaultSqlitePath() {
  return process.env.AGID_POS_SQLITE_PATH
    || join(process.cwd(), '.agid-runtime', 'pos-agid-s-registry.sqlite');
}

function hashSets(state: Pick<RegistrySets, 'usedJtis' | 'revokedJtis' | 'revokedKeyIds'>) {
  return createHash('sha256')
    .update(JSON.stringify({
      used: state.usedJtis,
      revoked: state.revokedJtis,
      keys: state.revokedKeyIds,
    }))
    .digest('hex')
    .slice(0, 16);
}

function withDecisionError(
  decision: AgidSecurePosRegistryDecision | undefined,
  error: string,
  nowMs: number,
  registryId: string,
): AgidSecurePosRegistryDecision {
  return {
    valid: false,
    checkedAt: decision?.checkedAt ?? nowIso(nowMs),
    registryId: decision?.registryId ?? registryId,
    errors: Array.from(new Set([...(decision?.errors ?? []), error])),
    warnings: decision?.warnings ?? [],
  };
}

abstract class DurablePosAgidSecureRegistryStore implements PosAgidSecureRegistryStoreAdapter {
  protected readonly registryId: string;

  protected constructor(
    protected readonly storageMode: DurableStorageMode,
    input: DurableStoreInput = {},
  ) {
    this.registryId = input.registryId || POS_AGID_SECURE_REGISTRY_ID;
  }

  async snapshot(nowMs = Date.now()): Promise<AgidSecurePosRegistrySnapshot> {
    const sets = await this.readRegistrySets();
    return {
      registryId: this.registryId,
      version: this.versionFor(sets),
      checkedAt: nowIso(nowMs),
      freshUntil: this.freshUntil(nowMs),
      usedJtis: sets.usedJtis,
      revokedJtis: sets.revokedJtis,
      revokedKeyIds: sets.revokedKeyIds,
      sourceIds: [this.sourceId],
    };
  }

  async publicStatus(nowMs = Date.now()): Promise<PosAgidSecurePublicRegistryStatus> {
    const sets = await this.readRegistrySets();
    return {
      modelVersion: AGID_SECURE_POS_MODEL_VERSION,
      storeVersion: POS_AGID_SECURE_STORE_VERSION,
      registryId: this.registryId,
      version: this.versionFor(sets),
      checkedAt: nowIso(nowMs),
      freshUntil: this.freshUntil(nowMs),
      usedCount: sets.usedJtis.length,
      revokedTokenCount: sets.revokedJtis.length,
      revokedKeyCount: sets.revokedKeyIds.length,
      auditCount: sets.auditCount,
      storageMode: this.storageMode,
      publicFieldsOnly: true,
      rawAddressStorage: false,
      decryptedAgidStorage: false,
      rawAgidSecureStorage: false,
      deferredSyncSupported: true,
      sourceIds: [this.sourceId],
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
    const nowMs = input.now ?? Date.now();
    const keyId = cleanKeyId(input.keyId);
    const jti = cleanJti(input.jti);
    const errors: string[] = [];
    if (!keyId) errors.push('key-id-invalid');
    if (!jti) errors.push('jti-invalid');

    let decision: AgidSecurePosRegistryDecision | undefined;
    if (keyId && jti) {
      decision = verifyAgidSecurePosRegistry({
        registry: await this.snapshot(nowMs),
        keyId,
        jti,
        now: nowMs,
      });
      errors.push(...decision.errors);
    }

    let outcome: PosAgidSecureAuditEvent['outcome'] = errors.length === 0 ? 'accepted' : 'rejected';
    if (errors.length === 0) {
      const inserted = await this.insertUsed({
        keyId,
        jti,
        terminalId: cleanAuditText(input.terminalId, 64) || undefined,
        operatorId: cleanAuditText(input.operatorId, 64) || undefined,
        requestId: cleanAuditText(input.requestId, 80) || undefined,
        nowIso: nowIso(nowMs),
      });
      if (!inserted) {
        errors.push('token-already-used');
        decision = withDecisionError(decision, 'token-already-used', nowMs, this.registryId);
        outcome = 'conflict';
      }
    } else if (errors.includes('token-already-used')) {
      outcome = 'conflict';
    }

    return this.finishMutation('mark-used', input, outcome, errors, nowMs, decision);
  }

  async revokeToken(input: PosAgidSecureRegistryMutationInput): Promise<PosAgidSecureRegistryMutationResult> {
    const nowMs = input.now ?? Date.now();
    const jti = cleanJti(input.jti);
    const errors = jti ? [] : ['jti-invalid'];
    if (errors.length === 0) {
      await this.insertRevokedJti({
        jti,
        terminalId: cleanAuditText(input.terminalId, 64) || undefined,
        operatorId: cleanAuditText(input.operatorId, 64) || undefined,
        requestId: cleanAuditText(input.requestId, 80) || undefined,
        reason: cleanAuditText(input.reason) || undefined,
        nowIso: nowIso(nowMs),
      });
    }

    return this.finishMutation('revoke-token', input, errors.length === 0 ? 'accepted' : 'rejected', errors, nowMs);
  }

  async revokeKey(input: PosAgidSecureRegistryMutationInput): Promise<PosAgidSecureRegistryMutationResult> {
    const nowMs = input.now ?? Date.now();
    const keyId = cleanKeyId(input.keyId);
    const errors = keyId ? [] : ['key-id-invalid'];
    if (errors.length === 0) {
      await this.insertRevokedKey({
        keyId,
        terminalId: cleanAuditText(input.terminalId, 64) || undefined,
        operatorId: cleanAuditText(input.operatorId, 64) || undefined,
        requestId: cleanAuditText(input.requestId, 80) || undefined,
        reason: cleanAuditText(input.reason) || undefined,
        nowIso: nowIso(nowMs),
      });
    }

    return this.finishMutation('revoke-key', input, errors.length === 0 ? 'accepted' : 'rejected', errors, nowMs);
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
        await this.appendAudit(event);
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

  abstract recentAudit(limit?: number): Promise<PosAgidSecureAuditEvent[]>;

  protected abstract get sourceId(): string;
  protected abstract readRegistrySets(): Promise<RegistrySets>;
  protected abstract insertUsed(input: InsertUsedInput): Promise<boolean>;
  protected abstract insertRevokedJti(input: RevokeJtiInput): Promise<void>;
  protected abstract insertRevokedKey(input: RevokeKeyInput): Promise<void>;
  protected abstract appendAudit(event: PosAgidSecureAuditEvent): Promise<void>;

  private async finishMutation(
    action: PosAgidSecureRegistryAction,
    input: PosAgidSecureRegistryMutationInput,
    outcome: PosAgidSecureAuditEvent['outcome'],
    errors: string[],
    nowMs: number,
    decision?: AgidSecurePosRegistryDecision,
  ): Promise<PosAgidSecureRegistryMutationResult> {
    const event = this.auditEvent(action, input, outcome, errors, nowMs);
    await this.appendAudit(event);
    return {
      ok: outcome === 'accepted',
      decision,
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

  private versionFor(sets: RegistrySets) {
    return `${AGID_SECURE_POS_MODEL_VERSION}.${sets.usedJtis.length + sets.revokedJtis.length + sets.revokedKeyIds.length}.${hashSets(sets)}`;
  }

  private freshUntil(nowMs: number) {
    return new Date(nowMs + AGID_SECURE_POS_REGISTRY_FRESHNESS_SECONDS * 1000).toISOString();
  }
}

export class SqlitePosAgidSecureRegistryStore extends DurablePosAgidSecureRegistryStore {
  private dbPromise: Promise<any> | null = null;

  constructor(private readonly databasePath = defaultSqlitePath(), input: DurableStoreInput = {}) {
    super('sqlite', input);
  }

  protected get sourceId() {
    return 'agid-pos-agid-s-sqlite-registry';
  }

  async recentAudit(limit = 25): Promise<PosAgidSecureAuditEvent[]> {
    const db = await this.db();
    return db.prepare('SELECT payload FROM agid_pos_audit ORDER BY rowid DESC LIMIT ?')
      .all(Math.max(1, Math.min(limit, 100)))
      .map((row: any) => this.parseAudit(row.payload))
      .filter(Boolean);
  }

  protected async readRegistrySets(): Promise<RegistrySets> {
    const db = await this.db();
    const readValues = (sql: string) => arrayFromSet(db.prepare(sql).all().map((row: any) => row.value));
    return {
      usedJtis: readValues('SELECT jti AS value FROM agid_pos_used_jtis ORDER BY jti'),
      revokedJtis: readValues('SELECT jti AS value FROM agid_pos_revoked_jtis ORDER BY jti'),
      revokedKeyIds: readValues('SELECT key_id AS value FROM agid_pos_revoked_keys ORDER BY key_id'),
      auditCount: Number(db.prepare('SELECT COUNT(*) AS value FROM agid_pos_audit').get().value ?? 0),
    };
  }

  protected async insertUsed(input: InsertUsedInput): Promise<boolean> {
    const db = await this.db();
    const result = db.prepare(`
      INSERT OR IGNORE INTO agid_pos_used_jtis
        (jti, key_id, terminal_id, operator_id, request_id, used_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(input.jti, input.keyId, input.terminalId ?? null, input.operatorId ?? null, input.requestId ?? null, input.nowIso);
    return Number(result.changes ?? 0) > 0;
  }

  protected async insertRevokedJti(input: RevokeJtiInput): Promise<void> {
    const db = await this.db();
    db.prepare(`
      INSERT OR IGNORE INTO agid_pos_revoked_jtis
        (jti, terminal_id, operator_id, request_id, reason, revoked_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(input.jti, input.terminalId ?? null, input.operatorId ?? null, input.requestId ?? null, input.reason ?? null, input.nowIso);
  }

  protected async insertRevokedKey(input: RevokeKeyInput): Promise<void> {
    const db = await this.db();
    db.prepare(`
      INSERT OR IGNORE INTO agid_pos_revoked_keys
        (key_id, terminal_id, operator_id, request_id, reason, revoked_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(input.keyId, input.terminalId ?? null, input.operatorId ?? null, input.requestId ?? null, input.reason ?? null, input.nowIso);
  }

  protected async appendAudit(event: PosAgidSecureAuditEvent): Promise<void> {
    const db = await this.db();
    db.prepare('INSERT INTO agid_pos_audit (event_id, created_at, payload) VALUES (?, ?, ?)')
      .run(event.eventId, event.createdAt, JSON.stringify(event));
    db.prepare(`
      DELETE FROM agid_pos_audit
      WHERE rowid NOT IN (SELECT rowid FROM agid_pos_audit ORDER BY rowid DESC LIMIT ?)
    `).run(MAX_AUDIT_EVENTS);
  }

  private async db() {
    if (!this.dbPromise) {
      this.dbPromise = this.openDb();
    }
    return this.dbPromise;
  }

  async close() {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    db.close();
    this.dbPromise = null;
  }

  private async openDb() {
    await mkdir(dirname(this.databasePath), { recursive: true });
    const { DatabaseSync } = await dynamicImport('node:sqlite');
    const db = new DatabaseSync(this.databasePath);
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS agid_pos_used_jtis (
        jti TEXT PRIMARY KEY,
        key_id TEXT NOT NULL,
        terminal_id TEXT,
        operator_id TEXT,
        request_id TEXT,
        used_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS agid_pos_revoked_jtis (
        jti TEXT PRIMARY KEY,
        terminal_id TEXT,
        operator_id TEXT,
        request_id TEXT,
        reason TEXT,
        revoked_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS agid_pos_revoked_keys (
        key_id TEXT PRIMARY KEY,
        terminal_id TEXT,
        operator_id TEXT,
        request_id TEXT,
        reason TEXT,
        revoked_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS agid_pos_audit (
        event_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS agid_pos_audit_created_at_idx ON agid_pos_audit(created_at);
    `);
    return db;
  }

  private parseAudit(payload: string): PosAgidSecureAuditEvent | null {
    try {
      return JSON.parse(payload) as PosAgidSecureAuditEvent;
    } catch {
      return null;
    }
  }
}

export class PostgresPosAgidSecureRegistryStore extends DurablePosAgidSecureRegistryStore {
  private poolPromise: Promise<any> | null = null;

  constructor(private readonly connectionString: string, input: DurableStoreInput = {}) {
    super('postgres', input);
  }

  protected get sourceId() {
    return 'agid-pos-agid-s-postgres-registry';
  }

  async recentAudit(limit = 25): Promise<PosAgidSecureAuditEvent[]> {
    const pool = await this.pool();
    const result = await pool.query(
      'SELECT payload FROM agid_pos_audit ORDER BY id DESC LIMIT $1',
      [Math.max(1, Math.min(limit, 100))],
    );
    return result.rows.map((row: any) => row.payload).filter(Boolean);
  }

  protected async readRegistrySets(): Promise<RegistrySets> {
    const pool = await this.pool();
    const [used, revoked, keys, audit] = await Promise.all([
      pool.query('SELECT jti AS value FROM agid_pos_used_jtis ORDER BY jti'),
      pool.query('SELECT jti AS value FROM agid_pos_revoked_jtis ORDER BY jti'),
      pool.query('SELECT key_id AS value FROM agid_pos_revoked_keys ORDER BY key_id'),
      pool.query('SELECT COUNT(*)::int AS value FROM agid_pos_audit'),
    ]);
    return {
      usedJtis: arrayFromSet(used.rows.map((row: any) => row.value)),
      revokedJtis: arrayFromSet(revoked.rows.map((row: any) => row.value)),
      revokedKeyIds: arrayFromSet(keys.rows.map((row: any) => row.value)),
      auditCount: Number(audit.rows[0]?.value ?? 0),
    };
  }

  protected async insertUsed(input: InsertUsedInput): Promise<boolean> {
    const pool = await this.pool();
    const result = await pool.query(`
      INSERT INTO agid_pos_used_jtis
        (jti, key_id, terminal_id, operator_id, request_id, used_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (jti) DO NOTHING
      RETURNING jti
    `, [input.jti, input.keyId, input.terminalId ?? null, input.operatorId ?? null, input.requestId ?? null, input.nowIso]);
    return result.rowCount > 0;
  }

  protected async insertRevokedJti(input: RevokeJtiInput): Promise<void> {
    const pool = await this.pool();
    await pool.query(`
      INSERT INTO agid_pos_revoked_jtis
        (jti, terminal_id, operator_id, request_id, reason, revoked_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (jti) DO NOTHING
    `, [input.jti, input.terminalId ?? null, input.operatorId ?? null, input.requestId ?? null, input.reason ?? null, input.nowIso]);
  }

  protected async insertRevokedKey(input: RevokeKeyInput): Promise<void> {
    const pool = await this.pool();
    await pool.query(`
      INSERT INTO agid_pos_revoked_keys
        (key_id, terminal_id, operator_id, request_id, reason, revoked_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (key_id) DO NOTHING
    `, [input.keyId, input.terminalId ?? null, input.operatorId ?? null, input.requestId ?? null, input.reason ?? null, input.nowIso]);
  }

  protected async appendAudit(event: PosAgidSecureAuditEvent): Promise<void> {
    const pool = await this.pool();
    await pool.query('INSERT INTO agid_pos_audit (event_id, created_at, payload) VALUES ($1, $2, $3) ON CONFLICT (event_id) DO NOTHING', [
      event.eventId,
      event.createdAt,
      event,
    ]);
  }

  private async pool() {
    if (!this.poolPromise) this.poolPromise = this.openPool();
    return this.poolPromise;
  }

  async close() {
    if (!this.poolPromise) return;
    const pool = await this.poolPromise;
    await pool.end();
    this.poolPromise = null;
  }

  private async openPool() {
    if (!this.connectionString) {
      throw new Error('AGID_POS_POSTGRES_URL or DATABASE_URL is required for postgres POS registry storage.');
    }
    const { Pool } = await dynamicImport('pg');
    const pool = new Pool({ connectionString: this.connectionString });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agid_pos_used_jtis (
        jti TEXT PRIMARY KEY,
        key_id TEXT NOT NULL,
        terminal_id TEXT,
        operator_id TEXT,
        request_id TEXT,
        used_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS agid_pos_revoked_jtis (
        jti TEXT PRIMARY KEY,
        terminal_id TEXT,
        operator_id TEXT,
        request_id TEXT,
        reason TEXT,
        revoked_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS agid_pos_revoked_keys (
        key_id TEXT PRIMARY KEY,
        terminal_id TEXT,
        operator_id TEXT,
        request_id TEXT,
        reason TEXT,
        revoked_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS agid_pos_audit (
        id BIGSERIAL PRIMARY KEY,
        event_id TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        payload JSONB NOT NULL
      );
      CREATE INDEX IF NOT EXISTS agid_pos_audit_created_at_idx ON agid_pos_audit(created_at);
    `);
    return pool;
  }
}

export class RedisPosAgidSecureRegistryStore extends DurablePosAgidSecureRegistryStore {
  private clientPromise: Promise<any> | null = null;
  private readonly keyPrefix: string;

  constructor(private readonly redisUrl: string, input: DurableStoreInput & { keyPrefix?: string } = {}) {
    super('redis', input);
    this.keyPrefix = input.keyPrefix || process.env.AGID_POS_REDIS_KEY_PREFIX || 'agid:pos:agid-s';
  }

  protected get sourceId() {
    return 'agid-pos-agid-s-redis-registry';
  }

  async recentAudit(limit = 25): Promise<PosAgidSecureAuditEvent[]> {
    const client = await this.client();
    const values = await client.lRange(this.key('audit'), 0, Math.max(0, Math.min(limit, 100) - 1));
    return values.map((value: string) => {
      try {
        return JSON.parse(value) as PosAgidSecureAuditEvent;
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  protected async readRegistrySets(): Promise<RegistrySets> {
    const client = await this.client();
    const [usedJtis, revokedJtis, revokedKeyIds, auditCount] = await Promise.all([
      client.sMembers(this.key('used')),
      client.sMembers(this.key('revoked-jtis')),
      client.sMembers(this.key('revoked-keys')),
      client.lLen(this.key('audit')),
    ]);
    return {
      usedJtis: arrayFromSet(usedJtis),
      revokedJtis: arrayFromSet(revokedJtis),
      revokedKeyIds: arrayFromSet(revokedKeyIds),
      auditCount: Number(auditCount ?? 0),
    };
  }

  protected async insertUsed(input: InsertUsedInput): Promise<boolean> {
    const client = await this.client();
    const inserted = await client.sAdd(this.key('used'), input.jti);
    if (inserted > 0) {
      await client.hSet(this.key('used-meta'), input.jti, JSON.stringify(input));
    }
    return inserted > 0;
  }

  protected async insertRevokedJti(input: RevokeJtiInput): Promise<void> {
    const client = await this.client();
    await client.sAdd(this.key('revoked-jtis'), input.jti);
    await client.hSet(this.key('revoked-jti-meta'), input.jti, JSON.stringify(input));
  }

  protected async insertRevokedKey(input: RevokeKeyInput): Promise<void> {
    const client = await this.client();
    await client.sAdd(this.key('revoked-keys'), input.keyId);
    await client.hSet(this.key('revoked-key-meta'), input.keyId, JSON.stringify(input));
  }

  protected async appendAudit(event: PosAgidSecureAuditEvent): Promise<void> {
    const client = await this.client();
    await client.lPush(this.key('audit'), JSON.stringify(event));
    await client.lTrim(this.key('audit'), 0, MAX_AUDIT_EVENTS - 1);
  }

  private async client() {
    if (!this.clientPromise) this.clientPromise = this.openClient();
    return this.clientPromise;
  }

  async close() {
    if (!this.clientPromise) return;
    const client = await this.clientPromise;
    await client.quit();
    this.clientPromise = null;
  }

  private async openClient() {
    if (!this.redisUrl) {
      throw new Error('AGID_POS_REDIS_URL or REDIS_URL is required for redis POS registry storage.');
    }
    const { createClient } = await dynamicImport('redis');
    const client = createClient({ url: this.redisUrl });
    client.on('error', (error: unknown) => {
      console.error('[agid-pos-redis-registry]', error);
    });
    await client.connect();
    return client;
  }

  private key(name: string) {
    return `${this.keyPrefix}:${this.registryId}:${name}`;
  }
}

export function createConfiguredPosAgidSecureRegistryStore(
  input: ConfiguredPosAgidSecureRegistryStoreInput = {},
): PosAgidSecureRegistryStoreAdapter {
  const storageMode = (input.storageMode || process.env.AGID_POS_REGISTRY_STORE || 'file').trim().toLowerCase();
  if (storageMode === 'sqlite') {
    return new SqlitePosAgidSecureRegistryStore(input.sqlitePath || defaultSqlitePath(), input);
  }
  if (storageMode === 'postgres') {
    const postgresUrl = input.postgresUrl || process.env.AGID_POS_POSTGRES_URL || process.env.DATABASE_URL || '';
    assertDatabaseProductionReady({
      adapter: 'postgres',
      url: postgresUrl,
      serviceName: 'POS AGID-S registry',
      envPrefix: 'AGID_POS_REGISTRY',
    });
    return new PostgresPosAgidSecureRegistryStore(
      postgresUrl,
      input,
    );
  }
  if (storageMode === 'redis') {
    const redisUrl = input.redisUrl || process.env.AGID_POS_REDIS_URL || process.env.REDIS_URL || '';
    assertDatabaseProductionReady({
      adapter: 'redis',
      url: redisUrl,
      serviceName: 'POS AGID-S registry',
      envPrefix: 'AGID_POS_REGISTRY',
    });
    return new RedisPosAgidSecureRegistryStore(
      redisUrl,
      { ...input, keyPrefix: input.redisKeyPrefix },
    );
  }
  return createPosAgidSecureRegistryStore({
    filePath: input.filePath,
    auditLogPath: input.auditLogPath,
    registryId: input.registryId,
  });
}
