import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { registerPrivateDeploymentRoutes } from './privateDeploymentRoutes';

let server: Server;
let baseUrl = '';

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'private-deployment-route-test-request-id',
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function getJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-AGID-Request-ID': 'private-deployment-route-test-request-id' },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

before(async () => {
  const app = express();
  app.use(express.json());
  registerPrivateDeploymentRoutes(app);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const addressInfo = server.address();
  assert.ok(addressInfo && typeof addressInfo === 'object');
  baseUrl = `http://127.0.0.1:${addressInfo.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('private deployment capability route reports supported sectors and public-only boundary', async () => {
  const response = await getJson('/api/private-deployments/capabilities');

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.modelVersion, 'agid-private-deployment-v1');
  assert.ok(response.body.data.sectors.includes('municipality'));
  assert.ok(response.body.data.sectors.includes('ngo'));
  assert.ok(response.body.data.sectors.includes('carrier'));
  assert.equal(response.body.data.privacy.privateMaterialAccepted, false);
  assert.equal(response.body.data.privacy.rawWitnessStorage, false);
});

test('private deployment plan route builds a carrier terminal deployment plan', async () => {
  const response = await postJson('/api/private-deployments/plan', {
    requestedAt: '2026-06-17T00:00:00.000Z',
    tenantId: 'carrier-private-terminal',
    sector: 'carrier',
    countryCodes: ['jp', 'sg'],
    expectedDailyEvents: 120_000,
    peakEventsPerSecond: 80,
    posTerminals: 120,
    requiresPublicDashboard: true,
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.accepted, true);
  assert.equal(response.body.data.sector, 'carrier');
  assert.equal(response.body.data.storage.primaryLedger, 'postgres');
  assert.equal(response.body.data.storage.hotCache, 'redis');
  assert.equal(response.body.data.security.rawAoidStorage, false);
  assert.ok(response.body.data.components.some((component: any) => component.id === 'address-terminal-fleet'));
});

test('private deployment plan route rejects raw AGID and server-held witness mode', async () => {
  const response = await postJson('/api/private-deployments/plan', {
    sector: 'ngo',
    rawAgid: 'JP05AV8TJGH8',
    witnessMode: 'server-held-witness',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.data.accepted, false);
  assert.match(response.body.data.errors.join('\n'), /private-material-rejected/i);
  assert.match(response.body.data.errors.join('\n'), /server-held-witness-forbidden/i);
});
