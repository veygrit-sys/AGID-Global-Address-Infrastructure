import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_INTENT_MODEL_VERSION,
  buildAddressIntent,
  createInMemoryAddressIntentStore,
  listAddressIntentCapabilities,
} from './addressIntent';

test('builds a delivery intent that asks for address input first', () => {
  const intent = buildAddressIntent({
    purpose: 'delivery',
    mode: 'local',
    createdAt: '2026-06-17T00:00:00.000Z',
  });

  assert.equal(intent.modelVersion, ADDRESS_INTENT_MODEL_VERSION);
  assert.match(intent.id, /^AIT-[A-F0-9]{24}$/);
  assert.equal(intent.status, 'requires_input');
  assert.equal(intent.nextAction, 'edit_address');
  assert.deepEqual(intent.missingEvidence.map(group => group.group), ['address-reference', 'address-quality']);
  assert.equal(intent.privacy.plaintextAddressStored, false);
});

test('verifies a delivery intent after postal and reverse-geocode evidence', () => {
  const intent = buildAddressIntent({
    purpose: 'delivery',
    mode: 'server',
    evidence: [
      { source: 'address-form', safeFingerprint: 'addr-cmt-1' },
      { source: 'postal-api', status: 'passed', confidence: 0.92, safeFingerprint: 'postal-cmt-1' },
      { source: 'agid-reverse-geocode', status: 'passed', confidence: 0.88, safeFingerprint: 'revgeo-cmt-1' },
    ],
  });

  assert.equal(intent.status, 'verified');
  assert.equal(intent.nextAction, 'issue_waybill');
  assert.deepEqual(intent.missingEvidence, []);
});

test('asks for recipient proof only when the workflow requires it', () => {
  const intent = buildAddressIntent({
    purpose: 'delivery',
    mode: 'local',
    requiresRecipientProof: true,
    evidence: [
      { source: 'address-form', safeFingerprint: 'addr-cmt-1' },
      { source: 'postal-api', safeFingerprint: 'postal-cmt-1' },
    ],
  });

  assert.equal(intent.status, 'requires_input');
  assert.equal(intent.nextAction, 'request_recipient_proof');
  assert.deepEqual(intent.missingEvidence.map(group => group.group), ['recipient-control']);
});

test('marks pending evidence as verifying', () => {
  const intent = buildAddressIntent({
    purpose: 'identity',
    mode: 'zk',
    evidence: [
      { source: 'zk-address-proof', status: 'pending', safeFingerprint: 'zk-cmt-1' },
    ],
  });

  assert.equal(intent.status, 'verifying');
  assert.equal(intent.nextAction, 'wait_for_verification');
});

test('requires review when required evidence fails without an accepted alternative', () => {
  const intent = buildAddressIntent({
    purpose: 'customs',
    mode: 'server',
    evidence: [
      { source: 'address-form', safeFingerprint: 'addr-cmt-1' },
      { source: 'postal-api', status: 'failed', code: 'postal-not-found', safeFingerprint: 'postal-cmt-1' },
      { source: 'customs-data', safeFingerprint: 'trade-cmt-1' },
    ],
  });

  assert.equal(intent.status, 'requires_review');
  assert.equal(intent.nextAction, 'manual_review');
});

test('expires stale address intents', () => {
  const intent = buildAddressIntent({
    purpose: 'delivery',
    expiresAt: '2000-01-01T00:00:00.000Z',
    evidence: [
      { source: 'address-form', safeFingerprint: 'addr-cmt-1' },
      { source: 'postal-api', safeFingerprint: 'postal-cmt-1' },
    ],
  });

  assert.equal(intent.status, 'expired');
  assert.equal(intent.nextAction, 'none');
  assert.ok(intent.errors.includes('address-intent-expired'));
});

test('strips private evidence fields from the public intent surface', () => {
  const intent = buildAddressIntent({
    purpose: 'delivery',
    evidence: [
      {
        source: 'address-form',
        safeFingerprint: 'addr-cmt-1',
        rawAddress: '1-2-3 private street',
        phoneNumber: '+81-00-0000-0000',
      } as any,
      { source: 'postal-api', safeFingerprint: 'postal-cmt-1' },
    ],
  });
  const serialized = JSON.stringify(intent);

  assert.equal(intent.status, 'requires_review');
  assert.doesNotMatch(serialized, /private street|\+81-00|rawAddress|phoneNumber/);
  assert.ok(intent.errors.includes('raw-private-evidence-is-not-stored-by-address-intents'));
});

test('reports capabilities for clients and POS settings', () => {
  const capabilities = listAddressIntentCapabilities();

  assert.equal(capabilities.modelVersion, ADDRESS_INTENT_MODEL_VERSION);
  assert.ok(capabilities.statuses.includes('requires_review'));
  assert.ok(capabilities.purposes.includes('customs'));
  assert.ok(capabilities.modes.includes('full'));
  assert.ok(capabilities.evidenceSources.includes('carrier-scan'));
  assert.ok(capabilities.nextActions.includes('request_recipient_proof'));
  assert.equal(capabilities.privacy.rawAoidStored, false);
});

test('stores and updates intents in memory without changing the public id', () => {
  const store = createInMemoryAddressIntentStore();
  const created = store.create({
    purpose: 'delivery',
    evidence: [{ source: 'address-form', safeFingerprint: 'addr-cmt-1' }],
  });
  const updated = store.update(created.id, {
    appendEvidence: true,
    evidence: [{ source: 'postal-api', safeFingerprint: 'postal-cmt-1' }],
  });

  assert.ok(updated);
  assert.equal(updated.id, created.id);
  assert.equal(updated.status, 'verified');
  assert.equal(store.get(created.id)?.status, 'verified');
  assert.equal(store.listRecent()[0].id, created.id);
});
