import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_GAP_SCENARIOS,
  ADDRESSQL_GAP_SCENARIOS_VERSION,
  validateAddressQlGapScenarios,
} from './addressQlGapScenarios';

test('AddressQL gap scenarios validate as bounded insufficiency research', () => {
  assert.equal(ADDRESSQL_GAP_SCENARIOS_VERSION, 'addressql-gap-scenarios-v0.1');
  assert.deepEqual(validateAddressQlGapScenarios(), []);
  assert.ok(ADDRESSQL_GAP_SCENARIOS.length >= 10);
});

test('gap scenarios cover source, wallet, carrier, realtime, legal, and settlement limits', () => {
  const categories = new Set(ADDRESSQL_GAP_SCENARIOS.map(scenario => scenario.category));
  const layers = new Set(ADDRESSQL_GAP_SCENARIOS.flatMap(scenario => scenario.missingLayers));

  for (const category of ['source-completeness', 'wallet-consent', 'carrier-contract', 'mobility-optimization', 'legal-compliance', 'settlement-evidence']) {
    assert.ok(categories.has(category as never), `${category} should be covered`);
  }
  for (const layer of ['official-source-catalog', 'address-wallet', 'carrier-connect', 'realtime-mobility', 'legal-policy-engine', 'settlement-ledger']) {
    assert.ok(layers.has(layer as never), `${layer} should be a missing layer`);
  }
});

test('safe AddressQL behavior avoids overclaiming delivery, consent, KYC, and settlement', () => {
  const byId = new Map(ADDRESSQL_GAP_SCENARIOS.map(scenario => [scenario.id, scenario]));

  assert.equal(byId.get('friend-delivery-without-recipient-approval')?.safeAddressQlBehavior, 'requires-wallet-approval');
  assert.equal(byId.get('carrier-feature-not-supported')?.safeAddressQlBehavior, 'requires-carrier-adapter');
  assert.equal(byId.get('fastest-cheapest-live-ranking')?.safeAddressQlBehavior, 'requires-real-time-signal');
  assert.equal(byId.get('legal-or-sanctions-block')?.safeAddressQlBehavior, 'requires-legal-policy');
  assert.equal(byId.get('label-billing-or-carrier-adjustment')?.safeAddressQlBehavior, 'requires-commercial-layer');
  assert.match(byId.get('proof-or-kyc-overclaim')?.nonClaims.join(' ') ?? '', /does not mean legally KYC-verified/);
});

test('gap scenario artifacts point toward executable specs beyond SQL', () => {
  for (const scenario of ADDRESSQL_GAP_SCENARIOS) {
    assert.ok(scenario.firstExecutableArtifact.length > 0, `${scenario.id} should have an executable artifact`);
    assert.ok(scenario.nonClaims.length > 0, `${scenario.id} should have non-claims`);
  }
  assert.ok(
    ADDRESSQL_GAP_SCENARIOS.some(scenario => /carrier capability matrix/.test(scenario.firstExecutableArtifact)),
    'carrier capability matrix should be an executable target',
  );
  assert.ok(
    ADDRESSQL_GAP_SCENARIOS.some(scenario => /settlement entry/.test(scenario.firstExecutableArtifact)),
    'settlement schema should be an executable target',
  );
});

test('gap scenario research note documents missing layers and next implementation move', () => {
  const doc = readFileSync('docs/addressql/gap-scenarios-v0.1.md', 'utf8');

  assert.match(doc, /AddressQL is the address validation/);
  assert.match(doc, /requires-wallet-approval/);
  assert.match(doc, /requires-carrier-adapter/);
  assert.match(doc, /requires-legal-policy/);
  assert.match(doc, /Settlement Ledger/);
  assert.match(doc, /ShipmentIntent \/ RateQuote \/ CarrierAllocation schemas/);
  assert.match(doc, /Label creation is not final settlement/);
});
