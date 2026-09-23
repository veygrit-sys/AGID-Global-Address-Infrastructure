import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createAgidSecureToken,
} from './agidSecureShare';
import {
  buildPosRecipientKeyPlan,
  generatePosSecureKeyEntry,
  markAgidSecurePosUsed,
  openAgidSecureForPos,
  rotatePosSecureKeyEntry,
  verifyAgidSecurePosRegistry,
} from './agidSecurePos';
import { buildPosNfcPayload } from './posAcceptance';

const NOW = Date.parse('2026-06-07T00:00:00.000Z');
const EXP = Math.floor(Date.parse('2026-06-07T01:00:00.000Z') / 1000);

test('POS AGID-S opens on terminal only and checks a fresh registry snapshot', async () => {
  const key = generatePosSecureKeyEntry({
    keyId: 'pos-k1',
    createdAt: '2026-06-07T00:00:00.000Z',
  });
  const token = await createAgidSecureToken({
    agid: 'JP05AV8TJGH8',
    key: Buffer.from(key.keyMaterial, 'hex'),
    keyId: key.keyId,
    exp: EXP,
    purpose: 'pos',
    now: NOW,
  });

  const result = await openAgidSecureForPos({
    token: buildPosNfcPayload(token, { tagId: 'secure-tag' }),
    keyRing: [key],
    channel: 'manual',
    registry: {
      registryId: 'test-registry',
      version: '2026.06',
      checkedAt: '2026-06-07T00:00:00.000Z',
      freshUntil: '2026-06-07T00:10:00.000Z',
    },
    now: Date.parse('2026-06-07T00:01:00.000Z'),
  });

  assert.equal(result.ok, true);
  assert.equal(result.channel, 'nfc');
  assert.equal(result.payload.agid, 'JP05AV8TJGH8');
  assert.equal(result.envelope.kid, 'pos-k1');
  assert.equal(result.registryDecision.valid, true);
});

test('POS AGID-S rejects used nullifiers without revealing the AGID', async () => {
  const key = generatePosSecureKeyEntry({
    keyId: 'pos-k2',
    createdAt: '2026-06-07T00:00:00.000Z',
  });
  const token = await createAgidSecureToken({
    agid: 'JP05AV8TJGH8',
    key: Buffer.from(key.keyMaterial, 'hex'),
    keyId: key.keyId,
    exp: EXP,
    purpose: 'pos',
    now: NOW,
  });
  const first = await openAgidSecureForPos({
    token,
    keyRing: [key],
    registry: {
      registryId: 'test-registry',
      version: '2026.06',
      checkedAt: '2026-06-07T00:00:00.000Z',
      freshUntil: '2026-06-07T00:10:00.000Z',
    },
    now: Date.parse('2026-06-07T00:01:00.000Z'),
  });
  assert.equal(first.ok, true);

  const registry = markAgidSecurePosUsed({
    registryId: 'test-registry',
    version: '2026.06',
    checkedAt: '2026-06-07T00:01:00.000Z',
    freshUntil: '2026-06-07T00:10:00.000Z',
  }, {
    jti: first.payload.jti,
    usedAt: '2026-06-07T00:02:00.000Z',
  });
  const decision = verifyAgidSecurePosRegistry({
    registry,
    keyId: key.keyId,
    jti: first.payload.jti,
    exp: first.payload.exp,
    now: Date.parse('2026-06-07T00:03:00.000Z'),
  });

  assert.equal(decision.valid, false);
  assert.deepEqual(decision.errors, ['token-already-used']);
});

test('POS key rotation retires the old key and creates an independent active key', () => {
  const key = generatePosSecureKeyEntry({
    keyId: 'pos-rotate',
    recipientId: 'courier-a',
    createdAt: '2026-06-07T00:00:00.000Z',
  });
  const rotation = rotatePosSecureKeyEntry(key, {
    newKeyId: 'pos-rotate-next',
    rotatedAt: '2026-06-08T00:00:00.000Z',
  });

  assert.equal(rotation.previous.status, 'retiring');
  assert.equal(rotation.next.status, 'active');
  assert.equal(rotation.next.rotatedFrom, 'pos-rotate');
  assert.equal(rotation.next.recipientId, 'courier-a');
  assert.notEqual(rotation.next.keyMaterial, key.keyMaterial);
});

test('POS recipient key plan avoids shared group keys', () => {
  const plan = buildPosRecipientKeyPlan({
    recipients: [
      { recipientId: 'courier-a', label: 'Courier A' },
      { recipientId: 'support-b', label: 'Support B' },
    ],
    createdAt: '2026-06-07T00:00:00.000Z',
  });

  assert.equal(plan.distributionMode, 'per-recipient-key');
  assert.equal(plan.sharedGroupKeyAllowed, false);
  assert.equal(plan.keys.length, 2);
  assert.notEqual(plan.keys[0].keyMaterial, plan.keys[1].keyMaterial);
});
