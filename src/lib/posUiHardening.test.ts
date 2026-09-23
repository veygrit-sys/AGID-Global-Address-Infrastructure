import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  evaluatePosUiHardening,
  getPosUiHardeningPlan,
  getPosUiStateContract,
} from './posUiHardening';

test('defines POS UI hardening measures around decision clarity and privacy', () => {
  const plan = getPosUiHardeningPlan();

  assert.equal(plan.version, 'pos-ui-hardening-v1');
  assert.ok(plan.measures.length >= 10);
  assert.deepEqual(
    plan.measures.filter(measure => measure.priority === 'P0').map(measure => measure.id),
    [
      'p0-decision-banner',
      'p0-four-stage-handoff',
      'p0-warning-visibility',
      'p0-high-risk-privacy',
    ],
  );
  assert.ok(plan.privacyRules.some(rule => rule.includes('raw AGID')));
  assert.ok(plan.operatorSpeedRules.some(rule => rule.includes('Exactly one primary action')));
});

test('maps each POS decision state to one primary action and explicit surfaces', () => {
  const states = getPosUiHardeningPlan().stateContracts;

  assert.equal(states.length, 9);
  for (const state of states) {
    assert.ok(state.primaryAction.length > 0, state.state);
    assert.ok(state.surfaceOrder.length > 0, state.state);
  }

  const rejected = getPosUiStateContract('rejected');
  assert.equal(rejected.colorRole, 'danger');
  assert.ok(rejected.disabledActions.includes('Complete handoff'));

  const complete = getPosUiStateContract('handoff-complete');
  assert.equal(complete.primaryAction, 'Print report');
});

test('blocks release when rejected, warnings are hidden, or high-risk mode exposes raw address', () => {
  const evaluation = evaluatePosUiHardening({
    state: 'rejected',
    registryFresh: false,
    highRiskMode: true,
    rawAddressVisible: true,
    warningHidden: true,
    languageConfigured: true,
    primaryActionCount: 1,
    deviceIssues: 0,
    reviewCases: 1,
    offlineQueueSize: 0,
    activeSecureKeys: 1,
    operatorHasOverride: true,
  });

  assert.equal(evaluation.valid, false);
  assert.equal(evaluation.grade, 'blocked');
  assert.ok(evaluation.blockers.includes('rejected-state-must-not-release'));
  assert.ok(evaluation.blockers.includes('blocking-warning-hidden'));
  assert.ok(evaluation.blockers.includes('high-risk-raw-address-visible'));
  assert.ok(evaluation.visibleSurfaces.includes('review-queue'));
  assert.ok(evaluation.visibleSurfaces.includes('trust-strip'));
});

test('routes attention states to registry, devices, queue, and settings surfaces', () => {
  const evaluation = evaluatePosUiHardening({
    state: 'carrier-scan-ok',
    registryFresh: false,
    highRiskMode: false,
    rawAddressVisible: false,
    warningHidden: false,
    languageConfigured: false,
    primaryActionCount: 2,
    deviceIssues: 2,
    reviewCases: 1,
    offlineQueueSize: 3,
    activeSecureKeys: 0,
    operatorHasOverride: false,
  });

  assert.equal(evaluation.valid, true);
  assert.equal(evaluation.grade, 'attention');
  assert.equal(evaluation.nextPrimaryAction, 'Request recipient proof');
  assert.ok(evaluation.warnings.includes('primary-action-count:2'));
  assert.ok(evaluation.visibleSurfaces.includes('trust-strip'));
  assert.ok(evaluation.visibleSurfaces.includes('device-diagnostics'));
  assert.ok(evaluation.visibleSurfaces.includes('offline-queue'));
  assert.ok(evaluation.visibleSurfaces.includes('settings-policy'));
});

test('keeps a clean completed handoff ready and report-first', () => {
  const evaluation = evaluatePosUiHardening({
    state: 'handoff-complete',
    registryFresh: true,
    highRiskMode: false,
    rawAddressVisible: false,
    warningHidden: false,
    languageConfigured: true,
    primaryActionCount: 1,
    deviceIssues: 0,
    reviewCases: 0,
    offlineQueueSize: 0,
    activeSecureKeys: 1,
    operatorHasOverride: true,
  });

  assert.equal(evaluation.valid, true);
  assert.equal(evaluation.grade, 'ready');
  assert.equal(evaluation.score, 100);
  assert.equal(evaluation.nextPrimaryAction, 'Print report');
  assert.deepEqual(evaluation.blockers, []);
  assert.deepEqual(evaluation.warnings, []);
});
