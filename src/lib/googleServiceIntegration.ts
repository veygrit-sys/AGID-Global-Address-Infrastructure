import {
  cleanBoolean,
  cleanText,
  cleanTextArray,
} from './redactedWorkflowCore';

export const GOOGLE_SERVICE_INTEGRATION_MODEL_VERSION = 'google-service-integration-v1';

export type GoogleServiceFamily =
  | 'identity-workspace'
  | 'maps-platform'
  | 'cloud-ai'
  | 'cloud-security'
  | 'cloud-events'
  | 'cloud-compute'
  | 'cloud-storage'
  | 'cloud-database'
  | 'analytics-monitoring'
  | 'firebase';

export type GoogleServiceId =
  | 'google-identity-platform'
  | 'google-workspace-admin-sdk'
  | 'google-gmail-api'
  | 'google-drive-api'
  | 'google-sheets-api'
  | 'google-calendar-api'
  | 'google-chat-api'
  | 'google-maps-address-validation'
  | 'google-maps-geocoding'
  | 'google-maps-places'
  | 'google-maps-routes'
  | 'google-cloud-document-ai'
  | 'google-cloud-vision-ocr'
  | 'google-cloud-translation'
  | 'google-cloud-kms'
  | 'google-secret-manager'
  | 'google-cloud-storage'
  | 'google-pubsub'
  | 'google-cloud-tasks'
  | 'google-cloud-run'
  | 'google-firestore'
  | 'google-cloud-sql-postgres'
  | 'google-bigquery'
  | 'google-cloud-logging-monitoring'
  | 'firebase-cloud-messaging'
  | 'recaptcha-enterprise';

export type GoogleIntegrationPurpose =
  | 'staff-sso'
  | 'workspace-directory-sync'
  | 'gmail-redacted-notification'
  | 'drive-evidence-vault'
  | 'sheets-redacted-export'
  | 'calendar-handoff-schedule'
  | 'chat-operator-alert'
  | 'address-validation'
  | 'geocode'
  | 'reverse-geocode'
  | 'place-search'
  | 'route-eta'
  | 'pickup-route-planning'
  | 'document-ocr-address-import'
  | 'image-ocr-address-import'
  | 'address-translation'
  | 'kms-key-reference'
  | 'secret-reference'
  | 'encrypted-evidence-object'
  | 'webhook-event-dispatch'
  | 'async-job-queue'
  | 'serverless-adapter'
  | 'address-verification-cache'
  | 'metadata-ledger'
  | 'analytics-aggregate'
  | 'audit-monitoring'
  | 'push-notification'
  | 'abuse-protection';

export type GoogleConnectorCapability =
  | 'oauth-oidc'
  | 'workspace-api'
  | 'directory'
  | 'mail-send'
  | 'files'
  | 'sheets'
  | 'calendar'
  | 'chat-alert'
  | 'address-validation'
  | 'geocode'
  | 'reverse-geocode'
  | 'places'
  | 'routes'
  | 'document-ocr'
  | 'image-ocr'
  | 'translation'
  | 'key-management'
  | 'secret-management'
  | 'event-publish'
  | 'queue'
  | 'serverless-handler'
  | 'object-storage'
  | 'document-db'
  | 'sql-postgres'
  | 'warehouse-analytics'
  | 'logging-monitoring'
  | 'push'
  | 'abuse-control';

export type GooglePayloadClass =
  | 'none'
  | 'event-metadata'
  | 'organization-record'
  | 'public-agid-reference'
  | 'address-commitment'
  | 'encrypted-aoid-envelope'
  | 'redacted-address-summary'
  | 'plaintext-address'
  | 'document-image-or-pdf'
  | 'route-waypoint-addresses'
  | 'place-query'
  | 'translation-text'
  | 'secret-reference'
  | 'analytics-aggregate';

export type GooglePrivacyMode =
  | 'organization-metadata-only'
  | 'commitment-or-alias-only'
  | 'event-metadata-only'
  | 'encrypted-envelope-only'
  | 'ephemeral-plaintext-required'
  | 'secret-reference-only'
  | 'aggregate-only';

export type GoogleRecommendedRuntime =
  | 'server-side'
  | 'server-side-or-worker'
  | 'browser-restricted-key-allowed'
  | 'dashboard-admin-only';

export type GoogleServiceProfile = {
  id: GoogleServiceId;
  label: string;
  family: GoogleServiceFamily;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  capabilities: GoogleConnectorCapability[];
  purposes: GoogleIntegrationPurpose[];
  defaultPrivacyMode: GooglePrivacyMode;
  recommendedRuntime: GoogleRecommendedRuntime;
  requiresGoogleCloudProject: boolean;
  requiresOAuthClient: boolean;
  recommendedScopes: string[];
  docs: string[];
  recommendedUse: string[];
  caveats: string[];
};

