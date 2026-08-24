import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
  isPostalContextAssertionEffectiveAt,
  postalContextCapabilitiesForNodes,
  postalContextResolutionLevelForNodes,
  validatePostalContextGraph,
  validatePostalContextReleaseManifest,
  type PostalContextAssertion,
  type PostalContextGraph,
  type PostalContextRepositoryReleaseManifest,
} from './postalContextGraph';

const DIGEST = `sha256:${'b'.repeat(64)}` as const;

function release(
  overrides: Partial<PostalContextRepositoryReleaseManifest> = {},
): PostalContextRepositoryReleaseManifest {
  return {
    schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
    repositoryId: 'agid-postal-jp',
    repositoryUrl: 'https://example.invalid/agid-postal-jp',
    countryCode: 'JP',
    releaseId: 'jp-synthetic-v1',
    policyVersion: 'jp-display-v0.1',
    releasedAt: '2026-01-02T00:00:00.000Z',
    validTime: { from: '2026-01-01T00:00:00.000Z', to: null },
    manifestDigest: DIGEST,
    artifacts: [{
      path: 'context/postal.fgb',
      downloadUrl: 'https://example.invalid/releases/postal.fgb',
      mediaType: 'application/flatgeobuf',
      digest: DIGEST,
      byteLength: 128,
      recordCount: 2,
      licenseRefs: ['AGID-SYNTHETIC-ONLY'],
    }],
    ...overrides,
  };
}

test('release manifest accepts immutable digest-pinned artifact metadata', () => {
  const result = validatePostalContextReleaseManifest(release());

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('release manifest rejects unsafe paths, mutable transport, and incomplete policy metadata', () => {
  const manifest = release({
    repositoryUrl: 'http://example.invalid/repo',
    policyVersion: '',
    artifacts: [{
      path: '../outside.geojson',
      downloadUrl: 'http://example.invalid/latest.geojson',
      mediaType: 'application/geo+json',
      digest: 'sha256:not-a-digest',
      byteLength: -1,
      licenseRefs: [''],
    }],
  });
  const result = validatePostalContextReleaseManifest(manifest);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('invalid-repository-url'));
  assert.ok(result.errors.includes('policyVersion-required'));
  assert.ok(result.errors.includes('invalid-artifact-path:../outside.geojson'));
  assert.ok(result.errors.includes('invalid-artifact-url:../outside.geojson'));
  assert.ok(result.errors.includes('invalid-artifact-digest:../outside.geojson'));
  assert.ok(result.errors.includes('invalid-artifact-byte-length:../outside.geojson'));
  assert.ok(result.errors.includes('invalid-artifact-license-ref:../outside.geojson'));
});

test('postal assignment authority and geometry authority are independently required', () => {
  const common = {
    validTime: { from: '2026-01-01T00:00:00.000Z' },
    knownTime: { from: '2026-01-01T00:00:00.000Z' },
    quality: { status: 'verified' as const },
  };
  const graph: PostalContextGraph = {
    schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
    release: release(),
    nodes: [
      {
        id: 'query',
        kind: 'query_point',
        featureKind: 'query_point',
        geometryType: 'point',
        countryCode: 'JP',
      },
      {
        id: 'postal',
        kind: 'postal_feature',
        featureKind: 'standard_area',
        geometryType: 'polygon',
        countryCode: 'JP',
        postalCode: '000-0099',
      },
    ],
    assertions: [
      {
        id: 'bad-assignment',
        fromNodeId: 'query',
        toNodeId: 'postal',
        relation: 'postal_assigned',
        method: 'explicit_assignment',
        source: {
          sourceId: 'synthetic',
          sourceType: 'synthetic',
          assignmentAuthority: 'none',
          geometryAuthority: 'synthetic_fixture_geometry',
        },
        ...common,
      },
      {
        id: 'bad-geometry',
        fromNodeId: 'query',
        toNodeId: 'postal',
        relation: 'postal_contains',
        method: 'geometry_contains',
        source: {
          sourceId: 'synthetic',
          sourceType: 'synthetic',
          assignmentAuthority: 'synthetic_fixture_assignment',
          geometryAuthority: 'none',
        },
        ...common,
      },
    ],
  };
  const result = validatePostalContextGraph(graph);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('postal-assignment-authority-required:bad-assignment'));
  assert.ok(result.errors.includes('postal-geometry-authority-required:bad-geometry'));
});

