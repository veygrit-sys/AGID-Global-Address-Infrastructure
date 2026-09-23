import assert from 'node:assert/strict';
import { test } from 'node:test';

import { issueAddressCredential } from './addressCredential';
import {
  createAOIDOwnershipProof,
  fingerprintAOIDOwnerPublicKey,
  generateAOIDOwnerKeyPair,
  stripPrivateAOIDOwnershipProofMaterial,
  verifyAOIDOwnershipProof,
} from './aoidOwnershipProof';

const issuerId = 'agid-aoid-owner-proof-test';
const issuerSecret = 'test-only-aoid-owner-proof-issuer-secret';
const credentialIssuerId = 'agid-address-credential-test';
const credentialIssuerSecret = 'test-only-address-credential-issuer-secret';
const aoid = '05AV8TJGH8QZ6M2R';
const challenge = 'delivery-session-nonce-001';
const scope = 'delivery-registration';

const address = {
  country_code: 'JP',
  country: 'Japan',
  state: 'Tokyo',
  city: 'Chiyoda-ku',
  road: 'Marunouchi',
  house_number: '1',
  postcode: '100-0001',
};

async function issueAoidCredential() {
  return issueAddressCredential({
    issuerId: credentialIssuerId,
    issuerSecret: credentialIssuerSecret,
    layer: 'AOID',
    subjectId: 'aoid:test-subject',
    address,
    countryCode: 'JP',
    postalCode: '100-0001',
    verificationStatus: 'verified',
    verificationScore: 0.93,
    sourceIds: ['zipcloud', 'japan-post'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateSalt: 'credential-private-salt-for-owner-proof',
  });
}

test('proves AOID owner key possession without exposing AOID body or private data', async () => {
  const keyPair = await generateAOIDOwnerKeyPair();
  const envelope = await createAOIDOwnershipProof({
    issuerId,
    issuerSecret,
    scope,
    challenge,
    aoid,
    ownerPrivateKeyJwk: keyPair.privateKeyJwk,
    ownerPublicKeyJwk: keyPair.publicKeyJwk,
    includePublicOwnerKey: false,
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateProofSalt: 'owner-proof-private-salt',
  });

  const publicEnvelope = stripPrivateAOIDOwnershipProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);
  const fingerprint = await fingerprintAOIDOwnerPublicKey(keyPair.publicKeyJwk);

  assert.equal(envelope.claim.method, 'owner-key');
  assert.equal(envelope.claim.ownerKeyFingerprint, fingerprint);
  assert.equal(envelope.claim.proofHint.zkpGenerated, false);
  assert.equal(envelope.claim.proofHint.zkReady, true);
  assert.equal(envelope.localCacheKey?.startsWith('aoid-ownership:'), true);
  assert.equal('privateProofSalt' in publicEnvelope, false);
  assert.equal(publicText.includes(aoid), false);
  assert.equal(publicText.includes('Marunouchi'), false);
  assert.equal(publicText.includes('credential-private-salt-for-owner-proof'), false);
  assert.equal(publicText.includes(String(keyPair.privateKeyJwk.d)), false);
  assert.equal(publicEnvelope.publicOwnerKeyJwk, undefined);

  const verification = await verifyAOIDOwnershipProof(publicEnvelope, {
    issuerId,
    issuerSecret,
    ownerPublicKeyJwk: keyPair.publicKeyJwk,
    expectedScope: scope,
    expectedChallenge: challenge,
    requireOwnerKey: true,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.issuerSignatureValid, true);
  assert.equal(verification.ownerSignatureValid, true);
  assert.equal(verification.privacyPreserved, true);
  assert.equal(verification.proofCost, 'none');
});

test('proves registered AOID address credential possession without exposing the credential body', async () => {
  const credential = await issueAoidCredential();
  const envelope = await createAOIDOwnershipProof({
    issuerId,
    issuerSecret,
    scope,
    challenge,
    aoid,
    registeredCredential: credential,
    credentialIssuerSecret,
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateProofSalt: 'credential-proof-private-salt',
  });

  const publicEnvelope = stripPrivateAOIDOwnershipProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal(envelope.claim.method, 'address-credential');
  assert.equal(envelope.claim.credential?.issuerId, credentialIssuerId);
  assert.equal(envelope.claim.credential?.verificationStatus, 'verified');
  assert.equal(envelope.claim.credential?.scoreFloor, 0.93);
  assert.equal(publicText.includes(aoid), false);
  assert.equal(publicText.includes('Marunouchi'), false);
  assert.equal(publicText.includes('100-0001'), false);
  assert.equal(publicText.includes('credential-private-salt-for-owner-proof'), false);
  assert.equal(publicText.includes(credential.claim.addressCommitment), false);

  const verification = await verifyAOIDOwnershipProof(publicEnvelope, {
    issuerSecret,
    expectedScope: scope,
    expectedChallenge: challenge,
    requireCredential: true,
    minimumCredentialScore: 0.9,
    allowedCredentialStatuses: ['verified'],
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.issuerSignatureValid, true);
  assert.equal(verification.ownerSignatureValid, null);
  assert.equal(verification.privacyPreserved, true);
});

test('supports combined owner key and registered credential possession', async () => {
  const keyPair = await generateAOIDOwnerKeyPair();
  const credential = await issueAoidCredential();
  const envelope = await createAOIDOwnershipProof({
    issuerId,
    issuerSecret,
    scope,
    challenge,
    aoid,
    ownerPrivateKeyJwk: keyPair.privateKeyJwk,
    ownerPublicKeyJwk: keyPair.publicKeyJwk,
    registeredCredential: credential,
    credentialIssuerSecret,
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateProofSalt: 'combined-proof-private-salt',
  });

  const verification = await verifyAOIDOwnershipProof(stripPrivateAOIDOwnershipProofMaterial(envelope), {
    issuerSecret,
    ownerPublicKeyJwk: keyPair.publicKeyJwk,
    expectedScope: scope,
    expectedChallenge: challenge,
    requireOwnerKey: true,
    requireCredential: true,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(envelope.claim.method, 'owner-key-and-address-credential');
  assert.equal(verification.valid, true);
});

test('rejects unstripped local AOID ownership proof material as a public proof', async () => {
  const keyPair = await generateAOIDOwnerKeyPair();
  const envelope = await createAOIDOwnershipProof({
    issuerId,
    issuerSecret,
    scope,
    challenge,
    aoid,
    ownerPrivateKeyJwk: keyPair.privateKeyJwk,
    ownerPublicKeyJwk: keyPair.publicKeyJwk,
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateProofSalt: 'owner-proof-private-salt',
  });

  const verification = await verifyAOIDOwnershipProof(envelope, {
    issuerSecret,
    ownerPublicKeyJwk: keyPair.publicKeyJwk,
    expectedScope: scope,
    expectedChallenge: challenge,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.issuerSignatureValid, true);
  assert.equal(verification.ownerSignatureValid, true);
  assert.equal(verification.privacyPreserved, false);
  assert.ok(verification.errors.includes('privacy-fields-not-hidden'));
});

test('rejects copied registered credentials without private credential salt', async () => {
  const credential = await issueAoidCredential();
  const copiedCredential = {
    claim: credential.claim,
    signature: credential.signature,
  };

  await assert.rejects(
    createAOIDOwnershipProof({
      issuerId,
      issuerSecret,
      scope,
      challenge,
      registeredCredential: copiedCredential,
      credentialIssuerSecret,
      privateProofSalt: 'credential-proof-private-salt',
    }),
    /private salt/i
  );
});

test('rejects tampered AOID ownership issuer signatures', async () => {
  const keyPair = await generateAOIDOwnerKeyPair();
  const envelope = await createAOIDOwnershipProof({
    issuerId,
    issuerSecret,
    scope,
    challenge,
    aoid,
    ownerPrivateKeyJwk: keyPair.privateKeyJwk,
    ownerPublicKeyJwk: keyPair.publicKeyJwk,
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateProofSalt: 'owner-proof-private-salt',
  });

  const publicEnvelope = stripPrivateAOIDOwnershipProofMaterial(envelope);
  const tampered = {
    ...publicEnvelope,
    claim: {
      ...publicEnvelope.claim,
      scope: 'OTHER-SCOPE',
    },
  };

  const verification = await verifyAOIDOwnershipProof(tampered, {
    issuerSecret,
    ownerPublicKeyJwk: keyPair.publicKeyJwk,
    expectedChallenge: challenge,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.issuerSignatureValid, false);
  assert.equal(verification.ownerSignatureValid, false);
  assert.ok(verification.errors.includes('issuer-signature-invalid'));
  assert.ok(verification.errors.includes('owner-signature-invalid'));
});
