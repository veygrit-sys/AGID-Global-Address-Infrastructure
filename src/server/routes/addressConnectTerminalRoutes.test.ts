import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { registerAddressConnectTerminalRoutes } from './addressConnectTerminalRoutes';

let server: Server;
let baseUrl = '';

async function getJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-AGID-Request-ID': 'address-connect-terminal-route-test' },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'address-connect-terminal-route-test',
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

before(async () => {
  const app = express();
  app.use(express.json());
  registerAddressConnectTerminalRoutes(app);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('Address Connect routes expose capabilities and discover carrier endpoints', async () => {
  const operations = await getJson('/api/address-operations/capabilities');
  assert.equal(operations.status, 200);
  assert.equal(operations.body.ok, true);
  assert.ok(operations.body.data.identityClaims.includes('address-ownership'));
  assert.ok(operations.body.data.dashboardSections.includes('review-queue'));

  const capabilities = await getJson('/api/address-connect/capabilities');
  assert.equal(capabilities.status, 200);
  assert.equal(capabilities.body.ok, true);
  assert.equal(capabilities.body.data.privacy.organizationsOnly, true);
  assert.ok(capabilities.body.data.roles.includes('carrier'));

  const discovery = await postJson('/api/address-connect/discover', {
    registry: {
      participants: [
        {
          participantId: 'carrier-test',
          displayName: 'Carrier test',
          roles: ['carrier'],
          countryCodes: ['US'],
          endpointRefs: [
            {
              kind: 'carrier',
              publicBaseUrl: 'https://carrier.example.test/agid',
              capabilities: ['delivery-handoff'],
            },
          ],
        },
      ],
    },
    query: {
      role: 'carrier',
      endpointKind: 'carrier',
      countryCode: 'US',
      capability: 'delivery-handoff',
    },
  });

  assert.equal(discovery.status, 200);
  assert.equal(discovery.body.ok, true);
  assert.equal(discovery.body.data.matchedEndpointCount, 1);
  assert.equal(discovery.body.data.matches[0].participantId, 'carrier-test');

  const requirements = await getJson('/api/address-connect/operations/requirements');
  assert.equal(requirements.status, 200);
  assert.equal(requirements.body.ok, true);
  assert.ok(requirements.body.data.criticalWebhookTopics.includes('qr.used'));

  const operationReport = await postJson('/api/address-connect/operations/report', {
    endpoints: [
      {
        endpointId: 'webhook-pos-ops',
        url: 'https://ops.example.test/agid/webhooks',
        topics: [
          'address_intent.verified',
          'credential.revoked',
          'revocation.updated',
          'handoff.completed',
          'qr.used',
        ],
        signingKeyId: 'whsec_ref_1',
        signatureAlgorithm: 'hmac-sha256',
        status: 'active',
      },
    ],
    deliveries: [
      {
        endpointId: 'webhook-pos-ops',
        topic: 'qr.used',
        eventId: 'evt_1',
        statusCode: 200,
        latencyMs: 120,
        signatureVerified: true,
      },
    ],
  });
  assert.equal(operationReport.status, 200);
  assert.equal(operationReport.body.ok, true);
  assert.equal(operationReport.body.data.status, 'ready');
  assert.equal(operationReport.body.data.privacy.rawAddressStorage, false);

  const scaleCapabilities = await getJson('/api/address-scale/capabilities');
  assert.equal(scaleCapabilities.status, 200);
  assert.equal(scaleCapabilities.body.ok, true);
  assert.equal(scaleCapabilities.body.data.stores.postgres.role, 'primary-ledger');
  assert.equal(scaleCapabilities.body.data.stores.redis.role, 'read-through-cache');
  assert.equal(scaleCapabilities.body.data.stores.mongodb.role, 'document-evidence');

  const scalePlan = await postJson('/api/address-scale/topology', {
    workload: 'audit-report',
    peakEventsPerSecond: 500,
    multiServer: true,
    requireFlexibleEvidence: true,
    preferredStores: ['postgres', 'redis', 'mongodb'],
  });
  assert.equal(scalePlan.status, 200);
  assert.equal(scalePlan.body.ok, true);
  assert.equal(scalePlan.body.data.topology.primaryLedger, 'postgres');
  assert.equal(scalePlan.body.data.topology.hotCache, 'redis');
  assert.equal(scalePlan.body.data.topology.documentEvidence, 'mongodb');
});

test('Address Connect registry route rejects private public API material', async () => {
  const result = await postJson('/api/address-connect/registry', {
    participants: [
      {
        displayName: 'Unsafe issuer',
        roles: ['issuer'],
        apiKey: 'secret-live-key',
        recipientName: 'Private Person',
      },
    ],
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.ok, false);
  assert.match(result.body.error, /rejected private address/i);
  assert.equal(result.body.data.privacy.rawApiKeyStorage, false);
});

test('Address Terminal route builds fleet snapshots and blocks conflicts', async () => {
  const capabilities = await getJson('/api/address-terminal/capabilities');
  assert.equal(capabilities.status, 200);
  assert.equal(capabilities.body.ok, true);
  assert.ok(capabilities.body.data.screens.some((screen: any) => screen.id === 'offline-queue'));
  assert.ok(capabilities.body.data.deviceClasses.includes('measurement-instrument'));

  const fleet = await postJson('/api/address-terminal/fleet', {
    terminals: [
      {
        terminalId: 'POS-1',
        label: 'Counter 1',
        staffRole: 'field-admin',
        registryFresh: false,
        syncState: 'conflict',
        pendingOfflineItems: 4,
        activeSecureKeys: 0,
        hardware: {
          keyboardWedge: false,
        },
      },
    ],
  });

  assert.equal(fleet.status, 409);
  assert.equal(fleet.body.ok, false);
  assert.equal(fleet.body.data.totals.blocked, 1);
  assert.ok(fleet.body.data.terminals[0].attention.includes('sync:conflict'));
});

test('Address Launch Center routes expose checklist and block incomplete production readiness', async () => {
  const checklist = await getJson('/api/address-launch-center/checklist');
  assert.equal(checklist.status, 200);
  assert.equal(checklist.body.ok, true);
  assert.ok(checklist.body.data.items.some((item: any) => item.id === 'webhook-signature-verification'));
  assert.ok(checklist.body.data.items.some((item: any) => item.id === 'threat-model-template-selected'));
  assert.equal(checklist.body.data.privacy.rawAddressAccepted, false);

  const blocked = await postJson('/api/address-launch-center/evaluate', {
    environment: 'production',
    profile: 'humanitarian',
    mode: 'full',
    webhooks: {
      configured: true,
      signatureVerification: false,
    },
    registry: {
      revocationCheck: true,
      freshnessCheck: false,
      issuerTrustCheck: true,
    },
    storageLogging: {
      redactionEnabled: true,
      rawAddressLogs: true,
    },
    duplicates: {
      nullifierRequired: true,
      domainSeparation: false,
    },
    highRiskMode: {
      enabled: true,
      agidSOnly: false,
    },
  });

  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.ok, false);
  assert.equal(blocked.body.data.status, 'blocked');
  assert.ok(blocked.body.data.totals.blockedRequired >= 4);
  assert.ok(blocked.body.data.nextActions.some((action: string) => /revocation/i.test(action)));
});

test('Address Launch Center route accepts ready public launch evidence and rejects private material', async () => {
  const ready = await postJson('/api/address-launch-center/evaluate', {
    environment: 'production',
    profile: 'humanitarian',
    mode: 'full',
    oauth: {
      scopesDefined: true,
      consentScreenReady: true,
      leastPrivilegeScopes: true,
      tokenRotation: true,
      duplicateConnectionPrevention: true,
    },
    webhooks: {
      configured: true,
      signatureVerification: true,
      replayProtection: true,
      retryPolicy: true,
      deadLetterQueue: true,
      idempotencyKeys: true,
    },
    registry: {
      revocationCheck: true,
      freshnessCheck: true,
      issuerTrustCheck: true,
      usedStatusCheck: true,
      freshnessAgeSeconds: 30,
      maxFreshnessAgeSeconds: 120,
    },
    storageLogging: {
      redactionEnabled: true,
      retentionPolicyDays: 30,
      auditLogEnabled: true,
      rawAddressLogs: false,
      rawAgidLogs: false,
      rawAoidLogs: false,
      proofCodeLogs: false,
    },
    duplicates: {
      aoidDuplicateCheck: true,
      nullifierRequired: true,
      domainSeparation: true,
      idempotencyKeys: true,
      regionUniquenessPolicy: true,
    },
    highRiskMode: {
      enabled: true,
      agidSOnly: true,
      shortExpiry: true,
      recipientChallenge: true,
      precisionReduction: true,
      immediateRevocation: true,
      noAddressHistoryRetention: true,
    },
    errorHandling: {
      typedErrors: true,
      safeUserMessages: true,
      retryBackoff: true,
      reviewQueue: true,
      operatorRunbook: true,
    },
    terminal: {
      staffRoles: true,
      deviceDiagnostics: true,
      offlineQueue: true,
      registrySyncVisible: true,
      printerTest: true,
    },
    security: {
      rateLimits: true,
      csrfOrOriginChecks: true,
      secretsNotCommitted: true,
      reproducibleBuild: true,
      externalAuditReady: true,
    },
    threatModel: {
      templateSelected: true,
      templateId: 'hosted-registry-webhooks',
      reviewOwner: 'platform-security',
      misuseCasesReviewed: true,
      noRawAddressReviewed: true,
      highRiskModeReviewed: true,
      verificationCommandsMapped: true,
    },
  });

  assert.equal(ready.status, 200);
  assert.equal(ready.body.ok, true);
  assert.equal(ready.body.data.status, 'ready');
  assert.equal(ready.body.data.score, 100);

  const rejected = await postJson('/api/address-launch-center/evaluate', {
    environment: 'production',
    mode: 'full',
    rawAoid: 'AOID-PRIVATE',
    proofCode: '123456',
    apiKey: 'secret-live-key',
  });

  assert.equal(rejected.status, 400);
  assert.equal(rejected.body.ok, false);
  assert.match(rejected.body.error, /rejected private address/i);
  assert.ok(rejected.body.data.errors.some((error: string) => error.includes('rawAoid')));
});

test('Address Operations routes verify identity, webhooks, disputes, tax/customs, and dashboard', async () => {
  const identity = await postJson('/api/address-identity/verify', {
    methods: ['aoid-credential', 'passkey', 'issuer-credential'],
    claims: ['address-ownership', 'residence', 'delivery-eligibility'],
    credentialRefs: ['credref_aoid'],
    issuerCredentialRefs: ['issuercred_residence'],
    aoidCommitment: 'commit_aoid_public',
    passkeyChallengeHash: 'challenge_hash_public',
    issuerTrustRoot: 'issuer_root',
    revocationRoot: 'revocation_root',
    freshnessRoot: 'freshness_root',
  });
  assert.equal(identity.status, 200);
  assert.equal(identity.body.ok, true);
  assert.equal(identity.body.data.verified, true);

  const webhook = await postJson('/api/address-webhooks/event', {
    topic: 'qr.used',
    endpointId: 'ops-webhook',
    payloadFingerprint: 'f'.repeat(32),
  });
  assert.equal(webhook.status, 200);
  assert.equal(webhook.body.data.status, 'queued');

  const dispute = await postJson('/api/address-disputes/case', {
    type: 'same-address-claim',
    evidenceRefs: ['review_ref_1'],
  });
  assert.equal(dispute.status, 200);
  assert.equal(dispute.body.data.status, 'needs-review');

  const customs = await postJson('/api/address-tax-customs/context', {
    originCountry: 'JP',
    destinationCountry: 'US',
    hsCode: '610910',
    declaredValue: 300,
    currency: 'USD',
    hasAgid: true,
    hasAoidCredential: true,
  });
  assert.equal(customs.status, 200);
  assert.notEqual(customs.body.data.status, 'rejected');
  assert.equal(customs.body.data.dashboardSignals.section, 'tax-customs');

  const dashboard = await postJson('/api/address-dashboard/snapshot', {
    logs: { total: 18 },
    linkEvents: { sessions: 4 },
    terminals: { active: 2 },
    reviewQueue: { pending: 1 },
    disputes: { open: 1 },
    webhooks: { active: 3 },
    qrUsage: { used: 2 },
  });
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.ok, true);
  assert.equal(dashboard.body.data.overallStatus, 'attention');
  assert.equal(dashboard.body.data.summary.qrUsed, 2);
  assert.ok(dashboard.body.data.sections.some((section: any) => section.id === 'link-events'));
});
