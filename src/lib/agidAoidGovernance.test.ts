import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAOIDEncryptedSyncEnvelope } from './aoid';
import {
  AGID_AOID_GOVERNANCE_MODEL_VERSION,
  buildAgidAoidAuditEvent,
  evaluateAgidAoidOperation,
} from './agidAoidGovernance';
import { buildRegisteredAddressRecord } from './registeredAddressQr';

const privateAddress = buildRegisteredAddressRecord(
  {
    country: 'JP',
    recipient: 'Private Receiver',
    street: '2-2 Roppongi',
    city: 'Tokyo',
    phone: '+81 3 0000 0000',
    room: '2801',
  },
  {
    mode: 'ADDRESS',
    agid: 'JP05AV8TJGH8',
    coords: { lat: 35.66, lon: 139.73 },
    now: '2026-06-03T00:00:00.000Z',
  },
);

const privateAoid = buildRegisteredAddressRecord(
  {
    country: 'JP',
    recipient: 'Private Receiver',
    street: '2-2 Roppongi',
    city: 'Tokyo',
    phone: '+81 3 0000 0000',
    room: '2801',
  },
  {
    mode: 'AOID',
    id: '05AV8TJGH8QZ6M2R',
    agid: 'JP05AV8TJGH8',
    coords: { lat: 35.66, lon: 139.73 },
    now: '2026-06-03T00:00:00.000Z',
  },
);

test('AGID public surfaces reject private registered-address fields', () => {
  const decision = evaluateAgidAoidOperation({
    layer: 'AGID',
    operation: 'register',
    surface: 'public-api',
    payload: privateAddress,
  });

  assert.equal(decision.modelVersion, AGID_AOID_GOVERNANCE_MODEL_VERSION);
  assert.equal(decision.allowed, false);
  assert.ok(decision.forbiddenFields.some(field => field.endsWith('.recipient')));
  assert.ok(decision.forbiddenFields.some(field => field.endsWith('.phone')));
});

test('AGID public surfaces reject an AOID private body even when it contains only structural fields', () => {
  const decision = evaluateAgidAoidOperation({
    layer: 'AGID',
    operation: 'communicate',
    surface: 'public-api',
    payload: {
      agid: 'JP05AV8TJGH8',
      privateBody: {
        schemaVersion: 'aoid-private-body-v1',
        agid: 'JP05AV8TJGH8',
        accessPolicy: { ownerConsentRequired: true },
      },
    },
  });

  assert.equal(decision.allowed, false);
  assert.ok(decision.forbiddenFields.some(field => field.endsWith('.privateBody')));
});

test('AGID private QR keeps local registration possible with an audit warning', () => {
  const decision = evaluateAgidAoidOperation({
    layer: 'AGID',
    operation: 'qr-build',
    surface: 'private-qr',
    payload: privateAddress,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.requiresLocalOnly, true);
  assert.equal(decision.privacy, 'private-local');
  assert.match(decision.warnings.join(' '), /trusted local\/private QR/);
});

test('AOID public communication exposes only public references', () => {
  const plaintextDecision = evaluateAgidAoidOperation({
    layer: 'AOID',
    operation: 'communicate',
    surface: 'public-api',
    payload: privateAoid,
  });
  const referenceDecision = evaluateAgidAoidOperation({
    layer: 'AOID',
    operation: 'communicate',
    surface: 'public-api',
    payload: {
      type: 'AOID',
      id: '05AV8TJGH8QZ6M2R',
      agid: 'JP05AV8TJGH8',
      publicHandle: 'aoid:05AV8TJGH8QZ6M2R',
      privacy: 'public-reference',
    },
  });

  assert.equal(plaintextDecision.allowed, false);
  assert.ok(plaintextDecision.forbiddenFields.some(field => field.endsWith('.recipient')));
  assert.ok(plaintextDecision.forbiddenFields.some(field => field.endsWith('.privateBody')));
  assert.equal(referenceDecision.allowed, true);
  assert.equal(referenceDecision.payloadClass, 'aoid-public-reference');
});

test('AOID encrypted sync requires an owner-device envelope and creates safe audit metadata', () => {
  const blocked = evaluateAgidAoidOperation({
    layer: 'AOID',
    operation: 'sync',
    surface: 'encrypted-sync',
    payload: privateAoid,
  });
  const envelope = buildAOIDEncryptedSyncEnvelope(privateAoid, {
    encryptedPayload: 'base64url.ciphertext.tag',
    ownerKeyId: 'owner-key-1',
    deviceKeyId: 'device-key-1',
    now: 1780000000000,
  });
  const allowed = evaluateAgidAoidOperation({
    layer: 'AOID',
    operation: 'sync',
    surface: 'encrypted-sync',
    payload: envelope,
  });
  const audit = buildAgidAoidAuditEvent({
    layer: 'AOID',
    operation: 'sync',
    surface: 'encrypted-sync',
    entityId: envelope.id,
    agid: envelope.agid,
    publicHandle: envelope.publicHandle,
    payload: envelope,
    now: 1780000000000,
  });
  const serializedAudit = JSON.stringify(audit);

  assert.equal(blocked.allowed, false);
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.requiresEncryption, true);
  assert.equal(audit.outcome, 'allowed');
  assert.equal(audit.payloadClass, 'aoid-encrypted-envelope');
  assert.doesNotMatch(serializedAudit, /Private Receiver|2801|\+81 3|base64url\.ciphertext\.tag/);
});
