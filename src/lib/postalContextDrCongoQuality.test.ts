import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decomposeDrCongoPostcode, evaluateDrCongoPostalGeometryCandidate, normalizeDrCongoPostcode } from './postalContextDrCongoQuality';

const assignment = { postcode: '1004131', neighbourhood: 'RESIDENTIEL', city: 'Limete', state: 'Kinshasa' };

test('normalizes and decomposes the official seven-digit CD format without claiming assignment validity', () => {
  assert.equal(normalizeDrCongoPostcode('1004 131'), '1004131');
  assert.equal(normalizeDrCongoPostcode('1004-131'), '1004131');
  assert.deepEqual(decomposeDrCongoPostcode('1004131'), {
    postcode: '1004131', primaryArea: '10', localityOrTownship: '04',
    sectorOrNeighbourhood: '13', deliveryAreaOrPostOffice: '1', assignmentValidated: false,
  });
  assert.equal(normalizeDrCongoPostcode('１００４１３１'), '1004131');
  for (const value of ['100413', '10041310', 'ABCDEFG']) {
    assert.throws(() => normalizeDrCongoPostcode(value), /seven-digits/);
  }
});

test('rejects observed Point, broad administrative and unrelated polygons', () => {
  const point = evaluateDrCongoPostalGeometryCandidate(assignment, {
    geometryType: 'Point', sourceKind: 'open-reference', granularity: 'delivery-area-or-neighbourhood',
    name: 'Residentiel', city: 'Limete', state: 'Kinshasa', featureClass: 'place', assignmentMatched: true,
    redistributionCompatible: true, topologyValid: true,
  });
  assert.equal(point.eligibleForPostalArea, false); assert.ok(point.reasons.includes('non-areal-geometry'));

  const limete = evaluateDrCongoPostalGeometryCandidate(assignment, {
    geometryType: 'MultiPolygon', sourceKind: 'open-reference', granularity: 'city-or-township',
    name: 'Limete', city: 'Limete', state: 'Kinshasa', featureClass: 'administrative', assignmentMatched: false,
    redistributionCompatible: true, topologyValid: true,
  });
  assert.equal(limete.eligibleForPostalArea, false); assert.ok(limete.reasons.includes('wrong-granularity'));

  const health = evaluateDrCongoPostalGeometryCandidate(
    { postcode: '3202011', neighbourhood: 'BULUNGU', city: 'Bulungu', state: 'Kwilu' },
    { geometryType: 'Polygon', sourceKind: 'open-reference', granularity: 'other', name: 'Bulungu', city: 'Bulungu',
      state: 'Kwilu', featureClass: 'health', assignmentMatched: false, redistributionCompatible: true, topologyValid: true },
  );
  assert.equal(health.eligibleForPostalArea, false); assert.ok(health.reasons.includes('unrelated-feature-class'));
});

test('only an exact, rights-compatible, valid area can become a derived candidate', () => {
  const result = evaluateDrCongoPostalGeometryCandidate(assignment, {
    geometryType: 'Polygon', sourceKind: 'open-reference', granularity: 'delivery-area-or-neighbourhood',
    name: 'Résidentiel ', city: 'Limete', state: 'Kinshasa', featureClass: 'postal', assignmentMatched: true,
    redistributionCompatible: true, topologyValid: true,
  });
  assert.equal(result.eligibleForPostalArea, true); assert.equal(result.classification, 'derived-candidate');
  assert.equal(result.agidLinkAllowed, true); assert.equal(result.buildingOrAddressDetailInferred, false);
});
