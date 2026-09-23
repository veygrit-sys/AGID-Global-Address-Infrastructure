import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  US_DOMESTIC_CARRIER_STRENGTHENING_VERSION,
  buildUsDomesticCarrierPlan,
  buildUsDomesticReadinessSnapshot,
  preflightUsDomesticCarrier,
  validateUsDomesticCarrierPlan,
} from './usDomesticCarrierStrengthening';

const readyInput = {
  originCountryCode: 'US',
  destinationCountryCode: 'US',
  recipientId: 'ship_recipient_synthetic_us_domestic_001',
  walletConsentRef: 'wallet_consent_synthetic_us_domestic_001',
  parcelProfileRef: 'parcel_profile_synthetic_us_domestic_small_box_001',
  carrierCapabilityRef: 'carrier_capability_us_domestic_ups_001',
  addressValidationRef: 'ups_addr_validation_synthetic_us_domestic_001',
} as const;

test('US domestic carrier strengthening plan validates UPS default and DHL runtime candidate', () => {
  const plan = buildUsDomesticCarrierPlan();

  assert.equal(plan.version, US_DOMESTIC_CARRIER_STRENGTHENING_VERSION);
  assert.equal(plan.productName, 'US Domestic Carrier Strengthening');
  assert.equal(plan.countryCode, 'US');
  assert.equal(plan.defaultCarrier, 'ups');
  assert.deepEqual(validateUsDomesticCarrierPlan(plan), []);
  assert.deepEqual(plan.runtimeCandidateCarriers, ['ups', 'dhl']);
  assert.equal(plan.safety.productionTraffic, false);
  assert.equal(plan.safety.rawAddressAllowedInPublicApi, false);
});

test('US domestic lanes strengthen UPS ground, express, returns, and validation', () => {
  const plan = buildUsDomesticCarrierPlan();
  const lanes = new Map(plan.lanes.map(lane => [lane.laneId, lane]));

  for (const lane of ['us-domestic-ground', 'us-domestic-express', 'us-domestic-return', 'us-domestic-validation']) {
    assert.ok(lanes.has(lane as never), `${lane} should exist`);
    assert.equal(lanes.get(lane as never)?.primaryCarrier, 'ups');
  }

  assert.deepEqual(lanes.get('us-domestic-ground')?.runtimeCandidateCarriers, ['ups']);
  assert.deepEqual(lanes.get('us-domestic-express')?.runtimeCandidateCarriers, ['ups', 'dhl']);
  assert.ok(lanes.get('us-domestic-ground')?.requiredFeatures.includes('ups.addressValidation'));
  assert.ok(lanes.get('us-domestic-return')?.requiredFeatures.includes('ups.createReturn'));
  assert.ok(lanes.get('us-domestic-validation')?.requiredRefs.includes('addressValidationRef'));
  assert.match(plan.selectionPolicy.fastest.requiredGate, /DHL service availability/);
});

test('US domestic preflight requires UPS address validation before domestic rates', () => {
  const missingValidation = preflightUsDomesticCarrier({
    ...readyInput,
    addressValidationRef: undefined,
    objective: 'cheapest',
  });

  assert.equal(missingValidation.ok, false);
  assert.equal(missingValidation.laneId, 'us-domestic-ground');
  assert.equal(missingValidation.selectedCarrier, 'ups');
  assert.deepEqual(missingValidation.candidateCarriers, ['ups']);
  assert.equal(missingValidation.requiredNextAction, 'run_ups_address_validation');
  assert.ok(missingValidation.missingRefs.includes('addressValidationRef'));
  assert.equal(missingValidation.productionTraffic, false);
});

test('US domestic fastest preflight keeps DHL as runtime candidate only', () => {
  const ready = preflightUsDomesticCarrier({
    ...readyInput,
    objective: 'fastest',
  });

  assert.equal(ready.ok, true);
  assert.equal(ready.laneId, 'us-domestic-express');
  assert.equal(ready.selectedCarrier, 'ups');
  assert.deepEqual(ready.candidateCarriers, ['ups', 'dhl']);
  assert.equal(ready.requiredNextAction, 'ready_for_us_domestic_rates');
  assert.deepEqual(ready.missingRefs, []);
  assert.match(ready.nonClaims.join('\n'), /DHL is only a runtime candidate/);
});

test('US domestic preflight rejects non-US and private material safely', () => {
  const nonUs = preflightUsDomesticCarrier({
    ...readyInput,
    destinationCountryCode: 'CA',
  });
  const unsafe = preflightUsDomesticCarrier({
    ...readyInput,
    nested: {
      rawAddress: 'blocked synthetic address',
      carrierApiKey: 'blocked synthetic key',
      accessToken: 'blocked synthetic token',
    },
  });

  assert.equal(nonUs.ok, false);
  assert.equal(nonUs.requiredNextAction, 'collect_us_wallet_refs');
  assert.equal(unsafe.ok, false);
  assert.equal(unsafe.requiredNextAction, 'collect_us_wallet_refs');
  assert.deepEqual(unsafe.rejectedKeys.sort(), [
    'nested.accessToken',
    'nested.carrierApiKey',
    'nested.rawAddress',
  ]);
  assert.doesNotMatch(JSON.stringify(unsafe.safeRefs), /rawAddress|carrierApiKey|accessToken/);
});

test('US domestic readiness snapshot exposes only merchant-safe routing fields', () => {
  const snapshot = buildUsDomesticReadinessSnapshot({
    ...readyInput,
    objective: 'returns_first',
  });

  assert.match(snapshot.snapshotRef, /^us_domestic_readiness_/);
  assert.equal(snapshot.countryCode, 'US');
  assert.equal(snapshot.laneId, 'us-domestic-return');
  assert.equal(snapshot.selectedCarrier, 'ups');
  assert.deepEqual(snapshot.candidateCarriers, ['ups']);
  assert.equal(snapshot.privateMaterialExposed, false);
  assert.equal(snapshot.productionTraffic, false);
  assert.doesNotMatch(JSON.stringify(snapshot.merchantVisible), /rawAddress|recipientName|recipientPhone|carrierApiKey/);
});

test('US domestic docs and package verification gate are present', () => {
  const doc = readFileSync('docs/product/us-domestic-carrier-strengthening.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /US Domestic Carrier Strengthening/);
  assert.match(doc, /UPS default/);
  assert.match(doc, /DHL runtime candidate/);
  assert.match(doc, /us-domestic-ground/);
  assert.match(doc, /us-domestic-express/);
  assert.match(doc, /us-domestic-return/);
  assert.match(doc, /us-domestic-validation/);
  assert.match(doc, /addressValidationRef/);
  assert.match(doc, /productionTraffic`:\s*`false/);
  assert.doesNotMatch(doc, /sk_live|rawAddressValue|clientSecretValue|accessTokenValue|privateKeyValue/);
  assert.equal(packageJson.scripts?.['verify:us-domestic-carrier-strengthening'], 'tsx --test src/lib/usDomesticCarrierStrengthening.test.ts');
});
