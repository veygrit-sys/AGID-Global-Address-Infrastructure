import assert from 'node:assert/strict';
import { test } from 'node:test';

import { evaluateAddressRadar, listAddressRadarRules } from './addressRadar';

test('Address Radar allows a signed, fresh, low-risk handoff', () => {
  const evaluation = evaluateAddressRadar({
    qr: {
      channel: 'qr',
      hasJti: true,
      expiresAt: '2999-01-01T00:00:00.000Z',
      usedBefore: false,
      reuseCount: 0,
      liveChallengeSigned: true,
      agidSecure: true,
    },
    handoff: {
      carrierScanSigned: true,
      recipientProofPresent: true,
      deviceIdPresent: true,
      terminalIdPresent: true,
      timeSkewSeconds: 8,
      coarseLocationPresent: true,
    },
    addressQuality: {
      decision: 'verified',
      score: 0.91,
    },
  });

  assert.equal(evaluation.decision, 'allow');
  assert.equal(evaluation.score, 0);
  assert.deepEqual(evaluation.nextActions, ['allow']);
});

test('Address Radar blocks expired or reused QR tokens', () => {
  const evaluation = evaluateAddressRadar({
    highRiskMode: true,
    qr: {
      channel: 'qr',
      hasJti: false,
      expiresAt: '2000-01-01T00:00:00.000Z',
      usedBefore: true,
      reuseCount: 2,
      liveChallengeSigned: false,
    },
  });

  assert.equal(evaluation.decision, 'block');
  assert.equal(evaluation.riskLevel, 'critical');
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'qr-expired'));
  assert.ok(evaluation.nextActions.includes('rotate_qr'));
  assert.ok(evaluation.nextActions.includes('require_live_challenge'));
});

test('Address Radar blocks combined address enumeration and AOID multi-registration', () => {
  const evaluation = evaluateAddressRadar({
    lookup: {
      attemptsInWindow: 40,
      distinctAgidCount: 30,
      reverseLookupCount: 31,
      failedProofCount: 1,
    },
    aoid: {
      commitmentPresent: true,
      registrationCountInRegion: 2,
    },
  });

  assert.equal(evaluation.decision, 'block');
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'address-enumeration-velocity'));
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'aoid-multi-registration'));
  assert.ok(evaluation.nextActions.includes('throttle_lookup'));
  assert.ok(evaluation.nextActions.includes('manual_review'));
});

test('Address Radar flags unsigned handoff and missing recipient proof', () => {
  const evaluation = evaluateAddressRadar({
    handoff: {
      carrierScanSigned: false,
      recipientProofPresent: false,
      deviceIdPresent: false,
      terminalIdPresent: true,
      timeSkewSeconds: 600,
      afterCompletionRescan: true,
    },
    addressQuality: {
      decision: 'partial',
      score: 0.58,
    },
  });

  assert.equal(evaluation.decision, 'block');
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'handoff-unsigned-carrier'));
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'handoff-missing-recipient-proof'));
  assert.ok(evaluation.nextActions.includes('require_signed_handoff'));
  assert.equal(evaluation.privacy.rawAddressStored, false);
});

test('Address Radar blocks nullifier reuse immediately', () => {
  const evaluation = evaluateAddressRadar({
    aoid: {
      commitmentPresent: true,
      nullifierReused: true,
    },
  });

  assert.equal(evaluation.decision, 'block');
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'aoid-nullifier-reuse'));
  assert.ok(evaluation.nextActions.includes('reject_revoked'));
});

test('Address Radar reviews partial address quality for high-value deliveries', () => {
  const evaluation = evaluateAddressRadar({
    delivery: {
      highValueDelivery: true,
      declaredValueMinor: 250000,
      currency: 'JPY',
    },
    addressQuality: {
      decision: 'partial',
      score: 0.61,
    },
  });

  assert.equal(evaluation.decision, 'review');
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'quality-partial-high-value-delivery'));
  assert.ok(evaluation.nextActions.includes('manual_review'));
  assert.ok(!evaluation.matchedRules.some(rule => rule.id === 'quality-partial'));
});

test('Address Radar rejects old high-risk QR tokens', () => {
  const evaluation = evaluateAddressRadar({
    highRiskMode: true,
    qr: {
      channel: 'qr',
      hasJti: true,
      ageSeconds: 601,
      liveChallengeSigned: true,
      agidSecure: true,
    },
  });

  assert.equal(evaluation.decision, 'block');
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'high-risk-qr-age-exceeded'));
  assert.ok(evaluation.nextActions.includes('reject_token'));
});

