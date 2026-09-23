import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  createMondialRelayConnector,
  createPacketaConnector,
  ExpandedEuropeConnector,
  ExpandedEuropeConnectorError,
} from './expandedEuropeConnector';

function response(body: unknown, status = 200, contentType = 'application/json'): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'content-type': contentType },
  });
}

test('OAuth token is cached and DSV contract routes may use separate official hosts', async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const connector = new ExpandedEuropeConnector({
    carrier: 'dsv',
    environment: 'sandbox',
    baseUrl: 'https://api.dsv.com',
    auth: {
      type: 'oauth2_client_credentials',
      tokenUrl: 'https://auth.example.test/token',
      clientId: 'client',
      clientSecret: 'secret',
      requestStyle: 'basic_form',
    },
    routes: {
      rate: { method: 'POST', path: 'https://api.dsv.com/my-demo/quote/v1/quotes', safeToRetry: true },
      tracking: { method: 'GET', path: 'https://api.dsv.com/my-demo/tracking/v2/shipments/{shipmentId}', safeToRetry: true },
    },
  }, {
    requestId: () => `req-${calls.length}`,
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('/token')) return response({ access_token: 'token-value', expires_in: 3_600 });
      return response({ ok: true });
    },
  });

  await connector.execute('rate', { origin: 'DE', destination: 'FR' });
  await connector.execute('tracking', { shipmentId: 'SHIP-1' });

  assert.equal(calls.filter(call => call.url.includes('/token')).length, 1);
  assert.equal(calls[2]?.url, 'https://api.dsv.com/my-demo/tracking/v2/shipments/SHIP-1');
  assert.equal((calls[1]?.init.headers as Record<string, string>).authorization, 'Bearer token-value');
});

test('Mondial Relay calculates uppercase SECURITY from the declared official field order', async () => {
  let captured = '';
  const connector = createMondialRelayConnector({
    environment: 'sandbox',
    enseigne: 'BDTEST',
    privateKey: 'private',
    routes: {
      pickup_point: {
        method: 'POST',
        path: '/web_services.asmx/WSI4_PointRelais_Recherche',
        bodyEncoding: 'form',
        signatureFields: ['Enseigne', 'Pays', 'CP'],
        safeToRetry: true,
      },
    },
  }, {
    fetch: async (_url, init) => {
      captured = String(init?.body ?? '');
      return response('<ok/>', 200, 'text/xml');
    },
  });

  await connector.execute('pickup_point', { Pays: 'FR', CP: '75001' });
  const expected = createExpectedMd5('BDTESTFR75001private');
  assert.match(captured, new RegExp(`Security=${expected}`));
  assert.match(captured, /Enseigne=BDTEST/);
});

test('Packeta creates a SOAP envelope without returning credentials to callers', async () => {
  let captured = '';
  const connector = createPacketaConnector({ environment: 'sandbox', apiPassword: 'server-only-password', apiKey: 'server-only-api-key' }, {
    fetch: async (_url, init) => {
      captured = String(init?.body ?? '');
      return response('<response><status>ok</status></response>', 200, 'text/xml');
    },
  });

  const result = await connector.execute('tracking', { packetId: '123' });
  assert.match(captured, /<svc:packetTracking/);
  assert.match(captured, /<apiPassword>server-only-password<\/apiPassword>/);
  assert.match(captured, /<packetId>123<\/packetId>/);
  assert.deepEqual(result.data, { raw: '<response><status>ok</status></response>' });
});

test('unsafe shipment network failures are outcome unknown and are not replayed', async () => {
  let calls = 0;
  const connector = new ExpandedEuropeConnector({
    carrier: 'gls',
    environment: 'sandbox',
    baseUrl: 'https://api.example.test',
    auth: { type: 'bearer', token: 'server-token' },
    routes: { shipment: { method: 'POST', path: '/shipments', safeToRetry: false } },
  }, {
    fetch: async () => {
      calls += 1;
      throw new Error('network');
    },
  });

  await assert.rejects(
    connector.execute('shipment', { parcelRef: 'PARCEL-1' }),
    (error: unknown) => error instanceof ExpandedEuropeConnectorError
      && error.common.outcomeUnknown
      && error.common.code === 'CARRIER_NETWORK',
  );
  assert.equal(calls, 1);
});

function createExpectedMd5(value: string): string {
  // Kept local so the test proves byte-for-byte compatibility with the carrier formula.
  return createHash('md5').update(value, 'utf8').digest('hex').toUpperCase();
}
