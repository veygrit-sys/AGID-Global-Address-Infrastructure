import { parseAddressText, type CanonicalAddressParts } from './addressIntelligence';
import {
  classifyAddressCoveragePolicy,
  hasAddressPostalCodeMetadata,
} from './addressCoveragePolicy';
import {
  validateAddressWithOpenSourceRules,
  type AddressValidationResult,
} from './addressValidation';
import {
  matchOpenAddressesReference,
  type AddressReferenceMatch,
  type OpenAddressesRecord,
} from './openAddressesReference';
import {
  classifyPostalSourceTrust,
  getPreferredPostalSourceIdsForCountry,
  isPostalReferenceDataSource,
  type PostalSourceTrustTier,
} from './officialPostalSourceCatalog';
import {
  buildAddressDataLoadPlan,
  type AddressDataLoadPlan,
  type AddressDataLoadPlanOptions,
} from './addressDataLoadPlan';
import {
  buildAddressSystemConnectionPlan,
  type AddressSystemConnectionInput,
  type AddressSystemConnectionPlan,
} from './addressSystemConnection';
import {
  buildAddressStandardLibraryResolution,
  type AddressStandardLibraryResolution,
  type AddressStandardLibraryResolutionInput,
} from './addressStandardLibraryResolver';
import {
  buildAfricaGeographicValidationPlan,
  type AfricaGeographicValidationPlan,
} from './africaGeographicValidationPlan';
import {
  buildAsiaGeographicValidationPlan,
  type AsiaGeographicValidationPlan,
} from './asiaGeographicValidationPlan';
import {
  buildOceaniaGeographicValidationPlan,
  type OceaniaGeographicValidationPlan,
} from './oceaniaGeographicValidationPlan';
import {
  buildEuropeGeographicValidationPlan,
  type EuropeGeographicValidationPlan,
} from './europeGeographicValidationPlan';
import {
  buildAmericasGeographicValidationPlan,
  type AmericasGeographicValidationPlan,
} from './americasGeographicValidationPlan';
import type { PostalSourceValidationReadinessEvidence } from './postalSourceReadinessAdapter';
import type { CountryGeographicMetadataReadinessEvidence } from './countryGeographicMetadataEvaluationIndex';

export const ADDRESS_VERIFICATION_ENGINE_VERSION = 'address-verification-engine-v1';

export type AddressVerificationScope = 'postal' | 'address';

export type AddressVerificationStatus =
  | 'verified'
  | 'partial'
  | 'unresolved'
  | 'unsupported_country'
  | 'country_mismatch';

export type PostalVerificationMode =
  | 'none'
  | 'format-only'
  | 'format-and-lookup'
  | 'geo-only'
  | 'manual';

export type PostalEvidenceStrength = 'none' | 'weak' | 'strong';

export type AddressReferenceEvidence = 'not-provided' | 'matched' | 'not-matched';

export type AddressVerificationField =
  | 'country'
  | 'country_code'
  | 'postcode'
  | 'state'
  | 'city'
  | 'district'
  | 'subdistrict'
  | 'suburb'
  | 'road'
  | 'house_number'
  | 'building'
  | 'poi'
  | 'plus_code';

export type AddressVerificationTargetCountryPolicy = {
  countryCode: string;
  enabled: boolean;
  label: string;
  postalMode: PostalVerificationMode;
  postcodeRegex?: string;
  postcodeFormat?: string;
  requiredFields: AddressVerificationField[];
  lookupSources: string[];
  notes: string[];
};

export type AddressVerificationFormatLike = {
  countryCode?: string;
  name?: string;
  native?: {
    addressFormat?: string;
    fields?: Array<{ key: string; label?: string; required?: boolean }>;
  };
  english?: {
    addressFormat?: string;
    fields?: Array<{ key: string; label?: string; required?: boolean }>;
  };
  postalCode?: {
    regex?: string | null;
    source?: string | null;
    api?: string | null;
    format?: string | null;
  };
  openSourceIds?: string[];
  addressRules?: {
    openSourceIds?: string[];
    postalCode?: {
      label?: string;
      required?: boolean;
      usage?: 'required' | 'recommended' | 'used' | 'partial' | 'optional' | string;
    } | null;
  };
};

export type PostalEvidenceCandidate = {
  source: string;
  sourceId?: string;
  url?: string;
  countryCode?: string;
  postalCode?: string;
  postcode?: string;
  state?: string;
  city?: string;
  district?: string;
  subdistrict?: string;
  suburb?: string;
  lat?: number;
  lon?: number;
  confidence?: number;
};

export type PostalEvidenceSourceReadiness = 'not-provided' | 'eligible' | 'blocked';

export type AddressVerificationEngineInput = {
  countryCode?: string;
  targetCountries?: string[];
  address?: CanonicalAddressParts;
  addressText?: string;
  postalCode?: string;
  scope?: AddressVerificationScope;
  format?: AddressVerificationFormatLike | null;
  countryPolicies?: Record<string, AddressVerificationTargetCountryPolicy>;
  postalEvidence?: PostalEvidenceCandidate[];
  postalSourceReadiness?: PostalSourceValidationReadinessEvidence[];
  geographicMetadataReadiness?: CountryGeographicMetadataReadinessEvidence[];
  referenceRecords?: OpenAddressesRecord[];
  sources?: string[];
  allowFallbackCountryFromAddress?: boolean;
  dataLoad?: Pick<
    AddressDataLoadPlanOptions,
    'allowCredentialedSources' | 'includeGlobalFallbacks' | 'preloadOfficialBulk' | 'maxBlockingSources'
  >;
  standardLibrary?: Pick<
    AddressStandardLibraryResolutionInput,
    | 'sourceLanguage'
    | 'targetLanguage'
    | 'hasCustomTranslator'
    | 'hasCoordinates'
    | 'needsNaturalGeographyContext'
    | 'sparseOrRemoteArea'
    | 'libpostalEndpointConfigured'
  >;
  systemConnection?: Pick<
    AddressSystemConnectionInput,
    'hasCoordinates' | 'hasAgid' | 'hasAoid' | 'hasLineageEvidence' | 'purpose'
  >;
};

export type AddressVerificationAuditStep = {
  step:
    | 'target-country'
    | 'data-load-plan'
    | 'africa-geography'
    | 'asia-geography'
    | 'oceania-geography'
    | 'europe-geography'
    | 'americas-geography'
    | 'regional-geography'
    | 'synthetic-geographic-metadata'
    | 'standard-library-resolution'
    | 'postal-format'
    | 'postal-evidence'
    | 'address-reference'
    | 'address-rules'
    | 'final-decision';
  status: 'ok' | 'warning' | 'failed' | 'skipped';
  message: string;
  source?: string;
};

export type AddressVerificationEvidenceSummary = {
  postalStrength: PostalEvidenceStrength;
  postalSourceTrust: PostalSourceTrustTier;
  postalSourceCatalogMatches: string[];
  sourceValidationReadiness: PostalEvidenceSourceReadiness;
  lookupSatisfied: boolean;
  addressReference: AddressReferenceEvidence;
  strongPostalEvidence?: PostalEvidenceCandidate;
  weakPostalEvidence?: PostalEvidenceCandidate;
  referenceMatch?: AddressReferenceMatch;
};

export type AddressVerificationEvidenceGrade =
  | 'authoritative'
  | 'official'
  | 'official-derived'
  | 'open-reference'
  | 'community'
  | 'format-only'
  | 'none';

export type AddressVerificationDepth =
  | 'format'
  | 'postal-code'
  | 'locality'
  | 'street'
  | 'house'
  | 'building'
  | 'delivery-point'
  | 'geo-only';

export type AddressVerificationReadiness =
  | 'paid-grade-for-supplied-evidence'
  | 'strong-open-verification'
  | 'partial-open-verification'
  | 'format-only'
  | 'manual-review-required';

export type AddressVerificationQualitySummary = {
  freeOnly: boolean;
  evidenceGrade: AddressVerificationEvidenceGrade;
  depth: AddressVerificationDepth;
  readiness: AddressVerificationReadiness;
  paidApiParityClaimed: boolean;
  comparableFor: string[];
  limitations: string[];
  upgradeActions: string[];
};

