import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { ETHIOPIA_POSTAL_CONTEXT_TEST_INSTANT, ETHIOPIA_POSTAL_CONTEXT_TEST_POINT, createEthiopiaPostalContextRuntimeTestPack } from '../../testFixtures/postalContextEthiopiaRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createEthiopiaPostalContextRuntimeTestPack())) });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = 'http://127.0.0.1:' + address.port;
});

after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('Ethiopia resolve route returns explicitly linked eDAS building and ET AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'et-resolve-test' },
    body: JSON.stringify({ countryCode: 'ET', ...ETHIOPIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: ETHIOPIA_POSTAL_CONTEXT_TEST_INSTANT }),
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'ET');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.ok(body.data.agid.cellId);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Ethiopia postcode route canonicalizes grouped digits and gates derived geometry', async () => {
  const query = new URLSearchParams({ validAt: ETHIOPIA_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/ET/' + encodeURIComponent('09 99') + '?' + query, { headers: { 'X-AGID-Request-ID': 'et-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '0999');
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
  assert.equal(body.data.geometries[0].source.sourceId, 'et-synthetic-derived-postal-review-surface');
});
