export const ADDRESS_MORPHISM_V2_CHAPTER5_CANDIDATE_POLICY_VERSION =
  'address-morphism-v2-chapter5-candidate-policy-v0.1';

export type SourcePolicyState = 'pass' | 'fail' | 'unknown';

export type CandidatePolicyState =
  | 'candidate_ready'
  | 'normalization_insufficient'
  | 'source_insufficient'
  | 'candidate_insufficient'
  | 'license_blocked'
  | 'stale_source'
  | 'privacy_blocked'
  | 'manual_review';

export type CandidatePolicyInput = {
  normalized: SourcePolicyState;
  coverageOk: SourcePolicyState;
  licenseOk: SourcePolicyState;
  freshnessOk: SourcePolicyState;
  privacyOk: SourcePolicyState;
  finiteCandidates: SourcePolicyState;
  candidateCount: number;
  maxCandidates: number;
  multilingualExpansionCount: number;
};

export type CandidatePolicyResult = {
  state: CandidatePolicyState;
  canEnterResolution: boolean;
  identityDecisionAllowed: false;
  reasons: string[];
};

export type CandidatePolicyRule = {
  id: string;
  formula: string;
  failureState: CandidatePolicyState;
};

export type CandidateCoverageScope = {
  purpose: 'delivery' | 'identity' | 'history' | 'emergency' | 'natural_feature' | 'zk_predicate';
  region: string;
  featureType:
    | 'administrative'
    | 'postal'
    | 'physical'
    | 'entrance'
    | 'unit'
    | 'road'
    | 'poi'
    | 'logistic'
    | 'natural'
    | 'cultural'
    | 'temporary'
    | 'vertical'
    | 'digital_twin';
};

export type CandidateCoverageCertificate = {
  scope: CandidateCoverageScope;
  state: CandidatePolicyState;
  canClaimCandidateSufficiency: boolean;
  canIssuePid: false;
  minimumRequiredGates: string[];
  sourceDebt: string[];
  nonClaims: string[];
};

export const CHAPTER5_CANDIDATE_POLICY_RULES: CandidatePolicyRule[] = [
  {
    id: 'normalization-required',
    formula: 'nu_t(s) must be defined before Gamma_t is used',
    failureState: 'normalization_insufficient',
  },
  {
    id: 'coverage-required',
    formula: 'CoverageOK_t(s,p)=1 is required before candidate sufficiency is claimed',
    failureState: 'source_insufficient',
  },
  {
    id: 'license-required',
    formula: 'LicenseOK_t(src(e),p)=1 is required for admissible evidence',
    failureState: 'license_blocked',
  },
  {
    id: 'freshness-required',
    formula: 'Fresh_t(src(e),p)=1 is required for current-purpose evidence',
    failureState: 'stale_source',
  },
  {
    id: 'privacy-required',
    formula: 'PrivacyOK_t(e,p)=1 is required before candidate evidence is exposed',
    failureState: 'privacy_blocked',
  },
  {
    id: 'finite-required',
    formula: '|C_t(s,p)| < infinity is required for downstream resolution',
    failureState: 'candidate_insufficient',
  },
];

export const CHAPTER5_SOURCE_POLICY_DIMENSIONS = [
  'license',
  'freshness',
  'coverage',
  'privacy',
  'traceability',
  'finite-candidate-budget',
] as const;

export function evaluateChapter5CandidatePolicy(input: CandidatePolicyInput): CandidatePolicyResult {
  const reasons: string[] = [];

  if (input.normalized !== 'pass') {
    reasons.push('normalization-required');
    return blocked('normalization_insufficient', reasons);
  }
  if (input.coverageOk !== 'pass') {
    reasons.push('coverage-required');
    return blocked('source_insufficient', reasons);
  }
  if (input.licenseOk !== 'pass') {
    reasons.push('license-required');
    return blocked('license_blocked', reasons);
  }
  if (input.freshnessOk !== 'pass') {
    reasons.push('freshness-required');
    return blocked('stale_source', reasons);
  }
  if (input.privacyOk !== 'pass') {
    reasons.push('privacy-required');
    return blocked('privacy_blocked', reasons);
  }
  if (input.finiteCandidates !== 'pass' || input.candidateCount <= 0) {
    reasons.push('finite-required');
    return blocked('candidate_insufficient', reasons);
  }
  if (input.candidateCount > input.maxCandidates) {
    reasons.push('candidate-budget-exceeded');
    return blocked('manual_review', reasons);
  }

  return {
    state: 'candidate_ready',
    canEnterResolution: true,
    identityDecisionAllowed: false,
    reasons,
  };
}

function blocked(state: CandidatePolicyState, reasons: string[]): CandidatePolicyResult {
  return {
    state,
    canEnterResolution: false,
    identityDecisionAllowed: false,
    reasons,
  };
}

export function buildChapter5CandidateCoverageCertificate(
  scope: CandidateCoverageScope,
  input: CandidatePolicyInput,
): CandidateCoverageCertificate {
  const result = evaluateChapter5CandidatePolicy(input);
  const sourceDebt = CHAPTER5_CANDIDATE_POLICY_RULES.filter(rule => result.reasons.includes(rule.id)).map(
    rule => rule.formula,
  );

  if (result.reasons.includes('candidate-budget-exceeded')) {
    sourceDebt.push('Candidate set exceeds the finite review budget and must be narrowed or manually reviewed');
  }

  return {
    scope,
    state: result.state,
    canClaimCandidateSufficiency: result.state === 'candidate_ready',
    canIssuePid: false,
    minimumRequiredGates: [...CHAPTER5_SOURCE_POLICY_DIMENSIONS],
    sourceDebt,
    nonClaims: [
      'candidate sufficiency does not prove referent identity',
      'candidate generation does not issue PID',
      'candidate generation does not prove delivery reachability',
      'candidate generation does not repair incomplete source coverage',
    ],
  };
}

export function multilingualExpansionImprovesRecallOnly(baseCandidateCount: number, expandedCandidateCount: number) {
  return {
    recallNotReduced: expandedCandidateCount >= baseCandidateCount,
    provesIdentity: false,
    formula:
      '|Gamma_t(Lambda_t(n),p)| may be >= |Gamma_t({n},p)|, but expansion membership does not imply referent equality',
  };
}

export function buildChapter5CandidatePolicyReport() {
  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER5_CANDIDATE_POLICY_VERSION,
    ruleCount: CHAPTER5_CANDIDATE_POLICY_RULES.length,
    sourcePolicyDimensionCount: CHAPTER5_SOURCE_POLICY_DIMENSIONS.length,
    rules: CHAPTER5_CANDIDATE_POLICY_RULES,
    safetyRule:
      'Candidate generation may enter downstream resolution only when normalization, coverage, license, freshness, privacy, and finite-candidate gates pass; it never directly proves identity.',
  };
}
