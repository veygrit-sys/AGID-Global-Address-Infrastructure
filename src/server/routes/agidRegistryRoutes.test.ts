import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { createInMemoryAgidRegistryApiStore } from '../../lib/agidRegistryApi';
import { registerAgidRegistryRoutes } from './agidRegistryRoutes';
import { createTerminalHmacSignature } from '../routeSecurity';

let server: Server;
let baseUrl = '';

const adminToken = 'test-only-mode1-registry-admin-token';
const terminalSigningSecret = 'test-only-mode1-terminal-signing-secret';

function signMode1MarkUsed(body: Record<string, unknown>, nonce: string) {
  const signedAt = new Date().toISOString();
  const terminalId = 'mode1-terminal-route-test';
  return {
    ...body,
    terminalId,
    signatureNonce: nonce,
    signedAt,
    terminalSignature: createTerminalHmacSignature(terminalSigningSecret, {
      basePath: '/api/registry/mode1',
      nullifierHash: body.nullifierHash,
      scope: body.scope,
      operation: 'mode1:nullifier:mark-used',
      terminalId,
      signatureNonce: nonce,
      signedAt,
    }),
  };
}

async function postJson(path: string, body: unknown, token?: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'mode1-registry-route-test-request-id',
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
    headers: { 'X-AGID-Request-ID': 'mode1-registry-route-test-request-id' },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

before(async () => {
  const app = express();
  app.use(express.json());
  registerAgidRegistryRoutes(app, {
    store: createInMemoryAgidRegistryApiStore(),
    adminToken,
    terminalSigningSecret,
  });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('Mode 1 Registry API reports server registry capabilities without ZK or Ethereum', async () => {
  const response = await getJson('/api/registry/mode1/capabilities');

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.mode, 'local-server-registry');
  assert.equal(response.body.data.zkProofRequired, false);
  assert.equal(response.body.data.ethereumRequired, false);
  assert.equal(response.body.data.gasRequired, false);
  assert.equal(response.body.data.privacy.rawAddressStored, false);
  assert.equal(response.body.data.privacy.rawAgidStored, false);
  assert.equal(response.body.data.privacy.rawAoidStored, false);
});

test('Mode 1 Registry API admin writes require configured admin token', async () => {
  const missing = await postJson('/api/registry/mode1/issuer/register', {
    issuerId: 'route-issuer-missing-token',
  });
  const valid = await postJson('/api/registry/mode1/issuer/register', {
    issuerId: 'route-issuer',
    trustScore: 0.82,
    publicKeyCommitment: '0xROUTEKEY',
  }, adminToken);

  assert.equal(missing.status, 401);
  assert.equal(missing.body.ok, false);
  assert.equal(valid.status, 200);
  assert.equal(valid.body.ok, true);
  assert.equal(valid.body.data.record.issuerId, 'route-issuer');
});

test('Mode 1 Registry API admin writes fail closed when token is not configured', async () => {
  const previous = process.env.AGID_REGISTRY_ADMIN_TOKEN;
  delete process.env.AGID_REGISTRY_ADMIN_TOKEN;
  const isolatedApp = express();
  isolatedApp.use(express.json());
  registerAgidRegistryRoutes(isolatedApp, {
    store: createInMemoryAgidRegistryApiStore(),
  });
  const isolatedServer = isolatedApp.listen(0);
  try {
    await new Promise<void>(resolve => isolatedServer.once('listening', resolve));
    const address = isolatedServer.address();
    assert.ok(address && typeof address === 'object');
    const response = await fetch(`http://127.0.0.1:${address.port}/api/registry/mode1/issuer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issuerId: 'issuer-no-token-config' }),
    });
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.ok, false);
    assert.match(body.error, /not configured/i);
  } finally {
    await new Promise<void>(resolve => isolatedServer.close(() => resolve()));
    if (previous === undefined) {
      delete process.env.AGID_REGISTRY_ADMIN_TOKEN;
    } else {
      process.env.AGID_REGISTRY_ADMIN_TOKEN = previous;
    }
  }
});

test('Mode 1 Registry API verifies public commitment state and does not leak raw address material', async () => {
  await postJson('/api/registry/mode1/freshness/anchor', {
    freshnessRoot: '0xroutefresh',
    registryId: 'route-registry',
    issuerId: 'route-issuer',
    freshUntil: '2026-06-18T00:00:00.000Z',
  }, adminToken);

  const response = await postJson('/api/registry/mode1/verify', {
    issuerId: 'route-issuer',
    credentialCommitment: '0xroutecredential',
    addressReferenceCommitment: '0xrouteaddressref',
    freshnessRoot: '0xroutefresh',
    nullifierHash: '0xroutenullifier',
    scope: 'delivery',
    now: '2026-06-17T00:00:00.000Z',
  });
  const serialized = JSON.stringify(response.body);

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.valid, true);
  assert.equal(response.body.data.freshness.anchored, true);
  assert.doesNotMatch(serialized, /東京都|丸の内|AGID-SECRET|AOID-SECRET|\+81|100-0001/i);
});

test('Mode 1 Registry API rejects private raw location payloads', async () => {
  const response = await postJson('/api/registry/mode1/verify', {
    issuerId: 'route-issuer',
    agid: 'AGID-SECRET-123456',
    address: '東京都千代田区丸の内1-1',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.ok, false);
  assert.match(response.body.data.errors.join('\n'), /private material/i);
});

test('Mode 1 Registry API rejects duplicate nullifier use', async () => {
  const first = await postJson('/api/registry/mode1/nullifier/mark-used', {
    ...signMode1MarkUsed({
    nullifierHash: '0xrouteusednullifier',
    scope: 'aid-event',
    }, 'nonce-route-used-1'),
  });
  const second = await postJson('/api/registry/mode1/nullifier/mark-used', {
    ...signMode1MarkUsed({
    nullifierHash: '0xrouteusednullifier',
    scope: 'aid-event',
    }, 'nonce-route-used-2'),
  });

  assert.equal(first.status, 200);
  assert.equal(first.body.ok, true);
  assert.equal(second.status, 409);
  assert.equal(second.body.ok, false);
  assert.equal(second.body.data.status, 'duplicate');
});
