import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { registerExternalProxyRoutes } from './externalProxyRoutes';

let server: Server;
let baseUrl = '';
const fetchedUrls: string[] = [];

before(async () => {
  const app = express();
  registerExternalProxyRoutes(app, {
    publicCachedGetFetch: async (url: string) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true, upstream: url }),
        arrayBuffer: async () => new TextEncoder().encode('ok').buffer,
      };
    },
  });
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test('postal proxies normalize accepted values before fixed-host fetch', async () => {
  fetchedUrls.length = 0;
  const response = await fetch(`${baseUrl}/api/br-viacep/01310-100`);
  assert.equal(response.status, 200);
  assert.equal(fetchedUrls[0], 'https://viacep.com.br/ws/01310100/json/');
});

test('postal proxies reject malformed path input before fixed-host fetch', async () => {
  fetchedUrls.length = 0;
  const response = await fetch(`${baseUrl}/api/in-pincode/110001%3Fraw=true`);
  assert.equal(response.status, 400);
  assert.deepEqual(fetchedUrls, []);
});

test('GEBCO proxy rejects unbounded or oversized WMS requests before fetch', async () => {
  fetchedUrls.length = 0;
  const response = await fetch(`${baseUrl}/api/gebco?request=GetMap&width=9000&height=512&format=image/png`);
  assert.equal(response.status, 400);
  assert.deepEqual(fetchedUrls, []);
});
