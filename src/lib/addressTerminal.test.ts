import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAddressTerminalFleetSnapshot,
  listAddressTerminalCapabilities,
} from './addressTerminal';

test('Address Terminal exposes the POS management screens and device classes', () => {
  const capabilities = listAddressTerminalCapabilities();
  const screenIds = capabilities.screens.map(screen => screen.id);

  assert.ok(screenIds.includes('terminal-list'));
  assert.ok(screenIds.includes('terminal-diagnostics'));
  assert.ok(screenIds.includes('scan-history'));
  assert.ok(screenIds.includes('registry-sync'));
  assert.ok(screenIds.includes('offline-queue'));
  assert.ok(screenIds.includes('staff-permissions'));
  assert.ok(screenIds.includes('reverification-report'));
  assert.ok(capabilities.deviceClasses.includes('receipt-printer'));
  assert.ok(capabilities.deviceClasses.includes('cash-drawer'));
  assert.ok(capabilities.deviceClasses.includes('barcode-reader'));
  assert.ok(capabilities.deviceClasses.includes('measurement-instrument'));
  assert.equal(capabilities.privacy.rawPayloadStorage, false);
  assert.equal(capabilities.privacy.deviceTelemetryOnly, true);
});

test('Address Terminal fleet snapshot highlights offline conflicts and missing devices', () => {
  const snapshot = buildAddressTerminalFleetSnapshot({
    generatedAt: '2026-06-17T00:00:00.000Z',
    terminals: [
      {
        terminalId: 'POS-TOKYO-1',
        label: 'Tokyo counter',
        siteId: 'store-tokyo',
        staffRole: 'delivery-supervisor',
        registryFresh: true,
        syncState: 'fresh',
        pendingOfflineItems: 0,
        scanHistoryCount: 25,
        activeSecureKeys: 2,
        totalSecureKeys: 3,
        hardware: {
          checkedAt: '2026-06-17T00:00:00.000Z',
          nativeConnector: true,
          cashDrawerRelay: true,
          keyboardWedge: true,
          measurementProfile: true,
        },
      },
      {
        terminalId: 'POS-FIELD-1',
        label: 'Field kit',
        siteId: 'relief-site',
        staffRole: 'field-admin',
        registryFresh: false,
        syncState: 'conflict',
        pendingOfflineItems: 7,
        scanHistoryCount: 8,
        activeSecureKeys: 0,
        totalSecureKeys: 0,
        hardware: {
          checkedAt: '2026-06-17T00:00:00.000Z',
          keyboardWedge: false,
        },
      },
    ],
  });

  assert.equal(snapshot.totals.terminals, 2);
  assert.equal(snapshot.totals.ready, 1);
  assert.equal(snapshot.totals.blocked, 1);
  assert.equal(snapshot.totals.pendingOfflineItems, 7);
  assert.equal(snapshot.terminals[0].grade, 'ready');
  assert.equal(snapshot.terminals[1].grade, 'blocked');
  assert.ok(snapshot.terminals[1].attention.includes('sync:conflict'));
  assert.ok(snapshot.terminals[1].attention.includes('registry:stale'));
  assert.ok(snapshot.warnings.includes('blocked-terminal-requires-supervisor-before-release'));
});

test('Address Terminal fleet snapshot does not serialize raw address or proof payload fields', () => {
  const snapshot = buildAddressTerminalFleetSnapshot({
    terminals: [
      {
        terminalId: 'POS-LOCAL',
        label: 'Local POS',
        siteId: 'store',
        activeSecureKeys: 1,
        hardware: { nativeConnector: true },
      },
    ],
  });
  const serialized = JSON.stringify(snapshot);

  assert.doesNotMatch(serialized, /Private Receiver|1-2-3 private street|sk_live|recipient-secret|proof-code/i);
  assert.equal(snapshot.privacy.rawAddressStorage, false);
  assert.equal(snapshot.privacy.rawProofStorage, false);
});