export type GeographicValidationRegion =
  | 'africa'
  | 'asia'
  | 'oceania'
  | 'europe'
  | 'americas';

export type GeographicRegionScopeStatus =
  | 'not-covered'
  | 'unambiguous'
  | 'ambiguous';

export type GeographicRegionPlanMatch = {
  region: GeographicValidationRegion;
  countryCode: string;
  planVersion: string;
  metadataSourcePathCount: number;
};

export type AddressVerificationGeographicRegionScope = {
  status: GeographicRegionScopeStatus;
  matches: GeographicRegionPlanMatch[];
  nonClaims: string[];
};

export type AddressVerificationGeographicMetadataReadiness = {
  countryCode: string;
  sources: CountryGeographicMetadataReadinessEvidence[];
  syntheticAdministrativeEvaluationEligible: boolean;
  deliveryClaimsEnabled: false;
  nonClaims: string[];
};

export type AddressVerificationEngineResult = {
  engineVersion: string;
  status: AddressVerificationStatus;
  scope: AddressVerificationScope;
  score: number;
  country: {
    requested: string | null;
    resolved: string | null;
    targetCountries: string[];
    targetAllowed: boolean;
    supported: boolean;
    policy?: AddressVerificationTargetCountryPolicy;
  };
  postal: {
    input: string;
    normalized: string;
    required: boolean;
    supported: boolean;
    formatValid: boolean | null;
    mode: PostalVerificationMode;
    evidence: 'matched' | 'not-provided' | 'not-matched' | 'not-required';
    strength: PostalEvidenceStrength;
    matchedEvidence?: PostalEvidenceCandidate;
    lookupRequired: boolean;
    lookupSatisfied: boolean;
  };
  evidence: AddressVerificationEvidenceSummary;
  quality: AddressVerificationQualitySummary;
  canonicalAddress: CanonicalAddressParts;
  dataLoading: AddressDataLoadPlan;
  standardLibrary: AddressStandardLibraryResolution;
  geographicRegionScope: AddressVerificationGeographicRegionScope;
  geographicMetadataReadiness: AddressVerificationGeographicMetadataReadiness;
  africaGeography?: AfricaGeographicValidationPlan;
  asiaGeography?: AsiaGeographicValidationPlan;
  oceaniaGeography?: OceaniaGeographicValidationPlan;
  europeGeography?: EuropeGeographicValidationPlan;
  americasGeography?: AmericasGeographicValidationPlan;
  systemConnection: AddressSystemConnectionPlan;
  validation: AddressValidationResult;
  warnings: string[];
  nextActions: string[];
  sources: string[];
  audit: AddressVerificationAuditStep[];
};

type AddressValidationFormat = NonNullable<Parameters<typeof validateAddressWithOpenSourceRules>[1]>;
type AddressValidationPostalUsage = 'required' | 'recommended' | 'used' | 'partial' | 'optional';

const COMMON_REQUIRED_ADDRESS_FIELDS: AddressVerificationField[] = ['country_code', 'postcode', 'city'];

const STRONG_POSTAL_EVIDENCE_PATTERNS = [
  /japan-post|japan postcode|zipcloud/i,
  /usps|u\.s\. census|census geocoder/i,
  /postcodes-io|royal mail/i,
  /viacep|brasilapi/i,
  /data\.gouv|la poste/i,
  /openplz/i,
  /one ?map|onemap/i,
  /ctt|eurostat-gisco/i,
  /auspost|australia post/i,
  /canada-post|canada post/i,
  /correos/i,
  /pdok|bag/i,
  /official|government|national-address|national address/i,
];

const WEAK_POSTAL_EVIDENCE_PATTERNS = [
  /zippopotam/i,
  /geonames/i,
  /datahub/i,
  /postal-codes-json/i,
  /postalcodes\.info/i,
  /regional table/i,
  /candidate/i,
];

const VALIDATION_POSTAL_USAGES = ['required', 'recommended', 'used', 'partial', 'optional'] as const;
const METADATA_SOURCE_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,127}$/;

export const DEFAULT_ADDRESS_VERIFICATION_TARGET_POLICIES: Record<string, AddressVerificationTargetCountryPolicy> = {
  JP: {
    countryCode: 'JP',
    enabled: true,
    label: 'Japan',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{3}-?\\d{4}$',
    postcodeFormat: 'NNN-NNNN',
    requiredFields: ['country_code', 'postcode', 'state', 'city'],
    lookupSources: ['japan-postcode-api', 'zipcloud'],
    notes: ['Postal-code lookup can verify prefecture and municipality candidates.'],
  },
  US: {
    countryCode: 'US',
    enabled: true,
    label: 'United States',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{5}(?:-\\d{4})?$',
    postcodeFormat: 'NNNNN(-NNNN)',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['usps', 'u.s. census', 'zippopotam'],
    notes: ['ZIP format alone is not a deliverability guarantee.'],
  },
  GB: {
    countryCode: 'GB',
    enabled: true,
    label: 'United Kingdom',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^[A-Z]{1,2}\\d[A-Z\\d]?\\s*\\d[A-Z]{2}$',
    postcodeFormat: 'AA9A 9AA',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['postcodes-io', 'zippopotam'],
    notes: ['Postcode lookup can verify locality candidates.'],
  },
  CA: {
    countryCode: 'CA',
    enabled: true,
    label: 'Canada',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d$',
    postcodeFormat: 'ANA NAN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['canada-post', 'zippopotam'],
    notes: ['Canadian postal codes need locality evidence before strong verification.'],
  },
  BR: {
    countryCode: 'BR',
    enabled: true,
    label: 'Brazil',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{5}-?\\d{3}$',
    postcodeFormat: 'NNNNN-NNN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['viacep', 'brasilapi'],
    notes: ['CEP lookup can return city, state, district, and street candidates.'],
  },
  IN: {
    countryCode: 'IN',
    enabled: true,
    label: 'India',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{6}$',
    postcodeFormat: 'NNNNNN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['postalpincode-in', 'geonames-postal'],
    notes: ['PIN code narrows the post office area; full delivery still needs address fields.'],
  },
  SG: {
    countryCode: 'SG',
    enabled: true,
    label: 'Singapore',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{6}$',
    postcodeFormat: 'NNNNNN',
    requiredFields: ['country_code', 'postcode', 'building'],
    lookupSources: ['one-map', 'zippopotam'],
    notes: ['Singapore postal codes can be building-level when matched with official evidence.'],
  },
  CN: {
    countryCode: 'CN',
    enabled: true,
    label: 'China',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{6}$',
    postcodeFormat: 'NNNNNN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['cn-postcode', 'osm-nominatim'],
    notes: ['Use province/city evidence before treating a postcode as address verification.'],
  },
  KR: {
    countryCode: 'KR',
    enabled: true,
    label: 'South Korea',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{5}$',
    postcodeFormat: 'NNNNN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['korea-postcode', 'geonames-postal'],
    notes: ['Road-name and parcel-address evidence should be checked separately.'],
  },
  FR: {
    countryCode: 'FR',
    enabled: true,
    label: 'France',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{5}$',
    postcodeFormat: 'NNNNN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['data.gouv', 'la poste', 'zippopotam'],
    notes: ['Use BAN/Data.gouv address evidence for full-address verification.'],
  },
  DE: {
    countryCode: 'DE',
    enabled: true,
    label: 'Germany',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{5}$',
    postcodeFormat: 'NNNNN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['openplz', 'zippopotam'],
    notes: ['Postal-code format is broad; city evidence is required.'],
  },
  IT: {
    countryCode: 'IT',
    enabled: true,
    label: 'Italy',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{5}$',
    postcodeFormat: 'NNNNN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['datahub-postal', 'geonames-postal'],
    notes: ['CAP validation remains partial without locality evidence.'],
  },
  ES: {
    countryCode: 'ES',
    enabled: true,
    label: 'Spain',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{5}$',
    postcodeFormat: 'NNNNN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['correos', 'catastro', 'zippopotam'],
    notes: ['Use municipality or cadastre evidence for strong verification.'],
  },
  NL: {
    countryCode: 'NL',
    enabled: true,
    label: 'Netherlands',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{4}\\s?[A-Z]{2}$',
    postcodeFormat: 'NNNN AA',
    requiredFields: ['country_code', 'postcode', 'road', 'house_number'],
    lookupSources: ['pdok', 'bag', 'zippopotam'],
    notes: ['Full verification should combine postcode with house number.'],
  },
  AU: {
    countryCode: 'AU',
    enabled: true,
    label: 'Australia',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{4}$',
    postcodeFormat: 'NNNN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['auspost', 'geonames-postal'],
    notes: ['State and suburb evidence should be checked against the postcode.'],
  },
  NZ: {
    countryCode: 'NZ',
    enabled: true,
    label: 'New Zealand',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{4}$',
    postcodeFormat: 'NNNN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['nz-post', 'geonames-postal'],
    notes: ['Use local delivery-round evidence before strong verification.'],
  },
  ZA: {
    countryCode: 'ZA',
    enabled: true,
    label: 'South Africa',
    postalMode: 'format-and-lookup',
    postcodeRegex: '^\\d{4}$',
    postcodeFormat: 'NNNN',
    requiredFields: COMMON_REQUIRED_ADDRESS_FIELDS,
    lookupSources: ['geonames-postal', 'zippopotam'],
    notes: ['Postal-code match remains partial unless locality evidence agrees.'],
  },
  HK: {
    countryCode: 'HK',
    enabled: true,
    label: 'Hong Kong',
    postalMode: 'geo-only',
    requiredFields: ['country_code', 'district', 'road'],
    lookupSources: ['hk-csdi', 'hk-als', 'osm-nominatim'],
    notes: ['Normal postal codes are not used; verify with district, street, building, and coordinates.'],
  },
  MO: {
    countryCode: 'MO',
    enabled: true,
    label: 'Macau',
    postalMode: 'geo-only',
    requiredFields: ['country_code', 'district', 'road'],
    lookupSources: ['osm-nominatim', 'open-geodata'],
    notes: ['Normal postal codes are not used; use geography and street/building evidence.'],
  },
  AE: {
    countryCode: 'AE',
    enabled: true,
    label: 'United Arab Emirates',
    postalMode: 'geo-only',
    requiredFields: ['country_code', 'city', 'road'],
    lookupSources: ['osm-nominatim', 'open-geodata'],
    notes: ['P.O. Box and local addressing are common; do not require a normal postcode.'],
  },
  QA: {
    countryCode: 'QA',
    enabled: true,
    label: 'Qatar',
    postalMode: 'geo-only',
    requiredFields: ['country_code', 'city', 'road'],
    lookupSources: ['osm-nominatim', 'open-geodata'],
    notes: ['Building-zone-street addressing is more important than a normal postcode.'],
  },
  AQ: {
    countryCode: 'AQ',
    enabled: true,
    label: 'Antarctica',
    postalMode: 'geo-only',
    requiredFields: ['country_code', 'poi'],
    lookupSources: ['antarctic-research-stations', 'osm-nominatim', 'space-agency-open-geodata'],
    notes: ['Station and natural-feature evidence should carry address-like verification.'],
  },
};

