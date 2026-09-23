import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  TUNISIA_POSTAL_CONTEXT_TEST_INSTANT,
  TUNISIA_POSTAL_CONTEXT_TEST_POINT,
  createTunisiaPostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextTunisiaRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;
before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, {
    store: createInMemoryPostalContextPackStore(new PostalContextPackRuntime(createTunisiaPostalContextRuntimeTestPack())),
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

test('Tunisia resolve route returns only an explicitly address-linked building and an independent TN AGID cell', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'tn-resolve-test' },
    body: JSON.stringify({ countryCode: 'TN', ...TUNISIA_POSTAL_CONTEXT_TEST_POINT, purpose: 'display', validAt: TUNISIA_POSTAL_CONTEXT_TEST_INSTANT }),
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'TN');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.match(body.data.agid.cellId, /^TN[0-9A-Z]+$/);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Tunisia postcode route preserves leading zero and labels the polygon as derived', async () => {
  const query = new URLSearchParams({ validAt: TUNISIA_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(baseUrl + '/api/postal/TN/' + encodeURIComponent('09 96') + '?' + query, {
    headers: { 'X-AGID-Request-ID': 'tn-postcode-test' },
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '0996');
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
  assert.equal(body.data.geometries[0].source.sourceId, 'tn-synthetic-derived-administrative-postal-review-surface');
});
