import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import express from 'express';

import {
  GUEST_CAPABILITIES,
  VeygritShipGuestAccessService,
  type GuestAccessDecision,
  type GuestAccessStore,
  type GuestCapability,
  type GuestCapabilityBudget,
} from '../auth/veygritShipGuestAccess';
import { registerVeygritShipGuestRoutes } from './veygritShipGuestRoutes';

type StoredSession = {
  sessionRef: string;
  tokenHash: string;
  expiresAt: string;
  capabilities: GuestCapability[];
  counts: Map<GuestCapability, number>;
};

class MemoryGuestAccessStore implements GuestAccessStore {
  sessions = new Map<string, StoredSession>();

  async createSession(input: {
    sessionRef: string;
    tokenHash: string;
    issuerFingerprintHash: string;
    expiresAt: string;
    maxSessionsPerHour: number;
  }): Promise<boolean> {
    this.sessions.set(input.tokenHash, {
      sessionRef: input.sessionRef,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      capabilities: [...GUEST_CAPABILITIES],
      counts: new Map(),
    });
    return true;
  }

  async consumeCapability(input: {
    tokenHash: string;
    capability: GuestCapability;
    budget: GuestCapabilityBudget;
  }): Promise<GuestAccessDecision> {
    const session = this.sessions.get(input.tokenHash);
    if (!session) return { ok: false, reason: 'invalid_token' };
    if (Date.parse(session.expiresAt) <= Date.now()) return { ok: false, reason: 'expired' };
    if (!session.capabilities.includes(input.capability)) return { ok: false, reason: 'capability_denied' };
    const count = (session.counts.get(input.capability) ?? 0) + 1;
    if (count > input.budget.limit) return { ok: false, reason: 'rate_limited' };
    session.counts.set(input.capability, count);
    return {
      ok: true,
      sessionRef: session.sessionRef,
      capabilities: session.capabilities,
      expiresAt: session.expiresAt,
      remaining: input.budget.limit - count,
    };
  }

  async revokeSession(sessionRef: string): Promise<boolean> {
    return [...this.sessions.values()].some(session => session.sessionRef === sessionRef);
  }
}

let server: Server;
let baseUrl = '';

