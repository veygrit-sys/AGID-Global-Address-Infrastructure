import assert from 'node:assert/strict';
import { test } from 'node:test';

import { evaluateAddressSignal, listAddressSignalChecks } from './addressSignal';

test('Address Signal proceeds for fresh low-risk pre-delivery evidence', () => {
  const evaluation = evaluateAddressSignal({
    qr: {
      channel: 'qr',
      jti: 'jti_fresh_001',
      expiresAt: '2999-01-01T00:00:00.000Z',
      usedBefore: false,
      reuseCount: 0,
      liveChallengeSigned: true,
    },
    nullifier: {
      reused: false,
      reuseCount: 0,
    },
    addressQuality: {
      decision: 'verified',
      score: 0.94,
    },
    delivery: {
      declaredValueMinor: 1200,
      currency: 'JPY',
    },
    carrier: {
      scanSigned: true,
      deviceTrusted: true,
      deviceIdPresent: true,
      terminalIdPresent: true,
    },
    issuer: {
      status: 'active',
      freshnessAgeSeconds: 30,
      maxFreshnessAgeSeconds: 900,
    },
    recipient: {
      proofPresent: true,
    },
  });

  assert.equal(evaluation.outcome, 'proceed');
  assert.equal(evaluation.score, 0);
  assert.deepEqual(evaluation.nextActions, ['allow']);
  assert.equal(evaluation.evidence.qrFresh, true);
  assert.equal(evaluation.evidence.nullifierFresh, true);
  assert.equal(evaluation.evidence.issuerActive, true);
});

test('Address Signal rejects expired QR and reused nullifier evidence', () => {
  const evaluation = evaluateAddressSignal({
    qr: {
      channel: 'qr',
      jti: 'jti_replayed_001',
      expiresAt: '2000-01-01T00:00:00.000Z',
    },
    nullifier: {
      reused: true,
      reuseCount: 1,
    },
  });

  assert.equal(evaluation.outcome, 'reject');
  assert.equal(evaluation.riskLevel, 'critical');
  assert.ok(evaluation.reasons.includes('qr-expired'));
  assert.ok(evaluation.reasons.includes('nullifier-reused'));
  assert.ok(evaluation.nextActions.includes('rotate_qr'));
  assert.ok(evaluation.nextActions.includes('reject_revoked'));
});

test('Address Signal sends partial high-value deliveries to review', () => {
  const evaluation = evaluateAddressSignal({
    addressQuality: {
      decision: 'partial',
      score: 0.61,
    },
    delivery: {
      declaredValueMinor: 250000,
      highValueThresholdMinor: 50000,
      currency: 'JPY',
    },
  });

  assert.equal(evaluation.outcome, 'review');
  assert.ok(evaluation.reasons.includes('address-quality-partial'));
  assert.ok(evaluation.reasons.includes('high-value-delivery'));
  assert.ok(evaluation.matchedRuleIds.includes('quality-partial-high-value-delivery'));
  assert.equal(evaluation.operatorDecision.label, 'Manual review');
});

test('Address Signal challenges recipient proof when carrier device is untrusted', () => {
  const evaluation = evaluateAddressSignal({
    carrier: {
      scanSigned: true,
      deviceTrusted: false,
      deviceIdPresent: true,
      terminalIdPresent: true,
    },
    recipient: {
      proofPresent: true,
    },
  });

  assert.equal(evaluation.outcome, 'challenge');
  assert.ok(evaluation.reasons.includes('carrier-device-untrusted'));
  assert.ok(evaluation.nextActions.includes('require_recipient_passkey'));
  assert.equal(evaluation.operatorDecision.label, 'Challenge recipient');
});

test('Address Signal rejects revoked issuers before delivery handoff', () => {
  const evaluation = evaluateAddressSignal({
    issuer: {
      status: 'revoked',
      freshnessAgeSeconds: 10,
    },
  });

  assert.equal(evaluation.outcome, 'reject');
  assert.ok(evaluation.reasons.includes('issuer-revoked'));
  assert.ok(evaluation.matchedRuleIds.includes('registry-revoked'));
  assert.equal(evaluation.evidence.issuerActive, false);
});

test('Address Signal capabilities expose no raw address payload fields', () => {
  const checks = listAddressSignalChecks();
  assert.ok(checks.reasons.includes('qr-expired'));
  assert.ok(checks.reasons.includes('nullifier-reused'));
  assert.ok(checks.reasons.includes('issuer-revoked'));
  assert.equal(checks.privacy.rawAddressStored, false);
  assert.equal(checks.privacy.rawQrPayloadStored, false);
  assert.equal(checks.privacy.storesSignalMetadataOnly, true);
  assert.doesNotMatch(JSON.stringify(checks), /recipientName|phoneNumber|plaintextAddress|roomNumber/i);
});
