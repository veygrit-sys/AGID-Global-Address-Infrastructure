import {
  buildWarehouseLockerLocalSimulation,
  listWarehouseLockerLocalSimulatorCapabilities,
  type WarehouseLockerLocalSimulation,
  type WarehouseLockerLocalSimulatorInput,
} from './warehouseLockerLocalSimulator';
import type { LockerAccessMethod } from './lockerSystemOs';
import type { OpsScenario } from './opsScenario';
import { stableCommitment, stableId } from './redactedWorkflowCore';

export type LockerOpsQrNfcOperationStatus =
  | 'accepted'
  | 'awaiting-proof'
  | 'queued-offline'
  | 'reader-unavailable'
  | 'rejected'
  | 'review';

export type LockerOpsQrNfcOperation = {
  operationId: string;
  channel: Extract<LockerAccessMethod, 'qr' | 'nfc'>;
  reservationId: string;
  readerId: string | null;
  readerStatus: string;
  compartmentId: string | null;
  commandAction: 'open' | 'release' | 'reserve' | 'manual-review';
  protocol: string | null;
  frameId: string | null;
  status: LockerOpsQrNfcOperationStatus;
  publicAction: string;
  receiptCommitment: string;
  warnings: string[];
};

export function buildLockerOpsSimulationInput(
  scenario: OpsScenario,
  generatedAt: string,
): WarehouseLockerLocalSimulatorInput {
  const offline = scenario === 'offline';
  const blocked = scenario === 'blocked';

  return {
    generatedAt,
    site: {
      siteId: 'ops-locker-node-01',
      label: 'AGID Ops Locker Node',
      siteType: 'humanitarian-site',
      timezone: 'Asia/Tokyo',
      openingHours: offline ? 'offline-window' : '24/7',
      operatorAlias: 'ops-field-team',
      pudoNetworkTags: ['field-handoff', 'local-first', 'agid-s'],
      connectors: [
        {
          connectorId: 'OPS-MQTT',
          protocol: 'mqtt',
          endpointAlias: 'ops-mqtt-local',
          mqttTopicAlias: 'ops/locker/commands',
          online: !offline,
          lastHeartbeatAt: generatedAt,
          latencyMs: blocked ? 160 : 32,
          commandAckRate: blocked ? 0.72 : 0.99,
        },
        {
          connectorId: 'OPS-HTTP',
          protocol: 'http',
          endpointAlias: 'ops-http-gateway',
          httpPathAlias: '/ops/locker/commands',
          online: true,
          lastHeartbeatAt: generatedAt,
          latencyMs: offline ? 210 : 48,
          commandAckRate: offline ? 0.76 : 0.98,
        },
        {
          connectorId: 'OPS-MODBUS',
          protocol: 'modbus',
          endpointAlias: 'ops-modbus-rtu',
          modbusUnitId: 12,
          online: !offline,
          lastHeartbeatAt: generatedAt,
          latencyMs: blocked ? 88 : 24,
          commandAckRate: blocked ? 0.7 : 0.97,
        },
      ],
      readers: [
        {
          readerId: 'OPS-QR-READER',
          label: 'Locker QR reader',
          supportedMethods: ['qr'],
          status: blocked ? 'maintenance' : 'online',
          connectorId: 'OPS-HTTP',
          lastSeenAt: generatedAt,
          latencyMs: blocked ? 210 : 35,
          batteryPercent: blocked ? 38 : 92,
        },
        {
          readerId: 'OPS-NFC-READER',
          label: 'Locker NFC tap reader',
          supportedMethods: ['nfc', 'passkey', 'aoid-credential'],
          status: offline ? 'degraded' : 'online',
          connectorId: 'OPS-MQTT',
          lastSeenAt: generatedAt,
          latencyMs: offline ? 420 : 28,
          batteryPercent: offline ? 44 : 89,
        },
      ],
      compartments: [
        {
          compartmentId: 'OPS-COLD-01',
          size: 'refrigerated',
          status: blocked ? 'jammed' : 'available',
          supportsColdChain: true,
          compatibleHandling: ['standard', 'cold-chain', 'high-value'],
          batteryPercent: blocked ? 19 : 91,
        },
        {
          compartmentId: 'OPS-MID-01',
          size: 'm',
          status: 'available',
          compatibleHandling: ['standard', 'high-value'],
          batteryPercent: offline ? 58 : 86,
        },
        {
          compartmentId: 'OPS-LARGE-01',
          size: 'l',
          status: offline ? 'maintenance' : 'available',
          compatibleHandling: ['standard', 'heavy'],
          batteryPercent: offline ? 22 : 82,
        },
      ],
    },
    reservations: [
      {
        reservationId: 'OPS-RES-01',
        waybillAlias: 'WBA-OPS-01',
        waybillCommitment: 'waybill:ops:01',
        recipientCommitment: 'recipient:ops:01',
        carrierId: 'carrier:ops-demo',
        sizeRequired: scenario === 'normal' ? 'm' : 'refrigerated',
        requiredHandling: scenario === 'normal' ? ['standard'] : ['cold-chain'],
        requiredAccessMethods: scenario === 'normal' ? ['qr'] : ['nfc', 'aoid-credential'],
        ttlSeconds: scenario === 'normal' ? 1200 : 240,
        highRiskMode: scenario !== 'normal',
      },
    ],
    accessAttempts: scenario === 'normal'
      ? [
          {
            reservationId: 'OPS-RES-01',
            compartmentId: 'OPS-MID-01',
            method: 'qr',
            actor: 'recipient',
            presentedProofCommitment: 'proof:ops:recipient',
          },
        ]
      : [],
    script: [
      {
        protocol: 'mqtt',
        connectorId: 'OPS-MQTT',
        operation: 'sensor',
        topicAlias: 'ops/locker/sensor',
        payload: { doorClosed: !blocked, temperatureBand: scenario === 'normal' ? 'ambient' : 'cold' },
      },
      {
        protocol: 'http',
        connectorId: 'OPS-HTTP',
        operation: 'command-ack',
        httpMethod: 'POST',
        httpPathAlias: '/ops/locker/ack',
        payload: { ack: !blocked, queue: offline ? 'deferred' : 'live' },
      },
      {
        protocol: 'modbus',
        connectorId: 'OPS-MODBUS',
        operation: blocked ? 'disable' : 'command-ack',
        modbusUnitId: 12,
        modbusRegister: blocked ? 40005 : 40103,
        modbusValue: blocked ? 0 : 1,
      },
    ],
  };
}