before(async () => {
  const service = new VeygritShipGuestAccessService(new MemoryGuestAccessStore(), {
    fingerprintSecret: 'guest-route-boundary-secret-32-plus',
    randomToken: () => `gst_${'c'.repeat(40)}`,
    now: () => Date.parse('2030-01-01T00:00:00Z'),
  });
  const app = express();
  app.use(express.json());
  registerVeygritShipGuestRoutes(app, service);
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => new Promise<void>(resolve => server.close(() => resolve())));

async function requestJson(path: string, init: RequestInit = {}): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${baseUrl}${path}`, init);
  return { status: response.status, body: await response.json() };
}

async function requestStatus(path: string, init: RequestInit = {}): Promise<number> {
  const response = await fetch(`${baseUrl}${path}`, init);
  await response.text();
  return response.status;
}

function isForbiddenCredentialReferenceKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized === 'secretref'
    || normalized === 'versionref'
    || normalized === 'secretmanagerref'
    || (normalized.includes('credential')
      && normalized.includes('ref')
      && (normalized.includes('secret') || normalized.includes('version')));
}

function collectForbiddenCredentialReferenceKeyPaths(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectForbiddenCredentialReferenceKeyPaths(item, `${path}[${index}]`));
  }
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const nextPath = `${path}.${key}`;
    return [
      ...(isForbiddenCredentialReferenceKey(key) ? [nextPath] : []),
      ...collectForbiddenCredentialReferenceKeyPaths(child, nextPath),
    ];
  });
}

test('Guest response scanner allows policy copy but catches credential reference fields', () => {
  assert.deepEqual(collectForbiddenCredentialReferenceKeyPaths({
    carrierCredentialStorage: { guestAllowed: false, storage: 'secret_manager_reference_only' },
    publicSitesCarrierSecretBoundary: { backendOnly: true, databaseStores: 'secret_reference_and_last4_only' },
  }), []);
  assert.deepEqual(collectForbiddenCredentialReferenceKeyPaths({
    carrierCredentialSecretRef: 'secretref_synthetic_boundary',
    nested: { credential_version_ref: 'versionref_synthetic_boundary' },
  }), ['$.carrierCredentialSecretRef', '$.nested.credential_version_ref']);
});

test('Guest release gate status is public-safe and does not depend on a session', async () => {
  const response = await requestJson('/v1/guest/release-gates/status');
  assert.equal(response.status, 200);
  const body = response.body as {
    ok?: boolean;
    exposure?: string;
    reviewState?: string;
    gateCount?: number;
    gates?: unknown[];
    remoteActionsAuthorized?: boolean;
    productionTraffic?: boolean;
  };

  assert.equal(body.ok, true);
  assert.equal(body.exposure, 'public-safe-no-identifiers');
  assert.equal(body.reviewState, 'local-gate-inventory');
  assert.equal(body.gateCount, 13);
  assert.equal(body.gates?.length, 13);
  assert.equal(body.remoteActionsAuthorized, false);
  assert.equal(body.productionTraffic, false);
  assert.deepEqual(collectForbiddenCredentialReferenceKeyPaths(body), []);
  assert.doesNotMatch(
    JSON.stringify(body),
    /\b(?:tenant|request|req|address|addr|recipient|rcpt|secretref|credentialref|witness|proofsecret|privatekey)_[a-z0-9]+\b/i,
  );
});

test('public Guest route JSON responses do not expose carrier credential reference fields', async () => {
  const issued = await requestJson('/v1/guest/sessions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(issued.status, 201);
  const token = (issued.body as { token: string }).token;
  const headers = { 'content-type': 'application/json', 'x-veygrit-guest-token': token };

  const responses: Array<[string, { status: number; body: unknown }]> = [
    ['access-policy', await requestJson('/v1/guest/access-policy')],
    ['release-gate-status', await requestJson('/v1/guest/release-gates/status')],
    ['issued-session', issued],
    ['session-status', await requestJson('/v1/guest/session', { headers })],
    ['test-api-ping', await requestJson('/v1/guest/test-api/ping', { headers })],
    ['shipment-draft', await requestJson('/v1/guest/shipment-drafts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        merchantRef: 'merchant_synthetic_guest_boundary',
        recipientTokenRef: 'rectok_synthetic_guest_boundary',
        parcelProfileRef: 'parcel_synthetic_guest_boundary',
        addressValidationRef: 'addrval_synthetic_guest_boundary',
        walletConsentRef: 'consent_synthetic_guest_boundary',
        servicePreference: 'balanced',
      }),
    })],
    ['address-input-bad-request', await requestJson('/v1/guest/address-input', {
      method: 'POST',
      headers,
      body: '{}',
    })],
  ];

  assert.deepEqual(responses.map(([label, response]) => [label, response.status]), [
    ['access-policy', 200],
    ['release-gate-status', 200],
    ['issued-session', 201],
    ['session-status', 200],
    ['test-api-ping', 200],
    ['shipment-draft', 201],
    ['address-input-bad-request', 400],
  ]);

  for (const [label, response] of responses) {
    assert.deepEqual(collectForbiddenCredentialReferenceKeyPaths(response.body), [], label);
  }
});

test('Guest routing exposes no public carrier credential endpoints', async () => {
  const issued = await requestJson('/v1/guest/sessions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(issued.status, 201);
  const token = (issued.body as { token: string }).token;
  const headers = { 'content-type': 'application/json', 'x-veygrit-guest-token': token };

  for (const [method, path] of [
    ['POST', '/v1/guest/carrier-credentials'],
    ['POST', '/v1/guest/carrier-connections'],
    ['GET', '/v1/guest/carrier-credentials/current'],
  ] as const) {
    assert.equal(await requestStatus(path, { method, headers, body: method === 'POST' ? '{}' : undefined }), 404, `${method} ${path}`);
  }
});
