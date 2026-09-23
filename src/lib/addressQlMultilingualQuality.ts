import {
  buildAddressQlGlobalCountryPreloadProfiles,
  type AddressQlGlobalCountryPreloadProfile,
} from './addressQlGlobalCountryPreload';

export const ADDRESSQL_MULTILINGUAL_QUALITY_VERSION =
  'addressql-multilingual-quality-v0.1';

export const ADDRESSQL_MULTILINGUAL_LEVELS =
  ['M0', 'M1', 'M2', 'M3', 'M4'] as const;

export type AddressQlMultilingualLevel =
  (typeof ADDRESSQL_MULTILINGUAL_LEVELS)[number];
export type AddressQlMultilingualQualityState =
  | 'enabled'
  | 'review_candidate'
  | 'blocked'
  | 'not_applicable';

export type AddressQlMultilingualQualityGate = {
  level: AddressQlMultilingualLevel;
  capability:
    | 'language-profile'
    | 'native-format'
    | 'international-english-format'
    | 'source-gated-transliteration'
    | 'verified-place-name-translation';
  state: AddressQlMultilingualQualityState;
  requiredEvidence: string[];
  observedEvidence: string[];
  approvedEvidence: string[];
  missingEvidence: string[];
};

export type AddressQlMultilingualQualityRecord = {
  version: typeof ADDRESSQL_MULTILINGUAL_QUALITY_VERSION;
  countryCode: string;
  languageCodes: string[];
  scriptFamilies: string[];
  adapterFamilies: string[];
  gates: AddressQlMultilingualQualityGate[];
  highestEnabledLevel: AddressQlMultilingualLevel;
  highestReviewCandidateLevel: AddressQlMultilingualLevel | null;
  automaticPlaceNameTranslationEnabled: false;
  independentQualityAttestationVerified: false;
  privacy: {
    acceptsAddressText: false;
    storesAddressText: false;
    logsAddressText: false;
  };
  nonClaims: string[];
};

export type AddressQlMultilingualQualitySummary = {
  version: typeof ADDRESSQL_MULTILINGUAL_QUALITY_VERSION;
  countryCount: number;
  nativeFormatEnabledProfiles: number;
  internationalEnglishFormatEnabledProfiles: number;
  transliterationReviewCandidateProfiles: number;
  verifiedTranslationReviewCandidateProfiles: number;
  automaticPlaceNameTranslationEnabledProfiles: number;
};

export type AddressQlMultilingualPurpose =
  | 'domestic'
  | 'international-shipping';

export type AddressQlMultilingualRouteAssessment = {
  version: typeof ADDRESSQL_MULTILINGUAL_QUALITY_VERSION;
  countryCode: string;
  sourceLanguage: string;
  targetLanguage: string;
  purpose: AddressQlMultilingualPurpose;
  status: 'ready' | 'review_required' | 'blocked';
  mode:
    | 'identity-normalization'
    | 'native-formatting'
    | 'international-english-formatting'
    | 'source-gated-transliteration';
  formatReady: boolean;
  automaticTransformationAllowed: boolean;
  humanReviewRequired: boolean;
  translationVerified: false;
  adapterFamilies: string[];
  missingEvidence: string[];
  reasonCode: string;
  nonClaims: string[];
};

const CAPABILITIES: Record<AddressQlMultilingualLevel, {
  capability: AddressQlMultilingualQualityGate['capability'];
  requiredEvidence: string[];
}> = {
  M0: {
    capability: 'language-profile',
    requiredEvidence: ['country-language-codes'],
  },
  M1: {
    capability: 'native-format',
    requiredEvidence: ['native-address-template'],
  },
  M2: {
    capability: 'international-english-format',
    requiredEvidence: ['international-english-template'],
  },
  M3: {
    capability: 'source-gated-transliteration',
    requiredEvidence: [
      'country-language-policy',
      'script-policy',
      'source-gated-place-aliases',
      'synthetic-holdout',
      'independent-signature',
      'runtime-adapter',
    ],
  },
  M4: {
    capability: 'verified-place-name-translation',
    requiredEvidence: [
      'versioned-place-name-dataset',
      'reuse-rights',
      'coverage-statement',
      'correction-path',
      'multilingual-holdout',
      'independent-signature',
      'runtime-adapter',
    ],
  },
};

