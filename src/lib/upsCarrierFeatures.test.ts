import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  UPS_CARRIER_FEATURES_VERSION,
  buildUpsFeaturePlan,
  createUpsLabel,
  createUpsReturn,
  createUpsShipment,
  getUpsRates,
  runUpsSandboxFeatureFlow,
  trackUpsShipment,
  validateUpsAddress,
  validateUpsFeaturePlan,
} from './upsCarrierFeatures';

const baseInput = {
  countryCode: 'US',
  recipientId: 'ship_recipient_synthetic_ups_001',
  parcelProfileRef: 'parcel_profile_synthetic_small_box_ups_001',
  walletConsentRef: 'wallet_consent_synthetic_ups_001',
  carrierCapabilityRef: 'carrier_capability_ups_us_sandbox_001',
  servicePreference: 'cheapest',
} as const;

test('UPS feature plan validates OAuth boundary and supported functions', () => {
  const plan = buildUpsFeaturePlan();

  assert.equal(plan.version, UPS_CARRIER_FEATURES_VERSION);
  assert.equal(plan.carrier, 'ups');
  assert.equal(plan.authBoundary, 'server-side-oauth-client-credentials');
  assert.deepEqual(validateUpsFeaturePlan(plan), []);
  assert.deepEqual(plan.supportedFeatures, [
    'addressValidation',
    'getRates',
    'createShipment',
    'createLabel',
    'trackShipment',
    'createReturn',
  ]);
  assert.ok(plan.requiredServerEnvKeys.includes('HEXASHIP_UPS_CLIENT_ID'));
  assert.ok(plan.requiredServerEnvKeys.includes('HEXASHIP_UPS_CLIENT_SECRET'));
  assert.equal(plan.productionTraffic, false);
});

test('UPS address validation and rating return safe refs only', () => {
  const validation = validateUpsAddress(baseInput);
  assert.equal(validation.ok, true);
  if (!validation.ok) throw new Error('UPS address validation should succeed');

  const rates = getUpsRates(baseInput);
  assert.equal(rates.ok, true);
  if (!rates.ok) throw new Error('UPS rates should succeed');

  assert.equal(validation.feature, 'addressValidation');
  assert.equal(validation.operation, 'ups.addressvalidation.validate');
  assert.equal(validation.body.validationScope, 'street_level');
  assert.match(validation.body.addressValidationRef, /^ups_addr_validation_/);
  assert.equal(rates.feature, 'getRates');
  assert.equal(rates.operation, 'ups.rating.rate');
  assert.equal(rates.body.serviceLevel, 'ground');
  assert.match(rates.body.rateRef, /^ups_rate_/);
  assert.equal(rates.body.productionTraffic, false);
  assert.doesNotMatch(JSON.stringify([validation.body, rates.body]), /rawAddressValue|recipientNameValue|carrierApiKeyValue|clientSecretValue|accessTokenValue/);
});

test('UPS shipment, label, tracking, and return map to normalized operations', () => {
  const rates = getUpsRates(baseInput);
  assert.equal(rates.ok, true);
  if (!rates.ok) throw new Error('UPS rates should succeed');

  const shipment = createUpsShipment({ ...baseInput, rateRef: rates.body.rateRef });
  assert.equal(shipment.ok, true);
  if (!shipment.ok) throw new Error('UPS shipment should succeed');

  const label = createUpsLabel({ ...baseInput, shipmentRef: shipment.body.shipmentRef, labelFormat: 'pdf' });
  assert.equal(label.ok, true);
  if (!label.ok) throw new Error('UPS label should succeed');

  const tracking = trackUpsShipment({ ...baseInput, trackingAlias: label.body.trackingAlias });
  assert.equal(tracking.ok, true);
  if (!tracking.ok) throw new Error('UPS tracking should succeed');

  const returnAuth = createUpsReturn({
    ...baseInput,
    shipmentRef: shipment.body.shipmentRef,
    reasonCode: 'customer_return',
  });
  assert.equal(returnAuth.ok, true);
  if (!returnAuth.ok) throw new Error('UPS return should succeed');

  assert.equal(shipment.operation, 'ups.shipping.shipment');
  assert.equal(label.operation, 'ups.shipping.labelImage');
  assert.equal(label.body.labelArtifact, 'labelImageRef');
  assert.equal(label.body.labelFormat, 'pdf');
  assert.equal(tracking.operation, 'ups.tracking.track');
  assert.equal(tracking.body.status, 'in_transit');
  assert.equal(returnAuth.operation, 'ups.returns.shipment');
  assert.match(returnAuth.body.returnTrackingAlias, /^ups_return_track_/);
});

test('UPS full sandbox feature flow covers all MVP functions without production traffic', () => {
  const flow = runUpsSandboxFeatureFlow(baseInput);

  assert.equal(flow.ok, true);
  if (!flow.ok) throw new Error('UPS full feature flow should succeed');
  assert.equal(flow.operation, 'ups.sandbox.fullFeatureFlow');
  assert.deepEqual(flow.body.completedFeatures, [
    'addressValidation',
    'getRates',
    'createShipment',
    'createLabel',
    'trackShipment',
    'createReturn',
  ]);
  assert.equal(flow.body.localOnly, true);
  assert.equal(flow.body.productionTraffic, false);
  assert.equal(flow.body.rawAddressStored, false);
  assert.equal(flow.body.rawCarrierPayloadStored, false);
});

test('UPS feature adapter rejects raw address and credential material recursively', () => {
  const rejected = getUpsRates({
    ...baseInput,
    nested: {
      rawAddress: 'blocked synthetic address',
      clientSecret: 'blocked synthetic client secret',
      accessToken: 'blocked synthetic token',
    },
  });

  assert.equal(rejected.ok, false);
  if (rejected.ok) throw new Error('unsafe UPS input should fail');
  assert.equal(rejected.error, 'private_material_rejected');
  assert.deepEqual(rejected.rejectedKeys?.sort(), [
    'nested.accessToken',
    'nested.clientSecret',
    'nested.rawAddress',
  ]);
});

test('UPS feature adapter reports missing safe refs', () => {
  const missing = createUpsShipment({
    countryCode: 'US',
    recipientId: 'ship_recipient_synthetic_ups_002',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_ups_002',
  });

  assert.equal(missing.ok, false);
  if (missing.ok) throw new Error('missing refs should fail');
  assert.equal(missing.error, 'bad_request');
  assert.deepEqual(missing.missingKeys, ['walletConsentRef', 'rateRef']);
});

test('UPS feature docs and package verification gate are present', () => {
  const doc = readFileSync('docs/product/ups-carrier-features.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /UPS Carrier Features/);
  assert.match(doc, /addressValidation/);
  assert.match(doc, /getRates/);
  assert.match(doc, /createShipment/);
  assert.match(doc, /createLabel/);
  assert.match(doc, /trackShipment/);
  assert.match(doc, /createReturn/);
  assert.match(doc, /Server-side OAuth/i);
  assert.match(doc, /rawAddress/);
  assert.match(doc, /productionTraffic`:\s*`false/);
  assert.doesNotMatch(doc, /sk_live|clientSecretValue|accessTokenValue|rawAddressValue|privateKeyValue/);
  assert.equal(packageJson.scripts?.['verify:ups-carrier-features'], 'tsx --test src/lib/upsCarrierFeatures.test.ts');
});
