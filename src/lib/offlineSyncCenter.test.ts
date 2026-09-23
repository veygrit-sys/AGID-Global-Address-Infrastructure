import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildOfflineSyncCenter,
  buildOfflineSyncItem,
  listOfflineSyncCenterCapabilities,
  validateOfflineSyncCenterPayloadIsSafe,
} from './offlineSyncCenter';

test('Offline Sync Center builds POS, Field, and Locker queue state from refs and counts only', () => {
  const center = buildOfflineSyncCenter({
    generatedAt: '2026-06-20T00:00:00.000Z',
    selectedItemId: 'OSC-POS-001',
    items: [
      {
        itemId: 'OSC-POS-001',
        surface: 'pos',
        title: 'POS used nullifier queue',
        status: 'pending-sync',
        deviceRef: 'terminal_ref_POS07',
        queueRef: 'queue_ref_pos_07',
        syncRef: 'registry_sync_ref_pos',
        pendingCount: 3,
        conflictCount: 0,
        usedNullifierCount: 12,
        usedNullifierTails: ['A1B2C3D4', 'F9E8D7C6'],
        evidenceRefs: ['EV-pos-ledger-root'],
        actionRefs: ['sync-nullifier-used'],
      },
      {
        itemId: 'OSC-FIELD-002',
        surface: 'field',
        title: 'Field deferred sync conflict',
        status: 'conflict',
        deviceRef: 'field_device_ref_12',
        queueRef: 'queue_ref_field_deferred',
        syncRef: 'server_sync_ref_field',
        pendingCount: 1,
        conflictCount: 1,
        usedNullifierCount: 4,
        usedNullifierTails: ['Q8W7E6R5'],
        evidenceRefs: ['EV-field-offline-queue'],
        actionRefs: ['review-conflict'],
      },
      {
        itemId: 'OSC-LOCKER-003',
        surface: 'locker',
        title: 'Locker protocol queue',
        status: 'synced',
        deviceRef: 'locker_node_ref_01',
        queueRef: 'queue_ref_locker_mqtt_http_modbus',
        syncRef: 'sync_ref_locker_gateway',
        pendingCount: 0,
        conflictCount: 0,
        usedNullifierCount: 7,
        usedNullifierTails: ['LOCKER09'],
        evidenceRefs: ['EV-locker-protocol-root'],
        actionRefs: ['ack-locker-sync'],
      },
    ],
  });

  assert.equal(center.items.length, 3);
  assert.equal(center.totals.pos, 1);
  assert.equal(center.totals.field, 1);
  assert.equal(center.totals.locker, 1);
  assert.equal(center.totals.pendingSync, 4);
  assert.equal(center.totals.conflicts, 1);
  assert.equal(center.totals.usedNullifiers, 23);
  assert.equal(center.selectedItem?.itemId, 'OSC-POS-001');
  assert.equal(center.payloadSafety.safe, true);
  assert.ok(center.items.every(item => item.privacy.refsAndCountsOnly));
});

test('Offline Sync Center rejects private payload material and marks item unsafe', () => {
  const item = buildOfflineSyncItem({
    surface: 'pos',
    title: 'Unsafe local queue export',
    sourcePayload: {
      address: '1 Private Street',
      proofCode: '123456',
      phone: '+1-555-0100',
    },
  });

  assert.equal(item.accepted, false);
  assert.equal(item.status, 'conflict');
  assert.equal(item.privacy.personalDataAccepted, false);
  assert.ok(item.errors.some(error => error.includes('sourcePayload.address')));
  assert.ok(item.errors.some(error => error.includes('sourcePayload.proofCode')));
  assert.ok(item.privacy.forbiddenPaths.includes('sourcePayload.phone'));
});

test('Offline Sync Center safe export does not include queue refs or nullifier tails', () => {
  const center = buildOfflineSyncCenter({
    items: [{
      itemId: 'OSC-POS-001',
      surface: 'pos',
      deviceRef: 'terminal_ref_POS07',
      queueRef: 'queue_ref_pos_07',
      syncRef: 'registry_sync_ref_pos',
      pendingCount: 3,
      usedNullifierTails: ['A1B2C3D4'],
    }],
  });

  const serialized = JSON.stringify(center.safeExport);
  assert.equal(center.safeExport.itemRoots.length, 1);
  assert.doesNotMatch(serialized, /terminal_ref_POS07/);
  assert.doesNotMatch(serialized, /queue_ref_pos_07/);
  assert.doesNotMatch(serialized, /A1B2C3D4/);
  assert.equal(validateOfflineSyncCenterPayloadIsSafe(center.safeExport).safe, true);
});

test('Offline Sync Center capabilities document supported surfaces and nullifier posture', () => {
  const capabilities = listOfflineSyncCenterCapabilities();

  assert.deepEqual(capabilities.surfaces, ['pos', 'field', 'locker']);
  assert.deepEqual(capabilities.statuses, ['synced', 'pending-sync', 'conflict']);
  assert.equal(capabilities.rejectsPrivateMaterial, true);
  assert.equal(capabilities.displaysUsedNullifierState, 'tail-counts-only');
  assert.ok(capabilities.safeExportFields.includes('itemRoots'));
});
