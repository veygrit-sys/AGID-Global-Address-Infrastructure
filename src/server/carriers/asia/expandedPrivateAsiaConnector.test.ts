import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ExpandedPrivateAsiaConnectorError,
  createBlueDartConnector,
  createDtdcConnector,
  createDomexLkConnector,
  createECourierBdConnector,
  createFlashExpressConnector,
  createGdexConnector,
  createGhnConnector,
  createGhtkConnector,
  createGoSendConnector,
  createGrabExpressConnector,
  createJneConnector,
  createLeopardsCourierConnector,
  createNepalCanMoveConnector,
  createPathaoCourierConnector,
  type PrivateAsiaContractConfig,
} from './expandedPrivateAsiaConnector';

function contract(
  overrides: Partial<PrivateAsiaContractConfig> = {},
): PrivateAsiaContractConfig {
  return {
    environment: 'sandbox',
    sandboxBaseUrl: 'https://carrier.sandbox.example',
    productionBaseUrl: 'https://carrier.production.example',
    auth: { type: 'api_key', headerName: 'x-contract-key', value: 'synthetic-key' },
    routes: {
      rate: { method: 'POST', path: '/rates', safeToRetry: true },
      shipment: { method: 'POST', path: '/shipments', safeToRetry: false },
      tracking: { method: 'GET', path: '/tracking/{waybill}', safeToRetry: true },
    },
    ...overrides,
  };
}

