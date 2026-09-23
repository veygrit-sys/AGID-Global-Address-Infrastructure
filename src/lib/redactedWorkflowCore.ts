import { sha256Hex } from './sha256';

export type StableIdOptions = {
  length?: number;
  uppercase?: boolean;
  separator?: '-' | '_' | ':';
};

export type CommitmentOptions = {
  length?: number;
  separator?: ':' | '_';
};

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(item => stableJson(item)).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(',')}}`;
}

export function hashStable(value: unknown) {
  return sha256Hex(stableJson(value));
}

export function stableId(prefix: string, seed: unknown, options: StableIdOptions = {}) {
  const length = Math.max(1, Math.floor(options.length ?? 12));
  const separator = options.separator ?? '-';
  const fragment = hashStable(seed).slice(0, length);
  return `${prefix}${separator}${options.uppercase === false ? fragment : fragment.toUpperCase()}`;
}

export function stableCommitment(domain: string, value: unknown, options: CommitmentOptions = {}) {
  const length = Math.max(1, Math.floor(options.length ?? 24));
  const separator = options.separator ?? ':';
  return `${domain}${separator}${hashStable(value).slice(0, length)}`;
}

export function cleanText(value: unknown, fallback = '', maxLength = Number.POSITIVE_INFINITY) {
  const text = typeof value === 'string' && value.trim() ? value.trim() : fallback;
  return Number.isFinite(maxLength) ? text.slice(0, Math.max(0, Math.floor(maxLength))) : text;
}

export function cleanTextArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => cleanText(item)).filter(Boolean);
  const text = cleanText(value);
  return text ? [text] : [];
}

export function cleanNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function cleanNonNegativeInteger(value: unknown, fallback = 0) {
  return Math.max(0, Math.floor(cleanNumber(value, fallback)));
}

export function cleanBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', '1', 'on'].includes(normalized)) return true;
    if (['false', 'no', '0', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

export function toIsoTimestamp(value: unknown, fallback = new Date().toISOString()) {
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return fallback;
}

export function addSecondsToIso(iso: string, seconds: number) {
  return new Date(new Date(iso).getTime() + seconds * 1000).toISOString();
}

export function hasAnyPresentKey(input: Record<string, unknown>, keys: readonly string[]) {
  return keys.some(key => input[key] !== undefined && input[key] !== null && input[key] !== '');
}
