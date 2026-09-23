import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { BHUTAN_POSTAL_CONTEXT_TEST_INSTANT, BHUTAN_POSTAL_CONTEXT_TEST_POINT, createBhutanPostalContextRuntimeTestPack } from '../../testFixtures/postalContextBhutanRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;
before(async () => {
  const app = express(); app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createBhutanPostalContextRuntimeTestPack())) });
  server = app.listen(0); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address === 'object'); baseUrl = 'http://127.0.0.1:' + address.port;
});
after(async () => { await new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); }); });

test('Bhutan resolve route returns explicitly linked building and BT AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'bt-resolve-test' }, body: JSON.stringify({ countryCode: 'BT', ...BHUTAN_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: BHUTAN_POSTAL_CONTEXT_TEST_INSTANT }) });
  const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.countryCode, 'BT'); assert.equal(body.data.resolvedLevel, 'building'); assert.ok(body.data.agid.cellId); assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Bhutan postcode route normalizes full-width digits and gates derived geometry', async () => {
  const query = new URLSearchParams({ validAt: BHUTAN_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/BT/' + encodeURIComponent('９９ ９９９') + '?' + query, { headers: { 'X-AGID-Request-ID': 'bt-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.normalizedPostalCode, '99999'); assert.equal(body.data.geometries[0].geometry.type, 'Polygon'); assert.equal(body.data.geometries[0].source.sourceId, 'bt-synthetic-derived-delivery-surface');
});
