export const MICROSOFT_SERVICE_INTEGRATION_MODEL_VERSION = 'microsoft-service-integration-v1';

export type MicrosoftServiceFamily =
  | 'identity'
  | 'microsoft-365'
  | 'azure-location'
  | 'azure-ai'
  | 'azure-security'
  | 'azure-events'
  | 'azure-device-management'
  | 'azure-communications'
  | 'azure-ledger'
  | 'api-management'
  | 'azure-compute'
  | 'azure-storage'
  | 'azure-database'
  | 'analytics'
  | 'business-apps'
  | 'monitoring';

export type MicrosoftServiceId =
  | 'microsoft-entra-id'
  | 'microsoft-entra-external-id'
  | 'microsoft-entra-verified-id'
  | 'microsoft-graph'
  | 'microsoft-teams'
  | 'outlook-exchange'
  | 'sharepoint-onedrive'
  | 'azure-maps'
  | 'azure-ai-document-intelligence'
  | 'azure-key-vault'
  | 'azure-iot-hub'
  | 'azure-event-grid'
  | 'azure-service-bus'
  | 'azure-communication-services'
  | 'azure-confidential-ledger'
  | 'microsoft-sentinel'
  | 'microsoft-defender-for-cloud'
  | 'azure-api-management'
  | 'azure-functions'
  | 'azure-blob-storage'
  | 'azure-sql-database'
  | 'azure-cosmos-db'
  | 'azure-monitor-application-insights'
  | 'microsoft-fabric-power-bi'
  | 'dynamics-365-dataverse'
  | 'power-platform';

export type MicrosoftIntegrationPurpose =
  | 'staff-sso'
  | 'external-user-access'
  | 'device-admin-access'
  | 'address-access-auth'
  | 'address-credential-vc'
  | 'teams-operator-alert'
  | 'outlook-notification'
  | 'sharepoint-evidence-vault'
  | 'onedrive-redacted-export'
  | 'azure-maps-geocode'
  | 'azure-maps-reverse-geocode'
  | 'document-ocr-address-import'
  | 'key-vault-secret-reference'
  | 'device-twin-management'
  | 'pos-device-health'
  | 'webhook-event-dispatch'
  | 'sms-email-voice-notification'
  | 'async-job-queue'
  | 'confidential-audit-ledger'
  | 'security-threat-detection'
  | 'api-gateway-rate-limit'
  | 'analytics-dashboard'
  | 'serverless-adapter'
  | 'encrypted-evidence-blob'
  | 'metadata-ledger'
  | 'address-verification-cache'
  | 'business-account-sync'
  | 'workflow-automation'
  | 'audit-monitoring';

export type MicrosoftConnectorCapability =
  | 'oauth-oidc'
  | 'external-id'
  | 'verified-credential'
  | 'graph-api'
  | 'staff-directory'
  | 'mail-send'
  | 'calendar'
  | 'files'
  | 'teams-alert'
  | 'geocode'
  | 'reverse-geocode'
  | 'map-search'
  | 'document-ocr'
  | 'address-field-extraction'
  | 'secret-management'
  | 'key-management'
  | 'device-twin'
  | 'iot-telemetry'
  | 'event-publish'
  | 'sms-send'
  | 'email-send'
  | 'voice-call'
  | 'queue'
  | 'immutable-ledger'
  | 'siem'
  | 'threat-detection'
  | 'api-gateway'
  | 'rate-limit'
  | 'developer-portal'
  | 'bi-dashboard'
  | 'serverless-handler'
  | 'object-storage'
  | 'sql-ledger'
  | 'document-db'
  | 'crm'
  | 'workflow'
  | 'monitoring';

export type MicrosoftPayloadClass =
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
  | 'verified-credential-status'
  | 'secret-reference';

export type MicrosoftPrivacyMode =
  | 'organization-metadata-only'
  | 'commitment-or-alias-only'
  | 'encrypted-envelope-only'
  | 'ephemeral-plaintext-required'
  | 'secret-reference-only';

export type MicrosoftRecommendedRuntime =
  | 'server-side'
  | 'server-side-or-worker'
  | 'local-config-only'
  | 'dashboard-admin-only';

export type MicrosoftServiceProfile = {
  id: MicrosoftServiceId;
  label: string;
  family: MicrosoftServiceFamily;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  capabilities: MicrosoftConnectorCapability[];
  purposes: MicrosoftIntegrationPurpose[];
  defaultPrivacyMode: MicrosoftPrivacyMode;
  recommendedRuntime: MicrosoftRecommendedRuntime;
  requiresEntraApp: boolean;
  recommendedScopes: string[];
  docs: string[];
  recommendedUse: string[];
  caveats: string[];
};

export type MicrosoftIntegrationPlanInput = {
  serviceId: MicrosoftServiceId | string;
  purpose: MicrosoftIntegrationPurpose | string;
  payloadClass?: MicrosoftPayloadClass | string;
  ownerConsent?: boolean;
  encryptedAtRest?: boolean;
  encryptedInTransit?: boolean;
  serverSideOnly?: boolean;
  highRiskMode?: boolean;
  requestedScopes?: unknown;
};

