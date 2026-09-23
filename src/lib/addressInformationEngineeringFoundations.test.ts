import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESS_INFORMATION_AXIOMS,
  ADDRESS_INFORMATION_KINDS,
  ADDRESS_INFORMATION_LAYER_CONTRACTS,
  ADDRESS_INFORMATION_OPERATIONS,
  ADDRESS_INFORMATION_STANDARD_BRIDGES,
  buildAddressInformationEngineeringFoundationsReport,
  validateAddressInformationEngineeringFoundations,
} from './addressInformationEngineeringFoundations';

test('address information engineering foundations validate as a safe registry', () => {
  const report = buildAddressInformationEngineeringFoundationsReport();

  assert.deepEqual(validateAddressInformationEngineeringFoundations(), []);
  assert.equal(report.kindCount, 10);
  assert.equal(report.axiomCount, 8);
  assert.equal(report.layerCount, 8);
  assert.equal(report.validationErrors.length, 0);
  assert.equal(report.safetyBoundaries.typeSeparation, true);
  assert.equal(report.safetyBoundaries.safeNonEmission, true);
  assert.equal(report.safetyBoundaries.noUniversalValidation, true);
});

test('foundation keeps expression, referent, identifier, proof, and receipt as different kinds', () => {
  const kinds = new Set(ADDRESS_INFORMATION_KINDS);
  const typeSeparation = ADDRESS_INFORMATION_AXIOMS.find(axiom => axiom.id === 'A1-type-separation');

  for (const required of ['expression', 'referent', 'identifier', 'proof', 'receipt']) {
    assert.ok(kinds.has(required as never), `${required} should be a first-class kind`);
  }
  assert.ok(typeSeparation);
  assert.match(typeSeparation.nonClaim, /does not make expression, referent, identifier, proof, and receipt the same type/);
});

test('central operations preserve non-identity and non-repair boundaries', () => {
  const normalize = ADDRESS_INFORMATION_OPERATIONS.find(operation => operation.name === 'normalize');
  const resolve = ADDRESS_INFORMATION_OPERATIONS.find(operation => operation.name === 'resolve');
  const prove = ADDRESS_INFORMATION_OPERATIONS.find(operation => operation.name === 'prove');
  const render = ADDRESS_INFORMATION_OPERATIONS.find(operation => operation.name === 'render');

  assert.ok(normalize);
  assert.match(normalize.nonClaims.join(' '), /not referent resolution/);
  assert.ok(resolve?.inputKinds.includes('source'));
  assert.ok(resolve?.inputKinds.includes('lineage'));
  assert.ok(resolve?.inputKinds.includes('policy'));
  assert.ok(prove);
  assert.equal(prove.outputKinds.includes('proof'), true);
  assert.match(prove.nonClaims.join(' '), /does not repair a bad address resolution/);
  assert.match(render?.nonClaims.join(' ') ?? '', /not the inverse/);
});

test('each address information layer declares failure states and non-claims', () => {
  assert.deepEqual(
    ADDRESS_INFORMATION_LAYER_CONTRACTS.map(layer => layer.id),
    [
      'mathematics-information-theory',
      'data-models',
      'spatial-theory',
      'temporal-theory',
      'quality-theory',
      'computation-theory',
      'distributed-infrastructure',
      'congestion-performance-theory',
    ],
  );
  assert.ok(ADDRESS_INFORMATION_LAYER_CONTRACTS.every(layer => layer.failureStates.length >= 2));
  assert.ok(ADDRESS_INFORMATION_LAYER_CONTRACTS.every(layer => layer.nonClaims.length > 0));
});

test('standard bridges are compatibility layers, not replacement claims', () => {
  const bridges = new Map(ADDRESS_INFORMATION_STANDARD_BRIDGES.map(bridge => [bridge.standard, bridge]));

  assert.equal(bridges.get('ISO 19160')?.role, 'conceptual_model');
  assert.equal(bridges.get('UPU S42 / ISO 19160-4')?.role, 'postal_template');
  assert.equal(bridges.get('OGC GeoSPARQL')?.role, 'spatial_semantics');
  assert.equal(bridges.get('W3C Verifiable Credentials')?.role, 'credential_proof');
  assert.equal(bridges.get('W3C DID Core')?.role, 'identifier_resolution');
  assert.match(bridges.get('UPU S42 / ISO 19160-4')?.nonClaims.join(' ') ?? '', /not referent resolution/);
  assert.match(bridges.get('W3C DID Core')?.nonClaims.join(' ') ?? '', /not a postal address/);
});

test('research note states the executable foundation boundaries', () => {
  const doc = readFileSync('docs/research/address-information-engineering-foundations-for-address-research-ja.md', 'utf8');

  assert.match(doc, /surface expression != referent != identifier != credential != proof != receipt/);
  assert.match(doc, /ZK proof が住所解決の誤りを修復すると言わない/);
  assert.match(doc, /addressInformationEngineeringFoundations/);
  assert.match(doc, /ISO 19160/);
  assert.match(doc, /UPU S42/);
  assert.match(doc, /OGC GeoSPARQL/);
});

test('porting plan keeps address-research migration raw-address-free and testable', () => {
  const doc = readFileSync('docs/research/address-information-engineering-foundations-porting.md', 'utf8');

  assert.match(doc, /dawnportinfo-design\/address-research/);
  assert.match(doc, /src\/addressInformationEngineeringFoundations\.js/);
  assert.match(doc, /tests\/addressInformationEngineeringFoundations\.test\.js/);
  assert.match(doc, /verify:address-information-engineering-foundations/);
  assert.match(doc, /verify:address-research-foundations-port-preview/);
  assert.match(doc, /temporary clone/);
  assert.match(doc, /Do not port:/);
  assert.match(doc, /raw address examples/);
  assert.match(doc, /proof witnesses/);
  assert.match(doc, /ZK proof fixes wrong address resolution/);
});
