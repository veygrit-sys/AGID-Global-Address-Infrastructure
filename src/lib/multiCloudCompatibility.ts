export const MULTI_CLOUD_COMPATIBILITY_MODEL_VERSION = 'agid-multi-cloud-compatibility-v1';

export type CloudProviderId = 'local' | 'azure' | 'gcp' | 'aws';

export type MultiCloudWorkloadId =
  | 'identity-access'
  | 'credential-verification'
  | 'key-secret-management'
  | 'address-geocoding'
  | 'document-ocr'
  | 'event-bus'
  | 'async-queue'
  | 'serverless-runtime'
  | 'object-evidence-storage'
  | 'relational-ledger'
  | 'document-metadata-store'
  | 'analytics-dashboard'
  | 'observability-security'
  | 'api-gateway'
  | 'device-fleet'
  | 'notification';

export type MultiCloudDataSensitivity =
  | 'public-metadata'
  | 'commitment-only'
  | 'encrypted-envelope'
  | 'aggregate-only'
  | 'secret-reference'
  | 'ephemeral-plaintext';

export type MultiCloudMappingStatus = 'ready' | 'adapter-ready' | 'planned' | 'local-preferred';

export interface MultiCloudServiceMapping {
  readonly workload: MultiCloudWorkloadId;
  readonly provider: CloudProviderId;
  readonly serviceName: string;
  readonly adapterRef: string;
  readonly existingModule?: string;
  readonly dataSensitivity: MultiCloudDataSensitivity;
  readonly status: MultiCloudMappingStatus;
  readonly requiredControls: readonly string[];
  readonly notes: string;
}

export interface MultiCloudCompatibilityInput {
  readonly providers: readonly CloudProviderId[];
  readonly workloads: readonly MultiCloudWorkloadId[];
  readonly allowProviderPlaintext?: boolean;
  readonly highRiskMode?: boolean;
  readonly requireAwsParity?: boolean;
  readonly preferLocalForSecrets?: boolean;
}