export const DEFAULT_ADDRESS_VERIFICATION_TARGET_COUNTRIES = Object.keys(
  DEFAULT_ADDRESS_VERIFICATION_TARGET_POLICIES,
).sort();

const clean = (value: unknown) => String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();

function normalizeCountryCode(value: unknown) {
  const normalized = clean(value).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  return normalized === 'UK' ? 'GB' : normalized;
}

function normalizePostcode(value: unknown) {
  return clean(value).toUpperCase().replace(/\s+/g, ' ');
}

function postcodeKey(value: unknown) {
  return normalizePostcode(value).replace(/[\s-]/g, '');
}

function sourceMatches(values: Array<string | null | undefined>, patterns: RegExp[]) {
  return values.map(clean).filter(Boolean).some(value => patterns.some(pattern => pattern.test(value)));
}

function normalizeTextKey(value: unknown) {
  return clean(value).toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '');
}

function hasNonAscii(value: string) {
  return /[^\x00-\x7F]/.test(value);
}

function valuesConflict(left: unknown, right: unknown) {
  const leftText = clean(left);
  const rightText = clean(right);
  if (!leftText || !rightText) return false;
  if (hasNonAscii(leftText) || hasNonAscii(rightText)) return false;

  const leftKey = normalizeTextKey(leftText);
  const rightKey = normalizeTextKey(rightText);
  if (!leftKey || !rightKey) return false;
  return leftKey !== rightKey && !leftKey.includes(rightKey) && !rightKey.includes(leftKey);
}

function withPreferredPostalSources(policy: AddressVerificationTargetCountryPolicy | null) {
  if (!policy) return null;
  const preferred = getPreferredPostalSourceIdsForCountry(policy.countryCode);
  if (!preferred.length) return policy;
  return {
    ...policy,
    lookupSources: unique([...policy.lookupSources, ...preferred]),
  };
}

function countryPolicyFor(countryCode: string, customPolicies?: Record<string, AddressVerificationTargetCountryPolicy>) {
  return withPreferredPostalSources(customPolicies?.[countryCode] || DEFAULT_ADDRESS_VERIFICATION_TARGET_POLICIES[countryCode] || null);
}

function formatLookupSources(format: AddressVerificationFormatLike | null | undefined) {
  return unique([
    format?.postalCode?.source,
    format?.postalCode?.api,
    ...(format?.openSourceIds || []),
    ...(format?.addressRules?.openSourceIds || []),
  ]);
}

function addressFieldFromFormatKey(key: string): AddressVerificationField | null {
  const normalized = clean(key);
  if (!normalized) return null;
  const map: Record<string, AddressVerificationField> = {
    country: 'country',
    countryCode: 'country_code',
    country_code: 'country_code',
    postcode: 'postcode',
    postalCode: 'postcode',
    zip: 'postcode',
    state: 'state',
    province: 'state',
    region: 'state',
    city: 'city',
    locality: 'city',
    municipality: 'city',
    district: 'district',
    county: 'district',
    subdistrict: 'subdistrict',
    suburb: 'suburb',
    street: 'road',
    road: 'road',
    houseNumber: 'house_number',
    house_number: 'house_number',
    building: 'building',
    organization: 'building',
    poi: 'poi',
    plusCode: 'plus_code',
    plus_code: 'plus_code',
  };
  return map[normalized] || null;
}

function requiredFieldsFromFormat(format: AddressVerificationFormatLike, hasPostalCode: boolean): AddressVerificationField[] {
  const requiredFromNative = (format.native?.fields || [])
    .filter(field => field.required)
    .map(field => addressFieldFromFormatKey(field.key))
    .filter(Boolean) as AddressVerificationField[];
  const requiredFromEnglish = (format.english?.fields || [])
    .filter(field => field.required)
    .map(field => addressFieldFromFormatKey(field.key))
    .filter(Boolean) as AddressVerificationField[];
  const required = unique([
    'country_code',
    ...(hasPostalCode ? ['postcode'] : []),
    ...requiredFromNative,
    ...requiredFromEnglish,
  ]) as AddressVerificationField[];
  return required.length
    ? required
    : hasPostalCode
      ? COMMON_REQUIRED_ADDRESS_FIELDS
      : ['country_code', 'city'];
}

