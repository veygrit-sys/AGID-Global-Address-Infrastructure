import {
  isValidAGIDFormat,
  normalizeAGIDInput,
} from './agidSecurity';
import {
  parseRegisteredAddressQrPayload,
  type RegisteredAddressRecord,
} from './registeredAddressQr';
import { sha256Hex } from './sha256';

export const SECURE_ADDRESS_QR_PREFIX = 'agid:secure-address:';
export const SECURE_ADDRESS_QR_MODEL_VERSION = 'agid-secure-address-qr-v1';
export const SECURE_ADDRESS_QR_ADDRESS_COMMITMENT_ALGORITHM = 'sha256-domain-secure-address-reference-v1';
export const SECURE_ADDRESS_QR_RECIPIENT_COMMITMENT_ALGORITHM = 'sha256-domain-secure-address-recipient-v1';
export const SECURE_ADDRESS_QR_ENVELOPE_COMMITMENT_ALGORITHM = 'sha256-domain-secure-address-envelope-v1';
export const SECURE_ADDRESS_QR_NULLIFIER_ALGORITHM = 'sha256-domain-secure-address-nullifier-v1';
export const SECURE_ADDRESS_QR_STANDARD_TTL_SECONDS = 10 * 60;
export const SECURE_ADDRESS_QR_HIGH_RISK_TTL_SECONDS = 5 * 60;

const SECURE_ADDRESS_QR_JTI_PATTERN = /^[0-9A-HJKMNP-TV-Z]{16,64}$/;
const SECURE_ADDRESS_QR_ALIAS_PATTERN = /^SAQ-[0-9A-F]{12,32}$/;
const SECURE_ADDRESS_QR_COMMITMENT_PATTERN = /^SAC-[0-9A-F]{40,64}$/;
const SECURE_ADDRESS_QR_RECIPIENT_COMMITMENT_PATTERN = /^SAR-[0-9A-F]{40,64}$/;
const SECURE_ADDRESS_QR_ENVELOPE_COMMITMENT_PATTERN = /^SAE-[0-9A-F]{40,64}$/;
const SECURE_ADDRESS_QR_NULLIFIER_PATTERN = /^SAN-[0-9A-F]{40,64}$/;
const SECURE_ADDRESS_QR_DOMAIN_PATTERN = /^[a-z0-9][a-z0-9._:-]{1,79}$/;
const SECURE_ADDRESS_QR_JTI_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const PRIVATE_QR_FIELD_KEYS = new Set([
  'address',
  'apartment',
  'building',
  'city',
  'coordinates',
  'geocode',
  'lat',
  'latitude',
  'lng',
  'lon',
  'longitude',
  'name',
  'organization',
  'phone',
  'postalcode',
  'postcode',
  'rawaddress',
  'recipient',
  'room',
  'state',
  'street',
  'suburb',
  'suite',
]);

const COORDINATE_PAIR_PATTERN = /-?\d{1,2}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}/;
const PRIVATE_FIELD_SAFE_PATHS = new Set([
  '$.domainSeparation.recipient',
]);

export const SECURE_ADDRESS_QR_DOMAIN_SEPARATION_DEFAULTS = {
  addressReference: 'secure-address:address-reference',
  recipient: 'secure-address:recipient',
  envelope: 'secure-address:envelope',
  nullifier: 'secure-address:nullifier',
} as const;

export type SecureAddressQrPurpose =
  | 'delivery'
  | 'hotel-check-in'
  | 'pos-handoff'
  | 'wallet-share'
  | 'pickup'
  | 'emergency'
  | 'administrative';

export type SecureAddressQrRiskLevel = 'standard' | 'high';

export type SecureAddressQrAddressReferenceKind =
  | 'registered-address'
  | 'agid-reference'
  | 'aoid-reference'
  | 'postal-zone'
  | 'external-address-vault';

export type SecureAddressQrProofMethod =
  | 'recipient-secret-commitment'
  | 'passkey-webauthn'
  | 'wallet-signature'
  | 'aoid-credential'
  | 'presence-only';

export type SecureAddressQrEnvelopeMode = 'not-included' | 'external-ref' | 'hash-only';

export type SecureAddressQrDomainSeparation = {
  addressReference: string;
  recipient: string;
  envelope: string;
  nullifier: string;
};

export type SecureAddressQrAddressReference = {
  kind: SecureAddressQrAddressReferenceKind;
  alias: string;
  referenceCommitment: string;
  commitmentAlgorithm: typeof SECURE_ADDRESS_QR_ADDRESS_COMMITMENT_ALGORITHM;
  country?: string;
  label: string;
};

export type SecureAddressQrRecipientProof = {
  method: SecureAddressQrProofMethod;
  commitment?: string;
  algorithm?: typeof SECURE_ADDRESS_QR_RECIPIENT_COMMITMENT_ALGORITHM;
  domain?: string;
  nonce?: string;
  hint?: string;
};

export type SecureAddressQrEncryptedEnvelope = {
  mode: SecureAddressQrEnvelopeMode;
  algorithm: 'external-envelope-ref' | 'A256GCM' | string;
  keyId?: string;
  envelopeRef?: string;
  envelopeCommitment?: string;
  commitmentAlgorithm?: typeof SECURE_ADDRESS_QR_ENVELOPE_COMMITMENT_ALGORITHM;
};

export type SecureAddressQrNullifier = {
  value: string;
  algorithm: typeof SECURE_ADDRESS_QR_NULLIFIER_ALGORITHM;
  scope: string;
};

