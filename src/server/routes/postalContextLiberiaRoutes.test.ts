import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { LIBERIA_POSTAL_CONTEXT_TEST_INSTANT, LIBERIA_POSTAL_CONTEXT_TEST_POINT, createLiberiaPostalContextRuntimeTestPack } from '../../testFixtures/postalContextLiberiaRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createLiberiaPostalContextRuntimeTestPack())) });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('Liberia resolve route returns only the explicitly address-linked building and AGID reference', async () => {
  const response = await fetch(`${baseUrl}/api/postal/resolve`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'lr-resolve-test' },
    body: JSON.stringify({ countryCode: 'LR', ...LIBERIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: LIBERIA_POSTAL_CONTEXT_TEST_INSTANT }),
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'LR');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.ok(body.data.agid.cellId);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
  assert.deepEqual(body.data.postalEvidence, []);
});

test('Liberia postcode route canonicalizes four digits and returns no invented postal geometry', async () => {
  const query = new URLSearchParams({ validAt: LIBERIA_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(`${baseUrl}/api/postal/LR/${encodeURIComponent('99 99')}?${query}`, { headers: { 'X-AGID-Request-ID': 'lr-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '9999');
  assert.deepEqual(body.data.geometries, []);
});

test('Liberia intersects route returns no synthetic postal catchment', async () => {
  const query = new URLSearchParams({ country: 'LR', bbox: '-10.81,6.29,-10.79,6.31', validAt: LIBERIA_POSTAL_CONTEXT_TEST_INSTANT });
  const response = await fetch(`${baseUrl}/api/postal/intersects?${query}`, { headers: { 'X-AGID-Request-ID': 'lr-intersects-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.status, 'no_match');
  assert.deepEqual(body.data.matches, []);
});
