import { normalizeRegistrationAddressLanguage } from './addressRegistrationState';
import type { AddressCoveragePolicy } from './addressCoveragePolicy';
import {
getAmericasAddressTranslationProfile,
translateAmericasAddressField,
} from './americasAddressTranslation';
import {
getCentralAfricaAddressTranslationProfile,
translateCentralAfricaAddressField,
} from './centralAfricaAddressTranslation';
import {
getCentralAsiaAddressTranslationProfile,
translateCentralAsiaAddressField,
} from './centralAsiaAddressTranslation';
import {
getCentralEuropeAddressTranslationProfile,
translateCentralEuropeAddressField,
} from './centralEuropeAddressTranslation';
import {
getEastAfricaAddressTranslationProfile,
translateEastAfricaAddressField,
} from './eastAfricaAddressTranslation';
import { getEastAsiaAddressTranslationProfile,translateEastAsiaAddressField } from './eastAsiaAddressTranslation';
import {
getEasternEuropeAddressTranslationProfile,
translateEasternEuropeAddressField,
} from './easternEuropeAddressTranslation';
import { normalizeEnglishAddressModeField } from './englishAddressMode';
import {
getNorthernEuropeAddressTranslationProfile,
translateNorthernEuropeAddressField,
} from './northernEuropeAddressTranslation';
import {
getOceaniaAddressTranslationProfile,
translateOceaniaAddressField,
} from './oceaniaAddressTranslation';
import { shouldUseOpenSourceTranslationBeforeLocalFallback } from './openSourceAddressResolutionStrategy';
import { translateWithOpenSource } from './openSourceTranslation';
import {
getSouthAsiaAddressTranslationProfile,
translateSouthAsiaAddressField,
} from './southAsiaAddressTranslation';
import {
getSoutheastAsiaAddressTranslationProfile,
translateSoutheastAsiaAddressField,
} from './southeastAsiaAddressTranslation';
import {
getSouthernAfricaAddressTranslationProfile,
translateSouthernAfricaAddressField,
} from './southernAfricaAddressTranslation';
import {
getSouthernEuropeAddressTranslationProfile,
translateSouthernEuropeAddressField,
} from './southernEuropeAddressTranslation';
import {
getWestAfricaAddressTranslationProfile,
translateWestAfricaAddressField,
} from './westAfricaAddressTranslation';
import {
getWestAsiaAddressTranslationProfile,
translateWestAsiaAddressField,
} from './westAsiaAddressTranslation';
import {
getWesternEuropeAddressTranslationProfile,
translateWesternEuropeAddressField,
} from './westernEuropeAddressTranslation';

export type RegistrationFormRecord = Record<string, unknown> & {
  country?: string;
  postcode?: string;
};

export type PostcodeAutofillPatch = Partial<Record<string, string>>;

export type PostcodeAutofillMode = 'auto' | 'candidates' | 'manual';

export type RegistrationAssistanceSource = 'agid' | 'postcode' | 'reverse-geocode' | 'document-ai';

export type ClosedLearningScope = 'closed-device-local-rl-reference';

export type ClosedLearningPolicy = {
  mode: 'closed';
  storage: 'device-local';
  externalTransmission: 'blocked';
  export: 'manual-only';
};

export type RegistrationAssistanceCandidate<T extends RegistrationFormRecord = RegistrationFormRecord> = {
  id: string;
  source: RegistrationAssistanceSource;
  label: string;
  confidence: number;
  patch: Partial<Record<string, string>>;
  evidence: string[];
  requiresUserReview: boolean;
};

export type RegistrationCorrectionField = {
  field: string;
  before: string;
  after: string;
};

export type RegistrationCorrectionSample = {
  id: string;
  kind: 'address-registration-correction';
  createdAt: string;
  country: string;
  addressLanguage?: string;
  agidTail?: string;
  assistanceSourceIds: string[];
  changedFields: RegistrationCorrectionField[];
  excludedFields: string[];
  storageScope: ClosedLearningScope;
  learningPolicy: ClosedLearningPolicy;
};

export type RegistrationAssistanceComparisonCandidate = {
  id: string;
  source: RegistrationAssistanceSource;
  label: string;
  confidence: number;
  fieldCount: number;
  evidenceCount: number;
  applied: boolean;
  requiresUserReview: boolean;
  score: number;
};

export type RegistrationAssistanceComparison = {
  candidates: RegistrationAssistanceComparisonCandidate[];
  recommendedSource: RegistrationAssistanceSource | 'none';
  recommendationReason: string;
  qualityReasons: string[];
  feedbackConsent: {
    enabled: boolean;
    storageScope: ClosedLearningScope;
    externalTransmission: 'blocked';
    canSaveCorrectionHistory: boolean;
  };
};

