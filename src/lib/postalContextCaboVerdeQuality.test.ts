import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  assessCaboVerdePostalCandidate,
  normalizeCaboVerdePostcode,
} from './postalContextCaboVerdeQuality';

test('normalizes only the canonical four-digit Cabo Verde postcode object', () => {
  assert.equal(normalizeCaboVerdePostcode('7600'), '7600');
  assert.equal(normalizeCaboVerdePostcode('７６ ００'), '7600');
  for (const value of ['760', '76000', 'CV-7600', '7937-049', 'CIP 7600', '']) {
    assert.equal(normalizeCaboVerdePostcode(value), null);
  }
});

test('keeps current Correios FAQ examples as reference evidence rather than a complete M2 denominator', () => {
  for (const value of ['7600', '7601', '7602']) {
    const result = assessCaboVerdePostalCandidate({
      value,
      objectKind: 'postcode',
      assignmentAuthority: 'correios-example',
      geometryType: null,
      rightsCompatible: false,
      completeDenominatorEvidence: false,
    });
    assert.equal(result.normalizedPostcode, value);
    assert.equal(result.eligibleForM2Release, false);
    assert.ok(result.reasons.includes('current-assignment-authority-missing'));
    assert.ok(result.reasons.includes('complete-current-denominator-missing'));
    assert.ok(result.reasons.includes('postal-geometry-missing'));
  }
});

test('does not strip operator NNNN-NNN contact identifiers into four-digit postcodes', () => {
  const result = assessCaboVerdePostalCandidate({
    value: '7937-049',
    objectKind: 'operator-contact-identifier',
    assignmentAuthority: 'contact-page',
    geometryType: 'Point',
    geometryAuthority: 'community',
    rightsCompatible: false,
    completeDenominatorEvidence: false,
  });
  assert.equal(result.normalizedPostcode, null);
  assert.equal(result.eligibleForPostalArea, false);
  assert.ok(result.reasons.includes('operator-contact-identifier-not-canonical-postcode'));
  assert.ok(result.reasons.includes('non-area-geometry'));
});

test('rejects CIP, INGT administration, OSM, models and AGID cells as postal-area authority', () => {
  const candidates = [
    { value: '7600', objectKind: 'cip', assignmentAuthority: 'cip-private', geometryType: 'Point', geometryAuthority: 'community' },
    { value: '7600', objectKind: 'administrative-area', assignmentAuthority: 'upu-format', geometryType: 'Polygon', geometryAuthority: 'ingt-administrative' },
    { value: '7600', objectKind: 'agid-cell', assignmentAuthority: 'community', geometryType: 'Polygon', geometryAuthority: 'community' },
    { value: '7600', objectKind: 'model-output', assignmentAuthority: 'model', geometryType: 'MultiPolygon', geometryAuthority: 'model' },
  ] as const;
  for (const candidate of candidates) {
    const result = assessCaboVerdePostalCandidate({
      ...candidate,
      rightsCompatible: true,
      completeDenominatorEvidence: true,
    });
    assert.equal(result.eligibleForPostalArea, false);
    assert.equal(result.postalAgidLinkAllowed, false);
  }
  const model = assessCaboVerdePostalCandidate({
    value: '7600', objectKind: 'model-output', assignmentAuthority: 'model',
    geometryType: 'Polygon', geometryAuthority: 'model', rightsCompatible: true,
    completeDenominatorEvidence: true,
  });
  assert.ok(model.reasons.includes('model-has-no-postal-authority'));
});

test('requires all authority, denominator, geometry and rights gates before allowing a postal AGID link', () => {
  const result = assessCaboVerdePostalCandidate({
    value: '7600', objectKind: 'postcode', assignmentAuthority: 'correios-current-assignment',
    geometryType: 'MultiPolygon', geometryAuthority: 'correios-postal-area',
    rightsCompatible: true, completeDenominatorEvidence: true,
  });
  assert.equal(result.eligibleForPostalArea, true);
  assert.equal(result.eligibleForM2Release, true);
  assert.equal(result.classification, 'official');
  assert.equal(result.postalAgidLinkAllowed, true);
});

test('allows building detail only from a separate exact relation and never infers it', () => {
  const withoutRelation = assessCaboVerdePostalCandidate({
    objectKind: 'building', assignmentAuthority: 'community', geometryType: 'Polygon',
    geometryAuthority: 'community', rightsCompatible: true,
  });
  const withRelation = assessCaboVerdePostalCandidate({
    objectKind: 'building', assignmentAuthority: 'community', geometryType: 'Polygon',
    geometryAuthority: 'community', rightsCompatible: true, exactBuildingRelationEvidence: true,
  });
  assert.equal(withoutRelation.exactBuildingDetailAllowed, false);
  assert.equal(withRelation.exactBuildingDetailAllowed, true);
  assert.equal(withRelation.buildingOrAddressDetailInferred, false);
});
