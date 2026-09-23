import type { AddressFormat } from '../data/address_formats';
import type { AddressDetails } from '../types/address';
import {
  analyzeAddress,
  type AddressAnalysis,
  type CanonicalAddressParts,
} from './addressIntelligence';
import {
  createInitialAddressFeedbackModel,
  describeAddressFeedbackAction,
  loadAddressFeedbackModel,
  type AddressFeedbackAction,
  type AddressFeedbackModel,
} from './addressFeedbackLearning';
import {
  scoreAddressTabs,
  type AddressTabQualityScore,
} from './addressTabQuality';
import {
  validateAddressWithOpenSourceRules,
  type AddressValidationResult,
} from './addressValidation';

export const AGID_ADDRESS_INTELLIGENCE_ENGINE_VERSION =
  'agid-address-intelligence-engine-v1';

export type AgidAddressIntelligenceDecision =
  | 'accept'
  | 'warn'
  | 'reverify'
  | 'reject';

export type AgidDeliveryEligibilityDecision =
  | 'deliverable'
  | 'needs-review'
  | 'undeliverable';

export type AgidAddressIntelligenceAction =
  | 'use-current-display'
  | 'switch-language-tab'
  | 'collect-postal-code'
  | 'collect-street-or-house'
  | 'collect-building-or-poi'
  | 'run-postal-lookup'
  | 'run-geocode-reverification'
  | 'manual-review'
  | 'do-not-overwrite-user-input';

export type AgidAddressCandidate = {
  id: string;
  label?: string;
  displayText?: string;
  apiAddress?: Record<string, unknown>;
  details?: AddressDetails | Record<string, unknown> | null;
  countryCode?: string | null;
  sources?: string[];
  validation?: AddressValidationResult | null;
  isSea?: boolean;
};

export type AgidAddressCandidateRank = {
  candidate: AgidAddressCandidate;
  analysis: AddressAnalysis;
  validation: AddressValidationResult;
  score: number;
  rank: number;
  reasons: string[];
};

export type AgidAddressIntelligenceInput = {
  agid?: string;
  addressText?: string;
  apiAddress?: Record<string, unknown>;
  details?: AddressDetails | Record<string, unknown> | null;
  countryCode?: string | null;
  format?: AddressFormat | null;
  sources?: string[];
  isSea?: boolean;
  selectedLanguageTab?: string;
  languageTabs?: string[];
  displayTextByTab?: Record<string, string | undefined>;
  validation?: AddressValidationResult | null;
  candidates?: AgidAddressCandidate[];
  feedbackModel?: AddressFeedbackModel | null;
};

export type AgidAddressIntelligenceResult = {
  engineVersion: typeof AGID_ADDRESS_INTELLIGENCE_ENGINE_VERSION;
  model: {
    name: 'AGID Address Intelligence Engine';
    kind: 'local-contextual-bandit-and-rule-ensemble';
    feedbackModelVersion: AddressFeedbackModel['version'];
    samples: number;
  };
  canonicalAddress: CanonicalAddressParts;
  analysis: AddressAnalysis;
  validation: AddressValidationResult;
  qualityByTab: Record<string, AddressTabQualityScore>;
  selectedTab?: string;
  recommendedTab?: string;
  decision: AgidAddressIntelligenceDecision;
  confidence: number;
  delivery: {
    decision: AgidDeliveryEligibilityDecision;
    reasons: string[];
  };
  rendering: {
    selectedTab?: string;
    recommendedTab?: string;
    shouldSwitchTab: boolean;
    shouldWarnOperator: boolean;
    languageSwitchChangesDisplay: boolean;
    reasons: string[];
  };
  learning: {
    mode: 'closed-local-first';
    recommendedFeedbackActions: Array<{
      action: AddressFeedbackAction;
      reason: string;
    }>;
  };
  candidateRanks: AgidAddressCandidateRank[];
  actions: AgidAddressIntelligenceAction[];
  audit: Array<{
    step:
      | 'normalize'
      | 'validate'
      | 'score-language-tabs'
      | 'rank-candidates'
      | 'delivery'
      | 'learning';
    status: 'ok' | 'warning' | 'failed';
    message: string;
  }>;
};

const clean = (value: unknown) =>
  String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();

