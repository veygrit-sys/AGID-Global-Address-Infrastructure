import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessDjiboutiPostalCandidate, decodeDjiboutiPostcode, DJIBOUTI_UPU_2020_REFERENCE_POSTCODES, normalizeDjiboutiPostcode } from './postalContextDjiboutiQuality';

test('normalizes exactly five numeric Djibouti digits and exposes dated digit semantics', () => {
  assert.equal(normalizeDjiboutiPostcode('７７ １０１'), '77101');
  assert.deepEqual(decodeDjiboutiPostcode('77601'), { normalized: '77601', countryDigit: '7', regionDigit: '7', postOfficeDigits: '601' });
  for (const value of ['7710', '771010', 'DJ-77101', 'BP 1663', '']) assert.equal(normalizeDjiboutiPostcode(value), null);
});

test('keeps all ten UPU 05/2020 rows as dated references, not a complete current denominator', () => {
  assert.equal(DJIBOUTI_UPU_2020_REFERENCE_POSTCODES.size, 10);
  for (const value of DJIBOUTI_UPU_2020_REFERENCE_POSTCODES) {
    const result = assessDjiboutiPostalCandidate({ value, objectKind: 'postcode', assignmentAuthority: 'upu-2020-reference', geometryType: null, rightsCompatible: false, completeDenominatorEvidence: false });
    assert.equal(result.eligibleForM2Release, false);
    assert.ok(result.reasons.includes('current-assignment-authority-missing'));
    assert.ok(result.reasons.includes('complete-current-denominator-missing'));
    assert.ok(result.reasons.includes('postal-geometry-missing'));
  }
});

test('rejects administration, office points, routes, OSM, models and AGID cells as postal polygons', () => {
  const candidates = [
    { objectKind: 'administrative-area', assignmentAuthority: 'upu-2020-reference', geometryType: 'Polygon', geometryAuthority: 'government-administrative' },
    { objectKind: 'post-office', assignmentAuthority: 'community', geometryType: 'Point', geometryAuthority: 'community' },
    { objectKind: 'route', assignmentAuthority: 'community', geometryType: 'LineString', geometryAuthority: 'community' },
    { objectKind: 'agid-cell', assignmentAuthority: 'community', geometryType: 'Polygon', geometryAuthority: 'community' },
    { objectKind: 'model-output', assignmentAuthority: 'model', geometryType: 'MultiPolygon', geometryAuthority: 'model' },
  ] as const;
  for (const candidate of candidates) assert.equal(assessDjiboutiPostalCandidate({ ...candidate, rightsCompatible: true, completeDenominatorEvidence: true }).eligibleForPostalArea, false);
});

test('requires current authority, complete denominator, rights and exact postal area for an AGID link', () => {
  const result = assessDjiboutiPostalCandidate({ value: '77101', objectKind: 'postcode', assignmentAuthority: 'laposte-current-assignment', geometryType: 'MultiPolygon', geometryAuthority: 'laposte-postal-area', rightsCompatible: true, completeDenominatorEvidence: true });
  assert.equal(result.eligibleForM2Release, true);
  assert.equal(result.postalAgidLinkAllowed, true);
});

test('allows more detailed building context only through a separate explicit relation', () => {
  const candidate = { objectKind: 'building', assignmentAuthority: 'community', geometryType: 'Polygon', geometryAuthority: 'community', rightsCompatible: true } as const;
  assert.equal(assessDjiboutiPostalCandidate(candidate).exactBuildingDetailAllowed, false);
  assert.equal(assessDjiboutiPostalCandidate({ ...candidate, exactBuildingRelationEvidence: true }).exactBuildingDetailAllowed, true);
});
