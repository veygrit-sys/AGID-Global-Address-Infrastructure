import { API_V1_BASE_PATH } from './apiVersion';
import { AGID_SECURITY_POLICY } from './agidSecurity';
import {
  AGID_AOID_GOVERNANCE_MODEL,
  AGID_AOID_GOVERNANCE_MODEL_VERSION,
} from './agidAoidGovernance';
import {
  AGID_POLKADOT_COMMITMENT_ALGORITHM,
  AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
  listPolkadotIntegrationStages,
} from './polkadotIntegration';
import { CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION } from './credentialIssuerTrustRegistry';
import { ZK_PROOF_BUNDLE_REGISTRY_VERSION } from './zkProofBundleRegistry';
import { REVOCATION_FRESHNESS_ROOT_ANCHOR_VERSION } from './revocationFreshnessRootAnchoring';
import { POLKADOT_ADAPTER_MODEL_VERSION } from './polkadotAdapter';
import { AGID_MCP_PROTOCOL_VERSION, AGID_MCP_TOOL_NAMES } from './mcpServer';
import { AMN_MODEL_VERSION, AMN_REGISTRY_VERSION } from './addressMorphismNetwork';
import {
  CLOUD_DB_INTEGRATION_MODEL_VERSION,
  listCloudDbConnectorProfiles,
} from './cloudDbIntegration';
import {
  DATABASE_ADAPTER_COMPATIBILITY_VERSION,
  summarizeDatabaseAdapterCompatibility,
} from './databaseAdapterCompatibility';
import {
  ADDRESS_INTENT_EVIDENCE_SOURCES,
  ADDRESS_INTENT_MODEL_VERSION,
  ADDRESS_INTENT_MODES,
  ADDRESS_INTENT_NEXT_ACTIONS,
  ADDRESS_INTENT_PURPOSES,
  ADDRESS_INTENT_STATUSES,
} from './addressIntent';
import {
  ADDRESS_ELEMENT_CHANNELS,
  ADDRESS_ELEMENT_FIELD_KEYS,
  ADDRESS_ELEMENT_MODEL_VERSION,
  ADDRESS_ELEMENT_NEXT_ACTIONS,
  ADDRESS_ELEMENT_STATUSES,
} from './addressElement';
import {
  ADDRESS_RADAR_DECISIONS,
  ADDRESS_RADAR_MODEL_VERSION,
  ADDRESS_RADAR_NEXT_ACTIONS,
  ADDRESS_RADAR_RISK_LEVELS,
} from './addressRadar';
import {
  ADDRESS_SIGNAL_MODEL_VERSION,
  ADDRESS_SIGNAL_OUTCOMES,
  ADDRESS_SIGNAL_REASONS,
} from './addressSignal';
import {
  ADDRESS_CONNECT_ENDPOINT_KINDS,
  ADDRESS_CONNECT_MODEL_VERSION,
  ADDRESS_CONNECT_ROLES,
  ADDRESS_CONNECT_SCOPES,
  ADDRESS_CONNECT_WEBHOOK_TOPICS,
} from './addressConnect';
import {
  ADDRESS_CONNECT_CRITICAL_WEBHOOK_TOPICS,
  ADDRESS_CONNECT_OPERATIONAL_REQUIREMENT_CATEGORIES,
  ADDRESS_CONNECT_OPERATIONS_MODEL_VERSION,
} from './addressConnectOperations';
import {
  ADDRESS_BULK_JOB_KINDS,
  ADDRESS_CACHE_CLASSES,
  ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION,
  ADDRESS_SCALE_STORE_ROLES,
  ADDRESS_SCALE_WORKLOADS,
} from './addressScaleArchitecture';
import {
  MANAGED_ZK_BACKENDS,
  MANAGED_ZK_DEPLOYMENT_PROFILES,
  MANAGED_ZK_PROOF_FAMILIES,
  MANAGED_ZK_PROOF_SERVER_VERSION,
  MANAGED_ZK_WITNESS_MODES,
} from './managedZkProofServer';
import {
  PRIVATE_DEPLOYMENT_COMPONENT_IDS,
  PRIVATE_DEPLOYMENT_MODEL_VERSION,
  PRIVATE_DEPLOYMENT_NETWORK_MODES,
  PRIVATE_DEPLOYMENT_SECTORS,
} from './privateDeployment';
import {
  ADDRESS_TERMINAL_DEVICE_CLASSES,
  ADDRESS_TERMINAL_MODEL_VERSION,
  ADDRESS_TERMINAL_SCREENS,
} from './addressTerminal';
import {
  ADDRESS_LAUNCH_CENTER_CATEGORIES,
  ADDRESS_LAUNCH_CENTER_ENVIRONMENTS,
  ADDRESS_LAUNCH_CENTER_ITEM_STATUSES,
  ADDRESS_LAUNCH_CENTER_MODEL_VERSION,
  ADDRESS_LAUNCH_CENTER_MODES,
  ADDRESS_LAUNCH_CENTER_PROFILES,
  ADDRESS_LAUNCH_CENTER_STATUSES,
} from './addressLaunchCenter';
import {
  ADDRESS_DASHBOARD_SECTIONS,
  ADDRESS_DISPUTE_STATUSES,
  ADDRESS_DISPUTE_TYPES,
  ADDRESS_IDENTITY_CLAIMS,
  ADDRESS_IDENTITY_METHODS,
  ADDRESS_OPERATIONS_MODEL_VERSION,
} from './addressOperations';
import { POS_ACCEPTANCE_MODEL_VERSION } from './posAcceptance';
import { POS_RUNTIME_POLICY_VERSION } from './posRuntimePolicy';
import { EXTERNAL_POS_INTEGRATION_MODEL_VERSION } from './externalPosIntegration';
import { CROSS_BORDER_AUXILIARY_DATA_VERSION } from './crossBorderAuxiliaryData';

const jsonResponse = (schemaRef: string, description = 'JSON response') => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: schemaRef },
    },
  },
});

const errorResponse = {
  description: 'Error response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
};

const latitude = {
  name: 'lat',
  in: 'query',
  required: true,
  schema: { type: 'number', minimum: -90, maximum: 90 },
};

const longitude = {
  name: 'lon',
  in: 'query',
  required: true,
  schema: { type: 'number', minimum: -180, maximum: 180 },
};

const optionalCountryCode = {
  name: 'cc',
  in: 'query',
  required: false,
  schema: { type: 'string', minLength: 2, maxLength: 12 },
};

const searchLanguageHint = {
  name: 'accept_language',
  in: 'query',
  required: false,
  description: 'Search-only provider language hint derived from the query text. It is independent from app UI language and address-display language tabs.',
  schema: { type: 'string' },
};

const coordGetResponses = {
  '200': jsonResponse('#/components/schemas/GenericJson'),
  '400': errorResponse,
  '500': errorResponse,
};

const CLOUD_DB_OPENAPI_PROFILES = listCloudDbConnectorProfiles();
const CLOUD_DB_OPENAPI_PROVIDER_IDS = CLOUD_DB_OPENAPI_PROFILES.map(profile => profile.id);
const CLOUD_DB_OPENAPI_PROVIDER_FAMILIES = Array.from(
  new Set(CLOUD_DB_OPENAPI_PROFILES.map(profile => profile.family)),
);
const CLOUD_DB_OPENAPI_COMPATIBILITY = summarizeDatabaseAdapterCompatibility();

