export const AGID_POSTAL_COUNTRY_PACK_STRATEGY_VERSION =
  'agid-postal-country-pack-strategy-v0.1';

export type AgidPostalCountryPackTier =
  | 'mature-reliable-postal-code'
  | 'no-or-not-required-postal-code'
  | 'weak-coarse-postal-code'
  | 'fragile-address-infrastructure'
  | 'rapid-growth-address-pressure';

export type AgidPostalCountryPackRepositoryMode =
  | 'country-pack-recommended'
  | 'regional-pack-acceptable'
  | 'central-metadata-only';

export type AgidPostalCountryPackWeight =
  | 'thin-pack'
  | 'light-pack'
  | 'standard-pack'
  | 'heavy-pack';

export type AgidPostalCountryPackUse =
  | 'official-postal-reference-pack'
  | 'primary-agid-postal-draft'
  | 'supplemental-agid-postal-draft'
  | 'high-risk-coarse-draft'
  | 'growth-pressure-supplement';

export type AgidPostalCountryPackRegion =
  | 'Africa'
  | 'Americas'
  | 'Asia'
  | 'Europe'
  | 'Oceania';

export type AgidPostalCountryPackDataLayer =
  | 'manifest'
  | 'source-catalog'
  | 'country-profile'
  | 'admin-boundary-index'
  | 'locality-index'
  | 'locality-alias-history'
  | 'landform-index'
  | 'settlement-cluster-index'
  | 'road-and-route-corridors'
  | 'ports-airports-and-terminals'
  | 'vpl-seed-regions'
  | 'planning-cell-index'
  | 'route-evidence-index'
  | 'quality-evidence-index'
  | 'postal-system-priors'
  | 'governance-notes'
  | 'license-ledger'
  | 'privacy-threat-model'
  | 'test-vectors';

export type AgidPostalCountryPackCandidate = {
  countryCode: string;
  countryName: string;
  tier: AgidPostalCountryPackTier;
  sourceNote: string;
  region: AgidPostalCountryPackRegion;
  highRisk: boolean;
  needsOfficialVerification: boolean;
};

export type AgidPostalCountryPackRecommendation = {
  version: typeof AGID_POSTAL_COUNTRY_PACK_STRATEGY_VERSION;
  countryCode: string;
  countryName: string;
  tier: AgidPostalCountryPackTier;
  repositoryMode: AgidPostalCountryPackRepositoryMode;
  repositoryName: string;
  packageName: string;
  packWeight: AgidPostalCountryPackWeight;
  recommendedUse: AgidPostalCountryPackUse;
  requiredLayers: AgidPostalCountryPackDataLayer[];
  preseededRecords: string[];
  maintenanceRules: string[];
  splitRationale: string[];
  compatibilityContract: {
    schemaId: 'agid-postal-country-pack-v0.1';
    enginePackage: '@agid/postal-forge-core';
    countryPackDoesNotContain: Array<
      | 'personal-addresses'
      | 'recipient-names'
      | 'phone-numbers'
      | 'private-aoid-bodies'
      | 'agid-s-payloads'
      | 'raw-third-party-datasets-without-license'
    >;
  };
};

export type AgidPostalCountryPackIndexRepository = {
  countryCode: string;
  countryName: string;
  repositoryName: string;
  packageName: string;
  tier: AgidPostalCountryPackTier;
  packWeight: AgidPostalCountryPackWeight;
  recommendedUse: AgidPostalCountryPackUse;
};

export type AgidPostalCountryPackIndex = {
  version: typeof AGID_POSTAL_COUNTRY_PACK_STRATEGY_VERSION;
  totalCountries: number;
  byTier: {
    matureReliablePostalCode: number;
    noOrNotRequiredPostalCode: number;
    weakCoarsePostalCode: number;
    fragileAddressInfrastructure: number;
    rapidGrowthAddressPressure: number;
  };
  byRegion: Record<AgidPostalCountryPackRegion, number>;
  byPackWeight: Record<AgidPostalCountryPackWeight, number>;
  repositoryByCountryCode: Record<string, AgidPostalCountryPackIndexRepository>;
  repositories: AgidPostalCountryPackIndexRepository[];
};

