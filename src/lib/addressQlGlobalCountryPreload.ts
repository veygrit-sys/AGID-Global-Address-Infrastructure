import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

import type { AddressQlPostalStatusClass } from './addressQlCountryPostal';
import {
  classifyPostalSourceTrust,
  getPreferredPostalSourceIdsForCountry,
  type PostalSourceTrustTier,
} from './officialPostalSourceCatalog';

export const ADDRESSQL_GLOBAL_COUNTRY_PRELOAD_VERSION = 'addressql-global-country-preload-v0.7';

export type AddressQlAddressFormatCoverage =
  | 'native_and_english_preloaded'
  | 'native_only_preloaded'
  | 'english_only_preloaded'
  | 'seed_profile_required';

export type AddressQlValidationReadiness =
  | 'format_only'
  | 'metadata_gated'
  | 'postal_equivalent_required'
  | 'delivery_source_required'
  | 'manual_review_required';

export type AddressQlGlobalCountryPreloadProfile = {
  countryCode: string;
  displayName: string;
  regionKey: string;
  sourcePath: string | null;
  addressFormatCoverage: AddressQlAddressFormatCoverage;
  validationReadiness: AddressQlValidationReadiness;
  postalStatus: AddressQlPostalStatusClass;
  postalFormat: string | null;
  postalRegex: string | null;
  postalRegexAvailable: boolean;
  nativeInputAvailable: boolean;
  englishInputAvailable: boolean;
  languageCodes: string[];
  requiredComponents: string[];
  regionalHierarchy: string[];
  sourcePolicy: {
    sourceVersion: typeof ADDRESSQL_GLOBAL_COUNTRY_PRELOAD_VERSION;
    localAddressFormatPreloaded: boolean;
    postalSourceTier: PostalSourceTrustTier | 'unknown';
    postalSourceStrength: 'strong' | 'weak' | 'unknown';
    preferredPostalSourceIds: string[];
    openSourceIds: string[];
    postalEquivalentStrategy: string;
    nonClaims: string[];
  };
};

export type AddressQlGlobalCountryPreloadSummary = {
  version: typeof ADDRESSQL_GLOBAL_COUNTRY_PRELOAD_VERSION;
  totalProfiles: number;
  localAddressFormatProfiles: number;
  seedOnlyProfiles: number;
  noPostalCodeProfiles: number;
  weakPostalProfiles: number;
  postalFormatProfiles: number;
  nativeAndEnglishProfiles: number;
  manualReviewProfiles: number;
};

type RawAddressFormatField = {
  key?: string;
  required?: boolean;
};

type RawAddressFormatBlock = {
  name?: string;
  fields?: RawAddressFormatField[];
};

type RawAddressFormatProfile = {
  countryCode?: string;
  name?: string;
  native?: RawAddressFormatBlock;
  english?: RawAddressFormatBlock;
  postalCode?: {
    format?: string | null;
    regex?: string | null;
    api?: string | null;
    source?: string | null;
  } | null;
  addressRules?: {
    languages?: Array<{ code?: string; name?: string }>;
    regionalHierarchy?: string[];
    postalCode?: unknown;
  };
  openSourceIds?: string[];
};

type LocalAddressFormatRecord = {
  countryCode: string;
  regionKey: string;
  sourcePath: string;
  raw: RawAddressFormatProfile;
};

