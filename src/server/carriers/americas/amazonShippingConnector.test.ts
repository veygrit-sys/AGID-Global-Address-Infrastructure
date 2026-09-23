import assert from 'node:assert/strict';
import test from 'node:test';
import { AmazonShippingConnector, AmazonShippingConnectorError } from './amazonShippingConnector';

function config() {
  return {
    environment: 'sandbox' as const,
    lwaClientId: 'server-client-id',
    lwaClientSecret: 'server-client-secret',
    lwaRefreshToken: 'server-refresh-token',
    awsAccessKeyId: 'AKIATEST',
    awsSecretAccessKey: 'server-aws-secret',
  };
}

test('Amazon Shipping V2 gets sandbox rates with server-side LWA and SigV4 headers', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new AmazonShippingConnector(config(), {
    now: () => new Date('2026-07-23T00:00:00.000Z'),
    requestId: () => 'amazon-request-1',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url) === 'https://api.amazon.com/auth/o2/token') return new Response(JSON.stringify({ access_token: 'lwa-token', expires_in: 3600 }), { status: 200 });
      return new Response(JSON.stringify({ payload: { rates: [] } }), { status: 200, headers: { 'x-amzn-requestid': 'amazon-upstream-1' } });
    },
  });

  const result = await connector.getRates({ shipFrom: { name: 'server-only' }, packages: [], channelDetails: { channelType: 'EXTERNAL' } });

  assert.equal(result.carrier, 'amazon_shipping');
  assert.equal(result.operation, 'rate');
  assert.equal(result.status, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, 'https://sandbox.sellingpartnerapi-na.amazon.com/shipping/v2/shipments/rates');
  const headers = calls[1].init?.headers as Record<string, string>;
  assert.equal(headers['x-amz-access-token'], 'lwa-token');
  assert.equal(headers['x-amzn-shipping-business-id'], 'AmazonShipping_US');
  assert.match(headers.authorization, /^AWS4-HMAC-SHA256 Credential=AKIATEST\//);
  assert.doesNotMatch(JSON.stringify(headers), /server-aws-secret|server-client-secret|server-refresh-token/);
});

test('Amazon Shipping does not retry an indeterminate purchase request', async () => {
  const connector = new AmazonShippingConnector(config(), {
    requestId: () => 'amazon-request-2',
    fetch: async url => {
      if (String(url) === 'https://api.amazon.com/auth/o2/token') return new Response(JSON.stringify({ access_token: 'lwa-token', expires_in: 3600 }), { status: 200 });
      throw new Error('network disconnected');
    },
  });

  await assert.rejects(
    connector.purchaseShipment({ shipmentId: 'server-payload-only' }),
    (error: unknown) => error instanceof AmazonShippingConnectorError && error.common.code === 'AMAZON_NETWORK' && error.common.outcomeUnknown === true,
  );
});
