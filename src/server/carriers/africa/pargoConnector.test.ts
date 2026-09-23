import assert from 'node:assert/strict';
import test from 'node:test';
import { PargoConnector, PargoConnectorError } from './pargoConnector';

const config = () => ({
  environment: 'sandbox' as const,
  username: 'synthetic-user@example.invalid',
  password: 'synthetic-password',
});

test('Pargo authenticates and creates an order on the official staging endpoint', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new PargoConnector(config(), {
    requestId: () => 'pargo-request-1',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/auth')) {
        return new Response(JSON.stringify({
          access_token: 'synthetic-access-token',
          refresh_token: 'synthetic-refresh-token',
          expires_in: 4200,
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { type: 'W2P' } }), { status: 201 });
    },
  });

  const result = await connector.createOrder({ data: { type: 'W2P', attributes: { trackingCode: 'synthetic' } } });
  assert.equal(result.carrier, 'pargo');
  assert.equal(calls[0].url, 'https://api.staging.pargo.co.za/auth');
  assert.equal(calls[1].url, 'https://api.staging.pargo.co.za/orders');
  const headers = calls[1].init?.headers as Record<string, string>;
  assert.equal(headers.authorization, 'Bearer synthetic-access-token');
  assert.doesNotMatch(JSON.stringify(calls[1].init?.body), /synthetic-password/);
});

test('Pargo safely retries quotation reads but never replays an unknown order write', async () => {
  let quotationCalls = 0;
  const quotation = new PargoConnector({ ...config(), maxSafeRetries: 1 }, {
    requestId: () => 'pargo-request-2',
    sleep: async () => undefined,
    fetch: async url => {
      if (String(url).endsWith('/auth')) {
        return new Response(JSON.stringify({ access_token: 'synthetic-access-token', expires_in: 4200 }), { status: 200 });
      }
      quotationCalls += 1;
      if (quotationCalls === 1) return new Response(JSON.stringify({ errors: [] }), { status: 503 });
      return new Response(JSON.stringify({ data: { price: 100 } }), { status: 200 });
    },
  });
  const rate = await quotation.getQuotation({ data: { type: 'W2D', attributes: {} } });
  assert.equal(rate.operation, 'rate');
  assert.equal(quotationCalls, 2);

  let orderCalls = 0;
  const order = new PargoConnector(config(), {
    requestId: () => 'pargo-request-3',
    fetch: async url => {
      if (String(url).endsWith('/auth')) {
        return new Response(JSON.stringify({ access_token: 'synthetic-access-token', expires_in: 4200 }), { status: 200 });
      }
      orderCalls += 1;
      throw new Error('network disconnected');
    },
  });
  await assert.rejects(
    order.createOrder({ data: { type: 'W2D', attributes: {} } }),
    (error: unknown) => error instanceof PargoConnectorError
      && error.common.code === 'PARGO_NETWORK'
      && error.common.outcomeUnknown,
  );
  assert.equal(orderCalls, 1);
});

test('Pargo cancellation uses the documented orders update contract', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new PargoConnector(config(), {
    requestId: () => 'pargo-request-4',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/auth')) {
        return new Response(JSON.stringify({ access_token: 'synthetic-access-token', expires_in: 4200 }), { status: 200 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    },
  });

  await connector.cancelOrder('PAR-synthetic');
  assert.equal(calls[1].url, 'https://api.staging.pargo.co.za/orders/update');
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), {
    data: [{ orderReference: 'PAR-synthetic', cancel: 'true' }],
  });
});

test('Pargo exposes pickup points, approved Route Guide autocomplete and inbound webhook normalization', async () => {
  const calls: string[] = [];
  const connector = new PargoConnector({
    ...config(),
    addressAutocompletePath: '/contract-route-guide',
  }, {
    requestId: () => `pargo-${calls.length}`,
    fetch: async url => {
      calls.push(String(url));
      if (String(url).endsWith('/auth')) {
        return new Response('{"access_token":"synthetic-token","expires_in":3600}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('{"data":[]}', { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  await connector.autocompleteAddress('Cape Town');
  await connector.listPickupPoints({ postalCode: '8001' });
  const webhook = connector.ingestWebhook({ event: 'order.updated', data: { orderReference: 'synthetic' } });

  assert.ok(calls.includes('https://api.staging.pargo.co.za/contract-route-guide?query=Cape+Town'));
  assert.ok(calls.includes('https://api.staging.pargo.co.za/pickup_points?postalCode=8001'));
  assert.equal(webhook.operation, 'webhook');
});
