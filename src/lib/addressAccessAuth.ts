export const ADDRESS_ACCESS_AUTH_VERSION = 'agid-address-access-auth-v1';

export const ADDRESS_ACCESS_SCOPES = [
  'delivery:eligible',
  'delivery:read',
  'recipient:verify',
  'return:label',
  'aid:eligibility',
  'region:coarse',
  'address:quality',
  'agid-s:decrypt',
  'aoid:commitment',
  'aoid:private-read',
  'revocation:read',
  'issuer:trust-read',
  'handoff:complete',
  'audit:read',
  'audit:write',
] as const;

export const ADDRESS_ACCESS_ACTORS = [
  'merchant',
  'carrier',
  'recipient',
  'pos-staff',
  'ngo',
  'municipality',
  'issuer',
  'auditor',
  'admin',
  'shopping-agent',
  'warehouse',
  'delivery-agent',
  'drone-operator',
  'system',
] as const;

export const ADDRESS_ACCESS_PURPOSES = [
  'delivery',
  'return',
  'aid',
  'identity',
  'customs',
  'audit',
  'support',
  'emergency',
  'registration',
  'agent',
] as const;

export const ADDRESS_ACCESS_RESOURCES = [
  'public-agid',
  'coarse-region',
  'address-quality',
  'delivery-eligibility',
  'agid-s-envelope',
  'agid-s-plaintext',
  'aoid-reference',
  'aoid-commitment',
  'aoid-private-descriptor',
  'raw-address',
  'recipient-proof',
  'shipping-label',
  'return-label',
  'delivery-handoff',
  'revocation-status',
  'issuer-trust-status',
  'audit-report',
  'webhook-event',
  'terminal-device',
  'waybill-alias',
  'nullifier-status',
] as const;

export const ADDRESS_ACCESS_EXECUTION_MODES = [
  'local-only',
  'server-registry',
  'zk-only',
  'ethereum-registry',
  'full-zk-ethereum',
] as const;

export const ADDRESS_ACCESS_DECISIONS = ['allow', 'challenge', 'review', 'deny'] as const;

export type AddressAccessScope = typeof ADDRESS_ACCESS_SCOPES[number];
export type AddressAccessActor = typeof ADDRESS_ACCESS_ACTORS[number];
export type AddressAccessPurpose = typeof ADDRESS_ACCESS_PURPOSES[number];
export type AddressAccessResource = typeof ADDRESS_ACCESS_RESOURCES[number];
export type AddressAccessExecutionMode = typeof ADDRESS_ACCESS_EXECUTION_MODES[number];
export type AddressAccessDecision = typeof ADDRESS_ACCESS_DECISIONS[number];

export type AddressAccessControl =
  | 'consent-proof'
  | 'purpose-bound-token'
  | 'audience-bound-token'
  | 'short-ttl'
  | 'freshness-check'
  | 'revocation-check'
  | 'issuer-trust-check'
  | 'device-trust'
  | 'recipient-live-challenge'
  | 'no-plaintext-persistence'
  | 'domain-separated-nullifier'
  | 'commitment-only-logging'
  | 'manual-review'
  | 'encrypted-channel'
  | 'staff-role-check'
  | 'api-key-scope-check'
  | 'zk-proof'
  | 'signed-receipt'
  | 'rate-limit';

export type AddressAccessForbiddenDisclosure =
  | 'raw-address'
  | 'raw-aoid'
  | 'agid-s-plaintext'
  | 'precise-coordinate'
  | 'recipient-name'
  | 'phone-number'
  | 'unit-room'
  | 'private-delivery-instruction'
  | 'proof-secret'
  | 'credential-secret'
  | 'cross-purpose-nullifier'
  | 'persistent-decrypted-payload'
  | 'raw-history';

export type AddressAccessScopePolicy = {
  scope: AddressAccessScope;
  label: string;
  description: string;
  allowedActors: AddressAccessActor[];
  allowedPurposes: AddressAccessPurpose[];
  allowedResources: AddressAccessResource[];
  requiredControls: AddressAccessControl[];
  highRiskRequiredControls: AddressAccessControl[];
  forbiddenDisclosures: AddressAccessForbiddenDisclosure[];
  ttlSeconds: number;
  highRiskTtlSeconds: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
};

