import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessCoteDIvoirePostalCandidate } from './postalContextCoteDIvoireQuality';

test('rejects arbitrary digits because CI has no current postcode system', () => {
  const result = assessCoteDIvoirePostalCandidate({ value: '00225', objectKind: 'postcode', sourceKind: 'model' });
  assert.equal(result.normalizedPostcode, null);
  assert.equal(result.eligibleForPostalArea, false);
  assert.ok(result.reasons.includes('no-current-postcode-system'));
  assert.ok(result.reasons.includes('model-has-no-postal-authority'));
  assert.equal(result.postalAgidLinkAllowed, false);
});

test('keeps BP identifiers as non-postal delivery objects', () => {
  const result = assessCoteDIvoirePostalCandidate({ value: '06 B.P. 37', objectKind: 'po-box', sourceKind: 'official-reference' });
  assert.equal(result.independentAddressContextAllowed, true);
  assert.ok(result.reasons.includes('po-box-is-not-postcode'));
  assert.equal(result.buildingOrAddressDetailInferred, false);
});

test('rejects UPU two-digit office codes and 104 home-delivery indicator as postcodes', () => {
  for (const [value, objectKind] of [['06', 'post-office-code'], ['17', 'post-office-code'], ['104', 'home-delivery-indicator']] as const) {
    const result = assessCoteDIvoirePostalCandidate({ value, objectKind, sourceKind: 'official-reference' });
    assert.equal(result.normalizedPostcode, null);
    assert.ok(result.reasons.includes('office-routing-code-is-not-postcode'));
  }
});

test('rejects administrative polygons, points, routes and AGID cells as postal surfaces', () => {
  for (const [objectKind, geometryType] of [
    ['administrative-area', 'MultiPolygon'], ['post-office', 'Point'],
    ['route', 'LineString'], ['agid-cell', 'Polygon'],
  ] as const) {
    const result = assessCoteDIvoirePostalCandidate({ objectKind, geometryType, sourceKind: 'open-reference' });
    assert.equal(result.eligibleForPostalArea, false);
    assert.ok(result.reasons.includes('non-postal-geometry-proxy'));
  }
});

test('retains Côte d’Ivoire ISO CI identity without importing neighbouring assignments', () => {
  const result = assessCoteDIvoirePostalCandidate({ value: '10000', objectKind: 'postcode', sourceKind: 'official-reference' });
  assert.equal(result.countryCode, 'CI');
  assert.equal(result.normalizedPostcode, null);
});
