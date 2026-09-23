import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { registerSkipshipSandboxRoutes } from './skipshipSandboxRoutes';
import { createSkipshipClient, createSkipshipFetchTransport, SkipshipApiError } from '../../../sdk/skipship-js/src';
import { signTrackingWebhookSandbox, type TrackingWebhookRequest } from '../../lib/deliveryGatewayCarrierApi';

let server: Server;
let baseUrl = '';

before(async () => {
  const app = express();
  app.use(express.json());
  registerSkipshipSandboxRoutes(app);
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

async function postJson(path: string, body: Record<string, unknown>, authorization = 'Bearer pk_test_synthetic') {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      authorization,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function postJsonWithHeaders(path: string, body: Record<string, unknown>, headers: Record<string, string>) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function getJsonWithHeaders(path: string, headers: Record<string, string>) {
  return fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers,
  });
}

test('Skipship sandbox HTTP routes run ShipmentIntent to RateQuote to CarrierAllocation', async () => {
  const intentResponse = await postJson('/v1/shipment-intents', {
    merchantRef: 'merchant_synthetic_demo',
    recipientTokenRef: 'rectok_synthetic_friend_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_001',
    addressValidationRef: 'addrval_synthetic_001',
    walletConsentRef: 'consent_synthetic_001',
    servicePreference: 'cheapest',
  });
  const intent = await intentResponse.json() as {
    intent_id: string;
    recipient_token_ref: string;
    parcel_profile_ref: string;
    wallet_consent_ref: string;
    status: string;
    privacy: { contains_raw_address: boolean; production_traffic: boolean };
  };

  assert.equal(intentResponse.status, 201);
  assert.match(intent.intent_id, /^shipintent_sandbox_[0-9a-f]{8}$/);
  assert.equal(intent.status, 'ready_for_rate_quote');
  assert.equal(intent.privacy.contains_raw_address, false);
  assert.equal(intent.privacy.production_traffic, false);

  const rateResponse = await postJson('/v1/delivery/rates', {
    addressAliasRef: intent.recipient_token_ref.replace('rectok_', 'addr_alias_'),
    parcelProfileRef: intent.parcel_profile_ref,
    objective: 'cheapest',
    requestedServiceLevels: ['economy', 'standard'],
    policyRef: 'merchant_policy_demo',
  });
  const rate = await rateResponse.json() as {
    rateRef: string;
    carrierAlias: string;
    objective: string;
  };

  assert.equal(rateResponse.status, 200);
  assert.match(rate.rateRef, /^rate_[0-9a-f]{24}$/);
  assert.equal(rate.carrierAlias, 'sandbox-carrier');

  const allocationResponse = await postJson('/v1/delivery/allocate', {
    rateRef: rate.rateRef,
    walletConsentRef: intent.wallet_consent_ref,
    objective: rate.objective,
    merchantPolicyRef: 'merchant_policy_demo',
  });
  const allocation = await allocationResponse.json() as {
    allocationRef: string;
    selectedCarrierAlias: string;
    selectionReasonCodes: string[];
  };

  assert.equal(allocationResponse.status, 200);
  assert.match(allocation.allocationRef, /^alloc_[0-9a-f]{24}$/);
  assert.equal(allocation.selectedCarrierAlias, 'sandbox-carrier');
  assert.ok(allocation.selectionReasonCodes.includes('wallet_consent_ref_present'));
});

test('Skipship SDK fetch transport runs the three-step chain against Express routes', async () => {
  const client = createSkipshipClient({
    baseUrl,
    publishableKey: 'pk_test_synthetic',
    transport: createSkipshipFetchTransport(fetch),
  });

  const intent = await client.createShipmentIntent({
    merchantRef: 'merchant_synthetic_demo',
    recipientTokenRef: 'rectok_synthetic_friend_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_001',
    addressValidationRef: 'addrval_synthetic_001',
    walletConsentRef: 'consent_synthetic_001',
    servicePreference: 'cheapest',
  });
  const quote = await client.quoteRates({
    addressAliasRef: intent.recipient_token_ref.replace('rectok_', 'addr_alias_'),
    parcelProfileRef: intent.parcel_profile_ref,
    objective: 'cheapest',
    requestedServiceLevels: ['economy', 'standard'],
    policyRef: 'merchant_policy_demo',
  });
  const allocation = await client.createCarrierAllocation({
    rateRef: quote.rateRef,
    walletConsentRef: intent.wallet_consent_ref,
    objective: quote.objective,
    merchantPolicyRef: 'merchant_policy_demo',
  });

  assert.equal(intent.status, 'ready_for_rate_quote');
  assert.equal(intent.privacy.contains_raw_address, false);
  assert.match(quote.rateRef, /^rate_[0-9a-f]{24}$/);
  assert.equal(quote.carrierAlias, 'sandbox-carrier');
  assert.match(allocation.allocationRef, /^alloc_[0-9a-f]{24}$/);
  assert.equal(allocation.selectedCarrierAlias, 'sandbox-carrier');
});

test('Hexaship MVP v0.1 sandbox route runs EC request to label and tracking through HTTP', async () => {
  const response = await postJson('/v1/hexaship/mvp-v0.1/shipments', {
    merchantRef: 'merchant_ref_route_mvp_001',
    ecOrderRef: 'ec_order_ref_route_mvp_001',
    recipientId: 'aw_rec_friend_route_mvp_001',
    parcelProfileRef: 'parcel_profile_ref_route_box_001',
    walletConsentRef: 'wallet_consent_ref_route_mvp_001',
    carrierCapabilityRef: 'carrier_capability_route_mvp_001',
    selectionMode: 'fastest',
    selectedBy: 'user',
    requestedAt: '2026-07-04T17:55:13.345Z',
  });
  const body = await response.json() as {
    ok: boolean;
    flow: string;
    selection: { selectedCarrier: string; selectionMode: string };
    recipientResolution: { containsRawAddress: boolean };
    label: { status: string; trackingAlias: string };
    tracking: { status: string };
    webhookLedger: Array<{ eventType: string; rawPayloadStored: boolean }>;
    privacy: { rawAddressStored: boolean; carrierCredentialsAcceptedFromClient: boolean };
  };

  assert.equal(response.status, 201);
  assert.equal(body.ok, true);
  assert.equal(body.flow, 'hexaship-mvp-v0.1');
  assert.equal(body.selection.selectionMode, 'fastest');
  assert.equal(body.selection.selectedCarrier, 'dhl');
  assert.equal(body.recipientResolution.containsRawAddress, false);
  assert.equal(body.label.status, 'label_created');
  assert.match(body.label.trackingAlias, /^hx_track_/);
  assert.equal(body.tracking.status, 'in_transit');
  assert.equal(body.webhookLedger.some(entry => entry.eventType === 'shipment.in_transit'), true);
  assert.equal(body.webhookLedger.every(entry => entry.rawPayloadStored === false), true);
  assert.equal(body.privacy.rawAddressStored, false);
  assert.equal(body.privacy.carrierCredentialsAcceptedFromClient, false);
});

test('Hexaship MVP v0.1 sandbox route replays idempotent requests and rejects private material', async () => {
  const body = {
    merchantRef: 'merchant_ref_route_mvp_002',
    ecOrderRef: 'ec_order_ref_route_mvp_002',
    recipientId: 'aw_rec_self_route_mvp_002',
    parcelProfileRef: 'parcel_profile_ref_route_box_002',
    walletConsentRef: 'wallet_consent_ref_route_mvp_002',
    carrierCapabilityRef: 'carrier_capability_route_mvp_002',
    selectionMode: 'cheapest',
    selectedBy: 'ec',
  };
  const headers = {
    authorization: 'Bearer pk_test_synthetic',
    'idempotency-key': 'idem_hexaship_mvp_route_001',
  };

  const firstResponse = await postJsonWithHeaders('/v1/hexaship/mvp-v0.1/shipments', body, headers);
  const first = await firstResponse.json() as { selection: { selectedCarrier: string; decisionRef: string } };
  const replayResponse = await postJsonWithHeaders('/v1/hexaship/mvp-v0.1/shipments', { ...body }, headers);
  const replay = await replayResponse.json() as { selection: { decisionRef: string } };
  const privateMaterialResponse = await postJson('/v1/hexaship/mvp-v0.1/shipments', {
    ...body,
    rawAddress: 'blocked',
    carrierApiKey: 'blocked',
  });
  const privateMaterial = await privateMaterialResponse.json() as { error: string; rejectedKeys: string[] };

  assert.equal(firstResponse.status, 201);
  assert.equal(firstResponse.headers.get('skipship-idempotency-replayed'), 'false');
  assert.equal(first.selection.selectedCarrier, 'ups');
  assert.equal(replayResponse.status, 201);
  assert.equal(replayResponse.headers.get('skipship-idempotency-replayed'), 'true');
  assert.equal(replay.selection.decisionRef, first.selection.decisionRef);
  assert.equal(privateMaterialResponse.status, 400);
  assert.equal(privateMaterial.error, 'private_material_rejected');
  assert.deepEqual(privateMaterial.rejectedKeys.sort(), ['carrierApiKey', 'rawAddress']);
});

test('Hexaship MVP v0.1 sandbox route requires a test bearer', async () => {
  const response = await postJson('/v1/hexaship/mvp-v0.1/shipments', {
    merchantRef: 'merchant_ref_route_mvp_003',
    ecOrderRef: 'ec_order_ref_route_mvp_003',
    recipientId: 'aw_rec_friend_route_mvp_003',
    parcelProfileRef: 'parcel_profile_ref_route_box_003',
    walletConsentRef: 'wallet_consent_ref_route_mvp_003',
    carrierCapabilityRef: 'carrier_capability_route_mvp_003',
    selectionMode: 'fastest',
  }, '');
  const body = await response.json() as { error: string };

  assert.equal(response.status, 401);
  assert.equal(body.error, 'auth_required');
});

test('Merchant Console onboarding route accepts safe fixture refs with idempotency and rejects unsafe setup', async () => {
  const fixture = JSON.parse(readFileSync('docs/specs/fixtures/merchant-console-onboarding-v0.1.json', 'utf8')) as {
    request: Record<string, unknown>;
  };
  const headers = {
    authorization: 'Bearer pk_test_synthetic',
    'idempotency-key': 'idem_merchant_onboarding_route_001',
  };

  const firstResponse = await postJsonWithHeaders('/v1/merchant-console/onboarding', fixture.request, headers);
  const first = await firstResponse.json() as {
    ok: boolean;
    onboardingRef: string;
    merchantRef: string;
    walletBoundary: {
      addressFormVersionRef: string;
      carrierSpecificAddressShapeBlocked: boolean;
      rawAddressVisibleToEc: boolean;
      carrierSpecificAddressShapeCollectedByEc: boolean;
    };
    localOnly: boolean;
    productionTraffic: boolean;
  };
  const replayResponse = await postJsonWithHeaders('/v1/merchant-console/onboarding', { ...fixture.request }, headers);
  const replay = await replayResponse.json() as { onboardingRef: string };
  const conflictResponse = await postJsonWithHeaders('/v1/merchant-console/onboarding', {
    ...fixture.request,
    merchantAccount: {
      displayName: 'Synthetic Changed Store',
      adminUserRef: 'admin_user_ref_synthetic_001',
      businessProfileRef: 'business_profile_ref_synthetic_001',
      billingProfileRef: 'billing_profile_ref_synthetic_001',
      twoFactorEnabled: true,
    },
  }, headers);
  const conflict = await conflictResponse.json() as { error: string };
  const privateMaterialResponse = await postJson('/v1/merchant-console/onboarding', {
    ...fixture.request,
    addressWalletSettings: {
      addressFormVersionRef: 'wallet_country_form_ref_us_en_v1',
      carrierSpecificAddressShapeBlocked: true,
      rawAddress: 'blocked synthetic private material',
    },
    apiKeysAndWebhooks: {
      carrierApiKey: 'blocked synthetic carrier key',
    },
  });
  const privateMaterial = await privateMaterialResponse.json() as { error: string; rejectedKeys: string[] };
  const missingBoundaryResponse = await postJson('/v1/merchant-console/onboarding', {
    ...fixture.request,
    addressWalletSettings: {
      addressFormVersionRef: 'form_ref_missing_prefix_001',
      carrierSpecificAddressShapeBlocked: false,
    },
  });
  const missingBoundary = await missingBoundaryResponse.json() as { error: string; missingRefs: string[] };
  const missingAuthResponse = await postJson('/v1/merchant-console/onboarding', fixture.request, '');
  const missingAuth = await missingAuthResponse.json() as { error: string };

  assert.equal(firstResponse.status, 201);
  assert.equal(firstResponse.headers.get('skipship-idempotency-replayed'), 'false');
  assert.equal(first.ok, true);
  assert.match(first.onboardingRef, /^merchant_onboarding_ref_[0-9a-f]{24}$/);
  assert.match(first.merchantRef, /^merchant_[0-9a-f]{24}$/);
  assert.equal(first.walletBoundary.addressFormVersionRef, 'wallet_country_form_ref_us_en_v1');
  assert.equal(first.walletBoundary.carrierSpecificAddressShapeBlocked, true);
  assert.equal(first.walletBoundary.rawAddressVisibleToEc, false);
  assert.equal(first.walletBoundary.carrierSpecificAddressShapeCollectedByEc, false);
  assert.equal(first.localOnly, true);
  assert.equal(first.productionTraffic, false);
  assert.equal(replayResponse.status, 201);
  assert.equal(replayResponse.headers.get('skipship-idempotency-replayed'), 'true');
  assert.equal(replay.onboardingRef, first.onboardingRef);
  assert.equal(conflictResponse.status, 409);
  assert.equal(conflict.error, 'idempotency_key_conflict');
  assert.equal(privateMaterialResponse.status, 400);
  assert.equal(privateMaterial.error, 'private_material_rejected');
  assert.deepEqual(privateMaterial.rejectedKeys.sort(), ['addressWalletSettings.rawAddress', 'apiKeysAndWebhooks.carrierApiKey']);
  assert.equal(missingBoundaryResponse.status, 400);
  assert.equal(missingBoundary.error, 'missing_wallet_form_boundary');
  assert.deepEqual(missingBoundary.missingRefs.sort(), [
    'addressWalletSettings.addressFormVersionRef',
    'addressWalletSettings.carrierSpecificAddressShapeBlocked',
  ]);
  assert.equal(missingAuthResponse.status, 401);
  assert.equal(missingAuth.error, 'auth_required');
});

test('Skipship SDK and sandbox routes pass through idempotency keys as headers', async () => {
  const capturedHeaders: Record<string, string>[] = [];
  const client = createSkipshipClient({
    baseUrl,
    publishableKey: 'pk_test_synthetic',
    transport: async request => {
      capturedHeaders.push(request.headers);
      const response = await createSkipshipFetchTransport(fetch)(request);
      return response;
    },
  });

  await client.createShipmentIntent({
    merchantRef: 'merchant_synthetic_demo',
    recipientTokenRef: 'rectok_synthetic_friend_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_001',
    addressValidationRef: 'addrval_synthetic_001',
    walletConsentRef: 'consent_synthetic_001',
    servicePreference: 'cheapest',
  }, { idempotencyKey: 'idem_synthetic_checkout_001' });

  assert.equal(capturedHeaders[0]['idempotency-key'], 'idem_synthetic_checkout_001');

  const response = await postJsonWithHeaders('/v1/shipment-intents', {
    merchantRef: 'merchant_synthetic_demo',
    recipientTokenRef: 'rectok_synthetic_friend_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_001',
    addressValidationRef: 'addrval_synthetic_001',
    walletConsentRef: 'consent_synthetic_001',
  }, {
    authorization: 'Bearer pk_test_synthetic',
    'idempotency-key': 'idem_synthetic_direct_001',
  });

  assert.equal(response.status, 201);
  assert.equal(response.headers.get('skipship-idempotency-key'), 'idem_synthetic_direct_001');
});

test('Skipship sandbox routes replay matching idempotent requests and reject conflicts', async () => {
  const body = {
    merchantRef: 'merchant_synthetic_demo',
    recipientTokenRef: 'rectok_synthetic_friend_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_001',
    addressValidationRef: 'addrval_synthetic_001',
    walletConsentRef: 'consent_synthetic_001',
    servicePreference: 'cheapest',
  };
  const headers = {
    authorization: 'Bearer pk_test_synthetic',
    'idempotency-key': 'idem_synthetic_replay_001',
  };

  const firstResponse = await postJsonWithHeaders('/v1/shipment-intents', body, headers);
  const first = await firstResponse.json() as { intent_id: string };
  const replayResponse = await postJsonWithHeaders('/v1/shipment-intents', { ...body }, headers);
  const replay = await replayResponse.json() as { intent_id: string };
  const conflictResponse = await postJsonWithHeaders('/v1/shipment-intents', {
    ...body,
    servicePreference: 'fastest',
  }, headers);
  const conflict = await conflictResponse.json() as { error: string };

  assert.equal(firstResponse.status, 201);
  assert.equal(firstResponse.headers.get('skipship-idempotency-replayed'), 'false');
  assert.equal(replayResponse.status, 201);
  assert.equal(replayResponse.headers.get('skipship-idempotency-replayed'), 'true');
  assert.equal(replay.intent_id, first.intent_id);
  assert.equal(conflictResponse.status, 409);
  assert.equal(conflict.error, 'idempotency_key_conflict');
});

test('Skipship sandbox tracking webhook verifies signatures and keeps receipts redacted', async () => {
  const body: TrackingWebhookRequest = {
    eventId: 'evt_tracking_synthetic_route_001',
    carrierAlias: 'sandbox-carrier',
    trackingAlias: 'tracking_receipt_synthetic_route_001',
    status: 'in_transit',
    occurredAt: '2026-07-04T09:00:00.000Z',
  };
  const timestamp = '1783155600';
  const signature = signTrackingWebhookSandbox({ timestamp, body });

  const acceptedResponse = await postJsonWithHeaders('/v1/delivery/webhooks/tracking', body, {
    'skipship-signature': signature,
    'skipship-timestamp': timestamp,
  });
  const accepted = await acceptedResponse.json() as {
    ok: boolean;
    accepted: boolean;
    trackingReceiptRef: string;
    eventFingerprint: string;
    localOnly: boolean;
    rawAddressStored: boolean;
    productionTraffic: boolean;
  };

  assert.equal(acceptedResponse.status, 202);
  assert.equal(acceptedResponse.headers.get('skipship-webhook-event-replayed'), 'false');
  assert.equal(acceptedResponse.headers.get('skipship-webhook-event-attempt'), '1');
  const acceptedExpiresAt = acceptedResponse.headers.get('skipship-webhook-event-expires-at') ?? '';
  assert.match(acceptedExpiresAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(accepted.ok, true);
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.trackingReceiptRef, body.trackingAlias);
  assert.match(accepted.eventFingerprint, /^evtfp_[0-9a-f]{24}$/);
  assert.equal(accepted.localOnly, true);
  assert.equal(accepted.rawAddressStored, false);
  assert.equal(accepted.productionTraffic, false);

  const ledgerResponse = await getJsonWithHeaders('/v1/merchant-console/webhook-ledger', {
    authorization: 'Bearer pk_test_synthetic',
  });
  const ledger = await ledgerResponse.json() as {
    rows: Array<{
      eventId: string;
      safeRefs: { eventRef: string };
      attemptCount: number;
      expiresAt: string;
    }>;
    totals: { events: number };
    source: {
      mode: string;
      localOnly: boolean;
      productionTraffic: boolean;
      blockedMaterial: string[];
    };
  };
  const ledgerText = JSON.stringify(ledger);

  assert.equal(ledgerResponse.status, 200);
  assert.equal(ledger.source.mode, 'storeSnapshot');
  assert.equal(ledger.source.localOnly, true);
  assert.equal(ledger.source.productionTraffic, false);
  assert.equal(ledger.totals.events >= 1, true);
  assert.equal(ledger.rows.find(row => row.eventId === body.eventId)?.safeRefs.eventRef, `webhook_event:${body.eventId}`);
  assert.equal(ledger.rows.find(row => row.eventId === body.eventId)?.attemptCount, 1);
  assert.equal(ledger.rows.find(row => row.eventId === body.eventId)?.expiresAt, acceptedExpiresAt);
  assert.ok(ledger.source.blockedMaterial.includes('bodyFingerprint'));
  assert.doesNotMatch(ledgerText, /evtfp_[0-9a-f]{24}|tracking_receipt_synthetic_route_001|rawAddressValue|recipientPhoneValue|carrierSecretValue|proofWitnessValue|bodyFingerprint_[a-z0-9_:-]+/i);

  const replayResponse = await postJsonWithHeaders('/v1/delivery/webhooks/tracking', { ...body }, {
    'skipship-signature': signature,
    'skipship-timestamp': timestamp,
  });
  const replay = await replayResponse.json() as { eventFingerprint: string };

  assert.equal(replayResponse.status, 202);
  assert.equal(replayResponse.headers.get('skipship-webhook-event-replayed'), 'true');
  assert.equal(replayResponse.headers.get('skipship-webhook-event-attempt'), '2');
  assert.equal(replayResponse.headers.get('skipship-webhook-event-expires-at'), acceptedExpiresAt);
  assert.equal(replay.eventFingerprint, accepted.eventFingerprint);

  const replayLedgerResponse = await getJsonWithHeaders('/v1/merchant-console/webhook-ledger', {
    authorization: 'Bearer pk_test_synthetic',
  });
  const replayLedger = await replayLedgerResponse.json() as {
    rows: Array<{
      eventId: string;
      attemptCount: number;
      expiresAt: string;
    }>;
  };
  const replayLedgerRow = replayLedger.rows.find(row => row.eventId === body.eventId);

  assert.equal(replayLedgerResponse.status, 200);
  assert.equal(replayLedgerRow?.attemptCount, Number(replayResponse.headers.get('skipship-webhook-event-attempt')));
  assert.equal(replayLedgerRow?.expiresAt, replayResponse.headers.get('skipship-webhook-event-expires-at'));

  const unsignedResponse = await postJsonWithHeaders('/v1/delivery/webhooks/tracking', body, {
    'skipship-timestamp': timestamp,
  });
  const unsigned = await unsignedResponse.json() as { error: string };

  assert.equal(unsignedResponse.status, 401);
  assert.equal(unsigned.error, 'missing_signature');

  const changedBodyResponse = await postJsonWithHeaders('/v1/delivery/webhooks/tracking', {
    ...body,
    status: 'delivered',
  }, {
    'skipship-signature': signature,
    'skipship-timestamp': timestamp,
  });
  const changedBody = await changedBodyResponse.json() as { error: string };

  assert.equal(changedBodyResponse.status, 401);
  assert.equal(changedBody.error, 'signature_mismatch');

  const conflictingBody: TrackingWebhookRequest = {
    ...body,
    status: 'delivered',
  };
  const conflictingSignature = signTrackingWebhookSandbox({ timestamp, body: conflictingBody });
  const conflictResponse = await postJsonWithHeaders('/v1/delivery/webhooks/tracking', conflictingBody, {
    'skipship-signature': conflictingSignature,
    'skipship-timestamp': timestamp,
  });
  const conflict = await conflictResponse.json() as { error: string };

  assert.equal(conflictResponse.status, 409);
  assert.equal(conflictResponse.headers.get('skipship-webhook-event-replayed'), 'false');
  assert.equal(conflictResponse.headers.get('skipship-webhook-event-attempt'), '3');
  assert.equal(conflict.error, 'tracking_webhook_event_conflict');

  const privateMaterialResponse = await postJsonWithHeaders('/v1/delivery/webhooks/tracking', {
    ...body,
    rawAddress: 'blocked',
  }, {
    'skipship-signature': signature,
    'skipship-timestamp': timestamp,
  });
  const privateMaterial = await privateMaterialResponse.json() as { error: string; rejectedKeys: string[] };

  assert.equal(privateMaterialResponse.status, 400);
  assert.equal(privateMaterial.error, 'private_material_rejected');
  assert.ok(privateMaterial.rejectedKeys.includes('rawAddress'));
});

test('Skipship Merchant Console webhook ledger route requires a test bearer', async () => {
  const response = await getJsonWithHeaders('/v1/merchant-console/webhook-ledger', {});
  const body = await response.json() as { error: string };

  assert.equal(response.status, 401);
  assert.equal(body.error, 'auth_required');
});

test('Skipship SDK fetch transport exposes structured route errors', async () => {
  const client = createSkipshipClient({
    baseUrl,
    publishableKey: '',
    transport: createSkipshipFetchTransport(fetch),
  });

  await assert.rejects(
    () => client.createShipmentIntent({
      merchantRef: 'merchant_synthetic_demo',
      recipientTokenRef: 'rectok_synthetic_friend_001',
      parcelProfileRef: 'parcel_profile_synthetic_small_001',
      addressValidationRef: 'addrval_synthetic_001',
      servicePreference: 'cheapest',
    }),
    (error: unknown) => {
      assert.ok(error instanceof SkipshipApiError);
      assert.equal(error.operation, 'createShipmentIntent');
      assert.equal(error.status, 401);
      assert.equal((error.body as { error: string }).error, 'auth_required');
      assert.equal((error.body as { ok: boolean }).ok, false);
      return true;
    },
  );
});

test('Skipship sandbox HTTP routes reject missing auth and private material', async () => {
  const missingAuth = await postJson('/v1/shipment-intents', {
    merchantRef: 'merchant_synthetic_demo',
    recipientTokenRef: 'rectok_synthetic_friend_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_001',
    addressValidationRef: 'addrval_synthetic_001',
  }, '');
  const missingAuthBody = await missingAuth.json() as { error: string };

  assert.equal(missingAuth.status, 401);
  assert.equal(missingAuthBody.error, 'auth_required');

  const privateMaterial = await postJson('/v1/delivery/rates', {
    addressAliasRef: 'addr_alias_synthetic_friend_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_001',
    objective: 'cheapest',
    requestedServiceLevels: ['economy'],
    carrierCredential: 'blocked',
  });
  const privateMaterialBody = await privateMaterial.json() as { error: string; rejectedKeys: string[] };

  assert.equal(privateMaterial.status, 400);
  assert.equal(privateMaterialBody.error, 'private_material_rejected');
  assert.ok(privateMaterialBody.rejectedKeys.includes('carrierCredential'));
});
