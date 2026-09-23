import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getP2MaturityExecutionPlan,
  getP2MaturitySurface,
  P2_MATURITY_IDS,
  renderP2MaturityMermaid,
  validateP2MaturityExecutionPlan,
} from './p2MaturityExecutionPlan';

test('keeps drone delivery evidence API as the only P2 maturity surface', () => {
  const plan = getP2MaturityExecutionPlan();

  assert.deepEqual(plan.executionOrder, ['drone-locker-ops']);
  assert.deepEqual(plan.surfaces.map(surface => surface.conceptId), P2_MATURITY_IDS);
  assert.equal(plan.surfaces[0]?.route, '/api/drone-delivery-evidence');
});

test('defines concrete evidence API surfaces, contracts, states, and completion', () => {
  const ops = getP2MaturitySurface('drone-locker-ops');

  assert.ok((ops?.mustAddScreens.length ?? 0) >= 8);
  assert.ok((ops?.sharedComponents.length ?? 0) >= 8);
  assert.ok((ops?.stateContract.length ?? 0) >= 8);
  assert.ok((ops?.implementationSlice.length ?? 0) >= 4);
  assert.match(ops?.completionDefinition ?? '', /submit drone delivery evidence and cannot-reach reports/i);
});

test('keeps P2 dependent on P0 and P1 contracts rather than starting as first production app', () => {
  const ops = getP2MaturitySurface('drone-locker-ops');

  assert.ok(ops?.dependsOn.includes('settings-policy-center'));
  assert.ok(ops?.dependsOn.includes('field-handoff-app'));
  assert.ok(ops?.dependsOn.includes('carrier-label-settlement'));
  assert.ok(ops?.dependsOn.includes('address-connect-admin'));
  assert.match(ops?.goal ?? '', /instead of building a drone OS or flight-control surface/i);
});

test('keeps drone evidence public projections privacy-safe', () => {
  const ops = getP2MaturitySurface('drone-locker-ops');

  assert.match(ops?.testGates.join(' ') ?? '', /blocks raw addresses/i);
  assert.match(ops?.testGates.join(' ') ?? '', /autopilotCommandsEmitted=false/i);
  assert.match(ops?.privacyGates.join(' ') ?? '', /coarse zones/i);
  assert.match(ops?.privacyGates.join(' ') ?? '', /restricted operator receipts/i);
});

test('keeps the delivery evidence API and redacted contracts free', () => {
  const ops = getP2MaturitySurface('drone-locker-ops');

  assert.ok(ops?.freeBoundary.includes('drone delivery evidence API schema'));
  assert.ok(ops?.freeBoundary.includes('delivery reachability report schema'));
  assert.ok(ops?.freeBoundary.includes('no-flight-control test gates'));
  assert.match(ops?.paidBoundary.join(' ') ?? '', /managed evidence retention/i);
});

test('keeps evidence, public sharing, and flight permission separated', () => {
  const plan = getP2MaturityExecutionPlan();
  const gates = plan.crossSurfaceTestGates.join(' ');
  const doNotDo = plan.doNotDo.join(' ');

  assert.match(gates, /high-risk drone evidence becomes restricted operator receipt/i);
  assert.match(gates, /cannot-reach reports create reviewable reason-code receipts/i);
  assert.match(gates, /without managed IoT fleet/i);
  assert.match(doNotDo, /Do not build a Drone OS/i);
  assert.match(doNotDo, /Do not treat payment status, label acceptance, or evidence receipt as flight permission/i);
});

test('renders P2 maturity diagram', () => {
  const diagram = renderP2MaturityMermaid();

  assert.match(diagram, /^flowchart LR/);
  assert.match(diagram, /Drone Delivery Evidence \/ Reachability API/);
  assert.match(diagram, /Delivery Reachability Report/);
  assert.match(diagram, /Dashboard Evidence Health/);
});

test('validates the P2 maturity execution plan', () => {
  const validation = validateP2MaturityExecutionPlan();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});
