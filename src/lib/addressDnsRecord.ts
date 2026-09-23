import { sha256Hex } from './sha256';

export const ADDRESS_DNS_RECORD_VERSION = 'address-dns-record-v1';
export const ADDRESS_DNS_COMMITMENT_ALGORITHM = 'sha256-address-dns-record-v1';
export const ADDRESS_DNS_DEFAULT_TTL_SECONDS = 300;
export const ADDRESS_DNS_HIGH_RISK_MAX_TTL_SECONDS = 900;
export const ADDRESS_DNS_MAX_TTL_SECONDS = 86_400;

export type AddressDnsRecordType =
  | 'ADR'
  | 'AGIDREF'
  | 'AOIDREF'
  | 'PID'
  | 'SRV'
  | 'TXT'
  | 'POLICY';

export type AddressDnsRecordClass = 'AGID' | 'AOID' | 'AMT' | 'PUBLIC';

export type AddressDnsTargetKind =
  | 'agid-commitment'
  | 'aoid-commitment'
  | 'address-reference-commitment'
  | 'pid'
  | 'pid-commitment'
  | 'amn-envelope'
  | 'service-endpoint'
  | 'policy';

export type AddressDnsRecordTarget = {
  agidCommitment?: string;
  aoidCommitment?: string;
  addressReferenceCommitment?: string;
  pid?: string;
  pidCommitment?: string;
  amnEnvelopeId?: string;
  serviceEndpoint?: string;
  policyHash?: string;
  textHash?: string;
};

export type AddressDnsPrivacyPosture = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawCoordinatesStored: false;
  recipientIdentityStored: false;
  acceptedMaterial: string[];
  rejectedMaterial: string[];
};

export type AddressDnsSignature = {
  algorithm: 'ed25519' | 'secp256k1' | 'rsa-pss' | 'unknown';
  keyId: string;
  signatureValue: string;
};

export type AddressDnsRecord = {
  version: typeof ADDRESS_DNS_RECORD_VERSION;
  recordId: string;
  recordHash: string;
  commitmentAlgorithm: typeof ADDRESS_DNS_COMMITMENT_ALGORITHM;
  ownerName: string;
  zone: string;
  type: AddressDnsRecordType;
  class: AddressDnsRecordClass;
  targetKind: AddressDnsTargetKind;
  target: AddressDnsRecordTarget;
  ttlSeconds: number;
  priority?: number;
  weight?: number;
  issuerId?: string;
  freshnessRoot?: string;
  revocationRoot?: string;
  evidenceRoot?: string;
  scope?: string;
  issuedAt: string;
  expiresAt?: string;
  signature?: AddressDnsSignature;
  privacy: AddressDnsPrivacyPosture;
};

export type AddressDnsRecordInput = {
  ownerName: string;
  zone: string;
  type?: AddressDnsRecordType;
  class?: AddressDnsRecordClass;
  target: AddressDnsRecordTarget;
  ttlSeconds?: number;
  priority?: number;
  weight?: number;
  issuerId?: string;
  freshnessRoot?: string;
  revocationRoot?: string;
  evidenceRoot?: string;
  scope?: string;
  issuedAt?: string;
  expiresAt?: string;
  signature?: AddressDnsSignature;
} & Record<string, unknown>;

export type AddressDnsCreateOptions = {
  now?: string;
  highRiskMode?: boolean;
};

export type AddressDnsValidationOptions = {
  now?: string;
  highRiskMode?: boolean;
  requireFreshnessRoot?: boolean;
  requireRevocationRoot?: boolean;
  requireSignature?: boolean;
};

export type AddressDnsValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  expectedRecordHash?: string;
  expectedRecordId?: string;
  privacy: AddressDnsPrivacyPosture;
};

export type AddressDnsZoneSnapshot = {
  version: typeof ADDRESS_DNS_RECORD_VERSION;
  zone: string;
  generatedAt: string;
  recordCount: number;
  records: AddressDnsRecord[];
  snapshotRoot: string;
  privacy: AddressDnsPrivacyPosture;
};

const RECORD_ID_PREFIX = 'ADNS';

