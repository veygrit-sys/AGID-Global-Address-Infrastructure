import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  DHL_CARRIER_FEATURES_VERSION,
  buildDhlFeaturePlan,
  checkDhlServiceAvailability,
  createDhlLabel,
  createDhlReturn,
  createDhlShipment,
  getDhlRates,
  requestDhlPickup,
  runDhlSandboxFeatureFlow,
  trackDhlShipment,
  validateDhlFeaturePlan,
} from './dhlCarrierFeatures';

const baseInput = {
  countryCode: 'JP',
  recipientId: 'ship_recipient_synthetic_dhl_001',
  parcelProfileRef: 'parcel_profile_synthetic_small_box_dhl_001',
  walletConsentRef: 'wallet_consent_synthetic_dhl_001',
  carrierCapabilityRef: 'carrier_capability_dhl_jp_sandbox_001',
  pickupWindowRef: 'pickup_window_synthetic_dhl_next_day',
  servicePreference: 'fastest',
} as const;

test('DHL feature plan validates BasicAuth account boundary and supported functions', () => {
  const plan = buildDhlFeaturePlan();

  assert.equal(plan.version, DHL_CARRIER_FEATURES_VERSION);
  assert.equal(plan.carrier, 'dhl');
  assert.equal(plan.authBoundary, 'server-side-basic-auth-account');
  assert.deepEqual(validateDhlFeaturePlan(plan), []);
  assert.deepEqual(plan.supportedFeatures, [
    'serviceAvailability',
    'getRates',
    'createShipment',
    'createLabel',
    'trackShipment',
    'createReturn',
    'pickupRequest',
  ]);
  assert.ok(plan.requiredServerEnvKeys.includes('HEXASHIP_DHL_MYDHL_USERNAME'));
  assert.ok(plan.requiredServerEnvKeys.includes('HEXASHIP_DHL_MYDHL_PASSWORD'));
  assert.equal(plan.productionTraffic, false);
});

test('DHL service availability and rating return safe refs only', () => {
  const availability = checkDhlServiceAvailability(baseInput);
  assert.equal(availability.ok, true);
  if (!availability.ok) throw new Error('DHL service availability should succeed');

  const rates = getDhlRates(baseInput);
  assert.equal(rates.ok, true);
  if (!rates.ok) throw new Error('DHL rates should succeed');

  assert.equal(availability.feature, 'serviceAvailability');
  assert.equal(availability.operation, 'mydhl.service.availability');
  assert.equal(availability.body.availableServiceLevel, 'express_worldwide');
  assert.match(availability.body.serviceAvailabilityRef, /^dhl_service_availability_/);
  assert.equal(rates.feature, 'getRates');
  assert.equal(rates.operation, 'mydhl.rates');
  assert.equal(rates.body.serviceLevel, 'express_worldwide');
  assert.match(rates.body.rateRef, /^dhl_rate_/);
  assert.equal(rates.body.productionTraffic, false);
  assert.doesNotMatch(JSON.stringify([availability.body, rates.body]), /rawAddressValue|recipientNameValue|carrierApiKeyValue|myDhlPasswordValue|basicAuthHeaderValue/);
});

