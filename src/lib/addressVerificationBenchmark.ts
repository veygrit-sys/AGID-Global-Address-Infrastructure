export const ADDRESS_VERIFICATION_BENCHMARK_VERSION = 'address-verification-benchmark-v1';

export const ADDRESS_VERIFICATION_BENCHMARK_DIMENSIONS = [
  'globalPostalCoverage',
  'deliveryPointDepth',
  'authoritativePostalDepth',
  'correctionAndStandardization',
  'fuzzyMatching',
  'geocodingDepth',
  'autocompleteCapture',
  'languageAndScriptHandling',
  'naturalFeatureContext',
  'openSourceAuditability',
  'privacyLocalFirst',
  'costControl',
] as const;

export type AddressVerificationBenchmarkDimension =
  (typeof ADDRESS_VERIFICATION_BENCHMARK_DIMENSIONS)[number];

export type AddressVerificationBenchmarkProfile = {
  id: string;
  label: string;
  kind: 'agid' | 'commercial-api' | 'maps-api' | 'open-source';
  metrics: {
    claimedCountries?: number;
    addressFormatCountries?: number;
    explicitPolicyCountries?: number;
    notes: string[];
  };
  scores: Record<AddressVerificationBenchmarkDimension, number>;
  strengths: string[];
  risks: string[];
  sourceEvidence: string[];
};

export type AddressVerificationBenchmarkSummary = {
  id: string;
  label: string;
  kind: AddressVerificationBenchmarkProfile['kind'];
  score: number;
  strongestDimensions: AddressVerificationBenchmarkDimension[];
  weakestDimensions: AddressVerificationBenchmarkDimension[];
};

export type AddressVerificationBenchmarkGap = {
  dimension: AddressVerificationBenchmarkDimension;
  agidScore: number;
  bestCompetitorScore: number;
  bestCompetitorIds: string[];
  delta: number;
  priority: 'high' | 'medium' | 'low';
};

export type AgidAddressVerificationBenchmarkInput = {
  addressFormatCountryCount: number;
  explicitPolicyCountryCount: number;
};

export const ADDRESS_VERIFICATION_DIMENSION_WEIGHTS: Record<AddressVerificationBenchmarkDimension, number> = {
  globalPostalCoverage: 0.13,
  deliveryPointDepth: 0.14,
  authoritativePostalDepth: 0.13,
  correctionAndStandardization: 0.1,
  fuzzyMatching: 0.08,
  geocodingDepth: 0.08,
  autocompleteCapture: 0.06,
  languageAndScriptHandling: 0.08,
  naturalFeatureContext: 0.07,
  openSourceAuditability: 0.06,
  privacyLocalFirst: 0.05,
  costControl: 0.03,
};

function clampScore(score: number) {
  return Math.max(0, Math.min(10, score));
}

function roundScore(score: number) {
  return Math.round(score * 10) / 10;
}

function bestDimensions(
  scores: Record<AddressVerificationBenchmarkDimension, number>,
  direction: 'strongest' | 'weakest',
) {
  return [...ADDRESS_VERIFICATION_BENCHMARK_DIMENSIONS]
    .sort((left, right) => (
      direction === 'strongest'
        ? scores[right] - scores[left]
        : scores[left] - scores[right]
    ))
    .slice(0, 3);
}

export function scoreAddressVerificationProfile(profile: AddressVerificationBenchmarkProfile) {
  const weighted = ADDRESS_VERIFICATION_BENCHMARK_DIMENSIONS.reduce(
    (score, dimension) => score + profile.scores[dimension] * ADDRESS_VERIFICATION_DIMENSION_WEIGHTS[dimension],
    0,
  );
  return roundScore(weighted);
}

