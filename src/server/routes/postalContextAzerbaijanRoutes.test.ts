import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  AZERBAIJAN_POSTAL_CONTEXT_TEST_INSTANT,
  AZERBAIJAN_POSTAL_CONTEXT_TEST_POINT,
  createAzerbaijanPostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextAzerbaijanRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  const runtime = new PostalContextPackRuntime(createAzerbaijanPostalContextRuntimeTestPack());
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

test('Azerbaijan Postal Context route resolves an explicitly linked cadastral building with AZ AGID', async () => {
  const response = await fetch(`${baseUrl}/api/postal/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'az-postal-context-test',
    },
    body: JSON.stringify({
      countryCode: 'AZ',
      ...AZERBAIJAN_POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: AZERBAIJAN_POSTAL_CONTEXT_TEST_INSTANT,
    }),
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'AZ');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.match(body.data.agid.cellId, /^AZ/);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Azerbaijan postcode route canonicalizes AZNNNN and gates geometry', async () => {
  const query = new URLSearchParams({
    validAt: AZERBAIJAN_POSTAL_CONTEXT_TEST_INSTANT,
    geometry: 'geojson',
  });
  const response = await fetch(`${baseUrl}/api/postal/AZ/az%200000?${query}`, {
    headers: { 'X-AGID-Request-ID': 'az-postal-lookup-test' },
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, 'AZ0000');
  assert.equal(body.data.geometries.length, 1);
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
});
