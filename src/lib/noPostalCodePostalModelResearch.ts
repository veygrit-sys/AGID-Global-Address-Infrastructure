import {
  AGID_POSTAL_TARGET_COUNTRIES,
  type AgidPostalRegionUnitKind,
  type AgidPostalTemplateId,
} from './agidPostalCodeEngine';
import {
  buildPostalZoneDesignerWorkspace,
  type PostalZoneDesignerWorkspace,
} from './postalZoneDesigner';

export const NO_POSTAL_CODE_POSTAL_MODEL_RESEARCH_VERSION = 'no-postal-code-postal-model-research-v0.1';

export type NoPostalCodeTerrainProfile =
  | 'route-corridor'
  | 'dense-hilly'
  | 'archipelago'
  | 'desert-sparse'
  | 'compact-island'
  | 'mixed-rural';

export type NoPostalCodeModelId =
  | 'route-corridor-agid'
  | 'admin-locality-agid'
  | 'island-first-agid'
  | 'dense-hilly-hierarchy'
  | 'pure-grid-agid';

export type NoPostalCodeCandidateProfile = {
  countryCode: string;
  countryName: string;
  region: string;
  terrainProfile: NoPostalCodeTerrainProfile;
  population: number;
  areaKm2: number;
  municipalityCount: number;
  officialPostalGap: number;
  deliveryNeed: number;
  dataReadiness: number;
  pilotClarity: number;
  governanceComplexity: number;
  safetyRisk: number;
  conflictSensitivity: number;
  routeDependency: number;
  islandDependency: number;
  denseUrbanPressure: number;
  terrainComplexity: number;
  notes: string[];
};

export type NoPostalCodePilotRanking = {
  countryCode: string;
  countryName: string;
  score: number;
  terrainProfile: NoPostalCodeTerrainProfile;
  blockers: string[];
  rationale: string[];
  candidate: NoPostalCodeCandidateProfile;
};

export type NoPostalCodeModelCandidate = {
  modelId: NoPostalCodeModelId;
  label: string;
  templateId: AgidPostalTemplateId;
  publicFormat: string;
  hierarchyPath: AgidPostalRegionUnitKind[];
  routeFit: number;
  islandFit: number;
  denseFit: number;
  terrainFit: number;
  dataRequirement: number;
  readability: number;
  privacyFit: number;
  governanceEase: number;
  maintainability: number;
  rationale: string[];
};

export type NoPostalCodeModelScore = {
  modelId: NoPostalCodeModelId;
  label: string;
  templateId: AgidPostalTemplateId;
  publicFormat: string;
  hierarchyPath: AgidPostalRegionUnitKind[];
  score: number;
  dimensions: {
    terrainFit: number;
    dataFit: number;
    privacyFit: number;
    governanceFit: number;
    readabilityFit: number;
    maintainabilityFit: number;
  };
  rationale: string[];
  model: NoPostalCodeModelCandidate;
};

export type NoPostalCodeModelExperiment = {
  version: typeof NO_POSTAL_CODE_POSTAL_MODEL_RESEARCH_VERSION;
  country: NoPostalCodeCandidateProfile;
  recommended: NoPostalCodeModelScore;
  rankedModels: NoPostalCodeModelScore[];
  safety: {
    noOfficialClaim: true;
    noRawAddressIncluded: true;
    generatedCodesArePilotOnly: true;
  };
};

export type NoPostalCodeCountryImplementationProposal = {
  version: typeof NO_POSTAL_CODE_POSTAL_MODEL_RESEARCH_VERSION;
  countryCode: string;
  countryName: string;
  status: 'pilot-ready-review' | 'draft-ready-review' | 'research-only';
  selectedModelId: NoPostalCodeModelId;
  selectedTemplateId: AgidPostalTemplateId;
  selectedHierarchyPath: AgidPostalRegionUnitKind[];
  designStage: PostalZoneDesignerWorkspace['stage'];
  canClaimOfficial: false;
  safeExport: PostalZoneDesignerWorkspace['exportSafe'];
  sampleCodes: string[];
  adoptionChecklist: string[];
  qualityGates: string[];
  requiredCountryPackFiles: string[];
  oneCountryAtATimeNextSteps: string[];
  outputSafety: {
    rawAddressIncluded: false;
    personalDataIncluded: false;
    officialPostalCodeClaimIncluded: false;
  };
  modelExperiment: NoPostalCodeModelExperiment;
};

