import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildFrontendImplementationPackage,
  buildFrontendImplementationRoadmap,
  listFrontendImplementationPackages,
  renderFrontendImplementationMermaid,
  validateFrontendImplementationPackages,
} from './frontendImplementationPreparation';

test('creates one frontend implementation package for every researched surface', () => {
  const packages = listFrontendImplementationPackages();
  const ids = packages.map(pkg => pkg.surfaceId);

  assert.ok(ids.includes('map-workspace'));
  assert.ok(ids.includes('address-registration'));
  assert.ok(ids.includes('agid-address-element'));
  assert.ok(ids.includes('pos-terminal'));
  assert.ok(ids.includes('address-portal'));
  assert.ok(ids.includes('address-dashboard'));
  assert.ok(ids.includes('address-review-console'));
  assert.ok(ids.includes('developer-console'));
  assert.ok(ids.includes('evidence-vault'));
  assert.ok(ids.includes('settings-and-policy'));
});

test('prepares the address registration stepper and evidence import slice', () => {
  const pkg = buildFrontendImplementationPackage('address-registration');
  assert.ok(pkg);

  assert.equal(pkg.priority, 'P0');
  assert.equal(pkg.stage, 'ready-now');
  assert.ok(pkg.artifacts.some(artifact => artifact.name === 'AddressRegistrationStepper'));
  assert.ok(pkg.artifacts.some(artifact => artifact.name === 'EvidenceImportStep'));
  assert.ok(pkg.privacyGates.some(gate => gate.id.endsWith('evidence-edit-redact-before-submit')));
  assert.ok(pkg.implementationOrder.some(step => /three-step registration stepper/i.test(step)));
});

test('prepares POS task lanes without losing scan-to-decision safety gates', () => {
  const pkg = buildFrontendImplementationPackage('pos-terminal');
  assert.ok(pkg);

  assert.equal(pkg.priority, 'P0');
  assert.equal(pkg.stage, 'needs-component-refactor');
  assert.equal(pkg.commercialSplit.productShape, 'separate-app');
  assert.equal(pkg.commercialSplit.sourceBoundary, 'open-source-reference-app');
  assert.ok(pkg.commercialSplit.openSourceScope.some(scope => /basic POS scan-to-decision/i.test(scope)));
  assert.ok(pkg.commercialSplit.commercialScope.some(scope => /fleet device/i.test(scope)));
  assert.ok(pkg.artifacts.some(artifact => artifact.name === 'PosTaskLanes'));
  assert.ok(pkg.artifacts.some(artifact => artifact.name === 'PosTaskLaneState'));
  assert.ok(pkg.privacyGates.some(gate => gate.id.endsWith('qr-nfc-no-raw-payload-storage')));
  assert.ok(pkg.testPlan.some(step => /QR\/NFC payloads/i.test(step)));
});

test('keeps Address Element as open-source embedded core with privacy-safe host events', () => {
  const pkg = buildFrontendImplementationPackage('agid-address-element');
  assert.ok(pkg);

  assert.equal(pkg.commercialSplit.productShape, 'embedded-component');
  assert.equal(pkg.commercialSplit.sourceBoundary, 'open-source-core');
  assert.ok(pkg.commercialSplit.openSourceScope.some(scope => /public event contract/i.test(scope)));
  assert.ok(pkg.commercialSplit.avoidInOpenCore.some(item => /raw AOID/i.test(item)));
});

test('prepares one settings and policy center for language, mode, provider, and high-risk policy', () => {
  const pkg = buildFrontendImplementationPackage('settings-and-policy');
  assert.ok(pkg);

  assert.equal(pkg.priority, 'P0');
  assert.equal(pkg.commercialSplit.productShape, 'shared-engine-feature');
  assert.equal(pkg.commercialSplit.sourceBoundary, 'open-source-core');
  assert.ok(pkg.artifacts.some(artifact => artifact.name === 'SettingsPolicyCenter'));
  assert.ok(pkg.artifacts.some(artifact => artifact.name === 'FrontendPolicyState'));
  assert.ok(pkg.privacyGates.some(gate => gate.id.endsWith('language-propagation')));
  assert.ok(pkg.implementationOrder.some(step => /mode 0-4/i.test(step)));
  assert.ok(pkg.designNotes.some(note => /one language setting/i.test(note)));
});

test('keeps developer console as a dashboard tab with redacted logs and launch checklist', () => {
  const pkg = buildFrontendImplementationPackage('developer-console');
  assert.ok(pkg);

  assert.equal(pkg.priority, 'P2');
  assert.equal(pkg.routeStrategy, 'add-dashboard-tab');
  assert.equal(pkg.recommendedRoute, '/dashboard');
  assert.ok(pkg.artifacts.some(artifact => artifact.name === 'DeveloperConsoleTab'));
  assert.ok(pkg.artifacts.some(artifact => artifact.name === 'FrontendProviderDataFlowPreview'));
  assert.ok(pkg.privacyGates.some(gate => gate.id.endsWith('developer-logs-redacted')));
});

test('separates reference admin UI from commercial hosted operations', () => {
  const dashboard = buildFrontendImplementationPackage('address-dashboard');
  const review = buildFrontendImplementationPackage('address-review-console');
  assert.ok(dashboard);
  assert.ok(review);

  assert.equal(dashboard.commercialSplit.productShape, 'dashboard-module');
  assert.equal(dashboard.commercialSplit.sourceBoundary, 'commercial-hosted-extension');
  assert.ok(dashboard.commercialSplit.openSourceScope.some(scope => /minimal local\/admin reference dashboard/i.test(scope)));
  assert.ok(dashboard.commercialSplit.commercialScope.some(scope => /SLA monitoring/i.test(scope)));

  assert.equal(review.commercialSplit.productShape, 'dashboard-module');
  assert.equal(review.commercialSplit.sourceBoundary, 'commercial-enterprise-extension');
  assert.ok(review.commercialSplit.openSourceScope.some(scope => /review case data model/i.test(scope)));
  assert.ok(review.commercialSplit.commercialScope.some(scope => /advanced Address Radar/i.test(scope)));
});

test('builds a prioritized frontend implementation roadmap', () => {
  const roadmap = buildFrontendImplementationRoadmap();
  const firstIds = roadmap.firstImplementationSlice.map(pkg => pkg.surfaceId);

  assert.equal(roadmap.version, 'agid-frontend-implementation-prep-v1');
  assert.ok(firstIds.includes('address-registration'));
  assert.ok(firstIds.includes('agid-address-element'));
  assert.ok(firstIds.includes('settings-and-policy'));
  assert.ok(roadmap.sharedContracts.includes('AddressIntent state machine'));
  assert.ok(roadmap.sharedContracts.includes('safe payload boundary: no raw AGID/AOID/address in UI events'));
  assert.ok(roadmap.routeWork['/dashboard'].includes('developer-console'));
  assert.ok(roadmap.routeWork['(embedded)'].includes('agid-address-element'));
  assert.ok(roadmap.requiredTestSuites.some(path => /AddressRegistrationStepper\.test\.tsx$/.test(path)));
});

test('validates implementation packages and renders an implementation mermaid diagram', () => {
  const validation = validateFrontendImplementationPackages();
  const diagram = renderFrontendImplementationMermaid();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.match(diagram, /^flowchart LR/);
  assert.match(diagram, /Frontend Ecosystem Research/);
  assert.match(diagram, /Tests and privacy gates/);
});
