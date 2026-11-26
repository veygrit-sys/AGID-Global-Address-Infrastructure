import {
  AGID_BASE32_ALPHABET,
  AGID_FORMAT_PATTERN,
  AGID_TOTAL_LENGTH,
  isAgidPackedValueInRange,
} from './agidContract.js';

const VERSION = '1';
const GROUPED = /^[A-Za-z0-9]{4}(?:-[A-Za-z0-9]{4}){3}$/;
const ASCII_CODE = /^[A-Za-z0-9]+$/;

// CRC-15/CAN over canonical ASCII. Each table entry advances the CRC by one byte.
const CRC_TABLE = new Uint16Array(256);
for (let byte = 0; byte < CRC_TABLE.length; byte++) {
  let crc = byte << 7;
  for (let bit = 0; bit < 8; bit++) {
    crc = ((crc << 1) ^ ((crc & 0x4000) ? 0x4599 : 0)) & 0x7fff;
  }
  CRC_TABLE[byte] = crc;
}

function checksum(body: string): string {
  let crc = 0;
  for (let i = 0; i < body.length; i++) {
    crc = ((crc << 8) & 0x7fff) ^ CRC_TABLE[(crc >>> 7) ^ body.charCodeAt(i)];
  }
  return AGID_BASE32_ALPHABET[crc >>> 10]
    + AGID_BASE32_ALPHABET[(crc >>> 5) & 31]
    + AGID_BASE32_ALPHABET[crc & 31];
}

/** @internal Only pass the canonical 12 characters issued by the core or its validated reader. */
export function wrapCanonicalAGID(legacyId: string): string {
  const body = legacyId + VERSION;
  return body + checksum(body);
}

/** @internal Returns the original packed position for either wire format. */
export function parseAGIDCode(value: unknown): { canonical: string; legacyId: string; packed: bigint } | null {
  if (typeof value !== 'string') return null;
  let id = value.trim();
  if (id.length === 19 && GROUPED.test(id)) id = id.replaceAll('-', '');
  if (id.length !== AGID_TOTAL_LENGTH && id.length !== 16) return null;
  if (!ASCII_CODE.test(id)) return null;
  id = id.toUpperCase();
  const canonical = id;
  if (id.length === 16) {
    if (id[12] !== VERSION || checksum(id.slice(0, 13)) !== id.slice(13)) return null;
    id = id.slice(0, AGID_TOTAL_LENGTH);
  }
  if (!AGID_FORMAT_PATTERN.test(id)) return null;
  // A 10-character payload holds at most 50 bits, exactly representable as a JS number.
  let packedNumber = 0;
  for (let index = 2; index < id.length; index++) {
    packedNumber = packedNumber * 32 + AGID_BASE32_ALPHABET.indexOf(id[index]);
  }
  const packed = BigInt(packedNumber);
  return isAgidPackedValueInRange(packed) ? { canonical, legacyId: id, packed } : null;
}

/** Validate either format and preserve its width in uppercase, ungrouped form. */
export function normalizeAGIDCode(value: unknown): string | null {
  return parseAGIDCode(value)?.canonical ?? null;
}

/** Convert an issued 12-character ID without recalculating its cell or prefix. */
export function toAGID16(legacyId: unknown): string | null {
  if (typeof legacyId !== 'string' || legacyId.trim().length !== AGID_TOTAL_LENGTH) return null;
  const code = parseAGIDCode(legacyId);
  return code ? wrapCanonicalAGID(code.legacyId) : null;
}

/** Read either format and return a canonical 12-character key for existing consumers. */
export function toLegacyAGID(value: unknown): string | null {
  return parseAGIDCode(value)?.legacyId ?? null;
}