const CYRILLIC_LANGUAGES = new Set([
  'be', 'bg', 'kk', 'ky', 'mk', 'mn', 'ru', 'sr', 'tg', 'uk',
]);
const ARABIC_LANGUAGES = new Set([
  'ar', 'fa', 'ku', 'ps', 'sd', 'ug', 'ur',
]);
const INDIC_LANGUAGES = new Set([
  'as', 'bn', 'gu', 'hi', 'kn', 'ml', 'mr', 'ne', 'or', 'pa', 'si', 'ta', 'te',
]);
const HAN_COUNTRY_CODES = new Set(['CN', 'TW', 'HK', 'MO', 'SG']);
const MAJOR_EUROPEAN_CODES = new Set([
  'AT', 'CH', 'DE', 'IT', 'LI', 'PT', 'RU',
]);

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort();
}

export function normalizeAddressQlLanguageTag(value: string) {
  const input = value.trim();
  if (!input || input.length > 35 || !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*$/.test(input)) {
    return null;
  }
  try {
    return Intl.getCanonicalLocales(input)[0] || null;
  } catch {
    return null;
  }
}

function languageBase(languageCode: string) {
  return languageCode.split('-', 1)[0].toLowerCase();
}

function scriptsForLanguages(languageCodes: readonly string[]) {
  const scripts = new Set<string>();
  for (const languageCode of languageCodes) {
    const base = languageBase(languageCode);
    if (languageCode.includes('Hans')) scripts.add('Han-Simplified');
    else if (languageCode.includes('Hant')) scripts.add('Han-Traditional');
    else if (base === 'zh') scripts.add('Han');
    else if (base === 'ja') scripts.add('Han-Kana');
    else if (base === 'ko') scripts.add('Hangul-Han');
    else if (ARABIC_LANGUAGES.has(base)) scripts.add('Arabic');
    else if (CYRILLIC_LANGUAGES.has(base)) scripts.add('Cyrillic');
    else if (INDIC_LANGUAGES.has(base)) scripts.add('Indic');
    else if (base === 'el') scripts.add('Greek');
    else if (base === 'he' || base === 'yi') scripts.add('Hebrew');
    else if (base === 'hy') scripts.add('Armenian');
    else if (base === 'ka') scripts.add('Georgian');
    else if (base === 'am' || base === 'ti') scripts.add('Ethiopic');
    else if (base === 'th') scripts.add('Thai');
    else if (base === 'lo') scripts.add('Lao');
    else if (base === 'km') scripts.add('Khmer');
    else if (base === 'my') scripts.add('Myanmar');
    else scripts.add('Latin-or-language-default');
  }
  return [...scripts].sort();
}

function regionalAdapter(profile: AddressQlGlobalCountryPreloadProfile) {
  const sourcePath = profile.sourcePath || '';
  if (sourcePath.includes('/africa/')) return 'regional-african-shipping';
  if (sourcePath.includes('/americas/')) return 'regional-americas-translation';
  if (sourcePath.includes('/asia/')) return 'regional-asian-shipping';
  if (sourcePath.includes('/europe/')) return 'regional-european-shipping';
  if (sourcePath.includes('/oceania/')) return 'regional-oceania-shipping';
  return null;
}

