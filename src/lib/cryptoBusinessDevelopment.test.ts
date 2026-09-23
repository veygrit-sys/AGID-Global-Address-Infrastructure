import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getCryptoBusinessDeveloperProgram,
  getCryptoBusinessTracksForBusinessType,
  validateCryptoBusinessDeveloperProgram,
} from './cryptoBusinessDevelopment';

test('builds a crypto business developer program without making crypto mandatory', () => {
  const program = getCryptoBusinessDeveloperProgram();

  assert.equal(program.version, 'agid-crypto-business-development-v1');
  assert.equal(program.defaultMode, 'mode-0-local-only');
  assert.match(program.positioning, /optional|registry|payment|wallet|ZK/i);
  assert.ok(program.hardRules.some(rule => /Mode 0 and Mode 1/i.test(rule)));
  assert.ok(program.hardRules.some(rule => /not a token-launch requirement/i.test(rule)));
});

test('defines concrete contribution tracks for crypto businesses', () => {
  const program = getCryptoBusinessDeveloperProgram();
  const ids = program.contributionTracks.map(track => track.id);

  assert.ok(ids.includes('registry-read-adapter'));
  assert.ok(ids.includes('registry-write-adapter'));
  assert.ok(ids.includes('payment-escrow-gate'));
  assert.ok(ids.includes('wallet-operator-ui'));
  assert.ok(ids.includes('zk-proof-workflow'));
  assert.ok(ids.includes('relayer-worker'));
  assert.ok(ids.includes('security-audit'));
});

test('keeps chain payloads commitment-only and forbids private address material', () => {
  const program = getCryptoBusinessDeveloperProgram();

  for (const track of program.contributionTracks) {
    assert.ok(track.publicChainPayload.some(item => /commitment|root|nullifier|status|metadata|hash|scope|amount|token/i.test(item)), track.id);
    assert.ok(track.forbiddenPayload.some(item => /raw address/i.test(item)), track.id);
    assert.ok(track.forbiddenPayload.some(item => /raw AOID/i.test(item)), track.id);
    assert.ok(track.forbiddenPayload.some(item => /AGID-S/i.test(item)), track.id);
    assert.ok(track.requiredTests.length > 0, track.id);
  }
});

test('recommends tracks by crypto business type', () => {
  const exchangeTracks = getCryptoBusinessTracksForBusinessType('exchange').map(track => track.id);
  const zkTracks = getCryptoBusinessTracksForBusinessType('zk-proof-provider').map(track => track.id);
  const carrierTracks = getCryptoBusinessTracksForBusinessType('carrier-or-pos-integrator').map(track => track.id);

  assert.ok(exchangeTracks.includes('registry-read-adapter'));
  assert.ok(exchangeTracks.includes('payment-escrow-gate'));
  assert.ok(exchangeTracks.includes('wallet-operator-ui'));
  assert.ok(zkTracks.includes('zk-proof-workflow'));
  assert.ok(zkTracks.includes('security-audit'));
  assert.ok(carrierTracks.includes('payment-escrow-gate'));
  assert.ok(carrierTracks.includes('external-sdk'));
});

test('validates crypto business readiness checklist and high-risk test coverage', () => {
  const validation = validateCryptoBusinessDeveloperProgram();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});
