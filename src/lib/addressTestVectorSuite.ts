import { getAddressQualitySummary } from './addressQualitySummary';
import { normalizeAddressText } from './addressUtils';
import { type CanonicalAddressParts, normalizeApiAddress } from './addressIntelligence';
import { AddressRenderer, normalizeUnicode, type CanonicalAddress } from './addressRendering';
import {
  buildRegistrationAddressLanguageTabs,
  type RegistrationAddressFormatSource,
} from './addressRegistrationState';
import { validateAddressWithOpenSourceRules } from './addressValidation';
import {
  getAgidAddressDisplayTabs,
  getAgidAddressTabLanguages,
  type EnglishAddressCircle,
} from './languageTabs';
import { stableCommitment, stableJson } from './redactedWorkflowCore';

export const ADDRESS_TEST_VECTOR_SUITE_VERSION = 'address-test-vector-suite-v0.1';

export type AddressTestVectorSurface =
  | 'normalization'
  | 'validation'
  | 'rendering'
  | 'language-tabs'
  | 'privacy-boundary';

export type AddressTestVectorPrivacyClass =
  | 'synthetic-public'
  | 'redacted-public';

export type AddressTestVectorFormat = NonNullable<Parameters<typeof validateAddressWithOpenSourceRules>[1]>;

export type AddressTestVectorLanguageInput = {
  countryCode: string;
  preferredLanguage?: string;
  countryLanguages?: string[];
  knownLanguageCodes: string[];
  registrationFormat?: RegistrationAddressFormatSource;
};

export type AddressTestVectorInput = {
  rawText?: string;
  rawObject?: Record<string, unknown>;
  canonical?: CanonicalAddressParts;
  format?: AddressTestVectorFormat;
  sources?: string[];
  referenceMatches?: Array<{ source: string; confidence: number }>;
  rendererTabs?: string[];
  language?: AddressTestVectorLanguageInput;
};

export type AddressTestVectorExpected = {
  normalizedText?: string;
  normalizedObject?: CanonicalAddressParts;
  validation?: {
    status: ReturnType<typeof validateAddressWithOpenSourceRules>['status'];
    score: number;
    postalCodeValid: boolean | null;
    missingRequiredFields: string[];
    qualityMode: ReturnType<typeof validateAddressWithOpenSourceRules>['quality']['mode'];
    qualityLabel: ReturnType<typeof validateAddressWithOpenSourceRules>['quality']['label'];
    confidenceLabel: string;
    checkedWith: string[];
  };
  renderings?: Record<string, string>;
  languageTabs?: Array<{
    code: string;
    kind: 'domestic' | 'international';
    englishCircle?: Extract<EnglishAddressCircle, 'inner' | 'outer'>;
  }>;
  displayTabs?: string[];
  noRawPrivateMaterial: true;
  expectedFingerprint: string;
};

export type AddressTestVector = {
  vectorId: string;
  title: string;
  surfaces: AddressTestVectorSurface[];
  countryCode?: string;
  privacyClass: AddressTestVectorPrivacyClass;
  license: 'CC0';
  description: string;
  input: AddressTestVectorInput;
  expected: AddressTestVectorExpected;
};

export type AddressTestVectorSuiteManifest = {
  suiteId: 'address-test-vector-suite';
  version: typeof ADDRESS_TEST_VECTOR_SUITE_VERSION;
  generatedAt: string;
  license: 'CC0 for synthetic vectors; Apache-2.0 for generator code';
  redistributionPolicy: string;
  privacyPolicy: string;
  counts: {
    vectors: number;
    countries: number;
    surfaces: Record<AddressTestVectorSurface, number>;
  };
  files: Array<{
    path: string;
    role: 'manifest' | 'suite' | 'vectors' | 'documentation';
    mediaType: 'application/json' | 'text/markdown';
    containsPersonalData: false;
    containsThirdPartyData: false;
  }>;
};

