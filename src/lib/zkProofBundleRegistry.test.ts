import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createInMemoryZkProofBundleRegistry,
  ZK_PROOF_BUNDLE_REGISTRY_VERSION,
} from './zkProofBundleRegistry';

const scope = 'delivery-checkout';
const audience = 'delivery-service';
const challengeHash = 'bundle-challenge-hash-001';
const issuedAt = '2026-01-01T00:05:00.000Z';
const expiresAt = '2026-01-01T00:06:00.000Z';

type ProofFixtureOptions = {
  version: string;
  nullifier: string;
  commitment: string;
  proofScope?: string;
  proofChallengeHash?: string;
  proofExpiresAt?: string;
};

function publicProof({
  version,
  nullifier,
  commitment,
  proofScope = scope,
  proofChallengeHash = challengeHash,
  proofExpiresAt = expiresAt,
}: ProofFixtureOptions) {
  return {
    claim: {
      version,
      scope: proofScope,
      challengeHash: proofChallengeHash,
      issuedAt,
      expiresAt: proofExpiresAt,
      subject: {
        kind: 'AOID',
        commitment: `${commitment}:subject`,
      },
      nullifiers: {
        requestNullifier: nullifier,
      },
      commitments: {
        proofCommitment: `${commitment}:proof`,
        policyCommitment: `${commitment}:policy`,
      },
      privacy: {
        hides: ['address', 'person', 'phone', 'raw-coordinate'],
        reveals: ['scope', 'challenge-hash', 'predicate-result'],
      },
      proofHint: {
        zkReady: true,
        zkpGenerated: true,
        statement: 'public-fixture-for-zk-proof-bundle-registry',
      },
    },
    signature: {
      algorithm: 'HMAC-SHA-256',
      issuerId: 'agid-zk-registry-test',
      value: 'test-signature-not-verified-by-registry',
    },
  };
}

function compatibleBundle(requestNullifierSuffix = '001') {
  return [
    publicProof({
      version: 'quality-threshold-proof-v1',
      nullifier: `QUALITY-REQUEST-NULLIFIER-${requestNullifierSuffix}`,
      commitment: `QUALITY-COMMITMENT-${requestNullifierSuffix}`,
    }),
    publicProof({
      version: 'region-membership-proof-v1',
      nullifier: `REGION-REQUEST-NULLIFIER-${requestNullifierSuffix}`,
      commitment: `REGION-COMMITMENT-${requestNullifierSuffix}`,
    }),
    publicProof({
      version: 'anonymous-rate-limit-proof-v1',
      nullifier: `RATE-REQUEST-NULLIFIER-${requestNullifierSuffix}`,
      commitment: `RATE-COMMITMENT-${requestNullifierSuffix}`,
    }),
  ];
}

function expectedChallengeHashesByVersion(proofs: ReturnType<typeof compatibleBundle>) {
  return Object.fromEntries(
    proofs.map(proof => [proof.claim.version, proof.claim.challengeHash])
  );
}