function policyFromFormat(
  format: AddressVerificationFormatLike | null | undefined,
  countryCode: string,
): AddressVerificationTargetCountryPolicy | null {
  if (!format) return null;
  const code = normalizeCountryCode(countryCode || format.countryCode);
  if (!code) return null;

  const coverage = classifyAddressCoveragePolicy(format);
  const hasPostalCode = hasAddressPostalCodeMetadata(format);
  const lookupSources = formatLookupSources(format);
  const postalMode: PostalVerificationMode = hasPostalCode
    ? 'format-and-lookup'
    : coverage.id === 'no-postal-strong-geo'
      ? 'geo-only'
      : 'manual';

  return {
    countryCode: code,
    enabled: true,
    label: clean(format.name) || code,
    postalMode,
    postcodeRegex: format.postalCode?.regex || undefined,
    postcodeFormat: format.postalCode?.format || undefined,
    requiredFields: requiredFieldsFromFormat(format, hasPostalCode),
    lookupSources: unique([...lookupSources, ...getPreferredPostalSourceIdsForCountry(code)]),
    notes: [
      `Derived from caller supplied address format (${coverage.id}).`,
      hasPostalCode
        ? 'Postal-code format is partial until trusted postal or address-reference evidence matches.'
        : 'No normal postal-code requirement was detected from the supplied format.',
    ],
  };
}

function inferCountryCode(input: AddressVerificationEngineInput) {
  const explicit = normalizeCountryCode(input.countryCode);
  if (explicit) return explicit;

  const fromAddress = normalizeCountryCode(input.address?.country_code);
  if (fromAddress) return fromAddress;

  const targetCountries = (input.targetCountries || []).map(normalizeCountryCode).filter(Boolean);
  if (targetCountries.length === 1) return targetCountries[0];

  if (input.allowFallbackCountryFromAddress !== false) {
    const parsed = parseAddressText(input.addressText || '');
    return normalizeCountryCode(parsed.country_code);
  }

  return '';
}

function buildCanonicalAddress(input: AddressVerificationEngineInput, resolvedCountryCode: string): CanonicalAddressParts {
  const parsed = parseAddressText(input.addressText || '');
  const canonical: CanonicalAddressParts = {
    ...parsed,
    ...(input.address || {}),
  };
  if (resolvedCountryCode) canonical.country_code = resolvedCountryCode;
  const postcode = normalizePostcode(input.postalCode || canonical.postcode);
  if (postcode) canonical.postcode = postcode;
  return canonical;
}

function policyFormat(policy: AddressVerificationTargetCountryPolicy | null): AddressVerificationFormatLike | null {
  if (!policy) return null;
  return {
    countryCode: policy.countryCode,
    name: policy.label,
    native: {
      addressFormat: policy.postalMode === 'geo-only'
        ? '{{poi}}\n{{road}}\n{{district}}\n{{city}}\n{{country}}'
        : '{{postcode}}\n{{city}}\n{{road}} {{houseNumber}}\n{{country}}',
      fields: policy.requiredFields.map(field => ({
        key: field === 'road' ? 'street' : field === 'house_number' ? 'houseNumber' : field,
        required: true,
      })),
    },
    postalCode: policy.postcodeRegex
      ? {
          regex: policy.postcodeRegex,
          format: policy.postcodeFormat || null,
          api: null,
          source: 'agid-country-postal-format-policy',
        }
      : undefined,
    addressRules: {
      openSourceIds: ['agid-address-verification-engine', ...policy.lookupSources],
      postalCode: policy.postalMode === 'geo-only' || policy.postalMode === 'none'
        ? null
        : {
            label: 'Postal code',
            required: true,
            usage: 'required',
          },
    },
  };
}

function formatRegex(format: AddressVerificationFormatLike | null | undefined, policy: AddressVerificationTargetCountryPolicy | null) {
  return format?.postalCode?.regex || policy?.postcodeRegex || null;
}

function checkPostcodeFormat(postcode: string, regex: string | null) {
  if (!postcode || !regex) return null;
  try {
    const pattern = new RegExp(regex, 'i');
    return pattern.test(postcode) || pattern.test(postcodeKey(postcode));
  } catch {
    return null;
  }
}

function postalRequired(format: AddressVerificationFormatLike | null | undefined, policy: AddressVerificationTargetCountryPolicy | null) {
  if (format?.addressRules?.postalCode === null) return false;
  if (format?.addressRules?.postalCode?.required) return true;
  if (policy?.postalMode === 'geo-only' || policy?.postalMode === 'none') return false;
  return Boolean(format?.postalCode?.regex || policy?.postcodeRegex);
}

function normalizePostalUsage(usage: unknown): AddressValidationPostalUsage | undefined {
  const normalized = clean(usage);
  return VALIDATION_POSTAL_USAGES.includes(normalized as any)
    ? normalized as AddressValidationPostalUsage
    : undefined;
}

function toValidationFormat(format: AddressVerificationFormatLike | null | undefined): AddressValidationFormat | null {
  if (!format) return null;
  const postalRule = format.addressRules?.postalCode;
  return {
    ...format,
    native: format.native
      ? {
          ...format.native,
          addressFormat: format.native.addressFormat || '',
        }
      : undefined,
    english: format.english
      ? {
          ...format.english,
          addressFormat: format.english.addressFormat || '',
        }
      : undefined,
    postalCode: format.postalCode
      ? {
          ...format.postalCode,
          source: format.postalCode.source || undefined,
        }
      : undefined,
    addressRules: format.addressRules
      ? {
          ...format.addressRules,
          postalCode: postalRule === null
            ? null
            : postalRule
              ? {
                  ...postalRule,
                  usage: normalizePostalUsage(postalRule.usage),
                }
              : undefined,
        }
      : undefined,
  };
}

function evidenceMatchesAddress(evidence: PostalEvidenceCandidate, address: CanonicalAddressParts, countryCode: string) {
  const evidenceCountry = normalizeCountryCode(evidence.countryCode || countryCode);
  if (countryCode && evidenceCountry && evidenceCountry !== countryCode) return false;

  const evidencePostcode = postcodeKey(evidence.postalCode || evidence.postcode);
  const addressPostcode = postcodeKey(address.postcode);
  if (addressPostcode && evidencePostcode && evidencePostcode !== addressPostcode) return false;
  const postcodeMatched = Boolean(addressPostcode && evidencePostcode && addressPostcode === evidencePostcode);

  const comparableFields: Array<keyof PostalEvidenceCandidate & keyof CanonicalAddressParts> = [
    'state',
    'city',
    'district',
    'subdistrict',
    'suburb',
  ];
  return comparableFields.every(field => {
    if (!valuesConflict(address[field], evidence[field])) return true;
    if (field === 'state' && postcodeMatched) {
      const left = normalizeTextKey(address[field]);
      const right = normalizeTextKey(evidence[field]);
      return left.length <= 3 || right.length <= 3;
    }
    return false;
  });
}

function postalEvidenceStrength(
  evidence: PostalEvidenceCandidate | null,
  format: AddressVerificationFormatLike | null | undefined,
  policy: AddressVerificationTargetCountryPolicy | null,
  sourceValidationReadiness: PostalEvidenceSourceReadiness,
): PostalEvidenceStrength {
  if (!evidence) return 'none';
  const source = clean(evidence.source);
  if (!source) return 'weak';
  const catalog = classifyPostalSourceTrust({
    countryCode: evidence.countryCode || policy?.countryCode || format?.countryCode,
    source,
    url: evidence.url,
    sourceIds: unique([evidence.sourceId]),
  });
  if (catalog.matches.length && !catalog.matches.some(isPostalReferenceDataSource)) return 'none';
  if (sourceValidationReadiness === 'blocked') return 'weak';
  if (catalog.strength === 'strong') return 'strong';
  if (sourceMatches([source], WEAK_POSTAL_EVIDENCE_PATTERNS)) return 'weak';
  if (sourceMatches([source], STRONG_POSTAL_EVIDENCE_PATTERNS)) return 'strong';

  const sourceKey = normalizeTextKey(source);
  const configuredSources = unique([
    ...(policy?.lookupSources || []),
    ...formatLookupSources(format),
  ]);
  const appearsInConfiguredReliableSource = configuredSources.some(candidate => {
    const candidateKey = normalizeTextKey(candidate);
    return Boolean(
      candidateKey &&
      sourceKey &&
      (candidateKey.includes(sourceKey) || sourceKey.includes(candidateKey)) &&
      sourceMatches([candidate], STRONG_POSTAL_EVIDENCE_PATTERNS)
    );
  });
  if (appearsInConfiguredReliableSource) return 'strong';

  const confidence = Number(evidence.confidence);
  if (
    Number.isFinite(confidence) &&
    confidence >= 0.92 &&
    sourceMatches([source], [/official/i, /government/i, /national/i])
  ) {
    return 'strong';
  }

  return 'weak';
}

