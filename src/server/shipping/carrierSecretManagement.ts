import { createHash, randomUUID } from 'node:crypto';

import type { SqlPool } from './veygritShipStore';

export const CARRIER_SECRET_PROVIDERS = [
  'aws-secrets-manager',
  'gcp-secret-manager',
  'azure-key-vault',
  'external',
] as const;

export type CarrierSecretProvider = typeof CARRIER_SECRET_PROVIDERS[number];
export type CarrierCredentialOperation = 'credential.store' | 'credential.rotate';
export type AdminMfaMethod = 'totp' | 'webauthn' | 'passkey' | 'security_key' | 'other_mfa';

export type AdminMfaContext = {
  actorRef: string;
  merchantRef: string;
  sessionRef: string;
  roles: readonly string[];
  authenticationMethods: readonly string[];
  mfaVerifiedAt: string;
};

export type SecretWriteResult = {
  secretRef: string;
  versionRef: string;
};

export interface CarrierSecretVault {
  writeSecret(input: {
    provider: CarrierSecretProvider;
    connectionRef: string;
    currentSecretRef?: string;
    secretValue: Uint8Array;
  }): Promise<SecretWriteResult>;
}

type SuccessfulCredentialRecord = {
  connectionRef: string;
  provider: CarrierSecretProvider;
  displayLast4: string;
  rotatedAt: string;
  nextRotationAt: string;
};

export interface CarrierCredentialMetadataStore {
  recordSuccess(input: {
    rotationRef: string;
    merchantRef: string;
    connectionRef: string;
    provider: CarrierSecretProvider;
    operation: CarrierCredentialOperation;
    secretRef: string;
    versionRef: string;
    displayLast4: string;
    requestedByActorRef: string;
    mfaMethod: AdminMfaMethod;
    mfaSessionRefHash: string;
    requestedAt: string;
    nextRotationAt: string;
  }): Promise<SuccessfulCredentialRecord>;
  recordFailure(input: {
    rotationRef: string;
    merchantRef: string;
    connectionRef: string;
    provider: CarrierSecretProvider;
    operation: CarrierCredentialOperation;
    requestedByActorRef: string;
    mfaMethod: AdminMfaMethod;
    mfaSessionRefHash: string;
    requestedAt: string;
    failureCode: string;
  }): Promise<void>;
}

export type MaskedCarrierCredential = {
  connectionRef: string;
  provider: CarrierSecretProvider;
  maskedValue: string;
  rotatedAt: string;
  nextRotationAt: string;
};

function required(value: string, name: string, max = 500): string {
  const normalized = value.normalize('NFKC').trim();
  if (!normalized || normalized.length > max) throw new TypeError(`${name} is invalid.`);
  return normalized;
}

