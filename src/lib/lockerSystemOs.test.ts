import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildLockerHealthSnapshot,
  buildLockerSystemSnapshot,
  evaluateLockerAccess,
  listLockerSystemCapabilities,
  planLockerReservations,
} from './lockerSystemOs';

const generatedAt = '2026-06-18T12:00:00.000Z';

const site = {
  siteId: 'PUDO-TOKYO-1',
  label: 'Tokyo Station PUDO',
  siteType: 'station',
  agid: 'ML01R1A0ZTR4',
  timezone: 'Asia/Tokyo',
  openingHours: '06:00-24:00',
  operatorAlias: 'operator:tokyo-station',
  pudoNetworkTags: ['rail', 'carrier-neutral'],
  connectors: [
    {
      connectorId: 'MQTT-LOCKER-1',
      protocol: 'mqtt',
      endpointAlias: 'station-locker-gateway',
      online: true,
      lastHeartbeatAt: generatedAt,
      latencyMs: 80,
      commandAckRate: 0.99,
      supportsOpen: true,
      supportsLock: true,
      supportsSensor: true,
    },
  ],
  compartments: [
    {
      compartmentId: 'COLD-01',
      size: 'refrigerated',
      status: 'available',
      supportsColdChain: true,
      compatibleHandling: ['standard', 'cold-chain', 'high-value'],
      batteryPercent: 94,
    },
    {
      compartmentId: 'MID-01',
      size: 'm',
      status: 'available',
      compatibleHandling: ['standard', 'high-value'],
      batteryPercent: 88,
    },
  ],
};

test('Locker System OS exposes protocols, access methods, and privacy boundary', () => {
  const capabilities = listLockerSystemCapabilities();

  assert.ok(capabilities.connectorProtocols.includes('mqtt'));
  assert.ok(capabilities.connectorProtocols.includes('modbus'));
  assert.ok(capabilities.accessMethods.includes('qr'));
  assert.ok(capabilities.accessMethods.includes('nfc'));
  assert.ok(capabilities.accessMethods.includes('aoid-credential'));
  assert.equal(capabilities.privacy.rawAddressStored, false);
  assert.equal(capabilities.privacy.rawPinStored, false);
  assert.equal(capabilities.privacy.biometricTemplateStored, false);
});

test('Locker reservations assign cold-chain and standard parcels to compatible compartments', () => {
  const plan = planLockerReservations({
    generatedAt,
    site,
    reservations: [
      {
        reservationId: 'RES-COLD',
        waybillAlias: 'WBA-COLD-001',
        waybillCommitment: 'waybill:commit:cold',
        recipientCommitment: 'recipient:commit:cold',
        carrierId: 'carrier:jp',
        sizeRequired: 'm',
        requiredHandling: ['cold-chain'],
        requiredAccessMethods: ['qr', 'nfc'],
      },
      {
        reservationId: 'RES-STD',
        waybillAlias: 'WBA-STD-001',
        waybillCommitment: 'waybill:commit:std',
        recipientCommitment: 'recipient:commit:std',
        sizeRequired: 'm',
        requiredHandling: ['standard'],
        requiredAccessMethods: ['qr'],
      },
    ],
  });

  assert.equal(plan.assignments.find(assignment => assignment.reservationId === 'RES-COLD')?.compartmentId, 'COLD-01');
  assert.equal(plan.assignments.find(assignment => assignment.reservationId === 'RES-STD')?.compartmentId, 'MID-01');
  assert.equal(plan.hardwareCommands.filter(command => command.action === 'reserve').length, 2);
  assert.ok(plan.notifications.some(item => item.event === 'locker-reservation-created'));
  assert.equal(plan.privacy.rawWaybillStored, false);
  assert.doesNotMatch(JSON.stringify(plan), /1-2-3 private|090-1234|secret-pin/i);
});