function sourceValidationReadinessFor(
  evidence: PostalEvidenceCandidate | null,
  readiness: PostalSourceValidationReadinessEvidence[] | undefined,
): PostalEvidenceSourceReadiness {
  const sourceId = normalizeTextKey(evidence?.sourceId);
  if (!sourceId) return 'not-provided';

  const record = (readiness || []).find(candidate => normalizeTextKey(candidate.sourceId) === sourceId);
  if (!record) return 'not-provided';
  return record.officialReferenceValidationEligible && record.deliveryClaimsEnabled === false
    ? 'eligible'
    : 'blocked';
}

function geographicMetadataReadinessFor(
  countryCode: string,
  readiness: CountryGeographicMetadataReadinessEvidence[] | undefined,
): AddressVerificationGeographicMetadataReadiness {
  const evidenceBySourceId = new Map<string, {
    approvedAdministrativeKeyCount: number;
    sourceOrigin: CountryGeographicMetadataReadinessEvidence['sourceOrigin'];
  } | null>();
  for (const candidate of readiness || []) {
    const candidateCountry = normalizeCountryCode(candidate.countryCode);
    const sourceId = clean(candidate.sourceId).toLowerCase();
    const count = Number(candidate.approvedAdministrativeKeyCount);
    if (
      candidateCountry !== countryCode
      || !METADATA_SOURCE_ID_PATTERN.test(sourceId)
      || !Number.isSafeInteger(count)
      || count < 1
      || candidate.syntheticAdministrativeEvaluationEligible !== true
      || candidate.deliveryClaimsEnabled !== false
      || !['official-publication', 'maintained-open-source', 'open-source-composite'].includes(candidate.sourceOrigin)
    ) {
      continue;
    }
    evidenceBySourceId.set(sourceId, evidenceBySourceId.has(sourceId)
      ? null
      : {
          approvedAdministrativeKeyCount: count,
          sourceOrigin: candidate.sourceOrigin,
        });
  }

  const sources = [...evidenceBySourceId.entries()]
    .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => entry[1] !== null)
    .map(([sourceId, evidence]) => ({
      countryCode,
      sourceId,
      sourceOrigin: evidence.sourceOrigin,
      approvedAdministrativeKeyCount: evidence.approvedAdministrativeKeyCount,
      syntheticAdministrativeEvaluationEligible: true as const,
      deliveryClaimsEnabled: false as const,
    }))
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId));

  return {
    countryCode,
    sources,
    syntheticAdministrativeEvaluationEligible: sources.length > 0,
    deliveryClaimsEnabled: false,
    nonClaims: [
      'Synthetic administrative metadata does not establish postal lookup, address validity, coordinates, delivery, or delivery-point reachability.',
      'Duplicate, malformed, foreign-country, or delivery-enabled metadata evidence is excluded.',
    ],
  };
}

