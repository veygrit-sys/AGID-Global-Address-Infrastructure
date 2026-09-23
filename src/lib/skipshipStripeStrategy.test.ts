import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildSkipshipStripeStrategy,
  SKIPSHIP_API_PRIMITIVES,
  SKIPSHIP_BUILD_PHASES,
  SKIPSHIP_COMMERCE_INTEGRATION_PLACEMENTS,
  SKIPSHIP_PRODUCT_LAYERS,
  SKIPSHIP_REVENUE_STREAMS,
  SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY,
  validateSkipshipStripeStrategy,
} from './skipshipStripeStrategy';

test('Skipship strategy validates as address-native shipping infrastructure', () => {
  const strategy = buildSkipshipStripeStrategy();

  assert.deepEqual(validateSkipshipStripeStrategy(strategy), []);
  assert.match(strategy.thesis, /address-native shipping infrastructure/);
  assert.match(strategy.antiThesis, /not be positioned as only a rate-shopping or label-printing wrapper/);
  assert.ok(strategy.moats.includes('address-wallet'));
  assert.ok(strategy.moats.includes('recipient-id'));
  assert.ok(strategy.moats.includes('addressql-validation'));
  assert.equal(strategy.safetyBoundaries.merchantRawAddressDefault, false);
  assert.equal(strategy.safetyBoundaries.clientCarrierCredentialsAllowed, false);
  assert.equal(strategy.commerceIntegrationPlacements.length, 2);
});

test('Skipship product layers separate OSS, shared contracts, and commercial managed surfaces', () => {
  const byId = new Map(SKIPSHIP_PRODUCT_LAYERS.map(layer => [layer.id, layer]));

  assert.equal(byId.get('addressql-layer')?.boundary, 'oss');
  assert.equal(byId.get('shipping-api')?.boundary, 'shared-contract');
  assert.equal(byId.get('carrier-connect')?.boundary, 'commercial-managed');
  assert.equal(byId.get('settlement-ops')?.boundary, 'commercial-managed');
  assert.match(byId.get('recipient-identity')?.purpose ?? '', /without default raw-address exposure/);
  assert.match(byId.get('carrier-connect')?.nonClaims.join(' ') ?? '', /carrier-specific legal/);
});

test('Skipship API primitives map Stripe-like objects without accepting unsafe material', () => {
  const byId = new Map(SKIPSHIP_API_PRIMITIVES.map(primitive => [primitive.id, primitive]));

  assert.equal(byId.get('shipment-intent')?.stripeAnalogy, 'PaymentIntent');
  assert.equal(byId.get('recipient')?.stripeAnalogy, 'Customer');
  assert.equal(byId.get('tracking-event')?.stripeAnalogy, 'Webhook event');
  assert.ok(byId.get('shipment-intent')?.blockedMaterial.includes('rawAddress'));
  assert.ok(byId.get('label')?.blockedMaterial.includes('carrierApiKey'));
  assert.match(byId.get('rate')?.purpose ?? '', /fastest, cheapest, and balanced/);
});

test('Skipship lets merchants choose Playlist Commerce or EC Social Login as distinct shipping Stripe placements', () => {
  const byId = new Map(SKIPSHIP_COMMERCE_INTEGRATION_PLACEMENTS.map(placement => [placement.id, placement]));
  const playlist = byId.get('playlist-commerce');
  const ec = byId.get('ec-social-login');

  assert.deepEqual(validateSkipshipStripeStrategy(buildSkipshipStripeStrategy()), []);
  assert.equal(playlist?.label, 'Playlist Commerce');
  assert.equal(playlist?.installTarget, 'veygrit-app');
  assert.equal(playlist?.startPoint, 'veygrit');
  assert.equal(playlist?.productQuestion, 'which-ec-to-use');
  assert.equal(playlist?.loginButtonRequiredToShop, false);
  assert.equal(playlist?.continueWithVeygritRequired, false);
  assert.equal(playlist?.addressWalletReuse, 'wallet-side-consent');
  assert.ok(playlist?.safeOutputs.includes('playlistParticipationRef'));
  assert.equal(ec?.label, 'EC Social Login');
  assert.equal(ec?.installTarget, 'merchant-ec-plugin-or-sdk');
  assert.equal(ec?.startPoint, 'merchant-ec-site');
  assert.equal(ec?.productQuestion, 'how-to-buy-at-that-ec');
  assert.equal(ec?.loginButtonRequiredToShop, true);
  assert.equal(ec?.continueWithVeygritRequired, true);
  assert.equal(ec?.addressWalletReuse, 'ec-side-address-login');
  assert.ok(ec?.safeOutputs.includes('carrierHandoffRef'));
  assert.ok(ec?.blockedMaterial.includes('rawAddress'));
});

