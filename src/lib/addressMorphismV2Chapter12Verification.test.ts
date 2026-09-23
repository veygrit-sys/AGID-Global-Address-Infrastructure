import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER12_VERIFICATION_VERSION,
  buildChapter12PublicationSafetyGate,
  buildChapter12VerificationReport,
  detectChapter12UnsafeUniversalWording,
  evaluateChapter12Claim,
  evaluateChapter12RiskItem,
  isChapter12FairComparison,
  scoreChapter12BenchmarkReadiness,
  type Chapter12BenchmarkCase,
  type Chapter12Claim,
  type Chapter12RiskItem,
} from './addressMorphismV2Chapter12Verification';

const verifiedClaim: Chapter12Claim = {
  id: 'verified-structural-equivalence',
  text: 'Structural equivalence is verified for the published synthetic fixtures.',
  scope: 'multi_region',
  status: 'verified',
  artifacts: ['src/lib/addressMorphismV2Chapter6StructuralEquivalence.ts'],
  tests: ['src/lib/addressMorphismV2Chapter6StructuralEquivalence.test.ts'],
  nonClaims: ['This does not prove all global address equivalence cases.'],
  residualRisks: ['Fixture coverage remains finite.'],
};

const readyBenchmark: Chapter12BenchmarkCase = {
  id: 'no-postcode-synthetic-e2e',
  domain: 'end_to_end_protocol',
  fixtureCount: 12,
  regionCount: 3,
  hasSyntheticFixtures: true,
  hasSourcePolicy: true,
  hasBaseline: true,
  hasFailureModes: true,
  rawAddressFree: true,
  hasNonClaims: true,
};

test('chapter 12 report records verification, benchmark, non-claim, comparison, and safety gates', () => {
  const report = buildChapter12VerificationReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER12_VERIFICATION_VERSION);
  assert.ok(report.executableModelKinds.includes('verification map'));
  assert.ok(report.executableModelKinds.includes('benchmark readiness scorer'));
  assert.ok(report.executableModelKinds.includes('fair comparison gate'));
  assert.ok(report.executableModelKinds.includes('publication safety gate'));
  assert.match(report.publicationSafetyRule, /scope, fixtures, tests, non-claims/);
  assert.ok(report.preservedNonClaims.some(nonClaim => nonClaim.includes('global completeness')));
});

test('chapter 12 treats a tested, scoped, non-claim-bounded claim as publishable verified', () => {
  const evaluation = evaluateChapter12Claim(verifiedClaim);

  assert.equal(evaluation.status, 'verified');
  assert.equal(evaluation.publishable, true);
  assert.deepEqual(evaluation.reasons, []);
});

test('chapter 12 blocks global universal wording without global evidence', () => {
  const evaluation = evaluateChapter12Claim({
    ...verifiedClaim,
    id: 'global-completeness',
    text: 'AMT handles all addresses with global completeness.',
    scope: 'global',
    hasGlobalEvidence: false,
  });

  assert.equal(evaluation.status, 'blocked');
  assert.equal(evaluation.publishable, false);
  assert.ok(evaluation.reasons.includes('unsafe-universal-wording-without-global-evidence'));
});

test('chapter 12 blocks raw address or secret fixtures', () => {
  const evaluation = evaluateChapter12Claim({
    ...verifiedClaim,
    id: 'raw-address-fixture',
    containsRawAddressOrSecret: true,
  });

  assert.equal(evaluation.status, 'blocked');
  assert.ok(evaluation.reasons.includes('raw-address-or-secret-in-artifact'));
});

test('chapter 12 keeps case studies publishable only as partial evidence', () => {
  const evaluation = evaluateChapter12Claim({
    id: 'case-study-hotel-handoff',
    text: 'Hotel handoff works for this synthetic case study.',
    scope: 'case_study',
    status: 'partial',
    artifacts: [],
    tests: [],
    nonClaims: ['This case study is not a universal proof.'],
    residualRisks: ['Operational integration is not yet field-tested.'],
  });

  assert.equal(evaluation.status, 'partial');
  assert.equal(evaluation.publishable, true);
});

test('chapter 12 benchmark readiness is ready only when fixtures, policy, baseline, failures, and non-claims exist', () => {
  const readiness = scoreChapter12BenchmarkReadiness(readyBenchmark);

  assert.equal(readiness.state, 'ready');
  assert.equal(readiness.score, 1);
  assert.deepEqual(readiness.missing, []);
});

test('chapter 12 benchmark readiness blocks raw address fixtures', () => {
  const readiness = scoreChapter12BenchmarkReadiness({
    ...readyBenchmark,
    rawAddressFree: false,
  });

  assert.equal(readiness.state, 'blocked');
  assert.equal(readiness.score, 0);
  assert.deepEqual(readiness.missing, ['raw-address-free-fixtures']);
});

test('chapter 12 fair comparison requires same dataset, metrics, purpose, failure taxonomy, and disclosure boundary', () => {
  assert.equal(
    isChapter12FairComparison({
      sameDataset: true,
      sameMetrics: true,
      samePurpose: true,
      sameFailureTaxonomy: true,
      sameDisclosureBoundary: true,
    }),
    true,
  );
  assert.equal(
    isChapter12FairComparison({
      sameDataset: true,
      sameMetrics: true,
      samePurpose: false,
      sameFailureTaxonomy: true,
      sameDisclosureBoundary: true,
    }),
    false,
  );
});

test('chapter 12 S-priority risk items require safe wording and four-axis decomposition', () => {
  const risk: Chapter12RiskItem = {
    id: 'candidate-generation-sufficiency',
    priority: 'S',
    item: '世界規模の候補生成の完全性',
    safeWording: '候補生成の十分性を地域別に検証する。',
    decomposedByRegionPurposeSourceFailure: {
      region: true,
      purpose: true,
      dataSource: true,
      failureBehavior: true,
    },
  };

  assert.equal(evaluateChapter12RiskItem(risk).publishable, true);
  assert.deepEqual(evaluateChapter12RiskItem({ ...risk, safeWording: '' }).reasons, [
    'missing-safe-wording',
    'unsafe-risk-wording-without-safe-alternative',
  ]);
});

test('chapter 12 publication safety gate identifies blocked, partial, and unverified claims', () => {
  const gate = buildChapter12PublicationSafetyGate([
    verifiedClaim,
    {
      ...verifiedClaim,
      id: 'blocked-global',
      text: 'AMT is fully secure for all addresses.',
      scope: 'global',
      hasGlobalEvidence: false,
    },
    {
      id: 'partial-case',
      text: 'A case-study fixture executes.',
      scope: 'case_study',
      status: 'partial',
      artifacts: [],
      tests: [],
      nonClaims: ['Case study only.'],
      residualRisks: ['No broad benchmark yet.'],
    },
    {
      id: 'unverified-commercial-comparison',
      text: 'Commercial comparison plan exists.',
      scope: 'multi_region',
      status: 'unverified',
      artifacts: [],
      tests: [],
      nonClaims: [],
      residualRisks: [],
    },
  ]);

  assert.equal(gate.publishable, false);
  assert.deepEqual(gate.blockedClaimIds, ['blocked-global']);
  assert.deepEqual(gate.partialClaimIds, ['partial-case']);
  assert.deepEqual(gate.unverifiedClaimIds, ['unverified-commercial-comparison']);
});

test('chapter 12 detects unsafe universal wording in Japanese and English', () => {
  assert.equal(detectChapter12UnsafeUniversalWording('全世界の全住所を完全に解決する'), true);
  assert.equal(detectChapter12UnsafeUniversalWording('A scoped benchmark with finite fixtures'), false);
});
