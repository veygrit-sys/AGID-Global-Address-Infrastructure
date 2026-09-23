import {
  parseRegisteredAddressQrPayload,
  type RegisteredAddressRecord,
} from './registeredAddressQr';
import {
  isValidAGIDFormat,
  normalizeAGIDInput,
} from './agidSecurity';
import {
  evaluateShippingAddressAccuracy,
  normalizeShippingAddressAccuracyDecision,
  publicShippingAddressAccuracyDecision,
  type ShippingAddressAccuracyEvidence,
  type ShippingAddressAccuracyPublicDecision,
  type ShippingAddressAccuracySource,
  type ShippingAddressAccuracyStatus,
} from './shippingAddressAccuracy';
import { sha256Hex } from './sha256';

export const SHIPPING_LABEL_QR_PREFIX = 'agid:waybill:';
export const SHIPPING_LABEL_QR_MODEL_VERSION = 'agid-shipping-label-qr-v1';
export const SHIPPING_LABEL_RECIPIENT_COMMITMENT_ALGORITHM = 'sha256-domain-waybill-recipient-secret-nonce-v2';
export const SHIPPING_LABEL_NULLIFIER_ALGORITHM = 'sha256-domain-waybill-alias-jti-nullifier-v2';
export const SHIPPING_LABEL_RECIPIENT_CHALLENGE_SIGNATURE_ALGORITHM = 'sha256-waybill-recipient-challenge-v2';
export const SHIPPING_LABEL_WAYBILL_ALIAS_ALGORITHM = 'sha256-domain-private-waybill-jti-alias-v1';
export const SHIPPING_LABEL_WAYBILL_COMMITMENT_ALGORITHM = 'sha256-domain-private-waybill-alias-commitment-v1';
export const SHIPPING_LABEL_ADDRESS_REFERENCE_COMMITMENT_ALGORITHM = 'sha256-domain-address-reference-commitment-v1';
export const SHIPPING_LABEL_STANDARD_TTL_SECONDS = 15 * 60;
export const SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS = 5 * 60;

const SHIPPING_LABEL_JTI_PATTERN = /^[0-9A-HJKMNP-TV-Z]{16,64}$/;
const SHIPPING_LABEL_JTI_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SHIPPING_LABEL_WAYBILL_ALIAS_PATTERN = /^WBA-[0-9A-F]{12,32}$/;
const SHIPPING_LABEL_DOMAIN_PATTERN = /^[a-z0-9][a-z0-9._:-]{1,79}$/;

export const SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS = {
  waybillAlias: 'delivery:waybill-alias',
  waybillCommitment: 'delivery:waybill-commitment',
  addressReference: 'delivery:address-reference',
  nullifier: 'delivery:nullifier',
  carrier: 'delivery:carrier',
  recipient: 'delivery:recipient',
  return: 'return',
  pickup: 'pickup',
} as const;

export type ShippingLabelScanRole = 'carrier' | 'recipient';
export type ShippingLabelScanStatus = 'accepted' | 'rejected' | 'review';
export type ShippingLabelProofLevel =
  | 'none'
  | 'address-valid'
  | 'carrier-accepted'
  | 'recipient-controlled'
  | 'delivery-completed';

export type ShippingLabelProofStage = {
  level: Exclude<ShippingLabelProofLevel, 'none'>;
  rank: 1 | 2 | 3 | 4;
  label: 'Address Valid' | 'Carrier Accepted' | 'Recipient Controlled' | 'Delivery Completed';
  verified: boolean;
  detail: string;
};

export type ShippingLabelRiskLevel = 'standard' | 'high';
export type ShippingLabelHighRiskUseCase =
  | 'domestic-violence'
  | 'evacuation'
  | 'refugee'
  | 'humanitarian'
  | 'field-protection';
export type ShippingLabelSafetyPolicy = {
  mode: 'standard' | 'high-risk';
  useCases: ShippingLabelHighRiskUseCase[];
  preciseAgidExposed: false;
  agidSharing: 'public-agid-ok' | 'agid-s-only';
  maxTtlSeconds: number;
  revokeOnReceipt: boolean;
  immediateRevocationRequired: boolean;
  retainAddressHistory: boolean;
  addressHistoryPolicy: 'standard-redacted-receipt' | 'not-retained';
  notes: string[];
};
export type ShippingLabelDomainSeparation = {
  waybillAlias: string;
  waybillCommitment: string;
  addressReference: string;
  nullifier: string;
  carrier: string;
  recipient: string;
  return: string;
  pickup: string;
};
export type ShippingLabelRecipientProofMethod =
  | 'recipient-secret-commitment'
  | 'passkey-webauthn'
  | 'aoid-credential'
  | 'nfc-card'
  | 'presence-only';

export const SHIPPING_LABEL_PROOF_STAGE_DEFINITIONS: Array<Omit<ShippingLabelProofStage, 'verified'>> = [
  {
    level: 'address-valid',
    rank: 1,
    label: 'Address Valid',
    detail: 'AGID, AOID, or registered address reference is syntactically usable and not expired.',
  },
  {
    level: 'carrier-accepted',
    rank: 2,
    label: 'Carrier Accepted',
    detail: 'Carrier-side scan has accepted the waybill and address reference for package handling.',
  },
  {
    level: 'recipient-controlled',
    rank: 3,
    label: 'Recipient Controlled',
    detail: 'Recipient-side proof code, credential, or passkey evidence has been presented.',
  },
  {
    level: 'delivery-completed',
    rank: 4,
    label: 'Delivery Completed',
    detail: 'Carrier and recipient evidence are both present with terminal-signed receipt evidence.',
  },
];

export type ShippingLabelAddressReference = {
  kind: 'registered-address' | 'agid' | 'aoid-reference';
  referenceCommitment?: string;
  commitmentAlgorithm?: typeof SHIPPING_LABEL_ADDRESS_REFERENCE_COMMITMENT_ALGORITHM | string;
  entityId?: string;
  agid?: string;
  aoidId?: string;
  country?: string;
  city?: string;
  postcode?: string;
  label?: string;
};

export type ShippingLabelRecipientProof = {
  method: ShippingLabelRecipientProofMethod;
  commitment?: string;
  algorithm?: typeof SHIPPING_LABEL_RECIPIENT_COMMITMENT_ALGORITHM | string;
  domain?: string;
  nonce?: string;
  hint?: string;
};

export type ShippingLabelNullifier = {
  value: string;
  algorithm: typeof SHIPPING_LABEL_NULLIFIER_ALGORITHM;
  scope: string;
};

export type ShippingLabelRecipientChallengeProof = {
  challenge: string;
  signature: string;
  algorithm?: typeof SHIPPING_LABEL_RECIPIENT_CHALLENGE_SIGNATURE_ALGORITHM | string;
  publicKeyHint?: string;
};

