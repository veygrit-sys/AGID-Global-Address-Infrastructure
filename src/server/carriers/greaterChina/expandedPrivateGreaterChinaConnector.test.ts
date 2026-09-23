import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ExpandedPrivateGreaterChinaConnectorError,
  createCainiaoExpressConnector,
  createDepponConnector,
  createJdLogisticsConnector,
  createStoExpressConnector,
  createYtoExpressConnector,
  createZtoExpressConnector,
  type PrivateGreaterChinaContractConfig,
} from './expandedPrivateGreaterChinaConnector';

function contract(
  overrides: Partial<PrivateGreaterChinaContractConfig> = {},
): PrivateGreaterChinaContractConfig {
  return {
    environment: 'sandbox',
    sandboxBaseUrl: 'https://carrier.sandbox.example',
    productionBaseUrl: 'https://carrier.production.example',
    auth: { type: 'api_key', headerName: 'x-contract-key', value: 'synthetic-key' },
    routes: {
      address_validation: { method: 'POST', path: '/addresses/validate', safeToRetry: true },
      rate: { method: 'POST', path: '/rates', safeToRetry: true },
      shipment: { method: 'POST', path: '/shipments', safeToRetry: false },
      label: { method: 'GET', path: '/labels/{waybill}', safeToRetry: true },
      tracking: { method: 'GET', path: '/tracking/{waybill}', safeToRetry: true },
    },
    ...overrides,
  };
}

test('ZTO uses only contract-issued host, route and server authentication values', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createZtoExpressConnector(contract(), {
    requestId: () => 'zto-request',
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
  assert.equal(new Headers(calls[0]?.init?.headers).get('x-veygrit-request-id'), 'zto-request');
});

test('YTO applies carrier signing only through the server-side signer callback', async () => {
  const connector = createYtoExpressConnector(contract({
    routes: {
      shipment: {
        method: 'POST',
        path: '/official',
        safeToRetry: false,
        bodyEncoding: 'form',
        serializedPayloadField: 'request_data',
      },
    },
    credentialPayload: { partner_id: 'synthetic-partner' },
    signRequest: ({ payload }) => ({
      headers: { 'x-official-signature': 'synthetic-signature' },
      payload: { ...payload, timestamp: 'synthetic-time' },
    }),
  }), {
    fetch: async (_url, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('x-official-signature'), 'synthetic-signature');
      const body = new URLSearchParams(String(init?.body));
      assert.equal(body.get('partner_id'), 'synthetic-partner');
      assert.equal(body.get('timestamp'), 'synthetic-time');
      assert.deepEqual(JSON.parse(body.get('request_data') ?? '{}'), { reference: 'server-created' });
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('shipment', { reference: 'server-created' });
});

test('STO shipment creation is never retried when the upstream outcome is unknown', async () => {
  let attempts = 0;
  const connector = createStoExpressConnector(contract(), {
    fetch: async () => {
      attempts += 1;
      throw new TypeError('network unavailable');
    },
  });

  await assert.rejects(
    connector.execute('shipment', { reference: 'server-created' }),
    (error: unknown) => (
      error instanceof ExpandedPrivateGreaterChinaConnectorError
      && error.common.outcomeUnknown
    ),
  );
  assert.equal(attempts, 1);
});

test('Deppon safe reads retry 429 and preserve the request ID', async () => {
  let attempts = 0;
  const connector = createDepponConnector(contract(), {
    requestId: () => 'deppon-request',
    sleep: async () => {},
    fetch: async (_url, init) => {
      attempts += 1;
      assert.equal(new Headers(init?.headers).get('x-veygrit-request-id'), 'deppon-request');
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

test('JD Logistics keeps binary labels intact for secure object-storage handling', async () => {
  const connector = createJdLogisticsConnector(contract(), {
    fetch: async () => new Response(Uint8Array.from([1, 2, 3]), {
      status: 200,
      headers: { 'content-type': 'application/pdf' },
    }),
  });

  const result = await connector.execute('label', { waybill: 'synthetic-waybill' });
  assert.deepEqual(result.data, Uint8Array.from([1, 2, 3]));
});

test('Cainiao accepts contract-issued multi-header authentication without copying it into payloads', async () => {
  const connector = createCainiaoExpressConnector(contract({
    auth: {
      type: 'header_set',
      values: {
        'x-app-key': 'synthetic-app-key',
        'x-app-signature': 'synthetic-app-signature',
      },
    },
  }), {
    fetch: async (_url, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('x-app-key'), 'synthetic-app-key');
      assert.equal(headers.get('x-app-signature'), 'synthetic-app-signature');
      assert.equal(String(init?.body).includes('synthetic-app-key'), false);
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('rate', { origin: 'synthetic-origin' });
});

test('all expanded Greater China carrier base URLs must use HTTPS', () => {
  assert.throws(
    () => createZtoExpressConnector(contract({ sandboxBaseUrl: 'http://unsafe.example' })),
    /must use HTTPS/,
  );
});
