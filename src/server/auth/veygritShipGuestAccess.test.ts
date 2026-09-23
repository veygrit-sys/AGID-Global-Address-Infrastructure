import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after, before } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { registerSkipshipSandboxRoutes } from '../routes/skipshipSandboxRoutes';
import { registerDhlCarrierRoutes } from '../routes/dhlCarrierRoutes';
import { registerUpsCarrierRoutes } from '../routes/upsCarrierRoutes';
import { registerVeygritShipGuestRoutes } from '../routes/veygritShipGuestRoutes';
import { assertModulesDoNotImportScripts } from '../../lib/veygritImportBoundary.testHelper';
import {
  ACCOUNT_REQUIRED_OPERATIONS,
  GUEST_CAPABILITIES,
  GUEST_FORBIDDEN_OPERATIONS,
  VeygritShipGuestAccessService,
  type GuestAccessDecision,
  type GuestAccessStore,
  type GuestCapability,
  type GuestCapabilityBudget,
} from './veygritShipGuestAccess';

test('Veygrit Ship delivery-facing contract modules do not import script fixtures', () => {
  assertModulesDoNotImportScripts([
    'src/server/auth/veygritShipGuestAccess.ts',
    'src/server/routes/veygritShipGuestRoutes.ts',
    'src/server/routes/skipshipSandboxRoutes.ts',
    'src/server/shipping/veygritShipStore.ts',
    'src/server/shipping/veygritShipWorkers.ts',
    'src/server/shipping/carrierSecretManagement.ts',
    'src/server/shipping/labelManagement.ts',
    'src/server/shipping/multiCloudCarrierSecretVault.ts',
    'src/server/shipping/multiCloudLabelObjectStorage.ts',
  ]);
});

type StoredSession = {
  sessionRef: string;
  tokenHash: string;
  expiresAt: string;
  capabilities: GuestCapability[];
  revoked: boolean;
  counts: Map<GuestCapability, number>;
};

class MemoryGuestAccessStore implements GuestAccessStore {
  sessions = new Map<string, StoredSession>();
  lastCreateInput?: Record<string, unknown>;

  async createSession(input: any): Promise<boolean> {
    this.lastCreateInput = input;
    this.sessions.set(input.tokenHash, {
      sessionRef: input.sessionRef, tokenHash: input.tokenHash, expiresAt: input.expiresAt,
      capabilities: [...GUEST_CAPABILITIES], revoked: false, counts: new Map(),
    });
    return true;
  }

  async consumeCapability(input: { tokenHash: string; capability: GuestCapability; budget: GuestCapabilityBudget }): Promise<GuestAccessDecision> {
    const session = this.sessions.get(input.tokenHash);
    if (!session) return { ok: false, reason: 'invalid_token' };
    if (session.revoked) return { ok: false, reason: 'revoked' };
    if (Date.parse(session.expiresAt) <= Date.now()) return { ok: false, reason: 'expired' };
    if (!session.capabilities.includes(input.capability)) return { ok: false, reason: 'capability_denied' };
    const count = (session.counts.get(input.capability) ?? 0) + 1;
    if (count > input.budget.limit) return { ok: false, reason: 'rate_limited' };
    session.counts.set(input.capability, count);
    return { ok: true, sessionRef: session.sessionRef, capabilities: session.capabilities,
      expiresAt: session.expiresAt, remaining: input.budget.limit - count };
  }

  async revokeSession(sessionRef: string): Promise<boolean> {
    const session = [...this.sessions.values()].find(value => value.sessionRef === sessionRef);
    if (!session) return false;
    session.revoked = true;
    return true;
  }
}

test('guest access policy is a closed five-capability allowlist with live operations forbidden', () => {
  assert.deepEqual(GUEST_CAPABILITIES, ['rate_simulation', 'sandbox_shipment', 'shipment_draft', 'address_input', 'test_api']);
  assert.deepEqual(ACCOUNT_REQUIRED_OPERATIONS, [
    'carrier_credentials', 'label_purchase', 'production_api_key', 'billing', 'team_management', 'webhook_configuration',
  ]);
  for (const operation of ['live_shipment', 'label_purchase', 'carrier_connection', 'production_api_key', 'billing']) {
    assert.ok((GUEST_FORBIDDEN_OPERATIONS as readonly string[]).includes(operation));
  }
  assert.equal((GUEST_CAPABILITIES as readonly string[]).includes('live_shipment'), false);
});

