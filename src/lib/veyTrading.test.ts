import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildVeyTradingIntent,
  createVeyTradeGatewayIntentStore,
  validateVeyTradingIntent,
} from './veyTrading';
import { VEY_FINANCE_VERSION } from './veyFinance';

const BASE_SPOT_EVIDENCE = [
  { type: 'listing', status: 'passed', evidenceRef: 'listing_ev_001', signed: true },
  { type: 'inventory', status: 'passed', evidenceRef: 'inventory_ev_001', signed: true },
  { type: 'market-data', status: 'passed', sourceId: 'operator-price-feed', evidenceRef: 'px_ev_001' },
  { type: 'counterparty-kyc', status: 'passed', evidenceRef: 'kyc_ev_001', signed: true },
  { type: 'sanctions-screen', status: 'passed', evidenceRef: 'sanctions_ev_001', signed: true },
  { type: 'title-of-goods', status: 'passed', evidenceRef: 'title_ev_001', signed: true },
] as const;

test('VeyTrading prepares physical goods trade and links to Finance for cross-border settlement', () => {
  const intent = buildVeyTradingIntent({
    side: 'buy',
    assetKind: 'physical-goods',
    marketMode: 'catalog',
    listingAlias: 'LIST-REF-001',
    orderAlias: 'ORD-REF-001',
    assetAlias: 'shoe-lot-001',
    originCountry: 'JP',
    destinationCountry: 'FR',
    quantity: 100,
    unit: 'pair',
    unitPrice: 12.5,
    currency: 'EUR',
    hsCode: '6403',
    deliveryRequired: true,
    financeIntentRef: 'VF-TRADE-REF-001',
    financeIntentVersion: VEY_FINANCE_VERSION,
    evidence: [
      ...BASE_SPOT_EVIDENCE,
      { type: 'export-control', status: 'passed', evidenceRef: 'export_ev_001', signed: true },
      { type: 'finance-intent', status: 'passed', evidenceRef: 'VF-TRADE-REF-001', signed: true },
    ],
  });

  assert.equal(intent.status, 'ready-to-contract');
  assert.equal(intent.nextAction, 'draft-contract');
  assert.equal(intent.quote.notional, 1250);
  assert.equal(intent.quote.priceIsExecutable, true);
  assert.equal(intent.financeLink.required, true);
  assert.equal(intent.financeLink.expectedVersion, VEY_FINANCE_VERSION);
  assert.equal(validateVeyTradingIntent(intent).ok, true);
});