test('registers a compatible ZK proof bundle without storing raw proof material', () => {
  const proofs = compatibleBundle();
  const registry = createInMemoryZkProofBundleRegistry();

  const result = registry.registerBundle({
    proofs,
    scope,
    audience,
    operationId: 'delivery-checkout-001',
    expectedChallengeHashesByVersion: expectedChallengeHashesByVersion(proofs),
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(result.status, 'registered');
  assert.equal(result.record?.registryVersion, ZK_PROOF_BUNDLE_REGISTRY_VERSION);
  assert.equal(result.record?.proofCount, 3);
  assert.equal(result.record?.rawProofsStored, false);
  assert.equal(result.record?.status, 'active');
  assert.equal(result.record?.commonValidityWindow.expiresAt, expiresAt);
  assert.equal(result.record?.manifest.proofVersions.length, 3);

  const stored = registry.getBundle(result.bundleId);
  assert.equal(stored?.bundleId, result.bundleId);

  const serialized = JSON.stringify(stored);
  assert.equal(serialized.includes('QUALITY-REQUEST-NULLIFIER-001'), false);
  assert.equal(serialized.includes('test-signature-not-verified-by-registry'), false);
  assert.equal(serialized.includes('raw-coordinate'), true);
});

test('rejects private proof material and leaves the registry unchanged', () => {
  const proofs = compatibleBundle();
  const registry = createInMemoryZkProofBundleRegistry();
  const [firstProof] = proofs;
  const privateProof = {
    ...firstProof,
    privateProofSalt: 'secret-proof-salt-that-must-not-be-registered',
    rawEvidence: {
      addressText: 'hidden address text',
    },
  };

  const result = registry.registerBundle({
    proofs: [privateProof],
    scope,
    audience,
    expectedChallengeHashesByVersion: {
      [privateProof.claim.version]: privateProof.claim.challengeHash,
    },
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.ok(result.errors.includes('private-proof-material-present'));
  assert.equal(registry.getStats().activeBundles, 0);
  assert.equal(result.bundleId, null);
});

test('rejects cross-bundle replay of single-use nullifiers', () => {
  const registry = createInMemoryZkProofBundleRegistry();
  const first = compatibleBundle('REPLAY-A');
  const second = compatibleBundle('REPLAY-B');
  second[2] = publicProof({
    version: 'anonymous-rate-limit-proof-v1',
    nullifier: first[2].claim.nullifiers.requestNullifier,
    commitment: 'RATE-COMMITMENT-REPLAY-B-DIFFERENT',
  });

  const firstResult = registry.registerBundle({
    proofs: first,
    scope,
    audience,
    operationId: 'delivery-checkout-replay-a',
    expectedChallengeHashesByVersion: expectedChallengeHashesByVersion(first),
    now: '2026-01-01T00:05:30.000Z',
  });
  const secondResult = registry.registerBundle({
    proofs: second,
    scope,
    audience,
    operationId: 'delivery-checkout-replay-b',
    expectedChallengeHashesByVersion: expectedChallengeHashesByVersion(second),
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(firstResult.status, 'registered');
  assert.equal(secondResult.status, 'rejected');
  assert.ok(secondResult.errors.includes('single-use-nullifier-reused'));
  assert.equal(registry.getStats().activeBundles, 1);
});

test('verifies active, expired, and revoked bundle states', () => {
  const proofs = compatibleBundle('LIFECYCLE');
  const registry = createInMemoryZkProofBundleRegistry();
  const result = registry.registerBundle({
    proofs,
    scope,
    audience,
    operationId: 'delivery-checkout-lifecycle',
    expectedChallengeHashesByVersion: expectedChallengeHashesByVersion(proofs),
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(result.status, 'registered');
  assert.equal(registry.verifyBundle(result.bundleId, { now: '2026-01-01T00:05:40.000Z' }).valid, true);

  const expired = registry.verifyBundle(result.bundleId, { now: '2026-01-01T00:06:01.000Z' });
  assert.equal(expired.valid, false);
  assert.ok(expired.errors.includes('bundle-expired'));

  const revoked = registry.revokeBundle(result.bundleId, {
    reason: 'issuer-key-rotated',
    revokedAt: '2026-01-01T00:05:50.000Z',
  });
  assert.equal(revoked, true);

  const afterRevocation = registry.verifyBundle(result.bundleId, { now: '2026-01-01T00:05:55.000Z' });
  assert.equal(afterRevocation.valid, false);
  assert.ok(afterRevocation.errors.includes('bundle-revoked'));
});

test('reports duplicate bundle registrations without mutating the original record', () => {
  const proofs = compatibleBundle('DUPLICATE');
  const registry = createInMemoryZkProofBundleRegistry();
  const registration = {
    proofs,
    scope,
    audience,
    operationId: 'same-operation',
    expectedChallengeHashesByVersion: expectedChallengeHashesByVersion(proofs),
    now: '2026-01-01T00:05:30.000Z',
  };

  const first = registry.registerBundle(registration);
  const second = registry.registerBundle(registration);

  assert.equal(first.status, 'registered');
  assert.equal(second.status, 'already_registered');
  assert.equal(second.bundleId, first.bundleId);
  assert.equal(registry.getStats().activeBundles, 1);
});
