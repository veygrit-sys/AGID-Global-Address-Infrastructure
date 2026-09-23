import type { AddressField, AddressFormat, LanguageFormat } from '../data/address_formats';
import type { AddressElementFieldKey, AddressElementLanguageTab } from './addressElement';
import {
  buildRegistrationAddressLanguageTabs,
  normalizeRegistrationAddressLanguage,
  selectRegistrationAddressFormat,
} from './addressRegistrationState';
import {
  getAddressElementPostalCodePolicy,
  mapAddressElementFormatFieldKey,
  type AddressElementPostalCodePolicy,
} from './addressElementInputPolicy';

export type AddressElementFieldDescriptor = {
  key: AddressElementFieldKey;
  label: string;
  placeholder?: string;
  autocomplete?: string;
  private?: boolean;
  required?: boolean;
  sourceKey?: string;
  type?: string;
  inputMode?: 'text' | 'numeric' | 'tel';
  pattern?: string;
  maxLength?: number;
  fixed?: boolean;
  fixedValue?: string;
  characterSlots?: number;
  autofillEligible?: boolean;
};

export const ADDRESS_ELEMENT_FALLBACK_FIELDS: AddressElementFieldDescriptor[] = [
  { key: 'recipient', label: 'Recipient', autocomplete: 'name', private: true },
  { key: 'countryCode', label: 'Country', autocomplete: 'country' },
  { key: 'postcode', label: 'Postal code', autocomplete: 'postal-code' },
  { key: 'state', label: 'State / region', autocomplete: 'address-level1' },
  { key: 'city', label: 'City', autocomplete: 'address-level2' },
  { key: 'district', label: 'District', autocomplete: 'address-level3' },
  { key: 'street', label: 'Street', autocomplete: 'address-line1' },
  { key: 'houseNumber', label: 'House no.', autocomplete: 'address-line2' },
  { key: 'building', label: 'Building / POI', autocomplete: 'organization' },
  { key: 'unit', label: 'Unit', autocomplete: 'address-line3', private: true },
  { key: 'phone', label: 'Phone', autocomplete: 'tel', private: true },
];

const FALLBACK_FIELD_BY_KEY = Object.fromEntries(
  ADDRESS_ELEMENT_FALLBACK_FIELDS.map(field => [field.key, field]),
) as Partial<Record<AddressElementFieldKey, AddressElementFieldDescriptor>>;

const PRIVATE_FIELD_KEYS = new Set<AddressElementFieldKey>(['recipient', 'phone', 'unit', 'aoid']);

