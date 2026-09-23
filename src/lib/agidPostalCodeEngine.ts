import { decodeAGID } from './agid';
import {
  classifyAddressCoveragePolicy,
  type AddressCoverageFormatLike,
  type AddressCoveragePolicyId,
} from './addressCoveragePolicy';

export const AGID_POSTAL_CODE_ENGINE_VERSION = 'agid-postal-code-engine-v0.1-rc';
export const AGID_POSTAL_CREATION_SYSTEM_NAME = 'AGID Postal Forge';
export const AGID_POSTAL_CREATION_SYSTEM_NAME_JA = 'AGID郵便区画フォージ';
export const AGID_POSTAL_CREATION_AI_NAME = 'AtlasWeaver AI';
export const AGID_POSTAL_CREATION_AI_NAME_JA = 'AtlasWeaver AI（アトラスウィーバー）';
export const AGID_POSTAL_CREATION_AI_VERSION = 'atlasweaver-ai-v0.2-quality-gates';

export type AgidPostalCountryClass = 'A' | 'B' | 'C';
export type AgidPostalGenerationMode =
  | 'existing-postal-only'
  | 'supplemental-agid-postal'
  | 'primary-agid-postal';

export type AgidPostalTerrainClass =
  | 'compact-urban'
  | 'large-rural'
  | 'archipelago'
  | 'desert'
  | 'mountain'
  | 'mixed';

export type AgidPostalTemplateId =
  | 'japan-like'
  | 'us-like'
  | 'india-like'
  | 'france-like'
  | 'uk-like'
  | 'singapore-like'
  | 'ghana-like'
  | 'agid-native';

export type AgidPostalTargetCountry = {
  code: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  classHint: 'C';
  basis: 'upu-postal-code-not-required-2025-user-supplied';
  note: string;
};

export type AgidPostalTemplate = {
  id: AgidPostalTemplateId;
  label: string;
  basedOn: string;
  format: string;
  bestFor: string[];
  description: string;
  hierarchyDepth: number;
  defaultLength: number;
};

export type AgidPostalCountryProfile = {
  countryCode: string;
  countryName?: string;
  population?: number;
  areaKm2?: number;
  urbanizationPercent?: number;
  municipalityCount?: number;
  terrain?: AgidPostalTerrainClass;
  addressFormat?: AddressCoverageFormatLike | null;
  evidenceSources?: string[];
  governance?: AgidPostalGovernanceSignals;
  privacy?: AgidPostalPrivacySignals;
  dataQuality?: AgidPostalDataQualitySignals;
  existingPostalPattern?: string | null;
  existingPostalSamples?: string[];
};

export type AgidPostalGovernanceSignals = {
  government?: number;
  municipality?: number;
  carrier?: number;
  platform?: number;
  threshold?: number;
};

export type AgidPostalPrivacySignals = {
  addressEntitiesPerArea?: number;
  populationPerArea?: number;
  minimumAddressEntities?: number;
  minimumPopulation?: number;
  sensitive?: boolean;
  highRisk?: boolean;
};

export type AgidPostalDataQualitySignals = {
  address?: number;
  road?: number;
  admin?: number;
  population?: number;
  boundary?: number;
  threshold?: number;
};

export type AgidPostalPublicationStatus =
  | 'publishable'
  | 'draft-only'
  | 'review-required'
  | 'blocked';

export type AgidPostalGovernanceDecision = {
  approvalScore: number;
  threshold: number;
  approved: boolean;
  missingActors: Array<'government' | 'municipality' | 'carrier' | 'platform'>;
  rationale: string[];
};

export type AgidPostalPrivacyDecision = {
  addressEntitiesPerArea: number;
  populationPerArea: number;
  minimumAddressEntities: number;
  minimumPopulation: number;
  anonymitySatisfied: boolean;
  sensitiveBlocked: boolean;
  highRisk: boolean;
  publishable: boolean;
  rationale: string[];
};

export type AgidPostalDataTrustDecision = {
  trustScore: number;
  threshold: number;
  readyForPublication: boolean;
  mode: 'official-ready' | 'draft-zone-only';
  components: Required<Omit<AgidPostalDataQualitySignals, 'threshold'>>;
  rationale: string[];
};

export type AgidPostalCollisionDecision = {
  collisionFree: boolean;
  strategy: 'country-prefixed' | 'agid-prefixed' | 'existing-postal-suffix' | 'blocked';
  recommendedDisplayCode: string | null;
  rationale: string[];
};

export type AgidPostalReadabilityDecision = {
  score: number;
  visibleLength: number;
  separatorCount: number;
  ambiguityPenalty: number;
  rationale: string[];
};

export type AgidPostalPublicationDecision = {
  status: AgidPostalPublicationStatus;
  canGenerateDraft: boolean;
  canPublishPublicCode: boolean;
  theoremChecks: {
    governanceApproval: boolean;
    anonymity: boolean;
    dataTrust: boolean;
    collisionAvoidance: boolean;
    nonReplacement: boolean;
  };
  rationale: string[];
};

export type AgidPostalCountryClassification = {
  countryCode: string;
  countryName?: string;
  class: AgidPostalCountryClass;
  policyId: AddressCoveragePolicyId;
  generationMode: AgidPostalGenerationMode;
  allowed: boolean;
  reason: string;
  sources: string[];
};

export type AgidPostalTemplateRecommendation = {
  templateId: AgidPostalTemplateId;
  confidence: number;
  terrain: AgidPostalTerrainClass;
  rationale: string[];
};

export type AgidPostalCountryScale =
  | 'micro'
  | 'small'
  | 'medium'
  | 'large'
  | 'continental';

export type AgidPostalPopulationBand =
  | 'unknown'
  | 'very-small'
  | 'small'
  | 'medium'
  | 'large'
  | 'mega';

export type AgidPostalAreaBand =
  | 'unknown'
  | 'micro'
  | 'small'
  | 'medium'
  | 'large'
  | 'continental';

export type AgidPostalExistingSystemUse =
  | 'primary-template'
  | 'supplemental-inspiration'
  | 'avoid-direct-copy';

export type AgidPostalLearningMode =
  | 'mature-postal-baseline'
  | 'weak-postal-supplement'
  | 'missing-postal-design';

export type AgidPostalLearningUse =
  | 'internal-baseline-only'
  | 'supplemental-design'
  | 'primary-design';

export type AgidPostalExistingSystemLearning = {
  templateId: AgidPostalTemplateId;
  basedOn: string;
  format: string;
  fitScore: number;
  adoptedReasons: string[];
  caution: string[];
  useAs: AgidPostalExistingSystemUse;
};

export type AgidPostalCountryDesignLearning = {
  learningRequired: boolean;
  learningMode: AgidPostalLearningMode;
  allowedUse: AgidPostalLearningUse;
  generationBlockedByMaturePostalSystem: boolean;
  countryCode: string;
  class: AgidPostalCountryClass;
  terrain: AgidPostalTerrainClass;
  countryScale: AgidPostalCountryScale;
  populationBand: AgidPostalPopulationBand;
  areaBand: AgidPostalAreaBand;
  densityPerKm2: number | null;
  observedFactors: string[];
  comparableSystems: AgidPostalExistingSystemLearning[];
  recommendedTemplateId: AgidPostalTemplateId;
  rationale: string[];
};

export type AgidPostalCodeGenerationInput = {
  countryCode: string;
  agid: string;
  templateId: AgidPostalTemplateId;
  length?: number;
  allowWeakPostalSupplement?: boolean;
  addressFormat?: AddressCoverageFormatLike | null;
  profile?: AgidPostalCountryProfile;
};

export type AgidPostalGenerationPublicationStage =
  | 'simulation-only'
  | 'supplemental-draft'
  | 'primary-draft';

export type AgidPostalGenerationPolicy = {
  publicationStage: AgidPostalGenerationPublicationStage;
  canGenerateVisibleCode: boolean;
  officialReplacementAllowed: boolean;
  canBecomeOfficialAfterApproval: boolean;
  requiresExistingPostalContext: boolean;
  requiresAuthorityApproval: boolean;
  requiresPublicReview: boolean;
  namespace: string;
  label: string;
  codeLength: {
    requested: number;
    effective: number;
    minimum: number;
    maximum: number;
  };
  visibleCode: {
    countryPrefixRequired: boolean;
    agidNamespaceRequired: boolean;
    checkCharacterRecommended: boolean;
    maxVisibleLength: number;
  };
  privacyFloor: {
    minimumAddressEntities: number;
    minimumPopulation: number;
  };
  rationale: string[];
};

export type AgidPostalCodeGenerationResult = {
  ok: boolean;
  code?: string;
  countryCode: string;
  agid: string;
  templateId: AgidPostalTemplateId;
  generationMode?: AgidPostalGenerationMode;
  generationPolicy?: AgidPostalGenerationPolicy;
  blockedReason?: string;
  collisionAvoidance?: AgidPostalCollisionDecision;
  readability?: AgidPostalReadabilityDecision;
  warnings: string[];
};

export type AgidPostalAreaEstimate = {
  baseAgidCellCount: number;
  suggestedPostalAreaCount: number;
  peoplePerArea: number;
  km2PerPostalArea: number;
  municipalityCount: number;
  approximateAgidCellsPerMunicipality: number;
  approximatePostalAreasPerMunicipality: number;
};

export type AgidPostalReshapePlan = {
  fromTemplateId: AgidPostalTemplateId;
  toTemplateId: AgidPostalTemplateId;
  reversibleByAgid: boolean;
  migrationSteps: string[];
  detectionRules: string[];
};

export type AgidPostalZoneEditSourceKind =
  | 'pen-tablet'
  | 'display-tablet'
  | 'adobe-illustrator'
  | 'adobe-photoshop'
  | 'adobe-pdf'
  | 'gis-import'
  | 'manual-pointer'
  | 'touch';

export type AgidPostalZoneEditOperation =
  | 'include'
  | 'exclude'
  | 'reshape'
  | 'merge'
  | 'split'
  | 'adobe-import'
  | 'gis-import';

export type AgidPostalZoneEditSource = {
  kind: AgidPostalZoneEditSourceKind;
  appName?: string;
  deviceName?: string;
  fileName?: string;
  artifactHash?: string;
  pressureSupported?: boolean;
  operatorId?: string;
};

export type AgidPostalEditedAgid = {
  originalAgid: string;
  editedAgid: string;
  operation: AgidPostalZoneEditOperation;
  sourceKind: AgidPostalZoneEditSourceKind;
  timestamp: string;
  note?: string;
  pressureSamples?: number;
};

export type AgidPostalZoneEditRecord = {
  id: string;
  countryCode: string;
  postalCode: string;
  displayCode?: string;
  source: AgidPostalZoneEditSource;
  integratedAgids: string[];
  editedAgids: AgidPostalEditedAgid[];
  excludedAgids: string[];
  rejectedAgids: Array<{ agid: string; reason: string }>;
  createdAt: string;
  updatedAt: string;
  revision: number;
  revisionId: string;
  warnings: string[];
};

export type AgidPostalZoneEditRecordInput = {
  countryCode: string;
  postalCode: string;
  displayCode?: string;
  source: AgidPostalZoneEditSource;
  integratedAgids?: string[];
  editedAgids?: Array<Partial<AgidPostalEditedAgid> & { originalAgid: string; editedAgid?: string }>;
  excludedAgids?: string[];
  now?: string;
};

export type AgidPostalZoneEditSummary = {
  countryCode: string;
  postalCode: string;
  integratedCount: number;
  editedCount: number;
  excludedCount: number;
  rejectedCount: number;
  sourceKind: AgidPostalZoneEditSourceKind;
  revisionId: string;
  auditRationale: string[];
};

export type AgidPostalLocalitySeparationMode =
  | 'strict-locality-separation'
  | 'locality-prefix-separation'
  | 'delivery-priority';

export type AgidPostalLocalityNameHistoryEntry = {
  name: string;
  language?: string;
  from?: string;
  to?: string | null;
};

export type AgidPostalLocalityRecord = {
  countryCode: string;
  islandCode: string;
  localityId: string;
  localityCode: string;
  currentName: string;
  previousLocalityId?: string;
  previousLocalityCode?: string;
  previousName?: string;
  nameHistory?: AgidPostalLocalityNameHistoryEntry[];
  postalCodes: string[];
};

export type AgidPostalHierarchicalCodeInput = {
  countryCode: string;
  islandCode: string | number;
  localityCode: string | number;
  deliveryZoneCode: string | number;
  includeCheckCharacter?: boolean;
};

export type AgidPostalHierarchicalCodeResult = {
  code: string;
  components: {
    countryCode: string;
    islandCode: string;
    localityCode: string;
    deliveryZoneCode: string;
    checkCharacter: string | null;
  };
};

export type AgidPostalLocalitySeparationDecision = {
  mode: AgidPostalLocalitySeparationMode;
  localityCodeInjective: boolean;
  postalSetsDisjoint: boolean;
  renameInvariant: boolean;
  separated: boolean;
  collisions: Array<{
    kind: 'locality-code' | 'postal-code' | 'rename-code-change';
    localityIds: string[];
    value: string;
  }>;
  theoremChecks: {
    localitySeparation: boolean;
    renamingInvariance: boolean;
    hierarchyRefinementPreservesSeparation: boolean;
  };
  rationale: string[];
};

export type AgidPostalDesignStatus =
  | 'simulation'
  | 'draft'
  | 'pilot'
  | 'supplementary'
  | 'official';

export type AgidPostalRegionUnitKind =
  | 'country'
  | 'mainland'
  | 'island'
  | 'exclave'
  | 'connected-region'
  | 'province'
  | 'state'
  | 'region'
  | 'admin-district'
  | 'city-district'
  | 'locality'
  | 'settlement'
  | 'generated-settlement-cluster'
  | 'valley'
  | 'basin'
  | 'corridor'
  | 'oasis'
  | 'watershed'
  | 'delta'
  | 'metropolitan'
  | 'block'
  | 'delivery-zone'
  | 'building-group'
  | 'geographic-cell'
  | 'landmark';

export type AgidPostalAdaptiveCountryType =
  | 'small-state'
  | 'archipelago'
  | 'continental'
  | 'mountain'
  | 'desert'
  | 'route-corridor'
  | 'river-delta'
  | 'weak-address-data'
  | 'no-street-name'
  | 'enclave'
  | 'high-rise-city'
  | 'mixed';

export type AgidPostalVariableHierarchyPathNode = {
  kind: AgidPostalRegionUnitKind;
  codePart: string | number;
  nodeId?: string;
  label?: string;
};

export type AgidPostalVariableHierarchyCodeInput = {
  countryCode: string;
  path: AgidPostalVariableHierarchyPathNode[];
  includeCheckCharacter?: boolean;
  minPartLength?: number;
};

export type AgidPostalVariableHierarchyCodeResult = {
  code: string;
  depth: number;
  regionKinds: AgidPostalRegionUnitKind[];
  components: {
    countryCode: string;
    path: Array<AgidPostalVariableHierarchyPathNode & { normalizedCodePart: string }>;
    checkCharacter: string | null;
  };
};

export type AgidPostalExistenceInput = {
  zoneCount: number;
  alphabetSize?: number;
  codeLength?: number;
};

export type AgidPostalExistenceDecision = {
  mathematicallyConstructible: boolean;
  injectionConditionSatisfied: boolean;
  zoneCount: number;
  alphabetSize: number;
  codeLength: number;
  minimumLength: number;
  capacity: number;
  canUseSingleCountryCode: boolean;
  theoremChecks: {
    finitePartition: boolean;
    sufficientCapacity: boolean;
    injectionExistsAtMinimumLength: boolean;
  };
  rationale: string[];
};

export type AgidPostalPlaneSeparationInput = {
  identifierChanged?: boolean;
  routeChanged?: boolean;
  roadChanged?: boolean;
  depotChanged?: boolean;
  carrierChanged?: boolean;
  routeAssignmentChanged?: boolean;
  postalPartitionChanged?: boolean;
  adminBoundaryChanged?: boolean;
  localitySplitOrMerge?: boolean;
  agidCellMembershipChanged?: boolean;
  postalCodeChanged?: boolean;
  hasBackwardCompatibility?: boolean;
};

export type AgidPostalPlaneSeparationDecision = {
  valid: boolean;
  recommendedChange: 'none' | 'route-plane-only' | 'postal-plane-with-backward-compatibility' | 'review';
  theoremChecks: {
    identifierPlaneStable: boolean;
    routeMutationDoesNotForcePostalMutation: boolean;
    postalMutationRequiresStructuralChange: boolean;
    backwardCompatibilityForPostalMutation: boolean;
  };
  rationale: string[];
};

export type AgidPostalAdaptiveHierarchyRecommendation = {
  countryType: AgidPostalAdaptiveCountryType;
  recommendedPathKinds: AgidPostalRegionUnitKind[];
  variableDepth: number;
  publicPrecisionDefault: 'single-country' | 'regional' | 'locality' | 'delivery-zone' | 'building-group';
  rationale: string[];
};

export type AgidPostalOperationalStatusInput = {
  generated?: boolean;
  classification?: AgidPostalCountryClass;
  governanceApproved?: boolean;
  dataTrusted?: boolean;
  privacySafe?: boolean;
  carrierPilot?: boolean;
  governmentOfficial?: boolean;
  supplementaryToExistingPostal?: boolean;
  publicIssuerAvailable?: boolean;
  backwardCompatibilityReady?: boolean;
};

