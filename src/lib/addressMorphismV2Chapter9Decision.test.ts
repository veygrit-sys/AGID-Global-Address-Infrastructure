import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER9_DECISION_VERSION,
  buildChapter9DecisionReport,
  computeChapter9AmbiguityReduction,
  computeChapter9Entropy,
  computeChapter9ExpectedLoss,
  computeChapter9GibbsPosteriors,
  decideChapter9Candidate,
  scoreChapter9Reputation,
  selectChapter9MapCandidate,
  updateChapter9Reputation,
  type Chapter9CandidateSignal,
  type Chapter9DecisionThresholds,
} from './addressMorphismV2Chapter9Decision';

const baseCandidates: Chapter9CandidateSignal[] = [
  {
    id: 'candidate-a',
    energy: 0.1,
    priorProbability: 0.6,
    quality: 0.95,
    reputation: 0.92,
    freshness: 0.9,
    uncertainty: 0.08,
    purposeLoss: 0.05,
  },
  {
    id: 'candidate-b',
    energy: 0.8,
    priorProbability: 0.4,
    quality: 0.9,
    reputation: 0.86,
    freshness: 0.88,
    uncertainty: 0.15,
    purposeLoss: 0.35,
  },
];

const thresholds: Chapter9DecisionThresholds = {
  temperature: 0.35,
  minPosteriorGap: 0.35,
  maxEntropy: 0.8,
  minQuality: 0.9,
  minReputation: 0.8,
  minFreshness: 0.8,
  maxUncertainty: 0.25,
};

test('chapter 9 report records probability, quality, entropy, and decision models', () => {
  const report = buildChapter9DecisionReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER9_DECISION_VERSION);
  assert.ok(report.executableModelKinds.includes('Gibbs posterior distribution'));
  assert.ok(report.executableModelKinds.includes('MAP candidate selection'));
  assert.ok(report.executableModelKinds.includes('Shannon entropy'));
  assert.ok(report.executableModelKinds.includes('reputation update'));
  assert.ok(report.executableModelKinds.includes('probability non-repair boundary'));
  assert.match(report.safetyRule, /do not replace candidate sufficiency/);
});

test('chapter 9 Gibbs posteriors normalize and prefer lower energy with stronger prior', () => {
  const posteriors = computeChapter9GibbsPosteriors(baseCandidates, thresholds.temperature);
  const total = posteriors.reduce((sum, posterior) => sum + posterior.probability, 0);

  assert.equal(Math.round(total * 10000) / 10000, 1);
  assert.equal(selectChapter9MapCandidate(posteriors)?.id, 'candidate-a');
  assert.ok(posteriors[0].probability > posteriors[1].probability);
});

test('chapter 9 accepts clear low-risk MAP candidate', () => {
  const decision = decideChapter9Candidate(baseCandidates, thresholds);

  assert.equal(decision.state, 'accept');
  assert.equal(decision.selectedCandidateId, 'candidate-a');
  assert.deepEqual(decision.reasons, []);
  assert.ok(decision.posteriorGap >= thresholds.minPosteriorGap);
});

test('chapter 9 sends high entropy distributions to manual review', () => {
  const decision = decideChapter9Candidate(
    [
      { ...baseCandidates[0], id: 'candidate-a', energy: 0.1, priorProbability: 0.5 },
      { ...baseCandidates[0], id: 'candidate-b', energy: 0.1, priorProbability: 0.5 },
      { ...baseCandidates[0], id: 'candidate-c', energy: 0.1, priorProbability: 0.5 },
    ],
    { ...thresholds, maxEntropy: 0.5, minPosteriorGap: 0.01 },
  );

  assert.equal(decision.state, 'manual_review');
  assert.ok(decision.reasons.includes('entropy-above-threshold'));
});

test('chapter 9 sends near posterior ties to manual review', () => {
  const decision = decideChapter9Candidate(
    [
      { ...baseCandidates[0], id: 'candidate-a', energy: 0.1, priorProbability: 0.5 },
      { ...baseCandidates[0], id: 'candidate-b', energy: 0.12, priorProbability: 0.5 },
    ],
    { ...thresholds, maxEntropy: 2, minPosteriorGap: 0.2 },
  );

  assert.equal(decision.state, 'manual_review');
  assert.ok(decision.reasons.includes('posterior-gap-below-threshold'));
});

test('chapter 9 applies quality, reputation, freshness, and uncertainty gates', () => {
  const lowQuality = decideChapter9Candidate([{ ...baseCandidates[0], quality: 0.4 }], thresholds);
  const lowReputation = decideChapter9Candidate([{ ...baseCandidates[0], reputation: 0.4 }], thresholds);
  const stale = decideChapter9Candidate([{ ...baseCandidates[0], freshness: 0.2 }], thresholds);
  const uncertain = decideChapter9Candidate([{ ...baseCandidates[0], uncertainty: 0.9 }], thresholds);

  assert.equal(lowQuality.state, 'manual_review');
  assert.equal(lowReputation.state, 'manual_review');
  assert.equal(stale.state, 'unresolved');
  assert.equal(uncertain.state, 'manual_review');
  assert.ok(lowQuality.reasons.includes('quality-below-threshold'));
  assert.ok(lowReputation.reasons.includes('reputation-below-threshold'));
  assert.ok(stale.reasons.includes('freshness-below-threshold'));
  assert.ok(uncertain.reasons.includes('uncertainty-above-threshold'));
});

test('chapter 9 entropy and ambiguity reduction are measurable', () => {
  const before = [
    { id: 'a', probability: 0.5 },
    { id: 'b', probability: 0.5 },
  ];
  const after = [
    { id: 'a', probability: 0.9 },
    { id: 'b', probability: 0.1 },
  ];

  assert.equal(computeChapter9Entropy(before), 1);
  assert.ok(computeChapter9AmbiguityReduction(before, after) > 0);
});

test('chapter 9 expected loss is posterior-weighted', () => {
  const posteriors = [
    { id: 'a', probability: 0.75 },
    { id: 'b', probability: 0.25 },
  ];

  assert.equal(computeChapter9ExpectedLoss(posteriors, { a: 0.1, b: 0.9 }), 0.3);
});

test('chapter 9 reputation update increases after success and decreases after failure', () => {
  const initial = { alpha: 2, beta: 2 };
  const success = updateChapter9Reputation(initial, 'success', 2);
  const failure = updateChapter9Reputation(initial, 'failure', 2);

  assert.ok(scoreChapter9Reputation(success) > scoreChapter9Reputation(initial));
  assert.ok(scoreChapter9Reputation(failure) < scoreChapter9Reputation(initial));
});

test('chapter 9 decision certificate preserves non-repair and non-PID non-claims', () => {
  const decision = decideChapter9Candidate([{ ...baseCandidates[0], id: 'only-visible-candidate' }], {
    ...thresholds,
    minPosteriorGap: 0,
  });

  assert.equal(decision.state, 'accept');
  assert.ok(decision.nonClaims.includes('probability cannot repair missing candidates'));
  assert.ok(decision.nonClaims.includes('high quality does not imply PID issuance'));
  assert.ok(decision.nonClaims.includes('low entropy does not prove candidate completeness'));
});
