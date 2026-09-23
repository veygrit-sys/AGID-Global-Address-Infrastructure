import type { AddressFormat,LanguageFormat } from '../data/address_formats';
import {
  countryName,
  normalizeEnglishAddressBuildingName,
  normalizeEnglishAddressPart,
} from './addressEnglish';
import { isEnglishAddressCountry,isInternationalShippingEnglishTab } from './languageTabs';

export type AddressTemplateMode = 'native' | 'domestic' | 'international' | 'international-english';

export interface SelectedAddressFormat {
  spec: LanguageFormat;
  mode: AddressTemplateMode;
  language: string;
  isEnglish: boolean;
}

const TOKEN_PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

function cleanTab(tab: string) {
  return (tab || 'local').trim();
}

function baseLanguage(tab: string) {
  const cleaned = cleanTab(tab);
  if (cleaned === 'zh-Hans' || cleaned === 'zh-Hant' || cleaned === 'pt-BR' || cleaned === 'pt-PT') {
    return cleaned;
  }
  return cleaned.split(/[-_]/)[0];
}

function languageCandidates(tab: string) {
  const cleaned = cleanTab(tab);
  const base = baseLanguage(cleaned);
  return Array.from(new Set([cleaned, base].filter(Boolean)));
}

function isInternationalEnglishTab(tab: string, countryCode: string) {
  const cleaned = cleanTab(tab);
  return (
    isInternationalShippingEnglishTab(cleaned) ||
    cleaned === 'international' ||
    cleaned === 'romaji' ||
    cleaned === 'en' ||
    (cleaned.startsWith('en') && cleaned !== 'en_domestic' && !isEnglishAddressCountry(countryCode))
  );
}

function isDomesticEnglishTab(tab: string) {
  return cleanTab(tab) === 'en_domestic';
}

function languageRecordMatch(record: Record<string, LanguageFormat> | undefined, tab: string) {
  if (!record) return undefined;
  for (const candidate of languageCandidates(tab)) {
    const direct = record[candidate];
    if (direct) return { language: candidate, spec: direct };
  }
  return undefined;
}

function nativeLanguageCodes(format: AddressFormat) {
  return format.addressRules?.languages?.map(language => language.code).filter(Boolean) || [];
}

function shouldUseNativeFormat(format: AddressFormat, tab: string) {
  const cleaned = cleanTab(tab);
  if (cleaned === 'local' || cleaned === 'native') return true;
  const [primaryNative] = nativeLanguageCodes(format);
  return Boolean(primaryNative && languageCandidates(cleaned).includes(primaryNative));
}

export function selectAddressLanguageFormat(
  format: AddressFormat | null | undefined,
  tab: string,
): SelectedAddressFormat | null {
  if (!format) return null;
  const countryCode = (format.countryCode || '').toUpperCase();
  const cleaned = cleanTab(tab);

  if (isDomesticEnglishTab(cleaned)) {
    const domesticEnglish = languageRecordMatch(format.domestic, 'en')?.spec;
    const nativeIsEnglish = nativeLanguageCodes(format).some(code => baseLanguage(code) === 'en');
    const spec = domesticEnglish || (nativeIsEnglish ? format.native : undefined) || format.native || format.english;
    return spec
      ? { spec, mode: 'domestic', language: 'en', isEnglish: true }
      : null;
  }

  if (isInternationalEnglishTab(cleaned, countryCode)) {
    const internationalEnglish = languageRecordMatch(format.international, 'en')?.spec;
    const spec = format.english || internationalEnglish || format.native;
    return spec
      ? { spec, mode: 'international-english', language: 'en', isEnglish: true }
      : null;
  }

  const domestic = languageRecordMatch(format.domestic, cleaned);
  if (domestic) {
    return { spec: domestic.spec, mode: 'domestic', language: domestic.language, isEnglish: false };
  }

  if (shouldUseNativeFormat(format, cleaned) && format.native) {
    const language = nativeLanguageCodes(format)[0] || cleaned;
    return { spec: format.native, mode: 'native', language, isEnglish: false };
  }

  const international = languageRecordMatch(format.international, cleaned);
  if (international) {
    return { spec: international.spec, mode: 'international', language: international.language, isEnglish: false };
  }

  if (format.native) {
    return { spec: format.native, mode: 'native', language: cleaned, isEnglish: false };
  }

  return null;
}