test('Skipship revenue plan keeps OSS contracts public and live operations commercial', () => {
  const byId = new Map(SKIPSHIP_REVENUE_STREAMS.map(stream => [stream.id, stream]));

  assert.equal(byId.get('shipment-api-usage')?.boundary, 'usage');
  assert.equal(byId.get('merchant-console-saas')?.boundary, 'saas');
  assert.equal(byId.get('carrier-connect-managed')?.boundary, 'managed-ops');
  assert.equal(byId.get('enterprise-private-deployment')?.boundary, 'enterprise');
  assert.match(byId.get('carrier-connect-managed')?.ossBoundary ?? '', /credentials and live carrier operations are commercial/);
});

test('Skipship roadmap moves from safe contracts to managed shipping network', () => {
  assert.deepEqual(SKIPSHIP_BUILD_PHASES.map(phase => phase.phase), ['v0.1', 'v0.2', 'v0.3', 'v0.4', 'v0.5', 'v1.0']);
  assert.ok(SKIPSHIP_BUILD_PHASES[0].verification.includes('verify:skipship-js'));
  assert.ok(SKIPSHIP_BUILD_PHASES[0].verification.includes('verify:addressql'));
  assert.match(SKIPSHIP_BUILD_PHASES.find(phase => phase.phase === 'v0.3')?.title ?? '', /Address Wallet Friend Delivery/);
});

test('Skipship webhook idempotency policy defines production durability gates', () => {
  assert.equal(SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY.surface, 'tracking-webhook');
  assert.equal(SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY.eventKey, 'eventId');
  assert.equal(SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY.replayBehavior, 'ack-same-event');
  assert.equal(SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY.conflictBehavior, 'reject-same-event-different-body');
  assert.equal(SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY.replayWindowSeconds, 300);
  assert.equal(SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY.minimumStoreTtlDays, 30);
  assert.ok(SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY.blockedMaterial.includes('rawAddress'));
  assert.ok(SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY.productionRequirements.some(requirement => /durable event idempotency store/i.test(requirement)));
  assert.ok(SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY.productionRequirements.some(requirement => /dead-letter queue/i.test(requirement)));
});

test('Skipship strategy doc and existing SDK/API surfaces are wired together', () => {
  const doc = readFileSync('docs/product/skipship-shipping-stripe-strategy.md', 'utf8');
  const sdkReadme = readFileSync('sdk/skipship-js/README.md', 'utf8');
  const openapi = readFileSync('docs/specs/delivery-gateway-carrier-api.openapi.yaml', 'utf8');
  const api = readFileSync('src/lib/deliveryGatewayCarrierApi.ts', 'utf8');

  assert.match(doc, /ship without exchanging raw addresses by default/);
  assert.match(doc, /ShipmentIntent/);
  assert.match(doc, /Carrier Connect/);
  assert.match(doc, /AddressQL Layer/);
  assert.match(doc, /Recipient ID, wallet friendship, or checkout login is not proof of residence/);
  assert.match(doc, /Webhook event idempotency/);
  assert.match(doc, /Playlist Commerce/);
  assert.match(doc, /EC Social Login/);
  assert.match(doc, /Continue with Veygrit/);
  assert.match(doc, /which EC to use/i);
  assert.match(doc, /how to buy at that EC/i);
  assert.match(doc, /dead-letter queue/);
  assert.match(sdkReadme, /createShipment/);
  assert.match(openapi, /createSkipshipShipment/);
  assert.match(api, /shipping\.createShipment/);
  assert.match(api, /rawAddress/);
});