export type AddressAccessRequest = {
  actor?: AddressAccessActor | string;
  purpose?: AddressAccessPurpose | string;
  requestedScopes?: Array<AddressAccessScope | string>;
  resource?: AddressAccessResource | string;
  mode?: AddressAccessExecutionMode | 'local' | 'server' | 'zk' | 'ethereum' | 'full' | string;
  audience?: string;
  highRiskMode?: boolean;
  hasConsentProof?: boolean;
  hasRecipientChallenge?: boolean;
  hasDeviceTrust?: boolean;
  hasIssuerTrust?: boolean;
  hasFreshness?: boolean;
  hasRevocationCheck?: boolean;
  hasApiKeyScope?: boolean;
  hasAudienceBinding?: boolean;
  hasDomainSeparation?: boolean;
  hasEncryptedChannel?: boolean;
  hasSignedReceipt?: boolean;
  hasZkProof?: boolean;
  staffRoleVerified?: boolean;
  rateLimitChecked?: boolean;
  manualReviewApproved?: boolean;
  breakGlass?: boolean;
  persistsPlaintext?: boolean;
  logsRawPayload?: boolean;
  tokenIssuedAt?: string;
  tokenExpiresAt?: string;
  now?: string;
};

export type AddressAccessDecisionResult = {
  version: typeof ADDRESS_ACCESS_AUTH_VERSION;
  decision: AddressAccessDecision;
  actor: AddressAccessActor;
  purpose: AddressAccessPurpose;
  resource: AddressAccessResource;
  mode: AddressAccessExecutionMode;
  allowedScopes: AddressAccessScope[];
  deniedScopes: Array<{
    scope: AddressAccessScope | string;
    reason: string;
  }>;
  requiredScopes: AddressAccessScope[];
  requiredControls: AddressAccessControl[];
  missingControls: AddressAccessControl[];
  forbiddenDisclosures: AddressAccessForbiddenDisclosure[];
  reasons: string[];
  warnings: string[];
  tokenPolicy: {
    ttlSeconds: number;
    domainSeparationRequired: true;
    audienceBound: true;
    oneTimeUseRecommended: boolean;
  };
  privacy: {
    rawAddressAllowed: boolean;
    rawAoidAllowed: boolean;
    agidSPlaintextAllowed: boolean;
    commitmentPreferred: boolean;
    disclosureClass: 'public-claim' | 'commitment' | 'private-plaintext' | 'forbidden';
  };
};

const DELIVERY_ACTORS: AddressAccessActor[] = [
  'carrier',
  'pos-staff',
  'warehouse',
  'delivery-agent',
  'drone-operator',
  'system',
];