type AgidPostalCountryPackSeed = readonly [string, string, AgidPostalCountryPackRegion];

const HIGH_RISK_COUNTRY_CODES = new Set(['SO', 'YE', 'CF']);
const STANDARD_PACK_COUNTRY_CODES = new Set(['AE', 'NG', 'PK', 'BD', 'KE', 'ET']);
const THIN_PACK_COUNTRY_CODES = new Set(['TV', 'NR', 'KN', 'LC', 'AW']);
const ISLAND_PORT_COUNTRY_CODES = new Set(['FJ', 'VU', 'TO', 'TV', 'KI', 'SB', 'SC', 'BS', 'GD', 'KN', 'LC', 'AW']);
const ROUTE_CORRIDOR_COUNTRY_CODES = new Set(['BW', 'MR', 'DJ', 'QA', 'AE', 'LY', 'YE', 'TD']);

const BASE_REQUIRED_LAYERS: AgidPostalCountryPackDataLayer[] = [
  'manifest',
  'source-catalog',
  'country-profile',
  'admin-boundary-index',
  'locality-index',
  'locality-alias-history',
  'landform-index',
  'settlement-cluster-index',
  'postal-system-priors',
  'governance-notes',
  'license-ledger',
  'privacy-threat-model',
  'test-vectors',
];

const PACK_COMPATIBILITY_EXCLUSIONS: AgidPostalCountryPackRecommendation['compatibilityContract']['countryPackDoesNotContain'] = [
  'personal-addresses',
  'recipient-names',
  'phone-numbers',
  'private-aoid-bodies',
  'agid-s-payloads',
  'raw-third-party-datasets-without-license',
];

const PACK_MAINTENANCE_RULES = [
  'Keep the AGID Postal Forge engine, UI, and core tests in the central repository.',
  'Keep country-specific city names, locality aliases, landforms, source metadata, and VPL seeds in the country pack.',
  'Version every source by provider, license, retrieval date, and transformation script.',
  'Use stable locality IDs; visible names can change without forcing postal code churn.',
  'Run conformance tests before publishing: schema, no raw address, boundary, locality separation, and sample code generation.',
  'Publish generated codes as simulation or draft unless official authority, carrier pilot, privacy, data trust, and transition gates pass.',
];

const PACK_SPLIT_RATIONALE = [
  'Country packs keep the main app small and let operators load only the country they need.',
  'Country experts can maintain local names, landforms, languages, and source notes without touching the core engine.',
  'License risk is isolated because each country pack has its own source catalog and data license ledger.',
  'High-risk countries can ship thin, coarse, privacy-first packs instead of precise public datasets.',
];

function createSeedCandidates(input: {
  seeds: readonly AgidPostalCountryPackSeed[];
  tier: AgidPostalCountryPackTier;
  sourceNote: string;
  highRiskCodes?: ReadonlySet<string>;
  highRisk?: boolean;
}): AgidPostalCountryPackCandidate[] {
  return input.seeds.map(([countryCode, countryName, region]) => ({
    countryCode,
    countryName,
    region,
    tier: input.tier,
    highRisk: input.highRisk ?? Boolean(input.highRiskCodes?.has(countryCode)),
    needsOfficialVerification: true,
    sourceNote: input.sourceNote,
  }));
}

