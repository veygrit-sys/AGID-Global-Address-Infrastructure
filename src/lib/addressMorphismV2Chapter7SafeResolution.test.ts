import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER7_SAFE_RESOLUTION_VERSION,
  CHAPTER7_DECISION_GATE_TABLE,
  CHAPTER7_DEFAULT_WEIGHTS,
  buildChapter7PidBoundary,
  buildChapter7ResolutionCertificate,
  buildChapter7SafeResolutionReport,
  computeChapter7Energy,
  resolveChapter7FiniteCandidateClasses,
  type Chapter7ResolutionInput,
} from './addressMorphismV2Chapter7SafeResolution';

const baseInput: Chapter7ResolutionInput = {
  candidateClasses: [
    {
      id: 'class-a',
      structuralDistance: 0.05,
      purposeLoss: 0.04,
      uncertainty: 0.05,
      qualityPenalty: 0.02,
      governanceRisk: 0.02,
      quality: 0.94,
      conflictRisk: 0.05,
    },
    {
      id: 'class-b',
      structuralDistance: 0.45,
      purposeLoss: 0.2,
      uncertainty: 0.2,
      qualityPenalty: 0.12,
      governanceRisk: 0.1,
      quality: 0.86,
      conflictRisk: 0.1,
    },
  ],
  finiteCandidateClassSet: true,
  candidateSufficient: true,
  evidenceOk: true,
  publicProjectionSafe: true,
  lineageReady: true,
  revocationReady: true,
  auditReady: true,
  deterministicTieBreak: true,
  tieBreakSafe: true,
  minEnergyGap: 0.05,
  qualityThreshold: 0.9,
  conflictRiskThreshold: 0.2,
  weights: CHAPTER7_DEFAULT_WEIGHTS,
};

test('chapter 7 safe resolution report records finite estimation and PID boundary models', () => {
  const report = buildChapter7SafeResolutionReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER7_SAFE_RESOLUTION_VERSION);
  assert.equal(report.gateCount, CHAPTER7_DECISION_GATE_TABLE.length);
  assert.ok(report.executableModelKinds.includes('finite argmin'));
  assert.ok(report.executableModelKinds.includes('PID issuance boundary'));
  assert.ok(report.executableModelKinds.includes('decision gate table'));
  assert.ok(report.executableModelKinds.includes('resolution certificate'));
  assert.match(report.safetyRule, /PID issuance is a separate stricter boundary/);
});

test('chapter 7 energy function is deterministic', () => {
  const candidate = baseInput.candidateClasses[0];

  assert.equal(computeChapter7Energy(candidate), computeChapter7Energy(candidate));
  assert.ok(computeChapter7Energy(candidate) < computeChapter7Energy(baseInput.candidateClasses[1]));
});

test('chapter 7 resolves finite sufficient candidate classes and allows PID when stronger gates pass', () => {
  const decision = resolveChapter7FiniteCandidateClasses(baseInput);

  assert.equal(decision.state, 'resolved');
  assert.equal(decision.selectedCandidateClassId, 'class-a');
  assert.equal(decision.pidIssuanceAllowed, true);
  assert.deepEqual(decision.reasons, []);
});

test('chapter 7 abstains when candidate class set is not finite', () => {
  const decision = resolveChapter7FiniteCandidateClasses({ ...baseInput, finiteCandidateClassSet: false });

  assert.equal(decision.state, 'unresolved');
  assert.equal(decision.pidIssuanceAllowed, false);
  assert.deepEqual(decision.reasons, ['finite-candidate-class-required']);
});

test('chapter 7 sends near ties to manual review', () => {
  const decision = resolveChapter7FiniteCandidateClasses({
    ...baseInput,
    candidateClasses: [
      { ...baseInput.candidateClasses[0], id: 'class-a' },
      { ...baseInput.candidateClasses[0], id: 'class-b', structuralDistance: 0.06 },
    ],
    minEnergyGap: 0.05,
  });

  assert.equal(decision.state, 'manual_review');
  assert.equal(decision.pidIssuanceAllowed, false);
  assert.ok(decision.reasons.includes('energy-gap-below-purpose-threshold'));
});

