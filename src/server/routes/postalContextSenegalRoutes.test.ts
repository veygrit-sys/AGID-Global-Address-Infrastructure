import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { SENEGAL_POSTAL_CONTEXT_TEST_INSTANT, SENEGAL_POSTAL_CONTEXT_TEST_POINT, createSenegalPostalContextRuntimeTestPack } from '../../testFixtures/postalContextSenegalRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;
before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createSenegalPostalContextRuntimeTestPack())) });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = 'http://127.0.0.1:' + address.port;
});
after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('Senegal resolve route returns explicitly civic-address-linked building and SN AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'sn-resolve-test' }, body: JSON.stringify({ countryCode: 'SN', ...SENEGAL_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: SENEGAL_POSTAL_CONTEXT_TEST_INSTANT }) });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'SN');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.match(body.data.agid.cellId, /^SN[0-9A-Z]+$/);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Senegal postcode route canonicalizes grouped digits and gates derived geometry', async () => {
  const query = new URLSearchParams({ validAt: SENEGAL_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/SN/' + encodeURIComponent('09 997') + '?' + query, { headers: { 'X-AGID-Request-ID': 'sn-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '09997');
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
  assert.equal(body.data.geometries[0].source.sourceId, 'sn-synthetic-derived-postal-review-surface');
});
