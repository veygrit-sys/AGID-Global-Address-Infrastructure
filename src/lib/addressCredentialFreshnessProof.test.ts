import assert from 'node:assert/strict';
import { test } from 'node:test';

import { issueAddressCredential } from './addressCredential';
import {
  createAddressCredentialFreshnessProof,
  deriveAddressCredentialRevocationHandles,
  stripPrivateAddressCredentialFreshnessProofMaterial,
  verifyAddressCredentialFreshnessProof,
  type AddressCredentialRevocationRegistrySnapshot,
} from './addressCredentialFreshnessProof';

const credentialIssuerId = 'agid-address-credential-test';
const credentialIssuerSecret = 'test-only-address-credential-issuer-secret';
const freshnessIssuerId = 'agid-freshness-test';
const freshnessIssuerSecret = 'test-only-freshness-proof-issuer-secret';
const scope = 'delivery-checkout';
const challenge = 'checkout-freshness-nonce-001';

const address = {
  country_code: 'JP',
  country: 'Japan',
  state: 'Tokyo',
  city: 'Chiyoda-ku',
  road: 'Marunouchi',
  house_number: '1',
  postcode: '100-0001',
};

const registry: AddressCredentialRevocationRegistrySnapshot = {
  id: 'aoid-revocation-list',
  version: '2026-01-01T00:05:00Z',
  checkedAt: '2026-01-01T00:05:00.000Z',
  sourceIds: ['agid-local-status-list'],
};

async function issueAoidCredential() {
  return issueAddressCredential({
    issuerId: credentialIssuerId,
    issuerSecret: credentialIssuerSecret,
    layer: 'AOID',
    subjectId: 'aoid:freshness-test-subject',
    address,
    countryCode: 'JP',
    postalCode: '100-0001',
    verificationStatus: 'verified',
    verificationScore: 0.94,
    sourceIds: ['zipcloud', 'japan-post'],
    policyVersion: 'address-verification-engine-v1',
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateSalt: 'credential-private-salt-for-freshness-proof',
  });
}

