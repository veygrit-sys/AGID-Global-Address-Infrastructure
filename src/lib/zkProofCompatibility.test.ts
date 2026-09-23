import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createAnonymousRateLimitProof,
  stripPrivateAnonymousRateLimitProofMaterial,
} from './anonymousRateLimitProof';
import { ADDRESS_DUPLICATE_NULLIFIER_VERSION } from './addressDuplicateNullifier';
import {
  createQualityThresholdProof,
  QUALITY_THRESHOLD_PROOF_VERSION,
  stripPrivateQualityThresholdProofMaterial,
} from './qualityThresholdProof';
import {
  createRegionMembershipProof,
  stripPrivateRegionMembershipProofMaterial,
  type RegionMembershipRegion,
} from './regionMembershipProof';
import { analyzeZkProofCompatibility } from './zkProofCompatibility';
import type { AddressTabQualityScore } from './addressTabQuality';

const issuerId = 'agid-zk-compatibility-test';
const issuerSecret = 'test-only-zk-compatibility-issuer-secret';
const scope = 'delivery-checkout';
const challenge = 'zk-proof-bundle-nonce-001';

const stableQuality: AddressTabQualityScore = {
  tab: 'ja',
  score: 92,
  tier: 'stable',
  decision: 'show',
  environment: 'urban',
  shouldDisplay: true,
  needsReverification: false,
  canSkipSecondVerification: true,
  reasons: ['stable official source and display evidence'],
  components: {
    language: 20,
    validation: 25,
    display: 20,
    source: 15,
    geography: 12,
    penalty: 0,
  },
};

const tokyoRegion: RegionMembershipRegion = {
  id: 'JP:TOKYO',
  name: 'Tokyo Metropolis',
  purpose: 'delivery-area',
  version: 'test-tokyo-region-v1',
  sourceIds: ['test-open-admin-boundary'],
  geometry: {
    type: 'bbox',
    north: 35.9,
    south: 35.5,
    west: 139.55,
    east: 139.95,
  },
};

async function createCompatiblePublicProofBundle() {
  const quality = stripPrivateQualityThresholdProofMaterial(await createQualityThresholdProof({
    issuerId,
    issuerSecret,
    subjectKind: 'address-tab',
    subjectId: 'hidden-quality-subject',
    quality: stableQuality,
    threshold: 85,
    purpose: 'delivery',
    scope,
    challenge,
    issuedAt: '2026-01-01T00:05:00.000Z',
    ttlSeconds: 600,
    privateProofSalt: 'quality-compatible-salt',
    rawEvidence: {
      displayText: 'hidden address text',
    },
  }));
  const membership = stripPrivateRegionMembershipProofMaterial(await createRegionMembershipProof({
    issuerId,
    issuerSecret,
    subjectKind: 'AOID',
    subjectId: '05AV8TJGH8QZ6M2R',
    point: { lat: 35.6812, lon: 139.7671 },
    region: tokyoRegion,
    scope,
    challenge,
    issuedAt: '2026-01-01T00:05:00.000Z',
    ttlSeconds: 600,
    privateMembershipSalt: 'membership-compatible-salt',
  }));
  const rateLimit = stripPrivateAnonymousRateLimitProofMaterial(await createAnonymousRateLimitProof({
    issuerId,
    issuerSecret,
    subjectSecret: 'anonymous-rate-limit-secret-for-compatibility-tests',
    scope,
    action: 'checkout',
    audience: 'delivery-service',
    challenge,
    issuedAt: '2026-01-01T00:05:10.000Z',
    windowStartsAt: '2026-01-01T00:05:00.000Z',
    windowEndsAt: '2026-01-01T00:06:00.000Z',
    maxRequests: 2,
    requestNonce: 'request-1',
    ttlSeconds: 60,
    privateProofSalt: 'rate-limit-compatible-salt',
  }));

  return [quality, membership, rateLimit] as const;
}

