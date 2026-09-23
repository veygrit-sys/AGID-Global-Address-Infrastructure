import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import express from 'express';

import { createPosAgidSecureRegistryStore } from '../posAgidSecureRegistryStore';
import { registerPosTerminalRoutes } from './posTerminalRoutes';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
} from '../../lib/registeredAddressQr';
import {
  buildShippingLabelQrPayload,
  parseShippingLabelQrPayload,
} from '../../lib/shippingLabelQr';
import { createTerminalHmacSignature } from '../routeSecurity';

let server: Server;
let baseUrl = '';
let tempDir = '';
let previousAdminToken: string | undefined;

const keyId = 'route-pos-key-1';
const usedJti = 'ABCDEFGHJKMNPQRST012345678';
const freshJti = '0123456789ABCDEFGHJKMNPQ';
const terminalSigningSecret = 'test-only-pos-terminal-signing-secret';

function signPosMarkUsed(body: Record<string, unknown>, nonce: string) {
  const signedAt = new Date().toISOString();
  const terminalId = String(body.terminalId ?? 'terminal-route-test');
  return {
    ...body,
    terminalId,
    signatureNonce: nonce,
    signedAt,
    terminalSignature: createTerminalHmacSignature(terminalSigningSecret, {
      keyId: body.keyId,
      jti: String(body.jti ?? '').toUpperCase(),
      operation: 'pos:agid-s:mark-used',
      terminalId,
      signatureNonce: nonce,
      signedAt,
    }),
  };
}

async function postJson(path: string, body: unknown, headers: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'pos-route-test-request-id',
      ...headers,
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
    headers: { 'X-AGID-Request-ID': 'pos-route-test-request-id' },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

function privateAddressPayload() {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Private Receiver',
      phone: '+81 90 0000 0000',
      street: '1-1 Chiyoda',
      city: 'Tokyo',
      postcode: '1000001',
    },
    {
      mode: 'ADDRESS',
      agid: 'JP05AV8TJGH8',
      now: '2026-06-07T00:00:00.000Z',
    },
  );
  return buildRegisteredAddressQrPayload(record, { privacy: 'full' });
}

before(async () => {
  previousAdminToken = process.env.AGID_POS_ADMIN_TOKEN;
  process.env.AGID_POS_ADMIN_TOKEN = 'test-admin-token';
  tempDir = await mkdtemp(join(tmpdir(), 'agid-pos-route-registry-'));

  const app = express();
  app.use(express.json());
  registerPosTerminalRoutes(app, {
    adminToken: 'test-admin-token',
    terminalSigningSecret,
    registryStore: createPosAgidSecureRegistryStore({
      filePath: join(tempDir, 'registry.json'),
    }),
  });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
  if (previousAdminToken === undefined) {
    delete process.env.AGID_POS_ADMIN_TOKEN;
  } else {
    process.env.AGID_POS_ADMIN_TOKEN = previousAdminToken;
  }
  await rm(tempDir, { recursive: true, force: true });
});

test('POS Mode 1 registry exposes only status metadata', async () => {
  const status = await getJson('/api/pos/agid-s/registry');
  assert.equal(status.status, 200);
  assert.equal(status.body.ok, true);
  assert.equal(status.body.data.storageMode, 'file');
  assert.equal(status.body.data.publicFieldsOnly, true);
  assert.equal(status.body.data.rawAddressStorage, false);
  assert.equal(status.body.data.decryptedAgidStorage, false);
  assert.equal(status.body.data.rawAgidSecureStorage, false);
  assert.equal(status.body.data.deferredSyncSupported, true);
  assert.equal(status.body.data.usedCount, 0);
});