export type ShippingLabelQrRecord = {
  modelVersion: typeof SHIPPING_LABEL_QR_MODEL_VERSION;
  version: 1;
  type: 'AGID_WAYBILL';
  waybillId: string;
  waybillCommitment?: string;
  waybillCommitmentAlgorithm?: typeof SHIPPING_LABEL_WAYBILL_COMMITMENT_ALGORITHM | string;
  jti: string;
  carrierId?: string;
  serviceLevel?: string;
  issuedAt: string;
  expiresAt: string;
  riskLevel: ShippingLabelRiskLevel;
  safetyPolicy: ShippingLabelSafetyPolicy;
  address: ShippingLabelAddressReference;
  addressAccuracy: ShippingAddressAccuracyPublicDecision;
  recipientProof: ShippingLabelRecipientProof;
  nullifier: ShippingLabelNullifier;
  requiredScans: ShippingLabelScanRole[];
  domainSeparation: ShippingLabelDomainSeparation;
  privacy: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawWaybillIdStored: false;
    plaintextRecipientStored: false;
    phoneStored: false;
    recipientSecretStored: false;
    shortTermWaybillAlias: true;
    addressReferenceCommitmentStored: true;
  };
};

export type BuildShippingLabelQrInput = {
  waybillId?: string;
  waybillAlias?: string;
  jti?: string;
  carrierId?: string;
  serviceLevel?: string;
  issuedAt?: string;
  expiresAt?: string;
  riskLevel?: ShippingLabelRiskLevel;
  highRiskUseCases?: ShippingLabelHighRiskUseCase[];
  addressPayload?: string;
  address?: Partial<ShippingLabelAddressReference>;
  addressAccuracyEvidence?: ShippingAddressAccuracyEvidence;
  recipientProofCode?: string;
  recipientProofSecret?: string;
  recipientProofCommitment?: string;
  recipientProofMethod?: ShippingLabelRecipientProofMethod;
  recipientProofDomain?: string;
  recipientProofNonce?: string;
  recipientProofHint?: string;
  requiredScans?: ShippingLabelScanRole[];
  domainSeparation?: Partial<ShippingLabelDomainSeparation>;
};

export type ShippingLabelScanResult = {
  record: ShippingLabelQrRecord;
  scanId: string;
  waybillId: string;
  jti: string;
  nullifier: string;
  riskLevel: ShippingLabelRiskLevel;
  role: ShippingLabelScanRole;
  scannedAt: string;
  accepted: boolean;
  status: ShippingLabelScanStatus;
  proofLevel: ShippingLabelProofLevel;
  proofStages: ShippingLabelProofStage[];
  addressVerified: boolean;
  addressAccuracyStatus: ShippingAddressAccuracyStatus;
  addressAccuracyDecision: ShippingAddressAccuracyPublicDecision['decision'];
  addressAccuracySources: ShippingAddressAccuracySource[];
  carrierScanVerified: boolean;
  ownerVerified: boolean;
  packageReceiptVerified: boolean;
  recipientChallengeRequired: boolean;
  recipientChallengeVerified: boolean;
  errors: string[];
  warnings: string[];
  privacyNotes: string[];
};

