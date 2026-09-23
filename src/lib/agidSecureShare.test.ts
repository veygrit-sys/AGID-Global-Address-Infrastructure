import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AGID_SECURE_HIGH_RISK_MAX_TTL_SECONDS,
  AGID_SECURE_PREFIX,
  createAgidSecureToken,
  generateAgidSecureKey,
  isAgidSecureToken,
  openAgidSecureToken,
  readAgidSecureEnvelope,
  summarizeAgidSecureToken,
} from './agidSecureShare';

const AGID = 'JP05AV8TJGHD';
const NOW = Date.UTC(2026, 5, 7, 10, 0, 0);
const EXP = Math.floor(NOW / 1000) + 3600;

test('AGID-S encrypts a public AGID into a QR-safe token that reveals no AGID text', async () => {
  const key = generateAgidSecureKey();
  const token = await createAgidSecureToken({
    agid: AGID,
    key,
    keyId: 'relief-team-1',
    exp: Math.floor(NOW / 1000) + AGID_SECURE_HIGH_RISK_MAX_TTL_SECONDS,
    purpose: 'humanitarian',
    precision: 'coarse',
    now: NOW,
  });

  assert.ok(token.startsWith(AGID_SECURE_PREFIX));
  assert.equal(isAgidSecureToken(token), true);
  assert.equal(token.includes(AGID), false);

  const summary = summarizeAgidSecureToken(token);
  assert.deepEqual(summary, {
    kind: 'AGID-S',
    modelVersion: 'agid-secure-share-v1',
    algorithm: 'A256GCM',
    keyId: 'relief-team-1',
    encrypted: true,
    revealsAgid: false,
    containsPersonalData: false,
  });
});

test('AGID-S decrypts only with the correct key and expected purpose', async () => {
  const key = generateAgidSecureKey();
  const token = await createAgidSecureToken({
    agid: AGID,
    key,
    keyId: 'delivery-key',
    exp: EXP,
    purpose: 'delivery',
    now: NOW,
  });

  const opened = await openAgidSecureToken({
    token,
    key,
    expectedKeyId: 'delivery-key',
    expectedPurpose: 'delivery',
    now: NOW + 10_000,
  });

  assert.equal(opened.ok, true);
  assert.equal(opened.ok && opened.payload.agid, AGID);
  assert.equal(opened.ok && opened.payload.exp, EXP);
  assert.equal(opened.ok && opened.payload.purpose, 'delivery');
  assert.match(opened.ok ? opened.payload.jti : '', /^[0-9A-Z]{16,64}$/);

  const wrongPurpose = await openAgidSecureToken({
    token,
    key,
    expectedPurpose: 'humanitarian',
    now: NOW + 10_000,
  });
  assert.equal(wrongPurpose.ok, false);
  if (!wrongPurpose.ok) assert.equal(wrongPurpose.error, 'purpose-mismatch');
});

test('AGID-S creates different tokens for the same AGID because nonce and jti are random', async () => {
  const key = generateAgidSecureKey();
  const first = await createAgidSecureToken({
    agid: AGID,
    key,
    keyId: 'k1',
    exp: EXP,
    now: NOW,
  });
  const second = await createAgidSecureToken({
    agid: AGID,
    key,
    keyId: 'k1',
    exp: EXP,
    now: NOW,
  });

  assert.notEqual(first, second);
  assert.notDeepEqual(readAgidSecureEnvelope(first), readAgidSecureEnvelope(second));
});

test('AGID-S rejects wrong keys, wrong key ids, expired tokens, and tampering', async () => {
  const key = generateAgidSecureKey();
  const wrongKey = generateAgidSecureKey();
  const token = await createAgidSecureToken({
    agid: AGID,
    key,
    keyId: 'k1',
    exp: EXP,
    now: NOW,
  });

  const wrongKeyResult = await openAgidSecureToken({ token, key: wrongKey, now: NOW + 1_000 });
  assert.equal(wrongKeyResult.ok, false);
  assert.equal(wrongKeyResult.ok ? '' : wrongKeyResult.error, 'decrypt-failed');

  const wrongKeyId = await openAgidSecureToken({
    token,
    key,
    expectedKeyId: 'other-key',
    now: NOW + 1_000,
  });
  assert.equal(wrongKeyId.ok, false);
  assert.equal(wrongKeyId.ok ? '' : wrongKeyId.error, 'key-id-mismatch');

  const expired = await openAgidSecureToken({ token, key, now: (EXP + 1) * 1000 });
  assert.equal(expired.ok, false);
  assert.equal(expired.ok ? '' : expired.error, 'expired');

  const tampered = `${token.slice(0, -1)}${token.endsWith('0') ? '1' : '0'}`;
  const tamperedResult = await openAgidSecureToken({ token: tampered, key, now: NOW + 1_000 });
  assert.equal(tamperedResult.ok, false);
});

test('AGID-S refuses invalid AGIDs and overlong permanent sharing windows', async () => {
  const key = generateAgidSecureKey();

  await assert.rejects(
    () => createAgidSecureToken({
      agid: 'contains-room-101',
      key,
      keyId: 'k1',
      exp: EXP,
      now: NOW,
    }),
    /valid public AGID/,
  );

  await assert.rejects(
    () => createAgidSecureToken({
      agid: AGID,
      key,
      keyId: 'k1',
      exp: Math.floor(NOW / 1000) + 60 * 60 * 24 * 365,
      now: NOW,
    }),
    /maximum TTL/,
  );
});

test('AGID-S high-risk purposes require coarse precision and short TTL', async () => {
  const key = generateAgidSecureKey();
  const exp = Math.floor(NOW / 1000) + AGID_SECURE_HIGH_RISK_MAX_TTL_SECONDS;
  const token = await createAgidSecureToken({
    agid: AGID,
    key,
    keyId: 'shelter-team-1',
    exp,
    purpose: 'domestic-violence',
    now: NOW,
  });
  const opened = await openAgidSecureToken({
    token,
    key,
    expectedPurpose: 'domestic-violence',
    now: NOW + 1_000,
  });

  assert.equal(opened.ok, true);
  assert.equal(opened.ok && opened.payload.precision, 'coarse');

  await assert.rejects(
    () => createAgidSecureToken({
      agid: AGID,
      key,
      keyId: 'shelter-team-1',
      exp,
      purpose: 'refugee-support',
      precision: 'standard',
      now: NOW,
    }),
    /high-risk sharing requires coarse precision/,
  );

  await assert.rejects(
    () => createAgidSecureToken({
      agid: AGID,
      key,
      keyId: 'shelter-team-1',
      exp: Math.floor(NOW / 1000) + AGID_SECURE_HIGH_RISK_MAX_TTL_SECONDS + 1,
      purpose: 'evacuation',
      precision: 'coarse',
      now: NOW,
    }),
    /maximum TTL/,
  );
});
