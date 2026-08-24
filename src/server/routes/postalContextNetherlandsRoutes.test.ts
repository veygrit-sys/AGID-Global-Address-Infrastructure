import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  NETHERLANDS_POSTAL_CONTEXT_TEST_INSTANT,
  NETHERLANDS_POSTAL_CONTEXT_TEST_POINT,
  createNetherlandsPostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextNetherlandsRuntimeFixture';
import { createInMemoryPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  const runtime = new PostalContextPackRuntime(createNetherlandsPostalContextRuntimeTestPack());
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

test('Netherlands Postal Context route resolves BAG-linked building context with AGID', async () => {
  const response = await fetch(`${baseUrl}/api/postal/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'nl-postal-context-test',
    },
    body: JSON.stringify({
      countryCode: 'NL',
      ...NETHERLANDS_POSTAL_CONTEXT_TEST_POINT,
      purpose: 'display',
      validAt: NETHERLANDS_POSTAL_CONTEXT_TEST_INSTANT,
    }),
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.countryCode, 'NL');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.ok(body.data.agid.cellId);
  assert.equal(body.data.agid.canonicalPostalGeometry, false);
});

test('Netherlands PC6 route normalizes compact input and gates derived geometry', async () => {
  const query = new URLSearchParams({
    validAt: NETHERLANDS_POSTAL_CONTEXT_TEST_INSTANT,
    geometry: 'geojson',
  });
  const response = await fetch(`${baseUrl}/api/postal/NL/0000AA?${query}`, {
    headers: { 'X-AGID-Request-ID': 'nl-postal-lookup-test' },
  });
  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.normalizedPostalCode, '0000 AA');
  assert.equal(body.data.geometries.length, 1);
  assert.equal(body.data.geometries[0].geometry.type, 'Polygon');
});
