import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  SECURE_ADDRESS_QR_ADDRESS_COMMITMENT_ALGORITHM,
  SECURE_ADDRESS_QR_HIGH_RISK_TTL_SECONDS,
  SECURE_ADDRESS_QR_PREFIX,
  buildSecureAddressQrPayload,
  buildSecureAddressQrRecord,
  collectSecureAddressQrPrivateMaterial,
  createSecureAddressRecipientCommitment,
  parseSecureAddressQrPayload,
  summarizeSecureAddressQr,
  validateSecureAddressQrRecord,
} from './secureAddressQr';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
} from './registeredAddressQr';

function privateRegisteredAddressPayload() {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Private Receiver',
      organization: 'AGID Lab',
      phone: '+81 90 0000 0000',
      street: '1-1 Chiyoda',
      suburb: 'Chiyoda-ku',
      city: 'Tokyo',
      state: 'Tokyo',
      postcode: '1000001',
      building: 'Secret Tower',
      room: '2801',
    },
    {
      mode: 'ADDRESS',
      agid: 'JP05AV8TJGH8',
      coords: { lat: 35.681236, lon: 139.767125 },
      now: '2026-06-24T00:00:00.000Z',
    },
  );

  return buildRegisteredAddressQrPayload(record, { privacy: 'full' });
}

function decodeSecurePayload(payload: string) {
  return JSON.parse(decodeURIComponent(payload.slice(SECURE_ADDRESS_QR_PREFIX.length)));
}

test('Secure Address QR wraps a registered address without copying private address material', () => {
  const payload = buildSecureAddressQrPayload({
    purpose: 'delivery',
    scope: 'courier-handoff',
    audience: 'delivery-gateway',
    addressPayload: privateRegisteredAddressPayload(),
    recipientProofSecret: 'recipient-local-secret',
    issuedAt: '2026-06-24T00:00:00.000Z',
    expiresAt: '2026-06-24T00:10:00.000Z',
    maxScans: 2,
  });
  const decoded = decodeSecurePayload(payload);
  const record = parseSecureAddressQrPayload(payload);
  const validation = validateSecureAddressQrRecord(record, {
    now: '2026-06-24T00:05:00.000Z',
  });

  assert.ok(record);
  assert.match(payload, /^agid:secure-address:/);
  assert.equal(record.addressRef.kind, 'registered-address');
  assert.match(record.addressRef.alias, /^SAQ-[0-9A-F]{12,32}$/);
  assert.match(record.addressRef.referenceCommitment, /^SAC-[0-9A-F]{40,64}$/);
  assert.equal(record.addressRef.commitmentAlgorithm, SECURE_ADDRESS_QR_ADDRESS_COMMITMENT_ALGORITHM);
  assert.equal(record.addressRef.country, 'JP');
  assert.equal(record.privacy.rawAddressStored, false);
  assert.equal(record.privacy.rawAgidStored, false);
  assert.equal(record.privacy.rawCoordinatesStored, false);
  assert.equal(record.privacy.plaintextRecipientStored, false);
  assert.equal(record.privacy.phoneStored, false);
  assert.equal(record.privacy.buildingStored, false);
  assert.equal(record.privacy.roomStored, false);
  assert.equal(record.privacy.addressReferenceCommitmentStored, true);
  assert.equal(record.requiredProofs[0], 'recipient-secret-commitment');
  assert.equal(record.maxScans, 2);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.privateMaterialPaths, []);
  assert.doesNotMatch(JSON.stringify(decoded), /Private Receiver|\+81 90|1-1 Chiyoda|Tokyo|1000001|Secret Tower|2801|JP05AV8TJGH8|35\.681236|139\.767125/);
  assert.doesNotMatch(payload, /recipient-local-secret/);
});

