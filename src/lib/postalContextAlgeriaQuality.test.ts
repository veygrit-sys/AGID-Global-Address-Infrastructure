import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessAlgeriaPostalCandidate, normalizeAlgeriaPostcodeForM2 } from './postalContextAlgeriaQuality';

test('normalizes exactly five Algeria digits without inventing a prefix', () => {
  assert.equal(normalizeAlgeriaPostcodeForM2('１６ ０２４'), '16024');
  for (const value of ['1602', '160240', 'DZ-16024', '160-24', '']) assert.equal(normalizeAlgeriaPostcodeForM2(value), null);
});

test('rejects office, mobile, route, PO box, administration, model and AGID geometry as postal areas', () => {
  const candidates = [
    { objectKind: 'postal-establishment', assignmentAuthority: 'algerie-poste-current-directory', geometryType: 'Point', geometryAuthority: 'community' },
    { objectKind: 'mobile-postal-establishment', assignmentAuthority: 'algerie-poste-current-directory', geometryType: 'LineString', geometryAuthority: 'community' },
    { objectKind: 'po-box', assignmentAuthority: 'algerie-poste-current-directory', geometryType: null, geometryAuthority: null },
    { objectKind: 'administrative-area', assignmentAuthority: 'community', geometryType: 'Polygon', geometryAuthority: 'government-administrative' },
    { objectKind: 'agid-cell', assignmentAuthority: 'community', geometryType: 'Polygon', geometryAuthority: 'community' },
    { objectKind: 'model-output', assignmentAuthority: 'model', geometryType: 'MultiPolygon', geometryAuthority: 'model' },
  ] as const;
  for (const candidate of candidates) assert.equal(assessAlgeriaPostalCandidate({ ...candidate, rightsCompatible: true, completeCurrentDenominatorEvidence: true, explicitSameCodeSurfaceBinding: true }).eligibleForPostalArea, false);
});

test('requires current complete assignment, rights and an explicitly bound postal surface', () => {
  const candidate = { value: '16024', objectKind: 'postcode', assignmentAuthority: 'algerie-poste-current-directory', geometryType: 'MultiPolygon', geometryAuthority: 'algerie-poste-postal-circumscription', rightsCompatible: true, completeCurrentDenominatorEvidence: true, explicitSameCodeSurfaceBinding: true } as const;
  const result = assessAlgeriaPostalCandidate(candidate);
  assert.equal(result.eligibleForM2Release, true);
  assert.equal(result.postalAgidLinkAllowed, true);
  for (const key of ['rightsCompatible', 'completeCurrentDenominatorEvidence', 'explicitSameCodeSurfaceBinding'] as const) {
    assert.equal(assessAlgeriaPostalCandidate({ ...candidate, [key]: false }).eligibleForM2Release, false);
  }
});

test('allows more detailed building display only through an independent explicit relation', () => {
  const candidate = { objectKind: 'building', assignmentAuthority: 'community', geometryType: 'Polygon', geometryAuthority: 'community', rightsCompatible: true } as const;
  assert.equal(assessAlgeriaPostalCandidate(candidate).exactBuildingDetailAllowed, false);
  assert.equal(assessAlgeriaPostalCandidate({ ...candidate, exactAddressBuildingRelationEvidence: true }).exactBuildingDetailAllowed, true);
});