test('chapter 7 requires safe deterministic tie break for exact ties', () => {
  const decision = resolveChapter7FiniteCandidateClasses({
    ...baseInput,
    candidateClasses: [
      { ...baseInput.candidateClasses[0], id: 'class-a' },
      { ...baseInput.candidateClasses[0], id: 'class-b' },
    ],
    tieBreakSafe: false,
  });

  assert.equal(decision.state, 'manual_review');
  assert.deepEqual(decision.reasons, ['safe-deterministic-tie-break-required']);
});

test('chapter 7 blocks PID issuance when public projection is unsafe even if resolved', () => {
  const decision = resolveChapter7FiniteCandidateClasses({ ...baseInput, publicProjectionSafe: false });

  assert.equal(decision.state, 'resolved');
  assert.equal(decision.pidIssuanceAllowed, false);
  assert.deepEqual(decision.reasons, ['public-projection-safety-required']);
});

test('chapter 7 sends low quality or high conflict candidates to manual review', () => {
  const lowQuality = resolveChapter7FiniteCandidateClasses({
    ...baseInput,
    candidateClasses: [{ ...baseInput.candidateClasses[0], quality: 0.7 }],
  });
  const highConflict = resolveChapter7FiniteCandidateClasses({
    ...baseInput,
    candidateClasses: [{ ...baseInput.candidateClasses[0], conflictRisk: 0.8 }],
  });

  assert.equal(lowQuality.state, 'manual_review');
  assert.equal(highConflict.state, 'manual_review');
  assert.ok(lowQuality.reasons.includes('quality-below-threshold'));
  assert.ok(highConflict.reasons.includes('conflict-risk-above-threshold'));
});

test('chapter 7 PID boundary preserves non-claims', () => {
  const decision = resolveChapter7FiniteCandidateClasses({ ...baseInput, auditReady: false });
  const boundary = buildChapter7PidBoundary(decision);

  assert.equal(boundary.canIssuePid, false);
  assert.equal(boundary.requiresResolved, true);
  assert.ok(boundary.nonClaims.includes('resolved does not imply PID issuance'));
  assert.ok(boundary.nonClaims.includes('manual review is a safe state, not model failure'));
});

test('chapter 7 decision gate table covers resolution, review, and PID boundaries', () => {
  const gateClasses = new Set(CHAPTER7_DECISION_GATE_TABLE.map(gate => gate.gateClass));

  assert.deepEqual([...gateClasses].sort(), ['pid', 'resolution', 'review']);
  assert.ok(CHAPTER7_DECISION_GATE_TABLE.every(gate => gate.formula.length > 8));
});

test('chapter 7 resolution certificate is not a PID by itself', () => {
  const decision = resolveChapter7FiniteCandidateClasses(baseInput);
  const certificate = buildChapter7ResolutionCertificate(decision);

  assert.equal(certificate.resolutionCanBeUsed, true);
  assert.equal(certificate.pidCanBeIssued, true);
  assert.ok(certificate.nonClaims.includes('resolution certificate is not a PID by itself'));
});

test('chapter 7 resolution certificate records safe non-resolution states', () => {
  const decision = resolveChapter7FiniteCandidateClasses({ ...baseInput, evidenceOk: false });
  const certificate = buildChapter7ResolutionCertificate(decision);

  assert.equal(certificate.decisionState, 'unresolved');
  assert.equal(certificate.resolutionCanBeUsed, false);
  assert.equal(certificate.pidCanBeIssued, false);
  assert.deepEqual(certificate.failedReasons, ['evidence-required']);
  assert.ok(certificate.nonClaims.includes('manual_review and unresolved are safe outputs'));
});
