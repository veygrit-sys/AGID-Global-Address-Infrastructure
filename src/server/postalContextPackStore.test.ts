import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';

import { POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION } from '../lib/postalContextGraph';
import {
  POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,
} from '../lib/postalContextSpatial';
import { validatePostalContextGeometryTopology } from '../lib/postalContextTopology';
import { createPostalContextRuntimeTestPack } from '../testFixtures/postalContextRuntimeFixture';
import {
  POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION,
  PostalContextPackLoadError,
  computePostalContextGraphManifestDigest,
  createConfiguredPostalContextPackStore,
  loadPostalContextPack,
  type PostalContextPackDescriptor,
} from './postalContextPackStore';

const GRAPH_FILE = 'graph.json';
const GEOMETRY_FILE = 'geometry.json';
const DESCRIPTOR_FILE = 'descriptor.json';
const GRAPH_MEDIA_TYPE = 'application/vnd.agid.postal-context-graph+json';
const GEOMETRY_MEDIA_TYPE = 'application/vnd.agid.postal-context-geometry+json';
const WRONG_DIGEST = `sha256:${'0'.repeat(64)}`;

type Digest = `sha256:${string}`;

type MaterializedPack = {
  directory: string;
  descriptorPath: string;
  descriptorDigest: string;
  descriptor: PostalContextPackDescriptor;
  graphPath: string;
  geometryPath: string;
};

