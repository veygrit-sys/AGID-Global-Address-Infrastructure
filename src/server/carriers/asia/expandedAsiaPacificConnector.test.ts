import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ExpandedAsiaPacificConnector,
  ExpandedAsiaPacificConnectorError,
  createJtExpressConnector,
  createLalamoveConnector,
  createLalamoveSignature,
  createNzCouriersConnector,
  createYamatoConnector,
} from './expandedAsiaPacificConnector';

test('Lalamove uses the documented lowercase HMAC-SHA256 authorization contract', async () => {
  const seen: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createLalamoveConnector({
    environment: 'sandbox',
    apiKey: 'synthetic-public-key',
    apiSecret: 'synthetic-secret',
    market: 'SG',
  }, {
    now: () => 1_545_880_607_433,
    requestId: () => 'request-lalamove',
    fetch: async (url, init) => {
      seen.push({ url: String(url), init });
      return new Response('{"data":{"quotationId":"synthetic"}}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('rate', { data: { serviceType: 'MOTORCYCLE' } });

  const body = JSON.stringify({ data: { serviceType: 'MOTORCYCLE' } });
  const signature = createLalamoveSignature(
    '1545880607433',
    'POST',
    '/v3/quotations',
    body,
    'synthetic-secret',
  );
  assert.equal(seen[0]?.url, 'https://rest.sandbox.lalamove.com/v3/quotations');
  assert.equal(new Headers(seen[0]?.init?.headers).get('authorization'), `hmac synthetic-public-key:1545880607433:${signature}`);
  assert.equal(new Headers(seen[0]?.init?.headers).get('market'), 'SG');
  assert.equal(new Headers(seen[0]?.init?.headers).get('request-id'), 'request-lalamove');
});

test('NZ Couriers caches OAuth and uses official consignment routes', async () => {
  const seen: string[] = [];
  const connector = createNzCouriersConnector({
    environment: 'sandbox',
    sandboxBaseUrl: 'https://sandbox.example.nz',
    productionBaseUrl: 'https://production.example.nz',
    tokenUrl: 'https://identity.example.nz/oauth/token',
    clientId: 'synthetic-client',
    clientSecret: 'synthetic-secret',
    carrierName: 'NZCouriers',
    customerId: 'customer-synthetic',
  }, {
    now: () => 1_700_000_000_000,
    requestId: () => 'request-nzc',
    fetch: async (url, init) => {
      seen.push(String(url));
      if (String(url).includes('/oauth/token')) {
        return new Response('{"access_token":"synthetic-token","expires_in":3600}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer synthetic-token');
      return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  await connector.execute('rate', { pickupAddress: { lat: -36.8, lon: 174.7 } });
  await connector.execute('label', { consignmentId: 'consignment-synthetic' });

  assert.equal(seen.filter(url => url.includes('/oauth/token')).length, 1);
  assert.ok(seen.includes('https://sandbox.example.nz/v1/carriers/NZCouriers/customers/customer-synthetic/rates'));
  assert.ok(seen.includes('https://sandbox.example.nz/v1/carriers/NZCouriers/customers/customer-synthetic/consignments/consignment-synthetic/labels'));
});

test('unknown write outcome is never retried or reported as success', async () => {
  let attempts = 0;
  const connector = new ExpandedAsiaPacificConnector({
    carrier: 'aramex_anz',
    environment: 'sandbox',
    baseUrl: 'https://aramex.sandbox.example',
    auth: { type: 'bearer', token: 'synthetic-token' },
    routes: {
      shipment: { method: 'POST', path: '/consignments', safeToRetry: false },
    },
  }, {
    fetch: async () => {
      attempts += 1;
      throw new TypeError('network unavailable');
    },
  });

  await assert.rejects(
    connector.execute('shipment', { reference: 'server-created' }),
    (error: unknown) => error instanceof ExpandedAsiaPacificConnectorError
      && error.common.outcomeUnknown
      && error.common.retryable,
  );
  assert.equal(attempts, 1);
});

test('contract-issued J&T and Yamato routes remain explicit and HTTPS-only', () => {
  const common = {
    environment: 'sandbox' as const,
    sandboxBaseUrl: 'https://sandbox.contract.example',
    productionBaseUrl: 'https://production.contract.example',
    auth: { type: 'api_key' as const, headerName: 'x-contract-key', value: 'synthetic' },
    routes: {
      shipment: { method: 'POST' as const, path: '/official/orders', safeToRetry: false },
      tracking: { method: 'GET' as const, path: '/official/orders/{orderId}', safeToRetry: true },
    },
  };
  assert.equal(createJtExpressConnector(common).config.carrier, 'jt_express');
  assert.equal(createYamatoConnector(common).config.carrier, 'yamato');
  assert.throws(() => createJtExpressConnector({ ...common, sandboxBaseUrl: 'http://unsafe.example' }));
});
