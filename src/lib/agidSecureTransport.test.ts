import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createAgidSecureToken,
  generateAgidSecureKey,
} from './agidSecureShare';
import { summarizeAgidSecureTransport } from './agidSecureTransport';
import { buildPosNfcPayload } from './posAcceptance';

const AGID = 'JP05AV8TJGH8';
const NOW = Date.parse('2026-06-20T00:00:00.000Z');
const EXP = Math.floor(Date.parse('2026-06-20T00:04:00.000Z') / 1000);

test('AGID-S transport summarizes QR/NFC intake without exposing the token or AGID', async () => {
  const key = generateAgidSecureKey();
  const token = await createAgidSecureToken({
    agid: AGID,
    key,
    keyId: 'field-k1',
    exp: EXP,
    purpose: 'humanitarian',
    now: NOW,
  });
  const summary = summarizeAgidSecureTransport({
    payload: buildPosNfcPayload(token, {
      tagId: 'nfc-tag-alpha',
      createdAt: '2026-06-20T00:00:10.000Z',
    }),
    channel: 'manual',
    highRiskMode: true,
  });

  assert.equal(summary.encrypted, true);
  assert.equal(summary.channel, 'nfc');
  assert.equal(summary.wrapperType, 'nfc-wrapper');
  assert.equal(summary.publicDecision, 'ok');
  assert.equal(summary.revealsAgid, false);
  assert.equal(summary.privacy.rawPayloadStored, false);
  assert.equal(summary.privacy.decryptedAgidStored, false);
  assert.ok(summary.requiredControls.includes('recipient-proof'));
  assert.match(summary.envelopeFingerprint ?? '', /^AGIDSF-/);
  assert.doesNotMatch(JSON.stringify(summary), new RegExp(`${AGID}|${token}|nfc-tag-alpha`));
});

test('AGID-S transport restricts high-risk scans that are not encrypted AGID-S', () => {
  const summary = summarizeAgidSecureTransport({
    payload: AGID,
    channel: 'qr',
    highRiskMode: true,
  });

  assert.equal(summary.encrypted, false);
  assert.equal(summary.publicDecision, 'restricted');
  assert.ok(summary.errors.includes('high-risk-requires-agid-s-transport'));
  assert.equal(summary.privacy.qrPayloadStored, false);
});

test('AGID-S transport requires review for manual high-risk AGID-S copy-paste', async () => {
  const key = generateAgidSecureKey();
  const token = await createAgidSecureToken({
    agid: AGID,
    key,
    keyId: 'field-k2',
    exp: EXP,
    purpose: 'evacuation',
    now: NOW,
  });
  const summary = summarizeAgidSecureTransport({
    payload: token,
    channel: 'manual',
    highRiskMode: true,
  });

  assert.equal(summary.encrypted, true);
  assert.equal(summary.channel, 'manual');
  assert.equal(summary.publicDecision, 'needs-review');
  assert.ok(summary.warnings.includes('high-risk-agid-s-should-use-qr-or-nfc-wrapper'));
});
