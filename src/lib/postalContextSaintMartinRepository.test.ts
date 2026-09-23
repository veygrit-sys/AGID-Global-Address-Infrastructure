import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve('data/postal_country_packs/mf/postal-context');
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8')) as any;
const digest = (path: string) => 'sha256:' + createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');

test('MF keeps official assignment separate from derived administrative display geometry', () => {
  const manifest = readJson('repository-manifest.json');
  const profile = readJson('source-profile.json');
  const assignment = profile.sources.find((item: any) => item.source_id === 'laposte-hexasmal-20260808-mf-97801');
  const geometry = profile.sources.find((item: any) => item.source_id === 'geo-api-gouv-fr-commune-97801-20260901');
  assert.equal(manifest.repository.country_code, 'MF');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.equal(manifest.release_scope.contains_production_geometry, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.promotion.current_stage, 'M2_current_laposte_single_postcode_derived_collectivity_visualization');
  assert.match(manifest.postal_system.assignment_rule, /exactly one 978-prefix.*exactly one 97150/i);
  assert.match(manifest.postal_system.geometry_rule, /postal-code contours are not supplied.*derived display geometry/i);
  assert.equal(assignment.assignment_authority, 'official_postal_dictionary');
  assert.equal(assignment.geometry_authority, 'none');
  assert.equal(assignment.bundled_here, false);
  assert.equal(geometry.assignment_authority, 'derived_spatial_assignment');
  assert.equal(geometry.geometry_authority, 'derived_geometry');
  assert.equal(geometry.bundled_here, true);
  assert.match(geometry.attribution, /geo\.api\.gouv\.fr.*Open Licence 2\.0/i);
  assert.deepEqual(profile.receipt_summary, { exact_bodies: 7, exact_bytes: 1844285, all_sha256_bound: true, raw_source_bodies_in_git: 0 });
});

test('MF descriptor pins real graph and geometry without address or building leakage', () => {
  const descriptor = readJson('m2/descriptor.json');
  const graph = readJson('m2/graph.json');
  const geometry = readJson('m2/geometry.json');
  const graphArtifact = descriptor.artifacts.find((item: any) => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find((item: any) => item.role === 'geometry');
  assert.equal(descriptor.countryCode, 'MF');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.equal(graphArtifact.digest, digest('m2/graph.json'));
  assert.equal(geometryArtifact.digest, digest('m2/geometry.json'));
  assert.equal(graph.nodes.find((node: any) => node.kind === 'postal_feature').postalCode, '97150');
  assert.ok(graph.nodes.every((node: any) => !['address', 'building', 'premise', 'land_parcel', 'organization'].includes(node.kind)));
  assert.equal(graph.assertions[0].source.assignmentAuthority, 'official_postal_dictionary');
  assert.equal(graph.assertions[0].source.geometryAuthority, 'none');
  assert.equal(geometry.features.length, 1);
  assert.equal(geometry.features[0].geometry.type, 'MultiPolygon');
  assert.equal(geometry.features[0].source.sourceType, 'derived');
  assert.equal(geometry.features[0].source.geometryAuthority, 'derived_geometry');
  assert.equal(geometry.features[0].quality.status, 'derived');
  assert.equal(geometry.features[0].quality.confidence, 0.97);
});

test('MF source notice pins all exact evidence and discloses the area-method difference', () => {
  const notice = readFileSync(resolve(root, 'M2-SOURCE-NOTICE.md'), 'utf8');
  assert.match(notice, /f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22/u);
  assert.match(notice, /a9bb4fe9659f892b9e4261de5a7f397302f7b221a8eab0f9fd523303b995c483/u);
  assert.match(notice, /63c17509fd85d75e220878e17157d5361af4beed91b035d8308c2db5c841c26f/u);
  assert.match(notice, /derived collectivity display surface/i);
  assert.match(notice, /53\.649431807733244 km².*53\.7696 km²/su);
  assert.match(notice, /Raw evidence is deliberately excluded from Git/i);
});
