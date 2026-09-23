import {
  ADDRESS_ACCESS_SCOPES,
  type AddressAccessScope,
} from './addressAccessAuth';
import { sha256Hex } from './sha256';

export const ADDRESS_CONSENT_ENVELOPE_VERSION = 'agid-address-consent-envelope-v1';
export const ADDRESS_CONSENT_ENVELOPE_SIGNATURE_ALGORITHM = 'HMAC-SHA-256';
export const ADDRESS_CONSENT_ENVELOPE_COMMITMENT_ALGORITHM = 'sha256-domain-separated-consent-envelope-v1';

export const ADDRESS_CONSENT_PURPOSES = [
  'address-disclosure',
  'delivery-delegation',
  'proxy-pickup',
  'aid-receipt',
  'return-label',
  'customs-clearance',
  'identity-verification',
  'evidence-review',
  'audit-access',
] as const;

export const ADDRESS_CONSENT_STATUSES = [
  'draft',
  'awaiting-signature',
  'active',
  'requires-review',
  'expired',
  'revoked',
  'rejected',
] as const;

export const ADDRESS_CONSENT_PARTY_ROLES = [
  'grantor',
  'recipient',
  'carrier',
  'merchant',
  'delegate',
  'ngo',
  'municipality',
  'issuer',
  'auditor',
  'pos-staff',
  'witness',
  'system',
] as const;

export const ADDRESS_CONSENT_ATTRIBUTES = [
  'delivery-eligible',
  'coarse-region',
  'country-residence',
  'city-residence',
  'address-quality',
  'aoid-control',
  'agid-s-decrypt',
  'recipient-control',
  'waybill-issue',
  'handoff-complete',
  'aid-eligible',
  'customs-ready',
  'evidence-review',
] as const;

export type AddressConsentPurpose = typeof ADDRESS_CONSENT_PURPOSES[number];
export type AddressConsentStatus = typeof ADDRESS_CONSENT_STATUSES[number];
export type AddressConsentPartyRole = typeof ADDRESS_CONSENT_PARTY_ROLES[number];
export type AddressConsentAttribute = typeof ADDRESS_CONSENT_ATTRIBUTES[number];

export type AddressConsentEnvelopeMode =
  | 'local-only'
  | 'server-registry'
  | 'zk-only'
  | 'ethereum-registry'
  | 'full-zk-ethereum';

export type AddressConsentSubjectKind =
  | 'address-credential'
  | 'aoid-commitment'
  | 'agid-s-envelope'
  | 'waybill-alias'
  | 'evidence-vault-record'
  | 'pid-commitment'
  | 'device-credential';

export type AddressConsentPartyInput = {
  role?: string;
  partyId?: unknown;
  displayAlias?: unknown;
  publicKeyRef?: unknown;
  contactAlias?: unknown;
  rawName?: unknown;
  email?: unknown;
  phone?: unknown;
};

export type AddressConsentParty = {
  role: AddressConsentPartyRole;
  partyId: string;
  displayAlias?: string;
  publicKeyRef?: string;
  contactAliasCommitment?: string;
};