export type AddressTranslationFeedback = 'accepted' | 'corrected' | 'rejected';

export type AddressTranslationFeedbackField = {
  field: string;
  source?: string;
  translated: string;
  corrected?: string;
};

export type AddressTranslationFeedbackSample = {
  id: string;
  kind: 'address-translation-feedback';
  createdAt: string;
  country: string;
  sourceLanguage: string;
  targetLanguage: string;
  feedback: AddressTranslationFeedback;
  agidTail?: string;
  fields: AddressTranslationFeedbackField[];
  excludedFields: string[];
  storageScope: ClosedLearningScope;
  learningPolicy: ClosedLearningPolicy;
};

type RegistrationCorrectionStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export const REGISTRATION_CORRECTION_STORAGE_KEY = 'agid_registration_correction_samples';
export const ADDRESS_TRANSLATION_FEEDBACK_STORAGE_KEY = 'agid_address_translation_feedback_samples';
export const CLOSED_LEARNING_POLICY: ClosedLearningPolicy = {
  mode: 'closed',
  storage: 'device-local',
  externalTransmission: 'blocked',
  export: 'manual-only',
};

const REGISTRATION_CORRECTION_EXCLUDED_FIELDS = new Set(['recipient', 'phone']);
const TRANSLATION_FEEDBACK_EXCLUDED_FIELDS = new Set(['recipient', 'phone']);

type AddressFormatLike = {
  postalCode?: {
    regex?: string;
    format?: string;
  } | null;
};

type Translator = (input: { text: string; target: string; source?: string }) => Promise<string | null>;

const NON_TRANSLATABLE_FIELDS = new Set([
  'country',
  'postcode',
  'postalCode',
  'zip',
  'phone',
  'agid',
  'aoid',
  'houseNumber',
  'house_number',
  'unit',
  'floor',
  'room',
]);