test('Address Radar requires recipient passkey for untrusted carrier devices', () => {
  const evaluation = evaluateAddressRadar({
    handoff: {
      carrierScanSigned: true,
      carrierDeviceTrusted: false,
      recipientProofPresent: true,
      deviceIdPresent: true,
      terminalIdPresent: true,
      timeSkewSeconds: 2,
    },
  });

  assert.equal(evaluation.decision, 'review');
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'handoff-untrusted-carrier-device'));
  assert.ok(evaluation.nextActions.includes('require_recipient_passkey'));
});

test('Address Radar blocks compromised devices, stale keys, and missing domain separation', () => {
  const evaluation = evaluateAddressRadar({
    device: {
      terminalTrustScore: 0.2,
      carrierDeviceTrustScore: 0.3,
      rootOrJailbreakDetected: true,
      deviceKeyAgeHours: 1000,
      repeatedDeviceFailures: 3,
    },
    domain: {
      domainSeparated: false,
      crossPurposeReuseDetected: true,
    },
  });

  assert.equal(evaluation.decision, 'block');
  assert.equal(evaluation.riskLevel, 'critical');
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'device-compromised-runtime'));
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'device-key-stale'));
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'domain-separation-missing'));
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'domain-cross-purpose-reuse'));
  assert.ok(evaluation.nextActions.includes('suspend_carrier_device'));
  assert.ok(evaluation.nextActions.includes('rotate_device_key'));
  assert.ok(evaluation.nextActions.includes('block_domain'));
  assert.equal(evaluation.privacy.rawDeviceFingerprintStored, false);
});

test('Address Radar reviews impossible route movement and issuer trust problems', () => {
  const evaluation = evaluateAddressRadar({
    registry: {
      issuerTrustScore: 0.4,
      issuerKeyRecentlyRotated: true,
    },
    route: {
      scanDistanceKm: 600,
      elapsedSincePreviousScanMinutes: 90,
    },
    behavior: {
      sameDeviceDistinctRecipients: 9,
      carrierFailureRatePercent: 10,
    },
  });

  assert.equal(evaluation.decision, 'block');
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'issuer-low-trust'));
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'route-impossible-travel'));
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'behavior-recipient-device-fanout'));
  assert.ok(evaluation.nextActions.includes('require_issuer_reverification'));
  assert.ok(evaluation.nextActions.includes('require_dual_control_review'));
});

test('Address Radar quarantines suspicious feedback and customs conflicts', () => {
  const evaluation = evaluateAddressRadar({
    feedback: {
      correctionBurstCount: 20,
      conflictingCorrectionCount: 5,
      modelPoisoningSuspected: true,
    },
    customs: {
      hsCodeMismatch: true,
      declaredValueOutlier: true,
      restrictedGoodsFlag: true,
    },
  });

  assert.equal(evaluation.decision, 'block');
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'feedback-poisoning-risk'));
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'feedback-conflict-burst'));
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'customs-route-mismatch'));
  assert.ok(evaluation.matchedRules.some(rule => rule.id === 'customs-restricted-goods'));
  assert.ok(evaluation.nextActions.includes('quarantine_feedback'));
  assert.ok(evaluation.nextActions.includes('require_dual_control_review'));
});

test('Address Radar capabilities expose rules without private payload fields', () => {
  const capabilities = listAddressRadarRules();
  assert.ok(capabilities.rules.some(rule => rule.id === 'qr-used-before'));
  assert.ok(capabilities.rules.some(rule => rule.id === 'high-risk-qr-age-exceeded'));
  assert.ok(capabilities.rules.some(rule => rule.id === 'quality-partial-high-value-delivery'));
  assert.ok(capabilities.rules.some(rule => rule.id === 'handoff-untrusted-carrier-device'));
  assert.ok(capabilities.rules.some(rule => rule.id === 'device-compromised-runtime'));
  assert.ok(capabilities.rules.some(rule => rule.id === 'domain-cross-purpose-reuse'));
  assert.ok(capabilities.rules.some(rule => rule.id === 'feedback-poisoning-risk'));
  assert.ok(capabilities.rules.some(rule => rule.id === 'customs-restricted-goods'));
  assert.ok(capabilities.nextActions.includes('require_recipient_passkey'));
  assert.ok(capabilities.nextActions.includes('quarantine_feedback'));
  assert.equal(capabilities.privacy.storesCommitmentsOnly, true);
  assert.equal(capabilities.privacy.rawAoidStored, false);
  assert.equal(capabilities.privacy.rawDeviceFingerprintStored, false);
  assert.equal(capabilities.privacy.rawIpAddressStored, false);
  assert.doesNotMatch(
    JSON.stringify(capabilities),
    /"recipientName"|"phoneNumber"|"plaintextAddress"|"deviceFingerprint"|"ipAddress"/i,
  );
});