const ADDRESS_ACCESS_SCOPE_POLICIES: Record<AddressAccessScope, AddressAccessScopePolicy> = {
  'delivery:eligible': {
    scope: 'delivery:eligible',
    label: 'Delivery Eligibility',
    description: 'Prove or query whether delivery is possible without disclosing the address.',
    allowedActors: ['merchant', 'carrier', 'pos-staff', 'ngo', 'shopping-agent', 'warehouse', 'system'],
    allowedPurposes: ['delivery', 'aid', 'customs', 'agent'],
    allowedResources: ['delivery-eligibility', 'address-quality', 'coarse-region', 'nullifier-status'],
    requiredControls: ['consent-proof', 'purpose-bound-token', 'freshness-check', 'revocation-check', 'issuer-trust-check', 'domain-separated-nullifier', 'rate-limit'],
    highRiskRequiredControls: ['zk-proof', 'short-ttl'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'recipient-name', 'phone-number', 'unit-room', 'precise-coordinate'],
    ttlSeconds: 900,
    highRiskTtlSeconds: 300,
    risk: 'medium',
  },
  'delivery:read': {
    scope: 'delivery:read',
    label: 'Delivery Read',
    description: 'Read the minimum delivery routing material needed for a handoff.',
    allowedActors: DELIVERY_ACTORS,
    allowedPurposes: ['delivery', 'return'],
    allowedResources: ['public-agid', 'agid-s-envelope', 'shipping-label', 'delivery-handoff', 'waybill-alias', 'address-quality', 'revocation-status'],
    requiredControls: ['consent-proof', 'purpose-bound-token', 'freshness-check', 'revocation-check', 'device-trust', 'no-plaintext-persistence', 'commitment-only-logging', 'api-key-scope-check'],
    highRiskRequiredControls: ['recipient-live-challenge', 'short-ttl', 'signed-receipt'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'recipient-name', 'phone-number', 'unit-room', 'private-delivery-instruction'],
    ttlSeconds: 900,
    highRiskTtlSeconds: 300,
    risk: 'high',
  },
  'recipient:verify': {
    scope: 'recipient:verify',
    label: 'Recipient Verification',
    description: 'Verify recipient control without storing recipient proof material.',
    allowedActors: ['merchant', 'carrier', 'recipient', 'pos-staff', 'ngo', 'warehouse', 'delivery-agent', 'system'],
    allowedPurposes: ['delivery', 'return', 'identity', 'aid'],
    allowedResources: ['recipient-proof', 'delivery-handoff', 'nullifier-status', 'audit-report'],
    requiredControls: ['purpose-bound-token', 'recipient-live-challenge', 'domain-separated-nullifier', 'no-plaintext-persistence', 'commitment-only-logging', 'rate-limit'],
    highRiskRequiredControls: ['device-trust', 'short-ttl'],
    forbiddenDisclosures: ['proof-secret', 'credential-secret', 'recipient-name', 'phone-number', 'raw-address', 'raw-aoid'],
    ttlSeconds: 600,
    highRiskTtlSeconds: 180,
    risk: 'high',
  },
  'return:label': {
    scope: 'return:label',
    label: 'Return Label',
    description: 'Create a return label or alias without exposing the full private address by default.',
    allowedActors: ['merchant', 'carrier', 'recipient', 'pos-staff', 'warehouse', 'system'],
    allowedPurposes: ['return'],
    allowedResources: ['return-label', 'shipping-label', 'waybill-alias', 'address-quality', 'revocation-status'],
    requiredControls: ['consent-proof', 'purpose-bound-token', 'freshness-check', 'revocation-check', 'commitment-only-logging'],
    highRiskRequiredControls: ['recipient-live-challenge', 'short-ttl'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'phone-number', 'unit-room', 'private-delivery-instruction'],
    ttlSeconds: 1800,
    highRiskTtlSeconds: 300,
    risk: 'medium',
  },
  'aid:eligibility': {
    scope: 'aid:eligibility',
    label: 'Aid Eligibility',
    description: 'Verify humanitarian or emergency eligibility with coarse predicates and anti-duplication.',
    allowedActors: ['ngo', 'municipality', 'pos-staff', 'auditor', 'system'],
    allowedPurposes: ['aid', 'emergency', 'audit'],
    allowedResources: ['coarse-region', 'delivery-eligibility', 'recipient-proof', 'nullifier-status', 'audit-report', 'revocation-status'],
    requiredControls: ['purpose-bound-token', 'issuer-trust-check', 'freshness-check', 'revocation-check', 'domain-separated-nullifier', 'commitment-only-logging', 'rate-limit'],
    highRiskRequiredControls: ['zk-proof', 'recipient-live-challenge', 'short-ttl', 'manual-review'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'precise-coordinate', 'recipient-name', 'phone-number', 'unit-room', 'raw-history'],
    ttlSeconds: 900,
    highRiskTtlSeconds: 180,
    risk: 'high',
  },
  'region:coarse': {
    scope: 'region:coarse',
    label: 'Coarse Region',
    description: 'Reveal only a country, city, zone, or policy region.',
    allowedActors: ['merchant', 'carrier', 'recipient', 'pos-staff', 'ngo', 'municipality', 'shopping-agent', 'auditor', 'system'],
    allowedPurposes: ['delivery', 'return', 'aid', 'identity', 'customs', 'audit', 'agent'],
    allowedResources: ['coarse-region'],
    requiredControls: ['purpose-bound-token', 'consent-proof', 'freshness-check', 'commitment-only-logging'],
    highRiskRequiredControls: ['short-ttl'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'precise-coordinate', 'unit-room'],
    ttlSeconds: 1800,
    highRiskTtlSeconds: 300,
    risk: 'low',
  },
  'address:quality': {
    scope: 'address:quality',
    label: 'Address Quality',
    description: 'Expose only a quality decision, not the underlying address.',
    allowedActors: ['merchant', 'carrier', 'pos-staff', 'ngo', 'municipality', 'issuer', 'auditor', 'shopping-agent', 'system'],
    allowedPurposes: ['delivery', 'return', 'aid', 'customs', 'audit', 'agent', 'registration'],
    allowedResources: ['address-quality'],
    requiredControls: ['purpose-bound-token', 'commitment-only-logging', 'rate-limit'],
    highRiskRequiredControls: ['freshness-check'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'recipient-name', 'phone-number', 'unit-room'],
    ttlSeconds: 3600,
    highRiskTtlSeconds: 300,
    risk: 'low',
  },
  'agid-s:decrypt': {
    scope: 'agid-s:decrypt',
    label: 'AGID-S Decrypt',
    description: 'Decrypt a secure AGID envelope only for the intended audience and purpose.',
    allowedActors: ['carrier', 'recipient', 'pos-staff', 'ngo', 'delivery-agent', 'drone-operator', 'system'],
    allowedPurposes: ['delivery', 'return', 'aid', 'emergency'],
    allowedResources: ['agid-s-plaintext'],
    requiredControls: ['consent-proof', 'purpose-bound-token', 'audience-bound-token', 'freshness-check', 'revocation-check', 'device-trust', 'encrypted-channel', 'no-plaintext-persistence', 'commitment-only-logging', 'api-key-scope-check'],
    highRiskRequiredControls: ['recipient-live-challenge', 'short-ttl', 'signed-receipt'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'persistent-decrypted-payload', 'private-delivery-instruction'],
    ttlSeconds: 300,
    highRiskTtlSeconds: 120,
    risk: 'critical',
  },
  'aoid:commitment': {
    scope: 'aoid:commitment',
    label: 'AOID Commitment',
    description: 'Use an AOID reference or commitment without revealing the AOID body.',
    allowedActors: ['merchant', 'carrier', 'recipient', 'pos-staff', 'ngo', 'municipality', 'issuer', 'auditor', 'shopping-agent', 'system'],
    allowedPurposes: ['delivery', 'return', 'aid', 'identity', 'audit', 'registration', 'agent'],
    allowedResources: ['aoid-reference', 'aoid-commitment', 'nullifier-status'],
    requiredControls: ['purpose-bound-token', 'domain-separated-nullifier', 'commitment-only-logging'],
    highRiskRequiredControls: ['freshness-check', 'revocation-check'],
    forbiddenDisclosures: ['raw-aoid', 'raw-address', 'credential-secret', 'cross-purpose-nullifier'],
    ttlSeconds: 3600,
    highRiskTtlSeconds: 300,
    risk: 'medium',
  },
  'aoid:private-read': {
    scope: 'aoid:private-read',
    label: 'AOID Private Read',
    description: 'Owner/admin-only private AOID material access; not for ordinary merchant or carrier flows.',
    allowedActors: ['recipient', 'admin', 'system'],
    allowedPurposes: ['identity', 'registration', 'support', 'emergency'],
    allowedResources: ['aoid-private-descriptor', 'raw-address'],
    requiredControls: ['consent-proof', 'purpose-bound-token', 'audience-bound-token', 'freshness-check', 'revocation-check', 'device-trust', 'encrypted-channel', 'no-plaintext-persistence', 'commitment-only-logging', 'manual-review'],
    highRiskRequiredControls: ['recipient-live-challenge', 'short-ttl', 'signed-receipt'],
    forbiddenDisclosures: ['persistent-decrypted-payload', 'raw-history', 'proof-secret', 'credential-secret'],
    ttlSeconds: 300,
    highRiskTtlSeconds: 120,
    risk: 'critical',
  },
  'revocation:read': {
    scope: 'revocation:read',
    label: 'Revocation Read',
    description: 'Read revocation status without exposing private address material.',
    allowedActors: ['merchant', 'carrier', 'recipient', 'pos-staff', 'ngo', 'municipality', 'issuer', 'auditor', 'shopping-agent', 'warehouse', 'delivery-agent', 'drone-operator', 'system'],
    allowedPurposes: ['delivery', 'return', 'aid', 'identity', 'customs', 'audit', 'support', 'registration', 'agent'],
    allowedResources: ['revocation-status', 'nullifier-status'],
    requiredControls: ['purpose-bound-token', 'rate-limit'],
    highRiskRequiredControls: ['commitment-only-logging'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'raw-history'],
    ttlSeconds: 3600,
    highRiskTtlSeconds: 300,
    risk: 'low',
  },
  'issuer:trust-read': {
    scope: 'issuer:trust-read',
    label: 'Issuer Trust Read',
    description: 'Read issuer trust or key status metadata.',
    allowedActors: ['merchant', 'carrier', 'recipient', 'pos-staff', 'ngo', 'municipality', 'issuer', 'auditor', 'shopping-agent', 'warehouse', 'delivery-agent', 'drone-operator', 'system'],
    allowedPurposes: ['delivery', 'return', 'aid', 'identity', 'customs', 'audit', 'support', 'registration', 'agent'],
    allowedResources: ['issuer-trust-status'],
    requiredControls: ['purpose-bound-token', 'rate-limit'],
    highRiskRequiredControls: ['commitment-only-logging'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'credential-secret'],
    ttlSeconds: 3600,
    highRiskTtlSeconds: 300,
    risk: 'low',
  },
  'handoff:complete': {
    scope: 'handoff:complete',
    label: 'Handoff Complete',
    description: 'Finalize a delivery or pickup handoff with signed carrier/POS and recipient evidence.',
    allowedActors: ['carrier', 'recipient', 'pos-staff', 'warehouse', 'delivery-agent', 'drone-operator', 'system'],
    allowedPurposes: ['delivery', 'return', 'aid'],
    allowedResources: ['delivery-handoff', 'audit-report', 'nullifier-status'],
    requiredControls: ['purpose-bound-token', 'freshness-check', 'revocation-check', 'device-trust', 'recipient-live-challenge', 'signed-receipt', 'domain-separated-nullifier', 'commitment-only-logging'],
    highRiskRequiredControls: ['short-ttl', 'manual-review'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'recipient-name', 'phone-number', 'proof-secret'],
    ttlSeconds: 600,
    highRiskTtlSeconds: 180,
    risk: 'high',
  },
  'audit:read': {
    scope: 'audit:read',
    label: 'Audit Read',
    description: 'Read redacted audit results and reason codes.',
    allowedActors: ['auditor', 'admin', 'municipality', 'ngo', 'system'],
    allowedPurposes: ['audit', 'aid', 'support'],
    allowedResources: ['audit-report', 'webhook-event'],
    requiredControls: ['purpose-bound-token', 'api-key-scope-check', 'commitment-only-logging', 'rate-limit'],
    highRiskRequiredControls: ['manual-review'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'proof-secret', 'credential-secret', 'raw-history'],
    ttlSeconds: 1800,
    highRiskTtlSeconds: 300,
    risk: 'medium',
  },
  'audit:write': {
    scope: 'audit:write',
    label: 'Audit Write',
    description: 'Write a redacted audit event or re-verification report.',
    allowedActors: ['auditor', 'admin', 'pos-staff', 'carrier', 'system'],
    allowedPurposes: ['audit', 'delivery', 'return', 'aid', 'support'],
    allowedResources: ['audit-report', 'webhook-event', 'delivery-handoff'],
    requiredControls: ['purpose-bound-token', 'api-key-scope-check', 'device-trust', 'signed-receipt', 'commitment-only-logging'],
    highRiskRequiredControls: ['manual-review', 'short-ttl'],
    forbiddenDisclosures: ['raw-address', 'raw-aoid', 'recipient-name', 'phone-number', 'proof-secret', 'credential-secret'],
    ttlSeconds: 1800,
    highRiskTtlSeconds: 300,
    risk: 'medium',
  },
};