export type AddressTestVectorSuite = {
  manifest: AddressTestVectorSuiteManifest;
  vectors: AddressTestVector[];
  conformance: {
    requiredChecks: string[];
    forbiddenPrivateKeys: string[];
    publicImplementationNotes: string[];
  };
};

export type AddressTestVectorSuiteValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

type AddressTestVectorSeed = Omit<AddressTestVector, 'expected' | 'license'>;

const GENERATED_AT = '2026-06-20T00:00:00.000Z';

const FORBIDDEN_PRIVATE_KEYS = [
  'rawAddress',
  'recipientName',
  'phone',
  'phoneNumber',
  'email',
  'proofCode',
  'passkeyChallenge',
  'aoidSecret',
  'privateKey',
  'secret',
  'agidSPlaintext',
  'credentialBody',
  'passportNumber',
];

function registrationFields(format: AddressTestVectorFormat) {
  return (format.native?.fields || []).map(field => ({
    ...field,
    label: field.label || field.key,
  }));
}

const JP_SYNTHETIC_FORMAT: AddressTestVectorFormat = {
  countryCode: 'JP',
  name: 'Japan synthetic postal metadata',
  native: {
    addressFormat: '〒{{postcode}}\n{{state}}{{city}}{{district}}{{subdistrict}}{{street}}{{houseNumber}}\n{{organization}}',
    fields: [
      { key: 'postcode', required: true },
      { key: 'state', required: true },
      { key: 'city', required: true },
      { key: 'street', required: true },
      { key: 'houseNumber', required: true },
    ],
  },
  english: {
    addressFormat: '{{organization}}\n{{houseNumber}} {{street}}, {{subdistrict}}, {{district}}\n{{city}}, {{state}} {{postcode}}\n{{country}}',
  },
  postalCode: {
    regex: '^\\d{3}-?\\d{4}$',
    source: 'Japan Post official-format synthetic fixture',
    api: 'japan-post-synthetic-fixture',
    format: 'NNN-NNNN',
  },
  openSourceIds: ['libaddressinput-synthetic', 'gsi-japan-synthetic'],
};

const JP_REGISTRATION_FORMAT: RegistrationAddressFormatSource = {
  countryCode: 'JP',
  name: 'Japan synthetic registration metadata',
  native: {
    name: 'Japanese',
    addressFormat: JP_SYNTHETIC_FORMAT.native?.addressFormat || '',
    fields: registrationFields(JP_SYNTHETIC_FORMAT),
  },
  english: {
    name: 'English',
    addressFormat: JP_SYNTHETIC_FORMAT.english?.addressFormat || '',
  },
  addressRules: {
    languages: [{ code: 'ja', name: 'Japanese' }],
    deliveryLanguages: [{ code: 'en', name: 'English (International Shipping)' }],
  },
};

const US_SYNTHETIC_FORMAT: AddressTestVectorFormat = {
  countryCode: 'US',
  name: 'United States synthetic postal metadata',
  native: {
    addressFormat: '{{organization}}\n{{houseNumber}} {{street}}\n{{city}}, {{state}} {{postcode}}\n{{country}}',
    fields: [
      { key: 'street', required: true },
      { key: 'houseNumber', required: true },
      { key: 'city', required: true },
      { key: 'state', required: true },
      { key: 'postcode', required: true },
    ],
  },
  english: {
    addressFormat: '{{organization}}\n{{houseNumber}} {{street}}\n{{city}}, {{state}} {{postcode}}\n{{country}}',
  },
  postalCode: {
    regex: '^\\d{5}(-\\d{4})?$',
    source: 'USPS official-format synthetic fixture',
    api: 'usps-synthetic-fixture',
    format: 'NNNNN',
  },
  openSourceIds: ['libaddressinput-synthetic', 'u.s. census synthetic fixture'],
};

