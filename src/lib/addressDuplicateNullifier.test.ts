import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createAddressDuplicateNullifierProof,
  generateOwnerNullifierSecret,
  registerAddressDuplicateNullifier,
  verifyAddressDuplicateNullifierProof,
} from './addressDuplicateNullifier';
import { issueAddressCredential } from './addressCredential';

const issuerId = 'agid-local-test';
const issuerSecret = 'test-only-issuer-secret';
const ownerNullifierSecret = 'owner-nullifier-secret-with-high-entropy-for-tests';
const aoid = '05AV8TJGH8QZ6M2R';

const address = {
  country_code: 'JP',
  country: 'Japan',
  state: 'Tokyo',
  city: 'Chiyoda-ku',
  road: 'Marunouchi',
  house_number: '1',
  postcode: '100-0001',
};

async function issueAoidCredential(privateSalt: string, inputAddress = address) {
  return issueAddressCredential({
    issuerId,
    issuerSecret,
    layer: 'AOID',
    subjectId: 'aoid:test-subject',
    address: inputAddress,
    countryCode: 'JP',
    postalCode: '100-0001',
    verificationStatus: 'verified',
    verificationScore: 0.93,
    sourceIds: ['zipcloud', 'japan-post'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateSalt,
  });
}

test('creates a duplicate-prevention nullifier proof without exposing AOID or address', async () => {
  const credential = await issueAoidCredential('credential-salt-1');
  const proof = await createAddressDuplicateNullifierProof({
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    aoid,
    ownerNullifierSecret,
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/chiyoda',
    regionLevel: 'city',
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
  });

  const publicText = JSON.stringify(proof);
  assert.equal(proof.nullifier.length > 20, true);
  assert.equal(proof.registryId, 'MAIN-REGISTRY');
  assert.equal(proof.regionKey, 'JP/TOKYO/CHIYODA');
  assert.equal(proof.credential.layer, 'AOID');
  assert.equal(proof.credential.verificationStatus, 'verified');
  assert.equal(proof.proofHint.zkpGenerated, false);
  assert.equal(proof.proofHint.zkReady, true);
  assert.equal(publicText.includes(aoid), false);
  assert.equal(publicText.includes('Marunouchi'), false);
  assert.equal(publicText.includes('100-0001'), false);
  assert.equal(publicText.includes(ownerNullifierSecret), false);
  assert.equal(publicText.includes('JP/TOKYO/CHIYODA'), true);

  const verification = verifyAddressDuplicateNullifierProof(proof, {
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/chiyoda',
    now: '2026-01-01T00:10:00.000Z',
    minimumScore: 0.9,
  });

  assert.equal(verification.accepted, true);
  assert.equal(verification.privacyPreserved, true);
  assert.equal(verification.proofCost, 'none');
});

test('keeps the same nullifier for the same hidden address, AOID, and region', async () => {
  const firstCredential = await issueAoidCredential('credential-salt-1');
  const secondCredential = await issueAoidCredential('credential-salt-2');

  const firstProof = await createAddressDuplicateNullifierProof({
    credential: firstCredential,
    credentialIssuerSecret: issuerSecret,
    address,
    aoid,
    ownerNullifierSecret,
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/chiyoda',
    regionLevel: 'city',
    issuedAt: '2026-01-01T00:00:00.000Z',
  });
  const secondProof = await createAddressDuplicateNullifierProof({
    credential: secondCredential,
    credentialIssuerSecret: issuerSecret,
    address,
    aoid,
    ownerNullifierSecret,
    registryId: 'main-registry',
    regionKey: 'JP/TOKYO/CHIYODA',
    regionLevel: 'city',
    issuedAt: '2026-01-01T00:01:00.000Z',
  });

  assert.equal(firstProof.nullifier, secondProof.nullifier);
});

test('changes the nullifier when address, AOID, or region changes', async () => {
  const credential = await issueAoidCredential('credential-salt-1');
  const otherAddress = {
    ...address,
    house_number: '2',
  };
  const otherCredential = await issueAoidCredential('credential-salt-other', otherAddress);

  const baseProof = await createAddressDuplicateNullifierProof({
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    aoid,
    ownerNullifierSecret,
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/chiyoda',
    regionLevel: 'city',
  });
  const otherRegion = await createAddressDuplicateNullifierProof({
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    aoid,
    ownerNullifierSecret,
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/minato',
    regionLevel: 'city',
  });
  const otherAoid = await createAddressDuplicateNullifierProof({
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    aoid: 'B2D5TEST1',
    ownerNullifierSecret,
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/chiyoda',
    regionLevel: 'city',
  });
  const otherAddressProof = await createAddressDuplicateNullifierProof({
    credential: otherCredential,
    credentialIssuerSecret: issuerSecret,
    address: otherAddress,
    aoid,
    ownerNullifierSecret,
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/chiyoda',
    regionLevel: 'city',
  });

  assert.notEqual(baseProof.nullifier, otherRegion.nullifier);
  assert.notEqual(baseProof.nullifier, otherAoid.nullifier);
  assert.notEqual(baseProof.nullifier, otherAddressProof.nullifier);
});

test('registry detects duplicate registration using only the nullifier', async () => {
  const credential = await issueAoidCredential('credential-salt-1');
  const proof = await createAddressDuplicateNullifierProof({
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    aoid,
    ownerNullifierSecret,
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/chiyoda',
    regionLevel: 'city',
    issuedAt: '2026-01-01T00:00:00.000Z',
  });
  const registry = new Set<string>();

  const first = registerAddressDuplicateNullifier(proof, registry, {
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/chiyoda',
    now: '2026-01-01T00:10:00.000Z',
  });
  const second = registerAddressDuplicateNullifier(proof, registry, {
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/chiyoda',
    now: '2026-01-01T00:11:00.000Z',
  });

  assert.equal(first.registered, true);
  assert.equal(first.duplicate, false);
  assert.equal(second.registered, false);
  assert.equal(second.duplicate, true);
  assert.ok(second.errors.includes('nullifier-already-registered'));
  assert.equal(registry.size, 1);
});

test('detects duplicates from Set, array, and custom iterable registries', async () => {
  const credential = await issueAoidCredential('credential-salt-1');
  const proof = await createAddressDuplicateNullifierProof({
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    aoid,
    ownerNullifierSecret,
    registryId: 'main-registry',
    regionKey: 'jp/tokyo/chiyoda',
    regionLevel: 'city',
    issuedAt: '2026-01-01T00:00:00.000Z',
  });
  const customIterable = function* () {
    yield 'other-nullifier';
    yield proof.nullifier;
  };

  for (const registeredNullifiers of [
    new Set([proof.nullifier]),
    ['other-nullifier', proof.nullifier],
    customIterable(),
  ]) {
    const verification = verifyAddressDuplicateNullifierProof(proof, {
      registryId: 'main-registry',
      regionKey: 'jp/tokyo/chiyoda',
      now: '2026-01-01T00:10:00.000Z',
      registeredNullifiers,
    });

    assert.equal(verification.accepted, false);
    assert.equal(verification.duplicate, true);
    assert.ok(verification.errors.includes('nullifier-already-registered'));
  }
});

test('rejects proofs when the hidden address does not match the signed credential', async () => {
  const credential = await issueAoidCredential('credential-salt-1');

  await assert.rejects(
    createAddressDuplicateNullifierProof({
      credential,
      credentialIssuerSecret: issuerSecret,
      address: {
        ...address,
        house_number: '2',
      },
      aoid,
      ownerNullifierSecret,
      registryId: 'main-registry',
      regionKey: 'jp/tokyo/chiyoda',
      regionLevel: 'city',
    }),
    /address does not match/i
  );
});

test('generates an owner nullifier secret for local AOID storage', () => {
  const first = generateOwnerNullifierSecret();
  const second = generateOwnerNullifierSecret();

  assert.equal(first.length > 30, true);
  assert.notEqual(first, second);
});
