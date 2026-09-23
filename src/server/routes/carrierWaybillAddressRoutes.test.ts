import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { registerCarrierWaybillAddressRoutes } from './carrierWaybillAddressRoutes';

let server: Server;
let baseUrl = '';

before(async () => {
  const app = express();
  app.use(express.json());
  registerCarrierWaybillAddressRoutes(app, { internalApiKey: 'test-internal-key' });
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

function convert(headers: Record<string, string> = {}, addressOverrides: Record<string, unknown> = {}) {
  return fetch(`${baseUrl}/api/internal/carriers/waybill-address/convert`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({
      role: 'receiver',
      address: {
        recipient: 'Avery Johnson',
        organization: 'Veygrit Store',
        countryCode: 'US',
        postcode: '94107',
        state: 'CA',
        city: 'San Francisco',
        street: '548 Brannan Street',
        phone: '415-555-0100',
        ...addressOverrides,
      },
    }),
  });
}

test('internal conversion route rejects unauthenticated raw address requests', async () => {
  const response = await convert();
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'no-store, private');
  assert.deepEqual(await response.json(), { ok: false, error: 'internal_auth_required' });
});

test('internal conversion route returns private UPS and DHL carrier fragments', async () => {
  const response = await convert({ 'x-veygrit-internal-key': 'test-internal-key' });
  const body = await response.json() as {
    ok: boolean;
    carrierPayloads: {
      ups: { container: string; value: { Address: { PostalCode: string } } };
      dhl: { container: string; value: { postalAddress: { postalCode: string } } };
    };
    privacy: { serverSideOnly: boolean; safeForMerchantCallback: boolean };
  };
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.carrierPayloads.ups.container, 'ShipTo');
  assert.equal(body.carrierPayloads.ups.value.Address.PostalCode, '94107');
  assert.equal(body.carrierPayloads.dhl.container, 'receiverDetails');
  assert.equal(body.carrierPayloads.dhl.value.postalAddress.postalCode, '94107');
  assert.equal(body.privacy.serverSideOnly, true);
  assert.equal(body.privacy.safeForMerchantCallback, false);
});

test('internal conversion route returns field-level validation errors without echoing address values', async () => {
  const response = await convert(
    { 'x-veygrit-internal-key': 'test-internal-key' },
    { postcode: 'wrong', phone: '123' },
  );
  const bodyText = await response.text();
  assert.equal(response.status, 422);
  assert.doesNotMatch(bodyText, /548 Brannan Street/);
  assert.doesNotMatch(bodyText, /415-555-0100/);
  assert.match(bodyText, /invalid_format/);
});
