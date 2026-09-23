import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ExpandedAfricaConnectorError,
  createColliveryConnector,
  createDodoTanzaniaConnector,
  createFezDeliveryConnector,
  createGiglConnector,
  createHaulstowConnector,
  createKwikDeliveryConnector,
  createLilwaDeliveryConnector,
  createRamCourierConnector,
} from './expandedAfricaConnector';

test('Collivery uses official V3 routes, app headers and query-token authentication', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createColliveryConnector({
    environment: 'production',
    apiToken: 'synthetic-collivery-token',
  }, {
    requestId: () => 'collivery-request',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response('{"data":{"id":123}}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('rate', { collection: {}, delivery: {} });
  await connector.execute('tracking', { colliveryId: 123 });

  assert.equal(calls[0]?.url, 'https://api.collivery.co.za/v3/quote?api_token=synthetic-collivery-token');
  assert.equal(calls[1]?.url, 'https://api.collivery.co.za/v3/status_tracking/123?api_token=synthetic-collivery-token');
  const headers = new Headers(calls[0]?.init?.headers);
  assert.equal(headers.get('x-app-name'), 'Veygrit Ship');
  assert.equal(headers.get('x-app-lang'), 'TypeScript');
  assert.doesNotMatch(String(calls[0]?.init?.body), /synthetic-collivery-token/);
});

test('RAM supports contract-issued SOAP routes without retrying an unknown consignment write', async () => {
  let attempts = 0;
  const connector = createRamCourierConnector({
    environment: 'sandbox',
    sandboxBaseUrl: 'https://ram.sandbox.example',
    productionBaseUrl: 'https://ram.production.example',
    auth: { type: 'basic', username: 'synthetic-user', password: 'synthetic-password' },
    routes: {
      shipment: {
        method: 'POST',
        path: '/DataServices/RAMCPShipperService.asmx',
        bodyEncoding: 'soap',
        soapAction: 'http://tempuri.org/ProcessConsignment',
        soapNamespace: 'http://tempuri.org/',
        safeToRetry: false,
      },
    },
  }, {
    requestId: () => 'ram-request',
    fetch: async (_url, init) => {
      attempts += 1;
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('soapaction'), 'http://tempuri.org/ProcessConsignment');
      assert.match(String(init?.body), /<ProcessConsignment xmlns="http:\/\/tempuri.org\/">/);
      throw new TypeError('network unavailable');
    },
  });

  await assert.rejects(
    connector.execute('shipment', { ProcessConsignment: { request: { reference: 'server-created' } } }),
    (error: unknown) => error instanceof ExpandedAfricaConnectorError
      && error.common.outcomeUnknown
      && error.common.retryable,
  );
  assert.equal(attempts, 1);
});

test('Lilwa production is gated by operator verification and approved contract', async () => {
  assert.throws(() => createLilwaDeliveryConnector({
    environment: 'production',
    apiKey: 'synthetic-lilwa-key',
    operatorVerified: false,
    contractApproved: false,
  }), /verified operator identity/);

  const seen: string[] = [];
  const connector = createLilwaDeliveryConnector({
    environment: 'production',
    apiKey: 'synthetic-lilwa-key',
    operatorVerified: true,
    contractApproved: true,
  }, {
    requestId: () => 'lilwa-request',
    fetch: async (url, init) => {
      seen.push(String(url));
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer synthetic-lilwa-key');
      return new Response('{"success":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('shipment', { pickup: {}, dropoff: {} });
  await connector.execute('tracking', { orderId: 'LD-synthetic' });
  await connector.execute('eta', { origin: {}, destination: {} });

  assert.deepEqual(seen, [
    'https://api.lilwadelivery.com/v2/deliveries',
    'https://api.lilwadelivery.com/v2/deliveries/LD-synthetic/track',
    'https://api.lilwadelivery.com/v2/eta/calculate',
  ]);
});

test('Fez uses its published sandbox order routes with both server-side headers', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createFezDeliveryConnector({
    environment: 'sandbox',
    accessToken: 'synthetic-fez-access-token',
    secretKey: 'synthetic-fez-secret-key',
    productionBaseUrl: 'https://merchant-issued.fez.example/v1',
  }, {
    requestId: () => 'fez-request',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response('{"status":"Success"}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('shipment', { uniqueID: 'synthetic-order' });
  await connector.execute('tracking', { orderNumber: 'synthetic-waybill' });

  assert.deepEqual(calls.map(call => call.url), [
    'https://apisandbox.fezdelivery.co/v1/order',
    'https://apisandbox.fezdelivery.co/v1/order/track/synthetic-waybill',
  ]);
  const headers = new Headers(calls[0]?.init?.headers);
  assert.equal(headers.get('authorization'), 'Bearer synthetic-fez-access-token');
  assert.equal(headers.get('secret-key'), 'synthetic-fez-secret-key');
  assert.doesNotMatch(String(calls[0]?.init?.body), /synthetic-fez-(access-token|secret-key)/);
});

test('Haulstow uses published Ghana partner routes and never retries an unknown cancellation', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let cancellationAttempts = 0;
  const connector = createHaulstowConnector({
    environment: 'production',
    apiKey: 'synthetic-haulstow-key',
  }, {
    requestId: () => 'haulstow-request',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/cancel')) {
        cancellationAttempts += 1;
        throw new TypeError('network unavailable');
      }
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('rate', { pickupAddress: 'synthetic-a', deliveryAddress: 'synthetic-b' });
  await connector.execute('tracking', { orderId: 'synthetic-order' });
  await assert.rejects(
    connector.execute('void', { orderId: 'synthetic-order' }),
    (error: unknown) => error instanceof ExpandedAfricaConnectorError
      && error.common.outcomeUnknown
      && error.common.retryable,
  );

  assert.deepEqual(calls.slice(0, 2).map(call => call.url), [
    'https://www.haulstow.co/api/partner/shipping/quote',
    'https://www.haulstow.co/api/partner/shipping/status?orderId=synthetic-order',
  ]);
  assert.equal(new Headers(calls[0]?.init?.headers).get('x-partner-key'), 'synthetic-haulstow-key');
  assert.equal(cancellationAttempts, 1);
});

test('contract-issued Sub-Saharan routes are environment-specific and HTTPS-only', async () => {
  const factories = [
    createKwikDeliveryConnector,
    createGiglConnector,
    createDodoTanzaniaConnector,
  ];

  for (const createConnector of factories) {
    assert.throws(() => createConnector({
      environment: 'sandbox',
      sandboxBaseUrl: 'http://carrier-sandbox.example',
      productionBaseUrl: 'https://carrier-production.example',
      auth: { type: 'api_key', headerName: 'x-carrier-key', value: 'synthetic-key' },
      routes: { tracking: { method: 'GET', path: '/tracking/{shipmentId}', safeToRetry: true } },
    }), /must use HTTPS/);

    const seen: string[] = [];
    const connector = createConnector({
      environment: 'sandbox',
      sandboxBaseUrl: 'https://carrier-sandbox.example',
      productionBaseUrl: 'https://carrier-production.example',
      auth: { type: 'api_key', headerName: 'x-carrier-key', value: 'synthetic-key' },
      routes: { tracking: { method: 'GET', path: '/tracking/{shipmentId}', safeToRetry: true } },
    }, {
      requestId: () => 'contract-request',
      fetch: async url => {
        seen.push(String(url));
        return new Response('{"ok":true}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    });
    await connector.execute('tracking', { shipmentId: 'synthetic-shipment' });
    assert.deepEqual(seen, ['https://carrier-sandbox.example/tracking/synthetic-shipment']);
  }
});
