import type { SyncQueueRecord } from './appDatabase';
import {
  collectAgidRegistryPrivateMaterialErrors,
  type AgidRegistryAuditEvent,
  type AgidRegistryFreshnessRootRecord,
  type AgidRegistryIssuerRecord,
  type AgidRegistryNullifierRecord,
  type AgidRegistryRevocationRecord,
  type AgidRegistrySnapshot,
} from './agidRegistryApi';
import {
  getDatabaseAdapterCompatibility,
  type DatabaseAdapterCompatibilityRecord,
} from './databaseAdapterCompatibility';
import { hashStable, stableId, toIsoTimestamp } from './redactedWorkflowCore';

export const DB_LEDGER_REGISTRY_INTEGRATION_VERSION = 'agid-db-ledger-registry-v1';

export type DbDeploymentEnvironment = 'test' | 'development' | 'staging' | 'production';

export type DbLedgerRegistryLayer =
  | 'resolution-ledger'
  | 'registry'
  | 'sync-outbox'
  | 'audit';

export type DbLedgerRegistryTablePlan = {
  layer: DbLedgerRegistryLayer;
  table: string;
  role: 'append-only' | 'current-state' | 'outbox' | 'audit-log';
  stores: string;
  rawPrivateMaterialStored: false;
};

export type DbLedgerRegistryReadinessInput = {
  adapterId: string;
  environment?: DbDeploymentEnvironment | string;
  requiresRuntimeLedger?: boolean;
  requiresRegistry?: boolean;
  tls?: {
    required?: boolean;
    verified?: boolean;
    caRef?: string;
  };
  roles?: {
    appRole?: string;
    readRole?: string;
    migrationRole?: string;
    adminRole?: string;
    leastPrivilege?: boolean;
  };
  migrations?: {
    runner?: string;
    appliedMigrationIds?: string[];
    appliedSchemaRefs?: string[];
  };
  audit?: {
    enabled?: boolean;
    table?: string;
    retentionDays?: number;
    actorRequired?: boolean;
  };
  ledger?: {
    enabled?: boolean;
    appendOnly?: boolean;
    eventHashChain?: boolean;
  };
  registry?: {
    enabled?: boolean;
    rawMaterialAccepted?: boolean;
  };
};

export type DbLedgerRegistryReadiness = {
  modelVersion: typeof DB_LEDGER_REGISTRY_INTEGRATION_VERSION;
  accepted: boolean;
  mode: 'db-contract-ready' | 'production-db-contract-ready' | 'blocked';
  environment: DbDeploymentEnvironment;
  adapter: Pick<DatabaseAdapterCompatibilityRecord,
    'id' | 'label' | 'status' | 'runtimeLedgerStoreMode' | 'schemaRefs' | 'privacyControls'
  > | null;
  schemaRefs: string[];
  missingSchemaRefs: string[];
  requiredControls: string[];
  tablePlan: DbLedgerRegistryTablePlan[];
  errors: string[];
  warnings: string[];
};

export type DbLedgerAggregateKind =
  | 'address-reference'
  | 'agid'
  | 'aoid'
  | 'credential'
  | 'pid'
  | 'delivery'
  | 'resolution';

export type DbLedgerEventInput = {
  streamId: string;
  aggregateKind: DbLedgerAggregateKind | string;
  aggregateId: string;
  eventType: string;
  eventVersion?: number;
  sequence: number;
  occurredAt?: string;
  resolutionId?: string;
  actorCommitment?: string;
  causationId?: string;
  correlationId?: string;
  payload?: unknown;
  previousEventHash?: string;
};

export type DbLedgerEventRow = {
  eventId: string;
  streamId: string;
  aggregateKind: DbLedgerAggregateKind;
  aggregateId: string;
  eventType: string;
  eventVersion: number;
  sequence: number;
  occurredAt: string;
  resolutionId?: string;
  actorCommitment?: string;
  causationId?: string;
  correlationId?: string;
  payloadHash: string;
  payloadJson: unknown;
  previousEventHash?: string;
  eventHash: string;
  rawPrivateMaterialStored: false;
};

