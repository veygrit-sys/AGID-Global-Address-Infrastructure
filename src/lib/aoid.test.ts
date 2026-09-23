import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAOIDEncryptedSyncEnvelope,
  buildAOIDPrivateBody,
  buildAOIDPublicDescriptor,
  buildAOIDPublicHandle,
  buildAOIDSyncQueuePayload,
  classifyAOIDSyncReadiness,
  generateAOID,
  getAOIDLinkedAGIDAnchor,
  isAOIDLinkedToAGID,
  isValidAOIDId,
  isOpaqueEncryptedPayload,
  normalizeAOIDId,
  normalizeAOIDRecord,
  normalizeAOIDDeliveryAccessProfile,
  redactAOIDForPublicUse,
  revokeAOIDRecord,
  validateAOIDRegistrationRequirements,
  validateAOIDPrivateBody,
} from './aoid';
import { buildRegisteredAddressRecord } from './registeredAddressQr';

const linkedAgid = 'JP05AV8TJGH8';
const linkedAoid = '05AV8TJGH8QZ6M2R';

const baseAoid = buildRegisteredAddressRecord(
  {
    country: 'JP',
    recipient: 'Private Receiver',
    organization: 'Public Tower',
    street: '2-2 Roppongi',
    city: 'Tokyo',
    postcode: '1060032',
    phone: '+81 3 0000 0000',
    building: 'Public Tower',
    room: '2801',
  },
  {
    mode: 'AOID',
    id: linkedAoid,
    agid: linkedAgid,
    coords: { lat: 35.66, lon: 139.73 },
    now: '2026-06-03T00:00:00.000Z',
  },
);

test('normalizes AOID records into owner-managed local-first private records', () => {
  const record = normalizeAOIDRecord(baseAoid);

  assert.equal(record.id, linkedAoid);
  assert.equal(record.type, 'AOID');
  assert.equal(record.isAoid, true);
  assert.equal(record.ownerManaged, true);
  assert.equal(record.privacy, 'private');
  assert.equal(record.storageMode, 'device-local');
  assert.equal(record.syncReadiness, 'local-only');
  assert.equal(record.status, 'active');
  assert.equal(record.publicHandle, buildAOIDPublicHandle(linkedAoid));
  assert.equal(record.privateBody?.agid, linkedAgid);
  assert.equal(record.privateBody?.building?.name, 'Public Tower');
  assert.equal(record.privateBody?.room, '2801');
  assert.equal(record.privateBody?.recipient?.name, 'Private Receiver');
});

test('structures AGID, delivery detail, access policy, validity, and metadata inside the private AOID body', () => {
  const body = buildAOIDPrivateBody({
    ...baseAoid,
    floor: '28',
    deliveryOptions: {
      dropOffPreference: 'front-desk',
      unattendedDeliveryAllowed: true,
      signatureRequired: false,
      instructions: 'Synthetic delivery instruction',
    },
    intercom: {
      callLabel: 'Synthetic Receiver',
      accessCode: 'TEST-ONLY',
    },
    accessPolicy: {
      allowedActors: ['owner', 'carrier'],
      allowedPurposes: ['owner-management', 'delivery'],
      disclosedFields: ['agid', 'building', 'floor', 'room'],
      ownerConsentRequired: true,
    },
    validity: {
      validFrom: 1780000000000,
      validUntil: 1780003600000,
    },
    metadata: {
      label: 'Primary delivery destination',
      locale: 'ja-JP',
      tags: ['home', 'synthetic'],
    },
  });
  const validation = validateAOIDPrivateBody(body);

  assert.equal(validation.ok, true);
  assert.equal(body.agid, linkedAgid);
  assert.equal(body.floor, '28');
  assert.equal(body.deliveryOptions.dropOffPreference, 'front-desk');
  assert.equal(body.intercom?.accessCode, 'TEST-ONLY');
  assert.deepEqual(body.accessPolicy.allowedActors, ['owner', 'carrier']);
  assert.equal(body.validity.validUntil, 1780003600000);
  assert.deepEqual(body.metadata.tags, ['home', 'synthetic']);
});

test('requires a linked AGID for new AOID registration and rejects invalid validity windows', () => {
  assert.throws(
    () => buildRegisteredAddressRecord(
      { recipient: 'Synthetic Receiver', room: '101' },
      { mode: 'AOID', id: linkedAoid },
    ),
    /linked AGID/i,
  );

  const validation = validateAOIDPrivateBody({
    agid: linkedAgid,
    validity: {
      validFrom: 1780003600000,
      validUntil: 1780000000000,
    },
  });
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join(' '), /validUntil/);
});

