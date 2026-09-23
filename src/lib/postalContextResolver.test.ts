import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
  validatePostalContextGraph,
  type PostalContextAssertion,
  type PostalContextGraph,
  type PostalContextNode,
  type PostalContextSource,
} from './postalContextGraph';
import { resolvePostalContext } from './postalContextResolver';

const RANGE = { from: '2026-01-01T00:00:00.000Z' } as const;
const DIGEST = `sha256:${'a'.repeat(64)}` as const;

const assignmentSource: PostalContextSource = {
  sourceId: 'jp-synthetic-assignment',
  sourceType: 'synthetic',
  assignmentAuthority: 'synthetic_fixture_assignment',
  geometryAuthority: 'none',
  sourceVersion: 'jp-synthetic-v1',
  licenseId: 'AGID-SYNTHETIC-ONLY',
  digest: DIGEST,
};

const geometrySource: PostalContextSource = {
  sourceId: 'jp-synthetic-geometry',
  sourceType: 'synthetic',
  assignmentAuthority: 'none',
  geometryAuthority: 'synthetic_fixture_geometry',
  sourceVersion: 'jp-synthetic-v1',
  licenseId: 'AGID-SYNTHETIC-ONLY',
  digest: DIGEST,
};

const linkedSource: PostalContextSource = {
  sourceId: 'jp-synthetic-crosswalk',
  sourceType: 'synthetic',
  assignmentAuthority: 'synthetic_fixture_assignment',
  geometryAuthority: 'synthetic_fixture_geometry',
  sourceVersion: 'jp-synthetic-v1',
  licenseId: 'AGID-SYNTHETIC-ONLY',
  digest: DIGEST,
};

function node(
  id: string,
  kind: PostalContextNode['kind'],
  featureKind: PostalContextNode['featureKind'],
  extra: Partial<PostalContextNode> = {},
): PostalContextNode {
  return {
    id,
    kind,
    featureKind,
    geometryType: 'none',
    countryCode: 'JP',
    ...extra,
  };
}

function assertion(
  id: string,
  fromNodeId: string,
  toNodeId: string,
  relation: PostalContextAssertion['relation'],
  method: PostalContextAssertion['method'],
  source: PostalContextSource,
  extra: Partial<PostalContextAssertion> = {},
): PostalContextAssertion {
  return {
    id,
    fromNodeId,
    toNodeId,
    relation,
    validTime: RANGE,
    knownTime: RANGE,
    source,
    method,
    quality: { status: 'verified' },
    ...extra,
  };
}

function graph(
  nodes: PostalContextNode[],
  assertions: PostalContextAssertion[],
): PostalContextGraph {
  return {
    schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
    release: {
      schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
      repositoryId: 'agid-postal-jp',
      repositoryUrl: 'https://example.invalid/agid-postal-jp',
      countryCode: 'JP',
      releaseId: 'jp-synthetic-2026.01.1',
      policyVersion: 'jp-display-v0.1',
      releasedAt: '2026-01-02T00:00:00.000Z',
      validTime: RANGE,
      manifestDigest: DIGEST,
      artifacts: [{
        path: 'synthetic/context.json',
        mediaType: 'application/json',
        digest: DIGEST,
        recordCount: nodes.length,
        licenseRefs: ['AGID-SYNTHETIC-ONLY'],
      }],
    },
    nodes,
    assertions,
  };
}

function resolve(testGraph: PostalContextGraph, purpose: 'display' | 'navigation' = 'display') {
  return resolvePostalContext({
    graph: testGraph,
    startNodeId: 'query',
    purpose,
    validAt: '2026-06-01T00:00:00.000Z',
  });
}

test('Postal polygon containment alone stops at postal-area', () => {
  const testGraph = graph([
    node('query', 'query_point', 'query_point', { geometryType: 'point' }),
    node('postal-spatial', 'postal_feature', 'standard_area', {
      geometryType: 'polygon',
      postalCode: '000-0001',
      label: '架空郵便領域',
    }),
  ], [
    assertion(
      'a-spatial-postal',
      'query',
      'postal-spatial',
      'postal_contains',
      'geometry_contains',
      geometrySource,
    ),
  ]);

  const result = resolve(testGraph);

  assert.equal(result.status, 'partial');
  assert.equal(result.resolvedLevel, 'postal_area');
  assert.equal(result.capabilities.postalArea, true);
  assert.equal(result.capabilities.premise, false);
  assert.equal(result.capabilities.building, false);
  assert.deepEqual(result.ambiguities, ['spatial_postal_only']);
});

