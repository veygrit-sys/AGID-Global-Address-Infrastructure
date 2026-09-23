import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { AddressTabQualityScore } from './addressTabQuality';
import {
  createQualityThresholdProof,
  stripPrivateQualityThresholdProofMaterial,
  verifyQualityThresholdProof,
} from './qualityThresholdProof';

const issuerId = 'agid-quality-threshold-test';
const issuerSecret = 'test-only-quality-threshold-issuer-secret';
const challenge = 'checkout-quality-threshold-nonce-001';

const stableTokyoTabQuality: AddressTabQualityScore = {
  tab: 'ja',
  score: 91,
  tier: 'stable',
  decision: 'show',
  environment: 'urban',
  shouldDisplay: true,
  needsReverification: false,
  canSkipSecondVerification: true,
  reasons: ['stable country, language, source, and display evidence'],
  components: {
    language: 20,
    validation: 25,
    display: 20,
    source: 15,
    geography: 12,
    penalty: 0,
  },
};

const baseInput = {
  issuerId,
  issuerSecret,
  subjectKind: 'address-tab' as const,
  subjectId: 'aoid:tokyo-marunouchi-private-subject',
  quality: stableTokyoTabQuality,
  threshold: 85,
  purpose: 'delivery' as const,
  scope: 'address-tab-display',
  challenge,
  issuedAt: '2026-01-01T00:05:00.000Z',
  ttlSeconds: 600,
  privateProofSalt: 'quality-threshold-private-proof-salt',
  rawEvidence: {
    displayText: '東京都千代田区丸の内1丁目',
    addressText: '東京都千代田区丸の内1丁目',
    sourceIds: ['japan-post', 'geocoder-cache'],
  },
};

test('proves address tab quality clears a threshold without exposing exact quality evidence', async () => {
  const envelope = await createQualityThresholdProof(baseInput);
  const publicEnvelope = stripPrivateQualityThresholdProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal(envelope.claim.subject.kind, 'address-tab');
  assert.equal(envelope.claim.predicate.kind, 'score-gte-threshold');
  assert.equal(envelope.claim.predicate.threshold, 85);
  assert.equal(envelope.claim.predicate.satisfied, true);
  assert.equal(envelope.claim.quality.environment, 'urban');
  assert.equal(envelope.claim.proofHint.zkReady, true);
  assert.equal(envelope.claim.proofHint.zkpGenerated, false);
  assert.equal(envelope.localCacheKey?.startsWith('quality-threshold:'), true);
  assert.equal('privateProofSalt' in publicEnvelope, false);
  assert.equal('localCacheKey' in publicEnvelope, false);
  assert.equal(publicText.includes('"score":91'), false);
  assert.equal(publicText.includes('"components"'), false);
  assert.equal(publicText.includes('stable country, language'), false);
  assert.equal(publicText.includes('東京都千代田区丸の内1丁目'), false);
  assert.equal(publicText.includes('aoid:tokyo-marunouchi-private-subject'), false);
  assert.equal(publicText.includes('quality-threshold-private-proof-salt'), false);

  const verification = await verifyQualityThresholdProof(publicEnvelope, {
    issuerId,
    issuerSecret,
    expectedSubjectKind: 'address-tab',
    expectedPurpose: 'delivery',
    expectedScope: 'address-tab-display',
    expectedChallenge: challenge,
    minimumThreshold: 85,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.expired, false);
  assert.equal(verification.thresholdSatisfied, true);
  assert.equal(verification.privacyPreserved, true);
  assert.equal(verification.proofCost, 'none');
});

test('rejects quality threshold proof creation when the hidden score is too low', async () => {
  await assert.rejects(
    createQualityThresholdProof({
      ...baseInput,
      quality: {
        ...stableTokyoTabQuality,
        score: 64,
        tier: 'caution',
        decision: 'warn',
      },
      threshold: 85,
    }),
    /quality threshold/i
  );
});

test('normalizes unit-scale quality scores before threshold comparison', async () => {
  const envelope = await createQualityThresholdProof({
    ...baseInput,
    quality: {
      score: 0.93,
      environment: 'urban',
    },
    threshold: 0.9,
    scoreScale: 'unit',
  });

  assert.equal(envelope.claim.predicate.threshold, 90);
  assert.equal(envelope.claim.predicate.satisfied, true);

  const verification = await verifyQualityThresholdProof(
    stripPrivateQualityThresholdProofMaterial(envelope),
    {
      issuerSecret,
      expectedChallenge: challenge,
      minimumThreshold: 90,
      now: '2026-01-01T00:06:00.000Z',
    }
  );

  assert.equal(verification.valid, true);
});

test('rejects out-of-range quality thresholds instead of clamping them', async () => {
  await assert.rejects(
    createQualityThresholdProof({
      ...baseInput,
      quality: {
        ...stableTokyoTabQuality,
        score: 100,
      },
      threshold: 120,
    }),
    /between 0 and 100/i
  );
});

test('rejects tampered quality threshold proof signatures', async () => {
  const envelope = await createQualityThresholdProof(baseInput);
  const publicEnvelope = stripPrivateQualityThresholdProofMaterial(envelope);
  const tampered = {
    ...publicEnvelope,
    claim: {
      ...publicEnvelope.claim,
      predicate: {
        ...publicEnvelope.claim.predicate,
        threshold: 55,
      },
    },
  };

  const verification = await verifyQualityThresholdProof(tampered, {
    issuerSecret,
    expectedChallenge: challenge,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, false);
  assert.ok(verification.errors.includes('signature-invalid'));
});

test('rejects unstripped quality threshold proof material during verification', async () => {
  const envelope = await createQualityThresholdProof(baseInput);
  const verification = await verifyQualityThresholdProof(envelope, {
    issuerSecret,
    expectedChallenge: challenge,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.privacyPreserved, false);
  assert.ok(verification.errors.includes('privacy-fields-not-hidden'));
});

test('returns invalid instead of throwing for malformed quality threshold proof envelopes', async () => {
  const verification = await verifyQualityThresholdProof({} as never, {
    issuerSecret,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, null);
  assert.equal(verification.thresholdSatisfied, false);
  assert.equal(verification.privacyPreserved, false);
  assert.ok(verification.errors.includes('malformed-quality-threshold-proof'));
});