test('accepts compatible public ZK proofs with a shared bundle scope and challenge', async () => {
  const publicProofs = await createCompatiblePublicProofBundle();
  const expectedChallengeHashesByVersion = Object.fromEntries(
    publicProofs.map(proof => [proof.claim.version, proof.claim.challengeHash])
  );

  const compatibility = analyzeZkProofCompatibility(publicProofs, {
    expectedScope: scope,
    expectedChallengeHashesByVersion,
    requireSameScope: true,
    requireSameChallenge: true,
    requireCommonValidityWindow: true,
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(compatibility.compatible, true);
  assert.equal(compatibility.privacySafe, true);
  assert.equal(compatibility.collisionFree, true);
  assert.equal(compatibility.proofCount, 3);
  assert.deepEqual(compatibility.errors, []);
  assert.equal(compatibility.commonValidityWindow.active, true);
  assert.equal(compatibility.commonValidityWindow.issuedAt, '2026-01-01T00:05:10.000Z');
  assert.equal(compatibility.commonValidityWindow.expiresAt, '2026-01-01T00:06:00.000Z');
  assert.deepEqual(compatibility.manifest.proofVersions.sort(), [
    'anonymous-rate-limit-proof-v1',
    'quality-threshold-proof-v1',
    'region-membership-proof-v1',
  ]);
});

test('rejects unstripped private proof material before composing proofs', async () => {
  const privateEnvelope = await createQualityThresholdProof({
    issuerId,
    issuerSecret,
    subjectKind: 'address-tab',
    subjectId: 'hidden-quality-subject',
    quality: stableQuality,
    threshold: 85,
    purpose: 'delivery',
    scope,
    challenge,
    issuedAt: '2026-01-01T00:05:00.000Z',
    privateProofSalt: 'unstripped-quality-proof-salt',
  });

  const compatibility = analyzeZkProofCompatibility([privateEnvelope], {
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(compatibility.compatible, false);
  assert.equal(compatibility.privacySafe, false);
  assert.ok(compatibility.errors.includes('private-proof-material-present'));
  assert.deepEqual(compatibility.proofs[0]?.privateFieldPaths, [
    'proof.privateProofSalt',
    'proof.localCacheKey',
  ]);
});

test('detects duplicate single-use nullifiers in a proof bundle', async () => {
  const replayed = stripPrivateAnonymousRateLimitProofMaterial(await createAnonymousRateLimitProof({
    issuerId,
    issuerSecret,
    subjectSecret: 'anonymous-rate-limit-secret-for-replay-tests',
    scope,
    action: 'checkout',
    challenge,
    issuedAt: '2026-01-01T00:05:10.000Z',
    windowStartsAt: '2026-01-01T00:05:00.000Z',
    windowEndsAt: '2026-01-01T00:06:00.000Z',
    maxRequests: 2,
    requestNonce: 'request-1',
    privateProofSalt: 'rate-limit-replay-salt',
  }));

  const compatibility = analyzeZkProofCompatibility([replayed, replayed], {
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(compatibility.compatible, false);
  assert.equal(compatibility.collisionFree, false);
  assert.ok(compatibility.errors.includes('duplicate-nullifier'));
});

test('detects cross-role collisions between nullifiers and commitments', () => {
  const sharedValue = 'same-proof-artifact-value-that-should-never-be-reused';
  const nullifierProof = {
    version: ADDRESS_DUPLICATE_NULLIFIER_VERSION,
    nullifierAlgorithm: 'hmac-sha256-address-aoid-region-v1',
    nullifier: sharedValue,
    registryId: 'aoid-registry',
    regionKey: 'JP:TOKYO',
    regionLevel: 'city',
    issuedAt: '2026-01-01T00:05:00.000Z',
    expiresAt: '2026-01-01T00:15:00.000Z',
    credential: {
      issuerId,
      layer: 'AOID',
      countryCode: 'JP',
      qualityBand: 'high',
      verificationStatus: 'verified',
      scoreFloor: 90,
    },
    privacy: {
      hides: ['aoid', 'address', 'person', 'phone', 'unit', 'owner-device-secret'],
      reveals: ['nullifier', 'registryId', 'regionKey', 'regionLevel', 'credential-quality'],
    },
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'holder-knows-aoid-address-and-region-opening-for-unique-nullifier',
    },
    warnings: [],
  };
  const commitmentProof = {
    claim: {
      version: QUALITY_THRESHOLD_PROOF_VERSION,
      workflowVersion: 'address-quality-threshold-v1',
      scope,
      challengeHash: challenge,
      issuedAt: '2026-01-01T00:05:00.000Z',
      expiresAt: '2026-01-01T00:15:00.000Z',
      subject: {
        kind: 'address-tab',
        commitment: 'subject-commitment-value',
      },
      predicate: {
        kind: 'score-gte-threshold',
        threshold: 85,
        unit: 'percent',
        satisfied: true,
        purpose: 'delivery',
      },
      quality: {
        environment: 'urban',
        scoreHidden: true,
        componentsHidden: true,
        reasonsHidden: true,
      },
      commitments: {
        scoreWitnessCommitment: 'score-witness-commitment-value',
        qualityEvidenceCommitment: sharedValue,
        thresholdPolicyCommitment: 'threshold-policy-commitment-value',
      },
      privacy: {
        hides: [
          'exact-score',
          'quality-components',
          'quality-reasons',
          'raw-validation',
          'raw-sources',
          'display-text',
          'address',
          'subject-id',
          'proof-salt',
        ],
        reveals: [
          'subject-kind',
          'subject-commitment',
          'threshold',
          'predicate-result',
          'purpose',
          'scope',
          'environment',
          'challenge-hash',
          'commitments',
          'issuer',
        ],
      },
      proofHint: {
        zkReady: true,
        zkpGenerated: false,
        statement: 'hidden-quality-score-meets-public-threshold',
      },
    },
    signature: {
      algorithm: 'HMAC-SHA-256',
      issuerId,
      value: 'not-checked-by-compatibility-layer',
    },
  };

  const compatibility = analyzeZkProofCompatibility([nullifierProof, commitmentProof], {
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(compatibility.compatible, false);
  assert.equal(compatibility.collisionFree, false);
  assert.ok(compatibility.errors.includes('cross-role-proof-value-collision'));
});

test('rejects scope and challenge mismatches when proofs are composed for one operation', async () => {
  const [quality, membership] = await createCompatiblePublicProofBundle();
  const expectedChallengeHashesByVersion = {
    [quality.claim.version]: quality.claim.challengeHash,
    [membership.claim.version]: membership.claim.challengeHash,
  };
  const mismatchedMembership = {
    ...membership,
    claim: {
      ...membership.claim,
      scope: 'different-operation',
      challengeHash: 'different-challenge',
    },
  };

  const compatibility = analyzeZkProofCompatibility([quality, mismatchedMembership], {
    requireSameScope: true,
    requireSameChallenge: true,
    expectedChallengeHashesByVersion,
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(compatibility.compatible, false);
  assert.ok(compatibility.errors.includes('proof-scope-mismatch'));
  assert.ok(compatibility.errors.includes('proof-challenge-mismatch'));
});