export type DbRegistryMirrorRecords = {
  modelVersion: typeof DB_LEDGER_REGISTRY_INTEGRATION_VERSION;
  generatedAt: string;
  registryRoot: string;
  issuers: Array<AgidRegistryIssuerRecord & { rawPrivateMaterialStored: false }>;
  revokedCommitments: Array<AgidRegistryRevocationRecord & { rawPrivateMaterialStored: false }>;
  freshnessRoots: Array<AgidRegistryFreshnessRootRecord & { rawPrivateMaterialStored: false }>;
  usedNullifiers: Array<AgidRegistryNullifierRecord & { rawPrivateMaterialStored: false }>;
  auditEvents: Array<AgidRegistryAuditEvent & {
    eventHash: string;
    rawPrivateMaterialStored: false;
  }>;
  counts: {
    issuers: number;
    revokedCommitments: number;
    freshnessRoots: number;
    usedNullifiers: number;
    auditEvents: number;
  };
  rawPrivateMaterialStored: false;
};

export type DbSyncOutboxRecord = {
  outboxId: string;
  entityType: SyncQueueRecord['entityType'];
  entityId: string;
  action: SyncQueueRecord['action'];
  status: SyncQueueRecord['status'];
  attemptCount: number;
  createdAt: number;
  updatedAt: number;
  payloadHash: string;
  payloadJson?: unknown;
  auditHash?: string;
  rawPrivateMaterialStored: false;
};

const TABLE_PLAN: DbLedgerRegistryTablePlan[] = [
  {
    layer: 'resolution-ledger',
    table: 'address_resolution_event',
    role: 'append-only',
    stores: 'Hash-chained resolution, delivery, AGID, AOID, PID, and credential events.',
    rawPrivateMaterialStored: false,
  },
  {
    layer: 'resolution-ledger',
    table: 'address_temporal_snapshot',
    role: 'current-state',
    stores: 'Materialized current state derived from append-only events.',
    rawPrivateMaterialStored: false,
  },
  {
    layer: 'registry',
    table: 'agid_registry_issuer',
    role: 'current-state',
    stores: 'Issuer public commitments, trust score, status, and source ids.',
    rawPrivateMaterialStored: false,
  },
  {
    layer: 'registry',
    table: 'agid_registry_revocation',
    role: 'current-state',
    stores: 'Revoked public commitments and issuer-scoped reason metadata.',
    rawPrivateMaterialStored: false,
  },
  {
    layer: 'registry',
    table: 'agid_registry_freshness_root',
    role: 'current-state',
    stores: 'Freshness roots and validity windows for resolver/registry reads.',
    rawPrivateMaterialStored: false,
  },
  {
    layer: 'registry',
    table: 'agid_registry_nullifier',
    role: 'current-state',
    stores: 'Scope-separated used nullifiers for replay prevention.',
    rawPrivateMaterialStored: false,
  },
  {
    layer: 'sync-outbox',
    table: 'agid_sync_outbox',
    role: 'outbox',
    stores: 'Safe sync job hashes, status, attempts, and optional redacted payloads.',
    rawPrivateMaterialStored: false,
  },
  {
    layer: 'audit',
    table: 'agid_registry_audit_event',
    role: 'audit-log',
    stores: 'Redacted registry and DB adapter events with event hashes.',
    rawPrivateMaterialStored: false,
  },
];

const PRODUCTION_AUDIT_RETENTION_DAYS = 365;
const RUNTIME_LEDGER_STATUSES = new Set([
  'runtime-ledger-adapter',
  'postgres-compatible-runtime-adapter',
]);
const LOCAL_ADAPTERS = new Set(['memory', 'sqlite']);
const AGGREGATE_KINDS = new Set<DbLedgerAggregateKind>([
  'address-reference',
  'agid',
  'aoid',
  'credential',
  'pid',
  'delivery',
  'resolution',
]);
const PUBLIC_DB_VALUE_PATHS = [
  /\.(acceptedMaterial|rejectedMaterial)\[\d+\]$/,
  /\.(eventId|operation|status|mode|modeVersion|commitmentType|publicHandle|countryCode|sourceIds\[\d+\]|errors\[\d+\]|warnings\[\d+\])$/,
  /\.provider\.label$/,
  /\.provider\.family$/,
];

function cleanText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function cleanStringList(values: unknown) {
  if (!Array.isArray(values)) return [];
  return values.map(value => cleanText(value)).filter(Boolean);
}

function cleanEnvironment(value: unknown): DbDeploymentEnvironment {
  const normalized = cleanText(value, 'development').toLowerCase();
  if (normalized === 'test' || normalized === 'development' || normalized === 'staging' || normalized === 'production') {
    return normalized;
  }
  return 'development';
}

