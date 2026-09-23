import { sha256Hex } from './sha256';

export type ChinesePlaceNameCountryCode = 'CN' | 'TW' | 'HK' | 'MO' | 'SG';

export type ChinesePlaceNameReadingSystem =
  | 'hanyu-pinyin'
  | 'taiwan-established-english'
  | 'hong-kong-official-english'
  | 'macao-official-bilingual'
  | 'singapore-established-english';

export type ChinesePlaceNameReuseStatus =
  | 'reference-only-name-evidence-no-dataset-copied'
  | 'approved-open-data';

export type ChinesePlaceNameSource = {
  authority: string;
  url: string;
  termsUrl: string;
  version: string;
  checkedOn: string;
  scope: string;
  correctionPath: string;
  correctionUrl: string;
  correctionCheckedOn: string;
  reuseStatus: ChinesePlaceNameReuseStatus;
};

export const CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_EVIDENCE_VERSION =
  'agid-chinese-place-name-correction-endpoint-evidence-v2';
export const CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_DIGEST_ALGORITHM =
  'sha256-agid-chinese-place-name-correction-endpoint-evidence-v2';
export const CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_EVIDENCE_MAX_AGE_DAYS = 30;

export type ChinesePlaceNameCorrectionEndpointEvidence = {
  version: typeof CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_EVIDENCE_VERSION;
  digestAlgorithm: typeof CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_DIGEST_ALGORITHM;
  correctionUrl: string;
  observedAt: string;
  observerId: string;
  httpStatus: number;
  responseContentType: string;
  responseContentSha256: string;
  captureMethod: 'external-http-metadata-only';
  responseBodyStored: false;
  addressPayloadIncluded: false;
  evidenceDigest: string;
};

export type ChinesePlaceNameCorrectionEndpointEvidenceVerification = {
  valid: boolean;
  issues: readonly string[];
  sourceBound: boolean;
  freshnessVerified: boolean;
  privacyVerified: boolean;
};

export const CHINESE_PLACE_NAME_CORRECTION_MONITOR_KEY_REGISTRY_VERSION =
  'agid-chinese-place-name-correction-monitor-key-registry-v1';
export const CHINESE_PLACE_NAME_CORRECTION_MONITOR_SIGNATURE_DOMAIN =
  'agid-chinese-place-name-correction-monitor-ed25519-v1';

export type ChinesePlaceNameTrustedCorrectionMonitorKey = {
  keyId: string;
  monitorId: string;
  algorithm: 'Ed25519';
  purpose: 'correction-endpoint-observation';
  publicKeyBase64Url: string;
  status: 'trusted' | 'revoked';
  validFrom: string;
  validUntil: string;
  reviewedAt: string;
  reviewBy: string;
  registryUrl: string;
  revocationUrl: string;
};

export type ChinesePlaceNameCorrectionMonitorKeyRegistry = {
  version: typeof CHINESE_PLACE_NAME_CORRECTION_MONITOR_KEY_REGISTRY_VERSION;
  keys: readonly ChinesePlaceNameTrustedCorrectionMonitorKey[];
};

export type ChinesePlaceNameCorrectionEndpointSignature = {
  algorithm: 'Ed25519';
  keyId: string;
  signedAt: string;
  signatureBase64Url: string;
};

export type ChinesePlaceNameCorrectionEndpointSignatureVerification = {
  status: 'verified' | 'rejected';
  evidenceValid: boolean;
  trustValid: boolean;
  signatureValid: boolean;
  issues: readonly string[];
  monitorId?: string;
};

export type ChinesePlaceNameCorrectionEndpointSignatureBinding = {
  correctionUrl: string;
  evidenceDigest: string;
  signature: ChinesePlaceNameCorrectionEndpointSignature;
};

export type ChinesePlaceNameCorrectionEndpointSignatureSetVerification = {
  status: 'verified' | 'rejected';
  qualityEvidenceValid: boolean;
  expectedEndpointCount: number;
  verifiedEndpointCount: number;
  allEndpointsIndependentlyObserved: boolean;
  eligibleForIndependentQualityReview: boolean;
  issues: readonly string[];
  endpointSummaries: readonly {
    correctionUrl: string;
    status: 'verified' | 'rejected';
    monitorId?: string;
    issues: readonly string[];
  }[];
  deliveryClaimsEnabled: false;
};

export type ChinesePlaceNameSearchAlias = {
  value: string;
  readingTradition: string;
  usage: 'search-only';
  evidenceStatus: 'curated-compatibility';
};

export type ChineseRegionalPlaceNameRecord = {
  id: string;
  countryCode: ChinesePlaceNameCountryCode;
  nativeNames: readonly string[];
  englishName: string;
  readingSystem: ChinesePlaceNameReadingSystem;
  source: ChinesePlaceNameSource;
  searchAliases?: readonly ChinesePlaceNameSearchAlias[];
};

export type ChineseRegionalPlaceNameResolution =
  | {
      status: 'resolved';
      englishName: string;
      searchAliases: readonly ChinesePlaceNameSearchAlias[];
      record: ChineseRegionalPlaceNameRecord;
    }
  | { status: 'unmatched'; searchAliases: readonly [] }
  | { status: 'ambiguous'; searchAliases: readonly []; candidateIds: readonly string[] }
  | { status: 'rejected-evidence'; searchAliases: readonly []; issues: readonly string[] };

export type ChineseRegionalPlaceNameSuggestion = {
  recordId: string;
  nativeName: string;
  englishName: string;
  editDistance: 1;
  usage: 'candidate-only';
  automaticCorrectionAllowed: false;
};

export type ChineseRegionalPlaceNameSuggestionResult =
  | {
      status: 'exact-match';
      record: ChineseRegionalPlaceNameRecord;
      candidates: readonly [];
      automaticCorrectionAllowed: false;
    }
  | {
      status: 'suggested';
      candidates: readonly ChineseRegionalPlaceNameSuggestion[];
      automaticCorrectionAllowed: false;
    }
  | {
      status: 'unmatched' | 'rejected-input';
      candidates: readonly [];
      automaticCorrectionAllowed: false;
      issues: readonly string[];
    }
  | {
      status: 'rejected-evidence';
      candidates: readonly [];
      automaticCorrectionAllowed: false;
      issues: readonly string[];
    };

export type ChinesePlaceNameSuggestionHoldoutVector = {
  id: string;
  countryCode: ChinesePlaceNameCountryCode;
  nativeName: string;
  expected:
    | { status: 'suggested'; recordId: string }
    | { status: 'no-suggestion' };
};

export type ChinesePlaceNameSuggestionHoldoutReport = {
  total: number;
  expectedSuggestions: number;
  expectedNoSuggestions: number;
  top1Correct: number;
  topKCorrect: number;
  falseSuggestionCases: number;
  missedSuggestionCases: number;
  top1Accuracy: number;
  topKAccuracy: number;
  safeNoSuggestionRate: number;
  maxCandidates: number;
  countrySummaries: readonly {
    countryCode: ChinesePlaceNameCountryCode;
    total: number;
    expectedSuggestions: number;
    expectedNoSuggestions: number;
    top1Correct: number;
    falseSuggestionCases: number;
  }[];
  nonClaim: string;
};

export type ChinesePlaceNameSuggestionQualityPolicy = {
  requiredCountryCodes: readonly ChinesePlaceNameCountryCode[];
  minimumTotal: number;
  minimumPerCountry: number;
  minimumExpectedSuggestionsPerCountry: number;
  minimumExpectedNoSuggestionsPerCountry: number;
  minimumTop1Accuracy: number;
  minimumTopKAccuracy: number;
  minimumSafeNoSuggestionRate: number;
  maximumFalseSuggestionCases: number;
};

export const CHINESE_PLACE_NAME_SUGGESTION_QUALITY_GATE_VERSION =
  'agid-chinese-place-name-suggestion-quality-gate-v2';

export type ChinesePlaceNameSuggestionQualityGate = {
  version: typeof CHINESE_PLACE_NAME_SUGGESTION_QUALITY_GATE_VERSION;
  policy: ChinesePlaceNameSuggestionQualityPolicy;
  status: 'passed' | 'blocked';
  checks: readonly {
    id:
      | 'minimum-total'
      | 'country-coverage'
      | 'expected-suggestion-coverage'
      | 'expected-no-suggestion-coverage'
      | 'top1-accuracy'
      | 'topk-accuracy'
      | 'safe-no-suggestion'
      | 'false-suggestions';
    status: 'passed' | 'blocked';
    actual: number;
    required: string;
  }[];
  eligibleForVersionedHoldoutReview: boolean;
  automaticCorrectionEnabled: false;
  deliveryClaimsEnabled: false;
};

export const DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY:
ChinesePlaceNameSuggestionQualityPolicy = {
  requiredCountryCodes: ['CN', 'TW', 'HK', 'MO', 'SG'],
  minimumTotal: 500,
  minimumPerCountry: 100,
  minimumExpectedSuggestionsPerCountry: 50,
  minimumExpectedNoSuggestionsPerCountry: 50,
  minimumTop1Accuracy: 0.95,
  minimumTopKAccuracy: 0.995,
  minimumSafeNoSuggestionRate: 1,
  maximumFalseSuggestionCases: 0,
};

export const CHINESE_PLACE_NAME_INTAKE_SCHEMA_VERSION = 'agid-chinese-place-name-intake-v2';

export type ChineseRegionalPlaceNameBatchRecord = Omit<
  ChineseRegionalPlaceNameRecord,
  'countryCode' | 'source'
>;

export type ChineseRegionalPlaceNameBatchManifest = {
  schemaVersion: typeof CHINESE_PLACE_NAME_INTAKE_SCHEMA_VERSION;
  batchId: string;
  countryCode: ChinesePlaceNameCountryCode;
  source: ChinesePlaceNameSource;
  recordCount: number;
  records: readonly ChineseRegionalPlaceNameBatchRecord[];
};

export type ChineseRegionalPlaceNameIntakeResult =
  | {
      status: 'accepted';
      activation: 'candidate-only' | 'delivery-rendering';
      manifestKey: string;
      candidateRecords: readonly ChineseRegionalPlaceNameRecord[];
      deliveryRecords: readonly ChineseRegionalPlaceNameRecord[];
    }
  | {
      status: 'rejected';
      issues: readonly string[];
    };

export const CHINESE_PLACE_NAME_HOLDOUT_SCHEMA_VERSION =
  'agid-chinese-place-name-holdout-v2';

export type ChineseRegionalPlaceNameHoldoutVector = {
  id: string;
  countryCode: ChinesePlaceNameCountryCode;
  nativeName: string;
  expected:
    | { status: 'resolved'; englishName: string }
    | { status: 'deferred' };
};

export type ChineseRegionalPlaceNameHoldoutReport = {
  schemaVersion: typeof CHINESE_PLACE_NAME_HOLDOUT_SCHEMA_VERSION;
  total: number;
  resolvedExpected: number;
  deferredExpected: number;
  correct: number;
  incorrect: number;
  unsafeAutomaticResolutions: number;
  unexpectedDeferrals: number;
  accuracy: number;
  safeDeferralRate: number;
  countrySummaries: readonly {
    countryCode: ChinesePlaceNameCountryCode;
    total: number;
    resolvedExpected: number;
    deferredExpected: number;
    correct: number;
    unsafeAutomaticResolutions: number;
  }[];
  nonClaim: string;
};

export const CHINESE_PLACE_NAME_HOLDOUT_PACK_VERSION =
  'agid-chinese-place-name-holdout-pack-v3';
export const CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION =
  'agid-chinese-place-name-evaluation-engine-v5';

export type ChineseRegionalPlaceNameHoldoutPack = {
  version: typeof CHINESE_PLACE_NAME_HOLDOUT_PACK_VERSION;
  fixtureId: string;
  fixtureVersion: string;
  createdAt: string;
  curatorId: string;
  vectorCount: number;
  suggestionVectorCount: number;
  sources: readonly ChinesePlaceNameSource[];
  vectors: readonly ChineseRegionalPlaceNameHoldoutVector[];
  suggestionVectors: readonly ChinesePlaceNameSuggestionHoldoutVector[];
  fixtureDigest: string;
  evaluatorSeparationRequired: true;
  addressPayloadIncluded: false;
  preciseLocationIncluded: false;
};

export type ChineseRegionalPlaceNameVersionedHoldoutReport =
  ChineseRegionalPlaceNameHoldoutReport & {
    evaluationEngineVersion: typeof CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION;
    fixture: {
      fixtureId: string;
      fixtureVersion: string;
      fixtureDigest: string;
      createdAt: string;
      curatorId: string;
      evaluatorId: string;
      independenceVerified: true;
    };
  };

export type ChinesePlaceNameVersionedSuggestionHoldoutReport =
  ChinesePlaceNameSuggestionHoldoutReport & {
    evaluationEngineVersion: typeof CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION;
    fixture: {
      fixtureId: string;
      fixtureVersion: string;
      fixtureDigest: string;
      createdAt: string;
      curatorId: string;
      evaluatorId: string;
      independenceVerified: true;
    };
  };

export const CHINESE_PLACE_NAME_QUALITY_GATE_VERSION =
  'agid-chinese-place-name-quality-gate-v3';

export type ChineseRegionalPlaceNameQualityPolicy = {
  requiredCountryCodes: readonly ChinesePlaceNameCountryCode[];
  minimumTotal: number;
  minimumPerCountry: number;
  minimumResolvedPerCountry: number;
  minimumDeferredPerCountry: number;
  minimumAccuracy: number;
  minimumSafeDeferralRate: number;
  maximumUnsafeAutomaticResolutions: number;
};

export type ChineseRegionalPlaceNameQualityGateReport = {
  version: typeof CHINESE_PLACE_NAME_QUALITY_GATE_VERSION;
  policy: ChineseRegionalPlaceNameQualityPolicy;
  status: 'passed' | 'blocked';
  checks: readonly {
    id:
      | 'minimum-total'
      | 'country-coverage'
      | 'resolved-coverage'
      | 'deferred-coverage'
      | 'accuracy'
      | 'safe-deferral'
      | 'unsafe-automatic-resolutions';
    status: 'passed' | 'blocked';
    actual: number;
    required: string;
  }[];
  eligibleForIndependentReview: boolean;
  postalLookupEnabled: false;
  addressValidationEnabled: false;
  deliveryClaimsEnabled: false;
  nonClaim: string;
};

export const CHINESE_PLACE_NAME_QUALITY_EVIDENCE_VERSION =
  'agid-chinese-place-name-quality-evidence-v11';
export const CHINESE_PLACE_NAME_QUALITY_DIGEST_ALGORITHM =
  'sha256-agid-chinese-place-name-quality-evidence-v11';

export const CHINESE_PLACE_NAME_RECORD_SET_VERSION =
  'agid-chinese-place-name-record-set-v2';

export type ChineseRegionalPlaceNameRecordSetManifest = {
  version: typeof CHINESE_PLACE_NAME_RECORD_SET_VERSION;
  recordSetDigest: string;
  recordCount: number;
  countrySummaries: readonly {
    countryCode: ChinesePlaceNameCountryCode;
    recordCount: number;
  }[];
  sources: readonly (ChinesePlaceNameSource & {
    sourceId: string;
    recordCount: number;
    countryCodes: readonly ChinesePlaceNameCountryCode[];
  })[];
  placeNameValuesIncluded: false;
  addressPayloadIncluded: false;
  preciseLocationIncluded: false;
};

export type ChineseRegionalPlaceNameQualityEvidence = {
  version: typeof CHINESE_PLACE_NAME_QUALITY_EVIDENCE_VERSION;
  digestAlgorithm: typeof CHINESE_PLACE_NAME_QUALITY_DIGEST_ALGORITHM;
  reportId: string;
  fixtureVersion: string;
  evaluatedAt: string;
  evaluatorId: string;
  evaluationEngineVersion: typeof CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION;
  holdoutReport: ChineseRegionalPlaceNameVersionedHoldoutReport;
  qualityGateReport: ChineseRegionalPlaceNameQualityGateReport;
  suggestionHoldoutReport: ChinesePlaceNameVersionedSuggestionHoldoutReport;
  suggestionQualityGateReport: ChinesePlaceNameSuggestionQualityGate;
  evaluatedRecordSet: ChineseRegionalPlaceNameRecordSetManifest;
  correctionEndpointEvidence: readonly ChinesePlaceNameCorrectionEndpointEvidence[];
  reportDigest: string;
  signatureStatus: 'not-attached';
  independentReviewComplete: false;
  deliveryClaimsEnabled: false;
};

