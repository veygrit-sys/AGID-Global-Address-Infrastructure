import assert from 'node:assert/strict';
import test from 'node:test';
import { RoyalMailConnector, RoyalMailConnectorError } from './royalMailConnector';

const config = () => ({
  environment: 'sandbox' as const,
  clientId: 'synthetic-client-id',
  clientSecret: 'synthetic-client-secret',
});

test('Royal Mail Shipping V2 uses the official onboarding endpoint and server-only headers', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new RoyalMailConnector(config(), {
    requestId: () => 'royal-mail-request-1',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ shipmentNumber: 'synthetic' }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  const result = await connector.createShipment({ items: [] });
  assert.equal(result.carrier, 'royal_mail');
  assert.equal(calls[0].url, 'https://pp.api.royalmail.net/shipping/v2/shipments');
  const headers = calls[0].init?.headers as Record<string, string>;
  assert.equal(headers['x-ibm-client-id'], 'synthetic-client-id');
  assert.equal(headers['x-ibm-client-secret'], 'synthetic-client-secret');
  assert.doesNotMatch(JSON.stringify(calls[0].init?.body), /synthetic-client-secret/);
});

test('Royal Mail Tracking V2 retries safe reads but never replays an unknown shipment creation', async () => {
  let shipmentCalls = 0;
  const connector = new RoyalMailConnector(config(), {
    requestId: () => 'royal-mail-request-2',
    fetch: async () => { shipmentCalls += 1; throw new Error('network disconnected'); },
  });
  await assert.rejects(
    connector.createShipment({ items: [] }),
    (error: unknown) => error instanceof RoyalMailConnectorError && error.common.code === 'ROYAL_MAIL_NETWORK' && error.common.outcomeUnknown,
  );
  assert.equal(shipmentCalls, 1);
});
