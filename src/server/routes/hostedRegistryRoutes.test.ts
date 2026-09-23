import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { FileHostedAgidRegistryApiStore } from '../hostedRegistryStore';
import { registerAgidRegistryRoutes } from './agidRegistryRoutes';

let server: Server;
let baseUrl = '';
let tempDir = '';

const adminToken = 'test-only-hosted-registry-admin-token';

async function postJson(path: string, body: unknown, token?: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'hosted-registry-route-test-request-id',
      ...(token ? { 'X-AGID-Registry-Admin-Token': token } : {}),
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function getJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-AGID-Request-ID': 'hosted-registry-route-test-request-id' },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

before(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'agid-hosted-registry-routes-'));
  const app = express();
  app.use(express.json());
  registerAgidRegistryRoutes(app, {
    store: new FileHostedAgidRegistryApiStore(join(tempDir, 'registry.json')),
    adminToken,
    basePath: '/api/registry/hosted',
    sourceId: 'agid-hosted-registry-api',
  });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
  await rm(tempDir, { recursive: true, force: true });
});

test('Hosted Registry API exposes public capabilities and privacy posture', async () => {
  const response = await getJson('/api/registry/hosted/capabilities');

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.serverTrusted, undefined);
  assert.equal(response.body.data.zkProofRequired, false);
  assert.equal(response.body.data.ethereumRequired, false);
  assert.equal(response.body.data.privacy.rawAddressStored, false);
  assert.equal(response.body.sources[0], 'agid-hosted-registry-api');
});

test('Hosted Registry API persists write state and verifies against it', async () => {
  const issuer = await postJson('/api/registry/hosted/issuer/register', {
    issuerId: 'hosted-route-issuer',
    trustScore: 0.87,
    publicKeyCommitment: '0xHOSTEDROUTEKEY',
  }, adminToken);
  const freshness = await postJson('/api/registry/hosted/freshness/anchor', {
    freshnessRoot: '0xHOSTEDROUTEFRESH',
    registryId: 'hosted-route-registry',
    issuerId: 'hosted-route-issuer',
    freshUntil: '2026-06-18T00:00:00.000Z',
  }, adminToken);
  const verify = await postJson('/api/registry/hosted/verify', {
    issuerId: 'hosted-route-issuer',
    credentialCommitment: '0xHOSTEDROUTECREDENTIAL',
    freshnessRoot: '0xHOSTEDROUTEFRESH',
    now: '2026-06-17T00:00:00.000Z',
  });
  const status = await getJson('/api/registry/hosted/status');

  assert.equal(issuer.status, 200);
  assert.equal(freshness.status, 200);
  assert.equal(verify.status, 200);
  assert.equal(verify.body.ok, true);
  assert.equal(verify.body.data.freshness.anchored, true);
  assert.equal(status.body.data.issuers.length, 1);
  assert.equal(status.body.data.freshnessRoots.length, 1);
});

test('Hosted Registry API rejects raw private material', async () => {
  const response = await postJson('/api/registry/hosted/verify', {
    issuerId: 'hosted-route-issuer',
    agid: 'AGID-SECRET-123456',
    address: '東京都千代田区丸の内1-1',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.ok, false);
  assert.match(response.body.data.errors.join('\n'), /private material/i);
});