export interface MultiCloudCompatibilityPlan {
  readonly version: typeof MULTI_CLOUD_COMPATIBILITY_MODEL_VERSION;
  readonly providers: readonly CloudProviderId[];
  readonly workloads: readonly MultiCloudWorkloadId[];
  readonly mappings: readonly MultiCloudServiceMapping[];
  readonly requiredControls: readonly string[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly allowed: boolean;
}

export interface MultiCloudValidationReport {
  readonly version: typeof MULTI_CLOUD_COMPATIBILITY_MODEL_VERSION;
  readonly workloadCount: number;
  readonly mappingCount: number;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

const CLOUD_PROVIDERS: readonly CloudProviderId[] = ['local', 'azure', 'gcp', 'aws'];

const WORKLOADS: readonly MultiCloudWorkloadId[] = [
  'identity-access',
  'credential-verification',
  'key-secret-management',
  'address-geocoding',
  'document-ocr',
  'event-bus',
  'async-queue',
  'serverless-runtime',
  'object-evidence-storage',
  'relational-ledger',
  'document-metadata-store',
  'analytics-dashboard',
  'observability-security',
  'api-gateway',
  'device-fleet',
  'notification',
];

const COMMON_EXTERNAL_CONTROLS = [
  'adapter-interface-required',
  'server-side-provider-call-by-default',
  'no-provider-secret-in-browser',
  'structured-audit-event-with-redaction',
] as const;

const NO_RAW_ADDRESS_CONTROLS = [
  'no-raw-address-provider-persistence',
  'store-commitment-or-encrypted-envelope',
  'domain-separated-purpose-scope',
] as const;

const MAPPINGS: readonly MultiCloudServiceMapping[] = [
  {
    workload: 'identity-access',
    provider: 'local',
    serviceName: 'Local RBAC + passkey policy',
    adapterRef: 'localAuthAdapter',
    dataSensitivity: 'commitment-only',
    status: 'ready',
    requiredControls: ['role-scope-policy', 'webauthn-or-device-key-for-sensitive-actions'],
    notes: 'Default OSS path for POS, offline mode, and self-hosted operators.',
  },
  {
    workload: 'identity-access',
    provider: 'azure',
    serviceName: 'Microsoft Entra ID / External ID',
    adapterRef: 'microsoft-entra-id',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'public-metadata',
    status: 'adapter-ready',
    requiredControls: ['no-address-claims-in-id-token', 'scope-based-address-access-policy'],
    notes: 'Best for enterprise RBAC, staff SSO, MFA, and issuer/admin access.',
  },
  {
    workload: 'identity-access',
    provider: 'gcp',
    serviceName: 'Google Identity Platform / Workspace identity',
    adapterRef: 'google-identity-platform',
    existingModule: 'src/lib/googleServiceIntegration.ts',
    dataSensitivity: 'public-metadata',
    status: 'adapter-ready',
    requiredControls: ['no-address-claims-in-id-token', 'organization-domain-allowlist'],
    notes: 'Best for Workspace-based staff access and operator consoles.',
  },
  {
    workload: 'identity-access',
    provider: 'aws',
    serviceName: 'Amazon Cognito / IAM Identity Center',
    adapterRef: 'aws-cognito-identity-center',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'public-metadata',
    status: 'adapter-ready',
    requiredControls: ['no-address-claims-in-id-token', 'role-scope-policy'],
    notes: 'AWS parity target for hosted Registry API, field apps, and private deployments.',
  },

  {
    workload: 'credential-verification',
    provider: 'local',
    serviceName: 'AOID credential verifier',
    adapterRef: 'localAoidCredentialVerifier',
    dataSensitivity: 'commitment-only',
    status: 'ready',
    requiredControls: ['issuer-trust-and-revocation-check', 'credential-status-without-raw-address'],
    notes: 'Local verification remains the default for OSS and high-risk deployments.',
  },
  {
    workload: 'credential-verification',
    provider: 'azure',
    serviceName: 'Microsoft Entra Verified ID',
    adapterRef: 'microsoft-entra-verified-id',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['credential-status-without-raw-address', 'issuer-trust-and-revocation-check'],
    notes: 'Enterprise VC integration for municipalities, NGOs, and carriers.',
  },
  {
    workload: 'credential-verification',
    provider: 'gcp',
    serviceName: 'Google identity-backed issuer verification',
    adapterRef: 'google-issuer-trust-adapter',
    existingModule: 'src/lib/googleServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'planned',
    requiredControls: ['credential-status-without-raw-address', 'issuer-trust-and-revocation-check'],
    notes: 'Uses Google identity and hosted metadata as an issuer trust bridge, not raw address storage.',
  },
  {
    workload: 'credential-verification',
    provider: 'aws',
    serviceName: 'AWS issuer trust adapter',
    adapterRef: 'aws-issuer-trust-adapter',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['credential-status-without-raw-address', 'issuer-trust-and-revocation-check'],
    notes: 'AWS parity target for credential status endpoints and private issuer registries.',
  },

  {
    workload: 'key-secret-management',
    provider: 'local',
    serviceName: 'Local OS keystore / encrypted env reference',
    adapterRef: 'localSecretReferenceStore',
    dataSensitivity: 'secret-reference',
    status: 'ready',
    requiredControls: ['store-secret-reference-not-secret-value', 'local-key-rotation-runbook'],
    notes: 'Use for air-gapped POS, disaster kits, and OSS self-hosting.',
  },
  {
    workload: 'key-secret-management',
    provider: 'azure',
    serviceName: 'Azure Key Vault',
    adapterRef: 'azure-key-vault',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'secret-reference',
    status: 'adapter-ready',
    requiredControls: ['store-secret-reference-not-secret-value', 'key-rotation-webhook-or-scheduled-check'],
    notes: 'Stores key references for AGID-S, issuer signing, webhook signatures, and POS device keys.',
  },
  {
    workload: 'key-secret-management',
    provider: 'gcp',
    serviceName: 'Cloud KMS / Secret Manager',
    adapterRef: 'google-cloud-kms-secret-manager',
    existingModule: 'src/lib/googleServiceIntegration.ts',
    dataSensitivity: 'secret-reference',
    status: 'adapter-ready',
    requiredControls: ['store-secret-reference-not-secret-value', 'key-rotation-webhook-or-scheduled-check'],
    notes: 'GCP equivalent for key references and secret references.',
  },
  {
    workload: 'key-secret-management',
    provider: 'aws',
    serviceName: 'AWS KMS / Secrets Manager / SSM Parameter Store',
    adapterRef: 'aws-kms-secrets-manager',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'secret-reference',
    status: 'adapter-ready',
    requiredControls: ['store-secret-reference-not-secret-value', 'key-rotation-webhook-or-scheduled-check'],
    notes: 'AWS equivalent for key references and server-side signing workflows.',
  },

  {
    workload: 'address-geocoding',
    provider: 'local',
    serviceName: 'Local Resolver + Pelias/Nominatim/libpostal',
    adapterRef: 'localAddressResolver',
    dataSensitivity: 'commitment-only',
    status: 'ready',
    requiredControls: ['prefer-local-geocoding-for-sensitive-addresses', 'source-license-attribution'],
    notes: 'Default OSS path for free operation and high-risk privacy modes.',
  },
  {
    workload: 'address-geocoding',
    provider: 'azure',
    serviceName: 'Azure Maps',
    adapterRef: 'azure-maps',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'ephemeral-plaintext',
    status: 'adapter-ready',
    requiredControls: ['owner-consent-required', 'ephemeral-request-no-provider-cache-assumption'],
    notes: 'Optional geocoding/reverse-geocoding provider; do not make it the canonical source of truth.',
  },
  {
    workload: 'address-geocoding',
    provider: 'gcp',
    serviceName: 'Google Maps Geocoding / Address Validation / Places',
    adapterRef: 'google-maps-geocoding',
    existingModule: 'src/lib/googleServiceIntegration.ts',
    dataSensitivity: 'ephemeral-plaintext',
    status: 'adapter-ready',
    requiredControls: ['owner-consent-required', 'ephemeral-provider-request-no-canonical-storage'],
    notes: 'Optional quality boost and comparison oracle for non-sensitive flows.',
  },
  {
    workload: 'address-geocoding',
    provider: 'aws',
    serviceName: 'Amazon Location Service',
    adapterRef: 'aws-location-service',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'ephemeral-plaintext',
    status: 'adapter-ready',
    requiredControls: ['owner-consent-required', 'ephemeral-request-no-provider-cache-assumption'],
    notes: 'AWS parity target for maps, places, geocoding, routing, tracking, and geofences.',
  },

  {
    workload: 'document-ocr',
    provider: 'local',
    serviceName: 'Local OCR import pipeline',
    adapterRef: 'localEvidenceOcr',
    dataSensitivity: 'encrypted-envelope',
    status: 'ready',
    requiredControls: ['owner-device-or-server-side-envelope-encryption-before-upload', 'ai-training-opt-in-required'],
    notes: 'Use first for uploaded address evidence, especially in high-risk mode.',
  },
  {
    workload: 'document-ocr',
    provider: 'azure',
    serviceName: 'Azure AI Document Intelligence',
    adapterRef: 'azure-ai-document-intelligence',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'ephemeral-plaintext',
    status: 'adapter-ready',
    requiredControls: ['owner-consent-required', 'document-retention-disabled-or-minimized'],
    notes: 'Optional OCR for PDFs, waybills, utility bills, and identity-adjacent documents.',
  },
  {
    workload: 'document-ocr',
    provider: 'gcp',
    serviceName: 'Document AI / Vision OCR',
    adapterRef: 'google-cloud-document-ai',
    existingModule: 'src/lib/googleServiceIntegration.ts',
    dataSensitivity: 'ephemeral-plaintext',
    status: 'adapter-ready',
    requiredControls: ['owner-consent-required', 'document-retention-disabled-or-minimized'],
    notes: 'Optional OCR with strict consent and no provider-side canonical address storage.',
  },
  {
    workload: 'document-ocr',
    provider: 'aws',
    serviceName: 'Amazon Textract',
    adapterRef: 'aws-textract',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'ephemeral-plaintext',
    status: 'adapter-ready',
    requiredControls: ['owner-consent-required', 'document-retention-disabled-or-minimized'],
    notes: 'AWS parity target for address evidence OCR and waybill extraction.',
  },

  {
    workload: 'event-bus',
    provider: 'local',
    serviceName: 'Local webhook dispatcher',
    adapterRef: 'localWebhookDispatcher',
    dataSensitivity: 'commitment-only',
    status: 'ready',
    requiredControls: ['signed-webhook-events', 'redacted-event-payloads'],
    notes: 'Works for Mode 0/1 and private deployments.',
  },
  {
    workload: 'event-bus',
    provider: 'azure',
    serviceName: 'Azure Event Grid',
    adapterRef: 'azure-event-grid',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['signed-webhook-events', 'redacted-event-payloads'],
    notes: 'Event backbone for address_intent, handoff, revocation, QR used, and device alerts.',
  },
  {
    workload: 'event-bus',
    provider: 'gcp',
    serviceName: 'Pub/Sub',
    adapterRef: 'google-pubsub',
    existingModule: 'src/lib/googleServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['signed-webhook-events', 'redacted-event-payloads'],
    notes: 'GCP event backbone for registry and workflow notifications.',
  },
  {
    workload: 'event-bus',
    provider: 'aws',
    serviceName: 'Amazon EventBridge / SNS',
    adapterRef: 'aws-eventbridge-sns',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['signed-webhook-events', 'redacted-event-payloads'],
    notes: 'AWS event backbone for Registry API, terminal events, and managed proof workflows.',
  },

  {
    workload: 'async-queue',
    provider: 'local',
    serviceName: 'Local durable sync queue',
    adapterRef: 'localSyncQueue',
    dataSensitivity: 'commitment-only',
    status: 'ready',
    requiredControls: ['idempotency-key-required', 'dead-letter-or-review-queue'],
    notes: 'Best for POS offline sync, disaster field kits, and local-first operation.',
  },
  {
    workload: 'async-queue',
    provider: 'azure',
    serviceName: 'Azure Service Bus',
    adapterRef: 'azure-service-bus',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['idempotency-key-required', 'dead-letter-or-review-queue'],
    notes: 'Queue for revocation sync, OCR jobs, evidence processing, and webhook retries.',
  },
  {
    workload: 'async-queue',
    provider: 'gcp',
    serviceName: 'Cloud Tasks / Pub/Sub',
    adapterRef: 'google-cloud-tasks-pubsub',
    existingModule: 'src/lib/googleServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'planned',
    requiredControls: ['idempotency-key-required', 'dead-letter-or-review-queue'],
    notes: 'GCP queue path for retryable jobs and fan-out processing.',
  },
  {
    workload: 'async-queue',
    provider: 'aws',
    serviceName: 'Amazon SQS',
    adapterRef: 'aws-sqs',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['idempotency-key-required', 'dead-letter-or-review-queue'],
    notes: 'AWS queue for decoupled registry, POS, OCR, and webhook jobs.',
  },

  {
    workload: 'serverless-runtime',
    provider: 'local',
    serviceName: 'Node worker / container runtime',
    adapterRef: 'localWorkerRuntime',
    dataSensitivity: 'commitment-only',
    status: 'ready',
    requiredControls: ['same-contract-openapi-handler', 'deterministic-redaction-before-log'],
    notes: 'Reference implementation for self-hosted API and adapters.',
  },
  {
    workload: 'serverless-runtime',
    provider: 'azure',
    serviceName: 'Azure Functions / Container Apps',
    adapterRef: 'azure-functions-container-apps',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'planned',
    requiredControls: ['same-contract-openapi-handler', 'deterministic-redaction-before-log'],
    notes: 'Azure runtime for hosted Registry API and adapter workers.',
  },
  {
    workload: 'serverless-runtime',
    provider: 'gcp',
    serviceName: 'Cloud Run / Cloud Functions',
    adapterRef: 'google-cloud-run-functions',
    existingModule: 'src/lib/googleServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['same-contract-openapi-handler', 'deterministic-redaction-before-log'],
    notes: 'GCP runtime for resolver, registry, OCR, and notification adapters.',
  },
  {
    workload: 'serverless-runtime',
    provider: 'aws',
    serviceName: 'AWS Lambda / ECS Fargate',
    adapterRef: 'aws-lambda-fargate',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['same-contract-openapi-handler', 'deterministic-redaction-before-log'],
    notes: 'AWS runtime for hosted adapters and registry worker jobs.',
  },

  {
    workload: 'object-evidence-storage',
    provider: 'local',
    serviceName: 'Local encrypted evidence vault',
    adapterRef: 'localEncryptedEvidenceVault',
    dataSensitivity: 'encrypted-envelope',
    status: 'ready',
    requiredControls: ['owner-device-or-server-side-envelope-encryption-before-upload', 'metadata-redaction'],
    notes: 'Default for OSS and sensitive address evidence.',
  },
  {
    workload: 'object-evidence-storage',
    provider: 'azure',
    serviceName: 'Azure Blob Storage',
    adapterRef: 'azure-blob',
    existingModule: 'src/lib/cloudDbIntegration.ts',
    dataSensitivity: 'encrypted-envelope',
    status: 'adapter-ready',
    requiredControls: ['owner-device-or-server-side-envelope-encryption-before-upload', 'metadata-redaction'],
    notes: 'Cloud object store for encrypted address evidence and waybill artifacts.',
  },
  {
    workload: 'object-evidence-storage',
    provider: 'gcp',
    serviceName: 'Cloud Storage',
    adapterRef: 'google-cloud-storage',
    existingModule: 'src/lib/cloudDbIntegration.ts',
    dataSensitivity: 'encrypted-envelope',
    status: 'adapter-ready',
    requiredControls: ['owner-device-or-server-side-envelope-encryption-before-upload', 'metadata-redaction'],
    notes: 'GCP object store for encrypted evidence envelopes.',
  },
  {
    workload: 'object-evidence-storage',
    provider: 'aws',
    serviceName: 'Amazon S3',
    adapterRef: 'aws-s3',
    existingModule: 'src/lib/cloudDbIntegration.ts',
    dataSensitivity: 'encrypted-envelope',
    status: 'adapter-ready',
    requiredControls: ['owner-device-or-server-side-envelope-encryption-before-upload', 'metadata-redaction'],
    notes: 'AWS object store already represented in cloud DB integration.',
  },

  {
    workload: 'relational-ledger',
    provider: 'local',
    serviceName: 'SQLite/Postgres local ledger',
    adapterRef: 'postgres',
    existingModule: 'src/lib/cloudDbIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'ready',
    requiredControls: ['event-sourcing-schema', 'no-plaintext-address-log-table'],
    notes: 'Use as the canonical relational contract for local and hosted modes.',
  },
  {
    workload: 'relational-ledger',
    provider: 'azure',
    serviceName: 'Azure Database for PostgreSQL / Azure SQL',
    adapterRef: 'azure-database-postgres',
    existingModule: 'src/lib/cloudDbIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['event-sourcing-schema', 'no-plaintext-address-log-table'],
    notes: 'Azure managed relational option for registry and audit ledgers.',
  },
  {
    workload: 'relational-ledger',
    provider: 'gcp',
    serviceName: 'Cloud SQL for PostgreSQL',
    adapterRef: 'google-cloud-sql-postgres',
    existingModule: 'src/lib/cloudDbIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['event-sourcing-schema', 'no-plaintext-address-log-table'],
    notes: 'GCP managed relational option.',
  },
  {
    workload: 'relational-ledger',
    provider: 'aws',
    serviceName: 'Amazon RDS / Aurora PostgreSQL',
    adapterRef: 'aws-rds-postgres',
    existingModule: 'src/lib/cloudDbIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['event-sourcing-schema', 'no-plaintext-address-log-table'],
    notes: 'AWS managed relational option already represented in cloud DB integration.',
  },

  {
    workload: 'document-metadata-store',
    provider: 'local',
    serviceName: 'Local document metadata store',
    adapterRef: 'localMetadataStore',
    dataSensitivity: 'commitment-only',
    status: 'ready',
    requiredControls: ['metadata-redaction', 'purpose-scoped-records'],
    notes: 'Local cache for address items, intents, device state, and review queues.',
  },
  {
    workload: 'document-metadata-store',
    provider: 'azure',
    serviceName: 'Azure Cosmos DB',
    adapterRef: 'azure-cosmos-db',
    existingModule: 'src/lib/cloudDbIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['metadata-redaction', 'purpose-scoped-records'],
    notes: 'Document-style metadata without raw address storage.',
  },
  {
    workload: 'document-metadata-store',
    provider: 'gcp',
    serviceName: 'Firestore',
    adapterRef: 'firestore',
    existingModule: 'src/lib/cloudDbIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['metadata-redaction', 'purpose-scoped-records'],
    notes: 'Document metadata for Address Dashboard, Portal, and POS state.',
  },
  {
    workload: 'document-metadata-store',
    provider: 'aws',
    serviceName: 'DynamoDB',
    adapterRef: 'dynamodb',
    existingModule: 'src/lib/cloudDbIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['metadata-redaction', 'purpose-scoped-records'],
    notes: 'AWS metadata store already represented in cloud DB integration.',
  },

  {
    workload: 'analytics-dashboard',
    provider: 'local',
    serviceName: 'Local aggregate metrics export',
    adapterRef: 'localAggregateMetrics',
    dataSensitivity: 'aggregate-only',
    status: 'ready',
    requiredControls: ['aggregate-only-export', 'differential-privacy-review-for-public-reports'],
    notes: 'OSS analytics must use aggregate metrics without personal address leakage.',
  },
  {
    workload: 'analytics-dashboard',
    provider: 'azure',
    serviceName: 'Microsoft Fabric / Power BI',
    adapterRef: 'microsoft-fabric-power-bi',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'aggregate-only',
    status: 'adapter-ready',
    requiredControls: ['aggregate-only-export', 'differential-privacy-review-for-public-reports'],
    notes: 'Enterprise dashboards for delivery success, POS latency, address quality, and device health.',
  },
  {
    workload: 'analytics-dashboard',
    provider: 'gcp',
    serviceName: 'BigQuery / Looker Studio',
    adapterRef: 'google-bigquery-looker',
    existingModule: 'src/lib/googleServiceIntegration.ts',
    dataSensitivity: 'aggregate-only',
    status: 'adapter-ready',
    requiredControls: ['aggregate-only-export', 'differential-privacy-review-for-public-reports'],
    notes: 'GCP analytics path for redacted aggregates.',
  },
  {
    workload: 'analytics-dashboard',
    provider: 'aws',
    serviceName: 'Redshift / QuickSight',
    adapterRef: 'aws-redshift-quicksight',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'aggregate-only',
    status: 'adapter-ready',
    requiredControls: ['aggregate-only-export', 'differential-privacy-review-for-public-reports'],
    notes: 'AWS analytics parity target for redacted aggregates.',
  },

  {
    workload: 'observability-security',
    provider: 'local',
    serviceName: 'Local redacted audit log',
    adapterRef: 'localSecurityAuditLog',
    dataSensitivity: 'commitment-only',
    status: 'ready',
    requiredControls: ['deterministic-redaction-before-log', 'tamper-evident-log-digest'],
    notes: 'Minimum operational security layer for self-hosting.',
  },
  {
    workload: 'observability-security',
    provider: 'azure',
    serviceName: 'Azure Monitor / Microsoft Sentinel / Defender for Cloud',
    adapterRef: 'azure-monitor-sentinel-defender',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['deterministic-redaction-before-log', 'tamper-evident-log-digest'],
    notes: 'Enterprise monitoring and abuse detection without raw address logs.',
  },
  {
    workload: 'observability-security',
    provider: 'gcp',
    serviceName: 'Cloud Logging / Monitoring / Security Command Center',
    adapterRef: 'google-cloud-observability-security',
    existingModule: 'src/lib/googleServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'planned',
    requiredControls: ['deterministic-redaction-before-log', 'tamper-evident-log-digest'],
    notes: 'GCP monitoring and security posture path.',
  },
  {
    workload: 'observability-security',
    provider: 'aws',
    serviceName: 'CloudWatch / Security Hub / GuardDuty',
    adapterRef: 'aws-cloudwatch-securityhub-guardduty',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['deterministic-redaction-before-log', 'tamper-evident-log-digest'],
    notes: 'AWS monitoring and threat detection parity target.',
  },

  {
    workload: 'api-gateway',
    provider: 'local',
    serviceName: 'Express/OpenAPI gateway',
    adapterRef: 'localOpenApiGateway',
    dataSensitivity: 'public-metadata',
    status: 'ready',
    requiredControls: ['rate-limit-and-abuse-control', 'signed-webhook-events', 'openapi-contract-tests'],
    notes: 'Reference gateway for OSS and local development.',
  },
  {
    workload: 'api-gateway',
    provider: 'azure',
    serviceName: 'Azure API Management',
    adapterRef: 'azure-api-management',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'public-metadata',
    status: 'adapter-ready',
    requiredControls: ['rate-limit-and-abuse-control', 'signed-webhook-events', 'openapi-contract-tests'],
    notes: 'Hosted Registry API, resolver, and MCP gateway option.',
  },
  {
    workload: 'api-gateway',
    provider: 'gcp',
    serviceName: 'Apigee / API Gateway',
    adapterRef: 'google-apigee-api-gateway',
    dataSensitivity: 'public-metadata',
    status: 'planned',
    requiredControls: ['rate-limit-and-abuse-control', 'signed-webhook-events', 'openapi-contract-tests'],
    notes: 'GCP gateway for API keys, quotas, and developer portal.',
  },
  {
    workload: 'api-gateway',
    provider: 'aws',
    serviceName: 'Amazon API Gateway',
    adapterRef: 'aws-api-gateway',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'public-metadata',
    status: 'adapter-ready',
    requiredControls: ['rate-limit-and-abuse-control', 'signed-webhook-events', 'openapi-contract-tests'],
    notes: 'AWS gateway for REST, HTTP, and WebSocket APIs.',
  },

  {
    workload: 'device-fleet',
    provider: 'local',
    serviceName: 'Local terminal/device registry',
    adapterRef: 'localDeviceRegistry',
    dataSensitivity: 'commitment-only',
    status: 'ready',
    requiredControls: ['per-device-identity-and-key-rotation', 'device-telemetry-redaction'],
    notes: 'Local terminal, NFC, printer, scale, locker, and drone registry.',
  },
  {
    workload: 'device-fleet',
    provider: 'azure',
    serviceName: 'Azure IoT Hub',
    adapterRef: 'azure-iot-hub',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['per-device-identity-and-key-rotation', 'device-telemetry-redaction'],
    notes: 'Strong fit for POS terminals, lockers, sensors, measuring instruments, and drones.',
  },
  {
    workload: 'device-fleet',
    provider: 'gcp',
    serviceName: 'Pub/Sub + Cloud Run device adapter',
    adapterRef: 'google-device-telemetry-adapter',
    dataSensitivity: 'commitment-only',
    status: 'planned',
    requiredControls: ['per-device-identity-and-key-rotation', 'device-telemetry-redaction'],
    notes: 'Use a custom device adapter on GCP instead of binding the core to one IoT product.',
  },
  {
    workload: 'device-fleet',
    provider: 'aws',
    serviceName: 'AWS IoT Core',
    adapterRef: 'aws-iot-core',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['per-device-identity-and-key-rotation', 'device-telemetry-redaction'],
    notes: 'AWS parity target for POS terminals, smart lockers, drones, and field hardware.',
  },

  {
    workload: 'notification',
    provider: 'local',
    serviceName: 'Local notification outbox',
    adapterRef: 'localNotificationOutbox',
    dataSensitivity: 'commitment-only',
    status: 'ready',
    requiredControls: ['send-only-commitments-aliases-or-redacted-summaries', 'short-lived-link-or-alias'],
    notes: 'Default notification abstraction; delivery channel is replaceable.',
  },
  {
    workload: 'notification',
    provider: 'azure',
    serviceName: 'Azure Communication Services / Teams',
    adapterRef: 'azure-communication-services',
    existingModule: 'src/lib/microsoftServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['send-only-commitments-aliases-or-redacted-summaries', 'short-lived-link-or-alias'],
    notes: 'SMS, email, voice, and Teams notifications with no raw address in the message body.',
  },
  {
    workload: 'notification',
    provider: 'gcp',
    serviceName: 'Firebase Cloud Messaging / Gmail / Chat',
    adapterRef: 'firebase-cloud-messaging',
    existingModule: 'src/lib/googleServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['send-only-commitments-aliases-or-redacted-summaries', 'short-lived-link-or-alias'],
    notes: 'Push and Workspace notifications with redacted payloads.',
  },
  {
    workload: 'notification',
    provider: 'aws',
    serviceName: 'Amazon SNS / SES',
    adapterRef: 'aws-sns-ses',
    existingModule: 'src/lib/awsServiceIntegration.ts',
    dataSensitivity: 'commitment-only',
    status: 'adapter-ready',
    requiredControls: ['send-only-commitments-aliases-or-redacted-summaries', 'short-lived-link-or-alias'],
    notes: 'AWS notification parity target for SMS/email/event fan-out.',
  },
];

const dedupe = (values: Iterable<string>): string[] => Array.from(new Set(values)).sort();

const normalizeProviders = (providers: readonly CloudProviderId[]): CloudProviderId[] =>
  dedupe(providers).filter((provider): provider is CloudProviderId =>
    CLOUD_PROVIDERS.includes(provider as CloudProviderId),
  );

const normalizeWorkloads = (workloads: readonly MultiCloudWorkloadId[]): MultiCloudWorkloadId[] =>
  dedupe(workloads).filter((workload): workload is MultiCloudWorkloadId =>
    WORKLOADS.includes(workload as MultiCloudWorkloadId),
  );

export const listCloudProviders = (): readonly CloudProviderId[] => CLOUD_PROVIDERS;

export const listMultiCloudWorkloads = (): readonly MultiCloudWorkloadId[] => WORKLOADS;

export const listMultiCloudServiceMappings = (): readonly MultiCloudServiceMapping[] => MAPPINGS;

export const getMultiCloudWorkloadMatrix = (
  workload: MultiCloudWorkloadId,
): readonly MultiCloudServiceMapping[] => MAPPINGS.filter(mapping => mapping.workload === workload);

export const buildMultiCloudCompatibilityPlan = (
  input: MultiCloudCompatibilityInput,
): MultiCloudCompatibilityPlan => {
  const providers = normalizeProviders(input.providers);
  const workloads = normalizeWorkloads(input.workloads);
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const provider of input.providers) {
    if (!CLOUD_PROVIDERS.includes(provider)) {
      errors.push(`unsupported-provider:${provider}`);
    }
  }

