import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { MAURITIUS_POSTAL_CONTEXT_TEST_INSTANT, MAURITIUS_POSTAL_CONTEXT_TEST_POINT, createMauritiusPostalContextRuntimeTestPack } from '../../testFixtures/postalContextMauritiusRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createMauritiusPostalContextRuntimeTestPack())) });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('Mauritius resolve route returns only the explicitly address-linked building and AGID reference', async () => {
  const response = await fetch(`${baseUrl}/api/postal/resolve`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'mu-resolve-test' },
    body: JSON.stringify({ countryCode: 'MU', ...MAURITIUS_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: MAURITIUS_POSTAL_CONTEXT_TEST_INSTANT }),
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'MU');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.ok(body.data.agid.cellId);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
  assert.deepEqual(body.data.postalEvidence, []);
});

test('Mauritius postcode route normalizes spacing but returns no postal geometry', async () => {
  const query = new URLSearchParams({ validAt: MAURITIUS_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(`${baseUrl}/api/postal/MU/${encodeURIComponent('99 999')}?${query}`, { headers: { 'X-AGID-Request-ID': 'mu-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '99999');
  assert.deepEqual(body.data.geometries, []);
});

test('Mauritius intersects route returns no synthetic postal catchment', async () => {
  const query = new URLSearchParams({ country: 'MU', bbox: '57.49,-20.21,57.51,-20.19', validAt: MAURITIUS_POSTAL_CONTEXT_TEST_INSTANT });
  const response = await fetch(`${baseUrl}/api/postal/intersects?${query}`, { headers: { 'X-AGID-Request-ID': 'mu-intersects-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.status, 'no_match');
  assert.deepEqual(body.data.matches, []);
});