function adapterFamilies(profile: AddressQlGlobalCountryPreloadProfile) {
  const adapters = new Set<string>();
  const bases = new Set(profile.languageCodes.map(languageBase));

  if (profile.countryCode === 'JP') adapters.add('japanese-contextual-reading');
  if (HAN_COUNTRY_CODES.has(profile.countryCode)) {
    adapters.add('chinese-regional-place-name');
    adapters.add('chinese-script-conversion');
  }
  if (bases.has('ar')) adapters.add('arabic-shipping');
  if (bases.has('es')) adapters.add('spanish-shipping');
  if (bases.has('fr')) adapters.add('french-shipping');
  if (MAJOR_EUROPEAN_CODES.has(profile.countryCode)) {
    adapters.add('major-european-shipping');
  }
  const regional = regionalAdapter(profile);
  if (regional) adapters.add(regional);

  return [...adapters].sort();
}

function qualityGate(input: {
  level: AddressQlMultilingualLevel;
  state: AddressQlMultilingualQualityState;
  observedEvidence?: string[];
  approvedEvidence?: string[];
}): AddressQlMultilingualQualityGate {
  const specification = CAPABILITIES[input.level];
  const requiredEvidence = uniqueSorted(specification.requiredEvidence);
  const approvedEvidence = uniqueSorted(input.approvedEvidence || [])
    .filter(item => requiredEvidence.includes(item));
  return {
    level: input.level,
    capability: specification.capability,
    state: input.state,
    requiredEvidence,
    observedEvidence: uniqueSorted(input.observedEvidence || []),
    approvedEvidence,
    missingEvidence: input.state === 'not_applicable'
      ? []
      : requiredEvidence.filter(item => !approvedEvidence.includes(item)),
  };
}

function hasNonEnglishLanguage(profile: AddressQlGlobalCountryPreloadProfile) {
  return profile.languageCodes.some(languageCode => languageBase(languageCode) !== 'en');
}

export function buildAddressQlMultilingualQualityRecord(
  profile: AddressQlGlobalCountryPreloadProfile,
): AddressQlMultilingualQualityRecord {
  const adapters = adapterFamilies(profile);
  const nonEnglish = hasNonEnglishLanguage(profile);
  const contextualPlaceNameEngine = (
    profile.countryCode === 'JP'
    || HAN_COUNTRY_CODES.has(profile.countryCode)
  );
  const gates = [
    qualityGate({
      level: 'M0',
      state: profile.languageCodes.length ? 'enabled' : 'blocked',
      observedEvidence: profile.languageCodes.map(code => `language:${code}`),
      approvedEvidence: profile.languageCodes.length ? ['country-language-codes'] : [],
    }),
    qualityGate({
      level: 'M1',
      state: profile.nativeInputAvailable ? 'enabled' : 'not_applicable',
      observedEvidence: profile.sourcePath ? [profile.sourcePath] : [],
      approvedEvidence: profile.nativeInputAvailable ? ['native-address-template'] : [],
    }),
    qualityGate({
      level: 'M2',
      state: profile.englishInputAvailable ? 'enabled' : 'not_applicable',
      observedEvidence: profile.sourcePath ? [profile.sourcePath] : [],
      approvedEvidence: profile.englishInputAvailable
        ? ['international-english-template']
        : [],
    }),
    qualityGate({
      level: 'M3',
      state: !nonEnglish
        ? 'not_applicable'
        : adapters.length && profile.nativeInputAvailable && profile.englishInputAvailable
          ? 'review_candidate'
          : 'blocked',
      observedEvidence: [
        ...adapters.map(adapter => `adapter-contract:${adapter}`),
        ...scriptsForLanguages(profile.languageCodes).map(script => `script:${script}`),
      ],
      approvedEvidence: nonEnglish
        ? ['country-language-policy', 'script-policy']
        : [],
    }),
    qualityGate({
      level: 'M4',
      state: !nonEnglish
        ? 'not_applicable'
        : contextualPlaceNameEngine
          ? 'review_candidate'
          : 'blocked',
      observedEvidence: contextualPlaceNameEngine
        ? [
          profile.countryCode === 'JP'
            ? 'holdout-engine:japanese-contextual-reading'
            : 'holdout-engine:chinese-regional-place-name',
          'ranking-contract:official-place-name-ranking-v1',
          'holdout-slices:country-and-administrative-hierarchy',
          'candidate-policy:official-alias-before-generated-transliteration',
          ...adapters.map(adapter => `adapter-contract:${adapter}`),
        ]
        : [],
      approvedEvidence: [],
    }),
  ];
  const enabled = gates.filter(gate => gate.state === 'enabled');
  const reviewCandidates = gates.filter(gate => gate.state === 'review_candidate');

  return {
    version: ADDRESSQL_MULTILINGUAL_QUALITY_VERSION,
    countryCode: profile.countryCode,
    languageCodes: uniqueSorted(profile.languageCodes),
    scriptFamilies: scriptsForLanguages(profile.languageCodes),
    adapterFamilies: adapters,
    gates,
    highestEnabledLevel: enabled.at(-1)?.level || 'M0',
    highestReviewCandidateLevel: reviewCandidates.at(-1)?.level || null,
    automaticPlaceNameTranslationEnabled: false,
    independentQualityAttestationVerified: false,
    privacy: {
      acceptsAddressText: false,
      storesAddressText: false,
      logsAddressText: false,
    },
    nonClaims: [
      'A native or English address template does not prove place-name translation quality.',
      'A specialist adapter contract does not prove a source-backed place-name reading.',
      'No automatic place-name translation is enabled without country holdouts and independent attestation.',
    ],
  };
}