  for (const workload of input.workloads) {
    if (!WORKLOADS.includes(workload)) {
      errors.push(`unsupported-workload:${workload}`);
    }
  }

  const mappings = workloads.flatMap(workload =>
    providers.flatMap(provider => {
      const mapping = MAPPINGS.find(candidate => candidate.workload === workload && candidate.provider === provider);
      if (!mapping) {
        errors.push(`missing-mapping:${provider}:${workload}`);
        return [];
      }
      return [mapping];
    }),
  );

  for (const mapping of mappings) {
    if (mapping.dataSensitivity === 'ephemeral-plaintext' && !input.allowProviderPlaintext) {
      errors.push(`provider-plaintext-disabled:${mapping.provider}:${mapping.workload}`);
    }
    if (input.highRiskMode && mapping.dataSensitivity === 'ephemeral-plaintext') {
      warnings.push(`high-risk-mode-prefers-local-or-encrypted-adapter:${mapping.provider}:${mapping.workload}`);
    }
    if (input.preferLocalForSecrets && mapping.workload === 'key-secret-management' && mapping.provider !== 'local') {
      warnings.push(`secret-management-provider-is-external:${mapping.provider}`);
    }
  }

  if (input.requireAwsParity) {
    for (const workload of workloads) {
      const awsMapping = MAPPINGS.find(mapping => mapping.workload === workload && mapping.provider === 'aws');
      if (!awsMapping) {
        errors.push(`aws-parity-missing:${workload}`);
      } else if (awsMapping.status === 'planned') {
        warnings.push(`aws-parity-planned-not-implemented:${workload}`);
      }
    }
  }

