import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  CANADA_CARRIER_STRENGTHENING_VERSION,
  buildCanadaCarrierPlan,
  buildCanadaReadinessSnapshot,
  preflightCanadaCarrier,
  validateCanadaCarrierPlan,
} from './canadaCarrierStrengthening';

const readyInput = {
  originCountryCode: 'CA',
  destinationCountryCode: 'CA',
  recipientId: 'ship_recipient_synthetic_ca_001',
  walletConsentRef: 'wallet_consent_synthetic_ca_001',
  parcelProfileRef: 'parcel_profile_synthetic_ca_small_box_001',
  carrierCapabilityRef: 'carrier_capability_ca_ups_dhl_001',
  postalValidationRef: 'ca_postal_validation_synthetic_001',
} as const;

test('Canada carrier strengthening plan validates UPS default and DHL express/cross-border candidate', () => {
  const plan = buildCanadaCarrierPlan();

  assert.equal(plan.version, CANADA_CARRIER_STRENGTHENING_VERSION);
  assert.equal(plan.productName, 'Canada Carrier Strengthening');
  assert.equal(plan.countryCode, 'CA');
  assert.equal(plan.defaultCarrier, 'ups');
  assert.deepEqual(validateCanadaCarrierPlan(plan), []);
  assert.deepEqual(plan.runtimeCandidateCarriers, ['ups', 'dhl']);
  assert.equal(plan.safety.productionTraffic, false);
  assert.equal(plan.safety.rawAddressAllowedInPublicApi, false);
});

test('Canada lanes cover domestic, cross-border, return, and postal validation paths', () => {
  const plan = buildCanadaCarrierPlan();
  const lanes = new Map(plan.lanes.map(lane => [lane.laneId, lane]));

  for (const lane of ['ca-domestic-standard', 'ca-domestic-express', 'ca-us-cross-border', 'ca-return', 'ca-postal-validation']) {
    assert.ok(lanes.has(lane as never), `${lane} should exist`);
    assert.equal(lanes.get(lane as never)?.primaryCarrier, 'ups');
  }

  assert.deepEqual(lanes.get('ca-domestic-standard')?.runtimeCandidateCarriers, ['ups']);
  assert.deepEqual(lanes.get('ca-domestic-express')?.runtimeCandidateCarriers, ['ups', 'dhl']);
  assert.deepEqual(lanes.get('ca-us-cross-border')?.runtimeCandidateCarriers, ['ups', 'dhl']);
  assert.ok(lanes.get('ca-us-cross-border')?.requiredRefs.includes('customsIntentRef'));
  assert.ok(lanes.get('ca-postal-validation')?.requiredRefs.includes('postalValidationRef'));
  assert.match(plan.selectionPolicy.cross_border.requiredGate, /customs intent/);
});

test('Canada domestic preflight requires postal validation before rates', () => {
  const missingPostal = preflightCanadaCarrier({
    ...readyInput,
    postalValidationRef: undefined,
    objective: 'cheapest',
  });

  assert.equal(missingPostal.ok, false);
  assert.equal(missingPostal.laneId, 'ca-domestic-standard');
  assert.equal(missingPostal.selectedCarrier, 'ups');
  assert.deepEqual(missingPostal.candidateCarriers, ['ups']);
  assert.equal(missingPostal.requiredNextAction, 'run_canada_postal_validation');
  assert.ok(missingPostal.missingRefs.includes('postalValidationRef'));
  assert.equal(missingPostal.productionTraffic, false);
});

test('Canada express preflight keeps DHL as runtime candidate', () => {
  const ready = preflightCanadaCarrier({
    ...readyInput,
    objective: 'fastest',
  });

  assert.equal(ready.ok, true);
  assert.equal(ready.laneId, 'ca-domestic-express');
  assert.equal(ready.selectedCarrier, 'ups');
  assert.deepEqual(ready.candidateCarriers, ['ups', 'dhl']);
  assert.equal(ready.requiredNextAction, 'ready_for_canada_rates');
  assert.deepEqual(ready.missingRefs, []);
  assert.match(ready.nonClaims.join('\n'), /DHL is an Express\/cross-border runtime candidate/);
});

