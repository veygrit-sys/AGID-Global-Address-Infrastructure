import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createFourPxSignature,
  FourPxConnector,
  FourPxConnectorError,
} from './fourPxConnector';

const config = () => ({
  environment: 'sandbox' as const,
  appKey: 'synthetic-app-key',
  appSecret: 'synthetic-app-secret',
});

test('4PX signature matches the official merchant integration example', () => {
  const signature = createFourPxSignature({
    app_key: '16081f05-e8fc-4250-b9c4-0660d1ecbb28',
    format: 'json',
    method: 'ds.xms.order.create',
    timestamp: '1532592413187',
    v: '1.0',
  }, '{"aa":"bb"}', '7eebf328-8e5a-4030-904d-ec6e89174fbc');

  assert.equal(signature, 'ff4af77c062a9b97d98aa29777621c4a');
});

test('4PX creates a direct-shipping order through the official sandbox gateway', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new FourPxConnector(config(), {
    now: () => 1_532_592_413_187,
    requestId: () => 'four-px-request-1',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ result: '1', msg: 'success', data: { orderId: 'synthetic-order' } }), { status: 200 });
    },
  });

  const result = await connector.createOrder({ ref_no: 'synthetic-order' });
  assert.equal(result.carrier, 'four_px');
  assert.equal(result.operation, 'shipment');

  const url = new URL(calls[0].url);
  assert.equal(`${url.origin}${url.pathname}`, 'https://open-test.4px.com/router/api/service');
  assert.equal(url.searchParams.get('method'), 'ds.xms.order.create');
  assert.equal(url.searchParams.get('app_key'), 'synthetic-app-key');
  assert.equal(url.searchParams.get('v'), '1.0');
  assert.equal(url.searchParams.get('format'), 'json');
  assert.equal(url.searchParams.get('language'), 'en');
  assert.equal(url.searchParams.has('access_token'), false);
  assert.equal(calls[0].init?.body, '{"ref_no":"synthetic-order"}');
});

test('4PX maps rate, label, tracking, and cancellation to official catalog methods', async () => {
  const methods: string[] = [];
  const connector = new FourPxConnector(config(), {
    now: () => 1_532_592_413_187,
    requestId: () => `four-px-request-${methods.length + 4}`,
    fetch: async url => {
      methods.push(String(new URL(String(url)).searchParams.get('method')));
      return new Response(JSON.stringify({ result: '1', data: {} }), { status: 200 });
    },
  });

  await connector.getRates({ destination_country: 'US' });
  await connector.getLabel({ ref_no: 'synthetic-order' });
  await connector.track({ tracking_number: 'synthetic' });
  await connector.cancelOrder({ ref_no: 'synthetic-order' });
  assert.deepEqual(methods, [
    'com.css.price_calculator',
    'ds.xms.label.get',
    'tr.order.tracking.get',
    'ds.xms.order.cancel',
  ]);
});

test('4PX retries tracking reads but never replays an unknown cancellation write', async () => {
  let trackingCalls = 0;
  const tracking = new FourPxConnector({ ...config(), maxSafeRetries: 1 }, {
    now: () => 1_532_592_413_187,
    requestId: () => 'four-px-request-2',
    sleep: async () => undefined,
    fetch: async () => {
      trackingCalls += 1;
      if (trackingCalls === 1) return new Response(JSON.stringify({ result: '0', msg: 'temporary' }), { status: 503 });
      return new Response(JSON.stringify({ result: '1', data: [] }), { status: 200 });
    },
  });
  const trackingResult = await tracking.track({ tracking_number: 'synthetic' });
  assert.equal(trackingResult.operation, 'tracking');
  assert.equal(trackingCalls, 2);

  let cancellationCalls = 0;
  const cancellation = new FourPxConnector(config(), {
    requestId: () => 'four-px-request-3',
    fetch: async () => {
      cancellationCalls += 1;
      throw new Error('network disconnected');
    },
  });
  await assert.rejects(
    cancellation.cancelOrder({ ref_no: 'synthetic-order' }),
    (error: unknown) => error instanceof FourPxConnectorError
      && error.common.code === 'FOUR_PX_NETWORK'
      && error.common.outcomeUnknown,
  );
  assert.equal(cancellationCalls, 1);
});
