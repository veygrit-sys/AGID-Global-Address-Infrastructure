import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { registerWarehouseLockerSimulatorRoutes } from './warehouseLockerSimulatorRoutes';

let server: Server;
let baseUrl = '';

async function getJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-AGID-Request-ID': 'warehouse-locker-simulator-route-test' },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'warehouse-locker-simulator-route-test',
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

before(async () => {
  const app = express();
  app.use(express.json());
  registerWarehouseLockerSimulatorRoutes(app);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('warehouse locker simulator routes expose capabilities and run a default simulation', async () => {
  const capabilities = await getJson('/api/warehouse-locker-simulator/capabilities');
  assert.equal(capabilities.status, 200);
  assert.equal(capabilities.body.ok, true);
  assert.deepEqual(capabilities.body.data.protocols, ['mqtt', 'http', 'modbus']);
  assert.equal(capabilities.body.data.privacy.rawPayloadStored, false);

  const simulation = await postJson('/api/warehouse-locker-simulator/run', {
    generatedAt: '2026-06-18T15:30:00.000Z',
    script: [
      { protocol: 'mqtt', operation: 'sensor', topicAlias: 'local/locker/sensor' },
      { protocol: 'http', operation: 'command-ack', httpPathAlias: '/local/locker/ack' },
      { protocol: 'modbus', operation: 'command-ack', modbusUnitId: 4, modbusRegister: 40103, modbusValue: 1 },
    ],
  });

  assert.equal(simulation.status, 200);
  assert.equal(simulation.body.ok, true);
  assert.equal(simulation.body.data.state.scriptFrames, 3);
  assert.ok(simulation.body.data.protocolTotals.mqtt.inbound >= 1);
  assert.ok(simulation.body.data.protocolTotals.http.inbound >= 1);
  assert.ok(simulation.body.data.protocolTotals.modbus.inbound >= 1);
});

test('warehouse locker simulator route blocks raw payload material', async () => {
  const blocked = await postJson('/api/warehouse-locker-simulator/run', {
    script: [
      {
        protocol: 'http',
        operation: 'command-ack',
        rawPayload: 'raw-qr-copy',
        pin: '123456',
      },
    ],
  });

  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.ok, false);
  assert.equal(blocked.body.data.state.rejectedFrames, 1);
  assert.match(blocked.body.error, /blocked private material/i);
  assert.doesNotMatch(JSON.stringify(blocked.body), /raw-qr-copy|123456/);
});
