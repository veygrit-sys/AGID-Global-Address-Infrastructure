import type { SyncQueueAction, SyncQueueRecord } from './appDatabase';
import {
  evaluateAgidAoidOperation,
  type AgidAoidGovernanceDecision,
  type AgidAoidLayer,
  type AgidAoidSurface,
} from './agidAoidGovernance';
import { sha256Hex } from './sha256';
import { buildSyncQueueRecord } from './syncQueue';

export const CLOUD_DB_INTEGRATION_MODEL_VERSION = 'cloud-db-integration-v1';

export type CloudDbProviderFamily =
  | 'object-storage'
  | 'relational-db'
  | 'document-db'
  | 'kv-cache'
  | 'analytics-warehouse'
  | 'search-index'
  | 'vector-db'
  | 'enterprise-app'
  | 'blockchain-ledger'
  | 'webhook';

export type CloudDbProviderId =
  | 'aws-s3'
  | 's3-compatible'
  | 'cloudflare-r2'
  | 'google-cloud-storage'
  | 'azure-blob'
  | 'oci-object-storage'
  | 'alibaba-cloud-oss'
  | 'tencent-cloud-cos'
  | 'huawei-cloud-obs'
  | 'baidu-ai-cloud-bos'
  | 'vercel-blob'
  | 'postgres'
  | 'neon-postgres'
  | 'supabase'
  | 'aws-rds-postgres'
  | 'aws-aurora-postgres'
  | 'azure-database-postgres'
  | 'google-cloud-sql-postgres'
  | 'vercel-postgres'
  | 'cockroachdb'
  | 'turso'
  | 'mysql'
  | 'aws-rds-mysql'
  | 'google-cloud-sql-mysql'
  | 'planetscale'
  | 'sql-server'
  | 'azure-sql'
  | 'oracle-database'
  | 'oracle-autonomous-database'
  | 'oracle-mysql-heatwave'
  | 'alibaba-cloud-rds'
  | 'alibaba-cloud-polardb'
  | 'tencent-cloud-tdsql'
  | 'huawei-cloud-gaussdb'
  | 'baidu-ai-cloud-rds'
  | 'google-cloud-spanner'
  | 'mongodb'
  | 'mongodb-atlas'
  | 'firestore'
  | 'firebase'
  | 'dynamodb'
  | 'azure-cosmos-db'
  | 'oracle-nosql'
  | 'alibaba-cloud-tablestore'
  | 'tencentdb-mongodb'
  | 'couchbase'
  | 'cassandra'
  | 'google-cloud-bigtable'
  | 'redis'
  | 'upstash-redis'
  | 'vercel-kv'
  | 'cloudflare-d1'
  | 'cloudflare-kv'
  | 'bigquery'
  | 'snowflake'
  | 'redshift'
  | 'databricks'
  | 'oracle-analytics-cloud'
  | 'alibaba-cloud-analyticdb'
  | 'opensearch'
  | 'elasticsearch'
  | 'algolia'
  | 'meilisearch'
  | 'qdrant'
  | 'weaviate'
  | 'pinecone'
  | 'oracle-netsuite'
  | 'oracle-blockchain-platform'
  | 'dingtalk-webhook'
  | 'feishu-open-platform'
  | 'wecom-webhook'
  | 'custom-http-webhook';

export type CloudDbPurpose =
  | 'public-agid-cache'
  | 'address-verification-cache'
  | 'encrypted-aoid-sync'
  | 'audit-log'
  | 'proof-bundle-registry'
  | 'credential-issuer-registry'
  | 'revocation-freshness-anchor'
  | 'settings-sync';

export type CloudDbStorageMode =
  | 'public-cache'
  | 'address-verification-cache'
  | 'encrypted-envelope'
  | 'metadata-only'
  | 'encrypted-settings';

export type CloudDbConnectorCapabilities = {
  publicAgidCache: boolean;
  addressVerificationCache: boolean;
  encryptedAoidSync: boolean;
  rawAoidPlaintext: false;
  auditLog: boolean;
  proofBundleRegistry: boolean;
  credentialIssuerRegistry: boolean;
  revocationFreshnessAnchors: boolean;
  settingsSync: boolean;
};

export type CloudDbConnectorProfile = {
  id: CloudDbProviderId;
  label: string;
  family: CloudDbProviderFamily;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  capabilities: CloudDbConnectorCapabilities;
  recommendedUse: string[];
  caveats: string[];
};

export type CloudDbRecommendedCollection = {
  name: string;
  stores: string;
  key: string;
  retention: 'cache' | 'append-only' | 'until-revoked' | 'user-controlled';
};

export type CloudDbConnectorPlanInput = {
  providerId: CloudDbProviderId | string;
  purpose: CloudDbPurpose | string;
  layer?: AgidAoidLayer;
  entityType?: SyncQueueRecord['entityType'] | string;
  payload?: unknown;
  ownerConsent?: boolean;
  encryptedAtRest?: boolean;
  encryptedInTransit?: boolean;
  storeRawPayload?: boolean;
  region?: string;
};

export type CloudDbConnectorPlan = {
  modelVersion: string;
  provider: CloudDbConnectorProfile | null;
  purpose: string;
  layer: AgidAoidLayer;
  targetSurface: AgidAoidSurface;
  storageMode: CloudDbStorageMode;
  allowed: boolean;
  requiredEnvVars: string[];
  requiredControls: string[];
  collections: CloudDbRecommendedCollection[];
  governance?: AgidAoidGovernanceDecision;
  errors: string[];
  warnings: string[];
};

export type CloudDbSyncJobInput = CloudDbConnectorPlanInput & {
  entityType: SyncQueueRecord['entityType'] | string;
  entityId: string;
  action: SyncQueueAction | string;
  now?: number;
};

export type CloudDbSyncJob = {
  id: string;
  modelVersion: string;
  providerId: CloudDbProviderId;
  purpose: string;
  destination: {
    family: CloudDbProviderFamily;
    requiredEnvVars: string[];
    region?: string;
  };
  plan: CloudDbConnectorPlan;
  queueRecord: SyncQueueRecord;
  dispatch: {
    mode: 'adapter-contract';
    networkRequestBuilt: false;
    reason: string;
  };
};

const allCapabilities: CloudDbConnectorCapabilities = {
  publicAgidCache: true,
  addressVerificationCache: true,
  encryptedAoidSync: true,
  rawAoidPlaintext: false,
  auditLog: true,
  proofBundleRegistry: true,
  credentialIssuerRegistry: true,
  revocationFreshnessAnchors: true,
  settingsSync: true,
};

const cacheOnlyCapabilities: CloudDbConnectorCapabilities = {
  ...allCapabilities,
  encryptedAoidSync: false,
  proofBundleRegistry: false,
  credentialIssuerRegistry: false,
  revocationFreshnessAnchors: false,
};

const publicMetadataCapabilities: CloudDbConnectorCapabilities = {
  publicAgidCache: true,
  addressVerificationCache: true,
  encryptedAoidSync: false,
  rawAoidPlaintext: false,
  auditLog: true,
  proofBundleRegistry: true,
  credentialIssuerRegistry: true,
  revocationFreshnessAnchors: true,
  settingsSync: false,
};

const analyticsCapabilities: CloudDbConnectorCapabilities = {
  publicAgidCache: true,
  addressVerificationCache: true,
  encryptedAoidSync: false,
  rawAoidPlaintext: false,
  auditLog: true,
  proofBundleRegistry: false,
  credentialIssuerRegistry: false,
  revocationFreshnessAnchors: false,
  settingsSync: false,
};

