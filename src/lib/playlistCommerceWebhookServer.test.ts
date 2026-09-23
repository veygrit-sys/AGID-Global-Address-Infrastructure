import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildPlaylistCommerceWebhookFixtures,
  type PlaylistCommerceWebhookEnvelope,
} from './playlistCommerceWebhook';
import {
  buildPlaylistCommerceSyntheticSignedPingFixture,
  createPlaylistCommerceWebhookRouteHandler,
  runPlaylistCommerceWebhookPreflight,
  signPlaylistCommerceWebhookPayloadServer,
  verifyPlaylistCommerceWebhookEnvelopeServer,
  type PlaylistCommerceWebhookSigningKey,
} from './playlistCommerceWebhookServer';

const now = '2026-07-01T00:00:30.000Z';
const signingKeys: PlaylistCommerceWebhookSigningKey[] = [
  {
    keyId: 'test-key-v0',
    secret: 'playlist-commerce-test-secret',
    status: 'active',
    notBefore: '2026-06-30T00:00:00.000Z',
    notAfter: '2026-07-02T00:00:00.000Z',
  },
  {
    keyId: 'test-key-v1',
    secret: 'playlist-commerce-next-test-secret',
    status: 'next',
    notBefore: '2026-07-01T00:00:00.000Z',
    notAfter: '2026-07-03T00:00:00.000Z',
  },
  {
    keyId: 'test-key-retired',
    secret: 'playlist-commerce-retired-test-secret',
    status: 'retired',
    notBefore: '2026-06-01T00:00:00.000Z',
    notAfter: '2026-07-02T00:00:00.000Z',
  },
];

function fixture(index = 0): PlaylistCommerceWebhookEnvelope {
  return structuredClone(buildPlaylistCommerceWebhookFixtures()[index]);
}

test('server verifier accepts active signed webhook and marks event id after success', () => {
  const usedEventIds = new Set<string>();
  const envelope = fixture();

  const result = verifyPlaylistCommerceWebhookEnvelopeServer(envelope, {
    signingKeys,
    now,
    usedEventIds,
    markEventIdUsed: eventId => usedEventIds.add(eventId),
  });

  assert.equal(result.ok, true);
  assert.equal(result.keyStatus, 'active');
  assert.deepEqual(result.errors, []);
  assert.ok(usedEventIds.has(envelope.payload.eventId));
});

test('server verifier rejects retired key even when HMAC matches', () => {
  const envelope = fixture(1);
  envelope.headers['x-playlist-key-id'] = 'test-key-retired';
  envelope.headers['x-playlist-signature'] = signPlaylistCommerceWebhookPayloadServer(
    envelope.payload,
    'playlist-commerce-retired-test-secret',
  );

  const result = verifyPlaylistCommerceWebhookEnvelopeServer(envelope, { signingKeys, now });

  assert.equal(result.ok, false);
  assert.equal(result.keyStatus, 'retired');
  assert.ok(result.errors.includes('retired-key'));
  assert.equal(result.errors.includes('signature-mismatch'), false);
});

test('server verifier rejects duplicate event ids and tampered payload signatures', () => {
  const duplicate = fixture(2);
  const duplicateResult = verifyPlaylistCommerceWebhookEnvelopeServer(duplicate, {
    signingKeys,
    now,
    usedEventIds: new Set([duplicate.payload.eventId]),
  });

  const tampered = fixture(3);
  tampered.payload.receiptRef = 'receipt_tampered';
  const tamperedResult = verifyPlaylistCommerceWebhookEnvelopeServer(tampered, { signingKeys, now });

  assert.ok(duplicateResult.errors.includes('duplicate-event-id'));
  assert.ok(tamperedResult.errors.includes('signature-mismatch'));
});

test('route handler accepts signed webhook once and rejects idempotent replay', () => {
  const eventIdStore = new Set<string>();
  const handler = createPlaylistCommerceWebhookRouteHandler({ signingKeys, now, eventIdStore });
  const envelope = fixture(2);

  const accepted = handler({ method: 'POST', path: '/webhooks/playlist-commerce', body: envelope });
  const duplicate = handler({ method: 'POST', path: '/webhooks/playlist-commerce', body: envelope });

  assert.equal(accepted.status, 202);
  assert.equal(accepted.body.ok, true);
  assert.equal(accepted.body.eventId, envelope.payload.eventId);
  assert.equal(accepted.body.topic, 'checkout.alias_created');
  assert.ok(accepted.body.resultRef?.startsWith('pc_webhook_result_'));
  assert.ok(eventIdStore.has(envelope.payload.eventId));
  assert.equal(duplicate.status, 401);
  assert.ok(duplicate.body.errors.includes('duplicate-event-id'));
});