test('POS Mode 1 registry rejects reused tokens and admin-protects revoke sync', async () => {
  const markUsed = await postJson('/api/pos/agid-s/registry/mark-used', signPosMarkUsed({
    keyId,
    jti: usedJti,
    terminalId: 'terminal-route-test',
  }, 'nonce-pos-used-1'));
  assert.equal(markUsed.status, 200);
  assert.equal(markUsed.body.ok, true);
  assert.equal(markUsed.body.data.registry.usedCount, 1);

  const verifyUsed = await postJson('/api/pos/agid-s/registry/verify', {
    keyId,
    jti: usedJti,
  });
  assert.equal(verifyUsed.status, 409);
  assert.equal(verifyUsed.body.ok, false);
  assert.ok(verifyUsed.body.data.decision.errors.includes('token-already-used'));

  const blockedSync = await postJson('/api/pos/agid-s/registry/sync-offline', {
    items: [{ action: 'revoke-key', keyId, reason: 'lost terminal' }],
  });
  assert.equal(blockedSync.status, 401);
  assert.equal(blockedSync.body.ok, false);

  const revokeKey = await postJson(
    '/api/pos/agid-s/registry/revoke-key',
    { keyId, reason: 'lost terminal' },
    { 'X-AGID-POS-Admin-Token': 'test-admin-token' },
  );
  assert.equal(revokeKey.status, 200);
  assert.equal(revokeKey.body.ok, true);

  const verifyRevokedKey = await postJson('/api/pos/agid-s/registry/verify', {
    keyId,
    jti: freshJti,
  });
  assert.equal(verifyRevokedKey.status, 409);
  assert.ok(verifyRevokedKey.body.data.decision.errors.includes('key-revoked-by-registry'));

  const audit = await getJson('/api/pos/agid-s/registry/audit?limit=10');
  assert.equal(audit.status, 200);
  const serializedAudit = JSON.stringify(audit.body);
  assert.doesNotMatch(serializedAudit, /AGIDS1-|JP05AV8TJGH8|東京都|Tokyo|private-unit|raw-phone/i);
});

