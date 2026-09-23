import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_EARLY_CHAPTER_REINFORCEMENT_VERSION,
  auditEarlyChapterReinforcement,
  buildEarlyChapterReinforcementPlan,
  earlyChapterWeaknessRequiresNonClaim,
  evaluateEarlyChapterReinforcement,
  type EarlyChapterReinforcementRecord,
} from './addressMorphismV2EarlyChapterReinforcement';

test('early chapter reinforcement plan covers chapters 1 through 7', () => {
  const plan = buildEarlyChapterReinforcementPlan();

  assert.equal(plan.version, ADDRESS_MORPHISM_V2_EARLY_CHAPTER_REINFORCEMENT_VERSION);
  assert.deepEqual(
    plan.records.map(record => record.chapter),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.ok(plan.frontHalfContract.includes('expose candidate debt instead of claiming completeness'));
});

test('early chapter reinforcement requires invariant, failure mode, counterexample, fixture, and non-claim', () => {
  const complete = buildEarlyChapterReinforcementPlan().records[0];
  const incomplete: EarlyChapterReinforcementRecord = {
    ...complete,
    failureMode: '',
    nonClaim: '',
  };

  assert.equal(evaluateEarlyChapterReinforcement(complete).reinforced, true);
  assert.deepEqual(evaluateEarlyChapterReinforcement(incomplete).missing, ['failure-mode', 'non-claim']);
});

test('early chapter reinforcement audit marks all default records complete', () => {
  const audit = auditEarlyChapterReinforcement();

  assert.equal(audit.complete, true);
  assert.deepEqual(audit.weakChapters, []);
  assert.equal(audit.coverage[1].score, 1);
  assert.equal(audit.coverage[7].score, 1);
});

test('early chapter reinforcement catches missing chapter 5 candidate-debt boundary', () => {
  const records = buildEarlyChapterReinforcementPlan().records.map(record =>
    record.chapter === 5 ? { ...record, invariant: '', counterexample: '' } : record,
  );
  const audit = auditEarlyChapterReinforcement(records);

  assert.equal(audit.complete, false);
  assert.deepEqual(audit.weakChapters, [5]);
  assert.deepEqual(audit.coverage[5].missing, ['invariant', 'counterexample']);
});

test('early chapter weakness lookup returns the required safe non-claim', () => {
  assert.match(
    earlyChapterWeaknessRequiresNonClaim('registration-as-form-ux'),
    /not merely a checkout or address-form optimization/i,
  );
  assert.match(
    earlyChapterWeaknessRequiresNonClaim('argmin-as-resolution-or-pid'),
    /does not imply resolution or PID issuance/i,
  );
});
