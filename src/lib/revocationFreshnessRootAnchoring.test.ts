import assert from 'node:assert/strict';
import { test } from 'node:test';

import { issueAddressCredential } from './addressCredential';
import {
  createAddressCredentialFreshnessProof,
  stripPrivateAddressCredentialFreshnessProofMaterial,
  type AddressCredentialRevocationRegistrySnapshot,
} from './addressCredentialFreshnessProof';
import {
  buildRevocationFreshnessRootAnchor,
  REVOCATION_FRESHNESS_ROOT_ANCHOR_VERSION,
  verifyFreshnessProofRootAnchor,
} from './revocationFreshnessRootAnchoring';

const credentialIssuerId = 'agid-root-anchor-credential-issuer';
const credentialIssuerSecret = 'test-only-root-anchor-credential-secret';
const freshnessIssuerId = 'agid-root-anchor-freshness-issuer';
const freshnessIssuerSecret = 'test-only-root-anchor-freshness-secret';
const scope = 'delivery-checkout';
const challenge = 'checkout-root-anchor-nonce-001';

const registry: AddressCredentialRevocationRegistrySnapshot = {
  id: 'aoid-revocation-list',
  version: '2026-01-01T00:05:00Z',
  checkedAt: '2026-01-01T00:05:00.000Z',
  freshUntil: '2026-01-01T00:15:00.000Z',
  sourceIds: ['agid-local-status-list', 'issuer-status-feed'],
  revokedCredentialHashes: ['secret-revoked-credential-handle-a'],
  revokedSubjectHashes: ['secret-revoked-subject-handle-b'],
  revokedAddressCommitmentHashes: ['secret-revoked-address-handle-c'],
  revokedIssuerScopedHashes: ['secret-revoked-issuer-handle-d'],
};

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
    subjectId: 'aoid:root-anchor-subject',
    address,
    countryCode: 'JP',
    postalCode: '100-0001',
    verificationStatus: 'verified',
    verificationScore: 0.96,
    sourceIds: ['japan-post', 'zipcloud'],
    policyVersion: 'address-verification-engine-v1',
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateSalt: 'credential-private-salt-for-root-anchor',
  });
}

test('builds a privacy-safe revocation and freshness root anchor for chain publication', async () => {
  const anchor = await buildRevocationFreshnessRootAnchor({
    registry,
    issuerDid: 'did:kilt:agid-root-anchor-issuer',
    credentialType: 'aoid-address-credential',
    schemaHash: 'SCHEMA-HASH-AOID-ADDRESS-V1',
    freshnessPolicy: {
      maxFreshnessAgeSeconds: 600,
      statusListSourcePolicyHash: 'STATUS-LIST-SOURCE-POLICY-V1',
    },
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(anchor.modelVersion, REVOCATION_FRESHNESS_ROOT_ANCHOR_VERSION);
  assert.equal(anchor.anchorable, true);
  assert.equal(anchor.stale, false);
  assert.equal(anchor.registryId, 'AOID-REVOCATION-LIST');
  assert.match(anchor.revocationRoot, /^[A-Za-z0-9_-]{32,}$/u);
  assert.match(anchor.freshnessRoot, /^[a-f0-9]{64}$/u);
  assert.match(anchor.freshnessPolicyHash, /^[a-f0-9]{64}$/u);
  assert.deepEqual(anchor.revocationHandleCounts, {
    credential: 1,
    subject: 1,
    addressCommitment: 1,
    issuerScoped: 1,
  });
  assert.equal(anchor.chainCommitment.stageId, 'address-credential');
  assert.equal(anchor.chainCommitment.entityType, 'credential');
  assert.equal(anchor.chainCommitment.publishable, true);
  assert.equal(anchor.chainCommitment.publicPayload.revocationRoot, anchor.revocationRoot);
  assert.equal(anchor.chainCommitment.publicPayload.freshnessRoot, anchor.freshnessRoot);

  const serialized = JSON.stringify(anchor);
  assert.equal(serialized.includes('secret-revoked-credential-handle-a'), false);
  assert.equal(serialized.includes('secret-revoked-subject-handle-b'), false);
  assert.equal(serialized.includes('Marunouchi'), false);
  assert.equal(serialized.includes('100-0001'), false);
});

test('verifies a freshness proof against an anchored revocation root without exposing the credential body', async () => {
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
    privateProofSalt: 'freshness-private-proof-salt-for-root-anchor',
    minimumCredentialScore: 0.9,
    expectedLayer: 'AOID',
  });
  const publicEnvelope = stripPrivateAddressCredentialFreshnessProofMaterial(envelope);
  const anchor = await buildRevocationFreshnessRootAnchor({
    registry,
    issuerDid: 'did:kilt:agid-root-anchor-issuer',
    credentialType: 'aoid-address-credential',
    schemaHash: 'SCHEMA-HASH-AOID-ADDRESS-V1',
    now: '2026-01-01T00:06:00.000Z',
  });

  const verification = verifyFreshnessProofRootAnchor(publicEnvelope, anchor, {
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(anchor.revocationRoot, publicEnvelope.claim.revocation.listRootCommitment);
  assert.equal(verification.valid, true);
  assert.equal(verification.rootMatched, true);
  assert.equal(verification.stale, false);
  assert.deepEqual(verification.errors, []);

  const publicText = JSON.stringify({ anchor, publicEnvelope });
  assert.equal(publicText.includes('aoid:root-anchor-subject'), false);
  assert.equal(publicText.includes('credential-private-salt-for-root-anchor'), false);
  assert.equal(publicText.includes('Marunouchi'), false);
});

test('rejects freshness proofs that do not match the anchored revocation root', async () => {
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
    privateProofSalt: 'freshness-private-proof-salt-for-root-anchor',
  });
  const publicEnvelope = stripPrivateAddressCredentialFreshnessProofMaterial(envelope);
  const anchor = await buildRevocationFreshnessRootAnchor({
    registry: {
      ...registry,
      rootCommitment: 'DIFFERENT-REVOCATION-ROOT-COMMITMENT',
    },
    issuerDid: 'did:kilt:agid-root-anchor-issuer',
    credentialType: 'aoid-address-credential',
    schemaHash: 'SCHEMA-HASH-AOID-ADDRESS-V1',
    now: '2026-01-01T00:06:00.000Z',
  });

  const verification = verifyFreshnessProofRootAnchor(publicEnvelope, anchor, {
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.rootMatched, false);
  assert.ok(verification.errors.includes('revocation-root-mismatch'));
});

test('marks stale freshness roots as not anchorable', async () => {
  const anchor = await buildRevocationFreshnessRootAnchor({
    registry: {
      ...registry,
      freshUntil: '2026-01-01T00:06:00.000Z',
    },
    issuerDid: 'did:kilt:agid-root-anchor-issuer',
    credentialType: 'aoid-address-credential',
    schemaHash: 'SCHEMA-HASH-AOID-ADDRESS-V1',
    now: '2026-01-01T00:06:01.000Z',
  });

  assert.equal(anchor.anchorable, false);
  assert.equal(anchor.stale, true);
  assert.ok(anchor.errors.includes('freshness-root-stale'));
});
