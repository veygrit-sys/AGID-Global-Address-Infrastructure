import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { registerExternalPosRoutes } from './externalPosRoutes';

const servers: Server[] = [];

after(async () => {
  await Promise.all(servers.map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

async function createServer(config: unknown, connectorFetch: Parameters<typeof registerExternalPosRoutes>[1]['connectorFetch']) {
  const originalConfig = process.env.AGID_EXTERNAL_POS_APIS_JSON;
  const originalToken = process.env.AGID_EXTERNAL_POS_CONNECTOR_TOKEN;
  process.env.AGID_EXTERNAL_POS_APIS_JSON = JSON.stringify(config);
  process.env.AGID_EXTERNAL_POS_CONNECTOR_TOKEN = 'test-pos-connector-token';
  const app = express();
  app.use(express.json());
  registerExternalPosRoutes(app, { connectorFetch });
  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  if (originalConfig === undefined) {
    delete process.env.AGID_EXTERNAL_POS_APIS_JSON;
  } else {
    process.env.AGID_EXTERNAL_POS_APIS_JSON = originalConfig;
  }
  if (originalToken === undefined) {
    delete process.env.AGID_EXTERNAL_POS_CONNECTOR_TOKEN;
  } else {
    process.env.AGID_EXTERNAL_POS_CONNECTOR_TOKEN = originalToken;
  }
  return `http://127.0.0.1:${address.port}`;
}

test('external POS routes expose capabilities without leaking endpoint configuration', async () => {
  const baseUrl = await createServer([
    {
      id: 'store-pos',
      providerId: 'store-pos',
      name: 'Store POS',
      adapter: 'agid-pos-json-v1',
      operations: ['receipt-export'],
      privacyMode: 'receipt-only',
      endpoint: 'https://pos.example/receipt',
      apiKeyEnv: 'AGID_TEST_POS_KEY',
    },
  ], async () => new Response('{}', { status: 200 }));

  const response = await fetch(`${baseUrl}/api/pos/external/capabilities`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.serverConfigured, true);
  assert.equal(body.data.apis[0].id, 'store-pos');
  assert.equal('endpoint' in body.data.apis[0], false);
  assert.equal('apiKeyEnv' in body.data.apis[0], false);
});

test('external POS import rejects runtime and customer material', async () => {
  const baseUrl = await createServer([], async () => new Response('{}', { status: 200 }));
  const response = await fetch(`${baseUrl}/api/pos/external/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'unsafe-pos',
      providerId: 'unsafe-pos',
      name: 'Unsafe POS',
      adapter: 'generic-json',
      operations: ['handoff-complete'],
      privacyMode: 'redacted-order',
      endpoint: 'https://pos.example/sync',
      apiKey: 'secret',
      customer: { name: 'Private Receiver' },
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.match(body.error, /must not contain runtime URLs/);
});

test('external POS route syncs handoff completion with redacted payload', async () => {
  const calls: any[] = [];
  const baseUrl = await createServer([
    {
      id: 'store-pos',
      providerId: 'store-pos',
      name: 'Store POS',
      adapter: 'agid-pos-json-v1',
      operations: ['handoff-complete', 'receipt-export'],
      privacyMode: 'redacted-order',
      endpoint: 'https://pos.example/handoff',
    },
  ], async (_url, options) => {
    calls.push(JSON.parse(String(options?.body ?? '{}')));
    return new Response(JSON.stringify({
      ok: true,
      status: 'synced',
      providerReference: 'pos-sync-1',
    }), { status: 200 });
  });

  const response = await fetch(`${baseUrl}/api/pos/external/handoff-complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-External-POS-Token': 'test-pos-connector-token',
    },
    body: JSON.stringify({
      posApiIds: ['store-pos'],
      receipt: {
        receiptId: 'receipt-1',
        accepted: true,
        status: 'accepted',
        channel: 'qr',
        terminalId: 'terminal-1',
        record: {
          recordType: 'ADDRESS',
          entityIdTail: 'TJGH8',
          agidTail: '8TJGH8',
          country: 'JP',
          city: 'Tokyo',
          postcode: '1000001',
          label: 'Address',
          rawPayloadStored: false,
        },
      },
      customer: { name: 'Private Receiver', phone: '+81-3-secret' },
      address: {
        countryCode: 'JP',
        city: 'Tokyo',
        postcode: '1000001',
        street: 'Private Street 1',
      },
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.operation, 'handoff-complete');
  assert.equal(body.data.results[0].providerReference, 'pos-sync-1');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].operation, 'handoff-complete');
  assert.equal(calls[0].customer, undefined);
  assert.equal(calls[0].address, undefined);
  assert.equal(calls[0].addressReference.city, 'Tokyo');
});

test('external POS operation rejects deprecated plaintext body flags', async () => {
  const baseUrl = await createServer([], async () => new Response('{}', { status: 200 }));
  const response = await fetch(`${baseUrl}/api/pos/external/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-External-POS-Token': 'test-pos-connector-token',
    },
    body: JSON.stringify({
      operation: 'receipt-export',
      allowPlaintextToExternalPos: true,
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.match(body.error, /Deprecated POS connector flags/);
});
