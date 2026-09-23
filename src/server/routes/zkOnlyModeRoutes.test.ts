import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { issueAddressCredential } from '../../lib/addressCredential';
import {
  createPrivateAddressPredicateProof,
  stripPrivateAddressPredicateProofMaterial,
} from '../../lib/privateAddressPredicateProof';
import { registerZkOnlyModeRoutes } from './zkOnlyModeRoutes';

let server: Server;
let baseUrl = '';

const issuerId = 'agid-zk-only-route-test-issuer';
const issuerSecret = 'test-only-zk-only-route-issuer-secret';
const address = {
  country_code: 'JP',
  country: 'Japan',
  state: 'Tokyo',
  city: 'Chiyoda-ku',
  district: 'Marunouchi',
  road: 'Marunouchi',
  house_number: '1',
  building: 'Hidden Tower',
  postcode: '100-0001',
};

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'zk-only-route-test-request-id',
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
    headers: { 'X-AGID-Request-ID': 'zk-only-route-test-request-id' },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function createRouteProof() {
  const credential = await issueAddressCredential({
    issuerId,
    issuerSecret,
    address,
    countryCode: 'JP',
    postalCode: '100-0001',
    layer: 'AOID',
    subjectId: 'aoid:test:zk-only-route-resident',
    verificationStatus: 'verified',
    verificationScore: 0.94,
    sourceIds: ['japan-post'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateSalt: 'credential-private-salt-zk-only-route',
  });
  const envelope = await createPrivateAddressPredicateProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    predicates: [{ kind: 'country-resident', countryCode: 'JP' }],
    scope: 'humanitarian-check',
    challenge: 'zk-only-route-nonce',
    issuedAt: '2026-01-01T00:05:00.000Z',
    ttlSeconds: 600,
    privateProofSalt: 'private-zk-only-route-proof-salt',
  });
  return stripPrivateAddressPredicateProofMaterial(envelope);
}

before(async () => {
  const app = express();
  app.use(express.json());
  registerZkOnlyModeRoutes(app, {
    issuerSecrets: { [issuerId]: issuerSecret },
  });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const addressInfo = server.address();
  assert.ok(addressInfo && typeof addressInfo === 'object');
  baseUrl = `http://127.0.0.1:${addressInfo.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('Mode 2 capabilities route reports no Ethereum or public ledger dependency', async () => {
  const response = await getJson('/api/zk/mode2/capabilities');

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.mode, 'zk-only');
  assert.equal(response.body.data.ethereumEnabled, false);
  assert.equal(response.body.data.publicLedgerEnabled, false);
  assert.equal(response.body.data.gasCost, 0);
});

test('Mode 2 route verifies a private predicate proof without leaking hidden address material', async () => {
  const proof = await createRouteProof();
  const response = await postJson('/api/zk/mode2/private-address-predicate/verify', {
    proof,
    surface: 'humanitarian-server',
    issuerId,
    expectedScope: 'humanitarian-check',
    expectedChallenge: 'zk-only-route-nonce',
    requiredPredicates: [{ kind: 'country-resident', countryCode: 'JP' }],
    now: '2026-01-01T00:06:00.000Z',
  });
  const serialized = JSON.stringify(response.body);

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.mode, 'zk-only');
  assert.equal(response.body.data.surface, 'humanitarian-server');
  assert.equal(response.body.data.ledger.ethereumUsed, false);
  assert.equal(response.body.data.ledger.publicLedgerWritten, false);
  assert.equal(response.body.data.privacy.rawProofsStored, false);
  assert.doesNotMatch(serialized, /Marunouchi|100-0001|Hidden Tower|private-zk-only-route-proof-salt/i);
});

test('Mode 2 route rejects issuer secrets in request bodies', async () => {
  const proof = await createRouteProof();
  const response = await postJson('/api/zk/mode2/private-address-predicate/verify', {
    proof,
    issuerId,
    issuerSecret: 'must-not-travel-through-http',
    expectedScope: 'humanitarian-check',
    expectedChallenge: 'zk-only-route-nonce',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.ok, false);
  assert.match(response.body.error, /issuerSecret is not accepted/i);
});

test('Mode 2 route fails closed when issuer verification secret is not configured', async () => {
  const previousDefault = process.env.AGID_ZK_ISSUER_SECRET;
  const previousSpecific = process.env.AGID_ZK_ISSUER_SECRET_AGID_ZK_ONLY_ROUTE_TEST_ISSUER;
  const previousLegacy = process.env.AGID_PRIVATE_ADDRESS_PREDICATE_ISSUER_SECRET;
  delete process.env.AGID_ZK_ISSUER_SECRET;
  delete process.env.AGID_ZK_ISSUER_SECRET_AGID_ZK_ONLY_ROUTE_TEST_ISSUER;
  delete process.env.AGID_PRIVATE_ADDRESS_PREDICATE_ISSUER_SECRET;

  const isolatedApp = express();
  isolatedApp.use(express.json());
  registerZkOnlyModeRoutes(isolatedApp);
  const isolatedServer = isolatedApp.listen(0);
  try {
    await new Promise<void>(resolve => isolatedServer.once('listening', resolve));
    const addressInfo = isolatedServer.address();
    assert.ok(addressInfo && typeof addressInfo === 'object');
    const proof = await createRouteProof();
    const response = await fetch(`http://127.0.0.1:${addressInfo.port}/api/zk/mode2/private-address-predicate/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proof,
        issuerId,
        expectedScope: 'humanitarian-check',
        expectedChallenge: 'zk-only-route-nonce',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.ok, false);
    assert.match(body.error, /not configured/i);
  } finally {
    await new Promise<void>(resolve => isolatedServer.close(() => resolve()));
    if (previousDefault === undefined) delete process.env.AGID_ZK_ISSUER_SECRET;
    else process.env.AGID_ZK_ISSUER_SECRET = previousDefault;
    if (previousSpecific === undefined) delete process.env.AGID_ZK_ISSUER_SECRET_AGID_ZK_ONLY_ROUTE_TEST_ISSUER;
    else process.env.AGID_ZK_ISSUER_SECRET_AGID_ZK_ONLY_ROUTE_TEST_ISSUER = previousSpecific;
    if (previousLegacy === undefined) delete process.env.AGID_PRIVATE_ADDRESS_PREDICATE_ISSUER_SECRET;
    else process.env.AGID_PRIVATE_ADDRESS_PREDICATE_ISSUER_SECRET = previousLegacy;
  }
});