function text(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function readValue(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = text(data[key]);
    if (value) return value;
  }
  return '';
}

function normalizeTemplateValue(value: string, selected: SelectedAddressFormat, countryCode: string, key: string) {
  if (!value) return '';
  if (!selected.isEnglish) return value;
  if (key === 'country') return countryName(countryCode, value).toUpperCase();
  if (key === 'organization' || key === 'building' || key === 'poi' || key === 'recipient') {
    return normalizeEnglishAddressBuildingName(value, countryCode);
  }
  return normalizeEnglishAddressPart(value, countryCode);
}

export function addressTemplateValues(
  data: Record<string, unknown>,
  selected: SelectedAddressFormat,
  countryCodeOverride?: string,
) {
  const countryCode = (countryCodeOverride || text(data.country_code) || text(data.countryCode)).slice(0, 2).toUpperCase();
  const raw: Record<string, string> = {
    recipient: readValue(data, ['recipient', 'name', 'contactName', 'recipient_name']),
    organization: readValue(data, ['organization', 'company', 'building', 'building_name', 'poi', 'amenity', 'shop', 'tourism']),
    building: readValue(data, ['building', 'building_name', 'organization', 'company']),
    poi: readValue(data, ['poi', 'map_feature_name', 'amenity', 'shop', 'tourism', 'leisure', 'historic']),
    postcode: readValue(data, ['postcode', 'postal_code', 'zip']),
    state: readValue(data, ['state', 'province', 'region', 'department', 'governorate', 'emirate']),
    province: readValue(data, ['province', 'state', 'region']),
    city: readValue(data, ['city', 'town', 'village', 'municipality']),
    district: readValue(data, ['district', 'city_district', 'county', 'subdivision']),
    subdistrict: readValue(data, ['subdistrict', 'suburb', 'neighbourhood', 'quarter', 'colonia', 'bairro', 'hamlet']),
    suburb: readValue(data, ['suburb', 'neighbourhood', 'hamlet', 'colonia', 'bairro']),
    street: readValue(data, ['street', 'road', 'avenue', 'square', 'place']),
    road: readValue(data, ['road', 'street', 'avenue', 'square', 'place']),
    houseNumber: readValue(data, ['house_number', 'houseNumber', 'house_no', 'number']),
    house_number: readValue(data, ['house_number', 'houseNumber', 'house_no', 'number']),
    unit: readValue(data, ['unit', 'suite', 'apartment', 'flat', 'room']),
    floor: readValue(data, ['floor']),
    country: readValue(data, ['country']) || countryName(countryCode, countryCode),
    countryCode,
    plusCode: readValue(data, ['plus_code', 'plusCode']),
    plus_code: readValue(data, ['plus_code', 'plusCode']),
  };

  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      normalizeTemplateValue(value, selected, countryCode, key),
    ]),
  ) as Record<string, string>;
}

function comparableLine(line: string) {
  return line.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

export function cleanRenderedAddressTemplate(value: string) {
  const seen = new Set<string>();
  return value
    .split(/\r?\n/)
    .map(line => line.replace(TOKEN_PATTERN, ''))
    .map(line => line.replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/^[\s,]+|[\s,]+$/g, ''))
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .filter(line => /[\p{L}\p{N}]/u.test(line))
    .filter(line => {
      const comparable = comparableLine(line);
      if (!comparable || seen.has(comparable)) return false;
      seen.add(comparable);
      return true;
    })
    .join('\n')
    .trim();
}

export function renderAddressFormatTemplate(
  format: AddressFormat | null | undefined,
  tab: string,
  data: Record<string, unknown>,
) {
  const selected = selectAddressLanguageFormat(format, tab);
  if (!selected?.spec?.addressFormat) return '';
  const countryCode = (format?.countryCode || text(data.country_code) || text(data.countryCode)).slice(0, 2).toUpperCase();
  const values = addressTemplateValues(data, selected, countryCode);
  const rendered = selected.spec.addressFormat.replace(TOKEN_PATTERN, (_match, token: string) => values[token] || '');
  return cleanRenderedAddressTemplate(rendered);
}
