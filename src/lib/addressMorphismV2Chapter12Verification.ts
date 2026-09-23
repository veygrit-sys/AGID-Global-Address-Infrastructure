export const ADDRESS_MORPHISM_V2_CHAPTER12_VERIFICATION_VERSION =
  'address-morphism-v2-chapter12-verification-benchmark-limits-v0.1';

export type Chapter12ClaimStatus = 'verified' | 'partial' | 'unverified' | 'blocked';

export type Chapter12Priority = 'S' | 'A' | 'B' | 'C';

export type Chapter12BenchmarkDomain =
  | 'normalization'
  | 'candidate_generation'
  | 'structural_equivalence'
  | 'safe_resolution'
  | 'history_graph'
  | 'privacy_boundary'
  | 'cross_domain_reference'
  | 'end_to_end_protocol';

export type Chapter12Claim = {
  id: string;
  text: string;
  scope: 'case_study' | 'regional' | 'multi_region' | 'global';
  status: Chapter12ClaimStatus;
  artifacts: string[];
  tests: string[];
  nonClaims: string[];
  residualRisks: string[];
  containsRawAddressOrSecret?: boolean;
  universalWording?: boolean;
  hasGlobalEvidence?: boolean;
};

export type Chapter12ClaimEvaluation = {
  status: Chapter12ClaimStatus;
  publishable: boolean;
  nonClaimsRequired: boolean;
  reasons: string[];
};

export type Chapter12BenchmarkCase = {
  id: string;
  domain: Chapter12BenchmarkDomain;
  fixtureCount: number;
  regionCount: number;
  hasSyntheticFixtures: boolean;
  hasSourcePolicy: boolean;
  hasBaseline: boolean;
  hasFailureModes: boolean;
  rawAddressFree: boolean;
  hasNonClaims: boolean;
};

export type Chapter12BenchmarkReadiness = {
  score: number;
  state: 'ready' | 'partial' | 'blocked';
  missing: string[];
};

export type Chapter12FairComparison = {
  sameDataset: boolean;
  sameMetrics: boolean;
  samePurpose: boolean;
  sameFailureTaxonomy: boolean;
  sameDisclosureBoundary: boolean;
};

export type Chapter12RiskItem = {
  id: string;
  priority: Chapter12Priority;
  item: string;
  safeWording: string;
  decomposedByRegionPurposeSourceFailure: {
    region: boolean;
    purpose: boolean;
    dataSource: boolean;
    failureBehavior: boolean;
  };
};

export type Chapter12RiskEvaluation = {
  publishable: boolean;
  reasons: string[];
};

const unsafeUniversalPhrases = [
  'all addresses',
  'global completeness',
  'world first',
  'fully secure',
  'complete zk system',
  'commercial api replacement',
  '完全',
  '全世界',
  'すべて',
  '世界初',
  '完全安全',
  '商用api不要',
];

export function buildChapter12VerificationReport(): {
  version: string;
  executableModelKinds: string[];
  publicationSafetyRule: string;
  preservedNonClaims: string[];
} {
  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER12_VERIFICATION_VERSION,
    executableModelKinds: [
      'verification map',
      'claim status classifier',
      'benchmark readiness scorer',
      'unsafe universal wording detector',
      'non-claim requirement gate',
      'raw address fixture blocker',
      'fair comparison gate',
      'S-priority risk register',
      'case study boundary checker',
      'publication safety gate',
    ],
    publicationSafetyRule:
      'A claim is publishable only when its scope, fixtures, tests, non-claims, and residual risks are explicit.',
    preservedNonClaims: [
      'AMT does not claim global completeness for all addresses.',
      'AMT does not claim ZK repairs bad address resolution.',
      'AMT does not claim superiority over commercial validators without same-condition benchmarks.',
      'AMT does not claim political sovereignty or ownership decisions.',
      'AMT does not publish raw address, recipient, witness, private-key, or proof-secret fixtures.',
    ],
  };
}

export function detectChapter12UnsafeUniversalWording(text: string): boolean {
  const normalized = text.toLowerCase();
  return unsafeUniversalPhrases.some(phrase => normalized.includes(phrase.toLowerCase()));
}

