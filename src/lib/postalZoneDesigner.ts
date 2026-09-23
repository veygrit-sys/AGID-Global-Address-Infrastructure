import { encodeAGID } from './agid';
import {
  POSTAL_FORGE_NO_POSTAL_PREPARATION_COUNTRIES,
  POSTAL_FORGE_WEAK_POSTAL_PREPARATION_COUNTRIES,
} from '../postal/postalForgePreparation';
import {
  AGID_POSTAL_CREATION_AI_NAME,
  AGID_POSTAL_CREATION_AI_NAME_JA,
  AGID_POSTAL_CREATION_SYSTEM_NAME,
  AGID_POSTAL_CREATION_SYSTEM_NAME_JA,
  AGID_POSTAL_TARGET_COUNTRIES,
  AGID_POSTAL_TEMPLATES,
  buildAgidPostalDesignPlan,
  buildAgidPostalVariableHierarchyCode,
  createAgidPostalZoneEditRecord,
  estimateAgidPostalMinimumCodeCount,
  evaluateAgidPostalVirtualLocalityNeed,
  generateAgidVirtualPostalLocalityCodes,
  summarizeAgidPostalZoneEditRecord,
  type AgidPostalCountryClass,
  type AgidPostalCountryProfile,
  type AgidPostalAiQualityReport,
  type AgidPostalDesignPlan,
  type AgidPostalDesignStatus,
  type AgidPostalGenerationPolicy,
  type AgidPostalMinimumCodeCountDecision,
  type AgidPostalTemplateId,
  type AgidPostalVariableHierarchyPathNode,
  type AgidPostalVariableHierarchyCodeResult,
  type AgidPostalVirtualLocalityCodeSetDecision,
  type AgidPostalVirtualLocalityNeedDecision,
  type AgidPostalZoneEditRecord,
  type AgidPostalZoneEditSourceKind,
  type AgidPostalZoneEditSummary,
} from './agidPostalCodeEngine';

export const POSTAL_ZONE_DESIGNER_MODEL_VERSION = 'postal-zone-designer-v0.1';
export const POSTAL_ZONE_CREATION_SYSTEM_NAME = AGID_POSTAL_CREATION_SYSTEM_NAME;
export const POSTAL_ZONE_CREATION_SYSTEM_NAME_JA = AGID_POSTAL_CREATION_SYSTEM_NAME_JA;
export const POSTAL_ZONE_AI_NAME = AGID_POSTAL_CREATION_AI_NAME;
export const POSTAL_ZONE_AI_NAME_JA = AGID_POSTAL_CREATION_AI_NAME_JA;

export type PostalZoneDesignerCountryPreset = {
  code: string;
  name: string;
  region: string;
  classHint: AgidPostalCountryClass;
  lat: number;
  lng: number;
  population: number;
  areaKm2: number;
  municipalityCount: number;
  terrain: NonNullable<AgidPostalCountryProfile['terrain']>;
  sourceNote: string;
  profileOverrides?: Partial<AgidPostalCountryProfile>;
};

export type PostalForgeCoverageClass =
  | 'postal-code-available-reliable-api'
  | 'postal-code-available-weak-api'
  | 'no-postal-code-strong-geo-oss'
  | 'no-postal-code-weak-geo-oss';

export type PostalForgeMode =
  | 'existing-postal-only'
  | 'supplemental-agid-postal'
  | 'primary-agid-postal';

export type PostalForgeCoverageCountry = {
  code: string;
  name: string;
  region: string;
  classHint: AgidPostalCountryClass;
  coverageClass: PostalForgeCoverageClass;
  forgeMode: PostalForgeMode;
  priority: 'baseline' | 'candidate' | 'pilot' | 'humanitarian-review';
  autoFillBehavior:
    | 'postal-api-autofill'
    | 'postal-format-and-candidates'
    | 'agid-geo-verified'
    | 'agid-manual-required';
  sourceNote: string;
};

export type PostalZoneDesignerInput = {
  countryCode?: string;
  templateId?: AgidPostalTemplateId;
  selectedMunicipalityId?: string;
  selectedTownId?: string;
  selectedChomeId?: string | null;
  extraMunicipalityIds?: string[];
  population?: number;
  areaKm2?: number;
  municipalityCount?: number;
  addressCount?: number;
  peakDeliveryDemand?: number;
  businessLoad?: number;
  ambiguityScore?: number;
  routeRadiusMinutes?: number;
  connectedComponentCount?: number;
  timeCoverCount?: number;
  maxAddressCountPerCode?: number;
  maxPopulationPerCode?: number;
  maxPeakDeliveryDemandPerCode?: number;
  maxBusinessLoadPerCode?: number;
  governance?: AgidPostalCountryProfile['governance'];
  privacy?: AgidPostalCountryProfile['privacy'];
  dataQuality?: AgidPostalCountryProfile['dataQuality'];
  sourceKind?: AgidPostalZoneEditSourceKind;
  selectedAgids?: string[];
  excludedAgids?: string[];
  now?: string;
  governmentOfficial?: boolean;
  carrierPilot?: boolean;
};

export type PostalZoneDesignerSafetyBoundary = {
  id: string;
  label: string;
  satisfied: boolean;
  severity: 'info' | 'warn' | 'block';
};

export type PostalZoneDesignerChomeOption = {
  id: string;
  label: string;
  codePart: string;
};

export type PostalZoneDesignerTownOption = {
  id: string;
  name: string;
  codePart: string;
  chomes: PostalZoneDesignerChomeOption[];
};

export type PostalZoneDesignerMunicipalityOption = {
  id: string;
  name: string;
  codePart: string;
  towns: PostalZoneDesignerTownOption[];
};

export type PostalZoneDesignerFormatSuggestion = {
  templateId: AgidPostalTemplateId;
  label: string;
  formatPreview: string;
  exampleCode: string;
  scopeHint: 'country' | 'municipality' | 'town' | 'chome';
  canCreateNewCode: boolean;
  notice: string;
  simpleReasons: string[];
};

export type PostalZoneDesignerFormatOption = {
  templateId: AgidPostalTemplateId;
  label: string;
  format: string;
  description: string;
  basedOn: string;
  fitScore: number;
  recommended: boolean;
  selectable: boolean;
  useAs: 'primary-template' | 'supplemental-inspiration' | 'avoid-direct-copy' | 'official-existing';
  reasons: string[];
  cautions: string[];
};

export type PostalZoneDesignerLocalityProposal = {
  ok: boolean;
  code: string | null;
  selection: {
    municipalityId: string | null;
    municipalityName: string | null;
    townId: string | null;
    townName: string | null;
    chomeId: string | null;
    chomeLabel: string | null;
  };
  displayPath: string[];
  formatSuggestion: PostalZoneDesignerFormatSuggestion;
  blockedReason: string | null;
  warnings: string[];
  theoremChecks: {
    selectedMunicipality: boolean;
    withinSingleMunicipality: boolean;
    townBelongsToMunicipality: boolean;
    chomeBelongsToTown: boolean;
    classAllowsCreation: boolean;
  };
  hierarchyCode: AgidPostalVariableHierarchyCodeResult | null;
};

export type PostalZoneDesignerExampleCandidate = {
  id: string;
  label: string;
  code: string | null;
  displayPath: string[];
  decision: 'draft-primary' | 'supplemental-draft' | 'blocked';
  boundarySafe: boolean;
  blockedReason: string | null;
  warnings: string[];
};

