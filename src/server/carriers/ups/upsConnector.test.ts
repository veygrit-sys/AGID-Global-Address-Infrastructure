import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createUpsConnectorFromEnv,
  UpsConfigurationError,
  UpsConnector,
  UpsConnectorError,
  UpsOAuthTokenProvider,
  type UpsConnectorDependencies,
} from './upsConnector';

type FetchCall = { url: string; init?: RequestInit };

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function connectorWith(fetchImpl: typeof fetch, overrides: Record<string, unknown> = {}, dependencies: UpsConnectorDependencies = {}) {
  return new UpsConnector({
    baseUrl: 'https://wwwcie.ups.com',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    accountNumber: 'A12345',
    timeoutMs: 1_000,
    maxSafeRetries: 3,
    retryBaseDelayMs: 10,
    retryMaxDelayMs: 5_000,
    ...overrides,
  }, {
    fetch: fetchImpl,
    random: () => 0.5,
    requestId: () => '0123456789abcdef0123456789abcdef',
    ...dependencies,
  });
}

test('OAuth client credentials token is cached until the expiry skew window', async () => {
  let now = 1_000_000;
  let tokenCalls = 0;
  const provider = new UpsOAuthTokenProvider({
    baseUrl: 'https://wwwcie.ups.com',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    accountNumber: 'A12345',
    tokenExpirySkewMs: 60_000,
  }, {
    now: () => now,
    fetch: async (input, init) => {
      tokenCalls += 1;
      assert.equal(String(input), 'https://wwwcie.ups.com/security/v1/oauth/token');
      assert.equal(init?.method, 'POST');
      assert.equal(new Headers(init?.headers).get('authorization'), `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`);
      assert.equal(new Headers(init?.headers).get('x-merchant-id'), 'A12345');
      assert.equal(init?.body, 'grant_type=client_credentials');
      return jsonResponse(200, { access_token: `token-${tokenCalls}`, token_type: 'Bearer', expires_in: '3600' });
    },
  });

  assert.equal(await provider.getToken(), 'token-1');
  assert.equal(await provider.getToken(), 'token-1');
  assert.equal(tokenCalls, 1);

  now += 3_541_000;
  assert.equal(await provider.getToken(), 'token-2');
  assert.equal(tokenCalls, 2);
});

test('proactive UPS OAuth refresh replaces the cached token without exposing it', async () => {
  let tokenCalls = 0;
  const now = Date.parse('2030-01-01T00:00:00Z');
  const connector = connectorWith(async input => {
    assert.equal(String(input), 'https://wwwcie.ups.com/security/v1/oauth/token');
    tokenCalls += 1;
    return jsonResponse(200, { access_token: `token-${tokenCalls}`, token_type: 'Bearer', expires_in: '3600' });
  }, {}, { now: () => now });
  const first = await connector.refreshOAuthToken();
  const second = await connector.refreshOAuthToken();
  assert.deepEqual(first, { expiresAt: '2030-01-01T01:00:00.000Z' });
  assert.deepEqual(second, first);
  assert.equal(tokenCalls, 2);
  assert.equal('accessToken' in first, false);
});

test('concurrent OAuth requests share one in-flight token exchange', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let tokenCalls = 0;
  const provider = new UpsOAuthTokenProvider({
    baseUrl: 'https://wwwcie.ups.com',
    clientId: 'client-id',
    clientSecret: 'client-secret',
  }, {
    fetch: async () => {
      tokenCalls += 1;
      await gate;
      return jsonResponse(200, { access_token: 'shared-token', expires_in: '3600' });
    },
  });
  const first = provider.getToken();
  const second = provider.getToken();
  release();
  assert.deepEqual(await Promise.all([first, second]), ['shared-token', 'shared-token']);
  assert.equal(tokenCalls, 1);
});

test('connector uses official UPS paths and one cached bearer token across P0 operations', async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/security/v1/oauth/token')) {
      return jsonResponse(200, { access_token: 'cached-bearer', expires_in: '3600' });
    }
    return jsonResponse(init?.method === 'POST' ? 200 : 200, { path: new URL(url).pathname });
  };
  const connector = connectorWith(fetchImpl);

  await connector.validateAddress({ XAVRequest: {} });
  await connector.getRates({ RateRequest: {} }, { requestOption: 'Shop' });
  await connector.createShipment({ ShipmentRequest: {} }, { additionalAddressValidation: 'city' });
  await connector.voidShipment('1Z999AA10123456784');
  await connector.track('1Z999AA10123456784');

  assert.equal(calls.filter(call => call.url.includes('/oauth/token')).length, 1);
  assert.deepEqual(calls.slice(1).map(call => `${call.init?.method} ${new URL(call.url).pathname}`), [
    'POST /api/addressvalidation/v2/3',
    'POST /api/rating/v2409/Shop',
    'POST /api/shipments/v2409/ship',
    'DELETE /api/shipments/v2409/void/cancel/1Z999AA10123456784',
    'GET /api/track/v1/details/1Z999AA10123456784',
  ]);
  for (const call of calls.slice(1)) {
    const headers = new Headers(call.init?.headers);
    assert.equal(headers.get('authorization'), 'Bearer cached-bearer');
    assert.equal(headers.get('transId'), '0123456789abcdef0123456789abcdef');
    assert.equal(headers.get('transactionSrc'), 'veygrit-ship');
  }
});

