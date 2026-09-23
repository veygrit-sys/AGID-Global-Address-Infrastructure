import type { RegisteredAddressRecord } from './registeredAddressQr';
import { redactAOIDForPublicUse } from './aoid';
import { sanitizeRegisteredAddressQualitySnapshot } from './registeredAddressQuality';

export type RegisteredAddressQrPrivacy = 'full' | 'public';

export const PRIVATE_STORAGE_KEYS = [
  'saved_agids',
  'saved_qrs',
  'agid_sync_queue',
  'agid_registered_addresses',
  'agid_grid_aoids',
  'agid_search_history',
  'search_history',
  'agid_home_agid',
] as const;

const SENSITIVE_QUERY_KEYS = new Set([
  'address',
  'cep',
  'code',
  'lat',
  'latitude',
  'lng',
  'location',
  'locations',
  'lon',
  'long',
  'longitude',
  'pincode',
  'postcode',
  'q',
  'query',
  'text',
]);

const COORDINATE_PAIR_PATTERN = /(-?\d{1,2}\.\d{4,})\s*,\s*(-?\d{1,3}\.\d{4,})/g;
const QUERY_PARAM_PATTERN = /([?&](?:address|cep|code|lat|latitude|lng|location|locations|lon|long|longitude|pincode|postcode|q|query|text)=)[^&\s]+/gi;

function redactUrl(value: string) {
  try {
    const url = new URL(value);
    for (const key of Array.from(url.searchParams.keys())) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.set(key, '[redacted]');
      }
    }
    return url.toString();
  } catch {
    return value;
  }
}

export function redactSensitiveText(value: string) {
  const urlRedacted = /^https?:\/\//i.test(value) ? redactUrl(value) : value;
  return urlRedacted
    .replace(QUERY_PARAM_PATTERN, '$1[redacted]')
    .replace(COORDINATE_PAIR_PATTERN, '[coordinates]');
}

export function redactLogValue(value: unknown): unknown {
  if (typeof value === 'string') return redactSensitiveText(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveText(value.message),
    };
  }
  if (!value || typeof value !== 'object') return value;

  try {
    return JSON.parse(JSON.stringify(value, (key, nestedValue) => {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) return '[redacted]';
      if (typeof nestedValue === 'string') return redactSensitiveText(nestedValue);
      if (typeof nestedValue === 'number' && SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) return '[redacted]';
      return nestedValue;
    }));
  } catch {
    return '[redacted-object]';
  }
}

export function sanitizeRegisteredAddressForPublicQr(record: RegisteredAddressRecord): RegisteredAddressRecord {
  if (record.type === 'AOID') return redactAOIDForPublicUse(record);
  const quality = sanitizeRegisteredAddressQualitySnapshot(record.quality);

  return {
    type: record.type,
    id: record.id,
    ...(record.agid ? { agid: record.agid } : {}),
    ...(record.country ? { country: record.country } : {}),
    name: record.agid || record.id,
    address: record.address,
    registeredAt: record.registeredAt,
    ...(record.updatedAt ? { updatedAt: record.updatedAt } : {}),
    ...(quality ? { quality } : {}),
  };
}

export function clearPrivateLocalStorage(storage: Storage) {
  for (const key of PRIVATE_STORAGE_KEYS) {
    storage.removeItem(key);
  }
}
