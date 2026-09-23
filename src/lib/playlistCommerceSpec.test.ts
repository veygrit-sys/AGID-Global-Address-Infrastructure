import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse as parseYaml } from 'yaml';

import {
  PLAYLIST_ARCHETYPES,
  PLAYLIST_COMMERCE_ANALYTICS,
  PLAYLIST_COMMERCE_API_SURFACES,
  PLAYLIST_COMMERCE_CAPABILITIES,
  PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT,
  PLAYLIST_COMMERCE_WEBHOOK_ROUTES,
  buildPlaylistCommerceSpec,
  getPlaylistCommerceFlow,
  summarizePlaylistCommerceSpec,
  validatePlaylistCommerceSpec,
} from './playlistCommerceSpec';

test('Playlist Commerce spec validates as an executable product contract', () => {
  const spec = buildPlaylistCommerceSpec();
  const errors = validatePlaylistCommerceSpec(spec);

  assert.deepEqual(errors, []);
  assert.equal(spec.version, 'playlist-commerce-v0.1');
  assert.ok(spec.principle.includes('raw address data'));
  assert.ok(spec.actors.some(actor => actor.id === 'identity-wallet'));
  assert.ok(spec.actors.some(actor => actor.id === 'address-login'));
  assert.ok(spec.actors.some(actor => actor.id === 'delivery-gateway'));
});

test('API catalog includes the requested SDKs and APIs while forbidding private material', () => {
  const required = new Set([
    'playlist-sdk',
    'search-api',
    'product-api',
    'share-api',
    'save-api',
    'recommendation-api',
    'checkout-api',
    'identity-wallet-sdk',
    'address-login-sdk',
  ]);

  for (const id of required) {
    assert.ok(PLAYLIST_COMMERCE_API_SURFACES.some(api => api.id === id), `missing ${id}`);
  }

  assert.ok(PLAYLIST_COMMERCE_API_SURFACES.every(api => api.rawAddressAllowed === false));
  assert.ok(PLAYLIST_COMMERCE_API_SURFACES.every(api => api.privateMaterialAllowed === false));
  assert.ok(PLAYLIST_COMMERCE_API_SURFACES.some(api => api.type === 'webhook'));
});

test('merchant webhook route contract documents statuses, controls, and redacted response body', () => {
  const route = PLAYLIST_COMMERCE_WEBHOOK_ROUTES.find(candidate => candidate.id === 'merchant-webhook-route')!;
  const statuses = new Set(route.responseStatuses.map(response => response.status));
  const merchantWebhook = PLAYLIST_COMMERCE_API_SURFACES.find(api => api.id === 'merchant-webhook')!;

  assert.equal(route.method, 'POST');
  assert.equal(route.path, '/webhooks/playlist-commerce');
  assert.equal(merchantWebhook.endpoint, 'POST /webhooks/playlist-commerce');
  for (const status of [202, 400, 401, 404, 405] as const) {
    assert.ok(statuses.has(status), `missing ${status}`);
  }
  for (const control of [
    'hmac-sha256-signature',
    'constant-time-compare',
    'timestamp-replay-window',
    'keyring-status-active-next-retired',
    'event-id-idempotency-store',
    'topic-allowlist',
    'redacted-operational-response',
  ]) {
    assert.ok(route.requiredControls.includes(control), `missing ${control}`);
  }
  assert.ok(route.acceptedTopics.includes('checkout.alias_created'));
  assert.ok(route.acceptedTopics.includes('delivery.receipt_created'));
  assert.ok(route.acceptedTopics.includes('analytics.aggregate_ready'));
  assert.ok(route.redactedFields.includes('payload'));
  assert.ok(route.redactedFields.includes('raw_address'));
  assert.ok(route.nonClaims.includes('not-raw-address-intake'));
  for (const response of route.responseStatuses) {
    assert.ok(response.bodyFields.includes('nonClaims'));
    assert.ok(!response.bodyFields.includes('payload'));
    assert.ok(!response.bodyFields.includes('raw_address'));
    assert.ok(!response.bodyFields.includes('proof_witness'));
  }
});

