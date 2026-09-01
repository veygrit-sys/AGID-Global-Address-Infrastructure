import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import jsts from 'jsts';

const root = resolve('data/postal_country_packs/mx/postal-context');
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
const digest = (path: string) => `sha256:${createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')}`;

test('MX pins all 32 official SEPOMEX state resources and excludes raw source bodies', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  assert.equal(manifest.repository.country_code, 'MX');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(profile.dataset.dataset_id, 'd0074e50-d661-44d4-a1a3-73a89e671e1f');
  assert.equal(profile.dataset.license_id, 'CC-BY-4.0');
  assert.equal(profile.resources.length, 32);
  assert.equal(new Set(profile.resources.map((item: any) => item.resource_id)).size, 32);
  assert.equal(profile.resources.every((item: any) => /^CP_.+\.zip$/u.test(item.state_file) && /^[a-f0-9]{64}$/u.test(item.sha256) && item.byte_length > 0), true);
  assert.deepEqual(profile.receipt_summary, { exact_bodies: 33, exact_bytes: 129105086, all_sha256_bound: true, raw_source_bodies_in_git: 0 });
});

test('MX descriptor pins a complete non-synthetic national graph and derived display geometry', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');
  assert.equal(descriptor.countryCode, 'MX');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.length, 35_899);
  assert.equal(graph.assertions.length, 35_898);
  assert.equal(graph.nodes.filter((node: any) => node.kind === 'postal_feature').length, 35_898);
  assert.equal(new Set(graph.nodes.filter((node: any) => node.postalCode).map((node: any) => node.postalCode)).size, 35_898);
  assert.equal(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel', 'organization', 'person', 'recipient'].includes(node.kind)), true);
  assert.equal(geometry.features.length, 35_898);
  assert.equal(geometry.features.every((feature: any) => feature.source.sourceType === 'derived'), true);
  assert.equal(geometry.features.every((feature: any) => feature.source.assignmentAuthority === 'official_postal_mapping_authority'), true);
  assert.equal(geometry.features.every((feature: any) => feature.source.geometryAuthority === 'official_postal_geometry'), true);
  assert.equal(geometry.features.every((feature: any) => feature.quality.status === 'derived' && feature.quality.confidence === 0.92 && feature.quality.accuracyMeters === 250), true);
});

test('all MX display geometries are valid Polygon or MultiPolygon surfaces', { timeout: 300_000 }, () => {
  const geometry = readJson('m2/geometry.json');
  const reader = new jsts.io.GeoJSONReader();
  for (const feature of geometry.features) {
    assert.ok(['Polygon', 'MultiPolygon'].includes(feature.geometry.type), feature.id);
    assert.equal(new jsts.operation.valid.IsValidOp(reader.read(feature.geometry)).isValid(), true, feature.id);
  }
});

test('MX source notice documents simplification, fallback and authority separation', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /35,898/u);
  assert.match(notice, /32 state/u);
  assert.match(notice, /100 m/u);
  assert.match(notice, /0\.0012/u);
  assert.match(notice, /250 m/u);
  assert.match(notice, /228/u);
  assert.match(notice, /derived/i);
  assert.match(notice, /Raw source ZIPs.*excluded from Git/is);
});