test('route handler returns redacted operational errors for invalid HTTP boundary cases', () => {
  const handler = createPlaylistCommerceWebhookRouteHandler({ signingKeys, now });
  const unsupported = handler({ method: 'POST', path: '/webhooks/playlist-commerce', body: fixture(0) });
  const notFound = handler({ method: 'POST', path: '/wrong', body: fixture(2) });
  const methodBlocked = handler({ method: 'GET', path: '/webhooks/playlist-commerce', body: fixture(2) });
  const missingBody = handler({ method: 'POST', path: '/webhooks/playlist-commerce' });

  assert.equal(unsupported.status, 401);
  assert.ok(unsupported.body.errors.includes('unsupported-topic'));
  assert.equal(notFound.status, 404);
  assert.deepEqual(notFound.body.errors, ['route-not-found']);
  assert.equal(methodBlocked.status, 405);
  assert.deepEqual(methodBlocked.body.errors, ['method-not-allowed']);
  assert.equal(missingBody.status, 400);
  assert.deepEqual(missingBody.body.errors, ['missing-webhook-body']);

  const responseText = JSON.stringify(unsupported.body);
  assert.doesNotMatch(responseText, /prod_demo_lamp/);
  assert.doesNotMatch(responseText, /playlistRef|productRef|orderAlias|receiptRef/);
  assert.doesNotMatch(responseText, /"payload"\s*:/i);
  assert.ok(unsupported.body.nonClaims.includes('not-raw-address-intake'));
  assert.ok(unsupported.body.nonClaims.includes('not-provider-token-intake'));
  assert.ok(unsupported.body.nonClaims.includes('not-raw-carrier-payload-intake'));
});

test('synthetic signed ping fixture is local-only, accepted once, replay-blocked, and redacted', () => {
  const ping = buildPlaylistCommerceSyntheticSignedPingFixture();
  const returnedText = JSON.stringify(ping);
  const requestText = JSON.stringify(ping.request.body);
  const responseText = JSON.stringify([ping.acceptedResponse.body, ping.replayResponse.body]);

  assert.equal(ping.version, 'playlist-commerce-synthetic-signed-ping-v0.1');
  assert.equal(ping.localOnly, true);
  assert.equal(ping.request.method, 'POST');
  assert.equal(ping.request.path, '/webhooks/playlist-commerce');
  assert.equal(ping.request.body?.payload.eventId, 'evt_pc_synthetic_ping_001');
  assert.equal(ping.request.body?.payload.topic, 'checkout.alias_created');
  assert.equal(ping.request.body?.headers['x-playlist-key-id'], 'pc_ping_key_active');
  assert.match(ping.request.body?.headers['x-playlist-signature'] ?? '', /^sha256=[a-f0-9]{64}$/);
  assert.equal(ping.acceptedResponse.status, 202);
  assert.equal(ping.acceptedResponse.body.ok, true);
  assert.equal(ping.replayResponse.status, 401);
  assert.ok(ping.replayResponse.body.errors.includes('duplicate-event-id'));
  assert.equal(ping.signingKeyRef.secretMaterial, 'synthetic-only-not-returned');
  assert.equal(ping.safeCommand, 'npm run verify:playlist-commerce');

  assert.doesNotMatch(returnedText, /playlist-commerce-synthetic-ping-secret/);
  assert.doesNotMatch(requestText, /raw_address|recipient_phone|provider_token|raw_provider_profile|raw_carrier_payload|proof_witness|private_key|biometric_template/i);
  assert.doesNotMatch(responseText, /raw_address|recipient_phone|provider_token|raw_provider_profile|raw_carrier_payload|proof_witness|private_key|biometric_template/i);
  assert.ok(ping.blockedMaterial.includes('production_webhook_secret'));
  assert.ok(ping.blockedMaterial.includes('provider_token'));
  assert.ok(ping.blockedMaterial.includes('raw_carrier_payload'));
  assert.ok(ping.nonClaims.includes('not-production-delivery-attempt'));
  assert.ok(ping.nonClaims.includes('not-provider-token-intake'));
  assert.ok(ping.nonClaims.includes('not-raw-carrier-payload-intake'));
});

