import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  HEXASHIP_DELIVERY_GATEWAY_VERSION,
  buildHexashipDeliveryGatewayPlan,
  createLabel,
  createReturn,
  createShipment,
  getRates,
  preflightHexashipMvpV01Shipment,
  runHexashipMvpV01Sandbox,
  trackShipment,
  validateHexashipDeliveryGatewayPlan,
} from './hexashipDeliveryGateway';

test('Hexaship Delivery Gateway plan validates as a shipping Stripe common layer', () => {
  const plan = buildHexashipDeliveryGatewayPlan();

  assert.equal(plan.version, HEXASHIP_DELIVERY_GATEWAY_VERSION);
  assert.equal(plan.productName, 'Hexaship / Delivery Gateway');
  assert.deepEqual(validateHexashipDeliveryGatewayPlan(plan), []);
  assert.match(plan.thesis, /Stripe-like delivery gateway/);
  assert.equal(plan.safety.rawAddressAllowedInPublicApi, false);
  assert.equal(plan.safety.carrierCredentialsAllowedInClient, false);
});

test('plan exposes createShipment, getRates, createLabel, trackShipment, and createReturn for DHL and UPS', () => {
  const plan = buildHexashipDeliveryGatewayPlan();
  const methods = new Set(plan.methods.map(method => method.method));
  const carriers = new Map(plan.carrierAdapters.map(adapter => [adapter.carrier, adapter]));

  for (const method of ['createShipment', 'getRates', 'createLabel', 'trackShipment', 'createReturn']) {
    assert.ok(methods.has(method as never), `${method} should exist`);
  }

  for (const carrier of ['dhl', 'ups']) {
    const adapter = carriers.get(carrier as never);
    assert.ok(adapter, `${carrier} adapter should exist`);
    assert.equal(adapter?.serverSideOnly, true);
    assert.equal(adapter?.publicClientAllowed, false);
    assert.deepEqual(adapter?.supportedMethods, ['createShipment', 'getRates', 'createLabel', 'trackShipment', 'createReturn']);
  }
});

test('DHL sandbox flow runs through one common Hexaship API shape', () => {
  const shipment = createShipment({
    merchantRef: 'merchant_ref_synthetic_ec_001',
    recipientId: 'aw_rec_friend_synthetic_001',
    parcelProfileRef: 'parcel_profile_ref_synthetic_small_box_001',
    walletConsentRef: 'wallet_consent_ref_synthetic_001',
    carrierPreference: 'dhl',
    servicePreference: 'fastest',
  });
  assert.equal(shipment.ok, true);
  if (!shipment.ok) throw new Error('DHL shipment should be created');

  const rates = getRates({
    shipmentRef: shipment.body.shipmentRef,
    recipientId: shipment.body.recipientId,
    parcelProfileRef: shipment.body.parcelProfileRef,
    carrierCapabilityRef: 'carrier_capability_dhl_sandbox_001',
    carrierPreference: 'dhl',
    servicePreference: 'fastest',
  });
  assert.equal(rates.ok, true);
  if (!rates.ok) throw new Error('DHL rates should be created');

  const label = createLabel({
    shipmentRef: shipment.body.shipmentRef,
    rateRef: rates.body.rateRef,
    walletConsentRef: shipment.body.walletConsentRef,
    carrierPreference: 'dhl',
  });
  assert.equal(label.ok, true);
  if (!label.ok) throw new Error('DHL label should be created');

  const tracking = trackShipment({
    shipmentRef: shipment.body.shipmentRef,
    trackingAlias: label.body.trackingAlias,
    carrier: 'dhl',
  });
  assert.equal(tracking.ok, true);
  if (!tracking.ok) throw new Error('DHL tracking should be created');

  assert.equal(shipment.carrier, 'dhl');
  assert.equal(rates.carrier, 'dhl');
  assert.equal(label.carrier, 'dhl');
  assert.equal(tracking.carrier, 'dhl');
  assert.equal(label.body.status, 'label_created');
  assert.equal(tracking.body.status, 'in_transit');
});

