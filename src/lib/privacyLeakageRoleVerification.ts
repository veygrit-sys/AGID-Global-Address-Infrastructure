import {
  buildSecurityPrivacyDesignPlan,
  validateSecurityPrivacyPayload,
  type SecurityPrivacyDesignInput,
  type SecurityPrivacyDesignPlan,
  type SecurityPrivacyPurpose,
  type SecurityPrivacySurface,
} from './securityPrivacyDesign';
import { validatePublicAgidPayload } from './agidSecurity';

export const PRIVACY_LEAKAGE_ROLE_VERIFICATION_VERSION = 'privacy-leakage-role-verification-v1';

export type PrivacyLeakageRole =
  | 'public-agid-reference'
  | 'aoid-private-registration'
  | 'agid-s-high-risk-sharing'
  | 'zk-residence-predicate'
  | 'delivery-pos-handoff'
  | 'issuer-trust-credential';

export type PrivacyLeakageDecision = 'pass' | 'review' | 'fail';

export type PrivacyLeakageRoleProfile = {
  role: PrivacyLeakageRole;
  surface: SecurityPrivacySurface;
  purpose: SecurityPrivacyPurpose;
  description: string;
  requiredSignals: string[];
  allowedPublicSignals: string[];
  forbiddenRoleFieldKeys: string[];
  allowedSurfaceFieldPaths?: string[];
  defaultDesignInput: Omit<SecurityPrivacyDesignInput, 'surface' | 'purpose'>;
};

export type PrivacyLeakageRoleVerificationInput = {
  role: PrivacyLeakageRole;
  payload: unknown;
  observedSignals?: string[];
  requiredSignals?: string[];
  forbiddenPlaintextValues?: string[];
  designInput?: Partial<SecurityPrivacyDesignInput>;
};

export type PrivacyLeakageRoleVerificationResult = {
  version: typeof PRIVACY_LEAKAGE_ROLE_VERIFICATION_VERSION;
  role: PrivacyLeakageRole;
  surface: SecurityPrivacySurface;
  purpose: SecurityPrivacyPurpose;
  decision: PrivacyLeakageDecision;
  privacySatisfied: boolean;
  roleSatisfied: boolean;
  inferredSignals: string[];
  requiredSignals: string[];
  missingSignals: string[];
  allowedPublicSignals: string[];
  forbiddenPublicFields: string[];
  leakageFindings: string[];
  roleFindings: string[];
  designPlan: SecurityPrivacyDesignPlan;
};

