import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DhlEcommerceAmericasV4Adapter, MyDhlExpressAdapter, createDhlEcommerceAdapterFromEnv } from './dhlAdapters';
import { DhlAdapterError, DhlConfigurationError } from './dhlHttp';
import { DhlShipmentRouter, createDhlProductCodeStoreFromEnv, createInMemoryDhlProductCodeStore } from './dhlShipmentRouter';

type Call = { url: string; init?: RequestInit };
function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

function adapters(fetchImpl: typeof fetch, sleep: (ms: number) => Promise<void> = async () => {}) {
  const dependencies = { fetch: fetchImpl, sleep, random: () => 0.5, requestId: () => 'dhl-request-id' };
  return {
    express: new MyDhlExpressAdapter({ baseUrl: 'https://express.api.dhl.com/mydhlapi/test', username: 'express-user', password: 'express-pass', accountNumber: '123456789' }, dependencies),
    ecommerce: new DhlEcommerceAmericasV4Adapter({ baseUrl: 'https://api-sandbox.dhlecs.com', clientId: 'ecom-client', clientSecret: 'ecom-secret', pickupAccount: '5234567', distributionCenter: 'USEWR1' }, dependencies),
  };
}

test('MyDHL Express adapter uses BasicAuth and stores a carrier product code in the shipment payload', async () => {
  const calls: Call[] = [];
  const { express } = adapters(async (input, init) => {
    calls.push({ url: String(input), init });
    return json(201, { shipmentTrackingNumber: '1234567890', documents: [] });
  });
  const result = await express.createShipment({ productCode: 'NAME-WAS-WRONG', plannedShippingDateAndTime: '2026-07-19T10:00:00 GMT+00:00' }, 'P');
  assert.equal(result.adapter, 'mydhl-express');
  assert.equal(calls[0].url, 'https://express.api.dhl.com/mydhlapi/test/shipments');
  assert.equal(new Headers(calls[0].init?.headers).get('authorization'), `Basic ${Buffer.from('express-user:express-pass').toString('base64')}`);
  assert.equal((JSON.parse(String(calls[0].init?.body)) as Record<string, unknown>).productCode, 'P');
});

test('DHL eCommerce OAuth token is cached and labels use v4 code, pickup, and distribution center', async () => {
  const calls: Call[] = [];
  let tokenCalls = 0;
  const { ecommerce } = adapters(async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/auth/v4/accesstoken')) {
      tokenCalls += 1;
      return json(200, { access_token: 'ecom-token', token_type: 'Bearer', expires_in: 3600 });
    }
    return json(200, { packageId: 'PKG-1', dhlPackageId: 'DHL-1', labelData: 'base64' });
  });
  await ecommerce.createLabel({ packageId: 'PKG-1', orderedProductId: 'WRONG' }, 'GND', 'PDF');
  await ecommerce.findProducts({ pickup: '5234567', rate: { calculate: true } });
  assert.equal(tokenCalls, 1);
  const token = calls[0];
  assert.equal(token.url, 'https://api-sandbox.dhlecs.com/auth/v4/accesstoken');
  assert.match(String(token.init?.body), /grant_type=client_credentials/);
  assert.match(String(token.init?.body), /client_id=ecom-client/);
  assert.equal(new Headers(token.init?.headers).get('authorization'), `Basic ${Buffer.from('ecom-client:ecom-secret').toString('base64')}`);
  const label = calls[1];
  assert.equal(label.url, 'https://api-sandbox.dhlecs.com/shipping/v4/label?format=PDF');
  assert.equal(new Headers(label.init?.headers).get('authorization'), 'Bearer ecom-token');
  assert.deepEqual(JSON.parse(String(label.init?.body)), { packageId: 'PKG-1', orderedProductId: 'GND', pickup: '5234567', distributionCenter: 'USEWR1' });
  assert.equal(calls[2].url, 'https://api-sandbox.dhlecs.com/shipping/v4/products');
});