const BASE_COUNTRY_PROFILE = {
  population: 1_200_000,
  areaKm2: 45_000,
  municipalityCount: 18,
  officialPostalGap: 0.88,
  deliveryNeed: 0.68,
  dataReadiness: 0.58,
  pilotClarity: 0.62,
  governanceComplexity: 0.48,
  safetyRisk: 0.35,
  conflictSensitivity: 0.18,
  routeDependency: 0.35,
  islandDependency: 0.12,
  denseUrbanPressure: 0.34,
  terrainComplexity: 0.42,
};

const COUNTRY_OVERRIDES: Record<string, Partial<NoPostalCodeCandidateProfile>> = {
  GM: {
    terrainProfile: 'route-corridor',
    population: 2_700_000,
    areaKm2: 11_295,
    municipalityCount: 80,
    officialPostalGap: 0.94,
    deliveryNeed: 0.82,
    dataReadiness: 0.76,
    pilotClarity: 0.95,
    governanceComplexity: 0.25,
    safetyRisk: 0.18,
    conflictSensitivity: 0.1,
    routeDependency: 0.96,
    islandDependency: 0.02,
    denseUrbanPressure: 0.36,
    terrainComplexity: 0.38,
    notes: [
      'Small enough for a national pilot without loading global datasets into the app.',
      'Narrow river and road corridors make a route-corridor postal model easy to test.',
      'Lower first-sample risk than conflict-sensitive no-postal-code countries.',
    ],
  },
  RW: {
    terrainProfile: 'dense-hilly',
    population: 13_500_000,
    areaKm2: 26_338,
    municipalityCount: 416,
    officialPostalGap: 0.91,
    deliveryNeed: 0.85,
    dataReadiness: 0.8,
    pilotClarity: 0.81,
    governanceComplexity: 0.35,
    safetyRisk: 0.3,
    conflictSensitivity: 0.24,
    routeDependency: 0.42,
    islandDependency: 0,
    denseUrbanPressure: 0.72,
    terrainComplexity: 0.88,
    notes: [
      'Dense and hilly settlement patterns are useful for testing valley and locality hierarchy.',
      'Better as the second sample after the route-corridor model is proven.',
    ],
  },
  FJ: {
    terrainProfile: 'archipelago',
    population: 930_000,
    areaKm2: 18_274,
    municipalityCount: 14,
    officialPostalGap: 0.89,
    deliveryNeed: 0.65,
    dataReadiness: 0.7,
    pilotClarity: 0.78,
    governanceComplexity: 0.28,
    safetyRisk: 0.22,
    conflictSensitivity: 0.08,
    routeDependency: 0.25,
    islandDependency: 0.96,
    denseUrbanPressure: 0.28,
    terrainComplexity: 0.74,
    notes: ['Good archipelago sample after route-corridor and dense-hilly models are tested.'],
  },
  VU: {
    terrainProfile: 'archipelago',
    population: 335_000,
    areaKm2: 12_189,
    municipalityCount: 6,
    dataReadiness: 0.6,
    pilotClarity: 0.68,
    islandDependency: 0.98,
    terrainComplexity: 0.82,
    notes: ['High archipelago value, but weaker data readiness makes it later than Fiji.'],
  },
  SS: {
    terrainProfile: 'mixed-rural',
    deliveryNeed: 0.9,
    dataReadiness: 0.38,
    pilotClarity: 0.35,
    governanceComplexity: 0.82,
    safetyRisk: 0.9,
    conflictSensitivity: 0.92,
    notes: ['Humanitarian value is high, but not suitable as the first public pilot.'],
  },
  YE: {
    terrainProfile: 'dense-hilly',
    deliveryNeed: 0.88,
    dataReadiness: 0.42,
    pilotClarity: 0.32,
    governanceComplexity: 0.84,
    safetyRisk: 0.92,
    conflictSensitivity: 0.94,
    terrainComplexity: 0.9,
    notes: ['Conflict-sensitive; keep research-only until governance and safety improve.'],
  },
  LY: {
    terrainProfile: 'desert-sparse',
    deliveryNeed: 0.76,
    dataReadiness: 0.44,
    governanceComplexity: 0.78,
    safetyRisk: 0.78,
    conflictSensitivity: 0.86,
    routeDependency: 0.65,
    terrainComplexity: 0.74,
    notes: ['Sparse desert routing is useful, but conflict sensitivity blocks first adoption.'],
  },
};