export type AgidPostalOperationalStatusDecision = {
  status: AgidPostalDesignStatus;
  canPresentAsOfficial: boolean;
  canOperatePublicly: boolean;
  rationale: string[];
};

export type AgidPostalSplitDecisionInput = {
  benefit: number;
  codeCost: number;
  migrationCost: number;
  threshold?: number;
};

export type AgidPostalSplitDecision = {
  shouldSplit: boolean;
  netBenefit: number;
  threshold: number;
  rationale: string[];
};

export type AgidPostalCodeChurnBudgetInput = {
  changedCodeCount: number;
  totalCodeCount: number;
  budgetRate?: number;
  emergencyOverride?: boolean;
};

export type AgidPostalCodeChurnBudgetDecision = {
  withinBudget: boolean;
  churnRate: number;
  budgetRate: number;
  rationale: string[];
};

export type AgidPostalMinimumCodeRegion = {
  regionId: string;
  name?: string;
  addressCount?: number;
  population?: number;
  peakDeliveryDemand?: number;
  businessLoad?: number;
  connectedComponentCount?: number;
  timeCoverCount?: number;
  reserveCode?: boolean;
  largestAtomicAddressCount?: number;
  largestAtomicPopulation?: number;
  largestAtomicPeakDeliveryDemand?: number;
  largestAtomicBusinessLoad?: number;
};

export type AgidPostalMinimumCodePolicy = {
  maxAddressCountPerCode?: number;
  maxPopulationPerCode?: number;
  maxPeakDeliveryDemandPerCode?: number;
  maxBusinessLoadPerCode?: number;
  reserveEmptyRegions?: boolean;
};

export type AgidPostalMinimumRegionDecision = {
  regionId: string;
  name?: string;
  reserveRequirement: number;
  addressLowerBound: number;
  populationLowerBound: number;
  demandLowerBound: number;
  businessLowerBound: number;
  connectedComponentLowerBound: number;
  timeCoverLowerBound: number;
  lowerBound: number;
  requiresAtomicSubdivision: boolean;
  rationale: string[];
};

export type AgidPostalMinimumCodeCountDecision = {
  absoluteMinimum: 1;
  structuralMinimum: number;
  operationalLowerBound: number;
  feasibleWithoutAtomicSubdivision: boolean;
  regions: AgidPostalMinimumRegionDecision[];
  theoremChecks: {
    absoluteMinimumExists: boolean;
    requiredRegionSeparation: boolean;
    capacityPolicyApplied: boolean;
    routeConnectivityApplied: boolean;
  };
  rationale: string[];
};

export type AgidPostalFutureCapacityInput = {
  currentOperationalLowerBound: number;
  futureOperationalLowerBounds?: number[];
  reserveRate?: number;
  alphabetSize?: number;
  includeCheckCharacter?: boolean;
};

export type AgidPostalFutureCapacityDecision = {
  robustFutureMinimum: number;
  reserveRate: number;
  requiredCodeSpace: number;
  alphabetSize: number;
  minimumFixedLength: number;
  displayLength: number;
  rationale: string[];
};

export type AgidPostalHierarchyCapacityLevel = {
  label: string;
  maxChildren: number;
  reserveRate?: number;
};

export type AgidPostalHierarchyCapacityDecision = {
  alphabetSize: number;
  totalDisplayLength: number;
  levels: Array<AgidPostalHierarchyCapacityLevel & {
    requiredCapacity: number;
    minimumLength: number;
  }>;
  formatHint: string;
  rationale: string[];
};

export type AgidPostalVirtualLocalityStatus =
  | 'draft'
  | 'pilot'
  | 'active'
  | 'suspended'
  | 'retired';

export type AgidPostalVirtualLocalityNameMode =
  | 'neutral-number'
  | 'geographic-description'
  | 'community-approved';

export type AgidPostalVirtualLocalityTrigger =
  | 'ambiguity'
  | 'address-count'
  | 'population'
  | 'delivery-demand'
  | 'route-radius'
  | 'route-connectivity'
  | 'time-cover';

export type AgidPostalVirtualLocalityNeedInput = {
  countryCode: string;
  regionId: string;
  administrativeLocalityId?: string | null;
  postalLocalityId?: string | null;
  ambiguityScore?: number;
  ambiguityThreshold?: number;
  addressCount?: number;
  population?: number;
  peakDeliveryDemand?: number;
  routeRadiusMinutes?: number;
  connectedComponentCount?: number;
  timeCoverCount?: number;
  maxAddressCountPerVirtualLocality?: number;
  maxPopulationPerVirtualLocality?: number;
  maxPeakDeliveryDemandPerVirtualLocality?: number;
  maxRouteRadiusMinutes?: number;
  minimumPublicAddressCount?: number;
  authority?: string;
};

export type AgidPostalVirtualLocalityNeedDecision = {
  shouldCreate: boolean;
  lowerBound: number;
  triggers: AgidPostalVirtualLocalityTrigger[];
  publicSafeByAverageAddressCount: boolean;
  dataModel: {
    countryCode: string;
    regionId: string;
    administrativeLocalityId: string | null;
    postalLocalityId: string | null;
    virtualPostalLocalityRequired: boolean;
    synthetic: true;
    legalStatus: 'non_administrative';
    authority: string | null;
  };
  rationale: string[];
};

export type AgidPostalVirtualLocalityCodeInput = {
  countryCode: string;
  parentRegionCode: string | number;
  virtualLocalityCode: string | number;
  deliveryZoneCode?: string | number | null;
  includeCheckCharacter?: boolean;
};

export type AgidPostalVirtualLocalityCodeResult = {
  code: string;
  components: {
    countryCode: string;
    parentRegionCode: string;
    virtualLocalityCode: string;
    deliveryZoneCode: string | null;
    checkCharacter: string | null;
  };
};

export type AgidPostalVirtualLocalityCodeSetInput = {
  count: number;
  codeLength?: number;
  minHammingDistance?: number;
  adjacentPairs?: Array<[number, number]>;
  adjacentMinHammingDistance?: number;
  alphabet?: string;
  seed?: string;
};

export type AgidPostalVirtualLocalityCodeSetDecision = {
  codes: string[];
  codeLength: number;
  requestedCodeLength: number;
  minHammingDistance: number;
  observedMinHammingDistance: number;
  adjacentMinHammingDistance: number;
  adjacencySatisfied: boolean;
  rationale: string[];
};

export type AgidPostalAiQualityDimensionId =
  | 'country-classification'
  | 'template-fit'
  | 'capacity-sufficiency'
  | 'learning-depth'
  | 'governance-readiness'
  | 'privacy-safety'
  | 'data-trust'
  | 'collision-avoidance'
  | 'readability'
  | 'migration-safety';

export type AgidPostalAiQualityGrade =
  | 'excellent'
  | 'good'
  | 'review-required'
  | 'draft-only'
  | 'blocked';

export type AgidPostalAiQualityDimension = {
  id: AgidPostalAiQualityDimensionId;
  label: string;
  score: number;
  weight: number;
  status: 'pass' | 'review' | 'block';
  evidence: string[];
  improvementActions: string[];
};

export type AgidPostalAiQualityReport = {
  systemName: typeof AGID_POSTAL_CREATION_SYSTEM_NAME;
  systemNameJa: typeof AGID_POSTAL_CREATION_SYSTEM_NAME_JA;
  aiName: typeof AGID_POSTAL_CREATION_AI_NAME;
  aiNameJa: typeof AGID_POSTAL_CREATION_AI_NAME_JA;
  aiVersion: typeof AGID_POSTAL_CREATION_AI_VERSION;
  overallScore: number;
  confidence: number;
  grade: AgidPostalAiQualityGrade;
  publishabilityCeiling: AgidPostalPublicationStatus;
  dimensions: AgidPostalAiQualityDimension[];
  hardBlocks: string[];
  nextActions: string[];
  rationale: string[];
};

export type AgidPostalDesignPlan = {
  version: string;
  classification: AgidPostalCountryClassification;
  recommendation: AgidPostalTemplateRecommendation;
  adaptiveHierarchy: AgidPostalAdaptiveHierarchyRecommendation;
  existence: AgidPostalExistenceDecision;
  generationPolicy: AgidPostalGenerationPolicy;
  generated: AgidPostalCodeGenerationResult | null;
  estimate: AgidPostalAreaEstimate;
  reshapePlan: AgidPostalReshapePlan;
  governance: AgidPostalGovernanceDecision;
  privacy: AgidPostalPrivacyDecision;
  dataTrust: AgidPostalDataTrustDecision;
  collisionAvoidance: AgidPostalCollisionDecision | null;
  readability: AgidPostalReadabilityDecision | null;
  publication: AgidPostalPublicationDecision;
  operationalStatus: AgidPostalOperationalStatusDecision;
  countryLearning: AgidPostalCountryDesignLearning;
  qualityReport: AgidPostalAiQualityReport;
  learnedSystems: string[];
  warnings: string[];
};

export type AgidPostalCountryClassificationList = {
  classA: AgidPostalCountryClassification[];
  classB: AgidPostalCountryClassification[];
  classC: AgidPostalCountryClassification[];
  eligible: AgidPostalCountryClassification[];
  blocked: AgidPostalCountryClassification[];
};

const AGID_HASH_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const AGID_BASE_CELL_KM2 = 0.0044 * 0.0044;
const DEFAULT_PEOPLE_PER_POSTAL_AREA = 175;
const DEFAULT_MIN_ADDRESS_ENTITIES_PER_PUBLIC_CODE = 10;
const DEFAULT_MIN_POPULATION_PER_PUBLIC_CODE = 50;
const DEFAULT_GOVERNANCE_THRESHOLD = 0.7;
const DEFAULT_DATA_TRUST_THRESHOLD = 0.7;
const MIN_GENERATED_POSTAL_CODE_LENGTH = 3;
const MAX_GENERATED_POSTAL_CODE_LENGTH = 8;

const GOVERNANCE_WEIGHTS = {
  government: 0.4,
  municipality: 0.25,
  carrier: 0.25,
  platform: 0.1,
} as const;

const DATA_TRUST_WEIGHTS = {
  address: 0.25,
  road: 0.15,
  admin: 0.25,
  population: 0.15,
  boundary: 0.2,
} as const;

