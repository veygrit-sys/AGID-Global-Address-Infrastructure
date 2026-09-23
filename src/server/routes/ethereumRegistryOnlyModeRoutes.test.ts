import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { createInMemoryEthereumRegistryOnlyStore } from '../../lib/ethereumRegistryOnlyMode';
import { registerEthereumRegistryOnlyModeRoutes } from './ethereumRegistryOnlyModeRoutes';

let server: Server;
let baseUrl = '';

const adminToken = 'test-only-ethereum-mode3-admin-token';
const fakeTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

async function postJson(path: string, body: unknown, token = adminToken) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'ethereum-mode3-route-test-request-id',
      ...(token ? { 'X-AGID-Ethereum-Admin-Token': token } : {}),
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function getJson(path: string, token = adminToken) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'X-AGID-Request-ID': 'ethereum-mode3-route-test-request-id',
      ...(token ? { 'X-AGID-Ethereum-Admin-Token': token } : {}),
    },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

before(async () => {
  const app = express();
  app.use(express.json());
  registerEthereumRegistryOnlyModeRoutes(app, {
    store: createInMemoryEthereumRegistryOnlyStore(),
    adminToken,
    ethereumClient: {
      submitTxPlan: async (txPlan: any) => ({
        modeVersion: txPlan.modeVersion,
        abiVersion: 'agid-ethereum-registry-abi-v1',
        operation: txPlan.operation,
        contractRole: txPlan.contractRole,
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        functionName: txPlan.method,
        txHash: fakeTxHash,
        receipt: {
          txHash: fakeTxHash,
          status: 'success',
          blockNumber: '100',
          confirmations: 2,
          gasUsed: '55000',
          effectiveGasPrice: '1000000000',
          contractAddress: null,
        },
        requiredConfirmations: 2,
        submittedAt: '2026-06-07T00:00:00.000Z',
        warnings: [],
      }),
      receipt: async (txHash: string) => ({
        txHash,
        status: 'success',
        blockNumber: '100',
        confirmations: 2,
        gasUsed: '55000',
        effectiveGasPrice: '1000000000',
        contractAddress: null,
      }),
    } as any,
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

test('Mode 3 capabilities route reports Ethereum registry-only behavior', async () => {
  const response = await getJson('/api/ethereum/mode3/capabilities');

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.mode, 'ethereum-registry-only');
  assert.equal(response.body.data.zkEnabled, false);
  assert.equal(response.body.data.ethereumEnabled, true);
  assert.equal(response.body.data.gasRequired, true);
});

test('Mode 3 write routes require the configured admin token', async () => {
  const response = await postJson('/api/ethereum/mode3/issuer/register', {
    issuerId: 'issuer-without-token',
    issuerAddress: '0x1234567890abcdef1234567890abcdef12345678',
  }, '');

  assert.equal(response.status, 401);
  assert.equal(response.body.ok, false);
});

test('Mode 3 write routes fail closed when admin token is not configured', async () => {
  const previous = process.env.AGID_ETHEREUM_REGISTRY_ADMIN_TOKEN;
  delete process.env.AGID_ETHEREUM_REGISTRY_ADMIN_TOKEN;
  const isolatedApp = express();
  isolatedApp.use(express.json());
  registerEthereumRegistryOnlyModeRoutes(isolatedApp, {
    store: createInMemoryEthereumRegistryOnlyStore(),
  });
  const isolatedServer = isolatedApp.listen(0);
  try {
    await new Promise<void>(resolve => isolatedServer.once('listening', resolve));
    const addressInfo = isolatedServer.address();
    assert.ok(addressInfo && typeof addressInfo === 'object');
    const response = await fetch(`http://127.0.0.1:${addressInfo.port}/api/ethereum/mode3/issuer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuerId: 'issuer-no-admin-config',
        issuerAddress: '0x1234567890abcdef1234567890abcdef12345678',
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

test('Mode 3 issuer route records public registry state only', async () => {
  const response = await postJson('/api/ethereum/mode3/issuer/register', {
    issuerId: 'route-issuer',
    issuerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    issuerPublicKeyCommitment: 'route_issuer_public_key_commitment',
    metadataHash: '0xrouteabc',
    policyHash: '0xroutedef',
    networkId: 'base-sepolia',
  });
  const serialized = JSON.stringify(response.body);

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.record.issuerId, 'route-issuer');
  assert.equal(response.body.data.txPlan.contractRole, 'issuer-registry');
  assert.equal(response.body.data.txPlan.zkProofRequired, false);
  assert.doesNotMatch(serialized, /AGID-SECRET|AOID-SECRET|東京都|丸の内|100-0001/i);
});

test('Mode 3 nullifier route rejects duplicate use', async () => {
  const first = await postJson('/api/ethereum/mode3/nullifier/mark-used', {
    nullifierHash: 'route_nullifier_hash',
    scope: 'aid-event-route',
  });
  const second = await postJson('/api/ethereum/mode3/nullifier/mark-used', {
    nullifierHash: 'route_nullifier_hash',
    scope: 'aid-event-route',
  });

  assert.equal(first.status, 200);
  assert.equal(first.body.ok, true);
  assert.equal(second.status, 409);
  assert.equal(second.body.ok, false);
  assert.equal(second.body.data.status, 'duplicate');
});

test('Mode 3 payment route rejects raw address material', async () => {
  const unsafePayment = {
    paymentId: 'unsafe-payment',
    payerCommitment: 'payer_public_commitment',
    payeeCommitment: 'payee_public_commitment',
    purposeHash: 'purpose_hash',
    address: '東京都千代田区丸の内1-1',
  };
  const response = await postJson('/api/ethereum/mode3/payment/record', unsafePayment);

  assert.equal(response.status, 400);
  assert.equal(response.body.ok, false);
  assert.match(response.body.data.errors.join('\n'), /raw-private-material-not-allowed-in-mode3/);
});

test('Mode 3 transaction submit rejects private keys in request bodies', async () => {
  const response = await postJson('/api/ethereum/mode3/tx/submit', {
    privateKey: '0x'.padEnd(66, '1'),
    txPlan: {},
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.ok, false);
  assert.match(response.body.error, /Private keys/);
});

test('Mode 3 transaction submit and receipt routes expose signed-send boundary', async () => {
  const planned = await postJson('/api/ethereum/mode3/nullifier/mark-used', {
    nullifierHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    scope: 'aid-event-route-submit',
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
  });
  const submitted = await postJson('/api/ethereum/mode3/tx/submit', {
    txPlan: planned.body.data.txPlan,
    requiredConfirmations: 2,
  });
  const receipt = await getJson(`/api/ethereum/mode3/tx/receipt/${fakeTxHash}`);

  assert.equal(planned.status, 200);
  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.ok, true);
  assert.equal(submitted.body.data.submission.txHash, fakeTxHash);
  assert.equal(submitted.body.data.registryUpdateHint.repeatOriginalMode3OperationWithObservedTxHash, true);
  assert.equal(receipt.status, 200);
  assert.equal(receipt.body.data.receipt.status, 'success');
});
