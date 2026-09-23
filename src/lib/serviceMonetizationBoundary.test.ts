import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getServiceMonetizationBoundary,
  getServiceMonetizationEntry,
  summarizeServiceMonetizationBoundary,
  validateServiceMonetizationBoundary,
} from './serviceMonetizationBoundary';

test('keeps all twelve services free by default', () => {
  const summary = summarizeServiceMonetizationBoundary();

  assert.equal(summary.services, 12);
  assert.equal(summary.freeDefaultServices, 12);
  assert.equal(summary.fullyPaidServices, 0);
  assert.equal(summary.paidExceptionCount, 12);
});

test('keeps the resolver, validation, Address Element, POS, and Portal usable for free', () => {
  for (const id of [
    'agid-resolver-service',
    'address-validation-service',
    'agid-address-element',
    'agid-pos-terminal',
    'address-portal',
  ] as const) {
    const entry = getServiceMonetizationEntry(id);
    assert.equal(entry?.defaultAccess, 'free');
    assert.ok((entry?.freeScope.length ?? 0) > 0);
  }
});

test('keeps the requested OSS feature set free across service boundaries', () => {
  const boundary = getServiceMonetizationBoundary();
  const freeText = boundary.entries.flatMap(entry => entry.freeScope).join(' | ');
  const neverChargeText = [
    ...boundary.hardRules,
    ...boundary.entries.flatMap(entry => entry.neverChargeFor),
  ].join(' | ');

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
    'revocation',
    'deletion',
    'export',
  ]) {
    assert.match(freeText, new RegExp(term.replace(/[/-]/g, match => `\\${match}`), 'i'), term);
  }

  for (const term of [
    'local AGID generation',
    'local AGID decode',
    'local AGID-S decryption',
    'postal-code autocomplete',
    'basic address validation',
    'basic POS',
    'offline queue',
    'basic receipt',
    'Address Element',
    'redaction',
    'no-raw-address tests',
    'security fixes',
    'high-risk privacy controls',
  ]) {
    assert.match(neverChargeText, new RegExp(term.replace(/[/-]/g, match => `\\${match}`), 'i'), term);
  }
});

test('charges hosted registry only for public hosted operations, not the registry protocol', () => {
  const registry = getServiceMonetizationEntry('hosted-registry-api');

  assert.equal(registry?.defaultAccess, 'free');
  assert.ok(registry?.freeScope.some(item => /self-hosted issuer registry/i.test(item)));
  assert.ok(registry?.neverChargeFor.some(item => /registry schema/i.test(item)));
  assert.deepEqual(registry?.paidOnlyWhen.map(exception => exception.reason), ['hosted-infrastructure-cost']);
});

test('charges managed ZK only for prover capacity while keeping circuits and self-hosting free', () => {
  const zk = getServiceMonetizationEntry('managed-zk-proof-service');

  assert.equal(zk?.defaultAccess, 'free');
  assert.ok(zk?.freeScope.some(item => /baseline circuits/i.test(item)));
  assert.ok(zk?.freeScope.some(item => /self-host prover path/i.test(item)));
  assert.equal(zk?.paidOnlyWhen[0]?.reason, 'zk-compute-cost');
});

test('charges payment and carrier label operations only for external pass-through costs', () => {
  const payment = getServiceMonetizationEntry('payment-settlement-carrier-label-service');

  assert.equal(payment?.defaultAccess, 'free');
  assert.ok(payment?.freeScope.some(item => /waybill QR format/i.test(item)));
  assert.equal(payment?.paidOnlyWhen[0]?.reason, 'external-pass-through-cost');
  assert.match(payment?.paidOnlyWhen[0]?.chargeOnlyFor.join(' ') ?? '', /payment network fees/);
  assert.match(payment?.paidOnlyWhen[0]?.freeFallback ?? '', /manual carrier label workflows/);
});

test('validates service monetization boundaries against the open-core service catalog', () => {
  const validation = validateServiceMonetizationBoundary(getServiceMonetizationBoundary());

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});
