import assert from 'node:assert/strict';
import test from 'node:test';
import { DelhiveryConnector, DelhiveryConnectorError } from './delhiveryConnector';

const config = () => ({
  environment: 'sandbox' as const,
  token: 'synthetic-delhivery-token',
});

test('Delhivery creates a B2C shipment with the official form-encoded contract', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new DelhiveryConnector(config(), {
    requestId: () => 'delhivery-request-1',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ success: true, packages: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const result = await connector.createShipment({ shipments: [{ name: 'Synthetic recipient' }] });
  assert.equal(result.carrier, 'delhivery');
  assert.equal(calls[0].url, 'https://staging-express.delhivery.com/api/cmu/create.json');
  const headers = calls[0].init?.headers as Record<string, string>;
  assert.equal(headers.authorization, 'Token synthetic-delhivery-token');
  assert.equal(headers['content-type'], 'application/x-www-form-urlencoded');
  const body = new URLSearchParams(String(calls[0].init?.body));
  assert.equal(body.get('format'), 'json');
  assert.deepEqual(JSON.parse(body.get('data') ?? '{}'), { shipments: [{ name: 'Synthetic recipient' }] });
});

test('Delhivery uses the official tracking route and safely retries a transient read', async () => {
  const calls: string[] = [];
  const connector = new DelhiveryConnector({ ...config(), maxSafeRetries: 1 }, {
    requestId: () => 'delhivery-request-2',
    sleep: async () => undefined,
    fetch: async url => {
      calls.push(String(url));
      if (calls.length === 1) return new Response(JSON.stringify({ message: 'busy' }), { status: 503 });
      return new Response(JSON.stringify({ ShipmentData: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const result = await connector.track('synthetic-waybill', 'synthetic-reference');
  assert.equal(result.operation, 'tracking');
  assert.equal(calls.length, 2);
  assert.equal(
    calls[0],
    'https://staging-express.delhivery.com/api/v1/packages/json/?ref_ids=synthetic-reference&waybill=synthetic-waybill',
  );
});

test('Delhivery does not retry an indeterminate shipment write', async () => {
  let shipmentCalls = 0;
  const connector = new DelhiveryConnector(config(), {
    requestId: () => 'delhivery-request-3',
    fetch: async () => {
      shipmentCalls += 1;
      throw new Error('network disconnected');
    },
  });

  await assert.rejects(
    connector.createShipment({ shipments: [] }),
    (error: unknown) => error instanceof DelhiveryConnectorError
      && error.common.code === 'DELHIVERY_NETWORK'
      && error.common.outcomeUnknown,
  );
  assert.equal(shipmentCalls, 1);
});

test('Delhivery retrieves a PDF label without converting its bytes to text', async () => {
  const connector = new DelhiveryConnector(config(), {
    requestId: () => 'delhivery-request-4',
    fetch: async url => {
      assert.equal(
        String(url),
        'https://express-dev-test.delhivery.com/api/p/packing_slip?pdf=True&wbns=synthetic-waybill',
      );
      return new Response(new Uint8Array([37, 80, 68, 70]), {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      });
    },
  });

  const result = await connector.getLabel('synthetic-waybill');
  const data = result.data as { contentType: string; bytes: Uint8Array };
  assert.equal(data.contentType, 'application/pdf');
  assert.deepEqual([...data.bytes], [37, 80, 68, 70]);
});

test('Delhivery exposes serviceability plus contract-issued waybill, pickup, return, NDR and webhook routes', async () => {
  const calls: string[] = [];
  const connector = new DelhiveryConnector({
    ...config(),
    routes: {
      document: { method: 'GET', path: '/contract/waybills', queryPayload: true, safeToRetry: true },
      pickup: { method: 'POST', path: '/contract/pickups', safeToRetry: false },
      return: { method: 'POST', path: '/contract/returns', safeToRetry: false },
      ndr: { method: 'PATCH', path: '/contract/ndr/{waybill}', safeToRetry: false },
      webhook: { method: 'POST', path: '/contract/webhooks', safeToRetry: false },
    },
  }, {
    requestId: () => 'delhivery-extension-request',
    fetch: async url => {
      calls.push(String(url));
      return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  await connector.checkServiceability({ filter_codes: '000000' });
  await connector.fetchWaybill({ count: 1 });
  await connector.createPickup({ pickupDate: '2099-01-01' });
  await connector.createReturn({ reference: 'server-created' });
  await connector.updateNdr({ waybill: 'synthetic-waybill', action: 'REATTEMPT' });
  await connector.configureWebhook({ urlRef: 'server-side-webhook-reference' });

  assert.equal(calls[0], 'https://staging-express.delhivery.com/c/api/pin-codes/json/?filter_codes=000000');
  assert.equal(calls[1], 'https://staging-express.delhivery.com/contract/waybills?count=1');
  assert.ok(calls.includes('https://staging-express.delhivery.com/contract/ndr/synthetic-waybill'));
});
