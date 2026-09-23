import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { MYANMAR_POSTAL_CONTEXT_TEST_INSTANT, MYANMAR_POSTAL_CONTEXT_TEST_POINT, createMyanmarPostalContextRuntimeTestPack } from '../../testFixtures/postalContextMyanmarRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;
before(async () => {
  const app = express(); app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createMyanmarPostalContextRuntimeTestPack())) });
  server = app.listen(0); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address === 'object'); baseUrl = 'http://127.0.0.1:' + address.port;
});
after(async () => { await new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); }); });

test('Myanmar resolve route returns explicitly linked building and MM AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'mm-resolve-test' }, body: JSON.stringify({ countryCode: 'MM', ...MYANMAR_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: MYANMAR_POSTAL_CONTEXT_TEST_INSTANT }) });
  const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.countryCode, 'MM'); assert.equal(body.data.resolvedLevel, 'building'); assert.match(body.data.agid.cellId, /^MM/); assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Myanmar postcode route canonicalizes Myanmar digits and gates administrative join geometry', async () => {
  const query = new URLSearchParams({ validAt: MYANMAR_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/MM/' + encodeURIComponent('၉၉ ၉၉ ၉၉၉') + '?' + query, { headers: { 'X-AGID-Request-ID': 'mm-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.normalizedPostalCode, '9999999'); assert.equal(body.data.geometries[0].geometry.type, 'Polygon'); assert.equal(body.data.geometries[0].source.sourceId, 'mm-synthetic-administrative-join-surface');
});
