import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getOpenCoreProductStrategy,
  getServicesForApp,
  summarizeOpenCoreProductStrategy,
  validateOpenCoreProductStrategy,
} from './openCoreProductStrategy';

test('summarizes the intended open-core product counts', () => {
  const summary = summarizeOpenCoreProductStrategy();

  assert.equal(summary.openSourceFeatureAreas, 8);
  assert.equal(summary.nonNegotiableOpenSourceFeatures, 6);
  assert.equal(summary.commercialFeatureAreas, 8);
  assert.equal(summary.appPartitions, 5);
  assert.equal(summary.serviceOfferings, 12);
  assert.equal(summary.mvpServices, 5);
});

test('keeps the standards, SDKs, resolver, Address Element, basic POS, privacy, ZK, and docs open', () => {
  const labels = getOpenCoreProductStrategy().openSourceFeatures.map(item => item.label);

  assert.deepEqual(labels, [
    'AGID/AOID standards',
    'SDK and CLI',
    'Local Resolver',
    'Address Element',
    'Basic POS',
    'Privacy and Security',
    'ZK baseline',
    'Docs and research',
  ]);
});

test('locks user-specified local, POS, Element, Portal, and safety capabilities into the OSS surface', () => {
  const strategy = getOpenCoreProductStrategy();
  const required = strategy.nonNegotiableOpenSourceFeatures.flatMap(feature => feature.mustRemainOpenSource);
  const noCharge = strategy.nonNegotiableOpenSourceFeatures.flatMap(feature => feature.cannotChargeFor);

  for (const term of [
    'AGID generation',
    'AGID decode',
    'AGID-S local decrypt',
    'local address display',
    'language tabs',
    'postal-code autocomplete',
    'basic address validation',
    'QR/NFC intake',
    'basic POS',
    'offline queue',
    'basic receipt',
    'Address Element embeddable UI',
    'user consent review',
    'revoke',
    'delete',
    'export',
    'high-risk mode',
    'redaction',
    'no-raw-address tests',
    'security fixes',
  ]) {
    assert.ok(required.includes(term), term);
  }

  for (const term of [
    'local AGID generation',
    'local AGID decode',
    'local AGID-S decryption',
    'basic POS operation',
    'offline queue',
    'basic receipt',
    'embeddable address input UI',
    'consent review',
    'revocation',
    'deletion',
    'export',
    'high-risk mode',
    'redaction',
    'privacy regression tests',
    'security fixes',
  ]) {
    assert.ok(noCharge.includes(term), term);
  }
});

test('separates managed operations into commercial feature areas with open-source dependencies', () => {
  const commercial = getOpenCoreProductStrategy().commercialFeatures;

  assert.equal(commercial.length, 8);
  for (const area of commercial) {
    assert.ok(area.dependsOnOpenSource.length > 0, area.id);
    assert.ok(area.guardrails.length > 0, area.id);
  }
  assert.ok(commercial.some(area => area.label === 'Hosted Registry API'));
  assert.ok(commercial.some(area => area.label === 'Managed ZK'));
});

test('uses four deployable apps plus one embedded component', () => {
  const apps = getOpenCoreProductStrategy().appPartitions;

  assert.equal(apps.filter(app => app.deploymentShape !== 'embedded-sdk-component').length, 4);
  assert.ok(apps.some(app => app.id === 'address-element-component' && app.route === null));
  assert.deepEqual(apps.map(app => app.route), ['/', '/pos', '/portal', '/dashboard', null]);
});

test('maps service offerings to their owning app partitions', () => {
  const posServices = getServicesForApp('pos-terminal-app').map(service => service.id);
  const consoleServices = getServicesForApp('address-console-app').map(service => service.id);

  assert.deepEqual(posServices, ['agid-pos-terminal', 'payment-settlement-carrier-label-service']);
  assert.ok(consoleServices.includes('hosted-registry-api'));
  assert.ok(consoleServices.includes('managed-zk-proof-service'));
  assert.ok(consoleServices.includes('address-evidence-vault'));
});

test('validates the strategy and keeps Mode 0 independent from commercial services', () => {
  const strategy = getOpenCoreProductStrategy();
  const validation = validateOpenCoreProductStrategy(strategy);

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
  assert.ok(strategy.hardRules.some(rule => /Mode 0 local operation/i.test(rule)));
  assert.ok(strategy.hardRules.some(rule => /Commercial services must not be required/i.test(rule)));
});
