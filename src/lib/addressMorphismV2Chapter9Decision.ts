export const ADDRESS_MORPHISM_V2_CHAPTER9_DECISION_VERSION =
  'address-morphism-v2-chapter9-decision-v0.1';

export type Chapter9DecisionState = 'accept' | 'manual_review' | 'unresolved' | 'blocked';

export type Chapter9CandidateSignal = {
  id: string;
  energy: number;
  priorProbability: number;
  quality: number;
  reputation: number;
  freshness: number;
  uncertainty: number;
  purposeLoss: number;
};

export type Chapter9Posterior = {
  id: string;
  probability: number;
};

export type Chapter9DecisionThresholds = {
  temperature: number;
  minPosteriorGap: number;
  maxEntropy: number;
  minQuality: number;
  minReputation: number;
  minFreshness: number;
  maxUncertainty: number;
};

export type Chapter9DecisionCertificate = {
  state: Chapter9DecisionState;
  selectedCandidateId?: string;
  posteriors: Chapter9Posterior[];
  entropy: number;
  posteriorGap: number;
  expectedLoss: number;
  reasons: string[];
  nonClaims: string[];
};

export type Chapter9ReputationState = {
  alpha: number;
  beta: number;
};

export function buildChapter9DecisionReport() {
  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER9_DECISION_VERSION,
    executableModelKinds: [
      'Gibbs posterior distribution',
      'MAP candidate selection',
      'Shannon entropy',
      'ambiguity reduction',
      'quality threshold gate',
      'reputation update',
      'purpose-relative expected loss',
      'decision certificate',
      'probability non-repair boundary',
    ],
    safetyRule:
      'Probability, quality, reputation, and entropy inform decisions but do not replace candidate sufficiency, safe resolution, PID issuance, or privacy gates.',
  };
}

export function computeChapter9GibbsPosteriors(
  candidates: Chapter9CandidateSignal[],
  temperature: number,
): Chapter9Posterior[] {
  if (temperature <= 0) {
    throw new Error('temperature must be positive');
  }
  if (candidates.length === 0) return [];

  const minEnergy = Math.min(...candidates.map(candidate => candidate.energy));
  const unnormalized = candidates.map(candidate => {
    const prior = Math.max(0, candidate.priorProbability);
    return {
      id: candidate.id,
      weight: prior * Math.exp(-(candidate.energy - minEnergy) / temperature),
    };
  });
  const total = unnormalized.reduce((sum, entry) => sum + entry.weight, 0);

  if (total <= 0) {
    const probability = 1 / candidates.length;
    return candidates.map(candidate => ({ id: candidate.id, probability: round(probability) }));
  }

  return unnormalized
    .map(entry => ({ id: entry.id, probability: round(entry.weight / total) }))
    .sort((left, right) => right.probability - left.probability || left.id.localeCompare(right.id));
}

export function computeChapter9Entropy(posteriors: Chapter9Posterior[]): number {
  return round(
    posteriors.reduce((entropy, posterior) => {
      if (posterior.probability <= 0) return entropy;
      return entropy - posterior.probability * Math.log2(posterior.probability);
    }, 0),
  );
}

export function computeChapter9AmbiguityReduction(before: Chapter9Posterior[], after: Chapter9Posterior[]): number {
  return round(computeChapter9Entropy(before) - computeChapter9Entropy(after));
}

export function selectChapter9MapCandidate(posteriors: Chapter9Posterior[]): Chapter9Posterior | undefined {
  return [...posteriors].sort((left, right) => right.probability - left.probability || left.id.localeCompare(right.id))[0];
}

export function computeChapter9ExpectedLoss(
  posteriors: Chapter9Posterior[],
  candidateLosses: Record<string, number>,
): number {
  return round(
    posteriors.reduce((loss, posterior) => loss + posterior.probability * (candidateLosses[posterior.id] ?? 1), 0),
  );
}