test('direct AddressRecord evidence raises the ceiling to premise', () => {
  const testGraph = graph([
    node('query', 'address_point', 'query_point', { geometryType: 'point' }),
    node('premise', 'address_record', 'premise', { label: '架空検証町 1-2' }),
    node('postal', 'postal_feature', 'standard_area', { postalCode: '000-0002' }),
  ], [
    assertion('a-locates', 'query', 'premise', 'locates', 'direct_source_link', linkedSource),
    assertion('a-postal', 'premise', 'postal', 'postal_assigned', 'explicit_assignment', assignmentSource),
  ]);

  const result = resolve(testGraph);

  assert.equal(result.status, 'unique');
  assert.equal(result.resolvedLevel, 'premise');
  assert.equal(result.capabilities.premise, true);
  assert.ok(result.candidates[0].components.some(component => component.nodeId === 'premise'));
});

test('a direct AddressRecord-to-Building link safely exposes a sourced building name', () => {
  const testGraph = graph([
    node('query', 'address_point', 'query_point', { geometryType: 'point' }),
    node('premise', 'address_record', 'premise', { label: '架空検証町 3-4' }),
    node('postal', 'postal_feature', 'standard_area', { postalCode: '000-0003' }),
    node('building', 'building', 'building', {
      geometryType: 'polygon',
      label: '架空AGIDビル',
    }),
  ], [
    assertion('a-locates', 'query', 'premise', 'locates', 'direct_source_link', linkedSource),
    assertion('a-postal', 'premise', 'postal', 'postal_assigned', 'explicit_assignment', assignmentSource),
    assertion('a-building', 'premise', 'building', 'addresses', 'official_crosswalk', linkedSource),
  ]);

  const result = resolve(testGraph);
  const building = result.candidates[0].components.find(component => component.nodeId === 'building');

  assert.equal(result.status, 'unique');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(building?.label, '架空AGIDビル');
  assert.equal(building?.assertionId, 'a-building');
});

test('geometry proximity never promotes a building or its name', () => {
  const testGraph = graph([
    node('query', 'query_point', 'query_point', { geometryType: 'point' }),
    node('postal', 'postal_feature', 'standard_area', { postalCode: '000-0004' }),
    node('near-building', 'building', 'building', {
      geometryType: 'polygon',
      label: '推測してはいけない建物名',
    }),
  ], [
    assertion('a-spatial-postal', 'query', 'postal', 'postal_contains', 'geometry_contains', geometrySource),
    assertion('a-near-building', 'query', 'near-building', 'addresses', 'nearest', geometrySource),
  ]);

  const result = resolve(testGraph);

  assert.equal(result.status, 'partial');
  assert.equal(result.resolvedLevel, 'postal_area');
  assert.equal(result.capabilities.building, false);
  assert.ok(result.candidates[0].components.every(component => component.nodeId !== 'near-building'));
});

test('multiple directly linked buildings remain ambiguous and stop at premise', () => {
  const testGraph = graph([
    node('query', 'address_point', 'query_point', { geometryType: 'point' }),
    node('premise', 'address_record', 'premise', { label: '架空検証町 5-6' }),
    node('building-a', 'building', 'building', { label: '架空A棟' }),
    node('building-b', 'building', 'building', { label: '架空B棟' }),
  ], [
    assertion('a-locates', 'query', 'premise', 'locates', 'direct_source_link', linkedSource),
    assertion('a-building-a', 'premise', 'building-a', 'addresses', 'official_crosswalk', linkedSource),
    assertion('a-building-b', 'premise', 'building-b', 'addresses', 'official_crosswalk', linkedSource),
  ]);

  const result = resolve(testGraph);

  assert.equal(result.status, 'ambiguous');
  assert.equal(result.candidates[0].resolvedLevel, 'premise');
  assert.deepEqual(result.candidates[0].ambiguousNodeIds.sort(), ['building-a', 'building-b']);
  assert.ok(result.ambiguities.includes('multiple_buildings'));
});

test('explicit postal assignment wins display selection but a spatial mismatch remains conflict', () => {
  const testGraph = graph([
    node('query', 'address_point', 'query_point', { geometryType: 'point' }),
    node('premise', 'address_record', 'premise'),
    node('postal-direct', 'postal_feature', 'standard_area', { postalCode: '000-0005' }),
    node('postal-spatial', 'postal_feature', 'standard_area', { postalCode: '000-0006' }),
  ], [
    assertion('a-locates', 'query', 'premise', 'locates', 'direct_source_link', linkedSource),
    assertion('a-direct', 'premise', 'postal-direct', 'postal_assigned', 'explicit_assignment', assignmentSource),
    assertion('a-spatial', 'query', 'postal-spatial', 'postal_contains', 'geometry_contains', geometrySource),
  ]);

  const result = resolve(testGraph);
  const postalComponents = result.candidates[0].components.filter(component =>
    component.kind === 'postal_feature');

  assert.equal(result.status, 'conflict');
  assert.deepEqual(postalComponents.map(component => component.postalCode), ['000-0005']);
  assert.ok(result.ambiguities.includes('postal_assignment_conflict'));
});