export function evaluateChapter12Claim(claim: Chapter12Claim): Chapter12ClaimEvaluation {
  const reasons: string[] = [];
  const inferredUniversalWording =
    claim.universalWording === true || detectChapter12UnsafeUniversalWording(claim.text);

  if (claim.containsRawAddressOrSecret) {
    reasons.push('raw-address-or-secret-in-artifact');
  }
  if (inferredUniversalWording && claim.scope === 'global' && !claim.hasGlobalEvidence) {
    reasons.push('unsafe-universal-wording-without-global-evidence');
  }
  if (claim.nonClaims.length === 0) {
    reasons.push('missing-non-claims');
  }
  if (claim.residualRisks.length === 0) {
    reasons.push('missing-residual-risks');
  }
  if (claim.status === 'verified' && (claim.artifacts.length === 0 || claim.tests.length === 0)) {
    reasons.push('verified-claim-without-artifact-or-test');
  }

  if (reasons.includes('raw-address-or-secret-in-artifact') || reasons.includes('unsafe-universal-wording-without-global-evidence')) {
    return {
      status: 'blocked',
      publishable: false,
      nonClaimsRequired: true,
      reasons,
    };
  }

  if (claim.status === 'verified' && reasons.length === 0) {
    return {
      status: 'verified',
      publishable: true,
      nonClaimsRequired: false,
      reasons,
    };
  }

  if (claim.artifacts.length > 0 || claim.tests.length > 0 || claim.scope === 'case_study') {
    return {
      status: 'partial',
      publishable: claim.nonClaims.length > 0 && claim.residualRisks.length > 0,
      nonClaimsRequired: claim.nonClaims.length === 0,
      reasons,
    };
  }

  return {
    status: 'unverified',
    publishable: false,
    nonClaimsRequired: claim.nonClaims.length === 0,
    reasons,
  };
}

export function scoreChapter12BenchmarkReadiness(testCase: Chapter12BenchmarkCase): Chapter12BenchmarkReadiness {
  const missing: string[] = [];

  if (!testCase.rawAddressFree) {
    return {
      score: 0,
      state: 'blocked',
      missing: ['raw-address-free-fixtures'],
    };
  }
  if (testCase.fixtureCount <= 0) {
    missing.push('fixtures');
  }
  if (testCase.regionCount <= 0) {
    missing.push('regions');
  }
  if (!testCase.hasSyntheticFixtures) {
    missing.push('synthetic-fixtures');
  }
  if (!testCase.hasSourcePolicy) {
    missing.push('source-policy');
  }
  if (!testCase.hasBaseline) {
    missing.push('baseline');
  }
  if (!testCase.hasFailureModes) {
    missing.push('failure-modes');
  }
  if (!testCase.hasNonClaims) {
    missing.push('non-claims');
  }

  const checks = [
    testCase.fixtureCount > 0,
    testCase.regionCount > 0,
    testCase.hasSyntheticFixtures,
    testCase.hasSourcePolicy,
    testCase.hasBaseline,
    testCase.hasFailureModes,
    testCase.hasNonClaims,
  ];
  const score = checks.filter(Boolean).length / checks.length;

  return {
    score,
    state: score === 1 ? 'ready' : 'partial',
    missing,
  };
}

export function isChapter12FairComparison(comparison: Chapter12FairComparison): boolean {
  return (
    comparison.sameDataset &&
    comparison.sameMetrics &&
    comparison.samePurpose &&
    comparison.sameFailureTaxonomy &&
    comparison.sameDisclosureBoundary
  );
}

export function evaluateChapter12RiskItem(item: Chapter12RiskItem): Chapter12RiskEvaluation {
  const reasons: string[] = [];
  const axes = item.decomposedByRegionPurposeSourceFailure;

  if (item.priority === 'S' && item.safeWording.trim().length === 0) {
    reasons.push('missing-safe-wording');
  }
  if (!axes.region) {
    reasons.push('missing-region-axis');
  }
  if (!axes.purpose) {
    reasons.push('missing-purpose-axis');
  }
  if (!axes.dataSource) {
    reasons.push('missing-data-source-axis');
  }
  if (!axes.failureBehavior) {
    reasons.push('missing-failure-behavior-axis');
  }
  if (detectChapter12UnsafeUniversalWording(item.item) && item.safeWording.trim().length === 0) {
    reasons.push('unsafe-risk-wording-without-safe-alternative');
  }

  return {
    publishable: reasons.length === 0,
    reasons,
  };
}

export function buildChapter12PublicationSafetyGate(claims: Chapter12Claim[]): {
  publishable: boolean;
  blockedClaimIds: string[];
  partialClaimIds: string[];
  unverifiedClaimIds: string[];
} {
  const evaluations = claims.map(claim => ({
    claim,
    evaluation: evaluateChapter12Claim(claim),
  }));

  return {
    publishable: evaluations.every(item => item.evaluation.publishable && item.evaluation.status !== 'blocked'),
    blockedClaimIds: evaluations.filter(item => item.evaluation.status === 'blocked').map(item => item.claim.id),
    partialClaimIds: evaluations.filter(item => item.evaluation.status === 'partial').map(item => item.claim.id),
    unverifiedClaimIds: evaluations.filter(item => item.evaluation.status === 'unverified').map(item => item.claim.id),
  };
}
