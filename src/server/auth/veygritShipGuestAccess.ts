import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';

import type { SqlClient, SqlPool } from '../shipping/veygritShipStore';

export const VEYGRIT_SHIP_GUEST_ACCESS_VERSION = 'veygrit-ship-guest-access-v1' as const;

export const GUEST_CAPABILITIES = [
  'rate_simulation',
  'sandbox_shipment',
  'shipment_draft',
  'address_input',
  'test_api',
] as const;

export type GuestCapability = typeof GUEST_CAPABILITIES[number];

export const ACCOUNT_REQUIRED_OPERATIONS = [
  'carrier_credentials',
  'label_purchase',
  'production_api_key',
  'billing',
  'team_management',
  'webhook_configuration',
] as const;

export type AccountRequiredOperation = typeof ACCOUNT_REQUIRED_OPERATIONS[number];

export const PUBLIC_SITES_CARRIER_SECRET_BOUNDARY = Object.freeze({
  credentialInputAvailable: false,
  credentialStorageAvailable: false,
  backendOnly: true,
  adminMfaRequired: true,
  databaseStores: 'secret_reference_and_last4_only',
} as const);

export const GUEST_FORBIDDEN_OPERATIONS = [
  'live_rate',
  'live_shipment',
  'shipment_void',
  'carrier_connection',
  ...ACCOUNT_REQUIRED_OPERATIONS,
  'kyc',
] as const;

export type GuestCapabilityBudget = { limit: number; windowSeconds: number };

export const GUEST_CAPABILITY_BUDGETS: Record<GuestCapability, GuestCapabilityBudget> = {
  rate_simulation: { limit: 60, windowSeconds: 15 * 60 },
  sandbox_shipment: { limit: 20, windowSeconds: 60 * 60 },
  shipment_draft: { limit: 50, windowSeconds: 60 * 60 },
  address_input: { limit: 60, windowSeconds: 15 * 60 },
  test_api: { limit: 120, windowSeconds: 15 * 60 },
};

export type GuestSessionRecord = {
  sessionRef: string;
  capabilities: GuestCapability[];
  expiresAt: string;
};

export type GuestAccessDecision =
  | ({ ok: true; remaining: number } & GuestSessionRecord)
  | { ok: false; reason: 'invalid_token' | 'expired' | 'revoked' | 'capability_denied' | 'rate_limited' };

export interface GuestAccessStore {
  createSession(input: {
    sessionRef: string;
    tokenHash: string;
    issuerFingerprintHash: string;
    expiresAt: string;
    maxSessionsPerHour: number;
  }): Promise<boolean>;
  consumeCapability(input: { tokenHash: string; capability: GuestCapability; budget: GuestCapabilityBudget }): Promise<GuestAccessDecision>;
  revokeSession(sessionRef: string, reason: string): Promise<boolean>;
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function iso(value: string, name: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new TypeError(`${name} is invalid.`);
  return parsed.toISOString();
}

async function transaction<T>(pool: SqlPool, work: (client: SqlClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* keep original error */ }
    throw error;
  } finally {
    client.release();
  }
}

type GuestRow = {
  id: string;
  session_ref: string;
  capabilities: GuestCapability[];
  expires_at: Date | string;
  status: 'active' | 'claimed' | 'expired' | 'revoked';
  is_expired: boolean;
};

export class PostgresGuestAccessStore implements GuestAccessStore {
  constructor(private readonly pool: SqlPool) {}