const ROLE_PROFILES: Record<PrivacyLeakageRole, PrivacyLeakageRoleProfile> = {
  'public-agid-reference': {
    role: 'public-agid-reference',
    surface: 'public-agid-api',
    purpose: 'public-reference',
    description: 'Expose a public AGID reference and coarse context without personal address material.',
    requiredSignals: ['public-agid', 'public-label-or-context', 'confidence-or-review-state'],
    allowedPublicSignals: [
      'AGID',
      'coarse cell or public map label',
      'confidence or unresolved/manual-review state',
      'source attribution',
    ],
    forbiddenRoleFieldKeys: [
      'recipient',
      'phone',
      'rawAddress',
      'addressText',
      'room',
      'unit',
      'accessCode',
      'ownerPrivateKey',
      'privateSalt',
      'aoidBody',
    ],
    defaultDesignInput: {
      dataClasses: ['public'],
      includesPlainAddress: false,
      includesRecipient: false,
      includesExactCoordinates: false,
      encryptedInTransit: true,
    },
  },
  'aoid-private-registration': {
    role: 'aoid-private-registration',
    surface: 'aoid-registration',
    purpose: 'ownership',
    description: 'Register or audit AOID authority through commitments and proofs without exposing the AOID body.',
    requiredSignals: ['aoid-commitment', 'owner-proof', 'duplicate-nullifier', 'consent-scope'],
    allowedPublicSignals: [
      'purpose-bound AOID commitment',
      'ownership proof result',
      'duplicate-prevention nullifier',
      'consent and purpose scope',
    ],
    forbiddenRoleFieldKeys: [
      'aoidBody',
      'plainAoid',
      'ownerPrivateKey',
      'ownerSecret',
      'privateOwnershipProof',
      'rawAddress',
      'recipient',
      'phone',
      'room',
      'unit',
    ],
    defaultDesignInput: {
      dataClasses: ['sensitive'],
      includesAoid: true,
      includesCredential: true,
      includesNullifier: true,
      hasConsentProof: true,
      hasIssuerTrust: true,
      hasFreshnessProof: true,
      hasRevocationCheck: true,
      encryptedAtRest: true,
      encryptedInTransit: true,
    },
  },
  'agid-s-high-risk-sharing': {
    role: 'agid-s-high-risk-sharing',
    surface: 'public-agid-qr',
    purpose: 'delivery',
    description: 'Share a location through AGID-S in high-risk workflows while hiding the raw AGID and address history.',
    requiredSignals: [
      'encrypted-location-token',
      'expiry',
      'jti',
      'revocation-state',
      'high-risk-policy',
      'no-history-policy',
    ],
    allowedPublicSignals: [
      'AGID-S encrypted token',
      'key id',
      'nonce/ciphertext/auth tag or token envelope',
      'expiry',
      'jti or used-status handle',
      'revocation status',
    ],
    forbiddenRoleFieldKeys: [
      'agid',
      'rawAgid',
      'preciseAgid',
      'lat',
      'lon',
      'lng',
      'latitude',
      'longitude',
      'coordinates',
      'rawAddress',
      'addressHistory',
      'recipient',
      'phone',
      'room',
      'unit',
    ],
    defaultDesignInput: {
      dataClasses: ['sensitive'],
      includesPlainAddress: false,
      includesRecipient: false,
      includesExactCoordinates: false,
      hasRevocationCheck: true,
      encryptedInTransit: true,
    },
  },
  'zk-residence-predicate': {
    role: 'zk-residence-predicate',
    surface: 'zk-proof-public',
    purpose: 'residence',
    description: 'Prove residence or area predicates while exposing only the public proof statement.',
    requiredSignals: [
      'predicate-result',
      'scope',
      'challenge-hash',
      'issuer',
      'commitment',
      'freshness-window',
      'revocation-state',
    ],
    allowedPublicSignals: [
      'predicate kind and satisfied result',
      'scope',
      'challenge hash',
      'issuer or trust root',
      'commitments',
      'freshness and revocation roots',
    ],
    forbiddenRoleFieldKeys: [
      'address',
      'rawAddress',
      'addressCommitment',
      'postalCodeHash',
      'privateSalt',
      'privateProofSalt',
      'localCacheKey',
      'subjectId',
      'credentialId',
      'lat',
      'lon',
      'lng',
      'latitude',
      'longitude',
      'north',
      'south',
      'east',
      'west',
      'rings',
      'radiusMeters',
    ],
    defaultDesignInput: {
      dataClasses: ['sensitive'],
      includesCredential: true,
      includesZkProof: true,
      includesNullifier: true,
      hasIssuerTrust: true,
      hasFreshnessProof: true,
      hasRevocationCheck: true,
      hasProofBundleCompatibility: true,
      encryptedInTransit: true,
    },
  },
  'delivery-pos-handoff': {
    role: 'delivery-pos-handoff',
    surface: 'delivery-agent',
    purpose: 'delivery',
    description: 'Let POS and carrier operators decide the handoff state without storing private address or proof-code material.',
    requiredSignals: [
      'delivery-decision',
      'carrier-handoff',
      'recipient-auth-result',
      'handoff-state',
      'terminal-receipt-signature',
      'nullifier',
    ],
    allowedPublicSignals: [
      'Address OK / Carrier Scan OK / Recipient Pending / Handoff Complete',
      'waybill alias or commitment',
      'address-reference commitment',
      'recipient proof result',
      'terminal-signed receipt',
      'coarse carrier evidence when enabled',
    ],
    forbiddenRoleFieldKeys: [
      'recipientProofCode',
      'recipientProofSecret',
      'proofCode',
      'recipientSecret',
      'rawAddress',
      'street',
      'phone',
      'room',
      'unit',
      'agid',
      'lat',
      'lon',
      'lng',
      'latitude',
      'longitude',
    ],
    allowedSurfaceFieldPaths: [
      'payload.shippingLabel.domainSeparation.recipient',
    ],
    defaultDesignInput: {
      dataClasses: ['sensitive'],
      includesZkProof: false,
      includesNullifier: true,
      hasConsentProof: true,
      hasFreshnessProof: true,
      hasRevocationCheck: true,
      encryptedInTransit: true,
    },
  },
  'issuer-trust-credential': {
    role: 'issuer-trust-credential',
    surface: 'credential-issuer-registry',
    purpose: 'residence',
    description: 'Publish issuer trust information without publishing subject credentials or address commitments.',
    requiredSignals: ['issuer', 'issuer-trust-root', 'credential-scope', 'revocation-policy'],
    allowedPublicSignals: [
      'issuer id',
      'issuer public key or trust root',
      'claim kind / credential scope',
      'status and revocation policy',
      'policy hash',
    ],
    forbiddenRoleFieldKeys: [
      'subjectId',
      'addressCommitment',
      'postalCodeHash',
      'evidenceCommitmentRefs',
      'privateSalt',
      'localCacheKey',
      'rawAddress',
      'recipient',
      'phone',
    ],
    defaultDesignInput: {
      dataClasses: ['public', 'pseudonymous'],
      includesCredential: false,
      hasIssuerTrust: true,
      hasFreshnessProof: true,
      hasRevocationCheck: true,
      encryptedInTransit: true,
    },
  },
};

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function normalizeFieldKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sortedUnique(values: Iterable<string>) {
  return Array.from(new Set(Array.from(values).filter(Boolean))).sort();
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function addSignal(signals: Set<string>, signal: string) {
  signals.add(normalizeToken(signal));
}

function inferSignalsFromValue(value: unknown, signals = new Set<string>(), path: string[] = []): Set<string> {
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') {
      if (value.startsWith('AGIDS1-')) addSignal(signals, 'encrypted-location-token');
      if (/^[A-Z]{2}[0-9A-HJKMNP-TV-Z]{10}$/u.test(value)) addSignal(signals, 'public-agid');
    }
    return signals;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => inferSignalsFromValue(item, signals, [...path, String(index)]));
    return signals;
  }

  const record = value as Record<string, unknown>;
  for (const [key, nestedValue] of Object.entries(record)) {
    const normalizedKey = normalizeFieldKey(key);
    const keyPath = [...path, key].join('.').toLowerCase();
    const stringValue = typeof nestedValue === 'string' ? nestedValue : '';

    if (normalizedKey === 'agid' && stringValue) addSignal(signals, 'public-agid');
    if (normalizedKey === 'token' && stringValue.startsWith('AGIDS1-')) addSignal(signals, 'encrypted-location-token');
    if (['kid', 'keyid', 'n', 'nonce', 'c', 'ciphertext', 't', 'authtag'].includes(normalizedKey)) {
      addSignal(signals, 'encrypted-location-token');
    }
    if (normalizedKey === 'publiclabel' || normalizedKey === 'label' || normalizedKey === 'country' || normalizedKey === 'city') {
      addSignal(signals, 'public-label-or-context');
    }
    if (normalizedKey.includes('confidence') || normalizedKey === 'decision' || normalizedKey === 'status' || normalizedKey.includes('review')) {
      addSignal(signals, 'confidence-or-review-state');
      addSignal(signals, 'delivery-decision');
    }
    if (normalizedKey === 'expiresat' || normalizedKey === 'exp' || normalizedKey === 'freshuntil') {
      addSignal(signals, 'expiry');
      addSignal(signals, 'freshness-window');
    }
    if (normalizedKey === 'jti') addSignal(signals, 'jti');
    if (normalizedKey.includes('revocation') || normalizedKey === 'usedstatus' || normalizedKey === 'used') {
      addSignal(signals, 'revocation-state');
      addSignal(signals, 'revocation-policy');
    }
    if (normalizedKey.includes('nullifier')) addSignal(signals, 'nullifier');
    if (normalizedKey.includes('commitment')) {
      addSignal(signals, 'commitment');
      if (keyPath.includes('aoid')) addSignal(signals, 'aoid-commitment');
    }
    if (normalizedKey.includes('ownerproof') || normalizedKey.includes('ownershipproof')) addSignal(signals, 'owner-proof');
    if (normalizedKey.includes('consent') || normalizedKey.includes('purpose') || normalizedKey === 'scope') {
      addSignal(signals, 'consent-scope');
      addSignal(signals, 'scope');
      addSignal(signals, 'credential-scope');
    }
    if (normalizedKey.includes('predicate')) addSignal(signals, 'predicate-result');
    if (normalizedKey === 'challengehash' || normalizedKey === 'audience') addSignal(signals, 'challenge-hash');
    if (normalizedKey.includes('issuer')) addSignal(signals, 'issuer');
    if (normalizedKey.includes('trustroot') || normalizedKey === 'issuerroot' || normalizedKey === 'registryroot') {
      addSignal(signals, 'issuer-trust-root');
      addSignal(signals, 'issuer');
    }
    if (normalizedKey === 'claimkind' || normalizedKey === 'credentialtype' || normalizedKey === 'credentialscope') {
      addSignal(signals, 'credential-scope');
    }
    if (normalizedKey === 'safetypolicy') addSignal(signals, 'high-risk-policy');
    if (
      normalizedKey === 'retainaddresshistory'
      && nestedValue === false
    ) {
      addSignal(signals, 'no-history-policy');
    }
    if (normalizedKey === 'addresshistorypolicy' && nestedValue === 'not-retained') addSignal(signals, 'no-history-policy');
    if (normalizedKey === 'carrierscanverified' || normalizedKey === 'carrierhandledpackage') addSignal(signals, 'carrier-handoff');
    if (
      normalizedKey === 'recipientcontrolverified'
      || normalizedKey === 'recipientchallengeverified'
      || normalizedKey === 'ownerverified'
      || normalizedKey === 'recipientauthresult'
    ) {
      addSignal(signals, 'recipient-auth-result');
    }
    if (normalizedKey === 'prooflevel' || normalizedKey === 'proofstages' || normalizedKey === 'deliverycompleted') {
      addSignal(signals, 'handoff-state');
    }
    if (normalizedKey === 'terminalevidencesignature' || normalizedKey === 'posterminalsignature') {
      addSignal(signals, 'terminal-receipt-signature');
    }
    if (normalizedKey === 'duplicatenullifier' || keyPath.includes('duplicate')) addSignal(signals, 'duplicate-nullifier');

    inferSignalsFromValue(nestedValue, signals, [...path, key]);
  }

  return signals;
}

