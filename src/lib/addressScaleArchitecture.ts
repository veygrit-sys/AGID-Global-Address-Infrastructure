import { addressConnectPrivateMaterialPaths } from './addressConnect';
import {
  summarizeDatabaseAdapterCompatibility,
  type DatabaseLedgerStoreMode,
} from './databaseAdapterCompatibility';
import { sha256Hex } from './sha256';

export const ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION = 'agid-address-scale-architecture-v1';

export const ADDRESS_SCALE_WORKLOADS = [
  'address-resolution',
  'webhook-dispatch',
  'pos-handoff',
  'shipping-label',
  'credential-revocation',
  'audit-report',
  'address-feedback-learning',
] as const;

export const ADDRESS_SCALE_STORE_ROLES = [
  'primary-ledger',
  'read-through-cache',
  'document-evidence',
  'search-index',
  'offline-cache',
  'audit-archive',
] as const;

export const ADDRESS_BULK_JOB_KINDS = [
  'resolve-addresses',
  'verify-addresses',
  'dispatch-webhooks',
  'rebuild-materialized-view',
  'replay-event-log',
  'sync-offline-pos',
  'export-audit-bundle',
  'train-feedback-model',
] as const;

export const ADDRESS_CACHE_CLASSES = [
  'public-agid',
  'address-verification',
  'nullifier-used',
  'revocation-freshness',
  'issuer-trust',
  'terminal-session',
  'trade-compliance',
] as const;

export type AddressScaleWorkloadKind = (typeof ADDRESS_SCALE_WORKLOADS)[number];
export type AddressScaleStoreRole = (typeof ADDRESS_SCALE_STORE_ROLES)[number];
export type AddressBulkJobKind = (typeof ADDRESS_BULK_JOB_KINDS)[number];
export type AddressCacheClass = (typeof ADDRESS_CACHE_CLASSES)[number];
export type AddressScaleStatus = 'ready' | 'attention' | 'blocked';

export type AddressScaleTopologyInput = {
  generatedAt?: unknown;
  workload?: unknown;
  expectedDailyEvents?: unknown;
  peakEventsPerSecond?: unknown;
  multiServer?: unknown;
  offlinePos?: unknown;
  highRiskMode?: unknown;
  requireDurableAudit?: unknown;
  requireFlexibleEvidence?: unknown;
  requireSpatialQuery?: unknown;
  requireLowLatency?: unknown;
  preferredStores?: unknown;
  cacheClasses?: unknown;
};

export type AddressScaleStorePlan = {
  role: AddressScaleStoreRole;
  adapter: DatabaseLedgerStoreMode;
  required: boolean;
  purpose: string;
  consistency: 'strong' | 'eventual' | 'local';
  recommendedFor: string[];
  notFor: string[];
  envVars: string[];
  privacyControls: string[];
};

export type AddressBulkJobPlan = {
  kind: AddressBulkJobKind;
  enabled: boolean;
  purpose: string;
  preferredQueue: 'postgres-outbox' | 'redis-stream' | 'local-durable-queue';
  durableState: DatabaseLedgerStoreMode;
  idempotencyKey: string;
  batchSize: number;
  maxConcurrency: number;
  retry: {
    maxAttempts: number;
    deadLetterRequired: boolean;
    poisonQueue: 'required';
  };
};

export type AddressCachePolicy = {
  class: AddressCacheClass;
  ttlSeconds: number;
  staleWhileRevalidateSeconds: number;
  backingStore: DatabaseLedgerStoreMode;
  keyMaterial: 'commitment-or-public-id-only';
  invalidatedBy: string[];
  highRiskOverride?: {
    ttlSeconds: number;
    rawPayloadCache: false;
  };
};