  async createSession(input: {
    sessionRef: string;
    tokenHash: string;
    issuerFingerprintHash: string;
    expiresAt: string;
    maxSessionsPerHour: number;
  }): Promise<boolean> {
    return transaction(this.pool, async client => {
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [input.issuerFingerprintHash]);
      const result = await client.query<{ id: string; session_ref: string }>(
        `INSERT INTO veygrit_ship_guest_session
          (session_ref, token_hash, issuer_fingerprint_hash, expires_at, capabilities)
         SELECT $1,$2,$3,$4,$5
         WHERE (SELECT count(*) FROM veygrit_ship_guest_session
                WHERE issuer_fingerprint_hash=$3 AND created_at>now()-interval '1 hour') < $6
         RETURNING id, session_ref`,
        [input.sessionRef, input.tokenHash, input.issuerFingerprintHash, iso(input.expiresAt, 'expiresAt'), [...GUEST_CAPABILITIES], input.maxSessionsPerHour],
      );
      if (!result.rows[0]) return false;
      await client.query(
        `INSERT INTO veygrit_ship_audit_event
          (event_ref, guest_session_id, actor_type, action, aggregate_type, aggregate_ref, outcome, details)
         VALUES ('audit_' || md5(clock_timestamp()::text || random()::text || $1),$2,'guest',
           'guest.session.issued','guest_session',$1,'success','{}'::jsonb)`,
        [result.rows[0].session_ref, result.rows[0].id],
      );
      return true;
    });
  }

  async consumeCapability(input: {
    tokenHash: string;
    capability: GuestCapability;
    budget: GuestCapabilityBudget;
  }): Promise<GuestAccessDecision> {
    const session = await this.pool.query<GuestRow>(
      `SELECT id, session_ref, capabilities, expires_at, status, (expires_at<=now()) AS is_expired
       FROM veygrit_ship_guest_session WHERE token_hash=$1`,
      [input.tokenHash],
    );
    const row = session.rows[0];
    if (!row) return { ok: false, reason: 'invalid_token' };
    if (row.status === 'revoked' || row.status === 'claimed') return { ok: false, reason: 'revoked' };
    if (row.status !== 'active' || row.is_expired) return { ok: false, reason: 'expired' };
    if (!row.capabilities.includes(input.capability)) return { ok: false, reason: 'capability_denied' };

    const consumed = await this.pool.query<{ request_count: number; session_ref: string; capabilities: GuestCapability[]; expires_at: Date | string }>(
      `WITH usage AS (
         INSERT INTO veygrit_ship_guest_capability_usage
           (guest_session_id, capability, window_started_at, request_count, last_used_at)
         SELECT g.id,$2,now(),1,now() FROM veygrit_ship_guest_session g
         WHERE g.id=$1 AND g.status='active' AND g.expires_at>now() AND $2=ANY(g.capabilities)
         ON CONFLICT (guest_session_id, capability) DO UPDATE SET
           window_started_at=CASE
             WHEN veygrit_ship_guest_capability_usage.window_started_at<=now()-make_interval(secs=>$4) THEN now()
             ELSE veygrit_ship_guest_capability_usage.window_started_at END,
           request_count=CASE
             WHEN veygrit_ship_guest_capability_usage.window_started_at<=now()-make_interval(secs=>$4) THEN 1
             ELSE veygrit_ship_guest_capability_usage.request_count+1 END,
           last_used_at=now()
         WHERE veygrit_ship_guest_capability_usage.window_started_at<=now()-make_interval(secs=>$4)
            OR veygrit_ship_guest_capability_usage.request_count<$3
         RETURNING guest_session_id, request_count
       )
       UPDATE veygrit_ship_guest_session g SET last_seen_at=now()
       FROM usage u WHERE g.id=u.guest_session_id
       RETURNING u.request_count, g.session_ref, g.capabilities, g.expires_at`,
      [row.id, input.capability, input.budget.limit, input.budget.windowSeconds],
    );
    const result = consumed.rows[0];
    if (!result) return { ok: false, reason: 'rate_limited' };
    return {
      ok: true,
      sessionRef: result.session_ref,
      capabilities: result.capabilities,
      expiresAt: new Date(result.expires_at).toISOString(),
      remaining: Math.max(0, input.budget.limit - result.request_count),
    };
  }

  async revokeSession(sessionRef: string, reason: string): Promise<boolean> {
    const normalizedReason = reason.normalize('NFKC').trim().slice(0, 200);
    const result = await this.pool.query(
      `WITH revoked AS (
         UPDATE veygrit_ship_guest_session SET status='revoked', revoked_reason=$2
         WHERE session_ref=$1 AND status='active' RETURNING id, session_ref
       ), audit AS (
         INSERT INTO veygrit_ship_audit_event
           (event_ref, guest_session_id, actor_type, action, aggregate_type, aggregate_ref, outcome, details)
         SELECT 'audit_' || md5(clock_timestamp()::text || random()::text || r.session_ref),r.id,'guest',
           'guest.session.revoked','guest_session',r.session_ref,'success','{}'::jsonb FROM revoked r RETURNING id
       ) SELECT session_ref FROM revoked`,
      [sessionRef, normalizedReason || 'revoked'],
    );
    return result.rows.length === 1;
  }
}

