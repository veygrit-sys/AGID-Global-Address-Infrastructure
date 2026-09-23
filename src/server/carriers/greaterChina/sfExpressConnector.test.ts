import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  createSfExpressMessageDigest,
  SfExpressConnector,
  SfExpressConnectorError,
} from './sfExpressConnector';

const config = () => ({
  environment: 'sandbox' as const,
  partnerId: 'synthetic-partner',
  checkword: 'synthetic-checkword',
});

test('SF Express signs and submits an order to the official sandbox endpoint', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new SfExpressConnector(config(), {
    now: () => 1_532_592_413_187,
    requestId: () => 'sf-request-1',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({
        apiResultCode: 'A1000',
        apiResultData: JSON.stringify({ success: true, msgData: { orderId: 'synthetic-order' } }),
      }), { status: 200 });
    },
  });

  const result = await connector.createOrder({ orderId: 'synthetic-order' });
  assert.equal(result.carrier, 'sf_express');
  assert.equal(result.operation, 'shipment');
  assert.equal(calls[0].url, 'https://sfapi-sbox.sf-express.com/std/service');

  const body = calls[0].init?.body as URLSearchParams;
  assert.equal(body.get('partnerID'), 'synthetic-partner');
  assert.equal(body.get('requestID'), 'sf-request-1');
  assert.equal(body.get('serviceCode'), 'EXP_RECE_CREATE_ORDER');
  assert.equal(body.get('timestamp'), '1532592413187');
  assert.equal(body.get('msgData'), '{"orderId":"synthetic-order"}');

  const source = new URLSearchParams([[
    'value',
    '{"orderId":"synthetic-order"}1532592413187synthetic-checkword',
  ]]).toString().slice('value='.length);
  const expected = createHash('md5').update(source, 'utf8').digest('base64');
  assert.equal(body.get('msgDigest'), expected);
  assert.equal(createSfExpressMessageDigest(
    '{"orderId":"synthetic-order"}',
    '1532592413187',
    'synthetic-checkword',
  ), expected);
});

test('SF Express retries safe route reads on 5xx', async () => {
  let calls = 0;
  const connector = new SfExpressConnector({ ...config(), maxSafeRetries: 1 }, {
    now: () => 1_532_592_413_187,
    requestId: () => 'sf-request-2',
    sleep: async () => undefined,
    fetch: async () => {
      calls += 1;
      if (calls === 1) {
        return new Response(JSON.stringify({ apiResultCode: 'A1001', apiErrorMsg: 'temporary' }), { status: 503 });
      }
      return new Response(JSON.stringify({
        apiResultCode: 'A1000',
        apiResultData: JSON.stringify({ msgData: { routeResps: [] } }),
      }), { status: 200 });
    },
  });

  const result = await connector.track({ trackingType: '1', trackingNumber: ['synthetic'] });
  assert.equal(result.operation, 'tracking');
  assert.equal(calls, 2);
});

test('SF Express maps freight, order lookup, and cancellation to official service codes', async () => {
  const serviceCodes: string[] = [];
  const connector = new SfExpressConnector(config(), {
    now: () => 1_532_592_413_187,
    requestId: () => `sf-request-${serviceCodes.length + 4}`,
    fetch: async (_url, init) => {
      const body = init?.body as URLSearchParams;
      serviceCodes.push(String(body.get('serviceCode')));
      return new Response(JSON.stringify({ apiResultCode: 'A1000', apiResultData: '{}' }), { status: 200 });
    },
  });

  await connector.getFreight({ trackingType: '1', trackingNumber: 'synthetic' });
  await connector.queryOrder({ orderId: 'synthetic-order' });
  await connector.cancelOrder({ orderId: 'synthetic-order', dealType: 2 });
  assert.deepEqual(serviceCodes, [
    'EXP_RECE_QUERY_SFWAYBILL',
    'EXP_RECE_SEARCH_ORDER_RESP',
    'EXP_RECE_UPDATE_ORDER',
  ]);
});

test('SF Express never replays an order write with an unknown outcome', async () => {
  let calls = 0;
  const connector = new SfExpressConnector(config(), {
    requestId: () => 'sf-request-3',
    fetch: async () => {
      calls += 1;
      throw new Error('network disconnected');
    },
  });

  await assert.rejects(
    connector.createOrder({ orderId: 'synthetic-order' }),
    (error: unknown) => error instanceof SfExpressConnectorError
      && error.common.code === 'SF_EXPRESS_NETWORK'
      && error.common.outcomeUnknown,
  );
  assert.equal(calls, 1);
});
