import {
  listCloudDbConnectorProfiles,
  type CloudDbConnectorProfile,
  type CloudDbProviderFamily,
  type CloudDbProviderId,
} from './cloudDbIntegration';

export const DATABASE_ADAPTER_COMPATIBILITY_VERSION = 'database-adapter-compatibility-v1';

export type DatabaseAdapterId = CloudDbProviderId | 'memory' | 'sqlite';

export type DatabaseAdapterStatus =
  | 'runtime-ledger-adapter'
  | 'postgres-compatible-runtime-adapter'
  | 'planned-runtime-adapter'
  | 'connector-plan-only'
  | 'cache-only'
  | 'object-storage-export'
  | 'webhook-dispatch';

export type DatabaseLedgerStoreMode = 'memory' | 'sqlite' | 'postgres' | 'redis' | 'mongodb';

export type DatabaseAdapterCompatibilityRecord = {
  id: DatabaseAdapterId;
  label: string;
  family: CloudDbProviderFamily | 'embedded-db' | 'memory';
  status: DatabaseAdapterStatus;
  runtimeLedgerStoreMode?: DatabaseLedgerStoreMode;
  addressResolutionLedger: boolean;
  cloudDbConnectorPlan: boolean;
  encryptedAoidSync: boolean;
  plaintextAoidAllowed: false;
  recommendedFor: string[];
  notRecommendedFor: string[];
  requiredEnvVars: string[];
  schemaRefs: string[];
  privacyControls: string[];
  nextSteps: string[];
};

export type DatabaseAdapterCompatibilitySummary = {
  modelVersion: string;
  totalAdapters: number;
  runtimeLedgerAdapters: DatabaseAdapterId[];
  postgresCompatibleRuntimeAdapters: DatabaseAdapterId[];
  plannedRuntimeAdapters: DatabaseAdapterId[];
  connectorPlanOnlyAdapters: DatabaseAdapterId[];
  cacheOnlyAdapters: DatabaseAdapterId[];
  objectStorageExportAdapters: DatabaseAdapterId[];
  webhookAdapters: DatabaseAdapterId[];
  plaintextAoidAllowed: false;
};

export type DatabaseAdapterCompatibilityValidation = {
  valid: boolean;
  errors: string[];
  runtimeLedgerStoreModes: DatabaseLedgerStoreMode[];
  cloudDbConnectorProfileCoverage: CloudDbProviderId[];
};

const commonPrivacyControls = [
  'no-plaintext-aoid-storage',
  'no-recipient-phone-room-or-delivery-instruction-columns',
  'commitments-or-owner-encrypted-envelopes-only',
  'provider-secrets-from-environment-or-secret-manager',
];

const runtimeLedgerPrivacyControls = [
  ...commonPrivacyControls,
  'append-only-event-log-for-auditable-state',
  'safe-fingerprints-instead-of-raw-address-material',
];

