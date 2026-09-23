import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  clearAppDatabasePrivateData,
  EMPTY_APP_DATABASE_SNAPSHOT,
  isClientDatabaseSupported,
  loadAppDatabaseSnapshot,
  mergeRecordsById,
  sanitizeDatabaseRecords,
  toDeliveryPosReceiptRecord,
} from './appDatabase';
import { createPosAcceptanceReceipt } from './posAcceptance';

test('database record merge prefers IndexedDB records and backfills local fallback records', () => {
  const merged = mergeRecordsById<{ id?: unknown; address?: string; savedAt?: string }>(
    [
      { id: 'JP05AV8TJGH8', address: 'DB address', savedAt: '2026-06-01T00:00:00.000Z' },
      { id: 'US00TEST0001', address: 'US DB address' },
    ],
    [
      { id: 'JP05AV8TJGH8', address: 'old localStorage address' },
      { id: 'VN00TEST0001', address: 'localStorage only address' },
    ],
  );

  assert.deepEqual(merged.map(record => record.id), ['JP05AV8TJGH8', 'US00TEST0001', 'VN00TEST0001']);
  assert.equal(merged[0].address, 'DB address');
  assert.equal(merged[2].address, 'localStorage only address');
});

test('database record sanitizer ignores invalid records without an id', () => {
  assert.deepEqual(
    sanitizeDatabaseRecords([
      { id: 'A1', name: 'valid' },
      { id: '' },
      { name: 'missing id' },
      null,
      'bad',
    ]),
    [{ id: 'A1', name: 'valid' }],
  );
});

test('empty database snapshot is stable and IndexedDB support is environment-gated', () => {
  assert.deepEqual(EMPTY_APP_DATABASE_SNAPSHOT, {
    savedAgids: [],
    savedQrs: [],
    registeredAddresses: [],
    aoids: [],
    syncQueue: [],
    posShipments: [],
    posReceipts: [],
    posAuditCases: [],
    posHandoffs: [],
    posDeviceDiagnostics: [],
    posCrossBorderDeclarations: [],
    posOfflineUsageLedger: [],
  });
  assert.equal(isClientDatabaseSupported(), typeof globalThis.indexedDB !== 'undefined');
});

test('POS receipt database records use receipt id and force privacy-safe storage flags', () => {
  const receipt = createPosAcceptanceReceipt({
    payload: 'JP05AV8TJGH8',
    channel: 'manual',
    terminalId: 'store-001',
  }, {
    now: '2026-06-12T00:00:00.000Z',
    requestId: 'pos-db-receipt',
  });
  const record = toDeliveryPosReceiptRecord(receipt, { shipmentId: 'SHIP-001' });

  assert.equal(record.id, receipt.receiptId);
  assert.equal(record.shipmentId, 'SHIP-001');
  assert.equal(record.rawPayloadStored, false);
  assert.equal(record.rawAddressStored, false);
  assert.equal(record.decryptedAgidStored, false);
  assert.equal(record.rawAgidSecureStored, false);
  assert.doesNotMatch(JSON.stringify(record), /agid:address:/);
});

test('private data clear is a safe no-op when IndexedDB is unavailable', async () => {
  if (typeof globalThis.indexedDB !== 'undefined') return;
  assert.equal(await clearAppDatabasePrivateData(), false);
});

test('fallback AOID records are normalized when IndexedDB is unavailable', async () => {
  if (typeof globalThis.indexedDB !== 'undefined') return;

  const snapshot = await loadAppDatabaseSnapshot({
    aoids: [
      {
        type: 'AOID',
        id: '05AV8TJGH8QZ6M2R',
        name: 'Private Receiver',
        address: '2-2 Roppongi',
        registeredAt: '2026-06-03T00:00:00.000Z',
      },
      {
        type: 'AOID',
        id: 'bad id',
        name: 'Invalid Receiver',
        address: 'Invalid',
        registeredAt: '2026-06-03T00:00:00.000Z',
      },
    ],
  });

  assert.equal(snapshot.aoids.length, 1);
  assert.equal(snapshot.aoids[0].id, '05AV8TJGH8QZ6M2R');
  assert.equal(snapshot.aoids[0].isAoid, true);
  assert.equal(snapshot.aoids[0].ownerManaged, true);
  assert.equal(snapshot.aoids[0].storageMode, 'device-local');
});

