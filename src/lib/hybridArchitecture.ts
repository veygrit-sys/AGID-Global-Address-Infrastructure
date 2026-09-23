import type { SyncQueueRecord } from './appDatabase';
import type { AddressIdentityLayer } from './addressIdentity';

export type HybridAuthority = 'device' | 'central' | 'sdk' | 'open-data-pack';

export type HybridWorkflow =
  | 'agid-core'
  | 'address-registration'
  | 'address-quality'
  | 'postal-lookup'
  | 'geo-evidence'
  | 'building-name'
  | 'registered-address-sync'
  | 'settings-sync'
  | 'sdk-package';

export type HybridRuntimeMode =
  | 'local-first'
  | 'central-assisted'
  | 'central-verified'
  | 'sdk-portable'
  | 'read-through-cache'
  | 'manual-required';

export type HybridPrivacyScope = 'public-grid' | 'private-record' | 'derived-evidence' | 'settings';

export type HybridIdentityLayer = AddressIdentityLayer | 'ADDRESS_EVIDENCE' | 'SETTINGS';

export type HybridCentralRole =
  | 'none'
  | 'quality-upgrade'
  | 'verification-source'
  | 'optional-private-sync';

export type HybridSdkRole = 'core-owner' | 'consumer' | 'mirror' | 'none';

export type HybridPolicy = {
  workflow: HybridWorkflow;
  label: string;
  primaryAuthority: HybridAuthority;
  fallbackAuthorities: HybridAuthority[];
  onlineMode: HybridRuntimeMode;
  offlineMode: HybridRuntimeMode;
  centralRole: HybridCentralRole;
  sdkRole: HybridSdkRole;
  privacyScope: HybridPrivacyScope;
  identityLayer: HybridIdentityLayer;
  canRunOffline: boolean;
  canUseSdkWithoutCentral: boolean;
  sendsPersonalDataToPublicLayer: boolean;
  cacheStrategy: 'none' | 'local-cache' | 'read-through-cache' | 'versioned-data-pack';
  evidenceLabel: string;
};

export type HybridRuntimeContext = {
  workflow: HybridWorkflow;
  online: boolean;
  centralConfidence?: number;
  hasLocalRecord?: boolean;
  hasOpenDataPack?: boolean;
  userOptedInToSync?: boolean;
};

export type HybridRuntimeDecision = {
  workflow: HybridWorkflow;
  mode: HybridRuntimeMode;
  authorities: HybridAuthority[];
  shouldCallCentral: boolean;
  canRunOffline: boolean;
  canUseSdkWithoutCentral: boolean;
  qualityTier: 'local' | 'partial' | 'verified';
  privacyScope: HybridPrivacyScope;
  identityLayer: HybridIdentityLayer;
  sendsPersonalDataToPublicLayer: false;
  label: string;
};

