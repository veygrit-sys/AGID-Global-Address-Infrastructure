import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getAppFeatureMonetizationBoundary,
  getMonetizationEntriesForApp,
  summarizeAppFeatureMonetizationBoundary,
  validateAppFeatureMonetizationBoundary,
} from './appFeatureMonetizationBoundary';

test('summarizes app feature monetization into free, paid, and never-paywalled groups', () => {
  const summary = summarizeAppFeatureMonetizationBoundary();

  assert.equal(summary.totalEntries, 12);
  assert.equal(summary.neverPaywalledEntries, 2);
  assert.equal(summary.freeEntries, 6);
  assert.equal(summary.paidEntries, 4);
  assert.deepEqual(summary.tiers, [
    'never-paywalled',
    'free-local',
    'free-self-hosted',
    'paid-pro',
    'paid-business',
    'paid-enterprise',
  ]);
});

test('keeps local AGID, POS scan, Address Element, and developer baseline usable without paid services', () => {
  const boundary = getAppFeatureMonetizationBoundary();
  const freeIds = boundary.entries
    .filter(entry => entry.tier === 'free-local' || entry.tier === 'free-self-hosted')
    .map(entry => entry.id);

  assert.ok(freeIds.includes('map-local-resolution'));
  assert.ok(freeIds.includes('pos-scan-local-handoff'));
  assert.ok(freeIds.includes('address-element-embed'));
  assert.ok(freeIds.includes('console-developer-baseline'));
});

test('makes the requested OSS feature set explicit in free baselines and launch rules', () => {
  const boundary = getAppFeatureMonetizationBoundary();
  const freeText = boundary.entries.flatMap(entry => entry.freeBaseline).join(' | ');
  const launchText = boundary.launchRules.join(' | ');

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
    'revoke',
    'delete',
    'export',
    'high-risk mode',
    'redaction',
    'no-raw-address tests',
    'security fixes',
  ]) {
    assert.match(freeText, new RegExp(term.replace(/[/-]/g, match => `\\${match}`), 'i'), term);
  }

  for (const term of [
    'local AGID generation',
    'local AGID decode',
    'local AGID-S decryption',
    'user consent review',
    'redaction',
    'security fixes',
  ]) {
    assert.match(launchText, new RegExp(term.replace(/[/-]/g, match => `\\${match}`), 'i'), term);
  }
});

test('never paywalls consent, revocation, deletion, export, high-risk mode, and security controls', () => {
  const boundary = getAppFeatureMonetizationBoundary();
  const neverPaywalled = new Set(boundary.neverPaywallFeatureIds);

  assert.ok(neverPaywalled.has('portal-consent-revocation'));
  assert.ok(neverPaywalled.has('privacy-safety-controls'));
  assert.match(boundary.entries.find(entry => entry.id === 'portal-consent-revocation')?.freeBaseline.join(' ') ?? '', /revoke delete export/);
  assert.match(boundary.entries.find(entry => entry.id === 'privacy-safety-controls')?.freeBaseline.join(' ') ?? '', /high-risk mode/);
});

test('places hosted registry, managed evidence, dashboard operations, and managed ZK behind paid tiers', () => {
  const paid = getAppFeatureMonetizationBoundary().entries
    .filter(entry => entry.tier.startsWith('paid-'))
    .map(entry => [entry.id, entry.tier]);

  assert.deepEqual(paid, [
    ['console-enterprise-operations', 'paid-business'],
    ['hosted-registry-and-sync', 'paid-pro'],
    ['managed-evidence-review', 'paid-business'],
    ['managed-zk-proof-operations', 'paid-enterprise'],
  ]);
});

test('maps monetization entries to each app surface', () => {
  assert.deepEqual(getMonetizationEntriesForApp('pos-terminal-app').map(entry => entry.id), [
    'pos-scan-local-handoff',
    'pos-device-diagnostics-basic',
  ]);
  assert.deepEqual(getMonetizationEntriesForApp('address-portal-app').map(entry => entry.id), [
    'portal-consent-revocation',
  ]);
  assert.ok(getMonetizationEntriesForApp('address-console-app').some(entry => entry.id === 'managed-zk-proof-operations'));
});

test('validates the monetization boundary without safety-control warnings', () => {
  const validation = validateAppFeatureMonetizationBoundary();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});
