import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT, MONGOLIA_POSTAL_CONTEXT_TEST_POINT, createMongoliaPostalContextRuntimeTestPack } from '../../testFixtures/postalContextMongoliaRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;
before(async () => {
  const app = express(); app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createMongoliaPostalContextRuntimeTestPack())) });
  server = app.listen(0); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address === 'object'); baseUrl = 'http://127.0.0.1:' + address.port;
});
after(async () => { await new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); }); });

test('Mongolia resolve route returns explicitly linked building and MN AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'mn-resolve-test' }, body: JSON.stringify({ countryCode: 'MN', ...MONGOLIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT }) });
  const body = await response.json() as any;
  assert.equal(response.status, 200); assert.equal(body.ok, true); assert.equal(body.data.countryCode, 'MN'); assert.equal(body.data.resolvedLevel, 'building'); assert.ok(body.data.agid.cellId); assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Mongolia postcode route canonicalizes five and nine digits while gating geometry', async () => {
  const query = new URLSearchParams({ validAt: MONGOLIA_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const zoneResponse = await fetch(baseUrl + '/api/postal/MN/' + encodeURIComponent('９９ ９９９') + '?' + query, { headers: { 'X-AGID-Request-ID': 'mn-zone-test' } });
  const zone = await zoneResponse.json() as any;
  const codeResponse = await fetch(baseUrl + '/api/postal/MN/' + encodeURIComponent('999999999') + '?' + query, { headers: { 'X-AGID-Request-ID': 'mn-building-code-test' } });
  const code = await codeResponse.json() as any;
  assert.equal(zoneResponse.status, 200); assert.equal(zone.data.normalizedPostalCode, '99999'); assert.equal(zone.data.geometries[0].geometry.type, 'Polygon'); assert.equal(zone.data.geometries[0].source.sourceId, 'mn-synthetic-derived-postal-zone-surface');
  assert.equal(codeResponse.status, 200); assert.equal(code.data.normalizedPostalCode, '99999-9999'); assert.deepEqual(code.data.geometries, []);
});
