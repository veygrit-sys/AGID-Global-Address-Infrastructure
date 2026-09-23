import assert from 'node:assert/strict';
import test from 'node:test';

import { createInMemorySkipshipWebhookEventStore } from './skipshipWebhookEventStore';
import { buildSkipshipMerchantConsoleWebhookLedger } from './skipshipMerchantConsoleWebhookLedger';

test('Skipship Merchant Console webhook ledger uses a redacted local fixture by default', () => {
  const ledger = buildSkipshipMerchantConsoleWebhookLedger();

  assert.equal(ledger.source.mode, 'fixture');
  assert.equal(ledger.source.localOnly, true);
  assert.equal(ledger.source.productionTraffic, false);
  assert.equal(ledger.totals.events, 3);
  assert.equal(ledger.totals.retrying, 1);
  assert.equal(ledger.totals.expired, 0);
  assert.ok(ledger.rows.every(row => row.safeRefs.eventRef.startsWith('webhook_event:')));
});

test('Skipship Merchant Console webhook ledger can project an event store snapshot without exposing private material', () => {
  const store = createInMemorySkipshipWebhookEventStore();
  store.accept({
    eventId: 'evt_tracking_store_snapshot_console',
    bodyFingerprint: 'bodyFingerprint_private_value',
    receivedAt: '2026-07-04T10:00:00.000Z',
    response: {
      status: 202,
      body: {
        accepted: true,
        rawTrackingPayloadValue: 'blocked',
        recipient_phone_value: 'blocked',
      },
    },
  });

  const ledger = buildSkipshipMerchantConsoleWebhookLedger({
    snapshot: store.snapshot(),
    nowIso: '2026-07-04T11:00:00.000Z',
  });
  const text = JSON.stringify(ledger);

  assert.equal(ledger.source.mode, 'storeSnapshot');
  assert.equal(ledger.totals.events, 1);
  assert.equal(ledger.rows[0]?.safeRefs.eventRef, 'webhook_event:evt_tracking_store_snapshot_console');
  assert.ok(ledger.source.blockedMaterial.includes('bodyFingerprint'));
  assert.match(ledger.privacyBoundary, /raw payloads, body fingerprints, recipient contacts, addresses, carrier secrets, and proof witnesses stay out/);
  assert.doesNotMatch(text, /bodyFingerprint_private_value|rawTrackingPayloadValue|recipient_phone_value/);
});