export type PostalZoneDesignerExampleGeneration = {
  countryCode: string;
  countryName: string;
  countryClass: AgidPostalCountryClass;
  sourceNote: string;
  terrain: PostalZoneDesignerCountryPreset['terrain'];
  templateId: AgidPostalTemplateId;
  actualNoPostalCountryExample: boolean;
  methodSteps: string[];
  usabilityImprovements: string[];
  candidates: PostalZoneDesignerExampleCandidate[];
  summary: {
    generatedCandidateCount: number;
    allCandidatesStayInsideOneMunicipality: boolean;
    rawAddressIncluded: false;
    personalDataIncluded: false;
  };
};

export type PostalZoneDesignerWorkspace = {
  modelVersion: string;
  systemName: typeof POSTAL_ZONE_CREATION_SYSTEM_NAME;
  systemNameJa: typeof POSTAL_ZONE_CREATION_SYSTEM_NAME_JA;
  aiName: typeof POSTAL_ZONE_AI_NAME;
  aiNameJa: typeof POSTAL_ZONE_AI_NAME_JA;
  country: PostalZoneDesignerCountryPreset;
  coverage: PostalForgeCoverageCountry;
  profile: AgidPostalCountryProfile;
  templateId: AgidPostalTemplateId;
  designPlan: AgidPostalDesignPlan;
  aiQuality: AgidPostalAiQualityReport;
  formatSuggestion: PostalZoneDesignerFormatSuggestion;
  formatOptions: PostalZoneDesignerFormatOption[];
  localityChoices: PostalZoneDesignerMunicipalityOption[];
  localityProposal: PostalZoneDesignerLocalityProposal;
  exampleGeneration: PostalZoneDesignerExampleGeneration;
  minimumCodeCount: AgidPostalMinimumCodeCountDecision;
  virtualLocalityNeed: AgidPostalVirtualLocalityNeedDecision;
  virtualLocalityCodes: AgidPostalVirtualLocalityCodeSetDecision;
  editRecord: AgidPostalZoneEditRecord;
  editSummary: AgidPostalZoneEditSummary;
  stage: AgidPostalDesignStatus;
  canClaimOfficial: boolean;
  safetyBoundaries: PostalZoneDesignerSafetyBoundary[];
  gisChecklist: string[];
  governanceChecklist: string[];
  exportSafe: {
    systemName: typeof POSTAL_ZONE_CREATION_SYSTEM_NAME;
    aiName: typeof POSTAL_ZONE_AI_NAME;
    aiQualityGrade: AgidPostalAiQualityReport['grade'];
    aiQualityScore: number;
    suggestedFormat: string;
    localityProposalCode: string | null;
    countryCode: string;
    coverageClass: PostalForgeCoverageClass;
    forgeMode: PostalForgeMode;
    designStage: AgidPostalDesignStatus;
    class: AgidPostalCountryClass;
    generationPolicy: AgidPostalGenerationPolicy;
    generatedCode: string | null;
    exampleCodes: string[];
    publicPublicationStatus: string;
    integratedAgidCount: number;
    rejectedAgidCount: number;
    virtualLocalityCodes: string[];
    privateLocationTextIncluded: false;
    personalDataIncluded: false;
  };
};

const CLASS_A_PRESETS: PostalZoneDesignerCountryPreset[] = [
  {
    code: 'JP',
    name: 'Japan',
    region: 'Asia',
    classHint: 'A',
    lat: 35.6812,
    lng: 139.7671,
    population: 124_000_000,
    areaKm2: 377_975,
    municipalityCount: 1_741,
    terrain: 'mixed',
    sourceNote: 'Mature postal code system; AGID stays internal or supplemental only.',
    profileOverrides: {
      addressFormat: {
        countryCode: 'JP',
        name: 'Japan',
        postalCode: {
          regex: '^\\d{3}-?\\d{4}$',
          source: 'Japan Post official postal code data',
          api: 'japan-post',
          format: 'NNN-NNNN',
        },
        openSourceIds: ['libaddressinput', 'jageocoder', 'gsi-japan'],
      },
      existingPostalPattern: '^\\d{3}-?\\d{4}$',
      existingPostalSamples: ['100-0001', '150-0001'],
      dataQuality: { address: 0.9, road: 0.92, admin: 0.95, population: 0.9, boundary: 0.95, threshold: 0.7 },
    },
  },
  {
    code: 'US',
    name: 'United States',
    region: 'North America',
    classHint: 'A',
    lat: 38.8977,
    lng: -77.0365,
    population: 335_000_000,
    areaKm2: 9_833_517,
    municipalityCount: 35_000,
    terrain: 'mixed',
    sourceNote: 'Mature ZIP system; AGID postal code generation is not a replacement path.',
    profileOverrides: {
      addressFormat: {
        countryCode: 'US',
        name: 'United States',
        postalCode: {
          regex: '^\\d{5}(-\\d{4})?$',
          source: 'USPS official ZIP code metadata',
          api: 'usps',
          format: 'NNNNN or NNNNN-NNNN',
        },
        openSourceIds: ['libaddressinput', 'u.s. census geocoder'],
      },
      existingPostalPattern: '^\\d{5}(-\\d{4})?$',
      existingPostalSamples: ['20500', '94105'],
      dataQuality: { address: 0.88, road: 0.9, admin: 0.9, population: 0.92, boundary: 0.9, threshold: 0.7 },
    },
  },
];

const NO_POSTAL_COUNTRY_CODES = new Set(AGID_POSTAL_TARGET_COUNTRIES.map(country => country.code));

type WeakPostalPresetSeed = {
  code: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  population: number;
  areaKm2: number;
  municipalityCount: number;
  terrain?: PostalZoneDesignerCountryPreset['terrain'];
  pattern?: string;
  samples?: string[];
  note?: string;
};