const TARGET_KEYS_BY_KIND: Record<AddressDnsTargetKind, keyof AddressDnsRecordTarget> = {
  'agid-commitment': 'agidCommitment',
  'aoid-commitment': 'aoidCommitment',
  'address-reference-commitment': 'addressReferenceCommitment',
  pid: 'pid',
  'pid-commitment': 'pidCommitment',
  'amn-envelope': 'amnEnvelopeId',
  'service-endpoint': 'serviceEndpoint',
  policy: 'policyHash',
};

const TYPE_BY_TARGET_KIND: Record<AddressDnsTargetKind, AddressDnsRecordType> = {
  'agid-commitment': 'AGIDREF',
  'aoid-commitment': 'AOIDREF',
  'address-reference-commitment': 'ADR',
  pid: 'PID',
  'pid-commitment': 'PID',
  'amn-envelope': 'ADR',
  'service-endpoint': 'SRV',
  policy: 'POLICY',
};

const FORBIDDEN_PRIVATE_KEYS = new Set([
  'address',
  'addresstext',
  'addressline',
  'addresslines',
  'fulladdress',
  'rawaddress',
  'streetaddress',
  'physicaladdress',
  'agid',
  'rawagid',
  'aoid',
  'rawaoid',
  'agids',
  'agidsecure',
  'ciphertext',
  'encryptedpayload',
  'recipient',
  'recipientname',
  'fullname',
  'phone',
  'telephone',
  'email',
  'building',
  'room',
  'unit',
  'apartment',
  'postcode',
  'postalcode',
  'zip',
  'latitude',
  'longitude',
  'lat',
  'lng',
  'lon',
  'coordinates',
]);

const PUBLIC_KEY_PATTERN = /(commitment|hash|root|nullifier|issuerid|scope|freshuntil|expiresat|issuedat|keyid|version|policy|evidence|recordid|recordhash|ownername|zone|ttl|priority|weight|serviceendpoint|amnenvelopeid|targetkind|type|class|pid)/i;

