import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getP0MaturityExecutionPlan,
  getP0MaturitySurface,
  P0_MATURITY_IDS,
  renderP0MaturityMermaid,
  validateP0MaturityExecutionPlan,
} from './p0MaturityExecutionPlan';

test('keeps the user-selected P0 surfaces in execution order', () => {
  const plan = getP0MaturityExecutionPlan();

  assert.deepEqual(plan.executionOrder, [
    'settings-policy-center',
    'portal-maturity',
    'console-dashboard-maturity',
    'review-console',
    'field-handoff-app',
  ]);
  assert.deepEqual(plan.surfaces.map(surface => surface.conceptId), P0_MATURITY_IDS);
  assert.equal(plan.surfaces[0]?.route, '/settings');
  assert.equal(plan.surfaces.at(-1)?.route, '/field');
});

test('defines concrete screens, shared components, states, and completion definitions', () => {
  for (const surface of getP0MaturityExecutionPlan().surfaces) {
    assert.ok(surface.mustAddScreens.length >= 6, surface.conceptId);
    assert.ok(surface.sharedComponents.length >= 5, surface.conceptId);
    assert.ok(surface.stateContract.length >= 5, surface.conceptId);
    assert.ok(surface.implementationSlice.length >= 4, surface.conceptId);
    assert.match(surface.completionDefinition, /\S/);
  }
});

test('keeps Settings as the shared policy foundation', () => {
  const settings = getP0MaturitySurface('settings-policy-center');

  assert.equal(settings?.order, 1);
  assert.match(settings?.goal ?? '', /one policy source/i);
  assert.match(settings?.stateContract.join(' ') ?? '', /local_only/);
  assert.match(settings?.stateContract.join(' ') ?? '', /full_zk_ethereum/);
  assert.match(settings?.testGates.join(' ') ?? '', /Mode 0 remains usable/i);
});

test('keeps Portal user-control actions free and raw-address safe', () => {
  const portal = getP0MaturitySurface('portal-maturity');

  assert.ok(portal?.freeBoundary.includes('revoke'));
  assert.ok(portal?.freeBoundary.includes('delete'));
  assert.ok(portal?.freeBoundary.includes('export'));
  assert.match(portal?.privacyGates.join(' ') ?? '', /credential refs/i);
  assert.match(portal?.testGates.join(' ') ?? '', /raw address/i);
});

test('wires Dashboard, Review, and Field through review-case and receipt gates', () => {
  const dashboard = getP0MaturitySurface('console-dashboard-maturity');
  const review = getP0MaturitySurface('review-console');
  const field = getP0MaturitySurface('field-handoff-app');

  assert.ok(review?.dependsOn.includes('console-dashboard-maturity'));
  assert.ok(review?.dependsOn.includes('portal-maturity'));
  assert.ok(field?.dependsOn.includes('review-console'));
  assert.match(dashboard?.testGates.join(' ') ?? '', /signature/i);
  assert.match(review?.testGates.join(' ') ?? '', /audit reason/i);
  assert.match(field?.testGates.join(' ') ?? '', /sync conflicts become review cases/i);
});

test('keeps high-risk and local operation protections across all P0 work', () => {
  const plan = getP0MaturityExecutionPlan();
  const crossGates = plan.crossSurfaceTestGates.join(' ');
  const doNotDo = plan.doNotDo.join(' ');

  assert.match(crossGates, /Mode 0 Local Only/);
  assert.match(crossGates, /high-risk controls remain free/i);
  assert.match(doNotDo, /Do not require Ethereum, ZK, hosted registry, or paid services/i);
  assert.match(doNotDo, /Do not make revoke, delete, export, high-risk mode/i);
});

test('renders P0 maturity diagram', () => {
  const diagram = renderP0MaturityMermaid();

  assert.match(diagram, /^flowchart LR/);
  assert.match(diagram, /Settings and Policy Center/);
  assert.match(diagram, /Address Portal/);
  assert.match(diagram, /Review Console/);
  assert.match(diagram, /Field Handoff App/);
});

test('validates the P0 maturity execution plan', () => {
  const validation = validateP0MaturityExecutionPlan();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});
