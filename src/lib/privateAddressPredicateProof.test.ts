import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  issueAddressCredential,
  stripPrivateAddressCredentialMaterial,
} from './addressCredential';
import {
  analyzeZkProofCompatibility,
} from './zkProofCompatibility';
import {
  createPrivateAddressPredicateProof,
  stripPrivateAddressPredicateProofMaterial,
  verifyPrivateAddressPredicateProof,
  type PrivateAddressPredicateRegion,
} from './privateAddressPredicateProof';

const issuerId = 'agid-private-address-predicate-test';
const issuerSecret = 'test-only-private-address-predicate-issuer-secret';
const address = {
  country_code: 'JP',
  country: 'Japan',
  state: 'Tokyo',
  city: 'Chiyoda-ku',
  district: 'Marunouchi',
  road: 'Marunouchi',
  house_number: '1',
  building: 'Hidden Tower',
  postcode: '100-0001',
};
const deliveryRegion: PrivateAddressPredicateRegion = {
  id: 'DELIVERY:TOKYO-CENTRAL',
  purpose: 'delivery-area',
  version: 'tokyo-central-v1',
  geometry: {
    type: 'bbox',
    north: 35.9,
    south: 35.5,
    west: 139.55,
    east: 139.95,
  },
};

async function issueTokyoCredential(subjectId = 'aoid:test:hidden-resident') {
  return issueAddressCredential({
    issuerId,
    issuerSecret,
    address,
    countryCode: 'JP',
    postalCode: '100-0001',
    layer: 'AOID',
    subjectId,
    verificationStatus: 'verified',
    verificationScore: 0.94,
    sourceIds: ['japan-post', 'tokyo-open-admin-boundary'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateSalt: `credential-private-salt-${subjectId}`,
  });
}

test('proves delivery and residence predicates without exposing the address', async () => {
  const credential = await issueTokyoCredential();
  const envelope = await createPrivateAddressPredicateProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    point: { lat: 35.6812, lon: 139.7671 },
    predicates: [
      { kind: 'delivery-region', region: deliveryRegion },
      { kind: 'same-address-resident', groupId: 'household-check:checkout-001' },
      { kind: 'country-resident', countryCode: 'JP' },
      { kind: 'city-resident', countryCode: 'JP', city: 'Chiyoda-ku' },
    ],
    scope: 'delivery-checkout',
    challenge: 'private-address-predicate-nonce-001',
    issuedAt: '2026-01-01T00:05:00.000Z',
    ttlSeconds: 600,
    privateProofSalt: 'private-address-predicate-proof-salt',
  });
  const publicEnvelope = stripPrivateAddressPredicateProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal(envelope.claim.predicates.length, 4);
  assert.deepEqual(envelope.claim.predicates.map(predicate => predicate.kind), [
    'delivery-region',
    'same-address-resident',
    'country-resident',
    'city-resident',
  ]);
  assert.equal(envelope.localCacheKey?.startsWith('private-address-predicate:'), true);
  assert.equal('privateProofSalt' in publicEnvelope, false);
  assert.equal('localCacheKey' in publicEnvelope, false);
  assert.equal(publicText.includes('Marunouchi'), false);
  assert.equal(publicText.includes('100-0001'), false);
  assert.equal(publicText.includes('Hidden Tower'), false);
  assert.equal(publicText.includes('35.6812'), false);
  assert.equal(publicText.includes('139.7671'), false);
  assert.equal(publicText.includes(credential.privateSalt || ''), false);
  assert.equal(publicText.includes(credential.claim.addressCommitment), false);
  assert.equal(publicText.includes('private-address-predicate-proof-salt'), false);

  const verification = await verifyPrivateAddressPredicateProof(publicEnvelope, {
    issuerId,
    issuerSecret,
    expectedScope: 'delivery-checkout',
    expectedChallenge: 'private-address-predicate-nonce-001',
    requiredPredicates: [
      { kind: 'delivery-region', regionId: 'DELIVERY:TOKYO-CENTRAL' },
      { kind: 'same-address-resident', groupId: 'household-check:checkout-001' },
      { kind: 'country-resident', countryCode: 'JP' },
      { kind: 'city-resident', countryCode: 'JP', city: 'Chiyoda-ku' },
    ],
    minimumScore: 0.9,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.privacyPreserved, true);
  assert.equal(verification.predicatesSatisfied, true);
  assert.equal(verification.proofCost, 'none');
});

