import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  SINGAPORE_POSTAL_CONTEXT_TEST_INSTANT,
  SINGAPORE_POSTAL_CONTEXT_TEST_POINT,
  createSingaporePostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextSingaporeRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  const runtime = new PostalContextPackRuntime(createSingaporePostalContextRuntimeTestPack());
  registerPostalContextRoutes(app, {
    store: createInMemoryPostalContextPackStore(runtime),
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

test('Singapore Postal Context routes resolve a delivery-point-first pack with AGID', async () => {
  const response = await fetch(`${baseUrl}/api/postal/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'sg-postal-context-test',
    },
    body: JSON.stringify({
      countryCode: 'SG',
      ...SINGAPORE_POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: SINGAPORE_POSTAL_CONTEXT_TEST_INSTANT,
    }),
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'SG');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.ok(body.data.agid.cellId);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Singapore six-digit lookup remains context-only when no postal polygon exists', async () => {
  const query = new URLSearchParams({ validAt: SINGAPORE_POSTAL_CONTEXT_TEST_INSTANT });
  const response = await fetch(`${baseUrl}/api/postal/SG/000001?${query}`, {
    headers: { 'X-AGID-Request-ID': 'sg-postal-lookup-test' },
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '000001');
  assert.deepEqual(body.data.geometries, []);
});

test('configured country routing still rejects unknown countries', async () => {
  const response = await fetch(`${baseUrl}/api/postal/releases/US`, {
    headers: { 'X-AGID-Request-ID': 'unsupported-postal-country-test' },
  });
  assert.equal(response.status, 404);
});