export type MicrosoftIntegrationPlan = {
  modelVersion: string;
  service: MicrosoftServiceProfile | null;
  purpose: string;
  payloadClass: MicrosoftPayloadClass;
  allowed: boolean;
  requiredEnvVars: string[];
  requiredControls: string[];
  recommendedScopes: string[];
  dataFlow: {
    sendsPlaintextAddressToMicrosoft: boolean;
    storesRawAddressInMicrosoft: boolean;
    clientSecretAllowedInBrowser: false;
    serverSideOnlyRequired: boolean;
    highRiskModeCompatible: boolean;
  };
  errors: string[];
  warnings: string[];
};

const MICROSOFT_DOCS = {
  graph: 'https://learn.microsoft.com/en-us/graph/overview',
  entraExternalId: 'https://learn.microsoft.com/en-us/entra/external-id/external-identities-overview',
  entraVerifiedId: 'https://learn.microsoft.com/en-us/entra/verified-id/',
  identityAuthCode: 'https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow',
  identityScopes: 'https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc',
  graphWebhooks: 'https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks',
  azureMapsSearch: 'https://learn.microsoft.com/en-us/azure/azure-maps/how-to-search-for-address',
  azureMapsGeocoding: 'https://learn.microsoft.com/en-us/rest/api/maps/search/get-geocoding?view=rest-maps-2026-01-01',
  azureMapsReverse: 'https://learn.microsoft.com/en-us/rest/api/maps/search/get-reverse-geocoding?view=rest-maps-2026-01-01',
  documentRead: 'https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/read?view=doc-intel-4.0.0',
  documentModels: 'https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/model-overview?view=doc-intel-4.0.0',
  keyVault: 'https://learn.microsoft.com/en-us/azure/key-vault/general/overview',
  iotHub: 'https://learn.microsoft.com/en-us/azure/iot-hub/iot-concepts-and-iot-hub',
  eventGrid: 'https://learn.microsoft.com/en-us/azure/event-grid/overview',
  communicationServices: 'https://learn.microsoft.com/en-us/azure/communication-services/overview',
  confidentialLedger: 'https://learn.microsoft.com/en-us/azure/confidential-ledger/overview',
  sentinel: 'https://learn.microsoft.com/en-us/azure/sentinel/overview',
  defenderForCloud: 'https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction',
  apiManagement: 'https://learn.microsoft.com/en-us/azure/api-management/api-management-key-concepts',
  serviceBus: 'https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview',
  fabric: 'https://learn.microsoft.com/en-us/fabric/fundamentals/microsoft-fabric-overview',
  powerBi: 'https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview',
};