export type SecureAddressQrRecord = {
  modelVersion: typeof SECURE_ADDRESS_QR_MODEL_VERSION;
  version: 1;
  type: 'SECURE_ADDRESS_QR';
  purpose: SecureAddressQrPurpose;
  scope: string;
  audience?: string;
  issuedAt: string;
  expiresAt: string;
  riskLevel: SecureAddressQrRiskLevel;
  jti: string;
  addressRef: SecureAddressQrAddressReference;
  recipientProof: SecureAddressQrRecipientProof;
  encryptedEnvelope: SecureAddressQrEncryptedEnvelope;
  nullifier: SecureAddressQrNullifier;
  requiredProofs: SecureAddressQrProofMethod[];
  maxScans: number;
  offlineScanAllowed: boolean;
  domainSeparation: SecureAddressQrDomainSeparation;
  privacy: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawCoordinatesStored: false;
    plaintextRecipientStored: false;
    phoneStored: false;
    buildingStored: false;
    roomStored: false;
    encryptedAddressStoredInQr: false;
    addressReferenceCommitmentStored: true;
    recipientCommitmentStored: boolean;
    shortLivedToken: true;
    nullifierStored: true;
  };
};

export type BuildSecureAddressQrInput = {
  purpose?: SecureAddressQrPurpose;
  scope?: string;
  audience?: string;
  issuedAt?: string;
  expiresAt?: string;
  maxTtlSeconds?: number;
  riskLevel?: SecureAddressQrRiskLevel;
  jti?: string;
  addressRecord?: RegisteredAddressRecord;
  addressPayload?: string;
  address?: Partial<SecureAddressQrAddressReference> & {
    entityId?: string;
    agid?: string;
    aoidId?: string;
    externalId?: string;
    source?: string;
  };
  recipientProofSecret?: string;
  recipientProofCode?: string;
  recipientProofCommitment?: string;
  recipientProofMethod?: SecureAddressQrProofMethod;
  recipientProofNonce?: string;
  recipientProofHint?: string;
  encryptedEnvelope?: {
    mode?: SecureAddressQrEnvelopeMode;
    algorithm?: string;
    keyId?: string;
    kid?: string;
    envelopeRef?: string;
    envelopeHash?: string;
    envelopeCommitment?: string;
    ciphertext?: string;
    ciphertextHash?: string;
  };
  requiredProofs?: SecureAddressQrProofMethod[];
  maxScans?: number;
  offlineScanAllowed?: boolean;
  domainSeparation?: Partial<SecureAddressQrDomainSeparation>;
};

export type SecureAddressQrValidationResult = {
  valid: boolean;
  status: 'valid' | 'expired' | 'unsafe' | 'invalid';
  expired: boolean;
  ttlSeconds: number;
  errors: string[];
  warnings: string[];
  privateMaterialPaths: string[];
  privacyNotes: string[];
};

export type SecureAddressQrSummary = {
  valid: boolean;
  status: SecureAddressQrValidationResult['status'];
  purpose?: SecureAddressQrPurpose;
  riskLevel?: SecureAddressQrRiskLevel;
  expiresAt?: string;
  expired: boolean;
  addressAlias?: string;
  addressReferenceTail?: string;
  nullifierTail?: string;
  requiredProofs: SecureAddressQrProofMethod[];
  privacyNotes: string[];
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

function shortTail(value: unknown, size = 8) {
  const cleaned = cleanText(value);
  return cleaned.length <= size ? cleaned : cleaned.slice(-size);
}

function addSeconds(iso: string, seconds: number) {
  const issuedAtMs = Date.parse(iso);
  const base = Number.isFinite(issuedAtMs) ? issuedAtMs : Date.now();
  return new Date(base + seconds * 1000).toISOString();
}

function ttlSecondsBetween(issuedAt: string, expiresAt: string) {
  const issuedAtMs = Date.parse(issuedAt);
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(expiresAtMs)) return 0;
  return Math.max(0, Math.round((expiresAtMs - issuedAtMs) / 1000));
}

function normalizeRiskLevel(value: unknown): SecureAddressQrRiskLevel {
  return value === 'high' ? 'high' : 'standard';
}

function normalizePurpose(value: unknown): SecureAddressQrPurpose {
  return value === 'delivery'
    || value === 'hotel-check-in'
    || value === 'pos-handoff'
    || value === 'wallet-share'
    || value === 'pickup'
    || value === 'emergency'
    || value === 'administrative'
    ? value
    : 'wallet-share';
}

function normalizeAddressReferenceKind(value: unknown): SecureAddressQrAddressReferenceKind {
  return value === 'registered-address'
    || value === 'agid-reference'
    || value === 'aoid-reference'
    || value === 'postal-zone'
    || value === 'external-address-vault'
    ? value
    : 'registered-address';
}

function normalizeProofMethod(value: unknown): SecureAddressQrProofMethod {
  return value === 'recipient-secret-commitment'
    || value === 'passkey-webauthn'
    || value === 'wallet-signature'
    || value === 'aoid-credential'
    || value === 'presence-only'
    ? value
    : 'recipient-secret-commitment';
}

function proofMethodRequiresCommitment(method: SecureAddressQrProofMethod) {
  return method !== 'presence-only';
}

function normalizeJti(value: unknown) {
  return cleanText(value).toUpperCase().replace(/[ILO]/g, match => (
    match === 'I' || match === 'L' ? '1' : '0'
  ));
}

