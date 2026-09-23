import {
  cleanBoolean,
  cleanText,
  cleanTextArray,
} from './redactedWorkflowCore';

export const CLOUD_SERVICE_EXPANSION_MODEL_VERSION = 'cloud-service-expansion-v1';

export type ExtendedCloudProviderId =
  | 'cloudflare'
  | 'oci'
  | 'alibaba-cloud'
  | 'tencent-cloud'
  | 'huawei-cloud'
  | 'ibm-cloud'
  | 'digitalocean'
  | 'vercel'
  | 'supabase'
  | 'mongodb-atlas'
  | 'snowflake'
  | 'databricks';

export type ExtendedCloudServiceFamily =
  | 'edge-compute'
  | 'object-storage'
  | 'relational-db'
  | 'document-db'
  | 'kv-cache'
  | 'event-queue'
  | 'api-gateway'
  | 'secret-management'
  | 'abuse-protection'
  | 'analytics-warehouse'
  | 'lakehouse'
  | 'app-platform';

export type ExtendedCloudServiceId =
  | 'cloudflare-workers'
  | 'cloudflare-r2'
  | 'cloudflare-d1'
  | 'cloudflare-kv'
  | 'cloudflare-queues'
  | 'cloudflare-turnstile'
  | 'oci-object-storage'
  | 'oci-autonomous-database'
  | 'oci-functions'
  | 'oci-api-gateway'
  | 'oci-vault'
  | 'alibaba-cloud-oss'
  | 'alibaba-cloud-rds-polardb'
  | 'alibaba-cloud-function-compute'
  | 'alibaba-cloud-eventbridge'
  | 'alibaba-cloud-api-gateway'
  | 'tencent-cloud-cos'
  | 'tencent-cloud-postgresql-tdsql'
  | 'tencent-cloud-scf-cloudbase'
  | 'tencent-cloud-api-gateway'
  | 'huawei-cloud-obs'
  | 'huawei-cloud-gaussdb'
  | 'huawei-cloud-functiongraph'
  | 'ibm-cloud-object-storage'
  | 'ibm-key-protect'
  | 'ibm-code-engine'
  | 'ibm-cloudant'
  | 'digitalocean-spaces'
  | 'digitalocean-managed-postgres'
  | 'digitalocean-app-platform-functions'
  | 'vercel-blob'
  | 'vercel-edge-config-marketplace-db'
  | 'vercel-functions'
  | 'supabase-postgres-auth-storage'
  | 'supabase-edge-functions'
  | 'mongodb-atlas'
  | 'snowflake'
  | 'databricks';

export type ExtendedCloudPurpose =
  | 'edge-resolver'
  | 'api-gateway-rate-limit'
  | 'encrypted-evidence-object'
  | 'public-agid-cache'
  | 'address-verification-cache'
  | 'metadata-ledger'
  | 'encrypted-aoid-sync'
  | 'settings-sync'
  | 'webhook-event-dispatch'
  | 'async-job-queue'
  | 'secret-reference'
  | 'abuse-protection'
  | 'serverless-adapter'
  | 'analytics-aggregate'
  | 'lakehouse-aggregate'
  | 'app-hosting';

export type ExtendedCloudPayloadClass =
  | 'none'
  | 'event-metadata'
  | 'organization-record'
  | 'public-agid-reference'
  | 'address-commitment'
  | 'encrypted-aoid-envelope'
  | 'redacted-address-summary'
  | 'plaintext-address'
  | 'document-image-or-pdf'
  | 'device-telemetry'
  | 'audit-digest'
  | 'security-alert'
  | 'analytics-aggregate'
  | 'secret-reference';

export type ExtendedCloudPrivacyMode =
  | 'organization-metadata-only'
  | 'commitment-or-alias-only'
  | 'event-metadata-only'
  | 'encrypted-envelope-only'
  | 'secret-reference-only'
  | 'aggregate-only'
  | 'public-edge-only';

export type ExtendedCloudRuntime =
  | 'edge-worker'
  | 'server-side'
  | 'server-side-or-worker'
  | 'dashboard-admin-only';

export type ExtendedCloudServiceProfile = {
  id: ExtendedCloudServiceId;
  provider: ExtendedCloudProviderId;
  label: string;
  family: ExtendedCloudServiceFamily;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  purposes: ExtendedCloudPurpose[];
  defaultPrivacyMode: ExtendedCloudPrivacyMode;
  recommendedRuntime: ExtendedCloudRuntime;
  docs: string[];
  recommendedUse: string[];
  caveats: string[];
};

export type ExtendedCloudIntegrationPlanInput = {
  serviceId: ExtendedCloudServiceId | string;
  purpose: ExtendedCloudPurpose | string;
  payloadClass?: ExtendedCloudPayloadClass | string;
  ownerConsent?: boolean;
  encryptedAtRest?: boolean;
  encryptedInTransit?: boolean;
  serverSideOnly?: boolean;
  highRiskMode?: boolean;
  requestedPermissions?: unknown;
};

export type ExtendedCloudIntegrationPlan = {
  modelVersion: typeof CLOUD_SERVICE_EXPANSION_MODEL_VERSION;
  service: ExtendedCloudServiceProfile | null;
  purpose: string;
  payloadClass: ExtendedCloudPayloadClass;
  allowed: boolean;
  requiredEnvVars: string[];
  requiredControls: string[];
  recommendedPermissions: string[];
  dataFlow: {
    sendsPlaintextAddressToProvider: false;
    sendsDocumentImageOrPdfToProvider: false;
    storesRawAddressInProvider: false;
    clientSecretAllowedInBrowser: false;
    serverSideOnlyRequired: boolean;
    highRiskModeCompatible: boolean;
  };
  errors: string[];
  warnings: string[];
};