const clamp01 = (value: number) =>
  Math.max(0, Math.min(1, Math.round(value * 100) / 100));

const unique = <T>(values: T[]) => Array.from(new Set(values.filter(Boolean)));

function normalizeCountryCode(value: unknown) {
  const code = clean(value).toUpperCase().replace(/[^A-Z]/g, '');
  return code === 'UK' ? 'GB' : code;
}

function sourceStrength(sources: string[]) {
  const sourceText = sources.join(' ').toLowerCase();
  let score = Math.min(0.14, sources.length * 0.035);
  if (/official|postal|post|openaddresses|nominatim|osm|geonames/.test(sourceText)) score += 0.08;
  if (/authoritative|government|national|registry/.test(sourceText)) score += 0.08;
  return clamp01(score);
}

function hasField(address: CanonicalAddressParts, key: keyof CanonicalAddressParts) {
  return Boolean(clean(address[key]));
}

function completeness(address: CanonicalAddressParts, feedbackModel: AddressFeedbackModel) {
  const reliabilities = feedbackModel.fieldReliability || {};
  const fields: Array<[keyof CanonicalAddressParts, number, string]> = [
    ['country_code', 0.1, 'country'],
    ['postcode', 0.16, 'postcode'],
    ['state', 0.08, 'state'],
    ['city', 0.14, 'city'],
    ['road', 0.17, 'street'],
    ['house_number', 0.14, 'street'],
    ['building', 0.1, 'building'],
    ['poi', 0.08, 'building'],
    ['plus_code', 0.03, 'geography'],
  ];

  return clamp01(
    fields.reduce((total, [key, weight, reliabilityKey]) => {
      if (!hasField(address, key)) return total;
      const reliability = reliabilities[reliabilityKey] ?? 0.5;
      return total + weight * (0.75 + reliability * 0.5);
    }, 0),
  );
}

function mergeDetails(
  apiAddress?: Record<string, unknown>,
  details?: AddressDetails | Record<string, unknown> | null,
) {
  return {
    ...(details || {}),
    ...(apiAddress || {}),
  };
}

function buildAnalysis(input: {
  apiAddress?: Record<string, unknown>;
  details?: AddressDetails | Record<string, unknown> | null;
  addressText?: string;
  sources?: string[];
}) {
  return analyzeAddress({
    apiAddress: mergeDetails(input.apiAddress, input.details),
    displayName: input.addressText || clean((input.details as Record<string, unknown> | null | undefined)?.display_name),
    sources: input.sources || [],
  });
}

function buildValidation(
  canonicalAddress: CanonicalAddressParts,
  input: Pick<AgidAddressIntelligenceInput, 'format' | 'sources' | 'validation'>,
) {
  return input.validation || validateAddressWithOpenSourceRules(
    canonicalAddress,
    input.format || null,
    unique([...(input.sources || []), AGID_ADDRESS_INTELLIGENCE_ENGINE_VERSION]),
  );
}

function availableTabs(input: AgidAddressIntelligenceInput) {
  return unique([
    ...(input.languageTabs || []),
    ...Object.keys(input.displayTextByTab || {}),
    input.selectedLanguageTab || '',
  ]);
}

function recommendedTabFor(qualityByTab: Record<string, AddressTabQualityScore>, selectedTab?: string) {
  const sorted = Object.values(qualityByTab)
    .filter(quality => quality.shouldDisplay)
    .sort((a, b) => b.score - a.score);
  return sorted[0]?.tab || selectedTab;
}

function selectedTabQuality(
  qualityByTab: Record<string, AddressTabQualityScore>,
  selectedTab?: string,
  recommendedTab?: string,
) {
  return selectedTab ? qualityByTab[selectedTab] : recommendedTab ? qualityByTab[recommendedTab] : undefined;
}

function decisionFrom({
  confidence,
  validation,
  tabQuality,
}: {
  confidence: number;
  validation: AddressValidationResult;
  tabQuality?: AddressTabQualityScore;
}): AgidAddressIntelligenceDecision {
  if (tabQuality?.decision === 'hide' || confidence < 0.35) return 'reject';
  if (tabQuality?.decision === 'reverify' || validation.postalCodeValid === false || confidence < 0.55) return 'reverify';
  if (tabQuality?.decision === 'warn' || validation.status === 'partial' || confidence < 0.75) return 'warn';
  return 'accept';
}