function normalizeCountryCode(value: unknown) {
  const cleaned = cleanText(value).toUpperCase();
  return /^[A-Z]{2}$/.test(cleaned) ? cleaned : '';
}

function normalizeDomain(value: unknown, fallback: string) {
  const cleaned = cleanText(value).toLowerCase();
  return SECURE_ADDRESS_QR_DOMAIN_PATTERN.test(cleaned) ? cleaned : fallback;
}

function buildDomainSeparation(input?: Partial<SecureAddressQrDomainSeparation>): SecureAddressQrDomainSeparation {
  return {
    addressReference: normalizeDomain(input?.addressReference, SECURE_ADDRESS_QR_DOMAIN_SEPARATION_DEFAULTS.addressReference),
    recipient: normalizeDomain(input?.recipient, SECURE_ADDRESS_QR_DOMAIN_SEPARATION_DEFAULTS.recipient),
    envelope: normalizeDomain(input?.envelope, SECURE_ADDRESS_QR_DOMAIN_SEPARATION_DEFAULTS.envelope),
    nullifier: normalizeDomain(input?.nullifier, SECURE_ADDRESS_QR_DOMAIN_SEPARATION_DEFAULTS.nullifier),
  };
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
  return Array.from(bytes, byte => SECURE_ADDRESS_QR_JTI_ALPHABET[byte % SECURE_ADDRESS_QR_JTI_ALPHABET.length]).join('');
}

function normalizedRequiredProofs(
  value: unknown,
  recipientMethod: SecureAddressQrProofMethod,
): SecureAddressQrProofMethod[] {
  const proofs = Array.isArray(value)
    ? value.map(normalizeProofMethod).filter(Boolean)
    : [];
  const defaults = recipientMethod === 'presence-only'
    ? ['presence-only' as const]
    : [recipientMethod];
  return Array.from(new Set(proofs.length ? proofs : defaults));
}

function normalizeRecipientSecret(value: unknown) {
  return cleanText(value).normalize('NFKC');
}

function commitmentPayload(parts: Record<string, unknown>) {
  return stableJson(parts);
}

export function collectSecureAddressQrPrivateMaterial(value: unknown, path = '$'): string[] {
  const findings: string[] = [];
  const visit = (nestedValue: unknown, nestedPath: string, keyName = '') => {
    if (PRIVATE_FIELD_SAFE_PATHS.has(nestedPath)) return;
    const normalizedKey = keyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedKey && PRIVATE_QR_FIELD_KEYS.has(normalizedKey)) {
      if (nestedValue !== undefined && nestedValue !== null && cleanText(nestedValue) !== '') {
        findings.push(nestedPath);
      }
    }

    if (typeof nestedValue === 'string') {
      if (COORDINATE_PAIR_PATTERN.test(nestedValue)) findings.push(nestedPath);
      return;
    }
    if (!nestedValue || typeof nestedValue !== 'object') return;

    if (Array.isArray(nestedValue)) {
      nestedValue.forEach((item, index) => visit(item, `${nestedPath}[${index}]`));
      return;
    }

    for (const [key, child] of Object.entries(nestedValue as Record<string, unknown>)) {
      visit(child, `${nestedPath}.${key}`, key);
    }
  };

  visit(value, path);
  return Array.from(new Set(findings));
}

export function createSecureAddressReferenceCommitment(input: {
  source: unknown;
  domain?: string;
  purpose?: SecureAddressQrPurpose;
  scope?: string;
}) {
  const domain = normalizeDomain(input.domain, SECURE_ADDRESS_QR_DOMAIN_SEPARATION_DEFAULTS.addressReference);
  return `SAC-${sha256Hex(commitmentPayload({
    algorithm: SECURE_ADDRESS_QR_ADDRESS_COMMITMENT_ALGORITHM,
    domain,
    purpose: normalizePurpose(input.purpose),
    scope: cleanText(input.scope) || 'default',
    source: input.source,
  })).slice(0, 48).toUpperCase()}`;
}

export function createSecureAddressRecipientCommitment(input: {
  addressReferenceCommitment: string;
  jti: string;
  recipientSecret?: string;
  proofCode?: string;
  nonce?: string;
  domain?: string;
  method?: SecureAddressQrProofMethod;
}) {
  const method = normalizeProofMethod(input.method);
  if (!proofMethodRequiresCommitment(method)) return '';
  const recipientSecret = normalizeRecipientSecret(input.recipientSecret ?? input.proofCode);
  const referenceCommitment = cleanText(input.addressReferenceCommitment).toUpperCase();
  const jti = normalizeJti(input.jti);
  const nonce = cleanText(input.nonce);
  if (!recipientSecret || !referenceCommitment || !jti) return '';
  const domain = normalizeDomain(input.domain, SECURE_ADDRESS_QR_DOMAIN_SEPARATION_DEFAULTS.recipient);
  return `SAR-${sha256Hex(commitmentPayload({
    algorithm: SECURE_ADDRESS_QR_RECIPIENT_COMMITMENT_ALGORITHM,
    domain,
    method,
    addressReferenceCommitment: referenceCommitment,
    jti,
    nonce,
    recipientSecret,
  })).slice(0, 48).toUpperCase()}`;
}

