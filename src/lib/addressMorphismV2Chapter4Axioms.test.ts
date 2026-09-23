import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER4_AXIOMS_VERSION,
  CHAPTER4_AXIOM_GATES,
  buildChapter4AxiomReport,
  evaluateChapter4AxiomGates,
  type AxiomGateId,
  type AxiomGateState,
} from './addressMorphismV2Chapter4Axioms';

const allGateIds = CHAPTER4_AXIOM_GATES.map(gate => gate.id);

function allPass(): Record<AxiomGateId, AxiomGateState> {
  return Object.fromEntries(allGateIds.map(id => [id, 'pass'])) as Record<AxiomGateId, AxiomGateState>;
}

test('chapter 4 axiom report preserves required AMT safety gates', () => {
  const report = buildChapter4AxiomReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER4_AXIOMS_VERSION);
  assert.equal(report.gateCount, 7);
  assert.equal(report.requiredGateCount, 7);
  assert.match(report.safetyRule, /must return abstention/);
});

test('chapter 4 resolves only when every required axiom gate passes', () => {
  const result = evaluateChapter4AxiomGates({ gates: allPass() });

  assert.equal(result.canResolve, true);
  assert.equal(result.state, 'resolved');
  assert.deepEqual(result.failedOrUnknownGates, []);
});

test('chapter 4 abstains when candidate sufficiency fails', () => {
  const gates = allPass();
  gates['candidate-sufficiency'] = 'fail';

  const result = evaluateChapter4AxiomGates({ gates });

  assert.equal(result.canResolve, false);
  assert.equal(result.state, 'candidate_insufficient');
  assert.deepEqual(result.failedOrUnknownGates, ['candidate-sufficiency']);
});

test('chapter 4 treats unknown gates as unsafe for resolved output', () => {
  const gates = allPass();
  gates['evidence-admissibility'] = 'unknown';

  const result = evaluateChapter4AxiomGates({ gates });

  assert.equal(result.canResolve, false);
  assert.equal(result.state, 'manual_review');
  assert.deepEqual(result.failedOrUnknownGates, ['evidence-admissibility']);
});

test('chapter 4 blocks public output when projection safety fails', () => {
  const gates = allPass();
  gates['public-projection-safety'] = 'fail';

  const result = evaluateChapter4AxiomGates({ gates });

  assert.equal(result.canResolve, false);
  assert.equal(result.state, 'restricted');
  assert.deepEqual(result.failedOrUnknownGates, ['public-projection-safety']);
});

test('chapter 4 keeps every gate formula explicit', () => {
  for (const gate of CHAPTER4_AXIOM_GATES) {
    assert.ok(gate.formula.length > 10, `${gate.id} needs a formula`);
    assert.equal(gate.requiredForResolved, true, `${gate.id} should be required for resolved output`);
  }
});
