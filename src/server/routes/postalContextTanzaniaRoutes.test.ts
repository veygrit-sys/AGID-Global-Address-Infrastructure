import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  TANZANIA_POSTAL_CONTEXT_TEST_INSTANT,
  TANZANIA_POSTAL_CONTEXT_TEST_POINT,
  createTanzaniaPostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextTanzaniaRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;
before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, {
    store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createTanzaniaPostalContextRuntimeTestPack())),
  });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = 'http://127.0.0.1:' + address.port;
});
after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('Tanzania resolve route returns only an explicitly address-linked building and an independent TZ AGID cell', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'tz-resolve-test' },
    body: JSON.stringify({ countryCode: 'TZ', ...TANZANIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: TANZANIA_POSTAL_CONTEXT_TEST_INSTANT }),
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'TZ');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.match(body.data.agid.cellId, /^TZ[0-9A-Z]+$/);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Tanzania postcode route canonicalizes grouped digits and labels the polygon as derived', async () => {
  const query = new URLSearchParams({ validAt: TANZANIA_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/TZ/' + encodeURIComponent('19 999') + '?' + query, {
    headers: { 'X-AGID-Request-ID': 'tz-postcode-test' },
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '19999');
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
  assert.equal(body.data.geometries[0].source.sourceId, 'tz-synthetic-derived-administrative-postal-review-surface');
});