export function createSecureAddressEnvelopeCommitment(input: {
  ciphertext?: string;
  ciphertextHash?: string;
  envelopeHash?: string;
  envelopeRef?: string;
  addressReferenceCommitment?: string;
  domain?: string;
}) {
  const existing = cleanText(input.envelopeHash || input.ciphertextHash).toUpperCase();
  if (SECURE_ADDRESS_QR_ENVELOPE_COMMITMENT_PATTERN.test(existing)) return existing;
  const source = cleanText(input.ciphertext)
    || cleanText(input.ciphertextHash)
    || cleanText(input.envelopeHash)
    || cleanText(input.envelopeRef)
    || cleanText(input.addressReferenceCommitment);
  if (!source) return '';
  const domain = normalizeDomain(input.domain, SECURE_ADDRESS_QR_DOMAIN_SEPARATION_DEFAULTS.envelope);
  return `SAE-${sha256Hex(commitmentPayload({
    algorithm: SECURE_ADDRESS_QR_ENVELOPE_COMMITMENT_ALGORITHM,
    domain,
    source,
  })).slice(0, 48).toUpperCase()}`;
}

export function createSecureAddressNullifier(input: {
  addressReferenceCommitment: string;
  recipientCommitment?: string;
  jti: string;
  purpose?: SecureAddressQrPurpose;
  scope?: string;
  audience?: string;
  domain?: string;
}) {
  const referenceCommitment = cleanText(input.addressReferenceCommitment).toUpperCase();
  const jti = normalizeJti(input.jti);
  if (!referenceCommitment || !jti) return '';
  const domain = normalizeDomain(input.domain, SECURE_ADDRESS_QR_DOMAIN_SEPARATION_DEFAULTS.nullifier);
  return `SAN-${sha256Hex(commitmentPayload({
    algorithm: SECURE_ADDRESS_QR_NULLIFIER_ALGORITHM,
    domain,
    addressReferenceCommitment: referenceCommitment,
    recipientCommitment: cleanText(input.recipientCommitment),
    jti,
    purpose: normalizePurpose(input.purpose),
    scope: cleanText(input.scope) || 'default',
    audience: cleanText(input.audience),
  })).slice(0, 48).toUpperCase()}`;
}

function resolveAddressRecord(input: BuildSecureAddressQrInput): RegisteredAddressRecord | null {
  if (input.addressRecord) return input.addressRecord;
  const payload = cleanText(input.addressPayload);
  return payload ? parseRegisteredAddressQrPayload(payload) : null;
}

function buildReferenceSourceFromRecord(record: RegisteredAddressRecord) {
  return {
    source: 'registered-address',
    type: record.type,
    id: cleanText(record.id),
    agid: cleanText(record.agid),
    country: normalizeCountryCode(record.country),
    registeredAt: cleanText(record.registeredAt),
    addressDigest: sha256Hex(stableJson({
      name: cleanText(record.name),
      address: cleanText(record.address),
      recipient: cleanText(record.recipient),
      organization: cleanText(record.organization),
      phone: cleanText(record.phone),
      street: cleanText(record.street),
      city: cleanText(record.city),
      state: cleanText(record.state),
      postcode: cleanText(record.postcode),
      building: cleanText(record.building),
      room: cleanText(record.room),
      lat: typeof record.lat === 'number' ? record.lat : undefined,
      lon: typeof record.lon === 'number' ? record.lon : undefined,
    })),
  };
}

function normalizeAddressReference(input: BuildSecureAddressQrInput, domainSeparation: SecureAddressQrDomainSeparation): SecureAddressQrAddressReference | null {
  const purpose = normalizePurpose(input.purpose);
  const scope = cleanText(input.scope) || purpose;
  const record = resolveAddressRecord(input);
  const fromPayload = cleanText(input.addressPayload);

  if (record) {
    const kind: SecureAddressQrAddressReferenceKind = record.type === 'AOID'
      ? 'aoid-reference'
      : 'registered-address';
    const referenceCommitment = createSecureAddressReferenceCommitment({
      source: buildReferenceSourceFromRecord(record),
      domain: domainSeparation.addressReference,
      purpose,
      scope,
    });
    return {
      kind,
      alias: `SAQ-${sha256Hex(referenceCommitment).slice(0, 16).toUpperCase()}`,
      referenceCommitment,
      commitmentAlgorithm: SECURE_ADDRESS_QR_ADDRESS_COMMITMENT_ALGORITHM,
      ...(normalizeCountryCode(record.country) ? { country: normalizeCountryCode(record.country) } : {}),
      label: `${kind} / ref:${shortTail(referenceCommitment)}`,
    };
  }

  const agid = normalizeAGIDInput(fromPayload);
  if (agid && isValidAGIDFormat(agid)) {
    const referenceCommitment = createSecureAddressReferenceCommitment({
      source: {
        source: 'agid',
        agid,
      },
      domain: domainSeparation.addressReference,
      purpose,
      scope,
    });
    return {
      kind: 'agid-reference',
      alias: `SAQ-${sha256Hex(referenceCommitment).slice(0, 16).toUpperCase()}`,
      referenceCommitment,
      commitmentAlgorithm: SECURE_ADDRESS_QR_ADDRESS_COMMITMENT_ALGORITHM,
      label: `agid-reference / ref:${shortTail(referenceCommitment)}`,
    };
  }

  const address = input.address || {};
  const existingCommitment = cleanText(address.referenceCommitment).toUpperCase();
  const kind = normalizeAddressReferenceKind(address.kind);
  const source = {
    source: cleanText(address.source) || kind,
    kind,
    entityId: cleanText(address.entityId),
    agid: normalizeAGIDInput(address.agid),
    aoidId: cleanText(address.aoidId),
    externalId: cleanText(address.externalId),
    country: normalizeCountryCode(address.country),
  };
  const hasSource = Boolean(source.entityId || source.agid || source.aoidId || source.externalId || source.country);
  const referenceCommitment = SECURE_ADDRESS_QR_COMMITMENT_PATTERN.test(existingCommitment)
    ? existingCommitment
    : hasSource
      ? createSecureAddressReferenceCommitment({
        source,
        domain: domainSeparation.addressReference,
        purpose,
        scope,
      })
      : '';

  if (!referenceCommitment) return null;
  const explicitAlias = cleanText(address.alias).toUpperCase();
  const alias = SECURE_ADDRESS_QR_ALIAS_PATTERN.test(explicitAlias)
    ? explicitAlias
    : `SAQ-${sha256Hex(referenceCommitment).slice(0, 16).toUpperCase()}`;

  return {
    kind,
    alias,
    referenceCommitment,
    commitmentAlgorithm: SECURE_ADDRESS_QR_ADDRESS_COMMITMENT_ALGORITHM,
    ...(normalizeCountryCode(address.country) ? { country: normalizeCountryCode(address.country) } : {}),
    label: `${kind} / ref:${shortTail(referenceCommitment)}`,
  };
}

