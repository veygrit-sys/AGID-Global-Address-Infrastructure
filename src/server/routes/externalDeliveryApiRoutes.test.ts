import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { registerExternalDeliveryApiRoutes } from './externalDeliveryApiRoutes';

const servers: Server[] = [];

after(async () => {
  await Promise.all(servers.map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

async function createServer(config: unknown, connectorFetch: Parameters<typeof registerExternalDeliveryApiRoutes>[1]['connectorFetch']) {
  const originalConfig = process.env.AGID_EXTERNAL_DELIVERY_APIS_JSON;
  const originalToken = process.env.AGID_EXTERNAL_DELIVERY_CONNECTOR_TOKEN;
  process.env.AGID_EXTERNAL_DELIVERY_APIS_JSON = JSON.stringify(config);
  process.env.AGID_EXTERNAL_DELIVERY_CONNECTOR_TOKEN = 'test-delivery-connector-token';
  const app = express();
  app.use(express.json());
  registerExternalDeliveryApiRoutes(app, { connectorFetch });
  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  if (originalConfig === undefined) {
    delete process.env.AGID_EXTERNAL_DELIVERY_APIS_JSON;
  } else {
    process.env.AGID_EXTERNAL_DELIVERY_APIS_JSON = originalConfig;
  }
  if (originalToken === undefined) {
    delete process.env.AGID_EXTERNAL_DELIVERY_CONNECTOR_TOKEN;
  } else {
    process.env.AGID_EXTERNAL_DELIVERY_CONNECTOR_TOKEN = originalToken;
  }
  return `http://127.0.0.1:${address.port}`;
}

test('external delivery API routes expose capabilities without leaking endpoint configuration', async () => {
  const baseUrl = await createServer([
    {
      id: 'carrier-demo',
      carrierId: 'carrier-demo',
      name: 'Carrier Demo',
      adapter: 'agid-delivery-json-v1',
      operations: ['tracking'],
      privacyMode: 'commitment-only',
      endpoint: 'https://carrier.example/track',
      apiKeyEnv: 'AGID_TEST_CARRIER_KEY',
    },
  ], async () => new Response('{}', { status: 200 }));

  const response = await fetch(`${baseUrl}/api/delivery/external/capabilities`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.serverConfigured, true);
  assert.equal(body.data.apis[0].id, 'carrier-demo');
  assert.equal('endpoint' in body.data.apis[0], false);
  assert.equal('apiKeyEnv' in body.data.apis[0], false);
});

test('external delivery API import rejects runtime and shipment material', async () => {
  const baseUrl = await createServer([], async () => new Response('{}', { status: 200 }));
  const response = await fetch(`${baseUrl}/api/delivery/external/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'unsafe-carrier',
      carrierId: 'unsafe-carrier',
      name: 'Unsafe Carrier',
      adapter: 'generic-json',
      operations: ['shipment-create'],
      privacyMode: 'redacted-shipping',
      endpoint: 'https://carrier.example/ship',
      apiKey: 'secret',
      recipient: { name: 'Private Receiver' },
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.match(body.error, /must not contain runtime URLs/);
});

test('external delivery API route creates shipment through allowlisted carrier with redacted payload', async () => {
  const calls: any[] = [];
  const baseUrl = await createServer([
    {
      id: 'carrier-demo',
      carrierId: 'carrier-demo',
      name: 'Carrier Demo',
      adapter: 'agid-delivery-json-v1',
      operations: ['shipment-create', 'tracking'],
      privacyMode: 'redacted-shipping',
      endpoint: 'https://carrier.example/ship',
    },
  ], async (_url, options) => {
    calls.push(JSON.parse(String(options?.body ?? '{}')));
    return new Response(JSON.stringify({
      ok: true,
      status: 'accepted',
      shipmentId: 'ship-123',
      trackingNumber: 'TRK123',
      label: {
        format: 'pdf',
        payload: 'base64-private-label',
      },
    }), { status: 200 });
  });

  const response = await fetch(`${baseUrl}/api/delivery/external/create-shipment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-External-Delivery-Token': 'test-delivery-connector-token',
    },
    body: JSON.stringify({
      deliveryApiIds: ['carrier-demo'],
      waybillAlias: 'WBA-123456789ABC',
      addressReferenceCommitment: 'addr-ref-commitment',
      recipient: { name: 'Private Receiver', phone: '+81-3-secret' },
      destination: {
        countryCode: 'JP',
        state: 'Tokyo',
        city: 'Chiyoda',
        street: 'Marunouchi',
        houseNumber: '1-9-1',
        postcode: '1000005',
      },
      parcel: { weightGrams: 500 },
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.operation, 'shipment-create');
  assert.equal(body.data.results[0].trackingNumber, 'TRK123');
  assert.equal(body.data.results[0].label.rawPayloadReturned, false);
  assert.match(body.data.results[0].warnings.join('\n'), /raw-label-payload-suppressed/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].operation, 'shipment-create');
  assert.equal(calls[0].recipient, undefined);
  assert.equal(calls[0].destination.street, undefined);
  assert.equal(calls[0].destination.houseNumber, undefined);
  assert.equal(calls[0].destination.city, 'Chiyoda');
});

test('external delivery operation rejects deprecated plaintext body flags', async () => {
  const baseUrl = await createServer([], async () => new Response('{}', { status: 200 }));
  const response = await fetch(`${baseUrl}/api/delivery/external/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-External-Delivery-Token': 'test-delivery-connector-token',
    },
    body: JSON.stringify({
      operation: 'tracking',
      allowPlaintextToExternalDeliveryApi: true,
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.match(body.error, /Deprecated delivery connector flags/);
});