export type AddressConsentSubjectInput = {
  kind?: string;
  subjectCommitment?: unknown;
  addressCommitment?: unknown;
  aoidCommitment?: unknown;
  agidSCommitment?: unknown;
  waybillCommitment?: unknown;
  evidenceCommitment?: unknown;
  credentialCommitment?: unknown;
  jti?: unknown;
  rawAddress?: unknown;
  agid?: unknown;
  aoid?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

export type AddressConsentSubject = {
  kind: AddressConsentSubjectKind;
  subjectCommitment: string;
  resourceCommitments: {
    address?: string;
    aoid?: string;
    agidS?: string;
    waybill?: string;
    evidence?: string;
    credential?: string;
  };
  jti: string;
};

export type AddressConsentTermsInput = {
  templateId?: unknown;
  templateVersion?: unknown;
  jurisdiction?: unknown;
  language?: unknown;
  summary?: unknown;
  termsCommitment?: unknown;
  rawTermsText?: unknown;
};

export type AddressConsentTerms = {
  templateId: string;
  templateVersion: string;
  jurisdiction?: string;
  language: string;
  summaryCommitment: string;
  termsCommitment: string;
  rawTermsStored: false;
};

export type AddressConsentSignerInput = {
  role?: string;
  signerId?: unknown;
  signerSecret: string;
  signedAt?: string;
};

export type AddressConsentSignature = {
  algorithm: typeof ADDRESS_CONSENT_ENVELOPE_SIGNATURE_ALGORITHM;
  role: AddressConsentPartyRole;
  signerId: string;
  signedAt: string;
  payloadHash: string;
  value: string;
};

export type AddressConsentTiming = {
  createdAt: string;
  notBefore: string;
  expiresAt: string;
  ttlSeconds: number;
  revokedAt?: string;
};

export type AddressConsentCommitments = {
  envelopeCommitment: string;
  payloadHash: string;
  termsCommitment: string;
  revocationHandle: string;
  nullifier: string;
  metadataCommitment?: string;
};

export type AddressConsentEnvelopeInput = {
  envelopeId?: unknown;
  purpose?: string;
  mode?: string;
  highRiskMode?: boolean;
  oneTimeUse?: boolean;
  createdAt?: string;
  notBefore?: string;
  expiresAt?: string;
  ttlSeconds?: number;
  revokedAt?: string;
  grantor?: AddressConsentPartyInput;
  grantee?: AddressConsentPartyInput;
  delegate?: AddressConsentPartyInput;
  issuer?: AddressConsentPartyInput;
  witness?: AddressConsentPartyInput;
  subject?: AddressConsentSubjectInput;
  scopes?: Array<AddressAccessScope | string>;
  permittedAttributes?: Array<AddressConsentAttribute | string>;
  requiredSignerRoles?: Array<AddressConsentPartyRole | string>;
  terms?: AddressConsentTermsInput;
  signerSecrets?: AddressConsentSignerInput[];
  metadata?: unknown;
};

export type AddressConsentEnvelopePrivacy = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawRecipientContactStored: false;
  rawTermsStored: false;
  crossPurposeNullifierStored: false;
  publicSurface: 'consent-status-scopes-commitments-timing-and-signatures-only';
};

export type AddressConsentEnvelope = {
  version: typeof ADDRESS_CONSENT_ENVELOPE_VERSION;
  envelopeId: string;
  status: AddressConsentStatus;
  purpose: AddressConsentPurpose;
  mode: AddressConsentEnvelopeMode;
  parties: AddressConsentParty[];
  subject: AddressConsentSubject;
  scopes: AddressAccessScope[];
  permittedAttributes: AddressConsentAttribute[];
  requiredSignerRoles: AddressConsentPartyRole[];
  signatures: AddressConsentSignature[];
  terms: AddressConsentTerms;
  timing: AddressConsentTiming;
  highRiskMode: boolean;
  oneTimeUse: boolean;
  commitments: AddressConsentCommitments;
  requiredControls: string[];
  errors: string[];
  warnings: string[];
  privacy: AddressConsentEnvelopePrivacy;
  localCacheKey?: string;
};

export type VerifyAddressConsentEnvelopeOptions = {
  signerSecrets?: AddressConsentSignerInput[];
  expectedPurpose?: AddressConsentPurpose | string;
  requiredScopes?: Array<AddressAccessScope | string>;
  requiredAttributes?: Array<AddressConsentAttribute | string>;
  expectedAudiencePartyId?: string;
  expectedSubjectCommitment?: string;
  trustedIssuerIds?: Iterable<string>;
  revokedHandles?: Iterable<string>;
  usedNullifiers?: Iterable<string>;
  now?: string;
  requireSignatureVerification?: boolean;
};

export type AddressConsentEnvelopeVerificationResult = {
  valid: boolean;
  signatureValid: boolean | null;
  active: boolean;
  expired: boolean;
  revoked: boolean;
  missingSignerRoles: AddressConsentPartyRole[];
  missingScopes: string[];
  missingAttributes: string[];
  privacyPreserved: boolean;
  errors: string[];
  warnings: string[];
};

const textEncoder = new TextEncoder();
const DEFAULT_CREATED_AT = '2026-06-17T00:00:00.000Z';
const DEFAULT_TTL_SECONDS = 15 * 60;
const HIGH_RISK_TTL_SECONDS = 5 * 60;
const MAX_STANDARD_TTL_SECONDS = 24 * 60 * 60;
const MAX_HIGH_RISK_TTL_SECONDS = 10 * 60;

const PRIVATE_KEYS = [
  'rawAddress',
  'address',
  'plaintextAddress',
  'rawAgid',
  'agid',
  'rawAoid',
  'aoid',
  'latitude',
  'longitude',
  'lat',
  'lng',
  'phone',
  'phoneNumber',
  'email',
  'rawName',
  'recipientName',
  'unit',
  'room',
  'proofCode',
  'recipientSecret',
  'privateKey',
  'secret',
  'rawTermsText',
];

const PRIVATE_VALUE_RE = /(\b(?:AGID|AOID)[-_][A-Z0-9]{6,}\b|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\+\d[\d\s().-]{7,}\d|\b-?\d{1,2}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,})/;