const USER_SUPPLIED_NO_OR_NOT_REQUIRED_POSTAL_COUNTRIES = createSeedCandidates({
  seeds: [
  ['AE', 'United Arab Emirates', 'Asia'],
  ['AO', 'Angola', 'Africa'],
  ['AG', 'Antigua and Barbuda', 'Americas'],
  ['AW', 'Aruba', 'Americas'],
  ['BS', 'Bahamas', 'Americas'],
  ['BZ', 'Belize', 'Americas'],
  ['BJ', 'Benin', 'Africa'],
  ['BW', 'Botswana', 'Africa'],
  ['BO', 'Bolivia', 'Americas'],
  ['BI', 'Burundi', 'Africa'],
  ['CM', 'Cameroon', 'Africa'],
  ['CF', 'Central African Republic', 'Africa'],
  ['CG', 'Congo', 'Africa'],
  ['CI', "Cote d'Ivoire", 'Africa'],
  ['DJ', 'Djibouti', 'Africa'],
  ['DO', 'Dominican Republic', 'Americas'],
  ['ER', 'Eritrea', 'Africa'],
  ['ET', 'Ethiopia', 'Africa'],
  ['FJ', 'Fiji', 'Oceania'],
  ['GA', 'Gabon', 'Africa'],
  ['GM', 'Gambia', 'Africa'],
  ['GD', 'Grenada', 'Americas'],
  ['GN', 'Guinea', 'Africa'],
  ['GY', 'Guyana', 'Americas'],
  ['KI', 'Kiribati', 'Oceania'],
  ['MR', 'Mauritania', 'Africa'],
  ['NR', 'Nauru', 'Oceania'],
  ['QA', 'Qatar', 'Asia'],
  ['RW', 'Rwanda', 'Africa'],
  ['LC', 'Saint Lucia', 'Americas'],
  ['KN', 'Saint Kitts and Nevis', 'Americas'],
  ['SC', 'Seychelles', 'Africa'],
  ['SB', 'Solomon Islands', 'Oceania'],
  ['SO', 'Somalia', 'Africa'],
  ['TO', 'Tonga', 'Oceania'],
  ['TV', 'Tuvalu', 'Oceania'],
  ['VU', 'Vanuatu', 'Oceania'],
  ['YE', 'Yemen', 'Asia'],
] satisfies AgidPostalCountryPackSeed[],
  tier: 'no-or-not-required-postal-code',
  highRiskCodes: HIGH_RISK_COUNTRY_CODES,
  sourceNote: 'User-supplied list of countries where postal codes are absent, weak, or not practically required; official postal authority verification is required before public claims.',
});

const USER_SUPPLIED_WEAK_POSTAL_COUNTRIES: AgidPostalCountryPackCandidate[] = [
  {
    countryCode: 'PA',
    countryName: 'Panama',
    region: 'Americas',
    tier: 'weak-coarse-postal-code',
    highRisk: false,
    needsOfficialVerification: true,
    sourceNote: 'User supplied as a coarse city-level or low-precision postal-code country needing AGID supplemental design.',
  },
  {
    countryCode: 'JM',
    countryName: 'Jamaica',
    region: 'Americas',
    tier: 'weak-coarse-postal-code',
    highRisk: false,
    needsOfficialVerification: true,
    sourceNote: 'User supplied as a weak postal precision country; resolve against existing AGID target classification before publication.',
  },
  {
    countryCode: 'SV',
    countryName: 'El Salvador',
    region: 'Americas',
    tier: 'weak-coarse-postal-code',
    highRisk: false,
    needsOfficialVerification: true,
    sourceNote: 'User supplied as a weak postal precision country needing supplemental address resolution.',
  },
];

const USER_SUPPLIED_FRAGILE_ADDRESS_COUNTRIES = createSeedCandidates({
  seeds: [
  ['AF', 'Afghanistan', 'Asia'],
  ['SO', 'Somalia', 'Africa'],
  ['SS', 'South Sudan', 'Africa'],
  ['YE', 'Yemen', 'Asia'],
  ['LY', 'Libya', 'Africa'],
] satisfies AgidPostalCountryPackSeed[],
  tier: 'fragile-address-infrastructure',
  highRisk: true,
  sourceNote: 'User supplied as a conflict, fragile, or unstable address-infrastructure country. Default to coarse, humanitarian-safe, non-public drafts.',
});

const USER_SUPPLIED_RAPID_GROWTH_COUNTRIES = createSeedCandidates({
  seeds: [
  ['NG', 'Nigeria', 'Africa'],
  ['PK', 'Pakistan', 'Asia'],
  ['BD', 'Bangladesh', 'Asia'],
  ['KE', 'Kenya', 'Africa'],
  ['UG', 'Uganda', 'Africa'],
] satisfies AgidPostalCountryPackSeed[],
  tier: 'rapid-growth-address-pressure',
  sourceNote: 'User supplied as a rapid-growth country where EC, delivery, GPS confirmation, and address expansion pressure are high.',
});

