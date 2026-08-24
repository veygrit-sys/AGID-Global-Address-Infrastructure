import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  LIECHTENSTEIN_POSTAL_CONTEXT_TEST_INSTANT,
  LIECHTENSTEIN_POSTAL_CONTEXT_TEST_POINT,
  createLiechtensteinPostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextLiechtensteinRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  const runtime = new PostalContextPackRuntime(createLiechtensteinPostalContextRuntimeTestPack());
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

test('Liechtenstein Postal Context route resolves an explicitly linked LLV building with LI AGID', async () => {
  const response = await fetch(`${baseUrl}/api/postal/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'li-postal-context-test',
    },
    body: JSON.stringify({
      countryCode: 'LI',
      ...LIECHTENSTEIN_POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: LIECHTENSTEIN_POSTAL_CONTEXT_TEST_INSTANT,
    }),
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'LI');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.match(body.data.agid.cellId, /^LI/);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Liechtenstein postcode route preserves four digits and gates geometry', async () => {
  const query = new URLSearchParams({
    validAt: LIECHTENSTEIN_POSTAL_CONTEXT_TEST_INSTANT,
    geometry: 'geojson',
  });
  const response = await fetch(`${baseUrl}/api/postal/LI/9400?${query}`, {
    headers: { 'X-AGID-Request-ID': 'li-postal-lookup-test' },
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '9400');
  assert.equal(body.data.geometries.length, 1);
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
});