function safePrivacy(): AddressDnsPrivacyPosture {
  return {
    rawAddressStored: false,
    rawAgidStored: false,
    rawAoidStored: false,
    rawCoordinatesStored: false,
    recipientIdentityStored: false,
    acceptedMaterial: [
      'ownerName',
      'zone',
      'agidCommitment',
      'aoidCommitment',
      'addressReferenceCommitment',
      'pidCommitment',
      'amnEnvelopeId',
      'serviceEndpoint',
      'issuerId',
      'freshnessRoot',
      'revocationRoot',
      'evidenceRoot',
      'policyHash',
    ],
    rejectedMaterial: [
      'raw address',
      'raw AGID',
      'raw AOID',
      'AGID-S ciphertext',
      'latitude/longitude',
      'recipient name',
      'phone number',
      'email',
      'room or unit number',
    ],
  };
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function canonicalKey(key: string) {
  return key.normalize('NFKC').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function isPublicMaterialKey(key: string) {
  return PUBLIC_KEY_PATTERN.test(key);
}

function normalizeDnsName(value: unknown) {
  return normalizeText(value).replace(/\.$/, '').toLowerCase();
}

function normalizeId(value: unknown) {
  return normalizeText(value).replace(/\s+/g, '-');
}

function normalizeCommitment(value: unknown) {
  const text = normalizeText(value);
  if (!text) return '';
  return text.startsWith('0x') ? `0x${text.slice(2).toLowerCase()}` : text.toLowerCase();
}

function normalizeIso(value: unknown, fallback: Date) {
  const text = normalizeText(value);
  const date = text ? new Date(text) : fallback;
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback.toISOString();
}

function parseDate(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date : null;
}

function normalizeTtl(value: unknown, highRiskMode = false) {
  const fallback = highRiskMode ? Math.min(ADDRESS_DNS_DEFAULT_TTL_SECONDS, ADDRESS_DNS_HIGH_RISK_MAX_TTL_SECONDS) : ADDRESS_DNS_DEFAULT_TTL_SECONDS;
  const numeric = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.max(30, Math.min(ADDRESS_DNS_MAX_TTL_SECONDS, numeric));
}

function normalizeBoundedInteger(value: unknown, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));

  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(',')}}`;
}

function isValidDnsName(name: string) {
  if (!name || name.length > 253) return false;
  return name.split('.').every(label => {
    if (!label || label.length > 63) return false;
    if (label.startsWith('_')) return /^_[a-z0-9][a-z0-9-]{0,61}$/i.test(label);
    return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label);
  });
}

function isAgidLike(text: string) {
  const compact = text.normalize('NFKC').trim().toUpperCase().replace(/[\s-]+/g, '');
  return /^AGID[A-Z0-9]{8,}$/.test(compact) || /^[A-Z0-9]{10,16}$/.test(compact);
}

function isCoordinateLike(text: string) {
  return /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/.test(text.trim());
}

function inferTargetKind(target: AddressDnsRecordTarget): AddressDnsTargetKind | undefined {
  for (const [kind, key] of Object.entries(TARGET_KEYS_BY_KIND) as Array<[AddressDnsTargetKind, keyof AddressDnsRecordTarget]>) {
    if (normalizeText(target[key])) return kind;
  }
  return undefined;
}

function normalizeTarget(input: AddressDnsRecordTarget): AddressDnsRecordTarget {
  return {
    agidCommitment: normalizeCommitment(input.agidCommitment) || undefined,
    aoidCommitment: normalizeCommitment(input.aoidCommitment) || undefined,
    addressReferenceCommitment: normalizeCommitment(input.addressReferenceCommitment) || undefined,
    pid: normalizeId(input.pid) || undefined,
    pidCommitment: normalizeCommitment(input.pidCommitment) || undefined,
    amnEnvelopeId: normalizeId(input.amnEnvelopeId) || undefined,
    serviceEndpoint: normalizeText(input.serviceEndpoint) || undefined,
    policyHash: normalizeCommitment(input.policyHash) || undefined,
    textHash: normalizeCommitment(input.textHash) || undefined,
  };
}

function canonicalRecordPayload(record: AddressDnsRecord) {
  const { recordId: _recordId, recordHash: _recordHash, signature: _signature, ...payload } = record;
  return payload;
}

function computeRecordHash(record: AddressDnsRecord) {
  return sha256Hex(stableStringify(canonicalRecordPayload(record)));
}

function recordIdFromHash(hash: string) {
  return `${RECORD_ID_PREFIX}-${hash.slice(0, 24).toUpperCase()}`;
}

function collectPrivateMaterialErrors(value: unknown, path = 'record'): string[] {
  const errors: string[] = [];
  const visit = (item: unknown, itemPath: string, parentKey = '') => {
    if (item === null || item === undefined) return;

    if (typeof item === 'string') {
      if (!isPublicMaterialKey(parentKey) && (isAgidLike(item) || isCoordinateLike(item))) {
        errors.push(`${itemPath} appears to contain raw location material; publish a commitment/hash/root instead.`);
      }
      return;
    }

    if (typeof item !== 'object') return;
    if (Array.isArray(item)) {
      item.forEach((entry, index) => visit(entry, `${itemPath}[${index}]`, parentKey));
      return;
    }

    for (const [key, entry] of Object.entries(item as Record<string, unknown>)) {
      const canonical = canonicalKey(key);
      if (canonical === 'privacy') continue;
      const publicKey = isPublicMaterialKey(key);
      if (!publicKey && FORBIDDEN_PRIVATE_KEYS.has(canonical)) {
        errors.push(`${itemPath}.${key} is private material; publish only commitments, hashes, roots, or public endpoints.`);
        continue;
      }
      visit(entry, `${itemPath}.${key}`, key);
    }
  };

  visit(value, path);
  return unique(errors);
}

function validateServiceEndpoint(endpoint: string) {
  if (!endpoint) return true;
  if (endpoint.startsWith('/.well-known/')) return true;
  try {
    const parsed = new URL(endpoint);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function collectAddressDnsPrivateMaterialErrors(value: unknown, path = 'record') {
  return collectPrivateMaterialErrors(value, path);
}

export function createAddressDnsRecord(input: AddressDnsRecordInput, options: AddressDnsCreateOptions = {}): AddressDnsRecord {
  const privateErrors = collectPrivateMaterialErrors(input, 'input');
  if (privateErrors.length > 0) {
    throw new Error(`Address DNS records cannot contain private material: ${privateErrors.join('; ')}`);
  }

  const now = parseDate(options.now) ?? new Date();
  const target = normalizeTarget(input.target ?? {});
  const targetKind = inferTargetKind(target) ?? 'address-reference-commitment';
  const issuedAt = normalizeIso(input.issuedAt, now);
  const record: AddressDnsRecord = {
    version: ADDRESS_DNS_RECORD_VERSION,
    recordId: '',
    recordHash: '',
    commitmentAlgorithm: ADDRESS_DNS_COMMITMENT_ALGORITHM,
    ownerName: normalizeDnsName(input.ownerName),
    zone: normalizeDnsName(input.zone),
    type: input.type ?? TYPE_BY_TARGET_KIND[targetKind],
    class: input.class ?? 'AGID',
    targetKind,
    target,
    ttlSeconds: normalizeTtl(input.ttlSeconds, options.highRiskMode),
    priority: normalizeBoundedInteger(input.priority, 65_535),
    weight: normalizeBoundedInteger(input.weight, 65_535),
    issuerId: normalizeId(input.issuerId) || undefined,
    freshnessRoot: normalizeCommitment(input.freshnessRoot) || undefined,
    revocationRoot: normalizeCommitment(input.revocationRoot) || undefined,
    evidenceRoot: normalizeCommitment(input.evidenceRoot) || undefined,
    scope: normalizeId(input.scope) || undefined,
    issuedAt,
    expiresAt: parseDate(input.expiresAt)?.toISOString(),
    signature: input.signature
      ? {
          algorithm: input.signature.algorithm,
          keyId: normalizeId(input.signature.keyId),
          signatureValue: normalizeText(input.signature.signatureValue),
        }
      : undefined,
    privacy: safePrivacy(),
  };

  record.recordHash = computeRecordHash(record);
  record.recordId = recordIdFromHash(record.recordHash);
  return record;
}

export function validateAddressDnsRecord(
  record: AddressDnsRecord,
  options: AddressDnsValidationOptions = {},
): AddressDnsValidationResult {
  const errors = collectPrivateMaterialErrors(record);
  const warnings: string[] = [];
  const checkedAt = parseDate(options.now) ?? new Date();
  const privacy = safePrivacy();

  if (record.version !== ADDRESS_DNS_RECORD_VERSION) errors.push('unsupported-address-dns-record-version');
  if (record.commitmentAlgorithm !== ADDRESS_DNS_COMMITMENT_ALGORITHM) errors.push('unsupported-address-dns-commitment-algorithm');
  if (!isValidDnsName(record.ownerName)) errors.push('ownerName must be a DNS-compatible name');
  if (!isValidDnsName(record.zone)) errors.push('zone must be a DNS-compatible name');
  if (record.ownerName && record.zone && !record.ownerName.endsWith(record.zone)) {
    warnings.push('ownerName is outside the declared zone');
  }
  if (!['ADR', 'AGIDREF', 'AOIDREF', 'PID', 'SRV', 'TXT', 'POLICY'].includes(record.type)) errors.push('unsupported-record-type');
  if (!['AGID', 'AOID', 'AMT', 'PUBLIC'].includes(record.class)) errors.push('unsupported-record-class');
  if (!TARGET_KEYS_BY_KIND[record.targetKind]) errors.push('unsupported-target-kind');

  const targetKey = TARGET_KEYS_BY_KIND[record.targetKind];
  if (targetKey && !normalizeText(record.target?.[targetKey])) {
    errors.push(`target.${targetKey} is required for ${record.targetKind}`);
  }
  if (record.target?.serviceEndpoint && !validateServiceEndpoint(record.target.serviceEndpoint)) {
    errors.push('serviceEndpoint must be HTTPS or a /.well-known/ relative endpoint');
  }
  if (!Number.isInteger(record.ttlSeconds) || record.ttlSeconds < 30 || record.ttlSeconds > ADDRESS_DNS_MAX_TTL_SECONDS) {
    errors.push('ttlSeconds must be between 30 and 86400');
  }
  if (options.highRiskMode && record.ttlSeconds > ADDRESS_DNS_HIGH_RISK_MAX_TTL_SECONDS) {
    errors.push('high-risk Address DNS records must use ttlSeconds <= 900');
  }
  if (options.requireFreshnessRoot && !record.freshnessRoot) errors.push('freshnessRoot is required');
  if (options.requireRevocationRoot && !record.revocationRoot) errors.push('revocationRoot is required');
  if (options.requireSignature && !record.signature) errors.push('signature is required');
  if (record.signature && (!record.signature.keyId || !record.signature.signatureValue)) {
    errors.push('signature.keyId and signature.signatureValue are required');
  }

  const issuedAt = parseDate(record.issuedAt);
  const expiresAt = parseDate(record.expiresAt);
  if (!issuedAt) errors.push('issuedAt must be an ISO date');
  if (expiresAt && expiresAt.getTime() <= checkedAt.getTime()) errors.push('record-expired');
  if (issuedAt && expiresAt && expiresAt.getTime() <= issuedAt.getTime()) errors.push('expiresAt must be later than issuedAt');

  if (
    record.privacy?.rawAddressStored !== false ||
    record.privacy?.rawAgidStored !== false ||
    record.privacy?.rawAoidStored !== false ||
    record.privacy?.rawCoordinatesStored !== false ||
    record.privacy?.recipientIdentityStored !== false
  ) {
    errors.push('privacy flags must state that raw address, raw AGID/AOID, coordinates, and recipient identity are not stored');
  }

  const expectedRecordHash = computeRecordHash(record);
  const expectedRecordId = recordIdFromHash(expectedRecordHash);
  if (record.recordHash !== expectedRecordHash) errors.push('recordHash does not match canonical record payload');
  if (record.recordId !== expectedRecordId) errors.push('recordId does not match recordHash');

  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    expectedRecordHash,
    expectedRecordId,
    privacy,
  };
}

export function addressDnsRecordToZoneLine(record: AddressDnsRecord) {
  const targetValue = record.target[TARGET_KEYS_BY_KIND[record.targetKind]];
  const parts = [
    record.ownerName,
    String(record.ttlSeconds),
    'IN',
    'ADNS',
    record.version,
    record.type,
    record.class,
    record.targetKind,
    `id=${record.recordId}`,
    `hash=${record.recordHash}`,
    targetValue ? `target=${targetValue}` : undefined,
    record.issuerId ? `issuer=${record.issuerId}` : undefined,
    record.freshnessRoot ? `freshness=${record.freshnessRoot}` : undefined,
    record.revocationRoot ? `revocation=${record.revocationRoot}` : undefined,
    record.expiresAt ? `exp=${record.expiresAt}` : undefined,
  ];
  return parts.filter(Boolean).join(' ');
}

export function createAddressDnsZoneSnapshot(
  records: AddressDnsRecord[],
  options: { zone?: string; generatedAt?: string } = {},
): AddressDnsZoneSnapshot {
  const generatedAt = normalizeIso(options.generatedAt, new Date());
  const zone = normalizeDnsName(options.zone ?? records[0]?.zone ?? 'root.agid');
  const orderedRecords = [...records].sort((a, b) => a.ownerName.localeCompare(b.ownerName) || a.recordId.localeCompare(b.recordId));
  const snapshotRoot = sha256Hex(stableStringify({
    version: ADDRESS_DNS_RECORD_VERSION,
    zone,
    recordHashes: orderedRecords.map(record => record.recordHash),
  }));

  return {
    version: ADDRESS_DNS_RECORD_VERSION,
    zone,
    generatedAt,
    recordCount: orderedRecords.length,
    records: orderedRecords,
    snapshotRoot,
    privacy: safePrivacy(),
  };
}