function normalizeExpiresAt(input: {
  issuedAt: string;
  requestedExpiresAt?: string;
  riskLevel: SecureAddressQrRiskLevel;
  maxTtlSeconds?: number;
}) {
  const defaultTtl = input.riskLevel === 'high'
    ? SECURE_ADDRESS_QR_HIGH_RISK_TTL_SECONDS
    : SECURE_ADDRESS_QR_STANDARD_TTL_SECONDS;
  const maxTtl = Math.max(1, Math.min(
    typeof input.maxTtlSeconds === 'number' && Number.isFinite(input.maxTtlSeconds)
      ? Math.round(input.maxTtlSeconds)
      : defaultTtl,
    input.riskLevel === 'high'
      ? SECURE_ADDRESS_QR_HIGH_RISK_TTL_SECONDS
      : SECURE_ADDRESS_QR_STANDARD_TTL_SECONDS,
  ));
  const requested = cleanText(input.requestedExpiresAt);
  if (!requested) return addSeconds(input.issuedAt, maxTtl);
  const requestedTtl = ttlSecondsBetween(input.issuedAt, requested);
  if (requestedTtl <= 0) return addSeconds(input.issuedAt, maxTtl);
  return requestedTtl > maxTtl ? addSeconds(input.issuedAt, maxTtl) : new Date(Date.parse(requested)).toISOString();
}

function normalizeEncryptedEnvelope(
  input: BuildSecureAddressQrInput['encryptedEnvelope'],
  domainSeparation: SecureAddressQrDomainSeparation,
  addressReferenceCommitment: string,
): SecureAddressQrEncryptedEnvelope {
  if (!input) {
    return {
      mode: 'not-included',
      algorithm: 'external-envelope-ref',
    };
  }

  const envelopeCommitment = createSecureAddressEnvelopeCommitment({
    ciphertext: input.ciphertext,
    ciphertextHash: input.ciphertextHash,
    envelopeHash: input.envelopeHash || input.envelopeCommitment,
    envelopeRef: input.envelopeRef,
    addressReferenceCommitment,
    domain: domainSeparation.envelope,
  });
  const envelopeRef = cleanText(input.envelopeRef);
  const mode: SecureAddressQrEnvelopeMode = input.mode === 'external-ref' || envelopeRef
    ? 'external-ref'
    : envelopeCommitment
      ? 'hash-only'
      : 'not-included';

  return {
    mode,
    algorithm: cleanText(input.algorithm) || (mode === 'hash-only' ? 'A256GCM' : 'external-envelope-ref'),
    ...(cleanText(input.keyId || input.kid) ? { keyId: cleanText(input.keyId || input.kid) } : {}),
    ...(mode === 'external-ref' && envelopeRef ? { envelopeRef } : {}),
    ...(envelopeCommitment ? { envelopeCommitment } : {}),
    ...(envelopeCommitment ? { commitmentAlgorithm: SECURE_ADDRESS_QR_ENVELOPE_COMMITMENT_ALGORITHM } : {}),
  };
}