test('unified Shipment API routes US domestic to eCommerce and international to MyDHL Express', async () => {
  const calls: Call[] = [];
  const pair = adapters(async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/auth/v4/accesstoken')) return json(200, { access_token: 'token', expires_in: 3600 });
    return json(201, { created: true });
  });
  const store = createInMemoryDhlProductCodeStore();
  const router = new DhlShipmentRouter(pair.express, pair.ecommerce, store, () => new Date('2026-07-18T00:00:00Z'));

  const domestic = await router.createShipment({ merchantRef: 'merchant-1', shipmentRef: 'ship-domestic', originCountryCode: 'US', destinationCountryCode: 'US', productIdCode: 'GND', payload: { packageId: 'PKG-DOM' } });
  const international = await router.createShipment({ merchantRef: 'merchant-1', shipmentRef: 'ship-intl', originCountryCode: 'US', destinationCountryCode: 'JP', productIdCode: 'P', payload: {} });

  assert.equal(domestic.selectedAdapter, 'ecommerce-americas-v4');
  assert.equal(domestic.routingReason, 'us_domestic_default');
  assert.equal(domestic.productNameStored, false);
  assert.equal(international.selectedAdapter, 'mydhl-express');
  assert.equal(international.routingReason, 'international_express_default');
  assert.equal((await store.get('ship-domestic'))?.productIdCode, 'GND');
  assert.equal((await store.get('ship-domestic'))?.status, 'created');
  assert.equal('productName' in (await store.get('ship-domestic') as object), false);
  assert.ok(calls.some(call => call.url.includes('/shipping/v4/label')));
  assert.ok(calls.some(call => call.url.endsWith('/mydhlapi/test/shipments')));
});

test('router rejects a product name before persisting or contacting DHL', async () => {
  let calls = 0;
  const pair = adapters(async () => { calls += 1; return json(200, {}); });
  const store = createInMemoryDhlProductCodeStore();
  const router = new DhlShipmentRouter(pair.express, pair.ecommerce, store);
  await assert.rejects(
    router.createShipment({ merchantRef: 'merchant-1', shipmentRef: 'ship-bad-product', originCountryCode: 'US', destinationCountryCode: 'US', productIdCode: 'DHL Ground', payload: {} }),
    /product names are not accepted/,
  );
  assert.equal(await store.get('ship-bad-product'), undefined);
  assert.equal(calls, 0);
});

test('eCommerce Manifest create/get, Return Label, and domestic Void use official v4 endpoints', async () => {
  const calls: Call[] = [];
  const pair = adapters(async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/auth/v4/accesstoken')) return json(200, { access_token: 'token', expires_in: 3600 });
    return json(200, { ok: true });
  });
  const store = createInMemoryDhlProductCodeStore();
  const router = new DhlShipmentRouter(pair.express, pair.ecommerce, store);
  await router.createShipment({ merchantRef: 'merchant-1', shipmentRef: 'ship-1', originCountryCode: 'US', destinationCountryCode: 'US', productIdCode: 'GND', payload: { packageId: 'PKG-1' } });
  await router.createManifest({ manifests: [{ packageIds: ['PKG-1'] }] });
  await router.getManifest('request-1');
  await router.createReturnLabel({ merchantRef: 'merchant-1', shipmentRef: 'return-1', originCountryCode: 'US', destinationCountryCode: 'US', productIdCode: 'RGN', returnFormat: 'QR', payload: { packageDetail: {} } });
  await router.voidShipment('ship-1', 'PKG-1', 'DHL-1');
  const resourceCalls = calls.map(call => `${call.init?.method} ${new URL(call.url).pathname}${new URL(call.url).search}`);
  assert.ok(resourceCalls.includes('POST /shipping/v4/manifest'));
  assert.ok(resourceCalls.includes('GET /shipping/v4/manifest/5234567/request-1'));
  assert.ok(resourceCalls.includes('POST /returns/v4/label?format=QR'));
  assert.ok(resourceCalls.includes('DELETE /shipping/v4/label/5234567?packageId=PKG-1&dhlPackageId=DHL-1'));
});