const WEAK_POSTAL_PRESET_SEEDS: WeakPostalPresetSeed[] = ([
  { code: 'AF', name: 'Afghanistan', region: 'Asia', lat: 33.9391, lng: 67.71, population: 42_000_000, areaKm2: 652_230, municipalityCount: 400, terrain: 'mountain', pattern: '^\\d{4}$', samples: ['1001'], note: 'Postal codes exist, but public API and rural address coverage are weak; keep manual confirmation first.' },
  { code: 'BD', name: 'Bangladesh', region: 'Asia', lat: 23.685, lng: 90.3563, population: 173_000_000, areaKm2: 147_570, municipalityCount: 500, terrain: 'mixed', pattern: '^\\d{4}$', samples: ['1000'], note: 'Postal codes exist; use format checks and administrative candidates before carrier review.' },
  { code: 'IN', name: 'India', region: 'Asia', lat: 20.5937, lng: 78.9629, population: 1_430_000_000, areaKm2: 3_287_263, municipalityCount: 6_000, terrain: 'mixed', pattern: '^\\d{6}$', samples: ['110001'], note: 'PIN codes are broad; use postal candidates plus locality, landmark, and route evidence.' },
  { code: 'KH', name: 'Cambodia', region: 'Asia', lat: 12.5657, lng: 104.991, population: 17_000_000, areaKm2: 181_035, municipalityCount: 200, terrain: 'mixed', pattern: '^\\d{5}$', samples: ['12000'], note: 'Postal metadata is uneven; candidate display should not override local manual input.' },
  { code: 'LA', name: 'Laos', region: 'Asia', lat: 19.8563, lng: 102.4955, population: 7_600_000, areaKm2: 236_800, municipalityCount: 150, terrain: 'mountain', pattern: '^\\d{5}$', samples: ['01000'], note: 'Postal coverage is sparse outside cities; combine postal hints with AGID and administrative hierarchy.' },
  { code: 'MM', name: 'Myanmar', region: 'Asia', lat: 21.9162, lng: 95.956, population: 55_000_000, areaKm2: 676_578, municipalityCount: 350, terrain: 'mixed', pattern: '^\\d{5}$', samples: ['11181'], note: 'Postal data and administration can be unstable; keep conflict-sensitive manual review.' },
  { code: 'NP', name: 'Nepal', region: 'Asia', lat: 28.3949, lng: 84.124, population: 31_000_000, areaKm2: 147_516, municipalityCount: 753, terrain: 'mountain', pattern: '^\\d{5}$', samples: ['44600'], note: 'Mountain routing needs locality and route evidence in addition to postal format.' },
  { code: 'NG', name: 'Nigeria', region: 'Africa', lat: 9.082, lng: 8.6753, population: 224_000_000, areaKm2: 923_768, municipalityCount: 774, terrain: 'mixed', pattern: '^\\d{6}$', samples: ['100001'], note: 'Postal codes exist, but free machine-readable API coverage is uneven; candidate-first workflow required.' },
  { code: 'PK', name: 'Pakistan', region: 'Asia', lat: 30.3753, lng: 69.3451, population: 240_000_000, areaKm2: 881_913, municipalityCount: 600, terrain: 'mixed', pattern: '^\\d{5}$', samples: ['44000'], note: 'Postal codes exist; use format validation, city/province candidates, and manual confirmation.' },
  { code: 'PH', name: 'Philippines', region: 'Asia', lat: 12.8797, lng: 121.774, population: 118_000_000, areaKm2: 300_000, municipalityCount: 1_600, terrain: 'archipelago', pattern: '^\\d{4}$', samples: ['1000'], note: 'Postal codes exist but island/barangay addressing needs candidate selection and local delivery evidence.' },
  { code: 'UG', name: 'Uganda', region: 'Africa', lat: 1.3733, lng: 32.2903, population: 49_000_000, areaKm2: 241_038, municipalityCount: 170, terrain: 'mixed', pattern: '^\\d{5}$', samples: ['10101'], note: 'Postal-code use is limited in many delivery flows; keep AGID as supplemental locality evidence.' },
  { code: 'VN', name: 'Vietnam', region: 'Asia', lat: 14.0583, lng: 108.2772, population: 100_000_000, areaKm2: 331_212, municipalityCount: 700, terrain: 'mixed', pattern: '^\\d{5,6}$', samples: ['100000'], note: 'Postal formats changed over time; validate format but prioritize province/district/ward candidates.' },
  { code: 'ZM', name: 'Zambia', region: 'Africa', lat: -13.1339, lng: 27.8493, population: 20_000_000, areaKm2: 752_612, municipalityCount: 116, terrain: 'mixed', pattern: '^\\d{5}$', samples: ['10101'], note: 'Postal metadata exists but may not be enough for last-mile delivery; use AGID supplemental areas.' },
] satisfies WeakPostalPresetSeed[]).filter(seed => !NO_POSTAL_COUNTRY_CODES.has(seed.code));

const PREPARATION_WEAK_POSTAL_PRESET_SEEDS: WeakPostalPresetSeed[] =
  POSTAL_FORGE_WEAK_POSTAL_PREPARATION_COUNTRIES.map(target => ({
    code: target.code,
    name: target.name,
    region: target.region,
    lat: target.lat,
    lng: target.lng,
    population: target.population,
    areaKm2: target.areaKm2,
    municipalityCount: target.municipalityCount,
    terrain: target.terrain,
    pattern: target.postalPattern,
    samples: target.postalSamples,
    note: target.sourceStrategy,
  }));

function buildWeakPostalPreset(seed: WeakPostalPresetSeed): PostalZoneDesignerCountryPreset {
  return {
    code: seed.code,
    name: seed.name,
    region: seed.region,
    classHint: 'B',
    lat: seed.lat,
    lng: seed.lng,
    population: seed.population,
    areaKm2: seed.areaKm2,
    municipalityCount: seed.municipalityCount,
    terrain: seed.terrain || 'mixed',
    sourceNote: seed.note || 'Postal code exists, but free API/open-data quality is weak; use candidates and manual confirmation.',
    profileOverrides: {
      addressFormat: {
        countryCode: seed.code,
        name: seed.name,
        postalCode: {
          regex: seed.pattern || null,
          source: 'weak postal API / regional table / local postal operator guidance',
          api: null,
          format: seed.pattern ? 'National postal-code format, candidate-first' : 'Candidate-first postal metadata',
        },
        openSourceIds: ['openstreetmap', 'geoboundaries', 'natural-earth'],
      },
      existingPostalPattern: seed.pattern,
      existingPostalSamples: seed.samples,
      dataQuality: { address: 0.48, road: 0.55, admin: 0.66, population: 0.6, boundary: 0.66, threshold: 0.7 },
    },
  };
}

const CLASS_B_PRESETS: PostalZoneDesignerCountryPreset[] = [
  {
    code: 'GH',
    name: 'Ghana',
    region: 'Africa',
    classHint: 'B',
    lat: 5.6037,
    lng: -0.187,
    population: 34_000_000,
    areaKm2: 238_533,
    municipalityCount: 261,
    terrain: 'mixed',
    sourceNote: 'Postal addressing exists but can benefit from AGID supplemental area design and delivery locality modeling.',
    profileOverrides: {
      addressFormat: {
        countryCode: 'GH',
        name: 'Ghana',
        postalCode: {
          regex: '^[A-Z]{2}-\\d{3}-\\d{4}$',
          source: 'regional table / local postal operator guidance',
          api: null,
          format: 'Area-district style metadata',
        },
        openSourceIds: ['openstreetmap', 'geoboundaries'],
      },
      existingPostalPattern: '^[A-Z]{2}-\\d{3}-\\d{4}$',
      dataQuality: { address: 0.55, road: 0.58, admin: 0.72, population: 0.64, boundary: 0.7, threshold: 0.7 },
    },
  },
  ...WEAK_POSTAL_PRESET_SEEDS.map(buildWeakPostalPreset),
  ...PREPARATION_WEAK_POSTAL_PRESET_SEEDS.map(buildWeakPostalPreset),
];

const PREPARATION_NO_POSTAL_COUNTRY_PRESETS: PostalZoneDesignerCountryPreset[] =
  POSTAL_FORGE_NO_POSTAL_PREPARATION_COUNTRIES.map(target => ({
    code: target.code,
    name: target.name,
    region: target.region,
    classHint: 'C',
    lat: target.lat,
    lng: target.lng,
    population: target.population,
    areaKm2: target.areaKm2,
    municipalityCount: target.municipalityCount,
    terrain: target.terrain,
    sourceNote: target.sourceStrategy,
    profileOverrides: {
      addressFormat: {
        countryCode: target.code,
        name: target.name,
        postalCode: { regex: null, api: null, source: target.sourceStrategy, format: 'None' },
        openSourceIds: ['openstreetmap', 'overture', 'geoboundaries', 'natural-earth'],
        addressRules: {
          postalCode: null,
          openSourceIds: ['openstreetmap', 'natural-earth'],
        },
      },
      evidenceSources: target.requiredEvidence,
    },
  }));