test('Blue Dart uses only contract-issued environment, route and authentication values', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createBlueDartConnector(contract(), {
    requestId: () => 'blue-dart-request',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response('{"status":"ok"}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('tracking', { waybill: 'synthetic-waybill' });

  assert.equal(calls[0]?.url, 'https://carrier.sandbox.example/tracking/synthetic-waybill');
  assert.equal(new Headers(calls[0]?.init?.headers).get('x-contract-key'), 'synthetic-key');
  assert.equal(new Headers(calls[0]?.init?.headers).get('x-veygrit-request-id'), 'blue-dart-request');
});

test('myGDEX supports the two contract-issued authentication headers without exposing them in payloads', async () => {
  const connector = createGdexConnector(contract({
    auth: {
      type: 'header_set',
      values: {
        'x-subscription-key': 'synthetic-subscription',
        'x-user-token': 'synthetic-user-token',
      },
    },
  }), {
    fetch: async (_url, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('x-subscription-key'), 'synthetic-subscription');
      assert.equal(headers.get('x-user-token'), 'synthetic-user-token');
      assert.equal(String(init?.body).includes('synthetic-subscription'), false);
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('rate', { origin: 'synthetic-origin' });
});

test('DTDC shipment creation is never retried when the result is unknown', async () => {
  let attempts = 0;
  const connector = createDtdcConnector(contract(), {
    fetch: async () => {
      attempts += 1;
      throw new TypeError('network unavailable');
    },
  });

  await assert.rejects(
    connector.execute('shipment', { reference: 'server-created' }),
    (error: unknown) => error instanceof ExpandedPrivateAsiaConnectorError && error.common.outcomeUnknown,
  );
  assert.equal(attempts, 1);
});

test('JNE safe reads retry 429 while writes remain explicitly configured', async () => {
  let attempts = 0;
  const connector = createJneConnector(contract(), {
    sleep: async () => {},
    fetch: async () => {
      attempts += 1;
      if (attempts === 1) {
        return new Response('{"message":"slow down"}', {
          status: 429,
          headers: { 'content-type': 'application/json', 'retry-after': '0' },
        });
      }
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const result = await connector.execute('tracking', { waybill: 'synthetic-waybill' });
  assert.equal(result.status, 200);
  assert.equal(attempts, 2);
});

test('all private Asia carrier base URLs must be HTTPS', () => {
  assert.throws(
    () => createBlueDartConnector(contract({ sandboxBaseUrl: 'http://unsafe.example' })),
    /must use HTTPS/,
  );
});

test('GHN selects the official sandbox gateway and sends server-resolved account headers', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createGhnConnector({
    environment: 'sandbox',
    token: 'synthetic-ghn-token',
    shopId: 'synthetic-shop',
  }, {
    requestId: () => 'ghn-request',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response('{"code":200,"data":{"total":25000}}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('rate', { from_district_id: 1, to_district_id: 2, weight: 1000 });

  assert.equal(
    calls[0]?.url,
    'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee',
  );
  const headers = new Headers(calls[0]?.init?.headers);
  assert.equal(headers.get('token'), 'synthetic-ghn-token');
  assert.equal(headers.get('shopid'), 'synthetic-shop');
  assert.equal(String(calls[0]?.init?.body).includes('synthetic-ghn-token'), false);
});

test('GHN cancel is a non-replayable carrier write', async () => {
  let attempts = 0;
  const connector = createGhnConnector({
    environment: 'production',
    token: 'synthetic-ghn-token',
    shopId: 'synthetic-shop',
  }, {
    fetch: async () => {
      attempts += 1;
      throw new TypeError('unknown carrier outcome');
    },
  });

  await assert.rejects(
    connector.execute('void', { order_codes: ['synthetic-order'] }),
    (error: unknown) => error instanceof ExpandedPrivateAsiaConnectorError
      && error.common.outcomeUnknown,
  );
  assert.equal(attempts, 1);
});

test('GHTK uses documented production routes and preserves PDF labels as bytes', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createGhtkConnector({
    environment: 'production',
    token: 'synthetic-ghtk-token',
    partnerCode: 'synthetic-partner',
  }, {
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/services/label/')) {
        return new Response(new Uint8Array([37, 80, 68, 70]), {
          status: 200,
          headers: { 'content-type': 'application/pdf' },
        });
      }
      return new Response('{"success":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('rate', {
    pick_province: 'synthetic-origin',
    pick_district: 'synthetic-origin-district',
    province: 'synthetic-destination',
    district: 'synthetic-destination-district',
    weight: 1000,
  });
  const label = await connector.execute('label', {
    trackingOrder: 'synthetic-order',
    original: 'portrait',
    page_size: 'A6',
  });

  assert.match(calls[0]?.url ?? '', /^https:\/\/services\.giaohangtietkiem\.vn\/services\/shipment\/fee\?/);
  assert.match(calls[1]?.url ?? '', /\/services\/label\/synthetic-order\?/);
  assert.equal(new Headers(calls[0]?.init?.headers).get('x-client-source'), 'synthetic-partner');
  assert.deepEqual(label.data, new Uint8Array([37, 80, 68, 70]));
});

test('GHTK requires the carrier-issued sandbox hostname', () => {
  assert.throws(
    () => createGhtkConnector({
      environment: 'sandbox',
      token: 'synthetic-token',
      partnerCode: 'synthetic-partner',
    }),
    /GHTK sandbox base URL/,
  );
});

test('GHTK cancellation is not automatically replayed after an unknown outcome', async () => {
  let attempts = 0;
  const connector = createGhtkConnector({
    environment: 'production',
    token: 'synthetic-token',
    partnerCode: 'synthetic-partner',
  }, {
    fetch: async () => {
      attempts += 1;
      throw new TypeError('unknown carrier outcome');
    },
  });

  await assert.rejects(
    connector.execute('void', { trackingOrder: 'synthetic-order' }),
    (error: unknown) => error instanceof ExpandedPrivateAsiaConnectorError
      && error.common.outcomeUnknown,
  );
  assert.equal(attempts, 1);
});

test('GrabExpress, GoSend and Flash Express remain contract-routed over HTTPS', () => {
  for (const factory of [
    createGrabExpressConnector,
    createGoSendConnector,
    createFlashExpressConnector,
  ]) {
    assert.throws(
      () => factory(contract({ sandboxBaseUrl: 'http://unsafe.example' })),
      /must use HTTPS/,
    );
    const connector = factory(contract());
    assert.equal(connector.config.baseUrl, 'https://carrier.sandbox.example');
  }
});

test('eCourier Bangladesh uses its published staging routes and server-resolved headers', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createECourierBdConnector({
    environment: 'sandbox',
    apiKey: 'synthetic-ecourier-key',
    apiSecret: 'synthetic-ecourier-secret',
    userId: 'synthetic-ecourier-user',
  }, {
    requestId: () => 'ecourier-request',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response('{"response_code":200,"message":"Success"}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('shipment', { product_id: 'server-created-reference' });

  assert.equal(calls[0]?.url, 'https://staging.ecourier.com.bd/api/order-place');
  const headers = new Headers(calls[0]?.init?.headers);
  assert.equal(headers.get('api-key'), 'synthetic-ecourier-key');
  assert.equal(headers.get('api-secret'), 'synthetic-ecourier-secret');
  assert.equal(headers.get('user-id'), 'synthetic-ecourier-user');
  assert.equal(String(calls[0]?.init?.body).includes('synthetic-ecourier-secret'), false);
});

test('eCourier Bangladesh cancellation is not replayed when its outcome is unknown', async () => {
  let attempts = 0;
  const connector = createECourierBdConnector({
    environment: 'production',
    apiKey: 'synthetic-key',
    apiSecret: 'synthetic-secret',
    userId: 'synthetic-user',
  }, {
    fetch: async () => {
      attempts += 1;
      throw new TypeError('unknown carrier outcome');
    },
  });

  await assert.rejects(
    connector.execute('void', { tracking: 'synthetic-tracking', comment: 'server-approved' }),
    (error: unknown) => error instanceof ExpandedPrivateAsiaConnectorError
      && error.common.outcomeUnknown,
  );
  assert.equal(attempts, 1);
});

test('Pathao, Leopards, Domex and Nepal Can Move accept only carrier-issued HTTPS routes', () => {
  for (const factory of [
    createPathaoCourierConnector,
    createLeopardsCourierConnector,
    createDomexLkConnector,
    createNepalCanMoveConnector,
  ]) {
    assert.throws(
      () => factory(contract({
        environment: 'production',
        productionBaseUrl: 'http://unsafe.example',
      })),
      /must use HTTPS/,
    );
    const connector = factory(contract({ environment: 'production' }));
    assert.equal(connector.config.baseUrl, 'https://carrier.production.example');
  }
});
