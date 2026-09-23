import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildVeyFinanceTradeIntent,
  validateVeyFinanceTradeIntent,
} from './veyFinance';

const BASE_EVIDENCE = [
  {
    type: 'address-validation',
    status: 'passed',
    sourceId: 'agid-address-validation',
    evidenceRef: 'addr_ev_001',
    signed: true,
  },
  {
    type: 'hs-classification',
    status: 'passed',
    sourceId: 'datasets-harmonized-system',
    evidenceRef: 'hs_ev_001',
    confidence: 'open-source',
    signed: false,
  },
] as const;

const BASE_TAX_EVIDENCE = [
  {
    sourceId: 'official-operator-import' as const,
    countryCode: 'FR',
    taxType: 'customs-duty' as const,
    rate: 0.05,
    category: '6403',
    confidence: 'operator-import' as const,
    evidenceUrl: 'https://example.invalid/tariff-snapshot',
  },
  {
    sourceId: 'official-operator-import' as const,
    countryCode: 'FR',
    taxType: 'vat' as const,
    rate: 0.2,
    category: '6403',
    confidence: 'operator-import' as const,
    evidenceUrl: 'https://example.invalid/vat-snapshot',
  },
];

test('VeyFinance rejects general payments and keeps the concept as trade execution', () => {
  const intent = buildVeyFinanceTradeIntent({
    purpose: 'general-payment',
    originCountry: 'JP',
    destinationCountry: 'FR',
    goodsValue: 4.2,
    currency: 'EUR',
    hsCode: '0901',
  });

  assert.equal(intent.concept, 'trade-execution-robot-not-general-payment-app');
  assert.equal(intent.status, 'rejected');
  assert.ok(intent.errors.includes('vey-finance-does-not-handle-general-or-domestic-pos-payments'));
  assert.equal(validateVeyFinanceTradeIntent(intent).ok, false);
});

test('VeyFinance calculates landed cost from customs duty and VAT evidence', () => {
  const intent = buildVeyFinanceTradeIntent({
    purpose: 'cross-border-commerce',
    originCountry: 'JP',
    destinationCountry: 'FR',
    goodsValue: 100,
    shippingCost: 20,
    insuranceCost: 5,
    customsBrokerFee: 10,
    currency: 'EUR',
    hsCode: '6403',
    productCategory: '6403',
    incoterm: 'DDP',
    taxEvidence: BASE_TAX_EVIDENCE,
    evidence: BASE_EVIDENCE,
  });

  assert.equal(intent.status, 'ready-to-collect');
  assert.equal(intent.landedCost.taxableAmount, 135);
  assert.equal(intent.taxEstimate.taxAmount, 33.75);
  assert.equal(intent.landedCost.totalLandedCost, 168.75);
  assert.equal(intent.taxEstimate.confidence, 'high');
  assert.deepEqual(intent.dataSources.defaultTradeSourceIds, [
    'datasets-harmonized-system',
    'wto-tariff-data',
    'frankfurter-self-host',
  ]);
  assert.equal(validateVeyFinanceTradeIntent(intent).ok, true);
});

test('VeyFinance requires tax evidence before collecting funds', () => {
  const intent = buildVeyFinanceTradeIntent({
    purpose: 'carrier-ddp',
    originCountry: 'JP',
    destinationCountry: 'FR',
    goodsValue: 100,
    shippingCost: 20,
    currency: 'EUR',
    hsCode: '6403',
    productCategory: '6403',
    incoterm: 'DDP',
    evidence: BASE_EVIDENCE,
  });

  assert.equal(intent.status, 'requires-tax-evidence');
  assert.equal(intent.nextAction, 'import-tax-evidence');
  assert.equal(intent.taxEstimate.status, 'needs-evidence');
  assert.ok(intent.taxEstimate.manualReviewReasons.includes('tax-rate-evidence-missing'));
});