function cleanRole(value: unknown) {
  return cleanText(value).replace(/[^a-zA-Z0-9_:-]+/g, '').slice(0, 96);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function tablePlan() {
  return TABLE_PLAN.map(row => ({ ...row }));
}

function publicPayloadErrors(value: unknown, path: string) {
  return collectAgidRegistryPrivateMaterialErrors(value, path)
    .filter(error => {
      const errorPath = error.split(' ')[0] ?? '';
      return !PUBLIC_DB_VALUE_PATHS.some(pattern => pattern.test(errorPath));
    });
}

function requireIfProduction(
  condition: boolean,
  error: string,
  warning: string,
  isProduction: boolean,
  errors: string[],
  warnings: string[],
) {
  if (condition) return;
  if (isProduction) {
    errors.push(error);
  } else {
    warnings.push(warning);
  }
}

function cleanAggregateKind(value: unknown): DbLedgerAggregateKind {
  const normalized = cleanText(value).toLowerCase();
  return AGGREGATE_KINDS.has(normalized as DbLedgerAggregateKind)
    ? normalized as DbLedgerAggregateKind
    : 'resolution';
}

function positiveInteger(value: unknown, fallback: number) {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(1, Math.floor(number));
}

export function listDbLedgerRegistryTablePlan() {
  return tablePlan();
}

export function evaluateDbLedgerRegistryReadiness(
  input: DbLedgerRegistryReadinessInput,
): DbLedgerRegistryReadiness {
  const adapter = getDatabaseAdapterCompatibility(cleanText(input.adapterId));
  const environment = cleanEnvironment(input.environment);
  const isProduction = environment === 'production';
  const requiresRuntimeLedger = input.requiresRuntimeLedger ?? true;
  const requiresRegistry = input.requiresRegistry ?? true;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!adapter) {
    errors.push('unsupported-database-adapter');
  }

  if (adapter && requiresRuntimeLedger && !RUNTIME_LEDGER_STATUSES.has(adapter.status)) {
    errors.push(`adapter-not-approved-for-runtime-ledger:${adapter.id}`);
  }

  if (adapter?.id === 'memory' && isProduction) {
    errors.push('memory-adapter-not-production-durable');
  }

  if (adapter?.id === 'sqlite' && isProduction) {
    warnings.push('sqlite-production-use-requires-single-node-backups-and-wal-review');
  }

  const nonLocalAdapter = adapter ? !LOCAL_ADAPTERS.has(adapter.id) : true;
  if (nonLocalAdapter) {
    requireIfProduction(
      input.tls?.required === true,
      'verified-tls-required-for-production-db',
      'tls-should-be-required-before-staging-or-production',
      isProduction,
      errors,
      warnings,
    );
    requireIfProduction(
      input.tls?.verified === true,
      'tls-verification-required-for-production-db',
      'tls-verification-should-be-tested-before-release',
      isProduction,
      errors,
      warnings,
    );
  }

  requireIfProduction(
    input.roles?.leastPrivilege === true,
    'least-privilege-db-roles-required',
    'least-privilege-db-roles-should-be-configured',
    isProduction,
    errors,
    warnings,
  );

  if (isProduction) {
    if (!cleanRole(input.roles?.appRole)) errors.push('db-app-role-required');
    if (!cleanRole(input.roles?.readRole)) errors.push('db-read-role-required');
    if (!cleanRole(input.roles?.migrationRole)) errors.push('db-migration-role-required');
  }

  const schemaRefs = adapter?.schemaRefs ?? [];
  const appliedSchemaRefs = cleanStringList(input.migrations?.appliedSchemaRefs);
  const missingSchemaRefs = schemaRefs.filter(ref => !appliedSchemaRefs.includes(ref));
  if (schemaRefs.length > 0) {
    requireIfProduction(
      Boolean(cleanText(input.migrations?.runner)),
      'migration-runner-required',
      'migration-runner-should-be-declared',
      isProduction,
      errors,
      warnings,
    );
    for (const missing of missingSchemaRefs) {
      if (isProduction) {
        errors.push(`missing-applied-schema-ref:${missing}`);
      } else {
        warnings.push(`schema-ref-not-yet-applied:${missing}`);
      }
    }
  }

  requireIfProduction(
    input.audit?.enabled === true,
    'db-audit-log-required',
    'db-audit-log-should-be-enabled',
    isProduction,
    errors,
    warnings,
  );
  if (input.audit?.enabled) {
    requireIfProduction(
      Boolean(cleanText(input.audit.table)),
      'db-audit-table-required',
      'db-audit-table-should-be-declared',
      isProduction,
      errors,
      warnings,
    );
    requireIfProduction(
      (input.audit.retentionDays ?? 0) >= PRODUCTION_AUDIT_RETENTION_DAYS,
      'db-audit-retention-too-short',
      'db-audit-retention-should-be-at-least-365-days',
      isProduction,
      errors,
      warnings,
    );
    requireIfProduction(
      input.audit.actorRequired === true,
      'db-audit-actor-required',
      'db-audit-actor-should-be-required',
      isProduction,
      errors,
      warnings,
    );
  }

  if (requiresRuntimeLedger) {
    requireIfProduction(
      input.ledger?.enabled !== false,
      'runtime-ledger-required',
      'runtime-ledger-should-be-enabled',
      isProduction,
      errors,
      warnings,
    );
    requireIfProduction(
      input.ledger?.appendOnly === true,
      'append-only-ledger-required',
      'append-only-ledger-should-be-enabled',
      isProduction,
      errors,
      warnings,
    );
    requireIfProduction(
      input.ledger?.eventHashChain === true,
      'ledger-event-hash-chain-required',
      'ledger-event-hash-chain-should-be-enabled',
      isProduction,
      errors,
      warnings,
    );
  }

  if (requiresRegistry) {
    requireIfProduction(
      input.registry?.enabled !== false,
      'registry-mirror-required',
      'registry-mirror-should-be-enabled',
      isProduction,
      errors,
      warnings,
    );
  }
  if (input.registry?.rawMaterialAccepted === true) {
    errors.push('registry-must-not-accept-raw-private-material');
  }

  const requiredControls = [
    'no-raw-address-or-recipient-columns',
    'commitments-hashes-roots-nullifiers-only-for-registry',
    'append-only-ledger-events',
    'ledger-event-hash-chain',
    'migration-runner-with-schema-ref-audit',
    'least-privilege-db-roles',
    'redacted-db-audit-log',
    ...(nonLocalAdapter ? ['verified-tls-in-production'] : []),
  ];

  const dedupedErrors = Array.from(new Set(errors));
  const dedupedWarnings = Array.from(new Set(warnings));
  const accepted = dedupedErrors.length === 0;

  return {
    modelVersion: DB_LEDGER_REGISTRY_INTEGRATION_VERSION,
    accepted,
    mode: accepted
      ? isProduction ? 'production-db-contract-ready' : 'db-contract-ready'
      : 'blocked',
    environment,
    adapter: adapter
      ? {
          id: adapter.id,
          label: adapter.label,
          status: adapter.status,
          runtimeLedgerStoreMode: adapter.runtimeLedgerStoreMode,
          schemaRefs: [...adapter.schemaRefs],
          privacyControls: [...adapter.privacyControls],
        }
      : null,
    schemaRefs,
    missingSchemaRefs,
    requiredControls: Array.from(new Set(requiredControls)),
    tablePlan: tablePlan(),
    errors: dedupedErrors,
    warnings: dedupedWarnings,
  };
}

