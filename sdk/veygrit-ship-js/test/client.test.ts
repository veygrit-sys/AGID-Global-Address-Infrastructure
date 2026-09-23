import assert from 'node:assert/strict';
import test from 'node:test';
import { VeygritShip, VeygritShipError } from '../src/index.js';

test('shipment create sends auth, request ID, and idempotency key', async () => {
  let captured: { url?: string; init?: RequestInit } = {};
  const client = new VeygritShip({ apiKey: 'server-key', maxRetries: 0, fetch: async (url, init) => { captured = { url: String(url), init }; return new Response(JSON.stringify({ shipment: { shipmentRef: 'shp_1' } }), { status: 201, headers: { 'content-type': 'application/json' } }); } });
  await client.shipments.create({ rateQuoteRef: 'rate_1' }, { idempotencyKey: 'order_1' });
  const headers = captured.init?.headers as Record<string,string>;
  assert.equal(captured.url, 'https://api.veygrit.com/v1/shipments');
  assert.equal(headers.authorization, 'Bearer server-key');
  assert.equal(headers['idempotency-key'], 'order_1');
  assert.ok(headers['x-request-id']);
});

test('structured API errors preserve request ID', async () => {
  const client = new VeygritShip({ apiKey: 'server-key', maxRetries: 0, fetch: async () => new Response(JSON.stringify({ error: 'invalid_address', message: 'Invalid address' }), { status: 422, headers: { 'content-type': 'application/json', 'x-request-id': 'req_1' } }) });
  await assert.rejects(() => client.rates.create({}), (error: unknown) => error instanceof VeygritShipError && error.code === 'invalid_address' && error.requestId === 'req_1');
});
