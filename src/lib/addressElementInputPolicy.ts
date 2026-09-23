import type { AddressElementFieldKey } from './addressElement';

export type AddressElementPostalCodeUsage =
  | 'required'
  | 'recommended'
  | 'used'
  | 'partial'
  | 'optional'
  | 'none'
  | 'unknown';

export type AddressElementPostalCodePolicy = {
  available: boolean;
  required: boolean;
  usage: AddressElementPostalCodeUsage;
  label: string;
  format: string | null;
  regex: string | null;
  fixedValue?: string;
  characterSlots?: number;
  inputMode: 'text' | 'numeric';
  autofillEligible: boolean;
  evidenceSource: 'api' | 'source' | 'metadata' | 'none';
  reason: string;
};

type PostalPolicyFormatLike = {
  postalCode?: {
    format?: string | null;
    regex?: string | null;
    api?: string | null;
    source?: string | null;
  } | null;
  postalCodeRegex?: string | null;
  addressRules?: {
    postalCode?: {
      label?: string;
      required?: boolean;
      usage?: string;
    } | null;
  };
};

const FORMAT_FIELD_KEY_MAP: Record<string, AddressElementFieldKey> = {
  addressline1: 'street',
  addressline2: 'houseNumber',
  addressline3: 'unit',
  address1: 'street',
  address2: 'houseNumber',
  address3: 'unit',
  apartment: 'unit',
  area: 'district',
  block: 'district',
  building: 'building',
  buildingname: 'building',
  buildingnumber: 'houseNumber',
  city: 'city',
  commune: 'city',
  company: 'organization',
  country: 'countryCode',
  countrycode: 'countryCode',
  county: 'district',
  department: 'state',
  district: 'district',
  emirate: 'state',
  floor: 'unit',
  fullname: 'recipient',
  housenumber: 'houseNumber',
  island: 'state',
  landmark: 'building',
  line1: 'street',
  line2: 'houseNumber',
  line3: 'unit',
  locality: 'city',
  municipality: 'city',
  name: 'recipient',
  neighborhood: 'district',
  neighbourhood: 'district',
  organization: 'organization',
  phone: 'phone',
  poi: 'building',
  postalcode: 'postcode',
  postcode: 'postcode',
  prefecture: 'state',
  province: 'state',
  recipient: 'recipient',
  region: 'state',
  road: 'street',
  room: 'unit',
  settlement: 'city',
  state: 'state',
  street: 'street',
  streetaddress: 'street',
  suite: 'unit',
  tel: 'phone',
  telephone: 'phone',
  town: 'city',
  unit: 'unit',
  village: 'city',
  ward: 'district',
  zip: 'postcode',
  zipcode: 'postcode',
};

const USAGE_VALUES = new Set<AddressElementPostalCodeUsage>([
  'required',
  'recommended',
  'used',
  'partial',
  'optional',
  'none',
  'unknown',
]);

function normalizeFormatFieldKey(key: string) {
  return key.trim().replace(/[_\-\s]/g, '').toLowerCase();
}

function normalizeUsage(value: unknown): AddressElementPostalCodeUsage {
  const normalized = String(value ?? '').trim().toLowerCase();
  return USAGE_VALUES.has(normalized as AddressElementPostalCodeUsage)
    ? normalized as AddressElementPostalCodeUsage
    : 'unknown';
}

function cleanOptionalText(value: unknown) {
  const text = String(value ?? '').trim();
  return text.length ? text : null;
}

function hasNoPostalCodeSignal(text: string) {
  return /(no\s+(national\s+)?post(?:al)?\s*codes?|no\s+postcode|not\s+used|uninhabited|no\s+permanent\s+address|none|なし|不要|未使用)/i.test(text);
}

function fixedValueFromRegex(regex: string | null) {
  if (!regex) return undefined;
  const value = regex.trim().replace(/^\^/, '').replace(/\$$/, '');
  if (!value || /[\\[\]{}().+*?|]/.test(value)) return undefined;
  if (!/^[A-Z0-9][A-Z0-9 -]{1,16}$/i.test(value)) return undefined;
  return value.toUpperCase();
}

