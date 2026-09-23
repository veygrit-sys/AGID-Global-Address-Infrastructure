import {
  ADDRESS_INTENT_MODES,
  ADDRESS_INTENT_PURPOSES,
  type AddressIntentMode,
  type AddressIntentPurpose,
} from './addressIntent';
import type { AddressElementQualityDecision, AddressElementSession } from './addressElement';
import { sha256Hex } from './sha256';

export const ADDRESS_LINK_MODEL_VERSION = 'agid-address-link-v1';

export const ADDRESS_LINK_SURFACES = ['ec', 'pos', 'cms', 'shopping-agent'] as const;
export const ADDRESS_LINK_CAPABILITIES = [
  'delivery-eligibility',
  'recipient-confirmation',
  'coarse-region',
  'address-quality',
  'return-label',
] as const;
export const ADDRESS_LINK_SCOPES = [
  'delivery:eligible',
  'recipient:verify',
  'region:coarse',
  'address:quality',
  'return:label',
] as const;
export const ADDRESS_LINK_STATUSES = [
  'requires-consent',
  'ready',
  'requires-proof',
  'requires-review',
  'rejected',
  'expired',
] as const;
export const ADDRESS_LINK_NEXT_ACTIONS = [
  'choose_permissions',
  'request_recipient_proof',
  'review_address_quality',
  'refresh_link',
  'issue_link_grant',
  'none',
] as const;

const CAPABILITY_SCOPE: Record<AddressLinkCapability, AddressLinkScope> = {
  'delivery-eligibility': 'delivery:eligible',
  'recipient-confirmation': 'recipient:verify',
  'coarse-region': 'region:coarse',
  'address-quality': 'address:quality',
  'return-label': 'return:label',
};

const FORBIDDEN_PUBLIC_KEYS = new Set([
  'address',
  'rawaddress',
  'addresstext',
  'plaintextaddress',
  'formattedaddress',
  'recipient',
  'recipientname',
  'phone',
  'phonenumber',
  'unit',
  'room',
  'roomnumber',
  'building',
  'street',
  'road',
  'housenumber',
  'house_number',
  'lat',
  'latitude',
  'lon',
  'lng',
  'longitude',
  'coordinates',
  'agid',
  'rawagid',
  'aoid',
  'rawaoid',
  'proofcode',
  'recipientsecret',
  'privatekey',
  'secret',
]);

export type AddressLinkSurface = typeof ADDRESS_LINK_SURFACES[number];
export type AddressLinkCapability = typeof ADDRESS_LINK_CAPABILITIES[number];
export type AddressLinkScope = typeof ADDRESS_LINK_SCOPES[number];
export type AddressLinkStatus = typeof ADDRESS_LINK_STATUSES[number];
export type AddressLinkNextAction = typeof ADDRESS_LINK_NEXT_ACTIONS[number];

export type AddressLinkRecipientProofMethod =
  | 'passkey'
  | 'webauthn'
  | 'aoid-credential'
  | 'nfc-card'
  | 'one-time-code'
  | 'zk-proof';

export type AddressLinkCoarseRegion = {
  countryCode?: string;
  regionCode?: string;
  label?: string;
  precision?: 'country' | 'region' | 'city' | 'delivery-zone' | 'custom';
};

export type AddressLinkEvidenceInput = {
  addressElementSession?: AddressElementSession;
  deliveryEligible?: boolean;
  returnEligible?: boolean;
  qualityDecision?: AddressElementQualityDecision;
  coarseRegion?: AddressLinkCoarseRegion;
  recipientProof?: {
    passed?: boolean;
    method?: AddressLinkRecipientProofMethod | string;
    safeFingerprint?: string;
  };
  commitments?: {
    address?: string;
    agid?: string;
    aoid?: string;
    credential?: string;
    nullifier?: string;
  };
  freshness?: 'fresh' | 'stale' | 'unknown';
};

export type AddressLinkRequestInput = {
  id?: string;
  surface?: AddressLinkSurface | string;
  purpose?: AddressIntentPurpose | string;
  mode?: AddressIntentMode | string;
  requestedCapabilities?: Array<AddressLinkCapability | string>;
  scopes?: Array<AddressLinkScope | string>;
  relyingParty?: string;
  merchantName?: string;
  highRiskMode?: boolean;
  createdAt?: string;
  expiresAt?: string;
};