test('Canada-US cross-border preflight requires customs intent before rates', () => {
  const missingCustoms = preflightCanadaCarrier({
    ...readyInput,
    destinationCountryCode: 'US',
    objective: 'cross_border',
  });
  const ready = preflightCanadaCarrier({
    ...readyInput,
    destinationCountryCode: 'US',
    customsIntentRef: 'customs_intent_synthetic_ca_us_001',
    objective: 'cross_border',
  });

  assert.equal(missingCustoms.ok, false);
  assert.equal(missingCustoms.laneId, 'ca-us-cross-border');
  assert.equal(missingCustoms.requiredNextAction, 'prepare_cross_border_customs');
  assert.ok(missingCustoms.missingRefs.includes('customsIntentRef'));
  assert.equal(ready.ok, true);
  assert.equal(ready.laneId, 'ca-us-cross-border');
  assert.deepEqual(ready.candidateCarriers, ['ups', 'dhl']);
  assert.equal(ready.requiredNextAction, 'ready_for_canada_rates');
});

test('Canada preflight rejects unsupported countries and private customs/carrier material safely', () => {
  const unsupported = preflightCanadaCarrier({
    ...readyInput,
    destinationCountryCode: 'MX',
  });
  const unsafe = preflightCanadaCarrier({
    ...readyInput,
    nested: {
      rawAddress: 'blocked synthetic address',
      rawCustomsPayload: 'blocked synthetic customs payload',
      customsDescription: 'blocked synthetic customs description',
      accessToken: 'blocked synthetic token',
    },
  });

  assert.equal(unsupported.ok, false);
  assert.equal(unsupported.requiredNextAction, 'collect_canada_wallet_refs');
  assert.equal(unsafe.ok, false);
  assert.equal(unsafe.requiredNextAction, 'collect_canada_wallet_refs');
  assert.deepEqual(unsafe.rejectedKeys.sort(), [
    'nested.accessToken',
    'nested.customsDescription',
    'nested.rawAddress',
    'nested.rawCustomsPayload',
  ]);
  assert.doesNotMatch(JSON.stringify(unsafe.safeRefs), /rawAddress|rawCustomsPayload|customsDescription|accessToken/);
});

test('Canada readiness snapshot exposes only merchant-safe routing fields', () => {
  const snapshot = buildCanadaReadinessSnapshot({
    ...readyInput,
    destinationCountryCode: 'US',
    customsIntentRef: 'customs_intent_synthetic_ca_us_002',
    objective: 'cross_border',
  });

  assert.match(snapshot.snapshotRef, /^canada_readiness_/);
  assert.equal(snapshot.countryCode, 'CA');
  assert.equal(snapshot.laneId, 'ca-us-cross-border');
  assert.equal(snapshot.selectedCarrier, 'ups');
  assert.deepEqual(snapshot.candidateCarriers, ['ups', 'dhl']);
  assert.equal(snapshot.originCountryCode, 'CA');
  assert.equal(snapshot.destinationCountryCode, 'US');
  assert.equal(snapshot.privateMaterialExposed, false);
  assert.equal(snapshot.productionTraffic, false);
  assert.doesNotMatch(JSON.stringify(snapshot.merchantVisible), /rawAddress|recipientName|recipientPhone|carrierApiKey|customsDescription/);
});

test('Canada docs and package verification gate are present', () => {
  const doc = readFileSync('docs/product/canada-carrier-strengthening.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /Canada Carrier Strengthening/);
  assert.match(doc, /UPS default/);
  assert.match(doc, /DHL Express/);
  assert.match(doc, /ca-domestic-standard/);
  assert.match(doc, /ca-domestic-express/);
  assert.match(doc, /ca-us-cross-border/);
  assert.match(doc, /ca-return/);
  assert.match(doc, /ca-postal-validation/);
  assert.match(doc, /postalValidationRef/);
  assert.match(doc, /customsIntentRef/);
  assert.match(doc, /productionTraffic`:\s*`false/);
  assert.doesNotMatch(doc, /sk_live|rawAddressValue|clientSecretValue|accessTokenValue|customsDescriptionValue|privateKeyValue/);
  assert.equal(packageJson.scripts?.['verify:canada-carrier-strengthening'], 'tsx --test src/lib/canadaCarrierStrengthening.test.ts');
});
