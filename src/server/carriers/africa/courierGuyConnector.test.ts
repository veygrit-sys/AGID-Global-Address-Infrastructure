import assert from 'node:assert/strict';
import test from 'node:test';
import { CourierGuyConnector, CourierGuyConnectorError } from './courierGuyConnector';

const productionConfig = () => ({
  environment: 'production' as const,
  apiKey: 'synthetic-courier-guy-api-key',
});

test('The Courier Guy V2 uses its official endpoint and Bearer API key', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = new CourierGuyConnector(productionConfig(), {
    requestId: () => 'tcg-request-1',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ rates: [] }), { status: 200 });
    },
  });

  const result = await connector.getRates({ collection_address: {}, delivery_address: {}, parcels: [] });
  assert.equal(result.carrier, 'courier_guy');
  assert.equal(calls[0].url, 'https://api.portal.thecourierguy.co.za/v2/rates');
  const headers = calls[0].init?.headers as Record<string, string>;
  assert.equal(headers.authorization, 'Bearer synthetic-courier-guy-api-key');
  assert.doesNotMatch(JSON.stringify(calls[0].init?.body), /synthetic-courier-guy-api-key/);
});

test('The Courier Guy requires an explicitly issued sandbox API host', () => {
  assert.throws(
    () => new CourierGuyConnector({ environment: 'sandbox', apiKey: 'synthetic-key' }),
    /sandboxBaseUrl/,
  );
});

test('The Courier Guy safely retries tracking but never replays an unknown shipment', async () => {
  let trackingCalls = 0;
  const tracking = new CourierGuyConnector({ ...productionConfig(), maxSafeRetries: 1 }, {
    requestId: () => 'tcg-request-2',
    sleep: async () => undefined,
    fetch: async () => {
      trackingCalls += 1;
      if (trackingCalls === 1) return new Response(JSON.stringify({ message: 'busy' }), { status: 503 });
      return new Response(JSON.stringify({ status: 'collected' }), { status: 200 });
    },
  });
  await tracking.track('synthetic tracking');
  assert.equal(trackingCalls, 2);

  let shipmentCalls = 0;
  const shipment = new CourierGuyConnector(productionConfig(), {
    requestId: () => 'tcg-request-3',
    fetch: async () => {
      shipmentCalls += 1;
      throw new Error('network disconnected');
    },
  });
  await assert.rejects(
    shipment.createShipment({ service_level_code: 'ECO' }),
    (error: unknown) => error instanceof CourierGuyConnectorError
      && error.common.code === 'COURIER_GUY_NETWORK'
      && error.common.outcomeUnknown,
  );
  assert.equal(shipmentCalls, 1);
});

test('The Courier Guy label route keeps waybill data server-side', async () => {
  const connector = new CourierGuyConnector(productionConfig(), {
    requestId: () => 'tcg-request-4',
    fetch: async url => {
      assert.equal(String(url), 'https://api.portal.thecourierguy.co.za/v2/shipments/label?id=synthetic-id');
      return new Response(JSON.stringify({ waybillBase64: 'synthetic-binary-placeholder' }), { status: 200 });
    },
  });

  const result = await connector.getLabel('synthetic-id');
  assert.equal(result.operation, 'label');
});

test('The Courier Guy Locker/PUDO stays one carrier connection with official sandbox routes', async () => {
  const calls: string[] = [];
  const connector = new CourierGuyConnector({
    environment: 'sandbox',
    apiKey: 'synthetic-tcg-key',
    sandboxBaseUrl: 'https://tcg.sandbox.example',
    pudoApiKey: 'synthetic-pudo-key',
  }, {
    requestId: () => 'pudo-request',
    fetch: async (url, init) => {
      calls.push(String(url));
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer synthetic-pudo-key');
      return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  await connector.listPudoLockers();
  await connector.getPudoRates({ collection_address: {}, delivery_address: {}, parcels: [] });
  await connector.createPudoShipment({ service_level_code: 'D2LXS - ECO' });
  await connector.trackPudoShipment('983');
  await connector.cancelPudoShipment('983', 'server-created reason');

  assert.deepEqual(calls, [
    'https://api-sandbox.pudo.co.za/lockers-data',
    'https://api-sandbox.pudo.co.za/rates',
    'https://api-sandbox.pudo.co.za/shipments',
    'https://api-sandbox.pudo.co.za/tracking/shipments?include_parcels=false&id=983',
    'https://api-sandbox.pudo.co.za/shipments/983',
  ]);
});
