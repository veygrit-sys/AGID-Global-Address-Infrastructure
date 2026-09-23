import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCrossBorderAuxiliaryContext,
  getCrossBorderAuxiliaryDataLayer,
  getCrossBorderAuxiliarySourcesByDomain,
  getCrossBorderAuxiliarySourcesForDecision,
  getRecommendedFullyFreeCrossBorderSources,
  getRecommendedFreeCrossBorderSources,
} from './crossBorderAuxiliaryData';

test('JP to US POS context selects fully-free local sources without exposing private address payloads', () => {
  const decision = buildCrossBorderAuxiliaryContext({
    useCase: 'pos-checkout',
    originCountry: ' jp ',
    destinationCountry: 'us',
    product: {
      hsCode: '0901.21',
      barcode: '4900000000000',
      declaredValue: 2400,
      currency: 'JPY',
    },
    address: {
      hasRecipientAddress: true,
      hasPostalCode: true,
      hasAgid: true,
    },
  });

  assert.equal(decision.status, 'ready-for-estimate');
  assert.equal(decision.dataPolicy, 'fully-free-local-first');
  assert.equal(decision.corridor.originCountry, 'JP');
  assert.equal(decision.corridor.destinationCountry, 'US');
  assert.ok(!decision.recommendedSourceIds.includes('usitc-hts-rest-api'));
  assert.ok(decision.excludedSourceIds.includes('usitc-hts-rest-api'));
  assert.ok(decision.recommendedSourceIds.includes('frankfurter-self-host'));
  assert.ok(decision.recommendedSourceIds.includes('pelias-self-host'));
  assert.ok(decision.recommendedSourceIds.includes('libpostal-self-host'));
  assert.ok(decision.recommendedSourceIds.includes('openaddresses-dataset'));
  assert.ok(decision.recommendedSourceIds.includes('gs1-digital-link-standard'));
  assert.ok(decision.recommendedSourceIds.includes('gs1-epcis-standard'));
  assert.ok(decision.recommendedSourceIds.includes('upu-s10-standard'));
  assert.ok(decision.recommendedSourceIds.includes('datasets-harmonized-system'));
  assert.ok(decision.recommendedSourceIds.includes('open-food-facts-api'));
  assert.ok(decision.recommendedSourceIds.includes('japan-post-postal-csv-posuto'));
  assert.ok(decision.recommendedSourceIds.includes('node-sales-tax'));
  assert.ok(decision.recommendedSourceIds.includes('open-sales-tax'));
  assert.match(decision.privacyBoundary, /must not submit raw address, AGID, AOID/i);
});

test('EU to UK shopping-agent context adds EU and UK tax/tariff references', () => {
  const decision = buildCrossBorderAuxiliaryContext({
    useCase: 'shopping-agent',
    originCountry: 'FR',
    destinationCountry: 'GB',
    product: {
      hsCode: '6109.10',
      category: 'cotton t-shirt',
      declaredValue: 39,
      currency: 'EUR',
    },
    address: {
      hasAoidCredential: true,
    },
    party: {
      hasBusinessVatNumber: true,
    },
  });

  assert.equal(decision.status, 'ready-for-estimate');
  assert.ok(decision.requiredDomains.includes('vat-tax'));
  assert.ok(!decision.recommendedSourceIds.includes('uk-trade-tariff-api'));
  assert.ok(decision.excludedSourceIds.includes('uk-trade-tariff-api'));
  assert.ok(decision.recommendedSourceIds.includes('eu-taric'));
  assert.ok(decision.recommendedSourceIds.includes('ec-vat-rates'));
  assert.ok(decision.recommendedSourceIds.includes('vatnode-eu-vat-rates-data'));
  assert.ok(decision.recommendedSourceIds.includes('node-sales-tax'));
  assert.ok(!decision.recommendedSourceIds.includes('ec-vies'));
  assert.ok(decision.excludedSourceIds.includes('ec-vies'));
});

test('restricted product flags force manual review and do not auto-clear', () => {
  const decision = buildCrossBorderAuxiliaryContext({
    useCase: 'cross-border-shipping',
    originCountry: 'US',
    destinationCountry: 'CA',
    product: {
      hsCode: '8507.60',
      category: 'lithium battery',
      declaredValue: 120,
      currency: 'USD',
      riskFlags: ['battery', 'hazmat'],
    },
    address: {
      hasAgid: true,
    },
  });

  assert.equal(decision.status, 'needs-manual-review');
  assert.ok(decision.requiredDomains.includes('restriction-screening'));
  assert.ok(decision.manualReviewReasons.includes('restricted-or-sensitive-goods-manual-review'));
});

test('missing HS code and value remain insufficient data for POS decisions', () => {
  const decision = buildCrossBorderAuxiliaryContext({
    useCase: 'pos-checkout',
    originCountry: 'BR',
    destinationCountry: 'DE',
    product: {
      category: 'handmade accessory',
      currency: 'BRL',
    },
    address: {
      hasRecipientAddress: true,
    },
  });

  assert.equal(decision.status, 'insufficient-data');
  assert.equal(decision.confidence, 'low');
  assert.ok(decision.manualReviewReasons.includes('hs-code-missing'));
  assert.ok(decision.manualReviewReasons.includes('declared-value-missing-or-invalid'));
});

test('fully-free recommended registry excludes free-tier, registration, and public live-only sources', () => {
  const sourceIds = getRecommendedFreeCrossBorderSources().map((source) => source.id);
  const fullyFreeSourceIds = getRecommendedFullyFreeCrossBorderSources().map((source) => source.id);

  assert.deepEqual(sourceIds, fullyFreeSourceIds);
  assert.ok(sourceIds.includes('frankfurter-self-host'));
  assert.ok(sourceIds.includes('pelias-self-host'));
  assert.ok(sourceIds.includes('libpostal-self-host'));
  assert.ok(sourceIds.includes('open-food-facts-api'));
  assert.ok(sourceIds.includes('vatnode-eu-vat-rates-data'));
  assert.ok(sourceIds.includes('node-sales-tax'));
  assert.ok(sourceIds.includes('open-sales-tax'));
  assert.ok(!sourceIds.includes('frankfurter-api'));
  assert.ok(!sourceIds.includes('uk-trade-tariff-api'));
  assert.ok(!sourceIds.includes('world-bank-wits'));
  assert.ok(!sourceIds.includes('un-comtrade-api'));
  assert.ok(!sourceIds.includes('what3words-api'));
  assert.ok(!sourceIds.includes('gs1-verified-by-gs1'));
  assert.ok(!sourceIds.includes('opencorporates-api'));
});

test('source registry preserves no-auto-clear rule and source metadata', () => {
  const layer = getCrossBorderAuxiliaryDataLayer();
  const barcodeSources = getCrossBorderAuxiliarySourcesByDomain('product-barcode');
  const decision = buildCrossBorderAuxiliaryContext({
    useCase: 'shopping-agent',
    originCountry: 'JP',
    destinationCountry: 'AU',
    product: {
      hsCode: '1905.90',
      barcode: '4900000000000',
      declaredValue: 16,
      currency: 'JPY',
      riskFlags: ['food'],
    },
    address: {
      hasAoidCredential: true,
    },
  });
  const selectedSources = getCrossBorderAuxiliarySourcesForDecision(decision);

  assert.match(layer.rule, /never auto-clear legal customs/i);
  assert.ok(barcodeSources.some((source) => source.id === 'open-food-facts-api'));
  assert.ok(selectedSources.some((source) => source.id === 'open-food-facts-api'));
  assert.equal(decision.status, 'needs-manual-review');
});