export const AGID_POSTAL_TARGET_COUNTRIES: AgidPostalTargetCountry[] = [
  { code: 'AO', name: 'Angola', region: 'Africa', lat: -11.2027, lng: 17.8739, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'AG', name: 'Antigua and Barbuda', region: 'Americas', lat: 17.0608, lng: -61.7964, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Small island state; AGID postal areas should be coarse and island-aware.' },
  { code: 'AW', name: 'Aruba', region: 'Americas', lat: 12.5211, lng: -69.9683, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'BS', name: 'Bahamas', region: 'Americas', lat: 25.0343, lng: -77.3963, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Archipelago; use island-first hierarchy.' },
  { code: 'BZ', name: 'Belize', region: 'Americas', lat: 17.1899, lng: -88.4976, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'BJ', name: 'Benin', region: 'Africa', lat: 9.3077, lng: 2.3158, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'BO', name: 'Bolivia', region: 'Americas', lat: -16.2902, lng: -63.5887, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Mountain/lowland split; use terrain-aware hierarchy.' },
  { code: 'BW', name: 'Botswana', region: 'Africa', lat: -22.3285, lng: 24.6849, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Sparse/desert conditions; keep large rural areas coarse.' },
  { code: 'BF', name: 'Burkina Faso', region: 'Africa', lat: 12.2383, lng: -1.5616, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'BI', name: 'Burundi', region: 'Africa', lat: -3.3731, lng: 29.9189, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'CM', name: 'Cameroon', region: 'Africa', lat: 7.3697, lng: 12.3547, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'CF', name: 'Central African Republic', region: 'Africa', lat: 6.6111, lng: 20.9394, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Sparse routing; use AGID only as a supplemental postal area, not a legal address.' },
  { code: 'TD', name: 'Chad', region: 'Africa', lat: 15.4542, lng: 18.7322, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Desert and nomadic context; keep precision configurable.' },
  { code: 'KM', name: 'Comoros', region: 'Africa', lat: -11.6455, lng: 43.3333, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Island-first hierarchy recommended.' },
  { code: 'CG', name: 'Congo (Republic)', region: 'Africa', lat: -0.228, lng: 15.8277, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'CK', name: 'Cook Islands', region: 'Oceania', lat: -21.2367, lng: -159.7777, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Dispersed islands; island-first hierarchy recommended.' },
  { code: 'CI', name: "Cote d'Ivoire", region: 'Africa', lat: 7.54, lng: -5.5471, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'CW', name: 'Curacao', region: 'Americas', lat: 12.1696, lng: -68.99, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Small island territory; compact code recommended.' },
  { code: 'DM', name: 'Dominica', region: 'Americas', lat: 15.415, lng: -61.371, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Mountain island; municipality-first hierarchy recommended.' },
  { code: 'GQ', name: 'Equatorial Guinea', region: 'Africa', lat: 1.6508, lng: 10.2679, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Island/mainland split; use regional prefix.' },
  { code: 'ER', name: 'Eritrea', region: 'Africa', lat: 15.1794, lng: 39.7823, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'FJ', name: 'Fiji', region: 'Oceania', lat: -17.7134, lng: 178.065, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Archipelago; island-first hierarchy recommended.' },
  { code: 'GA', name: 'Gabon', region: 'Africa', lat: -0.8037, lng: 11.6094, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'GM', name: 'Gambia', region: 'Africa', lat: 13.4432, lng: -15.3101, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Narrow river country; route corridor hierarchy recommended.' },
  { code: 'GD', name: 'Grenada', region: 'Americas', lat: 12.1165, lng: -61.679, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Island-first hierarchy recommended.' },
  { code: 'JM', name: 'Jamaica', region: 'Americas', lat: 18.1096, lng: -77.2975, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Some zones exist; AGID should remain supplemental and non-replacement.' },
  { code: 'KP', name: "Korea (Democratic People's Republic)", region: 'Asia', lat: 40.3399, lng: 127.5101, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Treat as constrained/high-risk metadata; do not claim operational completeness.' },
  { code: 'LY', name: 'Libya', region: 'Africa', lat: 26.3351, lng: 17.2283, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Desert and conflict-sensitive context; coarse AGID postal areas recommended.' },
  { code: 'ML', name: 'Mali', region: 'Africa', lat: 17.5707, lng: -3.9962, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal metadata may exist but UPU-required status is weak; supplemental AGID allowed.' },
  { code: 'MR', name: 'Mauritania', region: 'Africa', lat: 21.0079, lng: -10.9408, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Desert/sparse conditions; area codes should be coarse.' },
  { code: 'QA', name: 'Qatar', region: 'Asia', lat: 25.3548, lng: 51.1839, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Use as supplemental to building-zone-street addressing.' },
  { code: 'RW', name: 'Rwanda', region: 'Africa', lat: -1.9403, lng: 29.8739, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Dense and hilly; compact hierarchical format recommended.' },
  { code: 'ST', name: 'Sao Tome and Principe', region: 'Africa', lat: 0.1864, lng: 6.6131, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Island-first hierarchy recommended.' },
  { code: 'SC', name: 'Seychelles', region: 'Africa', lat: -4.6796, lng: 55.492, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Island-first hierarchy recommended.' },
  { code: 'SL', name: 'Sierra Leone', region: 'Africa', lat: 8.4606, lng: -11.7799, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'SX', name: 'Sint Maarten', region: 'Americas', lat: 18.0425, lng: -63.0548, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Small island territory; use compact local hierarchy.' },
  { code: 'SB', name: 'Solomon Islands', region: 'Oceania', lat: -9.6457, lng: 160.1562, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Dispersed archipelago; island-first hierarchy recommended.' },
  { code: 'SO', name: 'Somalia', region: 'Africa', lat: 5.1521, lng: 46.1996, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'An observed optional AA plus five-digit shape does not establish nationwide assignment or geometry. Keep AGID independent and do not expose precise conflict-sensitive cells by default.' },
  { code: 'SS', name: 'South Sudan', region: 'Africa', lat: 6.877, lng: 31.307, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Sparse and humanitarian context; high-risk defaults recommended.' },
  { code: 'SR', name: 'Suriname', region: 'Americas', lat: 3.9193, lng: -56.0278, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Coastal/interior split; route-aware hierarchy recommended.' },
  { code: 'SY', name: 'Syria', region: 'Asia', lat: 34.8021, lng: 38.9968, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Conflict-sensitive context; keep precision and publication constrained.' },
  { code: 'TG', name: 'Togo', region: 'Africa', lat: 8.6195, lng: 0.8248, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
  { code: 'TK', name: 'Tokelau', region: 'Oceania', lat: -9.2, lng: -171.8484, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Atoll territory; compact island hierarchy recommended.' },
  { code: 'TO', name: 'Tonga', region: 'Oceania', lat: -21.179, lng: -175.1982, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Archipelago; island-first hierarchy recommended.' },
  { code: 'TV', name: 'Tuvalu', region: 'Oceania', lat: -7.1095, lng: 177.6493, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Atoll/island hierarchy recommended.' },
  { code: 'AE', name: 'United Arab Emirates', region: 'Asia', lat: 23.4241, lng: 53.8478, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Supplement national addressing without replacing PO box/building systems.' },
  { code: 'VU', name: 'Vanuatu', region: 'Oceania', lat: -15.3767, lng: 166.9592, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Dispersed islands; island-first hierarchy recommended.' },
  { code: 'YE', name: 'Yemen', region: 'Asia', lat: 15.5527, lng: 48.5164, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'High-risk/conflict-sensitive context; coarse and revocable sharing recommended.' },
  { code: 'ZW', name: 'Zimbabwe', region: 'Africa', lat: -19.0154, lng: 29.1549, classHint: 'C', basis: 'upu-postal-code-not-required-2025-user-supplied', note: 'Postal code not required in the supplied UPU 2025 list.' },
];

export const AGID_POSTAL_TEMPLATES: Record<AgidPostalTemplateId, AgidPostalTemplate> = {
  'japan-like': {
    id: 'japan-like',
    label: 'Japan-like hierarchy',
    basedOn: 'Japan NNN-NNNN',
    format: 'CC-NNN-NNNN',
    bestFor: ['dense cities', 'municipal hierarchy', 'block-level expansion'],
    description: 'Country prefix plus 3+4 numeric hierarchy. Good for dense settlement networks and later subdivision.',
    hierarchyDepth: 3,
    defaultLength: 7,
  },
  'us-like': {
    id: 'us-like',
    label: 'US-like ZIP',
    basedOn: 'United States NNNNN / ZIP+4',
    format: 'CC-NNNNN',
    bestFor: ['large territory', 'route sorting', 'later extension'],
    description: 'Country prefix plus five numeric digits. Can later extend with plus-four style suffixes.',
    hierarchyDepth: 2,
    defaultLength: 5,
  },
  'india-like': {
    id: 'india-like',
    label: 'India-like PIN',
    basedOn: 'India NNNNNN',
    format: 'CC-NNNNNN',
    bestFor: ['large population', 'many regions', 'simple numeric entry'],
    description: 'Country prefix plus six numeric digits. Good for high population and multilingual input.',
    hierarchyDepth: 3,
    defaultLength: 6,
  },
  'france-like': {
    id: 'france-like',
    label: 'France-like department',
    basedOn: 'France NNNNN',
    format: 'CC-NN NNN',
    bestFor: ['administrative departments', 'stable municipalities'],
    description: 'First two digits act as a broad administrative area, with three local digits below.',
    hierarchyDepth: 2,
    defaultLength: 5,
  },
  'uk-like': {
    id: 'uk-like',
    label: 'UK-like outward/inward',
    basedOn: 'United Kingdom outward + inward',
    format: 'CC-AN NAA',
    bestFor: ['dense cities', 'human-readable sorting', 'short local districts'],
    description: 'Alphanumeric outward/inward-style code with high capacity and visible hierarchy.',
    hierarchyDepth: 3,
    defaultLength: 5,
  },
  'singapore-like': {
    id: 'singapore-like',
    label: 'Singapore-like building dense',
    basedOn: 'Singapore NNNNNN',
    format: 'CC-NNNNNN',
    bestFor: ['compact dense urban states', 'building-level routing'],
    description: 'Six numeric digits for compact, highly urban countries or small territories.',
    hierarchyDepth: 2,
    defaultLength: 6,
  },
  'ghana-like': {
    id: 'ghana-like',
    label: 'Ghana-like digital address',
    basedOn: 'Ghana Post GPS',
    format: 'CC-AA-NNN-NNNN',
    bestFor: ['digital address adoption', 'public map/grid linkage'],
    description: 'Country prefix, AGID-derived area letters, and numeric local grid. Best when public digital address UX is acceptable.',
    hierarchyDepth: 4,
    defaultLength: 7,
  },
  'agid-native': {
    id: 'agid-native',
    label: 'AGID-native auxiliary',
    basedOn: 'AGID hash',
    format: 'CC-AAAA-NNN',
    bestFor: ['low-data regions', 'offline-first operation', 'future reshaping'],
    description: 'Keeps visible code close to AGID hash structure while hiding the full AGID.',
    hierarchyDepth: 2,
    defaultLength: 7,
  },
};

const targetCountryByCode = new Map(AGID_POSTAL_TARGET_COUNTRIES.map(country => [country.code, country]));

function clamp01(value: unknown, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(1, numeric));
}

function normalizeCountryCode(countryCode: string) {
  return String(countryCode || '').trim().toUpperCase();
}

function normalizeAgid(agid: string) {
  return String(agid || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function effectivePostalCodeLength(requestedLength: number | undefined, template: AgidPostalTemplate) {
  return Math.max(
    MIN_GENERATED_POSTAL_CODE_LENGTH,
    Math.min(MAX_GENERATED_POSTAL_CODE_LENGTH, requestedLength || template.defaultLength),
  );
}

function hashToBigInt(hash: string) {
  let value = 0n;
  for (const char of hash.toUpperCase()) {
    const index = AGID_HASH_ALPHABET.indexOf(char);
    value = value * BigInt(AGID_HASH_ALPHABET.length) + BigInt(Math.max(0, index));
  }
  return value;
}

function digitsFromHash(hash: string, length: number) {
  const modulus = 10n ** BigInt(length);
  return (hashToBigInt(hash) % modulus).toString().padStart(length, '0');
}

function lettersFromHash(hash: string, length: number) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let value = hashToBigInt(hash);
  let output = '';
  for (let i = 0; i < length; i += 1) {
    output += letters[Number(value % BigInt(letters.length))];
    value /= BigInt(letters.length);
  }
  return output;
}

function stableAuditToken(value: string, length = 10) {
  let hash = 1469598103934665603n;
  const prime = 1099511628211n;
  const mask = (1n << 64n) - 1n;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= BigInt(value.charCodeAt(i));
    hash = (hash * prime) & mask;
  }
  let output = '';
  let cursor = hash;
  for (let i = 0; i < length; i += 1) {
    output += AGID_HASH_ALPHABET[Number(cursor % BigInt(AGID_HASH_ALPHABET.length))];
    cursor /= BigInt(AGID_HASH_ALPHABET.length);
  }
  return output;
}

function agidCountryRejection(countryCode: string, agid: string) {
  const normalized = normalizeAgid(agid);
  if (!normalized) return { normalized, reason: 'empty-agid' };
  if (!normalized.startsWith(countryCode)) return { normalized, reason: 'agid-prefix-crosses-country-boundary' };
  if (!decodeAGID(normalized)) return { normalized, reason: 'invalid-agid-format' };
  return null;
}

function addUniqueAgid(target: Set<string>, rejected: AgidPostalZoneEditRecord['rejectedAgids'], countryCode: string, agid: string) {
  const rejection = agidCountryRejection(countryCode, agid);
  if (rejection) {
    if (rejection.normalized) rejected.push({ agid: rejection.normalized, reason: rejection.reason });
    return null;
  }
  const normalized = normalizeAgid(agid);
  target.add(normalized);
  return normalized;
}

function buildZoneRevisionId(input: {
  countryCode: string;
  postalCode: string;
  integratedAgids: string[];
  editedAgids: AgidPostalEditedAgid[];
  excludedAgids: string[];
}) {
  const body = [
    input.countryCode,
    input.postalCode,
    input.integratedAgids.join(','),
    input.excludedAgids.join(','),
    input.editedAgids.map(edit => `${edit.operation}:${edit.originalAgid}:${edit.editedAgid}`).join(','),
  ].join('|');
  return `${input.countryCode}-${stableAuditToken(body)}`;
}

export function createAgidPostalZoneEditRecord(input: AgidPostalZoneEditRecordInput): AgidPostalZoneEditRecord {
  const countryCode = normalizeCountryCode(input.countryCode);
  const now = input.now || new Date().toISOString();
  const integrated = new Set<string>();
  const excluded = new Set<string>();
  const rejectedAgids: AgidPostalZoneEditRecord['rejectedAgids'] = [];
  const warnings: string[] = [];

  for (const agid of input.integratedAgids || []) {
    addUniqueAgid(integrated, rejectedAgids, countryCode, agid);
  }

  const editedAgids: AgidPostalEditedAgid[] = (input.editedAgids || []).flatMap(edit => {
    const originalRejected = agidCountryRejection(countryCode, edit.originalAgid);
    const editedValue = edit.editedAgid || edit.originalAgid;
    const editedRejected = agidCountryRejection(countryCode, editedValue);
    if (originalRejected || editedRejected) {
      if (originalRejected?.normalized) rejectedAgids.push({ agid: originalRejected.normalized, reason: originalRejected.reason });
      if (editedRejected?.normalized && editedRejected.normalized !== originalRejected?.normalized) {
        rejectedAgids.push({ agid: editedRejected.normalized, reason: editedRejected.reason });
      }
      return [];
    }

    const operation = edit.operation || (input.source.kind === 'gis-import' ? 'gis-import' : input.source.kind.startsWith('adobe') ? 'adobe-import' : 'reshape');
    const normalizedOriginal = normalizeAgid(edit.originalAgid);
    const normalizedEdited = normalizeAgid(editedValue);
    const record: AgidPostalEditedAgid = {
      originalAgid: normalizedOriginal,
      editedAgid: normalizedEdited,
      operation,
      sourceKind: edit.sourceKind || input.source.kind,
      timestamp: edit.timestamp || now,
      note: edit.note,
      pressureSamples: edit.pressureSamples,
    };

    if (operation === 'exclude') {
      excluded.add(normalizedEdited);
      integrated.delete(normalizedEdited);
    } else {
      integrated.add(normalizedEdited);
    }
    return [record];
  });

  for (const agid of input.excludedAgids || []) {
    const normalized = addUniqueAgid(excluded, rejectedAgids, countryCode, agid);
    if (normalized) integrated.delete(normalized);
  }

  for (const agid of excluded) {
    integrated.delete(agid);
  }

  if (!countryCode) warnings.push('missing-country-code');
  if (!input.postalCode) warnings.push('missing-postal-code');
  if (rejectedAgids.length > 0) warnings.push('some-agids-rejected-by-country-or-format-guard');
  if (integrated.size === 0) warnings.push('no-integrated-agids-recorded');
  if (input.source.kind === 'pen-tablet' || input.source.kind === 'display-tablet') {
    warnings.push('tablet-strokes-record-zone-membership-not-raw-private-addresses');
  }
  if (input.source.kind.startsWith('adobe') && !input.source.artifactHash) {
    warnings.push('adobe-artifact-hash-recommended-for-audit');
  }

  const integratedAgids = [...integrated].sort();
  const excludedAgids = [...excluded].sort();
  const revisionId = buildZoneRevisionId({
    countryCode,
    postalCode: input.postalCode,
    integratedAgids,
    editedAgids,
    excludedAgids,
  });

  return {
    id: `zone-edit-${revisionId}`,
    countryCode,
    postalCode: input.postalCode,
    displayCode: input.displayCode,
    source: input.source,
    integratedAgids,
    editedAgids,
    excludedAgids,
    rejectedAgids,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    revisionId,
    warnings,
  };
}

export function updateAgidPostalZoneEditRecord(
  record: AgidPostalZoneEditRecord,
  patch: Omit<AgidPostalZoneEditRecordInput, 'countryCode' | 'postalCode' | 'source'> & {
    source?: AgidPostalZoneEditSource;
    now?: string;
  },
): AgidPostalZoneEditRecord {
  const next = createAgidPostalZoneEditRecord({
    countryCode: record.countryCode,
    postalCode: record.postalCode,
    displayCode: patch.displayCode || record.displayCode,
    source: patch.source || record.source,
    integratedAgids: [
      ...record.integratedAgids,
      ...(patch.integratedAgids || []),
    ],
    editedAgids: [
      ...record.editedAgids,
      ...(patch.editedAgids || []),
    ],
    excludedAgids: [
      ...record.excludedAgids,
      ...(patch.excludedAgids || []),
    ],
    now: patch.now,
  });
  return {
    ...next,
    id: record.id,
    createdAt: record.createdAt,
    revision: record.revision + 1,
  };
}

export function summarizeAgidPostalZoneEditRecord(record: AgidPostalZoneEditRecord): AgidPostalZoneEditSummary {
  const auditRationale = [
    `Postal code ${record.postalCode} is composed from ${record.integratedAgids.length} integrated AGID cells.`,
    `The latest revision is ${record.revisionId}.`,
  ];
  if (record.editedAgids.length > 0) {
    auditRationale.push(`${record.editedAgids.length} edited AGID entries are retained with source and operation metadata.`);
  }
  if (record.rejectedAgids.length > 0) {
    auditRationale.push(`${record.rejectedAgids.length} AGID entries were rejected by country or format guards.`);
  }
  return {
    countryCode: record.countryCode,
    postalCode: record.postalCode,
    integratedCount: record.integratedAgids.length,
    editedCount: record.editedAgids.length,
    excludedCount: record.excludedAgids.length,
    rejectedCount: record.rejectedAgids.length,
    sourceKind: record.source.kind,
    revisionId: record.revisionId,
    auditRationale,
  };
}

function normalizeHierarchyCodePart(value: string | number, length = 2) {
  const text = String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!text) return '0'.repeat(length);
  if (/^\d+$/.test(text)) return text.padStart(length, '0').slice(-Math.max(length, text.length));
  return text.slice(0, Math.max(length, text.length));
}

function normalizeLocalityId(value: string) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9:._/-]+/g, '-').replace(/^-+|-+$/g, '');
}

function normalizePostalCodeValue(value: string) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function codeCarriesLocalityComponent(postalCode: string, localityCode: string) {
  const parts = postalCode.split('-').map(part => part.trim().toUpperCase());
  return parts.includes(localityCode.toUpperCase());
}

export function buildAgidPostalHierarchicalCode(input: AgidPostalHierarchicalCodeInput): AgidPostalHierarchicalCodeResult {
  const countryCode = normalizeCountryCode(input.countryCode);
  const islandCode = normalizeHierarchyCodePart(input.islandCode, 2);
  const localityCode = normalizeHierarchyCodePart(input.localityCode, 2);
  const deliveryZoneCode = normalizeHierarchyCodePart(input.deliveryZoneCode, 2);
  const base = `${countryCode}-${islandCode}-${localityCode}-${deliveryZoneCode}`;
  const checkCharacter = input.includeCheckCharacter ? stableAuditToken(base, 1) : null;

  return {
    code: checkCharacter ? `${base}-${checkCharacter}` : base,
    components: {
      countryCode,
      islandCode,
      localityCode,
      deliveryZoneCode,
      checkCharacter,
    },
  };
}

export function evaluateAgidPostalLocalitySeparation(
  records: AgidPostalLocalityRecord[],
  mode: AgidPostalLocalitySeparationMode = 'locality-prefix-separation',
): AgidPostalLocalitySeparationDecision {
  const collisions: AgidPostalLocalitySeparationDecision['collisions'] = [];
  const localityCodeOwners = new Map<string, string>();
  const postalCodeOwners = new Map<string, string>();
  const localityStableCodes = new Map<string, string>();

  for (const record of records) {
    const countryCode = normalizeCountryCode(record.countryCode);
    const islandCode = normalizeHierarchyCodePart(record.islandCode, 2);
    const localityId = normalizeLocalityId(record.localityId);
    const localityCode = normalizeHierarchyCodePart(record.localityCode, 2);
    const localityKey = `${countryCode}:${islandCode}:${localityId}`;
    const localityCodeKey = `${countryCode}:${islandCode}:${localityCode}`;

    const previousLocalityId = normalizeLocalityId(record.previousLocalityId || record.localityId);
    const previousLocalityCode = record.previousLocalityCode
      ? normalizeHierarchyCodePart(record.previousLocalityCode, 2)
      : localityCode;
    const nameChanged = Boolean(record.previousName && record.previousName !== record.currentName);
    if (nameChanged && previousLocalityId === localityId && previousLocalityCode !== localityCode) {
      collisions.push({
        kind: 'rename-code-change',
        localityIds: [localityId],
        value: `${previousLocalityCode}->${localityCode}`,
      });
    }

    const stableCode = localityStableCodes.get(localityKey);
    if (stableCode && stableCode !== localityCode) {
      collisions.push({
        kind: 'rename-code-change',
        localityIds: [localityId],
        value: `${stableCode}->${localityCode}`,
      });
    }
    localityStableCodes.set(localityKey, localityCode);

    const codeOwner = localityCodeOwners.get(localityCodeKey);
    if (codeOwner && codeOwner !== localityId) {
      collisions.push({
        kind: 'locality-code',
        localityIds: [codeOwner, localityId],
        value: localityCode,
      });
    }
    localityCodeOwners.set(localityCodeKey, localityId);

    for (const postalCode of record.postalCodes.map(normalizePostalCodeValue).filter(Boolean)) {
      const postalKey = `${countryCode}:${islandCode}:${postalCode}`;
      const postalOwner = postalCodeOwners.get(postalKey);
      if (postalOwner && postalOwner !== localityId) {
        collisions.push({
          kind: 'postal-code',
          localityIds: [postalOwner, localityId],
          value: postalCode,
        });
      }
      postalCodeOwners.set(postalKey, localityId);
    }
  }

  const localityCodeInjective = !collisions.some(collision => collision.kind === 'locality-code');
  const postalSetsDisjoint = !collisions.some(collision => collision.kind === 'postal-code');
  const renameInvariant = !collisions.some(collision => collision.kind === 'rename-code-change');
  const hierarchyRefinementPreservesSeparation = records.every(record => {
    const localityCode = normalizeHierarchyCodePart(record.localityCode, 2);
    return record.postalCodes.length === 0 || record.postalCodes.every(code => codeCarriesLocalityComponent(normalizePostalCodeValue(code), localityCode));
  });
  const localitySeparation = localityCodeInjective && (mode === 'delivery-priority' || postalSetsDisjoint);
  const separated = localitySeparation && renameInvariant;
  const rationale: string[] = [];

  if (localityCodeInjective) {
    rationale.push('Different LocalityID values use distinct locality code components within each country-island scope.');
  } else {
    rationale.push('At least two different LocalityID values share the same locality code component.');
  }
  if (postalSetsDisjoint) {
    rationale.push('Postal code sets are disjoint for different LocalityID values.');
  } else if (mode === 'delivery-priority') {
    rationale.push('Postal code sharing was detected but is tolerated in delivery-priority mode; display must still retain LocalityID.');
  } else {
    rationale.push('Postal code sharing was detected across different LocalityID values.');
  }
  if (renameInvariant) {
    rationale.push('Name changes preserve LocalityID and locality code components.');
  } else {
    rationale.push('A name change attempted to change the locality code while preserving LocalityID.');
  }
  if (hierarchyRefinementPreservesSeparation) {
    rationale.push('Child delivery zones carry the parent locality code component.');
  } else {
    rationale.push('Some child delivery zones do not visibly carry the parent locality code component.');
  }

  return {
    mode,
    localityCodeInjective,
    postalSetsDisjoint,
    renameInvariant,
    separated,
    collisions,
    theoremChecks: {
      localitySeparation,
      renamingInvariance: renameInvariant,
      hierarchyRefinementPreservesSeparation,
    },
    rationale,
  };
}

export function evaluateAgidPostalExistenceCondition(
  input: AgidPostalExistenceInput,
): AgidPostalExistenceDecision {
  const zoneCount = Math.max(0, Math.floor(input.zoneCount));
  const alphabetSize = Math.max(0, Math.floor(input.alphabetSize || AGID_HASH_ALPHABET.length));
  const finitePartition = zoneCount >= 1;
  const usableAlphabet = alphabetSize >= 2;
  const minimumLength = finitePartition && usableAlphabet
    ? Math.max(1, Math.ceil(Math.log(zoneCount) / Math.log(alphabetSize)))
    : 0;
  const codeLength = Math.max(0, Math.floor(input.codeLength ?? minimumLength));
  const capacity = usableAlphabet && codeLength > 0 ? alphabetSize ** codeLength : 0;
  const injectionConditionSatisfied = finitePartition && capacity >= zoneCount;
  const mathematicallyConstructible = finitePartition && usableAlphabet;
  const injectionExistsAtMinimumLength = mathematicallyConstructible && (alphabetSize ** minimumLength) >= zoneCount;
  const rationale = [
    `zone-count:${zoneCount}`,
    `alphabet-size:${alphabetSize}`,
    `code-length:${codeLength}`,
    `capacity:${Number.isFinite(capacity) ? capacity : 'overflow'}`,
  ];

  if (zoneCount === 1) {
    rationale.push('single-country-zone-is-a-valid-minimum-postal-partition');
  }
  if (injectionConditionSatisfied) {
    rationale.push('capacity-condition-|sigma|^L>=m-satisfied');
  } else {
    rationale.push('provided-code-length-does-not-have-enough-capacity');
  }
  if (mathematicallyConstructible) {
    rationale.push(`minimum-length-for-injection:${minimumLength}`);
  } else {
    rationale.push('finite-positive-partition-and-alphabet-size>=2-required');
  }

  return {
    mathematicallyConstructible,
    injectionConditionSatisfied,
    zoneCount,
    alphabetSize,
    codeLength,
    minimumLength,
    capacity,
    canUseSingleCountryCode: zoneCount === 1,
    theoremChecks: {
      finitePartition,
      sufficientCapacity: injectionConditionSatisfied,
      injectionExistsAtMinimumLength,
    },
    rationale,
  };
}

export function buildAgidPostalVariableHierarchyCode(
  input: AgidPostalVariableHierarchyCodeInput,
): AgidPostalVariableHierarchyCodeResult {
  const countryCode = normalizeCountryCode(input.countryCode);
  const minPartLength = Math.max(1, Math.round(input.minPartLength || 2));
  const path = input.path.map(node => ({
    ...node,
    normalizedCodePart: normalizeHierarchyCodePart(node.codePart, minPartLength),
  }));
  const base = [countryCode, ...path.map(node => node.normalizedCodePart)].join('-');
  const checkCharacter = input.includeCheckCharacter ? stableAuditToken(base, 1) : null;

  return {
    code: checkCharacter ? `${base}-${checkCharacter}` : base,
    depth: path.length + 1,
    regionKinds: path.map(node => node.kind),
    components: {
      countryCode,
      path,
      checkCharacter,
    },
  };
}

export function evaluateAgidPostalPlaneSeparation(
  input: AgidPostalPlaneSeparationInput,
): AgidPostalPlaneSeparationDecision {
  const routeMutation = Boolean(
    input.routeChanged
    || input.roadChanged
    || input.depotChanged
    || input.carrierChanged
    || input.routeAssignmentChanged,
  );
  const structuralMutation = Boolean(
    input.postalPartitionChanged
    || input.adminBoundaryChanged
    || input.localitySplitOrMerge
    || input.agidCellMembershipChanged,
  );
  const identifierPlaneStable = !input.identifierChanged;
  const routeMutationDoesNotForcePostalMutation = !(routeMutation && !structuralMutation && input.postalCodeChanged);
  const postalMutationRequiresStructuralChange = !input.postalCodeChanged || structuralMutation;
  const backwardCompatibilityForPostalMutation = !input.postalCodeChanged || Boolean(input.hasBackwardCompatibility);
  const theoremChecks = {
    identifierPlaneStable,
    routeMutationDoesNotForcePostalMutation,
    postalMutationRequiresStructuralChange,
    backwardCompatibilityForPostalMutation,
  };
  let recommendedChange: AgidPostalPlaneSeparationDecision['recommendedChange'] = 'none';
  const rationale: string[] = [];

  if (!identifierPlaneStable) {
    recommendedChange = 'review';
    rationale.push('identifier-plane-changed-agid-or-persistent-entity-key-should-remain-stable');
  }

  if (routeMutation && !structuralMutation) {
    recommendedChange = recommendedChange === 'review' ? 'review' : 'route-plane-only';
    rationale.push('road-depot-carrier-or-route-change-should-update-Route_t-without-changing-postal-code');
  }

  if (structuralMutation) {
    recommendedChange = recommendedChange === 'review' ? 'review' : 'postal-plane-with-backward-compatibility';
    rationale.push('structural-boundary-or-locality-change-may-update-Postal_t-if-aliases-are-kept');
  }

  if (input.postalCodeChanged && !structuralMutation) {
    recommendedChange = 'review';
    rationale.push('postal-code-changed-without-structural-partition-change');
  }

  if (input.postalCodeChanged && !input.hasBackwardCompatibility) {
    rationale.push('postal-code-change-needs-old-to-new-backward-compatible-mapping');
  }

  if (!routeMutation && !structuralMutation && !input.postalCodeChanged && identifierPlaneStable) {
    rationale.push('no-plane-mutation-detected');
  }

  const valid = Object.values(theoremChecks).every(Boolean);

  return {
    valid,
    recommendedChange,
    theoremChecks,
    rationale,
  };
}

export function recommendAgidPostalAdaptiveHierarchy(
  profile: AgidPostalCountryProfile,
  overrideCountryType?: AgidPostalAdaptiveCountryType,
): AgidPostalAdaptiveHierarchyRecommendation {
  const text = sourceText(profile);
  const terrain = inferTerrain(profile);
  const area = profile.areaKm2 || 0;
  const population = profile.population || 0;
  const density = area > 0 && population > 0 ? population / area : 0;
  let countryType: AgidPostalAdaptiveCountryType = overrideCountryType || 'mixed';

  if (!overrideCountryType) {
    if (/no[- ]street|streetless|landmark-only|no street/.test(text)) {
      countryType = 'no-street-name';
    } else if (/weak-address|generated-settlement|low-data|coarse-address/.test(text)) {
      countryType = 'weak-address-data';
    } else if (/route[- ]corridor|corridor hierarchy|narrow river|river corridor/.test(text)) {
      countryType = 'route-corridor';
    } else if (/delta|river|watershed|basin/.test(text)) {
      countryType = 'river-delta';
    } else if (/exclave|enclave|connected component|non-contiguous/.test(text)) {
      countryType = 'enclave';
    } else if (/high[- ]rise|tower|vertical|building-group/.test(text)) {
      countryType = 'high-rise-city';
    } else if (terrain === 'archipelago') {
      countryType = 'archipelago';
    } else if (terrain === 'desert') {
      countryType = 'desert';
    } else if (terrain === 'mountain') {
      countryType = 'mountain';
    } else if (area > 0 && area < 1000 && population > 0 && density > 500) {
      countryType = 'small-state';
    } else if (area > 250000 || population > 30000000) {
      countryType = 'continental';
    }
  }

  const hierarchyByType: Record<AgidPostalAdaptiveCountryType, {
    path: AgidPostalRegionUnitKind[];
    precision: AgidPostalAdaptiveHierarchyRecommendation['publicPrecisionDefault'];
  }> = {
    'small-state': { path: ['country', 'admin-district', 'block'], precision: 'regional' },
    archipelago: { path: ['country', 'island', 'locality', 'delivery-zone'], precision: 'locality' },
    continental: { path: ['country', 'province', 'locality', 'delivery-zone'], precision: 'regional' },
    mountain: { path: ['country', 'region', 'valley', 'settlement'], precision: 'locality' },
    desert: { path: ['country', 'region', 'corridor', 'oasis', 'settlement'], precision: 'regional' },
    'route-corridor': { path: ['country', 'region', 'corridor', 'locality', 'delivery-zone'], precision: 'regional' },
    'river-delta': { path: ['country', 'watershed', 'delta', 'locality'], precision: 'locality' },
    'weak-address-data': { path: ['country', 'admin-district', 'generated-settlement-cluster', 'delivery-zone'], precision: 'regional' },
    'no-street-name': { path: ['country', 'geographic-cell', 'settlement', 'landmark'], precision: 'locality' },
    enclave: { path: ['country', 'connected-region', 'locality', 'delivery-zone'], precision: 'regional' },
    'high-rise-city': { path: ['country', 'city-district', 'block', 'building-group'], precision: 'building-group' },
    mixed: { path: ['country', 'region', 'locality', 'delivery-zone'], precision: 'regional' },
  };
  const selected = hierarchyByType[countryType];

  return {
    countryType,
    recommendedPathKinds: selected.path,
    variableDepth: selected.path.length,
    publicPrecisionDefault: selected.precision,
    rationale: [
      `terrain:${terrain}`,
      `country-type:${countryType}`,
      `variable-depth:${selected.path.length}`,
      'island-is-treated-as-one-region-unit-kind-not-a-global-exception',
      selected.precision === 'building-group'
        ? 'public-precision-must-be-reviewed-for-privacy-before-building-group-output'
        : `default-public-precision:${selected.precision}`,
    ],
  };
}

export function decideAgidPostalOperationalStatus(
  input: AgidPostalOperationalStatusInput,
): AgidPostalOperationalStatusDecision {
  const generated = Boolean(input.generated);
  const governanceApproved = Boolean(input.governanceApproved);
  const dataTrusted = Boolean(input.dataTrusted);
  const privacySafe = Boolean(input.privacySafe);
  const publicIssuerAvailable = Boolean(input.publicIssuerAvailable);
  const backwardCompatibilityReady = Boolean(input.backwardCompatibilityReady);
  const rationale: string[] = [];
  let status: AgidPostalDesignStatus = 'simulation';

  if (!generated) {
    rationale.push('simulation-only-no-zone-code-generated');
  } else if (
    input.governmentOfficial
    && governanceApproved
    && dataTrusted
    && privacySafe
    && publicIssuerAvailable
    && backwardCompatibilityReady
  ) {
    status = 'official';
    rationale.push('official-all-governance-data-privacy-issuer-and-backward-compatibility-conditions-satisfied');
  } else if ((input.supplementaryToExistingPostal || input.classification === 'B') && dataTrusted && privacySafe) {
    status = 'supplementary';
    rationale.push('supplementary-existing-postal-system-remains-primary');
  } else if (input.carrierPilot && dataTrusted && privacySafe) {
    status = 'pilot';
    rationale.push('pilot-limited-carrier-or-region-operation');
  } else {
    status = 'draft';
    rationale.push('draft-not-yet-public-official-or-carrier-pilot-ready');
  }

  if (!governanceApproved) rationale.push('governance-approval-missing-or-below-threshold');
  if (!dataTrusted) rationale.push('data-trust-missing-or-below-threshold');
  if (!privacySafe) rationale.push('privacy-publication-condition-not-satisfied');
  if (status === 'official' && input.classification === 'A') {
    rationale.push('classification-a-official-status-must-not-replace-existing-mature-postal-system');
  }

  return {
    status,
    canPresentAsOfficial: status === 'official',
    canOperatePublicly: status === 'pilot' || status === 'supplementary' || status === 'official',
    rationale,
  };
}

export function evaluateAgidPostalSplitDecision(
  input: AgidPostalSplitDecisionInput,
): AgidPostalSplitDecision {
  const threshold = Math.max(0, input.threshold ?? 0);
  const netBenefit = Number((input.benefit - input.codeCost - input.migrationCost).toFixed(6));
  const shouldSplit = netBenefit > threshold;
  return {
    shouldSplit,
    netBenefit,
    threshold,
    rationale: [
      `benefit:${input.benefit}`,
      `code-cost:${input.codeCost}`,
      `migration-cost:${input.migrationCost}`,
      `net-benefit:${netBenefit}`,
      shouldSplit ? 'mdl-split-benefit-exceeds-code-and-migration-cost' : 'keep-existing-zone-to-avoid-code-churn',
    ],
  };
}

export function evaluateAgidPostalCodeChurnBudget(
  input: AgidPostalCodeChurnBudgetInput,
): AgidPostalCodeChurnBudgetDecision {
  const totalCodeCount = Math.max(0, Math.floor(input.totalCodeCount));
  const changedCodeCount = Math.max(0, Math.floor(input.changedCodeCount));
  const budgetRate = Math.max(0, input.budgetRate ?? 0.005);
  const churnRate = totalCodeCount > 0 ? Number((changedCodeCount / totalCodeCount).toFixed(6)) : 0;
  const withinBudget = Boolean(input.emergencyOverride) || (totalCodeCount > 0 && churnRate <= budgetRate);
  return {
    withinBudget,
    churnRate,
    budgetRate,
    rationale: [
      `changed-code-count:${changedCodeCount}`,
      `total-code-count:${totalCodeCount}`,
      `churn-rate:${churnRate}`,
      `budget-rate:${budgetRate}`,
      input.emergencyOverride ? 'emergency-override-allows-temporary-churn-budget-exception' : 'standard-churn-budget',
      withinBudget ? 'code-churn-within-budget' : 'code-churn-exceeds-budget-review-required',
    ],
  };
}

function positiveCeilRatio(numerator: number | undefined, denominator: number | undefined) {
  const top = Math.max(0, Math.ceil(Number(numerator || 0)));
  const bottom = Number(denominator);
  if (!Number.isFinite(bottom) || bottom <= 0 || top <= 0) return 0;
  return Math.max(1, Math.ceil(top / bottom));
}

function positiveCount(value: number | undefined) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.ceil(numeric));
}

function wouldAtomicValueExceedLimit(value: number | undefined, limit: number | undefined) {
  const numeric = Number(value || 0);
  const max = Number(limit);
  return Number.isFinite(numeric) && numeric > 0 && Number.isFinite(max) && max > 0 && numeric > max;
}

export function estimateAgidPostalMinimumCodeCount(input: {
  regions: AgidPostalMinimumCodeRegion[];
  policy?: AgidPostalMinimumCodePolicy;
}): AgidPostalMinimumCodeCountDecision {
  const policy = input.policy || {};
  const regions = input.regions.map(region => {
    const addressLowerBound = positiveCeilRatio(region.addressCount, policy.maxAddressCountPerCode);
    const populationLowerBound = positiveCeilRatio(region.population, policy.maxPopulationPerCode);
    const demandLowerBound = positiveCeilRatio(region.peakDeliveryDemand, policy.maxPeakDeliveryDemandPerCode);
    const businessLowerBound = positiveCeilRatio(region.businessLoad, policy.maxBusinessLoadPerCode);
    const connectedComponentLowerBound = positiveCount(region.connectedComponentCount);
    const timeCoverLowerBound = positiveCount(region.timeCoverCount);
    const hasActivity = Boolean(
      positiveCount(region.addressCount)
      || positiveCount(region.population)
      || positiveCount(region.peakDeliveryDemand)
      || positiveCount(region.businessLoad),
    );
    const reserveRequirement = region.reserveCode || (policy.reserveEmptyRegions && !hasActivity) || hasActivity ? 1 : 0;
    const lowerBound = Math.max(
      reserveRequirement,
      addressLowerBound,
      populationLowerBound,
      demandLowerBound,
      businessLowerBound,
      connectedComponentLowerBound,
      timeCoverLowerBound,
    );
    const requiresAtomicSubdivision = Boolean(
      wouldAtomicValueExceedLimit(region.largestAtomicAddressCount, policy.maxAddressCountPerCode)
      || wouldAtomicValueExceedLimit(region.largestAtomicPopulation, policy.maxPopulationPerCode)
      || wouldAtomicValueExceedLimit(region.largestAtomicPeakDeliveryDemand, policy.maxPeakDeliveryDemandPerCode)
      || wouldAtomicValueExceedLimit(region.largestAtomicBusinessLoad, policy.maxBusinessLoadPerCode),
    );
    const rationale = [
      `region:${region.regionId}`,
      `address-lower-bound:${addressLowerBound}`,
      `population-lower-bound:${populationLowerBound}`,
      `demand-lower-bound:${demandLowerBound}`,
      `business-lower-bound:${businessLowerBound}`,
      `connected-components:${connectedComponentLowerBound}`,
      `time-cover-count:${timeCoverLowerBound}`,
      `reserve-requirement:${reserveRequirement}`,
      `lower-bound:${lowerBound}`,
    ];
    if (requiresAtomicSubdivision) {
      rationale.push('one-or-more-atomic-cells-exceed-per-code-limit-and-must-be-subdivided');
    }

    return {
      regionId: region.regionId,
      name: region.name,
      reserveRequirement,
      addressLowerBound,
      populationLowerBound,
      demandLowerBound,
      businessLowerBound,
      connectedComponentLowerBound,
      timeCoverLowerBound,
      lowerBound,
      requiresAtomicSubdivision,
      rationale,
    };
  });
  const structuralMinimum = regions.filter(region => region.reserveRequirement > 0).length;
  const operationalLowerBound = Math.max(1, regions.reduce((sum, region) => sum + region.lowerBound, 0));
  const feasibleWithoutAtomicSubdivision = !regions.some(region => region.requiresAtomicSubdivision);

  return {
    absoluteMinimum: 1,
    structuralMinimum,
    operationalLowerBound,
    feasibleWithoutAtomicSubdivision,
    regions,
    theoremChecks: {
      absoluteMinimumExists: true,
      requiredRegionSeparation: structuralMinimum <= operationalLowerBound,
      capacityPolicyApplied: regions.some(region => (
        region.addressLowerBound > 0
        || region.populationLowerBound > 0
        || region.demandLowerBound > 0
        || region.businessLowerBound > 0
      )),
      routeConnectivityApplied: regions.some(region => (
        region.connectedComponentLowerBound > 0
        || region.timeCoverLowerBound > 0
      )),
    },
    rationale: [
      'absolute-minimum-is-one-country-wide-zone',
      `structural-minimum:${structuralMinimum}`,
      `operational-lower-bound:${operationalLowerBound}`,
      feasibleWithoutAtomicSubdivision ? 'no-atomic-subdivision-required-by-current-limits' : 'atomic-subdivision-required-before-exact-optimization',
      'exact-operational-minimum-requires-covering-or-integer-optimization-over-candidate-zones',
    ],
  };
}

export function planAgidPostalFutureCapacity(
  input: AgidPostalFutureCapacityInput,
): AgidPostalFutureCapacityDecision {
  const current = positiveCount(input.currentOperationalLowerBound);
  const future = (input.futureOperationalLowerBounds || []).map(positiveCount);
  const robustFutureMinimum = Math.max(current, ...future, 1);
  const reserveRate = Math.max(0, Number(input.reserveRate ?? 0.25));
  const requiredCodeSpace = Math.max(1, Math.ceil((1 + reserveRate) * robustFutureMinimum));
  const alphabetSize = Math.max(2, Math.floor(input.alphabetSize || 10));
  const minimumFixedLength = Math.max(1, Math.ceil(Math.log(requiredCodeSpace) / Math.log(alphabetSize)));
  const displayLength = minimumFixedLength + (input.includeCheckCharacter ? 1 : 0);

  return {
    robustFutureMinimum,
    reserveRate,
    requiredCodeSpace,
    alphabetSize,
    minimumFixedLength,
    displayLength,
    rationale: [
      `robust-future-minimum:${robustFutureMinimum}`,
      `reserve-rate:${reserveRate}`,
      `required-code-space:${requiredCodeSpace}`,
      `alphabet-size:${alphabetSize}`,
      `minimum-fixed-length:${minimumFixedLength}`,
      input.includeCheckCharacter ? 'display-length-includes-check-character' : 'display-length-without-check-character',
    ],
  };
}

export function estimateAgidPostalHierarchyCapacity(input: {
  levels: AgidPostalHierarchyCapacityLevel[];
  alphabetSize?: number;
}): AgidPostalHierarchyCapacityDecision {
  const alphabetSize = Math.max(2, Math.floor(input.alphabetSize || 10));
  const levels = input.levels.map(level => {
    const reserveRate = Math.max(0, Number(level.reserveRate ?? 0));
    const requiredCapacity = Math.max(1, Math.ceil((1 + reserveRate) * Math.max(0, Math.ceil(level.maxChildren))));
    const minimumLength = Math.max(1, Math.ceil(Math.log(requiredCapacity) / Math.log(alphabetSize)));
    return {
      ...level,
      requiredCapacity,
      minimumLength,
    };
  });
  const totalDisplayLength = levels.reduce((sum, level) => sum + level.minimumLength, 0);
  const formatHint = levels
    .map(level => level.label.slice(0, 1).toUpperCase().repeat(level.minimumLength))
    .join('-');

  return {
    alphabetSize,
    totalDisplayLength,
    levels,
    formatHint,
    rationale: [
      `alphabet-size:${alphabetSize}`,
      `total-display-length:${totalDisplayLength}`,
      `format-hint:${formatHint}`,
      'each-hierarchy-level-reserves-enough-code-space-for-its-maximum-child-count',
    ],
  };
}

function hammingDistance(left: string, right: string) {
  const length = Math.max(left.length, right.length);
  let distance = 0;
  for (let i = 0; i < length; i += 1) {
    if ((left[i] || '') !== (right[i] || '')) distance += 1;
  }
  return distance;
}

function observedMinimumHammingDistance(codes: string[]) {
  if (codes.length < 2) return codes.length === 1 ? codes[0].length : 0;
  let minimum = Number.POSITIVE_INFINITY;
  for (let i = 0; i < codes.length; i += 1) {
    for (let j = i + 1; j < codes.length; j += 1) {
      minimum = Math.min(minimum, hammingDistance(codes[i], codes[j]));
    }
  }
  return Number.isFinite(minimum) ? minimum : 0;
}

function normalizedCodeAlphabet(value?: string) {
  const deduped = Array.from(new Set(String(value || AGID_HASH_ALPHABET).toUpperCase().replace(/[^A-Z0-9]/g, '').split('')));
  return deduped.length >= 2 ? deduped.join('') : AGID_HASH_ALPHABET;
}

export function evaluateAgidPostalVirtualLocalityNeed(
  input: AgidPostalVirtualLocalityNeedInput,
): AgidPostalVirtualLocalityNeedDecision {
  const countryCode = normalizeCountryCode(input.countryCode);
  const regionId = normalizeLocalityId(input.regionId);
  const ambiguityThreshold = Math.max(0, Number(input.ambiguityThreshold ?? 0.65));
  const minimumPublicAddressCount = Math.max(1, positiveCount(input.minimumPublicAddressCount || 10));
  const triggers: AgidPostalVirtualLocalityTrigger[] = [];

  if (Number(input.ambiguityScore || 0) > ambiguityThreshold) triggers.push('ambiguity');
  if (positiveCeilRatio(input.addressCount, input.maxAddressCountPerVirtualLocality) > 1) triggers.push('address-count');
  if (positiveCeilRatio(input.population, input.maxPopulationPerVirtualLocality) > 1) triggers.push('population');
  if (positiveCeilRatio(input.peakDeliveryDemand, input.maxPeakDeliveryDemandPerVirtualLocality) > 1) triggers.push('delivery-demand');
  if (
    Number.isFinite(Number(input.routeRadiusMinutes))
    && Number.isFinite(Number(input.maxRouteRadiusMinutes))
    && Number(input.routeRadiusMinutes) > Number(input.maxRouteRadiusMinutes)
  ) {
    triggers.push('route-radius');
  }
  if (positiveCount(input.connectedComponentCount) > 1) triggers.push('route-connectivity');
  if (positiveCount(input.timeCoverCount) > 1) triggers.push('time-cover');

  const lowerBound = Math.max(
    triggers.length > 0 ? 1 : 0,
    positiveCeilRatio(input.addressCount, input.maxAddressCountPerVirtualLocality),
    positiveCeilRatio(input.population, input.maxPopulationPerVirtualLocality),
    positiveCeilRatio(input.peakDeliveryDemand, input.maxPeakDeliveryDemandPerVirtualLocality),
    positiveCount(input.connectedComponentCount),
    positiveCount(input.timeCoverCount),
  );
  const averageAddresses = lowerBound > 0 ? Math.floor(positiveCount(input.addressCount) / lowerBound) : 0;
  const publicSafeByAverageAddressCount = lowerBound === 0 || averageAddresses >= minimumPublicAddressCount;
  const shouldCreate = triggers.length > 0;
  const rationale = [
    `country:${countryCode}`,
    `region:${regionId}`,
    `ambiguity-score:${Number(input.ambiguityScore || 0)}`,
    `ambiguity-threshold:${ambiguityThreshold}`,
    `lower-bound:${lowerBound}`,
    `triggers:${triggers.join(',') || 'none'}`,
    publicSafeByAverageAddressCount ? 'average-public-address-count-satisfies-anonymity-floor' : 'average-public-address-count-below-anonymity-floor',
  ];
  if (!shouldCreate) {
    rationale.push('do-not-create-vpl-for-visual-variety-alone');
  }

  return {
    shouldCreate,
    lowerBound,
    triggers,
    publicSafeByAverageAddressCount,
    dataModel: {
      countryCode,
      regionId,
      administrativeLocalityId: input.administrativeLocalityId || null,
      postalLocalityId: input.postalLocalityId || null,
      virtualPostalLocalityRequired: shouldCreate,
      synthetic: true,
      legalStatus: 'non_administrative',
      authority: input.authority || null,
    },
    rationale,
  };
}

export function buildAgidVirtualPostalLocalityCode(
  input: AgidPostalVirtualLocalityCodeInput,
): AgidPostalVirtualLocalityCodeResult {
  const countryCode = normalizeCountryCode(input.countryCode);
  const parentRegionCode = normalizeHierarchyCodePart(input.parentRegionCode, 2);
  const virtualLocalityCode = normalizeHierarchyCodePart(input.virtualLocalityCode, 2);
  const deliveryZoneCode = input.deliveryZoneCode === null || input.deliveryZoneCode === undefined
    ? null
    : normalizeHierarchyCodePart(input.deliveryZoneCode, 1);
  const base = [countryCode, parentRegionCode, virtualLocalityCode, deliveryZoneCode]
    .filter(Boolean)
    .join('-');
  const checkCharacter = input.includeCheckCharacter ? stableAuditToken(base, 1) : null;

  return {
    code: checkCharacter ? `${base}-${checkCharacter}` : base,
    components: {
      countryCode,
      parentRegionCode,
      virtualLocalityCode,
      deliveryZoneCode,
      checkCharacter,
    },
  };
}

export function generateAgidVirtualPostalLocalityCodes(
  input: AgidPostalVirtualLocalityCodeSetInput,
): AgidPostalVirtualLocalityCodeSetDecision {
  const count = Math.max(0, Math.floor(input.count));
  const requestedCodeLength = Math.max(1, Math.floor(input.codeLength || 3));
  const minHammingDistance = Math.max(1, Math.floor(input.minHammingDistance || 3));
  const adjacentMinHammingDistance = Math.max(minHammingDistance, Math.floor(input.adjacentMinHammingDistance || minHammingDistance));
  const alphabet = normalizedCodeAlphabet(input.alphabet);
  let codeLength = Math.max(requestedCodeLength, minHammingDistance, adjacentMinHammingDistance);
  let codes: string[] = [];
  let attempt = 0;
  const seed = input.seed || 'virtual-postal-locality';

  while (codes.length < count && codeLength <= Math.max(12, requestedCodeLength + 8)) {
    const candidate = stableAuditToken(`${seed}:${codeLength}:${attempt}`, codeLength)
      .split('')
      .map(char => alphabet.includes(char) ? char : alphabet[char.charCodeAt(0) % alphabet.length])
      .join('');
    attempt += 1;

    if (codes.includes(candidate)) continue;
    const pairwiseOk = codes.every(code => hammingDistance(code, candidate) >= minHammingDistance);
    if (!pairwiseOk) {
      if (attempt > Math.max(5000, count * 5000)) {
        codeLength += 1;
        attempt = 0;
        codes = [];
      }
      continue;
    }
    codes.push(candidate);
  }

  const observedMinHammingDistance = observedMinimumHammingDistance(codes);
  const adjacencySatisfied = (input.adjacentPairs || []).every(([leftIndex, rightIndex]) => {
    const left = codes[leftIndex];
    const right = codes[rightIndex];
    if (!left || !right) return true;
    return hammingDistance(left, right) >= adjacentMinHammingDistance;
  });

  return {
    codes,
    codeLength,
    requestedCodeLength,
    minHammingDistance,
    observedMinHammingDistance,
    adjacentMinHammingDistance,
    adjacencySatisfied,
    rationale: [
      `count:${count}`,
      `requested-code-length:${requestedCodeLength}`,
      `actual-code-length:${codeLength}`,
      `min-hamming-distance:${minHammingDistance}`,
      `observed-min-hamming-distance:${observedMinHammingDistance}`,
      adjacencySatisfied ? 'adjacent-virtual-locality-codes-satisfy-distance-constraint' : 'adjacent-virtual-locality-code-distance-review-required',
      codeLength > requestedCodeLength ? 'code-length-raised-to-satisfy-distance-constraint' : 'requested-code-length-satisfied',
    ],
  };
}

function sourceText(profile: AgidPostalCountryProfile) {
  return [
    profile.countryCode,
    profile.countryName,
    profile.addressFormat?.name,
    profile.addressFormat?.postalCode?.source,
    profile.addressFormat?.postalCode?.api,
    profile.addressFormat?.postalCode?.format,
    ...(profile.addressFormat?.openSourceIds || []),
    ...(profile.addressFormat?.addressRules?.openSourceIds || []),
    ...(profile.evidenceSources || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function inferDataQuality(profile: AgidPostalCountryProfile): Required<Omit<AgidPostalDataQualitySignals, 'threshold'>> {
  const supplied = profile.dataQuality || {};
  const policy = classifyAddressCoveragePolicy(profile.addressFormat || {
    countryCode: profile.countryCode,
    name: profile.countryName,
  });
  const text = sourceText(profile);
  const sourceBoost = /official|government|national|geoportal|cadastre|survey|openaddresses|overture|geoboundaries|natural-earth/.test(text)
    ? 0.12
    : 0;
  const base = policy.id === 'postal-reliable-api'
    ? 0.82
    : policy.id === 'no-postal-strong-geo'
      ? 0.62
      : policy.id === 'postal-weak-api'
        ? 0.52
        : 0.42;

  return {
    address: clamp01(supplied.address, Math.min(1, base + sourceBoost)),
    road: clamp01(supplied.road, Math.min(1, base - 0.05 + sourceBoost)),
    admin: clamp01(supplied.admin, Math.min(1, base + 0.05 + sourceBoost)),
    population: clamp01(supplied.population, Math.min(1, base + sourceBoost / 2)),
    boundary: clamp01(supplied.boundary, Math.min(1, base + 0.08 + sourceBoost)),
  };
}

function isHighRiskCountryContext(profile: AgidPostalCountryProfile) {
  return /conflict|high-risk|disputed|military|sensitive|refugee|humanitarian|war|sanction|surveillance/.test(sourceText(profile));
}

function inferTerrain(profile: AgidPostalCountryProfile): AgidPostalTerrainClass {
  if (profile.terrain) return profile.terrain;
  const name = `${profile.countryName || ''} ${profile.evidenceSources?.join(' ') || ''}`.toLowerCase();
  const area = profile.areaKm2 || 0;
  const population = profile.population || 0;
  const density = area > 0 && population > 0 ? population / area : 0;
  if (/island|archipelago|atoll|fiji|bahamas|comoros|seychelles|solomon|tonga|tuvalu|vanuatu|cook|tokelau|curacao|aruba|sint maarten/.test(name)) return 'archipelago';
  if (/desert|sahara|sahel|chad|libya|mauritania|botswana/.test(name)) return 'desert';
  if (/mountain|hilly|andes|rwanda|bolivia|eritrea|yemen/.test(name)) return 'mountain';
  if (density > 1000 || (profile.urbanizationPercent || 0) >= 80) return 'compact-urban';
  if (area > 250000 && density < 50) return 'large-rural';
  return 'mixed';
}

function chooseTemplate(profile: AgidPostalCountryProfile, terrain: AgidPostalTerrainClass): AgidPostalTemplateId {
  const population = profile.population || 0;
  const area = profile.areaKm2 || 0;
  const density = area > 0 && population > 0 ? population / area : 0;
  if (terrain === 'archipelago') return 'agid-native';
  if (terrain === 'desert' || terrain === 'large-rural') return 'us-like';
  if (terrain === 'mountain') return 'france-like';
  if (density > 3000 || (area > 0 && area < 1000 && population > 500000)) return 'singapore-like';
  if (population > 50000000) return 'india-like';
  if (population > 10000000) return 'japan-like';
  return 'agid-native';
}

export function classifyAgidPostalCountry(
  profile: AgidPostalCountryProfile,
): AgidPostalCountryClassification {
  const countryCode = normalizeCountryCode(profile.countryCode);
  const target = targetCountryByCode.get(countryCode);
  const policy = classifyAddressCoveragePolicy(profile.addressFormat || {
    countryCode,
    name: profile.countryName,
    postalCode: target ? { regex: null, api: null, source: target.note, format: 'None' } : undefined,
    addressRules: target ? { postalCode: null, openSourceIds: profile.evidenceSources } : undefined,
    openSourceIds: profile.evidenceSources,
  });

  if (policy.id === 'postal-reliable-api' && !target) {
    return {
      countryCode,
      countryName: profile.countryName,
      class: 'A',
      policyId: policy.id,
      generationMode: 'existing-postal-only',
      allowed: false,
      reason: 'Existing postal code metadata is reliable enough; AGID postal area codes stay internal only.',
      sources: ['address-coverage-policy', ...(profile.evidenceSources || [])],
    };
  }

  if (target || policy.id === 'no-postal-strong-geo' || policy.id === 'no-postal-weak-geo') {
    return {
      countryCode,
      countryName: profile.countryName || target?.name,
      class: 'C',
      policyId: policy.id,
      generationMode: 'primary-agid-postal',
      allowed: true,
      reason: target
        ? 'UPU-style postal-code-not-required evidence permits AGID-based auxiliary postal area generation.'
        : 'No-postal metadata permits AGID-based auxiliary postal area generation.',
      sources: [
        target?.basis,
        'address-coverage-policy',
        ...(profile.evidenceSources || []),
      ].filter(Boolean) as string[],
    };
  }

  return {
    countryCode,
    countryName: profile.countryName,
    class: 'B',
    policyId: policy.id,
    generationMode: 'supplemental-agid-postal',
    allowed: true,
    reason: 'Postal code exists but source quality is weak; AGID postal area codes are allowed as supplemental candidates only.',
    sources: ['address-coverage-policy', ...(profile.evidenceSources || [])],
  };
}

export function buildAgidPostalCountryProfiles(
  profiles: AgidPostalCountryProfile[] = [],
): AgidPostalCountryProfile[] {
  const profileByCode = new Map<string, AgidPostalCountryProfile>();

  for (const country of AGID_POSTAL_TARGET_COUNTRIES) {
    profileByCode.set(country.code, {
      countryCode: country.code,
      countryName: country.name,
      evidenceSources: [country.basis, country.note],
      terrain: inferTerrain({
        countryCode: country.code,
        countryName: country.name,
        evidenceSources: [country.note],
      }),
    });
  }

  for (const profile of profiles) {
    const countryCode = normalizeCountryCode(profile.countryCode);
    const existing = profileByCode.get(countryCode);
    profileByCode.set(countryCode, {
      ...existing,
      ...profile,
      countryCode,
      evidenceSources: [
        ...(existing?.evidenceSources || []),
        ...(profile.evidenceSources || []),
      ],
    });
  }

  return [...profileByCode.values()].sort((left, right) => left.countryCode.localeCompare(right.countryCode));
}

export function classifyAgidPostalCountries(
  profiles: AgidPostalCountryProfile[] = [],
): AgidPostalCountryClassificationList {
  const classifications = buildAgidPostalCountryProfiles(profiles)
    .map(profile => classifyAgidPostalCountry(profile));
  const sortByCode = (items: AgidPostalCountryClassification[]) =>
    [...items].sort((left, right) => left.countryCode.localeCompare(right.countryCode));

  return {
    classA: sortByCode(classifications.filter(item => item.class === 'A')),
    classB: sortByCode(classifications.filter(item => item.class === 'B')),
    classC: sortByCode(classifications.filter(item => item.class === 'C')),
    eligible: sortByCode(classifications.filter(item => item.allowed)),
    blocked: sortByCode(classifications.filter(item => !item.allowed)),
  };
}

export function recommendAgidPostalTemplate(
  profile: AgidPostalCountryProfile,
): AgidPostalTemplateRecommendation {
  const terrain = inferTerrain(profile);
  const templateId = chooseTemplate(profile, terrain);
  const population = profile.population || 0;
  const area = profile.areaKm2 || 0;
  const density = area > 0 && population > 0 ? population / area : 0;
  const rationale = [
    `terrain:${terrain}`,
    population > 0 ? `population:${population.toLocaleString()}` : 'population:unknown',
    area > 0 ? `area-km2:${Math.round(area).toLocaleString()}` : 'area-km2:unknown',
    density > 0 ? `density:${Math.round(density)}/km2` : 'density:unknown',
  ];
  if (terrain === 'archipelago') rationale.push('prefer-island-first-agid-native-codes');
  if (terrain === 'desert' || terrain === 'large-rural') rationale.push('prefer-coarse-routing-with-later-extension');
  if (population > 50000000) rationale.push('prefer-six-digit-high-capacity-numeric');
  return {
    templateId,
    confidence: terrain === 'mixed' ? 0.62 : 0.76,
    terrain,
    rationale,
  };
}

function classifyAgidPostalPopulationBand(population: number): AgidPostalPopulationBand {
  if (population <= 0) return 'unknown';
  if (population < 150000) return 'very-small';
  if (population < 5000000) return 'small';
  if (population < 50000000) return 'medium';
  if (population < 200000000) return 'large';
  return 'mega';
}

function classifyAgidPostalAreaBand(areaKm2: number): AgidPostalAreaBand {
  if (areaKm2 <= 0) return 'unknown';
  if (areaKm2 < 1000) return 'micro';
  if (areaKm2 < 50000) return 'small';
  if (areaKm2 < 500000) return 'medium';
  if (areaKm2 < 3000000) return 'large';
  return 'continental';
}

function classifyAgidPostalCountryScale(population: number, areaKm2: number): AgidPostalCountryScale {
  if ((areaKm2 > 0 && areaKm2 < 1000) || (population > 0 && population < 150000)) return 'micro';
  if ((areaKm2 > 0 && areaKm2 < 50000) || (population > 0 && population < 5000000)) return 'small';
  if ((areaKm2 > 0 && areaKm2 < 500000) || (population > 0 && population < 50000000)) return 'medium';
  if ((areaKm2 > 0 && areaKm2 < 3000000) || (population > 0 && population < 200000000)) return 'large';
  return 'continental';
}

function scoreAgidPostalTemplateForCountry(
  templateId: AgidPostalTemplateId,
  profile: AgidPostalCountryProfile,
  classification: AgidPostalCountryClassification,
  terrain: AgidPostalTerrainClass,
): number {
  const population = profile.population || 0;
  const area = profile.areaKm2 || 0;
  const density = area > 0 && population > 0 ? population / area : 0;
  const recommendedTemplateId = chooseTemplate(profile, terrain);
  let score = 0.3;

  if (templateId === recommendedTemplateId) score += 0.18;

  if (terrain === 'archipelago') {
    if (templateId === 'agid-native') score += 0.34;
    if (templateId === 'ghana-like') score += 0.12;
    if (templateId === 'singapore-like') score += 0.08;
  }
  if (terrain === 'desert' || terrain === 'large-rural') {
    if (templateId === 'us-like') score += 0.34;
    if (templateId === 'agid-native') score += 0.18;
    if (templateId === 'france-like') score += 0.08;
  }
  if (terrain === 'mountain') {
    if (templateId === 'france-like') score += 0.28;
    if (templateId === 'japan-like') score += 0.12;
    if (templateId === 'agid-native') score += 0.1;
  }
  if (terrain === 'compact-urban') {
    if (templateId === 'singapore-like') score += 0.3;
    if (templateId === 'uk-like') score += 0.22;
    if (templateId === 'japan-like') score += 0.16;
  }
  if (terrain === 'mixed') {
    if (templateId === 'japan-like') score += 0.14;
    if (templateId === 'india-like') score += 0.13;
    if (templateId === 'agid-native') score += 0.11;
  }

  if (population > 50000000) {
    if (templateId === 'india-like') score += 0.34;
    if (templateId === 'japan-like' || templateId === 'us-like') score += 0.1;
  }
  if (area > 1000000 && density > 0 && density < 80) {
    if (templateId === 'us-like') score += 0.18;
    if (templateId === 'agid-native') score += 0.12;
  }
  if (density > 1000) {
    if (templateId === 'singapore-like') score += 0.2;
    if (templateId === 'uk-like') score += 0.16;
    if (templateId === 'japan-like') score += 0.12;
  }
  if ((profile.urbanizationPercent || 0) >= 80) {
    if (templateId === 'singapore-like' || templateId === 'uk-like') score += 0.1;
  }
  if (classification.class === 'B' && templateId === 'agid-native') score += 0.08;
  if (classification.class === 'C' && templateId === 'agid-native') score += 0.1;

  return Number(clamp01(score).toFixed(3));
}

function postalSystemAdoptedReasons(
  templateId: AgidPostalTemplateId,
  profile: AgidPostalCountryProfile,
  terrain: AgidPostalTerrainClass,
): string[] {
  const population = profile.population || 0;
  const area = profile.areaKm2 || 0;
  const density = area > 0 && population > 0 ? population / area : 0;
  const reasons = [...AGID_POSTAL_TEMPLATES[templateId].bestFor];

  if (templateId === 'japan-like') {
    reasons.push('numeric hierarchy supports later local subdivision');
    if (density > 500) reasons.push('dense settlement network benefits from multi-level code');
  }
  if (templateId === 'us-like') {
    reasons.push('short primary code can later gain route-level suffix');
    if (area > 250000) reasons.push('large territory benefits from coarse regional sorting first');
  }
  if (templateId === 'india-like') {
    reasons.push('six numeric digits remain easy to input across languages');
    if (population > 50000000) reasons.push('large population requires high visible code capacity');
  }
  if (templateId === 'france-like') {
    reasons.push('broad administrative prefix keeps regional grouping visible');
    if (terrain === 'mountain') reasons.push('regional grouping can follow valleys, departments, or basins');
  }
  if (templateId === 'uk-like') {
    reasons.push('alphanumeric outward/inward structure gives high capacity in short text');
    if (density > 1000) reasons.push('dense urban delivery benefits from compact high-capacity codes');
  }
  if (templateId === 'singapore-like') {
    reasons.push('compact country can use short national namespace with dense local precision');
    if (terrain === 'compact-urban') reasons.push('urban routing can move closer to building or block level');
  }
  if (templateId === 'ghana-like') {
    reasons.push('digital address UX can bridge weak street names and map/grid references');
    reasons.push('public-facing digital code can supplement formal postal codes');
  }
  if (templateId === 'agid-native') {
    reasons.push('AGID remains the stable internal key while display code can be reshaped');
    if (terrain === 'archipelago') reasons.push('island-first hierarchy can be generated without forcing street names');
    if (terrain === 'desert' || terrain === 'large-rural') reasons.push('coarse routing cells can be refined only where demand appears');
  }

  return [...new Set(reasons)];
}

function postalSystemCautions(
  templateId: AgidPostalTemplateId,
  classification: AgidPostalCountryClassification,
): string[] {
  const cautions = ['learn-as-design-prior-not-direct-copy'];
  if (classification.class === 'A') cautions.push('mature-existing-postal-system-remains-primary');
  if (classification.class === 'B') cautions.push('use-only-as-supplement-to-existing-postal-code');
  if (templateId !== 'agid-native') cautions.push('do-not-claim-foreign-postal-authority-compatibility');
  if (templateId === 'ghana-like') cautions.push('avoid-public-precision-when-safety-or-surveillance-risk-is-high');
  if (templateId === 'uk-like') cautions.push('alphanumeric-code-needs-strong-input-validation-and-readable-fonts');
  return cautions;
}

function decideExistingSystemUse(
  score: number,
  classification: AgidPostalCountryClassification,
): AgidPostalExistingSystemUse {
  if (classification.class === 'A') return 'avoid-direct-copy';
  if (classification.class === 'B') return score >= 0.6 ? 'supplemental-inspiration' : 'avoid-direct-copy';
  return score >= 0.72 ? 'primary-template' : score >= 0.55 ? 'supplemental-inspiration' : 'avoid-direct-copy';
}

function decideCountryLearningMode(classification: AgidPostalCountryClassification): AgidPostalLearningMode {
  if (classification.class === 'A') return 'mature-postal-baseline';
  if (classification.class === 'B') return 'weak-postal-supplement';
  return 'missing-postal-design';
}

function decideCountryLearningUse(classification: AgidPostalCountryClassification): AgidPostalLearningUse {
  if (classification.class === 'A') return 'internal-baseline-only';
  if (classification.class === 'B') return 'supplemental-design';
  return 'primary-design';
}

export function learnAgidPostalCountryDesign(
  profile: AgidPostalCountryProfile,
  classification: AgidPostalCountryClassification = classifyAgidPostalCountry(profile),
): AgidPostalCountryDesignLearning {
  const countryCode = normalizeCountryCode(profile.countryCode);
  const terrain = inferTerrain(profile);
  const population = Math.max(0, Math.round(profile.population || 0));
  const area = Math.max(0, profile.areaKm2 || 0);
  const density = area > 0 && population > 0 ? Number((population / area).toFixed(2)) : null;
  const populationBand = classifyAgidPostalPopulationBand(population);
  const areaBand = classifyAgidPostalAreaBand(area);
  const countryScale = classifyAgidPostalCountryScale(population, area);
  const learningRequired = true;
  const learningMode = decideCountryLearningMode(classification);
  const allowedUse = decideCountryLearningUse(classification);
  const generationBlockedByMaturePostalSystem = classification.class === 'A';

  const comparableSystems = (Object.keys(AGID_POSTAL_TEMPLATES) as AgidPostalTemplateId[])
    .map((templateId) => {
      const template = AGID_POSTAL_TEMPLATES[templateId];
      const fitScore = scoreAgidPostalTemplateForCountry(templateId, profile, classification, terrain);
      return {
        templateId,
        basedOn: template.basedOn,
        format: template.format,
        fitScore,
        adoptedReasons: postalSystemAdoptedReasons(templateId, profile, terrain),
        caution: postalSystemCautions(templateId, classification),
        useAs: decideExistingSystemUse(fitScore, classification),
      };
    })
    .sort((left, right) => right.fitScore - left.fitScore || left.templateId.localeCompare(right.templateId));

  const recommendedTemplateId = comparableSystems[0]?.templateId || recommendAgidPostalTemplate(profile).templateId;
  const observedFactors = [
    `class:${classification.class}`,
    `terrain:${terrain}`,
    `country-scale:${countryScale}`,
    `population-band:${populationBand}`,
    `area-band:${areaBand}`,
    density !== null ? `density:${density}/km2` : 'density:unknown',
    profile.urbanizationPercent !== undefined ? `urbanization:${profile.urbanizationPercent}%` : 'urbanization:unknown',
    profile.municipalityCount !== undefined ? `municipalities:${profile.municipalityCount}` : 'municipalities:unknown',
  ];

  return {
    learningRequired,
    learningMode,
    allowedUse,
    generationBlockedByMaturePostalSystem,
    countryCode,
    class: classification.class,
    terrain,
    countryScale,
    populationBand,
    areaBand,
    densityPerKm2: density,
    observedFactors,
    comparableSystems,
    recommendedTemplateId,
    rationale: [
      'prelearn-territory-population-terrain-before-generation',
      'learn-existing-postal-systems-as-design-priors-not-as-direct-copies',
      `learning-mode:${learningMode}`,
      `learning-use:${allowedUse}`,
      generationBlockedByMaturePostalSystem
        ? 'mature-postal-system-is-primary-agid-learning-is-internal-only'
        : 'generation-may-use-learned-priors-under-class-constraints',
      classification.class === 'B'
        ? 'existing-postal-remains-primary-agid-code-is-supplemental'
        : classification.class === 'C'
          ? 'postal-code-not-required-or-no-strong-postal-evidence-agid-can-design-primary-draft'
          : 'class-a-blocks-replacement-style-generation',
      `recommended-template:${recommendedTemplateId}`,
    ],
  };
}

export function evaluateAgidPostalGovernance(
  profile: AgidPostalCountryProfile,
): AgidPostalGovernanceDecision {
  const signals = profile.governance || {};
  const threshold = clamp01(signals.threshold, DEFAULT_GOVERNANCE_THRESHOLD);
  const government = clamp01(signals.government);
  const municipality = clamp01(signals.municipality);
  const carrier = clamp01(signals.carrier);
  const platform = clamp01(signals.platform);
  const approvalScore = Number((
    government * GOVERNANCE_WEIGHTS.government
    + municipality * GOVERNANCE_WEIGHTS.municipality
    + carrier * GOVERNANCE_WEIGHTS.carrier
    + platform * GOVERNANCE_WEIGHTS.platform
  ).toFixed(3));
  const missingActors = ([
    government <= 0 ? 'government' : null,
    municipality <= 0 ? 'municipality' : null,
    carrier <= 0 ? 'carrier' : null,
    platform <= 0 ? 'platform' : null,
  ].filter(Boolean) as AgidPostalGovernanceDecision['missingActors']);

  return {
    approvalScore,
    threshold,
    approved: approvalScore >= threshold,
    missingActors,
    rationale: [
      `approval-score:${approvalScore}`,
      `threshold:${threshold}`,
      government > 0 ? 'government-signal-present' : 'government-signal-missing',
      municipality > 0 ? 'municipality-signal-present' : 'municipality-signal-missing',
      carrier > 0 ? 'carrier-signal-present' : 'carrier-signal-missing',
      platform > 0 ? 'platform-signal-present' : 'platform-signal-missing',
    ],
  };
}

export function evaluateAgidPostalDataTrust(
  profile: AgidPostalCountryProfile,
): AgidPostalDataTrustDecision {
  const components = inferDataQuality(profile);
  const threshold = clamp01(profile.dataQuality?.threshold, DEFAULT_DATA_TRUST_THRESHOLD);
  const trustScore = Number((
    components.address * DATA_TRUST_WEIGHTS.address
    + components.road * DATA_TRUST_WEIGHTS.road
    + components.admin * DATA_TRUST_WEIGHTS.admin
    + components.population * DATA_TRUST_WEIGHTS.population
    + components.boundary * DATA_TRUST_WEIGHTS.boundary
  ).toFixed(3));

  return {
    trustScore,
    threshold,
    readyForPublication: trustScore >= threshold,
    mode: trustScore >= threshold ? 'official-ready' : 'draft-zone-only',
    components,
    rationale: [
      `Q_addr:${components.address}`,
      `Q_road:${components.road}`,
      `Q_admin:${components.admin}`,
      `Q_pop:${components.population}`,
      `Q_boundary:${components.boundary}`,
      `trust-score:${trustScore}`,
      trustScore >= threshold ? 'data-quality-publication-ready' : 'data-quality-draft-only',
    ],
  };
}

export function evaluateAgidPostalPrivacy(
  profile: AgidPostalCountryProfile,
  estimate: AgidPostalAreaEstimate,
): AgidPostalPrivacyDecision {
  const privacy = profile.privacy || {};
  const populationPerArea = Math.max(0, Math.round(privacy.populationPerArea ?? estimate.peoplePerArea));
  const addressEntitiesPerArea = Math.max(0, Math.round(
    privacy.addressEntitiesPerArea ?? (populationPerArea > 0 ? populationPerArea / 2.5 : 0),
  ));
  const minimumAddressEntities = Math.max(
    1,
    Math.round(privacy.minimumAddressEntities ?? DEFAULT_MIN_ADDRESS_ENTITIES_PER_PUBLIC_CODE),
  );
  const minimumPopulation = Math.max(
    1,
    Math.round(privacy.minimumPopulation ?? DEFAULT_MIN_POPULATION_PER_PUBLIC_CODE),
  );
  const sensitiveBlocked = Boolean(privacy.sensitive);
  const highRisk = Boolean(privacy.highRisk) || isHighRiskCountryContext(profile);
  const anonymitySatisfied = addressEntitiesPerArea >= minimumAddressEntities && populationPerArea >= minimumPopulation;
  const publishable = anonymitySatisfied && !sensitiveBlocked && !highRisk;

  return {
    addressEntitiesPerArea,
    populationPerArea,
    minimumAddressEntities,
    minimumPopulation,
    anonymitySatisfied,
    sensitiveBlocked,
    highRisk,
    publishable,
    rationale: [
      `address-entities-per-area:${addressEntitiesPerArea}`,
      `minimum-address-entities:${minimumAddressEntities}`,
      `population-per-area:${populationPerArea}`,
      `minimum-population:${minimumPopulation}`,
      anonymitySatisfied ? 'minimum-anonymity-satisfied' : 'minimum-anonymity-not-satisfied',
      sensitiveBlocked ? 'sensitive-zone-mask-public-code-bottom' : 'no-sensitive-zone-mask',
      highRisk ? 'high-risk-context-requires-redaction-or-agid-s' : 'standard-risk-context',
    ],
  };
}

export function evaluateAgidPostalReadability(code: string | null | undefined): AgidPostalReadabilityDecision {
  const value = String(code || '');
  const visibleLength = value.replace(/[\s-]/g, '').length;
  const separatorCount = (value.match(/[\s-]/g) || []).length;
  const ambiguityPenalty = Math.min(0.35, ((value.match(/[OIL01]/gi) || []).length * 0.035));
  const lengthPenalty = visibleLength > 12 ? 0.18 : visibleLength > 9 ? 0.08 : 0;
  const separatorPenalty = separatorCount > 3 ? 0.08 : 0;
  const score = Number(Math.max(0, Math.min(1, 1 - ambiguityPenalty - lengthPenalty - separatorPenalty)).toFixed(3));

  return {
    score,
    visibleLength,
    separatorCount,
    ambiguityPenalty: Number(ambiguityPenalty.toFixed(3)),
    rationale: [
      `visible-length:${visibleLength}`,
      `separator-count:${separatorCount}`,
      `ambiguity-penalty:${Number(ambiguityPenalty.toFixed(3))}`,
      score >= 0.75 ? 'human-readable-enough' : 'readability-review-recommended',
    ],
  };
}

export function evaluateAgidPostalCollisionAvoidance(
  profile: AgidPostalCountryProfile,
  classification: AgidPostalCountryClassification,
  code: string | null | undefined,
): AgidPostalCollisionDecision {
  const displayCode = String(code || '').trim();
  if (!displayCode) {
    return {
      collisionFree: false,
      strategy: 'blocked',
      recommendedDisplayCode: null,
      rationale: ['no-display-code'],
    };
  }

  if (classification.class === 'A') {
    return {
      collisionFree: false,
      strategy: 'blocked',
      recommendedDisplayCode: null,
      rationale: ['class-a-existing-postal-system-is-primary'],
    };
  }

  const samples = new Set((profile.existingPostalSamples || []).map(sample => sample.trim().toUpperCase()));
  const normalized = displayCode.toUpperCase();
  let patternCollision = false;
  if (profile.existingPostalPattern) {
    try {
      patternCollision = new RegExp(profile.existingPostalPattern).test(displayCode);
    } catch {
      patternCollision = false;
    }
  }
  const sampleCollision = samples.has(normalized);
  const alreadyAgidSeparated = normalized.startsWith('AGID-') || normalized.includes('-AGID-');

  if (classification.class === 'B' && !alreadyAgidSeparated) {
    return {
      collisionFree: true,
      strategy: 'agid-prefixed',
      recommendedDisplayCode: `AGID-${displayCode}`,
      rationale: ['class-b-supplemental-code-must-not-look-like-primary-postal-code'],
    };
  }

  if (sampleCollision || patternCollision) {
    return {
      collisionFree: true,
      strategy: 'agid-prefixed',
      recommendedDisplayCode: `AGID-${displayCode}`,
      rationale: [
        sampleCollision ? 'existing-postal-sample-collision' : 'existing-postal-pattern-collision',
        'agid-prefix-separates-auxiliary-code-from-official-postal-code',
      ],
    };
  }

  return {
    collisionFree: true,
    strategy: alreadyAgidSeparated ? 'agid-prefixed' : 'country-prefixed',
    recommendedDisplayCode: displayCode,
    rationale: [alreadyAgidSeparated ? 'agid-prefix-present' : 'country-prefix-separates-territory'],
  };
}

export function buildAgidPostalGenerationPolicy(input: {
  profile: AgidPostalCountryProfile;
  classification: AgidPostalCountryClassification;
  templateId?: AgidPostalTemplateId;
  requestedLength?: number;
}): AgidPostalGenerationPolicy {
  const countryCode = normalizeCountryCode(input.classification.countryCode || input.profile.countryCode);
  const template = AGID_POSTAL_TEMPLATES[input.templateId || 'agid-native'] || AGID_POSTAL_TEMPLATES['agid-native'];
  const requested = input.requestedLength || template.defaultLength;
  const effective = effectivePostalCodeLength(input.requestedLength, template);
  const minimumAddressEntities = Math.max(
    1,
    Math.round(input.profile.privacy?.minimumAddressEntities ?? DEFAULT_MIN_ADDRESS_ENTITIES_PER_PUBLIC_CODE),
  );
  const minimumPopulation = Math.max(
    1,
    Math.round(input.profile.privacy?.minimumPopulation ?? DEFAULT_MIN_POPULATION_PER_PUBLIC_CODE),
  );
  const classId = input.classification.class;
  const publicationStage: AgidPostalGenerationPublicationStage = classId === 'A'
    ? 'simulation-only'
    : classId === 'B'
      ? 'supplemental-draft'
      : 'primary-draft';
  const requiresExistingPostalContext = classId !== 'C';
  const canGenerateVisibleCode = classId !== 'A';
  const canBecomeOfficialAfterApproval = classId === 'C';
  const agidNamespaceRequired = classId === 'B';

  return {
    publicationStage,
    canGenerateVisibleCode,
    officialReplacementAllowed: false,
    canBecomeOfficialAfterApproval,
    requiresExistingPostalContext,
    requiresAuthorityApproval: classId !== 'A',
    requiresPublicReview: classId !== 'A',
    namespace: `AGID-POSTAL:${countryCode}:${input.classification.generationMode}`,
    label: classId === 'A'
      ? 'Existing postal code only'
      : classId === 'B'
        ? 'Supplemental AGID postal draft'
        : 'Primary AGID postal draft',
    codeLength: {
      requested,
      effective,
      minimum: MIN_GENERATED_POSTAL_CODE_LENGTH,
      maximum: MAX_GENERATED_POSTAL_CODE_LENGTH,
    },
    visibleCode: {
      countryPrefixRequired: true,
      agidNamespaceRequired,
      checkCharacterRecommended: classId !== 'A',
      maxVisibleLength: classId === 'B' ? 18 : 14,
    },
    privacyFloor: {
      minimumAddressEntities,
      minimumPopulation,
    },
    rationale: [
      classId === 'A'
        ? 'class-a-existing-postal-system-primary'
        : classId === 'B'
          ? 'class-b-supplemental-only'
          : 'class-c-primary-draft-only',
      'official-replacement-never-allowed-by-generator',
      canBecomeOfficialAfterApproval
        ? 'can-become-official-only-after-authority-approval'
        : 'cannot-become-primary-official-code-from-generator-alone',
      agidNamespaceRequired ? 'agid-namespace-required' : 'country-prefix-required',
      `template:${template.id}`,
    ],
  };
}

export function decideAgidPostalPublication(
  input: {
    classification: AgidPostalCountryClassification;
    generated: AgidPostalCodeGenerationResult | null;
    governance: AgidPostalGovernanceDecision;
    privacy: AgidPostalPrivacyDecision;
    dataTrust: AgidPostalDataTrustDecision;
    collisionAvoidance: AgidPostalCollisionDecision | null;
  },
): AgidPostalPublicationDecision {
  const nonReplacement = input.classification.class !== 'A';
  const generatedOk = Boolean(input.generated?.ok);
  const collisionAvoidance = Boolean(input.collisionAvoidance?.collisionFree);
  const theoremChecks = {
    governanceApproval: input.governance.approved,
    anonymity: input.privacy.publishable,
    dataTrust: input.dataTrust.readyForPublication,
    collisionAvoidance,
    nonReplacement,
  };
  const rationale = [
    generatedOk ? 'draft-generation-available' : 'draft-generation-unavailable',
    nonReplacement ? 'non-replacement-of-mature-postal-code' : 'replacement-blocked-for-class-a',
    input.governance.approved ? 'approval-threshold-satisfied' : 'approval-threshold-not-satisfied',
    input.privacy.publishable ? 'privacy-publication-satisfied' : 'privacy-publication-not-satisfied',
    input.dataTrust.readyForPublication ? 'data-trust-satisfied' : 'data-trust-draft-only',
    collisionAvoidance ? 'collision-avoidance-satisfied' : 'collision-avoidance-not-satisfied',
  ];

  if (!generatedOk || !nonReplacement || input.privacy.sensitiveBlocked) {
    return {
      status: 'blocked',
      canGenerateDraft: false,
      canPublishPublicCode: false,
      theoremChecks,
      rationale,
    };
  }

  if (input.privacy.highRisk || !collisionAvoidance) {
    return {
      status: 'review-required',
      canGenerateDraft: true,
      canPublishPublicCode: false,
      theoremChecks,
      rationale,
    };
  }

  if (!input.governance.approved || !input.privacy.publishable || !input.dataTrust.readyForPublication) {
    return {
      status: 'draft-only',
      canGenerateDraft: true,
      canPublishPublicCode: false,
      theoremChecks,
      rationale,
    };
  }

  return {
    status: 'publishable',
    canGenerateDraft: true,
    canPublishPublicCode: true,
    theoremChecks,
    rationale,
  };
}

export function generateAgidPostalAreaCode(
  input: AgidPostalCodeGenerationInput,
): AgidPostalCodeGenerationResult {
  const countryCode = normalizeCountryCode(input.countryCode);
  const agid = normalizeAgid(input.agid);
  const warnings: string[] = [];
  const profile: AgidPostalCountryProfile = {
    ...(input.profile || {}),
    countryCode,
    addressFormat: input.addressFormat ?? input.profile?.addressFormat,
  };
  const classification = classifyAgidPostalCountry(profile);
  const template = AGID_POSTAL_TEMPLATES[input.templateId] || AGID_POSTAL_TEMPLATES['agid-native'];
  const generationPolicy = buildAgidPostalGenerationPolicy({
    profile,
    classification,
    templateId: template.id,
    requestedLength: input.length,
  });

  if (!classification.allowed) {
    return {
      ok: false,
      countryCode,
      agid,
      templateId: template.id,
      generationMode: classification.generationMode,
      generationPolicy,
      blockedReason: 'country-class-a-existing-postal-code-is-primary',
      collisionAvoidance: evaluateAgidPostalCollisionAvoidance(profile, classification, null),
      warnings: [classification.reason],
    };
  }

  if (!agid.startsWith(countryCode)) {
    return {
      ok: false,
      countryCode,
      agid,
      templateId: template.id,
      generationMode: classification.generationMode,
      generationPolicy,
      blockedReason: 'agid-prefix-crosses-country-boundary',
      collisionAvoidance: evaluateAgidPostalCollisionAvoidance(profile, classification, null),
      warnings: [`AGID ${agid.slice(0, 2)} does not match selected country ${countryCode}.`],
    };
  }

  if (!decodeAGID(agid)) {
    return {
      ok: false,
      countryCode,
      agid,
      templateId: template.id,
      generationMode: classification.generationMode,
      generationPolicy,
      blockedReason: 'invalid-agid',
      collisionAvoidance: evaluateAgidPostalCollisionAvoidance(profile, classification, null),
      warnings: ['AGID could not be decoded.'],
    };
  }

  const hash = agid.slice(2);
  const length = generationPolicy.codeLength.effective;
  const numeric = digitsFromHash(hash, Math.max(length, 7));
  const letters = lettersFromHash(hash, 4);
  let code: string;

  switch (template.id) {
    case 'japan-like':
      code = `${countryCode}-${numeric.slice(0, 3)}-${numeric.slice(3, 7)}`;
      break;
    case 'us-like':
      code = `${countryCode}-${numeric.slice(0, 5)}`;
      break;
    case 'india-like':
    case 'singapore-like':
      code = `${countryCode}-${numeric.slice(0, 6)}`;
      break;
    case 'france-like':
      code = `${countryCode}-${numeric.slice(0, 2)} ${numeric.slice(2, 5)}`;
      break;
    case 'uk-like':
      code = `${countryCode}-${letters[0]}${numeric[0]} ${numeric[1]}${letters.slice(1, 3)}`;
      break;
    case 'ghana-like':
      code = `${countryCode}-${letters.slice(0, 2)}-${numeric.slice(0, 3)}-${numeric.slice(3, 7)}`;
      break;
    case 'agid-native':
    default:
      code = `${countryCode}-${hash.slice(0, 4)}-${numeric.slice(0, 3)}`;
      break;
  }

  if (classification.class === 'B') warnings.push('supplemental-only-existing-postal-code-remains-primary');
  if (template.id !== 'agid-native') warnings.push(`mimics-${template.basedOn}-but-is-not-that-country-postal-code`);
  const collisionAvoidance = evaluateAgidPostalCollisionAvoidance(profile, classification, code);
  if (collisionAvoidance.recommendedDisplayCode && collisionAvoidance.recommendedDisplayCode !== code) {
    code = collisionAvoidance.recommendedDisplayCode;
    warnings.push('display-code-separated-from-existing-postal-code-namespace');
  }
  const readability = evaluateAgidPostalReadability(code);

  return {
    ok: true,
    code,
    countryCode,
    agid,
    templateId: template.id,
    generationMode: classification.generationMode,
    generationPolicy,
    collisionAvoidance,
    readability,
    warnings,
  };
}

export function estimateAgidPostalAreas(profile: AgidPostalCountryProfile): AgidPostalAreaEstimate {
  const areaKm2 = Math.max(0, profile.areaKm2 || 0);
  const population = Math.max(0, profile.population || 0);
  const municipalityCount = Math.max(1, Math.round(profile.municipalityCount || Math.sqrt(Math.max(population, 1)) / 70 || 1));
  const baseAgidCellCount = areaKm2 > 0 ? Math.ceil(areaKm2 / AGID_BASE_CELL_KM2) : 0;
  const populationDrivenAreas = population > 0 ? Math.ceil(population / DEFAULT_PEOPLE_PER_POSTAL_AREA) : 0;
  const areaDrivenAreas = areaKm2 > 0 ? Math.ceil(areaKm2 / 12) : 0;
  const suggestedPostalAreaCount = Math.max(municipalityCount, populationDrivenAreas, areaDrivenAreas, 1);
  return {
    baseAgidCellCount,
    suggestedPostalAreaCount,
    peoplePerArea: population > 0 ? Math.ceil(population / suggestedPostalAreaCount) : DEFAULT_PEOPLE_PER_POSTAL_AREA,
    km2PerPostalArea: areaKm2 > 0 ? Number((areaKm2 / suggestedPostalAreaCount).toFixed(2)) : 0,
    municipalityCount,
    approximateAgidCellsPerMunicipality: municipalityCount > 0 ? Math.ceil(baseAgidCellCount / municipalityCount) : baseAgidCellCount,
    approximatePostalAreasPerMunicipality: Math.ceil(suggestedPostalAreaCount / municipalityCount),
  };
}

export function planAgidPostalReshape(
  fromTemplateId: AgidPostalTemplateId,
  toTemplateId: AgidPostalTemplateId,
): AgidPostalReshapePlan {
  return {
    fromTemplateId,
    toTemplateId,
    reversibleByAgid: true,
    migrationSteps: [
      'keep-agid-as-stable-internal-key',
      'publish-old-code-to-new-code-alias-table',
      'dual-render-old-and-new-code-during-transition',
      'detect-remaining-unassigned-agids-by-country-prefix-and-national-boundary',
      'deprecate-old-display-code-only-after-carrier-and-local-authority-confirmation',
    ],
    detectionRules: [
      'decode-agid-and-re-encode-to-confirm-country-prefix',
      'reject-agids-whose-cell-centroid-is-outside-selected-country',
      'count-unassigned-candidate-cells-by-municipality-or-admin-boundary',
      'mark-cross-border-or-disputed-cells-as-review-required',
    ],
  };
}

function qualityStatus(score: number, hardBlock = false): AgidPostalAiQualityDimension['status'] {
  if (hardBlock || score < 0.35) return 'block';
  if (score < 0.72) return 'review';
  return 'pass';
}

function qualityGrade(
  score: number,
  publicationStatus: AgidPostalPublicationStatus,
  hardBlocks: string[],
): AgidPostalAiQualityGrade {
  if (hardBlocks.length > 0 || publicationStatus === 'blocked') return 'blocked';
  if (publicationStatus === 'draft-only') return 'draft-only';
  if (publicationStatus === 'review-required') return 'review-required';
  if (score >= 0.9) return 'excellent';
  if (score >= 0.78) return 'good';
  return 'review-required';
}

function boundedRatio(value: number, threshold: number) {
  if (threshold <= 0) return clamp01(value);
  return clamp01(value / threshold);
}

function dimension(
  input: Omit<AgidPostalAiQualityDimension, 'score' | 'status'> & {
    score: number;
    hardBlock?: boolean;
  },
): AgidPostalAiQualityDimension {
  const score = Number(clamp01(input.score).toFixed(3));
  return {
    id: input.id,
    label: input.label,
    score,
    weight: input.weight,
    status: qualityStatus(score, input.hardBlock),
    evidence: [...input.evidence],
    improvementActions: [...input.improvementActions],
  };
}

export function evaluateAgidPostalAiQuality(input: {
  classification: AgidPostalCountryClassification;
  recommendation: AgidPostalTemplateRecommendation;
  existence: AgidPostalExistenceDecision;
  generated: AgidPostalCodeGenerationResult | null;
  reshapePlan: AgidPostalReshapePlan;
  governance: AgidPostalGovernanceDecision;
  privacy: AgidPostalPrivacyDecision;
  dataTrust: AgidPostalDataTrustDecision;
  collisionAvoidance: AgidPostalCollisionDecision | null;
  readability: AgidPostalReadabilityDecision | null;
  publication: AgidPostalPublicationDecision;
  operationalStatus: AgidPostalOperationalStatusDecision;
  countryLearning: AgidPostalCountryDesignLearning;
}): AgidPostalAiQualityReport {
  const hardBlocks = [
    input.classification.class === 'A' ? 'mature-postal-system-replacement-blocked' : null,
    input.generated && !input.generated.ok ? input.generated.blockedReason || 'generation-failed' : null,
    !input.existence.injectionConditionSatisfied ? 'code-capacity-insufficient' : null,
    input.privacy.sensitiveBlocked ? 'sensitive-zone-public-code-blocked' : null,
    input.publication.status === 'blocked' && input.classification.class !== 'A' ? 'publication-blocked' : null,
  ].filter(Boolean) as string[];

  const comparableFit = input.countryLearning.comparableSystems[0]?.fitScore ?? input.recommendation.confidence;
  const learningDepthScore = clamp01((
    (input.countryLearning.observedFactors.length >= 7 ? 0.32 : 0.18)
    + (input.countryLearning.comparableSystems.length >= 6 ? 0.34 : 0.18)
    + Math.min(0.34, comparableFit * 0.34)
  ));
  const generationScore = input.classification.class === 'A'
    ? 1
    : input.generated?.ok
      ? 1
      : 0.15;
  const publicationNonReplacementScore = input.publication.theoremChecks.nonReplacement || input.classification.class === 'A'
    ? 1
    : 0.2;

  const dimensions: AgidPostalAiQualityDimension[] = [
    dimension({
      id: 'country-classification',
      label: 'Country classification and non-replacement safety',
      score: Math.min(generationScore, publicationNonReplacementScore),
      weight: 0.11,
      evidence: [
        `class:${input.classification.class}`,
        `generation-mode:${input.classification.generationMode}`,
        input.classification.allowed ? 'generation-allowed-for-b-or-c' : 'generation-blocked-for-mature-system',
      ],
      improvementActions: input.classification.class === 'A'
        ? ['Use AGID only as internal/supplemental metadata; do not replace the mature postal system.']
        : [],
    }),
    dimension({
      id: 'template-fit',
      label: 'Template fit to geography, population, and terrain',
      score: Math.max(input.recommendation.confidence, comparableFit),
      weight: 0.1,
      evidence: [
        `recommended-template:${input.recommendation.templateId}`,
        `terrain:${input.recommendation.terrain}`,
        `top-comparable-fit:${comparableFit}`,
      ],
      improvementActions: comparableFit < 0.72
        ? ['Collect stronger national geography, route, density, and settlement priors before choosing a template.']
        : [],
    }),
    dimension({
      id: 'capacity-sufficiency',
      label: 'Code capacity and finite partition existence',
      score: input.existence.injectionConditionSatisfied ? 1 : boundedRatio(input.existence.capacity, input.existence.zoneCount),
      weight: 0.1,
      hardBlock: !input.existence.injectionConditionSatisfied,
      evidence: [
        `zone-count:${input.existence.zoneCount}`,
        `capacity:${input.existence.capacity}`,
        `minimum-length:${input.existence.minimumLength}`,
      ],
      improvementActions: input.existence.injectionConditionSatisfied
        ? []
        : [`Increase code length to at least ${input.existence.minimumLength}.`],
    }),
    dimension({
      id: 'learning-depth',
      label: 'Prelearning depth for national land, population, terrain, and existing systems',
      score: learningDepthScore,
      weight: 0.1,
      evidence: [
        `learning-mode:${input.countryLearning.learningMode}`,
        `learning-use:${input.countryLearning.allowedUse}`,
        `observed-factor-count:${input.countryLearning.observedFactors.length}`,
        `comparable-system-count:${input.countryLearning.comparableSystems.length}`,
      ],
      improvementActions: learningDepthScore < 0.78
        ? ['Add official or open datasets for boundaries, settlements, roads, population, terrain, and carrier routes.']
        : [],
    }),
    dimension({
      id: 'governance-readiness',
      label: 'Governance readiness',
      score: boundedRatio(input.governance.approvalScore, input.governance.threshold),
      weight: 0.11,
      evidence: [
        `approval-score:${input.governance.approvalScore}`,
        `threshold:${input.governance.threshold}`,
        `missing:${input.governance.missingActors.join(',') || 'none'}`,
      ],
      improvementActions: input.governance.approved
        ? []
        : ['Collect government, municipality, carrier, and platform approval signals before public publication.'],
    }),
    dimension({
      id: 'privacy-safety',
      label: 'Privacy, anonymity, and sensitive-zone safety',
      score: input.privacy.publishable
        ? 1
        : input.privacy.sensitiveBlocked
          ? 0.1
          : input.privacy.anonymitySatisfied
            ? 0.62
            : 0.38,
      weight: 0.15,
      hardBlock: input.privacy.sensitiveBlocked,
      evidence: [
        `address-entities:${input.privacy.addressEntitiesPerArea}/${input.privacy.minimumAddressEntities}`,
        `population:${input.privacy.populationPerArea}/${input.privacy.minimumPopulation}`,
        input.privacy.highRisk ? 'high-risk' : 'standard-risk',
        input.privacy.sensitiveBlocked ? 'sensitive-blocked' : 'no-sensitive-mask',
      ],
      improvementActions: input.privacy.publishable
        ? []
        : ['Coarsen the public zone, use AGID-S only, raise anonymity thresholds, or keep the zone private/draft.'],
    }),
    dimension({
      id: 'data-trust',
      label: 'Address, road, admin, population, and boundary data trust',
      score: boundedRatio(input.dataTrust.trustScore, input.dataTrust.threshold),
      weight: 0.13,
      evidence: [
        `trust-score:${input.dataTrust.trustScore}`,
        `threshold:${input.dataTrust.threshold}`,
        `mode:${input.dataTrust.mode}`,
      ],
      improvementActions: input.dataTrust.readyForPublication
        ? []
        : ['Keep output draft-only and improve address, road, admin, population, and boundary sources.'],
    }),
    dimension({
      id: 'collision-avoidance',
      label: 'Existing postal namespace collision avoidance',
      score: input.collisionAvoidance?.collisionFree ? 1 : 0.25,
      weight: 0.08,
      evidence: [
        `strategy:${input.collisionAvoidance?.strategy || 'none'}`,
        input.collisionAvoidance?.recommendedDisplayCode ? `display:${input.collisionAvoidance.recommendedDisplayCode}` : 'display:none',
      ],
      improvementActions: input.collisionAvoidance?.collisionFree
        ? []
        : ['Add AGID prefix/suffix separation or block publication in mature postal namespaces.'],
    }),
    dimension({
      id: 'readability',
      label: 'Human readability and input-error resistance',
      score: input.readability?.score ?? 0.5,
      weight: 0.07,
      evidence: [
        `visible-length:${input.readability?.visibleLength ?? 'unknown'}`,
        `ambiguity-penalty:${input.readability?.ambiguityPenalty ?? 'unknown'}`,
      ],
      improvementActions: (input.readability?.score ?? 0.5) >= 0.75
        ? []
        : ['Use less ambiguous characters, shorter visible groups, separators, and Hamming-distance guards.'],
    }),
    dimension({
      id: 'migration-safety',
      label: 'Migration, reshaping, and backward-compatibility safety',
      score: input.reshapePlan.reversibleByAgid && input.operationalStatus.rationale.some(reason => reason.includes('backward') || reason.includes('draft') || reason.includes('official'))
        ? 1
        : input.reshapePlan.reversibleByAgid
          ? 0.82
          : 0.35,
      weight: 0.05,
      evidence: [
        input.reshapePlan.reversibleByAgid ? 'reversible-by-agid' : 'not-reversible',
        `migration-steps:${input.reshapePlan.migrationSteps.length}`,
        `operational-status:${input.operationalStatus.status}`,
      ],
      improvementActions: input.reshapePlan.reversibleByAgid
        ? []
        : ['Use AGID as the stable internal key and publish old-code to new-code alias mappings before reshaping.'],
    }),
  ];

  const totalWeight = dimensions.reduce((sum, item) => sum + item.weight, 0);
  const overallScore = Number((
    dimensions.reduce((sum, item) => sum + item.score * item.weight, 0)
    / Math.max(totalWeight, 0.0001)
  ).toFixed(3));
  const confidence = Number(Math.min(
    1,
    overallScore * 0.62
    + input.recommendation.confidence * 0.18
    + input.dataTrust.trustScore * 0.12
    + comparableFit * 0.08,
  ).toFixed(3));
  const grade = qualityGrade(overallScore, input.publication.status, hardBlocks);
  const failedDimensions = dimensions.filter(item => item.status !== 'pass');
  const nextActions = [
    ...failedDimensions.flatMap(item => item.improvementActions),
    input.publication.status !== 'publishable' ? `Resolve publication gate: ${input.publication.status}.` : null,
  ].filter(Boolean) as string[];

  return {
    systemName: AGID_POSTAL_CREATION_SYSTEM_NAME,
    systemNameJa: AGID_POSTAL_CREATION_SYSTEM_NAME_JA,
    aiName: AGID_POSTAL_CREATION_AI_NAME,
    aiNameJa: AGID_POSTAL_CREATION_AI_NAME_JA,
    aiVersion: AGID_POSTAL_CREATION_AI_VERSION,
    overallScore,
    confidence,
    grade,
    publishabilityCeiling: input.publication.status,
    dimensions,
    hardBlocks,
    nextActions: [...new Set(nextActions)],
    rationale: [
      'quality-is-weighted-over-classification-template-capacity-learning-governance-privacy-data-collision-readability-and-migration',
      `overall-score:${overallScore}`,
      `confidence:${confidence}`,
      `grade:${grade}`,
      `publishability-ceiling:${input.publication.status}`,
      hardBlocks.length ? `hard-blocks:${hardBlocks.join(',')}` : 'hard-blocks:none',
    ],
  };
}

export function buildAgidPostalDesignPlan(input: {
  profile: AgidPostalCountryProfile;
  agid?: string | null;
  templateId?: AgidPostalTemplateId;
  currentTemplateId?: AgidPostalTemplateId;
  length?: number;
}): AgidPostalDesignPlan {
  const classification = classifyAgidPostalCountry(input.profile);
  const countryLearning = learnAgidPostalCountryDesign(input.profile, classification);
  const recommendation = recommendAgidPostalTemplate(input.profile);
  const adaptiveHierarchy = recommendAgidPostalAdaptiveHierarchy(input.profile);
  const selectedTemplate = input.templateId || countryLearning.recommendedTemplateId || recommendation.templateId;
  const generationPolicy = buildAgidPostalGenerationPolicy({
    profile: input.profile,
    classification,
    templateId: selectedTemplate,
    requestedLength: input.length,
  });
  const generated = input.agid
    ? generateAgidPostalAreaCode({
      countryCode: input.profile.countryCode,
      agid: input.agid,
      templateId: selectedTemplate,
      addressFormat: input.profile.addressFormat,
      profile: input.profile,
      length: input.length,
    })
    : null;
  const estimate = estimateAgidPostalAreas(input.profile);
  const existence = evaluateAgidPostalExistenceCondition({
    zoneCount: estimate.suggestedPostalAreaCount,
    alphabetSize: AGID_HASH_ALPHABET.length,
    codeLength: generationPolicy.codeLength.effective,
  });
  const reshapePlan = planAgidPostalReshape(input.currentTemplateId || selectedTemplate, selectedTemplate);
  const governance = evaluateAgidPostalGovernance(input.profile);
  const privacy = evaluateAgidPostalPrivacy(input.profile, estimate);
  const dataTrust = evaluateAgidPostalDataTrust(input.profile);
  const collisionAvoidance = generated?.code
    ? evaluateAgidPostalCollisionAvoidance(input.profile, classification, generated.code)
    : generated?.collisionAvoidance || null;
  const readability = generated?.code ? evaluateAgidPostalReadability(generated.code) : generated?.readability || null;
  const publication = decideAgidPostalPublication({
    classification,
    generated,
    governance,
    privacy,
    dataTrust,
    collisionAvoidance,
  });
  const operationalStatus = decideAgidPostalOperationalStatus({
    generated: Boolean(generated?.ok),
    classification: classification.class,
    governanceApproved: governance.approved,
    dataTrusted: dataTrust.readyForPublication,
    privacySafe: privacy.publishable,
    governmentOfficial: publication.status === 'publishable',
    supplementaryToExistingPostal: classification.class === 'B',
    publicIssuerAvailable: governance.approved,
    backwardCompatibilityReady: true,
  });
  const qualityReport = evaluateAgidPostalAiQuality({
    classification,
    recommendation,
    existence,
    generated,
    reshapePlan,
    governance,
    privacy,
    dataTrust,
    collisionAvoidance,
    readability,
    publication,
    operationalStatus,
    countryLearning,
  });
  return {
    version: AGID_POSTAL_CODE_ENGINE_VERSION,
    classification,
    recommendation,
    adaptiveHierarchy,
    existence,
    generationPolicy,
    generated,
    estimate,
    reshapePlan,
    governance,
    privacy,
    dataTrust,
    collisionAvoidance,
    readability,
    publication,
    operationalStatus,
    countryLearning,
    qualityReport,
    learnedSystems: countryLearning.comparableSystems.map((system) => {
      const template = AGID_POSTAL_TEMPLATES[system.templateId];
      const reason = system.adoptedReasons.slice(0, 2).join('; ');
      return `${template.label}: ${system.basedOn} (${system.useAs}, fit:${system.fitScore}, ${reason})`;
    }),
    warnings: [
      classification.class === 'A' ? 'do-not-replace-mature-existing-postal-code' : undefined,
      generated && !generated.ok ? generated.blockedReason : undefined,
      publication.status !== 'publishable' ? `publication:${publication.status}` : undefined,
    ].filter(Boolean) as string[],
  };
}