const MODEL_CANDIDATES: NoPostalCodeModelCandidate[] = [
  {
    modelId: 'route-corridor-agid',
    label: 'Route-corridor AGID postal zones',
    templateId: 'agid-native',
    publicFormat: 'CC-REG-COR-NNN',
    hierarchyPath: ['country', 'region', 'corridor', 'locality', 'delivery-zone'],
    routeFit: 0.98,
    islandFit: 0.08,
    denseFit: 0.38,
    terrainFit: 0.58,
    dataRequirement: 0.52,
    readability: 0.82,
    privacyFit: 0.84,
    governanceEase: 0.84,
    maintainability: 0.88,
    rationale: [
      'Works when delivery follows a river, trunk road, ferry, or repeated carrier corridor.',
      'Can start coarse and split only when route evidence justifies more codes.',
    ],
  },
  {
    modelId: 'admin-locality-agid',
    label: 'Administrative locality AGID zones',
    templateId: 'france-like',
    publicFormat: 'CC-ADM-NNN',
    hierarchyPath: ['country', 'region', 'admin-district', 'locality', 'delivery-zone'],
    routeFit: 0.42,
    islandFit: 0.24,
    denseFit: 0.62,
    terrainFit: 0.62,
    dataRequirement: 0.68,
    readability: 0.86,
    privacyFit: 0.78,
    governanceEase: 0.72,
    maintainability: 0.82,
    rationale: [
      'Best when official administrative boundaries are trusted and stable.',
      'Easy for governments to review, but weaker for route-driven countries.',
    ],
  },
  {
    modelId: 'island-first-agid',
    label: 'Island-first AGID postal zones',
    templateId: 'agid-native',
    publicFormat: 'CC-ISL-LOC-NNN',
    hierarchyPath: ['country', 'island', 'locality', 'delivery-zone'],
    routeFit: 0.28,
    islandFit: 0.99,
    denseFit: 0.28,
    terrainFit: 0.68,
    dataRequirement: 0.5,
    readability: 0.8,
    privacyFit: 0.82,
    governanceEase: 0.8,
    maintainability: 0.84,
    rationale: [
      'Best for archipelagos where island identity is the first sorting step.',
      'Avoids pretending that island routes behave like mainland street grids.',
    ],
  },
  {
    modelId: 'dense-hilly-hierarchy',
    label: 'Dense hilly hierarchy',
    templateId: 'france-like',
    publicFormat: 'CC-VAL-LOC-NNN',
    hierarchyPath: ['country', 'region', 'valley', 'settlement', 'delivery-zone'],
    routeFit: 0.48,
    islandFit: 0.02,
    denseFit: 0.86,
    terrainFit: 0.94,
    dataRequirement: 0.7,
    readability: 0.83,
    privacyFit: 0.78,
    governanceEase: 0.68,
    maintainability: 0.78,
    rationale: [
      'Best where hills, valleys, and dense settlement patterns drive delivery ambiguity.',
      'Requires stronger boundary and locality data than the route-corridor model.',
    ],
  },
  {
    modelId: 'pure-grid-agid',
    label: 'Pure AGID grid postal zones',
    templateId: 'ghana-like',
    publicFormat: 'CC-GRID-NNNN',
    hierarchyPath: ['country', 'geographic-cell', 'delivery-zone'],
    routeFit: 0.36,
    islandFit: 0.42,
    denseFit: 0.45,
    terrainFit: 0.45,
    dataRequirement: 0.35,
    readability: 0.68,
    privacyFit: 0.64,
    governanceEase: 0.66,
    maintainability: 0.72,
    rationale: [
      'Useful as a fallback when there is almost no trusted administrative or route data.',
      'Should not be the first public-facing model where better local hierarchy exists.',
    ],
  },
];

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function roundScore(value: number) {
  return Number(clamp01(value).toFixed(3));
}