const US_REGISTRATION_FORMAT: RegistrationAddressFormatSource = {
  countryCode: 'US',
  name: 'United States synthetic registration metadata',
  native: {
    name: 'English',
    addressFormat: US_SYNTHETIC_FORMAT.native?.addressFormat || '',
    fields: registrationFields(US_SYNTHETIC_FORMAT),
  },
  english: {
    name: 'English',
    addressFormat: US_SYNTHETIC_FORMAT.english?.addressFormat || '',
  },
  addressRules: {
    languages: [{ code: 'en', name: 'English' }],
    deliveryLanguages: [{ code: 'en', name: 'English (International Shipping)' }],
  },
};

const DE_SYNTHETIC_FORMAT: AddressTestVectorFormat = {
  countryCode: 'DE',
  name: 'Germany synthetic postal metadata',
  native: {
    addressFormat: '{{street}} {{houseNumber}}\n{{postcode}} {{city}}\n{{country}}',
    fields: [
      { key: 'street', required: true },
      { key: 'houseNumber', required: true },
      { key: 'postcode', required: true },
      { key: 'city', required: true },
    ],
  },
  english: {
    addressFormat: '{{street}} {{houseNumber}}\n{{postcode}} {{city}}\n{{country}}',
  },
  postalCode: {
    regex: '^\\d{5}$',
    source: 'official-format synthetic fixture',
    api: 'openplz-synthetic-fixture',
    format: 'NNNNN',
  },
  openSourceIds: ['openplz-synthetic', 'libaddressinput-synthetic'],
};

const DE_REGISTRATION_FORMAT: RegistrationAddressFormatSource = {
  countryCode: 'DE',
  name: 'Germany synthetic registration metadata',
  native: {
    name: 'Deutsch',
    addressFormat: DE_SYNTHETIC_FORMAT.native?.addressFormat || '',
    fields: registrationFields(DE_SYNTHETIC_FORMAT),
  },
  english: {
    name: 'English',
    addressFormat: DE_SYNTHETIC_FORMAT.english?.addressFormat || '',
  },
  addressRules: {
    languages: [{ code: 'de', name: 'Deutsch' }],
    deliveryLanguages: [{ code: 'en', name: 'English (International Shipping)' }],
  },
};

const AE_NO_POSTAL_FORMAT: AddressTestVectorFormat = {
  countryCode: 'AE',
  name: 'United Arab Emirates synthetic no-postal metadata',
  native: {
    addressFormat: '{{organization}}\n{{street}} {{houseNumber}}\n{{city}}, {{state}}\n{{country}}',
  },
  english: {
    addressFormat: '{{organization}}\n{{street}} {{houseNumber}}\n{{city}}, {{state}}\n{{country}}',
  },
  postalCode: {
    regex: null,
    source: 'no postal code used for this synthetic fixture',
    api: null,
    format: null,
  },
  openSourceIds: ['overture-synthetic', 'natural-earth-synthetic', 'government-geoportal-synthetic'],
  addressRules: {
    openSourceIds: ['overture-synthetic', 'natural-earth-synthetic'],
    postalCode: {
      label: 'No postal code',
      required: false,
      usage: 'optional',
    },
  },
};

const AE_REGISTRATION_FORMAT: RegistrationAddressFormatSource = {
  countryCode: 'AE',
  name: 'United Arab Emirates synthetic registration metadata',
  native: {
    name: 'Arabic',
    addressFormat: AE_NO_POSTAL_FORMAT.native?.addressFormat || '',
  },
  english: {
    name: 'English',
    addressFormat: AE_NO_POSTAL_FORMAT.english?.addressFormat || '',
  },
  addressRules: {
    languages: [
      { code: 'ar', name: 'Arabic' },
      { code: 'en', name: 'English' },
    ],
    deliveryLanguages: [{ code: 'en', name: 'English (International Shipping)' }],
  },
};