test('Trade Gateway intent store replays same idempotency body and rejects conflicts', () => {
  const store = createVeyTradeGatewayIntentStore();
  const request = {
    idempotencyKey: 'trade-gateway-intent-key-001',
    operatorWorkspaceRef: 'workspace_ref_ops_tyo_001',
    deliveryGatewayShipmentRef: 'delivery_gateway_shipment_ref_tyo_001',
    playlistCommerceIntentRef: 'playlist_intent_ref_tyo_001',
    side: 'buy',
    assetKind: 'physical-goods',
    marketMode: 'catalog',
    listingAlias: 'LIST-IDEMP-001',
    orderAlias: 'ORD-IDEMP-001',
    originCountry: 'JP',
    destinationCountry: 'FR',
    quantity: 12,
    unit: 'case',
    unitPrice: 25,
    currency: 'EUR',
    hsCode: '6403',
    deliveryRequired: true,
    financeIntentRef: 'VF-TRADE-IDEMP-001',
    financeIntentVersion: VEY_FINANCE_VERSION,
    evidence: [
      ...BASE_SPOT_EVIDENCE,
      { type: 'export-control', status: 'passed', evidenceRef: 'export_ev_idemp_001', signed: true },
      { type: 'finance-intent', status: 'passed', evidenceRef: 'VF-TRADE-IDEMP-001', signed: true },
    ],
  } as const;

  const created = store.create(request);
  const replayed = store.create({ ...request, requestedAt: '2026-06-21T00:00:00.000Z' });
  const conflict = store.create({ ...request, quantity: 13 });

  assert.equal(created.ok, true);
  assert.equal(created.decision, 'created');
  assert.equal(created.replayed, false);
  assert.equal(created.attemptCount, 1);
  assert.equal(created.intent?.status, 'ready-to-contract');
  assert.match(created.tradeGatewayIntentRef ?? '', /^trade_gateway_intent_[A-F0-9]{24}$/);
  assert.equal(created.localOnly, true);
  assert.equal(created.productionTraffic, false);
  assert.equal(created.privacy.rawAddressStored, false);
  assert.equal(created.safeRefs?.deliveryGatewayShipmentRef, 'delivery_gateway_shipment_ref_tyo_001');

  assert.equal(replayed.ok, true);
  assert.equal(replayed.decision, 'replayed');
  assert.equal(replayed.replayed, true);
  assert.equal(replayed.attemptCount, 2);
  assert.equal(replayed.tradeGatewayIntentRef, created.tradeGatewayIntentRef);
  assert.equal(replayed.bodyFingerprintRef, created.bodyFingerprintRef);

  assert.equal(conflict.ok, false);
  assert.equal(conflict.status, 409);
  assert.equal(conflict.decision, 'conflict');
  assert.equal(conflict.tradeGatewayIntentRef, created.tradeGatewayIntentRef);
  assert.ok(conflict.errors.includes('idempotency-key-body-mismatch'));
  assert.match(conflict.conflictRef ?? '', /^trade_gateway_conflict_[A-F0-9]{24}$/);
  assert.equal(store.size, 1);
});

test('VeyTrading blocks local execution of futures and derivatives without licensed venue', () => {
  const intent = buildVeyTradingIntent({
    assetKind: 'futures-contract',
    marketMode: 'order-book',
    listingAlias: 'OIL-FUTURES-LOCAL',
    originCountry: 'US',
    destinationCountry: 'US',
    quantity: 1,
    unit: 'contract',
    unitPrice: 75000,
    currency: 'USD',
    executionRequested: true,
    evidence: BASE_SPOT_EVIDENCE,
  });

  assert.equal(intent.status, 'rejected');
  assert.ok(intent.errors.includes('futures-or-derivatives-execution-not-allowed-in-local-mode'));
  assert.ok(intent.requiredControls.includes('licensed-futures-or-derivatives-venue'));
  assert.equal(validateVeyTradingIntent(intent).ok, false);
});

test('Trade Gateway intent store refuses private material before caching', () => {
  const store = createVeyTradeGatewayIntentStore();
  const rejected = store.create({
    idempotencyKey: 'trade-gateway-intent-key-002',
    assetKind: 'physical-goods',
    marketMode: 'catalog',
    listingAlias: 'PRIVATE-TEST',
    quantity: 1,
    unitPrice: 10,
    currency: 'USD',
    rawAddress: 'blocked',
    privateKey: 'blocked',
    evidence: [
      { type: 'listing', status: 'passed', rawAoid: 'blocked' },
    ],
  });

  assert.equal(rejected.ok, false);
  assert.equal(rejected.status, 400);
  assert.equal(rejected.decision, 'rejected');
  assert.equal(rejected.attemptCount, 0);
  assert.ok(rejected.errors.includes('rawAddress-not-allowed-in-trade-gateway-intent'));
  assert.ok(rejected.errors.includes('privateKey-not-allowed-in-trade-gateway-intent'));
  assert.ok(rejected.errors.includes('evidence.0.rawAoid-not-allowed-in-trade-gateway-intent'));
  assert.equal(rejected.intent, undefined);
  assert.equal(rejected.localOnly, true);
  assert.equal(rejected.productionTraffic, false);
  assert.equal(store.size, 0);
});