function slotCountFromRegex(regex: string | null) {
  if (!regex) return undefined;
  // PS: P3/P7 are alternatives, not concatenated digit groups; include the P.
  if (regex === '^P(?:[0-9]{3}|[0-9]{7})$') return 8;
  let total = 0;
  for (const match of regex.matchAll(/(?:\\d|\[0-9\]|\[A-Z\]|\[A-Z0-9\])\{(\d+)(?:,\d+)?\}/gi)) {
    total += Number(match[1]);
  }
  if (total > 0) return total;
  const simple = regex.replace(/^\^/, '').replace(/\$$/, '');
  if (/^[A-Z0-9 -]{2,16}$/i.test(simple)) return simple.replace(/[^A-Z0-9]/gi, '').length;
  return undefined;
}

function slotCountFromFormat(format: string | null) {
  if (!format) return undefined;
  const placeholderCount = (format.match(/[N#9A]/g) ?? []).length;
  if (placeholderCount > 1) return placeholderCount;

  let total = 0;
  for (const match of format.matchAll(/(\d+)\s*(?:digits?|letters?|characters?|alphanumeric|桁|文字)/gi)) {
    total += Number(match[1]);
  }
  return total || undefined;
}

function inferInputMode(regex: string | null, label: string) {
  const text = `${regex ?? ''} ${label}`;
  if (/[A-Z]\]|\[A-Z|letters?|alpha|A{2,}|[A-Z]{2,}/i.test(text)) return 'text';
  return 'numeric';
}

function evidenceSource(format: PostalPolicyFormatLike | null | undefined): AddressElementPostalCodePolicy['evidenceSource'] {
  if (format?.postalCode?.api) return 'api';
  if (format?.postalCode?.source) return 'source';
  if (format?.postalCode || format?.postalCodeRegex || format?.addressRules?.postalCode) return 'metadata';
  return 'none';
}

export function mapAddressElementFormatFieldKey(key: string): AddressElementFieldKey | null {
  const normalized = normalizeFormatFieldKey(key);
  return FORMAT_FIELD_KEY_MAP[normalized] || null;
}

export function getAddressElementPostalCodePolicy(
  format: PostalPolicyFormatLike | null | undefined,
): AddressElementPostalCodePolicy {
  const rule = format?.addressRules?.postalCode;
  const regex = cleanOptionalText(format?.postalCode?.regex) || cleanOptionalText(format?.postalCodeRegex);
  const formatLabel = cleanOptionalText(format?.postalCode?.format);
  const ruleLabel = cleanOptionalText(rule?.label);
  const label = ruleLabel || formatLabel || regex || 'country dependent';
  const usage = rule === null ? 'none' : normalizeUsage(rule?.usage || (format?.postalCode ? 'used' : 'unknown'));
  const text = [
    formatLabel,
    regex,
    ruleLabel,
    rule?.usage,
    format?.postalCode?.source,
  ].filter(Boolean).join(' ');
  const explicitNone = rule === null || (hasNoPostalCodeSignal(text) && !regex);
  const available = !explicitNone && Boolean(regex || formatLabel || rule || format?.postalCode?.api || format?.postalCode?.source);
  const fixedValue = available ? fixedValueFromRegex(regex) : undefined;
  const characterSlots = available
    ? fixedValue?.replace(/[^A-Z0-9]/gi, '').length || slotCountFromRegex(regex) || slotCountFromFormat(formatLabel || ruleLabel)
    : undefined;
  const inputMode = inferInputMode(regex, label);
  const required = available && Boolean(rule?.required || usage === 'required');

  return {
    available,
    required,
    usage: available ? usage : 'none',
    label: available ? label : 'Postal code not used',
    format: available ? formatLabel || ruleLabel || null : null,
    regex: available ? regex : null,
    ...(fixedValue ? { fixedValue } : {}),
    ...(characterSlots ? { characterSlots } : {}),
    inputMode,
    autofillEligible: available && evidenceSource(format) !== 'none',
    evidenceSource: available ? evidenceSource(format) : 'none',
    reason: explicitNone
      ? 'country-does-not-use-postal-code'
      : required
        ? 'country-metadata-requires-postal-code'
        : available
          ? 'country-metadata-supports-postal-code'
          : 'postal-code-metadata-unknown',
  };
}