const MANUAL_DATABASE_ADAPTER_COMPATIBILITY: DatabaseAdapterCompatibilityRecord[] = [
  {
    id: 'memory',
    label: 'In-memory local store',
    family: 'memory',
    status: 'runtime-ledger-adapter',
    runtimeLedgerStoreMode: 'memory',
    addressResolutionLedger: true,
    cloudDbConnectorPlan: false,
    encryptedAoidSync: false,
    plaintextAoidAllowed: false,
    recommendedFor: ['unit tests', 'ephemeral demos', 'offline prototypes'],
    notRecommendedFor: ['multi-server production', 'durable revocation state', 'long-lived audit evidence'],
    requiredEnvVars: [],
    schemaRefs: [],
    privacyControls: runtimeLedgerPrivacyControls,
    nextSteps: ['Use SQLite, Postgres, Redis, or MongoDB for durable deployments.'],
  },
  {
    id: 'sqlite',
    label: 'SQLite',
    family: 'embedded-db',
    status: 'runtime-ledger-adapter',
    runtimeLedgerStoreMode: 'sqlite',
    addressResolutionLedger: true,
    cloudDbConnectorPlan: false,
    encryptedAoidSync: false,
    plaintextAoidAllowed: false,
    recommendedFor: ['single-node server', 'desktop app', 'offline POS cache', 'development fixtures'],
    notRecommendedFor: ['high-write multi-node clusters', 'shared mutable cloud ledgers'],
    requiredEnvVars: ['AGID_ADDRESS_LEDGER_SQLITE_PATH'],
    schemaRefs: [
      'db/address-resolution-ledger.sqlite.sql',
      'db/agid-registry.sqlite.sql',
      'db/spatial-address-index.sqlite.sql',
      'db/address-offline-sync-crdt.sqlite.sql',
      'db/postal-source-evidence-registry.sqlite.sql',
    ],
    privacyControls: runtimeLedgerPrivacyControls,
    nextSteps: ['Enable WAL and scheduled backups for production-like local deployments.'],
  },
  {
    id: 'postgres',
    label: 'PostgreSQL',
    family: 'relational-db',
    status: 'runtime-ledger-adapter',
    runtimeLedgerStoreMode: 'postgres',
    addressResolutionLedger: true,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['multi-server production ledger', 'temporal address history', 'audit metadata', 'spatial indexes'],
    notRecommendedFor: ['raw AOID private payload storage', 'unredacted delivery history'],
    requiredEnvVars: ['AGID_ADDRESS_LEDGER_POSTGRES_URL', 'DATABASE_URL'],
    schemaRefs: [
      'db/address-resolution-ledger.postgres.sql',
      'db/agid-registry.postgres.sql',
      'db/spatial-address-index.postgres.sql',
      'db/address-offline-sync-crdt.postgres.sql',
      'db/postal-source-evidence-registry.postgres.sql',
    ],
    privacyControls: runtimeLedgerPrivacyControls,
    nextSteps: ['Add provider-specific SSL and migration orchestration for managed Postgres environments.'],
  },
  {
    id: 'neon-postgres',
    label: 'Neon Postgres',
    family: 'relational-db',
    status: 'postgres-compatible-runtime-adapter',
    runtimeLedgerStoreMode: 'postgres',
    addressResolutionLedger: true,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['serverless Postgres deployments', 'address verification cache', 'audit metadata'],
    notRecommendedFor: ['latency-sensitive offline POS without local cache', 'plaintext AOID sync'],
    requiredEnvVars: ['NEON_DATABASE_URL'],
    schemaRefs: [
      'db/address-resolution-ledger.postgres.sql',
      'db/agid-registry.postgres.sql',
      'db/spatial-address-index.postgres.sql',
      'db/address-offline-sync-crdt.postgres.sql',
      'db/postal-source-evidence-registry.postgres.sql',
    ],
    privacyControls: runtimeLedgerPrivacyControls,
    nextSteps: ['Map NEON_DATABASE_URL into the Postgres ledger adapter and measure cold-start p95/p99.'],
  },
  {
    id: 'supabase',
    label: 'Supabase Postgres',
    family: 'relational-db',
    status: 'postgres-compatible-runtime-adapter',
    runtimeLedgerStoreMode: 'postgres',
    addressResolutionLedger: true,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['Postgres-backed admin tools', 'RLS-backed metadata views', 'address verification cache'],
    notRecommendedFor: ['browser-readable AOID tables', 'service-role keys in clients'],
    requiredEnvVars: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    schemaRefs: [
      'db/address-resolution-ledger.postgres.sql',
      'db/agid-registry.postgres.sql',
      'db/spatial-address-index.postgres.sql',
      'db/address-offline-sync-crdt.postgres.sql',
      'db/postal-source-evidence-registry.postgres.sql',
    ],
    privacyControls: [...runtimeLedgerPrivacyControls, 'row-level-security-denies-private-aoid-fields'],
    nextSteps: ['Add Supabase migration notes and denied plaintext AOID RLS fixtures.'],
  },
  {
    id: 'redis',
    label: 'Redis or compatible KV cache',
    family: 'kv-cache',
    status: 'runtime-ledger-adapter',
    runtimeLedgerStoreMode: 'redis',
    addressResolutionLedger: true,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: false,
    plaintextAoidAllowed: false,
    recommendedFor: ['high-throughput cache', 'short-lived nullifier cache', 'rate-limit state', 'read-through address lookup'],
    notRecommendedFor: ['only copy of revocation state', 'only copy of proof registry', 'long-term legal audit archive'],
    requiredEnvVars: ['AGID_ADDRESS_LEDGER_REDIS_URL', 'REDIS_URL'],
    schemaRefs: [],
    privacyControls: [...runtimeLedgerPrivacyControls, 'cache-ttl-required-for-sensitive-derived-state'],
    nextSteps: ['Pair Redis with Postgres or MongoDB when the state must be durable and replayable.'],
  },
  {
    id: 'mongodb',
    label: 'MongoDB',
    family: 'document-db',
    status: 'runtime-ledger-adapter',
    runtimeLedgerStoreMode: 'mongodb',
    addressResolutionLedger: true,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['document-shaped evidence', 'commitment-only audit events', 'flexible address source metadata'],
    notRecommendedFor: ['schema-free private AOID documents', 'unvalidated arbitrary field ingestion'],
    requiredEnvVars: ['AGID_ADDRESS_LEDGER_MONGODB_URL', 'MONGODB_URI'],
    schemaRefs: ['db/address-resolution-ledger.mongodb.md'],
    privacyControls: [...runtimeLedgerPrivacyControls, 'json-schema-validation-blocks-private-fields'],
    nextSteps: ['Add deployment fixtures for MongoDB Atlas and local replica-set transaction behavior.'],
  },
  {
    id: 'mysql',
    label: 'MySQL or MariaDB',
    family: 'relational-db',
    status: 'planned-runtime-adapter',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['legacy enterprise environments', 'address verification cache', 'metadata-only audit mirrors'],
    notRecommendedFor: ['primary ledger until migrations and transaction tests exist'],
    requiredEnvVars: ['MYSQL_DATABASE_URL'],
    schemaRefs: [],
    privacyControls: commonPrivacyControls,
    nextSteps: ['Create MySQL migrations for event log, records, cache, nullifier, and revocation tables.'],
  },
  {
    id: 'cloudflare-d1',
    label: 'Cloudflare D1',
    family: 'relational-db',
    status: 'planned-runtime-adapter',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['edge SQL cache', 'public AGID lookup tables', 'metadata-only registry mirrors'],
    notRecommendedFor: ['large write-heavy imports until limits are measured', 'private AOID plaintext'],
    requiredEnvVars: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'AGID_D1_DATABASE_ID'],
    schemaRefs: [],
    privacyControls: commonPrivacyControls,
    nextSteps: ['Port SQLite schema to D1-compatible migrations and add bulk-import limit tests.'],
  },
  {
    id: 'firestore',
    label: 'Google Firestore',
    family: 'document-db',
    status: 'planned-runtime-adapter',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['mobile-friendly metadata sync', 'public proof registry snapshots', 'settings sync envelopes'],
    notRecommendedFor: ['private AOID documents without denied-field tests', 'primary ledger before conflict tests'],
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_APPLICATION_CREDENTIALS'],
    schemaRefs: [],
    privacyControls: [...commonPrivacyControls, 'security-rules-deny-plaintext-aoid-fixtures'],
    nextSteps: ['Define collection rules and emulator tests for encrypted-envelope-only AOID sync.'],
  },
  {
    id: 'firebase',
    label: 'Firebase',
    family: 'document-db',
    status: 'planned-runtime-adapter',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['mobile app sync metadata', 'owner-consented encrypted settings', 'device status mirrors'],
    notRecommendedFor: ['client-readable private address state', 'plain recipient or phone data'],
    requiredEnvVars: ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT_JSON'],
    schemaRefs: [],
    privacyControls: [...commonPrivacyControls, 'client-rules-deny-private-address-fields'],
    nextSteps: ['Add Firebase emulator rules for denied plaintext AOID payloads.'],
  },
  {
    id: 'dynamodb',
    label: 'Amazon DynamoDB',
    family: 'document-db',
    status: 'planned-runtime-adapter',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['high-volume metadata sync', 'audit/event metadata', 'rate-limited edge workloads'],
    notRecommendedFor: ['user-linkable partition keys', 'primary legal audit without stream/export policy'],
    requiredEnvVars: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AGID_DYNAMODB_TABLE'],
    schemaRefs: [],
    privacyControls: [...commonPrivacyControls, 'partition-keys-must-not-contain-agid-or-aoid-secrets'],
    nextSteps: ['Design hash-key strategy, TTL policy, and stream-backed audit export.'],
  },
  {
    id: 'cloudflare-kv',
    label: 'Cloudflare KV',
    family: 'kv-cache',
    status: 'cache-only',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: false,
    plaintextAoidAllowed: false,
    recommendedFor: ['edge public AGID cache', 'short-lived verification cache', 'static data-pack pointers'],
    notRecommendedFor: ['revocation-critical state', 'proof bundle registry', 'primary audit ledger'],
    requiredEnvVars: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'AGID_KV_NAMESPACE_ID'],
    schemaRefs: [],
    privacyControls: [...commonPrivacyControls, 'eventual-consistency-warning-required'],
    nextSteps: ['Use KV behind read-through cache policy and pair with a durable ledger for critical state.'],
  },
  {
    id: 'aws-s3',
    label: 'Amazon S3',
    family: 'object-storage',
    status: 'object-storage-export',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['append-only audit exports', 'public AGID data packs', 'encrypted AOID envelope backup'],
    notRecommendedFor: ['mutable primary ledger', 'hot revocation lookups'],
    requiredEnvVars: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AGID_CLOUD_BUCKET'],
    schemaRefs: [],
    privacyControls: [...commonPrivacyControls, 'object-lock-or-versioning-for-audit-exports'],
    nextSteps: ['Add object manifest signing and checksum verification for exported data packs.'],
  },
  {
    id: 's3-compatible',
    label: 'S3-compatible storage',
    family: 'object-storage',
    status: 'object-storage-export',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['MinIO deployments', 'offline export/import', 'portable encrypted envelope backups'],
    notRecommendedFor: ['primary mutable ledger', 'unverified TLS or retention behavior'],
    requiredEnvVars: ['S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'AGID_CLOUD_BUCKET'],
    schemaRefs: [],
    privacyControls: [...commonPrivacyControls, 'provider-tls-and-retention-reviewed'],
    nextSteps: ['Add compatibility tests for MinIO and chosen S3-compatible providers.'],
  },
  {
    id: 'cloudflare-r2',
    label: 'Cloudflare R2',
    family: 'object-storage',
    status: 'object-storage-export',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['public AGID data packs', 'encrypted AOID envelope backup', 'edge-adjacent caches'],
    notRecommendedFor: ['primary mutable ledger', 'revocation-critical state'],
    requiredEnvVars: ['CLOUDFLARE_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'AGID_R2_BUCKET'],
    schemaRefs: [],
    privacyControls: [...commonPrivacyControls, 'workers-bindings-and-tokens-outside-source'],
    nextSteps: ['Add signed manifest and lifecycle rules for public data-pack publication.'],
  },
  {
    id: 'google-cloud-storage',
    label: 'Google Cloud Storage',
    family: 'object-storage',
    status: 'object-storage-export',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['official-source mirrors', 'audit exports', 'encrypted envelope backup'],
    notRecommendedFor: ['primary mutable ledger', 'plaintext private payload storage'],
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_APPLICATION_CREDENTIALS', 'AGID_GCS_BUCKET'],
    schemaRefs: [],
    privacyControls: [...commonPrivacyControls, 'bucket-limited-service-account'],
    nextSteps: ['Add bucket policy and checksum manifest tests.'],
  },
  {
    id: 'azure-blob',
    label: 'Azure Blob Storage',
    family: 'object-storage',
    status: 'object-storage-export',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['enterprise encrypted exports', 'regional public data packs', 'audit snapshots'],
    notRecommendedFor: ['primary mutable ledger', 'long-lived broad SAS tokens'],
    requiredEnvVars: ['AZURE_STORAGE_ACCOUNT', 'AZURE_STORAGE_CONTAINER', 'AZURE_STORAGE_SAS_TOKEN'],
    schemaRefs: [],
    privacyControls: [...commonPrivacyControls, 'short-lived-sas-or-managed-identity'],
    nextSteps: ['Add Key Vault and immutable blob policy notes.'],
  },
  {
    id: 'custom-http-webhook',
    label: 'Custom HTTPS webhook',
    family: 'webhook',
    status: 'webhook-dispatch',
    addressResolutionLedger: false,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: true,
    plaintextAoidAllowed: false,
    recommendedFor: ['enterprise adapters', 'carrier integration staging', 'private deployment hooks'],
    notRecommendedFor: ['untrusted receivers', 'raw payload relay', 'primary ledger without receiver audit'],
    requiredEnvVars: ['AGID_CLOUD_WEBHOOK_URL', 'AGID_CLOUD_WEBHOOK_SECRET'],
    schemaRefs: [],
    privacyControls: [...commonPrivacyControls, 'webhook-hmac-signature-required'],
    nextSteps: ['Require receiver-side AOID encrypted-envelope validation before accepting jobs.'],
  },
];

const postgresCompatibleGeneratedAdapters = new Set<CloudDbProviderId>([
  'aws-rds-postgres',
  'aws-aurora-postgres',
  'azure-database-postgres',
  'google-cloud-sql-postgres',
  'vercel-postgres',
]);

const plannedRuntimeGeneratedAdapters = new Set<CloudDbProviderId>([
  'cockroachdb',
  'turso',
  'aws-rds-mysql',
  'google-cloud-sql-mysql',
  'planetscale',
  'sql-server',
  'azure-sql',
  'oracle-database',
  'oracle-autonomous-database',
  'oracle-mysql-heatwave',
  'alibaba-cloud-rds',
  'alibaba-cloud-polardb',
  'tencent-cloud-tdsql',
  'huawei-cloud-gaussdb',
  'baidu-ai-cloud-rds',
  'google-cloud-spanner',
  'mongodb-atlas',
  'azure-cosmos-db',
  'oracle-nosql',
  'alibaba-cloud-tablestore',
  'tencentdb-mongodb',
  'couchbase',
  'cassandra',
  'google-cloud-bigtable',
]);

const cacheOnlyGeneratedAdapters = new Set<CloudDbProviderId>([
  'upstash-redis',
  'vercel-kv',
]);

const connectorOnlyGeneratedAdapters = new Set<CloudDbProviderId>([
  'bigquery',
  'snowflake',
  'redshift',
  'databricks',
  'oracle-analytics-cloud',
  'alibaba-cloud-analyticdb',
  'opensearch',
  'elasticsearch',
  'algolia',
  'meilisearch',
  'qdrant',
  'weaviate',
  'pinecone',
  'oracle-netsuite',
  'oracle-blockchain-platform',
  'dingtalk-webhook',
  'feishu-open-platform',
  'wecom-webhook',
]);

function generatedStatusFor(profile: CloudDbConnectorProfile): DatabaseAdapterStatus {
  if (postgresCompatibleGeneratedAdapters.has(profile.id)) return 'postgres-compatible-runtime-adapter';
  if (plannedRuntimeGeneratedAdapters.has(profile.id)) return 'planned-runtime-adapter';
  if (cacheOnlyGeneratedAdapters.has(profile.id)) return 'cache-only';
  if (connectorOnlyGeneratedAdapters.has(profile.id)) return 'connector-plan-only';
  if (profile.family === 'object-storage') return 'object-storage-export';
  if (profile.family === 'kv-cache') return 'cache-only';
  return 'connector-plan-only';
}

function generatedRecommendationsFor(profile: CloudDbConnectorProfile, status: DatabaseAdapterStatus): string[] {
  if (status === 'postgres-compatible-runtime-adapter') {
    return ['managed Postgres runtime ledger', 'address verification cache', 'audit metadata', 'spatial indexes'];
  }
  if (status === 'planned-runtime-adapter') {
    return ['provider-specific metadata mirror', 'address verification cache', 'future runtime adapter work'];
  }
  if (status === 'cache-only') {
    return ['short-lived cache', 'rate-limit state', 'read-through public lookup'];
  }
  if (status === 'object-storage-export') {
    return ['public data-pack export', 'encrypted envelope backup', 'append-only audit snapshots'];
  }
  if (profile.family === 'analytics-warehouse') {
    return ['redacted quality analytics', 'aggregate audit reporting', 'official-source import reports'];
  }
  if (profile.family === 'search-index') {
    return ['public address search index', 'multilingual place-name lookup', 'redacted verification search'];
  }
  if (profile.family === 'vector-db') {
    return ['redacted alias similarity search', 'public place-name matching experiments'];
  }
  return ['safe connector planning', 'metadata-only integration staging'];
}

function generatedWarningsFor(profile: CloudDbConnectorProfile, status: DatabaseAdapterStatus): string[] {
  if (status === 'postgres-compatible-runtime-adapter') {
    return ['provider-specific connection pooling and p95/p99 latency are not yet benchmarked'];
  }
  if (status === 'planned-runtime-adapter') {
    return ['primary ledger use before migrations, transactions, and denied-private-field tests exist'];
  }
  if (status === 'cache-only') {
    return ['only copy of revocation state', 'only copy of proof registry', 'long-lived private state'];
  }
  if (status === 'object-storage-export') {
    return ['mutable primary ledger', 'hot revocation lookups'];
  }
  if (profile.family === 'analytics-warehouse') {
    return ['private address analytics export', 'owner-linkable history analysis', 'primary ledger storage'];
  }
  if (profile.family === 'search-index') {
    return ['indexing private address fields', 'AOID encrypted sync', 'revocation authority'];
  }
  if (profile.family === 'vector-db') {
    return ['raw address embeddings', 'owner-linkable vector metadata', 'AOID encrypted sync'];
  }
  return ['private payload relay without receiver audit'];
}

function generatedSchemaRefs(status: DatabaseAdapterStatus): string[] {
  if (status === 'postgres-compatible-runtime-adapter') {
    return [
      'db/address-resolution-ledger.postgres.sql',
      'db/agid-registry.postgres.sql',
      'db/spatial-address-index.postgres.sql',
      'db/address-offline-sync-crdt.postgres.sql',
      'db/postal-source-evidence-registry.postgres.sql',
    ];
  }
  return [];
}

function generatedPrivacyControlsFor(profile: CloudDbConnectorProfile, status: DatabaseAdapterStatus): string[] {
  const controls = status === 'postgres-compatible-runtime-adapter'
    ? runtimeLedgerPrivacyControls
    : commonPrivacyControls;
  const extraControls: string[] = [];
  if (profile.family === 'analytics-warehouse') {
    extraControls.push('aggregate-or-redacted-analytics-only');
  }
  if (profile.family === 'search-index') {
    extraControls.push('public-or-redacted-index-fields-only');
  }
  if (profile.family === 'vector-db') {
    extraControls.push('no-raw-address-embeddings');
  }
  if (status === 'cache-only') {
    extraControls.push('ttl-required-for-sensitive-derived-state');
  }
  return Array.from(new Set([...controls, ...extraControls]));
}

function generatedNextStepsFor(profile: CloudDbConnectorProfile, status: DatabaseAdapterStatus): string[] {
  if (status === 'postgres-compatible-runtime-adapter') {
    return [`Map ${profile.requiredEnvVars[0]} into the Postgres ledger adapter and benchmark connection pooling, p95, and p99.`];
  }
  if (status === 'planned-runtime-adapter') {
    return [`Create ${profile.label} migrations or schema contracts before claiming primary ledger support.`];
  }
  if (status === 'cache-only') {
    return ['Pair cache-only state with SQLite, Postgres, MongoDB, or an append-only audit ledger for critical state.'];
  }
  if (status === 'object-storage-export') {
    return ['Add signed manifest, checksum verification, and retention policy tests for exported objects.'];
  }
  if (profile.family === 'analytics-warehouse') {
    return ['Add export jobs that emit only aggregate or commitment-safe rows and test private-field redaction.'];
  }
  if (profile.family === 'search-index') {
    return ['Add index mappers that reject private address fields and high-risk precise location records.'];
  }
  if (profile.family === 'vector-db') {
    return ['Add embedding redaction tests and consent gates before enabling vector ingestion.'];
  }
  return ['Implement provider-specific dispatch behind the existing CloudDbConnectorPlan contract.'];
}

function buildGeneratedCompatibilityRecord(profile: CloudDbConnectorProfile): DatabaseAdapterCompatibilityRecord {
  const status = generatedStatusFor(profile);
  const postgresCompatible = status === 'postgres-compatible-runtime-adapter';
  return {
    id: profile.id,
    label: profile.label,
    family: profile.family,
    status,
    ...(postgresCompatible ? { runtimeLedgerStoreMode: 'postgres' as const } : {}),
    addressResolutionLedger: postgresCompatible,
    cloudDbConnectorPlan: true,
    encryptedAoidSync: profile.capabilities.encryptedAoidSync,
    plaintextAoidAllowed: false,
    recommendedFor: generatedRecommendationsFor(profile, status),
    notRecommendedFor: generatedWarningsFor(profile, status),
    requiredEnvVars: postgresCompatible
      ? Array.from(new Set(['AGID_ADDRESS_LEDGER_POSTGRES_URL', ...profile.requiredEnvVars]))
      : [...profile.requiredEnvVars],
    schemaRefs: generatedSchemaRefs(status),
    privacyControls: generatedPrivacyControlsFor(profile, status),
    nextSteps: generatedNextStepsFor(profile, status),
  };
}

function buildDatabaseAdapterCompatibility(): DatabaseAdapterCompatibilityRecord[] {
  const manualIds = new Set(MANUAL_DATABASE_ADAPTER_COMPATIBILITY.map(record => record.id));
  const generatedRecords = listCloudDbConnectorProfiles()
    .filter(profile => !manualIds.has(profile.id))
    .map(buildGeneratedCompatibilityRecord);
  return [...MANUAL_DATABASE_ADAPTER_COMPATIBILITY, ...generatedRecords];
}

const DATABASE_ADAPTER_COMPATIBILITY = buildDatabaseAdapterCompatibility();

const profileIds = () => listCloudDbConnectorProfiles().map(profile => profile.id);

function cloneRecord(record: DatabaseAdapterCompatibilityRecord): DatabaseAdapterCompatibilityRecord {
  return {
    ...record,
    recommendedFor: [...record.recommendedFor],
    notRecommendedFor: [...record.notRecommendedFor],
    requiredEnvVars: [...record.requiredEnvVars],
    schemaRefs: [...record.schemaRefs],
    privacyControls: [...record.privacyControls],
    nextSteps: [...record.nextSteps],
  };
}

function idsWithStatus(status: DatabaseAdapterStatus) {
  return DATABASE_ADAPTER_COMPATIBILITY
    .filter(record => record.status === status)
    .map(record => record.id);
}

export function listDatabaseAdapterCompatibility() {
  return DATABASE_ADAPTER_COMPATIBILITY.map(cloneRecord);
}

export function getDatabaseAdapterCompatibility(adapterId: string) {
  const normalized = adapterId.trim().toLowerCase();
  const record = DATABASE_ADAPTER_COMPATIBILITY.find(candidate => candidate.id === normalized);
  return record ? cloneRecord(record) : undefined;
}

export function summarizeDatabaseAdapterCompatibility(): DatabaseAdapterCompatibilitySummary {
  return {
    modelVersion: DATABASE_ADAPTER_COMPATIBILITY_VERSION,
    totalAdapters: DATABASE_ADAPTER_COMPATIBILITY.length,
    runtimeLedgerAdapters: DATABASE_ADAPTER_COMPATIBILITY
      .filter(record => record.status === 'runtime-ledger-adapter')
      .map(record => record.id),
    postgresCompatibleRuntimeAdapters: idsWithStatus('postgres-compatible-runtime-adapter'),
    plannedRuntimeAdapters: idsWithStatus('planned-runtime-adapter'),
    connectorPlanOnlyAdapters: idsWithStatus('connector-plan-only'),
    cacheOnlyAdapters: idsWithStatus('cache-only'),
    objectStorageExportAdapters: idsWithStatus('object-storage-export'),
    webhookAdapters: idsWithStatus('webhook-dispatch'),
    plaintextAoidAllowed: false,
  };
}

export function validateDatabaseAdapterCompatibility(): DatabaseAdapterCompatibilityValidation {
  const errors: string[] = [];
  const profileIdSet = new Set<CloudDbProviderId>(profileIds());
  const recordIds = new Set<DatabaseAdapterId>();
  const coveredProfileIds = new Set<CloudDbProviderId>();
  const runtimeModes = new Set<DatabaseLedgerStoreMode>();

  for (const record of DATABASE_ADAPTER_COMPATIBILITY) {
    if (recordIds.has(record.id)) errors.push(`duplicate-database-adapter:${record.id}`);
    recordIds.add(record.id);

    if (record.plaintextAoidAllowed !== false) {
      errors.push(`plaintext-aoid-must-remain-forbidden:${record.id}`);
    }
    if (record.privacyControls.length === 0) {
      errors.push(`missing-privacy-controls:${record.id}`);
    }
    if (record.runtimeLedgerStoreMode) {
      runtimeModes.add(record.runtimeLedgerStoreMode);
      if (!record.addressResolutionLedger) {
        errors.push(`runtime-ledger-mode-without-ledger-support:${record.id}`);
      }
    }
    if (record.cloudDbConnectorPlan) {
      if (record.id === 'memory' || record.id === 'sqlite') {
        errors.push(`local-only-adapter-should-not-use-cloud-plan:${record.id}`);
      } else if (!profileIdSet.has(record.id as CloudDbProviderId)) {
        errors.push(`missing-cloud-db-profile:${record.id}`);
      } else {
        coveredProfileIds.add(record.id as CloudDbProviderId);
      }
    }
    if (record.status === 'cache-only' && record.addressResolutionLedger) {
      errors.push(`cache-only-adapter-cannot-be-primary-ledger:${record.id}`);
    }
  }

  for (const profileId of profileIdSet) {
    if (!recordIds.has(profileId)) errors.push(`missing-database-compatibility-record:${profileId}`);
  }

  for (const requiredMode of ['memory', 'sqlite', 'postgres', 'redis', 'mongodb'] as const) {
    if (!runtimeModes.has(requiredMode)) errors.push(`missing-runtime-ledger-store-mode:${requiredMode}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    runtimeLedgerStoreModes: Array.from(runtimeModes).sort(),
    cloudDbConnectorProfileCoverage: Array.from(coveredProfileIds).sort(),
  };
}