test('UPS sandbox flow uses the same methods and can create returns', () => {
  const shipment = createShipment({
    merchantRef: 'merchant_ref_synthetic_ec_002',
    recipientId: 'aw_rec_self_synthetic_002',
    parcelProfileRef: 'parcel_profile_ref_synthetic_medium_box_002',
    walletConsentRef: 'wallet_consent_ref_synthetic_002',
    carrierPreference: 'ups',
    servicePreference: 'cheapest',
  });
  assert.equal(shipment.ok, true);
  if (!shipment.ok) throw new Error('UPS shipment should be created');

  const rates = getRates({
    shipmentRef: shipment.body.shipmentRef,
    recipientId: shipment.body.recipientId,
    parcelProfileRef: shipment.body.parcelProfileRef,
    carrierCapabilityRef: 'carrier_capability_ups_sandbox_002',
    carrierPreference: 'ups',
    servicePreference: 'cheapest',
  });
  assert.equal(rates.ok, true);
  if (!rates.ok) throw new Error('UPS rates should be created');

  const label = createLabel({
    shipmentRef: shipment.body.shipmentRef,
    rateRef: rates.body.rateRef,
    walletConsentRef: shipment.body.walletConsentRef,
    carrierPreference: 'ups',
    labelFormat: 'pdf',
  });
  assert.equal(label.ok, true);
  if (!label.ok) throw new Error('UPS label should be created');

  const returnAuth = createReturn({
    shipmentRef: shipment.body.shipmentRef,
    reasonCode: 'customer_return',
    walletConsentRef: shipment.body.walletConsentRef,
    carrierPreference: 'ups',
  });
  assert.equal(returnAuth.ok, true);
  if (!returnAuth.ok) throw new Error('UPS return should be created');

  assert.equal(shipment.carrier, 'ups');
  assert.equal(rates.body.serviceLevel, 'economy');
  assert.equal(label.carrier, 'ups');
  assert.equal(returnAuth.carrier, 'ups');
  assert.equal(returnAuth.body.status, 'return_created');
});

test('MVP v0.1 orchestrates EC request, Address Wallet recipient resolution, DHL/UPS candidates, fastest selection, label, tracking, and webhooks', () => {
  const result = runHexashipMvpV01Sandbox({
    merchantRef: 'merchant_ref_synthetic_ec_mvp_001',
    ecOrderRef: 'ec_order_ref_mvp_001',
    recipientId: 'aw_rec_friend_synthetic_001',
    parcelProfileRef: 'parcel_profile_ref_synthetic_small_box_001',
    walletConsentRef: 'wallet_consent_ref_synthetic_001',
    carrierCapabilityRef: 'carrier_capability_dhl_ups_mvp_001',
    selectionMode: 'fastest',
    selectedBy: 'user',
    requestedAt: '2026-07-04T10:00:00.000Z',
  });

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('MVP flow should succeed');
  assert.equal(result.flow, 'hexaship-mvp-v0.1');
  assert.equal(result.recipientResolution.recipientId, 'aw_rec_friend_synthetic_001');
  assert.equal(result.recipientResolution.containsRawAddress, false);
  assert.equal(result.capability.carrierCapabilityRef, 'carrier_capability_dhl_ups_mvp_001');
  assert.equal(result.capability.requiredNextAction, 'getRates');
  assert.equal(result.candidates.length, 2);
  assert.deepEqual(new Set(result.candidates.map(candidate => candidate.carrier)), new Set(['dhl', 'ups']));
  assert.equal(result.selection.selectionMode, 'fastest');
  assert.equal(result.selection.selectedCarrier, 'dhl');
  assert.equal(result.label.status, 'label_created');
  assert.match(result.label.trackingAlias, /^hx_track_/);
  assert.equal(result.tracking.status, 'in_transit');
  assert.equal(result.webhookLedger.map(entry => entry.eventType).join(','), 'shipment.created,rates.created,carrier.selected,label.created,shipment.in_transit');
  assert.equal(result.webhookLedger.every(entry => entry.rawPayloadStored === false), true);
  assert.equal(result.privacy.rawAddressStored, false);
  assert.equal(result.privacy.carrierCredentialsAcceptedFromClient, false);
});

test('MVP v0.1 cheapest selection can be made by EC and chooses the lower sandbox rate', () => {
  const result = runHexashipMvpV01Sandbox({
    merchantRef: 'merchant_ref_synthetic_ec_mvp_002',
    ecOrderRef: 'ec_order_ref_mvp_002',
    recipientId: 'aw_rec_self_synthetic_002',
    parcelProfileRef: 'parcel_profile_ref_synthetic_medium_box_002',
    walletConsentRef: 'wallet_consent_ref_synthetic_002',
    carrierCapabilityRef: 'carrier_capability_dhl_ups_mvp_002',
    selectionMode: 'cheapest',
    selectedBy: 'ec',
  });

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('MVP cheapest flow should succeed');
  const selected = result.candidates.find(candidate => candidate.rateRef === result.selection.selectedRateRef);
  assert.ok(selected);
  assert.equal(result.selection.selectedBy, 'ec');
  assert.equal(result.selection.selectedCarrier, 'ups');
  assert.equal(selected?.priceMinor, Math.min(...result.candidates.map(candidate => candidate.priceMinor)));
});