test('safe Rating retries 429 and 5xx with Retry-After and exponential backoff', async () => {
  let ratingCalls = 0;
  const sleeps: number[] = [];
  const connector = connectorWith(async input => {
    const url = String(input);
    if (url.endsWith('/oauth/token')) return jsonResponse(200, { access_token: 'token', expires_in: '3600' });
    ratingCalls += 1;
    if (ratingCalls === 1) return jsonResponse(429, { response: { errors: [{ code: '10429', message: 'Too many requests' }] } }, { 'retry-after': '1' });
    if (ratingCalls === 2) return jsonResponse(503, { response: { errors: [{ code: 'UPS_503', message: 'Unavailable' }] } });
    return jsonResponse(200, { RateResponse: { RatedShipment: [] } });
  }, {}, { sleep: async milliseconds => { sleeps.push(milliseconds); } });

  const result = await connector.getRates({ RateRequest: {} });
  assert.equal(result.ok, true);
  assert.equal(result.automaticRetryCount, 2);
  assert.equal(ratingCalls, 3);
  assert.deepEqual(sleeps, [1_000, 20]);
});

test('Shipment creation never retries 5xx and reports an unknown outcome', async () => {
  let shipmentCalls = 0;
  const connector = connectorWith(async input => {
    const url = String(input);
    if (url.endsWith('/oauth/token')) return jsonResponse(200, { access_token: 'token', expires_in: '3600' });
    shipmentCalls += 1;
    return jsonResponse(503, { response: { errors: [{ code: 'UPS_TEMPORARY', message: 'Temporary problem' }] } });
  });

  await assert.rejects(
    connector.createShipment({ ShipmentRequest: {} }),
    (error: unknown) => {
      assert.ok(error instanceof UpsConnectorError);
      assert.equal(error.common.operation, 'shipment');
      assert.equal(error.common.error.automaticRetryCount, 0);
      assert.equal(error.common.error.outcomeUnknown, true);
      assert.equal(error.common.error.code, 'UPS_TEMPORARY');
      return true;
    },
  );
  assert.equal(shipmentCalls, 1);
});

test('Void timeout is not retried and is marked for reconciliation', async () => {
  let voidCalls = 0;
  const connector = connectorWith(async input => {
    const url = String(input);
    if (url.endsWith('/oauth/token')) return jsonResponse(200, { access_token: 'token', expires_in: '3600' });
    voidCalls += 1;
    const error = new Error('aborted');
    error.name = 'AbortError';
    throw error;
  });

  await assert.rejects(connector.voidShipment('1Z999AA10123456784'), (error: unknown) => {
    assert.ok(error instanceof UpsConnectorError);
    assert.equal(error.common.error.category, 'timeout');
    assert.equal(error.common.error.outcomeUnknown, true);
    assert.equal(error.common.error.automaticRetryCount, 0);
    return true;
  });
  assert.equal(voidCalls, 1);
});

test('401 invalidates the token and safely authenticates once more', async () => {
  let tokenCalls = 0;
  let trackingCalls = 0;
  const connector = connectorWith(async input => {
    const url = String(input);
    if (url.endsWith('/oauth/token')) {
      tokenCalls += 1;
      return jsonResponse(200, { access_token: `token-${tokenCalls}`, expires_in: '3600' });
    }
    trackingCalls += 1;
    if (trackingCalls === 1) return jsonResponse(401, { response: { errors: [{ code: '250003', message: 'Invalid token' }] } });
    return jsonResponse(200, { trackResponse: { shipment: [] } });
  });

  const result = await connector.track('1Z999AA10123456784');
  assert.equal(result.ok, true);
  assert.equal(tokenCalls, 2);
  assert.equal(trackingCalls, 2);
});

test('production base URL fails closed until live traffic is explicitly enabled', () => {
  const environment = {
    HEXASHIP_UPS_BASE_URL: 'https://onlinetools.ups.com',
    HEXASHIP_UPS_CLIENT_ID: 'client-id',
    HEXASHIP_UPS_CLIENT_SECRET: 'client-secret',
    HEXASHIP_UPS_ACCOUNT_NUMBER: 'A12345',
    HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED: 'false',
  } as NodeJS.ProcessEnv;
  assert.throws(() => createUpsConnectorFromEnv(environment), UpsConfigurationError);
  assert.doesNotThrow(() => createUpsConnectorFromEnv({
    ...environment,
    HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED: 'true',
  }));
});