const HYBRID_POLICIES: Record<HybridWorkflow, HybridPolicy> = {
  'agid-core': {
    workflow: 'agid-core',
    label: 'AGID deterministic grid core',
    primaryAuthority: 'sdk',
    fallbackAuthorities: ['device'],
    onlineMode: 'sdk-portable',
    offlineMode: 'sdk-portable',
    centralRole: 'none',
    sdkRole: 'core-owner',
    privacyScope: 'public-grid',
    identityLayer: 'AGID',
    canRunOffline: true,
    canUseSdkWithoutCentral: true,
    sendsPersonalDataToPublicLayer: false,
    cacheStrategy: 'none',
    evidenceLabel: 'Deterministic AGID math',
  },
  'address-registration': {
    workflow: 'address-registration',
    label: 'Local address registration',
    primaryAuthority: 'device',
    fallbackAuthorities: ['sdk', 'central'],
    onlineMode: 'central-assisted',
    offlineMode: 'local-first',
    centralRole: 'quality-upgrade',
    sdkRole: 'consumer',
    privacyScope: 'private-record',
    identityLayer: 'AOID',
    canRunOffline: true,
    canUseSdkWithoutCentral: true,
    sendsPersonalDataToPublicLayer: false,
    cacheStrategy: 'local-cache',
    evidenceLabel: 'Local record with optional central quality checks',
  },
  'address-quality': {
    workflow: 'address-quality',
    label: 'Address quality and evidence scoring',
    primaryAuthority: 'central',
    fallbackAuthorities: ['device', 'open-data-pack'],
    onlineMode: 'central-verified',
    offlineMode: 'manual-required',
    centralRole: 'verification-source',
    sdkRole: 'consumer',
    privacyScope: 'derived-evidence',
    identityLayer: 'ADDRESS_EVIDENCE',
    canRunOffline: true,
    canUseSdkWithoutCentral: true,
    sendsPersonalDataToPublicLayer: false,
    cacheStrategy: 'read-through-cache',
    evidenceLabel: 'Central postal, geo, and source confidence',
  },
  'postal-lookup': {
    workflow: 'postal-lookup',
    label: 'Postal lookup and autofill',
    primaryAuthority: 'central',
    fallbackAuthorities: ['open-data-pack', 'device'],
    onlineMode: 'read-through-cache',
    offlineMode: 'local-first',
    centralRole: 'verification-source',
    sdkRole: 'consumer',
    privacyScope: 'derived-evidence',
    identityLayer: 'ADDRESS_EVIDENCE',
    canRunOffline: true,
    canUseSdkWithoutCentral: true,
    sendsPersonalDataToPublicLayer: false,
    cacheStrategy: 'read-through-cache',
    evidenceLabel: 'Postal API or local postal metadata',
  },
  'geo-evidence': {
    workflow: 'geo-evidence',
    label: 'Open-source geography evidence',
    primaryAuthority: 'open-data-pack',
    fallbackAuthorities: ['central', 'device'],
    onlineMode: 'central-assisted',
    offlineMode: 'local-first',
    centralRole: 'quality-upgrade',
    sdkRole: 'mirror',
    privacyScope: 'derived-evidence',
    identityLayer: 'ADDRESS_EVIDENCE',
    canRunOffline: true,
    canUseSdkWithoutCentral: true,
    sendsPersonalDataToPublicLayer: false,
    cacheStrategy: 'versioned-data-pack',
    evidenceLabel: 'Versioned open geography source pack',
  },
  'building-name': {
    workflow: 'building-name',
    label: 'Building, place, and map-feature enrichment',
    primaryAuthority: 'central',
    fallbackAuthorities: ['open-data-pack', 'device'],
    onlineMode: 'central-assisted',
    offlineMode: 'manual-required',
    centralRole: 'quality-upgrade',
    sdkRole: 'consumer',
    privacyScope: 'derived-evidence',
    identityLayer: 'ADDRESS_EVIDENCE',
    canRunOffline: true,
    canUseSdkWithoutCentral: true,
    sendsPersonalDataToPublicLayer: false,
    cacheStrategy: 'read-through-cache',
    evidenceLabel: 'OSM, OpenFreeMap, Overture, or local place data',
  },
  'registered-address-sync': {
    workflow: 'registered-address-sync',
    label: 'Private registered address sync',
    primaryAuthority: 'device',
    fallbackAuthorities: ['central'],
    onlineMode: 'central-assisted',
    offlineMode: 'local-first',
    centralRole: 'optional-private-sync',
    sdkRole: 'consumer',
    privacyScope: 'private-record',
    identityLayer: 'AOID',
    canRunOffline: true,
    canUseSdkWithoutCentral: true,
    sendsPersonalDataToPublicLayer: false,
    cacheStrategy: 'local-cache',
    evidenceLabel: 'Private sync queue, never public distribution',
  },
  'settings-sync': {
    workflow: 'settings-sync',
    label: 'User settings sync',
    primaryAuthority: 'device',
    fallbackAuthorities: ['central'],
    onlineMode: 'central-assisted',
    offlineMode: 'local-first',
    centralRole: 'optional-private-sync',
    sdkRole: 'none',
    privacyScope: 'settings',
    identityLayer: 'SETTINGS',
    canRunOffline: true,
    canUseSdkWithoutCentral: true,
    sendsPersonalDataToPublicLayer: false,
    cacheStrategy: 'local-cache',
    evidenceLabel: 'Local preferences with optional private sync',
  },
  'sdk-package': {
    workflow: 'sdk-package',
    label: 'Portable SDK packages',
    primaryAuthority: 'sdk',
    fallbackAuthorities: ['device', 'open-data-pack'],
    onlineMode: 'sdk-portable',
    offlineMode: 'sdk-portable',
    centralRole: 'none',
    sdkRole: 'core-owner',
    privacyScope: 'public-grid',
    identityLayer: 'AGID',
    canRunOffline: true,
    canUseSdkWithoutCentral: true,
    sendsPersonalDataToPublicLayer: false,
    cacheStrategy: 'versioned-data-pack',
    evidenceLabel: 'Generated SDK core and optional source packs',
  },
};

