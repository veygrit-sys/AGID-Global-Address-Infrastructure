import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createShipmentIntentSandbox } from './addressStripeFoundation';
import {
  ADDRESS_WALLET_RECIPIENT_ID_VERSION,
  buildAddressWalletRecipientIdSpec,
  createAddressWalletRecipientSandbox,
  validateAddressWalletRecipientIdSpec,
  validateAddressWalletRecipientSandboxBody,
} from './addressWalletRecipientId';

test('Address Wallet Recipient ID spec validates the first wallet recipient primitive', () => {
  const spec = buildAddressWalletRecipientIdSpec();

  assert.equal(spec.version, ADDRESS_WALLET_RECIPIENT_ID_VERSION);
  assert.deepEqual(validateAddressWalletRecipientIdSpec(spec), []);
  assert.equal(spec.productName, 'Address Wallet Recipient ID');
  assert.ok(spec.lifecycle.includes('requires_consent'));
  assert.ok(spec.lifecycle.includes('active'));
  assert.ok(spec.lifecycle.includes('revoked'));
});

test('recipient ID contract bridges wallet recipients to ShipmentIntent, Hexaship, and carrier handoff', () => {
  const spec = buildAddressWalletRecipientIdSpec();
  const bridgeTargets = new Set(spec.bridges.map(bridge => bridge.target));

  assert.ok(bridgeTargets.has('Address Stripe ShipmentIntent'));
  assert.ok(bridgeTargets.has('Hexaship SDK'));
  assert.ok(bridgeTargets.has('Delivery Gateway Carrier Handoff'));
  assert.match(spec.bridges.map(bridge => bridge.mapping).join('\n'), /recipientTokenRef = AddressWalletRecipient\.recipient_id/);
  assert.match(spec.bridges.map(bridge => bridge.boundary).join('\n'), /DHL\/UPS connectors are server-side adapters/i);
});

test('sandbox creates deterministic ref-only friend recipient IDs', () => {
  const first = createAddressWalletRecipientSandbox({
    walletSubjectAlias: 'pairwise_sub_synthetic_buyer_001',
    relationshipRef: 'friend_alias_synthetic_001',
    deliveryPurpose: 'friend_delivery',
    recipientKind: 'friend',
    consentPolicyRef: 'wallet_consent_policy_synthetic_gift_001',
    expiresAt: '2026-12-31T00:00:00.000Z',
  });
  const second = createAddressWalletRecipientSandbox({
    walletSubjectAlias: 'pairwise_sub_synthetic_buyer_001',
    relationshipRef: 'friend_alias_synthetic_001',
    deliveryPurpose: 'friend_delivery',
    recipientKind: 'friend',
    consentPolicyRef: 'wallet_consent_policy_synthetic_gift_001',
    expiresAt: '2026-12-31T00:00:00.000Z',
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) throw new Error('recipient sandbox should succeed');

  assert.deepEqual(validateAddressWalletRecipientSandboxBody(first.body), []);
  assert.equal(first.body.recipient_id, second.body.recipient_id);
  assert.match(first.body.recipient_id, /^aw_rec_friend_[0-9a-f]{8}$/);
  assert.equal(first.body.status, 'active');
  assert.equal(first.body.required_next_action, 'create_shipment_intent');
  assert.equal(first.body.shipment_intent_bridge.recipientTokenRef, first.body.recipient_id);
  assert.equal(first.body.privacy.contains_raw_address, false);
  assert.doesNotMatch(JSON.stringify(first.body), /rawAddressValue|recipientPhoneValue|proofWitnessValue|carrierSecretValue/);
});

test('sandbox keeps consent pending when no consent policy ref is present', () => {
  const response = createAddressWalletRecipientSandbox({
    walletSubjectAlias: 'pairwise_sub_synthetic_buyer_002',
    relationshipRef: 'friend_alias_synthetic_002',
    deliveryPurpose: 'friend_delivery',
    recipientKind: 'friend',
  });

  assert.equal(response.ok, true);
  if (!response.ok) throw new Error('recipient sandbox should succeed');

  assert.equal(response.body.status, 'requires_consent');
  assert.equal(response.body.required_next_action, 'request_recipient_consent');
  assert.equal(response.body.consent_policy_ref, 'consent_required');
});

test('sandbox rejects raw address, proof, and carrier private material recursively', () => {
  const response = createAddressWalletRecipientSandbox({
    walletSubjectAlias: 'pairwise_sub_synthetic_buyer_003',
    relationshipRef: 'friend_alias_synthetic_003',
    deliveryPurpose: 'friend_delivery',
    recipientKind: 'friend',
    metadata: {
      rawAddress: 'blocked synthetic address value',
      nested: {
        proofWitness: 'blocked synthetic witness value',
        carrierApiKey: 'blocked synthetic carrier key',
      },
    },
  });

  assert.equal(response.ok, false);
  if (response.ok) throw new Error('private material should be rejected');

  assert.equal(response.error, 'private_material_rejected');
  assert.deepEqual(response.rejectedKeys?.sort(), ['carrierApiKey', 'proofWitness', 'rawAddress']);
});

test('recipient ID can be used as the ShipmentIntent recipientTokenRef', () => {
  const recipient = createAddressWalletRecipientSandbox({
    walletSubjectAlias: 'pairwise_sub_synthetic_buyer_004',
    relationshipRef: 'friend_alias_synthetic_004',
    deliveryPurpose: 'friend_delivery',
    recipientKind: 'friend',
    consentPolicyRef: 'wallet_consent_policy_synthetic_gift_004',
  });

  assert.equal(recipient.ok, true);
  if (!recipient.ok) throw new Error('recipient sandbox should succeed');

  const intent = createShipmentIntentSandbox({
    merchantRef: 'merchant_ref_synthetic_ec_001',
    recipientTokenRef: recipient.body.shipment_intent_bridge.recipientTokenRef,
    parcelProfileRef: 'parcel_profile_ref_synthetic_small_box_001',
    addressValidationRef: 'address_validation_ref_synthetic_jp_001',
    walletConsentRef: recipient.body.consent_policy_ref,
    servicePreference: 'fastest',
  });

  assert.equal(intent.ok, true);
  if (!intent.ok) throw new Error('shipment intent sandbox should succeed');

  assert.equal(intent.body.recipient_token_ref, recipient.body.recipient_id);
  assert.equal(intent.body.status, 'ready_for_rate_quote');
  assert.equal(intent.body.privacy.contains_raw_address, false);
  assert.equal(intent.body.privacy.carrier_credentials_present, false);
});

test('Address Wallet Recipient ID is documented and has a package verification gate', () => {
  const doc = readFileSync('docs/product/address-wallet-recipient-id.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /Address Wallet Recipient ID/);
  assert.match(doc, /住所ではなく/);
  assert.match(doc, /recipientTokenRef/);
  assert.match(doc, /DHL\/UPS/);
  assert.match(doc, /rawAddress/);
  assert.match(doc, /proofWitness/);
  assert.doesNotMatch(doc, /sk_live|proofSecretValue|privateKeyValue/);
  assert.equal(packageJson.scripts?.['verify:address-wallet-recipient-id'], 'tsx --test src/lib/addressWalletRecipientId.test.ts');
});
