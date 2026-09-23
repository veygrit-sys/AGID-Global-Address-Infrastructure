import { AGID_PREFIX_LENGTH } from '../agidContract';
import {
  AOID_BASE32_ALPHABET,
  AOID_ID_MAX_LENGTH,
  AOID_ID_PATTERN,
  AOID_LINKED_AGID_ANCHOR_LENGTH,
} from './constants';
import {
  clean,
  cleanAgid,
  getRandomValues,
} from './helpers';

export function isValidAOIDId(value: unknown): value is string {
  try {
    normalizeAOIDId(value);
    return true;
  } catch {
    return false;
  }
}

export function getAOIDLinkedAGIDAnchor(value: unknown) {
  const agid = cleanAgid(value);
  return agid ? agid.slice(AGID_PREFIX_LENGTH, AGID_PREFIX_LENGTH + AOID_LINKED_AGID_ANCHOR_LENGTH) : '';
}

export function hasAOIDAllSame16(id: string) {
  return id.length === AOID_ID_MAX_LENGTH && new Set(id).size === 1;
}

export function hasAOIDSequentialRun(id: string) {
  const indexes = id
    .split('')
    .map(char => AOID_BASE32_ALPHABET.indexOf(char));

  for (let index = 0; index <= indexes.length - 4; index += 1) {
    const first = indexes[index];
    const second = indexes[index + 1];
    const third = indexes[index + 2];
    const fourth = indexes[index + 3];
    if (first < 0 || second < 0 || third < 0 || fourth < 0) continue;
    const step = second - first;
    if ((step === 1 || step === -1) && third - second === step && fourth - third === step) {
      return true;
    }
  }

  return false;
}

export function isAOIDLinkedToAGID(id: string, linkedAgid: unknown) {
  const anchor = getAOIDLinkedAGIDAnchor(linkedAgid);
  if (!anchor) return false;
  if (id.length < anchor.length) return anchor.startsWith(id);
  return id.includes(anchor);
}

export function normalizeAOIDId(value: unknown, options: { linkedAgid?: unknown } = {}) {
  const id = clean(value).toUpperCase();
  if (!AOID_ID_PATTERN.test(id)) {
    throw new Error('Invalid AOID id. AOID ids must be 9 to 16 unambiguous base32 characters.');
  }
  if (hasAOIDAllSame16(id)) {
    throw new Error('Invalid AOID id. AOID ids cannot be 16 repeated characters.');
  }
  if (hasAOIDSequentialRun(id)) {
    throw new Error('Invalid AOID id. AOID ids cannot contain four consecutive base32 characters.');
  }
  if (options.linkedAgid && !isAOIDLinkedToAGID(id, options.linkedAgid)) {
    throw new Error('Invalid AOID id. AOID ids must contain the linked AGID base32 anchor.');
  }
  return id;
}

/**
 * Generates a 16-character base32 AOID.
 * When linked AGID is supplied, the AOID starts with the AGID 10-character
 * base32 hash anchor, because the two-character AGID prefix is not guaranteed
 * to be inside the unambiguous base32 alphabet.
 */
export function generateAOID(linkedAgid?: unknown): string {
  const anchor = getAOIDLinkedAGIDAnchor(linkedAgid);
  let result = '';
  const suffixLength = anchor
    ? AOID_ID_MAX_LENGTH - anchor.length
    : AOID_ID_MAX_LENGTH;

  for (let attempt = 0; attempt < 128; attempt += 1) {
    result = anchor;
    const randomValues = getRandomValues(new Uint32Array(suffixLength));
    for (let i = 0; i < suffixLength; i += 1) {
      result += AOID_BASE32_ALPHABET.charAt(randomValues[i] % AOID_BASE32_ALPHABET.length);
    }
    try {
      return normalizeAOIDId(result, anchor ? { linkedAgid } : {});
    } catch {
      continue;
    }
  }

  throw new Error('Unable to generate a valid AOID id under the reserved-pattern rules.');
}

export function buildAOIDPublicHandle(id: string) {
  return `aoid:${normalizeAOIDId(id)}`;
}