export function buildAddressQlMultilingualQualityIndex(
  root = process.cwd(),
): AddressQlMultilingualQualityRecord[] {
  return buildAddressQlGlobalCountryPreloadProfiles(root)
    .map(buildAddressQlMultilingualQualityRecord)
    .sort((left, right) => left.countryCode.localeCompare(right.countryCode));
}

export function summarizeAddressQlMultilingualQuality(
  records: readonly AddressQlMultilingualQualityRecord[],
): AddressQlMultilingualQualitySummary {
  const hasState = (
    record: AddressQlMultilingualQualityRecord,
    level: AddressQlMultilingualLevel,
    state: AddressQlMultilingualQualityState,
  ) => record.gates.some(gate => gate.level === level && gate.state === state);

  return {
    version: ADDRESSQL_MULTILINGUAL_QUALITY_VERSION,
    countryCount: records.length,
    nativeFormatEnabledProfiles:
      records.filter(record => hasState(record, 'M1', 'enabled')).length,
    internationalEnglishFormatEnabledProfiles:
      records.filter(record => hasState(record, 'M2', 'enabled')).length,
    transliterationReviewCandidateProfiles:
      records.filter(record => hasState(record, 'M3', 'review_candidate')).length,
    verifiedTranslationReviewCandidateProfiles:
      records.filter(record => hasState(record, 'M4', 'review_candidate')).length,
    automaticPlaceNameTranslationEnabledProfiles:
      records.filter(record => record.automaticPlaceNameTranslationEnabled).length,
  };
}

function languageAllowed(
  record: AddressQlMultilingualQualityRecord,
  languageCode: string,
) {
  if (languageBase(languageCode) === 'en') return true;
  return record.languageCodes.some(candidate =>
    candidate === languageCode
    || languageBase(candidate) === languageBase(languageCode));
}