export type AddressScaleTopologyPlan = {
  modelVersion: typeof ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION;
  generatedAt: string;
  accepted: boolean;
  status: AddressScaleStatus;
  workload: AddressScaleWorkloadKind;
  expectedDailyEvents: number;
  peakEventsPerSecond: number;
  topology: {
    mode: 'single-node' | 'multi-server' | 'offline-first' | 'high-risk';
    primaryLedger: DatabaseLedgerStoreMode;
    hotCache: DatabaseLedgerStoreMode | null;
    documentEvidence: DatabaseLedgerStoreMode | null;
    offlineStore: DatabaseLedgerStoreMode | null;
  };
  stores: AddressScaleStorePlan[];
  bulk: {
    workerCount: number;
    defaultBatchSize: number;
    backpressure: 'pause-at-queue-depth' | 'rate-limit-and-shed-noncritical-work';
    idempotencyKeysRequired: true;
    deadLetterRequired: true;
    jobs: AddressBulkJobPlan[];
  };
  cache: {
    redisRecommended: boolean;
    stampedeProtection: 'singleflight-locks';
    invalidation: string[];
    policies: AddressCachePolicy[];
  };
  indexes: {
    postgres: string[];
    redis: string[];
    mongodb: string[];
  };
  operations: {
    eventSourcing: 'append-only-ledger';
    cqrs: 'write-ledger-read-models';
    queue: 'outbox-plus-worker';
    materializedViews: string[];
    migration: string[];
  };
  privacy: {
    rawPayloadStorage: false;
    rawAddressStorage: false;
    rawAgidStorage: false;
    rawAoidStorage: false;
    cacheStoresRawPayload: false;
    plaintextAoidAllowed: false;
  };
  warnings: string[];
  errors: string[];
  planRoot: string;
};

const PRIVACY: AddressScaleTopologyPlan['privacy'] = {
  rawPayloadStorage: false,
  rawAddressStorage: false,
  rawAgidStorage: false,
  rawAoidStorage: false,
  cacheStoresRawPayload: false,
  plaintextAoidAllowed: false,
};

const STORE_ENV: Record<DatabaseLedgerStoreMode, string[]> = {
  memory: [],
  sqlite: ['AGID_ADDRESS_LEDGER_SQLITE_PATH'],
  postgres: ['AGID_ADDRESS_LEDGER_POSTGRES_URL', 'DATABASE_URL'],
  redis: ['AGID_ADDRESS_LEDGER_REDIS_URL', 'REDIS_URL'],
  mongodb: ['AGID_ADDRESS_LEDGER_MONGODB_URL', 'MONGODB_URI'],
};

const STORE_PRIVACY: Record<DatabaseLedgerStoreMode, string[]> = {
  memory: ['ephemeral-only', 'no-production-private-material'],
  sqlite: ['wal-mode', 'owner-encrypted-local-cache', 'no-plaintext-aoid-storage'],
  postgres: ['append-only-event-log', 'commitment-only-columns', 'row-level-access-for-operator-views'],
  redis: ['ttl-required', 'commitment-only-keys', 'not-a-durable-source-of-truth'],
  mongodb: ['json-schema-validation', 'commitment-only-evidence-documents', 'field-denylist-for-private-material'],
};

