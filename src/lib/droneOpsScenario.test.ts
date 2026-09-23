import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildDroneOpsConstraintSet,
  createDroneOpsReceipt,
  droneFieldDecisionFor,
  droneOutcomeFor,
  listDroneOpsCapabilities,
} from './droneOpsScenario';
import { scenarioTime } from './opsScenario';

test('drone ops scenario maps UI states to reachability outcomes', () => {
  assert.equal(droneOutcomeFor('normal'), 'completed');
  assert.equal(droneOutcomeFor('blocked'), 'cannot-reach');
  assert.equal(droneOutcomeFor('offline'), 'held-for-review');
});

test('drone ops receipt stays reachability-only and redacted', () => {
  const receipt = createDroneOpsReceipt('blocked', scenarioTime('blocked', 0));

  assert.equal(receipt.outcome, 'cannot-reach');
  assert.equal(receipt.decision, 'share-restricted-operator-receipt');
  assert.equal(receipt.guarantees.autopilotCommandsEmitted, false);
  assert.equal(receipt.guarantees.rawAddressPublic, false);
  assert.equal(receipt.publicApiProjection.countryCode, 'JP');
  assert.doesNotMatch(JSON.stringify(receipt.publicApiProjection), /AGID-RAW|privateKey|phone/i);
});

test('drone ops capabilities preserve the no-flight-control boundary', () => {
  const capabilities = listDroneOpsCapabilities();

  assert.ok(capabilities.outcomes.includes('cannot-reach'));
  assert.ok(capabilities.notInScope.includes('autopilot command emission'));
});

test('drone ops field decision is limited to handoff review or cannot reach', () => {
  assert.equal(droneFieldDecisionFor('normal'), 'safe-handoff');
  assert.equal(droneFieldDecisionFor('offline'), 'hold-for-review');
  assert.equal(droneFieldDecisionFor('blocked'), 'cannot-reach');
});

test('drone ops constraints model height precision landing wind and obstacles without controls', () => {
  const constraints = buildDroneOpsConstraintSet('blocked');
  const kinds = constraints.map(constraint => constraint.kind);

  assert.deepEqual(kinds, ['height', 'precision', 'landing-ban', 'wind', 'obstacle']);
  assert.ok(constraints.some(constraint => constraint.label.includes('10cm')));
  assert.ok(constraints.some(constraint => constraint.status === 'blocked'));
  assert.doesNotMatch(JSON.stringify(constraints), /latitude|longitude|rawAddress|preciseTelemetry|waypoint|motor|pilot/i);
});