const SYNC_ENTITY_WORKFLOW: Record<SyncQueueRecord['entityType'], HybridWorkflow> = {
  savedAgid: 'agid-core',
  savedQr: 'registered-address-sync',
  registeredAddress: 'registered-address-sync',
  aoid: 'registered-address-sync',
  settings: 'settings-sync',
  posShipment: 'registered-address-sync',
  posReceipt: 'registered-address-sync',
  posAuditCase: 'registered-address-sync',
  posHandoff: 'registered-address-sync',
  posDeviceDiagnostic: 'settings-sync',
  posCrossBorderDeclaration: 'registered-address-sync',
  posOfflineUsage: 'registered-address-sync',
};

const QUALITY_TIERS = [
  { min: 0.8, tier: 'verified' },
  { min: 0.35, tier: 'partial' },
  { min: Number.NEGATIVE_INFINITY, tier: 'local' },
] as const;

const CENTRAL_ROLES_THAT_CALL = new Set<HybridCentralRole>([
  'quality-upgrade',
  'verification-source',
  'optional-private-sync',
]);

const HYBRID_WORKFLOW_SET = new Set(Object.keys(HYBRID_POLICIES) as HybridWorkflow[]);

export function getHybridPolicy(workflow: HybridWorkflow) {
  return HYBRID_POLICIES[workflow];
}

export function isHybridWorkflow(value: unknown): value is HybridWorkflow {
  return typeof value === 'string' && HYBRID_WORKFLOW_SET.has(value as HybridWorkflow);
}

export function listHybridPolicies() {
  return Object.values(HYBRID_POLICIES);
}

export function getHybridWorkflowForSyncEntity(entityType: SyncQueueRecord['entityType']) {
  return SYNC_ENTITY_WORKFLOW[entityType];
}

export function getHybridSyncEntityPolicy(entityType: SyncQueueRecord['entityType']) {
  return getHybridPolicy(getHybridWorkflowForSyncEntity(entityType));
}

function getQualityTier(policy: HybridPolicy, confidence = 0) {
  const centralEligible = policy.centralRole === 'verification-source';
  const score = centralEligible ? confidence : 0;
  return QUALITY_TIERS.find(({ min }) => score >= min)?.tier ?? 'local';
}

function shouldCallCentral(policy: HybridPolicy, context: HybridRuntimeContext) {
  const centralEligible = CENTRAL_ROLES_THAT_CALL.has(policy.centralRole);
  const optedIn = policy.centralRole !== 'optional-private-sync' || context.userOptedInToSync === true;
  return context.online && centralEligible && optedIn;
}

function getRuntimeMode(policy: HybridPolicy, context: HybridRuntimeContext) {
  const mode = context.online ? policy.onlineMode : policy.offlineMode;
  const dataPackFallback = context.hasOpenDataPack && !context.online && policy.cacheStrategy === 'versioned-data-pack';
  return dataPackFallback ? 'local-first' : mode;
}

export function resolveHybridRuntime(context: HybridRuntimeContext): HybridRuntimeDecision {
  const policy = getHybridPolicy(context.workflow);
  return {
    workflow: policy.workflow,
    mode: getRuntimeMode(policy, context),
    authorities: [policy.primaryAuthority, ...policy.fallbackAuthorities],
    shouldCallCentral: shouldCallCentral(policy, context),
    canRunOffline: policy.canRunOffline,
    canUseSdkWithoutCentral: policy.canUseSdkWithoutCentral,
    qualityTier: getQualityTier(policy, context.centralConfidence),
    privacyScope: policy.privacyScope,
    identityLayer: policy.identityLayer,
    sendsPersonalDataToPublicLayer: false,
    label: policy.evidenceLabel,
  };
}

export function buildHybridEvidenceLabel(context: HybridRuntimeContext) {
  const decision = resolveHybridRuntime(context);
  return `${decision.qualityTier.toUpperCase()} / ${decision.mode} / ${decision.label}`;
}
