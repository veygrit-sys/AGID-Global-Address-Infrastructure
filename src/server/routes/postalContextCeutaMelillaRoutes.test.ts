import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { createConfiguredPostalContextPackStore } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

let server: Server;
let baseUrl: string;

before(async () => {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createConfiguredPostalContextPackStore({}) });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = 'http://127.0.0.1:' + address.port;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('Ceuta and Melilla postcode route normalizes EA input and fails closed without licensed geometry', async () => {
  const response = await fetch(
    baseUrl + '/api/postal/EA/' + encodeURIComponent('５１ ００１') + '?geometry=geojson',
    { headers: { 'X-AGID-Request-ID': 'ea-no-licensed-geometry' } },
  );
  const body = await response.json() as any;
  assert.equal(response.status, 503);
  assert.equal(body.ok, false);
  assert.equal(body.error, 'Postal Context pack is unavailable');
  assert.deepEqual(body.sources, ['agid-postal-context-runtime']);
  assert.equal(body.requestId, 'ea-no-licensed-geometry');
});