export const ADDRESSQL_CORE_COUNTRY_REGION_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO
BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ
DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP
GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG
KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML
MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE
PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL
SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM
US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW XK
`.trim().split(/\s+/);

const NO_POSTAL_CODE_COUNTRIES = new Set([
  'AE',
  'BH',
  'DM',
  'HK',
  'JM',
  'KI',
  'MO',
  'NR',
  'QA',
  'SB',
  'TO',
  'TV',
  'VU',
  'WS',
  'LC',
]);

const WEAK_OR_PARTIAL_POSTAL_COUNTRIES = new Set([
  'AO',
  'CD',
  'ET',
  'GH',
  'IE',
  'KE',
  'KH',
  'LA',
  'NG',
  'NP',
  'PG',
  'TZ',
  'UG',
]);

function walkJsonFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkJsonFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(fullPath);
  }
  return files.sort();
}

function normalizeCountryCode(input: string | undefined | null): string {
  return (input || '').trim().toUpperCase().replace(/[^A-Z0-9_/-]/g, '');
}

function sourcePathToCountryCode(path: string): string {
  return basename(path, '.json').toUpperCase();
}

function sourcePathToRegionKey(root: string, path: string): string {
  const parts = relative(root, path).split(/[\\/]/);
  return parts.length > 1 ? parts.slice(0, -1).join('/') : 'unclassified';
}

function parseAddressFormat(path: string): RawAddressFormatProfile | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as RawAddressFormatProfile;
  } catch {
    return null;
  }
}

function getRequiredComponents(raw: RawAddressFormatProfile): string[] {
  const keys = new Set<string>();
  for (const field of raw.native?.fields || []) {
    if (field.key && field.required) keys.add(field.key);
  }
  for (const field of raw.english?.fields || []) {
    if (field.key && field.required) keys.add(field.key);
  }
  return [...keys].sort();
}

function getLanguageCodes(raw: RawAddressFormatProfile): string[] {
  const codes = new Set<string>();
  for (const language of raw.addressRules?.languages || []) {
    if (language.code) codes.add(language.code);
  }
  if (raw.native?.name && !codes.size) codes.add('native');
  if (raw.english?.name) codes.add('en');
  return [...codes].sort();
}

function classifyAddressFormatCoverage(raw: RawAddressFormatProfile | null): AddressQlAddressFormatCoverage {
  if (!raw) return 'seed_profile_required';
  const hasNative = Boolean(raw.native?.fields?.length);
  const hasEnglish = Boolean(raw.english?.fields?.length);
  if (hasNative && hasEnglish) return 'native_and_english_preloaded';
  if (hasNative) return 'native_only_preloaded';
  if (hasEnglish) return 'english_only_preloaded';
  return 'seed_profile_required';
}

function isNoPostalShape(raw: RawAddressFormatProfile | null): boolean {
  if (!raw) return false;
  const postal = raw.postalCode;
  if (!postal) return true;
  const format = String(postal.format || '').toLowerCase();
  const source = String(postal.source || '').toLowerCase();
  return !postal.regex || format === 'none' || source.includes('no postal code') || source.includes('no postal codes');
}

function classifyPostalStatus(countryCode: string, raw: RawAddressFormatProfile | null): AddressQlPostalStatusClass {
  if (NO_POSTAL_CODE_COUNTRIES.has(countryCode) || isNoPostalShape(raw)) return 'no_postal_code';
  if (WEAK_OR_PARTIAL_POSTAL_COUNTRIES.has(countryCode)) return 'weak_or_partial_postal_code';
  if (!raw?.postalCode?.regex) return 'postal_equivalent_required';

  const trust = classifyPostalSourceTrust({
    countryCode,
    source: raw.postalCode.source,
    url: raw.postalCode.api,
    sourceIds: raw.openSourceIds,
  });
  return trust.strength === 'strong' ? 'official_postal_code' : 'weak_or_partial_postal_code';
}

function classifyValidationReadiness(
  postalStatus: AddressQlPostalStatusClass,
  coverage: AddressQlAddressFormatCoverage,
): AddressQlValidationReadiness {
  if (postalStatus === 'official_postal_code' && coverage !== 'seed_profile_required') return 'format_only';
  if (postalStatus === 'no_postal_code' || postalStatus === 'postal_equivalent_required') return 'postal_equivalent_required';
  if (postalStatus === 'weak_or_partial_postal_code') return 'metadata_gated';
  if (postalStatus === 'carrier_specific_postal_code') return 'delivery_source_required';
  return 'manual_review_required';
}

function postalEquivalentStrategy(postalStatus: AddressQlPostalStatusClass): string {
  if (postalStatus === 'no_postal_code') {
    return 'Use AGID/admin/delivery regions and ADDRESS_WITHIN/DELIVERY_AVAILABLE; do not invent official postal codes.';
  }
  if (postalStatus === 'weak_or_partial_postal_code') {
    return 'Use postal code as one signal, then require administrative, spatial, source, or carrier evidence.';
  }
  if (postalStatus === 'postal_equivalent_required') {
    return 'Require a source-versioned postal-equivalent region before strict validation.';
  }
  if (postalStatus === 'carrier_specific_postal_code') {
    return 'Require carrier service-area source before accepting delivery-specific postal regions.';
  }
  return 'Validate postal syntax and area, then keep residence and identity as separate non-claims.';
}

function nonClaimsFor(postalStatus: AddressQlPostalStatusClass): string[] {
  const base = [
    'A preloaded country profile is not proof of global address completeness.',
    'Postal validation is not proof of residence, identity, or carrier SLA.',
  ];
  if (postalStatus === 'no_postal_code') {
    base.push('Postal-equivalent regions are operational fallbacks, not official postal codes.');
  }
  if (postalStatus === 'weak_or_partial_postal_code') {
    base.push('Weak postal data must not silently override administrative, spatial, or delivery evidence.');
  }
  return base;
}

export function loadAddressQlLocalAddressFormatRecords(
  root = process.cwd(),
): LocalAddressFormatRecord[] {
  const formatRoot = join(root, 'src', 'data', 'address_formats');
  return walkJsonFiles(formatRoot)
    .map((sourcePath): LocalAddressFormatRecord | null => {
      const raw = parseAddressFormat(sourcePath);
      if (!raw) return null;
      const countryCode = normalizeCountryCode(raw.countryCode) || sourcePathToCountryCode(sourcePath);
      return {
        countryCode,
        regionKey: sourcePathToRegionKey(formatRoot, sourcePath),
        sourcePath: relative(root, sourcePath).replace(/\\/g, '/'),
        raw,
      };
    })
    .filter((record): record is LocalAddressFormatRecord => Boolean(record));
}

export function buildAddressQlGlobalCountryPreloadProfiles(
  root = process.cwd(),
): AddressQlGlobalCountryPreloadProfile[] {
  const localRecords = loadAddressQlLocalAddressFormatRecords(root);
  const byCountry = new Map<string, LocalAddressFormatRecord>();
  for (const record of localRecords) {
    if (!byCountry.has(record.countryCode)) byCountry.set(record.countryCode, record);
  }

  const codes = [...new Set([...ADDRESSQL_CORE_COUNTRY_REGION_CODES, ...byCountry.keys()])].sort();

  return codes.map((countryCode) => {
    const local = byCountry.get(countryCode) || null;
    const raw = local?.raw || null;
    const coverage = classifyAddressFormatCoverage(raw);
    const postalStatus = classifyPostalStatus(countryCode, raw);
    const trust = raw?.postalCode
      ? classifyPostalSourceTrust({
        countryCode,
        source: raw.postalCode.source,
        url: raw.postalCode.api,
        sourceIds: raw.openSourceIds,
      })
      : null;

    return {
      countryCode,
      displayName: raw?.name || countryCode,
      regionKey: local?.regionKey || 'seed-only',
      sourcePath: local?.sourcePath || null,
      addressFormatCoverage: coverage,
      validationReadiness: classifyValidationReadiness(postalStatus, coverage),
      postalStatus,
      postalFormat: postalStatus === 'no_postal_code' ? null : raw?.postalCode?.format || null,
      postalRegex: postalStatus === 'no_postal_code' ? null : raw?.postalCode?.regex || null,
      postalRegexAvailable: postalStatus === 'no_postal_code' ? false : Boolean(raw?.postalCode?.regex),
      nativeInputAvailable: Boolean(raw?.native?.fields?.length),
      englishInputAvailable: Boolean(raw?.english?.fields?.length),
      languageCodes: raw ? getLanguageCodes(raw) : [],
      requiredComponents: raw ? getRequiredComponents(raw) : [],
      regionalHierarchy: raw?.addressRules?.regionalHierarchy || [],
      sourcePolicy: {
        sourceVersion: ADDRESSQL_GLOBAL_COUNTRY_PRELOAD_VERSION,
        localAddressFormatPreloaded: Boolean(local),
        postalSourceTier: trust?.tier || 'unknown',
        postalSourceStrength: trust?.strength || 'unknown',
        preferredPostalSourceIds: getPreferredPostalSourceIdsForCountry(countryCode).slice(0, 6),
        openSourceIds: (raw?.openSourceIds || []).slice(0, 12),
        postalEquivalentStrategy: postalEquivalentStrategy(postalStatus),
        nonClaims: nonClaimsFor(postalStatus),
      },
    };
  });
}

export function getAddressQlGlobalCountryPreloadProfile(
  countryCode: string,
  root = process.cwd(),
): AddressQlGlobalCountryPreloadProfile | null {
  const normalized = normalizeCountryCode(countryCode);
  return buildAddressQlGlobalCountryPreloadProfiles(root).find(profile => profile.countryCode === normalized) || null;
}

export function summarizeAddressQlGlobalCountryPreload(
  root = process.cwd(),
): AddressQlGlobalCountryPreloadSummary {
  const profiles = buildAddressQlGlobalCountryPreloadProfiles(root);
  return {
    version: ADDRESSQL_GLOBAL_COUNTRY_PRELOAD_VERSION,
    totalProfiles: profiles.length,
    localAddressFormatProfiles: profiles.filter(profile => profile.sourcePath).length,
    seedOnlyProfiles: profiles.filter(profile => !profile.sourcePath).length,
    noPostalCodeProfiles: profiles.filter(profile => profile.postalStatus === 'no_postal_code').length,
    weakPostalProfiles: profiles.filter(profile => profile.postalStatus === 'weak_or_partial_postal_code').length,
    postalFormatProfiles: profiles.filter(profile => profile.postalStatus === 'official_postal_code').length,
    nativeAndEnglishProfiles: profiles.filter(profile => profile.addressFormatCoverage === 'native_and_english_preloaded').length,
    manualReviewProfiles: profiles.filter(profile => profile.validationReadiness === 'manual_review_required').length,
  };
}

export function validateAddressQlGlobalCountryPreload(root = process.cwd()): string[] {
  const errors: string[] = [];
  const profiles = buildAddressQlGlobalCountryPreloadProfiles(root);
  const profileCodes = new Set(profiles.map(profile => profile.countryCode));

  if (profiles.length < 249) errors.push('global preload must cover at least ISO country/region codes');
  for (const code of ADDRESSQL_CORE_COUNTRY_REGION_CODES) {
    if (!profileCodes.has(code)) errors.push(`missing-core-country-region:${code}`);
  }
  if (profileCodes.size !== profiles.length) errors.push('duplicate-country-region-profile');

  for (const profile of profiles) {
    if (!profile.sourcePolicy.sourceVersion) errors.push(`${profile.countryCode}:missing-source-version`);
    if (!profile.sourcePolicy.nonClaims.length) errors.push(`${profile.countryCode}:missing-non-claims`);
    if (!profile.sourcePolicy.postalEquivalentStrategy) errors.push(`${profile.countryCode}:missing-postal-equivalent-strategy`);
    if (profile.postalStatus === 'no_postal_code' && profile.postalRegexAvailable) {
      errors.push(`${profile.countryCode}:no-postal-profile-must-not-require-postal-regex`);
    }
    if (profile.postalStatus === 'no_postal_code' && !/do not invent official postal codes/i.test(profile.sourcePolicy.postalEquivalentStrategy)) {
      errors.push(`${profile.countryCode}:no-postal-strategy-must-forbid-invented-postal-codes`);
    }
    if (profile.validationReadiness === 'format_only' && !profile.postalRegexAvailable) {
      errors.push(`${profile.countryCode}:format-only-readiness-needs-regex`);
    }
  }

  const noPostalMissingFallback = profiles
    .filter(profile => profile.postalStatus === 'no_postal_code')
    .filter(profile => !profile.sourcePolicy.nonClaims.join(' ').includes('operational fallbacks'));
  if (noPostalMissingFallback.length) errors.push('no-postal-profiles-must-declare-operational-fallback-nonclaim');

  return errors;
}
