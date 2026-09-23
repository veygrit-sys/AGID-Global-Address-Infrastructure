import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildWarehouseLockerLocalSimulation,
  listWarehouseLockerLocalSimulatorCapabilities,
} from './warehouseLockerLocalSimulator';

const generatedAt = '2026-06-18T15:00:00.000Z';

test('warehouse locker local simulator exposes MQTT, HTTP, Modbus, and redacted privacy boundary', () => {
  const capabilities = listWarehouseLockerLocalSimulatorCapabilities();

  assert.deepEqual(capabilities.protocols, ['mqtt', 'http', 'modbus']);
  assert.equal(capabilities.privacy.rawPayloadStored, false);
  assert.equal(capabilities.privacy.rawAddressStored, false);
  assert.equal(capabilities.privacy.hardwareSecretsStored, false);
  assert.equal(capabilities.modbusRegisters.open, 40003);
});

test('default simulation emits local protocol frames for all three connector families', () => {
  const simulation = buildWarehouseLockerLocalSimulation({ generatedAt });

  assert.equal(simulation.modelVersion, 'warehouse-locker-local-simulator-v1');
  assert.ok(simulation.devices.some(device => device.protocol === 'mqtt'));
  assert.ok(simulation.devices.some(device => device.protocol === 'http'));
  assert.ok(simulation.devices.some(device => device.protocol === 'modbus'));
  assert.ok(simulation.protocolTotals.mqtt.inbound >= 1);
  assert.ok(simulation.protocolTotals.http.inbound >= 1);
  assert.ok(simulation.protocolTotals.modbus.inbound >= 1);
  assert.ok(simulation.state.commandFrames >= 2);
  assert.equal(simulation.privacy.rawPayloadStored, false);
  assert.doesNotMatch(JSON.stringify(simulation), /raw-qr-copy|090-1234|secret-live-key/i);
});

test('locker reservation commands become protocol-safe local frames without raw waybill data', () => {
  const simulation = buildWarehouseLockerLocalSimulation({
    generatedAt,
    site: {
      siteId: 'LOCKER-LAB-1',
      connectors: [
        {
          connectorId: 'LAB-MODBUS',
          protocol: 'modbus',
          endpointAlias: 'lab-modbus',
          modbusUnitId: 9,
          online: true,
          commandAckRate: 1,
          lastHeartbeatAt: generatedAt,
        },
      ],
      compartments: [
        {
          compartmentId: 'LAB-M-01',
          size: 'm',
          status: 'available',
          compatibleHandling: ['standard'],
        },
      ],
    },
    reservations: [
      {
        reservationId: 'LAB-RES-1',
        waybillAlias: 'WBA-LAB-1',
        waybillCommitment: 'waybill:commit:lab',
        recipientCommitment: 'recipient:commit:lab',
        requiredHandling: ['standard'],
        requiredAccessMethods: ['qr'],
      },
    ],
  });

  const reserveFrame = simulation.frames.find(frame => frame.operation === 'reserve');
  const lockFrame = simulation.frames.find(frame => frame.operation === 'lock');

  assert.equal(reserveFrame?.protocol, 'modbus');
  assert.equal(reserveFrame?.modbusUnitId, 9);
  assert.equal(reserveFrame?.modbusRegister, 40001);
  assert.equal(lockFrame?.modbusRegister, 40002);
  assert.equal(simulation.state.modbusRegisterCount >= 2, true);
  assert.doesNotMatch(JSON.stringify(simulation), /WBA-LAB-1/);
});

test('script events can simulate MQTT sensor, HTTP callback, and Modbus ACK events', () => {
  const simulation = buildWarehouseLockerLocalSimulation({
    generatedAt,
    script: [
      {
        protocol: 'mqtt',
        operation: 'sensor',
        topicAlias: 'local/locker/sensor',
        payload: { doorClosed: true },
      },
      {
        protocol: 'http',
        operation: 'command-ack',
        httpPathAlias: '/local/locker/ack',
        httpMethod: 'POST',
        payload: { ack: true },
      },
      {
        protocol: 'modbus',
        operation: 'command-ack',
        modbusUnitId: 3,
        modbusRegister: 40103,
        modbusValue: 1,
      },
    ],
  });

  assert.equal(simulation.state.scriptFrames, 3);
  assert.ok(simulation.frames.some(frame => frame.protocol === 'mqtt' && frame.operation === 'sensor'));
  assert.ok(simulation.frames.some(frame => frame.protocol === 'http' && frame.httpPathAlias === '/local/locker/ack'));
  assert.ok(simulation.frames.some(frame => frame.protocol === 'modbus' && frame.modbusRegister === 40103));
  assert.equal(simulation.state.rejectedFrames, 0);
});

test('script events reject raw payloads and device secrets instead of storing them', () => {
  const simulation = buildWarehouseLockerLocalSimulation({
    generatedAt,
    devices: [
      {
        connectorId: 'UNSAFE-HTTP',
        protocol: 'http',
        apiKey: 'secret-live-key',
      },
    ],
    script: [
      {
        protocol: 'http',
        operation: 'command-ack',
        rawPayload: 'raw-qr-copy',
        pin: '123456',
      },
    ],
  });

  assert.equal(simulation.status, 'blocked');
  assert.equal(simulation.state.rejectedFrames, 1);
  assert.ok(simulation.warnings.includes('simulator-script-private-material-rejected'));
  assert.ok(simulation.warnings.includes('simulator-device-secret-redacted'));
  assert.equal(simulation.privacy.rawPinStored, false);
  assert.doesNotMatch(JSON.stringify(simulation), /raw-qr-copy|123456|secret-live-key/);
});
