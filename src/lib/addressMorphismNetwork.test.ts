import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { AddressMorphismCandidate } from './addressMorphism';
import {
  AMN_MODEL_VERSION,
  AMN_RESOLUTION_POLICY_VERSION,
  createAmnResolutionEnvelope,
  createInMemoryAmnRegistry,
  stripPrivateAmnEnvelopeMaterial,
  verifyAmnResolutionEnvelope,
} from './addressMorphismNetwork';

const privateInputAddress = '東京都千代田区丸の内1丁目9-1 private unit 10F phone +81-3-SECRET';

const tokyoStationCandidates: AddressMorphismCandidate[] = [
  {
    id: 'jp-official-tokyo-station',
    label: '東京都千代田区丸の内1丁目9-1',
    canonical: {
      country_code: 'jp',
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda',
      subdistrict: 'Marunouchi',
      road: 'Marunouchi',
      house_number: '1-9-1',
      postcode: '1000005',
    },
    lat: 35.681236,
    lon: 139.767125,
    sources: ['jp-open-data', 'nominatim'],
    confidence: 0.94,
    validationScore: 0.96,
    historyEvents: [
      { kind: 'delivery_success', weight: 4, source: 'carrier-proof' },
      { kind: 'manual_confirmation', weight: 2, source: 'owner-device' },
    ],
  },
  {
    id: 'osm-tokyo-station',
    label: '1-9-1 Marunouchi, Chiyoda City, Tokyo 100-0005, Japan',
    canonical: {
      country_code: 'jp',
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda',
      subdistrict: 'Marunouchi',
      road: 'Marunouchi',
      house_number: '1-9-1',
      postcode: '1000005',
    },
    lat: 35.68124,
    lon: 139.76713,
    sources: ['openaddresses', 'osm-nominatim'],
    confidence: 0.9,
    validationScore: 0.91,
  },
];

function resolutionInput() {
  return {
    inputAddress: privateInputAddress,
    candidates: tokyoStationCandidates,
    context: {
      purpose: 'shipping' as const,
      countryCode: 'jp',
      postcode: '1000005',
      lat: 35.6812,
      lon: 139.7671,
    },
    policy: {
      policyVersion: AMN_RESOLUTION_POLICY_VERSION,
      resolverVersion: 'test-resolver-v1',
      purpose: 'shipping' as const,
      qualityThreshold: 0.78,
      unresolvedPolicy: 'do-not-issue-pid-for-unresolved' as const,
      privacyMode: 'commitments-only' as const,
    },
    evidence: [
      {
        sourceId: 'jp-open-data',
        evidenceType: 'official-postal' as const,
        subjectCommitment: 'jp-postal-tokyo-station-commitment',
        confidence: 0.97,
        observedAt: '2026-06-06T00:00:00.000Z',
      },
      {
        sourceId: 'osm-nominatim',
        evidenceType: 'map-feature' as const,
        subjectCommitment: 'osm-tokyo-station-commitment',
        confidence: 0.86,
        observedAt: '2026-06-06T00:00:00.000Z',
      },
    ],
    historyUpdate: {
      previousHistoryRoot: 'history-root-before',
      nextHistoryRoot: 'history-root-after',
      eventCount: 2,
      updatedAt: '2026-06-06T00:01:00.000Z',
    },
    proofBundleId: 'ZKB-TOKYO-STATION-AMN',
    issuedAt: '2026-06-06T00:02:00.000Z',
    privateSalt: 'private-amn-test-salt',
  };
}

test('creates a privacy-preserving AMN resolution envelope from AMT resolution output', () => {
  const envelope = createAmnResolutionEnvelope(resolutionInput());
  const publicEnvelope = stripPrivateAmnEnvelopeMaterial(envelope);

  assert.equal(envelope.claim.modelVersion, AMN_MODEL_VERSION);
  assert.match(envelope.claim.envelopeId, /^AMN-[0-9A-F]{24}$/u);
  assert.match(envelope.claim.policyHash, /^[a-f0-9]{64}$/u);
  assert.match(envelope.claim.evidenceRoot, /^[a-f0-9]{64}$/u);
  assert.equal(envelope.claim.policy.policyVersion, AMN_RESOLUTION_POLICY_VERSION);
  assert.equal(envelope.claim.resolution.status, 'verified');
  assert.match(envelope.claim.resolution.pid ?? '', /^AMT-[0-9A-F]{32}$/u);
  assert.match(envelope.claim.resolution.rpid ?? '', /^RPID-[0-9A-F]{32}$/u);
  assert.match(envelope.claim.resolution.dpid ?? '', /^DPID-[0-9A-F]{32}$/u);
  assert.equal(envelope.claim.resolution.clusterCount, 1);
  assert.equal(envelope.claim.resolution.candidateCount, 2);
  assert.ok(envelope.claim.workflow.every(step => step.passed));
  assert.deepEqual(envelope.claim.privacy.hides, [
    'input-address',
    'raw-candidates',
    'raw-clusters',
    'recipient',
    'aoid',
    'phone',
    'exact-private-coordinates',
  ]);
  assert.equal('privateSalt' in publicEnvelope, false);
  assert.equal('localCacheKey' in publicEnvelope, false);
  assert.doesNotMatch(JSON.stringify(publicEnvelope), /private unit|phone \+81|SECRET|owner-device|東京都千代田区丸の内/u);
});

test('verifies AMN resolution envelopes using public policy and evidence commitments only', () => {
  const envelope = stripPrivateAmnEnvelopeMaterial(createAmnResolutionEnvelope(resolutionInput()));
  const verified = verifyAmnResolutionEnvelope(envelope, {
    expectedPolicyHash: envelope.claim.policyHash,
    expectedEvidenceRoot: envelope.claim.evidenceRoot,
    minimumConfidence: 0.9,
    now: '2026-06-06T00:03:00.000Z',
  });

  assert.equal(verified.valid, true);
  assert.equal(verified.workflowPassed, true);
  assert.equal(verified.privacyPreserved, true);
  assert.equal(verified.errors.length, 0);

  const mismatch = verifyAmnResolutionEnvelope(envelope, {
    expectedPolicyHash: 'bad-policy-hash',
  });
  assert.equal(mismatch.valid, false);
  assert.ok(mismatch.errors.includes('policy-hash-mismatch'));
});

test('registers public AMN envelopes without storing raw address material', () => {
  const registry = createInMemoryAmnRegistry();
  const envelope = stripPrivateAmnEnvelopeMaterial(createAmnResolutionEnvelope(resolutionInput()));
  const registration = registry.registerEnvelope(envelope);

  assert.equal(registration.status, 'registered');
  assert.equal(registration.record?.rawEnvelopeStored, false);
  assert.equal(registration.record?.envelopeId, envelope.claim.envelopeId);
  assert.equal(registration.record?.policyHash, envelope.claim.policyHash);
  assert.equal(registry.verifyEnvelope(envelope.claim.envelopeId).valid, true);
  assert.equal(registry.getStats().activeEnvelopes, 1);

  const duplicate = registry.registerEnvelope(envelope);
  assert.equal(duplicate.status, 'already_registered');
  assert.equal(registry.getStats().totalEnvelopes, 1);

  assert.doesNotMatch(JSON.stringify(registration), /private unit|phone \+81|SECRET|東京都千代田区丸の内/u);
});
