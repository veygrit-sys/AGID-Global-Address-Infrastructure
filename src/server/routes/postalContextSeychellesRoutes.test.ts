import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { SEYCHELLES_POSTAL_CONTEXT_TEST_INSTANT, SEYCHELLES_POSTAL_CONTEXT_TEST_POINT, createSeychellesPostalContextRuntimeTestPack } from '../../testFixtures/postalContextSeychellesRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;
before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createSeychellesPostalContextRuntimeTestPack())) });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = 'http://127.0.0.1:' + address.port;
});
after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('Seychelles resolve route returns explicitly National Address-linked building and SC AGID without postal evidence', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'sc-resolve-test' }, body: JSON.stringify({ countryCode: 'SC', ...SEYCHELLES_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: SEYCHELLES_POSTAL_CONTEXT_TEST_INSTANT }) });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'SC');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.deepEqual(body.data.postalEvidence, []);
  assert.match(body.data.agid.cellId, /^SC[0-9A-Z]+$/);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Seychelles postcode route rejects the 0000 placeholder', async () => {
  const query = new URLSearchParams({ validAt: SEYCHELLES_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/SC/0000?' + query, { headers: { 'X-AGID-Request-ID': 'sc-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.error, 'Invalid postal code');
  assert.deepEqual(body.warnings, ['invalid-postal-code']);
});