test('guest migration enforces the closed capability set and per-capability usage rows', async () => {
  const sql = await readFile(new URL('../../../db/veygrit-ship-guest-access.postgres.sql', import.meta.url), 'utf8');
  const coreSql = await readFile(new URL('../../../db/veygrit-ship-core.postgres.sql', import.meta.url), 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS veygrit_ship_guest_capability_usage/i);
  assert.match(sql, /capabilities <@ ARRAY/i);
  assert.match(sql, /capabilities @> ARRAY/i);
  assert.match(sql, /PRIMARY KEY \(guest_session_id, capability\)/i);
  assert.match(sql, /issuer_fingerprint_hash/i);
  assert.match(sql, /veygrit_ship_guest_test_only_chk/i);
  assert.match(sql, /veygrit_ship_live_requires_account_chk/i);
  assert.match(sql, /veygrit_ship_carrier_secret_ref_chk/i);
  assert.match(sql, /Secrets Manager reference/i);
  assert.match(sql, /REVOKE ALL ON[\s\S]*veygrit_ship_carrier_connection[\s\S]*FROM veygrit_ship_guest/i);
  assert.match(coreSql, /CREATE TABLE IF NOT EXISTS veygrit_ship_carrier_connection[\s\S]*?merchant_id bigint NOT NULL/i);
  assert.doesNotMatch(sql, /issuer_ip\s+(text|varchar|inet)/i);
});

test('service returns a token once while persisting only hashes and applies capability rate limits', async () => {
  const store = new MemoryGuestAccessStore();
  const service = new VeygritShipGuestAccessService(store, {
    fingerprintSecret: 'f'.repeat(32), randomToken: () => `gst_${'a'.repeat(40)}`,
    now: () => Date.parse('2030-01-01T00:00:00Z'),
  });
  const issued = await service.issueSession('203.0.113.10');
  assert.equal(issued.token, `gst_${'a'.repeat(40)}`);
  assert.equal(store.lastCreateInput?.tokenHash, '3e2411b957717e4be73a6221dd9370ac51ac370418a7c866a7eb7ac25feb813a');
  assert.notEqual(store.lastCreateInput?.issuerFingerprintHash, '203.0.113.10');
  for (let index = 0; index < 60; index += 1) assert.equal((await service.authorize(issued.token, 'rate_simulation')).ok, true);
  assert.deepEqual(await service.authorize(issued.token, 'rate_simulation'), { ok: false, reason: 'rate_limited' });
  assert.equal((await service.authorize(issued.token, 'address_input')).ok, true);
});

let server: Server;
let baseUrl = '';
let routeStore: MemoryGuestAccessStore;

before(async () => {
  routeStore = new MemoryGuestAccessStore();
  const service = new VeygritShipGuestAccessService(routeStore, {
    fingerprintSecret: 'r'.repeat(32), randomToken: () => `gst_${'b'.repeat(40)}`,
  });
  const app = express();
  app.use(express.json());
  registerVeygritShipGuestRoutes(app, service);
  registerSkipshipSandboxRoutes(app, { guestAccess: service });
  registerUpsCarrierRoutes(app, { internalApiKey: 'internal-only' });
  registerDhlCarrierRoutes(app, { internalApiKey: 'internal-only' });
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => new Promise<void>(resolve => server.close(() => resolve())));

async function request(path: string, init: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, init);
}

