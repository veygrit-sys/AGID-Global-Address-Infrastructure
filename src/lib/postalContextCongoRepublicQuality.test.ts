import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessCongoRepublicPostalCandidate } from './postalContextCongoRepublicQuality';

test('rejects postcode-like digits because CG has no current postcode system', () => {
  const result = assessCongoRepublicPostalCandidate({ value: '2420000', objectKind: 'postcode', sourceKind: 'model' });
  assert.equal(result.normalizedPostcode, null);
  assert.equal(result.eligibleForPostalArea, false);
  assert.ok(result.reasons.includes('no-current-postcode-system'));
  assert.ok(result.reasons.includes('model-has-no-postal-authority'));
  assert.equal(result.postalAgidLinkAllowed, false);
});

test('keeps BP identifiers as non-postal delivery objects', () => {
  const result = assessCongoRepublicPostalCandidate({ value: 'BP 652', objectKind: 'po-box', sourceKind: 'official-reference' });
  assert.equal(result.independentAddressContextAllowed, true);
  assert.ok(result.reasons.includes('non-postal-object'));
  assert.equal(result.buildingOrAddressDetailInferred, false);
});

test('rejects administrative polygons, points, routes and AGID cells as postal surfaces', () => {
  for (const [objectKind, geometryType] of [
    ['administrative-area', 'MultiPolygon'], ['post-office', 'Point'],
    ['route', 'LineString'], ['agid-cell', 'Polygon'],
  ] as const) {
    const result = assessCongoRepublicPostalCandidate({ objectKind, geometryType, sourceKind: 'open-reference' });
    assert.equal(result.eligibleForPostalArea, false);
    assert.ok(result.reasons.includes('non-postal-geometry-proxy'));
  }
});

test('does not import Democratic Republic of the Congo postcode assignments into CG', () => {
  const result = assessCongoRepublicPostalCandidate({ value: '1000001', objectKind: 'postcode', sourceKind: 'official-reference' });
  assert.equal(result.countryCode, 'CG');
  assert.equal(result.normalizedPostcode, null);
  assert.equal(result.eligibleForPostalArea, false);
});
