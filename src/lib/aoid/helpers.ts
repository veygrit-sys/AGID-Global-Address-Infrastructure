import {
  isValidAGIDFormat,
  normalizeAGIDInput,
} from '../agidSecurity';
import type { AOIDStatus } from './types';

export function getRandomValues(values: Uint32Array) {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(values);
    return values;
  }

  throw new Error('AOID generation requires Web Crypto secure random values.');
}

export function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function cleanAgid(value: unknown) {
  const normalized = normalizeAGIDInput(value);
  return normalized && isValidAGIDFormat(normalized) ? normalized : '';
}

export function cleanKeyId(value: unknown) {
  return clean(value).replace(/[^\w:.-]/g, '').slice(0, 128);
}

export function coerceAOIDStatus(value: unknown): AOIDStatus {
  return value === 'revoked' || value === 'rotated' || value === 'active' ? value : 'active';
}