const MICROSOFT_SERVICE_PROFILES: MicrosoftServiceProfile[] = [
  {
    id: 'microsoft-entra-id',
    label: 'Microsoft Entra ID',
    family: 'identity',
    requiredEnvVars: ['MICROSOFT_TENANT_ID', 'MICROSOFT_CLIENT_ID'],
    optionalEnvVars: ['MICROSOFT_CLIENT_SECRET', 'MICROSOFT_REDIRECT_URI'],
    capabilities: ['oauth-oidc', 'staff-directory'],
    purposes: ['staff-sso', 'device-admin-access', 'address-access-auth'],
    defaultPrivacyMode: 'organization-metadata-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: ['openid', 'profile', 'email'],
    docs: [MICROSOFT_DOCS.identityAuthCode, MICROSOFT_DOCS.identityScopes],
    recommendedUse: [
      'staff SSO for POS operators and administrators',
      'device-admin authorization policy',
      'Address Access/Auth scope enforcement',
    ],
    caveats: [
      'Do not put client secrets in browser builds.',
      'Use least-privilege delegated or application permissions per deployment.',
    ],
  },
  {
    id: 'microsoft-entra-external-id',
    label: 'Microsoft Entra External ID',
    family: 'identity',
    requiredEnvVars: ['MICROSOFT_EXTERNAL_ID_TENANT_ID', 'MICROSOFT_EXTERNAL_ID_CLIENT_ID'],
    optionalEnvVars: ['MICROSOFT_EXTERNAL_ID_CLIENT_SECRET', 'MICROSOFT_EXTERNAL_ID_REDIRECT_URI'],
    capabilities: ['oauth-oidc', 'external-id'],
    purposes: ['external-user-access', 'address-access-auth'],
    defaultPrivacyMode: 'organization-metadata-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: ['openid', 'profile', 'email'],
    docs: [MICROSOFT_DOCS.entraExternalId, MICROSOFT_DOCS.identityAuthCode, MICROSOFT_DOCS.identityScopes],
    recommendedUse: [
      'login for external carriers, issuers, municipalities, NGOs, and customer-facing portals',
      'Address Link and Address Portal access without storing personal addresses in Entra',
      'scope-gated access to address workflows such as delivery:read or recipient:verify',
    ],
    caveats: [
      'Use External ID for identity and authorization, not as an address record system.',
      'Keep AOID bodies, AGID-S payloads, and proof witnesses outside identity claims.',
    ],
  },
  {
    id: 'microsoft-entra-verified-id',
    label: 'Microsoft Entra Verified ID',
    family: 'identity',
    requiredEnvVars: ['MICROSOFT_VERIFIED_ID_TENANT_ID', 'MICROSOFT_VERIFIED_ID_CLIENT_ID'],
    optionalEnvVars: ['MICROSOFT_VERIFIED_ID_CLIENT_SECRET', 'MICROSOFT_VERIFIED_ID_AUTHORITY'],
    capabilities: ['verified-credential'],
    purposes: ['address-credential-vc', 'address-access-auth'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.entraVerifiedId],
    recommendedUse: [
      'enterprise or municipality-grade AOID credential issuance and verification',
      'residence, address ownership, or delivery eligibility credential status checks',
      'non-ZK verifiable credential layer for deployments that require Microsoft enterprise trust',
    ],
    caveats: [
      'Verified ID is a credential layer, not a zero-knowledge proof system.',
      'Publish credential status, issuer, and revocation metadata only; keep raw addresses in encrypted local storage.',
    ],
  },
  {
    id: 'microsoft-graph',
    label: 'Microsoft Graph',
    family: 'microsoft-365',
    requiredEnvVars: ['MICROSOFT_TENANT_ID', 'MICROSOFT_CLIENT_ID'],
    optionalEnvVars: ['MICROSOFT_CLIENT_SECRET'],
    capabilities: ['graph-api', 'staff-directory', 'mail-send', 'calendar', 'files'],
    purposes: ['staff-sso', 'outlook-notification', 'sharepoint-evidence-vault', 'onedrive-redacted-export', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: ['User.Read'],
    docs: [MICROSOFT_DOCS.graph],
    recommendedUse: [
      'read organization metadata for issuer or staff confirmation',
      'send redacted operator notifications',
      'link encrypted evidence references stored in Microsoft 365',
    ],
    caveats: [
      'Graph should receive aliases, commitments, and redacted summaries by default.',
      'Avoid broad tenant-wide scopes unless an enterprise admin approves them.',
    ],
  },
  {
    id: 'microsoft-teams',
    label: 'Microsoft Teams',
    family: 'microsoft-365',
    requiredEnvVars: ['MICROSOFT_TENANT_ID', 'MICROSOFT_CLIENT_ID'],
    optionalEnvVars: ['MICROSOFT_CLIENT_SECRET', 'MICROSOFT_TEAMS_WEBHOOK_URL'],
    capabilities: ['graph-api', 'teams-alert'],
    purposes: ['teams-operator-alert', 'audit-monitoring', 'webhook-event-dispatch'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: ['User.Read'],
    docs: [MICROSOFT_DOCS.graph, MICROSOFT_DOCS.graphWebhooks],
    recommendedUse: [
      'POS exception alerts',
      'revocation or freshness incident notifications',
      'operator handoff review messages without raw addresses',
    ],
    caveats: [
      'Notification text must not include raw address, phone, room number, or proof code.',
      'Use short-lived links or dashboard case aliases.',
    ],
  },
  {
    id: 'outlook-exchange',
    label: 'Outlook / Exchange Online',
    family: 'microsoft-365',
    requiredEnvVars: ['MICROSOFT_TENANT_ID', 'MICROSOFT_CLIENT_ID'],
    optionalEnvVars: ['MICROSOFT_CLIENT_SECRET'],
    capabilities: ['graph-api', 'mail-send', 'calendar'],
    purposes: ['outlook-notification', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: ['Mail.Send'],
    docs: [MICROSOFT_DOCS.graph],
    recommendedUse: [
      'send redacted review notices',
      'schedule address review or carrier handoff appointments',
    ],
    caveats: [
      'Email is easy to forward; send only aliases and short-lived action links.',
    ],
  },
  {
    id: 'sharepoint-onedrive',
    label: 'SharePoint / OneDrive',
    family: 'microsoft-365',
    requiredEnvVars: ['MICROSOFT_TENANT_ID', 'MICROSOFT_CLIENT_ID'],
    optionalEnvVars: ['MICROSOFT_CLIENT_SECRET', 'MICROSOFT_SHAREPOINT_SITE_ID', 'MICROSOFT_DRIVE_ID'],
    capabilities: ['graph-api', 'files', 'object-storage'],
    purposes: ['sharepoint-evidence-vault', 'onedrive-redacted-export', 'audit-monitoring'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: ['Files.ReadWrite.All', 'Sites.ReadWrite.All'],
    docs: [MICROSOFT_DOCS.graph],
    recommendedUse: [
      'store encrypted evidence vault blobs',
      'export redacted audit reports for enterprise tenants',
    ],
    caveats: [
      'Do not store raw AOID records or unencrypted address evidence.',
      'Use tenant retention labels carefully for user-controlled deletion requirements.',
    ],
  },
  {
    id: 'azure-maps',
    label: 'Azure Maps',
    family: 'azure-location',
    requiredEnvVars: ['AZURE_MAPS_ENDPOINT'],
    optionalEnvVars: ['AZURE_MAPS_SUBSCRIPTION_KEY', 'AZURE_MAPS_CLIENT_ID'],
    capabilities: ['geocode', 'reverse-geocode', 'map-search'],
    purposes: ['azure-maps-geocode', 'azure-maps-reverse-geocode', 'address-verification-cache'],
    defaultPrivacyMode: 'ephemeral-plaintext-required',
    recommendedRuntime: 'server-side',
    requiresEntraApp: false,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.azureMapsSearch, MICROSOFT_DOCS.azureMapsGeocoding, MICROSOFT_DOCS.azureMapsReverse],
    recommendedUse: [
      'optional geocoding and reverse-geocoding provider',
      'compare against OSS geocoder output for quality checks',
    ],
    caveats: [
      'Geocoding sends address or coordinate queries to Microsoft.',
      'Use only with explicit consent or an enterprise data-processing agreement.',
    ],
  },
  {
    id: 'azure-ai-document-intelligence',
    label: 'Azure AI Document Intelligence',
    family: 'azure-ai',
    requiredEnvVars: ['AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT'],
    optionalEnvVars: ['AZURE_DOCUMENT_INTELLIGENCE_KEY'],
    capabilities: ['document-ocr', 'address-field-extraction'],
    purposes: ['document-ocr-address-import'],
    defaultPrivacyMode: 'ephemeral-plaintext-required',
    recommendedRuntime: 'server-side',
    requiresEntraApp: false,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.documentRead, MICROSOFT_DOCS.documentModels],
    recommendedUse: [
      'optional OCR adapter for uploaded address documents',
      'extract address candidates from utility bills, labels, and IDs after consent',
    ],
    caveats: [
      'Uploaded documents can contain highly sensitive personal data.',
      'Prefer local OCR in high-risk mode and store only encrypted evidence plus commitments.',
    ],
  },
  {
    id: 'azure-key-vault',
    label: 'Azure Key Vault',
    family: 'azure-security',
    requiredEnvVars: ['AZURE_KEY_VAULT_URI'],
    optionalEnvVars: ['AZURE_CLIENT_ID', 'AZURE_TENANT_ID'],
    capabilities: ['secret-management', 'key-management'],
    purposes: ['key-vault-secret-reference'],
    defaultPrivacyMode: 'secret-reference-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.keyVault],
    recommendedUse: [
      'store connector secret references',
      'manage signing keys and envelope-encryption key references',
    ],
    caveats: [
      'Application records should store Key Vault references, not secret values.',
    ],
  },
  {
    id: 'azure-iot-hub',
    label: 'Azure IoT Hub',
    family: 'azure-device-management',
    requiredEnvVars: ['AZURE_IOT_HUB_HOSTNAME'],
    optionalEnvVars: ['AZURE_IOT_HUB_CONNECTION_STRING', 'AZURE_IOT_HUB_CONSUMER_GROUP'],
    capabilities: ['device-twin', 'iot-telemetry'],
    purposes: ['device-twin-management', 'pos-device-health', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresEntraApp: false,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.iotHub],
    recommendedUse: [
      'manage POS terminals, NFC readers, printers, cash drawers, measuring devices, smart lockers, and drone devices',
      'track device health, firmware posture, online/offline status, and queued sync state',
      'route device telemetry into redacted audit and incident workflows',
    ],
    caveats: [
      'Device telemetry must not include raw address, proof code, exact recipient identity, or AGID-S ciphertext.',
      'Use per-device identity and certificate rotation for field terminals.',
    ],
  },
  {
    id: 'azure-event-grid',
    label: 'Azure Event Grid',
    family: 'azure-events',
    requiredEnvVars: ['AZURE_EVENT_GRID_TOPIC_ENDPOINT'],
    optionalEnvVars: ['AZURE_EVENT_GRID_ACCESS_KEY'],
    capabilities: ['event-publish'],
    purposes: ['webhook-event-dispatch', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresEntraApp: false,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.eventGrid],
    recommendedUse: [
      'publish address_intent and handoff events to enterprise systems',
      'fan out revocation or review events without raw address data',
    ],
    caveats: [
      'Publish aliases, event IDs, and commitments only.',
    ],
  },
  {
    id: 'azure-communication-services',
    label: 'Azure Communication Services',
    family: 'azure-communications',
    requiredEnvVars: ['AZURE_COMMUNICATION_SERVICES_ENDPOINT'],
    optionalEnvVars: ['AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING', 'AZURE_COMMUNICATION_SERVICES_SENDER'],
    capabilities: ['sms-send', 'email-send', 'voice-call'],
    purposes: ['sms-email-voice-notification', 'outlook-notification', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: false,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.communicationServices],
    recommendedUse: [
      'send SMS, email, or voice notifications for pickup, handoff, expiry, and review states',
      'notify carriers and recipients with short-lived aliases or action links',
      'support Teams interoperability for enterprise operators when enabled',
    ],
    caveats: [
      'Notification bodies must not include raw address, phone numbers beyond the delivery channel, room numbers, AGID-S ciphertext, or proof codes.',
      'Use short-lived aliases and purpose-specific links for every notification.',
    ],
  },
  {
    id: 'azure-confidential-ledger',
    label: 'Azure Confidential Ledger',
    family: 'azure-ledger',
    requiredEnvVars: ['AZURE_CONFIDENTIAL_LEDGER_ENDPOINT'],
    optionalEnvVars: ['AZURE_CONFIDENTIAL_LEDGER_COLLECTION_ID'],
    capabilities: ['immutable-ledger'],
    purposes: ['confidential-audit-ledger', 'metadata-ledger', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.confidentialLedger],
    recommendedUse: [
      'Ethereum-free audit mode for nullifier roots, revocation roots, registry digests, and handoff receipt hashes',
      'tamper-evident evidence of hosted registry state without publishing addresses on-chain',
    ],
    caveats: [
      'Store only digests, hashes, roots, and receipt commitments; never store raw addresses or document evidence.',
      'Treat it as an integrity anchor, not as the primary application database.',
    ],
  },
  {
    id: 'azure-service-bus',
    label: 'Azure Service Bus',
    family: 'azure-events',
    requiredEnvVars: ['AZURE_SERVICE_BUS_CONNECTION_STRING'],
    optionalEnvVars: ['AZURE_SERVICE_BUS_QUEUE', 'AZURE_SERVICE_BUS_TOPIC'],
    capabilities: ['queue'],
    purposes: ['async-job-queue', 'webhook-event-dispatch', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresEntraApp: false,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.serviceBus],
    recommendedUse: [
      'queue OCR, registry sync, audit report, or carrier handoff jobs',
      'decouple POS from slow enterprise integrations',
    ],
    caveats: [
      'Queue messages should contain job IDs and commitments, not raw addresses.',
    ],
  },
  {
    id: 'microsoft-sentinel',
    label: 'Microsoft Sentinel',
    family: 'monitoring',
    requiredEnvVars: ['MICROSOFT_SENTINEL_WORKSPACE_ID'],
    optionalEnvVars: ['MICROSOFT_SENTINEL_RESOURCE_GROUP', 'MICROSOFT_SENTINEL_SUBSCRIPTION_ID'],
    capabilities: ['siem', 'threat-detection', 'monitoring'],
    purposes: ['security-threat-detection', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresEntraApp: true,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.sentinel],
    recommendedUse: [
      'detect address enumeration, QR replay, API abuse, suspicious issuer activity, and compromised device patterns',
      'correlate POS, registry, webhook, and device security events without exposing raw addresses',
    ],
    caveats: [
      'Security events must use aliases, commitments, coarse regions, and device IDs rather than personal address bodies.',
      'Do not export proof witnesses, proof codes, or precise AGID-S payloads to SIEM logs.',
    ],
  },
  {
    id: 'microsoft-defender-for-cloud',
    label: 'Microsoft Defender for Cloud',
    family: 'monitoring',
    requiredEnvVars: ['AZURE_SUBSCRIPTION_ID'],
    optionalEnvVars: ['AZURE_DEFENDER_WORKSPACE_ID'],
    capabilities: ['threat-detection', 'monitoring'],
    purposes: ['security-threat-detection', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'dashboard-admin-only',
    requiresEntraApp: true,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.defenderForCloud],
    recommendedUse: [
      'cloud posture and workload protection for hosted registry, resolver, proof, and dashboard deployments',
      'detect risky cloud configuration around keys, APIs, storage, databases, and containers',
    ],
    caveats: [
      'Use Defender for infrastructure posture, not for ingesting personal address datasets.',
      'Keep remediation tickets redacted and linked to dashboard aliases.',
    ],
  },
  {
    id: 'azure-api-management',
    label: 'Azure API Management',
    family: 'api-management',
    requiredEnvVars: ['AZURE_API_MANAGEMENT_GATEWAY_URL'],
    optionalEnvVars: ['AZURE_API_MANAGEMENT_SUBSCRIPTION_KEY', 'AZURE_API_MANAGEMENT_DEVELOPER_PORTAL_URL'],
    capabilities: ['api-gateway', 'rate-limit', 'developer-portal'],
    purposes: ['api-gateway-rate-limit', 'address-access-auth', 'webhook-event-dispatch', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.apiManagement],
    recommendedUse: [
      'front Hosted Registry API, Resolver API, MCP endpoints, and enterprise webhook APIs',
      'enforce API keys, OAuth, request validation, response shaping, and rate limits',
      'publish an enterprise developer portal without exposing private address schemas',
    ],
    caveats: [
      'Gateway policies must redact request and response bodies before logging.',
      'Use abuse controls for reverse lookup, AGID enumeration, and high-risk endpoint access.',
    ],
  },
  {
    id: 'azure-functions',
    label: 'Azure Functions',
    family: 'azure-compute',
    requiredEnvVars: ['AZURE_FUNCTIONS_BASE_URL'],
    optionalEnvVars: ['AZURE_FUNCTIONS_KEY'],
    capabilities: ['serverless-handler'],
    purposes: ['serverless-adapter', 'webhook-event-dispatch'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresEntraApp: false,
    recommendedScopes: [],
    docs: [],
    recommendedUse: [
      'host Microsoft-specific webhook adapters',
      'run redacted notification and queue dispatch workers',
    ],
    caveats: [
      'Keep raw address processing behind private endpoints if it is unavoidable.',
    ],
  },
  {
    id: 'azure-blob-storage',
    label: 'Azure Blob Storage',
    family: 'azure-storage',
    requiredEnvVars: ['AZURE_STORAGE_ACCOUNT', 'AZURE_STORAGE_CONTAINER'],
    optionalEnvVars: ['AZURE_STORAGE_CONNECTION_STRING'],
    capabilities: ['object-storage'],
    purposes: ['encrypted-evidence-blob', 'onedrive-redacted-export', 'audit-monitoring'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: false,
    recommendedScopes: [],
    docs: [],
    recommendedUse: [
      'store encrypted evidence packages',
      'archive redacted audit exports',
    ],
    caveats: [
      'Raw document bytes must be encrypted before upload.',
    ],
  },
  {
    id: 'azure-sql-database',
    label: 'Azure SQL Database',
    family: 'azure-database',
    requiredEnvVars: ['AZURE_SQL_CONNECTION_STRING'],
    optionalEnvVars: [],
    capabilities: ['sql-ledger'],
    purposes: ['metadata-ledger', 'address-verification-cache', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: false,
    recommendedScopes: [],
    docs: [],
    recommendedUse: [
      'enterprise metadata ledger',
      'address verification cache with no raw AOID storage',
    ],
    caveats: [
      'Use encrypted envelopes and commitments; do not create plaintext AOID columns.',
    ],
  },
  {
    id: 'azure-cosmos-db',
    label: 'Azure Cosmos DB',
    family: 'azure-database',
    requiredEnvVars: ['AZURE_COSMOS_DB_ENDPOINT', 'AZURE_COSMOS_DB_DATABASE'],
    optionalEnvVars: ['AZURE_COSMOS_DB_KEY'],
    capabilities: ['document-db'],
    purposes: ['metadata-ledger', 'address-verification-cache', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: false,
    recommendedScopes: [],
    docs: [],
    recommendedUse: [
      'document-style registry metadata',
      'multi-region commitment and revocation cache',
    ],
    caveats: [
      'Partition by public alias or commitment, not by raw address.',
    ],
  },
  {
    id: 'azure-monitor-application-insights',
    label: 'Azure Monitor / Application Insights',
    family: 'monitoring',
    requiredEnvVars: ['APPLICATIONINSIGHTS_CONNECTION_STRING'],
    optionalEnvVars: [],
    capabilities: ['monitoring'],
    purposes: ['audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresEntraApp: false,
    recommendedScopes: [],
    docs: [],
    recommendedUse: [
      'monitor connector latency, failures, and queue health',
      'track redacted operational metrics',
    ],
    caveats: [
      'Telemetry must not include raw addresses, AGID-S ciphertext, proof witnesses, or phone numbers.',
    ],
  },
  {
    id: 'microsoft-fabric-power-bi',
    label: 'Microsoft Fabric / Power BI',
    family: 'analytics',
    requiredEnvVars: ['MICROSOFT_FABRIC_WORKSPACE_ID'],
    optionalEnvVars: ['POWER_BI_WORKSPACE_ID', 'POWER_BI_DATASET_ID'],
    capabilities: ['bi-dashboard'],
    purposes: ['analytics-dashboard', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.fabric, MICROSOFT_DOCS.powerBi],
    recommendedUse: [
      'visualize delivery success rate, POS latency, address quality, issuer health, terminal uptime, and review backlog',
      'publish aggregated operational dashboards for enterprise and public-sector deployments',
    ],
    caveats: [
      'Analytics exports must be aggregated, bucketed, or commitment-only.',
      'Never export raw address strings, exact household-level AGIDs, proof witnesses, or individual recipient timelines.',
    ],
  },
  {
    id: 'dynamics-365-dataverse',
    label: 'Dynamics 365 / Dataverse',
    family: 'business-apps',
    requiredEnvVars: ['MICROSOFT_TENANT_ID', 'MICROSOFT_CLIENT_ID', 'DATAVERSE_BASE_URL'],
    optionalEnvVars: ['MICROSOFT_CLIENT_SECRET'],
    capabilities: ['crm'],
    purposes: ['business-account-sync', 'workflow-automation', 'audit-monitoring'],
    defaultPrivacyMode: 'organization-metadata-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: [],
    docs: [MICROSOFT_DOCS.identityAuthCode],
    recommendedUse: [
      'sync issuer, carrier, warehouse, NGO, or enterprise account metadata',
      'avoid personal address records unless a separate enterprise policy permits it',
    ],
    caveats: [
      'Treat Dataverse as organization metadata, not a personal address vault.',
    ],
  },
  {
    id: 'power-platform',
    label: 'Power Platform / Power Automate',
    family: 'business-apps',
    requiredEnvVars: ['POWER_PLATFORM_ENVIRONMENT_ID'],
    optionalEnvVars: ['POWER_AUTOMATE_FLOW_URL'],
    capabilities: ['workflow'],
    purposes: ['workflow-automation', 'webhook-event-dispatch', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresEntraApp: true,
    recommendedScopes: [],
    docs: [],
    recommendedUse: [
      'connect redacted address events to enterprise workflows',
      'manual review routing for Microsoft-heavy organizations',
    ],
    caveats: [
      'Use DLP policies and never pass raw address payloads to generic flows by default.',
    ],
  },
];

const VALID_SERVICE_IDS = new Set(MICROSOFT_SERVICE_PROFILES.map(profile => profile.id));
const VALID_PURPOSES = new Set<MicrosoftIntegrationPurpose>([
  'staff-sso',
  'external-user-access',
  'device-admin-access',
  'address-access-auth',
  'address-credential-vc',
  'teams-operator-alert',
  'outlook-notification',
  'sharepoint-evidence-vault',
  'onedrive-redacted-export',
  'azure-maps-geocode',
  'azure-maps-reverse-geocode',
  'document-ocr-address-import',
  'key-vault-secret-reference',
  'device-twin-management',
  'pos-device-health',
  'webhook-event-dispatch',
  'sms-email-voice-notification',
  'async-job-queue',
  'confidential-audit-ledger',
  'security-threat-detection',
  'api-gateway-rate-limit',
  'analytics-dashboard',
  'serverless-adapter',
  'encrypted-evidence-blob',
  'metadata-ledger',
  'address-verification-cache',
  'business-account-sync',
  'workflow-automation',
  'audit-monitoring',
]);
const VALID_PAYLOAD_CLASSES = new Set<MicrosoftPayloadClass>([
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
  'verified-credential-status',
  'secret-reference',
]);

function cleanText(value: unknown, maxLength = 160) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function cleanIdentifier(value: unknown) {
  return cleanText(value, 120).toLowerCase();
}

function normalizePayloadClass(value: unknown): MicrosoftPayloadClass {
  const cleaned = cleanIdentifier(value || 'none') as MicrosoftPayloadClass;
  return VALID_PAYLOAD_CLASSES.has(cleaned) ? cleaned : 'none';
}

function normalizeRequestedScopes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map(item => cleanText(item, 120))
    .filter(Boolean)
    .filter(item => /^[A-Za-z0-9_./:-]+$/.test(item)))]
    .sort();
}

function isPlaintextPayload(payloadClass: MicrosoftPayloadClass) {
  return payloadClass === 'plaintext-address' || payloadClass === 'document-image-or-pdf';
}

function isEncryptedPayload(payloadClass: MicrosoftPayloadClass) {
  return payloadClass === 'encrypted-aoid-envelope' || payloadClass === 'secret-reference';
}

function allowsPlaintext(profile: MicrosoftServiceProfile) {
  return profile.defaultPrivacyMode === 'ephemeral-plaintext-required';
}

export function listMicrosoftServiceProfiles(): MicrosoftServiceProfile[] {
  return MICROSOFT_SERVICE_PROFILES.map(profile => ({
    ...profile,
    requiredEnvVars: [...profile.requiredEnvVars],
    optionalEnvVars: [...profile.optionalEnvVars],
    capabilities: [...profile.capabilities],
    purposes: [...profile.purposes],
    recommendedScopes: [...profile.recommendedScopes],
    docs: [...profile.docs],
    recommendedUse: [...profile.recommendedUse],
    caveats: [...profile.caveats],
  }));
}

export function getMicrosoftServiceProfile(id: MicrosoftServiceId | string): MicrosoftServiceProfile | null {
  const cleaned = cleanIdentifier(id);
  const profile = MICROSOFT_SERVICE_PROFILES.find(item => item.id === cleaned);
  if (!profile) return null;
  return listMicrosoftServiceProfiles().find(item => item.id === profile.id) ?? null;
}

export function buildMicrosoftIntegrationPlan(input: MicrosoftIntegrationPlanInput): MicrosoftIntegrationPlan {
  const serviceId = cleanIdentifier(input.serviceId);
  const service = getMicrosoftServiceProfile(serviceId);
  const purpose = cleanIdentifier(input.purpose) as MicrosoftIntegrationPurpose;
  const payloadClass = normalizePayloadClass(input.payloadClass);
  const ownerConsent = input.ownerConsent === true;
  const encryptedAtRest = input.encryptedAtRest === true;
  const encryptedInTransit = input.encryptedInTransit === true;
  const serverSideOnly = input.serverSideOnly === true;
  const highRiskMode = input.highRiskMode === true;
  const requestedScopes = normalizeRequestedScopes(input.requestedScopes);
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredControls: string[] = [
    'no-client-side-microsoft-secret',
    'no-raw-address-in-logs-or-telemetry',
    'domain-separated-aliases-and-commitments',
  ];

  if (!VALID_SERVICE_IDS.has(serviceId as MicrosoftServiceId) || !service) {
    errors.push('unknown-microsoft-service');
  }
  if (!VALID_PURPOSES.has(purpose)) {
    errors.push('unknown-microsoft-purpose');
  }

  if (service && !service.purposes.includes(purpose)) {
    errors.push('service-purpose-not-supported');
  }

  if (service?.recommendedRuntime === 'server-side' || service?.recommendedRuntime === 'dashboard-admin-only') {
    requiredControls.push('server-side-token-exchange-or-managed-identity');
  }
  if (service?.requiresEntraApp) {
    requiredControls.push('microsoft-entra-app-registration');
    requiredControls.push('least-privilege-microsoft-permissions');
  }

  if (service?.defaultPrivacyMode === 'commitment-or-alias-only') {
    requiredControls.push('send-only-commitments-aliases-or-redacted-summaries');
  }
  if (service?.defaultPrivacyMode === 'encrypted-envelope-only') {
    requiredControls.push('owner-device-encryption-before-upload');
  }
  if (service?.defaultPrivacyMode === 'secret-reference-only') {
    requiredControls.push('store-secret-reference-not-secret-value');
  }
  if (service?.defaultPrivacyMode === 'ephemeral-plaintext-required') {
    requiredControls.push('ephemeral-request-no-provider-cache-assumption');
    requiredControls.push('explicit-user-or-enterprise-consent');
  }
  if (service?.id === 'microsoft-entra-external-id') {
    requiredControls.push('scope-based-address-access-policy');
    requiredControls.push('no-address-claims-in-id-token');
  }
  if (service?.id === 'microsoft-entra-verified-id') {
    requiredControls.push('credential-status-without-raw-address');
    requiredControls.push('issuer-trust-and-revocation-check');
  }
  if (service?.id === 'azure-iot-hub') {
    requiredControls.push('per-device-identity-and-key-rotation');
    requiredControls.push('device-telemetry-redaction');
  }
  if (service?.id === 'azure-communication-services') {
    requiredControls.push('no-address-in-notification-body');
    requiredControls.push('short-lived-action-link-or-alias');
  }
  if (service?.id === 'azure-confidential-ledger') {
    requiredControls.push('append-only-digest-or-root-only');
    requiredControls.push('ledger-receipt-verification');
  }
  if (service?.id === 'microsoft-sentinel' || service?.id === 'microsoft-defender-for-cloud') {
    requiredControls.push('security-telemetry-redaction');
    requiredControls.push('incident-link-alias-not-address');
  }
  if (service?.id === 'azure-api-management') {
    requiredControls.push('rate-limit-and-abuse-control-policy');
    requiredControls.push('request-response-body-log-redaction');
  }
  if (service?.id === 'microsoft-fabric-power-bi') {
    requiredControls.push('aggregate-or-bucketed-analytics-only');
    requiredControls.push('no-household-level-export');
  }

  if (isPlaintextPayload(payloadClass)) {
    if (!service || !allowsPlaintext(service)) {
      errors.push('plaintext-payload-not-allowed-for-service');
    }
    if (!ownerConsent) errors.push('owner-consent-required-for-plaintext-microsoft-processing');
    if (!encryptedInTransit) errors.push('encrypted-in-transit-required-for-plaintext-microsoft-processing');
    if (!serverSideOnly) errors.push('server-side-proxy-required-for-plaintext-microsoft-processing');
    if (payloadClass === 'document-image-or-pdf' && !encryptedAtRest) {
      errors.push('encrypted-at-rest-required-for-document-processing');
    }
  }

  if (isEncryptedPayload(payloadClass)) {
    if (!ownerConsent && payloadClass === 'encrypted-aoid-envelope') {
      errors.push('owner-consent-required-for-encrypted-aoid-sync');
    }
    if (!encryptedAtRest && payloadClass === 'encrypted-aoid-envelope') {
      errors.push('encrypted-at-rest-required-for-encrypted-aoid-sync');
    }
    if (!encryptedInTransit && payloadClass === 'encrypted-aoid-envelope') {
      errors.push('encrypted-in-transit-required-for-encrypted-aoid-sync');
    }
  }

  if (payloadClass === 'secret-reference' && service?.id !== 'azure-key-vault') {
    warnings.push('secret-reference-is-best-handled-by-azure-key-vault');
  }
  if (payloadClass === 'document-image-or-pdf' && service?.id !== 'azure-ai-document-intelligence') {
    errors.push('document-image-payload-requires-document-intelligence-purpose');
  }
  if (payloadClass === 'device-telemetry' && service?.id !== 'azure-iot-hub') {
    errors.push('device-telemetry-payload-requires-azure-iot-hub');
  }
  if (
    payloadClass === 'verified-credential-status'
    && service?.id !== 'microsoft-entra-verified-id'
  ) {
    errors.push('verified-credential-status-requires-entra-verified-id');
  }
  if (
    payloadClass === 'audit-digest'
    && service?.id !== 'azure-confidential-ledger'
    && service?.id !== 'azure-sql-database'
    && service?.id !== 'azure-cosmos-db'
  ) {
    errors.push('audit-digest-requires-ledger-or-database-service');
  }
  if (
    payloadClass === 'security-alert'
    && service?.id !== 'microsoft-sentinel'
    && service?.id !== 'microsoft-defender-for-cloud'
    && service?.id !== 'azure-monitor-application-insights'
  ) {
    errors.push('security-alert-requires-monitoring-or-siem-service');
  }
  if (
    payloadClass === 'analytics-aggregate'
    && service?.id !== 'microsoft-fabric-power-bi'
    && service?.id !== 'azure-monitor-application-insights'
  ) {
    errors.push('analytics-aggregate-requires-analytics-service');
  }
  if (payloadClass === 'plaintext-address' && service?.id !== 'azure-maps') {
    warnings.push('plaintext-address-should-usually-be-replaced-by-agid-or-commitment');
  }

  if (highRiskMode) {
    requiredControls.push('high-risk-mode-no-precise-address-retention');
    if (isPlaintextPayload(payloadClass)) {
      warnings.push('high-risk-mode-prefers-local-ocr-local-geocoding-or-agid-s-over-microsoft-plaintext-processing');
    }
  }

  const expandedScopes = service
    ? [...new Set([...service.recommendedScopes, ...requestedScopes])].sort()
    : requestedScopes;
  if (expandedScopes.some(scope => /all$/i.test(scope) || scope.includes('.ReadWrite.All'))) {
    warnings.push('broad-microsoft-graph-scope-requires-admin-review');
  }

  const sendsPlaintextAddressToMicrosoft = Boolean(service && isPlaintextPayload(payloadClass) && allowsPlaintext(service));
  const storesRawAddressInMicrosoft = false;
  const serverSideOnlyRequired = Boolean(service && (
    service.recommendedRuntime === 'server-side'
    || service.recommendedRuntime === 'dashboard-admin-only'
    || isPlaintextPayload(payloadClass)
  ));

  return {
    modelVersion: MICROSOFT_SERVICE_INTEGRATION_MODEL_VERSION,
    service,
    purpose,
    payloadClass,
    allowed: errors.length === 0,
    requiredEnvVars: service ? [...service.requiredEnvVars] : [],
    requiredControls: [...new Set(requiredControls)].sort(),
    recommendedScopes: expandedScopes,
    dataFlow: {
      sendsPlaintextAddressToMicrosoft,
      storesRawAddressInMicrosoft,
      clientSecretAllowedInBrowser: false,
      serverSideOnlyRequired,
      highRiskModeCompatible: !highRiskMode || !isPlaintextPayload(payloadClass),
    },
    errors,
    warnings,
  };
}