export type AddressLinkGrantInput = AddressLinkRequestInput & {
  evidence?: AddressLinkEvidenceInput;
};

export type AddressLinkPublicClaims = {
  delivery?: {
    eligible: true;
    scope: 'delivery:eligible';
  };
  recipient?: {
    controlled: true;
    method: AddressLinkRecipientProofMethod | 'unknown';
    proofFingerprint?: string;
    scope: 'recipient:verify';
  };
  region?: {
    countryCode: string;
    regionCode?: string;
    label?: string;
    precision: NonNullable<AddressLinkCoarseRegion['precision']>;
    scope: 'region:coarse';
  };
  quality?: {
    decision: AddressElementQualityDecision;
    acceptableForLink: boolean;
    scope: 'address:quality';
  };
  returnLabel?: {
    eligible: true;
    scope: 'return:label';
  };
};

export type AddressLinkPrivacyBoundary = {
  plaintextAddressShared: false;
  rawAgidShared: false;
  rawAoidShared: false;
  phoneShared: false;
  recipientNameShared: false;
  exactCoordinatesShared: false;
  publicSurface: 'scopes-public-claims-safe-fingerprints-and-commitments-only';
};

export type AddressLinkSession = {
  modelVersion: typeof ADDRESS_LINK_MODEL_VERSION;
  id: string;
  status: AddressLinkStatus;
  surface: AddressLinkSurface;
  purpose: AddressIntentPurpose;
  mode: AddressIntentMode;
  requestedCapabilities: AddressLinkCapability[];
  scopes: AddressLinkScope[];
  grantedScopes: AddressLinkScope[];
  deniedScopes: Array<{
    scope: AddressLinkScope;
    reason: string;
  }>;
  publicClaims: AddressLinkPublicClaims;
  commitments: NonNullable<AddressLinkEvidenceInput['commitments']>;
  createdAt: string;
  expiresAt: string;
  nextAction: AddressLinkNextAction;
  warnings: string[];
  errors: string[];
  privacy: AddressLinkPrivacyBoundary;
  highRiskMode: boolean;
};

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map(key => [key, (value as Record<string, unknown>)[key]] as const);
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(',')}}`;
}

function normalizeSurface(value: unknown): AddressLinkSurface {
  return ADDRESS_LINK_SURFACES.includes(value as AddressLinkSurface)
    ? value as AddressLinkSurface
    : 'ec';
}

function normalizePurpose(value: unknown): AddressIntentPurpose {
  return ADDRESS_INTENT_PURPOSES.includes(value as AddressIntentPurpose)
    ? value as AddressIntentPurpose
    : 'delivery';
}

function normalizeMode(value: unknown): AddressIntentMode {
  return ADDRESS_INTENT_MODES.includes(value as AddressIntentMode)
    ? value as AddressIntentMode
    : 'local';
}

function normalizeCapability(value: unknown): AddressLinkCapability | undefined {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase().replace(/_/g, '-') : '';
  if (ADDRESS_LINK_CAPABILITIES.includes(normalized as AddressLinkCapability)) {
    return normalized as AddressLinkCapability;
  }
  if (normalized === 'delivery' || normalized === 'delivery-eligible' || normalized === 'shipping-eligible') return 'delivery-eligibility';
  if (normalized === 'recipient' || normalized === 'recipient-proof' || normalized === 'recipient-control') return 'recipient-confirmation';
  if (normalized === 'region' || normalized === 'coarse' || normalized === 'coarse-location') return 'coarse-region';
  if (normalized === 'quality' || normalized === 'quality-gate') return 'address-quality';
  if (normalized === 'return' || normalized === 'return-eligibility') return 'return-label';
  return undefined;
}

function normalizeScope(value: unknown): AddressLinkScope | undefined {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase().replace(/_/g, '-') : '';
  if (ADDRESS_LINK_SCOPES.includes(normalized as AddressLinkScope)) return normalized as AddressLinkScope;
  const capability = normalizeCapability(normalized);
  return capability ? CAPABILITY_SCOPE[capability] : undefined;
}

function validIsoOrNow(value: unknown, now = new Date().toISOString()) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : now;
}

function expiryFor(input: AddressLinkRequestInput, createdAt: string) {
  const explicit = typeof input.expiresAt === 'string' && !Number.isNaN(Date.parse(input.expiresAt))
    ? input.expiresAt
    : undefined;
  const maxTtlMs = input.highRiskMode ? 5 * 60 * 1000 : 15 * 60 * 1000;
  const maxExpiry = new Date(Date.parse(createdAt) + maxTtlMs).toISOString();
  if (!explicit) return maxExpiry;
  return Date.parse(explicit) > Date.parse(maxExpiry) ? maxExpiry : explicit;
}

function requestIdFor(input: AddressLinkRequestInput, createdAt: string, scopes: AddressLinkScope[]) {
  if (typeof input.id === 'string' && /^ALK-[A-F0-9]{16,32}$/.test(input.id.trim().toUpperCase())) {
    return input.id.trim().toUpperCase();
  }
  const hash = sha256Hex(stableJson({
    surface: input.surface,
    purpose: input.purpose,
    mode: input.mode,
    scopes,
    relyingParty: input.relyingParty || input.merchantName,
    highRiskMode: Boolean(input.highRiskMode),
    createdAt,
  })).toUpperCase();
  return `ALK-${hash.slice(0, 24)}`;
}

function privacyBoundary(): AddressLinkPrivacyBoundary {
  return {
    plaintextAddressShared: false,
    rawAgidShared: false,
    rawAoidShared: false,
    phoneShared: false,
    recipientNameShared: false,
    exactCoordinatesShared: false,
    publicSurface: 'scopes-public-claims-safe-fingerprints-and-commitments-only',
  };
}

function cleanCountryCode(value: unknown) {
  const text = String(value ?? '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : '';
}

function cleanSafeText(value: unknown, maxLength = 80) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : '';
}

function findForbiddenPublicKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenPublicKeys(item, `${prefix}[${index}]`));
  }

  const findings: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const path = prefix ? `${prefix}.${key}` : key;
    if (normalized === 'commitments') continue;
    if (FORBIDDEN_PUBLIC_KEYS.has(normalized)) findings.push(path);
    findings.push(...findForbiddenPublicKeys(nested, path));
  }
  return findings;
}

function evidenceQuality(evidence: AddressLinkEvidenceInput | undefined): AddressElementQualityDecision {
  return evidence?.qualityDecision
    ?? evidence?.addressElementSession?.quality.decision
    ?? 'needs_review';
}

function hasPassedRecipientProof(evidence: AddressLinkEvidenceInput | undefined) {
  if (evidence?.recipientProof?.passed) return true;
  return Boolean(evidence?.addressElementSession?.evidenceForIntent.some(item =>
    item.source === 'recipient-proof' && item.status === 'passed'
  ));
}

function hasDeliveryEligibility(evidence: AddressLinkEvidenceInput | undefined) {
  if (evidence?.deliveryEligible === true) return true;
  const session = evidence?.addressElementSession;
  return Boolean(session?.status === 'ready' && session.quality.decision === 'verified');
}

function hasReturnEligibility(evidence: AddressLinkEvidenceInput | undefined) {
  if (evidence?.returnEligible === true) return true;
  return hasDeliveryEligibility(evidence);
}

function coarseRegionFromEvidence(evidence: AddressLinkEvidenceInput | undefined): AddressLinkCoarseRegion | undefined {
  const countryCode = cleanCountryCode(
    evidence?.coarseRegion?.countryCode ?? evidence?.addressElementSession?.countryCode,
  );
  if (!countryCode) return undefined;
  const regionCode = cleanSafeText(evidence?.coarseRegion?.regionCode, 32);
  const label = cleanSafeText(evidence?.coarseRegion?.label, 80);
  return {
    countryCode,
    ...(regionCode ? { regionCode } : {}),
    ...(label ? { label } : {}),
    precision: evidence?.coarseRegion?.precision || 'country',
  };
}

function cleanCommitments(commitments: AddressLinkEvidenceInput['commitments'] | undefined) {
  const cleaned: NonNullable<AddressLinkEvidenceInput['commitments']> = {};
  for (const key of ['address', 'agid', 'aoid', 'credential', 'nullifier'] as const) {
    const value = cleanSafeText(commitments?.[key], 160);
    if (value) cleaned[key] = value;
  }
  return cleaned;
}

function buildRequestedScopes(input: AddressLinkRequestInput) {
  const capabilities = unique(
    (input.requestedCapabilities ?? ['delivery-eligibility'])
      .map(normalizeCapability)
      .filter(Boolean) as AddressLinkCapability[],
  );
  const scopesFromCapabilities = capabilities.map(capability => CAPABILITY_SCOPE[capability]);
  const explicitScopes = (input.scopes ?? []).map(normalizeScope).filter(Boolean) as AddressLinkScope[];
  const scopes = unique([...scopesFromCapabilities, ...explicitScopes]);
  return {
    capabilities: capabilities.length > 0
      ? capabilities
      : unique(scopes.map(scope => {
          const match = Object.entries(CAPABILITY_SCOPE).find(([, mapped]) => mapped === scope);
          return match?.[0] as AddressLinkCapability | undefined;
        }).filter(Boolean) as AddressLinkCapability[]),
    scopes,
  };
}

function decideNextAction(status: AddressLinkStatus, deniedScopes: AddressLinkSession['deniedScopes']): AddressLinkNextAction {
  if (status === 'ready') return 'issue_link_grant';
  if (status === 'expired') return 'refresh_link';
  if (status === 'requires-consent') return 'choose_permissions';
  if (deniedScopes.some(item => item.scope === 'recipient:verify')) return 'request_recipient_proof';
  if (deniedScopes.some(item => item.reason.includes('quality'))) return 'review_address_quality';
  return 'none';
}

export function buildAddressLinkSession(input: AddressLinkGrantInput = {}): AddressLinkSession {
  const now = new Date().toISOString();
  const createdAt = validIsoOrNow(input.createdAt, now);
  const expiresAt = expiryFor(input, createdAt);
  const surface = normalizeSurface(input.surface);
  const purpose = normalizePurpose(input.purpose);
  const mode = normalizeMode(input.mode);
  const requested = buildRequestedScopes(input);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (requested.scopes.length === 0) errors.push('address-link-requires-at-least-one-scope');
  if (input.highRiskMode) {
    warnings.push('address-link-high-risk-mode-uses-short-expiry-and-minimum-disclosure');
    if (requested.scopes.includes('region:coarse')) warnings.push('address-link-high-risk-region-should-remain-coarse');
  }

  const privatePaths = findForbiddenPublicKeys(input.evidence);
  if (privatePaths.length > 0) {
    errors.push('address-link-evidence-contains-private-material');
    warnings.push(`address-link-private-material-rejected:${privatePaths.slice(0, 5).join(',')}`);
  }

  const publicClaims: AddressLinkPublicClaims = {};
  const grantedScopes: AddressLinkScope[] = [];
  const deniedScopes: AddressLinkSession['deniedScopes'] = [];
  const quality = evidenceQuality(input.evidence);
  const region = coarseRegionFromEvidence(input.evidence);

  for (const scope of requested.scopes) {
    if (scope === 'delivery:eligible') {
      if (hasDeliveryEligibility(input.evidence)) {
        publicClaims.delivery = { eligible: true, scope };
        grantedScopes.push(scope);
      } else {
        deniedScopes.push({ scope, reason: 'delivery-eligibility-not-proven' });
      }
    } else if (scope === 'recipient:verify') {
      if (hasPassedRecipientProof(input.evidence)) {
        const method = cleanSafeText(input.evidence?.recipientProof?.method, 32) as AddressLinkRecipientProofMethod | '';
        const proofFingerprint = cleanSafeText(input.evidence?.recipientProof?.safeFingerprint, 160);
        publicClaims.recipient = {
          controlled: true,
          method: method || 'unknown',
          ...(proofFingerprint ? { proofFingerprint } : {}),
          scope,
        };
        grantedScopes.push(scope);
      } else {
        deniedScopes.push({ scope, reason: 'recipient-control-proof-required' });
      }
    } else if (scope === 'region:coarse') {
      if (region) {
        publicClaims.region = {
          countryCode: region.countryCode || '',
          ...(region.regionCode ? { regionCode: region.regionCode } : {}),
          ...(region.label ? { label: region.label } : {}),
          precision: region.precision || 'country',
          scope,
        };
        grantedScopes.push(scope);
      } else {
        deniedScopes.push({ scope, reason: 'coarse-region-not-available' });
      }
    } else if (scope === 'address:quality') {
      publicClaims.quality = {
        decision: quality,
        acceptableForLink: quality === 'verified' || quality === 'partial',
        scope,
      };
      grantedScopes.push(scope);
      if (quality === 'needs_review' || quality === 'blocked') {
        deniedScopes.push({ scope, reason: `address-quality-${quality}` });
      }
    } else if (scope === 'return:label') {
      if (hasReturnEligibility(input.evidence)) {
        publicClaims.returnLabel = { eligible: true, scope };
        grantedScopes.push(scope);
      } else {
        deniedScopes.push({ scope, reason: 'return-label-eligibility-not-proven' });
      }
    }
  }

  const forbiddenClaimPaths = Object.entries(publicClaims).flatMap(([claimKey, claimValue]) =>
    findForbiddenPublicKeys(claimValue, `publicClaims.${claimKey}`),
  );
  if (forbiddenClaimPaths.length > 0) {
    errors.push('address-link-public-claims-contain-private-material');
  }

  let status: AddressLinkStatus;
  if (Date.parse(expiresAt) <= Date.parse(now)) {
    status = 'expired';
    errors.push('address-link-expired');
  } else if (errors.length > 0) {
    status = 'rejected';
  } else if (requested.scopes.length === 0) {
    status = 'requires-consent';
  } else if (grantedScopes.length === 0) {
    status = deniedScopes.some(item => item.scope === 'recipient:verify') ? 'requires-proof' : 'requires-review';
  } else if (deniedScopes.some(item => item.scope === 'recipient:verify')) {
    status = 'requires-proof';
  } else if (deniedScopes.length > 0) {
    status = 'requires-review';
  } else {
    status = 'ready';
  }

  const id = requestIdFor(input, createdAt, requested.scopes);
  return {
    modelVersion: ADDRESS_LINK_MODEL_VERSION,
    id,
    status,
    surface,
    purpose,
    mode,
    requestedCapabilities: requested.capabilities,
    scopes: requested.scopes,
    grantedScopes: unique(grantedScopes),
    deniedScopes,
    publicClaims,
    commitments: cleanCommitments(input.evidence?.commitments),
    createdAt,
    expiresAt,
    nextAction: decideNextAction(status, deniedScopes),
    warnings: unique(warnings),
    errors: unique(errors),
    privacy: privacyBoundary(),
    highRiskMode: Boolean(input.highRiskMode),
  };
}

export function listAddressLinkCapabilities() {
  return {
    modelVersion: ADDRESS_LINK_MODEL_VERSION,
    surfaces: [...ADDRESS_LINK_SURFACES],
    capabilities: [...ADDRESS_LINK_CAPABILITIES],
    scopes: [...ADDRESS_LINK_SCOPES],
    statuses: [...ADDRESS_LINK_STATUSES],
    nextActions: [...ADDRESS_LINK_NEXT_ACTIONS],
    role: 'Embeddable consent UI for EC, POS, CMS, and shopping-agent flows. It returns scoped address-derived claims instead of raw address material.',
    privacy: privacyBoundary(),
    modes: [...ADDRESS_INTENT_MODES],
    purposeBinding: [...ADDRESS_INTENT_PURPOSES],
    forbiddenPublicMaterial: [
      'plaintext-address',
      'raw-agid',
      'raw-aoid',
      'recipient-name',
      'phone',
      'room-or-unit',
      'exact-coordinates',
    ],
  };
}
