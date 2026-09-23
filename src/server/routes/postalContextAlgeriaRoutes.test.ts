import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import { ALGERIA_POSTAL_CONTEXT_TEST_INSTANT, ALGERIA_POSTAL_CONTEXT_TEST_POINT, createAlgeriaPostalContextRuntimeTestPack } from '../../testFixtures/postalContextAlgeriaRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createAlgeriaPostalContextRuntimeTestPack())) });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = 'http://127.0.0.1:' + address.port;
});

after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('Algeria resolve route returns explicitly linked building and DZ AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'dz-resolve-test' },
    body: JSON.stringify({ countryCode: 'DZ', ...ALGERIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: ALGERIA_POSTAL_CONTEXT_TEST_INSTANT }),
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'DZ');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.ok(body.data.agid.cellId);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Algeria postcode route canonicalizes grouped digits and gates derived geometry', async () => {
  const query = new URLSearchParams({ validAt: ALGERIA_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/DZ/' + encodeURIComponent('09 999') + '?' + query, { headers: { 'X-AGID-Request-ID': 'dz-postcode-test' } });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '09999');
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
  assert.equal(body.data.geometries[0].source.sourceId, 'dz-synthetic-derived-postal-review-surface');
});
