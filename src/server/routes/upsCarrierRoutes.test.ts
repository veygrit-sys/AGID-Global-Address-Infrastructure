import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import express from 'express';

import { UpsConnector } from '../carriers/ups/upsConnector';
import { registerUpsCarrierRoutes } from './upsCarrierRoutes';

let server: Server;
let baseUrl = '';
let upstreamCalls = 0;

before(async () => {
  const connector = new UpsConnector({
    baseUrl: 'https://wwwcie.ups.com',
    clientId: 'test-client',
    clientSecret: 'test-secret',
    maxSafeRetries: 0,
  }, {
    requestId: () => 'route0123456789abcdef0123456789a',
    fetch: async input => {
      upstreamCalls += 1;
      const url = String(input);
      if (url.endsWith('/security/v1/oauth/token')) {
        return new Response(JSON.stringify({ access_token: 'route-token', expires_in: '3600' }), { status: 200 });
      }
      if (url.includes('/rating/')) {
        return new Response(JSON.stringify({ RateResponse: { RatedShipment: [{ Service: { Code: '03' } }] } }), { status: 200 });
      }
      if (url.includes('/shipments/')) {
        return new Response(JSON.stringify({ response: { errors: [{ code: 'UPS_WRITE_FAILURE', message: 'Write failed' }] } }), { status: 503 });
      }
      return new Response('{}', { status: 200 });
    },
  });
  const app = express();
  app.use(express.json());
  registerUpsCarrierRoutes(app, { internalApiKey: 'route-internal-key', connector });
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('UPS internal routes reject unauthenticated requests before connector traffic', async () => {
  const beforeCalls = upstreamCalls;
  const response = await fetch(`${baseUrl}/api/internal/carriers/ups/rates`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payload: { RateRequest: {} } }),
  });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'no-store, private');
  assert.equal(upstreamCalls, beforeCalls);
});

test('UPS Rating route returns the normalized connector envelope', async () => {
  const response = await fetch(`${baseUrl}/api/internal/carriers/ups/rates`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-veygrit-internal-key': 'route-internal-key' },
    body: JSON.stringify({ payload: { RateRequest: {} }, options: { requestOption: 'Shop' } }),
  });
  const body = await response.json() as { ok: boolean; carrier: string; operation: string; data: Record<string, unknown> };
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.carrier, 'ups');
  assert.equal(body.operation, 'rating');
  assert.ok(body.data.RateResponse);
});

test('UPS Shipment route maps 5xx to a safe common error without retry', async () => {
  const beforeCalls = upstreamCalls;
  const response = await fetch(`${baseUrl}/api/internal/carriers/ups/shipments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-veygrit-internal-key': 'route-internal-key' },
    body: JSON.stringify({ payload: { ShipmentRequest: {} } }),
  });
  const body = await response.json() as {
    ok: boolean;
    operation: string;
    error: { code: string; outcomeUnknown: boolean; automaticRetryCount: number };
  };
  assert.equal(response.status, 503);
  assert.equal(body.ok, false);
  assert.equal(body.operation, 'shipment');
  assert.equal(body.error.code, 'UPS_WRITE_FAILURE');
  assert.equal(body.error.outcomeUnknown, true);
  assert.equal(body.error.automaticRetryCount, 0);
  assert.equal(upstreamCalls - beforeCalls, 1);
});

test('UPS internal routes reject malformed payloads without echoing request data', async () => {
  const response = await fetch(`${baseUrl}/api/internal/carriers/ups/address-validation`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-veygrit-internal-key': 'route-internal-key' },
    body: JSON.stringify({ payload: 'secret-address' }),
  });
  const bodyText = await response.text();
  assert.equal(response.status, 400);
  assert.doesNotMatch(bodyText, /secret-address/);
  assert.match(bodyText, /payload object is required/);
});
