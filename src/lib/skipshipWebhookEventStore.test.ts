import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SKIPSHIP_WEBHOOK_EVENT_STORE_DEFAULT_TTL_DAYS,
  createInMemorySkipshipWebhookEventStore,
} from './skipshipWebhookEventStore';

test('in-memory Skipship webhook event store ACKs exact replays and rejects conflicting bodies', () => {
  const store = createInMemorySkipshipWebhookEventStore();
  const response = {
    status: 202,
    body: {
      ok: true,
      eventId: 'evt_tracking_synthetic_store_001',
      eventFingerprint: 'evtfp_0123456789abcdef01234567',
      rawAddressStored: false,
      productionTraffic: false,
    },
  };

  const stored = store.accept({
    eventId: 'evt_tracking_synthetic_store_001',
    bodyFingerprint: 'fingerprint_a',
    response,
    receivedAt: '2026-07-04T10:00:00.000Z',
    ttlDays: 30,
  });
  const replayed = store.accept({
    eventId: 'evt_tracking_synthetic_store_001',
    bodyFingerprint: 'fingerprint_a',
    receivedAt: '2026-07-04T10:05:00.000Z',
    response: {
      status: 202,
      body: {
        ok: true,
        eventId: 'evt_tracking_synthetic_store_001',
        eventFingerprint: 'evtfp_should_not_replace_cached_response',
      },
    },
  });
  const conflict = store.accept({
    eventId: 'evt_tracking_synthetic_store_001',
    bodyFingerprint: 'fingerprint_b',
    response,
    receivedAt: '2026-07-04T10:10:00.000Z',
  });

  assert.equal(stored.kind, 'stored');
  assert.equal(stored.response.status, 202);
  assert.deepEqual(stored.audit, {
    eventId: 'evt_tracking_synthetic_store_001',
    attemptCount: 1,
    firstSeenAt: '2026-07-04T10:00:00.000Z',
    lastSeenAt: '2026-07-04T10:00:00.000Z',
    expiresAt: '2026-08-03T10:00:00.000Z',
  });
  assert.equal(replayed.kind, 'replayed');
  assert.deepEqual(replayed.response.body, response.body);
  assert.equal(replayed.audit.attemptCount, 2);
  assert.equal(replayed.audit.firstSeenAt, '2026-07-04T10:00:00.000Z');
  assert.equal(replayed.audit.lastSeenAt, '2026-07-04T10:05:00.000Z');
  assert.equal(replayed.audit.expiresAt, '2026-08-03T10:00:00.000Z');
  assert.equal(SKIPSHIP_WEBHOOK_EVENT_STORE_DEFAULT_TTL_DAYS, 30);
  assert.equal(conflict.kind, 'conflict');
  assert.equal(conflict.response.status, 409);
  assert.equal(conflict.response.body.error, 'tracking_webhook_event_conflict');
  assert.equal(conflict.audit.attemptCount, 3);
  assert.equal(conflict.audit.lastSeenAt, '2026-07-04T10:10:00.000Z');
});

test('in-memory Skipship webhook event store applies the exported default TTL', () => {
  const store = createInMemorySkipshipWebhookEventStore();

  const stored = store.accept({
    eventId: 'evt_tracking_synthetic_store_default_ttl_001',
    bodyFingerprint: 'fingerprint_default_ttl',
    response: {
      status: 202,
      body: {
        ok: true,
        eventId: 'evt_tracking_synthetic_store_default_ttl_001',
        eventFingerprint: 'evtfp_default_ttl_synthetic_001',
        rawAddressStored: false,
        productionTraffic: false,
      },
    },
    receivedAt: '2026-07-04T10:00:00.000Z',
  });

  assert.equal(SKIPSHIP_WEBHOOK_EVENT_STORE_DEFAULT_TTL_DAYS, 30);
  assert.equal(stored.kind, 'stored');
  assert.equal(stored.audit.expiresAt, '2026-08-03T10:00:00.000Z');
  assert.deepEqual(store.pruneExpired('2026-08-03T09:59:59.000Z'), []);
  assert.deepEqual(store.pruneExpired('2026-08-03T10:00:00.000Z'), [
    'evt_tracking_synthetic_store_default_ttl_001',
  ]);
});

