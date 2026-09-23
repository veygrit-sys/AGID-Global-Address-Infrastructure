import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ExpandedPrivateEuropeConnectorError,
  createAcsCourierConnector,
  createDachserConnector,
  createDhlParcelGermanyConnector,
  createFanCourierConnector,
  createBpostConnector,
  createAnPostConnector,
  createAustrianPostConnector,
  createColissimoConnector,
  createCorreosConnector,
  createCttPortugalConnector,
  createOmnivaConnector,
  createPostNordConnector,
  createPosteItalianeConnector,
  createPostNlConnector,
  createPplCzConnector,
  createSamedayConnector,
  createSwissPostConnector,
  createYodelConnector,
  type PrivateEuropeContractConfig,
} from './expandedPrivateEuropeConnector';

function contract(
  overrides: Partial<PrivateEuropeContractConfig> = {},
): PrivateEuropeContractConfig {
  return {
    environment: 'sandbox',
    sandboxBaseUrl: 'https://carrier.sandbox.example',
    productionBaseUrl: 'https://carrier.production.example',
    auth: { type: 'api_key', headerName: 'x-contract-key', value: 'synthetic-key' },
    routes: {
      shipment: { method: 'POST', path: '/shipments', safeToRetry: false },
      tracking: { method: 'GET', path: '/tracking/{reference}', safeToRetry: true },
    },
    ...overrides,
  };
}

test('Yodel uses only application-plan routes and never retries an unknown shipment write', async () => {
  let attempts = 0;
  const connector = createYodelConnector(contract(), {
    fetch: async () => {
      attempts += 1;
      throw new TypeError('network unavailable');
    },
  });

  await assert.rejects(
    connector.execute('shipment', { reference: 'server-created' }),
    (error: unknown) => error instanceof ExpandedPrivateEuropeConnectorError && error.common.outcomeUnknown,
  );
  assert.equal(attempts, 1);
});