test('Locker reservations reject raw private material and unsafe high-risk QR-only holds', () => {
  const plan = planLockerReservations({
    generatedAt,
    site,
    reservations: [
      {
        reservationId: 'RES-PRIVATE',
        rawAddress: '1-2-3 Private Street',
        phone: '+81-90-1234-5678',
        pin: '123456',
        sizeRequired: 's',
      },
      {
        reservationId: 'RES-HIGH-RISK',
        highRiskMode: true,
        ttlSeconds: 900,
        requiredAccessMethods: ['qr'],
      },
    ],
  });

  assert.equal(plan.assignments[0].status, 'rejected');
  assert.equal(plan.assignments[0].reason, 'locker-reservation-private-material-rejected');
  assert.equal(plan.assignments[1].status, 'rejected');
  assert.ok(plan.warnings.includes('locker-high-risk-ttl-too-long'));
  assert.ok(plan.warnings.includes('locker-high-risk-strong-recipient-proof-required'));
  assert.equal(plan.status, 'blocked');
});

test('Locker access accepts committed proofs and rejects raw QR/PIN payloads', () => {
  const decisions = evaluateLockerAccess({
    generatedAt,
    site,
    reservations: [
      {
        reservationId: 'RES-ACCESS',
        waybillCommitment: 'waybill:commit:access',
        recipientCommitment: 'recipient:commit:access',
        requiredAccessMethods: ['qr', 'nfc', 'aoid-credential'],
        ttlSeconds: 600,
      },
    ],
    accessAttempts: [
      {
        reservationId: 'RES-ACCESS',
        compartmentId: 'MID-01',
        method: 'aoid-credential',
        actor: 'recipient',
        presentedProofCommitment: 'proof:commit:recipient',
        at: '2026-06-18T12:03:00.000Z',
      },
      {
        reservationId: 'RES-ACCESS',
        compartmentId: 'MID-01',
        method: 'qr',
        actor: 'recipient',
        qrPayload: 'raw-qr-copy',
        at: '2026-06-18T12:04:00.000Z',
      },
    ],
  });

  assert.equal(decisions[0].status, 'accepted');
  assert.equal(decisions[0].command?.action, 'open');
  assert.equal(decisions[1].status, 'rejected');
  assert.equal(decisions[1].reason, 'locker-access-raw-proof-rejected');
  assert.doesNotMatch(JSON.stringify(decisions), /raw-qr-copy/);
});

test('Locker OS models QR and NFC readers as first-class access hardware', () => {
  const snapshot = buildLockerSystemSnapshot({
    generatedAt,
    site: {
      ...site,
      readers: [
        {
          readerId: 'QR-READER-1',
          label: 'front QR scanner',
          supportedMethods: ['qr'],
          status: 'online',
          lastSeenAt: generatedAt,
          batteryPercent: 91,
        },
        {
          readerId: 'NFC-READER-1',
          label: 'front NFC tap area',
          supportedMethods: ['nfc', 'passkey', 'aoid-credential'],
          status: 'online',
          lastSeenAt: generatedAt,
          batteryPercent: 88,
        },
      ],
    },
    reservations: [
      {
        reservationId: 'RES-QR-NFC',
        recipientCommitment: 'recipient:commit:qr-nfc',
        requiredAccessMethods: ['qr', 'nfc'],
      },
    ],
    accessAttempts: [
      {
        reservationId: 'RES-QR-NFC',
        compartmentId: 'MID-01',
        method: 'qr',
        readerId: 'QR-READER-1',
        actor: 'recipient',
        presentedProofCommitment: 'proof:commit:qr',
      },
      {
        reservationId: 'RES-QR-NFC',
        compartmentId: 'MID-01',
        method: 'nfc',
        readerId: 'NFC-READER-1',
        actor: 'recipient',
        presentedProofCommitment: 'proof:commit:nfc',
      },
    ],
  });

  assert.equal(snapshot.site.readers.length, 2);
  assert.equal(snapshot.health.readerTotals.qrReady, 1);
  assert.equal(snapshot.health.readerTotals.nfcReady, 1);
  assert.equal(snapshot.accessDecisions[0].status, 'accepted');
  assert.equal(snapshot.accessDecisions[0].readerId, 'QR-READER-1');
  assert.equal(snapshot.accessDecisions[1].status, 'accepted');
  assert.equal(snapshot.accessDecisions[1].readerId, 'NFC-READER-1');
  assert.equal(snapshot.privacy.rawQrPayloadStored, false);
  assert.equal(snapshot.privacy.rawNfcPayloadStored, false);
});