export type ShippingLabelMergedProof = {
  waybillId: string;
  jti?: string;
  nullifier?: string;
  riskLevel?: ShippingLabelRiskLevel;
  proofLevel: ShippingLabelProofLevel;
  proofStages: ShippingLabelProofStage[];
  addressVerified: boolean;
  addressAndOwnerVerified: boolean;
  packageReceiptVerified: boolean;
  terminalSigned: boolean;
  deliveryCompleted: boolean;
  carrierScanVerified: boolean;
  recipientControlVerified: boolean;
  ownerVerified: boolean;
  claims: {
    validAddressReference: boolean;
    carrierHandledPackage: boolean;
    recipientControl: boolean;
    packageReceipt: boolean;
    deliveryCompleted: boolean;
  };
  errors: string[];
  warnings: string[];
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function compact<T>(values: Array<T | undefined | null | ''>) {
  return values.filter((value): value is T => Boolean(value));
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function decodeComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function safeJson(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

function shortTail(value: unknown, size = 6) {
  const cleaned = cleanText(value);
  return cleaned.length <= size ? cleaned : cleaned.slice(-size);
}

function cleanDomain(value: unknown, fallback: string) {
  const cleaned = cleanText(value).toLowerCase();
  return SHIPPING_LABEL_DOMAIN_PATTERN.test(cleaned) ? cleaned : fallback;
}

function buildDomainSeparation(input?: Partial<ShippingLabelDomainSeparation>): ShippingLabelDomainSeparation {
  return {
    waybillAlias: cleanDomain(input?.waybillAlias, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.waybillAlias),
    waybillCommitment: cleanDomain(input?.waybillCommitment, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.waybillCommitment),
    addressReference: cleanDomain(input?.addressReference, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.addressReference),
    nullifier: cleanDomain(input?.nullifier, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.nullifier),
    carrier: cleanDomain(input?.carrier, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.carrier),
    recipient: cleanDomain(input?.recipient, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.recipient),
    return: cleanDomain(input?.return, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.return),
    pickup: cleanDomain(input?.pickup, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.pickup),
  };
}

const SHIPPING_LABEL_RECIPIENT_PROOF_METHOD_DOMAINS: Record<ShippingLabelRecipientProofMethod, string> = {
  'recipient-secret-commitment': SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.recipient,
  'passkey-webauthn': `${SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.recipient}:passkey-webauthn`,
  'aoid-credential': `${SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.recipient}:aoid-credential`,
  'nfc-card': `${SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.recipient}:nfc-card`,
  'presence-only': `${SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.recipient}:presence-only`,
};

function normalizeRecipientProofMethod(value: unknown): ShippingLabelRecipientProofMethod {
  return value === 'passkey-webauthn'
    || value === 'aoid-credential'
    || value === 'nfc-card'
    || value === 'presence-only'
    || value === 'recipient-secret-commitment'
    ? value
    : 'recipient-secret-commitment';
}

function isRecipientProofMethod(value: unknown): value is ShippingLabelRecipientProofMethod {
  return value === 'passkey-webauthn'
    || value === 'aoid-credential'
    || value === 'nfc-card'
    || value === 'presence-only'
    || value === 'recipient-secret-commitment';
}

function recipientProofMethodRequiresCommitment(method: ShippingLabelRecipientProofMethod) {
  return method !== 'presence-only';
}

function recipientProofDomain(
  method: ShippingLabelRecipientProofMethod,
  domain?: unknown,
  fallbackPurposeDomain: string = SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.recipient,
) {
  const explicit = cleanDomain(domain, '');
  if (explicit) return explicit;
  const fallback = method === 'recipient-secret-commitment'
    ? fallbackPurposeDomain
    : `${fallbackPurposeDomain}:${method}`;
  return cleanDomain(fallback, SHIPPING_LABEL_RECIPIENT_PROOF_METHOD_DOMAINS[method]);
}

function normalizeRecipientSecret(value: unknown) {
  return cleanText(value).normalize('NFKC');
}

function recipientProofCommitmentPayload(input: {
  domain: string;
  waybillId: string;
  recipientSecret: string;
  nonce: string;
}) {
  return [input.domain, input.waybillId, input.recipientSecret, input.nonce]
    .map(part => `${part.length}:${part}`)
    .join('|');
}

function recipientProofMissingError(method: ShippingLabelRecipientProofMethod) {
  return method === 'passkey-webauthn'
    ? 'recipient-passkey-proof-required'
    : method === 'aoid-credential'
      ? 'recipient-aoid-credential-proof-required'
      : method === 'nfc-card'
        ? 'recipient-nfc-card-proof-required'
        : 'recipient-proof-code-required';
}

function recipientProofMismatchError(method: ShippingLabelRecipientProofMethod) {
  return method === 'passkey-webauthn'
    ? 'recipient-passkey-proof-mismatch'
    : method === 'aoid-credential'
      ? 'recipient-aoid-credential-proof-mismatch'
      : method === 'nfc-card'
        ? 'recipient-nfc-card-proof-mismatch'
        : 'recipient-proof-code-mismatch';
}

function generateRandomJti(length = 26) {
  const bytes = new Uint8Array(length);
  const cryptoLike = globalThis.crypto;
  if (cryptoLike?.getRandomValues) {
    cryptoLike.getRandomValues(bytes);
  } else {
    const seed = sha256Hex(`${Date.now()}|${Math.random()}|${Math.random()}`);
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = parseInt(seed.slice((i * 2) % seed.length, ((i * 2) % seed.length) + 2), 16);
    }
  }
  return Array.from(bytes, byte => SHIPPING_LABEL_JTI_ALPHABET[byte % SHIPPING_LABEL_JTI_ALPHABET.length]).join('');
}

function normalizeJti(value: unknown) {
  return cleanText(value).toUpperCase().replace(/[ILO]/g, match => (
    match === 'I' || match === 'L' ? '1' : '0'
  ));
}

function normalizeRiskLevel(value: unknown): ShippingLabelRiskLevel {
  return value === 'high' ? 'high' : 'standard';
}

const SHIPPING_LABEL_HIGH_RISK_USE_CASES = new Set<ShippingLabelHighRiskUseCase>([
  'domestic-violence',
  'evacuation',
  'refugee',
  'humanitarian',
  'field-protection',
]);

function normalizeHighRiskUseCases(value: unknown): ShippingLabelHighRiskUseCase[] {
  const values = Array.isArray(value) ? value : [];
  const useCases = values.filter((item): item is ShippingLabelHighRiskUseCase => (
    typeof item === 'string' && SHIPPING_LABEL_HIGH_RISK_USE_CASES.has(item as ShippingLabelHighRiskUseCase)
  ));
  return Array.from(new Set(useCases));
}

function ttlSecondsBetween(
  issuedAt: string,
  expiresAt: string,
  fallbackSeconds: number,
) {
  const issuedAtMs = Date.parse(issuedAt);
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(expiresAtMs)) return fallbackSeconds;
  return Math.max(0, Math.round((expiresAtMs - issuedAtMs) / 1000));
}

export function buildShippingLabelSafetyPolicy(input: {
  riskLevel: ShippingLabelRiskLevel;
  useCases?: unknown;
  ttlSeconds?: number;
}): ShippingLabelSafetyPolicy {
  if (input.riskLevel === 'high') {
    const useCases = normalizeHighRiskUseCases(input.useCases);
    return {
      mode: 'high-risk',
      useCases: useCases.length ? useCases : ['field-protection'],
      preciseAgidExposed: false,
      agidSharing: 'agid-s-only',
      maxTtlSeconds: Math.min(
        input.ttlSeconds ?? SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS,
        SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS,
      ),
      revokeOnReceipt: true,
      immediateRevocationRequired: true,
      retainAddressHistory: false,
      addressHistoryPolicy: 'not-retained',
      notes: [
        'Do not expose a precise AGID; share the underlying location only through AGID-S.',
        'Keep the label short-lived and revoke or mark used immediately after recipient handoff.',
        'Do not retain address history for domestic-violence, evacuation, refugee, or humanitarian workflows.',
      ],
    };
  }

  return {
    mode: 'standard',
    useCases: [],
    preciseAgidExposed: false,
    agidSharing: 'public-agid-ok',
    maxTtlSeconds: input.ttlSeconds ?? SHIPPING_LABEL_STANDARD_TTL_SECONDS,
    revokeOnReceipt: false,
    immediateRevocationRequired: false,
    retainAddressHistory: true,
    addressHistoryPolicy: 'standard-redacted-receipt',
    notes: [
      'Standard mode may accept public AGID references, but raw address and raw AGID are still redacted from the waybill QR.',
    ],
  };
}

function normalizeSafetyPolicy(
  value: unknown,
  riskLevel: ShippingLabelRiskLevel,
  ttlSeconds: number,
): ShippingLabelSafetyPolicy {
  const fallback = buildShippingLabelSafetyPolicy({ riskLevel, ttlSeconds });
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const policy = value as Partial<ShippingLabelSafetyPolicy> & Record<string, unknown>;
  const useCases = normalizeHighRiskUseCases(policy.useCases);

  if (riskLevel === 'high') {
    return {
      ...fallback,
      useCases: useCases.length ? useCases : fallback.useCases,
      preciseAgidExposed: false,
      agidSharing: policy.agidSharing === 'agid-s-only' ? 'agid-s-only' : fallback.agidSharing,
      maxTtlSeconds: Math.min(
        typeof policy.maxTtlSeconds === 'number' && Number.isFinite(policy.maxTtlSeconds)
          ? Math.max(0, Math.round(policy.maxTtlSeconds))
          : fallback.maxTtlSeconds,
        SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS,
      ),
      revokeOnReceipt: policy.revokeOnReceipt === false ? false : fallback.revokeOnReceipt,
      immediateRevocationRequired: policy.immediateRevocationRequired === false ? false : fallback.immediateRevocationRequired,
      retainAddressHistory: policy.retainAddressHistory === true ? true : fallback.retainAddressHistory,
      addressHistoryPolicy: policy.addressHistoryPolicy === 'not-retained'
        ? 'not-retained'
        : fallback.addressHistoryPolicy,
      notes: Array.isArray(policy.notes)
        ? policy.notes.map(cleanText).filter(Boolean).slice(0, 6)
        : fallback.notes,
    };
  }

  return {
    ...fallback,
    preciseAgidExposed: false,
    maxTtlSeconds: typeof policy.maxTtlSeconds === 'number' && Number.isFinite(policy.maxTtlSeconds)
      ? Math.max(0, Math.round(policy.maxTtlSeconds))
      : fallback.maxTtlSeconds,
    notes: Array.isArray(policy.notes)
      ? policy.notes.map(cleanText).filter(Boolean).slice(0, 6)
      : fallback.notes,
  };
}

function addSeconds(iso: string, seconds: number) {
  const issuedAtMs = Date.parse(iso);
  const base = Number.isFinite(issuedAtMs) ? issuedAtMs : Date.now();
  return new Date(base + seconds * 1000).toISOString();
}

function normalizeRole(value: unknown): ShippingLabelScanRole | undefined {
  return value === 'carrier' || value === 'recipient' ? value : undefined;
}

function normalizeRequiredScans(value: unknown): ShippingLabelScanRole[] {
  const roles = Array.isArray(value)
    ? value.map(normalizeRole).filter((role): role is ShippingLabelScanRole => Boolean(role))
    : [];
  return Array.from(new Set(roles.length ? roles : ['carrier', 'recipient']));
}

function summarizeAddressRecord(record: RegisteredAddressRecord): ShippingLabelAddressReference {
  return {
    kind: record.type === 'AOID' ? 'aoid-reference' : 'registered-address',
    entityId: cleanText(record.id),
    ...(cleanText(record.agid) ? { agid: normalizeAGIDInput(record.agid) } : {}),
    ...(record.type === 'AOID' ? { aoidId: cleanText(record.id) } : {}),
    ...(cleanText(record.country) ? { country: cleanText(record.country) } : {}),
    ...(cleanText(record.city) ? { city: cleanText(record.city) } : {}),
    ...(cleanText(record.postcode) ? { postcode: cleanText(record.postcode) } : {}),
    label: compact([
      record.type,
      cleanText(record.country),
      cleanText(record.city),
      cleanText(record.postcode),
      shortTail(record.id) ? `id:${shortTail(record.id)}` : undefined,
    ]).join(' / ') || record.type,
  };
}

function normalizeAddressReference(input: BuildShippingLabelQrInput): ShippingLabelAddressReference | null {
  const fromPayload = cleanText(input.addressPayload);
  if (fromPayload) {
    const addressRecord = parseRegisteredAddressQrPayload(fromPayload);
    if (addressRecord) return summarizeAddressRecord(addressRecord);

    const agid = normalizeAGIDInput(fromPayload);
    if (agid && isValidAGIDFormat(agid)) {
      return {
        kind: 'agid',
        agid,
        entityId: agid,
        label: `AGID / id:${shortTail(agid)}`,
      };
    }
  }

  const address = input.address || {};
  const agid = normalizeAGIDInput(address.agid);
  const entityId = cleanText(address.entityId) || cleanText(address.aoidId) || agid;
  if (!entityId && !agid) return null;
  const kind = address.kind === 'aoid-reference' || address.kind === 'agid' || address.kind === 'registered-address'
    ? address.kind
    : agid
      ? 'agid'
      : 'registered-address';

  return {
    kind,
    ...(entityId ? { entityId } : {}),
    ...(agid && isValidAGIDFormat(agid) ? { agid } : {}),
    ...(cleanText(address.aoidId) ? { aoidId: cleanText(address.aoidId) } : {}),
    ...(cleanText(address.country) ? { country: cleanText(address.country) } : {}),
    ...(cleanText(address.city) ? { city: cleanText(address.city) } : {}),
    ...(cleanText(address.postcode) ? { postcode: cleanText(address.postcode) } : {}),
    label: cleanText(address.label) || compact([
      kind,
      cleanText(address.country),
      cleanText(address.city),
      cleanText(address.postcode),
      shortTail(entityId) ? `id:${shortTail(entityId)}` : undefined,
    ]).join(' / '),
  };
}

export function createShippingLabelWaybillAlias(input: {
  privateWaybillId?: string;
  explicitAlias?: string;
  jti: string;
  issuedAt: string;
  carrierId?: string;
  domain?: string;
}) {
  const explicitAlias = cleanText(input.explicitAlias).toUpperCase();
  if (explicitAlias) {
    if (!SHIPPING_LABEL_WAYBILL_ALIAS_PATTERN.test(explicitAlias)) {
      throw new Error('Shipping label waybill alias must match WBA-[0-9A-F]{12,32}.');
    }
    return explicitAlias;
  }

  const domain = cleanDomain(input.domain, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.waybillAlias);
  return `WBA-${sha256Hex(stableJson({
    algorithm: SHIPPING_LABEL_WAYBILL_ALIAS_ALGORITHM,
    domain,
    privateWaybillId: cleanText(input.privateWaybillId).toUpperCase(),
    jti: normalizeJti(input.jti),
    issuedAt: cleanText(input.issuedAt),
    carrierId: cleanText(input.carrierId),
  })).slice(0, 16).toUpperCase()}`;
}

export function createShippingLabelWaybillCommitment(input: {
  privateWaybillId?: string;
  waybillAlias: string;
  jti: string;
  domain?: string;
}) {
  const waybillAlias = cleanText(input.waybillAlias).toUpperCase();
  const jti = normalizeJti(input.jti);
  if (!waybillAlias || !jti) return '';
  const domain = cleanDomain(input.domain, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.waybillCommitment);
  return `WBC-${sha256Hex(stableJson({
    algorithm: SHIPPING_LABEL_WAYBILL_COMMITMENT_ALGORITHM,
    domain,
    privateWaybillId: cleanText(input.privateWaybillId).toUpperCase() || 'not-provided',
    waybillAlias,
    jti,
  })).slice(0, 40).toUpperCase()}`;
}

export function createShippingLabelAddressReferenceCommitment(input: {
  address: ShippingLabelAddressReference;
  waybillAlias?: string;
  jti?: string;
  domain?: string;
}) {
  const existing = cleanText(input.address.referenceCommitment).toUpperCase();
  if (existing) return existing;
  const domain = cleanDomain(input.domain, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.addressReference);
  return `ARC-${sha256Hex(stableJson({
    algorithm: SHIPPING_LABEL_ADDRESS_REFERENCE_COMMITMENT_ALGORITHM,
    domain,
    waybillAlias: cleanText(input.waybillAlias).toUpperCase(),
    jti: normalizeJti(input.jti),
    addressReference: {
      kind: input.address.kind,
      entityId: cleanText(input.address.entityId),
      agid: cleanText(input.address.agid),
      aoidId: cleanText(input.address.aoidId),
      country: cleanText(input.address.country),
      city: cleanText(input.address.city),
      postcode: cleanText(input.address.postcode),
    },
  })).slice(0, 40).toUpperCase()}`;
}

function redactAddressReference(
  address: ShippingLabelAddressReference,
  domainSeparation: ShippingLabelDomainSeparation,
  waybillAlias: string,
  jti: string,
): ShippingLabelAddressReference {
  const referenceCommitment = createShippingLabelAddressReferenceCommitment({
    address,
    waybillAlias,
    jti,
    domain: domainSeparation.addressReference,
  });
  return {
    kind: address.kind,
    referenceCommitment,
    commitmentAlgorithm: SHIPPING_LABEL_ADDRESS_REFERENCE_COMMITMENT_ALGORITHM,
    label: `${address.kind} / ref:${shortTail(referenceCommitment, 8)}`,
  };
}

export function createShippingLabelRecipientCommitment(input: {
  waybillId: string;
  proofCode?: string;
  recipientSecret?: string;
  nonce?: string;
  domain?: string;
  method?: ShippingLabelRecipientProofMethod;
}) {
  const method = normalizeRecipientProofMethod(input.method);
  const recipientSecret = normalizeRecipientSecret(input.recipientSecret ?? input.proofCode);
  const waybillId = cleanText(input.waybillId).toUpperCase();
  const domain = recipientProofDomain(method, input.domain);
  const nonce = cleanText(input.nonce);
  if (!recipientSecret || !waybillId) return '';
  return sha256Hex(recipientProofCommitmentPayload({
    domain,
    nonce,
    recipientSecret,
    waybillId,
  })).toUpperCase();
}

export function createShippingLabelNullifier(input: {
  waybillId: string;
  jti: string;
  address: ShippingLabelAddressReference;
  recipientCommitment?: string;
  domain?: string;
}) {
  const waybillId = cleanText(input.waybillId).toUpperCase();
  const jti = normalizeJti(input.jti);
  if (!waybillId || !jti) return '';
  const domain = cleanDomain(input.domain, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.nullifier);
  return `SLN-${sha256Hex(stableJson({
    algorithm: SHIPPING_LABEL_NULLIFIER_ALGORITHM,
    scope: domain,
    waybillId,
    jti,
    addressReference: {
      kind: input.address.kind,
      referenceCommitment: cleanText(input.address.referenceCommitment),
    },
    recipientCommitment: cleanText(input.recipientCommitment),
  })).slice(0, 40).toUpperCase()}`;
}

export function createShippingLabelRecipientChallenge(input: {
  terminalId?: string;
  now?: string;
} = {}) {
  return `WCH-${sha256Hex(stableJson({
    kind: 'shipping-label-recipient-challenge',
    terminalId: cleanText(input.terminalId) || 'AGID-POS-LOCAL',
    now: cleanText(input.now) || new Date().toISOString(),
    nonce: generateRandomJti(16),
  })).slice(0, 24).toUpperCase()}`;
}

export function createShippingLabelRecipientChallengeSignature(input: {
  waybillId: string;
  jti: string;
  recipientProofCode?: string;
  recipientSecret?: string;
  recipientProofMethod?: ShippingLabelRecipientProofMethod;
  recipientProofDomain?: string;
  recipientProofNonce?: string;
  challenge: string;
}) {
  const waybillId = cleanText(input.waybillId).toUpperCase();
  const jti = normalizeJti(input.jti);
  const method = normalizeRecipientProofMethod(input.recipientProofMethod);
  const domain = recipientProofDomain(method, input.recipientProofDomain);
  const recipientSecret = normalizeRecipientSecret(input.recipientSecret ?? input.recipientProofCode);
  const nonce = cleanText(input.recipientProofNonce);
  const challenge = cleanText(input.challenge);
  if (!waybillId || !jti || !recipientSecret || !challenge) return '';
  return `WCSIG-${sha256Hex(stableJson({
    algorithm: SHIPPING_LABEL_RECIPIENT_CHALLENGE_SIGNATURE_ALGORITHM,
    domain,
    waybillId,
    jti,
    method,
    nonce,
    recipientCommitment: createShippingLabelRecipientCommitment({
      waybillId,
      recipientSecret,
      nonce,
      domain,
      method,
    }),
    challenge,
  })).slice(0, 48).toUpperCase()}`;
}

export function buildShippingLabelQrRecord(input: BuildShippingLabelQrInput): ShippingLabelQrRecord {
  const issuedAt = cleanText(input.issuedAt) || new Date().toISOString();
  const riskLevel = normalizeRiskLevel(input.riskLevel);
  const jti = normalizeJti(input.jti) || generateRandomJti();
  if (!SHIPPING_LABEL_JTI_PATTERN.test(jti)) {
    throw new Error('Shipping label QR requires a 16-64 character Crockford-style Base32 jti.');
  }
  const domainSeparation = buildDomainSeparation(input.domainSeparation);
  const privateWaybillId = cleanText(input.waybillId).toUpperCase();
  const rawAddress = normalizeAddressReference(input);
  if (!rawAddress) {
    throw new Error('Shipping label QR requires an AGID, AOID reference, or registered address payload.');
  }
  const waybillId = createShippingLabelWaybillAlias({
    privateWaybillId: privateWaybillId || undefined,
    explicitAlias: input.waybillAlias,
    jti,
    issuedAt,
    carrierId: cleanText(input.carrierId),
    domain: domainSeparation.waybillAlias,
  });
  const waybillCommitment = createShippingLabelWaybillCommitment({
    privateWaybillId: privateWaybillId || undefined,
    waybillAlias: waybillId,
    jti,
    domain: domainSeparation.waybillCommitment,
  });
  const addressAccuracy = publicShippingAddressAccuracyDecision(
    evaluateShippingAddressAccuracy(rawAddress, input.addressAccuracyEvidence),
  );
  const address = redactAddressReference(rawAddress, domainSeparation, waybillId, jti);
  const recipientSecret = normalizeRecipientSecret(input.recipientProofSecret ?? input.recipientProofCode);
  const requestedMethod = normalizeRecipientProofMethod(input.recipientProofMethod);
  const method: ShippingLabelRecipientProofMethod = input.recipientProofMethod
    ? requestedMethod
    : (recipientSecret || cleanText(input.recipientProofCommitment) ? 'recipient-secret-commitment' : 'presence-only');
  const domain = recipientProofDomain(method, input.recipientProofDomain, domainSeparation.recipient);
  const proofNonce = recipientProofMethodRequiresCommitment(method)
    ? (cleanText(input.recipientProofNonce) || generateRandomJti(16))
    : '';
  const commitment = cleanText(input.recipientProofCommitment)
    || (recipientSecret
      ? createShippingLabelRecipientCommitment({
        waybillId,
        recipientSecret,
        nonce: proofNonce,
        domain,
        method,
      })
      : '');
  if (recipientProofMethodRequiresCommitment(method) && !commitment) {
    throw new Error('Shipping label QR requires a recipient proof secret or commitment for the selected proof method.');
  }
  const expiresAt = cleanText(input.expiresAt)
    || addSeconds(
      issuedAt,
      riskLevel === 'high'
        ? SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS
        : SHIPPING_LABEL_STANDARD_TTL_SECONDS,
    );
  const ttlSeconds = ttlSecondsBetween(
    issuedAt,
    expiresAt,
    riskLevel === 'high'
      ? SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS
      : SHIPPING_LABEL_STANDARD_TTL_SECONDS,
  );
  const safetyPolicy = buildShippingLabelSafetyPolicy({
    riskLevel,
    useCases: input.highRiskUseCases,
    ttlSeconds,
  });
  const recipientProof: ShippingLabelRecipientProof = {
    method,
    ...(commitment ? { commitment } : {}),
    ...(commitment ? { algorithm: SHIPPING_LABEL_RECIPIENT_COMMITMENT_ALGORITHM } : {}),
    ...(commitment ? { domain } : {}),
    ...(proofNonce ? { nonce: proofNonce } : {}),
    ...(cleanText(input.recipientProofHint) ? { hint: cleanText(input.recipientProofHint) } : {}),
  };
  const nullifierValue = createShippingLabelNullifier({
    waybillId,
    jti,
    address,
    recipientCommitment: recipientProof.commitment,
    domain: domainSeparation.nullifier,
  });

  return {
    modelVersion: SHIPPING_LABEL_QR_MODEL_VERSION,
    version: 1,
    type: 'AGID_WAYBILL',
    waybillId,
    ...(waybillCommitment ? { waybillCommitment } : {}),
    ...(waybillCommitment ? { waybillCommitmentAlgorithm: SHIPPING_LABEL_WAYBILL_COMMITMENT_ALGORITHM } : {}),
    jti,
    ...(cleanText(input.carrierId) ? { carrierId: cleanText(input.carrierId) } : {}),
    ...(cleanText(input.serviceLevel) ? { serviceLevel: cleanText(input.serviceLevel) } : {}),
    issuedAt,
    expiresAt,
    riskLevel,
    safetyPolicy,
    address,
    addressAccuracy,
    recipientProof,
    nullifier: {
      value: nullifierValue,
      algorithm: SHIPPING_LABEL_NULLIFIER_ALGORITHM,
      scope: domainSeparation.nullifier,
    },
    requiredScans: normalizeRequiredScans(input.requiredScans),
    domainSeparation,
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawWaybillIdStored: false,
      plaintextRecipientStored: false,
      phoneStored: false,
      recipientSecretStored: false,
      shortTermWaybillAlias: true,
      addressReferenceCommitmentStored: true,
    },
  };
}

