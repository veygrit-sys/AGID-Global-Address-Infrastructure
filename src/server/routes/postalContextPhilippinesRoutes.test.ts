import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT, PHILIPPINES_POSTAL_CONTEXT_TEST_POINT, createPhilippinesPostalContextRuntimeTestPack } from '../../testFixtures/postalContextPhilippinesRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;
before(async () => {
  const app = express(); app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createPhilippinesPostalContextRuntimeTestPack())) });
  server = app.listen(0); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address === 'object'); baseUrl = 'http://127.0.0.1:' + address.port;
});
after(async () => { await new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); }); });

test('Philippines resolve route returns explicitly linked building and PH AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'ph-resolve-test' }, body: JSON.stringify({ countryCode: 'PH', ...PHILIPPINES_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT }) });
  const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.countryCode, 'PH'); assert.equal(body.data.resolvedLevel, 'building'); assert.ok(body.data.agid.cellId); assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Philippines postcode route normalizes full-width digits and gates derived geometry', async () => {
  const query = new URLSearchParams({ validAt: PHILIPPINES_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/PH/' + encodeURIComponent('９ ９９９') + '?' + query, { headers: { 'X-AGID-Request-ID': 'ph-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.normalizedPostalCode, '9999'); assert.equal(body.data.geometries[0].geometry.type, 'Polygon'); assert.equal(body.data.geometries[0].source.sourceId, 'ph-synthetic-derived-delivery-surface');
});