function deliveryDecision({
  decision,
  canonicalAddress,
  validation,
  isSea,
  tabQuality,
}: {
  decision: AgidAddressIntelligenceDecision;
  canonicalAddress: CanonicalAddressParts;
  validation: AddressValidationResult;
  isSea?: boolean;
  tabQuality?: AddressTabQualityScore;
}) {
  const reasons: string[] = [];
  const hasDeliveryAnchor =
    hasField(canonicalAddress, 'road') ||
    hasField(canonicalAddress, 'building') ||
    hasField(canonicalAddress, 'poi') ||
    hasField(canonicalAddress, 'plus_code');

  if (isSea && !hasField(canonicalAddress, 'poi') && !hasField(canonicalAddress, 'plus_code')) {
    reasons.push('marine or water context needs a named feature, route, port, or coordinate anchor');
  }
  if (validation.missingRequiredFields.length) {
    reasons.push(`missing required fields: ${validation.missingRequiredFields.join(', ')}`);
  }
  if (!hasDeliveryAnchor) {
    reasons.push('delivery anchor is missing: street, building, POI, or plus code');
  }
  if (tabQuality?.needsReverification) {
    reasons.push('selected address display needs re-verification');
  }

  if (decision === 'reject') {
    return { decision: 'undeliverable' as const, reasons: unique(reasons.length ? reasons : ['address evidence is too weak']) };
  }
  if (decision === 'accept' && hasDeliveryAnchor && !reasons.length) {
    return { decision: 'deliverable' as const, reasons: ['address evidence is strong enough for normal handoff'] };
  }
  return { decision: 'needs-review' as const, reasons: unique(reasons.length ? reasons : ['operator review is recommended before delivery']) };
}

function languageSwitchChangesDisplay(input: AgidAddressIntelligenceInput, selectedTab?: string, recommendedTab?: string) {
  if (!selectedTab || !recommendedTab || selectedTab === recommendedTab) return false;
  const selected = clean(input.displayTextByTab?.[selectedTab]);
  const recommended = clean(input.displayTextByTab?.[recommendedTab]);
  return Boolean(selected && recommended && selected !== recommended);
}

function learningActions(
  canonicalAddress: CanonicalAddressParts,
  selectedQuality: AddressTabQualityScore | undefined,
  feedbackModel: AddressFeedbackModel,
): Array<{ action: AddressFeedbackAction; reason: string }> {
  const actions: AddressFeedbackAction[] = [];
  const naturalOrRemoteContext = Boolean(
    selectedQuality &&
      [
        'water',
        'mountain',
        'desert',
        'sparse_natural',
        'island',
        'polar',
        'remote',
      ].includes(selectedQuality.environment),
  );
  if (!hasField(canonicalAddress, 'postcode') || selectedQuality?.reasons.some(reason => /postal/i.test(reason))) {
    actions.push('boost-postal-evidence');
  }
  if (naturalOrRemoteContext || (!hasField(canonicalAddress, 'building') && !hasField(canonicalAddress, 'poi'))) {
    actions.push('boost-map-feature');
  }
  if (selectedQuality?.needsReverification) actions.push('queue-reverification');
  if (selectedQuality?.decision === 'hide' || selectedQuality?.decision === 'reverify') {
    actions.push('require-manual-review');
  }
  if (selectedQuality?.decision === 'warn') actions.push('penalize-current-display');

  return unique(actions.length ? actions : ['boost-current-language' as AddressFeedbackAction]).map(action => ({
    action,
    reason: describeAddressFeedbackAction(action),
  })).slice(0, 4);
}

