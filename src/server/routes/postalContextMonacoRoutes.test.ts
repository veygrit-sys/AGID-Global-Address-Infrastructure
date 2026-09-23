import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  MONACO_POSTAL_CONTEXT_TEST_INSTANT,
  MONACO_POSTAL_CONTEXT_TEST_POINT,
  createMonacoPostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextMonacoRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  const runtime = new PostalContextPackRuntime(createMonacoPostalContextRuntimeTestPack());
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

test('Monaco Postal Context route resolves an explicitly linked DPUM building with AGID', async () => {
  const response = await fetch(`${baseUrl}/api/postal/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'mc-postal-context-test',
    },
    body: JSON.stringify({
      countryCode: 'MC',
      ...MONACO_POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: MONACO_POSTAL_CONTEXT_TEST_INSTANT,
    }),
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'MC');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.ok(body.data.agid.cellId);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Monaco postcode route normalizes spaced input and gates derived geometry', async () => {
  const query = new URLSearchParams({
    validAt: MONACO_POSTAL_CONTEXT_TEST_INSTANT,
    geometry: 'geojson',
  });
  const response = await fetch(`${baseUrl}/api/postal/MC/98%20000?${query}`, {
    headers: { 'X-AGID-Request-ID': 'mc-postal-lookup-test' },
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '98000');
  assert.equal(body.data.geometries.length, 1);
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
});