export type GoogleIntegrationPlanInput = {
  serviceId: GoogleServiceId | string;
  purpose: GoogleIntegrationPurpose | string;
  payloadClass?: GooglePayloadClass | string;
  ownerConsent?: boolean;
  encryptedAtRest?: boolean;
  encryptedInTransit?: boolean;
  serverSideOnly?: boolean;
  highRiskMode?: boolean;
  requestedScopes?: unknown;
};

export type GoogleIntegrationPlan = {
  modelVersion: typeof GOOGLE_SERVICE_INTEGRATION_MODEL_VERSION;
  service: GoogleServiceProfile | null;
  purpose: string;
  payloadClass: GooglePayloadClass;
  allowed: boolean;
  requiredEnvVars: string[];
  requiredControls: string[];
  recommendedScopes: string[];
  dataFlow: {
    sendsPlaintextAddressToGoogle: boolean;
    sendsDocumentImageOrPdfToGoogle: boolean;
    storesRawAddressInGoogle: boolean;
    clientSecretAllowedInBrowser: false;
    serverSideOnlyRequired: boolean;
    highRiskModeCompatible: boolean;
  };
  errors: string[];
  warnings: string[];
};

const GOOGLE_DOCS = {
  workspaceEnableApis: 'https://developers.google.com/workspace/guides/enable-apis',
  adminSdk: 'https://developers.google.com/admin-sdk',
  gmail: 'https://developers.google.com/gmail/api/guides',
  drive: 'https://developers.google.com/drive/api/guides/about-sdk',
  sheets: 'https://developers.google.com/sheets/api/guides/concepts',
  calendar: 'https://developers.google.com/workspace/calendar/api/guides/overview',
  chat: 'https://developers.google.com/workspace/chat',
  identityPlatform: 'https://cloud.google.com/identity-platform/docs',
  addressValidation: 'https://developers.google.com/maps/documentation/address-validation/overview',
  geocoding: 'https://developers.google.com/maps/documentation/geocoding',
  places: 'https://developers.google.com/maps/documentation/places/web-service/overview',
  routes: 'https://developers.google.com/maps/documentation/routes',
  documentAi: 'https://cloud.google.com/document-ai',
  documentAiOcr: 'https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr',
  visionOcr: 'https://cloud.google.com/vision/docs/ocr',
  translation: 'https://cloud.google.com/translate/docs',
  kms: 'https://docs.cloud.google.com/kms/docs',
  secretManager: 'https://cloud.google.com/secret-manager/docs',
  storage: 'https://docs.cloud.google.com/storage/docs',
  pubsub: 'https://docs.cloud.google.com/pubsub/docs',
  tasks: 'https://cloud.google.com/tasks/docs',
  run: 'https://cloud.google.com/run/docs',
  firestore: 'https://firebase.google.com/docs/firestore',
  cloudSql: 'https://cloud.google.com/sql/docs/postgres',
  bigquery: 'https://cloud.google.com/bigquery/docs',
  logging: 'https://cloud.google.com/logging/docs',
  monitoring: 'https://cloud.google.com/monitoring/docs',
  fcm: 'https://firebase.google.com/docs/cloud-messaging',
  recaptcha: 'https://cloud.google.com/recaptcha/docs',
};

