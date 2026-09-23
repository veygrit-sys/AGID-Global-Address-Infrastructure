import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ExpandedMenaConnectorError,
  createBostaConnector,
  createEmiratesPostConnector,
  createNaqelExpressConnector,
  createSmsaExpressConnector,
} from './expandedMenaConnector';

test('SMSA Express injects passKey server-side and uses official SOAP actions', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const connector = createSmsaExpressConnector({
    environment: 'production',
    passKey: 'synthetic-smsa-pass-key',
  }, {
    requestId: () => 'smsa-request',
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response('<ok/>', { status: 200, headers: { 'content-type': 'text/xml' } });
    },
  });

  await connector.execute('shipment', { refNo: 'server-created', cName: 'redacted-test' });

  assert.equal(calls[0]?.url, 'https://track.smsaexpress.com/SECOM/SMSAwebService.asmx');
  const headers = new Headers(calls[0]?.init?.headers);
  assert.equal(headers.get('soapaction'), 'http://track.smsaexpress.com/secom/addShipPDF');
  assert.match(String(calls[0]?.init?.body), /<addShipPDF xmlns="http:\/\/track\.smsaexpress\.com\/secom\/">/);
  assert.match(String(calls[0]?.init?.body), /<passKey>synthetic-smsa-pass-key<\/passKey>/);
});

test('NAQEL sandbox uses the official demo SOAP service and never retries unknown writes', async () => {
  let attempts = 0;
  const connector = createNaqelExpressConnector({
    environment: 'sandbox',
    credentialPayload: { ClientInfo: { ClientID: 123, Password: 'synthetic' } },
  }, {
    requestId: () => 'naqel-request',
    fetch: async (url, init) => {
      attempts += 1;
      assert.equal(String(url), 'https://infotrack.naqelexpress.com/NaqelAPIServices/NaqelAPIDemo/5.0/XMLShippingService.asmx');
      assert.equal(new Headers(init?.headers).get('soapaction'), 'http://tempuri.org/CreateWaybill');
      throw new TypeError('network unavailable');
    },
  });

  await assert.rejects(
    connector.execute('shipment', { _ManifestShipmentDetails: { RefNo: 'server-created' } }),
    (error: unknown) => error instanceof ExpandedMenaConnectorError && error.common.outcomeUnknown,
  );
  assert.equal(attempts, 1);
});

test('Emirates Post keeps staging and production hosts explicit', async () => {
  const seen: string[] = [];
  const connector = createEmiratesPostConnector({
    environment: 'sandbox',
    sandboxBaseUrl: 'https://emx.sandbox.example',
    productionBaseUrl: 'https://emx.production.example',
    auth: { type: 'basic', username: 'synthetic-user', password: 'synthetic-password' },
  }, {
    fetch: async (url, init) => {
      seen.push(String(url));
      assert.match(String(new Headers(init?.headers).get('authorization')), /^Basic /);
      return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  await connector.execute('rate', { origin: {}, destination: {} });
  await connector.execute('tracking', { AWBNumber: 'synthetic-awb' });
  assert.deepEqual(seen, [
    'https://emx.sandbox.example/RateCalculation',
    'https://emx.sandbox.example/Tracking?AWBNumber=synthetic-awb',
  ]);
});

test('Bosta uses scoped API-key authentication and does not retry delivery creation', async () => {
  let calls = 0;
  const connector = createBostaConnector({
    environment: 'production',
    apiKey: 'synthetic-bosta-key',
  }, {
    fetch: async (_url, init) => {
      calls += 1;
      assert.equal(new Headers(init?.headers).get('authorization'), 'synthetic-bosta-key');
      throw new TypeError('network unavailable');
    },
  });

  await assert.rejects(
    connector.execute('shipment', { type: 10, specs: {} }),
    (error: unknown) => error instanceof ExpandedMenaConnectorError && error.common.outcomeUnknown,
  );
  assert.equal(calls, 1);
});
