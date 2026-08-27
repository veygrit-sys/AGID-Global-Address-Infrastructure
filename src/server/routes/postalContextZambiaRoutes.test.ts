import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { ZAMBIA_POSTAL_CONTEXT_TEST_INSTANT, ZAMBIA_POSTAL_CONTEXT_TEST_POINT, createZambiaPostalContextRuntimeTestPack } from '../../testFixtures/postalContextZambiaRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createZambiaPostalContextRuntimeTestPack())) });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = 'http://127.0.0.1:' + address.port;
});

after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('Zambia resolve route returns explicitly national-address-linked building and ZM AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'zm-resolve-test' },
    body: JSON.stringify({ countryCode: 'ZM', ...ZAMBIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: ZAMBIA_POSTAL_CONTEXT_TEST_INSTANT }),
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'ZM');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.ok(body.data.agid.cellId);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Zambia postcode route canonicalizes grouped digits and gates derived geometry', async () => {
  const query = new URLSearchParams({ validAt: ZAMBIA_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/ZM/' + encodeURIComponent('09 998') + '?' + query, { headers: { 'X-AGID-Request-ID': 'zm-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '09998');
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
  assert.equal(body.data.geometries[0].source.sourceId, 'zm-synthetic-derived-postal-review-surface');
});
