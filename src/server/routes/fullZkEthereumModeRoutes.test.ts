import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { issueAddressCredential } from '../../lib/addressCredential';
import { createInMemoryEthereumRegistryOnlyStore } from '../../lib/ethereumRegistryOnlyMode';
import {
  createPrivateAddressPredicateProof,
  stripPrivateAddressPredicateProofMaterial,
  type PrivateAddressPredicateRegion,
} from '../../lib/privateAddressPredicateProof';
import { registerFullZkEthereumModeRoutes } from './fullZkEthereumModeRoutes';

let server: Server;
let baseUrl = '';

const adminToken = 'test-only-mode4-admin-token';
const issuerId = 'agid-mode4-route-issuer';
const issuerSecret = 'test-only-mode4-route-issuer-secret';
const address = {
  country_code: 'JP',
  country: 'Japan',
  state: 'Tokyo',
  city: 'Chiyoda-ku',
  road: 'Marunouchi',
  building: 'Route Mode Four Hidden Tower',
  postcode: '100-0001',
};
const deliveryRegion: PrivateAddressPredicateRegion = {
  id: 'DELIVERY:TOKYO-CENTRAL',
  purpose: 'delivery-area',
  geometry: {
    type: 'bbox',
    north: 35.9,
    south: 35.5,
    west: 139.55,
    east: 139.95,
  },
};

async function postJson(path: string, body: unknown, token = adminToken) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'mode4-route-test-request-id',
      ...(token ? { 'X-AGID-Ethereum-Admin-Token': token } : {}),
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
    headers: { 'X-AGID-Request-ID': 'mode4-route-test-request-id' },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function createPublicEnvelope() {
  const credential = await issueAddressCredential({
    issuerId,
    issuerSecret,
    address,
    countryCode: 'JP',
    postalCode: '100-0001',
    layer: 'AOID',
    subjectId: 'aoid:test:mode4-route-resident',
    verificationStatus: 'verified',
    verificationScore: 0.95,
    sourceIds: ['japan-post', 'tokyo-open-admin-boundary'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateSalt: 'credential-private-salt-mode4-route',
  });
  const envelope = await createPrivateAddressPredicateProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address,
    point: { lat: 35.6812, lon: 139.7671 },
    predicates: [
      { kind: 'delivery-region', region: deliveryRegion },
      { kind: 'country-resident', countryCode: 'JP' },
    ],
    scope: 'mode4-route-aid-event',
    challenge: 'mode4-route-nonce-001',
    issuedAt: '2026-01-01T00:05:00.000Z',
    ttlSeconds: 600,
    privateProofSalt: 'private-mode4-route-proof-salt',
  });

  return stripPrivateAddressPredicateProofMaterial(envelope);
}