export function buildShippingLabelQrPayload(input: BuildShippingLabelQrInput) {
  return `${SHIPPING_LABEL_QR_PREFIX}${encodeURIComponent(JSON.stringify(buildShippingLabelQrRecord(input)))}`;
}

export function parseShippingLabelQrPayload(text: string): ShippingLabelQrRecord | null {
  const value = cleanText(text);
  if (!value.startsWith(SHIPPING_LABEL_QR_PREFIX)) return null;
  const parsed = safeJson(decodeComponent(value.slice(SHIPPING_LABEL_QR_PREFIX.length)));
  if (!parsed || parsed.modelVersion !== SHIPPING_LABEL_QR_MODEL_VERSION || parsed.version !== 1) return null;
  if (parsed.type !== 'AGID_WAYBILL' || !cleanText(parsed.waybillId)) return null;
  const jti = normalizeJti(parsed.jti);
  if (!SHIPPING_LABEL_JTI_PATTERN.test(jti)) return null;
  const expiresAt = cleanText(parsed.expiresAt);
  if (!expiresAt) return null;
  const address = parsed.address;
  if (!address || typeof address !== 'object' || Array.isArray(address)) return null;
  const addressRecord = address as Record<string, unknown>;
  const kind = cleanText(addressRecord.kind);
  if (kind !== 'registered-address' && kind !== 'agid' && kind !== 'aoid-reference') return null;
  const agid = normalizeAGIDInput(addressRecord.agid);
  if (agid && !isValidAGIDFormat(agid)) return null;
  const recipientProof = parsed.recipientProof;
  if (!recipientProof || typeof recipientProof !== 'object' || Array.isArray(recipientProof)) return null;
  const method = cleanText((recipientProof as Record<string, unknown>).method);
  if (!isRecipientProofMethod(method)) return null;
  const nullifier = parsed.nullifier;
  if (!nullifier || typeof nullifier !== 'object' || Array.isArray(nullifier)) return null;
  const nullifierRecord = nullifier as Record<string, unknown>;
  const nullifierValue = cleanText(nullifierRecord.value);
  if (!nullifierValue.startsWith('SLN-')) return null;
  const domainSeparation = buildDomainSeparation(
    parsed.domainSeparation && typeof parsed.domainSeparation === 'object' && !Array.isArray(parsed.domainSeparation)
      ? parsed.domainSeparation as Partial<ShippingLabelDomainSeparation>
      : undefined,
  );
  const waybillId = cleanText(parsed.waybillId).toUpperCase();
  const waybillCommitment = cleanText(parsed.waybillCommitment).toUpperCase();
  const referenceCommitment = cleanText(addressRecord.referenceCommitment).toUpperCase();
  const issuedAt = cleanText(parsed.issuedAt) || new Date(0).toISOString();
  const riskLevel = normalizeRiskLevel(parsed.riskLevel);
  const parsedAddress: ShippingLabelAddressReference = {
    kind: kind as ShippingLabelAddressReference['kind'],
    ...(referenceCommitment ? { referenceCommitment } : {}),
    ...(referenceCommitment ? { commitmentAlgorithm: cleanText(addressRecord.commitmentAlgorithm) || SHIPPING_LABEL_ADDRESS_REFERENCE_COMMITMENT_ALGORITHM } : {}),
    ...(cleanText(addressRecord.entityId) ? { entityId: cleanText(addressRecord.entityId) } : {}),
    ...(agid ? { agid } : {}),
    ...(cleanText(addressRecord.aoidId) ? { aoidId: cleanText(addressRecord.aoidId) } : {}),
    ...(cleanText(addressRecord.country) ? { country: cleanText(addressRecord.country) } : {}),
    ...(cleanText(addressRecord.city) ? { city: cleanText(addressRecord.city) } : {}),
    ...(cleanText(addressRecord.postcode) ? { postcode: cleanText(addressRecord.postcode) } : {}),
    ...(cleanText(addressRecord.label) ? { label: cleanText(addressRecord.label) } : {}),
  };
  const addressAccuracy = normalizeShippingAddressAccuracyDecision(parsed.addressAccuracy, parsedAddress);
  const safetyPolicy = normalizeSafetyPolicy(
    parsed.safetyPolicy,
    riskLevel,
    ttlSecondsBetween(
      issuedAt,
      expiresAt,
      riskLevel === 'high'
        ? SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS
        : SHIPPING_LABEL_STANDARD_TTL_SECONDS,
    ),
  );

  return {
    modelVersion: SHIPPING_LABEL_QR_MODEL_VERSION,
    version: 1,
    type: 'AGID_WAYBILL',
    waybillId,
    ...(waybillCommitment ? { waybillCommitment } : {}),
    ...(waybillCommitment ? { waybillCommitmentAlgorithm: cleanText(parsed.waybillCommitmentAlgorithm) || SHIPPING_LABEL_WAYBILL_COMMITMENT_ALGORITHM } : {}),
    jti,
    ...(cleanText(parsed.carrierId) ? { carrierId: cleanText(parsed.carrierId) } : {}),
    ...(cleanText(parsed.serviceLevel) ? { serviceLevel: cleanText(parsed.serviceLevel) } : {}),
    issuedAt,
    expiresAt,
    riskLevel,
    safetyPolicy,
    address: parsedAddress,
    addressAccuracy,
    recipientProof: {
      method,
      ...(cleanText((recipientProof as Record<string, unknown>).commitment) ? { commitment: cleanText((recipientProof as Record<string, unknown>).commitment) } : {}),
      ...(cleanText((recipientProof as Record<string, unknown>).algorithm) ? { algorithm: cleanText((recipientProof as Record<string, unknown>).algorithm) } : {}),
      ...(cleanText((recipientProof as Record<string, unknown>).domain) ? { domain: cleanText((recipientProof as Record<string, unknown>).domain) } : {}),
      ...(cleanText((recipientProof as Record<string, unknown>).nonce) ? { nonce: cleanText((recipientProof as Record<string, unknown>).nonce) } : {}),
      ...(cleanText((recipientProof as Record<string, unknown>).hint) ? { hint: cleanText((recipientProof as Record<string, unknown>).hint) } : {}),
    },
    nullifier: {
      value: nullifierValue,
      algorithm: SHIPPING_LABEL_NULLIFIER_ALGORITHM,
      scope: cleanText(nullifierRecord.scope) || domainSeparation.nullifier,
    },
    requiredScans: normalizeRequiredScans(parsed.requiredScans),
    domainSeparation,
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawWaybillIdStored: false,
      plaintextRecipientStored: false,
      phoneStored: false,
      recipientSecretStored: false,
      shortTermWaybillAlias: true,
      addressReferenceCommitmentStored: true,
    },
  };
}

