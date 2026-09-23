import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSkipshipWebhookLedgerView } from './skipshipWebhookLedgerView';
import type { SkipshipWebhookEventStoreSnapshotEntry } from './skipshipWebhookEventStore';

const entries: SkipshipWebhookEventStoreSnapshotEntry[] = [
  {
    eventId: 'evt_tracking_synthetic_ledger_ok',
    attemptCount: 1,
    responseStatus: 202,
    firstSeenAt: '2026-07-04T10:00:00.000Z',
    lastSeenAt: '2026-07-04T10:00:00.000Z',
    expiresAt: '2026-08-03T10:00:00.000Z',
  },
  {
    eventId: 'evt_tracking_synthetic_ledger_stale',
    attemptCount: 6,
    responseStatus: 202,
    firstSeenAt: '2026-07-04T10:00:00.000Z',
    lastSeenAt: '2026-07-04T10:15:00.000Z',
    expiresAt: '2026-08-03T10:00:00.000Z',
  },
  {
    eventId: 'evt_tracking_synthetic_ledger_retrying',
    attemptCount: 12,
    responseStatus: 500,
    firstSeenAt: '2026-07-04T10:00:00.000Z',
    lastSeenAt: '2026-07-04T10:30:00.000Z',
    expiresAt: '2026-08-03T10:00:00.000Z',
  },
  {
    eventId: 'evt_tracking_synthetic_ledger_expired',
    attemptCount: 2,
    responseStatus: 202,
    firstSeenAt: '2026-06-01T10:00:00.000Z',
    lastSeenAt: '2026-06-02T10:00:00.000Z',
    expiresAt: '2026-07-01T10:00:00.000Z',
  },
];

test('Skipship webhook ledger view classifies redacted snapshot rows for Merchant Console', () => {
  const view = buildSkipshipWebhookLedgerView(entries, '2026-07-04T11:00:00.000Z');
  const byId = new Map(view.rows.map(row => [row.eventId, row]));

  assert.equal(view.totals.events, 4);
  assert.equal(view.totals.retrying, 1);
  assert.equal(view.totals.expired, 1);
  assert.equal(byId.get('evt_tracking_synthetic_ledger_ok')?.status, 'ok');
  assert.equal(byId.get('evt_tracking_synthetic_ledger_stale')?.status, 'stale');
  assert.equal(byId.get('evt_tracking_synthetic_ledger_retrying')?.status, 'retrying');
  assert.equal(byId.get('evt_tracking_synthetic_ledger_expired')?.status, 'expired');
  assert.equal(byId.get('evt_tracking_synthetic_ledger_ok')?.safeRefs.eventRef, 'webhook_event:evt_tracking_synthetic_ledger_ok');
});

test('Skipship webhook ledger view does not expose payloads, fingerprints, or private delivery material', () => {
  const view = buildSkipshipWebhookLedgerView(entries, '2026-07-04T11:00:00.000Z');
  const text = JSON.stringify(view);

  assert.match(view.privacyBoundary, /raw payloads, body fingerprints, recipient contacts, addresses, carrier secrets, and proof witnesses stay out/);
  assert.ok(view.rows.every(row => row.blockedMaterial.includes('bodyFingerprint')));
  assert.doesNotMatch(text, /bodyFingerprint_[a-z0-9_:-]+/i);
  assert.doesNotMatch(text, /rawAddressStored|productionTraffic|rawTrackingPayloadValue/);
  assert.doesNotMatch(text, /recipient_phone_value|carrier_secret_value|proof_witness_value/i);
});