const RESOURCE_SCOPE_OPTIONS: Record<AddressAccessResource, AddressAccessScope[]> = {
  'public-agid': ['delivery:read'],
  'coarse-region': ['region:coarse', 'aid:eligibility', 'delivery:eligible'],
  'address-quality': ['address:quality', 'delivery:eligible', 'delivery:read', 'return:label'],
  'delivery-eligibility': ['delivery:eligible', 'aid:eligibility'],
  'agid-s-envelope': ['delivery:read'],
  'agid-s-plaintext': ['agid-s:decrypt'],
  'aoid-reference': ['aoid:commitment'],
  'aoid-commitment': ['aoid:commitment'],
  'aoid-private-descriptor': ['aoid:private-read'],
  'raw-address': ['aoid:private-read'],
  'recipient-proof': ['recipient:verify', 'aid:eligibility'],
  'shipping-label': ['delivery:read', 'return:label'],
  'return-label': ['return:label'],
  'delivery-handoff': ['delivery:read', 'recipient:verify', 'handoff:complete', 'audit:write'],
  'revocation-status': ['revocation:read', 'delivery:read', 'return:label', 'aid:eligibility'],
  'issuer-trust-status': ['issuer:trust-read'],
  'audit-report': ['audit:read', 'audit:write', 'recipient:verify', 'handoff:complete', 'aid:eligibility'],
  'webhook-event': ['audit:read', 'audit:write'],
  'terminal-device': ['audit:write'],
  'waybill-alias': ['delivery:read', 'return:label'],
  'nullifier-status': ['revocation:read', 'aoid:commitment', 'recipient:verify', 'handoff:complete', 'aid:eligibility'],
};

