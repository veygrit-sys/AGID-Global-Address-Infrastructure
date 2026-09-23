export const BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const AGID_PREFIX_LENGTH = 2;
export const AGID_HASH_LENGTH = 10;
export const AGID_TOTAL_LENGTH = 12;
export const AGID_SECURITY_PROFILE = {
  "profile": "agid-public-security-v1",
  "publicByDesign": true,
  "confidentialityBoundary": "AGID is public and must not contain recipient, phone, unit, room, private delivery instruction, ownership proof, owner key, device key, or encrypted AOID payload fields.",
  "canonicalInput": {
    "normalization": "trim and uppercase before validation",
    "pattern": "^[A-Z0-9]{2}[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{10}$"
  },
  "decodeValidation": [
    "totalLength = 12",
    "hashLength = 10",
    "hash uses AGID Base32 alphabet",
    "decoded packed value must be less than 2^45",
    "decoded face must be in range 0..5",
    "decoded latitude and longitude must be finite"
  ],
  "sdkValidationApi": [
    "normalizeAgid(agid) -> canonical uppercase string | null",
    "isValidAgid(agid) -> boolean",
    "validateAgid(agid) -> AgidValidationResult",
    "AGID_SECURITY_PROFILE -> public security policy metadata"
  ],
  "openSourceReleaseControls": [
    "no secrets or private keys in repository",
    "SDK parity tests pass before release",
    "public QR payloads are re-sanitized on parse",
    "public data packs exclude AOID private data",
    "release artifacts publish checksums or detached signatures"
  ]
} as const;

const AGID_FORMAT_PATTERN = /^[A-Z0-9]{2}[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{10}$/;

export type AgidValidationResult = {
  ok: boolean;
  normalized: string | null;
  issues: string[];
};

export type AgidResult = {
  id: string;
  lat: number;
  lon: number;
  face?: number;
};

export type AgidBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export function normalizeAgid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

export function isValidAgid(value: unknown): value is string {
  const normalized = normalizeAgid(value);
  return Boolean(normalized && AGID_FORMAT_PATTERN.test(normalized));
}

export function validateAgid(value: unknown): AgidValidationResult {
  const normalized = normalizeAgid(value);
  const issues: string[] = [];
  if (!normalized) {
    return { ok: false, normalized, issues: ["not-a-non-empty-string"] };
  }
  if (normalized.length !== AGID_TOTAL_LENGTH) issues.push("invalid-length");
  if (!AGID_FORMAT_PATTERN.test(normalized)) issues.push("invalid-format-or-alphabet");
  return { ok: issues.length === 0, normalized, issues };
}

export function encode(_lat: number, _lon: number): AgidResult {
  throw new Error("wire this package to the AGID TypeScript reference implementation");
}

export function decode(_id: string): AgidResult | null {
  return null;
}

export function cellBounds(_id: string): AgidBounds {
  throw new Error("wire this package to the AGID TypeScript reference implementation");
}
