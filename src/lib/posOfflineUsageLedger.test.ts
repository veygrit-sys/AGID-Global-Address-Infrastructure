import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildPosOfflineUsageSyncEvent,
  buildPosOfflineUsageSyncItems,
  createPosOfflineUsageEntryFromReceipt,
  getPosOfflineUsedNullifiers,
  reconcilePosOfflineUsageSync,
  recordPosOfflineUsage,
  summarizePosOfflineUsageLedger,
} from './posOfflineUsageLedger';
import { createPosAcceptanceReceipt } from './posAcceptance';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
} from './registeredAddressQr';
import {
  buildShippingLabelQrPayload,
} from './shippingLabelQr';

function privateAddressPayload() {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Private Receiver',
      phone: '+81 90 0000 0000',
      street: '1-1 Chiyoda',
      city: 'Tokyo',
      postcode: '1000001',
    },
    {
      mode: 'ADDRESS',
      agid: 'JP05AV8TJGH8',
      now: '2026-06-07T00:00:00.000Z',
    },
  );
  return buildRegisteredAddressQrPayload(record, { privacy: 'full' });
}

function shippingLabelPayload() {
  return buildShippingLabelQrPayload({
    waybillId: 'offline-waybill-001',
    jti: 'ABCDEFGHJKMNPQRST0123456',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'offline-proof-code',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:15:00.000Z',
  });
}

function recipientReceipt(requestId: string, now: string, payload = shippingLabelPayload()) {
  return createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    scanRole: 'recipient',
    recipientProofCode: 'offline-proof-code',
    terminalId: 'field-pos-1',
    operatorId: 'field-worker-a',
  }, {
    now,
    requestId,
  });
}

test('offline usage ledger records recipient-completed nullifiers without raw address material', () => {
  const receipt = recipientReceipt('offline-ledger-1', '2026-06-07T00:01:00.000Z');
  const entry = createPosOfflineUsageEntryFromReceipt(receipt);

  assert.ok(entry);
  assert.match(entry.nullifier, /^SLN-/);
  assert.match(entry.waybillAlias ?? '', /^WBA-/);
  assert.match(entry.waybillCommitment ?? '', /^WBC-/);
  assert.match(entry.addressReferenceCommitment ?? '', /^ARC-/);
  assert.equal(entry.syncStatus, 'pending-sync');
  assert.deepEqual(getPosOfflineUsedNullifiers([entry]), [entry.nullifier]);
  assert.doesNotMatch(JSON.stringify(entry), /Private Receiver|\+81 90|1-1 Chiyoda|JP05AV8TJGH8|offline-waybill-001|Tokyo|1000001|offline-proof-code/i);
});

test('offline usage ledger turns local duplicate nullifiers into audit-required conflicts', () => {
  const payload = shippingLabelPayload();
  const first = recipientReceipt('offline-ledger-local-1', '2026-06-07T00:01:00.000Z', payload);
  const firstWrite = recordPosOfflineUsage([], first, {
    now: '2026-06-07T00:01:05.000Z',
  });
  assert.equal(firstWrite.recorded, true);
  assert.equal(firstWrite.conflict, false);

  const second = recipientReceipt('offline-ledger-local-2', '2026-06-07T00:02:00.000Z', payload);
  const duplicate = recordPosOfflineUsage(firstWrite.entries, second, {
    now: '2026-06-07T00:02:05.000Z',
  });

  assert.equal(duplicate.recorded, false);
  assert.equal(duplicate.conflict, true);
  assert.equal(duplicate.auditRequired, true);
  assert.equal(duplicate.entries.length, 1);
  assert.equal(duplicate.entries[0].syncStatus, 'audit-required');
  assert.equal(duplicate.entries[0].conflictReason, 'local-nullifier-duplicate');
  assert.equal(duplicate.entries[0].conflictingReceiptId, second.receiptId);
  assert.deepEqual(summarizePosOfflineUsageLedger(duplicate.entries), {
    modelVersion: 'agid-pos-offline-usage-ledger-v1',
    total: 1,
    pendingSync: 0,
    synced: 0,
    auditRequired: 1,
    conflictTails: [duplicate.entries[0].nullifier.slice(-10)],
    rawPayloadStored: false,
    rawAddressStored: false,
    rawAgidStored: false,
    rawWaybillIdStored: false,
    rawProofStored: false,
  });
});

test('offline usage ledger reconciles later server sync conflicts as audit-required', () => {
  const receipt = recipientReceipt('offline-ledger-sync-1', '2026-06-07T00:01:00.000Z');
  const local = recordPosOfflineUsage([], receipt, {
    now: '2026-06-07T00:01:05.000Z',
  });
  const items = buildPosOfflineUsageSyncItems(local.entries);
  assert.equal(items.length, 1);
  assert.equal(items[0].action, 'mark-shipping-label-nullifier-used');

  const event = buildPosOfflineUsageSyncEvent({
    item: items[0],
    outcome: 'conflict',
    errors: ['shipping-label-nullifier-already-used'],
    now: '2026-06-07T00:05:00.000Z',
  });
  const reconciled = reconcilePosOfflineUsageSync(local.entries, {
    modelVersion: 'agid-pos-offline-usage-ledger-v1',
    accepted: 0,
    rejected: 0,
    conflicts: 1,
    auditRequired: 1,
    events: [event],
  }, {
    now: '2026-06-07T00:05:30.000Z',
  });

  assert.equal(reconciled.length, 1);
  assert.equal(reconciled[0].syncStatus, 'audit-required');
  assert.equal(reconciled[0].conflictReason, 'server-nullifier-conflict');
  assert.equal(reconciled[0].serverEventId, event.eventId);
  assert.doesNotMatch(JSON.stringify(reconciled), /Private Receiver|1-1 Chiyoda|offline-waybill-001|offline-proof-code/i);
});
