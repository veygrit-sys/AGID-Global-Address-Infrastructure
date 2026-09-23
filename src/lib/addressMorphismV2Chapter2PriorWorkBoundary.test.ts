import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER2_PRIOR_WORK_BOUNDARY_VERSION,
  buildChapter2PriorWorkBoundaryReport,
  chapter2PriorWorkOutputEqualsAmtSafeReferent,
  classifyChapter2PriorWorkRole,
  evaluateChapter2PriorWorkBoundary,
  isChapter2FairComparison,
  type Chapter2PriorWorkMethod,
} from './addressMorphismV2Chapter2PriorWorkBoundary';

const normalizationMethod: Chapter2PriorWorkMethod = {
  kind: 'normalization',
  hasReferentDerivationRule: false,
  purposeScoped: false,
  evidenceTransparent: true,
  supportsSafeAbstention: false,
  privacyBoundaryDefined: false,
};

test('chapter 2 report models prior work as evidence and compatibility layers', () => {
  const report = buildChapter2PriorWorkBoundaryReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER2_PRIOR_WORK_BOUNDARY_VERSION);
  assert.ok(report.executableModelKinds.includes('prior work output classification'));
  assert.ok(report.executableModelKinds.includes('fair comparison gate'));
  assert.ok(report.executableModelKinds.includes('ZK non-repair fixture'));
  assert.match(report.boundaryRule, /usable evidence or compatibility layers/);
});

test('chapter 2 classifies common prior work outputs by role', () => {
  assert.equal(classifyChapter2PriorWorkRole('normalization'), 'expression_alignment');
  assert.equal(classifyChapter2PriorWorkRole('geocoding'), 'spatial_evidence');
  assert.equal(classifyChapter2PriorWorkRole('postal_code'), 'compression');
  assert.equal(classifyChapter2PriorWorkRole('zk_proof'), 'privacy_predicate_layer');
  assert.equal(classifyChapter2PriorWorkRole('commercial_validator'), 'operational_baseline');
});

test('chapter 2 treats normalization as compatible evidence, not referent identity', () => {
  const evaluation = evaluateChapter2PriorWorkBoundary(normalizationMethod);

  assert.equal(evaluation.state, 'compatible_evidence_layer');
  assert.equal(evaluation.role, 'expression_alignment');
  assert.ok(evaluation.reasons.includes('missing-referent-derivation-rule'));
  assert.equal(chapter2PriorWorkOutputEqualsAmtSafeReferent('normalization'), false);
});

test('chapter 2 blocks unsafe replacement claims', () => {
  const evaluation = evaluateChapter2PriorWorkBoundary({
    ...normalizationMethod,
    kind: 'commercial_validator',
    claimsToReplaceAmt: true,
  });

  assert.equal(evaluation.state, 'unsafe_replacement_claim');
  assert.ok(evaluation.reasons.includes('unsafe-replacement-claim'));
});

test('chapter 2 blocks comparison artifacts that contain raw address or secret material', () => {
  const evaluation = evaluateChapter2PriorWorkBoundary({
    ...normalizationMethod,
    kind: 'geocoding',
    containsRawAddressOrSecret: true,
  });

  assert.equal(evaluation.state, 'blocked');
  assert.ok(evaluation.reasons.includes('raw-address-or-secret-in-comparison-artifact'));
});

test('chapter 2 can recognize a method that is safe-referent ready under AMT constraints', () => {
  const evaluation = evaluateChapter2PriorWorkBoundary({
    kind: 'gis_boundary',
    hasReferentDerivationRule: true,
    purposeScoped: true,
    evidenceTransparent: true,
    supportsSafeAbstention: true,
    privacyBoundaryDefined: true,
  });

  assert.equal(evaluation.state, 'safe_referent_ready');
  assert.deepEqual(evaluation.reasons, []);
});

test('chapter 2 fair comparison requires same dataset, purpose, metric, failure taxonomy, and disclosure boundary', () => {
  assert.equal(
    isChapter2FairComparison({
      sameDataset: true,
      samePurpose: true,
      sameMetric: true,
      sameFailureTaxonomy: true,
      sameDisclosureBoundary: true,
    }),
    true,
  );
  assert.equal(
    isChapter2FairComparison({
      sameDataset: true,
      samePurpose: true,
      sameMetric: false,
      sameFailureTaxonomy: true,
      sameDisclosureBoundary: true,
    }),
    false,
  );
});

test('chapter 2 preserves non-claims for geocoding, postal codes, ZK, and commercial APIs', () => {
  assert.equal(chapter2PriorWorkOutputEqualsAmtSafeReferent('geocoding'), false);
  assert.equal(chapter2PriorWorkOutputEqualsAmtSafeReferent('postal_code'), false);
  assert.equal(chapter2PriorWorkOutputEqualsAmtSafeReferent('zk_proof'), false);
  assert.equal(chapter2PriorWorkOutputEqualsAmtSafeReferent('commercial_validator'), false);
});