const TARGET_COUNTRY_PRESETS: PostalZoneDesignerCountryPreset[] = [
  ...AGID_POSTAL_TARGET_COUNTRIES.map((country): PostalZoneDesignerCountryPreset => ({
  code: country.code,
  name: country.name,
  region: country.region,
  classHint: 'C',
  lat: country.lat,
  lng: country.lng,
  population: inferPresetPopulation(country.code),
  areaKm2: inferPresetArea(country.code),
  municipalityCount: inferPresetMunicipalityCount(country.code),
  terrain: inferPresetTerrain(country.code, country.note),
  sourceNote: country.note,
  profileOverrides: {
    addressFormat: {
      countryCode: country.code,
      name: country.name,
      postalCode: { regex: null, api: null, source: country.note, format: 'None' },
      openSourceIds: ['overture', 'geoboundaries', 'natural-earth'],
      addressRules: {
        postalCode: null,
        openSourceIds: ['openstreetmap', 'natural-earth'],
      },
    },
  },
})),
  ...PREPARATION_NO_POSTAL_COUNTRY_PRESETS,
];

export const POSTAL_ZONE_DESIGNER_COUNTRIES: PostalZoneDesignerCountryPreset[] = [
  ...CLASS_A_PRESETS,
  ...CLASS_B_PRESETS,
  ...TARGET_COUNTRY_PRESETS,
].filter((country, index, countries) => (
  countries.findIndex(candidate => candidate.code === country.code) === index
)).sort((left, right) => left.code.localeCompare(right.code));

const NO_POSTAL_WEAK_GEO_COUNTRY_CODES = new Set(['CF', 'KP', 'LY', 'SO', 'SS', 'SY', 'YE']);

function buildPostalForgeCoverageCountry(country: PostalZoneDesignerCountryPreset): PostalForgeCoverageCountry {
  if (country.classHint === 'A') {
    return {
      code: country.code,
      name: country.name,
      region: country.region,
      classHint: country.classHint,
      coverageClass: 'postal-code-available-reliable-api',
      forgeMode: 'existing-postal-only',
      priority: 'baseline',
      autoFillBehavior: 'postal-api-autofill',
      sourceNote: country.sourceNote,
    };
  }

  if (country.classHint === 'B') {
    return {
      code: country.code,
      name: country.name,
      region: country.region,
      classHint: country.classHint,
      coverageClass: 'postal-code-available-weak-api',
      forgeMode: 'supplemental-agid-postal',
      priority: 'candidate',
      autoFillBehavior: 'postal-format-and-candidates',
      sourceNote: country.sourceNote,
    };
  }

  const weakGeo = NO_POSTAL_WEAK_GEO_COUNTRY_CODES.has(country.code);
  return {
    code: country.code,
    name: country.name,
    region: country.region,
    classHint: country.classHint,
    coverageClass: weakGeo ? 'no-postal-code-weak-geo-oss' : 'no-postal-code-strong-geo-oss',
    forgeMode: 'primary-agid-postal',
    priority: weakGeo ? 'humanitarian-review' : 'pilot',
    autoFillBehavior: weakGeo ? 'agid-manual-required' : 'agid-geo-verified',
    sourceNote: country.sourceNote,
  };
}

export const POSTAL_FORGE_COVERAGE_COUNTRIES: PostalForgeCoverageCountry[] =
  POSTAL_ZONE_DESIGNER_COUNTRIES.map(buildPostalForgeCoverageCountry);

function inferPresetPopulation(countryCode: string) {
  const table: Record<string, number> = {
    FJ: 930_000,
    GM: 2_700_000,
    RW: 13_500_000,
    VU: 335_000,
    TO: 107_000,
    TV: 11_000,
    QA: 2_700_000,
    AE: 9_500_000,
    ML: 23_000_000,
    BW: 2_600_000,
    BZ: 420_000,
    BB: 280_000,
    JM: 2_800_000,
    SC: 120_000,
  };
  return table[countryCode] ?? 1_200_000;
}

function inferPresetArea(countryCode: string) {
  const table: Record<string, number> = {
    FJ: 18_274,
    GM: 11_295,
    RW: 26_338,
    VU: 12_189,
    TO: 747,
    TV: 26,
    QA: 11_581,
    AE: 83_600,
    ML: 1_240_192,
    BW: 581_730,
    BZ: 22_966,
    BB: 430,
    JM: 10_991,
    SC: 459,
  };
  return table[countryCode] ?? 45_000;
}

function inferPresetMunicipalityCount(countryCode: string) {
  const table: Record<string, number> = {
    FJ: 14,
    GM: 80,
    RW: 416,
    VU: 6,
    TO: 5,
    TV: 9,
    QA: 8,
    AE: 7,
    ML: 70,
    BW: 16,
    BZ: 6,
    BB: 11,
    JM: 14,
    SC: 26,
  };
  return table[countryCode] ?? 18;
}

function inferPresetTerrain(countryCode: string, note: string): PostalZoneDesignerCountryPreset['terrain'] {
  const value = `${countryCode} ${note}`.toLowerCase();
  if (/island|archipelago|fiji|vanuatu|tonga|tuvalu|seychelles|bahamas|jamaica|barbados/.test(value)) return 'archipelago';
  if (/desert|sahel|qatar|emirates|mali|botswana|libya|chad|mauritania/.test(value)) return 'desert';
  if (/mountain|rwanda|bolivia|yemen|eritrea/.test(value)) return 'mountain';
  return 'mixed';
}

function findCountryPreset(countryCode = 'FJ') {
  const normalized = countryCode.trim().toUpperCase();
  return POSTAL_ZONE_DESIGNER_COUNTRIES.find(country => country.code === normalized)
    ?? POSTAL_ZONE_DESIGNER_COUNTRIES.find(country => country.code === 'FJ')
    ?? POSTAL_ZONE_DESIGNER_COUNTRIES[0];
}

function normalizeScore(value: number | undefined, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(1, numeric));
}

function buildProfile(country: PostalZoneDesignerCountryPreset, input: PostalZoneDesignerInput): AgidPostalCountryProfile {
  return {
    ...(country.profileOverrides || {}),
    countryCode: country.code,
    countryName: country.name,
    population: Math.max(1, Math.round(input.population ?? country.population)),
    areaKm2: Math.max(1, Math.round(input.areaKm2 ?? country.areaKm2)),
    municipalityCount: Math.max(1, Math.round(input.municipalityCount ?? country.municipalityCount)),
    terrain: country.terrain,
    evidenceSources: [
      country.sourceNote,
      ...(country.profileOverrides?.evidenceSources || []),
      'postal-zone-designer-local-planning',
    ],
    governance: {
      government: normalizeScore(input.governance?.government, country.classHint === 'A' ? 1 : 0.25),
      municipality: normalizeScore(input.governance?.municipality, 0.35),
      carrier: normalizeScore(input.governance?.carrier, 0.45),
      platform: normalizeScore(input.governance?.platform, 0.75),
      threshold: normalizeScore(input.governance?.threshold, 0.7),
    },
    privacy: {
      addressEntitiesPerArea: Math.max(0, Math.round(input.privacy?.addressEntitiesPerArea ?? 42)),
      populationPerArea: Math.max(0, Math.round(input.privacy?.populationPerArea ?? 160)),
      minimumAddressEntities: Math.max(1, Math.round(input.privacy?.minimumAddressEntities ?? 10)),
      minimumPopulation: Math.max(1, Math.round(input.privacy?.minimumPopulation ?? 50)),
      sensitive: Boolean(input.privacy?.sensitive),
      highRisk: Boolean(input.privacy?.highRisk),
    },
    dataQuality: {
      address: normalizeScore(input.dataQuality?.address, country.profileOverrides?.dataQuality?.address ?? 0.54),
      road: normalizeScore(input.dataQuality?.road, country.profileOverrides?.dataQuality?.road ?? 0.58),
      admin: normalizeScore(input.dataQuality?.admin, country.profileOverrides?.dataQuality?.admin ?? 0.68),
      population: normalizeScore(input.dataQuality?.population, country.profileOverrides?.dataQuality?.population ?? 0.62),
      boundary: normalizeScore(input.dataQuality?.boundary, country.profileOverrides?.dataQuality?.boundary ?? 0.7),
      threshold: normalizeScore(input.dataQuality?.threshold, country.profileOverrides?.dataQuality?.threshold ?? 0.7),
    },
  };
}

