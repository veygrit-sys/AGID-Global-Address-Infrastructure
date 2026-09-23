import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildLockerOpsQrNfcOperations,
  buildLockerOpsSimulation,
  buildLockerOpsSimulationInput,
  listLockerOpsCapabilities,
} from './lockerOpsScenario';
import { scenarioTime } from './opsScenario';

test('locker ops scenario builds QR/NFC ready normal handoff input', () => {
  const input = buildLockerOpsSimulationInput('normal', scenarioTime('normal', 0));
  const readers = Array.isArray(input.site?.readers)
    ? input.site.readers as Array<{ supportedMethods?: unknown }>
    : [];
  const accessAttempts = Array.isArray(input.accessAttempts) ? input.accessAttempts : [];

  assert.equal(accessAttempts.length, 1);
  assert.ok(readers.some(reader => Array.isArray(reader.supportedMethods) && reader.supportedMethods.includes('qr')));
  assert.ok(readers.some(reader => Array.isArray(reader.supportedMethods) && reader.supportedMethods.includes('nfc')));
});

test('locker ops simulation separates locker protocol health from drone evidence', () => {
  const simulation = buildLockerOpsSimulation('offline', scenarioTime('offline', 0));

  assert.equal(simulation.modelVersion, 'warehouse-locker-local-simulator-v1');
  assert.ok(simulation.state.offlineQueue > 0);
  assert.ok(simulation.frames.some(frame => frame.protocol === 'mqtt'));
  assert.ok(simulation.frames.some(frame => frame.protocol === 'http'));
  assert.ok(simulation.frames.some(frame => frame.protocol === 'modbus'));
  assert.equal(simulation.privacy.rawQrPayloadStored, false);
  assert.doesNotMatch(JSON.stringify(simulation), /operator:ops-drone-team|mission:ops/i);
});

test('locker ops capabilities expose only local hardware simulation protocols', () => {
  const capabilities = listLockerOpsCapabilities();

  assert.deepEqual(capabilities.protocols, ['mqtt', 'http', 'modbus']);
  assert.equal(capabilities.privacy.hardwareSecretsStored, false);
});

test('locker ops derives QR/NFC operations from reader state and protocol frames without raw payloads', () => {
  const normal = buildLockerOpsSimulation('normal', scenarioTime('normal', 0));
  const blocked = buildLockerOpsSimulation('blocked', scenarioTime('blocked', 0));
  const operations = [
    ...buildLockerOpsQrNfcOperations(normal),
    ...buildLockerOpsQrNfcOperations(blocked),
  ];

  assert.ok(operations.some(operation => operation.channel === 'qr'));
  assert.ok(operations.some(operation => operation.channel === 'nfc'));
  assert.ok(operations.some(operation => operation.status === 'accepted'));
  assert.ok(operations.every(operation => operation.receiptCommitment));
  assert.ok(operations.every(operation => operation.protocol === null || ['mqtt', 'http', 'modbus'].includes(operation.protocol)));
  assert.doesNotMatch(JSON.stringify(operations), /qrPayload|nfcPayload|pin|raw-qr|raw-nfc/i);
});

test('locker ops marks QR/NFC operations unavailable or queued when readers or protocol paths are degraded', () => {
  const blocked = buildLockerOpsQrNfcOperations(buildLockerOpsSimulation('blocked', scenarioTime('blocked', 0)));
  const offline = buildLockerOpsQrNfcOperations(buildLockerOpsSimulation('offline', scenarioTime('offline', 0)));

  assert.ok(blocked.some(operation => operation.status === 'reader-unavailable' || operation.status === 'review'));
  assert.ok(offline.some(operation => operation.status === 'reader-unavailable' || operation.status === 'queued-offline' || operation.status === 'awaiting-proof'));
});