test('VeyTrading can model futures as simulation but still requires review', () => {
  const intent = buildVeyTradingIntent({
    assetKind: 'futures-contract',
    marketMode: 'futures-simulation',
    listingAlias: 'WHEAT-HEDGE-SIM',
    originCountry: 'US',
    destinationCountry: 'US',
    quantity: 5,
    unit: 'contract',
    unitPrice: 6200,
    currency: 'USD',
    evidence: BASE_SPOT_EVIDENCE,
  });

  assert.equal(intent.status, 'requires-review');
  assert.equal(intent.nextAction, 'manual-review');
  assert.equal(intent.compliance.licensedVenueRequired, false);
  assert.ok(intent.manualReviewReasons.includes('futures-or-derivatives-licensed-venue-required'));
});

test('VeyTrading requires sanctions and export controls for resource trades', () => {
  const intent = buildVeyTradingIntent({
    side: 'buy',
    assetKind: 'resource-mineral',
    marketMode: 'rfq',
    listingAlias: 'COPPER-CATHODE-LOT',
    originCountry: 'CL',
    destinationCountry: 'JP',
    quantity: 24,
    unit: 'ton',
    unitPrice: 8200,
    currency: 'USD',
    evidence: [
      { type: 'listing', status: 'passed', evidenceRef: 'listing_ev_002' },
      { type: 'market-data', status: 'passed', evidenceRef: 'px_ev_002' },
      { type: 'counterparty-kyc', status: 'passed', evidenceRef: 'kyc_ev_002' },
      { type: 'sanctions-screen', status: 'passed', evidenceRef: 'sanctions_ev_002' },
      { type: 'title-of-goods', status: 'passed', evidenceRef: 'title_ev_002' },
    ],
  });

  assert.equal(intent.status, 'requires-compliance-screening');
  assert.equal(intent.nextAction, 'run-compliance-screening');
  assert.equal(intent.compliance.exportControlRequired, true);
  assert.ok(intent.manualReviewReasons.includes('resource-origin-sanctions-and-conflict-minerals-review-required'));
});

test('VeyTrading rejects failed sanctions screening', () => {
  const intent = buildVeyTradingIntent({
    assetKind: 'resource-energy',
    marketMode: 'rfq',
    listingAlias: 'ENERGY-CARGO-001',
    originCountry: 'AE',
    destinationCountry: 'JP',
    quantity: 1000,
    unit: 'barrel',
    unitPrice: 82,
    currency: 'USD',
    evidence: [
      ...BASE_SPOT_EVIDENCE,
      { type: 'sanctions-screen', status: 'failed', evidenceRef: 'sanctions_hit_001', signed: true },
      { type: 'export-control', status: 'passed', evidenceRef: 'export_ev_003', signed: true },
    ],
  });

  assert.equal(intent.status, 'rejected');
  assert.equal(intent.riskLevel, 'blocked');
  assert.ok(intent.errors.includes('sanctions-screen-failed'));
});

test('VeyTrading requires ownership or license evidence for digital assets', () => {
  const missingOwnership = buildVeyTradingIntent({
    assetKind: 'digital-asset',
    marketMode: 'auction',
    listingAlias: 'NFT-ART-001',
    quantity: 1,
    unit: 'token',
    unitPrice: 1.2,
    currency: 'ETH',
    evidence: [
      { type: 'listing', status: 'passed', evidenceRef: 'listing_ev_004' },
      { type: 'market-data', status: 'passed', evidenceRef: 'px_ev_004' },
      { type: 'counterparty-kyc', status: 'passed', evidenceRef: 'kyc_ev_004' },
      { type: 'sanctions-screen', status: 'passed', evidenceRef: 'sanctions_ev_004' },
    ],
  });

  assert.equal(missingOwnership.status, 'requires-compliance-screening');

  const withOwnership = buildVeyTradingIntent({
    assetKind: 'digital-asset',
    marketMode: 'auction',
    listingAlias: 'NFT-ART-001',
    quantity: 1,
    unit: 'token',
    unitPrice: 1.2,
    currency: 'ETH',
    evidence: [
      { type: 'listing', status: 'passed', evidenceRef: 'listing_ev_004' },
      { type: 'market-data', status: 'passed', evidenceRef: 'px_ev_004' },
      { type: 'counterparty-kyc', status: 'passed', evidenceRef: 'kyc_ev_004' },
      { type: 'sanctions-screen', status: 'passed', evidenceRef: 'sanctions_ev_004' },
      { type: 'digital-asset-ownership', status: 'passed', evidenceRef: 'ownership_ev_004', signed: true },
      { type: 'manual-review', status: 'passed', evidenceRef: 'review_ev_004', signed: true },
    ],
  });

  assert.equal(withOwnership.status, 'match-ready');
  assert.equal(withOwnership.nextAction, 'match-order');
  assert.ok(withOwnership.requiredControls.includes('wallet-risk-screening-without-private-key-custody'));
  assert.equal(validateVeyTradingIntent(withOwnership).ok, true);
});

