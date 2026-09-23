import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  assessCeutaMelillaOfficialViewFeature,
  classifyCeutaMelillaPostalScope,
} from './postalContextCeutaMelillaQuality';

test('classifies EA prefixes without merging Ceuta and Melilla', () => {
  assert.equal(classifyCeutaMelillaPostalScope('51001'), 'ceuta');
  assert.equal(classifyCeutaMelillaPostalScope('52001'), 'melilla');
  assert.equal(classifyCeutaMelillaPostalScope('28013'), null);
});

test('accepts a topologically valid official-view Polygon but never makes it production eligible', () => {
  const assessment = assessCeutaMelillaOfficialViewFeature({
    properties: { cod_postal: '51001' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-5.33, 35.88],
        [-5.30, 35.88],
        [-5.30, 35.90],
        [-5.33, 35.90],
        [-5.33, 35.88],
      ]],
    },
  });
  assert.equal(assessment.valid, true);
  assert.equal(assessment.scope, 'ceuta');
  assert.equal(assessment.geometryType, 'Polygon');
  assert.equal(assessment.positionCount, 5);
  assert.equal(assessment.productionEligible, false);
});

test('rejects prefix/bbox mismatch and invalid surface topology', () => {
  const assessment = assessCeutaMelillaOfficialViewFeature({
    properties: { cod_postal: '52001' },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-5.33, 35.88],
        [-5.30, 35.90],
        [-5.33, 35.90],
        [-5.30, 35.88],
        [-5.33, 35.88],
      ]],
    },
  });
  assert.equal(assessment.valid, false);
  assert.ok(assessment.reasons.includes('self-intersection'));
  assert.ok(assessment.reasons.includes('postcode-prefix-and-territory-bbox-mismatch'));
});