export class VeygritShipGuestAccessService {
  constructor(
    private readonly store: GuestAccessStore,
    private readonly options: {
      fingerprintSecret: string;
      sessionLifetimeMs?: number;
      maxSessionsPerHour?: number;
      now?: () => number;
      randomToken?: () => string;
    },
  ) {
    if (options.fingerprintSecret.length < 32) throw new TypeError('Guest fingerprint secret must be at least 32 characters.');
  }

  async issueSession(issuer: string): Promise<{ token: string } & GuestSessionRecord> {
    const normalizedIssuer = issuer.trim() || 'unknown';
    const token = this.options.randomToken?.() ?? `gst_${randomBytes(32).toString('base64url')}`;
    const now = (this.options.now ?? Date.now)();
    const lifetime = Math.max(15 * 60_000, Math.min(24 * 60 * 60_000, this.options.sessionLifetimeMs ?? 2 * 60 * 60_000));
    const sessionRef = `guest_${randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(now + lifetime).toISOString();
    const issuerFingerprintHash = createHmac('sha256', this.options.fingerprintSecret).update(normalizedIssuer).digest('hex');
    const created = await this.store.createSession({
      sessionRef,
      tokenHash: sha256(token),
      issuerFingerprintHash,
      expiresAt,
      maxSessionsPerHour: Math.max(1, Math.min(100, this.options.maxSessionsPerHour ?? 10)),
    });
    if (!created) throw new GuestSessionIssuanceError();
    return { token, sessionRef, capabilities: [...GUEST_CAPABILITIES], expiresAt };
  }

  authorize(token: string, capability: GuestCapability): Promise<GuestAccessDecision> {
    const normalized = token.trim();
    if (!/^gst_[A-Za-z0-9_-]{32,200}$/.test(normalized)) return Promise.resolve({ ok: false, reason: 'invalid_token' });
    return this.store.consumeCapability({ tokenHash: sha256(normalized), capability, budget: GUEST_CAPABILITY_BUDGETS[capability] });
  }
}

export class GuestSessionIssuanceError extends Error {
  constructor() { super('Guest session issuance rate limit was reached.'); this.name = 'GuestSessionIssuanceError'; }
}

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

export async function createGuestAccessServiceFromEnv(env: NodeJS.ProcessEnv = process.env): Promise<VeygritShipGuestAccessService> {
  const guestConnectionString = env.VEYGRIT_SHIP_GUEST_POSTGRES_URL?.trim();
  const connectionString = guestConnectionString || env.VEYGRIT_SHIP_POSTGRES_URL?.trim() || env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('VEYGRIT_SHIP_GUEST_POSTGRES_URL (or VEYGRIT_SHIP_POSTGRES_URL/DATABASE_URL) is required for Guest access.');
  if (env.NODE_ENV === 'production' && !guestConnectionString) {
    throw new Error('VEYGRIT_SHIP_GUEST_POSTGRES_URL is required in production so Guest requests use a least-privilege database role.');
  }
  const fingerprintSecret = env.VEYGRIT_SHIP_GUEST_FINGERPRINT_SECRET?.trim() ?? '';
  const { Pool } = await dynamicImport('pg');
  const pool = new Pool({
    connectionString,
    max: Math.max(1, Math.min(20, Number(env.VEYGRIT_SHIP_POSTGRES_POOL_MAX || 10))),
    statement_timeout: Math.max(1_000, Number(env.VEYGRIT_SHIP_POSTGRES_STATEMENT_TIMEOUT_MS || 15_000)),
    application_name: 'veygrit-ship-guest-access',
  }) as SqlPool;
  await pool.query('SELECT 1');
  return new VeygritShipGuestAccessService(new PostgresGuestAccessStore(pool), {
    fingerprintSecret,
    sessionLifetimeMs: Number(env.VEYGRIT_SHIP_GUEST_SESSION_LIFETIME_MS || 2 * 60 * 60_000),
    maxSessionsPerHour: Number(env.VEYGRIT_SHIP_GUEST_SESSIONS_PER_HOUR || 10),
  });
}