function sampleAgidFor(country: PostalZoneDesignerCountryPreset) {
  return encodeAGID(country.lat, country.lng).id;
}

function buildMinimumCodeRegions(country: PostalZoneDesignerCountryPreset, input: PostalZoneDesignerInput) {
  const addressCount = Math.max(1, Math.round(input.addressCount ?? Math.max(1200, country.population / 4)));
  const population = Math.max(1, Math.round(input.population ?? country.population));
  const demand = Math.max(1, Math.round(input.peakDeliveryDemand ?? Math.max(80, addressCount / 16)));
  const businessLoad = Math.max(1, Math.round(input.businessLoad ?? Math.max(30, demand / 3)));
  const components = Math.max(1, Math.round(input.connectedComponentCount ?? (country.terrain === 'archipelago' ? 4 : 1)));
  const covers = Math.max(1, Math.round(input.timeCoverCount ?? (country.terrain === 'desert' || country.terrain === 'archipelago' ? 3 : 1)));

  return [
    {
      regionId: `${country.code}-north-or-primary`,
      name: 'Primary planning region',
      addressCount: Math.round(addressCount * 0.45),
      population: Math.round(population * 0.45),
      peakDeliveryDemand: Math.round(demand * 0.45),
      businessLoad: Math.round(businessLoad * 0.45),
      connectedComponentCount: components,
      timeCoverCount: covers,
      largestAtomicAddressCount: Math.round(addressCount * 0.12),
    },
    {
      regionId: `${country.code}-secondary`,
      name: 'Secondary planning region',
      addressCount: Math.round(addressCount * 0.35),
      population: Math.round(population * 0.35),
      peakDeliveryDemand: Math.round(demand * 0.35),
      businessLoad: Math.round(businessLoad * 0.35),
      connectedComponentCount: Math.max(1, components - 1),
      timeCoverCount: Math.max(1, covers - 1),
    },
    {
      regionId: `${country.code}-remote-or-growth`,
      name: 'Remote or growth reserve',
      addressCount: Math.round(addressCount * 0.2),
      population: Math.round(population * 0.2),
      peakDeliveryDemand: Math.round(demand * 0.2),
      businessLoad: Math.round(businessLoad * 0.2),
      connectedComponentCount: Math.max(1, Math.ceil(components / 2)),
      timeCoverCount: Math.max(1, Math.ceil(covers / 2)),
      reserveCode: true,
    },
  ];
}

function decideDesignerStage(
  plan: AgidPostalDesignPlan,
  input: PostalZoneDesignerInput,
): AgidPostalDesignStatus {
  if (!plan.classification.allowed) return 'simulation';
  if (
    input.governmentOfficial
    && plan.publication.status === 'publishable'
    && plan.governance.approved
    && plan.dataTrust.readyForPublication
    && plan.privacy.publishable
  ) {
    return 'official';
  }
  if (plan.publication.status === 'publishable' && plan.classification.class === 'B') return 'supplementary';
  if (input.carrierPilot && plan.publication.canGenerateDraft && plan.privacy.publishable) return 'pilot';
  return 'draft';
}

function buildSafetyBoundaries(plan: AgidPostalDesignPlan, editRecord: AgidPostalZoneEditRecord): PostalZoneDesignerSafetyBoundary[] {
  return [
    {
      id: 'non-replacement',
      label: 'Class A mature postal systems are never replaced by AGID postal zones.',
      satisfied: plan.publication.theoremChecks.nonReplacement,
      severity: plan.publication.theoremChecks.nonReplacement ? 'info' : 'block',
    },
    {
      id: 'country-boundary',
      label: 'Integrated AGIDs must match the selected country prefix.',
      satisfied: editRecord.rejectedAgids.length === 0,
      severity: editRecord.rejectedAgids.length === 0 ? 'info' : 'warn',
    },
    {
      id: 'anonymity-floor',
      label: 'Public codes require minimum address and population anonymity.',
      satisfied: plan.privacy.anonymitySatisfied,
      severity: plan.privacy.anonymitySatisfied ? 'info' : 'block',
    },
    {
      id: 'sensitive-mask',
      label: 'Sensitive or high-risk zones cannot publish precise public codes.',
      satisfied: !plan.privacy.sensitiveBlocked && !plan.privacy.highRisk,
      severity: !plan.privacy.sensitiveBlocked && !plan.privacy.highRisk ? 'info' : 'block',
    },
    {
      id: 'governance',
      label: 'Government, municipality, carrier, and platform approval are tracked separately.',
      satisfied: plan.governance.approved,
      severity: plan.governance.approved ? 'info' : 'warn',
    },
    {
      id: 'data-trust',
      label: 'Low quality address, road, admin, population, or boundary data stays draft-only.',
      satisfied: plan.dataTrust.readyForPublication,
      severity: plan.dataTrust.readyForPublication ? 'info' : 'warn',
    },
  ];
}

function buildGisChecklist(plan: AgidPostalDesignPlan) {
  return [
    'Confirm every AGID cell centroid lies inside the selected national boundary.',
    'Run route-network connectivity on each proposed zone before pilot publication.',
    'Detect remaining unassigned AGIDs by municipality, island, connected region, or generated settlement cluster.',
    'Keep identifier plane and delivery route plane separate; route changes must not force code churn.',
    `Adaptive hierarchy: ${plan.adaptiveHierarchy.recommendedPathKinds.join(' -> ')}`,
  ];
}

function buildGovernanceChecklist(plan: AgidPostalDesignPlan, stage: AgidPostalDesignStatus) {
  return [
    stage === 'official'
      ? 'Official presentation is enabled only because all publication gates are satisfied.'
      : 'Do not present this zone as an official national postal code yet.',
    plan.classification.class === 'B'
      ? 'Existing postal code remains primary; AGID code is supplemental.'
      : plan.classification.class === 'C'
        ? 'AGID can propose a primary draft because postal codes are missing or not required.'
        : 'Class A country: generation is blocked except internal simulations.',
    'Publish old-code to new-code transition mappings before split or merge.',
    'Use public review, carrier pilot, and local authority sign-off before public deployment.',
  ];
}

const LOCALITY_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

function compactCodePart(seed: string, length = 2) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  let value = Math.abs(hash >>> 0);
  let output = '';
  for (let index = 0; index < length; index += 1) {
    output += LOCALITY_CODE_ALPHABET[value % LOCALITY_CODE_ALPHABET.length];
    value = Math.floor(value / LOCALITY_CODE_ALPHABET.length);
  }
  return output;
}

function buildTownOptions(countryCode: string, municipalityId: string, municipalityName: string): PostalZoneDesignerTownOption[] {
  const townNames = ['Central Quarter', 'North District', 'Harbor / Market Area'];
  return townNames.map((name, index) => {
    const townId = `${municipalityId}-T${index + 1}`;
    return {
      id: townId,
      name,
      codePart: compactCodePart(`${countryCode}:${municipalityName}:${name}`, 2),
      chomes: [
        { id: `${townId}-C0`, label: 'Town-wide', codePart: '00' },
        { id: `${townId}-C1`, label: '1-chome / Block 1', codePart: '01' },
        { id: `${townId}-C2`, label: '2-chome / Block 2', codePart: '02' },
        { id: `${townId}-C3`, label: '3-chome / Block 3', codePart: '03' },
      ],
    };
  });
}