const TIER_PRIORITY: Record<AgidPostalCountryPackTier, number> = {
  'fragile-address-infrastructure': 4,
  'rapid-growth-address-pressure': 3,
  'weak-coarse-postal-code': 2,
  'no-or-not-required-postal-code': 1,
  'mature-reliable-postal-code': 0,
};

function buildCandidateIndex() {
  const byCode = new Map<string, AgidPostalCountryPackCandidate>();
  for (const candidate of [
    ...USER_SUPPLIED_NO_OR_NOT_REQUIRED_POSTAL_COUNTRIES,
    ...USER_SUPPLIED_WEAK_POSTAL_COUNTRIES,
    ...USER_SUPPLIED_FRAGILE_ADDRESS_COUNTRIES,
    ...USER_SUPPLIED_RAPID_GROWTH_COUNTRIES,
  ]) {
    const existing = byCode.get(candidate.countryCode);
    if (!existing || TIER_PRIORITY[candidate.tier] > TIER_PRIORITY[existing.tier]) {
      byCode.set(candidate.countryCode, { ...candidate });
    }
  }
  return [...byCode.values()].sort((left, right) => left.countryCode.localeCompare(right.countryCode));
}

const AGID_POSTAL_COUNTRY_PACK_CANDIDATES = buildCandidateIndex();
const AGID_POSTAL_COUNTRY_PACK_BY_CODE = new Map(
  AGID_POSTAL_COUNTRY_PACK_CANDIDATES.map(candidate => [candidate.countryCode, candidate]),
);

function cloneCandidate(candidate: AgidPostalCountryPackCandidate): AgidPostalCountryPackCandidate {
  return { ...candidate };
}

export function listAgidPostalCountryPackCandidates(): AgidPostalCountryPackCandidate[] {
  return AGID_POSTAL_COUNTRY_PACK_CANDIDATES.map(cloneCandidate);
}

function packWeightFor(candidate: AgidPostalCountryPackCandidate): AgidPostalCountryPackWeight {
  if (candidate.tier === 'mature-reliable-postal-code') return 'standard-pack';
  if (candidate.tier === 'fragile-address-infrastructure') return 'thin-pack';
  if (candidate.tier === 'rapid-growth-address-pressure') return 'heavy-pack';
  if (STANDARD_PACK_COUNTRY_CODES.has(candidate.countryCode)) return 'standard-pack';
  if (THIN_PACK_COUNTRY_CODES.has(candidate.countryCode)) return 'thin-pack';
  return 'light-pack';
}

function recommendedUseFor(candidate: AgidPostalCountryPackCandidate): AgidPostalCountryPackUse {
  if (candidate.tier === 'mature-reliable-postal-code') return 'official-postal-reference-pack';
  if (candidate.tier === 'fragile-address-infrastructure') return 'high-risk-coarse-draft';
  if (candidate.tier === 'rapid-growth-address-pressure') return 'growth-pressure-supplement';
  if (candidate.tier === 'weak-coarse-postal-code') return 'supplemental-agid-postal-draft';
  return 'primary-agid-postal-draft';
}

function requiredLayersFor(candidate: AgidPostalCountryPackCandidate): AgidPostalCountryPackDataLayer[] {
  const base = [...BASE_REQUIRED_LAYERS];
  const insertAfter = (
    afterLayer: AgidPostalCountryPackDataLayer,
    layer: AgidPostalCountryPackDataLayer,
  ) => {
    if (base.includes(layer)) return;
    const anchor = base.indexOf(afterLayer);
    base.splice(anchor >= 0 ? anchor + 1 : base.length, 0, layer);
  };

  if (ISLAND_PORT_COUNTRY_CODES.has(candidate.countryCode)) {
    insertAfter('settlement-cluster-index', 'ports-airports-and-terminals');
  }
  if (ROUTE_CORRIDOR_COUNTRY_CODES.has(candidate.countryCode)) {
    insertAfter('settlement-cluster-index', 'road-and-route-corridors');
  }
  if (candidate.tier !== 'weak-coarse-postal-code' && candidate.tier !== 'mature-reliable-postal-code') {
    insertAfter('settlement-cluster-index', 'vpl-seed-regions');
  }
  return base;
}