test('merchant webhook OpenAPI document mirrors the executable route contract', () => {
  const route = PLAYLIST_COMMERCE_WEBHOOK_ROUTES.find(candidate => candidate.id === 'merchant-webhook-route')!;
  const document = parseYaml(readFileSync('docs/specs/playlist-commerce-webhooks.openapi.yaml', 'utf8')) as {
    openapi: string;
    externalDocs: { url?: string; description?: string };
    paths: Record<string, { post: Record<string, unknown> & { responses: Record<string, unknown> } }>;
    components: {
      schemas: Record<string, Record<string, unknown> & { properties?: Record<string, unknown>; enum?: string[] }>;
    };
  };
  const operation = document.paths[route.path]?.post;
  const responseStatuses = Object.keys(operation.responses).map(Number).sort((left, right) => left - right);
  const routeStatuses = route.responseStatuses.map(response => response.status).sort((left, right) => left - right);
  const responseSchema = document.components.schemas.PlaylistCommerceWebhookRouteResponseBody;
  const responseProperties = Object.keys(responseSchema.properties ?? {});
  const topicSchema = document.components.schemas.PlaylistCommerceWebhookTopic;
  const externalDocs = document.externalDocs as { url?: string; description?: string };
  const operationExternalDocs = operation.externalDocs as { url?: string; description?: string };
  const evidenceFixtures = operation['x-agid-evidence-fixtures'] as Record<string, unknown>;

  assert.equal(document.openapi, '3.1.0');
  assert.equal(operation.operationId, 'receivePlaylistCommerceMerchantWebhook');
  assert.equal(externalDocs.url, './README.md#playlist-commerce-webhook-evidence');
  assert.equal(operationExternalDocs.url, './README.md#playlist-commerce-webhook-evidence');
  assert.deepEqual(operation['x-agid-accepted-topics'], route.acceptedTopics);
  assert.deepEqual(operation['x-agid-required-controls'], route.requiredControls);
  assert.deepEqual(operation['x-agid-redacted-fields'], route.redactedFields);
  assert.deepEqual(operation['x-agid-non-claims'], route.nonClaims);
  assert.equal(evidenceFixtures.evidenceFixture, 'docs/specs/fixtures/playlist-commerce-webhook-evidence-v0.1.json');
  assert.equal(evidenceFixtures.evidenceSchema, 'docs/specs/schemas/playlist-commerce-webhook-evidence-v0.1.schema.json');
  assert.equal(evidenceFixtures.verifierCommand, 'npm run verify:playlist-commerce-evidence');
  assert.equal(evidenceFixtures.aggregateVerifierCommand, 'npm run verify:playlist-commerce');
  assert.equal(evidenceFixtures.managedServiceBoundary, 'fixture-only-not-hosted-evidence-vault');
  assert.equal(evidenceFixtures.localOnly, true);
  assert.deepEqual(evidenceFixtures.nonClaims, PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.nonClaims);
  assert.ok((evidenceFixtures.forbiddenMaterial as string[]).includes('production_webhook_secret'));
  assert.deepEqual(responseStatuses, routeStatuses);
  assert.deepEqual(topicSchema.enum, route.acceptedTopics);

  for (const forbidden of [
    'payload',
    'raw_address',
    'recipient_phone',
    'provider_token',
    'raw_provider_profile',
    'raw_carrier_payload',
    'proof_witness',
    'private_key',
  ]) {
    assert.ok(!responseProperties.includes(forbidden), `OpenAPI response leaks ${forbidden}`);
  }
});

test('merchant webhook synthetic signed ping preflight stays local-only and privacy safe', () => {
  const route = PLAYLIST_COMMERCE_WEBHOOK_ROUTES.find(
    candidate => candidate.id === PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.routeId,
  )!;

  assert.equal(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.localOnly, true);
  assert.equal(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.method, route.method);
  assert.equal(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.path, route.path);
  assert.equal(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.expectedStatus, 202);
  assert.equal(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.replayExpectedStatus, 401);
  assert.ok(route.acceptedTopics.includes(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.topic));
  assert.equal(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.safeCommand, 'npm run verify:playlist-commerce');
  assert.ok(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.blockedMaterial.includes('production_webhook_secret'));
  assert.ok(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.blockedMaterial.includes('raw_address'));
  assert.ok(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.blockedMaterial.includes('provider_token'));
  assert.ok(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.blockedMaterial.includes('raw_provider_profile'));
  assert.ok(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.blockedMaterial.includes('raw_carrier_payload'));
  assert.ok(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.nonClaims.includes('not-production-delivery-attempt'));
  assert.ok(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.nonClaims.includes('not-provider-token-intake'));
  assert.ok(PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.nonClaims.includes('not-raw-carrier-payload-intake'));
  assert.ok(!PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.safeInputs.includes('private_key'));
  assert.ok(!PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.safeInputs.includes('proof_witness'));
  assert.ok(!PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.safeInputs.includes('provider_token'));
  assert.ok(!PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT.safeInputs.includes('raw_carrier_payload'));
});