const searchIndexCapabilities: CloudDbConnectorCapabilities = {
  publicAgidCache: true,
  addressVerificationCache: true,
  encryptedAoidSync: false,
  rawAoidPlaintext: false,
  auditLog: false,
  proofBundleRegistry: false,
  credentialIssuerRegistry: false,
  revocationFreshnessAnchors: false,
  settingsSync: false,
};

const vectorIndexCapabilities: CloudDbConnectorCapabilities = {
  publicAgidCache: false,
  addressVerificationCache: true,
  encryptedAoidSync: false,
  rawAoidPlaintext: false,
  auditLog: false,
  proofBundleRegistry: false,
  credentialIssuerRegistry: false,
  revocationFreshnessAnchors: false,
  settingsSync: false,
};

const enterpriseAppCapabilities: CloudDbConnectorCapabilities = {
  publicAgidCache: false,
  addressVerificationCache: true,
  encryptedAoidSync: false,
  rawAoidPlaintext: false,
  auditLog: true,
  proofBundleRegistry: false,
  credentialIssuerRegistry: false,
  revocationFreshnessAnchors: false,
  settingsSync: false,
};

const publicAnchorCapabilities: CloudDbConnectorCapabilities = {
  publicAgidCache: false,
  addressVerificationCache: false,
  encryptedAoidSync: false,
  rawAoidPlaintext: false,
  auditLog: true,
  proofBundleRegistry: true,
  credentialIssuerRegistry: true,
  revocationFreshnessAnchors: true,
  settingsSync: false,
};

