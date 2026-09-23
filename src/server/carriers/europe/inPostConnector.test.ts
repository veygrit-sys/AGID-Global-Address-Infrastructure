import assert from 'node:assert/strict';
import test from 'node:test';
import { InPostConnector, InPostConnectorError } from './inPostConnector';

const config = () => ({
  environment: 'sandbox' as const,
  organizationId: 'organization-synthetic',
  clientId: 'synthetic-client-id',
  clientSecret: 'synthetic-client-secret',
});

test('InPost obtains an OAuth 2.1 token and creates a shipment on the official stage endpoint', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new InPostConnector(config(), {
    requestId: () => 'inpost-request-1',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'synthetic-access-token', expires_in: 599 }), { status: 200 });
      }
      return new Response(JSON.stringify({ trackingNumber: 'synthetic' }), { status: 201 });
    },
  });

  const result = await connector.createShipment({ service: 'synthetic' });
  assert.equal(result.carrier, 'inpost');
  assert.equal(calls[0].url, 'https://stage-api.inpost-group.com/oauth2/token');
  assert.equal(calls[1].url, 'https://stage-api.inpost-group.com/shipping/v2/organizations/organization-synthetic/shipments');
  const headers = calls[1].init?.headers as Record<string, string>;
  assert.equal(headers.authorization, 'Bearer synthetic-access-token');
  assert.doesNotMatch(JSON.stringify(calls[1].init?.body), /synthetic-client-secret/);
});

test('InPost does not retry an indeterminate shipment write', async () => {
  let shipmentCalls = 0;
  const connector = new InPostConnector(config(), {
    requestId: () => 'inpost-request-2',
    fetch: async url => {
      if (String(url).endsWith('/oauth2/token')) return new Response(JSON.stringify({ access_token: 'synthetic-access-token', expires_in: 599 }), { status: 200 });
      shipmentCalls += 1;
      throw new Error('network disconnected');
    },
  });

  await assert.rejects(
    connector.createShipment({ service: 'synthetic' }),
    (error: unknown) => error instanceof InPostConnectorError && error.common.code === 'INPOST_NETWORK' && error.common.outcomeUnknown,
  );
  assert.equal(shipmentCalls, 1);
});

test('InPost uses Location V1 for locker/PUDO search and requires an approved Returns route', async () => {
  const calls: string[] = [];
  const connector = new InPostConnector(config(), {
    requestId: () => 'inpost-request-3',
    fetch: async url => {
      calls.push(String(url));
      if (String(url).endsWith('/oauth2/token')) return new Response(JSON.stringify({ access_token: 'synthetic-access-token', expires_in: 599 }), { status: 200 });
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    },
  });

  await connector.listPickupPoints({ country: 'PL', type: 'APM', perPage: 25 });
  assert.match(calls[1], /\/location\/v1\/points\?/);
  assert.match(calls[1], /country=PL/);
  assert.throws(() => connector.createReturn({ reference: 'server-created' }), /approved merchant contract/);
});