export type ChineseRegionalPlaceNameQualityEvidenceVerification = {
  valid: boolean;
  issues: readonly string[];
  recordSetVerified: boolean;
  holdoutPackVerified: boolean;
  productionPolicyVerified: boolean;
  freshnessVerified: boolean;
  correctionEndpointsVerified: boolean;
  eligibleForExternalSignature: boolean;
  independentReviewComplete: false;
  deliveryClaimsEnabled: false;
};

export const CHINESE_PLACE_NAME_REVIEW_KEY_REGISTRY_VERSION =
  'agid-chinese-place-name-review-key-registry-v1';
export const CHINESE_PLACE_NAME_REVIEW_SIGNATURE_DOMAIN =
  'agid-chinese-place-name-independent-review-ed25519-v1';

export type ChinesePlaceNameTrustedReviewerKey = {
  keyId: string;
  reviewerId: string;
  algorithm: 'Ed25519';
  purpose: 'chinese-place-name-quality-review';
  publicKeyBase64Url: string;
  status: 'trusted' | 'revoked';
  validFrom: string;
  validUntil: string;
  reviewedAt: string;
  reviewBy: string;
  registryUrl: string;
  revocationUrl: string;
};

export type ChinesePlaceNameReviewerKeyRegistry = {
  version: typeof CHINESE_PLACE_NAME_REVIEW_KEY_REGISTRY_VERSION;
  keys: readonly ChinesePlaceNameTrustedReviewerKey[];
};

export type ChinesePlaceNameIndependentReviewSignature = {
  algorithm: 'Ed25519';
  keyId: string;
  signedAt: string;
  signatureBase64Url: string;
};

export type ChinesePlaceNameIndependentReviewVerification = {
  status: 'verified' | 'rejected';
  digestValid: boolean;
  trustValid: boolean;
  signatureValid: boolean;
  issues: readonly string[];
  reviewerId?: string;
  independentReviewComplete: boolean;
  postalLookupEnabled: false;
  addressValidationEnabled: false;
  deliveryClaimsEnabled: false;
};

export const CHINESE_PLACE_NAME_QUALITY_EVIDENCE_MAX_AGE_DAYS = 90;
export const CHINESE_PLACE_NAME_SOURCE_REVIEW_MAX_AGE_DAYS = 400;

export const DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY:
ChineseRegionalPlaceNameQualityPolicy = {
  requiredCountryCodes: ['CN', 'TW', 'HK', 'MO', 'SG'],
  minimumTotal: 500,
  minimumPerCountry: 100,
  minimumResolvedPerCountry: 50,
  minimumDeferredPerCountry: 50,
  minimumAccuracy: 0.995,
  minimumSafeDeferralRate: 1,
  maximumUnsafeAutomaticResolutions: 0,
};

const SOURCES = {
  mainland: {
    authority: 'Standardization Administration of China, GB/T 38207-2019',
    url: 'https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=A76909D665CB4DE55DAB875F42523377',
    termsUrl: 'https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=A76909D665CB4DE55DAB875F42523377',
    version: 'GB/T 38207-2019',
    checkedOn: '2026-07-25',
    scope: 'Established modern delivery rendering plus non-rendering historical dialect search aliases.',
    correctionPath: 'AGID source-evidence review; official modern Hanyu Pinyin remains the delivery output.',
    correctionUrl: 'https://openstd.samr.gov.cn/bzgk/std/help',
    correctionCheckedOn: '2026-07-25',
    reuseStatus: 'reference-only-name-evidence-no-dataset-copied',
  },
  taiwan: {
    authority: 'Taiwan Ministry of the Interior place-name service',
    url: 'https://data.gov.tw/news/41',
    termsUrl: 'https://data.gov.tw/license',
    version: 'source-page-checked-2026-07-25',
    checkedOn: '2026-07-25',
    scope: 'Established English forms for selected municipality and locality names; no bulk dataset copied.',
    correctionPath: 'Use the source platform contact and dataset feedback process.',
    correctionUrl: 'https://data.gov.tw/comments',
    correctionCheckedOn: '2026-07-25',
    reuseStatus: 'approved-open-data',
  },
  hongKong: {
    authority: 'Hong Kong Lands Department Geographical Place Names Board',
    url: 'https://www.landsd.gov.hk/en/survey-mapping/mapping/street-geographical-place-naming/geographical-place-naming.html',
    termsUrl: 'https://www.landsd.gov.hk/en/survey-mapping/mapping/street-geographical-place-naming/geographical-place-naming.html',
    version: 'place-name-gazetteer-2026-05',
    checkedOn: '2026-07-25',
    scope: 'Selected English and Chinese geographical names used as reference evidence; no gazetteer copied.',
    correctionPath: 'Submit a geographical-place-name request to the Hong Kong Lands Department.',
    correctionUrl: 'https://www.landsd.gov.hk/en/about-us/contact-us.html',
    correctionCheckedOn: '2026-07-25',
    reuseStatus: 'reference-only-name-evidence-no-dataset-copied',
  },
  macao: {
    authority: 'Macao Land and Urban Construction Bureau address search',
    url: 'https://webmap.gis.gov.mo/AddressSearch/chn/',
    termsUrl: 'https://www.gov.mo/zh-hant/terms-of-use/',
    version: 'address-search-updated-2026-06-04',
    checkedOn: '2026-07-25',
    scope: 'Selected Chinese and Portuguese locality or street correspondences; no source dataset copied.',
    correctionPath: 'Use the Macao government portal or Land and Urban Construction Bureau contact channel.',
    correctionUrl: 'https://www.dsscu.gov.mo/zh/comment/node-56',
    correctionCheckedOn: '2026-07-25',
    reuseStatus: 'reference-only-name-evidence-no-dataset-copied',
  },
  singapore: {
    authority: 'Singapore Land Authority OneMap',
    url: 'https://www.onemap.gov.sg/home/index.html',
    termsUrl: 'https://www.onemap.gov.sg/legal/apitermsofservice.html',
    version: 'terms-checked-2026-07-25',
    checkedOn: '2026-07-25',
    scope: 'Selected established English locality names used as reference evidence; no API result copied.',
    correctionPath: 'Use the OneMap feedback channel and source-agency correction route.',
    correctionUrl: 'https://www.onemap.gov.sg/apidocs/contactus',
    correctionCheckedOn: '2026-07-25',
    reuseStatus: 'reference-only-name-evidence-no-dataset-copied',
  },
} as const satisfies Record<string, ChinesePlaceNameSource>;

function searchAlias(
  value: string,
  readingTradition: string,
): ChinesePlaceNameSearchAlias {
  return {
    value,
    readingTradition,
    usage: 'search-only',
    evidenceStatus: 'curated-compatibility',
  };
}

function record(
  countryCode: ChinesePlaceNameCountryCode,
  id: string,
  nativeNames: readonly string[],
  englishName: string,
  readingSystem: ChinesePlaceNameReadingSystem,
  source: ChinesePlaceNameSource,
  searchAliases: readonly ChinesePlaceNameSearchAlias[] = [],
): ChineseRegionalPlaceNameRecord {
  return { countryCode, id, nativeNames, englishName, readingSystem, source, searchAliases };
}

export const CHINESE_REGIONAL_PLACE_NAME_RECORDS: readonly ChineseRegionalPlaceNameRecord[] = [
  record('CN', 'cn-guangzhou', ['广州', '廣州', '广州市', '廣州市'], 'Guangzhou', 'hanyu-pinyin', SOURCES.mainland, [
    searchAlias('Canton', 'historical Cantonese exonym'),
  ]),
  record('CN', 'cn-xiamen', ['厦门', '廈門', '厦门市', '廈門市'], 'Xiamen', 'hanyu-pinyin', SOURCES.mainland, [
    searchAlias('Amoy', 'historical Hokkien exonym'),
  ]),
  record('CN', 'cn-shantou', ['汕头', '汕頭', '汕头市', '汕頭市'], 'Shantou', 'hanyu-pinyin', SOURCES.mainland, [
    searchAlias('Swatow', 'historical Teochew exonym'),
  ]),
  record('CN', 'cn-fuzhou', ['福州', '福州市'], 'Fuzhou', 'hanyu-pinyin', SOURCES.mainland, [
    searchAlias('Foochow', 'historical Foochow romanization'),
  ]),
  record('CN', 'cn-taishan', ['台山', '臺山', '台山市', '臺山市'], 'Taishan', 'hanyu-pinyin', SOURCES.mainland, [
    searchAlias('Toishan', 'Cantonese compatibility reading'),
  ]),

  record('TW', 'tw-taipei', ['台北', '臺北'], 'Taipei', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-taipei-city', ['台北市', '臺北市'], 'Taipei City', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-new-taipei', ['新北'], 'New Taipei', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-new-taipei-city', ['新北市'], 'New Taipei City', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-taoyuan', ['桃園', '桃园'], 'Taoyuan', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-taoyuan-city', ['桃園市', '桃园市'], 'Taoyuan City', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-taichung', ['台中', '臺中'], 'Taichung', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-taichung-city', ['台中市', '臺中市'], 'Taichung City', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-tainan', ['台南', '臺南'], 'Tainan', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-tainan-city', ['台南市', '臺南市'], 'Tainan City', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-kaohsiung', ['高雄'], 'Kaohsiung', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-kaohsiung-city', ['高雄市'], 'Kaohsiung City', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-keelung', ['基隆'], 'Keelung', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-keelung-city', ['基隆市'], 'Keelung City', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-hsinchu', ['新竹'], 'Hsinchu', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-hsinchu-city', ['新竹市'], 'Hsinchu City', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-chiayi', ['嘉義', '嘉义'], 'Chiayi', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-chiayi-city', ['嘉義市', '嘉义市'], 'Chiayi City', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-tamsui', ['淡水'], 'Tamsui', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-tamsui-district', ['淡水區', '淡水区'], 'Tamsui District', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-lukang', ['鹿港'], 'Lukang', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-lukang-township', ['鹿港鎮', '鹿港镇'], 'Lukang Township', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-kinmen', ['金門', '金门'], 'Kinmen', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-kinmen-county', ['金門縣', '金门县'], 'Kinmen County', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-lienchiang', ['連江', '连江'], 'Lienchiang', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-lienchiang-county', ['連江縣', '连江县'], 'Lienchiang County', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-penghu', ['澎湖'], 'Penghu', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-penghu-county', ['澎湖縣', '澎湖县'], 'Penghu County', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-xinyi', ['信義', '信义'], 'Xinyi', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-xinyi-district', ['信義區', '信义区'], 'Xinyi District', 'taiwan-established-english', SOURCES.taiwan),
  record('TW', 'tw-shifu-road', ['市府路'], 'Shifu Road', 'taiwan-established-english', SOURCES.taiwan),

  record('HK', 'hk-hong-kong', ['香港'], 'Hong Kong', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-hong-kong-island', ['香港島', '香港岛'], 'Hong Kong Island', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-kowloon', ['九龍', '九龙'], 'Kowloon', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-new-territories', ['新界'], 'New Territories', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-central', ['中環', '中环'], 'Central', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-sheung-wan', ['上環', '上环'], 'Sheung Wan', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-sai-wan', ['西環', '西环'], 'Sai Wan', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-wan-chai', ['灣仔', '湾仔'], 'Wan Chai', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-causeway-bay', ['銅鑼灣', '铜锣湾'], 'Causeway Bay', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-north-point', ['北角'], 'North Point', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-quarry-bay', ['鰂魚涌', '鲗鱼涌'], 'Quarry Bay', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-tsim-sha-tsui', ['尖沙咀'], 'Tsim Sha Tsui', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-mong-kok', ['旺角'], 'Mong Kok', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-yau-ma-tei', ['油麻地'], 'Yau Ma Tei', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-sham-shui-po', ['深水埗'], 'Sham Shui Po', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-sha-tin', ['沙田'], 'Sha Tin', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-tai-po', ['大埔'], 'Tai Po', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-sheung-shui', ['上水'], 'Sheung Shui', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-yuen-long', ['元朗'], 'Yuen Long', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-tuen-mun', ['屯門', '屯门'], 'Tuen Mun', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-tsuen-wan', ['荃灣', '荃湾'], 'Tsuen Wan', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-sai-kung', ['西貢', '西贡'], 'Sai Kung', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-tseung-kwan-o', ['將軍澳', '将军澳'], 'Tseung Kwan O', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-cheung-chau', ['長洲', '长洲'], 'Cheung Chau', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-nathan-road', ['彌敦道', '弥敦道'], 'Nathan Road', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-queens-road-central', ['皇后大道中'], "Queen's Road Central", 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-des-voeux-road-central', ['德輔道中', '德辅道中'], 'Des Voeux Road Central', 'hong-kong-official-english', SOURCES.hongKong),
  record('HK', 'hk-hennessy-road', ['軒尼詩道', '轩尼诗道'], 'Hennessy Road', 'hong-kong-official-english', SOURCES.hongKong),

  record('MO', 'mo-macao', ['澳門', '澳门'], 'Macao', 'macao-official-bilingual', SOURCES.macao, [
    searchAlias('Macau', 'established English compatibility spelling'),
  ]),
  record('MO', 'mo-macao-peninsula', ['澳門半島', '澳门半岛'], 'Macao Peninsula', 'macao-official-bilingual', SOURCES.macao),
  record('MO', 'mo-taipa', ['氹仔'], 'Taipa', 'macao-official-bilingual', SOURCES.macao),
  record('MO', 'mo-coloane', ['路環', '路环'], 'Coloane', 'macao-official-bilingual', SOURCES.macao),
  record('MO', 'mo-cotai', ['路氹'], 'Cotai', 'macao-official-bilingual', SOURCES.macao),
  record('MO', 'mo-almeida-ribeiro', ['新馬路', '新马路'], 'Avenida de Almeida Ribeiro', 'macao-official-bilingual', SOURCES.macao),
  record('MO', 'mo-amizade', ['友誼大馬路', '友谊大马路'], 'Avenida da Amizade', 'macao-official-bilingual', SOURCES.macao),
  record('MO', 'mo-sun-yat-sen', ['孫逸仙大馬路', '孙逸仙大马路'], 'Avenida Dr. Sun Yat-Sen', 'macao-official-bilingual', SOURCES.macao),

  record('SG', 'sg-chinatown', ['牛車水', '牛车水'], 'Chinatown', 'singapore-established-english', SOURCES.singapore),
  record('SG', 'sg-orchard-road', ['烏節路', '乌节路'], 'Orchard Road', 'singapore-established-english', SOURCES.singapore),
  record('SG', 'sg-hougang', ['後港', '后港'], 'Hougang', 'singapore-established-english', SOURCES.singapore),
  record('SG', 'sg-tampines', ['淡濱尼', '淡滨尼'], 'Tampines', 'singapore-established-english', SOURCES.singapore),
  record('SG', 'sg-jurong', ['裕廊'], 'Jurong', 'singapore-established-english', SOURCES.singapore),
  record('SG', 'sg-toa-payoh', ['大巴窯', '大巴窑'], 'Toa Payoh', 'singapore-established-english', SOURCES.singapore),
  record('SG', 'sg-bedok', ['勿洛'], 'Bedok', 'singapore-established-english', SOURCES.singapore),
  record('SG', 'sg-bukit-timah', ['武吉知馬', '武吉知马'], 'Bukit Timah', 'singapore-established-english', SOURCES.singapore),
  record('SG', 'sg-kallang', ['加冷'], 'Kallang', 'singapore-established-english', SOURCES.singapore),
];

const FORBIDDEN_RECORD_KEY = /(?:raw_?address|recipient|latitude|longitude|coordinates?|geometry|private_?key|proof_?secret|credentials?|query_?logs?)/i;
const COUNTRY_CODES = new Set<ChinesePlaceNameCountryCode>(['CN', 'TW', 'HK', 'MO', 'SG']);
const REUSE_STATUSES = new Set<ChinesePlaceNameReuseStatus>([
  'reference-only-name-evidence-no-dataset-copied',
  'approved-open-data',
]);
const READING_SYSTEM_BY_COUNTRY: Record<ChinesePlaceNameCountryCode, ChinesePlaceNameReadingSystem> = {
  CN: 'hanyu-pinyin',
  TW: 'taiwan-established-english',
  HK: 'hong-kong-official-english',
  MO: 'macao-official-bilingual',
  SG: 'singapore-established-english',
};
const HAN_PATTERN = /[\u3400-\u9fff]/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const MAX_BATCH_RECORDS = 10_000;

function normalizedName(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, '').trim();
}

function findForbiddenKeys(value: unknown, path = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  const issues: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const keyPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_RECORD_KEY.test(key)) issues.push(`${keyPath}: forbidden field`);
    issues.push(...findForbiddenKeys(nested, keyPath));
  }
  return issues;
}

