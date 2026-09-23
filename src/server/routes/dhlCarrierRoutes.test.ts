import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import express from 'express';

import { DhlEcommerceAmericasV4Adapter, MyDhlExpressAdapter } from '../carriers/dhl/dhlAdapters';
import { DhlShipmentRouter, createInMemoryDhlProductCodeStore } from '../carriers/dhl/dhlShipmentRouter';
import { assertModulesDoNotImportScripts } from '../../lib/veygritImportBoundary.testHelper';
import { registerDhlCarrierRoutes } from './dhlCarrierRoutes';

test('server carrier route and adapter modules do not import script fixtures', () => {
  assertModulesDoNotImportScripts([
    'src/server/routes/upsCarrierRoutes.ts',
    'src/server/routes/dhlCarrierRoutes.ts',
    'src/server/routes/carrierWaybillAddressRoutes.ts',
    'src/server/carriers/ups/upsConnector.ts',
    'src/server/carriers/dhl/dhlAdapters.ts',
    'src/server/carriers/dhl/dhlHttp.ts',
    'src/server/carriers/dhl/dhlShipmentRouter.ts',
  ]);
});

let server: Server;
let baseUrl = '';
let upstreamCalls = 0;

before(async () => {
  const fetchImpl: typeof fetch = async input => {
    upstreamCalls += 1;
    const url = String(input);
    if (url.endsWith('/auth/v4/accesstoken')) return new Response(JSON.stringify({ access_token: 'token', expires_in: 3600 }), { status: 200 });
    return new Response(JSON.stringify({ packageId: 'PKG-1', dhlPackageId: 'DHL-1' }), { status: 200 });
  };
  const dependencies = { fetch: fetchImpl, requestId: () => 'route-dhl-request' };
  const router = new DhlShipmentRouter(
    new MyDhlExpressAdapter({ baseUrl: 'https://express.api.dhl.com/mydhlapi/test', username: 'user', password: 'pass', accountNumber: '123456789' }, dependencies),
    new DhlEcommerceAmericasV4Adapter({ baseUrl: 'https://api-sandbox.dhlecs.com', clientId: 'id', clientSecret: 'secret', pickupAccount: '5234567', distributionCenter: 'USEWR1' }, dependencies),
    createInMemoryDhlProductCodeStore(),
  );
  const app = express();
  app.use(express.json());
  registerDhlCarrierRoutes(app, { internalApiKey: 'internal-key', router });
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });

test('unified DHL Shipment API requires internal authentication before carrier traffic', async () => {
  const beforeCalls = upstreamCalls;
  const response = await fetch(`${baseUrl}/api/internal/carriers/dhl/shipments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'no-store, private');
  assert.equal(upstreamCalls, beforeCalls);
});

test('unified DHL Shipment API selects eCommerce v4 for US domestic', async () => {
  const response = await fetch(`${baseUrl}/api/internal/carriers/dhl/shipments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-veygrit-internal-key': 'internal-key' },
    body: JSON.stringify({ merchantRef: 'merchant-1', shipmentRef: 'route-ship-1', originCountryCode: 'US', destinationCountryCode: 'US', productIdCode: 'GND', labelFormat: 'PDF', payload: { packageId: 'PKG-1' } }),
  });
  const body = await response.json() as { ok: boolean; selectedAdapter: string; productIdCode: string; productNameStored: boolean };
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.selectedAdapter, 'ecommerce-americas-v4');
  assert.equal(body.productIdCode, 'GND');
  assert.equal(body.productNameStored, false);
});

test('unified DHL Shipment API rejects product names as identifiers', async () => {
  const response = await fetch(`${baseUrl}/api/internal/carriers/dhl/shipments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-veygrit-internal-key': 'internal-key' },
    body: JSON.stringify({ merchantRef: 'merchant-1', shipmentRef: 'route-ship-2', originCountryCode: 'US', destinationCountryCode: 'US', productName: 'DHL Ground', productIdCode: 'GND', payload: {} }),
  });
  assert.equal(response.status, 400);
  assert.match(await response.text(), /productName is not accepted/);
});

test('DHL Manifest and Void routes stay behind the same internal boundary', async () => {
  const headers = { 'content-type': 'application/json', 'x-veygrit-internal-key': 'internal-key' };
  const manifest = await fetch(`${baseUrl}/api/internal/carriers/dhl/ecommerce/manifests`, { method: 'POST', headers, body: JSON.stringify({ payload: { manifests: [{ packageIds: ['PKG-1'] }] } }) });
  assert.equal(manifest.status, 200);
  const voided = await fetch(`${baseUrl}/api/internal/carriers/dhl/shipments/route-ship-1`, { method: 'DELETE', headers, body: JSON.stringify({ packageId: 'PKG-1', dhlPackageId: 'DHL-1' }) });
  assert.equal(voided.status, 200);
});
