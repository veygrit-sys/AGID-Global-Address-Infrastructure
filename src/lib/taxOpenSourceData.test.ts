import assert from 'node:assert/strict';
import test from 'node:test';

import {
  estimateTaxFromOpenEvidence,
  getRecommendedTaxOpenSourceSources,
  getTaxOpenSourceSourcesByDomain,
} from './taxOpenSourceData';

test('recommended open-source tax sources exclude research-only corporate tax data', () => {
  const ids = getRecommendedTaxOpenSourceSources().map((source) => source.id);

  assert.ok(ids.includes('vatnode-eu-vat-rates-data'));
  assert.ok(ids.includes('node-sales-tax'));
  assert.ok(ids.includes('open-sales-tax'));
  assert.ok(!ids.includes('taxfoundation-worldwide-corporate-tax-rates'));
});

test('VAT domain has static and self-hosted sources for offline evidence', () => {
  const ids = getTaxOpenSourceSourcesByDomain('vat').map((source) => source.id);

  assert.ok(ids.includes('vatnode-eu-vat-rates-data'));
  assert.ok(ids.includes('node-sales-tax'));
  assert.ok(ids.includes('commerceguys-tax'));
});

test('tax estimate requires source-versioned evidence instead of hardcoded rates', () => {
  const estimate = estimateTaxFromOpenEvidence({
    destinationCountry: 'FR',
    taxableAmount: 100,
    currency: 'EUR',
    now: '2026-06-17T00:00:00Z',
  });

  assert.equal(estimate.status, 'needs-evidence');
  assert.equal(estimate.confidence, 'low');
  assert.equal(estimate.taxAmount, 0);
  assert.ok(estimate.manualReviewReasons.includes('tax-rate-evidence-missing'));
  assert.match(estimate.rule, /estimates only/i);
});

test('tax estimate computes VAT from open evidence without leaking private address data', () => {
  const estimate = estimateTaxFromOpenEvidence({
    destinationCountry: ' fr ',
    originCountry: 'JP',
    taxableAmount: 100,
    currency: 'eur',
    category: 'standard',
    now: '2026-06-17T00:00:00Z',
    taxEvidence: [
      {
        sourceId: 'vatnode-eu-vat-rates-data',
        countryCode: 'FR',
        taxType: 'vat',
        rate: 0.2,
        category: 'standard',
        confidence: 'open-source',
        evidenceUrl: 'https://github.com/vatnode/eu-vat-rates-data',
        retrievedAt: '2026-06-01T00:00:00Z',
      },
    ],
  });

  assert.equal(estimate.status, 'estimated');
  assert.equal(estimate.destinationCountry, 'FR');
  assert.equal(estimate.currency, 'EUR');
  assert.equal(estimate.taxAmount, 20);
  assert.equal(estimate.totalAmount, 120);
  assert.equal(estimate.confidence, 'medium');
  assert.match(estimate.privacyBoundary, /must not send or store raw address, AGID, AOID/i);
});

test('duplicate VAT evidence keeps the strongest source and avoids double counting', () => {
  const estimate = estimateTaxFromOpenEvidence({
    destinationCountry: 'FR',
    taxableAmount: 100,
    currency: 'EUR',
    now: '2026-06-17T00:00:00Z',
    taxEvidence: [
      {
        sourceId: 'vatnode-eu-vat-rates-data',
        countryCode: 'FR',
        taxType: 'vat',
        rate: 0.2,
        confidence: 'open-source',
      },
      {
        sourceId: 'official-operator-import',
        countryCode: 'FR',
        taxType: 'vat',
        rate: 0.2,
        confidence: 'official',
      },
    ],
  });

  assert.equal(estimate.status, 'estimated');
  assert.equal(estimate.lines.length, 1);
  assert.equal(estimate.lines[0]?.sourceId, 'official-operator-import');
  assert.equal(estimate.taxAmount, 20);
  assert.equal(estimate.confidence, 'high');
});

test('sales tax evidence warns that boundary evidence is needed', () => {
  const estimate = estimateTaxFromOpenEvidence({
    destinationCountry: 'US',
    taxableAmount: 50,
    currency: 'USD',
    now: '2026-06-17T00:00:00Z',
    taxEvidence: [
      {
        sourceId: 'open-sales-tax',
        countryCode: 'US',
        jurisdiction: 'example-state',
        taxType: 'sales-tax',
        rate: 0.0625,
        confidence: 'open-source',
      },
    ],
  });

  assert.equal(estimate.status, 'estimated');
  assert.equal(estimate.taxAmount, 3.13);
  assert.ok(estimate.warnings.includes('sales-tax-often-requires-boundary-level-jurisdiction-evidence-not-zip-only'));
});
