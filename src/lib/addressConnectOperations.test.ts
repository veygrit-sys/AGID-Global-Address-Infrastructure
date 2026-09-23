import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAddressConnectOperationsReport,
  listAddressConnectOperationalRequirements,
} from './addressConnectOperations';

const endpoint = {
  endpointId: 'webhook-pos-ops',
  url: 'https://ops.example.test/agid/webhooks',
  topics: [
    'address_intent.verified',
    'credential.revoked',
    'revocation.updated',
    'handoff.completed',
    'qr.used',
  ],
  signingKeyId: 'whsec_ref_2026_06',
  signatureAlgorithm: 'hmac-sha256',
  status: 'active',
  ackTimeoutSeconds: 5,
  retry: {
    maxAttempts: 8,
    initialBackoffSeconds: 10,
    maxBackoffSeconds: 900,
    jitter: 'full',
    deadLetterAfterAttempts: 8,
  },
};

test('Address Connect operations report accepts healthy signed webhook operations', () => {
  const report = buildAddressConnectOperationsReport({
    generatedAt: '2026-06-17T03:00:00.000Z',
    endpoints: [endpoint],
    deliveries: [
      {
        endpointId: 'webhook-pos-ops',
        topic: 'address_intent.verified',
        eventId: 'evt_1',
        statusCode: 200,
        latencyMs: 120,
        signatureVerified: true,
        attempt: 1,
      },
      {
        endpointId: 'webhook-pos-ops',
        topic: 'handoff.completed',
        eventId: 'evt_2',
        statusCode: 204,
        latencyMs: 180,
        signatureVerified: true,
        attempt: 1,
      },
      {
        endpointId: 'webhook-pos-ops',
        topic: 'qr.used',
        eventId: 'evt_3',
        statusCode: 200,
        latencyMs: 210,
        signatureVerified: true,
        attempt: 1,
      },
    ],
    sla: {
      targetPercent: 99,
      maxP95LatencyMs: 500,
      maxErrorRatePercent: 1,
    },
    retention: {
      operationalLogRetentionDays: 30,
      securityLogRetentionDays: 400,
      auditLogRetentionDays: 400,
    },
  });

  assert.equal(report.accepted, true);
  assert.equal(report.status, 'ready');
  assert.equal(report.webhook.activeEndpoints, 1);
  assert.equal(report.webhook.deliveryCount, 3);
  assert.equal(report.webhook.signatureFailureCount, 0);
  assert.equal(report.webhook.deadLetterCount, 0);
  assert.equal(report.webhook.missingCriticalTopics.length, 0);
  assert.equal(report.sla.met, true);
  assert.equal(report.logRetention.accepted, true);
  assert.equal(report.privacy.rawAddressStorage, false);
  assert.match(report.reportRoot, /^[0-9a-f]{64}$/);
});

test('Address Connect operations report blocks signature failures and dead-letter delivery', () => {
  const report = buildAddressConnectOperationsReport({
    endpoints: [endpoint],
    deliveries: [
      {
        endpointId: 'webhook-pos-ops',
        topic: 'credential.revoked',
        eventId: 'evt_bad_signature',
        statusCode: 200,
        latencyMs: 90,
        signatureVerified: false,
        attempt: 1,
      },
      {
        endpointId: 'webhook-pos-ops',
        topic: 'qr.used',
        eventId: 'evt_dead_letter',
        statusCode: 503,
        latencyMs: 900,
        signatureVerified: true,
        attempt: 8,
        errorCode: 'dead-letter-timeout',
      },
    ],
  });

  assert.equal(report.status, 'blocked');
  assert.equal(report.webhook.signatureFailureCount, 1);
  assert.equal(report.webhook.deadLetterCount, 1);
  assert.equal(report.monitoring.pagerRequired, true);
  assert.ok(report.monitoring.signals.some(signal => signal.signalId === 'webhook-signature-failure'));
  assert.ok(report.monitoring.signals.some(signal => signal.signalId === 'webhook-dead-letter'));
});

test('Address Connect operations report rejects unsafe log retention policy', () => {
  const report = buildAddressConnectOperationsReport({
    endpoints: [endpoint],
    deliveries: [],
    retention: {
      rawPayloadRetentionDays: 7,
      operationalLogRetentionDays: 180,
      securityLogRetentionDays: 30,
      auditLogRetentionDays: 30,
      allowedFields: ['eventId', 'rawAddress', 'proofCode', 'fullSignature'],
    },
  });

  assert.equal(report.accepted, false);
  assert.equal(report.status, 'blocked');
  assert.equal(report.logRetention.accepted, false);
  assert.ok(report.logRetention.warnings.includes('raw-webhook-payload-retention-must-be-zero-days'));
  assert.ok(report.logRetention.warnings.some(warning => warning.includes('rawAddress')));
  assert.ok(report.logRetention.warnings.some(warning => warning.includes('proofCode')));
  assert.ok(report.privacy.rawPayloadStorage === false);
});

test('Address Connect operational requirements expose webhook, SLA, monitoring, and log retention gates', () => {
  const requirements = listAddressConnectOperationalRequirements();

  assert.ok(requirements.categories.some(category => category.id === 'webhook-operations'));
  assert.ok(requirements.categories.some(category => category.id === 'sla'));
  assert.ok(requirements.categories.some(category => category.id === 'monitoring'));
  assert.ok(requirements.categories.some(category => category.id === 'log-retention'));
  assert.ok(requirements.criticalWebhookTopics.includes('qr.used'));
  assert.ok(requirements.safeLogFields.includes('payloadFingerprint'));
  assert.equal(requirements.privacy.rawAoidStorage, false);
});
