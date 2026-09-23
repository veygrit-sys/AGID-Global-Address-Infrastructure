import assert from 'node:assert/strict';
import { test } from 'node:test';

import { issueAddressCredential } from './addressCredential';
import {
  createZkAddressProof,
  createZkDeliveryEligibilityProof,
  createZkResidenceProof,
  stripPrivateZkAddressProofMaterial,
  stripPrivateZkDeliveryEligibilityProofMaterial,
  stripPrivateZkResidenceProofMaterial,
  verifyZkAddressProof,
  verifyZkDeliveryEligibilityProof,
  verifyZkResidenceProof,
  ZK_ADDRESS_PROOF_SCOPE,
  ZK_DELIVERY_ELIGIBILITY_SCOPE,
  ZK_RESIDENCE_PROOF_SCOPE,
  type ZkDeliveryEligibilityRegion,
} from './agidZkAddressProofs';
import { analyzeZkProofCompatibility } from './zkProofCompatibility';

const issuerId = 'agid-zk-address-proof-test';
const issuerSecret = 'test-only-agid-zk-address-proof-issuer-secret';
const issuedAt = '2026-01-01T00:10:00.000Z';
const now = '2026-01-01T00:10:30.000Z';

const hiddenAddress = {
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

const deliveryRegion: ZkDeliveryEligibilityRegion = {
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

async function issueHiddenAddressCredential() {
  return issueAddressCredential({
    issuerId,
    issuerSecret,
    address: hiddenAddress,
    countryCode: 'JP',
    postalCode: '100-0001',
    layer: 'AOID',
    subjectId: 'aoid:test:zk-address-holder',
    verificationStatus: 'verified',
    verificationScore: 0.96,
    sourceIds: ['japan-post', 'tokyo-open-admin-boundary'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateSalt: 'credential-private-salt-for-agid-zk-address-proof',
  });
}

function assertHiddenAddressNotLeaked(publicProof: unknown) {
  const publicText = JSON.stringify(publicProof);

  assert.equal(publicText.includes('Marunouchi'), false);
  assert.equal(publicText.includes('Hidden Tower'), false);
  assert.equal(publicText.includes('100-0001'), false);
  assert.equal(publicText.includes('35.6812'), false);
  assert.equal(publicText.includes('139.7671'), false);
  assert.equal(publicText.includes('credential-private-salt-for-agid-zk-address-proof'), false);
  assert.equal(publicText.includes('privateProofSalt'), false);
}

function assertIdentityBindingNotLeaked(publicProof: unknown) {
  const publicText = JSON.stringify(publicProof);

  assert.equal(publicText.includes('did:example:user:alice-private'), false);
  assert.equal(publicText.includes('oidc|issuer.example|private-user-123'), false);
  assert.equal(publicText.includes('aoid:private:resident-001'), false);
  assert.equal(publicText.includes('identity-binding-private-salt'), false);
  assert.equal(publicText.includes('privateIdentityBindingSalt'), false);
}

function assertCommitment(value: unknown) {
  assert.equal(typeof value, 'string');
  assert.match(value as string, /^[A-Za-z0-9_-]{20,}$/u);
}

test('ZK Address Proof proves a valid hidden address credential without revealing address fields', async () => {
  const credential = await issueHiddenAddressCredential();
  const proof = await createZkAddressProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address: hiddenAddress,
    challenge: 'zk-address-proof-nonce',
    issuedAt,
    ttlSeconds: 600,
    privateProofSalt: 'zk-address-proof-private-salt',
  });
  const publicProof = stripPrivateZkAddressProofMaterial(proof);

  assert.equal(proof.claim.scope, ZK_ADDRESS_PROOF_SCOPE);
  assert.deepEqual(proof.claim.predicates.map(predicate => predicate.kind), ['verified-address']);
  assertHiddenAddressNotLeaked(publicProof);

  const verification = await verifyZkAddressProof(publicProof, {
    issuerId,
    issuerSecret,
    expectedChallenge: 'zk-address-proof-nonce',
    minimumScore: 0.9,
    now,
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.privacyPreserved, true);
});

test('ZK Address Proof binds to external identity without revealing subject identifiers', async () => {
  const credential = await issueHiddenAddressCredential();
  const proof = await createZkAddressProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address: hiddenAddress,
    challenge: 'zk-address-identity-proof-nonce',
    issuedAt,
    ttlSeconds: 600,
    privateProofSalt: 'zk-address-identity-proof-private-salt',
    identityBinding: {
      provider: 'DID',
      subjectId: 'did:example:user:alice-private',
      issuer: 'did:example:issuer',
      audience: 'delivery-checkout',
      privateIdentityBindingSalt: 'identity-binding-private-salt',
    },
  });
  const publicProof = stripPrivateZkAddressProofMaterial(proof);

  assert.equal(publicProof.claim.identityBinding?.provider, 'DID');
  assert.equal(publicProof.claim.identityBinding?.issuer, 'did:example:issuer');
  assert.equal(publicProof.claim.identityBinding?.audience, 'DELIVERY-CHECKOUT');
  assertCommitment(publicProof.claim.identityBinding?.subjectCommitment);
  assertCommitment(publicProof.claim.identityBinding?.bindingCommitment);
  assertHiddenAddressNotLeaked(publicProof);
  assertIdentityBindingNotLeaked(publicProof);

  const verification = await verifyZkAddressProof(publicProof, {
    issuerId,
    issuerSecret,
    expectedChallenge: 'zk-address-identity-proof-nonce',
    expectedIdentity: {
      provider: 'DID',
      issuer: 'did:example:issuer',
      audience: 'delivery-checkout',
    },
    minimumScore: 0.9,
    now,
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.privacyPreserved, true);
});

test('ZK Residence Proof proves country, city, and same-address residence without exposing the address body', async () => {
  const credential = await issueHiddenAddressCredential();
  const proof = await createZkResidenceProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address: hiddenAddress,
    countryCode: 'JP',
    city: 'Chiyoda-ku',
    sameAddressGroupId: 'residence-check:checkout-001',
    challenge: 'zk-residence-proof-nonce',
    issuedAt,
    ttlSeconds: 600,
    privateProofSalt: 'zk-residence-proof-private-salt',
  });
  const publicProof = stripPrivateZkResidenceProofMaterial(proof);

  assert.equal(proof.claim.scope, ZK_RESIDENCE_PROOF_SCOPE);
  assert.deepEqual(proof.claim.predicates.map(predicate => predicate.kind), [
    'same-address-resident',
    'country-resident',
    'city-resident',
  ]);
  assertHiddenAddressNotLeaked(publicProof);

  const verification = await verifyZkResidenceProof(publicProof, {
    issuerId,
    issuerSecret,
    expectedChallenge: 'zk-residence-proof-nonce',
    expectedCountryCode: 'JP',
    expectedCity: 'Chiyoda-ku',
    expectedSameAddressGroupId: 'residence-check:checkout-001',
    minimumScore: 0.9,
    now,
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.predicatesSatisfied, true);
  assert.equal(verification.privacyPreserved, true);
});