export function normalizeAddressElementCountryCode(countryCode?: string | null) {
  const code = String(countryCode ?? '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : '';
}

export function mapAddressFormatFieldKey(key: string): AddressElementFieldKey | null {
  return mapAddressElementFormatFieldKey(key);
}

function descriptorFromFormatField(field: AddressField): AddressElementFieldDescriptor | null {
  const key = mapAddressFormatFieldKey(field.key);
  if (!key) return null;
  const fallback = FALLBACK_FIELD_BY_KEY[key];
  return {
    key,
    label: field.label || fallback?.label || key,
    placeholder: field.placeholder || fallback?.placeholder,
    autocomplete: fallback?.autocomplete,
    private: fallback?.private || PRIVATE_FIELD_KEYS.has(key),
    required: Boolean(field.required),
    sourceKey: field.key,
    type: field.type,
  };
}

function applyPostalPolicyToDescriptor(
  field: AddressElementFieldDescriptor,
  postalPolicy: AddressElementPostalCodePolicy,
): AddressElementFieldDescriptor | null {
  if (field.key !== 'postcode') return field;
  if (!postalPolicy.available) return null;
  const fixedValue = postalPolicy.fixedValue;
  return {
    ...field,
    label: field.label || postalPolicy.label,
    placeholder: fixedValue || field.placeholder || postalPolicy.format || postalPolicy.label,
    required: postalPolicy.required || field.required,
    inputMode: postalPolicy.inputMode,
    pattern: postalPolicy.regex || field.pattern,
    maxLength: postalPolicy.characterSlots,
    fixed: Boolean(fixedValue),
    ...(fixedValue ? { fixedValue } : {}),
    characterSlots: postalPolicy.characterSlots,
    autofillEligible: postalPolicy.autofillEligible,
  };
}

function applyFieldPolicies(
  fields: AddressElementFieldDescriptor[],
  postalPolicy: AddressElementPostalCodePolicy,
) {
  const next: AddressElementFieldDescriptor[] = [];
  const seen = new Set<AddressElementFieldKey>();
  for (const field of fields) {
    const enhanced = applyPostalPolicyToDescriptor(field, postalPolicy);
    if (!enhanced || seen.has(enhanced.key)) continue;
    seen.add(enhanced.key);
    next.push(enhanced);
  }
  if (postalPolicy.available && postalPolicy.required && !seen.has('postcode')) {
    const fallback = applyPostalPolicyToDescriptor({ ...FALLBACK_FIELD_BY_KEY.postcode! }, postalPolicy);
    if (fallback) next.push(fallback);
  }
  return next;
}

function addRequiredHostFields(fields: AddressElementFieldDescriptor[]) {
  const seen = new Set(fields.map(field => field.key));
  const next = [...fields];

  if (!seen.has('countryCode')) {
    next.unshift({ ...FALLBACK_FIELD_BY_KEY.countryCode! });
    seen.add('countryCode');
  }
  if (!seen.has('recipient')) {
    next.unshift({ ...FALLBACK_FIELD_BY_KEY.recipient! });
    seen.add('recipient');
  }
  if (!seen.has('phone')) {
    next.push({ ...FALLBACK_FIELD_BY_KEY.phone! });
  }

  return next;
}

export function buildAddressElementLanguageTabs(
  format: AddressFormat | null | undefined,
  countryCode?: string,
): Required<AddressElementLanguageTab>[] {
  const tabs = buildRegistrationAddressLanguageTabs(format, countryCode || format?.countryCode || '');
  if (!tabs.length) {
    return [
      { language: 'local', label: 'Local', source: 'native', enabled: true },
      { language: 'en', label: 'English Shipping', source: 'english-shipping', enabled: true },
    ];
  }

  return tabs.map(tab => ({
    language: tab.code,
    label: tab.label,
    source: tab.code === 'en_domestic'
      ? 'english-domestic'
      : tab.kind === 'international' || tab.code === 'en'
        ? 'english-shipping'
        : 'native',
    enabled: true,
  }));
}

export function pickAddressElementLanguage(
  language: string | undefined,
  tabs: readonly AddressElementLanguageTab[],
) {
  const normalized = normalizeRegistrationAddressLanguage(language);
  const exact = tabs.find(tab => tab.language === normalized);
  if (exact) return exact.language;
  if (normalized === 'en' && tabs.some(tab => tab.language === 'en_domestic')) return 'en_domestic';
  return tabs[0]?.language || 'local';
}

export function selectAddressElementFormat(
  format: AddressFormat | null | undefined,
  language: string,
): LanguageFormat | undefined {
  return selectRegistrationAddressFormat(format, language) as LanguageFormat | undefined;
}

export function buildAddressElementFormFields(
  format: AddressFormat | null | undefined,
  language: string,
) {
  const postalPolicy = getAddressElementPostalCodePolicy(format);
  const selectedFormat = selectAddressElementFormat(format, language);
  const mapped = selectedFormat?.fields
    ?.map(descriptorFromFormatField)
    .filter((field): field is AddressElementFieldDescriptor => Boolean(field)) ?? [];
  const deduped: AddressElementFieldDescriptor[] = [];
  const seen = new Set<AddressElementFieldKey>();

  for (const field of mapped) {
    if (seen.has(field.key)) continue;
    seen.add(field.key);
    deduped.push(field);
  }

  return addRequiredHostFields(applyFieldPolicies(
    deduped.length ? deduped : ADDRESS_ELEMENT_FALLBACK_FIELDS,
    postalPolicy,
  ));
}

export function describeAddressElementCountryForm(
  format: AddressFormat | null | undefined,
  language: string,
) {
  const postalCodePolicy = getAddressElementPostalCodePolicy(format);
  const selectedFormat = selectAddressElementFormat(format, language);
  const formFields = buildAddressElementFormFields(format, language);
  const requiredFields = formFields.filter(field => field.required).map(field => field.label);

  return {
    countryName: format?.name || 'Fallback country form',
    formatName: selectedFormat?.name || 'Generic address form',
    ordering: selectedFormat?.ordering || format?.ordering || 'small-to-big',
    postalCodeFormat: postalCodePolicy.available
      ? postalCodePolicy.format || postalCodePolicy.regex || 'country dependent'
      : 'not used',
    postalCodePolicy,
    fieldCount: formFields.length,
    requiredFields,
  };
}

export { getAddressElementPostalCodePolicy };