const SENSITIVE_RESOURCES = new Set<AddressAccessResource>([
  'agid-s-plaintext',
  'aoid-private-descriptor',
  'raw-address',
]);

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function normalizeToken(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ':')
    .replace(/\s+/g, '-');
}

function normalizeScope(value: unknown): AddressAccessScope | undefined {
  const normalized = normalizeToken(value);
  const aliases: Record<string, AddressAccessScope> = {
    delivery: 'delivery:eligible',
    'delivery:eligibility': 'delivery:eligible',
    'delivery-eligible': 'delivery:eligible',
    'delivery-read': 'delivery:read',
    recipient: 'recipient:verify',
    'recipient-proof': 'recipient:verify',
    'recipient-control': 'recipient:verify',
    return: 'return:label',
    'return-label': 'return:label',
    aid: 'aid:eligibility',
    humanitarian: 'aid:eligibility',
    region: 'region:coarse',
    'coarse-region': 'region:coarse',
    quality: 'address:quality',
    'address-quality': 'address:quality',
    'agids:decrypt': 'agid-s:decrypt',
    'agid-s-decrypt': 'agid-s:decrypt',
    'aoid-commitment': 'aoid:commitment',
    'aoid-private': 'aoid:private-read',
    revocation: 'revocation:read',
    'issuer-trust': 'issuer:trust-read',
    handoff: 'handoff:complete',
    audit: 'audit:read',
  };
  const aliased = aliases[normalized] ?? aliases[normalized.replace(/:/g, '-')];
  if (aliased) return aliased;
  return ADDRESS_ACCESS_SCOPES.includes(normalized as AddressAccessScope)
    ? normalized as AddressAccessScope
    : undefined;
}