export function summarizeAddressVerificationProfile(
  profile: AddressVerificationBenchmarkProfile,
): AddressVerificationBenchmarkSummary {
  return {
    id: profile.id,
    label: profile.label,
    kind: profile.kind,
    score: scoreAddressVerificationProfile(profile),
    strongestDimensions: bestDimensions(profile.scores, 'strongest'),
    weakestDimensions: bestDimensions(profile.scores, 'weakest'),
  };
}

export function compareAddressVerificationProfiles(
  profiles: AddressVerificationBenchmarkProfile[],
): AddressVerificationBenchmarkSummary[] {
  return profiles
    .map(summarizeAddressVerificationProfile)
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}

export function findAgidAddressVerificationGaps(
  agid: AddressVerificationBenchmarkProfile,
  competitors: AddressVerificationBenchmarkProfile[],
): AddressVerificationBenchmarkGap[] {
  return ADDRESS_VERIFICATION_BENCHMARK_DIMENSIONS.flatMap(dimension => {
    const bestCompetitorScore = Math.max(...competitors.map(competitor => competitor.scores[dimension]));
    const delta = roundScore(bestCompetitorScore - agid.scores[dimension]);
    if (delta <= 1) return [];
    const priority: AddressVerificationBenchmarkGap['priority'] =
      delta >= 3 ? 'high' : delta >= 2 ? 'medium' : 'low';

    return [{
      dimension,
      agidScore: agid.scores[dimension],
      bestCompetitorScore,
      bestCompetitorIds: competitors
        .filter(competitor => competitor.scores[dimension] === bestCompetitorScore)
        .map(competitor => competitor.id),
      delta,
      priority,
    }];
  }).sort((left, right) => right.delta - left.delta);
}

export function buildAgidAddressVerificationBenchmarkProfile({
  addressFormatCountryCount,
  explicitPolicyCountryCount,
}: AgidAddressVerificationBenchmarkInput): AddressVerificationBenchmarkProfile {
  const formatCoverageScore = Math.min(2.4, (addressFormatCountryCount / 281) * 2.4);
  const explicitPolicyScore = Math.min(1.8, (explicitPolicyCountryCount / 55) * 1.8);

  return {
    id: 'agid-current',
    label: 'AGID address verification engine',
    kind: 'agid',
    metrics: {
      addressFormatCountries: addressFormatCountryCount,
      explicitPolicyCountries: explicitPolicyCountryCount,
      notes: [
        'Scores assume the current open-source rules, address-format corpus, postal evidence matching, and optional OpenAddresses-style reference records.',
        'The score is an internal planning heuristic, not a user-facing quality label.',
      ],
    },
    scores: {
      globalPostalCoverage: roundScore(clampScore(2 + formatCoverageScore + explicitPolicyScore)),
      deliveryPointDepth: roundScore(clampScore(2.2 + explicitPolicyCountryCount / 28)),
      authoritativePostalDepth: roundScore(clampScore(3 + explicitPolicyCountryCount / 14)),
      correctionAndStandardization: 5.8,
      fuzzyMatching: 5.7,
      geocodingDepth: 5.5,
      autocompleteCapture: 4.8,
      languageAndScriptHandling: 7.1,
      naturalFeatureContext: 8.8,
      openSourceAuditability: 9.7,
      privacyLocalFirst: 9.4,
      costControl: 9.2,
    },
    strengths: [
      'Auditable open-source rules and evidence logs.',
      'Local-first verification path without mandatory third-party API calls.',
      'Natural feature and remote-place context beyond ordinary postal validation.',
    ],
    risks: [
      'Delivery-point and sub-building validation is weaker than commercial reference datasets.',
      'Country-specific authoritative postal evidence is still sparse outside the explicit target policies.',
      'No large public gold corpus has been wired into the benchmark yet.',
    ],
    sourceEvidence: [
      'AGID source: src/lib/addressVerificationEngine.ts',
      'AGID source: src/data/address_formats',
    ],
  };
}