test('in-memory Skipship webhook event store prunes expired events', () => {
  const store = createInMemorySkipshipWebhookEventStore();
  const response = {
    status: 202,
    body: {
      ok: true,
      eventId: 'evt_tracking_synthetic_store_ttl_001',
      eventFingerprint: 'evtfp_abcdefabcdefabcdefabcdef',
      rawAddressStored: false,
      productionTraffic: false,
    },
  };

  store.accept({
    eventId: 'evt_tracking_synthetic_store_ttl_001',
    bodyFingerprint: 'fingerprint_ttl',
    response,
    receivedAt: '2026-07-04T10:00:00.000Z',
    ttlDays: 1,
  });

  assert.deepEqual(store.pruneExpired('2026-07-05T09:59:59.000Z'), []);
  assert.deepEqual(store.pruneExpired('2026-07-05T10:00:00.000Z'), ['evt_tracking_synthetic_store_ttl_001']);
  assert.deepEqual(store.pruneExpired('not-an-iso-date'), []);

  const storedAgain = store.accept({
    eventId: 'evt_tracking_synthetic_store_ttl_001',
    bodyFingerprint: 'fingerprint_ttl_after_prune',
    response,
    receivedAt: '2026-07-05T10:01:00.000Z',
    ttlDays: 1,
  });

  assert.equal(storedAgain.kind, 'stored');
  assert.equal(storedAgain.audit.attemptCount, 1);
  assert.equal(storedAgain.audit.firstSeenAt, '2026-07-05T10:01:00.000Z');
});

test('in-memory Skipship webhook event store returns redacted stable snapshots', () => {
  const store = createInMemorySkipshipWebhookEventStore();
  const response = {
    status: 202,
    body: {
      ok: true,
      eventFingerprint: 'evtfp_snapshot_should_not_expose_body',
      rawAddressStored: false,
      productionTraffic: false,
    },
  };

  store.accept({
    eventId: 'evt_tracking_synthetic_store_snapshot_b',
    bodyFingerprint: 'fingerprint_b_secret_to_store',
    response,
    receivedAt: '2026-07-04T10:00:00.000Z',
    ttlDays: 30,
  });
  store.accept({
    eventId: 'evt_tracking_synthetic_store_snapshot_a',
    bodyFingerprint: 'fingerprint_a_secret_to_store',
    response,
    receivedAt: '2026-07-04T10:01:00.000Z',
    ttlDays: 30,
  });
  store.accept({
    eventId: 'evt_tracking_synthetic_store_snapshot_a',
    bodyFingerprint: 'fingerprint_a_secret_to_store',
    response,
    receivedAt: '2026-07-04T10:02:00.000Z',
  });

  const snapshot = store.snapshot();
  const snapshotText = JSON.stringify(snapshot);

  assert.equal(store.size(), 2);
  assert.deepEqual(snapshot.map(entry => entry.eventId), [
    'evt_tracking_synthetic_store_snapshot_a',
    'evt_tracking_synthetic_store_snapshot_b',
  ]);
  assert.equal(snapshot[0].attemptCount, 2);
  assert.equal(snapshot[0].responseStatus, 202);
  assert.equal(snapshot[0].firstSeenAt, '2026-07-04T10:01:00.000Z');
  assert.equal(snapshot[0].lastSeenAt, '2026-07-04T10:02:00.000Z');
  assert.doesNotMatch(snapshotText, /fingerprint_[ab]_secret_to_store/);
  assert.doesNotMatch(snapshotText, /evtfp_snapshot_should_not_expose_body/);
  assert.doesNotMatch(snapshotText, /rawAddressStored|productionTraffic/);
});