function normalizeActor(value: unknown): AddressAccessActor {
  const normalized = normalizeToken(value).replace(/:/g, '-');
  const aliases: Record<string, AddressAccessActor> = {
    operator: 'pos-staff',
    cashier: 'pos-staff',
    staff: 'pos-staff',
    delivery: 'delivery-agent',
    driver: 'delivery-agent',
    shopper: 'shopping-agent',
    agent: 'shopping-agent',
    localgovernment: 'municipality',
    government: 'municipality',
  };
  const aliased = aliases[normalized];
  if (aliased) return aliased;
  return ADDRESS_ACCESS_ACTORS.includes(normalized as AddressAccessActor)
    ? normalized as AddressAccessActor
    : 'merchant';
}

function normalizePurpose(value: unknown): AddressAccessPurpose {
  const normalized = normalizeToken(value).replace(/:/g, '-');
  const aliases: Record<string, AddressAccessPurpose> = {
    humanitarian: 'aid',
    relief: 'aid',
    shipping: 'delivery',
    pickup: 'delivery',
    registration: 'registration',
    kyc: 'identity',
    verification: 'identity',
  };
  const aliased = aliases[normalized];
  if (aliased) return aliased;
  return ADDRESS_ACCESS_PURPOSES.includes(normalized as AddressAccessPurpose)
    ? normalized as AddressAccessPurpose
    : 'delivery';
}

function normalizeResource(value: unknown): AddressAccessResource {
  const normalized = normalizeToken(value).replace(/:/g, '-');
  const aliases: Record<string, AddressAccessResource> = {
    agid: 'public-agid',
    publicagid: 'public-agid',
    region: 'coarse-region',
    quality: 'address-quality',
    'delivery-eligible': 'delivery-eligibility',
    agids: 'agid-s-envelope',
    'agid-s': 'agid-s-envelope',
    'agids-plaintext': 'agid-s-plaintext',
    'agid-s-decrypted': 'agid-s-plaintext',
    aoid: 'aoid-reference',
    'aoid-private': 'aoid-private-descriptor',
    address: 'raw-address',
    recipient: 'recipient-proof',
    label: 'shipping-label',
    waybill: 'waybill-alias',
    handoff: 'delivery-handoff',
    revocation: 'revocation-status',
    issuer: 'issuer-trust-status',
    audit: 'audit-report',
    webhook: 'webhook-event',
    terminal: 'terminal-device',
    nullifier: 'nullifier-status',
  };
  const aliased = aliases[normalized];
  if (aliased) return aliased;
  return ADDRESS_ACCESS_RESOURCES.includes(normalized as AddressAccessResource)
    ? normalized as AddressAccessResource
    : 'delivery-eligibility';
}

function normalizeMode(value: unknown): AddressAccessExecutionMode {
  const normalized = normalizeToken(value).replace(/:/g, '-');
  const aliases: Record<string, AddressAccessExecutionMode> = {
    local: 'local-only',
    'mode-0': 'local-only',
    server: 'server-registry',
    'mode-1': 'server-registry',
    zk: 'zk-only',
    'mode-2': 'zk-only',
    ethereum: 'ethereum-registry',
    'mode-3': 'ethereum-registry',
    full: 'full-zk-ethereum',
    'mode-4': 'full-zk-ethereum',
  };
  const aliased = aliases[normalized];
  if (aliased) return aliased;
  return ADDRESS_ACCESS_EXECUTION_MODES.includes(normalized as AddressAccessExecutionMode)
    ? normalized as AddressAccessExecutionMode
    : 'local-only';
}

