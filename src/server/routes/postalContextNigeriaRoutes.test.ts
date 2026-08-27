import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  NIGERIA_POSTAL_CONTEXT_TEST_INSTANT,
  NIGERIA_POSTAL_CONTEXT_TEST_POINT,
  createNigeriaPostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextNigeriaRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;
before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, {
    store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createNigeriaPostalContextRuntimeTestPack())),
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

test('Nigeria resolve route returns only an explicitly address-linked building and an independent NG AGID cell', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'ng-resolve-test' },
    body: JSON.stringify({ countryCode: 'NG', ...NIGERIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: NIGERIA_POSTAL_CONTEXT_TEST_INSTANT }),
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'NG');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.match(body.data.agid.cellId, /^NG[0-9A-Z]+$/);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Nigeria postcode route preserves six digits and labels the polygon as derived', async () => {
  const query = new URLSearchParams({ validAt: NIGERIA_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/NG/' + encodeURIComponent('999 996') + '?' + query, {
    headers: { 'X-AGID-Request-ID': 'ng-postcode-test' },
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '999996');
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
  assert.equal(body.data.geometries[0].source.sourceId, 'ng-synthetic-derived-administrative-postal-review-surface');
});
