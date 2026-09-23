import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  SOUTH_AFRICA_POSTAL_CONTEXT_TEST_INSTANT,
  SOUTH_AFRICA_POSTAL_CONTEXT_TEST_POINT,
  createSouthAfricaPostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextSouthAfricaRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  const runtime = new PostalContextPackRuntime(createSouthAfricaPostalContextRuntimeTestPack());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(runtime) });
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

test('South Africa resolve route returns explicitly linked building and ZA AGID', async () => {
  const response = await fetch(`${baseUrl}/api/postal/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AGID-Request-ID': 'za-resolve-test' },
    body: JSON.stringify({
      countryCode: 'ZA',
      ...SOUTH_AFRICA_POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: SOUTH_AFRICA_POSTAL_CONTEXT_TEST_INSTANT,
    }),
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'ZA');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.ok(body.data.agid.cellId);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('South Africa postcode route canonicalizes spaces and returns a point, not polygon', async () => {
  const query = new URLSearchParams({
    validAt: SOUTH_AFRICA_POSTAL_CONTEXT_TEST_INSTANT,
    geometry: 'geojson',
  });
  const response = await fetch(
    `${baseUrl}/api/postal/ZA/${encodeURIComponent('00 00')}?${query}`,
    { headers: { 'X-AGID-Request-ID': 'za-postcode-test' } },
  );
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '0000');
  assert.equal(body.data.geometries[0].geometry.type, 'Point');
});
