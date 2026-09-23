import type { AddressFormat } from '../data/address_formats';
import { normalizeEnglishAddressPart } from './addressEnglish';
import type { CanonicalAddressParts } from './addressIntelligence';
import type { AddressMorphismCandidate } from './addressMorphism';

export type NaturalAddressKind = 'sea' | 'water' | 'waterfront' | 'mountain' | 'island' | 'rural' | 'land';

export type NaturalAddressContext = {
  kind: NaturalAddressKind;
  name?: string;
  distanceMeters?: number;
  sourceIds?: string[];
};

export type MorphismSourceInput = {
  id?: string;
  label: string;
  canonical: CanonicalAddressParts;
  lat?: number;
  lon?: number;
  plusCode?: string | null;
  sources?: string[];
  confidence?: number;
  addressFormat?: AddressFormat | null;
  naturalContext?: NaturalAddressContext | null;
};

const ROMANIZABLE_FIELDS: Array<keyof CanonicalAddressParts> = [
  'country',
  'state',
  'city',
  'district',
  'subdistrict',
  'suburb',
  'road',
  'building',
  'poi',
];

function normalizeCountryCode(value?: string) {
  return String(value || '').trim().toUpperCase();
}

function compactPostcode(value?: string) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function regexMatches(regex: string | null | undefined, value: string) {
  if (!regex || !value) return undefined;
  try {
    return new RegExp(regex, 'i').test(value);
  } catch {
    return undefined;
  }
}

function postalValidationScore(canonical: CanonicalAddressParts, addressFormat?: AddressFormat | null) {
  const postcode = compactPostcode(canonical.postcode);
  const postalRule = addressFormat?.postalCode;
  const ruleMetadata = addressFormat?.addressRules?.postalCode;

  if (!postalRule && !ruleMetadata) return undefined;
  if (!postcode) return ruleMetadata?.required ? 0.28 : 0.55;

  const directMatch = regexMatches(postalRule?.regex, canonical.postcode || '');
  if (directMatch === true) return 0.98;
  if (directMatch === false) return 0.34;

  if (postalRule?.format) {
    const digitCount = (postalRule.format.match(/N/g) || []).length;
    if (digitCount > 0 && postcode.replace(/\D/g, '').length === digitCount) return 0.9;
  }

  return 0.72;
}

function googleSourceId(source?: string | null) {
  const normalized = String(source || '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized === 'libaddressinput') return 'google-libaddressinput';
  if (normalized === 'open-location-code' || normalized === 'plus-code' || normalized === 'plus-codes') {
    return 'google-open-location-code';
  }
  return normalized;
}

function sourceIdsFor(
  addressFormat?: AddressFormat | null,
  naturalContext?: NaturalAddressContext | null,
  plusCode?: string | null,
) {
  return Array.from(new Set([
    ...(addressFormat?.openSourceIds || []),
    ...(addressFormat?.addressRules?.openSourceIds || []),
    googleSourceId(addressFormat?.postalCode?.source),
    plusCode ? 'google-open-location-code' : '',
    ...(naturalContext?.sourceIds || []),
  ].filter(Boolean)));
}

function romanizeCanonical(canonical: CanonicalAddressParts) {
  const code = normalizeCountryCode(canonical.country_code);
  const romanized: CanonicalAddressParts = { ...canonical };
  if (romanized.country_code) romanized.country_code = romanized.country_code.toLowerCase();

  for (const field of ROMANIZABLE_FIELDS) {
    const value = canonical[field];
    if (!value) continue;
    const english = normalizeEnglishAddressPart(value, code);
    if (english) romanized[field] = english;
  }

  return romanized;
}

function naturalConfidenceBoost(naturalContext?: NaturalAddressContext | null) {
  if (!naturalContext) return 0;
  const distance = naturalContext.distanceMeters ?? 1000;
  if (distance <= 100) return 0.12;
  if (distance <= 500) return 0.08;
  return 0.04;
}

function evidenceConfidenceFloor(validationScore?: number, sourceIds: string[] = []) {
  if (sourceIds.includes('google-open-location-code') && sourceIds.includes('marine-regions')) return 0.7;
  if ((validationScore ?? 0) >= 0.95 && sourceIds.length >= 2) return 0.92;
  if ((validationScore ?? 0) >= 0.95 && sourceIds.includes('google-libaddressinput')) return 0.9;
  if ((validationScore ?? 0) >= 0.85) return 0.74;
  return 0;
}

export function buildMorphismCandidateFromSources(input: MorphismSourceInput): AddressMorphismCandidate {
  const sourceIds = sourceIdsFor(input.addressFormat, input.naturalContext, input.plusCode);
  const validationScore = postalValidationScore(input.canonical, input.addressFormat);
  const canonical = romanizeCanonical(input.canonical);
  const labelParts = [
    input.label,
    canonical.postcode,
    input.plusCode || '',
    input.naturalContext?.name,
    ...ROMANIZABLE_FIELDS.map(field => canonical[field]).filter(Boolean),
  ];

  return {
    id: input.id,
    label: Array.from(new Set(labelParts)).filter(Boolean).join(' | '),
    canonical,
    lat: input.lat,
    lon: input.lon,
    sources: Array.from(new Set([...(input.sources || []), ...sourceIds])),
    confidence: Math.min(0.99, Math.max(
      input.confidence ?? 0.55,
      evidenceConfidenceFloor(validationScore, sourceIds),
    ) + naturalConfidenceBoost(input.naturalContext)),
    validationScore,
    naturalContext: input.naturalContext || undefined,
  };
}

export function detectNaturalAddressContext({
  tags = {},
  category,
  type,
  displayName,
}: {
  tags?: Record<string, string>;
  category?: string;
  type?: string;
  displayName?: string;
}): NaturalAddressContext | null {
  const joined = [
    tags.natural,
    tags.water,
    tags.waterway,
    tags.place,
    category,
    type,
    displayName,
  ].filter(Boolean).join(' ').toLowerCase();

  const name = tags['name:en'] || tags.name || displayName;
  if (/\b(peak|volcano|mountain|ridge|summit)\b/.test(joined)) {
    return { kind: 'mountain', name, sourceIds: ['osm-overpass', 'geonames-gazetteer'] };
  }
  if (/\b(sea|ocean|bay|strait|gulf|marine)\b/.test(joined)) {
    return { kind: 'sea', name, sourceIds: ['osm-overpass', 'marine-regions'] };
  }
  if (/\b(coast|beach|harbour|harbor|port|waterfront)\b/.test(joined)) {
    return { kind: 'waterfront', name, sourceIds: ['osm-overpass'] };
  }
  if (/\b(water|river|stream|lake|wetland|canal)\b/.test(joined)) {
    return { kind: 'water', name, sourceIds: ['osm-overpass'] };
  }
  if (/\b(island|islands|isle|islet|islets|atoll|archipelago|cay|cays|cayo|caye|key|keys|holm|skerry|ait|eyot)\b/.test(joined) || /島|離島|小島|島嶼|諸島|群島|列島|環礁/.test(joined)) {
    return { kind: 'island', name, sourceIds: ['osm-overpass', 'geonames-gazetteer'] };
  }
  return null;
}