test('login-free session can use rates, sandbox delivery, drafts, address input, and test API', async () => {
  const issuedResponse = await request('/v1/guest/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  const issued = await issuedResponse.json() as { token: string; capabilities: string[] };
  assert.equal(issuedResponse.status, 201);
  assert.deepEqual(issued.capabilities, [...GUEST_CAPABILITIES]);
  const headers = { 'content-type': 'application/json', 'x-veygrit-guest-token': issued.token };

  const rate = await request('/v1/delivery/rates', { method: 'POST', headers, body: JSON.stringify({
    addressAliasRef: 'addr_alias_guest_1', parcelProfileRef: 'parcel_guest_1', objective: 'cheapest',
    requestedServiceLevels: ['economy'], policyRef: 'policy_guest_1',
  }) });
  assert.equal(rate.status, 200);

  const sandboxShipment = await request('/v1/shipments', { method: 'POST', headers, body: JSON.stringify({ rateRef: 'rate_guest_1' }) });
  assert.notEqual(sandboxShipment.status, 401);

  const draft = await request('/v1/guest/shipment-drafts', { method: 'POST', headers, body: JSON.stringify({
    merchantRef: 'guest_merchant', recipientTokenRef: 'rectok_guest_1', parcelProfileRef: 'parcel_guest_1',
    addressValidationRef: 'addrval_guest_1', walletConsentRef: 'consent_guest_1', servicePreference: 'cheapest',
  }) });
  assert.equal(draft.status, 201);

  const address = await request('/v1/guest/address-input', { method: 'POST', headers, body: JSON.stringify({
    role: 'receiver', address: { recipient: 'Avery Johnson', organization: 'Veygrit Store', countryCode: 'US',
      postcode: '94107', state: 'CA', city: 'San Francisco', street: '548 Brannan Street', phone: '415-555-0100' },
  }) });
  const addressBody = await address.json() as { ok: boolean; persisted: boolean; productionTraffic: boolean };
  assert.equal(address.status, 200);
  assert.equal(addressBody.ok, true);
  assert.equal(addressBody.persisted, false);
  assert.equal(addressBody.productionTraffic, false);

  const ping = await request('/v1/guest/test-api/ping', { headers: { 'x-veygrit-guest-token': issued.token } });
  assert.equal(ping.status, 200);
});

test('guest token cannot cross into merchant console or production capabilities', async () => {
  const issued = await (await request('/v1/guest/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).json() as { token: string };
  const merchant = await request('/v1/merchant-console/webhook-ledger', { headers: { 'x-veygrit-guest-token': issued.token } });
  assert.equal(merchant.status, 401);
  const ups = await request('/api/internal/carriers/ups/shipments', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-veygrit-guest-token': issued.token }, body: '{}',
  });
  assert.equal(ups.status, 401);
  const dhl = await request('/api/internal/carriers/dhl/shipments', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-veygrit-guest-token': issued.token }, body: '{}',
  });
  assert.equal(dhl.status, 401);
  const policy = await (await request('/v1/guest/access-policy')).json() as {
    forbiddenOperations: string[];
    accountRequiredOperations: string[];
    carrierCredentialStorage: { guestAllowed: boolean; storage: string };
    publicSitesCarrierSecretBoundary: {
      credentialInputAvailable: boolean;
      credentialStorageAvailable: boolean;
      backendOnly: boolean;
      adminMfaRequired: boolean;
    };
    productionTraffic: boolean;
  };
  assert.ok(policy.forbiddenOperations.includes('live_shipment'));
  assert.ok(policy.forbiddenOperations.includes('label_purchase'));
  assert.deepEqual(policy.accountRequiredOperations, [...ACCOUNT_REQUIRED_OPERATIONS]);
  assert.deepEqual(policy.carrierCredentialStorage, { guestAllowed: false, storage: 'secret_manager_reference_only' });
  assert.deepEqual(policy.publicSitesCarrierSecretBoundary, {
    credentialInputAvailable: false,
    credentialStorageAvailable: false,
    backendOnly: true,
    adminMfaRequired: true,
    databaseStores: 'secret_reference_and_last4_only',
  });
  assert.equal(policy.productionTraffic, false);
  const publicCredentialRoute = await request('/v1/guest/carrier-credentials', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-veygrit-guest-token': issued.token }, body: '{}',
  });
  assert.equal(publicCredentialRoute.status, 404);
});

test('sandbox route without test key or guest token remains unauthorized', async () => {
  const response = await request('/v1/delivery/rates', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 401);
  assert.equal((await response.json() as { error: string }).error, 'auth_required');
});
