import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  BAHRAIN_POSTAL_CONTEXT_TEST_INSTANT,
  BAHRAIN_POSTAL_CONTEXT_TEST_POINT,
  createBahrainPostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextBahrainRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, {
    store: createInMemoryPostalContextPackStore(
      new PostalContextPackRuntime(createBahrainPostalContextRuntimeTestPack()),
    ),
  });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = 'http://127.0.0.1:' + address.port;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

test('Bahrain resolve route returns explicitly linked building and BH AGID', async () => {
  const response = await fetch(baseUrl + '/api/postal/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'bh-resolve-test' },
    body: JSON.stringify({
      countryCode: 'BH',
      ...BAHRAIN_POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: BAHRAIN_POSTAL_CONTEXT_TEST_INSTANT,
    }),
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'BH');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.ok(body.data.agid.cellId);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Bahrain postcode route normalizes three digits and gates derived geometry', async () => {
  const query = new URLSearchParams({ validAt: BAHRAIN_POSTAL_CONTEXT_TEST_INSTANT, geometry: 'geojson' });
  const response = await fetch(
    baseUrl + '/api/postal/BH/' + encodeURIComponent('1 00') + '?' + query,
    { headers: { 'X-AGID-Request-ID': 'bh-postcode-test' } },
  );
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '100');
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
  assert.equal(body.data.geometries[0].source.sourceId, 'bh-synthetic-derived-block-postal-surface');
});
