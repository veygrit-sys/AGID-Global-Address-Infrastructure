import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_CROSS_CUTTING_LAYERS,
  ADDRESSQL_CROSS_CUTTING_LAYERS_VERSION,
  buildAddressQlCrossCuttingCoverage,
  validateAddressQlCrossCuttingLayers,
} from './addressQlCrossCuttingLayers';

test('AddressQL cross-cutting layers validate in priority order', () => {
  assert.equal(ADDRESSQL_CROSS_CUTTING_LAYERS_VERSION, 'addressql-cross-cutting-layers-v0.1');
  assert.deepEqual(validateAddressQlCrossCuttingLayers(), []);

  assert.deepEqual(
    ADDRESSQL_CROSS_CUTTING_LAYERS.map(layer => layer.id),
    [
      'security_privacy_zk',
      'linguistics_multilingual_nlp',
      'standards_interoperability',
      'governance_source_policy',
      'temporal_versioning',
      'developer_experience_conformance',
      'ux_address_forms',
    ],
  );
});

test('AddressQL cross-cutting coverage is substantial and function-linked', () => {
  const coverage = buildAddressQlCrossCuttingCoverage();

  assert.equal(coverage.length, 7);
  assert.ok(coverage.every(row => row.functionCount >= 5));
  assert.ok(coverage.every(row => row.artifactCount >= 4));
  assert.ok(coverage.every(row => row.gateCount >= 3));

  const security = ADDRESSQL_CROSS_CUTTING_LAYERS.find(layer => layer.id === 'security_privacy_zk');
  const standards = ADDRESSQL_CROSS_CUTTING_LAYERS.find(layer => layer.id === 'standards_interoperability');
  const ux = ADDRESSQL_CROSS_CUTTING_LAYERS.find(layer => layer.id === 'ux_address_forms');

  assert.ok(security?.addressQlFunctions.includes('ADDRESS_HASH'));
  assert.ok(security?.releaseGates.some(gate => /ADDRESS_POLICY_CHECK|policy check/i.test(gate)));
  assert.ok(standards?.requiredArtifacts.some(artifact => /JSON Schema/.test(artifact)));
  assert.ok(ux?.releaseGates.some(gate => /must not invent postal codes/.test(gate)));
});

test('AddressQL cross-cutting docs expose priority order and release gates', () => {
  const readme = readFileSync('docs/addressql/README.md', 'utf8');
  const research = readFileSync('docs/addressql/research-plan.md', 'utf8');
  const layers = readFileSync('docs/addressql/cross-cutting-layers.md', 'utf8');

  assert.match(readme, /cross-cutting-layers\.md/);
  assert.match(research, /Cross-Cutting Layers/);
  assert.match(layers, /Security \/ Privacy \/ ZK/);
  assert.match(layers, /Linguistics \/ Multilingual \/ NLP/);
  assert.match(layers, /Standards \/ Interoperability/);
  assert.match(layers, /Governance \/ Source Policy \/ Licensing/);
  assert.match(layers, /Temporal \/ Versioning/);
  assert.match(layers, /Developer Experience \/ Conformance/);
  assert.match(layers, /UX \/ Address Forms/);
  assert.match(layers, /forms must not invent postal codes/);
});