test('gateway rejects raw address, proof, label, and carrier credential material recursively', () => {
  const rejected = createShipment({
    merchantRef: 'merchant_ref_synthetic_ec_003',
    recipientId: 'aw_rec_friend_synthetic_003',
    parcelProfileRef: 'parcel_profile_ref_synthetic_small_box_003',
    walletConsentRef: 'wallet_consent_ref_synthetic_003',
    carrierPreference: 'dhl',
    nested: {
      rawAddress: 'blocked synthetic address',
      proofWitness: 'blocked synthetic witness',
      carrierApiKey: 'blocked synthetic carrier key',
    },
  });

  assert.equal(rejected.ok, false);
  if (rejected.ok) throw new Error('private material should be rejected');
  assert.equal(rejected.error, 'private_material_rejected');
  assert.deepEqual(rejected.rejectedKeys?.sort(), ['carrierApiKey', 'proofWitness', 'rawAddress']);
});

test('MVP v0.1 rejects raw address material before resolving Address Wallet recipient IDs', () => {
  const rejected = runHexashipMvpV01Sandbox({
    merchantRef: 'merchant_ref_synthetic_ec_mvp_003',
    ecOrderRef: 'ec_order_ref_mvp_003',
    recipientId: 'aw_rec_friend_synthetic_003',
    parcelProfileRef: 'parcel_profile_ref_synthetic_small_box_003',
    walletConsentRef: 'wallet_consent_ref_synthetic_003',
    carrierCapabilityRef: 'carrier_capability_dhl_ups_mvp_003',
    selectionMode: 'fastest',
    rawAddress: 'blocked synthetic address',
  });

  assert.equal(rejected.ok, false);
  if (rejected.ok) throw new Error('private material should be rejected');
  assert.equal(rejected.error, 'private_material_rejected');
  assert.deepEqual(rejected.rejectedKeys, ['rawAddress']);
});

test('MVP v0.1 requires carrierCapabilityRef before creating DHL/UPS rate candidates', () => {
  const preflight = preflightHexashipMvpV01Shipment({
    merchantRef: 'merchant_ref_synthetic_ec_mvp_004',
    ecOrderRef: 'ec_order_ref_mvp_004',
    recipientId: 'aw_rec_friend_synthetic_004',
    parcelProfileRef: 'parcel_profile_ref_synthetic_small_box_004',
    walletConsentRef: 'wallet_consent_ref_synthetic_004',
    selectionMode: 'fastest',
  });
  const rejected = runHexashipMvpV01Sandbox({
    merchantRef: 'merchant_ref_synthetic_ec_mvp_004',
    ecOrderRef: 'ec_order_ref_mvp_004',
    recipientId: 'aw_rec_friend_synthetic_004',
    parcelProfileRef: 'parcel_profile_ref_synthetic_small_box_004',
    walletConsentRef: 'wallet_consent_ref_synthetic_004',
    selectionMode: 'fastest',
  });

  assert.equal(preflight.ok, false);
  assert.equal(preflight.requiredNextAction, 'run_carrier_capability_preflight');
  assert.deepEqual(preflight.missingCarrierRefs, ['carrierCapabilityRef']);
  assert.deepEqual(preflight.missingAddressWalletRefs, []);
  assert.equal(preflight.safety.productionTraffic, false);
  assert.equal(preflight.safety.privateMaterialExposed, false);
  assert.equal(rejected.ok, false);
  if (rejected.ok) throw new Error('missing carrier capability should be rejected');
  assert.equal(rejected.error, 'bad_request');
  assert.deepEqual(rejected.missingKeys, ['carrierCapabilityRef']);
});

test('MVP v0.1 preflight returns actionable Address Wallet and privacy repair steps', () => {
  const missingWallet = preflightHexashipMvpV01Shipment({
    merchantRef: 'merchant_ref_synthetic_ec_mvp_005',
    ecOrderRef: 'ec_order_ref_mvp_005',
    carrierCapabilityRef: 'carrier_capability_dhl_ups_mvp_005',
  });
  const unsafe = preflightHexashipMvpV01Shipment({
    merchantRef: 'merchant_ref_synthetic_ec_mvp_006',
    ecOrderRef: 'ec_order_ref_mvp_006',
    recipientId: 'aw_rec_friend_synthetic_006',
    parcelProfileRef: 'parcel_profile_ref_synthetic_small_box_006',
    walletConsentRef: 'wallet_consent_ref_synthetic_006',
    carrierCapabilityRef: 'carrier_capability_dhl_ups_mvp_006',
    nested: { rawAddress: 'blocked synthetic address', carrierApiKey: 'blocked synthetic key' },
  });
  const ready = preflightHexashipMvpV01Shipment({
    merchantRef: 'merchant_ref_synthetic_ec_mvp_007',
    ecOrderRef: 'ec_order_ref_mvp_007',
    recipientId: 'aw_rec_friend_synthetic_007',
    addressFormVersion: 'wallet_country_form_ref_synthetic_007',
    parcelProfileRef: 'parcel_profile_ref_synthetic_small_box_007',
    walletConsentRef: 'wallet_consent_ref_synthetic_007',
    carrierCapabilityRef: 'carrier_capability_dhl_ups_mvp_007',
  });

  assert.equal(missingWallet.requiredNextAction, 'run_address_wallet_preflight');
  assert.deepEqual(missingWallet.missingAddressWalletRefs, ['recipientId', 'parcelProfileRef', 'walletConsentRef']);
  assert.equal(unsafe.requiredNextAction, 'remove_private_material');
  assert.deepEqual(unsafe.rejectedKeys.sort(), ['carrierApiKey', 'rawAddress']);
  assert.equal(ready.ok, true);
  assert.equal(ready.requiredNextAction, 'call_hexaship_createShipment');
  assert.equal(ready.safeInputRefs.recipientId, 'aw_rec_friend_synthetic_007');
  assert.equal(ready.safeInputRefs.addressFormVersion, 'wallet_country_form_ref_synthetic_007');

  for (const preflight of [missingWallet, unsafe, ready]) {
    assert.equal(preflight.safety.localOnly, true);
    assert.equal(preflight.safety.rawAddressStored, false);
    assert.equal(preflight.safety.carrierCredentialsAcceptedFromClient, false);
    assert.doesNotMatch(JSON.stringify(preflight.safeInputRefs), /rawAddress|carrierApiKey|proofSecret|privateKey/);
  }
});

