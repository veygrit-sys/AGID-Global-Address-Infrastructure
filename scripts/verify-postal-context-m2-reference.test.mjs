import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyPostalContextM2Reference } from './verify-postal-context-m2-reference.mjs';

test('Mexico is a complete reusable Postal Context M2 reference', () => {
  const result = verifyPostalContextM2Reference();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.countryCode, 'MX');
  assert.equal(result.releaseId, 'mx-sepomex-postal-polygons-2025-20260901');
  assert.deepEqual(result.counts, {
    nodes: 35899,
    assertions: 35898,
    features: 35898,
    positions: 1065949
  });
  assert.deepEqual(result.browserEvidence, {
    verdict: 'pass',
    manualVisualInspection: false,
    selectedBluePixels: 127857,
    clearedBluePixels: 32207,
    reSearchBluePixels: 116856
  });
  assert.deepEqual(result.samples.map(sample => ({
    postalCode: sample.postalCode,
    postalContextId: sample.postalContextId,
    geometryFeatureId: sample.geometryFeatureId,
    contextId: sample.contextId,
    assertionId: sample.assertionId
  })), [
    {
      postalCode: '06000',
      postalContextId: 'postal-mx-06000',
      geometryFeatureId: 'mx-derived-06000',
      contextId: 'country-mx',
      assertionId: 'sepomex-mx-2025-06000-part-of-mx'
    },
    {
      postalCode: '01000',
      postalContextId: 'postal-mx-01000',
      geometryFeatureId: 'mx-derived-01000',
      contextId: 'country-mx',
      assertionId: 'sepomex-mx-2025-01000-part-of-mx'
    }
  ]);
});