function iso(value: string, name: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError(`${name} is invalid.`);
  return date.toISOString();
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function secretLast4(value: Uint8Array): string {
  if (value.byteLength < 4) throw new TypeError('Carrier credential must contain at least four bytes.');
  const last4 = Buffer.from(value.buffer, value.byteOffset + value.byteLength - 4, 4).toString('utf8');
  if (!/^[A-Za-z0-9_-]{4}$/.test(last4)) {
    throw new TypeError('The final four credential characters must be safe display characters.');
  }
  return last4;
}

function mfaMethod(methods: readonly string[]): AdminMfaMethod | undefined {
  const normalized = new Set(methods.map(value => value.toLowerCase()));
  if (normalized.has('webauthn')) return 'webauthn';
  if (normalized.has('passkey')) return 'passkey';
  if (normalized.has('security_key') || normalized.has('hwk')) return 'security_key';
  if (normalized.has('totp') || normalized.has('otp')) return 'totp';
  if (normalized.has('mfa')) return 'other_mfa';
  return undefined;
}

export function requireFreshAdminMfa(
  context: AdminMfaContext,
  now = Date.now(),
  maximumAgeMs = 10 * 60_000,
): { method: AdminMfaMethod; sessionRefHash: string } {
  required(context.actorRef, 'actorRef', 200);
  required(context.merchantRef, 'merchantRef', 100);
  const sessionRef = required(context.sessionRef, 'sessionRef', 500);
  if (!context.roles.some(role => role === 'admin' || role === 'security_admin')) {
    throw new CarrierSecretAuthorizationError('admin_role_required');
  }
  const method = mfaMethod(context.authenticationMethods);
  if (!method) throw new CarrierSecretAuthorizationError('mfa_required');
  const verifiedAt = Date.parse(iso(context.mfaVerifiedAt, 'mfaVerifiedAt'));
  if (verifiedAt > now + 60_000 || now - verifiedAt > maximumAgeMs) {
    throw new CarrierSecretAuthorizationError('fresh_mfa_required');
  }
  return { method, sessionRefHash: sha256(sessionRef) };
}

export function validateProviderSecretReference(provider: CarrierSecretProvider, value: string): string {
  const ref = required(value, 'secretRef');
  const valid = provider === 'aws-secrets-manager'
    ? /^arn:(?:aws|aws-us-gov|aws-cn):secretsmanager:[^\s]+$/.test(ref)
    : provider === 'gcp-secret-manager'
      ? /^projects\/[A-Za-z0-9._-]+\/secrets\/[A-Za-z0-9._-]+\/versions\/[A-Za-z0-9._-]+$/.test(ref)
      : provider === 'azure-key-vault'
        ? /^https:\/\/[A-Za-z0-9.-]+\.vault\.azure\.net\/secrets\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)?$/.test(ref)
        : /^secretref_[A-Za-z0-9_-]{8,}$/.test(ref);
  if (!valid) throw new TypeError(`secretRef is not valid for ${provider}.`);
  return ref;
}

export function validateProviderVersionReference(provider: CarrierSecretProvider, value: string): string {
  const ref = required(value, 'versionRef');
  const valid = provider === 'aws-secrets-manager'
    ? /^[A-Za-z0-9_-]{8,128}$/.test(ref)
    : provider === 'gcp-secret-manager'
      ? /^projects\/[A-Za-z0-9._-]+\/secrets\/[A-Za-z0-9._-]+\/versions\/[0-9]+$/.test(ref)
      : provider === 'azure-key-vault'
        ? /^https:\/\/[A-Za-z0-9.-]+\.vault\.azure\.net\/secrets\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(ref)
        : /^versionref_[A-Za-z0-9_-]{8,}$/.test(ref);
  if (!valid) throw new TypeError(`versionRef is not valid for ${provider}.`);
  return ref;
}

function failureCode(error: unknown): string {
  const name = error instanceof Error ? error.name : 'unknown';
  return `vault_${name.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 70).toLowerCase()}`;
}

export class CarrierSecretAuthorizationError extends Error {
  constructor(readonly code: 'admin_role_required' | 'mfa_required' | 'fresh_mfa_required') {
    super(code);
    this.name = 'CarrierSecretAuthorizationError';
  }
}

export class CarrierSecretOperationError extends Error {
  constructor(readonly code: string) {
    super('Carrier credential operation failed.');
    this.name = 'CarrierSecretOperationError';
  }
}

export class PostgresCarrierCredentialMetadataStore implements CarrierCredentialMetadataStore {
  constructor(private readonly pool: SqlPool) {}

