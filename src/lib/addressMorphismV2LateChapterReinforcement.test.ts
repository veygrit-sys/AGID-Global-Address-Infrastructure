import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_LATE_CHAPTER_REINFORCEMENT_VERSION,
  auditLateChapterReinforcement,
  buildLateChapterReinforcementPlan,
  evaluateLateChapterReinforcement,
  lateChapterWeaknessRequiresNonClaim,
  type LateChapterReinforcementRecord,
} from './addressMorphismV2LateChapterReinforcement';

test('late chapter reinforcement plan covers chapters 8 through 12', () => {
  const plan = buildLateChapterReinforcementPlan();

  assert.equal(plan.version, ADDRESS_MORPHISM_V2_LATE_CHAPTER_REINFORCEMENT_VERSION);
  assert.deepEqual(
    plan.records.map(record => record.chapter),
    [8, 9, 10, 11, 12],
  );
  assert.deepEqual(plan.maturityPath, [
    'written claim',
    'formal definition',
    'executable fixture',
    'failure-mode test',
    'benchmark corpus',
    'independent comparison',
    'audited implementation',
  ]);
});

test('late chapter reinforcement requires invariant, failure mode, counterexample, fixture, and non-claim', () => {
  const complete = buildLateChapterReinforcementPlan().records[0];
  const incomplete: LateChapterReinforcementRecord = {
    ...complete,
    invariant: '',
    fixtureHook: '',
  };

  assert.equal(evaluateLateChapterReinforcement(complete).reinforced, true);
  assert.deepEqual(evaluateLateChapterReinforcement(incomplete).missing, ['invariant', 'fixture-hook']);
});

test('late chapter reinforcement audit marks all default records complete', () => {
  const audit = auditLateChapterReinforcement();

  assert.equal(audit.complete, true);
  assert.deepEqual(audit.weakChapters, []);
  assert.equal(audit.coverage[8].score, 1);
  assert.equal(audit.coverage[12].score, 1);
});

test('late chapter reinforcement catches a missing chapter 11 responsibility boundary', () => {
  const records = buildLateChapterReinforcementPlan().records.map(record =>
    record.chapter === 11 ? { ...record, failureMode: '', nonClaim: '' } : record,
  );
  const audit = auditLateChapterReinforcement(records);

  assert.equal(audit.complete, false);
  assert.deepEqual(audit.weakChapters, [11]);
  assert.deepEqual(audit.coverage[11].missing, ['failure-mode', 'non-claim']);
});

test('late chapter weakness lookup returns the required safe non-claim', () => {
  assert.match(
    lateChapterWeaknessRequiresNonClaim('probability-as-truth'),
    /probability and quality do not prove truth/i,
  );
  assert.match(
    lateChapterWeaknessRequiresNonClaim('benchmark-plan-as-victory-claim'),
    /not victory declarations/i,
  );
});