test('validates AOID ids as 9 to 16 unambiguous base32 handles with a linked AGID anchor', () => {
  assert.equal(getAOIDLinkedAGIDAnchor(linkedAgid), '05AV8TJGH8');
  assert.equal(normalizeAOIDId('05av8tjgh8qz6m2r', { linkedAgid }), linkedAoid);
  assert.equal(isValidAOIDId(linkedAoid), true);
  assert.equal(isAOIDLinkedToAGID(linkedAoid, linkedAgid), true);
  assert.equal(isAOIDLinkedToAGID('05AV8TJGH', linkedAgid), true);

  assert.throws(
    () => normalizeAOIDId('05AV8TJG', { linkedAgid }),
    /9 to 16/i,
  );
  assert.throws(
    () => normalizeAOIDId('05AV8TJGH8QZ6M2RX', { linkedAgid }),
    /9 to 16/i,
  );
  assert.throws(
    () => normalizeAOIDId('05AV8TJGHI', { linkedAgid }),
    /base32/i,
  );
  assert.throws(
    () => normalizeAOIDId('AAAAAAAAAAAAAAAA'),
    /16 repeated/i,
  );
  assert.throws(
    () => normalizeAOIDId('05AV0123H8'),
    /four consecutive/i,
  );
  assert.throws(
    () => normalizeAOIDId('05AV8TJGH8QZ6M2R', { linkedAgid: 'US00TEST0001' }),
    /linked AGID/i,
  );
});

test('generates a 16-character AOID anchored by the linked AGID hash', () => {
  const generated = generateAOID(linkedAgid);

  assert.equal(generated.length, 16);
  assert.equal(generated.startsWith(getAOIDLinkedAGIDAnchor(linkedAgid)), true);
  assert.equal(isAOIDLinkedToAGID(generated, linkedAgid), true);
  assert.equal(isValidAOIDId(generated), true);
});

test('normalization rejects invalid ids and downgrades unsafe cloud flags on plain AOID records', () => {
  assert.throws(
    () => normalizeAOIDRecord({ ...baseAoid, id: 'bad id', type: 'AOID' }),
    /invalid aoid id/i,
  );

  const record = normalizeAOIDRecord({
    ...baseAoid,
    storageMode: 'encrypted-cloud',
    syncReadiness: 'encrypted-sync-ready',
    publicHandle: 'aoid:OTHERID99',
    ownerKeyId: 'bad key id with spaces',
  } as typeof baseAoid);

  assert.equal(record.storageMode, 'device-local');
  assert.equal(record.syncReadiness, 'local-only');
  assert.equal(record.publicHandle, 'aoid:05AV8TJGH8QZ6M2R');
  assert.equal(record.ownerKeyId, 'badkeyidwithspaces');
});

test('public AOID descriptor does not expose delivery recipient, phone, room, or coordinates', () => {
  const descriptor = buildAOIDPublicDescriptor(baseAoid);
  const publicRecord = redactAOIDForPublicUse(baseAoid);
  const serialized = JSON.stringify({ descriptor, publicRecord });

  assert.equal(descriptor.id, '05AV8TJGH8QZ6M2R');
  assert.equal(descriptor.agid, 'JP05AV8TJGH8');
  assert.equal(descriptor.privacy, 'public-reference');
  assert.equal('updatedAt' in descriptor, false);
  assert.equal(publicRecord.address, 'JP05AV8TJGH8');
  assert.equal('updatedAt' in publicRecord, false);
  assert.doesNotMatch(serialized, /Private Receiver/);
  assert.doesNotMatch(serialized, /\+81 3/);
  assert.doesNotMatch(serialized, /2801/);
  assert.doesNotMatch(serialized, /35\.66|139\.73/);
  assert.doesNotMatch(serialized, /aoid-private-body-v1/);
});

test('AOID registration records auto-lock and PO Box access restrictions explicitly', () => {
  const autoLock = normalizeAOIDRecord({
    ...baseAoid,
    accessKind: 'auto-lock',
    deliveryAccessConfirmedAt: 1780000000000,
  } as typeof baseAoid);

  assert.equal(autoLock.deliveryAccess.kind, 'auto-lock');
  assert.equal(autoLock.deliveryAccess.autoLock, true);
  assert.equal(autoLock.deliveryAccess.poBox, false);
  assert.equal(autoLock.deliveryAccess.carrierReviewRequired, true);
  assert.equal(validateAOIDRegistrationRequirements(autoLock).ok, true);

  const poBox = normalizeAOIDRecord({
    ...baseAoid,
    street: 'P.O. Box 1200',
    address: 'P.O. Box 1200, Honolulu HI 96801, US',
    deliveryAccessConfirmedAt: 1780000000000,
  } as typeof baseAoid);

  assert.equal(poBox.deliveryAccess.kind, 'po-box');
  assert.equal(poBox.deliveryAccess.poBox, true);
  assert.equal(poBox.deliveryAccess.carrierReviewRequired, true);
  assert.equal(validateAOIDRegistrationRequirements(poBox).ok, true);
});

