import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  classifyZkPublicSignal,
  getZkBaselineHardeningPlan,
  validateZkBaselineHardeningPlan,
  validateZkPublicSignalSet,
} from './zkBaselineHardening';

test('defines the ZK baseline hardening controls and production blockers', () => {
  const plan = getZkBaselineHardeningPlan();

  assert.equal(plan.controls.length, 8);
  assert.deepEqual(plan.controls.filter(control => control.priority === 'P0').map(control => control.id), [
    'public-signal-allowlist',
    'witness-hygiene',
    'domain-separated-nullifiers',
    'fixture-production-separation',
  ]);
  assert.ok(plan.productionBlockers.includes('fixture circuit used as production privacy circuit'));
  assert.ok(plan.productionBlockers.includes('witness or private input logged or stored'));
  assert.ok(plan.recommendedCommands.includes('npm run verify:zk:circuit'));
});

test('allows only reviewed public signals and blocks address/witness leakage signals', () => {
  assert.equal(classifyZkPublicSignal('scope hash'), 'allowed');
  assert.equal(classifyZkPublicSignal('issuer_root'), 'allowed');
  assert.equal(classifyZkPublicSignal('proof-expiry'), 'allowed');

  assert.equal(classifyZkPublicSignal('raw AGID'), 'forbidden');
  assert.equal(classifyZkPublicSignal('AGID-S ciphertext'), 'forbidden');
  assert.equal(classifyZkPublicSignal('precise coordinates'), 'forbidden');
  assert.equal(classifyZkPublicSignal('witness'), 'forbidden');

  assert.equal(classifyZkPublicSignal('experimental operator score'), 'unknown');
});

test('validates public signal sets with errors for forbidden values and warnings for unknown values', () => {
  const safe = validateZkPublicSignalSet([
    'predicate identifier',
    'scope hash',
    'issuer root',
    'revocation root',
    'nullifier hash',
    'proof expiry',
  ]);

  assert.equal(safe.valid, true);
  assert.deepEqual(safe.errors, []);
  assert.deepEqual(safe.warnings, []);

  const unsafe = validateZkPublicSignalSet([
    'scope hash',
    'raw address text',
    'experimental operator score',
    'witness',
  ]);

  assert.equal(unsafe.valid, false);
  assert.deepEqual(unsafe.forbidden, ['raw address text', 'witness']);
  assert.deepEqual(unsafe.unknown, ['experimental operator score']);
  assert.ok(unsafe.errors.includes('forbidden-public-signal:raw address text'));
  assert.ok(unsafe.warnings.includes('unknown-public-signal:experimental operator score'));
});

test('keeps ZK wording honest until production circuits are audited', () => {
  const plan = getZkBaselineHardeningPlan();

  assert.ok(plan.wordingRules.some(rule => /ZK-ready envelopes/i.test(rule)));
  assert.ok(plan.wordingRules.some(rule => /fixture circuits tooling fixtures/i.test(rule)));
  assert.ok(plan.wordingRules.some(rule => /production-grade ZK/i.test(rule)));
  assert.ok(plan.wordingRules.some(rule => /not the real-world truth/i.test(rule)));
});

test('validates the complete ZK baseline hardening plan', () => {
  const validation = validateZkBaselineHardeningPlan();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});