export function assessAddressQlMultilingualRoute(input: {
  record: AddressQlMultilingualQualityRecord;
  sourceLanguage: string;
  targetLanguage: string;
  purpose: AddressQlMultilingualPurpose;
}): AddressQlMultilingualRouteAssessment {
  const sourceLanguage = normalizeAddressQlLanguageTag(input.sourceLanguage);
  const targetLanguage = normalizeAddressQlLanguageTag(input.targetLanguage);
  if (!sourceLanguage || !targetLanguage) {
    throw new Error('multilingual route requires valid bounded BCP 47 language tags');
  }
  const sourceAllowed = languageAllowed(input.record, sourceLanguage);
  const targetAllowed = languageAllowed(input.record, targetLanguage);
  const sameLanguage = sourceLanguage === targetLanguage;
  const nativeGate = input.record.gates.find(gate => gate.level === 'M1')!;
  const englishGate = input.record.gates.find(gate => gate.level === 'M2')!;
  const transliterationGate = input.record.gates.find(gate => gate.level === 'M3')!;
  const targetIsEnglish = languageBase(targetLanguage) === 'en';
  const formatReady = sameLanguage
    || (targetIsEnglish && englishGate.state === 'enabled')
    || (!targetIsEnglish && nativeGate.state === 'enabled');
  let status: AddressQlMultilingualRouteAssessment['status'] = 'blocked';
  let mode: AddressQlMultilingualRouteAssessment['mode'] =
    'source-gated-transliteration';
  let reasonCode = 'language_route_not_supported';
  let automaticTransformationAllowed = false;

  if (!sourceAllowed || !targetAllowed) {
    reasonCode = 'country_language_not_declared';
  } else if (sameLanguage) {
    status = 'ready';
    mode = 'identity-normalization';
    reasonCode = 'identity_normalization_only';
    automaticTransformationAllowed = true;
  } else if (formatReady && targetIsEnglish) {
    status = 'review_required';
    mode = 'international-english-formatting';
    reasonCode = 'place_name_translation_evidence_required';
  } else if (formatReady) {
    status = 'review_required';
    mode = 'native-formatting';
    reasonCode = 'native_place_name_evidence_required';
  }

  return {
    version: ADDRESSQL_MULTILINGUAL_QUALITY_VERSION,
    countryCode: input.record.countryCode,
    sourceLanguage,
    targetLanguage,
    purpose: input.purpose,
    status,
    mode,
    formatReady,
    automaticTransformationAllowed,
    humanReviewRequired: status !== 'ready',
    translationVerified: false,
    adapterFamilies: input.record.adapterFamilies,
    missingEvidence: sameLanguage
      ? []
      : transliterationGate.missingEvidence,
    reasonCode,
    nonClaims: [
      'This assessment accepts language metadata only and does not translate address text.',
      'Format readiness does not prove that a place-name translation is correct.',
      'A review-required route must not be treated as an automatic delivery label.',
    ],
  };
}

export function validateAddressQlMultilingualQuality(
  records: readonly AddressQlMultilingualQualityRecord[],
): string[] {
  const errors: string[] = [];
  const codes = new Set<string>();

  for (const record of records) {
    if (codes.has(record.countryCode)) {
      errors.push(`duplicate-multilingual-country:${record.countryCode}`);
    }
    codes.add(record.countryCode);
    if (record.gates.length !== ADDRESSQL_MULTILINGUAL_LEVELS.length) {
      errors.push(`${record.countryCode}:multilingual-gate-count`);
    }
    for (const gate of record.gates) {
      const approved = new Set(gate.approvedEvidence);
      const expectedMissing = gate.state === 'not_applicable'
        ? []
        : gate.requiredEvidence.filter(item => !approved.has(item));
      if (JSON.stringify(expectedMissing) !== JSON.stringify(gate.missingEvidence)) {
        errors.push(`${record.countryCode}:${gate.level}:missing-evidence-mismatch`);
      }
      if (gate.state === 'enabled' && gate.missingEvidence.length) {
        errors.push(`${record.countryCode}:${gate.level}:enabled-with-missing-evidence`);
      }
      if (
        ['M3', 'M4'].includes(gate.level)
        && gate.state === 'enabled'
        && (!record.independentQualityAttestationVerified
          || !record.automaticPlaceNameTranslationEnabled)
      ) {
        errors.push(`${record.countryCode}:${gate.level}:unsafe-automatic-translation`);
      }
    }
    if (
      record.privacy.acceptsAddressText
      || record.privacy.storesAddressText
      || record.privacy.logsAddressText
    ) {
      errors.push(`${record.countryCode}:multilingual-privacy-boundary`);
    }
  }

  return uniqueSorted(errors);
}
