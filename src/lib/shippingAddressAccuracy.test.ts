import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  evaluateShippingAddressAccuracy,
  publicShippingAddressAccuracyDecision,
} from './shippingAddressAccuracy';

test('shipping address accuracy verifies only when postal, country, and reverse evidence agree', () => {
  const evaluation = evaluateShippingAddressAccuracy({
    entityId: 'addr-001',
    agid: 'JP05AV8TJGH8',
    country: 'JP',
    city: 'Tokyo',
    postcode: '1000001',
  }, {
    postalCodeApi: {
      status: 'verified',
      source: 'zipcloud',
      country: 'JP',
      city: 'Tokyo',
      postcode: '1000001',
    },
    agidReverseGeocoding: {
      status: 'verified',
      source: 'agid-reverse-geocoder',
      country: 'JP',
      city: 'Tokyo',
      postcode: '1000001',
    },
  });

  assert.equal(evaluation.status, 'verified');
  assert.equal(evaluation.decision, 'accept');
  assert.equal(evaluation.checks.postalCodeApi, 'pass');
  assert.equal(evaluation.checks.countryAddressValidation, 'partial');
  assert.equal(evaluation.checks.agidReverseGeocoding, 'pass');
  assert.equal(evaluation.internalScore > 0.78, true);

  const publicDecision = publicShippingAddressAccuracyDecision(evaluation);
  assert.equal('internalScore' in publicDecision, false);
  assert.equal(publicDecision.scoreVisibleToUser, false);
});

test('shipping address accuracy downgrades conflicts to needs-review', () => {
  const evaluation = evaluateShippingAddressAccuracy({
    entityId: 'addr-002',
    agid: 'JP05AV8TJGH8',
    country: 'JP',
    city: 'Tokyo',
    postcode: '1000001',
  }, {
    postalCodeApi: {
      status: 'verified',
      source: 'zipcloud',
      country: 'JP',
      city: 'Tokyo',
      postcode: '1000001',
    },
    agidReverseGeocoding: {
      status: 'verified',
      source: 'agid-reverse-geocoder',
      country: 'US',
      city: 'New York',
      postcode: '10001',
    },
  });

  assert.equal(evaluation.status, 'needs-review');
  assert.equal(evaluation.decision, 'review');
  assert.ok(evaluation.warnings.includes('shipping-address-accuracy-country-conflict'));
  assert.ok(evaluation.warnings.includes('shipping-address-accuracy-postcode-conflict'));
});

test('shipping address accuracy treats local reference without API evidence as partial', () => {
  const evaluation = evaluateShippingAddressAccuracy({
    entityId: 'addr-003',
    agid: 'JP05AV8TJGH8',
    country: 'JP',
    city: 'Tokyo',
    postcode: '1000001',
  });

  assert.equal(evaluation.status, 'partial');
  assert.equal(evaluation.decision, 'review');
  assert.equal(evaluation.checks.postalCodeApi, 'not-run');
  assert.equal(evaluation.checks.agidReverseGeocoding, 'not-run');
});
