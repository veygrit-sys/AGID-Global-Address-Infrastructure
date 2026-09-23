import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER5_CANDIDATE_POLICY_VERSION,
  CHAPTER5_CANDIDATE_POLICY_RULES,
  CHAPTER5_SOURCE_POLICY_DIMENSIONS,
  buildChapter5CandidateCoverageCertificate,
  buildChapter5CandidatePolicyReport,
  evaluateChapter5CandidatePolicy,
  multilingualExpansionImprovesRecallOnly,
  type CandidatePolicyInput,
} from './addressMorphismV2Chapter5CandidatePolicy';

const readyInput: CandidatePolicyInput = {
  normalized: 'pass',
  coverageOk: 'pass',
  licenseOk: 'pass',
  freshnessOk: 'pass',
  privacyOk: 'pass',
  finiteCandidates: 'pass',
  candidateCount: 4,
  maxCandidates: 20,
  multilingualExpansionCount: 3,
};

test('chapter 5 candidate policy report defines executable source gates', () => {
  const report = buildChapter5CandidatePolicyReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER5_CANDIDATE_POLICY_VERSION);
  assert.equal(report.ruleCount, 6);
  assert.equal(report.sourcePolicyDimensionCount, CHAPTER5_SOURCE_POLICY_DIMENSIONS.length);
  assert.match(report.safetyRule, /never directly proves identity/);
});

test('chapter 5 candidate generation can enter resolution but cannot decide identity', () => {
  const result = evaluateChapter5CandidatePolicy(readyInput);

  assert.equal(result.state, 'candidate_ready');
  assert.equal(result.canEnterResolution, true);
  assert.equal(result.identityDecisionAllowed, false);
});

test('chapter 5 blocks source-insufficient regions', () => {
  const result = evaluateChapter5CandidatePolicy({ ...readyInput, coverageOk: 'fail' });

  assert.equal(result.state, 'source_insufficient');
  assert.equal(result.canEnterResolution, false);
  assert.deepEqual(result.reasons, ['coverage-required']);
});

test('chapter 5 blocks license-unknown or license-failed evidence', () => {
  const result = evaluateChapter5CandidatePolicy({ ...readyInput, licenseOk: 'unknown' });

  assert.equal(result.state, 'license_blocked');
  assert.equal(result.canEnterResolution, false);
  assert.deepEqual(result.reasons, ['license-required']);
});

test('chapter 5 blocks stale source evidence for current-purpose resolution', () => {
  const result = evaluateChapter5CandidatePolicy({ ...readyInput, freshnessOk: 'fail' });

  assert.equal(result.state, 'stale_source');
  assert.equal(result.canEnterResolution, false);
  assert.deepEqual(result.reasons, ['freshness-required']);
});

test('chapter 5 blocks empty or non-finite candidate sets', () => {
  const result = evaluateChapter5CandidatePolicy({ ...readyInput, candidateCount: 0 });

  assert.equal(result.state, 'candidate_insufficient');
  assert.equal(result.canEnterResolution, false);
});

test('chapter 5 sends excessive candidate sets to manual review', () => {
  const result = evaluateChapter5CandidatePolicy({ ...readyInput, candidateCount: 200 });

  assert.equal(result.state, 'manual_review');
  assert.equal(result.canEnterResolution, false);
  assert.deepEqual(result.reasons, ['candidate-budget-exceeded']);
});

test('chapter 5 multilingual expansion improves recall only, not identity proof', () => {
  const expansion = multilingualExpansionImprovesRecallOnly(2, 5);

  assert.equal(expansion.recallNotReduced, true);
  assert.equal(expansion.provesIdentity, false);
  assert.match(expansion.formula, /does not imply referent equality/);
});

test('chapter 5 candidate coverage certificate records sufficiency without PID issuance', () => {
  const certificate = buildChapter5CandidateCoverageCertificate(
    { purpose: 'delivery', region: 'postal-weak-region-fixture', featureType: 'logistic' },
    readyInput,
  );

  assert.equal(certificate.state, 'candidate_ready');
  assert.equal(certificate.canClaimCandidateSufficiency, true);
  assert.equal(certificate.canIssuePid, false);
  assert.ok(certificate.nonClaims.includes('candidate generation does not issue PID'));
  assert.deepEqual(certificate.sourceDebt, []);
});

test('chapter 5 candidate coverage certificate exposes source debt when gates fail', () => {
  const certificate = buildChapter5CandidateCoverageCertificate(
    { purpose: 'delivery', region: 'source-thin-region-fixture', featureType: 'poi' },
    { ...readyInput, coverageOk: 'unknown' },
  );

  assert.equal(certificate.state, 'source_insufficient');
  assert.equal(certificate.canClaimCandidateSufficiency, false);
  assert.equal(certificate.canIssuePid, false);
  assert.equal(certificate.sourceDebt.length, 1);
  assert.match(certificate.sourceDebt[0], /CoverageOK_t/);
});

test('chapter 5 keeps every policy rule tied to a formula and failure state', () => {
  for (const rule of CHAPTER5_CANDIDATE_POLICY_RULES) {
    assert.ok(rule.id.length > 0);
    assert.ok(rule.formula.length > 10);
    assert.ok(rule.failureState.length > 0);
  }
});

test('chapter 5 source policy dimensions cover reproducibility and safety', () => {
  assert.deepEqual(CHAPTER5_SOURCE_POLICY_DIMENSIONS, [
    'license',
    'freshness',
    'coverage',
    'privacy',
    'traceability',
    'finite-candidate-budget',
  ]);
});
