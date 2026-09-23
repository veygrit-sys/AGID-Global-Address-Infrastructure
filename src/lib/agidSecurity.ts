import {
  AGID_BASE32_ALPHABET,
  AGID_FACE_COUNT,
  AGID_FORMAT_PATTERN_SOURCE,
  AGID_HASH_LENGTH,
  AGID_MAX_PACKED_VALUE,
  AGID_OPEN_SOURCE_RELEASE_CONTROLS,
  AGID_PACKED_BITS_USED,
  AGID_PREFIX_LENGTH,
  AGID_SPEC_SECURITY_PROFILE,
  AGID_TOTAL_LENGTH,
} from './agidContract';

export {
  AGID_BASE32_ALPHABET as AGID_HASH_ALPHABET,
  AGID_FACE_COUNT,
  AGID_HASH_LENGTH,
  AGID_MAX_PACKED_VALUE,
  AGID_PACKED_BITS_USED,
  AGID_PREFIX_LENGTH,
  AGID_TOTAL_LENGTH,
};

export const AGID_FORMAT_PATTERN = new RegExp(AGID_FORMAT_PATTERN_SOURCE);

const PUBLIC_AGID_FORBIDDEN_FIELD_KEYS = new Set([
  'recipient',
  'phone',
  'phonenumber',
  'room',
  'unit',
  'unitnumber',
  'apartment',
  'flat',
  'suite',
  'floor',
  'accesscode',
  'buildingaccess',
  'deliveryinstruction',
  'deliveryinstructions',
  'privatedeliveryinstruction',
  'privatebody',
  'deliveryoptions',
  'intercom',
  'intercomcode',
  'dropoffsetting',
  'dropoffpreference',
  'accesspolicy',
  'validity',
  'privateownershipproof',
  'ownerkeyid',
  'devicekeyid',
  'opaqueencryptedpayload',
  'encryptedpayload',
]);

export const AGID_SECURITY_POLICY = {
  id: AGID_SPEC_SECURITY_PROFILE.profile,
  layer: 'public-location-address-building-map-feature',
  confidentiality: 'public-by-design-no-personal-data',
  integrityControls: [
    'strict-agid-format',
    'base32-hash-alphabet',
    '45-bit-packed-value-limit',
    'face-range-0-5',
    'public-qr-redaction',
    'openapi-security-extension',
    'sdk-parity-tests',
  ],
  openSourceReleaseControls: [
    'no-secret-material-in-repository',
    'signed-release-artifacts-or-published-checksums',
    'agid-spec-and-test-vector-parity-before-sdk-release',
    'third-party-data-license-boundaries',
    'aoid-private-data-excluded-from-public-data-packs',
    ...AGID_OPEN_SOURCE_RELEASE_CONTROLS,
  ],
} as const;

function normalizeFieldKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizeAGIDInput(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

export function isValidAGIDFormat(value: unknown): value is string {
  const normalized = normalizeAGIDInput(value);
  return Boolean(normalized && AGID_FORMAT_PATTERN.test(normalized));
}

export function isAgidPackedValueInRange(packedValue: bigint) {
  if (packedValue < 0n || packedValue > AGID_MAX_PACKED_VALUE) return false;
  const face = Number(packedValue >> 42n);
  return face >= 0 && face < AGID_FACE_COUNT;
}

export function findForbiddenPublicAgidFields(value: unknown, path = 'record'): string[] {
  if (!value || typeof value !== 'object') return [];

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenPublicAgidFields(item, `${path}[${index}]`));
  }

  const findings: string[] = [];
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = normalizeFieldKey(key);
    const nestedPath = `${path}.${key}`;
    if (PUBLIC_AGID_FORBIDDEN_FIELD_KEYS.has(normalizedKey)) {
      findings.push(nestedPath);
      continue;
    }
    findings.push(...findForbiddenPublicAgidFields(nestedValue, nestedPath));
  }
  return findings;
}

export function validatePublicAgidPayload(value: unknown) {
  const forbiddenFields = findForbiddenPublicAgidFields(value);
  return {
    ok: forbiddenFields.length === 0,
    forbiddenFields,
  };
}