function addressReferenceIsVerifiable(address: ShippingLabelAddressReference) {
  return Boolean(
    cleanText(address.referenceCommitment)
    || cleanText(address.entityId)
    || cleanText(address.agid)
    || cleanText(address.aoidId),
  );
}

function hasBlockingAddressError(errors: string[]) {
  return errors.some(error => (
    error === 'shipping-label-address-reference-missing'
    || error === 'shipping-label-expired'
    || error === 'shipping-label-jti-missing'
    || error === 'shipping-label-nullifier-already-used'
    || error === 'shipping-label-nullifier-mismatch'
    || error === 'shipping-label-scan-waybill-mismatch'
  ));
}

function iterableHas(values: Iterable<string> | undefined, target: string) {
  if (!values || !target) return false;
  for (const value of values) {
    if (value === target) return true;
  }
  return false;
}

function challengeHash(value: string) {
  return `WCHH-${sha256Hex(stableJson({
    kind: 'shipping-label-recipient-challenge-hash',
    value: cleanText(value),
  })).slice(0, 24).toUpperCase()}`;
}

export function buildShippingLabelProofStages(input: {
  addressVerified: boolean;
  carrierScanVerified: boolean;
  recipientControlVerified: boolean;
  deliveryCompleted?: boolean;
}): ShippingLabelProofStage[] {
  return SHIPPING_LABEL_PROOF_STAGE_DEFINITIONS.map(stage => ({
    ...stage,
    verified: stage.level === 'address-valid'
      ? input.addressVerified
      : stage.level === 'carrier-accepted'
        ? input.carrierScanVerified
        : stage.level === 'recipient-controlled'
          ? input.recipientControlVerified
          : Boolean(input.deliveryCompleted),
  }));
}