export function buildPostalZoneLocalityChoices(
  country: PostalZoneDesignerCountryPreset,
): PostalZoneDesignerMunicipalityOption[] {
  const names = country.terrain === 'archipelago'
    ? ['Main Island Municipality', 'North Island Municipality', 'Outer Island Municipality']
    : country.terrain === 'desert'
      ? ['Capital Municipality', 'North Corridor Municipality', 'Oasis Municipality']
      : country.terrain === 'mountain'
        ? ['Central Valley Municipality', 'Upper Valley Municipality', 'Ridge Municipality']
        : ['Central Municipality', 'North Municipality', 'South Municipality'];

  return names.map((name, index) => {
    const municipalityId = `${country.code}-M${index + 1}`;
    return {
      id: municipalityId,
      name,
      codePart: compactCodePart(`${country.code}:${name}`, 2),
      towns: buildTownOptions(country.code, municipalityId, name),
    };
  });
}

export function suggestPostalZoneFormat(input: {
  country: PostalZoneDesignerCountryPreset;
  designPlan: AgidPostalDesignPlan;
  templateId: AgidPostalTemplateId;
  sampleMunicipality?: PostalZoneDesignerMunicipalityOption;
  sampleTown?: PostalZoneDesignerTownOption;
  sampleChome?: PostalZoneDesignerChomeOption | null;
}): PostalZoneDesignerFormatSuggestion {
  const template = AGID_POSTAL_TEMPLATES[input.templateId] || AGID_POSTAL_TEMPLATES['agid-native'];
  const classId = input.designPlan.classification.class;
  const scopeHint: PostalZoneDesignerFormatSuggestion['scopeHint'] = input.country.classHint === 'A'
    ? 'country'
    : input.country.terrain === 'archipelago'
      ? 'municipality'
      : 'town';
  let sample = input.designPlan.generated?.code || `${input.country.code}-MUNI-TOWN-CHK`;
  if (input.sampleMunicipality && input.sampleTown && classId !== 'A') {
    const path: AgidPostalVariableHierarchyPathNode[] = [
      {
        kind: 'admin-district' as const,
        codePart: input.sampleMunicipality.codePart,
        nodeId: input.sampleMunicipality.id,
        label: input.sampleMunicipality.name,
      },
      {
        kind: 'locality' as const,
        codePart: input.sampleTown.codePart,
        nodeId: input.sampleTown.id,
        label: input.sampleTown.name,
      },
    ];
    if (input.sampleChome && input.sampleChome.codePart !== '00') {
      path.push({
        kind: 'block' as const,
        codePart: input.sampleChome.codePart,
        nodeId: input.sampleChome.id,
        label: input.sampleChome.label,
      });
    }
    sample = buildAgidPostalVariableHierarchyCode({
      countryCode: input.country.code,
      path,
      includeCheckCharacter: true,
      minPartLength: 2,
    }).code;
  }

  return {
    templateId: input.templateId,
    label: template.label,
    formatPreview: classId === 'A'
      ? input.country.profileOverrides?.addressFormat?.postalCode?.format || template.format
      : `${input.country.code}-{municipality}-{town}-{block}-{check}`,
    exampleCode: sample || input.designPlan.generated?.code || `${input.country.code}-DRAFT`,
    scopeHint,
    canCreateNewCode: classId !== 'A',
    notice: classId === 'A'
      ? 'Existing official postal codes stay primary; AGID can only assist internally or as supplemental metadata.'
      : classId === 'B'
        ? 'Use as a supplemental AGID postal code; existing postal codes remain primary.'
        : 'A draft AGID postal code can be proposed after local and carrier review.',
    simpleReasons: [
      input.country.terrain === 'archipelago' ? 'Island-aware hierarchy is recommended.' : 'Locality-first hierarchy is recommended.',
      `Recommended visible format: ${template.format}.`,
      classId === 'A' ? 'New public replacement codes are blocked.' : 'Municipality-scoped codes are allowed as drafts.',
    ],
  };
}

export function listPostalZoneFormatOptions(input: {
  country: PostalZoneDesignerCountryPreset;
  designPlan: AgidPostalDesignPlan;
  selectedTemplateId: AgidPostalTemplateId;
}): PostalZoneDesignerFormatOption[] {
  const comparable = input.designPlan.countryLearning.comparableSystems;
  const byTemplate = new Map(comparable.map(system => [system.templateId, system]));
  const classId = input.designPlan.classification.class;
  const officialFormat = input.country.profileOverrides?.addressFormat?.postalCode?.format;

  return (Object.keys(AGID_POSTAL_TEMPLATES) as AgidPostalTemplateId[])
    .map((templateId) => {
      const template = AGID_POSTAL_TEMPLATES[templateId];
      const learned = byTemplate.get(templateId);
      const recommended = templateId === input.designPlan.countryLearning.recommendedTemplateId
        || templateId === input.selectedTemplateId;
      return {
        templateId,
        label: classId === 'A' && templateId === input.selectedTemplateId && officialFormat
          ? `${template.label} / existing official format`
          : template.label,
        format: classId === 'A' && templateId === input.selectedTemplateId && officialFormat
          ? officialFormat
          : template.format,
        description: template.description,
        basedOn: template.basedOn,
        fitScore: learned?.fitScore ?? (recommended ? 1 : 0.5),
        recommended,
        selectable: classId !== 'A' || templateId === input.selectedTemplateId,
        useAs: classId === 'A'
          ? 'official-existing'
          : learned?.useAs ?? (recommended ? 'primary-template' : 'supplemental-inspiration'),
        reasons: learned?.adoptedReasons?.slice(0, 3) || template.bestFor.slice(0, 3),
        cautions: classId === 'A' && templateId !== input.selectedTemplateId
          ? ['mature-postal-country-new-code-replacement-blocked']
          : learned?.caution?.slice(0, 2) || [],
      } satisfies PostalZoneDesignerFormatOption;
    })
    .sort((left, right) => {
      if (left.templateId === input.selectedTemplateId) return -1;
      if (right.templateId === input.selectedTemplateId) return 1;
      if (left.recommended !== right.recommended) return left.recommended ? -1 : 1;
      return right.fitScore - left.fitScore || left.label.localeCompare(right.label);
    });
}