function validIso(value: unknown): string | undefined {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

function isExpired(input: AddressAccessRequest): boolean {
  const expiresAt = validIso(input.tokenExpiresAt);
  if (!expiresAt) return false;
  const now = Date.parse(validIso(input.now) ?? new Date().toISOString());
  return Date.parse(expiresAt) <= now;
}

function maxTokenAgeExceeded(input: AddressAccessRequest, ttlSeconds: number): boolean {
  const issuedAt = validIso(input.tokenIssuedAt);
  if (!issuedAt) return false;
  const now = Date.parse(validIso(input.now) ?? new Date().toISOString());
  return now - Date.parse(issuedAt) > ttlSeconds * 1000;
}

function controlSatisfied(control: AddressAccessControl, request: AddressAccessRequest, policyCompatible = true): boolean {
  switch (control) {
    case 'consent-proof':
      return Boolean(request.hasConsentProof || request.actor === 'recipient');
    case 'purpose-bound-token':
      return policyCompatible;
    case 'audience-bound-token':
      return Boolean(request.hasAudienceBinding || request.audience);
    case 'short-ttl':
      return Boolean(validIso(request.tokenExpiresAt) || validIso(request.tokenIssuedAt));
    case 'freshness-check':
      return Boolean(request.hasFreshness);
    case 'revocation-check':
      return Boolean(request.hasRevocationCheck);
    case 'issuer-trust-check':
      return Boolean(request.hasIssuerTrust);
    case 'device-trust':
      return Boolean(request.hasDeviceTrust || request.actor === 'recipient');
    case 'recipient-live-challenge':
      return Boolean(request.hasRecipientChallenge);
    case 'no-plaintext-persistence':
      return request.persistsPlaintext !== true;
    case 'domain-separated-nullifier':
      return Boolean(request.hasDomainSeparation);
    case 'commitment-only-logging':
      return request.logsRawPayload !== true;
    case 'manual-review':
      return Boolean(request.manualReviewApproved);
    case 'encrypted-channel':
      return Boolean(request.hasEncryptedChannel || request.mode === 'local-only');
    case 'staff-role-check':
      return request.actor !== 'pos-staff' || Boolean(request.staffRoleVerified);
    case 'api-key-scope-check':
      return Boolean(request.hasApiKeyScope || request.mode === 'local-only' || request.actor === 'recipient');
    case 'zk-proof':
      return Boolean(request.hasZkProof || request.mode === 'zk-only' || request.mode === 'full-zk-ethereum');
    case 'signed-receipt':
      return Boolean(request.hasSignedReceipt);
    case 'rate-limit':
      return Boolean(request.rateLimitChecked || request.mode === 'local-only');
    default:
      return false;
  }
}

function scopePolicy(scope: AddressAccessScope): AddressAccessScopePolicy {
  return ADDRESS_ACCESS_SCOPE_POLICIES[scope];
}

function disclosureClass(resource: AddressAccessResource, decision: AddressAccessDecision): AddressAccessDecisionResult['privacy']['disclosureClass'] {
  if (decision === 'deny') return 'forbidden';
  if (resource === 'raw-address' || resource === 'aoid-private-descriptor' || resource === 'agid-s-plaintext') return 'private-plaintext';
  if (resource === 'aoid-commitment' || resource === 'aoid-reference' || resource === 'nullifier-status') return 'commitment';
  return 'public-claim';
}

export function getAddressAccessScopePolicy(scope: AddressAccessScope): AddressAccessScopePolicy {
  return scopePolicy(scope);
}

export function listAddressAccessScopePolicies(): AddressAccessScopePolicy[] {
  return ADDRESS_ACCESS_SCOPES.map(scope => scopePolicy(scope));
}

export function evaluateAddressAccess(input: AddressAccessRequest): AddressAccessDecisionResult {
  const actor = normalizeActor(input.actor);
  const purpose = normalizePurpose(input.purpose);
  const resource = normalizeResource(input.resource);
  const mode = normalizeMode(input.mode);
  const requestedScopes = unique((input.requestedScopes ?? []).map(normalizeScope).filter(Boolean) as AddressAccessScope[]);
  const rawRequestedScopes = input.requestedScopes ?? [];
  const highRiskMode = Boolean(input.highRiskMode);
  const requiredForResource = RESOURCE_SCOPE_OPTIONS[resource];
  const allowedScopes: AddressAccessScope[] = [];
  const deniedScopes: AddressAccessDecisionResult['deniedScopes'] = [];
  const reasons: string[] = [];
  const warnings: string[] = [];
  const requiredControls: AddressAccessControl[] = [];
  const missingControls: AddressAccessControl[] = [];
  const forbiddenDisclosures: AddressAccessForbiddenDisclosure[] = [];

  for (const rawScope of rawRequestedScopes) {
    if (!normalizeScope(rawScope)) deniedScopes.push({ scope: String(rawScope), reason: 'unknown-scope' });
  }

  if (requestedScopes.length === 0) reasons.push('address-access-requires-at-least-one-scope');

  const matchingResourceScopes = requestedScopes.filter(scope => requiredForResource.includes(scope));
  const requiredScopes = matchingResourceScopes.length > 0 ? [] : requiredForResource;
  if (requiredScopes.length > 0) reasons.push(`resource-${resource}-requires-scope:${requiredScopes.join('|')}`);

  let minTtl = Number.POSITIVE_INFINITY;
  let anyPolicyCompatible = false;
  for (const scope of requestedScopes) {
    const policy = scopePolicy(scope);
    const resourceAllowed = policy.allowedResources.includes(resource);
    const actorAllowed = policy.allowedActors.includes(actor);
    const purposeAllowed = policy.allowedPurposes.includes(purpose);
    const policyCompatible = resourceAllowed && actorAllowed && purposeAllowed;

    minTtl = Math.min(minTtl, highRiskMode ? policy.highRiskTtlSeconds : policy.ttlSeconds);
    forbiddenDisclosures.push(...policy.forbiddenDisclosures);

    if (!resourceAllowed) {
      deniedScopes.push({ scope, reason: `scope-does-not-allow-resource:${resource}` });
      continue;
    }
    if (!actorAllowed) {
      deniedScopes.push({ scope, reason: `scope-not-allowed-for-actor:${actor}` });
      continue;
    }
    if (!purposeAllowed) {
      deniedScopes.push({ scope, reason: `scope-not-allowed-for-purpose:${purpose}` });
      continue;
    }

    anyPolicyCompatible = true;
    allowedScopes.push(scope);
    requiredControls.push(...policy.requiredControls);
    if (highRiskMode) requiredControls.push(...policy.highRiskRequiredControls);
    if (actor === 'pos-staff') requiredControls.push('staff-role-check');

    for (const control of unique([
      ...policy.requiredControls,
      ...(highRiskMode ? policy.highRiskRequiredControls : []),
      ...(actor === 'pos-staff' ? ['staff-role-check' as const] : []),
    ])) {
      if (!controlSatisfied(control, { ...input, actor, purpose, resource, mode }, policyCompatible)) {
        missingControls.push(control);
      }
    }
  }

  const ttlSeconds = Number.isFinite(minTtl) ? minTtl : 300;
  if (isExpired(input)) reasons.push('token-expired');
  if (maxTokenAgeExceeded(input, ttlSeconds)) reasons.push('token-ttl-exceeded');
  if (input.persistsPlaintext && SENSITIVE_RESOURCES.has(resource)) reasons.push('sensitive-resource-cannot-be-persisted-plaintext');
  if (input.logsRawPayload) reasons.push('raw-payload-logging-is-not-allowed');

  if (resource === 'raw-address' && actor !== 'recipient' && actor !== 'admin' && actor !== 'system') {
    reasons.push('raw-address-is-owner-admin-only');
  }
  if (resource === 'aoid-private-descriptor' && actor !== 'recipient' && actor !== 'admin' && actor !== 'system') {
    reasons.push('aoid-private-descriptor-is-owner-admin-only');
  }
  if (resource === 'agid-s-plaintext' && !requestedScopes.includes('agid-s:decrypt')) {
    reasons.push('agid-s-plaintext-requires-agid-s-decrypt-scope');
  }
  if (purpose === 'emergency' && !input.breakGlass && missingControls.includes('consent-proof')) {
    warnings.push('emergency-access-without-consent-requires-break-glass-review');
  }
  if (mode === 'local-only' && (requestedScopes.includes('audit:read') || requestedScopes.includes('audit:write'))) {
    warnings.push('local-only-audit-results-need-later-sync-for-cross-party-review');
  }
  if (mode === 'server-registry' && requestedScopes.includes('agid-s:decrypt')) {
    warnings.push('server-registry-mode-must-not-upload-decrypted-agid-s-payloads');
  }
  if ((mode === 'ethereum-registry' || mode === 'full-zk-ethereum') && SENSITIVE_RESOURCES.has(resource)) {
    warnings.push('do-not-put-address-agid-s-plaintext-or-aoid-private-material-on-chain');
  }

  let decision: AddressAccessDecision = 'allow';
  if (
    requestedScopes.length === 0
    || requiredScopes.length > 0
    || !anyPolicyCompatible
    || reasons.includes('token-expired')
    || reasons.includes('token-ttl-exceeded')
    || reasons.includes('raw-address-is-owner-admin-only')
    || reasons.includes('aoid-private-descriptor-is-owner-admin-only')
    || reasons.includes('sensitive-resource-cannot-be-persisted-plaintext')
    || reasons.includes('raw-payload-logging-is-not-allowed')
  ) {
    decision = 'deny';
  } else if (missingControls.includes('manual-review') || (purpose === 'emergency' && !input.breakGlass && !input.hasConsentProof)) {
    decision = 'review';
  } else if (missingControls.length > 0 || (SENSITIVE_RESOURCES.has(resource) && !input.hasAudienceBinding)) {
    decision = 'challenge';
  }

  return {
    version: ADDRESS_ACCESS_AUTH_VERSION,
    decision,
    actor,
    purpose,
    resource,
    mode,
    allowedScopes: unique(allowedScopes),
    deniedScopes,
    requiredScopes: unique(requiredScopes),
    requiredControls: unique(requiredControls),
    missingControls: unique(missingControls),
    forbiddenDisclosures: unique(forbiddenDisclosures),
    reasons: unique(reasons),
    warnings: unique(warnings),
    tokenPolicy: {
      ttlSeconds,
      domainSeparationRequired: true,
      audienceBound: true,
      oneTimeUseRecommended: highRiskMode
        || resource === 'agid-s-plaintext'
        || resource === 'recipient-proof'
        || resource === 'delivery-handoff'
        || requestedScopes.includes('recipient:verify')
        || requestedScopes.includes('handoff:complete'),
    },
    privacy: {
      rawAddressAllowed: decision === 'allow' && resource === 'raw-address',
      rawAoidAllowed: decision === 'allow' && resource === 'aoid-private-descriptor',
      agidSPlaintextAllowed: decision === 'allow' && resource === 'agid-s-plaintext',
      commitmentPreferred: resource !== 'public-agid' && resource !== 'coarse-region' && resource !== 'address-quality',
      disclosureClass: disclosureClass(resource, decision),
    },
  };
}