test('VeyFinance reserves tax only after collection and never marks final filing complete', () => {
  const intent = buildVeyFinanceTradeIntent({
    purpose: 'carrier-ddp',
    originCountry: 'JP',
    destinationCountry: 'FR',
    goodsValue: 100,
    shippingCost: 20,
    currency: 'EUR',
    hsCode: '6403',
    productCategory: '6403',
    incoterm: 'DDP',
    paymentProvider: 'stripe',
    paymentStatus: 'collected',
    taxEvidence: BASE_TAX_EVIDENCE,
    evidence: BASE_EVIDENCE,
  });

  assert.equal(intent.status, 'collected');
  assert.equal(intent.remittancePlan.mode, 'tax-reserve');
  assert.equal(intent.remittancePlan.reserveAmount, 30);
  assert.equal(intent.remittancePlan.finalFilingPerformed, false);
  assert.ok(intent.remittancePlan.requiredLicenseChecks.includes('licensed-money-movement-provider'));
});

test('VeyFinance releases escrow only after customs clearance, POD, and no dispute', () => {
  const intent = buildVeyFinanceTradeIntent({
    purpose: 'trade-escrow',
    originCountry: 'JP',
    destinationCountry: 'FR',
    goodsValue: 100,
    shippingCost: 20,
    currency: 'EUR',
    hsCode: '6403',
    productCategory: '6403',
    incoterm: 'DDP',
    paymentStatus: 'escrowed',
    escrowStatus: 'funded',
    customsCleared: true,
    podSigned: true,
    podReceiptRef: 'pod_receipt_signed_001',
    taxEvidence: BASE_TAX_EVIDENCE,
    evidence: [
      ...BASE_EVIDENCE,
      { type: 'customs-clearance', status: 'passed', evidenceRef: 'customs_ok', signed: true },
      { type: 'pod', status: 'passed', evidenceRef: 'pod_ok', signed: true },
    ],
  });

  assert.equal(intent.status, 'release-ready');
  assert.equal(intent.nextAction, 'release-escrow');
  assert.equal(intent.escrowPlan.canReleaseNow, true);
  assert.equal(intent.escrowPlan.canRefundNow, false);
});

test('VeyFinance routes damaged shipments to refund or insurance claim', () => {
  const intent = buildVeyFinanceTradeIntent({
    purpose: 'trade-escrow',
    originCountry: 'JP',
    destinationCountry: 'FR',
    goodsValue: 100,
    currency: 'EUR',
    hsCode: '6403',
    productCategory: '6403',
    incoterm: 'DDP',
    paymentStatus: 'escrowed',
    escrowStatus: 'funded',
    damageDetected: true,
    insuranceClaimRef: 'claim_commitment_001',
    taxEvidence: BASE_TAX_EVIDENCE,
    evidence: BASE_EVIDENCE,
  });

  assert.equal(intent.status, 'refund-required');
  assert.equal(intent.nextAction, 'refund-or-claim-insurance');
  assert.equal(intent.escrowPlan.canReleaseNow, false);
  assert.equal(intent.escrowPlan.canRefundNow, true);
});

test('VeyFinance rejects private address, AOID, card, and document material', () => {
  const intent = buildVeyFinanceTradeIntent({
    purpose: 'cross-border-commerce',
    originCountry: 'JP',
    destinationCountry: 'FR',
    goodsValue: 100,
    currency: 'EUR',
    hsCode: '6403',
    rawAddress: '1-1 Chiyoda, Tokyo',
    rawAgid: 'AGID-SECRET-123',
    rawAoid: 'AOID-SECRET-123',
    cardPan: '4242424242424242',
    bankAccount: 'DE89370400440532013000',
    customsDocumentBody: 'invoice body',
    evidence: [
      {
        type: 'address-validation',
        status: 'passed',
        rawAoid: 'AOID-SECRET-999',
      },
    ],
  });

  assert.equal(intent.status, 'rejected');
  assert.ok(intent.errors.includes('rawAddress-not-allowed-in-vey-finance'));
  assert.ok(intent.errors.includes('rawAgid-not-allowed-in-vey-finance'));
  assert.ok(intent.errors.includes('rawAoid-not-allowed-in-vey-finance'));
  assert.ok(intent.errors.includes('cardPan-not-allowed-in-vey-finance'));
  assert.ok(intent.errors.includes('bankAccount-not-allowed-in-vey-finance'));
  assert.ok(intent.errors.includes('customsDocumentBody-not-allowed-in-vey-finance'));
  assert.ok(intent.errors.includes('vey-finance-private-evidence-rejected'));
  assert.equal(intent.privacy.rawAddressStored, false);
  assert.equal(validateVeyFinanceTradeIntent(intent).ok, false);
});