export function buildSecureAddressQrRecord(input: BuildSecureAddressQrInput): SecureAddressQrRecord {
  const purpose = normalizePurpose(input.purpose);
  const riskLevel = normalizeRiskLevel(input.riskLevel);
  const scope = cleanText(input.scope) || purpose;
  const issuedAt = cleanText(input.issuedAt) || new Date().toISOString();
  const expiresAt = normalizeExpiresAt({
    issuedAt,
    requestedExpiresAt: input.expiresAt,
    riskLevel,
    maxTtlSeconds: input.maxTtlSeconds,
  });
  const jti = normalizeJti(input.jti) || generateRandomJti();
  if (!SECURE_ADDRESS_QR_JTI_PATTERN.test(jti)) {
    throw new Error('Secure Address QR requires a 16-64 character Crockford-style Base32 jti.');
  }
  const domainSeparation = buildDomainSeparation(input.domainSeparation);
  const addressRef = normalizeAddressReference(input, domainSeparation);
  if (!addressRef) {
    throw new Error('Secure Address QR requires a registered address, AGID, AOID, postal zone, or external address vault reference.');
  }
  const requestedMethod = normalizeProofMethod(input.recipientProofMethod);
  const recipientSecret = normalizeRecipientSecret(input.recipientProofSecret ?? input.recipientProofCode);
  const method: SecureAddressQrProofMethod = input.recipientProofMethod
    ? requestedMethod
    : (recipientSecret || cleanText(input.recipientProofCommitment) ? 'recipient-secret-commitment' : 'presence-only');
  const recipientNonce = proofMethodRequiresCommitment(method)
    ? (cleanText(input.recipientProofNonce) || generateRandomJti(16))
    : '';
  const recipientCommitment = cleanText(input.recipientProofCommitment).toUpperCase()
    || createSecureAddressRecipientCommitment({
      addressReferenceCommitment: addressRef.referenceCommitment,
      jti,
      recipientSecret,
      nonce: recipientNonce,
      domain: domainSeparation.recipient,
      method,
    });
  if (proofMethodRequiresCommitment(method) && !SECURE_ADDRESS_QR_RECIPIENT_COMMITMENT_PATTERN.test(recipientCommitment)) {
    throw new Error('Secure Address QR requires a recipient proof secret or SAR-* commitment for the selected proof method.');
  }
  const encryptedEnvelope = normalizeEncryptedEnvelope(
    input.encryptedEnvelope,
    domainSeparation,
    addressRef.referenceCommitment,
  );
  const nullifierValue = createSecureAddressNullifier({
    addressReferenceCommitment: addressRef.referenceCommitment,
    recipientCommitment,
    jti,
    purpose,
    scope,
    audience: input.audience,
    domain: domainSeparation.nullifier,
  });
  const maxScans = typeof input.maxScans === 'number' && Number.isFinite(input.maxScans)
    ? Math.max(1, Math.min(100, Math.round(input.maxScans)))
    : riskLevel === 'high'
      ? 1
      : 3;

  const record: SecureAddressQrRecord = {
    modelVersion: SECURE_ADDRESS_QR_MODEL_VERSION,
    version: 1,
    type: 'SECURE_ADDRESS_QR',
    purpose,
    scope,
    ...(cleanText(input.audience) ? { audience: cleanText(input.audience) } : {}),
    issuedAt,
    expiresAt,
    riskLevel,
    jti,
    addressRef,
    recipientProof: {
      method,
      ...(recipientCommitment ? { commitment: recipientCommitment } : {}),
      ...(recipientCommitment ? { algorithm: SECURE_ADDRESS_QR_RECIPIENT_COMMITMENT_ALGORITHM } : {}),
      ...(recipientCommitment ? { domain: domainSeparation.recipient } : {}),
      ...(recipientNonce ? { nonce: recipientNonce } : {}),
      ...(cleanText(input.recipientProofHint) ? { hint: cleanText(input.recipientProofHint) } : {}),
    },
    encryptedEnvelope,
    nullifier: {
      value: nullifierValue,
      algorithm: SECURE_ADDRESS_QR_NULLIFIER_ALGORITHM,
      scope: domainSeparation.nullifier,
    },
    requiredProofs: normalizedRequiredProofs(input.requiredProofs, method),
    maxScans,
    offlineScanAllowed: input.offlineScanAllowed === true && riskLevel !== 'high',
    domainSeparation,
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawCoordinatesStored: false,
      plaintextRecipientStored: false,
      phoneStored: false,
      buildingStored: false,
      roomStored: false,
      encryptedAddressStoredInQr: false,
      addressReferenceCommitmentStored: true,
      recipientCommitmentStored: Boolean(recipientCommitment),
      shortLivedToken: true,
      nullifierStored: true,
    },
  };

  const privateMaterialPaths = collectSecureAddressQrPrivateMaterial(record);
  if (privateMaterialPaths.length) {
    throw new Error(`Secure Address QR cannot store private address material: ${privateMaterialPaths.join(', ')}`);
  }
  return record;
}

export function buildSecureAddressQrPayload(input: BuildSecureAddressQrInput) {
  return `${SECURE_ADDRESS_QR_PREFIX}${encodeURIComponent(JSON.stringify(buildSecureAddressQrRecord(input)))}`;
}