const CLOUD_DB_CONNECTOR_PROFILES: CloudDbConnectorProfile[] = [
  {
    id: 'aws-s3',
    label: 'Amazon S3',
    family: 'object-storage',
    requiredEnvVars: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AGID_CLOUD_BUCKET'],
    optionalEnvVars: ['AGID_CLOUD_PREFIX', 'AWS_KMS_KEY_ID'],
    capabilities: allCapabilities,
    recommendedUse: ['append-only audit exports', 'public AGID data packs', 'encrypted AOID envelope backup'],
    caveats: ['Use KMS or client-side encryption for every private sync object.'],
  },
  {
    id: 's3-compatible',
    label: 'S3-compatible storage',
    family: 'object-storage',
    requiredEnvVars: ['S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'AGID_CLOUD_BUCKET'],
    optionalEnvVars: ['S3_REGION', 'AGID_CLOUD_PREFIX'],
    capabilities: allCapabilities,
    recommendedUse: ['MinIO or other portable object storage', 'offline export/import'],
    caveats: ['Provider TLS, retention, and object-lock behavior must be verified separately.'],
  },
  {
    id: 'cloudflare-r2',
    label: 'Cloudflare R2',
    family: 'object-storage',
    requiredEnvVars: ['CLOUDFLARE_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'AGID_R2_BUCKET'],
    optionalEnvVars: ['AGID_CLOUD_PREFIX'],
    capabilities: allCapabilities,
    recommendedUse: ['public AGID data packs', 'encrypted AOID envelope backup', 'edge-adjacent caches'],
    caveats: ['Treat Workers bindings and access tokens as deployment secrets, never source files.'],
  },
  {
    id: 'google-cloud-storage',
    label: 'Google Cloud Storage',
    family: 'object-storage',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_APPLICATION_CREDENTIALS', 'AGID_GCS_BUCKET'],
    optionalEnvVars: ['AGID_CLOUD_PREFIX', 'GOOGLE_CLOUD_KMS_KEY'],
    capabilities: allCapabilities,
    recommendedUse: ['official-source mirrors', 'audit exports', 'encrypted envelope backup'],
    caveats: ['Service account scope must be bucket-limited.'],
  },
  {
    id: 'azure-blob',
    label: 'Azure Blob Storage',
    family: 'object-storage',
    requiredEnvVars: ['AZURE_STORAGE_ACCOUNT', 'AZURE_STORAGE_CONTAINER', 'AZURE_STORAGE_SAS_TOKEN'],
    optionalEnvVars: ['AZURE_KEY_VAULT_KEY_ID', 'AGID_CLOUD_PREFIX'],
    capabilities: allCapabilities,
    recommendedUse: ['enterprise encrypted exports', 'regional public data packs'],
    caveats: ['Prefer short-lived SAS tokens and managed identities in production.'],
  },
  {
    id: 'oci-object-storage',
    label: 'Oracle Cloud Infrastructure Object Storage',
    family: 'object-storage',
    requiredEnvVars: [
      'OCI_TENANCY_OCID',
      'OCI_USER_OCID',
      'OCI_FINGERPRINT',
      'OCI_PRIVATE_KEY',
      'OCI_REGION',
      'OCI_OBJECT_STORAGE_NAMESPACE',
      'AGID_OCI_BUCKET',
    ],
    optionalEnvVars: ['AGID_CLOUD_PREFIX', 'OCI_KMS_KEY_OCID', 'OCI_COMPARTMENT_OCID'],
    capabilities: allCapabilities,
    recommendedUse: ['public AGID data packs', 'append-only audit exports', 'encrypted AOID envelope backup'],
    caveats: ['Use client-side encryption or OCI KMS for private sync objects and keep bucket policies least-privilege.'],
  },
  {
    id: 'alibaba-cloud-oss',
    label: 'Alibaba Cloud Object Storage Service',
    family: 'object-storage',
    requiredEnvVars: ['ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'ALIBABA_CLOUD_REGION', 'AGID_OSS_BUCKET'],
    optionalEnvVars: ['AGID_CLOUD_PREFIX', 'ALIBABA_CLOUD_KMS_KEY_ID', 'ALIBABA_CLOUD_OSS_ENDPOINT'],
    capabilities: allCapabilities,
    recommendedUse: ['public AGID data packs for China-adjacent deployments', 'append-only audit exports', 'encrypted AOID envelope backup'],
    caveats: ['Use client-side encryption or KMS-backed encryption and keep bucket policies least-privilege.'],
  },
  {
    id: 'tencent-cloud-cos',
    label: 'Tencent Cloud Object Storage',
    family: 'object-storage',
    requiredEnvVars: ['TENCENT_SECRET_ID', 'TENCENT_SECRET_KEY', 'TENCENT_CLOUD_REGION', 'AGID_COS_BUCKET'],
    optionalEnvVars: ['AGID_CLOUD_PREFIX', 'TENCENT_COS_ENDPOINT', 'TENCENT_KMS_KEY_ID'],
    capabilities: allCapabilities,
    recommendedUse: ['regional public data packs', 'audit exports', 'encrypted envelope backups'],
    caveats: ['Use short-lived credentials where possible and never upload plaintext AOID or AGID-S ciphertext intended for restricted sharing.'],
  },
  {
    id: 'huawei-cloud-obs',
    label: 'Huawei Cloud Object Storage Service',
    family: 'object-storage',
    requiredEnvVars: ['HUAWEI_CLOUD_ACCESS_KEY_ID', 'HUAWEI_CLOUD_SECRET_ACCESS_KEY', 'HUAWEI_CLOUD_REGION', 'AGID_OBS_BUCKET'],
    optionalEnvVars: ['AGID_CLOUD_PREFIX', 'HUAWEI_OBS_ENDPOINT', 'HUAWEI_KMS_KEY_ID'],
    capabilities: allCapabilities,
    recommendedUse: ['public AGID data packs', 'official-source mirrors', 'encrypted audit/object exports'],
    caveats: ['Keep private sync objects owner-encrypted before upload and test bucket policy inheritance.'],
  },
  {
    id: 'baidu-ai-cloud-bos',
    label: 'Baidu AI Cloud Object Storage',
    family: 'object-storage',
    requiredEnvVars: ['BAIDU_BCE_ACCESS_KEY_ID', 'BAIDU_BCE_SECRET_ACCESS_KEY', 'BAIDU_BCE_REGION', 'AGID_BOS_BUCKET'],
    optionalEnvVars: ['AGID_CLOUD_PREFIX', 'BAIDU_BOS_ENDPOINT', 'BAIDU_KMS_KEY_ID'],
    capabilities: allCapabilities,
    recommendedUse: ['public data-pack publication', 'redacted audit exports', 'encrypted envelope backup'],
    caveats: ['Treat as object export only until lifecycle, retention, and encryption controls are tested with AGID fixtures.'],
  },
  {
    id: 'vercel-blob',
    label: 'Vercel Blob',
    family: 'object-storage',
    requiredEnvVars: ['BLOB_READ_WRITE_TOKEN'],
    optionalEnvVars: ['AGID_CLOUD_PREFIX'],
    capabilities: allCapabilities,
    recommendedUse: ['public data-pack publication', 'small encrypted envelope exports', 'preview deployment assets'],
    caveats: ['Use signed manifests and keep private payloads owner-encrypted before upload.'],
  },
  {
    id: 'postgres',
    label: 'PostgreSQL',
    family: 'relational-db',
    requiredEnvVars: ['DATABASE_URL'],
    optionalEnvVars: ['DATABASE_SSL_CA', 'AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['sync queue mirror', 'audit metadata', 'address verification cache'],
    caveats: ['Private AOID columns must store opaque encrypted envelopes only.'],
  },
  {
    id: 'neon-postgres',
    label: 'Neon Postgres',
    family: 'relational-db',
    requiredEnvVars: ['NEON_DATABASE_URL'],
    optionalEnvVars: ['AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['serverless Postgres adapter', 'address verification cache'],
    caveats: ['Connection pooling and cold-start latency should be measured before bulk sync.'],
  },
  {
    id: 'supabase',
    label: 'Supabase Postgres',
    family: 'relational-db',
    requiredEnvVars: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    optionalEnvVars: ['SUPABASE_ANON_KEY', 'AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['Postgres sync', 'row-level-security backed admin tools'],
    caveats: ['RLS must deny plaintext AOID reads even to broad application roles.'],
  },
  {
    id: 'aws-rds-postgres',
    label: 'Amazon RDS for PostgreSQL',
    family: 'relational-db',
    requiredEnvVars: ['AWS_REGION', 'AGID_RDS_POSTGRES_URL'],
    optionalEnvVars: ['AWS_RDS_IAM_AUTH', 'DATABASE_SSL_CA', 'AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['managed Postgres production ledger', 'multi-server address resolution', 'audit metadata'],
    caveats: ['Prefer IAM auth or a secret manager and require SSL for every connection.'],
  },
  {
    id: 'aws-aurora-postgres',
    label: 'Amazon Aurora PostgreSQL',
    family: 'relational-db',
    requiredEnvVars: ['AWS_REGION', 'AGID_AURORA_POSTGRES_URL'],
    optionalEnvVars: ['AWS_RDS_IAM_AUTH', 'DATABASE_SSL_CA', 'AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['high-availability Postgres-compatible ledger', 'read replicas for address lookup'],
    caveats: ['Measure failover behavior and transaction retries before high-load handoff use.'],
  },
  {
    id: 'azure-database-postgres',
    label: 'Azure Database for PostgreSQL',
    family: 'relational-db',
    requiredEnvVars: ['AZURE_POSTGRES_URL'],
    optionalEnvVars: ['DATABASE_SSL_CA', 'AGID_DB_SCHEMA', 'AZURE_MANAGED_IDENTITY_CLIENT_ID'],
    capabilities: allCapabilities,
    recommendedUse: ['Azure managed Postgres deployments', 'enterprise metadata ledger'],
    caveats: ['Use managed identity or rotated secrets and keep AOID payloads encrypted client-side.'],
  },
  {
    id: 'google-cloud-sql-postgres',
    label: 'Google Cloud SQL for PostgreSQL',
    family: 'relational-db',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'CLOUD_SQL_POSTGRES_URL'],
    optionalEnvVars: ['CLOUD_SQL_CONNECTION_NAME', 'DATABASE_SSL_CA', 'AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['GCP managed Postgres ledger', 'address verification cache', 'audit metadata'],
    caveats: ['Use private IP or Cloud SQL connectors where possible and keep raw private fields out of logs.'],
  },
  {
    id: 'vercel-postgres',
    label: 'Vercel Postgres',
    family: 'relational-db',
    requiredEnvVars: ['POSTGRES_URL'],
    optionalEnvVars: ['POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING', 'AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['serverless Postgres preview deployments', 'small to medium address verification cache'],
    caveats: ['Separate preview and production datasets and measure connection pooling under POS bursts.'],
  },
  {
    id: 'cockroachdb',
    label: 'CockroachDB',
    family: 'relational-db',
    requiredEnvVars: ['COCKROACH_DATABASE_URL'],
    optionalEnvVars: ['DATABASE_SSL_CA', 'AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['distributed SQL metadata ledger', 'multi-region public registry mirrors'],
    caveats: ['Postgres-wire compatibility still needs serializable transaction retry testing.'],
  },
  {
    id: 'turso',
    label: 'Turso/libSQL',
    family: 'relational-db',
    requiredEnvVars: ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'],
    optionalEnvVars: ['AGID_DB_SCHEMA'],
    capabilities: publicMetadataCapabilities,
    recommendedUse: ['edge SQLite-compatible registry mirrors', 'public AGID lookup caches'],
    caveats: ['Use for metadata and public lookup first; do not treat it as the only private AOID sync store.'],
  },
  {
    id: 'mysql',
    label: 'MySQL or MariaDB',
    family: 'relational-db',
    requiredEnvVars: ['MYSQL_DATABASE_URL'],
    optionalEnvVars: ['AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['address verification cache', 'legacy enterprise databases'],
    caveats: ['Use binary-safe columns for opaque encrypted payloads.'],
  },
  {
    id: 'aws-rds-mysql',
    label: 'Amazon RDS for MySQL',
    family: 'relational-db',
    requiredEnvVars: ['AWS_REGION', 'AGID_RDS_MYSQL_URL'],
    optionalEnvVars: ['DATABASE_SSL_CA', 'AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['managed MySQL metadata mirrors', 'legacy enterprise address verification cache'],
    caveats: ['Primary ledger use requires MySQL migrations, transaction tests, and binary-safe encrypted columns.'],
  },
  {
    id: 'google-cloud-sql-mysql',
    label: 'Google Cloud SQL for MySQL',
    family: 'relational-db',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'CLOUD_SQL_MYSQL_URL'],
    optionalEnvVars: ['CLOUD_SQL_CONNECTION_NAME', 'DATABASE_SSL_CA', 'AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['GCP MySQL metadata mirrors', 'address verification cache'],
    caveats: ['Do not claim full ledger parity until MySQL migrations and lock behavior are tested.'],
  },
  {
    id: 'planetscale',
    label: 'PlanetScale',
    family: 'relational-db',
    requiredEnvVars: ['PLANETSCALE_DATABASE_URL'],
    optionalEnvVars: ['AGID_DB_SCHEMA'],
    capabilities: publicMetadataCapabilities,
    recommendedUse: ['branchable schema experiments', 'public registry and verification metadata'],
    caveats: ['Vitess semantics and foreign-key constraints must be reviewed before ledger use.'],
  },
  {
    id: 'sql-server',
    label: 'Microsoft SQL Server',
    family: 'relational-db',
    requiredEnvVars: ['SQLSERVER_DATABASE_URL'],
    optionalEnvVars: ['AGID_DB_SCHEMA', 'SQLSERVER_ENCRYPT'],
    capabilities: allCapabilities,
    recommendedUse: ['enterprise relational metadata store', 'address verification cache'],
    caveats: ['Requires dedicated migrations and encrypted column policy before primary ledger use.'],
  },
  {
    id: 'azure-sql',
    label: 'Azure SQL Database',
    family: 'relational-db',
    requiredEnvVars: ['AZURE_SQL_CONNECTION_STRING'],
    optionalEnvVars: ['AZURE_MANAGED_IDENTITY_CLIENT_ID', 'AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['Azure enterprise SQL deployments', 'audit metadata', 'address verification cache'],
    caveats: ['Use managed identity where possible and test Always Encrypted policies for private-derived fields.'],
  },
  {
    id: 'oracle-database',
    label: 'Oracle Database',
    family: 'relational-db',
    requiredEnvVars: ['ORACLE_DATABASE_URL'],
    optionalEnvVars: ['AGID_DB_SCHEMA', 'ORACLE_WALLET_LOCATION'],
    capabilities: allCapabilities,
    recommendedUse: ['large enterprise address metadata systems', 'official-source mirrors'],
    caveats: ['Requires Oracle-specific schema, migration, and wallet/TCPS deployment tests.'],
  },
  {
    id: 'oracle-autonomous-database',
    label: 'Oracle Autonomous Database',
    family: 'relational-db',
    requiredEnvVars: ['ORACLE_AUTONOMOUS_DATABASE_URL', 'ORACLE_WALLET_LOCATION'],
    optionalEnvVars: ['ORACLE_WALLET_PASSWORD', 'AGID_DB_SCHEMA', 'OCI_KMS_KEY_OCID'],
    capabilities: allCapabilities,
    recommendedUse: ['managed Oracle address ledger deployments', 'official-source mirrors', 'address verification cache'],
    caveats: ['Wallet and TCPS setup must be tested before production ledger use.'],
  },
  {
    id: 'oracle-mysql-heatwave',
    label: 'Oracle MySQL HeatWave',
    family: 'relational-db',
    requiredEnvVars: ['ORACLE_MYSQL_HEATWAVE_URL'],
    optionalEnvVars: ['DATABASE_SSL_CA', 'AGID_DB_SCHEMA', 'OCI_COMPARTMENT_OCID'],
    capabilities: allCapabilities,
    recommendedUse: ['MySQL-compatible address verification cache', 'metadata mirrors', 'high-volume read replicas'],
    caveats: ['Do not claim full ledger parity until MySQL migrations, locks, and transaction behavior are tested.'],
  },
  {
    id: 'alibaba-cloud-rds',
    label: 'Alibaba Cloud ApsaraDB RDS',
    family: 'relational-db',
    requiredEnvVars: ['ALIBABA_CLOUD_RDS_DATABASE_URL'],
    optionalEnvVars: ['DATABASE_SSL_CA', 'AGID_DB_SCHEMA', 'ALIBABA_CLOUD_REGION'],
    capabilities: allCapabilities,
    recommendedUse: ['China-region address verification cache', 'metadata mirrors', 'future relational ledger adapter'],
    caveats: ['Engine-specific migrations, SSL settings, and regional compliance controls must be tested before primary ledger use.'],
  },
  {
    id: 'alibaba-cloud-polardb',
    label: 'Alibaba Cloud PolarDB',
    family: 'relational-db',
    requiredEnvVars: ['ALIBABA_CLOUD_POLARDB_DATABASE_URL'],
    optionalEnvVars: ['DATABASE_SSL_CA', 'AGID_DB_SCHEMA', 'ALIBABA_CLOUD_REGION'],
    capabilities: allCapabilities,
    recommendedUse: ['high-scale relational metadata mirror', 'address verification cache', 'future ledger adapter'],
    caveats: ['Treat as planned until distributed transaction, lock, and migration behavior are verified.'],
  },
  {
    id: 'tencent-cloud-tdsql',
    label: 'Tencent Cloud TDSQL-C',
    family: 'relational-db',
    requiredEnvVars: ['TENCENT_TDSQL_DATABASE_URL'],
    optionalEnvVars: ['DATABASE_SSL_CA', 'AGID_DB_SCHEMA', 'TENCENT_CLOUD_REGION'],
    capabilities: allCapabilities,
    recommendedUse: ['Tencent Cloud relational metadata deployments', 'address verification cache', 'audit metadata'],
    caveats: ['Do not claim ledger parity until MySQL/PostgreSQL compatibility mode and transaction semantics are tested.'],
  },
  {
    id: 'huawei-cloud-gaussdb',
    label: 'Huawei Cloud GaussDB',
    family: 'relational-db',
    requiredEnvVars: ['HUAWEI_GAUSSDB_DATABASE_URL'],
    optionalEnvVars: ['DATABASE_SSL_CA', 'AGID_DB_SCHEMA', 'HUAWEI_CLOUD_REGION'],
    capabilities: allCapabilities,
    recommendedUse: ['enterprise relational metadata store', 'address verification cache', 'official-source mirrors'],
    caveats: ['Requires provider-specific migrations and consistency tests before runtime ledger support.'],
  },
  {
    id: 'baidu-ai-cloud-rds',
    label: 'Baidu AI Cloud RDS',
    family: 'relational-db',
    requiredEnvVars: ['BAIDU_RDS_DATABASE_URL'],
    optionalEnvVars: ['DATABASE_SSL_CA', 'AGID_DB_SCHEMA', 'BAIDU_BCE_REGION'],
    capabilities: allCapabilities,
    recommendedUse: ['RDS-backed address verification cache', 'metadata-only mirrors', 'audit metadata'],
    caveats: ['Keep as planned until engine selection, SSL, backup, and migration behavior are verified.'],
  },
  {
    id: 'google-cloud-spanner',
    label: 'Google Cloud Spanner',
    family: 'relational-db',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'SPANNER_INSTANCE_ID', 'SPANNER_DATABASE_ID'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: publicMetadataCapabilities,
    recommendedUse: ['globally distributed public registry metadata', 'issuer and revocation mirrors'],
    caveats: ['Use metadata-only until Spanner schema and consistency behavior are modeled explicitly.'],
  },
  {
    id: 'mongodb',
    label: 'MongoDB',
    family: 'document-db',
    requiredEnvVars: ['MONGODB_URI'],
    optionalEnvVars: ['AGID_MONGODB_DATABASE'],
    capabilities: allCapabilities,
    recommendedUse: ['document-shaped public evidence', 'encrypted envelope collections'],
    caveats: ['Do not let flexible schemas become private-field bypasses.'],
  },
  {
    id: 'mongodb-atlas',
    label: 'MongoDB Atlas',
    family: 'document-db',
    requiredEnvVars: ['MONGODB_ATLAS_URI'],
    optionalEnvVars: ['AGID_MONGODB_DATABASE', 'MONGODB_ATLAS_PROJECT_ID'],
    capabilities: allCapabilities,
    recommendedUse: ['managed MongoDB evidence store', 'commitment-only audit events', 'encrypted envelope collections'],
    caveats: ['Enable schema validation and deny private-field bypasses before ingesting external documents.'],
  },
  {
    id: 'firestore',
    label: 'Google Firestore',
    family: 'document-db',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_APPLICATION_CREDENTIALS'],
    optionalEnvVars: ['AGID_FIRESTORE_DATABASE'],
    capabilities: allCapabilities,
    recommendedUse: ['mobile-friendly sync metadata', 'public proof registry snapshots'],
    caveats: ['Security rules must reject plaintext AOID fields.'],
  },
  {
    id: 'firebase',
    label: 'Firebase',
    family: 'document-db',
    requiredEnvVars: ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT_JSON'],
    optionalEnvVars: ['FIREBASE_DATABASE_URL'],
    capabilities: allCapabilities,
    recommendedUse: ['mobile client integration', 'owner-consented encrypted sync'],
    caveats: ['Client rules must be tested with denied plaintext AOID fixtures.'],
  },
  {
    id: 'dynamodb',
    label: 'Amazon DynamoDB',
    family: 'document-db',
    requiredEnvVars: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AGID_DYNAMODB_TABLE'],
    optionalEnvVars: ['AWS_KMS_KEY_ID'],
    capabilities: allCapabilities,
    recommendedUse: ['high-volume sync queue mirror', 'audit/event metadata'],
    caveats: ['Partition keys should avoid user-linkable AOID secrets.'],
  },
  {
    id: 'azure-cosmos-db',
    label: 'Azure Cosmos DB',
    family: 'document-db',
    requiredEnvVars: ['COSMOS_DB_ENDPOINT', 'COSMOS_DB_KEY', 'COSMOS_DB_DATABASE'],
    optionalEnvVars: ['COSMOS_DB_CONTAINER_PREFIX'],
    capabilities: publicMetadataCapabilities,
    recommendedUse: ['multi-region metadata registry', 'issuer/revocation public mirrors', 'address verification cache'],
    caveats: ['Partition keys must avoid raw AGID/AOID secrets and consistency level must be chosen per purpose.'],
  },
  {
    id: 'oracle-nosql',
    label: 'Oracle NoSQL Database',
    family: 'document-db',
    requiredEnvVars: [
      'OCI_TENANCY_OCID',
      'OCI_USER_OCID',
      'OCI_FINGERPRINT',
      'OCI_PRIVATE_KEY',
      'OCI_REGION',
      'ORACLE_NOSQL_COMPARTMENT_ID',
    ],
    optionalEnvVars: ['ORACLE_NOSQL_TABLE_PREFIX', 'OCI_KMS_KEY_OCID'],
    capabilities: allCapabilities,
    recommendedUse: ['metadata document registry', 'address verification cache', 'encrypted envelope collections'],
    caveats: ['Schema validation and partition keys must prevent raw AGID, AOID, or recipient fields from becoming linkable keys.'],
  },
  {
    id: 'alibaba-cloud-tablestore',
    label: 'Alibaba Cloud Tablestore',
    family: 'document-db',
    requiredEnvVars: ['ALIBABA_TABLESTORE_ENDPOINT', 'ALIBABA_TABLESTORE_INSTANCE', 'ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_CLOUD_ACCESS_KEY_SECRET'],
    optionalEnvVars: ['ALIBABA_TABLESTORE_TABLE_PREFIX', 'ALIBABA_CLOUD_REGION'],
    capabilities: allCapabilities,
    recommendedUse: ['high-volume metadata tables', 'address verification cache', 'encrypted envelope collections'],
    caveats: ['Use schema validation and non-reversible partition keys; do not store raw address strings as primary keys.'],
  },
  {
    id: 'tencentdb-mongodb',
    label: 'TencentDB for MongoDB',
    family: 'document-db',
    requiredEnvVars: ['TENCENT_MONGODB_URI'],
    optionalEnvVars: ['AGID_MONGODB_DATABASE', 'TENCENT_CLOUD_REGION'],
    capabilities: allCapabilities,
    recommendedUse: ['MongoDB-compatible document evidence store', 'commitment-only audit events', 'encrypted envelope collections'],
    caveats: ['Enable schema validation and deny private-field bypasses before ingesting external documents.'],
  },
  {
    id: 'couchbase',
    label: 'Couchbase',
    family: 'document-db',
    requiredEnvVars: ['COUCHBASE_CONNECTION_STRING', 'COUCHBASE_USERNAME', 'COUCHBASE_PASSWORD'],
    optionalEnvVars: ['COUCHBASE_BUCKET', 'AGID_COLLECTION_PREFIX'],
    capabilities: publicMetadataCapabilities,
    recommendedUse: ['edge document metadata', 'offline-first enterprise caches'],
    caveats: ['Encrypted envelope validation and sync conflict policy must be tested before private sync.'],
  },
  {
    id: 'cassandra',
    label: 'Apache Cassandra or compatible',
    family: 'document-db',
    requiredEnvVars: ['CASSANDRA_CONTACT_POINTS', 'CASSANDRA_KEYSPACE'],
    optionalEnvVars: ['CASSANDRA_USERNAME', 'CASSANDRA_PASSWORD', 'AGID_TABLE_PREFIX'],
    capabilities: publicMetadataCapabilities,
    recommendedUse: ['high-volume public metadata events', 'distributed append-only audit mirrors'],
    caveats: ['Eventual consistency is not suitable as the only revocation-critical source.'],
  },
  {
    id: 'google-cloud-bigtable',
    label: 'Google Cloud Bigtable',
    family: 'document-db',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'BIGTABLE_INSTANCE_ID'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS', 'BIGTABLE_TABLE_PREFIX'],
    capabilities: publicMetadataCapabilities,
    recommendedUse: ['large public lookup tables', 'time-series audit metadata', 'source snapshot indexes'],
    caveats: ['Use row keys that cannot be reversed into private address or AOID material.'],
  },
  {
    id: 'redis',
    label: 'Redis or compatible KV cache',
    family: 'kv-cache',
    requiredEnvVars: ['REDIS_URL'],
    optionalEnvVars: ['AGID_REDIS_PREFIX'],
    capabilities: cacheOnlyCapabilities,
    recommendedUse: ['short-lived public lookup cache', 'rate-limited adapter cache'],
    caveats: ['Redis is cache-first; do not use it as the only revocation or proof registry store.'],
  },
  {
    id: 'upstash-redis',
    label: 'Upstash Redis',
    family: 'kv-cache',
    requiredEnvVars: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    optionalEnvVars: ['AGID_REDIS_PREFIX'],
    capabilities: cacheOnlyCapabilities,
    recommendedUse: ['serverless short-lived cache', 'rate limits', 'public lookup cache'],
    caveats: ['Do not use cache-only state as the sole source for revocation, issuer trust, or proof bundles.'],
  },
  {
    id: 'vercel-kv',
    label: 'Vercel KV',
    family: 'kv-cache',
    requiredEnvVars: ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
    optionalEnvVars: ['AGID_KV_PREFIX'],
    capabilities: cacheOnlyCapabilities,
    recommendedUse: ['preview deployment cache', 'short-lived public verification cache'],
    caveats: ['Use TTLs and pair with a durable ledger for any critical state.'],
  },
  {
    id: 'cloudflare-d1',
    label: 'Cloudflare D1',
    family: 'relational-db',
    requiredEnvVars: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'AGID_D1_DATABASE_ID'],
    optionalEnvVars: ['AGID_DB_SCHEMA'],
    capabilities: allCapabilities,
    recommendedUse: ['edge SQL cache', 'public AGID lookup tables'],
    caveats: ['Bulk write limits should be measured before large data-pack imports.'],
  },
  {
    id: 'cloudflare-kv',
    label: 'Cloudflare KV',
    family: 'kv-cache',
    requiredEnvVars: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'AGID_KV_NAMESPACE_ID'],
    optionalEnvVars: ['AGID_KV_PREFIX'],
    capabilities: cacheOnlyCapabilities,
    recommendedUse: ['edge public AGID cache', 'short-lived verification cache'],
    caveats: ['Eventually consistent caches are not enough for revocation-critical state.'],
  },
  {
    id: 'bigquery',
    label: 'Google BigQuery',
    family: 'analytics-warehouse',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_APPLICATION_CREDENTIALS', 'AGID_BIGQUERY_DATASET'],
    optionalEnvVars: ['AGID_BIGQUERY_LOCATION'],
    capabilities: analyticsCapabilities,
    recommendedUse: ['aggregated quality analytics', 'redacted audit trend analysis', 'official-source import reports'],
    caveats: ['Never export raw addresses, raw AOID, AGID-S ciphertext, or linkable user history to analytics tables.'],
  },
  {
    id: 'snowflake',
    label: 'Snowflake',
    family: 'analytics-warehouse',
    requiredEnvVars: ['SNOWFLAKE_ACCOUNT', 'SNOWFLAKE_USER', 'SNOWFLAKE_PRIVATE_KEY', 'SNOWFLAKE_DATABASE', 'SNOWFLAKE_SCHEMA'],
    optionalEnvVars: ['SNOWFLAKE_WAREHOUSE', 'SNOWFLAKE_ROLE'],
    capabilities: analyticsCapabilities,
    recommendedUse: ['enterprise redacted analytics', 'quality dashboards', 'audit aggregates'],
    caveats: ['Use dynamic masking and row access policies; do not sync private AOID envelopes by default.'],
  },
  {
    id: 'redshift',
    label: 'Amazon Redshift',
    family: 'analytics-warehouse',
    requiredEnvVars: ['REDSHIFT_DATABASE_URL'],
    optionalEnvVars: ['AWS_REGION', 'REDSHIFT_IAM_ROLE'],
    capabilities: analyticsCapabilities,
    recommendedUse: ['warehouse-scale redacted audit analytics', 'source quality reports'],
    caveats: ['Treat as analytics export only, not a primary address-resolution ledger.'],
  },
  {
    id: 'databricks',
    label: 'Databricks SQL Warehouse',
    family: 'analytics-warehouse',
    requiredEnvVars: ['DATABRICKS_HOST', 'DATABRICKS_TOKEN', 'DATABRICKS_SQL_WAREHOUSE_ID'],
    optionalEnvVars: ['DATABRICKS_CATALOG', 'DATABRICKS_SCHEMA'],
    capabilities: analyticsCapabilities,
    recommendedUse: ['redacted data quality notebooks', 'official-source ingestion pipelines'],
    caveats: ['Notebook access must not expose raw address material or owner-specific AOID timelines.'],
  },
  {
    id: 'oracle-analytics-cloud',
    label: 'Oracle Analytics Cloud',
    family: 'analytics-warehouse',
    requiredEnvVars: ['ORACLE_ANALYTICS_CLOUD_URL', 'ORACLE_ANALYTICS_CLIENT_ID', 'ORACLE_ANALYTICS_CLIENT_SECRET'],
    optionalEnvVars: ['ORACLE_ANALYTICS_TENANT', 'AGID_ANALYTICS_DATASET'],
    capabilities: analyticsCapabilities,
    recommendedUse: ['redacted quality dashboards', 'aggregate audit reporting', 'official-source import summaries'],
    caveats: ['Export only aggregate or redacted evidence; never export raw AOID, AGID-S ciphertext, or recipient history.'],
  },
  {
    id: 'alibaba-cloud-analyticdb',
    label: 'Alibaba Cloud AnalyticDB',
    family: 'analytics-warehouse',
    requiredEnvVars: ['ALIBABA_ANALYTICDB_DATABASE_URL'],
    optionalEnvVars: ['ALIBABA_CLOUD_REGION', 'AGID_ANALYTICS_SCHEMA'],
    capabilities: analyticsCapabilities,
    recommendedUse: ['redacted quality analytics', 'aggregate address verification reports', 'official-source import summaries'],
    caveats: ['Treat as analytics export only; never export raw addresses, AOID envelopes, AGID-S ciphertext, or linkable owner history.'],
  },
  {
    id: 'opensearch',
    label: 'OpenSearch',
    family: 'search-index',
    requiredEnvVars: ['OPENSEARCH_URL'],
    optionalEnvVars: ['OPENSEARCH_USERNAME', 'OPENSEARCH_PASSWORD', 'OPENSEARCH_INDEX_PREFIX'],
    capabilities: searchIndexCapabilities,
    recommendedUse: ['public place/address search index', 'redacted address verification search'],
    caveats: ['Index only public or redacted fields; search indexes are not private AOID stores.'],
  },
  {
    id: 'elasticsearch',
    label: 'Elasticsearch',
    family: 'search-index',
    requiredEnvVars: ['ELASTICSEARCH_URL'],
    optionalEnvVars: ['ELASTICSEARCH_API_KEY', 'ELASTICSEARCH_INDEX_PREFIX'],
    capabilities: searchIndexCapabilities,
    recommendedUse: ['public lookup search', 'multilingual place-name search', 'redacted verification cache'],
    caveats: ['Disable raw request logging and keep private address fields out of indexed documents.'],
  },
  {
    id: 'algolia',
    label: 'Algolia',
    family: 'search-index',
    requiredEnvVars: ['ALGOLIA_APP_ID', 'ALGOLIA_ADMIN_API_KEY', 'ALGOLIA_INDEX_PREFIX'],
    optionalEnvVars: ['ALGOLIA_SEARCH_API_KEY'],
    capabilities: searchIndexCapabilities,
    recommendedUse: ['fast public address element autocomplete', 'public AGID search facets'],
    caveats: ['Use secured search keys and avoid uploading private, personal, or precise high-risk location records.'],
  },
  {
    id: 'meilisearch',
    label: 'Meilisearch',
    family: 'search-index',
    requiredEnvVars: ['MEILISEARCH_HOST', 'MEILISEARCH_API_KEY'],
    optionalEnvVars: ['MEILISEARCH_INDEX_PREFIX'],
    capabilities: searchIndexCapabilities,
    recommendedUse: ['self-hosted public search', 'offline-friendly address lookup indexes'],
    caveats: ['Treat as public/redacted index; do not use it for AOID encrypted sync or revocation authority.'],
  },
  {
    id: 'qdrant',
    label: 'Qdrant',
    family: 'vector-db',
    requiredEnvVars: ['QDRANT_URL', 'QDRANT_API_KEY'],
    optionalEnvVars: ['QDRANT_COLLECTION_PREFIX'],
    capabilities: vectorIndexCapabilities,
    recommendedUse: ['redacted place-name similarity search', 'public alias matching experiments'],
    caveats: ['Embeddings can leak information; use only public/consented/redacted text.'],
  },
  {
    id: 'weaviate',
    label: 'Weaviate',
    family: 'vector-db',
    requiredEnvVars: ['WEAVIATE_URL', 'WEAVIATE_API_KEY'],
    optionalEnvVars: ['WEAVIATE_CLASS_PREFIX'],
    capabilities: vectorIndexCapabilities,
    recommendedUse: ['redacted multilingual alias search', 'public geographic text similarity'],
    caveats: ['Keep raw addresses and AOID descriptors out of vector payloads and metadata.'],
  },
  {
    id: 'pinecone',
    label: 'Pinecone',
    family: 'vector-db',
    requiredEnvVars: ['PINECONE_API_KEY', 'PINECONE_INDEX'],
    optionalEnvVars: ['PINECONE_NAMESPACE'],
    capabilities: vectorIndexCapabilities,
    recommendedUse: ['public alias retrieval experiments', 'redacted address-quality search assist'],
    caveats: ['Do not upload private address strings, AGID-S ciphertext, or linkable owner metadata.'],
  },
  {
    id: 'oracle-netsuite',
    label: 'Oracle NetSuite SuiteTalk REST',
    family: 'enterprise-app',
    requiredEnvVars: [
      'NETSUITE_ACCOUNT_ID',
      'NETSUITE_CONSUMER_KEY',
      'NETSUITE_CONSUMER_SECRET',
      'NETSUITE_TOKEN_ID',
      'NETSUITE_TOKEN_SECRET',
    ],
    optionalEnvVars: ['NETSUITE_REST_BASE_URL', 'AGID_NETSUITE_ROLE_ID'],
    capabilities: enterpriseAppCapabilities,
    recommendedUse: ['order and waybill status mirror', 'address intent audit status', 'carrier/customer records by short-lived alias'],
    caveats: ['Do not push raw AGID, AOID, recipient, phone, room, or AGID-S ciphertext; use aliases, commitments, and redacted audit status.'],
  },
  {
    id: 'oracle-blockchain-platform',
    label: 'Oracle Blockchain Platform',
    family: 'blockchain-ledger',
    requiredEnvVars: ['ORACLE_BLOCKCHAIN_REST_URL', 'ORACLE_BLOCKCHAIN_API_KEY'],
    optionalEnvVars: ['ORACLE_BLOCKCHAIN_CHANNEL', 'ORACLE_BLOCKCHAIN_CHAINCODE'],
    capabilities: publicAnchorCapabilities,
    recommendedUse: ['proof bundle anchors', 'issuer trust anchors', 'revocation and freshness roots'],
    caveats: ['Anchor public commitments only; never write AGID-S ciphertext, private AOID payloads, or precise private location material.'],
  },
  {
    id: 'dingtalk-webhook',
    label: 'DingTalk custom robot webhook',
    family: 'enterprise-app',
    requiredEnvVars: ['DINGTALK_WEBHOOK_URL', 'DINGTALK_WEBHOOK_SECRET'],
    optionalEnvVars: ['DINGTALK_WEBHOOK_AUDIENCE'],
    capabilities: enterpriseAppCapabilities,
    recommendedUse: ['operator alerts', 'review queue notifications', 'deployment and incident summaries by alias'],
    caveats: ['Send redacted status only; never send raw addresses, AGID-S payloads, phone numbers, or recipient names to chat.'],
  },
  {
    id: 'feishu-open-platform',
    label: 'Feishu/Lark Open Platform',
    family: 'enterprise-app',
    requiredEnvVars: ['FEISHU_APP_ID', 'FEISHU_APP_SECRET'],
    optionalEnvVars: ['FEISHU_WEBHOOK_URL', 'FEISHU_TENANT_KEY'],
    capabilities: enterpriseAppCapabilities,
    recommendedUse: ['operations notifications', 'review workflow handoff', 'address-intent status by short-lived alias'],
    caveats: ['Use tenant-scoped credentials and redacted payload templates; do not send private address material to collaboration tools.'],
  },
  {
    id: 'wecom-webhook',
    label: 'WeCom group bot webhook',
    family: 'enterprise-app',
    requiredEnvVars: ['WECOM_WEBHOOK_URL', 'WECOM_WEBHOOK_SECRET'],
    optionalEnvVars: ['WECOM_CORP_ID', 'WECOM_AGENT_ID'],
    capabilities: enterpriseAppCapabilities,
    recommendedUse: ['carrier operations alerts', 'handoff exceptions', 'review queue summaries by commitment'],
    caveats: ['Use commitment or alias references only; chat logs must not contain precise AGID, AOID, recipient, phone, or room data.'],
  },
  {
    id: 'custom-http-webhook',
    label: 'Custom HTTPS webhook',
    family: 'webhook',
    requiredEnvVars: ['AGID_CLOUD_WEBHOOK_URL', 'AGID_CLOUD_WEBHOOK_SECRET'],
    optionalEnvVars: ['AGID_CLOUD_WEBHOOK_AUDIENCE'],
    capabilities: allCapabilities,
    recommendedUse: ['enterprise adapters', 'carrier integration staging', 'private deployment hooks'],
    caveats: ['Webhook receivers must pass the same AOID encrypted-envelope policy before accepting data.'],
  },
];

const CLOUD_DB_PURPOSES = new Set<CloudDbPurpose>([
  'public-agid-cache',
  'address-verification-cache',
  'encrypted-aoid-sync',
  'audit-log',
  'proof-bundle-registry',
  'credential-issuer-registry',
  'revocation-freshness-anchor',
  'settings-sync',
]);

const SYNC_ENTITY_TYPES = new Set<SyncQueueRecord['entityType']>([
  'savedAgid',
  'savedQr',
  'registeredAddress',
  'aoid',
  'settings',
  'posShipment',
  'posReceipt',
  'posAuditCase',
  'posHandoff',
  'posDeviceDiagnostic',
  'posCrossBorderDeclaration',
]);

const SYNC_ACTIONS = new Set<SyncQueueAction>(['create', 'update', 'delete']);

function isCloudDbPurpose(value: unknown): value is CloudDbPurpose {
  return typeof value === 'string' && CLOUD_DB_PURPOSES.has(value as CloudDbPurpose);
}

function isSyncEntityType(value: unknown): value is SyncQueueRecord['entityType'] {
  return typeof value === 'string' && SYNC_ENTITY_TYPES.has(value as SyncQueueRecord['entityType']);
}

function isSyncAction(value: unknown): value is SyncQueueAction {
  return typeof value === 'string' && SYNC_ACTIONS.has(value as SyncQueueAction);
}

function inferLayer(input: CloudDbConnectorPlanInput): AgidAoidLayer {
  if (input.layer === 'AGID' || input.layer === 'AOID') return input.layer;
  if (input.entityType === 'aoid' || input.purpose === 'encrypted-aoid-sync') return 'AOID';
  return 'AGID';
}

function targetSurfaceFor(purpose: string, layer: AgidAoidLayer): AgidAoidSurface {
  if (purpose === 'encrypted-aoid-sync') return 'encrypted-sync';
  if (purpose === 'audit-log') return 'event-stream';
  if (purpose === 'settings-sync') return layer === 'AOID' ? 'encrypted-sync' : 'local-device';
  return 'public-api';
}

function storageModeFor(purpose: string): CloudDbStorageMode {
  if (purpose === 'encrypted-aoid-sync') return 'encrypted-envelope';
  if (purpose === 'address-verification-cache') return 'address-verification-cache';
  if (purpose === 'settings-sync') return 'encrypted-settings';
  if (purpose === 'public-agid-cache') return 'public-cache';
  return 'metadata-only';
}

function providerSupportsPurpose(profile: CloudDbConnectorProfile, purpose: CloudDbPurpose) {
  switch (purpose) {
    case 'public-agid-cache':
      return profile.capabilities.publicAgidCache;
    case 'address-verification-cache':
      return profile.capabilities.addressVerificationCache;
    case 'encrypted-aoid-sync':
      return profile.capabilities.encryptedAoidSync;
    case 'audit-log':
      return profile.capabilities.auditLog;
    case 'proof-bundle-registry':
      return profile.capabilities.proofBundleRegistry;
    case 'credential-issuer-registry':
      return profile.capabilities.credentialIssuerRegistry;
    case 'revocation-freshness-anchor':
      return profile.capabilities.revocationFreshnessAnchors;
    case 'settings-sync':
      return profile.capabilities.settingsSync;
  }
}

function governanceRequiredFor(input: CloudDbConnectorPlanInput, purpose: string) {
  return Boolean(input.layer)
    || isSyncEntityType(input.entityType)
    || purpose === 'public-agid-cache'
    || purpose === 'address-verification-cache'
    || purpose === 'encrypted-aoid-sync'
    || purpose === 'audit-log'
    || purpose === 'settings-sync';
}

function requiredControlsFor(purpose: string, layer: AgidAoidLayer) {
  const controls = [
    'no-secret-values-in-repository',
    'provider-credentials-from-environment-or-secret-manager',
    'adapter-contract-before-sdk-dispatch',
  ];
  if (layer === 'AOID' || purpose === 'encrypted-aoid-sync') {
    controls.push(
      'explicit-owner-consent',
      'owner-device-encrypted-envelope',
      'encrypted-at-rest',
      'encrypted-in-transit',
      'no-server-plaintext-aoid-decryption',
    );
  }
  if (purpose === 'proof-bundle-registry' || purpose === 'revocation-freshness-anchor') {
    controls.push('public-commitments-only', 'revocation-aware-freshness-check');
  }
  return Array.from(new Set(controls));
}

function recommendedCollectionsFor(
  profile: CloudDbConnectorProfile | null,
  purpose: string,
): CloudDbRecommendedCollection[] {
  if (!profile) return [];
  const prefix = profile.family === 'object-storage'
    ? 'objects'
    : profile.family === 'kv-cache'
      ? 'keys'
      : 'tables';
  switch (purpose) {
    case 'public-agid-cache':
      return [{ name: `${prefix}.agid_public_lookup`, stores: 'AGID public references and public evidence', key: 'agid', retention: 'cache' }];
    case 'address-verification-cache':
      return [{ name: `${prefix}.address_verification_cache`, stores: 'country/postal/source validation results without private recipient fields', key: 'country:postal:hash', retention: 'cache' }];
    case 'encrypted-aoid-sync':
      return [{ name: `${prefix}.aoid_encrypted_envelopes`, stores: 'AOID_SYNC_ENVELOPE metadata plus opaque encrypted payload', key: 'aoid:id', retention: 'user-controlled' }];
    case 'audit-log':
      return [{ name: `${prefix}.agid_aoid_audit_events`, stores: 'policy decisions, safe fingerprints, and sync status metadata', key: 'audit:id', retention: 'append-only' }];
    case 'proof-bundle-registry':
      return [{ name: `${prefix}.zk_proof_bundle_registry`, stores: 'public proof bundle commitments and status only', key: 'bundle:id', retention: 'until-revoked' }];
    case 'credential-issuer-registry':
      return [{ name: `${prefix}.credential_issuer_trust_registry`, stores: 'issuer metadata, public attestations, and trust scores', key: 'issuer:id', retention: 'until-revoked' }];
    case 'revocation-freshness-anchor':
      return [{ name: `${prefix}.revocation_freshness_anchors`, stores: 'revocation roots, freshness roots, and anchor metadata', key: 'anchor:id', retention: 'until-revoked' }];
    case 'settings-sync':
      return [{ name: `${prefix}.encrypted_user_settings`, stores: 'encrypted settings blobs and sync cursors', key: 'owner:device', retention: 'user-controlled' }];
    default:
      return [];
  }
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
    .join(',')}}`;
}

function buildJobId(value: unknown) {
  return `CLOUDDB-${sha256Hex(stableJson(value)).slice(0, 16).toUpperCase()}`;
}

export function listCloudDbConnectorProfiles() {
  return CLOUD_DB_CONNECTOR_PROFILES.map(profile => ({
    ...profile,
    requiredEnvVars: [...profile.requiredEnvVars],
    optionalEnvVars: [...profile.optionalEnvVars],
    recommendedUse: [...profile.recommendedUse],
    caveats: [...profile.caveats],
  }));
}

export function getCloudDbConnectorProfile(providerId: string) {
  const normalized = providerId.trim().toLowerCase();
  return listCloudDbConnectorProfiles().find(profile => profile.id === normalized);
}

export function buildCloudDbConnectorPlan(input: CloudDbConnectorPlanInput): CloudDbConnectorPlan {
  const provider = getCloudDbConnectorProfile(String(input.providerId ?? '')) ?? null;
  const purpose = String(input.purpose ?? '').trim();
  const layer = inferLayer(input);
  const targetSurface = targetSurfaceFor(purpose, layer);
  const storageMode = storageModeFor(purpose);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!provider) errors.push('unsupported-cloud-db-provider');
  if (!isCloudDbPurpose(purpose)) errors.push('unsupported-cloud-db-purpose');
  if (provider && isCloudDbPurpose(purpose) && !providerSupportsPurpose(provider, purpose)) {
    errors.push('provider-does-not-support-purpose');
  }

  let governance: AgidAoidGovernanceDecision | undefined;
  if (governanceRequiredFor(input, purpose)) {
    governance = evaluateAgidAoidOperation({
      layer,
      operation: 'sync',
      surface: targetSurface,
      payload: input.payload,
    });
    warnings.push(...governance.warnings);
    if (!governance.allowed) errors.push('agid-aoid-governance-blocked-payload');
  }

  if (input.storeRawPayload && layer === 'AOID') {
    errors.push('raw-aoid-plaintext-storage-forbidden');
  }

  if (purpose === 'encrypted-aoid-sync') {
    if (!input.ownerConsent) errors.push('owner-consent-required');
    if (!input.encryptedAtRest) errors.push('encrypted-at-rest-required');
    if (!input.encryptedInTransit) errors.push('encrypted-in-transit-required');
    if (governance?.payloadClass !== 'aoid-encrypted-envelope') {
      errors.push('aoid-sync-requires-owner-device-encrypted-envelope');
    }
  }

  if (governance?.requiresLocalOnly) {
    errors.push('payload-requires-local-only-surface');
  }

  if (
    purpose === 'audit-log'
    || purpose === 'proof-bundle-registry'
    || purpose === 'credential-issuer-registry'
    || purpose === 'revocation-freshness-anchor'
  ) {
    if (input.encryptedInTransit === false) warnings.push('metadata endpoints should still use TLS in transit.');
  }

  const dedupedErrors = Array.from(new Set(errors));
  const dedupedWarnings = Array.from(new Set(warnings));

  return {
    modelVersion: CLOUD_DB_INTEGRATION_MODEL_VERSION,
    provider,
    purpose,
    layer,
    targetSurface,
    storageMode,
    allowed: dedupedErrors.length === 0,
    requiredEnvVars: provider ? [...provider.requiredEnvVars] : [],
    requiredControls: requiredControlsFor(purpose, layer),
    collections: recommendedCollectionsFor(provider, purpose),
    ...(governance ? { governance } : {}),
    errors: dedupedErrors,
    warnings: dedupedWarnings,
  };
}

export function buildCloudDbSyncJob(input: CloudDbSyncJobInput): CloudDbSyncJob {
  if (!isSyncEntityType(input.entityType)) {
    throw new Error('Cloud/DB sync jobs require a supported local sync-queue entity type.');
  }
  if (!isSyncAction(input.action)) {
    throw new Error('Cloud/DB sync jobs require a create, update, or delete action.');
  }

  const plan = buildCloudDbConnectorPlan(input);
  if (!plan.provider) {
    throw new Error(`Cloud/DB connector is not supported: ${input.providerId}`);
  }
  if (!plan.allowed) {
    throw new Error(`Cloud/DB connector plan is blocked: ${plan.errors.join(', ')}`);
  }

  const queueRecord = buildSyncQueueRecord({
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    payload: input.payload,
    targetSurface: plan.targetSurface,
    now: input.now,
  });

  return {
    id: buildJobId({
      providerId: plan.provider.id,
      purpose: plan.purpose,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      queueRecordId: queueRecord.id,
    }),
    modelVersion: CLOUD_DB_INTEGRATION_MODEL_VERSION,
    providerId: plan.provider.id,
    purpose: plan.purpose,
    destination: {
      family: plan.provider.family,
      requiredEnvVars: [...plan.provider.requiredEnvVars],
      ...(input.region ? { region: input.region } : {}),
    },
    plan,
    queueRecord,
    dispatch: {
      mode: 'adapter-contract',
      networkRequestBuilt: false,
      reason: 'SDK-specific clients execute outside this pure policy module after this plan passes.',
    },
  };
}
