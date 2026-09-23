import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGID_ADDRESS_NORMALIZATION_VECTOR_COUNT,
  buildAgidAddressNormalizationBenchmarkVectors,
  runAgidAddressNormalizationBenchmark,
} from './agidAddressNormalizationBenchmark';

test('AGID benchmark deterministically generates 10,000 synthetic variants', () => {
  const vectors = buildAgidAddressNormalizationBenchmarkVectors();

  assert.equal(vectors.length, AGID_ADDRESS_NORMALIZATION_VECTOR_COUNT);
  assert.equal(new Set(vectors.map(vector => vector.id)).size, vectors.length);
  assert.ok(vectors.every(vector => vector.synthetic));
  assert.equal(new Set(vectors.map(vector => vector.variation)).size, 10);
  assert.equal(
    new Set(vectors.map(vector =>
      vector.input.countryCode.normalize('NFKC').toUpperCase())).size,
    10,
  );
});

test('AGID normalization and boundary benchmark clears quantitative gates', () => {
  const report = runAgidAddressNormalizationBenchmark();

  assert.equal(report.vectorCount, 10_000);
  assert.equal(report.normalizationFailures, 0, report.sampleFailureIds.join(', '));
  assert.equal(report.normalizationSuccessRate, 1);
  assert.equal(report.boundaryChecks, 2_000);
  assert.equal(report.boundaryErrors, 0);
  assert.equal(report.boundaryValueErrorRate, 0);
  assert.equal(report.subPremiseSeparationChecks, 1_000);
  assert.equal(report.subPremiseLeakageErrors, 0);
  assert.equal(report.subPremiseLeakageRate, 0);
  assert.equal(report.passed, true);
  assert.equal(report.privacy.syntheticOnly, true);
  assert.equal(report.privacy.containsRealAddressData, false);
});