function inferTerrainProfile(note: string): NoPostalCodeTerrainProfile {
  const text = note.toLowerCase();
  if (/narrow river|route corridor|corridor/.test(text)) return 'route-corridor';
  if (/archipelago|island|atoll/.test(text)) return 'archipelago';
  if (/desert|sparse|sahel/.test(text)) return 'desert-sparse';
  if (/mountain|hilly|valley/.test(text)) return 'dense-hilly';
  return 'mixed-rural';
}

function candidateBlockers(candidate: NoPostalCodeCandidateProfile) {
  return [
    candidate.safetyRisk >= 0.75 ? 'high-risk-country-not-first-sample' : null,
    candidate.conflictSensitivity >= 0.65 ? 'conflict-sensitive-keep-research-only' : null,
    candidate.dataReadiness < 0.45 ? 'oss-and-official-data-too-weak-for-adoption-pilot' : null,
    candidate.pilotClarity < 0.5 ? 'pilot-scope-too-unclear' : null,
    candidate.governanceComplexity > 0.7 ? 'governance-complexity-too-high-for-first-country' : null,
  ].filter(Boolean) as string[];
}

function buildCandidateProfile(countryCode: string): NoPostalCodeCandidateProfile | null {
  const normalized = countryCode.trim().toUpperCase();
  const target = AGID_POSTAL_TARGET_COUNTRIES.find(country => country.code === normalized);
  if (!target) return null;
  const terrainProfile = inferTerrainProfile(target.note);
  const override = COUNTRY_OVERRIDES[normalized] || {};
  return {
    countryCode: target.code,
    countryName: target.name,
    region: target.region,
    terrainProfile,
    ...BASE_COUNTRY_PROFILE,
    notes: [target.note],
    ...override,
  };
}

function calculatePilotScore(candidate: NoPostalCodeCandidateProfile) {
  const researchValue = Math.max(
    candidate.routeDependency,
    candidate.islandDependency,
    candidate.denseUrbanPressure,
    candidate.terrainComplexity,
  );
  const score = (
    candidate.officialPostalGap * 0.16
    + candidate.deliveryNeed * 0.18
    + candidate.dataReadiness * 0.16
    + candidate.pilotClarity * 0.16
    + (1 - candidate.governanceComplexity) * 0.12
    + (1 - candidate.safetyRisk) * 0.12
    + researchValue * 0.1
    - candidate.conflictSensitivity * 0.22
  );
  return roundScore(score);
}

function rankingRationale(candidate: NoPostalCodeCandidateProfile, blockers: string[]) {
  return [
    `terrain-profile:${candidate.terrainProfile}`,
    `official-postal-gap:${candidate.officialPostalGap}`,
    `delivery-need:${candidate.deliveryNeed}`,
    `data-readiness:${candidate.dataReadiness}`,
    `pilot-clarity:${candidate.pilotClarity}`,
    blockers.length ? `blockers:${blockers.join(',')}` : 'blockers:none',
    ...candidate.notes.slice(0, 3),
  ];
}

export function listNoPostalCodePilotCandidates(): NoPostalCodeCandidateProfile[] {
  return AGID_POSTAL_TARGET_COUNTRIES
    .map(country => buildCandidateProfile(country.code))
    .filter(Boolean) as NoPostalCodeCandidateProfile[];
}