  async recordSuccess(input: {
    rotationRef: string;
    merchantRef: string;
    connectionRef: string;
    provider: CarrierSecretProvider;
    operation: CarrierCredentialOperation;
    secretRef: string;
    versionRef: string;
    displayLast4: string;
    requestedByActorRef: string;
    mfaMethod: AdminMfaMethod;
    mfaSessionRefHash: string;
    requestedAt: string;
    nextRotationAt: string;
  }): Promise<SuccessfulCredentialRecord> {
    const result = await this.pool.query<{
      connection_ref: string;
      credential_provider: CarrierSecretProvider;
      credential_display_last4: string;
      credential_rotated_at: Date | string;
      credential_next_rotation_at: Date | string;
    }>(
      `WITH connection AS MATERIALIZED (
         SELECT c.id,c.merchant_id,c.credential_secret_ref,c.credential_version_ref
         FROM veygrit_ship_carrier_connection c
         JOIN veygrit_ship_merchant m ON m.id=c.merchant_id
         WHERE m.merchant_ref=$1 AND m.status='active' AND c.connection_ref=$2 AND c.status<>'disabled'
       ), updated AS (
         UPDATE veygrit_ship_carrier_connection c SET
           credential_provider=$3, credential_secret_ref=$4, credential_version_ref=$5,
           credential_display_last4=$6, credential_rotated_at=$12, credential_next_rotation_at=$13
         FROM connection x WHERE c.id=x.id RETURNING c.*
       ), rotation AS (
         INSERT INTO veygrit_ship_credential_rotation
           (rotation_ref,merchant_id,carrier_connection_id,provider,operation,
            previous_secret_ref,next_secret_ref,previous_version_ref,next_version_ref,
            requested_by_actor_ref,mfa_method,mfa_session_ref_hash,status,requested_at)
         SELECT $7,x.merchant_id,x.id,$3,$8,x.credential_secret_ref,$4,x.credential_version_ref,$5,
           $9,$10,$11,'succeeded',$12 FROM connection x RETURNING id
       ), audit AS (
         INSERT INTO veygrit_ship_audit_event
           (event_ref,merchant_id,actor_type,actor_ref,action,aggregate_type,aggregate_ref,outcome,details,occurred_at)
         SELECT 'audit_' || md5(clock_timestamp()::text || random()::text || $7),x.merchant_id,'merchant_user',$9,
           $8,'carrier_connection',$2,'success',
           jsonb_build_object('provider',$3,'mfaMethod',$10,'rotationRef',$7),$12
         FROM connection x RETURNING id
       )
       SELECT connection_ref,credential_provider,credential_display_last4,
         credential_rotated_at,credential_next_rotation_at FROM updated`,
      [
        required(input.merchantRef, 'merchantRef', 100), required(input.connectionRef, 'connectionRef', 100), input.provider,
        validateProviderSecretReference(input.provider, input.secretRef), validateProviderVersionReference(input.provider, input.versionRef),
        required(input.displayLast4, 'displayLast4', 4), required(input.rotationRef, 'rotationRef', 100), input.operation,
        required(input.requestedByActorRef, 'requestedByActorRef', 200), input.mfaMethod,
        input.mfaSessionRefHash, iso(input.requestedAt, 'requestedAt'), iso(input.nextRotationAt, 'nextRotationAt'),
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Active Merchant carrier connection was not found.');
    return {
      connectionRef: row.connection_ref,
      provider: row.credential_provider,
      displayLast4: row.credential_display_last4,
      rotatedAt: new Date(row.credential_rotated_at).toISOString(),
      nextRotationAt: new Date(row.credential_next_rotation_at).toISOString(),
    };
  }

  async recordFailure(input: {
    rotationRef: string;
    merchantRef: string;
    connectionRef: string;
    provider: CarrierSecretProvider;
    operation: CarrierCredentialOperation;
    requestedByActorRef: string;
    mfaMethod: AdminMfaMethod;
    mfaSessionRefHash: string;
    requestedAt: string;
    failureCode: string;
  }): Promise<void> {
    const result = await this.pool.query(
      `WITH connection AS (
         SELECT c.id,c.merchant_id FROM veygrit_ship_carrier_connection c
         JOIN veygrit_ship_merchant m ON m.id=c.merchant_id
         WHERE m.merchant_ref=$1 AND c.connection_ref=$2
       ), rotation AS (
         INSERT INTO veygrit_ship_credential_rotation
           (rotation_ref,merchant_id,carrier_connection_id,provider,operation,requested_by_actor_ref,
            mfa_method,mfa_session_ref_hash,status,failure_code,requested_at)
         SELECT $3,x.merchant_id,x.id,$4,$5,$6,$7,$8,'failed',$9,$10 FROM connection x RETURNING id
       ), audit AS (
         INSERT INTO veygrit_ship_audit_event
           (event_ref,merchant_id,actor_type,actor_ref,action,aggregate_type,aggregate_ref,outcome,details,occurred_at)
         SELECT 'audit_' || md5(clock_timestamp()::text || random()::text || $3),x.merchant_id,'merchant_user',$6,
           $5,'carrier_connection',$2,'failure',jsonb_build_object('provider',$4,'failureCode',$9,'rotationRef',$3),$10
         FROM connection x RETURNING id
       ) SELECT id FROM rotation`,
      [
        required(input.merchantRef, 'merchantRef', 100), required(input.connectionRef, 'connectionRef', 100),
        required(input.rotationRef, 'rotationRef', 100), input.provider, input.operation,
        required(input.requestedByActorRef, 'requestedByActorRef', 200), input.mfaMethod,
        input.mfaSessionRefHash, required(input.failureCode, 'failureCode', 100), iso(input.requestedAt, 'requestedAt'),
      ],
    );
    if (!result.rows.length) throw new Error('Carrier connection was not found while recording credential failure.');
  }
}

export class CarrierSecretManagementService {
  constructor(
    private readonly vault: CarrierSecretVault,
    private readonly store: CarrierCredentialMetadataStore,
    private readonly options: { now?: () => number; defaultRotationDays?: number } = {},
  ) {}

  saveCredentials(input: {
    admin: AdminMfaContext;
    connectionRef: string;
    provider: CarrierSecretProvider;
    secretValue: Uint8Array;
    currentSecretRef?: string;
    rotationDays?: number;
  }): Promise<MaskedCarrierCredential> {
    return this.write('credential.store', input);
  }

  rotateCredentials(input: {
    admin: AdminMfaContext;
    connectionRef: string;
    provider: CarrierSecretProvider;
    secretValue: Uint8Array;
    currentSecretRef: string;
    rotationDays?: number;
  }): Promise<MaskedCarrierCredential> {
    return this.write('credential.rotate', input);
  }

  private async write(
    operation: CarrierCredentialOperation,
    input: {
      admin: AdminMfaContext;
      connectionRef: string;
      provider: CarrierSecretProvider;
      secretValue: Uint8Array;
      currentSecretRef?: string;
      rotationDays?: number;
    },
  ): Promise<MaskedCarrierCredential> {
    const now = (this.options.now ?? Date.now)();
    const mfa = requireFreshAdminMfa(input.admin, now);
    const connectionRef = required(input.connectionRef, 'connectionRef', 100);
    const currentSecretRef = input.currentSecretRef
      ? validateProviderSecretReference(input.provider, input.currentSecretRef)
      : undefined;
    if (operation === 'credential.rotate' && !currentSecretRef) throw new TypeError('currentSecretRef is required for rotation.');
    const displayLast4 = secretLast4(input.secretValue);
    const secretBuffer = Buffer.from(input.secretValue);
    const requestedAt = new Date(now).toISOString();
    const rotationRef = `rotation_${randomUUID().replace(/-/g, '')}`;
    const rotationDays = Math.max(1, Math.min(365, Math.trunc(input.rotationDays ?? this.options.defaultRotationDays ?? 90)));
    const nextRotationAt = new Date(now + rotationDays * 86_400_000).toISOString();
    try {
      const written = await this.vault.writeSecret({
        provider: input.provider,
        connectionRef,
        ...(currentSecretRef ? { currentSecretRef } : {}),
        secretValue: secretBuffer,
      });
      const record = await this.store.recordSuccess({
        rotationRef, merchantRef: input.admin.merchantRef, connectionRef, provider: input.provider, operation,
        secretRef: validateProviderSecretReference(input.provider, written.secretRef),
        versionRef: validateProviderVersionReference(input.provider, written.versionRef), displayLast4,
        requestedByActorRef: input.admin.actorRef, mfaMethod: mfa.method, mfaSessionRefHash: mfa.sessionRefHash,
        requestedAt, nextRotationAt,
      });
      return {
        connectionRef: record.connectionRef,
        provider: record.provider,
        maskedValue: `••••${record.displayLast4}`,
        rotatedAt: record.rotatedAt,
        nextRotationAt: record.nextRotationAt,
      };
    } catch (error) {
      const code = failureCode(error);
      try {
        await this.store.recordFailure({
          rotationRef, merchantRef: input.admin.merchantRef, connectionRef, provider: input.provider, operation,
          requestedByActorRef: input.admin.actorRef, mfaMethod: mfa.method, mfaSessionRefHash: mfa.sessionRefHash,
          requestedAt, failureCode: code,
        });
      } catch { /* preserve the original vault/store failure */ }
      throw new CarrierSecretOperationError(code);
    } finally {
      secretBuffer.fill(0);
    }
  }
}
