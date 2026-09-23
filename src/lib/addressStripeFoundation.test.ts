import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESS_STRIPE_FOUNDATION_VERSION,
  ADDRESS_STRIPE_BUILD_GATES,
  ADDRESS_STRIPE_PRIMITIVES,
  buildAddressStripeFoundationPlan,
  validateAddressStripeFoundationPlan,
} from './addressStripeFoundation';

test('Address Stripe foundation plan validates the first production preparation surface', () => {
  const plan = buildAddressStripeFoundationPlan();

  assert.equal(plan.version, ADDRESS_STRIPE_FOUNDATION_VERSION);
  assert.deepEqual(validateAddressStripeFoundationPlan(plan), []);
  assert.ok(plan.thesis.includes('ref-first'));
  assert.ok(plan.firstProductionBacklog.length >= 5);
});

test('Address Stripe primitives cover login, wallet recipient, shipment, carrier, webhook, and evidence flows', () => {
  const primitiveIds = new Set(ADDRESS_STRIPE_PRIMITIVES.map(primitive => primitive.id));
  const ownerLayers = new Set(ADDRESS_STRIPE_PRIMITIVES.map(primitive => primitive.ownerLayer));

  for (const required of [
    'address-login-session',
    'recipient-token',
    'address-validation-ref',
    'shipment-intent',
    'rate-quote',
    'carrier-allocation',
    'carrier-handoff',
    'delivery-webhook',
    'evidence-receipt',
  ]) {
    assert.ok(primitiveIds.has(required as never), `${required} should be present`);
  }

  for (const requiredLayer of ['Address Login', 'Address Wallet', 'AddressQL', 'Delivery Gateway', 'Evidence Vault']) {
    assert.ok(ownerLayers.has(requiredLayer as never), `${requiredLayer} should own at least one primitive`);
  }
});

test('Address Stripe blocks private material before public SDK work starts', () => {
  const blockedMaterial = new Set(ADDRESS_STRIPE_PRIMITIVES.flatMap(primitive => primitive.blockedMaterial));

  for (const key of ['rawAddress', 'recipientPhone', 'carrierApiKey', 'carrierCredential', 'proofWitness', 'proofSecret']) {
    assert.ok(blockedMaterial.has(key), `${key} should be blocked by at least one primitive`);
  }

  for (const primitive of ADDRESS_STRIPE_PRIMITIVES) {
    assert.ok(primitive.safeOutputRefs.every(ref => /Ref|Alias|Warnings|Code|Codes|Action|Status|At$|Fingerprint/.test(ref)), `${primitive.id} should output refs or safe codes`);
    assert.ok(primitive.firstTestFixture.endsWith('.synthetic.json'), `${primitive.id} should start from a synthetic fixture`);
  }
});

test('Address Stripe build gates force wallet consent, server-side carrier credentials, and idempotent webhooks', () => {
  const gateIds = new Set(ADDRESS_STRIPE_BUILD_GATES.map(gate => gate.id));
  const gateText = ADDRESS_STRIPE_BUILD_GATES.map(gate => `${gate.rule} ${gate.verificationTarget}`).join('\n');

  assert.ok(gateIds.has('wallet-consent-required'));
  assert.ok(gateIds.has('carrier-credential-server-side'));
  assert.ok(gateIds.has('webhook-idempotency'));
  assert.match(gateText, /required_next_action/);
  assert.match(gateText, /carrierApiKey/);
  assert.match(gateText, /eventFingerprint/);
});

test('Address Stripe research note states boundaries and the next executable step', () => {
  const doc = readFileSync('docs/product/address-stripe-foundation.md', 'utf8');

  assert.match(doc, /Address Stripe Foundation/);
  assert.match(doc, /ShipmentIntent/);
  assert.match(doc, /RateQuote/);
  assert.match(doc, /CarrierAllocation/);
  assert.match(doc, /AddressQL validation is not wallet consent/);
  assert.match(doc, /Create JSON schemas/);
});
