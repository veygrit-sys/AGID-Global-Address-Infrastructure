import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { test, type TestContext } from 'node:test';
import { planPostalContextHfRelease, parseHfPlanArguments } from './plan-postal-context-hf-release';
import { createChinaPostalContextRuntimeTestPack } from '../src/testFixtures/postalContextChinaRuntimeFixture';
import { POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION } from '../src/lib/postalContextGraph';
import { computePostalContextGraphManifestDigest } from '../src/server/postalContextPackStore';
import { POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION } from '../src/lib/postalContextSpatial';
import { validatePostalContextGeometryTopology } from '../src/lib/postalContextTopology';
import { POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION } from '../src/server/postalContextPackStore';
const digest = (bytes: string | Buffer): `sha256:${string}` => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const json = (value: unknown) => Buffer.from(JSON.stringify(value) + '\n');
const revision = 'a'.repeat(40);

function fixture(t: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), 'agid-hf-plan-test-'));
  t.after(() => {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir())); assert.ok(basename(directory).startsWith('agid-hf-plan-test-'));
    rmSync(directory, { recursive: true, force: true });
  });
  const pack = createChinaPostalContextRuntimeTestPack(), geometry = json(pack.geometry);
  pack.graph.release.artifacts = [{ path: 'geometry.json', mediaType: 'application/vnd.agid.postal-context-geometry+json',
    digest: digest(geometry), byteLength: geometry.length, recordCount: pack.geometry.features.length, licenseRefs: ['AGID-SYNTHETIC-ONLY'] }];
  pack.graph.release.manifestDigest = computePostalContextGraphManifestDigest(pack.graph.release);
  const graph = json(pack.graph), topology = validatePostalContextGeometryTopology(pack.geometry);
  assert.equal(topology.valid, true);
  const descriptor = { schemaVersion: POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION, repositoryId: pack.graph.release.repositoryId,
    countryCode: 'CN', releaseId: pack.graph.release.releaseId, policyVersion: pack.graph.release.policyVersion,
    sequence: 1, previousDescriptorDigest: null, graphManifestDigest: pack.graph.release.manifestDigest,
    createdAt: '2026-08-28T00:00:00.000Z', maturity: 'M2_experimental', synthetic: true,
    promotionEligible: false, containsResidentialAddressPoints: false, artifacts: [
      { role: 'graph', path: 'graph.json', mediaType: 'application/vnd.agid.postal-context-graph+json', schemaVersion: POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,
        digest: digest(graph), byteLength: graph.length, recordCounts: { nodes: pack.graph.nodes.length, assertions: pack.graph.assertions.length } },
      { role: 'geometry', path: 'geometry.json', mediaType: 'application/vnd.agid.postal-context-geometry+json', schemaVersion: POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,
        digest: digest(geometry), byteLength: geometry.length, recordCounts: { features: pack.geometry.features.length, positions: topology.positionCount } },
    ] };
  const descriptorBytes = json(descriptor), descriptorPath = join(directory, 'descriptor.json');
  writeFileSync(descriptorPath, descriptorBytes); writeFileSync(join(directory, 'graph.json'), graph); writeFileSync(join(directory, 'geometry.json'), geometry);
  return { directory, descriptor, options: { descriptorPath, descriptorDigest: digest(descriptorBytes), countryCode: 'CN',
    dataset: 'synthetic-owner/agid-synthetic-cn', revision, allowSynthetic: true, allowExperimental: true } };
}

test('HF offline plan reuses AGID integrity checks and emits three full-commit-pinned files without side effects', t => {
  const f = fixture(t), before = readdirSync(f.directory).map(name => [name, digest(readFileSync(join(f.directory, name)))]);
  const p = planPostalContextHfRelease(f.options);
  assert.equal(p.localPackIntegrityVerified, true); assert.equal(p.files.length, 3);
  assert.ok(p.files.every(file => file.pinnedUrl.includes('/resolve/' + revision + '/')));
  assert.equal(p.totalBytes, p.files.reduce((n, file) => n + file.byteLength, 0));
  assert.deepEqual(readdirSync(f.directory).map(name => [name, digest(readFileSync(join(f.directory, name)))]), before);
  for (const flag of ['countryM2Achieved', 'remoteRevisionVerified', 'remoteArtifactDigestsVerified', 'sourceAndPublicationRightsVerified', 'automaticUploadAllowed', 'paidComputeAllowed', 'automaticRechargeAllowed']) assert.equal(p[flag], false);
  assert.equal(p.additionalSpendBudgetUsd, 0); assert.equal(p.networkRequestsPerformed, 0); assert.equal(p.uploadedBytes, 0);
});

