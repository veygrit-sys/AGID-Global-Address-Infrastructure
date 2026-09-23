import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { SOMALIA_POSTAL_CONTEXT_TEST_INSTANT, SOMALIA_POSTAL_CONTEXT_TEST_POINT, createSomaliaPostalContextRuntimeTestPack } from '../../testFixtures/postalContextSomaliaRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;
before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createSomaliaPostalContextRuntimeTestPack())) });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = 'http://127.0.0.1:' + address.port;
});
after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('Somalia resolve route returns only explicitly civic-address-linked building and conflict-sensitive SO AGID context', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'so-resolve-test' }, body: JSON.stringify({ countryCode: 'SO', ...SOMALIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: SOMALIA_POSTAL_CONTEXT_TEST_INSTANT }) });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'SO');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.deepEqual(body.data.postalEvidence, []);
  assert.match(body.data.agid.cellId, /^SO[0-9A-Z]+$/);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Somalia postcode route normalizes AA plus five digits but returns no invented polygon', async () => {
  const query = new URLSearchParams({ validAt: SOMALIA_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/SO/bn99999?' + query, { headers: { 'X-AGID-Request-ID': 'so-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.status, 'no_match');
  assert.equal(body.data.normalizedPostalCode, 'BN 99999');
  assert.deepEqual(body.data.postalFeatures, []);
  assert.deepEqual(body.data.geometries, []);
});

test('Somalia postcode route rejects the obsolete three-digit and numeric-only shapes', async () => {
  for (const value of ['BN010', '03010']) {
    const response = await fetch(baseUrl + '/api/postal/SO/' + value, { headers: { 'X-AGID-Request-ID': 'so-invalid-postcode-test' } });
    const body = await response.json() as any;
    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'Invalid postal code');
  }
});