function findForbiddenRoleFields(
  value: unknown,
  forbiddenKeys: string[],
  path = 'payload',
): string[] {
  if (!value || typeof value !== 'object') return [];
  const forbidden = new Set(forbiddenKeys.map(normalizeFieldKey));

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenRoleFields(item, forbiddenKeys, `${path}[${index}]`));
  }

  const findings: string[] = [];
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    const nestedPath = `${path}.${key}`;
    if (forbidden.has(normalizeFieldKey(key))) findings.push(nestedPath);
    findings.push(...findForbiddenRoleFields(nestedValue, forbiddenKeys, nestedPath));
  }
  return findings;
}

function findForbiddenPlaintextValues(value: unknown, forbiddenPlaintextValues: string[] = []) {
  const publicText = safeStringify(value);
  return forbiddenPlaintextValues
    .map((forbidden, index) => ({ forbidden, index }))
    .filter(({ forbidden }) => forbidden.trim().length > 0 && publicText.includes(forbidden))
    .map(({ index }) => `forbidden-plaintext-value[${index}]`);
}

function isAllowedSurfaceField(path: string, allowedPaths: readonly string[] = []) {
  return allowedPaths.some(allowedPath => path === allowedPath || path.endsWith(`.${allowedPath}`));
}

function decisionFor(input: {
  privacySatisfied: boolean;
  roleSatisfied: boolean;
  designPlan: SecurityPrivacyDesignPlan;
}) {
  if (!input.privacySatisfied || !input.roleSatisfied || input.designPlan.decision === 'block') return 'fail';
  if (input.designPlan.decision === 'manual-review' || input.designPlan.warnings.length > 0) return 'review';
  return 'pass';
}

