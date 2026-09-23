import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
buildSyncQueueRecord,
getFlushableSyncQueueRecords,
getSyncBackoffMs,
getSyncQueueHybridPolicy,
markSyncQueueRecordFailed,
markSyncQueueRecordSending,
} from './syncQueue';
import { buildRegisteredAddressRecord } from './registeredAddressQr';

test('builds stable local-first sync queue records', () => {
  const record = buildSyncQueueRecord({
    entityType: 'registeredAddress',
    entityId: ' JP05 AV8 ',
    action: 'update',
    payload: { address: 'Tokyo' },
    now: 1000,
  });

  assert.equal(record.id, 'registeredAddress:JP05-AV8:update:1000');
  assert.equal(record.status, 'pending');
  assert.equal(record.attemptCount, 0);
  assert.deepEqual(record.payload, { address: 'Tokyo' });
  assert.equal(record.audit?.layer, 'AGID');
  assert.equal(record.audit?.operation, 'sync');
  assert.equal(record.audit?.surface, 'local-device');
  assert.equal(record.audit?.outcome, 'allowed');
});

test('flush queue is offline aware and respects retry backoff', () => {
  const ready = buildSyncQueueRecord({
    entityType: 'savedAgid',
    entityId: 'A',
    action: 'create',
    now: 1000,
  });
  const delayed = markSyncQueueRecordFailed(ready, 'network', 2000);
  const sending = markSyncQueueRecordSending({
    ...ready,
    id: 'savedAgid:B:create:1000',
    entityId: 'B',
  }, 3000);

  assert.deepEqual(getFlushableSyncQueueRecords([ready], { online: false, now: 5000 }), []);
  assert.deepEqual(
    getFlushableSyncQueueRecords([delayed, ready, sending], { online: true, now: 2500 }).map(record => record.id),
    [ready.id],
  );
  assert.equal(getFlushableSyncQueueRecords([delayed], { online: true, now: delayed.nextAttemptAt }).length, 1);
});

test('sync backoff is capped for repeated failures', () => {
  assert.equal(getSyncBackoffMs(0), 1000);
  assert.equal(getSyncBackoffMs(2), 4000);
  assert.equal(getSyncBackoffMs(99), 5 * 60 * 1000);
});

test('sync queue exposes the central/device hybrid policy for each entity type', () => {
  assert.equal(getSyncQueueHybridPolicy('savedAgid').centralRole, 'none');
  assert.equal(getSyncQueueHybridPolicy('savedAgid').identityLayer, 'AGID');
  assert.equal(getSyncQueueHybridPolicy('registeredAddress').centralRole, 'optional-private-sync');
  assert.equal(getSyncQueueHybridPolicy('aoid').identityLayer, 'AOID');
  assert.equal(getSyncQueueHybridPolicy('settings').privacyScope, 'settings');
  assert.equal(getSyncQueueHybridPolicy('posShipment').centralRole, 'optional-private-sync');
  assert.equal(getSyncQueueHybridPolicy('posDeviceDiagnostic').privacyScope, 'settings');
});

test('AOID sync queue redacts owner-only address fields before network flush', () => {
  const aoid = buildRegisteredAddressRecord(
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

  const record = buildSyncQueueRecord({
    entityType: 'aoid',
    entityId: aoid.id,
    action: 'update',
    payload: aoid,
    now: 1000,
  });

  const serialized = JSON.stringify(record.payload);
  assert.match(serialized, /requiresEncryptedPayload/);
  assert.doesNotMatch(serialized, /Private Receiver|2801|\+81 3|35\.66|139\.73/);
  assert.equal(record.audit?.layer, 'AOID');
  assert.equal(record.audit?.payloadClass, 'aoid-public-reference');
  assert.equal(record.audit?.outcome, 'allowed');
  assert.doesNotMatch(JSON.stringify(record.audit), /Private Receiver|2801|\+81 3|35\.66|139\.73/);
});

test('AOID encrypted sync target accepts only encrypted envelopes', () => {
  const aoid = buildRegisteredAddressRecord(
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

  assert.throws(
    () => buildSyncQueueRecord({
      entityType: 'aoid',
      entityId: aoid.id,
      action: 'update',
      payload: aoid,
      targetSurface: 'encrypted-sync',
      now: 1000,
    }),
    /encrypted sync requires/i,
  );
});

test('AOID sync queue rejects malformed encrypted envelopes instead of sending weak payloads', () => {
  assert.throws(
    () => buildSyncQueueRecord({
      entityType: 'aoid',
      entityId: '05AV8TJGH8QZ6M2R',
      action: 'update',
      payload: {
        type: 'AOID_SYNC_ENVELOPE',
        id: '05AV8TJGH8QZ6M2R',
        encryptedPayload: '{"room":"2801"}',
        encryption: 'owner-device',
      },
      now: 1000,
    }),
    /invalid aoid encrypted sync envelope/i,
  );
});
