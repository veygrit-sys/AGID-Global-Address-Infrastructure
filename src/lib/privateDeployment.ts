import { addressConnectPrivateMaterialPaths } from './addressConnect';
import {
  MANAGED_ZK_BACKENDS,
  MANAGED_ZK_PROOF_FAMILIES,
  type ManagedZkBackend,
  type ManagedZkDeploymentProfile,
  type ManagedZkProofFamily,
  type ManagedZkWitnessMode,
} from './managedZkProofServer';
import { sha256Hex } from './sha256';

export const PRIVATE_DEPLOYMENT_MODEL_VERSION = 'agid-private-deployment-v1';

export const PRIVATE_DEPLOYMENT_SECTORS = [
  'municipality',
  'ngo',
  'carrier',
] as const;

export const PRIVATE_DEPLOYMENT_NETWORK_MODES = [
  'single-node',
  'private-vpc',
  'offline-first',
  'hybrid-edge',
  'air-gapped',
] as const;

export const PRIVATE_DEPLOYMENT_COMPONENT_IDS = [
  'local-resolver',
  'private-registry-api',
  'managed-zk-proof-worker',
  'issuer-trust-registry',
  'revocation-freshness-registry',
  'nullifier-ledger',
  'address-connect-directory',
  'address-terminal-fleet',
  'offline-sync-ledger',
  'signed-webhook-dispatcher',
  'audit-dashboard',
  'redacted-audit-archive',
  'public-data-pack-mirror',
  'secrets-and-key-management',
  'monitoring-and-sla',
  'incident-response',
] as const;

export type PrivateDeploymentSector = (typeof PRIVATE_DEPLOYMENT_SECTORS)[number];
export type PrivateDeploymentNetworkMode = (typeof PRIVATE_DEPLOYMENT_NETWORK_MODES)[number];
export type PrivateDeploymentComponentId = (typeof PRIVATE_DEPLOYMENT_COMPONENT_IDS)[number];
export type PrivateDeploymentStatus = 'ready' | 'attention' | 'blocked';
export type PrivateDeploymentRuntimeMode =
  | 'mode-1-server-registry'
  | 'mode-2-zk-only'
  | 'mode-3-ethereum-registry'
  | 'mode-4-full-zk-ethereum';
export type PrivateDeploymentStore = 'sqlite' | 'postgres' | 'redis' | 'mongodb' | 'object-storage';

export type PrivateDeploymentPlanInput = {
  [key: string]: unknown;
  requestedAt?: unknown;
  tenantId?: unknown;
  sector?: unknown;
  networkMode?: unknown;
  countryCodes?: unknown;
  regionCodes?: unknown;
  dataResidencyCountryCode?: unknown;
  expectedDailyEvents?: unknown;
  peakEventsPerSecond?: unknown;
  posTerminals?: unknown;
  offlineSites?: unknown;
  highRiskMode?: unknown;
  emergencyMode?: unknown;
  requiresZk?: unknown;
  requiresEthereum?: unknown;
  requiresCarrierIntegration?: unknown;
  requiresPublicDashboard?: unknown;
  requiresCrossOrgTrust?: unknown;
  confidentialCompute?: unknown;
  witnessMode?: unknown;
  backend?: unknown;
  storageModes?: unknown;
  retentionDays?: unknown;
};

export type PrivateDeploymentComponent = {
  id: PrivateDeploymentComponentId;
  required: boolean;
  owner: 'core-platform' | 'organization' | 'field-ops' | 'security' | 'operations';
  purpose: string;
  storesRawAddress: false;
  dependencies: PrivateDeploymentComponentId[];
  envVars: string[];
};

