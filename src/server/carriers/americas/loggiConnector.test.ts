import assert from 'node:assert/strict';
import test from 'node:test';
import { LoggiConnector, LoggiConnectorError } from './loggiConnector';

function config() {
  return { environment: 'sandbox' as const, companyId: '12345', clientId: 'server-client-id', clientSecret: 'server-client-secret' };
}

test('Loggi creates official sandbox quotes with a server-only OAuth token', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new LoggiConnector(config(), {
    requestId: () => 'loggi-request-1',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/v2/oauth2/token')) return new Response(JSON.stringify({ access_token: 'loggi-token', expires_in: 3600 }), { status: 200 });
      return new Response(JSON.stringify({ quotations: [] }), { status: 200 });
    },
  });

  const result = await connector.getRates({ shipFrom: { postalCode: '00000000' }, shipTo: { postalCode: '11111111' }, packages: [], pickupTypes: ['PICKUP'] });

  assert.equal(result.carrier, 'loggi');
  assert.equal(result.operation, 'rate');
  assert.equal(calls[1].url, 'https://stg.api.loggi.com/v1/companies/12345/quotations');
  const headers = calls[1].init?.headers as Record<string, string>;
  assert.equal(headers.authorization, 'Bearer loggi-token');
  // OAuth receives the credential server-to-server. The carrier quote body
  // must remain free of credential material.
  assert.doesNotMatch(JSON.stringify(calls[1].init?.body), /server-client-secret/);
});

test('Loggi retains an unknown outcome for non-idempotent shipment creation', async () => {
  const calls: string[] = [];
  const connector = new LoggiConnector(config(), {
    requestId: () => 'loggi-request-2',
    fetch: async url => {
      calls.push(String(url));
      if (String(url).endsWith('/v2/oauth2/token')) return new Response(JSON.stringify({ access_token: 'loggi-token', expires_in: 3600 }), { status: 200 });
      throw new Error('network disconnected');
    },
  });

  await assert.rejects(
    connector.createShipment({ packages: [] }),
    (error: unknown) => error instanceof LoggiConnectorError && error.common.code === 'LOGGI_NETWORK' && error.common.outcomeUnknown === true,
  );
  assert.equal(calls[1], 'https://stg.api.loggi.com/v1/companies/12345/async-shipments');
});

test('Loggi supports current package updates, labels and Loggi Ponto discovery', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new LoggiConnector(config(), {
    now: () => 1_000,
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/v2/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'loggi-token', expires_in: 3600 }), { status: 200 });
      }
      return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  await connector.updateShipment({ loggiKey: 'synthetic-loggi-key', package: { recipient: { name: 'Synthetic' } } });
  await connector.createLabels({ loggiKeys: ['synthetic-loggi-key'] });
  await connector.listDropoffLocations({ categories: ['LoggiPonto', 'Reversa'] });

  assert.deepEqual(calls.slice(1).map(call => call.url), [
    'https://stg.api.loggi.com/v1/companies/12345/packages?loggi_key=synthetic-loggi-key',
    'https://stg.api.loggi.com/v1/companies/12345/labels',
    'https://stg.api.loggi.com/dropoff/locations',
  ]);
  assert.equal(calls[1].init?.method, 'PATCH');
});