test('Locker access rejects QR or NFC when the required reader is unavailable or tampered', () => {
  const decisions = evaluateLockerAccess({
    generatedAt,
    site: {
      ...site,
      readers: [
        {
          readerId: 'NFC-TAMPERED',
          supportedMethods: ['nfc'],
          status: 'online',
          tamperDetected: true,
        },
      ],
    },
    reservations: [
      {
        reservationId: 'RES-NFC-TAMPER',
        recipientCommitment: 'recipient:commit:nfc-tamper',
        requiredAccessMethods: ['nfc'],
      },
    ],
    accessAttempts: [
      {
        reservationId: 'RES-NFC-TAMPER',
        compartmentId: 'MID-01',
        method: 'nfc',
        readerId: 'NFC-TAMPERED',
        actor: 'recipient',
        presentedProofCommitment: 'proof:commit:nfc-tamper',
      },
      {
        reservationId: 'RES-NFC-TAMPER',
        compartmentId: 'MID-01',
        method: 'qr',
        actor: 'recipient',
        presentedProofCommitment: 'proof:commit:qr-no-reader',
      },
    ],
  });

  assert.equal(decisions[0].status, 'rejected');
  assert.equal(decisions[0].reason, 'locker-access-reader-tamper-detected');
  assert.equal(decisions[1].status, 'rejected');
  assert.equal(decisions[1].reason, 'locker-access-method-not-allowed');
});

test('Locker access marks expired or mismatched attempts as rejected', () => {
  const decisions = evaluateLockerAccess({
    generatedAt,
    site,
    reservations: [
      {
        reservationId: 'RES-EXPIRE',
        recipientCommitment: 'recipient:commit:expired',
        requiredAccessMethods: ['qr'],
        ttlSeconds: 60,
      },
    ],
    accessAttempts: [
      {
        reservationId: 'RES-EXPIRE',
        compartmentId: 'COLD-01',
        method: 'qr',
        actor: 'recipient',
        presentedProofCommitment: 'proof:commit:late',
        at: '2026-06-18T12:05:00.000Z',
      },
    ],
  });

  assert.equal(decisions[0].status, 'rejected');
  assert.equal(decisions[0].reason, 'locker-access-wrong-compartment');
});

test('Locker health flags stale connectors, jammed compartments, and low batteries', () => {
  const health = buildLockerHealthSnapshot({
    ...site,
    connectors: [
      {
        connectorId: 'HTTP-OFFLINE',
        protocol: 'http',
        online: false,
        lastHeartbeatAt: '2026-06-18T11:00:00.000Z',
        latencyMs: 4000,
      },
    ],
    compartments: [
      { compartmentId: 'JAM-01', size: 'm', status: 'jammed', batteryPercent: 10 },
      { compartmentId: 'OK-01', size: 's', status: 'available', batteryPercent: 80 },
    ],
  }, generatedAt);

  assert.equal(health.status, 'blocked');
  assert.equal(health.connectorTotals.online, 0);
  assert.equal(health.connectorTotals.staleHeartbeat, 1);
  assert.equal(health.connectorTotals.highLatency, 1);
  assert.equal(health.compartmentTotals.attention, 1);
  assert.equal(health.analytics.batteryLowCount, 1);
  assert.ok(health.alerts.some(alert => alert.code === 'locker-compartment-jammed'));
});

test('Locker system snapshot combines reservation, access, and health state', () => {
  const snapshot = buildLockerSystemSnapshot({
    generatedAt,
    site,
    reservations: [
      {
        reservationId: 'RES-SNAPSHOT',
        recipientCommitment: 'recipient:commit:snapshot',
        requiredAccessMethods: ['nfc'],
      },
    ],
    accessAttempts: [
      {
        reservationId: 'RES-SNAPSHOT',
        compartmentId: 'MID-01',
        method: 'nfc',
        actor: 'recipient',
        presentedProofCommitment: 'proof:commit:nfc',
      },
    ],
  });

  assert.equal(snapshot.modelVersion, 'agid-locker-system-os-v1');
  assert.equal(snapshot.reservationPlan.assignments[0].status, 'assigned');
  assert.equal(snapshot.accessDecisions[0].status, 'accepted');
  assert.equal(snapshot.privacy.rawNfcPayloadStored, false);
});