export const AGID_OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'AGID API',
    version: '1.0.0',
    summary: 'Versioned API for AGID grid, address, postal, geocoding, and evidence workflows.',
    description: [
      'AGID v1 exposes stable integration endpoints under /api/v1.',
      'The legacy /api paths remain available as compatibility aliases while clients migrate.',
    ].join(' '),
  },
  servers: [
    {
      url: API_V1_BASE_PATH,
      description: 'AGID v1 API base path',
    },
  ],
  tags: [
    { name: 'System', description: 'Health, OpenAPI, and communication capabilities.' },
    { name: 'MCP', description: 'Model Context Protocol JSON-RPC tool surface for public AGID integration tasks.' },
    { name: 'Integrations', description: 'Tenant-configured external system adapters with server-side credentials and dry-run safeguards.' },
    { name: 'Cloud/DB', description: 'Cloud service and database adapter planning without plaintext AOID storage.' },
    { name: 'POS', description: 'QR and NFC acceptance receipts for retail, pickup, and delivery handoff terminals.' },
    { name: 'Cross-Border', description: 'Auxiliary public-data planning for cross-border delivery, POS, and shopping agents.' },
    { name: 'Hybrid Quality', description: 'Central/device/SDK runtime and quality decisions.' },
    { name: 'Address', description: 'Address parsing, translation, registration support, and metadata.' },
    { name: 'Address Element', description: 'Stripe Elements-style embeddable address input state, safe autocomplete, and high-risk UX policy.' },
    { name: 'Address Radar', description: 'Stripe Radar-style address risk rules for QR replay, enumeration, AOID duplicates, and handoff anomalies.' },
    { name: 'Address Signal', description: 'Pre-delivery decision signals for QR freshness, nullifier reuse, address quality, carrier device trust, and issuer status.' },
    { name: 'Address Intents', description: 'Stripe-style address workflow state machines for delivery, return, aid, identity, and customs flows.' },
    { name: 'Address Operations', description: 'Stripe-style identity checks, webhooks, disputes, tax/customs context, and dashboard snapshots without raw address payloads.' },
    { name: 'Address Connect', description: 'Stripe Connect-style organization, issuer, carrier, endpoint, webhook, and trust-registry metadata without personal addresses.' },
    { name: 'Address Scale', description: 'Bulk processing, cache, Redis, Postgres, MongoDB, CQRS, and offline topology planning without private address material.' },
    { name: 'Address Terminal', description: 'Stripe Terminal-style POS fleet, device diagnostics, sync posture, offline queue, staff, and reverification views.' },
    { name: 'Drone / Locker Ops', description: 'Reachability evidence API, local MQTT/HTTP/Modbus simulator, and privacy-safe QR/NFC locker operation surfaces.' },
    { name: 'Address Launch Center', description: 'Plaid-style production launch checklist for webhook signatures, OAuth scopes, revocation, redacted logs, duplicate AOID prevention, high-risk mode, threat model templates, and release security.' },
    { name: 'Credentials', description: 'Credential issuer trust registry, issuer-scope evaluation, and server-managed credential checks.' },
    { name: 'ZK Proofs', description: 'Public proof bundle registration, compatibility checks, and lifecycle controls.' },
    { name: 'Private Deployments', description: 'Private deployment planning for municipalities, NGOs, and carriers without accepting plaintext address or witness material.' },
    { name: 'Polkadot', description: 'Public commitment planning, anchoring, querying, and finality checks.' },
    { name: 'AMN', description: 'Address Morphism Network resolution envelopes, public commitments, and registry checks.' },
    { name: 'Postal', description: 'Postal code lookup, nearest postal code, and source-backed proxies.' },
    { name: 'Geocoding', description: 'Search, reverse geocoding, routing, and provider proxies.' },
    { name: 'Geography', description: 'Elevation, sea, terrain, natural risk, and country evidence.' },
    { name: 'Drone', description: 'Internal drone point and route-adjacent evidence endpoints.' },
  ],
  paths: {
    '/openapi.json': {
      get: {
        tags: ['System'],
        summary: 'OpenAPI specification',
        operationId: 'getOpenApiSpec',
        responses: {
          '200': {
            description: 'OpenAPI 3.1 specification for AGID v1',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
        },
      },
    },
    '/mcp': {
      post: {
        tags: ['MCP'],
        summary: 'Model Context Protocol JSON-RPC endpoint',
        operationId: 'postMcpJsonRpc',
        description: 'Serves AGID MCP initialize, tools/list, and tools/call over Streamable HTTP-style JSON-RPC. The public MCP surface accepts proofs, commitments, registry roots, and non-private integration metadata only.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/McpJsonRpcRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/McpJsonRpcResponse'),
          '400': jsonResponse('#/components/schemas/McpJsonRpcResponse', 'Invalid JSON-RPC request'),
          '500': errorResponse,
        },
      },
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Basic health check',
        operationId: 'getHealth',
        responses: {
          '200': jsonResponse('#/components/schemas/HealthResponse'),
        },
      },
    },
    '/communication/health': {
      get: {
        tags: ['System'],
        summary: 'Communication feature health',
        operationId: 'getCommunicationHealth',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultCommunicationHealth'),
        },
      },
    },
    '/integrations/oracle-opera/health': {
      get: {
        tags: ['Integrations'],
        summary: 'Oracle OPERA/OHIP adapter health',
        operationId: 'getOracleOperaIntegrationHealth',
        description: 'Returns masked readiness for the Oracle Hospitality Integration Platform adapter. Credentials and endpoint paths are configured server-side through OPERA_* environment variables.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultOracleOperaIntegrationHealth'),
        },
      },
    },
    '/integrations/oracle-opera/address': {
      post: {
        tags: ['Integrations'],
        summary: 'Sync an AGID address payload to Oracle OPERA',
        operationId: 'postOracleOperaAddressSync',
        description: 'Builds an OPERA/OHIP-compatible address envelope from an AGID address. The adapter defaults to dry-run and only performs live writes when OPERA_DRY_RUN=false, credentials are configured, and OPERA_ADDRESS_SYNC_PATH is set.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OracleOperaAddressSyncRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultOracleOperaAddressSyncResult'),
          '400': errorResponse,
          '502': errorResponse,
        },
      },
    },
    '/cloud-db/connectors': {
      get: {
        tags: ['Cloud/DB'],
        summary: 'List cloud service and database connector profiles',
        operationId: 'getCloudDbConnectors',
        description: 'Returns provider-agnostic connector profiles for object storage, SQL databases, document databases, KV caches, and webhook sinks. Connector profiles describe required environment variables and privacy caveats; they do not open network connections.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultCloudDbConnectors'),
        },
      },
    },
    '/cloud-db/compatibility': {
      get: {
        tags: ['Cloud/DB'],
        summary: 'List database adapter compatibility status',
        operationId: 'getCloudDbCompatibility',
        description: 'Returns the supported database and cloud backend matrix, separating runtime Address Resolution Ledger adapters from connector-plan-only, cache-only, export, and planned runtime adapters. No provider connection is opened.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultDatabaseAdapterCompatibility'),
          '500': errorResponse,
        },
      },
    },
    '/cloud-db/plan': {
      post: {
        tags: ['Cloud/DB'],
        summary: 'Plan a cloud or database integration safely',
        operationId: 'postCloudDbPlan',
        description: 'Evaluates whether a proposed AGID/AOID cloud or database operation is allowed before any provider SDK dispatch. AOID private data is accepted only as an owner-consented encrypted envelope.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CloudDbConnectorPlanRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultCloudDbConnectorPlan'),
          '400': errorResponse,
        },
      },
    },
    '/cloud-db/sync-job': {
      post: {
        tags: ['Cloud/DB'],
        summary: 'Create a local cloud or database sync job contract',
        operationId: 'postCloudDbSyncJob',
        description: 'Creates a sync queue record and provider adapter contract after the Cloud/DB privacy plan passes. The endpoint does not construct provider-specific HTTP requests or persist plaintext AOID payloads.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CloudDbSyncJobRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultCloudDbSyncJob'),
          '400': errorResponse,
        },
      },
    },
    '/address-intents/capabilities': {
      get: {
        tags: ['Address Intents'],
        summary: 'Describe AddressIntent state-machine capabilities',
        operationId: 'getAddressIntentCapabilities',
        description: 'Returns allowed AddressIntent statuses, purposes, modes, evidence sources, next actions, and the public-only privacy boundary.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressIntentCapabilities'),
        },
      },
    },
    '/address-intents': {
      post: {
        tags: ['Address Intents'],
        summary: 'Create an AddressIntent',
        operationId: 'postAddressIntent',
        description: 'Creates a Stripe PaymentIntent-style address workflow object. It stores workflow evidence fingerprints, status, missing evidence, and next action only; raw addresses, raw AGID/AOID values, proof codes, and recipient contact fields are not part of the public intent surface.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressIntentRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressIntent'),
          '409': errorResponse,
        },
      },
    },
    '/address-intents/recent': {
      get: {
        tags: ['Address Intents'],
        summary: 'List recent AddressIntents',
        operationId: 'getRecentAddressIntents',
        description: 'Returns recent in-memory AddressIntent records for local development and POS review. Production deployments should replace the store with SQLite, Postgres, Redis, or MongoDB adapters.',
        parameters: [
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultRecentAddressIntents'),
        },
      },
    },
    '/address-intents/{intentId}': {
      get: {
        tags: ['Address Intents'],
        summary: 'Fetch an AddressIntent',
        operationId: 'getAddressIntent',
        parameters: [
          { name: 'intentId', in: 'path', required: true, schema: { type: 'string', pattern: '^AIT-[A-F0-9]{16,32}$' } },
        ],
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressIntent'),
          '404': errorResponse,
        },
      },
    },
    '/address-intents/{intentId}/update': {
      post: {
        tags: ['Address Intents'],
        summary: 'Update an AddressIntent with new evidence',
        operationId: 'postAddressIntentUpdate',
        parameters: [
          { name: 'intentId', in: 'path', required: true, schema: { type: 'string', pattern: '^AIT-[A-F0-9]{16,32}$' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressIntentUpdateRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressIntent'),
          '404': errorResponse,
          '409': errorResponse,
        },
      },
    },
    '/address-element/capabilities': {
      get: {
        tags: ['Address Element'],
        summary: 'Describe AGID Address Element capabilities',
        operationId: 'getAddressElementCapabilities',
        description: 'Returns the embeddable address input feature set, supported channels, field keys, and public API privacy boundary. Raw field values are intentionally excluded from this public surface.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressElementCapabilities'),
        },
      },
    },
    '/address-element/session': {
      post: {
        tags: ['Address Element'],
        summary: 'Build a safe Address Element session state',
        operationId: 'postAddressElementSession',
        description: 'Builds a Stripe Elements-style address input session from public field presence, postal evidence, AGID commitments, scan capabilities, and high-risk policy. Public API requests must not include raw address text, recipient data, phone numbers, raw AGID/AOID values, or correction text.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressElementSessionRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressElementSession'),
          '400': errorResponse,
          '409': errorResponse,
        },
      },
    },
    '/address-radar/rules': {
      get: {
        tags: ['Address Radar'],
        summary: 'List Address Radar rules',
        operationId: 'getAddressRadarRules',
        description: 'Returns the built-in risk rules for QR copy/replay, address enumeration, AOID duplicate registration, handoff anomalies, revocation, quality, and offline conflicts.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressRadarRules'),
        },
      },
    },
    '/address-radar/evaluate': {
      post: {
        tags: ['Address Radar'],
        summary: 'Evaluate an Address Radar event',
        operationId: 'postAddressRadarEvaluate',
        description: 'Evaluates public and commitment-only risk signals. Raw address text, raw AGID/AOID values, recipient names, proof codes, and phone numbers are rejected by the public API boundary.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressRadarEvaluationRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressRadarEvaluation'),
          '400': errorResponse,
          '409': errorResponse,
        },
      },
    },
    '/address-signal/checks': {
      get: {
        tags: ['Address Signal'],
        summary: 'List Address Signal pre-delivery checks',
        operationId: 'getAddressSignalChecks',
        description: 'Returns the pre-delivery checks and operator-facing outcomes used before shipment handoff. The surface stores signal metadata only, not raw addresses, raw AGID/AOID values, or QR payloads.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressSignalChecks'),
        },
      },
    },
    '/address-signal/evaluate': {
      post: {
        tags: ['Address Signal'],
        summary: 'Evaluate pre-delivery Address Signal evidence',
        operationId: 'postAddressSignalEvaluate',
        description: 'Evaluates QR expiry, nullifier reuse, address quality, high-value delivery, carrier device trust, issuer status, freshness, and offline conflicts before handoff. Raw private address material is rejected by the public API boundary.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressSignalEvaluationRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressSignalEvaluation'),
          '400': errorResponse,
          '409': errorResponse,
        },
      },
    },
    '/address-operations/capabilities': {
      get: {
        tags: ['Address Operations'],
        summary: 'Describe Address Operations capabilities',
        operationId: 'getAddressOperationsCapabilities',
        description: 'Returns the Address Identity, Webhook, Dispute, Tax/Customs, and Dashboard surfaces. Public APIs accept commitments, references, hashes, and status metadata only.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressOperationsCapabilities'),
        },
      },
    },
    '/address-identity/verify': {
      post: {
        tags: ['Address Operations'],
        summary: 'Verify public address identity evidence references',
        operationId: 'postAddressIdentityVerify',
        description: 'Checks whether AOID credential refs, passkey challenge hashes, issuer credential refs, freshness roots, and revocation roots are sufficient for address ownership, residence, and delivery eligibility. Raw address text, raw AGID/AOID, passkey secrets, and proof codes are rejected.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressIdentityVerificationRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressIdentityVerification'),
          '400': errorResponse,
          '409': errorResponse,
        },
      },
    },
    '/address-webhooks/event': {
      post: {
        tags: ['Address Operations'],
        summary: 'Queue an Address Webhook event',
        operationId: 'postAddressWebhookEvent',
        description: 'Queues public webhook topics such as address_intent.verified, handoff.completed, credential.revoked, and qr.used using payload fingerprints or safe public references only.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressWebhookEventRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressWebhookEvent'),
          '400': errorResponse,
        },
      },
    },
    '/address-disputes/case': {
      post: {
        tags: ['Address Operations'],
        summary: 'Open an Address Dispute case',
        operationId: 'postAddressDisputeCase',
        description: 'Creates public-reference dispute cases for misdelivery, address conflict, same-address claim, and PID merge/split review. Evidence must be references or commitments, not raw personal address material.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressDisputeCaseRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressDisputeCase'),
          '400': errorResponse,
        },
      },
    },
    '/address-tax-customs/context': {
      post: {
        tags: ['Address Operations'],
        summary: 'Build Address Tax / Customs context',
        operationId: 'postAddressTaxCustomsContext',
        description: 'Builds a fully-free local-first tax/customs support context for cross-border delivery, POS, and shopping-agent flows using country codes, HS code, declared value, currency, risk flags, and private address proof flags. It is decision support, not customs clearance.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressTaxCustomsContextRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressTaxCustomsContext'),
          '400': errorResponse,
          '422': errorResponse,
        },
      },
    },
    '/address-dashboard/snapshot': {
      post: {
        tags: ['Address Operations'],
        summary: 'Build an Address Dashboard snapshot',
        operationId: 'postAddressDashboardSnapshot',
        description: 'Builds a Stripe Dashboard-style operational snapshot for logs, audit, API keys, terminals, issuers, webhooks, review queue, disputes, and tax/customs without storing personal address payloads.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressDashboardSnapshotRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressDashboardSnapshot'),
          '400': errorResponse,
          '409': errorResponse,
        },
      },
    },
    '/address-connect/capabilities': {
      get: {
        tags: ['Address Connect'],
        summary: 'Describe Address Connect capabilities',
        operationId: 'getAddressConnectCapabilities',
        description: 'Returns organization-only roles, endpoint kinds, webhook topics, scopes, and the no-personal-address privacy boundary for Address Connect.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressConnectCapabilities'),
        },
      },
    },
    '/address-connect/registry': {
      post: {
        tags: ['Address Connect'],
        summary: 'Build an Address Connect registry snapshot',
        operationId: 'postAddressConnectRegistry',
        description: 'Normalizes issuer, carrier, municipality, NGO, EC, warehouse, POS provider, customs, and auditor metadata. Raw addresses, raw AGID/AOID values, API keys, tokens, and secrets are rejected.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressConnectRegistryRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressConnectRegistry'),
          '400': errorResponse,
        },
      },
    },
    '/address-connect/discover': {
      post: {
        tags: ['Address Connect'],
        summary: 'Discover Address Connect endpoints',
        operationId: 'postAddressConnectDiscover',
        description: 'Finds organization endpoint references by role, endpoint kind, country, or capability. Discovery returns public endpoint metadata only and never stores personal address material.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressConnectDiscoverRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressConnectDiscovery'),
          '400': errorResponse,
        },
      },
    },
    '/address-connect/operations/requirements': {
      get: {
        tags: ['Address Connect'],
        summary: 'Describe Address Connect operational requirements',
        operationId: 'getAddressConnectOperationalRequirements',
        description: 'Returns webhook, SLA, monitoring, and log-retention requirements for production Address Connect operations. Requirements are metadata only and never include personal address material.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressConnectOperationalRequirements'),
        },
      },
    },
    '/address-connect/operations/report': {
      post: {
        tags: ['Address Connect'],
        summary: 'Evaluate Address Connect operations',
        operationId: 'postAddressConnectOperationsReport',
        description: 'Builds an operational report from webhook endpoint policies, delivery samples, SLA objectives, and log-retention policy. The report flags signature failures, dead-letter queues, p95 latency, error budget burn, and unsafe logs.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressConnectOperationsReportRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressConnectOperationsReport'),
          '400': errorResponse,
          '409': errorResponse,
        },
      },
    },
    '/address-scale/capabilities': {
      get: {
        tags: ['Address Scale'],
        summary: 'Describe Address Scale architecture capabilities',
        operationId: 'getAddressScaleCapabilities',
        description: 'Returns workload kinds, store roles, Redis/Postgres/Mongo responsibilities, bulk jobs, cache classes, and privacy boundaries for high-load AGID/AOID address operations.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressScaleCapabilities'),
        },
      },
    },
    '/address-scale/topology': {
      post: {
        tags: ['Address Scale'],
        summary: 'Plan Redis/Postgres/Mongo topology for bulk address workloads',
        operationId: 'postAddressScaleTopology',
        description: 'Builds a store, cache, worker, index, and operation plan for high-load address resolution, POS handoff, shipping labels, webhooks, revocation, audit, or feedback learning. Raw address, raw AGID/AOID, proof code, token, API key, and secret material are rejected.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressScaleTopologyRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressScaleTopologyPlan'),
          '400': errorResponse,
          '409': errorResponse,
        },
      },
    },
    '/address-terminal/capabilities': {
      get: {
        tags: ['Address Terminal'],
        summary: 'Describe Address Terminal capabilities',
        operationId: 'getAddressTerminalCapabilities',
        description: 'Returns POS fleet screens, device classes, staff profiles, registry checks, offline controls, and raw-payload privacy boundaries.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressTerminalCapabilities'),
        },
      },
    },
    '/address-terminal/fleet': {
      post: {
        tags: ['Address Terminal'],
        summary: 'Build an Address Terminal fleet snapshot',
        operationId: 'postAddressTerminalFleet',
        description: 'Builds a POS terminal management snapshot covering terminals, device diagnostics, scan-history counts, registry sync, offline queue, staff permissions, and reverification workflow readiness.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressTerminalFleetRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressTerminalFleet'),
          '409': errorResponse,
        },
      },
    },
    '/address-launch-center/checklist': {
      get: {
        tags: ['Address Launch Center'],
        summary: 'List Address Launch Center production readiness checklist',
        operationId: 'getAddressLaunchCenterChecklist',
        description: 'Returns Plaid-style launch gates adapted for AGID: OAuth scopes, webhook signatures, revocation/freshness, redacted logs, duplicate AOID prevention, high-risk mode, typed errors, POS operations, privacy threat model templates, and release security. This endpoint returns checklist metadata only.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressLaunchCenterChecklist'),
        },
      },
    },
    '/address-launch-center/evaluate': {
      post: {
        tags: ['Address Launch Center'],
        summary: 'Evaluate Address Launch Center production readiness',
        operationId: 'postAddressLaunchCenterEvaluate',
        description: 'Evaluates public launch evidence for production readiness. Raw address text, raw AGID/AOID, proof codes, API keys, tokens, and secrets are rejected. Required production gates returning fail make the response blocked with HTTP 409.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressLaunchCenterEvaluationRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressLaunchCenterEvaluation'),
          '400': errorResponse,
          '409': errorResponse,
        },
      },
    },
    '/pos/capabilities': {
      get: {
        tags: ['POS'],
        summary: 'Describe QR and NFC POS acceptance capabilities',
        operationId: 'getPosCapabilities',
        description: 'Returns supported POS input channels and the no-raw-payload storage contract for QR/NFC address acceptance.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPosCapabilities'),
        },
      },
    },
    '/pos/acceptance': {
      post: {
        tags: ['POS'],
        summary: 'Accept a QR, NFC, or manual AGID address payload',
        operationId: 'postPosAcceptance',
        description: 'Validates an agid:address payload, agid:waybill shipping label payload, agid:nfc wrapper, AGID-S envelope, or direct public AGID and returns a redacted receipt. Shipping-label receipts use short-term waybill aliases and commitments; raw QR/NFC payloads, raw AGID, raw waybill ids, recipient names, phone numbers, proof codes, and exact private address text are not persisted in the receipt.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PosAcceptanceRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPosAcceptance'),
          '400': jsonResponse('#/components/schemas/AgidResultPosAcceptance', 'Rejected or invalid POS payload'),
        },
      },
    },
    '/pos/acceptance/recent': {
      get: {
        tags: ['POS'],
        summary: 'List recent redacted POS receipts',
        operationId: 'getRecentPosAcceptanceReceipts',
        description: 'Returns the in-memory recent POS receipt log. The log stores receipt metadata only and never stores raw QR/NFC payloads.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPosRecent'),
        },
      },
    },
    '/pos/external/capabilities': {
      get: {
        tags: ['POS'],
        summary: 'Describe external POS integration capabilities',
        operationId: 'getExternalPosCapabilities',
        description: 'Returns server-allowlisted external POS adapter metadata. Endpoint URLs and credential environment variable names are not returned.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultExternalPosCapabilities'),
        },
      },
    },
    '/pos/external/import': {
      post: {
        tags: ['POS'],
        summary: 'Validate external POS adapter metadata',
        operationId: 'postExternalPosImport',
        description: 'Validates metadata-only POS adapter manifests. Runtime URLs, secrets, customer fields, raw QR payloads, and private address fields are rejected.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ExternalPosManifest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultExternalPosImport'),
          '400': errorResponse,
        },
      },
    },
    '/pos/external/request': {
      post: {
        tags: ['POS'],
        summary: 'Run an external POS operation',
        operationId: 'postExternalPosRequest',
        description: 'Runs a server-allowlisted external POS adapter operation. By default AGID sends redacted receipt/order metadata only; plaintext customer/address export requires explicit opt-in and a plaintext-required runtime profile.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ExternalPosOperationRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultExternalPosRun'),
          '400': errorResponse,
        },
      },
    },
    '/pos/external/handoff-complete': {
      post: {
        tags: ['POS'],
        summary: 'Notify external POS that a handoff completed',
        operationId: 'postExternalPosHandoffComplete',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ExternalPosOperationRequest' } } },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultExternalPosRun'),
          '400': errorResponse,
        },
      },
    },
    '/pos/external/sale-link': {
      post: {
        tags: ['POS'],
        summary: 'Link an AGID receipt to an external POS sale',
        operationId: 'postExternalPosSaleLink',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ExternalPosOperationRequest' } } },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultExternalPosRun'),
          '400': errorResponse,
        },
      },
    },
    '/pos/external/pickup-ready': {
      post: {
        tags: ['POS'],
        summary: 'Notify external POS that an order is ready for pickup',
        operationId: 'postExternalPosPickupReady',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ExternalPosOperationRequest' } } },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultExternalPosRun'),
          '400': errorResponse,
        },
      },
    },
    '/pos/external/receipt-export': {
      post: {
        tags: ['POS'],
        summary: 'Export a redacted AGID POS receipt to an external POS',
        operationId: 'postExternalPosReceiptExport',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ExternalPosOperationRequest' } } },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultExternalPosRun'),
          '400': errorResponse,
        },
      },
    },
    '/pos/external/customer-note': {
      post: {
        tags: ['POS'],
        summary: 'Create a redacted customer note in an external POS',
        operationId: 'postExternalPosCustomerNote',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ExternalPosOperationRequest' } } },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultExternalPosRun'),
          '400': errorResponse,
        },
      },
    },
    '/pos/external/refund-release': {
      post: {
        tags: ['POS'],
        summary: 'Notify external POS that a refund or escrow release can proceed',
        operationId: 'postExternalPosRefundRelease',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ExternalPosOperationRequest' } } },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultExternalPosRun'),
          '400': errorResponse,
        },
      },
    },
    '/cross-border/auxiliary/sources': {
      get: {
        tags: ['Cross-Border'],
        summary: 'List cross-border auxiliary data sources',
        operationId: 'getCrossBorderAuxiliarySources',
        description: 'Returns official, open, optional, and avoid-as-primary data sources for cross-border shipping, POS, and shopping agents. The response is source planning metadata only and does not accept private address payloads.',
        parameters: [
          {
            name: 'domain',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'phase',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'freeOnly',
            in: 'query',
            required: false,
            schema: { type: 'boolean' },
          },
        ],
        responses: {
          '200': jsonResponse('#/components/schemas/GenericJson'),
        },
      },
    },
    '/cross-border/auxiliary/context': {
      post: {
        tags: ['Cross-Border'],
        summary: 'Build cross-border auxiliary evidence context',
        operationId: 'postCrossBorderAuxiliaryContext',
        description: 'Returns required evidence domains, recommended source IDs, warnings, and manual-review reasons for a shipment or POS decision. It accepts countries, commodity data, barcode, declared value, and coarse address-proof flags only; raw address, AOID, recipient name, phone, and private history are outside this endpoint.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GenericJson' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/GenericJson'),
          '400': errorResponse,
        },
      },
    },
    '/shopping-agent/cross-border/context': {
      post: {
        tags: ['Cross-Border'],
        summary: 'Build shopping-agent cross-border context',
        operationId: 'postShoppingAgentCrossBorderContext',
        description: 'Shopping-agent alias for the cross-border auxiliary context builder. The use case is forced to shopping-agent so barcode and product-enrichment sources are considered.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GenericJson' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/GenericJson'),
          '400': errorResponse,
        },
      },
    },
    '/jobs/{jobId}/events': {
      get: {
        tags: ['System'],
        summary: 'Server-Sent Events stream for AGID jobs',
        operationId: 'getJobEvents',
        parameters: [
          {
            name: 'jobId',
            in: 'path',
            required: true,
            schema: { type: 'string', maxLength: 80 },
          },
        ],
        responses: {
          '200': {
            description: 'text/event-stream job status events',
            content: {
              'text/event-stream': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },
    '/hybrid/quality': {
      post: {
        tags: ['Hybrid Quality'],
        summary: 'Resolve hybrid runtime and quality policy',
        operationId: 'postHybridQuality',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HybridQualityRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultHybridQuality'),
          '400': errorResponse,
        },
      },
    },
    '/address/parse': {
      post: {
        tags: ['Address'],
        summary: 'Parse free-form address text',
        operationId: 'postAddressParse',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressParseRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AddressParseResponse'),
          '400': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/address/verify': {
      post: {
        tags: ['Address'],
        summary: 'Verify an address candidate for selected target countries',
        operationId: 'postAddressVerify',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressVerifyRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressVerification'),
          '409': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/address/verify/capabilities': {
      get: {
        tags: ['Address'],
        summary: 'Describe open-source address verification coverage',
        operationId: 'getAddressVerifyCapabilities',
        description: 'Reports the free/open-source verification strategy and country-format coverage. Paid API parity is claimed only for supplied authoritative evidence, not for countries where free delivery-point data is unavailable.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressVerificationCapabilities'),
        },
      },
    },
    '/address/standard-library/capabilities': {
      get: {
        tags: ['Address'],
        summary: 'Describe the standard-library address resolution plan',
        operationId: 'getAddressStandardLibraryCapabilities',
        description: 'Returns the local, official, open-source, and disabled resolver components that would be used for a country or address context. This endpoint plans resolution only; it does not fetch or store plaintext addresses.',
        parameters: [
          { name: 'cc', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'hasPostcode', in: 'query', required: false, schema: { type: 'boolean' } },
          { name: 'hasCoordinates', in: 'query', required: false, schema: { type: 'boolean' } },
          { name: 'sourceLanguage', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'targetLanguage', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'natural', in: 'query', required: false, schema: { type: 'boolean' } },
          { name: 'remote', in: 'query', required: false, schema: { type: 'boolean' } },
        ],
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressStandardLibraryResolution'),
        },
      },
    },
    '/address/standard-library/resolve': {
      post: {
        tags: ['Address'],
        summary: 'Build a standard-library address resolution plan',
        operationId: 'postAddressStandardLibraryResolve',
        description: 'Builds a resolver plan from request metadata, including local parsing, local format rules, optional libpostal-compatible parsing, official postal sources, open geodata, translation, and natural-geography fallbacks.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddressStandardLibraryResolveRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAddressStandardLibraryResolution'),
          '500': errorResponse,
        },
      },
    },
    '/credential-issuers/trust-registry/snapshot': {
      post: {
        tags: ['Credentials'],
        summary: 'Build a credential issuer trust registry snapshot',
        operationId: 'postCredentialIssuerTrustRegistrySnapshot',
        description: 'Normalizes credential issuer records and returns a public registry root, policy hash, issuer counts, and chain commitment payload. Private issuer keys and private address fields are not accepted.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CredentialIssuerTrustRegistrySnapshotRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultCredentialIssuerTrustRegistrySnapshot'),
          '400': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/credential-issuers/trust-registry/evaluate': {
      post: {
        tags: ['Credentials'],
        summary: 'Evaluate credential issuer trust against a registry snapshot',
        operationId: 'postCredentialIssuerTrustEvaluate',
        description: 'Checks that a credential issuer is registered, currently trusted, fresh, and scoped for the requested credential type, AGID/AOID layer, country, schema, and policy.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CredentialIssuerTrustEvaluateRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultCredentialIssuerTrustEvaluation'),
          '400': errorResponse,
          '409': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/credential-issuers/trust-registry/verify-credential': {
      post: {
        tags: ['Credentials'],
        summary: 'Verify address credential with issuer trust',
        operationId: 'postCredentialIssuerTrustVerifyCredential',
        description: 'Combines address credential checks with issuer trust evaluation. Signature verification uses server-managed issuer keys only; raw issuer key material is never accepted in the public request body.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CredentialIssuerTrustVerifyCredentialRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultCredentialIssuerTrustVerification'),
          '400': errorResponse,
          '409': errorResponse,
          '503': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/zk/proof-bundles/register': {
      post: {
        tags: ['ZK Proofs'],
        summary: 'Register a compatible public proof bundle',
        operationId: 'postZkProofBundleRegister',
        description: 'Checks proof compatibility, nullifier reuse, validity windows, and public-only storage before returning a bundle registry record.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ZkProofBundleRegisterRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultZkProofBundleRegistration'),
          '400': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/zk/proof-bundles/{bundleId}/verify': {
      post: {
        tags: ['ZK Proofs'],
        summary: 'Verify a registered proof bundle lifecycle state',
        operationId: 'postZkProofBundleVerify',
        parameters: [
          { name: 'bundleId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ZkProofBundleVerifyRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultZkProofBundleVerification'),
          '404': errorResponse,
          '409': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/zk/proof-bundles/{bundleId}/revoke': {
      post: {
        tags: ['ZK Proofs'],
        summary: 'Revoke a registered proof bundle',
        operationId: 'postZkProofBundleRevoke',
        parameters: [
          { name: 'bundleId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ZkProofBundleRevokeRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultZkProofBundleVerification'),
          '404': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/zk/proof-bundles/stats': {
      get: {
        tags: ['ZK Proofs'],
        summary: 'Get public proof bundle registry statistics',
        operationId: 'getZkProofBundleStats',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultZkProofBundleStats'),
          '500': errorResponse,
        },
      },
    },
    '/zk/managed-proof-server/capabilities': {
      get: {
        tags: ['ZK Proofs'],
        summary: 'Describe managed ZK proof generation server capabilities',
        operationId: 'getManagedZkProofServerCapabilities',
        description: 'Returns the managed ZK proof generation server contract, supported proof families, prover backends, deployment profiles, witness modes, and public-only privacy boundary. The recommended default is client-side witness generation with server-side job orchestration or verification.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultManagedZkProofServerCapabilities'),
          '500': errorResponse,
        },
      },
    },
    '/zk/managed-proof-server/jobs': {
      post: {
        tags: ['ZK Proofs'],
        summary: 'Create a managed ZK proof generation job contract',
        operationId: 'postManagedZkProofServerJob',
        description: 'Creates a bounded proof-generation job contract from public inputs, commitments, registry roots, policy hashes, circuit ids, and artifact references only. Raw addresses, raw AGID/AOID values, witness bodies, proof secrets, proving keys, holder secrets, and proof codes are rejected.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ManagedZkProofJobRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultManagedZkProofJob'),
          '400': errorResponse,
          '409': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/private-deployments/capabilities': {
      get: {
        tags: ['Private Deployments'],
        summary: 'Describe private deployment planning capabilities',
        operationId: 'getPrivateDeploymentCapabilities',
        description: 'Returns supported private deployment sectors, network modes, components, recommended profiles, and the public-only privacy boundary for municipalities, NGOs, and carriers.',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPrivateDeploymentCapabilities'),
          '500': errorResponse,
        },
      },
    },
    '/private-deployments/plan': {
      post: {
        tags: ['Private Deployments'],
        summary: 'Plan a municipality, NGO, or carrier private deployment',
        operationId: 'postPrivateDeploymentPlan',
        description: 'Builds a private deployment plan for a tenant from public deployment requirements only. Raw addresses, raw AGID/AOID values, witness bodies, proof secrets, API keys, recipient data, and private keys are rejected by implementation policy.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PrivateDeploymentPlanRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPrivateDeploymentPlan'),
          '400': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/revocation-freshness/anchor': {
      post: {
        tags: ['Credentials'],
        summary: 'Build a revocation and freshness root anchor',
        operationId: 'postRevocationFreshnessAnchor',
        description: 'Builds public roots and an anchorable chain commitment from a credential status registry snapshot.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RevocationFreshnessAnchorRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultRevocationFreshnessAnchor'),
          '400': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/revocation-freshness/verify': {
      post: {
        tags: ['Credentials'],
        summary: 'Verify a freshness proof against an anchored root',
        operationId: 'postRevocationFreshnessVerify',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RevocationFreshnessVerifyRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultRevocationFreshnessVerification'),
          '400': errorResponse,
          '409': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/polkadot/stages': {
      get: {
        tags: ['Polkadot'],
        summary: 'List the ordered Polkadot integration stages',
        operationId: 'getPolkadotStages',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPolkadotStages'),
          '500': errorResponse,
        },
      },
    },
    '/polkadot/commitment': {
      post: {
        tags: ['Polkadot'],
        summary: 'Build a public Polkadot chain commitment',
        operationId: 'postPolkadotCommitment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PolkadotCommitmentRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPolkadotCommitment'),
          '400': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/polkadot/anchor': {
      post: {
        tags: ['Polkadot'],
        summary: 'Anchor a public commitment with the configured adapter',
        operationId: 'postPolkadotAnchor',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PolkadotAnchorRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPolkadotAnchor'),
          '409': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/polkadot/commitments/{commitmentId}': {
      get: {
        tags: ['Polkadot'],
        summary: 'Query an anchored commitment record',
        operationId: 'getPolkadotCommitmentRecord',
        parameters: [
          { name: 'commitmentId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'networkId', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPolkadotCommitmentRecord'),
          '404': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/polkadot/commitments/{commitmentId}/finality': {
      post: {
        tags: ['Polkadot'],
        summary: 'Verify anchored commitment finality',
        operationId: 'postPolkadotCommitmentFinality',
        parameters: [
          { name: 'commitmentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PolkadotFinalityRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPolkadotFinality'),
          '202': jsonResponse('#/components/schemas/AgidResultPolkadotFinality'),
          '404': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/amn/resolve': {
      post: {
        tags: ['AMN'],
        summary: 'Create an AMN resolution envelope',
        operationId: 'postAmnResolve',
        description: 'Runs AMT resolution, commits candidate and evidence material, and stores only a public AMN envelope suitable for later ZK and chain anchoring workflows.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AmnResolutionRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAmnResolution'),
          '400': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/amn/registry/{envelopeId}/verify': {
      post: {
        tags: ['AMN'],
        summary: 'Verify a registered AMN envelope',
        operationId: 'postAmnRegistryEnvelopeVerify',
        parameters: [
          { name: 'envelopeId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AmnRegistryVerificationRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAmnEnvelopeVerification'),
          '404': errorResponse,
          '409': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/amn/registry/stats': {
      get: {
        tags: ['AMN'],
        summary: 'Get public AMN registry statistics',
        operationId: 'getAmnRegistryStats',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultAmnRegistryStats'),
          '500': errorResponse,
        },
      },
    },
    '/translate': {
      post: {
        tags: ['Address'],
        summary: 'Translate address or label text with open-source fallback rules',
        operationId: 'postTranslate',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TranslateRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/GenericJson'),
          '500': errorResponse,
        },
      },
    },
    '/address-metadata': {
      get: {
        tags: ['Address'],
        summary: 'Fetch country address metadata',
        operationId: 'getAddressMetadata',
        parameters: [
          {
            name: 'path',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'libaddressinput-style metadata path, for example JP or US.',
          },
        ],
        responses: coordGetResponses,
      },
    },
    '/data-quality/report': {
      get: {
        tags: ['Geography'],
        summary: 'Local data quality report',
        operationId: 'getDataQualityReport',
        responses: coordGetResponses,
      },
    },
    '/postal/capabilities': {
      get: {
        tags: ['Postal'],
        summary: 'Describe digest-pinned Postal Context runtime capability',
        operationId: 'getPostalContextCapabilities',
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPostalContextCapabilities'),
        },
      },
    },
    '/postal/releases/{country}': {
      get: {
        tags: ['Postal'],
        summary: 'Read the active Postal Context country-pack release',
        operationId: 'getPostalContextRelease',
        parameters: [
          {
            name: 'country',
            in: 'path',
            required: true,
            schema: { type: 'string', pattern: '^[A-Z]{2}$' },
          },
        ],
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPostalContextCountryStatus'),
          '404': errorResponse,
          '503': errorResponse,
        },
      },
    },
    '/postal/resolve': {
      post: {
        tags: ['Postal'],
        summary: 'Resolve a coordinate through a source-backed Postal Context pack',
        operationId: 'resolvePostalContext',
        description: 'Coordinates are accepted only in a POST body, are never echoed, and are resolved against an externally digest-pinned public country pack. Postal geometry alone cannot promote a result beyond postal-area.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PostalContextResolveRequest' },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPostalContextResolution'),
          '400': errorResponse,
          '404': errorResponse,
          '409': errorResponse,
          '503': errorResponse,
        },
      },
    },
    '/postal/intersects': {
      get: {
        tags: ['Postal'],
        summary: 'Find public Postal Context geometries intersecting a bounded bbox',
        operationId: 'intersectPostalContext',
        parameters: [
          { name: 'country', in: 'query', required: true, schema: { type: 'string', pattern: '^[A-Z]{2}$' } },
          { name: 'bbox', in: 'query', required: true, schema: { type: 'string', example: '139.70,35.65,139.80,35.75' } },
          { name: 'validAt', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          { name: 'knownAt', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 16, default: 16 },
            description: 'Maximum returned public geometry features. Results report truncation explicitly.',
          },
        ],
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPostalContextIntersection'),
          '400': errorResponse,
          '404': errorResponse,
          '503': errorResponse,
        },
      },
    },
    '/postal/{country}/{postalCode}': {
      get: {
        tags: ['Postal'],
        summary: 'Look up a postal code and its public geometry and address context',
        operationId: 'getPostalContextByCode',
        parameters: [
          { name: 'country', in: 'path', required: true, schema: { type: 'string', pattern: '^[A-Z]{2}$' } },
          { name: 'postalCode', in: 'path', required: true, schema: { type: 'string', maxLength: 64 } },
          { name: 'validAt', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          { name: 'knownAt', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          {
            name: 'geometry',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['geojson', 'none'], default: 'none' },
            description: 'Geometry is omitted by default and included only when explicitly set to geojson.',
          },
        ],
        responses: {
          '200': jsonResponse('#/components/schemas/AgidResultPostalContextLookup'),
          '400': errorResponse,
          '404': errorResponse,
          '503': errorResponse,
        },
      },
    },
    '/postal-code/nearest': {
      get: {
        tags: ['Postal'],
        summary: 'Nearest known postal code from local postal data',
        operationId: 'getNearestPostalCode',
        parameters: [latitude, longitude, optionalCountryCode],
        responses: coordGetResponses,
      },
    },
    '/postal-code/zippo': {
      get: {
        tags: ['Postal'],
        summary: 'Postal lookup through Zippopotam-compatible data',
        operationId: 'getZippoPostalCode',
        parameters: [
          { name: 'country', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'postcode', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/zippopotam/{country}/{postcode}': {
      get: {
        tags: ['Postal'],
        summary: 'Postal lookup by country and postcode',
        operationId: 'getZippopotamPostcode',
        parameters: [
          { name: 'country', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'postcode', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/jp-postcode': {
      get: {
        tags: ['Postal'],
        summary: 'Japan postcode lookup',
        operationId: 'getJapanPostcode',
        parameters: [
          { name: 'zipcode', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/in-pincode/{pincode}': {
      get: {
        tags: ['Postal'],
        summary: 'India PIN code lookup',
        operationId: 'getIndiaPincode',
        parameters: [
          { name: 'pincode', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/uk-postcode/{postcode}': {
      get: {
        tags: ['Postal'],
        summary: 'UK postcode lookup',
        operationId: 'getUnitedKingdomPostcode',
        parameters: [
          { name: 'postcode', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/cn-postcode': {
      get: {
        tags: ['Postal'],
        summary: 'China postcode lookup',
        operationId: 'getChinaPostcode',
        parameters: [
          { name: 'pc', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/nominatim/reverse': {
      get: {
        tags: ['Geocoding'],
        summary: 'Nominatim reverse geocoding proxy',
        operationId: 'getNominatimReverse',
        parameters: [
          latitude,
          longitude,
          { name: 'zoom', in: 'query', required: false, schema: { type: 'integer', default: 18 } },
          { name: 'addressdetails', in: 'query', required: false, schema: { type: 'integer', enum: [0, 1], default: 1 } },
          { name: 'lang', in: 'query', required: false, schema: { type: 'string' } },
          optionalCountryCode,
        ],
        responses: coordGetResponses,
      },
    },
    '/nominatim/search': {
      get: {
        tags: ['Geocoding'],
        summary: 'Nominatim search proxy with search-only language hints',
        operationId: 'getNominatimSearch',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 5 } },
          {
            name: 'lang',
            in: 'query',
            required: false,
            description: 'Search-only language hint for provider recall and labels; not an app or address language setting.',
            schema: { type: 'string' },
          },
        ],
        responses: coordGetResponses,
      },
    },
    '/osm-reverse': {
      get: {
        tags: ['Geocoding'],
        summary: 'OSM reverse geocoding with AGID country/language hints',
        operationId: 'getOsmReverse',
        parameters: [latitude, longitude, optionalCountryCode],
        responses: coordGetResponses,
      },
    },
    '/osm-search': {
      get: {
        tags: ['Geocoding'],
        summary: 'OSM search proxy with query-derived language hints',
        operationId: 'getOsmSearch',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 5 } },
          { name: 'polygon_geojson', in: 'query', required: false, schema: { type: 'integer', enum: [0, 1] } },
          searchLanguageHint,
        ],
        responses: coordGetResponses,
      },
    },
    '/photon': {
      get: {
        tags: ['Geocoding'],
        summary: 'Photon search proxy',
        operationId: 'getPhotonSearch',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 5 } },
          { name: 'lat', in: 'query', required: false, schema: { type: 'number' } },
          { name: 'lon', in: 'query', required: false, schema: { type: 'number' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/overpass': {
      get: {
        tags: ['Geocoding'],
        summary: 'Overpass proxy status',
        operationId: 'getOverpassStatus',
        responses: coordGetResponses,
      },
      post: {
        tags: ['Geocoding'],
        summary: 'Overpass query proxy',
        operationId: 'postOverpassQuery',
        requestBody: {
          required: true,
          content: {
            'text/plain': { schema: { type: 'string' } },
            'application/json': { schema: { type: 'object', additionalProperties: true } },
          },
        },
        responses: coordGetResponses,
      },
    },
    '/osrm/route': {
      get: {
        tags: ['Geocoding'],
        summary: 'OSRM route proxy',
        operationId: 'getOsrmRoute',
        parameters: [
          { name: 'start', in: 'query', required: true, schema: { type: 'string' }, description: 'lon,lat' },
          { name: 'end', in: 'query', required: true, schema: { type: 'string' }, description: 'lon,lat' },
          { name: 'profile', in: 'query', required: false, schema: { type: 'string', default: 'driving' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/navigation/resolve-destination': {
      get: {
        tags: ['Geocoding'],
        summary: 'Resolve a navigation destination',
        operationId: 'getNavigationDestination',
        parameters: [latitude, longitude],
        responses: coordGetResponses,
      },
    },
    '/drone/resolve-point': {
      get: {
        tags: ['Drone'],
        summary: 'Resolve a drone navigation point',
        operationId: 'getDroneResolvePoint',
        parameters: [latitude, longitude],
        responses: coordGetResponses,
      },
    },
    '/drone-delivery-evidence/capabilities': {
      get: {
        tags: ['Drone / Locker Ops'],
        summary: 'Describe the drone reachability evidence API',
        operationId: 'getDroneDeliveryEvidenceCapabilities',
        description: 'Returns the privacy-safe reachability API surface. This is not a flight-control or autopilot API.',
        responses: {
          '200': jsonResponse('#/components/schemas/GenericJson'),
          '500': errorResponse,
        },
      },
    },
    '/drone-delivery-evidence/report': {
      post: {
        tags: ['Drone / Locker Ops'],
        summary: 'Create a drone reachability evidence receipt',
        operationId: 'postDroneDeliveryEvidenceReport',
        description: 'Accepts delivery evidence metadata and returns public projection plus restricted commitments. Raw addresses, raw AGID/AOID, precise telemetry, and flight-control state are not accepted as public output.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/GenericJson'),
          '409': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/warehouse-locker-simulator/capabilities': {
      get: {
        tags: ['Drone / Locker Ops'],
        summary: 'Describe local locker simulator capabilities',
        operationId: 'getWarehouseLockerSimulatorCapabilities',
        description: 'Returns supported MQTT, HTTP, and Modbus simulator surfaces plus redaction boundaries.',
        responses: {
          '200': jsonResponse('#/components/schemas/GenericJson'),
          '500': errorResponse,
        },
      },
    },
    '/warehouse-locker-simulator/run': {
      post: {
        tags: ['Drone / Locker Ops'],
        summary: 'Run a local MQTT/HTTP/Modbus locker simulation',
        operationId: 'postWarehouseLockerSimulatorRun',
        description: 'Runs a local simulator for locker/PUDO command frames, reader health, QR/NFC access decisions, and redacted receipts without storing raw payloads or hardware secrets.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true },
            },
          },
        },
        responses: {
          '200': jsonResponse('#/components/schemas/GenericJson'),
          '409': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/overture/building-name': {
      get: {
        tags: ['Geocoding'],
        summary: 'Resolve building or place name candidates',
        operationId: 'getOvertureBuildingName',
        parameters: [latitude, longitude],
        responses: coordGetResponses,
      },
    },
    '/elevation': {
      get: {
        tags: ['Geography'],
        summary: 'Elevation lookup',
        operationId: 'getElevation',
        parameters: [latitude, longitude],
        responses: coordGetResponses,
      },
    },
    '/weather': {
      get: {
        tags: ['Geography'],
        summary: 'Weather lookup',
        operationId: 'getWeather',
        parameters: [
          { name: 'latitude', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'longitude', in: 'query', required: true, schema: { type: 'number' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/water-risk': {
      get: {
        tags: ['Geography'],
        summary: 'Water and wetland risk evidence',
        operationId: 'getWaterRisk',
        parameters: [latitude, longitude],
        responses: coordGetResponses,
      },
    },
    '/geological-risk': {
      get: {
        tags: ['Geography'],
        summary: 'Geological risk evidence',
        operationId: 'getGeologicalRisk',
        parameters: [latitude, longitude],
        responses: coordGetResponses,
      },
    },
    '/mountain/nearby': {
      get: {
        tags: ['Geography'],
        summary: 'Nearby mountain or peak evidence',
        operationId: 'getNearbyMountains',
        parameters: [latitude, longitude],
        responses: coordGetResponses,
      },
    },
    '/marine-regions': {
      get: {
        tags: ['Geography'],
        summary: 'Marine region lookup',
        operationId: 'getMarineRegions',
        parameters: [latitude, longitude],
        responses: coordGetResponses,
      },
    },
    '/country-boundary': {
      get: {
        tags: ['Geography'],
        summary: 'Country boundary geometry',
        operationId: 'getCountryBoundary',
        parameters: [
          { name: 'cc', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/country-cities': {
      get: {
        tags: ['Geography'],
        summary: 'Country city candidates',
        operationId: 'getCountryCities',
        parameters: [
          { name: 'cc', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/country-stats': {
      get: {
        tags: ['Geography'],
        summary: 'Country statistics and coverage summary',
        operationId: 'getCountryStats',
        parameters: [
          { name: 'cc', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: coordGetResponses,
      },
    },
    '/terrain/{z}/{x}/{y}.png': {
      get: {
        tags: ['Geography'],
        summary: 'Terrain tile proxy',
        operationId: 'getTerrainTile',
        parameters: [
          { name: 'z', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'x', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'y', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            description: 'PNG terrain tile',
            content: {
              'image/png': {
                schema: { type: 'string', contentEncoding: 'base64' },
              },
            },
          },
          '500': errorResponse,
        },
      },
    },
    '/labels/{z}/{x}/{y}.pbf': {
      get: {
        tags: ['Geography'],
        summary: 'Vector label tile proxy',
        operationId: 'getLabelTile',
        parameters: [
          { name: 'z', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'x', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'y', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Protocol buffer vector tile',
            content: {
              'application/x-protobuf': {
                schema: { type: 'string', contentEncoding: 'base64' },
              },
            },
          },
          '503': errorResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      PostalContextReleaseSelector: {
        oneOf: [
          {
            type: 'object',
            required: ['mode'],
            properties: { mode: { type: 'string', const: 'active' } },
            additionalProperties: false,
          },
          {
            type: 'object',
            required: ['mode', 'releaseId', 'manifestDigest', 'policyVersion'],
            properties: {
              mode: { type: 'string', const: 'pinned' },
              releaseId: { type: 'string', minLength: 1 },
              manifestDigest: { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' },
              policyVersion: { type: 'string', minLength: 1 },
            },
            additionalProperties: false,
          },
        ],
      },
      PostalContextResolveRequest: {
        type: 'object',
        required: ['countryCode', 'latitude', 'longitude', 'purpose', 'validAt'],
        properties: {
          countryCode: { type: 'string', pattern: '^[A-Z]{2}$' },
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
          purpose: {
            type: 'string',
            enum: ['postal_lookup', 'display', 'delivery', 'navigation', 'cadastral', 'validation'],
          },
          validAt: { type: 'string', format: 'date-time' },
          knownAt: { type: 'string', format: 'date-time' },
          release: { $ref: '#/components/schemas/PostalContextReleaseSelector' },
        },
        additionalProperties: false,
      },
      PostalContextTimeRange: {
        type: 'object',
        required: ['from'],
        properties: {
          from: { type: 'string', format: 'date-time' },
          to: {
            oneOf: [
              { type: 'string', format: 'date-time' },
              { type: 'null' },
            ],
          },
        },
        additionalProperties: false,
      },
      PostalContextPublicAssertionId: {
        type: 'string',
        minLength: 1,
        pattern: '^(?!runtime:).+',
        description: 'Stable source/release assertion ID. Transient runtime:* IDs are never public.',
      },
      PostalContextAmbiguity: {
        type: 'string',
        enum: [
          'boundary_ambiguity',
          'multiple_address_records',
          'multiple_buildings',
          'multiple_postal_assignments',
          'multiple_entrances',
          'source_conflict',
          'campus_or_complex',
          'postal_assignment_conflict',
          'spatial_postal_only',
          'vertical_unresolved',
          'private_context_redacted',
          'temporal_gap',
          'no_spatial_geometry',
        ],
      },
      PostalContextCapabilities: {
        type: 'object',
        required: [
          'country',
          'administrative',
          'locality',
          'postalArea',
          'streetOrBlock',
          'premise',
          'building',
          'entrance',
          'unit',
          'organization',
          'deliveryEndpoint',
          'publicSafe',
        ],
        properties: {
          country: { type: 'boolean' },
          administrative: { type: 'boolean' },
          locality: { type: 'boolean' },
          postalArea: { type: 'boolean' },
          streetOrBlock: { type: 'boolean' },
          premise: { type: 'boolean' },
          building: { type: 'boolean' },
          entrance: { type: 'boolean' },
          unit: { type: 'boolean' },
          organization: { type: 'boolean' },
          deliveryEndpoint: { type: 'boolean' },
          publicSafe: { type: 'boolean' },
        },
        additionalProperties: false,
      },
      PostalContextPublicComponent: {
        type: 'object',
        required: ['id', 'kind', 'featureKind', 'geometryType'],
        properties: {
          id: { type: 'string', minLength: 1, pattern: '^(?!runtime:).+' },
          kind: {
            type: 'string',
            enum: ['postal_feature', 'administrative_area', 'locality', 'thoroughfare', 'agid_cell'],
          },
          featureKind: {
            type: 'string',
            enum: [
              'query_point',
              'standard_area',
              'large_user',
              'po_box',
              'organization',
              'route',
              'virtual_area',
              'building',
              'building_part',
              'entrance',
              'premise',
              'locality',
              'street',
              'block',
              'cadastral',
              'administrative',
              'country',
              'unknown',
            ],
          },
          geometryType: {
            type: 'string',
            enum: ['polygon', 'multipolygon', 'point', 'linestring', 'geometrycollection', 'none'],
          },
          label: { type: 'string' },
          postalCode: { type: 'string' },
        },
        additionalProperties: false,
      },
      PostalContextPublicResolutionComponent: {
        type: 'object',
        required: ['kind', 'featureKind'],
        properties: {
          kind: {
            type: 'string',
            enum: [
              'postal_feature',
              'administrative_area',
              'locality',
              'thoroughfare',
              'address_record',
              'parcel',
              'building',
              'building_part',
              'entrance',
              'organization',
              'delivery_endpoint',
              'agid_cell',
            ],
          },
          featureKind: {
            type: 'string',
            enum: [
              'query_point',
              'standard_area',
              'large_user',
              'po_box',
              'organization',
              'route',
              'virtual_area',
              'building',
              'building_part',
              'entrance',
              'premise',
              'locality',
              'street',
              'block',
              'cadastral',
              'administrative',
              'country',
              'unknown',
            ],
          },
          label: { type: 'string' },
          postalCode: { type: 'string' },
          assertionId: { $ref: '#/components/schemas/PostalContextPublicAssertionId' },
          relation: {
            type: 'string',
            enum: [
              'addresses',
              'locates',
              'stands_on',
              'part_of',
              'accesses',
              'occupies',
              'receives_mail_at',
              'postal_assigned',
              'postal_contains',
              'delivery_served_by',
              'admin_within',
              'same_as',
              'probable_same_as',
              'supersedes',
              'split_into',
              'merged_into',
              'covered_by_agid',
            ],
          },
          method: {
            type: 'string',
            enum: [
              'explicit_assignment',
              'direct_source_link',
              'official_crosswalk',
              'source_relation',
              'geometry_contains',
              'geometry_intersects',
              'nearest',
              'derived',
              'virtual_grid',
            ],
          },
          evidenceTier: { type: 'string', enum: ['E0', 'E1', 'E2', 'E3', 'E4', 'E5'] },
        },
        additionalProperties: false,
      },
      PostalContextPublicResolutionCandidate: {
        type: 'object',
        required: ['resolvedLevel', 'capabilities', 'components', 'evidenceTiers', 'ambiguities'],
        properties: {
          resolvedLevel: {
            type: 'string',
            enum: [
              'none',
              'country',
              'administrative',
              'locality',
              'postal_area',
              'street_or_block',
              'premise',
              'building',
              'entrance',
              'unit',
              'organization',
              'delivery_endpoint',
            ],
          },
          capabilities: { $ref: '#/components/schemas/PostalContextCapabilities' },
          components: {
            type: 'array',
            items: { $ref: '#/components/schemas/PostalContextPublicResolutionComponent' },
          },
          evidenceTiers: {
            type: 'array',
            items: { type: 'string', enum: ['E0', 'E1', 'E2', 'E3', 'E4', 'E5'] },
          },
          weakestEvidenceTier: { type: 'string', enum: ['E0', 'E1', 'E2', 'E3', 'E4', 'E5'] },
          ambiguities: {
            type: 'array',
            items: { $ref: '#/components/schemas/PostalContextAmbiguity' },
          },
        },
        additionalProperties: false,
      },
      PostalContextPostalEvidence: {
        type: 'object',
        required: ['relation'],
        properties: {
          postalCode: { type: 'string' },
          relation: { type: 'string', enum: ['inside', 'boundary'] },
        },
        additionalProperties: false,
      },
      PostalContextAddressPointEvidence: {
        type: 'object',
        required: ['matched', 'candidateCount'],
        properties: {
          matched: { type: 'boolean' },
          candidateCount: { type: 'integer', minimum: 0 },
        },
        additionalProperties: false,
      },
      PostalContextAgidReference: {
        type: 'object',
        required: ['cellId', 'gridAxisBits', 'role', 'canonicalPostalGeometry'],
        properties: {
          cellId: { type: 'string' },
          gridAxisBits: { type: 'integer', minimum: 1 },
          role: { type: 'string', const: 'spatial-reference-and-candidate-index' },
          canonicalPostalGeometry: { type: 'boolean', const: false },
        },
        additionalProperties: false,
      },
      PostalContextPosition: {
        type: 'array',
        prefixItems: [
          { type: 'number', minimum: -180, maximum: 180 },
          { type: 'number', minimum: -90, maximum: 90 },
        ],
        minItems: 2,
        maxItems: 2,
      },
      PostalContextLinearRing: {
        type: 'array',
        minItems: 4,
        items: { $ref: '#/components/schemas/PostalContextPosition' },
      },
      PostalContextPolygonCoordinates: {
        type: 'array',
        minItems: 1,
        items: { $ref: '#/components/schemas/PostalContextLinearRing' },
      },
      PostalContextPointGeometry: {
        type: 'object',
        required: ['type', 'coordinates'],
        properties: {
          type: { type: 'string', const: 'Point' },
          coordinates: { $ref: '#/components/schemas/PostalContextPosition' },
        },
        additionalProperties: false,
      },
      PostalContextPolygonGeometry: {
        type: 'object',
        required: ['type', 'coordinates'],
        properties: {
          type: { type: 'string', const: 'Polygon' },
          coordinates: { $ref: '#/components/schemas/PostalContextPolygonCoordinates' },
        },
        additionalProperties: false,
      },
      PostalContextMultiPolygonGeometry: {
        type: 'object',
        required: ['type', 'coordinates'],
        properties: {
          type: { type: 'string', const: 'MultiPolygon' },
          coordinates: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#/components/schemas/PostalContextPolygonCoordinates' },
          },
        },
        additionalProperties: false,
      },
      PostalContextGeoJsonGeometry: {
        oneOf: [
          { $ref: '#/components/schemas/PostalContextPointGeometry' },
          { $ref: '#/components/schemas/PostalContextPolygonGeometry' },
          { $ref: '#/components/schemas/PostalContextMultiPolygonGeometry' },
        ],
      },
      PostalContextPostalGeometrySource: {
        type: 'object',
        required: ['sourceId', 'licenseId', 'digest'],
        properties: {
          sourceId: { type: 'string' },
          licenseId: { type: 'string' },
          digest: { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' },
        },
        additionalProperties: false,
      },
      PostalContextPostalGeometryResult: {
        type: 'object',
        required: ['node', 'geometry', 'source'],
        properties: {
          node: { $ref: '#/components/schemas/PostalContextPublicComponent' },
          geometry: { $ref: '#/components/schemas/PostalContextGeoJsonGeometry' },
          source: { $ref: '#/components/schemas/PostalContextPostalGeometrySource' },
        },
        additionalProperties: false,
      },
      PostalContextPostalLookupAlternative: {
        type: 'object',
        required: ['postalFeature', 'contexts', 'assertionIds'],
        properties: {
          postalFeature: { $ref: '#/components/schemas/PostalContextPublicComponent' },
          contexts: {
            type: 'array',
            maxItems: 256,
            items: { $ref: '#/components/schemas/PostalContextPublicComponent' },
          },
          assertionIds: {
            type: 'array',
            maxItems: 2048,
            items: { $ref: '#/components/schemas/PostalContextPublicAssertionId' },
          },
        },
        additionalProperties: false,
      },
      PostalContextPostalLookup: {
        type: 'object',
        required: [
          'status',
          'countryCode',
          'normalizedPostalCode',
          'release',
          'postalFeatures',
          'contexts',
          'assertionIds',
          'alternatives',
          'geometries',
          'errors',
          'warnings',
          'validAt',
          'knownAt',
        ],
        properties: {
          status: { type: 'string', enum: ['unique', 'ambiguous', 'no_match'] },
          countryCode: { type: 'string', pattern: '^[A-Z]{2}$' },
          normalizedPostalCode: { type: 'string' },
          release: { $ref: '#/components/schemas/PostalContextRuntimeRelease' },
          postalFeatures: {
            type: 'array',
            maxItems: 64,
            items: { $ref: '#/components/schemas/PostalContextPublicComponent' },
          },
          contexts: {
            type: 'array',
            maxItems: 256,
            items: { $ref: '#/components/schemas/PostalContextPublicComponent' },
          },
          assertionIds: {
            type: 'array',
            maxItems: 2048,
            items: { $ref: '#/components/schemas/PostalContextPublicAssertionId' },
          },
          alternatives: {
            type: 'array',
            maxItems: 32,
            items: { $ref: '#/components/schemas/PostalContextPostalLookupAlternative' },
          },
          geometries: {
            type: 'array',
            maxItems: 16,
            items: { $ref: '#/components/schemas/PostalContextPostalGeometryResult' },
          },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          validAt: { type: 'string', format: 'date-time' },
          knownAt: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      PostalContextBbox: {
        type: 'array',
        prefixItems: [
          { type: 'number', minimum: -180, maximum: 180 },
          { type: 'number', minimum: -90, maximum: 90 },
          { type: 'number', minimum: -180, maximum: 180 },
          { type: 'number', minimum: -90, maximum: 90 },
        ],
        minItems: 4,
        maxItems: 4,
      },
      PostalContextIntersection: {
        type: 'object',
        required: [
          'status',
          'countryCode',
          'release',
          'bbox',
          'matches',
          'truncated',
          'errors',
          'warnings',
          'validAt',
          'knownAt',
        ],
        properties: {
          status: { type: 'string', enum: ['unique', 'no_match'] },
          countryCode: { type: 'string', pattern: '^[A-Z]{2}$' },
          release: { $ref: '#/components/schemas/PostalContextRuntimeRelease' },
          bbox: { $ref: '#/components/schemas/PostalContextBbox' },
          matches: {
            type: 'array',
            maxItems: 16,
            items: { $ref: '#/components/schemas/PostalContextPostalGeometryResult' },
          },
          truncated: { type: 'boolean' },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          validAt: { type: 'string', format: 'date-time' },
          knownAt: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      PostalContextRuntimeAttestation: {
        type: 'object',
        required: [
          'descriptorDigest',
          'sequence',
          'maturity',
          'synthetic',
          'promotionEligible',
          'servingMode',
          'integrity',
        ],
        properties: {
          descriptorDigest: { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' },
          sequence: { type: 'integer', minimum: 0 },
          maturity: { type: 'string', enum: ['M2_experimental', 'M3_candidate', 'M4_stable'] },
          synthetic: { type: 'boolean' },
          promotionEligible: { type: 'boolean' },
          servingMode: { type: 'string', enum: ['experimental', 'candidate', 'stable', 'test'] },
          integrity: { type: 'string', enum: ['externally_pinned', 'in_memory_unpinned'] },
        },
        additionalProperties: false,
      },
      PostalContextRuntimeStatus: {
        type: 'object',
        required: ['configured', 'countryCode', 'release', 'attestation', 'counts', 'privacy', 'fallback'],
        properties: {
          configured: { type: 'boolean', const: true },
          countryCode: { type: 'string', pattern: '^[A-Z]{2}$' },
          release: { $ref: '#/components/schemas/PostalContextRuntimeRelease' },
          attestation: { $ref: '#/components/schemas/PostalContextRuntimeAttestation' },
          counts: {
            type: 'object',
            required: ['nodes', 'assertions', 'geometries', 'postalCodes', 'excludedByQualityOrPublication'],
            properties: {
              nodes: { type: 'integer', minimum: 0 },
              assertions: { type: 'integer', minimum: 0 },
              geometries: { type: 'integer', minimum: 0 },
              postalCodes: { type: 'integer', minimum: 0 },
              excludedByQualityOrPublication: { type: 'integer', minimum: 0 },
            },
            additionalProperties: false,
          },
          privacy: {
            type: 'object',
            required: [
              'publicPack',
              'containsPrivateNodes',
              'coordinateEcho',
              'internalAddressPointIdsExposed',
              'internalAddressPointDistancesExposed',
            ],
            properties: {
              publicPack: { type: 'boolean', const: true },
              containsPrivateNodes: { type: 'boolean', const: false },
              coordinateEcho: { type: 'boolean', const: false },
              internalAddressPointIdsExposed: { type: 'boolean', const: false },
              internalAddressPointDistancesExposed: { type: 'boolean', const: false },
            },
            additionalProperties: false,
          },
          fallback: { type: 'string', const: 'none' },
        },
        additionalProperties: false,
      },
      PostalContextCountryStatus: {
        type: 'object',
        required: ['countryCode', 'state', 'errors', 'warnings'],
        properties: {
          countryCode: { type: 'string', pattern: '^[A-Z]{2}$' },
          state: { type: 'string', enum: ['unconfigured', 'ready', 'degraded_lkg', 'invalid'] },
          runtime: { $ref: '#/components/schemas/PostalContextRuntimeStatus' },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      PostalContextCapabilitiesResponse: {
        type: 'object',
        required: ['version', 'countries', 'endpoints', 'privacy', 'fallback'],
        properties: {
          version: { type: 'string', const: 'postal-context-api/v0.1' },
          countries: {
            type: 'array',
            items: { $ref: '#/components/schemas/PostalContextCountryStatus' },
          },
          endpoints: {
            type: 'object',
            required: ['resolve', 'lookup', 'intersects', 'releases'],
            properties: {
              resolve: { type: 'string', const: 'POST /api/v1/postal/resolve' },
              lookup: { type: 'string', const: 'GET /api/v1/postal/{country}/{postalCode}' },
              intersects: { type: 'string', const: 'GET /api/v1/postal/intersects' },
              releases: { type: 'string', const: 'GET /api/v1/postal/releases/{country}' },
            },
            additionalProperties: false,
          },
          privacy: {
            type: 'object',
            required: [
              'coordinateTransport',
              'coordinateEcho',
              'rawAddressInput',
              'privateUnitRecipientInput',
              'responseCache',
            ],
            properties: {
              coordinateTransport: { type: 'string', const: 'post-body-only' },
              coordinateEcho: { type: 'boolean', const: false },
              rawAddressInput: { type: 'boolean', const: false },
              privateUnitRecipientInput: { type: 'boolean', const: false },
              responseCache: { type: 'string', const: 'private-no-store' },
            },
            additionalProperties: false,
          },
          fallback: { type: 'string', const: 'none-outside-verified-pack-or-lkg' },
        },
        additionalProperties: false,
      },
      PostalContextRuntimeRelease: {
        type: 'object',
        required: [
          'countryCode',
          'repositoryId',
          'releaseId',
          'manifestDigest',
          'policyVersion',
          'releasedAt',
          'validTime',
        ],
        properties: {
          countryCode: { type: 'string', pattern: '^[A-Z]{2}$' },
          repositoryId: { type: 'string' },
          releaseId: { type: 'string' },
          manifestDigest: { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' },
          policyVersion: { type: 'string' },
          releasedAt: { type: 'string', format: 'date-time' },
          validTime: { $ref: '#/components/schemas/PostalContextTimeRange' },
        },
        additionalProperties: false,
      },
      PostalContextPublicResolution: {
        type: 'object',
        required: [
          'status',
          'purpose',
          'countryCode',
          'release',
          'resolvedLevel',
          'capabilities',
          'alternatives',
          'postalEvidence',
          'addressPointEvidence',
          'ambiguities',
          'errors',
          'warnings',
          'validAt',
          'knownAt',
          'agid',
        ],
        properties: {
          status: {
            type: 'string',
            enum: ['unique', 'partial', 'ambiguous', 'conflict', 'no_match'],
          },
          purpose: {
            type: 'string',
            enum: ['postal_lookup', 'display', 'delivery', 'navigation', 'cadastral', 'validation'],
          },
          countryCode: { type: 'string', pattern: '^[A-Z]{2}$' },
          release: { $ref: '#/components/schemas/PostalContextRuntimeRelease' },
          resolvedLevel: {
            type: 'string',
            enum: [
              'none',
              'country',
              'administrative',
              'locality',
              'postal_area',
              'street_or_block',
              'premise',
              'building',
              'entrance',
              'unit',
              'organization',
              'delivery_endpoint',
            ],
          },
          capabilities: { $ref: '#/components/schemas/PostalContextCapabilities' },
          selected: { $ref: '#/components/schemas/PostalContextPublicResolutionCandidate' },
          alternatives: {
            type: 'array',
            maxItems: 8,
            items: { $ref: '#/components/schemas/PostalContextPublicResolutionCandidate' },
          },
          postalEvidence: {
            type: 'array',
            items: { $ref: '#/components/schemas/PostalContextPostalEvidence' },
          },
          addressPointEvidence: { $ref: '#/components/schemas/PostalContextAddressPointEvidence' },
          ambiguities: {
            type: 'array',
            items: { $ref: '#/components/schemas/PostalContextAmbiguity' },
          },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          validAt: { type: 'string', format: 'date-time' },
          knownAt: { type: 'string', format: 'date-time' },
          agid: { $ref: '#/components/schemas/PostalContextAgidReference' },
        },
        additionalProperties: false,
      },
      AgidResultPostalContextResolution: {
        type: 'object',
        required: ['ok', 'data', 'sources', 'warnings', 'cache', 'requestId'],
        properties: {
          ok: { type: 'boolean', const: true },
          data: { $ref: '#/components/schemas/PostalContextPublicResolution' },
          sources: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          cache: { type: 'string', const: 'none' },
          requestId: { type: 'string' },
        },
        additionalProperties: false,
      },
      AgidResultPostalContextCapabilities: {
        type: 'object',
        required: ['ok', 'data', 'sources', 'warnings', 'cache', 'requestId'],
        properties: {
          ok: { type: 'boolean', const: true },
          data: { $ref: '#/components/schemas/PostalContextCapabilitiesResponse' },
          sources: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          cache: { type: 'string', const: 'none' },
          requestId: { type: 'string' },
        },
        additionalProperties: false,
      },
      AgidResultPostalContextCountryStatus: {
        type: 'object',
        required: ['ok', 'data', 'sources', 'warnings', 'cache', 'requestId'],
        properties: {
          ok: { type: 'boolean', const: true },
          data: { $ref: '#/components/schemas/PostalContextCountryStatus' },
          sources: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          cache: { type: 'string', const: 'none' },
          requestId: { type: 'string' },
        },
        additionalProperties: false,
      },
      AgidResultPostalContextLookup: {
        type: 'object',
        required: ['ok', 'data', 'sources', 'warnings', 'cache', 'requestId'],
        properties: {
          ok: { type: 'boolean', const: true },
          data: { $ref: '#/components/schemas/PostalContextPostalLookup' },
          sources: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          cache: { type: 'string', const: 'none' },
          requestId: { type: 'string' },
        },
        additionalProperties: false,
      },
      AgidResultPostalContextIntersection: {
        type: 'object',
        required: ['ok', 'data', 'sources', 'warnings', 'cache', 'requestId'],
        properties: {
          ok: { type: 'boolean', const: true },
          data: { $ref: '#/components/schemas/PostalContextIntersection' },
          sources: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          cache: { type: 'string', const: 'none' },
          requestId: { type: 'string' },
        },
        additionalProperties: false,
      },
      GenericJson: {
        type: 'object',
        additionalProperties: true,
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          requestId: { type: 'string' },
          warnings: { type: 'array', items: { type: 'string' } },
          sources: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: true,
      },
      McpJsonRpcRequest: {
        type: 'object',
        required: ['jsonrpc', 'method'],
        properties: {
          jsonrpc: { type: 'string', const: '2.0' },
          id: { type: ['string', 'number', 'null'] },
          method: {
            type: 'string',
            enum: ['initialize', 'tools/list', 'tools/call'],
          },
          params: {
            type: 'object',
            additionalProperties: true,
            description: 'MCP method parameters. AGID accepts public proof, commitment, registry, and integration metadata only.',
          },
        },
        additionalProperties: false,
      },
      McpJsonRpcResponse: {
        type: 'object',
        required: ['jsonrpc'],
        properties: {
          jsonrpc: { type: 'string', const: '2.0' },
          id: { type: ['string', 'number', 'null'] },
          result: {
            type: 'object',
            additionalProperties: true,
            properties: {
              content: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['text'] },
                    text: { type: 'string' },
                  },
                  additionalProperties: true,
                },
              },
              structuredContent: {
                type: 'object',
                additionalProperties: true,
              },
              isError: { type: 'boolean' },
            },
          },
          error: {
            type: 'object',
            properties: {
              code: { type: 'integer' },
              message: { type: 'string' },
              data: { type: 'object', additionalProperties: true },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
      HealthResponse: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['ok'] },
        },
      },
      AgidResultBase: {
        type: 'object',
        required: ['ok', 'sources', 'warnings', 'requestId'],
        properties: {
          ok: { type: 'boolean' },
          error: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          sources: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          cache: { type: 'string', enum: ['hit', 'miss', 'stale', 'none'] },
          requestId: { type: 'string' },
        },
        additionalProperties: true,
      },
      AddressIntentEvidenceInput: {
        type: 'object',
        required: ['source'],
        properties: {
          source: { type: 'string', enum: [...ADDRESS_INTENT_EVIDENCE_SOURCES] },
          status: { type: 'string', enum: ['pending', 'passed', 'failed', 'warning'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          code: { type: 'string', maxLength: 80 },
          safeFingerprint: {
            type: 'string',
            description: 'Commitment, hash, or provider-safe evidence fingerprint. Do not send plaintext address material here.',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      AddressIntentRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', pattern: '^AIT-[A-F0-9]{16,32}$' },
          purpose: { type: 'string', enum: [...ADDRESS_INTENT_PURPOSES] },
          mode: { type: 'string', enum: [...ADDRESS_INTENT_MODES] },
          evidence: {
            type: 'array',
            items: { $ref: '#/components/schemas/AddressIntentEvidenceInput' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
          requiresCarrierScan: { type: 'boolean' },
          requiresRecipientProof: { type: 'boolean' },
          manualReviewRequired: { type: 'boolean' },
          manualReviewApproved: { type: 'boolean' },
          rejectedReason: { type: 'string' },
        },
        additionalProperties: false,
      },
      AddressIntentUpdateRequest: {
        allOf: [
          { $ref: '#/components/schemas/AddressIntentRequest' },
          {
            type: 'object',
            properties: {
              appendEvidence: { type: 'boolean' },
            },
            additionalProperties: false,
          },
        ],
      },
      AddressIntentEvidence: {
        type: 'object',
        required: ['source', 'status', 'confidence', 'createdAt'],
        properties: {
          source: { type: 'string', enum: [...ADDRESS_INTENT_EVIDENCE_SOURCES] },
          status: { type: 'string', enum: ['pending', 'passed', 'failed', 'warning'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          code: { type: 'string' },
          safeFingerprint: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      AddressIntentRequiredEvidenceGroup: {
        type: 'object',
        required: ['group', 'anyOf'],
        properties: {
          group: { type: 'string' },
          anyOf: {
            type: 'array',
            minItems: 1,
            items: { type: 'string', enum: [...ADDRESS_INTENT_EVIDENCE_SOURCES] },
          },
        },
        additionalProperties: false,
      },
      AddressIntentPrivacyBoundary: {
        type: 'object',
        required: [
          'plaintextAddressStored',
          'rawAgidStored',
          'rawAoidStored',
          'recipientProofMaterialStored',
          'publicSurface',
        ],
        properties: {
          plaintextAddressStored: { type: 'boolean', const: false },
          rawAgidStored: { type: 'boolean', const: false },
          rawAoidStored: { type: 'boolean', const: false },
          recipientProofMaterialStored: { type: 'boolean', const: false },
          publicSurface: { type: 'string' },
        },
        additionalProperties: false,
      },
      AddressIntent: {
        type: 'object',
        required: [
          'modelVersion',
          'id',
          'status',
          'purpose',
          'mode',
          'evidence',
          'requiredEvidence',
          'missingEvidence',
          'nextAction',
          'createdAt',
          'updatedAt',
          'errors',
          'warnings',
          'privacy',
        ],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_INTENT_MODEL_VERSION },
          id: { type: 'string', pattern: '^AIT-[A-F0-9]{16,32}$' },
          status: { type: 'string', enum: [...ADDRESS_INTENT_STATUSES] },
          purpose: { type: 'string', enum: [...ADDRESS_INTENT_PURPOSES] },
          mode: { type: 'string', enum: [...ADDRESS_INTENT_MODES] },
          evidence: {
            type: 'array',
            items: { $ref: '#/components/schemas/AddressIntentEvidence' },
          },
          requiredEvidence: {
            type: 'array',
            items: { $ref: '#/components/schemas/AddressIntentRequiredEvidenceGroup' },
          },
          missingEvidence: {
            type: 'array',
            items: { $ref: '#/components/schemas/AddressIntentRequiredEvidenceGroup' },
          },
          nextAction: { type: 'string', enum: [...ADDRESS_INTENT_NEXT_ACTIONS] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          privacy: { $ref: '#/components/schemas/AddressIntentPrivacyBoundary' },
        },
        additionalProperties: false,
      },
      AddressIntentCapabilities: {
        type: 'object',
        required: ['modelVersion', 'statuses', 'purposes', 'modes', 'evidenceSources', 'nextActions', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_INTENT_MODEL_VERSION },
          statuses: { type: 'array', items: { type: 'string', enum: [...ADDRESS_INTENT_STATUSES] } },
          purposes: { type: 'array', items: { type: 'string', enum: [...ADDRESS_INTENT_PURPOSES] } },
          modes: { type: 'array', items: { type: 'string', enum: [...ADDRESS_INTENT_MODES] } },
          evidenceSources: { type: 'array', items: { type: 'string', enum: [...ADDRESS_INTENT_EVIDENCE_SOURCES] } },
          nextActions: { type: 'array', items: { type: 'string', enum: [...ADDRESS_INTENT_NEXT_ACTIONS] } },
          privacy: { $ref: '#/components/schemas/AddressIntentPrivacyBoundary' },
          stateMachine: { type: 'object', additionalProperties: { type: 'string' } },
        },
        additionalProperties: false,
      },
      AgidResultAddressIntent: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressIntent' },
            },
          },
        ],
      },
      AgidResultAddressIntentCapabilities: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressIntentCapabilities' },
            },
          },
        ],
      },
      AgidResultRecentAddressIntents: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  intents: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AddressIntent' },
                  },
                  plaintextAddressStorage: { type: 'boolean', const: false },
                },
                additionalProperties: false,
              },
            },
          },
        ],
      },
      AddressElementFieldPresence: {
        type: 'object',
        description: 'Boolean field presence only. Raw field values are intentionally not accepted by the public API.',
        properties: Object.fromEntries(
          ADDRESS_ELEMENT_FIELD_KEYS.map(key => [key, { type: 'boolean' }]),
        ),
        additionalProperties: false,
      },
      AddressElementLanguageTab: {
        type: 'object',
        required: ['language'],
        properties: {
          language: { type: 'string' },
          label: { type: 'string' },
          source: { type: 'string', enum: ['native', 'english-shipping', 'custom', 'browser', 'app'] },
          enabled: { type: 'boolean' },
        },
        additionalProperties: false,
      },
      AddressElementAgidCandidate: {
        type: 'object',
        properties: {
          present: { type: 'boolean' },
          exposure: { type: 'string', enum: ['public', 'agid-s', 'commitment', 'redacted'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          safeFingerprint: { type: 'string' },
          source: { type: 'string' },
        },
        additionalProperties: false,
      },
      AddressElementSessionRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', pattern: '^AEL-[A-F0-9]{16,32}$' },
          purpose: { type: 'string', enum: [...ADDRESS_INTENT_PURPOSES] },
          mode: { type: 'string', enum: [...ADDRESS_INTENT_MODES] },
          countryCode: { type: 'string', minLength: 2, maxLength: 2 },
          fieldPresence: { $ref: '#/components/schemas/AddressElementFieldPresence' },
          postalCandidates: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
          agidCandidate: { $ref: '#/components/schemas/AddressElementAgidCandidate' },
          languageTabs: {
            type: 'array',
            items: { $ref: '#/components/schemas/AddressElementLanguageTab' },
          },
          selectedLanguage: { type: 'string' },
          highRiskMode: { type: 'boolean' },
          scanCapabilities: {
            type: 'object',
            properties: {
              qr: { type: 'boolean' },
              nfc: { type: 'boolean' },
              agidSecure: { type: 'boolean' },
              barcode: { type: 'boolean' },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      AddressElementSession: {
        type: 'object',
        required: [
          'modelVersion',
          'id',
          'status',
          'purpose',
          'mode',
          'selectedLanguage',
          'languageTabs',
          'fields',
          'quality',
          'evidenceForIntent',
          'intentPreview',
          'nextActions',
          'privacy',
        ],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_ELEMENT_MODEL_VERSION },
          id: { type: 'string', pattern: '^AEL-[A-F0-9]{16,32}$' },
          status: { type: 'string', enum: [...ADDRESS_ELEMENT_STATUSES] },
          purpose: { type: 'string', enum: [...ADDRESS_INTENT_PURPOSES] },
          mode: { type: 'string', enum: [...ADDRESS_INTENT_MODES] },
          countryCode: { type: ['string', 'null'] },
          selectedLanguage: { type: 'string' },
          languageTabs: {
            type: 'array',
            items: { $ref: '#/components/schemas/AddressElementLanguageTab' },
          },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              required: ['key', 'required', 'present', 'private'],
              properties: {
                key: { type: 'string', enum: [...ADDRESS_ELEMENT_FIELD_KEYS] },
                required: { type: 'boolean' },
                present: { type: 'boolean' },
                private: { type: 'boolean' },
                autofillSource: { type: 'string', enum: [...ADDRESS_ELEMENT_CHANNELS] },
              },
              additionalProperties: false,
            },
          },
          missingRequiredFields: { type: 'array', items: { type: 'string', enum: [...ADDRESS_ELEMENT_FIELD_KEYS] } },
          autofill: {
            type: 'object',
            properties: {
              postalCandidateCount: { type: 'integer' },
              agidCandidatePresent: { type: 'boolean' },
              channels: { type: 'array', items: { type: 'string', enum: [...ADDRESS_ELEMENT_CHANNELS] } },
            },
            additionalProperties: false,
          },
          quality: {
            type: 'object',
            required: ['decision', 'score', 'internalOnly'],
            properties: {
              decision: { type: 'string', enum: ['verified', 'partial', 'needs_review', 'blocked'] },
              score: { type: 'number', minimum: 0, maximum: 1 },
              internalOnly: { type: 'boolean', const: true },
              verificationStatus: { type: 'string' },
            },
            additionalProperties: false,
          },
          evidenceForIntent: {
            type: 'array',
            items: { $ref: '#/components/schemas/AddressIntentEvidenceInput' },
          },
          intentPreview: { $ref: '#/components/schemas/AddressIntent' },
          feedback: { type: 'object', additionalProperties: true },
          nextActions: { type: 'array', items: { type: 'string', enum: [...ADDRESS_ELEMENT_NEXT_ACTIONS] } },
          warnings: { type: 'array', items: { type: 'string' } },
          privacy: {
            type: 'object',
            properties: {
              rawFieldValuesReturned: { type: 'boolean', const: false },
              plaintextAddressServerStorage: { type: 'boolean', const: false },
              rawAgidServerStorage: { type: 'boolean', const: false },
              rawAoidServerStorage: { type: 'boolean', const: false },
              userCorrectionLearning: { type: 'string', const: 'closed-device-local' },
              highRiskMode: { type: 'boolean' },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      AddressElementCapabilities: {
        type: 'object',
        required: ['modelVersion', 'fieldKeys', 'channels', 'statuses', 'nextActions', 'supports', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_ELEMENT_MODEL_VERSION },
          fieldKeys: { type: 'array', items: { type: 'string', enum: [...ADDRESS_ELEMENT_FIELD_KEYS] } },
          channels: { type: 'array', items: { type: 'string', enum: [...ADDRESS_ELEMENT_CHANNELS] } },
          statuses: { type: 'array', items: { type: 'string', enum: [...ADDRESS_ELEMENT_STATUSES] } },
          nextActions: { type: 'array', items: { type: 'string', enum: [...ADDRESS_ELEMENT_NEXT_ACTIONS] } },
          supports: { type: 'object', additionalProperties: { type: 'boolean' } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressRadarEvaluationRequest: {
        type: 'object',
        properties: {
          highRiskMode: { type: 'boolean' },
          intent: { type: 'object', additionalProperties: true },
          qr: { type: 'object', additionalProperties: true },
          aoid: { type: 'object', additionalProperties: true },
          lookup: { type: 'object', additionalProperties: true },
          handoff: { type: 'object', additionalProperties: true },
          delivery: { type: 'object', additionalProperties: true },
          registry: { type: 'object', additionalProperties: true },
          addressQuality: { type: 'object', additionalProperties: true },
          device: { type: 'object', additionalProperties: true },
          route: { type: 'object', additionalProperties: true },
          domain: { type: 'object', additionalProperties: true },
          behavior: { type: 'object', additionalProperties: true },
          feedback: { type: 'object', additionalProperties: true },
          customs: { type: 'object', additionalProperties: true },
          offline: { type: 'object', additionalProperties: true },
          thresholds: { type: 'object', additionalProperties: { type: 'number' } },
        },
        additionalProperties: false,
      },
      AddressRadarRule: {
        type: 'object',
        required: ['id', 'label', 'category', 'defaultSeverity', 'defaultPoints'],
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          category: { type: 'string' },
          defaultSeverity: { type: 'string', enum: [...ADDRESS_RADAR_RISK_LEVELS] },
          defaultPoints: { type: 'number' },
        },
        additionalProperties: false,
      },
      AddressRadarEvaluation: {
        type: 'object',
        required: ['modelVersion', 'decision', 'riskLevel', 'score', 'matchedRules', 'nextActions', 'warnings', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_RADAR_MODEL_VERSION },
          decision: { type: 'string', enum: [...ADDRESS_RADAR_DECISIONS] },
          riskLevel: { type: 'string', enum: [...ADDRESS_RADAR_RISK_LEVELS] },
          score: { type: 'number', minimum: 0, maximum: 100 },
          matchedRules: {
            type: 'array',
            items: {
              allOf: [
                { $ref: '#/components/schemas/AddressRadarRule' },
                {
                  type: 'object',
                  properties: {
                    points: { type: 'number' },
                    reason: { type: 'string' },
                    nextAction: { type: 'string', enum: [...ADDRESS_RADAR_NEXT_ACTIONS] },
                  },
                },
              ],
            },
          },
          nextActions: { type: 'array', items: { type: 'string', enum: [...ADDRESS_RADAR_NEXT_ACTIONS] } },
          warnings: { type: 'array', items: { type: 'string' } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressRadarRules: {
        type: 'object',
        required: ['modelVersion', 'rules', 'decisions', 'riskLevels', 'nextActions', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_RADAR_MODEL_VERSION },
          rules: { type: 'array', items: { $ref: '#/components/schemas/AddressRadarRule' } },
          decisions: { type: 'array', items: { type: 'string', enum: [...ADDRESS_RADAR_DECISIONS] } },
          riskLevels: { type: 'array', items: { type: 'string', enum: [...ADDRESS_RADAR_RISK_LEVELS] } },
          nextActions: { type: 'array', items: { type: 'string', enum: [...ADDRESS_RADAR_NEXT_ACTIONS] } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressSignalEvaluationRequest: {
        type: 'object',
        properties: {
          now: { type: 'string', format: 'date-time' },
          highRiskMode: { type: 'boolean' },
          qr: { type: 'object', additionalProperties: true },
          nullifier: { type: 'object', additionalProperties: true },
          addressQuality: { type: 'object', additionalProperties: true },
          delivery: { type: 'object', additionalProperties: true },
          carrier: { type: 'object', additionalProperties: true },
          issuer: { type: 'object', additionalProperties: true },
          recipient: { type: 'object', additionalProperties: true },
          offline: { type: 'object', additionalProperties: true },
          thresholds: { type: 'object', additionalProperties: { type: 'number' } },
        },
        additionalProperties: false,
      },
      AddressSignalChecks: {
        type: 'object',
        required: ['modelVersion', 'radarModelVersion', 'outcomes', 'reasons', 'checks', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_SIGNAL_MODEL_VERSION },
          radarModelVersion: { type: 'string', const: ADDRESS_RADAR_MODEL_VERSION },
          outcomes: { type: 'array', items: { type: 'string', enum: [...ADDRESS_SIGNAL_OUTCOMES] } },
          reasons: { type: 'array', items: { type: 'string', enum: [...ADDRESS_SIGNAL_REASONS] } },
          checks: { type: 'array', items: { type: 'string' } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressSignalEvaluation: {
        type: 'object',
        required: ['modelVersion', 'radarModelVersion', 'outcome', 'riskLevel', 'score', 'reasons', 'matchedRuleIds', 'nextActions', 'operatorDecision', 'evidence', 'privacy', 'radar'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_SIGNAL_MODEL_VERSION },
          radarModelVersion: { type: 'string', const: ADDRESS_RADAR_MODEL_VERSION },
          outcome: { type: 'string', enum: [...ADDRESS_SIGNAL_OUTCOMES] },
          riskLevel: { type: 'string', enum: [...ADDRESS_RADAR_RISK_LEVELS] },
          score: { type: 'number', minimum: 0, maximum: 100 },
          reasons: { type: 'array', items: { type: 'string', enum: [...ADDRESS_SIGNAL_REASONS] } },
          matchedRuleIds: { type: 'array', items: { type: 'string' } },
          nextActions: { type: 'array', items: { type: 'string', enum: [...ADDRESS_RADAR_NEXT_ACTIONS] } },
          operatorDecision: {
            type: 'object',
            required: ['label', 'tone', 'primaryAction', 'message'],
            properties: {
              label: { type: 'string' },
              tone: { type: 'string', enum: ['ok', 'challenge', 'review', 'reject'] },
              primaryAction: { type: 'string', enum: [...ADDRESS_RADAR_NEXT_ACTIONS] },
              message: { type: 'string' },
            },
            additionalProperties: false,
          },
          evidence: { type: 'object', additionalProperties: true },
          privacy: { type: 'object', additionalProperties: true },
          radar: { $ref: '#/components/schemas/AddressRadarEvaluation' },
        },
        additionalProperties: false,
      },
      AgidResultAddressElementCapabilities: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressElementCapabilities' },
            },
          },
        ],
      },
      AgidResultAddressElementSession: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressElementSession' },
            },
          },
        ],
      },
      AgidResultAddressRadarRules: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressRadarRules' },
            },
          },
        ],
      },
      AgidResultAddressRadarEvaluation: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressRadarEvaluation' },
            },
          },
        ],
      },
      AgidResultAddressSignalChecks: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressSignalChecks' },
            },
          },
        ],
      },
      AgidResultAddressSignalEvaluation: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressSignalEvaluation' },
            },
          },
        ],
      },
      AddressConnectEndpointRef: {
        type: 'object',
        required: ['endpointId', 'kind', 'label', 'capabilities', 'countryCodes', 'status'],
        properties: {
          endpointId: { type: 'string' },
          kind: { type: 'string', enum: [...ADDRESS_CONNECT_ENDPOINT_KINDS] },
          label: { type: 'string' },
          publicBaseUrl: { type: 'string', format: 'uri' },
          capabilities: { type: 'array', items: { type: 'string' } },
          countryCodes: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['active', 'probationary', 'suspended', 'revoked'] },
        },
        additionalProperties: false,
      },
      AddressConnectApiKeyRef: {
        type: 'object',
        description: 'Reference and fingerprint only. Raw API keys, tokens, and secrets are not accepted.',
        required: ['keyId', 'fingerprint', 'scopes', 'status'],
        properties: {
          keyId: { type: 'string' },
          fingerprint: { type: 'string' },
          scopes: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CONNECT_SCOPES] } },
          status: { type: 'string', enum: ['active', 'probationary', 'suspended', 'revoked'] },
          lastRotatedAt: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      AddressConnectParticipant: {
        type: 'object',
        required: ['participantId', 'displayName', 'roles', 'status', 'trustLevel', 'endpointRefs'],
        properties: {
          participantId: { type: 'string' },
          displayName: { type: 'string' },
          roles: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CONNECT_ROLES] } },
          countryCodes: { type: 'array', items: { type: 'string' } },
          regionCodes: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['active', 'probationary', 'suspended', 'revoked'] },
          trustLevel: { type: 'string', enum: ['root', 'official', 'verified-provider', 'community', 'self-hosted'] },
          publicKeyCommitments: { type: 'array', items: { type: 'string' } },
          endpointRefs: { type: 'array', items: { $ref: '#/components/schemas/AddressConnectEndpointRef' } },
          webhookSubscriptions: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CONNECT_WEBHOOK_TOPICS] } },
          apiKeyRefs: { type: 'array', items: { $ref: '#/components/schemas/AddressConnectApiKeyRef' } },
          metadataFingerprint: { type: ['string', 'null'] },
        },
        additionalProperties: false,
      },
      AddressConnectRegistryRequest: {
        type: 'object',
        properties: {
          registryId: { type: 'string' },
          generatedAt: { type: 'string', format: 'date-time' },
          participants: {
            type: 'array',
            items: {
              type: 'object',
              description: 'Organization metadata only: roles, countries, endpoint refs, public key commitments, webhook topics, and API key references.',
              additionalProperties: true,
            },
          },
          participant: {
            type: 'object',
            additionalProperties: true,
          },
        },
        additionalProperties: false,
      },
      AddressConnectRegistry: {
        type: 'object',
        required: ['modelVersion', 'registryId', 'accepted', 'registryRoot', 'participants', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_CONNECT_MODEL_VERSION },
          registryId: { type: 'string' },
          generatedAt: { type: 'string', format: 'date-time' },
          accepted: { type: 'boolean' },
          registryRoot: { type: 'string' },
          participants: { type: 'array', items: { $ref: '#/components/schemas/AddressConnectParticipant' } },
          rejectedParticipants: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
          counts: { type: 'object', additionalProperties: true },
          privacy: { type: 'object', additionalProperties: true },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      AddressConnectDiscoverRequest: {
        type: 'object',
        properties: {
          registry: { $ref: '#/components/schemas/AddressConnectRegistryRequest' },
          query: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: [...ADDRESS_CONNECT_ROLES] },
              endpointKind: { type: 'string', enum: [...ADDRESS_CONNECT_ENDPOINT_KINDS] },
              countryCode: { type: 'string' },
              capability: { type: 'string' },
              includeSuspended: { type: 'boolean' },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: true,
      },
      AddressConnectDiscovery: {
        type: 'object',
        required: ['modelVersion', 'matchedEndpointCount', 'matches', 'query', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_CONNECT_MODEL_VERSION },
          matchedEndpointCount: { type: 'integer' },
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                participantId: { type: 'string' },
                displayName: { type: 'string' },
                roles: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CONNECT_ROLES] } },
                trustLevel: { type: 'string' },
                endpoint: { $ref: '#/components/schemas/AddressConnectEndpointRef' },
              },
              additionalProperties: false,
            },
          },
          query: { type: 'object', additionalProperties: true },
          privacy: { type: 'object', additionalProperties: true },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      AddressConnectOperationsReportRequest: {
        type: 'object',
        description: 'Operational metadata only. Raw addresses, raw AGID/AOID, proof codes, tokens, private keys, raw payloads, and full signatures are rejected by implementation policy.',
        properties: {
          generatedAt: { type: 'string', format: 'date-time' },
          endpoints: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                endpointId: { type: 'string' },
                url: { type: 'string', format: 'uri' },
                topics: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CONNECT_WEBHOOK_TOPICS] } },
                signingKeyId: { type: 'string' },
                signatureAlgorithm: { type: 'string', enum: ['hmac-sha256'] },
                status: { type: 'string', enum: ['active', 'paused', 'suspended'] },
                ackTimeoutSeconds: { type: 'integer', minimum: 1 },
                retry: {
                  type: 'object',
                  properties: {
                    maxAttempts: { type: 'integer', minimum: 1 },
                    initialBackoffSeconds: { type: 'integer', minimum: 1 },
                    maxBackoffSeconds: { type: 'integer', minimum: 1 },
                    jitter: { type: 'string', enum: ['none', 'equal', 'full'] },
                    deadLetterAfterAttempts: { type: 'integer', minimum: 1 },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
          },
          deliveries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                endpointId: { type: 'string' },
                topic: { type: 'string', enum: [...ADDRESS_CONNECT_WEBHOOK_TOPICS] },
                eventId: { type: 'string' },
                deliveredAt: { type: 'string', format: 'date-time' },
                statusCode: { type: 'integer' },
                latencyMs: { type: 'number' },
                signatureVerified: { type: 'boolean' },
                attempt: { type: 'integer', minimum: 1 },
                errorCode: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
          sla: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              targetPercent: { type: 'number', minimum: 0, maximum: 100 },
              window: { type: 'string', enum: ['hourly', 'daily', 'monthly'] },
              maxP95LatencyMs: { type: 'integer', minimum: 1 },
              maxErrorRatePercent: { type: 'number', minimum: 0, maximum: 100 },
            },
            additionalProperties: false,
          },
          retention: {
            type: 'object',
            properties: {
              rawPayloadRetentionDays: { type: 'integer', enum: [0] },
              operationalLogRetentionDays: { type: 'integer', minimum: 0 },
              securityLogRetentionDays: { type: 'integer', minimum: 0 },
              auditLogRetentionDays: { type: 'integer', minimum: 0 },
              allowedFields: { type: 'array', items: { type: 'string' } },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      AddressConnectOperationsReport: {
        type: 'object',
        required: ['modelVersion', 'accepted', 'status', 'webhook', 'sla', 'monitoring', 'logRetention', 'privacy', 'reportRoot'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_CONNECT_OPERATIONS_MODEL_VERSION },
          generatedAt: { type: 'string', format: 'date-time' },
          accepted: { type: 'boolean' },
          status: { type: 'string', enum: ['ready', 'attention', 'blocked'] },
          webhook: { type: 'object', additionalProperties: true },
          sla: { type: 'object', additionalProperties: true },
          monitoring: { type: 'object', additionalProperties: true },
          logRetention: { type: 'object', additionalProperties: true },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          privacy: { type: 'object', additionalProperties: true },
          reportRoot: { type: 'string' },
        },
        additionalProperties: false,
      },
      AddressScaleTopologyRequest: {
        type: 'object',
        description: 'Public topology requirements only. Raw addresses, raw AGID/AOID, proof codes, API keys, tokens, secrets, and full private payloads are rejected by implementation policy.',
        properties: {
          generatedAt: { type: 'string', format: 'date-time' },
          workload: { type: 'string', enum: [...ADDRESS_SCALE_WORKLOADS] },
          expectedDailyEvents: { type: 'integer', minimum: 0 },
          peakEventsPerSecond: { type: 'integer', minimum: 0 },
          multiServer: { type: 'boolean' },
          offlinePos: { type: 'boolean' },
          highRiskMode: { type: 'boolean' },
          requireDurableAudit: { type: 'boolean' },
          requireFlexibleEvidence: { type: 'boolean' },
          requireSpatialQuery: { type: 'boolean' },
          requireLowLatency: { type: 'boolean' },
          preferredStores: {
            type: 'array',
            items: { type: 'string', enum: ['memory', 'sqlite', 'postgres', 'redis', 'mongodb'] },
          },
          cacheClasses: {
            type: 'array',
            items: { type: 'string', enum: [...ADDRESS_CACHE_CLASSES] },
          },
        },
        additionalProperties: false,
      },
      AddressScaleTopologyPlan: {
        type: 'object',
        required: ['modelVersion', 'accepted', 'status', 'workload', 'topology', 'stores', 'bulk', 'cache', 'indexes', 'operations', 'privacy', 'planRoot'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION },
          generatedAt: { type: 'string', format: 'date-time' },
          accepted: { type: 'boolean' },
          status: { type: 'string', enum: ['ready', 'attention', 'blocked'] },
          workload: { type: 'string', enum: [...ADDRESS_SCALE_WORKLOADS] },
          expectedDailyEvents: { type: 'integer' },
          peakEventsPerSecond: { type: 'integer' },
          topology: {
            type: 'object',
            properties: {
              mode: { type: 'string', enum: ['single-node', 'multi-server', 'offline-first', 'high-risk'] },
              primaryLedger: { type: 'string', enum: ['memory', 'sqlite', 'postgres', 'redis', 'mongodb'] },
              hotCache: { type: ['string', 'null'], enum: ['memory', 'sqlite', 'postgres', 'redis', 'mongodb', null] },
              documentEvidence: { type: ['string', 'null'], enum: ['memory', 'sqlite', 'postgres', 'redis', 'mongodb', null] },
              offlineStore: { type: ['string', 'null'], enum: ['memory', 'sqlite', 'postgres', 'redis', 'mongodb', null] },
            },
            additionalProperties: false,
          },
          stores: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: [...ADDRESS_SCALE_STORE_ROLES] },
                adapter: { type: 'string', enum: ['memory', 'sqlite', 'postgres', 'redis', 'mongodb'] },
                required: { type: 'boolean' },
                purpose: { type: 'string' },
                consistency: { type: 'string', enum: ['strong', 'eventual', 'local'] },
                recommendedFor: { type: 'array', items: { type: 'string' } },
                notFor: { type: 'array', items: { type: 'string' } },
                envVars: { type: 'array', items: { type: 'string' } },
                privacyControls: { type: 'array', items: { type: 'string' } },
              },
              additionalProperties: false,
            },
          },
          bulk: { type: 'object', additionalProperties: true },
          cache: { type: 'object', additionalProperties: true },
          indexes: { type: 'object', additionalProperties: true },
          operations: { type: 'object', additionalProperties: true },
          privacy: { type: 'object', additionalProperties: true },
          warnings: { type: 'array', items: { type: 'string' } },
          errors: { type: 'array', items: { type: 'string' } },
          planRoot: { type: 'string' },
        },
        additionalProperties: false,
      },
      AddressScaleCapabilities: {
        type: 'object',
        required: ['modelVersion', 'workloads', 'storeRoles', 'stores', 'bulkJobs', 'cacheClasses', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION },
          adapterCompatibility: { $ref: '#/components/schemas/DatabaseAdapterCompatibilitySummary' },
          workloads: { type: 'array', items: { type: 'string', enum: [...ADDRESS_SCALE_WORKLOADS] } },
          storeRoles: { type: 'array', items: { type: 'string', enum: [...ADDRESS_SCALE_STORE_ROLES] } },
          stores: { type: 'object', additionalProperties: true },
          bulkJobs: { type: 'array', items: { type: 'string', enum: [...ADDRESS_BULK_JOB_KINDS] } },
          cacheClasses: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CACHE_CLASSES] } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressConnectOperationalRequirements: {
        type: 'object',
        required: ['modelVersion', 'categories', 'criticalWebhookTopics', 'safeLogFields', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_CONNECT_OPERATIONS_MODEL_VERSION },
          categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', enum: [...ADDRESS_CONNECT_OPERATIONAL_REQUIREMENT_CATEGORIES] },
                label: { type: 'string' },
                requirements: { type: 'array', items: { type: 'string' } },
              },
              additionalProperties: false,
            },
          },
          criticalWebhookTopics: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CONNECT_WEBHOOK_TOPICS] } },
          safeLogFields: { type: 'array', items: { type: 'string' } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressConnectCapabilities: {
        type: 'object',
        required: ['modelVersion', 'roles', 'endpointKinds', 'webhookTopics', 'scopes', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_CONNECT_MODEL_VERSION },
          roles: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CONNECT_ROLES] } },
          endpointKinds: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CONNECT_ENDPOINT_KINDS] } },
          webhookTopics: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CONNECT_WEBHOOK_TOPICS] } },
          scopes: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CONNECT_SCOPES] } },
          supports: { type: 'object', additionalProperties: { type: 'boolean' } },
          privacy: { type: 'object', additionalProperties: true },
          storageBoundary: { type: 'string' },
        },
        additionalProperties: false,
      },
      AddressOperationsCapabilities: {
        type: 'object',
        required: ['modelVersion', 'identityMethods', 'identityClaims', 'webhookTopics', 'disputeTypes', 'dashboardSections', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_OPERATIONS_MODEL_VERSION },
          identityMethods: { type: 'array', items: { type: 'string', enum: [...ADDRESS_IDENTITY_METHODS] } },
          identityClaims: { type: 'array', items: { type: 'string', enum: [...ADDRESS_IDENTITY_CLAIMS] } },
          webhookTopics: { type: 'array', items: { type: 'string', enum: [...ADDRESS_CONNECT_WEBHOOK_TOPICS] } },
          disputeTypes: { type: 'array', items: { type: 'string', enum: [...ADDRESS_DISPUTE_TYPES] } },
          disputeStatuses: { type: 'array', items: { type: 'string', enum: [...ADDRESS_DISPUTE_STATUSES] } },
          dashboardSections: { type: 'array', items: { type: 'string', enum: [...ADDRESS_DASHBOARD_SECTIONS] } },
          supports: { type: 'object', additionalProperties: { type: 'boolean' } },
          privacy: { type: 'object', additionalProperties: true },
          storageBoundary: { type: 'string' },
        },
        additionalProperties: false,
      },
      AddressIdentityVerificationRequest: {
        type: 'object',
        properties: {
          verificationId: { type: 'string' },
          methods: { type: 'array', items: { type: 'string', enum: [...ADDRESS_IDENTITY_METHODS] } },
          claims: { type: 'array', items: { type: 'string', enum: [...ADDRESS_IDENTITY_CLAIMS] } },
          credentialRefs: { type: 'array', items: { type: 'string' } },
          issuerCredentialRefs: { type: 'array', items: { type: 'string' } },
          aoidCommitment: { type: 'string' },
          subjectCommitment: { type: 'string' },
          passkeyChallengeHash: { type: 'string' },
          issuerTrustRoot: { type: 'string' },
          revocationRoot: { type: 'string' },
          freshnessRoot: { type: 'string' },
          hasIssuerTrust: { type: 'boolean' },
          hasRevocationCheck: { type: 'boolean' },
          hasFreshnessCheck: { type: 'boolean' },
        },
        additionalProperties: false,
      },
      AddressIdentityVerification: {
        type: 'object',
        required: ['modelVersion', 'verificationId', 'accepted', 'verified', 'status', 'methods', 'claims', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_OPERATIONS_MODEL_VERSION },
          verificationId: { type: 'string' },
          accepted: { type: 'boolean' },
          verified: { type: 'boolean' },
          status: { type: 'string', enum: ['verified', 'requires-review', 'rejected'] },
          methods: { type: 'array', items: { type: 'string', enum: [...ADDRESS_IDENTITY_METHODS] } },
          claims: { type: 'array', items: { type: 'string', enum: [...ADDRESS_IDENTITY_CLAIMS] } },
          requiredEvidence: { type: 'array', items: { type: 'string' } },
          missingEvidence: { type: 'array', items: { type: 'string' } },
          credentialRefCount: { type: 'integer' },
          identityRoot: { type: 'string' },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressWebhookEventRequest: {
        type: 'object',
        properties: {
          eventId: { type: 'string' },
          topic: { type: 'string', enum: [...ADDRESS_CONNECT_WEBHOOK_TOPICS] },
          endpointId: { type: 'string' },
          deliveryMode: { type: 'string', enum: ['webhook', 'outbox', 'local-audit'] },
          payloadFingerprint: { type: 'string' },
          publicRefs: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      AddressWebhookEvent: {
        type: 'object',
        required: ['modelVersion', 'eventId', 'accepted', 'status', 'endpointId', 'deliveryMode', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_OPERATIONS_MODEL_VERSION },
          eventId: { type: 'string' },
          accepted: { type: 'boolean' },
          status: { type: 'string', enum: ['queued', 'rejected'] },
          topic: { type: ['string', 'null'], enum: [...ADDRESS_CONNECT_WEBHOOK_TOPICS, null] },
          endpointId: { type: 'string' },
          deliveryMode: { type: 'string', enum: ['webhook', 'outbox', 'local-audit'] },
          payloadFingerprint: { type: ['string', 'null'] },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressDisputeCaseRequest: {
        type: 'object',
        properties: {
          caseId: { type: 'string' },
          type: { type: 'string', enum: [...ADDRESS_DISPUTE_TYPES] },
          reporterRole: { type: 'string' },
          evidenceRefs: { type: 'array', items: { type: 'string' } },
          relatedIntentId: { type: 'string' },
          relatedWaybillAlias: { type: 'string' },
          relatedPidCommitment: { type: 'string' },
          handoffReceiptRef: { type: 'string' },
          pidMergeSplitTraceRef: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        additionalProperties: false,
      },
      AddressDisputeCase: {
        type: 'object',
        required: ['modelVersion', 'caseId', 'accepted', 'status', 'severity', 'evidenceRefs', 'nextAction', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_OPERATIONS_MODEL_VERSION },
          caseId: { type: 'string' },
          accepted: { type: 'boolean' },
          type: { type: ['string', 'null'], enum: [...ADDRESS_DISPUTE_TYPES, null] },
          status: { type: 'string', enum: [...ADDRESS_DISPUTE_STATUSES] },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          reporterRole: { type: 'string' },
          evidenceRefs: { type: 'array', items: { type: 'string' } },
          relatedRefs: { type: 'object', additionalProperties: true },
          nextAction: { type: 'string' },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressTaxCustomsContextRequest: {
        type: 'object',
        properties: {
          useCase: { type: 'string', enum: ['cross-border-shipping', 'pos-checkout', 'shopping-agent', 'humanitarian-handoff'] },
          originCountry: { type: 'string' },
          destinationCountry: { type: 'string' },
          hsCode: { type: 'string' },
          barcode: { type: 'string' },
          productCategory: { type: 'string' },
          declaredValue: { type: 'number' },
          currency: { type: 'string' },
          riskFlags: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['battery', 'hazmat', 'medicine', 'cosmetics', 'food', 'plant-animal', 'controlled-dual-use', 'high-value', 'age-restricted'],
            },
          },
          hasPostalCode: { type: 'boolean' },
          hasAgid: { type: 'boolean' },
          hasAoidCredential: { type: 'boolean' },
          hasBusinessVatNumber: { type: 'boolean' },
          hasImporterName: { type: 'boolean' },
          hasExporterName: { type: 'boolean' },
          mode: { type: 'string' },
        },
        additionalProperties: false,
      },
      AddressTaxCustomsContext: {
        type: 'object',
        required: ['modelVersion', 'accepted', 'contextId', 'status', 'dashboardSignals', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_OPERATIONS_MODEL_VERSION },
          accepted: { type: 'boolean' },
          contextId: { type: 'string' },
          decision: { type: ['object', 'null'], additionalProperties: true },
          status: { type: 'string', enum: ['ready-for-estimate', 'needs-manual-review', 'insufficient-data', 'rejected'] },
          dashboardSignals: { type: 'object', additionalProperties: true },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressDashboardSnapshotRequest: {
        type: 'object',
        properties: {
          generatedAt: { type: 'string', format: 'date-time' },
          logs: { type: 'object', additionalProperties: { type: 'number' } },
          linkEvents: { type: 'object', additionalProperties: true },
          audit: { type: 'object', additionalProperties: { type: 'number' } },
          apiKeys: { type: 'object', additionalProperties: { type: 'number' } },
          terminals: { type: 'object', additionalProperties: { type: 'number' } },
          issuers: { type: 'object', additionalProperties: { type: 'number' } },
          webhooks: { type: 'object', additionalProperties: { type: 'number' } },
          reviewQueue: { type: 'object', additionalProperties: { type: 'number' } },
          disputes: { type: 'object', additionalProperties: { type: 'number' } },
          qrUsage: { type: 'object', additionalProperties: true },
          taxCustoms: { type: 'object', additionalProperties: { type: 'number' } },
        },
        additionalProperties: false,
      },
      AddressDashboardSnapshot: {
        type: 'object',
        required: ['modelVersion', 'accepted', 'generatedAt', 'overallStatus', 'sections', 'totals', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_OPERATIONS_MODEL_VERSION },
          accepted: { type: 'boolean' },
          generatedAt: { type: 'string', format: 'date-time' },
          overallStatus: { type: 'string', enum: ['ready', 'attention', 'blocked'] },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', enum: [...ADDRESS_DASHBOARD_SECTIONS] },
                label: { type: 'string' },
                status: { type: 'string', enum: ['ready', 'attention', 'blocked'] },
                primaryMetric: { type: 'number' },
                eventCount: { type: 'number' },
                blockedCount: { type: 'number' },
                attentionCount: { type: 'number' },
                staleCount: { type: 'number' },
                lastEventAt: { type: ['string', 'null'], format: 'date-time' },
                focus: { type: 'array', items: { type: 'string' } },
                nextAction: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
          totals: { type: 'object', additionalProperties: true },
          summary: { type: 'object', additionalProperties: { type: 'number' } },
          attentionFeed: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                section: { type: 'string', enum: [...ADDRESS_DASHBOARD_SECTIONS] },
                status: { type: 'string', enum: ['attention', 'blocked'] },
                reason: { type: 'string' },
                count: { type: 'number' },
                nextAction: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
          lastEventAt: { type: ['string', 'null'], format: 'date-time' },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressTerminalFleetRequest: {
        type: 'object',
        properties: {
          generatedAt: { type: 'string', format: 'date-time' },
          terminals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                terminalId: { type: 'string' },
                label: { type: 'string' },
                siteId: { type: 'string' },
                staffRole: { type: 'string', enum: ['cashier', 'pickup-operator', 'delivery-supervisor', 'field-admin'] },
                hardware: { type: 'object', additionalProperties: true },
                registryFresh: { type: 'boolean' },
                syncState: { type: 'string', enum: ['fresh', 'pending', 'conflict', 'offline', 'error'] },
                pendingOfflineItems: { type: 'integer' },
                scanHistoryCount: { type: 'integer' },
                activeSecureKeys: { type: 'integer' },
                totalSecureKeys: { type: 'integer' },
                lastSeenAt: { type: 'string', format: 'date-time' },
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
      AddressTerminalFleet: {
        type: 'object',
        required: ['modelVersion', 'snapshotId', 'screens', 'deviceClasses', 'terminals', 'totals', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_TERMINAL_MODEL_VERSION },
          snapshotId: { type: 'string' },
          generatedAt: { type: 'string', format: 'date-time' },
          screens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', enum: [...ADDRESS_TERMINAL_SCREENS] },
                label: { type: 'string' },
                purpose: { type: 'string' },
                primaryActions: { type: 'array', items: { type: 'string' } },
              },
              additionalProperties: false,
            },
          },
          deviceClasses: { type: 'array', items: { type: 'string', enum: [...ADDRESS_TERMINAL_DEVICE_CLASSES] } },
          terminals: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
          totals: { type: 'object', additionalProperties: true },
          staffProfiles: { type: 'array', items: { type: 'object', additionalProperties: true } },
          privacy: { type: 'object', additionalProperties: true },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      AddressTerminalCapabilities: {
        type: 'object',
        required: ['modelVersion', 'screens', 'deviceClasses', 'staffProfiles', 'registryChecks', 'offlineControls', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_TERMINAL_MODEL_VERSION },
          screens: { type: 'array', items: { type: 'object', additionalProperties: true } },
          deviceClasses: { type: 'array', items: { type: 'string', enum: [...ADDRESS_TERMINAL_DEVICE_CLASSES] } },
          staffProfiles: { type: 'array', items: { type: 'object', additionalProperties: true } },
          registryChecks: { type: 'array', items: { type: 'string' } },
          offlineControls: { type: 'array', items: { type: 'string' } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AddressLaunchCenterEvaluationRequest: {
        type: 'object',
        properties: {
          environment: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_ENVIRONMENTS] },
          profile: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_PROFILES] },
          mode: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_MODES] },
          requiresHighRiskMode: { type: 'boolean' },
          oauth: { type: 'object', additionalProperties: { type: 'boolean' } },
          webhooks: { type: 'object', additionalProperties: { type: 'boolean' } },
          registry: {
            type: 'object',
            properties: {
              revocationCheck: { type: 'boolean' },
              freshnessCheck: { type: 'boolean' },
              issuerTrustCheck: { type: 'boolean' },
              usedStatusCheck: { type: 'boolean' },
              freshnessAgeSeconds: { type: 'number' },
              maxFreshnessAgeSeconds: { type: 'number' },
              fallbackMode: { type: 'string' },
            },
            additionalProperties: false,
          },
          storageLogging: {
            type: 'object',
            properties: {
              redactionEnabled: { type: 'boolean' },
              retentionPolicyDays: { type: 'number' },
              auditLogEnabled: { type: 'boolean' },
              rawAddressLogs: { type: 'boolean' },
              rawAgidLogs: { type: 'boolean' },
              rawAoidLogs: { type: 'boolean' },
              proofCodeLogs: { type: 'boolean' },
            },
            additionalProperties: false,
          },
          duplicates: { type: 'object', additionalProperties: { type: 'boolean' } },
          highRiskMode: { type: 'object', additionalProperties: { type: 'boolean' } },
          errorHandling: { type: 'object', additionalProperties: { type: 'boolean' } },
          terminal: { type: 'object', additionalProperties: { type: 'boolean' } },
          security: { type: 'object', additionalProperties: { type: 'boolean' } },
          threatModel: {
            type: 'object',
            properties: {
              templateSelected: { type: 'boolean' },
              templateId: { type: 'string' },
              reviewOwner: { type: 'string' },
              misuseCasesReviewed: { type: 'boolean' },
              noRawAddressReviewed: { type: 'boolean' },
              highRiskModeReviewed: { type: 'boolean' },
              verificationCommandsMapped: { type: 'boolean' },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      AddressLaunchCenterChecklistItem: {
        type: 'object',
        required: ['id', 'category', 'label', 'requiredForProduction', 'summary', 'evidence', 'remediation'],
        properties: {
          id: { type: 'string' },
          category: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_CATEGORIES] },
          label: { type: 'string' },
          requiredForProduction: { type: 'boolean' },
          summary: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' } },
          remediation: { type: 'string' },
        },
        additionalProperties: false,
      },
      AddressLaunchCenterChecklist: {
        type: 'object',
        required: ['modelVersion', 'categories', 'statuses', 'itemStatuses', 'items', 'privacy', 'supports'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_LAUNCH_CENTER_MODEL_VERSION },
          categories: { type: 'array', items: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_CATEGORIES] } },
          statuses: { type: 'array', items: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_STATUSES] } },
          itemStatuses: { type: 'array', items: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_ITEM_STATUSES] } },
          items: { type: 'array', items: { $ref: '#/components/schemas/AddressLaunchCenterChecklistItem' } },
          privacy: { type: 'object', additionalProperties: true },
          supports: { type: 'object', additionalProperties: { type: 'boolean' } },
        },
        additionalProperties: false,
      },
      AddressLaunchCenterEvaluationItem: {
        allOf: [
          { $ref: '#/components/schemas/AddressLaunchCenterChecklistItem' },
          {
            type: 'object',
            required: ['required', 'status', 'presentEvidence', 'missingEvidence'],
            properties: {
              required: { type: 'boolean' },
              status: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_ITEM_STATUSES] },
              presentEvidence: { type: 'array', items: { type: 'string' } },
              missingEvidence: { type: 'array', items: { type: 'string' } },
            },
            additionalProperties: false,
          },
        ],
      },
      AddressLaunchCenterEvaluation: {
        type: 'object',
        required: ['modelVersion', 'accepted', 'status', 'environment', 'profile', 'mode', 'launchRoot', 'score', 'items', 'totals', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: ADDRESS_LAUNCH_CENTER_MODEL_VERSION },
          accepted: { type: 'boolean' },
          status: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_STATUSES] },
          environment: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_ENVIRONMENTS] },
          profile: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_PROFILES] },
          mode: { type: 'string', enum: [...ADDRESS_LAUNCH_CENTER_MODES] },
          launchRoot: { type: 'string', pattern: '^[a-f0-9]{64}$' },
          score: { type: 'integer', minimum: 0, maximum: 100 },
          items: { type: 'array', items: { $ref: '#/components/schemas/AddressLaunchCenterEvaluationItem' } },
          totals: { type: 'object', additionalProperties: true },
          nextActions: { type: 'array', items: { type: 'string' } },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AgidResultAddressLaunchCenterChecklist: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressLaunchCenterChecklist' },
            },
          },
        ],
      },
      AgidResultAddressLaunchCenterEvaluation: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressLaunchCenterEvaluation' },
            },
          },
        ],
      },
      AgidResultAddressOperationsCapabilities: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressOperationsCapabilities' },
            },
          },
        ],
      },
      AgidResultAddressIdentityVerification: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressIdentityVerification' },
            },
          },
        ],
      },
      AgidResultAddressWebhookEvent: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressWebhookEvent' },
            },
          },
        ],
      },
      AgidResultAddressDisputeCase: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressDisputeCase' },
            },
          },
        ],
      },
      AgidResultAddressTaxCustomsContext: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressTaxCustomsContext' },
            },
          },
        ],
      },
      AgidResultAddressDashboardSnapshot: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressDashboardSnapshot' },
            },
          },
        ],
      },
      AgidResultAddressConnectCapabilities: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressConnectCapabilities' },
            },
          },
        ],
      },
      AgidResultAddressConnectRegistry: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressConnectRegistry' },
            },
          },
        ],
      },
      AgidResultAddressConnectDiscovery: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressConnectDiscovery' },
            },
          },
        ],
      },
      AgidResultAddressConnectOperationalRequirements: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressConnectOperationalRequirements' },
            },
          },
        ],
      },
      AgidResultAddressConnectOperationsReport: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressConnectOperationsReport' },
            },
          },
        ],
      },
      AgidResultAddressScaleCapabilities: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressScaleCapabilities' },
            },
          },
        ],
      },
      AgidResultAddressScaleTopologyPlan: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressScaleTopologyPlan' },
            },
          },
        ],
      },
      AgidResultAddressTerminalCapabilities: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressTerminalCapabilities' },
            },
          },
        ],
      },
      AgidResultAddressTerminalFleet: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AddressTerminalFleet' },
            },
          },
        ],
      },
      CommunicationHealth: {
        type: 'object',
        required: ['rest', 'sse', 'localFirstSync', 'externalApiProxy'],
        properties: {
          rest: { type: 'boolean' },
          sse: { type: 'boolean' },
          localFirstSync: { type: 'boolean' },
          externalApiProxy: { type: 'boolean' },
          registrationAudit: { type: 'boolean' },
          aoidEncryptedSync: { type: 'boolean' },
          governanceModel: { type: 'string' },
        },
      },
      AgidResultCommunicationHealth: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/CommunicationHealth' },
            },
          },
        ],
      },
      OracleOperaIntegrationHealth: {
        type: 'object',
        required: [
          'adapterVersion',
          'enabled',
          'dryRun',
          'credentialsConfigured',
          'writePathConfigured',
          'liveWritesEnabled',
          'hotelIdConfigured',
          'appKeyConfigured',
          'supportedOperations',
          'requiredEnvVars',
          'optionalEnvVars',
          'missingEnvVars',
        ],
        properties: {
          adapterVersion: { type: 'string' },
          enabled: { type: 'boolean' },
          dryRun: { type: 'boolean' },
          credentialsConfigured: { type: 'boolean' },
          writePathConfigured: { type: 'boolean' },
          liveWritesEnabled: { type: 'boolean' },
          baseUrlHost: { type: 'string' },
          hotelIdConfigured: { type: 'boolean' },
          appKeyConfigured: { type: 'boolean' },
          supportedOperations: { type: 'array', items: { type: 'string' } },
          requiredEnvVars: { type: 'array', items: { type: 'string' } },
          optionalEnvVars: { type: 'array', items: { type: 'string' } },
          missingEnvVars: { type: 'array', items: { type: 'string' } },
        },
      },
      OracleOperaAddressSyncRequest: {
        type: 'object',
        required: ['address'],
        properties: {
          agid: { type: 'string' },
          address: {
            oneOf: [
              { type: 'string' },
              {
                type: 'object',
                additionalProperties: true,
                properties: {
                  recipient: { type: 'string' },
                  company: { type: 'string' },
                  building: { type: 'string' },
                  line1: { type: 'string' },
                  line2: { type: 'string' },
                  street: { type: 'string' },
                  houseNumber: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  province: { type: 'string' },
                  region: { type: 'string' },
                  postalCode: { type: 'string' },
                  countryCode: { type: 'string' },
                  displayText: { type: 'string' },
                },
              },
            ],
          },
          addressText: { type: 'string' },
          language: { type: 'string' },
          countryCode: { type: 'string' },
          profileId: { type: 'string' },
          reservationId: { type: 'string' },
          externalReferenceId: { type: 'string' },
          propertyCode: { type: 'string' },
          hotelId: { type: 'string' },
          coordinates: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lon: { type: 'number' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
            },
          },
          confidence: { type: 'number' },
          sources: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
      },
      OracleOperaAddressSyncResult: {
        type: 'object',
        required: ['ok', 'mode', 'operation', 'adapterVersion', 'method', 'requestBody', 'warnings', 'sources'],
        properties: {
          ok: { type: 'boolean' },
          mode: { type: 'string', enum: ['dry-run', 'live'] },
          operation: { type: 'string', enum: ['address-sync'] },
          adapterVersion: { type: 'string' },
          endpoint: { type: 'string' },
          method: { type: 'string', enum: ['POST', 'PUT', 'PATCH'] },
          requestBody: {
            type: 'object',
            additionalProperties: true,
          },
          response: {
            type: 'object',
            properties: {
              status: { type: 'number' },
              ok: { type: 'boolean' },
              bodyReturned: { type: 'boolean' },
              body: {},
            },
          },
          error: { type: 'string' },
          warnings: { type: 'array', items: { type: 'string' } },
          sources: { type: 'array', items: { type: 'string' } },
        },
      },
      AgidResultOracleOperaIntegrationHealth: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/OracleOperaIntegrationHealth' },
            },
          },
        ],
      },
      AgidResultOracleOperaAddressSyncResult: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/OracleOperaAddressSyncResult' },
            },
          },
        ],
      },
      CloudDbConnectorProfile: {
        type: 'object',
        required: [
          'id',
          'label',
          'family',
          'requiredEnvVars',
          'optionalEnvVars',
          'capabilities',
          'recommendedUse',
          'caveats',
        ],
        properties: {
          id: {
            type: 'string',
            enum: CLOUD_DB_OPENAPI_PROVIDER_IDS,
          },
          family: {
            type: 'string',
            enum: CLOUD_DB_OPENAPI_PROVIDER_FAMILIES,
          },
          label: { type: 'string' },
          capabilities: {
            type: 'object',
            additionalProperties: { type: 'boolean' },
          },
          requiredEnvVars: { type: 'array', items: { type: 'string' } },
          optionalEnvVars: { type: 'array', items: { type: 'string' } },
          recommendedUse: { type: 'array', items: { type: 'string' } },
          caveats: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: true,
      },
      DatabaseAdapterCompatibilityRecord: {
        type: 'object',
        required: [
          'id',
          'label',
          'family',
          'status',
          'addressResolutionLedger',
          'cloudDbConnectorPlan',
          'encryptedAoidSync',
          'plaintextAoidAllowed',
          'recommendedFor',
          'notRecommendedFor',
          'requiredEnvVars',
          'schemaRefs',
          'privacyControls',
          'nextSteps',
        ],
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          family: {
            type: 'string',
            enum: Array.from(new Set([...CLOUD_DB_OPENAPI_PROVIDER_FAMILIES, 'embedded-db', 'memory'])),
          },
          status: {
            type: 'string',
            enum: [
              'runtime-ledger-adapter',
              'postgres-compatible-runtime-adapter',
              'planned-runtime-adapter',
              'connector-plan-only',
              'cache-only',
              'object-storage-export',
              'webhook-dispatch',
            ],
          },
          runtimeLedgerStoreMode: {
            type: 'string',
            enum: ['memory', 'sqlite', 'postgres', 'redis', 'mongodb'],
          },
          addressResolutionLedger: { type: 'boolean' },
          cloudDbConnectorPlan: { type: 'boolean' },
          encryptedAoidSync: { type: 'boolean' },
          plaintextAoidAllowed: { type: 'boolean', const: false },
          recommendedFor: { type: 'array', items: { type: 'string' } },
          notRecommendedFor: { type: 'array', items: { type: 'string' } },
          requiredEnvVars: { type: 'array', items: { type: 'string' } },
          schemaRefs: { type: 'array', items: { type: 'string' } },
          privacyControls: { type: 'array', items: { type: 'string' } },
          nextSteps: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      CloudDbConnectorPlanRequest: {
        type: 'object',
        required: ['providerId', 'purpose', 'layer', 'entityType', 'payload'],
        properties: {
          providerId: { $ref: '#/components/schemas/CloudDbConnectorProfile/properties/id' },
          purpose: {
            type: 'string',
            enum: [
              'public-agid-cache',
              'address-verification-cache',
              'encrypted-aoid-sync',
              'audit-log',
              'proof-bundle-registry',
              'credential-issuer-registry',
              'revocation-freshness-anchor',
              'settings-sync',
            ],
          },
          layer: { type: 'string', enum: ['AGID', 'AOID'] },
          entityType: { type: 'string' },
          payload: {
            type: 'object',
            additionalProperties: true,
            description: 'Public AGID/reference metadata or an AOID encrypted sync envelope. Raw private AOID fields are rejected by policy.',
          },
          ownerConsent: { type: 'boolean' },
          encryptedAtRest: { type: 'boolean' },
          encryptedInTransit: { type: 'boolean' },
          storeRawPayload: { type: 'boolean', default: false },
          region: { type: 'string' },
        },
        additionalProperties: false,
      },
      CloudDbConnectorPlan: {
        type: 'object',
        required: ['modelVersion', 'provider', 'purpose', 'allowed', 'decision'],
        properties: {
          modelVersion: { type: 'string' },
          provider: { $ref: '#/components/schemas/CloudDbConnectorProfile' },
          purpose: { type: 'string' },
          allowed: { type: 'boolean' },
          decision: { type: 'object', additionalProperties: true },
          requiredControls: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          storageContract: { type: 'object', additionalProperties: true },
          adapterContract: { type: 'object', additionalProperties: true },
        },
        additionalProperties: true,
      },
      CloudDbSyncJobRequest: {
        type: 'object',
        required: ['providerId', 'purpose', 'layer', 'entityType', 'entityId', 'action', 'payload'],
        properties: {
          providerId: { $ref: '#/components/schemas/CloudDbConnectorProfile/properties/id' },
          purpose: {
            type: 'string',
            enum: [
              'public-agid-cache',
              'address-verification-cache',
              'encrypted-aoid-sync',
              'audit-log',
              'proof-bundle-registry',
              'credential-issuer-registry',
              'revocation-freshness-anchor',
              'settings-sync',
            ],
          },
          layer: { type: 'string', enum: ['AGID', 'AOID'] },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          action: {
            type: 'string',
            enum: ['upsert', 'delete', 'append-event', 'anchor-root'],
          },
          payload: {
            type: 'object',
            additionalProperties: true,
            description: 'Public AGID/reference metadata or an AOID encrypted sync envelope. Raw private AOID fields are rejected by policy.',
          },
          ownerConsent: { type: 'boolean' },
          encryptedAtRest: { type: 'boolean' },
          encryptedInTransit: { type: 'boolean' },
          storeRawPayload: { type: 'boolean', default: false },
          region: { type: 'string' },
          now: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      CloudDbSyncJob: {
        type: 'object',
        required: ['id', 'providerId', 'purpose', 'record', 'plan', 'networkRequestBuilt'],
        properties: {
          id: { type: 'string' },
          providerId: { type: 'string' },
          purpose: { type: 'string' },
          record: { type: 'object', additionalProperties: true },
          plan: { $ref: '#/components/schemas/CloudDbConnectorPlan' },
          networkRequestBuilt: { type: 'boolean', const: false },
        },
        additionalProperties: true,
      },
      AgidResultCloudDbConnectors: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                required: ['connectors', 'plaintextAoidStorageAllowed'],
                properties: {
                  connectors: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CloudDbConnectorProfile' },
                  },
                  plaintextAoidStorageAllowed: { type: 'boolean', const: false },
                },
              },
            },
          },
        ],
      },
      AgidResultDatabaseAdapterCompatibility: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                required: ['summary', 'adapters', 'validation', 'plaintextAoidStorageAllowed', 'runtimeLedgerStoreModes'],
                properties: {
                  summary: {
                    type: 'object',
                    additionalProperties: true,
                  },
                  adapters: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/DatabaseAdapterCompatibilityRecord' },
                  },
                  validation: {
                    type: 'object',
                    additionalProperties: true,
                  },
                  plaintextAoidStorageAllowed: { type: 'boolean', const: false },
                  runtimeLedgerStoreModes: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: ['memory', 'sqlite', 'postgres', 'redis', 'mongodb'],
                    },
                  },
                },
              },
            },
          },
        ],
      },
      AgidResultCloudDbConnectorPlan: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/CloudDbConnectorPlan' },
            },
          },
        ],
      },
      AgidResultCloudDbSyncJob: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/CloudDbSyncJob' },
            },
          },
        ],
      },
      PosRuntimeRecommendation: {
        type: 'object',
        required: ['task', 'rewriteFromTypeScript', 'preferredBackends', 'reason'],
        properties: {
          task: {
            type: 'string',
            enum: [
              'browser-qr-nfc-ui',
              'api-orchestration',
              'payload-redaction',
              'deterministic-predicate-evaluation',
              'formal-zk-proof-generation',
            ],
          },
          rewriteFromTypeScript: { type: 'boolean' },
          preferredBackends: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'typescript-react',
                'typescript-express',
                'typescript-policy-core',
                'rust-wasm',
                'rust-native',
                'zk-circuit',
              ],
            },
          },
          reason: { type: 'string' },
        },
        additionalProperties: false,
      },
      PosRuntimePolicy: {
        type: 'object',
        required: ['version', 'rule', 'recommendations'],
        properties: {
          version: { type: 'string', const: POS_RUNTIME_POLICY_VERSION },
          rule: { type: 'string' },
          recommendations: {
            type: 'array',
            items: { $ref: '#/components/schemas/PosRuntimeRecommendation' },
          },
        },
        additionalProperties: false,
      },
      PosAcceptanceCapabilities: {
        type: 'object',
        required: [
          'modelVersion',
          'supportedChannels',
          'supportedPayloads',
          'rawPayloadStorage',
          'receiptLimit',
          'runtimePolicy',
        ],
        properties: {
          modelVersion: { type: 'string', const: POS_ACCEPTANCE_MODEL_VERSION },
          supportedChannels: {
            type: 'array',
            items: { type: 'string', enum: ['qr', 'nfc', 'manual'] },
          },
          supportedPayloads: {
            type: 'array',
            items: { type: 'string', enum: ['agid:address:*', 'agid:waybill:*', 'agid:nfc:*', 'AGIDS1-*', 'direct-public-AGID'] },
          },
          rawPayloadStorage: { type: 'boolean', const: false },
          receiptLimit: { type: 'integer', minimum: 1 },
          browserNfcRequires: { type: 'array', items: { type: 'string' } },
          runtimePolicy: { $ref: '#/components/schemas/PosRuntimePolicy' },
        },
        additionalProperties: false,
      },
      PosAcceptanceRequest: {
        type: 'object',
        required: ['payload'],
        properties: {
          payload: {
            type: 'string',
            description: 'An agid:address payload, agid:waybill payload, agid:nfc wrapper, AGID-S token, direct public AGID, or JSON containing a payload field.',
          },
          text: {
            type: 'string',
            description: 'Compatibility alias for payload.',
          },
          channel: { type: 'string', enum: ['qr', 'nfc', 'manual'], default: 'manual' },
          scanRole: {
            type: 'string',
            enum: ['carrier', 'recipient'],
            description: 'Role used when verifying agid:waybill shipping label payloads.',
          },
          recipientProofCode: {
            type: 'string',
            description: 'Compatibility alias for recipientProofSecret. The POS receipt does not persist this value.',
          },
          recipientProofSecret: {
            type: 'string',
            description: 'Recipient-side one-time secret, Passkey/WebAuthn evidence, AOID credential material, or NFC card assertion for agid:waybill payloads. The POS receipt does not persist this value.',
          },
          recipientProofMethod: {
            type: 'string',
            enum: ['recipient-secret-commitment', 'passkey-webauthn', 'aoid-credential', 'nfc-card', 'presence-only'],
            description: 'Proof method expected by the waybill recipientProof commitment.',
          },
          recipientChallenge: {
            type: 'string',
            description: 'POS-issued challenge nonce for high-risk agid:waybill recipient handoff. Receipts store only a challenge hash.',
          },
          recipientChallengeSignature: {
            type: 'string',
            description: 'Recipient-side challenge signature or passkey result for high-risk agid:waybill handoff. Receipts store only a redacted tail.',
          },
          recipientChallengeAlgorithm: {
            type: 'string',
            description: 'Challenge signature algorithm identifier. Defaults to sha256-waybill-recipient-challenge-v2 for local validation.',
          },
          recipientChallengePublicKeyHint: {
            type: 'string',
            description: 'Optional public key or passkey credential hint. Do not send private key material.',
          },
          terminalId: { type: 'string', maxLength: 120 },
          operatorId: { type: 'string', maxLength: 120 },
          storePosId: {
            type: 'string',
            maxLength: 120,
            description: 'Store or POS identifier bound into signed waybill receipts. Defaults to terminalId.',
          },
          carrierTerminalId: {
            type: 'string',
            maxLength: 120,
            description: 'Delivery-worker terminal/device id required for carrier-side waybill scans.',
          },
          carrierTerminalSignature: {
            type: 'string',
            maxLength: 512,
            description: 'Delivery-worker terminal signature or signed attestation for carrier-side waybill scans.',
          },
          carrierTerminalSignedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp reported by the delivery-worker terminal. Invalid values fall back to receipt time.',
          },
          carrierLocation: {
            type: 'object',
            description: 'Optional carrier-side location evidence. Receipts store only coarse buckets; high-risk waybills use wider buckets.',
            properties: {
              latitude: { type: 'number', minimum: -90, maximum: 90 },
              longitude: { type: 'number', minimum: -180, maximum: 180 },
              accuracyMeters: { type: 'number', minimum: 0 },
              label: { type: 'string', maxLength: 120 },
            },
            additionalProperties: false,
          },
          carrierLocationLat: { type: 'number', minimum: -90, maximum: 90 },
          carrierLocationLon: { type: 'number', minimum: -180, maximum: 180 },
          carrierLocationAccuracyMeters: { type: 'number', minimum: 0 },
          carrierLocationLabel: { type: 'string', maxLength: 120 },
          purpose: { type: 'string', maxLength: 120 },
          amount: { type: 'number' },
          currency: { type: 'string', minLength: 3, maxLength: 8 },
        },
        additionalProperties: false,
      },
      PosRecordSummary: {
        type: 'object',
        required: ['recordType', 'entityIdTail', 'label', 'rawPayloadStored'],
        properties: {
          recordType: { type: 'string', enum: ['ADDRESS', 'AOID', 'AGID', 'WAYBILL'] },
          entityIdTail: {
            type: 'string',
            description: 'Last characters of the accepted AGID/AOID only; not the full identifier.',
          },
          agidTail: {
            type: 'string',
            description: 'Last characters of the linked AGID when available.',
          },
          country: { type: 'string' },
          city: { type: 'string' },
          postcode: { type: 'string' },
          label: { type: 'string' },
          rawPayloadStored: { type: 'boolean', const: false },
        },
        additionalProperties: false,
      },
      PosAcceptanceReceipt: {
        type: 'object',
        required: [
          'modelVersion',
          'receiptId',
          'accepted',
          'status',
          'channel',
          'createdAt',
          'errors',
          'warnings',
          'privacyNotes',
        ],
        properties: {
          modelVersion: { type: 'string', const: POS_ACCEPTANCE_MODEL_VERSION },
          receiptId: { type: 'string' },
          accepted: { type: 'boolean' },
          status: { type: 'string', enum: ['accepted', 'rejected', 'review'] },
          channel: { type: 'string', enum: ['qr', 'nfc', 'manual'] },
          terminalId: { type: 'string' },
          operatorId: { type: 'string' },
          purpose: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          record: { $ref: '#/components/schemas/PosRecordSummary' },
          shippingLabel: {
            type: 'object',
            required: [
              'waybillId',
              'waybillAlias',
              'jti',
              'nullifier',
              'riskLevel',
              'scanId',
              'scanRole',
              'proofLevel',
              'addressVerified',
              'carrierScanVerified',
              'recipientControlVerified',
              'packageReceiptVerified',
              'recipientChallengeRequired',
              'recipientChallengeVerified',
              'expiresAt',
              'terminalEvidenceSignature',
              'terminalEvidenceSignatureAlgorithm',
              'terminalSignedAt',
              'storePosId',
              'dualScanRequired',
              'proofMethod',
            ],
            properties: {
              waybillId: { type: 'string', description: 'Short-term waybill alias exposed to POS and receipt logs. It is not the carrier/private waybill id.' },
              waybillAlias: { type: 'boolean', const: true },
              waybillCommitment: { type: 'string', description: 'Domain-separated commitment to the private waybill id and alias.' },
              addressReferenceCommitment: { type: 'string', description: 'Domain-separated commitment for the address/AGID/AOID reference. Raw AGID and exact address are not stored.' },
              jti: { type: 'string', description: 'Required one-time token id used for copied QR replay resistance.' },
              nullifier: { type: 'string', description: 'Privacy-preserving used-state key for recipient handoff replay checks.' },
              riskLevel: { type: 'string', enum: ['standard', 'high'] },
              scanId: { type: 'string' },
              scanRole: { type: 'string', enum: ['carrier', 'recipient'] },
              proofLevel: {
                type: 'string',
                enum: ['none', 'address-valid', 'carrier-accepted', 'recipient-controlled', 'delivery-completed'],
              },
              proofStages: { type: 'array', items: { type: 'object', additionalProperties: true } },
              addressVerified: { type: 'boolean' },
              carrierScanVerified: { type: 'boolean' },
              recipientControlVerified: { type: 'boolean' },
              packageReceiptVerified: { type: 'boolean' },
              recipientChallengeRequired: { type: 'boolean' },
              recipientChallengeVerified: { type: 'boolean' },
              recipientChallengeHash: { type: 'string' },
              recipientChallengeSignatureTail: { type: 'string' },
              expiresAt: { type: 'string', format: 'date-time' },
              terminalEvidenceSignature: { type: 'string' },
              terminalEvidenceSignatureAlgorithm: { type: 'string' },
              terminalSignedAt: { type: 'string', format: 'date-time' },
              storePosId: { type: 'string' },
              carrierTerminalId: { type: 'string' },
              carrierTerminalSignature: { type: 'string' },
              carrierTerminalSignedAt: { type: 'string', format: 'date-time' },
              carrierLocation: {
                type: 'object',
                properties: {
                  precision: { type: 'string', enum: ['coarse', 'coarse-high-risk'] },
                  latBucket: { type: 'number' },
                  lonBucket: { type: 'number' },
                  accuracyMeters: { type: 'number' },
                  label: { type: 'string' },
                },
                additionalProperties: false,
              },
              dualScanRequired: { type: 'boolean' },
              proofMethod: { type: 'string', enum: ['recipient-secret-commitment', 'passkey-webauthn', 'aoid-credential', 'nfc-card', 'presence-only'] },
              proofDomain: { type: 'string' },
              proofNonceTail: { type: 'string' },
              domainSeparation: {
                type: 'object',
                description: 'Purpose domains used for alias, address commitment, nullifier, carrier, recipient, return, and pickup proofs.',
                additionalProperties: { type: 'string' },
              },
            },
            additionalProperties: false,
          },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          privacyNotes: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      AgidResultPosCapabilities: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/PosAcceptanceCapabilities' },
            },
          },
        ],
      },
      AgidResultPosAcceptance: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/PosAcceptanceReceipt' },
            },
          },
        ],
      },
      AgidResultPosRecent: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                required: ['modelVersion', 'receipts'],
                properties: {
                  modelVersion: { type: 'string', const: POS_ACCEPTANCE_MODEL_VERSION },
                  receipts: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PosAcceptanceReceipt' },
                  },
                },
                additionalProperties: false,
              },
            },
          },
        ],
      },
      ExternalPosManifest: {
        type: 'object',
        required: ['id', 'providerId', 'name', 'adapter', 'operations', 'privacyMode'],
        properties: {
          id: { type: 'string' },
          providerId: { type: 'string' },
          name: { type: 'string' },
          version: { type: 'string' },
          adapter: {
            type: 'string',
            enum: ['agid-pos-json-v1', 'generic-json', 'square-compatible', 'stripe-terminal-compatible', 'shopify-pos-compatible', 'custom-rest-compatible'],
          },
          operations: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['sale-link', 'pickup-ready', 'handoff-complete', 'receipt-export', 'customer-note', 'refund-release'],
            },
          },
          supportedCountries: { type: 'array', items: { type: 'string' } },
          privacyMode: {
            type: 'string',
            enum: ['commitment-only', 'receipt-only', 'redacted-order', 'plaintext-address-required'],
          },
          endpointId: { type: 'string' },
          requiresCredential: { type: 'boolean' },
          supportsSandbox: { type: 'boolean' },
          dataRetention: { type: 'string', enum: ['none', 'ephemeral', 'provider-policy'] },
        },
        additionalProperties: false,
      },
      ExternalPosOperationRequest: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['sale-link', 'pickup-ready', 'handoff-complete', 'receipt-export', 'customer-note', 'refund-release'],
          },
          posApiIds: { type: 'array', items: { type: 'string' } },
          apiIds: { type: 'array', items: { type: 'string' } },
          receipt: { $ref: '#/components/schemas/PosAcceptanceReceipt' },
          posReceipt: { $ref: '#/components/schemas/PosAcceptanceReceipt' },
          order: { type: 'object', additionalProperties: true },
          orderId: { type: 'string' },
          orderAlias: { type: 'string' },
          addressReference: { type: 'object', additionalProperties: true },
          notes: { type: 'string' },
        },
        additionalProperties: true,
      },
      ExternalPosCapabilities: {
        type: 'object',
        required: ['modelVersion', 'serverConfigured', 'apis', 'importContract', 'privacyDefaults', 'operations'],
        properties: {
          modelVersion: { type: 'string', const: EXTERNAL_POS_INTEGRATION_MODEL_VERSION },
          serverConfigured: { type: 'boolean' },
          apis: {
            type: 'array',
            items: { $ref: '#/components/schemas/ExternalPosManifest' },
          },
          importContract: { type: 'object', additionalProperties: true },
          privacyDefaults: { type: 'object', additionalProperties: true },
          operations: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['sale-link', 'pickup-ready', 'handoff-complete', 'receipt-export', 'customer-note', 'refund-release'],
            },
          },
        },
        additionalProperties: true,
      },
      ExternalPosNormalizedResult: {
        type: 'object',
        required: ['apiId', 'providerId', 'operation', 'ok', 'events', 'warnings', 'sources', 'rawResponseReturned'],
        properties: {
          apiId: { type: 'string' },
          providerId: { type: 'string' },
          operation: {
            type: 'string',
            enum: ['sale-link', 'pickup-ready', 'handoff-complete', 'receipt-export', 'customer-note', 'refund-release'],
          },
          ok: { type: 'boolean' },
          status: { type: 'string' },
          providerReference: { type: 'string' },
          orderId: { type: 'string' },
          receiptId: { type: 'string' },
          pickupCodeAlias: { type: 'string' },
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                observedAt: { type: 'string' },
                location: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
          warnings: { type: 'array', items: { type: 'string' } },
          sources: { type: 'array', items: { type: 'string' } },
          error: { type: 'string' },
          rawResponseReturned: { type: 'boolean' },
          rawResponse: {},
        },
        additionalProperties: false,
      },
      ExternalPosRun: {
        type: 'object',
        required: ['modelVersion', 'operation', 'attempted', 'results', 'privacy'],
        properties: {
          modelVersion: { type: 'string', const: EXTERNAL_POS_INTEGRATION_MODEL_VERSION },
          operation: {
            type: 'string',
            enum: ['sale-link', 'pickup-ready', 'handoff-complete', 'receipt-export', 'customer-note', 'refund-release'],
          },
          attempted: { type: 'integer', minimum: 0 },
          results: {
            type: 'array',
            items: { $ref: '#/components/schemas/ExternalPosNormalizedResult' },
          },
          privacy: { type: 'object', additionalProperties: true },
        },
        additionalProperties: true,
      },
      ExternalPosImport: {
        type: 'object',
        required: ['modelVersion', 'accepted', 'errors'],
        properties: {
          modelVersion: { type: 'string', const: EXTERNAL_POS_INTEGRATION_MODEL_VERSION },
          accepted: { type: 'boolean' },
          manifest: { $ref: '#/components/schemas/ExternalPosManifest' },
          execution: { type: 'object', additionalProperties: true },
          errors: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: true,
      },
      AgidResultExternalPosCapabilities: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/ExternalPosCapabilities' },
            },
          },
        ],
      },
      AgidResultExternalPosImport: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/ExternalPosImport' },
            },
          },
        ],
      },
      AgidResultExternalPosRun: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/ExternalPosRun' },
            },
          },
        ],
      },
      HybridQualityRequest: {
        type: 'object',
        required: ['workflow'],
        properties: {
          workflow: {
            type: 'string',
            enum: [
              'agid-core',
              'address-registration',
              'address-quality',
              'postal-lookup',
              'geo-evidence',
              'building-name',
              'registered-address-sync',
              'settings-sync',
              'sdk-package',
            ],
          },
          centralConfidence: { type: 'number', minimum: 0, maximum: 1 },
          hasLocalRecord: { type: 'boolean' },
          hasOpenDataPack: { type: 'boolean' },
          userOptedInToSync: { type: 'boolean' },
        },
        additionalProperties: true,
      },
      AgidResultHybridQuality: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  decision: { type: 'object', additionalProperties: true },
                  policy: { type: 'object', additionalProperties: true },
                },
              },
            },
          },
        ],
      },
      AddressParseRequest: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 1 },
          countryCode: { type: 'string' },
        },
      },
      AddressParseResponse: {
        type: 'object',
        required: ['source', 'available', 'components'],
        properties: {
          source: { type: 'string', enum: ['libpostal', 'local-parser'] },
          available: { type: 'boolean' },
          canonical: { type: 'object', additionalProperties: true },
          components: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                value: { type: 'string' },
              },
            },
          },
        },
        additionalProperties: true,
      },
      AddressStandardLibraryResolveRequest: {
        type: 'object',
        properties: {
          countryCode: { type: 'string' },
          targetCountries: {
            type: 'array',
            items: { type: 'string' },
          },
          hasPostcode: { type: 'boolean' },
          hasCoordinates: { type: 'boolean' },
          addressText: {
            type: 'string',
            description: 'Optional free-form address text. The standard-library endpoint only plans resolver selection and does not persist this field.',
          },
          sourceLanguage: { type: 'string' },
          targetLanguage: { type: 'string' },
          hasCustomTranslator: { type: 'boolean' },
          needsNaturalGeographyContext: { type: 'boolean' },
          sparseOrRemoteArea: { type: 'boolean' },
          allowCredentialedSources: { type: 'boolean' },
          includeGlobalFallbacks: { type: 'boolean' },
          standardLibrary: {
            type: 'object',
            additionalProperties: true,
            description: 'Optional resolver hints; plaintext secrets are not accepted.',
          },
        },
        additionalProperties: true,
      },
      AgidResultAddressStandardLibraryResolution: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                required: [
                  'modelVersion',
                  'freeOnly',
                  'canParseLocally',
                  'requiresNetworkForStrongVerification',
                  'primary',
                  'fallback',
                  'background',
                  'disabled',
                ],
                properties: {
                  modelVersion: { type: 'string' },
                  countryCode: { type: ['string', 'null'] },
                  targetCountries: { type: 'array', items: { type: 'string' } },
                  freeOnly: { type: 'boolean' },
                  canParseLocally: { type: 'boolean' },
                  canResolveOffline: { type: 'boolean' },
                  requiresNetworkForStrongVerification: { type: 'boolean' },
                  requestedCapabilities: { type: 'array', items: { type: 'string' } },
                  primary: { type: 'array', items: { type: 'object', additionalProperties: true } },
                  fallback: { type: 'array', items: { type: 'object', additionalProperties: true } },
                  background: { type: 'array', items: { type: 'object', additionalProperties: true } },
                  disabled: { type: 'array', items: { type: 'object', additionalProperties: true } },
                  warnings: { type: 'array', items: { type: 'string' } },
                  nextActions: { type: 'array', items: { type: 'string' } },
                  dataLoadPlan: { type: 'object', additionalProperties: true },
                },
                additionalProperties: true,
              },
            },
          },
        ],
      },
      AddressVerifyRequest: {
        type: 'object',
        properties: {
          countryCode: {
            type: 'string',
            description: 'Country selected by the caller. Must be inside targetCountries when targetCountries is supplied.',
          },
          targetCountries: {
            type: 'array',
            items: { type: 'string' },
            description: 'Country allow-list for the verification run, for example ["JP"] or ["US","CA"].',
          },
          scope: {
            type: 'string',
            enum: ['postal', 'address'],
            default: 'address',
          },
          postalCode: { type: 'string' },
          postcode: { type: 'string' },
          addressText: { type: 'string' },
          address: {
            type: 'object',
            additionalProperties: true,
            description: 'Canonical address parts such as country_code, state, city, road, house_number, and postcode.',
          },
          format: {
            type: 'object',
            additionalProperties: true,
            description: 'Optional country address-format metadata supplied by a client or SDK data pack.',
          },
          postalEvidence: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
            description: 'Optional postcode lookup candidates from trusted sources. Matching evidence can upgrade a valid format to verified.',
          },
          referenceRecords: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
            description: 'Optional address reference records such as OpenAddresses/OpenAddresses-like rows. Strong matches can verify a street or house-level address.',
          },
          sources: {
            type: 'array',
            items: { type: 'string' },
          },
          standardLibrary: {
            type: 'object',
            additionalProperties: true,
            description: 'Optional standard-library resolver hints, such as sourceLanguage, targetLanguage, hasCoordinates, needsNaturalGeographyContext, or sparseOrRemoteArea.',
          },
        },
        additionalProperties: true,
      },
      AgidResultAddressVerification: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                required: ['engineVersion', 'status', 'scope', 'score', 'country', 'postal', 'canonicalAddress'],
                properties: {
                  engineVersion: { type: 'string' },
                  status: {
                    type: 'string',
                    enum: ['verified', 'partial', 'unresolved', 'unsupported_country', 'country_mismatch'],
                  },
                  scope: { type: 'string', enum: ['postal', 'address'] },
                  score: { type: 'number', minimum: 0, maximum: 1 },
                  country: { type: 'object', additionalProperties: true },
                  postal: { type: 'object', additionalProperties: true },
                  evidence: { type: 'object', additionalProperties: true },
                  quality: {
                    type: 'object',
                    additionalProperties: true,
                    description: 'Free/open-source verification quality summary, including evidence grade, depth, readiness, and whether paid API parity is claimed for the supplied evidence.',
                  },
                  canonicalAddress: { type: 'object', additionalProperties: true },
                  standardLibrary: {
                    type: 'object',
                    additionalProperties: true,
                    description: 'Standard-library resolver plan selected for this verification run.',
                  },
                  warnings: { type: 'array', items: { type: 'string' } },
                  nextActions: { type: 'array', items: { type: 'string' } },
                  audit: { type: 'array', items: { type: 'object', additionalProperties: true } },
                },
                additionalProperties: true,
              },
            },
          },
        ],
      },
      AgidResultAddressVerificationCapabilities: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                required: [
                  'modelVersion',
                  'engine',
                  'freeOnly',
                  'addressFormatCountries',
                  'addressFormatFiles',
                  'sourceStrategy',
                  'nonGoals',
                ],
                properties: {
                  modelVersion: { type: 'string' },
                  engine: { type: 'string' },
                  freeOnly: { type: 'boolean', const: true },
                  addressFormatCountries: { type: 'integer', minimum: 0 },
                  addressFormatFiles: { type: 'integer', minimum: 0 },
                  sourceStrategy: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  nonGoals: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                additionalProperties: true,
              },
            },
          },
        ],
      },
      CredentialIssuerTrustRecordInput: {
        type: 'object',
        required: ['issuerId', 'issuerDid', 'status'],
        properties: {
          issuerId: { type: 'string', minLength: 1 },
          issuerDid: { type: 'string', minLength: 1 },
          status: {
            type: 'string',
            enum: ['trusted', 'probationary', 'suspended', 'revoked'],
          },
          trustLevel: {
            type: 'string',
            enum: ['root', 'official', 'verified-provider', 'community'],
            default: 'verified-provider',
          },
          credentialTypes: { type: 'array', items: { type: 'string' } },
          layers: { type: 'array', items: { type: 'string', enum: ['AGID', 'AOID'] } },
          countryCodes: { type: 'array', items: { type: 'string' } },
          regionCodes: { type: 'array', items: { type: 'string' } },
          schemaHashes: { type: 'array', items: { type: 'string' } },
          policyVersions: { type: 'array', items: { type: 'string' } },
          keyCommitments: {
            type: 'array',
            items: { type: 'string' },
            description: 'Public key commitments or public attestation identifiers, never signing key material.',
          },
          publicAttestationRefs: { type: 'array', items: { type: 'string' } },
          trustScore: { type: 'number', minimum: 0, maximum: 1 },
          validFrom: { type: 'string', format: 'date-time' },
          validUntil: { type: 'string', format: 'date-time' },
          sourceIds: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      CredentialIssuerTrustPolicy: {
        type: 'object',
        properties: {
          allowedStatuses: {
            type: 'array',
            items: { type: 'string', enum: ['trusted', 'probationary', 'suspended', 'revoked'] },
          },
          minimumTrustScore: { type: 'number', minimum: 0, maximum: 1 },
          requireValidWindow: { type: 'boolean' },
          requireCredentialScopeMatch: { type: 'boolean' },
        },
        additionalProperties: false,
      },
      CredentialIssuerTrustRegistrySnapshotRequest: {
        type: 'object',
        required: ['registryId', 'registryVersion', 'issuers'],
        properties: {
          registryId: { type: 'string', minLength: 1 },
          registryVersion: { type: 'string', minLength: 1 },
          issuers: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#/components/schemas/CredentialIssuerTrustRecordInput' },
          },
          trustPolicy: { $ref: '#/components/schemas/CredentialIssuerTrustPolicy' },
          now: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      CredentialIssuerTrustRegistrySnapshot: {
        type: 'object',
        required: ['modelVersion', 'registryId', 'registryVersion', 'registryRoot', 'trustPolicyHash', 'issuerCounts', 'anchorable'],
        properties: {
          modelVersion: { type: 'string' },
          algorithm: { type: 'string' },
          registryId: { type: 'string' },
          registryVersion: { type: 'string' },
          registryRoot: { type: 'string', pattern: '^[a-f0-9]{64}$' },
          trustPolicy: { $ref: '#/components/schemas/CredentialIssuerTrustPolicy' },
          trustPolicyHash: { type: 'string', pattern: '^[a-f0-9]{64}$' },
          generatedAt: { type: 'string', format: 'date-time' },
          issuerCounts: {
            type: 'object',
            properties: {
              total: { type: 'integer', minimum: 0 },
              trusted: { type: 'integer', minimum: 0 },
              probationary: { type: 'integer', minimum: 0 },
              suspended: { type: 'integer', minimum: 0 },
              revoked: { type: 'integer', minimum: 0 },
            },
            additionalProperties: false,
          },
          issuerRecords: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
          sourceIds: { type: 'array', items: { type: 'string' } },
          anchorable: { type: 'boolean' },
          chainCommitment: { type: 'object', additionalProperties: true },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      CredentialIssuerTrustEvaluateRequest: {
        type: 'object',
        required: ['credential', 'trustRegistry'],
        properties: {
          credential: {
            type: 'object',
            additionalProperties: true,
            description: 'Address credential envelope or minimal claim/signature pair used for issuer-scope trust checks.',
          },
          trustRegistry: { $ref: '#/components/schemas/CredentialIssuerTrustRegistrySnapshot' },
          now: { type: 'string', format: 'date-time' },
          credentialType: { type: 'string' },
          requiredLayer: { type: 'string', enum: ['AGID', 'AOID'] },
          requiredCountryCode: { type: 'string' },
          requiredSchemaHash: { type: 'string' },
          minimumTrustScore: { type: 'number', minimum: 0, maximum: 1 },
          allowedIssuerStatuses: {
            type: 'array',
            items: { type: 'string', enum: ['trusted', 'probationary', 'suspended', 'revoked'] },
          },
          trustedRegistryRoots: { type: 'array', items: { type: 'string' } },
          maxRegistryAgeSeconds: { type: 'number', minimum: 0 },
        },
        additionalProperties: false,
      },
      CredentialIssuerTrustVerifyCredentialRequest: {
        type: 'object',
        required: ['credential', 'trustRegistry'],
        properties: {
          credential: {
            type: 'object',
            additionalProperties: true,
            description: 'Address credential envelope to check with server-managed issuer-key configuration.',
          },
          trustRegistry: { $ref: '#/components/schemas/CredentialIssuerTrustRegistrySnapshot' },
          now: { type: 'string', format: 'date-time' },
          expectedLayer: { type: 'string', enum: ['AGID', 'AOID'] },
          minimumCredentialScore: { type: 'number', minimum: 0, maximum: 1 },
          allowedCredentialStatuses: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['verified', 'partial', 'unresolved', 'unsupported_country', 'country_mismatch'],
            },
          },
          requiredCountryCode: { type: 'string' },
          requiredSchemaHash: { type: 'string' },
          minimumTrustScore: { type: 'number', minimum: 0, maximum: 1 },
          allowedIssuerStatuses: {
            type: 'array',
            items: { type: 'string', enum: ['trusted', 'probationary', 'suspended', 'revoked'] },
          },
          trustedRegistryRoots: { type: 'array', items: { type: 'string' } },
          maxRegistryAgeSeconds: { type: 'number', minimum: 0 },
        },
        additionalProperties: false,
      },
      CredentialIssuerTrustEvaluation: {
        type: 'object',
        required: ['modelVersion', 'trusted', 'issuer', 'registryRootTrusted', 'errors', 'warnings'],
        properties: {
          modelVersion: { type: 'string' },
          trusted: { type: 'boolean' },
          issuer: { type: ['object', 'null'], additionalProperties: true },
          registryRootTrusted: { type: 'boolean' },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      CredentialIssuerTrustVerification: {
        type: 'object',
        required: ['modelVersion', 'valid', 'trust', 'errors', 'warnings'],
        properties: {
          modelVersion: { type: 'string' },
          valid: { type: 'boolean' },
          credential: { type: 'object', additionalProperties: true },
          trust: { $ref: '#/components/schemas/CredentialIssuerTrustEvaluation' },
          signatureVerification: { type: 'object', additionalProperties: true },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      AgidResultCredentialIssuerTrustRegistrySnapshot: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/CredentialIssuerTrustRegistrySnapshot' },
            },
          },
        ],
      },
      AgidResultCredentialIssuerTrustEvaluation: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/CredentialIssuerTrustEvaluation' },
            },
          },
        ],
      },
      AgidResultCredentialIssuerTrustVerification: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/CredentialIssuerTrustVerification' },
            },
          },
        ],
      },
      ZkProofBundleRegisterRequest: {
        type: 'object',
        required: ['proofs'],
        properties: {
          proofs: {
            type: 'array',
            minItems: 1,
            items: { type: 'object', additionalProperties: true },
            description: 'Public proof envelopes used for compatibility and lifecycle checks.',
          },
          scope: { type: 'string' },
          audience: { type: 'string' },
          operationId: { type: 'string' },
          expectedChallengeHash: { type: 'string' },
          expectedChallengeHashesByVersion: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          now: { type: 'string', format: 'date-time' },
          metadata: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      ZkProofBundleVerifyRequest: {
        type: 'object',
        properties: {
          now: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      ZkProofBundleRevokeRequest: {
        type: 'object',
        required: ['reason'],
        properties: {
          reason: { type: 'string', minLength: 1 },
          revokedAt: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      ZkProofBundleRegistration: {
        type: 'object',
        required: ['registryVersion', 'status', 'bundleId', 'record', 'errors', 'warnings'],
        properties: {
          registryVersion: { type: 'string' },
          status: { type: 'string', enum: ['registered', 'already_registered', 'rejected'] },
          bundleId: { type: ['string', 'null'] },
          record: { type: ['object', 'null'], additionalProperties: true },
          compatibility: { type: 'object', additionalProperties: true },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      ZkProofBundleVerification: {
        type: 'object',
        required: ['registryVersion', 'status', 'valid', 'bundleId', 'record', 'errors', 'warnings'],
        properties: {
          registryVersion: { type: 'string' },
          status: { type: 'string', enum: ['valid', 'invalid', 'missing'] },
          valid: { type: 'boolean' },
          bundleId: { type: 'string' },
          record: { type: ['object', 'null'], additionalProperties: true },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      ZkProofBundleStats: {
        type: 'object',
        required: ['registryVersion', 'totalBundles', 'activeBundles', 'revokedBundles'],
        properties: {
          registryVersion: { type: 'string' },
          totalBundles: { type: 'integer', minimum: 0 },
          activeBundles: { type: 'integer', minimum: 0 },
          revokedBundles: { type: 'integer', minimum: 0 },
          singleUseNullifiers: { type: 'integer', minimum: 0 },
          bucketNullifiers: { type: 'integer', minimum: 0 },
        },
        additionalProperties: false,
      },
      AgidResultZkProofBundleRegistration: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/ZkProofBundleRegistration' },
            },
          },
        ],
      },
      AgidResultZkProofBundleVerification: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/ZkProofBundleVerification' },
            },
          },
        ],
      },
      AgidResultZkProofBundleStats: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/ZkProofBundleStats' },
            },
          },
        ],
      },
      ManagedZkProofJobRequest: {
        type: 'object',
        description: 'Public proof job material only. Submit public inputs, commitments, registry roots, circuit refs, verifier key refs, and object refs. Do not submit witness bodies, proof secrets, raw AGID/AOID values, direct location material, proving keys, proof codes, or holder secrets.',
        properties: {
          requestedAt: { type: 'string', format: 'date-time' },
          tenantId: { type: 'string' },
          requestId: { type: 'string' },
          proofFamily: { type: 'string', enum: [...MANAGED_ZK_PROOF_FAMILIES] },
          backend: { type: 'string', enum: [...MANAGED_ZK_BACKENDS] },
          deploymentProfile: { type: 'string', enum: [...MANAGED_ZK_DEPLOYMENT_PROFILES] },
          witnessMode: { type: 'string', enum: [...MANAGED_ZK_WITNESS_MODES] },
          confidentialCompute: { type: 'boolean' },
          publicInputs: { type: 'object', additionalProperties: true },
          commitments: { type: 'object', additionalProperties: true },
          registryRoots: { type: 'object', additionalProperties: true },
          policy: { type: 'object', additionalProperties: true },
          circuit: {
            type: 'object',
            properties: {
              circuitId: { type: 'string' },
              verifierKeyRef: { type: 'string' },
              vkRef: { type: 'string' },
              verificationKeyRef: { type: 'string' },
            },
            additionalProperties: false,
          },
          artifactRefs: {
            type: 'object',
            description: 'Object references only, such as encryptedWitnessRef, proofArtifactRef, publicSignalsRef, or verifierKeyRef. Inline witness/proof-secret bodies are rejected by implementation policy.',
            additionalProperties: { type: 'string' },
          },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'emergency'] },
          maxRuntimeSeconds: { type: 'integer', minimum: 1, maximum: 3600 },
          ttlSeconds: { type: 'integer', minimum: 30, maximum: 86400 },
          retryAttempts: { type: 'integer', minimum: 0, maximum: 8 },
          artifactRetentionSeconds: { type: 'integer', minimum: 0, maximum: 604800 },
        },
        additionalProperties: false,
      },
      ManagedZkProofJob: {
        type: 'object',
        required: ['modelVersion', 'accepted', 'status', 'jobId', 'proofFamily', 'backend', 'deploymentProfile', 'witnessMode', 'publicStatement', 'queue', 'artifactPolicy', 'execution', 'security', 'warnings', 'errors', 'jobRoot'],
        properties: {
          modelVersion: { type: 'string', const: MANAGED_ZK_PROOF_SERVER_VERSION },
          accepted: { type: 'boolean' },
          status: { type: 'string', enum: ['queued', 'requires-client-proof', 'requires-private-deployment', 'rejected'] },
          jobId: { type: 'string' },
          requestedAt: { type: 'string', format: 'date-time' },
          tenantId: { type: 'string' },
          requestId: { type: 'string' },
          proofFamily: { type: 'string', enum: [...MANAGED_ZK_PROOF_FAMILIES] },
          backend: { type: 'string', enum: [...MANAGED_ZK_BACKENDS] },
          deploymentProfile: { type: 'string', enum: [...MANAGED_ZK_DEPLOYMENT_PROFILES] },
          witnessMode: { type: 'string', enum: [...MANAGED_ZK_WITNESS_MODES] },
          publicStatement: {
            type: 'object',
            properties: {
              publicInputs: { type: 'object', additionalProperties: true },
              commitments: { type: 'object', additionalProperties: true },
              registryRoots: { type: 'object', additionalProperties: true },
              policyHash: { type: 'string' },
              circuitId: { type: 'string' },
              verifierKeyRef: { type: 'string' },
            },
            additionalProperties: false,
          },
          queue: { type: 'object', additionalProperties: true },
          artifactPolicy: {
            type: 'object',
            properties: {
              storeProof: { type: 'boolean' },
              storePublicInputs: { type: 'boolean' },
              storeWitness: { type: 'boolean', const: false },
              storeRawAddress: { type: 'boolean', const: false },
              storeRawAgid: { type: 'boolean', const: false },
              storeRawAoid: { type: 'boolean', const: false },
              artifactRetentionSeconds: { type: 'integer', minimum: 0 },
            },
            additionalProperties: false,
          },
          execution: { type: 'object', additionalProperties: true },
          security: { type: 'object', additionalProperties: true },
          warnings: { type: 'array', items: { type: 'string' } },
          errors: { type: 'array', items: { type: 'string' } },
          jobRoot: { type: 'string' },
        },
        additionalProperties: false,
      },
      ManagedZkProofServerCapabilities: {
        type: 'object',
        required: ['modelVersion', 'proofFamilies', 'backends', 'deploymentProfiles', 'witnessModes', 'privacy', 'requiredControls'],
        properties: {
          modelVersion: { type: 'string', const: MANAGED_ZK_PROOF_SERVER_VERSION },
          proofFamilies: { type: 'array', items: { type: 'string', enum: [...MANAGED_ZK_PROOF_FAMILIES] } },
          backends: { type: 'array', items: { type: 'string', enum: [...MANAGED_ZK_BACKENDS] } },
          deploymentProfiles: { type: 'array', items: { type: 'string', enum: [...MANAGED_ZK_DEPLOYMENT_PROFILES] } },
          witnessModes: { type: 'array', items: { type: 'string', enum: [...MANAGED_ZK_WITNESS_MODES] } },
          recommendedDefault: { type: 'object', additionalProperties: true },
          privacy: { type: 'object', additionalProperties: true },
          runtime: { type: 'object', additionalProperties: true },
          requiredControls: { type: 'array', items: { type: 'string' } },
          privateDeploymentUseCases: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      AgidResultManagedZkProofServerCapabilities: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/ManagedZkProofServerCapabilities' },
            },
          },
        ],
      },
      AgidResultManagedZkProofJob: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/ManagedZkProofJob' },
            },
          },
        ],
      },
      PrivateDeploymentPlanRequest: {
        type: 'object',
        description: 'Public deployment requirements only. Do not submit plaintext addresses, raw AGID/AOID values, witness bodies, proof secrets, API keys, recipient data, private keys, or direct location material.',
        properties: {
          requestedAt: { type: 'string', format: 'date-time' },
          tenantId: { type: 'string' },
          sector: { type: 'string', enum: [...PRIVATE_DEPLOYMENT_SECTORS] },
          networkMode: { type: 'string', enum: [...PRIVATE_DEPLOYMENT_NETWORK_MODES] },
          countryCodes: { type: 'array', items: { type: 'string', minLength: 2, maxLength: 12 } },
          regionCodes: { type: 'array', items: { type: 'string' } },
          dataResidencyCountryCode: { type: 'string', minLength: 2, maxLength: 12 },
          expectedDailyEvents: { type: 'integer', minimum: 0 },
          peakEventsPerSecond: { type: 'integer', minimum: 0 },
          posTerminals: { type: 'integer', minimum: 0 },
          offlineSites: { type: 'integer', minimum: 0 },
          highRiskMode: { type: 'boolean' },
          emergencyMode: { type: 'boolean' },
          requiresZk: { type: 'boolean' },
          requiresEthereum: { type: 'boolean' },
          requiresCarrierIntegration: { type: 'boolean' },
          requiresPublicDashboard: { type: 'boolean' },
          requiresCrossOrgTrust: { type: 'boolean' },
          confidentialCompute: { type: 'boolean' },
          witnessMode: { type: 'string', enum: [...MANAGED_ZK_WITNESS_MODES] },
          backend: { type: 'string', enum: [...MANAGED_ZK_BACKENDS] },
          storageModes: { type: 'array', items: { type: 'string', enum: ['sqlite', 'postgres', 'redis', 'mongodb', 'object-storage'] } },
          retentionDays: { type: 'integer', minimum: 0, maximum: 3650 },
        },
        additionalProperties: false,
      },
      PrivateDeploymentComponent: {
        type: 'object',
        required: ['id', 'required', 'owner', 'purpose', 'storesRawAddress', 'dependencies', 'envVars'],
        properties: {
          id: { type: 'string', enum: [...PRIVATE_DEPLOYMENT_COMPONENT_IDS] },
          required: { type: 'boolean' },
          owner: { type: 'string', enum: ['core-platform', 'organization', 'field-ops', 'security', 'operations'] },
          purpose: { type: 'string' },
          storesRawAddress: { type: 'boolean', const: false },
          dependencies: { type: 'array', items: { type: 'string', enum: [...PRIVATE_DEPLOYMENT_COMPONENT_IDS] } },
          envVars: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      PrivateDeploymentPlan: {
        type: 'object',
        required: ['modelVersion', 'accepted', 'status', 'sector', 'deploymentProfile', 'networkMode', 'runtimeMode', 'scope', 'components', 'storage', 'zk', 'operations', 'security', 'warnings', 'errors', 'planRoot'],
        properties: {
          modelVersion: { type: 'string', const: PRIVATE_DEPLOYMENT_MODEL_VERSION },
          accepted: { type: 'boolean' },
          status: { type: 'string', enum: ['ready', 'attention', 'blocked'] },
          requestedAt: { type: 'string', format: 'date-time' },
          tenantId: { type: 'string' },
          sector: { type: 'string', enum: [...PRIVATE_DEPLOYMENT_SECTORS] },
          deploymentProfile: { type: 'string', enum: [...MANAGED_ZK_DEPLOYMENT_PROFILES] },
          networkMode: { type: 'string', enum: [...PRIVATE_DEPLOYMENT_NETWORK_MODES] },
          runtimeMode: { type: 'string', enum: ['mode-1-server-registry', 'mode-2-zk-only', 'mode-3-ethereum-registry', 'mode-4-full-zk-ethereum'] },
          scope: {
            type: 'object',
            required: ['countryCodes', 'regionCodes', 'dataResidencyCountryCode', 'expectedDailyEvents', 'peakEventsPerSecond', 'posTerminals', 'offlineSites'],
            properties: {
              countryCodes: { type: 'array', items: { type: 'string' } },
              regionCodes: { type: 'array', items: { type: 'string' } },
              dataResidencyCountryCode: { type: ['string', 'null'] },
              expectedDailyEvents: { type: 'integer' },
              peakEventsPerSecond: { type: 'integer' },
              posTerminals: { type: 'integer' },
              offlineSites: { type: 'integer' },
            },
            additionalProperties: false,
          },
          components: { type: 'array', items: { $ref: '#/components/schemas/PrivateDeploymentComponent' } },
          storage: {
            type: 'object',
            properties: {
              primaryLedger: { type: 'string', enum: ['sqlite', 'postgres', 'redis', 'mongodb', 'object-storage'] },
              hotCache: { type: ['string', 'null'], enum: ['redis', null] },
              documentEvidence: { type: ['string', 'null'], enum: ['mongodb', null] },
              offlineStore: { type: ['string', 'null'], enum: ['sqlite', null] },
              archive: { type: 'string', enum: ['object-storage'] },
              requiredEnvVars: { type: 'array', items: { type: 'string' } },
              forbiddenStores: { type: 'array', items: { type: 'string' } },
            },
            additionalProperties: false,
          },
          zk: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              backend: { type: 'string', enum: [...MANAGED_ZK_BACKENDS] },
              witnessMode: { type: 'string', enum: [...MANAGED_ZK_WITNESS_MODES] },
              deploymentProfile: { type: 'string', enum: [...MANAGED_ZK_DEPLOYMENT_PROFILES] },
              proofFamilies: { type: 'array', items: { type: 'string', enum: [...MANAGED_ZK_PROOF_FAMILIES] } },
              confidentialComputeRecommended: { type: 'boolean' },
              serverHeldWitnessAllowed: { type: 'boolean', const: false },
              publicJobMaterialOnly: { type: 'boolean', const: true },
            },
            additionalProperties: false,
          },
          operations: {
            type: 'object',
            properties: {
              signedWebhooksRequired: { type: 'boolean', const: true },
              mTLSRecommended: { type: 'boolean' },
              offlineSyncRequired: { type: 'boolean' },
              terminalFleetRequired: { type: 'boolean' },
              auditRetentionDays: { type: 'integer' },
              rawLogRetentionDays: { type: 'integer', const: 0 },
              launchGates: { type: 'array', items: { type: 'string' } },
            },
            additionalProperties: false,
          },
          security: {
            type: 'object',
            properties: {
              privateMaterialAccepted: { type: 'boolean', const: false },
              rawAddressStorage: { type: 'boolean', const: false },
              rawAgidStorage: { type: 'boolean', const: false },
              rawAoidStorage: { type: 'boolean', const: false },
              rawWitnessStorage: { type: 'boolean', const: false },
              publicDashboardAllowed: { type: 'boolean' },
              controls: { type: 'array', items: { type: 'string' } },
            },
            additionalProperties: false,
          },
          warnings: { type: 'array', items: { type: 'string' } },
          errors: { type: 'array', items: { type: 'string' } },
          planRoot: { type: 'string' },
        },
        additionalProperties: false,
      },
      PrivateDeploymentCapabilities: {
        type: 'object',
        required: ['modelVersion', 'sectors', 'networkModes', 'componentIds', 'recommendedProfiles', 'privacy', 'supports'],
        properties: {
          modelVersion: { type: 'string', const: PRIVATE_DEPLOYMENT_MODEL_VERSION },
          sectors: { type: 'array', items: { type: 'string', enum: [...PRIVATE_DEPLOYMENT_SECTORS] } },
          networkModes: { type: 'array', items: { type: 'string', enum: [...PRIVATE_DEPLOYMENT_NETWORK_MODES] } },
          componentIds: { type: 'array', items: { type: 'string', enum: [...PRIVATE_DEPLOYMENT_COMPONENT_IDS] } },
          recommendedProfiles: { type: 'object', additionalProperties: true },
          privacy: { type: 'object', additionalProperties: true },
          supports: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AgidResultPrivateDeploymentCapabilities: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/PrivateDeploymentCapabilities' },
            },
          },
        ],
      },
      AgidResultPrivateDeploymentPlan: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/PrivateDeploymentPlan' },
            },
          },
        ],
      },
      RevocationFreshnessAnchorRequest: {
        type: 'object',
        required: ['registry', 'issuerDid', 'credentialType', 'schemaHash'],
        properties: {
          registry: {
            type: 'object',
            required: ['id', 'version', 'checkedAt', 'freshUntil'],
            properties: {
              id: { type: 'string' },
              version: { type: 'string' },
              checkedAt: { type: 'string', format: 'date-time' },
              freshUntil: { type: 'string', format: 'date-time' },
              sourceIds: { type: 'array', items: { type: 'string' } },
            },
            additionalProperties: true,
          },
          issuerDid: { type: 'string' },
          credentialType: { type: 'string' },
          schemaHash: { type: 'string' },
          freshnessPolicy: {
            type: 'object',
            properties: {
              maxFreshnessAgeSeconds: { type: 'number', minimum: 1 },
              statusListSourcePolicyHash: { type: 'string' },
            },
            additionalProperties: false,
          },
          now: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      RevocationFreshnessVerifyRequest: {
        type: 'object',
        required: ['anchor'],
        properties: {
          envelope: { type: 'object', additionalProperties: true },
          proof: { type: 'object', additionalProperties: true },
          anchor: { type: 'object', additionalProperties: true },
          now: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      RevocationFreshnessAnchor: {
        type: 'object',
        required: ['modelVersion', 'anchorId', 'revocationRoot', 'freshnessRoot', 'anchorable'],
        properties: {
          modelVersion: { type: 'string' },
          anchorId: { type: 'string' },
          registryId: { type: 'string' },
          registryVersion: { type: 'string' },
          issuerDid: { type: 'string' },
          credentialType: { type: 'string' },
          schemaHash: { type: 'string' },
          revocationRoot: { type: 'string' },
          freshnessRoot: { type: 'string' },
          freshnessPolicyHash: { type: 'string' },
          checkedAt: { type: 'string', format: 'date-time' },
          freshUntil: { type: 'string', format: 'date-time' },
          anchorable: { type: 'boolean' },
          chainCommitment: { type: 'object', additionalProperties: true },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: true,
      },
      RevocationFreshnessVerification: {
        type: 'object',
        required: ['modelVersion', 'valid', 'rootMatched', 'stale', 'errors', 'warnings'],
        properties: {
          modelVersion: { type: 'string' },
          valid: { type: 'boolean' },
          rootMatched: { type: 'boolean' },
          stale: { type: 'boolean' },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      AgidResultRevocationFreshnessAnchor: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/RevocationFreshnessAnchor' },
            },
          },
        ],
      },
      AgidResultRevocationFreshnessVerification: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/RevocationFreshnessVerification' },
            },
          },
        ],
      },
      PolkadotCommitmentRequest: {
        type: 'object',
        required: ['stageId', 'entityType', 'entityId', 'publicPayload'],
        properties: {
          stageId: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          publicPayload: { type: 'object', additionalProperties: true },
          salt: { type: 'string' },
        },
        additionalProperties: false,
      },
      PolkadotAnchorRequest: {
        type: 'object',
        required: ['commitment'],
        properties: {
          commitment: { type: 'object', additionalProperties: true },
          adapterOptions: {
            type: 'object',
            properties: {
              networkId: { type: 'string' },
              relayChain: { type: 'string', enum: ['polkadot', 'kusama', 'rococo', 'local'] },
              parachainId: { type: 'integer' },
              genesisHash: { type: 'string' },
              finalityDepth: { type: 'integer', minimum: 1 },
              initialBlockNumber: { type: 'integer', minimum: 1 },
            },
            additionalProperties: true,
          },
          observedAt: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      PolkadotFinalityRequest: {
        type: 'object',
        properties: {
          networkId: { type: 'string' },
          adapterOptions: { type: 'object', additionalProperties: true },
          finalizedBlockNumber: { type: 'integer', minimum: 0 },
          requiredConfirmations: { type: 'integer', minimum: 1 },
          observedAt: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      PolkadotCommitmentResponse: {
        type: 'object',
        required: ['commitment', 'extrinsicPlan'],
        properties: {
          commitment: { type: 'object', additionalProperties: true },
          extrinsicPlan: { type: 'object', additionalProperties: true },
        },
        additionalProperties: false,
      },
      AgidResultPolkadotStages: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          },
        ],
      },
      AgidResultPolkadotCommitment: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/PolkadotCommitmentResponse' },
            },
          },
        ],
      },
      AgidResultPolkadotAnchor: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { type: 'object', additionalProperties: true },
            },
          },
        ],
      },
      AgidResultPolkadotCommitmentRecord: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { type: 'object', additionalProperties: true },
            },
          },
        ],
      },
      AgidResultPolkadotFinality: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { type: 'object', additionalProperties: true },
            },
          },
        ],
      },
      AmnResolutionRequest: {
        type: 'object',
        required: ['inputAddress', 'candidates'],
        properties: {
          inputAddress: { type: 'string', minLength: 1 },
          candidates: {
            type: 'array',
            minItems: 1,
            items: { type: 'object', additionalProperties: true },
          },
          context: { type: 'object', additionalProperties: true },
          policy: {
            type: 'object',
            properties: {
              policyVersion: { type: 'string' },
              resolverVersion: { type: 'string' },
              purpose: { type: 'string' },
              qualityThreshold: { type: 'number', minimum: 0, maximum: 1 },
              unresolvedPolicy: { type: 'string' },
              privacyMode: { type: 'string' },
            },
            additionalProperties: false,
          },
          evidence: {
            type: 'array',
            items: {
              type: 'object',
              required: ['sourceId', 'evidenceType', 'subjectCommitment'],
              properties: {
                sourceId: { type: 'string' },
                evidenceType: { type: 'string' },
                subjectCommitment: { type: 'string' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                observedAt: { type: 'string', format: 'date-time' },
              },
              additionalProperties: false,
            },
          },
          historyUpdate: {
            type: 'object',
            properties: {
              previousHistoryRoot: { type: 'string' },
              nextHistoryRoot: { type: 'string' },
              eventCount: { type: 'integer', minimum: 0 },
              updatedAt: { type: 'string', format: 'date-time' },
            },
            additionalProperties: false,
          },
          proofBundleId: { type: 'string' },
          issuedAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      AmnResolutionEnvelope: {
        type: 'object',
        required: ['claim'],
        properties: {
          claim: {
            type: 'object',
            required: [
              'modelVersion',
              'envelopeId',
              'policyHash',
              'evidenceRoot',
              'workflow',
              'resolution',
              'privacy',
            ],
            properties: {
              modelVersion: { type: 'string', const: AMN_MODEL_VERSION },
              envelopeId: { type: 'string', pattern: '^AMN-[0-9A-F]{24}$' },
              issuedAt: { type: 'string', format: 'date-time' },
              expiresAt: { type: 'string', format: 'date-time' },
              policyHash: { type: 'string', pattern: '^[a-f0-9]{64}$' },
              evidenceRoot: { type: 'string', pattern: '^[a-f0-9]{64}$' },
              proofBundleId: { type: 'string' },
              commitments: { type: 'object', additionalProperties: { type: 'string' } },
              evidenceCommitments: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              workflow: {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              resolution: { type: 'object', additionalProperties: true },
              privacy: { type: 'object', additionalProperties: true },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: false,
      },
      AmnRegistryVerificationRequest: {
        type: 'object',
        properties: {
          expectedPolicyHash: { type: 'string' },
          expectedEvidenceRoot: { type: 'string' },
          minimumConfidence: { type: 'number', minimum: 0, maximum: 1 },
          now: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      },
      AmnEnvelopeVerification: {
        type: 'object',
        required: ['registryVersion', 'envelopeId', 'valid', 'workflowPassed', 'privacyPreserved', 'errors', 'warnings'],
        properties: {
          registryVersion: { type: 'string', const: AMN_REGISTRY_VERSION },
          envelopeId: { type: 'string' },
          valid: { type: 'boolean' },
          workflowPassed: { type: 'boolean' },
          privacyPreserved: { type: 'boolean' },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      AmnRegistryStats: {
        type: 'object',
        required: ['registryVersion', 'totalEnvelopes', 'activeEnvelopes', 'rejectedEnvelopes'],
        properties: {
          registryVersion: { type: 'string', const: AMN_REGISTRY_VERSION },
          totalEnvelopes: { type: 'integer', minimum: 0 },
          activeEnvelopes: { type: 'integer', minimum: 0 },
          rejectedEnvelopes: { type: 'integer', minimum: 0 },
          rawEnvelopeStorage: { type: 'string' },
        },
        additionalProperties: false,
      },
      AgidResultAmnResolution: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  envelope: { $ref: '#/components/schemas/AmnResolutionEnvelope' },
                  registration: { type: 'object', additionalProperties: true },
                },
                additionalProperties: false,
              },
            },
          },
        ],
      },
      AgidResultAmnEnvelopeVerification: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AmnEnvelopeVerification' },
            },
          },
        ],
      },
      AgidResultAmnRegistryStats: {
        allOf: [
          { $ref: '#/components/schemas/AgidResultBase' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AmnRegistryStats' },
            },
          },
        ],
      },
      TranslateRequest: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          sourceLanguage: { type: 'string' },
          targetLanguage: { type: 'string' },
          countryCode: { type: 'string' },
        },
        additionalProperties: true,
      },
    },
  },
  'x-agid-standard': {
    specName: 'agid-spec',
    specVersion: '0.1.0',
    canonicalSpec: 'sdk/agid-spec/agid-spec.json',
    parityVectors: 'sdk/agid-spec/test-vectors.json',
    sdkParityRequired: ['encode', 'decode', 'cellBounds'],
    openApiContract: `${API_V1_BASE_PATH}/openapi.json`,
    licensePolicy: 'LICENSE_POLICY.md',
    dataLicensePolicy: 'DATA_LICENSES.md',
    dataLicenseDetails: 'docs/data-licenses.md',
    securityPolicy: 'docs/agid-security.md',
    softwareLicense: 'MIT',
    role: 'Independent standard contract for SDKs, APIs, data packs, and reference implementations.',
  },
  'x-agid-security': {
    profile: AGID_SECURITY_POLICY.id,
    layer: AGID_SECURITY_POLICY.layer,
    confidentiality: AGID_SECURITY_POLICY.confidentiality,
    integrityControls: AGID_SECURITY_POLICY.integrityControls,
    openSourceReleaseControls: AGID_SECURITY_POLICY.openSourceReleaseControls,
    publicAgidForbiddenFields: [
      'recipient',
      'phone',
      'unit-or-room',
      'private-delivery-instruction',
      'private-ownership-proof',
      'owner-key-id',
      'device-key-id',
      'opaque-encrypted-payload',
    ],
    releaseArtifactIntegrity: 'publish checksums or detached signatures for agid-spec, test vectors, OpenAPI, SDK packages, and data packs',
  },
  'x-agid-search-language': {
    layer: 'place-search-only',
    source: 'query-script-and-search-aliases',
    independentFrom: ['app-language', 'address-language'],
    providerHintParameter: 'accept_language',
    appliesTo: ['/osm-search', '/nominatim/search', '/photon'],
    purpose: 'Maximize multilingual place-name recall without changing UI language or address-display language settings.',
  },
  'x-agid-credential-issuer-trust': {
    modelVersion: CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION,
    publicChainSurface: 'trustRegistryRoot-and-trustPolicyHash-only',
    secretMaterialAcceptedByPublicApi: false,
    endpointOrder: [
      '/credential-issuers/trust-registry/snapshot',
      '/credential-issuers/trust-registry/evaluate',
      '/credential-issuers/trust-registry/verify-credential',
    ],
    serverManagedVerification: 'credential signature checks require a server-side issuer-key registry; public requests carry only credential and registry evidence',
    privacyBoundary: [
      'do-not-publish-signing-key-material',
      'do-not-publish-raw-holder-location',
      'do-not-publish-direct-contact-fields',
      'anchor-only-registry-root-policy-hash-and-counts',
    ],
  },
  'x-agid-proof-and-anchor-api': {
    zkProofBundleRegistryVersion: ZK_PROOF_BUNDLE_REGISTRY_VERSION,
    revocationFreshnessRootAnchorVersion: REVOCATION_FRESHNESS_ROOT_ANCHOR_VERSION,
    polkadotAdapterVersion: POLKADOT_ADAPTER_MODEL_VERSION,
    managedZkProofServerVersion: MANAGED_ZK_PROOF_SERVER_VERSION,
    publicProofMaterialOnly: true,
    privateAddressMaterialAccepted: false,
    endpointOrder: [
      '/zk/proof-bundles/register',
      '/zk/proof-bundles/{bundleId}/verify',
      '/zk/proof-bundles/{bundleId}/revoke',
      '/zk/managed-proof-server/capabilities',
      '/zk/managed-proof-server/jobs',
      '/revocation-freshness/anchor',
      '/revocation-freshness/verify',
      '/polkadot/commitment',
      '/polkadot/anchor',
      '/polkadot/commitments/{commitmentId}',
      '/polkadot/commitments/{commitmentId}/finality',
    ],
    publicationRule: 'proof-bundle-records-roots-policy-hashes-nullifier-hashes-and-chain-commitments-only',
  },
  'x-agid-managed-zk-proof-server': {
    modelVersion: MANAGED_ZK_PROOF_SERVER_VERSION,
    endpointOrder: [
      '/zk/managed-proof-server/capabilities',
      '/zk/managed-proof-server/jobs',
    ],
    proofFamilies: [...MANAGED_ZK_PROOF_FAMILIES],
    backends: [...MANAGED_ZK_BACKENDS],
    deploymentProfiles: [...MANAGED_ZK_DEPLOYMENT_PROFILES],
    witnessModes: [...MANAGED_ZK_WITNESS_MODES],
    recommendedWitnessMode: 'client-side-witness',
    privateMaterialAccepted: false,
    serverHeldWitnessAllowed: false,
    rawAddressAccepted: false,
    rawAgidAccepted: false,
    rawAoidAccepted: false,
    rawWitnessAccepted: false,
    role: 'Managed proof generation is a job orchestration and worker boundary, not a plaintext witness collection service.',
  },
  'x-agid-private-deployment': {
    modelVersion: PRIVATE_DEPLOYMENT_MODEL_VERSION,
    role: 'Private deployment planner for municipalities, NGOs, and carriers that need tenant-isolated resolver, registry, proof, terminal, revocation, nullifier, and audit infrastructure.',
    endpointOrder: [
      '/private-deployments/capabilities',
      '/private-deployments/plan',
    ],
    sectors: [...PRIVATE_DEPLOYMENT_SECTORS],
    networkModes: [...PRIVATE_DEPLOYMENT_NETWORK_MODES],
    componentIds: [...PRIVATE_DEPLOYMENT_COMPONENT_IDS],
    recommendedUse: {
      municipality: 'resident credentials, official issuer governance, private VPC, data residency, and public-service separation',
      ngo: 'offline-first humanitarian field operations, AGID-S high-risk mode, short retention, redacted audit archive, and deferred sync conflict review',
      carrier: 'terminal fleets, signed handoff receipts, webhook dispatch, nullifier replay prevention, Redis cache, and Postgres-backed durable ledger',
    },
    runtimeModes: [
      'mode-1-server-registry',
      'mode-2-zk-only',
      'mode-3-ethereum-registry',
      'mode-4-full-zk-ethereum',
    ],
    privateMaterialAccepted: false,
    rawAddressStorage: false,
    rawAgidStorage: false,
    rawAoidStorage: false,
    rawWitnessStorage: false,
    serverHeldWitnessAllowed: false,
    deploymentBoundary: 'tenant-owned-or-organization-controlled-infrastructure-with-redacted-audit-events-only',
    requiredControls: [
      'no-plaintext-address-or-aoid-storage',
      'signed-webhook-replay-protection',
      'revocation-and-freshness-checks-enabled',
      'domain-separated-commitments-and-nullifiers',
      'secret-manager-or-hsm-configured',
      'redacted-audit-log-review',
      'offline-conflict-review-for-field-sites',
    ],
    forbiddenPublicPayloads: [
      'plaintext-address',
      'recipient',
      'phone',
      'unit-or-room',
      'raw-agid',
      'raw-aoid',
      'raw-witness',
      'proof-code',
      'holder-secret',
      'private-key',
      'api-key',
      'raw-qr-payload',
    ],
  },
  'x-agid-amn': {
    modelVersion: AMN_MODEL_VERSION,
    registryVersion: AMN_REGISTRY_VERSION,
    privateAddressMaterialAccepted: false,
    chainSurface: 'commitments-policy-hashes-evidence-roots-proof-bundle-ids-only',
    endpointOrder: [
      '/amn/resolve',
      '/amn/registry/{envelopeId}/verify',
      '/amn/registry/stats',
    ],
    publicationRule: 'resolution envelopes expose ids, roots, hashes, public workflow gates, and opaque commitments only',
    hiddenFieldClasses: [
      'location-text-input',
      'candidate-material',
      'cluster-material',
      'private-contact-material',
      'exact-location-material',
    ],
    role: 'AMN is the bridge from AMT resolution to auditable public registry records and later ZK or chain anchoring.',
  },
  'x-agid-address-intent': {
    modelVersion: ADDRESS_INTENT_MODEL_VERSION,
    role: 'Stripe-style core workflow object for address registration, delivery eligibility, waybill issuance, AOID ownership checks, aid eligibility, identity checks, and customs support.',
    endpointOrder: [
      '/address-intents/capabilities',
      '/address-intents',
      '/address-intents/{intentId}',
      '/address-intents/{intentId}/update',
      '/address-intents/recent',
    ],
    statuses: [...ADDRESS_INTENT_STATUSES],
    purposes: [...ADDRESS_INTENT_PURPOSES],
    modes: [...ADDRESS_INTENT_MODES],
    nextActions: [...ADDRESS_INTENT_NEXT_ACTIONS],
    publicEvidenceOnly: true,
    privateMaterialAccepted: false,
    privacyBoundary: [
      'do-not-store-plaintext-address',
      'do-not-store-raw-agid',
      'do-not-store-raw-aoid',
      'do-not-store-recipient-proof-material',
      'store-evidence-source-status-confidence-and-safe-fingerprint-only',
    ],
    adapterBoundary: 'in-memory-development-store-replaceable-by-sqlite-postgres-redis-or-mongodb',
  },
  'x-agid-pos-acceptance': {
    modelVersion: POS_ACCEPTANCE_MODEL_VERSION,
    runtimePolicyVersion: POS_RUNTIME_POLICY_VERSION,
    endpointOrder: [
      '/pos/capabilities',
      '/pos/acceptance',
      '/pos/acceptance/recent',
    ],
    supportedChannels: ['qr', 'nfc', 'manual'],
    supportedPayloads: ['agid:address:*', 'agid:waybill:*', 'agid:nfc:*', 'AGIDS1-*', 'direct-public-AGID'],
    rawPayloadStorage: false,
    privateMaterialPersistence: false,
    receiptSurface: [
      'receipt-id',
      'channel',
      'terminal-id',
      'operator-id',
      'purpose',
      'amount-and-currency',
      'country-city-postcode',
      'redacted-agid-or-aoid-tail',
      'review-warnings',
    ],
    privacyBoundary: [
      'do-not-store-raw-qr-or-nfc-payload',
      'do-not-store-recipient-name',
      'do-not-store-phone-number',
      'do-not-store-street-room-or-exact-coordinate',
    ],
    role: 'POS acceptance lets retail, pickup, and delivery terminals accept AGID/AOID QR or NFC references while keeping receipts redacted.',
  },
  'x-agid-address-connect-terminal': {
    connectModelVersion: ADDRESS_CONNECT_MODEL_VERSION,
    terminalModelVersion: ADDRESS_TERMINAL_MODEL_VERSION,
    connectRole: 'Stripe Connect-style organization trust, endpoint discovery, webhook, registry, and API-key-reference layer for issuers, carriers, municipalities, NGOs, EC, warehouses, POS providers, customs, and auditors.',
    terminalRole: 'Stripe Terminal-style POS fleet and device operation layer for QR, NFC, barcode, printer, cash drawer, electronic measuring instrument, registry sync, offline queue, staff permissions, and reverification reports.',
    endpointOrder: [
      '/address-connect/capabilities',
      '/address-connect/registry',
      '/address-connect/discover',
      '/address-connect/operations/requirements',
      '/address-connect/operations/report',
      '/address-scale/capabilities',
      '/address-scale/topology',
      '/address-terminal/capabilities',
      '/address-terminal/fleet',
    ],
    organizationMetadataOnly: true,
    personalAddressStorageAllowed: false,
    rawCredentialOrApiSecretAccepted: false,
    terminalRawPayloadStorage: false,
    addressConnectRoles: [...ADDRESS_CONNECT_ROLES],
    addressConnectOperationsModelVersion: ADDRESS_CONNECT_OPERATIONS_MODEL_VERSION,
    addressScaleArchitectureModelVersion: ADDRESS_SCALE_ARCHITECTURE_MODEL_VERSION,
    addressScaleWorkloads: [...ADDRESS_SCALE_WORKLOADS],
    addressScaleStoreRoles: [...ADDRESS_SCALE_STORE_ROLES],
    addressScaleBulkJobs: [...ADDRESS_BULK_JOB_KINDS],
    addressScaleCacheClasses: [...ADDRESS_CACHE_CLASSES],
    addressScaleStoreBoundary: {
      postgres: 'durable-primary-ledger-temporal-history-spatial-index-cqrs-read-models',
      redis: 'hot-cache-rate-limit-short-lived-nullifier-check-stream-queue-not-source-of-truth',
      mongodb: 'redacted-document-evidence-and-variable-source-metadata-not-private-address-documents',
    },
    addressConnectCriticalWebhookTopics: [...ADDRESS_CONNECT_CRITICAL_WEBHOOK_TOPICS],
    addressConnectOperationalRequirementCategories: [...ADDRESS_CONNECT_OPERATIONAL_REQUIREMENT_CATEGORIES],
    addressTerminalScreens: [...ADDRESS_TERMINAL_SCREENS],
    webhookOperations: {
      signedEventsRequiredInProduction: true,
      replayProtectionRequired: true,
      idempotencyRequired: true,
      deadLetterQueueRequired: true,
      rawPayloadRetentionDays: 0,
    },
    forbiddenPublicPayloads: [
      'plaintext-address',
      'recipient',
      'phone',
      'unit-or-room',
      'raw-agid',
      'raw-aoid',
      'raw-api-key',
      'token',
      'private-key',
      'recipient-secret',
    ],
    adapterBoundary: 'in-memory-development-snapshots-replaceable-by-sqlite-postgres-redis-or-mongodb',
  },
  'x-agid-address-launch-center': {
    modelVersion: ADDRESS_LAUNCH_CENTER_MODEL_VERSION,
    role: 'Plaid-style production launch readiness gate for AGID integrations before moving EC, POS, CMS, carrier, humanitarian, or registry deployments to production.',
    endpointOrder: [
      '/address-launch-center/checklist',
      '/address-launch-center/evaluate',
    ],
    categories: [...ADDRESS_LAUNCH_CENTER_CATEGORIES],
    environments: [...ADDRESS_LAUNCH_CENTER_ENVIRONMENTS],
    profiles: [...ADDRESS_LAUNCH_CENTER_PROFILES],
    modes: [...ADDRESS_LAUNCH_CENTER_MODES],
    statuses: [...ADDRESS_LAUNCH_CENTER_STATUSES],
    itemStatuses: [...ADDRESS_LAUNCH_CENTER_ITEM_STATUSES],
    requiredProductionGates: [
      'oauth-scopes-consent',
      'webhook-signature-verification',
      'revocation-freshness-registry',
      'redacted-storage-logs',
      'duplicate-aoid-prevention',
      'high-risk-mode',
      'typed-error-review-flow',
      'terminal-operations',
      'threat-model-template-selected',
      'release-security-controls',
    ],
    privateMaterialAccepted: false,
    rawAddressAccepted: false,
    rawAgidAccepted: false,
    rawAoidAccepted: false,
    proofCodeAccepted: false,
    launchEvidenceOnly: true,
  },
  'x-agid-address-operations': {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    role: 'Stripe-style operational layer for Address Identity, Address Webhooks, Address Disputes, Address Tax / Customs, and Address Dashboard.',
    endpointOrder: [
      '/address-operations/capabilities',
      '/address-identity/verify',
      '/address-webhooks/event',
      '/address-disputes/case',
      '/address-tax-customs/context',
      '/address-dashboard/snapshot',
    ],
    identityMethods: [...ADDRESS_IDENTITY_METHODS],
    identityClaims: [...ADDRESS_IDENTITY_CLAIMS],
    webhookTopics: [...ADDRESS_CONNECT_WEBHOOK_TOPICS],
    disputeTypes: [...ADDRESS_DISPUTE_TYPES],
    dashboardSections: [...ADDRESS_DASHBOARD_SECTIONS],
    publicApiRawAddressAccepted: false,
    publicApiRawAgidAccepted: false,
    publicApiRawAoidAccepted: false,
    publicApiPasskeySecretAccepted: false,
    proofCodeAccepted: false,
    taxCustomsDataPolicy: 'fully-free-local-first',
    dashboardStoresPersonalAddress: false,
    allowedPublicPayloads: [
      'commitment',
      'credential-ref',
      'issuer-root',
      'revocation-root',
      'freshness-root',
      'payload-fingerprint',
      'waybill-alias',
      'handoff-receipt-ref',
      'pid-commitment',
      'hs-code',
      'country-code',
      'risk-flag',
      'operational-count',
    ],
    forbiddenPublicPayloads: [
      'plaintext-address',
      'recipient',
      'phone',
      'unit-or-room',
      'raw-agid',
      'raw-aoid',
      'proof-code',
      'passkey-secret',
      'private-key',
      'api-key',
      'raw-qr-payload',
    ],
  },
  'x-agid-mcp': {
    enabled: true,
    protocolVersion: AGID_MCP_PROTOCOL_VERSION,
    endpoint: `${API_V1_BASE_PATH}/mcp`,
    transport: 'streamable-http-json-rpc',
    publicOnly: true,
    privateMaterialAccepted: false,
    supportedMethods: ['initialize', 'tools/list', 'tools/call'],
    supportedTools: AGID_MCP_TOOL_NAMES,
    toolSurface: 'public-proofs-commitments-registry-roots-and-integration-metadata',
    securityBoundary: 'MCP clients can discover and call AGID public integration tools without receiving AOID owner data.',
  },
  'x-agid-api': {
    version: 'v1',
    legacyBasePath: '/api',
    compatibility: 'Legacy /api routes are kept as aliases. New integrations should use /api/v1.',
    stability: 'beta',
  },
  'x-agid-communication': {
    governanceModel: AGID_AOID_GOVERNANCE_MODEL_VERSION,
    registrationAuditRequired: true,
    aoidCloudSyncRequiresEncryptedEnvelope: true,
    agid: {
      defaultMode: 'public-or-local',
      apiSurface: 'public-rest-openapi',
      sdkSurface: 'offline-encode-decode-cell-bounds',
      qrSurface: 'public-location-card-or-public-address-reference',
      syncSurface: 'public-grid-reference-or-public-descriptor',
      realtimeSurface: 'job-status-and-public-quality-events',
      allowedNetworkPayloads: [
        'agid',
        'coordinates-for-public-evidence-lookup',
        'country-or-sea-code',
        'public-address-label',
        'public-building-or-place-name',
        'public-map-feature-name',
        'source-confidence-metadata',
      ],
      forbiddenNetworkPayloads: [
        'recipient',
        'phone',
        'unit-or-room',
        'private-delivery-instruction',
        'private-ownership-proof',
      ],
      cachePolicy: 'public evidence can use read-through caches or versioned data packs; dynamic API responses remain no-store',
    },
    aoid: {
      defaultMode: 'local-first-private',
      apiSurface: 'reference-handle-plus-linked-agid-only',
      sdkSurface: 'owner-local-private-payloads-without-ownership-grant',
      qrSurface: 'public-reference-or-private-full-trusted-device-transfer',
      syncSurface: 'owner-consented-owner-device-encrypted-envelope-only',
      realtimeSurface: 'sync-status-only-no-plaintext-private-fields',
      allowedNetworkPayloads: [
        'aoid-id',
        'linked-agid',
        'public-handle',
        'status-or-version',
        'opaque-encrypted-payload',
        'owner-key-id',
        'device-key-id',
      ],
      forbiddenNetworkPayloads: [
        'plaintext-recipient',
        'plaintext-phone',
        'plaintext-unit-or-room',
        'plaintext-delivery-instruction',
        'exact-private-coordinates-in-public-payloads',
        'public-update-timestamp',
      ],
      cachePolicy: 'no public cache, no public data-pack export, and no plaintext server persistence',
    },
  },
  'x-agid-cloud-db': {
    modelVersion: CLOUD_DB_INTEGRATION_MODEL_VERSION,
    databaseAdapterCompatibilityVersion: DATABASE_ADAPTER_COMPATIBILITY_VERSION,
    adapterBoundary: 'plan-before-sdk-dispatch',
    plaintextAoidStorageAllowed: false,
    networkRequestBuiltByPlanningEndpoints: false,
    runtimeLedgerAdapters: CLOUD_DB_OPENAPI_COMPATIBILITY.runtimeLedgerAdapters,
    postgresCompatibleRuntimeAdapters: CLOUD_DB_OPENAPI_COMPATIBILITY.postgresCompatibleRuntimeAdapters,
    plannedRuntimeAdapters: CLOUD_DB_OPENAPI_COMPATIBILITY.plannedRuntimeAdapters,
    connectorPlanOnlyAdapters: CLOUD_DB_OPENAPI_COMPATIBILITY.connectorPlanOnlyAdapters,
    cacheOnlyAdapters: CLOUD_DB_OPENAPI_COMPATIBILITY.cacheOnlyAdapters,
    objectStorageExportAdapters: CLOUD_DB_OPENAPI_COMPATIBILITY.objectStorageExportAdapters,
    webhookAdapters: CLOUD_DB_OPENAPI_COMPATIBILITY.webhookAdapters,
    supportedProviderFamilies: CLOUD_DB_OPENAPI_PROVIDER_FAMILIES,
    supportedProviderExamples: [
      'aws-s3',
      'cloudflare-r2',
      'google-cloud-storage',
      'azure-blob',
      'oci-object-storage',
      'alibaba-cloud-oss',
      'tencent-cloud-cos',
      'huawei-cloud-obs',
      'baidu-ai-cloud-bos',
      'vercel-blob',
      'postgres',
      'supabase',
      'aws-rds-postgres',
      'azure-sql',
      'oracle-autonomous-database',
      'alibaba-cloud-rds',
      'tencent-cloud-tdsql',
      'huawei-cloud-gaussdb',
      'mongodb',
      'mongodb-atlas',
      'azure-cosmos-db',
      'oracle-nosql',
      'alibaba-cloud-tablestore',
      'tencentdb-mongodb',
      'firestore',
      'dynamodb',
      'redis',
      'upstash-redis',
      'cloudflare-d1',
      'bigquery',
      'snowflake',
      'oracle-analytics-cloud',
      'alibaba-cloud-analyticdb',
      'opensearch',
      'qdrant',
      'oracle-netsuite',
      'oracle-blockchain-platform',
      'dingtalk-webhook',
      'feishu-open-platform',
      'wecom-webhook',
      'custom-http-webhook',
    ],
    endpointOrder: [
      '/cloud-db/connectors',
      '/cloud-db/compatibility',
      '/cloud-db/plan',
      '/cloud-db/sync-job',
    ],
    requiredAoidControls: [
      'explicit-owner-consent',
      'owner-device-encrypted-envelope',
      'encrypted-at-rest',
      'encrypted-in-transit',
      'no-server-plaintext-aoid-decryption',
    ],
    publicationRule: 'public AGID references may be cached; AOID sync uses opaque owner-encrypted envelopes only',
  },
  'x-agid-cross-border-auxiliary-data': {
    modelVersion: CROSS_BORDER_AUXILIARY_DATA_VERSION,
    role: 'public-data planning layer for cross-border delivery, POS, and shopping-agent evidence',
    endpointOrder: [
      '/cross-border/auxiliary/sources',
      '/cross-border/auxiliary/context',
      '/shopping-agent/cross-border/context',
    ],
    allowedInputClasses: [
      'origin-country',
      'destination-country',
      'hs-code',
      'barcode',
      'product-category',
      'declared-value',
      'currency',
      'risk-flags',
      'coarse-address-proof-flags',
    ],
    forbiddenInputClasses: [
      'plaintext-address',
      'recipient',
      'phone',
      'unit-or-room',
      'raw-agid',
      'raw-aoid',
      'private-address-history',
    ],
    decisionBoundary: 'decision-support-not-customs-clearance',
  },
  'x-agid-address-element-radar': {
    elementModelVersion: ADDRESS_ELEMENT_MODEL_VERSION,
    radarModelVersion: ADDRESS_RADAR_MODEL_VERSION,
    signalModelVersion: ADDRESS_SIGNAL_MODEL_VERSION,
    elementRole: 'stripe-elements-style-local-address-input-and-safe-intent-preview',
    radarRole: 'stripe-radar-style-risk-rules-for-address-workflow-events',
    signalRole: 'pre-delivery-operator-decision-layer-for-qr-nullifier-quality-carrier-and-issuer-risk',
    publicApiRawFieldValuesAccepted: false,
    localComponentMayHoldRawFields: true,
    publicApiSurface: [
      'field-presence',
      'postal-evidence-summary',
      'safe-fingerprint',
      'agid-commitment-or-presence',
      'scan-capability-flags',
      'risk-signal-counts',
      'pre-delivery-operator-outcome',
    ],
    forbiddenPublicPayloads: [
      'plaintext-address',
      'recipient',
      'phone',
      'unit-or-room',
      'raw-agid',
      'raw-aoid',
      'proof-code',
      'recipient-secret',
      'correction-text',
    ],
    highRiskModeControls: [
      'prefer-agid-s-or-commitment',
      'short-expiry-qr',
      'recipient-live-challenge',
      'no-precise-public-agid',
      'no-address-history-retention',
    ],
    endpointOrder: [
      '/address-element/capabilities',
      '/address-element/session',
      '/address-radar/rules',
      '/address-radar/evaluate',
      '/address-signal/checks',
      '/address-signal/evaluate',
    ],
  },
  'x-agid-audit': {
    modelVersion: AGID_AOID_GOVERNANCE_MODEL_VERSION,
    eventPrivacy: AGID_AOID_GOVERNANCE_MODEL.audit.eventPrivacy,
    rawPrivatePayloadStorage: AGID_AOID_GOVERNANCE_MODEL.audit.rawPrivatePayloadStorage,
    requiredEvents: AGID_AOID_GOVERNANCE_MODEL.audit.requiredEvents,
    registeredSurfaces: [
      'local-device',
      'public-api',
      'public-qr',
      'private-qr',
      'encrypted-sync',
      'event-stream',
      'sdk',
      'openapi',
    ],
    eventFields: [
      'modelVersion',
      'layer',
      'operation',
      'surface',
      'entityId',
      'agid',
      'publicHandle',
      'payloadClass',
      'outcome',
      'payloadFingerprint',
    ],
  },
  'x-agid-polkadot': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    commitmentAlgorithm: AGID_POLKADOT_COMMITMENT_ALGORITHM,
    stageOrder: listPolkadotIntegrationStages().map(stage => stage.id),
    onChainRule: 'commitments-policy-hashes-nullifiers-revocation-roots-only',
    forbiddenOnChainPayloads: [
      'plaintext-address',
      'recipient',
      'phone',
      'unit-or-room',
      'raw-aoid',
      'subject-id',
      'exact-private-coordinates',
      'delivery-instructions',
    ],
    firstStage: 'chain-commitment',
    finalStage: 'address-dao',
    role: 'Ordered Polkadot integration plan for ZK address proofs, credentials, AOID ownership, lineage, and governance without publishing private address payloads.',
  },
  'x-agid-identity': {
    agid: {
      layer: 'public-location-address-building-map-feature',
      answers: 'where-and-what-public-address-building-or-map-feature',
      includesPublicAddress: true,
      includesPublicBuilding: true,
      includesPublicMapFeature: true,
      excludesPrivateUnitRecipient: true,
      includesPersonalData: false,
      centralRole: 'spec-governance-and-quality',
      distributedRole: 'sdk-device-encode-decode-cell-bounds',
    },
    aoid: {
      layer: 'private-address',
      answers: 'who-receives-and-how-to-deliver',
      includesPublicAddress: true,
      includesPublicBuilding: true,
      includesPrivateUnitRecipient: true,
      includesPersonalData: true,
      defaultStorage: 'device-local',
      publicSurface: 'reference-handle-plus-linked-agid',
      cloudSyncRequires: [
        'explicit-owner-consent',
        'owner-device-encryption',
        'owner-and-device-key-ids',
        'opaque-ciphertext-payload',
      ],
      plainCloudSyncAllowed: false,
      centralRole: 'optional-private-sync-with-owner-consent',
      distributedRole: 'owner-controlled-local-first-records',
    },
  },
} as const;