test('FAN Courier uses documented production routes and cached bearer token', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createFanCourierConnector({
    environment: 'production',
    sandboxBaseUrl: 'https://fan.sandbox.example',
    token: 'synthetic-token',
  }, {
    requestId: () => 'fan-request',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response('{"status":"success"}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('label', { clientId: 'synthetic-client', awb: 'synthetic-awb', pdf: 1 });
  assert.match(calls[0]?.url ?? '', /^https:\/\/api\.fancourier\.ro\/awb\/label\?/);
  assert.equal(new Headers(calls[0]?.init?.headers).get('authorization'), 'Bearer synthetic-token');
  assert.equal(new Headers(calls[0]?.init?.headers).get('x-veygrit-request-id'), 'fan-request');
});

test('ACS wraps secret-managed credentials and payload under the documented alias envelope', async () => {
  const connector = createAcsCourierConnector({
    environment: 'production',
    sandboxBaseUrl: 'https://acs.sandbox.example',
    apiKey: 'synthetic-api-key',
    credentialPayload: {
      Company_ID: 'synthetic-company',
      Company_Password: 'synthetic-company-password',
      User_ID: 'synthetic-user',
      User_Password: 'synthetic-user-password',
    },
  }, {
    fetch: async (url, init) => {
      assert.equal(String(url), 'https://webservices.acscourier.net/ACSRestServices/api/ACSAutoRest');
      assert.equal(new Headers(init?.headers).get('acsapikey'), 'synthetic-api-key');
      assert.deepEqual(JSON.parse(String(init?.body)), {
        ACSAlias: 'ACS_Price_Calculation',
        ACSInputParameters: {
          Company_ID: 'synthetic-company',
          Company_Password: 'synthetic-company-password',
          User_ID: 'synthetic-user',
          User_Password: 'synthetic-user-password',
          Weight: 1,
        },
      });
      return new Response('{"ACSExecution_HasError":false}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('rate', { Weight: 1 });
});

test('ACS HTTP 200 execution errors are normalized as carrier failures', async () => {
  const connector = createAcsCourierConnector({
    environment: 'production',
    sandboxBaseUrl: 'https://acs.sandbox.example',
    apiKey: 'synthetic-api-key',
  }, {
    fetch: async () => new Response(
      '{"ACSExecution_HasError":true,"ACSExecutionErrorMessage":"synthetic rejection"}',
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  });

  await assert.rejects(
    connector.execute('address_validation', { Address: 'synthetic' }),
    (error: unknown) => error instanceof ExpandedPrivateEuropeConnectorError
      && error.common.code === 'ACS_EXECUTION_ERROR'
      && error.common.status === 422,
  );
});

test('DACHSER tracking follows the official v2 path and query contract', async () => {
  const connector = createDachserConnector({
    environment: 'production',
    sandboxBaseUrl: 'https://dachser.sandbox.example',
    apiKey: 'synthetic-api-key',
  }, {
    fetch: async (url, init) => {
      assert.equal(String(url), 'https://api-gateway.dachser.com/rest/v2/shipmentstatus?tracking-number=synthetic');
      assert.equal(new Headers(init?.headers).get('x-api-key'), 'synthetic-api-key');
      return new Response('{"shipments":[]}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('tracking', { 'tracking-number': 'synthetic' });
});

test('Sameday remains contract-routed and every private Europe base URL requires HTTPS', async () => {
  const connector = createSamedayConnector(contract(), {
    fetch: async url => {
      assert.equal(String(url), 'https://carrier.sandbox.example/tracking/synthetic');
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });
  await connector.execute('tracking', { reference: 'synthetic' });

  assert.throws(
    () => createYodelConnector(contract({ sandboxBaseUrl: 'http://unsafe.example' })),
    /must use HTTPS/,
  );
});

test('DHL Parcel Germany uses the official REST v2 sandbox routes and cached bearer token', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createDhlParcelGermanyConnector({
    environment: 'sandbox',
    accessToken: 'synthetic-cached-token',
  }, {
    requestId: () => 'dhl-parcel-de-request',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response('{"items":[]}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await connector.execute('shipment', { profile: 'STANDARD_GRUPPENPROFIL' });
  await connector.execute('void', { shipment: 'synthetic-shipment' });

  assert.equal(calls[0]?.url, 'https://api-sandbox.dhl.com/parcel/de/shipping/v2/orders');
  assert.equal(calls[1]?.url, 'https://api-sandbox.dhl.com/parcel/de/shipping/v2/orders?shipment=synthetic-shipment');
  assert.equal(new Headers(calls[0]?.init?.headers).get('authorization'), 'Bearer synthetic-cached-token');
  assert.equal(new Headers(calls[0]?.init?.headers).get('x-veygrit-request-id'), 'dhl-parcel-de-request');
});

test('major European country adapters remain bound to contract-issued hosts and routes', async () => {
  const factories = [
    createColissimoConnector,
    createPosteItalianeConnector,
    createCorreosConnector,
    createPostNlConnector,
    createBpostConnector,
  ] as const;
  const expected = ['colissimo', 'poste_italiane', 'correos', 'postnl', 'bpost'] as const;

  for (const [index, factory] of factories.entries()) {
    const calls: string[] = [];
    const connector = factory(contract(), {
      fetch: async url => {
        calls.push(String(url));
        return new Response('{"ok":true}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    });
    const result = await connector.execute('tracking', { reference: 'synthetic' });
    assert.equal(result.carrier, expected[index]);
    assert.equal(calls[0], 'https://carrier.sandbox.example/tracking/synthetic');
  }
});

test('major European adapters preserve PDF and ZPL label bytes', async () => {
  const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46]);
  const connector = createPostNlConnector(contract({
    routes: {
      label: { method: 'POST', path: '/labels', safeToRetry: false },
    },
  }), {
    fetch: async () => new Response(pdf, {
      status: 200,
      headers: { 'content-type': 'application/pdf' },
    }),
  });

  const result = await connector.execute('label', { shipmentId: 'synthetic' });
  assert.ok(result.data instanceof Uint8Array);
  assert.deepEqual([...result.data], [...pdf]);
});

test('Swiss Post uses the documented Digital Commerce label route and does not retry an unknown write', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createSwissPostConnector({
    environment: 'production',
    accessToken: 'synthetic-cached-token',
  }, {
    requestId: () => 'swiss-post-request',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      throw new TypeError('network unavailable');
    },
  });

  await assert.rejects(
    connector.execute('label', { item: 'synthetic-label-request' }),
    (error: unknown) => error instanceof ExpandedPrivateEuropeConnectorError
      && error.common.outcomeUnknown
      && error.common.requestId === 'swiss-post-request',
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, 'https://dcapi.apis.post.ch/barcode/v1/generateAddressLabel');
  assert.equal(new Headers(calls[0]?.init?.headers).get('authorization'), 'Bearer synthetic-cached-token');
});

test('medium-country Europe contract adapters use only carrier-issued HTTPS environments', async () => {
  const factories = [
    createPostNordConnector,
    createAustrianPostConnector,
    createPplCzConnector,
    createOmnivaConnector,
    createAnPostConnector,
    createCttPortugalConnector,
  ] as const;
  const expected = [
    'postnord',
    'austrian_post',
    'ppl_cz',
    'omniva',
    'an_post',
    'ctt_portugal',
  ] as const;

  for (const [index, factory] of factories.entries()) {
    const calls: string[] = [];
    const connector = factory(contract(), {
      fetch: async url => {
        calls.push(String(url));
        return new Response('{"ok":true}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    });
    const result = await connector.execute('tracking', { reference: 'synthetic' });
    assert.equal(result.carrier, expected[index]);
    assert.equal(calls[0], 'https://carrier.sandbox.example/tracking/synthetic');
  }

  assert.throws(
    () => createPostNordConnector(contract({ productionBaseUrl: 'http://unsafe.example' })),
    /productionBaseUrl must use HTTPS/,
  );
  assert.throws(
    () => createSwissPostConnector({
      environment: 'sandbox',
      sandboxBaseUrl: 'http://unsafe.example',
      accessToken: 'synthetic-token',
    }),
    /sandboxBaseUrl must use HTTPS/,
  );
});