test('playlist archetypes cover shopping purposes, gifts, travel, repeat purchases, and cross-border commerce', () => {
  const archetypeIds = new Set(PLAYLIST_ARCHETYPES.map(archetype => archetype.id));

  for (const id of [
    'wishlist',
    'gift-list',
    'moving-list',
    'new-life-list',
    'travel-prep-list',
    'monthly-repeat-list',
    'event-list',
    'creator-review-list',
    'hotel-delivery-list',
    'cross-border-list',
  ]) {
    assert.ok(archetypeIds.has(id), `missing ${id}`);
  }

  const gift = PLAYLIST_ARCHETYPES.find(archetype => archetype.id === 'gift-list')!;
  assert.ok(gift.requiredCapabilities.includes('delivery.gift'));
  assert.ok(gift.requiredCapabilities.includes('address.noEntryCheckout'));

  const travel = PLAYLIST_ARCHETYPES.find(archetype => archetype.id === 'travel-prep-list')!;
  assert.ok(travel.identityWalletTouchpoints.some(touchpoint => /Travel Login/i.test(touchpoint)));
});

test('no-address playlist checkout uses wallet consent, Address Login, checkout alias, and carrier handoff', () => {
  const flow = getPlaylistCommerceFlow('no-address-playlist-checkout')!;
  const capabilityIds = new Set(flow.stages.flatMap(stage => stage.requiredCapabilities));

  assert.equal(flow.stages.length, 7);
  assert.ok(capabilityIds.has('identity.walletConsent'));
  assert.ok(capabilityIds.has('address.noEntryCheckout'));
  assert.ok(capabilityIds.has('checkout.oneTap'));
  assert.ok(capabilityIds.has('delivery.carrierHandoff'));
  assert.ok(flow.stages.some(stage => stage.dataVisibility.merchant.includes('order_alias')));
  assert.ok(flow.stages.some(stage => stage.dataVisibility.carrier.includes('carrier_decryptable_address_ref')));

  for (const stage of flow.stages) {
    assert.ok(!stage.dataVisibility.merchant.includes('raw_address'));
    assert.ok(stage.dataVisibility.hiddenFromMerchant.includes('raw_address'));
    assert.ok(stage.dataVisibility.notPersisted.includes('proof_witness'));
    assert.ok(stage.dataVisibility.notPersisted.includes('private_key'));
  }
});

test('merchant analytics expose aggregate metrics only', () => {
  assert.ok(PLAYLIST_COMMERCE_ANALYTICS.length >= 4);

  for (const metric of PLAYLIST_COMMERCE_ANALYTICS) {
    assert.ok(metric.allowedFields.length > 0);
    assert.ok(metric.forbiddenFields.includes('raw_address'));
    assert.ok(!metric.allowedFields.includes('raw_address'));
    assert.ok(!metric.allowedFields.includes('recipient_identity'));
    assert.ok(!metric.allowedFields.includes('social_graph_edges'));
  }
});

test('capability graph keeps Identity Wallet, Address Login, Delivery Gateway, and Trade Gateway connected', () => {
  const capabilityById = new Map(PLAYLIST_COMMERCE_CAPABILITIES.map(capability => [capability.id, capability]));

  assert.ok(capabilityById.get('identity.walletConsent')?.actors.includes('identity-wallet'));
  assert.ok(capabilityById.get('address.noEntryCheckout')?.actors.includes('address-login'));
  assert.ok(capabilityById.get('delivery.carrierHandoff')?.actors.includes('delivery-gateway'));
  assert.ok(capabilityById.get('trade.crossBorderEligibility')?.actors.includes('trade-gateway'));
  assert.ok(capabilityById.get('merchant.analytics')?.privateData.includes('social_graph_edges'));
});

test('non-claims block overclaiming as marketplace, payment processor, or raw-address store', () => {
  const spec = buildPlaylistCommerceSpec();
  const nonClaimIds = new Set(spec.nonClaims.map(nonClaim => nonClaim.id));

  assert.ok(nonClaimIds.has('not-full-marketplace'));
  assert.ok(nonClaimIds.has('not-payment-processor'));
  assert.ok(nonClaimIds.has('not-price-guarantee'));
  assert.ok(nonClaimIds.has('not-raw-address-store'));
  assert.ok(nonClaimIds.has('not-scraping-default'));
});

test('summary exposes the implementation size and privacy boundary', () => {
  const summary = summarizePlaylistCommerceSpec();

  assert.equal(summary.actorCount, 10);
  assert.equal(summary.archetypeCount, 10);
  assert.ok(summary.capabilityCount >= 20);
  assert.ok(summary.apiSurfaceCount >= 10);
  assert.equal(summary.webhookRouteCount, 1);
  assert.equal(summary.webhookSyntheticPingLocalOnly, true);
  assert.equal(summary.noAddressCheckoutStageCount, 7);
  assert.ok(summary.privacyBoundary.some(boundary => boundary.includes('merchant receives aliases')));
});