const GOOGLE_SERVICE_PROFILES: GoogleServiceProfile[] = [
  {
    id: 'google-identity-platform',
    label: 'Google Cloud Identity Platform',
    family: 'identity-workspace',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT'],
    optionalEnvVars: ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET'],
    capabilities: ['oauth-oidc'],
    purposes: ['staff-sso'],
    defaultPrivacyMode: 'organization-metadata-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: true,
    recommendedScopes: ['openid', 'email', 'profile'],
    docs: [GOOGLE_DOCS.identityPlatform],
    recommendedUse: [
      'staff SSO for POS, locker, dashboard, and private deployment operators',
      'operator authentication for Address Access/Auth policy checks',
    ],
    caveats: [
      'Do not put OAuth client secrets in browser builds.',
      'Keep address authorization scopes separate from login identity.',
    ],
  },
  {
    id: 'google-workspace-admin-sdk',
    label: 'Google Workspace Admin SDK',
    family: 'identity-workspace',
    requiredEnvVars: ['GOOGLE_WORKSPACE_CUSTOMER_ID'],
    optionalEnvVars: ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_SERVICE_ACCOUNT_EMAIL'],
    capabilities: ['workspace-api', 'directory'],
    purposes: ['workspace-directory-sync', 'staff-sso', 'audit-monitoring'],
    defaultPrivacyMode: 'organization-metadata-only',
    recommendedRuntime: 'dashboard-admin-only',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: true,
    recommendedScopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
    docs: [GOOGLE_DOCS.workspaceEnableApis, GOOGLE_DOCS.adminSdk],
    recommendedUse: [
      'sync staff and operator group metadata',
      'map staff roles to POS, locker, and dashboard permissions',
    ],
    caveats: [
      'Requires Workspace administrator review.',
      'Do not sync personal address books into AGID/AOID by default.',
    ],
  },
  {
    id: 'google-gmail-api',
    label: 'Gmail API',
    family: 'identity-workspace',
    requiredEnvVars: ['GOOGLE_OAUTH_CLIENT_ID'],
    optionalEnvVars: ['GOOGLE_OAUTH_CLIENT_SECRET'],
    capabilities: ['workspace-api', 'mail-send'],
    purposes: ['gmail-redacted-notification'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: true,
    recommendedScopes: ['https://www.googleapis.com/auth/gmail.send'],
    docs: [GOOGLE_DOCS.gmail],
    recommendedUse: [
      'send redacted delivery, review, or credential notifications',
      'send short-lived aliases rather than raw addresses',
    ],
    caveats: [
      'Email body must not include raw address, proof code, AGID-S key material, or phone number.',
    ],
  },
  {
    id: 'google-drive-api',
    label: 'Google Drive API',
    family: 'identity-workspace',
    requiredEnvVars: ['GOOGLE_OAUTH_CLIENT_ID'],
    optionalEnvVars: ['GOOGLE_OAUTH_CLIENT_SECRET'],
    capabilities: ['workspace-api', 'files'],
    purposes: ['drive-evidence-vault'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: true,
    recommendedScopes: ['https://www.googleapis.com/auth/drive.file'],
    docs: [GOOGLE_DOCS.drive],
    recommendedUse: [
      'store encrypted address evidence envelopes when an organization already uses Drive',
      'export redacted review bundles by alias',
    ],
    caveats: [
      'Drive is not the canonical AGID/AOID ledger.',
      'Plain address documents should be encrypted before upload.',
    ],
  },
  {
    id: 'google-sheets-api',
    label: 'Google Sheets API',
    family: 'identity-workspace',
    requiredEnvVars: ['GOOGLE_OAUTH_CLIENT_ID'],
    optionalEnvVars: ['GOOGLE_OAUTH_CLIENT_SECRET'],
    capabilities: ['workspace-api', 'sheets'],
    purposes: ['sheets-redacted-export', 'analytics-aggregate'],
    defaultPrivacyMode: 'aggregate-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: true,
    recommendedScopes: ['https://www.googleapis.com/auth/spreadsheets'],
    docs: [GOOGLE_DOCS.sheets],
    recommendedUse: [
      'export aggregate quality, POS, and locker operational summaries',
      'share non-personal review queue metrics',
    ],
    caveats: [
      'Do not export row-level recipient addresses or proof material.',
    ],
  },
  {
    id: 'google-calendar-api',
    label: 'Google Calendar API',
    family: 'identity-workspace',
    requiredEnvVars: ['GOOGLE_OAUTH_CLIENT_ID'],
    optionalEnvVars: ['GOOGLE_OAUTH_CLIENT_SECRET'],
    capabilities: ['workspace-api', 'calendar'],
    purposes: ['calendar-handoff-schedule'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: true,
    recommendedScopes: ['https://www.googleapis.com/auth/calendar.events'],
    docs: [GOOGLE_DOCS.calendar],
    recommendedUse: [
      'schedule pickup, locker maintenance, review, or field handoff windows',
      'attach redacted case aliases rather than raw addresses',
    ],
    caveats: [
      'Calendar event location fields must use public site names or aliases only.',
    ],
  },
  {
    id: 'google-chat-api',
    label: 'Google Chat API',
    family: 'identity-workspace',
    requiredEnvVars: ['GOOGLE_OAUTH_CLIENT_ID'],
    optionalEnvVars: ['GOOGLE_OAUTH_CLIENT_SECRET', 'GOOGLE_CHAT_SPACE_ID'],
    capabilities: ['workspace-api', 'chat-alert'],
    purposes: ['chat-operator-alert', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: true,
    recommendedScopes: ['https://www.googleapis.com/auth/chat.bot'],
    docs: [GOOGLE_DOCS.chat],
    recommendedUse: [
      'send redacted operator alerts for POS, locker, or registry incidents',
      'post manual review case links without raw addresses',
    ],
    caveats: [
      'Chat cards must not embed raw address, phone, room number, or proof code.',
    ],
  },
  {
    id: 'google-maps-address-validation',
    label: 'Google Maps Platform Address Validation API',
    family: 'maps-platform',
    requiredEnvVars: ['GOOGLE_MAPS_API_KEY'],
    optionalEnvVars: ['GOOGLE_MAPS_CHANNEL', 'GOOGLE_MAPS_QUOTA_PROJECT'],
    capabilities: ['address-validation', 'geocode'],
    purposes: ['address-validation'],
    defaultPrivacyMode: 'ephemeral-plaintext-required',
    recommendedRuntime: 'server-side-or-worker',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: [],
    docs: [GOOGLE_DOCS.addressValidation],
    recommendedUse: [
      'optional provider in Address Validation Pipeline',
      'cross-check user-entered shipping addresses after explicit consent',
    ],
    caveats: [
      'Not an OSS-only dependency; keep local/official/open-data validators available.',
      'Do not call in high-risk mode unless local alternatives are insufficient and user consent is explicit.',
    ],
  },
  {
    id: 'google-maps-geocoding',
    label: 'Google Maps Platform Geocoding API',
    family: 'maps-platform',
    requiredEnvVars: ['GOOGLE_MAPS_API_KEY'],
    optionalEnvVars: ['GOOGLE_MAPS_CHANNEL', 'GOOGLE_MAPS_QUOTA_PROJECT'],
    capabilities: ['geocode', 'reverse-geocode'],
    purposes: ['geocode', 'reverse-geocode'],
    defaultPrivacyMode: 'ephemeral-plaintext-required',
    recommendedRuntime: 'server-side-or-worker',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: [],
    docs: [GOOGLE_DOCS.geocoding],
    recommendedUse: [
      'optional geocoding and reverse-geocoding fallback for non-sensitive flows',
      'compare AGID reverse geocoding quality against commercial provider output',
    ],
    caveats: [
      'Do not use as the only source of truth for AGID/AOID.',
      'Protect API keys and enforce quotas.',
    ],
  },
  {
    id: 'google-maps-places',
    label: 'Google Maps Platform Places API',
    family: 'maps-platform',
    requiredEnvVars: ['GOOGLE_MAPS_API_KEY'],
    optionalEnvVars: ['GOOGLE_MAPS_CHANNEL'],
    capabilities: ['places'],
    purposes: ['place-search'],
    defaultPrivacyMode: 'ephemeral-plaintext-required',
    recommendedRuntime: 'server-side-or-worker',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: [],
    docs: [GOOGLE_DOCS.places],
    recommendedUse: [
      'optional POI, entrance, locker, pickup point, and public-place search',
      'augment AGID Place Record when the operator accepts provider terms',
    ],
    caveats: [
      'Place queries may reveal sensitive intent; keep them short-lived.',
    ],
  },
  {
    id: 'google-maps-routes',
    label: 'Google Maps Platform Routes API',
    family: 'maps-platform',
    requiredEnvVars: ['GOOGLE_MAPS_API_KEY'],
    optionalEnvVars: ['GOOGLE_MAPS_CHANNEL'],
    capabilities: ['routes'],
    purposes: ['route-eta', 'pickup-route-planning'],
    defaultPrivacyMode: 'ephemeral-plaintext-required',
    recommendedRuntime: 'server-side-or-worker',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: [],
    docs: [GOOGLE_DOCS.routes],
    recommendedUse: [
      'optional ETA and pickup route comparison for carrier/PUDO workflows',
      'fallback route check when local routing quality is insufficient',
    ],
    caveats: [
      'Route waypoint addresses can reveal recipient patterns; prefer AGID/coarse cells where possible.',
    ],
  },
  {
    id: 'google-cloud-document-ai',
    label: 'Google Cloud Document AI',
    family: 'cloud-ai',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_DOCUMENT_AI_PROCESSOR_ID'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['document-ocr'],
    purposes: ['document-ocr-address-import'],
    defaultPrivacyMode: 'ephemeral-plaintext-required',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/cloud-platform'],
    docs: [GOOGLE_DOCS.documentAi, GOOGLE_DOCS.documentAiOcr],
    recommendedUse: [
      'optional OCR/extraction for uploaded address-bearing PDFs',
      'extract candidate address fields for user editing and redaction',
    ],
    caveats: [
      'Uploaded documents may contain IDs, names, phones, and exact addresses.',
      'Prefer local OCR in high-risk mode.',
    ],
  },
  {
    id: 'google-cloud-vision-ocr',
    label: 'Google Cloud Vision OCR',
    family: 'cloud-ai',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['image-ocr'],
    purposes: ['image-ocr-address-import'],
    defaultPrivacyMode: 'ephemeral-plaintext-required',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/cloud-platform'],
    docs: [GOOGLE_DOCS.visionOcr],
    recommendedUse: [
      'optional image OCR for address photos where Document AI is unnecessary',
      'extract candidate text for later user correction',
    ],
    caveats: [
      'Do not train or retain source images unless explicit consent and retention policy exist.',
    ],
  },
  {
    id: 'google-cloud-translation',
    label: 'Google Cloud Translation',
    family: 'cloud-ai',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['translation'],
    purposes: ['address-translation'],
    defaultPrivacyMode: 'ephemeral-plaintext-required',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/cloud-translation'],
    docs: [GOOGLE_DOCS.translation],
    recommendedUse: [
      'optional address-display translation comparison',
      'fallback for operator-facing redacted summaries',
    ],
    caveats: [
      'Address translation can alter legal meaning; keep original script and confidence evidence.',
    ],
  },
  {
    id: 'google-cloud-kms',
    label: 'Google Cloud KMS',
    family: 'cloud-security',
    requiredEnvVars: ['GOOGLE_CLOUD_KMS_KEY_RESOURCE'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['key-management'],
    purposes: ['kms-key-reference'],
    defaultPrivacyMode: 'secret-reference-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/cloud-platform'],
    docs: [GOOGLE_DOCS.kms],
    recommendedUse: [
      'store key references for encrypted evidence envelopes',
      'support customer-managed key policies for private deployments',
    ],
    caveats: [
      'Store key resource references, not raw private keys.',
    ],
  },
  {
    id: 'google-secret-manager',
    label: 'Google Secret Manager',
    family: 'cloud-security',
    requiredEnvVars: ['GOOGLE_SECRET_MANAGER_PROJECT'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['secret-management'],
    purposes: ['secret-reference'],
    defaultPrivacyMode: 'secret-reference-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/cloud-platform'],
    docs: [GOOGLE_DOCS.secretManager],
    recommendedUse: [
      'reference provider credentials for server-side adapters',
      'rotate API keys without embedding them in client bundles',
    ],
    caveats: [
      'Never serialize secret values into AGID/AOID reports.',
    ],
  },
  {
    id: 'google-cloud-storage',
    label: 'Google Cloud Storage',
    family: 'cloud-storage',
    requiredEnvVars: ['GOOGLE_CLOUD_STORAGE_BUCKET'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['object-storage'],
    purposes: ['encrypted-evidence-object'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/devstorage.read_write'],
    docs: [GOOGLE_DOCS.storage],
    recommendedUse: [
      'store encrypted address evidence envelopes and redacted PDFs',
      'store append-only audit export packages by commitment',
    ],
    caveats: [
      'Raw evidence storage must be encrypted, short-lived, and explicitly consented.',
    ],
  },
  {
    id: 'google-pubsub',
    label: 'Google Cloud Pub/Sub',
    family: 'cloud-events',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_PUBSUB_TOPIC'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['event-publish'],
    purposes: ['webhook-event-dispatch', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/pubsub'],
    docs: [GOOGLE_DOCS.pubsub],
    recommendedUse: [
      'dispatch redacted Address Webhook events',
      'fan out revocation, locker, POS, and carrier events without raw addresses',
    ],
    caveats: [
      'Event payloads must contain aliases, commitments, and fingerprints only.',
    ],
  },
  {
    id: 'google-cloud-tasks',
    label: 'Google Cloud Tasks',
    family: 'cloud-events',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_CLOUD_TASKS_QUEUE'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['queue'],
    purposes: ['async-job-queue', 'webhook-event-dispatch'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/cloud-tasks'],
    docs: [GOOGLE_DOCS.tasks],
    recommendedUse: [
      'retry OCR, webhook, sync, and review jobs by alias',
      'keep heavy provider calls off the request path',
    ],
    caveats: [
      'Task payloads should not contain raw address documents.',
    ],
  },
  {
    id: 'google-cloud-run',
    label: 'Google Cloud Run',
    family: 'cloud-compute',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT'],
    optionalEnvVars: ['GOOGLE_CLOUD_RUN_SERVICE_URL'],
    capabilities: ['serverless-handler'],
    purposes: ['serverless-adapter'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: [],
    docs: [GOOGLE_DOCS.run],
    recommendedUse: [
      'host server-side provider adapters and webhook handlers',
      'run Google Maps, OCR, or Workspace calls without leaking API keys to browsers',
    ],
    caveats: [
      'Use workload identity and secret references for credentials.',
    ],
  },
  {
    id: 'google-firestore',
    label: 'Cloud Firestore',
    family: 'cloud-database',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['document-db'],
    purposes: ['address-verification-cache', 'metadata-ledger'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/datastore'],
    docs: [GOOGLE_DOCS.firestore],
    recommendedUse: [
      'store provider result metadata, cache entries, and review states by commitment',
      'support hosted registry API deployments where Firestore is preferred',
    ],
    caveats: [
      'Do not store raw address or AOID bodies in document fields.',
    ],
  },
  {
    id: 'google-cloud-sql-postgres',
    label: 'Cloud SQL for PostgreSQL',
    family: 'cloud-database',
    requiredEnvVars: ['GOOGLE_CLOUD_SQL_INSTANCE'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS', 'DATABASE_URL'],
    capabilities: ['sql-postgres'],
    purposes: ['address-verification-cache', 'metadata-ledger'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: [],
    docs: [GOOGLE_DOCS.cloudSql],
    recommendedUse: [
      'host Postgres adapter for Address Resolution System',
      'run relational registry, event sourcing, and audit metadata tables',
    ],
    caveats: [
      'Prefer PostGIS only for redacted/coarse spatial indexes unless consent permits exact coordinates.',
    ],
  },
  {
    id: 'google-bigquery',
    label: 'BigQuery',
    family: 'analytics-monitoring',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_BIGQUERY_DATASET'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['warehouse-analytics'],
    purposes: ['analytics-aggregate', 'audit-monitoring'],
    defaultPrivacyMode: 'aggregate-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/bigquery'],
    docs: [GOOGLE_DOCS.bigquery],
    recommendedUse: [
      'aggregate address quality, POS, locker, and delivery KPIs',
      'analyze provider performance without row-level personal address data',
    ],
    caveats: [
      'Only aggregate, redacted, or differentially private data should leave operational stores.',
    ],
  },
  {
    id: 'google-cloud-logging-monitoring',
    label: 'Cloud Logging and Cloud Monitoring',
    family: 'analytics-monitoring',
    requiredEnvVars: ['GOOGLE_CLOUD_PROJECT'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['logging-monitoring'],
    purposes: ['audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/logging.write', 'https://www.googleapis.com/auth/monitoring.write'],
    docs: [GOOGLE_DOCS.logging, GOOGLE_DOCS.monitoring],
    recommendedUse: [
      'observe hosted registry, webhook, OCR, and provider adapter health',
      'alert on quota, provider failures, and privacy boundary violations',
    ],
    caveats: [
      'Structured logs must redact address, proof, token, and QR payload fields before export.',
    ],
  },
  {
    id: 'firebase-cloud-messaging',
    label: 'Firebase Cloud Messaging',
    family: 'firebase',
    requiredEnvVars: ['FIREBASE_PROJECT_ID'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['push'],
    purposes: ['push-notification'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    docs: [GOOGLE_DOCS.fcm],
    recommendedUse: [
      'send POS, locker, handoff, and QR-expiry push notifications',
      'notify users with short-lived aliases and no raw address text',
    ],
    caveats: [
      'Push payloads can appear on lock screens; keep them generic and redacted.',
    ],
  },
  {
    id: 'recaptcha-enterprise',
    label: 'reCAPTCHA Enterprise',
    family: 'cloud-security',
    requiredEnvVars: ['RECAPTCHA_SITE_KEY', 'RECAPTCHA_PROJECT_ID'],
    optionalEnvVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
    capabilities: ['abuse-control'],
    purposes: ['abuse-protection'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresGoogleCloudProject: true,
    requiresOAuthClient: false,
    recommendedScopes: ['https://www.googleapis.com/auth/cloud-platform'],
    docs: [GOOGLE_DOCS.recaptcha],
    recommendedUse: [
      'rate-limit address search, AGID reverse lookup, and feedback abuse',
      'protect public registry endpoints from enumeration and scripted signup',
    ],
    caveats: [
      'Abuse signals are not identity proof and must not replace AOID credential checks.',
    ],
  },
];

const VALID_SERVICE_IDS = new Set(GOOGLE_SERVICE_PROFILES.map(profile => profile.id));
const VALID_PURPOSES = new Set<GoogleIntegrationPurpose>([
  'staff-sso',
  'workspace-directory-sync',
  'gmail-redacted-notification',
  'drive-evidence-vault',
  'sheets-redacted-export',
  'calendar-handoff-schedule',
  'chat-operator-alert',
  'address-validation',
  'geocode',
  'reverse-geocode',
  'place-search',
  'route-eta',
  'pickup-route-planning',
  'document-ocr-address-import',
  'image-ocr-address-import',
  'address-translation',
  'kms-key-reference',
  'secret-reference',
  'encrypted-evidence-object',
  'webhook-event-dispatch',
  'async-job-queue',
  'serverless-adapter',
  'address-verification-cache',
  'metadata-ledger',
  'analytics-aggregate',
  'audit-monitoring',
  'push-notification',
  'abuse-protection',
]);
const VALID_PAYLOAD_CLASSES = new Set<GooglePayloadClass>([
  'none',
  'event-metadata',
  'organization-record',
  'public-agid-reference',
  'address-commitment',
  'encrypted-aoid-envelope',
  'redacted-address-summary',
  'plaintext-address',
  'document-image-or-pdf',
  'route-waypoint-addresses',
  'place-query',
  'translation-text',
  'secret-reference',
  'analytics-aggregate',
]);

function cleanIdentifier(value: unknown) {
  return cleanText(value, '', 140).toLowerCase();
}

function normalizePayloadClass(value: unknown): GooglePayloadClass {
  const cleaned = cleanIdentifier(value || 'none') as GooglePayloadClass;
  return VALID_PAYLOAD_CLASSES.has(cleaned) ? cleaned : 'none';
}

function normalizeRequestedScopes(value: unknown): string[] {
  return [...new Set(cleanTextArray(value)
    .map(scope => scope.slice(0, 180))
    .filter(scope => /^[A-Za-z0-9_./:-]+$/.test(scope)))]
    .sort();
}

function isPlaintextPayload(payloadClass: GooglePayloadClass) {
  return payloadClass === 'plaintext-address'
    || payloadClass === 'document-image-or-pdf'
    || payloadClass === 'route-waypoint-addresses'
    || payloadClass === 'place-query'
    || payloadClass === 'translation-text';
}

function isEncryptedPayload(payloadClass: GooglePayloadClass) {
  return payloadClass === 'encrypted-aoid-envelope' || payloadClass === 'secret-reference';
}

function allowsPlaintext(profile: GoogleServiceProfile) {
  return profile.defaultPrivacyMode === 'ephemeral-plaintext-required';
}

function cloneProfile(profile: GoogleServiceProfile): GoogleServiceProfile {
  return {
    ...profile,
    requiredEnvVars: [...profile.requiredEnvVars],
    optionalEnvVars: [...profile.optionalEnvVars],
    capabilities: [...profile.capabilities],
    purposes: [...profile.purposes],
    recommendedScopes: [...profile.recommendedScopes],
    docs: [...profile.docs],
    recommendedUse: [...profile.recommendedUse],
    caveats: [...profile.caveats],
  };
}

export function listGoogleServiceProfiles(): GoogleServiceProfile[] {
  return GOOGLE_SERVICE_PROFILES.map(cloneProfile);
}

export function getGoogleServiceProfile(id: GoogleServiceId | string): GoogleServiceProfile | null {
  const cleaned = cleanIdentifier(id);
  const profile = GOOGLE_SERVICE_PROFILES.find(item => item.id === cleaned);
  return profile ? cloneProfile(profile) : null;
}

export function buildGoogleIntegrationPlan(input: GoogleIntegrationPlanInput): GoogleIntegrationPlan {
  const serviceId = cleanIdentifier(input.serviceId);
  const service = getGoogleServiceProfile(serviceId);
  const purpose = cleanIdentifier(input.purpose) as GoogleIntegrationPurpose;
  const payloadClass = normalizePayloadClass(input.payloadClass);
  const ownerConsent = cleanBoolean(input.ownerConsent);
  const encryptedAtRest = cleanBoolean(input.encryptedAtRest);
  const encryptedInTransit = cleanBoolean(input.encryptedInTransit);
  const serverSideOnly = cleanBoolean(input.serverSideOnly);
  const highRiskMode = cleanBoolean(input.highRiskMode);
  const requestedScopes = normalizeRequestedScopes(input.requestedScopes);
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredControls: string[] = [
    'no-client-side-google-secret',
    'no-raw-address-in-logs-or-telemetry',
    'domain-separated-aliases-and-commitments',
    'google-project-quota-budget-and-billing-guardrail',
  ];

  if (!VALID_SERVICE_IDS.has(serviceId as GoogleServiceId) || !service) {
    errors.push('unknown-google-service');
  }
  if (!VALID_PURPOSES.has(purpose)) {
    errors.push('unknown-google-purpose');
  }
  if (service && !service.purposes.includes(purpose)) {
    errors.push('service-purpose-not-supported');
  }

  if (service?.requiresGoogleCloudProject) {
    requiredControls.push('google-cloud-project-api-enablement');
    requiredControls.push('least-privilege-google-iam-or-restricted-api-key');
  }
  if (service?.requiresOAuthClient) {
    requiredControls.push('google-oauth-client-registration');
    requiredControls.push('least-privilege-google-oauth-scopes');
  }
  if (service?.recommendedRuntime === 'server-side' || service?.recommendedRuntime === 'dashboard-admin-only') {
    requiredControls.push('server-side-token-exchange-or-workload-identity');
  }
  if (service?.defaultPrivacyMode === 'commitment-or-alias-only') {
    requiredControls.push('send-only-commitments-aliases-or-redacted-summaries');
  }
  if (service?.defaultPrivacyMode === 'event-metadata-only') {
    requiredControls.push('send-only-redacted-event-metadata');
  }
  if (service?.defaultPrivacyMode === 'encrypted-envelope-only') {
    requiredControls.push('owner-device-or-server-side-envelope-encryption-before-upload');
  }
  if (service?.defaultPrivacyMode === 'secret-reference-only') {
    requiredControls.push('store-secret-reference-not-secret-value');
  }
  if (service?.defaultPrivacyMode === 'aggregate-only') {
    requiredControls.push('aggregate-or-differentially-private-export-only');
  }
  if (service?.defaultPrivacyMode === 'ephemeral-plaintext-required') {
    requiredControls.push('explicit-user-or-enterprise-consent');
    requiredControls.push('ephemeral-provider-request-no-canonical-storage');
    requiredControls.push('server-side-proxy-for-address-bearing-requests');
  }

  if (isPlaintextPayload(payloadClass)) {
    if (!service || !allowsPlaintext(service)) {
      errors.push('plaintext-payload-not-allowed-for-service');
    }
    if (!ownerConsent) errors.push('owner-consent-required-for-google-plaintext-processing');
    if (!encryptedInTransit) errors.push('encrypted-in-transit-required-for-google-plaintext-processing');
    if (!serverSideOnly) errors.push('server-side-proxy-required-for-google-plaintext-processing');
    if (payloadClass === 'document-image-or-pdf' && !encryptedAtRest) {
      errors.push('encrypted-at-rest-required-for-google-document-processing');
    }
  }

  if (payloadClass === 'document-image-or-pdf' && service?.id !== 'google-cloud-document-ai' && service?.id !== 'google-cloud-vision-ocr') {
    errors.push('document-image-payload-requires-google-ocr-service');
  }
  if (payloadClass === 'route-waypoint-addresses' && service?.id !== 'google-maps-routes') {
    errors.push('route-waypoint-payload-requires-google-routes');
  }
  if (payloadClass === 'place-query' && service?.id !== 'google-maps-places') {
    errors.push('place-query-payload-requires-google-places');
  }
  if (payloadClass === 'translation-text' && service?.id !== 'google-cloud-translation') {
    errors.push('translation-text-payload-requires-google-translation');
  }
  if (payloadClass === 'plaintext-address' && service?.family !== 'maps-platform') {
    warnings.push('plaintext-address-should-usually-be-replaced-by-agid-or-commitment');
  }

  if (isEncryptedPayload(payloadClass)) {
    if (payloadClass === 'encrypted-aoid-envelope') {
      if (!ownerConsent) errors.push('owner-consent-required-for-encrypted-aoid-google-sync');
      if (!encryptedAtRest) errors.push('encrypted-at-rest-required-for-encrypted-aoid-google-sync');
      if (!encryptedInTransit) errors.push('encrypted-in-transit-required-for-encrypted-aoid-google-sync');
    }
    if (payloadClass === 'secret-reference' && service?.id !== 'google-cloud-kms' && service?.id !== 'google-secret-manager') {
      warnings.push('secret-reference-is-best-handled-by-google-kms-or-secret-manager');
    }
  }

  if (payloadClass === 'analytics-aggregate' && service?.defaultPrivacyMode !== 'aggregate-only') {
    warnings.push('analytics-aggregate-is-best-handled-by-sheets-or-bigquery');
  }

  if (highRiskMode) {
    requiredControls.push('high-risk-mode-no-precise-address-retention');
    requiredControls.push('prefer-agid-s-local-ocr-and-self-hosted-geocoding-before-google');
    if (isPlaintextPayload(payloadClass)) {
      warnings.push('high-risk-mode-prefers-local-ocr-local-geocoding-or-agid-s-over-google-plaintext-processing');
    }
  }

  const expandedScopes = service
    ? [...new Set([...service.recommendedScopes, ...requestedScopes])].sort()
    : requestedScopes;

  if (expandedScopes.some(scope => scope === 'https://www.googleapis.com/auth/cloud-platform')) {
    warnings.push('broad-google-cloud-platform-scope-requires-admin-review');
  }
  if (expandedScopes.some(scope => scope.includes('/auth/drive') && !scope.endsWith('drive.file'))) {
    warnings.push('broad-google-drive-scope-requires-admin-review');
  }

  const sendsPlaintextAddressToGoogle = Boolean(service && isPlaintextPayload(payloadClass) && allowsPlaintext(service));
  const sendsDocumentImageOrPdfToGoogle = payloadClass === 'document-image-or-pdf' && sendsPlaintextAddressToGoogle;
  const serverSideOnlyRequired = Boolean(service && (
    service.recommendedRuntime === 'server-side'
    || service.recommendedRuntime === 'dashboard-admin-only'
    || isPlaintextPayload(payloadClass)
  ));

  return {
    modelVersion: GOOGLE_SERVICE_INTEGRATION_MODEL_VERSION,
    service,
    purpose,
    payloadClass,
    allowed: errors.length === 0,
    requiredEnvVars: service ? [...service.requiredEnvVars] : [],
    requiredControls: [...new Set(requiredControls)].sort(),
    recommendedScopes: expandedScopes,
    dataFlow: {
      sendsPlaintextAddressToGoogle,
      sendsDocumentImageOrPdfToGoogle,
      storesRawAddressInGoogle: false,
      clientSecretAllowedInBrowser: false,
      serverSideOnlyRequired,
      highRiskModeCompatible: !highRiskMode || !isPlaintextPayload(payloadClass),
    },
    errors,
    warnings,
  };
}
