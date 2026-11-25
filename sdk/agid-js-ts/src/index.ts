import { normalizeAGIDCode } from './agid16.js';
import { AGID_FORMAT_PATTERN, AGID_TOTAL_LENGTH } from './agidContract.js';

export { normalizeAGIDCode, toAGID16, toLegacyAGID } from './agid16.js';
export {
  AGID_BASE32_ALPHABET as BASE32_ALPHABET,
  AGID_PREFIX_LENGTH,
  AGID_HASH_LENGTH,
  AGID_TOTAL_LENGTH,
  AGID_SPEC_SECURITY_PROFILE as AGID_SECURITY_PROFILE,
} from './agidContract.js';

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
  const trimmed = value.trim();
  if (trimmed.length === 16 || trimmed.length === 19) return normalizeAGIDCode(trimmed);
  return trimmed.toUpperCase() || null;
}

export function isValidAgid(value: unknown): value is string {
  return normalizeAGIDCode(value) !== null;
}

export function validateAgid(value: unknown): AgidValidationResult {
  const canonical = normalizeAGIDCode(value);
  if (canonical !== null) return { ok: true, normalized: canonical, issues: [] };

  const normalized = typeof value === "string" ? value.trim().toUpperCase() || null : null;
  const issues: string[] = [];
  if (!normalized) {
    return { ok: false, normalized, issues: ["not-a-non-empty-string"] };
  }
  if (normalized.length === AGID_TOTAL_LENGTH) {
    issues.push(AGID_FORMAT_PATTERN.test(normalized) ? "invalid-packed-value-or-input" : "invalid-format-or-alphabet");
  } else if (normalized.length === 16 || normalized.length === 19) {
    issues.push("invalid-agid16-format-version-or-checksum");
  } else {
    issues.push("invalid-length", "invalid-format-or-alphabet");
  }
  return { ok: false, normalized, issues };
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