function preseededRecordsFor(candidate: AgidPostalCountryPackCandidate) {
  const records = [
    'country profile: population band, land area band, terrain class, postal maturity class',
    'official and historical locality names, aliases, romanizations, and language tags',
    'stable locality IDs independent of mutable city-name strings',
    'administrative boundary references and source freshness metadata',
    'landform references: islands, valleys, deserts, deltas, mountains, forests, wetlands, or coastal corridors as applicable',
    'settlement clusters and landmark-only delivery areas for weak addressing regions',
    'license ledger for every imported source; third-party raw datasets are not bundled by default',
  ];
  if (candidate.highRisk) {
    records.push('high-risk safety defaults: coarse precision, no public household-level codes, short-lived aliases, and humanitarian redaction');
  }
  if (candidate.tier === 'rapid-growth-address-pressure') {
    records.push('growth-pressure priors: informal settlements, urban expansion corridors, EC delivery pressure, and future capacity reserves');
  }
  if (candidate.tier === 'mature-reliable-postal-code') {
    records.push('official postal reference slots: authoritative postal format, API/source metadata, license ledger, and AGID compatibility fixtures only');
    records.push('non-replacement boundary: AGID must not mint public substitute postal codes where a reliable official postal system exists');
  }
  return records;
}

function buildRecommendationForCandidate(
  candidate: AgidPostalCountryPackCandidate,
): AgidPostalCountryPackRecommendation {
  const code = candidate.countryCode.toLowerCase();
  const repositoryName = `agid-postal-pack-${code}`;
  const packWeight = packWeightFor(candidate);
  const repositoryMode: AgidPostalCountryPackRepositoryMode =
    packWeight === 'thin-pack' && candidate.tier === 'weak-coarse-postal-code'
      ? 'regional-pack-acceptable'
      : 'country-pack-recommended';

  return {
    version: AGID_POSTAL_COUNTRY_PACK_STRATEGY_VERSION,
    countryCode: candidate.countryCode,
    countryName: candidate.countryName,
    tier: candidate.tier,
    repositoryMode,
    repositoryName,
    packageName: `@agid/${repositoryName}`,
    packWeight,
    recommendedUse: recommendedUseFor(candidate),
    requiredLayers: requiredLayersFor(candidate),
    preseededRecords: preseededRecordsFor(candidate),
    maintenanceRules: [...PACK_MAINTENANCE_RULES],
    splitRationale: [...PACK_SPLIT_RATIONALE],
    compatibilityContract: {
      schemaId: 'agid-postal-country-pack-v0.1',
      enginePackage: '@agid/postal-forge-core',
      countryPackDoesNotContain: [...PACK_COMPATIBILITY_EXCLUSIONS],
    },
  };
}

const AGID_POSTAL_COUNTRY_PACK_RECOMMENDATIONS_BY_CODE = new Map(
  AGID_POSTAL_COUNTRY_PACK_CANDIDATES.map(candidate => [
    candidate.countryCode,
    buildRecommendationForCandidate(candidate),
  ]),
);

function cloneRecommendation(
  recommendation: AgidPostalCountryPackRecommendation,
): AgidPostalCountryPackRecommendation {
  return {
    ...recommendation,
    requiredLayers: [...recommendation.requiredLayers],
    preseededRecords: [...recommendation.preseededRecords],
    maintenanceRules: [...recommendation.maintenanceRules],
    splitRationale: [...recommendation.splitRationale],
    compatibilityContract: {
      ...recommendation.compatibilityContract,
      countryPackDoesNotContain: [
        ...recommendation.compatibilityContract.countryPackDoesNotContain,
      ],
    },
  };
}