function engineActions({
  canonicalAddress,
  validation,
  decision,
  selectedTab,
  recommendedTab,
  deliveryDecisionValue,
}: {
  canonicalAddress: CanonicalAddressParts;
  validation: AddressValidationResult;
  decision: AgidAddressIntelligenceDecision;
  selectedTab?: string;
  recommendedTab?: string;
  deliveryDecisionValue: AgidDeliveryEligibilityDecision;
}): AgidAddressIntelligenceAction[] {
  const actions: AgidAddressIntelligenceAction[] = [];

  if (selectedTab && recommendedTab && selectedTab !== recommendedTab) actions.push('switch-language-tab');
  if (!hasField(canonicalAddress, 'postcode')) actions.push('collect-postal-code');
  if (!hasField(canonicalAddress, 'road') && !hasField(canonicalAddress, 'house_number')) actions.push('collect-street-or-house');
  if (!hasField(canonicalAddress, 'building') && !hasField(canonicalAddress, 'poi')) actions.push('collect-building-or-poi');
  if (validation.quality.mode === 'partial-postal') actions.push('run-postal-lookup');
  if (decision === 'reverify') actions.push('run-geocode-reverification');
  if (deliveryDecisionValue !== 'deliverable' || decision === 'warn' || decision === 'reject') actions.push('manual-review');
  if (validation.quality.shouldOverwriteUserInput === false) actions.push('do-not-overwrite-user-input');
  if (!actions.length) actions.push('use-current-display');

  return unique(actions);
}

function rankOneCandidate(
  candidate: AgidAddressCandidate,
  rankInput: Pick<AgidAddressIntelligenceInput, 'format'>,
  feedbackModel: AddressFeedbackModel,
): Omit<AgidAddressCandidateRank, 'rank'> {
  const sources = candidate.sources || [];
  const analysis = buildAnalysis({
    apiAddress: candidate.apiAddress,
    details: candidate.details || null,
    addressText: candidate.displayText,
    sources,
  });
  const validation = candidate.validation || validateAddressWithOpenSourceRules(
    analysis.canonical,
    rankInput.format || null,
    unique([...sources, AGID_ADDRESS_INTELLIGENCE_ENGINE_VERSION]),
  );
  const fieldCompleteness = completeness(analysis.canonical, feedbackModel);
  const score = clamp01(
    analysis.confidence * 0.28 +
      validation.score * 0.28 +
      fieldCompleteness * 0.24 +
      sourceStrength(validation.checkedWith.concat(sources)) * 0.12 +
      (candidate.isSea ? -0.04 : 0.04),
  );
  const reasons = unique([
    validation.status === 'verified' ? 'validation verified' : 'validation is partial',
    fieldCompleteness >= 0.75 ? 'core address fields are present' : 'core address fields are incomplete',
    sourceStrength(validation.checkedWith.concat(sources)) >= 0.12 ? 'source evidence is useful' : 'source evidence is limited',
  ]);

  return {
    candidate,
    analysis,
    validation,
    score,
    reasons,
  };
}

