/// <reference types="vite/client" />

import { hydrateAddressFormat } from './addressFormatCommon';

export interface AddressField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}

export interface LanguageFormat {
  name?: string;
  addressFormat: string;
  ordering: 'big-to-small' | 'small-to-big';
  fields: AddressField[];
}

export interface PostalCodeInfo {
  format: string | null;
  regex: string | null;
  api: string | null;
  source: string;
}

export interface AddressRuleMetadata {
  languages: { code: string; name: string }[];
  deliveryLanguages?: { code: string; name: string }[];
  nativeOrder: string[];
  englishOrder: string[];
  russianOrder?: string[];
  regionalHierarchy: string[];
  openSourceIds?: string[];
  postalCode: { label: string; required: boolean; usage: 'required' | 'recommended' | 'used' | 'partial' | 'optional' } | null;
}

export interface AddressFormat {
  countryCode: string;
  name: string;
  native?: LanguageFormat;
  english?: LanguageFormat;
  domestic?: Record<string, LanguageFormat>;
  international?: Record<string, LanguageFormat>;
  postalCode?: PostalCodeInfo;
  nativeName?: string;
  addressFormat?: string;
  fields?: (AddressField & { labelEn?: string })[];
  ordering?: 'big-to-small' | 'small-to-big';
  postalCodeRegex?: string;
  openSourceIds?: string[];
  addressRules?: AddressRuleMetadata;
}

// Vite handles dynamic imports with variables using glob patterns.
// Node-based unit tests do not provide import.meta.glob, so keep the module
// importable even when dynamic address-format loading is unavailable.
let formatModules: Record<string, () => Promise<unknown>> = {};
try {
  formatModules = import.meta.glob('./**/*.json');
} catch {
  // Node-based unit tests do not provide Vite's import.meta.glob.
}
const formatModuleByCode = Object.fromEntries(
  Object.keys(formatModules).map(path => {
    const fileName = path.split('/').pop() || '';
    return [fileName.replace(/\.json$/, '').toUpperCase(), path];
  }),
) as Record<string, string>;
const addressFormatCache = new Map<string, Promise<AddressFormat | null>>();

function resolveAddressFormatCode(countryCode: string) {
  const code = countryCode.trim().toUpperCase();
  if (!code || !isAddressFormatLookupCandidate(code)) {
    return { code, path: undefined, shouldWarn: false };
  }

  const directPath = formatModuleByCode[code];
  if (directPath) return { code, path: directPath, shouldWarn: true };

  const baseCode = code.split(/[-_]/)[0];
  const basePath = formatModuleByCode[baseCode];
  if (basePath) return { code: baseCode, path: basePath, shouldWarn: true };

  return { code, path: undefined, shouldWarn: true };
}

function isAddressFormatLookupCandidate(code: string) {
  return /^[A-Z]{2,}(?:[-_][A-Z]{1,})*$/.test(code);
}

/**
 * Dynamically loads the address format for a given country code.
 * This improves initial loading speed by not bundling all formats at once.
 */
export async function getAddressFormat(countryCode: string): Promise<AddressFormat | null> {
  const requestedCode = countryCode.trim().toUpperCase();
  const { code, path, shouldWarn } = resolveAddressFormatCode(countryCode);

  if (!path) {
    if (requestedCode && shouldWarn) console.warn(`Address format for ${requestedCode} not found.`);
    return null;
  }

  const cached = addressFormatCache.get(code);
  if (cached) return cached;

  const loadFormat = (async () => {
    try {
      const module = await formatModules[path]() as any;
      return hydrateAddressFormat(module.default as AddressFormat);
    } catch (error) {
      console.warn(`Address format for ${code} failed to load:`, error);
      addressFormatCache.delete(code);
      return null;
    }
  })();

  addressFormatCache.set(code, loadFormat);
  return loadFormat;
}

export function clearAddressFormatCacheForTests() {
  if (import.meta.env?.MODE === 'test') {
    addressFormatCache.clear();
  }
}