const ADDRESS_TEST_VECTOR_SEEDS: AddressTestVectorSeed[] = [
  {
    vectorId: 'addrvec-normalize-fullwidth-v1',
    title: 'NFKC and whitespace normalization',
    surfaces: ['normalization', 'privacy-boundary'],
    privacyClass: 'synthetic-public',
    description: 'Confirms public implementations normalize fullwidth alphanumerics and address whitespace without storing raw private material.',
    input: {
      rawText: '  ＡＧＩＤ　Ｔｅｓｔ　１２３　Ｂｌｏｃｋ  ',
    },
  },
  {
    vectorId: 'addrvec-jp-postal-render-v1',
    title: 'Japan synthetic postal-verified rendering',
    surfaces: ['validation', 'rendering', 'language-tabs', 'privacy-boundary'],
    countryCode: 'JP',
    privacyClass: 'synthetic-public',
    description: 'Synthetic Japanese address fixture for postal validation, domestic rendering, international English rendering, and tabs.',
    input: {
      canonical: {
        country_code: 'JP',
        country: 'Japan',
        state: '東京都',
        city: 'テスト市',
        district: '中央区',
        subdistrict: 'サンプル町',
        road: '例通り',
        house_number: '1-2-3',
        building: 'AGID検証ビル',
        postcode: '100-0001',
      },
      format: JP_SYNTHETIC_FORMAT,
      sources: ['japan-post-synthetic-fixture', 'gsi-japan-synthetic'],
      referenceMatches: [{ source: 'synthetic-postal-reference', confidence: 0.93 }],
      rendererTabs: ['ja', 'en', 'intl_en'],
      language: {
        countryCode: 'JP',
        preferredLanguage: 'ja',
        countryLanguages: ['ja'],
        knownLanguageCodes: ['ja', 'en', 'en_domestic'],
        registrationFormat: JP_REGISTRATION_FORMAT,
      },
    },
  },
  {
    vectorId: 'addrvec-us-invalid-postcode-v1',
    title: 'United States invalid postcode stays partial',
    surfaces: ['validation', 'rendering', 'language-tabs', 'privacy-boundary'],
    countryCode: 'US',
    privacyClass: 'synthetic-public',
    description: 'Synthetic US fixture with an invalid postcode; implementations must not auto-verify it.',
    input: {
      canonical: {
        country_code: 'US',
        country: 'United States',
        state: 'CA',
        city: 'Example City',
        road: 'Sample Avenue',
        house_number: '42',
        building: 'AGID Test Lab',
        postcode: 'ABCDE',
      },
      format: US_SYNTHETIC_FORMAT,
      sources: ['usps-synthetic-fixture'],
      rendererTabs: ['en_domestic', 'en', 'intl_en'],
      language: {
        countryCode: 'US',
        preferredLanguage: 'en',
        countryLanguages: ['en', 'es'],
        knownLanguageCodes: ['en', 'en_domestic', 'es'],
        registrationFormat: US_REGISTRATION_FORMAT,
      },
    },
  },
  {
    vectorId: 'addrvec-de-road-first-v1',
    title: 'Germany road-first rendering',
    surfaces: ['validation', 'rendering', 'language-tabs', 'privacy-boundary'],
    countryCode: 'DE',
    privacyClass: 'synthetic-public',
    description: 'Synthetic German fixture for road-first house-number ordering and reliable postal format validation.',
    input: {
      canonical: {
        country_code: 'DE',
        country: 'Germany',
        state: 'Testland',
        city: 'Musterstadt',
        road: 'Beispielstrasse',
        house_number: '7A',
        building: 'AGID Musterhaus',
        postcode: '10115',
      },
      format: DE_SYNTHETIC_FORMAT,
      sources: ['openplz-synthetic-fixture'],
      rendererTabs: ['de', 'en', 'intl_en'],
      language: {
        countryCode: 'DE',
        preferredLanguage: 'de',
        countryLanguages: ['de'],
        knownLanguageCodes: ['de', 'en', 'en_domestic'],
        registrationFormat: DE_REGISTRATION_FORMAT,
      },
    },
  },
  {
    vectorId: 'addrvec-ae-no-postal-geo-v1',
    title: 'No-postal-code geography-verified fixture',
    surfaces: ['validation', 'rendering', 'language-tabs', 'privacy-boundary'],
    countryCode: 'AE',
    privacyClass: 'synthetic-public',
    description: 'Synthetic no-postal-code fixture; strong open geography evidence can verify display without a postcode.',
    input: {
      canonical: {
        country_code: 'AE',
        country: 'United Arab Emirates',
        state: 'Synthetic Emirate',
        city: 'Example District',
        road: 'Test Corridor',
        house_number: '8',
        building: 'AGID Delivery Point',
      },
      format: AE_NO_POSTAL_FORMAT,
      sources: ['overture-synthetic', 'government-geoportal-synthetic'],
      referenceMatches: [{ source: 'synthetic-agid-reverse-geocode', confidence: 0.8 }],
      rendererTabs: ['en_domestic', 'en', 'intl_en'],
      language: {
        countryCode: 'AE',
        preferredLanguage: 'en',
        countryLanguages: ['ar', 'en'],
        knownLanguageCodes: ['ar', 'en', 'en_domestic'],
        registrationFormat: AE_REGISTRATION_FORMAT,
      },
    },
  },
  {
    vectorId: 'addrvec-redacted-public-event-v1',
    title: 'Redacted public event payload',
    surfaces: ['privacy-boundary'],
    privacyClass: 'redacted-public',
    description: 'Ensures public vectors can describe address events through commitments and refs without raw address, phone, proof code, or AOID secret.',
    input: {
      rawObject: {
        eventType: 'address_intent.verified',
        addressRef: 'addr_ref_synthetic_001',
        commitment: 'addr_commitment:synthetic:7c9b1b2e',
        countryCode: 'JP',
        scopes: ['delivery:read', 'recipient:verify'],
      },
    },
  },
];