export function rankNoPostalCodePilotCountries(): NoPostalCodePilotRanking[] {
  return listNoPostalCodePilotCandidates()
    .map((candidate) => {
      const blockers = candidateBlockers(candidate);
      return {
        countryCode: candidate.countryCode,
        countryName: candidate.countryName,
        score: calculatePilotScore(candidate),
        terrainProfile: candidate.terrainProfile,
        blockers,
        rationale: rankingRationale(candidate, blockers),
        candidate,
      };
    })
    .sort((left, right) => {
      const leftBlocked = left.blockers.length > 0 ? 1 : 0;
      const rightBlocked = right.blockers.length > 0 ? 1 : 0;
      if (leftBlocked !== rightBlocked) return leftBlocked - rightBlocked;
      return right.score - left.score || left.countryCode.localeCompare(right.countryCode);
    });
}

export function recommendFirstNoPostalCodePilotCountry() {
  const [first] = rankNoPostalCodePilotCountries();
  if (!first) throw new Error('No no-postal-code target countries are configured.');
  return first;
}

function closeFit(modelValue: number, countryValue: number) {
  return clamp01(1 - Math.abs(modelValue - countryValue));
}

function scoreModelForCountry(
  model: NoPostalCodeModelCandidate,
  country: NoPostalCodeCandidateProfile,
): NoPostalCodeModelScore {
  const terrainFit = roundScore((
    closeFit(model.routeFit, country.routeDependency) * 0.35
    + closeFit(model.islandFit, country.islandDependency) * 0.2
    + closeFit(model.denseFit, country.denseUrbanPressure) * 0.2
    + closeFit(model.terrainFit, country.terrainComplexity) * 0.25
  ));
  const dataFit = roundScore(country.dataReadiness >= model.dataRequirement
    ? 0.82 + (country.dataReadiness - model.dataRequirement) * 0.35
    : 0.82 - (model.dataRequirement - country.dataReadiness) * 0.8);
  const privacyFit = roundScore(model.privacyFit - country.safetyRisk * 0.18);
  const governanceFit = roundScore(model.governanceEase - country.governanceComplexity * 0.16);
  const readabilityFit = roundScore(model.readability);
  const maintainabilityFit = roundScore(model.maintainability - country.terrainComplexity * 0.08);
  const score = roundScore(
    terrainFit * 0.32
    + dataFit * 0.16
    + privacyFit * 0.15
    + governanceFit * 0.14
    + readabilityFit * 0.13
    + maintainabilityFit * 0.1,
  );
  return {
    modelId: model.modelId,
    label: model.label,
    templateId: model.templateId,
    publicFormat: model.publicFormat,
    hierarchyPath: model.hierarchyPath,
    score,
    dimensions: {
      terrainFit,
      dataFit,
      privacyFit,
      governanceFit,
      readabilityFit,
      maintainabilityFit,
    },
    rationale: [
      `score:${score}`,
      `terrain-fit:${terrainFit}`,
      `data-fit:${dataFit}`,
      `privacy-fit:${privacyFit}`,
      ...model.rationale,
    ],
    model,
  };
}

export function runNoPostalCodeModelExperiment(countryCode = recommendFirstNoPostalCodePilotCountry().countryCode): NoPostalCodeModelExperiment {
  const country = buildCandidateProfile(countryCode);
  if (!country) throw new Error(`No no-postal-code country profile found for ${countryCode}`);
  const rankedModels = MODEL_CANDIDATES
    .map(model => scoreModelForCountry(model, country))
    .sort((left, right) => right.score - left.score || left.modelId.localeCompare(right.modelId));
  const recommended = rankedModels[0];
  if (!recommended) throw new Error('No postal code models are configured.');
  return {
    version: NO_POSTAL_CODE_POSTAL_MODEL_RESEARCH_VERSION,
    country,
    recommended,
    rankedModels,
    safety: {
      noOfficialClaim: true,
      noRawAddressIncluded: true,
      generatedCodesArePilotOnly: true,
    },
  };
}

function decideProposalStatus(
  ranking: NoPostalCodePilotRanking,
  workspace: PostalZoneDesignerWorkspace,
): NoPostalCodeCountryImplementationProposal['status'] {
  if (ranking.blockers.length > 0) return 'research-only';
  if (workspace.stage === 'pilot') return 'pilot-ready-review';
  return 'draft-ready-review';
}