export function buildDbLedgerEventRow(input: DbLedgerEventInput): DbLedgerEventRow {
  const streamId = cleanText(input.streamId);
  const aggregateId = cleanText(input.aggregateId);
  const eventType = cleanText(input.eventType);
  const sequence = positiveInteger(input.sequence, 1);
  const eventVersion = positiveInteger(input.eventVersion, 1);
  const payloadJson = clone(input.payload ?? {});
  const privateErrors = publicPayloadErrors(payloadJson, 'ledger.payload');

  if (!streamId) throw new Error('DB ledger events require streamId.');
  if (!aggregateId) throw new Error('DB ledger events require aggregateId.');
  if (!eventType) throw new Error('DB ledger events require eventType.');
  if (privateErrors.length > 0) {
    throw new Error(`DB ledger event rejected private material: ${privateErrors.join(' ')}`);
  }

  const aggregateKind = cleanAggregateKind(input.aggregateKind);
  const occurredAt = toIsoTimestamp(input.occurredAt);
  const previousEventHash = cleanText(input.previousEventHash) || undefined;
  const payloadHash = hashStable(payloadJson);
  const eventId = stableId('DBLE', {
    streamId,
    aggregateKind,
    aggregateId,
    eventType,
    eventVersion,
    sequence,
    occurredAt,
    payloadHash,
    previousEventHash,
  }, { length: 20 });
  const eventHash = hashStable({
    eventId,
    streamId,
    aggregateKind,
    aggregateId,
    eventType,
    eventVersion,
    sequence,
    occurredAt,
    previousEventHash,
    payloadHash,
  });

  return {
    eventId,
    streamId,
    aggregateKind,
    aggregateId,
    eventType,
    eventVersion,
    sequence,
    occurredAt,
    ...(cleanText(input.resolutionId) ? { resolutionId: cleanText(input.resolutionId) } : {}),
    ...(cleanText(input.actorCommitment) ? { actorCommitment: cleanText(input.actorCommitment) } : {}),
    ...(cleanText(input.causationId) ? { causationId: cleanText(input.causationId) } : {}),
    ...(cleanText(input.correlationId) ? { correlationId: cleanText(input.correlationId) } : {}),
    payloadHash,
    payloadJson,
    ...(previousEventHash ? { previousEventHash } : {}),
    eventHash,
    rawPrivateMaterialStored: false,
  };
}