function auditChinesePlaceNameSource(
  source: ChinesePlaceNameSource,
  path: string,
): string[] {
  const issues: string[] = [];
  if (!source.authority || !source.scope) {
    issues.push(`${path}: authority and scope are required`);
  }
  if (
    typeof source.url !== 'string'
    || !source.url.startsWith('https://')
    || typeof source.termsUrl !== 'string'
    || !source.termsUrl.startsWith('https://')
    || typeof source.correctionUrl !== 'string'
    || !source.correctionUrl.startsWith('https://')
  ) {
    issues.push(`${path}: HTTPS source, terms, and correction URLs are required`);
  }
  if (
    !source.version
    || !ISO_DATE_PATTERN.test(source.checkedOn)
    || !source.correctionPath
    || !ISO_DATE_PATTERN.test(source.correctionCheckedOn)
  ) {
    issues.push(
      `${path}: version, checkedOn, correctionPath, and correctionCheckedOn are required`,
    );
  }
  if (!REUSE_STATUSES.has(source.reuseStatus)) {
    issues.push(`${path}.reuseStatus: unsupported`);
  }
  return issues;
}

function parseIsoDate(value: string): number | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp : null;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, entry]) => (
    `${JSON.stringify(key)}:${stableStringify(entry)}`
  )).join(',')}}`;
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return new Uint8Array();
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64url'));
  }

  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function exactIsoTimestamp(value: string): number | null {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString() === value ? timestamp : null;
}

function correctionEndpointEvidencePayload(
  evidence: Omit<ChinesePlaceNameCorrectionEndpointEvidence, 'evidenceDigest'>,
) {
  return {
    domain: CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_DIGEST_ALGORITHM,
    ...evidence,
  };
}

export function buildChinesePlaceNameCorrectionEndpointEvidence(
  input: Omit<
    ChinesePlaceNameCorrectionEndpointEvidence,
    'version' | 'digestAlgorithm' | 'evidenceDigest'
  >,
): ChinesePlaceNameCorrectionEndpointEvidence {
  const unsigned = {
    version: CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_EVIDENCE_VERSION,
    digestAlgorithm: CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_DIGEST_ALGORITHM,
    ...input,
  } as const;
  return {
    ...unsigned,
    evidenceDigest: sha256Hex(
      stableStringify(correctionEndpointEvidencePayload(unsigned)),
    ),
  };
}

export function verifyChinesePlaceNameCorrectionEndpointEvidence(
  source: ChinesePlaceNameSource,
  evidence: ChinesePlaceNameCorrectionEndpointEvidence,
  options: {
    asOf?: string;
    maxAgeDays?: number;
  } = {},
): ChinesePlaceNameCorrectionEndpointEvidenceVerification {
  const issues = findForbiddenKeys(evidence);
  const asOf = options.asOf ?? new Date().toISOString();
  const maxAgeDays = options.maxAgeDays
    ?? CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_EVIDENCE_MAX_AGE_DAYS;
  const asOfTimestamp = exactIsoTimestamp(asOf);
  const observedAtTimestamp = exactIsoTimestamp(evidence.observedAt);
  const sourceBound = (
    typeof evidence.correctionUrl === 'string'
    && evidence.correctionUrl === source.correctionUrl
  );
  const privacyVerified = (
    evidence.captureMethod === 'external-http-metadata-only'
    && evidence.responseBodyStored === false
    && evidence.addressPayloadIncluded === false
    && issues.length === 0
  );

  if (evidence.version !== CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_EVIDENCE_VERSION) {
    issues.push('version: unsupported');
  }
  if (
    evidence.digestAlgorithm
    !== CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_DIGEST_ALGORITHM
  ) {
    issues.push('digestAlgorithm: unsupported');
  }
  if (
    typeof evidence.correctionUrl !== 'string'
    || !evidence.correctionUrl.startsWith('https://')
    || !sourceBound
  ) {
    issues.push('correctionUrl: must exactly match the source HTTPS correction URL');
  }
  if (!/^[a-z0-9][a-z0-9._-]{2,199}$/.test(evidence.observerId)) {
    issues.push('observerId: invalid');
  }
  if (
    !Number.isInteger(evidence.httpStatus)
    || evidence.httpStatus < 200
    || evidence.httpStatus > 299
  ) {
    issues.push('httpStatus: a final 2xx response is required');
  }
  if (
    typeof evidence.responseContentType !== 'string'
    || !/^(?:text\/(?:html|plain)|application\/json)(?:\s*;|$)/i
      .test(evidence.responseContentType)
  ) {
    issues.push('responseContentType: unsupported');
  }
  if (!/^[0-9a-f]{64}$/.test(evidence.responseContentSha256)) {
    issues.push('responseContentSha256: invalid');
  }
  const {
    evidenceDigest: _evidenceDigest,
    ...unsignedEvidence
  } = evidence;
  const expectedEvidenceDigest = sha256Hex(
    stableStringify(correctionEndpointEvidencePayload(unsignedEvidence)),
  );
  if (!/^[0-9a-f]{64}$/.test(evidence.evidenceDigest)) {
    issues.push('evidenceDigest: invalid SHA-256 encoding');
  } else if (evidence.evidenceDigest !== expectedEvidenceDigest) {
    issues.push('evidenceDigest: mismatch');
  }
  if (!privacyVerified) {
    issues.push('privacy declarations or capture method are invalid');
  }
  if (!Number.isFinite(maxAgeDays) || maxAgeDays < 0) {
    issues.push('maxAgeDays: must be a non-negative finite number');
  }

  let freshnessVerified = false;
  if (asOfTimestamp === null) {
    issues.push('asOf: must be an exact ISO timestamp');
  }
  if (observedAtTimestamp === null) {
    issues.push('observedAt: must be an exact ISO timestamp');
  }
  if (
    asOfTimestamp !== null
    && observedAtTimestamp !== null
    && Number.isFinite(maxAgeDays)
    && maxAgeDays >= 0
  ) {
    if (observedAtTimestamp > asOfTimestamp) {
      issues.push('observedAt: cannot be in the future');
    } else if (
      asOfTimestamp - observedAtTimestamp > maxAgeDays * DAY_MILLISECONDS
    ) {
      issues.push('observedAt: correction endpoint evidence is stale');
    } else {
      freshnessVerified = true;
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    sourceBound,
    freshnessVerified,
    privacyVerified,
  };
}

function ownedArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

export function auditChineseRegionalPlaceNameRecords(
  records: readonly ChineseRegionalPlaceNameRecord[],
): readonly string[] {
  const issues = findForbiddenKeys(records);
  const ids = new Set<string>();
  const names = new Map<string, string>();

  for (const [index, item] of records.entries()) {
    const path = `records[${index}]`;
    if (!item.id || ids.has(item.id)) issues.push(`${path}.id: missing or duplicate`);
    ids.add(item.id);
    if (!COUNTRY_CODES.has(item.countryCode)) issues.push(`${path}.countryCode: unsupported`);
    if (!item.englishName || HAN_PATTERN.test(item.englishName)) issues.push(`${path}.englishName: must be non-Han delivery text`);
    if (!item.nativeNames.length || item.nativeNames.some(name => !HAN_PATTERN.test(name) || /\d/.test(name))) {
      issues.push(`${path}.nativeNames: must contain non-address Han place names without numbers`);
    }
    issues.push(...auditChinesePlaceNameSource(item.source, `${path}.source`));
    if (item.searchAliases?.some(alias => alias.usage !== 'search-only')) {
      issues.push(`${path}.searchAliases: dialect and historical aliases must remain search-only`);
    }

    for (const name of item.nativeNames) {
      const key = `${item.countryCode}:${normalizedName(name)}`;
      const existing = names.get(key);
      if (existing && existing !== item.englishName) issues.push(`${path}.nativeNames: conflicting delivery names for ${name}`);
      names.set(key, item.englishName);
    }
  }

  return issues;
}

export function intakeChineseRegionalPlaceNameBatch(
  manifest: ChineseRegionalPlaceNameBatchManifest,
  options: {
    asOf?: string;
    maxSourceAgeDays?: number;
    existingRecords?: readonly ChineseRegionalPlaceNameRecord[];
  } = {},
): ChineseRegionalPlaceNameIntakeResult {
  const issues = findForbiddenKeys(manifest);
  const asOf = options.asOf ?? new Date().toISOString().slice(0, 10);
  const maxSourceAgeDays = options.maxSourceAgeDays ?? 400;
  const existingRecords = options.existingRecords ?? CHINESE_REGIONAL_PLACE_NAME_RECORDS;

  if (manifest.schemaVersion !== CHINESE_PLACE_NAME_INTAKE_SCHEMA_VERSION) {
    issues.push('schemaVersion: unsupported');
  }
  if (!/^[a-z0-9][a-z0-9._-]{2,79}$/.test(manifest.batchId)) {
    issues.push('batchId: invalid');
  }
  if (!COUNTRY_CODES.has(manifest.countryCode)) {
    issues.push('countryCode: unsupported');
  }
  if (!Number.isInteger(manifest.recordCount) || manifest.recordCount !== manifest.records.length) {
    issues.push('recordCount: must equal records.length');
  }
  if (manifest.records.length < 1 || manifest.records.length > MAX_BATCH_RECORDS) {
    issues.push(`records: batch size must be between 1 and ${MAX_BATCH_RECORDS}`);
  }
  if (!Number.isFinite(maxSourceAgeDays) || maxSourceAgeDays < 0) {
    issues.push('maxSourceAgeDays: must be a non-negative finite number');
  }
  issues.push(...auditChinesePlaceNameSource(manifest.source, 'source'));

  const asOfTimestamp = parseIsoDate(asOf);
  const checkedOnTimestamp = parseIsoDate(manifest.source.checkedOn);
  const correctionCheckedOnTimestamp = parseIsoDate(
    manifest.source.correctionCheckedOn,
  );
  if (asOfTimestamp === null) {
    issues.push('asOf: invalid ISO date');
  } else if (checkedOnTimestamp === null) {
    issues.push('source.checkedOn: invalid ISO date');
  } else {
    if (checkedOnTimestamp > asOfTimestamp) issues.push('source.checkedOn: cannot be in the future');
    if (
      Number.isFinite(maxSourceAgeDays)
      && maxSourceAgeDays >= 0
      && asOfTimestamp - checkedOnTimestamp > maxSourceAgeDays * DAY_MILLISECONDS
    ) {
      issues.push('source.checkedOn: source review is stale');
    }
  }
  if (asOfTimestamp !== null) {
    if (correctionCheckedOnTimestamp === null) {
      issues.push('source.correctionCheckedOn: invalid ISO date');
    } else {
      if (correctionCheckedOnTimestamp > asOfTimestamp) {
        issues.push('source.correctionCheckedOn: cannot be in the future');
      }
      if (
        Number.isFinite(maxSourceAgeDays)
        && maxSourceAgeDays >= 0
        && asOfTimestamp - correctionCheckedOnTimestamp
          > maxSourceAgeDays * DAY_MILLISECONDS
      ) {
        issues.push('source.correctionCheckedOn: correction route review is stale');
      }
    }
  }

  const expectedReadingSystem = READING_SYSTEM_BY_COUNTRY[manifest.countryCode];
  for (const [index, item] of manifest.records.entries()) {
    const runtimeRecord = item as ChineseRegionalPlaceNameBatchRecord & {
      countryCode?: unknown;
      source?: unknown;
    };
    if (Object.prototype.hasOwnProperty.call(runtimeRecord, 'countryCode')) {
      issues.push(`records[${index}].countryCode: must be declared by the manifest`);
    }
    if (Object.prototype.hasOwnProperty.call(runtimeRecord, 'source')) {
      issues.push(`records[${index}].source: must be declared by the manifest`);
    }
    if (!item.id.startsWith(`${manifest.countryCode.toLowerCase()}-`)) {
      issues.push(`records[${index}].id: must use the country prefix`);
    }
    if (item.readingSystem !== expectedReadingSystem) {
      issues.push(`records[${index}].readingSystem: does not match country policy`);
    }
  }

  const candidateRecords = manifest.records
    .map(item => ({
      ...item,
      countryCode: manifest.countryCode,
      source: { ...manifest.source },
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  issues.push(...auditChineseRegionalPlaceNameRecords([...existingRecords, ...candidateRecords]));

  if (issues.length) {
    return {
      status: 'rejected',
      issues: [...new Set(issues)].sort(),
    };
  }

  const activation = manifest.source.reuseStatus === 'approved-open-data'
    ? 'delivery-rendering'
    : 'candidate-only';
  return {
    status: 'accepted',
    activation,
    manifestKey: [
      manifest.schemaVersion,
      manifest.batchId,
      manifest.countryCode,
      manifest.source.version,
      manifest.recordCount,
    ].join(':'),
    candidateRecords,
    deliveryRecords: activation === 'delivery-rendering' ? candidateRecords : [],
  };
}

/**
 * Returns aggregate-only quality metrics without retaining vector text or
 * per-case outcomes in the report.
 */
export function evaluateChineseRegionalPlaceNameHoldout(input: {
  vectors: readonly ChineseRegionalPlaceNameHoldoutVector[];
  records?: readonly ChineseRegionalPlaceNameRecord[];
}): ChineseRegionalPlaceNameHoldoutReport {
  const forbiddenIssues = findForbiddenKeys(input.vectors);
  if (forbiddenIssues.length) {
    throw new Error('Chinese place-name holdout vectors contain forbidden fields');
  }

  const vectorIds = new Set<string>();
  const caseFingerprints = new Set<string>();
  for (const vector of input.vectors) {
    if (!vector.id || vectorIds.has(vector.id)) {
      throw new Error('Chinese place-name holdout vector IDs must be unique and non-empty');
    }
    vectorIds.add(vector.id);
    if (!COUNTRY_CODES.has(vector.countryCode)) {
      throw new Error('Chinese place-name holdout country is unsupported');
    }
    const normalizedInput = normalizedName(vector.nativeName);
    if (!normalizedInput) {
      throw new Error('Chinese place-name holdout nativeName must be non-empty');
    }
    const caseFingerprint = `${vector.countryCode}:${normalizedInput}`;
    if (caseFingerprints.has(caseFingerprint)) {
      throw new Error(
        'Chinese place-name holdout cases must have unique country and normalized input fingerprints',
      );
    }
    caseFingerprints.add(caseFingerprint);
  }

  const countryCounts = new Map<ChinesePlaceNameCountryCode, {
    total: number;
    resolvedExpected: number;
    deferredExpected: number;
    correct: number;
    unsafeAutomaticResolutions: number;
  }>();
  let resolvedExpected = 0;
  let deferredExpected = 0;
  let correct = 0;
  let unsafeAutomaticResolutions = 0;
  let unexpectedDeferrals = 0;
  let safeDeferrals = 0;

  for (const vector of input.vectors) {
    const country = countryCounts.get(vector.countryCode) ?? {
      total: 0,
      resolvedExpected: 0,
      deferredExpected: 0,
      correct: 0,
      unsafeAutomaticResolutions: 0,
    };
    country.total += 1;
    countryCounts.set(vector.countryCode, country);

    const resolution = resolveChineseRegionalPlaceName({
      countryCode: vector.countryCode,
      nativeName: vector.nativeName,
      records: input.records,
    });
    const resolved = resolution.status === 'resolved';

    if (vector.expected.status === 'resolved') {
      resolvedExpected += 1;
      country.resolvedExpected += 1;
      if (!resolved) {
        unexpectedDeferrals += 1;
        continue;
      }
      if (
        normalizedName(resolution.englishName).toLocaleLowerCase('en')
        === normalizedName(vector.expected.englishName).toLocaleLowerCase('en')
      ) {
        correct += 1;
        country.correct += 1;
      } else {
        unsafeAutomaticResolutions += 1;
        country.unsafeAutomaticResolutions += 1;
      }
      continue;
    }

    deferredExpected += 1;
    country.deferredExpected += 1;
    if (resolved) {
      unsafeAutomaticResolutions += 1;
      country.unsafeAutomaticResolutions += 1;
    } else {
      correct += 1;
      safeDeferrals += 1;
      country.correct += 1;
    }
  }

  const total = input.vectors.length;
  return {
    schemaVersion: CHINESE_PLACE_NAME_HOLDOUT_SCHEMA_VERSION,
    total,
    resolvedExpected,
    deferredExpected,
    correct,
    incorrect: total - correct,
    unsafeAutomaticResolutions,
    unexpectedDeferrals,
    accuracy: total ? correct / total : 1,
    safeDeferralRate: deferredExpected ? safeDeferrals / deferredExpected : 1,
    countrySummaries: [...countryCounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([countryCode, counts]) => ({ countryCode, ...counts })),
    nonClaim: 'Synthetic aggregate-only place-name evaluation does not validate an address, postcode, route, boundary, coordinate, or delivery point.',
  };
}

function holdoutPackDigestPayload(
  pack: Omit<ChineseRegionalPlaceNameHoldoutPack, 'fixtureDigest'>,
) {
  return {
    domain: CHINESE_PLACE_NAME_HOLDOUT_PACK_VERSION,
    ...pack,
  };
}

function auditChineseRegionalPlaceNameHoldoutPack(
  pack: ChineseRegionalPlaceNameHoldoutPack,
): string[] {
  const issues = findForbiddenKeys(pack);
  if (pack.version !== CHINESE_PLACE_NAME_HOLDOUT_PACK_VERSION) {
    issues.push('version: unsupported');
  }
  if (!/^[a-z0-9][a-z0-9._-]{2,79}$/.test(pack.fixtureId)) {
    issues.push('fixtureId: invalid');
  }
  if (!pack.fixtureVersion.trim() || pack.fixtureVersion.length > 120) {
    issues.push('fixtureVersion: invalid');
  }
  if (!pack.curatorId.trim() || pack.curatorId.length > 200) {
    issues.push('curatorId: invalid');
  }
  if (
    !Number.isInteger(pack.vectorCount)
    || pack.vectorCount < 1
    || pack.vectorCount !== pack.vectors.length
  ) {
    issues.push('vectorCount: must match a non-empty vector set');
  }
  if (
    !Number.isInteger(pack.suggestionVectorCount)
    || pack.suggestionVectorCount < 0
    || pack.suggestionVectorCount !== pack.suggestionVectors.length
  ) {
    issues.push('suggestionVectorCount: must match suggestionVectors');
  }
  if (!pack.sources.length) issues.push('sources: at least one source is required');
  if (
    pack.evaluatorSeparationRequired !== true
    || pack.addressPayloadIncluded !== false
    || pack.preciseLocationIncluded !== false
  ) {
    issues.push('privacy and evaluator-separation declarations are invalid');
  }

  const createdAt = exactIsoTimestamp(pack.createdAt);
  if (createdAt === null) issues.push('createdAt: must be an exact ISO timestamp');
  const sourceKeys = new Set<string>();
  for (const [index, source] of pack.sources.entries()) {
    const path = `sources[${index}]`;
    issues.push(...auditChinesePlaceNameSource(source, path));
    const sourceKey = stableStringify(source);
    if (sourceKeys.has(sourceKey)) issues.push(`${path}: duplicate source`);
    sourceKeys.add(sourceKey);
    const checkedOn = parseIsoDate(source.checkedOn);
    const correctionCheckedOn = parseIsoDate(source.correctionCheckedOn);
    if (
      checkedOn === null
      || correctionCheckedOn === null
      || createdAt === null
      || checkedOn > createdAt
      || createdAt - checkedOn > 400 * DAY_MILLISECONDS
      || correctionCheckedOn > createdAt
      || createdAt - correctionCheckedOn > 400 * DAY_MILLISECONDS
    ) {
      issues.push(`${path}: source or correction review is future, invalid, or stale`);
    }
  }

  try {
    evaluateChineseRegionalPlaceNameHoldout({ vectors: pack.vectors, records: [] });
  } catch (error) {
    issues.push(`vectors: ${error instanceof Error ? error.message : 'invalid'}`);
  }
  try {
    evaluateChinesePlaceNameSuggestionHoldout({
      vectors: pack.suggestionVectors,
      records: [],
    });
  } catch (error) {
    issues.push(`suggestionVectors: ${error instanceof Error ? error.message : 'invalid'}`);
  }
  const readingVectorIds = new Set(pack.vectors.map(vector => vector.id));
  if (pack.suggestionVectors.some(vector => readingVectorIds.has(vector.id))) {
    issues.push('vectors: IDs must be unique across reading and suggestion sets');
  }
  const {
    fixtureDigest: _fixtureDigest,
    ...unsigned
  } = pack;
  const expectedDigest = sha256Hex(stableStringify(holdoutPackDigestPayload(unsigned)));
  if (!/^[0-9a-f]{64}$/.test(pack.fixtureDigest)) {
    issues.push('fixtureDigest: invalid SHA-256 encoding');
  } else if (pack.fixtureDigest !== expectedDigest) {
    issues.push('fixtureDigest: mismatch');
  }
  return issues;
}

export function buildChineseRegionalPlaceNameHoldoutPack(input: {
  fixtureId: string;
  fixtureVersion: string;
  createdAt: string;
  curatorId: string;
  sources: readonly ChinesePlaceNameSource[];
  vectors: readonly ChineseRegionalPlaceNameHoldoutVector[];
  suggestionVectors?: readonly ChinesePlaceNameSuggestionHoldoutVector[];
}): ChineseRegionalPlaceNameHoldoutPack {
  const suggestionVectors = input.suggestionVectors ?? [];
  const unsigned = {
    version: CHINESE_PLACE_NAME_HOLDOUT_PACK_VERSION,
    fixtureId: input.fixtureId,
    fixtureVersion: input.fixtureVersion,
    createdAt: input.createdAt,
    curatorId: input.curatorId,
    vectorCount: input.vectors.length,
    suggestionVectorCount: suggestionVectors.length,
    sources: [...input.sources]
      .sort((left, right) => stableStringify(left).localeCompare(stableStringify(right))),
    vectors: [...input.vectors].sort((left, right) => left.id.localeCompare(right.id)),
    suggestionVectors: [...suggestionVectors]
      .sort((left, right) => left.id.localeCompare(right.id)),
    evaluatorSeparationRequired: true,
    addressPayloadIncluded: false,
    preciseLocationIncluded: false,
  } as const;
  const pack: ChineseRegionalPlaceNameHoldoutPack = {
    ...unsigned,
    fixtureDigest: sha256Hex(stableStringify(holdoutPackDigestPayload(unsigned))),
  };
  const issues = auditChineseRegionalPlaceNameHoldoutPack(pack);
  if (issues.length) {
    throw new Error(`Chinese place-name holdout pack is invalid: ${issues.join('; ')}`);
  }
  return pack;
}

export function evaluateChineseRegionalPlaceNameHoldoutPack(input: {
  pack: ChineseRegionalPlaceNameHoldoutPack;
  evaluatorId: string;
  records?: readonly ChineseRegionalPlaceNameRecord[];
}): ChineseRegionalPlaceNameVersionedHoldoutReport {
  const issues = auditChineseRegionalPlaceNameHoldoutPack(input.pack);
  if (!input.evaluatorId.trim() || input.evaluatorId.length > 200) {
    issues.push('evaluatorId: invalid');
  }
  if (input.evaluatorId === input.pack.curatorId) {
    issues.push('evaluatorId: evaluator and holdout curator must differ');
  }
  if (issues.length) {
    throw new Error(`Chinese place-name holdout evaluation is blocked: ${issues.join('; ')}`);
  }

  return {
    evaluationEngineVersion: CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION,
    ...evaluateChineseRegionalPlaceNameHoldout({
      vectors: input.pack.vectors,
      records: input.records,
    }),
    fixture: {
      fixtureId: input.pack.fixtureId,
      fixtureVersion: input.pack.fixtureVersion,
      fixtureDigest: input.pack.fixtureDigest,
      createdAt: input.pack.createdAt,
      curatorId: input.pack.curatorId,
      evaluatorId: input.evaluatorId,
      independenceVerified: true,
    },
  };
}

export function evaluateChinesePlaceNameSuggestionHoldoutPack(input: {
  pack: ChineseRegionalPlaceNameHoldoutPack;
  evaluatorId: string;
  maxCandidates?: number;
  records?: readonly ChineseRegionalPlaceNameRecord[];
}): ChinesePlaceNameVersionedSuggestionHoldoutReport {
  const issues = auditChineseRegionalPlaceNameHoldoutPack(input.pack);
  if (!input.evaluatorId.trim() || input.evaluatorId.length > 200) {
    issues.push('evaluatorId: invalid');
  }
  if (input.evaluatorId === input.pack.curatorId) {
    issues.push('evaluatorId: evaluator and holdout curator must differ');
  }
  if (!input.pack.suggestionVectorCount) {
    issues.push('suggestionVectors: a non-empty suggestion holdout is required');
  }
  if (issues.length) {
    throw new Error(`Chinese suggestion holdout evaluation is blocked: ${issues.join('; ')}`);
  }

  return {
    evaluationEngineVersion: CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION,
    ...evaluateChinesePlaceNameSuggestionHoldout({
      vectors: input.pack.suggestionVectors,
      maxCandidates: input.maxCandidates,
      records: input.records,
    }),
    fixture: {
      fixtureId: input.pack.fixtureId,
      fixtureVersion: input.pack.fixtureVersion,
      fixtureDigest: input.pack.fixtureDigest,
      createdAt: input.pack.createdAt,
      curatorId: input.pack.curatorId,
      evaluatorId: input.evaluatorId,
      independenceVerified: true,
    },
  };
}

export function assessChineseRegionalPlaceNameHoldout(
  report: ChineseRegionalPlaceNameHoldoutReport,
  policy: ChineseRegionalPlaceNameQualityPolicy =
    DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY,
): ChineseRegionalPlaceNameQualityGateReport {
  const requiredCountryCodes = [...new Set(policy.requiredCountryCodes)];
  const rates = [policy.minimumAccuracy, policy.minimumSafeDeferralRate];
  if (
    !requiredCountryCodes.length
    || requiredCountryCodes.some(code => !COUNTRY_CODES.has(code))
    || requiredCountryCodes.length !== policy.requiredCountryCodes.length
    || !Number.isInteger(policy.minimumTotal)
    || policy.minimumTotal < 1
    || !Number.isInteger(policy.minimumPerCountry)
    || policy.minimumPerCountry < 1
    || !Number.isInteger(policy.minimumResolvedPerCountry)
    || policy.minimumResolvedPerCountry < 0
    || !Number.isInteger(policy.minimumDeferredPerCountry)
    || policy.minimumDeferredPerCountry < 0
    || policy.minimumResolvedPerCountry + policy.minimumDeferredPerCountry
      > policy.minimumPerCountry
    || policy.minimumTotal < policy.minimumPerCountry * requiredCountryCodes.length
    || rates.some(rate => !Number.isFinite(rate) || rate < 0 || rate > 1)
    || !Number.isInteger(policy.maximumUnsafeAutomaticResolutions)
    || policy.maximumUnsafeAutomaticResolutions < 0
  ) {
    throw new Error('Chinese place-name quality policy is invalid');
  }
  if (report.schemaVersion !== CHINESE_PLACE_NAME_HOLDOUT_SCHEMA_VERSION) {
    throw new Error('Chinese place-name holdout report schema is unsupported');
  }

  const countrySummaries = new Map(
    report.countrySummaries.map(summary => [summary.countryCode, summary]),
  );
  const coveredCountries = requiredCountryCodes.filter(
    countryCode => (countrySummaries.get(countryCode)?.total ?? 0)
      >= policy.minimumPerCountry,
  ).length;
  const resolvedCoveredCountries = requiredCountryCodes.filter(
    countryCode => (countrySummaries.get(countryCode)?.resolvedExpected ?? 0)
      >= policy.minimumResolvedPerCountry,
  ).length;
  const deferredCoveredCountries = requiredCountryCodes.filter(
    countryCode => (countrySummaries.get(countryCode)?.deferredExpected ?? 0)
      >= policy.minimumDeferredPerCountry,
  ).length;
  const checks: ChineseRegionalPlaceNameQualityGateReport['checks'] = [
    {
      id: 'minimum-total',
      status: report.total >= policy.minimumTotal ? 'passed' : 'blocked',
      actual: report.total,
      required: `>=${policy.minimumTotal}`,
    },
    {
      id: 'country-coverage',
      status: coveredCountries === requiredCountryCodes.length ? 'passed' : 'blocked',
      actual: coveredCountries,
      required: `${requiredCountryCodes.length} countries with >=${policy.minimumPerCountry} cases each`,
    },
    {
      id: 'resolved-coverage',
      status: resolvedCoveredCountries === requiredCountryCodes.length
        ? 'passed'
        : 'blocked',
      actual: resolvedCoveredCountries,
      required: `${requiredCountryCodes.length} countries with >=${policy.minimumResolvedPerCountry} resolved cases each`,
    },
    {
      id: 'deferred-coverage',
      status: deferredCoveredCountries === requiredCountryCodes.length
        ? 'passed'
        : 'blocked',
      actual: deferredCoveredCountries,
      required: `${requiredCountryCodes.length} countries with >=${policy.minimumDeferredPerCountry} deferred cases each`,
    },
    {
      id: 'accuracy',
      status: report.accuracy >= policy.minimumAccuracy ? 'passed' : 'blocked',
      actual: report.accuracy,
      required: `>=${policy.minimumAccuracy}`,
    },
    {
      id: 'safe-deferral',
      status: report.safeDeferralRate >= policy.minimumSafeDeferralRate ? 'passed' : 'blocked',
      actual: report.safeDeferralRate,
      required: `>=${policy.minimumSafeDeferralRate}`,
    },
    {
      id: 'unsafe-automatic-resolutions',
      status: report.unsafeAutomaticResolutions <= policy.maximumUnsafeAutomaticResolutions
        ? 'passed'
        : 'blocked',
      actual: report.unsafeAutomaticResolutions,
      required: `<=${policy.maximumUnsafeAutomaticResolutions}`,
    },
  ];
  const status = checks.every(check => check.status === 'passed')
    ? 'passed'
    : 'blocked';

  return {
    version: CHINESE_PLACE_NAME_QUALITY_GATE_VERSION,
    policy: {
      ...policy,
      requiredCountryCodes: [...requiredCountryCodes].sort(),
    },
    status,
    checks,
    eligibleForIndependentReview: status === 'passed',
    postalLookupEnabled: false,
    addressValidationEnabled: false,
    deliveryClaimsEnabled: false,
    nonClaim: 'Passing this synthetic quality gate permits independent review only; it does not prove source rights, address validity, routing, or delivery-point reachability.',
  };
}

function canonicalRecordSetPayload(
  records: readonly ChineseRegionalPlaceNameRecord[],
) {
  return records
    .map(item => ({
      id: item.id,
      countryCode: item.countryCode,
      nativeNames: [...item.nativeNames].sort(),
      englishName: item.englishName,
      readingSystem: item.readingSystem,
      source: item.source,
      searchAliases: [...(item.searchAliases ?? [])]
        .sort((left, right) => left.value.localeCompare(right.value)),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function buildChineseRegionalPlaceNameRecordSetManifest(
  records: readonly ChineseRegionalPlaceNameRecord[],
): ChineseRegionalPlaceNameRecordSetManifest {
  const recordIssues = auditChineseRegionalPlaceNameRecords(records);
  if (recordIssues.length) {
    throw new Error(`Chinese place-name record set is invalid: ${recordIssues.join('; ')}`);
  }

  const countryCounts = new Map<ChinesePlaceNameCountryCode, number>();
  const sourceGroups = new Map<string, {
    source: ChinesePlaceNameSource;
    recordCount: number;
    countryCodes: Set<ChinesePlaceNameCountryCode>;
  }>();
  for (const item of records) {
    countryCounts.set(item.countryCode, (countryCounts.get(item.countryCode) ?? 0) + 1);
    const sourceKey = stableStringify(item.source);
    const group = sourceGroups.get(sourceKey) ?? {
      source: item.source,
      recordCount: 0,
      countryCodes: new Set<ChinesePlaceNameCountryCode>(),
    };
    group.recordCount += 1;
    group.countryCodes.add(item.countryCode);
    sourceGroups.set(sourceKey, group);
  }

  return {
    version: CHINESE_PLACE_NAME_RECORD_SET_VERSION,
    recordSetDigest: sha256Hex(stableStringify({
      domain: CHINESE_PLACE_NAME_RECORD_SET_VERSION,
      records: canonicalRecordSetPayload(records),
    })),
    recordCount: records.length,
    countrySummaries: [...countryCounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([countryCode, recordCount]) => ({ countryCode, recordCount })),
    sources: [...sourceGroups.entries()]
      .map(([sourceKey, group]) => ({
        ...group.source,
        sourceId: `cprs-${sha256Hex(sourceKey).slice(0, 20)}`,
        recordCount: group.recordCount,
        countryCodes: [...group.countryCodes].sort(),
      }))
      .sort((left, right) => left.sourceId.localeCompare(right.sourceId)),
    placeNameValuesIncluded: false,
    addressPayloadIncluded: false,
    preciseLocationIncluded: false,
  };
}

function auditChineseRegionalPlaceNameRecordSetManifest(
  manifest: ChineseRegionalPlaceNameRecordSetManifest,
  evaluatedAt: string,
): string[] {
  const issues: string[] = [];
  if (manifest.version !== CHINESE_PLACE_NAME_RECORD_SET_VERSION) {
    issues.push('evaluatedRecordSet.version: unsupported');
  }
  if (!/^[0-9a-f]{64}$/.test(manifest.recordSetDigest)) {
    issues.push('evaluatedRecordSet.recordSetDigest: invalid');
  }
  if (
    !Number.isInteger(manifest.recordCount)
    || manifest.recordCount < 1
    || manifest.countrySummaries.reduce((sum, item) => sum + item.recordCount, 0)
      !== manifest.recordCount
    || manifest.sources.reduce((sum, item) => sum + item.recordCount, 0)
      !== manifest.recordCount
  ) {
    issues.push('evaluatedRecordSet: aggregate counts are inconsistent');
  }
  if (
    manifest.placeNameValuesIncluded !== false
    || manifest.addressPayloadIncluded !== false
    || manifest.preciseLocationIncluded !== false
  ) {
    issues.push('evaluatedRecordSet: privacy declarations must remain false');
  }
  const evaluatedTimestamp = exactIsoTimestamp(evaluatedAt);
  const sourceIds = new Set<string>();
  for (const [index, source] of manifest.sources.entries()) {
    const path = `evaluatedRecordSet.sources[${index}]`;
    if (!source.sourceId || sourceIds.has(source.sourceId)) {
      issues.push(`${path}.sourceId: missing or duplicate`);
    }
    sourceIds.add(source.sourceId);
    issues.push(...auditChinesePlaceNameSource(source, path));
    const checkedOn = parseIsoDate(source.checkedOn);
    const correctionCheckedOn = parseIsoDate(source.correctionCheckedOn);
    if (
      checkedOn === null
      || correctionCheckedOn === null
      || evaluatedTimestamp === null
      || checkedOn > evaluatedTimestamp
      || evaluatedTimestamp - checkedOn > 400 * DAY_MILLISECONDS
      || correctionCheckedOn > evaluatedTimestamp
      || evaluatedTimestamp - correctionCheckedOn > 400 * DAY_MILLISECONDS
    ) {
      issues.push(`${path}: source or correction review is future, invalid, or stale`);
    }
  }
  return issues;
}

function qualityEvidencePayload(
  evidence: Omit<
    ChineseRegionalPlaceNameQualityEvidence,
    'reportDigest' | 'signatureStatus' | 'independentReviewComplete' | 'deliveryClaimsEnabled'
  >,
) {
  return {
    domain: CHINESE_PLACE_NAME_QUALITY_DIGEST_ALGORITHM,
    ...evidence,
  };
}

function auditChinesePlaceNameCorrectionEndpointEvidenceSet(
  sources: readonly ChinesePlaceNameSource[],
  evidenceSet: readonly ChinesePlaceNameCorrectionEndpointEvidence[],
  asOf: string,
): string[] {
  const issues: string[] = [];
  if (!Array.isArray(evidenceSet)) {
    return ['correctionEndpointEvidence: array is required'];
  }

  const sourceByCorrectionUrl = new Map<string, ChinesePlaceNameSource>();
  for (const source of sources) {
    sourceByCorrectionUrl.set(source.correctionUrl, source);
  }
  const seenUrls = new Set<string>();
  for (const [index, evidence] of evidenceSet.entries()) {
    const path = `correctionEndpointEvidence[${index}]`;
    if (seenUrls.has(evidence.correctionUrl)) {
      issues.push(`${path}: duplicate correction URL evidence`);
    }
    seenUrls.add(evidence.correctionUrl);
    const source = sourceByCorrectionUrl.get(evidence.correctionUrl);
    if (!source) {
      issues.push(`${path}: correction URL is not used by the evaluated sources`);
      continue;
    }
    const verification = verifyChinesePlaceNameCorrectionEndpointEvidence(
      source,
      evidence,
      {
        asOf,
        maxAgeDays: CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_EVIDENCE_MAX_AGE_DAYS,
      },
    );
    issues.push(...verification.issues.map(issue => `${path}.${issue}`));
  }
  for (const correctionUrl of sourceByCorrectionUrl.keys()) {
    if (!seenUrls.has(correctionUrl)) {
      issues.push(
        `correctionEndpointEvidence: missing evidence for ${correctionUrl}`,
      );
    }
  }
  return issues;
}

function qualityPoliciesMeetProductionFloor(
  reading: ChineseRegionalPlaceNameQualityPolicy,
  suggestion: ChinesePlaceNameSuggestionQualityPolicy,
) {
  const coversCountries = (
    actual: readonly ChinesePlaceNameCountryCode[],
    required: readonly ChinesePlaceNameCountryCode[],
  ) => {
    const actualCodes = new Set(actual);
    return required.every(code => actualCodes.has(code));
  };
  return (
    coversCountries(
      reading.requiredCountryCodes,
      DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY.requiredCountryCodes,
    )
    && reading.minimumTotal >= DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY.minimumTotal
    && reading.minimumPerCountry
      >= DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY.minimumPerCountry
    && reading.minimumResolvedPerCountry
      >= DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY.minimumResolvedPerCountry
    && reading.minimumDeferredPerCountry
      >= DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY.minimumDeferredPerCountry
    && reading.minimumAccuracy >= DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY.minimumAccuracy
    && reading.minimumSafeDeferralRate
      >= DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY.minimumSafeDeferralRate
    && reading.maximumUnsafeAutomaticResolutions
      <= DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY.maximumUnsafeAutomaticResolutions
    && coversCountries(
      suggestion.requiredCountryCodes,
      DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY.requiredCountryCodes,
    )
    && suggestion.minimumTotal
      >= DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY.minimumTotal
    && suggestion.minimumPerCountry
      >= DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY.minimumPerCountry
    && suggestion.minimumExpectedSuggestionsPerCountry
      >= DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY
        .minimumExpectedSuggestionsPerCountry
    && suggestion.minimumExpectedNoSuggestionsPerCountry
      >= DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY
        .minimumExpectedNoSuggestionsPerCountry
    && suggestion.minimumTop1Accuracy
      >= DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY.minimumTop1Accuracy
    && suggestion.minimumTopKAccuracy
      >= DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY.minimumTopKAccuracy
    && suggestion.minimumSafeNoSuggestionRate
      >= DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY.minimumSafeNoSuggestionRate
    && suggestion.maximumFalseSuggestionCases
      <= DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY.maximumFalseSuggestionCases
  );
}

function auditChineseRegionalPlaceNameQualityEvidence(
  evidence: ChineseRegionalPlaceNameQualityEvidence,
): string[] {
  const issues = findForbiddenKeys(evidence);
  if (evidence.version !== CHINESE_PLACE_NAME_QUALITY_EVIDENCE_VERSION) {
    issues.push('version: unsupported');
  }
  if (evidence.digestAlgorithm !== CHINESE_PLACE_NAME_QUALITY_DIGEST_ALGORITHM) {
    issues.push('digestAlgorithm: unsupported');
  }
  if (!/^[a-z0-9][a-z0-9._-]{2,79}$/.test(evidence.reportId)) {
    issues.push('reportId: invalid');
  }
  if (!evidence.fixtureVersion.trim() || evidence.fixtureVersion.length > 120) {
    issues.push('fixtureVersion: invalid');
  }
  if (!evidence.evaluatorId.trim() || evidence.evaluatorId.length > 200) {
    issues.push('evaluatorId: invalid');
  }
  if (evidence.evaluationEngineVersion !== CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION) {
    issues.push('evaluationEngineVersion: unsupported');
  }
  const evaluatedAt = Date.parse(evidence.evaluatedAt);
  if (
    !Number.isFinite(evaluatedAt)
    || new Date(evaluatedAt).toISOString() !== evidence.evaluatedAt
  ) {
    issues.push('evaluatedAt: must be an exact ISO timestamp');
  }

  const holdout = evidence.holdoutReport;
  if (holdout.schemaVersion !== CHINESE_PLACE_NAME_HOLDOUT_SCHEMA_VERSION) {
    issues.push('holdoutReport.schemaVersion: unsupported');
  }
  if (
    holdout.total !== holdout.resolvedExpected + holdout.deferredExpected
    || holdout.total !== holdout.correct + holdout.incorrect
    || holdout.countrySummaries.reduce((sum, summary) => sum + summary.total, 0)
      !== holdout.total
    || holdout.countrySummaries.reduce(
      (sum, summary) => sum + summary.resolvedExpected,
      0,
    ) !== holdout.resolvedExpected
    || holdout.countrySummaries.reduce(
      (sum, summary) => sum + summary.deferredExpected,
      0,
    ) !== holdout.deferredExpected
    || holdout.countrySummaries.some(
      summary => summary.total !== summary.resolvedExpected + summary.deferredExpected,
    )
    || holdout.accuracy !== (holdout.total ? holdout.correct / holdout.total : 1)
    || holdout.safeDeferralRate < 0
    || holdout.safeDeferralRate > 1
  ) {
    issues.push('holdoutReport: aggregate counts are inconsistent');
  }
  if (
    holdout.fixture.independenceVerified !== true
    || holdout.evaluationEngineVersion !== evidence.evaluationEngineVersion
    || holdout.fixture.evaluatorId !== evidence.evaluatorId
    || holdout.fixture.fixtureVersion !== evidence.fixtureVersion
    || holdout.fixture.curatorId === evidence.evaluatorId
    || exactIsoTimestamp(holdout.fixture.createdAt) === null
    || (
      exactIsoTimestamp(holdout.fixture.createdAt) !== null
      && exactIsoTimestamp(evidence.evaluatedAt) !== null
      && exactIsoTimestamp(holdout.fixture.createdAt)!
        > exactIsoTimestamp(evidence.evaluatedAt)!
    )
    || !/^[0-9a-f]{64}$/.test(holdout.fixture.fixtureDigest)
  ) {
    issues.push('holdoutReport.fixture: version, digest, or evaluator separation is inconsistent');
  }

  const suggestion = evidence.suggestionHoldoutReport;
  if (
    suggestion.total !== suggestion.expectedSuggestions + suggestion.expectedNoSuggestions
    || suggestion.top1Correct > suggestion.topKCorrect
    || suggestion.topKCorrect > suggestion.expectedSuggestions
    || suggestion.falseSuggestionCases > suggestion.expectedNoSuggestions
    || suggestion.missedSuggestionCases !== suggestion.expectedSuggestions - suggestion.topKCorrect
    || suggestion.countrySummaries.reduce((sum, summary) => sum + summary.total, 0)
      !== suggestion.total
    || suggestion.countrySummaries.reduce(
      (sum, summary) => sum + summary.expectedSuggestions,
      0,
    ) !== suggestion.expectedSuggestions
    || suggestion.countrySummaries.reduce(
      (sum, summary) => sum + summary.expectedNoSuggestions,
      0,
    ) !== suggestion.expectedNoSuggestions
    || suggestion.countrySummaries.some(
      summary => summary.total
        !== summary.expectedSuggestions + summary.expectedNoSuggestions,
    )
    || suggestion.countrySummaries.reduce((sum, summary) => sum + summary.top1Correct, 0)
      !== suggestion.top1Correct
    || suggestion.countrySummaries.reduce(
      (sum, summary) => sum + summary.falseSuggestionCases,
      0,
    ) !== suggestion.falseSuggestionCases
    || suggestion.top1Accuracy !== (
      suggestion.expectedSuggestions
        ? suggestion.top1Correct / suggestion.expectedSuggestions
        : 1
    )
    || suggestion.topKAccuracy !== (
      suggestion.expectedSuggestions
        ? suggestion.topKCorrect / suggestion.expectedSuggestions
        : 1
    )
    || suggestion.safeNoSuggestionRate !== (
      suggestion.expectedNoSuggestions
        ? (suggestion.expectedNoSuggestions - suggestion.falseSuggestionCases)
          / suggestion.expectedNoSuggestions
        : 1
    )
    || !Number.isInteger(suggestion.maxCandidates)
    || suggestion.maxCandidates < 1
    || suggestion.maxCandidates > 10
  ) {
    issues.push('suggestionHoldoutReport: aggregate counts are inconsistent');
  }
  if (
    suggestion.fixture.independenceVerified !== true
    || suggestion.evaluationEngineVersion !== evidence.evaluationEngineVersion
    || suggestion.fixture.evaluatorId !== evidence.evaluatorId
    || suggestion.fixture.fixtureVersion !== evidence.fixtureVersion
    || suggestion.fixture.curatorId === evidence.evaluatorId
    || suggestion.fixture.fixtureDigest !== holdout.fixture.fixtureDigest
    || suggestion.fixture.fixtureId !== holdout.fixture.fixtureId
    || suggestion.fixture.createdAt !== holdout.fixture.createdAt
  ) {
    issues.push(
      'suggestionHoldoutReport.fixture: reading and suggestion evidence bindings are inconsistent',
    );
  }

  const gate = evidence.qualityGateReport;
  if (gate.version !== CHINESE_PLACE_NAME_QUALITY_GATE_VERSION) {
    issues.push('qualityGateReport.version: unsupported');
  }
  const checksPassed = gate.checks.length === 7
    && gate.checks.every(check => check.status === 'passed');
  if (
    (gate.status === 'passed') !== checksPassed
    || gate.eligibleForIndependentReview !== (gate.status === 'passed')
    || gate.postalLookupEnabled !== false
    || gate.addressValidationEnabled !== false
    || gate.deliveryClaimsEnabled !== false
  ) {
    issues.push('qualityGateReport: gate state is inconsistent');
  }
  try {
    const recomputedGate = assessChineseRegionalPlaceNameHoldout(
      holdout,
      gate.policy,
    );
    if (stableStringify(recomputedGate) !== stableStringify(gate)) {
      issues.push('qualityGateReport: policy, checks, or aggregate binding mismatch');
    }
  } catch {
    issues.push('qualityGateReport.policy: invalid');
  }
  const suggestionGate = evidence.suggestionQualityGateReport;
  const suggestionChecksPassed = suggestionGate.checks.length === 8
    && suggestionGate.checks.every(check => check.status === 'passed');
  if (suggestionGate.version !== CHINESE_PLACE_NAME_SUGGESTION_QUALITY_GATE_VERSION) {
    issues.push('suggestionQualityGateReport.version: unsupported');
  }
  if (
    (suggestionGate.status === 'passed') !== suggestionChecksPassed
    || suggestionGate.eligibleForVersionedHoldoutReview
      !== (suggestionGate.status === 'passed')
    || suggestionGate.automaticCorrectionEnabled !== false
    || suggestionGate.deliveryClaimsEnabled !== false
  ) {
    issues.push('suggestionQualityGateReport: gate state is inconsistent');
  }
  try {
    const recomputedSuggestionGate = assessChinesePlaceNameSuggestionHoldout(
      suggestion,
      suggestionGate.policy,
    );
    if (stableStringify(recomputedSuggestionGate) !== stableStringify(suggestionGate)) {
      issues.push(
        'suggestionQualityGateReport: policy, checks, or aggregate binding mismatch',
      );
    }
  } catch {
    issues.push('suggestionQualityGateReport.policy: invalid');
  }
  if (
    evidence.signatureStatus !== 'not-attached'
    || evidence.independentReviewComplete !== false
    || evidence.deliveryClaimsEnabled !== false
  ) {
    issues.push('evidence: unsigned evidence cannot enable review or delivery claims');
  }
  issues.push(...auditChineseRegionalPlaceNameRecordSetManifest(
    evidence.evaluatedRecordSet,
    evidence.evaluatedAt,
  ));
  issues.push(...auditChinesePlaceNameCorrectionEndpointEvidenceSet(
    evidence.evaluatedRecordSet.sources,
    evidence.correctionEndpointEvidence,
    evidence.evaluatedAt,
  ));
  return issues;
}

function auditHoldoutPackReportBinding(input: {
  pack: ChineseRegionalPlaceNameHoldoutPack;
  report: ChineseRegionalPlaceNameVersionedHoldoutReport;
  evaluatorId: string;
  fixtureVersion: string;
  records: readonly ChineseRegionalPlaceNameRecord[];
}): string[] {
  const issues = auditChineseRegionalPlaceNameHoldoutPack(input.pack);
  if (
    input.report.fixture.fixtureId !== input.pack.fixtureId
    || input.report.fixture.fixtureVersion !== input.pack.fixtureVersion
    || input.report.fixture.fixtureDigest !== input.pack.fixtureDigest
    || input.report.fixture.createdAt !== input.pack.createdAt
    || input.report.fixture.curatorId !== input.pack.curatorId
    || input.report.fixture.evaluatorId !== input.evaluatorId
    || input.report.fixture.independenceVerified !== true
    || input.fixtureVersion !== input.pack.fixtureVersion
    || input.report.total !== input.pack.vectorCount
  ) {
    issues.push('holdout pack and aggregate report binding mismatch');
  }
  try {
    const recomputedReport = evaluateChineseRegionalPlaceNameHoldoutPack({
      pack: input.pack,
      evaluatorId: input.evaluatorId,
      records: input.records,
    });
    if (stableStringify(recomputedReport) !== stableStringify(input.report)) {
      issues.push('holdout pack and aggregate report evaluation mismatch');
    }
  } catch {
    issues.push('holdout pack and aggregate report could not be re-evaluated');
  }
  return issues;
}

function auditSuggestionHoldoutPackReportBinding(input: {
  pack: ChineseRegionalPlaceNameHoldoutPack;
  report: ChinesePlaceNameVersionedSuggestionHoldoutReport;
  evaluatorId: string;
  fixtureVersion: string;
  records: readonly ChineseRegionalPlaceNameRecord[];
}): string[] {
  const issues = auditChineseRegionalPlaceNameHoldoutPack(input.pack);
  if (
    input.report.fixture.fixtureId !== input.pack.fixtureId
    || input.report.fixture.fixtureVersion !== input.pack.fixtureVersion
    || input.report.fixture.fixtureDigest !== input.pack.fixtureDigest
    || input.report.fixture.createdAt !== input.pack.createdAt
    || input.report.fixture.curatorId !== input.pack.curatorId
    || input.report.fixture.evaluatorId !== input.evaluatorId
    || input.report.fixture.independenceVerified !== true
    || input.fixtureVersion !== input.pack.fixtureVersion
    || input.report.total !== input.pack.suggestionVectorCount
  ) {
    issues.push('suggestion holdout pack and aggregate report binding mismatch');
  }
  try {
    const recomputedReport = evaluateChinesePlaceNameSuggestionHoldoutPack({
      pack: input.pack,
      evaluatorId: input.evaluatorId,
      maxCandidates: input.report.maxCandidates,
      records: input.records,
    });
    if (stableStringify(recomputedReport) !== stableStringify(input.report)) {
      issues.push('suggestion holdout pack and aggregate report evaluation mismatch');
    }
  } catch {
    issues.push('suggestion holdout pack and aggregate report could not be re-evaluated');
  }
  return issues;
}

export function buildChineseRegionalPlaceNameQualityEvidence(input: {
  reportId: string;
  fixtureVersion: string;
  evaluatedAt: string;
  evaluatorId: string;
  holdoutReport: ChineseRegionalPlaceNameVersionedHoldoutReport;
  qualityGateReport: ChineseRegionalPlaceNameQualityGateReport;
  suggestionHoldoutReport: ChinesePlaceNameVersionedSuggestionHoldoutReport;
  suggestionQualityGateReport: ChinesePlaceNameSuggestionQualityGate;
  correctionEndpointEvidence: readonly ChinesePlaceNameCorrectionEndpointEvidence[];
  holdoutPack: ChineseRegionalPlaceNameHoldoutPack;
  evaluatedRecords?: readonly ChineseRegionalPlaceNameRecord[];
}): ChineseRegionalPlaceNameQualityEvidence {
  const evaluatedRecords =
    input.evaluatedRecords ?? CHINESE_REGIONAL_PLACE_NAME_RECORDS;
  const holdoutBindingIssues = auditHoldoutPackReportBinding({
    pack: input.holdoutPack,
    report: input.holdoutReport,
    evaluatorId: input.evaluatorId,
    fixtureVersion: input.fixtureVersion,
    records: evaluatedRecords,
  });
  if (holdoutBindingIssues.length) {
    throw new Error(
      `Chinese place-name quality evidence holdout binding is invalid: ${holdoutBindingIssues.join('; ')}`,
    );
  }
  const suggestionBindingIssues = auditSuggestionHoldoutPackReportBinding({
    pack: input.holdoutPack,
    report: input.suggestionHoldoutReport,
    evaluatorId: input.evaluatorId,
    fixtureVersion: input.fixtureVersion,
    records: evaluatedRecords,
  });
  if (suggestionBindingIssues.length) {
    throw new Error(
      `Chinese place-name quality evidence suggestion binding is invalid: ${suggestionBindingIssues.join('; ')}`,
    );
  }
  const evaluatedRecordSet = buildChineseRegionalPlaceNameRecordSetManifest(
    evaluatedRecords,
  );
  const correctionEndpointIssues = auditChinesePlaceNameCorrectionEndpointEvidenceSet(
    [...evaluatedRecordSet.sources, ...input.holdoutPack.sources],
    input.correctionEndpointEvidence,
    input.evaluatedAt,
  );
  if (correctionEndpointIssues.length) {
    throw new Error(
      `Chinese place-name correction endpoint evidence is invalid: ${correctionEndpointIssues.join('; ')}`,
    );
  }
  const unsigned = {
    version: CHINESE_PLACE_NAME_QUALITY_EVIDENCE_VERSION,
    digestAlgorithm: CHINESE_PLACE_NAME_QUALITY_DIGEST_ALGORITHM,
    reportId: input.reportId,
    fixtureVersion: input.fixtureVersion,
    evaluatedAt: input.evaluatedAt,
    evaluatorId: input.evaluatorId,
    evaluationEngineVersion: CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION,
    holdoutReport: input.holdoutReport,
    qualityGateReport: input.qualityGateReport,
    suggestionHoldoutReport: input.suggestionHoldoutReport,
    suggestionQualityGateReport: input.suggestionQualityGateReport,
    evaluatedRecordSet,
    correctionEndpointEvidence: input.correctionEndpointEvidence,
  } as const;
  const evidence: ChineseRegionalPlaceNameQualityEvidence = {
    ...unsigned,
    reportDigest: sha256Hex(stableStringify(qualityEvidencePayload(unsigned))),
    signatureStatus: 'not-attached',
    independentReviewComplete: false,
    deliveryClaimsEnabled: false,
  };
  const issues = auditChineseRegionalPlaceNameQualityEvidence(evidence);
  if (issues.length) {
    throw new Error(`Chinese place-name quality evidence is invalid: ${issues.join('; ')}`);
  }
  return evidence;
}

export function verifyChineseRegionalPlaceNameQualityEvidence(
  evidence: ChineseRegionalPlaceNameQualityEvidence,
  options: {
    evaluatedRecords: readonly ChineseRegionalPlaceNameRecord[];
    holdoutPack: ChineseRegionalPlaceNameHoldoutPack;
    asOf: string;
  },
): ChineseRegionalPlaceNameQualityEvidenceVerification {
  const issues = auditChineseRegionalPlaceNameQualityEvidence(evidence);
  const asOf = exactIsoTimestamp(options.asOf);
  const evaluatedAt = exactIsoTimestamp(evidence.evaluatedAt);
  const evidenceFresh = (
    asOf !== null
    && evaluatedAt !== null
    && evaluatedAt <= asOf
    && asOf - evaluatedAt
      <= CHINESE_PLACE_NAME_QUALITY_EVIDENCE_MAX_AGE_DAYS * DAY_MILLISECONDS
  );
  if (asOf === null) {
    issues.push('asOf: must be an exact ISO timestamp');
  } else if (!evidenceFresh) {
    issues.push(
      `evaluatedAt: evidence is future or older than ${CHINESE_PLACE_NAME_QUALITY_EVIDENCE_MAX_AGE_DAYS} days`,
    );
  }
  const reviewedSources = [
    ...evidence.evaluatedRecordSet.sources,
    ...options.holdoutPack.sources,
  ];
  const sourcesFresh = asOf !== null && reviewedSources.every(source => {
    const checkedOn = parseIsoDate(source.checkedOn);
    const correctionCheckedOn = parseIsoDate(source.correctionCheckedOn);
    return (
      checkedOn !== null
      && correctionCheckedOn !== null
      && checkedOn <= asOf
      && asOf - checkedOn
        <= CHINESE_PLACE_NAME_SOURCE_REVIEW_MAX_AGE_DAYS * DAY_MILLISECONDS
      && correctionCheckedOn <= asOf
      && asOf - correctionCheckedOn
        <= CHINESE_PLACE_NAME_SOURCE_REVIEW_MAX_AGE_DAYS * DAY_MILLISECONDS
    );
  });
  if (!sourcesFresh) {
    issues.push(
      `sources: review is future or older than ${CHINESE_PLACE_NAME_SOURCE_REVIEW_MAX_AGE_DAYS} days`,
    );
  }
  const correctionEndpointIssues = auditChinesePlaceNameCorrectionEndpointEvidenceSet(
    reviewedSources,
    evidence.correctionEndpointEvidence,
    options.asOf,
  );
  const correctionEndpointsVerified = correctionEndpointIssues.length === 0;
  issues.push(...correctionEndpointIssues);
  const freshnessVerified = evidenceFresh && sourcesFresh && correctionEndpointsVerified;
  let recordSetVerified = false;
  try {
    const expectedRecordSet = buildChineseRegionalPlaceNameRecordSetManifest(
      options.evaluatedRecords,
    );
    recordSetVerified = stableStringify(expectedRecordSet)
      === stableStringify(evidence.evaluatedRecordSet);
    if (!recordSetVerified) issues.push('evaluatedRecordSet: supplied records do not match');
  } catch {
    issues.push('evaluatedRecordSet: supplied records are invalid');
  }
  const holdoutBindingIssues = auditHoldoutPackReportBinding({
    pack: options.holdoutPack,
    report: evidence.holdoutReport,
    evaluatorId: evidence.evaluatorId,
    fixtureVersion: evidence.fixtureVersion,
    records: options.evaluatedRecords,
  });
  const holdoutPackVerified = holdoutBindingIssues.length === 0;
  issues.push(...holdoutBindingIssues.map(issue => `holdoutPack.${issue}`));
  const suggestionBindingIssues = auditSuggestionHoldoutPackReportBinding({
    pack: options.holdoutPack,
    report: evidence.suggestionHoldoutReport,
    evaluatorId: evidence.evaluatorId,
    fixtureVersion: evidence.fixtureVersion,
    records: options.evaluatedRecords,
  });
  issues.push(...suggestionBindingIssues.map(issue => `holdoutPack.${issue}`));
  const suggestionHoldoutPackVerified = suggestionBindingIssues.length === 0;
  const {
    reportDigest: _reportDigest,
    signatureStatus: _signatureStatus,
    independentReviewComplete: _independentReviewComplete,
    deliveryClaimsEnabled: _deliveryClaimsEnabled,
    ...unsigned
  } = evidence;
  const expectedDigest = sha256Hex(
    stableStringify(qualityEvidencePayload(unsigned)),
  );
  if (!/^[0-9a-f]{64}$/.test(evidence.reportDigest)) {
    issues.push('reportDigest: invalid SHA-256 encoding');
  } else if (evidence.reportDigest !== expectedDigest) {
    issues.push('reportDigest: mismatch');
  }
  const uniqueIssues = [...new Set(issues)].sort();
  let productionPolicyVerified = false;
  try {
    productionPolicyVerified = qualityPoliciesMeetProductionFloor(
      evidence.qualityGateReport.policy,
      evidence.suggestionQualityGateReport.policy,
    );
  } catch {
    productionPolicyVerified = false;
  }
  return {
    valid: uniqueIssues.length === 0,
    issues: uniqueIssues,
    recordSetVerified,
    holdoutPackVerified,
    productionPolicyVerified,
    freshnessVerified,
    correctionEndpointsVerified,
    eligibleForExternalSignature:
      uniqueIssues.length === 0
      && recordSetVerified
      && holdoutPackVerified
      && suggestionHoldoutPackVerified
      && productionPolicyVerified
      && freshnessVerified
      && correctionEndpointsVerified
      && evidence.qualityGateReport.status === 'passed'
      && evidence.suggestionQualityGateReport.status === 'passed',
    independentReviewComplete: false,
    deliveryClaimsEnabled: false,
  };
}

export async function verifyEd25519DetachedSignature(input: {
  message: string;
  publicKeyBase64Url: string;
  signatureBase64Url: string;
}): Promise<boolean> {
  const publicKey = base64UrlToBytes(input.publicKeyBase64Url);
  const signature = base64UrlToBytes(input.signatureBase64Url);
  if (publicKey.length !== 32 || signature.length !== 64) return false;
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error('Web Crypto API is required for Ed25519 verification');
  }
  try {
    const key = await cryptoApi.subtle.importKey(
      'raw',
      ownedArrayBuffer(publicKey),
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
    return cryptoApi.subtle.verify(
      { name: 'Ed25519' },
      key,
      ownedArrayBuffer(signature),
      ownedArrayBuffer(new TextEncoder().encode(input.message)),
    );
  } catch {
    return false;
  }
}

function correctionEndpointSigningMessage(
  evidence: ChinesePlaceNameCorrectionEndpointEvidence,
  signature: Pick<ChinesePlaceNameCorrectionEndpointSignature, 'keyId' | 'signedAt'>,
) {
  return stableStringify({
    domain: CHINESE_PLACE_NAME_CORRECTION_MONITOR_SIGNATURE_DOMAIN,
    evidenceVersion: evidence.version,
    evidenceDigest: evidence.evidenceDigest,
    correctionUrl: evidence.correctionUrl,
    observerId: evidence.observerId,
    keyId: signature.keyId,
    signedAt: signature.signedAt,
  });
}

export async function verifyChinesePlaceNameCorrectionEndpointSignature(input: {
  source: ChinesePlaceNameSource;
  evidence: ChinesePlaceNameCorrectionEndpointEvidence;
  signature: ChinesePlaceNameCorrectionEndpointSignature;
  registry: ChinesePlaceNameCorrectionMonitorKeyRegistry;
  asOf?: string;
}): Promise<ChinesePlaceNameCorrectionEndpointSignatureVerification> {
  const issues = findForbiddenKeys({
    signature: input.signature,
    registry: input.registry,
  });
  const verificationAsOf = input.asOf ?? new Date().toISOString();
  const evidenceVerification = verifyChinesePlaceNameCorrectionEndpointEvidence(
    input.source,
    input.evidence,
    { asOf: verificationAsOf },
  );
  issues.push(...evidenceVerification.issues.map(issue => `evidence.${issue}`));
  if (
    input.registry.version
    !== CHINESE_PLACE_NAME_CORRECTION_MONITOR_KEY_REGISTRY_VERSION
  ) {
    issues.push('registry.version: unsupported');
  }

  const keyIds = new Set<string>();
  for (const [index, key] of input.registry.keys.entries()) {
    const path = `registry.keys[${index}]`;
    if (!key.keyId || keyIds.has(key.keyId)) {
      issues.push(`${path}.keyId: missing or duplicate`);
    }
    keyIds.add(key.keyId);
    if (!key.monitorId || key.monitorId.length > 200) {
      issues.push(`${path}.monitorId: invalid`);
    }
    if (key.algorithm !== 'Ed25519') issues.push(`${path}.algorithm: unsupported`);
    if (key.purpose !== 'correction-endpoint-observation') {
      issues.push(`${path}.purpose: unsupported`);
    }
    if (base64UrlToBytes(key.publicKeyBase64Url).length !== 32) {
      issues.push(`${path}.publicKeyBase64Url: invalid Ed25519 public key`);
    }
    if (
      typeof key.registryUrl !== 'string'
      || !key.registryUrl.startsWith('https://')
      || typeof key.revocationUrl !== 'string'
      || !key.revocationUrl.startsWith('https://')
    ) {
      issues.push(`${path}: HTTPS registry and revocation URLs are required`);
    }
    if (
      exactIsoTimestamp(key.validFrom) === null
      || exactIsoTimestamp(key.validUntil) === null
      || exactIsoTimestamp(key.reviewedAt) === null
      || exactIsoTimestamp(key.reviewBy) === null
    ) {
      issues.push(`${path}: exact ISO validity and review timestamps are required`);
    }
  }

  const key = input.registry.keys.find(item => item.keyId === input.signature.keyId);
  if (!key) issues.push('signature.keyId: key is not trusted');
  if (input.signature.algorithm !== 'Ed25519') {
    issues.push('signature.algorithm: unsupported');
  }

  const asOf = exactIsoTimestamp(verificationAsOf);
  const signedAt = exactIsoTimestamp(input.signature.signedAt);
  const observedAt = exactIsoTimestamp(input.evidence.observedAt);
  if (asOf === null) issues.push('asOf: must be an exact ISO timestamp');
  if (signedAt === null) {
    issues.push('signature.signedAt: must be an exact ISO timestamp');
  }
  if (key) {
    const validFrom = exactIsoTimestamp(key.validFrom);
    const validUntil = exactIsoTimestamp(key.validUntil);
    const reviewBy = exactIsoTimestamp(key.reviewBy);
    if (key.status !== 'trusted') issues.push('signature.keyId: key is revoked');
    if (key.monitorId !== input.evidence.observerId) {
      issues.push('monitorId: evidence observer and trusted monitor must match');
    }
    if (signedAt !== null && observedAt !== null && signedAt < observedAt) {
      issues.push('signature.signedAt: cannot precede observation');
    }
    if (signedAt !== null && asOf !== null && signedAt > asOf) {
      issues.push('signature.signedAt: cannot be in the future');
    }
    if (
      signedAt !== null
      && validFrom !== null
      && validUntil !== null
      && (signedAt < validFrom || signedAt > validUntil)
    ) {
      issues.push('signature.signedAt: outside key validity window');
    }
    if (asOf !== null && reviewBy !== null && asOf > reviewBy) {
      issues.push('signature.keyId: trust review is stale');
    }
  }

  let signatureValid = false;
  if (key && !issues.some(issue => (
    issue.includes('publicKeyBase64Url')
    || issue.startsWith('signature.')
    || issue.startsWith('evidence.')
    || issue.startsWith('monitorId:')
  ))) {
    signatureValid = await verifyEd25519DetachedSignature({
      message: correctionEndpointSigningMessage(input.evidence, input.signature),
      publicKeyBase64Url: key.publicKeyBase64Url,
      signatureBase64Url: input.signature.signatureBase64Url,
    });
    if (!signatureValid) issues.push('signature: cryptographic verification failed');
  }

  const uniqueIssues = [...new Set(issues)].sort();
  const trustValid = Boolean(key) && !uniqueIssues.some(issue => (
    issue.startsWith('registry.')
    || issue.startsWith('signature.keyId:')
    || issue.startsWith('monitorId:')
  ));
  const verified = evidenceVerification.valid
    && trustValid
    && signatureValid
    && uniqueIssues.length === 0;
  return {
    status: verified ? 'verified' : 'rejected',
    evidenceValid: evidenceVerification.valid,
    trustValid,
    signatureValid,
    issues: uniqueIssues,
    monitorId: key?.monitorId,
  };
}

export async function verifyChinesePlaceNameCorrectionEndpointSignatureSet(input: {
  qualityEvidence: ChineseRegionalPlaceNameQualityEvidence;
  signatures: readonly ChinesePlaceNameCorrectionEndpointSignatureBinding[];
  registry: ChinesePlaceNameCorrectionMonitorKeyRegistry;
  evaluatedRecords: readonly ChineseRegionalPlaceNameRecord[];
  holdoutPack: ChineseRegionalPlaceNameHoldoutPack;
  asOf: string;
}): Promise<ChinesePlaceNameCorrectionEndpointSignatureSetVerification> {
  const issues = findForbiddenKeys({
    signatures: input.signatures,
    registry: input.registry,
  });
  const qualityVerification = verifyChineseRegionalPlaceNameQualityEvidence(
    input.qualityEvidence,
    {
      evaluatedRecords: input.evaluatedRecords,
      holdoutPack: input.holdoutPack,
      asOf: input.asOf,
    },
  );
  issues.push(...qualityVerification.issues.map(issue => `qualityEvidence.${issue}`));
  if (!qualityVerification.eligibleForExternalSignature) {
    issues.push('qualityEvidence: not eligible for external signature');
  }

  const sourceByCorrectionUrl = new Map(
    input.qualityEvidence.evaluatedRecordSet.sources.map(source => [
      source.correctionUrl,
      source,
    ]),
  );
  const evidenceByCorrectionUrl = new Map(
    input.qualityEvidence.correctionEndpointEvidence.map(evidence => [
      evidence.correctionUrl,
      evidence,
    ]),
  );
  const bindingByCorrectionUrl = new Map<
    string,
    ChinesePlaceNameCorrectionEndpointSignatureBinding
  >();
  for (const [index, binding] of input.signatures.entries()) {
    const path = `signatures[${index}]`;
    if (bindingByCorrectionUrl.has(binding.correctionUrl)) {
      issues.push(`${path}: duplicate correction URL signature`);
      continue;
    }
    if (!sourceByCorrectionUrl.has(binding.correctionUrl)) {
      issues.push(`${path}: correction URL is not used by the evaluated sources`);
      continue;
    }
    bindingByCorrectionUrl.set(binding.correctionUrl, binding);
  }

  const endpointSummaries = [];
  for (const [correctionUrl, source] of sourceByCorrectionUrl.entries()) {
    const evidence = evidenceByCorrectionUrl.get(correctionUrl);
    const binding = bindingByCorrectionUrl.get(correctionUrl);
    if (!evidence) {
      const endpointIssues = ['quality evidence is missing endpoint evidence'];
      issues.push(`correctionSignatures.${correctionUrl}: ${endpointIssues[0]}`);
      endpointSummaries.push({
        correctionUrl,
        status: 'rejected' as const,
        issues: endpointIssues,
      });
      continue;
    }
    if (!binding) {
      const endpointIssues = ['independent monitor signature is missing'];
      issues.push(`correctionSignatures.${correctionUrl}: ${endpointIssues[0]}`);
      endpointSummaries.push({
        correctionUrl,
        status: 'rejected' as const,
        issues: endpointIssues,
      });
      continue;
    }
    if (binding.evidenceDigest !== evidence.evidenceDigest) {
      const endpointIssues = ['signature binding evidence digest does not match'];
      issues.push(`correctionSignatures.${correctionUrl}: ${endpointIssues[0]}`);
      endpointSummaries.push({
        correctionUrl,
        status: 'rejected' as const,
        issues: endpointIssues,
      });
      continue;
    }

    const verification = await verifyChinesePlaceNameCorrectionEndpointSignature({
      source,
      evidence,
      signature: binding.signature,
      registry: input.registry,
      asOf: input.asOf,
    });
    issues.push(...verification.issues.map(issue =>
      `correctionSignatures.${correctionUrl}.${issue}`));
    endpointSummaries.push({
      correctionUrl,
      status: verification.status,
      monitorId: verification.monitorId,
      issues: verification.issues,
    });
  }

  const verifiedEndpointCount = endpointSummaries.filter(
    summary => summary.status === 'verified',
  ).length;
  const allEndpointsIndependentlyObserved = (
    endpointSummaries.length > 0
    && verifiedEndpointCount === endpointSummaries.length
  );
  const uniqueIssues = [...new Set(issues)].sort();
  const eligibleForIndependentQualityReview = (
    qualityVerification.eligibleForExternalSignature
    && allEndpointsIndependentlyObserved
    && uniqueIssues.length === 0
  );
  return {
    status: eligibleForIndependentQualityReview ? 'verified' : 'rejected',
    qualityEvidenceValid: qualityVerification.valid,
    expectedEndpointCount: endpointSummaries.length,
    verifiedEndpointCount,
    allEndpointsIndependentlyObserved,
    eligibleForIndependentQualityReview,
    issues: uniqueIssues,
    endpointSummaries,
    deliveryClaimsEnabled: false,
  };
}

function independentReviewSigningMessage(
  evidence: ChineseRegionalPlaceNameQualityEvidence,
  signature: Pick<ChinesePlaceNameIndependentReviewSignature, 'keyId' | 'signedAt'>,
) {
  return stableStringify({
    domain: CHINESE_PLACE_NAME_REVIEW_SIGNATURE_DOMAIN,
    evidenceVersion: evidence.version,
    reportId: evidence.reportId,
    reportDigest: evidence.reportDigest,
    keyId: signature.keyId,
    signedAt: signature.signedAt,
  });
}

export async function verifyChinesePlaceNameIndependentReview(input: {
  evidence: ChineseRegionalPlaceNameQualityEvidence;
  signature: ChinesePlaceNameIndependentReviewSignature;
  registry: ChinesePlaceNameReviewerKeyRegistry;
  evaluatedRecords: readonly ChineseRegionalPlaceNameRecord[];
  holdoutPack: ChineseRegionalPlaceNameHoldoutPack;
  asOf?: string;
}): Promise<ChinesePlaceNameIndependentReviewVerification> {
  const issues = findForbiddenKeys({
    signature: input.signature,
    registry: input.registry,
  });
  const verificationAsOf = input.asOf ?? new Date().toISOString();
  const evidenceVerification = verifyChineseRegionalPlaceNameQualityEvidence(
    input.evidence,
    {
      evaluatedRecords: input.evaluatedRecords,
      holdoutPack: input.holdoutPack,
      asOf: verificationAsOf,
    },
  );
  issues.push(...evidenceVerification.issues.map(issue => `evidence.${issue}`));
  if (!evidenceVerification.eligibleForExternalSignature) {
    issues.push('evidence: not eligible for external signature');
  }
  if (input.registry.version !== CHINESE_PLACE_NAME_REVIEW_KEY_REGISTRY_VERSION) {
    issues.push('registry.version: unsupported');
  }

  const keyIds = new Set<string>();
  for (const [index, key] of input.registry.keys.entries()) {
    const path = `registry.keys[${index}]`;
    if (!key.keyId || keyIds.has(key.keyId)) issues.push(`${path}.keyId: missing or duplicate`);
    keyIds.add(key.keyId);
    if (!key.reviewerId || key.reviewerId.length > 200) issues.push(`${path}.reviewerId: invalid`);
    if (key.algorithm !== 'Ed25519') issues.push(`${path}.algorithm: unsupported`);
    if (key.purpose !== 'chinese-place-name-quality-review') issues.push(`${path}.purpose: unsupported`);
    if (base64UrlToBytes(key.publicKeyBase64Url).length !== 32) {
      issues.push(`${path}.publicKeyBase64Url: invalid Ed25519 public key`);
    }
    if (!key.registryUrl.startsWith('https://') || !key.revocationUrl.startsWith('https://')) {
      issues.push(`${path}: HTTPS registry and revocation URLs are required`);
    }
    if (
      exactIsoTimestamp(key.validFrom) === null
      || exactIsoTimestamp(key.validUntil) === null
      || exactIsoTimestamp(key.reviewedAt) === null
      || exactIsoTimestamp(key.reviewBy) === null
    ) {
      issues.push(`${path}: exact ISO validity and review timestamps are required`);
    }
  }

  const key = input.registry.keys.find(item => item.keyId === input.signature.keyId);
  if (!key) issues.push('signature.keyId: key is not trusted');
  if (input.signature.algorithm !== 'Ed25519') issues.push('signature.algorithm: unsupported');

  const asOf = exactIsoTimestamp(verificationAsOf);
  const signedAt = exactIsoTimestamp(input.signature.signedAt);
  const evaluatedAt = exactIsoTimestamp(input.evidence.evaluatedAt);
  if (asOf === null) issues.push('asOf: must be an exact ISO timestamp');
  if (signedAt === null) issues.push('signature.signedAt: must be an exact ISO timestamp');
  if (key) {
    const validFrom = exactIsoTimestamp(key.validFrom);
    const validUntil = exactIsoTimestamp(key.validUntil);
    const reviewBy = exactIsoTimestamp(key.reviewBy);
    if (key.status !== 'trusted') issues.push('signature.keyId: key is revoked');
    if (key.reviewerId === input.evidence.evaluatorId) {
      issues.push('reviewerId: evaluator and independent reviewer must differ');
    }
    if (signedAt !== null && evaluatedAt !== null && signedAt < evaluatedAt) {
      issues.push('signature.signedAt: cannot precede evaluation');
    }
    if (signedAt !== null && asOf !== null && signedAt > asOf) {
      issues.push('signature.signedAt: cannot be in the future');
    }
    if (
      signedAt !== null
      && validFrom !== null
      && validUntil !== null
      && (signedAt < validFrom || signedAt > validUntil)
    ) {
      issues.push('signature.signedAt: outside key validity window');
    }
    if (asOf !== null && reviewBy !== null && asOf > reviewBy) {
      issues.push('signature.keyId: trust review is stale');
    }
  }

  let signatureValid = false;
  if (key && !issues.some(issue => (
    issue.includes('publicKeyBase64Url')
    || issue.startsWith('signature.')
    || issue.startsWith('evidence.')
    || issue.startsWith('reviewerId:')
  ))) {
    signatureValid = await verifyEd25519DetachedSignature({
      message: independentReviewSigningMessage(input.evidence, input.signature),
      publicKeyBase64Url: key.publicKeyBase64Url,
      signatureBase64Url: input.signature.signatureBase64Url,
    });
    if (!signatureValid) issues.push('signature: cryptographic verification failed');
  }

  const uniqueIssues = [...new Set(issues)].sort();
  const trustValid = Boolean(key) && !uniqueIssues.some(issue => (
    issue.startsWith('registry.')
    || issue.startsWith('signature.keyId:')
    || issue.startsWith('reviewerId:')
  ));
  const independentReviewComplete =
    evidenceVerification.valid
    && trustValid
    && signatureValid
    && uniqueIssues.length === 0;
  return {
    status: independentReviewComplete ? 'verified' : 'rejected',
    digestValid: evidenceVerification.valid,
    trustValid,
    signatureValid,
    issues: uniqueIssues,
    reviewerId: key?.reviewerId,
    independentReviewComplete,
    postalLookupEnabled: false,
    addressValidationEnabled: false,
    deliveryClaimsEnabled: false,
  };
}

function editDistanceAtMostOne(left: string, right: string): 0 | 1 | 2 {
  const leftChars = Array.from(left);
  const rightChars = Array.from(right);
  if (Math.abs(leftChars.length - rightChars.length) > 1) return 2;

  let leftIndex = 0;
  let rightIndex = 0;
  let edits = 0;
  while (leftIndex < leftChars.length && rightIndex < rightChars.length) {
    if (leftChars[leftIndex] === rightChars[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return 2;
    if (leftChars.length > rightChars.length) leftIndex += 1;
    else if (rightChars.length > leftChars.length) rightIndex += 1;
    else {
      leftIndex += 1;
      rightIndex += 1;
    }
  }
  if (leftIndex < leftChars.length || rightIndex < rightChars.length) edits += 1;
  return edits > 1 ? 2 : edits as 0 | 1;
}

export function suggestChineseRegionalPlaceNameCandidates(input: {
  countryCode: string;
  nativeName: string;
  maxCandidates?: number;
  records?: readonly ChineseRegionalPlaceNameRecord[];
}): ChineseRegionalPlaceNameSuggestionResult {
  const records = input.records ?? CHINESE_REGIONAL_PLACE_NAME_RECORDS;
  const evidenceIssues = auditChineseRegionalPlaceNameRecords(records);
  if (evidenceIssues.length) {
    return {
      status: 'rejected-evidence',
      candidates: [],
      automaticCorrectionAllowed: false,
      issues: evidenceIssues,
    };
  }

  const countryCode = input.countryCode.toUpperCase();
  const nativeName = normalizedName(input.nativeName);
  const maxCandidates = input.maxCandidates ?? 5;
  const inputIssues: string[] = [];
  if (!COUNTRY_CODES.has(countryCode as ChinesePlaceNameCountryCode)) {
    inputIssues.push('countryCode: unsupported');
  }
  const nameLength = Array.from(nativeName).length;
  if (
    nameLength < 2
    || nameLength > 20
    || !HAN_PATTERN.test(nativeName)
    || /\d/.test(nativeName)
  ) {
    inputIssues.push('nativeName: must be a 2-20 character Han place name without numbers');
  }
  if (!Number.isInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > 10) {
    inputIssues.push('maxCandidates: must be an integer between 1 and 10');
  }
  if (inputIssues.length) {
    return {
      status: 'rejected-input',
      candidates: [],
      automaticCorrectionAllowed: false,
      issues: inputIssues,
    };
  }

  const exact = resolveChineseRegionalPlaceName({
    countryCode,
    nativeName,
    records,
  });
  if (exact.status === 'resolved') {
    return {
      status: 'exact-match',
      record: exact.record,
      candidates: [],
      automaticCorrectionAllowed: false,
    };
  }
  if (exact.status === 'rejected-evidence') {
    return {
      status: 'rejected-evidence',
      candidates: [],
      automaticCorrectionAllowed: false,
      issues: exact.issues,
    };
  }

  const suggestions = records
    .filter(item => item.countryCode === countryCode)
    .flatMap(item => {
      const matchingName = item.nativeNames
        .map(name => ({ name, distance: editDistanceAtMostOne(nativeName, normalizedName(name)) }))
        .filter(candidate => candidate.distance === 1)
        .sort((left, right) => left.name.localeCompare(right.name))[0];
      if (!matchingName) return [];
      return [{
        recordId: item.id,
        nativeName: matchingName.name,
        englishName: item.englishName,
        editDistance: 1 as const,
        usage: 'candidate-only' as const,
        automaticCorrectionAllowed: false as const,
      }];
    })
    .sort((left, right) => (
      left.englishName.localeCompare(right.englishName)
      || left.recordId.localeCompare(right.recordId)
    ))
    .slice(0, maxCandidates);

  if (!suggestions.length) {
    return {
      status: 'unmatched',
      candidates: [],
      automaticCorrectionAllowed: false,
      issues: [],
    };
  }
  return {
    status: 'suggested',
    candidates: suggestions,
    automaticCorrectionAllowed: false,
  };
}

export function evaluateChinesePlaceNameSuggestionHoldout(input: {
  vectors: readonly ChinesePlaceNameSuggestionHoldoutVector[];
  maxCandidates?: number;
  records?: readonly ChineseRegionalPlaceNameRecord[];
}): ChinesePlaceNameSuggestionHoldoutReport {
  const forbiddenIssues = findForbiddenKeys(input.vectors);
  if (forbiddenIssues.length) {
    throw new Error('Chinese suggestion holdout vectors contain forbidden fields');
  }
  const maxCandidates = input.maxCandidates ?? 3;
  if (!Number.isInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > 10) {
    throw new Error('Chinese suggestion holdout maxCandidates must be between 1 and 10');
  }
  const ids = new Set<string>();
  const caseFingerprints = new Set<string>();
  for (const vector of input.vectors) {
    if (!vector.id || ids.has(vector.id)) {
      throw new Error('Chinese suggestion holdout vector IDs must be unique and non-empty');
    }
    ids.add(vector.id);
    if (!COUNTRY_CODES.has(vector.countryCode)) {
      throw new Error('Chinese suggestion holdout country is unsupported');
    }
    const normalizedInput = normalizedName(vector.nativeName);
    if (!normalizedInput) {
      throw new Error('Chinese suggestion holdout nativeName must be non-empty');
    }
    const caseFingerprint = `${vector.countryCode}:${normalizedInput}`;
    if (caseFingerprints.has(caseFingerprint)) {
      throw new Error(
        'Chinese suggestion holdout cases must have unique country and normalized input fingerprints',
      );
    }
    caseFingerprints.add(caseFingerprint);
  }

  const countries = new Map<ChinesePlaceNameCountryCode, {
    total: number;
    expectedSuggestions: number;
    expectedNoSuggestions: number;
    top1Correct: number;
    falseSuggestionCases: number;
  }>();
  let expectedSuggestions = 0;
  let expectedNoSuggestions = 0;
  let top1Correct = 0;
  let topKCorrect = 0;
  let falseSuggestionCases = 0;
  let missedSuggestionCases = 0;
  let safeNoSuggestions = 0;

  for (const vector of input.vectors) {
    const country = countries.get(vector.countryCode) ?? {
      total: 0,
      expectedSuggestions: 0,
      expectedNoSuggestions: 0,
      top1Correct: 0,
      falseSuggestionCases: 0,
    };
    country.total += 1;
    countries.set(vector.countryCode, country);
    const result = suggestChineseRegionalPlaceNameCandidates({
      countryCode: vector.countryCode,
      nativeName: vector.nativeName,
      maxCandidates,
      records: input.records,
    });
    if (result.status === 'rejected-input' || result.status === 'rejected-evidence') {
      throw new Error(`Chinese suggestion holdout evaluation rejected: ${result.issues.join('; ')}`);
    }
    const candidates = result.status === 'suggested' ? result.candidates : [];

    if (vector.expected.status === 'suggested') {
      expectedSuggestions += 1;
      country.expectedSuggestions += 1;
      const expectedRecordId = vector.expected.recordId;
      if (!candidates.length) {
        missedSuggestionCases += 1;
        continue;
      }
      if (candidates[0].recordId === expectedRecordId) {
        top1Correct += 1;
        country.top1Correct += 1;
      }
      if (candidates.some(candidate => candidate.recordId === expectedRecordId)) {
        topKCorrect += 1;
      } else {
        missedSuggestionCases += 1;
      }
      continue;
    }

    expectedNoSuggestions += 1;
    country.expectedNoSuggestions += 1;
    if (candidates.length) {
      falseSuggestionCases += 1;
      country.falseSuggestionCases += 1;
    } else {
      safeNoSuggestions += 1;
    }
  }

  return {
    total: input.vectors.length,
    expectedSuggestions,
    expectedNoSuggestions,
    top1Correct,
    topKCorrect,
    falseSuggestionCases,
    missedSuggestionCases,
    top1Accuracy: expectedSuggestions ? top1Correct / expectedSuggestions : 1,
    topKAccuracy: expectedSuggestions ? topKCorrect / expectedSuggestions : 1,
    safeNoSuggestionRate: expectedNoSuggestions
      ? safeNoSuggestions / expectedNoSuggestions
      : 1,
    maxCandidates,
    countrySummaries: [...countries.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([countryCode, counts]) => ({ countryCode, ...counts })),
    nonClaim: 'Aggregate synthetic typo-candidate metrics do not validate an address, authorize automatic correction, or prove delivery reachability.',
  };
}

export function assessChinesePlaceNameSuggestionHoldout(
  report: ChinesePlaceNameSuggestionHoldoutReport,
  policy: ChinesePlaceNameSuggestionQualityPolicy =
    DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY,
): ChinesePlaceNameSuggestionQualityGate {
  const requiredCountryCodes = [...new Set(policy.requiredCountryCodes)];
  const rates = [
    policy.minimumTop1Accuracy,
    policy.minimumTopKAccuracy,
    policy.minimumSafeNoSuggestionRate,
  ];
  if (
    !requiredCountryCodes.length
    || requiredCountryCodes.length !== policy.requiredCountryCodes.length
    || requiredCountryCodes.some(code => !COUNTRY_CODES.has(code))
    || !Number.isInteger(policy.minimumTotal)
    || !Number.isInteger(policy.minimumPerCountry)
    || policy.minimumPerCountry < 1
    || !Number.isInteger(policy.minimumExpectedSuggestionsPerCountry)
    || policy.minimumExpectedSuggestionsPerCountry < 0
    || !Number.isInteger(policy.minimumExpectedNoSuggestionsPerCountry)
    || policy.minimumExpectedNoSuggestionsPerCountry < 0
    || policy.minimumExpectedSuggestionsPerCountry
      + policy.minimumExpectedNoSuggestionsPerCountry > policy.minimumPerCountry
    || policy.minimumTotal < policy.minimumPerCountry * requiredCountryCodes.length
    || rates.some(rate => !Number.isFinite(rate) || rate < 0 || rate > 1)
    || !Number.isInteger(policy.maximumFalseSuggestionCases)
    || policy.maximumFalseSuggestionCases < 0
  ) {
    throw new Error('Chinese suggestion quality policy is invalid');
  }
  const countrySummaries = new Map(
    report.countrySummaries.map(summary => [summary.countryCode, summary]),
  );
  const coveredCountries = requiredCountryCodes.filter(
    code => (countrySummaries.get(code)?.total ?? 0) >= policy.minimumPerCountry,
  ).length;
  const suggestionCoveredCountries = requiredCountryCodes.filter(
    code => (countrySummaries.get(code)?.expectedSuggestions ?? 0)
      >= policy.minimumExpectedSuggestionsPerCountry,
  ).length;
  const noSuggestionCoveredCountries = requiredCountryCodes.filter(
    code => (countrySummaries.get(code)?.expectedNoSuggestions ?? 0)
      >= policy.minimumExpectedNoSuggestionsPerCountry,
  ).length;
  const checks: ChinesePlaceNameSuggestionQualityGate['checks'] = [
    {
      id: 'minimum-total',
      status: report.total >= policy.minimumTotal ? 'passed' : 'blocked',
      actual: report.total,
      required: `>=${policy.minimumTotal}`,
    },
    {
      id: 'country-coverage',
      status: coveredCountries === requiredCountryCodes.length ? 'passed' : 'blocked',
      actual: coveredCountries,
      required: `${requiredCountryCodes.length} countries with >=${policy.minimumPerCountry} cases each`,
    },
    {
      id: 'expected-suggestion-coverage',
      status: suggestionCoveredCountries === requiredCountryCodes.length
        ? 'passed'
        : 'blocked',
      actual: suggestionCoveredCountries,
      required: `${requiredCountryCodes.length} countries with >=${policy.minimumExpectedSuggestionsPerCountry} expected suggestions each`,
    },
    {
      id: 'expected-no-suggestion-coverage',
      status: noSuggestionCoveredCountries === requiredCountryCodes.length
        ? 'passed'
        : 'blocked',
      actual: noSuggestionCoveredCountries,
      required: `${requiredCountryCodes.length} countries with >=${policy.minimumExpectedNoSuggestionsPerCountry} expected no-suggestion cases each`,
    },
    {
      id: 'top1-accuracy',
      status: report.top1Accuracy >= policy.minimumTop1Accuracy ? 'passed' : 'blocked',
      actual: report.top1Accuracy,
      required: `>=${policy.minimumTop1Accuracy}`,
    },
    {
      id: 'topk-accuracy',
      status: report.topKAccuracy >= policy.minimumTopKAccuracy ? 'passed' : 'blocked',
      actual: report.topKAccuracy,
      required: `>=${policy.minimumTopKAccuracy}`,
    },
    {
      id: 'safe-no-suggestion',
      status: report.safeNoSuggestionRate >= policy.minimumSafeNoSuggestionRate
        ? 'passed'
        : 'blocked',
      actual: report.safeNoSuggestionRate,
      required: `>=${policy.minimumSafeNoSuggestionRate}`,
    },
    {
      id: 'false-suggestions',
      status: report.falseSuggestionCases <= policy.maximumFalseSuggestionCases
        ? 'passed'
        : 'blocked',
      actual: report.falseSuggestionCases,
      required: `<=${policy.maximumFalseSuggestionCases}`,
    },
  ];
  const status = checks.every(check => check.status === 'passed')
    ? 'passed'
    : 'blocked';
  return {
    version: CHINESE_PLACE_NAME_SUGGESTION_QUALITY_GATE_VERSION,
    policy: {
      ...policy,
      requiredCountryCodes: [...requiredCountryCodes].sort(),
    },
    status,
    checks,
    eligibleForVersionedHoldoutReview: status === 'passed',
    automaticCorrectionEnabled: false,
    deliveryClaimsEnabled: false,
  };
}

export function listChineseRegionalPlaceNameRecords(
  countryCode: string,
  records: readonly ChineseRegionalPlaceNameRecord[] = CHINESE_REGIONAL_PLACE_NAME_RECORDS,
) {
  const code = countryCode.toUpperCase();
  return records.filter(item => item.countryCode === code);
}

export function resolveChineseRegionalPlaceName(options: {
  countryCode: string;
  nativeName: string;
  records?: readonly ChineseRegionalPlaceNameRecord[];
}): ChineseRegionalPlaceNameResolution {
  const records = options.records ?? CHINESE_REGIONAL_PLACE_NAME_RECORDS;
  const issues = auditChineseRegionalPlaceNameRecords(records);
  if (issues.length) return { status: 'rejected-evidence', searchAliases: [], issues };

  const countryCode = options.countryCode.toUpperCase();
  const nativeName = normalizedName(options.nativeName);
  if (!nativeName || !COUNTRY_CODES.has(countryCode as ChinesePlaceNameCountryCode)) {
    return { status: 'unmatched', searchAliases: [] };
  }

  const candidates = records.filter(item => (
    item.countryCode === countryCode &&
    item.nativeNames.some(name => normalizedName(name) === nativeName)
  ));
  const deliveryNames = new Set(candidates.map(item => item.englishName));
  if (deliveryNames.size > 1) {
    return {
      status: 'ambiguous',
      searchAliases: [],
      candidateIds: candidates.map(item => item.id),
    };
  }

  const resolved = candidates[0];
  if (!resolved) return { status: 'unmatched', searchAliases: [] };
  return {
    status: 'resolved',
    englishName: resolved.englishName,
    searchAliases: resolved.searchAliases ?? [],
    record: resolved,
  };
}
