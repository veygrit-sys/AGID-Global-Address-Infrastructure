import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  POSTAL_CONTEXT_COUNTRY_POLICIES,
  isPostalContextCountryCode,
  normalizeFaroeIslandsPostalCode,
  normalizePostalContextPostalCode,
} from './postalContextCountryPolicy';

test('FO postal codes normalize optional country prefix without guessing malformed values', () => {
  assert.equal(normalizeFaroeIslandsPostalCode('１００'), '100');
  assert.equal(normalizeFaroeIslandsPostalCode('1 00'), '100');
  assert.equal(normalizeFaroeIslandsPostalCode('ｆｏ－１００'), '100');
  assert.equal(normalizeFaroeIslandsPostalCode('FO-100'), '100');
  assert.equal(normalizeFaroeIslandsPostalCode('FO100'), null);
  assert.equal(normalizeFaroeIslandsPostalCode('10'), null);
  assert.equal(normalizePostalContextPostalCode('fo', 'FO-476'), '476');
  assert.equal(isPostalContextCountryCode('FO'), true);
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.FO.postalCodeFormat, 'NNN or FO-NNN');
  assert.equal(POSTAL_CONTEXT_COUNTRY_POLICIES.FO.fullCodeGeometrySemantics, 'postal-area-first');
});