function findMatchedPostalEvidence(
  evidence: PostalEvidenceCandidate[] | undefined,
  address: CanonicalAddressParts,
  countryCode: string,
) {
  return (evidence || []).find(candidate => evidenceMatchesAddress(candidate, address, countryCode)) || null;
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

type RegionalGeographicPlan = {
  countryCode: string;
  planVersion: string;
  sourcePlans: readonly unknown[];
};

function buildGeographicRegionScope(
  plans: Array<{ region: GeographicValidationRegion; plan: RegionalGeographicPlan | null }>,
): AddressVerificationGeographicRegionScope {
  const matches = plans.flatMap(({ region, plan }) => plan ? [{
    region,
    countryCode: plan.countryCode,
    planVersion: plan.planVersion,
    metadataSourcePathCount: plan.sourcePlans.length,
  }] : []);
  const status: GeographicRegionScopeStatus = matches.length === 0
    ? 'not-covered'
    : matches.length === 1
      ? 'unambiguous'
      : 'ambiguous';

  return {
    status,
    matches,
    nonClaims: status === 'ambiguous'
      ? ['Multiple regional plan labels match this code; the engine does not select a jurisdiction, boundary, postal authority, or delivery interpretation.']
      : [],
  };
}

function scoreForStatus(status: AddressVerificationStatus, validationScore: number, evidenceConfidence: number) {
  const base = Math.max(validationScore, evidenceConfidence);
  if (status === 'verified') return Math.max(0.86, Math.min(0.99, base || 0.9));
  if (status === 'partial') return Math.max(0.42, Math.min(0.79, base || 0.62));
  if (status === 'unresolved') return Math.min(0.41, base || 0.28);
  return Math.min(0.25, base || 0.1);
}

const DEPTH_ORDER: Record<AddressVerificationDepth, number> = {
  format: 1,
  'postal-code': 2,
  locality: 3,
  street: 4,
  house: 5,
  building: 6,
  'delivery-point': 7,
  'geo-only': 3,
};

function strongerDepth(
  left: AddressVerificationDepth,
  right: AddressVerificationDepth,
): AddressVerificationDepth {
  return DEPTH_ORDER[right] > DEPTH_ORDER[left] ? right : left;
}

function depthFromPostalCatalogDepth(depth: string | undefined): AddressVerificationDepth {
  if (depth === 'delivery-point') return 'delivery-point';
  if (depth === 'building') return 'building';
  if (depth === 'address') return 'house';
  if (depth === 'street') return 'street';
  if (depth === 'locality') return 'locality';
  if (depth === 'postcode') return 'postal-code';
  if (depth === 'geo-only') return 'geo-only';
  return 'postal-code';
}

function evidenceGradeFromTrust(tier: PostalSourceTrustTier, referenceMatch: AddressReferenceMatch | null): AddressVerificationEvidenceGrade {
  if (tier === 'authoritative') return 'authoritative';
  if (tier === 'official') return 'official';
  if (tier === 'official-derived') return 'official-derived';
  if (referenceMatch) return 'open-reference';
  if (tier === 'open-reference') return 'open-reference';
  if (tier === 'community') return 'community';
  return 'format-only';
}

function buildQualitySummary(options: {
  status: AddressVerificationStatus;
  policy: AddressVerificationTargetCountryPolicy | null;
  postalSourceTrust: PostalSourceTrustTier;
  postalSourceMatches: ReturnType<typeof classifyPostalSourceTrust>['matches'];
  postalStrength: PostalEvidenceStrength;
  sourceValidationReadiness: PostalEvidenceSourceReadiness;
  referenceMatch: AddressReferenceMatch | null;
  formatValid: boolean | null;
  lookupRequired: boolean;
  lookupSatisfied: boolean;
  mode: PostalVerificationMode;
  validation: AddressValidationResult;
}): AddressVerificationQualitySummary {
  let depth: AddressVerificationDepth = options.mode === 'geo-only' ? 'geo-only' : 'format';
  if (options.sourceValidationReadiness !== 'blocked') {
    for (const match of options.postalSourceMatches.filter(isPostalReferenceDataSource)) {
      depth = strongerDepth(depth, depthFromPostalCatalogDepth(match.depth));
    }
    if (options.postalStrength !== 'none') {
      depth = strongerDepth(depth, 'postal-code');
    }
  }
  if (options.referenceMatch) {
    const record = options.referenceMatch.record;
    if (record.houseNumber) depth = strongerDepth(depth, 'house');
    else if (record.street) depth = strongerDepth(depth, 'street');
    else if (record.city || record.postcode) depth = strongerDepth(depth, 'locality');
  }
  const evidenceGrade = options.sourceValidationReadiness === 'blocked' && !options.referenceMatch
    ? options.formatValid === true ? 'format-only' : 'none'
    : options.postalStrength === 'none' && !options.referenceMatch
      ? options.formatValid === true ? 'format-only' : 'none'
      : evidenceGradeFromTrust(options.postalSourceTrust, options.referenceMatch);
  const paidApiParityClaimed = (
    options.status === 'verified' &&
    evidenceGrade === 'authoritative' &&
    DEPTH_ORDER[depth] >= DEPTH_ORDER.house
  );
  const readiness: AddressVerificationReadiness =
    paidApiParityClaimed
      ? 'paid-grade-for-supplied-evidence'
      : options.status === 'verified'
        ? 'strong-open-verification'
        : options.status === 'partial'
          ? options.formatValid === true
            && (options.postalStrength === 'none' || options.sourceValidationReadiness === 'blocked')
            && !options.referenceMatch
            ? 'format-only'
            : 'partial-open-verification'
          : 'manual-review-required';

  const limitations = unique([
    paidApiParityClaimed
      ? null
      : 'No proprietary delivery-point parity is claimed unless authoritative house/building/delivery-point evidence is supplied.',
    options.lookupRequired && !options.lookupSatisfied
      ? 'Postal-code lookup or address-reference evidence is still required for strong verification.'
      : null,
    options.sourceValidationReadiness === 'blocked'
      ? 'Postal source readiness metadata blocks this evidence from official-reference validation until rights, version, coverage, correction, quality, and review gates pass.'
      : options.postalStrength === 'weak'
      ? 'Community postal evidence is useful for candidate generation but not enough for paid-grade deliverability.'
      : null,
    options.validation.missingRequiredFields.length
      ? `Missing required field(s): ${options.validation.missingRequiredFields.join(', ')}.`
      : null,
    options.mode === 'geo-only'
      ? 'This country or territory is handled through geography and named-place evidence rather than normal postal codes.'
      : null,
  ]);

  const upgradeActions = unique([
    options.policy?.countryCode ? null : 'load-country-address-format-or-policy',
    options.lookupRequired && !options.lookupSatisfied ? 'add-credential-free-official-postal-source-or-open-address-reference' : null,
    DEPTH_ORDER[depth] < DEPTH_ORDER.house ? 'add-street-house-building-reference-data' : null,
    options.sourceValidationReadiness === 'blocked'
      ? 'resolve-postal-source-readiness-gates'
      : options.postalStrength === 'weak' ? 'cross-check-community-postal-data-against-official-or-open-address-reference' : null,
    options.validation.missingRequiredFields.length ? 'collect-required-address-fields' : null,
  ]);

  return {
    freeOnly: true,
    evidenceGrade,
    depth,
    readiness,
    paidApiParityClaimed,
    comparableFor: paidApiParityClaimed
      ? ['country formatting', 'postal evidence', 'house/building-level evidence for this supplied source set']
      : readiness === 'strong-open-verification'
        ? ['country formatting', 'open-source verification', 'postal/geographic candidate confidence']
        : ['country formatting', 'candidate generation', 'manual review workflow'],
    limitations,
    upgradeActions,
  };
}

function deriveStatus(options: {
  scope: AddressVerificationScope;
  targetAllowed: boolean;
  policy: AddressVerificationTargetCountryPolicy | null;
  supported: boolean;
  required: boolean;
  postcode: string;
  formatValid: boolean | null;
  lookupRequired: boolean;
  lookupSatisfied: boolean;
  validation: AddressValidationResult;
}) {
  if (!options.targetAllowed) return 'country_mismatch';
  if (!options.supported && !options.policy) return 'unsupported_country';

  if (options.required) {
    if (!options.postcode) return 'unresolved';
    if (options.formatValid === false) return 'unresolved';
  }

  if (options.scope === 'postal') {
    if (!options.required) return 'verified';
    if (options.lookupRequired && !options.lookupSatisfied) return 'partial';
    return options.formatValid === true || options.lookupSatisfied ? 'verified' : 'partial';
  }

  if (options.validation.missingRequiredFields.length > 0) return 'partial';
  if (options.lookupRequired && !options.lookupSatisfied) return 'partial';
  if (options.validation.status === 'verified') return 'verified';
  return 'partial';
}

function nextActionsFor(result: {
  status: AddressVerificationStatus;
  required: boolean;
  postcode: string;
  formatValid: boolean | null;
  lookupRequired: boolean;
  lookupSatisfied: boolean;
  weakPostalEvidenceMatched: boolean;
  missingFields: string[];
  supported: boolean;
  postalMode: PostalVerificationMode;
}) {
  const actions: string[] = [];
  if (result.status === 'country_mismatch') actions.push('select-the-correct-target-country');
  if (result.status === 'unsupported_country') actions.push('add-or-enable-a-country-verification-policy');
  if (result.required && !result.postcode) actions.push('collect-postal-code');
  if (result.formatValid === false) actions.push('correct-postal-code-format');
  if (result.lookupRequired && !result.lookupSatisfied) {
    actions.push(result.weakPostalEvidenceMatched
      ? 'collect-strong-postal-or-address-reference'
      : 'run-postal-code-lookup');
  }
  if (result.missingFields.length) actions.push(`collect-required-fields:${result.missingFields.join(',')}`);
  if (!result.supported) actions.push('load-country-address-format');
  if (result.postalMode === 'geo-only') actions.push('verify-with-coordinate-and-open-geodata');
  if (!actions.length && result.status !== 'verified') actions.push('manual-review');
  return actions;
}

export function isCountryEnabledForAddressVerification(countryCode: string, targetCountries?: string[]) {
  const code = normalizeCountryCode(countryCode);
  const targets = (targetCountries || DEFAULT_ADDRESS_VERIFICATION_TARGET_COUNTRIES)
    .map(normalizeCountryCode)
    .filter(Boolean);
  return Boolean(code && targets.includes(code) && DEFAULT_ADDRESS_VERIFICATION_TARGET_POLICIES[code]?.enabled);
}

export function getAddressVerificationTargetPolicy(
  countryCode: string,
  customPolicies?: Record<string, AddressVerificationTargetCountryPolicy>,
) {
  return countryPolicyFor(normalizeCountryCode(countryCode), customPolicies);
}

export function verifyAddressCandidate(input: AddressVerificationEngineInput): AddressVerificationEngineResult {
  const scope = input.scope === 'postal' ? 'postal' : 'address';
  const targetCountries = unique((input.targetCountries || []).map(normalizeCountryCode));
  const resolvedCountry = inferCountryCode(input);
  const policy = countryPolicyFor(resolvedCountry, input.countryPolicies) || policyFromFormat(input.format, resolvedCountry);
  const targetAllowed = !targetCountries.length || targetCountries.includes(resolvedCountry);
  const supported = Boolean(input.format || policy?.enabled);
  const canonicalAddress = buildCanonicalAddress(input, resolvedCountry);
  const format = input.format || policyFormat(policy);
  const postcode = normalizePostcode(canonicalAddress.postcode);
  const regex = formatRegex(format, policy);
  const formatValid = checkPostcodeFormat(postcode, regex);
  const required = postalRequired(format, policy);
  const mode = policy?.postalMode || (required ? 'manual' : 'geo-only');
  const matchedEvidence = findMatchedPostalEvidence(input.postalEvidence, canonicalAddress, resolvedCountry);
  const postalSourceClassification = classifyPostalSourceTrust({
    countryCode: matchedEvidence?.countryCode || resolvedCountry,
    source: matchedEvidence?.source,
    url: matchedEvidence?.url,
    sourceIds: unique([matchedEvidence?.sourceId]),
  });
  const sourceValidationReadiness = sourceValidationReadinessFor(
    matchedEvidence,
    input.postalSourceReadiness,
  );
  const postalStrength = postalEvidenceStrength(
    matchedEvidence,
    format,
    policy,
    sourceValidationReadiness,
  );
  const strongPostalEvidenceMatched = postalStrength === 'strong';
  const weakPostalEvidenceMatched = postalStrength === 'weak';
  const lookupRequired = mode === 'format-and-lookup' && required;
  const dataLoading = buildAddressDataLoadPlan({
    ...input.dataLoad,
    countryCode: resolvedCountry,
    targetCountries,
    format,
    policy,
    postalMode: mode,
    lookupRequired,
    hasPostalCode: Boolean(postcode),
  });
  const geographicMetadataReadiness = geographicMetadataReadinessFor(
    resolvedCountry,
    input.geographicMetadataReadiness,
  );
  const africaGeography = buildAfricaGeographicValidationPlan(resolvedCountry, {
    countrySourceReadiness: geographicMetadataReadiness.sources,
  });
  const asiaGeography = buildAsiaGeographicValidationPlan(resolvedCountry, {
    countrySourceReadiness: geographicMetadataReadiness.sources,
  });
  const oceaniaGeography = buildOceaniaGeographicValidationPlan(resolvedCountry, {
    countrySourceReadiness: geographicMetadataReadiness.sources,
  });
  const europeGeography = buildEuropeGeographicValidationPlan(resolvedCountry, {
    countrySourceReadiness: geographicMetadataReadiness.sources,
  });
  const americasGeography = buildAmericasGeographicValidationPlan(resolvedCountry, {
    countrySourceReadiness: geographicMetadataReadiness.sources,
  });
  const geographicRegionScope = buildGeographicRegionScope([
    { region: 'africa', plan: africaGeography },
    { region: 'asia', plan: asiaGeography },
    { region: 'oceania', plan: oceaniaGeography },
    { region: 'europe', plan: europeGeography },
    { region: 'americas', plan: americasGeography },
  ]);
  const standardLibrary = buildAddressStandardLibraryResolution({
    ...input.dataLoad,
    ...input.standardLibrary,
    countryCode: resolvedCountry,
    targetCountries,
    format,
    policy,
    postalMode: mode,
    lookupRequired,
    hasPostcode: Boolean(postcode),
    hasCoordinates: Boolean(input.systemConnection?.hasCoordinates || input.standardLibrary?.hasCoordinates),
    addressText: input.addressText,
  });
  const systemConnection = buildAddressSystemConnectionPlan({
    ...input.systemConnection,
    dataLoad: input.dataLoad,
    countryCode: resolvedCountry,
    targetCountries,
    format,
    postalMode: mode,
    hasPostalCode: Boolean(postcode),
    hasAddressReference: Array.isArray(input.referenceRecords) && input.referenceRecords.length > 0,
    sources: input.sources,
    purpose: input.systemConnection?.purpose || (scope === 'postal' ? 'verification' : 'registration'),
  });
  const referenceRecordsProvided = Array.isArray(input.referenceRecords) && input.referenceRecords.length > 0;
  const referenceMatch = referenceRecordsProvided
    ? matchOpenAddressesReference(canonicalAddress, input.referenceRecords || [])
    : null;
  const addressReference: AddressReferenceEvidence = referenceRecordsProvided
    ? referenceMatch
      ? 'matched'
      : 'not-matched'
    : 'not-provided';
  const lookupSatisfied = !lookupRequired || strongPostalEvidenceMatched || Boolean(referenceMatch);
  const referenceMatches = matchedEvidence
    ? [{
        source: matchedEvidence.source,
        confidence: strongPostalEvidenceMatched
          ? Math.max(0, Math.min(1, matchedEvidence.confidence ?? 0.88))
          : Math.max(0, Math.min(0.6, matchedEvidence.confidence ?? 0.5)),
      }]
    : [];
  if (referenceMatch) {
    referenceMatches.push({
      source: referenceMatch.source,
      confidence: referenceMatch.confidence,
    });
  }
  const validation = validateAddressWithOpenSourceRules(
    canonicalAddress,
    toValidationFormat(format),
    unique([
      ...(input.sources || []),
      ADDRESS_VERIFICATION_ENGINE_VERSION,
      policy?.countryCode ? `country-policy:${policy.countryCode}` : null,
    ]),
    { referenceMatches },
  );

  const status = deriveStatus({
    scope,
    targetAllowed,
    policy,
    supported,
    required,
    postcode,
    formatValid,
    lookupRequired,
    lookupSatisfied,
    validation,
  });
  const evidenceConfidence = Math.max(
    strongPostalEvidenceMatched ? matchedEvidence?.confidence ?? 0.88 : 0,
    referenceMatch?.confidence ?? 0,
  );
  const score = scoreForStatus(status, validation.score, evidenceConfidence);
  const quality = buildQualitySummary({
    status,
    policy,
    postalSourceTrust: postalSourceClassification.tier,
    postalSourceMatches: postalSourceClassification.matches,
    postalStrength,
    sourceValidationReadiness,
    referenceMatch,
    formatValid,
    lookupRequired,
    lookupSatisfied,
    mode,
    validation,
  });
  const warnings = unique([
    ...validation.warnings,
    ...standardLibrary.warnings,
    !resolvedCountry ? 'Target country could not be resolved.' : null,
    targetAllowed ? null : `Address country ${resolvedCountry || '(unknown)'} is outside the selected target countries.`,
    supported ? null : `No address verification policy or format is available for ${resolvedCountry || '(unknown country)'}.`,
    required && !postcode ? 'Postal code is required for this target country.' : null,
    formatValid === false ? 'Postal code does not match the selected target country pattern.' : null,
    africaGeography && lookupRequired && !lookupSatisfied
      ? 'African administrative and locality metadata is source-gated and does not replace strong postal lookup evidence.'
      : null,
    asiaGeography && lookupRequired && !lookupSatisfied
      ? 'Asian administrative, locality, and script-aware metadata is source-gated and does not replace strong postal lookup evidence.'
      : null,
    oceaniaGeography && lookupRequired && !lookupSatisfied
      ? 'Oceania administrative, locality, and island metadata is source-gated and does not replace strong postal lookup evidence.'
      : null,
    europeGeography && lookupRequired && !lookupSatisfied
      ? 'European administrative, locality, multilingual, and territory-scope metadata is source-gated and does not replace strong postal lookup evidence.'
      : null,
    americasGeography && lookupRequired && !lookupSatisfied
      ? 'Americas administrative, locality, multilingual, and island-scope metadata is source-gated and does not replace strong postal lookup evidence.'
      : null,
    geographicRegionScope.status === 'ambiguous'
      ? `Country or territory code ${resolvedCountry} matches multiple regional geographic plans (${geographicRegionScope.matches.map(match => match.region).join(', ')}); this does not select a postal authority or delivery interpretation.`
      : null,
    sourceValidationReadiness === 'blocked'
      ? 'Postal source readiness blocks this evidence from official-reference validation; it remains candidate-only.'
      : lookupRequired && weakPostalEvidenceMatched
        ? 'Postal-code candidate came from a weak source; strong postal or address-reference evidence is required for verified status.'
        : null,
    lookupRequired && !lookupSatisfied && !weakPostalEvidenceMatched ? 'Postal-code format is valid, but source lookup evidence is still required for strong verification.' : null,
    referenceRecordsProvided && !referenceMatch ? 'Address reference records were supplied, but none matched strongly enough.' : null,
  ]);
  const nextActions = nextActionsFor({
    status,
    required,
    postcode,
    formatValid,
    lookupRequired,
    lookupSatisfied,
    weakPostalEvidenceMatched,
    missingFields: validation.missingRequiredFields,
    supported,
    postalMode: mode,
  });
  const mergedNextActions = unique([
    ...nextActions,
    ...(sourceValidationReadiness === 'blocked' ? ['resolve-postal-source-readiness-gates'] : []),
    ...(africaGeography && status !== 'verified' ? africaGeography.nextActions : []),
    ...(asiaGeography && status !== 'verified' ? asiaGeography.nextActions : []),
    ...(oceaniaGeography && status !== 'verified' ? oceaniaGeography.nextActions : []),
    ...(europeGeography && status !== 'verified' ? europeGeography.nextActions : []),
    ...(americasGeography && status !== 'verified' ? americasGeography.nextActions : []),
    ...(geographicRegionScope.status === 'ambiguous'
      ? ['select-geographic-region-scope-for-ambiguous-country-code']
      : []),
    ...standardLibrary.nextActions,
  ]);
  const sources = unique([
    ...validation.checkedWith,
    ...(input.sources || []),
    standardLibrary.modelVersion,
    matchedEvidence?.source,
    referenceMatch?.source,
    policy?.countryCode ? `country-policy:${policy.countryCode}` : null,
  ]);
  const audit: AddressVerificationAuditStep[] = [
    {
      step: 'target-country',
      status: resolvedCountry && targetAllowed ? 'ok' : 'failed',
      message: resolvedCountry
        ? `Resolved target country ${resolvedCountry}.`
        : 'Target country was not supplied or inferred.',
      source: 'input',
    },
    {
      step: 'data-load-plan',
      status: dataLoading.warnings.some(warning => warning.includes('No credential-free strong postal lookup source'))
        ? 'warning'
        : 'ok',
      message: `Planned ${dataLoading.blocking.length} blocking, ${dataLoading.onDemand.length} on-demand, ${dataLoading.background.length} background, and ${dataLoading.disabled.length} disabled address-data source(s).`,
      source: dataLoading.planVersion,
    },
    ...(africaGeography ? [{
      step: 'africa-geography' as const,
      status: 'warning' as const,
      message: `Africa geographic plan exposes ${africaGeography.sourcePlans.length} metadata-only source path(s) and ${africaGeography.sourceComposition.components.length} composition component(s); administrative and locality checks remain source-gated.`,
      source: africaGeography.planVersion,
    }] : []),
    ...(asiaGeography ? [{
      step: 'asia-geography' as const,
      status: 'warning' as const,
      message: `Asia geographic plan exposes ${asiaGeography.sourcePlans.length} metadata-only source path(s) and ${asiaGeography.sourceComposition.components.length} composition component(s); administrative, locality, and script-aware checks remain source-gated.`,
      source: asiaGeography.planVersion,
    }] : []),
    ...(oceaniaGeography ? [{
      step: 'oceania-geography' as const,
      status: 'warning' as const,
      message: `Oceania geographic plan exposes ${oceaniaGeography.sourcePlans.length} metadata-only source path(s) and ${oceaniaGeography.sourceComposition.components.length} composition component(s); administrative, locality, and island checks remain source-gated.`,
      source: oceaniaGeography.planVersion,
    }] : []),
    ...(europeGeography ? [{
      step: 'europe-geography' as const,
      status: 'warning' as const,
      message: `Europe geographic plan exposes ${europeGeography.sourcePlans.length} metadata-only source path(s) and ${europeGeography.sourceComposition.components.length} composition component(s); administrative, locality, multilingual, and territory-scope checks remain source-gated.`,
      source: europeGeography.planVersion,
    }] : []),
    ...(americasGeography ? [{
      step: 'americas-geography' as const,
      status: 'warning' as const,
      message: `Americas geographic plan exposes ${americasGeography.sourcePlans.length} metadata-only source path(s) and ${americasGeography.sourceComposition.components.length} composition component(s); administrative, locality, multilingual, and island-scope checks remain source-gated.`,
      source: americasGeography.planVersion,
    }] : []),
    ...(geographicRegionScope.status === 'ambiguous' ? [{
      step: 'regional-geography' as const,
      status: 'warning' as const,
      message: `Country or territory code ${resolvedCountry} has ${geographicRegionScope.matches.length} regional geographic plan matches; no regional label selects postal authority or delivery interpretation.`,
      source: geographicRegionScope.matches.map(match => match.planVersion).join(', '),
    }] : []),
    ...(geographicMetadataReadiness.sources.length ? [{
      step: 'synthetic-geographic-metadata' as const,
      status: 'warning' as const,
      message: `Approved synthetic administrative metadata is available from ${geographicMetadataReadiness.sources.length} country-scoped source(s); it does not satisfy postal lookup or delivery evidence.`,
      source: geographicMetadataReadiness.sources.map(source => source.sourceId).join(', '),
    }] : []),
    {
      step: 'standard-library-resolution',
      status: standardLibrary.requiresNetworkForStrongVerification ? 'warning' : 'ok',
      message: `Standard-library resolution selected ${standardLibrary.primary.length} primary, ${standardLibrary.fallback.length} fallback, and ${standardLibrary.background.length} background component(s).`,
      source: standardLibrary.modelVersion,
    },
    {
      step: 'postal-format',
      status: !required ? 'skipped' : formatValid === false ? 'failed' : 'ok',
      message: !required
        ? 'Normal postal code is not required for this target country.'
        : formatValid === false
          ? 'Postal code failed the target-country pattern.'
          : 'Postal code pattern check completed.',
      source: regex ? 'country-or-format-regex' : 'none',
    },
    {
      step: 'postal-evidence',
      status: !lookupRequired ? 'skipped' : strongPostalEvidenceMatched ? 'ok' : 'warning',
      message: !lookupRequired
        ? 'Postal lookup evidence is not required by this policy.'
        : strongPostalEvidenceMatched
          ? `Strong postal evidence matched from ${matchedEvidence?.source}.`
          : sourceValidationReadiness === 'blocked'
            ? `Postal evidence from ${matchedEvidence?.source} is blocked by source-readiness gates; candidate use only.`
            : weakPostalEvidenceMatched
            ? `Weak postal evidence matched from ${matchedEvidence?.source}; strong evidence or address reference is still required.`
            : 'Strong postal lookup evidence is needed for postal-level verification.',
      source: matchedEvidence?.source,
    },
    {
      step: 'address-reference',
      status: !referenceRecordsProvided ? 'skipped' : referenceMatch ? 'ok' : 'warning',
      message: !referenceRecordsProvided
        ? 'Address reference records were not supplied.'
        : referenceMatch
          ? `Address reference matched from ${referenceMatch.source}.`
          : 'Address reference records were supplied, but none matched the canonical address.',
      source: referenceMatch?.source,
    },
    {
      step: 'address-rules',
      status: validation.missingRequiredFields.length ? 'warning' : 'ok',
      message: validation.missingRequiredFields.length
        ? `Missing required fields: ${validation.missingRequiredFields.join(', ')}.`
        : 'Address rule validation completed.',
      source: 'open-address-format-rules',
    },
    {
      step: 'final-decision',
      status: status === 'verified' ? 'ok' : status === 'partial' ? 'warning' : 'failed',
      message: `Address verification result is ${status}.`,
      source: ADDRESS_VERIFICATION_ENGINE_VERSION,
    },
  ];

  return {
    engineVersion: ADDRESS_VERIFICATION_ENGINE_VERSION,
    status,
    scope,
    score,
    country: {
      requested: normalizeCountryCode(input.countryCode) || null,
      resolved: resolvedCountry || null,
      targetCountries,
      targetAllowed,
      supported,
      policy: policy || undefined,
    },
    postal: {
      input: clean(input.postalCode || input.address?.postcode || ''),
      normalized: postcode,
      required,
      supported: Boolean(regex || mode === 'geo-only' || mode === 'none'),
      formatValid,
      mode,
      evidence: !required
        ? 'not-required'
        : matchedEvidence
          ? 'matched'
          : (input.postalEvidence || []).length
            ? 'not-matched'
            : 'not-provided',
      strength: postalStrength,
      matchedEvidence: matchedEvidence || undefined,
      lookupRequired,
      lookupSatisfied,
    },
    evidence: {
      postalStrength,
      postalSourceTrust: postalSourceClassification.tier,
      postalSourceCatalogMatches: postalSourceClassification.matches.map(match => match.id),
      sourceValidationReadiness,
      lookupSatisfied,
      addressReference,
      strongPostalEvidence: strongPostalEvidenceMatched ? matchedEvidence || undefined : undefined,
      weakPostalEvidence: weakPostalEvidenceMatched ? matchedEvidence || undefined : undefined,
      referenceMatch: referenceMatch || undefined,
    },
    quality,
    canonicalAddress,
    dataLoading,
    standardLibrary,
    geographicRegionScope,
    geographicMetadataReadiness,
    africaGeography: africaGeography || undefined,
    asiaGeography: asiaGeography || undefined,
    oceaniaGeography: oceaniaGeography || undefined,
    europeGeography: europeGeography || undefined,
    americasGeography: americasGeography || undefined,
    systemConnection,
    validation,
    warnings,
    nextActions: mergedNextActions,
    sources,
    audit,
  };
}