export function getPrivacyLeakageRoleProfile(role: PrivacyLeakageRole): PrivacyLeakageRoleProfile {
  return ROLE_PROFILES[role];
}

export function verifyPrivacyLeakageCountermeasureRole(
  input: PrivacyLeakageRoleVerificationInput,
): PrivacyLeakageRoleVerificationResult {
  const profile = getPrivacyLeakageRoleProfile(input.role);
  const inferredSignals = sortedUnique([
    ...inferSignalsFromValue(input.payload),
    ...(input.observedSignals ?? []).map(normalizeToken),
  ]);
  const requiredSignals = sortedUnique([
    ...profile.requiredSignals.map(normalizeToken),
    ...(input.requiredSignals ?? []).map(normalizeToken),
  ]);
  const inferredSignalSet = new Set(inferredSignals);
  const missingSignals = requiredSignals.filter(signal => !inferredSignalSet.has(signal));
  const securityPayloadScan = validateSecurityPrivacyPayload(input.payload, { surface: profile.surface });
  const publicAgidScan = profile.surface === 'public-agid-api' || profile.surface === 'public-agid-qr'
    ? validatePublicAgidPayload(input.payload)
    : { ok: true, forbiddenFields: [] as string[] };
  const roleForbiddenFields = findForbiddenRoleFields(input.payload, profile.forbiddenRoleFieldKeys);
  const forbiddenPlaintextFindings = findForbiddenPlaintextValues(input.payload, input.forbiddenPlaintextValues);
  const leakageFindings = sortedUnique([
    ...securityPayloadScan.forbiddenFields
      .filter(field => !isAllowedSurfaceField(field, profile.allowedSurfaceFieldPaths))
      .map(field => `surface:${field}`),
    ...publicAgidScan.forbiddenFields.map(field => `public-agid:${field}`),
    ...roleForbiddenFields.map(field => `role:${field}`),
    ...forbiddenPlaintextFindings,
  ]);
  const roleFindings = sortedUnique([
    ...missingSignals.map(signal => `missing-signal:${signal}`),
  ]);
  const designPlan = buildSecurityPrivacyDesignPlan({
    surface: profile.surface,
    purpose: profile.purpose,
    ...profile.defaultDesignInput,
    ...(input.designInput ?? {}),
  } as SecurityPrivacyDesignInput);
  const privacySatisfied = leakageFindings.length === 0;
  const roleSatisfied = roleFindings.length === 0;
  const decision = decisionFor({ privacySatisfied, roleSatisfied, designPlan });

  return {
    version: PRIVACY_LEAKAGE_ROLE_VERIFICATION_VERSION,
    role: profile.role,
    surface: profile.surface,
    purpose: profile.purpose,
    decision,
    privacySatisfied,
    roleSatisfied,
    inferredSignals,
    requiredSignals,
    missingSignals,
    allowedPublicSignals: profile.allowedPublicSignals,
    forbiddenPublicFields: sortedUnique([
      ...designPlan.forbiddenFields,
      ...profile.forbiddenRoleFieldKeys.map(normalizeFieldKey),
    ]),
    leakageFindings,
    roleFindings,
    designPlan,
  };
}

export const PRIVACY_LEAKAGE_RESEARCH_SUMMARY = {
  version: PRIVACY_LEAKAGE_ROLE_VERIFICATION_VERSION,
  claim: 'A privacy countermeasure is acceptable only when it both suppresses forbidden private material and preserves the minimum public signals needed for the intended operational role.',
  verifiedRoles: Object.keys(ROLE_PROFILES) as PrivacyLeakageRole[],
  researchCriteria: [
    'field-minimization',
    'public-signal-sufficiency',
    'domain-separated-commitments-and-nullifiers',
    'high-risk-location-suppression',
    'credential-and-issuer-layer-separation',
    'auditability-without-raw-address-logs',
  ],
  limitation: [
    'This module verifies payload structure and role sufficiency; it does not replace a cryptographic ZK circuit audit.',
    'External registries, chain RPC clients, and issuer keys still require integration tests against their production adapters.',
  ],
} as const;
