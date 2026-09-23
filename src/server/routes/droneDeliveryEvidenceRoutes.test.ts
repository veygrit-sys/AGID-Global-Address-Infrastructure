import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { registerDroneDeliveryEvidenceRoutes } from './droneDeliveryEvidenceRoutes';

let server: Server;
let baseUrl = '';

async function getJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-AGID-Request-ID': 'drone-delivery-evidence-route-test' },
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
      'X-AGID-Request-ID': 'drone-delivery-evidence-route-test',
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
  registerDroneDeliveryEvidenceRoutes(app);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('drone delivery evidence routes expose capabilities and produce a public-safe receipt', async () => {
  const capabilities = await getJson('/api/drone-delivery-evidence/capabilities');
  assert.equal(capabilities.status, 200);
  assert.equal(capabilities.body.ok, true);
  assert.equal(capabilities.body.data.scope, 'delivery-evidence-and-reachability-only-no-flight-control');

  const receipt = await postJson('/api/drone-delivery-evidence/report', {
    deliveryId: 'route-delivery-secret',
    outcome: 'cannot-reach',
    problemKind: 'drone-landing-impossible',
    reporterType: 'drone-operator',
    reporterTrusted: true,
    deviceId: 'drone-device-secret',
    rawAddress: 'Secret delivery address',
    agid: 'DR01ROUTE999',
    highRiskMode: true,
    evidence: [
      { kind: 'signed-drone-telemetry', signed: true, containsPreciseTelemetry: true },
    ],
    now: '2026-06-18T13:00:00.000Z',
  });

  assert.equal(receipt.status, 200);
  assert.equal(receipt.body.ok, true);
  assert.equal(receipt.body.data.decision, 'share-restricted-operator-receipt');
  assert.equal(receipt.body.data.guarantees.autopilotCommandsEmitted, false);
  assert.doesNotMatch(JSON.stringify(receipt.body.data.publicApiProjection), /Secret delivery address|route-delivery-secret|drone-device-secret/i);
});