test('VeyTrading handles escrow-only service as a contract and settlement gate', () => {
  const intent = buildVeyTradingIntent({
    assetKind: 'escrow-only',
    marketMode: 'escrow',
    listingAlias: 'ESCROW-CASE-001',
    quantity: 1,
    unitPrice: 4000,
    currency: 'USD',
    financeIntentRef: 'VF-ESCROW-CASE-001',
    financeIntentVersion: VEY_FINANCE_VERSION,
    escrowRequired: true,
    escrowFunded: true,
    contractSigned: true,
    fulfillmentConfirmed: true,
    settlementConfirmed: true,
    evidence: [
      { type: 'listing', status: 'passed', evidenceRef: 'case_listing_ev' },
      { type: 'market-data', status: 'passed', evidenceRef: 'valuation_ev' },
      { type: 'counterparty-kyc', status: 'passed', evidenceRef: 'kyc_ev' },
      { type: 'sanctions-screen', status: 'passed', evidenceRef: 'sanctions_ev' },
      { type: 'finance-intent', status: 'passed', evidenceRef: 'VF-ESCROW-CASE-001', signed: true },
      { type: 'escrow', status: 'passed', evidenceRef: 'escrow_funded_ev', signed: true },
      { type: 'delivery-pod', status: 'passed', evidenceRef: 'pod_ev', signed: true },
    ],
  });

  assert.equal(intent.status, 'settled');
  assert.equal(intent.nextAction, 'none');
  assert.equal(intent.lifecycle.escrowFunded, true);
  assert.equal(validateVeyTradingIntent(intent).ok, true);
});

test('VeyTrading rejects private address, AOID, contact, contract body, and keys', () => {
  const intent = buildVeyTradingIntent({
    assetKind: 'physical-goods',
    marketMode: 'catalog',
    listingAlias: 'PRIVATE-TEST',
    quantity: 1,
    unitPrice: 10,
    currency: 'USD',
    rawAddress: '1-1 Chiyoda, Tokyo',
    rawAgid: 'AGID-SECRET-123456',
    rawAoid: 'AOID-SECRET-123456',
    counterpartyName: 'Alice',
    email: 'alice@example.com',
    phone: '+819012345678',
    privateKey: '0xsecret',
    contractBody: 'full contract text',
    evidence: [
      { type: 'listing', status: 'passed', rawAoid: 'AOID-SECRET-999999' },
    ],
  });

  assert.equal(intent.status, 'rejected');
  assert.ok(intent.errors.includes('rawAddress-not-allowed-in-vey-trading'));
  assert.ok(intent.errors.includes('rawAgid-not-allowed-in-vey-trading'));
  assert.ok(intent.errors.includes('rawAoid-not-allowed-in-vey-trading'));
  assert.ok(intent.errors.includes('counterpartyName-not-allowed-in-vey-trading'));
  assert.ok(intent.errors.includes('email-not-allowed-in-vey-trading'));
  assert.ok(intent.errors.includes('phone-not-allowed-in-vey-trading'));
  assert.ok(intent.errors.includes('privateKey-not-allowed-in-vey-trading'));
  assert.ok(intent.errors.includes('contractBody-not-allowed-in-vey-trading'));
  assert.ok(intent.errors.includes('vey-trading-private-evidence-rejected'));
  assert.equal(validateVeyTradingIntent(intent).ok, false);
});
