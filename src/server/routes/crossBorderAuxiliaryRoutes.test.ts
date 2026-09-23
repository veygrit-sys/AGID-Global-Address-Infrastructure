import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { registerCrossBorderAuxiliaryRoutes } from './crossBorderAuxiliaryRoutes';

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
  registerCrossBorderAuxiliaryRoutes(app);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('source route can filter to free/open-first sources', async () => {
  const result = await getJson('/api/cross-border/auxiliary/sources?freeOnly=1');
  const ids = result.body.data.sources.map((source: { id: string }) => source.id);

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.ok(ids.includes('frankfurter-self-host'));
  assert.ok(ids.includes('node-sales-tax'));
  assert.ok(ids.includes('open-sales-tax'));
  assert.ok(!ids.includes('frankfurter-api'));
  assert.ok(!ids.includes('uk-trade-tariff-api'));
  assert.ok(!ids.includes('what3words-api'));
});

test('context route returns insufficient data without HS code or address proof', async () => {
  const result = await postJson('/api/cross-border/auxiliary/context', {
    useCase: 'pos-checkout',
    originCountry: 'JP',
    destinationCountry: 'US',
    product: {
      category: 'electronics accessory',
      currency: 'JPY',
    },
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.data.status, 'insufficient-data');
  assert.ok(result.body.data.manualReviewReasons.includes('hs-code-missing'));
  assert.ok(result.body.data.manualReviewReasons.includes('destination-address-or-private-address-proof-missing'));
});

test('shopping-agent route forces shopping-agent use case and barcode source', async () => {
  const result = await postJson('/api/shopping-agent/cross-border/context', {
    originCountry: 'FR',
    destinationCountry: 'GB',
    product: {
      hsCode: '1905.90',
      barcode: '3017620422003',
      declaredValue: 8,
      currency: 'EUR',
    },
    address: {
      hasAoidCredential: true,
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.data.useCase, 'shopping-agent');
  assert.ok(result.body.data.recommendedSourceIds.includes('open-food-facts-api'));
  assert.ok(result.body.data.recommendedSourceIds.includes('node-sales-tax'));
  assert.ok(result.body.data.recommendedSourceIds.includes('vatnode-eu-vat-rates-data'));
  assert.ok(!result.body.data.recommendedSourceIds.includes('uk-trade-tariff-api'));
});