function toRendererCanonical(address: CanonicalAddressParts): CanonicalAddress {
  return {
    country_code: address.country_code || '',
    country: address.country || '',
    state: address.state || '',
    city: address.city || '',
    district: address.district || '',
    subdistrict: address.subdistrict || '',
    suburb: address.suburb || '',
    road: address.road || '',
    house_number: address.house_number || '',
    building: address.building || '',
    postcode: address.postcode || '',
    poi: address.poi || '',
    plus_code: address.plus_code,
  };
}

function pickValidationExpected(validation: ReturnType<typeof validateAddressWithOpenSourceRules>) {
  const summary = getAddressQualitySummary(validation);
  return {
    status: validation.status,
    score: validation.score,
    postalCodeValid: validation.postalCodeValid,
    missingRequiredFields: [...validation.missingRequiredFields],
    qualityMode: validation.quality.mode,
    qualityLabel: validation.quality.label,
    confidenceLabel: summary.confidenceLabel,
    checkedWith: [...validation.checkedWith],
  };
}

function computeExpectedFingerprint(expected: Omit<AddressTestVectorExpected, 'expectedFingerprint'>) {
  return stableCommitment('addrvec', expected, { length: 24 });
}

export function evaluateAddressTestVector(seed: AddressTestVectorSeed): AddressTestVectorExpected {
  const expectedWithoutFingerprint: Omit<AddressTestVectorExpected, 'expectedFingerprint'> = {
    noRawPrivateMaterial: true,
  };

  if (seed.input.rawText !== undefined) {
    expectedWithoutFingerprint.normalizedText = normalizeAddressText(normalizeUnicode(seed.input.rawText));
  }

  if (seed.input.rawObject) {
    expectedWithoutFingerprint.normalizedObject = normalizeApiAddress(seed.input.rawObject);
  }

  if (seed.input.canonical) {
    if (seed.input.format) {
      expectedWithoutFingerprint.validation = pickValidationExpected(validateAddressWithOpenSourceRules(
        seed.input.canonical,
        seed.input.format,
        seed.input.sources || [],
        { referenceMatches: seed.input.referenceMatches || [] },
      ));
    }

    if (seed.input.rendererTabs?.length) {
      const canonical = toRendererCanonical(seed.input.canonical);
      expectedWithoutFingerprint.renderings = Object.fromEntries(seed.input.rendererTabs.map(tab => [
        tab,
        tab === 'intl_en'
          ? AddressRenderer.renderInternationalShippingEnglish(canonical)
          : AddressRenderer.render(tab, canonical),
      ]));
    }
  }

  if (seed.input.language) {
    const languages = getAgidAddressTabLanguages(seed.input.language);
    expectedWithoutFingerprint.displayTabs = getAgidAddressDisplayTabs(languages);
    expectedWithoutFingerprint.languageTabs = buildRegistrationAddressLanguageTabs(
      seed.input.language.registrationFormat,
      seed.input.language.countryCode,
    ).map(tab => ({
      code: tab.code,
      kind: tab.kind,
      ...(tab.englishCircle ? { englishCircle: tab.englishCircle } : {}),
    }));
  }

  return {
    ...expectedWithoutFingerprint,
    expectedFingerprint: computeExpectedFingerprint(expectedWithoutFingerprint),
  };
}