export function resolveShippingLabelProofLevel(stages: ShippingLabelProofStage[]): ShippingLabelProofLevel {
  const verified = stages
    .filter(stage => stage.verified)
    .sort((left, right) => right.rank - left.rank)[0];
  return verified?.level ?? 'none';
}

export function verifyShippingLabelScan(
  payload: string,
  options: {
    role?: ShippingLabelScanRole;
    recipientProofCode?: string;
    recipientProofSecret?: string;
    recipientProofMethod?: ShippingLabelRecipientProofMethod;
    recipientChallenge?: ShippingLabelRecipientChallengeProof;
    usedNullifiers?: Iterable<string>;
    now?: string;
  } = {},
): ShippingLabelScanResult | null {
  const record = parseShippingLabelQrPayload(payload);
  if (!record) return null;

  const role = options.role || 'carrier';
  const scannedAt = options.now || new Date().toISOString();
  const nowMs = Date.parse(scannedAt);
  const errors: string[] = [];
  const warnings: string[] = [];
  const recomputedNullifier = createShippingLabelNullifier({
    waybillId: record.waybillId,
    jti: record.jti,
    address: record.address,
    recipientCommitment: record.recipientProof.commitment,
    domain: record.domainSeparation.nullifier,
  });
  const addressVerified = addressReferenceIsVerifiable(record.address);
  const addressAccuracy = record.addressAccuracy;
  if (!addressVerified) errors.push('shipping-label-address-reference-missing');
  if (addressAccuracy.status === 'needs-review') warnings.push('shipping-label-address-needs-review');
  if (!SHIPPING_LABEL_JTI_PATTERN.test(record.jti)) errors.push('shipping-label-jti-missing');
  if (recomputedNullifier !== record.nullifier.value) errors.push('shipping-label-nullifier-mismatch');
  if (role === 'recipient' && iterableHas(options.usedNullifiers, record.nullifier.value)) {
    errors.push('shipping-label-nullifier-already-used');
  }
  if (!record.requiredScans.includes(role)) warnings.push(`shipping-label-role-not-required:${role}`);
  const expiresAtMs = Date.parse(record.expiresAt);
  const issuedAtMs = Date.parse(record.issuedAt);
  if (!Number.isFinite(expiresAtMs)) warnings.push('shipping-label-expiry-unparseable');
  if (Number.isFinite(expiresAtMs) && Number.isFinite(nowMs) && expiresAtMs <= nowMs) {
    errors.push('shipping-label-expired');
  }
  if (Number.isFinite(expiresAtMs) && Number.isFinite(issuedAtMs)) {
    const ttlSeconds = Math.round((expiresAtMs - issuedAtMs) / 1000);
    const recommended = record.riskLevel === 'high'
      ? SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS
      : SHIPPING_LABEL_STANDARD_TTL_SECONDS;
    if (ttlSeconds > recommended) warnings.push('shipping-label-expiry-longer-than-recommended');
    if (record.riskLevel === 'high' && ttlSeconds > SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS) {
      errors.push('shipping-label-high-risk-expiry-too-long');
    }
  }
  if (record.riskLevel === 'high') {
    if (record.safetyPolicy.mode !== 'high-risk') {
      errors.push('shipping-label-high-risk-safety-policy-missing');
    }
    if (record.safetyPolicy.agidSharing !== 'agid-s-only') {
      errors.push('shipping-label-high-risk-agid-s-only-required');
    }
    if (record.safetyPolicy.maxTtlSeconds > SHIPPING_LABEL_HIGH_RISK_TTL_SECONDS) {
      errors.push('shipping-label-high-risk-policy-ttl-too-long');
    }
    if (!record.safetyPolicy.revokeOnReceipt || !record.safetyPolicy.immediateRevocationRequired) {
      warnings.push('shipping-label-high-risk-immediate-revocation-required');
    }
    if (record.safetyPolicy.retainAddressHistory || record.safetyPolicy.addressHistoryPolicy !== 'not-retained') {
      errors.push('shipping-label-high-risk-address-history-retention-forbidden');
    }
  }

  let baseOwnerVerified = false;
  let recipientChallengeVerified = false;
  const recipientChallengeRequired = role === 'recipient' && record.riskLevel === 'high';
  if (role === 'recipient') {
    const method = record.recipientProof.method;
    if (options.recipientProofMethod && options.recipientProofMethod !== method) {
      warnings.push('recipient-proof-method-input-differs-from-waybill');
    }
    if (recipientProofMethodRequiresCommitment(method)) {
      const recipientSecret = normalizeRecipientSecret(options.recipientProofSecret ?? options.recipientProofCode);
      if (!recipientSecret) {
        errors.push(recipientProofMissingError(method));
      } else if (!record.recipientProof.commitment) {
        errors.push('recipient-proof-commitment-missing');
      } else {
        const localCommitment = createShippingLabelRecipientCommitment({
          waybillId: record.waybillId,
          recipientSecret,
          nonce: record.recipientProof.nonce,
          domain: record.recipientProof.domain,
          method,
        });
        if (localCommitment === record.recipientProof.commitment) {
          baseOwnerVerified = true;
        } else {
          errors.push(recipientProofMismatchError(method));
        }
      }
    } else {
      warnings.push('recipient-presence-only-not-owner-proof');
    }
    if (recipientChallengeRequired) {
      const challenge = cleanText(options.recipientChallenge?.challenge);
      const signature = cleanText(options.recipientChallenge?.signature);
      if (!challenge || !signature) {
        errors.push('recipient-challenge-signature-required');
      } else if (baseOwnerVerified) {
        const expectedSignature = createShippingLabelRecipientChallengeSignature({
          waybillId: record.waybillId,
          jti: record.jti,
          recipientSecret: normalizeRecipientSecret(options.recipientProofSecret ?? options.recipientProofCode),
          recipientProofMethod: record.recipientProof.method,
          recipientProofDomain: record.recipientProof.domain,
          recipientProofNonce: record.recipientProof.nonce,
          challenge,
        });
        if (
          options.recipientChallenge?.algorithm
          && options.recipientChallenge.algorithm !== SHIPPING_LABEL_RECIPIENT_CHALLENGE_SIGNATURE_ALGORITHM
        ) {
          errors.push('recipient-challenge-signature-algorithm-unsupported');
        } else if (expectedSignature === signature) {
          recipientChallengeVerified = true;
        } else {
          errors.push('recipient-challenge-signature-mismatch');
        }
      }
    } else if (options.recipientChallenge?.challenge && options.recipientChallenge?.signature && baseOwnerVerified) {
      const expectedSignature = createShippingLabelRecipientChallengeSignature({
        waybillId: record.waybillId,
        jti: record.jti,
        recipientSecret: normalizeRecipientSecret(options.recipientProofSecret ?? options.recipientProofCode),
        recipientProofMethod: record.recipientProof.method,
        recipientProofDomain: record.recipientProof.domain,
        recipientProofNonce: record.recipientProof.nonce,
        challenge: cleanText(options.recipientChallenge.challenge),
      });
      recipientChallengeVerified = expectedSignature === cleanText(options.recipientChallenge.signature);
      if (!recipientChallengeVerified) warnings.push('recipient-challenge-signature-not-verified');
    }
  }
  const ownerVerified = baseOwnerVerified && (!recipientChallengeRequired || recipientChallengeVerified);

  if (role === 'carrier' && record.requiredScans.includes('recipient')) {
    warnings.push('recipient-scan-required-for-owner-proof');
  }

  const carrierScanVerified = role === 'carrier' && errors.length === 0 && addressVerified;
  const packageReceiptVerified = role === 'recipient' && ownerVerified && errors.length === 0;
  const proofStages = buildShippingLabelProofStages({
    addressVerified: addressVerified && !hasBlockingAddressError(errors),
    carrierScanVerified,
    recipientControlVerified: ownerVerified && errors.length === 0,
    deliveryCompleted: false,
  });
  const status: ShippingLabelScanStatus = errors.length > 0
    ? 'rejected'
    : warnings.length > 0
      ? 'review'
      : 'accepted';
  const scanId = `WS-${sha256Hex(stableJson({
    waybillId: record.waybillId,
    jti: record.jti,
    nullifier: record.nullifier.value,
    riskLevel: record.riskLevel,
    role,
    addressTail: shortTail(record.address.referenceCommitment || record.address.entityId || record.address.agid || record.address.aoidId),
    ownerVerified,
    now: options.now || '',
  })).slice(0, 12).toUpperCase()}`;

  return {
    record,
    scanId,
    waybillId: record.waybillId,
    jti: record.jti,
    nullifier: record.nullifier.value,
    riskLevel: record.riskLevel,
    role,
    scannedAt,
    accepted: errors.length === 0,
    status,
    proofLevel: resolveShippingLabelProofLevel(proofStages),
    proofStages,
    addressVerified,
    addressAccuracyStatus: addressAccuracy.status,
    addressAccuracyDecision: addressAccuracy.decision,
    addressAccuracySources: addressAccuracy.sources,
    carrierScanVerified,
    ownerVerified,
    packageReceiptVerified,
    recipientChallengeRequired,
    recipientChallengeVerified,
    errors,
    warnings: Array.from(new Set(warnings)),
    privacyNotes: [
      'Waybill QR stores a short-term waybill alias, address-reference commitment, jti, expiry, nullifier, proof domain, proof nonce, and recipient commitment.',
      'Waybill QR does not store raw address text, raw AGID, raw waybill id, recipient name, phone number, or proof code.',
      'Recipient proof code, passkey/WebAuthn evidence, AOID credential secret, or NFC card material is checked locally and is not persisted in POS receipts.',
      'Shipping label jti and domain-separated nullifier are used to detect copied QR reuse without storing raw address text or raw AGID.',
      ...(record.safetyPolicy.mode === 'high-risk'
        ? [
          'High-risk mode requires AGID-S-only sharing for precise location, short expiry, immediate used/nullifier revocation, and no address-history retention.',
        ]
        : []),
      ...(options.recipientChallenge?.challenge
        ? [`Recipient challenge hash ${challengeHash(options.recipientChallenge.challenge)} can be stored instead of the raw challenge.`]
        : []),
    ],
  };
}

