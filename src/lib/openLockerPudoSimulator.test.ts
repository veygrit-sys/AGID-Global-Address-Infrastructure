import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildOpenLockerPudoSimulation,
  listOpenLockerPudoSimulatorCapabilities,
} from './openLockerPudoSimulator';

const generatedAt = '2026-06-20T09:00:00.000Z';

test('open locker/PUDO simulator exposes OSS local-first capabilities', () => {
  const capabilities = listOpenLockerPudoSimulatorCapabilities();

  assert.equal(capabilities.modelVersion, 'open-locker-pudo-simulator-v0.1');
  assert.deepEqual(capabilities.protocols, ['mqtt', 'http', 'modbus']);
  assert.ok(capabilities.accessMethods.includes('qr'));
  assert.ok(capabilities.accessMethods.includes('nfc'));
  assert.ok(capabilities.simulatedSurfaces.includes('pudo-counter-handoff'));
  assert.ok(capabilities.simulatedSurfaces.includes('redacted-operator-receipt'));
  assert.equal(capabilities.mode, 'local-only');
  assert.equal(capabilities.privacy.rawAddressStored, false);
  assert.equal(capabilities.privacy.rawQrPayloadStored, false);
  assert.equal(capabilities.privacy.hardwareSecretsStored, false);
});

test('pickup success scenario produces a ready locker handoff and redacted receipts', () => {
  const simulation = buildOpenLockerPudoSimulation({
    scenario: 'pickup-success',
    generatedAt,
  });

  assert.equal(simulation.modelVersion, 'open-locker-pudo-simulator-v0.1');
  assert.equal(simulation.status, 'ready');
  assert.equal(simulation.summary.decision, 'accept');
  assert.equal(simulation.pudoCounter.staffAction, 'release-parcel');
  assert.ok(simulation.lockerSnapshot.reservationPlan.assignments.some(item => item.status === 'assigned'));
  assert.ok(simulation.lockerSnapshot.accessDecisions.some(item => item.status === 'accepted'));
  assert.ok(simulation.eventLog.some(event => event.kind === 'access'));
  assert.ok(simulation.operatorActions.includes('print-receipt'));
  assert.doesNotMatch(JSON.stringify(simulation), /WBA-PUDO-PRIMARY|recipientName|phoneNumber|raw-qr/i);
});

test('field one-screen flow keeps QR NFC scan, locker choice, unlock decision, and receipt together', () => {
  const simulation = buildOpenLockerPudoSimulation({
    scenario: 'pickup-success',
    generatedAt,
  });

  assert.deepEqual(simulation.fieldFlow.map(step => step.stage), ['read', 'select-locker', 'unlock-decision', 'receipt']);
  assert.equal(simulation.fieldFlow[0]?.label, 'QR/NFC read');
  assert.equal(simulation.fieldFlow[1]?.label, 'Locker selection');
  assert.equal(simulation.fieldFlow[2]?.label, 'Unlock decision');
  assert.equal(simulation.fieldFlow[3]?.label, 'Receipt');
  assert.ok(simulation.fieldFlow.every(step => step.publicRef && !/payload|pin/i.test(step.publicRef)));
  assert.equal(simulation.pudoSafeIntake.addressDisplayMode, 'alias-and-conditions');
  assert.equal(simulation.pudoSafeIntake.pinStored, false);
  assert.equal(simulation.pudoSafeIntake.qrPayloadStored, false);
  assert.doesNotMatch(JSON.stringify(Object.values(simulation.pudoSafeIntake)), /raw|payload|pin/i);
});

test('locker status board normalizes available reserved faulty offline and needs collection states', () => {
  const simulation = buildOpenLockerPudoSimulation({
    scenario: 'full-capacity',
    generatedAt,
  });

  const statuses = simulation.lockerStatusBoard.map(item => item.displayStatus);
  assert.ok(statuses.includes('reserved'));
  assert.ok(statuses.includes('faulty'));
  assert.ok(statuses.includes('needs-collection'));
  assert.ok(simulation.lockerStatusLegend.some(item => item.status === 'available' && item.labelJa === '空き'));
  assert.ok(simulation.lockerStatusLegend.some(item => item.status === 'reserved' && item.labelJa === '予約'));
  assert.ok(simulation.lockerStatusLegend.some(item => item.status === 'faulty' && item.labelJa === '故障'));
  assert.ok(simulation.lockerStatusLegend.some(item => item.status === 'offline' && item.labelJa === 'オフライン'));
  assert.ok(simulation.lockerStatusLegend.some(item => item.status === 'needs-collection' && item.labelJa === '要回収'));
});