const DOCS = {
  cloudflareStorage: 'https://developers.cloudflare.com/workers/platform/storage-options/',
  cloudflareWorkers: 'https://developers.cloudflare.com/workers/',
  cloudflareTurnstile: 'https://developers.cloudflare.com/turnstile/',
  ociApi: 'https://docs.oracle.com/en-us/iaas/api/',
  ociObjectStorage: 'https://docs.oracle.com/en-us/iaas/Content/Object/Concepts/objectstorageoverview.htm',
  alibabaEventBridge: 'https://www.alibabacloud.com/blog/event-driven-architecture-on-alibaba-cloud-with-eventbridge-and-function-compute_603113',
  alibabaApiGateway: 'https://www.alibabacloud.com/blog/designing-production-api-infrastructure-with-alibaba-cloud-api-gateway_603133',
  tencentDocs: 'https://www.tencentcloud.com/document/product',
  tencentScf: 'https://www.tencentcloud.com/document/product/583/45901',
  tencentCloudBase: 'https://www.tencentcloud.com/document/product/409/80389',
  ibmCosKeyProtect: 'https://cloud.ibm.com/docs/key-protect?topic=key-protect-integrate-cos',
  digitaloceanDocs: 'https://docs.digitalocean.com/',
  digitaloceanAppPlatform: 'https://www.digitalocean.com/products/app-platform',
  vercelStorage: 'https://vercel.com/docs/storage',
  vercelBlob: 'https://vercel.com/docs/vercel-blob',
  supabaseDocs: 'https://supabase.com/docs',
  supabaseEdgeFunctions: 'https://supabase.com/docs/guides/functions',
  mongodbAtlas: 'https://www.mongodb.com/docs/atlas/',
  snowflakeDocs: 'https://docs.snowflake.com/',
  databricksDocs: 'https://docs.databricks.com/',
};

const profile = (
  input: ExtendedCloudServiceProfile,
): ExtendedCloudServiceProfile => input;