export type PrivateDeploymentPlan = {
  modelVersion: typeof PRIVATE_DEPLOYMENT_MODEL_VERSION;
  accepted: boolean;
  status: PrivateDeploymentStatus;
  requestedAt: string;
  tenantId: string;
  sector: PrivateDeploymentSector;
  deploymentProfile: ManagedZkDeploymentProfile;
  networkMode: PrivateDeploymentNetworkMode;
  runtimeMode: PrivateDeploymentRuntimeMode;
  scope: {
    countryCodes: string[];
    regionCodes: string[];
    dataResidencyCountryCode: string | null;
    expectedDailyEvents: number;
    peakEventsPerSecond: number;
    posTerminals: number;
    offlineSites: number;
  };
  components: PrivateDeploymentComponent[];
  storage: {
    primaryLedger: PrivateDeploymentStore;
    hotCache: PrivateDeploymentStore | null;
    documentEvidence: PrivateDeploymentStore | null;
    offlineStore: PrivateDeploymentStore | null;
    archive: PrivateDeploymentStore;
    requiredEnvVars: string[];
    forbiddenStores: string[];
  };
  zk: {
    enabled: boolean;
    backend: ManagedZkBackend;
    witnessMode: ManagedZkWitnessMode;
    deploymentProfile: ManagedZkDeploymentProfile;
    proofFamilies: ManagedZkProofFamily[];
    confidentialComputeRecommended: boolean;
    serverHeldWitnessAllowed: false;
    publicJobMaterialOnly: true;
  };
  operations: {
    signedWebhooksRequired: true;
    mTLSRecommended: boolean;
    offlineSyncRequired: boolean;
    terminalFleetRequired: boolean;
    auditRetentionDays: number;
    rawLogRetentionDays: 0;
    launchGates: string[];
  };
  security: {
    privateMaterialAccepted: false;
    rawAddressStorage: false;
    rawAgidStorage: false;
    rawAoidStorage: false;
    rawWitnessStorage: false;
    publicDashboardAllowed: boolean;
    controls: string[];
  };
  warnings: string[];
  errors: string[];
  planRoot: string;
};

const SECTOR_PROFILES: Record<PrivateDeploymentSector, {
  deploymentProfile: ManagedZkDeploymentProfile;
  defaultNetworkMode: PrivateDeploymentNetworkMode;
  defaultRuntimeMode: PrivateDeploymentRuntimeMode;
  defaultRetentionDays: number;
  defaultProofFamilies: ManagedZkProofFamily[];
  requiredComponents: PrivateDeploymentComponentId[];
  controls: string[];
}> = {
  municipality: {
    deploymentProfile: 'private-municipality',
    defaultNetworkMode: 'private-vpc',
    defaultRuntimeMode: 'mode-2-zk-only',
    defaultRetentionDays: 365,
    defaultProofFamilies: ['zk-address', 'zk-residence', 'revocation-freshness', 'proof-bundle'],
    requiredComponents: [
      'local-resolver',
      'private-registry-api',
      'issuer-trust-registry',
      'revocation-freshness-registry',
      'nullifier-ledger',
      'managed-zk-proof-worker',
      'signed-webhook-dispatcher',
      'audit-dashboard',
      'secrets-and-key-management',
      'monitoring-and-sla',
    ],
    controls: [
      'official-issuer-key-governance',
      'resident-credential-scope-limits',
      'data-residency-policy',
      'separation-of-public-service-and-private-residence-data',
    ],
  },
  ngo: {
    deploymentProfile: 'private-ngo',
    defaultNetworkMode: 'offline-first',
    defaultRuntimeMode: 'mode-2-zk-only',
    defaultRetentionDays: 30,
    defaultProofFamilies: ['zk-delivery-eligibility', 'duplicate-nullifier', 'revocation-freshness', 'anonymous-rate-limit'],
    requiredComponents: [
      'local-resolver',
      'private-registry-api',
      'issuer-trust-registry',
      'revocation-freshness-registry',
      'nullifier-ledger',
      'offline-sync-ledger',
      'address-terminal-fleet',
      'managed-zk-proof-worker',
      'redacted-audit-archive',
      'secrets-and-key-management',
      'incident-response',
    ],
    controls: [
      'agid-s-only-for-high-risk-beneficiaries',
      'short-lived-qr-and-immediate-revocation',
      'offline-deferred-sync-conflict-review',
      'no-address-history-retention-for-protected-groups',
    ],
  },
  carrier: {
    deploymentProfile: 'private-carrier',
    defaultNetworkMode: 'hybrid-edge',
    defaultRuntimeMode: 'mode-1-server-registry',
    defaultRetentionDays: 180,
    defaultProofFamilies: ['zk-delivery-eligibility', 'aoid-ownership', 'duplicate-nullifier', 'quality-threshold'],
    requiredComponents: [
      'local-resolver',
      'private-registry-api',
      'revocation-freshness-registry',
      'nullifier-ledger',
      'address-connect-directory',
      'address-terminal-fleet',
      'signed-webhook-dispatcher',
      'audit-dashboard',
      'monitoring-and-sla',
      'secrets-and-key-management',
    ],
    controls: [
      'carrier-device-signature-required',
      'handoff-receipt-reverification',
      'terminal-fleet-role-based-access',
      'waybill-alias-instead-of-raw-address-in-logs',
    ],
  },
};