function createVector(seed: AddressTestVectorSeed): AddressTestVector {
  return {
    ...seed,
    license: 'CC0',
    expected: evaluateAddressTestVector(seed),
  };
}

function surfaceCounts(vectors: AddressTestVector[]) {
  const counts = {
    normalization: 0,
    validation: 0,
    rendering: 0,
    'language-tabs': 0,
    'privacy-boundary': 0,
  } satisfies Record<AddressTestVectorSurface, number>;

  for (const vector of vectors) {
    for (const surface of vector.surfaces) counts[surface] += 1;
  }

  return counts;
}

function hasForbiddenPrivateKey(value: unknown, path = '$'): string[] {
  if (value === null || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => hasForbiddenPrivateKey(item, `${path}[${index}]`));
  }

  const record = value as Record<string, unknown>;
  const findings: string[] = [];
  for (const [key, nested] of Object.entries(record)) {
    const nextPath = `${path}.${key}`;
    if (FORBIDDEN_PRIVATE_KEYS.includes(key)) findings.push(nextPath);
    findings.push(...hasForbiddenPrivateKey(nested, nextPath));
  }
  return findings;
}

export function buildAddressTestVectorSuite(input: {
  generatedAt?: string;
  vectors?: AddressTestVectorSeed[];
} = {}): AddressTestVectorSuite {
  const generatedAt = input.generatedAt || GENERATED_AT;
  const vectors = (input.vectors || ADDRESS_TEST_VECTOR_SEEDS).map(createVector);
  const countries = new Set(vectors.map(vector => vector.countryCode).filter(Boolean));

  return {
    manifest: {
      suiteId: 'address-test-vector-suite',
      version: ADDRESS_TEST_VECTOR_SUITE_VERSION,
      generatedAt,
      license: 'CC0 for synthetic vectors; Apache-2.0 for generator code',
      redistributionPolicy: 'The suite contains synthetic and redacted public fixtures only. It does not bundle real user addresses, proof codes, AOID secrets, phone numbers, emails, or third-party address datasets.',
      privacyPolicy: 'Public vectors must be synthetic-public or redacted-public and must pass the no-raw-private-material scan.',
      counts: {
        vectors: vectors.length,
        countries: countries.size,
        surfaces: surfaceCounts(vectors),
      },
      files: [
        {
          path: 'data/address_test_vectors/manifest.json',
          role: 'manifest',
          mediaType: 'application/json',
          containsPersonalData: false,
          containsThirdPartyData: false,
        },
        {
          path: 'data/address_test_vectors/address-test-vector-suite.json',
          role: 'suite',
          mediaType: 'application/json',
          containsPersonalData: false,
          containsThirdPartyData: false,
        },
        {
          path: 'data/address_test_vectors/vectors.json',
          role: 'vectors',
          mediaType: 'application/json',
          containsPersonalData: false,
          containsThirdPartyData: false,
        },
        {
          path: 'data/address_test_vectors/README.md',
          role: 'documentation',
          mediaType: 'text/markdown',
          containsPersonalData: false,
          containsThirdPartyData: false,
        },
      ],
    },
    vectors,
    conformance: {
      requiredChecks: [
        'normalization expected output must match',
        'validation expected status, score, quality, and postcode state must match',
        'rendering outputs must match by tab',
        'language tab order and display tabs must match',
        'no forbidden private keys may appear in public vectors',
        'expectedFingerprint must match stable expected payload',
      ],
      forbiddenPrivateKeys: [...FORBIDDEN_PRIVATE_KEYS],
      publicImplementationNotes: [
        'Vectors are synthetic or redacted; do not replace them with real user addresses.',
        'Use vectors as conformance fixtures for SDKs, Address Element, Local Resolver, POS, and Developer Console.',
        'Country-specific sources in these vectors are synthetic fixture labels and not claims that source datasets are bundled.',
      ],
    },
  };
}

