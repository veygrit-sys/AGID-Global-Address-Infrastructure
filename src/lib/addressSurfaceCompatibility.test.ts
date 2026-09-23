import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_WORKFLOW_BUILD_ORDER,
  getAddressSurfaceBuildOrder,
  getAddressSurfaceCompatibility,
  getAddressSurfaceCompatibilityDefinitions,
  getSharedPrimitiveCoverage,
  renderAddressSurfaceCompatibilityMermaid,
  summarizeAddressSurfaceCompatibility,
  validateAddressSurfaceCompatibility,
} from './addressSurfaceCompatibility';

test('defines the requested app build order and keeps registration/element first', () => {
  assert.deepEqual(ADDRESS_WORKFLOW_BUILD_ORDER.slice(0, 5), [
    'address-registration',
    'agid-address-element',
    'address-portal',
    'pos-terminal',
    'field-handoff',
  ]);

  assert.deepEqual(
    getAddressSurfaceBuildOrder().map(surface => surface.id),
    ADDRESS_WORKFLOW_BUILD_ORDER,
  );
});

test('Address Registration and Address Element share the same input foundation', () => {
  const registration = getAddressSurfaceCompatibility('address-registration');
  const element = getAddressSurfaceCompatibility('agid-address-element');
  const expectedCapabilities = [
    'country-language-policy',
    'postal-code-autofill',
    'agid-autofill',
    'address-quality-decision',
    'editable-correction',
    'local-learning-feedback',
  ];
  const expectedPrimitives = [
    'address-intent',
    'safe-address-session',
    'registration-assistance',
    'address-correction-feedback',
    'address-verification-evidence',
  ];

  for (const capability of expectedCapabilities) {
    assert.ok(registration.capabilities.includes(capability as any), `registration missing ${capability}`);
    assert.ok(element.capabilities.includes(capability as any), `element missing ${capability}`);
  }
  for (const primitive of expectedPrimitives) {
    assert.ok(registration.sharedPrimitives.includes(primitive as any), `registration missing ${primitive}`);
    assert.ok(element.sharedPrimitives.includes(primitive as any), `element missing ${primitive}`);
  }
  assert.ok(registration.nextRefactor.includes('2000+ line registration surface'));
  assert.ok(element.nextRefactor.includes('public Address Element event contract'));
});

test('keeps POS, Portal, Dashboard, and Field Handoff compatible through shared primitives', () => {
  const portal = getAddressSurfaceCompatibility('address-portal');
  const pos = getAddressSurfaceCompatibility('pos-terminal');
  const field = getAddressSurfaceCompatibility('field-handoff');
  const dashboard = getAddressSurfaceCompatibility('address-dashboard');
  const review = getAddressSurfaceCompatibility('address-review-console');

  assert.ok(portal.capabilities.includes('consent-revoke-delete-export'));
  assert.ok(pos.capabilities.includes('scan-decision-handoff-report'));
  assert.ok(pos.produces.includes('signed-receipt'));
  assert.ok(field.consumes.includes('offline-sync-envelope'));
  assert.ok(field.produces.includes('reachability-report'));
  assert.ok(dashboard.consumes.includes('signed-receipt'));
  assert.ok(review.consumes.includes('review-case'));
  assert.ok(review.produces.includes('signed-receipt'));
});

test('marks privacy-critical later apps as planned and dependent on safe references', () => {
  const evidence = getAddressSurfaceCompatibility('evidence-vault');
  const postalZones = getAddressSurfaceCompatibility('postal-zone-designer');
  const droneLocker = getAddressSurfaceCompatibility('drone-locker-ops');

  assert.equal(evidence.priority, 'P1');
  assert.equal(evidence.maturity, 'planned');
  assert.ok(evidence.produces.includes('evidence-reference'));
  assert.ok(evidence.privacyRules.some(rule => /No automatic external OCR upload/.test(rule)));

  assert.equal(postalZones.priority, 'P2');
  assert.ok(postalZones.produces.includes('postal-zone-plan'));
  assert.ok(postalZones.privacyRules.some(rule => /official postal authority/.test(rule)));

  assert.equal(droneLocker.priority, 'P2');
  assert.ok(droneLocker.produces.includes('reachability-report'));
  assert.ok(droneLocker.privacyRules.some(rule => /not a drone OS or autopilot/.test(rule)));
});

test('summarizes primitive coverage without losing AddressIntent ownership', () => {
  const summary = summarizeAddressSurfaceCompatibility();
  const coverage = getSharedPrimitiveCoverage();
  const addressIntent = coverage.find(item => item.id === 'address-intent');

  assert.equal(summary.totalSurfaces, 11);
  assert.ok(summary.p0Surfaces.includes('address-registration'));
  assert.ok(summary.p0Surfaces.includes('agid-address-element'));
  assert.ok(summary.allSurfacesHaveNoRawAddressRule);
  assert.ok(addressIntent?.producingSurfaces.includes('address-registration'));
  assert.ok(addressIntent?.producingSurfaces.includes('agid-address-element'));
  assert.ok(addressIntent?.consumingSurfaces.includes('pos-terminal'));
});

test('validates common code reuse and compatibility constraints', () => {
  const result = validateAddressSurfaceCompatibility(getAddressSurfaceCompatibilityDefinitions());

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('renders a compatibility graph from shared contracts to app surfaces', () => {
  const diagram = renderAddressSurfaceCompatibilityMermaid();

  assert.match(diagram, /Shared contracts/);
  assert.match(diagram, /Address Registration/);
  assert.match(diagram, /AGID Address Element/);
  assert.match(diagram, /Scan -> Decision|AGID POS Terminal/);
  assert.match(diagram, /reachability report/);
});
