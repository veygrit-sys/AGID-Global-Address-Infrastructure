import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { JORDAN_POSTAL_CONTEXT_TEST_INSTANT, JORDAN_POSTAL_CONTEXT_TEST_POINT, createJordanPostalContextRuntimeTestPack } from '../../testFixtures/postalContextJordanRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;
before(async () => {
  const app = express(); app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createJordanPostalContextRuntimeTestPack())) });
  server = app.listen(0); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address === 'object'); baseUrl = 'http://127.0.0.1:' + address.port;
});
after(async () => { await new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); }); });

test('Jordan resolve route returns explicitly linked building and JO AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'jo-resolve-test' }, body: JSON.stringify({ countryCode: 'JO', ...JORDAN_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: JORDAN_POSTAL_CONTEXT_TEST_INSTANT }) });
  const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.countryCode, 'JO'); assert.equal(body.data.resolvedLevel, 'building'); assert.ok(body.data.agid.cellId); assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Jordan postcode route canonicalizes five digits and gates derived routing geometry', async () => {
  const query = new URLSearchParams({ validAt: JORDAN_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/JO/' + encodeURIComponent('٩٩ ٩٩٩') + '?' + query, { headers: { 'X-AGID-Request-ID': 'jo-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.normalizedPostalCode, '99999'); assert.equal(body.data.geometries[0].geometry.type, 'Polygon'); assert.equal(body.data.geometries[0].source.sourceId, 'jo-synthetic-routing-administrative-join-surface');
});