export function decideChapter9Candidate(
  candidates: Chapter9CandidateSignal[],
  thresholds: Chapter9DecisionThresholds,
): Chapter9DecisionCertificate {
  const nonClaims = [
    'MAP candidate is not global truth',
    'low entropy does not prove candidate completeness',
    'high quality does not imply PID issuance',
    'probability cannot repair missing candidates',
  ];

  if (candidates.length === 0) {
    return {
      state: 'unresolved',
      posteriors: [],
      entropy: 0,
      posteriorGap: 0,
      expectedLoss: 0,
      reasons: ['no-candidates'],
      nonClaims,
    };
  }

  const posteriors = computeChapter9GibbsPosteriors(candidates, thresholds.temperature);
  const entropy = computeChapter9Entropy(posteriors);
  const selected = selectChapter9MapCandidate(posteriors);
  const second = posteriors[1];
  const posteriorGap = round((selected?.probability ?? 0) - (second?.probability ?? 0));
  const selectedCandidate = candidates.find(candidate => candidate.id === selected?.id);
  const expectedLoss = computeChapter9ExpectedLoss(
    posteriors,
    Object.fromEntries(candidates.map(candidate => [candidate.id, candidate.purposeLoss])),
  );

  if (!selected || !selectedCandidate) {
    return {
      state: 'unresolved',
      posteriors,
      entropy,
      posteriorGap,
      expectedLoss,
      reasons: ['map-candidate-missing'],
      nonClaims,
    };
  }

  if (entropy > thresholds.maxEntropy) {
    return certificate('manual_review', selected.id, posteriors, entropy, posteriorGap, expectedLoss, [
      'entropy-above-threshold',
    ]);
  }
  if (posteriorGap < thresholds.minPosteriorGap) {
    return certificate('manual_review', selected.id, posteriors, entropy, posteriorGap, expectedLoss, [
      'posterior-gap-below-threshold',
    ]);
  }
  if (selectedCandidate.quality < thresholds.minQuality) {
    return certificate('manual_review', selected.id, posteriors, entropy, posteriorGap, expectedLoss, [
      'quality-below-threshold',
    ]);
  }
  if (selectedCandidate.reputation < thresholds.minReputation) {
    return certificate('manual_review', selected.id, posteriors, entropy, posteriorGap, expectedLoss, [
      'reputation-below-threshold',
    ]);
  }
  if (selectedCandidate.freshness < thresholds.minFreshness) {
    return certificate('unresolved', selected.id, posteriors, entropy, posteriorGap, expectedLoss, [
      'freshness-below-threshold',
    ]);
  }
  if (selectedCandidate.uncertainty > thresholds.maxUncertainty) {
    return certificate('manual_review', selected.id, posteriors, entropy, posteriorGap, expectedLoss, [
      'uncertainty-above-threshold',
    ]);
  }

  return certificate('accept', selected.id, posteriors, entropy, posteriorGap, expectedLoss, []);
}

export function updateChapter9Reputation(
  state: Chapter9ReputationState,
  outcome: 'success' | 'failure',
  weight = 1,
): Chapter9ReputationState {
  if (weight < 0) {
    throw new Error('reputation update weight must be non-negative');
  }

  return {
    alpha: outcome === 'success' ? round(state.alpha + weight) : state.alpha,
    beta: outcome === 'failure' ? round(state.beta + weight) : state.beta,
  };
}

export function scoreChapter9Reputation(state: Chapter9ReputationState): number {
  const total = state.alpha + state.beta;
  if (total <= 0) return 0;
  return round(state.alpha / total);
}

function certificate(
  state: Chapter9DecisionState,
  selectedCandidateId: string,
  posteriors: Chapter9Posterior[],
  entropy: number,
  posteriorGap: number,
  expectedLoss: number,
  reasons: string[],
): Chapter9DecisionCertificate {
  return {
    state,
    selectedCandidateId,
    posteriors,
    entropy,
    posteriorGap,
    expectedLoss,
    reasons,
    nonClaims: [
      'MAP candidate is not global truth',
      'low entropy does not prove candidate completeness',
      'high quality does not imply PID issuance',
      'probability cannot repair missing candidates',
    ],
  };
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