test('proves credential freshness and non-revocation without exposing credential body', async () => {
  const credential = await issueAoidCredential();
  const envelope = await createAddressCredentialFreshnessProof({
    issuerId: freshnessIssuerId,
    issuerSecret: freshnessIssuerSecret,
    credential,
    credentialIssuerSecret,
    revocationRegistry: registry,
    scope,
    challenge,
    issuedAt: '2026-01-01T00:05:00.000Z',
    freshnessSeconds: 600,
    ttlSeconds: 600,
    privateProofSalt: 'freshness-private-proof-salt',
    minimumCredentialScore: 0.9,
    expectedLayer: 'AOID',
  });

  const publicEnvelope = stripPrivateAddressCredentialFreshnessProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal(envelope.claim.revocation.status, 'not-revoked');
  assert.equal(envelope.claim.revocation.registryId, 'AOID-REVOCATION-LIST');
  assert.equal(envelope.claim.credential.issuerId, credentialIssuerId);
  assert.equal(envelope.claim.credential.layer, 'AOID');
  assert.equal(envelope.claim.credential.scoreFloor, 0.94);
  assert.equal(envelope.claim.proofHint.zkReady, true);
  assert.equal(envelope.claim.proofHint.zkpGenerated, false);
  assert.equal(envelope.localCacheKey?.startsWith('address-credential-freshness:'), true);
  assert.equal('privateProofSalt' in publicEnvelope, false);
  assert.equal('localCacheKey' in publicEnvelope, false);
  assert.equal(publicText.includes('aoid:freshness-test-subject'), false);
  assert.equal(publicText.includes('Marunouchi'), false);
  assert.equal(publicText.includes('100-0001'), false);
  assert.equal(publicText.includes(credential.claim.addressCommitment), false);
  assert.equal(publicText.includes(credential.claim.postalCodeHash ?? 'missing'), false);
  assert.equal(publicText.includes('credential-private-salt-for-freshness-proof'), false);

  const verification = await verifyAddressCredentialFreshnessProof(publicEnvelope, {
    issuerId: freshnessIssuerId,
    issuerSecret: freshnessIssuerSecret,
    expectedScope: scope,
    expectedChallenge: challenge,
    expectedCredentialIssuerId: credentialIssuerId,
    expectedLayer: 'AOID',
    trustedRegistryIds: ['AOID-REVOCATION-LIST'],
    minimumCredentialScore: 0.9,
    allowedCredentialStatuses: ['verified'],
    now: '2026-01-01T00:06:00.000Z',
    maxFreshnessAgeSeconds: 600,
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.expired, false);
  assert.equal(verification.stale, false);
  assert.equal(verification.notRevokedAsserted, true);
  assert.equal(verification.privacyPreserved, true);
  assert.equal(verification.proofCost, 'none');
});

test('rejects proof creation when the credential appears in a revocation snapshot', async () => {
  const credential = await issueAoidCredential();
  const handles = await deriveAddressCredentialRevocationHandles(credential);

  await assert.rejects(
    createAddressCredentialFreshnessProof({
      issuerId: freshnessIssuerId,
      issuerSecret: freshnessIssuerSecret,
      credential,
      credentialIssuerSecret,
      revocationRegistry: {
        ...registry,
        revokedCredentialHashes: [handles.credentialHash],
      },
      scope,
      challenge,
      issuedAt: '2026-01-01T00:05:00.000Z',
      privateProofSalt: 'freshness-private-proof-salt',
    }),
    /revoked credential/i
  );
});

test('rejects stale freshness windows during verification', async () => {
  const credential = await issueAoidCredential();
  const envelope = await createAddressCredentialFreshnessProof({
    issuerId: freshnessIssuerId,
    issuerSecret: freshnessIssuerSecret,
    credential,
    credentialIssuerSecret,
    revocationRegistry: {
      ...registry,
      checkedAt: '2026-01-01T00:05:00.000Z',
    },
    scope,
    challenge,
    issuedAt: '2026-01-01T00:05:00.000Z',
    freshnessSeconds: 60,
    privateProofSalt: 'freshness-private-proof-salt',
  });

  const verification = await verifyAddressCredentialFreshnessProof(
    stripPrivateAddressCredentialFreshnessProofMaterial(envelope),
    {
      issuerSecret: freshnessIssuerSecret,
      expectedScope: scope,
      expectedChallenge: challenge,
      now: '2026-01-01T00:07:00.000Z',
      maxFreshnessAgeSeconds: 60,
    }
  );

  assert.equal(verification.valid, false);
  assert.equal(verification.expired, true);
  assert.equal(verification.stale, true);
  assert.ok(verification.errors.includes('freshness-window-expired'));
  assert.ok(verification.errors.includes('freshness-check-too-old'));
});

test('rejects tampered freshness proof signatures', async () => {
  const credential = await issueAoidCredential();
  const envelope = await createAddressCredentialFreshnessProof({
    issuerId: freshnessIssuerId,
    issuerSecret: freshnessIssuerSecret,
    credential,
    credentialIssuerSecret,
    revocationRegistry: registry,
    scope,
    challenge,
    issuedAt: '2026-01-01T00:05:00.000Z',
    freshnessSeconds: 600,
    privateProofSalt: 'freshness-private-proof-salt',
  });

  const publicEnvelope = stripPrivateAddressCredentialFreshnessProofMaterial(envelope);
  const tampered = {
    ...publicEnvelope,
    claim: {
      ...publicEnvelope.claim,
      revocation: {
        ...publicEnvelope.claim.revocation,
        registryVersion: 'tampered-version',
      },
    },
  };

  const verification = await verifyAddressCredentialFreshnessProof(tampered, {
    issuerSecret: freshnessIssuerSecret,
    expectedChallenge: challenge,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, false);
  assert.ok(verification.errors.includes('signature-invalid'));
});

test('returns invalid instead of throwing for malformed freshness proof envelopes', async () => {
  const verification = await verifyAddressCredentialFreshnessProof({} as never, {
    issuerSecret: freshnessIssuerSecret,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, null);
  assert.equal(verification.stale, true);
  assert.ok(verification.errors.includes('malformed-address-credential-freshness-proof'));
});

test('rejects unstripped local freshness proof material as a public proof', async () => {
  const credential = await issueAoidCredential();
  const envelope = await createAddressCredentialFreshnessProof({
    issuerId: freshnessIssuerId,
    issuerSecret: freshnessIssuerSecret,
    credential,
    credentialIssuerSecret,
    revocationRegistry: registry,
    scope,
    challenge,
    issuedAt: '2026-01-01T00:05:00.000Z',
    freshnessSeconds: 600,
    privateProofSalt: 'freshness-private-proof-salt',
  });

  const verification = await verifyAddressCredentialFreshnessProof(envelope, {
    issuerSecret: freshnessIssuerSecret,
    expectedScope: scope,
    expectedChallenge: challenge,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.privacyPreserved, false);
  assert.ok(verification.errors.includes('privacy-fields-not-hidden'));
});
