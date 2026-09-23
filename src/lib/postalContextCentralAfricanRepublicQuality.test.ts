import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessCentralAfricanRepublicPostalCandidate } from './postalContextCentralAfricanRepublicQuality';

test('rejects postcode-like digits because CF has no current postcode system', () => {
  const result = assessCentralAfricanRepublicPostalCandidate({
    value: '1046', objectKind: 'postcode', sourceKind: 'model',
  });
  assert.equal(result.normalizedPostcode, null);
  assert.equal(result.eligibleForPostalArea, false);
  assert.ok(result.reasons.includes('no-current-postcode-system'));
  assert.ok(result.reasons.includes('model-has-no-postal-authority'));
  assert.equal(result.postalAgidLinkAllowed, false);
});

test('keeps BP identifiers as non-postal delivery objects', () => {
  const result = assessCentralAfricanRepublicPostalCandidate({
    value: 'BP 1046', objectKind: 'po-box', sourceKind: 'official-reference',
  });
  assert.equal(result.independentAddressContextAllowed, true);
  assert.ok(result.reasons.includes('non-postal-object'));
  assert.equal(result.buildingOrAddressDetailInferred, false);
});

test('rejects administrative polygons, points, routes and AGID cells as postal surfaces', () => {
  for (const [objectKind, geometryType] of [
    ['administrative-area', 'MultiPolygon'], ['post-office', 'Point'],
    ['route', 'LineString'], ['agid-cell', 'Polygon'],
  ] as const) {
    const result = assessCentralAfricanRepublicPostalCandidate({
      objectKind, geometryType, sourceKind: 'open-reference',
    });
    assert.equal(result.eligibleForPostalArea, false);
    assert.ok(result.reasons.includes('non-postal-geometry-proxy'));
  }
});