export function validateAddressTestVectorSuite(
  suite = buildAddressTestVectorSuite(),
): AddressTestVectorSuiteValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const vectorIds = new Set<string>();

  if (suite.manifest.version !== ADDRESS_TEST_VECTOR_SUITE_VERSION) errors.push('version-mismatch');
  if (suite.manifest.counts.vectors !== suite.vectors.length) errors.push('vector-count-mismatch');
  if (!suite.manifest.redistributionPolicy.includes('synthetic')) errors.push('missing-synthetic-redistribution-policy');
  if (!suite.manifest.privacyPolicy.includes('no-raw-private-material')) errors.push('missing-no-raw-private-material-policy');

  for (const file of suite.manifest.files) {
    if (file.containsPersonalData !== false) errors.push(`file-personal-data-not-false:${file.path}`);
    if (file.containsThirdPartyData !== false) errors.push(`file-third-party-data-not-false:${file.path}`);
  }

  for (const vector of suite.vectors) {
    if (vectorIds.has(vector.vectorId)) errors.push(`duplicate-vector:${vector.vectorId}`);
    vectorIds.add(vector.vectorId);

    if (vector.license !== 'CC0') errors.push(`vector-license-not-cc0:${vector.vectorId}`);
    if (vector.privacyClass !== 'synthetic-public' && vector.privacyClass !== 'redacted-public') {
      errors.push(`vector-privacy-class-invalid:${vector.vectorId}`);
    }

    const forbiddenKeyPaths = hasForbiddenPrivateKey(vector.input);
    for (const finding of forbiddenKeyPaths) {
      errors.push(`forbidden-private-key:${vector.vectorId}:${finding}`);
    }

    const seed: AddressTestVectorSeed = {
      vectorId: vector.vectorId,
      title: vector.title,
      surfaces: vector.surfaces,
      countryCode: vector.countryCode,
      privacyClass: vector.privacyClass,
      description: vector.description,
      input: vector.input,
    };
    const recomputed = evaluateAddressTestVector(seed);
    if (stableJson(recomputed) !== stableJson(vector.expected)) {
      errors.push(`expected-output-mismatch:${vector.vectorId}`);
    }

    if (vector.surfaces.includes('validation') && !vector.expected.validation) {
      errors.push(`validation-vector-missing-validation:${vector.vectorId}`);
    }
    if (vector.surfaces.includes('rendering') && !vector.expected.renderings) {
      errors.push(`rendering-vector-missing-renderings:${vector.vectorId}`);
    }
    if (vector.surfaces.includes('language-tabs') && !vector.expected.languageTabs) {
      errors.push(`language-vector-missing-tabs:${vector.vectorId}`);
    }
    if (!vector.expected.noRawPrivateMaterial) {
      errors.push(`no-raw-private-material-not-true:${vector.vectorId}`);
    }
  }

  if (!suite.vectors.some(vector => vector.surfaces.includes('privacy-boundary'))) {
    warnings.push('no-privacy-boundary-vector');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