test('HF planner rejects branches, tags, conversion refs and shortened commits', t => {
  const f = fixture(t);
  for (const value of ['main', 'v1', 'refs/convert/parquet', '~parquet', 'a'.repeat(7), 'a'.repeat(39), 'A'.repeat(40)]) {
    assert.throws(() => planPostalContextHfRelease({ ...f.options, revision: value }), /full-commit-required/);
  }
});

test('HF planner rejects unsafe repository IDs and wrong country identities', t => {
  const f = fixture(t);
  for (const dataset of ['https://huggingface.co/owner/repo', '../repo', 'owner/repo/extra', 'owner/repo?token=x', 'owner/repo.git', 'owner/repo..x', 'owner/a--b']) {
    assert.throws(() => planPostalContextHfRelease({ ...f.options, dataset }), /dataset-id-invalid/);
  }
  assert.throws(() => planPostalContextHfRelease({ ...f.options, countryCode: 'HK' }), /descriptor-country-mismatch/);
});

test('HF synthetic/experimental opt-ins never become publication or country-M2 authorization', t => {
  const f = fixture(t);
  assert.throws(() => planPostalContextHfRelease({ ...f.options, allowSynthetic: false }), /synthetic-pack-not-enabled/);
  assert.throws(() => planPostalContextHfRelease({ ...f.options, allowExperimental: false }), /experimental-pack-not-enabled/);
  assert.equal(planPostalContextHfRelease(f.options).synthetic, true);
});

test('HF planner refuses tampered descriptor or graph bytes through the unchanged AGID loader', t => {
  const f = fixture(t);
  assert.throws(() => planPostalContextHfRelease({ ...f.options, descriptorDigest: 'sha256:' + '0'.repeat(64) }), /descriptor-digest-mismatch/);
  writeFileSync(join(f.directory, 'graph.json'), 'tampered');
  assert.throws(() => planPostalContextHfRelease(f.options), /artifact-byte-length-mismatch/);
});

test('HF CLI accepts only an offline plan; no token, upload, job or paid-hardware flag exists', () => {
  const args = ['--descriptor', 'descriptor.json', '--digest', 'sha256:' + '0'.repeat(64), '--country', 'CN', '--dataset', 'owner/repo', '--revision', revision];
  assert.equal(parseHfPlanArguments(args).allowSynthetic, false);
  for (const extra of [['--upload'], ['--token', 'SENSITIVE'], ['--flavor', 'a10g-small'], ['--revision', revision], ['--allow-synthetic', '--allow-synthetic']]) {
    assert.throws(() => parseHfPlanArguments([...args, ...extra]), /hf-/);
  }
  assert.throws(() => parseHfPlanArguments(args.slice(0, -2)), /required-option-missing/);
});

test('HF plan refuses residential-address-point packs without uploading or approving them', t => {
  const f = fixture(t);
  const bytes = json({ ...f.descriptor, containsResidentialAddressPoints: true });
  writeFileSync(f.options.descriptorPath, bytes);
  assert.throws(() => planPostalContextHfRelease({ ...f.options, descriptorDigest: digest(bytes) }), /public-pack-residential-address-points-forbidden/);
});

test('HF plan refuses unsafe descriptor filenames after validating the pack bytes', t => {
  const f = fixture(t);
  const unsafePath = join(f.directory, 'descriptor unsafe.json');
  writeFileSync(unsafePath, readFileSync(f.options.descriptorPath));
  assert.throws(() => planPostalContextHfRelease({ ...f.options, descriptorPath: unsafePath }), /hf-descriptor-filename-invalid/);
});
