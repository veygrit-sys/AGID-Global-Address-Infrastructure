export const AGID_BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const AGID_PREFIX_LENGTH = 2;
export const AGID_HASH_LENGTH = 10;
export const AGID_TOTAL_LENGTH = 12;

export const AGID_FACE_COUNT = 6;
export const AGID_FACE_AXIS_BITS = 21;
export const AGID_FACE_AXIS_DIVISIONS = 2 ** AGID_FACE_AXIS_BITS;
export const AGID_FACE_AXIS_MAX = AGID_FACE_AXIS_DIVISIONS - 1;
export const AGID_HASH_BITS = 50;
export const AGID_PACKED_BITS_USED_NUMBER = 45;
export const AGID_PACKED_BITS_USED = BigInt(AGID_PACKED_BITS_USED_NUMBER);
export const AGID_MAX_PACKED_VALUE = (1n << AGID_PACKED_BITS_USED) - 1n;

export const AGID_FORMAT_PATTERN_SOURCE =
  `^[A-Z0-9]{${AGID_PREFIX_LENGTH}}[${AGID_BASE32_ALPHABET}]{${AGID_HASH_LENGTH}}$`;

export const AGID_PUBLIC_CONFIDENTIALITY_BOUNDARY =
  'AGID is public and must not contain recipient, phone, unit, room, private delivery instruction, ownership proof, owner key, device key, or encrypted AOID payload fields.';

export const AGID_DECODE_VALIDATION_RULES = [
  `totalLength = ${AGID_TOTAL_LENGTH}`,
  `hashLength = ${AGID_HASH_LENGTH}`,
  'hash uses AGID Base32 alphabet',
  `decoded packed value must be less than 2^${AGID_PACKED_BITS_USED_NUMBER}`,
  `decoded face must be in range 0..${AGID_FACE_COUNT - 1}`,
  'decoded latitude and longitude must be finite',
] as const;

export const AGID_SDK_VALIDATION_API = [
  'normalizeAgid(agid) -> canonical uppercase string | null',
  'isValidAgid(agid) -> boolean',
  'validateAgid(agid) -> AgidValidationResult',
  'AGID_SECURITY_PROFILE -> public security policy metadata',
] as const;

export const AGID_OPEN_SOURCE_RELEASE_CONTROLS = [
  'no secrets or private keys in repository',
  'SDK parity tests pass before release',
  'public QR payloads are re-sanitized on parse',
  'public data packs exclude AOID private data',
  'release artifacts publish checksums or detached signatures',
] as const;

export const AGID_SPEC_SECURITY_PROFILE = {
  profile: 'agid-public-security-v1',
  publicByDesign: true,
  confidentialityBoundary: AGID_PUBLIC_CONFIDENTIALITY_BOUNDARY,
  canonicalInput: {
    normalization: 'trim and uppercase before validation',
    pattern: AGID_FORMAT_PATTERN_SOURCE,
  },
  decodeValidation: AGID_DECODE_VALIDATION_RULES,
  sdkValidationApi: AGID_SDK_VALIDATION_API,
  openSourceReleaseControls: AGID_OPEN_SOURCE_RELEASE_CONTROLS,
} as const;