test('Manifest product filter accepts codes and rejects names', async () => {
  let calls = 0;
  const { ecommerce } = adapters(async input => {
    calls += 1;
    if (String(input).endsWith('/auth/v4/accesstoken')) return json(200, { access_token: 'token', expires_in: 3600 });
    return json(200, {});
  });
  assert.throws(() => ecommerce.createManifest({ products: ['DHL Ground'], manifests: [] }), /three-letter product codes/);
  assert.equal(calls, 0);
});

test('MyDHL Express Void is explicitly unsupported instead of calling an invented endpoint', async () => {
  const pair = adapters(async (input) => {
    if (String(input).endsWith('/auth/v4/accesstoken')) return json(200, { access_token: 'token', expires_in: 3600 });
    return json(201, { created: true });
  });
  const store = createInMemoryDhlProductCodeStore();
  const router = new DhlShipmentRouter(pair.express, pair.ecommerce, store);
  await router.createShipment({ merchantRef: 'merchant-1', shipmentRef: 'ship-intl', originCountryCode: 'US', destinationCountryCode: 'DE', productIdCode: 'P', payload: {} });
  await assert.rejects(router.voidShipment('ship-intl', 'PKG-1'), (error: unknown) => {
    assert.ok(error instanceof DhlAdapterError);
    assert.equal(error.common.error.code, 'DHL_EXPRESS_VOID_NOT_AVAILABLE');
    assert.equal(error.common.error.category, 'unsupported');
    return true;
  });
});

test('write operations do not retry ambiguous 5xx while Product Finder retries safely', async () => {
  let productCalls = 0;
  let labelCalls = 0;
  const sleeps: number[] = [];
  const { ecommerce } = adapters(async (input) => {
    const url = String(input);
    if (url.endsWith('/auth/v4/accesstoken')) return json(200, { access_token: 'token', expires_in: 3600 });
    if (url.endsWith('/shipping/v4/products')) {
      productCalls += 1;
      return productCalls === 1 ? json(503, { type: 'https://api.dhlecs.com/docs/errors/503.0000001', title: 'Unavailable' }) : json(200, { products: [] });
    }
    labelCalls += 1;
    return json(503, { type: 'https://api.dhlecs.com/docs/errors/503.0000001', title: 'Unavailable' });
  }, async ms => { sleeps.push(ms); });
  const products = await ecommerce.findProducts({ pickup: '5234567' });
  assert.equal(products.automaticRetryCount, 1);
  assert.equal(productCalls, 2);
  await assert.rejects(ecommerce.createLabel({ packageId: 'PKG-1' }, 'GND'), (error: unknown) => {
    assert.ok(error instanceof DhlAdapterError);
    assert.equal(error.common.error.outcomeUnknown, true);
    assert.equal(error.common.error.automaticRetryCount, 0);
    return true;
  });
  assert.equal(labelCalls, 1);
  assert.deepEqual(sleeps, [250]);
});

test('eCommerce production endpoint fails closed without live traffic approval', () => {
  const env = {
    HEXASHIP_DHL_ECOMMERCE_BASE_URL: 'https://api.dhlecs.com',
    HEXASHIP_DHL_ECOMMERCE_CLIENT_ID: 'id',
    HEXASHIP_DHL_ECOMMERCE_CLIENT_SECRET: 'secret',
    HEXASHIP_DHL_ECOMMERCE_PICKUP_ACCOUNT: '5234567',
    HEXASHIP_DHL_ECOMMERCE_DISTRIBUTION_CENTER: 'USEWR1',
    HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED: 'false',
  } as NodeJS.ProcessEnv;
  assert.throws(() => createDhlEcommerceAdapterFromEnv(env), DhlConfigurationError);
  assert.doesNotThrow(() => createDhlEcommerceAdapterFromEnv({ ...env, HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED: 'true' }));
});

test('production routing requires durable product-code storage', () => {
  assert.throws(
    () => createDhlProductCodeStoreFromEnv({ NODE_ENV: 'production' }),
    (error: unknown) => error instanceof DhlConfigurationError && error.missingKeys.includes('VEYGRIT_SHIP_POSTGRES_URL'),
  );
  assert.doesNotThrow(() => createDhlProductCodeStoreFromEnv({ NODE_ENV: 'development' }));
});