export function buildLockerOpsSimulation(
  scenario: OpsScenario,
  generatedAt: string,
): WarehouseLockerLocalSimulation {
  return buildWarehouseLockerLocalSimulation(buildLockerOpsSimulationInput(scenario, generatedAt));
}

function operationStatus(input: {
  simulation: WarehouseLockerLocalSimulation;
  readerOnline: boolean;
  decisionStatus?: string;
}): LockerOpsQrNfcOperationStatus {
  if (!input.readerOnline) return 'reader-unavailable';
  if (input.decisionStatus === 'accepted') return input.simulation.state.offlineQueue > 0 ? 'queued-offline' : 'accepted';
  if (input.decisionStatus === 'rejected') return 'rejected';
  if (input.decisionStatus === 'review') return 'review';
  return input.simulation.status === 'blocked' ? 'review' : 'awaiting-proof';
}

function publicActionFor(status: LockerOpsQrNfcOperationStatus) {
  if (status === 'accepted') return 'open-or-release-compartment';
  if (status === 'queued-offline') return 'queue-local-receipt-and-sync-later';
  if (status === 'reader-unavailable') return 'manual-counter-or-maintenance-review';
  if (status === 'rejected') return 'reject-and-create-review-case';
  if (status === 'review') return 'operator-review-required';
  return 'request-recipient-proof';
}

export function buildLockerOpsQrNfcOperations(
  simulation: WarehouseLockerLocalSimulation,
): LockerOpsQrNfcOperation[] {
  const operations: LockerOpsQrNfcOperation[] = [];
  const qrNfcChannels: Array<Extract<LockerAccessMethod, 'qr' | 'nfc'>> = ['qr', 'nfc'];

  for (const reservation of simulation.lockerSnapshot.reservationPlan.reservations) {
    for (const channel of reservation.requiredAccessMethods.filter((method): method is Extract<LockerAccessMethod, 'qr' | 'nfc'> => (
      qrNfcChannels.includes(method as Extract<LockerAccessMethod, 'qr' | 'nfc'>)
    ))) {
      const reader = simulation.lockerSnapshot.site.readers.find(item => item.supportedMethods.includes(channel));
      const readerOnline = Boolean(reader && reader.status === 'online' && !reader.tamperDetected);
      const decision = simulation.lockerSnapshot.accessDecisions.find(item => (
        item.reservationId === reservation.reservationId && item.method === channel
      ));
      const command = decision?.command;
      const frame = command
        ? simulation.frames.find(item => item.commandId === command.commandId)
        : null;
      const readerProtocol = reader
        ? simulation.lockerSnapshot.site.connectors.find(connector => connector.connectorId === reader.connectorId)?.protocol || null
        : null;
      const protocol = frame?.protocol || command?.protocol || readerProtocol;
      const status = operationStatus({
        simulation,
        readerOnline,
        decisionStatus: decision?.status,
      });
      const warnings = [
        ...(reader?.warnings || []),
        ...(decision?.status === 'rejected' ? [decision.reason] : []),
        ...(status === 'reader-unavailable' ? [`${channel}-reader-unavailable`] : []),
        ...(status === 'queued-offline' ? ['locker-operation-queued-offline'] : []),
      ];
      const operationId = stableId('LOCKOP', {
        simulation: simulation.generatedAt,
        reservationId: reservation.reservationId,
        channel,
        readerId: reader?.readerId || null,
      }, { length: 12 });
      const receiptCommitment = stableCommitment('locker.ops.qr-nfc-operation', {
        operationId,
        reservationId: reservation.reservationId,
        channel,
        readerId: reader?.readerId || null,
        status,
        decisionId: decision?.decisionId || null,
        commandId: command?.commandId || null,
      }, { length: 28 });

      operations.push({
        operationId,
        channel,
        reservationId: reservation.reservationId,
        readerId: reader?.readerId || null,
        readerStatus: reader?.status || 'missing',
        compartmentId: decision?.compartmentId || command?.targetCompartmentId || null,
        commandAction: command?.action === 'open' || command?.action === 'release' || command?.action === 'reserve'
          ? command.action
          : status === 'accepted'
            ? 'open'
            : 'manual-review',
        protocol,
        frameId: frame?.frameId || null,
        status,
        publicAction: publicActionFor(status),
        receiptCommitment,
        warnings: Array.from(new Set(warnings)),
      });
    }
  }

  return operations;
}

export function listLockerOpsCapabilities() {
  return listWarehouseLockerLocalSimulatorCapabilities();
}
