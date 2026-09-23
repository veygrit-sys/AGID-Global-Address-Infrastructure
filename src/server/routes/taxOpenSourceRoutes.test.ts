import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { registerTaxOpenSourceRoutes } from './taxOpenSourceRoutes';

let server: Server;
let baseUrl = '';

async function getJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

before(async () => {
  const app = express();
  app.use(express.json());
  registerTaxOpenSourceRoutes(app);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('source route returns recommended fully-free tax sources', async () => {
  const result = await getJson('/api/tax/open-source/sources?recommended=1');
  const ids = result.body.data.sources.map((source: { id: string }) => source.id);

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.ok(ids.includes('vatnode-eu-vat-rates-data'));
  assert.ok(ids.includes('node-sales-tax'));
  assert.ok(ids.includes('open-sales-tax'));
  assert.ok(!ids.includes('taxfoundation-worldwide-corporate-tax-rates'));
});

test('estimate route rejects missing tax evidence without using hardcoded rates', async () => {
  const result = await postJson('/api/tax/open-source/estimate', {
    destinationCountry: 'FR',
    taxableAmount: 100,
    currency: 'EUR',
  });

  assert.equal(result.status, 422);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.data.status, 'needs-evidence');
  assert.ok(result.body.data.manualReviewReasons.includes('tax-rate-evidence-missing'));
});

test('estimate route computes source-backed VAT estimate', async () => {
  const result = await postJson('/api/tax/open-source/estimate', {
    destinationCountry: 'FR',
    taxableAmount: 100,
    currency: 'EUR',
    taxEvidence: [
      {
        sourceId: 'vatnode-eu-vat-rates-data',
        countryCode: 'FR',
        taxType: 'vat',
        rate: 0.2,
        confidence: 'open-source',
      },
    ],
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.data.status, 'estimated');
  assert.equal(result.body.data.taxAmount, 20);
  assert.equal(result.body.data.totalAmount, 120);
});