test('full capacity scenario moves the case to PUDO counter review', () => {
  const simulation = buildOpenLockerPudoSimulation({
    scenario: 'full-capacity',
    generatedAt,
  });

  assert.equal(simulation.status, 'attention');
  assert.equal(simulation.summary.decision, 'review');
  assert.equal(simulation.pudoCounter.staffAction, 'manual-counter-handoff');
  assert.equal(simulation.pudoCounter.assignedLockerCount, 0);
  assert.ok(simulation.pudoCounter.rejectedOrUnassignedCount > 0);
  assert.ok(simulation.warnings.includes('locker-reservation-no-compatible-compartment'));
});

test('reader failure scenario blocks QR release and asks staff to disable the reader', () => {
  const simulation = buildOpenLockerPudoSimulation({
    scenario: 'reader-failure',
    generatedAt,
  });

  assert.equal(simulation.status, 'blocked');
  assert.equal(simulation.summary.decision, 'reject');
  assert.equal(simulation.pudoCounter.staffAction, 'disable-reader');
  assert.ok(simulation.lockerSnapshot.accessDecisions.some(item => item.reason === 'locker-access-reader-unavailable'));
  assert.ok(simulation.operatorActions.includes('disable-reader'));
  assert.ok(simulation.eventLog.some(event => event.warnings.includes('locker-access-reader-unavailable')));
});

test('offline sync scenario keeps local receipts and queues protocol work', () => {
  const simulation = buildOpenLockerPudoSimulation({
    scenario: 'offline-sync',
    generatedAt,
  });

  assert.equal(simulation.status, 'blocked');
  assert.equal(simulation.pudoCounter.staffAction, 'sync-later');
  assert.ok(simulation.localProtocol.state.offlineQueue > 0);
  assert.ok(simulation.operatorActions.includes('sync-later'));
  assert.ok(simulation.eventLog.some(event => event.kind === 'offline-sync'));
});

test('high risk scenario uses NFC/passkey/AOID credential methods and short TTL', () => {
  const simulation = buildOpenLockerPudoSimulation({
    scenario: 'high-risk',
    generatedAt,
  });
  const reservation = simulation.lockerSnapshot.reservationPlan.reservations[0];

  assert.equal(simulation.status, 'ready');
  assert.equal(reservation?.highRiskMode, true);
  assert.equal(reservation?.ttlSeconds, 240);
  assert.ok(reservation?.requiredAccessMethods.includes('nfc'));
  assert.ok(reservation?.requiredAccessMethods.includes('passkey'));
  assert.ok(reservation?.requiredAccessMethods.includes('aoid-credential'));
  assert.ok(!reservation?.requiredAccessMethods.every(method => method === 'qr'));
  assert.equal(simulation.privacy.rawNfcPayloadStored, false);
  assert.ok(simulation.warnings.includes('high-risk-mode-short-ttl-and-strong-proof-required'));
});

test('custom script private material is rejected instead of stored', () => {
  const simulation = buildOpenLockerPudoSimulation({
    generatedAt,
    script: [
      {
        protocol: 'http',
        operation: 'handoff-receipt',
        rawPayload: 'raw-qr-copy',
        pin: '123456',
      },
    ],
    devices: [
      {
        connectorId: 'OPEN-PUDO-HTTP',
        protocol: 'http',
        apiKey: 'secret-live-key',
      },
    ],
  });

  assert.equal(simulation.status, 'blocked');
  assert.equal(simulation.localProtocol.state.rejectedFrames, 1);
  assert.ok(simulation.warnings.includes('simulator-script-private-material-rejected'));
  assert.equal(simulation.privacy.rawPinStored, false);
  assert.doesNotMatch(JSON.stringify(simulation), /raw-qr-copy|123456|secret-live-key/i);
});
