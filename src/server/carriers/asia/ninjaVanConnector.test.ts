import assert from 'node:assert/strict';
import test from 'node:test';
import { NinjaVanConnector, NinjaVanConnectorError } from './ninjaVanConnector';

const config = () => ({
  environment: 'sandbox' as const,
  countryCode: 'MY' as const,
  clientId: 'synthetic-client-id',
  clientSecret: 'synthetic-client-secret',
});

test('Ninja Van authenticates and creates an order on the official SG sandbox route', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new NinjaVanConnector(config(), {
    requestId: () => 'ninja-request-1',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/2.0/oauth/access_token')) {
        return new Response(JSON.stringify({ access_token: 'synthetic-access-token', expires_in: 3600 }), { status: 200 });
      }
      return new Response(JSON.stringify({ tracking_number: 'synthetic-tracking' }), { status: 200 });
    },
  });

  const result = await connector.createOrder({
    requested_tracking_number: 'synthetic-requested-tracking',
    service_type: 'Parcel',
  });

  assert.equal(result.carrier, 'ninja_van');
  assert.equal(calls[0].url, 'https://api-sandbox.ninjavan.co/sg/2.0/oauth/access_token');
  assert.equal(calls[1].url, 'https://api-sandbox.ninjavan.co/sg/plugins/4.2/orders');
  const headers = calls[1].init?.headers as Record<string, string>;
  assert.equal(headers.authorization, 'Bearer synthetic-access-token');
  assert.doesNotMatch(JSON.stringify(calls[1].init?.body), /synthetic-client-secret/);
});

test('Ninja Van does not retry an indeterminate order write', async () => {
  let orderCalls = 0;
  const connector = new NinjaVanConnector(config(), {
    requestId: () => 'ninja-request-2',
    fetch: async url => {
      if (String(url).endsWith('/2.0/oauth/access_token')) {
        return new Response(JSON.stringify({ access_token: 'synthetic-access-token', expires_in: 3600 }), { status: 200 });
      }
      orderCalls += 1;
      throw new Error('network disconnected');
    },
  });

  await assert.rejects(
    connector.createOrder({ requested_tracking_number: 'synthetic-requested-tracking' }),
    (error: unknown) => error instanceof NinjaVanConnectorError
      && error.common.code === 'NINJA_VAN_NETWORK'
      && error.common.outcomeUnknown,
  );
  assert.equal(orderCalls, 1);
});

test('Ninja Van cancels through the documented Order Cancel endpoint', async () => {
  const calls: string[] = [];
  const connector = new NinjaVanConnector(config(), {
    requestId: () => 'ninja-request-3',
    fetch: async url => {
      calls.push(String(url));
      if (String(url).endsWith('/2.0/oauth/access_token')) {
        return new Response(JSON.stringify({ access_token: 'synthetic-access-token', expires_in: 3600 }), { status: 200 });
      }
      return new Response(null, { status: 204 });
    },
  });

  await connector.cancelOrder('synthetic tracking');
  assert.equal(calls[1], 'https://api-sandbox.ninjavan.co/sg/2.2/orders/synthetic%20tracking');
});

test('Ninja Van exposes contract-enabled Waybill, rate, PUDO and webhook routes', async () => {
  const calls: string[] = [];
  const connector = new NinjaVanConnector({
    ...config(),
    routes: {
      rate: { method: 'POST', path: '/sg/contract/rates', safeToRetry: true },
      label: { method: 'GET', path: '/sg/contract/orders/{trackingNumber}/waybill', safeToRetry: true },
      pickup_point: { method: 'GET', path: '/sg/contract/pudo', safeToRetry: true },
      webhook: { method: 'PATCH', path: '/sg/contract/webhook', safeToRetry: false },
    },
  }, {
    requestId: () => 'ninja-request-extension',
    fetch: async url => {
      calls.push(String(url));
      if (String(url).endsWith('/2.0/oauth/access_token')) {
        return new Response(JSON.stringify({ access_token: 'synthetic-access-token', expires_in: 3600 }), { status: 200 });
      }
      return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  await connector.getWaybill({ trackingNumber: 'synthetic tracking' });
  await connector.getRates({ zone: 'synthetic' });
  await connector.listPickupPoints({ postalCode: '000000' });
  await connector.configureWebhook({ urlRef: 'server-created-webhook-reference' });

  assert.ok(calls.includes('https://api-sandbox.ninjavan.co/sg/contract/orders/synthetic%20tracking/waybill'));
  assert.ok(calls.includes('https://api-sandbox.ninjavan.co/sg/contract/pudo?postalCode=000000'));
  assert.equal(calls.filter(url => url.endsWith('/2.0/oauth/access_token')).length, 1);
});
