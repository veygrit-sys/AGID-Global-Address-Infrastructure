import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { registerManagedZkProofServerRoutes } from './managedZkProofServerRoutes';

let server: Server;
let baseUrl = '';

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'managed-zk-route-test-request-id',
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
    headers: { 'X-AGID-Request-ID': 'managed-zk-route-test-request-id' },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

before(async () => {
  const app = express();
  app.use(express.json());
  registerManagedZkProofServerRoutes(app);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const addressInfo = server.address();
  assert.ok(addressInfo && typeof addressInfo === 'object');
  baseUrl = `http://127.0.0.1:${addressInfo.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('managed ZK proof server capability route reports public-only proof generation contract', async () => {
  const response = await getJson('/api/zk/managed-proof-server/capabilities');

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.modelVersion, 'agid-managed-zk-proof-server-v1');
  assert.equal(response.body.data.privacy.rawWitnessAccepted, false);
  assert.equal(response.body.data.privacy.serverHeldWitnessAllowed, false);
  assert.ok(response.body.data.backends.includes('circom-snarkjs'));
});

test('managed ZK proof job route accepts public commitments and does not echo private material', async () => {
  const response = await postJson('/api/zk/managed-proof-server/jobs', {
    requestedAt: '2026-06-17T00:00:00.000Z',
    tenantId: 'carrier-terminal-network',
    proofFamily: 'zk-delivery-eligibility',
    backend: 'circom-snarkjs',
    deploymentProfile: 'private-carrier',
    witnessMode: 'client-side-witness',
    publicInputs: {
      deliveryAreaRoot: 'DELIVERY-AREA-ROOT',
      revocationRoot: 'REVOCATION-ROOT',
    },
    commitments: {
      credentialCommitment: 'CREDENTIAL-COMMITMENT',
      nullifierHash: 'NULLIFIER-HASH',
    },
  });
  const serialized = JSON.stringify(response.body);

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.accepted, true);
  assert.equal(response.body.data.status, 'requires-client-proof');
  assert.equal(response.body.data.artifactPolicy.storeWitness, false);
  assert.doesNotMatch(serialized, /private address|recipient secret/i);
});

test('managed ZK proof job route rejects raw AGID and witness payloads', async () => {
  const response = await postJson('/api/zk/managed-proof-server/jobs', {
    requestedAt: '2026-06-17T00:00:00.000Z',
    proofFamily: 'zk-address',
    rawAgid: 'JP05AV8TJGH8',
    witness: {
      address: 'hidden location',
      holderSecret: 'secret',
    },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.data.accepted, false);
  assert.match(response.body.data.errors.join('\n'), /rawAgid.*private/i);
  assert.match(response.body.data.errors.join('\n'), /witness.*private/i);
});