test('keeps same-address commitments stable only for the same group context', async () => {
  const firstCredential = await issueTokyoCredential('aoid:test:resident-one');
  const secondCredential = await issueTokyoCredential('aoid:test:resident-two');
  const first = await createPrivateAddressPredicateProof({
    issuerId,
    issuerSecret,
    credential: firstCredential,
    credentialIssuerSecret: issuerSecret,
    address,
    predicates: [{ kind: 'same-address-resident', groupId: 'shared-household-check' }],
    scope: 'same-address-check',
    challenge: 'same-address-group-nonce',
    issuedAt: '2026-01-01T00:05:00.000Z',
    privateProofSalt: 'first-proof-salt',
  });
  const second = await createPrivateAddressPredicateProof({
    issuerId,
    issuerSecret,
    credential: secondCredential,
    credentialIssuerSecret: issuerSecret,
    address,
    predicates: [{ kind: 'same-address-resident', groupId: 'shared-household-check' }],
    scope: 'same-address-check',
    challenge: 'same-address-group-nonce',
    issuedAt: '2026-01-01T00:05:00.000Z',
    privateProofSalt: 'second-proof-salt',
  });
  const differentContext = await createPrivateAddressPredicateProof({
    issuerId,
    issuerSecret,
    credential: secondCredential,
    credentialIssuerSecret: issuerSecret,
    address,
    predicates: [{ kind: 'same-address-resident', groupId: 'different-household-check' }],
    scope: 'same-address-check',
    challenge: 'same-address-group-nonce',
    issuedAt: '2026-01-01T00:05:00.000Z',
    privateProofSalt: 'third-proof-salt',
  });

  const firstCommitment = first.claim.predicates.find(predicate => predicate.kind === 'same-address-resident')?.sameAddressCommitment;
  const secondCommitment = second.claim.predicates.find(predicate => predicate.kind === 'same-address-resident')?.sameAddressCommitment;
  const differentCommitment = differentContext.claim.predicates.find(predicate => predicate.kind === 'same-address-resident')?.sameAddressCommitment;

  assert.equal(firstCommitment, secondCommitment);
  assert.notEqual(firstCommitment, differentCommitment);
});

test('rejects predicate creation when the hidden address does not satisfy the requested target', async () => {
  const credential = await issueTokyoCredential();

  await assert.rejects(
    createPrivateAddressPredicateProof({
      issuerId,
      issuerSecret,
      credential,
      credentialIssuerSecret: issuerSecret,
      address,
      predicates: [{ kind: 'country-resident', countryCode: 'US' }],
      challenge: 'wrong-country',
      issuedAt: '2026-01-01T00:05:00.000Z',
    }),
    /country/i
  );

  await assert.rejects(
    createPrivateAddressPredicateProof({
      issuerId,
      issuerSecret,
      credential,
      credentialIssuerSecret: issuerSecret,
      address,
      predicates: [{ kind: 'city-resident', countryCode: 'JP', city: 'Shibuya-ku' }],
      challenge: 'wrong-city',
      issuedAt: '2026-01-01T00:05:00.000Z',
    }),
    /city/i
  );
});

test('rejects unstripped private address predicate material during verification', async () => {
  const credential = await issueTokyoCredential();
  const envelope = await createPrivateAddressPredicateProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    predicates: [{ kind: 'country-resident', countryCode: 'JP' }],
    challenge: 'unstripped-material-check',
    issuedAt: '2026-01-01T00:05:00.000Z',
    privateProofSalt: 'unstripped-private-address-predicate-proof-salt',
  });

  const verification = await verifyPrivateAddressPredicateProof(envelope, {
    issuerSecret,
    expectedChallenge: 'unstripped-material-check',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.privacyPreserved, false);
  assert.ok(verification.errors.includes('privacy-fields-not-hidden'));
});

test('private address predicate proofs compose with existing public ZK proof bundles', async () => {
  const credential = await issueTokyoCredential();
  const envelope = await createPrivateAddressPredicateProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    predicates: [{ kind: 'country-resident', countryCode: 'JP' }],
    scope: 'address-privacy-bundle',
    challenge: 'bundle-nonce',
    issuedAt: '2026-01-01T00:05:00.000Z',
    ttlSeconds: 600,
    privateProofSalt: 'bundle-proof-salt',
  });
  const publicEnvelope = stripPrivateAddressPredicateProofMaterial(envelope);
  const publicCredential = stripPrivateAddressCredentialMaterial(credential);

  const compatibility = analyzeZkProofCompatibility([publicEnvelope, publicCredential], {
    expectedScope: 'address-privacy-bundle',
    allowUnknownProofVersions: false,
    allowSharedCommitments: true,
    now: '2026-01-01T00:05:30.000Z',
  });

  assert.equal(compatibility.compatible, true);
  assert.equal(compatibility.privacySafe, true);
  assert.ok(compatibility.manifest.proofVersions.includes('private-address-predicate-proof-v1'));
  assert.ok(compatibility.manifest.proofVersions.includes('address-credential-v1'));
});
