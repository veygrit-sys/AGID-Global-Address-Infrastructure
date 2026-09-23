import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assessDeliveryFraudRisk,
  type DeliveryFraudCredentialState,
  type DeliveryFraudLocationSample,
  type DeliveryFraudProofState,
  type DeliveryFraudRequestEvent,
} from './deliveryFraudDetection';

const now = new Date('2026-07-01T12:00:00Z');

function kindSet(assessment: ReturnType<typeof assessDeliveryFraudRisk>) {
  return new Set(assessment.findings.map(finding => finding.kind));
}

test('detects GPS spoofing and impossible travel speed without publishing precise location', () => {
  const locationSamples: DeliveryFraudLocationSample[] = [
    {
      sampleId: 'loc-1',
      observedAt: '2026-07-01T11:58:00Z',
      agidCellId: 'agid:jp:tokyo:coarse-01',
      lat: 35.681236,
      lon: 139.767125,
      accuracyMeters: 20,
      provider: 'gps',
      mockLocationDetected: true,
      deviceAttested: false,
      sensorFusionConsistent: false,
    },
    {
      sampleId: 'loc-2',
      observedAt: '2026-07-01T11:59:00Z',
      agidCellId: 'agid:jp:osaka:coarse-01',
      lat: 34.702485,
      lon: 135.495951,
      accuracyMeters: 22,
      provider: 'gps',
      mockLocationDetected: false,
      deviceAttested: true,
      sensorFusionConsistent: true,
    },
  ];

  const assessment = assessDeliveryFraudRisk({ locationSamples, now });
  const kinds = kindSet(assessment);

  assert.equal(assessment.decision, 'block');
  assert.ok(assessment.riskScore >= 90);
  assert.ok(kinds.has('gps-spoofing'));
  assert.ok(kinds.has('impossible-speed'));
  assert.ok(assessment.requiredControls.includes('require-live-device-attestation'));
  assert.deepEqual(assessment.privacy, {
    rawAddressUsed: false,
    preciseLocationPublic: false,
    privateKeyMaterialUsed: false,
    proofWitnessUsed: false,
  });
});

test('detects request bursts and device signature contradictions', () => {
  const requestEvents: DeliveryFraudRequestEvent[] = Array.from({ length: 14 }, (_, index) => ({
    eventId: `evt-${index}`,
    observedAt: '2026-07-01T11:59:30Z',
    deviceId: 'device-a',
    sessionId: 'session-a',
    signatureVerified: index !== 0,
    signedDeviceId: index === 1 ? 'device-b' : 'device-a',
    credentialDeviceId: index === 2 ? 'device-c' : 'device-a',
    proofChallengeHash: 'challenge-a',
    expectedChallengeHash: index === 3 ? 'challenge-b' : 'challenge-a',
    proofScope: 'delivery.standard',
    expectedScope: index === 4 ? 'delivery.high' : 'delivery.standard',
  }));

  const assessment = assessDeliveryFraudRisk({ requestEvents, now });
  const kinds = kindSet(assessment);

  assert.equal(assessment.decision, 'block');
  assert.ok(kinds.has('request-burst'));
  assert.ok(kinds.has('signature-mismatch'));
  assert.ok(kinds.has('device-credential-mismatch'));
  assert.ok(kinds.has('proof-scope-mismatch'));
  assert.ok(assessment.requiredControls.includes('rate-limit-device-and-session'));
  assert.ok(assessment.requiredControls.includes('require-device-rebind-or-passkey-step-up'));
});

test('blocks ZK replay and invalid address credential states', () => {
  const credentials: DeliveryFraudCredentialState[] = [
    {
      credentialId: 'cred-revoked',
      issuerTrusted: false,
      revoked: true,
      expired: true,
      freshnessSeconds: 60 * 60 * 24 * 60,
      deviceBound: false,
    },
  ];
  const proofs: DeliveryFraudProofState[] = [
    {
      proofId: 'proof-replay',
      zkReady: true,
      verified: true,
      replayDetected: true,
      nullifierUsedBefore: true,
      scopeMatches: true,
      challengeMatches: true,
    },
  ];

  const assessment = assessDeliveryFraudRisk({ credentials, proofs, now });
  const kinds = kindSet(assessment);

  assert.equal(assessment.decision, 'block');
  assert.ok(kinds.has('credential-invalid'));
  assert.ok(kinds.has('zk-proof-replay'));
  assert.ok(kinds.has('stale-evidence'));
  assert.ok(assessment.requiredControls.includes('reject-nullifier-and-rotate-session'));
  assert.ok(assessment.requiredControls.includes('check-revocation-and-reissue-credential'));
});

test('allows clean credential, proof, request, and coarse location signals', () => {
  const assessment = assessDeliveryFraudRisk({
    now,
    locationSamples: [
      {
        sampleId: 'loc-clean',
        observedAt: '2026-07-01T11:59:50Z',
        agidCellId: 'agid:ag:barbuda:coarse-01',
        lat: 17.642,
        lon: -61.824,
        accuracyMeters: 180,
        provider: 'carrier-scan',
        mockLocationDetected: false,
        deviceAttested: true,
        sensorFusionConsistent: true,
      },
    ],
    requestEvents: [
      {
        eventId: 'evt-clean',
        observedAt: '2026-07-01T11:59:55Z',
        deviceId: 'device-clean',
        sessionId: 'session-clean',
        signatureVerified: true,
        signedDeviceId: 'device-clean',
        credentialDeviceId: 'device-clean',
        proofChallengeHash: 'challenge-clean',
        expectedChallengeHash: 'challenge-clean',
        proofScope: 'delivery.standard',
        expectedScope: 'delivery.standard',
      },
    ],
    credentials: [
      {
        credentialId: 'cred-clean',
        issuerTrusted: true,
        revoked: false,
        expired: false,
        freshnessSeconds: 3600,
        deviceBound: true,
      },
    ],
    proofs: [
      {
        proofId: 'proof-clean',
        zkReady: true,
        verified: true,
        expired: false,
        replayDetected: false,
        nullifierUsedBefore: false,
        scopeMatches: true,
        challengeMatches: true,
      },
    ],
  });

  assert.equal(assessment.decision, 'allow');
  assert.equal(assessment.riskScore, 0);
  assert.deepEqual(assessment.findings, []);
  assert.ok(assessment.safeSummary.includes('decision:allow'));
  assert.deepEqual(assessment.privacy, {
    rawAddressUsed: false,
    preciseLocationPublic: false,
    privateKeyMaterialUsed: false,
    proofWitnessUsed: false,
  });
});