function listPrecomputedRecommendations(): AgidPostalCountryPackRecommendation[] {
  return [...AGID_POSTAL_COUNTRY_PACK_RECOMMENDATIONS_BY_CODE.values()].map(cloneRecommendation);
}

function regionForCountryCode(countryCode: string): AgidPostalCountryPackRegion {
  return AGID_POSTAL_COUNTRY_PACK_BY_CODE.get(countryCode)?.region ?? 'Africa';
}

export function recommendAgidPostalCountryPack(
  countryCode: string,
): AgidPostalCountryPackRecommendation | null {
  const normalized = countryCode.trim().toUpperCase();
  const recommendation = AGID_POSTAL_COUNTRY_PACK_RECOMMENDATIONS_BY_CODE.get(normalized);
  return recommendation ? cloneRecommendation(recommendation) : null;
}

function createAgidPostalCountryPackIndex(): AgidPostalCountryPackIndex {
  const recommendations = listPrecomputedRecommendations();
  const byTier = {
    matureReliablePostalCode: 0,
    noOrNotRequiredPostalCode: 0,
    weakCoarsePostalCode: 0,
    fragileAddressInfrastructure: 0,
    rapidGrowthAddressPressure: 0,
  };
  const byRegion: Record<AgidPostalCountryPackRegion, number> = {
    Africa: 0,
    Americas: 0,
    Asia: 0,
    Europe: 0,
    Oceania: 0,
  };
  const byPackWeight: Record<AgidPostalCountryPackWeight, number> = {
    'thin-pack': 0,
    'light-pack': 0,
    'standard-pack': 0,
    'heavy-pack': 0,
  };
  const repositoryByCountryCode = recommendations.reduce(
    (lookup, item) => {
      if (item.tier === 'no-or-not-required-postal-code') byTier.noOrNotRequiredPostalCode += 1;
      if (item.tier === 'weak-coarse-postal-code') byTier.weakCoarsePostalCode += 1;
      if (item.tier === 'fragile-address-infrastructure') byTier.fragileAddressInfrastructure += 1;
      if (item.tier === 'rapid-growth-address-pressure') byTier.rapidGrowthAddressPressure += 1;
      if (item.tier === 'mature-reliable-postal-code') byTier.matureReliablePostalCode += 1;
      byRegion[regionForCountryCode(item.countryCode)] += 1;
      byPackWeight[item.packWeight] += 1;
      lookup[item.countryCode] = {
        countryCode: item.countryCode,
        countryName: item.countryName,
        repositoryName: item.repositoryName,
        packageName: item.packageName,
        tier: item.tier,
        packWeight: item.packWeight,
        recommendedUse: item.recommendedUse,
      };
      return lookup;
    },
    {} as Record<string, AgidPostalCountryPackIndexRepository>,
  );

  return {
    version: AGID_POSTAL_COUNTRY_PACK_STRATEGY_VERSION,
    totalCountries: recommendations.length,
    byTier,
    byRegion,
    byPackWeight,
    repositoryByCountryCode,
    repositories: recommendations.map(item => ({
      countryCode: item.countryCode,
      countryName: item.countryName,
      repositoryName: item.repositoryName,
      packageName: item.packageName,
      tier: item.tier,
      packWeight: item.packWeight,
      recommendedUse: item.recommendedUse,
    })),
  };
}

const AGID_POSTAL_COUNTRY_PACK_INDEX = createAgidPostalCountryPackIndex();

function cloneIndex(index: AgidPostalCountryPackIndex): AgidPostalCountryPackIndex {
  return {
    ...index,
    byTier: { ...index.byTier },
    byRegion: { ...index.byRegion },
    byPackWeight: { ...index.byPackWeight },
    repositoryByCountryCode: Object.fromEntries(
      Object.entries(index.repositoryByCountryCode).map(([countryCode, repository]) => [
        countryCode,
        { ...repository },
      ]),
    ),
    repositories: index.repositories.map(repository => ({ ...repository })),
  };
}

export function buildAgidPostalCountryPackIndex(): AgidPostalCountryPackIndex {
  return cloneIndex(AGID_POSTAL_COUNTRY_PACK_INDEX);
}