  const requiredControls = dedupe([
    ...COMMON_EXTERNAL_CONTROLS,
    ...mappings.flatMap(mapping => mapping.requiredControls),
    ...mappings.flatMap(mapping =>
      mapping.dataSensitivity === 'ephemeral-plaintext' ? NO_RAW_ADDRESS_CONTROLS : [],
    ),
  ]);

  return {
    version: MULTI_CLOUD_COMPATIBILITY_MODEL_VERSION,
    providers,
    workloads,
    mappings,
    requiredControls,
    warnings: dedupe(warnings),
    errors: dedupe(errors),
    allowed: errors.length === 0,
  };
};

export const validateMultiCloudCompatibility = (): MultiCloudValidationReport => {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const workload of WORKLOADS) {
    for (const provider of CLOUD_PROVIDERS) {
      if (!MAPPINGS.some(mapping => mapping.workload === workload && mapping.provider === provider)) {
        errors.push(`missing-mapping:${provider}:${workload}`);
      }
    }
  }

  const readyLikeStatuses: readonly MultiCloudMappingStatus[] = ['ready', 'adapter-ready', 'local-preferred'];
  for (const workload of WORKLOADS) {
    const matrix = getMultiCloudWorkloadMatrix(workload);
    const hasLocalReady = matrix.some(
      mapping => mapping.provider === 'local' && readyLikeStatuses.includes(mapping.status),
    );
    const hasAtLeastOneCloudReady = matrix.some(
      mapping => mapping.provider !== 'local' && readyLikeStatuses.includes(mapping.status),
    );

    if (!hasLocalReady) {
      errors.push(`local-ready-mapping-required:${workload}`);
    }
    if (!hasAtLeastOneCloudReady) {
      warnings.push(`cloud-adapter-not-ready:${workload}`);
    }
  }

