import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createAnonymousRateLimitLedger,
  createAnonymousRateLimitProof,
  generateAnonymousRateLimitSecret,
  registerAnonymousRateLimitProof,
  stripPrivateAnonymousRateLimitProofMaterial,
  verifyAnonymousRateLimitProof,
} from './anonymousRateLimitProof';

const issuerId = 'agid-anonymous-rate-limit-test';
const issuerSecret = 'test-only-anonymous-rate-limit-issuer-secret';
const subjectSecret = 'anonymous-rate-limit-secret-with-high-entropy-for-tests';
const scope = 'api:/api/v1/osm-search';
const action = 'place-search';
const audience = 'public-api';
const challenge = 'anonymous-rate-limit-nonce-001';

const baseInput = {
  issuerId,
  issuerSecret,
  subjectSecret,
  scope,
  action,
  audience,
  challenge,
  issuedAt: '2026-01-01T00:05:10.000Z',
  windowStartsAt: '2026-01-01T00:05:00.000Z',
  windowEndsAt: '2026-01-01T00:06:00.000Z',
  maxRequests: 2,
  ttlSeconds: 60,
  privateProofSalt: 'anonymous-rate-limit-private-proof-salt',
};

test('proves anonymous rate limit eligibility without exposing identity material', async () => {
  const envelope = await createAnonymousRateLimitProof({
    ...baseInput,
    requestNonce: 'request-1',
  });
  const publicEnvelope = stripPrivateAnonymousRateLimitProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal(envelope.claim.scope, 'API:/API/V1/OSM-SEARCH');
  assert.equal(envelope.claim.action, 'PLACE-SEARCH');
  assert.equal(envelope.claim.audience, 'PUBLIC-API');
  assert.equal(envelope.claim.window.maxRequests, 2);
  assert.equal(envelope.claim.nullifiers.bucketNullifier.length > 20, true);
  assert.equal(envelope.claim.nullifiers.requestNullifier.length > 20, true);
  assert.equal(envelope.claim.proofHint.zkReady, true);
  assert.equal(envelope.claim.proofHint.zkpGenerated, false);
  assert.equal(envelope.localCacheKey?.startsWith('anonymous-rate-limit:'), true);
  assert.equal('privateProofSalt' in publicEnvelope, false);
  assert.equal('localCacheKey' in publicEnvelope, false);
  assert.equal(publicText.includes(subjectSecret), false);
  assert.equal(publicText.includes('anonymous-rate-limit-private-proof-salt'), false);
  assert.equal(publicText.includes('aoid:'), false);

  const verification = await verifyAnonymousRateLimitProof(publicEnvelope, {
    issuerId,
    issuerSecret,
    expectedScope: scope,
    expectedAction: action,
    expectedAudience: audience,
    expectedChallenge: challenge,
    maxRequestsPerWindow: 2,
    minWindowSeconds: 60,
    maxWindowSeconds: 60,
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.expired, false);
  assert.equal(verification.windowActive, true);
  assert.equal(verification.quotaExceeded, false);
  assert.equal(verification.replay, false);
  assert.equal(verification.privacyPreserved, true);
  assert.equal(verification.remaining, 1);
  assert.equal(verification.proofCost, 'none');
});

test('keeps bucket nullifier stable within a window while request nullifiers differ', async () => {
  const first = await createAnonymousRateLimitProof({
    ...baseInput,
    requestNonce: 'request-1',
  });
  const second = await createAnonymousRateLimitProof({
    ...baseInput,
    requestNonce: 'request-2',
  });

  assert.equal(first.claim.nullifiers.bucketNullifier, second.claim.nullifiers.bucketNullifier);
  assert.notEqual(first.claim.nullifiers.requestNullifier, second.claim.nullifiers.requestNullifier);
});

test('changes bucket nullifier across windows, scopes, and anonymous secrets', async () => {
  const base = await createAnonymousRateLimitProof({
    ...baseInput,
    requestNonce: 'request-1',
  });
  const nextWindow = await createAnonymousRateLimitProof({
    ...baseInput,
    issuedAt: '2026-01-01T00:06:10.000Z',
    windowStartsAt: '2026-01-01T00:06:00.000Z',
    windowEndsAt: '2026-01-01T00:07:00.000Z',
    requestNonce: 'request-1',
  });
  const otherScope = await createAnonymousRateLimitProof({
    ...baseInput,
    scope: 'api:/api/v1/photon',
    requestNonce: 'request-1',
  });
  const otherSecret = await createAnonymousRateLimitProof({
    ...baseInput,
    subjectSecret: 'another-anonymous-rate-limit-secret',
    requestNonce: 'request-1',
  });

  assert.notEqual(base.claim.nullifiers.bucketNullifier, nextWindow.claim.nullifiers.bucketNullifier);
  assert.notEqual(base.claim.nullifiers.bucketNullifier, otherScope.claim.nullifiers.bucketNullifier);
  assert.notEqual(base.claim.nullifiers.bucketNullifier, otherSecret.claim.nullifiers.bucketNullifier);
});

test('anonymous ledger enforces quota and replay using only nullifiers', async () => {
  const ledger = createAnonymousRateLimitLedger();
  const first = stripPrivateAnonymousRateLimitProofMaterial(await createAnonymousRateLimitProof({
    ...baseInput,
    requestNonce: 'request-1',
  }));
  const replay = first;
  const second = stripPrivateAnonymousRateLimitProofMaterial(await createAnonymousRateLimitProof({
    ...baseInput,
    requestNonce: 'request-2',
  }));
  const third = stripPrivateAnonymousRateLimitProofMaterial(await createAnonymousRateLimitProof({
    ...baseInput,
    requestNonce: 'request-3',
  }));

  const firstRegistration = await registerAnonymousRateLimitProof(first, ledger, {
    issuerSecret,
    expectedScope: scope,
    expectedAction: action,
    now: '2026-01-01T00:05:30.000Z',
    maxRequestsPerWindow: 2,
  });
  const replayRegistration = await registerAnonymousRateLimitProof(replay, ledger, {
    issuerSecret,
    expectedScope: scope,
    expectedAction: action,
    now: '2026-01-01T00:05:31.000Z',
    maxRequestsPerWindow: 2,
  });
  const secondRegistration = await registerAnonymousRateLimitProof(second, ledger, {
    issuerSecret,
    expectedScope: scope,
    expectedAction: action,
    now: '2026-01-01T00:05:32.000Z',
    maxRequestsPerWindow: 2,
  });
  const thirdRegistration = await registerAnonymousRateLimitProof(third, ledger, {
    issuerSecret,
    expectedScope: scope,
    expectedAction: action,
    now: '2026-01-01T00:05:33.000Z',
    maxRequestsPerWindow: 2,
  });

  assert.equal(firstRegistration.registered, true);
  assert.equal(firstRegistration.used, 1);
  assert.equal(replayRegistration.registered, false);
  assert.equal(replayRegistration.replay, true);
  assert.ok(replayRegistration.errors.includes('request-nullifier-replayed'));
  assert.equal(secondRegistration.registered, true);
  assert.equal(secondRegistration.used, 2);
  assert.equal(thirdRegistration.registered, false);
  assert.equal(thirdRegistration.quotaExceeded, true);
  assert.ok(thirdRegistration.errors.includes('anonymous-rate-limit-exceeded'));
});

test('rejects expired anonymous rate limit windows', async () => {
  const envelope = await createAnonymousRateLimitProof({
    ...baseInput,
    requestNonce: 'request-1',
  });

  const verification = await verifyAnonymousRateLimitProof(
    stripPrivateAnonymousRateLimitProofMaterial(envelope),
    {
      issuerSecret,
      expectedScope: scope,
      expectedAction: action,
      now: '2026-01-01T00:06:01.000Z',
    }
  );

  assert.equal(verification.valid, false);
  assert.equal(verification.expired, true);
  assert.equal(verification.windowActive, false);
  assert.ok(verification.errors.includes('anonymous-rate-limit-proof-expired'));
  assert.ok(verification.errors.includes('rate-limit-window-expired'));
});

test('rejects tampered anonymous rate limit signatures', async () => {
  const envelope = await createAnonymousRateLimitProof({
    ...baseInput,
    requestNonce: 'request-1',
  });
  const publicEnvelope = stripPrivateAnonymousRateLimitProofMaterial(envelope);
  const tampered = {
    ...publicEnvelope,
    claim: {
      ...publicEnvelope.claim,
      window: {
        ...publicEnvelope.claim.window,
        maxRequests: 200,
      },
    },
  };

  const verification = await verifyAnonymousRateLimitProof(tampered, {
    issuerSecret,
    expectedChallenge: challenge,
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, false);
  assert.ok(verification.errors.includes('signature-invalid'));
});

test('returns invalid instead of throwing for malformed anonymous rate limit envelopes', async () => {
  const verification = await verifyAnonymousRateLimitProof({} as never, {
    issuerSecret,
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, null);
  assert.equal(verification.windowActive, false);
  assert.ok(verification.errors.includes('malformed-anonymous-rate-limit-proof'));
});

test('rejects unstripped local anonymous rate limit proof material as public proof', async () => {
  const envelope = await createAnonymousRateLimitProof({
    ...baseInput,
    requestNonce: 'request-1',
  });

  const verification = await verifyAnonymousRateLimitProof(envelope, {
    issuerSecret,
    expectedScope: scope,
    expectedAction: action,
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.privacyPreserved, false);
  assert.ok(verification.errors.includes('privacy-fields-not-hidden'));
});

test('generates high-entropy anonymous rate limit secrets', () => {
  const first = generateAnonymousRateLimitSecret();
  const second = generateAnonymousRateLimitSecret();

  assert.equal(first.length > 20, true);
  assert.equal(second.length > 20, true);
  assert.notEqual(first, second);
});