export function buildDbRegistryMirrorRecords(
  snapshot: AgidRegistrySnapshot,
  options: {
    generatedAt?: string;
  } = {},
): DbRegistryMirrorRecords {
  const privateErrors = publicPayloadErrors(snapshot, 'registry.snapshot');
  if (privateErrors.length > 0) {
    throw new Error(`DB registry mirror rejected private material: ${privateErrors.join(' ')}`);
  }

  const generatedAt = toIsoTimestamp(options.generatedAt);
  const issuers = snapshot.issuers.map(record => ({
    ...clone(record),
    rawPrivateMaterialStored: false as const,
  }));
  const revokedCommitments = snapshot.revokedCommitments.map(record => ({
    ...clone(record),
    rawPrivateMaterialStored: false as const,
  }));
  const freshnessRoots = snapshot.freshnessRoots.map(record => ({
    ...clone(record),
    rawPrivateMaterialStored: false as const,
  }));
  const usedNullifiers = snapshot.usedNullifiers.map(record => ({
    ...clone(record),
    rawPrivateMaterialStored: false as const,
  }));
  const auditEvents = snapshot.audit.map(event => ({
    ...clone(event),
    eventHash: hashStable(event),
    rawPrivateMaterialStored: false as const,
  }));
  const registryRoot = hashStable({
    mode: snapshot.mode,
    modeVersion: snapshot.modeVersion,
    issuers,
    revokedCommitments,
    freshnessRoots,
    usedNullifiers,
    auditEvents: auditEvents.map(event => event.eventHash),
  });

  return {
    modelVersion: DB_LEDGER_REGISTRY_INTEGRATION_VERSION,
    generatedAt,
    registryRoot,
    issuers,
    revokedCommitments,
    freshnessRoots,
    usedNullifiers,
    auditEvents,
    counts: {
      issuers: issuers.length,
      revokedCommitments: revokedCommitments.length,
      freshnessRoots: freshnessRoots.length,
      usedNullifiers: usedNullifiers.length,
      auditEvents: auditEvents.length,
    },
    rawPrivateMaterialStored: false,
  };
}

export function buildDbSyncOutboxRecord(
  record: SyncQueueRecord,
  options: {
    includeSafePayloadJson?: boolean;
  } = {},
): DbSyncOutboxRecord {
  const privateErrors = publicPayloadErrors(record.payload, 'syncQueue.payload');
  if (privateErrors.length > 0) {
    throw new Error(`DB sync outbox rejected private material: ${privateErrors.join(' ')}`);
  }

  const payloadJson = clone(record.payload ?? {});
  const payloadHash = hashStable(payloadJson);
  const auditHash = record.audit ? hashStable(record.audit) : undefined;
  return {
    outboxId: stableId('DBO', {
      id: record.id,
      entityType: record.entityType,
      entityId: record.entityId,
      action: record.action,
      payloadHash,
      auditHash,
    }, { length: 20 }),
    entityType: record.entityType,
    entityId: record.entityId,
    action: record.action,
    status: record.status,
    attemptCount: record.attemptCount,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    payloadHash,
    ...(options.includeSafePayloadJson ? { payloadJson } : {}),
    ...(auditHash ? { auditHash } : {}),
    rawPrivateMaterialStored: false,
  };
}