before(async () => {
  const app = express();
  app.use(express.json());
  registerFullZkEthereumModeRoutes(app, {
    store: createInMemoryEthereumRegistryOnlyStore(),
    adminToken,
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

test('Mode 4 capabilities route reports full ZK plus Ethereum behavior', async () => {
  const response = await getJson('/api/zk-ethereum/mode4/capabilities');

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.mode, 'full-zk-ethereum');
  assert.equal(response.body.data.zkEnabled, true);
  assert.equal(response.body.data.ethereumEnabled, true);
  assert.equal(response.body.data.gasRequired, true);
});

test('Mode 4 verify-and-record route requires the configured admin token', async () => {
  const envelope = await createPublicEnvelope();
  const response = await postJson('/api/zk-ethereum/mode4/private-address-predicate/verify-and-record', {
    envelope,
    issuerId,
    expectedScope: 'mode4-route-aid-event',
    expectedChallenge: 'mode4-route-nonce-001',
  }, '');

  assert.equal(response.status, 401);
  assert.equal(response.body.ok, false);
});

test('Mode 4 verify-and-record route writes public registry records without hidden address leakage', async () => {
  const envelope = await createPublicEnvelope();
  const response = await postJson('/api/zk-ethereum/mode4/private-address-predicate/verify-and-record', {
    envelope,
    issuerId,
    expectedScope: 'mode4-route-aid-event',
    expectedChallenge: 'mode4-route-nonce-001',
    requiredPredicates: [
      { kind: 'delivery-region', regionId: 'DELIVERY:TOKYO-CENTRAL' },
      { kind: 'country-resident', countryCode: 'JP' },
    ],
    minimumScore: 0.9,
    now: '2026-01-01T00:06:00.000Z',
    networkId: 'base-sepolia',
    revocationAnchor: {
      registryId: 'mode4-route-revocation-registry',
      revocationRoot: 'mode4_route_revocation_root_public',
      freshnessRoot: 'mode4_route_freshness_root_public',
    },
    nullifier: {
      nullifierHash: 'mode4_route_nullifier_hash',
      scope: 'mode4-route-aid-event',
    },
    payment: {
      payerCommitment: 'mode4_route_payer_commitment',
      payeeCommitment: 'mode4_route_payee_commitment',
      purposeHash: 'mode4_route_purpose_hash',
    },
  });
  const serialized = JSON.stringify(response.body);

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.valid, true);
  assert.equal(response.body.data.privacy.zkProofRequired, true);
  assert.equal(response.body.data.ethereum.nullifier.status, 'recorded');
  assert.equal(response.body.data.ethereum.revocationAnchor.status, 'recorded');
  assert.equal(response.body.data.ethereum.payment.status, 'recorded');
  assert.doesNotMatch(serialized, /Route Mode Four Hidden Tower|Marunouchi|100-0001|35\.6812|139\.7671|private-mode4-route-proof-salt/i);
});

test('Mode 4 verify-and-record route rejects duplicate nullifiers', async () => {
  const envelope = await createPublicEnvelope();
  const body = {
    envelope,
    issuerId,
    expectedScope: 'mode4-route-aid-event',
    expectedChallenge: 'mode4-route-nonce-001',
    now: '2026-01-01T00:06:00.000Z',
    nullifier: {
      nullifierHash: 'mode4_route_duplicate_nullifier_hash',
      scope: 'mode4-route-aid-event',
    },
  };
  const first = await postJson('/api/zk-ethereum/mode4/private-address-predicate/verify-and-record', body);
  const second = await postJson('/api/zk-ethereum/mode4/private-address-predicate/verify-and-record', body);

  assert.equal(first.status, 200);
  assert.equal(first.body.ok, true);
  assert.equal(second.status, 409);
  assert.equal(second.body.ok, false);
  assert.equal(second.body.data.ethereum.nullifier.status, 'duplicate');
});

test('Mode 4 verify-and-record route rejects issuer secrets in request bodies', async () => {
  const envelope = await createPublicEnvelope();
  const response = await postJson('/api/zk-ethereum/mode4/private-address-predicate/verify-and-record', {
    envelope,
    issuerId,
    issuerSecret: 'must-not-travel-through-http',
    expectedScope: 'mode4-route-aid-event',
    expectedChallenge: 'mode4-route-nonce-001',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.ok, false);
  assert.match(response.body.error, /issuerSecret is not accepted/i);
});

test('Mode 4 verify-and-record route fails closed when admin token is not configured', async () => {
  const previous = process.env.AGID_ETHEREUM_REGISTRY_ADMIN_TOKEN;
  delete process.env.AGID_ETHEREUM_REGISTRY_ADMIN_TOKEN;
  const isolatedApp = express();
  isolatedApp.use(express.json());
  registerFullZkEthereumModeRoutes(isolatedApp, {
    store: createInMemoryEthereumRegistryOnlyStore(),
    issuerSecrets: { [issuerId]: issuerSecret },
  });
  const isolatedServer = isolatedApp.listen(0);
  try {
    await new Promise<void>(resolve => isolatedServer.once('listening', resolve));
    const addressInfo = isolatedServer.address();
    assert.ok(addressInfo && typeof addressInfo === 'object');
    const response = await fetch(`http://127.0.0.1:${addressInfo.port}/api/zk-ethereum/mode4/private-address-predicate/verify-and-record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        envelope: await createPublicEnvelope(),
        issuerId,
        expectedScope: 'mode4-route-aid-event',
        expectedChallenge: 'mode4-route-nonce-001',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.ok, false);
    assert.match(body.error, /not configured/i);
  } finally {
    await new Promise<void>(resolve => isolatedServer.close(() => resolve()));
    if (previous === undefined) {
      delete process.env.AGID_ETHEREUM_REGISTRY_ADMIN_TOKEN;
    } else {
      process.env.AGID_ETHEREUM_REGISTRY_ADMIN_TOKEN = previous;
    }
  }
});