test('ZK Residence and Delivery Eligibility proofs can require identity binding expectations', async () => {
  const credential = await issueHiddenAddressCredential();
  const residenceProof = stripPrivateZkResidenceProofMaterial(await createZkResidenceProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address: hiddenAddress,
    countryCode: 'JP',
    city: 'Chiyoda-ku',
    challenge: 'zk-residence-identity-proof-nonce',
    issuedAt,
    ttlSeconds: 600,
    privateProofSalt: 'zk-residence-identity-proof-private-salt',
    identityBinding: {
      provider: 'AOID',
      subjectId: 'aoid:private:resident-001',
      audience: 'municipal-service',
      privateIdentityBindingSalt: 'identity-binding-private-salt',
    },
  }));
  const deliveryProof = stripPrivateZkDeliveryEligibilityProofMaterial(await createZkDeliveryEligibilityProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address: hiddenAddress,
    deliveryRegion,
    point: { lat: 35.6812, lon: 139.7671 },
    challenge: 'zk-delivery-identity-proof-nonce',
    issuedAt,
    ttlSeconds: 600,
    privateProofSalt: 'zk-delivery-identity-proof-private-salt',
    identityBinding: {
      provider: 'OIDC',
      subjectId: 'oidc|issuer.example|private-user-123',
      issuer: 'https://issuer.example',
      audience: 'last-mile-provider',
      privateIdentityBindingSalt: 'identity-binding-private-salt',
    },
  }));

  assertIdentityBindingNotLeaked(residenceProof);
  assertIdentityBindingNotLeaked(deliveryProof);

  const residenceVerification = await verifyZkResidenceProof(residenceProof, {
    issuerId,
    issuerSecret,
    expectedChallenge: 'zk-residence-identity-proof-nonce',
    expectedCountryCode: 'JP',
    expectedCity: 'Chiyoda-ku',
    expectedIdentity: {
      provider: 'AOID',
      audience: 'municipal-service',
    },
    minimumScore: 0.9,
    now,
  });
  const deliveryVerification = await verifyZkDeliveryEligibilityProof(deliveryProof, {
    issuerId,
    issuerSecret,
    expectedChallenge: 'zk-delivery-identity-proof-nonce',
    expectedRegionId: 'DELIVERY:TOKYO-CENTRAL',
    expectedIdentity: {
      provider: 'OIDC',
      issuer: 'https://issuer.example',
      audience: 'last-mile-provider',
    },
    minimumScore: 0.9,
    now,
  });

  assert.equal(residenceVerification.valid, true);
  assert.equal(deliveryVerification.valid, true);
});