test('assertions use independent valid and known half-open time ranges', () => {
  const assertion: PostalContextAssertion = {
    id: 'bitemporal',
    fromNodeId: 'address',
    toNodeId: 'postal',
    relation: 'postal_assigned',
    method: 'explicit_assignment',
    validTime: {
      from: '2024-01-01T00:00:00.000Z',
      to: '2025-01-01T00:00:00.000Z',
    },
    knownTime: {
      from: '2026-01-01T00:00:00.000Z',
      to: '2027-01-01T00:00:00.000Z',
    },
    source: {
      sourceId: 'synthetic',
      sourceType: 'synthetic',
      assignmentAuthority: 'synthetic_fixture_assignment',
      geometryAuthority: 'none',
    },
    quality: { status: 'verified' },
  };

  assert.equal(isPostalContextAssertionEffectiveAt(
    assertion,
    '2024-06-01T00:00:00.000Z',
    '2026-06-01T00:00:00.000Z',
  ), true);
  assert.equal(isPostalContextAssertionEffectiveAt(
    assertion,
    '2025-01-01T00:00:00.000Z',
    '2026-06-01T00:00:00.000Z',
  ), false);
  assert.equal(isPostalContextAssertionEffectiveAt(
    assertion,
    '2024-06-01T00:00:00.000Z',
    '2027-01-01T00:00:00.000Z',
  ), false);
});

test('capability vectors keep resolution and public safety separate', () => {
  const nodes = [
    { kind: 'administrative_area' as const, featureKind: 'country' as const },
    { kind: 'postal_feature' as const, featureKind: 'standard_area' as const },
    { kind: 'address_record' as const, featureKind: 'premise' as const },
    { kind: 'building' as const, featureKind: 'building' as const },
    { kind: 'unit' as const, featureKind: 'premise' as const, visibility: 'private' as const },
  ];
  const capabilities = postalContextCapabilitiesForNodes(nodes);

  assert.equal(postalContextResolutionLevelForNodes(nodes), 'unit');
  assert.equal(capabilities.building, true);
  assert.equal(capabilities.unit, true);
  assert.equal(capabilities.publicSafe, false);
});

test('release manifest rejects drive-qualified artifact paths', () => {
  const baseArtifact = release().artifacts[0];
  const result = validatePostalContextReleaseManifest(release({
    artifacts: [{
      ...baseArtifact,
      path: 'C:/outside/context.fgb',
    }],
  }));

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('invalid-artifact-path:C:/outside/context.fgb'));
});

test('postal assertions must target PostalFeature nodes', () => {
  const graph: PostalContextGraph = {
    schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
    release: release(),
    nodes: [
      {
        id: 'query',
        kind: 'query_point',
        featureKind: 'query_point',
        geometryType: 'point',
        countryCode: 'JP',
      },
      {
        id: 'building',
        kind: 'building',
        featureKind: 'building',
        geometryType: 'polygon',
        countryCode: 'JP',
      },
    ],
    assertions: [
      {
        id: 'bad-postal-target',
        fromNodeId: 'query',
        toNodeId: 'building',
        relation: 'postal_contains',
        method: 'geometry_contains',
        validTime: { from: '2026-01-01T00:00:00.000Z' },
        knownTime: { from: '2026-01-01T00:00:00.000Z' },
        source: {
          sourceId: 'synthetic',
          sourceType: 'synthetic',
          assignmentAuthority: 'none',
          geometryAuthority: 'synthetic_fixture_geometry',
          digest: DIGEST,
        },
        quality: { status: 'verified' },
      },
    ],
  };

  const result = validatePostalContextGraph(graph);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes(
    'postal-target-not-postal-feature:bad-postal-target',
  ));
});