test('DHL shipment, label, tracking, return, and pickup map to normalized operations', () => {
  const rates = getDhlRates(baseInput);
  assert.equal(rates.ok, true);
  if (!rates.ok) throw new Error('DHL rates should succeed');

  const shipment = createDhlShipment({ ...baseInput, rateRef: rates.body.rateRef });
  assert.equal(shipment.ok, true);
  if (!shipment.ok) throw new Error('DHL shipment should succeed');

  const label = createDhlLabel({ ...baseInput, shipmentRef: shipment.body.shipmentRef, labelFormat: 'pdf' });
  assert.equal(label.ok, true);
  if (!label.ok) throw new Error('DHL label should succeed');

  const tracking = trackDhlShipment({ ...baseInput, trackingAlias: label.body.trackingAlias });
  assert.equal(tracking.ok, true);
  if (!tracking.ok) throw new Error('DHL tracking should succeed');

  const returnAuth = createDhlReturn({
    ...baseInput,
    shipmentRef: shipment.body.shipmentRef,
    reasonCode: 'customer_return',
  });
  assert.equal(returnAuth.ok, true);
  if (!returnAuth.ok) throw new Error('DHL return should succeed');

  const pickup = requestDhlPickup({
    ...baseInput,
    shipmentRef: shipment.body.shipmentRef,
  });
  assert.equal(pickup.ok, true);
  if (!pickup.ok) throw new Error('DHL pickup should succeed');

  assert.equal(shipment.operation, 'mydhl.shipments.create');
  assert.equal(label.operation, 'mydhl.shipments.documents');
  assert.equal(label.body.labelArtifact, 'documentsRef');
  assert.equal(label.body.labelFormat, 'pdf');
  assert.equal(tracking.operation, 'mydhl.tracking.get');
  assert.equal(tracking.body.status, 'in_transit');
  assert.equal(returnAuth.operation, 'mydhl.returns.create-or-label');
  assert.equal(pickup.operation, 'mydhl.pickups.create');
  assert.match(pickup.body.pickupRef, /^dhl_pickup_/);
});

test('DHL full sandbox feature flow covers all MVP functions without production traffic', () => {
  const flow = runDhlSandboxFeatureFlow(baseInput);

  assert.equal(flow.ok, true);
  if (!flow.ok) throw new Error('DHL full feature flow should succeed');
  assert.equal(flow.operation, 'dhl.sandbox.fullFeatureFlow');
  assert.deepEqual(flow.body.completedFeatures, [
    'serviceAvailability',
    'getRates',
    'createShipment',
    'createLabel',
    'trackShipment',
    'createReturn',
    'pickupRequest',
  ]);
  assert.equal(flow.body.localOnly, true);
  assert.equal(flow.body.productionTraffic, false);
  assert.equal(flow.body.rawAddressStored, false);
  assert.equal(flow.body.rawCarrierPayloadStored, false);
});

test('DHL feature adapter rejects raw address and BasicAuth material recursively', () => {
  const rejected = getDhlRates({
    ...baseInput,
    nested: {
      rawAddress: 'blocked synthetic address',
      myDhlPassword: 'blocked synthetic password',
      basicAuthHeader: 'blocked synthetic auth header',
    },
  });

  assert.equal(rejected.ok, false);
  if (rejected.ok) throw new Error('unsafe DHL input should fail');
  assert.equal(rejected.error, 'private_material_rejected');
  assert.deepEqual(rejected.rejectedKeys?.sort(), [
    'nested.basicAuthHeader',
    'nested.myDhlPassword',
    'nested.rawAddress',
  ]);
});

test('DHL feature adapter reports missing safe refs', () => {
  const missing = createDhlShipment({
    countryCode: 'JP',
    recipientId: 'ship_recipient_synthetic_dhl_002',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_dhl_002',
  });

  assert.equal(missing.ok, false);
  if (missing.ok) throw new Error('missing refs should fail');
  assert.equal(missing.error, 'bad_request');
  assert.deepEqual(missing.missingKeys, ['walletConsentRef', 'rateRef']);
});

test('DHL feature docs and package verification gate are present', () => {
  const doc = readFileSync('docs/product/dhl-carrier-features.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /DHL Carrier Features/);
  assert.match(doc, /serviceAvailability/);
  assert.match(doc, /getRates/);
  assert.match(doc, /createShipment/);
  assert.match(doc, /createLabel/);
  assert.match(doc, /trackShipment/);
  assert.match(doc, /createReturn/);
  assert.match(doc, /pickupRequest/);
  assert.match(doc, /server-side BasicAuth/i);
  assert.match(doc, /rawAddress/);
  assert.match(doc, /productionTraffic`:\s*`false/);
  assert.doesNotMatch(doc, /sk_live|myDhlPasswordValue|basicAuthHeaderValue|rawAddressValue|privateKeyValue/);
  assert.equal(packageJson.scripts?.['verify:dhl-carrier-features'], 'tsx --test src/lib/dhlCarrierFeatures.test.ts');
});