export function proposePostalZoneCodeForLocality(input: {
  country: PostalZoneDesignerCountryPreset;
  designPlan: AgidPostalDesignPlan;
  templateId: AgidPostalTemplateId;
  localityChoices: PostalZoneDesignerMunicipalityOption[];
  municipalityId?: string | null;
  townId?: string | null;
  chomeId?: string | null;
  extraMunicipalityIds?: string[];
}): PostalZoneDesignerLocalityProposal {
  const municipality = input.localityChoices.find(choice => choice.id === input.municipalityId)
    || input.localityChoices[0]
    || null;
  const town = municipality?.towns.find(choice => choice.id === input.townId)
    || municipality?.towns[0]
    || null;
  const chome = town?.chomes.find(choice => choice.id === input.chomeId)
    || null;
  const selectedMunicipalityIds = new Set([
    municipality?.id,
    ...(input.extraMunicipalityIds || []),
  ].filter(Boolean) as string[]);
  const withinSingleMunicipality = selectedMunicipalityIds.size <= 1;
  const selectedMunicipality = Boolean(municipality);
  const townBelongsToMunicipality = Boolean(municipality && town && municipality.towns.some(choice => choice.id === town.id));
  const chomeBelongsToTown = !chome || Boolean(town && town.chomes.some(choice => choice.id === chome.id));
  const classAllowsCreation = input.designPlan.classification.class !== 'A';
  const formatSuggestion = suggestPostalZoneFormat({
    country: input.country,
    designPlan: input.designPlan,
    templateId: input.templateId,
    sampleMunicipality: municipality || undefined,
    sampleTown: town || undefined,
    sampleChome: chome,
  });
  const theoremChecks = {
    selectedMunicipality,
    withinSingleMunicipality,
    townBelongsToMunicipality,
    chomeBelongsToTown,
    classAllowsCreation,
  };
  const blockedReason = !selectedMunicipality
    ? 'select-municipality'
    : !withinSingleMunicipality
      ? 'postal-zone-cannot-cross-municipalities'
      : !townBelongsToMunicipality
        ? 'town-does-not-belong-to-selected-municipality'
        : !chomeBelongsToTown
          ? 'block-does-not-belong-to-selected-town'
          : !classAllowsCreation
            ? 'mature-postal-country-new-code-replacement-blocked'
            : null;

  if (blockedReason || !municipality || !town) {
    return {
      ok: false,
      code: null,
      selection: {
        municipalityId: municipality?.id || null,
        municipalityName: municipality?.name || null,
        townId: town?.id || null,
        townName: town?.name || null,
        chomeId: chome?.id || null,
        chomeLabel: chome?.label || null,
      },
      displayPath: [input.country.name, municipality?.name, town?.name, chome?.label].filter(Boolean) as string[],
      formatSuggestion,
      blockedReason,
      warnings: blockedReason ? [blockedReason] : [],
      theoremChecks,
      hierarchyCode: null,
    };
  }

  const path: AgidPostalVariableHierarchyPathNode[] = [
    { kind: 'admin-district' as const, codePart: municipality.codePart, nodeId: municipality.id, label: municipality.name },
    { kind: 'locality' as const, codePart: town.codePart, nodeId: town.id, label: town.name },
  ];
  if (chome && chome.codePart !== '00') {
    path.push({ kind: 'block' as const, codePart: chome.codePart, nodeId: chome.id, label: chome.label });
  }
  const hierarchyCode = buildAgidPostalVariableHierarchyCode({
    countryCode: input.country.code,
    path,
    includeCheckCharacter: true,
    minPartLength: 2,
  });

  return {
    ok: true,
    code: hierarchyCode.code,
    selection: {
      municipalityId: municipality.id,
      municipalityName: municipality.name,
      townId: town.id,
      townName: town.name,
      chomeId: chome?.id || null,
      chomeLabel: chome?.label || null,
    },
    displayPath: [input.country.name, municipality.name, town.name, chome?.label].filter(Boolean) as string[],
    formatSuggestion,
    blockedReason: null,
    warnings: [
      input.designPlan.classification.class === 'B' ? 'supplemental-code-existing-postal-remains-primary' : undefined,
      !input.designPlan.governance.approved ? 'draft-until-local-authority-and-carrier-review' : undefined,
    ].filter(Boolean) as string[],
    theoremChecks,
    hierarchyCode,
  };
}

function buildPostalZoneExampleGeneration(input: {
  country: PostalZoneDesignerCountryPreset;
  designPlan: AgidPostalDesignPlan;
  templateId: AgidPostalTemplateId;
  localityChoices: PostalZoneDesignerMunicipalityOption[];
}): PostalZoneDesignerExampleGeneration {
  const sampleScopes = input.localityChoices.slice(0, 3).map((municipality, index) => {
    const town = municipality.towns[Math.min(index, Math.max(0, municipality.towns.length - 1))]
      || municipality.towns[0];
    const chome = town?.chomes[Math.min(index + 1, Math.max(0, town.chomes.length - 1))]
      || town?.chomes[0]
      || null;
    const proposal = proposePostalZoneCodeForLocality({
      country: input.country,
      designPlan: input.designPlan,
      templateId: input.templateId,
      localityChoices: input.localityChoices,
      municipalityId: municipality.id,
      townId: town?.id,
      chomeId: chome?.id || null,
    });
    return {
      id: `${municipality.id}:${town?.id || 'town'}:${chome?.id || 'all'}`,
      label: `${municipality.name} / ${town?.name || 'Locality'}`,
      code: proposal.code,
      displayPath: proposal.displayPath,
      decision: proposal.ok
        ? input.designPlan.classification.class === 'C'
          ? 'draft-primary'
          : 'supplemental-draft'
        : 'blocked',
      boundarySafe: proposal.theoremChecks.withinSingleMunicipality,
      blockedReason: proposal.blockedReason,
      warnings: proposal.warnings,
    } satisfies PostalZoneDesignerExampleCandidate;
  });

  const terrainStep = input.country.terrain === 'archipelago'
    ? 'Use an island-aware hierarchy: country -> island or municipality -> town or quarter -> delivery block.'
    : input.country.terrain === 'desert'
      ? 'Use a corridor-aware hierarchy: country -> municipality -> road corridor or oasis locality -> delivery block.'
      : input.country.terrain === 'mountain'
        ? 'Use a valley-aware hierarchy: country -> valley or municipality -> settlement -> delivery block.'
        : 'Use a variable hierarchy: country -> municipality -> locality -> delivery block.';

  return {
    countryCode: input.country.code,
    countryName: input.country.name,
    countryClass: input.designPlan.classification.class,
    sourceNote: input.country.sourceNote,
    terrain: input.country.terrain,
    templateId: input.templateId,
    actualNoPostalCountryExample: input.designPlan.classification.class === 'C',
    methodSteps: [
      `Classify ${input.country.name} before generation: Class ${input.designPlan.classification.class}.`,
      terrainStep,
      'Generate visible codes from stable locality IDs, not mutable city-name strings.',
      'Reject a postal code scope when it crosses municipality boundaries.',
      'Keep generated codes as draft or pilot until governance, data-trust, privacy, and transition gates pass.',
    ],
    usabilityImprovements: [
      'Show concrete candidate codes before asking operators to tune detailed metrics.',
      'Expose only OK, draft, blocked, or review decisions; keep raw scores internal.',
      'Offer comparable formats, but default to the safest local hierarchy for the selected country.',
      'Use safe export data with commitments and counts, not raw addresses or personal records.',
    ],
    candidates: sampleScopes,
    summary: {
      generatedCandidateCount: sampleScopes.filter(scope => Boolean(scope.code)).length,
      allCandidatesStayInsideOneMunicipality: sampleScopes.every(scope => scope.boundarySafe),
      rawAddressIncluded: false,
      personalDataIncluded: false,
    },
  };
}