export function parseSecureAddressQrPayload(text: string): SecureAddressQrRecord | null {
  const value = cleanText(text);
  if (!value.startsWith(SECURE_ADDRESS_QR_PREFIX)) return null;
  const parsed = safeJson(decodeComponent(value.slice(SECURE_ADDRESS_QR_PREFIX.length)));
  if (!parsed || parsed.modelVersion !== SECURE_ADDRESS_QR_MODEL_VERSION || parsed.version !== 1) return null;
  if (parsed.type !== 'SECURE_ADDRESS_QR') return null;
  if (collectSecureAddressQrPrivateMaterial(parsed).length) return null;

  const purpose = normalizePurpose(parsed.purpose);
  const riskLevel = normalizeRiskLevel(parsed.riskLevel);
  const jti = normalizeJti(parsed.jti);
  if (!SECURE_ADDRESS_QR_JTI_PATTERN.test(jti)) return null;
  const issuedAt = cleanText(parsed.issuedAt);
  const expiresAt = cleanText(parsed.expiresAt);
  if (!issuedAt || !expiresAt || !Number.isFinite(Date.parse(issuedAt)) || !Number.isFinite(Date.parse(expiresAt))) return null;

  const addressRefInput = parsed.addressRef;
  if (!addressRefInput || typeof addressRefInput !== 'object' || Array.isArray(addressRefInput)) return null;
  const addressRefRecord = addressRefInput as Record<string, unknown>;
  const referenceCommitment = cleanText(addressRefRecord.referenceCommitment).toUpperCase();
  if (!SECURE_ADDRESS_QR_COMMITMENT_PATTERN.test(referenceCommitment)) return null;
  const alias = cleanText(addressRefRecord.alias).toUpperCase();
  const addressRef: SecureAddressQrAddressReference = {
    kind: normalizeAddressReferenceKind(addressRefRecord.kind),
    alias: SECURE_ADDRESS_QR_ALIAS_PATTERN.test(alias)
      ? alias
      : `SAQ-${sha256Hex(referenceCommitment).slice(0, 16).toUpperCase()}`,
    referenceCommitment,
    commitmentAlgorithm: SECURE_ADDRESS_QR_ADDRESS_COMMITMENT_ALGORITHM,
    ...(normalizeCountryCode(addressRefRecord.country) ? { country: normalizeCountryCode(addressRefRecord.country) } : {}),
    label: cleanText(addressRefRecord.label) || `${normalizeAddressReferenceKind(addressRefRecord.kind)} / ref:${shortTail(referenceCommitment)}`,
  };

  const recipientProofInput = parsed.recipientProof;
  if (!recipientProofInput || typeof recipientProofInput !== 'object' || Array.isArray(recipientProofInput)) return null;
  const recipientProofRecord = recipientProofInput as Record<string, unknown>;
  const method = normalizeProofMethod(recipientProofRecord.method);
  const recipientCommitment = cleanText(recipientProofRecord.commitment).toUpperCase();
  if (proofMethodRequiresCommitment(method) && !SECURE_ADDRESS_QR_RECIPIENT_COMMITMENT_PATTERN.test(recipientCommitment)) return null;
  const recipientProof: SecureAddressQrRecipientProof = {
    method,
    ...(recipientCommitment ? { commitment: recipientCommitment } : {}),
    ...(recipientCommitment ? { algorithm: SECURE_ADDRESS_QR_RECIPIENT_COMMITMENT_ALGORITHM } : {}),
    ...(recipientCommitment ? { domain: normalizeDomain(recipientProofRecord.domain, SECURE_ADDRESS_QR_DOMAIN_SEPARATION_DEFAULTS.recipient) } : {}),
    ...(cleanText(recipientProofRecord.nonce) ? { nonce: cleanText(recipientProofRecord.nonce) } : {}),
    ...(cleanText(recipientProofRecord.hint) ? { hint: cleanText(recipientProofRecord.hint) } : {}),
  };

  const envelopeInput = parsed.encryptedEnvelope;
  const envelopeRecord = envelopeInput && typeof envelopeInput === 'object' && !Array.isArray(envelopeInput)
    ? envelopeInput as Record<string, unknown>
    : {};
  const envelopeCommitment = cleanText(envelopeRecord.envelopeCommitment).toUpperCase();
  if (envelopeCommitment && !SECURE_ADDRESS_QR_ENVELOPE_COMMITMENT_PATTERN.test(envelopeCommitment)) return null;
  const encryptedEnvelope: SecureAddressQrEncryptedEnvelope = {
    mode: envelopeRecord.mode === 'external-ref' || envelopeRecord.mode === 'hash-only'
      ? envelopeRecord.mode
      : 'not-included',
    algorithm: cleanText(envelopeRecord.algorithm) || 'external-envelope-ref',
    ...(cleanText(envelopeRecord.keyId) ? { keyId: cleanText(envelopeRecord.keyId) } : {}),
    ...(cleanText(envelopeRecord.envelopeRef) ? { envelopeRef: cleanText(envelopeRecord.envelopeRef) } : {}),
    ...(envelopeCommitment ? { envelopeCommitment } : {}),
    ...(envelopeCommitment ? { commitmentAlgorithm: SECURE_ADDRESS_QR_ENVELOPE_COMMITMENT_ALGORITHM } : {}),
  };

  const nullifierInput = parsed.nullifier;
  if (!nullifierInput || typeof nullifierInput !== 'object' || Array.isArray(nullifierInput)) return null;
  const nullifierRecord = nullifierInput as Record<string, unknown>;
  const nullifierValue = cleanText(nullifierRecord.value).toUpperCase();
  if (!SECURE_ADDRESS_QR_NULLIFIER_PATTERN.test(nullifierValue)) return null;
  const domainSeparation = buildDomainSeparation(
    parsed.domainSeparation && typeof parsed.domainSeparation === 'object' && !Array.isArray(parsed.domainSeparation)
      ? parsed.domainSeparation as Partial<SecureAddressQrDomainSeparation>
      : undefined,
  );
  const maxScans = typeof parsed.maxScans === 'number' && Number.isFinite(parsed.maxScans)
    ? Math.max(1, Math.min(100, Math.round(parsed.maxScans)))
    : riskLevel === 'high'
      ? 1
      : 3;

  return {
    modelVersion: SECURE_ADDRESS_QR_MODEL_VERSION,
    version: 1,
    type: 'SECURE_ADDRESS_QR',
    purpose,
    scope: cleanText(parsed.scope) || purpose,
    ...(cleanText(parsed.audience) ? { audience: cleanText(parsed.audience) } : {}),
    issuedAt,
    expiresAt,
    riskLevel,
    jti,
    addressRef,
    recipientProof,
    encryptedEnvelope,
    nullifier: {
      value: nullifierValue,
      algorithm: SECURE_ADDRESS_QR_NULLIFIER_ALGORITHM,
      scope: cleanText(nullifierRecord.scope) || domainSeparation.nullifier,
    },
    requiredProofs: normalizedRequiredProofs(parsed.requiredProofs, method),
    maxScans,
    offlineScanAllowed: parsed.offlineScanAllowed === true && riskLevel !== 'high',
    domainSeparation,
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawCoordinatesStored: false,
      plaintextRecipientStored: false,
      phoneStored: false,
      buildingStored: false,
      roomStored: false,
      encryptedAddressStoredInQr: false,
      addressReferenceCommitmentStored: true,
      recipientCommitmentStored: Boolean(recipientCommitment),
      shortLivedToken: true,
      nullifierStored: true,
    },
  };
}