function uniqueCodes(codes: Array<string | null | undefined>) {
  return [...new Set(codes.filter(Boolean) as string[])];
}

export function buildNoPostalCodeCountryPilotProposal(
  countryCode = recommendFirstNoPostalCodePilotCountry().countryCode,
): NoPostalCodeCountryImplementationProposal {
  const ranking = rankNoPostalCodePilotCountries().find(item => item.countryCode === countryCode.toUpperCase());
  if (!ranking) throw new Error(`No no-postal-code pilot ranking found for ${countryCode}`);
  const modelExperiment = runNoPostalCodeModelExperiment(ranking.countryCode);
  const model = modelExperiment.recommended;
  const candidate = modelExperiment.country;
  const workspace = buildPostalZoneDesignerWorkspace({
    countryCode: candidate.countryCode,
    templateId: model.templateId,
    population: candidate.population,
    areaKm2: candidate.areaKm2,
    municipalityCount: candidate.municipalityCount,
    carrierPilot: true,
    governance: {
      government: 0.35,
      municipality: 0.55,
      carrier: 0.8,
      platform: 0.85,
      threshold: 0.7,
    },
    dataQuality: {
      address: candidate.dataReadiness,
      road: Math.min(1, candidate.dataReadiness + 0.06),
      admin: Math.min(1, candidate.dataReadiness + 0.08),
      population: candidate.dataReadiness,
      boundary: Math.min(1, candidate.dataReadiness + 0.08),
      threshold: 0.7,
    },
    privacy: {
      addressEntitiesPerArea: 80,
      populationPerArea: 240,
      minimumAddressEntities: 10,
      minimumPopulation: 50,
      highRisk: candidate.safetyRisk >= 0.75,
    },
  });

  return {
    version: NO_POSTAL_CODE_POSTAL_MODEL_RESEARCH_VERSION,
    countryCode: candidate.countryCode,
    countryName: candidate.countryName,
    status: decideProposalStatus(ranking, workspace),
    selectedModelId: model.modelId,
    selectedTemplateId: model.templateId,
    selectedHierarchyPath: model.hierarchyPath,
    designStage: workspace.stage,
    canClaimOfficial: false,
    safeExport: workspace.exportSafe,
    sampleCodes: uniqueCodes([
      workspace.localityProposal.code,
      ...workspace.exampleGeneration.candidates.map(candidateCode => candidateCode.code),
      ...workspace.virtualLocalityCodes.codes.map(code => `${candidate.countryCode}-${code}`),
    ]).slice(0, 8),
    adoptionChecklist: [
      'Confirm government or postal-authority sponsor before any official wording.',
      'Load national boundary, admin boundary, settlement, road, and route evidence into the country pack.',
      'Run carrier pilot in one region before nationwide code publication.',
      'Keep old locality names, AGID cells, and generated postal zones in a reversible mapping table.',
      'Publish source licenses, generatedAt, confidence, and deprecation policy with the pack.',
    ],
    qualityGates: [
      'No raw address or recipient data in exported model research.',
      'Generated code scope must stay inside one municipality or approved corridor region.',
      'Minimum public anonymity floor must pass before public code display.',
      'No official postal code claim until governance and data-trust thresholds pass.',
      'Code churn budget must be checked before split or merge publication.',
    ],
    requiredCountryPackFiles: [
      'postal.schema.json',
      'rules.json',
      'sources.json',
      'zones.geojson or zones.pmtiles',
      'route-evidence-index.json',
      'planning-cell-index.json',
      'test-vectors.json',
    ],
    oneCountryAtATimeNextSteps: [
      'Freeze this country pilot profile and fixtures.',
      'Import official or open boundary and route datasets for the selected region.',
      'Generate candidate zones and run split/merge quality gates.',
      'Review with carrier and local operator feedback.',
      'Only then start the next country model class.',
    ],
    outputSafety: {
      rawAddressIncluded: false,
      personalDataIncluded: false,
      officialPostalCodeClaimIncluded: false,
    },
    modelExperiment,
  };
}