function compactPostcode(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function hasValue(value: unknown) {
  return clean(value).length > 0;
}

function cleanCountryCode(value: unknown) {
  const code = clean(value).toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : '';
}

const RELIABLE_POSTCODE_AUTOFILL_COUNTRIES = new Set([
  'JP',
  'GB',
  'UK',
  'US',
  'CA',
  'AU',
  'NZ',
  'BR',
  'FR',
  'DE',
  'NL',
  'BE',
  'CH',
  'AT',
  'DK',
  'NO',
  'FI',
  'SE',
  'ES',
  'PT',
  'IT',
  'KR',
  'SG',
]);

export function getPostcodeAutofillMode(countryCode: string): PostcodeAutofillMode {
  const country = cleanCountryCode(countryCode);
  if (!country) return 'manual';
  return RELIABLE_POSTCODE_AUTOFILL_COUNTRIES.has(country) ? 'auto' : 'candidates';
}

export function getPostcodeAutofillModeForCoverage(policy: Pick<AddressCoveragePolicy, 'id'>): PostcodeAutofillMode {
  if (policy.id === 'postal-reliable-api') return 'auto';
  if (policy.id === 'postal-weak-api') return 'candidates';
  return 'manual';
}

function normalizeAgidToken(value: unknown) {
  return clean(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isSupportedCountry(code: string, supportedCountryCodes?: readonly string[]) {
  if (!code) return false;
  if (!supportedCountryCodes?.length) return true;
  const supported = new Set(supportedCountryCodes.map(countryCode => cleanCountryCode(countryCode)).filter(Boolean));
  return supported.has(code);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function compactCoordinate(value: number) {
  return value.toFixed(5).replace(/\.?0+$/, '');
}

function simpleHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function buildAgidRegistrationAutofillCandidate<T extends RegistrationFormRecord>(options: {
  agid?: string;
  decoded?: {
    lat?: number;
    lon?: number;
    prefix?: string;
    bounds?: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
  } | null;
  coords?: { lat: number; lon: number } | null;
  supportedCountryCodes?: readonly string[];
}): RegistrationAssistanceCandidate<T> | null {
  const normalizedAgid = normalizeAgidToken(options.agid);
  const decodedPrefix = cleanCountryCode(options.decoded?.prefix);
  const agidPrefix = cleanCountryCode(normalizedAgid.slice(0, 2));
  const country = [decodedPrefix, agidPrefix].find(code => isSupportedCountry(code, options.supportedCountryCodes)) || '';
  const lat = finiteNumber(options.decoded?.lat) ?? finiteNumber(options.coords?.lat);
  const lon = finiteNumber(options.decoded?.lon) ?? finiteNumber(options.coords?.lon);
  const evidence: string[] = [];
  const patch: Partial<Record<string, string>> = {};

  if (country) {
    patch.country = country;
    evidence.push(`AGID prefix indicates ${country}`);
  }

  if (lat !== null && lon !== null) {
    evidence.push(`Decoded AGID cell near ${compactCoordinate(lat)}, ${compactCoordinate(lon)}`);
  }

  if (!Object.keys(patch).length || !normalizedAgid) return null;

  return {
    id: `agid:${normalizedAgid.slice(0, 12)}`,
    source: 'agid',
    label: 'AGID location hint',
    confidence: country && lat !== null && lon !== null ? 0.74 : 0.62,
    patch,
    evidence,
    requiresUserReview: true,
  };
}

export function buildPostcodeRegistrationAssistanceCandidate<T extends RegistrationFormRecord>(options: {
  countryCode: string;
  postcode: string;
  patch: PostcodeAutofillPatch | null;
  candidateIndex?: number;
  mode?: PostcodeAutofillMode;
}): RegistrationAssistanceCandidate<T> | null {
  if (!options.patch || !Object.values(options.patch).some(Boolean)) return null;
  const country = cleanCountryCode(options.countryCode);
  const postcode = compactPostcode(options.postcode);
  const candidateIndex = typeof options.candidateIndex === 'number' ? options.candidateIndex : null;
  const evidence = Object.entries(options.patch)
    .filter(([, value]) => clean(value))
    .map(([key]) => `Postal source returned ${key}`);
  if (options.mode === 'candidates') {
    evidence.push('Country postal API is treated as assistive candidate data');
  }

  return {
    id: `postcode:${country}:${postcode}${candidateIndex !== null ? `:${candidateIndex + 1}` : ''}`,
    source: 'postcode',
    label: options.mode === 'candidates'
      ? `Postal code candidate ${candidateIndex !== null ? candidateIndex + 1 : 1}`
      : 'Postal code API autofill',
    confidence: options.mode === 'candidates'
      ? (options.patch.city || options.patch.state ? 0.72 : 0.62)
      : (options.patch.city || options.patch.state ? 0.86 : 0.72),
    patch: options.patch,
    evidence,
    requiresUserReview: true,
  };
}

export function formatPostcodeAutofillCandidateLabel(patch: PostcodeAutofillPatch, fallback = 'Postal candidate') {
  const parts = [patch.suburb, patch.city, patch.state]
    .map(value => clean(value))
    .filter(Boolean);
  return parts.length ? parts.join(', ') : fallback;
}

export function mergeRegistrationAssistancePatch<T extends RegistrationFormRecord>(
  formData: T,
  patch: Partial<Record<string, string>>,
  options: { overwrite?: boolean; overwriteFields?: readonly string[] } = {},
): T {
  const merged: RegistrationFormRecord = { ...formData };
  const overwriteFields = new Set(options.overwriteFields || ['country', 'postcode']);
  for (const [key, value] of Object.entries(patch)) {
    if (!value) continue;
    if (options.overwrite || overwriteFields.has(key) || !hasValue(merged[key])) {
      merged[key] = value;
    }
  }
  return merged as T;
}

export function buildRegistrationCorrectionSample<T extends RegistrationFormRecord>(options: {
  before?: T | null;
  after: T;
  assistanceSourceIds?: readonly string[];
  agid?: string;
  addressLanguage?: string;
  now?: Date;
}): RegistrationCorrectionSample | null {
  const before = options.before || {} as T;
  const after = options.after;
  const fields = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
  const changedFields = fields.flatMap(field => {
    if (REGISTRATION_CORRECTION_EXCLUDED_FIELDS.has(field)) return [];
    const beforeValue = clean(before[field]);
    const afterValue = clean(after[field]);
    if (beforeValue === afterValue) return [];
    return [{ field, before: beforeValue, after: afterValue }];
  });

  if (!changedFields.length) return null;

  const createdAt = (options.now || new Date()).toISOString();
  const fingerprint = simpleHash(JSON.stringify({
    createdAt,
    changedFields,
    sourceIds: options.assistanceSourceIds || [],
  }));
  const normalizedAgid = normalizeAgidToken(options.agid);

  return {
    id: `arc_${Date.parse(createdAt).toString(36)}_${fingerprint}`,
    kind: 'address-registration-correction',
    createdAt,
    country: cleanCountryCode(after.country) || cleanCountryCode(before.country),
    addressLanguage: options.addressLanguage,
    agidTail: normalizedAgid ? normalizedAgid.slice(-6) : undefined,
    assistanceSourceIds: Array.from(new Set(options.assistanceSourceIds || [])),
    changedFields,
    excludedFields: Array.from(REGISTRATION_CORRECTION_EXCLUDED_FIELDS),
    storageScope: 'closed-device-local-rl-reference',
    learningPolicy: CLOSED_LEARNING_POLICY,
  };
}

export function appendRegistrationCorrectionSample(
  sample: RegistrationCorrectionSample,
  storage: RegistrationCorrectionStorage | undefined = typeof window === 'undefined' ? undefined : window.localStorage,
  limit = 200,
) {
  if (!storage) return;
  let current: RegistrationCorrectionSample[] = [];
  try {
    const parsed = JSON.parse(storage.getItem(REGISTRATION_CORRECTION_STORAGE_KEY) || '[]');
    current = Array.isArray(parsed) ? parsed : [];
  } catch {
    current = [];
  }
  current.push(sample);
  storage.setItem(REGISTRATION_CORRECTION_STORAGE_KEY, JSON.stringify(current.slice(-limit)));
}

export function listRegistrationCorrectionSamples(
  storage: RegistrationCorrectionStorage | undefined = typeof window === 'undefined' ? undefined : window.localStorage,
  limit = 5,
): RegistrationCorrectionSample[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(REGISTRATION_CORRECTION_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(sample => sample?.kind === 'address-registration-correction')
      .slice(-limit)
      .reverse();
  } catch {
    return [];
  }
}

function scoreRegistrationAssistanceCandidate(candidate: RegistrationAssistanceCandidate) {
  const fieldCount = Object.values(candidate.patch).filter(value => clean(value)).length;
  const evidenceCount = candidate.evidence.filter(Boolean).length;
  const reviewPenalty = candidate.requiresUserReview ? 0.03 : 0;
  return Math.max(0, Math.min(1, candidate.confidence + fieldCount * 0.025 + evidenceCount * 0.01 - reviewPenalty));
}

export function buildRegistrationAssistanceComparison<T extends RegistrationFormRecord>(options: {
  postcodeCandidate?: RegistrationAssistanceCandidate<T> | null;
  agidCandidate?: RegistrationAssistanceCandidate<T> | null;
  appliedSourceIds?: readonly string[];
  feedbackConsent?: boolean;
  qualityDecision?: string;
  qualityReasons?: readonly string[];
}): RegistrationAssistanceComparison {
  const applied = new Set(options.appliedSourceIds || []);
  const candidates = [options.postcodeCandidate, options.agidCandidate]
    .filter((candidate): candidate is RegistrationAssistanceCandidate<T> => Boolean(candidate))
    .map(candidate => {
      const score = scoreRegistrationAssistanceCandidate(candidate);
      return {
        id: candidate.id,
        source: candidate.source,
        label: candidate.label,
        confidence: candidate.confidence,
        fieldCount: Object.values(candidate.patch).filter(value => clean(value)).length,
        evidenceCount: candidate.evidence.filter(Boolean).length,
        applied: applied.has(candidate.id),
        requiresUserReview: candidate.requiresUserReview,
        score,
      };
    })
    .sort((left, right) => right.score - left.score);

  const recommended = candidates[0];
  const hasPostcode = candidates.some(candidate => candidate.source === 'postcode');
  const hasAgid = candidates.some(candidate => candidate.source === 'agid');
  const qualityReasons = Array.from(new Set([
    ...(options.qualityDecision ? [`quality-decision:${options.qualityDecision}`] : []),
    ...(hasPostcode ? ['postal-code-autofill-returned-local-admin-fields'] : []),
    ...(hasAgid ? ['agid-autofill-provides-location-namespace'] : []),
    ...(hasPostcode && hasAgid ? ['both-postcode-and-agid-available'] : []),
    ...(options.feedbackConsent ? ['feedback-consent-local-only-enabled'] : ['feedback-consent-not-enabled']),
    ...(options.qualityReasons || []),
  ]));

  return {
    candidates,
    recommendedSource: recommended?.source || 'none',
    recommendationReason: recommended
      ? `${recommended.label} has the strongest reviewed evidence for this draft.`
      : 'No postal-code or AGID assistance candidate is available yet.',
    qualityReasons,
    feedbackConsent: {
      enabled: Boolean(options.feedbackConsent),
      storageScope: 'closed-device-local-rl-reference',
      externalTransmission: 'blocked',
      canSaveCorrectionHistory: Boolean(options.feedbackConsent),
    },
  };
}

export function buildAddressTranslationFeedbackSample<T extends RegistrationFormRecord>(options: {
  source: T;
  translated: T;
  corrected?: T;
  feedback: AddressTranslationFeedback;
  countryCode?: string;
  sourceLanguage: string;
  targetLanguage: string;
  agid?: string;
  now?: Date;
}): AddressTranslationFeedbackSample | null {
  const source = options.source || {} as T;
  const translated = options.translated || {} as T;
  const corrected = options.corrected || translated;
  const fields = Array.from(new Set([
    ...Object.keys(source),
    ...Object.keys(translated),
    ...Object.keys(corrected),
  ])).sort();

  const feedbackFields = fields.flatMap(field => {
    if (TRANSLATION_FEEDBACK_EXCLUDED_FIELDS.has(field)) return [];
    const sourceText = clean(source[field]);
    const translatedText = clean(translated[field]);
    const correctedText = clean(corrected[field]);
    if (!translatedText && !correctedText) return [];

    if (options.feedback === 'corrected') {
      if (translatedText === correctedText) return [];
      return [{
        field,
        source: sourceText || undefined,
        translated: translatedText,
        corrected: correctedText,
      }];
    }

    if (options.feedback === 'accepted' && sourceText === translatedText) return [];
    return [{
      field,
      source: sourceText || undefined,
      translated: translatedText,
    }];
  });

  if (!feedbackFields.length) return null;

  const createdAt = (options.now || new Date()).toISOString();
  const normalizedAgid = normalizeAgidToken(options.agid);
  const country = cleanCountryCode(options.countryCode)
    || cleanCountryCode(translated.country)
    || cleanCountryCode(source.country);
  const fingerprint = simpleHash(JSON.stringify({
    createdAt,
    feedback: options.feedback,
    sourceLanguage: options.sourceLanguage,
    targetLanguage: options.targetLanguage,
    fields: feedbackFields,
  }));

  return {
    id: `atf_${Date.parse(createdAt).toString(36)}_${fingerprint}`,
    kind: 'address-translation-feedback',
    createdAt,
    country,
    sourceLanguage: normalizeRegistrationAddressLanguage(options.sourceLanguage),
    targetLanguage: normalizeRegistrationAddressLanguage(options.targetLanguage),
    feedback: options.feedback,
    agidTail: normalizedAgid ? normalizedAgid.slice(-6) : undefined,
    fields: feedbackFields,
    excludedFields: Array.from(TRANSLATION_FEEDBACK_EXCLUDED_FIELDS),
    storageScope: 'closed-device-local-rl-reference',
    learningPolicy: CLOSED_LEARNING_POLICY,
  };
}

export function appendAddressTranslationFeedbackSample(
  sample: AddressTranslationFeedbackSample,
  storage: RegistrationCorrectionStorage | undefined = typeof window === 'undefined' ? undefined : window.localStorage,
  limit = 200,
) {
  if (!storage) return;
  let current: AddressTranslationFeedbackSample[] = [];
  try {
    const parsed = JSON.parse(storage.getItem(ADDRESS_TRANSLATION_FEEDBACK_STORAGE_KEY) || '[]');
    current = Array.isArray(parsed) ? parsed : [];
  } catch {
    current = [];
  }
  current.push(sample);
  storage.setItem(ADDRESS_TRANSLATION_FEEDBACK_STORAGE_KEY, JSON.stringify(current.slice(-limit)));
}

export function isPostcodeReadyForAutofill(format: AddressFormatLike | null | undefined, postcode: string) {
  const value = postcode.trim();
  if (!format?.postalCode || !value) return false;

  if (format.postalCode.regex) {
    try {
      const regex = new RegExp(format.postalCode.regex);
      if (regex.test(value) || regex.test(compactPostcode(value))) return true;
    } catch {
      // Fall back to format-length checks below.
    }
  }

  const editableLength = (format.postalCode.format || '').replace(/[^NA?]/g, '').length;
  if (!editableLength) return false;
  return compactPostcode(value).replace(/[^A-Z0-9]/g, '').length >= editableLength;
}

function normalizePostcodePatch(patch: PostcodeAutofillPatch): PostcodeAutofillPatch | null {
  const normalized = Object.fromEntries(
    Object.entries(patch)
      .map(([key, value]) => [key, clean(value)])
      .filter(([, value]) => value),
  ) as PostcodeAutofillPatch;
  return Object.values(normalized).some(Boolean) ? normalized : null;
}

function uniquePostcodePatches(candidates: PostcodeAutofillPatch[]) {
  const seen = new Set<string>();
  const unique: PostcodeAutofillPatch[] = [];
  for (const candidate of candidates) {
    const normalized = normalizePostcodePatch(candidate);
    if (!normalized) continue;
    const key = JSON.stringify([
      normalized.postcode || '',
      normalized.state || '',
      normalized.city || '',
      normalized.suburb || '',
      normalized.street || '',
      normalized.houseNumber || '',
    ]);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(normalized);
  }
  return unique;
}

export function mapPostcodeLookupResponseCandidates(countryCode: string, data: any): PostcodeAutofillPatch[] {
  const country = countryCode.toUpperCase();
  if (!data) return [];

  if (country === 'JP' && Array.isArray(data.results)) {
    return uniquePostcodePatches(data.results.map((result: any) => ({
      postcode: clean(result.zipcode),
      state: clean(result.address1),
      city: clean(result.address2),
      suburb: clean(result.address3),
    })));
  }

  if ((country === 'GB' || country === 'UK') && data.result) {
    const result = data.result;
    return uniquePostcodePatches([{
      postcode: clean(result.postcode),
      state: clean(result.region || result.country),
      city: clean(result.admin_district || result.parish || result.admin_county),
      suburb: clean(result.admin_ward),
    }]);
  }

  if (country === 'CN' && (data.province || data.postcode)) {
    return uniquePostcodePatches([{
      postcode: clean(data.postcode),
      state: clean(data.province),
    }]);
  }

  if (Array.isArray(data.places)) {
    return uniquePostcodePatches(data.places.map((place: any) => ({
      postcode: clean(data['post code'] || data.postcode || data.postalCode),
      city: clean(place['place name'] || place.placeName || place.city),
      state: clean(place.state || place['state abbreviation'] || place.region),
      suburb: clean(place.county || place.district || place.community),
    })));
  }

  const address = data.address || data;
  const patch = {
    postcode: clean(address.postcode || address.postalcode || address.zip),
    state: clean(address.state || address.province || address.region || address.country),
    city: clean(address.city || address.town || address.village || address.municipality),
    suburb: clean(address.suburb || address.neighbourhood || address.district || address.county),
    street: clean(address.road || address.street),
    houseNumber: clean(address.house_number || address.houseNumber),
  };

  return uniquePostcodePatches([patch]);
}

export function mapPostcodeLookupResponse(countryCode: string, data: any): PostcodeAutofillPatch | null {
  return mapPostcodeLookupResponseCandidates(countryCode, data)[0] || null;
}

function getPostcodeLookupEndpoints(countryCode: string, postcode: string) {
  const country = countryCode.toUpperCase();
  const compact = compactPostcode(postcode);
  if (!country || !compact) return [];

  return country === 'JP'
    ? [`/api/jp-postcode?zipcode=${encodeURIComponent(compact)}`]
    : country === 'GB' || country === 'UK'
      ? [`/api/uk-postcode/${encodeURIComponent(compact)}`, `/api/zippopotam/GB/${encodeURIComponent(compact)}`]
      : country === 'CN'
        ? [`/api/cn-postcode?pc=${encodeURIComponent(compact)}`, `/api/zippopotam/CN/${encodeURIComponent(compact)}`]
        : [`/api/zippopotam/${encodeURIComponent(country)}/${encodeURIComponent(compact)}`];
}

export async function lookupPostcodeAutofill(
  countryCode: string,
  postcode: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PostcodeAutofillPatch | null> {
  const country = countryCode.toUpperCase();
  const compact = compactPostcode(postcode);
  if (!country || !compact) return null;

  const candidates = await lookupPostcodeAutofillCandidates(country, compact, fetchImpl);
  return candidates[0] || null;
}

export async function lookupPostcodeAutofillCandidates(
  countryCode: string,
  postcode: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PostcodeAutofillPatch[]> {
  const country = countryCode.toUpperCase();
  const compact = compactPostcode(postcode);
  const endpoints = getPostcodeLookupEndpoints(country, compact);
  if (!endpoints.length) return [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetchImpl(endpoint);
      if (!response.ok) continue;
      const data = await response.json();
      const candidates = mapPostcodeLookupResponseCandidates(country, data);
      if (candidates.length) return candidates;
    } catch {
      // Try the next open-source/postal endpoint.
    }
  }

  return [];
}

export function mergePostcodeAutofill<T extends RegistrationFormRecord>(formData: T, patch: PostcodeAutofillPatch): T {
  const merged: RegistrationFormRecord = { ...formData };
  for (const [key, value] of Object.entries(patch)) {
    if (!value) continue;
    if (key === 'postcode' || !hasValue(merged[key])) {
      merged[key] = value;
    }
  }
  return merged as T;
}

export async function buildPostcodeAutofillLanguageDrafts<T extends RegistrationFormRecord>(options: {
  formData: T;
  patch: PostcodeAutofillPatch;
  countryCode?: string;
  languageTabs: readonly string[];
  translator?: Translator;
}): Promise<Record<string, T>> {
  const countryCode = (options.countryCode || options.formData.country || '').toUpperCase();
  const localDraft = mergePostcodeAutofill(options.formData, options.patch);
  const drafts: Record<string, T> = { local: localDraft };
  const uniqueTabs = Array.from(new Set(options.languageTabs.map(normalizeRegistrationAddressLanguage)));
  const primaryLocalTab = uniqueTabs.find(tabCode => tabCode && tabCode !== 'local' && tabCode !== 'en') || null;

  await Promise.all(uniqueTabs.map(async (tabCode) => {
    if (!tabCode || tabCode === 'local') return;
    if (tabCode === primaryLocalTab) {
      drafts[tabCode] = localDraft;
      return;
    }
    drafts[tabCode] = await translateRegistrationFormFields({
      formData: localDraft,
      targetLanguage: tabCode,
      countryCode,
      sourceLanguage: 'local',
      translator: options.translator,
    });
  }));

  return drafts;
}

async function defaultTranslator(input: { text: string; target: string; source?: string }) {
  const result = await translateWithOpenSource({
    text: input.text,
    target: input.target,
    source: input.source,
    timeoutMs: 1800,
  });
  return result?.translatedText || null;
}

function shouldTranslateField(key: string, value: unknown) {
  if (NON_TRANSLATABLE_FIELDS.has(key)) return false;
  const text = clean(value);
  if (!text) return false;
  if (/^[\d\s\-+/.,#]+$/.test(text)) return false;
  return true;
}

export async function translateRegistrationFormFields<T extends RegistrationFormRecord>(options: {
  formData: T;
  targetLanguage: string;
  countryCode?: string;
  sourceLanguage?: string;
  translator?: Translator;
}): Promise<T> {
  const target = normalizeRegistrationAddressLanguage(options.targetLanguage);
  const countryCode = (options.countryCode || options.formData.country || '').toUpperCase();
  const translated: RegistrationFormRecord = { ...options.formData };
  const eastAsiaProfile = getEastAsiaAddressTranslationProfile(countryCode);
  const southeastAsiaProfile = getSoutheastAsiaAddressTranslationProfile(countryCode);
  const southAsiaProfile = getSouthAsiaAddressTranslationProfile(countryCode);
  const centralAsiaProfile = getCentralAsiaAddressTranslationProfile(countryCode);
  const westAsiaProfile = getWestAsiaAddressTranslationProfile(countryCode);
  const americasProfile = getAmericasAddressTranslationProfile(countryCode);
  const oceaniaProfile = getOceaniaAddressTranslationProfile(countryCode);
  const westernEuropeProfile = getWesternEuropeAddressTranslationProfile(countryCode);
  const southernEuropeProfile = getSouthernEuropeAddressTranslationProfile(countryCode);
  const centralEuropeProfile = getCentralEuropeAddressTranslationProfile(countryCode);
  const northernEuropeProfile = getNorthernEuropeAddressTranslationProfile(countryCode);
  const easternEuropeProfile = getEasternEuropeAddressTranslationProfile(countryCode);
  const eastAfricaProfile = getEastAfricaAddressTranslationProfile(countryCode);
  const southernAfricaProfile = getSouthernAfricaAddressTranslationProfile(countryCode);
  const centralAfricaProfile = getCentralAfricaAddressTranslationProfile(countryCode);
  const westAfricaProfile = getWestAfricaAddressTranslationProfile(countryCode);

  if (target === 'local') return translated as T;

  const translator = options.translator || defaultTranslator;
  const hasCustomTranslator = Boolean(options.translator);

  await Promise.all(Object.entries(options.formData).map(async ([key, value]) => {
    if (!shouldTranslateField(key, value)) return;
    const text = clean(value);

    if (shouldUseOpenSourceTranslationBeforeLocalFallback({
      hasCustomTranslator,
      fieldKey: key,
      text,
      sourceLanguage: options.sourceLanguage,
      targetLanguage: target,
    })) {
      const openSourceTranslated = await translator({
        text,
        target,
        source: options.sourceLanguage,
      });
      if (openSourceTranslated?.trim()) {
        translated[key] = openSourceTranslated.trim();
        return;
      }
    }

    if (eastAsiaProfile) {
      const eastAsiaTranslated = await translateEastAsiaAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (eastAsiaTranslated?.text.trim()) {
        translated[key] = eastAsiaTranslated.text.trim();
      }
      return;
    }

    if (southeastAsiaProfile) {
      const southeastAsiaTranslated = await translateSoutheastAsiaAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (southeastAsiaTranslated?.text.trim()) {
        translated[key] = southeastAsiaTranslated.text.trim();
      }
      return;
    }

    if (southAsiaProfile) {
      const southAsiaTranslated = await translateSouthAsiaAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (southAsiaTranslated?.text.trim()) {
        translated[key] = southAsiaTranslated.text.trim();
      }
      return;
    }

    if (centralAsiaProfile) {
      const centralAsiaTranslated = await translateCentralAsiaAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (centralAsiaTranslated?.text.trim()) {
        translated[key] = centralAsiaTranslated.text.trim();
      }
      return;
    }

    if (westAsiaProfile) {
      const westAsiaTranslated = await translateWestAsiaAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (westAsiaTranslated?.text.trim()) {
        translated[key] = westAsiaTranslated.text.trim();
      }
      return;
    }

    if (americasProfile) {
      const americasTranslated = await translateAmericasAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (americasTranslated?.text.trim()) {
        translated[key] = americasTranslated.text.trim();
      }
      return;
    }

    if (oceaniaProfile) {
      const oceaniaTranslated = await translateOceaniaAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (oceaniaTranslated?.text.trim()) {
        translated[key] = oceaniaTranslated.text.trim();
      }
      return;
    }

    if (westernEuropeProfile) {
      const westernEuropeTranslated = await translateWesternEuropeAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (westernEuropeTranslated?.text.trim()) {
        translated[key] = westernEuropeTranslated.text.trim();
      }
      return;
    }

    if (southernEuropeProfile) {
      const southernEuropeTranslated = await translateSouthernEuropeAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (southernEuropeTranslated?.text.trim()) {
        translated[key] = southernEuropeTranslated.text.trim();
      }
      return;
    }

    if (centralEuropeProfile) {
      const centralEuropeTranslated = await translateCentralEuropeAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (centralEuropeTranslated?.text.trim()) {
        translated[key] = centralEuropeTranslated.text.trim();
      }
      return;
    }

    if (northernEuropeProfile) {
      const northernEuropeTranslated = await translateNorthernEuropeAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (northernEuropeTranslated?.text.trim()) {
        translated[key] = northernEuropeTranslated.text.trim();
      }
      return;
    }

    if (easternEuropeProfile) {
      const easternEuropeTranslated = await translateEasternEuropeAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (easternEuropeTranslated?.text.trim()) {
        translated[key] = easternEuropeTranslated.text.trim();
      }
      return;
    }

    if (eastAfricaProfile) {
      const eastAfricaTranslated = await translateEastAfricaAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (eastAfricaTranslated?.text.trim()) {
        translated[key] = eastAfricaTranslated.text.trim();
      }
      return;
    }

    if (southernAfricaProfile) {
      const southernAfricaTranslated = await translateSouthernAfricaAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (southernAfricaTranslated?.text.trim()) {
        translated[key] = southernAfricaTranslated.text.trim();
      }
      return;
    }

    if (centralAfricaProfile) {
      const centralAfricaTranslated = await translateCentralAfricaAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (centralAfricaTranslated?.text.trim()) {
        translated[key] = centralAfricaTranslated.text.trim();
      }
      return;
    }

    if (westAfricaProfile) {
      const westAfricaTranslated = await translateWestAfricaAddressField({
        countryCode,
        fieldKey: key,
        text,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: target,
        translator,
      });
      if (westAfricaTranslated?.text.trim()) {
        translated[key] = westAfricaTranslated.text.trim();
      }
      return;
    }

    if (target === 'en' || target === 'en_domestic') {
      const english = normalizeEnglishAddressModeField({
        countryCode,
        fieldKey: key,
        text,
        mode: target === 'en_domestic' ? 'domestic' : 'international-shipping',
      });
      if (english) translated[key] = english;
      return;
    }

    const machineTranslated = await translator({
      text,
      target,
      source: options.sourceLanguage,
    });
    if (machineTranslated?.trim()) {
      translated[key] = machineTranslated.trim();
    }
  }));

  return translated as T;
}