test('ZK Delivery Eligibility proves delivery-area eligibility without exposing coordinates or region geometry', async () => {
  const credential = await issueHiddenAddressCredential();
  const proof = await createZkDeliveryEligibilityProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address: hiddenAddress,
    deliveryRegion,
    point: { lat: 35.6812, lon: 139.7671 },
    challenge: 'zk-delivery-proof-nonce',
    issuedAt,
    ttlSeconds: 600,
    privateProofSalt: 'zk-delivery-proof-private-salt',
  });
  const publicProof = stripPrivateZkDeliveryEligibilityProofMaterial(proof);
  const publicText = JSON.stringify(publicProof);

  assert.equal(proof.claim.scope, ZK_DELIVERY_ELIGIBILITY_SCOPE);
  assert.deepEqual(proof.claim.predicates.map(predicate => predicate.kind), ['delivery-region']);
  assertHiddenAddressNotLeaked(publicProof);
  assert.equal(publicText.includes('35.9'), false);
  assert.equal(publicText.includes('139.95'), false);

  const verification = await verifyZkDeliveryEligibilityProof(publicProof, {
    issuerId,
    issuerSecret,
    expectedChallenge: 'zk-delivery-proof-nonce',
    expectedRegionId: 'DELIVERY:TOKYO-CENTRAL',
    minimumScore: 0.9,
    now,
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.predicatesSatisfied, true);
  assert.equal(verification.privacyPreserved, true);
});

test('ZK Address Proof rejects tampered identity binding claims', async () => {
  const credential = await issueHiddenAddressCredential();
  const proof = await createZkAddressProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address: hiddenAddress,
    challenge: 'zk-address-identity-tamper-nonce',
    issuedAt,
    ttlSeconds: 600,
    privateProofSalt: 'zk-address-identity-tamper-private-salt',
    identityBinding: {
      provider: 'OIDC',
      subjectId: 'oidc|issuer.example|private-user-123',
      issuer: 'https://issuer.example',
      audience: 'checkout-a',
      privateIdentityBindingSalt: 'identity-binding-private-salt',
    },
  });
  const publicProof = stripPrivateZkAddressProofMaterial(proof);
  const tamperedProof = JSON.parse(JSON.stringify(publicProof));
  tamperedProof.claim.identityBinding.audience = 'CHECKOUT-B';

  const verification = await verifyZkAddressProof(tamperedProof, {
    issuerId,
    issuerSecret,
    expectedChallenge: 'zk-address-identity-tamper-nonce',
    expectedIdentity: {
      provider: 'OIDC',
      issuer: 'https://issuer.example',
      audience: 'checkout-a',
    },
    now,
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.errors.includes('signature-invalid'), true);
});

test('AGID named ZK address proofs compose with the existing compatibility model', async () => {
  const credential = await issueHiddenAddressCredential();
  const addressProof = stripPrivateZkAddressProofMaterial(await createZkAddressProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address: hiddenAddress,
    challenge: 'zk-address-proof-nonce',
    issuedAt,
    ttlSeconds: 600,
    privateProofSalt: 'zk-address-proof-private-salt',
  }));
  const residenceProof = stripPrivateZkResidenceProofMaterial(await createZkResidenceProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address: hiddenAddress,
    countryCode: 'JP',
    city: 'Chiyoda-ku',
    challenge: 'zk-residence-proof-nonce',
    issuedAt,
    ttlSeconds: 600,
    privateProofSalt: 'zk-residence-proof-private-salt',
  }));
  const deliveryProof = stripPrivateZkDeliveryEligibilityProofMaterial(await createZkDeliveryEligibilityProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address: hiddenAddress,
    deliveryRegion,
    point: { lat: 35.6812, lon: 139.7671 },
    challenge: 'zk-delivery-proof-nonce',
    issuedAt,
    ttlSeconds: 600,
    privateProofSalt: 'zk-delivery-proof-private-salt',
  }));

  const compatibility = analyzeZkProofCompatibility([addressProof, residenceProof, deliveryProof], {
    allowUnknownProofVersions: false,
    allowSharedCommitments: true,
    now,
  });

  assert.equal(compatibility.compatible, true);
  assert.equal(compatibility.privacySafe, true);
  assert.equal(compatibility.proofCount, 3);
  assert.deepEqual(compatibility.manifest.scopes, [
    ZK_ADDRESS_PROOF_SCOPE,
    ZK_DELIVERY_ELIGIBILITY_SCOPE,
    ZK_RESIDENCE_PROOF_SCOPE,
  ]);
});
