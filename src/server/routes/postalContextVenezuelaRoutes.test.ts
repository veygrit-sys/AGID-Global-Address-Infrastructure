import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { VENEZUELA_POSTAL_CONTEXT_TEST_INSTANT, VENEZUELA_POSTAL_CONTEXT_TEST_POINT, createVenezuelaPostalContextRuntimeTestPack } from '../../testFixtures/postalContextVenezuelaRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';
let server: Server; let baseUrl: string;
before(async () => { const app = express(); app.use(express.json()); registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createVenezuelaPostalContextRuntimeTestPack())) }); server = app.listen(0); await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address(); assert.ok(address && typeof address === 'object'); baseUrl = 'http://127.0.0.1:' + address.port; });
after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
test('Venezuelan resolve route returns explicitly linked building and VE AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 've-resolve-test' }, body: JSON.stringify({ countryCode: 'VE', ...VENEZUELA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: VENEZUELA_POSTAL_CONTEXT_TEST_INSTANT }) }); const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.countryCode, 'VE'); assert.equal(body.data.resolvedLevel, 'building'); assert.ok(body.data.agid.cellId); assert.equal(body.data.agid.canonicalPostalGeometry, false);
});
test('Venezuelan postcode route normalizes and gates the synthetic derived service-area review polygon', async () => {
  const query = new URLSearchParams({ validAt: VENEZUELA_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' }); const response = await fetch(baseUrl + '/api/postal/VE/' + encodeURIComponent('９９９９') + '?' + query, { headers: { 'X-AGID-Request-ID': 've-postcode-test' } }); const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.normalizedPostalCode, '9999'); assert.equal(body.data.geometries[0].geometry.type, 'Polygon'); assert.equal(body.data.geometries[0].source.sourceId, 've-synthetic-derived-postal-service-area-review-polygon');
});
