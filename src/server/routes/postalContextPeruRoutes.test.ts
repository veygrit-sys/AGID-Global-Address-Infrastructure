import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { PERU_POSTAL_CONTEXT_TEST_INSTANT, PERU_POSTAL_CONTEXT_TEST_POINT, createPeruPostalContextRuntimeTestPack } from '../../testFixtures/postalContextPeruRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';
let server: Server; let baseUrl: string;
before(async () => { const app = express(); app.use(express.json()); registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createPeruPostalContextRuntimeTestPack())) }); server = app.listen(0); await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address(); assert.ok(address && typeof address === 'object'); baseUrl = 'http://127.0.0.1:' + address.port; });
after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
test('Peruvian resolve route returns explicitly linked building and PE AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'pe-resolve-test' }, body: JSON.stringify({ countryCode: 'PE', ...PERU_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: PERU_POSTAL_CONTEXT_TEST_INSTANT }) }); const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.countryCode, 'PE'); assert.equal(body.data.resolvedLevel, 'building'); assert.ok(body.data.agid.cellId); assert.equal(body.data.agid.canonicalPostalGeometry, false);
});
test('Peruvian postcode route normalizes and gates the synthetic derived service-area review polygon', async () => {
  const query = new URLSearchParams({ validAt: PERU_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' }); const response = await fetch(baseUrl + '/api/postal/PE/' + encodeURIComponent('９９９９９') + '?' + query, { headers: { 'X-AGID-Request-ID': 'pe-postcode-test' } }); const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.normalizedPostalCode, '99999'); assert.equal(body.data.geometries[0].geometry.type, 'Polygon'); assert.equal(body.data.geometries[0].source.sourceId, 'pe-synthetic-derived-postal-service-area-review-polygon');
});