function clean(value: unknown, maxLength = 180) {
  const text = String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function optionalClean(value: unknown, maxLength = 180) {
  const text = clean(value, maxLength);
  return text || undefined;
}

function cleanToken(value: unknown, fallback: string, maxLength = 96) {
  const text = clean(value, maxLength)
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9:.-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return text || fallback;
}

function validIsoOrDefault(value: unknown, fallback = DEFAULT_CREATED_AT) {
  const text = clean(value);
  return text && !Number.isNaN(Date.parse(text)) ? new Date(text).toISOString() : fallback;
}

function optionalIso(value: unknown) {
  const text = clean(value);
  return text && !Number.isNaN(Date.parse(text)) ? new Date(text).toISOString() : undefined;
}

function normalizePurpose(value: unknown): AddressConsentPurpose {
  const text = cleanToken(value, 'delivery-delegation');
  if ((ADDRESS_CONSENT_PURPOSES as readonly string[]).includes(text)) return text as AddressConsentPurpose;
  if (text === 'delivery' || text === 'shipping') return 'delivery-delegation';
  if (text === 'pickup' || text === 'proxy') return 'proxy-pickup';
  if (text === 'aid' || text === 'disaster' || text === 'humanitarian') return 'aid-receipt';
  if (text === 'identity') return 'identity-verification';
  if (text === 'audit') return 'audit-access';
  return 'delivery-delegation';
}

function normalizeMode(value: unknown): AddressConsentEnvelopeMode {
  const text = cleanToken(value, 'local-only');
  if (
    text === 'server-registry'
    || text === 'zk-only'
    || text === 'ethereum-registry'
    || text === 'full-zk-ethereum'
  ) return text;
  if (text === 'server') return 'server-registry';
  if (text === 'zk') return 'zk-only';
  if (text === 'ethereum') return 'ethereum-registry';
  if (text === 'full') return 'full-zk-ethereum';
  return 'local-only';
}

function normalizePartyRole(value: unknown, fallback: AddressConsentPartyRole): AddressConsentPartyRole {
  const text = cleanToken(value, fallback);
  if ((ADDRESS_CONSENT_PARTY_ROLES as readonly string[]).includes(text)) return text as AddressConsentPartyRole;
  return fallback;
}

function normalizeSubjectKind(value: unknown): AddressConsentSubjectKind {
  const text = cleanToken(value, 'aoid-commitment');
  if (
    text === 'address-credential'
    || text === 'aoid-commitment'
    || text === 'agid-s-envelope'
    || text === 'waybill-alias'
    || text === 'evidence-vault-record'
    || text === 'pid-commitment'
    || text === 'device-credential'
  ) return text;
  if (text === 'aoid') return 'aoid-commitment';
  if (text === 'agid-s') return 'agid-s-envelope';
  if (text === 'credential') return 'address-credential';
  return 'aoid-commitment';
}

function normalizeScope(value: unknown): AddressAccessScope | undefined {
  const text = cleanToken(value, '');
  if ((ADDRESS_ACCESS_SCOPES as readonly string[]).includes(text)) return text as AddressAccessScope;
  if (text === 'delivery') return 'delivery:read';
  if (text === 'recipient') return 'recipient:verify';
  if (text === 'aid') return 'aid:eligibility';
  if (text === 'quality') return 'address:quality';
  return undefined;
}

function normalizeAttribute(value: unknown): AddressConsentAttribute | undefined {
  const text = cleanToken(value, '');
  if ((ADDRESS_CONSENT_ATTRIBUTES as readonly string[]).includes(text)) return text as AddressConsentAttribute;
  if (text === 'delivery') return 'delivery-eligible';
  if (text === 'region') return 'coarse-region';
  if (text === 'country') return 'country-residence';
  if (text === 'city') return 'city-residence';
  if (text === 'quality') return 'address-quality';
  if (text === 'aoid') return 'aoid-control';
  return undefined;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

async function hmacSha256Hex(secret: string, message: string) {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error('Web Crypto API is required for address consent envelope signatures.');
  }

  const key = await cryptoApi.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await cryptoApi.subtle.sign('HMAC', key, textEncoder.encode(message));
  return Array.from(new Uint8Array(signature)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function commitment(label: string, value: unknown, length = 32) {
  return `${label}_${sha256Hex(`${ADDRESS_CONSENT_ENVELOPE_VERSION}|${label}|${stableStringify(value)}`).slice(0, length)}`;
}

function findForbiddenMaterial(value: unknown, prefix = ''): string[] {
  if (value === undefined || value === null) return [];
  if (typeof value === 'string') {
    return PRIVATE_VALUE_RE.test(value) ? [prefix || 'value'] : [];
  }
  if (typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenMaterial(item, `${prefix}[${index}]`));
  }

  const findings: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (PRIVATE_KEYS.some(privateKey => privateKey.toLowerCase() === key.toLowerCase())) {
      findings.push(path);
      continue;
    }
    findings.push(...findForbiddenMaterial(nested, path));
  }
  return findings;
}

function normalizeParty(input: AddressConsentPartyInput | undefined, role: AddressConsentPartyRole): AddressConsentParty {
  const partyRole = normalizePartyRole(input?.role, role);
  const partyId = cleanToken(input?.partyId, `${partyRole}:unknown`, 120);
  const displayAlias = optionalClean(input?.displayAlias, 80);
  const publicKeyRef = optionalClean(input?.publicKeyRef, 120);
  const contactAlias = optionalClean(input?.contactAlias, 120);

  return {
    role: partyRole,
    partyId,
    ...(displayAlias ? { displayAlias } : {}),
    ...(publicKeyRef ? { publicKeyRef } : {}),
    ...(contactAlias ? { contactAliasCommitment: commitment('contact', `${partyId}|${contactAlias}`) } : {}),
  };
}

function normalizeSubject(input: AddressConsentSubjectInput | undefined, envelopeSeed: string): AddressConsentSubject {
  const kind = normalizeSubjectKind(input?.kind);
  const subjectCommitment = clean(input?.subjectCommitment, 160)
    || commitment('subject', `${kind}|${envelopeSeed}`);
  const jti = cleanToken(input?.jti, commitment('jti', `${subjectCommitment}|${envelopeSeed}`, 24), 96);

  return {
    kind,
    subjectCommitment,
    resourceCommitments: {
      ...(optionalClean(input?.addressCommitment, 160) ? { address: clean(input?.addressCommitment, 160) } : {}),
      ...(optionalClean(input?.aoidCommitment, 160) ? { aoid: clean(input?.aoidCommitment, 160) } : {}),
      ...(optionalClean(input?.agidSCommitment, 160) ? { agidS: clean(input?.agidSCommitment, 160) } : {}),
      ...(optionalClean(input?.waybillCommitment, 160) ? { waybill: clean(input?.waybillCommitment, 160) } : {}),
      ...(optionalClean(input?.evidenceCommitment, 160) ? { evidence: clean(input?.evidenceCommitment, 160) } : {}),
      ...(optionalClean(input?.credentialCommitment, 160) ? { credential: clean(input?.credentialCommitment, 160) } : {}),
    },
    jti,
  };
}

function defaultScopes(purpose: AddressConsentPurpose): AddressAccessScope[] {
  if (purpose === 'address-disclosure') return ['address:quality', 'region:coarse'];
  if (purpose === 'proxy-pickup') return ['recipient:verify', 'delivery:read'];
  if (purpose === 'aid-receipt') return ['aid:eligibility', 'recipient:verify'];
  if (purpose === 'return-label') return ['return:label'];
  if (purpose === 'customs-clearance') return ['delivery:eligible', 'address:quality'];
  if (purpose === 'identity-verification') return ['aoid:commitment', 'recipient:verify'];
  if (purpose === 'audit-access') return ['audit:read'];
  if (purpose === 'evidence-review') return ['address:quality', 'audit:read'];
  return ['delivery:read', 'delivery:eligible'];
}

function defaultAttributes(purpose: AddressConsentPurpose): AddressConsentAttribute[] {
  if (purpose === 'address-disclosure') return ['coarse-region', 'address-quality'];
  if (purpose === 'proxy-pickup') return ['recipient-control', 'delivery-eligible'];
  if (purpose === 'aid-receipt') return ['aid-eligible', 'coarse-region'];
  if (purpose === 'return-label') return ['waybill-issue'];
  if (purpose === 'customs-clearance') return ['customs-ready', 'delivery-eligible'];
  if (purpose === 'identity-verification') return ['aoid-control', 'recipient-control'];
  if (purpose === 'audit-access') return ['handoff-complete'];
  if (purpose === 'evidence-review') return ['evidence-review', 'address-quality'];
  return ['delivery-eligible', 'agid-s-decrypt'];
}

function defaultSignerRoles(purpose: AddressConsentPurpose, requested?: Array<AddressConsentPartyRole | string>) {
  const roles = requested
    ?.map(role => normalizePartyRole(role, 'grantor'))
    .filter(Boolean);
  if (roles?.length) return unique(roles);
  if (purpose === 'proxy-pickup') return ['grantor', 'delegate'] satisfies AddressConsentPartyRole[];
  if (purpose === 'aid-receipt') return ['grantor', 'ngo'] satisfies AddressConsentPartyRole[];
  if (purpose === 'audit-access') return ['grantor', 'auditor'] satisfies AddressConsentPartyRole[];
  return ['grantor'] satisfies AddressConsentPartyRole[];
}

function normalizeTerms(input: AddressConsentTermsInput | undefined, purpose: AddressConsentPurpose): AddressConsentTerms {
  const templateId = cleanToken(input?.templateId, `address-consent-${purpose}`, 120);
  const templateVersion = cleanToken(input?.templateVersion, 'v1', 40);
  const jurisdiction = optionalClean(input?.jurisdiction, 80);
  const language = cleanToken(input?.language, 'en', 20);
  const summary = optionalClean(input?.summary, 500) ?? `${purpose} consent envelope`;
  const existingTermsCommitment = optionalClean(input?.termsCommitment, 160);

  return {
    templateId,
    templateVersion,
    ...(jurisdiction ? { jurisdiction } : {}),
    language,
    summaryCommitment: commitment('summary', `${templateId}|${templateVersion}|${summary}`),
    termsCommitment: existingTermsCommitment ?? commitment('terms', `${templateId}|${templateVersion}|${summary}`),
    rawTermsStored: false,
  };
}

function buildSignaturePayload(envelope: AddressConsentEnvelope) {
  return {
    version: envelope.version,
    envelopeId: envelope.envelopeId,
    purpose: envelope.purpose,
    mode: envelope.mode,
    parties: envelope.parties,
    subject: envelope.subject,
    scopes: envelope.scopes,
    permittedAttributes: envelope.permittedAttributes,
    requiredSignerRoles: envelope.requiredSignerRoles,
    terms: envelope.terms,
    timing: envelope.timing,
    highRiskMode: envelope.highRiskMode,
    oneTimeUse: envelope.oneTimeUse,
    requiredControls: envelope.requiredControls,
  };
}

function computePayloadHash(envelope: AddressConsentEnvelope) {
  return sha256Hex(stableStringify(buildSignaturePayload(envelope)));
}

function requiredControlsFor(
  purpose: AddressConsentPurpose,
  mode: AddressConsentEnvelopeMode,
  highRiskMode: boolean,
  oneTimeUse: boolean
) {
  const controls = [
    'signed-consent-required',
    'purpose-scope-bound',
    'audience-bound',
    'short-ttl',
    'freshness-check',
    'revocation-handle',
    'commitment-only-logging',
    'domain-separated-nullifier',
    'no-raw-address-in-envelope',
  ];
  if (mode === 'zk-only' || mode === 'full-zk-ethereum') controls.push('zk-compatible-public-statement');
  if (mode === 'ethereum-registry' || mode === 'full-zk-ethereum') controls.push('registry-anchor-compatible');
  if (purpose === 'proxy-pickup') controls.push('delegate-signature-required', 'recipient-live-challenge');
  if (purpose === 'aid-receipt') controls.push('issuer-or-field-worker-witness');
  if (purpose === 'audit-access') controls.push('auditor-role-check');
  if (oneTimeUse) controls.push('one-time-use-nullifier');
  if (highRiskMode) {
    controls.push('high-risk-short-ttl', 'no-raw-history', 'no-external-disclosure-by-default', 'post-use-revocation-recommended');
  }
  return unique(controls);
}

function evaluateStatus(envelope: AddressConsentEnvelope, nowIso: string) {
  if (envelope.errors.length > 0) return 'rejected' as const;
  if (envelope.timing.revokedAt) return 'revoked' as const;
  if (Date.parse(envelope.timing.expiresAt) <= Date.parse(nowIso)) return 'expired' as const;

  const signedRoles = new Set(envelope.signatures.map(signature => signature.role));
  const missingRoles = envelope.requiredSignerRoles.filter(role => !signedRoles.has(role));
  if (missingRoles.length > 0) return 'awaiting-signature' as const;

  if (envelope.warnings.some(warning => warning.endsWith('requires-review'))) {
    return 'requires-review' as const;
  }
  return 'active' as const;
}

function finalizeCommitments(envelope: AddressConsentEnvelope, metadata: unknown): AddressConsentCommitments {
  const payloadHash = computePayloadHash(envelope);
  const metadataCommitment = metadata === undefined ? undefined : commitment('metadata', metadata);
  return {
    envelopeCommitment: commitment('env', {
      envelopeId: envelope.envelopeId,
      payloadHash,
      subject: envelope.subject.subjectCommitment,
      purpose: envelope.purpose,
    }),
    payloadHash,
    termsCommitment: envelope.terms.termsCommitment,
    revocationHandle: commitment('revocation', {
      envelopeId: envelope.envelopeId,
      jti: envelope.subject.jti,
      subject: envelope.subject.subjectCommitment,
    }),
    nullifier: commitment('nullifier', {
      envelopeId: envelope.envelopeId,
      domain: `${envelope.purpose}|${envelope.scopes.join(',')}`,
      jti: envelope.subject.jti,
      subject: envelope.subject.subjectCommitment,
    }),
    ...(metadataCommitment ? { metadataCommitment } : {}),
  };
}

export async function signAddressConsentEnvelope(
  envelope: AddressConsentEnvelope,
  signer: AddressConsentSignerInput
): Promise<AddressConsentEnvelope> {
  const role = normalizePartyRole(signer.role, 'grantor');
  const signerId = cleanToken(signer.signerId, `${role}:unknown`, 120);
  const signedAt = validIsoOrDefault(signer.signedAt, envelope.timing.createdAt);
  const payloadHash = computePayloadHash(envelope);
  const value = await hmacSha256Hex(signer.signerSecret, payloadHash);
  const signatures = envelope.signatures.filter(signature => !(signature.role === role && signature.signerId === signerId));
  signatures.push({
    algorithm: ADDRESS_CONSENT_ENVELOPE_SIGNATURE_ALGORITHM,
    role,
    signerId,
    signedAt,
    payloadHash,
    value,
  });

  const next = {
    ...envelope,
    signatures,
    commitments: {
      ...envelope.commitments,
      payloadHash,
    },
  };
  return {
    ...next,
    status: evaluateStatus(next, envelope.timing.createdAt),
  };
}

export async function createAddressConsentEnvelope(input: AddressConsentEnvelopeInput): Promise<AddressConsentEnvelope> {
  const createdAt = validIsoOrDefault(input.createdAt);
  const purpose = normalizePurpose(input.purpose);
  const mode = normalizeMode(input.mode);
  const highRiskMode = Boolean(input.highRiskMode);
  const oneTimeUse = input.oneTimeUse ?? (highRiskMode || purpose === 'proxy-pickup' || purpose === 'aid-receipt');
  const requestedTtl = typeof input.ttlSeconds === 'number' && Number.isFinite(input.ttlSeconds)
    ? Math.max(60, Math.floor(input.ttlSeconds))
    : highRiskMode ? HIGH_RISK_TTL_SECONDS : DEFAULT_TTL_SECONDS;
  const maxTtl = highRiskMode ? MAX_HIGH_RISK_TTL_SECONDS : MAX_STANDARD_TTL_SECONDS;
  const ttlSeconds = Math.min(requestedTtl, maxTtl);
  const notBefore = validIsoOrDefault(input.notBefore, createdAt);
  const expiresAt = optionalIso(input.expiresAt)
    ?? new Date(Date.parse(createdAt) + ttlSeconds * 1000).toISOString();
  const envelopeId = cleanToken(input.envelopeId, commitment('env-id', `${purpose}|${createdAt}`, 24), 120);
  const errors: string[] = [];
  const warnings: string[] = [];

  const forbiddenFindings = [
    ...findForbiddenMaterial(input.grantor, 'grantor'),
    ...findForbiddenMaterial(input.grantee, 'grantee'),
    ...findForbiddenMaterial(input.delegate, 'delegate'),
    ...findForbiddenMaterial(input.issuer, 'issuer'),
    ...findForbiddenMaterial(input.witness, 'witness'),
    ...findForbiddenMaterial(input.subject, 'subject'),
    ...findForbiddenMaterial(input.terms, 'terms'),
    ...findForbiddenMaterial(input.metadata, 'metadata'),
  ];
  if (forbiddenFindings.length > 0) {
    errors.push('address-consent-envelope-contains-private-material');
    warnings.push(`private-material-detected:${forbiddenFindings.length}`);
  }

  if (requestedTtl > maxTtl) {
    warnings.push(highRiskMode ? 'address-consent-high-risk-ttl-capped' : 'address-consent-ttl-capped');
  }

  if (Date.parse(expiresAt) <= Date.parse(notBefore)) {
    errors.push('address-consent-expiry-must-be-after-not-before');
  }

  const parties = [
    normalizeParty(input.grantor, 'grantor'),
    normalizeParty(input.grantee, purpose === 'aid-receipt' ? 'ngo' : 'carrier'),
    ...(input.delegate ? [normalizeParty(input.delegate, 'delegate')] : []),
    ...(input.issuer ? [normalizeParty(input.issuer, 'issuer')] : []),
    ...(input.witness ? [normalizeParty(input.witness, 'witness')] : []),
  ];
  const subject = normalizeSubject(input.subject, envelopeId);
  const scopes = unique(
    (input.scopes?.length ? input.scopes : defaultScopes(purpose))
      .map(normalizeScope)
      .filter((scope): scope is AddressAccessScope => Boolean(scope))
  );
  if (scopes.length === 0) errors.push('address-consent-envelope-requires-at-least-one-valid-scope');

  const permittedAttributes = unique(
    (input.permittedAttributes?.length ? input.permittedAttributes : defaultAttributes(purpose))
      .map(normalizeAttribute)
      .filter((attribute): attribute is AddressConsentAttribute => Boolean(attribute))
  );
  if (permittedAttributes.length === 0) errors.push('address-consent-envelope-requires-at-least-one-address-attribute');

  const terms = normalizeTerms(input.terms, purpose);
  const requiredSignerRoles = defaultSignerRoles(purpose, input.requiredSignerRoles);
  const requiredControls = requiredControlsFor(purpose, mode, highRiskMode, oneTimeUse);
  const revokedAt = optionalIso(input.revokedAt);

  let envelope: AddressConsentEnvelope = {
    version: ADDRESS_CONSENT_ENVELOPE_VERSION,
    envelopeId,
    status: 'draft',
    purpose,
    mode,
    parties,
    subject,
    scopes,
    permittedAttributes,
    requiredSignerRoles,
    signatures: [],
    terms,
    timing: {
      createdAt,
      notBefore,
      expiresAt,
      ttlSeconds,
      ...(revokedAt ? { revokedAt } : {}),
    },
    highRiskMode,
    oneTimeUse,
    commitments: {
      envelopeCommitment: '',
      payloadHash: '',
      termsCommitment: terms.termsCommitment,
      revocationHandle: '',
      nullifier: '',
    },
    requiredControls,
    errors,
    warnings,
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      rawRecipientContactStored: false,
      rawTermsStored: false,
      crossPurposeNullifierStored: false,
      publicSurface: 'consent-status-scopes-commitments-timing-and-signatures-only',
    },
    localCacheKey: `address-consent-envelope:${envelopeId}`,
  };

  envelope = {
    ...envelope,
    commitments: finalizeCommitments(envelope, input.metadata),
  };

  for (const signer of input.signerSecrets ?? []) {
    envelope = await signAddressConsentEnvelope(envelope, signer);
  }

  return {
    ...envelope,
    commitments: finalizeCommitments(envelope, input.metadata),
    status: evaluateStatus(envelope, createdAt),
  };
}