test('MVP v0.1 fixture carries Address Wallet country-form refs without raw address material', () => {
  const fixture = JSON.parse(readFileSync('docs/specs/fixtures/hexaship-mvp-v0.1-shipment.json', 'utf8')) as {
    request: Record<string, unknown>;
    expected: {
      requiredBeforeRates: string[];
      privacy: Record<string, boolean>;
      productionTraffic: boolean;
      nonClaims: string[];
    };
  };

  const preflight = preflightHexashipMvpV01Shipment(fixture.request);
  const result = runHexashipMvpV01Sandbox(fixture.request);

  assert.equal(preflight.ok, true);
  assert.equal(preflight.safeInputRefs.addressFormVersion, 'wallet_country_form_ref_synthetic_001');
  assert.ok(fixture.expected.requiredBeforeRates.includes('addressFormVersion'));
  assert.equal(fixture.expected.privacy.rawAddressStored, false);
  assert.equal(fixture.expected.productionTraffic, false);
  assert.ok(fixture.expected.nonClaims.includes('not-raw-address-disclosure'));
  assert.doesNotMatch(JSON.stringify(fixture.request), /rawAddress|recipientPhone|carrierApiKey|proofWitness|privateKey|proofSecret/);
  assert.doesNotMatch(JSON.stringify(preflight.safeInputRefs), /rawAddress|recipientPhone|carrierApiKey|proofWitness|privateKey|proofSecret/);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('MVP fixture should run locally');
  assert.equal(result.productionTraffic, false);
  assert.equal(result.privacy.rawAddressStored, false);
});

test('gateway docs include the MVP v0.1 orchestration path', () => {
  const doc = readFileSync('docs/product/hexaship-delivery-gateway.md', 'utf8');

  assert.match(doc, /MVP v0\.1/);
  assert.match(doc, /Address Wallet/);
  assert.match(doc, /DHL\/UPS/);
  assert.match(doc, /最速/);
  assert.match(doc, /最安/);
  assert.match(doc, /Webhook/);
  assert.match(doc, /addressFormVersion/);
  assert.match(doc, /wallet_country_form_ref/);
  assert.match(doc, /familiar country forms/);
  assert.match(doc, /DHL\/UPS label payload shapes server-side only/);
  assert.match(doc, /carrier-specific address shapes/);
  assert.match(doc, /carrierCapabilityRef/);
  assert.match(doc, /run_address_wallet_preflight/);
  assert.match(doc, /run_carrier_capability_preflight/);
  assert.match(doc, /call_hexaship_createShipment/);
});

test('gateway docs and package verification gate are present', () => {
  const doc = readFileSync('docs/product/hexaship-delivery-gateway.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /Hexaship \/ Delivery Gateway/);
  assert.match(doc, /配送版Stripe/);
  assert.match(doc, /createShipment/);
  assert.match(doc, /getRates/);
  assert.match(doc, /createLabel/);
  assert.match(doc, /trackShipment/);
  assert.match(doc, /createReturn/);
  assert.match(doc, /DHL/);
  assert.match(doc, /UPS/);
  assert.match(doc, /rawAddress/);
  assert.match(doc, /carrierApiKey/);
  assert.doesNotMatch(doc, /sk_live|proofSecretValue|privateKeyValue/);
  assert.equal(packageJson.scripts?.['verify:hexaship-delivery-gateway'], 'tsx --test src/lib/hexashipDeliveryGateway.test.ts');
});
