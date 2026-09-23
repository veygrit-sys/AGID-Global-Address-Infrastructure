import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildBackendOnlyOpenSourceAccuracyMatrix,
  evaluateBackendOnlyOpenSourceManifest,
  getBackendOnlyOpenSourceManifest,
  summarizeBackendOnlyOpenSource,
} from './backendOnlyOpenSource';
import { getSourceBoundaryEntry } from '../lib/sourceBoundary';

test('organizes backend-only open-source capabilities without UI dependencies', () => {
  const manifest = getBackendOnlyOpenSourceManifest();

  assert.equal(manifest.capabilities.length, 10);
  assert.match(manifest.principle, /self-hostable/);
  assert.match(manifest.hardRules.join('\n'), /No backend-only OSS capability may require raw address/);

  for (const capability of manifest.capabilities) {
    assert.equal(capability.noUiContract, true, capability.id);
    assert.ok(capability.currentPaths.length > 0, capability.id);
    assert.ok(capability.publicArtifacts.length > 0, capability.id);
    assert.ok(capability.currentPaths.every(path => !path.startsWith('src/components/')), capability.id);
    assert.ok(capability.currentPaths.every(path => !/Screen\.tsx$/.test(path)), capability.id);
  }
});

test('keeps backend-only OSS capabilities inside public source boundaries', () => {
  const manifest = getBackendOnlyOpenSourceManifest();

  for (const capability of manifest.capabilities) {
    for (const boundaryId of capability.sourceBoundaryIds) {
      const boundary = getSourceBoundaryEntry(boundaryId);

      assert.ok(boundary, `${capability.id}:${boundaryId}`);
      assert.notEqual(boundary.boundary, 'commercial', `${capability.id}:${boundaryId}`);
      assert.notEqual(boundary.license, 'Commercial', `${capability.id}:${boundaryId}`);
    }
  }
});

test('evaluates backend-only OSS accuracy with release gates and redaction', () => {
  const evaluation = evaluateBackendOnlyOpenSourceManifest();
  const summary = summarizeBackendOnlyOpenSource();

  assert.equal(evaluation.valid, true);
  assert.deepEqual(evaluation.errors, []);
  assert.deepEqual(evaluation.warnings, []);
  assert.equal(evaluation.capabilityCount, 10);
  assert.equal(evaluation.publishReadyCount, 10);
  assert.equal(evaluation.blockedCount, 0);
  assert.ok(evaluation.averageScore >= 95);
  assert.equal(summary.blockedCount, 0);
  assert.equal(summary.byTier.deterministic, 4);
  assert.equal(summary.byTier['source-backed'], 4);
  assert.equal(summary.byTier['candidate-scored'], 2);
});

test('requires every backend-only capability to expose safe accuracy signals', () => {
  const manifest = getBackendOnlyOpenSourceManifest();

  for (const capability of manifest.capabilities) {
    assert.ok(capability.accuracySignals.includes('schema-validation'), capability.id);
    assert.ok(capability.accuracySignals.includes('no-raw-address-gate'), capability.id);
    assert.ok(capability.accuracySignals.length >= 5, capability.id);
    assert.ok(capability.releaseGates.length >= 3, capability.id);
    assert.ok(capability.minimumSourceEvidence.length >= 3, capability.id);
    assert.match(capability.fallbackBehavior, /Reject|Return|Queue|Downgrade|Keep|Publish|Block|Store/i, capability.id);
  }
});

test('documents connector accuracy without production traffic or raw Oracle errors', () => {
  const matrix = buildBackendOnlyOpenSourceAccuracyMatrix();
  const connector = matrix.find(item => item.id === 'backend-connector-contracts');

  assert.ok(connector);
  assert.equal(connector.network, 'optional-user-configured');
  assert.equal(connector.readiness, 'publish-ready');
  assert.ok(connector.gates.includes('no-cache-connector-fetch'));
  assert.ok(connector.gates.includes('no-unsafe-retry'));
  assert.ok(connector.gates.includes('redacted-error-contract'));
  assert.match(connector.fallback, /unsafe retry/);
});

test('separates country-pack validation from generated postal-zone candidates', () => {
  const matrix = buildBackendOnlyOpenSourceAccuracyMatrix();
  const countryPack = matrix.find(item => item.id === 'backend-country-pack-validator');
  const postalForge = matrix.find(item => item.id === 'backend-postal-forge-pack-generator');

  assert.ok(countryPack);
  assert.ok(postalForge);
  assert.equal(countryPack.accuracyTier, 'source-backed');
  assert.equal(postalForge.accuracyTier, 'candidate-scored');
  assert.ok(countryPack.gates.includes('yaml-source-json-delivery'));
  assert.ok(postalForge.gates.includes('manual-review-required-for-generated-zones'));
  assert.match(postalForge.fallback, /candidate-scored/);
});