test('AOID registration flags access-restricted addresses when the access kind is not explicit', () => {
  const implicitAutoLock = {
    ...baseAoid,
    address: 'Auto-lock residence, Tokyo, Japan',
  } as typeof baseAoid;
  const validation = validateAOIDRegistrationRequirements(implicitAutoLock);

  assert.equal(normalizeAOIDDeliveryAccessProfile(implicitAutoLock).autoLock, true);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.includes('aoid-delivery-access-kind-must-record-auto-lock'));
  assert.ok(validation.warnings.includes('aoid-delivery-access-confirmation-timestamp-recommended'));
});

test('AOID cloud sync requires owner-device encrypted payloads', () => {
  assert.throws(
    () => buildAOIDEncryptedSyncEnvelope(baseAoid, { encryptedPayload: '' }),
    /encrypted payload/i,
  );
  assert.throws(
    () => buildAOIDEncryptedSyncEnvelope(baseAoid, {
      encryptedPayload: '{"recipient":"Private Receiver"}',
      ownerKeyId: 'owner-key-1',
      deviceKeyId: 'device-key-1',
    }),
    /opaque/i,
  );
  assert.throws(
    () => buildAOIDEncryptedSyncEnvelope(baseAoid, {
      encryptedPayload: 'base64url.ciphertext.tag',
    }),
    /key ids/i,
  );
  assert.equal(isOpaqueEncryptedPayload('{"room":"2801"}'), false);
  assert.equal(isOpaqueEncryptedPayload('base64url.ciphertext.tag'), true);

  const envelope = buildAOIDEncryptedSyncEnvelope(baseAoid, {
    encryptedPayload: 'base64url.ciphertext.tag',
    ownerKeyId: 'owner-key-1',
    deviceKeyId: 'device-key-1',
    now: 1780000000000,
  });

  assert.equal(envelope.type, 'AOID_SYNC_ENVELOPE');
  assert.equal(envelope.id, '05AV8TJGH8QZ6M2R');
  assert.equal(envelope.encryption, 'owner-device');
  assert.equal(envelope.encryptedPayload, 'base64url.ciphertext.tag');
  assert.equal(envelope.ownerKeyId, 'owner-key-1');
  assert.equal(envelope.deviceKeyId, 'device-key-1');
  assert.equal(envelope.updatedAt, 1780000000000);
  assert.doesNotMatch(JSON.stringify(envelope), /Private Receiver|2801|\+81 3/);
});

test('AOID sync queue payload redacts plain records unless encrypted envelope is supplied', () => {
  const redacted = buildAOIDSyncQueuePayload(baseAoid) as Record<string, unknown>;
  assert.equal(redacted.id, '05AV8TJGH8QZ6M2R');
  assert.equal(redacted.requiresEncryptedPayload, true);
  assert.doesNotMatch(JSON.stringify(redacted), /Private Receiver|2801|\+81 3/);

  const envelope = buildAOIDEncryptedSyncEnvelope(baseAoid, {
    encryptedPayload: 'base64url.ciphertext.tag',
    ownerKeyId: 'owner-key-1',
    deviceKeyId: 'device-key-1',
    now: 1780000000000,
  });
  assert.deepEqual(buildAOIDSyncQueuePayload(envelope), envelope);

  assert.throws(
    () => buildAOIDSyncQueuePayload({
      type: 'AOID_SYNC_ENVELOPE',
      id: '05AV8TJGH8QZ6M2R',
      encryptedPayload: '{"phone":"+81"}',
      encryption: 'owner-device',
    }),
    /invalid aoid encrypted sync envelope/i,
  );
});

test('AOID readiness and revocation keep owner control explicit', () => {
  assert.equal(classifyAOIDSyncReadiness({}), 'local-only');
  assert.equal(classifyAOIDSyncReadiness({ userOptedInToCloud: true }), 'blocked');
  assert.equal(
    classifyAOIDSyncReadiness({ userOptedInToCloud: true, hasEncryptedPayload: true }),
    'blocked',
  );
  assert.equal(
    classifyAOIDSyncReadiness({
      userOptedInToCloud: true,
      hasEncryptedPayload: true,
      hasOwnerKeyId: true,
      hasDeviceKeyId: true,
    }),
    'encrypted-sync-ready',
  );

  const revoked = revokeAOIDRecord(baseAoid, 1780000000000);
  assert.equal(revoked.status, 'revoked');
  assert.equal(revoked.revokedAt, 1780000000000);
});