export function buildPostalZoneDesignerWorkspace(
  input: PostalZoneDesignerInput = {},
): PostalZoneDesignerWorkspace {
  const country = findCountryPreset(input.countryCode);
  const coverage = buildPostalForgeCoverageCountry(country);
  const profile = buildProfile(country, input);
  const agid = sampleAgidFor(country);
  const templateId = input.templateId
    || (country.terrain === 'archipelago' ? 'agid-native' : undefined)
    || undefined;
  const designPlan = buildAgidPostalDesignPlan({
    profile,
    agid,
    templateId,
  });
  const chosenTemplateId = designPlan.generated?.templateId || designPlan.countryLearning.recommendedTemplateId || designPlan.recommendation.templateId;
  const localityChoices = buildPostalZoneLocalityChoices(country);
  const selectedMunicipality = localityChoices.find(choice => choice.id === input.selectedMunicipalityId) || localityChoices[0];
  const selectedTown = selectedMunicipality?.towns.find(choice => choice.id === input.selectedTownId) || selectedMunicipality?.towns[0];
  const selectedChome = input.selectedChomeId === null
    ? null
    : selectedTown?.chomes.find(choice => choice.id === input.selectedChomeId) || selectedTown?.chomes[0] || null;
  const formatSuggestion = suggestPostalZoneFormat({
    country,
    designPlan,
    templateId: chosenTemplateId,
    sampleMunicipality: selectedMunicipality,
    sampleTown: selectedTown,
    sampleChome: selectedChome,
  });
  const formatOptions = listPostalZoneFormatOptions({
    country,
    designPlan,
    selectedTemplateId: chosenTemplateId,
  });
  const localityProposal = proposePostalZoneCodeForLocality({
    country,
    designPlan,
    templateId: chosenTemplateId,
    localityChoices,
    municipalityId: selectedMunicipality?.id,
    townId: selectedTown?.id,
    chomeId: selectedChome?.id || null,
    extraMunicipalityIds: input.extraMunicipalityIds,
  });
  const exampleGeneration = buildPostalZoneExampleGeneration({
    country,
    designPlan,
    templateId: chosenTemplateId,
    localityChoices,
  });
  const minimumCodeCount = estimateAgidPostalMinimumCodeCount({
    regions: buildMinimumCodeRegions(country, input),
    policy: {
      maxAddressCountPerCode: Math.max(100, Math.round(input.maxAddressCountPerCode ?? 5_000)),
      maxPopulationPerCode: Math.max(100, Math.round(input.maxPopulationPerCode ?? 18_000)),
      maxPeakDeliveryDemandPerCode: Math.max(10, Math.round(input.maxPeakDeliveryDemandPerCode ?? 850)),
      maxBusinessLoadPerCode: Math.max(5, Math.round(input.maxBusinessLoadPerCode ?? 300)),
      reserveEmptyRegions: true,
    },
  });
  const virtualLocalityNeed = evaluateAgidPostalVirtualLocalityNeed({
    countryCode: country.code,
    regionId: `${country.code}-planning-region`,
    ambiguityScore: input.ambiguityScore ?? (country.classHint === 'C' ? 0.74 : 0.48),
    ambiguityThreshold: 0.65,
    addressCount: input.addressCount ?? Math.max(1_200, Math.round(country.population / 4)),
    population: input.population ?? country.population,
    peakDeliveryDemand: input.peakDeliveryDemand ?? Math.max(80, Math.round(country.population / 320)),
    routeRadiusMinutes: input.routeRadiusMinutes ?? (country.terrain === 'archipelago' ? 180 : country.terrain === 'desert' ? 240 : 55),
    maxRouteRadiusMinutes: 90,
    connectedComponentCount: input.connectedComponentCount ?? (country.terrain === 'archipelago' ? 4 : 1),
    timeCoverCount: input.timeCoverCount ?? (country.terrain === 'desert' || country.terrain === 'archipelago' ? 3 : 1),
    maxAddressCountPerVirtualLocality: input.maxAddressCountPerCode ?? 5_000,
    maxPopulationPerVirtualLocality: input.maxPopulationPerCode ?? 18_000,
    maxPeakDeliveryDemandPerVirtualLocality: input.maxPeakDeliveryDemandPerCode ?? 850,
    minimumPublicAddressCount: profile.privacy?.minimumAddressEntities ?? 10,
    authority: 'postal-zone-designer-draft-authority',
  });
  const codeCount = Math.max(1, Math.min(16, virtualLocalityNeed.lowerBound || 4));
  const virtualLocalityCodes = generateAgidVirtualPostalLocalityCodes({
    count: codeCount,
    codeLength: 3,
    minHammingDistance: 3,
    adjacentMinHammingDistance: 3,
    seed: `${country.code}:${designPlan.generated?.code || chosenTemplateId}`,
  });
  const editRecord = createAgidPostalZoneEditRecord({
    countryCode: country.code,
    postalCode: designPlan.generated?.code || `${country.code}-DRAFT`,
    displayCode: designPlan.collisionAvoidance?.recommendedDisplayCode || designPlan.generated?.code || `${country.code}-DRAFT`,
    source: {
      kind: input.sourceKind || 'gis-import',
      appName: 'Postal Zone Designer',
      artifactHash: `PZD-${country.code}-${chosenTemplateId}`,
      operatorId: 'operator-ref-only',
    },
    integratedAgids: input.selectedAgids || [agid],
    excludedAgids: input.excludedAgids || [],
    editedAgids: input.selectedAgids ? [] : [{
      originalAgid: agid,
      editedAgid: agid,
      operation: 'include',
      note: 'seed-cell-for-country-zone-draft',
    }],
    now: input.now,
  });
  const editSummary = summarizeAgidPostalZoneEditRecord(editRecord);
  const stage = decideDesignerStage(designPlan, input);
  const safetyBoundaries = buildSafetyBoundaries(designPlan, editRecord);

  return {
    modelVersion: POSTAL_ZONE_DESIGNER_MODEL_VERSION,
    systemName: POSTAL_ZONE_CREATION_SYSTEM_NAME,
    systemNameJa: POSTAL_ZONE_CREATION_SYSTEM_NAME_JA,
    aiName: POSTAL_ZONE_AI_NAME,
    aiNameJa: POSTAL_ZONE_AI_NAME_JA,
    country,
    coverage,
    profile,
    templateId: chosenTemplateId,
    designPlan,
    aiQuality: designPlan.qualityReport,
    formatSuggestion,
    formatOptions,
    localityChoices,
    localityProposal,
    exampleGeneration,
    minimumCodeCount,
    virtualLocalityNeed,
    virtualLocalityCodes,
    editRecord,
    editSummary,
    stage,
    canClaimOfficial: stage === 'official' && designPlan.operationalStatus.canPresentAsOfficial,
    safetyBoundaries,
    gisChecklist: buildGisChecklist(designPlan),
    governanceChecklist: buildGovernanceChecklist(designPlan, stage),
    exportSafe: {
      systemName: POSTAL_ZONE_CREATION_SYSTEM_NAME,
      aiName: POSTAL_ZONE_AI_NAME,
      aiQualityGrade: designPlan.qualityReport.grade,
      aiQualityScore: designPlan.qualityReport.overallScore,
      suggestedFormat: formatSuggestion.formatPreview,
      localityProposalCode: localityProposal.code,
      countryCode: country.code,
      coverageClass: coverage.coverageClass,
      forgeMode: coverage.forgeMode,
      designStage: stage,
      class: designPlan.classification.class,
      generationPolicy: designPlan.generationPolicy,
      generatedCode: designPlan.generated?.code || null,
      exampleCodes: exampleGeneration.candidates.map(candidate => candidate.code).filter(Boolean) as string[],
      publicPublicationStatus: designPlan.publication.status,
      integratedAgidCount: editSummary.integratedCount,
      rejectedAgidCount: editSummary.rejectedCount,
      virtualLocalityCodes: virtualLocalityCodes.codes,
      privateLocationTextIncluded: false,
      personalDataIncluded: false,
    },
  };
}

export function listPostalZoneDesignerCountries(classHint?: AgidPostalCountryClass) {
  return POSTAL_ZONE_DESIGNER_COUNTRIES
    .filter(country => !classHint || country.classHint === classHint)
    .map(country => ({ ...country }));
}

export function listPostalForgeCoverageCountries(coverageClass?: PostalForgeCoverageClass) {
  return POSTAL_FORGE_COVERAGE_COUNTRIES
    .filter(country => !coverageClass || country.coverageClass === coverageClass)
    .map(country => ({ ...country }));
}

export function listPostalZoneDesignerTemplates() {
  return Object.values(AGID_POSTAL_TEMPLATES).map(template => ({ ...template }));
}