  for (const mapping of MAPPINGS) {
    if (
      mapping.dataSensitivity === 'ephemeral-plaintext' &&
      !mapping.requiredControls.includes('owner-consent-required')
    ) {
      errors.push(`plaintext-mapping-missing-consent-control:${mapping.provider}:${mapping.workload}`);
    }
  }

  return {
    version: MULTI_CLOUD_COMPATIBILITY_MODEL_VERSION,
    workloadCount: WORKLOADS.length,
    mappingCount: MAPPINGS.length,
    warnings: dedupe(warnings),
    errors: dedupe(errors),
  };
};

export const renderMultiCloudCompatibilityMermaid = (): string => `flowchart LR
  Core["AGID Core Contracts<br/>AddressIntent / AOID / AGID-S / Resolver"]
  Local["Local OSS<br/>Mode 0/1"]
  Azure["Azure<br/>Entra, Maps, Key Vault, Event Grid, IoT Hub"]
  GCP["GCP<br/>Identity, Maps, KMS, Pub/Sub, Cloud Run"]
  AWS["AWS<br/>Cognito, Location, KMS, S3, EventBridge"]
  Controls["Shared Controls<br/>redaction, commitments, scopes, audit"]
  Core --> Controls
  Controls --> Local
  Controls --> Azure
  Controls --> GCP
  Controls --> AWS
`;