export function mergeShippingLabelScanProofs(scans: ShippingLabelScanResult[]): ShippingLabelMergedProof {
  return mergeShippingLabelScanProofsWithOptions(scans);
}

export function mergeShippingLabelScanProofsWithOptions(
  scans: ShippingLabelScanResult[],
  options: { terminalSigned?: boolean } = {},
): ShippingLabelMergedProof {
  const first = scans[0];
  const waybillId = first?.waybillId || 'unknown';
  const jti = first?.jti;
  const nullifier = first?.nullifier;
  const riskLevel = first?.riskLevel;
  const sameWaybill = scans.every(scan => scan.waybillId === waybillId);
  const sameNullifier = scans.every(scan => scan.nullifier === nullifier);
  const carrierScanVerified = scans.some(scan => scan.role === 'carrier' && scan.carrierScanVerified);
  const recipientControlVerified = scans.some(scan => scan.role === 'recipient' && scan.ownerVerified);
  const scanErrors = Array.from(new Set(scans.flatMap(scan => scan.errors)));
  const addressVerified = scans.some(scan => scan.addressVerified) && !hasBlockingAddressError(scanErrors);
  const errors = Array.from(new Set([
    ...scanErrors,
    ...(!sameWaybill ? ['shipping-label-scan-waybill-mismatch'] : []),
    ...(!sameNullifier ? ['shipping-label-scan-nullifier-mismatch'] : []),
    ...(!carrierScanVerified ? ['carrier-scan-missing'] : []),
    ...(!recipientControlVerified ? ['recipient-owner-proof-missing'] : []),
  ]));
  const warnings = Array.from(new Set(scans.flatMap(scan => scan.warnings)));
  const packageReceiptVerified = sameWaybill && carrierScanVerified && recipientControlVerified && errors.length === 0;
  const terminalSigned = Boolean(options.terminalSigned);
  const deliveryCompleted = packageReceiptVerified && terminalSigned;
  const proofStages = buildShippingLabelProofStages({
    addressVerified,
    carrierScanVerified,
    recipientControlVerified,
    deliveryCompleted,
  });

  return {
    waybillId,
    ...(jti ? { jti } : {}),
    ...(nullifier ? { nullifier } : {}),
    ...(riskLevel ? { riskLevel } : {}),
    proofLevel: resolveShippingLabelProofLevel(proofStages),
    proofStages,
    addressVerified,
    addressAndOwnerVerified: packageReceiptVerified && addressVerified,
    packageReceiptVerified,
    terminalSigned,
    deliveryCompleted,
    carrierScanVerified,
    recipientControlVerified,
    ownerVerified: recipientControlVerified,
    claims: {
      validAddressReference: addressVerified,
      carrierHandledPackage: carrierScanVerified,
      recipientControl: recipientControlVerified,
      packageReceipt: packageReceiptVerified,
      deliveryCompleted,
    },
    errors,
    warnings,
  };
}

export function summarizeShippingLabelRecord(record: ShippingLabelQrRecord) {
  const entityTail = shortTail(record.waybillId);
  const addressCommitmentTail = shortTail(record.address.referenceCommitment, 8);
  const label = compact([
    'WAYBILL',
    record.carrierId,
    entityTail ? `alias:${entityTail}` : undefined,
    addressCommitmentTail ? `addr:${addressCommitmentTail}` : undefined,
  ]).join(' / ') || 'WAYBILL';

  return {
    recordType: 'WAYBILL' as const,
    entityIdTail: entityTail,
    label,
    rawPayloadStored: false as const,
  };
}