test('webhook preflight report summarizes the synthetic ping without leaking secrets or payload material', () => {
  const report = runPlaylistCommerceWebhookPreflight();
  const reportText = JSON.stringify(report);
  const responseSummaryText = JSON.stringify(report.responseSummary);

  assert.equal(report.version, 'playlist-commerce-webhook-preflight-report-v0.1');
  assert.equal(report.localOnly, true);
  assert.equal(report.routeId, 'merchant-webhook-route');
  assert.equal(report.safeCommand, 'npm run verify:playlist-commerce');
  assert.equal(report.eventId, 'evt_pc_synthetic_ping_001');
  assert.equal(report.topic, 'checkout.alias_created');
  assert.equal(report.keyId, 'pc_ping_key_active');
  assert.deepEqual(report.expectedStatuses, { accepted: 202, replay: 401 });
  assert.equal(report.responseSummary.acceptedStatus, 202);
  assert.match(report.responseSummary.acceptedResultRef ?? '', /^pc_webhook_result_evt_pc_synthetic_ping_001$/);
  assert.equal(report.responseSummary.replayStatus, 401);
  assert.ok(report.responseSummary.replayErrors.includes('duplicate-event-id'));
  assert.equal(report.passed, true);
  assert.equal(report.checks.length, 7);
  assert.deepEqual(
    report.checks.map(check => check.id),
    [
      'local-only-boundary',
      'signature-present',
      'accepted-once',
      'replay-blocked',
      'activation-private-material-blocked',
      'redacted-response',
      'non-claims-declared',
    ],
  );
  assert.ok(report.checks.every(check => check.status === 'pass'));
  assert.equal(report.activationBlockNegativeCase.id, 'provider-token-raw-carrier-payload-negative');
  assert.equal(report.activationBlockNegativeCase.expectedStatus, 401);
  assert.equal(report.activationBlockNegativeCase.actualStatus, 401);
  assert.deepEqual(report.activationBlockNegativeCase.blockedKeys, ['providerIdToken', 'rawCarrierPayload']);
  assert.ok(report.activationBlockNegativeCase.errors.includes('forbidden-field:$.providerIdToken'));
  assert.ok(report.activationBlockNegativeCase.errors.includes('forbidden-field:$.rawCarrierPayload'));
  assert.ok(report.activationBlockNegativeCase.nonClaims.includes('not-provider-token-intake'));
  assert.ok(report.activationBlockNegativeCase.nonClaims.includes('not-raw-carrier-payload-intake'));

  assert.doesNotMatch(reportText, /playlist-commerce-synthetic-ping-secret/);
  assert.doesNotMatch(reportText, /x-playlist-signature/);
  assert.doesNotMatch(reportText, /order_alias_pc_synthetic_ping_001|wallet_subject_alias_pc_ping/);
  assert.doesNotMatch(responseSummaryText, /raw_address|recipient_phone|provider_token|raw_provider_profile|raw_carrier_payload|proof_witness|private_key|biometric_template/i);
  assert.ok(report.blockedMaterial.includes('production_webhook_secret'));
  assert.ok(report.blockedMaterial.includes('provider_token'));
  assert.ok(report.blockedMaterial.includes('raw_carrier_payload'));
  assert.ok(report.nonClaims.includes('not-production-delivery-attempt'));
  assert.ok(report.nonClaims.includes('not-provider-token-intake'));
  assert.ok(report.nonClaims.includes('not-raw-carrier-payload-intake'));
});

test('server-only verifier stays out of browser-facing Playlist Commerce modules', () => {
  const serverSource = readFileSync(new URL('./playlistCommerceWebhookServer.ts', import.meta.url), 'utf8');
  const sdkSource = readFileSync(new URL('./playlistCommerceSdk.ts', import.meta.url), 'utf8');
  const widgetSource = readFileSync(new URL('../components/PlaylistCommerceWidgetScreen.tsx', import.meta.url), 'utf8');

  assert.match(serverSource, /node:crypto/);
  assert.doesNotMatch(sdkSource, /playlistCommerceWebhookServer/);
  assert.doesNotMatch(widgetSource, /playlistCommerceWebhookServer/);
});
