import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildOpenSourceCompatibilityMatrix,
  getOpenSourceCompatibilityManifest,
  renderOpenSourceCompatibilityMermaid,
  summarizeOpenSourceCompatibility,
  validateOpenSourceCompatibilityManifest,
} from './openSourceCompatibility';
import { getSourceBoundaryEntriesByKind } from './sourceBoundary';

test('represents every open-source boundary entry as a compatibility component', () => {
  const manifest = getOpenSourceCompatibilityManifest();
  const openSourceIds = getSourceBoundaryEntriesByKind('open-source').map(entry => entry.id);

  assert.deepEqual([...manifest.components].sort(), [...openSourceIds].sort());
  assert.equal(manifest.contracts.length, 8);
  assert.equal(manifest.interopEdges.length >= 8, true);
});

test('keeps OSS contracts self-hostable and free of commercial imports', () => {
  const manifest = getOpenSourceCompatibilityManifest();

  for (const contract of manifest.contracts) {
    assert.ok(contract.stableArtifacts.length > 0, contract.id);
    assert.ok(contract.requiredReleaseGates.length > 0, contract.id);
    assert.ok(contract.mustNotImport.some(item => /hosted|managed|commercial/i.test(item)), contract.id);
    assert.ok(contract.stableArtifacts.every(path => !path.includes('/commercial/')), contract.id);
    assert.ok(
      contract.privacyBoundary.some(rule => /raw address|raw AOID|AGID-S payload|private/i.test(rule)),
      contract.id,
    );
  }
});

test('defines the OSS compatibility chain from codec to resolver, element, POS, portal, and ZK', () => {
  const matrix = buildOpenSourceCompatibilityMatrix();
  const standards = matrix.find(row => row.component === 'agid-aoid-public-standards');
  const resolver = matrix.find(row => row.component === 'local-resolver-address-display');
  const element = matrix.find(row => row.component === 'address-registration-and-element');
  const pos = matrix.find(row => row.component === 'basic-pos-terminal');
  const portal = matrix.find(row => row.component === 'address-portal-user-control');
  const zk = matrix.find(row => row.component === 'zk-baseline-open-proof-relations');

  assert.ok(standards?.outboundEdges.some(edge => edge.to === 'local-resolver-address-display'));
  assert.ok(resolver?.outboundEdges.some(edge => edge.to === 'address-registration-and-element'));
  assert.ok(element?.outboundEdges.some(edge => edge.to === 'basic-pos-terminal'));
  assert.ok(pos?.outboundEdges.some(edge => edge.to === 'address-portal-user-control'));
  assert.ok(portal?.outboundEdges.some(edge => edge.to === 'address-registration-and-element'));
  assert.ok(zk?.outboundEdges.some(edge => edge.to === 'basic-pos-terminal'));
});

test('validates OSS compatibility manifest without warnings', () => {
  const validation = validateOpenSourceCompatibilityManifest();
  const summary = summarizeOpenSourceCompatibility();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
  assert.equal(summary.componentCount, 8);
  assert.equal(summary.contractCount, 8);
  assert.equal(summary.allEdgesRedactedByDefault, true);
  assert.ok(summary.localOnlyEdges >= 3);
  assert.ok(summary.offlineFirstEdges >= 2);
  assert.equal(summary.zkReadyEdges, 1);
});

test('renders an OSS compatibility graph for docs and reviews', () => {
  const diagram = renderOpenSourceCompatibilityMermaid();

  assert.match(diagram, /Open-source compatibility contracts/);
  assert.match(diagram, /agid-aoid-public-standards/);
  assert.match(diagram, /local-only: agid-codec-test-vector-contract/);
  assert.match(diagram, /zk-ready: zk-public-signal-nullifier-contract/);
});
