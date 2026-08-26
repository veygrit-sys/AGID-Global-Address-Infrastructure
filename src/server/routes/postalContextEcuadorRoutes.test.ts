import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  ECUADOR_POSTAL_CONTEXT_TEST_INSTANT,
  ECUADOR_POSTAL_CONTEXT_TEST_POINT,
  createEcuadorPostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextEcuadorRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, {
    store: createInMemoryPostalContextPackStore(
      new PostalContextPackRuntime(createEcuadorPostalContextRuntimeTestPack()),
    ),
  });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

test('Ecuador resolve route returns explicitly linked building and EC AGID', async () => {
  const response = await fetch(`${baseUrl}/api/postal/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'ec-resolve-test' },
    body: JSON.stringify({
      countryCode: 'EC',
      ...ECUADOR_POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: ECUADOR_POSTAL_CONTEXT_TEST_INSTANT,
    }),
  });
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'EC');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.ok(body.data.agid.cellId);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Ecuador postcode route normalizes and gates the synthetic lookup-like polygon', async () => {
  const query = new URLSearchParams({
    validAt: ECUADOR_POSTAL_CONTEXT_TEST_INSTANT,
    geometry: 'geojson',
  });
  const response = await fetch(
    `${baseUrl}/api/postal/EC/${encodeURIComponent('９９９９９９')}?${query}`,
    { headers: { 'X-AGID-Request-ID': 'ec-postcode-test' } },
  );
  const body = await response.json() as any;
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '999999');
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
  assert.equal(body.data.geometries[0].source.sourceId, 'ec-synthetic-lookup-like-validation-polygon');
});