export const ADDRESS_VERIFICATION_COMPETITOR_PROFILES: AddressVerificationBenchmarkProfile[] = [
  {
    id: 'experian',
    label: 'Experian Address Validation',
    kind: 'commercial-api',
    metrics: {
      claimedCountries: 245,
      notes: ['Official docs describe real-time and bulk address validation, formatting, enrichment, fuzzy matching, and authoritative postal sources.'],
    },
    scores: {
      globalPostalCoverage: 9.4,
      deliveryPointDepth: 9.1,
      authoritativePostalDepth: 9.2,
      correctionAndStandardization: 9.1,
      fuzzyMatching: 9.0,
      geocodingDepth: 8.4,
      autocompleteCapture: 8.7,
      languageAndScriptHandling: 8.7,
      naturalFeatureContext: 3.4,
      openSourceAuditability: 3.1,
      privacyLocalFirst: 3.5,
      costControl: 3.2,
    },
    strengths: [
      'Strong commercial reference data and fuzzy correction.',
      'Broad country coverage and enterprise uptime guarantees.',
      'Transliteration support across many character sets.',
    ],
    risks: [
      'Closed scoring and proprietary datasets reduce reproducibility.',
      'Commercial API dependency and licensing costs.',
      'Not designed as a named natural-feature identity engine.',
    ],
    sourceEvidence: [
      'https://docs.experianaperture.io/address-validation/experian-address-validation/overview/introduction/',
    ],
  },
  {
    id: 'loqate',
    label: 'GBG Loqate Verify',
    kind: 'commercial-api',
    metrics: {
      notes: ['Official coverage docs expose country-by-country verification and geocode levels from L1 to L5.'],
    },
    scores: {
      globalPostalCoverage: 9.5,
      deliveryPointDepth: 9.3,
      authoritativePostalDepth: 9.1,
      correctionAndStandardization: 8.9,
      fuzzyMatching: 8.6,
      geocodingDepth: 8.6,
      autocompleteCapture: 8.8,
      languageAndScriptHandling: 8.5,
      naturalFeatureContext: 3.3,
      openSourceAuditability: 3.2,
      privacyLocalFirst: 4.3,
      costControl: 3.4,
    },
    strengths: [
      'Very broad global verification coverage with delivery-point levels in strong countries.',
      'Clear country-level depth model.',
      'Cloud and installed product options.',
    ],
    risks: [
      'Closed reference data limits independent verification.',
      'Commercial dependency and cost.',
      'Postal-address focus does not cover AGID-style natural geography.',
    ],
    sourceEvidence: ['https://docs.loqate.com/data-coverage/introduction'],
  },
  {
    id: 'melissa',
    label: 'Melissa Global Address Verification',
    kind: 'commercial-api',
    metrics: {
      claimedCountries: 240,
      notes: ['Official material claims 240+ countries, correction, standardization, geocoding, autocomplete, and transliteration.'],
    },
    scores: {
      globalPostalCoverage: 9.2,
      deliveryPointDepth: 9.0,
      authoritativePostalDepth: 9.0,
      correctionAndStandardization: 9.0,
      fuzzyMatching: 8.4,
      geocodingDepth: 8.9,
      autocompleteCapture: 8.3,
      languageAndScriptHandling: 8.4,
      naturalFeatureContext: 3.2,
      openSourceAuditability: 3.0,
      privacyLocalFirst: 4.0,
      costControl: 3.3,
    },
    strengths: [
      'Strong postal correction, standardization, geocoding, and transliteration.',
      'CASS-certified US path and on-prem/cloud options.',
      'Good operational fit for shipping and CRM data quality.',
    ],
    risks: [
      'Closed datasets and proprietary parsing rules.',
      'Commercial API dependency and licensing.',
      'Postal-address focus is narrower than AGID natural-feature identity.',
    ],
    sourceEvidence: ['https://www.melissa.com/hubfs/resources/data-sheet-global-address-verification.pdf'],
  },
  {
    id: 'smarty',
    label: 'Smarty International Street Address API',
    kind: 'commercial-api',
    metrics: {
      notes: ['Official docs describe international verification with per-country verification/geocode accuracy differences and a separate stronger US API.'],
    },
    scores: {
      globalPostalCoverage: 8.5,
      deliveryPointDepth: 8.4,
      authoritativePostalDepth: 8.5,
      correctionAndStandardization: 8.4,
      fuzzyMatching: 8.0,
      geocodingDepth: 8.0,
      autocompleteCapture: 8.1,
      languageAndScriptHandling: 7.3,
      naturalFeatureContext: 3.2,
      openSourceAuditability: 3.2,
      privacyLocalFirst: 3.4,
      costControl: 4.0,
    },
    strengths: [
      'Strong shipping-address workflow, especially with the dedicated US products.',
      'Verification and geocode precision metadata.',
      'Clear API behavior around zero or more matches.',
    ],
    risks: [
      'Country depth varies and US should use a separate product for best metadata.',
      'Closed reference data.',
      'Natural feature context is not the core product.',
    ],
    sourceEvidence: ['https://www.smarty.com/docs/apis/international-street-api/reference'],
  },
  {
    id: 'google-address-validation',
    label: 'Google Address Validation API',
    kind: 'maps-api',
    metrics: {
      claimedCountries: 40,
      notes: ['Coverage is limited to the current official support table; data quality varies by country.'],
    },
    scores: {
      globalPostalCoverage: 7.0,
      deliveryPointDepth: 7.4,
      authoritativePostalDepth: 7.2,
      correctionAndStandardization: 8.0,
      fuzzyMatching: 7.6,
      geocodingDepth: 8.8,
      autocompleteCapture: 8.6,
      languageAndScriptHandling: 6.4,
      naturalFeatureContext: 5.1,
      openSourceAuditability: 3.7,
      privacyLocalFirst: 3.2,
      costControl: 3.9,
    },
    strengths: [
      'Strong geocoding and metadata in supported regions.',
      'Good integration with Google Maps and Places workflows.',
      'USPS CASS-compatible mode for US-specific flows.',
    ],
    risks: [
      'Supported country list is much smaller than 240+ country commercial providers.',
      'Language code in the input address is currently ignored by the validation method.',
      'PostalAddress is explicitly not intended to model roads, towns, or mountains.',
    ],
    sourceEvidence: [
      'https://developers.google.com/maps/documentation/address-validation/coverage',
      'https://developers.google.com/maps/documentation/address-validation/reference/rest/v1/TopLevel/validateAddress',
    ],
  },
  {
    id: 'nominatim-libpostal',
    label: 'Nominatim + libpostal style open-source stack',
    kind: 'open-source',
    metrics: {
      notes: ['Represents a self-hosted open geocoder and parser baseline, not a postal-authority deliverability product.'],
    },
    scores: {
      globalPostalCoverage: 5.4,
      deliveryPointDepth: 3.2,
      authoritativePostalDepth: 2.9,
      correctionAndStandardization: 4.0,
      fuzzyMatching: 5.8,
      geocodingDepth: 7.9,
      autocompleteCapture: 5.5,
      languageAndScriptHandling: 6.3,
      naturalFeatureContext: 7.6,
      openSourceAuditability: 9.0,
      privacyLocalFirst: 8.8,
      costControl: 8.5,
    },
    strengths: [
      'Self-hostable and inspectable.',
      'Broad OSM place search and reverse geocoding.',
      'Good baseline for named natural and civic features.',
    ],
    risks: [
      'OSM coverage and tagging vary widely by country and region.',
      'Not a deliverability validator or postal authority source.',
      'Classification labels can be inconsistent across OSM tags.',
    ],
    sourceEvidence: [
      'https://nominatim.org/release-docs/develop/api/Overview/',
      'https://nominatim.org/release-docs/develop/api/Search/',
    ],
  },
];