const COMPONENT_PURPOSES: Record<PrivateDeploymentComponentId, Omit<PrivateDeploymentComponent, 'id' | 'required'>> = {
  'local-resolver': {
    owner: 'core-platform',
    purpose: 'Resolve AGID/AOID references and public data packs inside the private boundary.',
    storesRawAddress: false,
    dependencies: [],
    envVars: [],
  },
  'private-registry-api': {
    owner: 'core-platform',
    purpose: 'Host issuer, revocation, nullifier, and proof-bundle metadata for the tenant.',
    storesRawAddress: false,
    dependencies: ['local-resolver'],
    envVars: ['AGID_PRIVATE_REGISTRY_URL'],
  },
  'managed-zk-proof-worker': {
    owner: 'security',
    purpose: 'Run proof jobs from public inputs, commitments, roots, and object refs only.',
    storesRawAddress: false,
    dependencies: ['issuer-trust-registry', 'revocation-freshness-registry', 'nullifier-ledger'],
    envVars: ['AGID_MANAGED_ZK_JOB_STORE', 'AGID_ZK_PRIVATE_DEPLOYMENT_ID'],
  },
  'issuer-trust-registry': {
    owner: 'security',
    purpose: 'Manage trusted issuer public keys, statuses, scopes, and registry roots.',
    storesRawAddress: false,
    dependencies: [],
    envVars: ['AGID_ISSUER_TRUST_REGISTRY_STORE'],
  },
  'revocation-freshness-registry': {
    owner: 'security',
    purpose: 'Publish and verify freshness roots and credential/QR revocation state.',
    storesRawAddress: false,
    dependencies: ['issuer-trust-registry'],
    envVars: ['AGID_REVOCATION_REGISTRY_STORE'],
  },
  'nullifier-ledger': {
    owner: 'security',
    purpose: 'Prevent duplicate claims, duplicate handoffs, and replay without storing identity.',
    storesRawAddress: false,
    dependencies: ['private-registry-api'],
    envVars: ['AGID_NULLIFIER_LEDGER_STORE'],
  },
  'address-connect-directory': {
    owner: 'organization',
    purpose: 'Register organization endpoints, roles, scopes, webhooks, and API-key references.',
    storesRawAddress: false,
    dependencies: ['issuer-trust-registry'],
    envVars: ['AGID_ADDRESS_CONNECT_DIRECTORY_STORE'],
  },
  'address-terminal-fleet': {
    owner: 'field-ops',
    purpose: 'Manage POS terminals, scanners, NFC, printers, staff permissions, and device diagnostics.',
    storesRawAddress: false,
    dependencies: ['private-registry-api', 'nullifier-ledger'],
    envVars: ['AGID_TERMINAL_FLEET_STORE'],
  },
  'offline-sync-ledger': {
    owner: 'field-ops',
    purpose: 'Allow disconnected sites to sync redacted events and flag conflicts later.',
    storesRawAddress: false,
    dependencies: ['nullifier-ledger', 'address-terminal-fleet'],
    envVars: ['AGID_OFFLINE_SYNC_STORE'],
  },
  'signed-webhook-dispatcher': {
    owner: 'operations',
    purpose: 'Deliver signed webhook events with idempotency, replay protection, and dead letters.',
    storesRawAddress: false,
    dependencies: ['private-registry-api'],
    envVars: ['AGID_WEBHOOK_SIGNING_KEY_ID', 'AGID_WEBHOOK_OUTBOX_STORE'],
  },
  'audit-dashboard': {
    owner: 'operations',
    purpose: 'Show redacted operational, terminal, issuer, revocation, and handoff audit state.',
    storesRawAddress: false,
    dependencies: ['redacted-audit-archive'],
    envVars: ['AGID_AUDIT_DASHBOARD_URL'],
  },
  'redacted-audit-archive': {
    owner: 'operations',
    purpose: 'Store append-only redacted audit events, receipt refs, and policy decisions.',
    storesRawAddress: false,
    dependencies: ['private-registry-api'],
    envVars: ['AGID_AUDIT_ARCHIVE_STORE'],
  },
  'public-data-pack-mirror': {
    owner: 'core-platform',
    purpose: 'Mirror public postal, boundary, format, and resolver data packs inside the private network.',
    storesRawAddress: false,
    dependencies: [],
    envVars: ['AGID_PUBLIC_DATA_PACK_ROOT'],
  },
  'secrets-and-key-management': {
    owner: 'security',
    purpose: 'Keep issuer, webhook, terminal, and worker keys in a secret manager or HSM.',
    storesRawAddress: false,
    dependencies: [],
    envVars: ['AGID_KMS_KEY_ID', 'AGID_SECRET_MANAGER_REF'],
  },
  'monitoring-and-sla': {
    owner: 'operations',
    purpose: 'Track health, latency, sync age, webhook failures, proof queue delay, and error budget.',
    storesRawAddress: false,
    dependencies: ['private-registry-api'],
    envVars: ['AGID_MONITORING_DSN'],
  },
  'incident-response': {
    owner: 'operations',
    purpose: 'Define key compromise, QR replay, data exposure, and field-site conflict playbooks.',
    storesRawAddress: false,
    dependencies: ['monitoring-and-sla', 'redacted-audit-archive'],
    envVars: ['AGID_INCIDENT_CONTACT_REF'],
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

function cleanNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === 'number' ? value : Number(cleanString(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
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

function cleanCountryCodes(value: unknown): string[] {
  return Array.from(new Set(
    cleanStringArray(value)
      .map(item => item.toUpperCase())
      .filter(item => /^[A-Z0-9-]{2,12}$/.test(item)),
  ));
}

function cleanStores(value: unknown): PrivateDeploymentStore[] {
  const allowed: PrivateDeploymentStore[] = ['sqlite', 'postgres', 'redis', 'mongodb', 'object-storage'];
  return Array.from(new Set(
    cleanStringArray(value).filter((item): item is PrivateDeploymentStore => allowed.includes(item as PrivateDeploymentStore)),
  ));
}

function runtimeModeFor(input: {
  requiresZk: boolean;
  requiresEthereum: boolean;
  defaultRuntimeMode: PrivateDeploymentRuntimeMode;
}): PrivateDeploymentRuntimeMode {
  if (input.requiresZk && input.requiresEthereum) return 'mode-4-full-zk-ethereum';
  if (input.requiresZk) return 'mode-2-zk-only';
  if (input.requiresEthereum) return 'mode-3-ethereum-registry';
  return input.defaultRuntimeMode;
}

function defaultNetworkModeFor(sector: PrivateDeploymentSector, highRiskMode: boolean, offlineSites: number) {
  if (highRiskMode || offlineSites > 0) return 'offline-first';
  return SECTOR_PROFILES[sector].defaultNetworkMode;
}

function buildComponents(
  required: PrivateDeploymentComponentId[],
  options: {
    requiresZk: boolean;
    requiresCarrierIntegration: boolean;
    requiresPublicDashboard: boolean;
    offlineSites: number;
    highRiskMode: boolean;
  },
) {
  const selected = new Set<PrivateDeploymentComponentId>(required);
  selected.add('public-data-pack-mirror');
  selected.add('redacted-audit-archive');

  if (options.requiresZk) selected.add('managed-zk-proof-worker');
  if (options.requiresCarrierIntegration) {
    selected.add('address-connect-directory');
    selected.add('address-terminal-fleet');
    selected.add('signed-webhook-dispatcher');
  }
  if (options.offlineSites > 0 || options.highRiskMode) selected.add('offline-sync-ledger');
  if (options.requiresPublicDashboard) selected.add('audit-dashboard');

  return [...PRIVATE_DEPLOYMENT_COMPONENT_IDS]
    .filter(id => selected.has(id))
    .map(id => ({
      id,
      required: required.includes(id) || id === 'secrets-and-key-management',
      ...COMPONENT_PURPOSES[id],
    }));
}

function storagePlan(input: {
  networkMode: PrivateDeploymentNetworkMode;
  expectedDailyEvents: number;
  peakEventsPerSecond: number;
  offlineSites: number;
  requiresCarrierIntegration: boolean;
  requiresPublicDashboard: boolean;
  preferredStores: PrivateDeploymentStore[];
}) {
  const needsPostgres = input.networkMode !== 'single-node'
    || input.expectedDailyEvents >= 10_000
    || input.requiresCarrierIntegration
    || input.requiresPublicDashboard;
  const needsRedis = input.peakEventsPerSecond >= 10 || input.requiresCarrierIntegration;
  const needsMongo = input.requiresPublicDashboard;
  const primaryLedger: PrivateDeploymentStore = needsPostgres ? 'postgres' : 'sqlite';
  const hotCache: PrivateDeploymentStore | null = needsRedis ? 'redis' : null;
  const documentEvidence: PrivateDeploymentStore | null = needsMongo ? 'mongodb' : null;
  const offlineStore: PrivateDeploymentStore | null = input.offlineSites > 0 || input.networkMode === 'offline-first' ? 'sqlite' : null;
  const archive: PrivateDeploymentStore = 'object-storage';
  const envVars = [
    ...(primaryLedger === 'postgres' ? ['DATABASE_URL', 'AGID_PRIVATE_LEDGER_SCHEMA'] : ['AGID_PRIVATE_SQLITE_PATH']),
    ...(hotCache ? ['REDIS_URL'] : []),
    ...(documentEvidence ? ['MONGODB_URI', 'AGID_MONGODB_DATABASE'] : []),
    ...(offlineStore ? ['AGID_OFFLINE_SYNC_SQLITE_PATH'] : []),
    'AGID_AUDIT_ARCHIVE_BUCKET',
  ];
  const warnings: string[] = [];

  if (input.preferredStores.includes('redis') && primaryLedger === 'sqlite' && input.preferredStores.length === 1) {
    warnings.push('redis-cannot-be-primary-private-deployment-ledger');
  }
  if (needsPostgres && !input.preferredStores.includes('postgres') && input.preferredStores.length > 0) {
    warnings.push('postgres-added-for-durable-private-ledger');
  }
  if (needsRedis && !input.preferredStores.includes('redis') && input.preferredStores.length > 0) {
    warnings.push('redis-added-for-terminal-cache-and-burst-control');
  }

  return {
    plan: {
      primaryLedger,
      hotCache,
      documentEvidence,
      offlineStore,
      archive,
      requiredEnvVars: envVars,
      forbiddenStores: [
        'public-shared-database-with-private-address-rows',
        'redis-as-only-source-of-truth',
        'analytics-warehouse-with-raw-address-events',
      ],
    },
    warnings,
  };
}

function launchGatesFor(sector: PrivateDeploymentSector, runtimeMode: PrivateDeploymentRuntimeMode, highRiskMode: boolean) {
  return [
    'no-plaintext-address-or-aoid-storage',
    'secret-manager-or-hsm-configured',
    'signed-webhook-replay-protection',
    'revocation-and-freshness-checks-enabled',
    'nullifier-domain-separation-enabled',
    'redacted-audit-log-review',
    ...(runtimeMode === 'mode-2-zk-only' || runtimeMode === 'mode-4-full-zk-ethereum'
      ? ['managed-zk-worker-sandboxed', 'verifier-key-pinning']
      : []),
    ...(sector === 'carrier' ? ['terminal-device-signing-enabled', 'handoff-reverification-report-enabled'] : []),
    ...(sector === 'municipality' ? ['issuer-trust-governance-approved', 'data-residency-reviewed'] : []),
    ...(sector === 'ngo' || highRiskMode ? ['high-risk-mode-enabled', 'offline-conflict-review-playbook'] : []),
  ];
}

export function listPrivateDeploymentCapabilities() {
  return {
    modelVersion: PRIVATE_DEPLOYMENT_MODEL_VERSION,
    sectors: [...PRIVATE_DEPLOYMENT_SECTORS],
    networkModes: [...PRIVATE_DEPLOYMENT_NETWORK_MODES],
    componentIds: [...PRIVATE_DEPLOYMENT_COMPONENT_IDS],
    recommendedProfiles: Object.fromEntries(
      PRIVATE_DEPLOYMENT_SECTORS.map(sector => [sector, {
        deploymentProfile: SECTOR_PROFILES[sector].deploymentProfile,
        defaultNetworkMode: SECTOR_PROFILES[sector].defaultNetworkMode,
        defaultRuntimeMode: SECTOR_PROFILES[sector].defaultRuntimeMode,
        proofFamilies: SECTOR_PROFILES[sector].defaultProofFamilies,
      }]),
    ),
    privacy: {
      privateMaterialAccepted: false,
      rawAddressStorage: false,
      rawAgidStorage: false,
      rawAoidStorage: false,
      rawWitnessStorage: false,
      publicDashboardStoresPersonalAddress: false,
    },
    supports: {
      municipalityResidenceCredentials: true,
      ngoHumanitarianFieldOps: true,
      carrierTerminalFleet: true,
      managedZkPrivateWorkers: true,
      offlineFirstSync: true,
      signedWebhooks: true,
      redactedAuditArchive: true,
    },
  };
}

export function buildPrivateDeploymentPlan(input: PrivateDeploymentPlanInput = {}): PrivateDeploymentPlan {
  const requestedAt = cleanString(input.requestedAt) || new Date(0).toISOString();
  const tenantId = cleanString(input.tenantId) || 'private-tenant';
  const sector = cleanEnum(input.sector, PRIVATE_DEPLOYMENT_SECTORS, 'ngo');
  const profile = SECTOR_PROFILES[sector];
  const highRiskMode = cleanBoolean(input.highRiskMode) || sector === 'ngo';
  const emergencyMode = cleanBoolean(input.emergencyMode);
  const offlineSites = cleanNumber(input.offlineSites, sector === 'ngo' ? 1 : 0, 0, 10_000);
  const networkMode = cleanEnum(
    input.networkMode,
    PRIVATE_DEPLOYMENT_NETWORK_MODES,
    defaultNetworkModeFor(sector, highRiskMode, offlineSites),
  );
  const requiresZk = cleanBoolean(input.requiresZk) || highRiskMode || sector === 'municipality';
  const requiresEthereum = cleanBoolean(input.requiresEthereum);
  const requiresCarrierIntegration = cleanBoolean(input.requiresCarrierIntegration) || sector === 'carrier';
  const requiresPublicDashboard = cleanBoolean(input.requiresPublicDashboard);
  const runtimeMode = runtimeModeFor({
    requiresZk,
    requiresEthereum,
    defaultRuntimeMode: profile.defaultRuntimeMode,
  });
  const countryCodes = cleanCountryCodes(input.countryCodes);
  const regionCodes = cleanStringArray(input.regionCodes).map(item => item.toUpperCase());
  const dataResidencyCountryCode = cleanCountryCodes(input.dataResidencyCountryCode)[0] ?? null;
  const expectedDailyEvents = cleanNumber(input.expectedDailyEvents, sector === 'carrier' ? 100_000 : 10_000, 0, 1_000_000_000);
  const peakEventsPerSecond = cleanNumber(input.peakEventsPerSecond, sector === 'carrier' ? 100 : 20, 0, 100_000);
  const posTerminals = cleanNumber(input.posTerminals, sector === 'carrier' ? 50 : sector === 'ngo' ? 10 : 0, 0, 100_000);
  const backend = cleanEnum(input.backend, MANAGED_ZK_BACKENDS, 'circom-snarkjs');
  const witnessMode = cleanEnum(
    input.witnessMode,
    ['client-side-witness', 'remote-encrypted-witness', 'server-held-witness'] as const,
    'client-side-witness',
  );
  const confidentialCompute = cleanBoolean(input.confidentialCompute);
  const retentionDays = cleanNumber(
    input.retentionDays,
    emergencyMode ? Math.min(profile.defaultRetentionDays, 7) : profile.defaultRetentionDays,
    0,
    3650,
  );
  const preferredStores = cleanStores(input.storageModes);
  const privatePaths = Array.from(new Set(addressConnectPrivateMaterialPaths(input)));
  const warnings: string[] = [];
  const errors: string[] = [];

  if (privatePaths.length > 0) errors.push(`private-material-rejected:${privatePaths.join(',')}`);
  if (witnessMode === 'server-held-witness') errors.push('server-held-witness-forbidden-for-private-deployment');
  if (countryCodes.length === 0) warnings.push('country-scope-not-declared');
  if (sector === 'municipality' && !dataResidencyCountryCode) warnings.push('municipality-data-residency-country-recommended');
  if (sector === 'ngo' && requiresEthereum) warnings.push('ngo-high-risk-ethereum-metadata-review-required');
  if (highRiskMode && retentionDays > 90) warnings.push('high-risk-retention-should-be-shorter-than-90-days');
  if (requiresPublicDashboard && sector === 'ngo') warnings.push('public-dashboard-must-use-aggregate-redacted-data-only');
  if (witnessMode === 'remote-encrypted-witness' && !confidentialCompute) {
    warnings.push('remote-encrypted-witness-should-use-confidential-compute-or-org-owned-private-workers');
  }

  const components = buildComponents(profile.requiredComponents, {
    requiresZk,
    requiresCarrierIntegration,
    requiresPublicDashboard,
    offlineSites,
    highRiskMode,
  });
  const storage = storagePlan({
    networkMode,
    expectedDailyEvents,
    peakEventsPerSecond,
    offlineSites,
    requiresCarrierIntegration,
    requiresPublicDashboard,
    preferredStores,
  });
  warnings.push(...storage.warnings);

  const proofFamilies = Array.from(new Set(
    profile.defaultProofFamilies.filter(family => MANAGED_ZK_PROOF_FAMILIES.includes(family)),
  ));
  const launchGates = launchGatesFor(sector, runtimeMode, highRiskMode);
  const controls = Array.from(new Set([
    ...profile.controls,
    'public-api-accepts-commitments-roots-and-refs-only',
    'no-server-plaintext-aoid-decryption',
    'domain-separated-commitments-and-nullifiers',
    'tenant-isolated-storage-and-worker-queues',
    'no-raw-request-body-logging',
    'key-rotation-and-break-glass-revocation',
    ...(networkMode === 'air-gapped' || networkMode === 'offline-first' ? ['offline-first-deferred-sync-conflict-review'] : []),
    ...(runtimeMode === 'mode-4-full-zk-ethereum' ? ['onchain-metadata-minimization'] : []),
  ]));

  const accepted = errors.length === 0;
  const status: PrivateDeploymentStatus = !accepted ? 'blocked' : warnings.length > 0 ? 'attention' : 'ready';
  const planRoot = sha256Hex(stableJson({
    modelVersion: PRIVATE_DEPLOYMENT_MODEL_VERSION,
    tenantId,
    sector,
    deploymentProfile: profile.deploymentProfile,
    networkMode,
    runtimeMode,
    countryCodes,
    regionCodes,
    expectedDailyEvents,
    peakEventsPerSecond,
    components: components.map(component => component.id),
    storage: storage.plan,
    proofFamilies,
    errors,
    warnings,
  }));

  return {
    modelVersion: PRIVATE_DEPLOYMENT_MODEL_VERSION,
    accepted,
    status,
    requestedAt,
    tenantId,
    sector,
    deploymentProfile: profile.deploymentProfile,
    networkMode,
    runtimeMode,
    scope: {
      countryCodes,
      regionCodes,
      dataResidencyCountryCode,
      expectedDailyEvents,
      peakEventsPerSecond,
      posTerminals,
      offlineSites,
    },
    components,
    storage: storage.plan,
    zk: {
      enabled: requiresZk,
      backend,
      witnessMode,
      deploymentProfile: profile.deploymentProfile,
      proofFamilies,
      confidentialComputeRecommended: witnessMode === 'remote-encrypted-witness' || highRiskMode,
      serverHeldWitnessAllowed: false,
      publicJobMaterialOnly: true,
    },
    operations: {
      signedWebhooksRequired: true,
      mTLSRecommended: networkMode === 'private-vpc' || networkMode === 'hybrid-edge',
      offlineSyncRequired: networkMode === 'offline-first' || networkMode === 'air-gapped' || offlineSites > 0,
      terminalFleetRequired: sector === 'carrier' || posTerminals > 0,
      auditRetentionDays: retentionDays,
      rawLogRetentionDays: 0,
      launchGates,
    },
    security: {
      privateMaterialAccepted: false,
      rawAddressStorage: false,
      rawAgidStorage: false,
      rawAoidStorage: false,
      rawWitnessStorage: false,
      publicDashboardAllowed: requiresPublicDashboard && sector !== 'ngo',
      controls,
    },
    warnings: Array.from(new Set(warnings)),
    errors: Array.from(new Set(errors)),
    planRoot,
  };
}