export function stripPrivateAddressConsentEnvelopeMaterial(envelope: AddressConsentEnvelope): AddressConsentEnvelope {
  const { localCacheKey: _localCacheKey, ...publicEnvelope } = envelope;
  return publicEnvelope;
}

export function validateAddressConsentEnvelope(envelope: AddressConsentEnvelope) {
  const errors: string[] = [];

  if (envelope.version !== ADDRESS_CONSENT_ENVELOPE_VERSION) errors.push('unsupported-address-consent-envelope-version');
  if (findForbiddenMaterial(stripPrivateAddressConsentEnvelopeMaterial(envelope)).length > 0) {
    errors.push('address-consent-envelope-public-payload-leaks-private-material');
  }
  if (!envelope.commitments.envelopeCommitment || !envelope.commitments.revocationHandle || !envelope.commitments.nullifier) {
    errors.push('address-consent-envelope-missing-core-commitments');
  }
  if (!envelope.requiredControls.includes('purpose-scope-bound')) {
    errors.push('address-consent-envelope-missing-purpose-scope-bound-control');
  }
  if (envelope.privacy.rawAddressStored !== false || envelope.privacy.rawAoidStored !== false || envelope.privacy.rawTermsStored !== false) {
    errors.push('address-consent-envelope-privacy-boundary-invalid');
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export async function verifyAddressConsentEnvelope(
  envelope: AddressConsentEnvelope,
  options: VerifyAddressConsentEnvelopeOptions = {}
): Promise<AddressConsentEnvelopeVerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const now = validIsoOrDefault(options.now, DEFAULT_CREATED_AT);

  if (validateAddressConsentEnvelope(envelope).ok === false) {
    errors.push(...validateAddressConsentEnvelope(envelope).errors);
  }

  const expectedPayloadHash = computePayloadHash(envelope);
  if (envelope.commitments.payloadHash !== expectedPayloadHash) {
    errors.push('address-consent-envelope-payload-hash-mismatch');
  }

  const expired = Date.parse(envelope.timing.expiresAt) <= Date.parse(now);
  const notYetValid = Date.parse(envelope.timing.notBefore) > Date.parse(now);
  if (expired) errors.push('address-consent-envelope-expired');
  if (notYetValid) errors.push('address-consent-envelope-not-yet-valid');

  const revokedHandles = new Set(options.revokedHandles ?? []);
  const usedNullifiers = new Set(options.usedNullifiers ?? []);
  const revoked = Boolean(envelope.timing.revokedAt)
    || revokedHandles.has(envelope.commitments.revocationHandle)
    || usedNullifiers.has(envelope.commitments.nullifier);
  if (revoked) errors.push('address-consent-envelope-revoked-or-used');

  if (options.expectedPurpose && normalizePurpose(options.expectedPurpose) !== envelope.purpose) {
    errors.push('address-consent-envelope-purpose-mismatch');
  }

  const requiredScopes = (options.requiredScopes ?? [])
    .map(normalizeScope)
    .filter((scope): scope is AddressAccessScope => Boolean(scope));
  const missingScopes = requiredScopes.filter(scope => !envelope.scopes.includes(scope));
  if (missingScopes.length > 0) errors.push('address-consent-envelope-missing-required-scopes');

  const requiredAttributes = (options.requiredAttributes ?? [])
    .map(normalizeAttribute)
    .filter((attribute): attribute is AddressConsentAttribute => Boolean(attribute));
  const missingAttributes = requiredAttributes.filter(attribute => !envelope.permittedAttributes.includes(attribute));
  if (missingAttributes.length > 0) errors.push('address-consent-envelope-missing-required-attributes');

  if (options.expectedAudiencePartyId) {
    const expectedAudience = cleanToken(options.expectedAudiencePartyId, '');
    if (!envelope.parties.some(party => party.partyId === expectedAudience)) {
      errors.push('address-consent-envelope-audience-mismatch');
    }
  }

  if (options.expectedSubjectCommitment && envelope.subject.subjectCommitment !== options.expectedSubjectCommitment) {
    errors.push('address-consent-envelope-subject-mismatch');
  }

  if (options.trustedIssuerIds) {
    const trusted = new Set(Array.from(options.trustedIssuerIds).map(value => cleanToken(value, '')));
    const issuerParties = envelope.parties.filter(party => party.role === 'issuer' || party.role === 'ngo' || party.role === 'municipality');
    if (issuerParties.length > 0 && !issuerParties.some(party => trusted.has(party.partyId))) {
      errors.push('address-consent-envelope-untrusted-issuer-or-organization');
    }
  }

  const signedRoles = new Set(envelope.signatures.map(signature => signature.role));
  const missingSignerRoles = envelope.requiredSignerRoles.filter(role => !signedRoles.has(role));
  if (missingSignerRoles.length > 0) errors.push('address-consent-envelope-missing-required-signatures');

  const signerSecrets = options.signerSecrets ?? [];
  const requireSignatureVerification = options.requireSignatureVerification ?? signerSecrets.length > 0;
  let signatureValid: boolean | null = signerSecrets.length > 0 ? true : null;

  for (const signature of envelope.signatures) {
    if (signature.payloadHash !== expectedPayloadHash) {
      errors.push('address-consent-envelope-signature-payload-hash-mismatch');
      signatureValid = false;
      continue;
    }

    const signer = signerSecrets.find(secret =>
      normalizePartyRole(secret.role, 'grantor') === signature.role
      && cleanToken(secret.signerId, `${signature.role}:unknown`, 120) === signature.signerId
    );
    if (!signer) {
      if (requireSignatureVerification && envelope.requiredSignerRoles.includes(signature.role)) {
        warnings.push(`address-consent-envelope-missing-secret-for-${signature.role}`);
      }
      continue;
    }

    const expectedValue = await hmacSha256Hex(signer.signerSecret, expectedPayloadHash);
    if (expectedValue !== signature.value) {
      errors.push('address-consent-envelope-signature-invalid');
      signatureValid = false;
    }
  }

  if (requireSignatureVerification) {
    for (const role of envelope.requiredSignerRoles) {
      const signature = envelope.signatures.find(item => item.role === role);
      if (!signature) continue;
      const signer = signerSecrets.find(secret =>
        normalizePartyRole(secret.role, 'grantor') === role
        && cleanToken(secret.signerId, `${role}:unknown`, 120) === signature.signerId
      );
      if (!signer) {
        errors.push(`address-consent-envelope-required-signature-not-verifiable:${role}`);
        signatureValid = false;
      }
    }
  }

  const privacyPreserved = validateAddressConsentEnvelope(envelope).ok;
  const active = errors.length === 0 && envelope.status === 'active';
  return {
    valid: errors.length === 0 && (!requireSignatureVerification || signatureValid === true),
    signatureValid,
    active,
    expired,
    revoked,
    missingSignerRoles,
    missingScopes,
    missingAttributes,
    privacyPreserved,
    errors,
    warnings,
  };
}