test('expired assertions do not leak into a current address and report a temporal gap', () => {
  const expired = { from: '2024-01-01T00:00:00.000Z', to: '2025-01-01T00:00:00.000Z' };
  const testGraph = graph([
    node('query', 'address_point', 'query_point', { geometryType: 'point' }),
    node('old-premise', 'address_record', 'premise', { label: '廃止済み架空住所' }),
  ], [
    assertion('a-old', 'query', 'old-premise', 'locates', 'direct_source_link', linkedSource, {
      validTime: expired,
      knownTime: expired,
    }),
  ]);

  const result = resolve(testGraph);

  assert.equal(result.status, 'no_match');
  assert.equal(result.resolvedLevel, 'none');
  assert.ok(result.ambiguities.includes('temporal_gap'));
});

test('public resolution excludes private units even when the graph contains one', () => {
  const testGraph = graph([
    node('query', 'address_point', 'query_point', { geometryType: 'point' }),
    node('premise', 'address_record', 'premise'),
    node('building', 'building', 'building', { label: '架空集合住宅' }),
    node('unit', 'unit', 'premise', { label: '非公開101号室', visibility: 'private' }),
  ], [
    assertion('a-locates', 'query', 'premise', 'locates', 'direct_source_link', linkedSource),
    assertion('a-building', 'premise', 'building', 'addresses', 'official_crosswalk', linkedSource),
    assertion('a-unit', 'premise', 'unit', 'addresses', 'explicit_assignment', linkedSource),
  ]);

  const validation = validatePostalContextGraph(testGraph);
  const result = resolve(testGraph);

  assert.equal(validation.valid, true);
  assert.equal(result.status, 'unique');
  assert.equal(result.resolvedLevel, 'building');
  assert.equal(result.capabilities.unit, false);
  assert.ok(result.candidates[0].components.every(component => component.nodeId !== 'unit'));
});

test('navigation can resolve a sourced entrance without changing display resolution', () => {
  const testGraph = graph([
    node('query', 'address_point', 'query_point', { geometryType: 'point' }),
    node('premise', 'address_record', 'premise'),
    node('building', 'building', 'building', { label: '架空案内棟' }),
    node('entrance', 'entrance', 'entrance', { geometryType: 'point', label: '架空南入口' }),
  ], [
    assertion('a-locates', 'query', 'premise', 'locates', 'direct_source_link', linkedSource),
    assertion('a-building', 'premise', 'building', 'addresses', 'official_crosswalk', linkedSource),
    assertion('a-entrance', 'entrance', 'building', 'accesses', 'direct_source_link', linkedSource, {
      purposes: ['navigation'],
    }),
  ]);

  const display = resolve(testGraph, 'display');
  const navigation = resolve(testGraph, 'navigation');

  assert.equal(display.resolvedLevel, 'building');
  assert.equal(display.capabilities.entrance, false);
  assert.equal(navigation.status, 'unique');
  assert.equal(navigation.resolvedLevel, 'entrance');
  assert.equal(navigation.capabilities.entrance, true);
});