const CACHE_TTLS: Record<AddressCacheClass, { ttl: number; swr: number; invalidatedBy: string[] }> = {
  'public-agid': {
    ttl: 86_400,
    swr: 21_600,
    invalidatedBy: ['agid-zone-rule-change', 'grid-version-change'],
  },
  'address-verification': {
    ttl: 21_600,
    swr: 3_600,
    invalidatedBy: ['postal-source-update', 'country-format-update', 'manual-review-decision'],
  },
  'nullifier-used': {
    ttl: 300,
    swr: 0,
    invalidatedBy: ['nullifier-commit', 'offline-sync-conflict', 'registry-replay'],
  },
  'revocation-freshness': {
    ttl: 120,
    swr: 30,
    invalidatedBy: ['revocation-root-update', 'issuer-suspension'],
  },
  'issuer-trust': {
    ttl: 600,
    swr: 120,
    invalidatedBy: ['issuer-registry-update', 'trust-root-update'],
  },
  'terminal-session': {
    ttl: 300,
    swr: 0,
    invalidatedBy: ['staff-role-change', 'terminal-key-rotation', 'terminal-suspension'],
  },
  'trade-compliance': {
    ttl: 86_400,
    swr: 21_600,
    invalidatedBy: ['tariff-data-update', 'hs-code-data-update', 'currency-rate-update'],
  },
};

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(',')}}`;
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanBoolean(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function cleanNumber(value: unknown, fallback: number, max: number) {
  const parsed = typeof value === 'number' ? value : Number(cleanString(value));
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(Math.round(parsed), max);
}

function cleanEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const cleaned = cleanString(value) as T;
  return allowed.includes(cleaned) ? cleaned : fallback;
}

function cleanStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(cleanString).filter(Boolean);
  const text = cleanString(value);
  return text ? [text] : [];
}

function cleanStoreModes(value: unknown): DatabaseLedgerStoreMode[] {
  const allowed: DatabaseLedgerStoreMode[] = ['memory', 'sqlite', 'postgres', 'redis', 'mongodb'];
  return Array.from(new Set(cleanStringArray(value).filter((item): item is DatabaseLedgerStoreMode => {
    return allowed.includes(item as DatabaseLedgerStoreMode);
  })));
}

function cleanCacheClasses(value: unknown, workload: AddressScaleWorkloadKind): AddressCacheClass[] {
  const selected = cleanStringArray(value).filter((item): item is AddressCacheClass => {
    return ADDRESS_CACHE_CLASSES.includes(item as AddressCacheClass);
  });
  if (selected.length > 0) return Array.from(new Set(selected));

  if (workload === 'webhook-dispatch') return ['issuer-trust', 'revocation-freshness', 'terminal-session'];
  if (workload === 'shipping-label') return ['address-verification', 'public-agid', 'trade-compliance'];
  if (workload === 'credential-revocation') return ['revocation-freshness', 'issuer-trust', 'nullifier-used'];
  if (workload === 'address-feedback-learning') return ['address-verification', 'public-agid'];
  return ['public-agid', 'address-verification', 'revocation-freshness', 'issuer-trust'];
}

function needsPostgres(input: {
  multiServer: boolean;
  requireDurableAudit: boolean;
  requireSpatialQuery: boolean;
  peakEventsPerSecond: number;
  workload: AddressScaleWorkloadKind;
}) {
  return input.multiServer
    || input.requireDurableAudit
    || input.requireSpatialQuery
    || input.peakEventsPerSecond >= 20
    || input.workload === 'audit-report'
    || input.workload === 'shipping-label';
}

function needsRedis(input: {
  requireLowLatency: boolean;
  peakEventsPerSecond: number;
  workload: AddressScaleWorkloadKind;
  cacheClasses: AddressCacheClass[];
}) {
  return input.requireLowLatency
    || input.peakEventsPerSecond >= 10
    || input.workload === 'webhook-dispatch'
    || input.workload === 'pos-handoff'
    || input.cacheClasses.includes('nullifier-used')
    || input.cacheClasses.includes('terminal-session');
}

function needsMongo(input: {
  requireFlexibleEvidence: boolean;
  workload: AddressScaleWorkloadKind;
}) {
  return input.requireFlexibleEvidence
    || input.workload === 'audit-report'
    || input.workload === 'address-feedback-learning';
}

function chooseWorkerCount(peakEventsPerSecond: number, highRiskMode: boolean) {
  const base = peakEventsPerSecond >= 500 ? 16 : peakEventsPerSecond >= 100 ? 8 : peakEventsPerSecond >= 20 ? 4 : 2;
  return highRiskMode ? Math.max(1, Math.floor(base / 2)) : base;
}

function chooseBatchSize(peakEventsPerSecond: number, highRiskMode: boolean) {
  if (highRiskMode) return 50;
  if (peakEventsPerSecond >= 500) return 1_000;
  if (peakEventsPerSecond >= 100) return 500;
  return 100;
}

function buildStorePlan(
  role: AddressScaleStoreRole,
  adapter: DatabaseLedgerStoreMode,
  required: boolean,
  purpose: string,
  consistency: AddressScaleStorePlan['consistency'],
  notFor: string[],
): AddressScaleStorePlan {
  return {
    role,
    adapter,
    required,
    purpose,
    consistency,
    recommendedFor: [`${adapter} ${role}`],
    notFor,
    envVars: STORE_ENV[adapter],
    privacyControls: STORE_PRIVACY[adapter],
  };
}

function buildCachePolicies(
  cacheClasses: AddressCacheClass[],
  highRiskMode: boolean,
): AddressCachePolicy[] {
  return cacheClasses.map(cacheClass => {
    const base = CACHE_TTLS[cacheClass];
    const sensitive = cacheClass === 'nullifier-used'
      || cacheClass === 'revocation-freshness'
      || cacheClass === 'terminal-session';
    const highRiskTtl = sensitive ? Math.min(base.ttl, 60) : Math.min(base.ttl, 600);
    return {
      class: cacheClass,
      ttlSeconds: highRiskMode ? highRiskTtl : base.ttl,
      staleWhileRevalidateSeconds: highRiskMode ? 0 : base.swr,
      backingStore: cacheClass === 'trade-compliance' ? 'postgres' : 'redis',
      keyMaterial: 'commitment-or-public-id-only',
      invalidatedBy: base.invalidatedBy,
      ...(highRiskMode ? {
        highRiskOverride: {
          ttlSeconds: highRiskTtl,
          rawPayloadCache: false,
        },
      } : {}),
    };
  });
}

function buildBulkJobs(
  workload: AddressScaleWorkloadKind,
  peakEventsPerSecond: number,
  highRiskMode: boolean,
  offlinePos: boolean,
  useRedis: boolean,
  useMongo: boolean,
): AddressBulkJobPlan[] {
  const workerCount = chooseWorkerCount(peakEventsPerSecond, highRiskMode);
  const batchSize = chooseBatchSize(peakEventsPerSecond, highRiskMode);
  const queue: AddressBulkJobPlan['preferredQueue'] = useRedis
    ? 'redis-stream'
    : offlinePos
      ? 'local-durable-queue'
      : 'postgres-outbox';

  const job = (
    kind: AddressBulkJobKind,
    enabled: boolean,
    purpose: string,
    durableState: DatabaseLedgerStoreMode = useMongo && kind === 'export-audit-bundle' ? 'mongodb' : 'postgres',
  ): AddressBulkJobPlan => ({
    kind,
    enabled,
    purpose,
    preferredQueue: kind === 'sync-offline-pos' ? 'local-durable-queue' : queue,
    durableState,
    idempotencyKey: `${kind}:tenant:domain:event`,
    batchSize,
    maxConcurrency: workerCount,
    retry: {
      maxAttempts: highRiskMode ? 3 : 8,
      deadLetterRequired: true,
      poisonQueue: 'required',
    },
  });

  return [
    job('resolve-addresses', ['address-resolution', 'shipping-label'].includes(workload), 'Bulk AGID/address resolution with read-through cache.'),
    job('verify-addresses', ['address-resolution', 'shipping-label', 'audit-report'].includes(workload), 'Postal, country-rule, and reverse-geocode verification batches.'),
    job('dispatch-webhooks', workload === 'webhook-dispatch' || workload === 'pos-handoff', 'Webhook fan-out with retries and signed delivery receipts.'),
    job('rebuild-materialized-view', peakEventsPerSecond >= 20 || workload === 'audit-report', 'CQRS read-model rebuild for terminal dashboards and resolver APIs.'),
    job('replay-event-log', workload === 'audit-report', 'Append-only event replay for audit and incident recovery.'),
    job('sync-offline-pos', offlinePos, 'Deferred POS ledger sync with conflict detection and audit review.'),
    job('export-audit-bundle', workload === 'audit-report' || highRiskMode, 'Redacted evidence bundle export for review and regulator-safe retention.', useMongo ? 'mongodb' : 'postgres'),
    job('train-feedback-model', workload === 'address-feedback-learning', 'Closed feedback learning from redacted corrections and quality labels.', useMongo ? 'mongodb' : 'postgres'),
  ];
}

export function listAddressScaleArchitectureCapabilities() {
  return {
    modelVersion: ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION,
    adapterCompatibility: summarizeDatabaseAdapterCompatibility(),
    workloads: ADDRESS_SCALE_WORKLOADS,
    storeRoles: ADDRESS_SCALE_STORE_ROLES,
    stores: {
      postgres: {
        role: 'primary-ledger',
        useFor: ['append-only ledger', 'temporal history', 'spatial index', 'CQRS read models', 'durable nullifier source'],
        notFor: ['raw address or plaintext AOID storage'],
      },
      redis: {
        role: 'read-through-cache',
        useFor: ['hot cache', 'rate limits', 'short-lived nullifier checks', 'singleflight locks', 'stream queue'],
        notFor: ['only copy of revocation or audit state'],
      },
      mongodb: {
        role: 'document-evidence',
        useFor: ['variable public-source evidence', 'redacted audit bundles', 'feedback metadata'],
        notFor: ['schema-free private address documents'],
      },
    },
    bulkJobs: ADDRESS_BULK_JOB_KINDS,
    cacheClasses: ADDRESS_CACHE_CLASSES,
    privacy: PRIVACY,
  };
}

export function buildAddressScaleTopologyPlan(input: AddressScaleTopologyInput = {}): AddressScaleTopologyPlan {
  const privatePaths = addressConnectPrivateMaterialPaths(input);
  const generatedAt = cleanString(input.generatedAt) || new Date(0).toISOString();
  const workload = cleanEnum(input.workload, ADDRESS_SCALE_WORKLOADS, 'address-resolution');
  const expectedDailyEvents = cleanNumber(input.expectedDailyEvents, 10_000, 1_000_000_000);
  const peakEventsPerSecond = cleanNumber(input.peakEventsPerSecond, 25, 100_000);
  const multiServer = cleanBoolean(input.multiServer) || peakEventsPerSecond >= 20;
  const offlinePos = cleanBoolean(input.offlinePos);
  const highRiskMode = cleanBoolean(input.highRiskMode);
  const requireDurableAudit = cleanBoolean(input.requireDurableAudit) || workload === 'audit-report';
  const requireFlexibleEvidence = cleanBoolean(input.requireFlexibleEvidence);
  const requireSpatialQuery = cleanBoolean(input.requireSpatialQuery) || workload === 'address-resolution';
  const requireLowLatency = cleanBoolean(input.requireLowLatency) || workload === 'pos-handoff';
  const preferredStores = cleanStoreModes(input.preferredStores);
  const cacheClasses = cleanCacheClasses(input.cacheClasses, workload);

  const warnings: string[] = [];
  const errors: string[] = [];
  if (privatePaths.length > 0) {
    errors.push(`private-material-rejected:${privatePaths.join(',')}`);
  }

  const usePostgres = needsPostgres({
    multiServer,
    requireDurableAudit,
    requireSpatialQuery,
    peakEventsPerSecond,
    workload,
  });
  const useRedis = needsRedis({
    requireLowLatency,
    peakEventsPerSecond,
    workload,
    cacheClasses,
  });
  const useMongo = needsMongo({ requireFlexibleEvidence, workload });

  if (preferredStores.length > 0 && usePostgres && !preferredStores.includes('postgres')) {
    warnings.push('postgres-added-as-required-primary-ledger');
  }
  if (preferredStores.length > 0 && useRedis && !preferredStores.includes('redis')) {
    warnings.push('redis-added-for-hot-cache-and-backpressure');
  }
  if (preferredStores.length > 0 && useMongo && !preferredStores.includes('mongodb')) {
    warnings.push('mongodb-added-for-redacted-document-evidence');
  }
  if (preferredStores.includes('redis') && !preferredStores.some(store => store === 'postgres' || store === 'mongodb')) {
    warnings.push('redis-must-not-be-the-only-durable-store');
  }
  if (highRiskMode) {
    warnings.push('high-risk-mode-shortens-cache-ttl-and-disables-raw-payload-cache');
  }

  const stores: AddressScaleStorePlan[] = [];
  stores.push(buildStorePlan(
    'primary-ledger',
    usePostgres ? 'postgres' : 'sqlite',
    true,
    usePostgres
      ? 'Durable append-only address event ledger, temporal state, nullifier source, and spatial/CQRS read models.'
      : 'Single-node durable local ledger for small deployments.',
    usePostgres ? 'strong' : 'local',
    ['raw address payloads', 'plaintext AOID records', 'unredacted delivery history'],
  ));
  if (useRedis) {
    stores.push(buildStorePlan(
      'read-through-cache',
      'redis',
      true,
      'Hot read cache, singleflight locks, stream queue, rate limits, and short-lived nullifier/revocation lookups.',
      'eventual',
      ['only copy of audit state', 'long-term revocation registry', 'private address payload cache'],
    ));
  }
  if (useMongo) {
    stores.push(buildStorePlan(
      'document-evidence',
      'mongodb',
      true,
      'Redacted document-shaped evidence, variable source metadata, feedback labels, and audit bundle envelopes.',
      'eventual',
      ['schema-free private AOID documents', 'unvalidated arbitrary field ingestion'],
    ));
  }
  if (offlinePos) {
    stores.push(buildStorePlan(
      'offline-cache',
      'sqlite',
      true,
      'Local POS queue and CRDT/vector-clock sync ledger for disconnected stores and disaster sites.',
      'local',
      ['shared multi-server truth', 'permanent raw AGID-S or proof code cache'],
    ));
  }

  const workerCount = chooseWorkerCount(peakEventsPerSecond, highRiskMode);
  const defaultBatchSize = chooseBatchSize(peakEventsPerSecond, highRiskMode);
  const cachePolicies = buildCachePolicies(cacheClasses, highRiskMode);
  const jobs = buildBulkJobs(workload, peakEventsPerSecond, highRiskMode, offlinePos, useRedis, useMongo);
  const topologyMode = highRiskMode
    ? 'high-risk'
    : offlinePos
      ? 'offline-first'
      : multiServer
        ? 'multi-server'
        : 'single-node';

  const accepted = errors.length === 0;
  const status: AddressScaleStatus = !accepted ? 'blocked' : warnings.length > 0 ? 'attention' : 'ready';
  const planSeed = {
    modelVersion: ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION,
    workload,
    expectedDailyEvents,
    peakEventsPerSecond,
    topologyMode,
    stores: stores.map(store => `${store.role}:${store.adapter}`),
    cacheClasses,
    jobs: jobs.filter(jobPlan => jobPlan.enabled).map(jobPlan => jobPlan.kind),
    errors,
    warnings,
  };

  return {
    modelVersion: ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION,
    generatedAt,
    accepted,
    status,
    workload,
    expectedDailyEvents,
    peakEventsPerSecond,
    topology: {
      mode: topologyMode,
      primaryLedger: usePostgres ? 'postgres' : 'sqlite',
      hotCache: useRedis ? 'redis' : null,
      documentEvidence: useMongo ? 'mongodb' : null,
      offlineStore: offlinePos ? 'sqlite' : null,
    },
    stores,
    bulk: {
      workerCount,
      defaultBatchSize,
      backpressure: useRedis ? 'rate-limit-and-shed-noncritical-work' : 'pause-at-queue-depth',
      idempotencyKeysRequired: true,
      deadLetterRequired: true,
      jobs,
    },
    cache: {
      redisRecommended: useRedis,
      stampedeProtection: 'singleflight-locks',
      invalidation: Array.from(new Set(cachePolicies.flatMap(policy => policy.invalidatedBy))).sort(),
      policies: cachePolicies,
    },
    indexes: {
      postgres: [
        'btree(event_type, created_at)',
        'btree(domain, commitment)',
        'gist(agid_cell_geometry)',
        'brin(created_at) for append-only event scans',
        'unique(domain, idempotency_key)',
      ],
      redis: [
        'SETEX cache:{class}:{commitment}',
        'SETNX lock:{cache-key} for singleflight',
        'XADD queue:address-bulk for worker fan-out',
        'INCR rate:{tenant}:{operation} with TTL',
      ],
      mongodb: [
        'unique({ evidenceId: 1 })',
        'compound({ tenantId: 1, sourceKind: 1, observedAt: -1 })',
        'ttl({ expiresAt: 1 }) for high-risk redacted bundles',
        'jsonSchema denylist for private address fields',
      ],
    },
    operations: {
      eventSourcing: 'append-only-ledger',
      cqrs: 'write-ledger-read-models',
      queue: 'outbox-plus-worker',
      materializedViews: [
        'address_resolution_current_view',
        'pos_terminal_sync_view',
        'revocation_freshness_view',
        'audit_reverification_view',
      ],
      migration: [
        'schema-first migrations for Postgres and SQLite',
        'Redis keyspace version prefix',
        'MongoDB JSON schema and TTL index migration',
        'backfill jobs are idempotent and replayable',
      ],
    },
    privacy: PRIVACY,
    warnings,
    errors,
    planRoot: sha256Hex(stableJson(planSeed)),
  };
}