test('fallback POS tables are normalized when IndexedDB is unavailable', async () => {
  if (typeof globalThis.indexedDB !== 'undefined') return;

  const snapshot = await loadAppDatabaseSnapshot({
    posShipments: [
      {
        id: 'SHIP-001',
        kind: 'cross-border',
        status: 'review',
        privacyMode: 'metadata-only',
        originCountry: 'JP',
        destinationCountry: 'US',
        rawPayloadStored: true as false,
        rawAddressStored: true as false,
        decryptedAgidStored: true as false,
        rawAgidSecureStored: true as false,
        createdAt: '2026-06-12T00:00:00.000Z',
        updatedAt: '2026-06-12T00:01:00.000Z',
      },
    ],
    posCrossBorderDeclarations: [
      {
        id: 'XBD-001',
        shipmentId: 'SHIP-001',
        status: 'review',
        originCountry: 'JP',
        destinationCountry: 'US',
        hsCode: '950300',
        currency: 'USD',
        declaredValue: 120,
        evidenceSourceIds: ['datasets-harmonized-system'],
        advisoryOnly: false as true,
        rawPayloadStored: true as false,
        rawAddressStored: true as false,
        decryptedAgidStored: true as false,
        rawAgidSecureStored: true as false,
        createdAt: '2026-06-12T00:00:00.000Z',
        updatedAt: '2026-06-12T00:01:00.000Z',
      },
    ],
    posOfflineUsageLedger: [
      {
        id: 'POU-001',
        modelVersion: 'agid-pos-offline-usage-ledger-v1',
        nullifier: 'SLN-ABCDEF0123456789ABCDEF0123456789ABCDEF01',
        receiptId: 'POS-001',
        terminalId: 'field-pos-1',
        createdAt: '2026-06-12T00:00:00.000Z',
        updatedAt: '2026-06-12T00:01:00.000Z',
        syncStatus: 'pending-sync',
        rawPayloadStored: true as false,
        rawAddressStored: true as false,
        rawAgidStored: true as false,
        rawWaybillIdStored: true as false,
        rawProofStored: true as false,
        decryptedAgidStored: true as false,
        rawAgidSecureStored: true as false,
      },
    ],
  });

  assert.equal(snapshot.posShipments.length, 1);
  assert.equal(snapshot.posShipments[0].rawPayloadStored, false);
  assert.equal(snapshot.posShipments[0].rawAddressStored, false);
  assert.equal(snapshot.posShipments[0].decryptedAgidStored, false);
  assert.equal(snapshot.posShipments[0].rawAgidSecureStored, false);
  assert.equal(snapshot.posCrossBorderDeclarations[0].advisoryOnly, true);
  assert.deepEqual(snapshot.posCrossBorderDeclarations[0].evidenceSourceIds, ['datasets-harmonized-system']);
  assert.equal(snapshot.posOfflineUsageLedger.length, 1);
  assert.equal(snapshot.posOfflineUsageLedger[0].rawPayloadStored, false);
  assert.equal(snapshot.posOfflineUsageLedger[0].rawAddressStored, false);
  assert.equal(snapshot.posOfflineUsageLedger[0].decryptedAgidStored, false);
  assert.equal(snapshot.posOfflineUsageLedger[0].rawAgidSecureStored, false);
  assert.equal(snapshot.posOfflineUsageLedger[0].rawAgidStored, false);
  assert.equal(snapshot.posOfflineUsageLedger[0].rawWaybillIdStored, false);
  assert.equal(snapshot.posOfflineUsageLedger[0].rawProofStored, false);
});