test('high-risk Secure Address QR clamps TTL, blocks offline scan, and stores only envelope commitments', () => {
  const payload = buildSecureAddressQrPayload({
    purpose: 'emergency',
    riskLevel: 'high',
    addressPayload: privateRegisteredAddressPayload(),
    recipientProofSecret: 'owner-proof-secret',
    encryptedEnvelope: {
      keyId: 'wallet-key-1',
      ciphertext: 'encrypted-address-ciphertext-that-stays-out-of-the-qr',
    },
    issuedAt: '2026-06-24T00:00:00.000Z',
    expiresAt: '2026-06-24T02:00:00.000Z',
    offlineScanAllowed: true,
  });
  const record = parseSecureAddressQrPayload(payload);
  const validation = validateSecureAddressQrRecord(record, {
    now: '2026-06-24T00:04:59.000Z',
  });

  assert.ok(record);
  assert.equal(record.expiresAt, '2026-06-24T00:05:00.000Z');
  assert.equal(validation.ttlSeconds, SECURE_ADDRESS_QR_HIGH_RISK_TTL_SECONDS);
  assert.equal(record.maxScans, 1);
  assert.equal(record.offlineScanAllowed, false);
  assert.equal(record.encryptedEnvelope.mode, 'hash-only');
  assert.equal(record.encryptedEnvelope.keyId, 'wallet-key-1');
  assert.match(record.encryptedEnvelope.envelopeCommitment ?? '', /^SAE-[0-9A-F]{40,64}$/);
  assert.doesNotMatch(payload, /encrypted-address-ciphertext|owner-proof-secret/);
  assert.equal(validation.valid, true);
});

test('purpose and scope separate address commitments and nullifiers', () => {
  const base = {
    addressPayload: privateRegisteredAddressPayload(),
    recipientProofSecret: 'domain-separated-secret',
    jti: '0123456789ABCDEFGHJKMNPQ',
    issuedAt: '2026-06-24T00:00:00.000Z',
  };
  const delivery = buildSecureAddressQrRecord({
    ...base,
    purpose: 'delivery',
    scope: 'courier-handoff',
  });
  const hotel = buildSecureAddressQrRecord({
    ...base,
    purpose: 'hotel-check-in',
    scope: 'front-desk',
  });

  assert.notEqual(delivery.addressRef.referenceCommitment, hotel.addressRef.referenceCommitment);
  assert.notEqual(delivery.recipientProof.commitment, hotel.recipientProof.commitment);
  assert.notEqual(delivery.nullifier.value, hotel.nullifier.value);
  assert.equal(
    delivery.recipientProof.commitment,
    createSecureAddressRecipientCommitment({
      addressReferenceCommitment: delivery.addressRef.referenceCommitment,
      jti: delivery.jti,
      recipientSecret: 'domain-separated-secret',
      nonce: delivery.recipientProof.nonce,
      domain: delivery.domainSeparation.recipient,
      method: delivery.recipientProof.method,
    }),
  );
});

test('parser rejects QR payloads that try to smuggle raw address fields', () => {
  const record = buildSecureAddressQrRecord({
    purpose: 'wallet-share',
    addressPayload: privateRegisteredAddressPayload(),
    issuedAt: '2026-06-24T00:00:00.000Z',
  });
  const unsafe = {
    ...record,
    street: '1-1 Chiyoda',
    recipient: 'Private Receiver',
  };
  const payload = `${SECURE_ADDRESS_QR_PREFIX}${encodeURIComponent(JSON.stringify(unsafe))}`;

  assert.deepEqual(collectSecureAddressQrPrivateMaterial(unsafe).sort(), ['$.recipient', '$.street']);
  assert.equal(parseSecureAddressQrPayload(payload), null);
});

test('summary exposes only safe operational tails and privacy notes', () => {
  const payload = buildSecureAddressQrPayload({
    purpose: 'wallet-share',
    addressPayload: privateRegisteredAddressPayload(),
    issuedAt: '2026-06-24T00:00:00.000Z',
  });
  const summary = summarizeSecureAddressQr(payload, {
    now: '2026-06-24T00:01:00.000Z',
  });

  assert.equal(summary.valid, true);
  assert.equal(summary.status, 'valid');
  assert.equal(summary.purpose, 'wallet-share');
  assert.match(summary.addressAlias ?? '', /^SAQ-/);
  assert.ok(summary.addressReferenceTail);
  assert.ok(summary.nullifierTail);
  assert.ok(summary.privacyNotes.some(note => note.includes('not the raw address')));
  assert.deepEqual(summary.errors, []);
});