export function rankAgidAddressCandidates(
  candidates: AgidAddressCandidate[],
  input: Pick<AgidAddressIntelligenceInput, 'format' | 'feedbackModel'> = {},
) {
  const feedbackModel = input.feedbackModel || createInitialAddressFeedbackModel();
  return candidates
    .map(candidate => rankOneCandidate(candidate, input, feedbackModel))
    .sort((a, b) => b.score - a.score)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

export function evaluateAgidAddressIntelligence(
  input: AgidAddressIntelligenceInput,
): AgidAddressIntelligenceResult {
  const feedbackModel = input.feedbackModel || loadAddressFeedbackModel();
  const sources = unique(input.sources || []);
  const analysis = buildAnalysis({
    apiAddress: input.apiAddress,
    details: input.details || null,
    addressText: input.addressText,
    sources,
  });
  const resolvedCountry = normalizeCountryCode(
    input.countryCode || analysis.canonical.country_code || (input.details as Record<string, unknown> | null | undefined)?.country_code,
  );
  const canonicalAddress = {
    ...analysis.canonical,
    country_code: analysis.canonical.country_code || resolvedCountry.toLowerCase() || undefined,
  };
  const validation = buildValidation(canonicalAddress, {
    ...input,
    sources: unique([...sources, ...analysis.sources]),
  });
  const tabs = availableTabs(input);
  const qualityByTab = tabs.length
    ? scoreAddressTabs(tabs, {
        countryCode: resolvedCountry || canonicalAddress.country_code,
        format: input.format || null,
        validation,
        details: mergeDetails(input.apiAddress, input.details || null),
        isSea: input.isSea,
        sources: unique([...sources, ...validation.checkedWith]),
        displayTextByTab: input.displayTextByTab || Object.fromEntries(
          tabs.map(tab => [tab, tab === input.selectedLanguageTab ? input.addressText : undefined]),
        ),
      })
    : {};
  const selectedTab = input.selectedLanguageTab || tabs[0];
  const recommendedTab = recommendedTabFor(qualityByTab, selectedTab);
  const tabQuality = selectedTabQuality(qualityByTab, selectedTab, recommendedTab);
  const fieldCompleteness = completeness(canonicalAddress, feedbackModel);
  const tabConfidence = tabQuality ? tabQuality.score / 100 : 0.55;
  const confidence = clamp01(
    analysis.confidence * 0.24 +
      validation.score * 0.3 +
      fieldCompleteness * 0.24 +
      tabConfidence * 0.14 +
      sourceStrength(unique([...sources, ...validation.checkedWith])) * 0.08,
  );
  const decision = decisionFrom({ confidence, validation, tabQuality });
  const delivery = deliveryDecision({
    decision,
    canonicalAddress,
    validation,
    isSea: input.isSea,
    tabQuality,
  });
  const candidateRanks = rankAgidAddressCandidates(input.candidates || [], {
    format: input.format || null,
    feedbackModel,
  });
  const shouldSwitchTab = Boolean(selectedTab && recommendedTab && selectedTab !== recommendedTab);
  const languageChanges = languageSwitchChangesDisplay(input, selectedTab, recommendedTab);
  const renderingReasons = unique([
    shouldSwitchTab ? `recommended tab ${recommendedTab} has stronger address evidence than ${selectedTab}` : 'selected tab is acceptable',
    tabQuality?.reasons[0] || '',
  ]);
  const actions = engineActions({
    canonicalAddress,
    validation,
    decision,
    selectedTab,
    recommendedTab,
    deliveryDecisionValue: delivery.decision,
  });

  return {
    engineVersion: AGID_ADDRESS_INTELLIGENCE_ENGINE_VERSION,
    model: {
      name: 'AGID Address Intelligence Engine',
      kind: 'local-contextual-bandit-and-rule-ensemble',
      feedbackModelVersion: feedbackModel.version,
      samples: feedbackModel.samples,
    },
    canonicalAddress,
    analysis,
    validation,
    qualityByTab,
    selectedTab,
    recommendedTab,
    decision,
    confidence,
    delivery,
    rendering: {
      selectedTab,
      recommendedTab,
      shouldSwitchTab,
      shouldWarnOperator: decision !== 'accept',
      languageSwitchChangesDisplay: languageChanges,
      reasons: renderingReasons,
    },
    learning: {
      mode: 'closed-local-first',
      recommendedFeedbackActions: learningActions(canonicalAddress, tabQuality, feedbackModel),
    },
    candidateRanks,
    actions,
    audit: [
      {
        step: 'normalize',
        status: Object.keys(canonicalAddress).length ? 'ok' : 'warning',
        message: `Canonical address has ${Object.keys(canonicalAddress).length} field(s).`,
      },
      {
        step: 'validate',
        status: validation.status === 'verified' ? 'ok' : 'warning',
        message: `Validation status is ${validation.status}.`,
      },
      {
        step: 'score-language-tabs',
        status: Object.keys(qualityByTab).length ? 'ok' : 'warning',
        message: Object.keys(qualityByTab).length
          ? `Scored ${Object.keys(qualityByTab).length} language tab(s).`
          : 'No language tabs were supplied.',
      },
      {
        step: 'rank-candidates',
        status: candidateRanks.length ? 'ok' : 'warning',
        message: candidateRanks.length
          ? `Ranked ${candidateRanks.length} candidate(s).`
          : 'No alternative candidates were supplied.',
      },
      {
        step: 'delivery',
        status: delivery.decision === 'deliverable' ? 'ok' : delivery.decision === 'needs-review' ? 'warning' : 'failed',
        message: `Delivery decision is ${delivery.decision}.`,
      },
      {
        step: 'learning',
        status: 'ok',
        message: `Using ${feedbackModel.version} with ${feedbackModel.samples} local sample(s).`,
      },
    ],
  };
}