const EXTENDED_CLOUD_SERVICE_PROFILES: ExtendedCloudServiceProfile[] = [
  profile({
    id: 'cloudflare-workers',
    provider: 'cloudflare',
    label: 'Cloudflare Workers',
    family: 'edge-compute',
    requiredEnvVars: ['CLOUDFLARE_ACCOUNT_ID'],
    optionalEnvVars: ['CLOUDFLARE_API_TOKEN'],
    purposes: ['edge-resolver', 'serverless-adapter', 'api-gateway-rate-limit'],
    defaultPrivacyMode: 'public-edge-only',
    recommendedRuntime: 'edge-worker',
    docs: [DOCS.cloudflareWorkers, DOCS.cloudflareStorage],
    recommendedUse: ['edge AGID resolver', 'rate-limited public metadata endpoint', 'redacted webhook adapter'],
    caveats: ['Do not process raw AOID bodies or address evidence in edge logs.'],
  }),
  profile({
    id: 'cloudflare-r2',
    provider: 'cloudflare',
    label: 'Cloudflare R2',
    family: 'object-storage',
    requiredEnvVars: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_R2_BUCKET'],
    optionalEnvVars: ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
    purposes: ['encrypted-evidence-object', 'public-agid-cache'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.cloudflareStorage],
    recommendedUse: ['encrypted evidence envelopes', 'public release artifacts', 'AGID public cache bundles'],
    caveats: ['Object keys must not contain full addresses, AOIDs, phone numbers, or recipient names.'],
  }),
  profile({
    id: 'cloudflare-d1',
    provider: 'cloudflare',
    label: 'Cloudflare D1',
    family: 'relational-db',
    requiredEnvVars: ['CLOUDFLARE_D1_DATABASE_ID'],
    optionalEnvVars: ['CLOUDFLARE_ACCOUNT_ID'],
    purposes: ['public-agid-cache', 'metadata-ledger', 'settings-sync'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'edge-worker',
    docs: [DOCS.cloudflareStorage],
    recommendedUse: ['edge-readable public cache metadata', 'small commitment-only registry views'],
    caveats: ['Use Postgres for canonical event sourcing if stronger relational semantics are needed.'],
  }),
  profile({
    id: 'cloudflare-kv',
    provider: 'cloudflare',
    label: 'Cloudflare KV',
    family: 'kv-cache',
    requiredEnvVars: ['CLOUDFLARE_KV_NAMESPACE_ID'],
    optionalEnvVars: ['CLOUDFLARE_ACCOUNT_ID'],
    purposes: ['public-agid-cache', 'settings-sync'],
    defaultPrivacyMode: 'public-edge-only',
    recommendedRuntime: 'edge-worker',
    docs: [DOCS.cloudflareStorage],
    recommendedUse: ['public resolver cache', 'feature flags that do not include private user data'],
    caveats: ['Eventual consistency is acceptable for cache, not for revocation finality.'],
  }),
  profile({
    id: 'cloudflare-queues',
    provider: 'cloudflare',
    label: 'Cloudflare Queues',
    family: 'event-queue',
    requiredEnvVars: ['CLOUDFLARE_QUEUE_NAME'],
    optionalEnvVars: ['CLOUDFLARE_ACCOUNT_ID'],
    purposes: ['async-job-queue', 'webhook-event-dispatch'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'edge-worker',
    docs: [DOCS.cloudflareStorage],
    recommendedUse: ['redacted async jobs', 'edge webhook retries'],
    caveats: ['Queue messages should contain job ids and commitments only.'],
  }),
  profile({
    id: 'cloudflare-turnstile',
    provider: 'cloudflare',
    label: 'Cloudflare Turnstile',
    family: 'abuse-protection',
    requiredEnvVars: ['CLOUDFLARE_TURNSTILE_SITE_KEY'],
    optionalEnvVars: ['CLOUDFLARE_TURNSTILE_SECRET_KEY'],
    purposes: ['abuse-protection'],
    defaultPrivacyMode: 'organization-metadata-only',
    recommendedRuntime: 'server-side',
    docs: [DOCS.cloudflareTurnstile],
    recommendedUse: ['anti-automation check for public address lookup and feedback forms'],
    caveats: ['Do not treat bot mitigation as identity or address verification.'],
  }),

  profile({
    id: 'oci-object-storage',
    provider: 'oci',
    label: 'OCI Object Storage',
    family: 'object-storage',
    requiredEnvVars: ['OCI_BUCKET_NAME', 'OCI_NAMESPACE'],
    optionalEnvVars: ['OCI_REGION'],
    purposes: ['encrypted-evidence-object', 'public-agid-cache'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.ociObjectStorage, DOCS.ociApi],
    recommendedUse: ['encrypted evidence storage', 'public AGID data bundles'],
    caveats: ['Use Vault-managed keys and object lifecycle rules for evidence retention.'],
  }),
  profile({
    id: 'oci-autonomous-database',
    provider: 'oci',
    label: 'OCI Autonomous Database',
    family: 'relational-db',
    requiredEnvVars: ['OCI_AUTONOMOUS_DATABASE_OCID'],
    optionalEnvVars: ['OCI_WALLET_PATH'],
    purposes: ['metadata-ledger', 'address-verification-cache'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    docs: [DOCS.ociApi],
    recommendedUse: ['enterprise ledger metadata', 'address verification cache without raw address logs'],
    caveats: ['Keep canonical address evidence encrypted outside relational audit tables.'],
  }),
  profile({
    id: 'oci-functions',
    provider: 'oci',
    label: 'OCI Functions',
    family: 'edge-compute',
    requiredEnvVars: ['OCI_REGION'],
    optionalEnvVars: ['OCI_FUNCTION_OCID'],
    purposes: ['serverless-adapter', 'webhook-event-dispatch'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.ociApi],
    recommendedUse: ['serverless provider adapter', 'redacted webhook processing'],
    caveats: ['Function logs must be redacted before emit.'],
  }),
  profile({
    id: 'oci-api-gateway',
    provider: 'oci',
    label: 'OCI API Gateway',
    family: 'api-gateway',
    requiredEnvVars: ['OCI_API_GATEWAY_OCID'],
    optionalEnvVars: ['OCI_REGION'],
    purposes: ['api-gateway-rate-limit'],
    defaultPrivacyMode: 'organization-metadata-only',
    recommendedRuntime: 'server-side',
    docs: [DOCS.ociApi],
    recommendedUse: ['private deployment API gateway', 'issuer endpoint proxy'],
    caveats: ['Disable body logging or apply AGID redaction middleware before gateway logs.'],
  }),
  profile({
    id: 'oci-vault',
    provider: 'oci',
    label: 'OCI Vault',
    family: 'secret-management',
    requiredEnvVars: ['OCI_VAULT_OCID'],
    optionalEnvVars: ['OCI_KEY_OCID'],
    purposes: ['secret-reference'],
    defaultPrivacyMode: 'secret-reference-only',
    recommendedRuntime: 'server-side',
    docs: [DOCS.ociApi],
    recommendedUse: ['issuer key references', 'AGID-S key references', 'webhook signing key references'],
    caveats: ['Store key references in AGID metadata, not secret material.'],
  }),

  profile({
    id: 'alibaba-cloud-oss',
    provider: 'alibaba-cloud',
    label: 'Alibaba Cloud OSS',
    family: 'object-storage',
    requiredEnvVars: ['ALIBABA_CLOUD_REGION', 'ALIBABA_CLOUD_OSS_BUCKET'],
    optionalEnvVars: ['ALIBABA_CLOUD_KMS_KEY_ID'],
    purposes: ['encrypted-evidence-object', 'public-agid-cache'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.alibabaApiGateway],
    recommendedUse: ['regional encrypted evidence storage', 'public cache bundles'],
    caveats: ['Run data residency and legal review before storing private address evidence.'],
  }),
  profile({
    id: 'alibaba-cloud-rds-polardb',
    provider: 'alibaba-cloud',
    label: 'Alibaba Cloud RDS / PolarDB',
    family: 'relational-db',
    requiredEnvVars: ['ALIBABA_CLOUD_REGION', 'ALIBABA_CLOUD_DB_CONNECTION'],
    optionalEnvVars: ['ALIBABA_CLOUD_DB_SECRET_REF'],
    purposes: ['metadata-ledger', 'address-verification-cache'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    docs: [DOCS.alibabaApiGateway],
    recommendedUse: ['regional commitment ledger', 'address verification cache'],
    caveats: ['Do not store raw AOID bodies or raw address logs.'],
  }),
  profile({
    id: 'alibaba-cloud-function-compute',
    provider: 'alibaba-cloud',
    label: 'Alibaba Cloud Function Compute',
    family: 'edge-compute',
    requiredEnvVars: ['ALIBABA_CLOUD_REGION'],
    optionalEnvVars: ['ALIBABA_CLOUD_FUNCTION_NAME'],
    purposes: ['serverless-adapter', 'webhook-event-dispatch'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.alibabaEventBridge],
    recommendedUse: ['regional serverless adapters', 'redacted webhook processing'],
    caveats: ['Function logs must be redacted and retention-limited.'],
  }),
  profile({
    id: 'alibaba-cloud-eventbridge',
    provider: 'alibaba-cloud',
    label: 'Alibaba Cloud EventBridge',
    family: 'event-queue',
    requiredEnvVars: ['ALIBABA_CLOUD_EVENT_BUS_NAME'],
    optionalEnvVars: ['ALIBABA_CLOUD_REGION'],
    purposes: ['webhook-event-dispatch', 'async-job-queue'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.alibabaEventBridge],
    recommendedUse: ['regional event dispatch', 'redacted address_intent and handoff events'],
    caveats: ['Publish commitments and aliases, not source address data.'],
  }),
  profile({
    id: 'alibaba-cloud-api-gateway',
    provider: 'alibaba-cloud',
    label: 'Alibaba Cloud API Gateway',
    family: 'api-gateway',
    requiredEnvVars: ['ALIBABA_CLOUD_API_GROUP_ID'],
    optionalEnvVars: ['ALIBABA_CLOUD_REGION'],
    purposes: ['api-gateway-rate-limit'],
    defaultPrivacyMode: 'organization-metadata-only',
    recommendedRuntime: 'server-side',
    docs: [DOCS.alibabaApiGateway],
    recommendedUse: ['regional API front door', 'rate limits for address lookup and registry endpoints'],
    caveats: ['Keep request and response body logging disabled or redacted.'],
  }),

  profile({
    id: 'tencent-cloud-cos',
    provider: 'tencent-cloud',
    label: 'Tencent Cloud COS',
    family: 'object-storage',
    requiredEnvVars: ['TENCENT_CLOUD_REGION', 'TENCENT_CLOUD_COS_BUCKET'],
    optionalEnvVars: ['TENCENT_CLOUD_KMS_KEY_ID'],
    purposes: ['encrypted-evidence-object', 'public-agid-cache'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.tencentDocs],
    recommendedUse: ['regional encrypted evidence storage', 'public cache bundles'],
    caveats: ['Run data residency and privacy review before private address evidence storage.'],
  }),
  profile({
    id: 'tencent-cloud-postgresql-tdsql',
    provider: 'tencent-cloud',
    label: 'TencentDB for PostgreSQL / TDSQL',
    family: 'relational-db',
    requiredEnvVars: ['TENCENT_CLOUD_REGION', 'TENCENT_CLOUD_DB_CONNECTION'],
    optionalEnvVars: ['TENCENT_CLOUD_DB_SECRET_REF'],
    purposes: ['metadata-ledger', 'address-verification-cache'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    docs: [DOCS.tencentCloudBase],
    recommendedUse: ['regional metadata ledger', 'verification cache'],
    caveats: ['Do not use raw address as partition keys or log values.'],
  }),
  profile({
    id: 'tencent-cloud-scf-cloudbase',
    provider: 'tencent-cloud',
    label: 'Tencent Cloud SCF / CloudBase',
    family: 'app-platform',
    requiredEnvVars: ['TENCENT_CLOUD_REGION'],
    optionalEnvVars: ['TENCENT_CLOUD_ENV_ID'],
    purposes: ['serverless-adapter', 'app-hosting', 'webhook-event-dispatch'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.tencentScf, DOCS.tencentCloudBase],
    recommendedUse: ['regional serverless adapters', 'private deployment app hosting'],
    caveats: ['CloudBase client keys must not authorize private address reads from browsers.'],
  }),
  profile({
    id: 'tencent-cloud-api-gateway',
    provider: 'tencent-cloud',
    label: 'Tencent Cloud API Gateway',
    family: 'api-gateway',
    requiredEnvVars: ['TENCENT_CLOUD_REGION'],
    optionalEnvVars: ['TENCENT_CLOUD_API_ID'],
    purposes: ['api-gateway-rate-limit'],
    defaultPrivacyMode: 'organization-metadata-only',
    recommendedRuntime: 'server-side',
    docs: [DOCS.tencentDocs],
    recommendedUse: ['regional API gateway and rate limits'],
    caveats: ['Request logging must be redacted before storing.'],
  }),

  profile({
    id: 'huawei-cloud-obs',
    provider: 'huawei-cloud',
    label: 'Huawei Cloud OBS',
    family: 'object-storage',
    requiredEnvVars: ['HUAWEI_CLOUD_REGION', 'HUAWEI_CLOUD_OBS_BUCKET'],
    optionalEnvVars: ['HUAWEI_CLOUD_KMS_KEY_ID'],
    purposes: ['encrypted-evidence-object', 'public-agid-cache'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [],
    recommendedUse: ['regional encrypted evidence storage', 'public cache bundles'],
    caveats: ['Run data residency review; keep object keys address-free.'],
  }),
  profile({
    id: 'huawei-cloud-gaussdb',
    provider: 'huawei-cloud',
    label: 'Huawei Cloud GaussDB',
    family: 'relational-db',
    requiredEnvVars: ['HUAWEI_CLOUD_REGION', 'HUAWEI_CLOUD_DB_CONNECTION'],
    optionalEnvVars: ['HUAWEI_CLOUD_DB_SECRET_REF'],
    purposes: ['metadata-ledger', 'address-verification-cache'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    docs: [],
    recommendedUse: ['regional metadata ledger', 'verification cache'],
    caveats: ['Do not store raw address or AOID bodies.'],
  }),
  profile({
    id: 'huawei-cloud-functiongraph',
    provider: 'huawei-cloud',
    label: 'Huawei Cloud FunctionGraph',
    family: 'edge-compute',
    requiredEnvVars: ['HUAWEI_CLOUD_REGION'],
    optionalEnvVars: ['HUAWEI_CLOUD_FUNCTION_NAME'],
    purposes: ['serverless-adapter', 'webhook-event-dispatch'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [],
    recommendedUse: ['regional serverless adapters', 'redacted webhook processing'],
    caveats: ['Logs must be redacted and retention-limited.'],
  }),

  profile({
    id: 'ibm-cloud-object-storage',
    provider: 'ibm-cloud',
    label: 'IBM Cloud Object Storage',
    family: 'object-storage',
    requiredEnvVars: ['IBM_COS_BUCKET', 'IBM_COS_ENDPOINT'],
    optionalEnvVars: ['IBM_KEY_PROTECT_KEY_ID'],
    purposes: ['encrypted-evidence-object', 'public-agid-cache'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.ibmCosKeyProtect],
    recommendedUse: ['encrypted evidence storage with Key Protect', 'public AGID cache bundles'],
    caveats: ['Use envelope encryption and keep object keys free of raw address text.'],
  }),
  profile({
    id: 'ibm-key-protect',
    provider: 'ibm-cloud',
    label: 'IBM Key Protect',
    family: 'secret-management',
    requiredEnvVars: ['IBM_KEY_PROTECT_INSTANCE_ID'],
    optionalEnvVars: ['IBM_KEY_PROTECT_KEY_ID'],
    purposes: ['secret-reference'],
    defaultPrivacyMode: 'secret-reference-only',
    recommendedRuntime: 'server-side',
    docs: [DOCS.ibmCosKeyProtect],
    recommendedUse: ['key references for encrypted evidence and AGID-S envelopes'],
    caveats: ['Store references only; never copy secret material into AGID records.'],
  }),
  profile({
    id: 'ibm-code-engine',
    provider: 'ibm-cloud',
    label: 'IBM Code Engine',
    family: 'app-platform',
    requiredEnvVars: ['IBM_CLOUD_REGION'],
    optionalEnvVars: ['IBM_CODE_ENGINE_PROJECT'],
    purposes: ['serverless-adapter', 'app-hosting', 'webhook-event-dispatch'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [],
    recommendedUse: ['containerized provider adapters and private deployment workers'],
    caveats: ['Apply redaction before platform logs.'],
  }),
  profile({
    id: 'ibm-cloudant',
    provider: 'ibm-cloud',
    label: 'IBM Cloudant',
    family: 'document-db',
    requiredEnvVars: ['IBM_CLOUDANT_URL'],
    optionalEnvVars: ['IBM_CLOUDANT_SERVICE_NAME'],
    purposes: ['metadata-ledger', 'settings-sync'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    docs: [],
    recommendedUse: ['document metadata, sync status, review queues'],
    caveats: ['Do not store raw address evidence in document records.'],
  }),

  profile({
    id: 'digitalocean-spaces',
    provider: 'digitalocean',
    label: 'DigitalOcean Spaces',
    family: 'object-storage',
    requiredEnvVars: ['DIGITALOCEAN_SPACES_BUCKET', 'DIGITALOCEAN_REGION'],
    optionalEnvVars: ['DIGITALOCEAN_SPACES_ENDPOINT'],
    purposes: ['encrypted-evidence-object', 'public-agid-cache'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.digitaloceanDocs],
    recommendedUse: ['simple encrypted evidence storage', 'public cache bundles'],
    caveats: ['Use private buckets and address-free object keys.'],
  }),
  profile({
    id: 'digitalocean-managed-postgres',
    provider: 'digitalocean',
    label: 'DigitalOcean Managed PostgreSQL',
    family: 'relational-db',
    requiredEnvVars: ['DIGITALOCEAN_POSTGRES_URL'],
    optionalEnvVars: ['DIGITALOCEAN_REGION'],
    purposes: ['metadata-ledger', 'address-verification-cache'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    docs: [DOCS.digitaloceanDocs],
    recommendedUse: ['small hosted registry metadata ledger', 'verification cache'],
    caveats: ['Use SSL and no raw address log table.'],
  }),
  profile({
    id: 'digitalocean-app-platform-functions',
    provider: 'digitalocean',
    label: 'DigitalOcean App Platform / Functions',
    family: 'app-platform',
    requiredEnvVars: ['DIGITALOCEAN_TOKEN'],
    optionalEnvVars: ['DIGITALOCEAN_APP_ID'],
    purposes: ['app-hosting', 'serverless-adapter', 'webhook-event-dispatch'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.digitaloceanAppPlatform, DOCS.digitaloceanDocs],
    recommendedUse: ['small hosted Registry API and webhook adapters'],
    caveats: ['Keep environment variables server-side and redact application logs.'],
  }),

  profile({
    id: 'vercel-blob',
    provider: 'vercel',
    label: 'Vercel Blob',
    family: 'object-storage',
    requiredEnvVars: ['BLOB_READ_WRITE_TOKEN'],
    optionalEnvVars: [],
    purposes: ['encrypted-evidence-object', 'public-agid-cache'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.vercelStorage, DOCS.vercelBlob],
    recommendedUse: ['encrypted artifacts from frontend-heavy deployments', 'public cache bundles'],
    caveats: ['Do not upload unencrypted address evidence from client components.'],
  }),
  profile({
    id: 'vercel-edge-config-marketplace-db',
    provider: 'vercel',
    label: 'Vercel Edge Config / Marketplace DB',
    family: 'kv-cache',
    requiredEnvVars: ['VERCEL_PROJECT_ID'],
    optionalEnvVars: ['EDGE_CONFIG'],
    purposes: ['public-agid-cache', 'settings-sync'],
    defaultPrivacyMode: 'public-edge-only',
    recommendedRuntime: 'edge-worker',
    docs: [DOCS.vercelStorage],
    recommendedUse: ['public feature flags and resolver cache pointers'],
    caveats: ['Use marketplace database adapters for private data, not Edge Config.'],
  }),
  profile({
    id: 'vercel-functions',
    provider: 'vercel',
    label: 'Vercel Functions',
    family: 'app-platform',
    requiredEnvVars: ['VERCEL_PROJECT_ID'],
    optionalEnvVars: [],
    purposes: ['serverless-adapter', 'webhook-event-dispatch', 'app-hosting'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.vercelStorage],
    recommendedUse: ['frontend-adjacent API routes and redacted webhook adapters'],
    caveats: ['Never expose provider secrets through client components.'],
  }),

  profile({
    id: 'supabase-postgres-auth-storage',
    provider: 'supabase',
    label: 'Supabase Postgres / Auth / Storage',
    family: 'app-platform',
    requiredEnvVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    optionalEnvVars: ['SUPABASE_SERVICE_ROLE_KEY'],
    purposes: ['metadata-ledger', 'encrypted-evidence-object', 'settings-sync', 'public-agid-cache'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.supabaseDocs],
    recommendedUse: ['Postgres-backed metadata ledger', 'RLS-protected encrypted evidence metadata', 'developer-friendly self-host-like setup'],
    caveats: ['Service role keys must be server-side only; RLS policies must deny raw address table reads by default.'],
  }),
  profile({
    id: 'supabase-edge-functions',
    provider: 'supabase',
    label: 'Supabase Edge Functions',
    family: 'edge-compute',
    requiredEnvVars: ['SUPABASE_URL'],
    optionalEnvVars: ['SUPABASE_SERVICE_ROLE_KEY'],
    purposes: ['serverless-adapter', 'webhook-event-dispatch'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    docs: [DOCS.supabaseEdgeFunctions],
    recommendedUse: ['webhooks, resolver adapters, review queue workers'],
    caveats: ['Service role keys and private address operations must remain server-side.'],
  }),

  profile({
    id: 'mongodb-atlas',
    provider: 'mongodb-atlas',
    label: 'MongoDB Atlas',
    family: 'document-db',
    requiredEnvVars: ['MONGODB_ATLAS_URI'],
    optionalEnvVars: ['MONGODB_ATLAS_PROJECT_ID'],
    purposes: ['metadata-ledger', 'address-verification-cache', 'settings-sync'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    docs: [DOCS.mongodbAtlas],
    recommendedUse: ['document metadata, review queues, AddressIntent state, geospatial metadata indexes'],
    caveats: ['Raw address and AOID bodies must be encrypted or excluded from collections.'],
  }),
  profile({
    id: 'snowflake',
    provider: 'snowflake',
    label: 'Snowflake',
    family: 'analytics-warehouse',
    requiredEnvVars: ['SNOWFLAKE_ACCOUNT', 'SNOWFLAKE_DATABASE'],
    optionalEnvVars: ['SNOWFLAKE_WAREHOUSE'],
    purposes: ['analytics-aggregate'],
    defaultPrivacyMode: 'aggregate-only',
    recommendedRuntime: 'dashboard-admin-only',
    docs: [DOCS.snowflakeDocs],
    recommendedUse: ['aggregate analytics and governed BI export'],
    caveats: ['No household-level export; use aggregation, k-anonymity, or differential privacy review.'],
  }),
  profile({
    id: 'databricks',
    provider: 'databricks',
    label: 'Databricks',
    family: 'lakehouse',
    requiredEnvVars: ['DATABRICKS_HOST'],
    optionalEnvVars: ['DATABRICKS_WAREHOUSE_ID'],
    purposes: ['lakehouse-aggregate', 'analytics-aggregate'],
    defaultPrivacyMode: 'aggregate-only',
    recommendedRuntime: 'dashboard-admin-only',
    docs: [DOCS.databricksDocs],
    recommendedUse: ['large-scale aggregate address quality tests', 'regional stress-test analytics'],
    caveats: ['Do not export raw address training data; only aggregate, redacted, or differentially private features.'],
  }),
];

const VALID_SERVICE_IDS = new Set(EXTENDED_CLOUD_SERVICE_PROFILES.map(profile => profile.id));
const VALID_PURPOSES = new Set<ExtendedCloudPurpose>([
  'edge-resolver',
  'api-gateway-rate-limit',
  'encrypted-evidence-object',
  'public-agid-cache',
  'address-verification-cache',
  'metadata-ledger',
  'encrypted-aoid-sync',
  'settings-sync',
  'webhook-event-dispatch',
  'async-job-queue',
  'secret-reference',
  'abuse-protection',
  'serverless-adapter',
  'analytics-aggregate',
  'lakehouse-aggregate',
  'app-hosting',
]);

const VALID_PAYLOAD_CLASSES = new Set<ExtendedCloudPayloadClass>([
  'none',
  'event-metadata',
  'organization-record',
  'public-agid-reference',
  'address-commitment',
  'encrypted-aoid-envelope',
  'redacted-address-summary',
  'plaintext-address',
  'document-image-or-pdf',
  'device-telemetry',
  'audit-digest',
  'security-alert',
  'analytics-aggregate',
  'secret-reference',
]);

const REGIONAL_REVIEW_PROVIDERS = new Set<ExtendedCloudProviderId>([
  'alibaba-cloud',
  'tencent-cloud',
  'huawei-cloud',
  'oci',
]);

function cleanIdentifier(value: unknown) {
  return cleanText(value, '', 160).normalize('NFKC').toLowerCase();
}

function normalizePayloadClass(value: unknown): ExtendedCloudPayloadClass {
  const cleaned = cleanIdentifier(value || 'none') as ExtendedCloudPayloadClass;
  return VALID_PAYLOAD_CLASSES.has(cleaned) ? cleaned : 'none';
}

function normalizePermissions(value: unknown): string[] {
  return [...new Set(cleanTextArray(value)
    .map(permission => permission.slice(0, 180))
    .filter(permission => /^[A-Za-z0-9_*:./@-]+$/.test(permission)))]
    .sort();
}

function cloneProfile(profile: ExtendedCloudServiceProfile): ExtendedCloudServiceProfile {
  return {
    ...profile,
    requiredEnvVars: [...profile.requiredEnvVars],
    optionalEnvVars: [...profile.optionalEnvVars],
    purposes: [...profile.purposes],
    docs: [...profile.docs],
    recommendedUse: [...profile.recommendedUse],
    caveats: [...profile.caveats],
  };
}

function isPrivatePayload(payloadClass: ExtendedCloudPayloadClass) {
  return payloadClass === 'address-commitment'
    || payloadClass === 'encrypted-aoid-envelope'
    || payloadClass === 'redacted-address-summary'
    || payloadClass === 'audit-digest'
    || payloadClass === 'secret-reference';
}

function isRawPayload(payloadClass: ExtendedCloudPayloadClass) {
  return payloadClass === 'plaintext-address'
    || payloadClass === 'document-image-or-pdf'
    || payloadClass === 'device-telemetry';
}

function modeAllowsPayload(profile: ExtendedCloudServiceProfile, payloadClass: ExtendedCloudPayloadClass) {
  if (payloadClass === 'none') return true;
  if (payloadClass === 'organization-record') return true;
  if (payloadClass === 'public-agid-reference') {
    return profile.defaultPrivacyMode === 'public-edge-only'
      || profile.defaultPrivacyMode === 'organization-metadata-only'
      || profile.defaultPrivacyMode === 'event-metadata-only'
      || profile.defaultPrivacyMode === 'encrypted-envelope-only';
  }
  if (payloadClass === 'event-metadata' || payloadClass === 'security-alert') {
    return profile.defaultPrivacyMode === 'event-metadata-only'
      || profile.defaultPrivacyMode === 'commitment-or-alias-only'
      || profile.defaultPrivacyMode === 'organization-metadata-only'
      || profile.defaultPrivacyMode === 'public-edge-only';
  }
  if (payloadClass === 'address-commitment' || payloadClass === 'redacted-address-summary' || payloadClass === 'audit-digest') {
    return profile.defaultPrivacyMode === 'commitment-or-alias-only'
      || profile.defaultPrivacyMode === 'event-metadata-only'
      || profile.defaultPrivacyMode === 'encrypted-envelope-only';
  }
  if (payloadClass === 'encrypted-aoid-envelope') {
    return profile.defaultPrivacyMode === 'encrypted-envelope-only'
      || profile.defaultPrivacyMode === 'commitment-or-alias-only';
  }
  if (payloadClass === 'analytics-aggregate') {
    return profile.defaultPrivacyMode === 'aggregate-only';
  }
  if (payloadClass === 'secret-reference') {
    return profile.defaultPrivacyMode === 'secret-reference-only';
  }
  return false;
}

export function listExtendedCloudServiceProfiles(): ExtendedCloudServiceProfile[] {
  return EXTENDED_CLOUD_SERVICE_PROFILES.map(cloneProfile);
}

export function listExtendedCloudProviders(): ExtendedCloudProviderId[] {
  return [...new Set(EXTENDED_CLOUD_SERVICE_PROFILES.map(profile => profile.provider))].sort();
}

export function getExtendedCloudServiceProfile(
  id: ExtendedCloudServiceId | string,
): ExtendedCloudServiceProfile | null {
  const cleaned = cleanIdentifier(id);
  const profile = EXTENDED_CLOUD_SERVICE_PROFILES.find(item => item.id === cleaned);
  return profile ? cloneProfile(profile) : null;
}

export function buildExtendedCloudIntegrationPlan(
  input: ExtendedCloudIntegrationPlanInput,
): ExtendedCloudIntegrationPlan {
  const serviceId = cleanIdentifier(input.serviceId);
  const service = getExtendedCloudServiceProfile(serviceId);
  const purpose = cleanIdentifier(input.purpose) as ExtendedCloudPurpose;
  const payloadClass = normalizePayloadClass(input.payloadClass);
  const ownerConsent = cleanBoolean(input.ownerConsent);
  const encryptedAtRest = cleanBoolean(input.encryptedAtRest);
  const encryptedInTransit = cleanBoolean(input.encryptedInTransit);
  const serverSideOnly = cleanBoolean(input.serverSideOnly);
  const highRiskMode = cleanBoolean(input.highRiskMode);
  const requestedPermissions = normalizePermissions(input.requestedPermissions);
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredControls = [
    'provider-adapter-contract-required',
    'no-provider-secret-in-browser',
    'no-raw-address-in-logs-or-telemetry',
    'domain-separated-aliases-and-commitments',
  ];

  if (!VALID_SERVICE_IDS.has(serviceId as ExtendedCloudServiceId) || !service) {
    errors.push('unknown-extended-cloud-service');
  }
  if (!VALID_PURPOSES.has(purpose)) {
    errors.push('unknown-extended-cloud-purpose');
  }
  if (service && !service.purposes.includes(purpose)) {
    errors.push('service-purpose-not-supported');
  }

  if (service?.recommendedRuntime === 'server-side' || service?.recommendedRuntime === 'dashboard-admin-only') {
    requiredControls.push('server-side-credentials-only');
  }
  if (service?.recommendedRuntime === 'edge-worker') {
    requiredControls.push('edge-log-redaction-before-emit');
  }
  if (service?.defaultPrivacyMode === 'encrypted-envelope-only') {
    requiredControls.push('owner-device-or-server-side-envelope-encryption-before-upload');
    requiredControls.push('object-key-must-not-contain-raw-address');
  }
  if (service?.defaultPrivacyMode === 'commitment-or-alias-only') {
    requiredControls.push('send-only-commitments-aliases-or-redacted-summaries');
  }
  if (service?.defaultPrivacyMode === 'event-metadata-only') {
    requiredControls.push('send-only-redacted-event-metadata');
  }
  if (service?.defaultPrivacyMode === 'secret-reference-only') {
    requiredControls.push('store-secret-reference-not-secret-value');
  }
  if (service?.defaultPrivacyMode === 'aggregate-only') {
    requiredControls.push('aggregate-or-differentially-private-export-only');
  }
  if (service?.defaultPrivacyMode === 'public-edge-only') {
    requiredControls.push('public-or-redacted-edge-data-only');
  }

  if (isRawPayload(payloadClass)) {
    errors.push('raw-payload-not-supported-by-extended-cloud-catalog');
  }
  if (service && !modeAllowsPayload(service, payloadClass)) {
    errors.push('payload-not-allowed-for-service-privacy-mode');
  }
  if (payloadClass === 'encrypted-aoid-envelope') {
    if (!ownerConsent) errors.push('owner-consent-required-for-encrypted-extended-cloud-sync');
    if (!encryptedAtRest) errors.push('encrypted-at-rest-required-for-encrypted-extended-cloud-sync');
    if (!encryptedInTransit) errors.push('encrypted-in-transit-required-for-encrypted-extended-cloud-sync');
  }
  if (isPrivatePayload(payloadClass) && !serverSideOnly && service?.recommendedRuntime !== 'edge-worker') {
    errors.push('server-side-or-worker-required-for-private-payload');
  }
  if (payloadClass === 'secret-reference' && service?.family !== 'secret-management') {
    warnings.push('secret-reference-is-best-handled-by-secret-management-service');
  }
  if (payloadClass === 'analytics-aggregate' && service?.defaultPrivacyMode !== 'aggregate-only') {
    errors.push('analytics-aggregate-requires-analytics-or-lakehouse-service');
  }
  if (payloadClass === 'event-metadata' && service?.family === 'object-storage') {
    warnings.push('event-metadata-is-usually-better-handled-by-event-or-queue-service');
  }

  if (service && REGIONAL_REVIEW_PROVIDERS.has(service.provider) && isPrivatePayload(payloadClass)) {
    warnings.push(`regional-data-residency-review-required:${service.provider}`);
  }
  if (highRiskMode) {
    requiredControls.push('high-risk-mode-no-precise-address-retention');
    requiredControls.push('prefer-local-or-self-hosted-path-before-extra-cloud');
    if (payloadClass !== 'event-metadata' && payloadClass !== 'public-agid-reference' && payloadClass !== 'analytics-aggregate') {
      warnings.push('high-risk-mode-prefers-local-self-hosted-or-agid-s');
    }
  }

  const recommendedPermissions = requestedPermissions;
  if (recommendedPermissions.some(permission => permission === '*' || permission.endsWith(':*'))) {
    warnings.push('broad-provider-permission-requires-admin-review');
  }

  const serverSideOnlyRequired = Boolean(service && (
    service.recommendedRuntime === 'server-side'
    || service.recommendedRuntime === 'dashboard-admin-only'
    || isPrivatePayload(payloadClass)
  ));

  return {
    modelVersion: CLOUD_SERVICE_EXPANSION_MODEL_VERSION,
    service,
    purpose,
    payloadClass,
    allowed: errors.length === 0,
    requiredEnvVars: service ? [...service.requiredEnvVars] : [],
    requiredControls: [...new Set(requiredControls)].sort(),
    recommendedPermissions,
    dataFlow: {
      sendsPlaintextAddressToProvider: false,
      sendsDocumentImageOrPdfToProvider: false,
      storesRawAddressInProvider: false,
      clientSecretAllowedInBrowser: false,
      serverSideOnlyRequired,
      highRiskModeCompatible: !highRiskMode || !isPrivatePayload(payloadClass),
    },
    errors,
    warnings: [...new Set(warnings)].sort(),
  };
}