function sha256(bytes: Uint8Array | string): Digest {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function jsonBytes(value: unknown) {
  return Buffer.from(`${JSON.stringify(value)}\n`, 'utf8');
}

function writeDescriptor(
  pack: MaterializedPack,
  descriptor: PostalContextPackDescriptor,
) {
  const bytes = jsonBytes(descriptor);
  writeFileSync(pack.descriptorPath, bytes);
  pack.descriptor = descriptor;
  pack.descriptorDigest = sha256(bytes);
}

function materializeRuntimeFixture(t: TestContext): MaterializedPack {
  const directory = mkdtempSync(join(tmpdir(), 'agid-postal-context-pack-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const graphPath = join(directory, GRAPH_FILE);
  const geometryPath = join(directory, GEOMETRY_FILE);
  const descriptorPath = join(directory, DESCRIPTOR_FILE);
  const pack = structuredClone(createPostalContextRuntimeTestPack());

  const geometryBytes = jsonBytes(pack.geometry);
  const geometryDigest = sha256(geometryBytes);
  writeFileSync(geometryPath, geometryBytes);

  pack.graph.release.artifacts = [{
    path: GEOMETRY_FILE,
    mediaType: GEOMETRY_MEDIA_TYPE,
    digest: geometryDigest,
    byteLength: geometryBytes.byteLength,
    recordCount: pack.geometry.features.length,
    licenseRefs: ['AGID-SYNTHETIC-ONLY'],
  }];
  pack.graph.release.manifestDigest = computePostalContextGraphManifestDigest(
    pack.graph.release,
  ) as Digest;
  const graphBytes = jsonBytes(pack.graph);
  writeFileSync(graphPath, graphBytes);

  const topology = validatePostalContextGeometryTopology(pack.geometry);
  assert.equal(topology.valid, true, topology.errors.join('\n'));
  const descriptor: PostalContextPackDescriptor = {
    schemaVersion: POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION,
    repositoryId: pack.graph.release.repositoryId,
    countryCode: pack.graph.release.countryCode,
    releaseId: pack.graph.release.releaseId,
    policyVersion: pack.graph.release.policyVersion,
    sequence: 1,
    previousDescriptorDigest: null,
    graphManifestDigest: pack.graph.release.manifestDigest,
    createdAt: '2026-01-02T00:00:00.000Z',
    maturity: 'M2_experimental',
    synthetic: true,
    promotionEligible: false,
    containsResidentialAddressPoints: false,
    artifacts: [
      {
        role: 'graph',
        path: GRAPH_FILE,
        mediaType: GRAPH_MEDIA_TYPE,
        schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
        byteLength: graphBytes.byteLength,
        digest: sha256(graphBytes),
        recordCounts: {
          nodes: pack.graph.nodes.length,
          assertions: pack.graph.assertions.length,
        },
      },
      {
        role: 'geometry',
        path: GEOMETRY_FILE,
        mediaType: GEOMETRY_MEDIA_TYPE,
        schemaVersion: POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,
        byteLength: geometryBytes.byteLength,
        digest: geometryDigest,
        recordCounts: {
          features: pack.geometry.features.length,
          positions: topology.positionCount,
        },
      },
    ],
  };
  const materialized: MaterializedPack = {
    directory,
    descriptorPath,
    descriptorDigest: '',
    descriptor,
    graphPath,
    geometryPath,
  };
  writeDescriptor(materialized, descriptor);
  return materialized;
}

function assertLoadError(callback: () => unknown, expectedCode: string) {
  assert.throws(callback, error => {
    assert.ok(error instanceof PostalContextPackLoadError);
    assert.equal(error.code, expectedCode);
    return true;
  });
}

const LOAD_OPTIONS = {
  expectedCountryCode: 'JP',
  allowExperimental: true,
  allowSynthetic: true,
} as const;

test('loads a fixture-derived pack whose descriptor, artifacts, and manifest are digest-pinned', t => {
  const fixture = materializeRuntimeFixture(t);
  const loaded = loadPostalContextPack(
    fixture.descriptorPath,
    fixture.descriptorDigest,
    LOAD_OPTIONS,
  );

  assert.equal(loaded.descriptorDigest, fixture.descriptorDigest);
  assert.equal(loaded.descriptor.graphManifestDigest, loaded.runtime.release().manifestDigest);
  assert.deepEqual(loaded.runtime.status().counts, {
    nodes: 8,
    assertions: 8,
    geometries: 3,
    postalCodes: 1,
    excludedByQualityOrPublication: 0,
  });
  assert.deepEqual(loaded.runtime.status().attestation, {
    descriptorDigest: fixture.descriptorDigest,
    sequence: 1,
    maturity: 'M2_experimental',
    synthetic: true,
    promotionEligible: false,
    servingMode: 'experimental',
    integrity: 'externally_pinned',
  });
});

test('rejects an external descriptor digest mismatch before trusting descriptor contents', t => {
  const fixture = materializeRuntimeFixture(t);

  assertLoadError(
    () => loadPostalContextPack(fixture.descriptorPath, WRONG_DIGEST, LOAD_OPTIONS),
    'descriptor-digest-mismatch',
  );
});

test('rejects same-length artifact tampering against the descriptor digest', t => {
  const fixture = materializeRuntimeFixture(t);
  const original = readFileSync(fixture.geometryPath, 'utf8');
  const tampered = original.replace('"countryCode":"JP"', '"countryCode":"US"');
  assert.notEqual(tampered, original);
  assert.equal(Buffer.byteLength(tampered), Buffer.byteLength(original));
  writeFileSync(fixture.geometryPath, tampered);

  assertLoadError(
    () => loadPostalContextPack(
      fixture.descriptorPath,
      fixture.descriptorDigest,
      LOAD_OPTIONS,
    ),
    'artifact-digest-mismatch',
  );
});

test('rejects unsafe artifact paths even when the rewritten descriptor digest is pinned', t => {
  const fixture = materializeRuntimeFixture(t);
  const descriptor = structuredClone(fixture.descriptor);
  const graphArtifact = descriptor.artifacts.find(artifact => artifact.role === 'graph');
  assert.ok(graphArtifact);
  graphArtifact.path = '../graph.json';
  writeDescriptor(fixture, descriptor);

  assertLoadError(
    () => loadPostalContextPack(
      fixture.descriptorPath,
      fixture.descriptorDigest,
      LOAD_OPTIONS,
    ),
    'unsafe-artifact-path',
  );
});

test('rejects duplicate JSON keys even when the raw descriptor bytes are correctly pinned', t => {
  const fixture = materializeRuntimeFixture(t);
  const original = readFileSync(fixture.descriptorPath, 'utf8');
  const schemaField = `"schemaVersion":"${POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION}"`;
  const duplicate = original.replace(schemaField, `${schemaField},${schemaField}`);
  assert.notEqual(duplicate, original);
  writeFileSync(fixture.descriptorPath, duplicate);

  assertLoadError(
    () => loadPostalContextPack(
      fixture.descriptorPath,
      sha256(duplicate),
      LOAD_OPTIONS,
    ),
    'pack-duplicate-json-key',
  );
});

test('serves only a verified LKG and fails closed when both active and LKG pins fail', t => {
  const fixture = materializeRuntimeFixture(t);
  const commonEnvironment = {
    AGID_POSTAL_CONTEXT_JP_DESCRIPTOR_PATH: fixture.descriptorPath,
    AGID_POSTAL_CONTEXT_JP_DESCRIPTOR_DIGEST: WRONG_DIGEST,
    AGID_POSTAL_CONTEXT_JP_LKG_DESCRIPTOR_PATH: fixture.descriptorPath,
    AGID_POSTAL_CONTEXT_ALLOW_EXPERIMENTAL: '1',
    AGID_POSTAL_CONTEXT_ALLOW_SYNTHETIC: '1',
  } satisfies NodeJS.ProcessEnv;

  const degraded = createConfiguredPostalContextPackStore({
    ...commonEnvironment,
    AGID_POSTAL_CONTEXT_JP_LKG_DESCRIPTOR_DIGEST: fixture.descriptorDigest,
  });
  assert.equal(degraded.countryStatus('JP').state, 'degraded_lkg');
  assert.ok(degraded.getRuntime('JP'));
  assert.ok(degraded.countryStatus('JP').warnings.includes(
    'active-pack-unavailable-serving-verified-lkg',
  ));

  const failedClosed = createConfiguredPostalContextPackStore({
    ...commonEnvironment,
    AGID_POSTAL_CONTEXT_JP_LKG_DESCRIPTOR_DIGEST: WRONG_DIGEST,
  });
  assert.equal(failedClosed.countryStatus('JP').state, 'invalid');
  assert.equal(failedClosed.getRuntime('JP'), undefined);
  assert.deepEqual(failedClosed.countryStatus('JP').errors, [
    'active:descriptor-digest-mismatch',
    'lkg:descriptor-digest-mismatch',
  ]);
});

test('committed real research packs are explicit opt-in and preserve rollout status', () => {
  const disabled = createConfiguredPostalContextPackStore({});
  assert.equal(disabled.countryStatus('PR').state, 'unconfigured');
  assert.equal(disabled.getRuntime('PR'), undefined);

  const enabled = createConfiguredPostalContextPackStore({
    AGID_POSTAL_CONTEXT_ENABLE_COMMITTED_RESEARCH_PACKS: '1',
    AGID_POSTAL_CONTEXT_ALLOW_EXPERIMENTAL: '1',
  });
  const puertoRico = enabled.countryStatus('PR');
  assert.equal(puertoRico.state, 'ready');
  assert.equal(puertoRico.runtime?.counts.geometries, 132);
  assert.ok(puertoRico.warnings.includes('committed-research-pack-opt-in'));
  assert.ok(puertoRico.warnings.includes('research-rollout-status:blocked'));
  assert.equal(
    enabled.statuses().filter(status => status.state === 'ready').length,
    19,
  );
});

test('committed research opt-in does not bypass experimental or explicit configuration gates', () => {
  const experimentalDenied = createConfiguredPostalContextPackStore({
    AGID_POSTAL_CONTEXT_ENABLE_COMMITTED_RESEARCH_PACKS: '1',
  });
  assert.equal(experimentalDenied.countryStatus('PR').state, 'invalid');
  assert.ok(experimentalDenied.countryStatus('PR').errors.includes(
    'active:experimental-pack-not-enabled',
  ));

  const incompleteExplicit = createConfiguredPostalContextPackStore({
    AGID_POSTAL_CONTEXT_ENABLE_COMMITTED_RESEARCH_PACKS: '1',
    AGID_POSTAL_CONTEXT_ALLOW_EXPERIMENTAL: '1',
    AGID_POSTAL_CONTEXT_PR_DESCRIPTOR_PATH: 'operator-explicit-path.json',
  });
  assert.equal(incompleteExplicit.countryStatus('PR').state, 'invalid');
  assert.deepEqual(incompleteExplicit.countryStatus('PR').errors, [
    'active-pack-configuration-incomplete',
  ]);
});

test('binds synthetic provenance to experimental non-promotable descriptors', t => {
  const liedFixture = materializeRuntimeFixture(t);
  const liedDescriptor = structuredClone(liedFixture.descriptor);
  liedDescriptor.synthetic = false;
  liedDescriptor.maturity = 'M4_stable';
  liedDescriptor.promotionEligible = true;
  writeDescriptor(liedFixture, liedDescriptor);

  assertLoadError(
    () => loadPostalContextPack(
      liedFixture.descriptorPath,
      liedFixture.descriptorDigest,
      { expectedCountryCode: 'JP' },
    ),
    'descriptor-synthetic-provenance-mismatch',
  );

  const selfReportedFixture = materializeRuntimeFixture(t);
  const selfReportedDescriptor = structuredClone(selfReportedFixture.descriptor);
  selfReportedDescriptor.maturity = 'M4_stable';
  selfReportedDescriptor.promotionEligible = true;
  writeDescriptor(selfReportedFixture, selfReportedDescriptor);

  assertLoadError(
    () => loadPostalContextPack(
      selfReportedFixture.descriptorPath,
      selfReportedFixture.descriptorDigest,
      {
        expectedCountryCode: 'JP',
        allowExperimental: true,
        allowSynthetic: true,
      },
    ),
    'synthetic-promotion-policy-invalid',
  );
});
