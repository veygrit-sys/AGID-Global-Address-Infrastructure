import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildEnglishShippingAddress, getEnglishShippingProfile } from './englishShippingAddress';
import { assessCameroonPostalCandidate } from './postalContextCameroonQuality';

test('rejects arbitrary five-digit values because CM has no current postcode system', () => {
  const result = assessCameroonPostalCandidate({ value: '12345', objectKind: 'postcode', sourceKind: 'model' });
  assert.equal(result.countryCode, 'CM');
  assert.equal(result.normalizedPostcode, null);
  assert.equal(result.eligibleForPostalArea, false);
  assert.ok(result.reasons.includes('no-current-postcode-system'));
  assert.ok(result.reasons.includes('model-has-no-postal-authority'));
  assert.equal(result.postalAgidLinkAllowed, false);
});

test('keeps BP identifiers, including five-digit BP 54190, as non-postal delivery objects', () => {
  for (const value of ['BP 6000', 'B.P. 54190', '54190']) {
    const result = assessCameroonPostalCandidate({ value, objectKind: 'po-box', sourceKind: 'official-reference' });
    assert.equal(result.independentAddressContextAllowed, true);
    assert.ok(result.reasons.includes('po-box-is-not-postcode'));
    assert.equal(result.buildingOrAddressDetailInferred, false);
  }
});

test('rejects administrative polygons, points, routes and AGID cells as postal surfaces', () => {
  for (const [objectKind, geometryType] of [
    ['administrative-area', 'MultiPolygon'], ['post-office', 'Point'],
    ['route', 'LineString'], ['agid-cell', 'Polygon'],
  ] as const) {
    const result = assessCameroonPostalCandidate({ objectKind, geometryType, sourceKind: 'open-reference' });
    assert.equal(result.eligibleForPostalArea, false);
    assert.ok(result.reasons.includes('non-postal-geometry-proxy'));
  }
});

test('does not let a model create postal or building authority', () => {
  const result = assessCameroonPostalCandidate({
    value: 'Yaoundé 10000', objectKind: 'model-output', geometryType: 'Polygon', sourceKind: 'model',
  });
  assert.equal(result.normalizedPostcode, null);
  assert.ok(result.reasons.includes('model-has-no-postal-authority'));
  assert.equal(result.buildingOrAddressDetailInferred, false);
});

test('shipping profile treats CM postcode input as not used rather than required', () => {
  const profile = getEnglishShippingProfile('CM');
  assert.equal(profile.postcodePolicy, 'not-used');
  assert.equal(profile.postcodePattern, null);
  const result = buildEnglishShippingAddress({
    country_code: 'CM', country: 'Cameroon', state: 'Centre', city: 'Yaoundé',
    district: '', subdistrict: '', suburb: '', road: 'Avenue de la Poste',
    house_number: '1', building: 'Campost', postcode: '54190', poi: '',
  }, 'international-shipping');
  assert.ok(result.warnings.includes('postcode_not_used_by_destination'));
  assert.equal(result.warnings.includes('missing_postcode'), false);
});