test('separate address roots never form a Franken-address', () => {
  const testGraph = graph([
    node('query', 'address_point', 'query_point', { geometryType: 'point' }),
    node('premise-a', 'address_record', 'premise'),
    node('premise-b', 'address_record', 'premise'),
    node('postal-a', 'postal_feature', 'standard_area', { postalCode: '000-0010' }),
    node('postal-b', 'postal_feature', 'standard_area', { postalCode: '000-0020' }),
    node('building-a', 'building', 'building', { label: '架空甲棟' }),
    node('building-b', 'building', 'building', { label: '架空乙棟' }),
  ], [
    assertion('a-locates-a', 'query', 'premise-a', 'locates', 'direct_source_link', linkedSource),
    assertion('a-locates-b', 'query', 'premise-b', 'locates', 'direct_source_link', linkedSource),
    assertion('a-postal-a', 'premise-a', 'postal-a', 'postal_assigned', 'explicit_assignment', assignmentSource),
    assertion('a-postal-b', 'premise-b', 'postal-b', 'postal_assigned', 'explicit_assignment', assignmentSource),
    assertion('a-building-a', 'premise-a', 'building-a', 'addresses', 'official_crosswalk', linkedSource),
    assertion('a-building-b', 'premise-b', 'building-b', 'addresses', 'official_crosswalk', linkedSource),
  ]);

  const result = resolve(testGraph);

  assert.equal(result.status, 'ambiguous');
  assert.equal(result.candidates.length, 2);
  const pairs = result.candidates.map(candidate => ({
    root: candidate.rootAddressRecordId,
    postal: candidate.components.find(component => component.kind === 'postal_feature')?.postalCode,
    building: candidate.components.find(component => component.kind === 'building')?.label,
  }));
  assert.deepEqual(pairs, [
    { root: 'premise-a', postal: '000-0010', building: '架空甲棟' },
    { root: 'premise-b', postal: '000-0020', building: '架空乙棟' },
  ]);
});

test('nearest address evidence never promotes a premise', () => {
  const testGraph = graph([
    node('query', 'address_point', 'query_point', { geometryType: 'point' }),
    node('inferred-premise', 'address_record', 'premise', { label: 'unsafe inference' }),
    node('postal', 'postal_feature', 'standard_area', { postalCode: '000-0030' }),
  ], [
    assertion('a-spatial', 'query', 'postal', 'postal_contains', 'geometry_contains', geometrySource),
    assertion('a-nearest', 'query', 'inferred-premise', 'locates', 'nearest', geometrySource),
  ]);

  const result = resolve(testGraph);

  assert.equal(result.status, 'partial');
  assert.equal(result.resolvedLevel, 'postal_area');
  assert.equal(result.capabilities.premise, false);
});

test('derived building evidence does not become a displayed building', () => {
  const testGraph = graph([
    node('query', 'address_point', 'query_point', { geometryType: 'point' }),
    node('premise', 'address_record', 'premise', { label: 'synthetic premise' }),
    node('derived-building', 'building', 'building', { label: 'unsafe derived name' }),
  ], [
    assertion('a-locates', 'query', 'premise', 'locates', 'direct_source_link', linkedSource),
    assertion('a-derived-building', 'premise', 'derived-building', 'addresses', 'derived', linkedSource),
  ]);

  const result = resolve(testGraph);

  assert.equal(result.status, 'unique');
  assert.equal(result.resolvedLevel, 'premise');
  assert.equal(result.capabilities.building, false);
});

test('overlapping spatial postal regions remain boundary-ambiguous', () => {
  const testGraph = graph([
    node('query', 'query_point', 'query_point', { geometryType: 'point' }),
    node('postal-a', 'postal_feature', 'standard_area', { postalCode: '000-0040' }),
    node('postal-b', 'postal_feature', 'standard_area', { postalCode: '000-0041' }),
  ], [
    assertion('a-spatial-a', 'query', 'postal-a', 'postal_contains', 'geometry_contains', geometrySource),
    assertion('a-spatial-b', 'query', 'postal-b', 'postal_contains', 'geometry_contains', geometrySource),
  ]);

  const result = resolve(testGraph);

  assert.equal(result.status, 'ambiguous');
  assert.equal(result.selectedCandidateId, undefined);
  assert.equal(result.candidates[0].resolvedLevel, 'postal_area');
  assert.ok(result.ambiguities.includes('boundary_ambiguity'));
});

test('invalid resolution instants fail closed', () => {
  const testGraph = graph([
    node('query', 'query_point', 'query_point', { geometryType: 'point' }),
  ], []);

  const result = resolvePostalContext({
    graph: testGraph,
    startNodeId: 'query',
    purpose: 'display',
    validAt: 'not-a-date',
    knownAt: 'also-not-a-date',
  });

  assert.equal(result.status, 'invalid');
  assert.deepEqual(result.errors, ['invalid-valid-at', 'invalid-known-at']);
});

test('purpose-ineligible evidence is not misreported as a temporal gap', () => {
  const testGraph = graph([
    node('query', 'address_point', 'query_point', { geometryType: 'point' }),
    node('navigation-premise', 'address_record', 'premise'),
  ], [
    assertion(
      'a-navigation-only',
      'query',
      'navigation-premise',
      'locates',
      'direct_source_link',
      linkedSource,
      { purposes: ['navigation'] },
    ),
  ]);

  const result = resolve(testGraph, 'display');

  assert.equal(result.status, 'no_match');
  assert.ok(!result.ambiguities.includes('temporal_gap'));
});