export function validateSecureAddressQrRecord(
  record: SecureAddressQrRecord | null | undefined,
  options: { now?: string } = {},
): SecureAddressQrValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const privateMaterialPaths = collectSecureAddressQrPrivateMaterial(record);
  const nowMs = Date.parse(cleanText(options.now) || new Date().toISOString());

  if (!record) {
    return {
      valid: false,
      status: 'invalid',
      expired: false,
      ttlSeconds: 0,
      errors: ['secure-address-qr-missing'],
      warnings: [],
      privateMaterialPaths: [],
      privacyNotes: [],
    };
  }

  if (record.modelVersion !== SECURE_ADDRESS_QR_MODEL_VERSION || record.version !== 1) {
    errors.push('secure-address-qr-version-unsupported');
  }
  if (!SECURE_ADDRESS_QR_JTI_PATTERN.test(record.jti)) errors.push('secure-address-qr-jti-invalid');
  if (!SECURE_ADDRESS_QR_COMMITMENT_PATTERN.test(record.addressRef.referenceCommitment)) {
    errors.push('secure-address-qr-address-reference-invalid');
  }
  if (!SECURE_ADDRESS_QR_NULLIFIER_PATTERN.test(record.nullifier.value)) {
    errors.push('secure-address-qr-nullifier-invalid');
  }
  if (proofMethodRequiresCommitment(record.recipientProof.method)
    && !SECURE_ADDRESS_QR_RECIPIENT_COMMITMENT_PATTERN.test(cleanText(record.recipientProof.commitment).toUpperCase())) {
    errors.push('secure-address-qr-recipient-proof-invalid');
  }
  if (record.encryptedEnvelope.mode !== 'not-included' && !record.encryptedEnvelope.envelopeRef && !record.encryptedEnvelope.envelopeCommitment) {
    warnings.push('secure-address-qr-envelope-reference-missing');
  }
  if (record.riskLevel === 'high' && record.offlineScanAllowed) {
    errors.push('secure-address-qr-high-risk-offline-scan-blocked');
  }
  if (privateMaterialPaths.length) {
    errors.push('secure-address-qr-private-material-present');
  }

  const expiresAtMs = Date.parse(record.expiresAt);
  const issuedAtMs = Date.parse(record.issuedAt);
  const expired = Number.isFinite(nowMs) && Number.isFinite(expiresAtMs) && nowMs > expiresAtMs;
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(expiresAtMs)) {
    errors.push('secure-address-qr-time-invalid');
  }
  const ttlSeconds = ttlSecondsBetween(record.issuedAt, record.expiresAt);
  const maxTtl = record.riskLevel === 'high'
    ? SECURE_ADDRESS_QR_HIGH_RISK_TTL_SECONDS
    : SECURE_ADDRESS_QR_STANDARD_TTL_SECONDS;
  if (ttlSeconds > maxTtl) errors.push('secure-address-qr-ttl-too-long');

  const privacyNotes = [
    'QR stores an address reference commitment, not the raw address.',
    'Recipient identity is represented by a proof commitment or presence-only policy.',
    'Use the nullifier to prevent replay and mark single-use flows as consumed.',
  ];

  return {
    valid: errors.length === 0 && !expired,
    status: privateMaterialPaths.length
      ? 'unsafe'
      : errors.length
        ? 'invalid'
        : expired
          ? 'expired'
          : 'valid',
    expired,
    ttlSeconds,
    errors,
    warnings,
    privateMaterialPaths,
    privacyNotes,
  };
}

export function summarizeSecureAddressQr(
  input: string | SecureAddressQrRecord | null | undefined,
  options: { now?: string } = {},
): SecureAddressQrSummary {
  const record = typeof input === 'string' ? parseSecureAddressQrPayload(input) : input;
  const validation = validateSecureAddressQrRecord(record, options);
  return {
    valid: validation.valid,
    status: validation.status,
    purpose: record?.purpose,
    riskLevel: record?.riskLevel,
    expiresAt: record?.expiresAt,
    expired: validation.expired,
    addressAlias: record?.addressRef.alias,
    addressReferenceTail: record ? shortTail(record.addressRef.referenceCommitment, 10) : undefined,
    nullifierTail: record ? shortTail(record.nullifier.value, 10) : undefined,
    requiredProofs: record?.requiredProofs || [],
    privacyNotes: validation.privacyNotes,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}