test('POS Mode 1 admin routes fail closed when admin token is not configured', async () => {
  const previous = process.env.AGID_POS_ADMIN_TOKEN;
  delete process.env.AGID_POS_ADMIN_TOKEN;
  const isolatedTempDir = await mkdtemp(join(tmpdir(), 'agid-pos-route-no-admin-'));
  const isolatedApp = express();
  isolatedApp.use(express.json());
  registerPosTerminalRoutes(isolatedApp, {
    registryStore: createPosAgidSecureRegistryStore({
      filePath: join(isolatedTempDir, 'registry.json'),
    }),
  });
  const isolatedServer = isolatedApp.listen(0);
  try {
    await new Promise<void>(resolve => isolatedServer.once('listening', resolve));
    const addressInfo = isolatedServer.address();
    assert.ok(addressInfo && typeof addressInfo === 'object');
    const response = await fetch(`http://127.0.0.1:${addressInfo.port}/api/pos/agid-s/registry/revoke-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyId, reason: 'no admin token configured' }),
    });
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.ok, false);
    assert.match(body.error, /not configured/i);
  } finally {
    await new Promise<void>(resolve => isolatedServer.close(() => resolve()));
    await rm(isolatedTempDir, { recursive: true, force: true });
    if (previous === undefined) {
      delete process.env.AGID_POS_ADMIN_TOKEN;
    } else {
      process.env.AGID_POS_ADMIN_TOKEN = previous;
    }
  }
});

test('POS acceptance route rejects copied recipient waybill QR after nullifier is used', async () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'route-waybill-replay-001',
    jti: 'ABCDEFGHJKMNPQRST0123456',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'route-handoff-code',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:15:00.000Z',
  });

  const first = await postJson('/api/pos/acceptance', {
    payload,
    channel: 'qr',
    scanRole: 'recipient',
    recipientProofCode: 'route-handoff-code',
    now: '2026-06-07T00:01:00.000Z',
  });
  assert.equal(first.status, 200);
  assert.equal(first.body.ok, true);
  assert.match(first.body.data.shippingLabel.nullifier, /^SLN-/);

  const replay = await postJson('/api/pos/acceptance', {
    payload,
    channel: 'qr',
    scanRole: 'recipient',
    recipientProofCode: 'route-handoff-code',
    now: '2026-06-07T00:02:00.000Z',
  });
  assert.equal(replay.status, 400);
  assert.equal(replay.body.ok, false);
  assert.ok(replay.body.data.errors.includes('shipping-label-nullifier-already-used'));
});

test('POS acceptance route keeps unpaid collect-on-delivery Ethereum handoff in review', async () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'route-waybill-cod-eth-001',
    jti: 'HJKMNPQRST0123456789ABCDEF',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'cod-route-handoff-code',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:15:00.000Z',
  });

  const response = await postJson('/api/pos/acceptance', {
    payload,
    channel: 'qr',
    scanRole: 'recipient',
    recipientProofCode: 'cod-route-handoff-code',
    now: '2026-06-07T00:01:00.000Z',
    amount: 12.5,
    currency: 'USD',
    paymentKind: 'collect-on-delivery',
    settlementMode: 'ethereum-registry',
    paymentStatus: 'requires-payment',
    tokenSymbol: 'USDC',
    paymentNetworkId: 'base-sepolia',
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.status, 'review');
  assert.equal(response.body.data.ethereumPayment.paymentKind, 'collect-on-delivery');
  assert.equal(response.body.data.ethereumPayment.requiredAction, 'collect-payment-from-recipient-before-release');
  assert.equal(response.body.data.ethereumPayment.handoffGate.canAcceptCarrierScan, true);
  assert.equal(response.body.data.ethereumPayment.handoffGate.canReleasePackage, false);
  assert.ok(response.body.data.warnings.includes('ethereum-payment-required-before-recipient-release'));
  assert.doesNotMatch(JSON.stringify(response.body), /1-1 Chiyoda|Private Receiver|\+81|JP05AV8TJGH8/);
});

test('POS offline usage sync marks copied waybill conflicts as audit-required', async () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'route-waybill-offline-001',
    jti: 'HJKMNPQRST0123456789ABCDEFG',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'offline-route-code',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:15:00.000Z',
  });
  const record = parseShippingLabelQrPayload(payload);
  assert.ok(record);

  const item = {
    action: 'mark-shipping-label-nullifier-used',
    nullifier: record.nullifier.value,
    receiptId: 'POS-OFF-001',
    terminalId: 'field-pos-1',
    waybillAlias: record.waybillId,
    waybillCommitment: record.waybillCommitment,
    addressReferenceCommitment: record.address.referenceCommitment,
    jtiTail: record.jti.slice(-8),
    createdAt: '2026-06-07T00:02:00.000Z',
  };

  const sync = await postJson('/api/pos/offline-usage/sync', {
    terminalId: 'field-pos-1',
    items: [item],
    now: '2026-06-07T00:03:00.000Z',
  });
  assert.equal(sync.status, 200);
  assert.equal(sync.body.ok, true);
  assert.equal(sync.body.data.accepted, 1);
  assert.equal(sync.body.data.auditRequired, 0);
  assert.equal(sync.body.data.rawPayloadStorage, false);
  assert.equal(sync.body.data.rawAddressStorage, false);
  assert.equal(sync.body.data.rawAgidStorage, false);
  assert.equal(sync.body.data.rawWaybillIdStorage, false);
  assert.doesNotMatch(JSON.stringify(sync.body), /1-1 Chiyoda|Private Receiver|\+81|JP05AV8TJGH8/);

  const copiedQr = await postJson('/api/pos/acceptance', {
    payload,
    channel: 'qr',
    scanRole: 'recipient',
    recipientProofCode: 'offline-route-code',
    now: '2026-06-07T00:04:00.000Z',
  });
  assert.equal(copiedQr.status, 400);
  assert.equal(copiedQr.body.ok, false);
  assert.ok(copiedQr.body.data.errors.includes('shipping-label-nullifier-already-used'));

  const duplicateSync = await postJson('/api/pos/offline-usage/sync', {
    terminalId: 'field-pos-2',
    items: [{ ...item, receiptId: 'POS-OFF-002', terminalId: 'field-pos-2' }],
    now: '2026-06-07T00:05:00.000Z',
  });
  assert.equal(duplicateSync.status, 409);
  assert.equal(duplicateSync.body.ok, false);
  assert.equal(duplicateSync.body.data.conflicts, 1);
  assert.equal(duplicateSync.body.data.auditRequired, 1);
  assert.equal(duplicateSync.body.data.events[0].outcome, 'conflict');
  assert.equal(duplicateSync.body.data.events[0].auditRequired, true);
  assert.ok(duplicateSync.body.warnings.includes('offline-usage-conflicts-require-audit'));
});
