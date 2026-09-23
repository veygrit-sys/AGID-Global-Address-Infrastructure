import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getP1MaturityExecutionPlan,
  getP1MaturitySurface,
  P1_MATURITY_IDS,
  renderP1MaturityMermaid,
  validateP1MaturityExecutionPlan,
} from './p1MaturityExecutionPlan';

test('keeps the user-selected P1 surfaces in execution order', () => {
  const plan = getP1MaturityExecutionPlan();

  assert.deepEqual(plan.executionOrder, [
    'evidence-vault',
    'developer-platform',
    'address-connect-admin',
    'carrier-label-settlement',
  ]);
  assert.deepEqual(plan.surfaces.map(surface => surface.conceptId), P1_MATURITY_IDS);
  assert.equal(plan.surfaces[0]?.route, '/dashboard/evidence');
  assert.equal(plan.surfaces.at(-1)?.route, '/carrier');
});

test('defines concrete screens, shared components, states, and completion definitions', () => {
  for (const surface of getP1MaturityExecutionPlan().surfaces) {
    assert.ok(surface.mustAddScreens.length >= 7, surface.conceptId);
    assert.ok(surface.sharedComponents.length >= 7, surface.conceptId);
    assert.ok(surface.stateContract.length >= 6, surface.conceptId);
    assert.ok(surface.implementationSlice.length >= 4, surface.conceptId);
    assert.match(surface.completionDefinition, /\S/);
  }
});

test('keeps Evidence Vault local-first and redaction-first', () => {
  const evidence = getP1MaturitySurface('evidence-vault');

  assert.match(evidence?.goal ?? '', /without turning them into a central raw-document database/i);
  assert.ok(evidence?.freeBoundary.includes('local file import'));
  assert.ok(evidence?.freeBoundary.includes('local redaction'));
  assert.match(evidence?.testGates.join(' ') ?? '', /does not call external OCR by default/i);
  assert.match(evidence?.privacyGates.join(' ') ?? '', /raw files stay local or encrypted/i);
});

test('keeps Developer Platform safe for public examples and launch checks', () => {
  const developer = getP1MaturitySurface('developer-platform');

  assert.ok(developer?.dependsOn.includes('console-dashboard-maturity'));
  assert.match(developer?.mustAddScreens.join(' ') ?? '', /OpenAPI explorer/i);
  assert.match(developer?.mustAddScreens.join(' ') ?? '', /Mode 0 self-host quickstart/i);
  assert.match(developer?.testGates.join(' ') ?? '', /redacted sample payloads only/i);
  assert.match(developer?.privacyGates.join(' ') ?? '', /never from live private request bodies/i);
});

test('keeps Address Connect Admin organization-only', () => {
  const connect = getP1MaturitySurface('address-connect-admin');

  assert.ok(connect?.dependsOn.includes('developer-platform'));
  assert.match(connect?.goal ?? '', /without handling personal address records/i);
  assert.match(connect?.testGates.join(' ') ?? '', /personal address fields are rejected/i);
  assert.match(connect?.privacyGates.join(' ') ?? '', /organization metadata, endpoints, public keys, scopes, and status only/i);
});

test('keeps Carrier Label and Settlement separate from address proof and raw labels', () => {
  const carrier = getP1MaturitySurface('carrier-label-settlement');

  assert.ok(carrier?.dependsOn.includes('field-handoff-app'));
  assert.ok(carrier?.dependsOn.includes('address-connect-admin'));
  assert.match(carrier?.testGates.join(' ') ?? '', /cannot issue a label before address decision/i);
  assert.match(carrier?.testGates.join(' ') ?? '', /collect and prepaid status are separate from address proof/i);
  assert.match(carrier?.privacyGates.join(' ') ?? '', /short aliases and commitments/i);
});

test('keeps P1 cross-surface privacy and dependency gates', () => {
  const plan = getP1MaturityExecutionPlan();
  const gates = plan.crossSurfaceTestGates.join(' ');
  const doNotDo = plan.doNotDo.join(' ');

  assert.match(gates, /managed sync cannot happen before evidence redaction/i);
  assert.match(gates, /Developer samples and webhook fixtures cannot be generated from live private payloads/i);
  assert.match(gates, /Connect records reject personal address/i);
  assert.match(gates, /LabelIntent cannot reach label_issued/i);
  assert.match(doNotDo, /Do not merge payment success with address validity/i);
});

test('renders P1 maturity diagram', () => {
  const diagram = renderP1MaturityMermaid();

  assert.match(diagram, /^flowchart LR/);
  assert.match(diagram, /Address Evidence Vault/);
  assert.match(diagram, /Address Developer Platform/);
  assert.match(diagram, /Address Connect Admin/);
  assert.match(diagram, /Carrier Label and Settlement/);
});

test('validates the P1 maturity execution plan', () => {
  const validation = validateP1MaturityExecutionPlan();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});
