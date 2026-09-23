import {
  type AddressQlRuntimeAdapter,
  type AddressQlRuntimeAdapterEvidence,
  type AddressQlRuntimeAdapterMode,
  type AddressQlRuntimePurpose,
} from './addressQlRuntimeAdapter';

export const ADDRESSQL_POSTAL_SET_ADAPTER_VERSION =
  'addressql-postal-set-adapter-v0.1';

export type AddressQlPostalSetAdapterOptions = {
  id: string;
  version: string;
  mode: AddressQlRuntimeAdapterMode;
  countryCode: string;
  purpose: AddressQlRuntimePurpose;
  coverage: 'complete' | 'partial';
  postalCodes: readonly string[];
  evidence: AddressQlRuntimeAdapterEvidence;
};

const COUNTRY_CODE = /^[A-Z]{2}$/;
const MAX_POSTAL_CODE_LENGTH = 32;
const MAX_POSTAL_CODE_COUNT = 2_000_000;

function normalizePostalCode(value: string, countryCode?: string) {
  const normalized = value
    .normalize('NFKC')
    .trim()
    .toUpperCase()
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/\s+/g, ' ');
  if (countryCode === 'JP' && /^\d{3}-?\d{4}$/.test(normalized)) {
    return normalized.replace('-', '');
  }
  return normalized;
}

export function createAddressQlPostalSetAdapter(
  options: AddressQlPostalSetAdapterOptions,
): AddressQlRuntimeAdapter {
  const countryCode = options.countryCode.trim().toUpperCase();
  if (!COUNTRY_CODE.test(countryCode)) {
    throw new Error('postal set adapter requires one ISO alpha-2 country code');
  }
  if (
    options.postalCodes.length === 0
    || options.postalCodes.length > MAX_POSTAL_CODE_COUNT
  ) {
    throw new Error('postal set adapter requires a bounded non-empty postcode set');
  }

  const postalCodes = new Set<string>();
  for (const value of options.postalCodes) {
    const normalized = normalizePostalCode(value, countryCode);
    if (!normalized || normalized.length > MAX_POSTAL_CODE_LENGTH) {
      throw new Error('postal set adapter contains an invalid postcode value');
    }
    postalCodes.add(normalized);
  }

  return {
    id: options.id,
    version: options.version,
    mode: options.mode,
    countryCodes: [countryCode],
    purposes: [options.purpose],
    evidence: options.evidence,
    evaluate(input) {
      const normalized = normalizePostalCode(input.postalCode, countryCode);
      if (!normalized) {
        return {
          status: 'unknown',
          confidence: 0,
          reasonCode: 'postal_code_missing',
        };
      }
      if (postalCodes.has(normalized)) {
        return {
          status: 'pass',
          confidence: options.coverage === 'complete' ? 1 : 0.95,
          reasonCode: options.purpose === 'delivery'
            ? 'delivery_area_set_match'
            : 'postal_set_match',
        };
      }
      if (options.coverage === 'complete') {
        return {
          status: 'fail',
          confidence: 1,
          reasonCode: options.purpose === 'delivery'
            ? 'delivery_area_set_miss'
            : 'postal_set_miss',
        };
      }
      return {
        status: 'unknown',
        confidence: 0,
        reasonCode: 'partial_postal_set_no_match',
      };
    },
  };
}
